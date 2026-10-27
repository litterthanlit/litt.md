#!/usr/bin/env node
/**
 * Fun mode at rest: every page, from a build, looks the same in fun mode as in Calm once it settles, to the pixel.
 * Fun mode changes how things move, never how they look at rest (.claude/CLAUDE.md, Gallery).
 *
 *   npm run build && npm run test:fun
 *   node scripts/fun-rest.mjs --dist dist --pages run-card,gauge --out /tmp/fun-rest
 *   node scripts/fun-rest.mjs --self-test       Calm against Calm must match, and must not once a stage title sits a pixel low
 *
 * Each page loads twice, side by side: in Calm and with fun mode on (saved as the header's Customize panel saves
 * it). Both sit in a viewport as tall as the page, so nothing scrolls, with the fun cues and the sidebar's contents
 * left out from the first paint: they are gallery chrome that says fun mode is on, and the sidebar's Fun group would
 * make the sidebar, so the page, taller. A picked fun cue (the overview's Fun filter) gives way to All, so the whole
 * wall is compared.
 *
 * The two are compared on load, then after the first plain button of each stage is pressed in both (Deploy, Next step,
 * Send), the moments fun mode moves. Before each comparison both wait until nothing has changed for two seconds. A
 * page that never settles fails too.
 *
 * The clock is real. Playwright's page.clock strands motion's animations mid-flight, so a figure caught mid-roll
 * looks like a rest that is off. Chromium runs without partial raster: repainting only what changed leaves a tile's
 * edge antialiasing a few levels apart after different motion, which is not a difference at rest. Google Fonts now
 * and then answers the same request with another build of Geist, which draws every glyph a few levels apart, so each
 * font url's first answer is kept and served to every page.
 *
 * A mismatch names the stage it is in and the box it covers, and leaves both screenshots in --out.
 *
 * Needs Playwright, found as a11y.mjs finds it (A11Y_TOOLS, then here, then the cloud container's global copy).
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const dist = path.resolve(get("dist", "dist"));
const out = path.resolve(get("out", path.join(os.tmpdir(), "litt-fun-rest")));
const selfTest = args.includes("--self-test");
const only = (get("pages", selfTest ? "rolling-number,run-card,button,thinking" : "") || "").split(",").filter(Boolean);
const CONCURRENCY = Number(get("concurrency", "4"));
/* Settled is no change for QUIET_MS, longer than the longest wait in a scripted demo (the Agent block's beats). */
const QUIET_MS = 2000;
const SETTLE_MS = 60_000;
/* Thinking's clock reads real time, which no two loads share, so it is hidden in both. The self-test fails when this
   stops matching it on the Thinking page. */
const CLOCK = 'div[data-state] > button[aria-expanded] > span > span[aria-hidden="true"].tabular-nums';
/* How far a channel may differ inside a photograph. Chromium resamples a scaled photo from whichever decode it has at
   hand when it rasters, so after different motion a photo can come out a few levels apart (10 at most, seen in CI). A
   photo that moved or was cut differently still fails: its edges against the page change by far more. */
const PHOTO_LEVELS = 12;

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
 * Before the page runs: fun mode on or off, the chrome that says so left out before the first paint, and
 * window.__frQuiet(ms), true once nothing in the DOM has changed for ms, no finite animation is running, no
 * animation frame has run (a canvas that draws a fun arrival changes neither the DOM nor its animations) and no
 * timeout is waiting to fire (a toast that dismisses itself).
 */
function prepare({ fun, clock }) {
  if (fun) localStorage.setItem("litt-gallery:customize", JSON.stringify({ fun: true }));
  else localStorage.removeItem("litt-gallery:customize");
  let last = performance.now();
  new MutationObserver(() => { last = performance.now(); }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  const frame = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (draw) => frame((t) => { last = performance.now(); draw(t); });
  const waiting = new Set();
  const later = window.setTimeout.bind(window);
  const cancel = window.clearTimeout.bind(window);
  window.setTimeout = (run, ms = 0, ...rest) => {
    if (typeof run !== "function" || ms > 15_000) return later(run, ms, ...rest);
    const id = later((...args) => { waiting.delete(id); last = performance.now(); run(...args); }, ms, ...rest);
    waiting.add(id);
    return id;
  };
  window.clearTimeout = (id) => { waiting.delete(id); cancel(id); };
  window.__frQuiet = (ms) => {
    const running = document.getAnimations().some((a) => a.playState === "running" && a.effect?.getComputedTiming().endTime !== Infinity);
    if (running || waiting.size) last = performance.now();
    return performance.now() - last >= ms;
  };
  document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = `[data-fun-cue], nav[aria-label="Components"] > * { display: none !important } ${clock} { visibility: hidden !important }`;
    document.head.append(style);
  });
}

