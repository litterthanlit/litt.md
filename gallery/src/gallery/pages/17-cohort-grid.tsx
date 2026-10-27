import { CohortGrid, type Cohort } from "@/components/cohort-grid";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "cohort-grid",
  title: "Cohort grid",
  lede: "Who stayed, week by week.",
  order: 17.75,
  group: "Data",
  summary:
    "Retention by signup week as a real table: a row per cohort, a column per period since signup, and in every cell the number with a dot in one data hue's four steps. It scrolls sideways inside its own box and never moves.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["cohort-grid"],
  exports: ["CohortGrid"],
  usage: `import { CohortGrid } from "@/components/cohort-grid";

// A row per signup week, oldest first. Each value is the share still active in that week since signup.
// A young cohort has fewer values: leave them off the end, or pass null.
<CohortGrid
  label="Retention by signup week"
  hue="teal"
  cohorts={[
    { label: "24 Aug", size: 412, values: [100, 58, 47, 41, 38, 35, 33, 32] },
    { label: "31 Aug", size: 388, values: [100, 61, 49, 43, 39, 36, 35] },
    { label: "7 Sep", size: 455, values: [100, 55, 44, 39, 35, 33] },
  ]}
/>

// Months instead of weeks, with a last row for every cohort together (weighted by size).
<CohortGrid label="Retention by signup month" periodLabel="Month" average hue="violet" cohorts={months} />

// Counts of people instead of shares.
<CohortGrid label="Active users by signup week" valueType="count" sizeLabel="Signed up" cohorts={counts} />`,
  use: [
    "You need to see whether people stay: a row per signup week or month, and how many are still active one, two, eight periods later.",
    "The numbers are the point, and the reader also needs to find where retention holds at a glance. Every cell shows its value, and the dot in front of it carries the Heatmap's four steps.",
    "Cohorts of different sizes sit together. The size column says how much each row weighs, and `average` adds a row for all of them, weighted by size.",
    "Pick the hue for what the grid is about, and keep it the same wherever that quantity is drawn in a view.",
  ],
  skip: [
    "You want activity over time with no cohorts, such as deploys per day. Use a Heatmap.",
    "The columns are different kinds of things, such as a name, a status and a date. Use a Table.",
    "You want one trend, such as overall week 4 retention month by month. Use a Chart with a line.",
    "The values go below zero, such as change against last period. A grid of one hue has one direction: more or less.",
  ],
  a11y: [
    "It is a native table: a hidden caption from `label`, a column header for each period and a row header for each cohort, so a screen reader announces \"12 Oct, Week 3, 41%\". The caption is hidden because the card or section around the grid names it with a heading, and a visible caption would scroll with the table.",
    "Every cell shows its number, so color is never the only signal. The number is in the foreground, high or low, and the size column is in the subtle ink; both pass 4.5:1 in light and dark. The dots are hidden from screen readers.",
    "A cell a cohort has not reached yet draws nothing and is read as \"no data\".",
    "When the table is wider than its box, the box becomes one tab stop named by the caption, and the arrow keys scroll it. When it fits, it adds no tab stop. The cohort column stays in place while the periods scroll.",
    "The legend is hidden from screen readers, because the numbers already say what it says.",
    "It has no hover, no tooltip and no motion, so touch loses nothing and there is nothing to reduce under reduced motion. The caller must give a `label` that says what the values are.",
  ],
};

/* ----------------------------------------------------------------- data

   Written by hand, so the same picture renders on the server, the client and in a screenshot. Retention for
   people who signed up to litt.design's template library: about 60% come back the week after, then it settles. */

const WEEKLY: Cohort[] = [
  { label: "24 Aug", size: 412, values: [100, 58, 47, 41, 38, 35, 33, 32] },
  { label: "31 Aug", size: 388, values: [100, 61, 49, 43, 39, 36, 35] },
  { label: "7 Sep", size: 455, values: [100, 55, 44, 39, 35, 33] },
  { label: "14 Sep", size: 501, values: [100, 63, 52, 46, 42] },
  { label: "21 Sep", size: 476, values: [100, 60, 50, 44] },
  { label: "28 Sep", size: 530, values: [100, 66, 54] },
  { label: "5 Oct", size: 498, values: [100, 64] },
  { label: "12 Oct", size: 517, values: [100] },
];

const MONTHLY: Cohort[] = [
  { label: "Apr 2026", size: 1840, values: [100, 42, 34, 30, 28, 27] },
  { label: "May 2026", size: 2105, values: [100, 45, 36, 32, 30] },
  { label: "Jun 2026", size: 1962, values: [100, 44, 35, 31] },
  { label: "Jul 2026", size: 2310, values: [100, 48, 39] },
  { label: "Aug 2026", size: 2480, values: [100, 51] },
  { label: "Sep 2026", size: 2655, values: [100] },
];

/** The weekly cohorts as people instead of shares. */
const WEEKLY_COUNTS: Cohort[] = WEEKLY.map((c) => ({
  ...c,
  values: c.values.map((v) => (v === null ? null : Math.round((c.size * v) / 100))),
}));

/* ----------------------------------------------------------------- demos */

function WeeklyDemo() {
  return <CohortGrid className="w-full max-w-3xl" label="Retention by signup week" hue="teal" cohorts={WEEKLY} />;
}

function MonthlyDemo() {
  return (
    <CohortGrid
      className="w-full max-w-2xl"
      label="Retention by signup month"
      periodLabel="Month"
      hue="violet"
      average
      cohorts={MONTHLY}
    />
  );
}

function CountsDemo() {
  return (
    <CohortGrid
      className="w-full max-w-3xl"
      label="Active users by signup week"
      valueType="count"
      sizeLabel="Signed up"
      hue="blue"
      cohorts={WEEKLY_COUNTS}
    />
  );
}

function NarrowDemo() {
  return <CohortGrid className="w-full max-w-80" label="Retention by signup week, narrow" hue="teal" cohorts={WEEKLY} />;
}

export default function CohortGridPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Weekly retention"
        code="WeeklyDemo"
        caption="A row per signup week, oldest first, and a column per week since signup. Each cell has its share in tabular figures and a dot in front of it in teal's four steps, so the eye finds where people stay without losing the numbers. Younger cohorts have fewer weeks, so the grid is a triangle and the empty cells draw nothing. Nothing moves."
      >
        <WeeklyDemo />
      </Stage>

      <Stage
        title="Monthly, with all cohorts"
        code="MonthlyDemo"
        caption="The same grid by month, in violet. The last row is every cohort together: for each month, the share of everyone who has reached it, so a big cohort counts for more than a small one. It sits under a stronger hairline and takes its dots from the same scale."
      >
        <MonthlyDemo />
      </Stage>

      <Stage
        title="Counts instead of shares"
        code="CountsDemo"
        caption="With the value type set to count, a cell says how many people were active, grouped by thousands, and the first week is the cohort itself. The dots step on the quartiles of the counts, so a larger cohort reads a step darker. Use shares when cohorts differ in size."
      >
        <CountsDemo />
      </Stage>

      <Stage
        title="In a narrow box"
        code="NarrowDemo"
        caption="In a box 20rem wide the weeks scroll sideways inside the grid's own box, and the page never does. The cohort column stays put, and a hairline appears at its edge once the weeks pass under it. When there is something to scroll, the box takes one tab stop, so the arrow keys scroll it too."
      >
        <NarrowDemo />
      </Stage>
    </Page>
  );
}
