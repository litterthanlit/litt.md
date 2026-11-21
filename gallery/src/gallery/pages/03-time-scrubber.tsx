import { useMemo, useState } from "react";
import { LogView, type LogLine } from "@/components/log-view";
import { TimeScrubber, type TimeScrubberMark } from "@/components/time-scrubber";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "time-scrubber",
  title: "Time scrubber",
  lede: "A moment in a run, found by dragging its ruler.",
  order: 4.04,
  group: "Tools",
  verbs: ["drag", "press"],
  summary:
    "A ruler of time that moves under a fixed marker, with what happened along the run marked on it in its status color. Drag it and it follows one to one; let go and it settles on the nearest step, or on an event let go near, on the responsive tier. In fun mode a flick coasts it to the event its speed reaches. Page Up and Page Down go from event to event.",
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


/* ---------- Device's own (plans/024, phase 3): a take's event log, and a day of takes ---------- */
/** A time in a take on the ruler, in seconds with its unit; the log keeps the recorder's clock. */
const seconds = (s: number) => `${s} s`;

/* An interview recorded by a road: what the recorder logged while take_04 ran. */
const TAKE: (LogLine & { at: number })[] = [
  { at: 0, time: "00M 00S 00F", text: "REC take_04.wav · 48 kHz · 24 bit" },
  { at: 0.4, time: "00M 00S 10F", text: "Input 1, lavalier, at −18 dB" },
  { at: 6.2, time: "00M 06S 05F", text: "Marker 1: first question" },
  { at: 12.1, time: "00M 12S 03F", text: "Low cut on input 2 at 80 Hz, for the wind" },
  { at: 18.7, time: "00M 18S 18F", text: "Marker 2: the answer" },
  { at: 31, time: "00M 31S 00F", level: "error", text: "Input 1 clipped at 0 dB" },
  { at: 31.2, time: "00M 31S 05F", text: "Safety track, 12 dB lower, kept the peak" },
  { at: 39.5, time: "00M 39S 13F", text: "Marker 3: room tone" },
  { at: 44.8, time: "00M 44S 20F", text: "Stop" },
  { at: 47.3, time: "00M 47S 08F", text: "Saved take_04.wav to card A · 13 MB" },
];

const TAKE_MARKS: TimeScrubberMark[] = [
  { at: 6.2, label: "Marker 1" },
  { at: 18.7, label: "Marker 2" },
  { at: 31, label: "Input 1 clipped", tone: "danger" },
  { at: 39.5, label: "Marker 3" },
  { at: 44.8, label: "Stop" },
];

function TakeLogDemo() {
  const [at, setAt] = useState(48);
  const lines = useMemo(() => TAKE.filter((l) => l.at <= at), [at]);
  return (
    <div className="grid w-full max-w-xl gap-4">
      <TimeScrubber label="take_04" max={48} value={at} onValueChange={setAt} formatValue={seconds} marks={TAKE_MARKS} />
      <LogView label="take_04's log, replayed" height="14rem" lines={lines} />
    </div>
  );
}

/* A day of takes, in quarter hours. */
const TAKES_TODAY: TimeScrubberMark[] = [
  { at: 9.25, label: "take_01" },
  { at: 10.5, label: "take_02" },
  { at: 13.75, label: "take_03, clipped", tone: "danger" },
  { at: 14, label: "take_04" },
  { at: 16.5, label: "take_05" },
];

