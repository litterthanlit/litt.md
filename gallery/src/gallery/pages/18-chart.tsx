import { BarChart, LineChart, Meter, StackedBarChart } from "@/components/chart";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "chart",
  title: "Chart",
  lede: "Bars, lines and a meter in plain SVG.",
  order: 10.01, group: "Charts",
  verbs: ["hover"],
  summary:
    "Bar and line charts in plain SVG, and a meter. Marks are never the accent: by default the foreground, one series at 55% with the current mark full, or up to three stepping down; or the data hues, when color says which series is which. Hairline gridlines, labels in tabular figures, a tooltip on hover and focus, and one entrance on the responsive tier.",
  fun: "A meter's fill grows in, its reading counts with it, and the target tick pops as the fill passes.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["chart"],
  exports: ["BarChart", "LineChart", "StackedBarChart", "Meter"],
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

// Data hues (R7): give each series the next hue in the fixed order, or name one per series.
// Color follows the series, so "Sites" stays blue wherever it appears.
<BarChart label="Deploys by kind" labels={days} hues series={[
  { name: "Sites", values: [/* … */] },
  { name: "Templates", values: [/* … */] },
]} />
<LineChart label="Visits" labels={days} series={[
  { name: "This week", values: [/* … */], hue: "blue" },
  { name: "Last week", values: [/* … */] }, // stays in the foreground
]} />

// The parts of each day as one thin stacked rail, a hue per series, the total in the tooltip.
<StackedBarChart label="Storage added per day" labels={days} formatValue={(v) => \`\${v} GB\`} series={[
  { name: "Video", values: [/* … */] },
  { name: "Images", values: [/* … */] },
  { name: "Fonts", values: [/* … */] },
]} />

// A rail for one value against a limit. A hue when the color names the thing.
<Meter label="Storage" value={42} valueText="42 of 100 GB" />
<Meter label="Video" value={18} valueText="18 GB" hue="violet" />

// A budget to stay under, and a count of a few in steps.
<Meter label="Bandwidth" value={91} valueText="91 of 100 GB" target={80} targetText="budget 80 GB" />
<Meter label="Launch checklist" value={7} max={10} valueText="7 of 10" steps={10} />`,
  use: [
    "A person needs the shape of a few dozen numbers: deploys per day, build time over two weeks, traffic by month. A bar chart compares amounts, and a line follows change.",
    "The chart sits on a card or a stage and must stay quiet. Marks are the foreground, so the one accent on the view stays on the primary action.",
    "You have up to three series to compare. They step down the foreground and get a legend.",
    "Telling the series apart is the point, or a series has a color elsewhere in the view. Give them data hues (up to five), and keep each series' hue the same everywhere.",
    "The chart must work at any width. It measures its container, so it fits a tile, a column and a phone.",
    "A single value against a limit, such as storage used or a quota. Use a Meter.",
  ],
  skip: [
    "The exact numbers are the point. Use a Table, which lines the values up so the eye can run down a column.",
    "One number and its change. Use a Stat.",
    "You need more than five series, stacked bars, areas, pies or two scales on one chart. Litt has none of these: the foreground has three steps, the data hues five, and a second scale misleads. Fold the rest into \"Other\" or draw a second chart.",
    "The color would only brighten the chart. One quantity reads best in the foreground; a hue is for telling things apart (R7).",
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
    "Every data hue's mark tone reaches 3:1 on canvas and every surface in both themes, and neighbors in the fixed order stay apart for color-blind readers. A single hue series emphasises its current mark with the hue's text tone, which is a step stronger, not a lighter one.",
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

const KINDS = [
  { name: "Sites", values: [3, 2, 4, 3, 5, 1, 1] },
  { name: "Templates", values: [1, 3, 2, 2, 1, 0, 0] },
  { name: "Plugins", values: [0, 1, 1, 2, 2, 1, 0] },
  { name: "Docs", values: [2, 0, 1, 0, 1, 0, 1] },
];

function HuesDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-12">
      <BarChart label="Deploys by kind, last 7 days" labels={WEEK} series={KINDS} hues xTitle="Day" height={256} />
      <LineChart
        label="Site visits, this week against last"
        labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
        series={[
          { name: "This week", values: [1840, 2210, 2050, 2480, 2620, 1390, 1180], hue: "blue" },
          { name: "Last week", values: [1620, 1900, 2010, 2140, 2300, 1250, 1100] },
        ]}
        xTitle="Day"
        height={224}
      />
    </div>
  );
}

