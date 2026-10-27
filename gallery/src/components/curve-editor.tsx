/**
 * Curve editor: an easing shaped by hand, as a cubic Bézier. Two handles pull the curve from its start and its end,
 * as in cubic-bezier(x1, y1, x2, y2), and the curve, a line of words and a dot on a rail follow.
 *
 * - Surface: the Pad's well, the cut (R3): --cut inside the --line-control line with --cut-shade, at the surface
 *   radius. Time runs left to right from 0 to 1, progress bottom to top. The floor shows progress from -0.25 to 1.25,
 *   so a curve that pulls back or passes its end still fits: a --line-strong baseline at 0, a dashed --line-strong
 *   target at 1, and a dashed --line-strong diagonal for linear, all static chrome inside the cap's 14px inset.
 * - Curve: --fg at 1.5px from the start (bottom left) to the end (top right), each end a 6px dot in --fg-muted. A
 *   1px --fg-muted arm runs from the start to the first handle and from the end to the second, as every Bézier tool
 *   draws them, so you can see which handle pulls which end. defaultMark draws its curve under it, dashed in
 *   --fg-subtle.
 * - Handles: the Pad's round cap, 20px (--cap, --cap-lift); held, --cap-held and --cap-press and it sinks
 *   --press-depth. Never the accent (R6), never a new size.
 * - It says its value (R5): the curve as CSS under the well, in mono because it is code, and what it feels like in
 *   words beside it ("Starts quick and eases into place"). The words are every input's aria-valuetext too.
 * - Preview: the Spring editor's rail, with the dot crossing on this easing for `duration`. It plays by itself when a
 *   change is committed and crosses back the next time. It is the one place this component moves, on the person's
 *   own curve, because the preview is the point. Reduced motion lands it at once.
 * - Pointer: a press on a handle takes it where it was taken, so it never jumps under the finger; a press anywhere
 *   else sends the nearer handle there. The handle follows one to one; values snap to 0.01. Double-click goes back to
 *   defaultMark. data-no-drag and touch-action none: the whole well is the target.
 * - Keyboard: each handle is one tab stop with two visually hidden range inputs (time in the tab order, progress
 *   tabindex -1), as on the Pad. ← → move the handle in time, ↑ ↓ in progress, Shift makes it 10 steps, Page Up and
 *   Page Down move progress by 10 steps, Home and End take time to its ends.
 * - Disabled: everything lies flat, as the Pad's, with the curve and the words in --fg-disabled.
 * - Motion: the handles, the arms and the curve follow the pointer and the keys at once, with no easing (R4).
 */
