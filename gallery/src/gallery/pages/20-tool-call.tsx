import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { ArrowUpIcon } from "@/components/icons";
import { ToolApproval, ToolCall, ToolCallGroup, type ToolApprovalDecision } from "@/components/tool-call";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "tool-call",
  title: "Tool call",
  lede: "What an agent did, one row per call.",
  order: 18.94,
  group: "Agents",
  verbs: ["open", "watch"],
  summary:
    "What an agent did, one row per call: a status mark, the action in words, the target in mono and the time, with the input and output folded under it. A group folds a run of calls and closes itself when they finish. An approval asks first, in the flow. Nothing spins: running is a still half circle.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["tool-call"],
  exports: ["ToolCall", "ToolCallGroup", "ToolApproval"],
  usage: `import { ToolApproval, ToolCall, ToolCallGroup } from "@/components/tool-call";

// A row per call. Give it an input or an output and it opens them.
<ToolCall status="done" action="Read" target="src/pages/index.tsx" duration={0.2} />
<ToolCall status="failed" action="Ran" target="npm run build" duration={14} output={buildLog} />

// A run folded under one line: open while a call runs, closed when they are done.
<ToolCallGroup running={busy} summary={busy ? "Working on the build" : "Read 2 files and ran the build"}>
  <ToolCall status="done" action="Read" target="package.json" duration={0.1} />
  <ToolCall status={busy ? "running" : "done"} action={busy ? "Running" : "Ran"} target="npm run build" />
</ToolCallGroup>

// Ask before a call runs. Allow and Deny set the decision, and the panel becomes a row.
<ToolApproval
  command="npm run deploy -- --prod"
  description="Publishes the Halo site to halo.studio."
  alwaysAllowLabel="Always allow npm run deploy"
  decision={decision}
  onAllow={({ always }) => setDecision("allowed")}
  onDeny={() => setDecision("denied")}
/>`,
  use: [
    "The agent did something and the person should see what: a file it read, a command it ran, a search. One row per call keeps the answer readable and the record complete.",
    "A call has details worth opening, such as a command's output or a search's matches. Pass `input` and `output`, and the row becomes a disclosure.",
    "A run of calls would crowd the turn. ToolCallGroup folds them under one summary, stays open while any call runs and closes when they finish.",
    "The agent needs a yes before it acts. ToolApproval asks in the flow, without taking focus, and turns into a row that says what the person chose.",
    "A call failed. The row says Failed in words, and its output stays in the foreground color so the error can be read.",
  ],
  skip: [
    "The agent is thinking, not acting. Use Thinking.",
    "The steps are a checklist the agent ticks off. Use Plan.",
    "You are showing code the agent wrote. Use Code block, which can also sit inside a call's output.",
    "The run is a deploy with phases and timings to compare. Use Timeline.",
    "The person must confirm something before the page can go on. Use Dialog. An approval sits in the flow and can be read around.",
    "You want a call to spin or pulse while it runs. Litt does not animate a status: a running call is a still half circle and the words say the rest.",
  ],
  keyboard: [
    [["Tab"], "Moves to a row or group that has details, then into an opened block that scrolls. A row with no details is not a stop."],
    [["Enter", "Space"], "Opens or closes the details of the focused row, or the focused group."],
    [["ArrowUp", "ArrowDown", "PageUp", "PageDown"], "Scroll a focused block of input or output."],
    [["Tab"], "In an approval, moves through the always-allow box, Allow and Deny. The panel is the next stop after the answer above it."],
    [["Space"], "Ticks the always-allow box. Enter or Space presses Allow or Deny."],
  ],
  a11y: [
    "A row with details is a real button with aria-expanded, named by the whole row: \"Ran npm run build Failed 14 seconds\". While the details are open it points to them with aria-controls.",
    "Status is never color or shape alone. A done or running call carries a hidden word, and a failed, waiting or denied call says it in its visible words. The icon is hidden from screen readers. Running is a half circle that stays still, so there is nothing to reduce under reduced motion.",
    "The short time (\"14s\") is hidden from screen readers and replaced by the spoken form (\"14 seconds\").",
    "Each block of input or output is a focusable region named \"Output of npm run build\", so a keyboard can scroll it. The name comes from the target, or from `label` when the target is not text.",
    "ToolCallGroup is a button with aria-expanded. Its calls are a list named by the summary, and a running group says \"running\" in hidden text. Opening and closing it is not announced; each call inside keeps its own status.",
    "ToolApproval does not take focus when it appears. A polite live region says \"Waiting for your approval: npm run deploy -- --prod\" once, and the panel is a group named by its title.",
    "When the person answers with focus inside the panel, focus moves to the row that replaces it, so a keyboard keeps its place and the row is read. If focus was elsewhere, the live region says \"Allowed: ...\" or \"Denied: ...\".",
    "The caller must keep only one accent fill in the view: disable the Composer's Send while an approval waits, and keep an approval outside a ToolCallGroup so the panel is never folded away.",
    "Text is the small or caption size in fg, fg-muted or fg-subtle, and the command sits on surface-2 in fg. Rows grow to 44px and the actions stay 44px tall on coarse pointers. Details fade in and travel a quarter of the travel token on the responsive tier, and appear at once under reduced motion.",
  ],
};

