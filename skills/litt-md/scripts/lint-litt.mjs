#!/usr/bin/env node
/**
 * litt.md: rule lint. Fails on anything that breaks litt.md's hard rules.
 * It lives in the skill, so host mode can lint any app wherever the skill is installed; litt-check.mjs beside it
 * turns host mode into a score. The gallery runs it through gallery/scripts/lint-litt.mjs (npm run lint:litt).
 * Two modes share one rule set:
 *
 *   gallery (default)  The gallery's own source. Scans src/ except the synced styles and the
 *                      motion engine (src/motion holds the token reader and the rules mirror,
 *                      not UI). Plain token names: rounded-control, bg-surface-1, ease-litt.
 *   host (--host)      A real app that installed litt from the shadcn registry. Names are the
 *                      namespaced ones (rounded-litt-control, bg-litt-surface-1,
 *                      duration-(--litt-dur-instant)), and the app also has Tailwind's whole
 *                      default theme and shadcn's tokens, so the lint also fails what litt
 *                      forbids there: rounded-md, shadow-md, text-sm, font-semibold, bg-zinc-900,
 *                      bg-primary, ease-in-out, duration-300, transition-all, animate-pulse...
 *                      Used by the agent test (test-agents.grade.mjs) on the files an agent wrote.
 *
 * Put `litt-allow` on a line (in a comment) to exempt it, with a reason.
 *
 * Checks: weight by role (400 text, 500 titles with font-title, 600 caption labels with font-label;
 * nothing else), the three radii, zero-offset shadows, no `transition-all`,
 * only transform, opacity and color-family fades, duration and ease classes
 * that pair by tier, no literal timings or easings, no raw or quoted colors.
 *
 *   node lint-litt.mjs [files...]                         gallery mode, text output (needs the litt.md repo)
 *   node lint-litt.mjs --host [--json] [--root DIR] FILE...   host mode (files or folders), anywhere
 *   node lint-litt.mjs --json [files...]                  gallery mode, JSON output
 *   node lint-litt.mjs --self-test                        lint the fixtures in gallery/scripts/lint-fixtures/
 *
 *   --host       Host rules. Needs explicit files (or folders, scanned for .ts .tsx .js .jsx .css).
 *   --json       Print one JSON object and nothing else:
 *                { "mode": "gallery"|"host", "files": n, "fails": [...], "warns": [...] }
 *                where each entry is { "file", "line", "rule", "message" }.
 *                `rule` is weight, radius, shadow, color, type, motion or other.
 *   --root DIR   Paths in the output are relative to DIR (gallery mode: the gallery root; host mode: the cwd).
 *   --self-test  Lint the fixtures in lint-fixtures/: host-clean.tsx must be clean, and every line of
 *                host-dirty.tsx, host-dirty.css (host mode) and gallery-dirty.tsx (gallery mode) that
 *                ends in `// expect: <rule>` must fail exactly that rule while no other line fails.
 *                `// warn: <rule>` does the same for warnings. It also lints the built registry items
 *                (public/r) in host mode: the shipped components must come back clean.
 *
 * Exit codes: 0 clean, 1 rule failures, 2 usage error (nothing on stdout).
 *
 * Host mode reads class lists from string literals only (comments and JSX text are skipped, and so
 * are strings that read like sentences), pairs each duration with its ease inside the same class
 * list (a cn(...) call, a className={...} value or a "a" + "b" chain), and understands variants
 * (`data-[state=open]:duration-(--litt-dur-responsive)`). Warnings never fail a run.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
/* The skill's own folder holds this file, so host mode works wherever the skill is (claude.ai's zip included). Gallery
   mode and the self-test need the litt.md repo around it, with gallery/ two levels above the skill. */
const galleryRoot = path.resolve(here, "../../../gallery");
const RULES = ["weight", "radius", "shadow", "color", "type", "motion", "other"];

class UsageError extends Error {}

/* ---------------------------------------------------------------------------- shared helpers */

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

