#!/usr/bin/env node
/**
 * Forced colors check (WCAG 1.4.11, 2.4.7): under Windows High Contrast and other forced color modes, the row a
 * keyboard is on, the selected tab and the current code cell still look different from the rest. From a build, in
 * light and dark.
 *
 *   npm run build && npm run test:forced-colors
 *   node scripts/forced-colors.mjs --dist dist --pages menu,tabs
 *   node scripts/forced-colors.mjs --self-test       the highlights put back as they were must fail it
 *
 * Forced colors drop every background and shadow an author sets, so a highlight drawn as a fill or a ring vanishes
 * unless it opts out with Highlight and HighlightText (glide.tsx, menu.tsx, tabs.tsx, code-input.tsx). On menu,
 * select, combobox, command menu and context menu it opens the page's first trigger by keyboard (Enter, ArrowDown
 * into a combobox, Shift+F10 on the context menu's target), presses ArrowDown, and screenshots the lit row and a row
 * two away. On tabs it takes the selected tab and another tab in its list; on code input, the current
 * cell of a focused, empty field and its last cell. A highlight is seen when one shot has at least MIN of its
 * pixels in colors the other barely has (each channel in 8 steps, so text antialiasing falls into a handful of
 * bins and both shots carry the same text colors). Two rows that differ only in their words stay well under it.
 *
 * The self-test injects CSS that puts the highlights back as they were (the glide ring with no fill, the lit rows in
 * CanvasText and the tab's mark (the folder tab's face, the bubble or the lamp) with its Highlight border, left to forced-color-adjust: auto, no outline on the current cell) and fails if any
 * page still passes.
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
const only = (get("pages", "") || "").split(",").filter(Boolean);
const selfTest = args.includes("--self-test");
const MIN = 0.04;

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

const ROW = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"]';
const LIT = "[data-highlighted], [data-active]";
const BROKEN = [
  "[data-ring]{background:transparent!important;forced-color-adjust:auto!important}",
  "[data-highlighted],[data-active],[data-highlighted] *,[data-active] *{forced-color-adjust:auto!important;color:CanvasText!important}",
  '[role="tab"]>[aria-hidden="true"]{forced-color-adjust:auto!important;background:transparent!important;border-width:0!important}',
  'main [aria-hidden="true"]>span{outline:none!important}',
].join("\n");

/**
 * Each case opens what it needs and marks two elements, data-fc="lit" and data-fc="other", in the page. clip turns
 * each one's box into the part to compare: the whole row, the whole tab, a cell and the
 * outline around it.
 */
const MENU = (trigger, open) => ({
  clip: (b) => b,
  async arrange(pg) {
    const t = pg.locator(trigger).first();
    await t.focus();
    await pg.keyboard.press(open);
    await pg.waitForSelector(ROW, { timeout: 5000 });
    await pg.waitForTimeout(150);
    await pg.keyboard.press("ArrowDown");
    await pg.waitForTimeout(300);
    return pg.evaluate(({ ROW, LIT }) => {
      const rows = [...document.querySelectorAll(ROW)].filter((r) => r.getClientRects().length && !r.closest("main [aria-hidden='true']"));
      const i = rows.findIndex((r) => r.matches(LIT));
      if (i < 0) return "no row is lit after ArrowDown";
      const other = rows[i + 2] ?? rows[i - 2] ?? rows[i + 1] ?? rows[i - 1];
      if (!other) return "only one row";
      rows[i].setAttribute("data-fc", "lit");
      other.setAttribute("data-fc", "other");
      return "";
    }, { ROW, LIT });
  },
});
const CASES = {
  menu: MENU('main [aria-haspopup="menu"]', "Enter"),
  select: MENU('main button[role="combobox"]', "Enter"),
  combobox: MENU('main input[role="combobox"]', "ArrowDown"),
  "command-menu": MENU('main [role="tabpanel"] button', "Enter"),
  "context-menu": MENU('main [role="tabpanel"] button', "Shift+F10"),
  /* The whole tab: each world draws the current one its own way (Press a folder tab standing forward, Flat a bubble,
     Device a lamp), and in forced colors each must still tell it from its neighbour. */
  tabs: {
    clip: (b) => b,
    arrange: (pg) => pg.evaluate(() => {
      const tab = document.querySelector('main [role="tablist"] [role="tab"][aria-selected="true"]');
      if (!tab) return "no selected tab";
      const other = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')].find((t) => t !== tab);
      tab.setAttribute("data-fc", "lit");
      other.setAttribute("data-fc", "other");
      return "";
    }),
  },
  "code-input": {
    clip: (b) => ({ x: b.x - 6, y: b.y - 6, width: b.width + 12, height: b.height + 12 }),
    async arrange(pg) {
      await pg.locator("main section[aria-label] input").first().focus();
      await pg.waitForTimeout(200);
      return pg.evaluate(() => {
        const cells = [...document.activeElement.parentElement.querySelectorAll(':scope > [aria-hidden="true"] > span')];
        if (cells.length < 3) return "no code cells beside the focused input";
        cells[0].setAttribute("data-fc", "lit");
        cells.at(-1).setAttribute("data-fc", "other");
        return "";
      });
    },
  },
};
const pages = Object.keys(CASES).filter((id) => !only.length || only.includes(id));
if (!pages.length) { console.error("No pages matched."); process.exit(1); }

