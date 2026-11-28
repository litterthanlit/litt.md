/**
 * Fader, a Flat part (the Flat studies, Fader): a mixer channel's level as a fat vertical pill. The ink fill is the
 * level (at the bottom stop it is a circle), the level in decibels stands above it as a figure, and the channel's name
 * sits under it, with a word for who has it when a host runs automation ("Auto" or "Yours").
 *
 * - The value is the fader's travel, 0 to 100, on a mixing desk's taper: 75 is 0 dB (marked "0" beside the pill), the
 *   top is +10 dB, and the bottom is −∞. The figure shows tenths near 0 dB and whole decibels further out ("−3.5",
 *   "+10", "−∞"), with tabular figures.
 * - The hand: press on the fill's handle and drag, and the level follows one to one; press beside it and the fill comes
 *   to the hand. Shift drags at a quarter speed. Dragging past 0 dB catches the hand within 1.2% of the travel and lets
 *   go 3.5% clear of it. A double press sends it to 0 dB. A held fader lets go of anything driving it from outside.
 * - Motion: a value the hand sets lands at once; a value set from outside (automation, a reset) is carried there on
 *   the responsive spring, a motor. Under reduced motion every value lands at once.
 * - Keys: it is a slider (vertical). ↑ and → add half a step of travel, ↓ and ← take it away, Page Up and Page Down a
 *   tenth of the travel, Home and End go to the ends.
 * - `onHoldChange` says when a hand takes it and lets go, so a host can hand a channel back to its automation.
 * - Semantics: role="slider", aria-orientation vertical, named by the channel, its value said in decibels
 *   ("−3.5 dB"). The figure and the words beside it are hidden from a screen reader.
 */
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useMotionDial, useTransition } from "@/motion";

export type FaderProps = {
  /** The channel's name, shown under it and naming the slider. */
  label: string;
  /** The travel, 0 to 100, when you control it. 75 is 0 dB. Pair it with onValueChange. */
  value?: number;
  /** Where it starts when you leave it alone. Default 75, 0 dB. */
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Says when a hand takes the fader (true) and lets it go (false). */
  onHoldChange?: (held: boolean) => void;
  /** Who has the channel, said under its name: "auto" for automation, "yours" for the hand. */
  owner?: "auto" | "yours";
  /** md stands alone (240px tall); sm fits a card (116px). */
  size?: "md" | "sm";
  className?: string;
};

export const FADER_UNITY = 75;
const MIN = 0;
const MAX = 100;
const STEP = 0.5;
const FINE = 0.25;
const CATCH = 0.012;
const RELEASE = 0.035;
const DOUBLE = 320;

