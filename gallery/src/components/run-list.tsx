/**
 * Run list: an agent's runs for an app's sidebar or an inbox (components.md, "Run list"; proposals/agents-2.md; R3, R4,
 * R5, R7, R8, R9). Each run says what it is for, where it stands in words and a mark, how far it has got and when it
 * last changed. The runs that need the person come first, one run is open, and a Select filters by status. A row opens
 * the run's conversation or its Run card; it replaces neither.
 *
 * - Anatomy: a header 32px tall (the label at the small size and the title weight in --fg, the count at the caption
 *   size, tabular, in --fg-subtle, and a sm Select named "Filter runs by status" whose options carry their counts,
 *   "Needs you 2", with an empty status disabled), then the rows. With runs that need you and runs that do not, two
 *   groups under the headings "Needs you" and "Runs" (caption, the label weight, --fg-subtle); one group has no heading.
 *   `lift` is the one place the rule lives: the runs that need you first, then the rest, each in the caller's order.
 *   Nothing is sorted by time, and nothing reads a clock: `updated` is the caller's words.
 * - Row: a uniform 56px at the control radius, padded 8px by 12px, flat (R3). The 16px mark, the title (small, the
 *   title weight, --fg; a done run --fg-muted; cut at the end) over the status line (caption, --fg-subtle: "Running ·
 *   Step 2 of 5 · 40%", cut at the end) with the `updated` words at its end, tabular. Marks and words come from one
 *   table: running is the half-filled ring in --fg, needs you the empty ring in --fg with "Needs you" in --fg at the
 *   title weight, done the check in --fg-muted, failed the x in --danger with "Failed", stopped the dashed ring in
 *   --fg-subtle. Color sits on the mark only (R5, R7). A row is a link (`href`) or a button.
 * - Selected is raised (R3): a text-free backplate of the block (--block, --block-lift) with a layoutId, so it glides
 *   from row to row, and aria-current on the row. Hover is the Glide's one highlight moving row to row, under the block.
 * - Verbs: Stop on a running row and Archive on a finished one (done, failed, stopped), ghost sm icon-only in a
 *   Tooltip, named with the run ("Stop Fix the Halo build"), at the row's end in a column every row keeps, so nothing
 *   shifts when one shows. They show on hover and focus-within, always on a coarse pointer at 44px. A run that needs
 *   you has none: you answer it in the run.
 * - The moment (R4): press a row and the block glides to it on the responsive tier. Pick a filter and the rows that
 *   stay glide to their new places (layout="position") while the ones that arrive fade in, on the responsive tier.
 *   A run the agent changes moves to its new place at once, with no motion, because no hand asked: the filter press
 *   records the filter it asked for, and only the render that shows it glides (cleared in a layout effect after the
 *   commit). Every other render moves rows with Motion's instant transition, the one it uses under reduced motion.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): the block glides on fun mode's glide spring, the
 *   hover highlight stretches (the Glide's own fun path), and a run that becomes done, failed or needs you pops its
 *   mark once (0.6 to 1 on the pop spring), the one motion here that answers the agent, as a Plan step's arrival does.
 *   The pop's transform is cleared when it lands, so at rest the list is Calm's exactly.
 * - Keys and assistive tech: the rows take one Tab stop with a roving focus (the run last focused, else the selected,
 *   else the first). ↑ and ↓ move between runs, Home and End go to the ends, → moves to the row's verb and ← comes
 *   back, and Enter or Space opens the run. The Select keeps its own keys. A list is named by the label, or by its
 *   heading when there are two. Each row is named by its title, its status line and its `updated` words. One polite
 *   status says "Fix the Halo build needs you", "Move the Northwind site failed" or "Import the Cosmos catalog is done"
 *   when a run changes into one of those, never on the first render and never for a run that only appears. When a
 *   pressed verb had focus and its row leaves, focus moves to the row that takes its place.
 * - Motion: only transform and opacity move. Colors fade on the instant tier, verbs fade in on the instant tier, and a
 *   mark swaps at once. Reduced motion stills it all (the hooks return zero).
 * - Touch: verbs always show and grow to 44px; the Select grows to md; a pressed row takes the hover fill. A tap never
 *   glides the highlight. No swipe this round: Stop and Archive are buttons.
 * - Empty: "No runs yet." (or `empty`). With a filter that shows nothing: "No runs need you." and a ghost "Show all
 *   runs".
 * - Disabled or read-only: nothing to disable. Without `onStop` and `onArchive` the rows have no verbs and keep no
 *   column for them; without `onSelect` a row still opens its `href`.
 * - Forced colors: the block keeps a border and takes Highlight, and the selected row's words and mark HighlightText.
 */
