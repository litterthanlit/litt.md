#!/usr/bin/env node
/**
 * Build the litt shadcn registry: one JSON file per item in public/r/, plus
 * public/r/registry.json (the index). Vercel serves them at
 * https://littmd.vercel.app/r/<item>.json, so anyone can run
 *
 *   npx shadcn@latest add https://littmd.vercel.app/r/button.json
 *   npx shadcn@latest add @litt/button      (with the @litt registry in components.json)
 *
 * The output is generated and gitignored. prebuild and verify run this script
 * after gen-docs, so the registry always matches the components.
 *
 *   node scripts/gen-registry.mjs                     write public/r
 *   node scripts/gen-registry.mjs --check             fail if public/r is missing or stale
 *   node scripts/gen-registry.mjs --out DIR           write somewhere else (the install test does)
 *   node scripts/gen-registry.mjs --origin URL        origin used in registryDependencies
 *                                                     (default https://littmd.vercel.app,
 *                                                     or $LITT_REGISTRY_ORIGIN, or the preview URL on Vercel)
 *
 * WHAT IT SHIPS
 *   litt          registry:style  tokens, Tailwind names and material classes, CSS only
 *   base-styles   registry:style  OPT-IN: fonts, weight 400, control radius, focus ring
 *   motion        registry:lib    src/motion/* (spring tiers, the hooks)
 *   glide         registry:lib    components/glide.tsx (the gliding highlight)
 *   <stem>        registry:ui     one per src/components/*.tsx that has a page
 *
 * WHY THE FILES ARE TRANSFORMED (nothing in src/, tokens.css or tailwind.css is edited)
 *   tokens.css declares --accent, --font-sans, --radius-control and friends globally, and its
 *   @layer base restyles headings, buttons and focus. In a shadcn project (which has its own
 *   --accent, --radius, --background...) that would silently restyle the whole app. So the
 *   registry ships a namespaced copy:
 *     --X                 -> --litt-X            every custom property tokens.css defines or reads
 *     bg-surface-1        -> bg-litt-surface-1   every Tailwind theme key tailwind.css maps
 *     rounded-control     -> rounded-litt-control
 *     duration-(--dur-instant), shadow-[inset_0_0_0_1px_var(--line)], getPropertyValue("--travel")
 *                         -> the same with --litt-...
 *     ease-litt, litt-glass, litt-raised, litt-trim, litt-lit, litt-grain keep their names.
 *   The gallery builds Tailwind in strict mode, so every themed utility in a component is a litt
 *   token by construction. The key sets come from tokens.css and tailwind.css, never from a hand list.
 *
 * WHAT THE HOST KEEPS
 *   No strict mode, no reset of Tailwind's palette, radii, weights or text sizes, no default
 *   transition change (tailwind.css's --default-transition-* are not shipped), no color-scheme on
 *   :root, nothing on html, body, headings or buttons. Those live only in base-styles.
 *   Dark mode keeps litt's model ([data-theme="dark"], [data-theme="light"], else the system
 *   preference) and also honours shadcn/next-themes: .dark acts like [data-theme="dark"],
 *   .light like [data-theme="light"].
 *
 * WHERE FILES LAND IN A HOST (shadcn puts a target without "~/" under src/ when the host has one)
 *   components/litt/<stem>.tsx       the components
 *   lib/litt/motion/{index,spring,tokens}.ts(x), lib/litt/glide.tsx     the engines
 *   Every import between shipped files is relative, so no alias in the host matters, and none of
 *   it collides with the host's own components/ui/button.tsx. registryDependencies are absolute
 *   URLs, because shadcn resolves a bare name against its own registry.
 *
 * SMALL PATCHES TO THE SHIPPED COPY (see PATCHES; each fails the build when its anchor moves)
 *   motion/tokens.ts   readLocked works on the server (Next.js renders client components once there), with
 *                      the values tokens.css ships, so no value is written twice.
 *   motion/index.tsx   __LITT_MD_VERSION__ inlined (vite.config.ts defines it in the gallery).
 *   every .tsx         "use client" on the first line.
 *   Fixes that are right in the gallery too live in the source, not here: useMotionDial works without
 *   a provider (motion/index.tsx), and the Toaster draws its portal after hydration (toast.tsx).
 *   asChild            a written asChild becomes {...asChildProps}: shadcn's CLI rewrites the attribute to Base UI's
 *                      render prop in every host whose style starts with "base-" (the default of `shadcn init`).
 *
 * THE VERIFIER (always runs; any finding fails the build)
 *   Every shipped file: no unprefixed litt custom property or utility survives, every --name it
 *   uses is defined by the shipped CSS (or is Radix's or Tailwind's own), every relative import
 *   lands on a shipped file that the item depends on, every package is declared. The shipped CSS:
 *   every var() resolves, litt only declares litt names, no element selectors, no color-scheme,
 *   no resets, the dark and light aliases are present. Then Tailwind itself compiles the original
 *   classes against the gallery's strict theme and the renamed ones against the shipped theme in a
 *   host-like (non-strict) setup, and the two must produce the same CSS apart from the prefix.
 *   Every item is also checked against shadcn's registry-item schema (a copy of 4.21.0's rules;
 *   when the `shadcn` package can be resolved, its own zod schema runs as well).
 *
 * It fails (exit 1) on anything it cannot resolve, instead of writing partial data.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

// Anything this script cannot resolve is a message and exit 1, not a stack trace.
process.on("uncaughtException", (e) => {
  console.error(`gen-registry: ${e.message}`);
  process.exit(1);
});

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "..");
const srcDir = path.join(root, "src");
const componentsDir = path.join(srcDir, "components");
const motionDir = path.join(srcDir, "motion");
const assetsDir = path.join(repo, "skills", "litt-md", "assets");
const docsFile = path.join(srcDir, "generated", "docs.json");

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const option = (name) => {
  const i = argv.indexOf(name);
  if (i < 0) return undefined;
  const v = argv[i + 1];
  if (!v || v.startsWith("--")) throw new Error(`${name} needs a value`);
  return v;
};
if (flag("--help") || flag("-h")) {
  console.log(`usage: node scripts/gen-registry.mjs [--out DIR] [--origin URL] [--check]
  --out DIR      write the registry here (default public/r)
  --origin URL   origin put into registryDependencies (default $LITT_REGISTRY_ORIGIN, else https://littmd.vercel.app)
  --check        fail if the output on disk differs from what would be written
The install test builds into a temp dir with --origin http://127.0.0.1:<port> and serves that dir at /r/.`);
  process.exit(0);
}
const check = flag("--check");
const outDir = path.resolve(option("--out") ?? path.join(root, "public", "r"));
const PRODUCTION_ORIGIN = "https://littmd.vercel.app";
const origin = (
  option("--origin") ??
  process.env.LITT_REGISTRY_ORIGIN ??
  (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : PRODUCTION_ORIGIN)
).replace(/\/+$/, "");

const norm = (f) => f.split(path.sep).join("/");
const rel = (f) => norm(path.relative(repo, f));
const collapse = (s) => s.replace(/\s+/g, " ").trim();
const fail = (msg) => { throw new Error(msg); };
const read = (f) => fs.readFileSync(f, "utf8");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ======================================================================== CSS reader */

/**
 * A small CSS reader: comments dropped, whitespace collapsed, strings and parentheses
 * respected (url(data:...;...) holds semicolons). Returns nodes:
 *   {k:"decl", prop, value} | {k:"rule", selector, nodes} | {k:"at", name, params, nodes|null}
 */
