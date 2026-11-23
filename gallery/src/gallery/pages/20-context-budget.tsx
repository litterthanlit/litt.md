import { ContextBudget, type ContextSource } from "@/components/context-budget";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "context-budget",
  title: "Context budget",
  lede: "A context window picker: one bar for the share used, and the sources to tap in or out.",
  order: 1.05,
  group: "Agents",
  verbs: ["select", "watch"],
  worlds: ["flat"],
  summary:
    "How much of a writing assistant's context window is full, framed on a white paper card (or contrasting ink card) sitting on Flat's grey ground: a crisp percentage readout, one bar, and plain source rows you tap to include or exclude. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "The card sits as white paper (or ink) on the grey ground with no outline. Each source sits on the paper as its name and token count, adding its share to the bar; excluding a source writes Off beside its name. Toggling any source bounces the percentage readout and moves the bar on Flat's expressive spring, and announces the updated token total once.",
};

export const docs: PageDocs = {
  components: ["context-budget"],
  exports: ["ContextBudget"],
  usage: `import { ContextBudget } from "@/components/context-budget";

<ContextBudget
  title="Draft context"
  capacity={128000}
/>`,
  use: [
    "Writing assistants, newsletter editors and research helpers where readers pick which notes, drafts and archives stay in the model's window.",
    "Making token headroom tangible without technical chrome or dense tables.",
  ],
  skip: [
    "Another world's page. ContextBudget belongs to Flat's grey ground, paper card, crisp standing percentage and one bar, and needs data-material=\"flat\" on <html>.",
    "A single linear upload or download bar. Use Progress.",
    "A structured key-value telemetry readout. Use Stat.",
  ],
  keyboard: [
    [["Tab"], "Moves across each source tag and the Trim largest or Attach all action."],
    [["Enter", "Space"], "Attaches or excludes the focused context source and announces the updated token budget."],
  ],
  a11y: [
    "The proportional bar exposes role=\"meter\" with aria-valuemin, aria-valuemax, aria-valuenow and a spoken aria-valuetext naming percentage and tokens.",
    "Each source tag is a native button with aria-pressed; excluded items show Off in plain words.",
    "Every toggle and one-tap trim announces the new percentage and token count once in a polite status region.",
    "Under reduced motion the figure and bar jump directly to their new size.",
  ],
};

function DraftContextDemo() {
  return <ContextBudget title="Draft context" capacity={128000} />;
}

const FULL_SOURCES: ContextSource[] = [
  { id: "brief", label: "Issue 14 brief", tokens: 18000, included: true },
  { id: "interviews", label: "Coastal interviews", tokens: 44000, included: true },
  { id: "photos", label: "Caption notes", tokens: 26000, included: true },
  { id: "edits", label: "Editor thread", tokens: 24000, included: true },
];

function NearLimitDemo() {
  return <ContextBudget title="Issue 14 research" tone="ink" sources={FULL_SOURCES} capacity={128000} />;
}

export default function ContextBudgetPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<ContextBudget title="Draft context" capacity={128000} />}
    >
      <Stage
        title="Draft context"
        tier="expressive"
        caption="Framed on white paper; tap any source to exclude it or bring the archive back in."
        code="DraftContextDemo"
      >
        <DraftContextDemo />
      </Stage>

      <Stage
        title="Ink card"
        tier="expressive"
        caption="Flat's contrasting ink card holds a live context readout with high contrast and no outline."
        code="NearLimitDemo"
      >
        <NearLimitDemo />
      </Stage>

      <TryIt
        of="ContextBudget"
        component={ContextBudget}
        props={{ title: "Draft context", tone: "paper", capacity: 128000 }}
        controls={[
          "title",
          { name: "tone", options: ["paper", "ink"] },
          { name: "capacity", type: "number", min: 64000, max: 256000, step: 16000 },
        ]}
      />
    </Page>
  );
}
