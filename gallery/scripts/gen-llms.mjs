#!/usr/bin/env node
/**
 * The gallery's docs as Markdown, for coding agents. Writes into public/ (gitignored), which Vite copies into the build:
 *
 *   public/docs/<page>.md   one per docs page: install, usage, use and skip, props, keyboard, accessibility, motion
 *   public/llms.txt         what litt is, how to install it, and a link to every page (llmstxt.org)
 *   public/llms-full.txt    every docs page in one file
 *   public/changelog.md     gallery/CHANGELOG.md as it is
 *
 * Served at https://littmd.vercel.app/docs/button.md, /llms.txt, /llms-full.txt and /changelog.md. The gallery routes by
 * hash (/#button), which cannot take a .md suffix, so the Markdown pages have paths of their own.
 *
 *   node scripts/gen-llms.mjs            write them
 *   node scripts/gen-llms.mjs --check    fail if they are missing or stale
 *
 * Nothing is written twice. A page's words come from its own `export const meta` and `export const docs` (read as plain
 * object literals, as the page-meta plugin in vite.config.ts reads meta), the props from src/generated/docs.json
 * (gen-docs.mjs), the versions from registry.lock.json (gen-registry.mjs), and the install and usage lines from the same
 * functions the Copy prompt uses (src/gallery/docs/copy-prompt.ts, transpiled on the fly). So prebuild and verify run it
 * after gen-registry.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagesDir = path.join(root, "src", "gallery", "pages");
const publicDir = path.join(root, "public");
const check = process.argv.includes("--check");
const ORIGIN = "https://littmd.vercel.app";
const REPO = "https://github.com/litterthanlit/litt.md";
const read = (f) => fs.readFileSync(f, "utf8");
const fail = (msg) => {
  console.error(`gen-llms: ${msg}`);
  process.exit(1);
};

/* ------------------------------------------------------------- the inputs */

/** The `{ … }` that starts at src[start], found by counting braces (strings, templates and comments skipped). */
function objectAt(src, start) {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      for (i++; i < src.length && src[i] !== ch; i++) if (src[i] === "\\") i++;
    } else if (ch === "/" && src[i + 1] === "/") {
      i = src.indexOf("\n", i);
      if (i < 0) break;
    } else if (ch === "/" && src[i + 1] === "*") {
      i = src.indexOf("*/", i) + 1;
      if (i < 1) break;
    } else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return src.slice(start, i + 1);
  }
  return null;
}

/** `export const <name> = { … }` in a page, as data. Undefined when the page has none. */
function literal(file, src, name) {
  const head = new RegExp(`^export\\s+const\\s+${name}\\b[^=]*=\\s*(?=\\{)`, "m").exec(src);
  if (!head) return undefined;
  const text = objectAt(src, head.index + head[0].length);
  if (!text) fail(`${path.relative(root, file)}: ${name} never closes`);
  try {
    return new Function(`return (${text})`)();
  } catch (e) {
    return fail(`${path.relative(root, file)}: ${name} must be a plain object literal, so it can be read without running the page (${e.message})`);
  }
}

const docsJson = path.join(root, "src", "generated", "docs.json");
if (!fs.existsSync(docsJson)) fail("src/generated/docs.json is missing. Run npm run gen:docs first.");
const componentDocs = JSON.parse(read(docsJson));
const lockFile = path.join(root, "registry.lock.json");
if (!fs.existsSync(lockFile)) fail("registry.lock.json is missing. Run npm run gen:registry first.");
const lock = JSON.parse(read(lockFile));

/** copy-prompt.ts imports only types, so a plain transpile runs under Node. */
async function loadCopyPrompt() {
  const src = read(path.join(root, "src", "gallery", "docs", "copy-prompt.ts"));
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "litt-llms-")), "copy-prompt.mjs");
  fs.writeFileSync(tmp, js);
  try {
    return await import(pathToFileURL(tmp).href);
  } finally {
    fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  }
}

/** The sidebar's groups, in order, read from kit.tsx so the two never drift. */
const GROUPS = JSON.parse(/export const PAGE_GROUPS = (\[[^\]]*\])/.exec(read(path.join(root, "src", "gallery", "kit.tsx")))?.[1] ?? fail("kit.tsx: PAGE_GROUPS not found"));

function readPages() {
  const pages = [];
  for (const f of fs.readdirSync(pagesDir).filter((x) => x.endsWith(".tsx")).sort()) {
    const file = path.join(pagesDir, f);
    const src = read(file);
    const meta = literal(file, src, "meta");
    if (!meta) fail(`${f}: no meta`);
    const docs = literal(file, src, "docs");
    if (docs) {
      for (const stem of docs.components) if (!componentDocs[stem]) fail(`${f}: docs.components names "${stem}", which src/generated/docs.json does not have`);
    }
    pages.push({ file: `gallery/src/gallery/pages/${f}`, meta, docs });
  }
  return pages.sort((a, b) => a.meta.order - b.meta.order);
}

