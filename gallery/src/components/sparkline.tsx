/**
 * Sparkline: a trend in one thin line, with no axes, no gridlines and no labels. It sits beside a figure (a Stat's
 * `trend` slot) or in a table row, and shows shape, not values: put the exact figure next to it. A sibling of the
 * LineChart and the Meter, drawn the way the Meter is (R7: a hue is a thread through neutral space).
 *
 * - Bodies (proposals/worlds.md): this file measures the box, scales the values and writes the summary once, resolves
 *   them into SparklineBodyProps and renders the body the material picks (byWorld). The box is the caller's height in
 *   every world, so a row of tiles lines up whatever the material. Press, here, is a line in a groove: a sunken well
 *   (--tray, --tray-shade) with the line along its floor, 4px in from the edge (8px at the two ends, where a round well
 *   curves in), and the latest value a raised bead
 *   (--block, --block-lift) on it. Flat (bodies/sparkline.flat.tsx) is the line as it has always been, on the page.
 *   Device (bodies/sparkline.device.tsx) is a row of lit dots on LCD glass, the latest column the strongest.
 * - Marks (Flat): a 2px line with round joins and caps, and a dot on the latest point so today is the strongest mark, as
 *   in the Chart. The dot is 4px in radius (8px across) on a 2px ring in the surface color, so it reads on a busy row and
 *   the line does not run into it. No area fill, no gradient, no glow (R2). Press keeps the line and swaps the dot for
 *   its bead, which needs no ring because its lift parts it from the line.
 * - Color: the line is the quiet foreground by default (`--fg` at 55%) and the dot is `--fg`. With a `hue` the line is
 *   the hue's mark tone (3:1 on every surface) and the dot its `-text` tone, a step stronger. One hue means one
 *   quantity (R7); keep it the same wherever that quantity is drawn. Device's lit dots are the glass's ink, or the
 *   hue's mark tone.
 * - Scale: by default each sparkline fits its own values, with 2px of air above and below the line. Pass `min` and
 *   `max` to fix the scale, so the sparklines in a column compare. A value outside a fixed scale is held at its edge.
 *   A flat series (or a single value) sits in the middle. `baseline` is a reference value (a goal, last month's
 *   average) drawn as a 1px dashed `--line-strong` line across the full width (on Device, its row lit at 30% in every
 *   other column); the default scale includes it, so it is always in the box.
 * - Drawn at the container's width, measured with a ResizeObserver (as the Chart is), so the 2px line and the dot stay
 *   crisp and round: nothing is scaled and `preserveAspectRatio` never stretches it. Before the first measure (and on
 *   the server) it renders an empty box of the final height (the well or the glass, in the worlds that have one), so
 *   nothing jumps. The width comes from the container; the height is the caller's. The SVG is positioned inside the
 *   box and adds nothing to its size, so a box in a table cell or a flex row can still shrink: give that box a width (a
 *   `w-32` wrapper), because a cell sizes itself from its content and an empty box has none.
 * - Accessibility: the SVG is `role="img"` named by a summary ("Median build time, last 14 days: from 44 s to 41 s,
 *   low 37 s, high 46 s", from `formatValue`), the same in every world. It is not interactive: no tab stop, no tooltip.
 *   Because it shows shape and not values, the exact figure belongs beside it, in a Stat or a table cell.
 * - Motion: none. New data redraws at once. In fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on) the
 *   line draws itself on arrival at a steady hand and the dot (Press: the bead) lands as the pen reaches it; each then
 *   hands over to the plain mark, so at rest it is the static Sparkline exactly. Reduced motion turns it off. Device
 *   switches where it stands (R4): nothing draws itself or fades in.
 */
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { motion } from "motion/react";
import { byWorld, useFun, useMaterial } from "@/motion";
import { SparklineFlatBody } from "./bodies/sparkline.flat";
import { SparklineDeviceBody } from "./bodies/sparkline.device";

/** The five data hues, in their fixed order (R7). */
export type SparklineHue = "blue" | "amber" | "teal" | "violet" | "rose";

/** The surface the sparkline sits on, which the dot's ring matches. */
type Surface = "canvas" | "surface-1" | "surface-2";

/** The classes a hue (or the quiet default) gives each body's marks. */
export type SparklineTone = {
  /** The line's stroke. */
  line: string;
  /** The latest point's dot as an SVG fill. */
  dot: string;
  /** The same tone as a background, for Press's bead core. */
  core: string;
  /** The fill of Device's lit dots. */
  lit: string;
};

/* Literal class names, so Tailwind sees them: the line in the mark tone, the dot in the stronger -text tone. */
const HUE: Record<SparklineHue, SparklineTone> = {
  blue: { line: "stroke-data-blue", dot: "fill-data-blue-text", core: "bg-data-blue-text", lit: "fill-data-blue" },
  amber: { line: "stroke-data-amber", dot: "fill-data-amber-text", core: "bg-data-amber-text", lit: "fill-data-amber" },
  teal: { line: "stroke-data-teal", dot: "fill-data-teal-text", core: "bg-data-teal-text", lit: "fill-data-teal" },
  violet: { line: "stroke-data-violet", dot: "fill-data-violet-text", core: "bg-data-violet-text", lit: "fill-data-violet" },
  rose: { line: "stroke-data-rose", dot: "fill-data-rose-text", core: "bg-data-rose-text", lit: "fill-data-rose" },
};
/* The quiet default: the line at fg 55% and the dot at full fg, as the single-series Chart does. */
const QUIET: SparklineTone = { line: "stroke-[color-mix(in_oklab,var(--fg)_55%,transparent)]", dot: "fill-fg", core: "bg-fg", lit: "fill-field-ink" };
const RING: Record<Surface, string> = { canvas: "fill-canvas", "surface-1": "fill-surface-1", "surface-2": "fill-surface-2" };