/* Runs on a blank page: the share of each shot's pixels in colors the other shot has under 0.5% of, either way. */
function apart([a, b]) {
  const load = (src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      const { data } = g.getImageData(0, 0, c.width, c.height);
      const bins = new Map();
      for (let i = 0; i < data.length; i += 4) {
        const k = ((data[i] >> 5) << 6) | ((data[i + 1] >> 5) << 3) | (data[i + 2] >> 5);
        bins.set(k, (bins.get(k) || 0) + 1);
      }
      const n = data.length / 4;
      for (const [k, v] of bins) bins.set(k, v / n);
      resolve(bins);
    };
    img.src = `data:image/png;base64,${src}`;
  });
  const own = (x, y) => [...x].reduce((s, [k, v]) => s + (v >= 0.01 && (y.get(k) || 0) < 0.005 ? v : 0), 0);
  return Promise.all([load(a), load(b)]).then(([x, y]) => Math.max(own(x, y), own(y, x)));
}

const browser = await chromium.launch();
const scratch = await browser.newPage();
const found = [];
const seen = [];
const started = Date.now();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, forcedColors: "active", colorScheme: theme, reducedMotion: "reduce" });
  await Promise.all(pages.map(async (id) => {
    const pg = await ctx.newPage();
    try {
      await pg.goto(`http://localhost:${port}/index.html#${id}`, { waitUntil: "domcontentloaded" });
      await pg.waitForSelector("main h1", { timeout: 15_000 });
      await pg.waitForLoadState("networkidle");
      if (selfTest) await pg.addStyleTag({ content: BROKEN });
      await pg.evaluate(() => document.fonts.ready);
      const why = await CASES[id].arrange(pg);
      if (why) throw new Error(why);
      const shot = async (which) => {
        const box = await pg.locator(`[data-fc="${which}"]`).boundingBox();
        return (await pg.screenshot({ clip: CASES[id].clip(box) })).toString("base64");
      };
      const d = await scratch.evaluate(apart, [await shot("lit"), await shot("other")]);
      seen.push(`${id} ${theme} ${Math.round(d * 100)}%`);
      if (d < MIN) found.push({ id, theme, what: `the highlight looks like the rest: only ${(d * 100).toFixed(1)}% of its pixels differ in color, under ${MIN * 100}%` });
    } catch (e) {
      found.push({ id, theme, what: `running the check: ${String(e.message || e).split("\n")[0]}`, broke: true });
    }
    await pg.close();
  }));
  await ctx.close();
}
await browser.close();
server.close();
const took = `${Math.round((Date.now() - started) / 1000)}s`;

if (selfTest) {
  const broke = found.filter((f) => f.broke);
  const missed = pages.flatMap((id) => ["light", "dark"].filter((t) => !found.some((f) => f.id === id && f.theme === t && !f.broke)).map((t) => `${id} · ${t}`));
  console.log(`forced colors self-test: with the old highlights, ${found.length - broke.length} of ${pages.length * 2} highlights look like the rest (${seen.join(", ")}; ${took}).`);
  for (const f of broke) console.log(`✗ ${f.id} · ${f.theme}: ${f.what}`);
  if (missed.length) console.log(`✗ still told apart on ${missed.join(", ")}: the check has gone blind.`);
  process.exit(missed.length || broke.length ? 1 : 0);
}

if (!found.length) {
  console.log(`forced colors: ${pages.length} pages, light and dark, every highlight stands apart (${seen.join(", ")}; ${took}).`);
  process.exit(0);
}
for (const f of found) console.log(`✗ ${f.id} · ${f.theme}: ${f.what}`);
console.log(`\nforced colors: ${found.length} findings on ${new Set(found.map((f) => f.id)).size} of ${pages.length} pages.`);
process.exit(1);
