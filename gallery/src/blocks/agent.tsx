/**
 * Agent: a chat with an agent, from the first word to the deploy, beside the studio's other runs. A block: a whole
 * screen built from the litt parts, to copy and make your own.
 *
 * Litt, a studio's agent, fixes a failing build while you watch: the conversation, the thinking, a plan, a run of tool
 * calls that each open to what they found (a build's log as it streams, the web search's sources, the edit's file), an
 * approval, the answer with its citations, the review of the files Litt changed, the sources it cites, and the
 * composer. On a wide frame the studio's runs sit beside the chat, and the Halo row is read from the same moment of the
 * chat, so it says Needs you while the approval waits. The one accent fill is Allow while the approval waits, and Send
 * when there is something to send; Keep all is a raised block, because a review does not stop the agent.
 *
 * The run is a script (below), so every state of a turn shows without a model. Keeping or undoing a file is the
 * person's, not the script's: one decision per file, held in React state beside the script and shared by the edit call
 * and the review. To wire in your own agent, keep LittTurn and the layout, and replace useRun with your stream: a View
 * is what the chat shows at one moment.
 */
import { Fragment, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { Composer, FileChip } from "@/components/composer";
import { FileChanges, type FileChange, type FileDecision } from "@/components/file-changes";
import type { StepStatus } from "@/components/icons";
import { LogView, type LogLine } from "@/components/log-view";
import { Conversation, Message, MessageActions, MessageText } from "@/components/message";
import { Plan } from "@/components/plan";
import { RunList, type AgentRun } from "@/components/run-list";
import { Select } from "@/components/select";
import { Citation, SourceList, Sources, unlinkCitations, type Source } from "@/components/sources";
import { Thinking } from "@/components/thinking";
import { ToolApproval, ToolCall, ToolCallGroup, type ToolApprovalDecision, type ToolCallProps } from "@/components/tool-call";
import { useDevice } from "@/motion";

/* ---------------------------------------------------------------- the script

   One timeline drives the whole run. A beat is a wait and a step of the story: after `ms`, `to` turns one view of the
   chat into the next. The views are folded once, at load, so the chat at any moment is a pure function of the track and
   a cursor. Nothing here is random and nothing reads the clock, so every load plays the same run. The Thinking clock
   is the one thing that reads real time, because that is what a clock is.

   The run has three tracks. "run" goes from the first message to the approval and stops there: the person decides.
   Allow continues on the "allow" track and Deny on the "deny" track. The phone shows the end of "allow". */

type CallState = "running" | "done" | "failed" | "stopped";

type View = {
  /** Words of the reasoning shown so far. */
  thought: number;
  thinking: boolean;
  plan: boolean;
  steps: StepStatus[];
  /** One entry per tool call shown so far. */
  calls: CallState[];
  /** Lines the running call's log has written so far. A call that has ended shows all of its lines. */
  lines: number;
  approval: "none" | ToolApprovalDecision;
  deploy: "none" | "running" | "done" | "stopped";
  /** Words of the answer's two paragraphs, and whether the review of the changed files is in between them. */
  words1: number;
  review: boolean;
  words2: number;
  done: boolean;
};

type Beat = { ms: number; to: (view: View) => View };

/* ---- words */

/** A run of the answer: words, a code span, or a citation of a source by its id. */
type Run = string | { code: string } | { cite: string };

/** One token per word, one per code span and one per citation. A word keeps the space after it, so a join reads as the sentence. */
const tokens = (runs: Run[]): Run[] => runs.flatMap((r): Run[] => (typeof r === "string" ? (r.match(/\s*\S+\s*/g) ?? []) : [r]));
const total = (paragraphs: Run[][]) => paragraphs.reduce((n, p) => n + tokens(p).length, 0);

/** The first `count` tokens of some paragraphs, as the paragraphs they fall in. */
function reveal(paragraphs: Run[][], count: number): Run[][] {
  let left = count;
  const out: Run[][] = [];
  for (const paragraph of paragraphs) {
    if (left <= 0) break;
    const part = tokens(paragraph).slice(0, left);
    left -= part.length;
    out.push(part);
  }
  return out;
}

/** The ids the paragraphs cite, in the order they first cite them: a source's number is its place here. */
const citesIn = (paragraphs: Run[][]) => [...new Set(paragraphs.flat().flatMap((r) => (typeof r !== "string" && "cite" in r ? [r.cite] : [])))];

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) =>
        typeof r === "string" ? r : "code" in r ? <code key={i}>{r.code}</code> : <Citation key={i} source={r.cite} />,
      )}
    </>
  );
}

