/**
 * The "Copy prompt" text: everything a coding agent needs to add one component to a
 * project, with no other context. Pure functions over plain data, so they run under
 * Node for tests and never touch the DOM or the generated docs file.
 */
import type { PageDocs } from "../kit";
import type { ComponentDoc } from "../docs-data";

export const REPO = "https://github.com/litterthanlit/litt.md";
const RAW = "https://raw.githubusercontent.com/litterthanlit/litt.md/main/";
export const rawUrl = (file: string) => RAW + file;
export const sourceUrl = (file: string) => `${REPO}/blob/main/${file}`;

/** Where the gallery is served. */
export const SITE = "https://littmd.vercel.app";
/** A docs page as Markdown (scripts/gen-llms.mjs), for agents: https://littmd.vercel.app/docs/<page>.md */
export const markdownUrl = (pageId: string) => `${SITE}/docs/${pageId}.md`;

/** The shadcn registry the gallery builds (scripts/gen-registry.mjs): https://littmd.vercel.app/r/<item>.json */
export const REGISTRY_URL = "https://littmd.vercel.app/r/{name}.json";
export const registryUrl = (item: string) => REGISTRY_URL.replace("{name}", item);
/** One component, one command. The stems are the registry's item names. */
export const installCommand = (stem: string) => `npx shadcn@latest add ${registryUrl(stem)}`;
/** One line per component, skipping any that another one already brings in as a dependency (Menu brings its icons). */
export const installCommands = (components: Pick<ComponentDoc, "stem" | "file" | "files">[]) =>
  components
    .filter((c) => !components.some((o) => o !== c && o.files.includes(c.file)))
    .map((c) => installCommand(c.stem))
    .join("\n");
/** The components.json entry that turns the URLs into @litt/<item>. */
export const REGISTRIES_ENTRY = `"registries": { "@litt": "${REGISTRY_URL}" }`;

const FONTS_URL = "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@450;550&family=Geist+Mono:wght@450;550&display=swap";

/** The exports a page documents: its `exports` list in order, or every export of its components. */
export function documentedExports(docs: Pick<PageDocs, "exports">, components: ComponentDoc[]) {
  const all = components.flatMap((c) => c.exports.map((e) => ({ stem: c.stem, ...e })));
  if (!docs.exports) return all;
  return docs.exports.map((name) => {
    const hit = all.find((e) => e.name === name);
    if (!hit) throw new Error(`docs.exports names "${name}", but none of ${components.map((c) => c.stem).join(", ")} exports it`);
    return hit;
  });
}

const uses = (code: string, name: string) => new RegExp(`(?<![\\w$.])${name}(?![\\w$])`).test(code);

/**
 * The gallery's own files import each other as "@/components/button" and "@/motion". The shadcn install puts the same
 * files in components/litt and lib/litt, so a reader who installs with shadcn imports from there.
 */