const ADDED = [
  { name: "Video", values: [4.2, 3.1, 5.6, 2.4, 6.8, 1.2, 0.6, 3.9, 5.1, 4.4, 7.2, 5.8, 1.6, 0.9] },
  { name: "Images", values: [1.8, 2.6, 1.4, 2.9, 2.2, 0.8, 0.4, 2.4, 3.1, 1.9, 2.7, 2.2, 0.7, 0.5] },
  { name: "Documents", values: [0.6, 0.4, 0.9, 0.5, 0.7, 0.1, 0.1, 0.8, 0.6, 0.7, 0.9, 0.5, 0.2, 0.1] },
  { name: "Fonts", values: [0.2, 0, 0.3, 0.1, 0, 0, 0, 0.4, 0.1, 0.2, 0.1, 0.3, 0, 0] },
];

function StackedDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StackedBarChart
        label="Storage added per day, last 14 days"
        labels={DAYS}
        series={ADDED}
        formatValue={(v) => `${+v.toFixed(1)} GB`}
        xTitle="Day"
        height={256}
      />
    </div>
  );
}

function OneHueDemo() {
  return (
    <div className="w-full max-w-3xl">
      <BarChart
        label="Inbound mail per day, last 14 days"
        labels={DAYS}
        series={[{ name: "Mail", values: [42, 51, 38, 47, 55, 19, 12, 44, 58, 49, 61, 53, 21, 15], hue: "teal" }]}
        unit={["message", "messages"]}
        xTitle="Day"
        height={200}
      />
    </div>
  );
}

function StorageDemo() {
  return (
    <div className="grid w-full max-w-md gap-6">
      <Meter label="Images" value={24} max={100} valueText="24 GB" hue="teal" />
      <Meter label="Video" value={58} max={100} valueText="58 GB" hue="violet" />
      <Meter label="Fonts" value={3} max={100} valueText="3 GB" hue="amber" />
    </div>
  );
}

