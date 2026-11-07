/** Pages register themselves: any src/gallery/pages/*.tsx exporting `meta` and a default component. */
import { lazy, type ComponentType } from "react";
import type { PageGroup, PageMeta } from "./kit";
import { MATERIALS, type MaterialInfo } from "./look";

/* The nav needs every page's meta at once, but not every page's code. So meta comes
   from a tiny module holding only `export const meta` (the page-meta plugin in
   vite.config.ts), and each component loads on demand as its own chunk. */
const metas = import.meta.glob<PageMeta>("./pages/*.tsx", { eager: true, query: "?page-meta", import: "meta" });
const loaders = import.meta.glob<{ default: ComponentType }>("./pages/*.tsx");

export type PageEntry = PageMeta & { Component: ComponentType; preload: () => Promise<unknown> };

export const pages: PageEntry[] = Object.entries(metas)
  .map(([file, meta]) => {
    const load = () =>
      loaders[file]!().then((m) => {
        if (!m.default) throw new Error(`${file}: no default export. A page exports its meta and a default component.`);
        return m;
      });
    return { ...meta, Component: lazy(load), preload: load };
  })
  .sort((a, b) => a.order - b.order);

/**
 * The worlds that have a page, in the materials' order (proposals/worlds.md): the way in, drawn by the sidebar and the
 * phone menu above the component groups. Empty until the world pages exist.
 */
export const worlds: (MaterialInfo & { page: PageEntry })[] = MATERIALS.flatMap((m) => {
  const page = pages.find((p) => p.world === m.id);
  return page ? [{ ...m, page }] : [];
});

/** The pages whose component moves differently in fun mode (meta.fun), in sidebar order. */
export const funPages = pages.filter((p) => p.fun);

let settling: Promise<void> | undefined;

/**
 * Resolves once the visit has settled: the window has loaded, the browser is idle, the fonts are in (the swap into
 * Geist is the page's largest paint, and must not share the line) and a second has passed. What the first paint does
 * not need waits for this.
 */
export function settled(): Promise<void> {
  return (settling ??= new Promise((resolve) => {
    const run = () => void document.fonts.ready.then(() => setTimeout(resolve, 1000));
    const idle = () => (typeof requestIdleCallback === "function" ? requestIdleCallback(run, { timeout: 10_000 }) : setTimeout(run, 1500)); // Safari has no requestIdleCallback
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  }));
}

/* How many chunks download at once. A few, so a page opened meanwhile is not queued behind a hundred fetches. */
const LANES = 4;
let prefetching = false;

/**
 * Fetch the other pages' chunks, so navigating stays instant. Once the page you came for is up and the visit has
 * settled, a few at a time in sidebar order, and never on a saved-data or 2G connection, where that page is all you pay
 * for. Starts once per visit.
 */
export function prefetchPages(): void {
  if (prefetching) return;
  prefetching = true;
  const net = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (net?.saveData || /2g/.test(net?.effectiveType ?? "")) return;
  const queue = pages.map((p) => p.preload);
  const next = (): Promise<void> => {
    const load = queue.shift();
    return load ? load().catch(() => {}).then(next) : Promise.resolve(); // best effort: a miss just loads on open
  };
  void settled().then(() => {
    for (let i = 0; i < LANES; i++) void next();
  });
}

/** Pages in sidebar order, split into runs that share a group. A run with no group has no heading. */
export function pageRuns(list: PageEntry[] = pages): { group?: PageGroup; pages: PageEntry[] }[] {
  const runs: { group?: PageGroup; pages: PageEntry[] }[] = [];
  for (const p of list) {
    const last = runs[runs.length - 1];
    if (last && last.group === p.group) last.pages.push(p);
    else runs.push({ group: p.group, pages: [p] });
  }
  return runs;
}
