/**
 * Seven-segment: a figure or a count on seven-segment digits behind LCD glass (proposals/device-studies.md, Agent
 * indicators, Segments). A Device part: the glass is --field with --field-ink for lit segments, so it is only at home
 * under data-material="device" (components.md, "Seven-segment").
 *
 * - Anatomy: a pane of glass (--field, --field-shade) holding one figure per character. A figure is an SVG of 43 by 66
 *   units with seven polygons, a to g, 6.6 thick with a gap of 1 between them, slanted 0.09 about its middle row.
 *   An unlit segment is the ink at 10% and a lit one the ink. A dot belongs to the figure before it and lights a
 *   small round point at the figure's foot.
 * - What it takes: the digits 0 to 9, a minus, a dot and a space. `digits` figures wide (default: as many as the value has);
 *   the value is right-aligned, and one too long for the glass shows a bar on every figure, never a wrong number.
 * - Motion: a change lights the new segments at once, and the ones that went out fade like phosphor: brightness times
 *   exp(-dt / 0.11) each frame, under 0.02 written as 0. One small loop per readout writes the segments' opacity
 *   attributes, never React state, and stops when every segment has settled. Nothing moves on its own (R4).
 *   Reduced motion switches the segments at once.
 * - Accessibility: the figures are hidden from assistive tech and the value is said in words in hidden text ("minus 12.5").
 *   A change is not announced; put it in a live region yourself if it matters.
 */
import { useEffect, useRef, useState } from "react";
import { useMotionDial } from "@/motion";

export type SevenSegmentProps = {
  /** What to show: the digits 0 to 9, a minus, a dot and a space. A number is shown as it prints. */
  value: number | string;
  /** How many figures wide the glass is. Default: as many as the value has (a dot shares the figure before it). */
  digits?: number;
  /** What the readout is, said before the value to a screen reader: "Temperature". */
  label?: string;
  className?: string;
};

/* The studies' numbers, in the figure's own units. */
const T = 6.6; // thickness
const GAP = 1;
const SLANT = 0.09;
const COL = [5.5, 31] as const; // the vertical bars' left edges
const ROW = [5, 33, 61] as const; // the horizontal bars' centre lines
const DECAY = 0.11; // seconds: brightness falls by 1/e in this long
const FLOOR = 0.02; // under this a segment is written as out
const UNLIT = 0.1;

const H = T / 2;
const GP = GAP / Math.SQRT2; // the tip's inset, so the diagonal gap between two segments is GAP
const XL = COL[0] + H;
const XR = COL[1] + H;

const pts = (list: [number, number][]) => list.map(([x, y]) => `${(x + (ROW[1] - y) * SLANT).toFixed(2)},${y.toFixed(2)}`).join(" ");
const across = (y: number): [number, number][] => [[XL + GP, y], [XL + GP + H, y - H], [XR - GP - H, y - H], [XR - GP, y], [XR - GP - H, y + H], [XL + GP + H, y + H]];
const down = (x: number, y1: number, y2: number): [number, number][] => [[x, y1 + GP], [x + H, y1 + GP + H], [x + H, y2 - GP - H], [x, y2 - GP], [x - H, y2 - GP - H], [x - H, y1 + GP + H]];

/** a b c d e f g, in that order. */
const SEGMENTS = [
  pts(across(ROW[0])),
  pts(down(XR, ROW[0], ROW[1])),
  pts(down(XR, ROW[1], ROW[2])),
  pts(across(ROW[2])),
  pts(down(XL, ROW[1], ROW[2])),
  pts(down(XL, ROW[0], ROW[1])),
  pts(across(ROW[1])),
];
const DOT = { cx: 39.4, cy: 62.6, r: 3 };

const LIT: Record<string, string> = { "0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg", "5": "acdfg", "6": "acdefg", "7": "abc", "8": "abcdefg", "9": "abcdfg", "-": "g", " ": "" };

type Figure = { char: string; dot: boolean };

/** The figures a value needs: each character is one, and a dot lights the point of the one before it. */
function figuresOf(text: string): Figure[] {
  const out: Figure[] = [];
  for (const char of text) {
    if (char === "." && out.length && !out[out.length - 1]!.dot) out[out.length - 1]!.dot = true;
    else if (char === ".") out.push({ char: " ", dot: true });
    else out.push({ char: char in LIT ? char : " ", dot: false });
  }
  return out;
}