/* ---- the story's words, logs, sources and files */

const ASK = "The Halo site build is failing on main. Can you find out why and fix it?";

const THOUGHT: Run[][] = [
  ["The screenshot shows the deploy failing on main, but the error is cut off. I need the build output to see what it could not find."],
  ["A missing font file is the likeliest cause. The studio dropped Inter for Geist, and a leftover import of the old package would break the build exactly this way."],
  ["I will read the layout, search the repo for any other fontsource imports, then run the build to confirm the error before I change anything."],
];

const PLAN = [
  "Read the layout and its imports",
  "Search for the old font package",
  "Run the build and read the error",
  "Fix the font and rebuild",
  "Publish the fix to halo.studio",
];

const SEARCH_MATCHES = `1 match in 1 file
src/app/layout.tsx:1  import "@fontsource/inter/400.css";`;

const BUILD_FAILED: LogLine[] = [
  { time: "0.0s", text: "> halo-site@1.4.0 build" },
  { time: "0.0s", text: "> next build" },
  { time: "0.4s", text: "▲ Next.js 15.1.0" },
  { time: "0.6s", text: "Creating an optimized production build ..." },
  { time: "6.1s", level: "error", text: "Failed to compile." },
  { time: "6.1s", text: "./src/app/layout.tsx" },
  { time: "6.1s", level: "error", text: "Module not found: Can't resolve '@fontsource/inter/400.css'" },
  { time: "6.4s", level: "error", text: "> Build failed because of webpack errors" },
];

const INSTALLED: LogLine[] = [
  { time: "2.9s", text: "added 1 package, and audited 318 packages in 3s" },
  { time: "3.1s", level: "success", text: "found 0 vulnerabilities" },
];

const BUILD_PASSED: LogLine[] = [
  { time: "0.0s", text: "> halo-site@1.4.0 build" },
  { time: "0.0s", text: "> next build" },
  { time: "0.4s", text: "▲ Next.js 15.1.0" },
  { time: "0.6s", text: "Creating an optimized production build ..." },
  { time: "27.9s", level: "success", text: "✓ Compiled successfully" },
  { time: "33.6s", level: "success", text: "✓ Linting and checking validity of types" },
  { time: "35.1s", level: "success", text: "✓ Collecting page data" },
  { time: "39.8s", level: "success", text: "✓ Generating static pages (14/14)" },
  { time: "41.0s", level: "success", text: "✓ Finalizing page optimization" },
];

/** What the web search found. The answer cites the first two; the list in the search call says the others are not cited. */
const FOUND: Source[] = [
  {
    id: "next-font",
    title: "Optimizing: Fonts",
    url: "https://nextjs.org/docs/app/building-your-application/optimizing/fonts",
    passage: "next/font will automatically optimize your fonts (including custom fonts) and remove external network requests for improved privacy and performance.",
    readAt: "just now",
  },
  {
    id: "geist",
    title: "geist",
    url: "https://www.npmjs.com/package/geist",
    passage: "Import GeistSans from geist/font/sans and add its className to the html element of your root layout.",
    readAt: "just now",
  },
  {
    id: "vercel-font",
    title: "Geist font",
    url: "https://vercel.com/font",
    passage: "Geist is a typeface made for developers and designers, embodying Vercel's design principles of simplicity, minimalism, and speed.",
    readAt: "just now",
  },
  {
    id: "fontsource",
    title: "Geist Sans",
    url: "https://fontsource.org/fonts/geist-sans",
    passage: "Self-host the Geist Sans font in a neatly bundled npm package.",
    readAt: "just now",
  },
];

const LAYOUT_DIFF = `@@ -1,9 +1,9 @@
-import "@fontsource/inter/400.css";
+import { GeistSans } from "geist/font/sans";
 import "./globals.css";

 export default function RootLayout({ children }: { children: React.ReactNode }) {
   return (
-    <html lang="en" className="font-inter">
+    <html lang="en" className={GeistSans.className}>
       <body>{children}</body>
     </html>
   );`;

