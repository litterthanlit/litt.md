/**
 * Heatmap: a dot matrix whose depth says how much. One data hue (P11) in four steps over an empty dot, so
 * the eye reads where the weight sits: usage per day in a month, deploys per day over a year, mail per hour
 * of the week. Plain DOM and CSS, no chart library.
 *
 * - Color (components.md, Heatmap): zero is an empty dot at fg 8%. The four steps are the hue's mark tone over
 *   transparent at 30, 55, 80 and 100%, so one hue carries one quantity (P11) and the dots fit any surface.
 *   `null` (no data: a day still to come, a day the month does not have) draws nothing. The default steps are
 *   the quartiles of the non-zero values, so the four levels hold about the same number of dots. The legend
 *   under the grid is "Less", the five levels as dots, "More".
 * - Anatomy: circles on a pitch of the dot plus 4px of air (12px for the default 8px dot). Each row has a label
 *   at the start (mono caption, fg-subtle, in a column as wide as the longest label) and an optional total at
 *   the end (mono small, fg, tabular, end-aligned). Optional ticks over chosen columns name them (month names
 *   over a year of weeks). A label needs 16px of height, so when rows are closer than that (the default pitch)
 *   every second row shows its label and its total, counted from the first, like the chart's every nth axis
 *   label; every row keeps its name and its total for a screen reader.
 * - Fit: dots keep their size. The label and total columns stay put and the dots between them scroll sideways
 *   inside their own box, starting at the end so the latest column shows, and staying at the end when the box
 *   is resized. The page itself never scrolls sideways. Padding inside the scroll box keeps the focus ring
 *   from being clipped, and an 8px fade on an edge with more dots beyond it (a mask, static) says which way
 *   to scroll, so a clipped dot is not left half drawn.
 * - Interaction: one pointer layer covers the dots, as in the chart, because a 12px dot is far smaller than a
 *   finger. The dot under a mouse is ringed with a 1px fg outline and shows the Tooltip's look above it (solid
 *   surface-3, shadow-tooltip): the name in fg-muted and the value in mono, kept inside the heatmap and
 *   following the pointer from dot to dot with no re-entry. A dot with no data does not react to a pointer.
 *   Touch: when the grid fits, a finger scrubs across the dots (touch-action pan-y), and the dot under it is
 *   active and shows its tooltip, which stays until the next touch elsewhere. When the grid scrolls, a drag
 *   must scroll it (pan-x pan-y), so a tap picks the dot instead. Hover is a color change on the instant tier.
 * - Keyboard: role="grid" with rows and gridcells, one tab stop (roving tabindex) on the last dot of the first
 *   row, which is in view. Arrows move in two dimensions without wrapping, Home and End go to the row's ends,
 *   Ctrl+Home and Ctrl+End to the grid's ends, Esc hides the tooltip without moving focus. A focused dot gets
 *   a 2px focus ring, 2px away, when :focus-visible matches, and its tooltip.
 * - Accessibility: the grid is named by `label` and described by a summary ("Deploys per day, 214 in all, most
 *   on Wed, week of 12 Oct with 31"). Each dot is named "Wed, week of 12 Oct, 31 deploys" ("no data" for
 *   null), so color is never the only signal. The visible row labels and totals are drawn in their own columns
 *   and hidden from screen readers; the same words sit in each row as a hidden row header and cell.
 * - Motion: none beyond the tooltip's responsive entrance, the chart's. Reduced motion is the hooks' job.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";

/* ----------------------------------------------------------------- types */

/** The five data hues, in their fixed order (P11). */
export type HeatmapHue = "blue" | "amber" | "teal" | "violet" | "rose";

/** One row of dots: a label, one value per column, and an optional total. */
export type HeatmapRow = {
  /** What the row is, in a word or two: "Mon", "August". It sits at the start of the row and names every dot in it. */
  label: string;
  /** One value per column, oldest first. Zero is an empty dot and `null` draws nothing, such as a day still to come. */
  values: (number | null)[];
  /** A total shown at the end of the row, already formatted: "25,998". */
  total?: string;
};

