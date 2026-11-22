#!/usr/bin/env node
/**
 * World material checks (plans/024, Device, phase 2; Flat leftovers; Heat & Rack invariants), after the components
 * repo's check:anatomy. From a build, on the player (#device) and every #device/* page (scripts/routes.mjs), plus
 * Flat (#flat, #flat/components), Heat (#heat, #heat/components), and Rack (#rack, #rack/components), light and dark,
 * at 1440 by 900, with Variants open.
 *
 *   npm run build && npm run test:materials
 *   node scripts/materials.mjs --pages device/button,device/tag
 *   node scripts/materials.mjs --study poll,slider   judges #flat/poll and #flat/slider as studies, at the bar or not
 *   node scripts/materials.mjs --self-test     injects 16 material breaks across Device, Flat, Heat, Rack, Press and a
 *                                              Flat study, fails if one is missed or a correct study is not clean
 *
 * It fails when, anywhere on a Device page:
 * - an element carries a data-part kind that is not one of Device's (KINDS, after litt-principles.md, Device's materials,
 *   and plans/024's table),
 * - the accent (orange) shows as a fill, a text colour, an SVG fill or stroke, or a border, except in a lamp (an element
 *   in data-part="light"); a hand on it and the focus ring are never at rest, and the ring is an outline or a shadow,
 *   which this does not read,
 * - any other colour shows: a data hue, green or amber. The body's greys and the ink are fine; so are red (REC, the
 *   playhead, a fault) and the one blue on the screen (selection on glass, --select), within 0.03 in OKLab,
 * - a stage's ground is not the plate: every component stage (section[data-arrive=stage] > its box), every study stage
 *   below them (Anatomy, States and Replay, [data-stage=study], plans/audits/device.md, finding 4) and every wall tile
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
 * A Flat study at the bar (plans/027: an id in BAR.flat in play-object/takes.ts, read here by regex) is also held to the
 * bar's rules 3 and 4 on its page, #flat/<id>, in every component stage in main (the lead and each stage in Variants),
 * judging the demo itself: the box's own DOM, or its preview panel's, never the stage's title, caption or buttons. A
 * study fails
 * - root, when its object does not stand on the ground as Flat builds it, ground, then paper, then part: the first marked
 *   or painted things down from the stage (through wrappers that paint nothing) hold no paper, ink card or float and no
 *   lone pill, circle, outline or ink (a button, a switch: a part shown on its own stands on the ground), or one of them
 *   is a part that belongs inside paper (a figure, a bubble, a mark), or nothing is there at all. Words (lettering) may
 *   stand on the ground beside an object,
 * - unmarked, when something it paints (a fill, a drawn border, an SVG shape's fill or stroke, its own words) is in no
 *   part: neither marked itself nor inside a marked part below the paper, ink card or float that holds it (those hold
 *   parts; they are not one),
 * - gradient, when a gradient (a background's, or an SVG gradient's stops) has a colour that is neither a grey nor a
 *   step of the sunset ramp (--data-seq-1 to 4, resolved where it is drawn), within 0.04 in OKLab: how much, and how far
 *   along, is the ramp and no other gradient,
 * - ink, when more than one thing in a stage is filled with the ink (--accent as a background, 8px by 8px and up, so a
 *   hairline is not a fill): one primary action per view. What is on is exempt (aria-checked, -pressed, -selected or
 *   -current, data-state checked, on or active, or a checked input it labels), so is a slider's value (its pulled-out
 *   part and its knob, in a control that holds only sliders), and so is an ink card, which is the opposite theme and
 *   its own rule.
 * Content is content here too (images, video, canvas, code, [data-artwork], a colour the data paints inline), and so is
 * what is hidden or visually hidden. What a study opens over the page (a float in a portal) is not in the stage, so not
 * read. --study <ids> reads only those pages as studies, whether or not they are in BAR yet, prints every break and a
 * count per rule, and fails when there is one: what a builder runs before an id joins BAR.
 *
 * On Heat's pages (#heat, #heat/components) it fails when data-material is not "heat", when the player omits
 * [data-play-object="heat"], when any Heat body or player-body surface casts a drop shadow (non-zero offset or blur;
 * zero-offset 1px outlines pass), or when a Heat slab/control rounds its corners (radio circles and tiny <=16px marks exempt).
 *
 * On Rack's pages (#rack, #rack/components) it fails when data-material is not "rack", when the player omits
 * [data-play-object="rack"], or when any Rack body or player-body surface casts a drop shadow (zero-offset 1px outlines pass).
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

/** Press's data-part kinds (plans/024, Press, phase 1). */
export const PRESS_KINDS = ["surface", "tray", "cut", "block", "plate", "slot", "fill", "cap", "notch", "mark", "glass", "lettering"];

