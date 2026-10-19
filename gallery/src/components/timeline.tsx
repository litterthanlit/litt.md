/**
 * Timeline: the steps of a run in order (a deploy, a build, an import), with when each started, how long it
 * took and how it ended. Compose it from children: Timeline > TimelinePhase > TimelineStep, then a
 * TimelineResult. TimelineBar draws the whole run as one strip and sits beside it.
 *
 * - Layout (components.md, Timeline): an ordered list in four columns. The start (`at`) is the mono caption in
 *   fg-subtle with tabular numbers, then the rail, then the label in the small size and fg, then the duration at
 *   the end in the mono caption. A skipped or pending step's label is fg-subtle, and a skipped step's duration is
 *   the word "skipped". Rows are airy, 32px at least. The list measures itself (a container query), not the
 *   window: the start column shrinks on a narrow container and the labels wrap.
 * - Rail: a 1px line in line-strong that runs between the 16px status icons and stops at a phase's first and last
 *   step. It is drawn in two short pieces around each icon, so the icon never needs a background of its own.
 * - Status icons (16px, 1.5px stroke, currentColor): done is a check in a circle in fg-muted; running is a
 *   half-filled circle in fg and does not spin or pulse; pending is an empty circle in fg-subtle; skipped is a
 *   dashed circle in fg-subtle; failed is an x in a circle in danger. No dots. Every status is also said in hidden
 *   text, so color and shape are never the only signal.
 * - Phase: a heading row (the label small in fg-subtle, the total in the mono caption) over a nested, labelled
 *   list. Its `hue` says which phase (P11): it colors the phase's rail bars here and its segments in TimelineBar.
 *   With no hue those marks are fg at 55%.
 * - Proportional: with `proportional`, a step with `seconds` gets a row at least `seconds * secondHeight` tall, and
 *   the rail below its icon becomes a 4px bar at the control radius (the Meter's rail) of that length, in the
 *   phase's mark tone. With `previousSeconds` a ghost bar at fg 12% shows the last run's length beside it, with
 *   "was 31s" at its foot. A step whose bar would be shorter than a row keeps the thin line. A failed step's bar is
 *   danger, the one status color a mark takes.
 * - Result: the closing row under a hairline. The label is body size in success, danger or fg by `tone`, the total
 *   is mono in fg at the end, and the tone is said in hidden text.
 * - Bar: a strip of the whole run from data, not children. 32px tall at the control radius with overflow hidden,
 *   segments sized by seconds, square, 2px apart. A skipped or zero-second step takes no width. Phase labels sit
 *   above each phase's span and the times at the phase boundaries sit below, in the mono caption. Hovering a
 *   segment, or touching it, shows the Tooltip's look (solid surface-3, shadow-tooltip: the label, then the mono
 *   duration), the way the Chart does. A touch pins it until the next touch elsewhere.
 * - Semantics: each step reads in order, "00:02, Run build commands, done, 19 seconds". The bar is role="img" with a
 *   summary, and its segments are not focusable: it always sits beside a Timeline or a table that lists the same
 *   steps, so a keyboard user and a screen reader get every step there.
 * - Motion: none in the timeline. A running step does not move. The bar's tooltip uses the responsive tier like
 *   every tooltip, and hover changes color only, at the instant tier.
 */
import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";

/* ----------------------------------------------------------------- types */

/** How a step stands. Running is a half-filled circle that stays still. */
export type TimelineStatus = "done" | "running" | "pending" | "skipped" | "failed";

/** The five data hues, in their fixed order (P11). A phase takes one, and it means that phase everywhere in the view. */
export type TimelineHue = "blue" | "amber" | "teal" | "violet" | "rose";

/** How a run ended: success, danger, or neither. It sets the result's color and a hidden word. */
export type TimelineTone = "success" | "danger" | "neutral";

/* ----------------------------------------------------------------- lookups */

/** Literal strings, so Tailwind sees every class. */
const MARK: Record<TimelineHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};
/** With no hue, a mark is the foreground at 55%, as in the Chart. */
const MARK_FG = "bg-[color-mix(in_oklab,var(--fg)_55%,transparent)]";
const GHOST = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]";

