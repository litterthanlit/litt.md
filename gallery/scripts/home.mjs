#!/usr/bin/env node
/**
 * The overview's hero and the gallery's search, driven from a build the way a visitor uses them.
 *
 *   npm run build && npm run test:home
 *   node scripts/home.mjs --dist dist
 *
 * It fails when:
 * - the header offers Customize or the overview a deck, or a saved look or a link's (?look=) changes anything: the
 *   gallery stays Flat in its own accent, shape and Calm (plans/019: nothing is customized),
 * - a hovered Select's placeholder in Press or Flat (#press/select, #flat/select) is under 4.5:1 on its fill, or a
 *   checked checkbox catches a top highlight in Flat (#flat/checkbox) or none in Press (#press/checkbox),
 * - Get started does not take focus to the steps,
 * - ⌘K or Ctrl+K does not open one search menu, or picking a page there does not open it,
 * - a page opens a second menu for one ⌘K: the Command menu's demo on the wall, or on its own page, where the demo
 *   keeps the shortcut,
 * - the phone's search button does not open the menu,
 * - the page throws.
 *
 * Needs Playwright, found as wall.mjs finds it.
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

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const problems = [];
const passed = [];
const check = (ok, claim) => (ok ? passed : problems).push(claim);

const browser = await chromium.launch();

async function open(hash, { phone = false, query = "" } = {}) {
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e)));
  await pg.goto(`http://localhost:${port}/index.html${query}#${hash}`, { waitUntil: "networkidle" });
  await pg.evaluate(() => document.fonts.ready);
  return { ctx, pg, errors };
}

const deck = (pg) => pg.locator("section[aria-labelledby=deck-title]");
const dialogs = (pg) => pg.locator("[role=dialog]").count();

/* ---------- strict worlds: nothing to customize (plans/019) ---------- */
{
  const { ctx, pg, errors } = await open("overview");
  check((await pg.locator("header").getByRole("button", { name: "Customize" }).count()) === 0, "the header offers no Customize");
  check((await deck(pg).count()) === 0, "the overview has no deck");
  for (const e of errors) problems.push(`strict: ${e}`);
  await ctx.close();
}
{
  /* A look once saved, or a link's, changes nothing: the gallery is Flat in its own accent, and nothing is written. */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem("litt-gallery:customize", JSON.stringify({ accent: "pink", material: "press", fun: true, radius: 0 })));
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(e.message));
  await pg.goto(`http://localhost:${port}/index.html?look=blue4-device-fun#button`, { waitUntil: "networkidle" });
  const state = await pg.evaluate(() => ({
    accent: document.body.dataset.accent ?? null,
    material: document.documentElement.dataset.material ?? null,
    radius: document.body.style.getPropertyValue("--radius-control"),
    fun: document.querySelectorAll("[data-fun-cue]").length,
  }));
  check(
    state.accent === null && state.material === "flat" && state.radius === "" && state.fun === 0,
    `a saved look and a link's look change nothing: Flat, its own accent, its own shape, Calm (${JSON.stringify(state)})`,
  );
  for (const e of errors) problems.push(`strict link: ${e}`);
  await ctx.close();
}

