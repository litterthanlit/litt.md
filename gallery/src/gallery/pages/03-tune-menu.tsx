import { TuneMenu, type TuneParameter } from "@/components/tune-menu";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "tune-menu",
  title: "Tune menu",
  lede: "A keyboard-driven racing settings and performance tuning slab.",
  order: 3.09,
  group: "Selection",
  verbs: ["select", "drag"],
  worlds: ["heat"],
  summary:
    "The classic street-racing menu slab: banded top and bottom with diagonal hazard stripes, framed by outer corner brackets, with rows driven by arrow keys or pointer drag. The active row snaps four 8px amber corner brackets around itself, lights its label in amber, and flanks its dashed balance bar or preset cycler with ‹ › chevrons. It belongs to Heat.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["tune-menu", "button", "kbd"],
  exports: ["TuneMenu"],
  usage: `import { TuneMenu } from "@/components/tune-menu";

<TuneMenu title="Performance tuning" />`,
  use: [
    "Keyboard-first vehicle tuning, audio mixers, or game settings menus under Heat.",
    "Mixing bipolar balance bars (−5 to +5), stepped level bars (0 to 10), and preset cyclers inside one cohesive racing menu.",
  ],
  skip: [
    "Another world's page. TuneMenu is built specifically around Heat's bracketed street-racing menu grammar and needs data-material=\"heat\" on <html>.",
    "A single standalone range control in a form. Use Slider.",
    "A dropdown list of many choices. Use Select.",
  ],
  keyboard: [
    [["Tab"], "Moves focus into the active tuning row, then to the Defaults reset button."],
    [["↑", "↓"], "Moves between tuning rows with roving focus."],
    [["←", "→"], "Steps the active dash bar down or up, or cycles the active preset."],
    [["Home", "End"], "Jumps the active parameter to its minimum or maximum value."],
  ],
  a11y: [
    "Each row's control carries role=\"slider\" with roving tabindex, aria-labelledby, aria-valuemin, aria-valuemax, aria-valuenow and descriptive aria-valuetext.",
    "Chevrons are pointer shortcuts excluded from tab order so keyboard users never step through extra stops.",
    "Every change and reset announces the new value once in a polite status region.",
  ],
};

const AUDIO_PARAMS: TuneParameter[] = [
  { id: "engine", label: "Engine", kind: "level", min: 0, max: 10, defaultValue: 9 },
  { id: "sfx", label: "Sound effects", kind: "level", min: 0, max: 10, defaultValue: 8 },
  { id: "music", label: "EA Trax", kind: "level", min: 0, max: 10, defaultValue: 7 },
  { id: "mode", label: "Audio mix", kind: "choice", options: ["Mono", "Stereo", "Surround"], defaultValue: 1 },
];

const TILE_PARAMS: TuneParameter[] = [
  { id: "steering", label: "Steering", kind: "level", min: -5, max: 5, defaultValue: 2, minLabel: "Soft", maxLabel: "Sharp" },
  { id: "handling", label: "Handling", kind: "level", min: -5, max: 5, defaultValue: 3, minLabel: "Drift", maxLabel: "Grip" },
  { id: "aero", label: "Aerodynamics", kind: "level", min: 0, max: 10, defaultValue: 7 },
  { id: "nitrous", label: "Nitrous", kind: "choice", options: ["Duration", "Balanced", "Power"], defaultValue: 2 },
];

function PerformanceTuneDemo() {
  return <TuneMenu title="Performance tuning" className="max-w-lg" />;
}

function AudioMenuDemo() {
  return <TuneMenu title="Audio mix" parameters={AUDIO_PARAMS} className="max-w-lg" />;
}

export default function TuneMenuPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<TuneMenu title="Performance tuning" parameters={TILE_PARAMS} className="max-w-md" />}
    >
      <Stage
        title="Performance tuning"
        tier="instant"
        code="PerformanceTuneDemo"
        caption="Move across rows with ↑ ↓ or the pointer, then tune with ← →, click ‹ › chevrons, or drag along any dash bar. Bipolar rows split around zero for balance tuning."
      >
        <PerformanceTuneDemo />
      </Stage>
      <Stage
        title="Audio settings menu"
        tier="instant"
        code="AudioMenuDemo"
        caption="Pass any mix of stepped level bars and preset cyclers to build a full street-racing settings slab."
      >
        <AudioMenuDemo />
      </Stage>
      <TryIt
        of="TuneMenu"
        component={TuneMenu}
        props={{ title: "Performance tuning", className: "max-w-lg" }}
        controls={[{ name: "title", type: "text" }]}
      />
    </Page>
  );
}
