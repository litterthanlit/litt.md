#!/usr/bin/env node
/**
 * The Playground's object and its screen (#playground, plans/018), checked from a build at 1440x1000.
 *
 *   npm run build && npm run test:playground
 *   node scripts/playground.mjs --dist dist
 *   node scripts/playground.mjs --self-test         breaks the screen and the object on purpose; fails if the check misses either
 *   node scripts/playground.mjs --greyscale <dir>   writes each world's object in colour and in greyscale in one font,
 *                                                   light and dark, and a sheet of each; judges nothing (the test of an object)
 *
 * For each of the six worlds, on the object's screen (data-play-frame="phone"), it fails when:
 * - the frame does not wear the world picked (data-material, none for Press), or the page's <html> material changed,
 * - the sheet (New project), a toast (Create), the menu and its Move to drill-down, the command menu (Search) or the
 *   tooltip (press and hold on Search) opens with its box outside the frame's (1px tolerance), or outside the frame
 *   in the DOM: its nearest ancestor that sets a world (data-material or data-theme) must be the frame,
 * - the sheet's bottom edge is not the frame's (the sheet hangs its 24px drag overhang below, which the frame clips),
 * - Today, Projects or Settings shows more than one element filled with the accent (R6; the accent is set to Blue 4
 *   before the page loads, since Flat's own accent is the ink that checkboxes and switches fill with too),
 * - switching the world loses the screen or its state (Settings, with Weekly digest turned on),
 * - the object's root (data-play-object) is not the world's id for a world in OBJECTS, or not "bare" for one that is not,
 * - from the World switch, one Tab does not reach the selected take or the next one the screen (the takes are one tab
 *   stop), or ArrowRight, ArrowLeft, Home and End do not change the take with the readout's count following,
 * - a take draws nothing inside the screen's box, or anything in the body (the object outside its screen) is filled
 *   with the accent (R6: the app's New project is the view's one),
 * - back on take 0 after a scene, Settings is not still showing with Weekly digest on.
 * And once on the Desktop frame: the dialog and the command menu open inside the frame.
 *
 * --self-test takes the frame's containment away (contain: none) before opening the sheet, so the sheet fills the
 * window, and makes the recorder's body fail to load, so Device draws bare; it fails if the check misses either.
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
const greyscale = get("greyscale", null);
/* The worlds that have an object of their own: one more per object drawn (plans/018, phase 2). */
const OBJECTS = ["device"];
/* A string only the recorder's body ships, so --self-test can keep that chunk from loading. */
const RECORDER_MARK = "recorder-dial";

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

const WORLDS = [["Press", undefined], ["Flat", "flat"], ["Device", "device"], ["Plain", "plain"], ["Rack", "rack"], ["Heat", "heat"]];
const FRAME = "[data-play-frame]";
const browser = await chromium.launch();

async function open({ theme, scale = 1 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: scale, reducedMotion: "reduce" });
  await ctx.addInitScript(() => localStorage.setItem("litt-gallery:customize", JSON.stringify({ accent: "blue4" })));
  if (theme) await ctx.addInitScript((t) => localStorage.setItem("litt-gallery:theme", t), theme);
  if (selfTest)
    await ctx.route(/\.js$/, async (route) => {
      const res = await route.fetch();
      const body = await res.text();
      if (body.includes(RECORDER_MARK)) return route.abort();
      await route.fulfill({ response: res, body });
    });
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

/** Elements in the object but outside its screen filled with the accent, counted as accentFills counts them. */
function bodyFills(pg) {
  return pg.evaluate(([F]) => {
    const object = document.querySelector("[data-play-object]");
    if (!object) return ["no [data-play-object]"];
    const probe = document.createElement("div");
    probe.style.background = "var(--accent)";
    object.append(probe);
    const accent = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const out = [];
    for (const el of object.querySelectorAll("*")) {
      if (el.closest(F) || getComputedStyle(el).backgroundColor !== accent) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 24 || b.height < 16) continue;
      out.push(el.tagName.toLowerCase() + (el.getAttribute("aria-label") ? ` "${el.getAttribute("aria-label")}"` : ""));
    }
    return out;
  }, [FRAME]);
}

