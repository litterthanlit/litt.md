/**
 * File changes: what an agent changed in a codebase, to review before keeping it (components.md, "File changes";
 * proposals/agents-2.md). The same component is an edit call's details (one file) and the end of a turn (every file).
 *
 * - Anatomy: bare in the turn, as a Plan is (R3: a review is not an approval, so it is no box). A header, when
 *   `summary`, at least 32px tall (44px on a finger): "4 files changed" (small, the title weight, --fg) over a caption
 *   in --fg-subtle, "15 lines added, 9 removed · 4 left to review", the count a Rolling number. At its end Keep all (a
 *   secondary sm button, the raised block; primary with `accent`) and Undo all (ghost sm). Once any file is decided
 *   they say "Keep the rest" and "Undo the rest", and both act on pending files only, so a press never re-decides a
 *   file the person chose. With nothing pending the buttons go, the header keeps its height, and the caption is a
 *   receipt: "All reviewed: 3 kept, 1 undone". Below 28rem (a container query) the buttons sit under the words.
 * - Row: a list item at least 32px tall (44px on a finger) at the control radius. A disclosure button holds the
 *   chevron, a 16px FileIcon in --fg-subtle and the path in mono at the small size, the directory in --fg-subtle and
 *   cut first, from its start so the nearest folder stays ("…styles/fonts.css"), the file name in --fg and never
 *   cut. After it, in the caption size: the kind in words for added, deleted and renamed in --fg-muted (modified
 *   shows none), the counts "+24 −6" (tabular, the sign in --success or --danger, the figures in --fg-muted, the minus
 *   U+2212), and a decided file's word: "Kept" with the check in --fg-muted, or "Undone" with the undo mark in
 *   --fg-subtle. A rename's old
 *   path is a line of its own under it ("from src/styles/typography.css"). Below 28rem the kind, the counts and the
 *   word drop to a second line. A row that opens takes fg 6% under the pointer, and the fill reaches 8px past the
 *   words, so the row's chevron stands in the column where a tool call shows its mark.
 * - Verbs: beside the button, outside it, Keep (a check) and Undo (the undo mark), ghost sm icon-only buttons in
 *   Tooltips, named with the file ("Keep src/app/layout.tsx"). A row shows the verbs that differ from its state:
 *   pending shows both, kept shows Undo, undone shows Keep. Each has a fixed slot, so a verb never moves and nothing
 *   beside a decided row shifts. No strikethrough and no tinted rows (R7): the path steps back to --fg-muted (kept) or
 *   --fg-subtle (undone), and the word says it (R5).
 * - Diff: a CodeBlock with lang "diff", no filename (the row says it) and a 20rem cap, indented 24px under the row in
 *   a copy of Tool call's Reveal, so this item installs without tool-call. One change starts open, many start closed,
 *   and `defaultOpen` overrides. A change with no diff has no chevron, unless `onOpenChange` is given: then it opens
 *   and says "Loading the diff" until the caller passes one.
 * - Counts: `added` and `removed` when given, else counted from the diff's hunks as CodeBlock reads them (`+` and `-`
 *   lines, never the `+++` and `---` header lines).
 * - Decisions: `onDecide(ids, decision)` is the only write path, and the component holds no decision: a change's
 *   `state` is the caller's. Keep all passes every pending id, so pressing it twice converges.
 * - The moment: a decision settles the row. The verbs give way to the word at once, the path steps back on the
 *   instant tier, and the header's count rolls down on the responsive tier. Nothing else moves.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): the check of each row Keep all decides pops in a
 *   wave down the list (k × fun.wave apart, scale 0.6 to 1 on fun.pop), and a single Keep pops its own. Only a press
 *   here pops a check: a state the caller changes by itself settles as in Calm (R4). The transform is cleared when it
 *   lands, and a mark stands on its own paint layer in both modes, so the rest frame is Calm's to the pixel.
 * - Keys and assistive tech: the files are a list named by `label`. Tab visits each row's disclosure (aria-expanded,
 *   aria-controls while open, named in one run by the path, the kind, the lines in words and the decision: "src/app.tsx,
 *   added, 12 lines added, kept"; the drawn parts are hidden from it), then its verbs; Enter or Space opens the diff,
 *   whose scroller is the next stop. No single-letter keys: every verb is a Tab stop. One polite
 *   status, filled from the difference between renders so a caller's own change speaks too, says "Kept
 *   src/app/layout.tsx", "Undid 3 files" and "All reviewed: 3 kept, 1 undone", never on the first render. When a
 *   pressed verb had focus and is replaced, focus moves to the verb that replaces it; when Keep all leaves, focus
 *   moves to the header, which reads the receipt (Tool approval's pattern).
 * - Motion: only transform and opacity move, plus color on the instant tier. The chevron turns a quarter on the
 *   instant tier. A diff fades in and travels a quarter of the travel token on the responsive tier and leaves on the
 *   exit token; its height snaps. Reduced motion: the hooks return 0 and fun mode is off, so everything happens at once.
 * - Touch: rows, verbs and the header's buttons are 44px on a finger (useDevice, so a phone preview shows it too). A
 *   pressed row takes its hover fill. A Tooltip opens on a press and hold, and the verbs' names carry the file.
 * - Disabled or read-only: with no `onDecide` there are no verbs and no header buttons; the rows show their state
 *   words only. Empty: "No files changed."
 * - Forced colors: the signs and marks are glyphs, the state is words, and Keep all keeps the Button's border.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { animate, AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/button";
import { CodeBlock } from "@/components/code-block";
import { CheckIcon, ChevronRightIcon, FileIcon, UndoIcon } from "@/components/icons";
import { RollingNumber } from "@/components/rolling-number";
import { Tooltip } from "@/components/tooltip";
import { useDevice, useExit, useFun, useTransition, useTravel } from "@/motion";

/* ----------------------------------------------------------------- data */

