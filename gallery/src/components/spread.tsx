/**
 * Spread: how values spread, one thin rail per row on a shared scale. Build times by Framer site, reply times by
 * client. The Dot plot's quiet sibling: where the Dot plot draws every value as a dot, a row here draws five
 * numbers as a thread, so a dozen rows still read at a glance. A sibling of the Meter in chart.tsx and the Bar list.
 *
 * - Row: the label at the start (small, `--fg`, truncates), the rail across the shared scale, then the median at
 *   the end (caption, `--fg-subtle`, tabular, as the Meter's reading). Rows are `--space-6` apart with no
 *   dividers and no boxes. A row is a stat of its own, so nothing here is pressable and nothing takes focus.
 * - Rail: a 4px track at the control radius in fg 12% across the whole scale. Over it the full range (min to
 *   max) is a 4px segment in fg 24%, over that the middle half (p25 to p75) is a 4px segment in the hue's mark
 *   tone, and the median is a 2px wide, 12px tall tick in the hue's text tone, centered on the rail. A hue is
 *   drawn thin, a thread through neutral space (P11). The hue means the measure (build time, reply time), so a
 *   row past the goal keeps it.
 * - Data: a row is `{ label, values }` (the component computes the quartiles, by linear interpolation) or
 *   `{ label, min, p25, median, p75, max }` when an API has already done it. Rows may mix.
 * - Alignment: one grid for the list, as the Bar list does. Every row is a subgrid of it, so every rail starts
 *   and ends at the same x and the medians line up in a column. The list measures itself with a container query,
 *   not the window: under 28rem the label moves above its rail, which then spans the full width of the row.
 * - Scale: linear or log (durations from minutes to days read on a log scale). Left out, the domain runs from
 *   the smallest value to the largest (and the goal), rounded outward to round numbers. The tick labels sit once,
 *   under the last row, at the caption size, `--fg-subtle`, tabular; a label that would touch its neighbour is left
 *   out, and the first and last stay inside the rail. They are measured from the rail's own width.
 * - Goal: a 1px dashed `--line-strong` line through every rail at the goal. In the wide layout the segments
 *   join into one line down the list. Its label sits once under the rows, where the line ends. A row whose
 *   median is past the goal says so in hidden words.
 * - Legend: one line under the scale says what the marks are in words ("Faint: the full range. Blue: the middle
 *   half. Tick: the median."), with tiny swatches drawn in the same tones.
 * - Semantics: a list named by `label`. A row reads "Halo site: median 41 s, middle half 32 s to 48 s, range
 *   22 s to 71 s" (and ", past the 4 h goal"), built from the visible label and median plus hidden words. The
 *   rails, the ticks and the goal line are hidden from assistive tech, because the numbers are in the words.
 * - Motion: none. No entrance, no count-up. A changed value just changes.
 */
import { useLayoutEffect, useMemo, useRef, useState } from "react";

/** The five data hues, in their fixed order (P11). */
export type SpreadHue = "blue" | "amber" | "teal" | "violet" | "rose";

type SpreadFromValues = {
  /** What the row is, in a few words: "Halo site". It truncates when the row is narrow. */
  label: string;
  /** Every value the row has, in any order. The component works out the range, the quartiles and the median. */
  values: number[];
};

type SpreadFromQuantiles = {
  /** What the row is, in a few words: "Halo site". It truncates when the row is narrow. */
  label: string;
  /** The smallest value: where the full range starts. */
  min: number;
  /** The first quartile: where the middle half starts. */
  p25: number;
  /** The median, drawn as the tick and shown at the end of the row. */
  median: number;
  /** The third quartile: where the middle half ends. */
  p75: number;
  /** The largest value: where the full range ends. */
  max: number;
};

/** One row: either all of its values, or the five numbers already computed. */
export type SpreadItem = SpreadFromValues | SpreadFromQuantiles;

