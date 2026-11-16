/**
 * What an object runs (plans/018 and 019, as Nick answered on 2026-11-15): every component in the world, each drawn as
 * its tile is on the overview's wall (PreviewContext "tile"), live and at real size, in that world's own body. They sit
 * on shelves, the gallery's groups in their order (PAGE_GROUPS), so a person chooses a group, then a part, as on
 * design.how's systems, instead of passing ninety in a row; and each world leads with a core set, the parts that show it
 * best, on Home and in Play. A world's own parts (meta.worlds) are among them; the Blocks, the world pages and the site's
 * pages are not.
 */
import type { ComponentType } from "react";
import { PAGE_GROUPS } from "../kit";
import type { Material } from "../look";
import { inWorld, pages } from "../registry";

export type Take = {
  /** The component's page id: its anchor in the world, #device/button. */
  id: string;
  title: string;
  /** The page's one line, for Details. */
  lede: string;
  /** Its shelf: the page's group. */
  group: string;
  /** The page itself, drawn as its tile under PreviewContext "tile". */
  Component: ComponentType;
};

/** A group of takes, in order: the takes from `from` to `from + count - 1`. */
export type Shelf = { group: string; from: number; count: number };

export type Takes = {
  takes: Take[];
  shelves: Shelf[];
  /** The world's core set, as indices into `takes`, in the order Home shows them and Play runs them. */
  core: number[];
};

/**
 * Each world's core set: what it is for (look.ts, audience), said in a dozen parts. A part not in the world is left out.
 * The first is where Play starts.
 */
const CORE: Record<Material, string[]> = {
  press: ["button", "input", "select", "switch", "segmented", "tabs", "dialog", "menu", "toast", "table", "chart", "stat"],
  flat: ["button", "media", "carousel", "card", "accordion", "header", "breadcrumb", "tabs", "lightbox", "input", "avatar", "toast"],
  device: ["composer", "message", "tool-call", "run-list", "code-block", "button", "switch", "slider", "seven-segment", "gauge", "log-view", "command-menu"],
  plain: ["form", "input", "select", "checkbox", "button", "table", "tabs", "breadcrumb", "details", "callout", "pagination", "dialog"],
  rack: ["slider", "curve-editor", "spring-editor", "pad", "time-scrubber", "inspector", "segmented", "number-field", "color-picker", "range-chart", "tabs", "button"],
  heat: ["menu", "tabs", "segmented", "button", "stat", "gauge", "rolling-number", "seven-segment", "table", "progress", "select", "toast"],
};

const taken = new Map<Material, Takes>();

/** The world's takes on their shelves, and its core set: the same object for the life of the page. */
export function takesOf(material: Material): Takes {
  let got = taken.get(material);
  if (got) return got;
  const groupIndex = (g: string | undefined) => PAGE_GROUPS.indexOf(g as (typeof PAGE_GROUPS)[number]);
  const takes: Take[] = pages
    .filter((p) => p.group && p.group !== "Blocks" && p.group !== "Worlds" && !p.world && inWorld(p, material))
    .map((p, i) => ({ p, i }))
    /* By shelf, then the sidebar's order within it: a stable sort, so pages keep their order inside a group. */
    .sort((a, b) => groupIndex(a.p.group) - groupIndex(b.p.group) || a.i - b.i)
    .map(({ p }) => ({ id: p.id, title: p.title, lede: p.lede, group: p.group!, Component: p.Component }));
  const shelves: Shelf[] = [];
  takes.forEach((t, i) => {
    const last = shelves[shelves.length - 1];
    if (last && last.group === t.group) last.count++;
    else shelves.push({ group: t.group, from: i, count: 1 });
  });
  const core = CORE[material].map((id) => takes.findIndex((t) => t.id === id)).filter((i) => i >= 0);
  got = { takes, shelves, core };
  taken.set(material, got);
  return got;
}

/** The shelf a take sits on. */
export const shelfOf = (shelves: Shelf[], at: number): number => shelves.findIndex((s) => at >= s.from && at < s.from + s.count);
