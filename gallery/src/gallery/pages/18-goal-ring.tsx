import { useEffect, useState } from "react";
import { GoalRing } from "@/components/goal-ring";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "goal-ring",
  title: "Goal ring",
  lede: "A minimal cotton-candy radial goal tracker with circular stepper keys.",
  order: 1.06,
  group: "Data",
  verbs: ["press"],
  worlds: ["flat"],
  summary:
    "A minimal centered radial milestone tracker built with Dieter Rams restraint: one cotton-candy SVG ring (sky through violet to bubblegum) holding Flat's 40px standing figure inside, the quiet title beneath, and two balanced circular − / + keys directly on Flat's ground. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "An SVG ring maps current over target to strokeDashoffset across Flat's vivid cotton-candy gradient (--data-sky, --data-violet, --data-bubblegum). Two circular keys beneath step the count on Flat's expressive spring (350ms, bounce 0.28) without taking an accent fill, announcing each step once.",
};

export const docs: PageDocs = {
  components: ["goal-ring"],
  exports: ["GoalRing"],
  usage: `import { GoalRing } from "@/components/goal-ring";

<GoalRing
  title="2026 Reading goal"
  target={24}
  unit="books"
  defaultValue={18}
/>`,
  use: [
    "Personal sites, portfolios, creator dashboards and reading logs under Flat.",
    "Tracking a single countable goal with centered geometry and quiet circular controls.",
  ],
  skip: [
    "Another world's page. GoalRing uses Flat's 40px figure, cotton-candy arc, circular keys and 0.28 bounce; it needs data-material=\"flat\" on <html>.",
    "A live hardware or telemetry meter. Use Gauge.",
    "A multi-series comparison. Use Chart.",
  ],
  keyboard: [
    [["Tab"], "Moves focus between the circular − and + keys."],
    [["Enter", "Space"], "Steps the goal down or up by one."],
  ],
  a11y: [
    "The radial ring exposes role=\"progressbar\" with aria-valuemin, aria-valuemax, aria-valuenow and readable aria-valuetext.",
    "The SVG graphic is hidden from assistive tech; the standing figure, circular key labels and polite live region say everything in words.",
    "Under reduced motion the ring and figure jump immediately with no spring overshoot.",
  ],
};

function ReadingGoalDemo() {
  return <GoalRing title="2026 Reading goal" target={24} unit="books" defaultValue={18} />;
}

function NewsletterGoalDemo() {
  return <GoalRing title="Spring issue" target={500} unit="readers" defaultValue={420} />;
}

function ReplayGoal() {
  const { reduced } = useMotionDial();
  const [val, setVal] = useState(reduced ? 18 : 10);
  useEffect(() => {
    if (reduced) return;
    const t1 = window.setTimeout(() => setVal(15), 280);
    const t2 = window.setTimeout(() => setVal(18), 680);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reduced]);
  return <GoalRing title="2026 Reading goal" target={24} unit="books" value={val} onChange={setVal} />;
}

export const study: PageStudy = {
  object: <GoalRing title="2026 Reading goal" target={24} unit="books" defaultValue={18} />,
  parts: [
    { name: "The cotton-candy ring", selector: "[role=progressbar]" },
    { name: "The figure", selector: "[data-part=figure]" },
    { name: "The circular keys", selector: "[data-part=circle]" },
  ],
  states: {
    empty: <GoalRing title="2026 Reading goal" target={24} unit="books" defaultValue={5} />,
    default: <GoalRing title="2026 Reading goal" target={24} unit="books" defaultValue={18} />,
    pressed: <GoalRing title="2026 Reading goal" target={24} unit="books" defaultValue={24} />,
  },
  replay: {
    label: "Replay logging books",
    caption: "Watch the cotton-candy ring spring forward on Flat's 0.28 bounce.",
    run: () => <ReplayGoal />,
  },
};

export default function GoalRingPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<GoalRing title="2026 Reading goal" target={24} unit="books" defaultValue={18} />}
    >
      <Stage
        title="Reading goal"
        tier="expressive"
        code="ReadingGoalDemo"
        caption="Open cotton-candy arc, single 40px figure, and round − / + keys. Everything redundant stripped away."
      >
        <ReadingGoalDemo />
      </Stage>
      <Stage
        title="Newsletter milestone"
        tier="expressive"
        code="NewsletterGoalDemo"
        caption="Works for any countable creator milestone: books, issues, readers or runs."
      >
        <NewsletterGoalDemo />
      </Stage>
      <TryIt
        of="GoalRing"
        component={GoalRing}
        props={{ title: "2026 Reading goal", target: 24, unit: "books", defaultValue: 14 }}
        controls={[{ name: "target", type: "number", min: 10, max: 50, step: 2 }]}
      />
    </Page>
  );
}
