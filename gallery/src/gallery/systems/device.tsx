/**
 * Device's scenes (scene.ts): an agent at work. A run you can watch and stop, a table of runs, a change waiting for
 * your word, the agent's settings and a question to ask it. Keys, wells, LCD glass and mono; no accent fill anywhere,
 * so no sliders (they light in the accent) and no primary keys (R6).
 */
import { useState } from "react";
import { Button } from "@/components/button";
import { CodeBlock } from "@/components/code-block";
import { Composer, type ComposerFile } from "@/components/composer";
import { Legend } from "@/components/legend";
import { Message, MessageText } from "@/components/message";
import { NumberField } from "@/components/number-field";
import { RunCard } from "@/components/run-card";
import { Segmented } from "@/components/segmented";
import { SevenSegment } from "@/components/seven-segment";
import { Citation, SourceList, Sources, type Source } from "@/components/sources";
import { Switch } from "@/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag } from "@/components/tag";
import { ToolCall, ToolCallGroup } from "@/components/tool-call";
import { SlideConfirm } from "@/components/slide-confirm";
import type { PlanStep } from "@/components/plan";
import type { SystemScenes } from "./scene";

/* A. An agent run: a failing build, the steps, the calls, the clock and Stop. */

const RUN_STEPS: PlanStep[] = [
  { id: "read", label: "Read the build log", status: "done" },
  { id: "find", label: "Find the missing font import", status: "done", detail: "src/styles/fonts.css, line 3" },
  { id: "edit", label: "Switch to next/font", status: "running" },
  { id: "build", label: "Run the build", status: "pending" },
  { id: "pr", label: "Open the pull request", status: "pending" },
];

function AgentRun() {
  const [stopped, setStopped] = useState(false);
  const steps: PlanStep[] = stopped
    ? RUN_STEPS.map((s) => (s.status === "done" ? s : { ...s, status: "skipped" as const }))
    : RUN_STEPS;
  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <SevenSegment value="241" digits={4} label="Elapsed seconds" />
        <span className="font-mono text-caption text-fg-muted">s elapsed · 6 calls</span>
      </div>
      <RunCard
        title="Fix the Halo build"
        steps={steps}
        progress={0.4}
        actions={
          <Button variant="secondary" size="sm" disabled={stopped} onClick={() => setStopped(true)}>
            {stopped ? "Stopped" : "Stop"}
          </Button>
        }
      />
      <ToolCallGroup summary={stopped ? "Read 2 files, edited 1" : "Read 2 files, editing 1"} defaultOpen>
        <ToolCall status="done" action="Read" target="package.json" duration={0.1} />
        <ToolCall status="done" action="Ran" target="npm run build" duration={14} result="Exit 1" />
        <ToolCall status={stopped ? "done" : "running"} action={stopped ? "Edited" : "Editing"} target="src/styles/fonts.css" />
      </ToolCallGroup>
    </div>
  );
}

/* B. Runs: every run, its status and its time, and a Legend that picks which statuses show. */

type RunRow = { id: string; name: string; status: "Done" | "Running" | "Failed"; time: string };
const RUN_ROWS: RunRow[] = [
  { id: "r1", name: "Fix the Halo build", status: "Running", time: "4m 01s" },
  { id: "r2", name: "Bump Next.js to 15.4", status: "Done", time: "2m 18s" },
  { id: "r3", name: "Migrate auth to sessions", status: "Failed", time: "9m 46s" },
  { id: "r4", name: "Triage 14 stale issues", status: "Done", time: "1m 52s" },
  { id: "r5", name: "Write the changelog", status: "Done", time: "0m 37s" },
  { id: "r6", name: "Rotate staging keys", status: "Failed", time: "0m 12s" },
];
const STATUS_TAG = { Done: "success", Running: "neutral", Failed: "danger" } as const;