function TargetsDemo2() {
  return (
    <div className="grid w-full max-w-md gap-6">
      <Meter label="Build minutes" value={1380} max={3000} valueText="1,380 of 3,000" target={2400} targetText="budget 2,400" hue="blue" />
      <Meter label="Bandwidth" value={91} valueText="91 of 100 GB" target={80} targetText="budget 80 GB" />
      <Meter label="Launch checklist" value={7} max={10} valueText="7 of 10" steps={10} hue="teal" />
      <Meter label="Pages reviewed" value={3} max={5} valueText="3 of 5" steps={5} />
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

/* ---------- Device's own (plans/024, phase 3): a shoot's takes, cards and channels, in the ink ---------- */

const TAKES = [5, 7, 4, 9, 6, 1, 0, 6, 8, 5, 9, 7, 2, 1];

function TakesDemo() {
  return (
    <div className="w-full max-w-3xl">
      <BarChart label="Takes per day, last 14 days" labels={DAYS} series={[{ name: "Takes", values: TAKES }]} unit={["take", "takes"]} xTitle="Day" />
    </div>
  );
}

function ResultsDemo() {
  return (
    <div className="w-full max-w-3xl">
      <BarChart
        label="Takes by result, last 7 days"
        labels={WEEK}
        series={[
          { name: "Kept", values: [4, 3, 6, 5, 7, 2, 1] },
          { name: "Circled", values: [2, 5, 3, 4, 2, 0, 1] },
          { name: "Clipped", values: [0, 1, 0, 2, 1, 0, 0] },
        ]}
        xTitle="Day"
        height={256}
      />
    </div>
  );
}

const LENGTH = [44, 41, 46, 39, 41, 38, 40, 43, 37, 42, 45, 41, 39, 41];

function TakeLengthDemo() {
  return (
    <div className="w-full max-w-3xl">
      <LineChart label="Median take length, last 14 days" labels={DAYS} series={[{ name: "Take length", values: LENGTH }]} formatValue={(v) => `${v} s`} xTitle="Day" />
    </div>
  );
}

function ScenesDemo() {
  return (
    <div className="w-full max-w-3xl">
      <LineChart
        label="Take length by scene, last 7 days"
        labels={WEEK}
        series={[
          { name: "Scene 9", values: [41, 43, 39, 44, 42, 38, 40] },
          { name: "Scene 12", values: [58, 55, 61, 57, 54, 56, 53] },
          { name: "Wild lines", values: [28, 30, 27, 29, 26, 28, 27] },
        ]}
        formatValue={(v) => `${v} s`}
        xTitle="Day"
        height={256}
      />
    </div>
  );
}

function CardsDemo() {
  return (
    <div className="grid w-full max-w-md gap-6">
      <Meter label="Card A" value={42} max={128} valueText="42 of 128 GB" />
      <Meter label="Library" value={1380} max={3000} valueText="1,380 of 3,000 GB" />
      <Meter label="Card B" value={117} max={128} valueText="117 of 128 GB" />
    </div>
  );
}

const CHANNELS = [
  { name: "Boom", values: [3, 2, 4, 3, 5, 1, 1] },
  { name: "Lav 1", values: [1, 3, 2, 2, 1, 0, 0] },
  { name: "Lav 2", values: [0, 1, 1, 2, 2, 1, 0] },
  { name: "Room", values: [2, 0, 1, 0, 1, 0, 1] },
];

function ChannelsDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-12">
      <BarChart label="Takes by channel, last 7 days" labels={WEEK} series={CHANNELS} hues xTitle="Day" height={256} />
      <LineChart
        label="Minutes recorded, this week against last"
        labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
        series={[
          { name: "This week", values: [184, 221, 205, 248, 262, 139, 118], hue: "blue" },
          { name: "Last week", values: [162, 190, 201, 214, 230, 125, 110] },
        ]}
        xTitle="Day"
        height={224}
      />
    </div>
  );
}

const WRITTEN = [
  { name: "Takes", values: [4.2, 3.1, 5.6, 2.4, 6.8, 1.2, 0.6, 3.9, 5.1, 4.4, 7.2, 5.8, 1.6, 0.9] },
  { name: "Stems", values: [1.8, 2.6, 1.4, 2.9, 2.2, 0.8, 0.4, 2.4, 3.1, 1.9, 2.7, 2.2, 0.7, 0.5] },
  { name: "Mixes", values: [0.6, 0.4, 0.9, 0.5, 0.7, 0.1, 0.1, 0.8, 0.6, 0.7, 0.9, 0.5, 0.2, 0.1] },
  { name: "Room tone", values: [0.2, 0, 0.3, 0.1, 0, 0, 0, 0.4, 0.1, 0.2, 0.1, 0.3, 0, 0] },
];

function WrittenDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StackedBarChart
        label="Written to the library per day, last 14 days"
        labels={DAYS}
        series={WRITTEN}
        formatValue={(v) => `${+v.toFixed(1)} GB`}
        xTitle="Day"
        height={256}
      />
    </div>
  );
}

function MarkersDemo() {
  return (
    <div className="w-full max-w-3xl">
      <BarChart
        label="Markers dropped per day, last 14 days"
        labels={DAYS}
        series={[{ name: "Markers", values: [42, 51, 38, 47, 55, 19, 12, 44, 58, 49, 61, 53, 21, 15], hue: "teal" }]}
        unit={["marker", "markers"]}
        xTitle="Day"
        height={200}
      />
    </div>
  );
}

function LibraryKindsDemo() {
  return (
    <div className="grid w-full max-w-md gap-6">
      <Meter label="Takes" value={24} max={100} valueText="24 GB" hue="teal" />
      <Meter label="Stems" value={58} max={100} valueText="58 GB" hue="violet" />
      <Meter label="Mixes" value={3} max={100} valueText="3 GB" hue="amber" />
    </div>
  );
}

