/**
 * Tag, Plain's body (taste v1.23, proposals/plain-studies.md): bare status words on paper, flat paper tint strips for
 * labels and categories, and a 1px hairline token only when raised inside a field.
 *
 * - Status tags (`status` without `hue`): no 4-sided box and no background fill. A `6px` (`size-1.5`) square mark in
 *   the status color beside the status word in its status ink (`text-success`, `text-warning`, `text-danger`,
 *   `text-fg-subtle`), so rows in `Table` and `Dashboard` stay free of unneeded boxes while keeping words as the
 *   primary carrier of state.
 * - Plain labels: flat `--surface-2` paper strip (`px-2 text-fg-muted`), square `rounded-none`, no outline.
 * - Category hues (`hue`): square tint strip (`bg-data-<hue>-tint text-data-<hue>-text`) with no border or highlight.
 * - Raised tokens (`raised`): a crisp `1px` `border border-line-control bg-canvas text-fg` square token so removable
 *   picks inside `TokenInput` and `Combobox` bound what Backspace deletes.
 */
import type { TagBodyProps, TagHue, TagStatus } from "@/components/tag";

const STATUS: Record<TagStatus, { text: string; mark: string }> = {
  success: { text: "text-success", mark: "bg-success" },
  warning: { text: "text-warning", mark: "bg-warning" },
  danger: { text: "text-danger", mark: "bg-danger" },
  neutral: { text: "text-fg-subtle", mark: "bg-fg-subtle" },
};

const HUE: Record<TagHue, string> = {
  blue: "bg-data-blue-tint text-data-blue-text",
  amber: "bg-data-amber-tint text-data-amber-text",
  teal: "bg-data-teal-tint text-data-teal-text",
  violet: "bg-data-violet-tint text-data-violet-text",
  rose: "bg-data-rose-tint text-data-rose-text",
  sky: "bg-data-sky-tint text-data-sky-text",
  bubblegum: "bg-data-bubblegum-tint text-data-bubblegum-text",
  sun: "bg-data-sun-tint text-data-sun-text",
};

const PLAIN = "bg-surface-2 px-2 text-fg-muted forced-colors:border";
const RAISED = "border border-line-control bg-canvas px-2 text-fg";

/** Plain: bare status mark + word on paper, flat paper tint for labels/categories, 1px hairline for field tokens. */
export function TagPlainBody({ status, hue, raised, label, rest, className }: TagBodyProps) {
  const statusLook = status && !hue ? STATUS[status] : null;
  const shape = hue
    ? "px-2 forced-colors:border " + HUE[hue]
    : statusLook
      ? "gap-1.5 " + statusLook.text
      : raised
        ? RAISED
        : PLAIN;
  return (
    <span
      data-body="plain"
      className={"inline-flex h-6 max-w-full shrink-0 items-center rounded-none whitespace-nowrap text-caption font-normal " + shape + " " + className}
      {...rest}
    >
      {statusLook && (
        <span
          aria-hidden="true"
          data-status-mark=""
          className={"size-1.5 shrink-0 forced-colors:[forced-color-adjust:none] forced-colors:bg-[CanvasText] " + statusLook.mark}
        />
      )}
      {label}
    </span>
  );
}