/** What happened to a file. The row shows it in words, except a plain edit, which only its spoken name says. */
export type FileChangeKind = "added" | "modified" | "deleted" | "renamed";

/** Where the person's review of a file stands. */
export type FileChangeState = "pending" | "kept" | "undone";

/** What a person can decide about a file. Nobody decides "pending". */
export type FileDecision = Exclude<FileChangeState, "pending">;

type FileChangeBase = {
  /** A stable id, unique in the review: the path is a good one. Decisions are reported by id; a later duplicate is left out. */
  id: string;
  /** The file's path now, with slashes: "src/app/layout.tsx". The directory is cut first and the file name never. */
  path: string;
  /** The file's unified diff, shown as a CodeBlock when the row opens. Leave it out until you have it, and pass onOpenChange to load it. */
  diff?: string;
  /** Lines added. Left out, it is counted from `diff`. */
  added?: number;
  /** Lines removed. Left out, it is counted from `diff`. */
  removed?: number;
  /** Where the review stands. Defaults to pending. It is yours: set it from onDecide. */
  state?: FileChangeState;
};

/** One file the agent changed. Only a rename names where the file came from. */
export type FileChange = FileChangeBase &
  ({ kind: Exclude<FileChangeKind, "renamed">; from?: never } | { kind: "renamed"; /** The path before the rename. */ from: string });

export type FileChangesProps = {
  /** The files the agent changed, in the order to review them. Each one's `state` is yours: set it in onDecide. */
  changes: FileChange[];
  /** Called with the ids a press decides and the decision: one id from a row's Keep or Undo, every pending id from Keep all or Undo all. Set those changes' state in it. Without it the list is read-only and shows the state words only. */
  onDecide?: (ids: string[], decision: FileDecision) => void;
  /** Names the list for assistive tech. */
  label?: string;
  /** Shows the header: how many files changed, the lines in words, how many are left to review, and Keep all and Undo all. Turn it off for one file in an edit call's details, where the call's row says the rest. */
  summary?: boolean;
  /** Whether every diff starts open. Left out, one change starts open and many start closed. */
  defaultOpen?: boolean;
  /** Makes Keep all the primary action, the view's one accent fill, on a review screen with no Composer. In a chat leave it off: Send keeps the accent. */
  accent?: boolean;
  /** Called with the change and whether its diff is now open, when the person opens or closes a row. With it a change with no diff opens too and says "Loading the diff" until you pass one. */
  onOpenChange?: (change: FileChange, open: boolean) => void;
  /** Extra classes for the review, such as a top margin. It fills its container. */
  className?: string;
};

/* ----------------------------------------------------------------- what the changes say */

/** What the kind says: the visible word, or a hidden one for a plain edit. */
const KIND: Record<FileChangeKind, { word: string; shown: boolean }> = {
  added: { word: "Added", shown: true },
  modified: { word: "modified", shown: false },
  deleted: { word: "Deleted", shown: true },
  renamed: { word: "Renamed", shown: true },
};

