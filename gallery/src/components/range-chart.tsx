/**
 * Range chart (components.md, "Range chart"): one quantity over time as a barcode of thin bars, its segments in a tray
 * above them, and a range brushed by hand, with the total of what is brushed read as one figure that rolls. Think
 * visitors per day over eight months: drag across the launch and the figure says what the launch brought. A Time
 * scrubber finds a moment; this finds a span.
 *
 * - Anatomy, top to bottom: the reading, the segment tray, the bars, the rail, the axis.
 *   Reading: the label (small, title weight, --fg) with a ghost "Whole range" button at the row's end, which lies flat
 *   (disabled) while nothing is narrowed, so the row never moves; the brushed total at the display size (18px, the one
 *   headline size, R8) in tabular figures with the unit after it in --fg-subtle; and a line of words under it: "13 Mar
 *   to 30 Jun, 18% of the whole", or "All of 1 Jan to 31 Aug" (R5). The total is two inks on purpose: every group of
 *   digits but the last is --fg and the last group is --fg-subtle, because the last group is the one that churns while
 *   you brush, and the quiet ink keeps the eye on the magnitude. Under 1,000 there is one group and it is --fg. The
 *   group separator comes from the locale, never a literal comma.
 *   Segment tray: a tray (R3: --tray, --tray-shade) the plot's width at sm height (44px on a finger), one button per
 *   segment as wide as its span, its label (caption, title weight) and its share of the whole (caption, tabular,
 *   --fg-subtle: "52%", "<1%"). The segment whose span equals the range is the raised block (--block, --block-lift,
 *   aria-pressed): selected is raised. The block glides between segments by layoutId on the responsive tier, as the
 *   Segmented control's does, and is gone when no segment matches. A label too narrow for its span drops to its share.
 *   Pressing a segment settles the range onto it.
 *   Bars: `height` px tall. One 2px rect per drawn bar on a pitch of at least 4px; more bars than the width has room
 *   for are drawn in equal groups by their mean, and only drawn: the hand, the keys, the figure and the words work in
 *   whole bars. A drawn bar is lit (--fg) once an edge has passed its centre, the rest are --fg at 55%, the chart
 *   family's two steps; the fill fades on the instant tier. Never the accent (R6), never a hue (R7: one quantity, the
 *   quiet foreground).
 *   Rail: a slot (R3: --slot, --slot-shade) cut under the bars, as wide as they are, holding the Range slider's
 *   anatomy: the fill between two raised caps (--slot-fill; --cap, --cap-lift, a grip line), 8 by 24px, standing
 *   taller than the slot. Notches under the slot mark each segment start: they are where a release is pulled to.
 * - Hand (R4, motion/hand.ts): press on the bars or the rail. Within 8px of an edge (22px on a finger) it takes that
 *   edge, held where it was taken, following 1:1; inside the range it takes the whole span, which keeps its width;
 *   anywhere else a drag brushes a new range from the bar edge nearest the press. A press without a drag outside the
 *   range sends the nearer edge there. Edges never cross. While held a cap sinks --press-depth and its cast tightens
 *   (--cap-press), at once. Each bar lights as an edge passes it and the figure rolls. On release the edges settle on
 *   the responsive spring, from rest, onto the nearest bar or a segment start within 8px, never past either end; then
 *   onValueCommit fires once.
 * - Fun mode (motion/fun.tsx, a trial): the span can be thrown. It coasts on the speed it was let go at, lands on the
 *   segment start nearest where it would stop (within 24px) on fun mode's throw spring, and gives like a rubber band
 *   past either end. Each bar an edge sweeps rises from its base once (scaleY 1.12 to 1 on the pop spring), a held cap
 *   lifts in the hand (useFunGrab on its face; the sink stays on its box), and the figure rolls through every value on
 *   the way. It rests exactly where Calm does.
 * - Keys and assistive tech: three sliders in a group named by the label, "<label>, from", "<label>, to" and
 *   "<label>, move range", each with aria-valuetext in words ("13 Mar", "30 Jun", "13 Mar to 30 Jun"). ← and → move
 *   one bar (Shift: ten), Page Up and Page Down go to the next and previous segment start (ten bars without segments),
 *   Home and End to the ends, Escape to the whole range; on "move range" the keys move the whole span. The tray's
 *   segments are buttons. The svg is an image with a summary, a visually hidden table lists every bar, and a polite
 *   status says the range and its total once it has settled, never while a hand still moves it.
 * - Motion: caps, fill and the drawn bars move by transform only; bar fills fade on the instant tier; the figure
 *   rolls through RollingNumber and the tray's block glides on the responsive tier. Reduced motion: the edges jump to
 *   where they settle, the figure and the fills just change.
 * - Touch: the plot owns sideways drags (data-no-drag, touch-action pan-y), so the page still scrolls; the rail and
 *   the tray grow to 44px and the edges take 22px of reach.
 * - Disabled: everything lies flat (the slot --surface-3, the caps --surface-2 with a hairline, the fill fg 12%, the
 *   label --fg-disabled, "Whole range" and the segments disabled); no pointer, no tab stop. The figure and the words
 *   step down to --fg-subtle, not --fg-disabled: they are still information, and they must stay readable.
 * - Forced colors: lit bars take CanvasText and the rest GrayText, the slot and the tray a border, the caps a border
 *   and the system highlight, the raised segment a 2px border.
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { LayoutGroup, animate, motion, useMotionValue, useMotionValueEvent, useTransform, type AnimationPlaybackControls, type MotionValue } from "motion/react";
import { Button } from "@/components/button";
import { RollingNumber } from "@/components/rolling-number";
import { useDevice, useFun, useFunGrab, useTransition } from "@/motion";
import { snap, useHand, useSettle } from "@/motion/hand";

export type RangeChartBar = {
  /** What the bar is, short: a date or a name ("12 Mar"). It names the bar in the reading, the table and the keys. */
  label: string;
  /** How much, zero or more. The figure is a sum, so the values must add up. */
  value: number;
};