function parseCss(src, where) {
  let i = 0;
  const failAt = (m) => fail(`${where}:${src.slice(0, i).split("\n").length}: ${m}`);
  const skip = () => {
    for (;;) {
      while (i < src.length && /\s/.test(src[i])) i++;
      if (src.startsWith("/*", i)) {
        const e = src.indexOf("*/", i + 2);
        if (e < 0) failAt("unterminated comment");
        i = e + 2;
      } else return;
    }
  };
  const prelude = () => {
    let out = "";
    let paren = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === '"' || c === "'") {
        let j = i + 1;
        while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
        out += src.slice(i, j + 1);
        i = j + 1;
        continue;
      }
      if (src.startsWith("/*", i)) {
        const e = src.indexOf("*/", i + 2);
        i = e < 0 ? src.length : e + 2;
        out += " ";
        continue;
      }
      if (c === "(") paren++;
      else if (c === ")") paren--;
      else if (paren <= 0 && (c === ";" || c === "{" || c === "}")) break;
      out += c;
      i++;
    }
    return collapse(out);
  };
  const list = (nested) => {
    const nodes = [];
    for (;;) {
      skip();
      if (i >= src.length) {
        if (nested) failAt("missing }");
        return nodes;
      }
      if (src[i] === "}") {
        if (!nested) failAt("unexpected }");
        i++;
        return nodes;
      }
      if (src[i] === ";") { i++; continue; }
      const head = prelude();
      const stop = src[i];
      if (stop === "{") {
        i++;
        const kids = list(true);
        if (head.startsWith("@")) {
          const m = /^@([\w-]+)\s*(.*)$/s.exec(head);
          nodes.push({ k: "at", name: m[1], params: m[2], nodes: kids });
        } else nodes.push({ k: "rule", selector: head, nodes: kids });
      } else {
        if (stop === ";") i++;
        if (head.startsWith("@")) {
          const m = /^@([\w-]+)\s*(.*)$/s.exec(head);
          nodes.push({ k: "at", name: m[1], params: m[2], nodes: null });
        } else {
          const c = head.indexOf(":");
          if (c < 0) failAt(`cannot read "${head}"`);
          nodes.push({ k: "decl", prop: head.slice(0, c).trim(), value: head.slice(c + 1).trim() });
        }
      }
    }
  };
  return list(false);
}

/** Split on top-level occurrences of `sep`, outside (), [] and strings. */
function splitTop(str, sep) {
  const parts = [];
  let depth = 0;
  let quote = "";
  let cur = "";
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (quote) {
      cur += c;
      if (c === "\\") cur += str[++i] ?? "";
      else if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") { quote = c; cur += c; continue; }
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    if (depth === 0 && c === sep) { parts.push(cur); cur = ""; continue; }
    cur += c;
  }
  parts.push(cur);
  return parts;
}

/** Nodes -> the shape shadcn's `css` field takes. A key can appear once, so a repeat is an error. */
function toCssObject(nodes, where) {
  const obj = {};
  for (const n of nodes) {
    if (n.k === "decl") {
      if (n.prop in obj) fail(`${where}: "${n.prop}" is declared twice in one block; a registry css object holds it once`);
      obj[n.prop] = n.value;
    } else {
      const key = n.k === "rule" ? n.selector : `@${n.name}${n.params ? " " + n.params : ""}`;
      if (key in obj) fail(`${where}: "${key}" appears twice at the same level; a registry css object holds it once. Merge them in tokens.css or teach gen-registry.mjs`);
      obj[key] = n.nodes ? toCssObject(n.nodes, `${where} > ${key}`) : {};
    }
  }
  return obj;
}

/** The inverse, for compiling the shipped CSS with Tailwind in the cross-check. */
function cssObjectToText(obj, indent = "") {
  let out = "";
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") out += `${indent}${k}: ${v};\n`;
    else if (k.startsWith("@") && Object.keys(v).length === 0 && /^@(import|custom-variant|plugin)/.test(k)) out += `${indent}${k};\n`;
    else out += `${indent}${k} {\n${cssObjectToText(v, indent + "  ")}${indent}}\n`;
  }
  return out;
}

/* ============================================================ the litt vocabulary */

const tokensText = read(path.join(assetsDir, "tokens.css"));
const tailwindText = read(path.join(assetsDir, "tailwind.css"));
const tokensCss = parseCss(tokensText, "tokens.css");
const tailwindCss = parseCss(tailwindText, "tailwind.css");

const littMdVersion = /tokens\s*·\s*v([\d.]+)/.exec(tokensText)?.[1] ?? fail("tokens.css: no 'tokens · vX.Y' header to read the version from");

