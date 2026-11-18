/**
 * Tag, the Flat body (proposals/worlds.md, Bodies; material.md, 7): the word in a pill, 24px tall, nothing raised.
 * The block for a plain tag (white on the ground, the grey bubble on paper, v1.17), the hue's tint for a category, a
 * --surface-1 pill for a value raised out of a field. No hairline and no shadow. A status tag is its word in the ink after a small circle in the status's color
 * (v1.17, Flat's call 6): the color sits only where it says something, and the word says the status (R5). Forced colors
 * drops fills, so the pill keeps a border and the circle takes the text color.
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
};

const PLAIN = "rounded-control bg-block ";
const RAISED = "rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))] bg-surface-1 forced-colors:border ";

/** Flat, the grey chip. */
export function TagFlatBody({ status, hue, raised, label, rest, className }: TagBodyProps) {
  const ink = status ? "gap-2 text-fg" : raised ? "text-fg" : "text-fg-muted";
  return (
    <span
      data-body="flat"
      className={"inline-flex h-6 max-w-full shrink-0 items-center whitespace-nowrap px-3 text-caption forced-colors:border " + (hue ? "rounded-control " + HUE[hue] : (raised ? RAISED : PLAIN) + ink) + " " + className}
      {...rest}
    >
      {status && !hue && (
        <span aria-hidden="true" data-status-mark="" className={"size-2 shrink-0 rounded-pill forced-colors:[forced-color-adjust:none] forced-colors:bg-[CanvasText] " + MARK[status]} />
      )}
      {label}
    </span>
  );
}