export type RangeChartSegment = {
  /** What the stretch is: "Launch". It is said in the tray with its share of the whole, and names its button. */
  label: string;
  /** Index of the first bar it holds. It runs to the next segment's start, or to the last bar. Each start is where a release is pulled to. */
  start: number;
};

export type RangeChartTick = {
  /** Index of the bar the words sit under. */
  at: number;
  /** The words under it, such as "Jan". */
  label: string;
};

export type RangeChartProps = {
  /** What is measured, said once: "Visitors". It names the chart, its sliders and its table for assistive tech. */
  label: string;
  /** One quantity, one bar per entry, oldest first. */
  bars: RangeChartBar[];
  /** Labelled stretches of the bars with their shares of the whole, such as Before, Launch and Since. */
  segments?: RangeChartSegment[];
  /** The words under the bars at chosen bars, such as each month's first day. Without them the first and last labels sit at the ends. */
  axis?: RangeChartTick[];
  /** The brushed range as [first, last] bar indexes, both inclusive, when you control it. Pair it with onValueChange. */
  value?: [first: number, last: number];
  /** The range it starts with when you do not control it. Without one, the whole range. */
  defaultValue?: [first: number, last: number];
  /** Called with the new range each time the range moves onto other bars under a hand, and at once for a key, a press or a throw. */
  onValueChange?: (value: [first: number, last: number]) => void;
  /** Called once the edges have settled after a drag, a press or a key. Use it to load what is in the range. */
  onValueCommit?: (value: [first: number, last: number]) => void;
  /** What the values count, said after the total: "visitors". Pass ["deploy", "deploys"] to say the first for exactly 1. */
  unit?: string | [one: string, other: string];
  /** The locale for the figure and its group separator. */
  locale?: string;
  /** Height of the bars in px. The width is the container's. */
  height?: number;
  /** Makes the chart unavailable: flat, skipped by Tab, and deaf to the pointer. */
  disabled?: boolean;
  /** Extra classes for the chart, such as a width. */
  className?: string;
};

/* -------------------------------------------------------------------------------------------------------------- */

const MIN_PITCH = 4; // px: the least a drawn bar's slot is wide, so a 2px bar keeps air
const BAR_MIN = 2;
const BAR_MAX = 6;
const GRAB = 8; // px each side of an edge that takes it with a mouse
const GRAB_TOUCH = 22; // px each side on a finger: a 44px target
const PULL = 8; // px: a release this near a segment start takes it
const PULL_THROWN = 24; // px: fun mode, a throw is pulled this far
const PAGE = 10; // bars a Page key moves when there are no segments

/** What a finger holding a segment shows: the fg 6% fill that rows and tabs share, and the hover text color. */
const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";
const RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
/** The rail draws an edge slider's focus ring on its cap's face, so the ring is the cap's shape and not the slider's box. */
const CAP_RING =
  "[&:has([data-edge=from]:focus-visible)_[data-cap=from]]:outline-2 [&:has([data-edge=from]:focus-visible)_[data-cap=from]]:outline-offset-2 [&:has([data-edge=from]:focus-visible)_[data-cap=from]]:outline-focus " +
  "[&:has([data-edge=to]:focus-visible)_[data-cap=to]]:outline-2 [&:has([data-edge=to]:focus-visible)_[data-cap=to]]:outline-offset-2 [&:has([data-edge=to]:focus-visible)_[data-cap=to]]:outline-focus";
const EDGE = "pointer-events-none absolute top-0 left-0 h-full w-6 -translate-x-1/2 outline-none pointer-coarse:w-11";
/** A drawn bar grows from its base when fun mode lifts it. Static, so the rest frame is the same with fun mode off. */
const FROM_BASE = { transformBox: "fill-box", transformOrigin: "50% 100%" } as const;

type Zone = "start" | "end" | "body" | "new";
type Range = [first: number, last: number];

