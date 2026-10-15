#!/usr/bin/env node
/**
 * Accessibility check: axe-core on every gallery page, and on the overlays that open from them, from a build,
 * in light and dark, desktop and phone.
 *
 *   npm run build && npm run test:a11y               # every page and every overlay in dist/
 *   node scripts/a11y.mjs --dist dist --pages button,menu
 *   node scripts/a11y.mjs --no-overlays              # the per-page scans only
 *
 * Runs the WCAG 2.0, 2.1 and 2.2 A and AA rules and exits 1 on any violation, printing each one with
 * its page, theme, viewport and the selectors it hit. Pages come from src/gallery/pages (the file is
 * <NN>-<id>.tsx, and the id is the route).
 *
 * Two kinds of scan. First each page as loaded. Then, on that same load, each overlay that page opens, because
 * an overlay that opens on a click is not in the page as loaded. The OVERLAYS table below lists them: a Dialog
 * (a bottom sheet on the phone), a Menu with its submenu, the Command menu (Ctrl+K, or a tap on Search on the
 * phone), a Popover (a sheet on the phone), a Tooltip (hover; a press and hold on the phone) and the Toasts.
 * Each one is opened the way a person would, from role and name selectors, given 600ms for its entrance to
 * settle, scanned as the whole document, and then closed with Esc (a toast: F8 to reach it, then Esc) before
 * the next. Adding one is one entry in the table: { page, name, viewports, open }, and open returns the locator
 * of the overlay it opened.
 *
 * A step that cannot be done FAILS the run, and the report names it: a trigger that is missing or renamed, an
 * overlay that does not open, one that will not close on Esc. Nothing is skipped quietly. --pages limits both
 * kinds of scan to those pages, and --no-overlays skips the overlays.
 *
 * Needs Playwright and axe-core, which are not dependencies of the gallery (Vercel never installs
 * them). It looks for them in A11Y_TOOLS (a folder with its own node_modules, as CI sets up), then
 * here, then in the global Playwright of Claude's cloud container.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const dist = path.resolve(get("dist", "dist"));
const only = (get("pages", "") || "").split(",").filter(Boolean);
const withOverlays = !args.includes("--no-overlays");
const started = Date.now();

/* Resolve a tool from A11Y_TOOLS, then this package, then a global folder. */
const roots = [process.env.A11Y_TOOLS, path.join(here, ".."), "/opt/node22/lib"].filter(Boolean);
function resolveTool(id) {
  for (const root of roots) {
    try { return createRequire(path.join(root, "noop.js")).resolve(id); } catch { /* next root */ }
  }
  throw new Error(`${id} not found. Install it next to the gallery (npm i --no-save ${id}) or point A11Y_TOOLS at a folder that has it.`);
}
const { chromium } = createRequire(import.meta.url)(resolveTool("playwright"));
const axeSource = fs.readFileSync(resolveTool("axe-core/axe.min.js"), "utf8");

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error(`No build at ${path.relative(process.cwd(), dist) || "."}. Run npm run build first.`);
  process.exit(1);
}

const allPages = fs.readdirSync(path.join(here, "../src/gallery/pages"))
  .map((f) => /^\d+-(.+)\.tsx$/.exec(f)?.[1])
  .filter(Boolean);
const pages = allPages.filter((id) => !only.length || only.includes(id));
if (!pages.length) { console.error("No pages matched."); process.exit(1); }

/* ---------------------------------------------------------------- overlays */

/* A button by its exact name. Several demos can share a name (a page often has a phone copy of its first demo),
   so the entries below say .first() where the first one on the page is the one they mean. */
const button = (pg, name) => pg.getByRole("button", typeof name === "string" ? { name, exact: true } : { name });
const BOTH = ["desktop", "phone"];

/* Closing toasts: a toast never takes focus, so F8 moves it to the newest one. Esc dismisses the toast that has
   focus and moves on to the next, so this goes on until none is left. */
async function dismissToasts(pg) {
  await pg.keyboard.press("F8");
  for (let i = 0; i < 4 && (await pg.locator("[data-toast-id]").count()); i++) {
    await pg.keyboard.press("Escape");
    await pg.waitForTimeout(150);
  }
  await pg.locator("[data-toast-id]").first().waitFor({ state: "hidden" }); // none left, and the last has finished leaving
}

