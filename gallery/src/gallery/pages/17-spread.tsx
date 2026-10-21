import { Spread, type SpreadItem } from "@/components/spread";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "spread",
  title: "Spread",
  lede: "How values spread, one rail per row.",
  order: 17.65,
  group: "Data",
  summary:
    "How values spread, one thin rail per row on a shared scale. The full range is faint, the middle half takes a data hue and the median is a tick, with the median in mono at the end. The rails line up, a goal is a dashed line through every row, and nothing moves.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["spread"],
  exports: ["Spread"],
  usage: `import { Spread } from "@/components/spread";

// Rows from raw values: the component works out the range, the middle half and the median.
// The label names the list. Each row reads "Halo site: median 39 s, middle half 33 s to 49 s, range 25 s to 67 s".
<Spread
  label="Build times by site"
  items={[
    { label: "Halo site", values: haloBuildSeconds },
    { label: "Northwind", values: northwindBuildSeconds },
  ]}
  formatValue={(v) => \`\${Math.round(v)} s\`}
/>

// Durations from minutes to days on a log scale, with a goal. A row whose median is past it says so.
<Spread
  label="Reply times by client"
  scale="log"
  domain={[2, 3000]}
  ticks={[
    { value: 10, label: "10 m" },
    { value: 60, label: "1 h" },
    { value: 360, label: "6 h" },
    { value: 1440, label: "1 d" },
  ]}
  formatValue={duration}
  hue="teal"
  goal={240}
  goalLabel="4 h goal"
  items={clients}
/>

// Numbers an API has already worked out: pass the five of them instead of the values.
<Spread
  label="Largest paint by page"
  hue="violet"
  formatValue={(v) => \`\${v.toFixed(1)} s\`}
  items={[{ label: "/work", min: 1.1, p25: 1.6, median: 2, p75: 2.6, max: 4.1 }]}
/>`,
  use: [
    "You compare how values spread across a handful of rows: build times by site, reply times by client, load times by page. The rail shows where the middle half falls and how far the tail runs, and the median is the number.",
    "Each row has many values, or five numbers from an API: the smallest, the quartiles, the median and the largest.",
    "The rows must be read against each other, so they share one scale and a goal line runs through all of them.",
    "The values run from minutes to days. A log scale gives each order of magnitude the same room.",
    "The width varies. It measures its own box, and under 28rem the label moves above its rail.",
  ],
  skip: [
    "You want the shape of one distribution, with every value drawn. Use a Dot plot.",
    "You compare one quantity per row, such as a count. Use a Bar list.",
    "You follow change over time. Use a Chart, or a Sparkline for a trend with no axes.",
    "You have two or three values per row. A row of five numbers needs enough values behind it to mean something.",
    "The exact numbers matter more than the picture. Use a Table.",
  ],
  a11y: [
    "The list is named by its label, and each row is one item that reads in words: \"Halo site: median 39 s, middle half 33 s to 49 s, range 25 s to 67 s\", with \", past the 4 h goal\" added when the median is past the goal. The words are built from the visible label and median plus hidden text.",
    "The rails, the tick labels and the goal line are hidden from screen readers. They are a picture of the numbers, and the numbers are in each row's words. Pass a goalLabel that names the goal (\"4 h goal\"), because a row past it says \"past the 4 h goal\".",
    "Color is never the only signal. The legend says what each mark is in words (\"Faint: the full range. Blue: the middle half. Tick: the median.\"), the median is a tick and a number, and a row past the goal says so in words and keeps its hue, because the hue means the measure.",
    "Nothing is pressable and nothing is revealed on hover, so there is no focus stop, and touch loses nothing. Nothing moves, so there is nothing to reduce.",
    "Pass a formatValue that includes the unit (\"39 s\"), or a unit, so the numbers are never read bare. A row with no values reads \"No data\".",
  ],
};

/* ---------------------------------------------------------------- data
   Seeded log-normals, so the rails are the same on every render and every machine. */

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

/** `count` whole numbers with the given median and spread, kept between `lo` and `hi`. */
function logNormal(seed: number, count: number, median: number, sigma: number, lo: number, hi: number) {
  const next = seeded(seed);
  return Array.from({ length: count }, () => {
    const z = Math.sqrt(-2 * Math.log(Math.max(next(), 1e-9))) * Math.cos(2 * Math.PI * next());
    return Math.round(Math.min(hi, Math.max(lo, median * Math.exp(sigma * z))));
  });
}

/** Minutes as "12 m", "1 h 16 m" or "1 d 9 h". */
function duration(minutes: number) {
  const t = Math.round(minutes);
  if (t < 60) return `${t} m`;
  if (t < 1440) {
    const m = t % 60;
    return m ? `${Math.floor(t / 60)} h ${m} m` : `${t / 60} h`;
  }
  const d = Math.floor(t / 1440);
  const h = Math.round((t % 1440) / 60);
  return h === 24 ? `${d + 1} d` : h ? `${d} d ${h} h` : `${d} d`;
}

