import { useState } from "react";
import { DotPlot } from "@/components/dot-plot";
import { Segmented } from "@/components/segmented";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "dot-plot",
  title: "Dot plot",
  lede: "Where most values fall, in stacks of dots.",
  order: 17.6,
  group: "Data",
  verbs: ["hover"],
  summary:
    "A distribution drawn as stacks of dots, mirrored about a center line, so you see where most values fall. With a goal, dots inside it take a data hue and the rest stay gray. The median is a line, an outlier can be named, and the legend gives the shares in numbers.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["dot-plot"],
  exports: ["DotPlot"],
  usage: `import { DotPlot } from "@/components/dot-plot";

// Reply times in minutes on a log axis, split at a four hour goal.
// The label names the image and builds its summary.
<DotPlot
  label="Reply times"
  values={replyMinutes}
  scale="log"
  domain={[3, 4320]}
  ticks={[
    { value: 5, label: "5m" },
    { value: 60, label: "1h" },
    { value: 240, label: "4h" },
    { value: 1440, label: "1d" },
  ]}
  formatValue={duration}
  unit={["reply", "replies"]}
  goal={240}
  goalLabel="4 h goal"
  markers={[{ value: 1980, label: "Rui · 33 h" }]}
/>

// No goal: every dot takes the hue. Linear, in seconds.
<DotPlot
  label="Build times"
  values={buildSeconds}
  hue="teal"
  formatValue={(v) => \`\${Math.round(v)} s\`}
  unit={["build", "builds"]}
/>`,
  use: [
    "You have dozens to thousands of values and want the shape: where most fall, how long the tail is, and how many are past a goal. Reply times, build times, page weights.",
    "A goal splits the values into two groups, and the share on each side is the point. Dots inside it take a hue, the rest stay gray.",
    "One value deserves a name, such as the slowest reply. A marker rings it on the center line and keeps its label on show.",
    "The width varies. It measures its container and draws a bin every 8px, so a phone gets fewer, wider bins.",
    "The values run from minutes to days. A log axis gives each order of magnitude the same room.",
  ],
  skip: [
    "You compare a handful of categories. Use a BarChart.",
    "You follow change over time. Use a LineChart.",
    "The exact numbers matter more than the shape. Use a Table.",
    "You have fewer than about thirty values. A dot per value is easy to count, but a list or a bar chart says it more plainly.",
    "You need more than one distribution on one axis, or a continuous density curve. Litt draws one set of dots and has no area.",
  ],
  keyboard: [
    [["Tab"], "Moves to the plot as one stop, on the bin that holds the median. Tab again leaves it."],
    [["ArrowRight", "ArrowDown"], "Moves to the next bin that has dots and shows its tooltip."],
    [["ArrowLeft", "ArrowUp"], "Moves to the previous bin that has dots."],
    [["Home", "End"], "Goes to the first or the last bin that has dots."],
    [["Esc"], "Hides the tooltip without moving focus. It returns when you move to another bin."],
  ],
  a11y: [
    "The drawing is an image (role=\"img\") named by a summary, such as \"Reply times, 412 replies: median 1 h 5 m, 84% within the 4 h goal\". Pass `summary` to say something better.",
    "A visually hidden table lists every bin that has dots with its range and true count, then the median, the goal and each marker, so a screen reader can read the numbers without the picture.",
    "There is a hidden button per bin that has dots, in a labelled group outside the image. Each is named by its range and count (\"1 h to 1 h 5 m: 12 replies\"), and the tooltip repeats that, so it is hidden from screen readers.",
    "Color is never the only signal. The goal is a dashed line with a label, the median is a line with a label, the legend gives both shares as numbers, and the tooltip and the table give the counts. The gray past the goal and the hue before it both reach 3:1 on the card in light and dark.",
    "Moving by keyboard shows the tooltip and draws a 2px focus ring around the stack. The ring uses the focus color, so it passes 3:1 in both themes.",
    "On touch a finger scrubs: the bin under it shows its tooltip, which stays until the next touch elsewhere. The pointer target is the whole plot, so a bin narrower than a finger is no problem, and a vertical drag still scrolls the page.",
    "Under reduced motion the dots appear at once. Hover and focus change color only.",
  ],
};

/* ---------------------------------------------------------------- data
   A seeded log-normal, so the plot is the same on every render and every machine. */

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

/** `count` values with the given median and spread, kept between `lo` and `hi`, to one decimal. */
function logNormal(seed: number, count: number, median: number, sigma: number, lo: number, hi: number) {
  const next = seeded(seed);
  return Array.from({ length: count }, () => {
    const z = Math.sqrt(-2 * Math.log(Math.max(next(), 1e-9))) * Math.cos(2 * Math.PI * next());
    return Math.round(Math.min(hi, Math.max(lo, median * Math.exp(sigma * z))) * 10) / 10;
  });
}

