/**
 * Pad: two values set at once on one surface, like a reply's tone against its length. It is the Slider in two
 * dimensions: the same round thumb, the same foreground (a control fills with --fg, never the accent, P1), and the
 * same rule that position never eases.
 *
 * - Surface: a well. --surface-2 at the surface radius with an inset --line hairline, and a static dot grid (fg at
 *   about 14%, 1.5px dots on a 16px pitch, an SVG pattern). The grid is a coordinate system, so it never moves. The
 *   four axis words sit inside the edges at the caption size in --fg-subtle, in sentence case: y's maxLabel at the
 *   top, its minLabel at the bottom, x's minLabel at the left and maxLabel at the right. y grows upward. Each word
 *   sits on a plate in the well's own color, so the grid and the crosshairs break around it instead of running
 *   through the letters.
 * - Thumb: the Slider's thumb, a 20px circle in --surface-1 with an inset --line-control edge and the top highlight.
 *   It never changes size. A 1px dashed --line-strong line runs through it, once across and once down the whole pad.
 *   The thumb stays inside the pad: its centre travels from 14px in to 14px short of the far edge (its radius, the
 *   2px focus ring and the 2px offset), so the ring never crosses the edge, and the pointer maths uses the same
 *   range, so the thumb sits under the pointer.
 * - Default mark: pass defaultMark and a 20px dashed circle in --fg-subtle sits there, with "Default" beside it in
 *   the caption. It is where Reset would take the thumb.
 * - Tooltip: the chart's tooltip look (solid --surface-3, --shadow-tooltip, the control radius) shows formatValue
 *   beside the thumb while you drag, while the pointer is over the pad, and while the keyboard has focus. It tries the
 *   right, then the left, then above, then below (above first for a finger), so it stays inside the pad and clear of
 *   the thumb. Esc hides it. It repeats what the inputs say, so it is hidden from screen readers.
 * - Pointer: pressing anywhere moves the thumb there and starts a drag. The pad captures the pointer, so a drag may
 *   leave the pad. Values snap to each axis's step. The pad is marked data-no-drag (a sheet never moves under it) and
 *   has touch-action none: the whole pad belongs to the thumb, so it is the whole target and needs no extra hit area.
 * - Keyboard (the React Aria ColorArea pattern): two visually hidden range inputs, one per axis, each named by its
 *   axis label. One tab stop: the x input is in the tab order and the y input is tabindex -1, still reachable by a
 *   screen reader. On either input, ← and → change x, ↑ and ↓ change y, Shift makes them 10 steps, Page Up and Page
 *   Down move y by 10 steps, and Home and End take x to its ends. Both inputs carry the formatted value as
 *   aria-valuetext. Native adjustments (a screen reader's swipe) go through onChange.
 * - Focus: when an input is focus-visible, the thumb gets the 2px focus ring, 2px away. A press focuses the x input
 *   without the ring.
 * - Disabled: the thumb in --surface-2 with a --line edge, the crosshairs at --line, every word in --fg-disabled, no
 *   pointer and no tab stop.
 * - Motion: the thumb, the crosshairs and the tooltip follow the pointer and the keys at once. Position is a layout
 *   value, and an eased jump would lag the input. The only motion is the tooltip fading on the responsive tier.
 * - Forced colors drops box-shadow, so the well and the thumb get real borders.
 */
import { useId, useLayoutEffect, useRef, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDevice, useExit, useTransition } from "@/motion";

/** One axis of the pad: its name, its range and the words at its ends. */
export type PadAxis = {
  /** What the axis sets, such as "Length". It names the axis's input for screen readers. */
  label: string;
  /** The value at the left edge (x) or the bottom edge (y). */
  min: number;
  /** The value at the right edge (x) or the top edge (y). */
  max: number;
  /** The gap between values. The thumb snaps to it, and an arrow key moves one step. Defaults to 1. */
  step?: number;
  /** The word inside the left edge (x) or the bottom edge (y), such as "Brief" or "Formal". Say which way is which. */
  minLabel?: string;
  /** The word inside the right edge (x) or the top edge (y), such as "Detailed" or "Casual". */
  maxLabel?: string;
};

/** The pad's value: one number per axis. y grows upward. */
export type PadValue = { x: number; y: number };

