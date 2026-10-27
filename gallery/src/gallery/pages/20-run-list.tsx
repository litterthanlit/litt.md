import { useEffect, useState } from "react";
import { RunList, type AgentRun, type RunFilter } from "@/components/run-list";
import { DeviceProvider } from "@/motion";
import { Page, Stage, TryIt, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "run-list",
  title: "Run list",
  lede: "An agent's runs, the ones that need you first.",
  order: 18.958,
  group: "Agents",
  verbs: ["press", "select", "watch"],
  summary:
    "An agent's runs for a sidebar or an inbox: each run's title, its status in words and a mark, where it has got and when it last changed. The runs that need you come first, a Select filters by status with counts, and Stop or Archive sits on the row. The open run is the raised block, which glides to the row you press, and a filter glides the rows to their new places. A run the agent changes moves at once.",
  fun: "Press another run: the block glides over on a springier spring. Replay the agent's runs and each one that finishes, fails or needs you pops its mark.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["run-list"],
  exports: ["RunList"],
  usage: `import { useState } from "react";
import { RunList, type AgentRun } from "@/components/run-list";

// Your runs, newest change first. updated is your words: the list reads no clock.
const [runs, setRuns] = useState<AgentRun[]>([
  { id: "halo", title: "Fix the Halo build", status: "needs-you", detail: "Approve npm run deploy", updated: "1m ago", href: "/runs/halo" },
  { id: "world", title: "Creating your world", status: "running", detail: "Step 2 of 3", progress: 0.45, updated: "Just now", href: "/runs/world" },
  { id: "cosmos", title: "Import the Cosmos catalog", status: "done", detail: "1,240 products", updated: "1h ago", href: "/runs/cosmos" },
]);
const [runId, setRunId] = useState("world");

<RunList
  runs={runs}
  selectedId={runId}
  onSelect={(run) => setRunId(run.id)}  // a row with an href is a link and calls this too
  onStop={(run) => agent.stop(run.id)}
  onArchive={(run) => setRuns((all) => all.filter((r) => r.id !== run.id))}
/>`,
  use: [
    "An app runs agents in the background and the person needs to see them all: in a sidebar beside the chat, or as an inbox of their own.",
    "Some runs wait on the person, for an approval or a question. The list lifts them above the rest under Needs you, in your order, and says so in words.",
    "One run is open beside the list. Pass its id as selectedId and its row is the raised block, which glides to the next row the person presses.",
    "Runs can be stopped or put away. Pass onStop and onArchive, and Stop shows on running rows and Archive on finished ones.",
  ],
  skip: [
    "You are showing one run and its steps. Use Run card, which a row here can open.",
    "The agent's steps for one task, ticked off as it works. Use Plan.",
    "The list is projects or pages, not runs. Use List.",
    "You want rows sorted by time or re-sorted live. The list keeps your order and moves a run only when its status lifts it or drops it, so sort the runs you pass.",
  ],
  keyboard: [
    [["Tab"], "Moves into the rows at the run you were last on, else the open run, else the first, then on past the list. The filter is its own stop before it."],
    [["ArrowDown", "ArrowUp"], "Moves to the next or the previous run."],
    [["Home", "End"], "Moves to the first or the last run."],
    [["ArrowRight", "ArrowLeft"], "Moves to the row's Stop or Archive, and back to the row."],
    [["Enter", "Space"], "Opens the run: calls onSelect, and follows its href when it has one."],
  ],
  a11y: [
    "The rows are a list named by the label (\"Runs 6\"), or two lists named by their headings, Needs you and Runs, when both have runs. Each row is a button, or a link with an href, named by its title, its status line and its updated words: \"Fix the Halo build, Needs you, Approve npm run deploy, 1m ago\".",
    "The open run's row has aria-current=\"true\". The raised block behind it is decorative.",
    "Every status is said in words at the start of the status line, never by the mark's shape or color alone. Only the failed mark takes a status color.",
    "The rows are one Tab stop with a roving focus, so a long list costs one press to cross. Stop and Archive are named with the run (\"Stop Creating your world\"), reached with the right arrow, and shown while their row has focus.",
    "One polite status says \"Fix the Halo build needs you\", \"Move the Northwind site failed\" or \"Import the Cosmos catalog is done\" when a run changes into one of those. It never speaks on the first render, so a list loaded from history is quiet, and never for a run that only appears.",
    "When Stop or Archive had focus and its row leaves, focus moves to the row that takes its place. The filter is a Select named \"Filter runs by status\", and a status with no runs is disabled.",
    "Text is the small and caption sizes in fg, fg-muted and fg-subtle, which pass 4.5:1 on the page and on the block in both themes. Rows are 56px, and Stop and Archive grow to 44px on a finger. Under reduced motion the block and the rows move at once.",
  ],
};

/* ---------------------------------------------------------------- data */