export type SpreadProps = {
  /** Names the list for assistive tech and says what is measured: "Build times by site". */
  label: string;
  /** The rows, in the order to show them. Sort them yourself: the list does not. */
  items: SpreadItem[];
  /** The scale: "linear", or "log" for values that run from minutes to days. A log scale needs values above zero. */
  scale?: "linear" | "log";
  /** The ends of the scale as [min, max]. Left out, it runs from the smallest value to the largest (and the goal), rounded outward to round numbers. */
  domain?: [min: number, max: number];
  /** The labelled positions under the last row, such as `{ value: 60, label: "1 h" }`. Left out, they come from the domain: decades on a log scale, round steps on a linear one. A label that would touch its neighbour is left out. */
  ticks?: { value: number; label: string }[];
  /** Turns a value into the text shown and read: `(v) => \`${v} s\``. The default groups thousands. */
  formatValue?: (value: number) => string;
  /** What the values are, said after a number to screen readers when formatValue does not already say it: "seconds". Pass ["second", "seconds"] to say the first for exactly 1. */
  unit?: string | [one: string, other: string];
  /** The data hue of the middle half and the median: blue, amber, teal, violet or rose. One hue means the measure, so it does not change for a row past the goal. */
  hue?: SpreadHue;
  /** Draws a 1px dashed line through every rail at this value, and names a row whose median is past it. Leave it out for no line. */
  goal?: number;
  /** The text under the goal line, such as "4 h goal". Left out, it reads the goal and the word goal. */
  goalLabel?: string;
  /** Extra classes for the list's box, such as a width or a top margin. */
  className?: string;
};

/* ----------------------------------------------------------------- constants and helpers */

const FIGURE = 7.4; // the advance of a 12px tabular figure in Geist with its tracking, rounded up
const TICK_GAP = 12; // the least air between two tick labels

/** Mark tone for the middle half and text tone for the median, as fills, plus the hue's name for the legend. Literal strings, so Tailwind sees them. */
const HUE: Record<SpreadHue, { mark: string; tick: string; name: string }> = {
  blue: { mark: "bg-data-blue", tick: "bg-data-blue-text", name: "Blue" },
  amber: { mark: "bg-data-amber", tick: "bg-data-amber-text", name: "Amber" },
  teal: { mark: "bg-data-teal", tick: "bg-data-teal-text", name: "Teal" },
  violet: { mark: "bg-data-violet", tick: "bg-data-violet-text", name: "Violet" },
  rose: { mark: "bg-data-rose", tick: "bg-data-rose-text", name: "Rose" },
};

/** The Meter's track, and the range laid over it. */
const TRACK = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]";
const RANGE = "bg-[color-mix(in_oklab,var(--fg)_24%,transparent)]";

const groupDigits = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });

type Stats = { min: number; p25: number; median: number; p75: number; max: number };

/** A quantile of sorted values, by linear interpolation between neighbours. */
function quantile(sorted: number[], q: number) {
  const at = (sorted.length - 1) * q;
  const lo = Math.floor(at);
  const hi = Math.ceil(at);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (at - lo);
}

/** The five numbers of a row, or null when it has none (an empty row, or values a log scale cannot place). */
function statsOf(item: SpreadItem, log: boolean): Stats | null {
  if ("values" in item) {
    const sorted = item.values.filter((v) => Number.isFinite(v) && (!log || v > 0)).sort((a, b) => a - b);
    if (sorted.length === 0) return null;
    return { min: sorted[0]!, p25: quantile(sorted, 0.25), median: quantile(sorted, 0.5), p75: quantile(sorted, 0.75), max: sorted[sorted.length - 1]! };
  }
  const { min, p25, median, p75, max } = item;
  const all = [min, p25, median, p75, max];
  return all.every((v) => Number.isFinite(v) && (!log || v > 0)) ? { min, p25, median, p75, max } : null;
}

/** A round step (1, 2, 5 or 10 times a power of ten) that puts about four to six of them across a linear domain. */
function niceStep(min: number, max: number) {
  const raw = (max - min) / 5;
  const pow = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
}