type Geometry = {
  plotW: number;
  /** Bars merged into one drawn bar: 1 when they fit. */
  group: number;
  /** px per bar. */
  perBar: number;
  barW: number;
  /** One per drawn bar: its height as a share of the tallest, 0 to 1 (the mean of its group). */
  heights: number[];
};

type Segment = { label: string; start: number; end: number; share: number };

/** The container's width, measured before paint and kept current (the Chart's). 0 until the first measure. */
function useWidth(): readonly [RefObject<HTMLDivElement | null>, number] {
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

/** Bars into pixels: the grouping, the bar width and the heights, from the width and the values. Pure. */
function plan(plotW: number, values: readonly number[]): Geometry {
  const n = values.length;
  if (!plotW || !n) return { plotW, group: 1, perBar: 0, barW: BAR_MIN, heights: [] };
  const fit = Math.max(1, Math.floor(plotW / MIN_PITCH));
  const group = Math.max(1, Math.ceil(n / fit));
  const perBar = plotW / n;
  const barW = Math.min(BAR_MAX, Math.max(BAR_MIN, Math.floor((perBar * group) / 2)));
  const means: number[] = [];
  for (let k = 0; k * group < n; k++) {
    let sum = 0;
    let count = 0;
    for (let i = k * group; i < Math.min(n, (k + 1) * group); i++) {
      sum += Math.max(0, values[i] ?? 0);
      count++;
    }
    means.push(sum / count);
  }
  let top = 0;
  for (const m of means) top = Math.max(top, m);
  return { plotW, group, perBar, barW, heights: means.map((m) => (top > 0 ? m / top : 0)) };
}

/** Running totals, so the total of any range is one subtraction: prefix[i] is the sum of values[0 .. i). */
function cumulative(values: readonly number[]): Float64Array {
  const out = new Float64Array(values.length + 1);
  for (let i = 0; i < values.length; i++) out[i + 1] = out[i] + Math.max(0, values[i] ?? 0);
  return out;
}

/** The segments in order, clipped to the bars, each running to the next start, with its share of the whole. Pure. */
function segmentsOf(segments: readonly RangeChartSegment[], prefix: Float64Array, n: number): Segment[] {
  const whole = prefix[n] ?? 0;
  const sorted = [...segments]
    .map((s) => ({ label: s.label, start: Math.max(0, Math.min(n - 1, Math.round(s.start))) }))
    .sort((p, q) => p.start - q.start)
    .filter((s, i, all) => i === 0 || s.start !== all[i - 1].start);
  return sorted.map((s, i) => {
    const end = i + 1 < sorted.length ? sorted[i + 1].start : n;
    return { label: s.label, start: s.start, end, share: whole > 0 ? (prefix[end] - prefix[s.start]) / whole : 0 };
  });
}

/** The bar boundary nearest `x` px, from 0 to n. */
function boundaryAt(x: number, geo: Geometry, n: number): number {
  return Math.max(0, Math.min(n, Math.round(x / geo.perBar)));
}

/** The edges as bar indexes, [first, last] both inclusive, at least one bar wide. The inverse of `edgesOf`. */
function rangeOf(a: number, b: number, geo: Geometry, n: number): Range {
  const first = Math.min(n - 1, boundaryAt(a, geo, n));
  const to = Math.max(first + 1, boundaryAt(b, geo, n));
  return [first, to - 1];
}

/** A range as px edges in the plot: the first bar's left edge and the last bar's right edge. */
function edgesOf(range: Range, geo: Geometry): [number, number] {
  return [range[0] * geo.perBar, (range[1] + 1) * geo.perBar];
}

/** Sorted, inside [0, n - 1] and whole. */
function clampRange(range: Range, n: number): Range {
  if (n <= 0) return [0, 0];
  const lo = Math.max(0, Math.min(n - 1, Math.round(Math.min(range[0], range[1]))));
  const hi = Math.max(lo, Math.min(n - 1, Math.round(Math.max(range[0], range[1]))));
  return [lo, hi];
}

/**
 * What a press at `x` (px in the plot) takes, given the edges `a` and `b`: an edge within `grab` (the nearer one when
 * both reach), else the body between them, else a new range. Pure.
 */
function zoneAt(x: number, a: number, b: number, grab: number): Zone {
  const da = Math.abs(x - a);
  const db = Math.abs(x - b);
  if (da <= grab || db <= grab) return da <= db ? "start" : "end";
  return x > a && x < b ? "body" : "new";
}

/**
 * Where released edges come to rest, in px. `moved` says which edge the hand carried: one edge snaps to the grid or
 * to a segment start within the pull, kept a bar from the `still` one; both move together keeping their width, and
 * whichever edge a snap moves less decides. Pure.
 */
function landEdges(moved: "a" | "b" | "both", points: readonly [number, number], still: readonly [number, number], geo: Geometry, anchors: readonly number[], thrown: boolean): [number, number] {
  const step = geo.perBar;
  const max = geo.plotW;
  const pull = thrown ? PULL_THROWN : PULL;
  const [pa, pb] = points;
  const [A, B] = still;
  if (moved === "a") return [snap(pa, { step, min: 0, max: B - step, anchors, pull }), B];
  if (moved === "b") return [A, snap(pb, { step, min: A + step, max, anchors, pull })];
  const w = B - A;
  const a1 = snap(pa, { step, min: 0, max: max - w, anchors, pull });
  const b1 = snap(pb, { step, min: w, max, anchors, pull });
  return Math.abs(a1 - pa) <= Math.abs(b1 - pb) ? [a1, a1 + w] : [b1 - w, b1];
}

/** "52%", and "<1%" for a share that is there but under one percent (the Breakdown's). */
const percent = (share: number): string => (share <= 0 ? "0%" : share < 0.01 ? "<1%" : `${Math.round(share * 100)}%`);

/** The locale's group separator, probed from a million (es and pl do not group four digits). Null when it has none. */
function groupSeparator(locale: string): string | null {
  try {
    return new Intl.NumberFormat(locale).formatToParts(1_000_000).find((p) => p.type === "group")?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * The brushed total in two inks: the head in --fg, the last group of three digits in --fg-subtle, each its own
 * RollingNumber so each rolls on its own. One group (under 1,000, or a locale with no separator) is one RollingNumber.
 */
function Figure({ total, locale, separator, disabled }: { total: number; locale: string; separator: string | null; disabled: boolean }) {
  const whole = Math.max(0, Math.round(total));
  const head = Math.floor(whole / 1000);
  const ink = disabled ? "text-fg-subtle" : "text-fg";
  if (!separator || head === 0) return <RollingNumber value={whole} locale={locale} className={ink} />;
  return (
    <>
      <RollingNumber value={head} locale={locale} className={ink} />
      <span className={ink}>{separator}</span>
      <RollingNumber value={whole % 1000} locale={locale} format={{ minimumIntegerDigits: 3, useGrouping: false }} className="text-fg-subtle" />
    </>
  );
}

/** One cap on the rail: its box rides on `x`, its sink while held is on the box, and the face (lifted by fun mode) is inside. */
function Cap({ x, edge, held, disabled, faceRef }: { x: MotionValue<number>; edge: "from" | "to"; held: boolean; disabled: boolean; faceRef: RefObject<HTMLSpanElement | null> }) {
  return (
    <motion.span aria-hidden="true" className="absolute top-1/2 left-0 h-6 w-2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize" style={{ x }}>
      <span className={"absolute inset-0 transition-[translate] duration-(--dur-instant) ease-litt " + (held ? "translate-y-(--press-depth)" : "")}>
        <span
          ref={faceRef}
          data-cap={edge}
          className={
            "absolute inset-0 rounded-[calc(var(--radius-control)-2px)] forced-colors:border forced-colors:bg-[Highlight] " +
            (disabled ? "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]" : held ? "bg-cap-held shadow-(--cap-press)" : "bg-cap shadow-(--cap-lift)")
          }
        >
          <span className={"absolute inset-y-2 left-1/2 w-px -translate-x-1/2 " + (disabled ? "bg-line" : "bg-cap-grip")} />
        </span>
      </span>
    </motion.span>
  );
}

const same = (p: Range, q: Range) => p[0] === q[0] && p[1] === q[1];

/** A range of bars you brush by hand, read as one rolling figure. The edges follow the pointer 1:1 and settle on a bar or a segment start. */
export function RangeChart({
  label,
  bars,
  segments = [],
  axis,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  unit,
  locale = "en-GB",
  height = 96,
  disabled = false,
  className = "",
}: RangeChartProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const n = bars.length;
  const values = useMemo(() => bars.map((b) => b.value), [bars]);
  const prefix = useMemo(() => cumulative(values), [values]);
  const whole = prefix[n] ?? 0;
  const [plotRef, plotW] = useWidth();
  const geo = useMemo(() => plan(plotW, values), [plotW, values]);
  const segs = useMemo(() => segmentsOf(segments, prefix, n), [segments, prefix, n]);
  const starts = useMemo(() => segs.map((s) => s.start), [segs]);
  const anchorsPx = useMemo(() => starts.map((s) => s * geo.perBar), [starts, geo.perBar]);
  const { coarse } = useDevice();
  const fun = useFun();
  const responsive = useTransition("responsive");
  const glide = fun ? fun.glide : responsive;
  const grabA = useFunGrab();
  const grabB = useFunGrab();
  const fmt = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const separator = useMemo(() => groupSeparator(locale), [locale]);
  const unitFor = (count: number) => (typeof unit === "string" ? unit : unit ? (count === 1 ? unit[0] : unit[1]) : "");

  /* One source per fact: `range` is the value (the sliders, onValueChange), the two MotionValues are where the edges
     are, and `shown` is the range the picture draws, read from them. The hand writes the MotionValues; React reads. */
  const [inner, setInner] = useState<Range>(() => clampRange(defaultValue ?? [0, n - 1], n));
  const range = clampRange(valueProp ?? inner, n);
  const said = useRef(range);
  const [shown, setShown] = useState(range);
  const shownRef = useRef(shown);
  const a = useMotionValue(0);
  const b = useMotionValue(0);
  const settle = useSettle([a, b]);
  const hand = useHand();
  const w = useMotionValue(1);
  const fillScale = useTransform([a, b, w], ([x1, x2, pw]: number[]) => Math.max(0, x2 - x1) / pw);
  /* True while a settle we asked for runs: the value was told at the start, and only the picture follows the edges. */
  const quiet = useRef(false);
  /* True while a new width or new data seats the edges. */
  const seating = useRef(false);
  const rects = useRef<(SVGRectElement | null)[]>([]);
  const pops = useRef(new Map<number, AnimationPlaybackControls>());
  const faceA = useRef<HTMLSpanElement>(null);
  const faceB = useRef<HTMLSpanElement>(null);
  const sliders = useRef<Record<"from" | "to" | "move", HTMLSpanElement | null>>({ from: null, to: null, move: null });
  const [held, setHeld] = useState<"start" | "end" | "both" | null>(null);
  const [status, setStatus] = useState("");

  const report = (next: Range) => {
    if (same(next, said.current)) return;
    said.current = next;
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  /* A drawn bar is lit once an edge has passed its centre: for one bar per drawn bar, when it is in the range. */
  const lit = (k: number, r: Range) => {
    const centre = (k * geo.group + Math.min(n, (k + 1) * geo.group)) / 2;
    return centre >= r[0] && centre <= r[1] + 1;
  };

  /* Fun mode: every drawn bar an edge swept rises from its base once. The inline transform goes when it lands, so the
     rest frame is the one Calm draws. */
  const pop = (prev: Range, next: Range) => {
    if (!fun) return;
    const g = geo.group;
    const from = Math.floor(Math.min(prev[0], next[0]) / g);
    const to = Math.floor(Math.max(prev[1], next[1]) / g);
    for (let k = from; k <= to; k++) {
      if (lit(k, prev) === lit(k, next)) continue;
      const el = rects.current[k];
      if (!el) continue;
      const run = animate(el, { scaleY: [1.12, 1], originX: 0.5, originY: 1 }, fun.pop); // the origin goes through Motion too, or it resets it to the centre
      pops.current.set(k, run);
      void run.then(() => {
        if (pops.current.get(k) !== run) return;
        pops.current.delete(k);
        el.style.transform = "";
      });
    }
  };

  const sync = () => {
    if (seating.current || !geo.perBar || !n) return;
    const next = rangeOf(a.get(), b.get(), geo, n);
    const prev = shownRef.current;
    if (same(next, prev)) return;
    pop(prev, next);
    shownRef.current = next;
    setShown(next);
    if (!quiet.current) report(next);
  };
  useMotionValueEvent(a, "change", sync);
  useMotionValueEvent(b, "change", sync);

  /* A new width or new data seats the edges where the picture is, with no animation. The range does not change, so
     nothing is read from the edges until both are seated: one alone would read as a range, pop bars and report it. */
  useLayoutEffect(() => {
    w.set(Math.max(1, geo.plotW));
    const [pa, pb] = edgesOf(shownRef.current, geo);
    seating.current = true;
    a.jump(pa);
    b.jump(pb);
    seating.current = false;
  }, [geo, n]); // eslint-disable-line react-hooks/exhaustive-deps -- the MotionValues are stable

  const wordsOf = (r: Range) => (!n ? "" : r[0] === r[1] ? bars[r[0]].label : `${bars[r[0]].label} to ${bars[r[1]].label}`);
  const totalOf = (r: Range) => (n ? prefix[r[1] + 1] - prefix[r[0]] : 0);
  const lineOf = (r: Range) => {
    if (!n) return "";
    const narrow = !(r[0] === 0 && r[1] === n - 1);
    return narrow ? `${wordsOf(r)}, ${percent(whole > 0 ? totalOf(r) / whole : 0)} of the whole` : `All of ${wordsOf(r)}`;
  };
  const readingOf = (r: Range) => {
    const t = Math.round(totalOf(r));
    const u = unitFor(t);
    return `${fmt.format(t)}${u ? ` ${u}` : ""}, ${lineOf(r)}`;
  };

  const landed = (r: Range) => {
    onValueCommit?.(r);
    setStatus(readingOf(r));
  };

  /** Keys, buttons, presses and a controlled value: tell the value now, then take the edges there and commit on arrival. */
  const settleTo = (target: Range, commit: boolean) => {
    report(target);
    quiet.current = true;
    settle.to(edgesOf(target, geo), {
      commit: () => {
        quiet.current = false;
        if (commit) landed(target);
      },
    });
  };

  /* A controlled value we did not make moves the edges there. */
  useEffect(() => {
    if (same(range, said.current)) return;
    said.current = range;
    settleTo(range, false);
  }, [range[0], range[1]]); // eslint-disable-line react-hooks/exhaustive-deps -- follows the value only

  useEffect(() => () => pops.current.forEach((run) => run.stop()), []);

  /* ------------------------------------------------------------------ the pointer */

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || !n || !geo.perBar) return;
    e.preventDefault(); // keeps focus on the slider we pick, and no text selection
    const box = e.currentTarget.getBoundingClientRect();
    const x0 = e.clientX - box.left;
    settle.hold(); // caught mid-settle: the edges are in the hand again, where they are
    quiet.current = false;
    const A = a.get();
    const B = b.get();
    const W = geo.plotW;
    const step = geo.perBar;
    const zone = zoneAt(x0, A, B, coarse ? GRAB_TOUCH : GRAB);
    const grip = zone === "start" ? A - x0 : zone === "end" ? B - x0 : 0; // held where it was taken: no jump under the finger
    const anchor = boundaryAt(x0, geo, n) * geo.perBar; // a new range starts at the bar edge nearest the press
    let free: "a" | "b" = "b";
    sliders.current[zone === "end" ? "to" : zone === "body" ? "move" : "from"]?.focus({ preventScroll: true });
    setHeld(zone === "start" ? "start" : zone === "end" ? "end" : "both");

    hand.begin(e, {
      axis: "x",
      onClaim: () => {
        if (zone !== "end") grabA?.grab(faceA.current);
        if (zone !== "start") grabB?.grab(faceB.current);
      },
      onMove: ({ dx }) => {
        const x = x0 + dx;
        if (zone === "start") a.set(settle.limit(x + grip, 0, B - step).shown);
        else if (zone === "end") b.set(settle.limit(x + grip, A + step, W).shown);
        else if (zone === "body") {
          const s = settle.limit(A + dx, 0, W - (B - A)).shown;
          a.set(s);
          b.set(s + (B - A));
        } else {
          free = anchor <= 0 ? "b" : anchor >= W ? "a" : x >= anchor ? "b" : "a";
          if (free === "b") {
            a.set(anchor);
            b.set(Math.max(anchor + step, settle.limit(x, 0, W).shown));
          } else {
            b.set(anchor);
            a.set(Math.min(anchor - step, settle.limit(x, 0, W).shown));
          }
        }
        grabA?.move(a.get());
        grabB?.move(b.get());
      },
      onRelease: (r) => {
        setHeld(null);
        if (r.cancelled) {
          settle.to([A, B]); // Escape or the page's scroll: back where it was, and nothing committed
          return;
        }
        if (!r.claimed) {
          press(zone, x0);
          return;
        }
        const moved = zone === "start" ? "a" : zone === "end" ? "b" : zone === "body" ? "both" : free;
        const speeds = moved === "a" ? [r.speed, 0] : moved === "b" ? [0, r.speed] : [r.speed, r.speed];
        const still: [number, number] = zone === "new" ? [anchor, anchor] : [A, B];
        let target = shownRef.current;
        settle.release({
          at: [a.get(), b.get()], // the shown edges, past an end if fun mode's rubber holds them there
          speeds,
          land: ({ points, thrown }) => {
            const px = landEdges(moved, [points[0], points[1]], still, geo, anchorsPx, thrown);
            target = rangeOf(px[0], px[1], geo, n);
            report(target);
            quiet.current = true;
            return edgesOf(target, geo);
          },
          commit: () => {
            quiet.current = false;
            landed(target);
          },
        });
      },
    });
  };

  /** A press that never became a drag: outside the range the nearer edge goes to the bar edge under it. */
  const press = (zone: Zone, x0: number) => {
    const current = shownRef.current;
    if (zone !== "new") {
      settleTo(current, false); // a cap or the span, caught and let go: back to rest where it is
      return;
    }
    const at = boundaryAt(x0, geo, n);
    const next: Range = at <= current[0] ? [at, current[1]] : [current[0], Math.max(current[0], at - 1)];
    if (same(next, current)) return;
    settleTo(next, true);
  };

  /* ------------------------------------------------------------------ the keys */

  const onKeyDown = (which: "from" | "to" | "move") => (e: KeyboardEvent<HTMLSpanElement>) => {
    if (disabled || !n || !geo.perBar) return;
    const [first, last] = said.current;
    const to = last + 1; // the end as a boundary
    const k = e.shiftKey ? 10 : 1;
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const nextStart = (after: number) => starts.find((s) => s > after);
    const prevStart = (before: number) => [...starts].reverse().find((s) => s < before);
    const page = (from: number, dir: 1 | -1) => (starts.length ? (dir > 0 ? nextStart(from) : prevStart(from)) : from + dir * PAGE);
    let next: Range | null = null;
    if (e.key === "Escape") next = [0, n - 1];
    else if (which === "from") {
      let f: number | undefined;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") f = first + k;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") f = first - k;
      else if (e.key === "PageUp") f = page(first, 1);
      else if (e.key === "PageDown") f = page(first, -1);
      else if (e.key === "Home") f = 0;
      else if (e.key === "End") f = last;
      if (f !== undefined) next = [clamp(f, 0, last), last];
    } else if (which === "to") {
      let t: number | undefined;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") t = to + k;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") t = to - k;
      else if (e.key === "PageUp") t = page(to, 1);
      else if (e.key === "PageDown") t = page(to, -1);
      else if (e.key === "Home") t = first + 1;
      else if (e.key === "End") t = n;
      if (t !== undefined) next = [first, clamp(t, first + 1, n) - 1];
    } else {
      const width = last - first;
      let f: number | undefined;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") f = first + k;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") f = first - k;
      else if (e.key === "PageUp") f = page(first, 1);
      else if (e.key === "PageDown") f = page(first, -1);
      else if (e.key === "Home") f = 0;
      else if (e.key === "End") f = n - 1 - width;
      if (f !== undefined) {
        f = clamp(f, 0, n - 1 - width);
        next = [f, f + width];
      }
    }
    if (next === null) return;
    e.preventDefault();
    if (same(next, said.current)) return;
    settleTo(clampRange(next, n), true);
  };

  /* ------------------------------------------------------------------ the reading */

  const total = totalOf(shown);
  const narrowed = n > 0 && !(shown[0] === 0 && shown[1] === n - 1);
  const unitWord = unitFor(Math.round(total));
  const matched = segs.find((s) => s.start === shown[0] && s.end - 1 === shown[1]);
  const summary = !n
    ? label
    : `${label}: ${bars[0].label} to ${bars[n - 1].label}, ${fmt.format(Math.round(whole))}${unitWord ? ` ${unitFor(Math.round(whole))}` : ""} in all` +
      (segs.length ? `. ${segs.map((s) => `${s.label} ${percent(s.share)}`).join(", ")}` : "");
  const lead = segs.length ? segs[0].start : 0;
  const columns = [lead > 0 ? `${lead}fr` : "", ...segs.map((s) => `${s.end - s.start}fr`)].filter(Boolean).join(" ");
  const words = disabled ? "text-fg-subtle" : "text-fg-muted";
  const hint = starts.length ? "Arrow keys move a bar. Page Up and Page Down go to the next and previous segment. Escape brushes the whole range." : "Arrow keys move a bar. Escape brushes the whole range.";

  return (
    <div role="group" aria-labelledby={labelId} aria-disabled={disabled || undefined} className={"grid gap-4 " + className}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-1">
          <span id={labelId} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
            {label}
          </span>
          <p aria-hidden="true" className="flex items-baseline gap-2 text-display tabular-nums">
            <span className="inline-flex">
              <Figure total={total} locale={locale} separator={separator} disabled={disabled} />
            </span>
            {unitWord && <span className="text-small font-normal text-fg-subtle">{unitWord}</span>}
          </p>
          <p aria-hidden="true" className={"text-small tabular-nums " + words}>
            {lineOf(shown)}
          </p>
          <span className="sr-only">{readingOf(shown)}</span>
        </div>
        <Button variant="ghost" size={coarse ? "md" : "sm"} disabled={disabled || !narrowed} onClick={() => settleTo([0, n - 1], true)} className="shrink-0">
          Whole range
        </Button>
      </div>

      <div className="grid gap-2">
        {segs.length > 0 && (
          <LayoutGroup id={id}>
            <div
              className="grid h-control-sm rounded-control bg-tray p-0.5 shadow-(--tray-shade) pointer-coarse:h-control-md forced-colors:border"
              style={{ gridTemplateColumns: columns }}
            >
              {lead > 0 && <span aria-hidden="true" />}
              {segs.map((s) => {
                const pressed = matched === s;
                return (
                  <button
                    key={s.start}
                    type="button"
                    disabled={disabled}
                    aria-pressed={pressed}
                    aria-label={`${s.label}, ${percent(s.share)}`}
                    onClick={() => settleTo([s.start, s.end - 1], true)}
                    className={
                      "@container relative flex h-full min-w-0 items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] px-2 text-caption font-title select-none " +
                      "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
                      (disabled ? "cursor-not-allowed text-fg-disabled" : pressed ? "cursor-pointer text-fg" : "cursor-pointer text-fg-subtle hover:text-fg " + PRESS)
                    }
                  >
                    {pressed && (
                      <motion.span
                        layoutId="segment"
                        transition={glide}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-[calc(var(--radius-control)-2px)] bg-block shadow-(--block-lift) forced-colors:border-2"
                      />
                    )}
                    <span className="relative z-1 truncate @max-[6rem]:hidden">{s.label}</span>
                    <span className={"relative z-1 shrink-0 font-normal tabular-nums @max-[2rem]:hidden " + (disabled ? "" : "text-fg-subtle")}>{percent(s.share)}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        )}

        <div
          ref={plotRef}
          data-no-drag=""
          onPointerDown={onPointerDown}
          className={"relative touch-pan-y select-none " + (disabled ? "cursor-not-allowed" : "cursor-crosshair")}
        >
          <svg role="img" aria-label={summary} height={height} className="block w-full" shapeRendering="crispEdges">
            {geo.heights.map((h, k) => {
              const hp = h > 0 ? Math.max(2, Math.round(h * height)) : 0;
              if (!hp) return null;
              const slot = geo.group * geo.perBar;
              const x = Math.round(k * slot + (slot - geo.barW) / 2);
              const on = lit(k, shown);
              return (
                <rect
                  key={k}
                  ref={(el) => {
                    rects.current[k] = el;
                  }}
                  x={x}
                  y={height - hp}
                  width={geo.barW}
                  height={hp}
                  style={FROM_BASE}
                  className={
                    "transition-[fill] duration-(--dur-instant) ease-litt " +
                    (on
                      ? (disabled ? "fill-fg-muted" : "fill-fg") + " forced-colors:fill-[CanvasText]"
                      : "fill-[color-mix(in_oklab,var(--fg)_55%,transparent)] forced-colors:fill-[GrayText]")
                  }
                />
              );
            })}
          </svg>

          <div className={"relative h-8 pointer-coarse:h-11 " + CAP_RING}>
            <span
              aria-hidden="true"
              className={
                "absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-[calc(var(--radius-control)-2px)] forced-colors:border " +
                (disabled ? "bg-surface-3" : "bg-slot shadow-(--slot-shade)")
              }
            >
              <motion.span
                className={
                  "absolute inset-y-0 left-0 w-full origin-left " +
                  (disabled ? "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]" : "cursor-grab bg-slot-fill shadow-(--slot-fill-shade) forced-colors:bg-[Highlight]")
                }
                style={{ x: a, scaleX: fillScale }}
              />
            </span>
            {anchorsPx.map((px, i) => (
              <span key={i} aria-hidden="true" className="absolute top-1/2 mt-1.5 h-1 w-px bg-notch" style={{ left: px }} />
            ))}
            <Cap x={a} edge="from" held={held === "start" || held === "both"} disabled={disabled} faceRef={faceA} />
            <Cap x={b} edge="to" held={held === "end" || held === "both"} disabled={disabled} faceRef={faceB} />

            {/* The three sliders: the whole rail moves the span, and each cap's box is one edge. They take no pointer: the plot does. */}
            <span
              ref={(el) => {
                sliders.current.move = el;
              }}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label={`${label}, move range`}
              aria-describedby={`${id}-hint`}
              aria-valuemin={0}
              aria-valuemax={Math.max(0, n - 1 - (range[1] - range[0]))}
              aria-valuenow={range[0]}
              aria-valuetext={wordsOf(range)}
              aria-disabled={disabled || undefined}
              onKeyDown={onKeyDown("move")}
              className={"pointer-events-none absolute inset-0 rounded-control " + RING}
            />
            <motion.span
              ref={(el) => {
                sliders.current.from = el;
              }}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label={`${label}, from`}
              aria-describedby={`${id}-hint`}
              aria-valuemin={0}
              aria-valuemax={range[1]}
              aria-valuenow={range[0]}
              aria-valuetext={n ? bars[range[0]].label : ""}
              aria-disabled={disabled || undefined}
              data-edge="from"
              onKeyDown={onKeyDown("from")}
              style={{ x: a }}
              className={EDGE}
            />
            <motion.span
              ref={(el) => {
                sliders.current.to = el;
              }}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label={`${label}, to`}
              aria-describedby={`${id}-hint`}
              aria-valuemin={range[0]}
              aria-valuemax={Math.max(0, n - 1)}
              aria-valuenow={range[1]}
              aria-valuetext={n ? bars[range[1]].label : ""}
              aria-disabled={disabled || undefined}
              data-edge="to"
              onKeyDown={onKeyDown("to")}
              style={{ x: b }}
              className={EDGE}
            />
          </div>
        </div>

        <div aria-hidden="true" className="relative h-4 text-caption font-normal tabular-nums text-fg-subtle">
          {axis
            ? axis.map((t) => (
                <span key={`${t.at}-${t.label}`} className="absolute top-0 whitespace-nowrap" style={{ left: Math.max(0, Math.min(n, t.at)) * geo.perBar }}>
                  {t.label}
                </span>
              ))
            : n > 0 && (
                <>
                  <span className="absolute top-0 left-0 whitespace-nowrap">{bars[0].label}</span>
                  <span className="absolute top-0 right-0 whitespace-nowrap">{bars[n - 1].label}</span>
                </>
              )}
        </div>
      </div>

      <span id={`${id}-hint`} className="sr-only">
        {hint}
      </span>
      {/* A table will not shrink to sr-only's 1px, so a wrapper clips it; otherwise a long one widens a phone's page. */}
      <div className="sr-only">
        <table className="[&_th]:font-normal">
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Bar</th>
              <th scope="col">{label}</th>
              {segs.length > 0 && <th scope="col">Segment</th>}
            </tr>
          </thead>
          <tbody>
            {bars.map((bar, i) => (
              <tr key={i}>
                <th scope="row">{bar.label}</th>
                <td>{fmt.format(bar.value)}</td>
                {segs.length > 0 && <td>{segs.find((s) => i >= s.start && i < s.end)?.label ?? ""}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>
    </div>
  );
}
