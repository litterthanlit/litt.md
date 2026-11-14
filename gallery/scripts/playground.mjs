#!/usr/bin/env node
/**
 * The Playground's phone (#playground), checked from a build at 1440x1000.
 *
 *   npm run build && npm run test:playground
 *   node scripts/playground.mjs --dist dist
 *   node scripts/playground.mjs --self-test     breaks the frame on purpose and fails if the check misses it
 *
 * For each world (Press, Flat, Device), on the phone frame, it fails when:
 * - the frame does not wear the world picked (data-material, none for Press), or the page's <html> material changed,
 * - the sheet (New project), a toast (Create), the menu and its Move to drill-down, the command menu (Search) or the
 *   tooltip (press and hold on Search) opens with its box outside the frame's (1px tolerance), or outside the frame
 *   in the DOM: its nearest ancestor that sets a world (data-material or data-theme) must be the frame,
 * - the sheet's bottom edge is not the frame's (the sheet hangs its 24px drag overhang below, which the frame clips),
 * - Today, Projects or Settings shows more than one element filled with the accent (R6; the accent is set to Blue 4
 *   before the page loads, since Flat's own accent is the ink that checkboxes and switches fill with too),
 * - switching the world loses the screen or its state (Settings, with Weekly digest turned on).
 * And once on the Desktop frame: the dialog and the command menu open inside the frame.
 *
 * --self-test takes the frame's containment away (contain: none) before opening the sheet, so the sheet fills the
 * window, and fails if the check still passes.
 *
 * Needs Playwright, found as worlds.mjs finds it.
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
const selfTest = args.includes("--self-test");

const roots = [process.env.A11Y_TOOLS, path.join(here, ".."), "/opt/node22/lib"].filter(Boolean);
function resolveTool(id) {
  for (const root of roots) {
    try { return createRequire(path.join(root, "noop.js")).resolve(id); } catch { /* next root */ }
  }
  throw new Error(`${id} not found. Install it next to the gallery (npm i --no-save ${id}) or point A11Y_TOOLS at a folder that has it.`);
}
const { chromium } = createRequire(import.meta.url)(resolveTool("playwright"));

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error(`No build at ${path.relative(process.cwd(), dist) || "."}. Run npm run build first.`);
  process.exit(1);
}

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".md": "text/markdown", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}/index.html`;

const claims = new Map();
const claim = (name, bad) => {
  if (!claims.has(name)) claims.set(name, []);
  if (bad) claims.get(name).push(bad);
};

const WORLDS = [["Press", undefined], ["Flat", "flat"], ["Device", "device"], ["Rack", "rack"]];
const FRAME = "[data-play-frame]";
const browser = await chromium.launch();

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await ctx.addInitScript(() => localStorage.setItem("litt-gallery:customize", JSON.stringify({ accent: "blue4" })));
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(e.message));
  await pg.goto(`${base}#playground`, { waitUntil: "networkidle" });
  await pg.evaluate(() => document.fonts.ready);
  return { ctx, pg, errors };
}

/** Scrolls the page so the frame is whole in the window, under the header. */
const inView = (pg) => pg.evaluate((F) => window.scrollBy(0, document.querySelector(F).getBoundingClientRect().top - 88), FRAME);

/** Where every element matching the selector sits against the frame, in the box and in the DOM. */
function place(pg, selector) {
  return pg.evaluate(([F, selector]) => {
    const frame = document.querySelector(F);
    const f = frame.getBoundingClientRect();
    return [...document.querySelectorAll(selector)]
      .filter((el) => el.getClientRects().length > 0 && el.getBoundingClientRect().height > 0)
      .map((el) => {
        const b = el.getBoundingClientRect();
        /* A bottom sheet hangs a drag overhang below its layer on purpose (a negative bottom margin), which the frame
           clips as a phone's edge would: its box is read without it. */
        const bottom = b.bottom + Math.min(0, parseFloat(getComputedStyle(el).marginBottom) || 0);
        const inside = b.left >= f.left - 1 && b.top >= f.top - 1 && b.right <= f.right + 1 && bottom <= f.bottom + 1;
        const world = el.closest("[data-material], [data-theme]");
        return {
          ok: inside && world === frame,
          what: `${Math.round(b.left)},${Math.round(b.top)} to ${Math.round(b.right)},${Math.round(bottom)} in a frame at ${Math.round(f.left)},${Math.round(f.top)} to ${Math.round(f.right)},${Math.round(f.bottom)}${world === frame ? "" : ", under another world's element"}`,
          bottom,
          frameBottom: f.bottom,
        };
      });
  }, [FRAME, selector]);
}

