/**
 * What an object runs, one take at a time (plans/018, as Nick answered on 2026-11-15): every component in the world,
 * in the sidebar's order, each drawn as its tile is on the overview's wall (PreviewContext "tile"), live and at real
 * size, in that world's own body. A world's own parts (meta.worlds) are among them; the Blocks, the world pages and the
 * site's pages are not.
 */
import type { ComponentType } from "react";
import type { Material } from "../look";
import { inWorld, pages } from "../registry";

export type Take = {
  /** The component's page id: its anchor in the gallery, #button. */
  id: string;
  title: string;
  /** The page's one line, for Details. */
  lede: string;
  /** The page itself, drawn as its tile under PreviewContext "tile". */
  Component: ComponentType;
};

const taken = new Map<Material, Take[]>();

/** The world's takes, the same array for the life of the page. */
export function takesOf(material: Material): Take[] {
  let list = taken.get(material);
  if (!list) {
    list = pages
      .filter((p) => p.group && p.group !== "Blocks" && p.group !== "Worlds" && !p.world && inWorld(p, material))
      .map((p) => ({ id: p.id, title: p.title, lede: p.lede, Component: p.Component }));
    taken.set(material, list);
  }
  return list;
}