/** Every custom property tokens.css declares or reads, plus the ones tailwind.css reads. */
const tokenVars = new Set();
const declaredByTokens = new Set();
(function collectVars() {
  const walk = (nodes, into) => {
    for (const n of nodes) {
      if (n.k === "decl") {
        if (n.prop.startsWith("--")) { tokenVars.add(n.prop); into?.add(n.prop); }
        for (const m of n.value.matchAll(/var\(\s*(--[\w-]+)/g)) tokenVars.add(m[1]);
      } else if (n.nodes) walk(n.nodes, into);
    }
  };
  walk(tokensCss, declaredByTokens);
  walk(tailwindCss.filter((n) => !(n.k === "at" && n.name === "theme")), null);
  const theme = tailwindCss.find((n) => n.k === "at" && n.name === "theme" && n.params === "inline") ?? fail("tailwind.css: @theme inline block not found");
  for (const d of theme.nodes) if (d.k === "decl") for (const m of d.value.matchAll(/var\(\s*(--[\w-]+)/g)) tokenVars.add(m[1]);
})();
for (const v of [...tokenVars]) if (v.startsWith("--litt-")) tokenVars.delete(v);
const tokenVarList = [...tokenVars].sort((a, b) => b.length - a.length);
const tokenVarRe = new RegExp(`(?<![\\w-])(${tokenVarList.map(esc).join("|")})(?![\\w-])`, "g");

/** --X -> --litt-X, wherever it appears in a piece of text. */
const renameVars = (text) => text.replace(tokenVarRe, (m) => `--litt-${m.slice(2)}`);

/* Tailwind theme keys. THEME_NS is longest-first so "inset-shadow" wins over "shadow". */
const THEME_NS = ["default-transition", "inset-shadow", "container", "spacing", "radius", "shadow", "color", "text", "ease", "font"];
const SKIPPED_THEME_NS = new Set(["default-transition"]); // would change every host `transition` utility

/** @type {Map<string, Set<string>>} namespace -> base keys (the part before "--line-height" and the like) */
const themeKeys = new Map(THEME_NS.map((ns) => [ns, new Set()]));
/**
 * "ns:key" for keys tailwind.css never maps, found only because tokens.css redeclares a Tailwind theme variable
 * (ease-out, font-sans, font-mono). In code they are litt's; in a sentence ("an ease-out tween") they are plain English.
 */
const impliedKeys = new Set();
/** [name, value] pairs of the mapping we ship, unprefixed: ["--color-canvas", "var(--canvas)"] */
const themeEntries = [];
const skippedThemeEntries = [];
(function collectTheme() {
  const theme = tailwindCss.find((n) => n.k === "at" && n.name === "theme" && n.params === "inline");
  for (const d of theme.nodes) {
    if (d.k !== "decl") continue;
    const ns = THEME_NS.find((x) => d.prop.startsWith(`--${x}-`)) ?? fail(`tailwind.css: theme key ${d.prop} is in a namespace gen-registry.mjs does not know; add it to THEME_NS`);
    if (SKIPPED_THEME_NS.has(ns)) { skippedThemeEntries.push(d.prop); continue; }
    themeKeys.get(ns).add(d.prop.slice(ns.length + 3).split("--")[0]);
    themeEntries.push([d.prop, d.value]);
  }
  // tokens.css also declares names Tailwind reads as theme variables without a mapping
  // (--font-sans, --font-mono, --ease-out): the gallery's utilities resolve to litt's value, so map them too.
  for (const v of tokenVarList) {
    if (!declaredByTokens.has(v)) continue;
    const ns = THEME_NS.find((x) => v.startsWith(`--${x}-`));
    if (!ns || SKIPPED_THEME_NS.has(ns)) continue;
    const key = v.slice(ns.length + 3);
    if (themeKeys.get(ns).has(key)) continue;
    themeKeys.get(ns).add(key);
    impliedKeys.add(`${ns}:${key}`);
    themeEntries.push([v, `var(${v})`]);
  }
})();
const isLittKey = (k) => k === "litt" || k.startsWith("litt-");
/** --ns-key -> --ns-litt-key (already-litt keys stay). */
const renameThemeName = (name) => {
  const ns = THEME_NS.find((x) => name.startsWith(`--${x}-`));
  const key = name.slice(ns.length + 3);
  return isLittKey(key) ? name : `--${ns}-litt-${key}`;
};

/** Which utility prefixes read which theme namespace (Tailwind v4). */
const UTILITY_PREFIXES = {
  color: ["bg", "text", "border", "border-x", "border-y", "border-t", "border-r", "border-b", "border-l", "border-s", "border-e", "outline", "ring", "ring-offset", "inset-ring", "fill", "stroke", "accent", "caret", "decoration", "divide", "from", "via", "to", "placeholder", "shadow", "inset-shadow", "drop-shadow", "text-shadow"],
  spacing: ["p", "px", "py", "pt", "pr", "pb", "pl", "ps", "pe", "m", "mx", "my", "mt", "mr", "mb", "ml", "ms", "me", "w", "h", "size", "min-w", "min-h", "max-w", "max-h", "gap", "gap-x", "gap-y", "space-x", "space-y", "inset", "inset-x", "inset-y", "top", "right", "bottom", "left", "start", "end", "translate", "translate-x", "translate-y", "basis", "indent", "scroll-m", "scroll-mx", "scroll-my", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml", "scroll-p", "scroll-px", "scroll-py", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl", "border-spacing"],
  container: ["w", "min-w", "max-w", "basis", "columns"],
  text: ["text"],
  radius: ["rounded", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-s", "rounded-e", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es"],
  shadow: ["shadow"],
  "inset-shadow": ["inset-shadow"],
  ease: ["ease"],
  font: ["font"],
};
/** prefix -> namespaces */
const prefixNs = new Map();
for (const [ns, prefixes] of Object.entries(UTILITY_PREFIXES)) for (const p of prefixes) prefixNs.set(p, [...(prefixNs.get(p) ?? []), ns]);

/**
 * A Tailwind class token -> the litt-prefixed one, or the token itself.
 * Handles variants (hover:, data-[x]:), the important mark, a leading minus and a /modifier.
 * Arbitrary values are left to renameVars.
 */
function renameClass(token, stats, prose = false) {
  const parts = splitTop(token, ":");
  let base = parts.pop();
  let bang = "";
  if (base.startsWith("!")) { bang = "!"; base = base.slice(1); }
  let tail = "";
  if (base.endsWith("!")) { tail = "!"; base = base.slice(0, -1); }
  let neg = "";
  if (base.startsWith("-")) { neg = "-"; base = base.slice(1); }
  const slash = splitTop(base, "/");
  const modifier = slash.length > 1 ? "/" + slash.slice(1).join("/") : "";
  const utility = slash[0];
  if (!/^[a-z][a-z0-9-]*$/.test(utility)) return token;
  for (let i = utility.indexOf("-"); i > 0; i = utility.indexOf("-", i + 1)) {
    const prefix = utility.slice(0, i);
    const key = utility.slice(i + 1);
    const nss = prefixNs.get(prefix);
    if (!nss || isLittKey(key)) continue;
    const hit = nss.find((ns) => themeKeys.get(ns).has(key) && !(prose && impliedKeys.has(`${ns}:${key}`)));
    if (hit) {
      if (stats) stats.classes++;
      return [...parts, `${bang}${neg}${prefix}-litt-${key}${modifier}${tail}`].join(":");
    }
  }
  return token;
}

/** Rename inside one piece of source text. `mode`: "class" (string literals), "prose" (comments, JSX text). */
function renameText(text, mode, stats) {
  let out = text.replace(tokenVarRe, (m) => { if (stats) stats.vars++; return `--litt-${m.slice(2)}`; });
  if (mode === "class") return out.replace(/\S+/g, (tok) => renameClass(tok, stats));
  if (mode === "prose") {
    return out.replace(/\S+/g, (tok) => {
      const m = /^([`'"(]*)(.*?)([`'").,;:!?]*)$/s.exec(tok);
      return m[1] + renameClass(m[2], stats, true) + m[3];
    });
  }
  return out;
}

/* ================================================================== the CSS items */

/** Add .dark and .light to every selector that names a data-theme, so shadcn/next-themes hosts work. */
function aliasSelector(selector) {
  if (!selector.includes("data-theme")) return selector;
  return splitTop(selector, ",").map((raw) => {
    const part = raw.trim();
    if (part === '[data-theme="light"]') return `${part}, .light`;
    if (part === '[data-theme="dark"]') return `${part}, .dark`;
    if (part === "[data-theme]") return `${part}, .dark, .light`;
    if (part === ':root:not([data-theme="light"])') return ':root:not([data-theme="light"], .light)';
    if (part === ":root") return part;
    return fail(`tokens.css: the selector "${part}" mentions data-theme in a form gen-registry.mjs does not alias to .dark/.light; teach aliasSelector()`);
  }).join(", ");
}

/**
 * tokens.css -> two node lists. `shared` is everything but @layer base, with litt names, the
 * aliases, and color-scheme taken out. `scheme` is the color-scheme declarations that were taken
 * out, kept in the same nesting so base-styles can put them back. `base` is tokens.css's own @layer base.
 */
function splitTokens() {
  const scheme = [];
  const rewrite = (nodes, trail) => {
    const out = [];
    for (const n of nodes) {
      if (n.k === "decl") {
        if (n.prop === "color-scheme") continue;
        out.push({ ...n, prop: renameVars(n.prop), value: renameVars(n.value) });
      } else if (n.k === "rule") {
        const selector = aliasSelector(n.selector);
        const own = n.nodes.find((d) => d.k === "decl" && d.prop === "color-scheme");
        if (own) scheme.push({ trail, selector, value: own.value });
        out.push({ ...n, selector, nodes: rewrite(n.nodes, trail) });
      } else {
        out.push({ ...n, nodes: n.nodes ? rewrite(n.nodes, [...trail, n]) : n.nodes });
      }
    }
    return out;
  };
  const isBase = (n) => n.k === "at" && n.name === "layer" && n.params === "base";
  const shared = rewrite(tokensCss.filter((n) => !isBase(n)), []);
  const base = tokensCss.filter(isBase);
  return { shared, scheme, base };
}

const split = splitTokens();

/** A rule list in tokens.css order with empty rules dropped. */
function prune(nodes) {
  return nodes
    .map((n) => (n.nodes ? { ...n, nodes: prune(n.nodes) } : n))
    .filter((n) => !(n.k !== "decl" && n.nodes && n.nodes.length === 0));
}

/* ---- the base item: tokens, material, theme names */

const sharedCss = prune(split.shared);
const baseCssObject = toCssObject(sharedCss, "tokens.css");
const themeVars = {};
for (const [name, value] of themeEntries) themeVars[renameThemeName(name).slice(2)] = renameVars(value);

/** Every class the shipped CSS defines on its own (.litt-glass...), found, not listed. */
const materialClasses = (() => {
  const found = new Set();
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.k === "rule") for (const m of n.selector.matchAll(/\.(litt-[\w-]+)/g)) found.add(m[1]);
      if (n.nodes) walk(n.nodes);
    }
  };
  walk(sharedCss);
  return [...found].sort();
})();
const materialRe = new RegExp(`(?<![\\w-])(${materialClasses.map(esc).join("|")})(?![\\w-])`);

/* ---- base-styles: tokens.css's @layer base + tailwind.css's, fonts, color-scheme */

function buildBaseStylesCss() {
  const css = {};
  css['@import "@fontsource/hanken-grotesk/400.css"'] = {};
  css['@import "@fontsource/geist-mono/400.css"'] = {};
  // tailwind.css's html rule, minus the page colors: a shadcn host paints its own background and text.
  const twBase = tailwindCss.find((n) => n.k === "at" && n.name === "layer" && n.params === "base") ?? fail("tailwind.css: @layer base not found");
  const html = twBase.nodes.find((n) => n.k === "rule" && n.selector === "html") ?? fail("tailwind.css: @layer base html rule not found");
  const htmlDecls = html.nodes.filter((d) => d.k === "decl" && d.prop !== "background" && d.prop !== "color");
  const layer = {};
  layer.html = {};
  const tokensBase = split.base[0] ?? fail("tokens.css: @layer base not found");
  const rules = [...tokensBase.nodes.filter((n) => n.k === "rule"), { k: "rule", selector: "html", nodes: htmlDecls }];
  for (const r of rules) {
    const decls = toCssObject(r.nodes.map((d) => ({ ...d, prop: renameVars(d.prop), value: renameVars(d.value) })), `@layer base ${r.selector}`);
    layer[r.selector] = { ...(layer[r.selector] ?? {}), ...decls };
  }
  css["@layer base"] = layer;
  // color-scheme, back under the same selectors and media queries the tokens use
  for (const s of split.scheme) {
    let target = css;
    for (const at of s.trail) {
      const key = `@${at.name} ${at.params}`.trim();
      target = target[key] ??= {};
    }
    (target[s.selector] ??= {})["color-scheme"] = s.value;
  }
  return css;
}
const baseStylesCss = buildBaseStylesCss();

/* ====================================================================== the sources */

const docs = JSON.parse(read(docsFile));
const stems = Object.keys(docs).sort();

/** Where a source file lands in a host, relative to the host's src/ (or root). */
function targetOf(file) {
  const r = norm(path.relative(srcDir, file));
  if (r === "components/glide.tsx") return "lib/litt/glide.tsx";
  if (r.startsWith("components/")) return `components/litt/${r.slice("components/".length)}`;
  if (r.startsWith("motion/")) return `lib/litt/motion/${r.slice("motion/".length)}`;
  return fail(`${rel(file)}: only src/components and src/motion can be shipped`);
}

/** Which item a source file belongs to. */
function itemOf(file) {
  const r = norm(path.relative(srcDir, file));
  if (r.startsWith("motion/")) return "motion";
  const m = /^components\/([\w-]+)\.tsx$/.exec(r);
  if (!m) return fail(`${rel(file)}: not a component file`);
  return m[1];
}

function resolveLocal(spec, fromFile) {
  const base = spec.startsWith("@/") ? path.join(srcDir, spec.slice(2)) : path.resolve(path.dirname(fromFile), spec);
  for (const cand of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
  }
  return fail(`${rel(fromFile)}: cannot resolve the import "${spec}"`);
}

const isLocalSpec = (s) => s.startsWith("@/") || s.startsWith("./") || s.startsWith("../");
const packageOf = (s) => (s.startsWith("@") ? s.split("/").slice(0, 2).join("/") : s.split("/")[0]);

/** Edits are [start, end, text], applied last to first. */
const applyEdits = (text, edits) => edits.sort((a, b) => b[0] - a[0]).reduce((t, [s, e, r]) => t.slice(0, s) + r + t.slice(e), text);

/** Every comment range in a parsed file. */
function commentRanges(sf) {
  const seen = new Map();
  const add = (list) => { for (const r of list ?? []) seen.set(r.pos, r); };
  const walk = (node) => {
    add(ts.getLeadingCommentRanges(sf.text, node.pos));
    add(ts.getTrailingCommentRanges(sf.text, node.end));
    for (const c of node.getChildren(sf)) walk(c);
  };
  walk(sf);
  return [...seen.values()];
}

/**
 * The parts of a parsed file that can hold class names or custom property names: [start, end, mode].
 * "class" is a string or template literal (whitespace-separated class tokens), "prose" is a comment or JSX text.
 */
function textPieces(sf, skip = new Set()) {
  const out = [];
  const lit = (node, from, to) => {
    if (skip.has(node)) return;
    const start = node.getStart(sf) + from;
    const end = node.getEnd() - to;
    if (end > start) out.push([start, end, "class"]);
  };
  const walk = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateTail(node)) lit(node, 1, 1);
    else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node)) lit(node, 1, 2);
    else if (node.kind === ts.SyntaxKind.JsxText) out.push([node.getStart(sf), node.getEnd(), "prose"]);
    ts.forEachChild(node, walk);
  };
  walk(sf);
  for (const c of commentRanges(sf)) out.push([c.pos, c.end, "prose"]);
  return out;
}

