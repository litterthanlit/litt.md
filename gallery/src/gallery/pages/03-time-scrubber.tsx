import { useMemo, useState } from "react";
import { LogView, type LogLine } from "@/components/log-view";
import { TimeScrubber, type TimeScrubberMark } from "@/components/time-scrubber";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "time-scrubber",
  title: "Time scrubber",
  lede: "A moment in a run, found by dragging its ruler.",
  order: 3.97,
  group: "Controls",
  verbs: ["drag", "press"],
  summary:
    "A ruler of time in a well you reach into, sliding under a fixed cap, with what happened along the run marked on it in its status color. Drag it and it follows one to one; let go and it settles on the nearest step, or on an event let go near, on the responsive tier. In fun mode it can be thrown, and coasts to the event its speed reaches. Page Up and Page Down go from event to event.",
  fun: "Throw the ruler: it coasts as far as your speed carries it and lands on the event nearest there.",
  tiers: ["responsive"],
};

export const docs: PageDocs = {
  components: ["time-scrubber"],
  exports: ["TimeScrubber"],
  usage: `import { TimeScrubber } from "@/components/time-scrubber";

const [at, setAt] = useState(48);

<TimeScrubber
  label="Replay"
  max={48}
  value={at}
  onValueChange={setAt}
  formatValue={(s) => \`+\${s}s\`}
  marks={[
    { at: 12.1, label: "Image is 2.4 MB", tone: "warning" },
    { at: 31, label: "Module not found", tone: "danger" },
  ]}
/>`,
  use: [
    "Going back through something that ran: a build's log, a deploy's steps, an agent's run, a session recording.",
    "A run long enough that its events are worth finding by eye, on a ruler, before reading them.",
    "A playhead for a timeline someone reviews, where the moments that matter are known and marked.",
  ],
  skip: [
    "A setting. A value that stays is a Slider or a Number field.",
    "Picking a date or a time of day for later. That is the Date picker.",
    "A short run with a handful of lines. Show them all.",
  ],
  keyboard: [
    [["Tab"], "Moves focus to the ruler."],
    [["←", "→"], "Moves one step, or ten with Shift."],
    [["Page Up", "Page Down"], "Goes to the next or previous event, or ten steps when there are none."],
    [["Home", "End"], "Goes to the start or the end of the run."],
  ],
  a11y: [
    "The ruler is a slider named by the label. Its value is the time, and aria-valuetext says it in words with the event the needle is on: \"+31s, Module not found\".",
    "A hint says how to move between events, so the marks are reachable without seeing them.",
    "Events are marked in their status color, and the label beside the reading says what each one is, so color is never alone.",
    "Under reduced motion the ruler jumps to where it settles.",
  ],
};

/* A build that failed, then a retry that went live: what replaying it shows. */
const RUN: (LogLine & { at: number })[] = [
  { at: 0, time: "+0.0s", text: "Cloning github.com/halo-studio/site (main, 4f2c1a9)" },
  { at: 1.8, time: "+1.8s", text: "Restored build cache from the previous deploy" },
  { at: 2.4, time: "+2.4s", text: "Running npm ci" },
  { at: 9.6, time: "+9.6s", text: "added 412 packages in 7s" },
  { at: 10.2, time: "+10.2s", text: "Running npm run build" },
  { at: 12.1, time: "+12.1s", level: "warn", text: "Image is 2.4 MB; it will be served as is." },
  { at: 18.7, time: "+18.7s", text: "Compiled 38 pages" },
  { at: 31, time: "+31.0s", level: "error", text: "Module not found: Can't resolve '@fontsource/inter/400.css'" },
  { at: 31.2, time: "+31.2s", text: "Retrying with the lockfile's fonts" },
  { at: 39.5, time: "+39.5s", text: "Compiled 38 pages" },
  { at: 44.8, time: "+44.8s", level: "success", text: "Build completed" },
  { at: 47.3, time: "+47.3s", level: "success", text: "Deployed to halo.studio" },
];

const RUN_MARKS: TimeScrubberMark[] = [
  { at: 12.1, label: "Image is 2.4 MB", tone: "warning" },
  { at: 31, label: "Module not found", tone: "danger" },
  { at: 44.8, label: "Build completed", tone: "success" },
  { at: 47.3, label: "Deployed", tone: "success" },
];

function ReplayDemo() {
  const [at, setAt] = useState(48);
  const lines = useMemo(() => RUN.filter((l) => l.at <= at), [at]);
  return (
    <div className="grid w-full max-w-xl gap-4">
      <TimeScrubber label="Replay" max={48} value={at} onValueChange={setAt} formatValue={(s) => `+${s}s`} marks={RUN_MARKS} />
      <LogView label="Build log, replayed" height="14rem" lines={lines} />
    </div>
  );
}

/* A studio's day of deploys, in quarter hours. */
const DAY: TimeScrubberMark[] = [
  { at: 9.25, label: "Halo, preview" },
  { at: 10.5, label: "Marlow Labs, live", tone: "success" },
  { at: 13.75, label: "Atelier Nord, failed", tone: "danger" },
  { at: 14, label: "Atelier Nord, live", tone: "success" },
  { at: 16.5, label: "Grotta Type, preview" },
];

const clock = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

function DayDemo() {
  return (
    <div className="grid w-full max-w-xl gap-6">
      <TimeScrubber label="Deploys today" min={8} max={19} step={0.25} majorEvery={4} defaultValue={13.75} formatValue={clock} marks={DAY} />
      <TimeScrubber label="Archived run" max={48} defaultValue={31} formatValue={(s) => `+${s}s`} marks={RUN_MARKS} disabled />
    </div>
  );
}

export default function TimeScrubberPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Replay a build"
        tier="responsive"
        align="start"
        code="ReplayDemo"
        caption="Drag the ruler and the log shows the run up to the needle. It follows the pointer one to one; let go and it settles on the nearest second, or on an event let go within half a step of it, on the responsive tier. Press the ruler to go to the time under the pointer. Tab to it, then Page Up and Page Down go from the warning to the failure to the deploy."
      >
        <ReplayDemo />
      </Stage>

      <Stage
        title="A day, and disabled"
        tier="responsive"
        align="start"
        code="DayDemo"
        caption="Any units: here hours, in quarter-hour steps with a labelled tick every hour, formatted as a clock. Events are marked in their status color, neutral in fg-muted; the needle is the slider's cap, never a color, and an event it lands on slides under it while the label row names it. Disabled lies flat, the well and the cap alike, is skipped by Tab and ignores the pointer."
      >
        <DayDemo />
      </Stage>

      <TryIt
        of="TimeScrubber"
        component={TimeScrubber}
        props={{ label: "Replay", max: 48, defaultValue: 24, marks: RUN_MARKS, formatValue: (s: number) => `+${s}s`, className: "w-full max-w-xl" }}
        controls={["label", { name: "step", type: "number", min: 0.5, max: 4, step: 0.5 }, { name: "majorEvery", type: "number", min: 2, max: 10 }, "disabled"]}
      />
    </Page>
  );
}