/** A fun cue that is picked (the overview's Fun filter) gives way to the first other choice in its group, All. */
function unpickFunCues() {
  for (const cue of document.querySelectorAll("[data-fun-cue] input[type=radio]:checked")) {
    const other = [...document.querySelectorAll(`input[type=radio][name="${CSS.escape(cue.name)}"]`)].find((r) => !r.closest("[data-fun-cue]"));
    other?.click();
  }
}

/** The first plain button of each stage, marked in reading order, as reduced-motion.mjs picks them. */
function markButtons() {
  const scope = document.querySelector("main article") || document.querySelector("main");
  const names = [];
  for (const stage of scope.querySelectorAll("section[aria-label]")) {
    const first = [...stage.querySelectorAll("button")].find((b) => {
      if (b.closest("[hidden], [aria-hidden='true']") || b.disabled || b.getAttribute("aria-disabled") === "true") return false;
      if (b.matches('[role="tab"], [role="radio"], [aria-pressed], [type="submit"], [aria-haspopup], [aria-expanded]')) return false;
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && !/copy|code|preview|replay|reset/i.test(`${b.getAttribute("aria-label") || ""} ${b.textContent || ""}`);
    });
    if (!first) continue;
    first.setAttribute("data-fr-press", String(names.length));
    names.push(`${stage.getAttribute("aria-label")}: ${(first.getAttribute("aria-label") || first.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30)}`);
  }
  return names;
}

/** Where each stage sits, to name the one a difference falls in. */
function stageBoxes() {
  return [...document.querySelectorAll("main section[aria-label]")].map((s) => {
    const r = s.getBoundingClientRect();
    return { name: s.getAttribute("aria-label"), top: r.top + scrollY, bottom: r.bottom + scrollY };
  });
}

/* ------------------------------------------------------------- the run */

