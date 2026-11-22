import { useEffect, useState } from "react";
import { ReadingProgress } from "@/components/reading-progress";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "reading-progress",
  title: "Reading progress",
  lede: "How far a reader is through a long post, chapter by chapter, with the time left.",
  order: 1.05,
  group: "Data",
  verbs: ["select", "press"],
  worlds: ["flat"],
  summary:
    "How far through a long post a reader is: the percent read as one large number with the minutes left, a bar of chapters to jump between, and the current chapter's name under it. It sits on the page with no box around it. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "Each chapter is a button on the bar. Choosing one lights every chapter up to it, each a step along the ramp (--data-sky, --data-blue, --data-violet, --data-bubblegum), pops the current chapter and the figure on the expressive spring (350ms), and announces progress in a polite live region.",
};

export const docs: PageDocs = {
  components: ["reading-progress"],
  exports: ["ReadingProgress"],
  usage: `import { ReadingProgress } from "@/components/reading-progress";

<ReadingProgress
  title="A week on the coast"
  defaultChapterIndex={2}
/>`,
  use: [
    "Beside or atop long-form essays, multi-part guides and portfolio stories under Flat.",
    "Where readers want to see the time left and jump straight to any chapter.",
  ],
  skip: [
    "Another world's page. ReadingProgress uses Flat's large figure and colored chapters; it needs data-material=\"flat\" on <html>.",
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
  return <ReadingProgress title="A week on the coast" defaultChapterIndex={2} />;
}

function FinishedProgressDemo() {
  return (
    <ReadingProgress
      title="Issue 14: the spring series"
      chapters={[
        { id: "c1", title: "Why the coast", minutes: 3 },
        { id: "c2", title: "Twelve pictures", minutes: 4 },
        { id: "c3", title: "Next Friday", minutes: 2 },
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
  return <ReadingProgress title="A week on the coast" chapterIndex={idx} onChapterChange={setIdx} />;
}

export const study: PageStudy = {
  object: <ReadingProgress title="A week on the coast" defaultChapterIndex={2} />,
  parts: [
    { name: "The figure", selector: "[data-part=figure]" },
    { name: "The chapter segments", selector: "[data-part=bubble]" },
    { name: "The active chapter", selector: "p[data-part=lettering]" },
  ],
  states: {
    empty: <ReadingProgress title="A week on the coast" defaultChapterIndex={0} />,
    default: <ReadingProgress title="A week on the coast" defaultChapterIndex={2} />,
    pressed: <ReadingProgress title="A week on the coast" defaultChapterIndex={3} />,
  },
  replay: {
    label: "Replay chapter advance",
    caption: "Watch the chapters light up one by one as the reader moves on.",
    run: () => <ReplayReading />,
  },
};

export default function ReadingProgressPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<ReadingProgress title="A week on the coast" defaultChapterIndex={2} />}
    >
      <Stage
        title="A long post"
        tier="expressive"
        code="EssayProgressDemo"
        caption="The percent read, the minutes left and a bar of chapters. Choose any chapter to jump to it."
      >
        <EssayProgressDemo />
      </Stage>
      <Stage
        title="Finished state"
        tier="expressive"
        code="FinishedProgressDemo"
        caption="At the last chapter every segment is lit, and the time left reads Finished."
      >
        <FinishedProgressDemo />
      </Stage>
      <TryIt
        of="ReadingProgress"
        component={ReadingProgress}
        props={{ title: "A week on the coast", defaultChapterIndex: 1 }}
        controls={[{ name: "defaultChapterIndex", type: "number", min: 0, max: 3, step: 1 }]}
      />
    </Page>
  );
}
