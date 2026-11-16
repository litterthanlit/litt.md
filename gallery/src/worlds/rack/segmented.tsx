/**
 * Segmented control, the Rack body (proposals/rack.md): a chooser, as an instrument draws one. One box in a 1px
 * outline, divided by 1px rules, the chosen option a filled key. Nothing glides.
 *
 * - The box is --tray inside --tray-shade's 1px outline, square at the control radius. The options sit side by side,
 *   each the width of the widest word, with a 1px rule (--line) between neighbours drawn as the left edge of every
 *   option but the first. No padding, so a key meets the outline.
 * - The chosen option is lit: the ink (--fg) with the canvas for words, so the choice reads without spending the accent
 *   (R6: yellow is only the one primary action).
 * - The others are --fg-subtle words on the box, --fg on hover, and a held finger fills them (fg 6%, colour only).
 * - The change is a cut: fill and words change on the instant tier and nothing crosses, grows or bounces.
 * - Disabled options are --fg-disabled; a disabled control lies flat on --surface-2 with a --line hairline.
 * - Forced colors: a real border on the box, and Highlight with HighlightText for the chosen option.
 */
import type { SegmentedBodyProps, SegmentedSize } from "@/components/segmented";

const sizes: Record<SegmentedSize, { track: string; key: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", key: "px-control-pad-sm text-caption pointer-coarse:text-small" },
  md: { track: "h-control-md", key: "px-control-pad-md text-small" },
};

const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

/** Rack, the chooser: one outlined box, rules between options, the chosen one a lit key. */
export function SegmentedRackBody({ legend, showLegend, name, value, options, size, block, disabled, className, select }: SegmentedBodyProps) {
  const look = sizes[size];
  return (
    <fieldset data-body="rack" disabled={disabled} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={showLegend ? "mb-2 p-0 text-small font-title text-fg" : "sr-only"}>{legend}</legend>
      <div
        className={
          "relative grid-flow-col auto-cols-fr items-stretch overflow-hidden rounded-control forced-colors:border " +
          (disabled ? "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)] " : "bg-tray shadow-(--tray-shade) ") +
          (block ? "grid w-full " : "inline-grid ") +
          look.track
        }
      >
        {options.map((o, i) => {
          const selected = value === o.value;
          const off = disabled || !!o.disabled;
          return (
            <label
              key={o.value}
              className={
                "litt-target relative grid select-none place-items-center font-title [-webkit-tap-highlight-color:transparent] " +
                "transition-colors duration-(--dur-instant) ease-litt " +
                look.key +
                (i > 0 ? " border-l border-line forced-colors:border-l-[CanvasText]" : "") +
                (off
                  ? " cursor-not-allowed text-fg-disabled"
                  : selected
                    ? " cursor-pointer bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                    : " cursor-pointer text-fg-subtle hover:text-fg " + PRESS)
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
              <span className="litt-trim relative">{o.label}</span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
