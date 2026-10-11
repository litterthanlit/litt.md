/** Pages register themselves: any src/gallery/pages/*.tsx exporting `meta` and a default component. */
import type { ComponentType } from "react";
import type { PageMeta } from "./kit";

type PageModule = { meta: PageMeta; default: ComponentType };
const modules = import.meta.glob<PageModule>("./pages/*.tsx", { eager: true });

export type PageEntry = PageMeta & { Component: ComponentType };

export const pages: PageEntry[] = Object.values(modules)
  .filter((m) => m.meta && m.default)
  .map((m) => ({ ...m.meta, Component: m.default }))
  .sort((a, b) => a.order - b.order);