/** The take showing in the screen: its id, and whether it draws something with a box inside the screen's. */
function showing(pg) {
  return pg.evaluate((F) => {
    const frame = document.querySelector(F);
    const f = frame.getBoundingClientRect();
    const take = [...frame.querySelectorAll("[data-play-take]")].find((el) => !el.hidden && el.getClientRects().length > 0);
    if (!take) return { id: null, draws: false };
    const drawn = [...take.querySelectorAll("*")].filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && b.right > f.left && b.left < f.right && b.bottom > f.top && b.top < f.bottom;
    });
    return { id: take.dataset.playTake, draws: drawn.length > 0 };
  }, FRAME);
}

const readout = (pg) => pg.evaluate(() => document.querySelector("[data-play-readout]")?.textContent?.replace(/\s+/g, " ").trim() ?? null);
const pad = (n) => String(n).padStart(2, "0");

const tab = (pg, name) => pg.locator(FRAME).getByRole("group", { name: "Screens" }).getByRole("button", { name, exact: true });
const pickWorld = async (pg, name) => {
  await pg.getByRole("group", { name: "World" }).getByRole("button", { name, exact: true }).click();
  await pg.waitForTimeout(300);
};

/**
 * --greyscale: each world's object at rest on take 0, in colour, then in greyscale with every word in one font, light
 * and dark, and a sheet of each set side by side. The test of an object (plans/018): with the colour and the face gone,
 * does the structure alone name the world? It judges nothing; a person reads the sheet.
 */
async function pictures(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const shots = { color: { light: [], dark: [] }, grey: { light: [], dark: [] } };
  for (const theme of ["light", "dark"]) {
    for (const [world] of WORLDS) {
      const { ctx, pg } = await open({ theme, scale: 2 });
      await pickWorld(pg, world);
      await pg.waitForTimeout(500);
      await inView(pg);
      await pg.mouse.move(0, 0);
      const object = pg.locator("[data-play-object]");
      for (const kind of ["color", "grey"]) {
        if (kind === "grey")
          await pg.addStyleTag({ content: "[data-play-object]{filter:grayscale(1)}[data-play-object],[data-play-object] *{font-family:sans-serif!important}" });
        await pg.waitForTimeout(200);
        const file = path.join(dir, `${kind}-${world.toLowerCase()}-${theme}.png`);
        await object.screenshot({ path: file });
        shots[kind][theme].push([world, file]);
      }
      await ctx.close();
    }
  }
  for (const kind of ["color", "grey"])
    for (const theme of ["light", "dark"]) {
      const cells = shots[kind][theme].map(([w, f]) => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}"><figcaption>${w}</figcaption></figure>`).join("");
      const pg = await browser.newPage({ viewport: { width: 4400, height: 1000 }, deviceScaleFactor: 1 });
      await pg.setContent(`<style>body{margin:0;padding:32px;background:${theme === "dark" ? "#111" : "#eee"};color:${theme === "dark" ? "#ccc" : "#333"};font:14px sans-serif}main{display:flex;gap:24px;align-items:flex-end}figure{margin:0}img{display:block;height:860px}figcaption{margin-top:8px}</style><main>${cells}</main>`); // litt-allow: the sheet's own page, never shipped
      await pg.locator("main").screenshot({ path: path.join(dir, `sheet-${kind}-${theme}.png`) });
      await pg.close();
    }
  console.log(`playground --greyscale: the six objects, in colour and in greyscale in one font, light and dark, in ${dir}`);
  await browser.close();
  server.close();
  process.exit(0);
}

