import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { TapeProgress } from "@/components/tape-progress";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "tape-progress",
  title: "Tape progress",
  lede: "How far along the work is, as tape moving between two reels.",
  order: 15.43,
  group: "Layout",
  verbs: ["watch"],
  worlds: ["device"],
  summary:
    "Progress said as hardware: two reels in a smoked window, the supply emptying and the take-up filling by area, each turning at the pace the tape's constant speed gives its radius, and the value in words beside them as Progress says it. The record light is lit while the work runs. A change eases on a critically damped spring and nothing moves on its own. It belongs to Device.",
  tiers: ["instant"],
  mechanism:
    "The value drives a critically damped spring, so a change glides rather than steps. Each frame the loop sets the two reels' pack radii by area, the supply from what is left and the take-up from what is done, and turns each by span over K times r times the change, so the emptying reel speeds up and the filling one slows down. The tape is redrawn tangent to both packs. The loop writes properties and an attribute, never React state, and stops when the spring settles. Reduced motion jumps to each value.",
};

export const docs: PageDocs = {
  components: ["tape-progress"],
  exports: ["TapeProgress"],
  usage: `import { TapeProgress } from "@/components/tape-progress";

<TapeProgress label="Exporting the reel" value={412} max={1204} valueText="412 of 1,204" />

// It ends in words, as Progress does.
<TapeProgress label="Exporting the reel" status="failed" value={412} max={1204} message="The disk is full. Free some space and export again." />`,
  use: [
    "Work the person started and is waiting on, with a known end, under Device: an export, a render, a build with counted steps.",
    "A long job where the hardware reading helps: you can see it is still turning even when the number moves slowly.",
  ],
  skip: [
    "Another material's page. Use Progress; this needs data-material=\"device\" on <html> to look like itself.",
    "A wait with no end in sight. Put the loading state on the button that started it.",
    "A quantity that stands still, such as storage used. That is a Meter.",
  ],
  a11y: [
    "role=\"progressbar\", named by the label, with aria-valuenow while the value is known and the reading as aria-valuetext, exactly as Progress has them. The reels are decoration and hidden.",
    "Done and failed are announced once in a polite status, so a long wait need not be watched.",
    "The message under the window describes it (aria-describedby).",
    "Status is said in words: failed stops the reels, puts the light out and says Failed in the danger color.",
    "Under reduced motion the reels jump to each new value and nothing turns.",
  ],
};

const PAGES = 1204;

/** A pretend export: a few dozen pages at a time, unevenly, as a real one goes. */
function ExportDemo() {
  const { reduced } = useMotionDial();
  const [run, setRun] = useState(0);
  const [done, setDone] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!run) return;
    setDone(undefined);
    if (reduced) {
      setDone(PAGES);
      return;
    }
    const steps = [64, 150, 40, 210, 120, 90, 180, 60, 140, 150];
    let at = 0;
    let i = 0;
    let timer = 0;
    const tick = () => {
      at = Math.min(PAGES, at + steps[i++ % steps.length]!);
      setDone(at);
      if (at < PAGES) timer = window.setTimeout(tick, 420);
    };
    timer = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timer);
  }, [run, reduced]);
  const finished = done !== undefined && done >= PAGES;
  return (
    <div className="grid w-full max-w-md gap-6">
      <TapeProgress
        label="Exporting the Halden reel"
        value={run ? done : 0}
        max={PAGES}
        valueText={run && done !== undefined ? `${done.toLocaleString("en-GB")} of ${PAGES.toLocaleString("en-GB")} pages` : run ? "Waiting" : "Not started"}
        status={finished ? "done" : "active"}
        message={finished ? "halden-reel.pdf is in your downloads." : run ? "About a minute left." : "Press Export to start."}
      />
      <Button size="sm" className="justify-self-start" disabled={!!run && !finished} onClick={() => setRun((r) => r + 1)}>
        {run ? "Export again" : "Export"}
      </Button>
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="grid w-full max-w-md gap-8">
      <TapeProgress label="Preparing export" message="Counting the pages first." />
      <TapeProgress label="Exporting pages" value={412} max={PAGES} valueText="412 of 1,204" />
      <TapeProgress label="Exporting pages" value={PAGES} max={PAGES} status="done" />
      <TapeProgress label="Exporting pages" value={412} max={PAGES} status="failed" message="The disk is full. Free some space, then export again." />
    </div>
  );
}

/** Starts at 8% and runs to the end, so the Replay shows the reels trade tape. */
function ReplayTape() {
  const { reduced } = useMotionDial();
  const [value, setValue] = useState(reduced ? 100 : 8);
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setValue(100), 250);
    return () => window.clearTimeout(timer);
  }, [reduced]);
  return <TapeProgress label="Exporting the Halden reel" value={value} status={value >= 100 ? "done" : "active"} className="w-full max-w-md" />;
}

export const study: PageStudy = {
  object: <TapeProgress label="Exporting the Halden reel" value={42} className="w-full max-w-md" />,
  parts: [
    { name: "The words", selector: "div > span:first-child" },
    { name: "The glass", selector: "[role=progressbar]" },
    { name: "The supply reel", selector: "[role=progressbar] > div:nth-of-type(1)" },
    { name: "The take-up reel", selector: "[role=progressbar] > div:nth-of-type(2)" },
    { name: "The tape", selector: "[role=progressbar] svg path" },
    { name: "The record light", selector: "[role=progressbar] svg circle:last-of-type" },
  ],
  states: {
    default: <TapeProgress label="Exporting the Halden reel" value={42} className="w-full max-w-md" />,
    empty: <TapeProgress label="Preparing export" className="w-full max-w-md" />,
    error: <TapeProgress label="Exporting the Halden reel" value={42} status="failed" message="The disk is full." className="w-full max-w-md" />,
  },
  replay: {
    label: "Replay the export",
    caption: "Watch the left reel empty and speed up while the right one fills and slows, and the tape stay taut between them.",
    run: () => <ReplayTape />,
  },
};

export default function TapeProgressPage() {
  return (
    <Page meta={meta} docs={docs} study={study}>
      <Stage
        title="An export"
        tier="instant"
        align="start"
        code="ExportDemo"
        caption="Press Export. For a moment nothing is known and the reels sit at the start, then they turn as pages go: the left reel empties and speeds up while the right fills and slows, because the tape moves at one pace. Each change eases on a spring, so uneven chunks read as one steady run. At the end the light goes out and the reading says Done."
      >
        <ExportDemo />
      </Stage>

      <Stage
        title="Every state"
        tier="instant"
        align="start"
        code="StatesDemo"
        caption="Waiting, running, done and failed. Waiting is both reels at the start with the reading in words. Failed stops the reels where they are, puts the record light out and says Failed in the danger color, with the message saying what to do."
      >
        <StatesDemo />
      </Stage>

      <TryIt of="TapeProgress" component={TapeProgress} props={{ label: "Exporting the Halden reel", value: 40, max: 100, message: "About a minute left.", className: "w-full max-w-md" }} controls={["label", "value", "status", "message", "hideLabel"]} />
    </Page>
  );
}