function niceTicks(min: number, max: number): number[] {
  if (!(max > min)) return [min];
  const step = niceStep(min, max);
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

/** The nearest 1, 2 or 5 times a power of ten, below (or above) a value. */
function round125(value: number, up: boolean) {
  const pow = 10 ** Math.floor(Math.log10(value));
  const m = value / pow;
  const steps = [1, 2, 5, 10];
  const pick = up ? steps.find((s) => s >= m - 1e-9) : [...steps].reverse().find((s) => s <= m + 1e-9);
  return Number(((pick ?? 1) * pow).toPrecision(12));
}

/** The scale's ends: the caller's, or the data's (and the goal's) rounded outward to round numbers. */
function resolveDomain(rows: (Stats | null)[], log: boolean, goal: number | undefined, domain: [number, number] | undefined): [number, number] {
  if (domain) {
    const lo = log ? Math.max(domain[0], 1e-9) : domain[0];
    return [lo, domain[1] > lo ? domain[1] : log ? lo * 10 : lo + 1];
  }
  const edges = rows.flatMap((r) => (r ? [r.min, r.max] : []));
  if (goal !== undefined && (!log || goal > 0)) edges.push(goal);
  if (edges.length === 0) return log ? [1, 10] : [0, 1];
  const lo = Math.min(...edges);
  const hi = Math.max(...edges);
  if (log) {
    const a = round125(lo, false);
    const b = round125(hi, true);
    return [a, b > a ? b : a * 10];
  }
  if (!(hi > lo)) return [lo - 1, hi + 1];
  const step = niceStep(lo, hi);
  return [Number((Math.floor(lo / step + 1e-9) * step).toPrecision(12)), Number((Math.ceil(hi / step - 1e-9) * step).toPrecision(12))];
}

/** A box's width, measured before paint and kept current. 0 until the first measure, and on the server. */
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

/** A label's inline position: centred on `x`, but flush with the rail's end when it would pass it, so the estimate of its width never pushes it out. */
const placeAt = (x: number, w: number, width: number): { left: number } | { right: number } => (x + w / 2 > width ? { right: 0 } : { left: startFor(x, w, width) });

/*
 * The columns, named by their start line: the label, the rail and the median. The grid carries the 1rem
 * between them. Under 28rem the rail leaves the row's first line and spans from the label to the end.
 */
const WIDE = "grid-cols-[[label]_fit-content(10rem)_[rail]_minmax(6rem,1fr)_[median]_auto_[end]]";
const NARROW = "@max-[28rem]:grid-cols-[[label]_minmax(0,1fr)_[median]_auto_[end]]";
const RAIL_COLS = "col-start-[rail] col-end-[median] @max-[28rem]:col-start-[label] @max-[28rem]:col-end-[end]";

/* ----------------------------------------------------------------- the component */

/** One thin rail per row on a shared scale: the full range, the middle half and the median. Static, and never the accent. */
export function Spread({ label, items, scale = "linear", domain, ticks, formatValue, unit, hue = "blue", goal, goalLabel, className = "" }: SpreadProps) {
  const fmt = formatValue ?? groupDigits;
  const log = scale === "log";
  const tones = HUE[hue];
  const [footRef, width] = useWidth();

  const unitFor = (v: number) => (Array.isArray(unit) ? (v === 1 ? unit[0] : unit[1]) : unit);
  /* A number as it is read: the text, then the unit when there is one. A range keeps the unit for its end. */
  const say = (v: number) => fmt(v) + (unit ? ` ${unitFor(v)}` : "");
  const sayRange = (a: number, b: number) => (fmt(a) === fmt(b) ? say(a) : `${fmt(a)} to ${say(b)}`);
  const goalText = goalLabel ?? (goal !== undefined ? `${fmt(goal)} goal` : "");

  const rows = useMemo(() => items.map((item) => statsOf(item, log)), [items, log]);
  const [min, max] = useMemo(() => resolveDomain(rows, log, goal, domain), [rows, log, goal, domain]);
  const span = log ? Math.log(max) - Math.log(min) : max - min;
  /* Where a value sits on the scale, as a share of the rail's width. */
  const at = (v: number) => {
    if (log && !(v > 0)) return 0;
    const f = ((log ? Math.log(v) - Math.log(min) : v - min) / span) * 100;
    return Math.min(100, Math.max(0, f));
  };
  const goalDrawn = goal !== undefined && goal >= min && goal <= max;

  /* Tick labels left to right, placed in px from the rail's width; one that would touch the one before it is left out. */
  const shown = useMemo(() => {
    const list = (ticks ?? (log ? logTicks(min, max) : niceTicks(min, max)).map((value) => ({ value, label: fmt(value) })))
      .filter((t) => t.value >= min && t.value <= max)
      .map((t) => {
        const f = ((log ? Math.log(t.value) - Math.log(min) : t.value - min) / span) * width;
        return { ...t, w: t.label.length * FIGURE, x: f };
      })
      .sort((a, b) => a.x - b.x);
    const out: { key: number; label: string; at: { left: number } | { right: number } }[] = [];
    let right = -Infinity;
    for (const t of list) {
      const left = startFor(t.x, t.w, width);
      if (left < right + TICK_GAP) continue;
      right = left + t.w;
      out.push({ key: t.value, label: t.label, at: placeAt(t.x, t.w, width) });
    }
    return out;
  }, [ticks, log, min, max, span, fmt, width]);

  const goalAt = goalDrawn ? placeAt((at(goal) / 100) * width, goalText.length * FIGURE, width) : { left: 0 };

  return (
    <div className={"@container w-full " + className}>
      <div className={"grid gap-x-4 " + WIDE + " " + NARROW}>
        <ul role="list" aria-label={label} className="col-span-full m-0 grid list-none grid-cols-subgrid gap-y-6 p-0">
          {items.map((item, i) => {
            const s = rows[i];
            const past = s !== null && s !== undefined && goal !== undefined && s.median > goal;
            return (
              <li
                key={`${i}-${item.label}`}
                className="col-span-full grid min-h-6 grid-cols-subgrid items-center @max-[28rem]:min-h-0 @max-[28rem]:gap-y-2"
              >
                <span className="col-start-[label] row-start-1 block min-w-0 truncate text-small text-fg">
                  {item.label}
                  <span className="sr-only">: </span>
                </span>

                <span
                  aria-hidden="true"
                  className={"relative row-start-1 self-stretch @max-[28rem]:row-start-2 @max-[28rem]:h-3 @max-[28rem]:self-center " + RAIL_COLS}
                >
                  <span className={"absolute inset-x-0 top-1/2 block h-1 -translate-y-1/2 rounded-control " + TRACK} />
                  {s && (
                    <>
                      <span
                        className={"absolute top-1/2 block h-1 -translate-y-1/2 rounded-control " + RANGE}
                        style={{ left: `${at(s.min)}%`, width: `${at(s.max) - at(s.min)}%` }}
                      />
                      <span
                        className={"absolute top-1/2 block h-1 -translate-y-1/2 rounded-control " + tones.mark}
                        style={{ left: `${at(s.p25)}%`, width: `${at(s.p75) - at(s.p25)}%` }}
                      />
                    </>
                  )}
                  {goalDrawn && (
                    <span className="absolute -inset-y-3 w-px @max-[28rem]:-inset-y-1" style={{ left: `${at(goal)}%` }}>
                      <svg width="1" height="100%" focusable="false" className="block h-full overflow-visible">
                        <line x1={0.5} x2={0.5} y1={0} y2="100%" strokeWidth={1} strokeDasharray="4 4" shapeRendering="crispEdges" className="stroke-line-strong" />
                      </svg>
                    </span>
                  )}
                  {s && <span className={"absolute top-1/2 block h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 " + tones.tick} style={{ left: `${at(s.median)}%` }} />}
                </span>

                <span className="col-start-[median] row-start-1 text-right text-caption font-normal whitespace-nowrap tabular-nums text-fg-subtle">
                  {s ? (
                    <>
                      <span className="sr-only">median </span>
                      {fmt(s.median)}
                      <span className="sr-only">
                        {unit ? ` ${unitFor(s.median)}` : ""}, middle half {sayRange(s.p25, s.p75)}, range {sayRange(s.min, s.max)}
                        {past ? `, past the ${goalText}` : ""}
                      </span>
                    </>
                  ) : (
                    "No data"
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        {/* The scale, once, under the last row: the goal's label where its line ends, then the ticks. It is drawn at the rail's measured width. */}
        <div aria-hidden="true" className="col-span-full mt-3 grid grid-cols-subgrid @max-[28rem]:mt-2">
          <div ref={footRef} className={"relative row-start-1 " + RAIL_COLS + (goalDrawn ? " h-12" : " h-6")}>
            {width > 0 && (
              <>
                {goalDrawn && goalText && (
                  <span className="absolute top-0 flex h-6 items-center text-caption font-normal whitespace-nowrap tabular-nums text-fg-subtle" style={goalAt}>
                    {goalText}
                  </span>
                )}
                {shown.map((t) => (
                  <span key={t.key} className="absolute bottom-0 flex h-6 items-center text-caption font-normal whitespace-nowrap tabular-nums text-fg-subtle" style={t.at}>
                    {t.label}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        <p className="col-span-full mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-small text-fg-muted">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className={"block h-1 w-3 shrink-0 rounded-control " + TRACK}>
              <span className={"block h-full rounded-control " + RANGE} />
            </span>
            Faint: the full range.
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className={"block h-1 w-3 shrink-0 rounded-control " + tones.mark} />
            {tones.name}: the middle half.
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className={"block h-3 w-0.5 shrink-0 " + tones.tick} />
            Tick: the median.
          </span>
        </p>
      </div>
    </div>
  );
}
