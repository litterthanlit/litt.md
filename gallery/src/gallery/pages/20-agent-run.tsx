import { AgentRun, type AgentRunStep } from "@/components/agent-run";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "agent-run",
  title: "Agent run",
  lede: "Think, run the steps, fold them away, write the answer.",
  order: 1.07,
  group: "Agents",
  verbs: ["press", "watch"],
  worlds: ["flat"],
  summary:
    "One assistant turn on a writer's draft, on a white paper: your request in a grey bubble, the steps it ran folded into \"Thought for 4s\", and its answer. Run again plays the turn from the start. It belongs to Flat.",
  tiers: ["instant", "responsive", "expressive"],
  mechanism:
    "At rest it is the finished turn, folded, and nothing moves on load. Run again thinks with a live timer, then runs each step: a turning ring that becomes an ink circle with a check on the expressive spring, its result beside it. Then the steps fold into \"Thought for\" and the answer comes in word by word behind a caret. The fold opens and closes from its own button. Under reduced motion Run again finishes at once.",
};

export const docs: PageDocs = {
  components: ["agent-run"],
  exports: ["AgentRun"],
  usage: `import { AgentRun } from "@/components/agent-run";

<AgentRun
  title="Spring issue"
  request="Make the spring issue open stronger"
/>`,
  use: [
    "Showing what a writing or research assistant did before it answered, without dense logs or chrome.",
    "Letting a reader fold the steps away while the answer stays in front.",
  ],
  skip: [
    "Another world's page. AgentRun belongs to Flat's grey ground, white paper and ink marks, and needs data-material=\"flat\" on <html>.",
    "A multi-agent pipeline with editable parameters. Use Plan or RunList.",
    "A long chronological audit log of every tool payload. Use LogView.",
  ],
  keyboard: [
    [["Tab"], "Moves between the Thought for line, which folds the steps, and Run again."],
    [["Enter", "Space"], "Folds or unfolds the steps, or plays the turn again from the start."],
  ],
  a11y: [
    "The turn is a named section, aria-busy while it runs; the Thought for line is a disclosure with aria-expanded and aria-controls.",
    "A step's state is its mark and its result in words, never a dot.",
    "A polite status region says each phase once (Thinking, each step, Answer ready with the answer), not every word.",
    "Run again moves focus to the Thought for line, so focus never falls to the page while the turn runs.",
  ],
};

function SpringIssueDemo() {
  return <AgentRun title="Spring issue" />;
}

const DIGEST_STEPS: AgentRunStep[] = [
  { id: "links", label: "Gather saved links", detail: "6 posts", duration: "0.9s" },
  { id: "group", label: "Group by theme", detail: "3 themes", duration: "0.7s" },
  { id: "write", label: "Write the digest", detail: "38 words", duration: "1.0s" },
];

function OpenStepsDemo() {
  return (
    <AgentRun
      title="Morning digest"
      request="What did readers share this week?"
      steps={DIGEST_STEPS}
      answer="Three things stood out: the garden notes, a reader's letter on grey, and the spring issue's new opening."
      defaultExpanded
    />
  );
}

export default function AgentRunPage() {
  return (
    <Page meta={meta} docs={docs} tile={<AgentRun title="Spring issue" />}>
      <Stage
        title="A finished turn"
        tier="expressive"
        caption="The turn at rest, folded into Thought for; press Run again to watch it think, run its steps and write the answer."
        code="SpringIssueDemo"
      >
        <SpringIssueDemo />
      </Stage>

      <Stage
        title="Steps unfolded"
        tier="expressive"
        caption="Starts with the steps open, each an ink check and its result; the Thought for line folds them away."
        code="OpenStepsDemo"
      >
        <OpenStepsDemo />
      </Stage>

      <TryIt
        of="AgentRun"
        component={AgentRun}
        props={{ title: "Spring issue", request: "Make the spring issue open stronger", defaultExpanded: false }}
        controls={["request", "defaultExpanded"]}
      />
    </Page>
  );
}
