/**
 * Flat icons, a trial (Nick, 2026-11-18, with a reference: "also maybe we could trial a fun icon set for flat sort of
 * like this"). The reference is a direction, not a source: every drawing here is our own. Nothing ships; the shipping set
 * stays icons.tsx, shared by every world.
 *
 * The rules, on icons.tsx's 16-unit grid so the set could later be Flat's body of the same Icon names:
 * - Outline only, one stroke: 1.75 units (1.75px at 16, 2.6px at 24), currentColor, round caps and round joins.
 * - Every box is a rounded rect (2 to 2.5 units at the centreline, so about 3 outside), every corner of a polygon is
 *   rounded too (roundPoly), so nothing is sharp.
 * - Keylines are measured on the stroke's centreline, a stroke's half inside them: a circle of radius 6, a square of 11,
 *   a landscape box of 12 by 9 or a portrait one of 9 by 12; with the stroke every icon stays inside 1 to 15.
 * - A fill only for a mark too small to outline: a dot (an eye, a bullet, the paw's toes, a smiley's eyes).
 * - Arrows have 4 heads on their own and 3 inside a mark, as today.
 * Decorative unless labelled, as today.
 */
import { useState, type CSSProperties, type ReactNode, type SVGProps } from "react";
import * as Today from "@/components/icons";
import { Button } from "@/components/button";
import { Callout } from "@/components/callout";
import { Empty } from "@/components/states";
import { Menu, MenuItem } from "@/components/menu";
import { SidebarLink, SidebarNav } from "@/components/app-shell";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";
import { Toaster, toast } from "@/components/toast";
import { FlatFrame } from "./flat-calls";

/* ---------------------------------------------------------------- geometry */

export const STROKE = 1.75;

type Pt = [number, number];
type Drawing = { line?: string; fill?: string; dash?: string };

