import { useState } from "react";
import { RangeChart, type RangeChartBar, type RangeChartSegment, type RangeChartTick } from "@/components/range-chart";
import { DeviceProvider } from "@/motion";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "range-chart",
  title: "Range chart",
  lede: "A stretch of days, brushed by hand and read as one figure.",
  order: 17.33,
  group: "Data",
  verbs: ["drag", "press"],
  summary:
    "One quantity over time as a barcode of thin bars, its segments and their shares in a tray above, and a range you brush by hand: drag across the bars, drag either cap, or drag the whole span. The edges follow the pointer one to one and settle on a bar or a segment start on the responsive tier; the segment the range matches is raised, and the total of what is brushed rolls as you go, its last group in the quiet ink. In fun mode the span can be thrown, and the bars it sweeps rise.",
  fun: "Throw the span: it coasts across the bars, they rise as it passes, and it lands on the segment start nearest where it would stop.",
  tiers: ["responsive", "instant"],
};

export const docs: PageDocs = {
  components: ["range-chart"],
  exports: ["RangeChart"],
  usage: `import { RangeChart } from "@/components/range-chart";

const [range, setRange] = useState<[number, number]>([103, 130]);

<RangeChart
  label="Visitors"
  unit="visitors"
  bars={days}                               // { label: "14 Apr", value: 6240 }, oldest first
  segments={[
    { label: "Before the redesign", start: 0 },
    { label: "Launch", start: 103 },
    { label: "Since", start: 131 },
  ]}
  axis={months}                             // { at: 0, label: "Jan" }, one per month
  value={range}
  onValueChange={setRange}
  onValueCommit={(r) => loadVisits(r)}      // once the edges have settled
/>`,
  use: [
    "A count over many days, hours or builds where the span is the question: how many visitors the launch brought, how many deploys went out during the incident, what a quarter earned.",
    "The series is dense, hundreds of bars, and the reader wants to brush a stretch by eye rather than type two dates.",
    "The run has named stretches (before, launch, since) whose totals and shares are worth a press each.",
    "What is brushed drives something else: a table, a query, a chart below. Hold the range in state with value and onValueChange, or load on onValueCommit.",
  ],
  skip: [
    "A single moment in a run, such as a point in a build's log. That is the Time scrubber.",
    "A value that stays, such as a budget or a limit. That is a Slider.",
    "A handful of amounts to compare by height. Use a Bar chart, which has an axis to read them against.",
    "A rate or an average. The reading is a sum, so the values must add up; a rate has no meaningful total.",
  ],
  keyboard: [
    [["Tab"], "Moves between the three sliders: from, to and move range."],
    [["←", "→"], "Moves the focused edge one bar, or ten with Shift. On move range, the whole span moves."],
    [["Page Up", "Page Down"], "Goes to the next or previous segment start, or ten bars when there are none."],
    [["Home", "End"], "Goes to the start or the end of the run."],
    [["Esc"], "Brushes the whole range."],
  ],
  a11y: [
    'Three sliders in a group named by the label: "Visitors, from", "Visitors, to" and "Visitors, move range". Each says its bar in words as aria-valuetext ("14 Apr"), and the span\'s says both ends ("14 Apr to 11 May").',
    "The bars are one image with a summary (the run, the total and each segment's share), and a visually hidden table lists every bar with its value and its segment.",
    'A polite status says the range and its total once it has settled ("86,120 visitors, 14 Apr to 11 May, 22% of the whole"), never while a hand still moves it.',
    "The segments are buttons named with their share, and the one the range matches is aria-pressed. Whole range is a button too, so every gesture has a key or a button that does the same.",
    "Under reduced motion the edges jump to where they settle and the figure just changes.",
  ],
};

/* ----------------------------------------------------------------- data

   Generated once from a seed, so the same picture renders on the server, the client and in a screenshot. */

