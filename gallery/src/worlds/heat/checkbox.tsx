/**
 * Checkbox and radio, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): flat square checkbox cells and
 * flat ring radios, zero cast, zero sink, lit in amber (`--accent-text`) with four 5px corner brackets when checked.
 *
 * - Checkbox: flat square dark cell (`rounded-none border border-line-control bg-block`). Checked or mixed, four 5px
 *   amber corner brackets frame the cell and an amber check or dash sits inside (`text-accent-text`).
 * - Radio: flat circular ring (`rounded-pill border border-line-control bg-block`). Checked, a crisp flat center dot
 *   lights in amber (`bg-accent-text`).
 * - Disabled lies flat on `--surface-2` with `--line` and `--fg-disabled`. Forced colors keeps borders and CanvasText.
 * - The contract (props, the real <input>, the label, the groups) is checkbox.tsx's.
 */
import { CheckIcon } from "@/components/icons";
import type { ChoiceBodyProps } from "@/components/checkbox";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const inputBase =
  "peer relative z-1 col-start-1 row-start-1 m-0 size-5 shrink-0 cursor-pointer appearance-none self-start border border-line-control bg-block " +
  "transition-[border-color,background-color] duration-(--dur-instant) ease-litt " +
  "enabled:group-hover/choice:border-fg enabled:group-hover/choice:bg-(--block-hover) " +
  "aria-invalid:border-danger " +
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 " +
  "forced-colors:border " +
  focusRing;

/* Four 5px amber corner brackets on a checked/mixed checkbox. */
const brackets =
  "pointer-events-none relative z-1 col-start-1 row-start-1 size-5 self-start opacity-0 bg-no-repeat text-accent-text " +
  "transition-opacity duration-(--dur-instant) ease-litt " +
  "peer-checked:opacity-100 peer-indeterminate:opacity-100 peer-disabled:opacity-0 " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:5px_2px,2px_5px,5px_2px,2px_5px,5px_2px,2px_5px,5px_2px,2px_5px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const mark =
  "pointer-events-none relative z-1 col-start-1 row-start-1 grid size-5 place-items-center self-start text-accent-text opacity-0 " +
  "transition-opacity duration-(--dur-instant) ease-litt " +
  "peer-disabled:text-fg-disabled forced-colors:text-[CanvasText]";

const dot =
  "pointer-events-none relative z-1 col-start-1 row-start-1 m-1.5 size-2 self-start rounded-pill bg-accent-text opacity-0 " +
  "transition-opacity duration-(--dur-instant) ease-litt peer-checked:opacity-100 " +
  "peer-disabled:bg-fg-disabled forced-colors:bg-[CanvasText]";

/** Heat's body: flat square checkbox with amber corner brackets, and flat circular radio with amber dot. */
export function ChoiceHeatBody({ kind, input, tick }: ChoiceBodyProps) {
  const radio = kind === "radio";
  return (
    <>
      <input {...input} data-body="heat" className={inputBase + (radio ? " rounded-pill" : " rounded-none")} />
      {radio ? (
        <span aria-hidden="true" className={dot} />
      ) : (
        <>
          <span aria-hidden="true" className={brackets} />
          <span ref={tick} aria-hidden="true" className={mark + " peer-checked:opacity-100 peer-indeterminate:opacity-0"}>
            <CheckIcon />
          </span>
          <span aria-hidden="true" className={mark + " peer-indeterminate:opacity-100"}>
            <DashGlyph />
          </span>
        </>
      )}
    </>
  );
}

/** The dash for the mixed state: 16px, 1.5px stroke, like the other icons. */
function DashGlyph() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M4.5 8h7" />
    </svg>
  );
}
