#!/usr/bin/env node
/**
 * litt.md: check
 *
 * Run after any change to tokens or docs:
 *   node skills/litt-md/scripts/check.mjs
 *
 * 1. Links:     every path the skill's docs reference exists.
 * 2. Drift:     every hex value in the rule and spec Markdown exists in tokens.css.
 *               (journal.md and inspirations.md record outside values and are exempt.)
 * 3. Parity:    the two dark blocks in tokens.css are identical.
 * 4. Coverage:  every themed token is defined in both light and dark (R2).
 * 5. Contrast:  text, control lines, focus, accent, status and data-hue pairs meet WCAG
 *               (each data hue's -text tone is also checked on its own tint, and the accent's text
 *               on its tint), the text inks reach APCA Lc 60 on every surface, which WCAG 2
 *               overrates for grey on dark, and both accents (Blue 4 and pink) stand apart from the data hues (R6):
 *               its fill at least 0.12 from each hue's mark and its text from each hue's text, in OKLab. The inks keep
 *               4.5:1 on a hovered block (--block-hover), under Press and under Flat.
 * 6. Weight:    weight by role (R8): --weight 400 (text), --weight-title 500 (titles),
 *               --weight-label 600 (12px labels). Nothing at 700 or more or below 400, no
 *               font-medium, -semibold or -bold (font-title and font-label are the role
 *               utilities), no 600 above the caption size, Google Fonts loads only
 *               400, 500 and 600 (the mono too, for Device's full mono).
 * 7. Radius:    corners are 0, --radius-control (4), --radius-surface (control + 4) or pill, and a block set
 *               2px into a control takes the control radius less 2px.
 * 8. Shadows:   the depth ladder (R3). Flat and floating things have no offset: an outer shadow is a zero-offset
 *               glow or ring, and an inset is the top highlight or a hairline. The press tokens (material.md, 6)
 *               are the sunken and raised steps, bounded: nothing moves sideways, a raised cast goes at most 3px
 *               down and blurs at most 6px, and an inset shade moves at most 1px and blurs at most 2px. The light
 *               comes from the top (R2): a cut thing never lights its top edge, a raised thing never its lower one.
 * 9. Motion:    three tiers (instant tween at most 240ms; springs with visual time at most
 *               350ms, bounce at most 0.12 and 0 on responsive; settle at most 600ms; exits
 *               at visual time x --exit with --ease-out); reduced motion zeroes every --dur-*,
 *               --stagger and --travel; transitions use the tier tokens and animate only
 *               transform, opacity and color fades; no layout properties and no `all`.
 * 10. Frontmatter: SKILL.md name and description follow the skill rules.
 * 11. Flat:    data-material="flat" (proposals/flat.md). Every --flat-* neutral is its stone twin at chroma 0 and the
 *               same OKLCH lightness, in both themes; the flat block maps every neutral onto its mirror and comes
 *               after monochrome; nothing in it casts, blurs, sinks or is "none"; it restates the focus ring and the
 *               data tints. Check 5 runs every pair again under Flat.
 * 12. Device:  data-material="device" (proposals/device.md). Every --device-* value is defined in both themes; the
 *               device block maps every neutral and press token onto its --device-* twin, comes after Flat, sinks 2px
 *               and restates the focus ring and the data tints; pink and monochrome are restated on Device after it; reduced
 *               motion stills the key; the glass sets the mono, its ink reaches 7:1 and its placeholder 4.5:1, and the
 *               field's edge 3:1 on the body. Check 5 runs every pair again under Device, and check 8 holds its shadows.
 * 13. Worlds:  each world's own accent and face (proposals/worlds.md, decision 14). With no attribute Press is Blue 4 in
 *               Helvetica Neue, Flat the ink in Geist and Device orange in Geist Mono: Press's face is on every theme
 *               root, the flat block restates monochrome's, and each face reads --font-choice first, so a chosen face
 *               wins, and nothing in litt declares it. data-accent="blue" asks for Blue 4 anywhere: its block, and
 *               Blue 4 and pink restated after Flat as after Device, match their own blocks. An element that sets a
 *               theme or a material sets the family again (tailwind.css). Check 5 runs every Flat pair with the ink as
 *               the accent, and every Blue 4 pair in every world. Device's fill is one orange (v1.13): the light body's
 *               fill, hover and words are the screens', and that fill's 3:1 against the light page is not asked.
 *               Rack is yellow in Inter.
 * 14. Rack:    data-material="rack" (proposals/rack.md). Every --rack-* value is defined in both themes; the rack block
 *               maps every neutral, hue and press token onto its --rack-* twin, comes after Device, sinks nothing, casts
 *               nothing (every raised or sunken step is a zero-offset 1px outline or empty), restates the focus ring and
 *               maps each data tint onto its own --rack-data-*-tint (a clip's fill, which check 5 holds its -text tone
 *               to 4.5:1 on, and its mark to 3:1, the clip's waveform); Blue 4, pink and monochrome are restated after it. Its yellow is only a fill: its
 *               links and focus ring are the ink, and a lit key's outline (--block-lift over the body) reaches 3:1 on the
 *               body and the panels, which carries the light fill there. Check 5 runs every pair again under Rack.
 *
 * Exits 1 if anything fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(skillDir, p), "utf8");
// Comments may name forbidden values ("so font-semibold doesn't exist"), so checks skip them.
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
// Split a CSS value on top-level commas, ignoring commas inside parentheses.
const splitLayers = (v) => {
  const out = []; let depth = 0, cur = "";
  for (const ch of v) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};
const failures = [];
const warnings = [];
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => { failures.push(msg); console.log(`  ✗ ${msg}`); };
const warn = (msg) => { warnings.push(msg); console.log(`  ! ${msg}`); };

const ruleDocs = [
  "SKILL.md", "taste/profile.md",
  ...fs.readdirSync(path.join(skillDir, "workflows")).map((f) => `workflows/${f}`),
  ...fs.readdirSync(path.join(skillDir, "system")).map((f) => `system/${f}`),
].filter((f) => f.endsWith(".md"));

// 1. Links ---------------------------------------------------------------
console.log("Links");
const linkRe = /`((?:workflows|system|taste|assets|scripts)\/[\w.-]+\.(?:md|css|html|mjs))`/g;
let linkCount = 0;
for (const doc of ruleDocs) {
  for (const [, p] of read(doc).matchAll(linkRe)) {
    linkCount++;
    if (!fs.existsSync(path.join(skillDir, p))) fail(`${doc} references missing file ${p}`);
  }
}
if (!failures.length) ok(`${linkCount} file references resolve`);

// Parse tokens.css ----------------------------------------------------------
const css = read("assets/tokens.css");
const block = (re) => {
  const m = css.match(re);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 1, start = i;
  while (depth && i < css.length) { if (css[i] === "{") depth++; if (css[i] === "}") depth--; i++; }
  return css.slice(start, i - 1);
};
const decls = (body) => {
  const map = new Map();
  for (const [, k, v] of strip(body || "").matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    map.set(k, v.trim().replace(/\s+/g, " "));
  }
  return map;
};
const rawLight = decls(block(/:root,\s*\[data-theme="light"\]\s*\{/));
const rawDark = decls(block(/\n\[data-theme="dark"\]\s*\{/));
const darkMedia = decls(block(/:root:not\(\[data-theme="light"\]\)\s*\{/));
/* A theme token may name another in the same block (--accent is var(--accent-blue), Press's own): the checks read the value. */
const resolve = (map) => {
  const out = new Map(map);
  for (const [k, v] of out) {
    let x = v;
    for (let i = 0; i < 4 && /^var\((--[\w-]+)\)$/.test(x) && out.has(/^var\((--[\w-]+)\)$/.exec(x)[1]); i++) x = out.get(/^var\((--[\w-]+)\)$/.exec(x)[1]);
    out.set(k, x);
  }
  return out;
};
const light = resolve(rawLight), dark = resolve(rawDark);
const rgb = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
const lum = (h) => { const [r, g, b] = rgb(h).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const toLab = (h) => {
  const [r, g, b] = rgb(h).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const fromLab = ([L, a, bb]) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * bb) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return "#" + lin.map((c) => Math.min(1, Math.max(0, c))).map((c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)).map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
};
/* Monochrome's tones (the ink as the accent), mixed in OKLab as tokens.css's color-mix does. Flat's own accent. */
const mixHex = (a, b, t) => { const [A, B] = [toLab(a), toLab(b)]; return fromLab(A.map((v, i) => v * (1 - t) + B[i] * t)); };
const inkAccent = (out) => {
  const fg = out.get("--fg"), canvas = out.get("--canvas");
  out.set("--accent", fg);
  out.set("--accent-hover", mixHex(fg, canvas, 0.18));
  out.set("--accent-fg", canvas);
  out.set("--accent-text", fg);
  out.set("--accent-tint", mixHex(canvas, fg, 0.07));
  out.set("--focus", fg);
  return out;
};

