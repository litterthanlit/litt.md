/**
 * Chart: BarChart and LineChart in plain SVG, and Meter. No chart library. A chart is quiet on purpose (P1: the
 * accent belongs to the one primary action, and a chart is made of many marks).
 *
 * - Color (components.md, Chart): a mark is never the accent. By default (the quiet foreground) one series is fg
 *   at 55% for bars and fg for a line. The current mark (the last one by default) and the hovered or focused one
 *   are full fg, and the hovered or focused one replaces the current one, so only one is full. Up to three series
 *   step down the foreground, 100%, 55% and 30%, with a legend. At 30% a mark is under 3:1 against a card, so the
 *   third series' bars carry a 1px edge at 55% and its line is dashed. Colors come from CSS variables, so both
 *   themes work.
 * - Data hues (P11, v0.11): a series may carry one of the five data hues (`hue` on the series), and `hues` gives
 *   every series without one the next hue in the fixed order. Color follows the series, never its place, so a
 *   filter that drops a series never repaints the others. A hue series rests in the hue's mark tone (3:1 on every
 *   surface) and its emphasised mark takes the hue's text tone, a step stronger, so no mark falls under 3:1 and
 *   none needs an edge or a dash. Up to five hue series.
 * - Anatomy: horizontal gridlines only (line), the zero baseline in line-strong, three to five lines in all. Axis
 *   labels are caption-size mono in fg-subtle with tabular numbers. When categories are too close for their
 *   labels, every nth label shows, counted back from the last mark so the current one keeps its label. Bars are at
 *   most 32px thick and 60% of their slot, with square tops: 2px is off the radius scale and 4px would turn a
 *   phone-sized bar into a bullet. Lines are 2px with round joins and a 4px marker. Values are zero or more.
 * - Drawn at the container's width, measured with a ResizeObserver, so text and hairlines stay crisp (nothing is
 *   scaled). Before the first measure (and on the server) only the hidden table renders, in a box of the final height.
 * - Marks: the pointer is one layer over the plot, so the target is the whole plot and the mark under the pointer
 *   is the active one (on a phone a column is narrower than a finger, so a touch scrubs). For the keyboard and
 *   screen readers there is one visually hidden button per category: one tab stop (roving tabindex), and the
 *   arrow keys move along them. Hover is a color change on the instant tier. A keyboard-focused mark gets a 2px
 *   focus ring drawn around it in the SVG, only when :focus-visible matches.
 * - Tooltip: the Tooltip's look (solid surface-3, shadow-tooltip) positioned above the mark, kept inside the
 *   chart, following the pointer from mark to mark with no re-entry. Esc hides it without moving focus. A touch
 *   pins it where the finger is, and it stays until the next touch elsewhere. It repeats the mark's label, so it is
 *   hidden from screen readers.
 * - Motion: one entrance on the responsive tier. Bars grow from the baseline by scaleY (transform-origin at the
 *   bottom) and a line fades in. Height, width and path data never animate: new data redraws at once. Reduced
 *   motion is the hooks' job. Hover and focus add no motion beyond a color change.
 * - Accessibility: the SVG is role="img" with a summary label, and a visually hidden table lists every value.
 *   The category buttons are in a labelled group outside the image (children of an image are presentational).
 * - Meter: a horizontal progress bar, a 4px rail at the control radius in fg 12% filled with fg, or a data hue. A target is
 *   a 2px tick in fg-subtle taller than the rail; steps split the rail into equal segments 2px apart. Static.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";

/* ----------------------------------------------------------------- types */

/** The five data hues, in their fixed order (P11). */
export type ChartHue = "blue" | "amber" | "teal" | "violet" | "rose";

/** One named run of values, one per category. Values are zero or more. */
export type ChartSeries = {
  /** What the series is: "Deploys", "Failed". It names the legend, the tooltip and the table column. */
  name: string;
  /** One value per label, in the same order as `labels`. */
  values: number[];
  /** Draws this series in one of the five data hues instead of the foreground. Keep a series' hue the same wherever it appears. */
  hue?: ChartHue;
};

