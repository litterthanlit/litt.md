/**
 * Rolling number: a figure whose changed digits roll to their new value (components.md, "Rolling number").
 *
 * - It is the number only, in the font, size and color it sits in, with tabular figures so no digit changes width.
 *   Pass it as a Stat's value, a Gauge caption or anywhere a count updates in place. Stat itself stays still: the
 *   roll is opt-in, by composing this.
 * - The text comes from Intl.NumberFormat (locale and options are props), so "12,480", "€1,250.50" and "64%" all
 *   roll. Characters are lined up from the right, so 999 to 1,000 rolls the digits that changed and the new
 *   column and the comma simply appear.
 * - Motion: only the changed characters move, each on the responsive tier: the old one leaves half of the travel
 *   token and fades, the new one comes in from the other side and fades in, inside a cell that clips them, as the
 *   Date picker's months do. Up from below when the value rises, down from above when it falls. Never further
 *   than the travel token (the digits never travel their own height), never a bounce, never the view's one
 *   expressive moment. The first render does not roll. The hooks return 0 under reduced motion, so the digits
 *   simply change.
 * - Accessibility: screen readers get the whole formatted figure as text, and the rolling cells are hidden from
 *   them. A change is not announced: put it in a live region yourself if it should be.
 */
import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";

export type RollingNumberProps = {
  /** The figure. When it changes, the characters that differ roll to their new value. */
  value: number;
  /** Intl.NumberFormat options, such as { style: "currency", currency: "EUR" } or { style: "percent" }. */
  format?: Intl.NumberFormatOptions;
  /** The locale for the format. */
  locale?: string;
  /** Extra classes, such as a text size. It takes the font, size and color of where it sits. */
  className?: string;
};

/** A number whose changed digits roll to the new value: up when it rises, down when it falls. */
export function RollingNumber({ value, format, locale = "en-GB", className = "" }: RollingNumberProps) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  const text = new Intl.NumberFormat(locale, format).format(value);

  /* Which way the last change went: 1 when it rose, -1 when it fell. Set while rendering, React's pattern for state
     that follows a prop, so the new digits and the leaving ones both know it in the same render. */
  const [prev, setPrev] = useState(value);
  const [dir, setDir] = useState(1);
  if (value !== prev) {
    setPrev(value);
    setDir(value > prev ? 1 : -1);
  }
  /* Through `custom`, so a digit that is leaving takes the newest direction too. */
  const roll: Variants = {
    enter: (d: number) => ({ y: (d * travel) / 2, opacity: 0 }),
    center: { y: 0, opacity: 1, transition: enter },
    leave: (d: number) => ({ y: (-d * travel) / 2, opacity: 0, transition: exit }),
  };

  /* Keyed by place from the right, so a new leading column never shifts the others' keys. */
  const chars = [...text].map((ch, i, all) => ({ ch, place: all.length - 1 - i }));

  return (
    <span className={"inline-flex tabular-nums " + className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        {chars.map(({ ch, place }) => (
          <span key={place} className="relative inline-flex overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout" custom={dir}>
              <motion.span key={ch} custom={dir} variants={roll} initial="enter" animate="center" exit="leave" className="inline-block whitespace-pre">
                {ch}
              </motion.span>
            </AnimatePresence>
          </span>
        ))}
      </span>
    </span>
  );
}
