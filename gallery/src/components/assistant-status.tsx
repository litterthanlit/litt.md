/**
 * AssistantStatus, a Flat part (skills/litt-md/taste/litt-principles.md, Flat; proposals/flat-studies, Agent
 * indicators): what a writing assistant is doing while it drafts, said in one white pill on the grey ground. An ink
 * circle holds a small glyph that moves its own way for each phase, and the words say the phase ("Searching 12
 * sources"). Device's AgentIndicator says the same in hardware; this is Flat's plain web-app version.
 *
 * - The pill: white paper on the ground (`bg-surface-1`, no outline and nothing cast), 52px tall at the pill radius
 *   (60px from the sm breakpoint). The circle is the ink (`bg-fg`) with the paper's color drawn on it. The words: the
 *   phase at the label weight in the ink, the detail after it in the muted ink.
 * - The glyphs, one per phase, each its own motion idea in a 24 unit box: thinking turns a quarter arc round a faint
 *   ring; searching moves a lens between places on a spring that overshoots a little and settles; reading sweeps
 *   three lines in bursts; weighing tumbles a rounded square a quarter turn at a time; checking fills a ring step by
 *   step; writing lays down lines with a caret at their end.
 * - Motion: one requestAnimationFrame loop per pill writes attributes on the SVG it already has (React never
 *   re-renders for a frame). It runs only while `paused` is false, the pill is on screen and the tab is visible, which
 *   an app ties to its stream; paused, the glyph holds the frame it is on. A glyph is stepped 1.2s ahead before it
 *   first paints, so it is never seen at rest. It never runs on its own (R4): it runs while you say the work does.
 * - A new phase: the glyph arrives from 86% on the expressive spring (Flat's 0.28); the old line of words leaves up
 *   with no bounce on the exit tween while the new one rises in on the expressive spring (Flat's motion, rule 5).
 *   The pill takes the new words' width once the old line has left.
 * - Under reduced motion nothing moves: each glyph holds the frame it rolled to, and the words change in place.
 * - Semantics: role="status" with the phase and detail in words; the glyph and the visible words are aria-hidden, so
 *   the status is read once, by its name, when it changes.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useMotionDial, useTransition } from "@/motion";

export type AssistantPhase = "thinking" | "searching" | "reading" | "weighing" | "checking" | "writing";

/** The phases in the order an assistant usually passes through them. */
export const ASSISTANT_PHASES: AssistantPhase[] = ["thinking", "searching", "reading", "weighing", "checking", "writing"];

/** Each phase's own word, used when `label` is left out. */
export const PHASE_WORDS: Record<AssistantPhase, string> = {
  thinking: "Thinking",
  searching: "Searching",
  reading: "Reading",
  weighing: "Weighing",
  checking: "Checking",
  writing: "Writing",
};

export type AssistantStatusProps = {
  /** What the assistant is doing, which picks the glyph and the word. */
  phase: AssistantPhase;
  /** The word for the phase, in place of its own ("Thinking"). */
  label?: string;
  /** What it is working on, after the word, in the muted ink ("12 sources"). */
  detail?: string;
  /** Holds the glyph on the frame it is on. Tie it to your stream, so it moves only while tokens arrive. */
  paused?: boolean;
  className?: string;
};

/* ----------------------------------------------------------------- the glyphs */

const NS = "http://www.w3.org/2000/svg";
/** How far a glyph is stepped before it first paints, in seconds. */
const AHEAD = 1.2;

