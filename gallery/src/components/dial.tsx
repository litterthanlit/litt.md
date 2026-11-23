/**
 * Dial, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): one continuous or detented value on a 270° rotary
 * arc, built on Flat's white paper card with every painted child marked in Flat's material vocabulary.
 *
 * - Subtracted to the essentials on a borderless Flat paper card (`litt-paper rounded-surface bg-surface-1 p-6`,
 *   `data-part="paper"`): a quiet label (`data-part="lettering"`), a crisp standing 28px figure (`text-figure`,
 *   `data-part="figure"`), and one circular dial.
 * - A 270° SVG track arc (`-135°` to `+135°`) in neutral `var(--slot)` (`data-part="pill"`), an active progress arc
 *   stroked with Flat's sunset ramp (`--data-seq-1..4`, `data-part="mark"`, dropping to `--fg-disabled` when disabled),
 *   and a clean circular face (`data-part="circle"`, `bg-block`) carrying one solid ink indicator dot (`bg-fg`,
 *   `data-part="circle"`).
 * - Hand first: 1:1 vertical pointer drag with pointer capture (indicator swells subtly on `useTransition("instant")`
 *   while held and settles on `useTransition("expressive")`), mouse wheel stepping, double-click reset to
 *   `defaultValue`, and full keyboard support (`Arrow` keys, `PageUp`/`PageDown`, `Home`/`End`). External value updates
 *   recall smoothly on `useTransition("expressive")`.
 * - One-shot arrival on first view (`useInView` with `once: true`) sweeps the dial from `min` to its starting value on
 *   `useTransition("expressive")`, cancelled immediately on pointer, wheel, key, or value change, and skipped completely
 *   under `useMotionDial().reduced`.
 * - Silent, zero shadows, and a polite `sr-only` live region announcing committed value changes once.
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
  type Transition,
} from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type DialProps = {
  /** Quiet label printed above the standing figure, e.g. "Reading pace". */
  label: ReactNode;
  /** Controlled value. External updates glide smoothly on Flat's expressive spring. */
  value?: number;
  /** Starting value when uncontrolled, and the reset target on double-click. Defaults to the range midpoint. */
  defaultValue?: number;
  /** Lowest value on the dial. Defaults to 0. */
  min?: number;
  /** Highest value on the dial. Defaults to 100. */
  max?: number;
  /** Discrete step size between values. When omitted, the range divides into `detents` steps. */
  step?: number;
  /** Number of discrete detents from min to max when `step` is omitted. Defaults to 24. */
  detents?: number;
  /** Scale taper: "linear" (default) or "log" (evenly spaced by ratio; requires min > 0). */
  taper?: "linear" | "log";
  /** Formats the value for the standing figure and aria-valuetext. Defaults to String. */
  formatValue?: (value: number) => string;
  /** Called whenever the value changes during drag, scroll, key press or reset. */
  onValueChange?: (value: number) => void;
  /** Called once when an interaction commits (pointer release, key press, wheel or reset). */
  onValueCommit?: (value: number) => void;
  /** Disables pointer, wheel and keyboard interaction. Defaults to false. */
  disabled?: boolean;
  /** Extra classes on the paper card root. */
  className?: string;
};

const SIZE = 148;
const CX = SIZE / 2;
const CY = SIZE / 2;
const STROKE = 8;
const RADIUS = 64;
const SWEEP = 270;
const ARC_LENGTH = (SWEEP / 360) * 2 * Math.PI * RADIUS;
const DRAG_RANGE_PX = 160;
const WHEEL_THRESHOLD = 24;

