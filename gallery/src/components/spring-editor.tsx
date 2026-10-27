/**
 * Spring editor: a spring shaped by hand, as time and bounce (Motion's visualDuration and bounce, Framer's Time and
 * Bounce). It is the Pad with the spring's curve drawn on its floor: the cap's x is the visual time on the curve's
 * own time axis, and its height is the bounce. Drag right and the curve stretches, drag up and it overshoots.
 *
 * - Surface: the Pad's well, the cut (R3): --cut inside the --line-control line with --cut-shade, at the surface
 *   radius. On its floor, inside the same 14px inset the cap keeps, the curve from 0 to 1 in --fg at 1.5px, a
 *   --line-strong baseline and a dashed --line-strong target line, all static chrome. The time axis runs from 0 at
 *   the left to maxTime at the right, so the cap stands on the curve's time axis at the visual time; a dashed
 *   --line-strong line runs down through it, where the curve should look arrived. The curve's height leaves room
 *   for the largest overshoot maxBounce allows. Two words sit inside the corners on plates of the well's floor:
 *   "Bouncier" top left and "Slower" bottom right, at the caption size in --fg-subtle.
 * - Cap: the Pad's round cap, 20px (--cap, --cap-lift); held, --cap-held and --cap-press and it sinks --press-depth.
 *   Never the accent (R6), never a new size.
 * - Tier: pass tier and litt's limits for it are drawn (rules.ts): beyond the visual-time limit and above the bounce
 *   limit the floor is washed with fg at 5%, so the clear corner is where a spring fits. A short plate names each
 *   limit. Under the readout, one row per rule says Fits or Change (the Tag's success and warning words), as the
 *   Playground's rows do.
 * - It says its value (R5): the label row ends with the time and the bounce, and a line under the well says what
 *   they do: "Settles in 420ms and overshoots 3%." The same words are both inputs' aria-valuetext.
 * - Preview: a rail under the well with a 12px dot in --fg and a ghost Play button. The dot crosses on the spring
 *   being edited, so you feel what you drew; it plays by itself when a change is committed, and crosses back the next
 *   time, so it never jumps to a start. It is the one place this component moves, and the spring is the person's
 *   own, not a litt tier, because the preview is the point. Reduced motion lands it at once.
 * - Pointer: a press anywhere moves the cap there and starts a drag; the well captures the pointer, so a drag may
 *   leave it. Values snap to 10ms and 0.01. Double-click goes back to defaultMark. data-no-drag and touch-action
 *   none: the well is the cap's, so the whole well is the target.
 * - Keyboard: the Pad's. Two visually hidden range inputs, Time (in the tab order) and Bounce (tabindex -1, still
 *   reachable by a screen reader). ← → change the time, ↑ ↓ the bounce, Shift makes it 10 steps, Page Up and Page Down
 *   move the bounce by 10 steps, Home and End take the time to its ends.
 * - Disabled: everything lies flat, as the Pad's: the well and its plates --surface-2 with the --line hairline, the
 *   cap --surface-2 with a --line edge, the curve and the words --fg-disabled, no pointer and no tab stop.
 * - Motion: the cap, its line and the curve follow the pointer and the keys at once, with no easing (R4): a curve
 *   that eased would lag the hand that draws it. The sink is at once, and reduced motion sets its depth to 0.
 */
