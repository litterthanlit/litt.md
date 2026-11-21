import { LapTimer, type LapSector } from "@/components/lap-timer";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "lap-timer",
  title: "Lap timer",
  lede: "A tabular lap clock and sector splits on a Heat slab.",
  order: 9.08,
  group: "Data",
  verbs: ["watch", "press"],
  worlds: ["heat"],
  summary:
    "A street-racing lap and sector split timer framed in Heat's striped black slab and outer ink corner brackets. It holds a tabular MM:SS.mmm clock, an overall delta in words and sign, clickable sector rows framed in amber corner brackets, and Start / Record split / Reset keys. It never starts ticking on its own until pressed. It belongs to Heat.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["lap-timer", "button", "kbd", "tag"],
  exports: ["LapTimer"],
  usage: `import { LapTimer } from "@/components/lap-timer";

<LapTimer
  track="Camden Beach sprint"
  lap={3}
  totalLaps={5}
/>`,
  use: [
    "Live lap timing, sector splits, and delta comparisons in racing games, motorsport dashboards, or time-trial events under Heat.",
    "Inspecting sector-by-sector pace without cluttering the screen with charts.",
  ],
  skip: [
    "Another world's page. LapTimer uses Heat's striped slab, outer brackets, and keycap hints; it needs data-material=\"heat\" on <html>.",
    "A full leaderboard of multiple drivers. Use Table.",
    "A percentage progress bar. Use Progress.",
  ],
  keyboard: [
    [["Tab"], "Moves across the sector rows and the Start lap, Record split, and Reset buttons."],
    [["Enter", "Space"], "Selects a sector row or activates the focused timer key."],
    [["S"], "Starts or pauses the lap while focus is inside the part, like Start lap."],
    [["L"], "Records the next sector split while focus is inside the part, like Record split."],
    [["R"], "Resets to the reference lap while focus is inside the part, like Reset."],
  ],
  a11y: [
    "Starts paused with reference splits so nothing moves or counts on its own on mount.",
    "Each sector row is a native button with aria-pressed; faster and slower deltas always include a true minus or plus sign alongside color.",
    "Recording a split or resetting announces the result once in a polite status region.",
  ],
};

const CIRCUIT_SECTORS: LapSector[] = [
  { id: "S1", seconds: 21.842, delta: -0.312 },
  { id: "S2", seconds: 28.415, delta: 0.145 },
  { id: "S3", seconds: 22.091, delta: -0.198 },
];

function SprintTimerDemo() {
  return <LapTimer track="Camden Beach sprint" lap={3} totalLaps={5} className="max-w-md" />;
}

function CircuitTimerDemo() {
  return <LapTimer track="Rosewood circuit" lap={4} totalLaps={6} sectors={CIRCUIT_SECTORS} className="max-w-md" />;
}

export default function LapTimerPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      tile={<LapTimer track="Camden Beach sprint" lap={3} totalLaps={5} className="max-w-sm" />}
    >
      <Stage
        title="Sprint lap and sectors"
        tier="instant"
        code="SprintTimerDemo"
        caption="Select any sector row to snap Heat's amber corner brackets onto it, press Record split to log the next sector, or press Start lap to run the clock live."
      >
        <SprintTimerDemo />
      </Stage>
      <Stage
        title="Custom circuit splits"
        tier="instant"
        code="CircuitTimerDemo"
        caption="Pass your own sector array to inspect green faster sectors and red slower sectors side by side in tabular mono figures."
      >
        <CircuitTimerDemo />
      </Stage>
      <TryIt
        of="LapTimer"
        component={LapTimer}
        props={{ track: "Camden Beach sprint", lap: 3, totalLaps: 5, className: "max-w-md" }}
        controls={[
          { name: "track", type: "text" },
          { name: "lap", type: "number" },
          { name: "totalLaps", type: "number" },
        ]}
      />
    </Page>
  );
}