function el(tag: string, attrs: Record<string, string | number>, parent: Element) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent.appendChild(e);
  return e;
}
const set = (e: Element, n: string, v: string) => {
  if (e.getAttribute(n) !== v) e.setAttribute(n, v);
};
const stroke = { fill: "none", stroke: "currentColor", "stroke-width": 2.4 };
const line = (svg: Element, x1: number, y: number, x2: number, extra: Record<string, string | number> = {}) =>
  el("line", { x1, x2, y1: y, y2: y, stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", ...extra }, svg);

/** A damped spring stepped at 1/240s, for the glyph parts that move on one. */
type Sp = { x: number; v: number; target: number };
function springStep(s: Sp, dt: number, k: number, c: number) {
  for (let left = dt; left > 0; left -= 1 / 240) {
    const h = Math.min(left, 1 / 240);
    s.v += (k * (s.target - s.x) - c * s.v) * h;
    s.x += s.v * h;
  }
}

type Step = (dt: number) => void;

/* Each glyph draws into a 24 unit box in currentColor and returns its frame. Every pace is a named constant. */
const GLYPHS: Record<AssistantPhase, (svg: SVGSVGElement) => Step> = {
  // A quarter arc turning round a faint ring, a little faster and slower as it goes.
  thinking(svg) {
    el("circle", { cx: 12, cy: 12, r: 7, ...stroke, opacity: 0.28 }, svg);
    const arc = el("circle", { cx: 12, cy: 12, r: 7, ...stroke, "stroke-linecap": "round", pathLength: 100, "stroke-dasharray": "28 72" }, svg);
    let a = 0;
    let t = 0;
    return (dt) => {
      t += dt;
      a += dt * (300 + 160 * Math.sin(t * 3));
      set(arc, "transform", `rotate(${(a % 360).toFixed(1)} 12 12)`);
    };
  },
  // A lens that seeks between places on a spring (it overshoots a little and settles), and holds at each.
  searching(svg) {
    const g = el("g", {}, svg);
    el("circle", { cx: 11, cy: 11, r: 4.4, fill: "none", stroke: "currentColor", "stroke-width": 2.2 }, g);
    el("line", { x1: 14.4, y1: 14.4, x2: 17.4, y2: 17.4, stroke: "currentColor", "stroke-width": 2.4, "stroke-linecap": "round" }, g);
    const STOPS = [0.15, 0.6, 0.35, 0.85];
    const HOLD = 0.5;
    const s: Sp = { x: 0.15, v: 0, target: 0.15 };
    let at = 0;
    let dwell = HOLD;
    let y = 0;
    return (dt) => {
      if (dwell > 0) {
        dwell -= dt;
        if (dwell <= 0) at = (at + 1) % STOPS.length;
      } else {
        const step = 0.9 * dt;
        const goal = STOPS[at];
        s.target = Math.abs(goal - s.target) <= step ? goal : s.target + Math.sign(goal - s.target) * step;
        if (s.target === goal) dwell = HOLD;
      }
      springStep(s, dt, 110, 14);
      y += dt;
      set(g, "transform", `translate(${((s.x - 0.5) * 9).toFixed(2)} ${(Math.sin(y * 2.4) * 1.2).toFixed(2)})`);
    };
  },
  // Three lines read in bursts: the sweep runs fast, pauses, runs again. The bursts follow a fixed pattern.
  reading(svg) {
    const ys = [7.5, 12, 16.5];
    const w = [12, 12, 8];
    ys.forEach((yy, i) => line(svg, 6, yy, 6 + w[i], { opacity: 0.3 }));
    const lit = ys.map((yy) => line(svg, 6, yy, 6, { opacity: 0 }));
    const total = w.reduce((a, b) => a + b, 0);
    const BURSTS = [0.4, 0.22, 0.3, 0.18];
    const GAPS = [0.12, 0.28, 0.1, 0.2];
    const SPEEDS = [24, 30, 20, 28];
    let n = 0;
    let p = 0;
    let burst = BURSTS[0];
    let gap = 0;
    let hold = 0;
    return (dt) => {
      if (hold > 0) {
        hold -= dt;
        if (hold <= 0) p = 0;
      } else if (burst > 0) {
        burst -= dt;
        p += dt * SPEEDS[n % SPEEDS.length];
        if (burst <= 0) gap = GAPS[n % GAPS.length];
      } else {
        gap -= dt;
        if (gap <= 0) burst = BURSTS[++n % BURSTS.length];
      }
      if (p >= total && hold <= 0) {
        p = total;
        hold = 0.35;
      }
      let left = p;
      lit.forEach((l, i) => {
        const len = Math.max(0, Math.min(w[i], left));
        left -= w[i];
        set(l, "x2", (6 + len).toFixed(2));
        set(l, "opacity", len > 0.5 ? "1" : "0");
      });
    };
  },
  // A rounded square that tumbles a quarter turn at a time on Flat's expressive spring, rounding as it turns.
  weighing(svg) {
    const r = el("rect", { x: 7, y: 7, width: 10, height: 10, rx: 2.5, ...stroke }, svg);
    const w = (2 * Math.PI) / 0.35;
    const k = w * w;
    const c = 2 * (1 - 0.28) * w;
    const s: Sp = { x: 0, v: 0, target: 0 };
    let t = 0;
    return (dt) => {
      t += dt;
      if (t >= 0.7) {
        t -= 0.7;
        s.target += 90;
      }
      springStep(s, dt, k, c);
      const turning = Math.min(1, Math.abs(s.target - s.x) / 45);
      set(r, "rx", (2.5 + 2.5 * turning).toFixed(2));
      set(r, "transform", `rotate(${(s.x % 360).toFixed(1)} 12 12)`);
    };
  },
  // A ring filled step by step, eight steps, held full, then again.
  checking(svg) {
    el("circle", { cx: 12, cy: 12, r: 7, ...stroke, opacity: 0.28 }, svg);
    const arc = el("circle", { cx: 12, cy: 12, r: 7, ...stroke, "stroke-linecap": "round", pathLength: 80, "stroke-dasharray": "0 80", transform: "rotate(-90 12 12)" }, svg);
    const shown: Sp = { x: 0, v: 0, target: 0 };
    let t = 0;
    let steps = 0;
    let stage: "run" | "hold" | "rest" = "run";
    return (dt) => {
      t += dt;
      if (stage === "run" && t >= 0.22) {
        t = 0;
        steps++;
        if (steps >= 8) stage = "hold";
      } else if (stage === "hold" && t >= 0.5) {
        stage = "rest";
        t = 0;
        steps = 0;
      } else if (stage === "rest" && t >= 0.2) {
        stage = "run";
        t = 0;
      }
      shown.target = steps;
      springStep(shown, dt, 900, 60);
      const len = Math.max(0, shown.x * 10 - 3);
      set(arc, "stroke-dasharray", `${len.toFixed(2)} 80`);
      set(arc, "opacity", len > 0.1 ? "1" : "0");
    };
  },
  // Lines laid down one after another with a caret at their end, then the page clears.
  writing(svg) {
    const ys = [7.5, 12, 16.5];
    const w = [12, 10, 7];
    const lines = ys.map((yy) => line(svg, 6, yy, 6, { opacity: 0 }));
    const caret = el("line", { x1: 6, x2: 6, y1: 4.5, y2: 10.5, stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round" }, svg);
    const total = w.reduce((a, b) => a + b, 0);
    let p = 0;
    let hold = 0;
    let fade = 1;
    return (dt) => {
      if (hold > 0) {
        hold -= dt;
        fade = Math.min(1, hold / 0.2);
        if (hold <= 0) {
          p = 0;
          fade = 1;
        }
      } else {
        p += dt * 14;
        if (p >= total) {
          p = total;
          hold = 0.6;
        }
      }
      let left = p;
      let cx = 6;
      let cy = ys[0];
      lines.forEach((l, i) => {
        const len = Math.max(0, Math.min(w[i], left));
        left -= w[i];
        set(l, "x2", (6 + len).toFixed(2));
        set(l, "opacity", len > 0.3 ? fade.toFixed(2) : "0");
        if (len > 0) {
          cx = 6 + len + 2;
          cy = ys[i];
        }
      });
      set(caret, "transform", `translate(${(cx - 6).toFixed(2)} ${(cy - 7.5).toFixed(2)})`);
      set(caret, "opacity", fade.toFixed(2));
    };
  },
};

/* ----------------------------------------------------------------- AssistantStatus */

/** What a writing assistant is doing, in one white pill: an ink circle with the phase's own moving glyph, and the phase in words. A Flat part. */
export function AssistantStatus({ phase, label, detail, paused = false, className = "" }: AssistantStatusProps) {
  const { reduced } = useMotionDial();
  const arrive = useTransition("expressive");
  const leave = useExit("responsive");
  const glyph = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const step = useRef<Step | null>(null);
  const seen = useRef(false);
  const [visible, setVisible] = useState(true);
  const running = !paused && !reduced && visible;
  const word = label ?? PHASE_WORDS[phase];
  const said = detail ? `${word} ${detail}` : word;

  /* Builds the phase's glyph and steps it ahead before it paints. */
  useLayoutEffect(() => {
    const host = glyph.current;
    if (!host) return;
    const svg = document.createElementNS(NS, "svg") as SVGSVGElement;
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("class", "size-full overflow-visible p-1.5");
    const draw = GLYPHS[phase](svg);
    for (let t = 0; t < AHEAD; t += 1 / 60) draw(1 / 60);
    host.replaceChildren(svg);
    step.current = draw;
    return () => {
      step.current = null;
    };
  }, [phase]);

  /* Off screen or in a hidden tab, it stops. */
  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    let onScreen = true;
    const update = () => setVisible(onScreen && document.visibilityState !== "hidden");
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      update();
    });
    io.observe(node);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      step.current?.(Math.min(0.1, (now - last) / 1000));
      last = now;
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [running, phase]);

  /* The first phase is there at once; every later one arrives. */
  const fresh = seen.current && !reduced;
  useEffect(() => {
    seen.current = true;
  }, []);

  return (
    <div
      ref={root}
      role="status"
      aria-label={said}
      className={
        "inline-flex h-13 max-w-full min-w-0 items-center gap-2.5 rounded-pill bg-surface-1 ps-2 pe-5 text-fg forced-colors:border sm:h-15 sm:gap-3 sm:ps-2.5 sm:pe-6 " +
        className
      }
    >
      <motion.span
        key={phase}
        ref={glyph}
        aria-hidden="true"
        initial={fresh ? { scale: 0.86 } : false}
        animate={{ scale: 1 }}
        transition={arrive}
        className="grid size-9 shrink-0 rounded-pill bg-fg text-canvas forced-colors:border forced-colors:text-[CanvasText] sm:size-10"
      />
      <span aria-hidden="true" className="relative grid min-w-0 overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.span
            key={said}
            initial={fresh ? { y: 18, opacity: 0 } : false}
            animate={{ y: 0, opacity: 1, transition: arrive }}
            exit={{ y: -14, opacity: 0, transition: leave }}
            className="col-start-1 row-start-1 truncate text-body"
          >
            <b className="font-label">{word}</b>
            {detail && <span className="text-fg-muted"> {detail}</span>}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}