/* Motion tiers: each duration token pairs with one ease. Exits use the instant ease-out. */
const TIER_EASE = {
  instant: "ease-litt",
  responsive: "ease-responsive",
  expressive: "ease-expressive",
  "exit-responsive": "ease-litt",
  "exit-expressive": "ease-litt",
};
/* Only these may animate (check.mjs, check 9): movement, and color-family fades at the instant tier. */
const MOVEMENT = new Set(["transform", "opacity", "translate", "scale", "rotate"]);
const FADES = new Set(["color", "background-color", "border-color", "fill", "box-shadow"]);
const TRANSITION_CLASSES = new Set(["transition-colors", "transition-opacity", "transition-transform", "transition-none"]);
/** The string literals on a line that look like class lists, joined. Prose (sentence punctuation) is dropped. */
const classSegments = (code) =>
  [...code.matchAll(/(["'`])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]).filter((t) => !/[.,;:!?](\s|$)/.test(t)).join(" ");
const isCommentLine = (line) => /^\s*(\*|\/\/|\/\*)/.test(line);

const MOTION_PROPS = /\b(initial|animate|exit|whileHover|whileTap|whileFocus|whileInView|whileDrag)=\{\{/g;
const LAYOUT_KEYS = /(^|[\s,{])(width|height|top|left|right|bottom|margin\w*|padding\w*|fontWeight|letterSpacing|filter|backdropFilter|boxShadow|backgroundImage)\s*:/;

/* ============================================================================ gallery mode */

/** Lint the gallery's own source. Returns { fails, warns } of { file, line, rule, message }. */
function lintGallery(files, root) {
  const fails = [], warns = [];
  const rel = (f) => path.relative(root, f);

  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (line.includes("litt-allow")) return;
      const fail = (rule, message) => fails.push({ file: rel(f), line: i + 1, rule, message });
      const warn = (rule, message) => warns.push({ file: rel(f), line: i + 1, rule, message });

      if (/\bfont-(thin|extralight|light|medium|semibold|bold|extrabold|black)\b/.test(line)) fail("weight", "weight by role (P9): use font-normal (text), font-title (titles, buttons, tabs) or font-label (12px labels)");
      if (/\bfont-\[\d+\]/.test(line)) fail("weight", "arbitrary weight (P9): use font-normal, font-title or font-label");
      if (/fontWeight\s*:\s*['"]?(?!(?:400|500|600)\b)(?:\d|bold|bolder|lighter)/.test(line)) fail("weight", "fontWeight other than 400, 500 or 600 (P9): use font-normal, font-title or font-label");
      for (const m of line.matchAll(/\brounded(-[\w[\]().%-]+)?(?=[\s"'`]|$)/g)) {
        const v = m[0];
        if (v === "rounded" && !/class(Name)?=|\bcn\(|\bclsx\(/.test(line)) continue; // the word in prose
        if (v === "rounded-[calc(var(--radius-control)-2px)]") continue; // a block set 2px into a control (the switch, the slider): concentric with it
        if (!/^rounded(-(t|b|l|r|s|e|ss|se|es|ee|tl|tr|bl|br))?-(pill|none|control|surface)$/.test(v)) fail("radius", `${v}: use rounded-control (controls, rows, inputs), rounded-surface (cards, menus, dialogs, toasts) or rounded-pill (avatars, icon-only buttons)`);
      }
      if (/borderRadius\s*:\s*['"]?(?!0\b|999|9999|var\(--radius-(pill|control|surface)\))[\d.]/.test(line)) fail("radius", "borderRadius: use the radius tokens");
      for (const m of line.matchAll(/\binset-shadow-\[([^\]]+)\]/g)) {
        const bad = badShadow(m[1].split(",").map((l) => "inset " + l).join(","));
        if (bad) fail("shadow", `inset layer "${bad}" (P4): only the top highlight (0 1px 0) or a hairline (0 0 0 1px)`);
      }
      for (const m of line.matchAll(/(?<![\w-])shadow-([\w-]+|\[[^\]]+\])/g)) {
        const v = m[1];
        if (v.startsWith("[")) { const bad = badShadow(v.slice(1, -1)); if (bad) fail("shadow", `offset shadow "${bad}" (P4): zero-offset glow + ring only`); }
        else if (!["glow", "float", "modal", "tooltip", "none"].includes(v) && !/^\(/.test(v)) fail("shadow", `shadow-${v}: use shadow-float, shadow-modal, shadow-tooltip or shadow-glow`);
      }
      if (/\btransition-all\b|transition:\s*['"]?all\b|transitionProperty:\s*['"]all/.test(line)) fail("motion", "transition-all: name the properties (transform, opacity, color, background-color)");
      if (/\b(duration|delay)-(\d+|\[\d)/.test(line)) fail("motion", "literal duration/delay class: use duration-(--dur-instant) or the motion hooks");
      if (/(?:^|[{,]\s*)(visualDuration|stiffness|damping|mass|bounce|duration|delay|staggerChildren|delayChildren)\s*:\s*[\d.]/.test(line)) fail("motion", "literal motion timing: use useTransition/useExit/useStagger from @/motion");
      if (/\bease\s*:\s*['"](linear|easeIn|easeInOut|circIn|backIn|backOut|anticipate)['"]/.test(line)) fail("motion", "easing: litt.md uses --ease-out or the spring tokens");
      if (/transition=\{\{/.test(line)) fail("motion", "inline transition object: use useTransition()/useExit() from @/motion");
      if (/\banimate-(?!spin\b)[\w-]+/.test(line) || /\banimate-spin\b/.test(line)) fail("motion", "looping CSS animation: only the loading spinner may loop (mark it litt-allow)");
      if (/(bg|text|border|fill|stroke|outline|ring|shadow|from|to|via|accent|caret|decoration)-\[#|color\s*:\s*['"]#|\b(rgb|rgba|hsl|hsla)\(/.test(line)) fail("color", "raw color: use token utilities (bg-surface-1, text-fg-muted, border-line…)");
      /* The class checks read class lists only. Comments and prose captions may name
         the things they forbid ("a short ease-out tween"), so they are skipped. */
      const code = isCommentLine(line) ? "" : line;
      const isCss = f.endsWith(".css");
      const classes = isCss ? code : classSegments(code);
      if (!isCss || classes) {
        // Tier and ease pairing: each --dur-* token goes with its own ease, and no other.
        const durations = [...classes.matchAll(/(?<![\w-])duration-\((--dur-[\w-]+)\)/g)].map((m) => m[1].slice("--dur-".length));
        const eases = [...classes.matchAll(/(?<![\w-])ease-([\w[\]().,-]+)/g)].map((m) => `ease-${m[1]}`);
        if (!isCss) {
          for (const d of durations) {
            if (!(d in TIER_EASE)) fail("motion", `duration-(--dur-${d}): not a tier (instant, responsive, expressive, exit-responsive, exit-expressive)`);
            else if (!eases.length || eases.some((e) => e !== TIER_EASE[d])) fail("motion", `duration-(--dur-${d}) pairs with ${TIER_EASE[d]}${eases.length ? `, not ${eases.join(" or ")}` : ""}`);
          }
          for (const e of eases) if (!Object.values(TIER_EASE).includes(e)) fail("motion", `${e}: use ease-litt (instant and exits), ease-responsive or ease-expressive`);
          // Transitions: name transform, opacity or color-family properties; never all, never layout.
          for (const m of classes.matchAll(/(?<![\w-])transition(?:-(\[[^\]]*\]|[\w-]+))?(?![\w[-])/g)) {
            const cls = m[0];
            const arg = m[1];
            if (arg && arg.startsWith("[")) {
              const bad = arg.slice(1, -1).split(",").map((x) => x.trim().replace(/_/g, " ")).filter((x) => !MOVEMENT.has(x) && !FADES.has(x));
              if (bad.length) fail("motion", `transition-[${bad.join(",")}]: only transform, opacity and color-family fades may animate`);
            } else if (cls !== "transition-all" && !TRANSITION_CLASSES.has(cls)) { // transition-all has its own message above
              fail("motion", `${cls}: name the properties with transition-colors, transition-opacity, transition-transform or transition-[...] (transform, opacity, color family only)`);
            }
          }
          // Color-family fades happen at the instant tier only.
          const fades = /(?<![\w-])transition-colors(?![\w-])/.test(classes) ||
            [...classes.matchAll(/(?<![\w-])transition-\[([^\]]*)\]/g)].some((m) => m[1].split(",").some((x) => FADES.has(x.trim())));
          if (fades) for (const d of classes.matchAll(/(?<![\w-])duration-\((--dur-[\w-]+)\)/g)) if (d[1] !== "--dur-instant") fail("motion", `color fades run at --dur-instant only, not ${d[1]}`);
          // The accent is a fill. As text it can fall under 4.5:1 in dark, so text takes --accent-text.
          if (/(?<![\w-])(?:text|decoration)-accent(?![\w-])/.test(classes)) fail("color", "text-accent: the accent is a fill; accent text and links use text-accent-text");
          // A data hue's mark tone reaches 3:1, not 4.5:1, and its tint is a fill. Text in a hue takes its -text tone (P11).
          for (const m of classes.matchAll(/(?<![\w-])(?:text|decoration)-data-(blue|amber|teal|violet|rose)(-tint)?(?![\w-])/g)) fail("color", `${m[0]}: a data hue's ${m[2] ? "tint is a fill" : "mark tone is for marks"}; text in a hue uses text-data-${m[1]}-text (P11)`);
        }
      }
      // Raw colors: any quoted hex, and color functions Tailwind's token utilities replace.
      if (/(['"`])#[0-9a-fA-F]{3,8}\1/.test(code)) fail("color", "quoted hex color: use token utilities (bg-surface-1, text-fg-muted, border-line…) or var(--token)");
      if (isCss && /:\s*[^;{}]*#[0-9a-fA-F]{3,8}\b/.test(code)) fail("color", "hex color in CSS: colors live in tokens.css");
      if (/\b(oklch|oklab|lab|lch|hwb)\(/.test(code)) fail("color", "raw color function: use token utilities, or color-mix(in oklab, var(--token) …)");
      if (/\buppercase\b/.test(line)) warn("type", "uppercase: sentence case everywhere (Q1 is open)");
      if (/\btracking-/.test(line)) warn("type", "tracking class: tracking comes with the text-* tokens");
      if (/\btext-\[\d/.test(line)) warn("type", "arbitrary text size: use text-display, text-h1…h4, text-reading, text-body, text-small, text-caption");
      if (/\bonMouse(Enter|Over)\b/.test(line)) warn("other", "onMouseEnter: make sure touch and keyboard users get the same thing");
    });
    for (const m of text.matchAll(MOTION_PROPS)) {
      const start = m.index + m[0].length;
      const body = text.slice(start, text.indexOf("}}", start));
      const k = body.match(LAYOUT_KEYS);
      if (k) {
        const line = text.slice(0, m.index).split("\n").length;
        if (!text.split("\n")[line - 1].includes("litt-allow"))
          fails.push({ file: rel(f), line, rule: "motion", message: `motion animates "${k[2]}": only transform (x, y, scale) and opacity move; use layout/layoutId for size changes` });
      }
    }
  }
  return { fails, warns };
}

/* ============================================================================== host mode */

/* Names the `litt` registry item adds to a host's Tailwind theme. */
const HOST_ADVICE = {
  radius: "use rounded-litt-control (controls, rows, inputs, tags, chips), rounded-litt-surface (cards, dialogs) or rounded-litt-pill (avatars, icon-only buttons)",
  shadow: "use shadow-litt-float, shadow-litt-modal, shadow-litt-tooltip or shadow-litt-glow",
  type: "use text-litt-display, -h1..h4, -reading, -body, -small or -caption",
  color: "use a litt token (bg-litt-surface-1, text-litt-fg-muted, border-litt-line, bg-litt-accent)",
};
const RADIUS_OK = new Set(["litt-control", "litt-surface", "litt-pill", "none"]);
const SIDES = "s|e|t|r|b|l|ss|se|ee|es|tl|tr|br|bl";
const RADIUS_RE = new RegExp(`^rounded(?:-(${SIDES}))?(?:-(.+))?$`);

/* Tier -> the ease keys that may go with it (out = ease-litt or ease-litt-out). */
const HOST_TIER_EASE = {
  instant: ["out"],
  responsive: ["responsive"],
  expressive: ["expressive"],
  "exit-responsive": ["out"],
  "exit-expressive": ["out"],
};
const EASE_CLASS = { "ease-litt": "out", "ease-litt-out": "out", "ease-litt-responsive": "responsive", "ease-litt-expressive": "expressive" };
const EASE_VAR = { "--litt-ease-out": "out", "--litt-ease-responsive": "responsive", "--litt-ease-expressive": "expressive" };
const EASE_SHOW = { out: "ease-litt", responsive: "ease-litt-responsive", expressive: "ease-litt-expressive" };
const easeFor = (tier) => HOST_TIER_EASE[tier].map((k) => EASE_SHOW[k]).join(" or ").replace(/^ease-litt$/, "ease-litt (or ease-litt-out)");

/* Tailwind's default palette and shadcn's semantic tokens: the things a fresh shadcn host offers that litt forbids. */
const PALETTE = "slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_PREFIX = "bg|text|border(?:-[xytrblse])?|ring|ring-offset|outline|decoration|divide|fill|stroke|from|via|to|accent|caret|placeholder|shadow|inset-shadow|inset-ring|text-shadow|drop-shadow";
const ALPHA = "(?:\\/[\\w.\\[\\]%-]+)?";
const PALETTE_RE = new RegExp(`^(${COLOR_PREFIX})-(?:(?:${PALETTE})-(?:50|[1-9]00|950)|white|black)${ALPHA}$`);
const SHADCN = "background|foreground|card(?:-foreground)?|popover(?:-foreground)?|primary(?:-foreground)?|secondary(?:-foreground)?|muted(?:-foreground)?|accent(?:-foreground)?|destructive(?:-foreground)?|border|input|ring|chart-[1-5]|sidebar(?:-(?:foreground|primary|primary-foreground|accent|accent-foreground|border|ring))?";
const SHADCN_RE = new RegExp(`^(${COLOR_PREFIX})-(${SHADCN})${ALPHA}$`);
const SHADCN_TO_LITT = {
  background: "canvas", foreground: "fg", card: "surface-1", "card-foreground": "fg",
  popover: "surface-1", "popover-foreground": "fg", primary: "accent", "primary-foreground": "accent-fg",
  secondary: "surface-2", "secondary-foreground": "fg", muted: "surface-2", "muted-foreground": "fg-muted",
  accent: "surface-2", "accent-foreground": "fg", destructive: "danger",
  border: "line", input: "line-control", ring: "focus",
};
const SHADCN_VAR_RE = new RegExp(`var\\(--(?:${SHADCN})\\)`, "g");
/* litt's own names without the namespace: they do not exist in a host, so the class does nothing. */
const LITT_COLOR = /^litt-(?:canvas|surface-[123]|line(?:-strong|-control)?|fg(?:-muted|-subtle|-disabled)?|accent(?:-hover|-fg|-tint)?|focus|success|warning|danger|data-(?:blue|amber|teal|violet|rose)(?:-text|-tint)?)(?:\/[\w.[\]%-]+)?$/;
const PLAIN_COLOR_RE = /^(bg|text|border(?:-[xytrblse])?|ring|outline|fill|stroke|divide|decoration|caret|from|via|to|placeholder)-(canvas|surface-[123]|line(?:-strong|-control)?|fg(?:-muted|-subtle|-disabled)?|accent-(?:hover|fg|tint)|focus|success|warning|danger|data-(?:blue|amber|teal|violet|rose)(?:-text|-tint)?)(\/[\w.[\]%-]+)?$/;
const PLAIN_TYPE_RE = /^text-(display|h[1-4]|reading|body|small|caption)(\/[\w.[\]-]+)?$/;
const PLAIN_SPACE_RE = /^(p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy]|[hw]|min-[hw]|size|inset(?:-[xy])?|top|bottom|left|right)-(section|gutter|control(?:-(?:sm|md|lg))?|control-pad-(?:sm|md|lg))$/;
const PLAIN_CONTAINER_RE = /^max-w-(reading|content|wide)$/;
const NAMED_COLORS = "white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|silver|gold|navy|teal|cyan|magenta|brown|maroon|lime|aqua|indigo|violet|crimson|coral|salmon|tomato|beige|ivory";
const NAMED_RE = new RegExp(`(?<![\\w-])(?:${NAMED_COLORS})(?![\\w-])`, "i");

const stripVars = (v) => v.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, "");

/** Check one CSS declaration (kebab-case property, value as written). Returns [[rule, message]]. */
function checkDecl(prop, value) {
  const out = [];
  const v = value.trim().replace(/\s*!important$/i, "");
  if (!v) return out;
  const bare = stripVars(v);
  if (prop === "font-weight") {
    if (!/^(?:400|500|600|normal|inherit|initial|unset|revert)$/i.test(v) && !/^var\(/.test(v)) out.push(["weight", `font-weight: ${v}: weight by role (P9), use var(--litt-weight) (400), var(--litt-weight-title) (500) or var(--litt-weight-label) (600)`]);
  } else if (prop === "font") {
    if (/(?:^|\s)(?:bold|bolder|lighter|[1-37-9]00)(?:\s|$)/i.test(v)) out.push(["weight", `font: ${v}: weight by role (P9), only 400, 500 or 600`]);
  } else if (prop === "font-size") {
    const use = "use var(--litt-type-body-size) (or display, h1..h4, reading, small, caption)";
    if (/^[-+]?[\d.]/.test(v) && !/^0(?:px|rem|em)?$/.test(v) && !/^100%$/.test(v) && v !== "1em") out.push(["type", `font-size: ${v}: ${use}`]);
    else if (/^(?:clamp|calc|min|max)\(/.test(v) && !/--litt-/.test(v)) out.push(["type", `font-size: ${v}: ${use}`]);
    else if (/^(?:xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|larger|smaller)$/.test(v)) out.push(["type", `font-size: ${v}: ${use}`]);
  } else if (/^border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius$/.test(prop)) {
    if (!/--litt-radius-/.test(v)) {
      const bad = v.split(/[\s/]+/).filter(Boolean).find((p) => !/^(?:0(?:px)?|999\d*(?:px)?|inherit|initial|unset|none)$/.test(p));
      if (bad) out.push(["radius", `${prop}: ${v}: use var(--litt-radius-control), var(--litt-radius-surface) or var(--litt-radius-pill)`]);
    }
  } else if (prop === "box-shadow" || prop === "text-shadow") {
    const bad = badShadow(v.replace(/#[0-9a-fA-F]{3,8}\b/g, "").replace(new RegExp(`(?<![\\w-])(?:${NAMED_COLORS})(?![\\w-])`, "gi"), ""));
    if (bad) out.push(["shadow", `offset shadow "${bad}" (P4): zero-offset glow + ring only`]);
  } else if (prop === "filter" || prop === "backdrop-filter") {
    for (const m of v.matchAll(/drop-shadow\(((?:[^()]|\([^()]*\))*)\)/g)) {
      const bad = badShadow(m[1].replace(/#[0-9a-fA-F]{3,8}\b/g, ""));
      if (bad) out.push(["shadow", `drop-shadow "${bad}" (P4): zero-offset glow + ring only`]);
    }
  } else if (/^(?:transition|animation)-(?:duration|delay)$/.test(prop)) {
    if (!/--litt-/.test(v) && !/^(?:0|0s|0ms|none|inherit|initial|unset)$/.test(v)) out.push(["motion", `${prop}: ${v}: literal timing, use var(--litt-dur-instant) (or --litt-stagger) or the motion hooks`]);
  } else if (/^transition(?:-(?:property|timing-function))?$/.test(prop)) {
    if (/(?:^|[\s,])all(?=$|[\s,])/.test(bare)) out.push(["motion", `${prop}: ${v}: transition-all: name the properties (transform, opacity, color, background-color)`]);
    if (/(?:^|[\s,])-?\d*\.?\d+m?s\b/.test(bare) ||
      /\b(?:ease|ease-in|ease-out|ease-in-out|linear)\b|cubic-bezier\(|steps\(|(?:^|[\s,])linear\(/.test(bare)) out.push(["motion", `${prop}: ${v}: literal timing, use var(--litt-dur-instant) with var(--litt-ease-out) or the motion hooks`]);
    if (prop === "transition") { // each layer's --litt-dur-* goes with its own --litt-ease-*
      for (const layer of splitTop(v)) {
        const d = /var\(--litt-dur-([\w-]+)\)/.exec(layer), e = /var\(--litt-ease-([\w-]+)\)/.exec(layer);
        if (!d || !(d[1] in HOST_TIER_EASE)) continue;
        const want = HOST_TIER_EASE[d[1]];
        if (!e || !want.includes(e[1])) out.push(["motion", `transition: ${layer}: var(--litt-dur-${d[1]}) pairs with var(--litt-ease-${want[0]})${e ? `, not var(--litt-ease-${e[1]})` : ""}`]);
      }
    }
  } else if (/^animation(?:-(?:name|duration|delay|timing-function|iteration-count))?$/.test(prop)) {
    if (/\binfinite\b/.test(bare)) out.push(["motion", `${prop}: ${v}: looping animation (only a loading spinner may loop)`]);
    else if (prop !== "animation-name" && (/(?:^|[\s,])-?\d*\.?\d+m?s\b/.test(bare) || /\b(?:ease|ease-in|ease-out|ease-in-out|linear)\b|cubic-bezier\(/.test(bare))) out.push(["motion", `${prop}: ${v}: literal timing, use the motion hooks`]);
  } else if (/^(?:color|background|background-color|border-color|outline-color|fill|stroke|caret-color|text-decoration-color)$/.test(prop)) {
    if (NAMED_RE.test(bare)) out.push(["color", `${prop}: ${v}: named color, use var(--litt-fg), var(--litt-surface-1) or another var(--litt-…) token`]);
  }
  return out;
}

const KEBAB_PROPS = "font-weight|font-size|font|border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius|box-shadow|text-shadow|filter|backdrop-filter|transition(?:-(?:property|duration|delay|timing-function))?|animation(?:-(?:name|duration|delay|timing-function|iteration-count))?|color|background(?:-color)?|border-color|outline-color|fill|stroke|caret-color|text-decoration-color";
const KEBAB_DECL_RE = new RegExp(`(?:^|[\\s;{"'\`])(${KEBAB_PROPS})\\s*:\\s*([^;{}"'\`]*)`, "g");
const CAMEL_PROPS = "fontWeight|fontSize|borderRadius|border(?:Top|Bottom|Start|End)(?:Left|Right|Start|End)Radius|boxShadow|textShadow|filter|backdropFilter|transition(?:Property|Duration|Delay|TimingFunction)?|animation(?:Name|Duration|Delay|TimingFunction|IterationCount)?|color|background(?:Color)?|borderColor|outlineColor|fill|stroke|caretColor|textDecorationColor";
const CAMEL_DECL_RE = new RegExp(`(?<![\\w$.-])(${CAMEL_PROPS})\\s*:\\s*(?:(['"\`])((?:(?!\\2)[^\\\\\\n]|\\\\.)*)\\2|(-?[\\d.]+)(?![\\w.%]))`, "g");
const kebab = (p) => p.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

/* ---------------------------------------------------------------------- source scanner */

/**
 * Walks a source file once. Returns the code with comments blanked (strings kept), a skeleton with
 * comments and string bodies blanked (so brackets can be counted), and every string fragment with
 * its line and the class-list scope it belongs to. JSX text is never a fragment.
 */
function scanSource(text, css) {
  const n = text.length;
  const code = text.split(""), skel = text.split("");
  const lineStarts = [0];
  for (let i = 0; i < n; i++) if (text[i] === "\n") lineStarts.push(i + 1);
  const lineAt = (pos) => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= pos) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
  const blank = (arr, a, b) => { for (let k = a; k < b; k++) if (arr[k] !== "\n") arr[k] = " "; };
  const lits = [], frags = [];
  let litId = 0;
  const addFrags = (a, b, lit, openLeft, openRight) => {
    let s = a;
    for (let k = a; k <= b; k++) {
      if (k === b || text[k] === "\n") {
        if (k > s) frags.push({ pos: s, line: lineAt(s), text: text.slice(s, k), lit, openLeft: openLeft && s === a, openRight: openRight && k === b });
        s = k + 1;
      }
    }
  };
  const stringEnd = (i) => { // index after the closing quote, or -1 when the quote never closes on its line
    const q = text[i];
    for (let j = i + 1; j < n; j++) {
      const c = text[j];
      if (c === "\n") return -1;
      if (c === "\\") { j++; continue; }
      if (c === q) return j + 1;
    }
    return -1;
  };
  function template(i) {
    const lit = ++litId;
    let j = i + 1, part = j, afterExpr = false;
    while (j < n) {
      if (text[j] === "\\") { j += 2; continue; }
      if (text[j] === "`") {
        addFrags(part, j, lit, afterExpr, false);
        blank(skel, part, j); blank(skel, i, i + 1); blank(skel, j, j + 1);
        lits.push({ start: i, end: j + 1, lit });
        return j + 1;
      }
      if (text[j] === "$" && text[j + 1] === "{") {
        addFrags(part, j, lit, afterExpr, true);
        blank(skel, part, j);
        j = scan(j + 2, true) + 1;
        part = j; afterExpr = true;
        continue;
      }
      j++;
    }
    return n;
  }
  function scan(i, inExpr) { // returns the index of the } that closes a ${ ... } when inExpr, else n
    let depth = 0;
    while (i < n) {
      const c = text[i], d = text[i + 1];
      if (c === "/" && d === "*") {
        const e = text.indexOf("*/", i + 2), end = e < 0 ? n : e + 2;
        blank(code, i, end); blank(skel, i, end); i = end; continue;
      }
      if (!css && c === "/" && d === "/" && text[i - 1] !== ":") {
        let e = text.indexOf("\n", i); if (e < 0) e = n;
        blank(code, i, e); blank(skel, i, e); i = e; continue;
      }
      if (!css) {
        if (c === "'" || c === '"') {
          const end = stringEnd(i);
          if (end > 0) { const lit = ++litId; lits.push({ start: i, end, lit }); addFrags(i + 1, end - 1, lit, false, false); blank(skel, i, end); i = end; continue; }
        } else if (c === "`" && text.indexOf("`", i + 1) > 0) { i = template(i); continue; }
      }
      if (inExpr) { if (c === "{") depth++; else if (c === "}") { if (depth === 0) return i; depth--; } }
      i++;
    }
    return n;
  }
  scan(0, false);

  // Class-list scopes: a cn(...) style call, a className={...} value, or a "a" + "b" chain.
  const matchClose = (open) => {
    let d = 0;
    for (let k = open; k < n; k++) {
      const c = skel[k];
      if (c === "(" || c === "[" || c === "{") d++;
      else if (c === ")" || c === "]" || c === "}") { d--; if (d === 0) return k; }
    }
    return -1;
  };
  const matchOpen = (close) => {
    let d = 0;
    for (let k = close; k >= 0; k--) {
      const c = skel[k];
      if (c === ")" || c === "]" || c === "}") d++;
      else if (c === "(" || c === "[" || c === "{") { d--; if (d === 0) return k; }
    }
    return -1;
  };
  const skelText = skel.join("");
  const ranges = []; // [open, close, dynamic]: dynamic when an argument is a variable, so the classes are not all visible
  const NOT_A_CLASS_SOURCE = /^(?:className|class|props\.className|rest|props|true|false|null|undefined)$/;
  const dynamicArgs = (open, close) => [...skelText.slice(open + 1, close).matchAll(/(?:^|[(,])\s*(?:\.\.\.)?([A-Za-z_$][\w$.]*)\s*(?:\([^()]*\)\s*)?(?=,|$)/g)].some((m) => !NOT_A_CLASS_SOURCE.test(m[1]));
  for (const m of skelText.matchAll(/\b(?:cn|clsx|cx|twMerge|twJoin|classNames|classnames|cva|tv)\s*\(/g)) {
    const open = m.index + m[0].length - 1, close = matchClose(open);
    if (close > open) ranges.push([open, close, dynamicArgs(open, close)]);
  }
  for (const m of skelText.matchAll(/\b(?:className|class)\s*=\s*\{/g)) {
    const open = m.index + m[0].length - 1, close = matchClose(open);
    if (close > open) ranges.push([open, close, false]);
  }
  for (const m of skelText.matchAll(/\]\s*\.join\s*\(/g)) { // ["a", "b"].join(" ")
    const open = matchOpen(m.index);
    if (open >= 0) ranges.push([open, m.index, dynamicArgs(open, m.index)]);
  }
  const parent = new Map();
  const find = (k) => { while (parent.has(k) && parent.get(k) !== k) k = parent.get(k); return k; };
  const sorted = [...lits].sort((a, b) => a.start - b.start);
  for (let k = 0; k + 1 < sorted.length; k++) {
    const a = sorted[k], b = sorted[k + 1];
    if (b.start >= a.end && /^\s*\+\s*$/.test(skelText.slice(a.end, b.start))) parent.set(find(b.lit), find(a.lit));
  }
  for (const f of frags) {
    let best = -1, len = Infinity;
    ranges.forEach(([a, b], idx) => { if (a < f.pos && f.pos < b && b - a < len) { best = idx; len = b - a; } });
    f.scope = best >= 0 ? `r${best}` : `g${find(f.lit)}`;
    f.dynamic = (best >= 0 && ranges[best][2]) || f.openLeft || f.openRight; // a ${...} in a template hides classes too
  }
  return { code: code.join(""), skel: skelText, frags, lineAt, lineStarts, matchClose };
}

/* ---------------------------------------------------------------------- class tokens */

const PROSE = /[.,;:!?](\s|$)/;

function parseToken(raw, frag) {
  const t = raw.replace(/^!|!$/g, "");
  const variants = [];
  let depth = 0, cur = "";
  for (const ch of t) {
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    if (ch === ":" && depth === 0) { variants.push(cur); cur = ""; } else cur += ch;
  }
  return { raw, base: cur.replace(/^-/, ""), variants, vset: new Set(variants), prefix: [...variants].sort().join("|"), line: frag.line, frag };
}
function fragTokens(f) {
  if (PROSE.test(f.text)) return [];
  const parts = f.text.split(/\s+/).filter(Boolean);
  if (f.openLeft && !/^\s/.test(f.text)) parts.shift();
  if (f.openRight && !/\s$/.test(f.text)) parts.pop();
  return parts.map((p) => parseToken(p, f));
}
const subset = (a, b) => { for (const x of a) if (!b.has(x)) return false; return true; };

/** Lint the class tokens of one file, then pair durations with eases per class list. */
function checkTokens(frags, codeLines, add) {
  const scopes = new Map();
  const scopeOf = (f) => {
    if (!scopes.has(f.scope)) scopes.set(f.scope, { durs: [], eases: [], trans: [], timed: false, dynamic: false });
    const sc = scopes.get(f.scope);
    sc.dynamic ||= !!f.dynamic;
    return sc;
  };
  const classLine = (line) => /class(Name)?\s*=|\b(?:cn|clsx|cx|cva|twMerge|tv|classNames)\s*\(/.test(codeLines[line - 1] ?? "");

  for (const f of frags) {
    const tokens = fragTokens(f);
    const classLike = tokens.some((t) => /[-:[]/.test(t.base)) && tokens.every((t) => !/[A-Z]/.test(t.raw));
    for (const t of tokens) checkToken(t, scopeOf(f), (rule, msg, kind = "fail") => add(kind, t.line, rule, msg), () => classLine(t.line) || classLike);
  }

  for (const sc of scopes.values()) {
    for (const d of sc.durs) {
      if (!(d.tier in HOST_TIER_EASE)) {
        add("fail", d.t.line, "motion", `duration-(--litt-dur-${d.tier}): not a tier (instant, responsive, expressive, exit-responsive, exit-expressive)`);
        continue;
      }
      const allowed = HOST_TIER_EASE[d.tier];
      const here = sc.eases.filter((e) => e.t.frag === d.t.frag && e.t.prefix === d.t.prefix);
      const pool = here.length ? here : sc.eases.filter((e) => subset(e.t.vset, d.t.vset));
      const pairs = `duration-(--litt-dur-${d.tier}) pairs with ${easeFor(d.tier)}`;
      if (!pool.length) { if (!sc.dynamic) add("fail", d.t.line, "motion", `${pairs}; it has no ease`); }
      else if (here.length ? here.some((e) => !allowed.includes(e.key)) : !pool.some((e) => allowed.includes(e.key))) {
        add("fail", d.t.line, "motion", `${pairs}, not ${[...new Set(pool.filter((e) => !allowed.includes(e.key)).map((e) => e.t.base))].join(" or ")}`);
      }
    }
    for (const tr of sc.trans) {
      if (tr.fade) {
        for (const d of sc.durs) {
          if (d.t.frag === tr.t.frag && d.tier !== "instant") add("fail", d.t.line, "motion", `color fades run at --litt-dur-instant only, not --litt-dur-${d.tier}`);
        }
      }
      if (!sc.timed && !sc.dynamic) { // any duration or ease in the class list counts (a wrong one fails on its own); Radix lists give each data-state its own
        add("fail", tr.t.line, "motion", `${tr.t.base}: no duration-(--litt-dur-instant) ease-litt next to it, so it runs on Tailwind's 150ms default, off the motion tiers`);
      }
    }
  }
}

function checkToken(t, scope, add, isClassContext) {
  const b = t.base;
  let m;

  // weight
  if (/^font-(thin|extralight|light|medium|semibold|bold|extrabold|black)$/.test(b)) add("weight", `${b}: weight by role (P9), use font-normal (text), font-litt-title (titles, buttons, tabs) or font-litt-label (12px labels)`);
  else if ((m = /^font-\[(\d+)\]$/.exec(b)) && m[1] !== "400") add("weight", `${b}: weight by role (P9), use font-litt-title (500) or font-litt-label (600)`);
  else if ((m = /^font-(title|label)$/.exec(b))) add("weight", `${b}: not a utility in this host, the litt name is font-litt-${m[1]}`);

  // radius
  if ((m = RADIUS_RE.exec(b))) {
    const rest = m[2];
    const ok = rest !== undefined && (RADIUS_OK.has(rest) || rest === "[inherit]" || rest === "[calc(var(--litt-radius-control)-2px)]" || /^\[var\(--litt-radius-(?:control|surface|pill)\)\]$/.test(rest) || /^\(--litt-radius-(?:control|surface|pill)\)$/.test(rest));
    if (!ok && (rest !== undefined || isClassContext())) {
      add("radius", `${b}: ${HOST_ADVICE.radius}${rest === "full" ? ". rounded-full is rounded-litt-pill" : ""}`);
    }
  }

  // shadow
  if ((b === "shadow" || b === "drop-shadow") && isClassContext()) add("shadow", `${b}: Tailwind's default shadow is offset (P4), ${HOST_ADVICE.shadow}`);
  else if ((m = /^shadow-(.+)$/.exec(b))) {
    const v = m[1];
    if (/^litt-(?:glow|float|modal|tooltip)$/.test(v) || LITT_COLOR.test(v) || v === "none" || v.startsWith("(")) { /* ok */ }
    else if (v.startsWith("[")) {
      const inner = v.slice(1, -1);
      if (!/^(?:#|color:|rgb|hsl|oklch)/.test(inner)) { const bad = badShadow(inner); if (bad) add("shadow", `offset shadow "${bad}" (P4): zero-offset glow + ring only`); }
    } else if (/^(?:2xs|xs|sm|md|lg|xl|2xl|inner)$/.test(v)) add("shadow", `${b}: Tailwind's shadows are offset (P4), ${HOST_ADVICE.shadow}`);
    else if (!PALETTE_RE.test(b) && !SHADCN_RE.test(b) && !/^(?:current|transparent|inherit)$/.test(v)) add("shadow", `${b}: ${HOST_ADVICE.shadow}`);
  } else if ((m = /^inset-shadow-(.+)$/.exec(b))) {
    const v = m[1];
    if (v.startsWith("[")) {
      const bad = badShadow(v.slice(1, -1).split(",").map((l) => "inset " + l).join(","));
      if (bad) add("shadow", `inset layer "${bad}" (P4): only the top highlight (0 1px 0) or a hairline (0 0 0 1px)`);
    } else if (/^(?:2xs|xs|sm)$/.test(v)) add("shadow", `${b}: use inset-shadow-litt-highlight`);
  } else if ((m = /^(drop-shadow|text-shadow)-(.+)$/.exec(b))) {
    const v = m[2];
    if (v === "none" || v.startsWith("litt-") || v.startsWith("(")) { /* ok */ }
    else if (v.startsWith("[")) { const bad = badShadow(v.slice(1, -1)); if (bad) add("shadow", `offset shadow "${bad}" (P4): zero-offset glow + ring only`); }
    else if (/^(?:2xs|xs|sm|md|lg|xl|2xl)$/.test(v)) add("shadow", `${b}: ${m[1]} is an offset shadow (P4), ${HOST_ADVICE.shadow}`);
  }

  // color
  if (PALETTE_RE.test(b)) add("color", `${b}: Tailwind palette color, ${HOST_ADVICE.color}`);
  else if ((m = SHADCN_RE.exec(b))) {
    const [, pre, tok] = m;
    const suffix = (/\/[\w.[\]%-]+$/.exec(b) ?? [""])[0];
    let use;
    if (tok === "accent") use = pre === "bg" ? "bg-litt-surface-2 (a hover fill) or bg-litt-accent (the one accent fill)" : pre === "text" ? "text-litt-accent-text" : `${pre}-litt-accent`;
    else if (tok === "ring") use = "outline-litt-focus";
    else if (tok.startsWith("chart-")) use = `${pre}-litt-accent`;
    else if (tok.startsWith("sidebar")) use = `${pre}-litt-surface-1`;
    else use = `${pre}-litt-${SHADCN_TO_LITT[tok]}${suffix}`;
    add("color", `${b}: shadcn's ${tok} token has no place in litt UI, use ${use}`);
  } else if ((m = PLAIN_COLOR_RE.exec(b))) add("color", `${b}: not a utility in this host, the litt name is ${m[1]}-litt-${m[2]}${m[3] ?? ""}`);

  if (new RegExp(`^(?:${COLOR_PREFIX})-\\[(?:${NAMED_COLORS})\\]$`).test(b)) add("color", `${b}: named color, ${HOST_ADVICE.color}`);
  // The accent is a fill. As text it can fall under 4.5:1 in dark, so text takes --litt-accent-text.
  if (/^(?:text|decoration)-litt-accent(?:\/[\w.[\]%-]+)?$/.test(b)) add("color", `${b}: the accent is a fill; accent text and links use text-litt-accent-text`);
  // A data hue's mark tone reaches 3:1, not 4.5:1, and its tint is a fill. Text in a hue takes its -text tone (P11).
  if ((m = /^(?:text|decoration)-litt-data-(blue|amber|teal|violet|rose)(-tint)?(?:\/[\w.[\]%-]+)?$/.exec(b))) add("color", `${b}: a data hue's ${m[2] ? "tint is a fill" : "mark tone is for marks"}; text in a hue uses text-litt-data-${m[1]}-text (P11)`);

  // type
  if (/^text-(?:xs|sm|base|lg|xl|[2-9]xl)(?:\/[\w.[\]-]+)?$/.test(b)) add("type", `${b}: Tailwind's text sizes are off-system, ${HOST_ADVICE.type}`);
  else if (/^text-\[(?:length:)?-?[\d.]+[a-z%]*\]$/.test(b) || (/^text-\[(?:length:)?(?:clamp|calc|min|max)\(/.test(b) && !/--litt-/.test(b))) add("type", `${b}: arbitrary text size, ${HOST_ADVICE.type}`);
  else if (PLAIN_TYPE_RE.test(b)) add("type", `${b}: not a utility in this host, the litt name is text-litt-${b.slice(5)}`);
  if ((m = PLAIN_SPACE_RE.exec(b))) add("other", `${b}: not a utility in this host, the litt name is ${m[1]}-litt-${m[2]}`);
  else if (PLAIN_CONTAINER_RE.test(b)) add("other", `${b}: not a utility in this host, the litt name is max-w-litt-${b.slice(6)}`);
  if (b === "uppercase") add("type", "uppercase: sentence case everywhere (Q1 is open)", "warn");
  if (/^tracking-/.test(b)) add("type", "tracking class: tracking comes with the text-litt-* tokens", "warn");

  // motion
  if (/^(?:duration|delay|ease)-/.test(b)) scope.timed = true;
  if ((m = /^duration-(?:\((--litt-dur-[\w-]+)\)|\[var\((--litt-dur-[\w-]+)\)\])$/.exec(b))) scope.durs.push({ t, tier: (m[1] ?? m[2]).slice("--litt-dur-".length) });
  else if (/^(?:duration|delay)-(?:\d|\[\d)/.test(b)) add("motion", `${b}: literal ${b.split("-")[0]}, use duration-(--litt-dur-instant) or the motion hooks`);
  if (/^ease-/.test(b)) {
    const key = EASE_CLASS[b] ?? ((m = /^ease-(?:\((--litt-ease-[\w-]+)\)|\[var\((--litt-ease-[\w-]+)\)\])$/.exec(b)) ? EASE_VAR[m[1] ?? m[2]] : undefined);
    if (key) scope.eases.push({ t, key });
    else add("motion", `${b}: use ease-litt (instant and exits), ease-litt-responsive or ease-litt-expressive`);
  }
  if ((m = /^transition(?:-(.+))?$/.exec(b))) {
    const arg = m[1];
    if (arg === "none" || arg === "discrete" || arg === "normal" || (arg && arg.startsWith("("))) { /* ok */ }
    else if (arg === undefined && !isClassContext()) { /* the word on its own, not a class list */ }
    else if (arg === "all") add("motion", "transition-all: name the properties (transform, opacity, color, background-color)");
    else if (arg === "colors" || arg === "shadow") scope.trans.push({ t, fade: true });
    else if (arg === "opacity" || arg === "transform") scope.trans.push({ t, fade: false });
    else if (arg && arg.startsWith("[")) {
      const props = arg.slice(1, -1).split(",").map((x) => x.trim().replace(/_/g, " "));
      const bad = props.filter((x) => !MOVEMENT.has(x) && !FADES.has(x));
      if (bad.length) add("motion", `transition-[${bad.join(",")}]: only transform, opacity and color-family fades may animate`);
      else scope.trans.push({ t, fade: props.some((x) => FADES.has(x)) });
    } else add("motion", `${b}: name the properties with transition-colors, transition-opacity, transition-transform or transition-[...] (transform, opacity, color family only)`);
  }
  if ((m = /^animate-(.+)$/.exec(b)) && m[1] !== "spin") add("motion", `${b}: CSS animations loop or run on their own timings. Use the motion hooks from lib/litt/motion (only animate-spin, a loading spinner, may loop)`);
  if (/^(?:fade|zoom|slide|spin)-(?:in|out)(?:-|$)/.test(b)) add("motion", `${b}: tw-animate-css entrance classes run on their own timings. Use the motion hooks from lib/litt/motion`);

  // arbitrary properties: [border-radius:8px], [box-shadow:0_4px_8px_red]
  if ((m = /^\[([a-z-]+):(.+)\]$/.exec(b))) {
    for (const [rule, msg] of checkDecl(m[1], m[2].replace(/_/g, " "))) add(rule, `${b}: ${msg}`);
  }

  // warnings
  if (/^backdrop-blur(?:-|$)/.test(b)) add("other", `${b}: litt-glass is the one glass recipe, and only for floating surfaces`, "warn");
  if (b === "bg-clip-text") add("other", "bg-clip-text: no gradient text", "warn");
}

/* ------------------------------------------------------------------- host file engine */

const LITERAL_SURE = /(?:^[ \t]*|[{,]\s*)(visualDuration|stiffness|damping|staggerChildren|delayChildren)\s*:\s*-?[\d.]/;
const LITERAL_MAYBE = /(?:^[ \t]*|[{,]\s*)(duration|delay|mass|bounce)\s*:\s*-?[\d.]/;
const HOST_MOTION_PROPS = /\b(?:initial|animate|exit|whileHover|whileTap|whileFocus|whileInView|whileDrag|variants)=\{\{/g;
const HOST_LAYOUT_KEYS = /(^|[\s,{'"])(width|height|minWidth|maxWidth|minHeight|maxHeight|top|left|right|bottom|inset|gap|margin\w*|padding\w*|fontWeight|fontSize|lineHeight|letterSpacing|borderRadius|borderWidth|filter|backdropFilter|boxShadow|backgroundImage)['"]?\s*:/;

function lintHostFile(file, text, rel) {
  const fails = [], warns = [];
  const css = /\.css$/i.test(file);
  const sc = scanSource(text, css);
  const rawLines = text.split("\n");
  const codeLines = sc.code.split("\n");
  const seen = new Set();
  const add = (kind, line, rule, message) => {
    if (rawLines[line - 1]?.includes("litt-allow")) return;
    const key = `${kind}|${line}|${rule}|${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    (kind === "warn" ? warns : fails).push({ file: rel, line, rule, message });
  };

  // class lists
  if (css) {
    for (const m of sc.code.matchAll(/@apply\s+([^;}]+)/g)) {
      const start = m.index + m[0].indexOf(m[1]);
      checkTokens([{ pos: start, line: sc.lineAt(start), text: m[1], lit: 0, openLeft: false, openRight: false, scope: `a${start}` }], codeLines, add);
    }
  } else checkTokens(sc.frags, codeLines, add);

  // line patterns: colors, declarations, motion values
  const motionContext = (pos) => { // is the object that holds this key a motion transition?
    let d = 0, open = -1;
    for (let k = pos; k >= 0; k--) {
      const c = sc.skel[k];
      if (c === "}") d++;
      else if (c === "{") { if (d === 0) { open = k; break; } d--; }
    }
    if (open < 0) return false;
    const before = sc.skel.slice(Math.max(0, open - 40), open);
    if (/\b(?:transition|animate|spring|tween)\s*[:=(]?\s*\{?\s*$/.test(before) || /\b(?:animate|useAnimate)\s*\([^()]*$/.test(before)) return true;
    const close = sc.matchClose(open);
    return /(?:^|[{,]\s*)(?:ease|stiffness|damping|visualDuration|repeat|opacity|scale|rotate)\s*:/.test(sc.skel.slice(open, close < 0 ? undefined : close));
  };
  codeLines.forEach((line, i) => {
    const ln = i + 1;
    if (!line.trim()) return;
    const fail = (rule, message) => add("fail", ln, rule, message);
    const warn = (rule, message) => add("warn", ln, rule, message);

    // raw colors: hex anywhere, and the color functions the litt tokens replace
    if (/(bg|text|border|fill|stroke|outline|ring|shadow|from|to|via|accent|caret|decoration)-\[#|color\s*:\s*['"]#/.test(line) ||
      /(['"`])#[0-9a-fA-F]{3,8}\1/.test(line) || /(?<![&\w])#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?(?![0-9a-zA-Z-])/.test(line) || (css && /:\s*[^;{}]*#[0-9a-fA-F]{3,8}\b/.test(line))) {
      fail("color", `hex color: ${HOST_ADVICE.color}, or var(--litt-…); colors live in the litt style`);
    }
    if (/\b(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|hwb)\(/.test(line)) fail("color", `raw color function: ${HOST_ADVICE.color}, or color-mix(in oklab, var(--litt-fg) 12%, transparent)`);
    for (const m of line.matchAll(SHADCN_VAR_RE)) fail("color", `${m[0]}: shadcn token, use var(--litt-${SHADCN_TO_LITT[m[0].slice(6, -1)] ?? "surface-1"})`);
    for (const m of line.matchAll(new RegExp(`\\b(?:fill|stroke|stopColor|floodColor)=(['"])(?:${NAMED_COLORS})\\1`, "gi"))) fail("color", `${m[0]}: named color, ${HOST_ADVICE.color} or currentColor`);

    // declarations: CSS files, CSS-in-strings, style objects
    for (const m of line.matchAll(KEBAB_DECL_RE)) for (const [rule, msg] of checkDecl(m[1], m[2])) fail(rule, msg);
    for (const m of line.matchAll(CAMEL_DECL_RE)) {
      const prop = kebab(m[1]);
      let v = m[3] ?? m[4];
      if (m[3] === undefined && /^(?:font-size|border-.*radius)$/.test(prop) && Number(v) !== 0) v = `${v}px`;
      for (const [rule, msg] of checkDecl(prop, v)) fail(rule, msg);
    }

    // motion values
    const inline = /transition=\{\{/.test(line); // its own message covers a duration or ease written on the same line
    if (inline) fail("motion", "inline transition object: use useTransition()/useExit() from lib/litt/motion");
    if (!inline && LITERAL_SURE.test(line)) fail("motion", "literal motion timing: use useTransition/useExit/useStagger from lib/litt/motion");
    else if (!inline && LITERAL_MAYBE.test(line)) {
      const lineStart = sc.lineStarts[i];
      const m = LITERAL_MAYBE.exec(line);
      if (motionContext(lineStart + m.index + m[0].indexOf(m[1]))) fail("motion", "literal motion timing: use useTransition/useExit/useStagger from lib/litt/motion");
    }
    if (!inline && /(?:^[ \t]*|[{,]\s*)ease\s*:\s*(?:['"[]|\b(?:easeIn|easeOut|easeInOut|circIn|circOut|circInOut|backIn|backOut|backInOut|anticipate|linear|cubicBezier)\b)/.test(line)) fail("motion", "literal easing: use useTransition/useExit from lib/litt/motion");
    if (/(?:^[ \t]*|[{,]\s*)type\s*:\s*['"](?:spring|tween|inertia|keyframes)['"]/.test(line)) fail("motion", "literal transition type: use useTransition()/useExit() from lib/litt/motion");
    if (/(?:^[ \t]*|[{,]\s*)repeat\s*:\s*Infinity\b/.test(line)) fail("motion", "looping animation: only a loading spinner may loop");

    // warnings
    if (/(?:textTransform\s*:\s*['"]uppercase['"]|text-transform\s*:\s*uppercase)/.test(line)) warn("type", "uppercase: sentence case everywhere (Q1 is open)");
    if (/<(?:b|strong)(?=[\s>])(?![^>]*\bfont-(?:normal|litt-title)\b)/.test(line)) warn("weight", "<b>/<strong> render at the title weight (500) only through base-styles, otherwise bold (700): add font-litt-title, or font-normal");
    if (/\bonMouse(Enter|Over)\b/.test(line)) warn("other", "onMouseEnter: make sure touch and keyboard users get the same thing");
  });

  // motion props that animate layout
  if (!css) {
    for (const m of sc.skel.matchAll(HOST_MOTION_PROPS)) {
      const open = m.index + m[0].length - 1, close = sc.matchClose(open);
      if (close < 0) continue;
      const k = sc.code.slice(open + 1, close).match(HOST_LAYOUT_KEYS);
      if (k) add("fail", sc.lineAt(open + 1 + k.index + k[1].length), "motion", `motion animates "${k[2]}": only transform (x, y, scale) and opacity move; use layout/layoutId for size changes`);
    }
  }

  fails.sort((a, b) => a.line - b.line);
  warns.sort((a, b) => a.line - b.line);
  return { fails, warns };
}

function lintHost(files, root) {
  const fails = [], warns = [];
  for (const f of files) {
    const r = lintHostFile(f, fs.readFileSync(f, "utf8"), path.relative(root, f).split(path.sep).join("/"));
    fails.push(...r.fails);
    warns.push(...r.warns);
  }
  return { fails, warns };
}

/* ======================================================================== files and output */

const GALLERY_FILE = /\.(tsx?|css)$/, HOST_FILE = /\.(tsx?|jsx?|css)$/;
const walk = (dir, match, skip = () => false) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  if (d.isDirectory()) return skip(p, d.name) ? [] : walk(p, match, skip);
  return match.test(d.name) ? [p] : [];
});

function parseArgs(argv) {
  const o = { host: false, json: false, selfTest: false, help: false, root: null, files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--host") o.host = true;
    else if (a === "--json") o.json = true;
    else if (a === "--self-test") o.selfTest = true;
    else if (a === "--help" || a === "-h") o.help = true;
    else if (a === "--root" || a.startsWith("--root=")) {
      const v = a === "--root" ? argv[++i] : a.slice("--root=".length);
      if (!v || v.startsWith("--")) throw new UsageError("--root needs a directory");
      o.root = path.resolve(v);
    } else if (a.startsWith("--")) throw new UsageError(`unknown option ${a}`);
    else o.files.push(a);
  }
  return o;
}

/** Resolve the files to lint for a mode. */
function collectFiles(o) {
  if (o.host) {
    if (!o.files.length) throw new UsageError("--host needs the files to lint");
    const out = [];
    for (const a of o.files) {
      const p = path.resolve(a);
      if (!fs.existsSync(p)) throw new UsageError(`no such file: ${a}`);
      if (fs.statSync(p).isDirectory()) {
        const skip = (full, name) => ["node_modules", ".next", ".git", "dist", "build"].includes(name) ||
          full.endsWith(`${path.sep}components${path.sep}litt`) || full.endsWith(`${path.sep}lib${path.sep}litt`);
        out.push(...walk(p, HOST_FILE, skip));
      } else out.push(p);
    }
    return [...new Set(out)];
  }
  if (!fs.existsSync(galleryRoot)) throw new UsageError("gallery mode needs the litt.md repo around the skill; to lint an app, use --host");
  for (const a of o.files) if (!fs.existsSync(path.resolve(a))) throw new UsageError(`no such file: ${a}`);
  return (o.files.length ? o.files.map((a) => path.resolve(a)) : walk(path.join(galleryRoot, "src"), GALLERY_FILE))
    .filter((f) => !f.includes(`${path.sep}styles${path.sep}`) && !f.includes(`${path.sep}motion${path.sep}`));
}

function run(argv) {
  const o = parseArgs(argv);
  if (o.help) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0].replace(/^#!.*\n/, "").replace(/^\/\*\*\n|^ \* ?/gm, "")); return 0; }
  if (o.selfTest) return selfTest();
  const mode = o.host ? "host" : "gallery";
  const files = collectFiles(o);
  const root = o.root ?? (o.host ? process.cwd() : galleryRoot);
  const { fails, warns } = o.host ? lintHost(files, root) : lintGallery(files, root);

  if (o.json) {
    console.log(JSON.stringify({ mode, files: files.length, fails, warns }));
  } else {
    warns.forEach((w) => console.log(`  ! ${w.file}:${w.line}  ${w.message}`));
    fails.forEach((w) => console.log(`  ✗ ${w.file}:${w.line}  ${w.message}`));
    console.log(fails.length ? `\n${fails.length} rule failure(s) in ${files.length} files.` : `\nlitt rules: ${files.length} files clean${warns.length ? `, ${warns.length} warning(s)` : ""}.`);
  }
  return fails.length ? 1 : 0;
}

/* ============================================================================== self-test */

/** Lint the fixtures and compare against their `// expect: <rule>` markers. Returns the exit code. */
function selfTest() {
  if (!fs.existsSync(galleryRoot)) throw new UsageError("--self-test needs the litt.md repo around the skill (its fixtures live in gallery/scripts/lint-fixtures)");
  const dir = path.join(galleryRoot, "scripts", "lint-fixtures");
  const problems = [];
  const lines = [];
  const check = (name, mode) => {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) { problems.push(`${name}: fixture is missing`); return; }
    const { fails, warns } = mode === "host" ? lintHost([file], dir) : lintGallery([file], dir);
    const text = fs.readFileSync(file, "utf8").split("\n");
    const expectFail = new Map(), expectWarn = new Map();
    text.forEach((line, i) => {
      const mark = /(?:\/\/|\/\*)\s*(expect|warn):\s*([a-z, ]+?)\s*(?:\*\/\}?)?\s*$/.exec(line); // `// expect: radius`, `{/* warn: type */}`, `/* expect: color */`
      if (mark) (mark[1] === "expect" ? expectFail : expectWarn).set(i + 1, new Set(mark[2].split(/[,\s]+/).filter(Boolean)));
    });
    const group = (list) => list.reduce((m, x) => m.set(x.line, (m.get(x.line) ?? new Set()).add(x.rule)), new Map());
    const gotFail = group(fails), gotWarn = group(warns);
    for (const x of [...fails, ...warns]) if (!RULES.includes(x.rule)) problems.push(`${name}:${x.line}: unknown rule "${x.rule}"`);
    const compare = (kind, want, got) => {
      for (const [ln, rules] of want) {
        const have = got.get(ln) ?? new Set();
        if ([...rules].sort().join() !== [...have].sort().join()) problems.push(`${name}:${ln}: expected ${kind} ${[...rules].join("+")}, got ${have.size ? [...have].join("+") : "nothing"}`);
      }
      for (const [ln, rules] of got) {
        if (want.has(ln)) continue;
        const why = (kind === "fail" ? fails : warns).filter((x) => x.line === ln).map((x) => x.message).join(" | ");
        problems.push(`${name}:${ln}: unexpected ${kind} ${[...rules].join("+")} (${why})`);
      }
    };
    compare("fail", expectFail, gotFail);
    compare("warn", expectWarn, gotWarn);
    const marked = expectFail.size;
    lines.push(`${mode.padEnd(7)} ${name}: ${marked ? `${marked} marked lines` : "no failures"}, ${fails.length} fail(s), ${warns.length} warn(s)`);
    if (/clean\./.test(name) && marked) problems.push(`${name}: a clean fixture must not carry expect markers`);
    if (/dirty\./.test(name) && !marked) problems.push(`${name}: a dirty fixture needs expect markers`);
  };
  check("host-clean.tsx", "host");
  check("host-dirty.tsx", "host");
  check("host-dirty.css", "host");
  check("gallery-dirty.tsx", "gallery");

  // The shipped components are the reference for good host code: they must lint clean in host mode.
  // (The motion engine is exempt: it writes the springs the hooks hand out.) Skipped when the registry is not built.
  const regDir = path.join(galleryRoot, "public", "r");
  if (fs.existsSync(path.join(regDir, "registry.json"))) {
    let files = 0;
    for (const f of fs.readdirSync(regDir).filter((x) => x.endsWith(".json") && x !== "registry.json").sort()) {
      const item = JSON.parse(fs.readFileSync(path.join(regDir, f), "utf8"));
      if (item.name === "motion") continue;
      for (const file of item.files ?? []) {
        if (!HOST_FILE.test(file.path)) continue;
        files++;
        const r = lintHostFile(file.path, file.content, `${item.name}/${path.basename(file.path)}`);
        for (const x of r.fails) problems.push(`registry ${x.file}:${x.line}: ${x.rule}: ${x.message}`);
      }
    }
    lines.push(`host    registry items: ${files} shipped files, host mode`);
  } else lines.push("host    registry items: skipped (run npm run gen:registry --prefix gallery)");
  lines.forEach((l) => console.log(`  ${l}`));
  if (problems.length) {
    problems.forEach((p) => console.log(`  ✗ ${p}`));
    console.log(`\nlint self-test: ${problems.length} problem(s).`);
    return 1;
  }
  console.log("\nlint self-test: clean fixtures are clean, every dirty line fails exactly its rule.");
  return 0;
}

/* ====================================================================================== main */

try {
  process.exitCode = run(process.argv.slice(2));
} catch (e) {
  console.error(e instanceof UsageError ? `lint-litt: ${e.message}\nusage: node lint-litt.mjs [--host] [--json] [--root DIR] [files...] | --self-test` : e.stack ?? String(e));
  process.exitCode = 2;
}
