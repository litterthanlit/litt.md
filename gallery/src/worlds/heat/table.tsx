/**
 * Table, Heat's dress (proposals/heat.md; taste/litt-principles.md, Heat): a street-racing standings slab.
 *
 * - Square black slab (`rounded-none border border-line-strong bg-canvas`), topped by a diagonal hazard-stripe header
 *   band (`bg-surface-1` + 135deg stripes).
 * - Crisp 1px `--line` rows; hover fills `--surface-1`; selected rows light up in `--block` with amber primary words
 *   (never an accent fill on a row, R6).
 * - Sticky columns keep opaque slab backgrounds so scrolled cells never bleed through.
 * - Instant snap (`travels: false`): rows cut in where they stand.
 */
import type { TableDress } from "@/components/table";

const STRIPES = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

export const tableHeatDress: TableDress = {
  region: "rounded-none border border-line-strong bg-canvas",
  head: "border-b border-line-strong bg-surface-1 text-caption font-label text-fg " + STRIPES,
  selectHead: "border-b border-line-strong",
  row: "group/row transition-[background-color,color] duration-(--dur-instant) ease-litt hover:bg-surface-1 data-selected:bg-block [-webkit-tap-highlight-color:transparent]",
  cell: "border-b border-line",
  primary: "text-fg group-data-selected/row:text-accent-text",
  secondary: "text-fg-subtle",
  skeleton: "border-b border-line",
  bar: "rounded-none bg-surface-2",
  error: "border-b border-line",
  alert: "text-fg-subtle",
  retry: "secondary",
  empty: "text-fg-muted",
  sticky1: [
    "[&_tr>*:first-child]:sticky [&_tr>*:first-child]:start-0",
    "[&_thead_tr>*:first-child]:z-20 [&_tbody_tr>*:first-child]:z-1 [&_tbody_tr>*:first-child]:bg-canvas",
    "[&_tbody_tr:hover>*:first-child]:bg-surface-1 [&_tbody_tr[data-selected]>*:first-child]:bg-block",
    "[&_tr>*:first-child]:after:pointer-events-none [&_tr>*:first-child]:after:absolute [&_tr>*:first-child]:after:inset-y-0 [&_tr>*:first-child]:after:end-0",
    "[&_tr>*:first-child]:after:w-px [&_tr>*:first-child]:after:bg-line [&_tr>*:first-child]:after:opacity-0 data-scrolled:[&_tr>*:first-child]:after:opacity-100",
  ].join(" "),
  sticky2: [
    "[&_tr>*:nth-child(-n+2)]:sticky [&_tr>*:first-child]:start-0 [&_tr>*:nth-child(2)]:start-(--sticky-2)",
    "[&_thead_tr>*:nth-child(-n+2)]:z-20 [&_tbody_tr>*:nth-child(-n+2)]:z-1 [&_tbody_tr>*:nth-child(-n+2)]:bg-canvas",
    "[&_tbody_tr:hover>*:nth-child(-n+2)]:bg-surface-1 [&_tbody_tr[data-selected]>*:nth-child(-n+2)]:bg-block",
    "[&_tr>*:nth-child(2)]:after:pointer-events-none [&_tr>*:nth-child(2)]:after:absolute [&_tr>*:nth-child(2)]:after:inset-y-0 [&_tr>*:nth-child(2)]:after:end-0",
    "[&_tr>*:nth-child(2)]:after:w-px [&_tr>*:nth-child(2)]:after:bg-line [&_tr>*:nth-child(2)]:after:opacity-0 data-scrolled:[&_tr>*:nth-child(2)]:after:opacity-100",
  ].join(" "),
  travels: false,
};