const ICON_TONE: Record<TimelineStatus, string> = {
  done: "text-fg-muted",
  running: "text-fg",
  pending: "text-fg-subtle",
  skipped: "text-fg-subtle",
  failed: "text-danger",
};
const RESULT_TONE: Record<TimelineTone, string> = {
  success: "text-success",
  danger: "text-danger",
  neutral: "text-fg",
};
const RESULT_WORD: Record<TimelineTone, string> = { success: ", success", danger: ", error", neutral: "" };

/* ----------------------------------------------------------------- numbers and words */

const ROW = 32; // the least height of a row
const RAIL_TOP = 24; // where the rail below an icon starts: the icon sits 8px down and is 16px tall
const BAR_MIN = 16; // a bar shorter than this is no better than the thin line
const CAPTION = 17; // a caption line at the caption size

const tidy = (n: number) => (Number.isInteger(n) ? String(n) : n < 10 ? n.toFixed(1) : String(Math.round(n)));
const isNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const clean = (n: unknown) => (isNum(n) ? Math.max(0, n) : 0);

/** "19s", "1m 12s". */
function formatSeconds(total: number): string {
  const s = Math.max(0, total);
  if ((s >= 10 ? Math.round(s) : s) < 60) return `${tidy(s)}s`;
  const whole = Math.round(s);
  const m = Math.floor(whole / 60);
  const r = whole - m * 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

/** "19 seconds", "1 minute 12 seconds": what a screen reader should say where the page shows "19s". */
function speakSeconds(total: number): string {
  const s = Math.max(0, total);
  if ((s >= 10 ? Math.round(s) : s) < 60) {
    const t = tidy(s);
    return `${t} ${t === "1" ? "second" : "seconds"}`;
  }
  const whole = Math.round(s);
  const m = Math.floor(whole / 60);
  const r = whole - m * 60;
  const minutes = `${m} ${m === 1 ? "minute" : "minutes"}`;
  return r ? `${minutes} ${r} ${r === 1 ? "second" : "seconds"}` : minutes;
}

/** "00:24", or "1:02:10" past an hour: a time on the run's clock. */
function clock(total: number): string {
  const s = Math.max(0, Math.round(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const p = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(s % 60)}` : `${p(m)}:${p(s % 60)}`;
}

/** A number is seconds and is formatted and spoken. A string is shown and spoken as it is. */
function readTime(value: number | string) {
  return typeof value === "number" ? { visual: formatSeconds(value), spoken: speakSeconds(value) } : { visual: value, spoken: value };
}

/* ----------------------------------------------------------------- context */

type TimelineContextValue = { proportional: boolean; secondHeight: number };
const TimelineContext = createContext<TimelineContextValue>({ proportional: false, secondHeight: 4 });
const PhaseContext = createContext<{ hue?: TimelineHue }>({});

/* ----------------------------------------------------------------- the icons */

function StatusIcon({ status }: { status: TimelineStatus }) {
  const skipped = status === "skipped";
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={"absolute top-2 left-0 " + ICON_TONE[status]}
    >
      <circle cx="8" cy="8" r="6.25" strokeDasharray={skipped ? "2.45" : undefined} strokeLinecap={skipped ? "butt" : undefined} />
      {status === "done" && <path d="m5.25 8.25 2 2 3.5-4.25" />}
      {status === "running" && <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" />}
      {status === "failed" && <path d="m6 6 4 4m0-4-4 4" />}
    </svg>
  );
}

/* ----------------------------------------------------------------- Timeline */

export type TimelineProps = {
  /** What the run is, said once for screen readers: "Update pricing page, deploy steps". */
  label: string;
  /** Sizes each step's row by its seconds and draws long steps as a bar on the rail. A step needs `seconds` for that. */
  proportional?: boolean;
  /** Pixels of row height per second in a proportional timeline. A 19 second step at 4 is a 76px bar. */
  secondHeight?: number;
  /** Phases and steps, then a result. Put steps in a TimelinePhase so the rail breaks between phases. */
  children: ReactNode;
  /** Extra classes for the list, such as a width. */
  className?: string;
};

/** The steps of a run as an ordered list in four columns: start, rail, label, duration. Compose it from TimelinePhase, TimelineStep and TimelineResult. */
export function Timeline({ label, proportional = false, secondHeight = 4, children, className = "" }: TimelineProps) {
  const value = useMemo(() => ({ proportional, secondHeight }), [proportional, secondHeight]);
  return (
    <TimelineContext.Provider value={value}>
      <ol role="list" aria-label={label} className={"@container m-0 list-none p-0 " + className}>
        {children}
      </ol>
    </TimelineContext.Provider>
  );
}

/* ----------------------------------------------------------------- TimelinePhase */

export type TimelinePhaseProps = {
  /** The phase's name, in sentence case: "Build". It labels the nested list. */
  label: string;
  /** The phase's total at the end of its heading. A number is seconds ("24s", read as "24 seconds"); a string is shown as given. Leave it out while the phase has not run. */
  duration?: number | string;
  /** The phase's data hue (P11). It colors this phase's rail bars and its segments in a TimelineBar. Without one they are the foreground at 55%. */
  hue?: TimelineHue;
  /** The phase's TimelineSteps. */
  children: ReactNode;
  /** Extra classes for the phase. */
  className?: string;
};

/** A group of steps under a heading row (the label and the total), with a nested, labelled list. */
export function TimelinePhase({ label, duration, hue, children, className = "" }: TimelinePhaseProps) {
  const id = useId();
  const total = duration === undefined ? null : readTime(duration);
  const value = useMemo(() => ({ hue }), [hue]);
  return (
    <li className={"not-first:mt-4 " + className}>
      <div className="flex min-h-8 items-center justify-between gap-4">
        <span id={id} className="text-small [font-weight:var(--weight)] text-fg-subtle">
          {label}
        </span>
        {total && (
          <span className="font-mono text-caption tabular-nums text-fg-subtle">
            <span aria-hidden="true">{total.visual}</span>
            <span className="sr-only">{total.spoken}</span>
          </span>
        )}
      </div>
      <PhaseContext.Provider value={value}>
        <ol role="list" aria-labelledby={id} className="m-0 list-none p-0">
          {children}
        </ol>
      </PhaseContext.Provider>
    </li>
  );
}

/* ----------------------------------------------------------------- TimelineStep */

export type TimelineStepProps = {
  /** The step's start on the run's clock, in the first column: "00:02". Leave it out for a step that has not started. */
  at?: string;
  /** What the step does, in sentence case: "Run build commands". It wraps on a narrow container. */
  label: string;
  /** How the step stands. The icon shows it and hidden text says it. */
  status: TimelineStatus;
  /** How long the step took, or has taken so far while it runs. Shown at the end of the row ("19s") and read as "19 seconds". A proportional timeline sizes the row by it. Leave it out for a step that has not run. */
  seconds?: number;
  /** How long the step took last run. A proportional timeline draws a ghost bar of this length beside the bar, with "was 31s" at its foot. Ignored when the timeline is not proportional. */
  previousSeconds?: number;
  /** Extra classes for the row. */
  className?: string;
};

/** One step: its start, a status icon on the rail, its label and its duration. In a proportional timeline a long step draws its time as a bar on the rail. */
export function TimelineStep({ at, label, status, seconds: took, previousSeconds, className = "" }: TimelineStepProps) {
  const { proportional, secondHeight } = useContext(TimelineContext);
  const { hue } = useContext(PhaseContext);

  const ran = isNum(took) && status !== "skipped" && status !== "pending";
  const bar = proportional && ran ? clean(took) * secondHeight : 0;
  const ghost = proportional && isNum(previousSeconds) && previousSeconds > 0 ? previousSeconds * secondHeight : 0;
  /* A bar shows once it is longer than a row would be anyway, or whenever there is a ghost to compare it with. */
  const showBar = bar >= BAR_MIN || (ghost > 0 && bar > 0);
  const longest = Math.max(showBar ? bar : 0, ghost);
  const captionTop = ghost > 0 ? Math.max(ROW, RAIL_TOP + ghost - CAPTION) : 0;
  const height = Math.max(ROW, longest > 0 ? longest + RAIL_TOP : 0, ghost > 0 ? captionTop + CAPTION : 0);

  const dim = status === "skipped" || status === "pending";
  const shown = status === "skipped" ? "skipped" : ran ? formatSeconds(clean(took)) : "";
  const spoken = ran ? speakSeconds(clean(took)) + (ghost > 0 ? `, was ${speakSeconds(previousSeconds!)} last run` : "") : "";
  const barTone = status === "failed" ? "bg-danger" : hue ? MARK[hue] : MARK_FG;

  return (
    <li
      data-step=""
      style={height > ROW ? { minHeight: height } : undefined}
      className={
        "grid min-h-8 grid-cols-[2.5rem_1rem_minmax(0,1fr)_auto] items-start gap-x-3 @min-[28rem]:grid-cols-[3rem_1rem_minmax(0,1fr)_auto] @min-[28rem]:gap-x-4 " +
        className
      }
    >
      <span className="flex h-8 items-center whitespace-nowrap font-mono text-caption tabular-nums text-fg-subtle">
        {at}
        {at && <span className="sr-only">,</span>}
      </span>

      {/* The rail is decoration: the status and the time are said in the text. */}
      <span aria-hidden="true" className="relative block self-stretch">
        <span className="absolute top-0 left-1/2 hidden h-2 w-px -translate-x-1/2 bg-line-strong [[data-step]+[data-step]_&]:block" />
        <span className="absolute top-6 bottom-0 left-1/2 hidden w-px -translate-x-1/2 bg-line-strong [[data-step]:has(+[data-step])_&]:block" />
        <StatusIcon status={status} />
        {ghost > 0 && <span className={"absolute top-6 left-3 w-1 rounded-control " + GHOST} style={{ height: ghost }} />}
        {showBar && <span className={"absolute top-6 left-1.5 z-10 w-1 rounded-control " + barTone} style={{ height: bar }} />}
      </span>

      <span className={"relative min-w-0 self-stretch py-1.5 text-small [font-weight:var(--weight)] " + (dim ? "text-fg-subtle" : "text-fg")}>
        {label}
        <span className="sr-only">{`, ${status}`}</span>
        {ghost > 0 && (
          <span aria-hidden="true" className="absolute left-0 whitespace-nowrap font-mono text-caption tabular-nums text-fg-subtle" style={{ top: captionTop }}>
            was {formatSeconds(previousSeconds!)}
          </span>
        )}
      </span>

      <span className="flex h-8 items-center justify-end whitespace-nowrap font-mono text-caption tabular-nums text-fg-subtle">
        {shown && <span aria-hidden="true">{shown}</span>}
        {spoken && <span className="sr-only">{`, ${spoken}`}</span>}
      </span>
    </li>
  );
}

/* ----------------------------------------------------------------- TimelineResult */

export type TimelineResultProps = {
  /** How the run ended, in words: "Live on atelier-nord.com". */
  label: string;
  /** The whole run's time at the end of the row. A number is seconds ("42s", read as "42 seconds"); a string is shown as given. */
  total: number | string;
  /** Success, danger or neither. It colors the label and is said in hidden text. */
  tone?: TimelineTone;
  /** Extra classes for the row. */
  className?: string;
};

/** The closing row of a run, under a hairline: the outcome in words, colored by its tone, and the total in mono. */
export function TimelineResult({ label, total, tone = "neutral", className = "" }: TimelineResultProps) {
  const t = readTime(total);
  return (
    <li className={"mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4 " + className}>
      <span className={"min-w-0 text-body [font-weight:var(--weight)] " + RESULT_TONE[tone]}>
        {label}
        <span className="sr-only">{RESULT_WORD[tone]}</span>
      </span>
      <span className="font-mono text-small tabular-nums whitespace-nowrap text-fg">
        <span aria-hidden="true">{t.visual}</span>
        <span className="sr-only">{`, ${t.spoken}`}</span>
      </span>
    </li>
  );
}

/* ----------------------------------------------------------------- TimelineBar */

export type TimelineBarStep = {
  /** The step's name, shown in the tooltip. */
  label: string;
  /** How long it took. A skipped step or one with zero seconds takes no width. */
  seconds: number;
  /** How it stands. A failed step's segment is danger. */
  status: TimelineStatus;
};

export type TimelineBarPhase = {
  /** The phase's name, shown above its span with its total: "Build · 24s". */
  label: string;
  /** The phase's data hue. Use the same hue as the TimelinePhase it matches. */
  hue?: TimelineHue;
  /** The phase's steps, in order. */
  steps: TimelineBarStep[];
};

export type TimelineBarProps = {
  /** What the run is, said at the start of the summary: "Update pricing page". */
  label: string;
  /** The run as data, in order. The same array can feed the Timeline beside it. */
  phases: TimelineBarPhase[];
  /** Height of the strip in px. The labels above and below add to it. */
  height?: number;
  /** Replaces the generated summary ("Update pricing page: Build 24 seconds, Deploy 18 seconds, 42 seconds in all"). */
  summary?: string;
  /** Extra classes for the whole bar, such as a top margin. */
  className?: string;
};

const MONO = 7.2; // advance of a 12px mono character

type Segment = TimelineBarStep & { start: number; hue?: TimelineHue };
type Span = { label: string; start: number; seconds: number };

function arrange(phases: TimelineBarPhase[]) {
  const segments: Segment[] = [];
  const spans: Span[] = [];
  let t = 0;
  for (const phase of phases) {
    const start = t;
    for (const step of phase.steps) {
      const s = clean(step.seconds);
      if (step.status === "skipped" || s <= 0) continue;
      segments.push({ ...step, seconds: s, start: t, hue: phase.hue });
      t += s;
    }
    if (t > start) spans.push({ label: phase.label, start, seconds: t - start });
  }
  return { segments, spans, total: t };
}

function segmentTone(status: TimelineStatus, hue?: TimelineHue) {
  if (status === "failed") return "bg-danger";
  if (status === "pending") return GHOST;
  return hue ? MARK[hue] : MARK_FG;
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

/** A whole run as one strip: a segment per step, sized by its seconds. It is a picture, so it sits beside a Timeline (or a table) that lists the same steps. */
export function TimelineBar({ label, phases, height = 32, summary, className = "" }: TimelineBarProps) {
  const [boxRef, width] = useWidth();
  const { segments, spans, total } = useMemo(() => arrange(phases), [phases]);

  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const active = dismissed ? null : (hover ?? pinned);
  useEffect(() => setDismissed(false), [hover, pinned]);

  /* Esc hides the tooltip, since nothing here takes focus to hide it from. */
  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDismissed(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  /* A tap pins the tooltip; the next touch anywhere else clears it. */
  useEffect(() => {
    if (pinned === null) return;
    const away = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setPinned(null);
    };
    document.addEventListener("pointerdown", away, true);
    return () => document.removeEventListener("pointerdown", away, true);
  }, [pinned, boxRef]);

  /* The segment under a pointer, found by time, so a 2px gap or a thin segment is as easy to reach as a wide one. */
  const stripRef = useRef<HTMLDivElement>(null);
  const indexAt = (clientX: number) => {
    const box = stripRef.current?.getBoundingClientRect();
    if (!box || box.width <= 0 || total <= 0) return null;
    const t = ((clientX - box.left) / box.width) * total;
    const i = segments.findIndex((s) => t >= s.start && t < s.start + s.seconds);
    return i < 0 ? null : i;
  };

  const text = useMemo(() => {
    if (summary) return summary;
    const parts = spans.map((s) => `${s.label} ${speakSeconds(s.seconds)}`);
    const failed = phases.flatMap((p) => p.steps).find((s) => s.status === "failed");
    return `${label}: ${[...parts, `${speakSeconds(total)} in all`].join(", ")}${failed ? `, failed at ${failed.label}` : ""}`;
  }, [summary, label, spans, total, phases]);

  /* The times under the strip: the start, each phase boundary and the end. Interior ones that would touch a neighbour are left out. */
  const times = useMemo(() => {
    if (total <= 0) return [];
    const marks = [0, ...spans.slice(1).map((s) => s.start), total];
    const items = marks.map((t, i) => {
      const w = clock(t).length * MONO;
      const x = (t / total) * width;
      const edge = i === 0 ? "start" : i === marks.length - 1 ? "end" : "middle";
      const left = edge === "start" ? 0 : edge === "end" ? width - w : x - w / 2;
      return { t, edge, left, right: left + w, pct: (t / total) * 100 };
    });
    if (width <= 0) return items;
    const lastLeft = items[items.length - 1]!.left;
    let reach = items[0]!.right;
    return items.filter((it, i) => {
      if (i === 0 || i === items.length - 1) return true;
      if (it.left < reach + 8 || it.right > lastLeft - 8) return false;
      reach = it.right;
      return true;
    });
  }, [spans, total, width]);

  const seg = active === null ? null : segments[active];
  const tipCx = seg && total > 0 ? ((seg.start + seg.seconds / 2) / total) * width : 0;

  return (
    <div ref={boxRef} role="img" aria-label={text} className={"w-full " + className}>
      {/* Phase labels sit over their spans. */}
      <div aria-hidden="true" className="relative mb-1 h-6">
        {total > 0 &&
          spans.map((s) => (
            <span
              key={s.start}
              className="absolute top-0 truncate pr-2 font-mono text-caption tabular-nums text-fg-subtle"
              style={{ left: `${(s.start / total) * 100}%`, width: `${(s.seconds / total) * 100}%` }}
            >
              {s.label} · {formatSeconds(s.seconds)}
            </span>
          ))}
      </div>

      <div className="relative" style={{ height }}>
        <div ref={stripRef} aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-control">
          {total <= 0 && <span className="absolute inset-0 bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]" />}
          {segments.map((s, i) => {
            const left = (s.start / total) * 100;
            const w = (s.seconds / total) * 100;
            const cut = (i === 0 ? 0 : 1) + (i === segments.length - 1 ? 0 : 1);
            return (
              <span
                key={i}
                className={"absolute inset-y-0 " + segmentTone(s.status, s.hue)}
                style={{ left: i === 0 ? `${left}%` : `calc(${left}% + 1px)`, width: `max(2px, calc(${w}% - ${cut}px))` }}
              >
                <span
                  className={
                    "absolute inset-0 bg-[color-mix(in_oklab,var(--fg)_16%,transparent)] transition-opacity duration-(--dur-instant) ease-litt " +
                    (active === i ? "opacity-100" : "opacity-0")
                  }
                />
              </span>
            );
          })}
        </div>

        {/* One layer takes the pointer, so a thin segment is as easy to reach as a wide one. On a finger it grows to 44px
            tall, and a touch pins the tooltip. A vertical drag still scrolls the page. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 inset-y-0 touch-pan-y select-none pointer-coarse:-inset-y-1.5"
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

        <AnimatePresence>
          {seg && (
            <Tip key="tip" cx={tipCx} width={width}>
              <span className="text-fg-muted">{seg.label}</span>
              <span className="font-mono text-caption [font-weight:var(--weight)] tabular-nums">{formatSeconds(seg.seconds)}</span>
            </Tip>
          )}
        </AnimatePresence>
      </div>

      {/* The times at the phase boundaries. */}
      <div aria-hidden="true" className="relative mt-2 h-6">
        {times.map((it) => (
          <span
            key={it.t}
            className={
              "absolute top-0 font-mono text-caption tabular-nums text-fg-subtle " + (it.edge === "middle" ? "-translate-x-1/2" : "")
            }
            style={it.edge === "end" ? { right: 0 } : { left: `${it.pct}%` }}
          >
            {clock(it.t)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- tooltip */

/** The Tooltip's look, as the Chart draws it: solid surface-3, shadow-tooltip, the label then the mono value. Above the strip, kept inside it. */
function Tip({ cx, width, children }: { cx: number; width: number; children: ReactNode }) {
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
    <div aria-hidden="true" className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2" style={{ left }}>
      <motion.div
        ref={ref}
        className="flex origin-bottom items-center gap-3 rounded-control bg-surface-3 px-2 py-1.5 text-small whitespace-nowrap text-fg shadow-tooltip inset-shadow-highlight"
        initial={{ opacity: 0, scale: 0.98, y: travel / 4 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: enter }}
        exit={{ opacity: 0, scale: 0.98, transition: exit }}
      >
        {children}
      </motion.div>
    </div>
  );
}