async function inside(pg, name, selector, where) {
  const boxes = await place(pg, selector);
  if (!boxes.length) return claim(name, `${where}: nothing matched ${selector}`), boxes;
  for (const b of boxes) claim(name, b.ok ? null : `${where}: ${b.what}`);
  return boxes;
}

/** The elements inside the frame filled with its accent, as wall.mjs counts them (at least 24 by 16, not hidden). */
function accentFills(pg) {
  return pg.evaluate((F) => {
    const frame = document.querySelector(F);
    const probe = document.createElement("div");
    probe.style.background = "var(--accent)";
    frame.append(probe);
    const accent = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const out = [];
    for (const el of frame.querySelectorAll("*")) {
      if (el.closest("[aria-hidden=true], .sr-only") || getComputedStyle(el).backgroundColor !== accent) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 24 || b.height < 16) continue;
      out.push(`"${(el.textContent || "").trim().slice(0, 24)}"`);
    }
    return out;
  }, FRAME);
}

const tab = (pg, name) => pg.locator(FRAME).getByRole("group", { name: "Screens" }).getByRole("button", { name, exact: true });
const pickWorld = async (pg, name) => {
  await pg.getByRole("group", { name: "World" }).getByRole("button", { name, exact: true }).click();
  await pg.waitForTimeout(300);
};

for (const [world, attribute] of WORLDS) {
  const { ctx, pg, errors } = await open();
  const htmlBefore = await pg.evaluate(() => document.documentElement.dataset.material ?? null);
  await pickWorld(pg, world);
  await inView(pg);
  const frame = pg.locator(FRAME);
  const worn = await pg.evaluate((F) => ({ frame: document.querySelector(F).dataset.material ?? null, html: document.documentElement.dataset.material ?? null }), FRAME);
  claim("the frame wears the world picked", worn.frame === (attribute ?? null) ? null : `${world}: data-material is ${worn.frame}`);
  claim("the page around the frame keeps its own world", worn.html === htmlBefore ? null : `${world}: <html> went from ${htmlBefore} to ${worn.html}`);

  /* The three screens at rest: one accent fill at most. */
  for (const screen of ["Today", "Projects", "Settings"]) {
    await tab(pg, screen).click();
    await pg.waitForTimeout(400);
    const fills = await accentFills(pg);
    claim("each screen shows at most one accent fill", fills.length <= 1 ? null : `${world} · ${screen}: ${fills.length} fills, ${fills.join(", ")}`);
  }

  /* A world switch keeps the screen and its state. */
  await frame.getByRole("switch", { name: "Weekly digest" }).click();
  await pg.waitForTimeout(200);
  const other = world === "Flat" ? "Device" : "Flat";
  await pickWorld(pg, other);
  const kept = { screen: await tab(pg, "Settings").getAttribute("aria-pressed"), digest: await frame.getByRole("switch", { name: "Weekly digest" }).getAttribute("aria-checked") };
  claim("a world switch keeps the screen and what was set on it", kept.screen === "true" && kept.digest === "true" ? null : `${world} to ${other}: Settings pressed ${kept.screen}, Weekly digest ${kept.digest}`);
  await pickWorld(pg, world);

  /* The tooltip, by press and hold on Search. Clicks above may have scrolled the page; bring the frame back. */
  await tab(pg, "Today").click();
  await pg.waitForTimeout(400);
  await inView(pg);
  const search = frame.getByRole("button", { name: "Search", exact: true });
  const sb = await search.boundingBox();
  await pg.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
  await pg.mouse.down();
  await pg.waitForTimeout(900);
  await inside(pg, "the tooltip opens inside the frame, in its world", "[role=tooltip]", world);
  await pg.mouse.up();
  await pg.keyboard.press("Escape");
  await pg.waitForTimeout(400);

  /* The command menu. */
  await search.click();
  await pg.waitForTimeout(700);
  await inside(pg, "the command menu opens inside the frame, in its world", "[role=dialog]", world);
  await pg.keyboard.press("Escape");
  await pg.keyboard.press("Escape");
  await pg.waitForTimeout(500);

  /* The sheet, and the toast its Create raises. */
  await inView(pg);
  if (selfTest) await pg.evaluate((F) => (document.querySelector(F).style.contain = "none"), FRAME);
  await frame.getByRole("button", { name: "New project" }).click();
  await pg.waitForTimeout(800);
  const sheet = await inside(pg, "the sheet opens inside the frame, in its world", "[role=dialog]", world);
  /* The panel itself hangs its drag overhang below the frame; its layer is the frame's box. */
  const panel = sheet[0] ? { bottom: sheet[0].bottom } : null;
  const fb = sheet[0]?.frameBottom;
  claim("the sheet's bottom edge is the frame's", panel && fb !== undefined && Math.abs(panel.bottom - fb) <= 1 ? null : `${world}: sheet bottom ${panel?.bottom}, frame bottom ${fb}`);
  if (selfTest) await pg.evaluate((F) => (document.querySelector(F).style.contain = ""), FRAME);
  await pg.getByRole("dialog").getByRole("button", { name: "Create" }).click();
  await pg.waitForTimeout(900);
  await inside(pg, "a toast opens inside the frame, in its world", "[data-toast-id]", world);

  /* The menu and its Move to drill-down. */
  await tab(pg, "Projects").click();
  await pg.waitForTimeout(400);
  await frame.getByRole("button", { name: "More for Founder landing" }).click();
  await pg.waitForTimeout(700);
  await inside(pg, "the menu opens inside the frame, in its world", "[role=menu]", world);
  await pg.getByRole("menuitem", { name: "Move to" }).click();
  await pg.waitForTimeout(700);
  await inside(pg, "the menu's Move to drill-down opens inside the frame, in its world", "[role=menu]", world);
  await pg.keyboard.press("Escape");

  for (const e of errors) claim("the page throws nothing", `${world}: ${e}`);
  await ctx.close();
}

