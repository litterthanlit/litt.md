#!/usr/bin/env node
/**
 * Device's materials and colour rule (plans/024, Device, phase 2), after the components repo's check:anatomy. From a
 * build, on the player (#device) and every #device/* page (scripts/routes.mjs), light and dark, at 1440 by 900, with Variants open.
 * Flat's kinds too (plans/024, Flat, leftovers), on Flat's player (#flat, Home and every take) and its gallery view
 * (#flat/components, every component as its tile).
 *
 *   npm run build && npm run test:materials
 *   node scripts/materials.mjs --pages device/button,device/tag
 *   node scripts/materials.mjs --self-test     puts back an orange primary key and a teal gauge (and four more), fails if missed
 *
 * It fails when, anywhere on a Device page:
 * - an element carries a data-part kind that is not one of Device's (KINDS, after litt-principles.md, Device's materials,
 *   and plans/024's table),
 * - the accent (orange) shows as a fill, a text colour, an SVG fill or stroke, or a border, except in a lamp (an element
 *   in data-part="light"); a hand on it and the focus ring are never at rest, and the ring is an outline or a shadow,
 *   which this does not read,
 * - any other colour shows: a data hue, green or amber. The body's greys and the ink are fine; so are red (REC, the
 *   playhead, a fault) and the one blue on the screen (selection on glass, --select), within 0.03 in OKLab,
 * - a stage's ground is not the plate: every component stage (section[data-arrive=stage] > its box) and every wall tile
 *   (data-tile) in #device/components is data-part="plate" and paints --plate-face.
 * A colour is read in OKLCH from the computed background (its colour and any colour in a gradient), the text colour of
 * an element with its own words, an SVG's fill and stroke, and a drawn border. Under 0.035 chroma it is a grey. Images,
 * video and canvas are content, not material (a cover keeps its palette), and so is code, whose highlighting is the
 * reader's; so is a colour the data paints inline (a product's swatch, the colour picker's colour), or anything
 * inside [data-artwork].
 *
 * On Flat's pages it fails when an element carries a data-part kind that is not one of Flat's (FLAT_KINDS, after
 * litt-principles.md, Flat's materials, and plans/024's phase 1 list), or when a part of Flat's player body (a pill, Play,
 * the screen) is in no data-part. Flat's colour rule is not read here: test:wall and test:playground hold its one ink
 * fill, and its data hues are the data's.
 *
 * KNOWN holds breaks that are not fixed yet: each prints, none fails the run, and one that no longer happens fails it,
 * so the entry goes when the fix lands. The player (#device) is read too, on Home, as it opens.
 *
 * Needs Playwright, found as the other page checks find it (A11Y_TOOLS, then here, then the cloud container's copy).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { openVariants, routes } from "./routes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const dist = path.resolve(get("dist", "dist"));
const selfTest = args.includes("--self-test");
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

/** Device's data-part kinds (plans/024, Device, phase 1; taste/litt-principles.md, Device's materials). */
export const KINDS = ["frame", "plate", "well", "slot", "collar", "key", "cap", "lcd", "chip", "bezel", "glass", "window", "light",
  "lettering", "screen", "matrix", "reel", "tape", "face"];

/** Flat's data-part kinds (plans/024, Flat, phase 1; taste/litt-principles.md, Flat's materials). */
export const FLAT_KINDS = ["ground", "paper", "pill", "circle", "bubble", "ink", "ink-card", "outline", "float", "mark", "figure", "lettering"];

/** Breaks not fixed yet, as "page · theme · rule · what": printed, never failing, and failing once gone. */
const KNOWN = [];

const only = (get("pages", selfTest ? "device/button,flat" : "") || "").split(",").filter(Boolean);
/* #device is the player: the recorder and what its screen shows, read since plan 024's phase 4 drew it in Device's materials.
   Flat is read on its player and its gallery view, which between them draw every Flat part. */
