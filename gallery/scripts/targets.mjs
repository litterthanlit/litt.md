#!/usr/bin/env node
/**
 * Target check (plans/audits/README.md, the tap fault): a touch target (`litt-target`, tokens.css) grows a control's
 * place for a finger with an absolute ::before, so the control must be positioned. One that is not hands its ::before to
 * the nearest positioned ancestor, where it covers the list, or the whole screen, and takes every tap. Every other page
 * check uses a mouse, so only this one sees it. From a build, in light.
 *
 *   npm run build && npm run test:targets
 *   node scripts/targets.mjs --dist dist --pages press,press/button
 *   node scripts/targets.mjs --shard 2/3              a third of the pages
 *   node scripts/targets.mjs --self-test              with every target unpositioned again, each page must fail it
 *
 * It loads every address in routes.mjs at 390 by 844 with touch, opens Variants, and fails if a visible element with
 * the class computes `position: static`, or if the point at the middle of a visible target lands on another control.
 *
 * Needs Playwright, found as a11y.mjs finds it (A11Y_TOOLS, then here, then the cloud container's global copy).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { routes, openVariants } from "./routes.mjs";
import { parseShard, shardOf } from "./shard.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const dist = path.resolve(get("dist", "dist"));
const selfTest = args.includes("--self-test");
const only = (get("pages", selfTest ? "press,press/button" : "") || "").split(",").filter(Boolean);
const CONCURRENCY = Number(get("concurrency", "6"));
const { shard, shards } = parseShard(get("shard", "1/1"));
const WIDTH = 390;
const HEIGHT = 844;

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

const all = routes({ only });
const pages = shardOf(all, { shard, shards, costs: {} });
if (!pages.length) { console.error("No pages matched."); process.exit(1); }

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, colorScheme: "light", isMobile: true, hasTouch: true });
if (selfTest) {
  /* Every target unpositioned again, as the contract's rows and the top row's links were. */
  await ctx.addInitScript(() => {
    const add = () => {
      if (!document.head || document.getElementById("targets-self-test")) return;
      const style = document.createElement("style");
      style.id = "targets-self-test";
      style.textContent = ".litt-target { position: static !important; }";
      document.head.append(style);
    };
    new MutationObserver(add).observe(document, { childList: true, subtree: true });
    add();
  });
}

const found = [];
async function checkPage(id) {
  const pg = await ctx.newPage();
  try {
    await pg.goto(`http://localhost:${port}/index.html#${id}`, { waitUntil: "domcontentloaded" });
    await pg.waitForSelector("main", { timeout: 15_000 });
    await pg.waitForLoadState("networkidle").catch(() => {});
    await openVariants(pg).catch(() => {});
    await pg.evaluate(() => document.fonts.ready);
    await pg.evaluate(() => window.scrollTo(0, 0));
    const bad = await pg.evaluate(() => {
      const say = (el) => `<${el.tagName.toLowerCase()}> "${(el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30)}"`;
      const out = [];
      for (const el of document.querySelectorAll(".litt-target")) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const s = getComputedStyle(el);
        if (s.visibility === "hidden" || s.pointerEvents === "none") continue;
        if (s.position === "static") { out.push(`${say(el)} is a touch target with position: static`); continue; }
        /* In the first screen and not covered by a sticky bar: the point at its middle is its own. */
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) continue;
        const hit = document.elementFromPoint(x, y);
        const control = hit?.closest("a, button, [role=button], [role=tab], [role=radio], [role=option], [role=menuitem], [role=slider], [role=switch]");
        if (control && control !== el && !el.contains(control) && !control.contains(el) && control.classList.contains("litt-target")) out.push(`a finger on ${say(el)} lands on ${say(control)}`);
      }
      return out;
    });
    for (const what of bad.slice(0, 4)) found.push({ id, what });
    if (bad.length > 4) found.push({ id, what: `and ${bad.length - 4} more` });
  } catch (e) {
    found.push({ id, what: `running the check: ${String(e.message || e).split("\n")[0]}` });
  } finally {
    await pg.close();
  }
}

const started = Date.now();
const queue = [...pages];
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
  while (queue.length) await checkPage(queue.shift());
}));
await browser.close();
server.close();
const took = `${Math.round((Date.now() - started) / 1000)}s`;
const which = shards > 1 ? ` (shard ${shard}/${shards})` : "";

if (selfTest) {
  const caught = [...new Set(found.filter((f) => /position: static/.test(f.what)).map((f) => f.id))];
  const missed = pages.filter((id) => !caught.includes(id));
  console.log(`targets self-test: with every target unpositioned, the check failed ${caught.length} of ${pages.length} pages (${took}).`);
  if (missed.length) { console.log(`✗ not caught on ${missed.join(", ")}: the check has gone blind.`); process.exit(1); }
  process.exit(0);
}

if (!found.length) {
  console.log(`targets${which}: ${pages.length} pages at ${WIDTH}px with touch, every touch target is positioned and takes its own taps (${took}).`);
  process.exit(0);
}
for (const f of found) console.log(`✗ ${f.id}: ${f.what}`);
console.log(`\ntargets${which}: ${new Set(found.map((f) => f.id)).size} of ${pages.length} pages have a touch target that is not positioned or takes another's taps.`);
process.exit(1);