function OffloadTargetsDemo() {
  return (
    <div className="grid w-full max-w-md gap-6">
      <Meter label="Library" value={1380} max={3000} valueText="1,380 of 3,000 GB" target={2400} targetText="budget 2,400 GB" hue="blue" />
      <Meter label="Card B" value={91} valueText="91% used" target={80} targetText="offload at 80%" />
      <Meter label="Sound report" value={7} max={10} valueText="7 of 10 takes noted" steps={10} hue="teal" />
      <Meter label="Scenes slated" value={3} max={5} valueText="3 of 5" steps={5} />
    </div>
  );
}

function TakesNarrowDemo() {
  return (
    <div className="w-full max-w-[22.375rem]">
      <BarChart label="Takes per day, last 14 days" labels={DAYS} series={[{ name: "Takes", values: TAKES }]} unit={["take", "takes"]} xTitle="Day" height={200} />
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
        byWorld={{
          device: {
            demo: <TakesDemo key={deploys} />,
            title: "Takes per day",
            code: "TakesDemo",
            caption:
              "Each day is a column of lit dots on the LCD's matrix, the ink at 55% and today full, so the eye lands on today, and the readout above the glass shows today's takes in seven segments. Hover or arrow to a day and its column takes the full ink, the readout follows, and a tooltip says its day and its takes. The days are engraved under the glass. Nothing grows or fades in: the dots are lit.",
          },
        }}
        caption="Bars are the foreground at 55%, and the last day is full, so the eye lands on today. Hover or arrow to a bar and it takes full color on the instant tier, and a tooltip shows its day and value. Gridlines are hairlines, horizontal only, and the labels are in tabular figures. The bars grow up from the baseline once, on the responsive tier. Replay it to watch."
      >
        <DeploysDemo key={deploys} />
      </Stage>

      <Stage
        title="A line over two weeks"
        tier="responsive"
        size="lg"
        code="BuildTimeDemo"
        onReplay={replayBuild}
        byWorld={{ device: { demo: <TakeLengthDemo key={build} />, code: "TakeLengthDemo" } }}
        caption="A line is the foreground, 2px, with a marker on the current point. It fades in once and never draws itself, because path data does not animate. Hover or arrow along it and the marker follows. The axis and the tooltip take a formatter, here seconds."
      >
        <BuildTimeDemo key={build} />
      </Stage>

      <Stage
        title="Three series, stepping down"
        tier="instant"
        size="lg"
        code="TargetsDemo"
        byWorld={{ device: { demo: <ResultsDemo />, code: "ResultsDemo" } }}
        caption="Several series step down the foreground, 100%, 55% and 30%, and get a legend. Three is the most, because that is as many steps as the foreground has. The third series has an edge on its bars, since 30% alone is too faint against a card. Hover a day and the tooltip lists every series, over a faint wash of the column."
      >
        <TargetsDemo />
      </Stage>

      <Stage
        title="Three lines"
        tier="instant"
        size="lg"
        code="SitesDemo"
        byWorld={{ device: { demo: <ScenesDemo />, code: "ScenesDemo" } }}
        caption="The same steps for lines: full, 55%, and a dashed 30% for the third, so it still reads when the tone is faint. Markers show at the hovered or focused day on every line."
      >
        <SitesDemo />
      </Stage>

      <Stage
        title="Meter"
        tier="instant"
        code="QuotasDemo"
        byWorld={{
          device: {
            demo: <CardsDemo />,
            code: "CardsDemo",
            caption:
              "One value against a limit: a 4px rail at the control radius, the ink filling it at 12%, and the reading in tabular figures at the end. The fill is the ink, never the accent, and it does not animate. A card that is nearly full says so in its words.",
          },
        }}
        caption="One value against a limit: a 4px rail at the control radius, the foreground filling it at 12%, and the reading in tabular figures at the end. The fill is the foreground, never the accent, and it does not animate. A quota that is nearly spent says so in its words."
      >
        <QuotasDemo />
      </Stage>

      <Stage
        title="In data hues"
        tier="instant"
        size="lg"
        code="HuesDemo"
        byWorld={{
          device: {
            demo: <ChannelsDemo />,
            title: "Series given hues",
            code: "ChannelsDemo",
            caption:
              "Series given the data hues. Device's glass lights no hue: each series is one of the ink's levels, and the legend and the tooltip name every channel in words. Colour was never the only signal, so a trace that dashes keeps its dash.",
          },
        }}
        caption="When telling series apart is the point, they take the data hues in their fixed order: blue, amber, teal, violet, rose. Up to five, each at 3:1 or more on the card, so no bar needs an edge and no line a dash. A hue belongs to the series, not its place: below, this week is blue and last week stays in the foreground, so the eye goes to now."
      >
        <HuesDemo />
      </Stage>

      <Stage
        title="Stacked rails"
        tier="responsive"
        size="lg"
        code="StackedDemo"
        byWorld={{
          device: {
            demo: <WrittenDemo />,
            code: "WrittenDemo",
            caption:
              "When each day is made of parts, they stack in one column of dots, each part lit at its series' level from the baseline up, one unlit dot between parts. The tallest day sets the scale. Hover or focus a day and the others dim, the readout shows its total, and the tooltip lists takes, stems, mixes and room tone with the total.",
          },
        }}
        caption="When each day is made of parts, the parts stack into one thin rail: at most 8px wide, a data hue per series, 2px of air between segments, like the Breakdown's split rail. The tallest day sets the scale. Hover or focus a day and its parts take their text tones over a faint band, and the tooltip lists each part and the total."
      >
        <StackedDemo />
      </Stage>

      <Stage
        title="One series in a hue"
        tier="responsive"
        code="OneHueDemo"
        byWorld={{
          device: {
            demo: <MarkersDemo />,
            code: "MarkersDemo",
            caption:
              "A single series given a hue, here the markers dropped each day. The glass lights no hue, so its columns are the ink at 55% and today full, as any one series is. Hover moves the emphasis and the readout with it, on the instant tier.",
          },
        }}
        caption="A single series can take a hue when that color means the same thing elsewhere in the view, here inbound mail in teal. The bars rest in the hue's mark tone and today takes its text tone, a step stronger, so the emphasis never fades below 3:1. Hover moves the emphasis, on the instant tier."
      >
        <OneHueDemo />
      </Stage>

      <Stage
        title="Meters by kind"
        tier="instant"
        code="StorageDemo"
        byWorld={{
          device: {
            demo: <LibraryKindsDemo />,
            code: "LibraryKindsDemo",
            caption: "A storage breakdown of the library: takes, stems and mixes, each a rail of its own. Under Device a meter's hue is drawn in the ink, so the label says what each rail measures. The rail and the reading stay neutral. Nothing animates.",
          },
        }}
        caption="A meter takes a hue when its color names the thing it measures, as in a storage breakdown where images, video and fonts keep their hue across the page. The rail and the reading stay neutral. Nothing animates."
      >
        <StorageDemo />
      </Stage>

      <Stage
        title="Targets and steps"
        tier="instant"
        code="TargetsDemo2"
        byWorld={{
          device: {
            demo: <OffloadTargetsDemo />,
            code: "OffloadTargetsDemo",
            caption:
              "A target is a 2px tick that crosses the rail, taller than it, in the subtle grey: a line the fill can pass, as Card B has passed the 80% it should be offloaded at. Steps split the rail into equal segments 2px apart for a count of a few, such as seven of ten takes noted on the sound report. Nothing animates.",
          },
        }}
        caption="A target is a 2px tick that crosses the rail, taller than it, in the subtle gray: a budget the fill can pass, as bandwidth has. Steps split the rail into equal segments 2px apart for a count of a few, such as seven of ten checks. The hue stays a thread on the neutral track, and nothing animates."
      >
        <TargetsDemo2 />
      </Stage>

      <Stage
        title="A narrow screen"
        tier="instant"
        align="start"
        code="NarrowDemo"
        byWorld={{ device: { demo: <TakesNarrowDemo />, code: "TakesNarrowDemo" } }}
        caption="The chart fills its container, so on a phone it takes the width of the screen less its margins. Fourteen labels do not fit, so only some show, counted back from today so the last day is always named. Labels never overlap, and nothing scrolls sideways. Touch the plot and drag along it: the bar under your finger shows its tooltip, which stays until you touch elsewhere."
      >
        <NarrowDemo />
      </Stage>

    </Page>
  );
}