const PAGES = only.length ? only : [...routes({ only: ["device"] }).filter((r) => r === "device" || r.startsWith("device/")), "flat", "flat/components"];
/** The world a route is in, which picks the rules it is read by. */
const worldOf = (route) => route.split("/")[0];

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".md": "text/markdown", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/favicon")) { res.writeHead(204); return res.end(); }
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}/index.html`;

/** Runs in the page: every break of the rule, as [rule, what] pairs. */
function read([KINDS, world]) {
  /* sRGB to OKLab/OKLCH, through a canvas so any CSS colour (oklch, color-mix results, named) parses. */
  const cx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const rgba = (c) => {
    if (cache.has(c)) return cache.get(c);
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = "rgba(0,0,0,0)";
    cx.fillStyle = c;
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    const v = [d[0] / 255, d[1] / 255, d[2] / 255, d[3] / 255];
    cache.set(c, v);
    return v;
  };
  const lin = (x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  const lab = ([r0, g0, b0]) => {
    const [r, g, b] = [lin(r0), lin(g0), lin(b0)];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  };
  const root = getComputedStyle(document.documentElement);
  const tok = (n) => root.getPropertyValue(n).trim();
  const select = tok("--select") ? lab(rgba(tok("--select"))) : null;
  const near = (a, b) => b && Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.03;
  /** "grey", "red", "orange", "select" or "hue". */
  const kind = (c) => {
    const [r, g, b, a] = rgba(c);
    if (a < 0.15) return "grey";
    const L = lab([r, g, b]);
    const C = Math.hypot(L[1], L[2]);
    if (C < 0.035) return "grey";
    if (near(L, select)) return "select";
    const h = ((Math.atan2(L[2], L[1]) * 180) / Math.PI + 360) % 360;
    if (h >= 5 && h < 36) return "red";
    if (h >= 36 && h < 75) return "orange";
    return "hue";
  };
  const colours = (s) => [...s.matchAll(/(?:rgba?|oklch|oklab|color|hsla?)\([^()]*\)/g)].map((m) => m[0]);
  const name = (el) => {
    const id = el.closest("[id]")?.id;
    const part = el.closest("[data-part]")?.getAttribute("data-part");
    const t = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
    return `<${el.tagName.toLowerCase()}${el.getAttribute("data-part") ? ` data-part=${el.getAttribute("data-part")}` : ""}>${t ? ` "${t}"` : ""}${part && !el.getAttribute("data-part") ? ` in ${part}` : ""}${id ? ` #${id}` : ""}`;
  };
  const out = [];
  const seen = new Set();
  const add = (rule, what) => { const k = rule + what; if (!seen.has(k)) { seen.add(k); out.push([rule, what]); } };

  const World = world[0].toUpperCase() + world.slice(1);
  for (const el of document.querySelectorAll("[data-part]")) {
    const k = el.getAttribute("data-part");
    if (!KINDS.includes(k)) add("kind", `data-part="${k}" is not a ${World} kind: ${name(el)}`);
  }

  /* Flat: its kinds only, and every part of its player body marked (the top row and the screen's take are not the body). */
  if (world === "flat") {
    const body = document.querySelector('[data-play-object="flat"]');
    for (const el of body ? body.querySelectorAll(':scope > :not(:first-child) :is(button, [role=slider] > *, [data-play-frame=screen])') : []) {
      if (el.parentElement.closest("[data-play-frame=screen]")) continue;
      if (!el.closest("[data-part]")) add("unmarked", `a part of Flat's player is in no data-part: ${name(el)}`);
    }
    return out;
  }

  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("img, video, canvas, picture, pre, code, [data-artwork], [aria-hidden=true][data-fun-cue]")) continue;
    /* A colour given by the data, inline (a product's swatch, a colour picker's colour), is content, not material. */
    if (/background/.test(el.getAttribute("style") || "") && !/var\(/.test(el.style.background + el.style.backgroundColor + el.style.backgroundImage)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    let o = 1;
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) o *= Number(getComputedStyle(p).opacity);
    if (o < 0.05) continue;
    const lamp = !!el.closest('[data-part="light"]');
    const svg = el instanceof SVGElement;
    const found = [];
    if (!svg) found.push(["fill", cs.backgroundColor], ...colours(cs.backgroundImage).map((c) => ["fill", c]));
    if (svg) {
      if (cs.fill && cs.fill !== "none" && !cs.fill.startsWith("url")) found.push(["fill", cs.fill]);
      if (cs.stroke && cs.stroke !== "none" && !cs.stroke.startsWith("url") && parseFloat(cs.strokeWidth) > 0) found.push(["stroke", cs.stroke]);
    }
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (ownText) found.push(["text", cs.color]);
    for (const side of ["Top", "Right", "Bottom", "Left"])
      if (parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== "none") found.push(["border", cs[`border${side}Color`]]);
    for (const [what, c] of found) {
      const k = kind(c);
      if (k === "orange" && !lamp) add("orange", `the accent as ${what} (${c}) on ${name(el)}`);
      if (k === "hue") add("hue", `a colour outside the rule as ${what} (${c}) on ${name(el)}`);
    }
  }

  /* A stage's ground is the plate. */
  const probe = document.createElement("div");
  probe.style.background = "var(--plate-face)";
  document.body.append(probe);
  const plate = getComputedStyle(probe).backgroundImage + " " + getComputedStyle(probe).backgroundColor;
  probe.remove();
  const grounds = [
    /* The stage's box: the section's child, or the child of its tabs root (display: contents) when it has a code view. */
    ...[...document.querySelectorAll("main section[data-arrive=stage]")].flatMap((s) => [...s.querySelectorAll(":scope > .row-start-1.col-span-2, :scope > .contents > .row-start-1.col-span-2")]),
    ...document.querySelectorAll("main [data-tile]"),
  ];
  for (const g of grounds) {
    const cs = getComputedStyle(g);
    const paint = cs.backgroundImage + " " + cs.backgroundColor;
    if (g.getAttribute("data-part") !== "plate") add("ground", `a stage's ground is not data-part="plate": ${name(g)}`);
    else if (paint !== plate) add("ground", `a stage's ground does not paint --plate-face (${paint.slice(0, 60)}…): ${name(g)}`);
  }
  return out;
}

