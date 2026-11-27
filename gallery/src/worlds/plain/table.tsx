/**
 * Table, Plain's dress (taste v1.23, proposals/plain-studies.md): a frameless document table bare on white paper with
 * two weights of horizontal rule.
 *
 * - No outer 4-sided box, no Press slats, no rounded corners: `region` sits bare on `--canvas`.
 * - Two weights of horizontal rule, as in a typeset table (`systems/plain.tsx`, `06-data-table.js`): `1px`
 *   `--line-control` under the column headers, and `1px` `--line` between rows.
 * - Hover and selection wash `--surface-2` subtly at `--dur-instant`, keeping primary text in `--fg`.
 * - Sticky columns hold an opaque `--canvas` ground so scrolling columns never bleed underneath.
 * - `travels: true` runs row entrances and filter paring on Plain's zero-bounce Subtraction tiers.
 */
import type { TableDress } from "@/components/table";

export const tablePlainDress: TableDress = {
  region: "rounded-none border-0 bg-canvas",
  head: "border-b border-line-control bg-canvas text-caption font-label text-fg",
  selectHead: "border-b border-line-control",
  row: "group/row transition-[background-color] duration-(--dur-instant) ease-litt hover:bg-surface-2 data-selected:bg-surface-2 [-webkit-tap-highlight-color:transparent]",
  cell: "border-b border-line",
  primary: "text-fg",
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
    "[&_tbody_tr>*:first-child]:transition-[background-color] [&_tbody_tr>*:first-child]:duration-(--dur-instant) [&_tbody_tr>*:first-child]:ease-litt",
    "[&_tbody_tr:hover>*:first-child]:bg-surface-2 [&_tbody_tr[data-selected]>*:first-child]:bg-surface-2",
    "[&_tr>*:first-child]:after:pointer-events-none [&_tr>*:first-child]:after:absolute [&_tr>*:first-child]:after:inset-y-0 [&_tr>*:first-child]:after:end-0",
    "[&_tr>*:first-child]:after:w-px [&_tr>*:first-child]:after:bg-line [&_tr>*:first-child]:after:opacity-0 data-scrolled:[&_tr>*:first-child]:after:opacity-100",
  ].join(" "),
  sticky2: [
    "[&_tr>*:nth-child(-n+2)]:sticky [&_tr>*:first-child]:start-0 [&_tr>*:nth-child(2)]:start-(--sticky-2)",
    "[&_thead_tr>*:nth-child(-n+2)]:z-20 [&_tbody_tr>*:nth-child(-n+2)]:z-1 [&_tbody_tr>*:nth-child(-n+2)]:bg-canvas",
    "[&_tbody_tr>*:nth-child(-n+2)]:transition-[background-color] [&_tbody_tr>*:nth-child(-n+2)]:duration-(--dur-instant) [&_tbody_tr>*:nth-child(-n+2)]:ease-litt",
    "[&_tbody_tr:hover>*:nth-child(-n+2)]:bg-surface-2 [&_tbody_tr[data-selected]>*:nth-child(-n+2)]:bg-surface-2",
    "[&_tr>*:nth-child(2)]:after:pointer-events-none [&_tr>*:nth-child(2)]:after:absolute [&_tr>*:nth-child(2)]:after:inset-y-0 [&_tr>*:nth-child(2)]:after:end-0",
    "[&_tr>*:nth-child(2)]:after:w-px [&_tr>*:nth-child(2)]:after:bg-line [&_tr>*:nth-child(2)]:after:opacity-0 data-scrolled:[&_tr>*:nth-child(2)]:after:opacity-100",
  ].join(" "),
  travels: true,
};
