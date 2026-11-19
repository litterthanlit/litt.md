import { useState } from "react";
import { Button } from "@/components/button";
import { Pad, type PadValue } from "@/components/pad";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "pad",
  title: "Pad",
  lede: "Two values set at once on one surface.",
  order: 4.01,
  group: "Tools",
  verbs: ["drag"],
  summary:
    "Two values set at once on one surface, like tone against length. A well cut into the page with a static dot grid on its floor, a round cap with dashed crosshairs, a dashed circle for the default, and a tooltip that says the value in words. The cap follows the pointer and the keys at once, with no easing, and sinks while held. Only the tooltip fades, on the responsive tier.",
  tiers: ["responsive"],
};

export const docs: PageDocs = {
  components: ["pad"],
  exports: ["Pad"],
  usage: `import { useState } from "react";
import { Pad, type PadValue } from "@/components/pad";

const [voice, setVoice] = useState<PadValue>({ x: 10, y: 55 });

<Pad
  label="Your voice"
  help="How your replies sound in Halden Studio."
  x={{ label: "Length", min: 0, max: 100, step: 5, minLabel: "Brief", maxLabel: "Detailed" }}
  y={{ label: "Tone", min: 0, max: 100, step: 5, minLabel: "Formal", maxLabel: "Casual" }}
  value={voice}
  onValueChange={setVoice}
  onValueCommit={(v) => saveVoice(v)}
  defaultMark={{ x: 30, y: 40 }}
  formatValue={({ x, y }) => \`\${tone(y)}, about \${20 + 2 * x} words\`}
/>`,
  use: [
    "Two settings that trade off against each other, where the position between the four edges matters more than either number: tone against length, density against contrast.",
    "People should feel their way to a value and read it back in words. Pass formatValue so the tooltip says \"Warm, brief, about 40 words\" and not \"10, 55\".",
    "A setting that has a sensible default. Pass defaultMark so people can see where Reset goes, and add a Reset button beside the pad.",
    "Save when the thumb is let go. Use onValueCommit, not onValueChange, which fires on every move.",
    "Say which way is which. Pass minLabel and maxLabel on both axes, because a bare square tells nobody what the corners mean.",
  ],
  skip: [
    "One value on a range. Use Slider.",
    "The exact numbers matter, such as a position in pixels. Use two Inputs.",
    "A few named choices, such as Casual or Formal. Use Segmented.",
    "A color. Use Color picker. A point on a map or any other canvas with its own meaning needs a control for that thing.",
    "Three or more values. Use a Slider for each.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the pad as one stop. A disabled pad is skipped."],
    [["←", "→"], "Moves the thumb left or right by one step of x."],
    [["↑", "↓"], "Moves the thumb up or down by one step of y."],
    [["Shift + arrow"], "Moves ten steps."],
    [["Page Up", "Page Down"], "Moves y up or down by ten steps."],
    [["Home", "End"], "Takes x to the left or the right edge."],
    [["Esc"], "Hides the tooltip without moving focus."],
  ],
  a11y: [
    "The pad holds two visually hidden range inputs, one per axis, each named by its axis label (\"Length\", \"Tone\") and described by the pad's label, its help text and the words at the ends of the axis. A screen reader gets two sliders and the arrow keys, not a drawing to guess at.",
    "One tab stop: the x input is in the tab order and the y input is skipped by Tab, as in React Aria's color area. A screen reader can still reach the y input, and every adjustment it makes goes through the same change.",
    "formatValue feeds aria-valuetext on both inputs, so a screen reader says \"Warm, brief, about 40 words\" for either one. Without it the two numbers are read with their axis labels.",
    "The tooltip, the axis words and the default mark are for eyes. The tooltip is hidden from screen readers because the inputs already say the value, and the default is added to each input's description as text.",
    "A press anywhere on the pad moves the thumb there, so the whole pad is the target and no extra hit area is needed. It captures the pointer, so a drag may leave the pad, and it is marked data-no-drag so a sheet never moves under it.",
    "On a touch screen the pad owns every drag that starts on it, so it does not scroll the page. The tooltip stands above the finger, not beside the thumb.",
    "The focus ring is a 2px outline at a 2px offset, drawn on the thumb when an input is focus-visible. A click or a tap does not show it. The thumb never changes size, so nothing shifts.",
    "A disabled pad is muted, skipped by Tab and marked aria-disabled. Say why it is locked in the help text.",
  ],
};

