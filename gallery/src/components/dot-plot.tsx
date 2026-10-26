/**
 * Dot plot: a distribution drawn as stacks of dots, one stack per bin along an axis, mirrored around a center
 * line. It answers "where do most values fall, and how many are past a goal?" without a number to read. Plain
 * SVG, no chart library. A sibling of chart.tsx: same measured width, same tooltip, same hidden table, same
 * one-tab-stop keyboard model, same touch scrub, same entrance rule.
 *
 * - Bins: they sit at a fixed 8px pitch, and a dot is 6px across with 2px of air, so the bin count follows the
 *   width (a phone gets fewer, wider bins). The axis is linear or log (durations from minutes to days read on a
 *   log axis). With a goal, the axis is piecewise at the goal so that a bin boundary lands exactly on it: no bin
 *   straddles the goal, the dashed line runs through the 2px gap between two columns, and the colors are exact.
 * - Dots: each bin stacks its dots from the center line outward, mirrored, so a stack of any size is symmetric
 *   about the line. A dot stands for `perDot` items, the smallest whole number that makes the tallest stack fit
 *   the height; a non-empty bin always keeps at least one dot, and the legend says what a dot is when perDot
 *   is above 1. The tooltip and the table always give the true count.
 * - Color (R7): with a goal, dots in bins at or under it take the hue's mark tone and dots past it take
 *   --fg-subtle (a mark at 3:1 or more in both themes). Without a goal every dot takes the hue. The active bin
 *   turns to the hue's text tone (--fg past the goal). The goal is a 1px dashed --line-strong line with its
 *   label at its foot, the median a 2px line in the hue's text tone with its label above, and a marker a 10px
 *   dot with a 2px --fg ring on the center line and an always-visible label in the tooltip's look.
 * - Anatomy: no gridlines, no area, no glow. Tick labels sit under the plot at the caption size, --fg-subtle, tabular.
 *   A label that would touch the one before it is left out, and the first and last are kept inside the width.
 * - Drawn at the container's width, measured with a ResizeObserver, so text and hairlines stay crisp. The SVG is
 *   absolutely placed in a box of the final height, so it never holds its container wide: when the container
 *   shrinks (a phone turned upright) the plot shrinks with it. Before the
 *   first measure (and on the server) only the legend and the hidden table render, in a box of the final height.
 * - Marks: the pointer is one layer over the plot and the non-empty bin under it is the active one (on a phone
 *   a bin is narrower than a finger, so a touch scrubs, and the layer is touch-action: pan-y so a vertical drag
 *   still scrolls). For the keyboard and screen readers there is one visually hidden button per non-empty bin:
 *   one tab stop (roving tabindex), arrows, Home and End. A keyboard-focused bin gets a 2px focus ring around its
 *   stack, only when :focus-visible matches.
 * - Tooltip: the Tooltip's look (solid surface-3, shadow-tooltip) above the stack, kept inside. Esc hides it
 *   without moving focus. A touch pins it until the next touch elsewhere. It repeats the button's name, so it
 *   is hidden from screen readers.
 * - Motion: one entrance on the responsive tier: the plot fades in by opacity (a dot squashed by scaleY would
 *   stop being a circle). Nothing else moves; new data redraws at once, and hover is a color change on the
 *   instant tier. Reduced motion is the hooks' job.
 * - Accessibility: the SVG is role="img" with a summary ("Reply times, 412 replies: median 1 h 16 m, 84% within
 *   the 4 h goal"), and a visually hidden table lists each bin's range and count, then the median, the goal and
 *   the markers. The bin buttons are in a labelled group outside the image.
 */
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";

/* ----------------------------------------------------------------- types */

/** The five data hues, in their fixed order (R7). */
export type DotPlotHue = "blue" | "amber" | "teal" | "violet" | "rose";