const PACKAGE_DIFF = `@@ -11,6 +11,7 @@
   "dependencies": {
+    "geist": "^1.3.1",
     "next": "15.1.0",
     "react": "19.0.0",
     "react-dom": "19.0.0"
   },`;

const LAYOUT = "src/app/layout.tsx";

/** What Litt changed, in the order to review it. The lockfile's diff is long, so it comes as counts only. */
const CHANGES: FileChange[] = [
  { id: LAYOUT, path: LAYOUT, kind: "modified", diff: LAYOUT_DIFF },
  { id: "package.json", path: "package.json", kind: "modified", diff: PACKAGE_DIFF },
  { id: "package-lock.json", path: "package-lock.json", kind: "modified", added: 11, removed: 0 },
];

/** What opens under a call's row: text in the Output well, or a part with its own surface. */
type Shows =
  | { kind: "output"; text: string }
  | { kind: "log"; lines: LogLine[] }
  | { kind: "sources"; sources: Source[] }
  | { kind: "edit"; file: string };

type CallSpec = {
  action: string;
  doing: string;
  target: string;
  /** What the row reads when it is done. The demo compresses it: a call shows as running for `runs` ms. */
  seconds: number;
  runs: number;
  /** The plan step the call belongs to. */
  step: number;
  fail?: boolean;
  /** A few words on what it found or changed, once it has ended. */
  result?: string;
  shows?: Shows;
};

const CALLS: CallSpec[] = [
  { action: "Read", doing: "Reading", target: LAYOUT, seconds: 0.1, runs: 900, step: 0 },
  { action: "Searched", doing: "Searching", target: '"fontsource"', seconds: 0.4, runs: 1000, step: 1, result: "1 match", shows: { kind: "output", text: SEARCH_MATCHES } },
  { action: "Ran", doing: "Running", target: "npm run build", seconds: 6.4, runs: 1600, step: 2, fail: true, result: "Exit 1", shows: { kind: "log", lines: BUILD_FAILED } },
  {
    action: "Searched the web",
    doing: "Searching the web",
    target: '"next.js geist font"',
    seconds: 1.2,
    runs: 1200,
    step: 3,
    result: `${FOUND.length} sources`,
    shows: { kind: "sources", sources: FOUND },
  },
  { action: "Edited", doing: "Editing", target: LAYOUT, seconds: 0.2, runs: 900, step: 3, result: "+2 −2", shows: { kind: "edit", file: LAYOUT } },
  { action: "Ran", doing: "Running", target: "npm install geist", seconds: 3.1, runs: 1000, step: 3, result: "Exit 0", shows: { kind: "log", lines: INSTALLED } },
  { action: "Ran", doing: "Running", target: "npm run build", seconds: 41, runs: 1800, step: 3, result: "Exit 0", shows: { kind: "log", lines: BUILD_PASSED } },
];

const RUN_SECONDS = Math.round(CALLS.reduce((sum, c) => sum + c.seconds, 0));

const COMMAND = "npm run deploy -- --prod";

const WHAT_BROKE: Run[][] = [
  [
    "The build failed because ",
    { code: LAYOUT },
    " still imported Inter from ",
    { code: "@fontsource/inter" },
    ", a package the studio removed when it moved to Geist. Next.js loads a font through ",
    { code: "next/font" },
    ", which serves it from the site itself",
    { cite: "next-font" },
    ", and the ",
    { code: "geist" },
    " package ships Geist for it as ",
    { code: "GeistSans" },
    { cite: "geist" },
    ". I installed ",
    { code: "geist" },
    ", pointed the layout at it and ran the build again.",
  ],
];
const LIVE: Run[][] = [["The build passes and Halo is live again."]];
const LEFT: Run[][] = [["The build passes. I left the deploy to you: run ", { code: COMMAND }, " when you are ready."]];

const REPLY = "Understood. I will keep watching the Halo build on main and say here if it fails again.";

/* ---- what the answer cites */