/* ---------------------------------------------------------------- data

   Litt is fixing the Halo site's failing build. The log is long on purpose: past 16rem the block scrolls inside. */

const SEARCH_MATCHES = `src/styles/fonts.css:1    @import "@fontsource/geist-sans/400.css";
src/styles/fonts.css:2    @import "@fontsource/geist-mono/400.css";
package.json:17           "@fontsource/geist-sans": "^5.3.0",`;

const BUILD_LOG = `> halo-site@0.4.0 build
> vite build

vite v5.4.8 building for production...
transforming (38) src/styles/fonts.css
error during build:
[vite:css] Failed to resolve import "@fontsource/geist-mono/400.css" from "src/styles/fonts.css".
Did you forget to install "@fontsource/geist-mono"?
    at ensureVersion (node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:38218:11)
    at resolveId (node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:38041:13)
    at PluginContainer.resolveId (node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:49024:34)
    at async TransformContext.resolve (node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:48853:17)
    at async Object.resolveId (node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:46790:21)
    at async PluginContainer.resolveId (node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:49022:15)
    at async resolve (node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:36120:20)
    at async Promise.all (index 0)
    at async compileCSS (node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:36308:25)
    at async TransformContext.transform (node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:35990:18)
npm ERR! Lifecycle script \`build\` failed with error: exit code 1`;

const TEST_LOG = `> vitest run

 PASS  src/pages/index.test.tsx (3 tests)
 PASS  src/styles/fonts.test.ts (2 tests)

 Test Files  2 passed (2)
      Tests  5 passed (5)`;

/** The calls of the group demo, in order. Each runs for a moment, then is done. */
const RUN = [
  { action: "Read", running: "Reading", target: "package.json", seconds: 0.1 },
  { action: "Read", running: "Reading", target: "src/styles/fonts.css", seconds: 0.2 },
  { action: "Edited", running: "Editing", target: "package.json", seconds: 0.3 },
  { action: "Ran", running: "Running", target: "npm run build", seconds: 4.2 },
];

/* ---------------------------------------------------------------- demos */

function RunDemo() {
  return (
    <div className="grid w-full min-w-0 max-w-xl gap-3">
      <p className="text-small text-fg-subtle">Litt is fixing the failing Halo build</p>
      <div className="grid">
        <ToolCall status="done" action="Read" target="src/pages/index.tsx" duration={0.2} />
        <ToolCall
          status="done"
          action="Searched"
          target={'"fontsource"'}
          label="the search"
          duration={0.4}
          input={'"fontsource" in src/ and package.json'}
          output={SEARCH_MATCHES}
        />
        <ToolCall status="failed" action="Ran" target="npm run build" duration={14} output={BUILD_LOG} />
        <ToolCall status="denied" action="Run" target="git push --force origin main" />
        <ToolCall status="waiting" action="Run" target="git push origin fix/fontsource" />
      </div>
    </div>
  );
}

function GroupDemo() {
  /* The call at this index is the one running. When it passes the end, every call is done. */
  const [at, setAt] = useState(0);
  const running = at < RUN.length;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setAt((n) => n + 1), 1100);
    return () => clearTimeout(t);
  }, [running, at]);

  return (
    <div className="grid w-full min-w-0 max-w-xl gap-3">
      <p className="text-small text-fg-subtle">Litt is fixing the failing Halo build</p>
      <ToolCallGroup running={running} summary={running ? "Working on the build" : "Read 2 files and ran the build"} duration={running ? undefined : 4.8}>
        {RUN.slice(0, Math.min(at + 1, RUN.length)).map((call, i) => {
          const live = i === at;
          return (
            <ToolCall
              key={call.target + i}
              status={live ? "running" : "done"}
              action={live ? call.running : call.action}
              target={call.target}
              duration={live ? undefined : call.seconds}
              output={!live && call.action === "Ran" ? TEST_LOG : undefined}
            />
          );
        })}
      </ToolCallGroup>
    </div>
  );
}

