/**
 * Gauge: one value against a range, on a semicircle of fine ticks, with the figure in the opening. A sibling of
 * the Meter in chart.tsx for a place where the number is the point: credits left, storage used.
 *
 * - Marks: `ticks` radial ticks (48 by default) spread over 180 degrees, each 2px wide with square ends. The ticks
 *   up to the value are the hue's mark tone, or `--fg` without a hue (the quiet default); the rest are `--fg` at
 *   12%. The last filled tick marks the value: it reaches 4px further out and takes the hue's -text tone (or
 *   `--fg`), which is what a needle would have done. No needle, no glow, no gradient (R2, R7).
 * - Opening: the label above (caption size, fg-subtle, sentence case), the figure (the sans at the h2 size, fg,
 *   tabular numbers) and an optional caption below, centered at the foot of the arc. It is HTML over the SVG, so
 *   the text stays crisp whatever the SVG scales to.
 * - Size: `size` is the width in px. The SVG keeps a viewBox of that width, so ticks keep their 2px at the
 *   natural size and the whole drawing scales down to fit a narrower container. It never exceeds its container.
 *   The tick length follows the size. Under about 200px there is room for a short label and the figure, not a caption.
 * - Color: a hue is one meaning (R7): here, the quantity itself. Without one the gauge is foreground only.
 * - Ramp (`ramp`, v1.20): the lit ticks walk the world's sequential ramp along the arc, so how far round says how much
 *   twice: each tick takes its place on the arc read off the ramp's four steps, blended in OKLab between the two it
 *   falls between, the start of the arc in the first step and the end in the fourth, and the marking tick its own
 *   place's color. Only Flat sets a ramp (its sunset, plum to gold in dark and gold to plum in light); in a world
 *   without one the ticks keep the hue, or the foreground, exactly as without `ramp`. The first step stands about
 *   2:1 off the ground, so the figure in the opening (and the meter's value text) says the value, not the color.
 * - Semantics: role="meter" with the label as its name, a min, a max, a now and the value text; the caption is its
 *   description. The ticks and the text over them are hidden from assistive tech, so nothing is read twice.
 * - Motion: none. Static, like the Meter: no entrance, no hover, no focus stop. A value that changes just changes.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): the lit ticks sweep up to the value on arrival
 *   and to each new value, on the grow spring, so the marking tick runs a tick or two past and settles back like a
 *   needle with weight; the figure counts with the sweep and never shows more than the value. Still ticks lighting up:
 *   no needle, no glow. At rest it is the static Gauge exactly; reduced motion turns it off.
 */
import { useId, useState } from "react";
import { useMotionValueEvent } from "motion/react";
import { byWorld, countText, useFun, useFunValue, useMaterial } from "@/motion";

/** The data hues, in their fixed order (R7): the five, then slots six to eight, Flat's own (elsewhere its teal, rose and amber). */
export type GaugeHue = "blue" | "amber" | "teal" | "violet" | "rose" | "sky" | "bubblegum" | "sun";

/** The mark tone fills the ticks up to the value. The -text tone is the stronger one that marks the value itself. */
const HUE: Record<GaugeHue, { mark: string; value: string }> = {
  blue: { mark: "stroke-data-blue", value: "stroke-data-blue-text" },
  amber: { mark: "stroke-data-amber", value: "stroke-data-amber-text" },
  teal: { mark: "stroke-data-teal", value: "stroke-data-teal-text" },
  violet: { mark: "stroke-data-violet", value: "stroke-data-violet-text" },
  rose: { mark: "stroke-data-rose", value: "stroke-data-rose-text" },
  sky: { mark: "stroke-data-sky", value: "stroke-data-sky-text" },
  bubblegum: { mark: "stroke-data-bubblegum", value: "stroke-data-bubblegum-text" },
  sun: { mark: "stroke-data-sun", value: "stroke-data-sun-text" },
};
const QUIET = { mark: "stroke-fg", value: "stroke-fg" };
/** With `ramp`, under Flat: tick `i` of `count` takes its place on the arc read off the ramp's four steps (v1.20), the
    two steps it falls between mixed in OKLab. Every other world has no ramp, so `ramp` there keeps the hue. */
type Ramp = (i: number, count: number) => string;
/* Each name whole in a string, so the registry renames it. */
const SEQ = ["var(--data-seq-1)", "var(--data-seq-2)", "var(--data-seq-3)", "var(--data-seq-4)"] as const;
const RAMP: Ramp = (i, count) => {
  const t = (i / Math.max(1, count - 1)) * 3;
  const k = Math.min(2, Math.floor(t));
  const u = Math.round((t - k) * 100);
  return `color-mix(in oklab, ${SEQ[k + 1]} ${u}%, ${SEQ[k]})`;
};
const REST = "stroke-[color-mix(in_oklab,var(--fg)_12%,transparent)]";

