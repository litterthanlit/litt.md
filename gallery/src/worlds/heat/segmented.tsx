/**
 * Segmented control, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a flat row of square cells in a
 * 1px outline, the chosen cell lit in `--block` with four 8px amber corner brackets and `‹ label ›` chevrons.
 *
 * - Square corners (`rounded-none`), zero cast, zero sink, instant cut.
 * - Unselected cells sit flat on `--canvas` with quiet ink; the chosen cell takes `--block`, `--accent-text` and four
 *   8px corner brackets (never an accent background fill, R6).
 * - Forced colors gives the strip and each cell real borders, and Highlight with HighlightText on the chosen cell.
 * - The contract (props, the radios, the arrow keys) is segmented.tsx's.
 */
import type { SegmentedBodyProps, SegmentedSize } from "@/components/segmented";

const sizes: Record<SegmentedSize, { track: string; cell: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", cell: "px-control-pad-sm text-caption pointer-coarse:text-small" },
  md: { track: "h-control-md", cell: "px-control-pad-md text-small" },
};

/* Four 8px corner marks on the chosen cell, in amber (--accent-text). */
const brackets =
  "pointer-events-none absolute inset-0 bg-no-repeat text-accent-text " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

/** Heat's body: flat square cells divided by 1px rules, the chosen cell framed in amber corner brackets. */
export function SegmentedHeatBody({ legend, showLegend, name, value, options, size, block, disabled, className, select }: SegmentedBodyProps) {
  const look = sizes[size];
  return (
    <fieldset data-body="heat" disabled={disabled} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={showLegend ? "mb-2 p-0 text-small font-title text-fg" : "sr-only"}>{legend}</legend>
      <div
        className={
          "relative grid-flow-col auto-cols-fr items-stretch rounded-none border border-line bg-canvas forced-colors:border " +
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
              data-chosen={selected ? "" : undefined}
              className={
                "litt-target relative grid select-none border-l border-line first:border-l-0 [-webkit-tap-highlight-color:transparent] " +
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
                className={
                  "relative flex items-center justify-center gap-1.5 font-title whitespace-nowrap " +
                  "transition-colors duration-(--dur-instant) ease-litt " +
                  look.cell +
                  (off
                    ? " bg-surface-2 text-fg-disabled"
                    : selected
                      ? " bg-block text-accent-text forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                      : " bg-canvas text-fg-muted hover:bg-surface-1 hover:text-fg")
                }
              >
                {selected && !off && <span aria-hidden="true" className={brackets} />}
                {selected && !off && <span aria-hidden="true">‹</span>}
                <span className="litt-trim">{o.label}</span>
                {selected && !off && <span aria-hidden="true">›</span>}
              </span>
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