/* ---- the patches: exact anchors, so a change in the source fails loudly */

/** Token values the server render falls back on, from tokens.css's own :root block. */
function ssrValues(names) {
  const rootBlock = tokensCss.find((n) => n.k === "rule" && n.selector === ":root") ?? fail("tokens.css: no :root block");
  const out = {};
  for (const name of names) {
    const d = rootBlock.nodes.find((x) => x.k === "decl" && x.prop === name) ?? fail(`motion/tokens.ts reads ${name}, but tokens.css's :root block does not define it`);
    out[name] = d.value;
  }
  return out;
}

const PATCHES = {
  "motion/tokens.ts": [
    {
      why: "readLocked runs while a client component renders on the server (Next.js), where there is no document. Fall back to the values tokens.css ships.",
      find: "function computed(name: string): string {\n  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();\n}",
      replace: (text) => {
        const names = [...new Set([...text.matchAll(/"(--[\w-]+)"/g)].map((m) => m[1]))];
        const values = ssrValues(names);
        const lines = Object.entries(values).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
        return (
          "/** What tokens.css ships, for a render with no document (a server). The browser reads the real values. */\n" +
          `const SERVER_VALUES: Record<string, string> = {\n${lines.join("\n")}\n};\n\n` +
          "function computed(name: string): string {\n" +
          '  if (typeof document === "undefined") return SERVER_VALUES[name] ?? "";\n' +
          "  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();\n}"
        );
      },
    },
  ],
};

/** The defines vite.config.ts injects into the gallery, which a host does not have. */
const DEFINES = { __LITT_MD_VERSION__: JSON.stringify(littMdVersion) };

/**
 * Analyse and transform one source file.
 * Returns { text, imports: [{spec, file?}], stats, usesLitt }.
 */
function transformFile(file, targets) {
  const key = norm(path.relative(srcDir, file));
  let text = read(file);
  for (const p of PATCHES[key] ?? []) {
    if (!text.includes(p.find)) fail(`${rel(file)}: the patch anchor moved (${p.why}). Update PATCHES in gen-registry.mjs, or move the fix into the source.`);
    const replacement = p.replace(text);
    text = text.replace(p.find, () => replacement);
  }
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  const edits = [];
  const imports = [];
  const stats = { vars: 0, classes: 0 };
  const specNodes = new Set();

  const specifier = (node) => {
    specNodes.add(node);
    const spec = node.text;
    if (!isLocalSpec(spec)) { imports.push({ spec }); return; }
    const resolved = resolveLocal(spec, file);
    const to = targets.get(resolved) ?? fail(`${rel(file)}: imports ${rel(resolved)}, which is not shipped`);
    let r = norm(path.relative(path.dirname(targetOf(file)), to)).replace(/\.(tsx?|mts)$/, "").replace(/\/index$/, "");
    if (!r.startsWith(".")) r = "./" + r;
    imports.push({ spec, file: resolved });
    edits.push([node.getStart(sf) + 1, node.getEnd() - 1, r]);
  };

  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifier(node.moduleSpecifier);
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      specifier(node.arguments[0]);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      specifier(node.argument.literal);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  for (const [start, end, mode] of textPieces(sf, specNodes)) {
    const before = sf.text.slice(start, end);
    const after = renameText(before, mode, stats);
    if (after !== before) edits.push([start, end, after]);
  }

  // asChild: shadcn's CLI rewrites a written asChild attribute into Base UI's render prop whenever the host's
  // style starts with "base-" (the default of `shadcn init`). These files use Radix, which has no render prop, so
  // the attribute is spread in from a constant, which the CLI does not look at.
  let usesAsChild = false;
  const asChildWalk = (node) => {
    if (ts.isJsxAttribute(node) && node.name.getText(sf) === "asChild") {
      usesAsChild = true;
      const init = node.initializer;
      if (!init) edits.push([node.getStart(sf), node.getEnd(), "{...asChildProps}"]);
      else if (ts.isJsxExpression(init) && init.expression?.kind === ts.SyntaxKind.TrueKeyword) edits.push([node.getStart(sf), node.getEnd(), "{...asChildProps}"]);
      else if (ts.isJsxExpression(init) && init.expression) edits.push([node.getStart(sf), node.getEnd(), `{...{ asChild: ${init.expression.getText(sf)} }}`]);
      else fail(`${rel(file)}: asChild with a string value; gen-registry.mjs cannot spread that`);
    }
    ts.forEachChild(node, asChildWalk);
  };
  asChildWalk(sf);
  if (usesAsChild) {
    const lastImport = sf.statements.filter(ts.isImportDeclaration).pop() ?? fail(`${rel(file)}: uses asChild but has no import to put the constant after`);
    edits.push([
      lastImport.getEnd(),
      lastImport.getEnd(),
      "\n\n/* Radix's asChild, spread in: shadcn's CLI rewrites a written asChild to Base UI's render prop in base-* hosts. */\nconst asChildProps = { asChild: true } as const;",
    ]);
  }

  // identifiers vite.config.ts defines
  const defineWalk = (node) => {
    if (ts.isIdentifier(node) && node.text in DEFINES) edits.push([node.getStart(sf), node.getEnd(), DEFINES[node.text]]);
    ts.forEachChild(node, defineWalk);
  };
  defineWalk(sf);

  // Overlap check, then apply.
  const sorted = [...edits].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < sorted.length; i++) if (sorted[i][0] < sorted[i - 1][1]) fail(`${rel(file)}: two edits overlap at offset ${sorted[i][0]}`);
  text = applyEdits(text, edits);
  if (file.endsWith(".tsx")) text = `"use client";\n\n${text}`;

  const usesLitt = stats.vars + stats.classes > 0 || materialRe.test(text);
  return { text, imports, stats, usesLitt };
}

