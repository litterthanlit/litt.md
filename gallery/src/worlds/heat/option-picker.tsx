/**
 * Option picker, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): flat square option cells framed in
 * four 6px amber corner brackets when picked, and crisp square swatches with an amber frame when picked.
 *
 * - Words: flat square cells (`rounded-none border border-line bg-canvas`); the picked cell steps to `--block` with
 *   `--accent-text` and four 6px amber corner brackets (never an accent background fill, R6).
 * - Sold out: flat `--surface-2` with `--fg-disabled` and "sold out" in words; picked keeps `--line-strong` + brackets.
 * - Swatches: crisp square chips (`rounded-none`), ringed by `--accent-text` with a check icon when picked.
 * - Forced colors keeps borders on every chip and Highlight on the picked cell.
 */
import { CheckIcon } from "@/components/icons";
import type { OptionPickerBodyProps } from "@/components/option-picker";

const ring = "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus";

const brackets =
  "pointer-events-none absolute inset-0 z-1 bg-no-repeat text-accent-text " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const keyOff = "border-line bg-canvas text-fg-muted hover:border-line-strong hover:bg-surface-1 hover:text-fg forced-colors:border";
const keyOn = "border-line-strong bg-block text-accent-text forced-colors:border-2 forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";
const keyFlat = "border-line bg-surface-2 text-fg-disabled forced-colors:border";
const keyFlatOn = "border-line-strong bg-surface-2 text-fg forced-colors:border-2";

/** Heat: flat square cells framed in amber corner brackets when picked; square swatches with crisp frame. */
export function OptionPickerHeatBody({ group, values, value, swatches, onPick, labelOf, inkOf }: OptionPickerBodyProps) {
  if (swatches) {
    return (
      <div data-body="heat" className="flex flex-wrap gap-2 pointer-coarse:gap-3">
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
                  (on ? "shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--accent-text)] forced-colors:border-2 " : "border border-line-strong forced-colors:border ") +
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
    <div data-body="heat" className="grid h-control-md w-full grid-flow-col auto-cols-fr items-stretch gap-1">
      {values.map((v) => {
        const on = v.value === value;
        const out = v.available === false;
        return (
          <label
            key={v.value}
            className={
              "litt-target relative grid min-w-0 cursor-pointer select-none place-items-center rounded-none border px-2 font-title text-caption " +
              "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
              (out ? (on ? keyFlatOn : keyFlat) : on ? keyOn : keyOff)
            }
          >
            <input type="radio" name={group} value={v.value} checked={on} onChange={() => onPick(v.value)} className="peer sr-only" />
            {on && !out && <span aria-hidden="true" className={brackets} />}
            <span className="relative z-1 flex min-w-0 max-w-full items-center gap-1.5 leading-none">
              <span className={out ? "shrink-0" : "truncate"}>{labelOf(v)}</span>
              {out && (
                <>
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
