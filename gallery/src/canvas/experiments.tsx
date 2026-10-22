/**
 * Playful experiments for the brainstorm canvas. None of this is production: each piece either wraps a real component
 * through its public API or is a local copy of one with the one thing changed that its canvas name says. They go past
 * the locked motion on purpose (bigger bounce, a drawn path, a burst), so each value that does is marked litt-allow.
 *
 * Every experiment reads the motion dial, so under reduced motion nothing here moves: presses, ticks, bursts and
 * entrances all land at once.
 */
import { useId, useState, type ReactNode } from "react";
import { motion, type Transition } from "motion/react";
import { useMotionDial, useTransition, useTravel } from "@/motion";

/* The playful springs, past the locked dial. */
const PRESS: Transition = { type: "spring", visualDuration: 0.2, bounce: 0.45 }; // litt-allow: canvas experiment, a bouncier press than the dial allows
const POP: Transition = { type: "spring", visualDuration: 0.25, bounce: 0.5 }; // litt-allow: canvas experiment, the tick's pop
const DRAW: Transition = { type: "tween", duration: 0.22, ease: [0.2, 0, 0, 1] }; // litt-allow: canvas experiment, drawing the tick
const STRETCH: Transition = { type: "spring", visualDuration: 0.28, bounce: 0.35 }; // litt-allow: canvas experiment, the switch thumb's travel
const NONE: Transition = { duration: 0 }; // litt-allow: canvas experiment, what reduced motion gets
export const BOUNCY = 0.3; // litt-allow: canvas experiment, the expressive bounce raised from 0.12

const useStill = () => useMotionDial().reduced;

/* ------------------------------------------------------------------ press */

