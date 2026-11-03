#!/usr/bin/env node
/**
 * Text zoom check (WCAG 1.4.4): at 200% text size no line of text runs into the next, on every page, from a build.
 *
 *   npm run build && npm run test:text-zoom
 *   node scripts/text-zoom.mjs --dist dist --pages button,form
 *   node scripts/text-zoom.mjs --self-test    the old 22px body leading must fail it
 *
 * It loads each page at 1280 by 900, sets html{font-size:200%}, as a reader's larger text does, and reads every
 * visible element in main that holds text of its own. It fails when one's line height is under 0.95 times its font
 * size: a leading set in px stays put while the text doubles, so the lines overlap. Leading in rem or a unitless
 * number grows with the text. Visually hidden text (sr-only, a 1px clip) and line-height: normal are skipped.
 *
 * The self-test puts back `--type-body-leading: 22px`, the leading before it was rem, on a few pages, and fails if
 * any of them passes.
 *
 * Needs Playwright, found as a11y.mjs finds it (A11Y_TOOLS, then here, then the cloud container's global copy).
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
const only = (get("pages", selfTest ? "button,form,table,settings" : "") || "").split(",").filter(Boolean);
const CONCURRENCY = Number(get("concurrency", "4"));

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

const pages = fs.readdirSync(path.join(here, "../src/gallery/pages"))
  .map((f) => /^\d+-(.+)\.tsx$/.exec(f)?.[1])
  .filter(Boolean)
  .filter((id) => !only.length || only.includes(id));
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

const ZOOM = "html{font-size:200% !important}";
const OLD_LEADING = ":root{--type-body-leading:22px}";

/* Read in the page: visible text whose line height is less than its font size, so its lines would overlap. */
function measure() {
  const hidden = (el) => {
    if (el.closest(".sr-only, [hidden]")) return true;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return true;
    return getComputedStyle(el).visibility !== "visible";
  };
  const own = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const tight = [];
  let read = 0;
  for (const el of document.querySelectorAll("main *")) {
    if (!own(el) || hidden(el)) continue;
    read++;
    const cs = getComputedStyle(el);
    if (cs.lineHeight === "normal") continue;
    const size = parseFloat(cs.fontSize);
    const leading = parseFloat(cs.lineHeight);
    if (leading >= size * 0.95) continue;
    const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 32);
    tight.push(`<${el.tagName.toLowerCase()}> "${text}" is ${size}px on a ${leading}px line`);
  }
  return { read, tight };
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

const found = [];
let read = 0;
async function checkPage(id) {
  const pg = await ctx.newPage();
  try {
    await pg.goto(`http://localhost:${port}/index.html#${id}`, { waitUntil: "domcontentloaded" });
    await pg.waitForSelector("main h1", { timeout: 15_000 });
    await pg.waitForLoadState("networkidle");
    await pg.addStyleTag({ content: selfTest ? ZOOM + OLD_LEADING : ZOOM });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(200);
    const r = await pg.evaluate(measure);
    read += r.read;
    if (r.tight.length) found.push({ id, what: `${r.tight.length} overlapping: ${r.tight.slice(0, 4).join("; ")}` });
  } catch (e) {
    found.push({ id, what: `running the check: ${String(e.message || e).split("\n")[0]}` });
  }
  await pg.close();
}

const started = Date.now();
const queue = [...pages];
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
  while (queue.length) await checkPage(queue.shift());
}));
await browser.close();
server.close();
const took = `${Math.round((Date.now() - started) / 1000)}s`;

if (selfTest) {
  const caught = found.filter((f) => / overlapping: /.test(f.what)).map((f) => f.id);
  const missed = pages.filter((id) => !caught.includes(id));
  console.log(`text zoom self-test: the old 22px body leading was caught on ${caught.length} of ${pages.length} pages (${took}).`);
  if (missed.length) { console.log(`✗ not caught on ${missed.join(", ")}: the check has gone blind.`); process.exit(1); }
  process.exit(0);
}

if (!found.length) {
  console.log(`text zoom: ${pages.length} pages at 200% text, ${read} text elements, no lines overlap (${took}).`);
  process.exit(0);
}
for (const f of found) console.log(`✗ ${f.id}: ${f.what}`);
console.log(`\ntext zoom: lines overlap at 200% text on ${found.length} of ${pages.length} pages.`);
process.exit(1);
