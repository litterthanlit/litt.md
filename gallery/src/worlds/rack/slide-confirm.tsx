/**
 * Slide to confirm, the Rack body (proposals/rack.md): a track box with a flat key in it. Nothing slides for show; the
 * key goes where the hand takes it, one to one, and that is all that moves.
 *
 * - The track is a box cut into the panel: --slot inside --slot-shade's 1px outline, at the control radius. The words sit
 *   in it at the small size in the ink and fade by the key's position. The part the key has passed fills as the slot's
 *   own fill (--slot-fill), a flat band behind the key that follows it.
 * - The key is a flat handle in the 1px outline of --block-lift, 48 wide and 4px in from the box, with three grip lines
 *   on its face (--fg-subtle). Held, its outline darkens to --block-press and its fill takes a step, on the frame, and it
 *   does not sink. Its corner is the box's less the 4px inset.
 * - Confirmed, the track lights in the ink (--fg) with the words and the check in --canvas, and the key goes --canvas
 *   with the check on it. Never the accent: this is one yes among many marks, R6 keeps the accent for the primary.
 * - A disabled track lies flat on --surface-2 with a --line hairline, and the key is --surface-2 with --fg-disabled words.
 * - Forced colors: real borders, and Highlight for the passed part.
 * - The drag, the keys, the thresholds and the typing path are slide-confirm.tsx's.
 */
import { motion } from "motion/react";
import type { SlideConfirmBodyProps } from "@/components/slide-confirm";

/** Rack, the track box: a slot, a flat key and the part it has passed. */
export function SlideConfirmRackBody({ label, confirmedLabel, done, disabled, track, box, band, words, glyph, thumb, tail }: SlideConfirmBodyProps) {
  const ink = done ? "text-canvas" : disabled ? "text-fg-subtle" : "text-fg"; // disabled words stay fg-subtle: they still say what it would do
  const grip = "w-px " + (disabled ? "bg-line" : "bg-fg-subtle");
  return (
    <div
      ref={box}
      data-body="rack"
      data-no-drag=""
      className={
        "relative isolate flex w-full items-center overflow-hidden rounded-control p-1 select-none transition-colors duration-(--dur-instant) ease-litt forced-colors:border " +
        (done ? "bg-fg shadow-(--slot-shade) " : disabled ? "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)] " : "bg-slot shadow-(--slot-shade) ") +
        track
      }
    >
      {/* The passed part: a full-width band scaled from the left, so only a transform changes. It ends where the key's far edge does. */}
      <motion.span
        aria-hidden="true"
        className={"pointer-events-none absolute inset-y-0 left-1 w-[calc(100%-0.5rem)] origin-left " + (disabled ? "bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]" : "bg-slot-fill forced-colors:bg-[Highlight]")}
        style={{ scaleX: band }}
      />
      <motion.span
        aria-hidden="true"
        className={"pointer-events-none absolute inset-0 grid place-items-center px-14 text-center text-small font-title " + ink}
        style={{ opacity: done ? 1 : words }}
      >
        <span className="max-w-full min-w-0 truncate">{done ? confirmedLabel : label}</span>
      </motion.span>
      <motion.button
        {...thumb}
        className={
          "relative grid h-full w-12 shrink-0 touch-none place-items-center rounded-[calc(var(--radius-control)-4px)] [-webkit-tap-highlight-color:transparent] " +
          "transition-[background-color,box-shadow] duration-(--dur-instant) ease-litt " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 forced-colors:border " +
          (done ? "focus-visible:outline-canvas " : "focus-visible:outline-focus ") +
          (disabled
            ? "cursor-not-allowed bg-surface-2 text-fg-disabled shadow-[inset_0_0_0_1px_var(--line)]"
            : done
              ? "cursor-default bg-canvas text-fg shadow-(--block-lift)"
              : "cursor-grab bg-block text-fg shadow-(--block-lift) active:cursor-grabbing active:bg-(--block-hover) active:shadow-(--block-press)")
        }
      >
        {done ? (
          glyph
        ) : (
          <span aria-hidden="true" className="flex h-4 items-stretch gap-1">
            <span className={grip} />
            <span className={grip} />
            <span className={grip} />
          </span>
        )}
      </motion.button>
      {tail}
    </div>
  );
}
