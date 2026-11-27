import { AgentTranscript } from "@/components/agent-transcript";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "agent-transcript",
  title: "Agent transcript",
  lede: "A plain document ledger of agent steps with inline checkpoints and Subtraction motion.",
  order: 1.05,
  group: "Agents",
  verbs: ["select", "press", "watch"],
  worlds: ["plain"],
  summary:
    "An agent run written as an exact document in Helvetica Neue: black ink on white paper, bare 1px rules, four gliding 4px corner brackets around the active filter, and underlined link-blue actions for inspecting payloads, approving queued commands, skipping steps or rewinding to an earlier checkpoint. Filtered rows and closed payloads pare away with zero bounce. It belongs to Plain.",
  tiers: ["instant", "responsive"],
  mechanism:
    "The filter strip is one roving tablist stop marked by four 4px corner brackets that glide across choices on the 200ms zero-bounce spring. Each numbered row sits between 1px hairlines and prints its verb, target, tabular token count and state in plain words. Inspect, Approve, Skip, Re-queue and Rollback are underlined link-blue actions that update the ledger, pare out filtered rows on the 150ms exit and announce the change once.",
};

export const docs: PageDocs = {
  components: ["agent-transcript"],
  exports: ["AgentTranscript"],
  usage: `import { AgentTranscript } from "@/components/agent-transcript";

// Needs data-material="plain" on <html>.
<AgentTranscript title="Run 42 — Refactor session middleware" />`,
  use: [
    "Internal tools, audit logs, compliance reviews and agentic workspaces where an agent's work should read like a clean document.",
    "Giving operators direct Approve, Skip, Inspect and Rollback links inline without modal panels or decorative boxes.",
  ],
  skip: [
    "Another world's page. AgentTranscript belongs to Plain's bare-paper document grammar, link-blue controls and Subtraction motion, and needs data-material=\"plain\" on <html>.",
    "A conversational multi-turn chat interface. Use Message and Composer.",
    "A list of parallel background runs. Use RunList.",
  ],
  keyboard: [
    [["Tab"], "Moves into the filter strip as one stop, then across each row's Inspect, Approve, Skip, Re-queue or Rollback controls."],
    [["←", "→", "↑", "↓"], "Moves between All, Waiting, Applied and Skipped filters and applies immediately, wrapping at the ends."],
    [["Home", "End"], "Jumps to the first or last filter."],
    [["Enter", "Space"], "Activates the focused inline action."],
  ],
  a11y: [
    "The filter row is a native tablist with roving tab index and four gliding corner brackets plus forced-colors Highlight outline on the active tab.",
    "Every step sits inside a numbered ordered list with its status stated in plain words (Applied, Waiting, Skipped).",
    "Inspect toggles expose aria-expanded and reveal raw payload text directly inside the list item.",
    "Every approval, skip or rollback announces once in a polite status region, and reduced motion stills every transition.",
  ],
};

function LedgerDemo() {
  return <AgentTranscript title="Run 42 — Refactor session middleware" />;
}

export default function AgentTranscriptPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<AgentTranscript title="Run 42 — Refactor session middleware" />}
    >
      <Stage
        title="Audit ledger"
        tier="instant"
        caption="Filter steps, inspect raw payloads inline, approve queued commands or roll back after an earlier step."
        code="LedgerDemo"
      >
        <LedgerDemo />
      </Stage>

      <TryIt
        of="AgentTranscript"
        component={AgentTranscript}
        props={{ title: "Run 42 — Refactor session middleware" }}
        controls={["title"]}
      />
    </Page>
  );
}