type ChartBaseProps = {
  /** The chart's name and what it shows, in a few words: "Deploys per day, last 14 days". It labels the image, the value group and the table. */
  label: string;
  /** One label per category, oldest first, kept short: "3 Oct". On narrow screens only every nth shows. */
  labels: string[];
  /** One to three series. Up to three step down the foreground and get a legend; a single series needs none. */
  series: ChartSeries[];
  /** Height of the whole chart in px, axis labels included. The width is the container's. */
  height?: number;
  /** Turns a value into text for the axis, the tooltip and the labels: `(v) => \`${v} s\``. The default groups thousands. */
  formatValue?: (value: number) => string;
  /** What the values count, said after the number in the tooltip and the marks' names: "deploys". Pass ["deploy", "deploys"] to say the first for exactly 1. Leave it out when the label says it. */
  unit?: string | [one: string, other: string];
  /** The first column's name in the hidden table, such as "Day". */
  xTitle?: string;
  /** Replaces the generated summary that names the image, such as "Deploys per day, last 14 days: from 5 to 1, peak 9". */
  summary?: string;
  /** The category with the emphasis: an index, "last" (the default) or "none". Only a single series takes it; a hovered or focused mark replaces it. */
  highlight?: number | "last" | "none";
  /** Gives every series without its own hue the next data hue in the fixed order: blue, amber, teal, violet, rose. Leave it off for the quiet foreground. */
  hues?: boolean;
  /** Plays the entrance on the responsive tier when the chart mounts. Remount with a new key to replay. */
  entrance?: boolean;
  /** Extra classes for the chart's box, such as a top margin. */
  className?: string;
};

export type BarChartProps = ChartBaseProps;
export type LineChartProps = ChartBaseProps;

/* ----------------------------------------------------------------- helpers */

const TOP = 8; // room above the plot
const AXIS = 28; // room under the plot for the category labels
const LABEL_GAP = 6; // between a value label and the plot
const MONO = 7.2; // advance of a 12px mono character
const MAX_BAR = 32;

const mix = (percent: number) => `color-mix(in oklab, var(--fg) ${percent}%, transparent)`;
/** Fill of each series, as a class: 100%, 55%, 30% of the foreground. */
const FILL = ["fill-fg", "fill-[color-mix(in_oklab,var(--fg)_55%,transparent)]", "fill-[color-mix(in_oklab,var(--fg)_30%,transparent)]"];
const STROKE = ["var(--fg)", mix(55), mix(30)];
const EDGE = "stroke-[color-mix(in_oklab,var(--fg)_55%,transparent)]";
const DASH = "6 4";

const HUE_ORDER: ChartHue[] = ["blue", "amber", "teal", "violet", "rose"];
/* Literal names, so Tailwind sees the classes and the registry can rename the variables: the mark tone at rest, the
   text tone for the emphasised mark, then the same two as colors for a line and its marker. */
const HUE_PAINT: Record<ChartHue, [rest: string, strong: string, stroke: string, marker: string]> = {
  blue: ["fill-data-blue", "fill-data-blue-text", "var(--data-blue)", "var(--data-blue-text)"],
  amber: ["fill-data-amber", "fill-data-amber-text", "var(--data-amber)", "var(--data-amber-text)"],
  teal: ["fill-data-teal", "fill-data-teal-text", "var(--data-teal)", "var(--data-teal-text)"],
  violet: ["fill-data-violet", "fill-data-violet-text", "var(--data-violet)", "var(--data-violet-text)"],
  rose: ["fill-data-rose", "fill-data-rose-text", "var(--data-rose)", "var(--data-rose-text)"],
};

/** How one series is painted: its bar fills at rest and emphasised, its line and marker colors, and its third-series cues. */
type Paint = { rest: string; strong: string; stroke: string; marker: string; edge: boolean; dash: boolean };

