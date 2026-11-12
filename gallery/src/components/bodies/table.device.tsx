/**
 * Table, the Device dress (proposals/worlds.md, Bodies): a screen of mono columns.
 *
 * - The region is LCD glass (--field, its line and shade) at the surface radius. The cells are the mono (font-field) in
 *   the glass's ink, the row's name full and the rest in --field-ink-subtle; numbers stay tabular and right-aligned.
 *   A faint hairline of the ink (12%) parts the rows, where the other worlds keep their 1px rule, so every row keeps its
 *   height; --field-line was too loud between rows on the dark glass.
 * - The header is engraved on the bezel: litt-legend capitals in grey on a plate strip (--block) across the top of the
 *   glass, sticky and opaque, so the rows pass under it.
 * - Each row starts with a lamp, a ::before in the first cell's padding (never a column): a dim dot at rest, lit in the
 *   glass's ink for the row under the pointer, the row the keyboard is in and a selected row. The row's highlight is a
 *   tint of the ink behind it that switches in place on the instant tier.
 * - Sticky columns are the glass, opaque, tinted with the row; their edge is a --field-line hairline.
 * - A skeleton is a dim bar of the ink on the glass; the failed page's Retry is a key, since a ghost's grey words would
 *   sink into the glass.
 * - Rows never travel or fade (R4: Device switches where it stands). With `entrance` or `animateChanges` they appear.
 * - Forced colors drops fills and shadows: the glass keeps a real border, a lit lamp is Highlight and an unlit one an
 *   outline.
 */
import type { TableDress } from "../table";

export const tableDeviceDress: TableDress = {
  region:
    "rounded-surface border border-transparent bg-field bg-clip-padding shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)] forced-colors:border-[CanvasText]",
  head: "border-b border-field-line bg-block text-caption font-label litt-legend",
  selectHead: "",
  row:
    "group/row transition-[background-color] duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
    "hover:bg-[color-mix(in_oklab,var(--field-ink)_10%,var(--field))] has-[:focus-visible]:bg-[color-mix(in_oklab,var(--field-ink)_10%,var(--field))] " +
    "pointer-coarse:active:bg-[color-mix(in_oklab,var(--field-ink)_16%,var(--field))] " +
    "data-selected:bg-[color-mix(in_oklab,var(--field-ink)_16%,var(--field))]",
  cell:
    "border-b border-[color-mix(in_oklab,var(--field-ink)_12%,transparent)] font-field " +
    "first:relative first:before:absolute first:before:inset-y-0 first:before:start-1 first:before:my-auto first:before:size-1.5 first:before:rounded-pill first:before:bg-field-line " +
    "group-hover/row:first:before:bg-field-ink group-hover/row:first:before:shadow-[0_0_6px_var(--field-ink)] " +
    "group-has-[:focus-visible]/row:first:before:bg-field-ink group-has-[:focus-visible]/row:first:before:shadow-[0_0_6px_var(--field-ink)] " +
    "group-data-selected/row:first:before:bg-field-ink group-data-selected/row:first:before:shadow-[0_0_6px_var(--field-ink)] " +
    "pointer-coarse:group-active/row:first:before:bg-field-ink pointer-coarse:group-active/row:first:before:shadow-[0_0_6px_var(--field-ink)] " +
    "forced-colors:first:before:[forced-color-adjust:none] forced-colors:first:before:border forced-colors:first:before:border-[CanvasText] forced-colors:first:before:bg-transparent " +
    "forced-colors:group-hover/row:first:before:bg-[Highlight] forced-colors:group-has-[:focus-visible]/row:first:before:bg-[Highlight] forced-colors:group-data-selected/row:first:before:bg-[Highlight]",
  primary: "text-field-ink",
  secondary: "text-field-ink-subtle",
  skeleton: "border-b border-[color-mix(in_oklab,var(--field-ink)_12%,transparent)]",
  bar: "rounded-control bg-[color-mix(in_oklab,var(--field-ink)_14%,transparent)]",
  error: "border-b border-[color-mix(in_oklab,var(--field-ink)_12%,transparent)] font-field",
  alert: "text-field-ink-subtle",
  retry: "secondary",
  empty: "font-field text-field-ink-subtle",
  sticky1: [
    "[&_tr>*:first-child]:sticky [&_tr>*:first-child]:start-0",
    "[&_thead_tr>*:first-child]:z-20 [&_tbody_tr>*:first-child]:z-1 [&_tbody_tr>*:first-child]:bg-field",
    "[&_tbody_tr>*:first-child]:transition-[background-color] [&_tbody_tr>*:first-child]:duration-(--dur-instant) [&_tbody_tr>*:first-child]:ease-litt",
    "[&_tbody_tr:hover>*:first-child]:bg-[color-mix(in_oklab,var(--field-ink)_10%,var(--field))]",
    "[&_tbody_tr[data-selected]>*:first-child]:bg-[color-mix(in_oklab,var(--field-ink)_16%,var(--field))]",
    "[&_tr>*:first-child]:after:pointer-events-none [&_tr>*:first-child]:after:absolute [&_tr>*:first-child]:after:inset-y-0 [&_tr>*:first-child]:after:end-0",
    "[&_tr>*:first-child]:after:w-px [&_tr>*:first-child]:after:bg-field-line [&_tr>*:first-child]:after:opacity-0 data-scrolled:[&_tr>*:first-child]:after:opacity-100",
  ].join(" "),
  sticky2: [
    "[&_tr>*:nth-child(-n+2)]:sticky [&_tr>*:first-child]:start-0 [&_tr>*:nth-child(2)]:start-(--sticky-2)",
    "[&_thead_tr>*:nth-child(-n+2)]:z-20 [&_tbody_tr>*:nth-child(-n+2)]:z-1 [&_tbody_tr>*:nth-child(-n+2)]:bg-field",
    "[&_tbody_tr>*:nth-child(-n+2)]:transition-[background-color] [&_tbody_tr>*:nth-child(-n+2)]:duration-(--dur-instant) [&_tbody_tr>*:nth-child(-n+2)]:ease-litt",
    "[&_tbody_tr:hover>*:nth-child(-n+2)]:bg-[color-mix(in_oklab,var(--field-ink)_10%,var(--field))]",
    "[&_tbody_tr[data-selected]>*:nth-child(-n+2)]:bg-[color-mix(in_oklab,var(--field-ink)_16%,var(--field))]",
    "[&_tr>*:nth-child(2)]:after:pointer-events-none [&_tr>*:nth-child(2)]:after:absolute [&_tr>*:nth-child(2)]:after:inset-y-0 [&_tr>*:nth-child(2)]:after:end-0",
    "[&_tr>*:nth-child(2)]:after:w-px [&_tr>*:nth-child(2)]:after:bg-field-line [&_tr>*:nth-child(2)]:after:opacity-0 data-scrolled:[&_tr>*:nth-child(2)]:after:opacity-100",
  ].join(" "),
  travels: false,
};
