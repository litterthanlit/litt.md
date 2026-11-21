import { EnvSwitch } from "@/components/env-switch";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "env-switch",
  title: "Environment switch",
  lede: "A tactile environment selector pairing a recessed stone tray with a cut-in load slot.",
  order: 1.08,
  group: "Selection",
  verbs: ["select"],
  worlds: ["press"],
  summary:
    "Press's environment and region deck sitting directly on warm stone: selecting Production, Preview or Development lifts its block cleanly out of the recessed tray, updates the tabular host and latency line, and adjusts the cut-in slot meter below. Zero outer frame and zero decorative status colors. It belongs to Press.",
  tiers: ["instant"],
  mechanism:
    "A radiogroup in a recessed tray (--tray, --tray-shade) lifts the chosen environment as a single raised block (--block, --highlight, --block-lift). Below, a cut-in slot (--slot, --slot-shade) filled with --slot-fill tracks capacity load for the active environment on the instant tier.",
};

export const docs: PageDocs = {
  components: ["env-switch"],
  exports: ["EnvSwitch"],
  usage: `import { EnvSwitch } from "@/components/env-switch";

<EnvSwitch defaultValue="prod" />`,
  use: [
    "Switching between Production, Preview and Development targets in product dashboards and settings panels under Press.",
    "Pairing an environment selector with its immediate host, region, latency and load readout.",
  ],
  skip: [
    "Another world's page. EnvSwitch relies on Press's recessed tray, raised stone block and cut-in slot; it needs data-material=\"press\" on <html>.",
    "A generic three-way view filter without telemetry. Use Segmented.",
    "Choosing among more than four regions or projects. Use Select or Combobox.",
  ],
  keyboard: [
    [["Tab"], "Moves focus into the group, onto the chosen environment, and on out of it. The group is one tab stop."],
    [["←", "→", "↑", "↓"], "Moves to the previous or next environment and chooses it. At either end it wraps around."],
    [["Home", "End"], "Chooses the first or the last environment."],
    [["Enter", "Space"], "Chooses the focused environment and updates the host and load slot."],
  ],
  a11y: [
    "Exposes role=\"radiogroup\" with role=\"radio\" and aria-checked on each environment block.",
    "The group is one tab stop: only the chosen environment is in the tab order, and the arrow keys move the choice, as a radio group does.",
    "The cut-in slot carries role=\"meter\" with aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext.",
    "Each switch announces the host, region, latency and capacity percentage once in a polite status region.",
  ],
};

function HarborEnvDemo() {
  return <EnvSwitch defaultValue="prod" />;
}

function PreviewEnvDemo() {
  return <EnvSwitch defaultValue="preview" />;
}

export const study: PageStudy = {
  object: <EnvSwitch defaultValue="prod" />,
  parts: [
    { name: "The recessed tray", selector: "[data-part=tray]" },
    { name: "The raised block", selector: "[data-part=block]" },
    { name: "The cut-in slot", selector: "[data-part=slot]" },
  ],
  states: {
    empty: <EnvSwitch defaultValue="dev" />,
    default: <EnvSwitch defaultValue="prod" />,
    pressed: <EnvSwitch defaultValue="preview" />,
  },
};

export default function EnvSwitchPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<EnvSwitch defaultValue="prod" />}
    >
      <Stage
        title="Production target"
        tier="instant"
        code="HarborEnvDemo"
        caption="Select Production, Preview or Development: the chosen block rises out of the tray and the cut-in slot updates immediately."
      >
        <HarborEnvDemo />
      </Stage>
      <Stage
        title="Preview branch"
        tier="instant"
        code="PreviewEnvDemo"
        caption="Zero outer boxes and zero colored badges — host, region, latency and load read cleanly on warm stone."
      >
        <PreviewEnvDemo />
      </Stage>
      <TryIt
        of="EnvSwitch"
        component={EnvSwitch}
        props={{ defaultValue: "prod" }}
        controls={[{ name: "defaultValue", options: ["prod", "preview", "dev"] }]}
      />
    </Page>
  );
}
