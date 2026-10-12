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

const FONTS_URL = "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400&family=Geist+Mono:wght@400&display=swap";

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

/** The usage snippet, with the import line the author left out. Authors who write their own imports are left alone. */
export function usageSnippet(docs: PageDocs, components: ComponentDoc[]): string {
  const usage = docs.usage.trim();
  if (/^import\s/m.test(usage)) return usage;
  const imports = components
    .map((c) => ({ stem: c.stem, names: documentedExports(docs, [c]).filter((e) => uses(usage, e.name)).map((e) => e.name) }))
    .filter((c) => c.names.length)
    .map((c) => `import { ${c.names.join(", ")} } from "@/components/${c.stem}";`);
  return imports.length ? imports.join("\n") + "\n\n" + usage : usage;
}

/** Repo-relative files to copy, without repeats, in order. */
export const filesToCopy = (components: ComponentDoc[]) => [...new Set(components.flatMap((c) => c.files))];

/** npm packages to install: everything the files import except React itself. */
export const packagesToInstall = (components: ComponentDoc[]) =>
  [...new Set(components.flatMap((c) => c.packages))].filter((p) => p !== "react" && p !== "react-dom").sort();

const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

export type PromptInput = {
  meta: { title: string; summary: string };
  docs: PageDocs;
  components: ComponentDoc[];
};

export function buildPrompt({ meta, docs, components }: PromptInput): string {
  const files = filesToCopy(components);
  const packages = packagesToInstall(components);
  const names = documentedExports(docs, components).map((e) => e.name);

  const sections = [
    `Add the litt.md ${meta.title} to this project.`,
    `${meta.title}: ${meta.summary}\nExports: ${names.join(", ")}.\n\nRepo: ${REPO} (branch main). Every URL below is on main.`,

    `1. Tokens\n` +
      `The component reads litt.md's design tokens. If the project does not have them yet, copy these two files into its styles folder, and import tailwind.css from the global CSS. It imports tokens.css and Tailwind itself, so the project needs Tailwind CSS v4.\n` +
      `${rawUrl("skills/litt-md/assets/tokens.css")}\n${rawUrl("skills/litt-md/assets/tailwind.css")}\n` +
      `Load Hanken Grotesk and Geist Mono at weight 400: ${FONTS_URL}`,

    `2. Packages\n` +
      (packages.length
        ? `The files need React 19 and:\nnpm i ${packages.join(" ")}`
        : `The files need React 19 and nothing else to install.`),

    `3. Files\n` +
      `Copy each file below into the project and keep its path under src/, so "@/" maps to src/. For example, ${files[0] ?? "gallery/src/components/button.tsx"} becomes ${(files[0] ?? "gallery/src/components/button.tsx").replace(/^gallery\//, "")}. Set the "@/*" alias to "src/*" in tsconfig and the bundler if the project has no such alias.\n` +
      list(files.map(rawUrl)),

    `4. Usage\n\`\`\`tsx\n${usageSnippet(docs, components)}\n\`\`\``,

    `Use it when:\n${list(docs.use)}`,
    `Skip it when:\n${list(docs.skip)}`,
  ];

  if (docs.keyboard?.length) {
    sections.push(`Keyboard:\n${list(docs.keyboard.map(([keys, does]) => `${keys.join(" or ")}: ${does}`))}`);
  }
  sections.push(`Accessibility, keep these:\n${list(docs.a11y)}`);

  sections.push(
    `House rules (the gallery's lint fails the build on these):\n` +
      list([
        `Weight 400 everywhere (font-normal). Hierarchy comes from size and color, never weight.`,
        `Tokens only. No hex, no raw or quoted colors. Colors: canvas, surface-1 to surface-3, fg, fg-muted, fg-subtle, fg-disabled, line, line-strong, line-control, accent, accent-fg, accent-hover, accent-tint, focus, danger, success, warning.`,
        `Radii: only rounded-control, rounded-surface or rounded-pill, nothing else.`,
        `Type: text-display, text-h1 to text-h4, text-reading, text-body, text-small, text-caption. Fonts: Hanken Grotesk and Geist Mono.`,
        `Motion goes through the tier tokens. Only transform, opacity and color fades animate. Pair each duration with its ease: duration-(--dur-instant) with ease-litt, duration-(--dur-responsive) with ease-responsive, duration-(--dur-expressive) with ease-expressive. No transition-all and no literal durations or easings.`, // litt-allow: names the banned class in prose
        `One accent fill per view, on the primary action.`,
      ]),
  );

  return sections.join("\n\n") + "\n";
}
