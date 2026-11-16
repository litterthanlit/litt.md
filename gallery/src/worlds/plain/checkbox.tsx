/**
 * Checkbox and radio, Plain's body (proposals/plain.md, No UI): the browser's own boxes, drawn by one line.
 *
 * - Off is a square (a circle for a radio) inside a 1px --line-control edge, with nothing in it. On keeps the box
 *   empty of fill: the edge goes to --fg and a tick in --fg sits in it, or for a radio an --fg dot. So on is a mark at
 *   3:1 or more against the page, never a fill (WCAG 1.4.11). Mixed is an --fg dash in the box.
 * - Under the hand (the row is the target) the edge goes to --fg. An error draws it in --danger. Disabled thins it to
 *   --line and the mark to --fg-disabled.
 * - Forced colors drops box-shadow, so the edge is a real border there and the marks take CanvasText.
 */
import { CheckIcon } from "@/components/icons";
import type { ChoiceBodyProps } from "@/components/checkbox";

const box =
  "peer relative z-1 col-start-1 row-start-1 m-0 size-5 shrink-0 cursor-pointer appearance-none self-start bg-transparent " +
  "shadow-[inset_0_0_0_1px_var(--line-control)] checked:shadow-[inset_0_0_0_1px_var(--fg)] indeterminate:shadow-[inset_0_0_0_1px_var(--fg)] " +
  "group-hover/choice:shadow-[inset_0_0_0_1px_var(--fg)] " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger)] " +
  "disabled:cursor-not-allowed disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* A mark sits centered in the box, shown only in its state. */
const mark =
  "pointer-events-none relative z-1 col-start-1 row-start-1 grid size-5 place-items-center self-start opacity-0 text-fg " +
  "peer-disabled:text-fg-disabled forced-colors:text-[CanvasText]";

/** The dash for the mixed state: 16px, 1.5px stroke, like the other icons. */
function DashGlyph() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M4.5 8h7" />
    </svg>
  );
}

/** Plain, the browser's box: an edge, and a mark in the ink when on. */
export function ChoicePlainBody({ kind, input, tick }: ChoiceBodyProps) {
  if (kind === "radio") {
    return (
      <>
        <input {...input} data-body="plain" className={box + " rounded-pill"} />
        <span aria-hidden="true" className={mark + " peer-checked:opacity-100 after:size-2 after:rounded-pill after:bg-current"} />
      </>
    );
  }
  return (
    <>
      <input {...input} data-body="plain" className={box + " rounded-control"} />
      <span ref={tick} aria-hidden="true" className={mark + " peer-checked:opacity-100 peer-indeterminate:opacity-0"}>
        <CheckIcon />
      </span>
      <span aria-hidden="true" className={mark + " peer-indeterminate:opacity-100"}>
        <DashGlyph />
      </span>
    </>
  );
}