/*
 * Every overlay the check opens. One entry each:
 *   page       the page id (the route, as in src/gallery/pages/<NN>-<id>.tsx)
 *   name       what the report calls it
 *   viewports  "desktop" (1440, a mouse), "phone" (390, a touch screen), or both
 *   open       async (page, person) => Locator. Do what a person does to open it, and return the locator of the
 *              overlay. person.phone says which viewport this is. person.press(locator) clicks on desktop and
 *              taps on the phone; person.rest(locator) hovers on desktop and presses and holds on the phone.
 *   close      optional, async (page). Esc by default. Afterwards the overlay must be gone, and so must any dialog,
 *              menu or tooltip, or the run fails.
 */
const OVERLAYS = [
  /* ---- Tooltip: a hover on desktop, a press and hold on the phone */
  {
    page: "tooltip", name: "Tooltip on a toolbar button", viewports: BOTH,
    open: async (pg, person) => {
      await person.rest(button(pg, "Copy link").first());
      return pg.getByRole("tooltip");
    },
  },
  {
    page: "tooltip", name: "Tooltip on the info icon (long text)", viewports: BOTH,
    open: async (pg, person) => {
      await person.rest(button(pg, "Production status"));
      return pg.getByRole("tooltip");
    },
  },

  /* ---- Popover: a floating panel on desktop, a bottom sheet on the phone */
  {
    page: "popover", name: "Popover: share link", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "Share"));
      return pg.getByRole("dialog", { name: "Share a preview link" });
    },
  },
  {
    page: "popover", name: "Popover: filters (checkbox rows)", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "Filters").first());
      return pg.getByRole("dialog", { name: "Filter projects" });
    },
  },
  {
    page: "popover", name: "Popover: due date form (opens upward)", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, /^Due /));
      return pg.getByRole("dialog", { name: "Due date and status" });
    },
  },
  {
    page: "popover", name: "Popover: picker inside a popover (solid)", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "Access"));
      const outer = pg.getByRole("dialog", { name: "Preview access" });
      await outer.waitFor();
      await person.press(outer.getByRole("button", { name: /^Anyone with the link/ }));
      return pg.getByRole("dialog", { name: "Who can view" });
    },
    close: async (pg) => { // the first Esc closes only the picker, the second the panel under it
      await pg.keyboard.press("Escape");
      await pg.getByRole("dialog", { name: "Who can view" }).waitFor({ state: "hidden" });
      await pg.keyboard.press("Escape");
    },
  },

  /* ---- Menu: on the phone a submenu replaces the list in place, with a Back row */
  {
    page: "menu", name: "Menu: project actions", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "More actions").first());
      return pg.getByRole("menu", { name: "Project actions" });
    },
  },
  {
    page: "menu", name: "Menu: submenu (Move to)", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "More actions").first());
      await pg.getByRole("menu", { name: "Project actions" }).waitFor();
      await person.press(pg.getByRole("menuitem", { name: "Move to" }));
      return pg.getByRole("menuitem", { name: "Client work" });
    },
  },
  {
    page: "menu", name: "Menu: checkbox and radio rows", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "View"));
      return pg.getByRole("menu", { name: "View options" });
    },
  },

  /* ---- Command menu: Ctrl+K on desktop, a tap on Search on the phone, which has no keyboard shortcut */
  {
    page: "command-menu", name: "Command menu", viewports: BOTH,
    open: async (pg, person) => {
      if (person.phone) await person.press(button(pg, /^Search/).first());
      else await pg.keyboard.press("Control+K");
      return pg.getByRole("dialog", { name: "Command menu" });
    },
  },
  {
    page: "command-menu", name: "Command menu: no results", viewports: BOTH,
    open: async (pg, person) => {
      if (person.phone) await person.press(button(pg, /^Search/).first());
      else await pg.keyboard.press("Control+K");
      const dialog = pg.getByRole("dialog", { name: "Command menu" });
      await dialog.getByRole("combobox").fill("figma");
      await dialog.getByText(/figma/i).last().waitFor(); // the empty state names the query
      return dialog;
    },
    close: async (pg) => { // the first Esc clears the query, the second closes the menu
      await pg.keyboard.press("Escape");
      await pg.keyboard.press("Escape");
    },
  },

  /* ---- Dialog: a centred panel on desktop, a bottom sheet on the phone */
  {
    page: "dialog", name: "Dialog: confirm", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "Publish litt.design v3"));
      return pg.getByRole("dialog", { name: "Publish litt.design v3?" });
    },
  },
  {
    page: "dialog", name: "Dialog: form with a field error", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "Invite a collaborator"));
      const dialog = pg.getByRole("dialog", { name: "Invite a collaborator" });
      await dialog.waitFor();
      await person.press(dialog.getByRole("button", { name: "Send invite" })); // empty address: the error shows
      await dialog.getByText("Enter a full address").waitFor();
      return dialog;
    },
  },
  {
    page: "dialog", name: "Dialog: destructive confirm, armed", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "Delete project"));
      const dialog = pg.getByRole("dialog", { name: "Delete Halo site?" });
      await dialog.waitFor();
      await dialog.getByRole("textbox").fill("halo-site"); // enables the danger-colored button
      return dialog;
    },
  },
  {
    page: "dialog", name: "Dialog: side sheet (bottom sheet on the phone)", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "Project settings").first());
      return pg.getByRole("dialog", { name: "Project settings" });
    },
  },

  /* ---- Toast: a status region that does not take focus, so Esc needs F8 first */
  {
    page: "toast", name: "Toast: saved", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "Save changes"));
      return pg.getByRole("status").filter({ hasText: "Home hero is up to date." });
    },
    close: dismissToasts,
  },
  {
    page: "toast", name: "Toast: with an action", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "Deploy litt.design"));
      return pg.getByRole("status").filter({ hasText: "litt.design v3 is live." });
    },
    close: dismissToasts,
  },
  {
    page: "toast", name: "Toast: error (danger title)", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "Break the build"));
      return pg.getByRole("alert").filter({ hasText: "Build failed" });
    },
    close: dismissToasts,
  },
  {
    page: "toast", name: "Toast: stack of three", viewports: BOTH,
    open: async (pg, person) => {
      await person.press(button(pg, "Fire three").first());
      await pg.getByRole("status").filter({ hasText: "You are second in line." }).waitFor(); // the third arrives last
      return pg.getByRole("status").filter({ hasText: "You are second in line." });
    },
    close: dismissToasts,
  },
];

