/**
 * WorkingLoader, a Flat part (skills/litt-md/taste/litt-principles.md, Flat; proposals/flat-studies, Agent loaders):
 * how an assistant says it is working, large, with what it is doing in words and how long it has been at it. Four
 * styles, none of them a dot (v1.22):
 *
 * - shimmer: the words themselves, large (`text-figure-lg`), in the muted ink with a band of ink sweeping across.
 * - wave: nine small rounded squares in the ink, swelling one diagonal after another.
 * - spinner: an ink arc stepping round its grey ring, a tenth of a turn at a time.
 * - typing: three short ink pills hopping in a grey bubble, as a reply being written.
 *
 * Under the drawing sits the line, the words in ink and the time in the muted ink with tabular figures ("Searching
 * your posts 2s"); the shimmer's words are the drawing, so its line is the time alone.
 *
 * - Motion: one requestAnimationFrame loop per loader writes transform and opacity on the elements it already has
 *   (React never re-renders for a frame). It runs only while `paused` is false, the loader is on screen and the tab is
 *   visible, which an app ties to its stream; paused, it holds the frame it is on. It starts 0.6s in, so a paused
 *   loader holds a frame that looks mid-work. It is a status, so it never runs on its own: it runs while you say the
 *   work does (R4). Under reduced motion it never runs: the shimmer's words stand in the muted ink, and the squares,
 *   pills and arc stand still.
 * - A new style arrives on the expressive spring (Flat's 0.28), rising in from 8px below at 92%; the old one is gone
 *   at once, so one thing moves at a time.
 * - The clock: `seconds` shows a time you keep; leave it out and the loader counts whole seconds from when it mounted,
 *   while it is not paused.
 * - Semantics: role="status" named by the words ("Searching your posts"); the drawing and the ticking time are
 *   aria-hidden, so nothing is announced each second.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type LoaderStyle = "shimmer" | "wave" | "spinner" | "typing";

export type WorkingLoaderProps = {
  /** How it says it is working: the words shimmering, a wave of squares, a stepping arc or typing pills. Default "shimmer". */
  variant?: LoaderStyle;
  /** What the assistant is doing, in words ("Searching your posts"). It names the status for a screen reader too. */
  label?: string;
  /** Holds the frame it is on. Tie it to your stream, so it moves only while the work does. */
  paused?: boolean;
  /** The time to show, in whole seconds. Leave it out and the loader counts from when it mounted, while it is not paused. */
  seconds?: number;
  className?: string;
};

/* The loops, in seconds: how long each style takes to come round. */
const SHIMMER_LOOP = 1.8;
const WAVE_LOOP = 1.2;
const WAVE_STEP = 0.11;
const SPIN_STEPS = 10;
const SPIN_TURN = 0.8;
const TYPE_LOOP = 1.1;
const TYPE_STEP = 0.14;
/** Where a loader's time starts, so a paused one holds a frame that looks mid-work. */
const PREROLL = 0.6;

/** 0 to 1 and back: a smooth swell for the wave and the typing pills. */
const swell = (p: number) => 0.5 - 0.5 * Math.cos(p * Math.PI * 2);

type Frame = (t: number) => void;

/** Draws one style's frame at time `t`, writing only transform and opacity. */
function frameOf(variant: LoaderStyle, root: HTMLElement): Frame {
  const parts = Array.from(root.querySelectorAll<HTMLElement | SVGElement>("[data-beat]"));
  if (variant === "shimmer") {
    const [band, ink] = parts;
    return (t) => {
      const p = (t % SHIMMER_LOOP) / SHIMMER_LOOP; // the band crosses from before the words to past them
      const w = root.querySelector<HTMLElement>("[data-words]")?.offsetWidth ?? 0;
      const x = -0.4 * w + p * 1.4 * w;
      band.style.transform = `translateX(${x.toFixed(1)}px)`;
      ink.style.transform = `translateX(${(-x).toFixed(1)}px)`;
    };
  }
  if (variant === "wave") {
    return (t) =>
      parts.forEach((el, i) => {
        const diagonal = Math.floor(i / 3) + (i % 3);
        const p = swell((((t - diagonal * WAVE_STEP) % WAVE_LOOP) + WAVE_LOOP) % WAVE_LOOP / WAVE_LOOP);
        el.style.transform = `scale(${(0.78 + 0.22 * p).toFixed(3)})`;
        el.style.opacity = (0.16 + 0.84 * p).toFixed(3);
      });
  }
  if (variant === "spinner") {
    const [arc] = parts;
    return (t) => {
      const step = Math.floor(((t % SPIN_TURN) / SPIN_TURN) * SPIN_STEPS);
      arc.setAttribute("transform", `rotate(${step * (360 / SPIN_STEPS)} 20 20)`);
    };
  }
  return (t) =>
    parts.forEach((el, i) => {
      const p = ((((t - i * TYPE_STEP) % TYPE_LOOP) + TYPE_LOOP) % TYPE_LOOP) / TYPE_LOOP;
      const hop = p < 0.4 ? swell(p / 0.8) : 0; // up and back in the first part of the loop, then rest
      el.style.transform = `translateY(${(-6 * hop).toFixed(2)}px)`;
      el.style.opacity = (0.4 + 0.6 * hop).toFixed(3);
    });
}

