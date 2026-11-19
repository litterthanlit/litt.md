import { useEffect, useState } from "react";
import { GoalRing } from "@/components/goal-ring";
import { useMotionDial } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta, type PageStudy } from "../kit";

export const meta: PageMeta = {
  id: "goal-ring",
  title: "Goal ring",
  lede: "A radial sunset heatwave goal tracker with Flat's 40px standing figure.",
  order: 1.06,
  group: "Data",
  verbs: ["press"],
  worlds: ["flat"],
  summary:
    "A playful radial milestone tracker for personal reading goals, newsletter targets and creative streaks. Its SVG arc warms across Flat's four-stop sunset heatwave gradient, pairs with a 40px standing figure on white paper, and springs on Flat's 0.28 expressive bounce as you log progress. It belongs to Flat.",
  tiers: ["instant", "expressive"],
  mechanism:
    "An SVG ring maps current over target to strokeDashoffset across a four-stop sunset heatwave gradient (--data-seq-1 to --data-seq-4). Pill controls (+1, +5, Reset) update the figure and ring on Flat's expressive spring (350ms, bounce 0.28) without taking an accent fill, and announce each step once.",
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
    "Celebrating progress toward a clear, countable target with tactile pill increments.",
  ],
  skip: [
    "Another world's page. GoalRing uses Flat's paper card, 40px figure, sunset heatwave arc and 0.28 bounce; it needs data-material=\"flat\" on <html>.",
    "A live hardware or telemetry meter. Use Gauge.",
    "A multi-series comparison. Use Chart.",
  ],
  keyboard: [
    [["Tab"], "Moves focus across Log +1, +5 and Reset pills."],
    [["Enter", "Space"], "Activates the focused pill to update the goal."],
  ],
  a11y: [
    "The radial ring exposes role=\"progressbar\" with aria-valuemin, aria-valuemax, aria-valuenow and readable aria-valuetext.",
    "The SVG graphic is hidden from assistive tech; the standing figure, percentage and polite live region say everything in words.",
    "Under reduced motion the ring and figure jump immediately with no spring overshoot.",
  ],
};

function ReadingGoalDemo() {
  return <GoalRing title="2026 Reading goal" target={24} unit="books" defaultValue={18} />;
}

function NewsletterGoalDemo() {
  return <GoalRing title="Spring issue subscribers" target={500} unit="readers" defaultValue={420} />;
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
    { name: "The paper card", selector: "[data-part=paper]" },
    { name: "The heatwave ring", selector: "[role=progressbar]" },
    { name: "The figure", selector: "[data-part=figure]" },
  ],
  states: {
    empty: <GoalRing title="2026 Reading goal" target={24} unit="books" defaultValue={5} />,
    default: <GoalRing title="2026 Reading goal" target={24} unit="books" defaultValue={18} />,
    pressed: <GoalRing title="2026 Reading goal" target={24} unit="books" defaultValue={24} />,
  },
  replay: {
    label: "Replay logging books",
    caption: "Watch the sunset heatwave ring spring forward on Flat's 0.28 bounce.",
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
        caption="Sunset heatwave ring paired with Flat's 40px standing figure. Log +1 or +5 to spring the arc forward, or Reset to start over."
      >
        <ReadingGoalDemo />
      </Stage>
      <Stage
        title="Newsletter milestone"
        tier="expressive"
        code="NewsletterGoalDemo"
        caption="Works for any countable creator milestone: books, issues, subscribers or runs."
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
