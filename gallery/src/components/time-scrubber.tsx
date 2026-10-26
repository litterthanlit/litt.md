/**
 * Time scrubber: a point in a run's time, set by dragging a ruler under a fixed needle, such as a moment in a deploy to
 * replay its log up to there (components.md, "Time scrubber"). The ruler moves; the needle stays in the middle.
 *
 * - Anatomy: the Slider's label row (the label at the small size in --fg, the reading at its end in tabular figures, with the
 *   label of the event under the needle before it, in --fg-subtle), then a 56px track: the Segmented control's well
 *   (fg 5%, the inset --line, the surface radius). On it a ruler: a minor tick every step (8px, --line-strong), a major
 *   tick every `majorEvery` steps (14px, --fg-disabled) with its time under it at the caption size, tabular, and
 *   the events as 2px marks, 20px tall, in their status color (neutral is --fg-muted). The ticks are lighter than any
 *   mark in light mode and dimmer in dark, so a mark stands out by lightness, height and width, not by hue alone (in
 *   light mode the status colors are as dark as --fg-subtle, so --fg-subtle ticks would hide them). The needle is
 *   a 2px --fg line in the middle, over the ticks and pins and ending above the times so it never cuts one, and never
 *   the accent (R6). Steps sit 12px apart.
 * - Drag: the ruler follows the pointer one to one, as the Slider's thumb does. Let go and it settles on the nearest
 *   step, or on an event within half a step of the needle, on the responsive tier and from rest, so it never passes
 *   either end. A press without a drag goes to the time under the pointer.
 * - Keys and assistive tech: the track is the slider (role slider, named by the label), so the reading, the event and
 *   the bounds are read out. ← and → move a step, with Shift ten; Page Up and Page Down go to the next and previous
 *   event (ten steps when there are none); Home and End go to the ends. The value is the time, aria-valuetext says it
 *   in words with the event's label.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): the ruler can be thrown. Let go and it keeps the
 *   speed it had, coasts as far as that speed carries it, and lands on the event nearest there (within three steps),
 *   else on the nearest step, on fun mode's throw spring. Let go without a throw, it settles as it does without fun
 *   mode. Past either end it gives like a rubber band. It rests
 *   exactly where it does without fun mode. Reduced motion turns it off.
 * - Motion: the ruler moves by transform only. Under reduced motion it jumps to where it settles.
 * - Touch: the track owns sideways drags (data-no-drag, touch-action pan-y), so the page still scrolls up and down.
 * - Disabled: the well at fg 3%, the needle --fg-disabled, no pointer and no tab stop.
 * - Long runs: the minor ticks are one repeating background, and only the major ticks near the needle are drawn.
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, type AnimationPlaybackControls } from "motion/react";
import { useFun, useTransition } from "@/motion";

export type TimeScrubberTone = "neutral" | "success" | "warning" | "danger";

export type TimeScrubberMark = {
  /** When it happened, in the scrubber's units (the same as min, max and value). */
  at: number;
  /** What happened, short: "Build completed". Shown beside the reading when the needle is on it, and read out. */
  label: string;
  /** The status color of its mark. Neutral is --fg-muted. Color is never alone: the label says the rest. */
  tone?: TimeScrubberTone;
};

export type TimeScrubberProps = {
  /** The label above the ruler. Required: it names the slider. */
  label: ReactNode;
  /** The time under the needle, when you control it. Pair it with onValueChange. */
  value?: number;
  /** The time it starts at when you do not control it. Without one, it starts at min. */
  defaultValue?: number;
  /** Called with the new time as it moves, on the step grid or on an event. */
  onValueChange?: (value: number) => void;
  /** Called once it has settled after a drag, a press or a key. Use it to load what happened at that time. */
  onValueCommit?: (value: number) => void;
  /** The start of the run. */
  min?: number;
  /** The end of the run. Required. */
  max: number;
  /** The gap between ticks, in the same units. Keys move one step, and a drag settles on the grid. */
  step?: number;
  /** A labelled major tick every this many steps. */
  majorEvery?: number;
  /** What happened along the run. The needle settles on one it is let go near, and Page Up and Page Down go between them. */
  marks?: TimeScrubberMark[];
  /** Turns a time into words, such as 12.4 into "+12.4s". It feeds the reading, the tick labels and aria-valuetext. */
  formatValue?: (value: number) => string;
  /** Mutes it, skips it in the tab order and ignores the pointer. */
  disabled?: boolean;
  /** Extra classes for the wrapper, such as a width. */
  className?: string;
};

/** Px between two minor ticks. The ruler's tick background repeats every 12px too: change them together. */
const STEP_PX = 12;
/** Px of travel before a press is a drag. */
const SLOP = 4;
/** The release speed is read over this many ms of movement. */
const WINDOW_MS = 100;
/** Fun mode: a throw lands on an event within this many steps of where it would coast to. */
const PULL_STEPS = 3;

