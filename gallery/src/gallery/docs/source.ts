/**
 * Loads a page file's own text, so a Stage can show the demo it runs.
 *
 * The raw text of each page is a chunk of its own (`?raw`), fetched only when a reader
 * opens a Code tab. It is a different query from the registry's `?page-meta`, so the
 * two never meet. Nothing here runs at startup.
 */
import { extractDemo } from "./extract";

const sources = import.meta.glob<string>("../pages/*.tsx", { query: "?raw", import: "default" });

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
        return { code: extractDemo(await sources[file]!(), name, `src/gallery/pages/${file.split("/").pop()}`) };
      } catch (e) {
        console.error(`Stage code="${name}" on page "${pageId}":`, e);
        return { error: e instanceof Error ? e.message : String(e) };
      }
    })();
    cache.set(key, hit);
  }
  return hit;
}
