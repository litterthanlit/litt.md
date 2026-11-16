/**
 * Table, the Rack dress (proposals/rack.md): a list in an instrument's browser. One flat panel, thin rows.
 *
 * - The region is one panel (surface-1) inside a 1px edge of --line-strong, at the surface radius. No tray, no slats.
 * - The header is a darker strip (surface-3) with the label type, its rule --line-strong.
 * - Rows are thin: each cell keeps the table's padding and a 1px --line rule under it, so a row is the same height as
 *   in every world, and nothing stands up. Under the hand a row fills surface-2; selected, surface-3. Never the accent:
 *   the yellow lights a switch, not a row (R6).
 * - Sticky columns fill surface-1, and the row's fill with it, so nothing scrolls through them.
 * - Rows appear where they stand (Rack: things are there on the frame, R4): no entrance cascade, no travel.
 */
import type { TableDress } from "@/components/table";

export const tableRackDress: TableDress = {
  region: "rounded-surface border border-line-strong bg-surface-1",
  head: "border-b border-line-strong bg-surface-3 text-caption font-label litt-legend",
  selectHead: "border-b border-line-strong",
  row: "group/row transition-[background-color] duration-(--dur-instant) ease-litt hover:bg-surface-2 data-selected:bg-surface-3 [-webkit-tap-highlight-color:transparent]",
  cell: "border-b border-line",
  primary: "text-fg",
  secondary: "text-fg-subtle",
  skeleton: "border-b border-line",
  bar: "rounded-control bg-surface-2",
  error: "border-b border-line",
  alert: "text-fg-subtle",
  retry: "secondary",
  empty: "text-fg-muted",
  sticky1: [
    "[&_tr>*:first-child]:sticky [&_tr>*:first-child]:start-0",
    "[&_thead_tr>*:first-child]:z-20 [&_tbody_tr>*:first-child]:z-1 [&_tbody_tr>*:first-child]:bg-surface-1",
    "[&_tbody_tr:hover>*:first-child]:bg-surface-2 [&_tbody_tr[data-selected]>*:first-child]:bg-surface-3",
    "[&_tr>*:first-child]:after:pointer-events-none [&_tr>*:first-child]:after:absolute [&_tr>*:first-child]:after:inset-y-0 [&_tr>*:first-child]:after:end-0",
    "[&_tr>*:first-child]:after:w-px [&_tr>*:first-child]:after:bg-line [&_tr>*:first-child]:after:opacity-0 data-scrolled:[&_tr>*:first-child]:after:opacity-100",
  ].join(" "),
  sticky2: [
    "[&_tr>*:nth-child(-n+2)]:sticky [&_tr>*:first-child]:start-0 [&_tr>*:nth-child(2)]:start-(--sticky-2)",
    "[&_thead_tr>*:nth-child(-n+2)]:z-20 [&_tbody_tr>*:nth-child(-n+2)]:z-1 [&_tbody_tr>*:nth-child(-n+2)]:bg-surface-1",
    "[&_tbody_tr:hover>*:nth-child(-n+2)]:bg-surface-2 [&_tbody_tr[data-selected]>*:nth-child(-n+2)]:bg-surface-3",
    "[&_tr>*:nth-child(2)]:after:pointer-events-none [&_tr>*:nth-child(2)]:after:absolute [&_tr>*:nth-child(2)]:after:inset-y-0 [&_tr>*:nth-child(2)]:after:end-0",
    "[&_tr>*:nth-child(2)]:after:w-px [&_tr>*:nth-child(2)]:after:bg-line [&_tr>*:nth-child(2)]:after:opacity-0 data-scrolled:[&_tr>*:nth-child(2)]:after:opacity-100",
  ].join(" "),
  travels: false,
};
