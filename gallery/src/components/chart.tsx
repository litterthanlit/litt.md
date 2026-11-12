/**
 * Chart: BarChart and LineChart in plain SVG, and Meter. No chart library. A chart is quiet on purpose (R6: the
 * accent belongs to the one primary action, and a chart is made of many marks).
 *
 * - Color (components.md, Chart): a mark is never the accent. By default (the quiet foreground) one series is fg
 *   at 55% for bars and fg for a line. The current mark (the last one by default) and the hovered or focused one
 *   are full fg, and the hovered or focused one replaces the current one, so only one is full. Up to three series
 *   step down the foreground, 100%, 55% and 30%, with a legend. At 30% a mark is under 3:1 against a card, so the
 *   third series' bars carry a 1px edge at 55% and its line is dashed. Colors come from CSS variables, so both
 *   themes work.
 * - Bodies (proposals/worlds.md): for BarChart this file resolves every bar once (barMarks) and renders the body the
 *   material picks (byWorld). Press, here, is a sunken well (--tray, --tray-shade) with the bars standing on its floor
 *   and the category labels on a raised rail (--block, --block-lift). Flat, also here, is the chart as it has always
 *   been: the hairline grid, the value axis and the bars, with no ground (Nick, 2026-11-10: the current data parts
 *   are Flat's). Device (bodies/chart.device.tsx) is a dot-matrix screen: bars as columns of lit dots, the emphasised
 *   value in seven segments above it. LineChart and StackedBarChart take the same bodies: Press's well and rail around
 *   today's lines and rails, Flat as it has always been, and on Device a line is a trace of lit dots and a stack a
 *   column of them. Meter has no bodies yet.
 * - Data hues (R7, v0.11): a series may carry one of the five data hues (`hue` on the series), and `hues` gives
 *   every series without one the next hue in the fixed order. Color follows the series, never its place, so a
 *   filter that drops a series never repaints the others. A hue series rests in the hue's mark tone (3:1 on every
 *   surface) and its emphasised mark takes the hue's text tone, a step stronger, so no mark falls under 3:1 and
 *   none needs an edge. Up to five hue series. Color alone must not tell five lines apart (WCAG 1.4.1), so the
 *   third, fourth and fifth hues' lines are dashed, dotted and dash-dotted, in the legend swatch too; blue and
 *   amber stay solid. The dash follows the hue, as the color does.
 * - Anatomy: horizontal gridlines only (line), the zero baseline in line-strong, three to five lines in all. Axis
 *   labels are caption-size in fg-subtle with tabular numbers. When categories are too close for their
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
 * - Stacked (StackedBarChart, growth step): the parts of each category as one stacked rail, a hue per series. A column
 *   is at most 8px wide, each segment has the control radius, and segments sit 2px apart, like the Breakdown's split
 *   rail: a hue is a thread, never a block. The tallest stack sets the scale. Series take the data hues (`hue`, else
 *   the next in the fixed order), so a Legend can drop one without repainting the others. The active column takes its
 *   series' text tones over a faint column band; the tooltip lists each part and the total; the hidden table adds a
 *   Total column. Up to five series. The entrance grows each column from the baseline, like the bars.
 * - Meter: a horizontal progress bar, a 4px rail at the control radius in fg 12% filled with fg, or a data hue. A target is
 *   a 2px tick in fg-subtle taller than the rail; steps split the rail into equal segments 2px apart. Static, unless fun
 *   mode (motion/fun.tsx, a trial) is on: then the fill grows in and springs to each new value, the reading counts with
 *   it, the target tick pops as the fill passes it and steps light in turn. At rest it is the static Meter exactly.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { animate, AnimatePresence, motion, useMotionValueEvent, useTransform } from "motion/react";
import { byWorld, countText, useExit, useFun, useFunValue, useMaterial, useTransition, useTravel } from "@/motion";
import { ChartDeviceBody } from "./bodies/chart.device";

/* ----------------------------------------------------------------- types */