const STUDIO: AgentRun[] = [
  { id: "world", title: "Creating your world", status: "running", detail: "Step 2 of 3", progress: 0.45, updated: "Just now" },
  { id: "halo", title: "Fix the Halo build", status: "needs-you", detail: "Approve npm run deploy", updated: "1m ago" },
  { id: "framer", title: "Compress the Framer site images", status: "running", detail: "Step 3 of 5", progress: 0.62, updated: "4m ago" },
  { id: "northwind", title: "Move the Northwind site", status: "failed", detail: "Step 4: font file missing", updated: "12m ago" },
  { id: "cosmos", title: "Import the Cosmos catalog", status: "done", detail: "1,240 products", updated: "1h ago" },
  { id: "atelier", title: "Rename the Atelier Nord pages", status: "stopped", detail: "At step 2 of 4", updated: "Yesterday" },
];

/** Stop and Archive, as an app would answer them: a stopped run says where it stopped, an archived one leaves. */
function useStudio(start: AgentRun[]) {
  const [runs, setRuns] = useState(start);
  const stop = (run: AgentRun) =>
    setRuns((all) => all.map((r) => (r.id === run.id ? { ...r, status: "stopped", detail: r.detail && `At ${r.detail[0].toLowerCase()}${r.detail.slice(1)}`, progress: undefined } : r)));
  const archive = (run: AgentRun) => setRuns((all) => all.filter((r) => r.id !== run.id));
  return { runs, stop, archive };
}

/* What the agent does on its own, one frame at a time: the Halo build comes to need you, the Northwind move fails,
   the Cosmos import finishes, the world moves on a step, and the Halo deploy, once approved, runs. */
const LIVE: AgentRun[][] = [
  [
    { id: "world", title: "Creating your world", status: "running", detail: "Step 1 of 3", progress: 0.12, updated: "Just now" },
    { id: "framer", title: "Compress the Framer site images", status: "running", detail: "Step 3 of 5", progress: 0.62, updated: "1m ago" },
    { id: "halo", title: "Fix the Halo build", status: "running", detail: "Step 3 of 4", progress: 0.7, updated: "2m ago" },
    { id: "northwind", title: "Move the Northwind site", status: "running", detail: "Step 4 of 6", progress: 0.5, updated: "3m ago" },
    { id: "cosmos", title: "Import the Cosmos catalog", status: "running", detail: "Step 2 of 2", progress: 0.86, updated: "8m ago" },
  ],
];
const change = (frame: AgentRun[], id: string, next: Partial<AgentRun>) => frame.map((r) => (r.id === id ? { ...r, ...next } : r));
LIVE.push(change(LIVE[0], "halo", { status: "needs-you", detail: "Approve npm run deploy", progress: undefined, updated: "Just now" }));
LIVE.push(change(LIVE[1], "northwind", { status: "failed", detail: "Step 4: font file missing", progress: undefined, updated: "Just now" }));
LIVE.push(change(LIVE[2], "cosmos", { status: "done", detail: "1,240 products", progress: undefined, updated: "Just now" }));
LIVE.push(change(LIVE[3], "world", { detail: "Step 2 of 3", progress: 0.45 }));
LIVE.push(change(LIVE[4], "halo", { status: "running", detail: "Step 4 of 4", progress: 0.9, updated: "Just now" }));

/** The frame the agent is on: it moves on by itself every `ms` and holds the last. A Replay remounts it from the first. */
function useFrame(count: number, ms: number) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (frame >= count - 1) return;
    const timer = setTimeout(() => setFrame((f) => f + 1), ms);
    return () => clearTimeout(timer);
  }, [frame, count, ms]);
  return frame;
}

const INBOX: AgentRun[] = [
  { id: "case", title: "Write the Halo case study from the launch notes", status: "needs-you", detail: "Pick one of three intros", updated: "Just now" },
  { id: "framer", title: "Compress every image on the Framer portfolio site", status: "running", detail: "Step 3 of 5, the project pages", progress: 0.62, updated: "2m ago" },
  { id: "northwind", title: "Move the Northwind site to the new grid", status: "failed", detail: "Step 4: the build could not find Geist Mono", updated: "12m ago" },
  { id: "cosmos", title: "Import the Cosmos catalog into the shop", status: "done", detail: "1,240 products, 3 skipped", updated: "1h ago" },
  { id: "atelier", title: "Rename the Atelier Nord pages to the new names", status: "stopped", detail: "At step 2 of 4", updated: "Yesterday" },
];

/* ---------------------------------------------------------------- demos */

function SidebarDemo() {
  const { runs, stop, archive } = useStudio(STUDIO);
  const [runId, setRunId] = useState("world");
  const open = runs.find((r) => r.id === runId);
  return (
    <div className="grid w-full max-w-3xl items-start gap-8 md:grid-cols-[18rem_minmax(0,1fr)]">
      <RunList runs={runs} selectedId={runId} onSelect={(run) => setRunId(run.id)} onStop={stop} onArchive={archive} />
      <div className="grid min-h-64 content-start gap-1 rounded-surface p-6 shadow-[inset_0_0_0_1px_var(--line)] max-md:hidden">
        {open ? (
          <>
            <p className="text-body font-title text-fg">{open.title}</p>
            <p className="text-small text-fg-muted">{open.detail}</p>
          </>
        ) : (
          <p className="text-small text-fg-muted">Pick a run to open it here.</p>
        )}
      </div>
    </div>
  );
}

