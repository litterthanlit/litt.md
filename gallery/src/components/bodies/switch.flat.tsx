/**
 * Switch, the Flat body (proposals/worlds.md, Bodies; material.md, 7): a small ink pill on paper. On, the pill is ink
 * with a canvas knob at the end; off, it is an outline with a --line-control knob at the start. Nothing stands up:
 * no tray, no cast. The word ("Off", "On") sits in type beside it at the small size and the text weight, in --fg.
 * Both words share one grid cell, the unused one invisible, so the word never reflows the row. It is aria-hidden:
 * aria-checked says the state to a screen reader. The pill is 44 by 26 with the knob 20 and 3px in, so the crossing
 * is 18px (--sw-travel). The accent fills the pill only for tone="accent", the one main switch (R6).
 */
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { SwitchBodyProps } from "../switch";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The button holds the pill and its word side by side. The row's label is stretched over the whole row, so the button
   sits above it (z-1) and a press on it still lands on the button. */
const root =
  "[--sw-travel:18px] group/pill " +
  "peer relative z-1 inline-flex h-6.5 shrink-0 cursor-pointer touch-pan-y items-center gap-2 self-start rounded-control " +
  "disabled:cursor-not-allowed " +
  focusRing;

/* The pill: an outline when off, ink when on. */
const pill =
  "relative inline-flex h-6.5 w-11 shrink-0 items-center overflow-hidden rounded-control p-[3px] " +
  "bg-transparent shadow-[inset_0_0_0_1.5px_var(--line-control)] group-data-[state=checked]/pill:bg-fg group-data-[state=checked]/pill:shadow-none " +
  "transition-[background-color] duration-(--dur-instant) ease-litt " +
  "group-enabled/pill:group-hover/switch:group-data-[state=checked]/pill:bg-[color-mix(in_oklab,var(--fg)_86%,var(--canvas))] " +
  "group-disabled/pill:bg-surface-2 group-disabled/pill:opacity-40 group-disabled/pill:shadow-[inset_0_0_0_1px_var(--line)] group-disabled/pill:group-data-[state=checked]/pill:bg-fg group-disabled/pill:group-data-[state=checked]/pill:shadow-none " +
  "forced-colors:border forced-colors:p-px"; // the border is real, so the padding gives it back its px

const pillAccent = " group-data-[state=checked]/pill:bg-accent group-enabled/pill:group-hover/switch:group-data-[state=checked]/pill:bg-accent-hover";

/* The knob keeps the control radius less 2px, as the Press block does. */
const knob =
  "pointer-events-none flex size-5 shrink-0 rounded-[calc(var(--radius-control)-2px)] forced-colors:border " +
  "shadow-none";
const knobOff = "bg-line-control";
const knobOn = "bg-canvas forced-colors:bg-[Highlight]";

/* The word, in type beside the pill, in the text weight. Both words stack in one cell so the row never reflows. */
const wordCell = "grid select-none text-small font-normal leading-none whitespace-nowrap text-fg group-disabled/pill:text-fg-disabled";

/** Flat, the pill: ink when on, an outline when off, a round knob that slides, the word in type beside it. */
export function SwitchFlatBody({ shown, disabled, x, tone, words, motion, root: rootProps, className }: SwitchBodyProps) {
  return (
    <SwitchPrimitive.Root {...rootProps} data-body="flat" className={root + className}>
      <span className={pill + (tone === "accent" ? pillAccent : "")}>
        {/* The empty child is not decoration: without it Chromium rasters the pill and knob edges a shade differently. */}
        <SwitchPrimitive.Thumb className={knob + " " + (disabled || !shown ? knobOff : knobOn)} style={{ ...motion, translate: `${x} 0` }}><span aria-hidden="true" className="hidden" /></SwitchPrimitive.Thumb>
      </span>
      <span aria-hidden="true" className={wordCell}>
        <span className={"col-start-1 row-start-1" + (shown ? " invisible" : "")}>{words[0]}</span>
        <span className={"col-start-1 row-start-1" + (shown ? "" : " invisible")}>{words[1]}</span>
      </span>
    </SwitchPrimitive.Root>
  );
}
