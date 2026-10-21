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
 *   node scripts/gen-registry.mjs --explain           also name the pages that ship no example, and why
 *   node scripts/gen-registry.mjs --origin URL        origin used in registryDependencies
 *                                                     (default https://littmd.vercel.app,
 *                                                     or $LITT_REGISTRY_ORIGIN, or the preview URL on Vercel)
 *
 * WHAT IT SHIPS
 *   litt          registry:style  tokens, Tailwind names and material classes, CSS only
 *   base-styles   registry:style  OPT-IN: fonts, the role weights, control radius, focus ring
 *   motion        registry:lib    src/motion/* (spring tiers, the hooks)
 *   glide         registry:lib    components/glide.tsx (the gliding highlight)
 *   <stem>        registry:ui     one per src/components/*.tsx that has a page
 *   <stem>-demo   registry:example  the first demo on the component's page, as a working component (see EXAMPLES)
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
 *   lib/litt/motion/{index,spring,tokens,device,drag}.ts(x), lib/litt/glide.tsx     the engines
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
 * EXAMPLES
 *   shadcn's MCP server answers "show me a button example" with an item named <name>-demo, and with no such item it
 *   shows whatever loosely matches (asked for button-demo, it once answered with the code block's source). So every
 *   page whose first Stage has a code demo ships it: the same function the Code tab shows (src/gallery/docs/extract.ts,
 *   transpiled on the fly), exported as the default, its imports and token names rewritten like any component's, and
 *   installed to components/litt/examples/<stem>-demo.tsx with the components it uses as registryDependencies. A demo
 *   that needs the gallery's own plumbing (the kit, the fixtures) is left out and named in the log. An example is
 *   documentation, so it is not in registry.lock.json and needs no changelog line: it carries the version of the
 *   component it shows.
 *
 * VERSIONS (CHANGELOG.md, registry.lock.json; see scripts/changelog.mjs)
 *   Every item's version is the newest release in CHANGELOG.md that names it, by date (2026.10.19). It goes into
 *   the item's meta.version and into a comment at the top of every file it installs ("// @litt/button 2026.10.19
 *   ..."), so an installed copy can say where it came from. registry.lock.json, committed, keeps a hash of what each
 *   item installs (files, CSS and dependencies, not its words) and its version. When the hash changes, the changelog
 *   must name the item in a newer release, or the build fails: nobody changes a component without telling the people
 *   who installed it. The newest release stays open, so an item it already names may change again until the next
 *   release starts. A normal run rewrites the lock (commit it with the change); --check fails when it is stale.
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
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { createHash } from "node:crypto";
import { compareVersions, itemVersions, readChangelog } from "./changelog.mjs";

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

/* Tailwind theme keys. THEME_NS is longest-first so "inset-shadow" wins over "shadow" and "font-weight" over "font". */
const THEME_NS = ["default-transition", "inset-shadow", "font-weight", "container", "spacing", "radius", "shadow", "color", "text", "ease", "font"];
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
  "font-weight": ["font"], // font-title, font-label: the role weights (P9)
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
  css['@import "@fontsource/geist-sans/400.css"'] = {};
  css['@import "@fontsource/geist-sans/500.css"'] = {};
  css['@import "@fontsource/geist-sans/600.css"'] = {};
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
function transformFile(file, targets, source) {
  const key = norm(path.relative(srcDir, file));
  let text = source ?? read(file);
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
    // Own keys only: `in` also matches Object.prototype names, and n.toLocaleString() shipped as the native function's source.
    if (ts.isIdentifier(node) && Object.hasOwn(DEFINES, node.text)) edits.push([node.getStart(sf), node.getEnd(), DEFINES[node.text]]);
    ts.forEachChild(node, defineWalk);
  };
  defineWalk(sf);

  // Overlap check, then apply.
  const sorted = [...edits].sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < sorted.length; i++) if (sorted[i][0] < sorted[i - 1][1]) fail(`${rel(file)}: two edits overlap at offset ${sorted[i][0]}`);
  text = applyEdits(text, edits);
  if (file.endsWith(".tsx")) text = `"use client";\n\n${text}`;
  // The shipped copy must still parse: a bad edit here once shipped a chart that no host could compile.
  const reparsed = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, false, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  for (const d of reparsed.parseDiagnostics ?? []) fail(`${rel(file)}: the shipped copy does not parse at ${d.start}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);

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
    description: "Optional. Loads Geist at 400, 500 and 600 and Geist Mono at 400, and applies litt's page defaults: headings and bold at the title weight, table headers at the label weight, the control radius on native controls and the litt focus ring.",
    docs: "This one restyles your whole app: the html font, heading weight, button and input radius and the focus outline. No component needs it. Skip it if you only want the components.",
  },
  motion: {
    title: "Motion",
    description: "The motion engine the components share. Hooks for the instant, responsive and expressive tiers, exits, travel and stagger, and the compact and coarse device signals, all reading litt's tokens.",
    docs: "Installed in lib/litt/motion. The components use it for you, and it needs no provider.",
  },
  glide: {
    title: "Glide",
    description: "The highlight that glides from row to row in the Menu and the Command menu.",
    docs: "Installed in lib/litt/glide.tsx. Menu and Command menu use it for you.",
  },
  button: {
    title: "Button",
    description: "Roomy and slightly rounded, with the label at the title weight, in primary, secondary and ghost, on the shared control scale. Hover and press are instant and never move the box.",
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
    docs: "Import Dialog, DialogTrigger, DialogContent and DialogClose from components/litt/dialog. Pair a form's submit with a Cancel, both at size md.",
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
    description: "A roomy, slightly rounded text field on the 32, 44 and 56 scale, with a label above and a hint or an error below. Focus and error turn the edge on the instant tier, and the box never moves.",
    docs: "Import TextField, Input and Textarea from components/litt/input. TextField wires the label, hint and error for you, and a bare Input needs an aria-label. Text is 16px on touch screens.",
  },
  select: {
    title: "Select",
    description: "One value from a short list. The trigger looks like the input, and the list is the menu's glass panel with 44px rows, a gliding highlight and a check on the current option. It stays anchored on phones.",
    docs: "Import Select or SelectField from components/litt/select. Pass options as { value, label } and a label, because a placeholder is not a label.",
  },
  switch: {
    title: "Switch",
    description: "An on or off setting. A pill track that fills with the foreground color when on, never the accent, and a thumb that slides on the instant tier.",
    docs: "Import Switch from components/litt/switch. Give it a label. Use align=\"end\" in a settings list so the switches line up at the row's end.",
  },
  slider: {
    title: "Slider",
    description: "A value on a range, such as an animation speed, or a span with two thumbs, such as builds that took 20s to 80s. A thin rail, a foreground range and round thumbs that follow the pointer one to one, with words for the two ends. The thumbs of a range never cross, and a form sends both values under one name.",
    docs: "Import Slider, or RangeSlider for a span, from components/litt/slider. Give it a label, and minLabel and maxLabel to say which way is which. A range value is [from, to], and each thumb is named by the label and its end.",
  },
  form: {
    title: "Form",
    description: "The pieces that turn fields into a page: settings sections, fieldsets, an error summary that takes focus and links to each field, and the action row.",
    docs: "Import FormSection, Fieldset, ErrorSummary and FormActions from components/litt/form. The fields themselves come from input, select, checkbox, switch and slider.",
  },
  checkbox: {
    title: "Checkbox and radio",
    description: "Real checkboxes and radios drawn in the litt look, with the label on the right and the whole row clickable. A group is a fieldset with a legend, and a select-all box can show the mixed state.",
    docs: "Import Checkbox, CheckboxGroup, Radio and RadioGroup from components/litt/checkbox. They are native inputs, so name and value work in a form. Pass appearance=\"native\" for the browser's own 16px box.",
  },
  segmented: {
    title: "Segmented control",
    description: "A short choice of two to five options in one track. The selected surface glides to your pick, and the control is built from native radios, so the arrow keys work.",
    docs: "Import Segmented from components/litt/segmented. Give it a legend, a value, onValueChange and options. In a form, pass showLegend and block.",
  },
  tag: {
    title: "Tag",
    description: "A small label at the control radius that names a thing or reports its state. A status tag colors its text, never the fill, and always says the status in words.",
    docs: "Import Tag from components/litt/tag. Leave status out for a plain label, or set it to success, warning, danger or neutral: the text takes that color and there is no dot, so the word carries the status.",
  },
  popover: {
    title: "Popover",
    description: "A floating glass panel for a small form, a share link or a detail card. It grows from its trigger's corner, slides in from the side it really opens on, and flips near an edge.",
    docs: "Import Popover, PopoverTrigger, PopoverContent and PopoverClose from components/litt/popover. It turns solid when its trigger sits inside glass.",
  },
  header: {
    title: "Glass header",
    description: "A sticky glass bar with a wordmark, a nav and your actions. The page blurs under it as it scrolls, and on a narrow bar the links fold behind a menu button instead of squeezing.",
    docs: "Import Header from components/litt/header. Pass a wordmark, links with a current flag and your actions. It needs no router and no provider; pass renderLink and onNavigate to use yours.",
  },
  card: {
    title: "Card",
    description: "A raised surface for one object that links somewhere. A linked card is one real link stretched over the whole card, and hover moves the fill one step, with no lift, growth or scale.",
    docs: "Import Card, CardCover, CardBody, CardTitle, CardDescription and CardLink from components/litt/card. Put CardLink around the title to make the card a link. Anything else you can press inside it needs relative.",
  },
  table: {
    title: "Table",
    description: "A table with real semantics, hairline rows, mono figures and a sticky header. It scrolls inside its own region on a phone, and its rows can arrive in one staggered cascade, sort, filter and insert.",
    docs: "Import Table, TableHeader, TableBody, TableRow, TableHead and TableCell from components/litt/table. Give the Table a label, and a max height such as max-h-96 if you want the header to stick. The entrance is off until you pass entrance.",
  },
  stat: {
    title: "Stat",
    description: "A number tile for one figure: a small label, the value large in the sans with tabular numbers, and an optional change in words. Green and red are for good and bad news only. A group of tiles measures its own width.",
    docs: "Import Stat and StatGroup from components/litt/stat. Say the direction in the delta's words, and set tone to good, bad or neutral for whether it is news. Put the tiles in a StatGroup: two across, four across from 40rem.",
  },
  chart: {
    title: "Chart",
    description: "Bar, line and stacked charts in plain SVG, and a meter. The marks are never the accent: the quiet foreground by default, one series at 55% with the current mark full or up to three stepping down, or up to five data hues when color tells the series apart. The stacked chart draws each category's parts as one thin rail, a hue per series, with the total in the tooltip. Hairline gridlines, mono labels, a tooltip on hover and focus, and one entrance on the responsive tier.",
    docs: "Import BarChart, LineChart, StackedBarChart and Meter from components/litt/chart. Pass a label, the category labels and series of { name, values }, with an optional hue per series or hues on the chart. The chart measures its container, so give it a width. Every chart ships a hidden table and a summary for screen readers.",
  },
  "app-shell": {
    title: "App shell",
    description: "The frame around an app's pages: a 240px sidebar that runs the full height of the page with its links kept in view, and a main area. On a phone the sidebar goes, a glass top bar holds a menu button, and the nav opens in the bottom sheet.",
    docs: "Import AppShell, SidebarNav and SidebarLink from components/litt/app-shell. Pass a wordmark, a nav and the page. Mark the current link with current. It needs no router: pass as={Link} to a SidebarLink to use yours.",
  },
  pagination: {
    title: "Pagination",
    description: "Previous and next for a table that shows one page of many. The range comes first, in words and mono, like 21 to 40 of 143. Page numbers show only when the row is wide enough, and the buttons at either end disable.",
    docs: "Import Pagination from components/litt/pagination. Hold the page in state and pass page, pageSize, total and onPageChange. Give it a label that says what is paged.",
  },
  states: {
    title: "Empty and loading states",
    description: "What a view says when it has nothing yet, is waiting or has failed. Empty offers one action, a skeleton keeps the content's exact size, and an error says what went wrong and how to retry.",
    docs: "Import Empty, Skeleton, Loading and ErrorState from components/litt/states. Wrap Skeleton blocks in Loading, so a screen reader hears what is loading once.",
  },

  /* The data-color step (v0.11). Each entry is owned by the agent that builds the item; keep the order. */
  avatar: {
    title: "Avatar",
    description: "A round mark for a person, a client or a company, in three sizes: a photo, or initials on the tint of one of the five data hues, picked from the name so the same name always gets the same color. A group overlaps them with a ring in the surface they sit on, and counts the rest in a +N pill.",
    docs: "Import Avatar and AvatarGroup from components/litt/avatar. Pass a name: the initials and the hue come from it unless you set a hue. Set decorative when the name is written beside the avatar. Give AvatarGroup a label, the first few avatars and a total, and match its ring to the surface it sits on.",
  },
  callout: {
    title: "Callout",
    description: "An inline note in the page flow: a tip, a heads-up or a result to act on. A raised surface with a 16px icon, a title, a line of detail, and an optional action and close button. Only the icon takes the status color, and a hidden word before the title says the same thing, so there is never a rail, a tinted fill or a colored border. It measures its own width and drops the action below the text under 28rem.",
    docs: "Import Callout from components/litt/callout. Pass a title, a description and a tone, and an action (an sm Button or a Kbd) or onDismiss when there is something to do. Set live for a callout that appears after an action. It fills the width of its container, so give the container a width.",
  },
  timeline: {
    title: "Timeline",
    description: "The steps of a run in order, such as a deploy: when each started, a status icon on a hairline rail, the label and how long it took, grouped into phases. In a proportional timeline long steps draw their time as a bar in the phase's data hue, with the last run beside it. A strip shows the whole run at a glance.",
    docs: "Import Timeline, TimelinePhase, TimelineStep, TimelineResult and TimelineBar from components/litt/timeline. Put steps in phases, give each step an at, a label, a status and its seconds, and close with a TimelineResult. Feed TimelineBar the same data as the list, and keep it beside the list.",
  },
  "dot-plot": {
    title: "Dot plot",
    description: "A distribution drawn as stacks of dots, mirrored about a center line, so you see where most values fall. With a goal, dots inside it take a data hue and the rest stay gray; the median is a line, an outlier can be named, and the legend gives the shares in numbers.",
    docs: "Import DotPlot from components/litt/dot-plot. Pass a label, the values, a scale (log for durations) and a formatValue. Add a goal to split the dots, markers to name outliers. It measures its container, so give it a width. Each non-empty column is reachable with the arrow keys.",
  },
  heatmap: {
    title: "Heatmap",
    description: "A dot matrix whose depth says how much: usage per day in a month, deploys per day over a year, mail per hour of the week. One data hue in four steps over an empty dot, row labels and totals in mono, a tooltip on hover, touch and focus, and a legend from less to more. A wide grid scrolls sideways inside its own box.",
    docs: "Import Heatmap from components/litt/heatmap. Pass a label, rows of { label, values, total? } and columns that name each column, and pick a hue. Use null for a day with no data. The dots are a grid you can arrow through.",
  },
  gauge: {
    title: "Gauge",
    description: "One value against a range on a semicircle of fine ticks, with the label, the figure and a caption in the opening. The ticks up to the value take the foreground or one data hue, and the last, longer tick marks the value. Static, like the meter.",
    docs: "Import Gauge from components/litt/gauge. Pass a label, a value, a max and a value text (what a screen reader hears); add a figure, a caption or a hue. It scales down to its container.",
  },
  "bar-list": {
    title: "Bar list",
    description: "A ranked list where each row carries a thin bar for its share: top pages, most-used shortcuts, busiest repos. An optional lead, a label, a 4px rail, a mono value and a change in words. The bars line up across rows, and under 28rem the bar moves under the label.",
    docs: "Import BarList from components/litt/bar-list. Pass a label and items of { label, value }, plus a unit for screen readers. A row with an href is a link, and with onSelect the others are buttons.",
  },
  "token-input": {
    title: "Token input",
    description: "A field that collects short values as removable tokens: recipients, sender domains, tags. Enter, a comma or blur adds what you typed, a pasted list is split, and Backspace or the x removes one. The Input's own size, edge, label and focus ring, with the Tag's look inside. A long list folds into a +N token until the field is focused.",
    docs: "Import TokenInput from components/litt/token-input. Give it a label and hold the values in state with value and onValueChange, or pass a defaultValue. Add validate to reject a value with a message, max to cap the list, collapseAfter to fold it, and name to post every value with a form.",
  },
  pad: {
    title: "Pad",
    description: "Two values set at once on one surface, like a reply's tone against its length. A well with a static dot grid, a round thumb with dashed crosshairs, a dashed circle for the default, and a tooltip that says the value in words. It is the Slider in two dimensions, in the foreground and never the accent.",
    docs: "Import Pad from components/litt/pad. Give it a label, an x and a y axis ({ label, min, max, step, minLabel, maxLabel }), and hold the value in state with value and onValueChange. Pass defaultMark to show the default and formatValue to say the value in words. Each axis is a range input for the keyboard and screen readers, and the arrow keys move it.",
  },
  /* The rails step: a data hue drawn as a thin line. Each entry is owned by the agent that builds the item. */
  breakdown: {
    title: "Breakdown",
    description: "One whole split into its parts: a thin split rail with a segment per part in the data hues, then a row per part with its own 4px rail, a label and a mono reading, or a small legend for a tile. Storage by file type, credits by feature.",
    docs: "Import Breakdown from components/litt/breakdown. Pass a label, the parts as { label, value } largest first, and the total when there is free space. Past five parts the rest fold into Other. Pin a hue on a part to keep a kind's color across a page.",
  },
  /* The growth step: more data views in the rail idiom, and a legend that filters. */
  funnel: {
    title: "Funnel",
    description: "How many went on at each step, as rows rather than a trapezoid: a thin 4px rail per step filled to its share of the first, in one data hue, with the label and a mono reading beside it, and between two steps a quiet line that says in words how many went on (\"38% continued\"). The header ends with the overall conversion. Static. Visited, signed up, activated, paid.",
    docs: "Import Funnel from components/litt/funnel. Pass a label and the steps as { label, value } in the order people go through them. Every rail is measured against the first step. hue picks the one data hue (blue by default), unit or formatValue writes the numbers, overallText replaces \"4.1% overall\", and formatStep(value, previous) rewrites the line between steps.",
  },
  "cohort-grid": {
    title: "Cohort grid",
    description: "Retention by signup week as a real table: a row per cohort, a column per period since signup, and in every cell the number in mono with a dot before it in one data hue's four steps. Younger cohorts have fewer periods and their empty cells draw nothing. An optional row sums up every cohort, weighted by size. The cohort column stays put while the periods scroll sideways inside the grid's own box. Static, with a legend from less to more.",
    docs: "Import CohortGrid from components/litt/cohort-grid. Pass a label and cohorts as { label, size, values }, oldest first. Each value is the share still active (0 to 100), or a count with valueType=\"count\", and a missing or null value is a period the cohort has not reached. Set periodLabel=\"Month\" or pass periods for other headers. Add average for an All cohorts row and pick a hue.",
  },
  legend: {
    title: "Legend",
    description: "Toggles which series a chart shows: a wrapping row of buttons, each a 12 by 4px hued rail swatch, the name and an optional mono reading, pressed while its series shows. Hidden turns the swatch to the grey track and the name to the subtle ink. The last shown series cannot be hidden.",
    docs: "Import Legend and legendHues from components/litt/legend. Pass a label and the items as { name, hue?, value? } in the chart's order, five at most. Control it with hidden and onHiddenChange, or start it with defaultHidden. Pass the chart only the shown series, each with hue: legendHues(items)[name], so a series keeps its color when another is hidden, and turn the chart's own legend off with legend={false}. Alt with a click or Enter shows only that series.",
  },
  sparkline: {
    title: "Sparkline",
    description: "A trend in one thin line, with no axes, gridlines or labels: a 2px line in the foreground or a data hue, a dot on the latest value and an optional dashed baseline. For a stat tile, a table cell or a list row. It shows shape, not values.",
    docs: "Import Sparkline from components/litt/sparkline. Pass a label and the values, oldest first. It fills its container's width, so give a table cell a wrapper with a width, and fix min and max so rows compare. Put the exact figure beside it. Stat takes one in its trend prop.",
  },
  spread: {
    title: "Spread",
    description: "How values spread, one thin rail per row on a shared scale: the full range faint, the middle half in a data hue, the median as a tick and in mono at the end. Build times by site, reply times by client. A row gives its values or its quartiles, a goal is a dashed line through every rail, and under 28rem the label moves above its rail. Static, with a legend in words.",
    docs: "Import Spread from components/litt/spread. Pass a label and items of { label, values } or { label, min, p25, median, p75, max }, and a formatValue that includes the unit. Rows share one scale (linear or log, with an optional domain and ticks) and an optional goal. It fills its container's width, so give the container a width.",
  },
  /* The agents step: chat, thinking and tool calls. Each entry is owned by the agent that builds the item. */
  message: {
    title: "Message",
    description: "A chat between a person and an agent. The agent's words sit on the page with no bubble, and the person's turn is a raised bubble on the right. MessageText styles what a markdown renderer produces, with no library: paragraphs, lists, accent links, inline code, a quiet pre and quotes with no rail. MessageActions puts Copy and Retry under a finished answer, and a turn that stopped says so with a Retry button. The conversation scrolls on its own in a column up to 48rem, follows the newest line while an answer streams, and offers Jump to latest once you scroll up.",
    docs: "Import Conversation, Message, MessageText and MessageActions from components/litt/message. Give the Conversation a label and a height, and mark it busy while the agent answers. Inside it put a Message with from=\"user\" for the person's turn, and a Message for the agent's, holding a MessageText (your markdown renderer's output goes inside it) and actions={<MessageActions copyText onRetry />}. Pass streaming while the text arrives, and error with onRetry for a turn that stopped.",
  },
  composer: {
    title: "Composer",
    description: "Where the person writes to an agent: a box on surface-1 with the Input's edge, a text field that grows a line at a time to eight rows, file chips, a toolbar for your controls and a round Send that turns into Stop while the agent answers. Send is the view's one accent fill. Enter sends, Shift+Enter starts a line, Esc stops, and Enter never sends mid-composition. Attach, paste and drop add files, suggestions fill the field, and a count shows near maxLength. FileChip is exported for a message that was already sent.",
    docs: "Import Composer (and FileChip) from components/litt/composer. Hold the files yourself and pass onSend, streaming and onStop: the field clears after a send, and Send becomes Stop while streaming is true. Pass onFiles to show Attach and take pastes and drops, files and onRemoveFile to draw the chips, tools for a model Select at sm, suggestions for an empty chat, hint for a line under the box, and maxLength for the count. On a touch screen Return adds a line and Send sends by itself (enterSends overrides it); keep the composer above the keyboard with useVisibleScreen.",
  },
  thinking: {
    title: "Thinking",
    description: "The agent's reasoning as a quiet disclosure above its answer: a row with a chevron, \"Thinking\" and a clock that counts whole seconds, never a shimmer, a pulse or a spinner, then \"Thought for 12s\". The reasoning sits under it in the quiet text tone with no box. It is open while the agent thinks and closes itself when it stops, unless the reader toggled it.",
    docs: "Import Thinking from components/litt/thinking. Pass active while the agent thinks and the reasoning as children: the clock counts from when active turned true. For a thought loaded from history leave active off and pass duration in seconds. open, defaultOpen and onOpenChange control it, and label replaces the words.",
  },
  "tool-call": {
    title: "Tool call",
    description: "What an agent did, one row per call: a status mark (a still half circle while it runs, never a spinner), the action in words, the target in mono cut at the end, and the time. A call with an input or an output opens them under it. A group folds a run of calls and closes itself when they finish, and an approval asks first on a raised panel with Allow as the accent fill and Deny beside it, then becomes a row that says what was chosen.",
    docs: "Import ToolCall, ToolCallGroup and ToolApproval from components/litt/tool-call. Give a call a status, an action and a target, plus an input or an output to make it open. Pass running to a group, and hold decision in state for an approval, setting it in onAllow and onDeny. Keep an approval outside a group, and disable your Send while it waits so the view holds one accent fill.",
  },
  plan: {
    title: "Plan",
    description: "An agent's steps for a task, ticked off as it works: the label and a mono count (\"3 of 7\") over a 4px rail in the foreground, then an ordered list of steps, each with a 16px status mark. The running step is a half-filled circle that never spins, a done step steps its color back and is never struck through, a failed step has a danger x and says Failed, a skipped one is a dashed circle that says Skipped, and any step can carry a detail line. A polite live region says which step started and when the plan is done. Statuses swap at once, and a step added later fades in.",
    docs: "Import Plan from components/litt/plan. Pass a label and steps of { id, label, status, detail? }, with status one of pending, running, done, failed or skipped. Hold the steps in state and change a status in place as the agent works, and give every step a stable id so only a step you add later fades in. The count is the done steps over all steps, and failed and skipped steps do not count. It fills its container and has no card, so put it in a turn or in a panel you draw.",
  },
  "code-block": {
    title: "Code block",
    description: "Code in an answer, a tool's output or a diff: mono on a quiet surface with a 32px header that holds the file name and a Copy button. tsx, ts, jsx and js are highlighted in the foreground's tones only (strings take a hint of the accent text), a diff shows a + in success and a - in danger on a faint band with hidden \"Added\" and \"Removed\" words, line numbers sit in a gutter that is not selected or copied, and long lines scroll sideways inside a focusable, labelled block. Static.",
    docs: "Import CodeBlock from components/litt/code-block. Pass the code, a lang (tsx, ts, jsx, js, diff, shell or text) and a filename for the header. The label names the scroll area and defaults to the file name. lineNumbers adds a gutter, wrap wraps long lines, and maxHeight (a number or a CSS length) makes a tall block scroll. A diff reads each line's first character as its sign. The syntax colors are declared on the block itself, so it needs no stylesheet. It imports sugar-high.",
  },
  /* The staples step (proposals/staples.md). Each entry is owned by the agent that builds the
     item; the lead checks every docs line against the finished component. */
  combobox: {
    title: "Combobox",
    description: "Type to find one value, or several, in a long list: a client, a framework, a teammate. The Input's field with the Menu's glass list under it: filtered as you type, ignoring case and accents, with the first match lit, one gliding highlight, a check on each pick and optional group labels. With multiple the picks sit in the field as removable tokens. Solid inside a dialog, and anchored under the field on a phone.",
    docs: "Import Combobox from components/litt/combobox. Give it a label and options as { value, label, disabled?, group? } or groups of { label, options }, and hold the value in state with value and onValueChange: a string (\"\" for none), or an array with multiple. Add hint, error and placeholder as on a field, and name to post the value with a form.",
  },
  "color-picker": {
    title: "Color picker",
    description: "One color as a hex string: a saturation and brightness area, a hue rail, the hex in mono, an eyedropper where the browser has one, and optional swatches as radios. A field in the Select trigger's look opens it in a popover, a bottom sheet on a phone. The thumbs follow the pointer and the keys at once, and every input says the color in words.",
    docs: "Import ColorPicker and ColorPanel from components/litt/color-picker, plus parseHex, describeColor, getContrastInk, hexToHsv and hsvToHex. Values are six-digit lowercase hex strings with the hash. ColorPicker needs a label; hold the value in state with value and onValueChange (null for none), pass name for a form, and swatches as { label, value }. Save with onValueCommit, which fires on release. Use getContrastInk for text drawn on the picked color.",
  },
  "date-picker": {
    title: "Date picker",
    description: "A day or a range from a month calendar, as YYYY-MM-DD strings. A field in the Select trigger's look opens the calendar in a popover, a bottom sheet on a phone, with optional presets. Day numbers in mono, the picked day filled with the foreground, today ringed, six weeks always, the full date-grid keyboard, and months that slide in from the side they come from.",
    docs: "Import DatePicker and Calendar from components/litt/date-picker, plus getToday, addDays and getWeekday for date math on YYYY-MM-DD strings. Values are YYYY-MM-DD strings, or { start, end } with mode=\"range\". DatePicker needs a label; hold the value in state with value and onValueChange, and pass name for a form (a range sends name-start and name-end). min, max and isDisabled rule days out; presets take { label, value }.",
  },
  accordion: {
    title: "Accordion",
    description: "Sections that open in place, split by hairlines: 56px triggers in headings with a chevron that turns half a turn, one section open at a time or several. The height snaps, the content fades in and drops a little, and the rows below move by transform, so the page never jumps.",
    docs: "Import Accordion, AccordionItem, AccordionTrigger and AccordionContent from components/litt/accordion. Give each AccordionItem a unique value and put an AccordionTrigger and an AccordionContent in it. Use type=\"multiple\" to let several stay open (the value is then a list), defaultValue or value with onValueChange for the open state, and headingLevel to fit the page's outline.",
  },
  "scroll-area": {
    title: "Scroll area",
    description: "A region that scrolls inside the page: native scrolling with litt's 6px thumb, shown while it scrolls or a mouse is over it, and a hairline on any edge with more beyond it. While it scrolls it is a labelled Tab stop with an inset focus ring. No gradient fades.",
    docs: "Import ScrollArea from components/litt/scroll-area. Pass a label and give it a height (or a max height) in className; set orientation to \"horizontal\" or \"both\" to scroll sideways. Pass viewportRef to read or set the scroll position.",
  },
  breadcrumb: {
    title: "Breadcrumb",
    description: "Where a page sits, with a slash between the levels and the current page in the foreground. Past four levels the middle folds into a round ghost button that opens the Menu, and phones show the last two levels. No motion of its own.",
    docs: "Import Breadcrumb from components/litt/breadcrumb. Pass items as { label, href }, the last one being the current page. Pass renderLink and onNavigate to route with your router, and maxVisible to change where the trail folds.",
  },
  "context-menu": {
    title: "Context menu",
    description: "The Menu at the pointer: a right-click, Shift+F10 or a 500ms hold on touch. The same glass, rows, gliding highlight and solid submenus as the Menu, grown from the pointer's corner, and on a phone a submenu that replaces the list in place.",
    docs: "Import ContextMenu from components/litt/context-menu and fill it with the Menu's rows from components/litt/menu. Pass the target element as trigger and a label. Every action in it must also be reachable another way, such as a Menu on the row.",
  },
};

/* ======================================================================== examples */

const pagesDir = path.join(srcDir, "gallery", "pages");
const examplesDir = path.join(componentsDir, "examples"); // virtual: nothing is written there

/** extract.ts has no imports, so a plain transpile runs it under Node (gen-llms.mjs loads copy-prompt.ts the same way). */
async function loadExtract() {
  const src = read(path.join(srcDir, "gallery", "docs", "extract.ts"));
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "litt-registry-"));
  const tmp = path.join(dir, "extract.mjs");
  fs.writeFileSync(tmp, js);
  try {
    return await import(pathToFileURL(tmp).href);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * One demo per component page: [{ stem, page, name, file, text }] for the examples, and [{ page, why }] for the pages
 * left out. `file` is a path under src/components/examples that does not exist; transformFile gets the text instead.
 */
function collectDemos(extractDemo) {
  const demos = [];
  const skipped = [];
  for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith(".tsx")).sort()) {
    const src = read(path.join(pagesDir, f));
    const stem = /export const docs[^=]*=\s*\{\s*components:\s*\[\s*"([\w-]+)"/.exec(src)?.[1];
    if (!stem || !docs[stem]) continue;
    const name = /<Stage\b[^>]*?\bcode="(\w+)"/s.exec(src)?.[1];
    if (!name) {
      skipped.push({ page: f, why: "its first stages have no code demo" });
      continue;
    }
    if (demos.some((d) => d.stem === stem)) continue; // one example per component, from its first page
    let code;
    try {
      code = extractDemo(src, name, f);
    } catch (e) {
      skipped.push({ page: f, why: e.message });
      continue;
    }
    /* The kit is dropped from the extract. If the demo reaches for any of its names, the example would not compile. */
    const kitNames = [.../import\s*\{([^}]*)\}\s*from\s*"\.\.\/kit"/.exec(src)?.[1].split(",") ?? []]
      .map((x) => x.trim().replace(/^type\s+/, ""))
      .filter((x) => x && !/^(?:Page|Stage|TryIt)$/.test(x));
    const usesKit = kitNames.find((k) => new RegExp(`\\b${k}\\b`).test(code));
    if (usesKit) {
      skipped.push({ page: f, why: `${name} uses ${usesKit} from the gallery kit` });
      continue;
    }
    const outside = [...code.matchAll(/from\s+"((?:\.{1,2}\/|@\/)[^"]+)"/g)].map((m) => m[1]).find((spec) => !/^@\/(?:components|motion)(?:\/|$)/.test(spec));
    if (outside) {
      skipped.push({ page: f, why: `${name} imports ${outside}, which does not ship` });
      continue;
    }
    const exported = code.replace(new RegExp(`^function ${name}\\(`, "m"), `export default function ${name}(`);
    if (exported === code) {
      skipped.push({ page: f, why: `${name} is not a plain function declaration` });
      continue;
    }
    const file = path.join(examplesDir, `${stem}-demo.tsx`);
    demos.push({ stem, page: f, name, file, text: exported + "\n" });
  }
  return { demos, skipped };
}

/* =============================================================== assemble the items */

const SCHEMA_URL = "https://ui.shadcn.com/schema/registry-item.json";
const urlOf = (name) => `${origin}/r/${name}.json`;
const ITEM_TYPE = { motion: "registry:lib", glide: "registry:lib" };

function build(demos = []) {
  // 1. Which files ship, and where.
  const componentFiles = stems.map((s) => path.join(componentsDir, `${s}.tsx`));
  for (const f of componentFiles) if (!fs.existsSync(f)) fail(`docs.json lists "${path.basename(f, ".tsx")}", but ${rel(f)} does not exist. Run npm run gen:docs.`);
  const onDisk = fs.readdirSync(componentsDir).filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4)).sort();
  if (onDisk.join() !== stems.join()) fail(`docs.json is stale: it has [${stems}] and src/components has [${onDisk}]. Run npm run gen:docs.`);
  const motionFiles = ["index.tsx", "spring.ts", "tokens.ts", "device.ts", "drag.ts"].map((f) => path.join(motionDir, f));
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
    dependencies: ["@fontsource/geist-sans", "@fontsource/geist-mono"],
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
  // examples: the first demo of each component page
  for (const demo of demos) {
    const target = `components/litt/examples/${demo.stem}-demo.tsx`;
    targets.set(demo.file, target);
    const t = transformFile(demo.file, targets, demo.text);
    transformed.set(demo.file, t);
    const deps = new Set();
    const pkgs = new Set();
    for (const imp of t.imports) {
      if (imp.file) deps.add(itemOf(imp.file));
      else if (!["react", "react-dom"].includes(packageOf(imp.spec))) pkgs.add(packageOf(imp.spec));
    }
    const registryDependencies = [...(t.usesLitt ? ["litt"] : []), ...[...deps].sort()].map(urlOf);
    const pageId = demo.page.replace(/^\d+-/, "").replace(/\.tsx$/, "");
    items.push(base({
      name: `${demo.stem}-demo`,
      type: "registry:example",
      title: `${COPY[demo.stem].title} example`,
      description: `A working ${COPY[demo.stem].title.toLowerCase()}: ${demo.name}, the first demo on its page (${PRODUCTION_ORIGIN}/#${pageId}). It installs the components it uses.`,
      ...(pkgs.size ? { dependencies: [...pkgs].sort() } : {}),
      ...(registryDependencies.length ? { registryDependencies } : {}),
      files: [{ path: `registry/litt/examples/${demo.stem}-demo.tsx`, type: "registry:example", content: t.text, target }],
      docs: `Import ${demo.name} from components/litt/examples/${demo.stem}-demo, or read it for how @litt/${demo.stem} is used. ${COPY[demo.stem].docs}`,
      meta: { of: demo.stem },
    }));
  }
  return { items, targets, transformed };
}

