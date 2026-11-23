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
    "How much of a writing assistant's context window is full, on a white paper: the share used as one figure and one ink bar, and the sources as pills you tap to attach or leave out. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Each attached source is a grey pill with its name and token count, adding its share to the ink bar; a source left out is a bare pill that reads Off. Tapping a pill moves the bar and lifts the figure on Flat's expressive spring and announces the new total once. Nothing moves until a hand taps.",
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
    "Another world's page. ContextBudget belongs to Flat's grey ground, white paper, standing figure and ink bar, and needs data-material=\"flat\" on <html>.",
    "A single linear upload or download bar. Use Progress.",
    "A list of named values. Use Stat.",
  ],
  keyboard: [
    [["Tab"], "Moves across each source pill and the Trim largest or Attach all button."],
    [["Enter", "Space"], "Attaches or leaves out the focused source and announces the new token budget."],
  ],
  a11y: [
    "The bar exposes role=\"meter\" with aria-valuemin, aria-valuemax, aria-valuenow and a spoken aria-valuetext naming percentage and tokens.",
    "Each source pill is a native button with aria-pressed; a source left out says Off in plain words.",
    "Every toggle and one-tap trim announces the new percentage and token count once in a polite status region.",
    "Under reduced motion the figure and bar jump directly to their new size.",
  ],
};

function DraftContextDemo() {
  return <ContextBudget title="Draft context" capacity={128000} />;
}

const FULL_SOURCES: ContextSource[] = [
  { id: "brief", label: "Issue 14 brief", tokens: 18000, included: true },
  { id: "interviews", label: "Garden interviews", tokens: 44000, included: true },
  { id: "photos", label: "Caption notes", tokens: 26000, included: true },
  { id: "edits", label: "Editor letters", tokens: 24000, included: true },
];

function NearLimitDemo() {
  return <ContextBudget title="Issue 14 research" sources={FULL_SOURCES} capacity={128000} />;
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
        caption="Tap any source to leave it out, or bring the archive back in."
        code="DraftContextDemo"
      >
        <DraftContextDemo />
      </Stage>

      <Stage
        title="Near the limit"
        tier="expressive"
        caption="Every source attached and the window nearly full; Trim largest leaves out the biggest one."
        code="NearLimitDemo"
      >
        <NearLimitDemo />
      </Stage>

      <TryIt
        of="ContextBudget"
        component={ContextBudget}
        props={{ title: "Draft context", capacity: 128000 }}
        controls={[
          "title",
          { name: "capacity", type: "number", min: 64000, max: 256000, step: 16000 },
        ]}
      />
    </Page>
  );
}
