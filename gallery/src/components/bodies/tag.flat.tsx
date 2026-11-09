/**
 * Tag, the Flat body (proposals/worlds.md, Bodies; material.md, 7): a 24px chip at the control radius, grey
 * (--surface-3) for a plain tag, the hue's tint for a category, a --surface-1 bubble for a value raised out of a field.
 * No hairline. A status tag colors its text and the word says the status.
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

const PLAIN = "rounded-control bg-surface-3 ";
const RAISED = "rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))] bg-surface-1 shadow-(--block-lift) forced-colors:border ";

/** Flat, the grey chip. */
export function TagFlatBody({ status, hue, raised, label, rest, className }: TagBodyProps) {
  const ink = status ? STATUS[status] : raised ? "text-fg" : "text-fg-muted";
  return (
    <span
      data-body="flat"
      className={"inline-flex h-6 max-w-full shrink-0 items-center whitespace-nowrap px-2 text-caption " + (hue ? "rounded-control " + HUE[hue] : (raised ? RAISED : PLAIN) + ink) + " " + className}
      {...rest}
    >
      {label}
    </span>
  );
}