/** A decided file's word, its mark and how far its path steps back. Pending says nothing. */
const SETTLED: Record<FileDecision, { word: string; tone: string; name: string }> = {
  kept: { word: "Kept", tone: "text-fg-muted", name: "text-fg-muted" },
  undone: { word: "Undone", tone: "text-fg-subtle", name: "text-fg-subtle" },
};

/** The two verbs in the order of their slots. A row shows the ones that differ from its state. */
const DECISIONS: readonly FileDecision[] = ["kept", "undone"];
const VERB: Record<FileDecision, { label: string; icon: ReactNode }> = {
  kept: { label: "Keep", icon: <CheckIcon /> },
  undone: { label: "Undo", icon: <UndoIcon /> },
};
const other = (d: FileDecision): FileDecision => (d === "kept" ? "undone" : "kept");

/** Lines added and removed, read from the diff as CodeBlock reads it: with hunks, nothing before the first @@ counts. */
function countDiff(diff: string): { added: number; removed: number } {
  const lines = diff.replace(/\r\n?/g, "\n").split("\n");
  const hunks = lines.some((l) => l.startsWith("@@"));
  let inHunk = !hunks;
  let added = 0;
  let removed = 0;
  for (const line of lines) {
    if (line.startsWith("@@")) inHunk = true;
    else if (!inHunk || (!hunks && (line.startsWith("+++") || line.startsWith("---")))) continue;
    else if (line.startsWith("+")) added++;
    else if (line.startsWith("-")) removed++;
  }
  return { added, removed };
}

type Row = { change: FileChange; state: FileChangeState; added: number; removed: number };
type Review = { rows: Row[]; added: number; removed: number; pending: number; kept: number; undone: number };

/** One reading of the changes for the header, the rows, the live region and the moment, so they never disagree. A later duplicate id is left out. */
function readReview(changes: readonly FileChange[]): Review {
  const seen = new Set<string>();
  const rows: Row[] = [];
  for (const change of changes) {
    if (seen.has(change.id)) continue;
    seen.add(change.id);
    const counted = change.added === undefined || change.removed === undefined ? countDiff(change.diff ?? "") : { added: 0, removed: 0 };
    rows.push({ change, state: change.state ?? "pending", added: change.added ?? counted.added, removed: change.removed ?? counted.removed });
  }
  const count = (s: FileChangeState) => rows.filter((r) => r.state === s).length;
  return {
    rows,
    added: rows.reduce((n, r) => n + r.added, 0),
    removed: rows.reduce((n, r) => n + r.removed, 0),
    pending: count("pending"),
    kept: count("kept"),
    undone: count("undone"),
  };
}

const lines = (n: number) => `${n} ${n === 1 ? "line" : "lines"}`;
const files = (n: number) => `${n} ${n === 1 ? "file" : "files"}`;

/** "All reviewed: 3 kept, 1 undone". The header's receipt and what the live region says, in the same words. */
const receipt = (r: Review) => `All reviewed: ${[r.kept && `${r.kept} kept`, r.undone && `${r.undone} undone`].filter(Boolean).join(", ")}`;

/** "24 lines added, 6 removed", "12 lines added", "6 lines removed": what the figures say, for screen readers. */
function spokenCounts(added: number, removed: number): string {
  if (added && removed) return `${lines(added)} added, ${removed} removed`;
  if (added) return `${lines(added)} added`;
  return removed ? `${lines(removed)} removed` : "";
}

/** "Kept src/app/layout.tsx" or "Kept 3 files". */
const decided = (verb: string, rows: Row[]) => (rows.length === 1 ? `${verb} ${rows[0].change.path}` : `${verb} ${files(rows.length)}`);

/** What a row says to a screen reader, in one run: "src/styles/type.css, renamed from src/styles/typography.css, 1 line added, 1 removed, kept". */
function spokenRow({ change, state, added, removed }: Row): string {
  const kind = KIND[change.kind].word.toLowerCase() + (change.kind === "renamed" ? ` from ${change.from}` : "");
  return [change.path, kind, spokenCounts(added, removed), state === "pending" ? "" : SETTLED[state].word.toLowerCase()].filter(Boolean).join(", ");
}

/* ----------------------------------------------------------------- shared pieces */