/* Flat (proposals/flat.md): data-material="flat" maps each neutral onto its --flat-* mirror, which every theme block
   declares. A theme under Flat is that theme's map with the mirrors swapped in, and the fills Flat gives the press
   tokens: a block is surface-3, a cut surface-1, and a tray has no fill, so what shows through it is the canvas. */
const FLAT_NEUTRALS = ["--canvas", "--well", "--surface-1", "--surface-2", "--surface-3", "--line", "--line-strong", "--line-control", "--fg", "--fg-muted", "--fg-subtle", "--fg-disabled"];
const flatName = (n) => `--flat-${n.slice(2)}`;
const flatOf = (theme, map) => {
  const out = new Map(map);
  for (const n of FLAT_NEUTRALS) {
    if (map.has(flatName(n))) out.set(n, map.get(flatName(n)));
    else fail(`${theme}: ${flatName(n)} is missing`);
  }
  out.set("--block", out.get("--surface-3"));
  out.set("--cut", out.get("--surface-1"));
  out.set("--tray", out.get("--canvas"));
  return inkAccent(out); // Flat's own accent is the ink (decision 14); Blue 4 and pink run as --accent-blue and --accent-pink
};
// Device maps each token onto its --device-* twin (proposals/device.md), the hues included.
const deviceOf = (map) => {
  const out = new Map(map);
  for (const [k, v] of map) if (k.startsWith("--device-") && !k.startsWith("--device-screen-")) out.set(`--${k.slice(9)}`, v);
  return out;
};
// A Device screen (a panel or an overlay on a Device) maps each token onto its --device-screen-* twin.
// Rack maps each token onto its --rack-* twin (proposals/rack.md), the hues included.
const rackOf = (map) => {
  const out = new Map(map);
  for (const [k, v] of map) if (k.startsWith("--rack-")) out.set(`--${k.slice(7)}`, v);
  return out;
};
const screenOf = (map) => {
  const out = new Map(deviceOf(map));
  for (const [k, v] of map) if (k.startsWith("--device-screen-")) out.set(`--${k.slice(16)}`, v);
  return out;
};