/* ============================================================== item copy (plain words) */

/**
 * The description and the docs line the shadcn CLI prints after an install. Plain words,
 * short sentences, no em dashes. A missing entry fails the build, so a new component gets words.
 */
const COPY = {
  litt: {
    title: "litt tokens",
    description: "litt.md's colors, type, space, shape, depth and motion as CSS variables, Tailwind names and the litt-glass, litt-raised, litt-trim, litt-lit and litt-grain classes. Every name starts with litt, so none of it touches your own.",
    docs: "Added to your global CSS: --litt-* variables, Tailwind names such as bg-litt-surface-1 and rounded-litt-control, and the litt-glass class and its siblings. Nothing of yours is changed. Dark follows .dark, [data-theme=\"dark\"] or the system setting.",
  },
  "base-styles": {
    title: "litt base styles",
    description: "Optional. Loads Hanken Grotesk and Geist Mono at weight 400 and applies litt's page defaults: weight 400, the control radius on native controls and the litt focus ring.",
    docs: "This one restyles your whole app: the html font, heading weight, button and input radius and the focus outline. No component needs it. Skip it if you only want the components.",
  },
  motion: {
    title: "Motion",
    description: "The motion engine the components share. Hooks for the instant, responsive and expressive tiers, exits, travel and stagger, all reading litt's tokens.",
    docs: "Installed in lib/litt/motion. The components use it for you, and it needs no provider.",
  },
  glide: {
    title: "Glide",
    description: "The highlight that glides from row to row in the Menu and the Command menu.",
    docs: "Installed in lib/litt/glide.tsx. Menu and Command menu use it for you.",
  },
  button: {
    title: "Button",
    description: "Roomy, slightly rounded and weight 400, in primary, secondary and ghost, on the shared control scale. Hover and press are instant and never move the box.",
    docs: "Import Button from components/litt/button. Primary is the one accent fill in a view. An icon-only button needs an aria-label.",
  },
  kbd: {
    title: "Kbd",
    description: "The key cap for a real shortcut, such as ⌘K or esc. One chip everywhere, in Geist Mono.",
    docs: "Import Kbd from components/litt/kbd. Use it for real shortcuts only.",
  },
  icons: {
    title: "Icons",
    description: "16px icons with a 1.5px stroke that follow the text color.",
    docs: "Import the icons you need from components/litt/icons. They are decorative unless you label them.",
  },
  tooltip: {
    title: "Tooltip",
    description: "A small solid label for icons, shortcuts and status. It opens after a short hover or at once on focus, then grows from its trigger.",
    docs: "Import Tooltip from components/litt/tooltip. Mount TooltipProvider once near the root so tooltips share one skip window.",
  },
  tabs: {
    title: "Tabs",
    description: "Underline or segmented tabs. The indicator slides between tabs, the label only changes color and the panel fades in from the side of the tab you picked.",
    docs: "Import Tabs, TabsList, TabsTrigger, TabsPanels and TabsPanel from components/litt/tabs.",
  },
  menu: {
    title: "Menu",
    description: "A glass dropdown with one highlight that glides from row to row. It grows from its trigger and travels from the side it really opens on.",
    docs: "Import Menu and MenuItem from components/litt/menu. Its submenus are solid, never glass on glass.",
  },
  "command-menu": {
    title: "Command menu",
    description: "Search every page, project and action from the keyboard. The panel drops in over a dimmed canvas and one highlight glides between rows.",
    docs: "Import CommandMenu and useCommandShortcut from components/litt/command-menu. Give it groups of items and an onSelect.",
  },
  dialog: {
    title: "Dialog",
    description: "The one expressive moment. The panel is placed, not thrown: it rises a short distance and settles, and exits are quicker and never bounce.",
    docs: "Import Dialog, DialogTrigger, DialogContent and DialogClose from components/litt/dialog. Pair a form's submit with a Cancel, both at size lg.",
  },
  "dialog-fields": {
    title: "Dialog fields",
    description: "A text field and a segmented radio on the 44px control scale, made for forms inside a dialog.",
    docs: "Import TextField and SegmentedRadio from components/litt/dialog-fields. Inputs use 16px text on touch screens.",
  },
  toast: {
    title: "Toast",
    description: "Toasts arrive from just below the corner and leave sideways. Older ones stack behind the newest and open into a list on hover or focus.",
    docs: "Import Toaster, toast and useToast from components/litt/toast. Mount Toaster once, then call toast() anywhere.",
  },
  "list-cover": {
    title: "List cover",
    description: "The generated cover art used by project rows and cards.",
    docs: "Import ProjectCover from components/litt/list-cover.",
  },
  list: {
    title: "List and cards",
    description: "Airy project rows and raised cards that arrive in one staggered cascade. Filtering and inserting stay responsive, and hover never moves anything.",
    docs: "Import ProjectList, ProjectGrid, ProjectFilters and ProjectsEmpty from components/litt/list.",
  },
  input: {
    title: "Input",
    description: "TODO(input): one or two plain sentences, from the page summary.",
    docs: "TODO(input): where it installs and what to import.",
  },
  checkbox: {
    title: "Checkbox and radio",
    description: "TODO(checkbox): one or two plain sentences, from the page summary.",
    docs: "TODO(checkbox): where it installs and what to import.",
  },
  segmented: {
    title: "Segmented control",
    description: "TODO(segmented): one or two plain sentences, from the page summary.",
    docs: "TODO(segmented): where it installs and what to import.",
  },
  tag: {
    title: "Tag",
    description: "TODO(tag): one or two plain sentences, from the page summary.",
    docs: "TODO(tag): where it installs and what to import.",
  },
  popover: {
    title: "Popover",
    description: "TODO(popover): one or two plain sentences, from the page summary.",
    docs: "TODO(popover): where it installs and what to import.",
  },
  header: {
    title: "Glass header",
    description: "TODO(header): one or two plain sentences, from the page summary.",
    docs: "TODO(header): where it installs and what to import.",
  },
  card: {
    title: "Card",
    description: "TODO(card): one or two plain sentences, from the page summary.",
    docs: "TODO(card): where it installs and what to import.",
  },
  table: {
    title: "Table",
    description: "TODO(table): one or two plain sentences, from the page summary.",
    docs: "TODO(table): where it installs and what to import.",
  },
  states: {
    title: "Empty and loading states",
    description: "TODO(states): one or two plain sentences, from the page summary.",
    docs: "TODO(states): where it installs and what to import.",
  },
};

/* =============================================================== assemble the items */

const SCHEMA_URL = "https://ui.shadcn.com/schema/registry-item.json";
const urlOf = (name) => `${origin}/r/${name}.json`;
const ITEM_TYPE = { motion: "registry:lib", glide: "registry:lib" };

