/**
 * Table, the Flat dress (proposals/worlds.md, Bodies): the table on the page, as it has always been in Flat.
 *
 * - No frame and no rules: the region's hairline and every row's line are transparent, so the rows sit on the page.
 * - The header is grey label type. A row is a grey bubble under the hand: the row itself stays clear and its cells take
 *   surface-3 on hover and selection, the first and last cell rounded, so the bubble's ends are round.
 * - Sticky columns fill surface-1, and surface-3 with the bubble, so nothing scrolls through them.
 * - Rows travel as in Press: the entrance cascade and the change motion are the table's own.
 */
import type { TableDress } from "../table";

export const tableFlatDress: TableDress = {
  region: "rounded-surface border border-transparent bg-surface-1",
  head: "border-b border-transparent bg-surface-1 text-caption font-label litt-legend",
  selectHead: "group-hover/row:bg-surface-3 group-data-selected/row:bg-surface-3 first:rounded-l-control last:rounded-r-control border-b border-transparent",
  /* The bubble is painted on the cells so its ends can round; the row itself stays clear. */
  row: "group/row transition-[background-color] duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent]",
  cell: "border-b border-transparent group-hover/row:bg-surface-3 group-data-selected/row:bg-surface-3 first:rounded-l-control last:rounded-r-control",
  primary: "text-fg",
  secondary: "text-fg-subtle",
  skeleton: "border-b border-transparent",
  bar: "rounded-control bg-surface-2",
  error: "border-b border-transparent",
  alert: "text-fg-subtle",
  retry: "ghost",
  empty: "text-fg-muted",
  sticky1: [
    "[&_tr>*:first-child]:sticky [&_tr>*:first-child]:start-0",
    "[&_thead_tr>*:first-child]:z-20 [&_tbody_tr>*:first-child]:z-1 [&_tbody_tr>*:first-child]:bg-surface-1",
    "[&_tbody_tr>*:first-child]:transition-[background-color] [&_tbody_tr>*:first-child]:duration-(--dur-instant) [&_tbody_tr>*:first-child]:ease-litt",
    "[&_tbody_tr:hover>*:first-child]:bg-surface-3 [&_tbody_tr[data-selected]>*:first-child]:bg-surface-3",
    "[&_tr>*:first-child]:after:pointer-events-none [&_tr>*:first-child]:after:absolute [&_tr>*:first-child]:after:inset-y-0 [&_tr>*:first-child]:after:end-0",
    "[&_tr>*:first-child]:after:w-px [&_tr>*:first-child]:after:bg-line [&_tr>*:first-child]:after:opacity-0 data-scrolled:[&_tr>*:first-child]:after:opacity-100",
  ].join(" "),
  sticky2: [
    "[&_tr>*:nth-child(-n+2)]:sticky [&_tr>*:first-child]:start-0 [&_tr>*:nth-child(2)]:start-(--sticky-2)",
    "[&_thead_tr>*:nth-child(-n+2)]:z-20 [&_tbody_tr>*:nth-child(-n+2)]:z-1 [&_tbody_tr>*:nth-child(-n+2)]:bg-surface-1",
    "[&_tbody_tr>*:nth-child(-n+2)]:transition-[background-color] [&_tbody_tr>*:nth-child(-n+2)]:duration-(--dur-instant) [&_tbody_tr>*:nth-child(-n+2)]:ease-litt",
    "[&_tbody_tr:hover>*:nth-child(-n+2)]:bg-surface-3 [&_tbody_tr[data-selected]>*:nth-child(-n+2)]:bg-surface-3",
    "[&_tr>*:nth-child(2)]:after:pointer-events-none [&_tr>*:nth-child(2)]:after:absolute [&_tr>*:nth-child(2)]:after:inset-y-0 [&_tr>*:nth-child(2)]:after:end-0",
    "[&_tr>*:nth-child(2)]:after:w-px [&_tr>*:nth-child(2)]:after:bg-line [&_tr>*:nth-child(2)]:after:opacity-0 data-scrolled:[&_tr>*:nth-child(2)]:after:opacity-100",
  ].join(" "),
  travels: true,
};
