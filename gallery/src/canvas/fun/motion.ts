/**
 * Fun mode: how litt's data parts could move when the mode is on. A canvas experiment, not production.
 *
 * The one rule: fun mode changes how things move, never how they look at rest. Every fun part comes to rest on
 * exactly the frame its production twin draws: the same marks, hues, type and spacing. The fun is in three moments:
 * - Arrival: marks grow to their values in a choreographed wave, and the figures count up with them.
 * - Change: a new value springs from the old one, interruptibly, so a press mid-flight keeps the motion's velocity.
 * - Touch: what is under the finger answers it at once.
 *
 * Two honesty rules keep it litt:
 * - A mark may overshoot by a hair, as a physical thing would. A number never does: a figure never shows a value the
 *   data does not hold, so counts are clamped at their target while the mark settles.
 * - Celebration is earned: only a real milestone (a goal reached, a run that went live) gets one, once, small, in the
 *   data hues already on screen. Nothing loops, nothing pulses, material never animates (P5).
 *
 * Reduced motion: every part lands on its rest frame at once.
 *
 * A handful of springs, used everywhere, so it reads as one mode instead of six effects. They go past the locked dial
 * on purpose; that is the experiment.
 */
import type { Transition } from "motion/react";
import { useMotionDial } from "@/motion";

export const FUN = {
  /** A mark growing to its value: one soft overshoot, then still. Rails, ticks, bars. */
  grow: { type: "spring", visualDuration: 0.75, bounce: 0.2 }, // litt-allow: fun mode
  /** A small thing landing: a dot, a check, a step's icon. */
  pop: { type: "spring", visualDuration: 0.38, bounce: 0.55 }, // litt-allow: fun mode
  /** Rows trading places: quick, a little life on arrival. */
  swap: { type: "spring", visualDuration: 0.5, bounce: 0.18 }, // litt-allow: fun mode
  /** Following a pointer: tight and without overshoot, so it never lags the finger. */
  follow: { type: "spring", visualDuration: 0.18, bounce: 0 }, // litt-allow: fun mode
  /** Drawing a line: a tween, so the pen moves at a steady hand. */
  draw: { type: "tween", duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }, // litt-allow: fun mode
  /** Seconds between neighbours in a wave. */
  wave: 0.014, // litt-allow: fun mode
} satisfies Record<string, Transition | number>;

const NONE: Transition = { duration: 0 }; // litt-allow: fun mode, what reduced motion gets

/** Fun mode's transitions, or none at all under reduced motion. */
export function useFun() {
  const reduced = useMotionDial().reduced;
  return {
    reduced,
    grow: reduced ? NONE : FUN.grow,
    pop: reduced ? NONE : FUN.pop,
    swap: reduced ? NONE : FUN.swap,
    follow: reduced ? NONE : FUN.follow,
    draw: reduced ? NONE : FUN.draw,
    wave: reduced ? 0 : FUN.wave,
  };
}

/** A number on its way to `to`, at `p` of the way there, clamped so it never shows more than the data holds. */
export const honest = (to: number, p: number) => Math.round(to * Math.max(0, Math.min(1, p)));

export const groupDigits = (n: number) => n.toLocaleString("en-GB");