export type HeatmapProps = {
  /** The grid's name and what it shows, in a few words: "Deploys per day, last 53 weeks". It labels the grid and starts the summary. */
  label: string;
  /** The rows, top to bottom. Each has a label, its values and an optional total. */
  rows: HeatmapRow[];
  /** One name per column, shared by every row, used in the tooltip and each dot's name: "week of 12 Oct", "14:00". Leave it out and columns are numbered. */
  columns?: string[];
  /** Labels over chosen columns, such as month names over a year of weeks: `{ index: 4, label: "Nov" }`. Keep them at least a label's width apart. */
  columnTicks?: { index: number; label: string }[];
  /** The one data hue the steps are made of. Pick it for what the grid is about and keep it the same for the same thing across a view. */
  hue?: HeatmapHue;
  /** Where each of the four levels starts, lowest first. Zero is always the empty dot, and a value under the first step is still the lightest level. The default is the quartiles of the non-zero values. */
  steps?: [number, number, number, number];
  /** Turns a value into text for the tooltip, the dots' names and the summary: `(v) => \`${v} s\``. The default groups thousands. */
  formatValue?: (value: number) => string;
  /** What the values count, said after the number in the tooltip and the dots' names: "deploys". Pass ["deploy", "deploys"] to say the first for exactly 1. Leave it out when the label says it. */
  unit?: string | [one: string, other: string];
  /** The dot's diameter in px. The pitch is this plus 4px of air, and below a 12px dot only every second row shows its label and its total. Use 12 when every row must be named. */
  cell?: number;
  /** Replaces the generated summary that describes the grid, such as "Deploys per day, 214 in all, most on 12 Oct with 31". */
  summary?: string;
  /** Extra classes for the heatmap's box, such as a top margin. */
  className?: string;
};

/* ----------------------------------------------------------------- tokens and helpers */

const GAP = 4; // air between dots
const LABEL_H = 16; // a row label needs this much height
const TICK_H = 16; // the row of column ticks
const TICK_GAP = 8; // between the ticks and the first row
const MONO = 7.2; // advance of a 12px mono character
const FADE = 8; // the soft edge where more dots lie beyond the scroll box

/** An empty dot: the foreground at 8%. */
const EMPTY = "bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]";

/** The four steps of each hue as classes, 30, 55, 80 and 100% of the mark tone over transparent. Literal strings, so Tailwind sees them. */
const HUE: Record<HeatmapHue, readonly [string, string, string, string]> = {
  blue: [
    "bg-[color-mix(in_oklab,var(--data-blue)_30%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-blue)_55%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-blue)_80%,transparent)]",
    "bg-data-blue",
  ],
  amber: [
    "bg-[color-mix(in_oklab,var(--data-amber)_30%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-amber)_55%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-amber)_80%,transparent)]",
    "bg-data-amber",
  ],
  teal: [
    "bg-[color-mix(in_oklab,var(--data-teal)_30%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-teal)_55%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-teal)_80%,transparent)]",
    "bg-data-teal",
  ],
  violet: [
    "bg-[color-mix(in_oklab,var(--data-violet)_30%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-violet)_55%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-violet)_80%,transparent)]",
    "bg-data-violet",
  ],
  rose: [
    "bg-[color-mix(in_oklab,var(--data-rose)_30%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-rose)_55%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-rose)_80%,transparent)]",
    "bg-data-rose",
  ],
};

const groupDigits = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });

type Cell = { r: number; c: number };
const keyOf = (a: Cell | null) => (a ? `${a.r}:${a.c}` : "");
const same = (a: Cell | null, b: Cell | null) => keyOf(a) === keyOf(b);

