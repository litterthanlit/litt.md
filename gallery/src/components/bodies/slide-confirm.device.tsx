/**
 * Slide to confirm, the Device body (proposals/worlds.md, Bodies; material.md, 8): a latch key pushed along a well to an
 * end stop.
 *
 * - A key (--block, --key-lift: its face, a dark rim and a 2px skirt) in a well (--tray, --tray-shade), the key as tall
 *   as the well less its 2px lip, so its corners are the well's less those 2px and the two stay concentric. The
 *   chevron, or the check once it has latched, is on its face.
 * - The track's words sit on an LCD strip (--field, --field-shade) cut into the well between the key's two ends, in the
 *   mono at the caption size, so the key never covers them at rest. They fade by the key's position, as in the other
 *   bodies. A lamp at the stop, on the glass, lights once confirmed: the glass's own ink, never the accent (R6), and the
 *   confirmed words say it too, so the lamp never says a state alone.
 * - The hand: press and the key sinks the whole --press-depth (2px) onto its skirt; it keeps that sink while it is
 *   dragged, and follows the finger 1:1 along the well. Confirmed, it stays latched down at the stop, sunk, with its
 *   lamp lit. A disabled key lies flat with a hairline, and the glass keeps its words.
 * - Let go short and the key goes home in three steps on the instant tier (the contract's drive, steps(3, end)), never a
 *   spring; the press and the shade change in the same three steps. Reduced motion zeroes the tier, so it is home at
 *   once. Fun mode's throw and pop come through the contract and leave the rest as it is.
 * - Forced colors drops shadows and fills, so the well, the key and the glass get real borders and the lamp is a
 *   system highlight when lit and an outline when not.
 */
import type { CSSProperties } from "react";
import { motion } from "motion/react";
import type { SlideConfirmBodyProps } from "../slide-confirm";

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The key sinks and its shade steps in the same three steps as the home run, on the instant tier. */
const STEPS = "steps(3, end)";
const stepped: CSSProperties = {
  transitionProperty: "translate, background-color, box-shadow",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: `${STEPS}, var(--ease-out), var(--ease-out)`,
};

const keyBase =
  "relative grid aspect-square h-full shrink-0 touch-none place-items-center rounded-[calc(var(--radius-control)-2px)] [-webkit-tap-highlight-color:transparent] " +
  ring +
  " forced-colors:border";
const keyUp = "cursor-grab bg-block text-fg shadow-(--key-lift) active:translate-y-(--press-depth) active:cursor-grabbing active:shadow-(--block-press)";
const keyLatched = "cursor-default translate-y-(--press-depth) bg-block text-fg shadow-(--block-press)";
const keyDisabled = "cursor-not-allowed bg-surface-2 text-fg-disabled shadow-[inset_0_0_0_1px_var(--line)]";

/* The glass is cut between the key's two ends: the key (the well's height less its 4px lip) and a 2px gap. */
const glassSize = { md: "inset-x-11.5 pointer-coarse:inset-x-14", lg: "inset-x-14" };

/** Device, the latch key: a key pushed along a well to a stop, its words on an LCD strip and a lamp that lights at the stop. */
export function SlideConfirmDeviceBody({ label, confirmedLabel, done, disabled, size, track, box, band, words, glyph, thumb, tail }: SlideConfirmBodyProps) {
  return (
    <div
      ref={box}
      data-body="device"
      data-no-drag=""
      className={"relative isolate flex w-full items-center overflow-hidden rounded-control bg-tray p-0.5 shadow-(--tray-shade) select-none forced-colors:border " + track}
    >
      {/* The part the key has passed: a full-width band scaled from the left, so only a transform changes. */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0.5 left-0.5 -z-1 w-[calc(100%-0.25rem)] origin-left rounded-[calc(var(--radius-control)-2px)] bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]"
        style={{ scaleX: band }}
      />
      <span
        aria-hidden="true"
        className={
          "pointer-events-none absolute inset-y-1.5 flex items-center justify-center rounded-[calc(var(--radius-control)-2px)] bg-field px-5 font-field text-caption font-title shadow-(--field-shade) forced-colors:border " +
          glassSize[size]
        }
      >
        <motion.span className={"truncate " + (done ? "text-field-ink" : "text-field-ink-subtle")} style={{ opacity: done ? 1 : words }}>
          {done ? confirmedLabel : label}
        </motion.span>
        <span
          className={
            "absolute right-2 size-1.5 shrink-0 rounded-pill forced-colors:border " +
            (done ? "bg-field-ink shadow-[0_0_6px_var(--field-ink)] forced-colors:bg-[Highlight]" : "bg-field-line forced-colors:bg-transparent")
          }
        />
      </span>
      <motion.button
        {...thumb}
        style={{ ...thumb.style, ...stepped }}
        className={keyBase + " " + (disabled ? keyDisabled : done ? keyLatched : keyUp)}
      >
        {glyph}
      </motion.button>
      {tail}
    </div>
  );
}