/* Build times in seconds, one set of builds per Framer site. */
const BUILD_TIMES: SpreadItem[] = [
  { label: "Halo site", values: logNormal(11, 48, 41, 0.22, 14, 100) },
  { label: "Northwind", values: logNormal(12, 52, 29, 0.28, 14, 100) },
  { label: "Marlow Labs", values: logNormal(13, 36, 58, 0.2, 14, 100) },
  { label: "Atlas portfolio", values: logNormal(14, 44, 37, 0.18, 14, 100) },
  { label: "Sidebar Weekly", values: logNormal(15, 30, 49, 0.25, 14, 100) },
  { label: "Grotta Type", values: logNormal(16, 56, 23, 0.16, 14, 100) },
];

/* Reply times in minutes, one client past the four hour goal. */
const REPLY_TIMES: SpreadItem[] = [
  { label: "Northwind", values: logNormal(21, 60, 26, 0.8, 2, 2400) },
  { label: "Halden Gallery", values: logNormal(22, 48, 55, 0.9, 2, 2400) },
  { label: "Marlow Labs", values: logNormal(23, 40, 95, 0.85, 2, 2400) },
  { label: "Ines Duarte", values: logNormal(24, 36, 150, 0.9, 2, 2400) },
  { label: "Atlas Studio", values: logNormal(25, 28, 330, 1, 2, 2400) },
];

const REPLY_TICKS = [
  { value: 10, label: "10 m" },
  { value: 60, label: "1 h" },
  { value: 360, label: "6 h" },
  { value: 1440, label: "1 d" },
];

/* Largest contentful paint in seconds, as an API would send it: five numbers per page. */
const PAINT_TIMES: SpreadItem[] = [
  { label: "/", min: 0.9, p25: 1.2, median: 1.5, p75: 1.9, max: 2.8 },
  { label: "/work", min: 1.1, p25: 1.6, median: 2, p75: 2.6, max: 4.1 },
  { label: "/work/halden-gallery", min: 1.4, p25: 2.1, median: 2.7, p75: 3.3, max: 5.2 },
  { label: "/journal", min: 0.8, p25: 1, median: 1.3, p75: 1.6, max: 2.2 },
  { label: "/contact", min: 0.7, p25: 0.9, median: 1.1, p75: 1.3, max: 1.9 },
];

function BuildTimesDemo() {
  return (
    <div className="w-full max-w-xl">
      <Spread label="Build times by site" items={BUILD_TIMES} formatValue={(v) => `${Math.round(v)} s`} />
    </div>
  );
}

function ReplyTimesDemo() {
  return (
    <div className="w-full max-w-xl">
      <Spread
        label="Reply times by client"
        items={REPLY_TIMES}
        scale="log"
        domain={[2, 3000]}
        ticks={REPLY_TICKS}
        formatValue={duration}
        hue="teal"
        goal={240}
        goalLabel="4 h goal"
      />
    </div>
  );
}

function PaintTimesDemo() {
  return (
    <div className="w-full max-w-sm">
      <Spread label="Largest paint by page" items={PAINT_TIMES} formatValue={(v) => `${v.toFixed(1)} s`} hue="violet" />
    </div>
  );
}

export default function SpreadPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Build times by site"
        size="lg"
        code="BuildTimesDemo"
        caption="Each row is one Framer site. The faint rail is its full range, the blue rail over it is the middle half of its builds, and the tick is the median, which is also the number at the end. Every rail sits on the same scale, so a slow site and a steady one read at a glance. The rails start and end at the same place and the medians line up. Nothing moves."
      >
        <BuildTimesDemo />
      </Stage>

      <Stage
        title="Reply times by client"
        size="lg"
        code="ReplyTimesDemo"
        caption="Reply times run from minutes to days, so the scale is logarithmic and each order of magnitude gets the same room. The dashed line is the four hour goal, labelled once under the rows. Atlas Studio's median is past it. It keeps its teal, because teal means the reply time and not good or bad, and its row says it is past the goal in words."
      >
        <ReplyTimesDemo />
      </Stage>

      <Stage
        title="From computed numbers"
        code="PaintTimesDemo"
        caption="When an API has already worked out the quartiles, pass them as min, p25, median, p75 and max instead of the values. This box is narrower than 28rem, so each label moves above its rail and the rail takes the full width. The scale and its ticks come from the data, rounded out to round numbers."
      >
        <PaintTimesDemo />
      </Stage>
    </Page>
  );
}
