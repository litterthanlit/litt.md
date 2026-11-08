/**
 * Checkbox and radio, the Device body (proposals/worlds.md, Bodies; material.md, 8): a square key that latches.
 *
 * - A key (--block, --key-lift: its face, a dark rim and a 2px skirt) in a 24px well (--tray, --tray-shade). The key is
 *   20px and 2px in, so its corners are the well's less those 2px and the two stay concentric at every shape. The
 *   input itself is the key, so the role, Space, the arrow keys and the mixed state are the browser's.
 * - Latching: a checked key stays down, sunk the whole --press-depth (2px) onto its skirt with --block-press, and its
 *   lamp lit. A mixed key is down too, with its lamp half lit. Unchecked, the key stands and the lamp is a dim ring.
 *   The lamp is the body's ink (--fg), never the accent (R6): a form can hold many checked keys.
 * - A radio is the same key. A group of them is a row, interlocked: pressing one latches it and lets the last one up,
 *   because the browser unchecks the old one. No glide, no travel.
 * - The hand: press and the key sinks 2px (it ignores fun mode's pop and its tick); release and it latches or lets
 *   go. A change switches in place in three steps on the instant tier (100ms), never a spring; reduced motion zeroes
 *   the tier, so it happens at once.
 * - The lamp never says a state alone: the word is the label beside the key, and the input says it to a screen reader.
 * - Forced colors drops shadows and fills, so the well and the key get real borders, a lit lamp is a system
 *   highlight and an unlit one an outline.
 */
import type { CSSProperties } from "react";
import type { ChoiceBodyProps } from "../checkbox";

/* The detent: a change switches in place in three even steps on the instant tier, as a display's segments light. */
const STEPS = "steps(3, end)";
const detent: CSSProperties = { transitionDuration: "var(--dur-instant)", transitionTimingFunction: `${STEPS}` };

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The key is the input. It sits above the label's stretched click area (z-1), so a press on it still lands on the input.
   Latched (checked or mixed), it stays sunk. Under the hand it sinks the same 2px. */
const key =
  "peer relative z-1 col-start-1 row-start-1 m-0.5 size-5 shrink-0 cursor-pointer appearance-none self-start " +
  "rounded-[calc(var(--radius-control)-2px)] bg-block shadow-(--key-lift) " +
  "transition-[transform,box-shadow,background-color] duration-(--dur-instant) ease-litt " +
  "enabled:group-active/choice:[transform:translateY(var(--press-depth))] enabled:group-active/choice:shadow-(--block-press) " +
  "checked:[transform:translateY(var(--press-depth))] checked:shadow-(--block-press) " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "disabled:checked:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border " +
  focusRing;

/* Only a checkbox has a mixed state. A radio matches :indeterminate whenever nothing in its group is picked. */
const mixed =
  " indeterminate:[transform:translateY(var(--press-depth))] indeterminate:shadow-(--block-press)" +
  " disabled:indeterminate:shadow-[inset_0_0_0_1px_var(--line)]";

/* The well is cut into the body, under the key. An error swaps its floor's edge for --danger. */
const well =
  "pointer-events-none col-start-1 row-start-1 size-6 self-start rounded-control bg-tray shadow-(--tray-shade) " +
  "peer-enabled:group-hover/choice:bg-[color-mix(in_oklab,var(--tray),var(--fg)_4%)] " +
  "peer-aria-invalid:shadow-[inset_0_0_0_1px_var(--danger),var(--tray-shade)] " +
  "peer-disabled:bg-surface-2 peer-disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border";

/* The lamp sits on the key's face and sinks with it. Unlit: a dim ring. Lit: the ink, with a little glow. */
const lamp =
  "pointer-events-none relative z-1 col-start-1 row-start-1 grid size-6 place-items-center self-start " +
  "transition-[transform] duration-(--dur-instant) ease-litt " +
  "peer-enabled:group-active/choice:[transform:translateY(var(--press-depth))] " +
  "peer-checked:[transform:translateY(var(--press-depth))] " +
  "[&>span]:size-1.5 [&>span]:rounded-pill [&>span]:shadow-[inset_0_0_0_1px_var(--line-control)] " +
  "[&>span]:transition-[background-color,box-shadow] [&>span]:duration-(--dur-instant) [&>span]:ease-litt " +
  "peer-checked:[&>span]:bg-fg peer-checked:[&>span]:shadow-[0_0_6px_var(--fg)] " +
  "peer-disabled:peer-checked:[&>span]:bg-fg-disabled peer-disabled:peer-checked:[&>span]:shadow-none " +
  "forced-colors:[&>span]:border peer-checked:forced-colors:[&>span]:bg-[Highlight]";

/* Half lit: the lower half of the lamp is the ink. */
const lampMixed =
  " peer-indeterminate:[transform:translateY(var(--press-depth))]" +
  " peer-indeterminate:[&>span]:bg-[linear-gradient(to_top,var(--fg)_50%,transparent_50%)]" +
  " peer-disabled:peer-indeterminate:[&>span]:bg-[linear-gradient(to_top,var(--fg-disabled)_50%,transparent_50%)]" +
  " peer-indeterminate:forced-colors:[&>span]:bg-[linear-gradient(to_top,Highlight_50%,transparent_50%)]";

/** Device, the latching key: a square key in a well that stays down with its lamp lit when checked, half lit when mixed. */
export function ChoiceDeviceBody({ kind, input }: ChoiceBodyProps) {
  const radio = kind === "radio";
  return (
    <>
      <input {...input} data-body="device" className={key + (radio ? "" : mixed)} style={detent} />
      <span aria-hidden="true" className={well} />
      <span aria-hidden="true" className={lamp + (radio ? "" : lampMixed)} style={detent}>
        <span style={detent} />
      </span>
    </>
  );
}