const browser = await chromium.launch();
async function check(route, theme, mutate) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme, reducedMotion: "reduce" });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e)));
  try {
    await pg.goto(`${base}#${route}`, { waitUntil: "networkidle" });
    await pg.evaluate(() => document.fonts.ready);
    await openVariants(pg);
    /* Walk down so every tile in the gallery view mounts (each mounts a screen ahead), as wall.mjs does. */
    let end = await pg.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; route.endsWith("/components") && y < end; y += 720) {
      await pg.evaluate((y) => scrollTo(0, y), y);
      await pg.waitForTimeout(120);
      end = await pg.evaluate(() => document.documentElement.scrollHeight);
    }
    await pg.waitForLoadState("networkidle");
    await pg.mouse.move(0, 0);
    await pg.waitForTimeout(150);
    if (mutate) await pg.evaluate(mutate);
    const rules = [worldOf(route) === "flat" ? FLAT_KINDS : KINDS, worldOf(route)];
    const found = (await pg.evaluate(read, rules)).map(([rule, what]) => `${route} · ${theme} · ${rule} · ${what}`);
    /* The player: Home, then every take on its screen, stepped with the tape's keys as a person would. */
    const slider = pg.locator("[data-play-object] [role=slider][aria-label=Components]");
    if ((route === "device" || route === "flat") && !mutate && (await slider.count())) {
      const n = Number(await slider.getAttribute("aria-valuemax"));
      for (let k = 1; k <= n; k++) {
        await slider.focus();
        await pg.keyboard.press("ArrowRight");
        await pg.waitForLoadState("networkidle");
        await pg.waitForTimeout(250);
        await slider.evaluate((el) => el.blur());
        const take = await pg.evaluate(() => document.querySelector("[data-play-take]")?.getAttribute("data-play-take"));
        for (const [rule, what] of await pg.evaluate(read, rules)) found.push(`${route} · ${theme} · ${rule} · ${take}: ${what}`);
      }
    }
    return [...new Set(found), ...errors.map((e) => `${route} · ${theme} · error · ${e}`)];
  } finally {
    await ctx.close();
  }
}

