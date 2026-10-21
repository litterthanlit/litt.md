import { useState } from "react";
import { BarChart, LineChart, type ChartSeries } from "@/components/chart";
import { Legend, legendHues, type LegendItem } from "@/components/legend";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "legend",
  title: "Legend",
  lede: "Toggles which series a chart shows.",
  order: 17.31,
  group: "Data",
  verbs: ["press"],
  summary:
    "Toggles which series a chart shows: a row of buttons, each a hued rail swatch and a name, pressed while its series shows. The Legend filters and the chart draws. Only color changes, on the instant tier, and nothing moves.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["legend"],
  exports: ["Legend", "legendHues"],
  usage: `import { Legend, legendHues } from "@/components/legend";
import { BarChart } from "@/components/chart";

const series = [
  { name: "Builds", values: [42, 38, 51, 47] },
  { name: "Previews", values: [18, 22, 19, 25] },
  { name: "Deploys", values: [9, 11, 8, 12] },
];
const items = series.map((s) => ({ name: s.name }));
// Each name's hue, from the whole list, so a series keeps its color when another is hidden.
const hues = legendHues(items);

const [hidden, setHidden] = useState<string[]>([]);
const shown = series.filter((s) => !hidden.includes(s.name)).map((s) => ({ ...s, hue: hues[s.name] }));

<Legend label="Series" items={items} hidden={hidden} onHiddenChange={setHidden} />
<BarChart label="Activity per week" labels={["W1", "W2", "W3", "W4"]} series={shown} hues legend={false} />

// A reading after each name, such as its total. Pin a hue so a kind keeps its color across the page.
<Legend label="Kinds" items={[{ name: "Video", hue: "violet", value: "58 GB" }, { name: "Images", hue: "teal", value: "24 GB" }]} />`,
  use: [
    "A chart has two to five series and the reader wants to compare a few of them, or take one out of the way.",
    "One choice of series drives several views at once, such as a chart and a table under it. The Legend holds the hidden list and you pass the shown series to each.",
    "The series' totals help the choice. Put them in `value` and they read after each name.",
    "A filter bar over a dashboard, beside the period and the range, where the series are one more filter.",
  ],
  skip: [
    "The legend only names the series. The Chart draws its own above the plot for up to three foreground series, and a Breakdown has a legend layout for a tile.",
    "Choosing one view out of a few, where exactly one is on. Use a Segmented control.",
    "More than five series. The hues run out, so fold the rest into Other or split the chart in two.",
    "A single series. There is nothing to compare, and the chart needs no legend at all.",
  ],
  keyboard: [
    [["Tab"], "Moves to the next item. Each item is its own stop, because each is its own toggle."],
    [["Space", "Enter"], "Shows or hides that series. On the last one shown it does nothing."],
    [["Alt+Enter"], "Shows only that series and hides the rest. Alt with a click does the same."],
  ],
  a11y: [
    "The items are native buttons in a group named by `label`, so a screen reader says the group, then each item as a toggle button, pressed while its series shows.",
    "The last shown item is never natively disabled, so it keeps its tab stop. It carries aria-disabled and a hidden note, \"At least one series stays shown.\", so a screen reader says why pressing it does nothing.",
    "Hidden is not color alone for assistive tech: aria-pressed says it. On screen the swatch turns to the grey track and the name steps down to the subtle ink, which still reaches 4.5:1 in both themes.",
    "The Legend does not hide anything itself. Pass the shown series to the chart, and keep the chart's own summary and table in step, which the Chart does from its series.",
    "Items are 32px tall and grow to 44px on touch screens, and a pressed item fills as rows do. Focus shows the 2px ring outside the item, only for the keyboard.",
    "Only color changes, on the instant tier, so there is nothing to reduce under reduced motion.",
  ],
};

/* ---------------------------------------------------------------- data */

const WEEKS = ["1 Sep", "8 Sep", "15 Sep", "22 Sep", "29 Sep", "6 Oct", "13 Oct", "20 Oct"];
const ACTIVITY: ChartSeries[] = [
  { name: "Builds", values: [42, 38, 51, 47, 55, 49, 61, 58] },
  { name: "Previews", values: [18, 22, 19, 25, 21, 28, 26, 31] },
  { name: "Deploys", values: [9, 11, 8, 12, 10, 14, 13, 15] },
  { name: "Rollbacks", values: [1, 0, 2, 1, 0, 1, 0, 1] },
];

