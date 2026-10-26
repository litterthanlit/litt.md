/**
 * Sparkline: a trend in one thin line, with no axes, no gridlines and no labels. It sits beside a figure (a Stat's
 * `trend` slot) or in a table row, and shows shape, not values: put the exact figure next to it. A sibling of the
 * LineChart and the Meter, drawn the way the Meter is (R7: a hue is a thread through neutral space).
 *
 * - Marks: a 2px line with round joins and caps, and a dot on the latest point so today is the strongest mark, as in
 *   the Chart. The dot is 4px in radius (8px across) on a 2px ring in the surface color, so it reads on a busy row and
 *   the line does not run into it. No area fill, no gradient, no glow (R2).
 * - Color: the line is the quiet foreground by default (`--fg` at 55%) and the dot is `--fg`. With a `hue` the line is
 *   the hue's mark tone (3:1 on every surface) and the dot its `-text` tone, a step stronger. One hue means one
 *   quantity (R7); keep it the same wherever that quantity is drawn.
 * - Scale: by default each sparkline fits its own values, with 2px of air above and below the line. Pass `min` and
 *   `max` to fix the scale, so the sparklines in a column compare. A value outside a fixed scale is held at its edge.
 *   A flat series (or a single value) sits in the middle. `baseline` is a reference value (a goal, last month's
 *   average) drawn as a 1px dashed `--line-strong` line across the full width; the default scale includes it, so it
 *   is always in the box.
 * - Drawn at the container's width, measured with a ResizeObserver (as the Chart is), so the 2px line and the dot stay
 *   crisp and round: nothing is scaled and `preserveAspectRatio` never stretches it. Before the first measure (and on
 *   the server) it renders an empty box of the final height, so nothing jumps. The width comes from the container;
 *   the height is the caller's. The SVG is positioned inside the box and adds nothing to its size, so a box in a
 *   table cell or a flex row can still shrink: give that box a width (a `w-32` wrapper), because a cell sizes itself
 *   from its content and an empty box has none.
 * - Accessibility: the SVG is `role="img"` named by a summary ("Median build time, last 14 days: from 44 s to 41 s,
 *   low 37 s, high 46 s", from `formatValue`). It is not interactive: no tab stop, no tooltip. Because it shows shape
 *   and not values, the exact figure belongs beside it, in a Stat or a table cell.
 * - Motion: none. New data redraws at once. In fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on) the
 *   line draws itself on arrival at a steady hand and the dot lands as the pen reaches it; each then hands over to the
 *   plain mark, so at rest it is the static Sparkline exactly. Reduced motion turns it off.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useFun } from "@/motion";

/** The five data hues, in their fixed order (R7). */
export type SparklineHue = "blue" | "amber" | "teal" | "violet" | "rose";

/** The surface the sparkline sits on, which the dot's ring matches. */
type Surface = "canvas" | "surface-1" | "surface-2";

/* Literal class names, so Tailwind sees them: the line in the mark tone, the dot in the stronger -text tone. */
const HUE: Record<SparklineHue, { line: string; dot: string }> = {
  blue: { line: "stroke-data-blue", dot: "fill-data-blue-text" },
  amber: { line: "stroke-data-amber", dot: "fill-data-amber-text" },
  teal: { line: "stroke-data-teal", dot: "fill-data-teal-text" },
  violet: { line: "stroke-data-violet", dot: "fill-data-violet-text" },
  rose: { line: "stroke-data-rose", dot: "fill-data-rose-text" },
};
/* The quiet default: the line at fg 55% and the dot at full fg, as the single-series Chart does. */
const QUIET = { line: "stroke-[color-mix(in_oklab,var(--fg)_55%,transparent)]", dot: "fill-fg" };
const RING: Record<Surface, string> = { canvas: "fill-canvas", "surface-1": "fill-surface-1", "surface-2": "fill-surface-2" };

const STROKE = 2; // the line's width
const DOT = 4; // the dot's radius: 8px across
const GAP = 2; // the ring around the dot
const AIR = 2; // between the line's edge and the box, above and below
const DASH = "4 3";

const groupDigits = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });
const round = (n: number) => Math.round(n * 100) / 100;

/** The container's width, measured before paint and kept current. 0 until the first measure. */
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

export type SparklineProps = {
  /** What it shows, for the summary that names the image: "Median build time, last 14 days". */
  label: string;
  /** The values, oldest first. Zero or more; the last one is the latest and carries the dot. Numbers that are not finite are ignored. */
  values: number[];
  /** Draws the line in one of the five data hues. Leave it out for the quiet foreground, which is right for a single quantity. */
  hue?: SparklineHue;
  /** Height of the box in px. The width is the container's. */
  height?: number;
  /** Turns a value into text for the summary: `(v) => \`${v} s\``. The default groups thousands. */
  formatValue?: (value: number) => string;
  /** A reference value, such as a goal or last month's average, drawn as a 1px dashed line across the full width. The default scale includes it. */
  baseline?: number;
  /** The value at the bottom of the box. Fix it, with `max`, so sparklines in a column compare. Default: the lowest value. */
  min?: number;
  /** The value at the top of the box. Fix it, with `min`, so sparklines in a column compare. Default: the highest value. */
  max?: number;
  /** Replaces the generated summary that names the image, such as "Median build time, last 14 days: from 44 s to 41 s, low 37 s, high 46 s". */
  summary?: string;
  /** The surface the sparkline sits on, which the ring behind the dot matches. Cards, tiles and table rows are surface-1. */
  surface?: Surface;
  /** Extra classes for the box, such as a top margin. */
  className?: string;
};

