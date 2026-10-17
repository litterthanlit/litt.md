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
 * 4. Coverage:  every themed token is defined in both light and dark (P8).
 * 5. Contrast:  text, control lines, focus, accent, status and data-hue pairs meet WCAG
 *               (each data hue's -text tone is also checked on its own tint).
 * 6. Weight:    nothing goes above font-weight 400 (P9).
 * 7. Radius:    corners are 0, --radius-control (4), --radius-surface (control + 4) or pill.
 * 8. Shadows:   no outer shadow has an x or y offset (P4).
 * 9. Motion:    three tiers (instant tween at most 240ms; springs with visual time at most
 *               350ms, bounce at most 0.12 and 0 on responsive; settle at most 600ms; exits
 *               at visual time x --exit with --ease-out); reduced motion zeroes every --dur-*,
 *               --stagger and --travel; transitions use the tier tokens and animate only
 *               transform, opacity and color fades; no layout properties and no `all`.
 * 10. Frontmatter: SKILL.md name and description follow the skill rules.
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
const light = decls(block(/:root,\s*\[data-theme="light"\]\s*\{/));
const dark = decls(block(/\n\[data-theme="dark"\]\s*\{/));
const darkMedia = decls(block(/:root:not\(\[data-theme="light"\]\)\s*\{/));

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
for (const k of new Set([...dark.keys(), ...darkMedia.keys()])) {
  if (dark.get(k) !== darkMedia.get(k)) diff.push(`${k}: [data-theme=dark]=${dark.get(k)} vs media=${darkMedia.get(k)}`);
}
diff.length ? diff.forEach((d) => fail(`dark blocks differ: ${d}`)) : ok(`${dark.size} dark declarations match in both blocks`);

// 4. Coverage -------------------------------------------------------------
console.log("Theme coverage (P8)");
const missing = [...light.keys()].filter((k) => !dark.has(k)).concat([...dark.keys()].filter((k) => !light.has(k)));
missing.length ? missing.forEach((k) => fail(`${k} is defined in only one theme`)) : ok(`${light.size} tokens defined in both themes`);

// 5. Contrast -------------------------------------------------------------
console.log("Contrast");
const rgb = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
const lum = (h) => { const [r, g, b] = rgb(h).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const pairs = [
  // [foreground, backgrounds, minimum, note]
  ["--fg", ["--canvas", "--surface-1", "--surface-2", "--surface-3"], 4.5, "text"],
  ["--fg-muted", ["--canvas", "--surface-1", "--surface-2", "--surface-3"], 4.5, "body text"],
  ["--fg-subtle", ["--canvas", "--surface-1", "--surface-2", "--surface-3"], 4.5, "supporting text"],
  ["--line-control", ["--canvas", "--surface-1"], 3, "control outline"],
  ["--focus", ["--canvas", "--surface-1", "--surface-2"], 3, "focus ring"],
  ["--accent-fg", ["--accent", "--accent-hover"], 4.5, "text on accent"],
  ["--accent-text", ["--canvas", "--surface-1"], 4.5, "accent as link text"],
  ["--accent", ["--canvas", "--surface-1"], 3, "the accent fill against the page"],
  ["--success", ["--canvas", "--surface-1", "--surface-2"], 4.5, "status text and tags"],
  ["--warning", ["--canvas", "--surface-1", "--surface-2"], 4.5, "status text and tags"],
  ["--danger", ["--canvas", "--surface-1", "--surface-2"], 4.5, "status text and tags"],
  ...["blue", "amber", "teal", "violet", "rose"].flatMap((h) => [
    [`--data-${h}`, ["--canvas", "--surface-1", "--surface-2"], 3, "a data mark (P11)"],
    [`--data-${h}-text`, ["--canvas", "--surface-1", "--surface-2"], 4.5, "a data hue as text (P11)"],
  ]),
];
let contrastChecks = 0;
for (const [theme, map] of [["light", light], ["dark", dark]]) {
  for (const [fgName, bgs, min, note] of pairs) {
    for (const bgName of bgs) {
      const f = map.get(fgName), b = map.get(bgName);
      if (!/^#[0-9a-f]{3,6}$/i.test(f || "") || !/^#[0-9a-f]{3,6}$/i.test(b || "")) { warn(`${theme}: cannot check ${fgName} on ${bgName} (not a plain hex)`); continue; }
      contrastChecks++;
      const r = ratio(f, b);
      if (r < min) fail(`${theme}: ${fgName} on ${bgName} is ${r.toFixed(2)}:1, needs ${min}:1 (${note})`);
    }
  }
}
// A hue's -text tone on its own tint. The tint is color-mix(in oklab, hue N%, surface-1), so mix it here the same way.
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
for (const [theme, map] of [["light", light], ["dark", dark]]) {
  const t = parseFloat(map.get("--tint-strength")) / 100;
  if (!(t > 0)) { fail(`${theme}: --tint-strength is missing or not a percentage`); continue; }
  for (const h of ["blue", "amber", "teal", "violet", "rose"]) {
    const hue = map.get(`--data-${h}`), text = map.get(`--data-${h}-text`), s1 = map.get("--surface-1");
    if (![hue, text, s1].every((v) => /^#[0-9a-f]{6}$/i.test(v || ""))) { fail(`${theme}: --data-${h}, its -text or --surface-1 is not a six-digit hex`); continue; }
    const [A, B] = [toLab(hue), toLab(s1)];
    const tint = fromLab(A.map((v, i) => v * t + B[i] * (1 - t)));
    contrastChecks++;
    const r = ratio(text, tint);
    if (r < 4.5) fail(`${theme}: --data-${h}-text on its tint is ${r.toFixed(2)}:1, needs 4.5:1 (a tag or an avatar, P11)`);
  }
}
if (!failures.some((f) => f.includes(":1"))) ok(`${contrastChecks} contrast pairs pass in both themes`);

// 6. Weight ceiling (P9) ------------------------------------------------
console.log("Weight ceiling (P9)");
const weightFails = [];
const assetFiles = fs.readdirSync(path.join(skillDir, "assets")).filter((f) => /\.(css|html)$/.test(f)).map((f) => `assets/${f}`);
for (const f of assetFiles) {
  const text = strip(read(f));
  for (const m of text.matchAll(/font-weight\s*:\s*(\d{3})/g)) if (Number(m[1]) > 400) weightFails.push(`${f}: font-weight ${m[1]}`);
  for (const m of text.matchAll(/--[\w-]*weight[\w-]*\s*:\s*(\d{3})/g)) if (Number(m[1]) > 400) weightFails.push(`${f}: weight token ${m[0]}`);
  for (const m of text.matchAll(/wght@([\d;.]+)/g)) if (m[1].split(/[;.]/).some((w) => Number(w) > 400)) weightFails.push(`${f}: Google Fonts loads wght@${m[1]}`);
  for (const m of text.matchAll(/--weight-(medium|semibold|bold)\b/g)) weightFails.push(`${f}: references ${m[0]}`);
  for (const m of text.matchAll(/\bfont-(medium|semibold|bold|extrabold|black)\b/g)) weightFails.push(`${f}: uses ${m[0]}`);
}
weightFails.length ? weightFails.forEach(fail) : ok(`no weight above 400 in ${assetFiles.length} asset files`);

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

// 8. Zero-offset shadows (P4) ---------------------------------------------
console.log("Shadows (zero offset)");
const shadowFails = [];
for (const f of assetFiles) {
  const text = strip(read(f));
  for (const m of text.matchAll(/(box-shadow|--shadow-[\w-]+|--glow|--highlight)\s*:\s*([^;}]+)/g)) {
    for (const layer of splitLayers(m[2])) {
      if (/^var\(/.test(layer) || layer === "none") continue;
      // Strip colors so only lengths remain, then read the first two lengths as x/y offsets.
      const lengths = layer.replace(/(rgba?|hsla?|oklch|oklab|color-mix)\([^()]*(\([^()]*\)[^()]*)*\)/g, "").replace(/var\([^)]*\)/g, "")
        .replace(/\b(white|black|transparent|currentcolor)\b/gi, "").trim().split(/\s+/).filter(Boolean);
      const inset = lengths[0] === "inset";
      const nums = (inset ? lengths.slice(1) : lengths).map((n) => parseFloat(n));
      const [x = 0, y = 0, blur = 0, spread = 0] = nums;
      if (inset) {
        const highlight = x === 0 && y === 1 && blur === 0;
        const hairline = x === 0 && y === 0 && blur === 0;
        if (!highlight && !hairline) shadowFails.push(`${f}: inset layer "${layer}" (only the top highlight or a hairline)`);
      } else if (x !== 0 || y !== 0) {
        shadowFails.push(`${f}: offset shadow "${layer}" in ${m[1]}`);
      }
    }
  }
}
shadowFails.length ? shadowFails.forEach(fail) : ok("no shadow has an offset");

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
const fades = new Set(["color", "background-color", "border-color", "fill", "box-shadow"]); // Q17; box-shadow is the focus ring, never --glow (P5)
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

console.log(failures.length ? `\n${failures.length} check(s) failed.` : `\nAll checks passed${warnings.length ? ` (${warnings.length} warning(s))` : ""}.`);
process.exit(failures.length ? 1 : 0);
