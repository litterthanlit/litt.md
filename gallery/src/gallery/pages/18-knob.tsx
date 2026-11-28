import { useEffect, useRef, useState } from "react";
import { Knob, knobValue, type KnobProps } from "@/components/knob";
import { Segmented } from "@/components/segmented";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "knob",
  title: "Knob",
  lede: "Presets that glide into place.",
  order: 1.0012,
  group: "Tools",
  verbs: ["drag", "select"],
  worlds: ["flat"],
  summary:
    "A detented control as a pill slider on white paper, for a value a preset recalls: its name and the value as a figure over a grey track with an ink fill and a paper thumb. Values keep their detents, a frequency keeps its log taper, and a gain fills out from the centre. A recalled value glides into place; the hand's lands at once. It belongs to Flat.",
  tiers: ["instant", "responsive"],
  mechanism:
    "A value set from outside, a preset recalled, glides there on the responsive spring, the thumb by a transform and the fill by a clip, and the knob says when it lands. The hand's value lands on the nearest detent at once. A press shrinks the thumb a little. Under reduced motion every value lands at once.",
};

export const docs: PageDocs = {
  components: ["knob"],
  exports: ["Knob"],
  usage: `import { Knob } from "@/components/knob";

<Knob label="Tone" min={200} max={8000} detents={24} taper="log" value={tone} onValueChange={setTone}
  format={(v) => (v >= 1000 ? (v / 1000).toFixed(1) + " kHz" : Math.round(v) + " Hz")} />`,
  use: [
    "An audio or a visual tool's parameters, where a preset sets several at once and a hand fine-tunes one.",
    "A value in whole steps on a taper: a frequency (log), a gain that cuts and boosts (bipolar), a mix in percent.",
  ],
  skip: [
    "Another world's page. Knob belongs to Flat's white paper and pill track, and needs data-material=\"flat\" on <html>.",
    "A plain setting with no detents or preset. Use a slider.",
  ],
  keyboard: [
    [["←", "→", "↑", "↓"], "Moves a detent."],
    [["Page Up", "Page Down"], "Moves a tenth of the detents."],
    [["Home", "End"], "Goes to the ends."],
  ],
  a11y: [
    "Each knob is a slider named by its label, its value said in its own words (\"4.2 kHz\", \"+6 dB\").",
    "The preset is a radio group; loading or editing it is said once in a polite status.",
    "Under reduced motion every value lands at once.",
  ],
};

type Param = Omit<KnobProps, "value" | "defaultValue" | "onValueChange" | "onSettle" | "className"> & { key: "gain" | "tone" | "mix" };
const PARAMS: Param[] = [
  { key: "gain", label: "Gain", min: -12, max: 12, detents: 24, bipolar: true, format: (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(Math.round(v)) + " dB" },
  { key: "tone", label: "Tone", min: 200, max: 8000, detents: 24, taper: "log", format: (v) => (v >= 1000 ? (v / 1000).toFixed(1) + " kHz" : Math.round(v) + " Hz") },
  { key: "mix", label: "Mix", min: 0, max: 100, detents: 20, format: (v) => Math.round(v) + "%" },
];
type Preset = "voice" | "music";
const PRESETS: Record<Preset, { name: string; at: Record<Param["key"], number> }> = {
  voice: { name: "Voice", at: { gain: 18, tone: 16, mix: 8 } },
  music: { name: "Music", at: { gain: 9, tone: 8, mix: 15 } },
};
const STAGGER = 120;
const valuesOf = (preset: Preset) => Object.fromEntries(PARAMS.map((p) => [p.key, knobValue(PRESETS[preset].at[p.key], p)])) as Record<Param["key"], number>;

/** Scene recall: a preset over three knobs; picking one glides each knob to it in turn, and a hand edits it. */
function PresetPanel({ cycle = 0 }: { cycle?: number }) {
  const { reduced } = useMotionDial();
  const [preset, setPreset] = useState<Preset>("voice");
  const [values, setValues] = useState(() => valuesOf("voice"));
  const [status, setStatus] = useState<"Moving" | "Loaded" | "Edited">("Loaded");
  const [said, setSaid] = useState("");
  const moving = useRef(new Set<string>());
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const recall = (next: Preset) => {
    timers.current.forEach((t) => window.clearTimeout(t));
    const target = valuesOf(next);
    const keys = PARAMS.map((p) => p.key).filter((k) => values[k] !== target[k]);
    setPreset(next);
    moving.current = new Set(keys);
    setStatus(keys.length ? "Moving" : "Loaded");
    if (!keys.length) setSaid(`${PRESETS[next].name} preset loaded`);
    timers.current = keys.map((k, i) => window.setTimeout(() => setValues((v) => ({ ...v, [k]: target[k] })), reduced ? 0 : i * STAGGER));
  };
  const settled = (key: string) => {
    if (!moving.current.delete(key) || moving.current.size) return;
    setStatus("Loaded");
    setSaid(`${PRESETS[preset].name} preset loaded`);
  };

  /* The wall's self-run compares the two presets. */
  useEffect(() => {
    if (cycle) recall(cycle % 2 ? "music" : "voice");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle]);

  return (
    <div className="litt-paper grid w-full max-w-sm gap-5 rounded-surface bg-surface-1 p-5 text-fg">
      <div className="flex items-center justify-between gap-3">
        <Segmented
          legend="Preset"
          size="sm"
          value={preset}
          onValueChange={(v) => recall(v)}
          options={[
            { value: "voice", label: "Voice" },
            { value: "music", label: "Music" },
          ]}
        />
        <span aria-hidden="true" className="text-small whitespace-nowrap text-fg-muted">
          {status}
        </span>
      </div>
      <div className="grid gap-3.5">
        {PARAMS.map(({ key, ...p }) => (
          <Knob
            key={key}
            {...p}
            value={values[key]}
            onSettle={() => settled(key)}
            onValueChange={(v) => {
              moving.current.delete(key);
              setValues((was) => ({ ...was, [key]: v }));
              if (status !== "Edited") {
                setStatus("Edited");
                setSaid("Preset edited");
              }
            }}
          />
        ))}
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}

function PresetDemo() {
  return <PresetPanel />;
}

/** On Flat's wall it compares the two presets by itself until a hand arrives. */
function PresetTile() {
  const [n, setN] = useState(0);
  const run = useSelfRun((i) => setN(i + 1), { every: 2600, first: 600 });
  return (
    <div ref={run.ref} className="grid w-full justify-items-center">
      <PresetPanel cycle={n} />
    </div>
  );
}

export default function KnobPage() {
  return (
    <Page meta={meta} docs={docs} tile={<PresetTile />}>
      <Stage
        title="Scene recall"
        tier="responsive"
        code="PresetDemo"
        caption="Pick Voice or Music and each knob glides to the preset in turn, a beat apart, then the panel says it is loaded. Take a knob and the preset reads Edited: Gain fills out from the centre, Tone moves on a log taper, Mix in steps of five."
      >
        <PresetDemo />
      </Stage>

      <TryIt of="Knob" component={Knob} props={{ label: "Mix", min: 0, max: 100, detents: 20, defaultValue: 40 }} controls={["label", "bipolar"]} />
    </Page>
  );
}