const SOURCE = new Map(FOUND.map((s) => [s.id, s]));
const CITED = citesIn([...WHAT_BROKE, ...LIVE, ...LEFT]).map((id) => SOURCE.get(id)!);
/** The turn's sources once k of them are cited, one array per k, so the numbering never changes under a reader. */
const CITED_SO_FAR = CITED.map((_, k) => CITED.slice(0, k)).concat([CITED]);

/** The answer as markdown, the way a model writes it: a citation is a "#cite-" link. */
const markdown = (runs: Run[]) =>
  runs.map((r) => (typeof r === "string" ? r : "code" in r ? "`" + r.code + "`" : `[${CITED.findIndex((s) => s.id === r.cite) + 1}](#cite-${r.cite})`)).join("");

/** What Copy puts on the clipboard: the answer with its "#cite-" links undone, and the sources as reference links, so a "[1]" pasted into markdown still leads somewhere. */
const copyText = (closing: Run[][]) =>
  unlinkCitations([...WHAT_BROKE, ...closing].map(markdown).join("\n\n")) + "\n\n" + CITED.map((s, i) => `[${i + 1}]: ${s.url} "${s.title}"`).join("\n");
const COPY_LIVE = copyText(LIVE);
const COPY_LEFT = copyText(LEFT);

/* ---- the beats */

const WORD_MS = 55;
const THOUGHT_MS = 62;

const INITIAL: View = {
  thought: 0,
  thinking: true,
  plan: false,
  steps: PLAN.map(() => "pending"),
  calls: [],
  lines: 0,
  approval: "none",
  deploy: "none",
  words1: 0,
  review: false,
  words2: 0,
  done: false,
};

type Counter = "thought" | "lines" | "words1" | "words2";
const bump = (key: Counter) => (view: View): View => ({ ...view, [key]: view[key] + 1 });
const stream = (count: number, key: Counter, ms: number): Beat[] => Array.from({ length: count }, () => ({ ms, to: bump(key) }));
const mark = (steps: StepStatus[], at: number, status: StepStatus) => steps.map((s, i) => (i === at ? status : s));
const lastOfStep = (i: number) => !CALLS.slice(i + 1).some((c) => c.step === CALLS[i]!.step);
const logOf = (call: CallSpec) => (call.shows?.kind === "log" ? call.shows.lines : []);

/** Call `i` ends and the next one starts in the same beat, so a group is never open with nothing running in it. */
const advance = (i: number) => (view: View): View => {
  let { calls, steps } = view;
  if (i >= 0) {
    const spec = CALLS[i]!;
    calls = calls.map((c, j) => (j === i ? (spec.fail ? "failed" : "done") : c));
    if (lastOfStep(i)) steps = mark(steps, spec.step, "done");
  }
  const next = CALLS[i + 1];
  if (next) {
    calls = [...calls, "running"];
    steps = mark(steps, next.step, "running");
  }
  return { ...view, calls, steps, lines: 0 };
};

/** One call's beats: its log's lines arrive across its run, then it ends and the next one starts. */
const callBeats = (call: CallSpec, i: number): Beat[] => {
  const gap = Math.round(call.runs / (logOf(call).length + 1));
  return [...stream(logOf(call).length, "lines", gap), { ms: gap, to: advance(i) }];
};

/** The answer: the first paragraph word by word, the review, then the last paragraph word by word, then the end. */
const answer = (words2: number): Beat[] => [
  { ms: 600, to: bump("words1") },
  ...stream(total(WHAT_BROKE) - 1, "words1", WORD_MS),
  { ms: 350, to: (view) => ({ ...view, review: true }) },
  { ms: 600, to: bump("words2") },
  ...stream(words2 - 1, "words2", WORD_MS),
  { ms: 400, to: (view) => ({ ...view, done: true }) },
];

const RUN: Beat[] = [
  ...stream(total(THOUGHT), "thought", THOUGHT_MS),
  { ms: 300, to: (view) => ({ ...view, thinking: false }) },
  { ms: 500, to: (view) => ({ ...view, plan: true }) },
  { ms: 500, to: advance(-1) },
  ...CALLS.flatMap(callBeats),
  { ms: 800, to: (view) => ({ ...view, approval: "pending", steps: mark(view.steps, 4, "running") }) },
];