/** The drawing for each style. Every moving piece carries data-beat, in the order frameOf reads them. */
function Art({ variant, label }: { variant: LoaderStyle; label: string }): ReactNode {
  if (variant === "shimmer") {
    return (
      <span data-words className="relative inline-block text-figure-lg whitespace-nowrap text-fg-muted">
        {label}
        <span
          data-beat
          className="absolute inset-y-0 left-0 w-2/5 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black,transparent)] motion-reduce:hidden"
        >
          <span data-beat className="block text-fg">
            {label}
          </span>
        </span>
      </span>
    );
  }
  if (variant === "wave") {
    return (
      <span className="inline-grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} data-beat className="block size-4 rounded-[calc(var(--radius-surface)-12px)] bg-fg opacity-60 forced-colors:bg-[CanvasText]" />
        ))}
      </span>
    );
  }
  if (variant === "spinner") {
    return (
      <svg viewBox="0 0 40 40" className="size-11" fill="none" strokeWidth={5}>
        <circle cx={20} cy={20} r={15} className="stroke-surface-3 forced-colors:stroke-[GrayText]" />
        <circle
          data-beat
          cx={20}
          cy={20}
          r={15}
          strokeDasharray="23.6 70.7"
          strokeLinecap="round"
          className="stroke-fg forced-colors:stroke-[CanvasText]"
        />
      </svg>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-block px-5 py-4 forced-colors:border">
      {[0, 1, 2].map((i) => (
        <i key={i} data-beat className="block h-4.5 w-2.25 rounded-pill bg-fg opacity-60 forced-colors:bg-[CanvasText]" />
      ))}
    </span>
  );
}

/** How an assistant says it is working: shimmering words, a wave, a stepping arc or typing pills, with what it is doing and for how long. A Flat part. */
export function WorkingLoader({ variant = "shimmer", label = "Thinking", paused = false, seconds, className = "" }: WorkingLoaderProps) {
  const { reduced } = useMotionDial();
  const arrive = useTransition("expressive");
  const art = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const [counted, setCounted] = useState(0);
  const [visible, setVisible] = useState(true);
  const running = !paused && !reduced && visible;

  useEffect(() => {
    first.current = false;
  }, []);

  /* Off screen or in a hidden tab, it stops. */
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let onScreen = true;
    const update = () => setVisible(onScreen && document.visibilityState !== "hidden");
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  /* The frame loop: draws the preroll frame at once, then runs only while it should. Time survives a pause. */
  const clock = useRef(PREROLL);
  useEffect(() => {
    const el = art.current;
    if (!el) return;
    const draw = frameOf(variant, el);
    if (!reduced) draw(clock.current);
    if (!running) return;
    let last = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      clock.current += Math.min(0.1, (now - last) / 1000);
      last = now;
      draw(clock.current);
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [variant, running, reduced]);

  /* Whole seconds, counted while it is not paused, when the time is not given. */
  useEffect(() => {
    if (seconds !== undefined || paused) return;
    const id = window.setInterval(() => setCounted((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [seconds, paused]);

  const time = `${seconds ?? counted}s`;

  return (
    <div ref={root} role="status" aria-label={label} className={"grid min-w-0 justify-items-center gap-3.5 text-center " + className}>
      <motion.span
        key={variant}
        ref={art}
        aria-hidden="true"
        initial={first.current || reduced ? false : { opacity: 0, y: 8, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={arrive}
        className="grid min-h-14 max-w-full place-items-center"
      >
        <Art variant={variant} label={label} />
      </motion.span>
      <span aria-hidden="true" className="text-body font-label text-fg">
        {variant !== "shimmer" && <span>{label}</span>}
        <span className={"font-normal tabular-nums text-fg-muted " + (variant === "shimmer" ? "" : "ml-1.5")}>{time}</span>
      </span>
    </div>
  );
}
