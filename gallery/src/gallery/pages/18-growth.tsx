import { useId, useState, type ReactNode } from "react";
import { StackedBarChart, type ChartSeries } from "@/components/chart";
import { CohortGrid, type Cohort } from "@/components/cohort-grid";
import { Funnel } from "@/components/funnel";
import { Legend } from "@/components/legend";
import { RangeSlider } from "@/components/slider";
import { Sparkline } from "@/components/sparkline";
import { Stat, StatGroup } from "@/components/stat";
import { Tag } from "@/components/tag";
import { DeviceProvider } from "@/motion";
import { Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "growth",
  title: "Growth",
  order: 18.75,
  group: "Data",
  summary:
    "A template store's last twelve weeks, drawn in rails: sign-ups by source as thin stacked columns you can filter by source and by week, the funnel from visit to paid, and retention by signup week. Each source keeps one hue, everything else stays in the foreground, and only the chart's entrance moves.",
  tiers: ["instant", "responsive"],
};

/* ----------------------------------------------------------------- data */

/** A seeded generator (mulberry32), so the page draws the same data on every load and on the server. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WEEKS = ["4 Aug", "11 Aug", "18 Aug", "25 Aug", "1 Sep", "8 Sep", "15 Sep", "22 Sep", "29 Sep", "6 Oct", "13 Oct", "20 Oct"];

/** Twelve weeks that grow from a level, with some noise. */
function weekly(seed: number, level: number, growth: number) {
  const next = seeded(seed);
  return WEEKS.map((_, i) => Math.max(0, Math.round(level * (1 + growth * i) * (0.85 + next() * 0.3))));
}

/* Each source keeps one hue everywhere on the page (P11): the legend, the chart and the tooltip agree. */
const SOURCES: ChartSeries[] = [
  { name: "Search", values: weekly(11, 120, 0.06), hue: "blue" },
  { name: "Social", values: weekly(12, 70, 0.11), hue: "amber" },
  { name: "Referral", values: weekly(13, 40, 0.09), hue: "teal" },
  { name: "Direct", values: weekly(14, 30, 0.03), hue: "violet" },
];

const total = (values: number[]) => values.reduce((s, v) => s + v, 0);
const groupDigits = (n: number) => n.toLocaleString("en-GB");

/** Retention by signup week: each cohort starts at 100% and settles, and later cohorts have fewer weeks behind them. */
function cohorts(): Cohort[] {
  const next = seeded(21);
  return WEEKS.slice(-8).map((label, c) => {
    const weeks = 8 - c;
    let level = 100;
    const values = Array.from({ length: weeks }, (_, w) => {
      if (w === 0) return 100;
      level = level * (w === 1 ? 0.46 + next() * 0.06 : 0.86 + next() * 0.06);
      return Math.round(level);
    });
    return { label: `Week of ${label}`, size: Math.round(260 + next() * 120 + c * 18), values };
  });
}
const COHORTS = cohorts();

/* ----------------------------------------------------------------- the page */

/** A section of the page: a small heading, a quiet note, and its rails. No box: the air does the separating. */
function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid min-w-0 content-start gap-6">
      <div className="grid gap-1">
        <h4 id={id} className="text-body text-fg">
          {title}
        </h4>
        <p className="text-small text-fg-subtle">{note}</p>
      </div>
      {children}
    </section>
  );
}