/** The tone word for a y value, from Formal at the bottom to Casual at the top. */
const TONES = ["Formal", "Polished", "Warm", "Friendly", "Casual"];
const toneOf = (y: number) => TONES[Math.min(TONES.length - 1, Math.floor(y / 20))]!;
const lengthOf = (x: number) => (x < 30 ? "brief" : x < 65 ? "balanced" : "detailed");
const wordsOf = (x: number) => 20 + 2 * x;

const formatVoice = ({ x, y }: PadValue) => `${toneOf(y)}, ${lengthOf(x)}, about ${wordsOf(x)} words`;

const VOICE_DEFAULT: PadValue = { x: 30, y: 40 };

/** One opening line of a reply to Mira, written in each tone. */
const REPLIES: Record<string, string> = {
  Formal: "Dear Mira, thank you for your message. I will send the revised homepage designs by Thursday.",
  Polished: "Hello Mira, thanks for your note. The revised homepage designs will reach you on Thursday.",
  Warm: "Hi Mira, thanks for the note. I'll send the revised homepage designs over on Thursday.",
  Friendly: "Hey Mira, thanks for the nudge. Revised homepage designs are coming your way on Thursday.",
  Casual: "Hey Mira! Thanks, I'm on it. You'll have the new homepage by Thursday.",
};

function VoiceDemo() {
  const [voice, setVoice] = useState<PadValue>({ x: 10, y: 65 });
  const atDefault = voice.x === VOICE_DEFAULT.x && voice.y === VOICE_DEFAULT.y;
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Pad
        label="Your voice"
        help="How the replies Halden Studio drafts for you sound."
        x={{ label: "Length", min: 0, max: 100, step: 5, minLabel: "Brief", maxLabel: "Detailed" }}
        y={{ label: "Tone", min: 0, max: 100, step: 5, minLabel: "Formal", maxLabel: "Casual" }}
        value={voice}
        onValueChange={setVoice}
        defaultMark={VOICE_DEFAULT}
        formatValue={formatVoice}
      />
      <div className="flex items-center justify-between gap-4">
        <p className="text-small text-fg-muted">{formatVoice(voice)}</p>
        <Button size="sm" variant="secondary" disabled={atDefault} onClick={() => setVoice(VOICE_DEFAULT)}>
          Reset
        </Button>
      </div>
      <div className="grid gap-1 border-t border-line pt-4">
        <p className="text-small text-fg-subtle">Reply to Mira Halden</p>
        <p className="text-small text-fg-muted">{REPLIES[toneOf(voice.y)]}</p>
        <p className="text-caption font-normal tabular-nums text-fg-subtle">About {wordsOf(voice.x)} words</p>
      </div>
    </div>
  );
}

const DENSITY = ["Compact", "Snug", "Even", "Roomy", "Airy"];
const CONTRAST = ["Soft", "Gentle", "Medium", "Firm", "Strong"];
const level = (words: string[], v: number) => words[Math.min(words.length - 1, Math.floor(v / 20))]!;
const formatLook = ({ x, y }: PadValue) => `${level(DENSITY, x)} spacing, ${level(CONTRAST, y).toLowerCase()} contrast`;

function SectionLookDemo() {
  const [look, setLook] = useState<PadValue>({ x: 70, y: 35 });
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Pad
        label="Look of the section"
        help="Sets the spacing and the weight of the dividers on the Atelier Nord template."
        x={{ label: "Density", min: 0, max: 100, step: 5, minLabel: "Compact", maxLabel: "Airy" }}
        y={{ label: "Contrast", min: 0, max: 100, step: 5, minLabel: "Soft", maxLabel: "Strong" }}
        value={look}
        onValueChange={setLook}
        onValueCommit={(v) => setSaved(`Applied to Atelier Nord: ${formatLook(v).toLowerCase()}.`)}
        defaultMark={{ x: 50, y: 50 }}
        formatValue={formatLook}
      />
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {saved}
      </p>
    </div>
  );
}

