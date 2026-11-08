/**
 * Agent indicator: what an agent is doing, said in hardware. Six mechanisms in one 5.6em by 2.6em box, one per phase,
 * so each can stand in for any other: thinking is two seven-segment figures chasing a lit segment round their rim,
 * searching is a tuner whose needle seeks five stations and lights a lamp where it locks, reading is stereo meters
 * that rise with each burst of tokens, reasoning is a dot matrix of drifting waves, running is eight step lights with
 * a playhead, and writing is two tape reels turning at the speed their packs give them. A Device part (worlds.md,
 * Depth): it needs data-material="device" on <html> to look right, and in any other material it still renders
 * without throwing, as a dark cut with ink on it.
 *
 * - Window (material.md, 8): the LCD glass. `--field` is the floor, `--field-ink` is every lit segment, bar and dot,
 *   and the edge is `--field-line` with `--field-shade` on the top wall, as an Input's. The one accent is the
 *   record lamp: the tuner's needle and lamp, the chase's playhead and the reels' lamp. Unlit parts are the ink at
 *   8 to 15%, made with color-mix and an opacity, never a second color.
 * - Moves only while tokens arrive (R4): it runs while a phase is set and `paused` is false, which an app ties to its
 *   stream. Paused, it holds the frame it is on. Off screen, an IntersectionObserver stops it. Under reduced motion
 *   it never runs and holds the frame it rolled to.
 * - One loop: every indicator on the page shares a single requestAnimationFrame, which stops when none is live. A frame
 *   writes attributes and inline styles on the elements it already has and only when a value changed. React renders
 *   the structure once and never re-renders for animation. dt is clamped to 0.1s.
 * - Pre-roll: on mount each mechanism is stepped 1.2s ahead in 1/60s steps before it first paints, so one is never
 *   seen at rest, and a paused one holds a frame that looks mid-thought.
 * - Phase change: the new mechanism mounts already rolled and fades in on the exit-responsive duration (150ms) while
 *   the old one fades out in the same grid cell, then unmounts. Opacity is the only thing that transitions.
 * - Semantics: role="status" with the phase in sr-only words ("Thinking"), because the picture is never the only
 *   word (R5). The drawing is aria-hidden. `label` replaces the words.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { useMotionDial } from "@/motion";

/* ----------------------------------------------------------------- the shared loop */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** One frame of a mechanism, `dt` in seconds. */
type Sim = { step: (dt: number) => void };
type Make = (root: HTMLElement) => Sim;

const runners = new Set<(dt: number) => void>();
let frame = 0;
let last = 0;

function tick(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  runners.forEach((run) => run(dt));
  frame = runners.size ? requestAnimationFrame(tick) : 0;
}

