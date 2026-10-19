#!/usr/bin/env node
/**
 * Reduced motion check: with prefers-reduced-motion on, nothing in the gallery moves. Every page, from a build, on
 * the desktop and on a phone.
 *
 *   npm run build && npm run test:motion
 *   node scripts/reduced-motion.mjs --dist dist --pages menu,dialog
 *   node scripts/reduced-motion.mjs --self-test       with motion allowed it must see motion (dialog, menu, toast, list)
 *
 * On each page it watches every element's transform and opacity frame by frame while the page loads, then clicks
 * the page's own triggers (anything with aria-haspopup, a closed disclosure, a Replay button, the first button of
 * each stage) and watches again,
 * on the page and in whatever opened. A value that changes on three frames in a row, each under 50ms after the
 * last, is motion; a jump from one state to another is not, however many jumps there are. It also fails any element left with a transition or animation duration above zero.
 *
 * tokens.css zeroes every duration, travel and stagger under reduced motion, and the motion hooks return zero
 * transitions without a provider (src/motion/index.tsx), so this should never find anything. It is here so that
 * stays true, and so the Markdown docs can say so.
 *
 * The one exception is the loading spinner (svg.animate-spin): its turn says "still working", which reduced motion
 * keeps, as the operating systems do.
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
const CONCURRENCY = Number(get("concurrency", "4"));
const MAX_TRIGGERS = Number(get("triggers", "8"));
/* --self-test runs with motion allowed and must find motion, so a check that has gone blind fails too. */
const selfTest = args.includes("--self-test");

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

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".md": "text/markdown", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

/* ------------------------------------------------------------ in the page */

/**
 * Installed before the page runs. window.__litt.watch(ms) samples transform and opacity of every element on every
 * frame for ms milliseconds and resolves with the elements that changed on three frames in a row, under 50ms apart; window.__litt.durations()
 * lists the elements left with a transition or animation that takes time.
 */
