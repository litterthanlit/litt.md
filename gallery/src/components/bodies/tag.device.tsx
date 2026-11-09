/**
 * Tag, the Device body (proposals/worlds.md, Bodies; material.md, 8): the word engraved in capitals on a small plate.
 *
 * - A plate (--block with --plate-lift) at the control radius, 24px tall, the word in --fg-muted as a legend
 *   (litt-legend: --label-case, --label-tracking, --engrave). A hue tag keeps its tint and text tone on the plate.
 * - A status tag adds a lamp (size-1.5, fully round) in its status color before the word, at mid-height and 4px
 *   further in so it stays clear of the curve at Pill. The word still says the status (R5); the lamp is aria-hidden.
 * - A raised tag (a value in a field) is a small key: --block with --key-lift, the word in --fg.
 * - Static: nothing moves. Forced colors drops shadows, so the plate and the key keep a border.
 */
import type { TagBodyProps, TagHue, TagStatus } from "../tag";

const LAMP: Record<TagStatus, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-field-line",
};

const HUE: Record<TagHue, string> = {
  blue: "bg-data-blue-tint text-data-blue-text",
  amber: "bg-data-amber-tint text-data-amber-text",
  teal: "bg-data-teal-tint text-data-teal-text",
  violet: "bg-data-violet-tint text-data-violet-text",
  rose: "bg-data-rose-tint text-data-rose-text",
};

const PLATE = "rounded-control bg-block shadow-(--plate-lift) ";
const KEY = "rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))] bg-block shadow-(--key-lift) ";

/** Device, the engraved plate. */
export function TagDeviceBody({ status, hue, raised, label, rest, className }: TagBodyProps) {
  const surface = hue ? "rounded-control shadow-(--plate-lift) " + HUE[hue] : (raised ? KEY : PLATE) + (status || raised ? "text-fg" : "text-fg-muted");
  return (
    <span
      data-body="device"
      className={"inline-flex h-6 max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap text-caption litt-legend forced-colors:border " + (status ? "pl-2.5 pr-2 " : "px-2 ") + surface + " " + className}
      {...rest}
    >
      {status ? <span aria-hidden="true" className={"size-1.5 shrink-0 rounded-pill forced-colors:bg-[CanvasText] " + LAMP[status]} /> : null}
      {label}
    </span>
  );
}