function build() {
  // 1. Which files ship, and where.
  const componentFiles = stems.map((s) => path.join(componentsDir, `${s}.tsx`));
  for (const f of componentFiles) if (!fs.existsSync(f)) fail(`docs.json lists "${path.basename(f, ".tsx")}", but ${rel(f)} does not exist. Run npm run gen:docs.`);
  const onDisk = fs.readdirSync(componentsDir).filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4)).sort();
  if (onDisk.join() !== stems.join()) fail(`docs.json is stale: it has [${stems}] and src/components has [${onDisk}]. Run npm run gen:docs.`);
  const motionFiles = ["index.tsx", "spring.ts", "tokens.ts"].map((f) => path.join(motionDir, f));
  for (const f of motionFiles) if (!fs.existsSync(f)) fail(`${rel(f)} is missing`);

  const targets = new Map();
  for (const f of [...componentFiles, ...motionFiles]) targets.set(f, targetOf(f));

  // 2. Transform every file once.
  const transformed = new Map();
  for (const f of targets.keys()) transformed.set(f, transformFile(f, targets));

  // 3. Item graph.
  const itemFiles = new Map(); // item -> [files]
  for (const f of targets.keys()) {
    const name = itemOf(f);
    itemFiles.set(name, [...(itemFiles.get(name) ?? []), f]);
  }
  const itemNames = [...itemFiles.keys()].sort();
  for (const name of itemNames) if (!COPY[name]) fail(`gen-registry.mjs: no entry for "${name}" in COPY. Add a title, a description and a docs line.`);

  // 4. Cross-check against gen-docs: the closure of our graph must be the files docs.json lists.
  const closure = (name, seen = new Set()) => {
    if (seen.has(name)) return seen;
    seen.add(name);
    for (const f of itemFiles.get(name)) for (const imp of transformed.get(f).imports) if (imp.file) closure(itemOf(imp.file), seen);
    return seen;
  };
  for (const stem of stems) {
    const mine = [...closure(stem)].flatMap((n) => itemFiles.get(n)).map(rel).sort();
    const theirs = [...docs[stem].files].sort();
    if (mine.join() !== theirs.join()) {
      fail(`docs.json and gen-registry.mjs disagree on the files "${stem}" needs.\n  docs.json:    ${theirs.join(", ")}\n  gen-registry: ${mine.join(", ")}`);
    }
  }

  const items = [];
  const base = (extra) => ({ $schema: SCHEMA_URL, ...extra });

  // litt (tokens) and base-styles
  items.push(base({
    name: "litt",
    type: "registry:style",
    title: COPY.litt.title,
    description: COPY.litt.description,
    cssVars: { theme: themeVars },
    css: baseCssObject,
    docs: COPY.litt.docs,
  }));
  items.push(base({
    name: "base-styles",
    type: "registry:style",
    title: COPY["base-styles"].title,
    description: COPY["base-styles"].description,
    dependencies: ["@fontsource/hanken-grotesk", "@fontsource/geist-mono"],
    registryDependencies: [urlOf("litt")],
    css: baseStylesCss,
    docs: COPY["base-styles"].docs,
  }));

  // components and engines
  for (const name of itemNames) {
    const type = ITEM_TYPE[name] ?? "registry:ui";
    const files = itemFiles.get(name);
    const deps = new Set();
    const pkgs = new Set();
    let usesLitt = false;
    for (const f of files) {
      const t = transformed.get(f);
      usesLitt ||= t.usesLitt;
      for (const imp of t.imports) {
        if (imp.file) { if (itemOf(imp.file) !== name) deps.add(itemOf(imp.file)); }
        else if (!["react", "react-dom"].includes(packageOf(imp.spec))) pkgs.add(packageOf(imp.spec));
      }
    }
    const registryDependencies = [...(usesLitt ? ["litt"] : []), ...[...deps].sort()].map(urlOf);
    items.push(base({
      name,
      type,
      title: COPY[name].title,
      description: COPY[name].description,
      ...(pkgs.size ? { dependencies: [...pkgs].sort() } : {}),
      ...(registryDependencies.length ? { registryDependencies } : {}),
      files: files.map((f) => ({
        path: `registry/litt/${type === "registry:lib" ? "lib" : "ui"}/${targets.get(f).replace(/^(?:components|lib)\/litt\//, "")}`,
        type,
        content: transformed.get(f).text,
        target: targets.get(f),
      })),
      docs: COPY[name].docs,
    }));
  }
  return { items, targets, transformed };
}

/* ================================================================ schema validation */

const ITEM_TYPES = ["registry:lib", "registry:block", "registry:component", "registry:ui", "registry:hook", "registry:page", "registry:file", "registry:theme", "registry:style", "registry:item", "registry:base", "registry:font", "registry:example", "registry:internal"];
const ITEM_KEYS = ["$schema", "extends", "name", "title", "author", "description", "dependencies", "devDependencies", "registryDependencies", "files", "tailwind", "cssVars", "css", "envVars", "meta", "docs", "categories", "type"];

/** The rules of shadcn 4.21.0's registryItemSchema, as far as our items use them. */
function validateItem(item) {
  const errs = [];
  const bad = (m) => errs.push(`${item.name ?? "?"}: ${m}`);
  const isStr = (v) => typeof v === "string";
  const strList = (k) => { if (item[k] !== undefined && !(Array.isArray(item[k]) && item[k].every(isStr))) bad(`${k} must be a list of strings`); };
  for (const k of Object.keys(item)) if (!ITEM_KEYS.includes(k)) bad(`unknown field "${k}"`);
  if (!isStr(item.name) || !item.name) bad("name must be a non-empty string");
  if (!ITEM_TYPES.includes(item.type)) bad(`type "${item.type}" is not a registry item type`);
  if (item.type === "registry:base" || item.type === "registry:font") bad(`${item.type} has extra required fields; not used here`);
  for (const k of ["title", "description", "docs", "extends", "$schema"]) if (item[k] !== undefined && !isStr(item[k])) bad(`${k} must be a string`);
  if (item.author !== undefined && (!isStr(item.author) || item.author.length < 2)) bad("author needs at least 2 characters");
  for (const k of ["dependencies", "devDependencies", "registryDependencies", "categories"]) strList(k);
  if (item.files !== undefined) {
    if (!Array.isArray(item.files)) bad("files must be a list");
    else for (const f of item.files) {
      if (!isStr(f.path) || !f.path) bad("a file needs a path");
      if (!ITEM_TYPES.includes(f.type)) bad(`file ${f.path}: type "${f.type}" is not a registry item type`);
      if (f.content !== undefined && !isStr(f.content)) bad(`file ${f.path}: content must be a string`);
      if (f.target !== undefined && !isStr(f.target)) bad(`file ${f.path}: target must be a string`);
      if ((f.type === "registry:file" || f.type === "registry:page") && !f.target) bad(`file ${f.path}: ${f.type} needs a target`);
      for (const k of Object.keys(f)) if (!["path", "content", "type", "target"].includes(k)) bad(`file ${f.path}: unknown field "${k}"`);
    }
  }
  if (item.cssVars !== undefined) {
    for (const [k, v] of Object.entries(item.cssVars)) {
      if (!["theme", "light", "dark"].includes(k)) bad(`cssVars.${k} is not theme, light or dark`);
      else if (!v || typeof v !== "object" || !Object.values(v).every(isStr)) bad(`cssVars.${k} must map names to strings`);
    }
  }
  const cssOk = (v) => isStr(v) || (Array.isArray(v) && v.every((x) => isStr(x) || (x && typeof x === "object" && Object.values(x).every(isStr)))) || (v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every(cssOk));
  if (item.css !== undefined && !(item.css && typeof item.css === "object" && Object.values(item.css).every(cssOk))) bad("css must be nested objects of strings");
  return errs;
}

/** shadcn's own zod schema, when the package can be found (SHADCN_PKG, or `shadcn` next to the gallery). */
async function loadShadcnSchema() {
  const candidates = [];
  if (process.env.SHADCN_PKG) candidates.push(path.join(path.resolve(process.env.SHADCN_PKG), "dist", "schema", "index.js"));
  try { candidates.push(createRequire(path.join(root, "package.json")).resolve("shadcn/schema")); } catch { /* not installed */ }
  for (const c of candidates) {
    try {
      const mod = await import(pathToFileURL(c).href);
      if (mod.registryItemSchema) return mod;
    } catch { /* try the next */ }
  }
  return null;
}

/* ===================================================================== the verifier */

const ALLOWED_FOREIGN_VARS = [/^--radix-/, /^--tw-/];

