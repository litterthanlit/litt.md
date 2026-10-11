#!/usr/bin/env node
/**
 * litt-ui: rule lint. Fails on anything that breaks litt.md's hard rules.
 * Scans src/ except the synced styles and the motion engine.
 * Put `litt-allow` on a line (in a comment) to exempt it, with a reason.
 *
 *   node scripts/lint-litt.mjs [files...]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  return d.isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(d.name) ? [p] : [];
});
const args = process.argv.slice(2);
const files = (args.length ? args.map((a) => path.resolve(a)) : walk(path.join(root, "src")))
  .filter((f) => !f.includes(`${path.sep}styles${path.sep}`) && !f.includes(`${path.sep}motion${path.sep}`));

const fails = [], warns = [];
const rel = (f) => path.relative(root, f);

const splitTop = (v, sep = ",") => {
  const out = []; let depth = 0, cur = "";
  for (const ch of v) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === sep && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};
function badShadow(value) {
  for (const layer of splitTop(value.replace(/_/g, " "))) {
    if (/^var\(/.test(layer) || layer === "none") continue;
    const lengths = layer.replace(/(rgba?|hsla?|oklch|oklab|color-mix|var)\([^()]*(\([^()]*\)[^()]*)*\)/g, "")
      .replace(/\b(white|black|transparent|currentcolor)\b/gi, "").trim().split(/\s+/).filter(Boolean);
    const inset = lengths[0] === "inset";
    const [x = 0, y = 0, blur = 0] = (inset ? lengths.slice(1) : lengths).map((n) => parseFloat(n));
    if (inset ? !(x === 0 && (y === 0 || (y === 1 && blur === 0))) : x !== 0 || y !== 0) return layer;
  }
  return null;
}

const MOTION_PROPS = /\b(initial|animate|exit|whileHover|whileTap|whileFocus|whileInView|whileDrag)=\{\{/g;
const LAYOUT_KEYS = /(^|[\s,{])(width|height|top|left|right|bottom|margin\w*|padding\w*|fontWeight|letterSpacing|filter|backdropFilter|boxShadow|backgroundImage)\s*:/;

for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (line.includes("litt-allow")) return;
    const at = `${rel(f)}:${i + 1}`;
    const fail = (m) => fails.push(`${at}  ${m}`);
    const warn = (m) => warns.push(`${at}  ${m}`);

    if (/\bfont-(thin|extralight|light|medium|semibold|bold|extrabold|black)\b/.test(line)) fail("weight above or below 400 (P9): use font-normal");
    if (/fontWeight\s*:\s*['"]?([1-35-9]\d\d)/.test(line)) fail("fontWeight other than 400 (P9)");
    for (const m of line.matchAll(/\brounded(-[\w[\]().%-]+)?(?=[\s"'`]|$)/g)) {
      const v = m[0];
      if (v === "rounded" && !/class(Name)?=|\bcn\(|\bclsx\(/.test(line)) continue; // the word in prose
      if (!/^rounded(-(t|b|l|r|s|e|ss|se|es|ee|tl|tr|bl|br))?-(pill|none|control|surface)$/.test(v)) fail(`${v}: use rounded-control (controls, rows, inputs), rounded-surface (cards, menus, dialogs, toasts) or rounded-pill (chips, tags, avatars, dots, icon-only buttons)`);
    }
    if (/borderRadius\s*:\s*['"]?(?!0\b|999|9999|var\(--radius-(pill|control|surface)\))[\d.]/.test(line)) fail("borderRadius: use the radius tokens");
    for (const m of line.matchAll(/\binset-shadow-\[([^\]]+)\]/g)) {
      const bad = badShadow(m[1].split(",").map((l) => "inset " + l).join(","));
      if (bad) fail(`inset layer "${bad}" (P4): only the top highlight (0 1px 0) or a hairline (0 0 0 1px)`);
    }
    for (const m of line.matchAll(/(?<![\w-])shadow-([\w-]+|\[[^\]]+\])/g)) {
      const v = m[1];
      if (v.startsWith("[")) { const bad = badShadow(v.slice(1, -1)); if (bad) fail(`offset shadow "${bad}" (P4): zero-offset glow + ring only`); }
      else if (!["glow", "float", "modal", "tooltip", "none"].includes(v) && !/^\(/.test(v)) fail(`shadow-${v}: use shadow-float, shadow-modal, shadow-tooltip or shadow-glow`);
    }
    if (/\btransition-all\b|transition:\s*['"]?all\b|transitionProperty:\s*['"]all/.test(line)) fail("transition-all: name the properties (transform, opacity, color, background-color)");
    if (/\b(duration|delay)-(\d+|\[\d)/.test(line)) fail("literal duration/delay class: use duration-(--dur-instant) or the motion hooks");
    if (/(?:^|[{,]\s*)(visualDuration|stiffness|damping|mass|bounce|duration|delay|staggerChildren|delayChildren)\s*:\s*[\d.]/.test(line)) fail("literal motion timing: use useTransition/useExit/useStagger from @/motion");
    if (/\bease\s*:\s*['"](linear|easeIn|easeInOut|circIn|backIn|backOut|anticipate)['"]/.test(line)) fail("easing: litt.md uses ease-out or the dial's springs");
    if (/transition=\{\{/.test(line)) fail("inline transition object: use useTransition()/useExit() from @/motion");
    if (/\banimate-(?!spin\b)[\w-]+/.test(line) || /\banimate-spin\b/.test(line)) fail("looping CSS animation: only the loading spinner may loop (mark it litt-allow)");
    if (/(bg|text|border|fill|stroke|outline|ring|shadow|from|to|via|accent|caret|decoration)-\[#|color\s*:\s*['"]#|\b(rgb|rgba|hsl|hsla)\(/.test(line)) fail("raw color: use token utilities (bg-surface-1, text-fg-muted, border-line…)");
    if (/\buppercase\b/.test(line)) warn("uppercase: sentence case everywhere (Q1 is open)");
    if (/\btracking-/.test(line)) warn("tracking class: tracking comes with the text-* tokens");
    if (/\btext-\[\d/.test(line)) warn("arbitrary text size: use text-display, text-h1…h4, text-reading, text-body, text-small, text-caption");
    if (/\bonMouse(Enter|Over)\b/.test(line)) warn("onMouseEnter: make sure touch and keyboard users get the same thing");
  });
  for (const m of text.matchAll(MOTION_PROPS)) {
    const start = m.index + m[0].length;
    const body = text.slice(start, text.indexOf("}}", start));
    const k = body.match(LAYOUT_KEYS);
    if (k) {
      const line = text.slice(0, m.index).split("\n").length;
      if (!text.split("\n")[line - 1].includes("litt-allow"))
        fails.push(`${rel(f)}:${line}  motion animates "${k[2]}": only transform (x, y, scale) and opacity move; use layout/layoutId for size changes`);
    }
  }
}

warns.forEach((w) => console.log(`  ! ${w}`));
fails.forEach((w) => console.log(`  ✗ ${w}`));
console.log(fails.length ? `\n${fails.length} rule failure(s) in ${files.length} files.` : `\nlitt rules: ${files.length} files clean${warns.length ? `, ${warns.length} warning(s)` : ""}.`);
process.exit(fails.length ? 1 : 0);
