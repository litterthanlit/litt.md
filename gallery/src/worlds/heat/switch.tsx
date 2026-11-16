/**
 * Switch, Heat's body: a thick block thrown along a deep tray, as Press drew it until 2026-11-16 (plans/022). Press went
 * back to its first boards and dropped the deep slot tray and the block's lit edge; Heat keeps them, so nothing in Heat
 * changed.
 *
 * - The tray is 92 by 32, cut deep: --slot with --slot-shade, at the control radius. The block fills half of it, 44 by
 *   28, set 2px in, raised: --block with --block-lift and a lit top edge (--highlight).
 * - The tray's floor says the state: "On" at its start, "Off" at its end. The block covers the word on its side and its
 *   travel uncovers the other.
 * - The contract (props, the Radix root, the hand, the label) is switch.tsx's.
 */
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { SwitchBodyProps, SwitchTone } from "@/components/switch";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The tray is the button, cut deep into the plate (--slot, --slot-shade). The row's label is stretched over the whole
   row, so the tray sits above it (z-1) and a press on the tray itself still lands on the button. It clips the block,
   so a cast never spills past its walls. */
const tray =
  "[--sw-travel:44px] " +
  "peer relative z-1 inline-flex h-8 w-23 shrink-0 cursor-pointer touch-pan-y items-center self-start overflow-hidden rounded-control p-0.5 " +
  "bg-slot shadow-(--slot-shade) " +
  "transition-[background-color] duration-(--dur-instant) ease-litt " +
  "enabled:group-hover/switch:bg-[color-mix(in_oklab,var(--slot),var(--fg)_4%)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border forced-colors:p-px " + // the border is real, so the padding gives it back its px
  focusRing;

/* A word set in the floor, one in each half. The block covers the one on its side and uncovers the other, so travel
   is what reveals the state. --fg on the --slot floor keeps 4.5:1. */
const floorWord =
  "pointer-events-none absolute inset-y-0 flex w-1/2 select-none items-center justify-center text-caption font-title text-fg " +
  "forced-colors:text-[CanvasText]";

/* The block, thick and bare: a lit top edge (--highlight) over its cast, no word on it. Its corners are the control
   radius less the 2px it is set in, so they stay concentric with the tray's. */
const blockBase =
  "pointer-events-none flex h-7 w-11 shrink-0 rounded-[calc(var(--radius-control)-2px)] " +
  "forced-colors:border";

const blockLift = "shadow-[var(--block-lift),var(--highlight)] group-active/switch:shadow-[var(--block-press),var(--highlight)]";
const blockOff = "bg-block " + blockLift;
const blockOn: Record<SwitchTone, string> = {
  neutral: "bg-block " + blockLift + " forced-colors:bg-[Highlight]",
  accent: "bg-accent " + blockLift + " forced-colors:bg-[Highlight]",
};
/* Disabled, the block lies flat: no cast, a hairline. */
const blockDisabled = "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";

/** Heat's body: a thick block thrown along a deep tray to a stop, uncovering the word set in the floor. */
export function SwitchHeatBody({ shown, disabled, x, tone, words, motion, root, className }: SwitchBodyProps) {
  const block = blockBase + " " + (disabled ? blockDisabled : shown ? blockOn[tone] : blockOff);
  const word = floorWord + (disabled ? " text-fg-disabled" : "");
  /* The word under the block is out of sight, so it is out of the page too: a contrast check never reads it through the block. */
  const covered = " opacity-0";
  return (
    <SwitchPrimitive.Root {...root} data-body="heat" className={tray + className}>
      <span aria-hidden="true" className={word + " left-0" + (shown ? "" : covered)}>{words[1]}</span>
      <span aria-hidden="true" className={word + " right-0" + (shown ? covered : "")}>{words[0]}</span>
      <SwitchPrimitive.Thumb className={block} style={{ ...motion, translate: `${x} 0` }} />
    </SwitchPrimitive.Root>
  );
}