/* A typo in the table must not turn into a scan that quietly never runs. */
for (const o of OVERLAYS) {
  if (!allPages.includes(o.page)) throw new Error(`Overlay "${o.name}" is on page "${o.page}", and there is no such page in src/gallery/pages.`);
  if (!o.viewports?.length || o.viewports.some((v) => !BOTH.includes(v))) throw new Error(`Overlay "${o.name}" needs viewports from ${BOTH.join(", ")}.`);
}
const overlaysOn = (id, viewport) => (withOverlays ? OVERLAYS.filter((o) => o.page === id && o.viewports.includes(viewport)) : []);

/* ----------------------------------------------------------------- the run */

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const SETTLE = 600; // ms for an overlay's entrance (the expressive tier is the longest) to finish, so axe reads resting colors
const STEP = 6_000; // ms any one step of an interaction may wait before the run calls it failed
/* Anything that is still showing after Esc. A toast is checked by its own locator, because pages have status regions. */
const OPEN_ROLES = "[role=menu],[role=dialog],[role=alertdialog],[role=tooltip]";

/* A page as loaded: a hash change alone keeps the last page's state, so load, then reload. */
async function load(pg, id) {
  await pg.goto(`http://localhost:${port}/index.html#${id}`, { waitUntil: "networkidle" });
  await pg.reload({ waitUntil: "networkidle" });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForSelector("h1", { timeout: 10_000 });
  await pg.waitForTimeout(400); // let entrances settle, so axe reads the resting colors
}

/* axe on the whole document, as it is now. */
async function scan(pg) {
  if (!(await pg.evaluate(() => !!window.axe))) await pg.addScriptTag({ content: axeSource });
  return pg.evaluate(async (tags) => {
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: tags }, resultTypes: ["violations"] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(" ")) }));
  }, TAGS);
}