export type PadProps = {
  /** The label above the pad. Required: it names the group and describes both inputs for screen readers. */
  label: ReactNode;
  /** Help text under the pad, linked to both inputs with aria-describedby, as on the Slider. */
  help?: ReactNode;
  /** The horizontal axis, left to right. */
  x: PadAxis;
  /** The vertical axis, bottom to top. */
  y: PadAxis;
  /** The value, when you control it. Pair it with onValueChange. */
  value?: PadValue;
  /** The value it starts at when you do not control it. Without one, the thumb starts in the middle. */
  defaultValue?: PadValue;
  /** Called with the new value on every move of the thumb, by pointer or key. */
  onValueChange?: (value: PadValue) => void;
  /** Called with the final value when a drag is released, or right after a key moves the thumb. Use it to save. */
  onValueCommit?: (value: PadValue) => void;
  /** Draws a dashed circle marked "Default" at this value, so people can see where Reset would go. */
  defaultMark?: PadValue;
  /** Turns a value into words, such as { x: 10, y: 55 } into "Warm, brief, about 40 words". It feeds the tooltip and the aria-valuetext of both inputs. Without it, the two numbers are shown with their axis labels. */
  formatValue?: (value: PadValue) => string;
  /** Height of the pad in px. The width is the container's. */
  height?: number;
  /** Makes the pad unavailable: muted, skipped by Tab, and ignoring the pointer. */
  disabled?: boolean;
  /** Extra classes for the wrapper, such as a width. */
  className?: string;
};

/* ----------------------------------------------------------------- geometry */

const R = 10; // the thumb's radius
const INSET = 14; // how far the thumb's centre stays from every edge: its radius, the 2px ring and the 2px offset, so the ring never crosses the edge
const EDGE = 4; // the air the tooltip keeps from the pad's edge
const DOT = 16; // pitch of the dot grid
const GAP = 8; // between the thumb's edge and the tooltip
const GAP_TOUCH = 24; // a fingertip covers more than the thumb, so the tooltip stands further off
const FIGURE = 7.2; // advance of a 12px tabular figure in Geist (letters run narrower)
const DEFAULT_WORD = "Default";

const places = (n: number) => (String(n).split(".")[1] ?? "").length;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** A value rounded to its axis's step and kept inside its range. Never 0.30000000000000004. */
function snap(raw: number, axis: PadAxis) {
  const step = axis.step ?? 1;
  const n = Math.round((raw - axis.min) / step) * step + axis.min;
  return clamp(Number(n.toFixed(Math.max(places(step), places(axis.min)))), axis.min, axis.max);
}

/** Where a value sits along its axis, from 0 at min to 1 at max. */
const fraction = (v: number, axis: PadAxis) => (axis.max > axis.min ? clamp((v - axis.min) / (axis.max - axis.min), 0, 1) : 0);

/** The CSS for a centre that is `f` of the way along an edge, kept `INSET` clear of both ends. No measuring, so it works on the server. */
const along = (f: number) => `calc(${INSET}px + (100% - ${2 * INSET}px) * ${f})`;

/** The pad's width, measured before paint and kept current. 0 until the first measure. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setWidth(Math.floor(el.getBoundingClientRect().width));
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Where the tooltip goes: the first side where it fits whole inside the pad, with the other axis kept inside. If no
 * side fits (a very small pad), the first choice is pushed inside.
 */
function placeTip(cx: number, cy: number, w: number, h: number, width: number, height: number, gap: number, coarse: boolean) {
  const reach = R + gap;
  const fitX = (left: number) => clamp(left, EDGE, Math.max(EDGE, width - w - EDGE));
  const fitY = (top: number) => clamp(top, EDGE, Math.max(EDGE, height - h - EDGE));
  const sides = {
    right: { left: cx + reach, top: fitY(cy - h / 2), fits: cx + reach + w <= width - EDGE },
    left: { left: cx - reach - w, top: fitY(cy - h / 2), fits: cx - reach - w >= EDGE },
    above: { left: fitX(cx - w / 2), top: cy - reach - h, fits: cy - reach - h >= EDGE },
    below: { left: fitX(cx - w / 2), top: cy + reach, fits: cy + reach + h <= height - EDGE },
  };
  const order = coarse ? (["above", "below", "right", "left"] as const) : (["right", "left", "above", "below"] as const);
  const pick = order.find((side) => sides[side].fits) ?? order[0];
  const p = sides[pick];
  return { left: fitX(p.left), top: fitY(p.top) };
}