export type DotPlotProps = {
  /** The plot's name, in a few words: "Reply times". It labels the image, the bin group and the table, and starts the generated summary. */
  label: string;
  /** One number per item, in any order: every reply time, every build time. Values outside the domain land in the end bins. */
  values: number[];
  /** The axis: "linear", or "log" for values that run from minutes to days. A log axis needs values above zero. */
  scale?: "linear" | "log";
  /** The ends of the axis as [min, max]. Left out, it runs from the smallest value or marker to the largest. */
  domain?: [min: number, max: number];
  /** The labelled positions under the plot, such as `{ value: 60, label: "1h" }`. Left out, they come from the domain: decades on a log axis, round steps on a linear one. A label that would touch its neighbour is left out. */
  ticks?: { value: number; label: string }[];
  /** Turns a value into text for the tooltip, the summary, the table and the default ticks: `(v) => \`${v} s\``. The default groups thousands. */
  formatValue?: (value: number) => string;
  /** What the values count, said after the number in the tooltip and the legend: "replies". Pass ["reply", "replies"] to say the first for exactly 1. Leave it out when the label says it. */
  unit?: string | [one: string, other: string];
  /** Splits the dots at this value: dots at or under it take the hue, dots past it take the foreground's subtle tone. A 1px dashed line marks it and the legend gives both shares. Leave it out and every dot takes the hue. */
  goal?: number;
  /** The text at the goal line's foot, such as "4 h goal". Left out, it reads the goal and the word goal. */
  goalLabel?: string;
  /** The data hue of the dots (and of the median): blue, amber, teal, violet or rose. Use one hue for one meaning on a view. */
  hue?: DotPlotHue;
  /** Draws the median as a 2px line in the hue's text tone, labelled above it. */
  median?: boolean;
  /** Named single values, such as an outlier: a 10px dot with a 2px foreground ring on the center line, and its label always shown. */
  markers?: { value: number; label: string }[];
  /** Height of the plot in px, axis labels included. The legend sits under it. The width is the container's. */
  height?: number;
  /** Replaces the generated summary that names the image, such as "Reply times, 412 replies: median 1 h 16 m, 84% within the 4 h goal". */
  summary?: string;
  /** The legend's name for dots at or under the goal. */
  inLabel?: string;
  /** The legend's name for dots past the goal. */
  outLabel?: string;
  /** Plays the entrance on the responsive tier when the plot mounts. Remount with a new key to replay. */
  entrance?: boolean;
  /** Extra classes for the plot's box, such as a top margin. */
  className?: string;
};

/* ----------------------------------------------------------------- constants and helpers */

const PITCH = 8; // one bin, and one dot row: a 6px dot and 2px of air
const DOT_R = 3; // a 6px dot
const MARKER_R = 5; // a 10px dot
const RING_R = 8; // the ring's centreline: a 2px gap, then a 2px stroke
const RING_OUTER = 9;
const TOP = 20; // room above the plot for the median's label
const AXIS = 24; // room under the plot for the tick labels
const FOOT = 20; // room under the plot for the goal's label
const FIGURE = 7.2; // advance of a 12px tabular figure in Geist (letters run narrower)
const TICK_GAP = 12; // the least air between two tick labels
const NEAR = 4; // a focus ring sits this far from its stack

/** Mark tone, text tone and line tone of each hue. Literal strings, so Tailwind sees them. */
const HUE: Record<DotPlotHue, { mark: string; text: string; line: string }> = {
  blue: { mark: "fill-data-blue", text: "fill-data-blue-text", line: "stroke-data-blue-text" },
  amber: { mark: "fill-data-amber", text: "fill-data-amber-text", line: "stroke-data-amber-text" },
  teal: { mark: "fill-data-teal", text: "fill-data-teal-text", line: "stroke-data-teal-text" },
  violet: { mark: "fill-data-violet", text: "fill-data-violet-text", line: "stroke-data-violet-text" },
  rose: { mark: "fill-data-rose", text: "fill-data-rose-text", line: "stroke-data-rose-text" },
};
const OVER = { mark: "fill-fg-subtle", text: "fill-fg" };

const groupDigits = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });

const median = (values: number[]) => {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
};