function Growth() {
  const [hidden, setHidden] = useState<string[]>([]);
  const [range, setRange] = useState<[number, number]>([0, WEEKS.length - 1]);
  const [from, to] = range;
  const labels = WEEKS.slice(from, to + 1);
  const shown = SOURCES.filter((s) => !hidden.includes(s.name)).map((s) => ({ ...s, values: s.values.slice(from, to + 1) }));
  const signups = SOURCES.map((s) => total(s.values.slice(from, to + 1)));

  return (
    <div className="@container w-full">
      <div className="grid grid-cols-1 gap-16">
        <header className="flex flex-wrap items-center gap-3">
          <h3 className="text-h3 text-fg">Halo templates</h3>
          <Tag>Store</Tag>
          <Tag>Last 12 weeks</Tag>
        </header>

        <StatGroup>
          <Stat label="Visitors" value="64,210" delta="Up 18% on the 12 weeks before" tone="good" trend={<Sparkline label="Visitors per week" values={weekly(31, 4200, 0.05)} />} />
          <Stat label="Sign-ups" value={groupDigits(total(SOURCES.flatMap((s) => s.values)))} delta="Up 24%" tone="good" trend={<Sparkline label="Sign-ups per week" values={WEEKS.map((_, i) => total(SOURCES.map((s) => s.values[i] ?? 0)))} />} />
          <Stat label="Paid" value={748} delta="Up 9%" tone="good" trend={<Sparkline label="New paid accounts per week" values={weekly(33, 52, 0.03)} />} />
          <Stat label="Week 4 retention" value={34} unit="%" delta="Down 2 points" tone="bad" />
        </StatGroup>

        <Section title="Sign-ups by source" note="Each week is one rail, a hue per source. Hide a source or narrow the weeks, and the colors stay with their sources.">
          <div className="grid gap-6 @min-[44rem]:grid-cols-[minmax(0,1fr)_16rem] @min-[44rem]:items-end">
            <Legend
              label="Sources"
              items={SOURCES.map((s, i) => ({ name: s.name, hue: s.hue, value: groupDigits(signups[i]!) }))}
              hidden={hidden}
              onHiddenChange={setHidden}
            />
            <RangeSlider
              label="Weeks"
              min={0}
              max={WEEKS.length - 1}
              value={range}
              onValueChange={setRange}
              minStepsBetweenThumbs={1}
              showValue
              formatValue={(i) => WEEKS[i] ?? ""}
              thumbLabels={["First week", "Last week"]}
            />
          </div>
          <StackedBarChart label="Sign-ups per week by source" labels={labels} series={shown} unit={["sign-up", "sign-ups"]} xTitle="Week of" height={256} legend={false} />
        </Section>

        <div className="grid grid-cols-1 gap-16 @min-[52rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Section title="Funnel" note="October, from a first visit to a paid plan. One quantity, one hue.">
            <Funnel
              label="Visit to paid, October"
              steps={[
                { label: "Visited", value: 18240 },
                { label: "Signed up", value: 6930 },
                { label: "Made a site", value: 2840 },
                { label: "Paid", value: 748 },
              ]}
            />
          </Section>
          <Section title="Retention" note="The share of each signup week still active, week by week. Later weeks have less behind them.">
            <CohortGrid label="Retention by signup week" cohorts={COHORTS} average />
          </Section>
        </div>
      </div>
    </div>
  );
}

function GrowthDemo() {
  return <Growth />;
}

function PhoneDemo() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div
        role="region"
        aria-label="Growth, phone"
        tabIndex={0}
        className={
          "h-176 overflow-y-auto overscroll-contain rounded-surface bg-canvas p-4 outline-1 -outline-offset-1 outline-line " +
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
        }
      >
        <DeviceProvider mode="phone">
          <Growth />
        </DeviceProvider>
      </div>
    </div>
  );
}

export default function GrowthPage() {
  return (
    <Page meta={meta}>
      <Stage
        title="Twelve weeks, in rails"
        size="lg"
        align="start"
        code="GrowthDemo"
        caption="Sign-ups by source stack into one thin rail per week, a hue per source. The legend hides a source and the slider narrows the weeks: the chart redraws at once, and the colors stay with their sources because a hue belongs to the series, not its place. The funnel is one quantity in one hue, and retention is a table whose dots step through one hue, with the number in every cell. Nothing is boxed; air separates the sections."
      >
        <GrowthDemo />
      </Stage>

      <Stage
        title="On a phone"
        align="start"
        code="PhoneDemo"
        caption="The same page in one column. The figures go two across, the filters stack above the chart, the funnel and retention follow, and the retention table scrolls sideways inside its own box with the signup week held at the start."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