if (selfTest) {
  /* The six breaks: Device's old orange primary key, the old teal gauge, a Press plate's kind and a stage on a dark
     screen on #device/button; a Device key's kind and an unmarked Play on Flat's player. */
  const [DEVICE, FLAT] = PAGES;
  const breaks = [
    ["an orange primary key", "orange", () => {
      const b = document.createElement("button");
      b.textContent = "Start a project";
      b.style.cssText = "background: var(--accent); color: var(--accent-fg); padding: 8px 16px";
      document.querySelector("main").prepend(b);
    }],
    ["a teal gauge", "hue", () => {
      /* Painted by a rule, as a component's class paints it, not inline (an inline colour is the data's, and exempt). */
      const css = document.createElement("style");
      css.textContent = ".materials-self-test-teal { width: 120px; height: 8px; background: oklch(0.6 0.11 185); }";
      document.head.append(css);
      const g = document.createElement("div");
      g.setAttribute("role", "meter");
      g.className = "materials-self-test-teal";
      document.querySelector("main").prepend(g);
    }],
    ["a Press plate's kind", "kind", () => {
      const p = document.createElement("div");
      p.setAttribute("data-part", "raised-block");
      p.style.cssText = "width: 40px; height: 40px";
      document.querySelector("main").prepend(p);
    }],
    ["a stage on a dark screen", "ground", () => {
      const box = document.querySelector("main section[data-arrive=stage] .row-start-1.col-span-2");
      box.removeAttribute("data-part");
      box.classList.add("litt-raised");
    }],
    ["a Device key's kind on Flat's player", "kind", () => {
      document.querySelector('[data-play-object="flat"] [data-part="pill"]').setAttribute("data-part", "key");
    }, FLAT],
    ["an unmarked Play on Flat's player", "unmarked", () => {
      document.querySelector('[data-play-object="flat"] button[aria-label="Play"]').removeAttribute("data-part");
    }, FLAT],
  ].map(([label, rule, mutate, page = DEVICE]) => [label, rule, mutate, page]);
  for (const page of [DEVICE, FLAT]) {
    const clean = await check(page, "light");
    if (clean.length) { console.error(`materials --self-test: ${page} is not clean to start with:\n  ${clean.join("\n  ")}`); process.exit(1); }
  }
  let missed = 0;
  for (const [label, rule, mutate, page] of breaks) {
    const found = await check(page, "light", mutate);
    const caught = found.some((f) => f.split(" · ")[2] === rule);
    if (!caught) missed++;
    console.log(`${caught ? "✓" : "✗"} self-test: ${label} ${caught ? "is caught" : "is MISSED"}${caught ? `: ${found.find((f) => f.split(" · ")[2] === rule).split(" · ").slice(3).join(" · ")}` : ""}`);
  }
  await browser.close();
  server.close();
  if (missed) { console.error(`\nmaterials --self-test: ${missed} injected break${missed === 1 ? "" : "s"} went unseen.`); process.exit(1); }
  console.log(`\nmaterials --self-test: all ${breaks.length} injected breaks are caught.`);
  process.exit(0);
}

const jobs = PAGES.flatMap((r) => ["light", "dark"].map((t) => [r, t]));
const found = [];
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < jobs.length) {
    const [r, t] = jobs[next++];
    found.push(...(await check(r, t)));
  }
}));
await browser.close();
server.close();

const known = found.filter((f) => KNOWN.includes(f));
const fails = found.filter((f) => !KNOWN.includes(f)).sort();
const gone = KNOWN.filter((k) => !found.includes(k) && (!only.length || only.some((p) => k.startsWith(p + " "))));
for (const k of known) console.log(`known · ${k}`);
for (const f of fails) console.error(`✗ ${f}`);
for (const g of gone) console.error(`✗ fixed, take it out of KNOWN: ${g}`);
if (fails.length || gone.length) {
  console.error(`\nmaterials: ${fails.length} break${fails.length === 1 ? "" : "s"} of Device's materials and colour rule on ${PAGES.length} pages${gone.length ? `, ${gone.length} KNOWN entr${gone.length === 1 ? "y" : "ies"} gone` : ""}.`);
  process.exit(1);
}
const flat = PAGES.filter((r) => worldOf(r) === "flat").length;
console.log(`materials: ${PAGES.length - flat} Device pages, light and dark, keep Device's kinds, its colour rule and a plate under every stage; ${flat} Flat pages keep Flat's kinds and a marked player${known.length ? ` (${known.length} known)` : ""}.`);
