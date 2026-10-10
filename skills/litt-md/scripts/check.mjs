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
 * 5. Contrast:  text, control lines, focus, accent and status pairs meet WCAG.
 * 6. Weight:    nothing goes above font-weight 400 (P9).
 * 7. Radius:    corners are square or pill, nothing in between.
 * 8. Shadows:   no outer shadow has an x or y offset (P4).
 * 9. Frontmatter: SKILL.md name and description follow the skill rules.
 *
 * Exits 1 if anything fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(skillDir, p), "utf8");
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
  for (const [, k, v] of (body || "").replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
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
  ["--accent", ["--canvas", "--surface-1"], 4.5, "accent as link text"],
  ["--success", ["--canvas", "--surface-1", "--surface-2"], 4.5, "status text and tags"],
  ["--warning", ["--canvas", "--surface-1", "--surface-2"], 4.5, "status text and tags"],
  ["--danger", ["--canvas", "--surface-1", "--surface-2"], 4.5, "status text and tags"],
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
if (!failures.some((f) => f.includes(":1"))) ok(`${contrastChecks} contrast pairs pass in both themes`);

// 6. Weight ceiling (P9) ------------------------------------------------
console.log("Weight ceiling (P9)");
const weightFails = [];
const assetFiles = fs.readdirSync(path.join(skillDir, "assets")).filter((f) => /\.(css|html)$/.test(f)).map((f) => `assets/${f}`);
for (const f of assetFiles) {
  // Comments may name the forbidden weights ("so font-semibold doesn't exist"), so skip them.
  const text = read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
  for (const m of text.matchAll(/font-weight\s*:\s*(\d{3})/g)) if (Number(m[1]) > 400) weightFails.push(`${f}: font-weight ${m[1]}`);
  for (const m of text.matchAll(/--[\w-]*weight[\w-]*\s*:\s*(\d{3})/g)) if (Number(m[1]) > 400) weightFails.push(`${f}: weight token ${m[0]}`);
  for (const m of text.matchAll(/wght@([\d;.]+)/g)) if (m[1].split(/[;.]/).some((w) => Number(w) > 400)) weightFails.push(`${f}: Google Fonts loads wght@${m[1]}`);
  for (const m of text.matchAll(/--weight-(medium|semibold|bold)\b/g)) weightFails.push(`${f}: references ${m[0]}`);
  for (const m of text.matchAll(/\bfont-(medium|semibold|bold|extrabold|black)\b/g)) weightFails.push(`${f}: uses ${m[0]}`);
}
weightFails.length ? weightFails.forEach(fail) : ok(`no weight above 400 in ${assetFiles.length} asset files`);

// 7. Binary radius -------------------------------------------------------
console.log("Radius (square or pill)");
const radiusFails = [];
const allowedRadius = new Set(["0", "0px", "inherit", "var(--radius-pill)", "999px", "50%"]);
for (const f of assetFiles) {
  const text = read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
  for (const m of text.matchAll(/border(?:-[a-z]+)*-radius\s*:\s*([^;}"]+)/g)) {
    const v = m[1].trim();
    if (!allowedRadius.has(v)) radiusFails.push(`${f}: border-radius ${v}`);
  }
  for (const m of text.matchAll(/--radius-(?!pill\b)[\w-]+\s*:/g)) radiusFails.push(`${f}: defines ${m[0].slice(0, -1).trim()}`);
  for (const m of text.matchAll(/class="[^"]*\brounded(-(xs|sm|md|lg|xl|2xl|3xl|4xl|control|card|panel))?(?=[\s"])/g)) radiusFails.push(`${f}: uses ${m[0].split(/\s/).pop()}`);
}
radiusFails.length ? radiusFails.forEach(fail) : ok("every corner is square or pill");

// 8. Zero-offset shadows (P4) ---------------------------------------------
console.log("Shadows (zero offset)");
const shadowFails = [];
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
for (const f of assetFiles) {
  const text = read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
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

// 9. Frontmatter ----------------------------------------------------------
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