const ALLOW: Beat[] = [
  { ms: 700, to: (view) => ({ ...view, deploy: "running" }) },
  { ms: 1800, to: (view) => ({ ...view, deploy: "done", steps: mark(view.steps, 4, "done") }) },
  ...answer(total(LIVE)),
];

const DENY: Beat[] = [{ ms: 600, to: (view) => ({ ...view, steps: mark(view.steps, 4, "skipped") }) }, ...answer(total(LEFT))];

const fold = (start: View, beats: Beat[]): View[] => {
  const views = [start];
  for (const beat of beats) views.push(beat.to(views[views.length - 1]!));
  return views;
};

type Track = "run" | "allow" | "deny";

const RUN_VIEWS = fold(INITIAL, RUN);
const WAITING = RUN_VIEWS[RUN_VIEWS.length - 1]!;
const TRACKS: Record<Track, { beats: Beat[]; views: View[] }> = {
  run: { beats: RUN, views: RUN_VIEWS },
  allow: { beats: ALLOW, views: fold({ ...WAITING, approval: "allowed" }, ALLOW) },
  deny: { beats: DENY, views: fold({ ...WAITING, approval: "denied" }, DENY) },
};
const FINISHED = TRACKS.allow.views[TRACKS.allow.views.length - 1]!;

/** Whole seconds the reasoning takes to stream, which is what its clock reads when it ends. */
const THOUGHT_SECONDS = Math.floor((total(THOUGHT) * THOUGHT_MS + 300) / 1000);

/** What Stop leaves behind: the work in flight is marked as stopped, and nothing runs on. */
const halt = (view: View): View => ({
  ...view,
  thinking: false,
  calls: view.calls.map((c) => (c === "running" ? "stopped" : c)),
  steps: view.steps.map((s) => (s === "running" ? "skipped" : s)),
  deploy: view.deploy === "running" ? "stopped" : view.deploy,
});

/* ---- the state machine: a track, a cursor into its beats, and whether the person pressed Stop */

type State = { track: Track; cursor: number; stopped: boolean };
type Action = { type: "next" } | { type: "decide"; track: "allow" | "deny" } | { type: "stop" };

const atEnd = (s: State) => s.cursor >= TRACKS[s.track].beats.length;

function reduce(s: State, action: Action): State {
  if (s.stopped) return s;
  switch (action.type) {
    case "next":
      return atEnd(s) ? s : { ...s, cursor: s.cursor + 1 };
    case "decide":
      return s.track === "run" && atEnd(s) ? { track: action.track, cursor: 0, stopped: false } : s;
    case "stop":
      return atEnd(s) ? s : { ...s, stopped: true };
  }
}

/** Plays the script. Each beat is one timer, and the cleanup clears it, so a replay or an unmount leaves nothing running. */
function useRun() {
  const [state, dispatch] = useReducer(reduce, { track: "run", cursor: 0, stopped: false });
  useEffect(() => {
    const beat = TRACKS[state.track].beats[state.cursor];
    if (!beat || state.stopped) return;
    const timer = window.setTimeout(() => dispatch({ type: "next" }), beat.ms);
    return () => window.clearTimeout(timer);
  }, [state.track, state.cursor, state.stopped]);

  const view = TRACKS[state.track].views[state.cursor]!;
  return {
    view: state.stopped ? halt(view) : view,
    stopped: state.stopped,
    allow: () => dispatch({ type: "decide", track: "allow" }),
    deny: () => dispatch({ type: "decide", track: "deny" }),
    stop: () => dispatch({ type: "stop" }),
  };
}

/* ---------------------------------------------------------------- the person's review

   Keep and Undo are the person's, never the script's: one decision per file, beside the script. The edit call's row
   and the review at the end read the same decisions, so keeping the layout in one shows it kept in the other. */

type Review = { changes: FileChange[]; decide?: (ids: string[], decision: FileDecision) => void };

/** A finished chat's review: every file kept, and nothing left to press. */
const KEPT: Review = { changes: CHANGES.map((c): FileChange => ({ ...c, state: "kept" })) };

function useReview(): Review {
  const [decided, setDecided] = useState<Record<string, FileDecision>>({});
  const changes = useMemo(() => CHANGES.map((c): FileChange => ({ ...c, state: decided[c.id] ?? "pending" })), [decided]);
  const decide = (ids: string[], decision: FileDecision) =>
    setDecided((all) => ({ ...all, ...Object.fromEntries(ids.map((id) => [id, decision])) }));
  return { changes, decide };
}