const VIEWPORTS = [
  { label: "desktop", viewport: { width: 1440, height: 900 } },
  { label: "phone", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
];
const browser = await chromium.launch({ args: ["--disable-partial-raster"] });
const differ = await (await browser.newContext()).newPage();
const fonts = new Map();
async function sameFonts(route) {
  const url = route.request().url();
  if (!fonts.has(url)) fonts.set(url, route.fetch().then(async (r) => ({ status: r.status(), headers: r.headers(), body: await r.body() }), () => null));
  const answer = await fonts.get(url);
  await (answer ? route.fulfill(answer) : route.abort());
}
fs.mkdirSync(out, { recursive: true });
/* The page compared with Calm: fun mode, or for the self-test Calm again. */
const OTHER = selfTest ? { name: "the second Calm page", file: "calm-2" } : { name: "fun mode", file: "fun" };
const found = [];
const clocks = {};
let compared = 0;

/**
 * Waits in the page until it is quiet for QUIET_MS, then screenshots until two in a row match. The waiting is not
 * done with screenshots: a tall one holds the page's timers up, so a demo that measures real time (the Thinking
 * clock) would read a different time in each page.
 */
async function settled(pg) {
  const until = Date.now() + SETTLE_MS;
  /* Polled from here: waitForFunction polls with the page's own setTimeout, which would never let it be quiet. */
  while (!(await pg.evaluate((ms) => window.__frQuiet(ms), QUIET_MS))) {
    if (Date.now() > until) return null;
    await new Promise((done) => setTimeout(done, 200));
  }
  let last = await pg.screenshot();
  while (Date.now() < until) {
    await pg.waitForTimeout(400);
    const now = await pg.screenshot();
    if (now.equals(last)) return now;
    last = now;
  }
  return null;
}

const tall = (pg) => pg.evaluate(() => Math.ceil(document.documentElement.scrollHeight));

/** Fits the viewport to the taller of the two pages, so nothing scrolls and both keep the same size. */
async function fit(a, b, width) {
  const height = Math.max(await tall(a), await tall(b));
  for (const pg of [a, b]) if (pg.viewportSize().height !== height) await pg.setViewportSize({ width, height });
}

/** The box the two screenshots differ in, and how many pixels, letting photos differ by up to PHOTO_LEVELS. */
async function diff(a, b, photos) {
  return differ.evaluate(async ([a, b, photos, levels]) => {
    const load = (s) => new Promise((done) => { const i = new Image(); i.onload = () => done(i); i.src = `data:image/png;base64,${s}`; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
    const pixels = (i) => { const c = new OffscreenCanvas(w, h); const x = c.getContext("2d"); x.drawImage(i, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const pa = pixels(ia), pb = pixels(ib);
    const photo = new Uint8Array(w * h);
    for (const [left, top, right, bottom] of photos) {
      for (let y = Math.max(0, top); y < Math.min(h, bottom); y++) photo.fill(1, y * w + Math.max(0, left), y * w + Math.min(w, right));
    }
    let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 4;
      const most = Math.max(Math.abs(pa[k] - pb[k]), Math.abs(pa[k + 1] - pb[k + 1]), Math.abs(pa[k + 2] - pb[k + 2]), Math.abs(pa[k + 3] - pb[k + 3]));
      if (most === 0 || (most <= levels && photo[y * w + x])) continue;
      n++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    return { n, box: [x0, y0, x1 - x0 + 1, y1 - y0 + 1], sizes: `${ia.width}×${ia.height} and ${ib.width}×${ib.height}` };
  }, [a.toString("base64"), b.toString("base64"), photos, PHOTO_LEVELS]);
}

async function checkPage(contexts, id, v, plant) {
  const [calm, other] = await Promise.all(contexts.map((ctx) => ctx.newPage()));
  const errors = [];
  for (const pg of [calm, other]) pg.on("pageerror", (e) => errors.push(String(e)));
  const report = (when, what) => found.push({ page: id, viewport: v.label, when, what });

  async function compare(when) {
    /* A page can grow while it settles (a lazy part arrives, a run plays on), so fit and settle again until both fit. */
    let a, b;
    for (let round = 0; round < 3; round++) {
      await fit(calm, other, v.viewport.width);
      [a, b] = await Promise.all([settled(calm), settled(other)]);
      if (!a || !b || Math.max(await tall(calm), await tall(other)) <= calm.viewportSize().height) break;
    }
    compared++;
    if (!a || !b) return report(when, `${!a ? "Calm" : OTHER.name} never settled in ${SETTLE_MS / 1000}s`);
    if (a.equals(b)) return;
    const photos = await calm.evaluate(() => [...document.querySelectorAll("img, video")].map((e) => {
      const r = e.getBoundingClientRect();
      return [Math.floor(r.left), Math.floor(r.top), Math.ceil(r.right), Math.ceil(r.bottom)];
    }));
    const d = await diff(a, b, photos);
    if (!d.n) return;
    const stages = await calm.evaluate(stageBoxes);
    const [x, y, w, h] = d.box;
    const where = stages.filter((s) => s.bottom > y && s.top < y + h).map((s) => `"${s.name}"`).join(", ") || "outside the stages";
    const stem = `${id}-${v.label}-${when.replace(/\W+/g, "-").replace(/^-|-$/g, "")}`.slice(0, 120);
    fs.writeFileSync(path.join(out, `${stem}-calm.png`), a);
    fs.writeFileSync(path.join(out, `${stem}-${OTHER.file}.png`), b);
    report(when, `${d.n} pixels differ in ${where}, a ${w}×${h} box at ${x},${y} (${d.sizes}); see ${path.join(out, stem)}-*.png`);
  }

  try {
    await Promise.all([calm, other].map((pg) => pg.goto(`http://localhost:${port}/index.html#${id}`, { waitUntil: "domcontentloaded" })));
    /* The docs layer and the fonts load after the page, and two screenshots can match before they arrive. */
    await Promise.all([calm, other].map(async (pg) => {
      await pg.waitForSelector("main h1", { timeout: 15_000 });
      await pg.waitForLoadState("networkidle");
      await pg.evaluate(() => document.fonts.ready);
    }));
    await Promise.all([calm, other].map((pg) => pg.evaluate(unpickFunCues)));
    clocks[id] = await calm.evaluate((sel) => document.querySelectorAll(sel).length, CLOCK);
    if (plant) await other.addStyleTag({ content: "main section[aria-label] h2 { transform: translateY(1px) }" });
    await compare("on load");

    const [names, otherNames] = await Promise.all([calm.evaluate(markButtons), other.evaluate(markButtons)]);
    if (names.join("\n") !== otherNames.join("\n")) report("on load", `the stages' first buttons differ: ${names.join(" | ")} against ${otherNames.join(" | ")}`);
    for (let i = 0; i < names.length; i++) {
      const pressed = await Promise.all([calm, other].map(async (pg) => {
        const el = pg.locator(`[data-fr-press="${i}"]`);
        try {
          await el.click({ timeout: 2000 });
          await pg.mouse.move(0, 0);
          return true;
        } catch {
          return false; // covered by something an earlier press opened; the next page load resets it
        }
      }));
      if (pressed[0] !== pressed[1]) report(`after ${names[i]}`, "pressed in one mode and covered in the other");
      else if (pressed[0]) await compare(`after ${names[i]}`);
    }
  } catch (e) {
    report("running the check", String(e.message || e).split("\n")[0]);
  }
  for (const e of errors) report("page error", e);
  await calm.close();
  await other.close();
}

/** Every page against Calm: in fun mode, or for the self-test in Calm again, nudged or not. */
async function run({ fun, plant = false }) {
  for (const v of VIEWPORTS) {
    const contexts = await Promise.all([false, fun].map(async (on) => {
      const ctx = await browser.newContext({ viewport: v.viewport, colorScheme: "light", reducedMotion: "no-preference", hasTouch: !!v.hasTouch, isMobile: !!v.isMobile });
      await ctx.addInitScript(prepare, { fun: on, clock: CLOCK });
      await ctx.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, sameFonts);
      return ctx;
    }));
    const queue = [...pages];
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length) await checkPage(contexts, queue.shift(), v, plant);
    }));
    await Promise.all(contexts.map((ctx) => ctx.close()));
  }
}

