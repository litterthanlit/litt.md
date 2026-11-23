/**
 * Tag, the Flat body (proposals/worlds.md, Bodies; material.md, 7): the word in a pill, 24px tall, nothing raised.
 * The block for a plain tag (white on the ground, the grey bubble on paper, v1.17), the hue's tint for a category, a
 * --surface-1 pill for a value raised out of a field. No hairline and no shadow. A status tag is a small circle in the
 * status's color and its word in the ink, with no pill (v1.17, Flat's call 6; Nick, 2026-11-18, "I like the tags"):
 * the color sits only where it says something, and the word says the status (R5). Forced colors drops fills, so a pill
 * keeps a border and the circle takes the text color.
 */
import type { TagBodyProps, TagHue, TagStatus } from "@/components/tag";

/** The status's circle: 8px, round, in the status's color; the neutral one in the quiet ink. */
const MARK: Record<TagStatus, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-fg-subtle",
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

const PLAIN = "rounded-control bg-block ";
const RAISED = "rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))] bg-surface-1 forced-colors:border ";

/** Flat: a pill for a label or a value, a circle and a word for a status. */
export function TagFlatBody({ status, hue, raised, label, rest, className }: TagBodyProps) {
  const shape = hue
    ? "px-3 forced-colors:border rounded-control " + HUE[hue]
    : status
      ? "gap-2 text-fg"
      : "px-3 forced-colors:border " + (raised ? RAISED + "text-fg" : PLAIN + "text-fg-muted");
  return (
    <span
      data-body="flat"
      className={"inline-flex h-6 max-w-full shrink-0 items-center whitespace-nowrap text-caption font-normal " + shape + " " + className}
      {...rest}
    >
      {status && !hue && (
        <span aria-hidden="true" data-status-mark="" className={"size-2 shrink-0 rounded-pill forced-colors:[forced-color-adjust:none] forced-colors:bg-[CanvasText] " + MARK[status]} />
      )}
      {label}
    </span>
  );
}