function DisabledDemo() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <Pad
        disabled
        label="Look of the section"
        help="Locked while the template syncs."
        x={{ label: "Density", min: 0, max: 100, step: 5, minLabel: "Compact", maxLabel: "Airy" }}
        y={{ label: "Contrast", min: 0, max: 100, step: 5, minLabel: "Soft", maxLabel: "Strong" }}
        defaultValue={{ x: 70, y: 35 }}
        defaultMark={{ x: 50, y: 50 }}
        formatValue={formatLook}
      />
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function VoiceTile() {
  const [voice, setVoice] = useState<PadValue>({ x: 10, y: 65 });
  return (
    <div className="w-full max-w-sm">
      <Pad
        label="Your voice"
        help={formatVoice(voice)}
        x={{ label: "Length", min: 0, max: 100, step: 5, minLabel: "Brief", maxLabel: "Detailed" }}
        y={{ label: "Tone", min: 0, max: 100, step: 5, minLabel: "Formal", maxLabel: "Casual" }}
        value={voice}
        onValueChange={setVoice}
        defaultMark={VOICE_DEFAULT}
        formatValue={formatVoice}
      />
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): a recorder's auto level, and noise reduction on a take ---------- */

/** A level in dB with a true minus. */
const dB = (v: number) => `${v < 0 ? "−" : ""}${Math.abs(v)} dB`;
const formatAutoLevel = ({ x, y }: PadValue) => `Peaks near ${dB(y)}, rides in ${x} ms`;
const AUTO_LEVEL_DEFAULT: PadValue = { x: 300, y: -12 };
const RIDE_X = { label: "Ride time", min: 50, max: 1000, step: 50, minLabel: "Fast", maxLabel: "Slow" };
const RIDE_Y = { label: "Target level", min: -24, max: -6, step: 1, minLabel: "−24 dB", maxLabel: "−6 dB" };

/** What the auto level does to take_04, by how fast it rides. */
const rideOf = (x: number) =>
  x < 200
    ? "Rides quickly: a door slam is caught at once, and speech pumps a little."
    : x < 600
      ? "Rides gently: speech stays even, and a door slam still comes through."
      : "Rides slowly: loud and quiet passages keep their shape.";

function AutoLevelDemo() {
  const [ride, setRide] = useState<PadValue>({ x: 150, y: -9 });
  const atDefault = ride.x === AUTO_LEVEL_DEFAULT.x && ride.y === AUTO_LEVEL_DEFAULT.y;
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Pad
        label="Auto level"
        help="How the recorder rides the input gain while it records."
        x={RIDE_X}
        y={RIDE_Y}
        value={ride}
        onValueChange={setRide}
        defaultMark={AUTO_LEVEL_DEFAULT}
        formatValue={formatAutoLevel}
      />
      <div className="flex items-center justify-between gap-4">
        <p className="text-small text-fg-muted">{formatAutoLevel(ride)}</p>
        <Button size="sm" variant="secondary" disabled={atDefault} onClick={() => setRide(AUTO_LEVEL_DEFAULT)}>
          Reset
        </Button>
      </div>
      <div className="grid gap-1 border-t border-line pt-4">
        <p className="text-small text-fg-subtle">On take_04, an interview by a road</p>
        <p className="text-small text-fg-muted">{rideOf(ride.x)}</p>
        <p className="text-caption font-normal tabular-nums text-fg-subtle">Peaks near {dB(ride.y)}</p>
      </div>
    </div>
  );
}

const NOISE = ["Rumble", "Hum", "Room tone", "Hiss", "Air"];
const NOISE_X = { label: "Amount", min: -18, max: -3, step: 3, minLabel: "−18 dB", maxLabel: "−3 dB" };
const NOISE_Y = { label: "Band", min: 0, max: 100, step: 5, minLabel: "Low", maxLabel: "High" };
const formatNoise = ({ x, y }: PadValue) => `${dB(x)} of ${level(NOISE, y).toLowerCase()}`;

function NoiseReductionDemo() {
  const [noise, setNoise] = useState<PadValue>({ x: -9, y: 45 });
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Pad
        label="Noise reduction"
        help="Takes a band of steady noise out of take_04."
        x={NOISE_X}
        y={NOISE_Y}
        value={noise}
        onValueChange={setNoise}
        onValueCommit={(v) => setSaved(`Applied to take_04: ${formatNoise(v)}.`)}
        defaultMark={{ x: -6, y: 50 }}
        formatValue={formatNoise}
      />
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {saved}
      </p>
    </div>
  );
}

function LockedNoiseDemo() {
  return (
    <div className="grid w-full max-w-sm gap-6">
      <Pad
        disabled
        label="Noise reduction"
        help="Locked while take_04 exports."
        x={NOISE_X}
        y={NOISE_Y}
        defaultValue={{ x: -9, y: 45 }}
        defaultMark={{ x: -6, y: 50 }}
        formatValue={formatNoise}
      />
    </div>
  );
}

