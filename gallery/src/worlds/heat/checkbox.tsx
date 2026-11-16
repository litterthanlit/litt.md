/**
 * Checkbox and radio, Heat's body: a cut with an ink block seated 2px in it, and a deeper cup for a radio, as Press
 * drew them until 2026-11-16 (plans/022). Press went back to its first boards and dropped the rim round the ink block
 * and the radio's deeper cup; Heat keeps them, so nothing in Heat changed.
 *
 * - A checkbox's cut is --cut inside the --line-control edge with --cut-shade; checked, a 16px ink block (--fg) sits in
 *   it 2px in, lit on its top edge, with the tick or dash in --canvas. A radio's cup is --slot with --slot-shade and
 *   takes a round raised ink bead (--block-lift). A press sinks the block --press-depth.
 * - The contract (props, the real <input>, the label, the groups) is checkbox.tsx's.
 */
import { CheckIcon } from "@/components/icons";
import type { ChoiceBodyProps } from "@/components/checkbox";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The input is the cut, a place you put a mark into. It stays empty and sunk, checked or not. The ink is a separate
   block seated in it (below). The input sits above the label's stretched click area (z-1), so a click on the chip itself
   still lands on the input, as test tools expect. A checkbox's cut is a field's cut (--cut, --cut-shade); a radio's is a
   cup, deeper (--slot, --slot-shade). */
const cutBase =
  "peer relative z-1 col-start-1 row-start-1 m-0 size-5 shrink-0 cursor-pointer appearance-none self-start " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger),var(--cut-shade)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border " + // forced colors drops box-shadow, so the edge becomes a real border
  focusRing;
const squareCut = cutBase + " rounded-control bg-cut shadow-[inset_0_0_0_1px_var(--line-control),var(--cut-shade)]";
const cupCut = cutBase + " rounded-pill bg-slot shadow-[inset_0_0_0_1px_var(--line-control),var(--slot-shade)]";

/* Hover and press, as a wash over the cut. It is not tied to the input's own :hover, because the row is the target. */
const wash =
  "pointer-events-none relative z-1 col-start-1 row-start-1 size-5 self-start bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] opacity-0 " +
  "transition-[opacity,background-color] duration-(--dur-instant) ease-litt " +
  "group-hover/choice:opacity-100 group-active/choice:bg-[color-mix(in_oklab,var(--fg)_10%,transparent)] group-active/choice:opacity-100 " +
  "peer-disabled:hidden";

/* The ink block: 16px, seated 2px in the cut so a rim of the cut shows round it, its corners the cut's less those 2px.
   Lit only on its top edge and casting nothing, because it is flush; under the hand it sinks --press-depth. The mark in it
   is --canvas. The block is shown by opacity, so it fades on the instant tier and never moves on its own. */
const block =
  "pointer-events-none relative z-1 col-start-1 row-start-1 m-0.5 grid size-4 place-items-center self-start rounded-[calc(var(--radius-control)-2px)] " +
  "bg-fg text-canvas opacity-0 shadow-[inset_0_1px_0_color-mix(in_oklab,white_20%,transparent)] " +
  "transition-[opacity,transform] duration-(--dur-instant) ease-litt " +
  "group-active/choice:translate-y-(--press-depth) " +
  "peer-disabled:bg-surface-3 peer-disabled:text-fg-disabled peer-disabled:shadow-none forced-colors:border";

/* A chosen radio's bead: a round raised block in the cup, with the block's cast (--block-lift), 12px in a 20px cup. */
const bead =
  "pointer-events-none relative z-1 col-start-1 row-start-1 m-1 size-3 self-start rounded-pill bg-fg opacity-0 shadow-(--block-lift) " +
  "transition-[opacity,transform] duration-(--dur-instant) ease-litt peer-checked:opacity-100 " +
  "group-active/choice:translate-y-(--press-depth) group-active/choice:shadow-(--block-press) " +
  "peer-disabled:bg-fg-disabled peer-disabled:shadow-none forced-colors:bg-[CanvasText]";

/** Heat's body: a cut in the plate. Checked, an ink block sits flush in it; a radio is a cup that takes a bead. */
export function ChoiceHeatBody({ kind, input, tick }: ChoiceBodyProps) {
  const radio = kind === "radio";
  return (
    <>
      <input {...input} data-body="heat" className={radio ? cupCut : squareCut} />
      <span aria-hidden="true" className={wash + (radio ? " rounded-pill" : " rounded-control")} />
      {radio ? (
        <span aria-hidden="true" className={bead} />
      ) : (
        <>
          <span ref={tick} aria-hidden="true" className={block + " peer-checked:opacity-100 peer-indeterminate:opacity-0"}>
            <CheckIcon />
          </span>
          <span aria-hidden="true" className={block + " peer-indeterminate:opacity-100"}>
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

