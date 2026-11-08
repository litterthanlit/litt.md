/**
 * Slide to confirm, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): a grey pill track
 * (--surface-3, no frame) and an ink circle for a thumb (--fg, its chevron in --canvas), nothing cast. The words sit
 * centered in the pill and fade by the thumb's position; the part it has passed fills at fg 6%. A disabled thumb is a
 * flat --surface-2 with no hairline. The drag, the keys and the thresholds are slide-confirm.tsx's.
 */
import { motion } from "motion/react";
import type { SlideConfirmBodyProps } from "../slide-confirm";

/** Flat, the pill: a grey track and an ink thumb that slides in it. */
export function SlideConfirmFlatBody({ label, confirmedLabel, done, disabled, track, box, band, words, glyph, thumb, tail }: SlideConfirmBodyProps) {
  const ink = done ? "text-fg" : "text-fg-subtle"; // disabled words stay fg-subtle: they still say what it would do
  return (
    <div
      ref={box}
      data-body="flat"
      data-no-drag=""
      className={"relative isolate flex w-full items-center overflow-hidden rounded-control bg-surface-3 p-0.5 shadow-(--tray-shade) select-none forced-colors:border " + track}
    >
      {/* The part the thumb has passed: a full-width band scaled from the left, so only a transform changes. */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0.5 left-0.5 -z-1 w-[calc(100%-0.25rem)] origin-left rounded-[calc(var(--radius-control)-2px)] bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]"
        style={{ scaleX: band }}
      />
      <motion.span
        aria-hidden="true"
        className={"pointer-events-none absolute inset-0 grid place-items-center px-14 text-center text-small " + ink}
        style={{ opacity: done ? 1 : words }}
      >
        <span className="truncate">{done ? confirmedLabel : label}</span>
      </motion.span>
      <motion.button
        {...thumb}
        className={
          "relative grid aspect-square h-full shrink-0 touch-none place-items-center rounded-[calc(var(--radius-control)-2px)] [-webkit-tap-highlight-color:transparent] " +
          "transition-colors duration-(--dur-instant) ease-litt " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border " +
          (disabled
            ? "cursor-not-allowed bg-surface-2 text-fg-disabled shadow-none"
            : "bg-fg text-canvas shadow-(--block-lift) " + (done ? "cursor-default" : "cursor-grab active:cursor-grabbing active:shadow-(--block-press)"))
        }
      >
        {glyph}
      </motion.button>
      {tail}
    </div>
  );
}
