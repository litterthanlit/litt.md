/**
 * Segmented control, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): the track has no fill or
 * frame (the tokens), so the selected segment is a grey bubble (--block is --surface-3) at the control radius, and the
 * others are --fg-muted words. It glides to the pick like Press. Its forced-colors border stays.
 */
import { LayoutGroup, motion } from "motion/react";
import type { SegmentedBodyProps, SegmentedSize } from "../segmented";

/* A held unselected segment on a coarse pointer fills (fg 6%, color only) and takes the --fg text. */
const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

const sizes: Record<SegmentedSize, { track: string; segment: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", segment: "px-control-pad-sm text-caption pointer-coarse:text-small" },
  md: { track: "h-control-md", segment: "px-control-pad-md text-small" },
};

/** Flat, the grey bubble that glides. */
export function SegmentedFlatBody({ legend, showLegend, name, value, options, size, block, disabled, className, select, groupId, enter }: SegmentedBodyProps) {
  const look = sizes[size];
  return (
    <fieldset data-body="flat" disabled={disabled} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={showLegend ? "mb-2 p-0 text-small font-title text-fg" : "sr-only"}>{legend}</legend>
      <LayoutGroup id={groupId}>
        <div
          className={
            "relative grid-flow-col auto-cols-fr rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border " +
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
                  "litt-target relative grid h-full select-none place-items-center rounded-[calc(var(--radius-control)-2px)] font-title " +
                  "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                  look.segment +
                  (off
                    ? " cursor-not-allowed text-fg-disabled"
                    : " cursor-pointer " + (selected ? "text-fg" : "text-fg-subtle hover:text-fg " + PRESS))
                }
              >
                <input
                  type="radio"
                  className="peer sr-only"
                  name={name}
                  value={o.value}
                  checked={selected}
                  disabled={o.disabled}
                  onChange={() => {
                    select(o.value);
                  }}
                />
                {selected && (
                  <motion.span
                    layoutId="segmented-surface"
                    transition={enter}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[calc(var(--radius-control)-2px)] bg-block shadow-(--block-lift) forced-colors:border-2"
                  />
                )}
                <span className="litt-trim relative z-1">{o.label}</span>
                {/* The label and the ring sit above the selected surface (z-1), so the surface never covers them while it glides. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-1 rounded-[calc(var(--radius-control)-2px)] peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
                />
              </label>
            );
          })}
        </div>
      </LayoutGroup>
    </fieldset>
  );
}