function verify(items, targets, transformed, shadcn) {
  const errs = [];
  const byName = new Map(items.map((i) => [i.name, i]));
  const bad = (where, m) => errs.push(`${where}: ${m}`);

  for (const item of items) errs.push(...validateItem(item));
  if (shadcn) {
    for (const item of items) {
      const r = shadcn.registryItemSchema.safeParse(item);
      if (!r.success) bad(item.name, `shadcn's schema: ${r.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
    }
  }

  // ---- the shipped CSS: what is declared, what is read
  const litt = byName.get("litt");
  const declared = new Set(); // custom properties the shipped CSS defines
  const read = new Set(); // custom properties it reads
  const selectors = [];
  const walkCss = (obj, trail) => {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string") {
        if (k.startsWith("--")) declared.add(k);
        for (const m of v.matchAll(/var\(\s*(--[\w-]+)/g)) read.add(m[1]);
        selectors.push({ trail, decl: k, value: v });
      } else {
        if (!k.startsWith("@")) selectors.push({ trail, selector: k });
        walkCss(v, [...trail, k]);
      }
    }
  };
  walkCss(litt.css, []);
  for (const [k, v] of Object.entries(litt.cssVars.theme)) {
    declared.add(`--${k}`);
    for (const m of v.matchAll(/var\(\s*(--[\w-]+)/g)) read.add(m[1]);
  }
  const inputs = new Set([...read].filter((v) => !declared.has(v))); // read, never defined: set by the caller
  for (const v of inputs) if (!ALLOWED_FOREIGN_VARS.some((re) => re.test(v)) && v !== "--litt-glass-shadow") bad("litt", `reads ${v}, which nothing defines`);

  const themeShape = new RegExp(`^--(?:${THEME_NS.join("|")})-litt(?:-|$)`);
  for (const name of declared) {
    if (!(name.startsWith("--litt-") || themeShape.test(name))) bad("litt", `declares ${name}, which is not a litt name`);
  }
  for (const s of selectors) {
    if (s.selector !== undefined) {
      for (const part of splitTop(s.selector, ",").map((x) => x.trim())) {
        if (/^(html|body|h[1-6]|button|input|select|textarea|a|p|\*|b|strong|th)\b/.test(part)) bad("litt", `has an element selector "${part}"; element styles belong in base-styles`);
      }
      if (s.selector.includes("data-theme")) {
        for (const part of splitTop(s.selector, ",").map((x) => x.trim())) {
          if (part === '[data-theme="dark"]' && !s.selector.includes(".dark")) bad("litt", `"${s.selector}" lacks the .dark alias`);
          if (part === '[data-theme="light"]' && !s.selector.includes(".light")) bad("litt", `"${s.selector}" lacks the .light alias`);
          if (part === "[data-theme]" && !(s.selector.includes(".dark") && s.selector.includes(".light"))) bad("litt", `"${s.selector}" lacks the .dark/.light aliases`);
        }
        if (s.selector.includes(":not([data-theme=\"light\"])")) bad("litt", `"${s.selector}" lacks the .light exclusion`);
      }
    }
    if (s.decl === "color-scheme") bad("litt", "sets color-scheme, which would change the host's scrollbars and form controls");
    if (s.value === "initial" || s.value === "unset" || s.value === "revert") bad("litt", `resets ${s.decl} with ${s.value}`);
  }
  const trailText = selectors.map((s) => s.trail.join(" ")).join("|");
  if (/@layer base/.test(trailText)) bad("litt", "has an @layer base rule; those belong in base-styles");
  if (!("@media (prefers-color-scheme: dark)" in litt.css)) bad("litt", "lost the system dark preference block");
  if (/^--(color|radius|shadow|text|font-weight)-\*$/.test(Object.keys(litt.cssVars.theme).join("|"))) bad("litt", "resets a Tailwind theme namespace");

  const styles = byName.get("base-styles");
  const stylesWalk = (obj) => {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string") {
        for (const m of v.matchAll(/var\(\s*(--[\w-]+)/g)) if (!declared.has(m[1])) bad("base-styles", `reads ${m[1]}, which litt does not define`);
        if (k.startsWith("--") && !k.startsWith("--litt-")) bad("base-styles", `declares ${k}, which is not a litt name`);
      } else stylesWalk(v);
    }
  };
  stylesWalk(styles.css);

  // ---- the shipped files
  const shippedTargets = new Set([...targets.values()]);
  const unprefixedVarRe = tokenVarRe; // global regex; reset lastIndex per use
  const closureOf = (item, seen = new Set()) => {
    for (const u of item.registryDependencies ?? []) {
      const n = byName.get(u.slice(u.lastIndexOf("/") + 1, -".json".length)) ?? bad(item.name, `registryDependency ${u} is not an item of this registry`);
      if (n && !seen.has(n.name)) { seen.add(n.name); closureOf(n, seen); }
    }
    return seen;
  };
  const stringLiterals = (text, name) => {
    const sf = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, name.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    return textPieces(sf).filter((p) => p[2] === "class").map(([a, b]) => text.slice(a, b));
  };
  /** Words a second renaming pass would still change: litt utilities that kept their old name. */
  const survivors = (text, name) => {
    const sf = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, name.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const found = [];
    for (const [a, b, mode] of textPieces(sf)) {
      const before = text.slice(a, b);
      const after = renameText(before, mode);
      if (after === before) continue;
      const was = before.split(/\s+/);
      const now = after.split(/\s+/);
      was.forEach((w, i) => { if (w !== now[i]) found.push(w); });
    }
    return found;
  };

  for (const item of items) {
    for (const file of item.files ?? []) {
      const where = `${item.name} ${file.target}`;
      const text = file.content;
      unprefixedVarRe.lastIndex = 0;
      const stray = [...text.matchAll(unprefixedVarRe)].map((m) => m[0]);
      if (stray.length) bad(where, `unprefixed litt custom property survives: ${[...new Set(stray)].join(", ")}`);
      const names = new Set([...text.matchAll(/(?<![\w-])(--[a-zA-Z][\w-]*)/g)].map((m) => m[1]));
      for (const n of names) {
        if (ALLOWED_FOREIGN_VARS.some((re) => re.test(n))) continue;
        if (!declared.has(n) && n !== "--litt-glass-shadow") bad(where, `uses ${n}, which the shipped CSS does not define`);
      }
      const left = survivors(text, file.target);
      if (left.length) bad(where, `unprefixed litt utility survives: ${[...new Set(left)].join(", ")}`);
      if (/(?<![\w$])__[A-Z][A-Z_]*__(?![\w$])/.test(text)) bad(where, "uses a build-time global (__X__) that a host does not define");
      for (const lit of stringLiterals(text, file.target)) {
        const words = lit.split(/\s+/);
        if (words.some((w) => /^(?:[\w-]+:)*transition(?:-|$)/.test(w)) && !(words.some((w) => /^(?:[\w-]+:)*duration-/.test(w)) && words.some((w) => /^(?:[\w-]+:)*ease-/.test(w)))) {
          bad(where, `"${lit.slice(0, 60)}..." has a transition without its own duration and ease; a host's default transition would apply`);
        }
      }
      if (!text.startsWith('"use client";') && file.target.endsWith(".tsx")) bad(where, 'lacks "use client"');

      const sf = ts.createSourceFile(file.target, text, ts.ScriptTarget.Latest, true, file.target.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const closure = closureOf(item);
      const importsOf = [];
      const visit = (node) => {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) importsOf.push(node.moduleSpecifier.text);
        else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) importsOf.push(node.arguments[0].text);
        ts.forEachChild(node, visit);
      };
      visit(sf);
      const findAsChild = (node) => {
        if (ts.isJsxAttribute(node) && node.name.getText(sf) === "asChild") bad(where, "has a written asChild attribute; shadcn's CLI would turn it into a render prop in a base-* host");
        ts.forEachChild(node, findAsChild);
      };
      findAsChild(sf);
      for (const spec of importsOf) {
        if (spec.startsWith("@/") || spec.startsWith("~/")) { bad(where, `imports "${spec}", which depends on the host's alias`); continue; }
        if (spec.startsWith(".")) {
          const dir = path.posix.dirname(file.target);
          const joined = path.posix.normalize(path.posix.join(dir, spec));
          const hit = [`${joined}.tsx`, `${joined}.ts`, `${joined}/index.tsx`, `${joined}/index.ts`].find((c) => shippedTargets.has(c));
          if (!hit) { bad(where, `imports "${spec}", which is not a shipped file`); continue; }
          const owner = items.find((i) => (i.files ?? []).some((f) => f.target === hit));
          if (owner.name !== item.name && !closure.has(owner.name)) bad(where, `imports ${hit} from ${owner.name}, which is not in its registryDependencies`);
        } else {
          const pkg = packageOf(spec);
          if (pkg === "react" || pkg === "react-dom") continue;
          const have = new Set([...(item.dependencies ?? []), ...[...closure].flatMap((n) => byName.get(n).dependencies ?? [])]);
          if (!have.has(pkg)) bad(where, `imports ${pkg}, which neither the item nor its dependencies declare`);
        }
      }
      if (!(item.registryDependencies ?? []).includes(urlOf("litt")) && (text.match(/--litt-|-litt-|litt-(glass|raised|trim|lit|grain)/))) {
        bad(where, "uses litt names but the item does not depend on litt");
      }
    }
    for (const u of item.registryDependencies ?? []) if (!u.startsWith("http://") && !u.startsWith("https://")) bad(item.name, `registryDependency "${u}" is not an absolute URL (shadcn would look for it in its own registry)`);
  }
  return errs;
}