const COLOR_FADE = "transition-colors duration-(--dur-instant) ease-litt";
/* A row that opens takes fg 6% under the pointer, and under a finger while it is pressed. */
const ROW_FILL =
  "transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]";

/** The body under a row, copied from Tool call's Reveal: it fades in and travels a quarter of the travel token on the responsive tier, and leaves on the exit token. Its height snaps. */
function Reveal({ open, id, className = "", children }: { open: boolean; id: string; className?: string; children: ReactNode }) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  /* A body open on the first render appears without a fade. Not through AnimatePresence initial={false}, which would
     swallow the entrances of every motion component inside it (see tabs.tsx). */
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="body"
          id={id}
          className={className}
          initial={mounted.current ? { opacity: 0, y: -travel / 4 } : false}
          animate={{ opacity: 1, y: 0, transition: enter }}
          exit={{ opacity: 0, transition: exit }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The path in mono: the directory in the quiet ink, cut first and from its start; the file name in its row's ink, never cut (it wraps as a last resort). */
function Path({ path, tone }: { path: string; tone: string }) {
  /* The directory is cut from its start, so the folder nearest the file stays: "…styles/fonts.css". Right to left
     only for where the ellipsis goes; the words inside stay an isolated left-to-right run. */
  const slash = path.lastIndexOf("/");
  return (
    <span className="flex min-w-0 max-w-full font-mono text-small">
      {slash > 0 && (
        <span className="min-w-0 truncate text-fg-subtle [direction:rtl]">
          <span dir="ltr">{path.slice(0, slash)}</span>
        </span>
      )}
      <span className={"max-w-full shrink-0 [overflow-wrap:anywhere] " + tone + " " + COLOR_FADE}>{path.slice(Math.max(0, slash))}</span>
    </span>
  );
}

/** The counts as "+24 −6", the sign in its status color. Nothing when no line changed. The row's spoken name says them in words. */
function Counts({ added, removed }: { added: number; removed: number }) {
  if (!added && !removed) return null;
  return (
    <span className="shrink-0 whitespace-nowrap text-caption font-normal tabular-nums text-fg-muted">
      {added > 0 && (
        <>
          <span className="text-success">+</span>
          {added}
        </>
      )}
      {added > 0 && removed > 0 && " "}
      {removed > 0 && (
        <>
          <span className="text-danger">{"−"}</span>
          {removed}
        </>
      )}
    </span>
  );
}

/* ----------------------------------------------------------------- FileChanges */

/** Who the focus goes to once a press has been decided: the verb that replaces the pressed one, or the header. */
type Handoff = { ids: string[]; decision: FileDecision; bulk: boolean };

/**
 * What an agent changed: a header with the counts, Keep all and Undo all, and a row per file with its lines added and
 * removed, its diff under it, and Keep and Undo. It holds no decision of its own: it reports them through onDecide and
 * shows the state you give back, so the same files can be an edit call's details and the end-of-turn review.
 */
export function FileChanges({
  changes,
  onDecide,
  label = "Files changed",
  summary = true,
  defaultOpen,
  accent = false,
  onOpenChange,
  className = "",
}: FileChangesProps) {
  const id = useId();
  const { coarse } = useDevice();
  const fun = useFun();
  const review = readReview(changes);
  const { rows } = review;
  const decidedCount = review.kept + review.undone;

  /* Disclosure is the only state the review keeps: it dies with the page. What starts open is settled on the first render. */
  const [startOpen] = useState(defaultOpen ?? rows.length === 1);
  const [opened, setOpened] = useState<Record<string, boolean>>({});

  const verbs = useRef(new Map<string, HTMLButtonElement>());
  const marks = useRef(new Map<string, HTMLSpanElement>());
  const header = useRef<HTMLDivElement>(null);
  const handoff = useRef<Handoff | null>(null);
  /* The files a press here asked to keep. Only those pop in fun mode: a state the caller changes alone settles as in Calm. */
  const byHand = useRef(new Set<string>());

  const press = (ids: string[], decision: FileDecision, bulk: boolean, e: MouseEvent<HTMLButtonElement>) => {
    if (!ids.length) return;
    handoff.current = e.currentTarget === document.activeElement ? { ids, decision, bulk } : null;
    if (decision === "kept") ids.forEach((i) => byHand.current.add(i));
    onDecide?.(ids, decision);
  };
  const pendingIds = rows.filter((r) => r.state === "pending").map((r) => r.change.id);

  /* Each file's state at the last commit. The pop reads it before paint, then the live region reads it and moves it on. */
  const last = useRef<Map<string, FileChangeState> | null>(null);

  /* Fun mode's pop: the checks of the rows a press kept, in reading order, before they paint. A mark always stands
     on its own paint layer (scale-100, in Calm too), so a wave of pops changes a value and never makes and drops
     layers, whose fresh raster differs from the first by a few pixels of anti-aliasing: the rest frame is Calm's. */
  useLayoutEffect(() => {
    const before = last.current;
    if (!before) return;
    let k = 0;
    for (const r of rows) {
      const was = before.get(r.change.id);
      if (was === undefined || was === r.state) continue;
      const asked = byHand.current.delete(r.change.id);
      const mark = marks.current.get(r.change.id);
      if (!fun || !asked || r.state !== "kept" || !mark) continue;
      animate(mark, { scale: [0.6, 1] }, { ...fun.pop, delay: k++ * fun.wave }).then(() => {
        mark.style.transform = "";
      });
    }
  });

  /* One voice for every change, the caller's own included. Quiet on the first render. */
  const [said, setSaid] = useState("");
  useEffect(() => {
    const before = last.current;
    last.current = new Map(rows.map((r) => [r.change.id, r.state]));
    if (!before) return;
    const became = (s: FileDecision) => rows.filter((r) => r.state === s && before.has(r.change.id) && before.get(r.change.id) !== s);
    const kept = became("kept");
    const undone = became("undone");
    const words: string[] = [];
    if (kept.length) words.push(decided("Kept", kept));
    if (undone.length) words.push(decided("Undid", undone));
    const wasPending = rows.some((r) => (before.get(r.change.id) ?? "pending") === "pending");
    if (rows.length && review.pending === 0 && wasPending) words.push(receipt(review));
    if (words.length) setSaid(words.join(". "));
  });

  /* Focus follows a press once the caller has decided it: to the verb that replaced the pressed one, or to the header
     once Keep all and Undo all have gone. Only when focus fell to the page, so a person who moved on keeps their place. */
  useEffect(() => {
    const h = handoff.current;
    if (!h) return;
    const state = new Map(rows.map((r) => [r.change.id, r.state]));
    if (h.ids.some((i) => state.has(i) && state.get(i) !== h.decision)) return;
    handoff.current = null;
    if (document.activeElement && document.activeElement !== document.body) return;
    const next = h.bulk ? header.current : verbs.current.get(`${h.ids[0]} ${other(h.decision)}`);
    next?.focus({ preventScroll: true });
  });

  const control = coarse ? "md" : "sm";
  const slot = coarse ? "size-11" : "size-8";
  const rowHeight = coarse ? "min-h-11" : "min-h-8";

  const head = summary && rows.length > 0 && (
    <div
      ref={header}
      tabIndex={-1}
      className={
        "grid gap-2 rounded-control @md:flex @md:items-center @md:justify-between @md:gap-4 " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
        rowHeight
      }
    >
      <div className="min-w-0">
        <p className="text-small font-title text-fg">{files(rows.length)} changed</p>
        <p className="text-caption font-normal text-fg-subtle">
          {lines(review.added)} added, {review.removed} removed
          <span aria-hidden="true"> · </span>
          <span className="sr-only">. </span>
          {review.pending > 0 ? (
            <>
              <RollingNumber value={review.pending} /> left to review
            </>
          ) : (
            receipt(review)
          )}
        </p>
      </div>
      {onDecide &&
        (review.pending > 0 ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button size={control} variant={accent ? "primary" : "secondary"} onClick={(e) => press(pendingIds, "kept", true, e)}>
              {decidedCount ? "Keep the rest" : "Keep all"}
            </Button>
            <Button size={control} variant="ghost" onClick={(e) => press(pendingIds, "undone", true, e)}>
              {decidedCount ? "Undo the rest" : "Undo all"}
            </Button>
          </div>
        ) : (
          /* The buttons' place, kept so the header keeps its height when they go. */
          <div aria-hidden="true" className={"shrink-0 " + (coarse ? "h-11" : "h-8")} />
        ))}
    </div>
  );

  return (
    <div className={"@container min-w-0 " + className}>
      {head}
      {rows.length === 0 ? (
        <p className={"text-small text-fg-subtle " + (summary ? "mt-2" : "")}>No files changed.</p>
      ) : (
        <ul aria-label={label} className={"m-0 grid list-none p-0 " + (summary ? "mt-2" : "")}>
          {rows.map((row) => {
            const { change, state } = row;
            const key = change.id;
            const bodyId = `${id}-${key}`;
            const opens = change.diff !== undefined || onOpenChange !== undefined;
            const open = opens && (opened[key] ?? startOpen);
            const toggle = () => {
              setOpened((all) => ({ ...all, [key]: !open }));
              onOpenChange?.(change, !open);
            };
            const settled = state === "pending" ? null : SETTLED[state];
            const kind = KIND[change.kind];

            /* The parts are drawn for the eye and said in one run (spokenRow), so a screen reader never hears the
               layout's gaps inside a path or between the parts. */
            const content = (
              <>
                <span className="sr-only">{spokenRow(row)}</span>
                <span aria-hidden="true" className="grid h-5 place-items-center text-fg-subtle">
                  {opens && (
                    <ChevronRightIcon className={"transition-[rotate] duration-(--dur-instant) ease-litt " + (open ? "rotate-90" : "rotate-0")} />
                  )}
                </span>
                <span aria-hidden="true" className="grid h-5 place-items-center text-fg-subtle">
                  <FileIcon />
                </span>
                <span aria-hidden="true" className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <Path path={change.path} tone={settled ? settled.name : "text-fg"} />
                  <span className="flex min-w-0 items-center gap-2 @max-md:basis-full">
                    {kind.shown && <span className="shrink-0 text-caption text-fg-muted">{kind.word}</span>}
                    <Counts added={row.added} removed={row.removed} />
                    {settled && (
                      <span className={"flex shrink-0 items-center gap-1 text-caption " + settled.tone + " " + COLOR_FADE}>
                        <span
                          className="inline-flex scale-100"
                          ref={(el) => {
                            if (el) marks.current.set(key, el);
                            else marks.current.delete(key);
                          }}
                        >
                          {state === "kept" ? <CheckIcon /> : <UndoIcon />}
                        </span>
                        {settled.word}
                      </span>
                    )}
                  </span>
                  {change.kind === "renamed" && (
                    <span className="min-w-0 basis-full truncate text-caption font-normal text-fg-subtle">
                      from <span className="font-mono">{change.from}</span>
                    </span>
                  )}
                </span>
              </>
            );
            const grid = "grid min-w-0 flex-1 grid-cols-[1rem_1rem_minmax(0,1fr)] items-start gap-x-2 text-left " + (coarse ? "py-3" : "py-1.5");

            return (
              <li key={key} className="min-w-0">
                <div
                  className={
                    "-mx-2 flex min-w-0 items-start gap-2 rounded-control px-2 " + rowHeight + (opens ? " " + ROW_FILL : "")
                  }
                >
                  {opens ? (
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={open ? bodyId : undefined}
                      onClick={toggle}
                      className={
                        grid +
                        " cursor-pointer rounded-control [-webkit-tap-highlight-color:transparent] " +
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      }
                    >
                      {content}
                    </button>
                  ) : (
                    <div className={grid}>{content}</div>
                  )}
                  {onDecide && (
                    <div className="flex shrink-0">
                      {DECISIONS.map((decision) => (
                        <span key={decision} className={"grid place-items-center " + slot}>
                          {decision !== state && (
                            <Tooltip content={VERB[decision].label}>
                              <Button
                                ref={(el: HTMLButtonElement | null) => {
                                  const k = `${key} ${decision}`;
                                  if (el) verbs.current.set(k, el);
                                  else verbs.current.delete(k);
                                }}
                                iconOnly
                                size={control}
                                variant="ghost"
                                aria-label={`${VERB[decision].label} ${change.path}`}
                                onClick={(e) => press([key], decision, false, e)}
                              >
                                {VERB[decision].icon}
                              </Button>
                            </Tooltip>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {opens && (
                  <Reveal open={open} id={bodyId} className="pt-1 pb-2 pl-6">
                    {change.diff !== undefined ? (
                      <CodeBlock lang="diff" code={change.diff} label={`Diff of ${change.path}`} maxHeight="20rem" />
                    ) : (
                      <p className="py-1.5 text-small text-fg-subtle">Loading the diff</p>
                    )}
                  </Reveal>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </div>
    </div>
  );
}
