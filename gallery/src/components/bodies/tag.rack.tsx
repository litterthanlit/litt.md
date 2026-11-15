/**
 * Tag, the Rack body (proposals/rack.md): a small key, 24px tall and square at the control radius.
 *
 * - A hue tag files the thing under a category, so it is a clip: the hue's tint as the fill, its -text tone for the word
 *   (4.5:1 on the tint, check 5) and a 1px edge of the hue's mark tone at 40%, drawn inside the box. One hue, one category.
 * - A plain tag is a grey key (--surface-3) with its word in --fg-muted, no outline.
 * - A status tag is a flat outlined key: --block inside a 1px line of --line-control, the word in the status colour. The
 *   word says the status, so colour never carries it alone.
 * - A raised tag (a value lifted out of a field) is the key itself: --block in the 1px outline of --block-lift, the word in
 *   --fg, at the field's radius less 4px (never under 2px) so it sits concentric in its field.
 * - Nothing moves, and it takes no focus. Forced colors drops shadows, so every key keeps a border.
 */
import type { TagBodyProps, TagHue, TagStatus } from "../tag";

const STATUS: Record<TagStatus, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-fg-subtle",
};

const HUE: Record<TagHue, string> = {
  blue: "bg-data-blue-tint text-data-blue-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-blue)_40%,transparent)]",
  amber: "bg-data-amber-tint text-data-amber-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-amber)_40%,transparent)]",
  teal: "bg-data-teal-tint text-data-teal-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-teal)_40%,transparent)]",
  violet: "bg-data-violet-tint text-data-violet-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-violet)_40%,transparent)]",
  rose: "bg-data-rose-tint text-data-rose-text shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--data-rose)_40%,transparent)]",
};

const PLAIN = "rounded-control bg-surface-3 text-fg-muted";
const OUTLINED = "rounded-control bg-block shadow-[inset_0_0_0_1px_var(--line-control)] ";
const RAISED = "rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))] bg-block text-fg shadow-(--block-lift)";

/** Rack: a small key, a clip for a category. */
export function TagRackBody({ status, hue, raised, label, rest, className }: TagBodyProps) {
  const look = hue ? "rounded-control " + HUE[hue] : status ? OUTLINED + STATUS[status] : raised ? RAISED : PLAIN;
  return (
    <span
      data-body="rack"
      className={"inline-flex h-6 max-w-full shrink-0 items-center whitespace-nowrap px-2 text-caption forced-colors:border " + look + " " + className}
      {...rest}
    >
      {label}
    </span>
  );
}
