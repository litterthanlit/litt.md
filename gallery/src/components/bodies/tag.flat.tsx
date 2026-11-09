/**
 * Tag, the Flat body (proposals/worlds.md, Bodies; material.md, 7): the word in a grey pill, 24px tall, nothing raised.
 * Grey (--surface-3) for a plain tag, the hue's tint for a category, a --surface-1 pill for a value raised out of a
 * field. No hairline and no shadow. A status tag colors its text and the word says the status. Forced colors drops
 * fills, so the pill keeps a border.
 */
import type { TagBodyProps, TagHue, TagStatus } from "../tag";

const STATUS: Record<TagStatus, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-fg-subtle",
};

const HUE: Record<TagHue, string> = {
  blue: "bg-data-blue-tint text-data-blue-text",
  amber: "bg-data-amber-tint text-data-amber-text",
  teal: "bg-data-teal-tint text-data-teal-text",
  violet: "bg-data-violet-tint text-data-violet-text",
  rose: "bg-data-rose-tint text-data-rose-text",
};

const PLAIN = "rounded-pill bg-surface-3 ";
const RAISED = "rounded-pill bg-surface-1 forced-colors:border ";

/** Flat, the grey chip. */
export function TagFlatBody({ status, hue, raised, label, rest, className }: TagBodyProps) {
  const ink = status ? STATUS[status] : raised ? "text-fg" : "text-fg-muted";
  return (
    <span
      data-body="flat"
      className={"inline-flex h-6 max-w-full shrink-0 items-center whitespace-nowrap px-3 text-caption forced-colors:border " + (hue ? "rounded-pill " + HUE[hue] : (raised ? RAISED : PLAIN) + ink) + " " + className}
      {...rest}
    >
      {label}
    </span>
  );
}
