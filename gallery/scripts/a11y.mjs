#!/usr/bin/env node
/**
 * Accessibility check: axe-core on every gallery page, from a build, in light and dark, desktop and phone.
 *
 *   npm run build && npm run test:a11y               # every page in dist/
 *   node scripts/a11y.mjs --dist dist --pages button,menu
 *
 * Runs the WCAG 2.0, 2.1 and 2.2 A and AA rules and exits 1 on any violation, printing each one with
 * its page, theme, viewport and the selectors it hit. Pages come from src/gallery/pages (the file is
 * <NN>-<id>.tsx, and the id is the route). It renders each page as loaded: overlays that open on a
 * click are not covered here.
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

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const browser = await chromium.launch();
const found = [];
let runs = 0;
for (const [width, height, label] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme, hasTouch: label === "phone", isMobile: label === "phone" });
    const pg = await ctx.newPage();
    const errors = [];
    pg.on("pageerror", (e) => errors.push(String(e)));
    for (const id of pages) {
      await pg.goto(`http://localhost:${port}/index.html#${id}`, { waitUntil: "networkidle" });
      await pg.reload({ waitUntil: "networkidle" }); // a hash change alone keeps the last page's state
      await pg.evaluate(() => document.fonts.ready);
      await pg.waitForSelector("h1", { timeout: 10_000 });
      await pg.waitForTimeout(400); // let entrances settle, so axe reads the resting colors
      await pg.addScriptTag({ content: axeSource });
      const violations = await pg.evaluate(async (tags) => {
        const r = await window.axe.run(document, { runOnly: { type: "tag", values: tags }, resultTypes: ["violations"] });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(" ")) }));
      }, TAGS);
      runs++;
      for (const v of violations) found.push({ page: id, theme, viewport: label, ...v });
      for (const e of errors.splice(0)) found.push({ page: id, theme, viewport: label, id: "page-error", impact: "critical", help: e, nodes: [] });
    }
    await ctx.close();
  }
}
await browser.close();
server.close();

if (!found.length) {
  console.log(`a11y: ${pages.length} pages, ${runs} runs (light and dark, desktop and phone), no violations.`);
  process.exit(0);
}
for (const v of found) {
  console.log(`✗ ${v.page} · ${v.theme} · ${v.viewport} · ${v.id} (${v.impact}): ${v.help}`);
  for (const n of v.nodes.slice(0, 5)) console.log(`    ${n}`);
  if (v.nodes.length > 5) console.log(`    …and ${v.nodes.length - 5} more`);
}
console.log(`\na11y: ${found.length} violations across ${new Set(found.map((v) => v.page)).size} of ${pages.length} pages.`);
process.exit(1);
