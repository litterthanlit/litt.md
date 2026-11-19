import { useEffect, useState } from "react";
import { ReadingProgress } from "@/components/reading-progress";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "reading-progress",
  title: "Reading progress",
  lede: "An airy chapter progress card warming along Flat's sunset heatwave.",
  order: 1.05,
  group: "Data",
  verbs: ["select", "press"],
  worlds: ["flat"],
  summary:
    "An editorial reading progress card for long-form essays, guides and portfolio stories. It pairs Flat's 40px standing completion percentage and remaining read time with a continuous sunset heatwave capsule bar and interactive chapter pills that spring forward on Flat's 0.28 bounce. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "The paper card computes read percentage and remaining minutes from the active chapter index. Jumping chapters or stepping with Previous and Next animates the sunset heatwave bar (--data-seq-1 to --data-seq-4) on Flat's expressive spring (350ms, bounce 0.28) and updates a polite live status region.",
};

export const docs: PageDocs = {
  components: ["reading-progress"],
  exports: ["ReadingProgress"],
  usage: `import { ReadingProgress } from "@/components/reading-progress";

<ReadingProgress
  title="Field notes on motion"
  defaultChapterIndex={2}
/>`,
  use: [
    "Beside or atop long-form essays, multi-part guides and portfolio stories under Flat.",
    "Where readers benefit from seeing remaining read time and jumping directly between chapters.",
  ],
  skip: [
    "Another world's page. ReadingProgress uses Flat's paper-on-grey card, 40px figure, sunset heatwave bar and 0.28 bounce; it needs data-material=\"flat\" on <html>.",
    "A background upload or task meter. Use Progress.",
    "A multi-step form wizard with validation. Use Tabs or Breadcrumb.",
  ],
  keyboard: [
    [["Tab"], "Moves focus across chapter pills and Previous / Next controls."],
    [["Enter", "Space"], "Jumps to the focused chapter or steps forward and back."],
  ],
  a11y: [
    "The heatwave bar exposes role=\"progressbar\" with aria-valuemin, aria-valuemax and aria-valuenow.",
    "The active chapter pill carries aria-current=\"step\".",
    "Every chapter jump announces the chapter title, percentage and remaining read time once in a polite status region.",
    "Under reduced motion the bar and figure update immediately without spring overshoot.",
  ],
};

function EssayProgressDemo() {
  return <ReadingProgress title="Field notes on motion" defaultChapterIndex={2} />;
}

function FinishedProgressDemo() {
  return (
    <ReadingProgress
      title="Designing quiet tools"
      chapters={[
        { id: "c1", title: "Calm defaults", minutes: 3 },
        { id: "c2", title: "Shape & type", minutes: 4 },
        { id: "c3", title: "Release notes", minutes: 2 },
      ]}
      defaultChapterIndex={2}
    />
  );
}

function ReplayReading() {
  const { reduced } = useMotionDial();
  const [idx, setIdx] = useState(reduced ? 2 : 0);
  useEffect(() => {
    if (reduced) return;
    const t1 = window.setTimeout(() => setIdx(1), 300);
    const t2 = window.setTimeout(() => setIdx(2), 720);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reduced]);
  return <ReadingProgress title="Field notes on motion" chapterIndex={idx} onChapterChange={setIdx} />;
}

export const study: PageStudy = {
  object: <ReadingProgress title="Field notes on motion" defaultChapterIndex={2} />,
  parts: [
    { name: "The paper card", selector: "[data-part=paper]" },
    { name: "The figure", selector: "[data-part=figure]" },
    { name: "The heatwave bar", selector: "[role=progressbar]" },
  ],
  states: {
    empty: <ReadingProgress title="Field notes on motion" defaultChapterIndex={0} />,
    default: <ReadingProgress title="Field notes on motion" defaultChapterIndex={2} />,
    pressed: <ReadingProgress title="Field notes on motion" defaultChapterIndex={3} />,
  },
  replay: {
    label: "Replay chapter advance",
    caption: "Watch the sunset heatwave capsule spring across chapters on Flat's 0.28 bounce.",
    run: () => <ReplayReading />,
  },
};

export default function ReadingProgressPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<ReadingProgress title="Field notes on motion" defaultChapterIndex={2} />}
    >
      <Stage
        title="Long-form essay tracker"
        tier="expressive"
        code="EssayProgressDemo"
        caption="Standing 40px completion percent, heatwave capsule bar, and chapter pills. Click any chapter or step with Previous and Next."
      >
        <EssayProgressDemo />
      </Stage>
      <Stage
        title="Finished state"
        tier="expressive"
        code="FinishedProgressDemo"
        caption="At 100%, the heatwave bar reaches full plum/gold warmth and reads Finished reading."
      >
        <FinishedProgressDemo />
      </Stage>
      <TryIt
        of="ReadingProgress"
        component={ReadingProgress}
        props={{ title: "Field notes on motion", defaultChapterIndex: 1 }}
        controls={[{ name: "defaultChapterIndex", type: "number", min: 0, max: 3, step: 1 }]}
      />
    </Page>
  );
}