const n = (v: number) => +v.toFixed(3);
const circle = (cx: number, cy: number, r: number) => `M${n(cx - r)} ${cy}a${r} ${r} 0 1 1 ${n(2 * r)} 0a${r} ${r} 0 1 1 ${n(-2 * r)} 0z`;
/** A rounded rect, clockwise from the top left. */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${n(x + r)} ${y}h${n(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${n(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}h${n(2 * r - w)}a${r} ${r} 0 0 1 ${-r} ${-r}v${n(2 * r - h)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
/** A closed polygon with every corner rounded: each corner cut r along both edges and joined by a curve through it. */
function roundPoly(pts: Pt[], r: number) {
  const k = pts.length;
  let d = "";
  for (let i = 0; i < k; i++) {
    const [px, py] = pts[i];
    const [ax, ay] = pts[(i - 1 + k) % k];
    const [bx, by] = pts[(i + 1) % k];
    const la = Math.hypot(ax - px, ay - py);
    const lb = Math.hypot(bx - px, by - py);
    const ra = Math.min(r, la / 2);
    const rb = Math.min(r, lb / 2);
    const s: Pt = [px + ((ax - px) / la) * ra, py + ((ay - py) / la) * ra];
    const e: Pt = [px + ((bx - px) / lb) * rb, py + ((by - py) / lb) * rb];
    d += `${i === 0 ? "M" : "L"}${n(s[0])} ${n(s[1])}Q${n(px)} ${n(py)} ${n(e[0])} ${n(e[1])}`;
  }
  return d + "z";
}
const polar = (cx: number, cy: number, r: number, deg: number): Pt => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];

const RING = circle(8, 8, 6);
const GEAR = roundPoly(
  Array.from({ length: 8 }, (_, i) => {
    const a = i * 45 - 90;
    return [polar(8, 8, 4.6, a - 17), polar(8, 8, 6.1, a - 8), polar(8, 8, 6.1, a + 8), polar(8, 8, 4.6, a + 17)];
  }).flat(),
  0.7,
);
const STAR = roundPoly(
  Array.from({ length: 10 }, (_, i) => polar(8, 8.5, i % 2 ? 2.9 : 6.25, i * 36 - 90)),
  0.9,
);
const EYE = "M1.75 8C3.25 5.25 5.4 3.75 8 3.75S12.75 5.25 14.25 8c-1.5 2.75-3.65 4.25-6.25 4.25S3.25 10.75 1.75 8z";
const TRAY = "M3 9.5v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2";
const dots = (...c: Pt[]) => c.map(([x, y]) => circle(x, y, 0.95)).join("");

/* ---------------------------------------------------------------- the set */

type Group = "Navigation" | "Actions" | "Objects" | "Status and system" | "People and data" | "Steps" | "Fun, for Flat's voice";

/** Every drawing, by the name icons.tsx gives it (less "Icon"), in icons.tsx's order; the steps and the fun ones after. */
const SET: { name: string; group: Group; draw: Drawing }[] = [
  /* Navigation */
  { name: "ChevronLeft", group: "Navigation", draw: { line: "M10.125 3.75 5.875 8l4.25 4.25" } },
  { name: "ChevronRight", group: "Navigation", draw: { line: "M5.875 3.75 10.125 8l-4.25 4.25" } },
  { name: "ChevronUp", group: "Navigation", draw: { line: "M3.75 10.125 8 5.875l4.25 4.25" } },
  { name: "ChevronDown", group: "Navigation", draw: { line: "M3.75 5.875 8 10.125l4.25-4.25" } },
  { name: "ChevronsUpDown", group: "Navigation", draw: { line: "M5 6l3-3 3 3M5 10l3 3 3-3" } },
  { name: "ArrowLeft", group: "Navigation", draw: { line: "M13 8H3M7 4 3 8l4 4" } },
  { name: "ArrowRight", group: "Navigation", draw: { line: "M3 8h10M9 4l4 4-4 4" } },
  { name: "ArrowUp", group: "Navigation", draw: { line: "M8 13V3M4 7l4-4 4 4" } },
  { name: "ArrowDown", group: "Navigation", draw: { line: "M8 3v10M4 9l4 4 4-4" } },
  { name: "ArrowUpRight", group: "Navigation", draw: { line: "M4.5 11.5l7-7M5.5 4.5h6v6" } },
  { name: "Home", group: "Navigation", draw: { line: roundPoly([[8, 2.25], [13.5, 6.75], [13.5, 13.5], [2.5, 13.5], [2.5, 6.75]], 1.75) + "M6.5 13.5v-2.5a1.5 1.5 0 0 1 3 0v2.5" } },
  { name: "Menu", group: "Navigation", draw: { line: "M2.5 4.25h11M2.5 8h11M2.5 11.75h11" } },
  { name: "Sidebar", group: "Navigation", draw: { line: rr(2, 2.5, 12, 11, 2.5) + "M6.5 2.5v11" } },
  { name: "Expand", group: "Navigation", draw: { line: "M10 2.5h3.5V6M13.5 2.5l-4 4M6 13.5H2.5V10M2.5 13.5l4-4" } },
  { name: "Shrink", group: "Navigation", draw: { line: "M13.5 2.5l-4 4M9.5 3v3.5H13M2.5 13.5l4-4M6.5 13V9.5H3" } },
  { name: "Undo", group: "Navigation", draw: { line: "M6 3 3 6l3 3M3 6h6.75a3.25 3.25 0 0 1 0 6.5H6" } },
  { name: "Redo", group: "Navigation", draw: { line: "M10 3l3 3-3 3M13 6H6.25a3.25 3.25 0 0 0 0 6.5H10" } },
  { name: "Retry", group: "Navigation", draw: { line: "M13 8a5 5 0 1 1-1.46-3.54M13 2.5v3h-3" } },
  { name: "LogOut", group: "Navigation", draw: { line: "M6.5 2.5h-2a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2M6.5 8h7M10.5 5l3 3-3 3" } },

  /* Actions */
  { name: "Search", group: "Actions", draw: { line: circle(7, 7, 4.5) + "M10.5 10.5l3 3" } },
  { name: "Plus", group: "Actions", draw: { line: "M8 3v10M3 8h10" } },
  { name: "Minus", group: "Actions", draw: { line: "M3 8h10" } },
  { name: "X", group: "Actions", draw: { line: "M4 4l8 8M12 4l-8 8" } },
  { name: "Check", group: "Actions", draw: { line: "M3 8.25l3.25 3.25L13 4.75" } },
  { name: "Edit", group: "Actions", draw: { line: "M10.5 2.75a1.77 1.77 0 0 1 2.5 2.5L5.5 12.75l-3 .75.75-3zM9.25 4l2.5 2.5" } },
  { name: "Copy", group: "Actions", draw: { line: rr(5.5, 5.5, 8, 8, 2) + "M2.5 10V4.5a2 2 0 0 1 2-2H10" } },
  { name: "Link", group: "Actions", draw: { line: "m7 5.25 1.5-1.5a2.83 2.83 0 0 1 4 4L11 9.25M9 10.75l-1.5 1.5a2.83 2.83 0 0 1-4-4L5 6.75M6.25 9.75l3.5-3.5" } },
  { name: "Share", group: "Actions", draw: { line: "M8 9.5v-7M5 5.5l3-3 3 3" + TRAY } },
  { name: "Download", group: "Actions", draw: { line: "M8 2.5v7M5 6.5l3 3 3-3" + TRAY } },
  { name: "Send", group: "Actions", draw: { line: roundPoly([[13.5, 2.5], [9.5, 13.5], [7.25, 8.75], [2.5, 6.5]], 1) + "M13.25 2.75 7.25 8.75" } },
  { name: "Paperclip", group: "Actions", draw: { line: "m13 7.25-5.3 5.3a3.25 3.25 0 0 1-4.6-4.6l5.65-5.65a2.1 2.1 0 0 1 3 3L6.1 10.95a1 1 0 0 1-1.4-1.4l5.05-5.05" } },
  { name: "Trash", group: "Actions", draw: { line: "M2.5 4.5h11M6 4.5v-1a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M3.75 4.5l.6 7.6a1.5 1.5 0 0 0 1.5 1.4h4.3a1.5 1.5 0 0 0 1.5-1.4l.6-7.6M6.75 7.25v3.5M9.25 7.25v3.5" } },
  { name: "Archive", group: "Actions", draw: { line: rr(2, 2.5, 12, 3.5, 1.5) + "M3.25 6v5.5a2 2 0 0 0 2 2h5.5a2 2 0 0 0 2-2V6M6.5 9h3" } },
  { name: "Filter", group: "Actions", draw: { line: roundPoly([[2.5, 3], [13.5, 3], [9.25, 8.5], [9.25, 12.75], [6.75, 13.75], [6.75, 8.5]], 1) } },
  { name: "Sort", group: "Actions", draw: { line: "M5 13V3M2.5 5.5 5 3l2.5 2.5M11 3v10M8.5 10.5 11 13l2.5-2.5" } },
  { name: "Sliders", group: "Actions", draw: { line: "M2.5 4.5h6M12.5 4.5h1M2.5 11.5h1M7.5 11.5h6" + circle(10.5, 4.5, 2) + circle(5.5, 11.5, 2) } },
  { name: "Settings", group: "Actions", draw: { line: GEAR + circle(8, 8, 2) } },
  { name: "More", group: "Actions", draw: { fill: circle(3.5, 8, 1.25) + circle(8, 8, 1.25) + circle(12.5, 8, 1.25) } },
  { name: "Grip", group: "Actions", draw: { fill: [3.5, 8, 12.5].map((y) => circle(6, y, 1.2) + circle(10, y, 1.2)).join("") } },
  { name: "Eye", group: "Actions", draw: { line: EYE + circle(8, 8, 2) } },
  { name: "EyeOff", group: "Actions", draw: { line: EYE + circle(8, 8, 2) + "M2.75 2.75l10.5 10.5" } },
  { name: "Lock", group: "Actions", draw: { line: rr(3, 7, 10, 7, 2) + "M5.5 7V5a2.5 2.5 0 0 1 5 0v2M8 10v1" } },
  { name: "Unlock", group: "Actions", draw: { line: rr(3, 7, 10, 7, 2) + "M5.5 7V5a2.5 2.5 0 0 1 4.9-.7M8 10v1" } },
  { name: "Star", group: "Actions", draw: { line: STAR } },
  { name: "Pin", group: "Actions", draw: { line: roundPoly([[5.5, 2.25], [10.5, 2.25], [10, 5.75], [12, 9], [4, 9], [6, 5.75]], 1) + "M8 9v4.75" } },

  /* Objects */
  { name: "File", group: "Objects", draw: { line: "M9.5 2h-4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V5zM9.5 2v2a1 1 0 0 0 1 1h2" } },
  { name: "Folder", group: "Objects", draw: { line: "M2 4.5a2 2 0 0 1 2-2h2.25l1.5 1.75H12a2 2 0 0 1 2 2v5.25a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" } },
  { name: "Image", group: "Objects", draw: { line: rr(2, 2.5, 12, 11, 2.5) + circle(5.75, 6.25, 1.25) + "M2.5 11 5.5 8l4 4M9 10.5l1.5-1.5 3 3" } },
  { name: "Play", group: "Objects", draw: { line: roundPoly([[5, 3], [5, 13], [13, 8]], 1.5) } },
  { name: "Pause", group: "Objects", draw: { line: rr(3.75, 3, 3, 10, 1.5) + rr(9.25, 3, 3, 10, 1.5) } },
  { name: "Stop", group: "Objects", draw: { line: rr(3.5, 3.5, 9, 9, 2.5) } },
  { name: "Code", group: "Objects", draw: { line: "M5.75 4 2.25 8l3.5 4M10.25 4l3.5 4-3.5 4" } },
  { name: "Terminal", group: "Objects", draw: { line: rr(2, 2.5, 12, 11, 2.5) + "M5 6l2 2-2 2M8.75 10.25h2.25" } },
  { name: "Monitor", group: "Objects", draw: { line: rr(2, 2.5, 12, 8.5, 2) + "M8 11v2.5M5.5 13.5h5" } },
  { name: "Globe", group: "Objects", draw: { line: RING + "M2 8h12M8 2a2.75 6 0 0 0 0 12 2.75 6 0 0 0 0-12z" } },
  { name: "Layers", group: "Objects", draw: { line: roundPoly([[8, 2.75], [14, 6], [8, 9.25], [2, 6]], 1) + "M2 10l6 3.25L14 10" } },
  { name: "Frame", group: "Objects", draw: { line: "M4.75 2v12M11.25 2v12M2 4.75h12M2 11.25h12" } },
  { name: "Cursor", group: "Objects", draw: { line: roundPoly([[3, 3], [6.75, 13.25], [8.25, 8.25], [13.25, 6.75]], 1) } },
  { name: "Grid", group: "Objects", draw: { line: rr(2.5, 2.5, 4.5, 4.5, 1.5) + rr(9, 2.5, 4.5, 4.5, 1.5) + rr(2.5, 9, 4.5, 4.5, 1.5) + rr(9, 9, 4.5, 4.5, 1.5) } },
  { name: "List", group: "Objects", draw: { line: "M6.5 4h7M6.5 8h7M6.5 12h7", fill: dots([3, 4], [3, 8], [3, 12]) } },
  { name: "Box", group: "Objects", draw: { line: roundPoly([[8, 2], [13.5, 5], [13.5, 11], [8, 14], [2.5, 11], [2.5, 5]], 1) + "M2.75 5.25 8 8l5.25-2.75M8 8v5.75" } },
  { name: "Database", group: "Objects", draw: { line: "M3 4.25c0-1.24 2.24-2.25 5-2.25s5 1.01 5 2.25-2.24 2.25-5 2.25S3 5.49 3 4.25zM3 4.25v7.5c0 1.24 2.24 2.25 5 2.25s5-1.01 5-2.25v-7.5M3 8c0 1.24 2.24 2.25 5 2.25S13 9.24 13 8" } },
  { name: "GitBranch", group: "Objects", draw: { line: circle(4.5, 3.75, 1.75) + circle(4.5, 12.25, 1.75) + circle(11.5, 3.75, 1.75) + "M4.5 5.5v5M11.5 5.5v.5a3 3 0 0 1-3 3h-1a3 3 0 0 0-3 3" } },
  { name: "Calendar", group: "Objects", draw: { line: rr(2, 3.25, 12, 10.5, 2.5) + "M2 7h12M5.5 2v2.25M10.5 2v2.25" } },

  /* Status and system */
  { name: "Info", group: "Status and system", draw: { line: RING + "M8 7.5v3.25", fill: dots([8, 5.25]) } },
  { name: "Alert", group: "Status and system", draw: { line: RING + "M8 4.75v3.5", fill: dots([8, 10.75]) } },
  { name: "CheckCircle", group: "Status and system", draw: { line: RING + "M5.5 8.25l1.75 1.75 3.25-3.5" } },
  { name: "XCircle", group: "Status and system", draw: { line: RING + "M6 6l4 4m0-4-4 4" } },
  { name: "Warning", group: "Status and system", draw: { line: roundPoly([[8, 2], [14, 13], [2, 13]], 1.75) + "M8 6.5v2.5", fill: dots([8, 10.9]) } },
  { name: "Help", group: "Status and system", draw: { line: RING + "M6.25 6.5a1.75 1.75 0 1 1 2.5 1.6c-.45.2-.75.65-.75 1.15", fill: dots([8, 11.25]) } },
  { name: "Bell", group: "Status and system", draw: { line: "M4.5 7a3.5 3.5 0 0 1 7 0v2.5c0 .9.4 1.6 1.25 2.25H3.25C4.1 11.1 4.5 10.4 4.5 9.5zM6.75 13.75h2.5" } },
  { name: "Clock", group: "Status and system", draw: { line: RING + "M8 4.75V8l2.25 1.5" } },
  { name: "History", group: "Status and system", draw: { line: "M3 8a5 5 0 1 0 1.46-3.54M3 2.5v3h3M8 5.5V8l1.75 1.25" } },
  { name: "Zap", group: "Status and system", draw: { line: roundPoly([[9, 1.75], [3.25, 9.25], [8, 9.25], [7, 14.25], [12.75, 6.75], [8, 6.75]], 0.75) } },
  { name: "Activity", group: "Status and system", draw: { line: "M2 8h2.25l2-5 3.5 10 2-5H14" } },
  { name: "Shield", group: "Status and system", draw: { line: "M8 2 13 3.75v4c0 3-2.1 5-5 6.25C5.1 12.75 3 10.75 3 7.75v-4z" } },
  { name: "Key", group: "Status and system", draw: { line: circle(5.25, 10.75, 3) + "M7.4 8.6 13.25 2.75M11.25 4.75l1.75 1.75M9.5 6.5l1.25 1.25" } },
  { name: "Flag", group: "Status and system", draw: { line: "M3.5 14V3M3.5 3.25c3-1.5 5 1 9 0v6.25c-4 1-6-1.5-9 0" } },
  { name: "Cloud", group: "Status and system", draw: { line: "M4.5 12.5a3 3 0 0 1-.4-5.97A3.75 3.75 0 0 1 11 6.5a3 3 0 0 1 0 6z" } },
  { name: "Sun", group: "Status and system", draw: { line: circle(8, 8, 2.75) + "M8 2.25v1M8 12.75v1M2.25 8h1M12.75 8h1M3.93 3.93l.7.7M11.37 11.37l.7.7M3.93 12.07l.7-.7M11.37 4.63l.7-.7" } },
  { name: "Moon", group: "Status and system", draw: { line: "M13.25 9.4A5.5 5.5 0 0 1 6.6 2.75 5.5 5.5 0 1 0 13.25 9.4z" } },
  { name: "Sparkle", group: "Status and system", draw: { line: "M8 2c.5 3.2 2.8 5.5 6 6-3.2.5-5.5 2.8-6 6-.5-3.2-2.8-5.5-6-6 3.2-.5 5.5-2.8 6-6z" } },
  { name: "Lightbulb", group: "Status and system", draw: { line: "M6 11v-.5c0-.9-.45-1.4-1-2A3.75 3.75 0 1 1 11 8.5c-.55.6-1 1.1-1 2v.5zM6.25 13.5h3.5" } },

  /* People and data */
  { name: "User", group: "People and data", draw: { line: circle(8, 5.5, 2.75) + "M3 13.5c.7-2.3 2.7-3.75 5-3.75s4.3 1.45 5 3.75" } },
  { name: "Users", group: "People and data", draw: { line: circle(6, 5.75, 2.5) + "M1.75 13.25c.6-2.1 2.2-3.25 4.25-3.25s3.65 1.15 4.25 3.25M10.5 3.5a2.5 2.5 0 0 1 0 4.75M11.75 10.25c1.25.4 2.1 1.4 2.5 3" } },
  { name: "Building", group: "People and data", draw: { line: rr(3.5, 2, 9, 12, 2) + "M6.75 14v-2a1.25 1.25 0 0 1 2.5 0v2", fill: dots([6.25, 5], [9.75, 5], [6.25, 8.25], [9.75, 8.25]) } },
  { name: "Mail", group: "People and data", draw: { line: rr(2, 3.5, 12, 9, 2.5) + "M4.5 6.25 8 9l3.5-2.75" } },
  { name: "Inbox", group: "People and data", draw: { line: "M2 8.5v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3L12 4a2 2 0 0 0-1.8-1.25H5.8A2 2 0 0 0 4 4zM2 8.5h3l1 1.5h4l1-1.5h3" } },
  { name: "Message", group: "People and data", draw: { line: "M4.5 2.75h7A2.5 2.5 0 0 1 14 5.25v4a2.5 2.5 0 0 1-2.5 2.5H7.5l-3 2.25v-2.25A2.5 2.5 0 0 1 2 9.25v-4a2.5 2.5 0 0 1 2.5-2.5z" } },
  { name: "AtSign", group: "People and data", draw: { line: circle(8, 8, 2.5) + "M10.5 5.5v3.25a1.75 1.75 0 0 0 3.5 0V8a6 6 0 1 0-2.35 4.77" } },
  { name: "Hash", group: "People and data", draw: { line: "M6.75 2.75 5.25 13.25M10.75 2.75l-1.5 10.5M2.75 6h10.5M2.75 10h10.5" } },
  { name: "Command", group: "People and data", draw: { line: "M9.75 4.75v6.5a1.75 1.75 0 1 0 1.75-1.75h-7a1.75 1.75 0 1 0 1.75 1.75v-6.5A1.75 1.75 0 1 0 4.5 6.5h7a1.75 1.75 0 1 0-1.75-1.75z" } },
  { name: "ChartBar", group: "People and data", draw: { line: "M3.75 13v-4M8 13V3.5M12.25 13V6.5" } },
  { name: "ChartLine", group: "People and data", draw: { line: "M2.5 2.5v9a2 2 0 0 0 2 2h9M5.5 10 8 7l2.5 2 3-4" } },
  { name: "ChartPie", group: "People and data", draw: { line: "M7 4a5 5 0 1 0 5 5H7zM9.5 2a4.5 4.5 0 0 1 4.5 4.5H9.5z" } },
  { name: "TrendUp", group: "People and data", draw: { line: "m2 11.5 4.25-4.25 2.5 2.5L14 4.5M10.5 4.5H14V8" } },
  { name: "TrendDown", group: "People and data", draw: { line: "m2 4.5 4.25 4.25 2.5-2.5L14 11.5M10.5 11.5H14V8" } },
  { name: "CreditCard", group: "People and data", draw: { line: rr(2, 3.5, 12, 9, 2.5) + "M2 6.75h12M4.75 10h2" } },
  { name: "Bag", group: "People and data", draw: { line: "M3.5 5.5h9l-.6 6.6a2 2 0 0 1-2 1.9H6.1a2 2 0 0 1-2-1.9zM5.75 5.5v-1a2.25 2.25 0 0 1 4.5 0v1" } },

  /* Steps: StatusIcon's five marks */
  { name: "Status pending", group: "Steps", draw: { line: RING } },
  { name: "Status running", group: "Steps", draw: { line: RING, fill: "M8 4.5a3.5 3.5 0 0 1 0 7z" } },
  { name: "Status skipped", group: "Steps", draw: { dash: RING } },
  { name: "Status done", group: "Steps", draw: { line: RING + "M5.5 8.25l1.75 1.75 3.25-3.5" } },
  { name: "Status failed", group: "Steps", draw: { line: RING + "M6 6l4 4m0-4-4 4" } },

  /* Fun, for Flat's voice (a small site, a newsletter and its readers) */
  { name: "Post", group: "Fun, for Flat's voice", draw: { line: rr(3, 2, 10, 12, 2.5) + "M5.75 5.5h4.5M5.75 8h4.5M5.75 10.5h2.5" } },
  { name: "Issue", group: "Fun, for Flat's voice", draw: { line: "M2.5 4a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v9.5h-7a2 2 0 0 1-2-2zM11.5 6h1a1.5 1.5 0 0 1 1.5 1.5V12a1.5 1.5 0 0 1-3 0M5 5.25h4M5 8h4M5 10.5h2" } },
  { name: "Reader", group: "Fun, for Flat's voice", draw: { line: "M8 4.25C6.75 3.25 4.75 3 2.5 3.25v9c2.25-.25 4.25 0 5.5 1 1.25-1 3.25-1.25 5.5-1v-9C11.25 3 9.25 3.25 8 4.25zM8 4.25v9" } },
  { name: "Bookmark", group: "Fun, for Flat's voice", draw: { line: "M4 3.5A1.5 1.5 0 0 1 5.5 2h5A1.5 1.5 0 0 1 12 3.5V14l-4-2.75L4 14z" } },
  { name: "Coffee", group: "Fun, for Flat's voice", draw: { line: "M2.75 6.5h8.5V10a3.5 3.5 0 0 1-3.5 3.5h-1.5A3.5 3.5 0 0 1 2.75 10zM11.25 7.5h.75a1.75 1.75 0 0 1 0 3.5h-.9M5.5 2.5c-.6.75-.6 1.5 0 2.25M8.5 2.5c-.6.75-.6 1.5 0 2.25" } },
  { name: "Heart", group: "Fun, for Flat's voice", draw: { line: "M8 13.25S2 10 2 6.1a3.1 3.1 0 0 1 6-1.5 3.1 3.1 0 0 1 6 1.5c0 3.9-6 7.15-6 7.15z" } },
  { name: "Spark", group: "Fun, for Flat's voice", draw: { line: "M8 2v2.5M8 11.5V14M2 8h2.5M11.5 8H14M3.75 3.75l1.75 1.75M10.5 10.5l1.75 1.75M3.75 12.25 5.5 10.5M10.5 5.5l1.75-1.75" } },
  { name: "Ghost", group: "Fun, for Flat's voice", draw: { line: "M3.5 13.5V7a4.5 4.5 0 0 1 9 0v6.5l-1.5-1.25-1.5 1.25-1.5-1.25-1.5 1.25L5 12.25z", fill: dots([6.5, 7.25], [9.5, 7.25]) } },
  { name: "Paw", group: "Fun, for Flat's voice", draw: { line: "M5 11.25c0-1.75 1.35-3 3-3s3 1.25 3 3c0 1.25-1 1.75-1.75 1.75-.5 0-.75-.25-1.25-.25s-.75.25-1.25.25C6 13 5 12.5 5 11.25z", fill: circle(3.75, 7.75, 1.3) + circle(6.25, 4.5, 1.3) + circle(9.75, 4.5, 1.3) + circle(12.25, 7.75, 1.3) } },
  { name: "Smiley", group: "Fun, for Flat's voice", draw: { line: RING + "M5.5 9.5a3 3 0 0 0 5 0", fill: dots([6, 6.75], [10, 6.75]) } },
];

const BY_NAME = new Map(SET.map((icon) => [icon.name, icon.draw]));
/** How many of icons.tsx's 99 named icons the trial draws (all of them), and the fun extras. */
export const COUNTS = { named: SET.filter((i) => i.group !== "Steps" && i.group !== "Fun, for Flat's voice").length, steps: 5, fun: 10 };

type FlatIconProps = SVGProps<SVGSVGElement> & { name: string; size?: number };

/** One fun icon by its name. Same shape as icons.tsx's Icon: 16-unit grid, currentColor, aria-hidden. */
export function FlatIcon({ name, size = 16, ...rest }: FlatIconProps) {
  const draw = BY_NAME.get(name) ?? {};
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={STROKE}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {draw.line && <path d={draw.line} />}
      {draw.dash && <path d={draw.dash} strokeDasharray="0.01 4.7" />}
      {draw.fill && <path d={draw.fill} fill="currentColor" stroke="none" />}
    </svg>
  );
}

/* ---------------------------------------------------------------- item 1: the set */

const GROUPS = [...new Set(SET.map((i) => i.group))];

function SetFrame({ dark }: { dark: boolean }) {
  return (
    <FlatFrame dark={dark} call="ground paper">
      {GROUPS.map((group) => (
        <section key={group} aria-label={group} className="grid gap-3">
          <h3 className="text-small font-title text-fg">{group}</h3>
          <ul className="grid grid-cols-8 gap-x-2 gap-y-4">
            {SET.filter((i) => i.group === group).map((icon) => (
              <li key={icon.name} className="grid justify-items-center gap-2">
                <FlatIcon name={icon.name} size={24} />
                <span className="max-w-full truncate text-caption text-fg-subtle">{icon.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </FlatFrame>
  );
}

export function FlatIconSet() {
  return (
    <div className="grid gap-6">
      <p className="max-w-(--measure) text-small text-fg-subtle">
        Every icon at 24px with its name: all {COUNTS.named} of today's named icons, StatusIcon's five marks and {COUNTS.fun} fun ones for
        Flat's voice. One 1.75 stroke, round caps and joins, every corner rounded. Ink on Flat's ground, light over dark.
      </p>
      <SetFrame dark={false} />
      <SetFrame dark />
    </div>
  );
}

/* ---------------------------------------------------------------- item 2: today and fun, side by side */

/** The 24 icons the gallery uses most (by count of uses in gallery/src). */
const COMMON = [
  "Check", "Copy", "Plus", "Folder", "ChevronDown", "File", "Share", "Settings", "ChevronRight", "Trash", "Retry", "Search",
  "ArrowUpRight", "Archive", "More", "ArrowUp", "Alert", "Sliders", "User", "CheckCircle", "Stop", "Minus", "Calendar", "Play",
];
const TODAY = Today as unknown as Record<string, (p: { size?: number }) => ReactNode>;

function PairsFrame({ dark }: { dark: boolean }) {
  return (
    <FlatFrame dark={dark} call="ground paper">
      <ul className="grid grid-cols-4 gap-x-6 gap-y-5">
        {COMMON.map((name) => {
          const Old = TODAY[`${name}Icon`];
          return (
            <li key={name} className="grid gap-2">
              <span className="text-caption text-fg-subtle">{name}</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2" title="Today">
                  <Old size={16} />
                  <Old size={24} />
                </span>
                <span className="text-caption text-fg-subtle">→</span>
                <span className="flex items-center gap-2" title="Fun">
                  <FlatIcon name={name} size={16} />
                  <FlatIcon name={name} size={24} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </FlatFrame>
  );
}

export function FlatIconPairs() {
  return (
    <div className="grid gap-6">
      <p className="max-w-(--measure) text-small text-fg-subtle">
        The 24 icons the gallery uses most: today's solid set on the left of each arrow, the fun set on the right, each at 16 and 24.
        Light over dark.
      </p>
      <PairsFrame dark={false} />
      <PairsFrame dark />
    </div>
  );
}

/* ---------------------------------------------------------------- item 3: in use */

const I = ({ n: name }: { n: string }) => <FlatIcon name={name} size={16} />;

function UseFrame({ dark }: { dark: boolean }) {
  const which = dark ? "dark" : "light";
  const [saved, setSaved] = useState(false);
  return (
    <FlatFrame dark={dark} call="ground paper">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" icon={<I n="Send" />}>Send issue 14</Button>
        <Button icon={<I n="Edit" />}>Edit draft</Button>
        <Button variant="ghost" iconRight={<I n="ArrowUpRight" />}>Read the letter</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button iconOnly aria-label={saved ? `Saved, ${which}` : `Save, ${which}`} aria-pressed={saved} onClick={() => setSaved((s) => !s)}>
          <I n={saved ? "Bookmark" : "Heart"} />
        </Button>
        <Button iconOnly aria-label={`Share, ${which}`}>
          <I n="Share" />
        </Button>
        <Menu label={`Post actions, ${which}`} align="start" trigger={<Button iconOnly aria-label={`Post actions, ${which}`}><I n="More" /></Button>}>
          <MenuItem icon={<I n="Edit" />} onSelect={() => {}}>Edit post</MenuItem>
          <MenuItem icon={<I n="Copy" />} onSelect={() => {}}>Duplicate</MenuItem>
          <MenuItem icon={<I n="Link" />} onSelect={() => {}}>Copy link</MenuItem>
          <MenuItem icon={<I n="Archive" />} onSelect={() => {}}>Archive</MenuItem>
          <MenuItem icon={<I n="Trash" />} destructive onSelect={() => {}}>Delete</MenuItem>
        </Menu>
        <span className="text-small text-fg-subtle">The last one opens a menu with an icon on every row.</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-surface bg-surface-1 p-3">
          <SidebarNav label={`Site, ${which}`}>
            <SidebarLink as="button" type="button" current icon={<I n="Home" />}>Home</SidebarLink>
            <SidebarLink as="button" type="button" icon={<I n="Post" />}>Posts</SidebarLink>
            <SidebarLink as="button" type="button" icon={<I n="Issue" />}>Issues</SidebarLink>
            <SidebarLink as="button" type="button" icon={<I n="Reader" />}>Readers</SidebarLink>
            <SidebarLink as="button" type="button" icon={<I n="Settings" />}>Settings</SidebarLink>
          </SidebarNav>
        </div>
        <div className="grid content-start gap-4">
          <Tabs defaultValue="posts" variant="segmented" size="sm">
            <TabsList aria-label={`Show, ${which}`}>
              <TabsTrigger value="posts"><span className="inline-flex items-center gap-2"><I n="Post" />Posts</span></TabsTrigger>
              <TabsTrigger value="issues"><span className="inline-flex items-center gap-2"><I n="Issue" />Issues</span></TabsTrigger>
              <TabsTrigger value="readers"><span className="inline-flex items-center gap-2"><I n="Reader" />Readers</span></TabsTrigger>
            </TabsList>
            <TabsPanels className="pt-3">
              <TabsPanel value="posts"><p className="text-small text-fg-muted">Spring series · twelve pictures from the coast</p></TabsPanel>
              <TabsPanel value="issues"><p className="text-small text-fg-muted">Issue 14 goes out Friday at 9:00</p></TabsPanel>
              <TabsPanel value="readers"><p className="text-small text-fg-muted">1,204 readers this week</p></TabsPanel>
            </TabsPanels>
          </Tabs>
          <span className="text-caption text-fg-subtle">Tabs take words only; the icon rides in the label's children.</span>
          <Callout icon={<I n="Coffee" />} title="Issue 14 goes out Friday at 9:00" description="4 min read, 1,204 readers this week." />
        </div>
      </div>
      <Empty title="No drafts yet" action={<Button icon={<I n="Plus" />}>New post</Button>}>
        A draft waits here until you send it.
      </Empty>
      <span className="text-caption text-fg-subtle">Empty draws no icon by its own rule (no illustration); its action carries one.</span>
      <Toaster>
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={<I n="Clock" />} onClick={() => toast({ title: "Issue 14 goes out Friday at 9:00", description: "1,204 readers will get it." })}>
            Schedule issue
          </Button>
          <span className="text-small text-fg-subtle">The toast takes no icon; its close button draws today's X from inside the part.</span>
        </div>
      </Toaster>
    </FlatFrame>
  );
}

export function FlatIconsInUse() {
  return (
    <div className="grid gap-6">
      <p className="max-w-(--measure) text-small text-fg-subtle">
        Real Flat parts with the fun set through their public props: buttons, icon-only buttons, a menu, a nav list, tabs, a callout,
        an empty state and the toast. Light over dark. Menus and toasts open in the gallery's own Flat, at its theme.
      </p>
      <UseFrame dark={false} />
      <UseFrame dark />
    </div>
  );
}

/* ---------------------------------------------------------------- item 4: the composition */

/** Where each icon sits in the mood piece: x and y in px, its size and its tilt. Placed by hand, loose, never on a grid. */
const SCATTER: { name: string; x: number; y: number; size: number; tilt: number }[] = [
  { name: "Send", x: 60, y: 90, size: 64, tilt: -8 },
  { name: "Grid", x: 210, y: 40, size: 48, tilt: 6 },
  { name: "Sparkle", x: 150, y: 260, size: 56, tilt: 12 },
  { name: "Heart", x: 330, y: 170, size: 80, tilt: -6 },
  { name: "Ghost", x: 300, y: 380, size: 72, tilt: 9 },
  { name: "Message", x: 480, y: 80, size: 72, tilt: -4 },
  { name: "Coffee", x: 560, y: 300, size: 88, tilt: 7 },
  { name: "Lightbulb", x: 690, y: 60, size: 64, tilt: 5 },
  { name: "Paw", x: 840, y: 150, size: 72, tilt: -10 },
  { name: "Mail", x: 760, y: 420, size: 64, tilt: -7 },
  { name: "Smiley", x: 460, y: 470, size: 64, tilt: -3 },
  { name: "Bell", x: 930, y: 330, size: 56, tilt: 11 },
  { name: "Cloud", x: 110, y: 470, size: 72, tilt: -5 },
  { name: "Reader", x: 960, y: 520, size: 48, tilt: 4 },
  { name: "Star", x: 640, y: 560, size: 40, tilt: 14 },
  { name: "Globe", x: 990, y: 50, size: 56, tilt: 0 },
  { name: "Post", x: 230, y: 580, size: 44, tilt: 8 },
  { name: "Spark", x: 420, y: 30, size: 36, tilt: 0 },
  { name: "Bookmark", x: 860, y: 600, size: 40, tilt: -12 },
  { name: "Search", x: 30, y: 620, size: 40, tilt: -9 },
];

export function FlatIconComposition() {
  return (
    <div className="grid gap-6">
      <p className="max-w-(--measure) text-small text-fg-subtle">
        A mood piece: the fun set scattered loose and tilted a few degrees, a few large, on Flat's ground. Static.
      </p>
      <FlatFrame dark={false} call="ground paper">
        <div aria-hidden="true" className="relative h-[680px]">
          {SCATTER.map(({ name, x, y, size, tilt }) => (
            <FlatIcon key={name} name={name} size={size} style={{ position: "absolute", left: x, top: y, transform: `rotate(${tilt}deg)` } as CSSProperties} />
          ))}
        </div>
      </FlatFrame>
    </div>
  );
}
