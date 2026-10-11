#!/usr/bin/env node
/**
 * Screenshot a gallery page from a build, in light and dark, desktop and phone.
 *
 *   node scripts/shot.mjs --dist .agent-dist/me --page menu --out .agent-shots/me \
 *     [--click "button:has-text('Open')"]... [--keys ArrowDown,ArrowDown] [--hover "sel"] [--wait 600]
 *
 * Prints console errors, horizontal overflow and the files written.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const all = (k) => args.flatMap((a, i) => (a === `--${k}` ? [args[i + 1]] : []));
const dist = path.resolve(get("dist", "dist"));
const page = get("page", "overview");
const out = path.resolve(get("out", ".agent-shots"));
const wait = Number(get("wait", "500"));
const clicks = all("click"), hovers = all("hover");
const keys = (get("keys", "") || "").split(",").filter(Boolean);

let chromium;
try { ({ chromium } = await import("playwright")); }
catch { ({ chromium } = createRequire(import.meta.url)("/opt/node22/lib/node_modules/playwright")); }

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: fs.existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome") ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" : undefined });
const report = [];
for (const [w, h, label] of [[1440, 900, "desktop"], [390, 844, "phone"]]) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: "no-preference", hasTouch: label === "phone" });
    const pg = await ctx.newPage();
    const errors = [];
    pg.on("pageerror", (e) => errors.push(String(e)));
    pg.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await pg.goto(`http://localhost:${port}/index.html#${page}`, { waitUntil: "networkidle" });
    await pg.evaluate(() => document.fonts.ready);
    for (const sel of hovers) await pg.hover(sel).catch((e) => errors.push(`hover ${sel}: ${e.message.split("\n")[0]}`));
    for (const sel of clicks) await pg.click(sel).catch((e) => errors.push(`click ${sel}: ${e.message.split("\n")[0]}`));
    for (const k of keys) await pg.keyboard.press(k);
    await pg.waitForTimeout(wait);
    const overflow = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const file = path.join(out, `${page}-${label}-${theme}.png`);
    await pg.screenshot({ path: file, fullPage: true });
    report.push({ file: path.relative(process.cwd(), file), overflowPx: overflow, errors });
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(JSON.stringify(report, null, 1));
