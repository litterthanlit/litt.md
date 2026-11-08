/**
 * Switch, the Flat body (proposals/worlds.md, Bodies; material.md, 7): an ink pill when on, an outline when off, and a
 * round knob that slides. No On or Off words: the side and the fill say the state, and aria-checked says it to a
 * screen reader. The pill is 44 by 26 with the knob 20 and 3px in, so the crossing is 18px (--sw-travel).
 * The accent fills the pill only for tone="accent", the one main switch (R6).
 */
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { SwitchBodyProps } from "../switch";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The pill is the button. The row's label is stretched over the whole row, so the pill sits above it (z-1) and a
   press on it still lands on the button. */
const pill =
  "[--sw-travel:18px] " +
  "peer relative z-1 inline-flex h-6.5 w-11 shrink-0 cursor-pointer touch-pan-y items-center self-start overflow-hidden rounded-control p-[3px] " +
  "bg-transparent shadow-[inset_0_0_0_1.5px_var(--line-control)] data-[state=checked]:bg-fg data-[state=checked]:shadow-none " +
  "transition-[background-color] duration-(--dur-instant) ease-litt " +
  "enabled:group-hover/switch:data-[state=checked]:bg-[color-mix(in_oklab,var(--fg)_86%,var(--canvas))] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-40 disabled:shadow-[inset_0_0_0_1px_var(--line)] disabled:data-[state=checked]:bg-fg disabled:data-[state=checked]:shadow-none " +
  "forced-colors:border forced-colors:p-px " + // the border is real, so the padding gives it back its px
  focusRing;

const pillAccent = " data-[state=checked]:bg-accent enabled:group-hover/switch:data-[state=checked]:bg-accent-hover";

/* The knob keeps the control radius less 2px, as the Press block does. */
const knob =
  "pointer-events-none flex size-5 shrink-0 rounded-[calc(var(--radius-control)-2px)] forced-colors:border " +
  "shadow-none";
const knobOff = "bg-line-control";
const knobOn = "bg-canvas forced-colors:bg-[Highlight]";

/** Flat, the pill: an ink pill when on, an outline when off, a round knob that slides. */
export function SwitchFlatBody({ shown, disabled, x, tone, motion, root, className }: SwitchBodyProps) {
  return (
    <SwitchPrimitive.Root {...root} data-body="flat" className={pill + (tone === "accent" ? pillAccent : "") + className}>
      {/* The empty child is not decoration: without it Chromium rasters the pill and knob edges a shade differently (measured, 0 pixels with it). */}
      <SwitchPrimitive.Thumb className={knob + " " + (disabled || !shown ? knobOff : knobOn)} style={{ ...motion, translate: `${x} 0` }}><span aria-hidden="true" className="hidden" /></SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}