function Runs() {
  const [hidden, setHidden] = useState<string[]>([]);
  const shown = RUN_ROWS.filter((r) => !hidden.includes(r.status));
  const count = (s: RunRow["status"]) => String(RUN_ROWS.filter((r) => r.status === s).length);
  return (
    <div className="grid min-w-0 gap-3">
      <Legend
        label="Statuses shown"
        items={[
          { name: "Done", value: count("Done") },
          { name: "Running", value: count("Running") },
          { name: "Failed", value: count("Failed") },
        ]}
        hidden={hidden}
        onHiddenChange={setHidden}
      />
      <Table label="Agent runs, today">
        <TableHeader>
          <TableRow>
            <TableHead>Run</TableHead>
            <TableHead>Status</TableHead>
            <TableHead numeric>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((r) => (
            <TableRow key={r.id}>
              <TableCell primary>{r.name}</TableCell>
              <TableCell>
                <Tag status={STATUS_TAG[r.status]}>{r.status}</Tag>
              </TableCell>
              <TableCell numeric>
                <span className="font-mono">{r.time}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* C. Approve: the change the agent wants to ship, and a slide to let it. */

const DIFF = `--- a/src/app/layout.tsx
+++ b/src/app/layout.tsx
@@ -1,5 +1,5 @@
-import "@fontsource/geist-mono";
+import { GeistMono } from "geist/font/mono";

 export default function Layout({ children }) {
-  return <html>{children}</html>;
+  return <html className={GeistMono.variable}>{children}</html>;
 }`;

function Approve() {
  const [done, setDone] = useState(false);
  return (
    <div className="grid min-w-0 gap-3">
      <p className="font-mono text-small text-fg-muted">2 files · +2 −2 · build passes in 14s</p>
      <CodeBlock lang="diff" filename="src/app/layout.tsx" code={DIFF} />
      <SlideConfirm
        label="Slide to deploy to halo.studio"
        confirmedLabel="Deploying"
        onConfirm={() => setDone(true)}
        disabled={done}
      />
    </div>
  );
}

/* D. Controls: how the agent behaves. Number fields stand in for sliders, which light in the accent. */

function Controls() {
  const [model, setModel] = useState("sonnet");
  const [web, setWeb] = useState(true);
  return (
    <div className="grid min-w-0 gap-4">
      <Segmented
        legend="Model"
        showLegend
        value={model}
        onValueChange={setModel}
        block
        options={[
          { value: "haiku", label: "Haiku" },
          { value: "sonnet", label: "Sonnet" },
          { value: "opus", label: "Opus" },
        ]}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-3">
        <NumberField label="Temperature" defaultValue={0.2} min={0} max={1} step={0.1} format={{ minimumFractionDigits: 1 }} />
        <NumberField label="Max tokens" defaultValue={4096} min={256} max={32768} step={256} />
        <NumberField label="Retries" defaultValue={2} min={0} max={5} />
      </div>
      <Switch
        label="Web access"
        description="Lets the agent fetch pages and cite them."
        checked={web}
        onCheckedChange={setWeb}
      />
    </div>
  );
}

/* E. Ask: the agent's last answer, with its source, and a draft to reply with. */

const SOURCES: Source[] = [
  {
    id: "fonts",
    title: "Optimizing: Fonts",
    url: "https://nextjs.org/docs/app/getting-started/fonts",
    site: "nextjs.org",
    passage: "next/font self-hosts font files, so the browser makes no request to Google.",
  },
];

function Ask() {
  const [files, setFiles] = useState<ComposerFile[]>([{ id: "log", name: "build-4812.log", size: 18432 }]);
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="grid min-w-0 gap-3">
      <Sources sources={SOURCES}>
        <Message from="agent" name="Litt">
          <MessageText>
            <p>
              The build failed on a font import. <code>next/font</code> self-hosts the files, so I dropped the
              package <Citation source="fonts" /> and the build passes.
            </p>
          </MessageText>
          <SourceList />
        </Message>
      </Sources>
      {sent ? <p className="font-mono text-small text-fg-muted">Sent: {sent}</p> : null}
      <Composer
        label="Reply to the agent"
        placeholder="Reply to Litt"
        defaultValue="Why not keep @fontsource and pin the version?"
        files={files}
        onRemoveFile={(f) => setFiles((fs) => fs.filter((x) => x.id !== f.id))}
        onFiles={() => {}}
        onSend={(text) => setSent(text)}
        sendDisabled
      />
    </div>
  );
}

export const device: SystemScenes = {
  scenes: [
    { id: "agent-run", title: "An agent run", line: "A run you can read at a glance: steps, calls, an LCD clock and Stop as a plain key.", Render: AgentRun },
    { id: "runs", title: "Runs", line: "Statuses as tags and times in mono, with a legend that decides which rows show.", Render: Runs },
    { id: "approve", title: "Approve", line: "A diff on a code window and a slide that holds the deploy until you mean it.", Render: Approve },
    { id: "controls", title: "Controls", line: "Settings as keys and wells: a model switch, numbers to dial in and a lamp for web access.", Render: Controls },
    { id: "ask", title: "Ask", line: "The agent's short answer with its source, and your draft with a file attached.", Render: Ask },
  ],
  cover: "agent-run",
};