function TakesTodayDemo() {
  return (
    <div className="grid w-full max-w-xl gap-6">
      <TimeScrubber label="Takes today" min={8} max={19} step={0.25} majorEvery={4} defaultValue={13.75} formatValue={clock} marks={TAKES_TODAY} />
      <TimeScrubber label="take_03, on card B" max={48} defaultValue={31} formatValue={seconds} marks={TAKE_MARKS} disabled />
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): replay the sending of an issue ---------- */

const SENDING: (LogLine & { at: number })[] = [
  { at: 0, time: "+0.0s", text: "Issue 14, the last of the spring series, to 412 subscribers" },
  { at: 1.6, time: "+1.6s", text: "Made the web copy at example.com/letter/14" },
  { at: 3.2, time: "+3.2s", level: "warn", text: "Picture 3 is 6.2 MB; it will go out smaller." },
  { at: 6.4, time: "+6.4s", text: "Sending, 100 at a time" },
  { at: 14.8, time: "+14.8s", text: "Sent 200 of 412" },
  { at: 22.5, time: "+22.5s", level: "error", text: "3 addresses bounced: the mailbox is full or gone" },
  { at: 22.7, time: "+22.7s", text: "Will try the full mailboxes again tomorrow" },
  { at: 31.4, time: "+31.4s", text: "Sent 409 of 412" },
  { at: 33, time: "+33.0s", level: "success", text: "Issue 14 sent" },
  { at: 47.6, time: "+47.6s", level: "success", text: "First reply, from Mara Lindqvist" },
];

const SENDING_MARKS: TimeScrubberMark[] = [
  { at: 3.2, label: "Picture 3 is 6.2 MB", tone: "warning" },
  { at: 22.5, label: "3 addresses bounced", tone: "danger" },
  { at: 33, label: "Issue 14 sent", tone: "success" },
  { at: 47.6, label: "First reply", tone: "success" },
];

function SendingLogDemo() {
  const [at, setAt] = useState(48);
  const lines = useMemo(() => SENDING.filter((l) => l.at <= at), [at]);
  return (
    <div className="grid w-full max-w-xl gap-4">
      <TimeScrubber label="Issue 14" max={48} value={at} onValueChange={setAt} formatValue={(s) => `+${s}s`} marks={SENDING_MARKS} />
      <LogView label="Sending issue 14, replayed" height="14rem" lines={lines} />
    </div>
  );
}

/* ---------- Rack's own (proposals/rack.md): arrangement playhead scrubbing bars & cue markers ---------- */

const CUE_LOG: (LogLine & { at: number })[] = [
  { at: 1, time: "Bar 1", text: "Intro · Percussion pulse enters at 124 BPM" },
  { at: 9, time: "Bar 9", text: "Verse · Bass sub pulse locked to grid" },
  { at: 17, time: "Bar 17", text: "Build · Synth low-pass filter sweep opens" },
  { at: 25, time: "Bar 25", level: "warn", text: "Drop · Full drum kit & acid bass line" },
  { at: 41, time: "Bar 41", text: "Break · Keys Rhodes VII solo + Dub Echo" },
  { at: 49, time: "Bar 49", level: "success", text: "Outro · Master bus fade out complete" },
];

const CUE_MARKS: TimeScrubberMark[] = [
  { at: 9, label: "Verse" },
  { at: 25, label: "Drop", tone: "warning" },
  { at: 41, label: "Break" },
  { at: 49, label: "Outro", tone: "success" },
];

function ArrangementPlayheadDemo() {
  const [bar, setBar] = useState(25);
  const lines = useMemo(() => CUE_LOG.filter((l) => l.at <= bar), [bar]);
  return (
    <div className="grid w-full max-w-xl gap-4">
      <TimeScrubber
        label="Ghost town · Arrangement"
        min={1}
        max={57}
        step={1}
        majorEvery={8}
        value={bar}
        onValueChange={setBar}
        formatValue={(b) => `Bar ${b}`}
        marks={CUE_MARKS}
      />
      <LogView label="Arrangement cue markers" height="14rem" lines={lines} />
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
        byWorld={{
          flat: {
            demo: <SendingLogDemo />,
            title: "Replay a sent issue",
            code: "SendingLogDemo",
            caption:
              "Drag the ruler and the log shows the sending of issue 14 up to the needle. It follows the pointer one to one; let go and it settles on the nearest second, or on an event let go within half a step of it, on the responsive tier. Press the ruler to go to the time under the pointer. Tab to it, then Page Up and Page Down go from the large picture to the bounces to the send and the first reply.",
          },
          device: {
            demo: <TakeLogDemo />,
            title: "Replay a take's log",
            code: "TakeLogDemo",
            caption:
              "Drag the ruler and the log shows what the recorder wrote while the take ran, up to the needle. It follows the pointer one to one; let go and it settles on the nearest second, or on an event let go within half a step of it, on the responsive tier. Press the ruler to go to the time under the pointer. Tab to it, then Page Up and Page Down go from marker to marker, and to the clip.",
          },
          rack: {
            demo: <ArrangementPlayheadDemo />,
            title: "Arrangement playhead",
            code: "ArrangementPlayheadDemo",
            caption:
              "Scrub the playhead across bars 1 to 57 of Ghost town. Page Up and Page Down jump cleanly between arrangement cue markers: Verse, Drop, Break, and Outro.",
          },
        }}
      >
        <ReplayDemo />
      </Stage>

      <Stage
        title="A day, and disabled"
        tier="responsive"
        align="start"
        code="DayDemo"
        caption="Any units: here hours, in quarter-hour steps with a labelled tick every hour, formatted as a clock. Events are marked in their status color, neutral in fg-muted; the needle is the slider's cap, never a color, and an event it lands on slides under it while the label row names it. Disabled lies flat, the well and the cap alike, is skipped by Tab and ignores the pointer."
        byWorld={{
          device: {
            demo: <TakesTodayDemo />,
            title: "A day of takes, and disabled",
            code: "TakesTodayDemo",
            caption:
              "Any units: here hours, in quarter-hour steps with a labelled tick every hour, formatted as a clock. A take is marked in the ink, and the one that clipped in red, as a fault; the needle is the slider's cap, never a colour, and a take it lands on slides under it while the label row names it. Disabled lies flat, the well and the cap alike, is skipped by Tab and ignores the pointer.",
          },
        }}
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