import { useId, useMemo, useRef, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { motion, type Transition } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";
import { overshoot, simulate, type Spring } from "@/motion/spring";
import { LIMITS, springRules, type SpringTier } from "@/motion/rules";
import { Button } from "@/components/button";
import { PlayIcon } from "@/components/icons";
import { Tag } from "@/components/tag";

export type { Spring, SpringTier };

export type SpringEditorProps = {
  /** The label above the editor. Required: it names the group and describes both inputs for screen readers. */
  label: ReactNode;
  /** Help text under the editor, linked to both inputs with aria-describedby. */
  help?: ReactNode;
  /** The spring, when you control it: time in seconds and bounce from 0 to 1. Pair it with onValueChange. */
  value?: Spring;
  /** The spring it starts at when you do not control it. Defaults to litt's expressive spring. */
  defaultValue?: Spring;
  /** Called with the new spring on every move of the cap, by pointer or key. */
  onValueChange?: (value: Spring) => void;
  /** Called with the final spring when a drag is released, or right after a key moves the cap. Use it to save. */
  onValueCommit?: (value: Spring) => void;
  /** The longest visual time, in seconds, at the right edge. The time axis starts at 0. Defaults to 0.8. */
  maxTime?: number;
  /** The most bounce, at the top edge. Defaults to 0.5. */
  maxBounce?: number;
  /** Checks the spring against one of litt's tiers: draws its limits on the floor and says Fits or Change for each rule under the readout. */
  tier?: SpringTier;
  /** Draws a dashed circle marked "Default" at this spring. Double-click the well to go back to it. */
  defaultMark?: Spring;
  /** Shows the rail under the well where a dot crosses on the spring, with a Play button. On by default. */
  preview?: boolean;
  /** Height of the well in px. The width is the container's. */
  height?: number;
  /** Makes the editor unavailable: muted, skipped by Tab, and ignoring the pointer. */
  disabled?: boolean;
  /** Extra classes for the wrapper, such as a width. */
  className?: string;
};

/* ----------------------------------------------------------------- geometry */

const INSET = 14; // the cap's radius, the 2px ring and the 2px offset, as the Pad's
const MIN_TIME = 0.05;
const TIME_STEP = 0.01;
const BOUNCE_STEP = 0.01;
const VIEW = 1000; // the floor's drawing units; the svg stretches them to the inset box
const HEADROOM = 0.08; // air above the largest overshoot, as a fraction of the 0 to 1 travel

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const fixed = (n: number) => Number(n.toFixed(2));
const snapTo = (raw: number, lo: number, hi: number, step: number) => fixed(clamp(Math.round(raw / step) * step, lo, hi));
/** The CSS for a centre `f` of the way along an edge, kept `INSET` clear of both ends. No measuring. */
const along = (f: number) => `calc(${INSET}px + (100% - ${2 * INSET}px) * ${f})`;

const ms = (s: number) => `${Math.round(s * 1000)}ms`;
const num = (v: number) => String(+v.toFixed(2));

/** What a spring does, in words: the settle time and how far it passes the target. */
function describe(spring: Spring) {
  const { pts, settle } = simulate(spring);
  const over = Math.round(Math.max(0, ...pts.map(([, x]) => x - 1)) * 100);
  const settles = `Settles in ${Math.round(settle * 1000)}ms`;
  return { pts, short: `${ms(spring.time)}, bounce ${num(spring.bounce)}`, effect: over ? `${settles} and overshoots ${over}%` : `${settles} with no overshoot` };
}

/* ----------------------------------------------------------------- styles */

const well = "relative w-full touch-none select-none overflow-hidden rounded-surface forced-colors:border ";
const wellOn = "bg-cut shadow-[inset_0_0_0_1px_var(--line-control),var(--cut-shade)]";
const wellOff = "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";
const thumb = "pointer-events-none absolute block size-5 -translate-x-1/2 rounded-pill forced-colors:border ";
const thumbUp = "-translate-y-1/2 bg-cap shadow-(--cap-lift) forced-colors:bg-[Highlight]";
const thumbHeld = "translate-y-[calc(var(--press-depth)-50%)] bg-cap-held shadow-(--cap-press) forced-colors:bg-[Highlight]";
const thumbOff = "-translate-y-1/2 bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";
const word = "pointer-events-none absolute px-1 text-caption font-normal whitespace-nowrap";
const wash = "pointer-events-none absolute bg-[color-mix(in_oklab,var(--fg)_5%,transparent)]";

/* ----------------------------------------------------------------- the preview */

/** A dot that crosses a rail on the spring. `run` flips it to the other end; a new run starts from where it is. */
function Preview({ spring, run, disabled }: { spring: Spring; run: number; disabled?: boolean }) {
  const { reduced } = useMotionDial();
  const still = useTransition("instant");
  const own: Transition = { type: "spring", visualDuration: spring.time, bounce: spring.bounce }; // litt-allow: the preview runs on the spring being edited
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

/* ----------------------------------------------------------------- SpringEditor */

/** A spring drawn by hand: drag the cap right for a slower spring and up for more bounce, and watch its curve and a dot follow. */
export function SpringEditor({
  label,
  help,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  maxTime = 0.8,
  maxBounce = 0.5,
  tier,
  defaultMark,
  preview = true,
  height = 160,
  disabled = false,
  className = "",
}: SpringEditorProps) {
  const id = useId().replace(/[^\w-]/g, "");
  const labelId = `${id}-label`;
  const helpId = help ? `${id}-help` : undefined;
  const effectId = `${id}-effect`;
  const defaultId = defaultMark ? `${id}-default` : undefined;

  const { dial } = useMotionDial();
  const [inner, setInner] = useState<Spring>(() => defaultValue ?? dial.expressive);
  const value = valueProp ?? inner;
  const { pts, short, effect } = useMemo(() => describe(value), [value]);
  const say = `${short}. ${effect}.`;

  const timeInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [keys, setKeys] = useState(false);
  const [run, setRun] = useState(0);
  const dragRef = useRef(false);
  const lastRef = useRef<Spring>(value);

  const move = (next: Spring) => {
    if (next.time === value.time && next.bounce === value.bounce) return false;
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
    return true;
  };
  const commit = (next: Spring) => {
    onValueCommit?.(next);
    if (preview) setRun((r) => r + 1);
  };
  const shape = (time: number, bounce: number): Spring => ({
    time: snapTo(time, MIN_TIME, maxTime, TIME_STEP),
    bounce: snapTo(bounce, 0, maxBounce, BOUNCE_STEP),
  });

  /* ---- pointer */

  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const fx = clamp((e.clientX - box.left - INSET) / Math.max(1, box.width - 2 * INSET), 0, 1);
    const fy = clamp((box.bottom - INSET - e.clientY) / Math.max(1, box.height - 2 * INSET), 0, 1);
    return shape(fx * maxTime, fy * maxBounce);
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
    commit(lastRef.current);
  };

  /* ---- keyboard */

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
    const n = e.shiftKey ? 10 : 1;
    const { time, bounce } = value;
    let next: Spring | null = null;
    switch (e.key) {
      case "ArrowLeft":
        next = shape(time - n * TIME_STEP, bounce);
        break;
      case "ArrowRight":
        next = shape(time + n * TIME_STEP, bounce);
        break;
      case "ArrowDown":
        next = shape(time, bounce - n * BOUNCE_STEP);
        break;
      case "ArrowUp":
        next = shape(time, bounce + n * BOUNCE_STEP);
        break;
      case "PageDown":
        next = shape(time, bounce - 10 * BOUNCE_STEP);
        break;
      case "PageUp":
        next = shape(time, bounce + 10 * BOUNCE_STEP);
        break;
      case "Home":
        next = shape(MIN_TIME, bounce);
        break;
      case "End":
        next = shape(maxTime, bounce);
        break;
    }
    if (!next) return;
    e.preventDefault();
    setKeys(true);
    if (move(next)) commit(next);
  };

  const adjust = (axis: "time" | "bounce", raw: string) => {
    const next = axis === "time" ? shape(Number(raw), value.bounce) : shape(value.time, Number(raw));
    if (move(next)) commit(next);
  };

  const onFocus = (e: FocusEvent<HTMLInputElement>) => {
    if (!dragRef.current) setKeys(e.currentTarget.matches(":focus-visible"));
  };

  /* ---- what is drawn */

  /* The curve's height leaves room for the most overshoot maxBounce allows. Overshoot follows the bounce alone. */
  const top = useMemo(() => 1 + overshoot({ time: 0.3, bounce: maxBounce }) + HEADROOM, [maxBounce]);
  const toY = (x: number) => (VIEW * (1 - x / top)).toFixed(1);
  const d = pts
    .filter(([t], i) => t <= maxTime || i === 0)
    .map(([t, x], i) => `${i ? "L" : "M"}${((t / maxTime) * VIEW).toFixed(1)} ${toY(x)}`)
    .join("");
  const fx = value.time / maxTime;
  const fy = value.bounce / maxBounce;

  /* The tier's limits, as fractions of each axis. A limit past the edge is not drawn. */
  const limitX = tier ? LIMITS.springMs / 1000 / maxTime : 1;
  const limitY = tier ? (tier === "responsive" ? 0 : LIMITS.bounce / maxBounce) : 1;
  const rules = tier ? springRules(value, tier) : [];

  const describedBy = [labelId, helpId, effectId, defaultId].filter(Boolean).join(" ");
  const plate = disabled ? "bg-surface-2 text-fg-disabled" : "bg-cut text-fg-subtle";
  const ink = disabled ? "stroke-fg-disabled" : "stroke-fg";
  const chrome = disabled ? "stroke-line" : "stroke-line-strong";

  const inputs = (axis: "time" | "bounce") => ({
    type: "range" as const,
    min: axis === "time" ? MIN_TIME : 0,
    max: axis === "time" ? maxTime : maxBounce,
    step: axis === "time" ? TIME_STEP : BOUNCE_STEP,
    value: value[axis],
    disabled,
    "aria-label": axis === "time" ? "Time" : "Bounce",
    "aria-describedby": describedBy,
    "aria-valuetext": say,
    onChange: (e: ChangeEvent<HTMLInputElement>) => adjust(axis, e.target.value),
    onKeyDown,
    onFocus,
    onBlur: () => setKeys(false),
  });

  return (
    <div className={["grid gap-2", className].join(" ")}>
      <div className="flex items-baseline justify-between gap-4">
        <span id={labelId} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
          {label}
        </span>
        <span aria-hidden="true" className={"text-small tabular-nums " + (disabled ? "text-fg-subtle" : dragging ? "text-fg" : "text-fg-muted")}>
          {short}
        </span>
      </div>
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
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = true;
            setDragging(true);
            setKeys(false);
            drag(e);
            timeInput.current?.focus({ preventScroll: true });
          }}
          onPointerMove={(e) => {
            if (dragRef.current) drag(e);
          }}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
          onDoubleClick={() => {
            if (disabled || !defaultMark) return;
            if (move(defaultMark)) commit(defaultMark);
          }}
        >
          {tier && limitX < 1 && (
            <span aria-hidden="true" className={wash + " inset-y-0 right-0"} style={{ left: along(limitX) }} />
          )}
          {tier && limitY < 1 && (
            <span
              aria-hidden="true"
              className={wash + " top-0 left-0"}
              style={{ right: limitX < 1 ? `calc(100% - ${along(limitX)})` : 0, bottom: `calc(${INSET}px + (100% - ${2 * INSET}px) * ${limitY} + ${limitY === 0 ? 4 : 0}px)` }}
            />
          )}

          {/* The floor: a baseline, the target, the curve. Static chrome, stretched to the inset box. */}
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox={`0 0 ${VIEW} ${VIEW}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute overflow-visible"
            style={{ left: INSET, top: INSET, width: `calc(100% - ${2 * INSET}px)`, height: `calc(100% - ${2 * INSET}px)` }}
          >
            <path d={`M0 ${VIEW}H${VIEW}`} className={chrome} strokeWidth={1} vectorEffect="non-scaling-stroke" fill="none" />
            <path d={`M0 ${toY(1)}H${VIEW}`} className={chrome} strokeWidth={1} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" fill="none" />
            <path d={d} className={ink} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" fill="none" />
          </svg>

          {/* Down through the cap: where the curve should look arrived. */}
          <span
            aria-hidden="true"
            className={"pointer-events-none absolute inset-y-0 w-0 border-l border-dashed " + (disabled ? "border-line" : "border-line-strong")}
            style={{ left: along(fx) }}
          />

          {tier && limitX < 1 && (
            <span aria-hidden="true" className={word + " top-1 ml-1 " + plate} style={{ left: along(limitX) }}>
              {LIMITS.springMs}ms
            </span>
          )}
          {tier === "expressive" && limitY < 1 && (
            <span
              aria-hidden="true"
              className={word + " right-1 translate-y-1/2 " + plate}
              style={{ bottom: `calc(${INSET}px + (100% - ${2 * INSET}px) * ${limitY})` }}
            >
              {num(LIMITS.bounce)}
            </span>
          )}

          {defaultMark && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2"
              style={{ left: along(defaultMark.time / maxTime), top: along(1 - defaultMark.bounce / maxBounce) }}
            >
              <svg width={20} height={20} viewBox="0 0 20 20" focusable="false" className="block overflow-visible">
                <circle cx={10} cy={10} r={9.5} fill="none" strokeWidth={1} pathLength={24} strokeDasharray="1.5 1.5" className={disabled ? "stroke-fg-disabled" : "stroke-fg-subtle"} />
              </svg>
            </span>
          )}

          <span aria-hidden="true" className={word + " top-1 left-1 " + plate}>
            Bouncier
          </span>
          <span aria-hidden="true" className={word + " right-1 bottom-1 " + plate}>
            Slower
          </span>

          <input ref={timeInput} className="sr-only" {...inputs("time")} />
          <input className="sr-only" tabIndex={-1} aria-orientation="vertical" {...inputs("bounce")} />
          {defaultId && (
            <span id={defaultId} className="sr-only">
              Default: {ms(defaultMark!.time)}, bounce {num(defaultMark!.bounce)}. Double-click to go back to it.
            </span>
          )}

          <span
            aria-hidden="true"
            className={thumb + (disabled ? thumbOff : dragging ? thumbHeld : thumbUp) + (keys ? " outline-2 outline-offset-2 outline-focus" : "")}
            style={{ left: along(fx), top: along(1 - fy) }}
          />
        </div>
      </div>

      <p id={effectId} className={"text-small " + (disabled ? "text-fg-disabled" : "text-fg-muted")}>
        {effect}.
      </p>

      {preview && (
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" icon={<PlayIcon />} disabled={disabled} onClick={() => setRun((r) => r + 1)} className="-ml-3">
            Play
          </Button>
          <Preview spring={value} run={run} disabled={disabled} />
        </div>
      )}

      {rules.length > 0 && (
        <ul className="grid gap-2" aria-label={`Against the ${tier} tier`}>
          {rules.map((r) => (
            <li key={r.text} className="flex items-start gap-2 text-small">
              <Tag status={r.ok ? "success" : "warning"}>{r.ok ? "Fits" : "Change"}</Tag>
              <span className={"pt-0.5 " + (r.ok ? "text-fg-subtle" : "text-fg-muted")}>{r.text}</span>
            </li>
          ))}
        </ul>
      )}

      {help && (
        <p id={helpId} className="text-small text-fg-subtle">
          {help}
        </p>
      )}
    </div>
  );
}
