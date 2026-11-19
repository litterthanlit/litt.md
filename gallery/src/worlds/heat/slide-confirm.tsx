/**
 * Slide to confirm, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a hazard-striped confirmation
 * channel with a sharp square handle framed in amber corner brackets.
 *
 * - The track is a flat square black slab (`rounded-none border border-line-strong bg-surface-1`) with subtle diagonal
 *   hazard stripes; as the handle drags right, a warm amber-tinted wake (`color-mix(in_oklab,var(--accent-text)_22%,transparent)`)
 *   fills behind it.
 * - The handle is a sharp square dark block (`bg-block border border-line-strong`) carrying four 6px amber corner
 *   brackets and a `››` chevron grip.
 * - Confirmed, the track switches to `--block` with four 8px amber corner brackets and `--accent-text` confirmation
 *   words (never a full-box accent fill, R6).
 * - Forced colors keeps borders and Highlight for the passed band.
 */
import { motion } from "motion/react";
import type { SlideConfirmBodyProps } from "@/components/slide-confirm";

const stripes = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

const handleBrackets =
  "pointer-events-none absolute inset-0 bg-no-repeat text-accent-text " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const doneBrackets =
  "pointer-events-none absolute inset-0 z-1 bg-no-repeat text-accent-text " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

/** Heat, the hazard-striped slide channel with an amber-bracketed square handle. */
export function SlideConfirmHeatBody({ label, confirmedLabel, done, disabled, track, box, band, words, glyph, thumb, tail }: SlideConfirmBodyProps) {
  const ink = done ? "text-accent-text" : disabled ? "text-fg-subtle" : "text-fg";
  return (
    <div
      ref={box}
      data-body="heat"
      data-no-drag=""
      className={
        "relative isolate flex w-full items-center overflow-hidden rounded-none border p-1 select-none transition-colors duration-(--dur-instant) ease-litt forced-colors:border " +
        (done
          ? "border-line-strong bg-block "
          : disabled
            ? "border-line bg-surface-2 "
            : "border-line-strong bg-surface-1 " + stripes + " ") +
        track
      }
    >
      {done && <span aria-hidden="true" className={doneBrackets} />}
      {/* The wake behind the handle: a subtle warm tint of --accent-text scaled from the left. */}
      {!done && (
        <motion.span
          aria-hidden="true"
          className={
            "pointer-events-none absolute inset-y-0 left-1 w-[calc(100%-0.5rem)] origin-left " +
            (disabled ? "bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]" : "bg-[color-mix(in_oklab,var(--accent-text)_22%,transparent)] forced-colors:bg-[Highlight]")
          }
          style={{ scaleX: band }}
        />
      )}
      <motion.span
        aria-hidden="true"
        className={"pointer-events-none absolute inset-0 grid place-items-center px-14 text-center text-small font-title " + ink}
        style={{ opacity: done ? 1 : words }}
      >
        <span className={"max-w-full min-w-0 truncate " + (done || disabled ? "" : "bg-canvas px-2 py-0.5")}>{done ? confirmedLabel : label}</span>
      </motion.span>
      <motion.button
        {...thumb}
        className={
          "relative grid h-full w-12 shrink-0 touch-none place-items-center rounded-none border [-webkit-tap-highlight-color:transparent] " +
          "transition-[background-color,border-color,color] duration-(--dur-instant) ease-litt " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border " +
          (disabled
            ? "cursor-not-allowed border-line bg-surface-2 text-fg-disabled"
            : done
              ? "cursor-default border-line-strong bg-canvas text-accent-text"
              : "cursor-grab border-line-strong bg-block text-accent-text active:cursor-grabbing active:bg-(--block-hover)")
        }
      >
        {!disabled && !done && <span aria-hidden="true" className={handleBrackets} />}
        {done ? (
          glyph
        ) : (
          <span aria-hidden="true" className="font-title text-small">
            ››
          </span>
        )}
      </motion.button>
      {tail}
    </div>
  );
}
