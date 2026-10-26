import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Progress } from "@/components/progress";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "progress",
  title: "Progress",
  lede: "How far along the work is, while it happens.",
  order: 15.42,
  group: "Layout",
  verbs: ["watch"],
  summary:
    "A slot cut into the page for work that is happening now, such as an upload or an import: the label and a reading above it, the done part in the foreground, filling the channel under its walls on the instant tier. It ends done or failed, said in words and announced once. With no value yet the slot stays empty: nothing sweeps, pulses or shimmers.",
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

export default function ProgressPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="An upload"
        tier="instant"
        align="start"
        code="UploadDemo"
        caption="Press Upload. For a moment nothing is known, so the slot is empty and the reading says Waiting; then it fills as the bytes go, a transform on the instant tier, and the reading counts in tabular figures. The fill sits down in the channel: the top wall's shade and the lit lower wall are drawn over it. At the end the slot is full, the reading says Done, and a screen reader hears it once."
      >
        <UploadDemo />
      </Stage>

      <Stage
        title="Every state"
        tier="instant"
        align="start"
        code="StatesDemo"
        caption="Waiting, running, done and failed. Waiting is an empty slot and a word, with nothing moving. Failed keeps the fill where it stopped, in the danger color, says Failed, and the message says what to do."
      >
        <StatesDemo />
      </Stage>

      <TryIt of="Progress" component={Progress} props={{ label: "Uploading brief.pdf", value: 40, message: "About 20 s left", className: "w-full max-w-sm" }} controls={["label", "value", "status", "message", "hideLabel"]} />
    </Page>
  );
}