/** A trend in one 2px line with a dot on the latest value. Static, not interactive: put the exact figure beside it. */
export function Sparkline({
  label,
  values,
  hue,
  height = 32,
  formatValue,
  baseline,
  min,
  max,
  summary,
  surface = "surface-1",
  className = "",
}: SparklineProps) {
  const [boxRef, width] = useWidth();
  const fmt = formatValue ?? groupDigits;
  const data = values.filter(Number.isFinite);
  const n = data.length;
  const goal = baseline !== undefined && Number.isFinite(baseline) ? baseline : undefined;

  /* The scale: fixed ends win, else the values (and the baseline, so it is always in the box). */
  const extent = goal === undefined ? data : [...data, goal];
  const lo = min ?? (extent.length ? Math.min(...extent) : 0);
  const hi = max ?? (extent.length ? Math.max(...extent) : 0);

  const top = AIR + STROKE / 2;
  const plotH = Math.max(0, height - 2 * top);
  const y = (v: number) => {
    const t = hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 0.5;
    return round(top + (1 - t) * plotH);
  };
  /* The line starts half a stroke in and ends a dot's radius short of the edge, so neither is cut. */
  const left = STROKE / 2;
  const right = Math.max(left, width - DOT);
  const x = (i: number) => round(n > 1 ? left + (i * (right - left)) / (n - 1) : right);

  const text =
    summary ??
    (n === 0
      ? `${label}: no data`
      : n === 1
        ? `${label}: ${fmt(data[0]!)}`
        : `${label}: from ${fmt(data[0]!)} to ${fmt(data[n - 1]!)}, low ${fmt(Math.min(...data))}, high ${fmt(Math.max(...data))}` +
          (goal === undefined ? "" : `, baseline ${fmt(goal)}`));

  const tone = hue ? HUE[hue] : QUIET;
  /* Fun mode: on arrival the line draws itself at a steady hand and the dot lands as the pen reaches it. Each hands
     over to the plain mark once done (a drawn path keeps a dash pattern that antialiases its caps a hair differently). */
  const fun = useFun();
  const [drawing, setDrawing] = useState(() => !!fun);
  const [landing, setLanding] = useState(() => !!fun);
  const land = fun ? { ...fun.pop, delay: data.length > 1 ? fun.draw.duration : 0 } : undefined;
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(v)}`).join(" ");
  /* A 1px line is crisp on the half pixel. */
  const goalY = goal === undefined ? 0 : Math.round(y(goal)) + 0.5;

  return (
    <div ref={boxRef} className={"relative w-full min-w-0 " + className} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={text} className="absolute top-0 left-0 block overflow-visible">
          {goal !== undefined && (
            <line
              x1={0}
              x2={width}
              y1={goalY}
              y2={goalY}
              strokeWidth={1}
              strokeDasharray={DASH}
              shapeRendering="crispEdges"
              className="stroke-line-strong"
            />
          )}
          {n > 1 &&
            (fun && drawing ? (
              <motion.path
                d={line}
                fill="none"
                strokeWidth={STROKE}
                strokeLinejoin="round"
                strokeLinecap="round"
                className={tone.line}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={fun.draw}
                onAnimationComplete={() => setDrawing(false)}
              />
            ) : (
              <path d={line} fill="none" strokeWidth={STROKE} strokeLinejoin="round" strokeLinecap="round" className={tone.line} />
            ))}
          {n > 0 &&
            (fun && landing ? (
              <motion.g
                style={{ originX: `${x(n - 1)}px`, originY: `${y(data[n - 1]!)}px` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={land}
                onAnimationComplete={() => setLanding(false)}
              >
                <circle cx={x(n - 1)} cy={y(data[n - 1]!)} r={DOT + GAP} stroke="none" className={RING[surface]} />
                <circle cx={x(n - 1)} cy={y(data[n - 1]!)} r={DOT} stroke="none" className={tone.dot} />
              </motion.g>
            ) : (
              <>
                <circle cx={x(n - 1)} cy={y(data[n - 1]!)} r={DOT + GAP} stroke="none" className={RING[surface]} />
                <circle cx={x(n - 1)} cy={y(data[n - 1]!)} r={DOT} stroke="none" className={tone.dot} />
              </>
            ))}
        </svg>
      )}
    </div>
  );
}
