import { useEffect, useState } from "react";
import { ReadingProgress } from "@/components/reading-progress";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "reading-progress",
  title: "Reading progress",
  lede: "A minimal chapter progress bar stepping through Flat's cotton-candy palette.",
  order: 1.05,
  group: "Data",
  verbs: ["select", "press"],
  worlds: ["flat"],
  summary:
    "A minimal reading progress instrument for essays, guides and portfolio stories. One borderless paper card holds the title, a 40px standing completion percentage, and directly-clickable chapter segments stepping from sky through blue and violet to bubblegum — with zero extra pill rows or stepper buttons. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Each chapter is a single clickable capsule segment. Clicking any segment steps the cotton-candy ramp (--data-sky, --data-blue, --data-violet, --data-bubblegum) to that chapter, pops the active segment and 40px figure on Flat's expressive spring (350ms, bounce 0.28), and announces progress in a polite live region.",
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
    "Where readers benefit from seeing remaining read time and clicking directly into any chapter.",
  ],
  skip: [
    "Another world's page. ReadingProgress uses Flat's paper-on-grey card, 40px figure, cotton-candy segments and 0.28 bounce; it needs data-material=\"flat\" on <html>.",
    "A background upload or task meter. Use Progress.",
    "A multi-step form wizard with validation. Use Tabs or Breadcrumb.",
  ],
  keyboard: [
    [["Tab"], "Moves focus across the chapter segments."],
    [["Enter", "Space"], "Jumps directly to the focused chapter."],
  ],
  a11y: [
    "Chapter segments sit inside role=\"group\" named Chapters; the active segment carries aria-current=\"step\".",
    "Each segment exposes the chapter number, title and reading minutes in aria-label.",
    "Every jump announces the chapter title, percentage and remaining read time once in a polite status region.",
    "Under reduced motion the segment and figure update immediately without spring overshoot.",
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
    { name: "The chapter segments", selector: "[data-part=bubble]" },
  ],
  states: {
    empty: <ReadingProgress title="Field notes on motion" defaultChapterIndex={0} />,
    default: <ReadingProgress title="Field notes on motion" defaultChapterIndex={2} />,
    pressed: <ReadingProgress title="Field notes on motion" defaultChapterIndex={3} />,
  },
  replay: {
    label: "Replay chapter advance",
    caption: "Watch the cotton-candy segments step forward on Flat's 0.28 bounce.",
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
        caption="Title, 40px standing percent, and directly-clickable cotton-candy segments — click any bar segment to jump."
      >
        <EssayProgressDemo />
      </Stage>
      <Stage
        title="Finished state"
        tier="expressive"
        code="FinishedProgressDemo"
        caption="At 100%, every segment lights across sky, violet and bubblegum and reads Finished."
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
