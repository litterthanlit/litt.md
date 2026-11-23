import { AutonomyGate } from "@/components/autonomy-gate";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "autonomy-gate",
  title: "Autonomy gate",
  lede: "A tactile agent stance selector, budget slot and queued action gate on warm stone.",
  order: 1.05,
  group: "Agents",
  verbs: ["select", "press"],
  worlds: ["press"],
  summary:
    "An agent autonomy and approval instrument sitting directly on warm stone: one recessed tray holds the three stances (Observe, Confirm, Autonomous) where the active stance lifts as a raised stone block with zero outlines, a cut-in slot measures the session action budget, and a lower tray queues the next tool call with Allow once and Hold keys. It belongs to Press.",
  tiers: ["instant"],
  mechanism:
    "The stance group sits in a recessed tray (--tray, --tray-shade) with the active stance lifted as a raised stone block (--block, --highlight, --block-lift). The session budget fills a cut-in slot (--slot, --slot-shade, --slot-fill) using scaleX on the instant tier. Allowing or holding a queued call advances the queue, updates the budget slot and announces the outcome once in a polite status region.",
};

export const docs: PageDocs = {
  components: ["autonomy-gate"],
  exports: ["AutonomyGate"],
  usage: `import { AutonomyGate } from "@/components/autonomy-gate";

<AutonomyGate
  label="Agent autonomy"
  defaultMode="confirm"
  actionBudget={12}
/>`,
  use: [
    "Product ops, coding agents and release assistants where people choose how much autonomy an agent holds before approving queued actions.",
    "Pairing a three-level autonomy switch with a visible action budget and inline per-step approval without decorative status pills.",
  ],
  skip: [
    "Another world's page. AutonomyGate is built from Press's warm stone trays, cut-in slots and raised blocks and belongs to Press.",
    "A single binary permission toggle. Use Switch.",
    "An inline chat approval inside a transcript turn. Use ToolApproval.",
  ],
  keyboard: [
    [["Tab"], "Moves into the autonomy stance group as one stop on the active stance, then to the queued action keys."],
    [["←", "→", "↑", "↓"], "Moves between Observe, Confirm and Autonomous and selects immediately, wrapping at the ends."],
    [["Home", "End"], "Jumps to the first or last stance."],
    [["Enter", "Space"], "Activates the focused Allow once, Step up to confirm, Hold or Reset queue key."],
  ],
  a11y: [
    "The stance strip is a native radiogroup with roving tab index, so it takes one tab stop regardless of how many levels are passed.",
    "The session budget bar exposes role=\"meter\" with aria-valuemin, aria-valuemax, aria-valuenow and a spoken aria-valuetext.",
    "Every mode change and approval decision is stated in plain words and announced once in a polite live status region.",
    "When the queue clears or resets, focus hands off cleanly to the replacement key instead of falling to the page.",
  ],
};

function ConfirmGateDemo() {
  return <AutonomyGate defaultMode="confirm" actionBudget={12} initialUsed={4} />;
}

function ObserveGateDemo() {
  return <AutonomyGate defaultMode="observe" actionBudget={12} initialUsed={2} />;
}

export const study: PageStudy = {
  object: <AutonomyGate defaultMode="confirm" actionBudget={12} initialUsed={4} />,
  parts: [
    { name: "The raised stance block", selector: "[role=radio][aria-checked=true]" },
    { name: "The budget readout", selector: "[role=meter]" },
    { name: "The queued call field", selector: "[data-part=cut]" },
    { name: "The action key", selector: "button[data-part=block]:not([role=radio])" },
  ],
  states: {
    default: <AutonomyGate defaultMode="confirm" actionBudget={12} initialUsed={4} />,
    disabled: <AutonomyGate defaultMode="observe" actionBudget={12} initialUsed={2} />,
    loading: <AutonomyGate defaultMode="autonomous" actionBudget={12} initialUsed={8} />,
  },
};

export default function AutonomyGatePage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<AutonomyGate defaultMode="confirm" actionBudget={12} initialUsed={4} />}
    >
      <Stage
        title="Confirm gate"
        tier="instant"
        caption="The active stance rises as a stone block out of a recessed tray above the budget slot and queued action."
        code="ConfirmGateDemo"
      >
        <ConfirmGateDemo />
      </Stage>

      <Stage
        title="Observe mode"
        tier="instant"
        caption="In Observe mode writes are held in plain words until the operator steps up to Confirm."
        code="ObserveGateDemo"
      >
        <ObserveGateDemo />
      </Stage>

      <TryIt
        of="AutonomyGate"
        component={AutonomyGate}
        props={{ label: "Agent autonomy", defaultMode: "confirm", actionBudget: 12, initialUsed: 4 }}
        controls={[
          "label",
          { name: "mode", options: ["observe", "confirm", "autonomous"], optional: true },
          { name: "actionBudget", type: "number", min: 4, max: 24, step: 2 },
        ]}
      />
    </Page>
  );
}
