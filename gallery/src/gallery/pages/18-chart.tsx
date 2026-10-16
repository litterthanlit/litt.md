import { BarChart, LineChart, Meter } from "@/components/chart";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "chart",
  title: "Chart",
  order: 15.6, group: "Layout and data",
  summary:
    "Bar and line charts in plain SVG, and a meter. Marks are the foreground, never the accent: one series at 55% with the current mark full, or up to three stepping down. Hairline gridlines, mono labels, a tooltip on hover and focus, and one entrance on the responsive tier.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["chart"],
  exports: ["BarChart", "LineChart", "Meter"],
  usage: `import { BarChart, LineChart, Meter } from "@/components/chart";

const days = ["3 Oct", "4 Oct", "5 Oct", /* … */ "16 Oct"];

// One series: bars at 55% of the foreground, the last bar full.
// The label names the chart for screen readers and builds its summary.
<BarChart
  label="Deploys per day, last 14 days"
  labels={days}
  series={[{ name: "Deploys", values: [5, 7, 4, 9, 6, 1, 0, 6, 8, 5, 9, 7, 2, 1] }]}
  unit={["deploy", "deploys"]}
  xTitle="Day"
/>

// A line, with the value formatted for the axis and the tooltip.
<LineChart
  label="Median build time, last 14 days"
  labels={days}
  series={[{ name: "Build time", values: [44, 41, 46, 39, 41, 38, 40] }]}
  formatValue={(v) => \`\${v} s\`}
  height={200}
/>

// Up to three series step down the foreground and get a legend.
<BarChart label="Deploys by target" labels={days} series={[
  { name: "Production", values: [/* … */] },
  { name: "Preview", values: [/* … */] },
]} />

// A rail for one value against a limit.
<Meter label="Storage" value={42} valueText="42 of 100 GB" />`,
  use: [
    "A person needs the shape of a few dozen numbers: deploys per day, build time over two weeks, traffic by month. A bar chart compares amounts, and a line follows change.",
    "The chart sits on a card or a stage and must stay quiet. Marks are the foreground, so the one accent on the view stays on the primary action.",
    "You have up to three series to compare. They step down the foreground and get a legend.",
    "The chart must work at any width. It measures its container, so it fits a tile, a column and a phone.",
    "A single value against a limit, such as storage used or a quota. Use a Meter.",
  ],
  skip: [
    "The exact numbers are the point. Use a Table, which lines the values up so the eye can run down a column.",
    "One number and its change. Use a Stat.",
    "You need more than three series, stacked bars, areas, pies or two scales on one chart. Litt has none of these: the foreground has three steps, and a second scale misleads.",
    "Thousands of points or a chart that zooms and pans. This one draws a mark per category and has no zoom.",
    "The values go below zero. The baseline is zero and negative values are not drawn.",
  ],
  keyboard: [
    [["Tab"], "Moves to the chart as one stop, on the current mark. Tab again leaves it."],
    [["ArrowRight", "ArrowDown"], "Moves to the next mark and shows its tooltip."],
    [["ArrowLeft", "ArrowUp"], "Moves to the previous mark."],
    [["Home", "End"], "Goes to the first or the last mark."],
    [["Esc"], "Hides the tooltip without moving focus. It returns when you move to another mark."],
  ],
  a11y: [
    "The drawing is an image (role=\"img\") named by a summary, such as \"Deploys per day, last 14 days: from 5 to 1, peak 9\". Pass `summary` to say something better, like what the peak was.",
    "A visually hidden table lists every value, with the category in its row header, so a screen reader can read the numbers without the picture.",
    "There is a hidden button per category in a labelled group, outside the image. Each is named \"3 Oct: 5 deploys\", and the tooltip repeats that, so it is hidden from screen readers.",
    "Moving by keyboard shows the tooltip and draws a 2px focus ring around the mark. The ring uses the focus color, so it passes 3:1 in both themes.",
    "A 55% foreground mark is at least 4:1 against a card in light and dark. A 30% mark is not, so the third series has an edge on its bars and a dash on its line. Never rely on tone alone: the legend and the tooltip name every series.",
    "On touch a finger scrubs: the mark under it shows its tooltip, and the tooltip stays until the next touch elsewhere. The pointer target is the whole plot and not each column, so a column narrower than a finger is no problem. A vertical drag still scrolls the page.",
    "Under reduced motion the bars and the line appear at once. Hover and focus change color only.",
    "A Meter is role=\"meter\" with its label as the name and its reading as the value text.",
  ],
};

const DAYS = ["3 Oct", "4 Oct", "5 Oct", "6 Oct", "7 Oct", "8 Oct", "9 Oct", "10 Oct", "11 Oct", "12 Oct", "13 Oct", "14 Oct", "15 Oct", "16 Oct"];
const DEPLOYS = [5, 7, 4, 9, 6, 1, 0, 6, 8, 5, 9, 7, 2, 1];

function DeploysDemo() {
  return (
    <div className="w-full max-w-3xl">
      <BarChart
        label="Deploys per day, last 14 days"
        labels={DAYS}
        series={[{ name: "Deploys", values: DEPLOYS }]}
        unit={["deploy", "deploys"]}
        xTitle="Day"
      />
    </div>
  );
}