/** A small deterministic generator, in [0, 1). */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const MONTHS: [name: string, days: number][] = [
  ["Jan", 31],
  ["Feb", 28],
  ["Mar", 31],
  ["Apr", 30],
  ["May", 31],
  ["Jun", 30],
  ["Jul", 31],
  ["Aug", 31],
];
/** The redesign of halo.studio went live on 14 Apr; its launch month ends 11 May. */
const LAUNCH = 103;
const SINCE = 131;

/** Visitors per day to halo.studio, 1 Jan to 31 Aug: a slow climb, the launch spike fading over a month, then the new level. */
function visitorsByDay(): RangeChartBar[] {
  const rand = seeded(7);
  const out: RangeChartBar[] = [];
  let i = 0;
  for (const [name, days] of MONTHS) {
    for (let d = 1; d <= days; d++, i++) {
      const weekday = (i + 4) % 7; // 1 Jan 2026 is a Thursday
      const weekend = weekday === 0 || weekday === 6 ? 0.62 : 1;
      let base: number;
      if (i < LAUNCH) base = 1250 + i * 2.5;
      else if (i < SINCE) base = 2000 + 4800 * Math.exp(-(i - LAUNCH) / 9);
      else base = 1750 + 180 * Math.sin((i - SINCE) / 11);
      out.push({ label: `${d} ${name}`, value: Math.round(base * weekend * (0.88 + rand() * 0.24)) });
    }
  }
  return out;
}

const VISITORS = visitorsByDay();
const SEGMENTS: RangeChartSegment[] = [
  { label: "Before the redesign", start: 0 },
  { label: "Launch", start: LAUNCH },
  { label: "Since", start: SINCE },
];
const MONTH_TICKS: RangeChartTick[] = MONTHS.map(([name], m) => ({ at: MONTHS.slice(0, m).reduce((sum, [, days]) => sum + days, 0), label: name }));
const LAUNCH_RANGE: [number, number] = [LAUNCH, SINCE - 1];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Deploys per hour over a week: working hours busy, nights quiet, and a Wednesday afternoon of rollbacks and fixes. */
function deploysByHour(): RangeChartBar[] {
  const rand = seeded(3);
  const out: RangeChartBar[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const work = d < 5 && h >= 9 && h < 19;
      const peak = h === 11 || h === 16 ? 1.6 : 1;
      let v = work ? 2 + rand() * 4 * peak : rand() < 0.15 ? 1 : 0;
      if (d === 2 && h >= 14 && h < 18) v += 5 + rand() * 4;
      out.push({ label: `${DAYS[d]} ${String(h).padStart(2, "0")}:00`, value: Math.round(v) });
    }
  }
  return out;
}

const HOURS = deploysByHour();
const DAY_TICKS: RangeChartTick[] = DAYS.map((name, d) => ({ at: d * 24, label: name }));
/** Wednesday 13:00 to 18:00: the incident window. */
const INCIDENT: [number, number] = [2 * 24 + 13, 2 * 24 + 18];

/** Invoices the studio sent per month this year. */
const INVOICES: RangeChartBar[] = [4, 6, 5, 7, 3, 8, 6, 9, 5, 7, 6, 4].map((value, m) => ({ label: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m], value }));

/* ----------------------------------------------------------------- demos */

function VisitorsDemo() {
  return (
    <div className="w-full max-w-2xl">
      <RangeChart label="Visitors to halo.studio" unit="visitors" bars={VISITORS} segments={SEGMENTS} axis={MONTH_TICKS} defaultValue={LAUNCH_RANGE} />
    </div>
  );
}

