import { DeviceRack, type DeviceMacro, type DevicePreset } from "@/components/device-rack";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "device-rack",
  title: "Device rack",
  lede: "Color-coded rotary macro dials with vertical drag and preset recall.",
  order: 4.05,
  group: "Tools",
  verbs: ["drag", "select"],
  worlds: ["rack"],
  summary:
    "An Ableton Live Audio Effect Rack: a grey module with a bypass toggle, instant preset buttons, and a row of color-coded rotary Macro Dials. Drag vertically on any dial (1:1 pointer capture) or step with arrow keys, double-click to reset to home, and switch presets to cut every macro on the frame. It belongs to Rack.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["device-rack"],
  exports: ["DeviceRack"],
  usage: `import { DeviceRack } from "@/components/device-rack";

<DeviceRack title="Dub Echo Rack" />`,
  use: [
    "Audio effect chains, synth macros, or dense creative-tool parameter strips under Rack where many values stay in reach at once.",
    "Grouping color-coded rotary parameters with instant preset recall and a module bypass switch.",
  ],
  skip: [
    "Another world's page. DeviceRack belongs to Rack's dense Ableton module grammar and needs data-material=\"rack\" on <html>.",
    "A single standalone setting in a form. Use Slider or NumberField.",
  ],
  keyboard: [
    [["Tab"], "Moves across the bypass toggle, preset buttons, and each macro dial."],
    [["↑", "→", "↓", "←"], "Increases or decreases the focused macro dial by one step; PageUp / PageDown moves five steps."],
    [["Home", "End"], "Jumps the focused macro dial to its minimum or maximum value."],
  ],
  a11y: [
    "Each macro dial exposes role=\"slider\" with aria-label, aria-valuemin, aria-valuemax, aria-valuenow and formatted aria-valuetext.",
    "The bypass toggle is a native button with aria-pressed and disables all macro dials while bypassed, saying Bypassed in words.",
    "Preset switches and bypass toggles announce once in a polite status region.",
  ],
};

const SYNTH_MACROS: DeviceMacro[] = [
  { id: "wave", label: "Wavetable", hue: "violet", min: 0, max: 100, step: 2, defaultValue: 48, unit: "%" },
  { id: "detune", label: "Detune", hue: "teal", min: 0, max: 50, step: 1, defaultValue: 14, unit: "ct" },
  { id: "attack", label: "Attack", hue: "blue", min: 0, max: 100, step: 2, defaultValue: 18, unit: "ms" },
  { id: "release", label: "Release", hue: "rose", min: 0, max: 100, step: 2, defaultValue: 62, unit: "ms" },
];

const SYNTH_PRESETS: DevicePreset[] = [
  { name: "Glass Pad", values: { wave: 48, detune: 14, attack: 18, release: 62 } },
  { name: "Pluck", values: { wave: 82, detune: 6, attack: 2, release: 24 } },
  { name: "Sub Drone", values: { wave: 12, detune: 28, attack: 64, release: 90 } },
];

function EchoRackDemo() {
  return <DeviceRack title="Dub Echo Rack" className="max-w-3xl" />;
}

function SynthRackDemo() {
  return <DeviceRack title="Wavetable Macro" macros={SYNTH_MACROS} presets={SYNTH_PRESETS} className="max-w-xl" />;
}

export default function DeviceRackPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<DeviceRack title="Dub Echo Rack" macros={SYNTH_MACROS} presets={SYNTH_PRESETS} className="max-w-md" />}
    >
      <Stage
        title="Audio Effect Rack"
        tier="instant"
        size="lg"
        code="EchoRackDemo"
        caption="Drag vertically on any macro dial, step with arrow keys, or double-click a dial to reset it. Switch between Dub Tape, Warm Wash, Acid Ping and Init to snap all five macros at once."
      >
        <EchoRackDemo />
      </Stage>
      <Stage
        title="Custom synth macros"
        tier="instant"
        code="SynthRackDemo"
        caption="Pass your own macro list and presets. Press the power dot in the title bar to bypass the whole device."
      >
        <SynthRackDemo />
      </Stage>
      <TryIt
        of="DeviceRack"
        component={DeviceRack}
        props={{ title: "Dub Echo Rack", className: "max-w-3xl" }}
        controls={[{ name: "title", type: "text" }]}
      />
    </Page>
  );
}