/** Shrinks what it wraps while held and springs it back: a press you can feel. */
export function Squish({ children }: { children: ReactNode }) {
  const reduced = useStill();
  return (
    <motion.span className="inline-flex" whileTap={reduced ? undefined : { scale: 0.95 }} transition={PRESS}>
      {children}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ checkbox */

/** A checkbox whose box pops and whose tick draws itself in. A real input, styled like litt's drawn box. */
export function DrawnCheckbox({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  const reduced = useStill();
  const [on, setOn] = useState(defaultChecked);
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-2 text-small text-fg [-webkit-tap-highlight-color:transparent]">
      <input type="checkbox" className="peer sr-only" checked={on} onChange={(e) => setOn(e.target.checked)} />
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ scale: on && !reduced ? [0.8, 1] : 1 }}
        transition={reduced ? NONE : POP}
        className={
          "grid size-5 shrink-0 place-items-center rounded-control shadow-[inset_0_0_0_1px_var(--line-control)] " +
          "transition-[background-color] duration-(--dur-instant) ease-litt " +
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus " +
          (on ? "bg-fg text-canvas" : "bg-surface-1 text-transparent")
        }
      >
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M3.75 8.25 6.75 11.25 12.25 5"
            initial={false}
            animate={{ pathLength: on ? 1 : 0 }}
            transition={reduced ? NONE : DRAW}
          />
        </svg>
      </motion.span>
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------ switch */

/** A switch whose thumb stretches while held and overshoots a little as it lands. Litt's track and thumb otherwise. */
export function StretchSwitch({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  const reduced = useStill();
  const [on, setOn] = useState(defaultChecked);
  const id = useId();
  return (
    <div className="flex min-h-9 items-center gap-2">
      <motion.button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        whileTap="held"
        className={
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-pill p-0.5 [-webkit-tap-highlight-color:transparent] " +
          "transition-[background-color] duration-(--dur-instant) ease-litt " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
          (on ? "bg-fg" : "bg-surface-1 shadow-[inset_0_0_0_1px_var(--line-control)]")
        }
      >
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ x: on ? 16 : 0 }}
          variants={reduced ? undefined : { held: { scaleX: 1.3 } }}
          transition={reduced ? NONE : STRETCH}
          style={{ originX: on ? 1 : 0 }}
          className={"block size-4 rounded-pill transition-[background-color] duration-(--dur-instant) ease-litt " + (on ? "bg-canvas" : "bg-line-control")}
        />
      </motion.button>
      <label htmlFor={id} className="cursor-pointer text-small text-fg">
        {label}
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ segmented */

/** Litt's segmented control with a thumb that springs past its target and settles. */
export function SpringySegmented({ legend, options }: { legend: string; options: string[] }) {
  const reduced = useStill();
  const [value, setValue] = useState(options[0]!);
  const name = useId();
  const index = options.indexOf(value);
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">{legend}</legend>
      <div className="relative inline-grid h-control-sm grid-flow-col auto-cols-fr rounded-surface bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] p-1 shadow-[inset_0_0_0_1px_var(--line)]">
        {/* One thumb, moved by transform in its own widths, so it stays exact at any zoom of the canvas. */}
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ x: `${index * 100}%` }}
          transition={reduced ? NONE : { type: "spring", visualDuration: 0.3, bounce: BOUNCY }} // litt-allow: canvas experiment
          className="absolute inset-y-1 left-1 rounded-control bg-surface-1 shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]"
          style={{ width: `calc((100% - 8px) / ${options.length})` }}
        />
        {options.map((o) => (
          <label
            key={o}
            className={
              "relative grid h-full cursor-pointer select-none place-items-center rounded-control px-control-pad-sm text-caption font-title " +
              "transition-colors duration-(--dur-instant) ease-litt " +
              (o === value ? "text-fg" : "text-fg-subtle hover:text-fg")
            }
          >
            <input type="radio" className="peer sr-only" name={name} checked={o === value} onChange={() => setValue(o)} />
            <span className="litt-trim relative z-1">{o}</span>
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-1 rounded-control peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ the expressive moment */

/** A toast-like panel that rises on the expressive spring, at a given bounce, each time `play` changes. */
export function Entrance({ play, bounce, children }: { play: number; bounce?: number; children: ReactNode }) {
  const reduced = useStill();
  const locked = useTransition("expressive");
  const travel = useTravel();
  const transition: Transition = reduced || bounce === undefined ? locked : { ...locked, bounce };
  return (
    <motion.div
      key={play}
      initial={play === 0 ? false : { opacity: 0, y: travel * 1.5, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ celebration */

const HUES = ["bg-data-blue", "bg-data-amber", "bg-data-teal", "bg-data-violet", "bg-data-rose"];
const DOTS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2 + 0.3;
  const reach = 28 + (i % 3) * 10;
  return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach, hue: HUES[i % HUES.length]! };
});

/** Ten dots in the five data hues that scatter once from a point and fade: a small reward for finishing something. */
export function Burst({ play }: { play: number }) {
  const reduced = useStill();
  if (play === 0 || reduced) return null;
  return (
    <span key={play} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {DOTS.map((d, i) => (
        <motion.span
          key={i}
          className={"absolute top-1/2 right-6 size-1.5 rounded-pill " + d.hue}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: d.x, y: d.y, opacity: 0, scale: 0.5 }}
          transition={{ type: "tween", duration: 0.6, ease: [0.2, 0, 0, 1] }} // litt-allow: canvas experiment, the burst
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ dot drawing */

/* A tick drawn on a 7 by 7 grid of dots: the lit ones, row by row. */
const TICK = ["0000000", "0000001", "0000011", "1000110", "1101100", "0111000", "0010000"];

/** A small dot-matrix drawing (a tick) that assembles once when it arrives: the view's one expressive moment. */
export function DotTick({ play }: { play: number }) {
  const reduced = useStill();
  const enter = useTransition("expressive");
  return (
    <div key={play} aria-hidden="true" className="grid w-max grid-cols-7 gap-1">
      {TICK.flatMap((row, r) =>
        [...row].map((cell, c) => (
          <motion.span
            key={`${r}-${c}`}
            className={"size-1.5 rounded-pill " + (cell === "1" ? "bg-data-teal" : "bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]")}
            initial={reduced || cell === "0" ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...enter, delay: reduced ? 0 : (r + c) * 0.03 }} // litt-allow: canvas experiment, a diagonal stagger
          />
        )),
      )}
    </div>
  );
}