const TONE: Record<TimeScrubberTone, string> = {
  neutral: "bg-fg-muted",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** Digits after the point, so 0.1 steps land on 0.3 and not 0.30000000000000004. */
const places = (n: number) => (String(n).split(".")[1] ?? "").length;

/** A ruler of time under a fixed needle: drag it, press it, or use the keys. Events sit on it as marks in their status color. */
export function TimeScrubber({
  label,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max,
  step = 1,
  majorEvery = 5,
  marks = [],
  formatValue = String,
  disabled = false,
  className = "",
}: TimeScrubberProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const responsive = useTransition("responsive");
  const fun = useFun();
  const settle = fun ? fun.throw : responsive;

  const perUnit = STEP_PX / step;
  const digits = Math.max(places(step), places(min));
  const clamp = (t: number) => Math.min(max, Math.max(min, t));
  const onGrid = (t: number) => clamp(Number((Math.round((t - min) / step) * step + min).toFixed(digits)));
  const sorted = useMemo(() => [...marks].sort((a, b) => a.at - b.at), [marks]);

  /** Where a time comes to rest: the event nearest it within `pull` px, else the nearest step. */
  const restFor = (t: number, pull: number) => {
    let best: TimeScrubberMark | null = null;
    for (const m of sorted) if (Math.abs(m.at - t) * perUnit <= pull && (!best || Math.abs(m.at - t) < Math.abs(best.at - t))) best = m;
    return best ? clamp(best.at) : onGrid(t);
  };

  const [inner, setInner] = useState(() => clamp(defaultValue ?? min));
  const value = clamp(valueProp ?? inner);
  const mark = sorted.find((m) => m.at === value);
  const reading = formatValue(value);

  /* The ruler's offset: the needle sits at the track's middle, so time t is under it when x is -(t - min) per unit. */
  const toX = (t: number) => -(t - min) * perUnit;
  const toT = (x: number) => min - x / perUnit;
  const x = useMotionValue(toX(value));
  const run = useRef<AnimationPlaybackControls | null>(null);
  const said = useRef(value); // the last value told to onValueChange, so a drag reports each step once

  const report = (t: number) => {
    if (t === said.current) return;
    said.current = t;
    if (valueProp === undefined) setInner(t);
    onValueChange?.(t);
  };

  /** Settle on `t`, from wherever the ruler is, carrying `velocity` (px/s), then commit it. */
  const settleTo = (t: number, velocity = 0) => {
    run.current?.stop();
    report(t);
    const controls = animate(x, toX(t), { ...settle, velocity });
    run.current = controls;
    void controls.then(() => {
      if (run.current !== controls) return;
      run.current = null;
      onValueCommit?.(t);
    });
  };

  /* A value from outside (a controlled change we did not make) moves the ruler there. */
  useEffect(() => {
    if (value === said.current) return;
    said.current = value;
    run.current?.stop();
    run.current = animate(x, toX(value), settle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- follows the value only
  }, [value]);

  useEffect(() => () => run.current?.stop(), []);

  /* The track's width, for the major ticks near the needle and for a press. */
  const track = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const read = () => setWidth(el.clientWidth);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Only the major ticks within a track's width either side of the needle are drawn. The window moves in whole majors,
     so the ticks re-render only when one comes into reach, not on every frame. */
  const majorSpan = step * majorEvery;
  const reach = Math.ceil(width / (STEP_PX * majorEvery)) + 1;
  const windowAt = (t: number) => Math.round((t - min) / majorSpan);
  const [centre, setCentre] = useState(() => windowAt(value));
  useMotionValueEvent(x, "change", (v) => {
    const c = windowAt(toT(v));
    if (c !== centre) setCentre(c);
  });
  const majors: number[] = [];
  const last = Math.floor((max - min) / majorSpan + 1e-9);
  for (let k = Math.max(0, centre - reach); k <= Math.min(last, centre + reach); k++) majors.push(Number((min + k * majorSpan).toFixed(digits)));

  /* ------------------------------------------------------------------ the pointer */

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    const el = e.currentTarget;
    const pointer = e.pointerId;
    const x0 = e.clientX;
    run.current?.stop(); // caught mid-settle: it is in the hand again, where it is
    run.current = null;
    const from = x.get();
    const lo = toX(max);
    const hi = toX(min);
    let dragging = false;
    let trail: { t: number; x: number }[] = [];

    const move = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== pointer) return;
      const dx = ev.clientX - x0;
      if (!dragging) {
        if (Math.abs(dx) < SLOP) return;
        dragging = true;
        try {
          el.setPointerCapture(pointer);
        } catch {
          /* the pointer is already gone */
        }
      }
      const want = from + dx;
      const kept = Math.min(hi, Math.max(lo, want));
      x.set(fun && want !== kept ? kept + fun.rubber(want - kept) : kept);
      report(onGrid(toT(kept)));
      trail.push({ t: ev.timeStamp, x: kept });
      trail = trail.filter((p) => ev.timeStamp - p.t <= WINDOW_MS);
    };
    const up = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== pointer) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!dragging) {
        /* A press: the time under the pointer, settled as a release there would be. */
        if (ev.type === "pointercancel") return settleTo(onGrid(toT(from)));
        const box = el.getBoundingClientRect();
        return settleTo(restFor(toT(from) + (ev.clientX - (box.left + box.width / 2)) / perUnit, STEP_PX / 2));
      }
      const first = trail[0];
      const end = trail[trail.length - 1];
      const fresh = end && ev.timeStamp - end.t <= WINDOW_MS;
      const velocity = fresh && first && end.t > first.t ? ((end.x - first.x) / (end.t - first.t)) * 1000 : 0;
      const at = toT(Math.min(hi, Math.max(lo, x.get())));
      /* Fun mode: where the speed would carry it, and an event near there. Without it, or let go without a throw:
         where it was let go, and an event within half a step. */
      const carry = fun ? fun.coast(velocity) : 0;
      const thrown = Math.abs(carry) > STEP_PX;
      const target = restFor(toT(toX(at) + carry), thrown ? STEP_PX * PULL_STEPS : STEP_PX / 2);
      settleTo(target, fun ? velocity : 0); // without fun mode it settles from rest, so it never passes an end
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  /* ------------------------------------------------------------------ the keys */

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const steps = e.shiftKey ? 10 : 1;
    const next = sorted.find((m) => m.at > value);
    const prev = [...sorted].reverse().find((m) => m.at < value);
    let to: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") to = onGrid(value + steps * step);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = onGrid(value - steps * step);
    else if (e.key === "PageUp") to = sorted.length ? (next?.at ?? max) : onGrid(value + 10 * step);
    else if (e.key === "PageDown") to = sorted.length ? (prev?.at ?? min) : onGrid(value - 10 * step);
    else if (e.key === "Home") to = min;
    else if (e.key === "End") to = max;
    if (to === null) return;
    e.preventDefault();
    if (to !== value) settleTo(clamp(to));
  };

  const span = (max - min) * perUnit;
  const valueText = mark ? `${reading}, ${mark.label}` : reading;

  return (
    <div className={"grid gap-2 " + className}>
      <div className="flex items-baseline justify-between gap-4">
        <span id={labelId} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
          {label}
        </span>
        <span aria-hidden="true" className="flex min-w-0 items-baseline gap-2 text-small">
          {mark && <span className="truncate text-fg-subtle">{mark.label}</span>}
          <span className={"shrink-0 tabular-nums " + (disabled ? "text-fg-subtle" : "text-fg-muted")}>{reading}</span>
        </span>
      </div>
      <div
        ref={track}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        aria-disabled={disabled || undefined}
        data-no-drag=""
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        className={
          "relative h-control-lg touch-pan-y overflow-hidden rounded-surface select-none forced-colors:border " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
          (disabled
            ? "cursor-not-allowed bg-[color-mix(in_oklab,var(--fg)_3%,transparent)] shadow-[inset_0_0_0_1px_var(--line)]"
            : "cursor-grab bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] shadow-[inset_0_0_0_1px_var(--line)] active:cursor-grabbing")
        }
      >
        {/* The ruler: its start (min) sits under the needle when x is 0, and it slides left as time goes on. */}
        <motion.div aria-hidden="true" className="absolute inset-y-0 left-1/2" style={{ x }}>
          <div
            className="absolute top-2 left-0 h-2 bg-[repeating-linear-gradient(to_right,var(--line-strong)_0_1px,transparent_1px_12px)]"
            style={{ width: span + 1 }}
          />
          {majors.map((t) => (
            <div key={t} className="absolute top-2 flex -translate-x-1/2 flex-col items-center gap-1.5" style={{ left: (t - min) * perUnit }}>
              <span className="h-3.5 w-px bg-fg-disabled" />
              <span className="text-caption font-normal whitespace-nowrap text-fg-subtle tabular-nums">{formatValue(t)}</span>
            </div>
          ))}
          {sorted.map((m) => (
            <span
              key={`${m.at}-${m.label}`}
              className={"absolute top-2 h-5 w-0.5 -translate-x-1/2 rounded-pill forced-colors:bg-[CanvasText] " + TONE[m.tone ?? "neutral"]}
              style={{ left: (m.at - min) * perUnit }}
            />
          ))}
        </motion.div>
        <span
          aria-hidden="true"
          className={
            "pointer-events-none absolute top-1 left-1/2 h-6.5 w-0.5 -translate-x-1/2 rounded-pill forced-colors:bg-[Highlight] " +
            (disabled ? "bg-fg-disabled" : "bg-fg")
          }
        />
      </div>
      <span id={hintId} className="sr-only">
        {sorted.length ? "Arrow keys move a step. Page Up and Page Down go to the next and previous event." : "Arrow keys move a step."}
      </span>
    </div>
  );
}