function install() {
  const ids = new WeakMap();
  let next = 0;
  const idOf = (el) => { if (!ids.has(el)) ids.set(el, ++next); return ids.get(el); };
  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 4).join(".") : "";
    const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    const label = el.getAttribute("aria-label") || el.getAttribute("data-testid") || "";
    return `<${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls ? "." + cls : ""}>${label ? ` [${label}]` : ""}${text ? ` "${text}"` : ""}`;
  };
  const exempt = (el) => el.closest("svg.animate-spin") !== null;
  // An identity is no transform at all: a press at scale 1 swaps "none" for the identity matrix and back, and nothing moves.
  const IDENTITY = new Set(["none", "matrix(1, 0, 0, 1, 0, 0)", "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)", "1", "1 1", "0px", "0px 0px", "0deg"]);
  const still = (v) => (IDENTITY.has(v) ? "none" : v);
  // The page's own content and whatever it opened (portals sit beside #root), not the gallery's sidebar and header:
  // fewer elements keep each sampled frame short, so a busy machine still samples motion frame by frame.
  const scope = () => {
    const main = document.querySelector("main");
    const outside = [...document.body.children].filter((c) => c.id !== "root" && c.tagName !== "SCRIPT");
    return [...(main ? [main, ...main.querySelectorAll("*")] : []), ...outside.flatMap((c) => [c, ...c.querySelectorAll("*")])];
  };
  window.__litt = {
    watch(ms) {
      return new Promise((resolve) => {
        // Motion is a change on RUN frames in a row, each less than GAP ms after the last: an opacity that keeps changing, or a
        // transform that keeps changing while the element's box on screen keeps moving with it. A jump (a toast
        // restacking, a popover placed after it mounts) changes once and holds, however many jumps there are. A
        // layout jump also flips its transform for one frame (Motion draws it at the old place, then the new) while
        // the box moves once, so it is a jump too. The time limit keeps two jumps apart on a busy machine.
        const GAP = 50;
        const RUN = 3;
        const seen = new Map(); // id -> { el, t, o, r, tAt, oAt, moving, values }
        const start = performance.now();
        const frame = () => {
          const now = performance.now();
          const all = scope();
          for (let i = 0; i < all.length && i < 6000; i++) {
            const el = all[i];
            const cs = getComputedStyle(el);
            if (cs.display === "none") continue;
            const tv = `${still(cs.transform)}|${still(cs.translate)}|${still(cs.scale)}|${still(cs.rotate)}`;
            const b = el.getBoundingClientRect();
            const rv = `${Math.round(b.x * 2)},${Math.round(b.y * 2)},${Math.round(b.width * 2)},${Math.round(b.height * 2)}`;
            const id = idOf(el);
            const rec = seen.get(id);
            if (!rec) { seen.set(id, { el, t: tv, o: cs.opacity, r: rv, tAt: -1, oAt: -1, tRun: 0, oRun: 0, moving: false, values: 1 }); continue; }
            const tMoved = tv !== rec.t && rv !== rec.r; // the transform changed and the box moved with it
            const oMoved = cs.opacity !== rec.o;
            // A run counts changes on back-to-back frames. Three in a row is motion; two can be a layout jump whose
            // correction landed a frame late on a busy machine (down, back, down), which no animation draws.
            rec.oRun = oMoved ? (rec.oAt >= 0 && now - rec.oAt < GAP ? rec.oRun + 1 : 1) : 0;
            rec.tRun = tMoved ? (rec.tAt >= 0 && now - rec.tAt < GAP ? rec.tRun + 1 : 1) : 0;
            if (rec.oRun >= RUN || rec.tRun >= RUN) rec.moving = true;
            rec.oAt = oMoved ? now : -1;
            rec.tAt = tMoved ? now : -1;
            if (tMoved || oMoved) rec.values++;
            rec.t = tv;
            rec.o = cs.opacity;
            rec.r = rv;
          }
          if (now - start < ms) requestAnimationFrame(frame);
          else {
            const moving = [...seen.values()].filter((r) => r.moving && r.el.isConnected && !exempt(r.el));
            resolve(moving.slice(0, 6).map((r) => `${describe(r.el)} moved through ${r.values} values`));
          }
        };
        requestAnimationFrame(frame);
      });
    },
    durations() {
      const out = [];
      for (const el of document.body.querySelectorAll("*")) {
        const cs = getComputedStyle(el);
        if (cs.display === "none" || exempt(el)) continue;
        const ms = (list) => Math.max(...list.split(",").map((s) => parseFloat(s) * (s.trim().endsWith("ms") ? 1 : 1000)));
        const t = cs.transitionProperty !== "none" ? ms(cs.transitionDuration) + ms(cs.transitionDelay) : 0;
        const a = cs.animationName !== "none" ? ms(cs.animationDuration) : 0;
        if (t > 0 || a > 0) out.push(`${describe(el)} has a ${t > 0 ? `${t}ms transition (${cs.transitionProperty})` : `${a}ms animation (${cs.animationName})`}`);
        if (out.length >= 6) break;
      }
      return out;
    },
  };
}

/**
 * The page's own triggers, inside the article (not the gallery's nav or header), in reading order: anything with
 * aria-haspopup, a closed disclosure, a Replay button, and the first plain button of each stage (it fires a toast,
 * starts a run, sends a message). Tabs, copy buttons and the Preview and Code switch are left alone.
 */