/** The five data hues, in their fixed order (R7). */
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
  /** Draws the chart's own legend above the plot when there are several series. Turn it off when a Legend drives the chart, so there is only one. */
  legend?: boolean;
  /** Extra classes for the chart's box, such as a top margin. */
  className?: string;
};

export type BarChartProps = ChartBaseProps;
export type LineChartProps = ChartBaseProps;
export type StackedBarChartProps = Omit<ChartBaseProps, "highlight" | "hues">;

/* ----------------------------------------------------------------- helpers */

const TOP = 8; // room above the plot
const AXIS = 28; // room under the plot for the category labels
const LABEL_GAP = 6; // between a value label and the plot
const FIGURE = 7.2; // advance of a 12px tabular figure in Geist (letters run narrower)
const MAX_BAR = 32;
type World = "press" | "flat" | "device";
/** The room a body keeps around the plot: a value axis on the left or none, and the space above the plot. */
type Frame = { axis: boolean; top: number };
const FRAME: Record<World, Frame> = {
  press: { axis: true, top: TOP },
  flat: { axis: true, top: TOP }, // today's chart
  device: { axis: false, top: 44 }, // the readout sits on the bezel above the screen
};
const MAX_RAIL = 8; // a stacked column: a rail, not a block
const RAIL_GAP = 2; // air between the segments of a stacked column, the Breakdown's

const mix = (percent: number) => `color-mix(in oklab, var(--fg) ${percent}%, transparent)`;
/** Fill of each series, as a class: 100%, 55%, 30% of the foreground. */
const FILL = ["fill-fg", "fill-[color-mix(in_oklab,var(--fg)_55%,transparent)]", "fill-[color-mix(in_oklab,var(--fg)_30%,transparent)]"];
const STROKE = ["var(--fg)", mix(55), mix(30)];
const EDGE = "stroke-[color-mix(in_oklab,var(--fg)_55%,transparent)]";
/** A line's dash (round caps add 1px to each end of a dash, so 0.5 draws a dot), and the same at the legend swatch's 16px, whose caps are square. */
type Dash = { line: string; swatch: string };
const DASHED: Dash = { line: "6 4", swatch: "4 3" };
const HUE_DASH: Partial<Record<ChartHue, Dash>> = {
  teal: DASHED,
  violet: { line: "0.5 5", swatch: "2 2" },
  rose: { line: "8 4 0.5 4", swatch: "6 2 2 2" },
};

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

/** How one series is painted: its bar fills at rest and emphasised, its line and marker colors, and the cues past color. */
type Paint = { rest: string; strong: string; stroke: string; marker: string; edge: boolean; dash?: Dash };

