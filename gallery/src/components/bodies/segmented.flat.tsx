/**
 * Segmented control, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): words alone, set in a line.
 * There is no tray, no fill and no frame. The chosen word sits in a grey bubble (--block is --surface-3) at the pill
 * radius, sized to its own word, and the others are --fg-muted words with nothing around them. The bubble glides to
 * the pick, and it changes its width on the way because the words do not share one. Space does the dividing: the
 * words are set apart by their own padding, and their hit areas touch, so a pointer never lands between two.
 * Forced colors gives the bubble a real border, which is the only edge, since there is no tray to keep.
 */
import { LayoutGroup, motion } from "motion/react";
import type { SegmentedBodyProps, SegmentedSize } from "../segmented";

/* A held unselected word on a coarse pointer fills (fg 6%, color only) and takes the --fg text. */
const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

const sizes: Record<SegmentedSize, { track: string; segment: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", segment: "px-3.5 text-caption pointer-coarse:text-small" },
  md: { track: "h-control-md", segment: "px-4 text-small" },
};

/** Flat, the grey bubble that glides behind the chosen word. */
export function SegmentedFlatBody({ legend, showLegend, name, value, options, size, block, disabled, className, select, groupId, enter }: SegmentedBodyProps) {
  const look = sizes[size];
  return (
    <fieldset data-body="flat" disabled={disabled} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={showLegend ? "mb-2 p-0 text-small font-title text-fg" : "sr-only"}>{legend}</legend>
      <LayoutGroup id={groupId}>
        <div className={"relative flex " + (block ? "w-full " : "w-fit ") + look.track}>
          {options.map((o) => {
            const selected = value === o.value;
            const off = disabled || !!o.disabled;
            return (
              <label
                key={o.value}
                className={
                  "litt-target relative grid h-full select-none place-items-center rounded-pill font-title " +
                  "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                  (block ? "flex-1 " : "") +
                  look.segment +
                  (off
                    ? " cursor-not-allowed text-fg-disabled"
                    : " cursor-pointer " + (selected ? "text-fg" : "text-fg-muted hover:text-fg " + PRESS))
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
                    layoutId="segmented-bubble"
                    transition={enter}
                    aria-hidden="true"
                    className={"absolute inset-0 rounded-pill forced-colors:border-2 " + (off ? "bg-surface-2" : "bg-block")}
                  />
                )}
                <span className="litt-trim relative z-1">{o.label}</span>
                {/* The word and the ring sit above the bubble (z-1), so the bubble never covers them while it glides. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-1 rounded-pill peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
                />
              </label>
            );
          })}
        </div>
      </LayoutGroup>
    </fieldset>
  );
}
