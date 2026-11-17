/**
 * Tag, the Device body (proposals/worlds.md, Bodies; material.md, 8): the word engraved in capitals on a small plate.
 *
 * - A plate (--block with --plate-lift; `data-part="plate"`) at the control radius, 24px tall, the word in --fg-muted
 *   as a legend (litt-legend: --label-case, --label-tracking, --engrave). A hue tag is the same plate with its word in
 *   the ink: under Device's color rule (plans/024) a hue is never a tint.
 * - A status tag adds the chip's glyph before the word (`data-part="light"`), never green or amber: success an ink dot
 *   (ready), warning an orange dot (a hand needed, the one place orange is a lamp), danger a red square (a fault, the
 *   stop's shape so it never reads as a run), neutral an unlit dot. The word still says the status (R5); the glyph is
 *   aria-hidden. The orange dot carries a rim of the orange darkened 40%, so its edge holds 3:1 on the light plate,
 *   where the orange alone does not.
 * - A raised tag (a value in a field) is a small key: --block with --key-lift, the word in --fg.
 * - Static: nothing moves. Forced colors drops shadows, so the plate and the key keep a border.
 */
import type { TagBodyProps, TagStatus } from "@/components/tag";

/* The chip's glyphs: a dot is round, a fault is the stop's square. */
const LAMP: Record<TagStatus, string> = {
  success: "rounded-pill bg-lamp-on",
  warning: "rounded-pill bg-accent shadow-[0_0_0_1px_color-mix(in_oklab,var(--accent),black_40%),0_0_0.45em_var(--accent)]",
  danger: "rounded-none bg-signal shadow-[0_0_0.45em_var(--signal)]",
  neutral: "rounded-pill bg-lamp-off shadow-(--lamp-recess)",
};

const PLATE = "rounded-control bg-block shadow-(--plate-lift) ";
const KEY = "rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))] bg-block shadow-(--key-lift) ";

/** Device, the engraved plate. */
export function TagDeviceBody({ status, hue, raised, label, rest, className }: TagBodyProps) {
  const surface = (raised ? KEY : PLATE) + (status || raised || hue ? "text-fg" : "text-fg-muted");
  return (
    <span
      data-body="device"
      data-part={raised ? "key" : "plate"}
      className={"inline-flex h-6 max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap text-caption litt-legend forced-colors:border " + (status ? "pl-2.5 pr-2 " : "px-2 ") + surface + " " + className}
      {...rest}
    >
      {status ? <span aria-hidden="true" data-part="light" className={"size-1.5 shrink-0 forced-colors:bg-[CanvasText] " + LAMP[status]} /> : null}
      {label}
    </span>
  );
}
