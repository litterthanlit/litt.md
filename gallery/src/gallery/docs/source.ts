/**
 * Loads a page file's own text, so a Stage can show the demo it runs.
 *
 * The raw text of each page is a chunk of its own (`?raw`), fetched only when a reader
 * opens a Code tab. It is a different query from the registry's `?page-meta`, so the
 * two never meet. Nothing here runs at startup.
 */
import { installCommand } from "./copy-prompt";
import { extractDemo } from "./extract";

const sources = import.meta.glob<string>("../pages/*.tsx", { query: "?raw", import: "default" });
const blocks = import.meta.glob<string>("../../blocks/*.tsx", { query: "?raw", import: "default" });

/**
 * A demo that renders a block is a few lines around it, and the block is the part worth reading. So each block the demo
 * imports follows it, whole, under a comment that names the file and how to install it.
 */
async function withBlocks(code: string): Promise<string> {
  const names = [...code.matchAll(/from\s+"@\/blocks\/([\w-]+)"/g)].map((m) => m[1]!);
  const parts = [code];
  for (const name of names) {
    const load = blocks[`../../blocks/${name}.tsx`];
    if (!load) throw new Error(`The demo imports @/blocks/${name}, and src/blocks/${name}.tsx does not exist.`);
    parts.push(`// src/blocks/${name}.tsx, the block. Install it: ${installCommand(name)}\n\n${(await load()).trim()}`);
  }
  return parts.join("\n\n");
}

/** Page files are named <NN>-<meta.id>.tsx (CONTRIBUTING.md), so the id finds the file. */
function fileFor(pageId: string): string | undefined {
  const exact = new RegExp(`/\\d+-${pageId.replace(/[^\w-]/g, "")}\\.tsx$`); // "menu" must not match 05-command-menu.tsx
  return Object.keys(sources).find((key) => exact.test(key));
}

export type DemoSource = { code: string } | { error: string };

const cache = new Map<string, Promise<DemoSource>>();

/**
 * The demo's source, ready to show, or a message an author can act on. The promise never
 * rejects and is cached, so React can `use` it. A failure is also logged.
 */
export function demoSource(pageId: string, name: string): Promise<DemoSource> {
  const key = `${pageId}:${name}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = (async (): Promise<DemoSource> => {
      try {
        const file = fileFor(pageId);
        if (!file) {
          throw new Error(`No page file for "${pageId}". Page files are named <NN>-<meta.id>.tsx in src/gallery/pages/.`);
        }
        return { code: await withBlocks(extractDemo(await sources[file]!(), name, `src/gallery/pages/${file.split("/").pop()}`)) };
      } catch (e) {
        console.error(`Stage code="${name}" on page "${pageId}":`, e);
        return { error: e instanceof Error ? e.message : String(e) };
      }
    })();
    cache.set(key, hit);
  }
  return hit;
}
