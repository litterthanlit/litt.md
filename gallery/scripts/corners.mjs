#!/usr/bin/env node
/**
 * Corners check: at every shape the Customize panel offers, nothing inside a rounded box rubs its curve. From a build.
 *
 *   npm run build && npm run test:corners
 *   node scripts/corners.mjs --dist dist --pages slider,switch --shapes 28
 *   node scripts/corners.mjs --self-test       two old breaks, put in one page's main, must each fail it
 *
 * The rule is the one the components keep by hand (components.md: "so the corners stay concentric"): a box drawn
 * inside a rounded box keeps at least as much room from the curve as from the nearest straight side, within a pixel.
 * Square corners hide a break, so the check loads each page at each of SHAPES (src/motion/rules.ts) but Square, with
 * the radius written on <body> as the Customize panel writes it, under reduced motion so everything is at rest.
 *
 * In each page's main, an outer box is anything painted (a fill, a shadow or a border) with a corner radius and
 * overflow visible: one that clips draws its contents to its own curve on purpose. An inner box is anything painted
 * whose nearest painted ancestor is that outer box, wholly inside it. It is only judged at a corner where its own
 * corner's center lies inside the outer corner's square, closer to both walls than the radius: there its curve,
 * grown by its own radius, must stay as far from the outer curve as it stands from the nearer of those two walls.
 * And an inner box that is a layer, filling three quarters of the outer's width or height and within the outer's
 * radius of one of those edges (rows in a group, a field in a row, a card's cover), must not be rounder than a closed
 * outer box (one drawn all round): a group at 16px around 22px rows reads
 * inside out even though nothing touches a curve. Circles are exempt: avatars and icon-only buttons are round by rule.
 * Radii are read as the browser draws them (scaled down when they overflow a side). Text, icons and images are not
 * boxes, so an icon in a round button is never judged by its square frame; a box drawn by borders alone shows only the
 * corners where two of them meet. Each page is read at rest at every shape, then with every slider at its start and at
 * its end, where only the slider's own parts are judged (a tuning slider at its end restyles a demo past any real use).
 *
 * Needs Playwright, found as a11y.mjs finds it (A11Y_TOOLS, then here, then the cloud container's global copy).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

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

/* The shapes, from rules.ts itself (bundled, as test-rules.mjs does), so a new stop is checked without touching this. */
const bundle = await build({ entryPoints: [path.join(here, "../src/motion/rules.ts")], bundle: true, format: "esm", platform: "neutral", write: false, logLevel: "silent" });
const { SHAPES, shapeName, shapeSurface } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
const shapes = (get("shapes", "") ? get("shapes").split(",").map(Number) : SHAPES.filter((r) => r > 0));
if (!shapes.length || shapes.some((r) => !SHAPES.includes(r))) { console.error(`--shapes takes some of ${SHAPES.join(", ")}.`); process.exit(1); }

/* Breaks the check knows about and has not fixed yet: each prints, and none fails the run, but one that no longer happens
   does, so the entry goes when the fix lands. Anything else that rubs a curve fails as usual. */
const KNOWN = [];
const knownFor = (f) => KNOWN.find((k) => k.page === f.id && k.radius === f.radius && k.what.test(f.what));

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