/**
 * A world's studies at its bar (plans/027), read from BAR in play-object/takes.ts by regex, as the page scripts read
 * meta: each world's list is a one-line array literal of string ids, in the order they passed.
 */
export function barOf(world) {
  const src = fs.readFileSync(path.join(here, "..", "src", "gallery", "play-object", "takes.ts"), "utf8");
  const bar = /export const BAR\b[\s\S]*?\n\};/.exec(src)?.[0];
  if (!bar) throw new Error("materials: no `export const BAR` in play-object/takes.ts");
  const list = new RegExp(`\\b${world}:\\s*\\[([^\\]\\n]*)\\]`).exec(bar)?.[1];
  return list ? [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
}
/** Flat's studies at the bar. */
export const BAR_FLAT = barOf("flat");

/** Breaks not fixed yet, as "page · theme · rule · what": printed, never failing, and failing once gone. */
const KNOWN = [];

/* --study poll,slider (or flat/poll): pages judged as Flat studies though not in BAR yet, and only those pages. */
const studyOnly = (get("study", "") || "").split(",").filter(Boolean).map((id) => id.replace(/^flat\//, ""));
const SELF_STUDY = "flat/poll";
const only = (get("pages", selfTest ? `device/button,flat,heat,rack,press,${SELF_STUDY}` : studyOnly.map((id) => `flat/${id}`).join(",")) || "").split(",").filter(Boolean);
/** The pages read as Flat studies: BAR.flat's and --study's (and, in the self-test, Poll's, on a study it builds). */
const STUDIES = new Set([...BAR_FLAT, ...studyOnly].map((id) => `flat/${id}`));
{
  const flatRoutes = new Set(routes({ only: ["flat"] }));
  const stray = [...STUDIES].filter((r) => !flatRoutes.has(r));
  if (stray.length) {
    console.error(`materials: ${stray.join(", ")} ${stray.length === 1 ? "is" : "are"} not a page in Flat (BAR.flat in play-object/takes.ts, or --study).`);
    process.exit(1);
  }
}
/* #device is the player: the recorder and what its screen shows, read since plan 024's phase 4 drew it in Device's materials.
   Flat, Heat, Rack, and Press are read on their players and their gallery views, which between them draw every world body. */
const PAGES = only.length
  ? only
  : [
      ...routes({ only: ["device"] }).filter((r) => r === "device" || r.startsWith("device/")),
      "flat",
      "flat/components",
      "heat",
      "heat/components",
      "rack",
      "rack/components",
      "press",
      "press/components",
      ...[...STUDIES],
    ];
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
function read([KINDS, world, route, study]) {
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

  /* Press material invariants (default data-material, mounted PlayObject, PRESS_KINDS, zero button border outline). */
  if (world === "press") {
    const mat = document.documentElement.getAttribute("data-material");
    if (mat !== null) add("material", `expected no data-material attribute on <html> for Press, got "${mat}"`);
    const player = document.querySelector('[data-play-object="press"]');
    if (route === "press" && !player) add("object", `missing [data-play-object="press"] on #${route}`);
    for (const el of document.querySelectorAll("[data-part]")) {
      const k = el.getAttribute("data-part");
      if (!KINDS.includes(k)) add("kind", `data-part="${k}" is not a Press kind: ${name(el)}`);
    }
    for (const el of document.querySelectorAll('button[data-body="press"], [data-body="press"] button[data-part="block"]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      const hasBorder = ["Top", "Right", "Bottom", "Left"].some(
        (side) => parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== "none",
      );
      if (hasBorder) add("outline", `a Press button has a border outline (${cs.borderWidth}): ${name(el)}`);
    }
    return out;
  }

  /* Heat and Rack material invariants (zero cast shadows; square corners on Heat; mounted PlayObject). */
  if (world === "heat" || world === "rack") {
    const mat = document.documentElement.getAttribute("data-material");
    if (mat !== world) add("material", `expected data-material="${world}" on <html>, got "${mat}"`);
    const player = document.querySelector(`[data-play-object="${world}"]`);
    if (route === world && !player) add("object", `missing [data-play-object="${world}"] on #${route}`);

    /** True when a computed boxShadow string casts a drop shadow (non-zero offset or blur); 0 0 0 Npx outlines pass. */
    const hasCastShadow = (bs) => {
      if (!bs || bs === "none") return false;
      const layers = [];
      let depth = 0;
      let start = 0;
      for (let i = 0; i < bs.length; i++) {
        if (bs[i] === "(") depth++;
        else if (bs[i] === ")") depth--;
        else if (bs[i] === "," && depth === 0) { layers.push(bs.slice(start, i)); start = i + 1; }
      }
      layers.push(bs.slice(start));
      for (const layer of layers) {
        const stripped = layer.replace(/[a-z-]+\([^()]*\)/gi, "").replace(/\binset\b/gi, "");
        const nums = [...stripped.matchAll(/-?\d+(?:\.\d+)?px/g)].map((m) => parseFloat(m[0]));
        const [x = 0, y = 0, blur = 0] = nums;
        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01 || blur > 0.01) return true;
      }
      return false;
    };

    const targets = new Set();
    if (player) {
      for (const child of player.querySelectorAll(":scope > :not(:first-child)")) {
        if (child.getAttribute("role") === "status") continue;
        targets.add(child);
        for (const el of child.querySelectorAll("*")) {
          if (el.closest("[data-play-frame=screen]")) continue;
          targets.add(el);
        }
      }
    }
    for (const body of document.querySelectorAll(`[data-body="${world}"]`)) {
      targets.add(body);
      for (const el of body.querySelectorAll("*")) targets.add(el);
    }

    for (const el of targets) {
      if (el instanceof SVGElement) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      if (hasCastShadow(cs.boxShadow)) add("shadow", `a cast shadow (${cs.boxShadow}) on ${name(el)}`);
      if (world === "heat") {
        const isRadio = el.matches('input[type="radio"], [role="radio"]');
        const isTinyDot = r.width <= 16 && r.height <= 16;
        if (!isRadio && !isTinyDot) {
          const radii = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius];
          if (radii.some((v) => parseFloat(v) > 0.5)) {
            add("radius", `rounded corner (${cs.borderRadius}) on Heat ${name(el)}`);
          }
        }
      }
    }
    return out;
  }

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
    if (!study) return out;

    /* A study, at the bar or asked for: its object in every component stage in main, held to the bar's rules 3 and 4. */
    const CONTAINERS = ["paper", "ink-card", "float"];
    const ALONE = ["pill", "circle", "outline", "ink"];
    const ON = '[aria-checked=true], [aria-pressed=true], [aria-selected=true], [aria-current]:not([aria-current=false]), [data-state=checked], [data-state=on], [data-state=active]';
    const HAND = 'button, a[href], input, select, textarea, [role=slider], [role=switch], [role=checkbox], [role=radio], [role=tab], [role=option], [role=menuitem], [role=button], [tabindex]:not([tabindex="-1"])';
    const isContent = (el) =>
      !!el.closest("img, video, canvas, picture, pre, code, [data-artwork]") ||
      /* A colour the data paints inline, with no token in it, is the data's. */
      (/background/.test(el.getAttribute("style") || "") && !/var\(/.test(el.style.background + el.style.backgroundColor + el.style.backgroundImage));
    const opaque = (c) => rgba(c)[3] >= 0.15;
    /** A token's colour where an element is drawn: under the nearest flipped theme (an ink card), or in the stage. */
    const probed = new Map();
    const tokenAt = (el, demo, prop, value) => {
      const ctx = el.closest("[data-theme]");
      const at = ctx && demo.contains(ctx) ? ctx : demo;
      let m = probed.get(at);
      if (!m) probed.set(at, (m = new Map()));
      if (!m.has(value)) {
        const p = document.createElement("div");
        p.style.cssText = `position:absolute;width:0;height:0;${prop}:${value}`;
        at.append(p);
        m.set(value, getComputedStyle(p)[prop === "color" ? "color" : "backgroundColor"]);
        p.remove();
      }
      return m.get(value);
    };
    /** Seen as a person sees it: laid out, not hidden, not visually hidden, not faded out. */
    const shown = (el, cs, r) => {
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      if (r.width < 1 || r.height < 1 || (r.width <= 1 && r.height <= 1)) return false;
      if (cs.clipPath === "inset(50%)" || /rect\(0px,? 0px,? 0px,? 0px\)/.test(cs.clip)) return false;
      let o = 1;
      for (let p = el; p && p !== document.documentElement; p = p.parentElement) o *= Number(getComputedStyle(p).opacity);
      return o >= 0.05;
    };
    const SHAPES = ["path", "circle", "rect", "line", "polyline", "polygon", "ellipse", "text", "use"];
    /** What an element paints itself, in words ("a fill", "words"…), or "" when it paints nothing. */
    const paints = (el, cs) => {
      const what = [];
      if (el instanceof SVGElement) {
        if (!SHAPES.includes(el.tagName.toLowerCase())) return "";
        if (cs.fill && cs.fill !== "none" && (cs.fill.startsWith("url") || opaque(cs.fill)) && Number(cs.fillOpacity) > 0) what.push("an SVG fill");
        if (cs.stroke && cs.stroke !== "none" && parseFloat(cs.strokeWidth) > 0 && (cs.stroke.startsWith("url") || opaque(cs.stroke))) what.push("an SVG stroke");
      } else {
        if (opaque(cs.backgroundColor)) what.push("a fill");
        if (cs.backgroundImage !== "none") what.push("a background image");
        if (["Top", "Right", "Bottom", "Left"].some((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== "none" && opaque(cs[`border${s}Color`]))) what.push("a border");
      }
      if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && opaque(cs.color)) what.push("words");
      return what.join(" and ");
    };
    /** The part an element is in: its own mark, or the nearest marked ancestor in the study below its container. */
    const partOf = (el, demo) => {
      for (let p = el; p && p !== demo; p = p.parentElement) {
        const k = p.getAttribute("data-part");
        if (k) return CONTAINERS.includes(k) && p !== el ? null : k;
      }
      return null;
    };
    /** The ink and the ramp, near enough: 0.03 and 0.04 in OKLab, as the Device checks compare --select. */
    const close = (a, b, d) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < d;
    const grey = (c) => { const [r, g, b, a] = rgba(c); if (a < 0.15) return true; const L = lab([r, g, b]); return Math.hypot(L[1], L[2]) < 0.035; };

    for (const section of document.querySelectorAll("main section[data-arrive=stage]")) {
      if (section.hidden) continue;
      const box = section.querySelector(":scope > .row-start-1.col-span-2, :scope > .contents > .row-start-1.col-span-2");
      if (!box) continue;
      /* With a code view the demo is in the preview panel (the only panel mounted); without, it is the box's own. */
      const demo = box.querySelector(":scope > div > [role=tabpanel]") ?? box;
      if (demo.closest("[hidden]")) continue;
      const label = `"${section.getAttribute("aria-label") || "stage"}"`;
      const els = [...demo.querySelectorAll("*")];

      /* root: down from the stage through wrappers that paint nothing, to the first marked or painted things. */
      const frontier = [];
      const walk = (parent) => {
        for (const c of parent.children) {
          if (isContent(c)) continue;
          const cs = getComputedStyle(c);
          if (cs.display === "none") continue;
          const shownHere = shown(c, cs, c.getBoundingClientRect());
          if (c.getAttribute("data-part")) { if (shownHere || cs.display === "contents") frontier.push(c); continue; }
          if (shownHere && paints(c, cs)) { frontier.push(c); continue; }
          walk(c);
        }
      };
      walk(demo);
      const kinds = frontier.map((el) => el.getAttribute("data-part"));
      if (!kinds.some((k) => CONTAINERS.includes(k) || ALONE.includes(k)))
        add("root", `${label} holds no paper, ink card or float and no lone pill, circle, outline or ink${frontier.length ? `; first on the ground: ${name(frontier[0])}` : ": nothing is marked or painted"}`);
      frontier.forEach((el, i) => {
        const k = kinds[i];
        if (k && !CONTAINERS.includes(k) && !ALONE.includes(k) && k !== "lettering")
          add("root", `a ${k} stands on the ground in ${label}, in no paper: ${name(el)}`);
      });

      /* unmarked, gradient and ink: everything the demo paints. */
      const inks = [];
      for (const el of els) {
        if (isContent(el)) continue;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        /* An SVG gradient's stops have no box: they are judged where a shape is filled or stroked with their gradient. */
        if (!shown(el, cs, r)) continue;
        const what = paints(el, cs);
        if (what && !partOf(el, demo)) add("unmarked", `${what} in no part in ${label}: ${name(el)}`);

        /* gradient: a background's colours, and the stops of an SVG gradient a shape is filled or stroked with. */
        const stops = [];
        if (!(el instanceof SVGElement) && /gradient\(/.test(cs.backgroundImage)) stops.push(...colours(cs.backgroundImage));
        if (el instanceof SVGElement)
          for (const paint of [cs.fill, cs.stroke]) {
            const id = /^url\("?#([^")]+)"?\)/.exec(paint || "")?.[1];
            let g = id && document.getElementById(id);
            for (let hop = 0; g && hop < 3 && !g.querySelector("stop"); hop++) {
              const href = (g.getAttribute("href") || g.getAttribute("xlink:href") || "").replace(/^#/, "");
              g = href ? document.getElementById(href) : null;
            }
            if (g) for (const s of g.querySelectorAll("stop")) stops.push(getComputedStyle(s).stopColor);
          }
        if (stops.length) {
          const ramp = [1, 2, 3, 4].map((n) => lab(rgba(tokenAt(el, demo, "color", `var(--data-seq-${n})`))));
          for (const c of stops) {
            if (grey(c)) continue;
            const L = lab(rgba(c));
            if (!ramp.some((s) => close(L, s, 0.04))) add("gradient", `a gradient off the sunset ramp (${c}) in ${label}: ${name(el)}`);
          }
        }

        /* ink: a background filled with the ink, 8px by 8px and up, not what is on, not an ink card's. */
        if (!(el instanceof SVGElement) && r.width >= 8 && r.height >= 8 && rgba(cs.backgroundColor)[3] >= 0.5 && !el.closest('[data-part="ink-card"]')) {
          const ink = lab(rgba(tokenAt(el, demo, "background-color", "var(--accent)")));
          if (close(lab(rgba(cs.backgroundColor)), ink, 0.03)) {
            /* Looked for inside the demo only: the preview panel it sits in is itself data-state="active". */
            let on = !!el.querySelector(ON) || !!el.parentElement?.querySelector(":scope > input:checked");
            for (let p = el; !on && p && p !== demo; p = p.parentElement) on = p.matches(ON) || (p.tagName === "LABEL" && !!p.querySelector("input:checked"));
            /* A slider's pulled-out part and its knob are its value, what is on: the control nearest the fill (the
               first element up from it that is or holds something a hand uses) holds only sliders. */
            for (let p = el; !on && p && p !== demo; p = p.parentElement) {
              /* Only what a person can reach: in a form, each thumb has a hidden input beside it that is no control. */
              const hands = [...(p.matches(HAND) ? [p] : []), ...p.querySelectorAll(HAND)].filter(
                (h) => !h.matches("input[type=hidden]") && !h.closest("[aria-hidden=true]") && getComputedStyle(h).display !== "none",
              );
              if (!hands.length) continue;
              on = hands.every((h) => h.matches("[role=slider], input[type=range]"));
              break;
            }
            if (!on && !inks.some((i) => i.contains(el))) inks.push(el);
          }
        }
      }
      if (inks.length > 1) add("ink", `${inks.length} ink fills in ${label}, one primary action per view: ${inks.map(name).join(", ")}`);
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
    /* The study's stages under the lead (Anatomy, States, Replay): plates too, never a dark slab. */
    ...document.querySelectorAll("main [data-stage=study]"),
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
    /* A mutation is one function or several, run in order (the study self-test builds a study, then breaks it). */
    for (const m of [mutate].flat().filter(Boolean)) await pg.evaluate(m);
    const w = worldOf(route);
    const study = STUDIES.has(route) || (selfTest && route === SELF_STUDY);
    const rules = [w === "flat" ? FLAT_KINDS : w === "press" ? PRESS_KINDS : KINDS, w, route, study];
    const found = (await pg.evaluate(read, rules)).map(([rule, what]) => `${route} · ${theme} · ${rule} · ${what}`);
    /* The player: Home, then every take on its screen, stepped with the tape's keys as a person would. */
    const slider = pg.locator("[data-play-object] [role=slider][aria-label=Take]");
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
  /* Sixteen breaks: Device's 5 checks on #device/button (the ground twice: a lead stage and an Anatomy stage), Flat's 2 checks on #flat, Heat's 2 checks (radius & shadow)
     on #heat, Rack's cast-shadow check on #rack, Press's 2 checks (outline & kind) on #press, and a Flat study's 4 (root,
     unmarked, gradient, ink) on #flat/poll, each breaking a correct study the self-test builds there first. That study,
     unbroken, must be clean: the rules can pass. */
  const [DEVICE, FLAT, HEAT, RACK, PRESS, STUDY] = PAGES;
  /** A correct Flat study in the lead stage of #flat/poll, every other stage gone: a paper of marked parts, one ink pill, a ramp bar. */
  const study = () => {
    const sections = [...document.querySelectorAll("main section[data-arrive=stage]")];
    for (const s of sections.slice(1)) s.remove();
    const box = sections[0].querySelector(":scope > .row-start-1.col-span-2, :scope > .contents > .row-start-1.col-span-2");
    const demo = box.querySelector(":scope > div > [role=tabpanel]") ?? box;
    demo.innerHTML = `
      <div data-part="paper" data-self-test="paper" style="display:grid;gap:12px;width:280px;padding:16px;border-radius:var(--radius-surface);background:var(--surface-1)">
        <p data-part="lettering" style="color:var(--fg)">Issue 14 goes out Friday at 9:00</p>
        <span data-part="figure" style="color:var(--fg);font-size:32px">1,204 readers</span>
        <div data-part="mark" style="height:8px;border-radius:var(--radius-pill);background:linear-gradient(90deg, var(--data-seq-1), var(--data-seq-2), var(--data-seq-3), var(--data-seq-4))"></div>
        <span data-part="bubble" style="padding:4px 8px;border-radius:var(--radius-control);background:var(--surface-3);color:var(--fg)">This week</span>
        <svg data-part="mark" width="16" height="16" viewBox="0 0 16 16"><path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        <button data-part="ink" data-self-test="ink" style="border:0;padding:8px 16px;border-radius:var(--radius-control);background:var(--accent);color:var(--accent-fg)">Subscribe</button>
        <button data-part="outline" style="padding:8px 16px;border-radius:var(--radius-control);border:1.5px solid var(--line-control);background:transparent;color:var(--fg)">Read the letter</button>
      </div>
      <p data-part="lettering" style="color:var(--fg-subtle)">Spring series · twelve pictures from the coast</p>`;
  };
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
    ["a dark Anatomy stage", "ground", () => {
      const box = document.querySelector("main [data-stage=study]");
      box.removeAttribute("data-part");
      box.classList.add("litt-raised");
    }],
    ["a Device key's kind on Flat's player", "kind", () => {
      document.querySelector('[data-play-object="flat"] [data-part="pill"]').setAttribute("data-part", "key");
    }, FLAT],
    ["an unmarked Play on Flat's player", "unmarked", () => {
      document.querySelector('[data-play-object="flat"] button[aria-label="Play"]').removeAttribute("data-part");
    }, FLAT],
    ["a rounded slab on Heat's player", "radius", () => {
      document.querySelector('[data-play-object="heat"] > :nth-child(2)').style.borderRadius = "12px";
    }, HEAT],
    ["a drop shadow on Heat's player", "shadow", () => {
      document.querySelector('[data-play-object="heat"] > :nth-child(2)').style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.35)";
    }, HEAT],
    ["a drop shadow on Rack's player", "shadow", () => {
      document.querySelector('[data-play-object="rack"] > :nth-child(2)').style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.35)";
    }, RACK],
    ["an outlined button on Press's player", "outline", () => {
      document.querySelector('[data-play-object="press"] button[data-body="press"]').style.border = "1px solid var(--line-strong)";
    }, PRESS],
    ["a Device kind on Press's player", "kind", () => {
      const d = document.createElement("div");
      d.setAttribute("data-part", "lcd");
      document.querySelector('[data-play-object="press"]').append(d);
    }, PRESS],
    ["a study's paper unmarked, its parts on the ground", "root", [study, () => {
      document.querySelector('main [data-self-test="paper"]').removeAttribute("data-part");
    }], STUDY],
    ["an unmarked pill in a study's paper", "unmarked", [study, () => {
      document.querySelector('main [data-self-test="ink"]').removeAttribute("data-part");
    }], STUDY],
    ["a green-to-blue gradient in a study", "gradient", [study, () => {
      /* Painted by a rule, as a component's class paints it: an inline colour is the data's, and exempt. */
      const css = document.createElement("style");
      css.textContent = ".materials-self-test-gradient { height: 8px; background: linear-gradient(90deg, oklch(0.7 0.17 150), oklch(0.6 0.17 250)); }";
      document.head.append(css);
      const g = document.createElement("div");
      g.setAttribute("data-part", "mark");
      g.className = "materials-self-test-gradient";
      document.querySelector('main [data-self-test="paper"]').append(g);
    }], STUDY],
    ["a second ink fill in a study", "ink", [study, () => {
      const b = document.querySelector('main [data-self-test="ink"]').cloneNode(true);
      b.textContent = "Share";
      document.querySelector('main [data-self-test="paper"]').append(b);
    }], STUDY],
  ].map(([label, rule, mutate, page = DEVICE]) => [label, rule, mutate, page]);
  for (const page of [DEVICE, FLAT, HEAT, RACK, PRESS, STUDY]) {
    /* The study page starts from the correct study, which must be clean: the study rules can pass, not only fail. */
    const clean = await check(page, "light", page === STUDY ? study : undefined);
    if (clean.length) { console.error(`materials --self-test: ${page}${page === STUDY ? "'s correct study" : ""} is not clean to start with:\n  ${clean.join("\n  ")}`); process.exit(1); }
    if (page === STUDY) console.log(`✓ self-test: a correct Flat study on ${STUDY} passes the study rules`);
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
/* Each study's breaks by rule, light and dark together: what a builder reads before an id joins BAR.flat. */
const STUDY_RULES = ["root", "unmarked", "gradient", "ink"];
for (const page of PAGES.filter((r) => STUDIES.has(r))) {
  const mine = fails.filter((f) => f.startsWith(`${page} · `));
  const by = (rule) => mine.filter((f) => f.split(" · ")[2] === rule).length;
  const other = mine.length - STUDY_RULES.reduce((n, r) => n + by(r), 0);
  console.log(`study · ${page} · ${STUDY_RULES.map((r) => `${r} ${by(r)}`).join(", ")}${other ? `, other ${other}` : ""}${mine.length ? "" : " · at the bar's rules 3 and 4"}`);
}
if (fails.length || gone.length) {
  console.error(`\nmaterials: ${fails.length} break${fails.length === 1 ? "" : "s"} across ${PAGES.length} pages${gone.length ? `, ${gone.length} KNOWN entr${gone.length === 1 ? "y" : "ies"} gone` : ""}.`);
  process.exit(1);
}
const flat = PAGES.filter((r) => worldOf(r) === "flat").length;
const heat = PAGES.filter((r) => worldOf(r) === "heat").length;
const rack = PAGES.filter((r) => worldOf(r) === "rack").length;
const press = PAGES.filter((r) => worldOf(r) === "press").length;
const device = PAGES.length - flat - heat - rack - press;
const studies = PAGES.filter((r) => STUDIES.has(r)).length;
console.log(`materials: ${device} Device, ${flat} Flat, ${heat} Heat, ${rack} Rack, and ${press} Press pages, light and dark, keep their material rules${known.length ? ` (${known.length} known)` : ""}; ${studies ? `${studies} Flat stud${studies === 1 ? "y keeps" : "ies keep"} the bar's` : "no Flat study is at the bar yet to hold to its"} rules 3 and 4.`);