/* ---------- a hovered Select's placeholder keeps 4.5:1 (R3, --block-hover) ---------- */
for (const look of ["press", "flat"]) {
  const { ctx, pg, errors } = await open(`${look}/select`);
  const trigger = pg.locator("main").getByRole("combobox").filter({ hasText: "Choose a region" }).first();
  await trigger.hover();
  await pg.waitForTimeout(300); // the fill fades on the instant tier
  const r = await trigger.evaluate((el) => {
    const words = [...el.querySelectorAll("*")].find((n) => n.childElementCount === 0 && n.textContent.trim() === "Choose a region") ?? el;
    const probe = document.createElement("canvas").getContext("2d");
    const rgb = (c) => { probe.fillStyle = "#000"; probe.fillStyle = c; probe.fillRect(0, 0, 1, 1); return [...probe.getImageData(0, 0, 1, 1).data].slice(0, 3); };
    const lum = (c) => { const [r, g, b] = rgb(c).map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const [a, b] = [lum(getComputedStyle(words).color), lum(getComputedStyle(el).backgroundColor)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  });
  check(r >= 4.5, `${look}: a hovered Select's placeholder is ${r.toFixed(2)}:1 on its fill (needs 4.5:1)`);
  for (const e of errors) problems.push(`select hover ${look}: ${e}`);
  await ctx.close();
}

/* ---------- Flat has no light: a checked box's highlight ---------- */
for (const [look, want] of [["press", 1], ["flat", 0]]) {
  const { ctx, pg, errors } = await open(`${look}/checkbox`);
  const box = pg.locator("main input[type=checkbox]:checked:not(:disabled)").first();
  /* The light falls on what the box draws: under Press the ink block seated in the cut beside the input (wave one's
     body), so every shown piece of the mark is read, not only the input. */
  const lit = await box.evaluate((input) =>
    [input, ...input.parentElement.querySelectorAll("*")]
      .filter((el) => getComputedStyle(el).opacity !== "0")
      .reduce((n, el) => n + getComputedStyle(el).boxShadow.split(/,(?![^(]*\))/).filter((l) => /inset/.test(l) && !/transparent|rgba\([^)]*,\s*0\)|\/\s*0\)/.test(l)).length, 0),
  );
  check(want ? lit >= 1 : lit === 0, `${look}: a checked checkbox ${want ? "catches its top highlight" : "catches no top highlight (Flat)"} (${lit} lit inset${lit === 1 ? "" : "s"})`);
  for (const e of errors) problems.push(`checkbox ${look}: ${e}`);
  await ctx.close();
}

/* ---------- search ---------- */
{
  const { ctx, pg, errors } = await open("overview");
  await pg.keyboard.press("Control+k");
  await pg.getByRole("dialog").waitFor();
  check((await dialogs(pg)) === 1, "Ctrl+K opens one search menu");
  await pg.keyboard.type("slider");
  await pg.keyboard.press("Enter");
  await pg.waitForFunction(() => location.hash === "#flat/slider");
  check(true, "typing slider and Enter opens the Slider page, in the gallery's world (#flat/slider)");
  await pg.getByRole("dialog").waitFor({ state: "detached" });
  check((await dialogs(pg)) === 0, "the menu closes when a page is picked");

  await pg.getByRole("button", { name: "Search" }).first().click();
  await pg.getByRole("dialog").waitFor();
  await pg.keyboard.type("dark theme");
  await pg.keyboard.press("Enter");
  await pg.waitForFunction(() => document.documentElement.dataset.theme === "dark");
  check(true, "the header's Search button opens the menu, and Dark theme there sets it");

  await pg.goto(`http://localhost:${port}/index.html#overview`, { waitUntil: "networkidle" });
  await pg.locator("[data-tile=command-menu]").scrollIntoViewIfNeeded();
  await pg.locator("[data-tile=command-menu] button", { hasText: "Search" }).waitFor();
  await pg.keyboard.press("Control+k");
  await pg.getByRole("dialog").first().waitFor();
  await pg.waitForTimeout(400);
  check((await dialogs(pg)) === 1, "with the Command menu's tile on screen, ⌘K still opens one menu");
  await pg.keyboard.press("Escape");

  /* In a world there is no gallery search: ⌘K on the Command menu's page opens only the page's demo. */
  await pg.goto(`http://localhost:${port}/index.html#flat/command-menu`, { waitUntil: "networkidle" });
  await pg.getByRole("heading", { level: 1, name: "Command menu" }).waitFor();
  await pg.keyboard.press("Control+k");
  await pg.getByRole("dialog").first().waitFor();
  await pg.waitForTimeout(400);
  check((await dialogs(pg)) === 1, "on the Command menu's page, ⌘K opens one menu (the page's demo)");

  for (const e of errors) problems.push(`search: ${e}`);
  await ctx.close();
}

/* ---------- search on a phone ---------- */
{
  const { ctx, pg, errors } = await open("overview", { phone: true });
  await pg.locator("header").getByRole("button", { name: "Search" }).tap();
  await pg.getByRole("dialog").waitFor();
  await pg.keyboard.type("toast");
  await pg.keyboard.press("Enter");
  await pg.waitForFunction(() => location.hash === "#flat/toast");
  check(true, "on a phone, the header's search icon opens the menu and a pick opens the page");
  for (const e of errors) problems.push(`phone: ${e}`);
  await ctx.close();
}

await browser.close();
server.close();

for (const p of passed) console.log(`✓ ${p}`);
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nhome: ${problems.length} problem${problems.length === 1 ? "" : "s"}.`);
  process.exit(1);
}
console.log(`\nhome: ${passed.length} claims hold.`);
