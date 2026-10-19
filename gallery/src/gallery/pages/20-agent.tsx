import { Fragment, useEffect, useReducer, useState, type ReactNode } from "react";
import { CodeBlock } from "@/components/code-block";
import { Composer, FileChip } from "@/components/composer";
import type { StepStatus } from "@/components/icons";
import { Conversation, Message, MessageActions, MessageText } from "@/components/message";
import { Plan } from "@/components/plan";
import { Select } from "@/components/select";
import { Thinking } from "@/components/thinking";
import { ToolApproval, ToolCall, ToolCallGroup, type ToolApprovalDecision } from "@/components/tool-call";
import { DeviceProvider, useDevice } from "@/motion";
import { Page, Stage, useReplay, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "agent",
  title: "Agent",
  order: 18.99,
  group: "Agents",
  summary: "Every agent part in one chat, where Litt fixes the failing Halo build. The run waits for you at the deploy.",
  tiers: ["instant", "responsive"],
};

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
  approval: "none" | ToolApprovalDecision;
  deploy: "none" | "running" | "done" | "stopped";
  /** Words of the answer's two paragraphs, and whether the diff is in. */
  words1: number;
  code: boolean;
  words2: number;
  done: boolean;
};

type Beat = { ms: number; to: (view: View) => View };

/* ---- words */

type Run = string | { code: string };

/** One token per word, and one per code span. A word keeps the space after it, so a join reads as the sentence. */
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

const plain = (runs: Run[]) => runs.map((r) => (typeof r === "string" ? r : "`" + r.code + "`")).join("");

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) =>
        typeof r === "string" ? (
          r
        ) : (
          <code key={i}>{r.code}</code>
        ),
      )}
    </>
  );
}

/* ---- the story's words and files */

const ASK = "The Halo site build is failing on main. Can you find out why and fix it?";

const THOUGHT: Run[][] = [
  ["The screenshot shows the deploy failing on main, but the error is cut off. I need the build output to see what it could not find."],
  ["A missing font file is the likeliest cause. The studio dropped Inter for Hanken Grotesk, and a leftover import of the old package would break the build exactly this way."],
  ["I will read the layout, search the repo for any other fontsource imports, then run the build to confirm the error before I change anything."],
];

const PLAN = [
  "Read the layout and its imports",
  "Search for the old font package",
  "Run the build and read the error",
  "Fix the import and rebuild",
  "Publish the fix to halo.studio",
];

const BUILD_FAILED = `> halo-site@1.4.0 build
> next build

Failed to compile.

./src/app/layout.tsx
Module not found: Can't resolve '@fontsource/inter/400.css'`;

const BUILD_PASSED = `> halo-site@1.4.0 build
> next build

✓ Compiled successfully
✓ Generating static pages (14/14)`;

const SEARCH_MATCHES = `1 match in 1 file
src/app/layout.tsx:1  import "@fontsource/inter/400.css";`;

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
  output?: string;
};

const CALLS: CallSpec[] = [
  { action: "Read", doing: "Reading", target: "src/app/layout.tsx", seconds: 0.1, runs: 900, step: 0 },
  { action: "Searched", doing: "Searching", target: '"fontsource"', seconds: 0.4, runs: 1000, step: 1, output: SEARCH_MATCHES },
  { action: "Ran", doing: "Running", target: "npm run build", seconds: 6.4, runs: 1500, step: 2, fail: true, output: BUILD_FAILED },
  { action: "Edited", doing: "Editing", target: "src/app/layout.tsx", seconds: 0.2, runs: 900, step: 3 },
  { action: "Ran", doing: "Running", target: "npm run build", seconds: 41, runs: 1800, step: 3, output: BUILD_PASSED },
];

const RUN_SECONDS = Math.round(CALLS.reduce((sum, c) => sum + c.seconds, 0));

const COMMAND = "npm run deploy -- --prod";

