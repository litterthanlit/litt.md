import { StepSequencer, type StepLane } from "@/components/step-sequencer";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "step-sequencer",
  title: "Step sequencer",
  lede: "A colorful 8-step drum and bass pattern grid on the beat.",
  ledeByWorld: {
    flat: "An eight-step rhythm grid you tap to build and play a loop.",
  },
  order: 9.1,
  group: "Tools",
  verbs: ["select", "press"],
  worlds: ["rack", "flat"],
  summary:
    "An Ableton-style 8-step pattern grid, a lane per instrument in its own clip color: Kick in orange, Snare in green, Hi-hat in cyan and Bass in blue, across two beats of four steps. Click any step to toggle a hit on the frame, cycle House / Breakbeat / Minimal presets, or press Play to step the playhead across the bar. Starts stopped and never auto-runs on mount. It belongs to Rack.",
  summaryByWorld: {
    flat: "Four rows of eight steps on a paper card, each lane in its own color. Press any step to turn a hit on or off, press Next to switch between House, Breakbeat and Minimal patterns, or press Play to step through the loop. Starts stopped and stays still until you play or press a step.",
  },
  tiers: ["instant", "expressive"],
  movesByWorld: {
    flat: "When the grid first enters view, lit steps settle in once on the expressive spring, then wait. Pressing a step compresses immediately on pointerdown and settles on release. Pressing Play steps the active column across the eight beats, lifting lit steps slightly as it passes. Reduced motion skips the arrival and keeps every step still in place.",
  },
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
  useByWorld: {
    flat: [
      "Interactive rhythm sketches, loop players, and quantized step toggles in posts or creative tools.",
      "Giving each instrument lane its own color while leaving empty steps quiet neutral.",
    ],
  },
  skip: [
    "Another world's page. StepSequencer uses Rack's clip color grammar and instant-cut grid; it needs data-material=\"rack\" on <html>.",
    "A timeline of continuous durations. Use TimeScrubber or Timeline.",
  ],
  skipByWorld: {
    flat: [
      "A timeline of continuous durations. Use TimeScrubber or Timeline.",
      "A single binary toggle. Use Switch or Checkbox.",
    ],
  },
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
  a11yByWorld: {
    flat: [
      "Starts stopped so nothing moves on mount beyond the one-shot arrival, which reduced motion skips.",
      "The steps form a grid with a row per lane and its name as the row header. Tab lands on the grid once, and arrow keys move inside it.",
      "Every step is a native button with aria-pressed and a label naming the lane, step number, and state.",
      "Every toggle, pattern switch, and play or stop change announces once in a polite status region.",
    ],
  },
};

const COMPACT_LANES: StepLane[] = [
  { id: "kick", name: "Kick", hue: "amber", steps: [true, false, true, false, true, false, true, false] },
  { id: "hat", name: "Hi-hat", hue: "teal", steps: [false, true, false, true, false, true, false, true] },
  { id: "bass", name: "Bass", hue: "blue", steps: [true, false, false, true, false, true, false, false] },
];

const EMPTY_LANES: StepLane[] = [
  { id: "kick", name: "Kick", hue: "amber", steps: [false, false, false, false, false, false, false, false] },
  { id: "snare", name: "Snare", hue: "rose", steps: [false, false, false, false, false, false, false, false] },
  { id: "hat", name: "Hi-hat", hue: "teal", steps: [false, false, false, false, false, false, false, false] },
  { id: "bass", name: "Bass", hue: "blue", steps: [false, false, false, false, false, false, false, false] },
];

function DrumRackDemo() {
  return <StepSequencer title="Drum rack · Pattern A" bpm={124} className="max-w-2xl" />;
}

function BasslineDemo() {
  return <StepSequencer title="Acid loop · 132 BPM" bpm={132} lanes={COMPACT_LANES} className="max-w-xl" />;
}

function FlatPatternDemo() {
  return <StepSequencer bpm={124} className="max-w-lg" />;
}

function FlatCompactDemo() {
  return <StepSequencer title="Soft groove" bpm={132} lanes={COMPACT_LANES} className="max-w-md" />;
}

export const study: PageStudy = {
  object: <StepSequencer title="Drum rack · Pattern A" bpm={124} className="max-w-xl" />,
  parts: [
    { name: "The header", selector: "[data-body=rack] > div:first-child" },
    { name: "A lane label", selector: "[role=rowheader]" },
    { name: "An active step", selector: "[role=grid] button[aria-pressed=true]" },
    { name: "An empty step", selector: "[role=grid] button[aria-pressed=false]" },
  ],
  partsByWorld: {
    flat: [
      { name: "The paper", selector: "[data-part=paper]" },
      { name: "The play pill", selector: "button[data-part=ink]" },
      { name: "A lane label", selector: "[role=rowheader]" },
      { name: "A lit step", selector: "[role=grid] button[data-part=mark]" },
      { name: "An empty step", selector: "[role=grid] button[data-part=pill]" },
    ],
  },
  states: {
    default: <StepSequencer title="Drum rack · Pattern A" bpm={124} className="max-w-xl" />,
    empty: <StepSequencer title="Drum rack · Empty" bpm={124} lanes={EMPTY_LANES} className="max-w-xl" />,
  },
  byWorld: {
    flat: {
      object: <StepSequencer bpm={124} className="max-w-lg" />,
      states: {
        default: <StepSequencer bpm={124} className="max-w-lg" />,
        empty: <StepSequencer title="Empty loop" bpm={124} lanes={EMPTY_LANES} className="max-w-lg" />,
      },
      replay: {
        label: "Replay the arrival",
        caption: "Watch the lit steps settle in once on the expressive spring, then stay still.",
        run: () => <StepSequencer bpm={124} className="max-w-lg" />,
      },
    },
  },
};

export default function StepSequencerPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<StepSequencer title="Drum rack" bpm={124} lanes={COMPACT_LANES} className="max-w-md" />}
      tileByWorld={{ flat: <StepSequencer lanes={COMPACT_LANES} className="max-w-md" /> }}
    >
      <Stage
        title="Drum rack pattern"
        tier="instant"
        size="lg"
        code="DrumRackDemo"
        byWorld={{
          flat: {
            demo: <FlatPatternDemo />,
            title: "Four-lane pattern",
            code: "FlatPatternDemo",
            caption:
              "Press any step to turn a hit on or off. Press Next to switch between House, Breakbeat and Minimal patterns, or press Play to step across all eight beats.",
          },
        }}
        caption="Click any cell to add or remove a hit on the frame. Press House to cycle through Breakbeat and Minimal patterns, or press Play to step the playhead across all 8 beats."
      >
        <DrumRackDemo />
      </Stage>
      <Stage
        title="Compact bassline loop"
        tier="instant"
        code="BasslineDemo"
        byWorld={{
          flat: {
            demo: <FlatCompactDemo />,
            title: "Three-lane loop",
            code: "FlatCompactDemo",
            caption: "Pass custom lanes and tempo for a focused three-lane loop.",
          },
        }}
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