const TICK = 2; // tick width in px
const EDGE = 6; // room between the arc and the box: the marker reaches 4px past the arc, and a tick has half its width
const REACH = 4; // how much further out the marker tick reaches
const OPENING_GAP = 8; // air between the inner ends of the ticks and the text

export type GaugeProps = {
  /** What is measured: "Credits left". It names the meter for assistive tech and sits above the figure. */
  label: string;
  /** The value, from `min` to `max`. A value outside the range is clamped. */
  value: number;
  /** The value at the start of the arc. */
  min?: number;
  /** The value at the end of the arc. */
  max?: number;
  /** The reading in words, which the meter announces: "20,830 credits" or "42 of 100 GB". It is also the figure unless you pass one. */
  valueText: string;
  /** The big figure when it should read shorter than the value text, such as "42 GB" for "42 of 100 GB". */
  figure?: string;
  /** A line under the figure in fg-subtle, such as "2k a day on average". It describes the meter. Leave it out under about 200px. */
  caption?: string;
  /** Colors the ticks up to the value with one of the data hues. Leave it out for the quiet foreground default. `sky`, `bubblegum` and `sun` are Flat's slots six to eight; elsewhere its teal, rose and amber. */
  hue?: GaugeHue;
  /** Lets the lit ticks walk the world's sequential ramp along the arc, deeper toward the end, so the arc reads as a heat scale. Only Flat has a ramp (its sunset); in a world without one the ticks keep `hue` (or the foreground), as if it were off. Off by default. */
  ramp?: boolean;
  /** The width in px. The gauge scales down to fit a narrower container and never exceeds it. */
  size?: number;
  /** How many ticks make up the arc. */
  ticks?: number;
  /** Extra classes for the gauge, such as a margin. */
  className?: string;
};

const round = (n: number) => Math.round(n * 100) / 100;

/** One semicircle of fine ticks with the figure in its opening. Static: it never animates. */
export function Gauge({ label, value, min = 0, max = 100, valueText, figure, caption, hue, ramp = false, size = 240, ticks = 48, className = "" }: GaugeProps) {
  const captionId = useId();
  const count = Math.max(2, Math.round(ticks));
  const span = max - min;
  const share = span > 0 ? Math.max(0, Math.min(1, (value - min) / span)) : 0;
  /* A value above the start always shows at least one tick; the last filled tick is the one that marks it. */
  const filled = share <= 0 ? 0 : Math.max(1, Math.round(share * count));
  const now = span > 0 ? Math.max(min, Math.min(max, value)) : min;

  /* Fun mode: the ticks drawn while the sweep moves, and the figure counting with it. Off or still, the value's own. */
  const fun = useFun();
  const sweep = useFunValue(filled, { count: value });
  /* The ticks follow the sweep through its overshoot and settle, after the figure has stopped counting. */
  const [swept, setSwept] = useState(filled);
  useMotionValueEvent(sweep.value, "change", (t) => setSwept(Math.max(0, Math.min(count, Math.round(t)))));
  const lit = fun && sweep.moving ? swept : filled;
  const shownFigure = fun ? countText(figure ?? valueText, value, sweep.shown) : (figure ?? valueText);

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
  const worldRamp = byWorld<Ramp | null>(useMaterial(), { press: null, flat: RAMP });
  const steps = ramp ? worldRamp : null;
  /* The opening: the text keeps clear of the inner ends of the ticks. A share of the width, so it scales with the SVG. */
  const pad = `${round(((EDGE + length + OPENING_GAP) / size) * 100)}%`;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={now}
      aria-valuetext={valueText}
      aria-describedby={caption ? captionId : undefined}
      className={"relative w-full " + className}
      style={{ maxWidth: size }}
    >
      <svg viewBox={`0 0 ${size} ${Math.ceil(half) + 1}`} width={size} height={Math.ceil(half) + 1} aria-hidden="true" focusable="false" className="block h-auto w-full">
        <g fill="none" strokeWidth={TICK} strokeLinecap="butt">
          <path d={run(lit, count)} className={REST} />
          {lit > 1 && !steps && <path d={run(0, lit - 1)} className={tone.mark} />}
          {lit > 1 && steps && Array.from({ length: lit - 1 }, (_, i) => <path key={i} d={tick(i, inner, outer)} style={{ stroke: steps(i, count) }} />)}
          {lit > 0 &&
            (steps ? (
              <path d={tick(lit - 1, inner, outer + REACH)} style={{ stroke: steps(lit - 1, count) }} />
            ) : (
              <path d={tick(lit - 1, inner, outer + REACH)} className={tone.value} />
            ))}
        </g>
      </svg>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 text-center" style={{ paddingInline: pad }}>
        <span className="text-caption text-fg-subtle litt-legend">{label}</span>
        <span className="text-h2 tabular-nums text-fg">{shownFigure}</span>
        {caption && (
          <span id={captionId} className="text-caption font-normal text-fg-subtle">
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}