export const installedImports = (code: string) =>
  code
    .replace(/(from\s+["'])@\/components\/(?!litt\/)/g, "$1@/components/litt/")
    .replace(/(from\s+["'])@\/motion(["'\/])/g, "$1@/lib/litt/motion$2");

/**
 * The usage snippet as a project that installed with shadcn writes it, with the import line the author left out.
 * Authors who write their own imports keep them, with the install paths.
 */
export function usageSnippet(docs: PageDocs, components: ComponentDoc[]): string {
  const usage = docs.usage.trim();
  if (/^import\s/m.test(usage)) return installedImports(usage);
  const imports = components
    .map((c) => ({ stem: c.stem, names: documentedExports(docs, [c]).filter((e) => uses(usage, e.name)).map((e) => e.name) }))
    .filter((c) => c.names.length)
    .map((c) => `import { ${c.names.join(", ")} } from "@/components/litt/${c.stem}";`);
  return imports.length ? imports.join("\n") + "\n\n" + usage : usage;
}

/** Repo-relative files to copy, without repeats, in order. */
export const filesToCopy = (components: ComponentDoc[]) => [...new Set(components.flatMap((c) => c.files))];

/** npm packages to install: everything the files import except React itself. */
export const packagesToInstall = (components: ComponentDoc[]) =>
  [...new Set(components.flatMap((c) => c.packages))].filter((p) => p !== "react" && p !== "react-dom").sort();

const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

export type PromptInput = {
  /** With an id, the prompt points at the page's Markdown docs too. */
  meta: { title: string; summary: string; id?: string };
  docs: PageDocs;
  components: ComponentDoc[];
};

export function buildPrompt({ meta, docs, components }: PromptInput): string {
  const files = filesToCopy(components);
  const packages = packagesToInstall(components);
  const names = documentedExports(docs, components).map((e) => e.name);

  const first = components[0]?.stem ?? "button";
  const sections = [
    `Add the litt.md ${meta.title} to this project.`,
    `${meta.title}: ${meta.summary}\nExports: ${names.join(", ")}.\n\nRepo: ${REPO} (branch main). Every URL below is on main.` +
      (meta.id ? `\nThe full docs as Markdown (props, keyboard, accessibility): ${markdownUrl(meta.id)}` : ""),

    `1. Install with shadcn\n` +
      `The project needs shadcn set up (a components.json) and Tailwind CSS v4. Run this in the project root:\n` +
      `${installCommands(components)}\n` +
      `It adds the files in components/litt and lib/litt, the npm packages they need, and litt's tokens in the global CSS. ` +
      `Every token is prefixed with litt (--litt-accent, bg-litt-surface-1, rounded-litt-control), so none of it collides with the project's own. ` +
      `Nothing else in the project changes. If a command asks to overwrite a file, say no and tell me.\n` +
      `For litt's fonts, its two weights and focus ring across the whole app, also run: npx shadcn@latest add ${registryUrl("base-styles")}\n` +
      `With ${REGISTRIES_ENTRY} in components.json, the same install is npx shadcn@latest add @litt/${first}.`,

    `2. Usage\n\`\`\`tsx\n${usageSnippet(docs, components)}\n\`\`\`\n` +
      `"@/" is the project's own alias. If it has none, import from components/litt with a relative path.`,

    `3. Fallback: copy the files by hand\n` +
      `Use this only when shadcn is not an option. These are the gallery's own files, so they use the plain token names (bg-surface-1, --accent) and import each other with "@/". ` +
      `In the usage above, import from "@/components/${first}" instead of "@/components/litt/${first}".\n\n` +
      `Tokens. The files read litt.md's design tokens. If the project does not have them yet, copy these two files into its styles folder, and import tailwind.css from the global CSS. It imports tokens.css and Tailwind itself, so the project needs Tailwind CSS v4.\n` +
      `${rawUrl("skills/litt-md/assets/tokens.css")}\n${rawUrl("skills/litt-md/assets/tailwind.css")}\n` +
      `Load Hanken Grotesk and Geist Mono at weights 450 and 550: ${FONTS_URL}\n\n` +
      `Packages. ` +
      (packages.length
        ? `The files need React 19 and:\nnpm i ${packages.join(" ")}`
        : `The files need React 19 and nothing else to install.`) +
      `\n\nFiles. ` +
      `Copy each file below into the project and keep its path under src/, so "@/" maps to src/. For example, ${files[0] ?? "gallery/src/components/button.tsx"} becomes ${(files[0] ?? "gallery/src/components/button.tsx").replace(/^gallery\//, "")}. Set the "@/*" alias to "src/*" in tsconfig and the bundler if the project has no such alias.\n` +
      list(files.map(rawUrl)),

    `Use it when:\n${list(docs.use)}`,
    `Skip it when:\n${list(docs.skip)}`,
  ];

  if (docs.keyboard?.length) {
    sections.push(`Keyboard:\n${list(docs.keyboard.map(([keys, does]) => `${keys.join(" or ")}: ${does}`))}`);
  }
  sections.push(`Accessibility, keep these:\n${list(docs.a11y)}`);

  sections.push(
    `House rules (the gallery's lint fails the build on these). The names below are the plain ones. A project installed with shadcn writes them with the litt prefix: bg-litt-surface-1, rounded-litt-control, text-litt-small, duration-(--litt-dur-instant) with ease-litt, --litt-accent.\n` +
      list([
        `Two weights: text you read is 450 (text-reading, text-body, text-small and text-caption carry it), headings are 550, and interface text at a small size (labels, nav, tabs, names, key values) adds [font-weight:var(--weight)]. Never font-normal, font-medium or font-bold. Hierarchy comes from size and color.`, // litt-allow: names the banned classes in prose
        `Tokens only. No hex, no raw or quoted colors. Colors: canvas, surface-1 to surface-3, fg, fg-muted, fg-subtle, fg-disabled, line, line-strong, line-control, accent, accent-fg, accent-hover, accent-tint, focus, danger, success, warning.`,
        `Radii: only rounded-control, rounded-surface or rounded-pill, nothing else.`,
        `Type: text-display, text-h1 to text-h4, text-reading, text-body, text-small, text-caption. Fonts: Hanken Grotesk and Geist Mono.`,
        `Motion goes through the tier tokens. Only transform, opacity and color fades animate. Pair each duration with its ease: duration-(--dur-instant) with ease-litt, duration-(--dur-responsive) with ease-responsive, duration-(--dur-expressive) with ease-expressive. No transition-all and no literal durations or easings.`, // litt-allow: names the banned class in prose
        `One accent fill per view, on the primary action: Button variant="primary" draws it (a deeper-blue-to-cobalt gradient in a deep blue edge, no glow).`,
      ]),
  );

  return sections.join("\n\n") + "\n";
}
