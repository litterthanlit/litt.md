#!/usr/bin/env node
/**
 * The overview's wall, checked from a build: every tile mounted, on the desktop and a phone, in light and dark.
 *
 *   npm run build && npm run test:wall
 *   node scripts/wall.mjs --dist dist
 *
 * It fails when:
 * - the wall shows more than one accent fill (R6: one per view). Each tile is its page's `tile`, one object with no
 *   accent fill, and the Button tile carries the one. A page whose first demo ends in a primary button needs a tile.
 * - two accent fills anywhere on the page sit within one screen of each other, so a screen could show both. The hero's
 *   Get started is the first screen's one, and the Button tile has to sit at least a screen below it.
 * - the page or a tile scrolls sideways,
 * - a tile draws nothing,
 * - the page has more than one main or h1, two landmarks share a name, or a tile's name is not its h2 (so the headings
 *   inside a component sit under it),
 * - the page throws.
 *
 * Needs Playwright, which is not a dependency of the gallery: it looks in A11Y_TOOLS (as CI sets up), then here, then
 * in the global Playwright of Claude's cloud container, as a11y.mjs does.
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

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

/* Read in the page: the accent fills, sideways scroll and empty tiles across every tile. */
function inspect() {
  const probe = document.createElement("div");
  probe.style.background = "var(--accent)";
  document.body.append(probe);
  const accent = getComputedStyle(probe).backgroundColor;
  probe.remove();
  const tiles = [...document.querySelectorAll("[data-tile]")];
  const name = (el) => el.closest("[data-tile]")?.dataset.tile ?? "the page";
  const fills = [];
  const marks = [];
  for (const el of document.querySelectorAll("main *")) {
    /* A block's picture (Miniature) is a whole screen drawn small and out of reach: its fills are part of the picture.
       A skip link is out of sight until it has focus. */
    if (el.closest("[aria-hidden=true], .sr-only") || getComputedStyle(el).backgroundColor !== accent) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 24 || box.height < 16) continue;
    const what = `${name(el)} ("${(el.textContent || "").trim().slice(0, 32)}")`;
    if (el.closest("[data-tile]")) fills.push(what);
    marks.push({ what, y: box.top + scrollY });
  }
  marks.sort((a, b) => a.y - b.y);
  const close = marks.slice(1).flatMap((m, i) => (m.y - marks[i].y < innerHeight ? [`${marks[i].what} and ${m.what}, ${Math.round(m.y - marks[i].y)}px apart`] : []));
  const sideways = tiles.filter((t) => t.firstElementChild.scrollWidth > t.firstElementChild.clientWidth + 1).map((t) => name(t));
  const empty = tiles.filter((t) => t.firstElementChild.getBoundingClientRect().height < 8 || !t.firstElementChild.textContent && !t.firstElementChild.querySelector("svg,img,canvas,[role=img]")).map((t) => name(t));
  /* What a screen reader lists: one main and one h1, landmarks with names of their own, and each tile's name one
     level under the page title, so a component's own headings sit under its name. */
  const shown = (el) => !el.closest("[aria-hidden=true],[inert]") && el.getClientRects().length > 0;
  const named = (el) => el.getAttribute("aria-label") || (el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby"))?.textContent?.trim()) || "";
  const landmarks = [...document.querySelectorAll("nav, section, form, aside, [role=region], [role=navigation]")].filter(shown).map(named).filter(Boolean);
  const twice = [...new Set(landmarks.filter((n, i) => landmarks.indexOf(n) !== i))];
  const mains = [...document.querySelectorAll("main, [role=main]")].filter(shown).length;
  const h1s = [...document.querySelectorAll("h1")].filter(shown).length;
  const names = tiles.filter((t) => t.querySelector(":scope > h2") === null).map((t) => name(t));
  return { count: tiles.length, fills, close, sideways, empty, pageWide: document.documentElement.scrollWidth > innerWidth, twice, mains, h1s, names };
}

const browser = await chromium.launch();
const problems = [];
let count = 0;
for (const [width, height, label] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme, hasTouch: label === "phone", isMobile: label === "phone" });
    const pg = await ctx.newPage();
    const errors = [];
    pg.on("pageerror", (e) => errors.push(String(e)));
    await pg.goto(`http://localhost:${port}/index.html#overview`, { waitUntil: "networkidle" });
    await pg.evaluate(() => document.fonts.ready);
    /* Walk down so every tile mounts (each mounts a screen ahead), then let the last chunks land. */
    let end = await pg.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < end; y += Math.round(height * 0.8)) {
      await pg.evaluate((y) => scrollTo(0, y), y);
      await pg.waitForTimeout(120);
      end = await pg.evaluate(() => document.documentElement.scrollHeight);
    }
    await pg.waitForLoadState("networkidle");
    await pg.waitForTimeout(800);
    const r = await pg.evaluate(inspect);
    count = r.count;
    const where = `${theme} · ${label}`;
    if (r.fills.length > 1) problems.push(`${where}: ${r.fills.length} accent fills, the wall allows one: ${r.fills.join(", ")}`);
    for (const c of r.close) problems.push(`${where}: two accent fills within one screen (R6): ${c}`);
    if (r.pageWide) problems.push(`${where}: the page scrolls sideways`);
    if (r.mains !== 1) problems.push(`${where}: ${r.mains} main landmarks; the page has one (AppShell's mainLandmark={false} in a tile)`);
    if (r.h1s !== 1) problems.push(`${where}: ${r.h1s} h1s; the page title is the one`);
    if (r.twice.length) problems.push(`${where}: landmarks share a name: ${r.twice.join(", ")}`);
    if (r.names.length) problems.push(`${where}: tiles without their name as an h2: ${r.names.join(", ")}`);
    if (r.sideways.length) problems.push(`${where}: tiles scroll sideways: ${r.sideways.join(", ")}`);
    if (r.empty.length) problems.push(`${where}: tiles draw nothing: ${r.empty.join(", ")}`);
    for (const e of errors) problems.push(`${where}: ${e}`);
    await ctx.close();
  }
}
await browser.close();
server.close();

if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nwall: ${problems.length} problem${problems.length === 1 ? "" : "s"}.`);
  process.exit(1);
}
console.log(`wall: ${count} tiles, light and dark, desktop and phone: one accent fill on the wall and none within a screen of another, nothing sideways or empty, one main and one h1, landmarks named apart.`);