function ApprovalDemo() {
  const [decision, setDecision] = useState<ToolApprovalDecision>("pending");
  const waiting = decision === "pending";
  return (
    <div className="grid w-full min-w-0 max-w-md gap-6">
      <ToolApproval
        command="npm run deploy -- --prod"
        description="Publishes the Halo site to halo.studio."
        alwaysAllowLabel="Always allow npm run deploy"
        decision={decision}
        onAllow={() => setDecision("allowed")}
        onDeny={() => setDecision("denied")}
      />
      <div className="grid gap-2">
        <div className="flex items-center gap-3 rounded-surface bg-surface-1 py-2 pr-2 pl-4 shadow-[inset_0_0_0_1px_var(--line-control)]">
          <p className="min-w-0 flex-1 truncate text-body text-fg-subtle">Message Litt</p>
          <Button iconOnly size="sm" disabled aria-label="Send">
            <ArrowUpIcon />
          </Button>
        </div>
        <p className="text-caption font-normal text-fg-subtle">{waiting ? "Send is off while Litt waits for your answer." : "Send turns on when there is something to send."}</p>
      </div>
    </div>
  );
}

function PhoneDemo() {
  const [decision, setDecision] = useState<ToolApprovalDecision>("pending");
  return (
    <div className="w-full min-w-0 max-w-[22.375rem]">
      <div role="region" aria-label="Litt on a phone" className="grid gap-4 rounded-surface bg-canvas p-4 outline-1 -outline-offset-1 outline-line">
        <div className="grid">
          <ToolCallGroup summary="Read 2 files and ran the tests" duration={6}>
            <ToolCall status="done" action="Read" target="src/styles/fonts.css" duration={0.2} />
            <ToolCall status="done" action="Ran" target="npm test" duration={5.8} output={TEST_LOG} />
          </ToolCallGroup>
          <ToolCall status="failed" action="Ran" target="npm run build -- --mode production" duration={14} defaultOpen output={BUILD_LOG} />
        </div>
        <ToolApproval
          command="npm run deploy -- --prod"
          description="Publishes the Halo site to halo.studio."
          alwaysAllowLabel="Always allow npm run deploy"
          decision={decision}
          onAllow={() => setDecision("allowed")}
          onDeny={() => setDecision("denied")}
        />
        <div className="flex items-center gap-3 rounded-surface bg-surface-1 py-2 pr-2 pl-4 shadow-[inset_0_0_0_1px_var(--line-control)]">
          <p className="min-w-0 flex-1 truncate text-body text-fg-subtle">Message Litt</p>
          <Button iconOnly size="sm" disabled aria-label="Send">
            <ArrowUpIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ToolCallPage() {
  const [runKey, replayRun] = useReplay();
  const [approvalKey, resetApproval] = useReplay();
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A run of calls"
        tier="responsive"
        size="lg"
        code="RunDemo"
        caption="Each call is one row: a mark, the action in words, the target in mono and the time. Failed, denied and waiting say so in words, and done and running say it in hidden text. Nothing spins, because running is a still half circle. Open the failed build: its output stays in the foreground color, since the mark already says it failed. The chevron turns on the instant tier. The output fades in and travels a quarter of the travel token on the responsive tier, and its height snaps."
      >
        <RunDemo />
      </Stage>

      <Stage
        title="A group that closes itself"
        tier="responsive"
        onReplay={replayRun}
        code="GroupDemo"
        caption="A group folds a run under one line. While any call runs it is open, so you can watch the newest row, and when the last call is done it closes itself and the summary says what happened. Open or close it yourself and it keeps your choice. Its calls fade in on the responsive tier and leave on the exit token."
      >
        <GroupDemo key={runKey} />
      </Stage>

      <Stage
        title="An approval"
        tier="instant"
        onReplay={resetApproval}
        replayLabel="Reset"
        code="ApprovalDemo"
        caption="An approval asks first, in the flow, on a raised panel and never glass. It does not take focus, and a polite live region says what it waits for. Allow is the view's one accent fill, because Send is disabled while Litt waits. Press Allow or Deny and the panel becomes a row that says what you chose. Colors fade on the instant tier and nothing else moves."
      >
        <ApprovalDemo key={approvalKey} />
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        size="lg"
        align="start"
        code="PhoneDemo"
        caption="In a phone-wide column a long target is cut with an ellipsis, the output wraps instead of scrolling sideways, the command wraps so all of it can be read, and Allow and Deny stay on one line. On a finger the rows grow to 44px, as the buttons and the checkbox do."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