function DeploysDemo() {
  const [loaded, setLoaded] = useState<[number, number]>(INCIDENT);
  const count = HOURS.slice(loaded[0], loaded[1] + 1).reduce((sum, b) => sum + b.value, 0);
  return (
    <div className="grid w-full max-w-2xl gap-4">
      <RangeChart label="Deploys" unit={["deploy", "deploys"]} bars={HOURS} axis={DAY_TICKS} defaultValue={INCIDENT} onValueCommit={setLoaded} />
      <p role="status" className="text-small text-fg-subtle">
        Loaded {count} {count === 1 ? "deploy" : "deploys"} from {HOURS[loaded[0]].label} to {HOURS[loaded[1]].label}.
      </p>
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-12">
      <RangeChart label="Invoices sent" unit="invoices" bars={INVOICES} defaultValue={[5, 7]} height={64} />
      <RangeChart label="Visitors to halo.studio" unit="visitors" bars={VISITORS} segments={SEGMENTS} axis={MONTH_TICKS} defaultValue={LAUNCH_RANGE} height={64} disabled />
    </div>
  );
}

/** The same chart, forced to the phone path so a desktop can preview it. A real phone needs no wrapper. */
function PhoneDemo() {
  return (
    <DeviceProvider mode="phone">
      <div className="w-full max-w-sm">
        <RangeChart label="Visitors to halo.studio" unit="visitors" bars={VISITORS} segments={SEGMENTS} axis={MONTH_TICKS} defaultValue={LAUNCH_RANGE} height={72} />
      </div>
    </DeviceProvider>
  );
}

function VisitorsTile() {
  return <RangeChart label="Visitors" unit="visitors" bars={VISITORS} segments={SEGMENTS} axis={MONTH_TICKS} defaultValue={LAUNCH_RANGE} height={56} className="w-full" />;
}

export default function RangeChartPage() {
  return (
    <Page meta={meta} docs={docs} tile={<VisitorsTile />}>
      <Stage
        title="Visitors to halo.studio"
        tier="responsive"
        align="start"
        code="VisitorsDemo"
        caption="Drag across the bars and a new range is brushed from where you pressed. Take an edge within a few pixels and it follows your hand exactly, held where you took it; take the fill and the whole span moves. Each bar lights as an edge passes it and the figure rolls, its last group in the quiet ink. Let go and the edges settle on the nearest bar, or on a segment start they are let go near, on the responsive spring, and the segment the range matches rises in the tray. Press a segment to brush it, or Whole range to let go of all of it."
      >
        <VisitorsDemo />
      </Stage>

      <Stage
        title="Deploys per hour, and a commit"
        tier="responsive"
        align="start"
        code="DeploysDemo"
        caption="No segments: a plain barcode of a week in hours, with the days under it. onValueChange follows the hand bar by bar, so a reading can roll; onValueCommit fires once the edges have settled, so a query runs once per gesture. The line under the chart is written from the commit. Tab to the sliders: the arrows move one hour, Shift ten, Home and End go to the ends, Escape to the whole week."
      >
        <DeploysDemo />
      </Stage>

      <Stage
        title="Short, and disabled"
        tier="responsive"
        align="start"
        code="StatesDemo"
        caption="A dozen bars spread to the width, each at most 6px wide, and the range still settles on bar edges. Disabled lies flat: the slot, the caps, the tray and the words, with no pointer and no tab stop."
      >
        <StatesDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="responsive"
        code="PhoneDemo"
        caption="The same chart on a phone. The bars fold into groups so each keeps its 2px and its air, and nothing scrolls sideways. The rail and the tray grow to 44px, an edge takes 22px of reach each side, and Whole range is a 44px button. A sideways drag is the chart's; up and down still scrolls the page."
      >
        <PhoneDemo />
      </Stage>

      <TryIt
        of="RangeChart"
        component={RangeChart}
        props={{ label: "Visitors", unit: "visitors", bars: VISITORS, segments: SEGMENTS, axis: MONTH_TICKS, defaultValue: LAUNCH_RANGE, className: "w-full max-w-2xl" }}
        controls={["label", { name: "unit", type: "text" }, { name: "height", type: "number", min: 48, max: 160, step: 8 }, "disabled"]}
      />
    </Page>
  );
}
