/**
 * Switch, the Rack body (proposals/rack.md): a toggle key that lights, as an instrument's buttons do. Nothing slides.
 *
 * - The key is the button: 48 by 24, square at the control radius, its word on its face ("Off", "On") at the caption
 *   size and the title weight. Off, it is a key (--block, the 1px outline of --block-lift) with the word in --fg-muted.
 *   On, it lights: the accent with --accent-fg words for tone="accent", the one main switch (R6), and the ink with the
 *   canvas for words in the default neutral tone, so a list of settings lights without spending the accent.
 * - Both words share one grid cell, the unused one invisible, so the key never changes width. Word and fill both
 *   change, so color is never the signal; aria-checked says the state, and the word is aria-hidden.
 * - A press darkens the outline (--block-press) and the fill, on the frame; the key never moves (Rack: nothing sinks,
 *   R4's cut). A drag across it still flips it by the side it ends on (--sw-travel is the key's half width).
 * - Disabled, it lies flat: --surface-2 with a --line hairline and --fg-disabled words, on or off.
 * - Forced colors: a real border, and Highlight with HighlightText when on.
 */
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { SwitchBodyProps, SwitchTone } from "@/components/switch";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The key is the button. The row's label is stretched over the whole row, so the key sits above it (z-1). */
const key =
  "[--sw-travel:24px] " +
  "peer relative z-1 inline-grid h-6 w-12 shrink-0 cursor-pointer touch-pan-y place-items-center self-start rounded-control " +
  "text-caption font-title leading-none select-none " +
  "transition-[background-color,color] duration-(--dur-instant) ease-litt " +
  "disabled:cursor-not-allowed forced-colors:border " +
  focusRing;

/* Off, on and disabled, each one string, so no two fills meet on the element. */
const off =
  "bg-block text-fg-muted shadow-(--block-lift) enabled:hover:bg-(--block-hover) enabled:active:shadow-(--block-press)";
const on: Record<SwitchTone, string> = {
  neutral: "bg-fg text-canvas shadow-(--block-lift) enabled:active:shadow-(--block-press) forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
  accent: "bg-accent text-accent-fg shadow-(--block-lift) enabled:hover:bg-accent-hover enabled:active:shadow-(--block-press) forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
};
const flat = "bg-surface-2 text-fg-disabled shadow-[inset_0_0_0_1px_var(--line)]";

/** Rack, the toggle key: its word on its face, lit when on. */
export function SwitchRackBody({ shown, disabled, tone, words, root: rootProps, className }: SwitchBodyProps) {
  const look = disabled ? flat : shown ? on[tone] : off;
  return (
    <SwitchPrimitive.Root {...rootProps} data-body="rack" className={key + " " + look + " " + className}>
      <span aria-hidden="true" className="grid">
        <span className={"col-start-1 row-start-1" + (shown ? " invisible" : "")}>{words[0]}</span>
        <span className={"col-start-1 row-start-1" + (shown ? "" : " invisible")}>{words[1]}</span>
      </span>
    </SwitchPrimitive.Root>
  );
}