const middle = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

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

const RUI = 1980; // 33 h, the slowest reply of the fortnight
const VIP = logNormal(11, 152, 38, 0.95, 3, 1300);
const TEAM = [...logNormal(12, 259, 100, 1.1, 3, 1700), RUI];
const REPLIES = { all: [...VIP, ...TEAM], vip: VIP, team: TEAM };
type Who = keyof typeof REPLIES;

const REPLY_TICKS = [
  { value: 5, label: "5m" },
  { value: 60, label: "1h" },
  { value: 240, label: "4h" },
  { value: 1440, label: "1d" },
  { value: 2880, label: "2d" },
];

function ReplySpeedDemo() {
  const [who, setWho] = useState<Who>("all");
  const values = REPLIES[who];
  return (
    <div className="grid w-full max-w-3xl gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="grid gap-1">
          <span className="text-small text-fg-subtle">Reply speed, 14 days</span>
          <span className="flex items-baseline gap-2">
            <span className="text-h3 tabular-nums text-fg">{duration(middle(values))}</span>
            <span className="text-small text-fg-subtle">median</span>
          </span>
        </p>
        <Segmented
          legend="Replies from"
          size="sm"
          value={who}
          onValueChange={setWho}
          options={[
            { value: "all", label: "All" },
            { value: "vip", label: "VIP" },
            { value: "team", label: "Team" },
          ]}
        />
      </div>
      <DotPlot
        label="Reply times"
        values={values}
        scale="log"
        domain={[3, 4320]}
        ticks={REPLY_TICKS}
        formatValue={duration}
        unit={["reply", "replies"]}
        goal={240}
        goalLabel="4 h goal"
        markers={who === "vip" ? [] : [{ value: RUI, label: "Rui · 33 h" }]}
      />
    </div>
  );
}

const BUILDS = logNormal(7, 240, 41, 0.2, 18, 90);

function BuildTimesDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-8">
      <p className="grid gap-1">
        <span className="text-small text-fg-subtle">Framer site builds, 14 days</span>
        <span className="flex items-baseline gap-2">
          <span className="text-h3 tabular-nums text-fg">{Math.round(middle(BUILDS))} s</span>
          <span className="text-small text-fg-subtle">median</span>
        </span>
      </p>
      <DotPlot
        label="Build times"
        values={BUILDS}
        domain={[20, 80]}
        hue="teal"
        formatValue={(v) => `${Math.round(v)} s`}
        unit={["build", "builds"]}
      />
    </div>
  );
}

function PhoneDemo() {
  return (
    <div className="w-full max-w-[22.375rem]">
      <DotPlot
        label="Reply times"
        values={REPLIES.all}
        scale="log"
        domain={[3, 4320]}
        ticks={REPLY_TICKS}
        formatValue={duration}
        unit={["reply", "replies"]}
        goal={240}
        goalLabel="4 h goal"
        markers={[{ value: RUI, label: "Rui · 33 h" }]}
      />
    </div>
  );
}

export default function DotPlotPage() {
  const [reply, replayReply] = useReplay();
  const [build, replayBuild] = useReplay();
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Reply speed"
        tier="responsive"
        size="lg"
        code="ReplySpeedDemo"
        onReplay={replayReply}
        caption="Each column is a slice of reply time on a log axis, so minutes and days share the plot, and its dots stack out from the center line. Blue is within the four hour goal and gray is past it. The blue line is the median. Rui's reply is one dot, ringed and named. Hover or arrow to a column for its range and count. The switch redraws at once. The plot fades in once, on the responsive tier. Replay it to watch."
      >
        <ReplySpeedDemo key={reply} />
      </Stage>

      <Stage
        title="Build times"
        tier="responsive"
        size="lg"
        code="BuildTimesDemo"
        onReplay={replayBuild}
        caption="With no goal there is nothing to split, so every dot takes the hue, here teal. The axis is linear, in seconds. When a column holds more items than the plot is tall, a dot stands for several and the legend says how many."
      >
        <BuildTimesDemo key={build} />
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        align="start"
        code="PhoneDemo"
        caption="The plot fills its container, so a phone gets fewer, wider columns, and each dot stands for more replies. Tick labels that would touch are left out, and the marker's label stays inside the plot. Touch the plot and drag along it: the column under your finger shows its tooltip, which stays until you touch elsewhere. A vertical drag still scrolls the page."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
