/**
 * Option picker, the Rack body (proposals/rack.md): flat keys in outlines, the picked one lit. Nothing moves.
 *
 * - Words: the values are a row of equal keys a hair apart (4px), each a box in a 1px outline (--block with --block-lift)
 *   at the control radius, its word in the caption size and the title weight. The picked key is lit in the ink (--fg,
 *   with the canvas for words), never the accent (R6, a form holds many options). The others are --fg-subtle, --fg on hover.
 * - Sold out: the key lies flat (--surface-2, a --line hairline) and says "sold out" in words on its face beside the
 *   name. It stays a radio you can pick, as the contract has it, so the reason is found; picked, it takes a 2px ink outline and the contract's legend says Sold out.
 * - Swatches: each chip is a square (the control height less 12px, 28px, 36px on a touch screen) in a 1px outline, with the
 *   product's colour filling it and an fg-12% hairline on its edge, since colour needs one. The picked chip is ringed
 *   in a 2px ink outline held off the chip by 2px, and carries the check in black or white, whichever reads. A sold-out chip
 *   fades under its hairline. The colour is the product's, never chrome.
 * - Motion: nothing glides. Fill and words change on the frame (the instant tier); no key rises or sinks.
 * - Forced colors drops shadows and fills, so each key gets a real border, the picked one a 2px one and Highlight.
 */
import { CheckIcon } from "@/components/icons";
import type { OptionPickerBodyProps } from "../option-picker";

const ring = "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus";

/* A key standing, lit, and lying flat (sold out). One string each, so no two fills meet. */
const keyOff = "forced-colors:border bg-block text-fg-subtle shadow-(--block-lift) hover:bg-(--block-hover) hover:text-fg";
const keyOn = "bg-fg text-canvas shadow-(--block-lift) forced-colors:border-2 forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";
const keyFlat = "forced-colors:border bg-surface-2 text-fg-disabled shadow-[inset_0_0_0_1px_var(--line)]";
const keyFlatOn = "bg-surface-2 text-fg shadow-[inset_0_0_0_2px_var(--fg)] forced-colors:border-2";

/** Rack: keys in outlines, the picked one lit in the ink; colours as square chips; a sold-out key lies flat and says so. */
export function OptionPickerRackBody({ group, values, value, swatches, onPick, labelOf, inkOf }: OptionPickerBodyProps) {
  if (swatches) {
    return (
      <div data-body="rack" className="flex flex-wrap gap-2 pointer-coarse:gap-3">
        {values.map((v) => {
          const on = v.value === value;
          const out = v.available === false;
          const ink = inkOf(v);
          return (
            <label key={v.value} className="litt-target relative block cursor-pointer [-webkit-tap-highlight-color:transparent]">
              <input type="radio" name={group} value={v.value} checked={on} onChange={() => onPick(v.value)} className="peer sr-only" />
              <span className="sr-only">
                {labelOf(v)}
                {out && ", sold out"}
              </span>
              <span
                aria-hidden="true"
                className={
                  "relative grid size-7 place-items-center rounded-none pointer-coarse:size-9 " +
                  (on ? "shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--fg)] forced-colors:border-2 " : "shadow-(--block-lift) forced-colors:border ") +
                  ring
                }
                style={{
                  backgroundColor: v.swatch?.color,
                  backgroundImage: v.swatch?.image ? `url("${v.swatch.image}")` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  color: ink ?? "var(--fg)",
                }}
              >
                {out && <span className="absolute inset-0 bg-canvas opacity-60" />}
                <span className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_12%,transparent)]" />
                {on && <CheckIcon className="relative" />}
              </span>
            </label>
          );
        })}
      </div>
    );
  }
  return (
    <div data-body="rack" className="grid h-control-md w-full grid-flow-col auto-cols-fr items-stretch gap-1">
      {values.map((v) => {
        const on = v.value === value;
        const out = v.available === false;
        return (
          <label
            key={v.value}
            className={
              "litt-target relative grid min-w-0 cursor-pointer select-none place-items-center rounded-control px-2 font-title text-caption " +
              "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
              (out ? (on ? keyFlatOn : keyFlat) : on ? keyOn : keyOff)
            }
          >
            <input type="radio" name={group} value={v.value} checked={on} onChange={() => onPick(v.value)} className="peer sr-only" />
            <span className="relative z-1 flex min-w-0 max-w-full items-center gap-1.5 leading-none">
              <span className={out ? "shrink-0" : "truncate"}>{labelOf(v)}</span>
              {out && (
                <>
                  {/* The name stays whole; in a narrow key the words after it give way. */}
                  <span aria-hidden="true" className="min-w-0 truncate text-fg-disabled">sold out</span>
                  <span className="sr-only">, sold out</span>
                </>
              )}
            </span>
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-1 peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus" />
          </label>
        );
      })}
    </div>
  );
}