/** Round steps across a linear domain: about four to six of them. */
function niceTicks(min: number, max: number): number[] {
  const range = max - min;
  if (!(range > 0)) return [min];
  const raw = range / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const first = Math.ceil(min / step - 1e-9);
  const out: number[] = [];
  for (let i = first; i * step <= max + 1e-9; i++) out.push(Number((i * step).toPrecision(12)));
  return out;
}

/** Decades across a log domain, then 2s and 5s when there are fewer than three. */
function logTicks(min: number, max: number): number[] {
  const e0 = Math.floor(Math.log10(min));
  const e1 = Math.ceil(Math.log10(max));
  const within = (mults: number[]) => {
    const out: number[] = [];
    for (let e = e0; e <= e1; e++) for (const m of mults) out.push(Number((m * 10 ** e).toPrecision(12)));
    return out.filter((v) => v >= min && v <= max);
  };
  const decades = within([1]);
  return decades.length >= 3 ? decades : within([1, 2, 5]);
}

/* The axis. One continuous map from a value to x in 0..n*PITCH. With a goal inside the domain it has a knot
   there, so that the goal sits exactly on a bin boundary (gk bins to its left). */
type Axis = {
  n: number;
  /** Bin boundary index of the goal, or null when the goal is not inside the domain. */
  gk: number | null;
  x: (value: number) => number;
  value: (x: number) => number;
  bin: (value: number) => number;
};

function makeAxis(scale: "linear" | "log", min: number, max: number, n: number, goal: number | undefined): Axis {
  const log = scale === "log";
  const t = log ? Math.log : (v: number) => v;
  const u = log ? Math.exp : (v: number) => v;
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const W = n * PITCH;
  const tl = t(min);
  const th = t(max);
  const split = goal !== undefined && goal > min && goal < max && n >= 2;
  const tg = split ? t(goal) : 0;
  const gk = split ? Math.min(n - 1, Math.max(1, Math.round(((tg - tl) / (th - tl)) * n))) : null;
  const gx = (gk ?? 0) * PITCH;
  const x = (v: number) => {
    const tv = t(clamp(v));
    if (gk === null) return ((tv - tl) / (th - tl)) * W;
    return tv <= tg ? ((tv - tl) / (tg - tl)) * gx : gx + ((tv - tg) / (th - tg)) * (W - gx);
  };
  const value = (px: number) => {
    if (gk === null) return u(tl + (px / W) * (th - tl));
    return px <= gx ? u(tl + (px / gx) * (tg - tl)) : u(tg + ((px - gx) / (W - gx)) * (th - tg));
  };
  const bin = (v: number) => {
    const b = Math.max(0, Math.min(n - 1, Math.floor(x(v) / PITCH)));
    return gk !== null && goal !== undefined && v <= goal ? Math.min(b, gk - 1) : b;
  };
  return { n, gk, x, value, bin };
}

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

/** Where a label of `w` px, centred on `x`, starts so that it stays inside 0..width. */
const startFor = (x: number, w: number, width: number) => Math.max(0, Math.min(width - w, x - w / 2));

/* ----------------------------------------------------------------- the stacks */

/** One bin's dots, mirrored about the center line. Memoised, so a hover redraws two bins and not all of them. */
const Stack = memo(function Stack({ cx, cy, d, cls }: { cx: number; cy: number; d: number; cls: string }) {
  return (
    <g className={"transition-[fill] duration-(--dur-instant) ease-litt " + cls}>
      {Array.from({ length: d }, (_, j) => (
        <circle key={j} cx={cx} cy={cy + (j - (d - 1) / 2) * PITCH} r={DOT_R} />
      ))}
    </g>
  );
});

/* ----------------------------------------------------------------- the plot */

