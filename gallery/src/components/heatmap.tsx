/**
 * Heatmap: a dot matrix whose depth says how much. One data hue (R7) in four steps over an empty dot, so
 * the eye reads where the weight sits: usage per day in a month, deploys per day over a year, mail per hour
 * of the week. Plain DOM and CSS, no chart library.
 *
 * - Color (components.md, Heatmap): zero is an empty dot at fg 8%. The four steps are the hue's mark tone over
 *   transparent at 30, 55, 80 and 100%, so one hue carries one quantity (R7) and the dots fit any surface.
 *   `null` (no data: a day still to come, a day the month does not have) draws nothing. The default steps are
 *   the quartiles of the non-zero values, so the four levels hold about the same number of dots. The legend
 *   under the grid is "Less", the five levels as dots, "More".
 * - Anatomy: circles on a pitch of the dot plus 4px of air (12px for the default 8px dot). Each row has a label
 *   at the start (caption, fg-subtle, in a column as wide as the longest label) and an optional total at
 *   the end (small, fg, tabular, end-aligned). Optional ticks over chosen columns name them (month names
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
 *   surface-3, shadow-tooltip): the name in fg-muted and the value in tabular figures, kept inside the heatmap and
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
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on):
 *   - Arrival, in two beats: the empty grid pops in on a diagonal wave, then the data fills in by level, the quietest
 *     dots first and the busiest last, and totals that are plain counts count up as their rows fill. It is drawn on one
 *     canvas over the grid, on fun mode's own springs, because hundreds of animated dots would each need a compositing
 *     layer; the real grid waits under it (transparent, still focusable) and is what remains when the last dot lands.
 *   - A lens follows the pointer, as on the Apple Watch's app grid: dots near it swell and ease their neighbours aside,
 *     falling off over two and a half dots, deeper while pressed. It writes transforms itself, once a frame, to the
 *     dots it reaches, and lets go of each one as it leaves. The ring and the tooltip work as they always do.
 *   At rest it is the static Heatmap exactly. Reduced motion turns all of it off.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { animate, AnimatePresence, motion, spring, useMotionValue, useMotionValueEvent, useSpring } from "motion/react";
import { countText, FUN_SPRINGS, useExit, useFun, useTransition, useTravel } from "@/motion";

/* ----------------------------------------------------------------- types */

/** The five data hues, in their fixed order (R7). */
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
const FIGURE = 7.2; // advance of a 12px tabular figure in Geist (letters run narrower)
const FADE = 8; // the soft edge where more dots lie beyond the scroll box