function AutoLevelTile() {
  const [ride, setRide] = useState<PadValue>({ x: 150, y: -9 });
  return (
    <div className="w-full max-w-sm">
      <Pad label="Auto level" help={formatAutoLevel(ride)} x={RIDE_X} y={RIDE_Y} value={ride} onValueChange={setRide} defaultMark={AUTO_LEVEL_DEFAULT} formatValue={formatAutoLevel} />
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): how the letter opens ---------- */

const INTROS: Record<string, string> = {
  Formal: "Dear reader, this week brings the last picture of the spring series, taken on the north pier at dawn.",
  Polished: "Hello, and welcome back. This week closes the spring series with a dawn picture from the north pier.",
  Warm: "Hi there, thanks for reading. The spring series ends this week, with one last dawn on the north pier.",
  Friendly: "Hey, good to see you. Last one of the spring series this week: the north pier, just after dawn.",
  Casual: "Hey! Last spring picture is in. North pier, way too early, worth it.",
};

function LetterVoiceDemo() {
  const [voice, setVoice] = useState<PadValue>({ x: 10, y: 65 });
  const atDefault = voice.x === VOICE_DEFAULT.x && voice.y === VOICE_DEFAULT.y;
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Pad
        label="Your letter's voice"
        help="How the opening lines of each issue read."
        x={{ label: "Length", min: 0, max: 100, step: 5, minLabel: "Brief", maxLabel: "Detailed" }}
        y={{ label: "Tone", min: 0, max: 100, step: 5, minLabel: "Formal", maxLabel: "Casual" }}
        value={voice}
        onValueChange={setVoice}
        defaultMark={VOICE_DEFAULT}
        formatValue={formatVoice}
      />
      <div className="flex items-center justify-between gap-4">
        <p className="text-small text-fg-muted">{formatVoice(voice)}</p>
        <Button size="sm" variant="secondary" disabled={atDefault} onClick={() => setVoice(VOICE_DEFAULT)}>
          Reset
        </Button>
      </div>
      <div className="grid gap-1 border-t border-line pt-4">
        <p className="text-small text-fg-subtle">Issue 14 opens</p>
        <p className="text-small text-fg-muted">{INTROS[toneOf(voice.y)]}</p>
        <p className="text-caption font-normal tabular-nums text-fg-subtle">About {wordsOf(voice.x)} words</p>
      </div>
    </div>
  );
}

function LetterVoiceTile() {
  const [voice, setVoice] = useState<PadValue>({ x: 10, y: 65 });
  return (
    <div className="w-full max-w-sm">
      <Pad
        label="Your letter's voice"
        help={formatVoice(voice)}
        x={{ label: "Length", min: 0, max: 100, step: 5, minLabel: "Brief", maxLabel: "Detailed" }}
        y={{ label: "Tone", min: 0, max: 100, step: 5, minLabel: "Formal", maxLabel: "Casual" }}
        value={voice}
        onValueChange={setVoice}
        defaultMark={VOICE_DEFAULT}
        formatValue={formatVoice}
      />
    </div>
  );
}

/* ---------- Rack's own (proposals/rack.md): Auto Filter XY pad and Reverb space ---------- */

const FILTER_DEFAULT: PadValue = { x: 4200, y: 35 };
const FILTER_X = { label: "Cutoff", min: 200, max: 12000, step: 200, minLabel: "200 Hz", maxLabel: "12 kHz" };
const FILTER_Y = { label: "Resonance", min: 0, max: 100, step: 5, minLabel: "0%", maxLabel: "100%" };
const formatFilterXy = ({ x, y }: PadValue) => `${x >= 1000 ? `${(x / 1000).toFixed(1)} kHz` : `${x} Hz`} · ${y}% res`;

function FilterXyDemo() {
  const [xy, setXy] = useState<PadValue>({ x: 3400, y: 45 });
  const atDefault = xy.x === FILTER_DEFAULT.x && xy.y === FILTER_DEFAULT.y;
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Pad
        label="Auto Filter · Synth track"
        help="Sweep cutoff across X and resonance across Y."
        x={FILTER_X}
        y={FILTER_Y}
        value={xy}
        onValueChange={setXy}
        defaultMark={FILTER_DEFAULT}
        formatValue={formatFilterXy}
      />
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-small tabular-nums text-fg-muted">{formatFilterXy(xy)}</p>
        <Button size="sm" variant="secondary" disabled={atDefault} onClick={() => setXy(FILTER_DEFAULT)}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function FilterXyTile() {
  const [xy, setXy] = useState<PadValue>({ x: 3400, y: 45 });
  return (
    <div className="w-full max-w-sm">
      <Pad
        label="Auto Filter · XY"
        help={formatFilterXy(xy)}
        x={FILTER_X}
        y={FILTER_Y}
        value={xy}
        onValueChange={setXy}
        defaultMark={FILTER_DEFAULT}
        formatValue={formatFilterXy}
      />
    </div>
  );
}

const REVERB_X = { label: "Decay", min: 1, max: 10, step: 1, minLabel: "1 s", maxLabel: "10 s" };
const REVERB_Y = { label: "Damping", min: 0, max: 100, step: 5, minLabel: "Dark", maxLabel: "Bright" };
const formatReverb = ({ x, y }: PadValue) => `${x} s decay · ${y}% bright`;

function ReverbSpaceDemo() {
  const [space, setSpace] = useState<PadValue>({ x: 4, y: 60 });
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <Pad
        label="Return B · Hall Reverb"
        help="Decay time and high-frequency damping."
        x={REVERB_X}
        y={REVERB_Y}
        value={space}
        onValueChange={setSpace}
        onValueCommit={(v) => setSaved(`Saved Return B: ${formatReverb(v)}.`)}
        defaultMark={{ x: 3, y: 50 }}
        formatValue={formatReverb}
      />
      <p role="status" className="min-h-5 text-small text-fg-subtle">
        {saved}
      </p>
    </div>
  );
}