/** The value at a fraction of the sorted list, interpolating between neighbours. */
function quantile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const at = (sorted.length - 1) * p;
  const lo = Math.floor(at);
  const hi = Math.ceil(at);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (at - lo);
}

/** The quartiles of the non-zero values: the level 1 start, then the first, second and third quartile. */
function quartileSteps(rows: HeatmapRow[]): [number, number, number, number] {
  const values = rows.flatMap((r) => r.values).filter((v): v is number => v !== null && Number.isFinite(v) && v > 0);
  if (values.length === 0) return [1, 2, 3, 4];
  const sorted = values.sort((a, b) => a - b);
  return [sorted[0]!, quantile(sorted, 0.25), quantile(sorted, 0.5), quantile(sorted, 0.75)];
}

/** 0 for an empty dot, then 1 to 4. A non-zero value under the first step is still level 1. */
function levelOf(value: number, steps: readonly number[]) {
  if (!(value > 0)) return 0;
  let level = 1;
  for (let k = 1; k < 4; k++) if (value >= steps[k]!) level = k + 1;
  return level;
}

/* ----------------------------------------------------------------- the heatmap */

/** A dot matrix of rows and columns whose depth says how much: one data hue in four steps over an empty dot. */
export function Heatmap({
  label,
  rows,
  columns,
  columnTicks,
  hue = "blue",
  steps,
  formatValue,
  unit,
  cell: cellProp = 8,
  summary,
  className = "",
}: HeatmapProps) {
  const fmt = formatValue ?? groupDigits;
  const cell = Math.max(4, Math.round(cellProp));
  const pitch = cell + GAP;
  /* Labels are 16px tall, so rows closer than that name every nth row, counted from the first. */
  const labelEvery = Math.max(1, Math.ceil(LABEL_H / pitch));
  const cols = Math.max(0, ...rows.map((r) => r.values.length));
  const gridW = Math.max(0, cols * pitch - GAP);
  const gridH = Math.max(0, rows.length * pitch - GAP);
  const hasTicks = !!columnTicks && columnTicks.length > 0;
  const hasTotals = rows.some((r) => r.total !== undefined);
  const lead = hasTicks ? TICK_H + TICK_GAP : 0;
  const scale = steps ?? quartileSteps(rows);

  const unitFor = (v: number) => (Array.isArray(unit) ? (v === 1 ? unit[0] : unit[1]) : unit);
  const withUnit = (v: number) => fmt(v) + (unit ? ` ${unitFor(v)}` : "");
  const colName = (c: number) => columns?.[c] ?? `column ${c + 1}`;
  const cellName = (r: number, c: number) => [rows[r]?.label, colName(c)].filter(Boolean).join(", ");
  const valueText = (r: number, c: number) => {
    const v = rows[r]?.values[c];
    return v === null || v === undefined ? "no data" : withUnit(v);
  };

  const sumId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cells = useRef(new Map<string, HTMLDivElement>());

  /* Which dot is active: a hovered one, else a focused one, else a pinned one (a touch). */
  const [hover, setHover] = useState<Cell | null>(null);
  const [focus, setFocus] = useState<Cell | null>(null);
  const [pinned, setPinned] = useState<Cell | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const active = dismissed ? null : (hover ?? focus ?? pinned);
  const activeKey = keyOf(active);
  useEffect(() => setDismissed(false), [keyOf(hover), keyOf(focus), keyOf(pinned)]);

  /* The one tab stop: the last dot of the first row that has data, which is in view when the grid starts at the end. */
  const [tab, setTab] = useState<Cell | null>(null);
  const stop = useMemo<Cell | null>(() => {
    const first = rows[0];
    if (!first) return null;
    if (tab && rows[tab.r] && tab.c < rows[tab.r]!.values.length) return tab;
    let c = first.values.length - 1;
    while (c > 0 && first.values[c] === null) c--;
    return { r: 0, c: Math.max(0, c) };
  }, [rows, tab]);

  /* Sideways scroll: start at the end, and stay there on resize until the person scrolls away. */
  const stick = useRef(true);
  const [overflowing, setOverflowing] = useState(false);
  /* Which edges have more dots beyond them: those edges fade, so a half-clipped dot reads as "more this way". */
  const [edges, setEdges] = useState({ start: false, end: false });
  const [tick, setTick] = useState(0);
  const readEdges = (el: HTMLElement) => {
    const start = el.scrollLeft > 1;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  };
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sync = () => {
      if (stick.current) el.scrollLeft = el.scrollWidth;
      setOverflowing(el.scrollWidth > el.clientWidth + 1);
      readEdges(el);
      setTick((t) => t + 1);
    };
    sync();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [gridW]);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stick.current = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    readEdges(el);
    if (active) setTick((t) => t + 1);
  };

  /* A touch pins the tooltip; the next touch anywhere else clears it. */
  useEffect(() => {
    if (!pinned) return;
    const away = (e: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setPinned(null);
    };
    document.addEventListener("pointerdown", away, true);
    return () => document.removeEventListener("pointerdown", away, true);
  }, [pinned]);

  /* Where the tooltip goes: above the active dot, in the heatmap's own coordinates. */
  const [tip, setTip] = useState<{ x: number; top: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = active ? cells.current.get(activeKey) : null;
    const root = rootRef.current;
    const scroller = scrollRef.current;
    if (!el || !root || !scroller) return setTip(null);
    const c = el.getBoundingClientRect();
    const s = scroller.getBoundingClientRect();
    const r = root.getBoundingClientRect();
    const x = c.left + c.width / 2;
    if (x < s.left || x > s.right) return setTip(null);
    setTip({ x: x - r.left, top: c.top - r.top, width: r.width });
  }, [activeKey, tick, cell]);

  /* The dot under a pointer, or null in the air around the grid or on a dot with no data. */
  const cellAt = (clientX: number, clientY: number): Cell | null => {
    const box = overlayRef.current?.getBoundingClientRect();
    if (!box) return null;
    const c = Math.floor((clientX - box.left) / pitch);
    const r = Math.floor((clientY - box.top) / pitch);
    const row = rows[r];
    if (!row || c < 0 || c >= row.values.length || row.values[c] === null) return null;
    return { r, c };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const next = cellAt(e.clientX, e.clientY);
    if (e.pointerType === "touch") {
      if (e.buttons && !overflowing) setPinned(next);
    } else setHover((prev) => (same(prev, next) ? prev : next));
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    /* While the grid scrolls, a drag is a scroll, so a touch picks its dot on release. */
    if (e.pointerType !== "touch" || overflowing) return;
    const next = cellAt(e.clientX, e.clientY);
    setPinned((p) => (same(p, next) ? null : next));
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch" || !overflowing) return;
    const next = cellAt(e.clientX, e.clientY);
    setPinned((p) => (same(p, next) ? null : next));
  };

  /* Keyboard: arrows in two dimensions, Home and End along a row, Ctrl with them across the grid. */
  const cellFrom = (target: EventTarget | null): Cell | null => {
    const el = (target as HTMLElement | null)?.closest?.("[data-r]") as HTMLElement | null;
    return el ? { r: Number(el.dataset.r), c: Number(el.dataset.c) } : null;
  };
  const focusCell = (to: Cell) => cells.current.get(keyOf(to))?.focus();
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      if (active) setDismissed(true);
      return;
    }
    const from = cellFrom(e.target);
    if (!from) return;
    const len = (r: number) => Math.max(1, rows[r]?.values.length ?? 1);
    const lastRow = rows.length - 1;
    const across = e.ctrlKey || e.metaKey;
    let to: Cell | null = null;
    if (e.key === "ArrowRight") to = { r: from.r, c: Math.min(len(from.r) - 1, from.c + 1) };
    else if (e.key === "ArrowLeft") to = { r: from.r, c: Math.max(0, from.c - 1) };
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const r = Math.max(0, Math.min(lastRow, from.r + (e.key === "ArrowDown" ? 1 : -1)));
      to = { r, c: Math.min(from.c, len(r) - 1) };
    } else if (e.key === "Home") to = across ? { r: 0, c: 0 } : { r: from.r, c: 0 };
    else if (e.key === "End") to = across ? { r: lastRow, c: len(lastRow) - 1 } : { r: from.r, c: len(from.r) - 1 };
    if (!to) return;
    e.preventDefault();
    focusCell(to);
  };

  const text = useMemo(() => {
    if (summary) return summary;
    let total = 0;
    let best = 0;
    let at: Cell | null = null;
    rows.forEach((row, r) =>
      row.values.forEach((v, c) => {
        if (v === null || !Number.isFinite(v)) return;
        total += v;
        if (v > best) {
          best = v;
          at = { r, c };
        }
      }),
    );
    const head = `${label}, ${fmt(total)} in all`;
    const where = at as Cell | null;
    return where ? `${head}, most on ${cellName(where.r, where.c)} with ${fmt(best)}` : head;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, label, rows, columns, fmt]);

  if (rows.length === 0 || cols === 0) return null;

  const tickLeft = (index: number, text: string) => {
    const x = index * pitch;
    return x + text.length * MONO > gridW ? { right: 0 } : { left: x };
  };

  return (
    <div
      ref={rootRef}
      className={"relative grid w-fit max-w-full grid-cols-[auto_minmax(0,max-content)_auto] " + className}
    >
      {/* Row labels: their own column, so they stay put while the dots scroll. The same words sit in each row as a hidden header. */}
      <div aria-hidden="true" className="pt-1 pr-4 font-mono text-caption font-normal whitespace-nowrap text-fg-subtle">
        {lead > 0 && <div style={{ height: lead }} />}
        <div className="flex flex-col" style={{ gap: GAP }}>
          {rows.map((row, r) => (
            <div key={r} className="flex items-center" style={{ height: cell }}>
              <span className={"litt-trim" + (r % labelEvery === 0 ? "" : " invisible")}>{row.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-w-0 scroll-px-3 overflow-x-auto overflow-y-hidden px-1 py-1 [scrollbar-color:var(--line-strong)_transparent] [scrollbar-width:thin]"
        style={
          edges.start || edges.end
            ? {
                maskImage: `linear-gradient(to right, ${edges.start ? "transparent" : "black"} 0, black ${FADE}px, black calc(100% - ${FADE}px), ${edges.end ? "transparent" : "black"} 100%)`,
              }
            : undefined
        }
      >
        <div className="relative" style={{ width: gridW }}>
          {hasTicks && (
            <div
              aria-hidden="true"
              className="relative font-mono text-caption font-normal whitespace-nowrap text-fg-subtle"
              style={{ height: TICK_H, marginBottom: TICK_GAP }}
            >
              {columnTicks!.map((t) => (
                <span key={t.index} className="absolute top-0 flex items-center" style={{ height: TICK_H, ...tickLeft(t.index, t.label) }}>
                  <span className="litt-trim">{t.label}</span>
                </span>
              ))}
            </div>
          )}

          <div role="grid" aria-label={label} aria-describedby={sumId} onKeyDown={onKeyDown} onFocus={(e) => {
            const c = cellFrom(e.target);
            if (c) {
              setFocus(c);
              setTab(c);
            }
          }} onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(null);
          }} className="flex flex-col" style={{ gap: GAP }}>
            {rows.map((row, r) => (
              <div key={r} role="row" className="flex items-center" style={{ gap: GAP, height: cell }}>
                <span role="rowheader" className="sr-only">
                  {row.label}
                </span>
                {row.values.map((v, c) => {
                  const level = v === null ? -1 : levelOf(v, scale);
                  const ringed = active !== null && active.r === r && active.c === c;
                  return (
                    <div
                      key={c}
                      ref={(el) => {
                        if (el) cells.current.set(`${r}:${c}`, el);
                        else cells.current.delete(`${r}:${c}`);
                      }}
                      role="gridcell"
                      data-r={r}
                      data-c={c}
                      tabIndex={stop && stop.r === r && stop.c === c ? 0 : -1}
                      aria-label={`${cellName(r, c)}, ${valueText(r, c)}`}
                      style={{ width: cell, height: cell }}
                      className={
                        "shrink-0 rounded-pill transition-[background-color] duration-(--dur-instant) ease-litt " +
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                        (ringed ? "outline-1 outline-offset-1 outline-fg " : "") +
                        (level < 0 ? "" : level === 0 ? EMPTY : HUE[hue][level - 1])
                      }
                    />
                  );
                })}
                {row.total !== undefined && (
                  <span role="gridcell" className="sr-only">
                    Total {row.total}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* One layer takes the pointer, so the target is the whole grid and not a 12px dot. When the grid fits, a touch
              scrubs across it (pan-y); when it scrolls, a drag has to scroll it, so a touch picks a dot on release. */}
          <div
            ref={overlayRef}
            aria-hidden="true"
            className={"absolute inset-x-0 select-none " + (overflowing ? "touch-pan-x touch-pan-y" : "touch-pan-y")}
            style={{ top: lead, height: gridH }}
            onPointerMove={onPointerMove}
            onPointerLeave={(e) => {
              if (e.pointerType !== "touch") setHover(null);
            }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          />
        </div>
      </div>

      {/* Totals: their own column at the end of the rows. */}
      {hasTotals && (
        <div aria-hidden="true" className="pt-1 pl-4 text-right font-mono text-small whitespace-nowrap text-fg tabular-nums">
          {lead > 0 && <div style={{ height: lead }} />}
          <div className="flex flex-col" style={{ gap: GAP }}>
            {rows.map((row, r) => (
              <div key={r} className="flex items-center justify-end" style={{ height: cell }}>
                {/* The same rule as the labels: a total is a line of text, so rows closer than one show every nth. */}
                <span className={"litt-trim" + (r % labelEvery === 0 ? "" : " invisible")}>{row.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Legend hue={hue} cell={cell} />

      <AnimatePresence>
        {active && tip && (
          <Tip key="tip" cx={tip.x} markTop={tip.top} width={tip.width}>
            <div className="flex items-center gap-3">
              <span className="text-fg-muted">{cellName(active.r, active.c)}</span>
              <span className="font-mono text-caption font-normal tabular-nums">{valueText(active.r, active.c)}</span>
            </div>
          </Tip>
        )}
      </AnimatePresence>

      <span id={sumId} className="sr-only">
        {text}
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------- legend */

function Legend({ hue, cell }: { hue: HeatmapHue; cell: number }) {
  return (
    <div aria-hidden="true" className="col-start-2 col-end-3 mt-3 flex items-center gap-2 justify-self-end font-mono text-caption font-normal whitespace-nowrap text-fg-subtle">
      <span>Less</span>
      <span className="flex items-center" style={{ gap: GAP }}>
        {[EMPTY, ...HUE[hue]].map((fill, i) => (
          <span key={i} className={"rounded-pill " + fill} style={{ width: cell, height: cell }} />
        ))}
      </span>
      <span>More</span>
    </div>
  );
}

/* ----------------------------------------------------------------- tooltip */

/** The chart's tooltip look: solid surface-3, shadow-tooltip, above the dot and kept inside the heatmap. */
function Tip({ cx, markTop, width, children }: { cx: number; markTop: number; width: number; children: ReactNode }) {
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
    <div aria-hidden="true" className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full" style={{ left, top: markTop - 8 }}>
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