const WEEK = DAYS.slice(7);

function TargetsDemo() {
  return (
    <div className="w-full max-w-3xl">
      <BarChart
        label="Deploys by target, last 7 days"
        labels={WEEK}
        series={[
          { name: "Production", values: [4, 3, 6, 5, 7, 2, 1] },
          { name: "Preview", values: [2, 5, 3, 4, 2, 0, 1] },
          { name: "Failed", values: [0, 1, 0, 2, 1, 0, 0] },
        ]}
        xTitle="Day"
        height={256}
      />
    </div>
  );
}

const BUILD = [44, 41, 46, 39, 41, 38, 40, 43, 37, 42, 45, 41, 39, 41];

function BuildTimeDemo() {
  return (
    <div className="w-full max-w-3xl">
      <LineChart
        label="Median build time, last 14 days"
        labels={DAYS}
        series={[{ name: "Build time", values: BUILD }]}
        formatValue={(v) => `${v} s`}
        xTitle="Day"
      />
    </div>
  );
}

function SitesDemo() {
  return (
    <div className="w-full max-w-3xl">
      <LineChart
        label="Build time by site, last 7 days"
        labels={WEEK}
        series={[
          { name: "Halo site", values: [41, 43, 39, 44, 42, 38, 40] },
          { name: "Northwind rebrand", values: [58, 55, 61, 57, 54, 56, 53] },
          { name: "Atlas portfolio", values: [28, 30, 27, 29, 26, 28, 27] },
        ]}
        formatValue={(v) => `${v} s`}
        xTitle="Day"
        height={256}
      />
    </div>
  );
}

function QuotasDemo() {
  return (
    <div className="grid w-full max-w-md gap-6">
      <Meter label="Storage" value={42} valueText="42 of 100 GB" />
      <Meter label="Build minutes" value={1380} max={3000} valueText="1,380 of 3,000" />
      <Meter label="Bandwidth" value={91} valueText="91 of 100 GB" />
    </div>
  );
}

function NarrowDemo() {
  return (
    <div className="w-full max-w-[22.375rem]">
      <BarChart
        label="Deploys per day, last 14 days"
        labels={DAYS}
        series={[{ name: "Deploys", values: DEPLOYS }]}
        unit={["deploy", "deploys"]}
        xTitle="Day"
        height={200}
      />
    </div>
  );
}

export default function ChartPage() {
  const [deploys, replayDeploys] = useReplay();
  const [build, replayBuild] = useReplay();
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Deploys per day"
        tier="responsive"
        size="lg"
        code="DeploysDemo"
        onReplay={replayDeploys}
        caption="Bars are the foreground at 55%, and the last day is full, so the eye lands on today. Hover or arrow to a bar and it takes full color on the instant tier, and a tooltip shows its day and value. Gridlines are hairlines, horizontal only, and the labels are mono. The bars grow up from the baseline once, on the responsive tier. Replay it to watch."
      >
        <DeploysDemo key={deploys} />
      </Stage>

      <Stage
        title="A line over two weeks"
        tier="responsive"
        size="lg"
        code="BuildTimeDemo"
        onReplay={replayBuild}
        caption="A line is the foreground, 2px, with a marker on the current point. It fades in once and never draws itself, because path data does not animate. Hover or arrow along it and the marker follows. The axis and the tooltip take a formatter, here seconds."
      >
        <BuildTimeDemo key={build} />
      </Stage>

      <Stage
        title="Three series, stepping down"
        tier="instant"
        size="lg"
        code="TargetsDemo"
        caption="Several series step down the foreground, 100%, 55% and 30%, and get a legend. Three is the most, because that is as many steps as the foreground has. The third series has an edge on its bars, since 30% alone is too faint against a card. Hover a day and the tooltip lists every series, over a faint wash of the column."
      >
        <TargetsDemo />
      </Stage>

      <Stage
        title="Three lines"
        tier="instant"
        size="lg"
        code="SitesDemo"
        caption="The same steps for lines: full, 55%, and a dashed 30% for the third, so it still reads when the tone is faint. Markers show at the hovered or focused day on every line."
      >
        <SitesDemo />
      </Stage>

      <Stage
        title="Meter"
        tier="instant"
        code="QuotasDemo"
        caption="One value against a limit: a 4px rail at the control radius, the foreground filling it at 12%, and the reading in mono at the end. The fill is the foreground, never the accent, and it does not animate. A quota that is nearly spent says so in its words."
      >
        <QuotasDemo />
      </Stage>

      <Stage
        title="A narrow screen"
        tier="instant"
        align="start"
        code="NarrowDemo"
        caption="The chart fills its container, so on a phone it takes the width of the screen less its margins. Fourteen labels do not fit, so only some show, counted back from today so the last day is always named. Labels never overlap, and nothing scrolls sideways. Touch the plot and drag along it: the bar under your finger shows its tooltip, which stays until you touch elsewhere."
      >
        <NarrowDemo />
      </Stage>
    </Page>
  );
}