/* Read in the page: every inner box that comes closer to its outer box's curve than to the walls beside it. */
function measure(within) {
  const TOLERANCE = 1;
  const main = document.querySelector("main");
  if (!main) return [];
  /* Transparent: no color, or an alpha of 0 (rgba's fourth number, or after the slash in the newer syntaxes). */
  const clear = (c) => !c || c === "transparent" || /^rgba\((?:[^,]*,){3}\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);
  /* Which of a box's four corners are drawn, top left first: all of them under a fill or a shadow; with borders alone,
     a corner where two drawn borders meet. A row with only a divider under it draws no corner. */
  const SIDES = ["Top", "Right", "Bottom", "Left"];
  const drawn = (el) => {
    if (el instanceof SVGElement) return null;
    const s = getComputedStyle(el);
    if (s.visibility !== "visible" || Number(s.opacity) === 0) return null;
    if (!clear(s.backgroundColor) || s.backgroundImage !== "none" || s.boxShadow !== "none") return [true, true, true, true];
    const side = SIDES.map((k) => parseFloat(s[`border${k}Width`]) > 0 && !clear(s[`border${k}Color`]));
    if (!side.some(Boolean)) return null;
    return [side[0] && side[3], side[0] && side[1], side[2] && side[1], side[2] && side[3]];
  };
  /* The four radii as drawn: a percentage resolves against the box, and all four scale down together when a side's
     two radii add up to more than it (CSS Backgrounds 3, "corner overlap"). Elliptical radii count by their first. */
  const radii = (el, r) => {
    const s = getComputedStyle(el);
    const one = (v, side) => (v.trim().endsWith("%") ? (parseFloat(v) / 100) * side : parseFloat(v) || 0);
    const [tl, tr, br, bl] = ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map((k) => one(s[`border${k}Radius`].split(" ")[0], Math.min(r.width, r.height)));
    const f = Math.min(1, r.width / (tl + tr || 1), r.width / (bl + br || 1), r.height / (tl + bl || 1), r.height / (tr + br || 1));
    return [tl * f, tr * f, br * f, bl * f];
  };
  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
    const named = el.closest("[aria-label],[role=slider],[role=switch],button,label");
    const text = (named?.getAttribute("aria-label") || named?.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
    const plant = el.closest("[data-corners-self-test]");
    const test = plant ? `self-test ${plant.getAttribute("data-corners-self-test")} ` : "";
    return `${test}<${el.tagName.toLowerCase()}${cls ? "." + cls : ""}>${text ? ` in "${text}"` : ""}`;
  };
  const isBox = new Map();
  for (const el of main.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    const d = r.width > 0 && r.height > 0 && !el.closest("[hidden]") && drawn(el);
    if (d) isBox.set(el, d);
  }
  const boxes = [...isBox.keys()];
  const found = [];
  /* Within a slider (at its ends) only the slider's own parts count, not what its value restyles elsewhere. */
  const scopes = within ? [...main.querySelectorAll(`[${within}]`)] : null;
  for (const inner of boxes) {
    const scope = scopes && scopes.find((el) => el.contains(inner));
    if (scopes && !scope) continue;
    let outer = inner.parentElement;
    let clipped = false;
    while (outer && outer !== main && !isBox.has(outer)) {
      if (getComputedStyle(outer).overflow !== "visible") clipped = true;
      outer = outer.parentElement;
    }
    if (!outer || outer === main || clipped || getComputedStyle(outer).overflow !== "visible") continue;
    if (scope && !scope.contains(outer)) continue;
    const O = outer.getBoundingClientRect();
    const I = inner.getBoundingClientRect();
    if (I.left < O.left - 0.5 || I.top < O.top - 0.5 || I.right > O.right + 0.5 || I.bottom > O.bottom + 0.5) continue;
    const ro = radii(outer, O);
    const ri = radii(inner, I);
    /* Each corner as (sign x, sign y, the outer corner point, the inner corner point), walls measured inward. */
    const corners = [
      [1, 1, O.left, O.top, I.left, I.top],
      [-1, 1, O.right, O.top, I.right, I.top],
      [-1, -1, O.right, O.bottom, I.right, I.bottom],
      [1, -1, O.left, O.bottom, I.left, I.bottom],
    ];
    let worst = null;
    const shows = isBox.get(inner);
    const outerShows = isBox.get(outer);
    corners.forEach(([sx, sy, ox, oy, ix, iy], k) => {
      if (!shows[k] || !outerShows[k]) return;
      const R = ro[k];
      const r = ri[k];
      if (R <= TOLERANCE) return;
      const gx = (ix - ox) * sx;
      const gy = (iy - oy) * sy;
      /* Only where the inner corner's center sits in the outer corner's square, where the wall is curved. */
      if (gx + r >= R || gy + r >= R) return;
      const room = R - Math.hypot(R - gx - r, R - gy - r) - r;
      const wall = Math.min(gx, gy);
      if (room < wall - TOLERANCE && (!worst || wall - room > worst.short)) worst = { room, wall, short: wall - room };
    });
    if (worst) {
      found.push(`${describe(inner)} is ${worst.room.toFixed(1)}px from the curve of ${describe(outer)} (radius ${Math.round(Math.max(...ro))}px) but ${worst.wall.toFixed(1)}px from its wall`);
    }
    /* A layer (a box that fills most of its outer box one way, three quarters of its width or its height, and comes
       within the outer's radius of one of those two edges: rows in a group, a field in a row, a card's cover) is
       never rounder than the box that holds it. A control in a padded card stands further in than the card's radius,
       so a full-width pill button in a card is fine. */
    const R = Math.max(...ro.filter((_, k) => outerShows[k]), 0);
    const r = Math.max(...ri.filter((_, k) => shows[k]), 0);
    const closed = outerShows.every(Boolean);
    const across = I.width >= 0.75 * O.width && Math.min(I.left - O.left, O.right - I.right) <= R + 0.5;
    const down = I.height >= 0.75 * O.height && Math.min(I.top - O.top, O.bottom - I.bottom) <= R + 0.5;
    const layer = closed && (across || down);
    const round = Math.abs(I.width - I.height) <= 1 && r >= I.width / 2 - 0.5; // an avatar, an icon-only button: round by rule
    if (layer && !round && r > R + TOLERANCE) found.push(`${describe(inner)} spans ${describe(outer)} but is rounder: radius ${r.toFixed(1)}px in ${R.toFixed(1)}px`);
  }
  return found;
}