/* Fun mode's lens: how far it reaches, in dots, how much the centre swells and how far neighbours step aside, in px. */
const LENS_REACH = 2.6;
const LENS_SWELL = 0.55;
const LENS_PUSH = 3;
/* Fun mode's arrival: when the data starts filling in after the grid, and the extra beat per level, in seconds. */
const DATA_AT = 0.32;
const DATA_PER_LEVEL = 0.11;

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

  /* ---------------------------------------------------------- fun mode */

  const fun = useFun();
  /* The pointer in dots, smoothed so the lens glides. Strength 0 is no lens, 1 is a hover, more is a press. */
  const rawX = useMotionValue(-10);
  const rawY = useMotionValue(-10);
  const lensX = useSpring(rawX, { visualDuration: FUN_SPRINGS.follow.time, bounce: FUN_SPRINGS.follow.bounce });
  const lensY = useSpring(rawY, { visualDuration: FUN_SPRINGS.follow.time, bounce: FUN_SPRINGS.follow.bounce });
  const strength = useMotionValue(0);
  const lensed = useRef(new Set<HTMLDivElement>());
  const lensFrame = useRef(0);
  const paintLens = () => {
    lensFrame.current = 0;
    const x = lensX.get();
    const y = lensY.get();
    const s = strength.get();
    const touched = new Set<HTMLDivElement>();
    if (s > 0.001) {
      const reach = Math.ceil(LENS_REACH);
      for (let r = Math.max(0, Math.floor(y) - reach); r <= Math.min(rows.length - 1, Math.ceil(y) + reach); r++) {
        for (let c = Math.max(0, Math.floor(x) - reach); c <= Math.min(cols - 1, Math.ceil(x) + reach); c++) {
          const el = cells.current.get(`${r}:${c}`);
          if (!el) continue;
          const dx = c - x;
          const dy = r - y;
          const d = Math.hypot(dx, dy);
          const f = Math.max(0, 1 - d / LENS_REACH) ** 2 * s;
          if (f < 0.002) continue;
          const push = d > 0.001 ? (LENS_PUSH * f) / d : 0;
          el.style.transform = `translate(${(dx * push).toFixed(2)}px, ${(dy * push).toFixed(2)}px) scale(${(1 + LENS_SWELL * f).toFixed(3)})`;
          touched.add(el);
        }
      }
    }
    /* The dots the lens just left go back to their own, untransformed markup. */
    lensed.current.forEach((el) => !touched.has(el) && (el.style.transform = ""));
    lensed.current = touched;
  };
  const scheduleLens = () => {
    if (!lensFrame.current) lensFrame.current = requestAnimationFrame(paintLens);
  };
  useMotionValueEvent(lensX, "change", scheduleLens);
  useMotionValueEvent(lensY, "change", scheduleLens);
  useMotionValueEvent(strength, "change", scheduleLens);
  useEffect(() => {
    if (fun) return;
    /* Fun mode turned off: let go of every dot. */
    strength.jump(0);
    lensed.current.forEach((el) => (el.style.transform = ""));
    lensed.current.clear();
  }, [fun, strength]);
  useEffect(() => () => cancelAnimationFrame(lensFrame.current), []);
  /* The pointer in the grid's own units, so the lens stays exact inside a scaled parent. */
  const lensAt = (e: PointerEvent<HTMLDivElement>) => {
    const box = overlayRef.current?.getBoundingClientRect();
    if (!fun || !box || !box.width) return;
    const k = gridW / box.width;
    const x = ((e.clientX - box.left) * k + GAP / 2) / pitch - 0.5;
    const y = ((e.clientY - box.top) * k + GAP / 2) / pitch - 0.5;
    if (strength.get() === 0) {
      /* A fresh entry: the lens starts where the pointer is, never sliding in from where it last left. */
      lensX.jump(x);
      lensY.jump(y);
    }
    rawX.set(x);
    rawY.set(y);
    if (strength.get() < 1 && !strength.isAnimating()) animate(strength, 1, fun.follow);
  };

  /* Arrival: one canvas draws the grid's two beats while the real grid waits under it. */
  const [arriving, setArriving] = useState(() => !!fun);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!arriving) return;
    const el = canvasRef.current;
    const ctx = el?.getContext("2d");
    const probe = probeRef.current;
    if (!fun || !el || !ctx || !probe) return setArriving(false);
    /* The tokens, resolved by the browser: the empty dot and the four steps, in the current theme. */
    const colors = [EMPTY, ...HUE[hue]].map((cls) => {
      probe.className = cls + " hidden";
      return getComputedStyle(probe).backgroundColor;
    });
    /* Drawn at the size it shows, so the dots are crisp in a scaled parent too. */
    const shown = el.getBoundingClientRect().width / Math.max(1, gridW);
    const px = Math.max(1, devicePixelRatio * shown);
    el.width = Math.round(gridW * px);
    el.height = Math.round(gridH * px);
    ctx.setTransform(px, 0, 0, px, 0, 0);
    const pop = spring({ keyframes: [0, 1], visualDuration: FUN_SPRINGS.pop.time, bounce: FUN_SPRINGS.pop.bounce });
    const at = (t: number) => (t <= 0 ? 0 : pop.next(t * 1000).value);
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const half = cell / 2;
    const levels = rows.map((row) => row.values.map((v) => (v === null ? -1 : levelOf(v, scale))));
    const end = Math.max((rows.length + cols) * fun.wave, DATA_AT + 3 * DATA_PER_LEVEL + cols * fun.wave * 0.5) + 1.2;
    let frame = 0;
    const began = performance.now();
    const draw = (now: number) => {
      const t = (now - began) / 1000;
      ctx.clearRect(0, 0, gridW, gridH);
      const lx = lensX.get();
      const ly = lensY.get();
      const ls = strength.get();
      levels.forEach((row, r) =>
        row.forEach((level, c) => {
          if (level < 0) return;
          const a = at(t - (r + c) * fun.wave); // the diagonal wave of the empty grid
          if (a <= 0) return;
          const data = DATA_AT + (level - 1) * DATA_PER_LEVEL + c * fun.wave * 0.5; // then the data, peaks last
          const dx = c - lx;
          const dy = r - ly;
          const d = Math.hypot(dx, dy);
          const f = ls > 0 ? Math.max(0, 1 - d / LENS_REACH) ** 2 * ls : 0;
          const push = d > 0.001 ? (LENS_PUSH * f) / d : 0;
          const cx = c * pitch + half + dx * push;
          const cy = r * pitch + half + dy * push;
          const size = a * (1 + LENS_SWELL * f);
          const emptyAlpha = level === 0 ? 1 : 1 - clamp((t - data) / 0.2);
          if (emptyAlpha > 0) {
            ctx.globalAlpha = clamp(a) * emptyAlpha;
            ctx.fillStyle = colors[0]!;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(0, half * size), 0, Math.PI * 2);
            ctx.fill();
          }
          if (level > 0) {
            const g = at(t - data);
            if (g > 0) {
              ctx.globalAlpha = clamp(a) * clamp(g);
              ctx.fillStyle = colors[level]!;
              ctx.beginPath();
              ctx.arc(cx, cy, Math.max(0, half * size * (0.4 + 0.6 * g)), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }),
      );
      ctx.globalAlpha = 1;
      if (t < end) frame = requestAnimationFrame(draw);
      else setArriving(false);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [arriving]); // eslint-disable-line react-hooks/exhaustive-deps -- one arrival; the rest is read as it draws

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
    lensAt(e);
    const next = cellAt(e.clientX, e.clientY);
    if (e.pointerType === "touch") {
      if (e.buttons && !overflowing) setPinned(next);
    } else setHover((prev) => (same(prev, next) ? prev : next));
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (fun) animate(strength, 1.35, fun.pop);
    /* While the grid scrolls, a drag is a scroll, so a touch picks its dot on release. */
    if (e.pointerType !== "touch" || overflowing) return;
    const next = cellAt(e.clientX, e.clientY);
    setPinned((p) => (same(p, next) ? null : next));
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (fun) animate(strength, e.pointerType === "touch" ? 0 : 1, fun.pop);
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
    return x + text.length * FIGURE > gridW ? { right: 0 } : { left: x };
  };

  return (
    <div
      ref={rootRef}
      className={"relative grid w-fit max-w-full grid-cols-[auto_minmax(0,max-content)_auto] " + className}
    >
      {/* Row labels: their own column, so they stay put while the dots scroll. The same words sit in each row as a hidden header. */}
      <div aria-hidden="true" className="pt-1 pr-4 text-caption font-normal whitespace-nowrap text-fg-subtle">
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
              className="relative text-caption font-normal whitespace-nowrap text-fg-subtle"
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
          }} className="flex flex-col" style={arriving ? { gap: GAP, opacity: 0 } : { gap: GAP }}>
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
          {arriving && (
            <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute left-0" style={{ top: lead, width: gridW, height: gridH }} />
          )}
          {arriving && <span ref={probeRef} className="hidden" />}
          <div
            ref={overlayRef}
            aria-hidden="true"
            className={"absolute inset-x-0 select-none " + (overflowing ? "touch-pan-x touch-pan-y" : "touch-pan-y")}
            style={{ top: lead, height: gridH }}
            onPointerMove={onPointerMove}
            onPointerLeave={(e) => {
              if (fun) animate(strength, 0, fun.follow);
              if (e.pointerType !== "touch") setHover(null);
            }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          />
        </div>
      </div>

      {/* Totals: their own column at the end of the rows. */}
      {hasTotals && (
        <div aria-hidden="true" className="pt-1 pl-4 text-right text-small whitespace-nowrap text-fg tabular-nums">
          {lead > 0 && <div style={{ height: lead }} />}
          <div className="flex flex-col" style={{ gap: GAP }}>
            {rows.map((row, r) => (
              <div key={r} className="flex items-center justify-end" style={{ height: cell }}>
                {/* The same rule as the labels: a total is a line of text, so rows closer than one show every nth. */}
                <span className={"litt-trim" + (r % labelEvery === 0 ? "" : " invisible")}>
                  {fun && arriving && row.total ? <CountingTotal text={row.total} /> : row.total}
                </span>
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
              <span className="text-caption font-normal tabular-nums">{valueText(active.r, active.c)}</span>
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

/** Fun mode's arrival: a total that is a plain count ("1,204") counts up as its row fills; any other total shows as it is. */
function CountingTotal({ text }: { text: string }) {
  const fun = useFun();
  const n = /^[\d,]+$/.test(text) ? Number(text.replace(/,/g, "")) : NaN;
  const [shown, setShown] = useState(Number.isFinite(n) ? 0 : n);
  useEffect(() => {
    if (!fun || !Number.isFinite(n)) return;
    const run = animate(0, n, { ...fun.draw, delay: DATA_AT, onUpdate: (v) => setShown(v) });
    return () => run.stop();
  }, [fun, n]);
  return <>{Number.isFinite(n) ? countText(text, n, shown) : text}</>;
}

/* ----------------------------------------------------------------- legend */

function Legend({ hue, cell }: { hue: HeatmapHue; cell: number }) {
  return (
    <div aria-hidden="true" className="col-start-2 col-end-3 mt-3 flex items-center gap-2 justify-self-end text-caption font-normal whitespace-nowrap text-fg-subtle">
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
