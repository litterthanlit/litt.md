#!/usr/bin/env node
/**
 * Jump check (plans/audits/heat.md, finding 9): a part's page on a phone runs fifteen screens, so every part's page in
 * every world has a link to Install in its first screen, and following it lands on Install. From a build, in light.
 *
 *   npm run build && npm run test:jump
 *   node scripts/jump.mjs --dist dist --pages slider,table
 *   node scripts/jump.mjs --shard 2/3                 a third of the pages
 *   node scripts/jump.mjs --self-test                 with the jump row taken out, every Slider page must fail it
 *
 * It loads each part's page (every address in routes.mjs whose page has docs, so a block's page, which has none, is
 * left out) at 390 by 844 with touch, and fails unless a link named Install in main is visible within the first 844px,
 * and a tap on it leaves the Install heading (main h2#install) in the viewport with focus on it.
 *
 * Needs Playwright, found as a11y.mjs finds it (A11Y_TOOLS, then here, then the cloud container's global copy).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { routes, WORLD_IDS } from "./routes.mjs";
import { parseShard, shardOf } from "./shard.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const dist = path.resolve(get("dist", "dist"));
const selfTest = args.includes("--self-test");
const only = (get("pages", selfTest ? "slider" : "") || "").split(",").filter(Boolean);
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

/* The pages that pass `docs` to <Page>: a part's page, with Install, Usage, Props and the rest under its stages. */
const PAGES_DIR = path.join(here, "..", "src", "gallery", "pages");
const withDocs = new Set(
  fs.readdirSync(PAGES_DIR)
    .filter((f) => /^\d+-.+\.tsx$/.test(f))
    .map((f) => fs.readFileSync(path.join(PAGES_DIR, f), "utf8"))
    .filter((src) => /\bdocs=\{/.test(src))
    .map((src) => /export\s+const\s+meta\b[\s\S]*?\bid:\s*"([^"]+)"/.exec(src)?.[1])
    .filter(Boolean),
);
const parts = routes({ only }).filter((r) => {
  const [world, id] = r.split("/");
  return WORLD_IDS.includes(world) && id && withDocs.has(id);
});
const pages = shardOf(parts, { shard, shards, costs: {} });
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
  /* Take the jump row out, every time it is drawn. */
  await ctx.addInitScript(() => {
    new MutationObserver(() => {
      for (const nav of document.querySelectorAll("nav[data-jump]")) nav.remove();
    }).observe(document, { childList: true, subtree: true });
  });
}

const found = [];
async function checkPage(id) {
  const pg = await ctx.newPage();
  try {
    await pg.goto(`http://localhost:${port}/index.html#${id}`, { waitUntil: "domcontentloaded" });
    await pg.waitForSelector("main h1", { timeout: 15_000 });
    /* The docs layer is lazy: once its Install title is drawn, everything the row jumps to is there. */
    await pg.waitForSelector("main h2#install", { state: "attached", timeout: 15_000 }).catch(() => {});
    await pg.evaluate(() => document.fonts.ready);
    await pg.evaluate(() => window.scrollTo(0, 0));
    const link = pg.locator("main a").filter({ hasText: /^Install$/ }).filter({ visible: true }).first();
    if (!(await link.count())) {
      found.push({ id, what: "no link named Install in main" });
      return;
    }
    const box = await link.boundingBox();
    if (!box || box.y < 0 || box.y + box.height > HEIGHT) {
      found.push({ id, what: `the link to Install is not in the first screen (its top is at ${Math.round(box?.y ?? -1)}px)` });
      return;
    }
    await link.tap({ timeout: 2000 });
    await pg.waitForFunction(() => document.activeElement?.id === "install", null, { timeout: 2000 }).catch(() => {});
    await pg.waitForTimeout(50); // the scroll follows focus by a frame
    const r = await pg.evaluate(() => {
      const h = document.querySelector("main h2#install");
      if (!h) return { what: "no Install heading (main h2#install)" };
      const top = h.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight - 20) return { what: `after the jump the Install heading is at ${Math.round(top)}px, out of view` };
      if (document.activeElement !== h) return { what: `after the jump focus is on ${document.activeElement?.tagName.toLowerCase()}, not the Install heading` };
      return null;
    });
    if (r) found.push({ id, what: r.what });
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
  const caught = found.filter((f) => /no link named Install/.test(f.what)).map((f) => f.id);
  const missed = pages.filter((id) => !caught.includes(id));
  console.log(`jump self-test: with the jump row taken out, the check failed ${caught.length} of ${pages.length} pages (${took}).`);
  if (missed.length) { console.log(`✗ not caught on ${missed.join(", ")}: the check has gone blind.`); process.exit(1); }
  process.exit(0);
}

if (!found.length) {
  console.log(`jump${which}: ${pages.length} part pages at ${WIDTH}px, each links to Install in its first screen and lands on it (${took}).`);
  process.exit(0);
}
for (const f of found) console.log(`✗ ${f.id}: ${f.what}`);
console.log(`\njump${which}: ${found.length} of ${pages.length} part pages cannot jump to Install at ${WIDTH}px.`);
process.exit(1);
