/**
 * Gauge · fun mode. At rest it is the Gauge (gauge.tsx) to the pixel: 48 radial ticks over 180 degrees, the filled ones
 * in the hue's mark tone, the last one reaching 4px further in the -text tone, the figure in the opening.
 *
 * - The lit ticks sweep up to the value on the grow spring, so the marker tick runs a tick or two past and settles back,
 *   like a needle with weight. It is still ticks lighting up: no needle, no glow.
 * - The figure counts with the sweep and stops at the value.
 * - A new value sweeps from where the marker is, either way.
 */
import { useEffect, useId, useRef, useState } from "react";
import { animate, useMotionValue, useMotionValueEvent } from "motion/react";
import { useFun } from "./motion";
import type { FunHue } from "./meter";

const HUE: Record<FunHue, { mark: string; value: string }> = {
  blue: { mark: "stroke-data-blue", value: "stroke-data-blue-text" },
  amber: { mark: "stroke-data-amber", value: "stroke-data-amber-text" },
  teal: { mark: "stroke-data-teal", value: "stroke-data-teal-text" },
  violet: { mark: "stroke-data-violet", value: "stroke-data-violet-text" },
  rose: { mark: "stroke-data-rose", value: "stroke-data-rose-text" },
};
const QUIET = { mark: "stroke-fg", value: "stroke-fg" };
const REST = "stroke-[color-mix(in_oklab,var(--fg)_12%,transparent)]";
const TICK = 2;
const EDGE = 6;
const REACH = 4;
const OPENING_GAP = 8;
const round = (n: number) => Math.round(n * 100) / 100;

export type FunGaugeProps = {
  label: string;
  value: number;
  max: number;
  /** The figure for a value, as it counts: (n) => "6,120". */
  figure: (n: number) => string;
  /** What a screen reader hears for the value: "6,120 of 10,000 credits left". */
  valueText: string;
  caption?: string;
  hue?: FunHue;
  size?: number;
  ticks?: number;
  play: number;
};

export function FunGauge({ label, value, max, figure, valueText, caption, hue, size = 240, ticks = 48, play }: FunGaugeProps) {
  const captionId = useId();
  const fun = useFun();
  const count = Math.max(2, Math.round(ticks));
  const share = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const filled = share <= 0 ? 0 : Math.max(1, Math.round(share * count));

  /* The sweep, in ticks. Lit is what is drawn; it may run past `filled` by a tick or two on the overshoot. */
  const sweep = useMotionValue(filled);
  const [lit, setLit] = useState(filled);
  const span = useRef({ from: value, to: value, fromTicks: filled, toTicks: filled });
  const [shown, setShown] = useState(value);
  /* How far the figure has come, 0 to 1. It only grows, so the settle after an overshoot never takes a count back. */
  const came = useRef(1);
  useMotionValueEvent(sweep, "change", (t) => {
    setLit(Math.max(0, Math.min(count, Math.round(t))));
    const { from, to, fromTicks, toTicks } = span.current;
    const p = toTicks === fromTicks ? 1 : (t - fromTicks) / (toTicks - fromTicks);
    came.current = Math.max(came.current, Math.min(1, p));
    /* The figure follows the sweep and never passes the value it is heading for. */
    setShown(Math.round(from + (to - from) * came.current));
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current) return;
    span.current = { from: 0, to: value, fromTicks: 0, toTicks: filled };
    came.current = 0;
    sweep.set(0);
    const run = animate(sweep, filled, fun.grow);
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new `play` replays the arrival
  }, [play]);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    span.current = { from: shown, to: value, fromTicks: sweep.get(), toTicks: filled };
    came.current = 0;
    const run = animate(sweep, filled, fun.grow);
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- follows the value only
  }, [value]);

  const half = size / 2;
  const outer = half - EDGE;
  const length = Math.max(8, Math.round(size / 16));
  const inner = outer - length;
  const tick = (i: number, from: number, to: number) => {
    const angle = Math.PI * (1 - i / (count - 1));
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return `M${round(half + from * cos)} ${round(half - from * sin)}L${round(half + to * cos)} ${round(half - to * sin)}`;
  };
  const run = (from: number, to: number) => {
    let d = "";
    for (let i = from; i < to; i++) d += tick(i, inner, outer);
    return d;
  };
  const tone = hue ? HUE[hue] : QUIET;
  const pad = `${round(((EDGE + length + OPENING_GAP) / size) * 100)}%`;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      aria-describedby={caption ? captionId : undefined}
      className="relative w-full"
      style={{ maxWidth: size }}
    >
      <svg viewBox={`0 0 ${size} ${Math.ceil(half) + 1}`} width={size} height={Math.ceil(half) + 1} aria-hidden="true" focusable="false" className="block h-auto w-full">
        <g fill="none" strokeWidth={TICK} strokeLinecap="butt">
          <path d={run(lit, count)} className={REST} />
          {lit > 1 && <path d={run(0, lit - 1)} className={tone.mark} />}
          {lit > 0 && <path d={tick(lit - 1, inner, outer + REACH)} className={tone.value} />}
        </g>
      </svg>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 text-center" style={{ paddingInline: pad }}>
        <span className="text-caption text-fg-subtle">{label}</span>
        <span className="text-h2 tabular-nums text-fg">{figure(shown)}</span>
        {caption && (
          <span id={captionId} className="text-caption font-normal text-fg-subtle">
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}