const DIFF = `@@ -1,7 +1,7 @@
-import "@fontsource/inter/400.css";
+import "@fontsource/hanken-grotesk/400.css";
 import "./globals.css";

 export default function RootLayout({ children }: { children: React.ReactNode }) {
   return (
-    <html lang="en" className="font-inter">
+    <html lang="en" className="font-hanken">
       <body>{children}</body>`;

const WHAT_BROKE: Run[][] = [
  [
    "The build failed because ",
    { code: "src/app/layout.tsx" },
    " still imported Inter from ",
    { code: "@fontsource/inter" },
    ". The studio dropped Inter for Hanken Grotesk, so the package is gone from the project and the build cannot find its CSS. Here is the change:",
  ],
];
const LIVE: Run[][] = [["The build passes and Halo is live again."]];
const LEFT: Run[][] = [["The build passes. I left the deploy to you: run ", { code: COMMAND }, " when you are ready."]];

const REPLY = "Understood. I will keep watching the Halo build on main and say here if it fails again.";

/* ---- the beats */

const WORD_MS = 55;
const THOUGHT_MS = 62;

const INITIAL: View = {
  thought: 0,
  thinking: true,
  plan: false,
  steps: PLAN.map(() => "pending"),
  calls: [],
  approval: "none",
  deploy: "none",
  words1: 0,
  code: false,
  words2: 0,
  done: false,
};

const bump = (key: "thought" | "words1" | "words2") => (view: View): View => ({ ...view, [key]: view[key] + 1 }) as View;
const stream = (count: number, key: "thought" | "words1" | "words2", ms: number): Beat[] =>
  Array.from({ length: count }, () => ({ ms, to: bump(key) }));
const mark = (steps: StepStatus[], at: number, status: StepStatus) => steps.map((s, i) => (i === at ? status : s));
const lastOfStep = (i: number) => !CALLS.slice(i + 1).some((c) => c.step === CALLS[i]!.step);

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
  return { ...view, calls, steps };
};

/** The answer: the first paragraph word by word, the diff, then the last paragraph word by word, then the end. */
const answer = (words2: number): Beat[] => [
  { ms: 600, to: bump("words1") },
  ...stream(total(WHAT_BROKE) - 1, "words1", WORD_MS),
  { ms: 350, to: (view) => ({ ...view, code: true }) },
  { ms: 600, to: bump("words2") },
  ...stream(words2 - 1, "words2", WORD_MS),
  { ms: 400, to: (view) => ({ ...view, done: true }) },
];

