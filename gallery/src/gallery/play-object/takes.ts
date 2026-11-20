/**
 * What a world holds (plans/018 and 019). The player runs the world's set: the dozen parts that show it best, a flat
 * list in the order Home lists them and Play runs them. Each is drawn as its tile is on the overview's wall
 * (PreviewContext "tile"), live and at real size, in that world's own body. Every other part lives in the world's
 * gallery view (#<world>/components), on shelves in the gallery's group order (PAGE_GROUPS). A world's own parts
 * (meta.worlds) are among them. The Blocks, the world pages and the site's pages are not.
 */
import type { ComponentType } from "react";
import { PAGE_GROUPS } from "../kit";
import type { Material } from "../look";
import { inWorld, pages, type PageEntry } from "../registry";

export type Take = {
  /** The component's page id: its anchor in the world, #device/button. */
  id: string;
  title: string;
  /** The page's one line, for Details and Home. */
  lede: string;
  /** The page's group. */
  group: string;
  /** The page itself, drawn as its tile under PreviewContext "tile". */
  Component: ComponentType;
};

/**
 * Each world's set: what it is for (look.ts, audience), said in twelve parts (Nick, 2026-11-16). The first is where Play
 * starts. Every id must be a part in its world: playground.mjs fails when one is not, so a set never shrinks unseen.
 */
const SET: Record<Material, string[]> = {
  press: ["deploy-status", "env-switch", "release-rail", "button", "switch", "segmented", "slider", "input", "select", "menu", "stat", "table"],
  flat: ["progress", "poll", "streak", "kudos", "reaction-bar", "reading-progress", "goal-ring", "button", "gauge", "heatmap", "card", "toast"],
  device: ["composer", "agent-indicator", "tool-call", "message", "seven-segment", "tape-progress", "switch", "slider", "gauge", "copy-button", "button", "command-menu"],
  plain: ["form", "input", "select", "checkbox", "button", "table", "details", "callout", "breadcrumb", "pagination", "tabs", "dialog"],
  rack: ["clip-launcher", "device-rack", "step-sequencer", "slider", "curve-editor", "pad", "time-scrubber", "inspector", "number-field", "segmented", "switch", "button"],
  heat: ["pursuit-meter", "tune-menu", "lap-timer", "menu", "tabs", "segmented", "button", "slider", "stat", "progress", "table", "toast"],
};

/** Every component page in the world, in the sidebar's order. */
const partsOf = (material: Material) =>
  pages.filter((p) => p.group && p.group !== "Blocks" && p.group !== "Worlds" && !p.world && inWorld(p, material));

const taken = new Map<Material, Take[]>();

/** The world's set, in SET order: the same array for the life of the page. */
export function takesOf(material: Material): Take[] {
  let got = taken.get(material);
  if (got) return got;
  const parts = partsOf(material);
  got = SET[material].flatMap((id) => {
    const p = parts.find((q) => q.id === id);
    return p ? [{ id: p.id, title: p.title, lede: p.lede, group: p.group!, Component: p.Component }] : [];
  });
  taken.set(material, got);
  return got;
}

/** Every component in the world on its shelf: the world's set first, then the remaining parts in PAGE_GROUPS order. */
export function shelvesOf(material: Material): { group: string; pages: PageEntry[] }[] {
  const parts = partsOf(material);
  const featured = SET[material].flatMap((id) => {
    const p = parts.find((q) => q.id === id);
    return p ? [p] : [];
  });
  const inSet = new Set(featured.map((p) => p.id));
  const rest = PAGE_GROUPS.flatMap((group) => {
    const on = parts.filter((p) => p.group === group && !inSet.has(p.id));
    return on.length ? [{ group, pages: on }] : [];
  });
  return featured.length ? [{ group: "In the set", pages: featured }, ...rest] : rest;
}