/* The taper: travel (0–1) to decibels, as a mixing desk's fader reads. */
const TAPER = [
  [0.12, -40],
  [0.22, -30],
  [0.35, -20],
  [0.5, -10],
  [0.625, -5],
  [0.75, 0],
  [0.875, 5],
  [1, 10],
];
export function faderGain(travel: number): number {
  const [f0, db0] = TAPER[0];
  if (travel <= f0) return travel <= 0 ? -Infinity : db0 + 20 * Math.log10(travel / f0);
  for (let i = 1; i < TAPER.length; i++) {
    const [fa, a] = TAPER[i - 1];
    const [fb, b] = TAPER[i];
    if (travel <= fb) return a + ((travel - fa) / (fb - fa)) * (b - a);
  }
  return 10;
}
/** "−3.5", "0.0", "+10", "−∞": tenths near 0 dB, whole decibels further out. */
export function faderFigure(value: number): string {
  const db = faderGain((value - MIN) / (MAX - MIN));
  if (db < -99) return "−∞";
  const r = Math.abs(db) < 9.95 ? Math.round(db * 10) / 10 : Math.round(db);
  const f = Math.abs(r) < 10 ? Math.abs(r).toFixed(1) : String(Math.abs(r));
  return (r > 0 ? "+" : r < 0 ? "−" : "") + f;
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const snap = (v: number) => clamp(Math.round(clamp(v, MIN, MAX) / STEP) * STEP, MIN, MAX);

const SIZES = {
  md: { w: 64, h: 240, track: "h-60 w-16", figure: "text-h2" },
  sm: { w: 46, h: 116, track: "h-29 w-11.5", figure: "text-body" },
} as const;

/** A mixer channel's level as a fat vertical pill, with its level in decibels above it. A Flat part. */
export function Fader({ label, value, defaultValue = FADER_UNITY, onValueChange, onHoldChange, owner, size = "md", className = "" }: FaderProps) {
  const { reduced } = useMotionDial();
  const motor = useTransition("responsive");
  const [own, setOwn] = useState(defaultValue);
  const at = snap(value ?? own);
  const s = SIZES[size];

  /* The drawn level, 0–1 of the travel: the hand writes it at once, an outside value is carried by the motor. */
  const shown = useMotionValue((at - MIN) / (MAX - MIN));
  /* The fill is a whole-height pill slid down by what is not level; the track clips it, so only a transform moves. */
  const fill = useTransform(shown, (f) => (1 - f) * (s.h - s.w));
  const [figure, setFigure] = useState(faderFigure(at));
  useEffect(() => shown.on("change", (f) => setFigure(faderFigure(snap(MIN + f * (MAX - MIN))))), [shown]);

  const held = useRef(false);
  const fromHand = useRef(false);
  useEffect(() => {
    const to = (at - MIN) / (MAX - MIN);
    if (fromHand.current || reduced) {
      fromHand.current = false;
      shown.stop();
      shown.set(to);
      return;
    }
    if (held.current) return; // a held fader lets go of what drives it from outside
    const run = animate(shown, to, motor);
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, reduced]);

  const set = (v: number, hand: boolean) => {
    const next = snap(v);
    if (next === at) return;
    fromHand.current = hand;
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const range = MAX - MIN;
    const delta = ({ ArrowUp: STEP, ArrowRight: STEP, ArrowDown: -STEP, ArrowLeft: -STEP, PageUp: range / 10, PageDown: -range / 10 } as Record<string, number>)[e.key];
    const next = delta !== undefined ? at + delta : e.key === "Home" ? MIN : e.key === "End" ? MAX : null;
    if (next === null) return;
    e.preventDefault();
    set(next, false);
  };

  const drag = useRef<{ id: number; y: number; from: number; raw: number; travel: number; fine: boolean; caught: boolean } | null>(null);
  const last = useRef({ at: -Infinity, y: 0 });
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || drag.current) return;
    e.preventDefault();
    const el = e.currentTarget;
    el.focus({ preventScroll: true });
    el.setPointerCapture(e.pointerId);
    held.current = true;
    onHoldChange?.(true);
    const dbl = e.timeStamp - last.current.at < DOUBLE && Math.abs(e.clientY - last.current.y) < 24;
    last.current = { at: dbl ? -Infinity : e.timeStamp, y: e.clientY };
    const box = el.getBoundingClientRect();
    const knob = box.width;
    const travel = box.height - knob;
    if (dbl) {
      held.current = false;
      set(FADER_UNITY, false);
      held.current = true;
      drag.current = { id: e.pointerId, y: e.clientY, from: FADER_UNITY, raw: FADER_UNITY, travel, fine: e.shiftKey, caught: true };
      return;
    }
    const capTop = box.bottom - knob - shown.get() * travel;
    let from: number;
    if (e.clientY >= capTop - 6 && e.clientY <= capTop + knob + 6) {
      shown.stop(); // on the handle: the hand stops the motor where it is
      from = MIN + shown.get() * (MAX - MIN);
    } else {
      from = snap(MIN + clamp((box.bottom - knob / 2 - e.clientY) / travel, 0, 1) * (MAX - MIN));
      held.current = false;
      set(from, false); // beside it: the motor brings it to the hand
      held.current = true;
    }
    drag.current = { id: e.pointerId, y: e.clientY, from, raw: from, travel, fine: e.shiftKey, caught: from === FADER_UNITY };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const range = MAX - MIN;
    if (e.shiftKey !== d.fine) {
      d.from = d.raw;
      d.y = e.clientY;
      d.fine = e.shiftKey;
    }
    let raw = d.from - ((e.clientY - d.y) / d.travel) * range * (d.fine ? FINE : 1);
    if (raw > MAX || raw < MIN) {
      raw = clamp(raw, MIN, MAX);
      d.from = raw;
      d.y = e.clientY;
    }
    const off = raw - FADER_UNITY;
    let next: number;
    if (d.caught && Math.abs(off) <= RELEASE * range) next = FADER_UNITY;
    else if (!d.caught && Math.abs(off) <= CATCH * range) {
      d.caught = true;
      next = FADER_UNITY;
    } else {
      d.caught = false;
      next = snap(raw);
    }
    d.raw = raw;
    set(next, true);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    held.current = false;
    const to = (at - MIN) / (MAX - MIN);
    if (Math.abs(shown.get() - to) > 0.005) animate(shown, to, motor);
    onHoldChange?.(false);
  };

  const unityAt = `calc(${s.w / 2}px + 0.75 * (100% - ${s.w}px))`;
  return (
    <div className={"flex flex-col items-center gap-2.5 select-none " + className}>
      <span aria-hidden="true" className={"font-label whitespace-nowrap text-fg tabular-nums " + s.figure}>
        {figure}
        <small className="ms-0.5 text-caption font-label text-fg-muted">dB</small>
      </span>
      <div
        role="slider"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label={label}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={at}
        aria-valuetext={`${faderFigure(at)} dB`}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={"relative cursor-ns-resize touch-none rounded-pill focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus " + s.track}
      >
        <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-pill bg-block forced-colors:border">
          <motion.span style={{ y: fill }} className="absolute inset-0 rounded-pill bg-fg forced-colors:bg-[CanvasText]">
            <span className="absolute inset-x-[32%] h-0.75 rounded-pill bg-canvas opacity-85" style={{ top: `calc(${s.w / 2}px - 1.5px)` }} />
          </motion.span>
        </span>
        <span aria-hidden="true" className="absolute left-[calc(100%+6px)] translate-y-1/2 text-caption font-label leading-none text-fg-muted" style={{ bottom: unityAt }}>
          0
        </span>
      </div>
      <span aria-hidden="true" className="text-small font-label leading-tight text-fg">
        {label}
      </span>
      {owner !== undefined && (
        <span aria-hidden="true" className={"-mt-1.5 min-h-3 text-caption leading-none " + (owner === "yours" ? "font-label text-fg" : "text-fg-muted")}>
          {owner === "yours" ? "Yours" : "Auto"}
        </span>
      )}
    </div>
  );
}