/* The Desktop frame: the centred dialog and the command menu. */
{
  const { ctx, pg, errors } = await open();
  await pg.getByRole("group", { name: "Frame" }).getByRole("button", { name: "Desktop" }).click();
  await pg.waitForTimeout(400);
  await inView(pg);
  const frame = pg.locator(FRAME);
  claim("the Frame switch shows the desktop", (await frame.getAttribute("data-play-frame")) === "desktop" ? null : "the frame is still the phone");
  const publish = frame.getByRole("button", { name: "Publish litt.design v3" });
  await publish.scrollIntoViewIfNeeded();
  await publish.click();
  await pg.waitForTimeout(800);
  await inside(pg, "on the desktop, the dialog and the command menu open inside the frame", "[role=dialog]", "desktop dialog");
  await pg.keyboard.press("Escape");
  await pg.waitForTimeout(500);
  const search = frame.getByRole("button", { name: "Search" });
  await search.scrollIntoViewIfNeeded();
  await search.click();
  await pg.waitForTimeout(800);
  await inside(pg, "on the desktop, the dialog and the command menu open inside the frame", "[role=dialog]", "desktop command menu");
  for (const e of errors) claim("the page throws nothing", `desktop: ${e}`);
  await ctx.close();
}

await browser.close();
server.close();

let bad = 0;
for (const [name, fails] of claims) {
  if (!fails.length) { if (!selfTest) console.log(`✓ ${name}`); continue; }
  bad++;
  if (!selfTest) {
    console.error(`✗ ${name}`);
    for (const f of [...new Set(fails)].slice(0, 6)) console.error(`    ${f}`);
  }
}
if (selfTest) {
  const caught = (claims.get("the sheet opens inside the frame, in its world") ?? []).length > 0;
  if (!caught) {
    console.error("playground --self-test: the sheet filled the window with the frame's containment gone, and the check missed it.");
    process.exit(1);
  }
  console.log("playground --self-test: with the frame's containment gone, the sheet leaves the frame and the check catches it.");
  process.exit(0);
}
if (bad) {
  console.error(`\nplayground: ${bad} of ${claims.size} claims fail.`);
  process.exit(1);
}
console.log(`\nplayground: ${claims.size} claims hold, in ${WORLDS.map(([n]) => n).join(", ")} on the phone and once on the desktop, at 1440x1000.`);