function paints(series: ChartSeries[], hues: boolean): Paint[] {
  let next = 0;
  return series.map((s, j) => {
    const hue = s.hue ?? (hues ? HUE_ORDER[next++ % HUE_ORDER.length] : undefined);
    if (hue) {
      const [rest, strong, stroke, marker] = HUE_PAINT[hue];
      return { rest, strong, stroke, marker, edge: false, dash: HUE_DASH[hue] };
    }
    /* The foreground: one series rests at 55% with the emphasised mark full; several step down by their place. */
    const level = Math.min(j, 2);
    return series.length === 1
      ? { rest: FILL[1]!, strong: FILL[0]!, stroke: STROKE[0]!, marker: STROKE[0]!, edge: false }
      : { rest: FILL[level]!, strong: FILL[level]!, stroke: STROKE[level]!, marker: STROKE[level]!, edge: level === 2, dash: level === 2 ? DASHED : undefined };
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
export type ChartGeometry = Geometry;

/** A category's stacked total: the sum of its non-negative values. */
const stackTotal = (series: ChartSeries[], i: number) => series.reduce((sum, s) => sum + Math.max(0, s.values[i] ?? 0), 0);

function layout(width: number, height: number, labels: string[], series: ChartSeries[], fmt: (v: number) => string, stacked = false, frame: Frame = FRAME.press): Geometry {
  const n = labels.length;
  const max = stacked
    ? Math.max(0, ...labels.map((_, i) => stackTotal(series, i)))
    : Math.max(0, ...series.flatMap((s) => s.values.slice(0, n)));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1]!;
  const valueChars = Math.max(...ticks.map((t) => fmt(t).length));
  const left = frame.axis ? Math.ceil(valueChars * FIGURE) + LABEL_GAP : 0;
  const plotW = Math.max(0, width - left);
  const plotH = Math.max(0, height - frame.top - AXIS);
  const slotW = n > 0 ? plotW / n : 0;
  const labelChars = Math.max(1, ...labels.map((l) => l.length));
  /* The last label may be pushed in from the right edge, which shortens its gap to the one before it. Allow for that. */
  const hang = Math.max(0, (labelChars * FIGURE) / 2 - slotW / 2);
  const step = slotW > 0 ? Math.max(1, Math.ceil((labelChars * FIGURE + 12 + hang) / slotW)) : 1;
  const base = frame.top + plotH;
  return {
    width,
    height,
    left,
    plotW,
    plotH,
    slotW,
    ticks,
    top: frame.top,
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

type Kind = "bar" | "line" | "stack";

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
  legend = true,
  className = "",
}: Required<Pick<ChartBaseProps, "height" | "xTitle" | "highlight" | "entrance">> & ChartBaseProps & { kind: Kind }) {
  const fmt = formatValue ?? groupDigits;
  const n = labels.length;
  const stacked = kind === "stack";
  const many = series.length > 1;
  const paint = useMemo(() => paints(series, hues || stacked), [series, hues, stacked]);
  const body: World = useMaterial();
  const [boxRef, width] = useWidth();
  const g = useMemo(
    () => layout(width, height, labels, series, fmt, stacked, FRAME[body]),
    [width, height, labels, series, fmt, stacked, body],
  );
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
    `${labels[i]}: ` +
    (many ? series.map((s) => `${s.name} ${withUnit(value(s, i))}`).join(", ") : withUnit(value(series[0]!, i))) +
    (stacked && many ? `, total ${withUnit(stackTotal(series, i))}` : "");

  const text = useMemo(() => {
    if (summary) return summary;
    const part = (s: ChartSeries) => {
      const v = s.values.slice(0, n);
      return `from ${fmt(v[0] ?? 0)} to ${fmt(v[n - 1] ?? 0)}, peak ${fmt(Math.max(0, ...v))}`;
    };
    if (stacked) {
      const totals = labels.map((_, i) => stackTotal(series, i));
      return `${label}: total from ${fmt(totals[0] ?? 0)} to ${fmt(totals[n - 1] ?? 0)}, peak ${fmt(Math.max(0, ...totals))}; ${series.map((s) => s.name).join(", ")}`;
    }
    return `${label}: ` + (many ? series.map((s) => `${s.name} ${part(s)}`).join("; ") : part(series[0]!));
  }, [summary, label, labels, series, n, many, fmt, stacked]);

  /* The tooltip sits above the tallest mark of the active column. */
  const tipTop = active === null ? 0 : stacked ? g.y(stackTotal(series, active)) : Math.min(...series.map((s) => g.y(value(s, active))));
  const tipCx = active === null ? 0 : g.cx(active);

  const enter = useTransition("responsive");
  const empty = n === 0 || series.length === 0;
  const bars = kind === "bar" ? barMarks(g, series, paint, n, emphasis, fmt) : null;
  const Body = byWorld(body, { press: PressBody, flat: FlatBody, device: ChartDeviceBody });
  const marks = bars ? (
    <BarRects bars={bars.bars} ring={ring !== null ? bars.ringOf(ring) : null} entrance={entrance} enter={enter} />
  ) : kind === "stack" ? (
    <Rails g={g} series={series} paint={paint} n={n} emphasis={emphasis} ring={ring} entrance={entrance} enter={enter} />
  ) : (
    <Lines g={g} series={series} paint={paint} n={n} emphasis={emphasis} ring={ring} entrance={entrance} enter={enter} />
  );

  return (
    <div data-chart={kind} data-body={body} className={"w-full " + className}>
      {many && legend && <Legend series={series} kind={kind} paint={paint} />}
      <div ref={boxRef} className="relative isolate w-full" style={{ height }}>
        {width > 0 && !empty && (
          <>
            <Body
              kind={kind}
              width={width}
              height={height}
              text={text}
              g={g}
              labels={labels}
              fmt={fmt}
              marks={marks}
              bars={bars ? bars.bars : []}
              traces={kind === "line" ? lineTraces(g, series, paint, n) : []}
              columns={kind === "stack" ? stackColumns(g, series, paint, n) : []}
              ring={ring === null ? null : bars ? bars.ringOf(ring) : focusBox(kind === "stack" ? "stack" : "line", g, series, ring)}
              band={many && active !== null ? { x: g.left + active * g.slotW, y: g.top, width: g.slotW, height: g.plotH } : null}
              reading={
                kind === "stack"
                  ? active !== null
                    ? fmt(stackTotal(series, active))
                    : null
                  : !many && emphasis !== null
                    ? fmt(value(series[0]!, emphasis))
                    : null
              }
              emphasis={emphasis}
              active={active}
              entrance={entrance}
              enter={enter}
            />

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
                  <TipContent
                    label={labels[active]!}
                    series={series}
                    many={many}
                    value={(s) => withUnit(value(s, active))}
                    total={stacked && many ? withUnit(stackTotal(series, active)) : undefined}
                  />
                </Tip>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* A table will not shrink to sr-only's 1px, so a wrapper clips it; otherwise a long one widens a phone's page. */}
      <div className="sr-only">
        <table className="[&_th]:font-normal">
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
              {stacked && many && <th scope="col">Total</th>}
            </tr>
          </thead>
          <tbody>
            {labels.map((l, i) => (
              <tr key={i}>
                <th scope="row">{l}</th>
                {series.map((s) => (
                  <td key={s.name}>{fmt(value(s, i))}</td>
                ))}
                {stacked && many && <td>{fmt(stackTotal(series, i))}</td>}
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
      <g shapeRendering="auto" className="fill-fg-subtle text-caption font-normal tabular-nums">
        {g.ticks.map((t) => (
          <text key={t} x={g.left - LABEL_GAP} y={g.y(t)} textAnchor="end" dominantBaseline="central">
            {fmt(t)}
          </text>
        ))}
        {labels.map((l, i) => {
          if ((n - 1 - i) % g.step !== 0) return null;
          /* The last label would hang past the right edge: right-align it to the edge instead. */
          const half = (l.length * FIGURE) / 2;
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

/** One bar as every body draws it: where it stands, how it is painted and what it says. */
export type ChartBar = {
  key: string;
  /** Its category and its series, by index. */
  index: number;
  series: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** The fill class for its state: the series' rest paint, or its strong one on the emphasised category. */
  fill: string;
  /** A 1px edge, for a third series too faint to stand alone. */
  edge: boolean;
  /** The emphasised category of a single series: the current, hovered or focused one. */
  strong: boolean;
  /** The series carries a data hue. */
  hue: boolean;
  /** The value as text, and whether its category shows its label (every nth does on a narrow chart). */
  text: string;
  labelled: boolean;
};
type Box = { x: number; y: number; width: number; height: number };

/** A series' line as Device traces it: one point per category, and how it is painted. */
export type ChartTrace = {
  key: string;
  series: number;
  points: { x: number; y: number }[];
  /** The series' rest fill class, used when it carries a data hue. */
  fill: string;
  hue: boolean;
  /** The series is told apart by a dash as well as its color (WCAG 1.4.1). */
  dashed: boolean;
};

/** One category of a stacked chart as Device lights it: its centre, and its parts from the baseline up. */
export type ChartColumn = {
  index: number;
  x: number;
  parts: { key: string; series: number; /** The part's height in px at the chart's scale. */ height: number; fill: string }[];
};

/** What a body draws (proposals/worlds.md, Bodies): the contract's resolved state for a chart. */
export type ChartBodyProps = {
  kind: "bar" | "line" | "stack";
  width: number;
  height: number;
  /** The image's summary, for the svg's aria-label. */
  text: string;
  g: ChartGeometry;
  labels: string[];
  fmt: (v: number) => string;
  /** The marks as Press and Flat draw them: the bars, the lines or the stacked rails, with their own focus ring. */
  marks: ReactNode;
  /** The same marks as data, for a body that draws them itself (Device): one of these is filled, by kind. */
  bars: ChartBar[];
  traces: ChartTrace[];
  columns: ChartColumn[];
  /** The focus ring's box, while a category has keyboard focus. */
  ring: Box | null;
  /** The faint band behind the active category, when there are several series. */
  band: Box | null;
  /** What the readout says: a single series' emphasised value, or the active stack's total; null when there is nothing to say. */
  reading: string | null;
  /** The emphasised category (the current, hovered or focused one), and the active one (hovered, focused or pinned). */
  emphasis: number | null;
  active: number | null;
  entrance: boolean;
  enter: ReturnType<typeof useTransition>;
};

/** Every bar's box and paint, and the focus ring's box for a category. */
function barMarks(g: Geometry, series: ChartSeries[], paint: Paint[], n: number, emphasis: number | null, fmt: (v: number) => string) {
  const k = series.length;
  const gap = 2;
  const group = k === 1 ? Math.min(MAX_BAR, Math.floor(g.slotW * 0.6)) : Math.min(k * MAX_BAR + gap * (k - 1), Math.floor(g.slotW * 0.7));
  const bw = Math.max(2, Math.floor((group - gap * (k - 1)) / k));
  const span = bw * k + gap * (k - 1);
  const baseline = g.y(0);
  const bars: ChartBar[] = [];
  for (let i = 0; i < n; i++) {
    const x0 = g.left + i * g.slotW + (g.slotW - span) / 2;
    series.forEach((s, j) => {
      const v = s.values[i] ?? 0;
      const h = v > 0 ? Math.max(2, baseline - g.y(v)) : 0;
      if (h === 0) return;
      /* One series rests (fg 55% or the hue's mark tone) and the emphasised bar is strong. Several series keep their own paint. */
      const p = paint[j]!;
      const strong = k === 1 && emphasis === i;
      bars.push({
        key: `${s.name}-${i}`,
        index: i,
        series: j,
        x: x0 + j * (bw + gap),
        y: baseline - h,
        width: bw,
        height: h,
        fill: strong ? p.strong : p.rest,
        edge: p.edge,
        strong,
        hue: p.rest.startsWith("fill-data-"),
        text: fmt(v),
        labelled: (n - 1 - i) % g.step === 0,
      });
    });
  }
  const ringOf = (i: number): Box => {
    const top = Math.min(...series.map((s) => g.y(s.values[i] ?? 0)));
    return { x: g.left + i * g.slotW + (g.slotW - span) / 2 - 4, y: top - 4, width: span + 8, height: baseline - top + 8 };
  };
  return { bars, ringOf };
}

/** Each series' points, for a body that traces the line itself. */
function lineTraces(g: Geometry, series: ChartSeries[], paint: Paint[], n: number): ChartTrace[] {
  return series.map((s, j) => ({
    key: s.name,
    series: j,
    points: Array.from({ length: n }, (_, i) => ({ x: g.cx(i), y: g.y(s.values[i] ?? 0) })),
    fill: paint[j]!.rest,
    hue: paint[j]!.rest.startsWith("fill-data-"),
    dashed: Boolean(paint[j]!.dash),
  }));
}

/** Each category's parts from the baseline up, at the scale the rails use. */
function stackColumns(g: Geometry, series: ChartSeries[], paint: Paint[], n: number): ChartColumn[] {
  const scale = g.plotH / Math.max(1, g.ticks[g.ticks.length - 1]!);
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    x: g.cx(i),
    parts: series
      .map((s, j) => ({ key: `${s.name}-${i}`, series: j, height: Math.max(0, s.values[i] ?? 0) * scale, fill: paint[j]!.rest }))
      .filter((p) => p.height > 0),
  }));
}

/** The focus ring's box for a category of a line or a stacked chart, as Lines and Rails place their own. */
function focusBox(kind: "line" | "stack", g: Geometry, series: ChartSeries[], i: number): Box {
  if (kind === "stack") {
    const bw = Math.max(2, Math.min(MAX_RAIL, Math.floor(g.slotW * 0.5)));
    const top = g.y(stackTotal(series, i));
    return { x: Math.round(g.left + i * g.slotW + (g.slotW - bw) / 2) - 4, y: top - 4, width: bw + 8, height: g.y(0) - top + 8 };
  }
  const ys = series.map((s) => g.y(s.values[i] ?? 0));
  return { x: g.cx(i) - 8, y: Math.min(...ys) - 8, width: 16, height: Math.max(...ys) - Math.min(...ys) + 16 };
}

/** The bars as Press and Flat draw them: the series' paint, growing from the baseline on the responsive tier, and the focus ring. */
function BarRects({ bars, ring, entrance, enter }: Pick<ChartBodyProps, "bars" | "ring" | "entrance" | "enter">) {
  return (
    <g aria-hidden="true">
      {bars.map((b) => (
        <motion.rect
          key={b.key}
          x={b.x}
          y={b.y}
          width={b.width}
          height={b.height}
          initial={entrance ? { scaleY: 0 } : false}
          animate={{ scaleY: 1, transition: enter }}
          style={{ originX: 0.5, originY: 1 }}
          strokeWidth={1}
          className={"transition-[fill] duration-(--dur-instant) ease-litt " + b.fill + (b.edge ? " " + EDGE : " stroke-transparent")}
        />
      ))}
      {ring && <rect {...ring} fill="none" strokeWidth={2} className="stroke-focus" />}
    </g>
  );
}

/** Flat: the chart as it has always been. A hairline grid, the value axis and the marks, on the page with no ground. */
function FlatBody({ width, height, text, g, labels, fmt, marks, band }: ChartBodyProps) {
  return (
    <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
      <Grid g={g} labels={labels} fmt={fmt} />
      {band && <rect {...band} className="fill-[color-mix(in_oklab,var(--fg)_4%,transparent)]" />}
      {marks}
    </svg>
  );
}

/** Press: the plot is a sunken well, the marks stand on its floor, and the category labels sit on a raised rail under it. */
function PressBody({ width, height, text, g, labels, fmt, marks, band }: ChartBodyProps) {
  return (
    <>
      <div aria-hidden="true" data-well="" className="absolute -z-10 rounded-control bg-tray shadow-(--tray-shade)" style={{ left: g.left, top: g.top, width: g.plotW, height: g.plotH }} />
      <div aria-hidden="true" className="absolute -z-10 rounded-control bg-block shadow-(--block-lift)" style={{ left: g.left, top: g.base + 6, width: g.plotW, height: AXIS - 8 }} />
      <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
        <Grid g={g} labels={labels} fmt={fmt} />
        {band && <rect {...band} className="fill-[color-mix(in_oklab,var(--fg)_4%,transparent)]" />}
        {marks}
      </svg>
    </>
  );
}

/* ----------------------------------------------------------------- stacked rails */

/**
 * One stacked rail per category, the first series at the bottom. Each segment keeps the control radius (set in CSS,
 * so the Customize radius and the registry's renamed token both reach it) and 2px of air from the next. A segment too
 * short to draw keeps 2px, taken from the air, so a tiny part still shows; a part of zero draws nothing.
 */
function Rails({ g, series, paint, n, emphasis, ring, entrance, enter }: MarksProps) {
  const bw = Math.max(2, Math.min(MAX_RAIL, Math.floor(g.slotW * 0.5)));
  const baseline = g.y(0);
  const scale = g.plotH / Math.max(1, g.ticks[g.ticks.length - 1]!);
  return (
    <g aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const x = Math.round(g.left + i * g.slotW + (g.slotW - bw) / 2);
        let y = baseline;
        const parts = series
          .map((s, j) => ({ j, v: Math.max(0, s.values[i] ?? 0) }))
          .filter((p) => p.v > 0)
          .map((p, k, all) => {
            const h = Math.max(2, p.v * scale - (k < all.length - 1 ? RAIL_GAP : 0));
            const top = y - h;
            y = top - (k < all.length - 1 ? RAIL_GAP : 0);
            return { ...p, top, h };
          });
        if (!parts.length) return null;
        return (
          <motion.g
            key={i}
            initial={entrance ? { scaleY: 0 } : false}
            animate={{ scaleY: 1, transition: enter }}
            style={{ originX: 0.5, originY: 1 }}
          >
            {parts.map((p) => {
              const fill = emphasis === i ? paint[p.j]!.strong : paint[p.j]!.rest;
              return (
                <rect
                  key={series[p.j]!.name}
                  x={x}
                  y={p.top}
                  width={bw}
                  height={p.h}
                  style={{ rx: `min(var(--radius-control), ${bw / 2}px)` } as CSSProperties}
                  className={"transition-[fill] duration-(--dur-instant) ease-litt " + fill}
                />
              );
            })}
          </motion.g>
        );
      })}
      {ring !== null && (
        <rect
          x={Math.round(g.left + ring * g.slotW + (g.slotW - bw) / 2) - 4}
          y={g.y(stackTotal(series, ring)) - 4}
          width={bw + 8}
          height={baseline - g.y(stackTotal(series, ring)) + 8}
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
            strokeDasharray={paint[j]!.dash?.line}
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
      {kind === "stack" ? (
        <rect x={2} y={2} width={12} height={4} style={{ rx: "min(var(--radius-control), 2px)" } as CSSProperties} className={paint.rest} />
      ) : kind === "bar" ? (
        <rect x={4} y={0} width={8} height={8} strokeWidth={1} className={paint.rest + (paint.edge ? " " + EDGE : " stroke-transparent")} />
      ) : (
        <line x1={0} x2={16} y1={4} y2={4} stroke={paint.stroke} strokeWidth={2} strokeDasharray={paint.dash?.swatch} />
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
  total,
}: {
  label: string;
  series: ChartSeries[];
  many: boolean;
  value: (s: ChartSeries) => string;
  /** A stacked column's total, under its parts. */
  total?: string;
}) {
  if (!many) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-fg-muted">{label}</span>
        <span className="text-caption font-normal tabular-nums">{value(series[0]!)}</span>
      </div>
    );
  }
  return (
    <div className="grid gap-1">
      <span className="text-fg-muted">{label}</span>
      {series.map((s) => (
        <div key={s.name} className="flex items-center justify-between gap-4">
          <span className="text-fg-muted">{s.name}</span>
          <span className="text-caption font-normal tabular-nums">{value(s)}</span>
        </div>
      ))}
      {total !== undefined && (
        <div className="flex items-center justify-between gap-4 border-t border-line in-[[data-material=flat]]:border-transparent pt-1">
          <span className="text-fg-muted">Total</span>
          <span className="text-caption font-normal tabular-nums">{total}</span>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- public charts */

/** Bars along a baseline, one column per category. One series is fg at 55% with the current bar full; up to three step down, or up to five in data hues. */
export function BarChart({ height = 240, xTitle = "Label", highlight = "last", entrance = true, ...rest }: BarChartProps) {
  return <Chart kind="bar" height={height} xTitle={xTitle} highlight={highlight} entrance={entrance} {...rest} />;
}

/** A 2px line over the same grid. One series is fg with a marker on the current point; up to three step down, the third dashed, or up to five in data hues, the third to fifth dashed, dotted and dash-dotted. */
export function LineChart({ height = 240, xTitle = "Label", highlight = "last", entrance = true, ...rest }: LineChartProps) {
  return <Chart kind="line" height={height} xTitle={xTitle} highlight={highlight} entrance={entrance} {...rest} />;
}

/** The parts of each category as one thin stacked rail, a data hue per series, with the total in the tooltip. Up to five series. */
export function StackedBarChart({ height = 240, xTitle = "Label", entrance = true, ...rest }: StackedBarChartProps) {
  return <Chart kind="stack" height={height} xTitle={xTitle} highlight="none" hues entrance={entrance} {...rest} />;
}

/* ----------------------------------------------------------------- Meter */

export type MeterProps = {
  /** What is measured, at the start of the row: "Storage". It names the meter for assistive tech. */
  label: string;
  /** The value, from 0 to max. */
  value: number;
  /** The value that fills the rail. */
  max?: number;
  /** The reading at the end of the row, in tabular figures: "42 of 100 GB". Defaults to the percentage. */
  valueText?: string;
  /** Fills the rail with one of the five data hues instead of the foreground, when the color says which thing this is (R7). */
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

const TRACK = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)] in-[[data-material=flat]]:bg-surface-3";

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

  /* Fun mode (motion/fun.tsx): the fill grows in from the start and springs to each new value, the reading counts with
     it, and the target tick pops as the fill passes it. Moving, the fill slides (a transform, so its rounded end never
     squashes); still, it is the plain fill below. Off, none of this runs. */
  const fun = useFun();
  const grow = useFunValue(percent, { count: valueText ? value : percent });
  const slide = useTransform(grow.value, (r) => `${r - 100}%`);
  const tick = useRef<HTMLSpanElement>(null);
  const passed = useRef(percent);
  useMotionValueEvent(grow.value, "change", (r) => {
    const el = tick.current;
    if (fun && el && aim !== null && passed.current < aim && r >= aim) {
      animate(el, { scale: [1.8, 1] }, fun.pop).then(() => void (el.style.transform = ""));
    }
    passed.current = r;
  });
  const segments = useRef<(HTMLDivElement | null)[]>([]);
  useLayoutEffect(() => {
    if (!fun || !count) return;
    /* Steps light in turn on arrival, each popping into place. */
    const runs = segments.current.slice(0, filled).map((el, i) => {
      if (!el) return null;
      return animate(el, { opacity: [0, 1], scale: [0.3, 1] }, { ...fun.pop, delay: i * fun.wave * 6 });
    });
    Promise.all(runs).then(() => segments.current.forEach((el) => el && Object.assign(el.style, { opacity: "", transform: "" })));
    return () => runs.forEach((r) => r?.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the arrival plays on mount only
  }, []);
  const shownReading = fun && !count ? (valueText ? countText(valueText, value, grow.shown) : `${Math.round(grow.shown)}%`) : reading;

  return (
    <div className={"grid gap-2 " + className}>
      <div className="flex items-baseline justify-between gap-4">
        <span id={id} className="text-small text-fg">
          {label}
        </span>
        <span className="text-caption font-normal tabular-nums text-fg-subtle">{shownReading}</span>
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
              <div
                key={i}
                ref={(el) => {
                  segments.current[i] = el;
                }}
                className={"h-full flex-1 rounded-control " + (i < filled ? fill : TRACK)}
              />
            ))
          ) : grow.moving ? (
            <motion.div className={"h-full w-full rounded-control " + fill} style={{ x: slide }} />
          ) : (
            <div className={"h-full rounded-control " + fill} style={{ width: `${percent}%` }} />
          )}
        </div>
        {/* The target: a neutral tick taller than the rail, so it reads over the fill and the track alike. */}
        {aim !== null && (
          <span ref={tick} aria-hidden="true" className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-fg-subtle" style={{ left: `${aim}%` }} />
        )}
      </div>
    </div>
  );
}
