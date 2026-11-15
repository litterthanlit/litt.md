/**
 * Checkbox and radio, the Rack body (proposals/rack.md): a small well that fills with the ink, as an instrument's
 * toggles do.
 *
 * - Off is a well: --slot inside a 1px --line-control edge (3:1 on every surface, so an empty box is never lost on a
 *   dark panel), 20px, at the control radius. On is the ink (--fg) filled
 *   with the tick in --canvas, in the 1px outline of --block-lift, on the frame; never the accent (R6). Mixed keeps
 *   the well and sets an ink dash in it. A radio is a round well that fills with the ink, with no dot, because ink
 *   means on, as in Flat.
 * - Hover and press are a wash over the box that shows on the frame, and nothing moves, grows or sinks. An error swaps the
 *   outline for --danger. Disabled lies flat on --surface-2 with the --line hairline.
 * - Forced colors drops fills and shadows: the box keeps a real border, the tick and the dash take the system text
 *   color, and a radio gets a system-color dot that exists only there, so on is never lost.
 */
import { CheckIcon } from "@/components/icons";
import type { ChoiceBodyProps } from "../checkbox";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The input is the box. The wash and the mark sit in the same grid cell. The input sits above the label's stretched
   click area (z-1), so a click on the box itself still lands on the input. */
const box =
  "peer relative z-1 col-start-1 row-start-1 m-0 size-5 shrink-0 cursor-pointer appearance-none self-start " +
  "bg-slot shadow-[inset_0_0_0_1px_var(--line-control)] " +
  "transition-[background-color] duration-(--dur-instant) ease-litt " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border " + // forced colors drops box-shadow, so the edge becomes a real border
  focusRing;

/* On is the ink in the block's outline. A checkbox a page sets both checked and mixed stays an outline. */
const onCheckbox =
  " checked:not-indeterminate:bg-fg checked:not-indeterminate:shadow-(--block-lift) aria-invalid:checked:not-indeterminate:shadow-[inset_0_0_0_1px_var(--danger)] disabled:checked:not-indeterminate:bg-surface-3";
/* A radio matches :indeterminate whenever nothing in its group is picked, so it only reads :checked. */
const onRadio = " checked:bg-fg checked:shadow-(--block-lift) aria-invalid:checked:shadow-[inset_0_0_0_1px_var(--danger)] disabled:checked:bg-surface-3";

/* Hover and press, as a grey wash over the box. It is not tied to the input's own :hover, because the row is the target. */
const wash =
  "pointer-events-none relative z-1 col-start-1 row-start-1 size-5 self-start bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] opacity-0 " +
  "transition-[opacity,background-color] duration-(--dur-instant) ease-litt " +
  "group-hover/choice:opacity-100 group-active/choice:bg-[color-mix(in_oklab,var(--fg)_10%,transparent)] group-active/choice:opacity-100 " +
  /* A checked box is --fg, where an --fg wash would not show, so the wash there is --canvas. */
  "peer-checked:bg-[color-mix(in_oklab,var(--canvas)_12%,transparent)] group-active/choice:peer-checked:bg-[color-mix(in_oklab,var(--canvas)_20%,transparent)] " +
  "peer-disabled:hidden";
/* A mixed box is an outline, so its wash stays the grey one, even if a page also sets it checked. */
const mixedWash =
  " peer-indeterminate:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] group-active/choice:peer-indeterminate:bg-[color-mix(in_oklab,var(--fg)_10%,transparent)]";

/* A mark is centered in the box, and fades with the fill. */
const mark =
  "pointer-events-none relative z-1 col-start-1 row-start-1 grid size-5 place-items-center self-start opacity-0 " +
  "transition-opacity duration-(--dur-instant) ease-litt peer-disabled:text-fg-disabled";

/* In forced colors the radio's fill is gone, so a dot in the system text color is the only mark of on. Elsewhere it is not drawn. */
const forcedDot =
  "pointer-events-none relative z-1 col-start-1 row-start-1 hidden size-5 place-items-center self-start " +
  "forced-colors:peer-checked:grid after:size-2 after:rounded-pill after:bg-[CanvasText]";

/** The dash for the mixed state: 16px, 1.5px stroke, like the other icons. */
function DashGlyph() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M4.5 8h7" />
    </svg>
  );
}

/** Rack, a well that fills with the ink when on, an ink dash when mixed, a round well for a radio. */
export function ChoiceRackBody({ kind, input, tick }: ChoiceBodyProps) {
  const radio = kind === "radio";
  return (
    <>
      <input {...input} data-body="rack" className={box + (radio ? " rounded-pill" + onRadio : " rounded-control" + onCheckbox)} />
      <span aria-hidden="true" className={wash + (radio ? " rounded-pill" : " rounded-control" + mixedWash)} />
      {radio ? (
        <span aria-hidden="true" className={forcedDot} />
      ) : (
        <>
          <span ref={tick} aria-hidden="true" className={mark + " text-canvas peer-checked:opacity-100 peer-indeterminate:opacity-0"}>
            <CheckIcon />
          </span>
          <span aria-hidden="true" className={mark + " text-fg peer-indeterminate:opacity-100"}>
            <DashGlyph />
          </span>
        </>
      )}
    </>
  );
}
