/**
 * Gauge: one value against a range, on a semicircle of fine ticks, with the figure in the opening. A sibling of
 * the Meter in chart.tsx for a place where the number is the point: credits left, storage used.
 *
 * - Marks: `ticks` radial ticks (48 by default) spread over 180 degrees, each 2px wide with square ends. The ticks
 *   up to the value are the hue's mark tone, or `--fg` without a hue (the quiet default); the rest are `--fg` at
 *   12%. The last filled tick marks the value: it reaches 4px further out and takes the hue's -text tone (or
 *   `--fg`), which is what a needle would have done. No needle, no glow, no gradient (P5, P11).
 * - Opening: the label above (caption size, fg-subtle, sentence case), the figure (the sans at the h2 size, fg,
 *   tabular numbers) and an optional caption below, centered at the foot of the arc. It is HTML over the SVG, so
 *   the text stays crisp whatever the SVG scales to.
 * - Size: `size` is the width in px. The SVG keeps a viewBox of that width, so ticks keep their 2px at the
 *   natural size and the whole drawing scales down to fit a narrower container. It never exceeds its container.
 *   The tick length follows the size. Under about 200px there is room for a short label and the figure, not a caption.
 * - Color: a hue is one meaning (P11): here, the quantity itself. Without one the gauge is foreground only.
 * - Semantics: role="meter" with the label as its name, a min, a max, a now and the value text; the caption is its
 *   description. The ticks and the text over them are hidden from assistive tech, so nothing is read twice.
 * - Motion: none. Static, like the Meter: no entrance, no hover, no focus stop. A value that changes just changes.
 */
import { useId } from "react";

/** The five data hues, in their fixed order (P11). */
export type GaugeHue = "blue" | "amber" | "teal" | "violet" | "rose";

/** The mark tone fills the ticks up to the value. The -text tone is the stronger one that marks the value itself. */
const HUE: Record<GaugeHue, { mark: string; value: string }> = {
  blue: { mark: "stroke-data-blue", value: "stroke-data-blue-text" },
  amber: { mark: "stroke-data-amber", value: "stroke-data-amber-text" },
  teal: { mark: "stroke-data-teal", value: "stroke-data-teal-text" },
  violet: { mark: "stroke-data-violet", value: "stroke-data-violet-text" },
  rose: { mark: "stroke-data-rose", value: "stroke-data-rose-text" },
};
const QUIET = { mark: "stroke-fg", value: "stroke-fg" };
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
  /** Colors the ticks up to the value with one of the five data hues. Leave it out for the quiet foreground default. */
  hue?: GaugeHue;
  /** The width in px. The gauge scales down to fit a narrower container and never exceeds it. */
  size?: number;
  /** How many ticks make up the arc. */
  ticks?: number;
  /** Extra classes for the gauge, such as a margin. */
  className?: string;
};

const round = (n: number) => Math.round(n * 100) / 100;

/** One semicircle of fine ticks with the figure in its opening. Static: it never animates. */
export function Gauge({ label, value, min = 0, max = 100, valueText, figure, caption, hue, size = 240, ticks = 48, className = "" }: GaugeProps) {
  const captionId = useId();
  const count = Math.max(2, Math.round(ticks));
  const span = max - min;
  const share = span > 0 ? Math.max(0, Math.min(1, (value - min) / span)) : 0;
  /* A value above the start always shows at least one tick; the last filled tick is the one that marks it. */
  const filled = share <= 0 ? 0 : Math.max(1, Math.round(share * count));
  const now = span > 0 ? Math.max(min, Math.min(max, value)) : min;

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
          <path d={run(filled, count)} className={REST} />
          {filled > 1 && <path d={run(0, filled - 1)} className={tone.mark} />}
          {filled > 0 && <path d={tick(filled - 1, inner, outer + REACH)} className={tone.value} />}
        </g>
      </svg>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 text-center" style={{ paddingInline: pad }}>
        <span className="text-caption text-fg-subtle">{label}</span>
        <span className="text-h2 tabular-nums text-fg">{figure ?? valueText}</span>
        {caption && (
          <span id={captionId} className="text-caption font-normal text-fg-subtle">
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}