/* ---------------------------------------------------------------- the studio's runs */

/** The studio's other runs, newest change first. The Halo run joins them from the chat. */
const STUDIO: AgentRun[] = [
  { id: "case", title: "Write the Halo case study", status: "needs-you", detail: "Pick one of three intros", updated: "9m ago" },
  { id: "framer", title: "Compress the Framer site images", status: "running", detail: "Step 3 of 5", progress: 0.62, updated: "4m ago" },
  { id: "northwind", title: "Move the Northwind site", status: "failed", detail: "Step 4: font file missing", updated: "12m ago" },
  { id: "cosmos", title: "Import the Cosmos catalog", status: "done", detail: "1,240 products", updated: "1h ago" },
  { id: "atelier", title: "Rename the Atelier Nord pages", status: "stopped", detail: "At step 2 of 4", updated: "Yesterday" },
];

/** The Halo run as a Run list row, read from the moment the chat shows: no state of its own, so the two never disagree. */
function haloRun(view: View, stopped: boolean): AgentRun {
  const row = { id: "halo", title: "Fix the Halo build", updated: "now" };
  if (stopped) return { ...row, status: "stopped" };
  if (view.done) return { ...row, status: "done", detail: view.approval === "denied" ? "Deploy left to you" : "Live on halo.studio" };
  if (view.approval === "pending") return { ...row, status: "needs-you", detail: "Approve npm run deploy" };
  if (!view.plan) return { ...row, status: "running", detail: "Thinking" };
  const at = view.steps.findIndex((s) => s === "running" || s === "pending");
  const settled = view.steps.filter((s) => s === "done" || s === "skipped").length;
  return { ...row, status: "running", detail: at < 0 ? "Writing the answer" : `Step ${at + 1} of ${PLAN.length}`, progress: settled / PLAN.length };
}

/** The runs, with the Halo row the open one until the person opens another. */
function Rail({ halo }: { halo: AgentRun }) {
  const [open, setOpen] = useState(halo.id);
  return <RunList runs={[halo, ...STUDIO]} selectedId={open} onSelect={(run) => setOpen(run.id)} />;
}

/**
 * The screen: the runs in a rail and the chat beside it. The rail shows only on a frame wide enough for both, read from
 * the frame (a container query) and never from the window alone, and never on a phone, whose frame can sit inside a
 * desktop page. It is 20rem, so the Halo row says "Needs you · Approve npm run deploy" without a cut.
 */