/* ---- the Tailwind cross-check: the same classes, original theme vs shipped theme */

/** CSS class selector text -> the token it was made from (`.hover\:bg-x` -> `hover:bg-x`). */
const unescapeCss = (s) => s.replace(/\\([0-9a-f]{1,6}) ?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, "$1");

/** Tailwind's output -> Map<token, canonical CSS of every rule it made, sorted>. Only the utilities layer. */
function utilityRules(css) {
  const out = new Map();
  const text = (nodes) => nodes.map((n) => (n.k === "decl" ? `${n.prop}:${n.value}` : n.k === "rule" ? `${n.selector}{${text(n.nodes)}}` : `@${n.name} ${n.params}${n.nodes ? `{${text(n.nodes)}}` : ""}`)).join(";");
  const visit = (nodes, trail) => {
    for (const n of nodes) {
      if (n.k === "at" && n.nodes) {
        if (trail === null) { if (n.name === "layer" && n.params === "utilities") visit(n.nodes, ""); }
        else visit(n.nodes, `${trail}@${n.name} ${n.params} `);
      }
      else if (n.k === "rule" && trail !== null) {
        const m = /^\.((?:\\.|[\w-])+)/.exec(n.selector);
        if (!m) continue;
        const token = unescapeCss(m[1]);
        out.set(token, [...(out.get(token) ?? []), `${trail}${n.selector}{${text(n.nodes)}}`]);
      }
    }
  };
  visit(parseCss(css, "tailwind output"), null);
  return new Map([...out].map(([k, v]) => [k, v.sort().join(" ")]));
}

async function tailwindCrossCheck(items) {
  const errs = [];
  let compile;
  let twRoot;
  try {
    const req = createRequire(path.join(root, "package.json"));
    twRoot = path.dirname(req.resolve("tailwindcss/package.json"));
    ({ compile } = await import(pathToFileURL(path.join(twRoot, "dist", "lib.mjs")).href));
  } catch {
    return { errs: ["the Tailwind cross-check needs the tailwindcss package (npm ci --prefix gallery)"], count: 0 };
  }
  const loadStylesheet = async (id) => {
    const m = /^tailwindcss(?:\/(.+))?$/.exec(id);
    if (!m) return fail(`cross-check: cannot load stylesheet ${id}`);
    const p = path.join(twRoot, m[1] ? (m[1].endsWith(".css") ? m[1] : `${m[1]}.css`) : "index.css");
    return { path: p, base: path.dirname(p), content: read(p) };
  };

  // Candidates: every whitespace-separated word of every original string literal, with its renamed twin.
  const pairs = new Map();
  for (const f of [...fs.readdirSync(componentsDir).map((x) => path.join(componentsDir, x)), ...fs.readdirSync(motionDir).map((x) => path.join(motionDir, x))]) {
    if (!/\.tsx?$/.test(f)) continue;
    const sf = ts.createSourceFile(f, read(f), ts.ScriptTarget.Latest, true, f.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const take = (s) => { for (const tok of s.split(/\s+/)) if (/[a-z]/.test(tok)) pairs.set(tok, renameText(tok, "class")); };
    const walk = (node) => {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) take(node.text);
      ts.forEachChild(node, walk);
    };
    walk(sf);
  }

  // A: the gallery's stylesheet, strict mode on (what sync-tokens.mjs makes). B: a host with Tailwind's
  // default theme (not strict) plus exactly what the litt item ships.
  const litt = items.find((i) => i.name === "litt");
  const strict = "@theme {\n  --color-*: initial;\n  --radius-*: initial;\n  --shadow-*: initial;\n  --font-weight-*: initial;\n  --text-*: initial;\n  --font-weight-normal: 400;\n}\n";
  const galleryCss = `@import "tailwindcss";\n${strict}${tokensText}\n${tailwindText.replace(/@import "tailwindcss";\s*@import "\.\/tokens\.css";/, "").replace(/@custom-variant[^\n]*\n/, "")}`;
  const hostCss = `@import "tailwindcss";\n@theme inline {\n${Object.entries(litt.cssVars.theme).map(([k, v]) => `  --${k}: ${v};`).join("\n")}\n}\n${cssObjectToText(litt.css)}`;
  const a = await compile(galleryCss, { base: root, loadStylesheet });
  const b = await compile(hostCss, { base: root, loadStylesheet });
  const rulesA = utilityRules(a.build([...pairs.keys()]));
  const rulesB = utilityRules(b.build([...new Set(pairs.values())]));

  let checked = 0;
  for (const [orig, ren] of pairs) {
    const ca = rulesA.get(orig);
    if (ca === undefined) {
      if (process.env.LITT_REGISTRY_DEBUG && orig !== ren) console.log(`renamed but not a utility in the gallery: ${orig} -> ${ren}`);
      continue; // not a utility in the gallery
    }
    checked++;
    const cb = rulesB.get(ren);
    // transition utilities fall back on --default-transition-*, which the gallery points at the instant tier and
    // a host keeps for itself. The source check in verify() makes sure every one sets its own duration and ease.
    if (/^(?:[\w-]+:)*transition(?:-|$)/.test(orig) && cb !== undefined) continue;
    if (cb === undefined) { errs.push(`class "${orig}" makes CSS in the gallery, but "${ren}" makes none in a host`); continue; }
    // Same CSS once the prefix is taken off: --litt-x -> --x, bg-litt-x -> bg-x.
    const strip = (css) => css.replace(/(?<=[-.\\(])litt-/g, "");
    if (strip(ca) !== strip(cb)) errs.push(`class "${orig}" -> "${ren}" changes meaning:\n      gallery: ${ca}\n      host:    ${cb}`);
  }
  return { errs, count: checked };
}

/* ===================================================================== write it out */

function serialize(items) {
  const files = new Map();
  for (const item of items) files.set(`${item.name}.json`, JSON.stringify(item, null, 2) + "\n");
  const index = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "litt",
    homepage: PRODUCTION_ORIGIN,
    items: items.map((i) => {
      const { $schema, files: fs_, ...rest } = i;
      void $schema;
      return { ...rest, ...(fs_ ? { files: fs_.map(({ path: p, type, target }) => ({ path: p, type, target })) } : {}) };
    }),
  };
  files.set("registry.json", JSON.stringify(index, null, 2) + "\n");
  return files;
}

async function main() {
  const shadcn = await loadShadcnSchema();
  const { items, targets, transformed } = build();
  const errs = verify(items, targets, transformed, shadcn);
  const cross = await tailwindCrossCheck(items);
  errs.push(...cross.errs);
  if (errs.length) {
    console.error(`gen-registry: ${errs.length} problem${errs.length === 1 ? "" : "s"}:`);
    for (const e of errs) console.error(`  - ${e}`);
    process.exit(1);
  }

  const files = serialize(items);
  if (check) {
    const stale = [];
    for (const [name, text] of files) {
      const f = path.join(outDir, name);
      if (!fs.existsSync(f) || read(f) !== text) stale.push(name);
    }
    if (stale.length) {
      console.error(`gen-registry: ${path.relative(root, outDir) || "."} is stale or missing: ${stale.join(", ")}. Run npm run gen:registry.`);
      process.exit(1);
    }
  } else {
    // Write beside it, then swap, so something reading outDir never sees half a registry.
    const next = `${outDir}.next-${process.pid}`;
    fs.rmSync(next, { recursive: true, force: true });
    fs.mkdirSync(next, { recursive: true });
    for (const [name, text] of files) fs.writeFileSync(path.join(next, name), text);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.renameSync(next, outDir);
  }

  const fileCount = items.reduce((n, i) => n + (i.files?.length ?? 0), 0);
  console.log(
    `gen-registry: ${items.length} items, ${fileCount} files -> ${path.relative(root, outDir) || "."} ` +
      `(origin ${origin}, ${cross.count} classes cross-checked${shadcn ? ", shadcn schema ok" : ""})`,
  );
}

main().catch((e) => {
  console.error(`gen-registry: ${e.message}`);
  process.exit(1);
});