const browser = await chromium.launch();
const failures = [];
/* Each page loads once and takes each shape in turn, written on <body> as the Customize panel writes it
   (customize-state.tsx): the control radius and the surface radius that goes with it. */
async function checkPage(id) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "light", reducedMotion: "reduce" });
  if (selfTest) {
    /* Two old breaks, one for each rule: the Slider's plate and cap as they were before the cap's travel followed the
       radius (14px in from a pill's end), and a Rule builder group's 16px panel holding a 22px row edge to edge. */
    await ctx.addInitScript(() => {
      new MutationObserver((_, obs) => {
        const main = document.querySelector("main h1") && document.querySelector("main");
        if (!main) return;
        obs.disconnect();
        const plate = document.createElement("div");
        plate.setAttribute("data-corners-self-test", "rub");
        plate.style.cssText = "position:relative;width:240px;height:44px;border-radius:22px;background:gray";
        const cap = document.createElement("div");
        cap.style.cssText = "position:absolute;left:10px;top:4px;width:8px;height:36px;border-radius:4px;background:black";
        plate.append(cap);
        main.append(plate);
        const panel = document.createElement("div");
        panel.setAttribute("data-corners-self-test", "layer");
        panel.style.cssText = "position:relative;width:300px;height:120px;border-radius:16px;background:gray";
        const row = document.createElement("div");
        row.style.cssText = "position:absolute;left:16px;right:16px;top:40px;height:44px;border-radius:22px;background:black";
        panel.append(row);
        main.append(panel);
      }).observe(document, { childList: true, subtree: true });
    });
  }
  const pg = await ctx.newPage();
  try {
    await pg.goto(`http://localhost:${port}/index.html#${id}`, { waitUntil: "domcontentloaded" });
    await pg.waitForSelector("main h1", { timeout: 15_000 });
    await pg.waitForLoadState("networkidle");
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(300);
    /* Every slider thumb that takes keys. Radix's thumb is an empty see-through box under litt's cap, so it is picked
       by its role, not by anything drawn. */
    const sliders = await pg.evaluate(() => {
      const thumbs = [...document.querySelectorAll("main [role=slider]")].filter(
        (el) => !el.closest("[hidden],[inert]") && el.getAttribute("aria-disabled") !== "true" && !el.hasAttribute("data-disabled"),
      );
      thumbs.forEach((el, i) => {
        el.setAttribute("data-corners-thumb", String(i));
        (el.closest("[dir][data-orientation]") || el.parentElement).setAttribute("data-corners-slider", "");
      });
      return thumbs.length;
    });
    const shape = (radius) => pg.evaluate(([control, surface]) => {
      document.body.style.setProperty("--radius-control", `${control}px`);
      document.body.style.setProperty("--radius-surface", `${surface}px`);
      return new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    }, [radius, shapeSurface(radius)]);
    /* The page at rest at every shape first, before any slider moves. */
    for (const radius of shapes) {
      await shape(radius);
      for (const what of await pg.evaluate(measure)) failures.push({ id, radius, what });
    }
    /* A slider's cap rests mid-track in the demos, but its ends are where the curve is: every slider at both. */
    for (const key of sliders ? ["Home", "End"] : []) {
      for (let i = 0; i < sliders; i++) {
        await pg.evaluate((n) => document.querySelector(`[data-corners-thumb="${n}"]`).focus({ preventScroll: true }), i);
        await pg.keyboard.press(key);
      }
      for (const radius of shapes) {
        await shape(radius);
        for (const what of await pg.evaluate(measure, "data-corners-slider")) failures.push({ id, radius, what: `${what}, at ${key}` });
      }
    }
  } catch (e) {
    failures.push({ id, radius: shapes[0], what: `running the check: ${String(e.message || e).split("\n")[0]}` });
  }
  await ctx.close();
}