/* One line for a Playwright error: what failed, and the locator it was waiting for. */
function why(e) {
  const lines = String(e?.message ?? e).replace(/\u001b\[[0-9;]*m/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  const locator = lines.find((l) => /waiting for|strict mode violation|resolved to/.test(l));
  return lines[0] + (locator && locator !== lines[0] ? ` (${locator})` : "");
}

/* The person at the screen: a mouse on desktop, a finger on the phone. */
function personFor(pg, label) {
  const phone = label === "phone";
  return {
    phone,
    press: (locator) => (phone ? locator.tap() : locator.click()),
    /* Desktop: rest the pointer on it, and the tooltip opens after its delay. Phone: a finger has no hover, so
       touch it and hold until the tooltip shows, then lift. The tooltip stays open until the next touch. */
    async rest(locator) {
      if (!phone) return locator.hover();
      await locator.scrollIntoViewIfNeeded();
      const box = await locator.boundingBox();
      if (!box) throw new Error("rest: the trigger has no box on screen");
      const finger = await pg.context().newCDPSession(pg);
      try {
        await finger.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
        await pg.getByRole("tooltip").first().waitFor({ state: "visible" });
        await finger.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      } finally {
        await finger.detach().catch(() => {});
      }
    },
  };
}

const browser = await chromium.launch();
const found = [];
let runs = 0;
let overlayRuns = 0;
const interactionsRun = new Set();
for (const [width, height, label] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme, hasTouch: label === "phone", isMobile: label === "phone" });
    ctx.setDefaultTimeout(STEP);
    ctx.setDefaultNavigationTimeout(30_000);
    const pg = await ctx.newPage();
    const errors = [];
    pg.on("pageerror", (e) => errors.push(String(e)));
    const person = personFor(pg, label);
    for (const id of pages) {
      await load(pg, id);
      const violations = await scan(pg);
      runs++;
      for (const v of violations) found.push({ page: id, theme, viewport: label, ...v });
      for (const e of errors.splice(0)) found.push({ page: id, theme, viewport: label, id: "page-error", impact: "critical", help: e, nodes: [] });

      /* The overlays this page opens, one after the other on the same load. After a failed step the page may be
         left with something open, so it is loaded again before the next. */
      let dirty = false;
      for (const o of overlaysOn(id, label)) {
        const at = { page: id, interaction: o.name, theme, viewport: label };
        const fail = (step, e) => { dirty = true; found.push({ ...at, id: "interaction-failed", impact: "critical", help: `${step}: ${why(e)}`, nodes: [] }); };
        if (dirty) { await load(pg, id); errors.length = 0; dirty = false; }
        interactionsRun.add(o.name);
        let overlay = null;
        try {
          overlay = await o.open(pg, person);
          await overlay.first().waitFor({ state: "visible" });
          await pg.waitForTimeout(SETTLE);
          if (!(await overlay.first().isVisible())) throw new Error("the overlay closed again before the scan"); // never scan a page with nothing open
          const hits = await scan(pg);
          overlayRuns++;
          for (const v of hits) found.push({ ...at, ...v });
        } catch (e) { fail("could not open", e); }
        try {
          await (o.close ?? ((p) => p.keyboard.press("Escape")))(pg);
          if (overlay) await overlay.first().waitFor({ state: "hidden" });
          await pg.waitForFunction((sel) => ![...document.querySelectorAll(sel)].some((el) => el.getClientRects().length > 0), OPEN_ROLES, { timeout: STEP });
        } catch (e) { fail("did not close", e); }
        for (const e of errors.splice(0)) found.push({ ...at, id: "page-error", impact: "critical", help: e, nodes: [] });
      }
    }
    await ctx.close();
  }
}
await browser.close();
server.close();

const took = `${Math.round((Date.now() - started) / 1000)}s`;
const shape = `${pages.length} pages, ${runs} runs (light and dark, desktop and phone)`;
const overlayShape = withOverlays ? `, ${overlayRuns} overlay runs of ${interactionsRun.size} interactions` : ", overlays skipped";

if (!found.length) {
  console.log(`a11y: ${shape}${overlayShape}, no violations (${took}).`);
  process.exit(0);
}
for (const v of found) {
  console.log(`✗ ${v.page}${v.interaction ? ` › ${v.interaction}` : ""} · ${v.theme} · ${v.viewport} · ${v.id} (${v.impact}): ${v.help}`);
  for (const n of v.nodes.slice(0, 5)) console.log(`    ${n}`);
  if (v.nodes.length > 5) console.log(`    …and ${v.nodes.length - 5} more`);
}
const inOverlays = found.filter((v) => v.interaction).length;
console.log(`\na11y: ${found.length} violations across ${new Set(found.map((v) => v.page)).size} of ${pages.length} pages${inOverlays ? ` (${inOverlays} in overlays)` : ""}; ${shape}${overlayShape} (${took}).`);
process.exit(1);