export function DotPlot({
  label,
  values,
  scale = "linear",
  domain,
  ticks,
  formatValue,
  unit,
  goal,
  goalLabel,
  hue = "blue",
  median: showMedian = true,
  markers,
  height = 160,
  summary,
  inLabel = "Within goal",
  outLabel = "Over",
  entrance = true,
  className = "",
}: DotPlotProps) {
  const fmt = formatValue ?? groupDigits;
  const unitFor = (v: number) => (Array.isArray(unit) ? (v === 1 ? unit[0] : unit[1]) : unit);
  const withUnit = (v: number) => groupDigits(v) + (unit ? ` ${unitFor(v)}` : "");
  const tones = HUE[hue];
  const [boxRef, width] = useWidth();
  const enter = useTransition("responsive");

  /* The data that does not depend on the width. */
  const stats = useMemo(() => {
    const usable = scale === "log" ? values.filter((v) => v > 0) : values;
    const mk = (markers ?? []).filter((m) => (scale === "log" ? m.value > 0 : true));
    const all = [...usable, ...mk.map((m) => m.value)];
    let min = domain ? domain[0] : all.length ? Math.min(...all) : 0;
    let max = domain ? domain[1] : all.length ? Math.max(...all) : 1;
    if (scale === "log") min = Math.max(min, 1e-9);
    if (!(max > min)) max = min + 1;
    const total = usable.length;
    const within = goal === undefined ? total : usable.filter((v) => v <= goal).length;
    const pct = total > 0 ? Math.round((within / total) * 100) : 0;
    return { usable, markers: mk, min, max, total, pct, med: median(usable) };
  }, [values, markers, scale, domain, goal]);
  const { min, max, total, med } = stats;
  const goalText = goalLabel ?? (goal !== undefined ? `${fmt(goal)} goal` : "");

  /* The geometry, which does. */
  const g = useMemo(() => {
    const n = Math.max(0, Math.floor(width / PITCH));
    const x0 = Math.floor((width - n * PITCH) / 2);
    const goalDrawn = goal !== undefined && goal > min && goal < max;
    const foot = goalDrawn ? FOOT : 8;
    const rows = Math.max(2, Math.floor((height - TOP - foot - AXIS) / PITCH));
    const dotsH = rows * PITCH;
    const top = height - AXIS - foot - dotsH; // the leftover goes above the plot
    const axis = makeAxis(scale, min, max, Math.max(n, 1), goal);
    const counts = new Array<number>(Math.max(n, 1)).fill(0);
    for (const v of stats.usable) counts[axis.bin(v)]!++;
    const peak = Math.max(0, ...counts);
    const perDot = Math.max(1, Math.ceil(peak / rows));
    const dots = counts.map((c) => (c === 0 ? 0 : Math.max(1, Math.round(c / perDot))));
    const occupied = counts.flatMap((c, i) => (c > 0 && n > 0 ? [i] : []));
    return { n, x0, goalDrawn, foot, rows, dotsH, top, bottom: top + dotsH, cy: top + dotsH / 2, axis, counts, perDot, dots, occupied };
  }, [width, height, scale, min, max, goal, stats.usable]);

  const rangeOf = (i: number) => {
    const a = fmt(i === 0 ? min : g.axis.value(i * PITCH));
    const b = fmt(i === g.n - 1 ? max : g.axis.value((i + 1) * PITCH));
    return a === b ? a : `${a} to ${b}`;
  };
  const countOf = (i: number) => withUnit(g.counts[i]!);
  const itemLabel = (i: number) => `${rangeOf(i)}: ${countOf(i)}`;
  const over = (i: number) => goal !== undefined && (g.axis.gk !== null ? i >= g.axis.gk : goal < min);

  const parts: string[] = [];
  if (showMedian && total > 0) parts.push(`median ${fmt(med)}`);
  if (goal !== undefined && total > 0) parts.push(`${stats.pct}% within the ${goalText}`);
  const text = summary ?? `${label}, ${total} ${unit ? unitFor(total) : "values"}` + (parts.length ? `: ${parts.join(", ")}` : "");

  /* Which bin is active: a hovered one, else a focused one, else a pinned one (a tap). */
  const [hover, setHover] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [ring, setRing] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const valid = (i: number | null) => (i !== null && (g.counts[i] ?? 0) > 0 ? i : null);
  const active = dismissed ? null : valid(hover ?? focus ?? pinned);
  const ringed = valid(ring);
  useEffect(() => setDismissed(false), [hover, focus, pinned]);

  const medianBin = total > 0 ? g.axis.bin(med) : 0;
  const [tabStop, setTabStop] = useState<number | null>(null);
  const stop = g.occupied.includes(tabStop ?? -1) ? tabStop! : g.occupied.includes(medianBin) ? medianBin : (g.occupied[0] ?? 0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  /* A tap pins the tooltip; the next touch anywhere else clears it. */
  useEffect(() => {
    if (pinned === null) return;
    const away = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setPinned(null);
    };
    document.addEventListener("pointerdown", away, true);
    return () => document.removeEventListener("pointerdown", away, true);
  }, [pinned, boxRef]);

  /* The bin under a pointer, or null outside the plot. */
  const binAt = (clientX: number) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box || g.n <= 0) return null;
    const i = Math.floor((clientX - box.left - g.x0) / PITCH);
    return i < 0 || i >= g.n ? null : i;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const occ = g.occupied;
    const pos = occ.findIndex((b) => buttons.current[b] === document.activeElement);
    if (pos < 0) return;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? occ[Math.min(occ.length - 1, pos + 1)]
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? occ[Math.max(0, pos - 1)]
          : e.key === "Home"
            ? occ[0]
            : e.key === "End"
              ? occ[occ.length - 1]
              : undefined;
    if (to !== undefined) {
      e.preventDefault();
      buttons.current[to]?.focus();
    } else if (e.key === "Escape" && active !== null) {
      setDismissed(true);
    }
  };

  const stackHalf = (i: number) => (g.dots[i]! * PITCH - (PITCH - 2 * DOT_R)) / 2;
  const empty = total === 0;
  const px = (v: number) => g.x0 + g.axis.x(v);
  const shown = useMemo(() => {
    /* Tick labels left to right; one that would touch the one before it is left out. */
    const list = (ticks ?? (scale === "log" ? logTicks(min, max) : niceTicks(min, max)).map((value) => ({ value, label: fmt(value) })))
      .filter((t) => t.value >= min && t.value <= max)
      .map((t) => ({ ...t, w: t.label.length * FIGURE, x: g.x0 + g.axis.x(t.value) }))
      .sort((a, b) => a.x - b.x);
    const out: { key: number; label: string; left: number }[] = [];
    let right = -Infinity;
    for (const t of list) {
      const left = startFor(t.x, t.w, width);
      if (left < right + TICK_GAP) continue;
      right = left + t.w;
      out.push({ key: t.value, label: t.label, left });
    }
    return out;
  }, [ticks, scale, min, max, fmt, g, width]);

  const extras: [string, string][] = [];
  if (showMedian && total > 0) extras.push(["Median", fmt(med)]);
  if (goal !== undefined) extras.push([goalText || "Goal", fmt(goal)]);
  for (const m of stats.markers) extras.push([m.label, fmt(m.value)]);

  const noun = unit ? unitFor(g.perDot) : "values";

  return (
    <div className={"w-full " + className}>
      <motion.div
        ref={boxRef}
        className="relative w-full"
        style={{ height }}
        initial={entrance ? { opacity: 0 } : false}
        animate={{ opacity: 1, transition: enter }}
      >
        {width > 0 && !empty && g.n > 0 && (
          <>
            <svg width={width} height={height} role="img" aria-label={text} className="absolute top-0 left-0 block overflow-visible">
              <g aria-hidden="true">
                {g.occupied.map((i) => {
                  const isOver = over(i);
                  const lit = active === i;
                  const cls = isOver ? (lit ? OVER.text : OVER.mark) : lit ? tones.text : tones.mark;
                  return <Stack key={i} cx={g.x0 + i * PITCH + PITCH / 2} cy={g.cy} d={g.dots[i]!} cls={cls} />;
                })}
              </g>

              <g aria-hidden="true">
                {g.goalDrawn && g.axis.gk !== null && (
                  <line
                    x1={g.x0 + g.axis.gk * PITCH + 0.5}
                    x2={g.x0 + g.axis.gk * PITCH + 0.5}
                    y1={g.top}
                    y2={g.bottom}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    shapeRendering="crispEdges"
                    className="stroke-line-strong"
                  />
                )}
                {showMedian && (
                  <line
                    x1={Math.round(px(med))}
                    x2={Math.round(px(med))}
                    y1={g.top}
                    y2={g.bottom}
                    strokeWidth={2}
                    shapeRendering="crispEdges"
                    className={tones.line}
                  />
                )}
                {stats.markers.map((m) => (
                  <g key={m.label + m.value}>
                    <circle cx={px(m.value)} cy={g.cy} r={MARKER_R} className={goal !== undefined && m.value > goal ? OVER.mark : tones.mark} />
                    <circle cx={px(m.value)} cy={g.cy} r={RING_R} fill="none" strokeWidth={2} className="stroke-fg" />
                  </g>
                ))}
                <g className="text-caption font-normal tabular-nums">
                  {showMedian && (
                    <text
                      x={startFor(px(med), "Median".length * FIGURE, width)}
                      y={g.top - 10}
                      dominantBaseline="central"
                      className={tones.text}
                    >
                      Median
                    </text>
                  )}
                  {g.goalDrawn && goalText && (
                    <text
                      x={startFor(g.x0 + (g.axis.gk ?? 0) * PITCH, goalText.length * FIGURE, width)}
                      y={g.bottom + g.foot / 2}
                      dominantBaseline="central"
                      className="fill-fg-subtle"
                    >
                      {goalText}
                    </text>
                  )}
                  {shown.map((t) => (
                    <text key={t.key} x={t.left} y={g.bottom + g.foot + AXIS / 2} dominantBaseline="central" className="fill-fg-subtle">
                      {t.label}
                    </text>
                  ))}
                </g>
                {ringed !== null && (
                  <rect
                    x={g.x0 + ringed * PITCH + PITCH / 2 - DOT_R - NEAR}
                    y={g.cy - stackHalf(ringed) - NEAR}
                    width={2 * DOT_R + 2 * NEAR}
                    height={2 * stackHalf(ringed) + 2 * NEAR}
                    fill="none"
                    strokeWidth={2}
                    className="stroke-focus"
                  />
                )}
              </g>
            </svg>

            {stats.markers.map((m) => (
              <MarkerLabel key={m.label + m.value} cx={px(m.value)} cy={g.cy} left={g.x0} right={g.x0 + g.n * PITCH} height={height}>
                {m.label}
              </MarkerLabel>
            ))}

            {/* One layer takes the pointer, so the target is the whole plot and not an 8px column. A bin on a phone is
                narrower than a finger, so a touch scrubs: the bin under the finger is the pinned one. */}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 touch-pan-y select-none"
              style={{ left: g.x0, width: g.n * PITCH }}
              onPointerMove={(e) => {
                const i = binAt(e.clientX);
                if (e.pointerType === "touch") {
                  if (e.buttons) setPinned(i);
                } else setHover(i);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType !== "touch") setHover(null);
              }}
              onPointerDown={(e) => {
                if (e.pointerType !== "touch") return;
                const i = binAt(e.clientX);
                setPinned((p) => (p === i ? null : i));
              }}
            />

            {/* Keyboard and screen readers get one hidden button per non-empty bin: a stop for the arrow keys, named by its range and count. */}
            <div role="group" aria-label={`${label}, bins`} onKeyDown={onKeyDown}>
              {g.occupied.map((i) => (
                <button
                  key={i}
                  ref={(el) => {
                    buttons.current[i] = el;
                  }}
                  type="button"
                  tabIndex={i === stop ? 0 : -1}
                  aria-label={itemLabel(i)}
                  className="sr-only"
                  onFocus={(e) => {
                    setFocus(i);
                    setTabStop(i);
                    setRing(e.currentTarget.matches(":focus-visible") ? i : null);
                  }}
                  onBlur={() => {
                    setFocus((f) => (f === i ? null : f));
                    setRing((r) => (r === i ? null : r));
                  }}
                />
              ))}
            </div>

            <AnimatePresence>
              {active !== null && (
                <Tip key="tip" cx={g.x0 + active * PITCH + PITCH / 2} markTop={g.cy - stackHalf(active) - NEAR} height={height} width={width}>
                  <span className="text-fg-muted">{rangeOf(active)}</span>
                  <span className="text-caption font-normal tabular-nums">{countOf(active)}</span>
                </Tip>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>

      {(goal !== undefined || (width > 0 && g.perDot > 1)) && !empty && (
        <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-small text-fg-muted">
          {goal !== undefined && (
            <>
              <LegendItem swatch={tones.mark} name={inLabel} share={stats.pct} />
              <LegendItem swatch={OVER.mark} name={outLabel} share={100 - stats.pct} />
            </>
          )}
          {width > 0 && g.perDot > 1 && <li className="text-fg-subtle">{`Each dot is ${g.perDot} ${noun}`}</li>}
        </ul>
      )}

      <table className="sr-only [&_th]:font-normal">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Range</th>
            <th scope="col">Count{unit ? ` (${unitFor(2)})` : ""}</th>
          </tr>
        </thead>
        <tbody>
          {g.occupied.map((i) => (
            <tr key={i}>
              <th scope="row">{rangeOf(i)}</th>
              <td>{g.counts[i]}</td>
            </tr>
          ))}
        </tbody>
        {extras.length > 0 && (
          <tfoot>
            {extras.map(([k, v]) => (
              <tr key={k + v}>
                <th scope="row">{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tfoot>
        )}
      </table>
    </div>
  );
}

/* ----------------------------------------------------------------- legend */

/** A key, never a status: a 6px dot in the colour it names, the name, and the share in tabular figures. */
function LegendItem({ swatch, name, share }: { swatch: string; name: string; share: number }) {
  return (
    <li className="flex items-center gap-2">
      <svg width={6} height={6} aria-hidden="true" focusable="false" className="shrink-0">
        <circle cx={3} cy={3} r={3} className={swatch} />
      </svg>
      {name}
      <span className="text-caption font-normal tabular-nums text-fg">{share}%</span>
    </li>
  );
}

/* ----------------------------------------------------------------- tooltip and marker labels */

const SOLID = "rounded-control bg-surface-3 px-2 py-1.5 text-small whitespace-nowrap text-fg shadow-tooltip inset-shadow-highlight";

function Tip({ cx, markTop, height, width, children }: { cx: number; markTop: number; height: number; width: number; children: ReactNode }) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const measure = useCallback(() => setW(ref.current?.offsetWidth ?? 0), []);
  useLayoutEffect(measure);
  const half = w / 2;
  const left = Math.max(half, Math.min(width - half, cx));
  return (
    <div aria-hidden="true" className="pointer-events-none absolute z-10 -translate-x-1/2" style={{ left, bottom: height - markTop + 8 }}>
      <motion.div
        ref={ref}
        className={"flex origin-bottom items-center gap-3 " + SOLID}
        initial={{ opacity: 0, scale: 0.98, y: travel / 4 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: enter }}
        exit={{ opacity: 0, scale: 0.98, transition: exit }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** A marker's name, always shown in the tooltip's look above its ring and kept inside the plot. It does not move. */
function MarkerLabel({ cx, cy, left: lo, right: hi, height, children }: { cx: number; cy: number; left: number; right: number; height: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const measure = useCallback(() => setW(ref.current?.offsetWidth ?? 0), []);
  useLayoutEffect(measure);
  const half = w / 2;
  const left = hi - lo > w ? Math.max(lo + half, Math.min(hi - half, cx)) : (lo + hi) / 2;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -translate-x-1/2" style={{ left, bottom: height - (cy - RING_OUTER - NEAR) }}>
      <div ref={ref} className={SOLID}>
        {children}
      </div>
    </div>
  );
}
