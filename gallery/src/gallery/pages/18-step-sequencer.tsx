import { useRef } from "react";
import { StepSequencer, type StepLane } from "@/components/step-sequencer";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "step-sequencer",
  title: "Step sequencer",
  lede: "A colorful 8-step drum and bass pattern grid on the beat.",
  ledeByWorld: { flat: "A beat maker as a grid of soft squares." },
  order: 9.1,
  group: "Tools",
  verbs: ["select", "press"],
  worlds: ["rack", "flat"],
  summary:
    "An Ableton-style 8-step pattern grid, a lane per instrument in its own clip color: Kick in orange, Snare in green, Hi-hat in cyan and Bass in blue, across two beats of four steps. Click any step to toggle a hit on the frame, cycle House / Breakbeat / Minimal presets, or press Play to step the playhead across the bar. Starts stopped and never auto-runs on mount. It belongs to Rack.",
  summaryByWorld: {
    flat: "A beat maker on one white paper: a row per lane of sixteen soft grey squares, the ink where a step is set, and the tempo as the one large figure with − and + and an ink Play. While it plays, the step under the playhead pops a little in the ink and its lane's name lights. On a narrow screen it shows eight steps at a time and follows the playhead. Starts stopped, and the beat is seen, not heard.",
  },
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
  skipByWorld: {
    flat: [
      "Another world's page. This body is Flat's soft squares on white paper; it needs data-material=\"flat\" on <html>.",
      "A timeline of continuous durations. Use a timeline or a slider.",
    ],
  },
  skip: [
    "Another world's page. StepSequencer uses Rack's clip color grammar and instant-cut grid; it needs data-material=\"rack\" on <html>.",
    "A timeline of continuous durations. Use TimeScrubber or Timeline.",
  ],
  keyboard: [
    [["Tab"], "Moves across the controls, then into the step grid as one stop, on the step focused last, then out of it."],
    [["←", "→", "↑", "↓"], "Moves one step along a lane, or to the same step in the lane above or below, without wrapping."],
    [["Home", "End"], "Goes to the lane's first or last step. With Ctrl or ⌘, to the first or last step of the grid."],
    [["Enter", "Space"], "Toggles the focused step on or off, or presses the focused control."],
  ],
  a11yByWorld: {
    flat: [
      "Starts stopped so nothing moves or flashes on mount; Play and Stop say so once in a polite status.",
      "The steps are a grid, a row per lane with its name as the row header. It is one tab stop, and the arrows move in it.",
      "Every step is a native button with aria-pressed and a label naming its lane and step, and a set step is the ink while an empty one is grey, so the state never rests on a hue.",
      "The tempo is a slider named Tempo: the arrow keys change it a beat at a time, Page Up and Page Down by ten.",
      "Under reduced motion it still plays when asked, but nothing scales.",
    ],
  },
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

const FLAT_LANES: StepLane[] = [
  { id: "press", name: "Press", hue: "blue", steps: [true, false, false, true, false, false, true, false] },
  { id: "tick", name: "Tick", hue: "blue", steps: [false, true, false, true, false, true, false, true] },
  { id: "select", name: "Select", hue: "blue", steps: [true, false, false, false, true, false, false, false] },
];

function DrumRackDemo() {
  return <StepSequencer title="Drum rack · Pattern A" bpm={124} className="max-w-2xl" />;
}

function BasslineDemo() {
  return <StepSequencer title="Acid loop · 132 BPM" bpm={132} lanes={COMPACT_LANES} className="max-w-xl" />;
}

/* ---------- Flat's own: the player's own clicks, sequenced ---------- */

function FlatBeatDemo() {
  return <StepSequencer title="Beat" bpm={112} />;
}

/** On Flat's wall it plays by itself until a hand arrives (no sound: Flat's beat is seen); anywhere else it waits. */
function FlatBeatTile() {
  const box = useRef<HTMLDivElement | null>(null);
  const run = useSelfRun((n) => {
    if (n === 0) box.current?.querySelector<HTMLButtonElement>("button[aria-label='Play']")?.click();
  });
  return (
    <div
      ref={(el) => {
        box.current = el;
        run.ref(el);
      }}
      className="grid w-full justify-items-center"
    >
      <StepSequencer title="Beat" bpm={112} className="max-w-md" />
    </div>
  );
}

export default function StepSequencerPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<StepSequencer title="Drum rack" bpm={124} lanes={COMPACT_LANES} className="max-w-md" />}
      tileByWorld={{ flat: <FlatBeatTile /> }}
    >
      <Stage
        title="Drum rack pattern"
        tier="instant"
        size="lg"
        code="DrumRackDemo"
        byWorld={{
          flat: {
            demo: <FlatBeatDemo />,
            title: "A beat",
            code: "FlatBeatDemo",
            caption: "Press Play and the playhead walks the sixteen steps, each set step popping in the ink as it fires. Tap a square to set or clear it, drag the tempo or press − and +. On a narrow screen it shows eight steps at a time and turns the page with the playhead.",
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
            demo: <StepSequencer title="Three lanes" bpm={96} lanes={FLAT_LANES} className="max-w-md" />,
            code: "StepSequencer",
            caption: "Pass your own lanes and tempo: three lanes of eight steps here, so every step shows at once.",
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