/** Joins the page's single loop and starts it if it is stopped. Returns the way out, which stops it when the last one leaves. */
function join(run: (dt: number) => void) {
  runners.add(run);
  if (!frame) {
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
  return () => {
    runners.delete(run);
    if (!runners.size && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

/** A setter that touches the DOM only when the value changed. */
const attr = (el: Element, name: string) => {
  let prev = "";
  return (v: string) => {
    if (v !== prev) {
      prev = v;
      el.setAttribute(name, v);
    }
  };
};
const css = (el: HTMLElement, prop: "clipPath" | "left") => {
  let prev = "";
  return (v: string) => {
    if (v !== prev) {
      prev = v;
      el.style[prop] = v;
    }
  };
};
const q = (root: ParentNode, selector: string) => root.querySelector(selector)!;
const qa = (root: ParentNode, selector: string) => Array.from(root.querySelectorAll(selector));

/** A seeded generator, so a mechanism plays the same bursts on every load. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PREROLL = 1.2;
const STEP = 1 / 60;

/** Builds a mechanism on the element it renders, rolls it ahead before the first paint, and runs it while `live`. */
function useSim(make: Make, live: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const sim = useRef<Sim | null>(null);
  useLayoutEffect(() => {
    const s = make(ref.current!);
    for (let t = 0; t < PREROLL; t += STEP) s.step(STEP);
    sim.current = s;
    return () => {
      sim.current = null;
    };
  }, [make]);
  useEffect(() => (live ? join((dt) => sim.current?.step(dt)) : undefined), [live]);
  return ref;
}

/* ----------------------------------------------------------------- Segments (thinking) */

const THICK = 6.6;
const HALF = THICK / 2;
const TIP = 0.71;
const LEFT = 5.5;
const RIGHT = 31;
const TOP = 5;
const MID = 33;
const BOTTOM = 61;

const across = (x1: number, x2: number, y: number) =>
  [[x1 + TIP, y], [x1 + TIP + HALF, y - HALF], [x2 - TIP - HALF, y - HALF], [x2 - TIP, y], [x2 - TIP - HALF, y + HALF], [x1 + TIP + HALF, y + HALF]] as const;
const down = (x: number, y1: number, y2: number) =>
  [[x, y1 + TIP], [x + HALF, y1 + TIP + HALF], [x + HALF, y2 - TIP - HALF], [x, y2 - TIP], [x - HALF, y2 - TIP - HALF], [x - HALF, y1 + TIP + HALF]] as const;
const points = (p: readonly (readonly [number, number])[]) => p.map(([x, y]) => `${x},${y}`).join(" ");

/* a to g: top, top right, bottom right, bottom, bottom left, top left, middle. */
const SEGMENTS = [
  points(across(LEFT, RIGHT, TOP)),
  points(down(RIGHT, TOP, MID)),
  points(down(RIGHT, MID, BOTTOM)),
  points(across(LEFT, RIGHT, BOTTOM)),
  points(down(LEFT, MID, BOTTOM)),
  points(down(LEFT, TOP, MID)),
  points(across(LEFT, RIGHT, MID)),
];

/* The chase, clockwise from the top left of the left figure: (figure, segment). */
const CHASE: readonly (readonly [number, number])[] = [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3], [0, 3], [0, 4], [0, 5]];

function makeSegments(root: HTMLElement): Sim {
  const lit = qa(root, "polygon");
  const set = lit.map((el) => attr(el, "opacity"));
  const level = lit.map(() => 0);
  let t = 0;
  let head = -1;
  return {
    step(dt) {
      t += dt;
      const fade = Math.exp(-dt / 0.11);
      for (let i = 0; i < level.length; i++) level[i] = level[i]! * fade;
      const at = Math.floor(t / 0.085);
      while (head < at) {
        head++;
        const [fig, seg] = CHASE[head % CHASE.length]!;
        level[fig * 7 + seg] = 1;
      }
      for (let i = 0; i < level.length; i++) {
        const b = level[i]! < 0.02 ? 0 : level[i]!;
        set[i]!((0.1 + 0.9 * b).toFixed(3));
      }
    },
  };
}

function Segments({ live }: { live: boolean }) {
  const ref = useSim(makeSegments, live);
  return (
    <div ref={ref} className={LCD + " gap-[0.2em]"}>
      {[0, 1].map((fig) => (
        <svg key={fig} viewBox="0 0 43 66" fill="currentColor" className="h-[64%] w-auto">
          <g transform="matrix(1 0 -0.09 1 5.94 0)">
            {SEGMENTS.map((p, i) => (
              <polygon key={i} points={p} opacity="0.1" />
            ))}
          </g>
        </svg>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Tuner (searching) */

const STATIONS = [0.12, 0.31, 0.5, 0.69, 0.88];
const TICKS = Array.from({ length: 21 }, (_, i) => i);
const dialX = (x: number) => 6 + 44 * x;

function makeTuner(root: HTMLElement): Sim {
  const setNeedle = attr(q(root, "[data-needle]"), "transform");
  const setLamp = attr(q(root, "[data-lamp]"), "opacity");
  let visit = 0;
  let dir = 1;
  let goal = STATIONS[0]!;
  let seek = STATIONS[0]!;
  let dwell = 0.7;
  let x = STATIONS[0]!;
  let v = 0;
  let lock = 0;
  let spare = 0;
  return {
    step(dt) {
      if (dwell > 0) {
        dwell -= dt;
        if (dwell <= 0) {
          if (visit + dir < 0 || visit + dir >= STATIONS.length) dir = -dir;
          visit += dir;
          goal = STATIONS[visit]!;
        }
      } else {
        const move = 0.5 * dt;
        if (Math.abs(goal - seek) <= move) {
          seek = goal;
          dwell = 0.7;
        } else seek += Math.sign(goal - seek) * move;
      }
      spare += dt;
      const h = 1 / 240;
      while (spare >= h) {
        v += (110 * (seek - x) - 14 * v) * h;
        x += v * h;
        spare -= h;
      }
      const near = dwell > 0 ? Math.max(0, 1 - Math.abs(x - goal) / 0.02) : 0;
      lock += (near - lock) * (1 - Math.exp(-dt / 0.06));
      setNeedle(`translate(${dialX(x).toFixed(2)} 0)`);
      setLamp((0.12 + 0.88 * lock).toFixed(3));
    },
  };
}

function Tuner({ live }: { live: boolean }) {
  const ref = useSim(makeTuner, live);
  return (
    <div ref={ref} className={LCD}>
      <svg viewBox="0 0 56 26" fill="none" className="h-full w-full">
        {TICKS.map((i) => (
          <line key={i} x1={6 + 2.2 * i} x2={6 + 2.2 * i} y1={i % 5 === 0 ? 17.5 : 19.5} y2="22" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
        ))}
        <line x1="6" x2="50" y1="22" y2="22" stroke="currentColor" strokeWidth="0.4" opacity="0.2" />
        <circle data-lamp cx="50.5" cy="5.5" r="1.4" fill="currentColor" opacity="0.12" style={{ filter: "drop-shadow(0 0 1.2px currentColor)" }} />
        <line data-needle x1="0" x2="0" y1="3.5" y2="23.5" strokeWidth="0.9" strokeLinecap="round" className="stroke-accent" transform={`translate(${dialX(STATIONS[0]!)} 0)`} />
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------- Meters (reading) */

/* dB to a fraction of the bar, piecewise linear. */
const DB: readonly (readonly [number, number])[] = [[-60, 0], [-40, 0.2], [-20, 0.4], [-12, 0.6], [-6, 0.8], [0, 1]];
function fraction(db: number) {
  if (db <= DB[0]![0]) return 0;
  for (let i = 1; i < DB.length; i++) {
    const [d1, f1] = DB[i]!;
    const [d0, f0] = DB[i - 1]!;
    if (db <= d1) return f0 + ((db - d0) / (d1 - d0)) * (f1 - f0);
  }
  return 1;
}

function makeMeters(root: HTMLElement): Sim {
  const rnd = rng(11);
  const rows = [0, 1].map((i) => {
    const fill = q(root, `[data-fill="${i}"]`) as HTMLElement;
    const peak = q(root, `[data-peak="${i}"]`) as HTMLElement;
    return { clip: css(fill, "clipPath"), pos: css(peak, "left"), level: -60, peak: -60, hold: 0 };
  });
  let burst = 0.8;
  let gap = 0;
  let chunk = 0;
  const raise = (row: (typeof rows)[number], db: number) => {
    if (db > row.level) {
      row.level = db;
      row.peak = Math.max(row.peak, db);
      row.hold = 0.9;
    }
  };
  return {
    step(dt) {
      if (gap > 0) {
        gap -= dt;
        if (gap <= 0) burst = 0.5 + rnd() * 1.1;
      } else {
        burst -= dt;
        chunk -= dt;
        if (chunk <= 0) {
          chunk = 0.04 + rnd() * 0.07;
          const db = -17 + rnd() * 13;
          raise(rows[0]!, db);
          raise(rows[1]!, db - rnd() * 3);
        }
        if (burst <= 0) gap = 0.15 + rnd() * 0.5;
      }
      for (const row of rows) {
        row.level = Math.max(-60, row.level - 26 * dt);
        row.hold -= dt;
        if (row.hold <= 0) row.peak = Math.max(row.level, row.peak - 12 * dt);
        const f = fraction(row.level);
        row.clip(`inset(0 ${((1 - f) * 100).toFixed(1)}% 0 0)`);
        const p = fraction(row.peak);
        row.pos(`calc(${(p * 100).toFixed(1)}% - ${(p * 2).toFixed(2)}px)`);
      }
    },
  };
}

function Meters({ live }: { live: boolean }) {
  const ref = useSim(makeMeters, live);
  return (
    <div ref={ref} className={LCD + " flex-col gap-[0.45em] px-[0.6em]"}>
      {[0, 1].map((i) => (
        <div key={i} className="relative h-[0.48em] w-full shadow-[inset_0_0_0_1px_color-mix(in_oklab,currentColor_15%,transparent)]">
          <div data-fill={i} className="absolute inset-px bg-current" style={{ clipPath: "inset(0 100% 0 0)" }} />
          <div data-peak={i} className="absolute -top-[12%] h-[124%] w-[2px] bg-current" />
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Matrix (reasoning) */

const COLS = 11;
const ROWS = 5;
const DOTS = Array.from({ length: COLS * ROWS }, (_, i) => i);

function makeMatrix(root: HTMLElement): Sim {
  const dots = qa(root, "circle");
  const set = dots.map((el) => attr(el, "opacity"));
  const level = dots.map(() => 0);
  let t = 0;
  return {
    step(dt) {
      t += dt;
      const cx = 5 + 3.2 * Math.sin(0.45 * t);
      const cy = 2 + 1.4 * Math.cos(0.6 * t);
      const ease = 1 - Math.exp(-dt / 0.08);
      for (let i = 0; i < dots.length; i++) {
        const x = i % COLS;
        const y = Math.floor(i / COLS);
        const d = Math.hypot(x - cx, 1.3 * (y - cy));
        const value = Math.sin(0.55 * x + 1.3 * t) + Math.sin(0.9 * y - 0.9 * t) + Math.sin(0.35 * x + 0.6 * y + 0.7 * t) + Math.sin(1.1 * d - 2.1 * t);
        const target = clamp((value - 0.9) / 1.2, 0, 1);
        level[i] = level[i]! + (target - level[i]!) * ease;
        const b = level[i]! < 0.03 ? 0 : level[i]!;
        set[i]!((0.08 + 0.92 * b).toFixed(3));
      }
    },
  };
}

function Matrix({ live }: { live: boolean }) {
  const ref = useSim(makeMatrix, live);
  return (
    <div ref={ref} className={LCD + " rounded-surface p-[0.16em]"}>
      <svg viewBox="0 0 55 25" fill="currentColor" className="h-[82%] w-full">
        {DOTS.map((i) => (
          <circle key={i} cx={2.5 + 5 * (i % COLS)} cy={2.5 + 5 * Math.floor(i / COLS)} r="1.55" opacity="0.08" />
        ))}
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------- Chase (running) */

const WELLS = Array.from({ length: 8 }, (_, i) => i);

function makeChase(root: HTMLElement): Sim {
  const set = qa(root, "[data-s]").map((el) => attr(el, "data-s"));
  let t = 0;
  return {
    step(dt) {
      t = (t + dt) % 1.93;
      const head = t < 1.28 ? Math.floor(t / 0.16) : t < 1.68 ? 8 : -1;
      for (let i = 0; i < set.length; i++) set[i]!(i === head && head < 8 ? "head" : i < head ? "on" : "off");
    },
  };
}

function Chase({ live }: { live: boolean }) {
  const ref = useSim(makeChase, live);
  return (
    <div ref={ref} className={LCD + " gap-[0.12em]"}>
      {WELLS.map((i) => (
        <span key={i} className="grid size-[0.56em] place-items-center rounded-pill [box-shadow:var(--field-shade)]">
          <span
            data-s="off"
            className="size-[0.3em] rounded-pill bg-[color-mix(in_oklab,currentColor_12%,transparent)] data-[s=head]:bg-accent data-[s=head]:shadow-[0_0_0.4em_var(--accent)] data-[s=on]:bg-current"
          />
        </span>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- Reels (writing) */

const REEL_Y = 11.5;
const REELS = [15, 41];
const HUB = 3;
const FULL = 8.5;
const pack = (p: number) => Math.sqrt(HUB * HUB + p * (FULL * FULL - HUB * HUB));
const RATE = 1 / 9;

function makeReels(root: HTMLElement): Sim {
  const spin = qa(root, "[data-spin]").map((el) => attr(el, "transform"));
  const packs = qa(root, "[data-pack]").map((el) => attr(el, "r"));
  const setTape = attr(q(root, "[data-tape]"), "d");
  const setLamp = attr(q(root, "[data-rec]"), "opacity");
  let p = 0.08;
  let dir = 1;
  const angle = [0, 0];
  return {
    step(dt) {
      const rate = RATE * (dir > 0 ? 1 : 3.5);
      p = clamp(p + dir * rate * dt, 0, 1);
      if (p >= 1) dir = -1;
      else if (p <= 0) dir = 1;
      const r = [pack(1 - p), pack(p)];
      for (let i = 0; i < 2; i++) {
        angle[i] = (angle[i]! - dir * ((268 * rate) / r[i]!) * dt * (180 / Math.PI)) % 360;
        spin[i]!(`rotate(${(Math.round(angle[i]! * 10) / 10).toFixed(1)} ${REELS[i]} ${REEL_Y})`);
        packs[i]!(r[i]!.toFixed(2));
      }
      setTape(`M${(REELS[0]! + 0.35 * r[0]!).toFixed(2)} ${(REEL_Y + 0.94 * r[0]!).toFixed(2)} L23 23.2 L33 23.2 L${(REELS[1]! - 0.35 * r[1]!).toFixed(2)} ${(REEL_Y + 0.94 * r[1]!).toFixed(2)}`);
      setLamp(dir > 0 ? "1" : "0.15");
    },
  };
}

function Reels({ live }: { live: boolean }) {
  const ref = useSim(makeReels, live);
  return (
    <div ref={ref} className={LCD}>
      <svg viewBox="0 0 56 26" fill="none" className="h-full w-full">
        <path data-tape d="M18 21 L23 23.2 L33 23.2 L38 21" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
        <rect x="26.5" y="22.4" width="3" height="2" fill="currentColor" opacity="0.25" />
        {REELS.map((cx) => (
          <g key={cx} fill="currentColor">
            <circle cx={cx} cy={REEL_Y} r="9.4" opacity="0.03" />
            <circle data-pack cx={cx} cy={REEL_Y} r={FULL} opacity="0.13" />
            <g data-spin transform={`rotate(0 ${cx} ${REEL_Y})`}>
              <circle cx={cx} cy={REEL_Y} r="2.9" opacity="0.2" />
              {[0, 120, 240].map((deg) => (
                <line
                  key={deg}
                  x1={cx}
                  y1={REEL_Y}
                  x2={cx + 2.6 * Math.cos((deg * Math.PI) / 180)}
                  y2={REEL_Y + 2.6 * Math.sin((deg * Math.PI) / 180)}
                  stroke="currentColor"
                  strokeWidth="0.7"
                  opacity="0.55"
                />
              ))}
            </g>
          </g>
        ))}
        <circle data-rec cx="51.8" cy="4.2" r="1.1" className="fill-accent" style={{ filter: "drop-shadow(0 0 1px var(--accent))" }} />
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------- the indicator */

/** What an agent can be doing, each drawn by its own mechanism. */
export type AgentPhase = "thinking" | "searching" | "reading" | "reasoning" | "running" | "writing";

/** The phases, in the order the page shows them, with the word a screen reader hears. */
export const AGENT_PHASES: readonly { phase: AgentPhase; words: string }[] = [
  { phase: "thinking", words: "Thinking" },
  { phase: "searching", words: "Searching" },
  { phase: "reading", words: "Reading" },
  { phase: "reasoning", words: "Reasoning" },
  { phase: "running", words: "Running" },
  { phase: "writing", words: "Writing" },
];

const DRAW: Record<AgentPhase, ComponentType<{ live: boolean }>> = {
  thinking: Segments,
  searching: Tuner,
  reading: Meters,
  reasoning: Matrix,
  running: Chase,
  writing: Reels,
};

/* The window every mechanism sits in: LCD glass, as an Input's field is. */
const LCD =
  "relative flex h-full w-full items-center justify-center overflow-hidden rounded-control bg-field text-field-ink " +
  "shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)]";

export type AgentIndicatorProps = {
  /** What the agent is doing, which picks the mechanism. A change crossfades to the new one. Leave it out and the window is dark and still. */
  phase?: AgentPhase | null;
  /** Holds the frame it is on. Tie it to your stream, so the indicator moves only while tokens arrive. */
  paused?: boolean;
  /** The words a screen reader hears, in place of the phase's own ("Thinking"). */
  label?: string;
  /** Extra classes for the box, such as a font size. The box is 5.6em by 2.6em, so the font size sets its size. */
  className?: string;
};

function Layer({ phase, live, leaving, fresh }: { phase: AgentPhase; live: boolean; leaving: boolean; fresh: boolean }) {
  const Draw = DRAW[phase];
  return (
    <span
      aria-hidden="true"
      data-layer={phase}
      data-leaving={leaving ? "" : undefined}
      className={
        "col-start-1 row-start-1 block h-full min-h-0 w-full min-w-0 transition-[opacity] duration-(--dur-exit-responsive) ease-litt data-[leaving]:opacity-0 " +
        (fresh ? "starting:opacity-0" : "")
      }
    >
      <Draw live={live} />
    </span>
  );
}

/** What an agent is doing, in hardware: one of six mechanisms for the phase, moving only while it is not paused. A Device part: it needs data-material="device" on <html>. */
export function AgentIndicator({ phase, paused = false, label, className = "" }: AgentIndicatorProps) {
  const { reduced } = useMotionDial();
  const box = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);
  const [settled, setSettled] = useState(false);
  const [shown, setShown] = useState(phase);
  const [leaving, setLeaving] = useState<AgentPhase | null>(null);

  /* A new phase is adjusted while rendering, so the first frame after the change already draws it. */
  if (phase !== shown) {
    setLeaving(shown ?? null);
    setShown(phase);
  }
  useEffect(() => {
    setSettled(true);
  }, []);
  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => setLeaving(null), 150);
    return () => clearTimeout(id);
  }, [leaving]);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => entry && setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const live = !!shown && !paused && !reduced && visible;
  const words = label ?? AGENT_PHASES.find((p) => p.phase === shown)?.words;

  return (
    <span
      ref={box}
      role="status"
      data-agent-indicator=""
      data-phase={shown ?? undefined}
      className={"relative inline-grid h-[2.6em] w-[5.6em] shrink-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] align-middle " + className}
    >
      {words && <span className="sr-only">{words}</span>}
      {leaving && <Layer key={leaving} phase={leaving} live={live} leaving fresh={false} />}
      {shown ? (
        <Layer key={shown} phase={shown} live={live} leaving={false} fresh={settled} />
      ) : (
        <span aria-hidden="true" className={"col-start-1 row-start-1 block " + LCD} />
      )}
    </span>
  );
}