import { Fragment, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { animate, LayoutGroup, motion, type AnimationPlaybackControls, type Transition } from "motion/react";
import { Button } from "@/components/button";
import { useGlide, GLIDE_ROW, type Glide } from "@/components/glide";
import { ArchiveIcon, StatusIcon, StopIcon, type StepStatus } from "@/components/icons";
import { Select } from "@/components/select";
import { Empty } from "@/components/states";
import { Tooltip } from "@/components/tooltip";
import { useDevice, useFun, useTransition } from "@/motion";

/** Where an agent's run stands. "needs-you" is a run waiting on the person: an approval, a question. */
export type RunStatus = "running" | "needs-you" | "done" | "failed" | "stopped";

/** Which runs the list shows: every run, or the runs in one status. */
export type RunFilter = "all" | RunStatus;

/** One of an agent's runs, as a row. */
export type AgentRun = {
  /** A stable id. It keys the row and is what `selectedId` names. Unique in the list; a later duplicate is left out. */
  id: string;
  /** What the run is for, in a few words, sentence case and no trailing dots: "Fix the Halo build". */
  title: string;
  /** Where it stands. The row says it in words and a mark. */
  status: RunStatus;
  /** What it is on or why it stopped, after the status word: "Step 2 of 5", "Approve npm run deploy". */
  detail?: string;
  /** How far a running run has got, from 0 to 1, shown as a whole percent after the detail. Ignored in any other status. */
  progress?: number;
  /** When it last changed, in your words, shown and read as given: "1m ago", "Yesterday". The list reads no clock. */
  updated: string;
  /** Makes the row a link to the run, such as its conversation. Without it the row is a button. */
  href?: string;
};

export type RunListProps = {
  /** The runs, in your order, newest change first. The ones that need the person are lifted above the rest; each group keeps your order. */
  runs: AgentRun[];
  /** The list's name, shown in its header with the count and read out for the list. */
  label?: string;
  /** The id of the open run. Its row is the raised block. You own this state. */
  selectedId?: string;
  /** Called with the run whose row was pressed, for a link too. Set `selectedId` from it, or from your route. */
  onSelect?: (run: AgentRun) => void;
  /** Shows Stop on running rows, and is called with the run. Without it running rows have none. */
  onStop?: (run: AgentRun) => void;
  /** Shows Archive on finished rows (done, failed, stopped), and is called with the run. Without it finished rows have none. */
  onArchive?: (run: AgentRun) => void;
  /** The status filter, when you control it. Pair it with onFilterChange. */
  filter?: RunFilter;
  /** The filter to start with when you do not control it. */
  defaultFilter?: RunFilter;
  /** Called with the filter the person picked, or "all" from Show all runs. */
  onFilterChange?: (filter: RunFilter) => void;
  /** What the list shows when there are no runs at all, in place of "No runs yet.", such as an Empty with a New run button. */
  empty?: ReactNode;
  /** Extra classes for the list, such as a width. It fills its container and does not scroll itself. */
  className?: string;
};

/* ----------------------------------------------------------------- the one table */

type Verb = "stop" | "archive";

/** Everything a status decides. A new status is one row here; nothing else branches on it. */
type Look = {
  /** The status word that starts the status line. */
  word: string;
  /** The word's own look: needs you is the one word in --fg at the title weight. */
  wordLook: string;
  mark: StepStatus;
  markTone: string;
  titleTone: string;
  /** Lifted above the rest. */
  needsYou: boolean;
  verb: Verb | null;
  /** What the live region says when a run changes into this status, and whether its mark pops in fun mode. */
  voice: ((title: string) => string) | null;
};

const STATUS: Record<RunStatus, Look> = {
  running: { word: "Running", wordLook: "", mark: "running", markTone: "text-fg", titleTone: "text-fg", needsYou: false, verb: "stop", voice: null },
  "needs-you": {
    word: "Needs you",
    wordLook: "font-title text-fg",
    mark: "pending",
    markTone: "text-fg",
    titleTone: "text-fg",
    needsYou: true,
    verb: null,
    voice: (title) => `${title} needs you`,
  },
  done: { word: "Done", wordLook: "", mark: "done", markTone: "text-fg-muted", titleTone: "text-fg-muted", needsYou: false, verb: "archive", voice: (title) => `${title} is done` },
  failed: { word: "Failed", wordLook: "", mark: "failed", markTone: "text-danger", titleTone: "text-fg", needsYou: false, verb: "archive", voice: (title) => `${title} failed` },
  stopped: { word: "Stopped", wordLook: "", mark: "skipped", markTone: "text-fg-subtle", titleTone: "text-fg", needsYou: false, verb: "archive", voice: null },
};

const VERB: Record<Verb, { word: string; icon: ReactNode }> = {
  stop: { word: "Stop", icon: <StopIcon /> },
  archive: { word: "Archive", icon: <ArchiveIcon /> },
};

const FILTERS: readonly RunFilter[] = ["all", "needs-you", "running", "done", "failed", "stopped"];
const FILTER_WORD: Record<RunFilter, string> = {
  all: "All",
  "needs-you": STATUS["needs-you"].word,
  running: STATUS.running.word,
  done: STATUS.done.word,
  failed: STATUS.failed.word,
  stopped: STATUS.stopped.word,
};
const NOTHING: Record<RunFilter, string> = {
  all: "No runs yet.",
  "needs-you": "No runs need you.",
  running: "No runs are running.",
  done: "No runs are done.",
  failed: "No runs failed.",
  stopped: "No runs were stopped.",
};

/** The Select hands back a string; this is the one place it becomes a filter. */
const toFilter = (value: string): RunFilter => FILTERS.find((f) => f === value) ?? "all";

/* ----------------------------------------------------------------- what the runs say */

type Group = { key: "needs-you" | "rest"; heading: string; runs: AgentRun[] };

type Reading = {
  /** Every run once, in the caller's order. */
  runs: AgentRun[];
  counts: Record<RunFilter, number>;
  /** The groups that have runs, needs you first. */
  groups: Group[];
  /** The visible runs in reading order, for the keys. */
  order: AgentRun[];
};

/** The rule "the runs that need you come first", written once: a stable partition of the caller's order. */
function lift(runs: readonly AgentRun[]): Group[] {
  const groups: Group[] = [
    { key: "needs-you", heading: "Needs you", runs: runs.filter((r) => STATUS[r.status].needsYou) },
    { key: "rest", heading: "Runs", runs: runs.filter((r) => !STATUS[r.status].needsYou) },
  ];
  return groups.filter((g) => g.runs.length > 0);
}

function readRuns(given: readonly AgentRun[], filter: RunFilter): Reading {
  const seen = new Set<string>();
  const runs = given.filter((r) => !seen.has(r.id) && !!seen.add(r.id));
  const counts: Record<RunFilter, number> = { all: runs.length, "needs-you": 0, running: 0, done: 0, failed: 0, stopped: 0 };
  for (const r of runs) counts[r.status] += 1;
  const groups = lift(filter === "all" ? runs : runs.filter((r) => r.status === filter));
  return { runs, counts, groups, order: groups.flatMap((g) => g.runs) };
}

const clamp01 = (n: number) => (n > 0 ? Math.min(1, n) : 0);

/** The status line after its word: the detail, then a running run's whole percent, rounded down. */
function lineParts(run: AgentRun): string[] {
  const parts = run.detail ? [run.detail] : [];
  if (run.status === "running" && run.progress !== undefined) parts.push(`${Math.floor(clamp01(run.progress) * 100 + 1e-9)}%`);
  return parts;
}

/* ----------------------------------------------------------------- pieces */

/** A pause a screen reader hears and the eye does not: the row's parts read as a sentence. */
const Pause = () => <span className="sr-only">, </span>;

/** The 16px mark, aligned to the title's line. In fun mode it pops once in the render its run arrived in a new status. */
function Mark({ status, pop, className }: { status: RunStatus; pop: boolean; className: string }) {
  const fun = useFun();
  const ref = useRef<HTMLSpanElement>(null);
  const landing = useRef<AnimationPlaybackControls | null>(null);
  /* Before the paint, so the first frame of a pop is its smallest and the rest frame never flashes first. A run that
     changes group mounts a new row, so the list says when to pop, not the mark's own memory. The next render says
     pop={false}, and the pop still lands: only a new pop or leaving stops it. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!fun || !el || !pop) return;
    landing.current?.stop();
    const run = animate(el, { scale: [0.6, 1] }, fun.pop);
    landing.current = run;
    void run.then(() => {
      if (landing.current === run) el.style.transform = "";
    });
  }, [pop, status, fun]);
  useLayoutEffect(() => () => landing.current?.stop(), []);
  const look = STATUS[status];
  return (
    <span ref={ref} aria-hidden="true" className={"flex h-5 items-center transition-colors duration-(--dur-instant) ease-litt " + look.markTone + className}>
      <StatusIcon status={look.mark} />
    </span>
  );
}

/* Flat and quiet: the block under it says selected, the Glide's highlight under that says hover. */
const ROW =
  "relative z-1 grid h-14 w-full cursor-pointer grid-cols-[1rem_minmax(0,1fr)] content-center items-start gap-x-3 rounded-control px-3 " +
  "text-left no-underline select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
  "group-data-coarse/runs:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/** The verb's column. Every row keeps it while the list has verbs, so the updated words line up and nothing shifts.
    A coarse pointer is read twice, from CSS and from useDevice (data-coarse), so a forced phone preview gets it too. */
const ROOM = "pr-10 pointer-coarse:pr-13 group-data-coarse/runs:pr-13";

const VERB_SLOT =
  "absolute top-1/2 right-1 z-2 -translate-y-1/2 opacity-0 transition-opacity duration-(--dur-instant) ease-litt " +
  "group-hover/run:opacity-100 group-focus-within/run:opacity-100 pointer-coarse:opacity-100 group-data-coarse/runs:opacity-100";

/** Motion's own instant transition, which it uses under reduced motion: the layout jumps and nothing moves. */
const AT_ONCE: Transition = { type: false };

/* ----------------------------------------------------------------- RunList */

/**
 * An agent's runs as a list: a filter with counts, then a row per run with its mark, title, status line and when it
 * changed. The runs that need you come first, the open run is the raised block that glides to the row you press, and
 * Stop or Archive sits on the row.
 */
export function RunList({
  runs,
  label = "Runs",
  selectedId,
  onSelect,
  onStop,
  onArchive,
  filter: filterProp,
  defaultFilter = "all",
  onFilterChange,
  empty,
  className = "",
}: RunListProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const { coarse } = useDevice();
  const fun = useFun();
  const enter = useTransition("responsive");

  const [inner, setInner] = useState<RunFilter>(defaultFilter);
  const filter = filterProp ?? inner;
  const reading = readRuns(runs, filter);
  const { order } = reading;
  const headed = reading.groups.length > 1;
  const hasVerbs = !!(onStop || onArchive);
  const handlerFor = (verb: Verb | null) => (verb === "stop" ? onStop : verb === "archive" ? onArchive : undefined);

  /* R4 in structure. A filter press records the filter it asked for, and only the render that shows it glides; the
     commit clears it, so a render the agent causes (a status, a new run) moves rows at once. The selection glides
     when it changes, which a press does. */
  const asked = useRef<RunFilter | null>(null);
  const byHand = asked.current === filter;
  const lastSelected = useRef(selectedId);
  const selectionMoved = lastSelected.current !== selectedId;
  useLayoutEffect(() => {
    asked.current = null;
    lastSelected.current = selectedId;
  });
  const rowMove = byHand ? enter : AT_ONCE;
  const blockMove = byHand || selectionMoved ? (fun?.glide ?? enter) : AT_ONCE;

  const pick = (next: RunFilter) => {
    asked.current = next;
    if (filterProp === undefined) setInner(next);
    onFilterChange?.(next);
  };

  /* Hover: the Glide's one highlight, for a mouse only. A tap shows the row's own pressed fill and leaves nothing lit. */
  const glideRef = useRef<Glide | null>(null);
  const glide = useGlide({
    onPointerRow: (index, _row, type) => {
      if (type === "mouse") glideRef.current?.setActive(index, "pointer");
    },
  });
  glideRef.current = glide;

  /* One Tab stop: the run last focused, else the selected one, else the first. */
  const [active, setActive] = useState<string | null>(null);
  const tabStop = order.find((r) => r.id === active) ?? order.find((r) => r.id === selectedId) ?? order[0];
  const rows = useRef(new Map<string, HTMLElement>());
  const verbs = useRef(new Map<string, HTMLElement>());
  const keep = (map: Map<string, HTMLElement>, key: string) => (el: HTMLElement | null) => {
    if (el) map.set(key, el);
    else map.delete(key);
  };

  const move = (e: KeyboardEvent<HTMLElement>, run: AgentRun) => {
    const at = order.findIndex((r) => r.id === run.id);
    const to = e.key === "ArrowDown" ? at + 1 : e.key === "ArrowUp" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? order.length - 1 : null;
    if (to === null) return false;
    e.preventDefault();
    const next = order[Math.max(0, Math.min(order.length - 1, to))];
    rows.current.get(next.id)?.focus();
    return true;
  };
  const onRowKey = (e: KeyboardEvent<HTMLElement>, run: AgentRun) => {
    if (move(e, run)) return;
    if (e.key === "ArrowRight") {
      const verb = verbs.current.get(run.id);
      if (verb) {
        e.preventDefault();
        verb.focus();
      }
    } else if (e.key === " " && run.href) {
      /* A link opens on Enter by itself; Space opens it too, as it presses a button row. */
      e.preventDefault();
      e.currentTarget.click();
    }
  };
  const onVerbKey = (e: KeyboardEvent<HTMLElement>, run: AgentRun) => {
    if (move(e, run)) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      rows.current.get(run.id)?.focus();
    }
  };

  /* A pressed verb or Show all runs that had focus can leave with what it acted on. After the commit, focus goes to
     the row that takes its place, so a keyboard never falls back to the page. */
  const refocus = useRef<{ id: string | null; at: number } | null>(null);
  useLayoutEffect(() => {
    const was = refocus.current;
    if (!was) return;
    refocus.current = null;
    if (was.id && verbs.current.has(was.id)) return;
    const next = order.find((r) => r.id === was.id) ?? order[Math.min(was.at, order.length - 1)];
    if (next) rows.current.get(next.id)?.focus({ preventScroll: true });
  });
  const hadFocus = (e: MouseEvent<HTMLElement>) => e.currentTarget === document.activeElement;

  /* The runs that arrived in needs you, failed or done since the last commit: the voice says them, and in fun mode
     their marks pop. Nothing on the first render, and nothing for a run that only appears. */
  const [said, setSaid] = useState("");
  const statuses = useRef<Map<string, RunStatus> | null>(null);
  const arrived = new Map<AgentRun, string>();
  for (const r of reading.runs) {
    const was = statuses.current?.get(r.id);
    const voice = STATUS[r.status].voice;
    if (was !== undefined && was !== r.status && voice) arrived.set(r, voice(r.title));
  }
  useLayoutEffect(() => {
    statuses.current = new Map(reading.runs.map((r) => [r.id, r.status]));
    if (arrived.size) setSaid([...arrived.values()].join(". "));
  });

  const options = FILTERS.map((f) => ({
    value: f,
    textValue: FILTER_WORD[f],
    disabled: f !== "all" && reading.counts[f] === 0,
    label: (
      <span className="flex w-full items-baseline justify-between gap-3">
        <span className="truncate">{FILTER_WORD[f]}</span>
        <span className="tabular-nums text-fg-subtle">{reading.counts[f]}</span>
      </span>
    ),
  }));

  let body: ReactNode;
  if (reading.runs.length === 0) {
    body = empty ?? (
      <Empty bare className="px-3 py-2">
        {NOTHING.all}
      </Empty>
    );
  } else if (order.length === 0) {
    body = (
      <Empty
        bare
        role="status"
        className="px-3 py-2"
        action={
          <Button
            variant="ghost"
            size="sm"
            className="-ml-control-pad-sm"
            onClick={(e) => {
              if (hadFocus(e)) refocus.current = { id: null, at: 0 };
              pick("all");
            }}
          >
            Show all runs
          </Button>
        }
      >
        {NOTHING[filter]}
      </Empty>
    );
  } else {
    body = (
      <LayoutGroup id={id}>
        {/* isolate: the rows' z-1 and the verbs' z-2 stack inside the list, never over a menu or tooltip portaled to the page. */}
        <div ref={glide.ref} {...glide.props} className="relative isolate grid">
          {glide.highlight}
          {reading.groups.map((group) => {
            const headingId = `${id}-${group.key}`;
            return (
              <Fragment key={group.key}>
                {headed && (
                  <motion.p
                    id={headingId}
                    layout="position"
                    transition={rowMove}
                    initial={byHand ? { opacity: 0 } : false}
                    animate={{ opacity: 1, transition: enter }}
                    className="flex h-8 items-center px-3 text-caption text-fg-subtle"
                  >
                    {group.heading}
                  </motion.p>
                )}
                <ul role="list" aria-labelledby={headed ? headingId : labelId} className="m-0 list-none p-0">
                  {group.runs.map((run) => {
                    const look = STATUS[run.status];
                    const selected = run.id === selectedId;
                    const verb = handlerFor(look.verb) ? look.verb : null;
                    const lit = selected ? " forced-colors:text-[HighlightText]" : "";
                    const shared = {
                      ref: keep(rows.current, run.id),
                      tabIndex: run.id === tabStop?.id ? 0 : -1,
                      "aria-current": selected ? ("true" as const) : undefined,
                      onClick: () => onSelect?.(run),
                      onFocus: () => setActive(run.id),
                      onKeyDown: (e: KeyboardEvent<HTMLElement>) => onRowKey(e, run),
                      className: ROW + (hasVerbs ? " " + ROOM : ""),
                    };
                    const content = (
                      <>
                        <Mark status={run.status} pop={arrived.has(run)} className={lit} />
                        <span className="grid min-w-0">
                          <span className={"truncate text-small font-title transition-colors duration-(--dur-instant) ease-litt " + look.titleTone + lit}>
                            {run.title}
                          </span>
                          <span className={"flex min-w-0 items-baseline gap-3 text-caption font-normal text-fg-subtle" + lit}>
                            <span className="min-w-0 truncate">
                              <Pause />
                              <span className={look.wordLook}>{look.word}</span>
                              {lineParts(run).map((part, i) => (
                                <Fragment key={i}>
                                  <span aria-hidden="true"> · </span>
                                  <Pause />
                                  {part}
                                </Fragment>
                              ))}
                            </span>
                            <span className="ml-auto shrink-0 tabular-nums">
                              <Pause />
                              {run.updated}
                            </span>
                          </span>
                        </span>
                      </>
                    );
                    return (
                      <motion.li
                        key={run.id}
                        {...GLIDE_ROW}
                        layout="position"
                        transition={rowMove}
                        initial={byHand ? { opacity: 0 } : false}
                        animate={{ opacity: 1, transition: enter }}
                        className="group/run relative"
                      >
                        {selected && (
                          <motion.span
                            layoutId="selected"
                            transition={blockMove}
                            aria-hidden="true"
                            className="absolute inset-0 rounded-control bg-block shadow-(--block-lift) forced-colors:border forced-colors:bg-[Highlight]"
                          />
                        )}
                        {run.href ? (
                          <a href={run.href} {...shared}>
                            {content}
                          </a>
                        ) : (
                          <button type="button" {...shared}>
                            {content}
                          </button>
                        )}
                        {verb && (
                          <span className={VERB_SLOT}>
                            <Tooltip content={VERB[verb].word}>
                              <Button
                                ref={keep(verbs.current, run.id)}
                                variant="ghost"
                                size={coarse ? "md" : "sm"}
                                iconOnly
                                tabIndex={-1}
                                aria-label={`${VERB[verb].word} ${run.title}`}
                                onKeyDown={(e) => onVerbKey(e, run)}
                                onClick={(e) => {
                                  if (hadFocus(e)) refocus.current = { id: run.id, at: order.indexOf(run) };
                                  handlerFor(verb)?.(run);
                                }}
                              >
                                {VERB[verb].icon}
                              </Button>
                            </Tooltip>
                          </span>
                        )}
                      </motion.li>
                    );
                  })}
                </ul>
              </Fragment>
            );
          })}
        </div>
      </LayoutGroup>
    );
  }

  return (
    <div data-coarse={coarse ? "" : undefined} className={"group/runs grid min-w-0 content-start gap-2 " + className}>
      <div className="flex min-h-8 items-center gap-3">
        <p id={labelId} className="flex min-w-0 flex-1 items-baseline gap-2 pl-3">
          <span className="truncate text-small font-title text-fg">{label}</span>
          <span className="text-caption font-normal tabular-nums text-fg-subtle">{reading.counts.all}</span>
        </p>
        <div className="w-36 shrink-0">
          <Select size={coarse ? "md" : "sm"} aria-label="Filter runs by status" value={filter} onValueChange={(v) => pick(toFilter(v))} options={options} />
        </div>
      </div>
      {body}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </div>
    </div>
  );
}
