/**
 * Meter · fun mode. At rest it is the Meter (chart.tsx) to the pixel: the label and the mono reading, a 4px rail at
 * the control radius on fg 12%, the target as a neutral tick, or steps.
 *
 * - The fill is full width and slides in from the start (translateX inside the track, which clips it), so its rounded
 *   end never squashes the way a scaleX would.
 * - The reading counts with the fill and stops at the value: the fill may overshoot by a hair, the number never does.
 * - Passing the target is the milestone: the tick pops once as the fill goes by.
 * - Steps light one after another, each popping into place.
 * - A new value springs from wherever the fill is, so pressing again mid-flight keeps its momentum.
 */
import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { useFun } from "./motion";

export type FunHue = "blue" | "amber" | "teal" | "violet" | "rose";
const FILL: Record<FunHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};
const TRACK = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]";

export type FunMeterProps = {
  label: string;
  value: number;
  max: number;
  /** The reading for a value: (n) => "1,380 of 3,000". Called with the counting value as it grows. */
  reading: (n: number) => string;
  hue?: FunHue;
  target?: number;
  targetText?: string;
  steps?: number;
  /** Change it to play the arrival again. */
  play: number;
  /** Seconds to wait before arriving, so meters in a group follow one another. */
  delay?: number;
};

export function FunMeter({ label, value, max, reading, hue, target, targetText, steps, play, delay = 0 }: FunMeterProps) {
  const id = useId();
  const fun = useFun();
  const share = (v: number) => (max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0);
  const percent = share(value);
  const aim = target === undefined ? null : share(target);
  const fill = hue ? FILL[hue] : "bg-fg";

  /* The fill's reach in percent of the rail, and where the current count runs between. */
  const reach = useMotionValue(percent);
  const span = useRef({ from: value, to: value });
  const [shown, setShown] = useState(value);
  const tick = useMotionValue(1);
  const x = useTransform(reach, (r) => `${r - 100}%`);
  /* While it moves, the fill slides (a transform, cheap and exact at any zoom). Settled, it is sized by width, the
     Meter's own markup, so the rest frame matches it to the pixel. */
  const [moving, setMoving] = useState(false);
  useMotionValueEvent(reach, "animationStart", () => setMoving(true));
  useMotionValueEvent(reach, "animationComplete", () => setMoving(false));
  useMotionValueEvent(reach, "animationCancel", () => setMoving(false));

  /* How far the count has come, 0 to 1. It only grows, so the settle after an overshoot never takes a count back. */
  const came = useRef(1);
  useMotionValueEvent(reach, "change", (r) => {
    const { from, to } = span.current;
    const at = (r / 100) * max;
    const p = to === from ? 1 : (at - from) / (to - from);
    came.current = Math.max(came.current, Math.max(0, Math.min(1, p)));
    /* Between where it started and where it is going: honest in both directions. */
    setShown(Math.round(from + (to - from) * came.current));
  });
  /* The target tick pops once, the moment the fill passes it going up. */
  const last = useRef(percent);
  useMotionValueEvent(reach, "change", (r) => {
    if (aim !== null && last.current < aim && r >= aim && !fun.reduced) {
      tick.set(1.8);
      animate(tick, 1, fun.pop);
    }
    last.current = r;
  });

  /* Arrival: from nothing, after the group's delay. Skipped on the first render, which is the rest frame. */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) return;
    span.current = { from: 0, to: value };
    came.current = 0;
    reach.set(0);
    last.current = 0;
    setShown(0);
    const run = animate(reach, percent, { ...fun.grow, delay: fun.reduced ? 0 : delay });
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new `play` replays the arrival
  }, [play]);

  /* A new value: from wherever the fill is now, keeping its velocity. */
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    span.current = { from: shown, to: value };
    came.current = 0;
    const run = animate(reach, percent, fun.grow);
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- follows the value only
  }, [value]);

  const count = steps && steps > 1 ? Math.round(steps) : 0;
  const filled = Math.round((percent / 100) * count);
  const spoken = `${reading(value)}${aim === null ? "" : `, ${targetText ?? `target ${Math.round(aim)}%`}`}`;

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span id={id} className="text-small text-fg">
          {label}
        </span>
        <span aria-hidden="true" className="font-mono text-caption font-normal tabular-nums text-fg-subtle">
          {/* Steps say their count at once; their segments do the counting. */}
          {reading(count ? value : shown)}
        </span>
      </div>
      <div className="relative">
        <div
          role="meter"
          aria-labelledby={id}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={spoken}
          className={count ? "flex h-1 gap-0.5" : "h-1 overflow-hidden rounded-control " + TRACK}
        >
          {count ? (
            Array.from({ length: count }, (_, i) => (
              <div key={i} className={"relative h-full flex-1 rounded-control " + TRACK}>
                {i < filled && (
                  <motion.div
                    key={play}
                    className={"absolute inset-0 rounded-control " + fill}
                    initial={play === 0 || fun.reduced ? false : { opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...fun.pop, delay: delay + i * 0.09 }} // litt-allow: fun mode, steps light in turn
                  />
                )}
              </div>
            ))
          ) : (
            moving ? (
              <motion.div className={"h-full w-full rounded-control " + fill} style={{ x }} />
            ) : (
              <div className={"h-full rounded-control " + fill} style={{ width: `${percent}%` }} />
            )
          )}
        </div>
        {aim !== null && (
          <motion.span
            aria-hidden="true"
            className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-fg-subtle"
            style={{ left: `${aim}%`, scale: tick }}
          />
        )}
      </div>
    </div>
  );
}
