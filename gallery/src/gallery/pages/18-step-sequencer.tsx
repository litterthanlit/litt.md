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
    "An Ableton-style 8-step pattern grid, a lane per instrument in its own clip color: Kick in orange, Snare in green, Hi-hat in cyan and Bass in blue, across two beats of four steps. Click any step to toggle a hit on the frame, cycle House / Breakbeat / Minimal presets, or press Play to step the playhead across the bar. Starts stopped and never auto-runs on mount. It belongs to Rack.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["step-sequencer", "button"],
  exports: ["StepSequencer"],
  usage: `import { StepSequencer } from "@/components/step-sequencer";

<StepSequencer title="Drum rack · Pattern A" bpm={124} />`,
  use: [
    "Beat programming, drum racks, and quantized step toggles in music apps and creative tools under Rack.",
    "Giving each instrument lane its own clip color while keeping inactive cells quiet grey.",
  ],
  skip: [
    "Another world's page. StepSequencer uses Rack's clip color grammar and instant-cut grid; it needs data-material=\"rack\" on <html>.",
    "A timeline of continuous durations. Use TimeScrubber or Timeline.",
  ],
  keyboard: [
    [["Tab"], "Moves across Play, Pattern and Clear, then into the step grid as one stop, on the step focused last, then out of it."],
    [["←", "→", "↑", "↓"], "Moves one step along a lane, or to the same step in the lane above or below, without wrapping."],
    [["Home", "End"], "Goes to the lane's first or last step. With Ctrl or ⌘, to the first or last step of the grid."],
    [["Enter", "Space"], "Toggles the focused step on or off, or presses Play, Pattern or Clear."],
  ],
  a11y: [
    "Starts stopped so nothing moves or flashes on mount.",
    "The steps are a grid, a row per lane with its name as the row header. It is one tab stop, and the arrows move in it.",
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
  return <StepSequencer title="Drum rack · Pattern A" bpm={124} className="max-w-2xl" />;
}

function BasslineDemo() {
  return <StepSequencer title="Acid loop · 132 BPM" bpm={132} lanes={COMPACT_LANES} className="max-w-xl" />;
}

export default function StepSequencerPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<StepSequencer title="Drum rack" bpm={124} lanes={COMPACT_LANES} className="max-w-md" />}
    >
      <Stage
        title="Drum rack pattern"
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
        props={{ title: "Drum rack · Pattern A", bpm: 124, className: "max-w-2xl" }}
        controls={[
          { name: "title", type: "text" },
          { name: "bpm", type: "number" },
        ]}
      />
    </Page>
  );
}