async function triggersOf(pg) {
  return pg.evaluate((max) => {
    const scope = document.querySelector("main article") || document.querySelector("main") || document.body;
    const usable = (el) => {
      if (el.closest("[hidden], [aria-hidden='true']") || el.disabled || el.getAttribute("aria-disabled") === "true") return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const plain = (el) =>
      el.tagName === "BUTTON" && !el.matches('[role="tab"], [role="radio"], [aria-pressed], [type="submit"]') &&
      !/copy|code|preview/i.test(`${el.getAttribute("aria-label") || ""} ${el.textContent || ""}`);
    const picked = [];
    for (const el of scope.querySelectorAll("button, [aria-haspopup]")) {
      if (!usable(el)) continue;
      if (el.matches('[aria-haspopup]:not([aria-haspopup="false"]), button[aria-expanded="false"]')) picked.push({ el, kind: el.getAttribute("aria-haspopup") || "disclosure" });
      else if (el.tagName === "BUTTON" && /^\s*replay\s*$/i.test(el.textContent || "")) picked.push({ el, kind: "replay" });
    }
    for (const stage of scope.querySelectorAll("section[aria-label]")) {
      const first = [...stage.querySelectorAll("button")].find((b) => usable(b) && plain(b) && !b.hasAttribute("aria-haspopup") && !b.hasAttribute("aria-expanded"));
      if (first && !/^\s*replay\s*$/i.test(first.textContent || "")) picked.push({ el: first, kind: "button" });
    }
    picked.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    const seen = new Set();
    const out = [];
    for (const { el, kind } of picked) {
      const name = `${kind}:${(el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30)}`;
      if (seen.has(name)) continue;
      seen.add(name);
      el.setAttribute("data-rm-trigger", String(out.length));
      out.push(name);
      if (out.length >= max) break;
    }
    return out;
  }, MAX_TRIGGERS);
}

/* ------------------------------------------------------------- the run */

const VIEWPORTS = [
  { label: "desktop", viewport: { width: 1440, height: 900 } },
  { label: "phone", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
];
const browser = await chromium.launch();
const found = [];
let actions = 0;

async function checkPage(ctx, id, label) {
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e)));
  const report = (when, list) => list.forEach((what) => found.push({ page: id, viewport: label, when, what }));
  try {
    await pg.goto(`http://localhost:${port}/index.html#${id}`, { waitUntil: "domcontentloaded" });
    const loading = pg.evaluate(() => window.__litt.watch(1500)); // starts at once, so the page's entrance is watched
    await pg.waitForSelector("h1", { timeout: 15_000 });
    report("on load", await loading);
    report("after load", await pg.evaluate(() => window.__litt.durations()));
    actions++;

    const triggers = await triggersOf(pg);
    for (let i = 0; i < triggers.length; i++) {
      const el = pg.locator(`[data-rm-trigger="${i}"]`);
      if (!(await el.count()) || !(await el.isVisible().catch(() => false))) continue;
      const watching = pg.evaluate(() => window.__litt.watch(400));
      try {
        await el.click({ timeout: 2000 });
      } catch {
        await watching;
        continue; // covered by something the last trigger opened; the next page load resets it
      }
      report(`after ${triggers[i]}`, await watching);
      report(`after ${triggers[i]}`, await pg.evaluate(() => window.__litt.durations()));
      actions++;
      const closing = pg.evaluate(() => window.__litt.watch(300));
      await pg.keyboard.press("Escape");
      report(`closing ${triggers[i]}`, await closing);
    }
  } catch (e) {
    found.push({ page: id, viewport: label, when: "running the check", what: String(e.message || e).split("\n")[0] });
  }
  for (const e of errors) found.push({ page: id, viewport: label, when: "page error", what: e });
  await pg.close();
}

for (const v of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: v.viewport, reducedMotion: selfTest ? "no-preference" : "reduce", hasTouch: !!v.hasTouch, isMobile: !!v.isMobile });
  await ctx.addInitScript(install);
  const queue = [...pages];
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) await checkPage(ctx, queue.shift(), v.label);
  }));
  await ctx.close();
}
await browser.close();
server.close();

if (selfTest) {
  // Only the frame sampler counts here: every page has instant transitions, so the duration check alone would always "see" motion.
  const moved = new Set(found.filter((f) => / moved through \d+ values$/.test(f.what)).map((f) => f.page));
  const want = pages.filter((id) => ["dialog", "menu", "toast", "list"].includes(id));
  const blind = want.filter((id) => !moved.has(id));
  console.log(`reduced motion self-test: with motion allowed, motion was seen on ${moved.size} of ${pages.length} pages.`);
  if (blind.length) { console.log(`✗ no motion seen on ${blind.join(", ")}, where it is certain: the check has gone blind.`); process.exit(1); }
  process.exit(0);
}

if (!found.length) {
  console.log(`reduced motion: ${pages.length} pages, ${actions} loads and clicks on the desktop and a phone, nothing moved.`);
  process.exit(0);
}
for (const f of found) console.log(`✗ ${f.page} · ${f.viewport} · ${f.when}: ${f.what}`);
console.log(`\nreduced motion: ${found.length} findings on ${new Set(found.map((f) => f.page)).size} of ${pages.length} pages.`);
process.exit(1);