function paints(series: ChartSeries[], hues: boolean): Paint[] {
  let next = 0;
  return series.map((s, j) => {
    const hue = s.hue ?? (hues ? HUE_ORDER[next++ % HUE_ORDER.length] : undefined);
    if (hue) {
      const [rest, strong, stroke, marker] = HUE_PAINT[hue];
      return { rest, strong, stroke, marker, edge: false, dash: false };
    }
    /* The foreground: one series rests at 55% with the emphasised mark full; several step down by their place. */
    const level = Math.min(j, 2);
    return series.length === 1
      ? { rest: FILL[1]!, strong: FILL[0]!, stroke: STROKE[0]!, marker: STROKE[0]!, edge: false, dash: false }
      : { rest: FILL[level]!, strong: FILL[level]!, stroke: STROKE[level]!, marker: STROKE[level]!, edge: level === 2, dash: level === 2 };
  });
}

const groupDigits = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });

/** Zero, then up to four equal steps that reach the maximum: 3 to 5 gridlines in all. */
function niceTicks(max: number): number[] {
  if (!(max > 0)) return [0, 1];
  const exp = Math.floor(Math.log10(max));
  for (let pow = exp - 2; pow <= exp + 1; pow++) {
    for (const m of [1, 2, 5]) {
      const step = Number((m * 10 ** pow).toPrecision(12));
      const n = Math.ceil(max / step - 1e-9);
      if (n >= 2 && n <= 4) return Array.from({ length: n + 1 }, (_, i) => Number((i * step).toPrecision(12)));
    }
  }
  return [0, max];
}

type Geometry = {
  width: number;
  height: number;
  left: number;
  plotW: number;
  plotH: number;
  slotW: number;
  ticks: number[];
  top: number; // y of the top of the plot
  base: number; // y of the zero baseline
  y: (value: number) => number;
  cx: (index: number) => number; // x of a slot's centre
  step: number; // show every nth category label
};

function layout(width: number, height: number, labels: string[], series: ChartSeries[], fmt: (v: number) => string): Geometry {
  const n = labels.length;
  const max = Math.max(0, ...series.flatMap((s) => s.values.slice(0, n)));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1]!;
  const valueChars = Math.max(...ticks.map((t) => fmt(t).length));
  const left = Math.ceil(valueChars * MONO) + LABEL_GAP;
  const plotW = Math.max(0, width - left);
  const plotH = Math.max(0, height - TOP - AXIS);
  const slotW = n > 0 ? plotW / n : 0;
  const labelChars = Math.max(1, ...labels.map((l) => l.length));
  /* The last label may be pushed in from the right edge, which shortens its gap to the one before it. Allow for that. */
  const hang = Math.max(0, (labelChars * MONO) / 2 - slotW / 2);
  const step = slotW > 0 ? Math.max(1, Math.ceil((labelChars * MONO + 12 + hang) / slotW)) : 1;
  const base = TOP + plotH;
  return {
    width,
    height,
    left,
    plotW,
    plotH,
    slotW,
    ticks,
    top: TOP,
    base,
    y: (v) => base - (Math.max(0, v) / top) * plotH,
    cx: (i) => left + (i + 0.5) * slotW,
    step,
  };
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

/* ----------------------------------------------------------------- the shared chart */

type Kind = "bar" | "line";