/* ----------------------------------------------------------------- styles */

/* The well. Forced colors drops box-shadow, so the edge becomes a real border. */
const well =
  "relative w-full touch-none select-none rounded-surface bg-surface-2 " +
  "shadow-[inset_0_0_0_1px_var(--line)] forced-colors:border";

/* The Slider's thumb. The pad never has a hover fill: the well is already --surface-2, so the tooltip is the hover cue. */
const thumb =
  "pointer-events-none absolute block size-5 -translate-x-1/2 -translate-y-1/2 rounded-pill forced-colors:border ";
const thumbOn = "bg-surface-1 shadow-[inset_0_0_0_1px_var(--line-control),var(--highlight)]";
const thumbOff = "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";

/* An axis word sits on a plate in the well's color, so the dots and the crosshairs do not run through the letters. */
const word = "pointer-events-none absolute bg-surface-2 px-1 text-caption font-normal whitespace-nowrap";

/* ----------------------------------------------------------------- the tooltip */

function Tip({
  cx,
  cy,
  width,
  height,
  coarse,
  children,
}: {
  cx: number;
  cy: number;
  width: number;
  height: number;
  coarse: boolean;
  children: ReactNode;
}) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  /* Measured before paint on every render, so a longer phrase is placed with its real width. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && (el.offsetWidth !== size.w || el.offsetHeight !== size.h)) setSize({ w: el.offsetWidth, h: el.offsetHeight });
  });
  const { left, top } = placeTip(cx, cy, size.w, size.h, width, height, coarse ? GAP_TOUCH : GAP, coarse);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute z-10" style={{ left, top }}>
      <motion.div
        ref={ref}
        className="rounded-control bg-surface-3 px-2 py-1.5 text-small whitespace-nowrap text-fg tabular-nums shadow-tooltip inset-shadow-highlight"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1, transition: enter }}
        exit={{ opacity: 0, scale: 0.98, transition: exit }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ----------------------------------------------------------------- Pad */