function LiveDemo() {
  const frame = useFrame(LIVE.length, 1400);
  return (
    <div className="w-full max-w-72">
      <RunList runs={LIVE[frame]} selectedId="halo" />
    </div>
  );
}

function InboxDemo() {
  const { runs, stop, archive } = useStudio(INBOX);
  const [runId, setRunId] = useState("case");
  return (
    <div className="w-full max-w-64">
      <RunList label="Inbox" runs={runs} selectedId={runId} onSelect={(run) => setRunId(run.id)} onStop={stop} onArchive={archive} />
    </div>
  );
}

function PhoneDemo() {
  const { runs, stop, archive } = useStudio(STUDIO);
  const [runId, setRunId] = useState("halo");
  return (
    <div className="mx-auto w-full max-w-[22.375rem]">
      <div className="rounded-surface bg-canvas p-4 outline-1 -outline-offset-1 outline-line">
        <DeviceProvider mode="phone">
          <RunList runs={runs} selectedId={runId} onSelect={(run) => setRunId(run.id)} onStop={stop} onArchive={archive} />
        </DeviceProvider>
      </div>
    </div>
  );
}

/** Try it holds the selection, so pressing a row opens it; a new defaultFilter starts the list again. */
function TryRunList(props: { defaultFilter?: RunFilter; label?: string }) {
  const [runId, setRunId] = useState("world");
  return (
    <div className="w-full max-w-72">
      <RunList key={props.defaultFilter} {...props} runs={STUDIO} selectedId={runId} onSelect={(run) => setRunId(run.id)} onStop={() => {}} onArchive={() => {}} />
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function RunTile() {
  const [runId, setRunId] = useState("world");
  return (
    <div className="w-full max-w-72">
      <RunList runs={STUDIO.slice(0, 2).concat(STUDIO[3])} selectedId={runId} onSelect={(run) => setRunId(run.id)} />
    </div>
  );
}

export default function RunListPage() {
  const [sidebarKey, resetSidebar] = useReplay();
  const [liveKey, replayLive] = useReplay();
  const [inboxKey, resetInbox] = useReplay();
  return (
    <Page meta={meta} docs={docs} tile={<RunTile />}>
      <Stage
        title="Runs in a sidebar"
        tier="responsive"
        size="lg"
        align="start"
        code="SidebarDemo"
        onReplay={resetSidebar}
        replayLabel="Reset"
        caption="Six runs from the studio. The Halo build waits for your approval, so it sits above the rest under Needs you, and the others keep the order they came in. Press a run and the raised block glides to it on the responsive tier, while the hover highlight moves from row to row under it. Pick a status in the filter and the rows that stay glide to their new places as the others fade in, on the responsive tier. Stop and Archive show when you point at a row or move to it."
      >
        <div key={sidebarKey} className="w-full">
          <SidebarDemo />
        </div>
      </Stage>

      <Stage
        title="The agent moves the runs"
        tier="instant"
        size="lg"
        align="start"
        code="LiveDemo"
        onReplay={replayLive}
        caption="Here nobody touches the list. The Halo build comes to need you and jumps to the top, the Northwind move fails, the Cosmos import finishes, and once its deploy is approved the Halo build drops back among the rest. Each run moves to its new place at once, the open block with it, because motion answers a hand and no hand asked. Marks and words swap at once, colors fade on the instant tier, and a polite status says each run that needs you, failed or is done."
      >
        <div key={liveKey} className="w-full">
          <LiveDemo />
        </div>
      </Stage>

      <Stage
        title="A narrow inbox"
        tier="instant"
        align="start"
        code="InboxDemo"
        onReplay={resetInbox}
        replayLabel="Reset"
        caption="The same list at 16rem, as an inbox. Long titles and status lines are cut at the end, and the updated words never are. Stop a running run and it says where it stopped. Archive a finished one and it leaves at once, and if the button had focus, focus moves to the row that takes its place. The verbs keep a column of their own, so nothing shifts when one shows."
      >
        <div key={inboxKey} className="w-full">
          <InboxDemo />
        </div>
      </Stage>

      <Stage
        title="On a phone"
        tier="responsive"
        align="start"
        code="PhoneDemo"
        caption="On a touch screen there is no hover, so Stop and Archive always show, and they grow to 44px with the filter. A pressed row takes its hover fill, and a tap never leaves the highlight behind. The rows stay 56px, the block still glides to the run you tap, and Archive is a button, not a swipe."
      >
        <PhoneDemo />
      </Stage>

      <TryIt of="RunList" component={TryRunList} props={{ label: "Runs" }} controls={["label", "defaultFilter"]} />
    </Page>
  );
}