function Chart({
  kind,
  label,
  labels,
  series,
  height,
  formatValue,
  unit,
  xTitle,
  summary,
  highlight,
  hues = false,
  entrance,
  className = "",
}: Required<Pick<ChartBaseProps, "height" | "xTitle" | "highlight" | "entrance">> & ChartBaseProps & { kind: Kind }) {
  const fmt = formatValue ?? groupDigits;
  const n = labels.length;
  const many = series.length > 1;
  const paint = useMemo(() => paints(series, hues), [series, hues]);
  const [boxRef, width] = useWidth();
  const g = useMemo(() => layout(width, height, labels, series, fmt), [width, height, labels, series, fmt]);
  const value = (s: ChartSeries, i: number) => s.values[i] ?? 0;
  const unitFor = (v: number) => (Array.isArray(unit) ? (v === 1 ? unit[0] : unit[1]) : unit);
  const withUnit = (v: number) => fmt(v) + (unit ? ` ${unitFor(v)}` : "");

  /* Which category is active: a hovered one, else a focused one, else a pinned one (a tap). */
  const [hover, setHover] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [ring, setRing] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const active = dismissed ? null : (hover ?? focus ?? pinned);
  useEffect(() => setDismissed(false), [hover, focus, pinned]);

  const current = highlight === "none" || many ? null : highlight === "last" ? n - 1 : highlight;
  const emphasis = active ?? current;

  const [tabStop, setTabStop] = useState<number | null>(null);
  const stop = Math.min(tabStop ?? (current ?? n - 1), n - 1);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const plotGroup = useRef<HTMLDivElement>(null);

  /* A tap pins the tooltip; the next touch anywhere else clears it. */
  useEffect(() => {
    if (pinned === null) return;
    const away = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setPinned(null);
    };
    document.addEventListener("pointerdown", away, true);
    return () => document.removeEventListener("pointerdown", away, true);
  }, [pinned]);

  /* The category under a pointer, or null outside the plot. */
  const indexAt = (clientX: number) => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box || g.slotW <= 0) return null;
    const i = Math.floor((clientX - box.left - g.left) / g.slotW);
    return i < 0 || i >= n ? null : i;
  };

  const move = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    buttons.current[next]?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = buttons.current.findIndex((b) => b === document.activeElement);
    if (i < 0) return;
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (to !== null) {
      e.preventDefault();
      move(to);
    } else if (e.key === "Escape" && active !== null) {
      setDismissed(true);
    }
  };

  const itemLabel = (i: number) =>
    `${labels[i]}: ` + (many ? series.map((s) => `${s.name} ${withUnit(value(s, i))}`).join(", ") : withUnit(value(series[0]!, i)));

  const text = useMemo(() => {
    if (summary) return summary;
    const part = (s: ChartSeries) => {
      const v = s.values.slice(0, n);
      return `from ${fmt(v[0] ?? 0)} to ${fmt(v[n - 1] ?? 0)}, peak ${fmt(Math.max(0, ...v))}`;
    };
    return `${label}: ` + (many ? series.map((s) => `${s.name} ${part(s)}`).join("; ") : part(series[0]!));
  }, [summary, label, series, n, many, fmt]);

  /* The tooltip sits above the tallest mark of the active column. */
  const tipTop = active === null ? 0 : Math.min(...series.map((s) => g.y(value(s, active))));
  const tipCx = active === null ? 0 : g.cx(active);

  const enter = useTransition("responsive");
  const empty = n === 0 || series.length === 0;

  return (
    <div className={"w-full " + className}>
      {many && <Legend series={series} kind={kind} paint={paint} />}
      <div ref={boxRef} className="relative w-full" style={{ height }}>
        {width > 0 && !empty && (
          <>
            <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
              <Grid g={g} labels={labels} fmt={fmt} />
              {many && active !== null && (
                <rect
                  x={g.left + active * g.slotW}
                  y={g.top}
                  width={g.slotW}
                  height={g.plotH}
                  className="fill-[color-mix(in_oklab,var(--fg)_4%,transparent)]"
                />
              )}
              {kind === "bar" ? (
                <Bars g={g} series={series} paint={paint} n={n} emphasis={emphasis} ring={ring} entrance={entrance} enter={enter} />
              ) : (
                <Lines g={g} series={series} paint={paint} n={n} emphasis={emphasis} ring={ring} entrance={entrance} enter={enter} />
              )}
            </svg>

            {/* One layer takes the pointer, so the target is the whole plot and not a 20px column. Columns on a phone
                are narrower than a finger, so a touch scrubs: the mark under the finger is the pinned one. */}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 touch-pan-y select-none"
              style={{ left: g.left }}
              onPointerMove={(e) => {
                const i = indexAt(e.clientX);
                if (e.pointerType === "touch") {
                  if (e.buttons) setPinned(i);
                } else setHover(i);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType !== "touch") setHover(null);
              }}
              onPointerDown={(e) => {
                if (e.pointerType !== "touch") return;
                const i = indexAt(e.clientX);
                setPinned((p) => (p === i ? null : i));
              }}
            />

            {/* Keyboard and screen readers get one hidden button per category: a stop for the arrow keys, named by its values. */}
            <div ref={plotGroup} role="group" aria-label={`${label}, values`} onKeyDown={onKeyDown}>
              {labels.map((_, i) => (
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
                <Tip key="tip" cx={tipCx} markTop={tipTop} height={height} width={width}>
                  <TipContent label={labels[active]!} series={series} many={many} value={(s) => withUnit(value(s, active))} />
                </Tip>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* A table will not shrink to sr-only's 1px, so a wrapper clips it; otherwise a long one widens a phone's page. */}
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">{xTitle}</th>
              {series.map((s) => (
                <th key={s.name} scope="col">
                  {s.name}
                  {unit ? ` (${unitFor(2)})` : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((l, i) => (
              <tr key={i}>
                <th scope="row">{l}</th>
                {series.map((s) => (
                  <td key={s.name}>{fmt(value(s, i))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- grid and axis labels */

function Grid({ g, labels, fmt }: { g: Geometry; labels: string[]; fmt: (v: number) => string }) {
  const n = labels.length;
  const crisp = (y: number) => Math.round(y) + 0.5;
  return (
    <g aria-hidden="true" shapeRendering="crispEdges">
      {g.ticks.map((t, i) => (
        <line
          key={t}
          x1={g.left}
          x2={g.width}
          y1={crisp(g.y(t))}
          y2={crisp(g.y(t))}
          strokeWidth={1}
          className={i === 0 ? "stroke-line-strong" : "stroke-line"}
        />
      ))}
      <g shapeRendering="auto" className="fill-fg-subtle font-mono text-caption tabular-nums">
        {g.ticks.map((t) => (
          <text key={t} x={g.left - LABEL_GAP} y={g.y(t)} textAnchor="end" dominantBaseline="central">
            {fmt(t)}
          </text>
        ))}
        {labels.map((l, i) => {
          if ((n - 1 - i) % g.step !== 0) return null;
          /* The last label would hang past the right edge: right-align it to the edge instead. */
          const half = (l.length * MONO) / 2;
          const last = i === n - 1 && g.cx(i) + half > g.width;
          return (
            <text key={i} x={last ? g.width : g.cx(i)} y={g.base + 20} textAnchor={last ? "end" : "middle"}>
              {l}
            </text>
          );
        })}
      </g>
    </g>
  );
}

/* ----------------------------------------------------------------- bars */

type MarksProps = {
  g: Geometry;
  series: ChartSeries[];
  paint: Paint[];
  n: number;
  emphasis: number | null;
  ring: number | null;
  entrance: boolean;
  enter: ReturnType<typeof useTransition>;
};

function Bars({ g, series, paint, n, emphasis, ring, entrance, enter }: MarksProps) {
  const k = series.length;
  const gap = 2;
  const group = k === 1 ? Math.min(MAX_BAR, Math.floor(g.slotW * 0.6)) : Math.min(k * MAX_BAR + gap * (k - 1), Math.floor(g.slotW * 0.7));
  const bw = Math.max(2, Math.floor((group - gap * (k - 1)) / k));
  const span = bw * k + gap * (k - 1);
  const baseline = g.y(0);
  return (
    <g aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const x0 = g.left + i * g.slotW + (g.slotW - span) / 2;
        return series.map((s, j) => {
          const v = s.values[i] ?? 0;
          const top = g.y(v);
          const h = v > 0 ? Math.max(2, baseline - top) : 0;
          if (h === 0) return null;
          /* One series rests (fg 55% or the hue's mark tone) and the emphasised bar is strong. Several series keep their own paint. */
          const p = paint[j]!;
          const fill = k === 1 && emphasis === i ? p.strong : p.rest;
          return (
            <motion.rect
              key={`${s.name}-${i}`}
              x={x0 + j * (bw + gap)}
              y={baseline - h}
              width={bw}
              height={h}
              initial={entrance ? { scaleY: 0 } : false}
              animate={{ scaleY: 1, transition: enter }}
              style={{ originX: 0.5, originY: 1 }}
              strokeWidth={1}
              className={
                "transition-[fill] duration-(--dur-instant) ease-litt " +
                fill +
                (p.edge ? " " + EDGE : " stroke-transparent")
              }
            />
          );
        });
      })}
      {ring !== null && (
        <rect
          x={g.left + ring * g.slotW + (g.slotW - span) / 2 - 4}
          y={Math.min(...series.map((s) => g.y(s.values[ring] ?? 0))) - 4}
          width={span + 8}
          height={baseline - Math.min(...series.map((s) => g.y(s.values[ring] ?? 0))) + 8}
          fill="none"
          strokeWidth={2}
          className="stroke-focus"
        />
      )}
    </g>
  );
}

/* ----------------------------------------------------------------- lines */

function Lines({ g, series, paint, n, emphasis, ring, entrance, enter }: MarksProps) {
  return (
    <g aria-hidden="true">
      <motion.g initial={entrance ? { opacity: 0 } : false} animate={{ opacity: 1, transition: enter }}>
        {series.map((s, j) => (
          <path
            key={s.name}
            d={Array.from({ length: n }, (_, i) => `${i === 0 ? "M" : "L"}${g.cx(i)} ${g.y(s.values[i] ?? 0)}`).join(" ")}
            fill="none"
            stroke={paint[j]!.stroke}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={paint[j]!.dash ? DASH : undefined}
          />
        ))}
      </motion.g>
      {emphasis !== null &&
        series.map((s, j) => (
          <circle key={s.name} cx={g.cx(emphasis)} cy={g.y(s.values[emphasis] ?? 0)} r={4} fill={paint[j]!.marker} stroke="none" />
        ))}
      {ring !== null &&
        series.map((s) => (
          <circle key={s.name} cx={g.cx(ring)} cy={g.y(s.values[ring] ?? 0)} r={8} fill="none" strokeWidth={2} className="stroke-focus" />
        ))}
    </g>
  );
}

/* ----------------------------------------------------------------- legend */

function Swatch({ kind, paint }: { kind: Kind; paint: Paint }) {
  return (
    <svg width={16} height={8} aria-hidden="true" className="shrink-0" focusable="false">
      {kind === "bar" ? (
        <rect x={4} y={0} width={8} height={8} strokeWidth={1} className={paint.rest + (paint.edge ? " " + EDGE : " stroke-transparent")} />
      ) : (
        <line x1={0} x2={16} y1={4} y2={4} stroke={paint.stroke} strokeWidth={2} strokeDasharray={paint.dash ? "4 3" : undefined} />
      )}
    </svg>
  );
}

function Legend({ series, kind, paint }: { series: ChartSeries[]; kind: Kind; paint: Paint[] }) {
  return (
    <ul className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-small text-fg-muted">
      {series.map((s, j) => (
        <li key={s.name} className="flex items-center gap-2">
          <Swatch kind={kind} paint={paint[j]!} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------------------------------------------- tooltip */

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
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-10 -translate-x-1/2"
      style={{ left, bottom: height - markTop + 8 }}
    >
      <motion.div
        ref={ref}
        className="origin-bottom rounded-control bg-surface-3 px-2 py-1.5 text-small whitespace-nowrap text-fg shadow-tooltip inset-shadow-highlight"
        initial={{ opacity: 0, scale: 0.98, y: travel / 4 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: enter }}
        exit={{ opacity: 0, scale: 0.98, transition: exit }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function TipContent({
  label,
  series,
  many,
  value,
}: {
  label: string;
  series: ChartSeries[];
  many: boolean;
  value: (s: ChartSeries) => string;
}) {
  if (!many) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-fg-muted">{label}</span>
        <span className="font-mono text-caption tabular-nums">{value(series[0]!)}</span>
      </div>
    );
  }
  return (
    <div className="grid gap-1">
      <span className="text-fg-muted">{label}</span>
      {series.map((s) => (
        <div key={s.name} className="flex items-center justify-between gap-4">
          <span className="text-fg-muted">{s.name}</span>
          <span className="font-mono text-caption tabular-nums">{value(s)}</span>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- public charts */

/** Bars along a baseline, one column per category. One series is fg at 55% with the current bar full; up to three step down, or up to five in data hues. */
export function BarChart({ height = 240, xTitle = "Label", highlight = "last", entrance = true, ...rest }: BarChartProps) {
  return <Chart kind="bar" height={height} xTitle={xTitle} highlight={highlight} entrance={entrance} {...rest} />;
}

/** A 2px line over the same grid. One series is fg with a marker on the current point; up to three step down, the third dashed, or up to five in data hues. */
export function LineChart({ height = 240, xTitle = "Label", highlight = "last", entrance = true, ...rest }: LineChartProps) {
  return <Chart kind="line" height={height} xTitle={xTitle} highlight={highlight} entrance={entrance} {...rest} />;
}

/* ----------------------------------------------------------------- Meter */

export type MeterProps = {
  /** What is measured, at the start of the row: "Storage". It names the meter for assistive tech. */
  label: string;
  /** The value, from 0 to max. */
  value: number;
  /** The value that fills the rail. */
  max?: number;
  /** The reading at the end of the row, in mono: "42 of 100 GB". Defaults to the percentage. */
  valueText?: string;
  /** Fills the rail with one of the five data hues instead of the foreground, when the color says which thing this is (P11). */
  hue?: ChartHue;
  /** A value to aim for or stay under, such as a budget. A 2px tick crosses the rail there, in fg-subtle, and screen readers hear it after the reading. */
  target?: number;
  /** How the target is said: "Budget 80 GB". Defaults to "target" and the percentage. */
  targetText?: string;
  /** Splits the rail into this many equal steps with 2px of air between them, for a count of a few, such as 7 of 10 checks. Filled steps take the fill, the rest the track. */
  steps?: number;
  /** Extra classes for the row, such as a width. */
  className?: string;
};

const METER_FILL: Record<ChartHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};

const TRACK = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]";

/** A thin rail for one value against a limit, with an optional target tick or steps. Static, never the accent. */
export function Meter({ label, value, max = 100, valueText, hue, target, targetText, steps, className = "" }: MeterProps) {
  const id = useId();
  const share = (v: number) => (max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0);
  const percent = share(value);
  const reading = valueText ?? `${Math.round(percent)}%`;
  const fill = hue ? METER_FILL[hue] : "bg-fg";
  const count = steps && steps > 1 ? Math.round(steps) : 0;
  const filled = Math.round((percent / 100) * count);
  const aim = target === undefined ? null : share(target);
  const spoken = aim === null ? reading : `${reading}, ${targetText ?? `target ${Math.round(aim)}%`}`;
  return (
    <div className={"grid gap-2 " + className}>
      <div className="flex items-baseline justify-between gap-4">
        <span id={id} className="text-small text-fg">
          {label}
        </span>
        <span className="font-mono text-caption tabular-nums text-fg-subtle">{reading}</span>
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
            Array.from({ length: count }, (_, i) => <div key={i} className={"h-full flex-1 rounded-control " + (i < filled ? fill : TRACK)} />)
          ) : (
            <div className={"h-full rounded-control " + fill} style={{ width: `${percent}%` }} />
          )}
        </div>
        {/* The target: a neutral tick taller than the rail, so it reads over the fill and the track alike. */}
        {aim !== null && (
          <span aria-hidden="true" className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-fg-subtle" style={{ left: `${aim}%` }} />
        )}
      </div>
    </div>
  );
}
