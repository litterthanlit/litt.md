#!/usr/bin/env node
/**
 * Gaps check: no dead space between the rows of a clickable list, from a build. Rauno Freiberg's rule
 * (interfaces.rauno.me): a pointer moving down a menu, a nav or a list of rows is always on one, so the hover never
 * flickers off and on, and a click between two rows still lands.
 *
 *   npm run build && npm run test:gaps
 *   node scripts/gaps.mjs --dist dist --pages app-shell,list
 *   node scripts/gaps.mjs --self-test       two buttons 8px apart, put in one page's main, must fail it
 *
 * It loads each page at 1280 by 900 and finds clickable rows stacked in one list (links and buttons that are the
 * only clickable thing in their list item, menu items, options and tree items): two neighbours that line up on the
 * left, one under the other, less than 24px apart. Between them it asks the page what is under the pointer
 * (elementFromPoint, so an invisible ::before or ::after that reaches across counts), at the middle of the gap and
 * at a quarter in from each end, and fails when one of those points is on neither row.
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

/* Read in the page: every gap between two stacked clickable rows that a pointer can fall into. */
function measure() {
  const main = document.querySelector("main");
  if (!main) return [];
  const visible = (e) => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility === "visible" && !e.closest("[hidden],[inert],[aria-hidden=true]");
  };
  const clickable = "a[href], button, [role=menuitem], [role=option], [role=treeitem]";
  const rows = [...main.querySelectorAll(`li > a[href], li > button, [role=menuitem], [role=option], [role=treeitem]`)].filter((e) => {
    if (!visible(e)) return false;
    const li = e.closest("li");
    return !li || li.querySelectorAll(clickable).length === 1; // a row, not one of several buttons in an item
  });
  const lists = new Map();
  for (const e of rows) {
    const list = e.closest("ul, ol, [role=listbox], [role=menu], [role=tree]") || e.parentElement;
    lists.set(list, [...(lists.get(list) || []), e]);
  }
  const describe = (e) => `<${e.tagName.toLowerCase()}> "${(e.getAttribute("aria-label") || e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24)}"`;
  const found = [];
  for (const group of lists.values()) {
    for (let i = 1; i < group.length; i++) {
      const a = group[i - 1];
      const b = group[i];
      const A = a.getBoundingClientRect();
      const B = b.getBoundingClientRect();
      const gap = B.top - A.bottom;
      if (gap <= 0.5 || gap >= 24 || Math.abs(A.left - B.left) > 2) continue;
      a.scrollIntoView({ block: "center" });
      const A2 = a.getBoundingClientRect();
      const y = A2.bottom + gap / 2;
      const xs = [A2.left + A2.width / 4, A2.left + A2.width / 2, A2.left + (A2.width * 3) / 4];
      const dead = xs.some((x) => {
        const t = document.elementFromPoint(x, y);
        return !(t && (a.contains(t) || b.contains(t)));
      });
      if (dead) {
        const test = a.closest("[data-gaps-self-test]") ? "self-test " : "";
        found.push(`${test}${gap.toFixed(1)}px between ${describe(a)} and ${describe(b)} is on neither`);
        break; // one per list is enough to name it
      }
    }
  }
  return found;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "light", reducedMotion: "reduce" });
if (selfTest) {
  await ctx.addInitScript(() => {
    new MutationObserver((_, obs) => {
      const main = document.querySelector("main h1") && document.querySelector("main");
      if (!main) return;
      obs.disconnect();
      const list = document.createElement("ul");
      list.setAttribute("data-gaps-self-test", "");
      list.style.cssText = "display:grid;gap:8px;width:240px;list-style:none;padding:0";
      for (const word of ["One", "Two"]) {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.textContent = word;
        button.style.cssText = "display:block;width:100%;height:32px";
        li.append(button);
        list.append(li);
      }
      main.append(list);
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
    for (const what of await pg.evaluate(measure)) found.push({ id, what });
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
  const caught = new Set(found.filter((f) => /^self-test /.test(f.what)).map((f) => f.id));
  const missed = pages.filter((id) => !caught.has(id));
  console.log(`gaps self-test: two buttons 8px apart were caught on ${caught.size} of ${pages.length} pages (${took}).`);
  if (missed.length) { console.log(`✗ not caught on ${missed.join(", ")}: the check has gone blind.`); process.exit(1); }
  process.exit(0);
}

if (!found.length) {
  console.log(`gaps: ${pages.length} pages, no dead space between the rows of a clickable list (${took}).`);
  process.exit(0);
}
for (const f of found) console.log(`✗ ${f.id}: ${f.what}`);
console.log(`\ngaps: ${new Set(found.map((f) => f.id)).size} of ${pages.length} pages have dead space between clickable rows.`);
process.exit(1);