function Studio({ halo, children }: { halo: AgentRun; children: ReactNode }) {
  const { compact } = useDevice();
  return (
    <div className="@container h-full min-h-0 w-full min-w-0">
      <div className="flex h-full min-h-0 w-full min-w-0">
        {!compact && (
          <div className="hidden w-80 shrink-0 overflow-y-auto border-r border-line bg-surface-1 p-2 @3xl:block">
            <Rail halo={halo} />
          </div>
        )}
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the chat */

const MODELS = [
  { value: "fast", label: "Litt Fast" },
  { value: "litt", label: "Litt" },
  { value: "deep", label: "Litt Deep" },
];

/** The model picker in the composer's toolbar. A finger gets a 44px trigger. */
function ModelSelect() {
  const { coarse } = useDevice();
  return (
    <div className="w-36">
      <Select aria-label="Model" size={coarse ? "md" : "sm"} options={MODELS} defaultValue="litt" />
    </div>
  );
}

const CALL_STATUS = { running: "running", done: "done", failed: "failed", stopped: "denied" } as const;

/**
 * What opens under a call's row. `written` is how many lines a call that has not ended (running, or stopped) has
 * written, and null once it ends: a log streams while the call runs, and everything else arrives when it ends.
 */
function found(call: CallSpec, written: number | null, review: Review): Pick<ToolCallProps, "output" | "details"> {
  const shows = call.shows;
  const ended = written === null;
  if (!shows) return {};
  switch (shows.kind) {
    case "log":
      return { details: <LogView label={call.target} lines={ended ? shows.lines : shows.lines.slice(0, written)} height="12rem" /> };
    case "output":
      return ended ? { output: shows.text } : {};
    case "sources":
      return ended ? { details: <SourceList sources={shows.sources} label="Search results" hideLabel /> } : {};
    case "edit":
      return ended ? { details: <FileChanges changes={review.changes.filter((c) => c.id === shows.file)} onDecide={review.decide} summary={false} /> } : {};
  }
}

/** What Litt did in this turn, from the plan to the answer. `frozen` is a chat that is already over. */
function LittTurn({
  view,
  stopped,
  frozen,
  later,
  review,
  onAllow,
  onDeny,
  onRetry,
}: {
  view: View;
  stopped: boolean;
  frozen: boolean;
  later: boolean;
  review: Review;
  onAllow?: () => void;
  onDeny?: () => void;
  onRetry?: () => void;
}) {
  const busy = !view.done && !stopped;
  const running = view.calls.includes("running");
  const closing = view.approval === "denied" ? LEFT : LIVE;
  const [p1] = reveal(WHAT_BROKE, view.words1);
  const [p2] = reveal(closing, view.words2);
  const cited = CITED_SO_FAR[citesIn([p1 ?? [], p2 ?? []]).length]!;
  /* The reader's own open or close of a call, once they make one. Until then a log is open while it streams, and a
     failed call stays open so its error can be read. */
  const [chosen, setChosen] = useState<Record<number, boolean>>({});

  return (
    <Message
      streaming={busy}
      latest={!later}
      error={stopped ? "You stopped Litt before it finished." : undefined}
      onRetry={onRetry}
      actions={<MessageActions copyText={view.approval === "denied" ? COPY_LEFT : COPY_LIVE} onRetry={onRetry} />}
    >
      {/* The sources the answer has cited so far, numbered in the order it cites them, for the marks, the search's results and the list. */}
      <Sources sources={cited}>
        {/* One measure for every part, the prose's, so the rows end where the words do. */}
        <div className="grid min-w-0 max-w-[68ch] gap-3">
          <Thinking active={view.thinking} duration={frozen ? THOUGHT_SECONDS : undefined}>
            {reveal(THOUGHT, view.thought).map((runs, i) => (
              <p key={i}>
                <Runs runs={runs} />
              </p>
            ))}
          </Thinking>

          {view.plan && (
            <Plan
              label="Fix the Halo build"
              steps={PLAN.map((label, i) => ({
                id: String(i),
                label,
                status: view.steps[i]!,
                detail: i === 4 && view.steps[i] === "skipped" && !stopped ? "Left for you to run." : undefined,
              }))}
            />
          )}

          {view.calls.length > 0 && (
            <ToolCallGroup
              running={running}
              summary={running ? "Working on the build" : "Looked up Geist, fixed the layout and ran the build twice"}
              duration={running ? undefined : RUN_SECONDS}
            >
              {view.calls.map((state, i) => {
                const call = CALLS[i]!;
                const live = state === "running";
                return (
                  <ToolCall
                    key={i}
                    status={CALL_STATUS[state]}
                    statusLabel={state === "stopped" ? "Stopped" : undefined}
                    action={live ? call.doing : call.action}
                    target={call.target}
                    result={live ? undefined : call.result}
                    duration={live ? undefined : call.seconds}
                    {...found(call, live || state === "stopped" ? view.lines : null, review)}
                    open={chosen[i] ?? (!frozen && ((live && call.shows?.kind === "log") || state === "failed"))}
                    onOpenChange={(open) => setChosen((all) => ({ ...all, [i]: open }))}
                  />
                );
              })}
            </ToolCallGroup>
          )}

          {view.approval !== "none" && (
            <div className="grid">
              <ToolApproval
                command={COMMAND}
                description="Publishes the Halo site to halo.studio."
                decision={view.approval}
                onAllow={onAllow}
                onDeny={onDeny}
              />
              {view.deploy !== "none" && (
                <ToolCall
                  status={view.deploy === "running" ? "running" : view.deploy === "stopped" ? "denied" : "done"}
                  statusLabel={view.deploy === "stopped" ? "Stopped" : undefined}
                  action={view.deploy === "done" ? "Published" : "Publishing"}
                  target="halo.studio"
                  duration={view.deploy === "done" ? 12 : undefined}
                />
              )}
            </div>
          )}

          {p1 && (
            <MessageText>
              <p>
                <Runs runs={p1} />
              </p>
            </MessageText>
          )}
          {view.review && <FileChanges changes={review.changes} onDecide={review.decide} />}
          {p2 && (
            <MessageText>
              <p>
                <Runs runs={p2} />
              </p>
            </MessageText>
          )}
          {view.done && <SourceList />}
        </div>
      </Sources>
    </Message>
  );
}

/** The composer at the foot, in the same centered column as the turns above it. */
function Foot({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pb-4">
      <div className="mx-auto w-full max-w-[48rem]">{children}</div>
    </div>
  );
}

export type AgentChatProps = {
  /** Show the chat already over, at the end of the run with Allow pressed and every file kept, with Send off. Nothing plays and nothing is left to decide. */
  finished?: boolean;
  /** Names the conversation's landmark. Change it when two chats share a page. */
  label?: string;
  /** Called by Retry on the answer. Remount the chat (a new key) to play the run again. */
  onRestart?: () => void;
};

/**
 * The whole screen: on a wide frame the studio's runs in a rail, then the chat, the turns in a centered column and the
 * composer at the foot. It fills its box, so give that box a height (a full-height app pane, or a fixed-height frame);
 * the conversation scrolls inside it.
 */
export function AgentChat({ finished = false, label = "Conversation with Litt", onRestart }: AgentChatProps) {
  return finished ? <FinishedChat label={label} /> : <LiveChat label={label} onRestart={onRestart} />;
}

/** Touch screens hide the conversation's scrollbar; a pointer keeps a stable gutter on both edges, so the column stays centered. */
const scrollbar = (coarse: boolean) => (coarse ? "[&>[role=region]]:[scrollbar-width:none]" : "[&>[role=region]]:[scrollbar-gutter:stable_both-edges]");

function LiveChat({ label, onRestart }: { label: string; onRestart?: () => void }) {
  const { view, stopped, allow, deny, stop } = useRun();
  const review = useReview();
  const { coarse } = useDevice();
  const [asked, setAsked] = useState<string[]>([]);
  const busy = !view.done && !stopped;
  const waiting = view.approval === "pending";

  return (
    <Studio halo={haloRun(view, stopped)}>
      <Conversation label={label} agentName="Litt" busy={busy} className={"flex-1 " + scrollbar(coarse)}>
        <Message from="user" attachments={<FileChip name="halo-deploy-error.png" size={217088} />}>
          {ASK}
        </Message>
        <LittTurn
          view={view}
          stopped={stopped}
          frozen={false}
          later={asked.length > 0}
          review={review}
          onAllow={allow}
          onDeny={deny}
          onRetry={onRestart}
        />
        {asked.map((text, i) => (
          <Fragment key={i}>
            <Message from="user">{text}</Message>
            <Message latest={i === asked.length - 1} actions={<MessageActions copyText={REPLY} />}>
              <MessageText>{REPLY}</MessageText>
            </Message>
          </Fragment>
        ))}
      </Conversation>
      <Foot>
        <Composer
          label="Message Litt"
          placeholder="Message Litt"
          hint={waiting ? "Send is off while Litt waits for your answer." : "Litt can be wrong. Check what matters."}
          streaming={busy && !waiting}
          sendDisabled={waiting}
          onStop={stop}
          onSend={(text) => setAsked((all) => [...all, text])}
          tools={<ModelSelect />}
        />
      </Foot>
    </Studio>
  );
}

function FinishedChat({ label }: { label: string }) {
  const { coarse } = useDevice();
  return (
    <Studio halo={haloRun(FINISHED, false)}>
      <Conversation label={label} agentName="Litt" className={"flex-1 " + scrollbar(coarse)}>
        <Message from="user" attachments={<FileChip name="halo-deploy-error.png" size={217088} />}>
          {ASK}
        </Message>
        <LittTurn view={FINISHED} stopped={false} frozen later={false} review={KEPT} />
      </Conversation>
      <Foot>
        <Composer label="Message Litt" placeholder="Message Litt" hint="A finished chat. Send is off in this picture." sendDisabled tools={<ModelSelect />} />
      </Foot>
    </Studio>
  );
}