if (greyscale) await pictures(greyscale);

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

  /* The object: its body, its one tab stop and keys, what each take draws, and nothing in the body in the accent. */
  const id = attribute ?? "press";
  const drawn = await pg.evaluate(() => document.querySelector("[data-play-object]")?.dataset.playObject ?? null);
  const want = OBJECTS.includes(id) ? id : "bare";
  claim("the object is the world's own, or bare for a world not drawn yet", drawn === want ? null : `${world}: data-play-object is ${drawn}, wants ${want}`);

  const tabs = pg.locator("[data-play-object] [role=tablist] [role=tab]");
  const n = await tabs.count();
  await pg.getByRole("group", { name: "World" }).getByRole("button").last().focus();
  await pg.keyboard.press("Tab");
  const first = await pg.evaluate(() => ({ role: document.activeElement?.getAttribute("role"), selected: document.activeElement?.getAttribute("aria-selected") }));
  await pg.keyboard.press("Tab");
  const second = await pg.evaluate((F) => document.activeElement?.matches(F) ?? false, FRAME);
  claim(
    "from the World switch, one Tab reaches the takes and the next the screen",
    n > 1 && first.role === "tab" && first.selected === "true" && second ? null : `${world}: ${n} takes; first Tab on ${first.role} (selected ${first.selected}), second on the screen: ${second}`,
  );

  const keys = [["ArrowRight", 1], ["ArrowLeft", 0], ["End", n - 1], ["Home", 0]];
  if (n > 1) await tabs.nth(0).focus();
  for (const [key, to] of n > 1 ? keys : []) {
    await pg.keyboard.press(key);
    await pg.waitForTimeout(150);
    const now = await pg.evaluate(() => {
      const t = document.activeElement;
      const all = [...document.querySelectorAll("[data-play-object] [role=tablist] [role=tab]")];
      return { focused: all.indexOf(t), selected: all.findIndex((el) => el.getAttribute("aria-selected") === "true") };
    });
    const text = await readout(pg);
    const count = `${pad(to + 1)} / ${pad(n)}`;
    claim(
      "ArrowRight, ArrowLeft, Home and End change the take, and the readout follows",
      now.selected === to && now.focused === to && text?.includes(count) ? null : `${world} · ${key}: take ${now.selected} selected, ${now.focused} focused, readout "${text}", wants take ${to} and "${count}"`,
    );
  }
  if (n < 2) claim("ArrowRight, ArrowLeft, Home and End change the take, and the readout follows", `${world}: ${n} takes`);

  claim("nothing in the object's body is filled with the accent", null);
  for (let i = 0; i < n; i++) {
    await tabs.nth(i).click();
    await pg.waitForTimeout(250);
    const s = await showing(pg);
    claim("every take draws something inside the screen's box", s.draws ? null : `${world} · take ${i + 1}: ${s.id ?? "nothing showing"} draws nothing inside the screen`);
    const fills = await bodyFills(pg);
    claim("nothing in the object's body is filled with the accent", fills.length === 0 ? null : `${world} · take ${i + 1}: ${fills.join(", ")}`);
  }
  if (n === 0) claim("every take draws something inside the screen's box", `${world}: no takes`);

  if (n > 1) {
    await tabs.nth(n - 1).click();
    await pg.waitForTimeout(250);
    await tabs.nth(n - 1).focus();
    await pg.keyboard.press("Home");
    await pg.waitForTimeout(300);
  }
  const back = { screen: await tab(pg, "Settings").getAttribute("aria-pressed").catch(() => null), digest: await frame.getByRole("switch", { name: "Weekly digest" }).getAttribute("aria-checked").catch(() => null) };
  claim("back on take 0 after a scene, Settings still shows Weekly digest on", n > 1 && back.screen === "true" && back.digest === "true" ? null : `${world}: ${n} takes; Settings pressed ${back.screen}, Weekly digest ${back.digest}`);

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
  const bareCaught = (claims.get("the object is the world's own, or bare for a world not drawn yet") ?? []).some((f) => f.startsWith("Device:"));
  if (!caught) console.error("playground --self-test: the sheet filled the window with the frame's containment gone, and the check missed it.");
  if (!bareCaught) console.error("playground --self-test: Device drew bare with the recorder kept from loading, and the check missed it.");
  if (!caught || !bareCaught) process.exit(1);
  console.log("playground --self-test: with the frame's containment gone the sheet leaves the frame, and with the recorder kept from loading Device draws bare; the check catches both.");
  process.exit(0);
}
if (bad) {
  console.error(`\nplayground: ${bad} of ${claims.size} claims fail.`);
  process.exit(1);
}
console.log(`\nplayground: ${claims.size} claims hold, in ${WORLDS.map(([n]) => n).join(", ")} on the object and once on the desktop, at 1440x1000.`);
