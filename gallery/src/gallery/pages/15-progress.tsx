import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Progress } from "@/components/progress";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "progress",
  title: "Progress",
  lede: "How far along the work is, while it happens.",
  ledeByWorld: { heat: "How far along the work is, as dashes that light as it goes." },
  order: 8.02,
  group: "Feedback",
  worlds: ["press", "device", "plain", "rack", "heat"],
  verbs: ["watch"],
  summary:
    "A slot cut into the page for work that is happening now, such as an upload or an import: the label and a reading above it, the done part in the foreground, filling the channel under its walls on the instant tier. It ends done or failed, said in words and announced once. With no value yet the slot stays empty: nothing sweeps, pulses or shimmers.",
  summaryByWorld: {
    flat: "A rounded channel on the grey for work that is happening now, such as an upload or an import: the label and a reading above it, and the done part filling it in the ink, one fill, on the instant tier. It ends done or failed, said in words and announced once. With no value yet the channel stays empty: nothing sweeps, pulses or shimmers.",
    heat: "A row of dashes in a flat channel for work that is happening now, such as an upload or an import: the label and a reading above it, and each dash lighting once its share is done, on the instant tier. It ends done or failed, said in words and announced once. With no value yet no dash is lit: nothing sweeps, pulses or shimmers.",
  },
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["progress"],
  exports: ["Progress"],
  usage: `import { Progress } from "@/components/progress";

<Progress label="Uploading brief.pdf" value={3.2} max={8} valueText="3.2 of 8 MB" />

// It ends in words: done fills the slot, failed keeps the fill where it stopped.
<Progress label="Importing pages" status="failed" value={412} max={1204} message="The export file ends early. Export it again." />`,
  use: [
    "Work the person started and is waiting on, with a known end: an upload, an import, a build with counted steps.",
    "A row in a list of uploads, with the name already in the row (hideLabel).",
  ],
  skip: [
    "A quantity against a limit that does not move while you watch, such as storage used. That is a Meter (chart).",
    "A wait with no end in sight. Put the loading state on the button that started it.",
    "Steps of a flow the person moves through. That is Steps.",
  ],
  a11y: [
    "role=\"progressbar\", named by the label, with aria-valuenow while the value is known and the reading as aria-valuetext.",
    "Done and failed are announced once in a polite status, so a long wait need not be watched.",
    "The message under the slot describes it (aria-describedby), so a failure's reason is read with the bar.",
    "Status is said in words, never by the fill's color alone: failed is red and says Failed.",
    "Under reduced motion the fill jumps to each new value.",
  ],
};

const MB = 8;

/** A pretend upload: a few hundred kB at a time, unevenly, as a real one goes. */
function UploadDemo() {
  const [run, setRun] = useState(0);
  const [sent, setSent] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!run) return;
    setSent(undefined);
    let at = 0;
    const steps = [0.4, 0.9, 0.3, 1.1, 0.7, 1.4, 0.6, 1.2, 0.9, 0.5];
    let i = 0;
    const tick = () => {
      at = Math.min(MB, at + steps[i++ % steps.length]!);
      setSent(at);
      if (at < MB) timer = window.setTimeout(tick, 280);
    };
    let timer = window.setTimeout(tick, 600); // a moment before the first byte, while the value is not known
    return () => window.clearTimeout(timer);
  }, [run]);

  const done = sent !== undefined && sent >= MB;
  return (
    <div className="grid w-full max-w-sm gap-6">
      <Progress
        label="Uploading brief.pdf"
        value={run ? sent : 0}
        max={MB}
        valueText={run && sent !== undefined ? `${sent.toFixed(1)} of ${MB} MB` : run ? "Waiting" : `0 of ${MB} MB`}
        status={done ? "done" : "active"}
        message={done ? "brief.pdf is in the project." : run ? `About ${Math.max(1, Math.ceil(((MB - (sent ?? 0)) / 0.8) * 0.28))} s left` : "Press Upload to start."}
      />
      <Button size="sm" className="justify-self-start" disabled={!!run && !done} onClick={() => setRun((r) => r + 1)}>
        {run ? "Upload again" : "Upload"}
      </Button>
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="grid w-full max-w-sm gap-8">
      <Progress label="Preparing export" message="Counting the pages first." />
      <Progress label="Importing pages" value={412} max={1204} valueText="412 of 1,204" />
      <Progress label="Importing pages" value={1204} max={1204} status="done" />
      <Progress label="Importing pages" value={412} max={1204} status="failed" message="The export file ends early. Export it again, then import it." />
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): a picture going up to a post ---------- */