/* ----------------------------------------------------------- the Markdown */

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n+/g, " ");
const code = (s) => (s ? "`" + String(s).replace(/`/g, "'") + "`" : "");
const bullets = (items) => items.map((i) => `- ${i}`).join("\n");
const TIER_WORDS = {
  instant: "instant (a short ease-out tween for hover, press and toggles)",
  responsive: "responsive (a spring with no bounce, for menus, tabs, tooltips and the gliding highlight)",
  expressive: "expressive (the one signature moment in a view, such as a dialog or a list entrance)",
};
const REDUCED_MOTION =
  "Under `prefers-reduced-motion` every duration, travel and stagger is zero, in CSS and in the springs, and the components need no provider for it. CI opens every gallery page and the overlays on it with reduced motion on, and fails if anything is still moving one frame later.";

function propsSection(stems, docs, cp) {
  const comps = stems.map((s) => componentDocs[s]);
  const out = [];
  for (const e of cp.documentedExports(docs, comps)) {
    const doc = componentDocs[e.stem].exports.find((x) => x.name === e.name);
    const lines = [`### ${e.name}`];
    if (doc.description) lines.push(doc.description);
    if (doc.extends) lines.push(`Also takes: ${doc.extends}.`);
    if (doc.props.length) {
      lines.push(
        [
          "| Prop | Type | Default | Description |",
          "| --- | --- | --- | --- |",
          ...doc.props.map((p) => `| ${code(p.name)}${p.required ? " (required)" : ""} | ${cell(code(p.type))} | ${cell(code(p.default))} | ${cell(p.description)} |`),
        ].join("\n"),
      );
    } else if (doc.kind === "component") lines.push("No props of its own.");
    out.push(lines.join("\n\n"));
  }
  return out.join("\n\n");
}

function pageMarkdown(page, cp) {
  const { meta, docs } = page;
  const comps = docs.components.map((s) => componentDocs[s]);
  const first = docs.components[0];
  const versions = docs.components.map((s) => `${s} ${lock.items[s]?.version ?? "(not in the registry)"}`).join(", ");
  const parts = [
    `# ${meta.title}`,
    `> ${meta.summary}`,
    `Part of litt.md, Nick's design language, as a shadcn registry for React and Tailwind CSS v4. Version: ${versions}. Live demo: ${ORIGIN}/#${meta.id}. Source: ${REPO}/blob/main/${componentDocs[first].file}. Changes: ${ORIGIN}/changelog.md.`,
    "## Install",
    "```bash\n" + cp.installCommands(comps) + "\n```",
    `Every token it brings is prefixed with litt (\`--litt-accent\`, \`bg-litt-surface-1\`), so nothing in the project changes. With ${code(cp.REGISTRIES_ENTRY)} in components.json the same install is \`npx shadcn@latest add @litt/${first}\`. For litt's fonts, heading weights and focus ring across the whole app, also add ${code(cp.registryUrl("base-styles"))}.`,
    "## Usage",
    "```tsx\n" + cp.usageSnippet(docs, comps) + "\n```",
    "## Use it when",
    bullets(docs.use),
    "## Skip it when",
    bullets(docs.skip),
    "## Props",
    propsSection(docs.components, docs, cp),
  ];
  if (docs.keyboard?.length) {
    parts.push("## Keyboard", ["| Keys | What it does |", "| --- | --- |", ...docs.keyboard.map(([keys, does]) => `| ${keys.map(code).join(" or ")} | ${cell(does)} |`)].join("\n"));
  }
  parts.push("## Accessibility", bullets(docs.a11y));
  parts.push(
    "## Motion",
    meta.tiers.length ? `Tiers: ${meta.tiers.map((t) => TIER_WORDS[t]).join("; ")}. Only transform and opacity animate, plus color fades on the instant tier.` : "None.",
    REDUCED_MOTION,
  );
  return parts.join("\n\n") + "\n";
}

function llmsTxt(pages) {
  const withDocs = pages.filter((p) => p.docs);
  const patterns = pages.filter((p) => !p.docs && p.meta.group);
  const sections = [
    "# litt.md",
    "> Nick's design language for web and product UI as a shadcn registry: React and Tailwind CSS v4 components on locked tokens. Technical precision, lit from above: an 8px grid, hairlines, Geist at 14px in three weights by role, warm stone neutrals, glass only on floating surfaces, and quick motion with one expressive moment per view.",
    `Every page below is Markdown with the install command, a usage example, the props, the keyboard and what it guarantees for accessibility. The gallery itself is ${ORIGIN} (each page at /#<page>), the registry index is ${ORIGIN}/r/registry.json, and the changes, release by release with migration steps, are at ${ORIGIN}/changelog.md.`,
    "## Install",
    [
      "Install one component with the shadcn CLI. It brings its dependencies and litt's tokens, every one prefixed with litt, so nothing in the project changes:",
      "```bash\nnpx shadcn@latest add https://littmd.vercel.app/r/button.json\n```",
      'Or add `"registries": { "@litt": "https://littmd.vercel.app/r/{name}.json" }` to components.json once, then `npx shadcn@latest add @litt/button`.',
      bullets([
        "Needs a shadcn project (a components.json) with Tailwind CSS v4.",
        "Optional: `npx shadcn@latest add https://littmd.vercel.app/r/base-styles.json` for litt's fonts, heading weights and focus ring across the whole app.",
        `Every installed file names its release in its first lines (\`// @litt/button ${lock.latest}\`). To update, read the changelog since then and install again with \`--overwrite\`.`,
        "In an AI tool: with the @litt registry in components.json, shadcn's MCP server (`npx shadcn@latest mcp init --client claude`, or cursor, vscode, codex) can search litt, read each item and its `<name>-demo` example (`npx shadcn@latest view @litt/button-demo`), and install it. Setup for each tool: " + `${ORIGIN}/#ai.`,
        `For the whole design language (taste, tokens, build and critique workflows), install the Claude Code plugin: \`claude plugin marketplace add litterthanlit/litt.md\`, then \`claude plugin install litt-md@litt\`. Source: ${REPO}.`,
      ]),
    ].join("\n\n"),
    "## House rules",
    bullets([
      "Weight by role: text at 400, titles, buttons and tabs at 500 (font-litt-title), 12px labels at 600 (font-litt-label, carried by text-litt-caption). Never font-medium, font-semibold or font-bold. Nothing is set above 18px.",
      "Tokens only: no hex and no raw colors. Radii are rounded-litt-control (4px), rounded-litt-surface (8px) or rounded-litt-pill (avatars, icon-only buttons, switches).",
      "One accent fill per view, on the primary action. Checkboxes, radios and switches fill with the foreground color.",
      "Glass only on floating surfaces (menus, popovers, dialogs, toasts). Cards in the page flow are raised, with no shadow.",
      "Five data hues carry data (series, categories, heat) and never chrome.",
      "Only transform and opacity animate, through the tier tokens. " + REDUCED_MOTION,
    ]),
  ];
  for (const g of GROUPS) {
    const list = withDocs.filter((p) => p.meta.group === g);
    if (!list.length) continue;
    sections.push(`## ${g}`, list.map((p) => `- [${p.meta.title}](${ORIGIN}/docs/${p.meta.id}.md): ${p.meta.summary}`).join("\n"));
  }
  if (patterns.length) {
    sections.push(
      "## Patterns",
      "Pages that compose the components into whole screens. They are demos in the gallery, not registry items.\n\n" +
        patterns.map((p) => `- [${p.meta.title}](${ORIGIN}/#${p.meta.id}): ${p.meta.summary}`).join("\n"),
    );
  }
  sections.push("## Optional", `- [Changelog](${ORIGIN}/changelog.md): every release, with an install line per item and migration steps.\n- [Everything in one file](${ORIGIN}/llms-full.txt)`);
  return sections.join("\n\n") + "\n";
}

/* ------------------------------------------------------------- write them */

async function main() {
  const cp = await loadCopyPrompt();
  const pages = readPages();
  const files = new Map();
  const docsPages = pages.filter((p) => p.docs);
  for (const p of docsPages) files.set(`docs/${p.meta.id}.md`, pageMarkdown(p, cp));
  const llms = llmsTxt(pages);
  files.set("llms.txt", llms);
  files.set("llms-full.txt", llms + "\n---\n\n" + docsPages.map((p) => files.get(`docs/${p.meta.id}.md`)).join("\n---\n\n"));
  files.set("changelog.md", read(path.join(root, "CHANGELOG.md")));

  if (check) {
    const stale = [...files].filter(([name, text]) => {
      const f = path.join(publicDir, name);
      return !fs.existsSync(f) || read(f) !== text;
    });
    if (stale.length) fail(`stale or missing in public/: ${stale.map(([n]) => n).join(", ")}. Run npm run gen:llms.`);
    console.log(`✓ public/llms.txt and ${docsPages.length} Markdown pages`);
    return;
  }
  // The docs folder is ours alone: clear it, so a renamed page leaves no stale file behind.
  fs.rmSync(path.join(publicDir, "docs"), { recursive: true, force: true });
  for (const [name, text] of files) {
    const f = path.join(publicDir, name);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, text);
  }
  console.log(`gen-llms: llms.txt, llms-full.txt, changelog.md and ${docsPages.length} Markdown pages -> public/`);
}

main().catch((e) => fail(e.message));
