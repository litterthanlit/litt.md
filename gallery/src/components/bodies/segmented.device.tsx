/**
 * Segmented control, the Device body (proposals/worlds.md, Bodies; material.md, 8): a row of keys on one skirt.
 *
 * - One well (--tray, --tray-shade) holds the keys, side by side, each the width of the widest word. A key is
 *   --block on --key-lift, its corners the well's less its 2px inset, with 2px of the well left under it for its skirt.
 * - The chosen key stays latched down: sunk the whole --press-depth (2px) onto the skirt on --block-press, its lamp
 *   lit in --fg. The others stand up, their lamp a dim ring. A press on a standing key sinks it too, and choosing it
 *   lets the last one up. The word stays, so a lamp never says the state alone.
 * - Nothing glides. The change switches in place in three steps on the instant tier (100ms), as the Switch's detent
 *   does; reduced motion zeroes the tier, so it happens at once.
 * - Words are in the mono at the title weight (font-field). Forced colors gives the well and every key real borders,
 *   the lit lamp is a system highlight and the dim one an outline.
 */
import type { CSSProperties } from "react";
import type { SegmentedBodyProps, SegmentedSize } from "../segmented";

const sizes: Record<SegmentedSize, { track: string; key: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", key: "px-2.5 text-caption pointer-coarse:text-small" },
  md: { track: "h-control-md", key: "px-3 text-small" },
};

/* The detent: the sink, the colors and the cast change in three steps on the instant tier. */
const STEPS = "steps(3, end)";
const flip: CSSProperties = {
  transitionProperty: "transform, color, box-shadow, background-color",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: `${STEPS}, ${STEPS}, ${STEPS}, ${STEPS}`,
};

/** Device, the keys: a row of keys in one well, the chosen one latched down with its lamp lit. */
export function SegmentedDeviceBody({ legend, showLegend, name, value, options, size, block, disabled, className, select }: SegmentedBodyProps) {
  const look = sizes[size];
  return (
    <fieldset data-body="device" disabled={disabled} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={showLegend ? "mb-2 p-0 text-small font-title text-fg" : "sr-only"}>{legend}</legend>
      <div
        className={
          "relative grid-flow-col auto-cols-fr items-stretch overflow-hidden rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border forced-colors:p-px " +
          (block ? "grid w-full " : "inline-grid ") +
          look.track
        }
      >
        {options.map((o) => {
          const selected = value === o.value;
          const off = disabled || !!o.disabled;
          return (
            <label
              key={o.value}
              className={
                "group/key litt-target relative grid select-none [-webkit-tap-highlight-color:transparent] " +
                (off ? "cursor-not-allowed" : "cursor-pointer")
              }
            >
              <input
                type="radio"
                className="peer sr-only"
                name={name}
                value={o.value}
                checked={selected}
                disabled={o.disabled}
                onChange={() => select(o.value)}
              />
              <span
                style={flip}
                className={
                  "relative mb-0.5 flex items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] font-field font-title forced-colors:border " +
                  look.key +
                  (off
                    ? " bg-surface-2 text-fg-disabled shadow-[inset_0_0_0_1px_var(--line)]"
                    : selected
                      ? " bg-block text-fg shadow-(--block-press) [transform:translateY(var(--press-depth))]"
                      : " bg-block text-fg-subtle shadow-(--key-lift) hover:text-fg group-active/key:text-fg group-active/key:shadow-(--block-press) group-active/key:[transform:translateY(var(--press-depth))]")
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    "size-1.5 shrink-0 rounded-pill " +
                    (selected && !off
                      ? "bg-fg shadow-[0_0_6px_var(--fg)] forced-colors:bg-[Highlight]"
                      : "shadow-[inset_0_0_0_1px_var(--fg-disabled)] forced-colors:border")
                  }
                />
                <span className="litt-trim">{o.label}</span>
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[calc(var(--radius-control)-2px)] peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