function PictureUploadDemo() {
  const [run, setRun] = useState(0);
  const [sent, setSent] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!run) return;
    setSent(undefined);
    let at = 0;
    const steps = [0.4, 0.9, 0.3, 1.1, 0.7, 1.4, 0.6, 1.2, 0.9, 0.5];
    let i = 0;
    const tick = () => {
      at = Math.min(MB, at + steps[i++ % steps.length]!);
      setSent(at);
      if (at < MB) timer = window.setTimeout(tick, 280);
    };
    let timer = window.setTimeout(tick, 600); // a moment before the first byte, while the value is not known
    return () => window.clearTimeout(timer);
  }, [run]);

  const done = sent !== undefined && sent >= MB;
  return (
    <div className="grid w-full max-w-sm gap-6">
      <Progress
        label="Uploading open-water.jpg"
        value={run ? sent : 0}
        max={MB}
        valueText={run && sent !== undefined ? `${sent.toFixed(1)} of ${MB} MB` : run ? "Waiting" : `0 of ${MB} MB`}
        status={done ? "done" : "active"}
        message={done ? "open-water.jpg is in the post." : run ? `About ${Math.max(1, Math.ceil(((MB - (sent ?? 0)) / 0.8) * 0.28))} s left` : "Press Upload to start."}
      />
      <Button size="sm" className="justify-self-start" disabled={!!run && !done} onClick={() => setRun((r) => r + 1)}>
        {run ? "Upload again" : "Upload"}
      </Button>
    </div>
  );
}

/* ---------- Flat's own: a series of pictures, filled in the ink ---------- */

const PICTURES = 12;

/** A series filling up, a picture at a time: each one done lights its segment in the ink. */
function SpringSeriesDemo() {
  const [done, setDone] = useState(7);
  const full = done >= PICTURES;
  return (
    <div className="grid w-full max-w-sm gap-6">
      <Progress
        label="Spring series"
        value={done}
        max={PICTURES}
        segments={PICTURES}
        valueText={`${done} of ${PICTURES} pictures`}
        status={full ? "done" : "active"}
        message={full ? "All twelve are in. The series is ready to post." : "Twelve pictures from the coast."}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={full} onClick={() => setDone((d) => Math.min(PICTURES, d + 1))}>
          Add a picture
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDone(7)}>
          Reset
        </Button>
      </div>
    </div>
  );
}

/** Flat's states: a picture going up fills in the ink, a series lights segment by segment, failed keeps danger. */
function FlatStatesDemo() {
  return (
    <div className="grid w-full max-w-sm gap-8">
      <PictureUploadDemo />
      <Progress label="Uploading dusk-tide.jpg" message="Waiting for the first bytes." />
      <Progress label="Uploading sprig.jpg" value={2.4} max={8} valueText="2.4 of 8 MB" />
      <Progress label="Uploading silk.jpg" value={6.8} max={8} valueText="6.8 of 8 MB" />
      <Progress label="Spring series" value={3} max={12} segments={12} valueText="3 of 12 pictures" />
      <Progress label="Spring series" value={12} max={12} segments={12} status="done" />
      <Progress label="Uploading red-sun.jpg" value={3.1} max={8} status="failed" message="The connection dropped. Try it again." />
    </div>
  );
}