import { useId, useRef, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { motion, type Transition } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";
import { LIMITS } from "@/motion/rules";
import { Button } from "@/components/button";
import { PlayIcon } from "@/components/icons";

/** An easing as the four numbers of cubic-bezier(x1, y1, x2, y2). x stays between 0 and 1. */
export type CubicBezier = [x1: number, y1: number, x2: number, y2: number];

export type CurveEditorProps = {
  /** The label above the editor. Required: it names the group and describes every input for screen readers. */
  label: ReactNode;
  /** Help text under the editor, linked to every input with aria-describedby. */
  help?: ReactNode;
  /** The curve, when you control it, as [x1, y1, x2, y2]. Pair it with onValueChange. */
  value?: CubicBezier;
  /** The curve it starts at when you do not control it. Defaults to [0.25, 0.1, 0.25, 1]. */
  defaultValue?: CubicBezier;
  /** Called with the new curve on every move of a handle, by pointer or key. */
  onValueChange?: (value: CubicBezier) => void;
  /** Called with the final curve when a drag is released, or right after a key moves a handle. Use it to save. */
  onValueCommit?: (value: CubicBezier) => void;
  /** How long the preview's dot takes to cross, in ms. Defaults to 600, the longest a litt motion may take to settle. */
  duration?: number;
  /** Draws this curve dashed under the one being edited, so people can see where Reset goes. Double-click the well to go back to it. */
  defaultMark?: CubicBezier;
  /** Shows the rail under the well where a dot crosses on the curve, with a Play button. On by default. */
  preview?: boolean;
  /** Height of the well in px. The width is the container's. */
  height?: number;
  /** Makes the editor unavailable: muted, skipped by Tab, and ignoring the pointer. */
  disabled?: boolean;
  /** Extra classes for the wrapper, such as a width. */
  className?: string;
};

/* ----------------------------------------------------------------- geometry */

const INSET = 14;
const GRAB = 20; // a press this close to a handle's centre takes the handle where it is
const STEP = 0.01;
const Y_MIN = -0.25;
const Y_MAX = 1.25;
const VIEW = 1000;
const HANDLES = ["Start handle", "End handle"] as const;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const snap = (raw: number, lo: number, hi: number) => Number(clamp(Math.round(raw / STEP) * STEP, lo, hi).toFixed(2));
const along = (f: number) => `calc(${INSET}px + (100% - ${2 * INSET}px) * ${f})`;
/** Where a progress value sits from the top, as a fraction of the inset box. */
const fromTop = (y: number) => (Y_MAX - y) / (Y_MAX - Y_MIN);
const num = (v: number) => String(+v.toFixed(2));

/** The curve as CSS: cubic-bezier(0.25, 0.1, 0.25, 1). */
export const toCubicBezier = ([x1, y1, x2, y2]: CubicBezier) => `cubic-bezier(${num(x1)}, ${num(y1)}, ${num(x2)}, ${num(y2)})`;

/** What a curve feels like, in words, from where its handles pull. */
export function describeCurve([x1, y1, x2, y2]: CubicBezier): string {
  if (y1 < 0 && y2 > 1) return "Pulls back, then passes the end and settles";
  if (y1 < 0) return "Pulls back, then goes";
  if (y2 > 1 || y1 > 1) return "Passes the end and settles back";
  const start = x1 === 0 ? Infinity : y1 / x1;
  const end = x2 === 1 ? Infinity : (1 - y2) / (1 - x2);
  const quick = (s: number) => s > 1.5;
  const slow = (s: number) => s < 0.67;
  if (quick(start) && slow(end)) return "Starts quick and eases into place";
  if (slow(start) && quick(end)) return "Starts slow and speeds up";
  if (slow(start) && slow(end)) return "Slow at both ends, quick in the middle";
  if (quick(start) && quick(end)) return "Quick at both ends, slow in the middle";
  if (Math.abs(start - end) < 0.25) return "Even, close to linear";
  return start > end ? "Eases out gently" : "Eases in gently";
}

const point = (x: number, y: number) => `${(x * VIEW).toFixed(1)} ${(fromTop(y) * VIEW).toFixed(1)}`;
const pathOf = ([x1, y1, x2, y2]: CubicBezier) => `M${point(0, 0)}C${point(x1, y1)} ${point(x2, y2)} ${point(1, 1)}`;

/* ----------------------------------------------------------------- styles */

const well = "relative w-full touch-none select-none overflow-hidden rounded-surface forced-colors:border ";
const wellOn = "bg-cut shadow-[inset_0_0_0_1px_var(--line-control),var(--cut-shade)]";
const wellOff = "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";
const thumb = "pointer-events-none absolute block size-5 -translate-x-1/2 rounded-pill forced-colors:border ";
const thumbUp = "-translate-y-1/2 bg-cap shadow-(--cap-lift) forced-colors:bg-[Highlight]";
const thumbHeld = "translate-y-[calc(var(--press-depth)-50%)] bg-cap-held shadow-(--cap-press) forced-colors:bg-[Highlight]";
const thumbOff = "-translate-y-1/2 bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";
const end = "pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-pill ";

/* ----------------------------------------------------------------- the preview */

function Preview({ curve, duration, run, disabled }: { curve: CubicBezier; duration: number; run: number; disabled?: boolean }) {
  const { reduced } = useMotionDial();
  const still = useTransition("instant");
  const own: Transition = { type: "tween", duration: duration / 1000, ease: curve }; // litt-allow: the preview runs on the curve being edited
  return (
    <div aria-hidden="true" className="relative h-3 min-w-0 flex-1">
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
      <motion.span
        className="absolute inset-y-0 left-0 w-[calc(100%-12px)]"
        initial={false}
        animate={{ x: run % 2 ? "100%" : "0%" }}
        transition={reduced ? still : own}
      >
        <span className={"absolute top-0 left-0 size-3 rounded-pill " + (disabled ? "bg-fg-disabled" : "bg-fg")} />
      </motion.span>
    </div>
  );
}

/* ----------------------------------------------------------------- CurveEditor */

/** An easing drawn by hand: drag the two handles to shape a cubic Bézier, and read it back as CSS and in words. */
export function CurveEditor({
  label,
  help,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  duration = LIMITS.settleMs,
  defaultMark,
  preview = true,
  height = 220,
  disabled = false,
  className = "",
}: CurveEditorProps) {
  const id = useId().replace(/[^\w-]/g, "");
  const labelId = `${id}-label`;
  const helpId = help ? `${id}-help` : undefined;
  const cssId = `${id}-css`;

  const [inner, setInner] = useState<CubicBezier>(() => defaultValue ?? [0.25, 0.1, 0.25, 1]);
  const value = valueProp ?? inner;
  const feel = describeCurve(value);
  const css = toCubicBezier(value);

  const inputs0 = useRef<HTMLInputElement>(null);
  const inputs1 = useRef<HTMLInputElement>(null);
  const [held, setHeld] = useState<0 | 1 | null>(null);
  const [keys, setKeys] = useState<0 | 1 | null>(null);
  const [run, setRun] = useState(0);
  const dragRef = useRef<{ handle: 0 | 1; dx: number; dy: number } | null>(null);
  const lastRef = useRef<CubicBezier>(value);

  const move = (next: CubicBezier) => {
    if (next.every((n, i) => n === value[i])) return false;
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
    return true;
  };
  const commit = (next: CubicBezier) => {
    onValueCommit?.(next);
    if (preview) setRun((r) => r + 1);
  };
  const place = (curve: CubicBezier, handle: 0 | 1, x: number, y: number): CubicBezier => {
    const next = [...curve] as CubicBezier;
    next[handle * 2] = snap(x, 0, 1);
    next[handle * 2 + 1] = snap(y, Y_MIN, Y_MAX);
    return next;
  };

  /* ---- pointer */

  /** The pointer in the curve's units, and each handle's distance from it in px. */
  const read = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const w = Math.max(1, box.width - 2 * INSET);
    const h = Math.max(1, box.height - 2 * INSET);
    const px = e.clientX - box.left - INSET;
    const py = e.clientY - box.top - INSET;
    const at = (handle: 0 | 1) => ({ x: value[handle * 2] * w, y: fromTop(value[handle * 2 + 1]) * h });
    const dist = (handle: 0 | 1) => Math.hypot(at(handle).x - px, at(handle).y - py);
    return { w, h, px, py, at, dist };
  };

  const drag = (e: PointerEvent<HTMLDivElement>) => {
    const grip = dragRef.current;
    if (!grip) return;
    const { w, h, px, py } = read(e);
    const x = (px - grip.dx) / w;
    const y = Y_MAX - ((py - grip.dy) / h) * (Y_MAX - Y_MIN);
    const next = place(value, grip.handle, x, y);
    lastRef.current = next;
    move(next);
  };

  const release = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setHeld(null);
    commit(lastRef.current);
  };

  /* ---- keyboard */

  const onKeyDown = (handle: 0 | 1) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
    const n = e.shiftKey ? 10 : 1;
    const x = value[handle * 2];
    const y = value[handle * 2 + 1];
    let next: CubicBezier | null = null;
    switch (e.key) {
      case "ArrowLeft":
        next = place(value, handle, x - n * STEP, y);
        break;
      case "ArrowRight":
        next = place(value, handle, x + n * STEP, y);
        break;
      case "ArrowDown":
        next = place(value, handle, x, y - n * STEP);
        break;
      case "ArrowUp":
        next = place(value, handle, x, y + n * STEP);
        break;
      case "PageDown":
        next = place(value, handle, x, y - 10 * STEP);
        break;
      case "PageUp":
        next = place(value, handle, x, y + 10 * STEP);
        break;
      case "Home":
        next = place(value, handle, 0, y);
        break;
      case "End":
        next = place(value, handle, 1, y);
        break;
    }
    if (!next) return;
    e.preventDefault();
    setKeys(handle);
    if (move(next)) commit(next);
  };

  const adjust = (handle: 0 | 1, axis: 0 | 1, raw: string) => {
    const x = axis === 0 ? Number(raw) : value[handle * 2];
    const y = axis === 1 ? Number(raw) : value[handle * 2 + 1];
    const next = place(value, handle, x, y);
    if (move(next)) commit(next);
  };

  /* ---- what is drawn */

  const describedBy = [labelId, helpId, cssId].filter(Boolean).join(" ");
  const ink = disabled ? "stroke-fg-disabled" : "stroke-fg";
  const chrome = disabled ? "stroke-line" : "stroke-line-strong";
  const arm = disabled ? "stroke-line" : "stroke-fg-muted";

  const inputsFor = (handle: 0 | 1) => {
    const name = HANDLES[handle];
    const x = value[handle * 2];
    const y = value[handle * 2 + 1];
    const text = `${name} at time ${num(x)}, progress ${num(y)}. ${feel}.`;
    const shared = {
      type: "range" as const,
      step: STEP,
      disabled,
      "aria-describedby": describedBy,
      "aria-valuetext": text,
      onKeyDown: onKeyDown(handle),
      onFocus: (e: FocusEvent<HTMLInputElement>) => {
        if (!dragRef.current) setKeys(e.currentTarget.matches(":focus-visible") ? handle : null);
      },
      onBlur: () => setKeys(null),
    };
    return (
      <>
        <input
          ref={handle === 0 ? inputs0 : inputs1}
          className="sr-only"
          {...shared}
          min={0}
          max={1}
          value={x}
          aria-label={`${name}, time`}
          onChange={(e: ChangeEvent<HTMLInputElement>) => adjust(handle, 0, e.target.value)}
        />
        <input
          className="sr-only"
          tabIndex={-1}
          aria-orientation="vertical"
          {...shared}
          min={Y_MIN}
          max={Y_MAX}
          value={y}
          aria-label={`${name}, progress`}
          onChange={(e: ChangeEvent<HTMLInputElement>) => adjust(handle, 1, e.target.value)}
        />
      </>
    );
  };

  const [x1, y1, x2, y2] = value;

  return (
    <div className={["grid gap-2", className].join(" ")}>
      <span id={labelId} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} aria-disabled={disabled || undefined}>
        <div
          data-no-drag=""
          className={well + (disabled ? wellOff + " cursor-not-allowed" : wellOn + " cursor-pointer")}
          style={{ height }}
          onMouseDown={(e) => {
            if (!disabled) e.preventDefault();
          }}
          onPointerDown={(e) => {
            if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
            const { px, py, at, dist } = read(e);
            const handle: 0 | 1 = dist(0) <= dist(1) ? 0 : 1;
            const near = dist(handle) <= GRAB;
            const c = at(handle);
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = { handle, dx: near ? px - c.x : 0, dy: near ? py - c.y : 0 };
            setHeld(handle);
            setKeys(null);
            drag(e);
            (handle === 0 ? inputs0 : inputs1).current?.focus({ preventScroll: true });
          }}
          onPointerMove={drag}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          onDoubleClick={() => {
            if (disabled || !defaultMark) return;
            if (move(defaultMark)) commit(defaultMark);
          }}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox={`0 0 ${VIEW} ${VIEW}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute overflow-visible"
            style={{ left: INSET, top: INSET, width: `calc(100% - ${2 * INSET}px)`, height: `calc(100% - ${2 * INSET}px)` }}
          >
            <path d={`M0 ${point(0, 0).split(" ")[1]}H${VIEW}`} className={chrome} strokeWidth={1} vectorEffect="non-scaling-stroke" fill="none" />
            <path d={`M0 ${point(0, 1).split(" ")[1]}H${VIEW}`} className={chrome} strokeWidth={1} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" fill="none" />
            <path d={`M${point(0, 0)}L${point(1, 1)}`} className={chrome} strokeWidth={1} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" fill="none" />
            {defaultMark && (
              <path d={pathOf(defaultMark)} className={disabled ? "stroke-fg-disabled" : "stroke-fg-subtle"} strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" fill="none" />
            )}
            <path d={`M${point(0, 0)}L${point(x1, y1)}M${point(1, 1)}L${point(x2, y2)}`} className={arm} strokeWidth={1} vectorEffect="non-scaling-stroke" fill="none" />
            <path d={pathOf(value)} className={ink} strokeWidth={1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" fill="none" />
          </svg>

          <span aria-hidden="true" className={end + (disabled ? "bg-fg-disabled" : "bg-fg-muted")} style={{ left: along(0), top: along(fromTop(0)) }} />
          <span aria-hidden="true" className={end + (disabled ? "bg-fg-disabled" : "bg-fg-muted")} style={{ left: along(1), top: along(fromTop(1)) }} />

          {inputsFor(0)}
          {inputsFor(1)}

          {([0, 1] as const).map((handle) => (
            <span
              key={handle}
              aria-hidden="true"
              className={thumb + (disabled ? thumbOff : held === handle ? thumbHeld : thumbUp) + (keys === handle ? " outline-2 outline-offset-2 outline-focus" : "")}
              style={{ left: along(clamp(value[handle * 2], 0, 1)), top: along(fromTop(clamp(value[handle * 2 + 1], Y_MIN, Y_MAX))) }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <code id={cssId} className={"font-mono text-caption font-normal tabular-nums " + (disabled ? "text-fg-disabled" : "text-fg")}>
          {css}
        </code>
        <span className={"text-small " + (disabled ? "text-fg-disabled" : "text-fg-muted")}>{feel}</span>
      </div>

      {preview && (
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" icon={<PlayIcon />} disabled={disabled} onClick={() => setRun((r) => r + 1)} className="-ml-3">
            Play
          </Button>
          <Preview curve={value} duration={duration} run={run} disabled={disabled} />
        </div>
      )}

      {help && (
        <p id={helpId} className="text-small text-fg-subtle">
          {help}
        </p>
      )}
    </div>
  );
}
