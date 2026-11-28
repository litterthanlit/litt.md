/**
 * Knob, a Flat part (the Flat studies, Knob): a detented control as a pill slider, for a value a preset recalls. Its
 * name and the value as a figure sit over a grey pill track (`bg-block`) with an ink fill and a paper thumb.
 *
 * - Detents: the value moves in whole steps (`detents` of them across the range), on a linear or a log taper (a
 *   frequency reads on a log one). A bipolar knob (a gain that cuts and boosts) fills out from the centre.
 * - The hand: press or drag anywhere on the track and the thumb lands on the nearest detent at once; the arrow keys move
 *   a detent, Page Up and Page Down a tenth of them, Home and End go to the ends.
 * - Motion: a value set from outside (a preset recalled) glides there on the responsive spring, the thumb by a transform
 *   and the fill by a clip, and `onSettle` says when it lands. A press shrinks the thumb a little. Under reduced motion
 *   every value lands at once.
 * - Semantics: role="slider" named by its label, its value said in its own words ("4.2 kHz"). The figure is hidden.
 */
import { animate, motion, useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useMotionDial, useTransition } from "@/motion";

export type KnobProps = {
  label: string;
  /** The value, when you control it. Pair it with onValueChange. It snaps to the nearest detent. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Says a value set from outside has glided into place. */
  onSettle?: () => void;
  min: number;
  max: number;
  /** How many steps the range has. */
  detents: number;
  /** "log" spaces the detents evenly by ratio (a frequency); default "linear". */
  taper?: "linear" | "log";
  /** Fills out from the centre: for a value that cuts and boosts. */
  bipolar?: boolean;
  /** The value in words, shown and said. Default the rounded number. */
  format?: (value: number) => string;
  className?: string;
};

export function knobIndex(v: number, { min, max, detents, taper }: Pick<KnobProps, "min" | "max" | "detents" | "taper">) {
  const f = taper === "log" ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min);
  return Math.round(Math.min(1, Math.max(0, f)) * detents);
}
export function knobValue(i: number, { min, max, detents, taper }: Pick<KnobProps, "min" | "max" | "detents" | "taper">) {
  const v = taper === "log" ? min * Math.pow(max / min, i / detents) : min + ((max - min) * i) / detents;
  return Math.round(v * 100) / 100;
}

/** Track height (px): the thumb's circle is the track less 4px a side. */
const H = 28;
const INSET = 4;

/** A detented control as a pill slider; a value from outside glides into place. A Flat part. */
export function Knob({ label, value, defaultValue, onValueChange, onSettle, min, max, detents, taper = "linear", bipolar = false, format = (v) => String(Math.round(v)), className = "" }: KnobProps) {
  const { reduced } = useMotionDial();
  const glide = useTransition("responsive");
  const p = { min, max, detents, taper };
  const [own, setOwn] = useState(defaultValue ?? min);
  const index = knobIndex(value ?? own, p);
  const at = knobValue(index, p);

  /* The drawn position in detents: the hand writes it at once, an outside value glides. */
  const shown = useMotionValue(index);
  const [figure, setFigure] = useState(format(at));
  useMotionValueEvent(shown, "change", (d) => setFigure(format(knobValue(Math.min(detents, Math.max(0, Math.round(d))), p))));
  const track = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  /* The thumb's place and the fill's clip, from the drawn position and the track's width; redrawn when either moves. */
  const x = useMotionValue(0);
  const clip = useMotionValue("inset(0 100% 0 0 round 999px)");
  const paint = (d: number) => {
    const room = Math.max(0, width - H);
    const f = Math.min(1, Math.max(0, d / detents));
    const lo = bipolar ? Math.min(f, 0.5) : 0;
    const hi = bipolar ? Math.max(f, 0.5) : f;
    x.set(f * room);
    clip.set(`inset(0 ${Math.max(0, width - (hi * room + H)).toFixed(2)}px 0 ${(lo * room).toFixed(2)}px round 999px)`);
  };
  useMotionValueEvent(shown, "change", paint);
  useEffect(() => paint(shown.get()));

  const fromHand = useRef(false);
  const settleRef = useRef(onSettle);
  settleRef.current = onSettle;
  useEffect(() => {
    if (fromHand.current || reduced) {
      fromHand.current = false;
      shown.stop();
      shown.set(index);
      if (reduced) settleRef.current?.();
      return;
    }
    const run = animate(shown, index, { ...glide, onComplete: () => settleRef.current?.() });
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, reduced]);

  const turn = (i: number) => {
    const next = Math.min(detents, Math.max(0, i));
    if (next === index) return;
    fromHand.current = true;
    const v = knobValue(next, p);
    if (value === undefined) setOwn(v);
    onValueChange?.(v);
  };
  const fromX = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return Math.round(((clientX - r.left - H / 2) / Math.max(1, r.width - H)) * detents);
  };
  const drag = useRef<number | null>(null);
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = e.pointerId;
    turn(fromX(e.clientX));
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => drag.current === e.pointerId && turn(fromX(e.clientX));
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current === e.pointerId) drag.current = null;
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const page = Math.max(1, Math.round(detents / 10));
    const d = ({ ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: page, PageDown: -page } as Record<string, number>)[e.key];
    if (d) turn(index + d);
    else if (e.key === "Home") turn(0);
    else if (e.key === "End") turn(detents);
    else return;
    e.preventDefault();
  };

  return (
    <div className={"grid gap-1.5 select-none " + className}>
      <div aria-hidden="true" className="flex items-baseline justify-between gap-2">
        <span className="text-small text-fg-muted">{label}</span>
        <b className="text-body font-title text-fg tabular-nums">{figure}</b>
      </div>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={at}
        aria-valuetext={format(at)}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="group/knob relative h-7 cursor-pointer touch-none rounded-pill bg-block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
      >
        <motion.span aria-hidden="true" style={{ clipPath: clip }} className="absolute inset-0 rounded-pill bg-fg forced-colors:bg-[CanvasText]" />
        <motion.span aria-hidden="true" style={{ x, left: INSET, top: INSET, width: H - 2 * INSET, height: H - 2 * INSET }} className="absolute">
          <span className="block size-full rounded-pill bg-surface-1 transition-[scale] duration-(--dur-instant) ease-litt group-active/knob:scale-85 forced-colors:border" />
        </motion.span>
      </div>
    </div>
  );
}