/* ---------- Heat's own (proposals/heat.md): pursuit cooldown and race milestones ---------- */

const COOLDOWN_STEPS = 16;

function PursuitCooldownDemo() {
  const [done, setDone] = useState(10);
  const full = done >= COOLDOWN_STEPS;
  return (
    <div className="grid w-full max-w-sm gap-6">
      <Progress
        label="Pursuit cooldown"
        value={done}
        max={COOLDOWN_STEPS}
        valueText={`${Math.round((done / COOLDOWN_STEPS) * 100)}%`}
        status={full ? "done" : "active"}
        message={full ? "Pursuit evaded. 142,500 bounty banked." : "Stay hidden in the cooldown zone."}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={full} onClick={() => setDone((d) => Math.min(COOLDOWN_STEPS, d + 2))}>
          Hold cover
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDone(10)}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function HeatStatesDemo() {
  return (
    <div className="grid w-full max-w-sm gap-8">
      <Progress label="Searching for lobby" message="Waiting for drivers on the grid." />
      <Progress label="Nitrous recharge" value={11} max={16} valueText="69%" />
      <Progress label="Blacklist #4 milestones" value={16} max={16} status="done" />
      <Progress label="Pursuit evade" value={7} max={16} status="failed" message="Boxed in by federal units. Condition ×4 busted." />
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="An upload"
        tier="instant"
        align="start"
        code="UploadDemo"
        byWorld={{
          flat: {
            demo: <SpringSeriesDemo />,
            title: "A series, a picture at a time",
            code: "SpringSeriesDemo",
            caption:
              "Press Add a picture. Each picture done lights its segment in the ink, the same ink for every one, so the series reads as one fill growing. A segment lights with a color fade on the instant tier, at once under reduced motion. The reading says the count in words, and at twelve it says Done.",
          },
          heat: {
            demo: <PursuitCooldownDemo />,
            title: "Pursuit cooldown",
            code: "PursuitCooldownDemo",
            caption:
              "Under Heat, Progress draws sixteen crisp dashes in a flat square channel, lighting amber as cooldown fills to 100% and cutting to Done once evaded.",
          },
        }}
        caption="Press Upload. For a moment nothing is known, so the slot is empty and the reading says Waiting; then it fills as the bytes go, a transform on the instant tier, and the reading counts in tabular figures. The fill sits down in the channel: the top wall's shade and the lit lower wall are drawn over it. At the end the slot is full, the reading says Done, and a screen reader hears it once."
      >
        <UploadDemo />
      </Stage>

      <Stage
        title="Every state"
        tier="instant"
        align="start"
        code="StatesDemo"
        byWorld={{
          flat: {
            demo: <FlatStatesDemo />,
            title: "A picture going up, and every state",
            code: "FlatStatesDemo",
            caption:
              "Press Upload: the fill is the ink, one band that grows as the bytes go, never a gradient or a step of grey. A series lights segment by segment in the same ink. Waiting is an empty slot and a word. Failed keeps the ink where it stopped and says Failed in the danger color, since in Flat danger is a word, never a fill.",
          },
          heat: {
            demo: <HeatStatesDemo />,
            title: "Lobby, nitrous, milestones and busted",
            code: "HeatStatesDemo",
            caption:
              "Waiting keeps all sixteen dashes unlit. Active and done light amber across the dark channel; failed switches the filled dashes to brake-red danger and says Failed in words.",
          },
        }}
        caption="Waiting, running, done and failed. Waiting is an empty slot and a word, with nothing moving. Failed keeps the fill where it stopped, in the danger color, says Failed, and the message says what to do."
      >
        <StatesDemo />
      </Stage>

      <TryIt of="Progress" component={Progress} props={{ label: "Uploading brief.pdf", value: 40, message: "About 20 s left", className: "w-full max-w-sm" }} controls={["label", "value", "status", "message", "hideLabel"]} />
    </Page>
  );
}
