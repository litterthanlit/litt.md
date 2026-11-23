import { AgentRun, type AgentRunStep } from "@/components/agent-run";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "agent-run",
  title: "Agent run",
  lede: "A writing assistant's turn from colored dot steps to streamed prose.",
  order: 1.07,
  group: "Agents",
  verbs: ["press", "watch"],
  worlds: ["flat"],
  summary:
    "One assistant turn framed on a white paper card: frameless colored dot steps that fold away behind a quiet toggle, followed by the drafted paragraph and a one-tap replay. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Starts settled at rest so the card reads immediately with zero motion on load. Tapping Run again steps through each frameless dot row in sequence and streams the draft prose inside the card's soft inner block; tapping Hide steps folds the step list neatly away. Under reduced motion, replaying updates directly without stepping or streaming.",
};

export const docs: PageDocs = {
  components: ["agent-run"],
  exports: ["AgentRun"],
  usage: `import { AgentRun } from "@/components/agent-run";

<AgentRun title="Opening draft" />`,
  use: [
    "Showing what a writing or research assistant checked before producing an answer, without dense logs or chrome.",
    "Letting a reader fold the intermediate steps away while keeping the finished draft prominent.",
  ],
  skip: [
    "Another world's page. AgentRun belongs to Flat's grey ground, paper card and frameless dot rows, and needs data-material=\"flat\" on <html>.",
    "A multi-agent pipeline with editable parameters. Use Plan or RunList.",
    "A long chronological audit log of every tool payload. Use LogView.",
  ],
  keyboard: [
    [["Tab"], "Moves between the Hide steps toggle and Run again."],
    [["Enter", "Space"], "Toggles the step list or replays the turn from the first step."],
  ],
  a11y: [
    "The disclosure button uses aria-expanded and aria-controls linked to the step list.",
    "Step state is shown by both filled vs. hollow dots and plain words (duration, Now, Queued).",
    "Starting and completing a replay announce once in a polite status region.",
  ],
};

function OpeningDraftDemo() {
  return <AgentRun title="Opening draft" />;
}

const BRIEF_STEPS: AgentRunStep[] = [
  { id: "links", label: "Gather links", detail: "6 articles", duration: "0.9s", hue: "sky" },
  { id: "dedupe", label: "Group themes", detail: "3 topics", duration: "0.7s", hue: "violet" },
  { id: "write", label: "Summarize", detail: "38 words", duration: "1.0s", hue: "bubblegum" },
];

function CollapsedBriefDemo() {
  return (
    <AgentRun
      title="Morning digest"
      steps={BRIEF_STEPS}
      answer="Three stories stood out this morning: ferries returning to winter schedules, a new coastal trail map for Mendocino, and an interview with the lighthouse keeper."
      defaultExpanded={false}
    />
  );
}

export default function AgentRunPage() {
  return (
    <Page meta={meta} docs={docs} tile={<AgentRun title="Opening draft" />}>
      <Stage
        title="Opening draft"
        tier="expressive"
        caption="Frameless colored dot steps above the drafted paragraph; tap Run again to watch the turn step and stream."
        code="OpeningDraftDemo"
      >
        <OpeningDraftDemo />
      </Stage>

      <Stage
        title="Collapsed steps"
        tier="expressive"
        caption="Steps start tucked away so the finished note leads; expand the step count to inspect the work."
        code="CollapsedBriefDemo"
      >
        <CollapsedBriefDemo />
      </Stage>

      <TryIt
        of="AgentRun"
        component={AgentRun}
        props={{ title: "Opening draft", defaultExpanded: true }}
        controls={["title", "defaultExpanded"]}
      />
    </Page>
  );
}
