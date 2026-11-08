/**
 * Checkbox and radio, the Flat body (proposals/worlds.md, Bodies; material.md, 7): an outline when off, the ink when on.
 * Off is transparent inside the --line-control edge; on is the --fg fill with the tick, the dash or the bead in --canvas,
 * and a radio is a ring around an ink dot. No light and no cast. At the Pill shape the 20px box is a circle; at other
 * shapes it follows --radius-control, and a radio is always round.
 */
import { CheckIcon } from "@/components/icons";
import type { ChoiceBodyProps } from "../checkbox";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The input is the chip. The wash, the mark and the label sit in the same grid cell or beside it. The input sits above
   the label's stretched click area (z-1), so a click on the chip itself still lands on the input. */
const box =
  "peer relative z-1 col-start-1 row-start-1 m-0 size-5 shrink-0 cursor-pointer appearance-none self-start " +
  "bg-transparent shadow-[inset_0_0_0_1px_var(--line-control),var(--cut-shade)] " +
  "transition-[background-color] duration-(--dur-instant) ease-litt " +
  "checked:bg-fg checked:shadow-none " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger),var(--cut-shade)] aria-invalid:checked:shadow-[inset_0_0_0_1px_var(--danger)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "disabled:checked:bg-surface-3 " +
  "forced-colors:border " + // forced colors drops box-shadow, so the edge becomes a real border
  focusRing;

/* Only a checkbox has a mixed state. A radio matches :indeterminate whenever nothing in its group is picked. */
const mixed =
  " indeterminate:bg-fg indeterminate:shadow-none " +
  "aria-invalid:indeterminate:shadow-[inset_0_0_0_1px_var(--danger)] disabled:indeterminate:bg-surface-3";

/* Hover and press, as a wash over the chip. It is not tied to the input's own :hover, because the row is the target. */
const wash =
  "pointer-events-none relative z-1 col-start-1 row-start-1 size-5 self-start bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] opacity-0 " +
  "transition-[opacity,background-color] duration-(--dur-instant) ease-litt " +
  "group-hover/choice:opacity-100 group-active/choice:bg-[color-mix(in_oklab,var(--fg)_10%,transparent)] group-active/choice:opacity-100 " +
  /* A checked or mixed chip is --fg, where an --fg wash would not show, so the wash there is --canvas. */
  "peer-checked:bg-[color-mix(in_oklab,var(--canvas)_12%,transparent)] group-active/choice:peer-checked:bg-[color-mix(in_oklab,var(--canvas)_20%,transparent)] " +
  "peer-disabled:hidden";

const mixedWash =
  " peer-indeterminate:bg-[color-mix(in_oklab,var(--canvas)_12%,transparent)] group-active/choice:peer-indeterminate:bg-[color-mix(in_oklab,var(--canvas)_20%,transparent)]";

/* A mark is centered in the chip, and fades with the fill. */
const mark =
  "pointer-events-none relative z-1 col-start-1 row-start-1 grid size-5 place-items-center self-start text-canvas opacity-0 " +
  "transition-opacity duration-(--dur-instant) ease-litt peer-disabled:text-fg-disabled";

/* A chosen radio's dot, in --canvas on the ink, drawn as the cell's ::after so peer-disabled can lay it flat. */
const bead =
  "pointer-events-none relative z-1 col-start-1 row-start-1 grid size-5 place-items-center self-start opacity-0 " +
  "transition-opacity duration-(--dur-instant) ease-litt peer-checked:opacity-100 " +
  "after:size-2 after:rounded-pill after:bg-canvas after:shadow-(--block-lift) " +
  "peer-disabled:after:bg-fg-disabled peer-disabled:after:shadow-none forced-colors:after:bg-[CanvasText]";

/** The dash for the mixed state: 16px, 1.5px stroke, like the other icons. */
function DashGlyph() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M4.5 8h7" />
    </svg>
  );
}

/** Flat, the outline: an empty box with a line round it, the ink when on, a dot in a ring for a radio. */
export function ChoiceFlatBody({ kind, input, tick }: ChoiceBodyProps) {
  const radio = kind === "radio";
  return (
    <>
      <input {...input} data-body="flat" className={box + (radio ? " rounded-pill" : " rounded-control" + mixed)} />
      <span aria-hidden="true" className={wash + (radio ? " rounded-pill" : " rounded-control" + mixedWash)} />
      {radio ? (
        <span aria-hidden="true" className={bead} />
      ) : (
        <>
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