/* ---------------------------------------------------------------- demos */

function ChartDemo() {
  const items: LegendItem[] = ACTIVITY.map((s) => ({ name: s.name }));
  const hues = legendHues(items);
  const [hidden, setHidden] = useState<string[]>([]);
  /* Pin each series' hue from the whole list, so Previews stays amber when Builds is hidden. */
  const shown = ACTIVITY.filter((s) => !hidden.includes(s.name)).map((s) => ({ ...s, hue: hues[s.name] }));
  return (
    <div className="grid w-full max-w-2xl gap-4">
      <Legend label="Series" items={items} hidden={hidden} onHiddenChange={setHidden} />
      <BarChart label="Activity per week, last 8 weeks" labels={WEEKS} series={shown} unit="runs" xTitle="Week" hues legend={false} />
    </div>
  );
}

const total = (values: number[]) => values.reduce((sum, v) => sum + v, 0).toLocaleString("en-GB");

function TotalsDemo() {
  const visits: ChartSeries[] = [
    { name: "Studio site", values: [1240, 1310, 1180, 1420, 1510, 1470, 1630, 1580] },
    { name: "Journal", values: [620, 580, 710, 690, 760, 820, 790, 860] },
    { name: "Shop", values: [310, 340, 290, 360, 410, 380, 450, 470] },
  ];
  const items: LegendItem[] = visits.map((s) => ({ name: s.name, value: total(s.values) }));
  const hues = legendHues(items);
  const [hidden, setHidden] = useState<string[]>(["Shop"]);
  const shown = visits.filter((s) => !hidden.includes(s.name)).map((s) => ({ ...s, hue: hues[s.name] }));
  return (
    <div className="grid w-full max-w-2xl gap-4">
      <Legend label="Sites" items={items} hidden={hidden} onHiddenChange={setHidden} />
      <LineChart label="Visits per week by site" labels={WEEKS} series={shown} unit="visits" xTitle="Week" hues legend={false} />
    </div>
  );
}

function PinnedDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-6">
      <Legend
        label="Kinds of file"
        items={[
          { name: "Video", hue: "violet", value: "58 GB" },
          { name: "Images", hue: "teal", value: "24 GB" },
          { name: "Documents", value: "6 GB" },
          { name: "Fonts", value: "3 GB" },
        ]}
      />
      <Legend
        label="Kinds of file this week"
        defaultHidden={["Documents"]}
        items={[
          { name: "Images", hue: "teal", value: "4.2 GB" },
          { name: "Documents", value: "1.1 GB" },
          { name: "Fonts", value: "0.4 GB" },
        ]}
      />
    </div>
  );
}

function LastOneDemo() {
  return (
    <Legend
      label="Clients"
      defaultHidden={["Northwind", "Halcyon"]}
      items={[{ name: "Arcadia" }, { name: "Northwind" }, { name: "Halcyon" }]}
    />
  );
}

export default function LegendPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Driving a chart"
        tier="instant"
        code="ChartDemo"
        caption="The Legend holds which series are hidden, and the page passes the shown ones to the chart. Hide Builds, and Previews stays amber, because each series keeps the hue it took from the whole list. A press changes color only, on the instant tier: the swatch turns to the grey track and the name steps down. The chart redraws at once."
      >
        <ChartDemo />
      </Stage>

      <Stage
        title="With totals"
        tier="instant"
        code="TotalsDemo"
        caption="A reading after each name, in mono, helps you pick: here each site's visits over the eight weeks. Shop starts hidden. The reading keeps its ink either way, and only the name and the swatch change color, so the box never changes size."
      >
        <TotalsDemo />
      </Stage>

      <Stage
        title="Set hues"
        tier="instant"
        code="PinnedDemo"
        caption="Pin a hue and a kind keeps it across the page. Images are teal in both rows, and the kinds without a pin take the next hues in the fixed order. These two drive nothing, so each holds its own hidden list."
      >
        <PinnedDemo />
      </Stage>

      <Stage
        title="The last one stays"
        tier="instant"
        code="LastOneDemo"
        caption="A chart with nothing on it says nothing, so the last shown series cannot be hidden. Arcadia is the only one shown: pressing it does nothing, and a screen reader hears why. It keeps its tab stop. Alt with a click, or Alt and Enter, shows only the item you pressed."
      >
        <LastOneDemo />
      </Stage>
    </Page>
  );
}