/** Two values on one surface: a dot grid, a round thumb with crosshairs, and a tooltip that says the value in words. Drag it, tap it, or use the arrow keys. */
export function Pad({
  label,
  help,
  x,
  y,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  defaultMark,
  formatValue,
  height = 192,
  disabled = false,
  className = "",
}: PadProps) {
  const id = useId().replace(/[^\w-]/g, "");
  const labelId = `${id}-label`;
  const helpId = help ? `${id}-help` : undefined;
  const defaultId = defaultMark ? `${id}-default` : undefined;
  const xRangeId = x.minLabel && x.maxLabel ? `${id}-x-range` : undefined;
  const yRangeId = y.minLabel && y.maxLabel ? `${id}-y-range` : undefined;
  const pattern = `${id}-dots`;
  const { coarse } = useDevice();

  /* The pad keeps its own value when you do not control it, because a key needs to read it. */
  const [inner, setInner] = useState<PadValue>(() => defaultValue ?? { x: snap((x.min + x.max) / 2, x), y: snap((y.min + y.max) / 2, y) });
  const value = valueProp ?? inner;
  const say = (v: PadValue) => (formatValue ? formatValue(v) : `${x.label} ${v.x}, ${y.label} ${v.y}`);
  const text = say(value);

  const [boxRef, width] = useWidth();
  const xInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  const [keys, setKeys] = useState(false); // the keyboard has focus, so the ring and the tooltip show
  const [dismissed, setDismissed] = useState(false); // Esc hid the tooltip
  const dragRef = useRef(false);
  const lastRef = useRef<PadValue>(value);

  const move = (next: PadValue) => {
    if (next.x === value.x && next.y === value.y) return false;
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
    return true;
  };

  /* ---- pointer */

  const fromPointer = (e: PointerEvent<HTMLDivElement>): PadValue => {
    const box = e.currentTarget.getBoundingClientRect();
    const fx = clamp((e.clientX - box.left - INSET) / Math.max(1, box.width - 2 * INSET), 0, 1);
    const fy = clamp((box.bottom - INSET - e.clientY) / Math.max(1, box.height - 2 * INSET), 0, 1);
    return { x: snap(x.min + fx * (x.max - x.min), x), y: snap(y.min + fy * (y.max - y.min), y) };
  };

  const drag = (e: PointerEvent<HTMLDivElement>) => {
    const next = fromPointer(e);
    lastRef.current = next;
    move(next);
  };

  const end = () => {
    if (!dragRef.current) return;
    dragRef.current = false;
    setDragging(false);
    onValueCommit?.(lastRef.current);
  };

  /* ---- keyboard */

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "Escape") {
      setDismissed(true);
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const xs = x.step ?? 1;
    const ys = y.step ?? 1;
    const n = e.shiftKey ? 10 : 1;
    let next: PadValue | null = null;
    switch (e.key) {
      case "ArrowLeft":
        next = { x: value.x - n * xs, y: value.y };
        break;
      case "ArrowRight":
        next = { x: value.x + n * xs, y: value.y };
        break;
      case "ArrowDown":
        next = { x: value.x, y: value.y - n * ys };
        break;
      case "ArrowUp":
        next = { x: value.x, y: value.y + n * ys };
        break;
      case "PageDown":
        next = { x: value.x, y: value.y - 10 * ys };
        break;
      case "PageUp":
        next = { x: value.x, y: value.y + 10 * ys };
        break;
      case "Home":
        next = { x: x.min, y: value.y };
        break;
      case "End":
        next = { x: x.max, y: value.y };
        break;
    }
    if (!next) return;
    e.preventDefault();
    setKeys(true);
    setDismissed(false);
    const snapped = { x: snap(next.x, x), y: snap(next.y, y) };
    if (move(snapped)) onValueCommit?.(snapped);
  };

  /* A screen reader's swipe adjusts the input itself, and arrives here. */
  const adjust = (axis: "x" | "y", raw: string) => {
    const next = axis === "x" ? { x: snap(Number(raw), x), y: value.y } : { x: value.x, y: snap(Number(raw), y) };
    if (move(next)) onValueCommit?.(next);
  };

  const onFocus = (e: FocusEvent<HTMLInputElement>) => {
    /* A press focuses the input for the keys that follow, and that is not keyboard focus. */
    if (!dragRef.current) setKeys(e.currentTarget.matches(":focus-visible"));
    setDismissed(false);
  };

  /* ---- what is drawn */

  const px = along(fraction(value.x, x));
  const py = along(1 - fraction(value.y, y));
  const cx = INSET + fraction(value.x, x) * Math.max(0, width - 2 * INSET);
  const cy = INSET + (1 - fraction(value.y, y)) * Math.max(0, height - 2 * INSET);
  const show = !disabled && !dismissed && (dragging || hover || keys);

  /* The default mark's word stands to the right of its circle, or to the left when there is no room. */
  const markFraction = defaultMark ? fraction(defaultMark.x, x) : 0;
  const markX = INSET + markFraction * Math.max(0, width - 2 * INSET);
  const wordLeft = width > 0 && markX + R + 4 + DEFAULT_WORD.length * FIGURE + 8 > width;

  const describedBy = (range?: string) => [labelId, helpId, defaultId, range].filter(Boolean).join(" ");
  const edge = disabled ? "text-fg-disabled" : "text-fg-subtle";
  const cross = disabled ? "border-line" : "border-line-strong";

  const inputs = (axis: "x" | "y") => {
    const a = axis === "x" ? x : y;
    return {
      type: "range" as const,
      min: a.min,
      max: a.max,
      step: a.step ?? 1,
      value: value[axis],
      disabled,
      "aria-label": a.label,
      "aria-describedby": describedBy(axis === "x" ? xRangeId : yRangeId),
      "aria-valuetext": text,
      onChange: (e: ChangeEvent<HTMLInputElement>) => adjust(axis, e.target.value),
      onKeyDown,
      onFocus,
      onBlur: () => setKeys(false),
    };
  };

  return (
    <div className={["grid gap-2", className].join(" ")}>
      <span id={labelId} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} aria-disabled={disabled || undefined}>
        <div
          ref={boxRef}
          data-no-drag=""
          className={well + (disabled ? " cursor-not-allowed" : " cursor-pointer")}
          style={{ height }}
          onMouseDown={(e) => {
            /* Without this the press would blur the input we are about to focus. */
            if (!disabled) e.preventDefault();
          }}
          onPointerDown={(e) => {
            if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = true;
            setDragging(true);
            setKeys(false);
            setDismissed(false);
            drag(e);
            xInput.current?.focus({ preventScroll: true });
          }}
          onPointerMove={(e) => {
            if (dragRef.current) drag(e);
          }}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
          onPointerEnter={(e) => e.pointerType !== "touch" && setHover(true)}
          onPointerLeave={() => setHover(false)}
        >
          {/* The dot grid: a coordinate system, so it is static. */}
          <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 size-full">
            <defs>
              <pattern id={pattern} width={DOT} height={DOT} patternUnits="userSpaceOnUse">
                <circle
                  cx={DOT / 2}
                  cy={DOT / 2}
                  r={0.75}
                  className={disabled ? "fill-[color-mix(in_oklab,var(--fg)_8%,transparent)]" : "fill-[color-mix(in_oklab,var(--fg)_14%,transparent)]"}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${pattern})`} />
          </svg>

          {/* The crosshairs, through the thumb and across the whole pad. */}
          <span aria-hidden="true" className={"pointer-events-none absolute inset-y-0 w-0 border-l border-dashed " + cross} style={{ left: px }} />
          <span aria-hidden="true" className={"pointer-events-none absolute inset-x-0 h-0 border-t border-dashed " + cross} style={{ top: py }} />

          {defaultMark && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2"
              style={{ left: along(markFraction), top: along(1 - fraction(defaultMark.y, y)) }}
            >
              <svg width={20} height={20} viewBox="0 0 20 20" focusable="false" className="block overflow-visible">
                <circle
                  cx={10}
                  cy={10}
                  r={9.5}
                  fill="none"
                  strokeWidth={1}
                  pathLength={24}
                  strokeDasharray="1.5 1.5"
                  className={disabled ? "stroke-fg-disabled" : "stroke-fg-subtle"}
                />
              </svg>
              <span
                className={
                  word + " top-1/2 -translate-y-1/2 " + (wordLeft ? "right-full mr-1 " : "left-full ml-1 ") + edge
                }
              >
                {DEFAULT_WORD}
              </span>
            </span>
          )}

          {/* The four axis words, inside the edges. */}
          {y.maxLabel && (
            <span aria-hidden="true" className={word + " top-1 left-1/2 -translate-x-1/2 " + edge}>
              {y.maxLabel}
            </span>
          )}
          {y.minLabel && (
            <span aria-hidden="true" className={word + " bottom-1 left-1/2 -translate-x-1/2 " + edge}>
              {y.minLabel}
            </span>
          )}
          {x.minLabel && (
            <span aria-hidden="true" className={word + " left-1 top-1/2 -translate-y-1/2 " + edge}>
              {x.minLabel}
            </span>
          )}
          {x.maxLabel && (
            <span aria-hidden="true" className={word + " right-1 top-1/2 -translate-y-1/2 " + edge}>
              {x.maxLabel}
            </span>
          )}

          {/* One input per axis, for the keyboard and screen readers. One tab stop: the x input. */}
          <input ref={xInput} className="sr-only" {...inputs("x")} />
          <input className="sr-only" tabIndex={-1} aria-orientation="vertical" {...inputs("y")} />
          {defaultId && (
            <span id={defaultId} className="sr-only">
              Default: {say(defaultMark!)}
            </span>
          )}
          {xRangeId && (
            <span id={xRangeId} className="sr-only">
              {x.minLabel} to {x.maxLabel}
            </span>
          )}
          {yRangeId && (
            <span id={yRangeId} className="sr-only">
              {y.minLabel} to {y.maxLabel}
            </span>
          )}

          <span
            aria-hidden="true"
            className={
              thumb +
              (disabled ? thumbOff : thumbOn) +
              (keys ? " outline-2 outline-offset-2 outline-focus" : "")
            }
            style={{ left: px, top: py }}
          />

          <AnimatePresence>
            {show && width > 0 && (
              <Tip key="tip" cx={cx} cy={cy} width={width} height={height} coarse={coarse}>
                {text}
              </Tip>
            )}
          </AnimatePresence>
        </div>
      </div>
      {help && (
        <p id={helpId} className="text-small text-fg-subtle">
          {help}
        </p>
      )}
    </div>
  );
}