function polar(degFrom12: number, r: number): [number, number] {
  const rad = ((degFrom12 - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

const [START_X, START_Y] = polar(-SWEEP / 2, RADIUS);
const [END_X, END_Y] = polar(SWEEP / 2, RADIUS);
const ARC_PATH = `M ${START_X.toFixed(2)} ${START_Y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 1 1 ${END_X.toFixed(2)} ${END_Y.toFixed(2)}`;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function decimalPlaces(n: number): number {
  const s = String(n);
  const dot = s.indexOf(".");
  return dot < 0 ? 0 : s.length - dot - 1;
}

type Scale = {
  min: number;
  max: number;
  steps: number;
  step?: number;
  log: boolean;
  digits: number;
};

function makeScale(min: number, max: number, step: number | undefined, detents: number, taper: "linear" | "log"): Scale {
  const safeMax = max > min ? max : min + 1;
  const log = taper === "log" && min > 0;
  if (!log && step !== undefined && step > 0) {
    const steps = Math.max(1, Math.round((safeMax - min) / step));
    const digits = Math.max(decimalPlaces(step), decimalPlaces(min));
    return { min, max: safeMax, steps, step, log: false, digits };
  }
  const steps = Math.max(1, Math.round(detents));
  return { min, max: safeMax, steps, log, digits: 2 };
}

function fractionOf(v: number, s: Scale): number {
  const clamped = Math.min(s.max, Math.max(s.min, v));
  if (s.log) return clamp01(Math.log(clamped / s.min) / Math.log(s.max / s.min));
  return clamp01((clamped - s.min) / (s.max - s.min));
}

function valueAtIndex(i: number, s: Scale): number {
  const clamped = Math.min(s.steps, Math.max(0, Math.round(i)));
  if (s.log) {
    const raw = s.min * Math.pow(s.max / s.min, clamped / s.steps);
    return Math.min(s.max, Math.max(s.min, Math.round(raw * 100) / 100));
  }
  if (s.step !== undefined) {
    const raw = s.min + clamped * s.step;
    return Math.min(s.max, Math.max(s.min, Number(raw.toFixed(s.digits))));
  }
  const raw = s.min + ((s.max - s.min) * clamped) / s.steps;
  return Math.min(s.max, Math.max(s.min, Math.round(raw * 100) / 100));
}

function snapValue(v: number, s: Scale): number {
  return valueAtIndex(Math.round(fractionOf(v, s) * s.steps), s);
}

function midpointOf(s: Scale): number {
  return valueAtIndex(Math.round(s.steps / 2), s);
}

type DragState = {
  id: number;
  startY: number;
  startFraction: number;
  startValue: number;
  moved: boolean;
};

/** A subtracted Flat rotary dial on paper: quiet label, standing figure, sunset progress arc and rotating ink dot. */
export function Dial({
  label,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step,
  detents = 24,
  taper = "linear",
  formatValue = String,
  onValueChange,
  onValueCommit,
  disabled = false,
  className = "",
}: DialProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const labelId = useId();
  const gradId = useId();

  const scale = makeScale(min, max, step, detents, taper);
  const resetTarget = snapValue(defaultValue ?? midpointOf(scale), scale);
  const isControlled = value !== undefined;

  const [inner, setInner] = useState<number>(() => resetTarget);
  const current = isControlled ? snapValue(value, scale) : inner;
  const currentFraction = fractionOf(current, scale);

  const [held, setHeld] = useState(false);
  const [live, setLive] = useState("");

  const { reduced } = useMotionDial();
  const instant = useTransition("instant");
  const responsive = useTransition("responsive");
  const expressive = useTransition("expressive");
  const inView = useInView(rootRef, { once: true, amount: 0.2 });

  const fraction = useMotionValue(currentFraction);
  const strokeDashoffset = useTransform(fraction, (f) => ARC_LENGTH * (1 - clamp01(f)));
  const arcOpacity = useTransform(fraction, (f) => (clamp01(f) > 0.002 ? 1 : 0));
  const rotate = useTransform(fraction, (f) => -SWEEP / 2 + clamp01(f) * SWEEP);

  const animRef = useRef<AnimationPlaybackControls | null>(null);
  const doneRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const byHandRef = useRef<number | null>(null);
  const lastEmittedRef = useRef(current);
  const prevValueRef = useRef(current);
  const initialValueRef = useRef(current);

  const latestRef = useRef({
    scale,
    current,
    resetTarget,
    isControlled,
    disabled,
    reduced,
    label,
    formatValue,
    onValueChange,
    onValueCommit,
    responsive,
    expressive,
  });
  latestRef.current = {
    scale,
    current,
    resetTarget,
    isControlled,
    disabled,
    reduced,
    label,
    formatValue,
    onValueChange,
    onValueCommit,
    responsive,
    expressive,
  };

  const stopAnim = useCallback(() => {
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }
  }, []);

  const writeReadout = useCallback((v: number) => {
    if (readoutRef.current) {
      readoutRef.current.textContent = latestRef.current.formatValue(v);
    }
  }, []);

  const announce = useCallback((v: number, reset = false) => {
    const { label: lbl, formatValue: fmt } = latestRef.current;
    const text = fmt(v);
    const prefix = typeof lbl === "string" && lbl.trim() ? lbl.trim() : "";
    if (reset) {
      setLive(prefix ? `${prefix} reset to ${text}.` : `Reset to ${text}.`);
    } else {
      setLive(prefix ? `${prefix}: ${text}.` : `${text}.`);
    }
  }, []);

  const glideTo = useCallback(
    (targetFrac: number, transition: Transition, settleValue?: number) => {
      stopAnim();
      const clamped = clamp01(targetFrac);
      if (latestRef.current.reduced || Math.abs(fraction.get() - clamped) < 1e-4) {
        fraction.set(clamped);
        if (settleValue !== undefined) writeReadout(settleValue);
        return;
      }
      const controls = animate(fraction, clamped, {
        ...transition,
        onComplete: () => {
          if (animRef.current !== controls) return;
          animRef.current = null;
          if (settleValue !== undefined) writeReadout(settleValue);
        },
      });
      animRef.current = controls;
    },
    [fraction, stopAnim, writeReadout],
  );

  const cancelArrival = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopAnim();
  }, [stopAnim]);

  useEffect(() => () => stopAnim(), [stopAnim]);

  /* Keep the standing figure locked to the motion value during arrival and spring recall. */
  useEffect(() => {
    return fraction.on("change", (f) => {
      const s = latestRef.current.scale;
      const shown = valueAtIndex(Math.round(clamp01(f) * s.steps), s);
      writeReadout(shown);
    });
  }, [fraction, writeReadout]);

  /* One-shot arrival on first view: sweeps from min to the initial value on Flat's expressive spring. */
  useEffect(() => {
    if (!inView || doneRef.current || reduced || disabled || held) return;
    doneRef.current = true;
    const startTarget = fractionOf(latestRef.current.current, latestRef.current.scale);
    if (startTarget <= 1e-4) return;
    fraction.set(0);
    writeReadout(latestRef.current.scale.min);
    glideTo(startTarget, latestRef.current.expressive, latestRef.current.current);
  }, [inView, reduced, disabled, held, fraction, glideTo, writeReadout]);

  /* Reduced motion or disabled state cancels any in-flight motion and snaps immediately. */
  useEffect(() => {
    if (!reduced && !disabled) return;
    doneRef.current = true;
    stopAnim();
    fraction.set(fractionOf(latestRef.current.current, latestRef.current.scale));
    writeReadout(latestRef.current.current);
  }, [reduced, disabled, fraction, stopAnim, writeReadout]);

  /* External value updates (e.g. presets or controlled recall) glide smoothly on the expressive spring. */
  useLayoutEffect(() => {
    if (current === prevValueRef.current) return;
    prevValueRef.current = current;
    lastEmittedRef.current = current;
    if (current !== initialValueRef.current) doneRef.current = true;

    if (dragRef.current || byHandRef.current === current) {
      byHandRef.current = null;
      return;
    }

    const target = fractionOf(current, latestRef.current.scale);
    if (latestRef.current.reduced) {
      stopAnim();
      fraction.set(target);
      writeReadout(current);
      return;
    }
    /* Hold the current displayed number before paint so the spring counts cleanly into the new value. */
    const fromVal = valueAtIndex(Math.round(clamp01(fraction.get()) * latestRef.current.scale.steps), latestRef.current.scale);
    writeReadout(fromVal);
    glideTo(target, latestRef.current.expressive, current);
  }, [current, fraction, glideTo, stopAnim, writeReadout]);

  const commitStep = useCallback(
    (nextIndex: number, transition: Transition, reset = false) => {
      const { scale: s, current: cur, isControlled: ctrl, onValueChange: onChg, onValueCommit: onCom } = latestRef.current;
      doneRef.current = true;
      const nextVal = valueAtIndex(nextIndex, s);
      if (nextVal === cur) return;
      lastEmittedRef.current = nextVal;
      byHandRef.current = nextVal;
      if (!ctrl) setInner(nextVal);
      onChg?.(nextVal);
      onCom?.(nextVal);
      glideTo(fractionOf(nextVal, s), transition, nextVal);
      announce(nextVal, reset);
    },
    [announce, glideTo],
  );

  /* Native wheel listener so turning the dial prevents the page from scrolling. */
  useEffect(() => {
    const el = dialRef.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      const { disabled: off, scale: s, current: cur, responsive: resp } = latestRef.current;
      if (off) return;
      e.preventDefault();
      acc -= e.deltaY;
      if (Math.abs(acc) < WHEEL_THRESHOLD) return;
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      const idx = Math.round(fractionOf(cur, s) * s.steps);
      commitStep(idx + dir, resp);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [commitStep]);

  /* Escape cancels an active drag and returns the dial to where the drag began. */
  useEffect(() => {
    if (!held) return;
    const onEscape = (e: globalThis.KeyboardEvent) => {
      const d = dragRef.current;
      if (e.key !== "Escape" || !d) return;
      e.preventDefault();
      dragRef.current = null;
      setHeld(false);
      const { scale: s, isControlled: ctrl, onValueChange: onChg, responsive: resp } = latestRef.current;
      if (lastEmittedRef.current !== d.startValue) {
        lastEmittedRef.current = d.startValue;
        byHandRef.current = d.startValue;
        if (!ctrl) setInner(d.startValue);
        onChg?.(d.startValue);
      }
      glideTo(fractionOf(d.startValue, s), resp, d.startValue);
    };
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [held, glideTo]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || !e.isPrimary) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    cancelArrival();
    stopAnim();
    e.currentTarget.focus({ preventScroll: true });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    const startFrac = fractionOf(current, scale);
    fraction.set(startFrac);
    lastEmittedRef.current = current;
    dragRef.current = {
      id: e.pointerId,
      startY: e.clientY,
      startFraction: startFrac,
      startValue: current,
      moved: false,
    };
    setHeld(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId || disabled) return;
    const dy = d.startY - e.clientY;
    if (Math.abs(dy) >= 2) d.moved = true;
    const rangePx = DRAG_RANGE_PX * (e.shiftKey ? 3 : 1);
    const nextFrac = clamp01(d.startFraction + dy / rangePx);
    fraction.set(nextFrac);
    const nextVal = valueAtIndex(Math.round(nextFrac * scale.steps), scale);
    if (nextVal !== lastEmittedRef.current) {
      lastEmittedRef.current = nextVal;
      byHandRef.current = nextVal;
      if (!isControlled) setInner(nextVal);
      onValueChange?.(nextVal);
    }
  }

  function finishDrag(e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    setHeld(false);
    if (cancelled) {
      if (lastEmittedRef.current !== d.startValue) {
        lastEmittedRef.current = d.startValue;
        byHandRef.current = d.startValue;
        if (!isControlled) setInner(d.startValue);
        onValueChange?.(d.startValue);
      }
      glideTo(fractionOf(d.startValue, scale), responsive, d.startValue);
      return;
    }
    const finalVal = lastEmittedRef.current;
    glideTo(fractionOf(finalVal, scale), responsive, finalVal);
    if (d.moved && finalVal !== d.startValue) {
      onValueCommit?.(finalVal);
      announce(finalVal);
    }
  }

  function onDoubleClick() {
    if (disabled) return;
    const targetIdx = Math.round(fractionOf(resetTarget, scale) * scale.steps);
    commitStep(targetIdx, expressive, true);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
    const idx = Math.round(fractionOf(current, scale) * scale.steps);
    const page = Math.max(1, Math.round(scale.steps / 10));
    let targetIdx: number | null = null;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") targetIdx = idx + 1;
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") targetIdx = idx - 1;
    else if (e.key === "PageUp") targetIdx = idx + page;
    else if (e.key === "PageDown") targetIdx = idx - page;
    else if (e.key === "Home") targetIdx = 0;
    else if (e.key === "End") targetIdx = scale.steps;
    if (targetIdx === null) return;
    e.preventDefault();
    commitStep(targetIdx, responsive);
  }

  const formatted = formatValue(current);

  return (
    <div
      ref={rootRef}
      data-part="paper"
      data-disabled={disabled ? "" : undefined}
      className={
        "litt-paper grid w-full max-w-[248px] min-w-0 justify-items-center gap-5 rounded-surface bg-surface-1 p-6 select-none forced-colors:border " +
        className
      }
    >
      <header className="grid w-full min-w-0 justify-items-center gap-1 text-center">
        <span id={labelId} data-part="lettering" className="max-w-full truncate text-small text-fg-subtle">
          {label}
        </span>
        <span
          ref={readoutRef}
          aria-hidden="true"
          data-part="figure"
          className={"text-figure tabular-nums " + (disabled ? "text-fg-subtle" : "text-fg")}
        >
          {formatted}
        </span>
      </header>

      <div
        ref={dialRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={labelId}
        aria-orientation="vertical"
        aria-valuemin={scale.min}
        aria-valuemax={scale.max}
        aria-valuenow={current}
        aria-valuetext={formatted}
        aria-disabled={disabled || undefined}
        data-no-drag=""
        data-held={held ? "" : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => finishDrag(e, false)}
        onPointerCancel={(e) => finishDrag(e, true)}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
        className={
          "group/dial relative grid size-[148px] place-items-center rounded-pill touch-none [-webkit-tap-highlight-color:transparent] " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
          (disabled ? "cursor-not-allowed" : held ? "cursor-grabbing" : "cursor-ns-resize")
        }
      >
        <svg
          aria-hidden="true"
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={CX - RADIUS}
              y1={CY + RADIUS * 0.55}
              x2={CX + RADIUS * 0.6}
              y2={CY - RADIUS}
            >
              <stop offset="0%" stopColor="var(--data-seq-1)" />
              <stop offset="33%" stopColor="var(--data-seq-2)" />
              <stop offset="66%" stopColor="var(--data-seq-3)" />
              <stop offset="100%" stopColor="var(--data-seq-4)" />
            </linearGradient>
          </defs>
          <path
            data-part="pill"
            d={ARC_PATH}
            fill="none"
            stroke="var(--slot)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className="forced-colors:stroke-[ButtonBorder]"
          />
          <motion.path
            data-part="mark"
            d={ARC_PATH}
            fill="none"
            stroke={disabled ? "var(--fg-disabled)" : `url(#${gradId})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            style={{ strokeDashoffset, opacity: arcOpacity }}
            className="forced-colors:stroke-[Highlight]"
          />
          <circle
            data-part="circle"
            cx={CX}
            cy={CY}
            r={50}
            className={
              "transition-colors duration-(--dur-instant) ease-litt forced-colors:stroke-[ButtonText] " +
              (disabled ? "fill-surface-2" : "fill-block group-hover/dial:fill-(--block-hover)")
            }
          />
          <motion.g style={{ rotate, transformOrigin: `${CX}px ${CY}px` }}>
            <motion.circle
              data-part="circle"
              cx={CX}
              cy={CY - 33}
              r={5}
              initial={false}
              animate={{ scale: held && !reduced ? 1.25 : 1 }}
              transition={held ? instant : expressive}
              style={{ transformOrigin: `${CX}px ${CY - 33}px` }}
              className={"forced-colors:fill-[Highlight] " + (disabled ? "fill-fg-disabled" : "fill-fg")}
            />
          </motion.g>
        </svg>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