if (selfTest) {
  await run({ fun: false });
  const noise = found.splice(0);
  await run({ fun: false, plant: true });
  await browser.close();
  server.close();
  /* Calm against Calm must match everywhere, or the check sees noise and would fail fun mode for nothing. With the
     second page's stage titles a pixel low, every load must differ, or the check has gone blind. */
  const seen = new Set(found.filter((f) => f.when === "on load" && / pixels differ in "/.test(f.what)).map((f) => `${f.page} · ${f.viewport}`));
  const blind = pages.flatMap((id) => VIEWPORTS.map((v) => `${id} · ${v.label}`)).filter((k) => !seen.has(k));
  const unmasked = pages.includes("thinking") && !clocks.thinking;
  console.log(`fun at rest self-test: Calm against Calm matched ${noise.length ? "except " + noise.length + " times" : "every time"}; the stage titles a pixel low were seen on ${pages.length * VIEWPORTS.length - blind.length} of ${pages.length * VIEWPORTS.length} loads.`);
  for (const f of noise) console.log(`✗ Calm against Calm, ${f.page} · ${f.viewport} · ${f.when}: ${f.what}`);
  if (blind.length) console.log(`✗ the titles a pixel low were not seen on ${blind.join(", ")}: the check has gone blind.`);
  if (unmasked) console.log(`✗ the clock mask matched nothing on the Thinking page: update CLOCK to its clock's markup.`);
  process.exit(noise.length || blind.length || unmasked ? 1 : 0);
}

await run({ fun: true });
await browser.close();
server.close();

if (!found.length) {
  console.log(`fun at rest: ${pages.length} pages, ${compared} comparisons on the desktop and a phone, fun mode rests as Calm does, to the pixel.`);
  process.exit(0);
}
for (const f of found) console.log(`✗ ${f.page} · ${f.viewport} · ${f.when}: ${f.what}`);
console.log(`\nfun at rest: ${found.length} differences on ${new Set(found.map((f) => f.page)).size} of ${pages.length} pages.`);
process.exit(1);
