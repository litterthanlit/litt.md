import { AgentThrottle } from "@/components/agent-throttle";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "agent-throttle",
  title: "Agent throttle",
  lede: "A striped Heat HUD slab for steering reasoning depth, worker lanes and halt.",
  order: 1.05,
  group: "Agents",
  verbs: ["select", "press", "watch"],
  worlds: ["heat"],
  summary:
    "A street-racing HUD steering slab for live agent runs: a square black panel banded with diagonal hazard stripes and framed by four outer ink corner brackets. It pairs live token burn rate, lane count and remaining budget with three keyboard-driven 12-dash tuning rows (Reasoning, Parallelism, Guardrail) and an instant Halt kill-switch. It belongs to Heat.",
  tiers: ["instant"],
  mechanism:
    "The active row takes amber corner brackets and a chevron; Up and Down switch rows and Left and Right step its 12-dash bar on the instant tier, turning the top dashes danger red at Redline while the status Tag reads Redline. H engages or clears the Halt kill-switch and zeros token burn immediately, and R resets to Cruise.",
};

export const docs: PageDocs = {
  components: ["agent-throttle", "button", "kbd", "tag"],
  exports: ["AgentThrottle"],
  usage: `import { AgentThrottle } from "@/components/agent-throttle";

// Needs data-material="heat" on <html>.
<AgentThrottle label="Agent overdrive" />`,
  use: [
    "High-tempo live agent consoles, batch runner HUDs and game or simulation directors tuning reasoning depth and worker lanes under Heat.",
    "Pairing stepped 12-dash telemetry bars with real single-key steering and an emergency Halt kill-switch.",
  ],
  skip: [
    "Another world's page. AgentThrottle belongs to Heat's square black slabs, diagonal hazard stripes and corner brackets, and needs data-material=\"heat\" on <html>.",
    "A quiet form setting saved on submit. Use Slider or Select.",
    "A single pursuit condition readout. Use PursuitMeter.",
  ],
  keyboard: [
    [["↑", "↓"], "Moves the amber brackets between Reasoning, Parallelism and Guardrail while focus is inside the slab."],
    [["←", "→"], "Steps the selected row's 12-dash meter down or up by one step."],
    [["H"], "Engages or releases the emergency Halt kill-switch, matching the Halt or Resume button."],
    [["R"], "Resets all three rows back to Cruise."],
  ],
  a11y: [
    "Each 12-dash row exposes role=\"meter\" with aria-valuemin, aria-valuemax, aria-valuenow and a plain-word aria-valuetext.",
    "Status is always stated in words in the header Tag (Cruise, Boost, Redline, Halted), never by amber or danger red dashes alone.",
    "Every shortcut shown in the foot row works while focus is inside the slab, and buttons expose matching aria-keyshortcuts.",
    "Every step, halt or reset announces once in a polite status region.",
  ],
};

function BoostDemo() {
  return <AgentThrottle label="Agent overdrive" className="max-w-md" />;
}

function RedlineAndHaltDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
      <AgentThrottle
        label="Redline sprint"
        defaultState={{ reasoning: 11, workers: 5, guardrail: 11, halted: false }}
        interactive={false}
      />
      <AgentThrottle
        label="Safety stop"
        defaultState={{ reasoning: 6, workers: 3, guardrail: 5, halted: true }}
        interactive={false}
      />
    </div>
  );
}

export default function AgentThrottlePage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<AgentThrottle label="Agent overdrive" className="max-w-sm" />}
    >
      <Stage
        title="Live overdrive slab"
        tier="instant"
        caption="Focus inside the slab to drive rows with Up and Down, tune dashes with Left and Right, or press H to halt."
        code="BoostDemo"
      >
        <BoostDemo />
      </Stage>

      <Stage
        title="Redline and halted"
        tier="instant"
        caption="At Redline the top dashes turn danger red while the Tag reads Redline; Halted clears the bars and zeros burn rate."
        code="RedlineAndHaltDemo"
      >
        <RedlineAndHaltDemo />
      </Stage>

      <TryIt
        of="AgentThrottle"
        component={AgentThrottle}
        props={{ label: "Agent overdrive", interactive: true, className: "max-w-md" }}
        controls={["label", "interactive"]}
      />
    </Page>
  );
}
