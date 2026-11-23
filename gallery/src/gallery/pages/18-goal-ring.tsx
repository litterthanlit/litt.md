import { useEffect, useState } from "react";
import { GoalRing } from "@/components/goal-ring";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "goal-ring",
  title: "Goal ring",
  lede: "Progress toward one goal you can count, such as books read this year.",
  order: 1.06,
  group: "Data",
  verbs: ["press"],
  worlds: ["flat"],
  summary:
    "One goal you can count on a white paper: an ink ring that fills as you get closer, the count standing inside it, the goal's name beneath, and grey − and + circles to step it. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "An SVG ring maps the count over the target to its strokeDashoffset, stroked in the ink over a grey track. The − and + circles beneath step the count, and the ring and the figure follow on the expressive spring, announcing each step once. Nothing moves until a hand steps it.",
};

export const docs: PageDocs = {
  components: ["goal-ring"],
  exports: ["GoalRing"],
  usage: `import { GoalRing } from "@/components/goal-ring";

<GoalRing
  title="Books read in 2026"
  target={24}
  unit="books"
  defaultValue={18}
/>`,
  use: [
    "Personal sites, portfolios, creator dashboards and reading logs under Flat.",
    "One goal you can count, such as books read, issues sent or readers reached.",
  ],
  skip: [
    "Another world's page. GoalRing uses Flat's paper, large figure, ink ring and grey circles; it needs data-material=\"flat\" on <html>.",
    "A live hardware or telemetry meter. Use Gauge.",
    "A multi-series comparison. Use Chart.",
  ],
  keyboard: [
    [["Tab"], "Moves focus between the − and + buttons."],
    [["Enter", "Space"], "Steps the goal down or up by one."],
  ],
  a11y: [
    "The radial ring exposes role=\"progressbar\" with aria-valuemin, aria-valuemax, aria-valuenow and readable aria-valuetext.",
    "The SVG graphic is hidden from assistive tech; the figure, the buttons' names and a polite live region say everything in words.",
    "Under reduced motion the ring and figure jump immediately with no spring overshoot.",
  ],
};

function ReadingGoalDemo() {
  return <GoalRing title="Books read in 2026" target={24} unit="books" defaultValue={18} />;
}

function NewsletterGoalDemo() {
  return <GoalRing title="Readers of the spring issue" target={500} unit="readers" defaultValue={420} />;
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
  return <GoalRing title="Books read in 2026" target={24} unit="books" value={val} onChange={setVal} />;
}

export const study: PageStudy = {
  object: <GoalRing title="Books read in 2026" target={24} unit="books" defaultValue={18} />,
  parts: [
    { name: "The ring", selector: "[role=progressbar]" },
    { name: "The figure", selector: "[data-part=figure]" },
    { name: "The − and + circles", selector: "[data-part=circle]" },
  ],
  states: {
    empty: <GoalRing title="Books read in 2026" target={24} unit="books" defaultValue={5} />,
    default: <GoalRing title="Books read in 2026" target={24} unit="books" defaultValue={18} />,
    pressed: <GoalRing title="Books read in 2026" target={24} unit="books" defaultValue={24} />,
  },
  replay: {
    label: "Replay logging books",
    caption: "Watch the ring fill as books are logged.",
    run: () => <ReplayGoal />,
  },
};

export default function GoalRingPage() {
  return (
    <Page
      meta={meta}
      docs={docs}
      study={study}
      tile={<GoalRing title="Books read in 2026" target={24} unit="books" defaultValue={18} />}
    >
      <Stage
        title="Reading goal"
        tier="expressive"
        code="ReadingGoalDemo"
        caption="An ink ring that fills toward the goal, the count inside it, and − and + to step it."
      >
        <ReadingGoalDemo />
      </Stage>
      <Stage
        title="Newsletter milestone"
        tier="expressive"
        code="NewsletterGoalDemo"
        caption="Any goal you can count works: books, issues, readers or runs."
      >
        <NewsletterGoalDemo />
      </Stage>
      <TryIt
        of="GoalRing"
        component={GoalRing}
        props={{ title: "Books read in 2026", target: 24, unit: "books", defaultValue: 14 }}
        controls={[{ name: "target", type: "number", min: 10, max: 50, step: 2 }]}
      />
    </Page>
  );
}
