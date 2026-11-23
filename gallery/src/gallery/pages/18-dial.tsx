import { useEffect, useState } from "react";
import { Dial } from "@/components/dial";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "dial",
  title: "Dial",
  lede: "One value on a rotary arc, turned by hand, wheel or key.",
  order: 9.05,
  group: "Selection",
  verbs: ["drag"],
  worlds: ["flat"],
  summary:
    "One setting on a 270° arc: a quiet label, a standing number, a neutral track filled along the sunset ramp, and a circular face with one ink dot that turns with your hand. Drag up or down, scroll over it, use the keys, or pick a preset to recall it smoothly. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "When a dial first enters view, the progress arc, dot and standing figure sweep once from the minimum to the starting value on Flat's expressive spring, then wait; any pointer press, wheel turn or key cancels the arrival at once. Dragging vertically moves the dial 1:1 with pointer capture while the indicator dot swells subtly on the instant tier and settles on release. Wheel turns and keyboard arrows step smoothly through detents, double-clicking resets to the default, and external preset updates recall the dial on the expressive spring while announcing committed changes once in a polite status region. Under reduced motion the arrival and spring motion are skipped completely.",
};

export const docs: PageDocs = {
  components: ["dial"],
  exports: ["Dial"],
  usage: `import { Dial } from "@/components/dial";

<Dial
  label="Reading pace"
  min={140}
  max={320}
  step={10}
  defaultValue={220}
  formatValue={(v) => \`\${v} wpm\`}
/>`,
  use: [
    "A single continuous or detented preference in a reader, post editor or personal site under Flat, such as reading pace, image warmth or spacing.",
    "A compact value control that pairs naturally with named presets that recall it smoothly.",
  ],
  skip: [
    "Another world's page. Dial is built from Flat's paper card, standing figure and sunset arc; it needs data-material=\"flat\" on <html>.",
    "A horizontal range or a two-end span. Use Slider or RangeSlider.",
    "An exact number people already know and prefer to type. Use Input.",
    "Three or four fixed options with no values between them. Use Segmented.",
  ],
  keyboard: [
    [["Tab"], "Moves focus onto or past the circular dial. A disabled dial is skipped."],
    [["ArrowUp", "ArrowRight"], "Steps the value up by one detent."],
    [["ArrowDown", "ArrowLeft"], "Steps the value down by one detent."],
    [["PageUp", "PageDown"], "Moves about a tenth of the range in whole steps."],
    [["Home", "End"], "Jumps to the minimum or maximum value."],
    [["Escape"], "Cancels an active pointer drag and restores the value where the drag started."],
  ],
  a11y: [
    "The circular dial exposes role=\"slider\" with aria-labelledby pointing to the label, aria-orientation=\"vertical\", aria-valuemin, aria-valuemax, aria-valuenow and formatted aria-valuetext.",
    "The standing figure is aria-hidden so screen readers do not repeat the number, and committed changes announce once in a polite status region.",
    "Marked data-no-drag with touch-none so vertical drags never scroll the page or move a parent sheet.",
    "Under forced colors the track, active arc, dial face and indicator dot take system borders and Highlight fills; under reduced motion all sweeps and spring recalls jump immediately.",
  ],
};

const formatWpm = (v: number) => `${v} wpm`;

const PACE_PRESETS = [
  { label: "Calm", value: 160 },
  { label: "Balanced", value: 220 },
  { label: "Lively", value: 300 },
] as const;

function ReadingPaceDemo() {
  return <Dial label="Reading pace" min={140} max={320} step={10} defaultValue={220} formatValue={formatWpm} />;
}

function WithPresetsDemo() {
  const [pace, setPace] = useState(220);

  return (
    <div className="grid w-full max-w-[248px] justify-items-center gap-3">
      <Dial
        label="Reading pace"
        min={140}
        max={320}
        step={10}
        defaultValue={220}
        value={pace}
        onValueChange={setPace}
        formatValue={formatWpm}
      />
      <div role="group" aria-label="Reading pace presets" className="flex flex-wrap justify-center gap-1">
        {PACE_PRESETS.map((preset) => {
          const active = pace === preset.value;
          return (
            <button
              key={preset.label}
              type="button"
              aria-pressed={active}
              data-part={active ? "pill" : "lettering"}
              onClick={() => setPace(preset.value)}
              className={
                "litt-target relative inline-flex h-control-sm cursor-pointer items-center rounded-pill px-3.5 text-caption select-none " +
                "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                (active
                  ? "bg-block font-title text-fg forced-colors:border-2 forced-colors:border-[Highlight]"
                  : "bg-transparent font-normal text-fg-muted hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg forced-colors:border forced-colors:border-[ButtonBorder]")
              }
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReplayDial() {
  const { reduced } = useMotionDial();
  const [pace, setPace] = useState(reduced ? 220 : 160);

  useEffect(() => {
    if (reduced) return;
    const t1 = window.setTimeout(() => setPace(300), 280);
    const t2 = window.setTimeout(() => setPace(220), 960);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reduced]);

  return (
    <Dial
      label="Reading pace"
      min={140}
      max={320}
      step={10}
      defaultValue={220}
      value={pace}
      onValueChange={setPace}
      formatValue={formatWpm}
    />
  );
}

export const study: PageStudy = {
  object: <Dial label="Reading pace" min={140} max={320} step={10} defaultValue={220} formatValue={formatWpm} />,
  parts: [
    { name: "The label", selector: "[data-part=lettering]" },
    { name: "The figure", selector: "[data-part=figure]" },
    { name: "The track", selector: "[data-part=pill]" },
    { name: "The progress arc", selector: "[data-part=mark]" },
    { name: "The dial face", selector: "[role=slider] circle[data-part=circle]" },
  ],
  states: {
    default: <Dial label="Reading pace" min={140} max={320} step={10} defaultValue={220} formatValue={formatWpm} />,
    disabled: <Dial label="Reading pace" min={140} max={320} step={10} defaultValue={220} formatValue={formatWpm} disabled />,
  },
  replay: {
    label: "Replay recall",
    caption: "Watch the dial sweep smoothly between Calm, Lively and Balanced.",
    run: () => <ReplayDial />,
  },
};

export default function DialPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<Dial label="Reading pace" min={140} max={320} step={10} defaultValue={220} formatValue={formatWpm} />}
    >
      <Stage
        title="Reading pace"
        tier="expressive"
        code="ReadingPaceDemo"
        caption="Drag vertically, scroll, or use the arrow keys; double-click to return to the default."
      >
        <ReadingPaceDemo />
      </Stage>

      <Stage
        title="With presets"
        tier="expressive"
        code="WithPresetsDemo"
        caption="Pick Calm, Balanced or Lively to recall the dial smoothly on Flat's expressive spring."
      >
        <WithPresetsDemo />
      </Stage>

      <TryIt
        of="Dial"
        component={Dial}
        props={{
          label: "Reading pace",
          min: 140,
          max: 320,
          step: 10,
          defaultValue: 220,
          disabled: false,
          formatValue: formatWpm,
        }}
        controls={[{ name: "disabled", type: "boolean" }]}
      />
    </Page>
  );
}