export default function PadPage() {
  return (
    <Page meta={meta} docs={docs} tile={<VoiceTile />} tileByWorld={{ device: <AutoLevelTile />, flat: <LetterVoiceTile />, rack: <FilterXyTile /> }}>
      <Stage
        title="Your voice"
        tier="responsive"
        code="VoiceDemo"
        size="lg"
        caption="Press anywhere, drag, or use the arrow keys. The thumb, a round cap, and its crosshairs follow at once, with no easing; while you hold it, the cap sinks half a pixel and its cast tightens. The tooltip says the value in words. The dashed circle is the default, and Reset takes the thumb back to it. The words beside Reset say the same thing, and the reply under the pad changes with the tone and shows its length. Only the tooltip fades, on the responsive tier."
        byWorld={{
          flat: {
            demo: <LetterVoiceDemo />,
            title: "Your letter's voice",
            code: "LetterVoiceDemo",
            caption:
              "Press anywhere, drag, or use the arrow keys. The thumb, a circle, and its crosshairs follow at once, with no easing. The tooltip says the value in words. The dashed circle is the default, and Reset takes the thumb back to it. The words beside Reset say the same thing, and the opening lines under the pad change with the tone and show their length. Only the tooltip fades, on the responsive tier.",
          },
          device: {
            demo: <AutoLevelDemo />,
            title: "Auto level",
            code: "AutoLevelDemo",
            caption:
              "A recorder's auto level: how fast it rides the gain, and the level it aims the peaks at. Press anywhere, drag, or use the arrow keys. The cap and its crosshairs follow at once, with no easing. The tooltip says the value in dB and ms. The dashed circle is the default, and Reset takes the cap back to it. The words under the pad say what the ride does to a take. Only the tooltip fades, on the responsive tier.",
          },
          rack: {
            demo: <FilterXyDemo />,
            title: "Auto Filter XY",
            code: "FilterXyDemo",
            caption:
              "An Ableton-style XY filter pad on the Synth track: sweep cutoff from 200 Hz to 12 kHz horizontally and resonance vertically with 1:1 tracking and tabular readout.",
          },
        }}
      >
        <VoiceDemo />
      </Stage>

      <Stage
        title="A Framer section"
        tier="responsive"
        code="SectionLookDemo"
        caption="The same pad for a template's look: density from Compact to Airy, contrast from Soft to Strong. Tab once to reach it, then the arrows move the thumb, and Shift makes them ten steps. The note under it is written on release, from onValueCommit. A screen reader gets two sliders, one for each axis."
        byWorld={{
          device: {
            demo: <NoiseReductionDemo />,
            title: "Noise on a take",
            code: "NoiseReductionDemo",
            caption:
              "The same pad for noise reduction on a take: how much comes out, from −18 dB to −3 dB, and the band it comes out of, from rumble to air. Tab once to reach it, then the arrows move the cap, and Shift makes them ten steps. The note under it is written on release, from onValueCommit. A screen reader gets two sliders, one for each axis.",
          },
          rack: {
            demo: <ReverbSpaceDemo />,
            title: "Hall Reverb space",
            code: "ReverbSpaceDemo",
            caption:
              "Decay time against high-frequency damping on Return B. Release writes the committed values via onValueCommit.",
          },
        }}
      >
        <SectionLookDemo />
      </Stage>

      <Stage
        title="Disabled"
        tier="responsive"
        code="DisabledDemo"
        caption="The disabled pad lies flat all the way through: the well and the thumb on the flat surface with hairline edges, fainter dots and crosshairs, and every word dimmed. Tab skips it and the pointer does nothing. The help text says why it is locked."
        byWorld={{ device: { demo: <LockedNoiseDemo />, code: "LockedNoiseDemo" } }}
      >
        <DisabledDemo />
      </Stage>
    </Page>
  );
}