/** Eight flags per figure: the seven segments, then the point. */
function litOf(figs: Figure[], digits: number): boolean[] {
  const over = figs.length > digits;
  const shown = over ? Array.from({ length: digits }, () => ({ char: "-", dot: false })) : [...Array.from({ length: digits - figs.length }, () => ({ char: " ", dot: false })), ...figs];
  return shown.flatMap((f) => [..."abcdefg"].map((s) => LIT[f.char]!.includes(s)).concat(f.dot));
}

function Digit({ lit }: { lit: boolean[] }) {
  /* React writes each opacity once, when the figure mounts; from then on the loop owns the attribute. */
  const [first] = useState(lit);
  return (
    <svg viewBox="0 0 43 66" aria-hidden="true" className="h-[2.4em] w-auto shrink-0 fill-current">
      {SEGMENTS.map((points, i) => (
        <polygon key={i} data-seg points={points} opacity={first[i] ? 1 : UNLIT} />
      ))}
      <circle data-seg cx={DOT.cx} cy={DOT.cy} r={DOT.r} opacity={first[7] ? 1 : UNLIT} />
    </svg>
  );
}

/** A readout of digits behind LCD glass: new segments light at once and the old ones fade like phosphor. */
export function SevenSegment({ value, digits, label, className = "" }: SevenSegmentProps) {
  const text = typeof value === "number" ? String(value) : value;
  const figs = figuresOf(text);
  const width = Math.max(1, digits ?? figs.length);
  const lit = litOf(figs, width);
  const { reduced } = useMotionDial();

  const root = useRef<HTMLSpanElement>(null);
  const state = useRef({ level: [] as number[], target: [] as boolean[], written: [] as string[], frame: 0 });

  useEffect(() => {
    const el = root.current;
    const s = state.current;
    if (!el) return;
    const segs = [...el.querySelectorAll("[data-seg]")];
    const write = (i: number) => {
      const op = (UNLIT + (1 - UNLIT) * s.level[i]!).toFixed(3);
      if (s.written[i] !== op) {
        segs[i]!.setAttribute("opacity", op);
        s.written[i] = op;
      }
    };
    /* A different number of figures is a new glass, not a change: it starts as it is. */
    if (s.level.length !== lit.length) {
      s.level = lit.map((on) => (on ? 1 : 0));
      s.written = lit.map((on) => (on ? "1.000" : UNLIT.toFixed(3)));
    }
    s.target = lit;
    cancelAnimationFrame(s.frame);
    s.frame = 0;
    if (reduced) {
      lit.forEach((on, i) => {
        s.level[i] = on ? 1 : 0;
        write(i);
      });
      return;
    }
    let moving = false;
    lit.forEach((on, i) => {
      if (on) {
        s.level[i] = 1; // lit at once
        write(i);
      } else if (s.level[i]! > 0) moving = true;
    });
    if (!moving) return;
    let last = performance.now();
    const frame = (now: number) => {
      const fall = Math.exp(-Math.min(0.1, (now - last) / 1000) / DECAY);
      last = now;
      let again = false;
      s.target.forEach((on, i) => {
        if (on || s.level[i] === 0) return;
        s.level[i] = s.level[i]! * fall < FLOOR ? 0 : s.level[i]! * fall;
        if (s.level[i]! > 0) again = true;
        write(i);
      });
      s.frame = again ? requestAnimationFrame(frame) : 0;
    };
    s.frame = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(s.frame);
    // lit is rebuilt each render; its contents are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lit.join(""), reduced]);

  const words = text.replace(/-/g, "minus ").replace(/\s+/g, " ").trim();
  return (
    <span
      ref={root}
      className={
        "inline-flex w-fit items-center gap-[0.35em] rounded-control bg-field px-3 py-2 text-body text-field-ink shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)] " + className
      }
    >
      <span className="sr-only">
        {label ? `${label}: ` : ""}
        {words}
      </span>
      {Array.from({ length: width }, (_, i) => (
        <Digit key={i} lit={lit.slice(i * 8, i * 8 + 8)} />
      ))}
    </span>
  );
}
