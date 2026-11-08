/**
 * Slide to confirm, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): ink on paper. A grey pill
 * (--surface-3, no frame, nothing cast) and a plain ink circle (--fg) with nothing on it, no chevron. The words sit in
 * the pill in ink and fade by the circle's position; the part it has passed is not drawn. Confirmed, the whole pill
 * turns ink and the words and the check go --canvas. A disabled circle is a flat --surface-3 on --surface-2. The drag,
 * the keys and the thresholds are slide-confirm.tsx's.
 */
import { motion } from "motion/react";
import type { SlideConfirmBodyProps } from "../slide-confirm";

/** Flat, the pill: a grey pill, an ink circle that slides in it, and ink words. */
export function SlideConfirmFlatBody({ label, confirmedLabel, done, disabled, track, box, band, words, glyph, thumb, tail }: SlideConfirmBodyProps) {
  const ink = done ? "text-canvas" : disabled ? "text-fg-subtle" : "text-fg"; // disabled words stay fg-subtle: they still say what it would do
  return (
    <div
      ref={box}
      data-body="flat"
      data-no-drag=""
      className={
        "relative isolate flex w-full items-center overflow-hidden rounded-pill p-1 transition-colors duration-(--dur-instant) ease-litt select-none forced-colors:border " +
        (done ? "bg-fg " : disabled ? "bg-surface-2 " : "bg-surface-3 ") +
        track
      }
    >
      {/* The passed part: not drawn. Ink on paper has no fill to show how far it went, the circle says it; the span stays so the children keep their order. */}
      <motion.span aria-hidden="true" className="hidden" style={{ scaleX: band }} />
      <motion.span
        aria-hidden="true"
        className={"pointer-events-none absolute inset-0 grid place-items-center px-12 text-center text-small font-title " + ink}
        style={{ opacity: done ? 1 : words }}
      >
        <span className="max-w-full min-w-0 truncate">{done ? confirmedLabel : label}</span>
      </motion.span>
      <motion.button
        {...thumb}
        className={
          "relative grid aspect-square h-full shrink-0 touch-none place-items-center rounded-pill [-webkit-tap-highlight-color:transparent] " +
          "transition-colors duration-(--dur-instant) ease-litt " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 forced-colors:border " +
          (done ? "focus-visible:outline-canvas " : "focus-visible:outline-focus ") +
          (disabled ? "cursor-not-allowed bg-surface-3 text-fg-disabled" : "bg-fg text-canvas " + (done ? "cursor-default" : "cursor-grab active:cursor-grabbing"))
        }
      >
        {done ? glyph : null}
      </motion.button>
      {tail}
    </div>
  );
}