const RUN: Beat[] = [
  ...stream(total(THOUGHT), "thought", THOUGHT_MS),
  { ms: 300, to: (view) => ({ ...view, thinking: false }) },
  { ms: 500, to: (view) => ({ ...view, plan: true }) },
  { ms: 500, to: advance(-1) },
  ...CALLS.map((c, i): Beat => ({ ms: c.runs, to: advance(i) })),
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

/** What Litt did in this turn, from the plan to the answer. `frozen` is a chat that is already over. */
function LittTurn({
  view,
  stopped,
  frozen,
  later,
  onAllow,
  onDeny,
  onRetry,
}: {
  view: View;
  stopped: boolean;
  frozen: boolean;
  later: boolean;
  onAllow?: () => void;
  onDeny?: () => void;
  onRetry?: () => void;
}) {
  const busy = !view.done && !stopped;
  const running = view.calls.includes("running");
  const [p1] = reveal(WHAT_BROKE, view.words1);
  const closing = view.approval === "denied" ? LEFT : LIVE;
  const [p2] = reveal(closing, view.words2);
  const answerText = [plain(WHAT_BROKE[0]!), "```diff\n" + DIFF + "\n```", plain(closing[0]!)].join("\n\n");

  return (
    <Message
      streaming={busy}
      latest={!later}
      error={stopped ? "You stopped Litt before it finished." : undefined}
      onRetry={onRetry}
      actions={<MessageActions copyText={answerText} onRetry={onRetry} />}
    >
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
            summary={running ? "Working on the build" : "Fixed the layout and ran the build twice"}
            duration={running ? undefined : RUN_SECONDS}
          >
            {view.calls.map((state, i) => {
              const call = CALLS[i]!;
              const live = state === "running";
              return (
                /* A failed call remounts, so its output opens as the call fails. */
                <ToolCall
                  key={`${i}-${state}`}
                  status={CALL_STATUS[state]}
                  statusLabel={state === "stopped" ? "Stopped" : undefined}
                  action={live ? call.doing : call.action}
                  target={call.target}
                  duration={live ? undefined : call.seconds}
                  output={live ? undefined : call.output}
                  defaultOpen={state === "failed" && !frozen}
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
        {view.code && (
          <div className="min-w-0">
            <CodeBlock lang="diff" filename="src/app/layout.tsx" code={DIFF} />
          </div>
        )}
        {p2 && (
          <MessageText>
            <p>
              <Runs runs={p2} />
            </p>
          </MessageText>
        )}
      </div>
    </Message>
  );
}

/** A window onto the app: the page's own canvas with a hairline, so the person's bubble reads as it does in an app. */
function Frame({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={"flex w-full min-w-0 flex-col overflow-hidden rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line " + className}
    >
      {children}
    </div>
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

function DesktopDemo({ onRestart }: { onRestart: () => void }) {
  const { view, stopped, allow, deny, stop } = useRun();
  const [asked, setAsked] = useState<string[]>([]);
  const busy = !view.done && !stopped;
  const waiting = view.approval === "pending";

  return (
    <Frame label="Halo build chat" className="h-180">
      <Conversation
        label="Conversation with Litt"
        agentName="Litt"
        busy={busy}
        className="flex-1 [&>[role=region]]:[scrollbar-gutter:stable_both-edges]"
      >
        <Message from="user" attachments={<FileChip name="halo-deploy-error.png" size={217088} />}>
          {ASK}
        </Message>
        <LittTurn view={view} stopped={stopped} frozen={false} later={asked.length > 0} onAllow={allow} onDeny={deny} onRetry={onRestart} />
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
    </Frame>
  );
}

function PhoneDemo() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[24.375rem]">
      <DeviceProvider mode="phone">
        <Frame label="Halo build chat on a phone" className="h-176">
          <Conversation label="Conversation with Litt on a phone" agentName="Litt" className="flex-1 [&>[role=region]]:[scrollbar-width:none]">
            <Message from="user" attachments={<FileChip name="halo-deploy-error.png" size={217088} />}>
              {ASK}
            </Message>
            <LittTurn view={FINISHED} stopped={false} frozen later={false} />
          </Conversation>
          <Foot>
            <Composer
              label="Message Litt"
              placeholder="Message Litt"
              hint="A finished chat. Send is off in this picture."
              sendDisabled
              tools={<ModelSelect />}
            />
          </Foot>
        </Frame>
      </DeviceProvider>
    </div>
  );
}

export default function AgentPage() {
  const [run, replayRun] = useReplay();
  return (
    <Page meta={meta}>
      <Stage
        title="The run, on a desktop"
        tier="responsive"
        size="lg"
        code="DesktopDemo"
        onReplay={replayRun}
        caption="Litt fixes the failing Halo build while you watch, and the run waits for you at the deploy. The chat opens with the first message sent and Litt thinking. While Litt works the composer shows Stop, and nothing in the view is accent filled. When the approval waits, Send is off and Allow is the one accent fill. Press Allow and the panel becomes a row while the deploy runs. Press Deny and Litt leaves the deploy to you. Send turns accent again only when you type a reply. The clock and the marks swap in place, and nothing shimmers or spins. The thinking and the group of calls fold themselves on the responsive tier, and Replay runs it again."
      >
        <div className="w-full min-w-0">
          <DesktopDemo key={run} onRestart={replayRun} />
        </div>
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        size="lg"
        code="PhoneDemo"
        caption="The same chat, finished, in a phone-wide frame. The column takes the whole width, the person's bubble takes 85% of it, and the code block scrolls sideways inside itself while the page stays still. The composer sits at the foot with Send off, so this view has no accent fill. Rows, buttons and the model picker grow to 44px for a finger, and the actions under the answer are always there."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
