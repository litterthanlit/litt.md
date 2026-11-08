/**
 * Switch, the Device body (proposals/worlds.md, Bodies; material.md, 8): a toggle key that flips with a detent.
 *
 * - A key (--block, --key-lift: its face, a dark rim and a 2px skirt) in a well (--tray, --tray-shade), 48 by 32, the
 *   key 24 by 26 and 3px in, so it crosses 18px (--sw-travel). Its corners are the well's less those 2px, so the two
 *   stay concentric at every shape. Two grip lines on its face tell which way it faces.
 * - The detent: the key crosses in three even steps on the instant tier (100ms), as a display's segments light, never
 *   a spring. Reduced motion zeroes the tier, so it flips at once. A drag follows the finger 1:1 and lands on the
 *   nearer side, like the other bodies.
 * - The hand: press and the key sinks the whole --press-depth (2px) onto its well and its skirt goes with it.
 * - Its word ("Off", "On") sits on a small LCD beside the key, in the mono at the caption size (--field, --field-ink,
 *   --field-shade). A lamp on the glass lights when on: the accent for tone="accent", else the glass's own ink, so a
 *   list of switches stays one accent fill at most (R6).
 * - Forced colors drops shadows and fills, so the well, the key and the glass get real borders, the lamp is a system
 *   highlight when lit and an outline when not, and the key's side says the rest.
 */
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { CSSProperties } from "react";
import type { SwitchBodyProps } from "../switch";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The button holds the well and the glass side by side; its label is the row's, stretched over the whole row. */
const housing =
  "[--sw-travel:20px] " +
  "peer relative z-1 inline-flex h-8 shrink-0 cursor-pointer touch-pan-y items-center gap-2 self-start rounded-control " +
  "disabled:cursor-not-allowed " +
  focusRing;

/* The well is cut into the body. It clips the key's cast, so nothing spills past its walls. */
const well =
  "relative inline-flex h-8 w-12 shrink-0 items-center overflow-hidden rounded-control p-0.5 " +
  "forced-colors:border forced-colors:p-px";
const wellOn = " bg-tray shadow-(--tray-shade) group-hover/switch:bg-[color-mix(in_oklab,var(--tray),var(--fg)_4%)]";
const wellDisabled = " bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";

/* The key's face. At rest its skirt shows 2px below it; pressed it sinks that 2px and the skirt closes. */
const keyBase =
  "pointer-events-none flex h-7 w-6 shrink-0 items-center justify-center gap-1 rounded-[calc(var(--radius-control)-2px)] " +
  "bg-block shadow-(--key-lift) " +
  "group-active/switch:shadow-(--block-press) group-active/switch:[transform:translateY(var(--press-depth))] " +
  "forced-colors:border";
const keyDisabled = "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";

const grip = "h-3 w-px bg-[color-mix(in_oklab,var(--fg)_28%,transparent)] forced-colors:bg-[CanvasText]";

/* LCD glass beside the key: the word in the mono at the caption size, and the lamp. */
const glass =
  "inline-flex h-6 min-w-14 shrink-0 items-center gap-1.5 rounded-control bg-field px-2.5 font-field text-caption font-title " +
  "shadow-(--field-shade) forced-colors:border";
const lamp = "size-1.5 shrink-0 rounded-pill forced-colors:border";

/* The detent: the key crosses in three steps on the instant tier; the press, the colors and the cast fade on the
   same tier. Dragging, only the colors keep it, so the key follows the finger. */
const STEPS = "steps(3, end)";
const flip: CSSProperties = {
  transitionProperty: "translate, transform, background-color, box-shadow",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: `${STEPS}, var(--ease-out), var(--ease-out), var(--ease-out)`,
};
const follow: CSSProperties = {
  transitionProperty: "transform, background-color, box-shadow",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: "var(--ease-out)",
};

/** Device, the toggle key: a key that flips in a well with a detent, its word and a lamp on LCD glass beside it. */
export function SwitchDeviceBody({ shown, disabled, dragging, x, tone, words, root, className }: SwitchBodyProps) {
  const lit = !disabled && shown;
  return (
    <SwitchPrimitive.Root {...root} data-body="device" className={housing + className}>
      <span aria-hidden="true" className={well + (disabled ? wellDisabled : wellOn)}>
        <SwitchPrimitive.Thumb
          className={keyBase + (disabled ? " " + keyDisabled : "")}
          style={{ ...(dragging ? follow : flip), translate: `${x} 0` }}
        >
          <span className={grip} />
          <span className={grip} />
        </SwitchPrimitive.Thumb>
      </span>
      <span aria-hidden="true" className={glass + (disabled ? " opacity-50" : "")}>
        <span
          className={
            lamp +
            (lit
              ? (tone === "accent" ? " bg-accent shadow-[0_0_6px_var(--accent)]" : " bg-field-ink shadow-[0_0_6px_var(--field-ink)]") + " forced-colors:bg-[Highlight]"
              : " bg-field-line forced-colors:bg-transparent")
          }
        />
        <span className={lit ? "text-field-ink" : "text-field-ink-subtle"}>{shown ? words[1] : words[0]}</span>
      </span>
    </SwitchPrimitive.Root>
  );
}