const started = Date.now();
const queue = [...pages];
const runs = pages.length * shapes.length;
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
  while (queue.length) await checkPage(queue.shift());
}));
await browser.close();
server.close();
const took = `${Math.round((Date.now() - started) / 1000)}s`;
const shapeWords = shapes.map((r) => shapeName(r)).join(", ");

if (selfTest) {
  const kinds = { rub: "the Slider's old cap on a pill", layer: "a 22px row in a 16px group" };
  const keys = new Set(failures.flatMap((f) => { const m = /^self-test (\w+) /.exec(f.what); return m ? [`${f.id} ${f.radius} ${m[1]}`] : []; }));
  const missed = pages.flatMap((id) => shapes.flatMap((r) => Object.keys(kinds).map((k) => `${id} ${r} ${k}`))).filter((k) => !keys.has(k));
  const broken = failures.filter((f) => /running the check/.test(f.what));
  for (const [k, words] of Object.entries(kinds)) console.log(`corners self-test: ${words} was caught on ${[...keys].filter((x) => x.endsWith(` ${k}`)).length} of ${runs} runs (${took}).`);
  for (const f of broken) console.log(`✗ ${f.id} at ${shapeName(f.radius)}: ${f.what}`);
  if (missed.length || broken.length) { if (missed.length) console.log(`✗ not caught on ${missed.join(", ")}: the check has gone blind.`); process.exit(1); }
  process.exit(0);
}

const known = failures.filter(knownFor);
const fresh = failures.filter((f) => !knownFor(f));
for (const k of KNOWN.filter((k) => pages.includes(k.page) && shapes.includes(k.radius))) {
  const hits = known.filter((f) => knownFor(f) === k).length;
  if (hits) console.log(`· known, ${k.page} at ${shapeName(k.radius)} (${hits}): ${k.why}.`);
  else fresh.push({ id: k.page, radius: k.radius, what: `the known break no longer happens (${k.why}): take it out of KNOWN` });
}
if (!fresh.length) {
  console.log(`corners: ${pages.length} pages at ${shapeWords}, nothing rubs a curve${known.length ? " but the known breaks" : ""} (${took}).`);
  process.exit(0);
}
const byPage = new Map();
for (const f of fresh) {
  const key = `${f.id} at ${shapeName(f.radius)}`;
  if (!byPage.has(key)) byPage.set(key, new Set());
  byPage.get(key).add(f.what);
}
for (const [key, whats] of byPage) {
  const list = [...whats];
  console.log(`✗ ${key}: ${list.slice(0, 3).join("; ")}${list.length > 3 ? `; and ${list.length - 3} more` : ""}`);
}
console.log(`\ncorners: ${byPage.size} of ${runs} page and shape runs have something rubbing a curve.`);
process.exit(1);