// 2. Drift ---------------------------------------------------------------
console.log("Hex drift");
const tokenHexes = new Set([...css.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0].toLowerCase()));
let driftFails = 0;
for (const doc of ruleDocs) {
  for (const m of read(doc).matchAll(/(?<![\w&])#[0-9a-fA-F]{6}\b|(?<![\w&])#[0-9a-fA-F]{3}\b(?![\w-])/g)) {
    if (!tokenHexes.has(m[0].toLowerCase())) { driftFails++; fail(`${doc} mentions ${m[0]}, which is not in tokens.css`); }
  }
}
if (!driftFails) ok("no hex values outside tokens.css");

// 3. Parity ---------------------------------------------------------------
console.log("Dark-block parity");
const diff = [];
for (const k of new Set([...rawDark.keys(), ...darkMedia.keys()])) {
  if (rawDark.get(k) !== darkMedia.get(k)) diff.push(`${k}: [data-theme=dark]=${dark.get(k)} vs media=${darkMedia.get(k)}`);
}
diff.length ? diff.forEach((d) => fail(`dark blocks differ: ${d}`)) : ok(`${rawDark.size} dark declarations match in both blocks`);

// 4. Coverage -------------------------------------------------------------
console.log("Theme coverage (R2)");
const missing = [...light.keys()].filter((k) => !dark.has(k)).concat([...dark.keys()].filter((k) => !light.has(k)));
missing.length ? missing.forEach((k) => fail(`${k} is defined in only one theme`)) : ok(`${light.size} tokens defined in both themes`);

// 5. Contrast -------------------------------------------------------------
console.log("Contrast");
// Every pair runs in each theme, then again under Flat and under Device (checks 11 and 12 hold the mirrors themselves).
const THEMES = [["light", light], ["dark", dark], ["flat light", flatOf("light", light)], ["flat dark", flatOf("dark", dark)], ["device light", deviceOf(light)], ["device dark", deviceOf(dark)], ["device screen", screenOf(light)], ["rack light", rackOf(light)], ["rack dark", rackOf(dark)]];
const pairs = [
  // [foreground, backgrounds, minimum, note]
  ["--fg", ["--canvas", "--well", "--surface-1", "--surface-2", "--surface-3", "--block"], 4.5, "text"],
  ["--fg-muted", ["--canvas", "--well", "--surface-1", "--surface-2", "--surface-3", "--block"], 4.5, "body text"],
  ["--fg-subtle", ["--canvas", "--well", "--surface-1", "--surface-2", "--surface-3", "--block"], 4.5, "supporting text"],
  ["--fg-subtle", ["--tray"], 4.5, "a card picker's labels and lines on its tray"],
  ["--line-control", ["--canvas", "--well", "--surface-1", "--surface-2", "--cut"], 3, "control outline"],
  ["--focus", ["--canvas", "--well", "--surface-1", "--surface-2"], 3, "focus ring"],
  ["--accent-fg", ["--accent", "--accent-hover"], 4.5, "text on accent"],
  ["--danger-fg", ["--danger"], 4.5, "text on the danger fill"],
  ["--accent-text", ["--canvas", "--surface-1", "--surface-2", "--surface-3", "--accent-tint"], 4.5, "accent as link text, on every surface (a raised block carries --fg)"],
  ["--accent", ["--canvas", "--surface-1"], 3, "the accent fill against the page"],
  ["--focus-pink", ["--canvas", "--surface-1", "--surface-2"], 3, "focus ring, pink"],
  ["--accent-pink-fg", ["--accent-pink", "--accent-pink-hover"], 4.5, "text on the pink accent"],
  ["--accent-pink-text", ["--canvas", "--surface-1", "--surface-2", "--surface-3", "--accent-pink-tint"], 4.5, "the pink accent as link text, on every surface"],
  ["--accent-pink", ["--canvas", "--surface-1"], 3, "the pink fill against the page"],
  ["--focus-blue", ["--canvas", "--surface-1", "--surface-2"], 3, "focus ring, Blue 4 asked for (data-accent=blue)"],
  ["--accent-blue-fg", ["--accent-blue", "--accent-blue-hover"], 4.5, "text on Blue 4"],
  ["--accent-blue-text", ["--canvas", "--surface-1", "--surface-2", "--surface-3", "--accent-blue-tint"], 4.5, "Blue 4 as link text, on every surface"],
  ["--accent-blue", ["--canvas", "--surface-1"], 3, "the Blue 4 fill against the page"],
  ["--success", ["--canvas", "--surface-1", "--surface-2"], 4.5, "status text and tags"],
  ["--warning", ["--canvas", "--surface-1", "--surface-2"], 4.5, "status text and tags"],
  ["--danger", ["--canvas", "--surface-1", "--surface-2"], 4.5, "status text and tags"],
  ...["blue", "amber", "teal", "violet", "rose"].flatMap((h) => [
    [`--data-${h}`, ["--canvas", "--surface-1", "--surface-2"], 3, "a data mark (R7)"],
    [`--data-${h}-text`, ["--canvas", "--surface-1", "--surface-2"], 4.5, "a data hue as text (R7)"],
  ]),
];
let contrastChecks = 0;
for (const [theme, map] of THEMES) {
  for (const [fgName, bgs, min, note] of pairs) {
    for (const bgName of bgs) {
      /* Device's fill is one bright orange on the body and on its screens (v1.13), with dark words that pass 4.5:1 above;
         on the light aluminium it is a key whose words and rim carry it, so its 3:1 against the page is not asked.
         check 13 holds it to the screens' orange, and its links and focus ring keep the deep orange's pairs. */
      if (theme === "device light" && fgName === "--accent" && min === 3) continue;
      /* Rack's yellow is the light of a key that is on, always inside the key's 1px outline; check 14 holds that
         outline to 3:1 on the light body and panels, so the fill's own 3:1 there is not asked. */
      if (theme === "rack light" && fgName === "--accent" && min === 3) continue;
      const f = map.get(fgName), b = map.get(bgName);
      if (!/^#[0-9a-f]{3,6}$/i.test(f || "") || !/^#[0-9a-f]{3,6}$/i.test(b || "")) { warn(`${theme}: cannot check ${fgName} on ${bgName} (not a plain hex)`); continue; }
      contrastChecks++;
      const r = ratio(f, b);
      if (r < min) fail(`${theme}: ${fgName} on ${bgName} is ${r.toFixed(2)}:1, needs ${min}:1 (${note})`);
    }
  }
}
// A hue's -text tone on its own tint. The tint is color-mix(in oklab, hue N%, surface-1), so mix it here the same way.
for (const [theme, map] of THEMES) {
  const t = parseFloat(map.get("--tint-strength")) / 100;
  if (!(t > 0)) { fail(`${theme}: --tint-strength is missing or not a percentage`); continue; }
  for (const h of ["blue", "amber", "teal", "violet", "rose"]) {
    const hue = map.get(`--data-${h}`), text = map.get(`--data-${h}-text`), s1 = map.get("--surface-1");
    if (![hue, text, s1].every((v) => /^#[0-9a-f]{6}$/i.test(v || ""))) { fail(`${theme}: --data-${h}, its -text or --surface-1 is not a six-digit hex`); continue; }
    const [A, B] = [toLab(hue), toLab(s1)];
    /* A world may set its tint as its own value (Rack's clips); otherwise it is the mix. */
    const own = map.get(`--data-${h}-tint`);
    const tint = /^#[0-9a-f]{6}$/i.test(own || "") ? own : fromLab(A.map((v, i) => v * t + B[i] * (1 - t)));
    contrastChecks++;
    const r = ratio(text, tint);
    if (r < 4.5) fail(`${theme}: --data-${h}-text on its tint is ${r.toFixed(2)}:1, needs 4.5:1 (a tag or an avatar, R7)`);
  }
}
// The accent stands apart from the data hues (R6), so a button never reads as a bar and a link never as a series.
const apart = (a, b) => { const [A, B] = [toLab(a), toLab(b)]; return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
let apartChecks = 0, apartFails = 0;
for (const [theme, map] of THEMES) {
  for (const h of ["blue", "amber", "teal", "violet", "rose"]) {
    for (const [ours, theirs] of [["--accent", `--data-${h}`], ["--accent-text", `--data-${h}-text`], ["--accent-pink", `--data-${h}`], ["--accent-pink-text", `--data-${h}-text`], ["--accent-blue", `--data-${h}`], ["--accent-blue-text", `--data-${h}-text`]]) {
      const a = map.get(ours), b = map.get(theirs);
      if (![a, b].every((v) => /^#[0-9a-f]{6}$/i.test(v || ""))) { fail(`${theme}: ${ours} or ${theirs} is not a six-digit hex`); continue; }
      apartChecks++;
      const d = apart(a, b);
      if (d < 0.12) { apartFails++; fail(`${theme}: ${ours} is ${d.toFixed(3)} from ${theirs} in OKLab, needs 0.12 (R6)`); }
    }
  }
}
/* A hovered block (R3): --block-hover mixes the ink into the block, by its own share under Press and under Flat. The
   inks on it are words a pointer is resting on (a Select's placeholder, a folded Run card), so they keep 4.5:1. */
const hoverShare = (body) => {
  const m = /color-mix\(in oklab, var\(--block\), var\(--fg\) ([\d.]+)%\)/.exec(decls(body).get("--block-hover") || "");
  return m ? parseFloat(m[1]) / 100 : null;
};
const pressHover = hoverShare(block(/:root,\s*\[data-theme\]\s*\{/));
const flatHover = hoverShare(block(/:root\[data-material="flat"\],\s*\[data-material="flat"\]\s*\{/));
const deviceHover = hoverShare(block(/:root\[data-material="device"\],\s*\[data-material="device"\]\s*\{(?=\s*--canvas)/));
const rackHover = hoverShare(block(/:root\[data-material="rack"\],\s*\[data-material="rack"\]\s*\{(?=\s*--canvas)/));
if (pressHover === null) fail("tokens.css: --block-hover is not color-mix(in oklab, var(--block), var(--fg) N%) on :root, [data-theme]");
if (flatHover === null) fail('tokens.css: the flat block does not restate --block-hover as color-mix(in oklab, var(--block), var(--fg) N%)');
let hoverChecks = 0, hoverFails = 0;
for (const [theme, map] of THEMES) {
  const share = theme.startsWith("flat") ? flatHover : theme.startsWith("device") ? deviceHover ?? pressHover : theme.startsWith("rack") ? rackHover ?? pressHover : pressHover;
  const b = map.get("--block"), f = map.get("--fg");
  if (share === null || ![b, f].every((v) => /^#[0-9a-f]{6}$/i.test(v || ""))) continue;
  const [B, F] = [toLab(b), toLab(f)];
  const hover = fromLab(B.map((v, i) => v * (1 - share) + F[i] * share));
  for (const ink of ["--fg", "--fg-muted", "--fg-subtle"]) {
    hoverChecks++;
    const r = ratio(map.get(ink), hover);
    if (r < 4.5) { hoverFails++; fail(`${theme}: ${ink} on a hovered block (${hover}) is ${r.toFixed(2)}:1, needs 4.5:1`); }
  }
}
if (!hoverFails && hoverChecks) ok(`${hoverChecks} ink pairs on a hovered block pass (Press ${pressHover * 100}%, Flat ${flatHover * 100}%, Device ${deviceHover * 100}%, Rack ${rackHover * 100}% ink)`);
if (!apartFails) ok(`the accent stands at least 0.12 from every data hue (${apartChecks} pairs, both themes, Flat, Device and Rack)`);
if (!failures.some((f) => f.includes(":1"))) ok(`${contrastChecks} contrast pairs pass in both themes, under Flat, Device and Rack`);

/* APCA 0.0.98G lightness contrast. WCAG 2 passed the dark theme's grey at 5.5:1 while it read too dark (Lc 41), so
   the text inks must also reach Lc 60, the floor for reading text, on every surface. */
const screenY = (h) => { const [r, g, b] = rgb(h).map((c) => c ** 2.4); return 0.2126729 * r + 0.7151522 * g + 0.072175 * b; };
const apca = (text, bg) => {
  const soft = (y) => (y > 0.022 ? y : y + (0.022 - y) ** 1.414);
  const t = soft(screenY(text)), b = soft(screenY(bg));
  const s = b > t ? (b ** 0.56 - t ** 0.57) * 1.14 : (t ** 0.62 - b ** 0.65) * 1.14;
  return s < 0.1 ? 0 : (s - 0.027) * 100;
};
let apcaChecks = 0, apcaFails = 0;
for (const [theme, map] of THEMES) {
  for (const fgName of ["--fg", "--fg-muted", "--fg-subtle"]) {
    for (const bgName of ["--canvas", "--surface-1", "--surface-2", "--surface-3"]) {
      const f = map.get(fgName), b = map.get(bgName);
      if (!/^#[0-9a-f]{6}$/i.test(f || "") || !/^#[0-9a-f]{6}$/i.test(b || "")) continue;
      apcaChecks++;
      const lc = apca(f, b);
      if (lc < 60) { apcaFails++; fail(`${theme}: ${fgName} on ${bgName} is APCA Lc ${lc.toFixed(0)}, needs Lc 60 (text you read)`); }
    }
  }
}
if (!apcaFails) ok(`${apcaChecks} text pairs reach APCA Lc 60 in both themes, under Flat, Device and Rack`);

// 6. Weight by role (R8) -------------------------------------------------
console.log("Weight by role (R8)");
const weightFails = [];
const assetFiles = fs.readdirSync(path.join(skillDir, "assets")).filter((f) => /\.(css|html)$/.test(f)).map((f) => `assets/${f}`);
// Three weights, one per role: text 400, titles 500, 12px labels 600. Nothing else exists.
const ROLE_WEIGHTS = { "--weight": 400, "--weight-title": 500, "--weight-label": 600 };
const roleVar = (v) => /^var\((--weight(?:-title|-label)?)\)$/.exec(v)?.[1];
const okWeight = (v) => ["400", "500", "600", "normal", "inherit", "initial", "unset"].includes(v) || !!roleVar(v);
const weightOf = (v) => (roleVar(v) ? ROLE_WEIGHTS[roleVar(v)] : /^\d+$/.test(v) ? Number(v) : v === "normal" ? 400 : NaN);
const tokenDecls = strip(css);
for (const [n, want] of Object.entries(ROLE_WEIGHTS)) {
  const v = (tokenDecls.match(new RegExp(`(?<![\\w-])${n}\\s*:\\s*([^;]+);`)) || [])[1]?.trim();
  if (Number(v) !== want) weightFails.push(`tokens.css: ${n} is ${v ?? "missing"}, must be ${want}`);
}
const TITLE_STEPS = ["display", "h1", "h2", "h3", "h4"];
const captionSize = (v) => /^var\(--type-caption-size\)$/.test(v) || /^(?:0?\.75rem|12px|1[01]px|[0-9]px)$/.test(v);
for (const f of assetFiles) {
  const text = strip(read(f));
  for (const m of text.matchAll(/(?<![\w-])font-weight\s*:\s*([^;}"]+)/g)) {
    const v = m[1].replace(/!important/, "").trim();
    if (!okWeight(v)) weightFails.push(`${f}: font-weight ${v} (only 400, 500, 600 or var(--weight), var(--weight-title), var(--weight-label))`);
  }
  for (const m of text.matchAll(/(?<![\w-])font\s*:\s*([^;}"]+)/g))
    if (/(?:^|\s)(?:bold|bolder|lighter|[1-37-9]00)(?:\s|$)/.test(m[1])) weightFails.push(`${f}: font: ${m[1].trim()} (only 400, 500 or 600)`);
  for (const m of text.matchAll(/(--[\w-]*weight[\w-]*)\s*:\s*([^;]+);/g)) {
    const [name, v] = [m[1], m[2].trim()];
    if (/^--weight(?:-|$)/.test(name) && !(name in ROLE_WEIGHTS)) weightFails.push(`${f}: defines ${name} (only --weight, --weight-title and --weight-label exist)`);
    else if (!okWeight(v)) weightFails.push(`${f}: ${name} is ${v} (only 400, 500, 600 or a role token)`);
    // A type step's weight follows its role: titles for display to h4, labels for the caption, text for the rest.
    const step = /^--text-([\w-]+?)--font-weight$/.exec(name)?.[1];
    if (step) {
      const want = TITLE_STEPS.includes(step) ? "--weight-title" : step === "caption" ? "--weight-label" : "--weight";
      if (roleVar(v) !== want) weightFails.push(`${f}: ${name} is ${v}, must be var(${want})`);
    }
  }
  // 600 is for 12px labels only: a rule that sets the label weight sets nothing larger than the caption.
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const w = (/(?<![\w-])font-weight\s*:\s*([^;}]+)/.exec(m[2]) || [])[1]?.replace(/!important/, "").trim();
    const size = (/(?<![\w-])font-size\s*:\s*([^;}]+)/.exec(m[2]) || [])[1]?.trim();
    if (w && size && weightOf(w) === 600 && !captionSize(size)) weightFails.push(`${f}: ${m[1].trim()} sets ${w} at font-size ${size} (600 is for the caption size only)`);
  }
  // Google Fonts: each face loads only the weights the roles use, and the mono only 400. Ranges load everything between.
  for (const m of text.matchAll(/[?&]family=([^&"'\s]+)/g)) {
    const [fam, spec] = decodeURIComponent(m[1]).split(":");
    if (!spec) continue;
    const [axes, tuples = ""] = spec.split("@");
    const i = axes.split(",").indexOf("wght");
    if (i < 0) continue;
    const allowed = ["400", "500", "600"]; // the mono too, since Device sets every word in it (v1.6)
    for (const t of tuples.split(";")) {
      const w = t.split(",")[i];
      if (!allowed.includes(w)) weightFails.push(`${f}: Google Fonts loads ${fam.replace(/\+/g, " ")} at wght ${w} (only ${allowed.join(", ")}, no ranges)`);
    }
  }
  for (const m of text.matchAll(/\bfont-(thin|extralight|light|medium|semibold|bold|extrabold|black)\b/g)) weightFails.push(`${f}: uses ${m[0]} (use font-normal, font-title or font-label)`);
}
weightFails.length ? weightFails.forEach(fail) : ok(`weights by role in ${assetFiles.length} asset files: 400 text, 500 titles, 600 caption labels, nothing else`);

// 7. Radius ---------------------------------------------------------------
console.log("Radius (control 4, surface 8, pill)");
const radiusFails = [];
const allowedRadius = new Set(["0", "0px", "inherit", "999px", "50%",
  "var(--radius-control)", "var(--radius-surface)", "var(--radius-pill)"]);
const radiusTokens = new Set(["--radius-control", "--radius-surface", "--radius-pill"]);
const tokenPx = (n) => Number((strip(css).match(new RegExp(`(?<![\\w-])${n}\\s*:\\s*(\\d+)px\\s*;`)) || [])[1]);
const [rc, rs, rp] = [tokenPx("--radius-control"), tokenPx("--radius-surface"), tokenPx("--radius-pill")];
if (rc !== 4) radiusFails.push(`tokens.css: --radius-control is ${rc || "missing"}, must be 4px`);
if (rs !== rc + 4) radiusFails.push(`tokens.css: --radius-surface is ${rs || "missing"}, must be control + the 4px inset (8px)`);
if (rp !== 999) radiusFails.push(`tokens.css: --radius-pill is ${rp || "missing"}, must be 999px`);
// rounded-*, with an optional side (rounded-t-surface) and any variant prefix (md:, hover:).
const okRounded = /^!?rounded(?:-(?:t|r|b|l|s|e|tl|tr|bl|br|ss|se|es|ee))?-(?:control|surface|pill|none)$/;
for (const f of assetFiles) {
  const text = strip(read(f));
  for (const m of text.matchAll(/border(?:-[a-z]+)*-radius\s*:\s*([^;}"]+)/g)) {
    /* A block set 2px into a control takes the control radius less that inset (the Shape decision). */
    if (m[1].replace(/!important/, "").trim() === "calc(var(--radius-control) - 2px)") continue;
    const bad = m[1].replace(/!important/, "").trim().split(/\s+/).filter((v) => !allowedRadius.has(v));
    if (bad.length) radiusFails.push(`${f}: border-radius ${m[1].trim()}`);
  }
  for (const m of text.matchAll(/(--radius-[\w-]+)\s*:/g))
    if (!radiusTokens.has(m[1])) radiusFails.push(`${f}: defines ${m[1]} (only control, surface and pill exist)`);
  for (const [, cls] of text.matchAll(/\bclass(?:Name)?="([^"]*)"/g))
    for (const raw of cls.split(/\s+/)) {
      const c = raw.slice(raw.lastIndexOf(":") + 1);
      if (/^!?rounded(?:-|$)/.test(c) && !okRounded.test(c)) radiusFails.push(`${f}: uses ${raw}`);
    }
}
radiusFails.length ? radiusFails.forEach(fail) : ok(`corners are 0, ${rc}px, ${rs}px or pill`);

// 8. Shadows: the depth ladder (R3) -----------------------------------------
console.log("Shadows (the depth ladder)");
const shadowFails = [];
const cut = /^--(?:device-|rack-)?(?:tray-shade|cut-shade|field-shade|slot-shade|slot-fill-shade)$/;
const raised = /^--(?:device-|rack-)?(?:block-(?:lift|press)|key-lift|cap-(?:lift|press)|plate-lift)$/;
const lit = (layer) => /rgba?\(\s*255\s*,\s*255\s*,\s*255\b/.test(layer) || /\bwhite\b/i.test(layer);
for (const f of assetFiles) {
  const text = strip(read(f));
  for (const m of text.matchAll(/(box-shadow|--shadow-[\w-]+|--glow|--(?:device-|rack-)?(?:highlight|tray-shade|cut-shade|field-shade|slot(?:-fill)?-shade|block-(?:lift|press)|key-lift|cap-(?:lift|press)|plate-lift))\s*:\s*([^;}]+)/g)) {
    const isCut = cut.test(m[1]), isRaised = raised.test(m[1]), isPress = isCut || isRaised;
    for (const layer of splitLayers(m[2])) {
      if (/^var\(/.test(layer) || layer === "none") continue;
      // Strip colors so only lengths remain, then read the first two lengths as x/y offsets.
      const lengths = layer.replace(/(rgba?|hsla?|oklch|oklab|color-mix)\([^()]*(\([^()]*\)[^()]*)*\)/g, "").replace(/var\([^)]*\)/g, "")
        .replace(/\b(white|black|transparent|currentcolor)\b/gi, "").trim().split(/\s+/).filter(Boolean);
      const inset = lengths[0] === "inset";
      const nums = (inset ? lengths.slice(1) : lengths).map((n) => parseFloat(n));
      const [x = 0, y = 0, blur = 0, spread = 0] = nums;
      if (isPress) {
        const bounded = x === 0 && (inset ? Math.abs(y) <= 1 && blur <= 2 : y >= 0 && y <= 3 && blur <= 6);
        if (!bounded) shadowFails.push(`${f}: ${isCut ? "sunken" : "raised"} layer "${layer}" in ${m[1]} (never sideways; a cast at most 3px down and 6px soft; an inset at most 1px and 2px soft)`);
        if (inset && lit(layer) && (isCut ? y > 0 : y < 0)) shadowFails.push(`${f}: "${layer}" in ${m[1]} lights the ${isCut ? "top edge of something cut" : "lower edge of something raised"} (R2)`);
      } else if (inset) {
        const highlight = x === 0 && y === 1 && blur === 0;
        const hairline = x === 0 && y === 0 && blur === 0;
        if (!highlight && !hairline) shadowFails.push(`${f}: inset layer "${layer}" (only the top highlight or a hairline)`);
      } else if (x !== 0 || y !== 0) {
        shadowFails.push(`${f}: offset shadow "${layer}" in ${m[1]}`);
      }
    }
  }
}
shadowFails.length ? shadowFails.forEach(fail) : ok("every shadow is a step of the depth ladder, lit from the top");

// 9. Motion ---------------------------------------------------------------
console.log("Motion (three tiers)");
const motionFails = [];
const ms = (v) => (/ms$/.test(v) ? parseFloat(v) : /s$/.test(v) ? parseFloat(v) * 1000 : NaN);
const tokenCss = strip(css);
const reducedBlock = (tokenCss.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/) || [])[1] || "";
const rootCss = tokenCss.replace(reducedBlock, "");
const tok = (n) => (rootCss.match(new RegExp(`(?<![\\w-])${n}\\s*:\\s*([^;]+);`)) || [])[1]?.trim();
const isZero = (n) => new RegExp(`(?<![\\w-])${n}\\s*:\\s*0(?:ms|px|s)?\\s*;`).test(reducedBlock);

// 9a. required tokens, tier bounds, springs and easings
for (const n of ["--dur-instant", "--dur-responsive", "--dur-expressive", "--dur-exit-responsive", "--dur-exit-expressive",
  "--spring-responsive", "--spring-expressive", "--ease-out", "--ease-responsive", "--ease-expressive", "--stagger", "--travel", "--exit"])
  if (!tok(n)) motionFails.push(`tokens.css: ${n} is missing`);
const durTokens = new Map();
for (const m of rootCss.matchAll(/(?<![\w-])(--dur-[\w-]+)\s*:\s*([^;]+);/g)) {
  const v = ms(m[2].trim());
  if (Number.isNaN(v)) motionFails.push(`tokens.css: ${m[1]} must be a plain duration, not "${m[2].trim()}"`);
  else durTokens.set(m[1], v);
}
const exit = Number(tok("--exit"));
if (!(exit > 0 && exit < 1)) motionFails.push("tokens.css: --exit must be between 0 and 1 (exits are quicker than enters)");
const springTime = {};
for (const tier of ["responsive", "expressive"]) {
  const m = /^([\d.]+)ms\s+([\d.]+)$/.exec(tok(`--spring-${tier}`) || "");
  if (!m) { motionFails.push(`tokens.css: --spring-${tier} must read "<time>ms <bounce>"`); continue; }
  const [time, bounce] = [+m[1], +m[2]];
  springTime[tier] = time;
  if (time > 350) motionFails.push(`tokens.css: --spring-${tier} visual time ${time}ms is over 350ms`);
  if (bounce > 0.12) motionFails.push(`tokens.css: --spring-${tier} bounce ${bounce} is over 0.12`);
  if (tier === "responsive" && bounce !== 0) motionFails.push("tokens.css: --spring-responsive must have bounce 0");
  if (time > (durTokens.get(`--dur-${tier}`) ?? 0)) motionFails.push(`tokens.css: --dur-${tier} (settle) is shorter than the spring's visual time`);
  const pts = ((tok(`--ease-${tier}`) || "").match(/^linear\((.*)\)$/s) || [])[1]?.split(",").map(Number);
  if (!pts || pts.some(Number.isNaN)) motionFails.push(`tokens.css: --ease-${tier} must be a linear() list of plain numbers`);
  else {
    if (pts[0] !== 0 || pts.at(-1) !== 1) motionFails.push(`tokens.css: --ease-${tier} must start at 0 and end at 1`);
    if (Math.max(...pts) > (tier === "responsive" ? 1 : 1.02)) motionFails.push(`tokens.css: --ease-${tier} overshoots to ${Math.max(...pts)}`);
  }
}
const BOUND = { "--dur-instant": 240, "--dur-responsive": 600, "--dur-expressive": 600 };
for (const [n, v] of durTokens) {
  const ex = /^--dur-exit-(responsive|expressive)$/.exec(n);
  if (ex) {
    const want = Math.round((springTime[ex[1]] ?? NaN) * exit);
    if (!(Math.abs(v - want) <= 1)) motionFails.push(`tokens.css: ${n} is ${v}ms, must be ${want}ms (visual time x --exit)`);
  } else if (!(n in BOUND)) motionFails.push(`tokens.css: ${n} is not a tier (instant, responsive, expressive, exit-responsive, exit-expressive)`);
  else if (!(v <= BOUND[n])) motionFails.push(`tokens.css: ${n} is ${v}ms, over its ${BOUND[n]}ms bound`);
}

// 9b. reduced motion
for (const n of new Set([...durTokens.keys(), "--dur-instant", "--dur-responsive", "--dur-expressive", "--dur-exit-responsive", "--dur-exit-expressive", "--stagger", "--travel"]))
  if (!isZero(n)) motionFails.push(`tokens.css: ${n} is not zeroed under prefers-reduced-motion`);
if (!/(?<![\w-])--press-scale\s*:\s*1\s*;/.test(reducedBlock)) motionFails.push("tokens.css: --press-scale is not 1 under prefers-reduced-motion");

// 9c. transitions and animations in the assets
const layoutProps = /\b(width|height|min-width|max-width|min-height|max-height|top|right|bottom|left|inset|margin(-[a-z]+)?|padding(-[a-z]+)?)\b/;
const movement = new Set(["transform", "opacity", "translate", "scale", "rotate"]);
const fades = new Set(["color", "background-color", "border-color", "fill", "box-shadow"]); // Q17; box-shadow is the focus ring, never --glow (R2)
const passthru = new Set(["none", "inherit", "initial", "unset"]);
const easeWords = new Set(["ease", "ease-in", "ease-out", "ease-in-out", "linear", "step-start", "step-end", "allow-discrete", "normal"]);
const tierEase = { "--dur-instant": "--ease-out", "--dur-responsive": "--ease-responsive", "--dur-expressive": "--ease-expressive",
  "--dur-exit-responsive": "--ease-out", "--dur-exit-expressive": "--ease-out" };
const knownEase = new Set(["--ease-out", "--ease-responsive", "--ease-expressive"]);
// The property names in one transition layer (or a transition-property list).
const propsIn = (layer) => layer.replace(/var\([^)]*\)|(?:cubic-bezier|steps|linear)\([^)]*\)/g, " ").split(/\s+/)
  .filter((t) => /^[a-z][a-z-]*$/.test(t) && !easeWords.has(t));
for (const f of assetFiles) {
  const text = strip(read(f));
  for (const m of text.matchAll(/(?<![\w-])(transition|transition-property|transition-duration|transition-timing-function|transition-delay|animation|animation-duration|animation-timing-function|animation-delay)\s*:\s*([^;}"]+)/g)) {
    const [, prop, value] = m;
    const layers = splitLayers(value);
    if (/^transition(-property)?$/.test(prop)) for (const layer of layers) for (const p of propsIn(layer)) {
      if (passthru.has(p)) continue;
      if (p === "all" || layoutProps.test(p)) motionFails.push(`${f}: ${prop} animates "${p}" (layout property or all)`);
      else if (!movement.has(p) && !fades.has(p)) motionFails.push(`${f}: ${prop} animates "${p}" (only transform, opacity and color fades)`);
      else if (fades.has(p) && prop === "transition" && !/var\(--dur-instant\)/.test(layer)) motionFails.push(`${f}: "${p}" fades only at var(--dur-instant)`);
    }
    for (const v of value.matchAll(/var\((--(?:dur|ease)-[\w-]+)\)/g))
      if (!(v[1] in tierEase) && !knownEase.has(v[1])) motionFails.push(`${f}: ${prop} uses unknown motion token ${v[1]}`);
    if (prop === "transition" || prop === "animation") for (const layer of layers) {
      const durs = [...layer.matchAll(/var\((--dur-[\w-]+)\)/g)].map((x) => x[1]);
      const eases = [...layer.matchAll(/var\((--ease-[\w-]+)\)/g)].map((x) => x[1]);
      if (durs.length && tierEase[durs[0]] && (!eases.length || eases.some((e) => e !== tierEase[durs[0]])))
        motionFails.push(`${f}: ${durs[0]} pairs with ${tierEase[durs[0]]}: ${prop}: ${layer}`);
    }
    const bare = value.replace(/var\([^)]*\)/g, " ");
    for (const t of bare.match(/\b\d*\.?\d+m?s\b/g) || []) if (ms(t) !== 0) motionFails.push(`${f}: ${prop} uses a literal ${t}; use a tier token`);
    if (/cubic-bezier|steps\(|linear\(|\b(ease|ease-in|ease-in-out|linear)\b/.test(bare)) motionFails.push(`${f}: ${prop} uses a literal easing; use --ease-out, --ease-responsive or --ease-expressive`);
  }
  // 9d. @keyframes bodies animate the same properties
  for (const k of text.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
    let i = k.index + k[0].length, depth = 1; const start = i;
    while (depth && i < text.length) { if (text[i] === "{") depth++; if (text[i] === "}") depth--; i++; }
    for (const d of text.slice(start, i - 1).matchAll(/(?<![\w-])([a-z-]+)\s*:/g))
      if (!movement.has(d[1]) && !fades.has(d[1])) motionFails.push(`${f}: @keyframes ${k[1]} animates "${d[1]}"`);
  }
}
motionFails.length ? motionFails.forEach(fail) : ok(`instant ${durTokens.get("--dur-instant")}ms, springs ${tok("--spring-responsive")} and ${tok("--spring-expressive")}, exits ${durTokens.get("--dur-exit-responsive")}/${durTokens.get("--dur-exit-expressive")}ms; reduced motion zeroes durations, stagger and travel; transitions use tier tokens and only transform, opacity and color fades`);

// 10. Frontmatter ---------------------------------------------------------
console.log("SKILL.md frontmatter");
const fm = read("SKILL.md").match(/^---\n([\s\S]*?)\n---/);
if (!fm) fail("SKILL.md has no frontmatter");
else {
  const name = (fm[1].match(/^name:\s*(.+)$/m) || [])[1]?.trim();
  const desc = (fm[1].match(/^description:\s*(.+)$/m) || [])[1]?.trim() || "";
  const keys = [...fm[1].matchAll(/^([\w-]+):/gm)].map((m) => m[1]);
  const allowed = ["name", "description", "license", "allowed-tools", "metadata", "compatibility"];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name || "") || name.length > 64) fail(`name "${name}" must be kebab-case, at most 64 characters`);
  if (desc.length > 1024) fail(`description is ${desc.length} characters (max 1024)`);
  if (/[<>]/.test(desc)) fail("description contains angle brackets");
  const extra = keys.filter((k) => !allowed.includes(k));
  if (extra.length) fail(`frontmatter keys not allowed on claude.ai: ${extra.join(", ")}`);
  if (!failures.some((f) => f.startsWith("name") || f.startsWith("description") || f.startsWith("frontmatter"))) ok(`name "${name}", description ${desc.length}/1024 characters`);
}

// 11. Flat ----------------------------------------------------------------
console.log('Flat (data-material="flat")');
const flatFails = [];
for (const [theme, map] of [["light", light], ["dark", dark]]) {
  for (const n of FLAT_NEUTRALS) {
    const f = map.get(flatName(n)), s = map.get(n);
    if (![f, s].every((v) => /^#[0-9a-f]{6}$/i.test(v || ""))) { flatFails.push(`${theme}: ${flatName(n)} or ${n} is not a six-digit hex`); continue; }
    const [Lf, af, bf] = toLab(f), [Ls] = toLab(s);
    if (Math.hypot(af, bf) > 0.004) flatFails.push(`${theme}: ${flatName(n)} has chroma ${Math.hypot(af, bf).toFixed(4)}; Flat's greys are chroma 0`);
    if (Math.abs(Lf - Ls) > 0.005) flatFails.push(`${theme}: ${flatName(n)} sits ${(Lf - Ls).toFixed(4)} from ${n} in lightness (at most 0.005)`);
  }
}
const flatRe = /:root\[data-material="flat"\],\s*\[data-material="flat"\]\s*\{/;
const flatAt = css.search(flatRe);
if (flatAt < 0) flatFails.push('tokens.css has no :root[data-material="flat"], [data-material="flat"] block');
else {
  const flat = decls(block(flatRe));
  if (flatAt < css.search(/:root\[data-accent="mono"\],\s*\[data-accent="mono"\]\s*\{/)) flatFails.push("the flat block comes before monochrome; it goes last, so it wins on order");
  for (const n of FLAT_NEUTRALS) if (flat.get(n) !== `var(${flatName(n)})`) flatFails.push(`the flat block maps ${n} to ${flat.get(n) ?? "nothing"}, not var(${flatName(n)})`);
  for (const [k, v] of flat) {
    if (k !== "--light" && /(^|[\s,(])none($|[\s,)])/.test(v)) flatFails.push(`flat: ${k} is "${v}" (an empty shadow is 0 0 0 0 transparent; none voids a comma list)`);
    if (!/^--(?:highlight|[\w-]+-(?:shade|lift|press))$/.test(k)) continue;
    // Nothing casts and nothing is lit: every layer has no offset and no blur, so it is empty or a ring.
    for (const layer of splitLayers(v)) {
      const nums = layer.replace(/var\([^)]*\)|(?:rgba?|color-mix)\([^()]*(\([^()]*\)[^()]*)*\)|\b(?:inset|transparent)\b/g, "").trim().split(/\s+/).filter(Boolean).map(parseFloat);
      const [x = 0, y = 0, blur = 0] = nums;
      if (x || y || blur) flatFails.push(`flat: ${k} layer "${layer}" casts or blurs (only an empty shadow or a ring)`);
    }
  }
  if (flat.get("--press-depth") !== "0px") flatFails.push(`flat: --press-depth is ${flat.get("--press-depth") ?? "unset"}, must be 0px (nothing sinks)`);
  const ring = flat.get("--focus-ring") || "";
  if (!/var\(--focus\)/.test(ring) || /#|rgb/.test(ring)) flatFails.push(`flat: --focus-ring must restate the ring with var(--focus), never a literal (is "${ring}")`);
  for (const h of ["blue", "amber", "teal", "violet", "rose"])
    if (!/var\(--surface-1\)/.test(flat.get(`--data-${h}-tint`) || "")) flatFails.push(`flat: --data-${h}-tint is not restated over var(--surface-1)`);
}
flatFails.length ? flatFails.forEach(fail) : ok(`flat: ${FLAT_NEUTRALS.length} neutrals at chroma 0 in both themes, mapped last, nothing casts, lit or sinks`);

// 12. Device --------------------------------------------------------------
console.log('Device (data-material="device")');
const devFails = [];
const DEVICE_MAPPED = [...FLAT_NEUTRALS, "--highlight", "--tray", "--tray-shade", "--cut", "--cut-shade", "--block", "--block-lift", "--block-press",
  "--key-lift", "--slot", "--slot-shade", "--slot-fill", "--slot-fill-shade", "--plate-lift", "--cap", "--cap-held", "--cap-lift", "--cap-press",
  "--cap-grip", "--field", "--field-ink", "--field-ink-subtle", "--field-line", "--field-shade"];
const DEVICE_HUES = ["--accent", "--accent-hover", "--accent-text", "--accent-pink", "--accent-pink-text", "--accent-blue", "--accent-blue-hover", "--accent-blue-text", "--focus", "--focus-pink", "--focus-blue", "--success", "--warning", "--danger",
  ...["blue", "amber", "teal", "violet", "rose"].flatMap((h) => [`--data-${h}`, `--data-${h}-text`])];
const devName = (n) => `--device-${n.slice(2)}`;
for (const n of DEVICE_MAPPED) for (const [theme, map] of [["light", light], ["dark", dark]]) if (!map.has(devName(n))) devFails.push(`${theme}: ${devName(n)} is missing`);
const devRe = /:root\[data-material="device"\],\s*\[data-material="device"\]\s*\{(?=\s*--canvas)/;
const devAt = css.search(devRe);
if (devAt < 0) devFails.push('tokens.css has no device block (:root[data-material="device"], [data-material="device"] { --canvas: ... })');
else {
  const dev = decls(block(devRe));
  if (devAt < flatAt) devFails.push("the device block comes before Flat; it goes last");
  for (const n of DEVICE_MAPPED) if (dev.get(n) !== `var(${devName(n)})`) devFails.push(`the device block maps ${n} to ${dev.get(n) ?? "nothing"}, not var(${devName(n)})`);
  for (const n of DEVICE_HUES) if (dev.get(n) !== `var(${devName(n)})` && !(n === "--focus-pink" && dev.get(n) === "var(--device-accent-pink)")) devFails.push(`the device block maps ${n} to ${dev.get(n) ?? "nothing"}`);
  for (const [k, v] of dev) if (/(^|[\s,(])none($|[\s,)])/.test(v)) devFails.push(`device: ${k} is "${v}" (an empty shadow is 0 0 0 0 transparent)`);
  if (dev.get("--press-depth") !== "2px") devFails.push(`device: --press-depth is ${dev.get("--press-depth") ?? "unset"}, must be 2px (a key's travel)`);
  if (dev.get("--field-font") !== "var(--font-mono)") devFails.push("device: --field-font must be var(--font-mono), the glass's type");
  const ring = dev.get("--focus-ring") || "";
  if (!/var\(--focus\)/.test(ring) || /#|rgb/.test(ring)) devFails.push(`device: --focus-ring must restate the ring with var(--focus) (is "${ring}")`);
  for (const h of ["blue", "amber", "teal", "violet", "rose"])
    if (!/var\(--surface-1\)/.test(dev.get(`--data-${h}-tint`) || "")) devFails.push(`device: --data-${h}-tint is not restated over var(--surface-1)`);
}
for (const accent of ["blue", "pink", "mono"]) {
  const re = new RegExp(`:root\\[data-material="device"\\]\\[data-accent="${accent}"\\],\\s*\\[data-material="device"\\]\\[data-accent="${accent}"\\]\\s*\\{`);
  const at = css.search(re);
  if (at < 0 || at < devAt) devFails.push(`${accent} is not restated on Device after the device block, so Device's hues would beat it on <html>`);
  else {
    const restated = decls(block(re)), own = decls(block(new RegExp(`:root\\[data-accent="${accent}"\\],\\s*\\[data-accent="${accent}"\\]\\s*\\{`)));
    for (const [k, v] of own) if (restated.get(k) !== v) devFails.push(`device ${accent}: ${k} is ${restated.get(k) ?? "missing"}, not ${v} as ${accent}'s own block`);
  }
}
if (!/@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root,\s*:root\[data-material="device"\],\s*\[data-material="device"\]\s*\{/.test(css))
  devFails.push('reduced motion must restate --press-depth on :root[data-material="device"], [data-material="device"], or a key still sinks');
for (const [theme, map] of [["light", light], ["dark", dark]]) {
  const g = (n) => map.get(devName(n));
  for (const [f, b, min, note] of [["--field-ink", "--field", 7, "the glass's ink"], ["--field-ink-subtle", "--field", 4.5, "a placeholder on the glass"],
    ["--field-line", "--canvas", 3, "a field's edge on the body"], ["--field-line", "--surface-1", 3, "a field's edge on a plate"]]) {
    if (![g(f), g(b)].every((v) => /^#[0-9a-f]{6}$/i.test(v || ""))) { devFails.push(`${theme}: ${devName(f)} or ${devName(b)} is not a six-digit hex`); continue; }
    const r = ratio(g(f), g(b));
    if (r < min) devFails.push(`${theme}: ${devName(f)} on ${devName(b)} is ${r.toFixed(2)}:1, needs ${min}:1 (${note})`);
  }
}
// The screens: panels and overlays on a Device map every screen token, the same in every theme.
{
  const re = /\[data-material="device"\] :is\(\.litt-raised, \.litt-glass\) \{/;
  if (css.search(re) < 0) devFails.push('tokens.css has no [data-material="device"] :is(.litt-raised, .litt-glass) block, the screens');
  else {
    const scr = decls(block(re));
    const names = [...light.keys()].filter((k) => k.startsWith("--device-screen-"));
    for (const k of names) if (scr.get(`--${k.slice(16)}`) !== `var(${k})`) devFails.push(`the screen block maps --${k.slice(16)} to ${scr.get(`--${k.slice(16)}`) ?? "nothing"}`);
    for (const k of names) if (light.get(k) !== dark.get(k)) devFails.push(`${k} differs between the themes; a screen is the same in each`);
  }
  if ((decls(block(devRe)).get("--font-sans") || "") !== "var(--font-choice, var(--font-mono))") devFails.push("device: --font-sans must be var(--font-choice, var(--font-mono)), Device's full mono unless a face is chosen");
}
devFails.length ? devFails.forEach(fail) : ok(`device: ${DEVICE_MAPPED.length} tokens mapped in both themes, after Flat, Blue 4, pink and mono restated, a 2px key, glass at 7:1 in the mono`);

// 13. Worlds ----------------------------------------------------------------
console.log("Worlds (each world's own accent and face)");
{
  const worldFails = [];
  const blockOf = (sel) => decls(block(new RegExp(sel.replace(/[[\]()".]/g, (c) => "\\" + c).replace(/, /g, ",\\s*") + "\\s*\\{")));
  const FACES = [
    ["Press", ":root, [data-theme]", 'var(--font-choice, "Helvetica Neue", Helvetica, Arial, sans-serif)'],
    ["Flat", ':root[data-material="flat"], [data-material="flat"]', 'var(--font-choice, "Geist", "Geist Sans", "Helvetica Neue", Helvetica, Arial, sans-serif)'],
    ["Rack", ':root[data-material="rack"], [data-material="rack"]', 'var(--font-choice, "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif)'],
  ];
  for (const [world, sel, want] of FACES) {
    const got = blockOf(sel).get("--font-sans");
    if (got !== want) worldFails.push(`${world}: --font-sans is ${got ?? "unset"}, must be ${want}`);
  }
  const fontSans = [...strip(css).matchAll(/--font-sans\s*:/g)].length;
  if (fontSans !== 4) worldFails.push(`tokens.css declares --font-sans ${fontSans} times; only Press's theme roots, Flat, Device and Rack set a face`);
  if (/--font-choice\s*:/.test(strip(css))) worldFails.push("tokens.css declares --font-choice; it is the project's or the reader's, so litt never sets it");
  const mono = blockOf(':root[data-accent="mono"], [data-accent="mono"]'), flat = blockOf(':root[data-material="flat"], [data-material="flat"]');
  for (const [k, v] of mono) if (k !== "--focus-ring" && flat.get(k) !== v) worldFails.push(`flat: ${k} is ${flat.get(k) ?? "unset"}, not ${v} as monochrome's block (Flat's own accent is the ink)`);
  const flatAt = css.search(/:root\[data-material="flat"\],\s*\[data-material="flat"\]\s*\{/);
  for (const accent of ["blue", "pink"]) {
    const own = blockOf(`:root[data-accent="${accent}"], [data-accent="${accent}"]`);
    if (!own.size) { worldFails.push(`tokens.css has no :root[data-accent="${accent}"], [data-accent="${accent}"] block`); continue; }
    const re = new RegExp(`:root\\[data-material="flat"\\]\\[data-accent="${accent}"\\],\\s*\\[data-material="flat"\\]\\[data-accent="${accent}"\\]\\s*\\{`);
    const at = css.search(re);
    if (at < 0 || at < flatAt) { worldFails.push(`${accent} is not restated on Flat after the flat block, so Flat's ink would beat it on <html>`); continue; }
    const restated = decls(block(re));
    for (const [k, v] of own) if (restated.get(k) !== v) worldFails.push(`flat ${accent}: ${k} is ${restated.get(k) ?? "missing"}, not ${v} as ${accent}'s own block`);
  }
  for (const [theme, map] of [["light", rawLight], ["dark", rawDark]])
    for (const n of ["--accent", "--accent-hover", "--accent-fg", "--accent-text", "--accent-tint"]) {
      const want = `var(${n.replace("--accent", "--accent-blue")})`;
      if (map.get(n) !== want) worldFails.push(`${theme}: ${n} is ${map.get(n)}, must be ${want} (Press's own accent is Blue 4)`);
    }
  for (const [theme, map] of [["light", rawLight], ["dark", rawDark]]) if (map.get("--focus") !== "var(--focus-blue)") worldFails.push(`${theme}: --focus must be var(--focus-blue)`);
  if (!/\[data-theme\],\s*\[data-material\]\s*\{\s*font-family:\s*var\(--font-sans\);/.test(strip(read("assets/tailwind.css"))))
    worldFails.push("tailwind.css: [data-theme], [data-material] must set font-family: var(--font-sans), so a nested world takes its face");
  for (const n of ["accent", "accent-hover", "accent-fg"])
    if (rawLight.get(`--device-${n}`) !== rawLight.get(`--device-screen-${n}`)) worldFails.push(`device light: --device-${n} is ${rawLight.get(`--device-${n}`)}, not the screens' ${rawLight.get(`--device-screen-${n}`)} (one orange, v1.13)`);
  worldFails.length ? worldFails.forEach(fail) : ok("Press is Blue 4 in Helvetica Neue, Flat the ink in Geist, Device orange in the mono, Rack yellow in Inter; Blue 4 and pink restated after Flat, a chosen face wins");
}

// 14. Rack ----------------------------------------------------------------
console.log('Rack (data-material="rack")');
{
  const rackFails = [];
  const RACK_MAPPED = [...FLAT_NEUTRALS, "--highlight", "--tray", "--tray-shade", "--cut", "--cut-shade", "--block", "--block-lift", "--block-press",
    "--key-lift", "--slot", "--slot-shade", "--slot-fill", "--slot-fill-shade", "--plate-lift", "--cap", "--cap-held", "--cap-lift", "--cap-press",
    "--cap-grip", "--glass-bg", "--glass-bg-solid", "--glass-border", ...DEVICE_HUES.filter((n) => n !== "--focus-pink"), "--accent-fg", "--accent-tint"];
  const rackName = (n) => `--rack-${n.slice(2)}`;
  for (const n of RACK_MAPPED) for (const [theme, map] of [["light", light], ["dark", dark]]) if (!map.has(rackName(n))) rackFails.push(`${theme}: ${rackName(n)} is missing`);
  const rackRe = /:root\[data-material="rack"\],\s*\[data-material="rack"\]\s*\{(?=\s*--canvas)/;
  const rackAt = css.search(rackRe);
  if (rackAt < 0) rackFails.push('tokens.css has no rack block (:root[data-material="rack"], [data-material="rack"] { --canvas: ... })');
  else {
    const rack = decls(block(rackRe));
    if (rackAt < devAt) rackFails.push("the rack block comes before Device; it goes last");
    for (const n of RACK_MAPPED) if (rack.get(n) !== `var(${rackName(n)})`) rackFails.push(`the rack block maps ${n} to ${rack.get(n) ?? "nothing"}, not var(${rackName(n)})`);
    if (rack.get("--focus-pink") !== "var(--rack-accent-pink)") rackFails.push("the rack block must map --focus-pink to var(--rack-accent-pink)");
    for (const [k, v] of rack) if (/(^|[\s,(])none($|[\s,)])/.test(v) && k !== "--light") rackFails.push(`rack: ${k} is "${v}" (an empty shadow is 0 0 0 0 transparent)`);
    if (rack.get("--press-depth") !== "0px") rackFails.push(`rack: --press-depth is ${rack.get("--press-depth") ?? "unset"}, must be 0px (nothing sinks)`);
    if (rack.get("--light") !== "none") rackFails.push("rack: --light must be none (no light falls on a rack)");
    const ring = rack.get("--focus-ring") || "";
    if (!/var\(--focus\)/.test(ring) || /#|rgb/.test(ring)) rackFails.push(`rack: --focus-ring must restate the ring with var(--focus) (is "${ring}")`);
    for (const h of ["blue", "amber", "teal", "violet", "rose"])
      if (rack.get(`--data-${h}-tint`) !== `var(--rack-data-${h}-tint)`) rackFails.push(`rack: --data-${h}-tint must be var(--rack-data-${h}-tint), the clip's own fill`);
    if (rack.get("--radius-control") !== "2px" || rack.get("--radius-surface") !== "6px") rackFails.push("rack: opens square, --radius-control 2px in --radius-surface 6px (control + 4)");
  }
  for (const accent of ["blue", "pink", "mono"]) {
    const re = new RegExp(`:root\\[data-material="rack"\\]\\[data-accent="${accent}"\\],\\s*\\[data-material="rack"\\]\\[data-accent="${accent}"\\]\\s*\\{`);
    const at = css.search(re);
    if (at < 0 || at < rackAt) rackFails.push(`${accent} is not restated on Rack after the rack block, so Rack's yellow would beat it on <html>`);
    else {
      const restated = decls(block(re)), own = decls(block(new RegExp(`:root\\[data-accent="${accent}"\\],\\s*\\[data-accent="${accent}"\\]\\s*\\{`)));
      for (const [k, v] of own) if (restated.get(k) !== v) rackFails.push(`rack ${accent}: ${k} is ${restated.get(k) ?? "missing"}, not ${v} as ${accent}'s own block`);
    }
  }
  /* Nothing casts: every raised or sunken step is a zero-offset 1px outline, or empty. */
  const shadowNames = ["highlight", "tray-shade", "cut-shade", "block-lift", "block-press", "key-lift", "slot-shade", "slot-fill-shade", "plate-lift", "cap-lift", "cap-press"];
  for (const [theme, map] of [["light", rawLight], ["dark", rawDark]])
    for (const n of shadowNames) {
      const v = map.get(`--rack-${n}`) || "";
      for (const layer of splitLayers(v))
        if (!/^(inset )?0 0 0 (0|1px) (transparent|rgba\([^)]*\))$/.test(layer)) rackFails.push(`${theme}: --rack-${n} layer "${layer}" is not a zero-offset 1px outline (nothing casts on a rack)`);
    }
  /* The yellow is only a fill: words and the ring are the ink, and a lit key's outline carries it on the light body. */
  for (const [theme, map] of [["light", light], ["dark", dark]]) {
    if (map.get("--rack-accent-text") !== map.get("--rack-fg")) rackFails.push(`${theme}: --rack-accent-text must be the ink (--rack-fg); the yellow is only a fill`);
    if (map.get("--rack-focus") !== map.get("--rack-fg")) rackFails.push(`${theme}: --rack-focus must be the ink (--rack-fg)`);
    const m = /^0 0 0 1px rgba\(0, 0, 0, ([\d.]+)\)$/.exec(map.get("--rack-block-lift") || "");
    if (!m) { rackFails.push(`${theme}: --rack-block-lift must be one black 1px outline, 0 0 0 1px rgba(0, 0, 0, a)`); continue; }
    for (const bg of ["--rack-canvas", "--rack-surface-1"]) {
      const edge = mixHex(map.get(bg), "#000000", +m[1]);
      const r = ratio(edge, map.get(bg));
      if (theme === "light" && r < 3) rackFails.push(`light: a key's outline on ${bg} is ${r.toFixed(2)}:1, needs 3:1 (it carries the yellow fill)`);
    }
  }
  /* A clip's waveform is the hue's mark on its own tint (Sparkline's Rack body), so the mark reaches 3:1 on it. */
  for (const [theme, map] of [["light", light], ["dark", dark]])
    for (const h of ["blue", "amber", "teal", "violet", "rose"]) {
      const m = map.get(`--rack-data-${h}`), t = map.get(`--rack-data-${h}-tint`);
      if (![m, t].every((v) => /^#[0-9a-f]{6}$/i.test(v || ""))) { rackFails.push(`${theme}: --rack-data-${h} or its tint is not a six-digit hex`); continue; }
      const r = ratio(m, t);
      if (r < 3) rackFails.push(`${theme}: --rack-data-${h} on its clip is ${r.toFixed(2)}:1, needs 3:1 (a waveform in a clip)`);
    }
  rackFails.length ? rackFails.forEach(fail) : ok(`rack: ${RACK_MAPPED.length} tokens mapped in both themes, after Device, Blue 4, pink and mono restated, 1px outlines and nothing cast, yellow only a fill`);
}

console.log(failures.length ? `\n${failures.length} check(s) failed.` : `\nAll checks passed${warnings.length ? ` (${warnings.length} warning(s))` : ""}.`);
process.exit(failures.length ? 1 : 0);