/* ========================================================================= versions */

const lockFile = path.join(root, "registry.lock.json");
const CHANGELOG_URL = `${PRODUCTION_ORIGIN}/changelog.md`;

/** What an item installs, as a stable hash: files, CSS and dependencies. Its title, description and docs are not part of it. */
function installHash(item) {
  const nameOf = (url) => url.slice(url.lastIndexOf("/") + 1).replace(/\.json$/, "");
  const shape = {
    type: item.type,
    dependencies: item.dependencies ?? [],
    registryDependencies: (item.registryDependencies ?? []).map(nameOf),
    cssVars: item.cssVars ?? null,
    css: item.css ?? null,
    files: (item.files ?? []).map((f) => ({ target: f.target, type: f.type, content: f.content })),
  };
  return createHash("sha256").update(JSON.stringify(shape)).digest("hex").slice(0, 16);
}

/** The comment that opens every installed file. */
const stampOf = (name, version) => `// @litt/${name} ${version}. What changed: ${CHANGELOG_URL}`;

/**
 * Give every item its version, check it against the lock, and stamp it. Returns the lock to write and any errors.
 * Runs before the verifier, so the verifier sees the stamped files.
 */
function versionItems(items) {
  const errs = [];
  let changelog;
  try {
    changelog = readChangelog();
  } catch (e) {
    return { errs: [e.message], lock: null };
  }
  let versions;
  try {
    versions = itemVersions(changelog, items.filter((i) => i.type !== "registry:example").map((i) => i.name));
  } catch (e) {
    return { errs: [e.message], lock: null };
  }
  const released = new Map(changelog.releases.map((r) => [r.version, r.date]));
  const latest = changelog.releases[0].version;
  const old = fs.existsSync(lockFile) ? JSON.parse(read(lockFile)) : { items: {} };
  const lock = {};
  for (const item of items) {
    if (item.type === "registry:example") {
      /* Documentation, not a component: no lock entry, the version of the component it shows. */
      const version = versions.get(item.meta.of);
      item.meta = { version, released: released.get(version), changelog: CHANGELOG_URL, example: `@litt/${item.meta.of}` };
      for (const f of item.files) f.content = f.content.replace(/^"use client";\n/, `"use client";\n// @litt/${item.name}, an example for @litt/${item.meta.example.slice(6)} ${version}. What changed: ${CHANGELOG_URL}\n`);
      continue;
    }
    const version = versions.get(item.name);
    const hash = installHash(item);
    const before = old.items?.[item.name];
    if (before && compareVersions(version, before.version) < 0) {
      errs.push(`${item.name}: registry.lock.json has it at ${before.version}, but the newest CHANGELOG.md entry that names it is ${version}. Put its entry back.`);
    } else if (before && before.hash !== hash && compareVersions(version, before.version) === 0 && version !== latest) {
      // The newest release stays open: an item it already names can change again until the next release starts.
      errs.push(`${item.name}: what it installs changed since ${before.version}, but CHANGELOG.md has no newer entry for it. Add one under today's release ("- **changed** \`${item.name}\`: ..."), then run npm run gen:registry and commit registry.lock.json.`);
    }
    lock[item.name] = { version, hash };
    item.meta = { version, released: released.get(version), changelog: CHANGELOG_URL };
    for (const f of item.files ?? []) {
      const stamp = stampOf(item.name, version);
      f.content = f.content.startsWith('"use client";\n') ? `"use client";\n${stamp}\n${f.content.slice('"use client";\n'.length)}` : `${stamp}\n${f.content}`;
    }
  }
  const sorted = Object.fromEntries(Object.keys(lock).sort().map((k) => [k, lock[k]]));
  return { errs, lock: { $comment: "Written by scripts/gen-registry.mjs. What each registry item installs, hashed, and the release that last changed it. Commit it with the change.", latest: changelog.releases[0].version, items: sorted } };
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

  // A component may keep variables of its own: ones a shipped file declares as an arbitrary property
  // ([--cmd-list-max:none]) or a style key ("--x": ...). Another file may read them when its item depends on the
  // declaring item, so the host always has both (the popover reads the dialog's --sheet-foot). Litt tokens are not
  // local: they must come from the shipped CSS.
  const localVars = (text) =>
    [...text.matchAll(/\[(--[a-zA-Z][\w-]*):/g), ...text.matchAll(/["'](--[a-zA-Z][\w-]*)["']\s*:/g)].map((m) => m[1]).filter((n) => !n.startsWith("--litt-"));
  const itemByName = new Map(items.map((i) => [i.name, i]));
  const depsOf = (item, seen = new Set()) => {
    if (seen.has(item.name)) return seen;
    seen.add(item.name);
    for (const url of item.registryDependencies ?? []) {
      const dep = itemByName.get(url.split("/").pop().replace(/\.json$/, ""));
      if (dep) depsOf(dep, seen);
    }
    return seen;
  };
  const localsOf = (item) => new Set([...depsOf(item)].flatMap((n) => (itemByName.get(n).files ?? []).flatMap((f) => localVars(f.content))));

  for (const item of items) {
    const local = localsOf(item);
    for (const file of item.files ?? []) {
      const where = `${item.name} ${file.target}`;
      const text = file.content;
      unprefixedVarRe.lastIndex = 0;
      const stray = [...text.matchAll(unprefixedVarRe)].map((m) => m[0]);
      if (stray.length) bad(where, `unprefixed litt custom property survives: ${[...new Set(stray)].join(", ")}`);
      /* An example's text is a page's words too ("git push --force"), so it is read only where CSS reads a property. */
      const varRe = item.type === "registry:example" ? /(?:var\(\s*|\(|["'`])(--[a-zA-Z][\w-]*)/g : /(?<![\w-])(--[a-zA-Z][\w-]*)/g;
      const names = new Set([...text.matchAll(varRe)].map((m) => m[1]));
      for (const n of names) {
        if (ALLOWED_FOREIGN_VARS.some((re) => re.test(n))) continue;
        if (local.has(n)) continue;
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
  const { extractDemo } = await loadExtract();
  const { demos, skipped } = collectDemos(extractDemo);
  const { items, targets, transformed } = build(demos);
  const versioned = versionItems(items);
  if (versioned.errs.length) {
    console.error(`gen-registry: ${versioned.errs.length} version problem${versioned.errs.length === 1 ? "" : "s"}:`);
    for (const e of versioned.errs) console.error(`  - ${e}`);
    process.exit(1);
  }
  const errs = verify(items, targets, transformed, shadcn);
  const cross = await tailwindCrossCheck(items);
  errs.push(...cross.errs);
  if (errs.length) {
    console.error(`gen-registry: ${errs.length} problem${errs.length === 1 ? "" : "s"}:`);
    for (const e of errs) console.error(`  - ${e}`);
    process.exit(1);
  }

  const files = serialize(items);
  const lockText = JSON.stringify(versioned.lock, null, 2) + "\n";
  const lockStale = !fs.existsSync(lockFile) || read(lockFile) !== lockText;
  if (check && lockStale) {
    console.error("gen-registry: registry.lock.json is stale. Run npm run gen:registry and commit it.");
    process.exit(1);
  }
  // Only the real registry keeps the lock; the install test builds elsewhere with --out.
  if (!check && lockStale && !option("--out")) fs.writeFileSync(lockFile, lockText);
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

  if (flag("--explain")) for (const sk of skipped) console.log(`  no example: ${sk.page}: ${sk.why}`);
  const fileCount = items.reduce((n, i) => n + (i.files?.length ?? 0), 0);
  console.log(
    `gen-registry: ${items.length} items, ${fileCount} files -> ${path.relative(root, outDir) || "."} ` +
      `(${demos.length} examples, ${skipped.length} pages without one; origin ${origin}, ${cross.count} classes cross-checked${shadcn ? ", shadcn schema ok" : ""}, release ${versioned.lock.latest}${lockStale && !check && !option("--out") ? ", registry.lock.json updated" : ""})`,
  );
}

main().catch((e) => {
  console.error(`gen-registry: ${e.message}`);
  process.exit(1);
});
