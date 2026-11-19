import { StepSequencer, type StepLane } from "@/components/step-sequencer";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "step-sequencer",
  title: "Step sequencer",
  lede: "A colorful 8-step drum and bass pattern grid on the beat.",
  order: 9.1,
  group: "Tools",
  verbs: ["select", "press"],
  worlds: ["rack"],
  summary:
    "An Ableton-style 8-step pattern grid in Rack's five clip colors: Kick (amber/orange), Snare (rose/green), Hi-hat (teal/cyan) and Bass (blue) arranged across two 4-step beat groups. Click any step to toggle a hit on the frame, cycle House / Breakbeat / Minimal presets, or press Play to step the playhead across the bar. Starts stopped and never auto-runs on mount. It belongs to Rack.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["step-sequencer", "button"],
  exports: ["StepSequencer"],
  usage: `import { StepSequencer } from "@/components/step-sequencer";

<StepSequencer title="Drum Rack · Pattern A" bpm={124} />`,
  use: [
    "Beat programming, drum racks, and quantized step toggles in music apps and creative tools under Rack.",
    "Giving each instrument lane its own clip color while keeping inactive cells quiet grey.",
  ],
  skip: [
    "Another world's page. StepSequencer uses Rack's clip color grammar and instant-cut grid; it needs data-material=\"rack\" on <html>.",
    "A timeline of continuous durations. Use TimeScrubber or Timeline.",
  ],
  keyboard: [
    [["Tab"], "Moves across Play, Pattern, Clear, and each step button in the grid."],
    [["Enter", "Space"], "Toggles the focused step on or off, or triggers Play / Pattern / Clear."],
  ],
  a11y: [
    "Starts stopped so nothing moves or flashes on mount.",
    "Every step is a native button with aria-pressed and a full aria-label naming the instrument lane, step number, and state.",
    "Active steps carry a top bar and center dot in addition to tint fill, and every toggle or pattern change announces once in a polite status region.",
  ],
};

const COMPACT_LANES: StepLane[] = [
  { id: "kick", name: "Kick", hue: "amber", steps: [true, false, true, false, true, false, true, false] },
  { id: "hat", name: "Hi-hat", hue: "teal", steps: [false, true, false, true, false, true, false, true] },
  { id: "bass", name: "Bass", hue: "blue", steps: [true, false, false, true, false, true, false, false] },
];

function DrumRackDemo() {
  return <StepSequencer title="Drum Rack · Pattern A" bpm={124} className="max-w-2xl" />;
}

function BasslineDemo() {
  return <StepSequencer title="Acid Loop · 132 BPM" bpm={132} lanes={COMPACT_LANES} className="max-w-xl" />;
}

export default function StepSequencerPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<StepSequencer title="Drum Rack" bpm={124} lanes={COMPACT_LANES} className="max-w-md" />}
    >
      <Stage
        title="Drum Rack pattern"
        tier="instant"
        size="lg"
        code="DrumRackDemo"
        caption="Click any cell to add or remove a hit on the frame. Press House to cycle through Breakbeat and Minimal patterns, or press Play to step the playhead across all 8 beats."
      >
        <DrumRackDemo />
      </Stage>
      <Stage
        title="Compact bassline loop"
        tier="instant"
        code="BasslineDemo"
        caption="Pass custom lanes and BPM to build a focused 3-lane groove box."
      >
        <BasslineDemo />
      </Stage>
      <TryIt
        of="StepSequencer"
        component={StepSequencer}
        props={{ title: "Drum Rack · Pattern A", bpm: 124, className: "max-w-2xl" }}
        controls={[
          { name: "title", type: "text" },
          { name: "bpm", type: "number" },
        ]}
      />
    </Page>
  );
}
