import { AgentChain } from "@/components/agent-chain";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "agent-chain",
  title: "Agent chain",
  lede: "A modular five-stage agent signal chain with clip hues, bypasses and value boxes.",
  order: 1.05,
  group: "Agents",
  verbs: ["drag", "select", "press"],
  worlds: ["rack"],
  summary:
    "An Ableton-style modular agent pipeline in Rack's materials: quiet grey panels with crisp 1px outlines, five stages each owning one of Rack's five clip colors (amber, blue, teal, violet, rose), per-stage power bypasses, vertical-drag value boxes and instant-cut presets. Every state change lands on the frame. It belongs to Rack.",
  tiers: ["instant"],
  mechanism:
    "Each stage owns one clip color across its header and value bar, a power bypass switch (I or O) and a tool toggle. Parameter boxes capture vertical pointer drags 1:1, answer arrow keys as native sliders and reset on double-click. Presets cut every bypass and parameter value immediately on the frame and update the chain summary readout.",
};

export const docs: PageDocs = {
  components: ["agent-chain"],
  exports: ["AgentChain"],
  usage: `import { AgentChain } from "@/components/agent-chain";

// Needs data-material="rack" on <html>.
<AgentChain title="Agent signal chain" />`,
  use: [
    "Multi-agent orchestration pipelines, routing chains and developer workbenches where operators tune budgets and bypass stages in real time under Rack.",
    "Assigning each stage one distinct clip color so complex pipelines read at a glance without coloring the module chrome.",
  ],
  skip: [
    "Another world's page. AgentChain relies on Rack's five clip tints, 1px outlined value boxes and instant-cut chrome, and needs data-material=\"rack\" on <html>.",
    "A read-only step timeline for one finished run. Use Timeline or Plan.",
    "A single numeric setting. Use NumberField or Slider.",
  ],
  keyboard: [
    [["Tab"], "Moves across the preset keys, each stage's bypass switch, its parameter slider and its tool toggle."],
    [["↑", "→", "↓", "←"], "Steps the focused parameter box up or down by one step."],
    [["Page Up", "Page Down"], "Steps the focused parameter box by three steps."],
    [["Home", "End"], "Jumps the focused parameter box to its minimum or maximum value."],
  ],
  a11y: [
    "Each parameter box exposes role=\"slider\" with aria-label, aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext.",
    "Stage bypasses and tool toggles are native buttons with aria-pressed and plain words (Active or Bypassed, On or Off) so state never depends on color.",
    "Every 24px bypass switch keeps a 44px touch target on coarse pointers.",
    "Preset recalls, bypass flips and tool toggles announce once in a polite status region.",
  ],
};

function ChainDemo() {
  return <AgentChain title="Agent signal chain" />;
}

export default function AgentChainPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<AgentChain title="Agent signal chain" className="max-w-3xl" />}
    >
      <Stage
        title="Five-stage signal chain"
        tier="instant"
        caption="Drag vertically on any value box, bypass a stage with I / O or recall a preset on the frame."
        code="ChainDemo"
      >
        <ChainDemo />
      </Stage>

      <TryIt
        of="AgentChain"
        component={AgentChain}
        props={{ title: "Agent signal chain" }}
        controls={["title"]}
      />
    </Page>
  );
}