const groupDigits = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });

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

/** What a body draws (proposals/worlds.md, Bodies): the contract's resolved state. */
export type SparklineBodyProps = {
  /** The box's ref: the body puts it on its root so the width can be measured. */
  boxRef: RefObject<HTMLDivElement | null>;
  /** The box's measured width; 0 until the first measure, when a body draws its ground only. */
  width: number;
  /** The caller's height, which every body's box keeps. */
  height: number;
  /** The summary that names the image. */
  text: string;
  /** The finite values, oldest first; the last is the latest. */
  data: number[];
  /** Where a value sits between 0 at the bottom of the box and 1 at the top, held at the edge outside a fixed scale. */
  at: (value: number) => number;
  /** Where the baseline sits, in the same 0 to 1; null when there is none. */
  goal: number | null;
  /** True when the line carries a data hue. */
  hued: boolean;
  tone: SparklineTone;
  /** The fill that matches the surface, for the ring behind the dot. */
  ring: string;
  className: string;
};

const STROKE = 2; // the line's width
const BEAD = 10; // the bead's width, and its core is 6px
const WALL = 4; // the line's inset from the well's edge, all round
const END = 4; // more, at the two ends, where a round well curves in
const AIR = 3; // between the line's edge and the floor's edge, above and below, so the bead stays on the floor
const DASH = "4 3";
const round = (n: number) => Math.round(n * 100) / 100;

/** Press: a line in a groove. A sunken well the size of the box, the line along its floor and a raised bead on the latest value. */
function PressBody({ boxRef, width, height, text, data, at, goal, tone, className }: SparklineBodyProps) {
  const n = data.length;
  const innerW = Math.max(0, width - 2 * WALL);
  const innerH = Math.max(0, height - 2 * WALL);
  const top = AIR + STROKE / 2;
  const plotH = Math.max(0, innerH - 2 * top);
  const y = (v: number) => round(top + (1 - at(v)) * plotH);
  /* The line starts and ends a little in from the floor's ends, which the well's round corners curve away from, and
     its last point is the bead's centre, so the bead stays on the floor. */
  const left = STROKE / 2 + END;
  const right = Math.max(left, innerW - BEAD / 2 - END);
  const x = (i: number) => round(n > 1 ? left + (i * (right - left)) / (n - 1) : right);

  /* Fun mode: the line draws itself and the bead lands as the pen reaches it; each hands over to the plain mark. */
  const fun = useFun();
  const [drawing, setDrawing] = useState(() => !!fun);
  const [landing, setLanding] = useState(() => !!fun);
  const land = fun ? { ...fun.pop, delay: data.length > 1 ? fun.draw.duration : 0 } : undefined;
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(v)}`).join(" ");
  const goalY = goal === null ? 0 : Math.round(round(top + (1 - goal) * plotH)) + 0.5;
  const bead = "absolute grid place-items-center rounded-pill bg-block shadow-(--block-lift) forced-colors:border";
  const beadAt = n > 0 ? { left: x(n - 1) - BEAD / 2, top: y(data[n - 1]!) - BEAD / 2, width: BEAD, height: BEAD } : undefined;

  return (
    <div ref={boxRef} data-body="press" className={"relative w-full min-w-0 " + className} style={{ height }}>
      <div aria-hidden="true" data-well="" className="absolute inset-0 rounded-control bg-tray shadow-(--tray-shade) forced-colors:border" />
      {width > 0 && (
        <div className="absolute" style={{ left: WALL, top: WALL, width: innerW, height: innerH }}>
          <svg width={innerW} height={innerH} role="img" aria-label={text} className="absolute top-0 left-0 block overflow-visible">
            {goal !== null && (
              <line x1={0} x2={innerW} y1={goalY} y2={goalY} strokeWidth={1} strokeDasharray={DASH} shapeRendering="crispEdges" className="stroke-line-strong" />
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
          </svg>
          {beadAt &&
            (fun && landing ? (
              <motion.div
                aria-hidden="true"
                className={bead}
                style={beadAt}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={land}
                onAnimationComplete={() => setLanding(false)}
              >
                <span className={"size-1.5 rounded-pill " + tone.core} />
              </motion.div>
            ) : (
              <div aria-hidden="true" className={bead} style={beadAt}>
                <span className={"size-1.5 rounded-pill " + tone.core} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

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
  const at = (v: number) => (hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 0.5);

  const text =
    summary ??
    (n === 0
      ? `${label}: no data`
      : n === 1
        ? `${label}: ${fmt(data[0]!)}`
        : `${label}: from ${fmt(data[0]!)} to ${fmt(data[n - 1]!)}, low ${fmt(Math.min(...data))}, high ${fmt(Math.max(...data))}` +
          (goal === undefined ? "" : `, baseline ${fmt(goal)}`));

  const Body = byWorld(useMaterial(), { press: PressBody, flat: SparklineFlatBody, device: SparklineDeviceBody });

  return (
    <Body
      boxRef={boxRef}
      width={width}
      height={height}
      text={text}
      data={data}
      at={at}
      goal={goal === undefined ? null : at(goal)}
      hued={hue !== undefined}
      tone={hue ? HUE[hue] : QUIET}
      ring={RING[surface]}
      className={className}
    />
  );
}
