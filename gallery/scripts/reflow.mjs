#!/usr/bin/env node
/**
 * Reflow check (WCAG 1.4.10): every page fits a 320px phone without scrolling sideways, from a build, in light.
 *
 *   npm run build && npm run test:reflow
 *   node scripts/reflow.mjs --dist dist --pages date-picker,select
 *   node scripts/reflow.mjs --self-test       a 420px block in one page's main must fail it
 *
 * It loads each page at 320 by 640 with touch, waits for the fonts and the lazy chunks, and fails when the document
 * is wider than the viewport (scrollWidth above clientWidth by more than a pixel). For each failure it prints the
 * outermost elements whose right edge passes the viewport's. An element inside a horizontal scroller (a table's
 * wrap, a code block: anything with overflow-x other than visible) scrolls on its own and is fine, and so is
 * anything fixed, which never widens the page.
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
const only = (get("pages", selfTest ? "button" : "") || "").split(",").filter(Boolean);
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

/* Read in the page: how far it scrolls sideways, and the outermost elements that stick out past the right edge. */
function measure() {
  const root = document.documentElement;
  const cw = root.clientWidth;
  const scrolls = (el) => !["visible", ""].includes(getComputedStyle(el).overflowX);
  const contained = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) if (scrolls(p)) return true;
    return false;
  };
  const out = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.right + scrollX > cw + 1;
  };
  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 4).join(".") : "";
    const text = (el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 32);
    return `<${el.tagName.toLowerCase()}${cls ? "." + cls : ""}>${text ? ` "${text}"` : ""} reaches ${Math.round(el.getBoundingClientRect().right + scrollX)}px`;
  };
  const culprits = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (!out(el) || contained(el) || getComputedStyle(el).position === "fixed" || el.closest("[hidden]")) continue;
    const parent = el.parentElement;
    if (parent && parent !== document.body && out(parent) && !scrolls(parent)) continue;
    culprits.push(describe(el));
    if (culprits.length >= 4) break;
  }
  return { over: root.scrollWidth - cw, culprits };
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, colorScheme: "light", isMobile: true, hasTouch: true });
if (selfTest) {
  await ctx.addInitScript(() => {
    new MutationObserver((_, obs) => {
      const main = document.querySelector("main h1") && document.querySelector("main");
      if (!main) return;
      obs.disconnect();
      const wide = document.createElement("div");
      wide.setAttribute("data-reflow-self-test", "");
      wide.textContent = "self-test";
      wide.style.width = "420px";
      main.append(wide);
    }).observe(document, { childList: true, subtree: true });
  });
}

const found = [];
async function checkPage(id) {
  const pg = await ctx.newPage();
  try {
    await pg.goto(`http://localhost:${port}/index.html#${id}`, { waitUntil: "domcontentloaded" });
    await pg.waitForSelector("main h1", { timeout: 15_000 });
    await pg.waitForLoadState("networkidle");
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(300);
    const r = await pg.evaluate(measure);
    if (r.over > 1) found.push({ id, what: `scrolls ${r.over}px sideways${r.culprits.length ? `: ${r.culprits.join("; ")}` : ""}` });
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
  const caught = found.filter((f) => /self-test/.test(f.what)).map((f) => f.id);
  const missed = pages.filter((id) => !caught.includes(id));
  console.log(`reflow self-test: a 420px block in main was caught on ${caught.length} of ${pages.length} pages (${took}).`);
  if (missed.length) { console.log(`✗ not caught on ${missed.join(", ")}: the check has gone blind.`); process.exit(1); }
  process.exit(0);
}

if (!found.length) {
  console.log(`reflow: ${pages.length} pages at 320px, none scrolls sideways (${took}).`);
  process.exit(0);
}
for (const f of found) console.log(`✗ ${f.id}: ${f.what}`);
console.log(`\nreflow: ${found.length} of ${pages.length} pages scroll sideways at 320px.`);
process.exit(1);
