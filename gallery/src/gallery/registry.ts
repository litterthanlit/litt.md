/** Pages register themselves: any src/gallery/pages/*.tsx exporting `meta` and a default component. */
import { lazy, type ComponentType } from "react";
import type { PageMeta } from "./kit";

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

/** After first paint, fetch the other pages' chunks while the browser is idle, so navigating stays instant. */
export function prefetchPages(): () => void {
  const run = () => pages.forEach((p) => p.preload().catch(() => {})); // best effort: a miss just loads on open
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(run, { timeout: 3000 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(run, 1500); // Safari has no requestIdleCallback
  return () => clearTimeout(id);
}
