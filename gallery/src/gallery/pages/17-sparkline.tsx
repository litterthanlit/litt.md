import { Sparkline } from "@/components/sparkline";
import { Stat, StatGroup } from "@/components/stat";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "sparkline",
  title: "Sparkline",
  lede: "A trend in one thin line.",
  order: 10.02,
  group: "Charts",
  summary:
    "A trend in one thin line, with no axes, gridlines or labels: a 2px line in the foreground or a data hue, a dot on the latest value and an optional dashed baseline. It sits beside a figure or in a table row. It is static, and it shows shape, not values.",
  fun: "The line draws itself and its dot lands as the pen reaches it.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["sparkline"],
  exports: ["Sparkline"],
  usage: `import { Sparkline } from "@/components/sparkline";
import { Stat } from "@/components/stat";

// Beside a figure. The Stat's trend slot sits at the foot of the tile, so the trends in a row line up.
<Stat
  label="Median build"
  value={41}
  unit="s"
  delta="Down 6 s on last week"
  tone="good"
  trend={
    <Sparkline
      label="Median build time, last 14 days"
      values={[47, 46, 48, 45, 46, 44, 45, 43, 44, 42, 43, 40, 42, 41]}
      formatValue={(v) => v + " s"}
      baseline={45}
    />
  }
/>

// A hue, when the color says which quantity this is.
<Sparkline label="Deploys per day, last 14 days" values={deploys} hue="blue" />

// In a table cell, give it a box with a width, and fix the scale so the rows compare.
<div className="w-40">
  <Sparkline label="Northwind visits per day, last 14 days" values={visits} hue="blue" min={0} max={2400} />
</div>`,
  use: [
    "A figure already says where things stand, and the shape of the last days or weeks is worth a glance beside it: median build time over two weeks, deploys per day, uptime.",
    "A table row needs a pattern next to its numbers, such as visits per day for each Framer site. Fix `min` and `max` so the rows share one scale and compare.",
    "A goal or an average decides whether the latest value is good news. Pass `baseline` and the dashed line shows which side of it the trend is on.",
    "The line sits in a card, a tile, a table cell or a list row. It fills the width of its box, and you set the height.",
  ],
  skip: [
    "The reader needs the values, a tooltip, axes or labels. Use a Chart.",
    "A handful of amounts are compared. Use a Bar chart, which puts the values on a scale the eye can measure.",
    "The figure is progress toward a limit, such as storage used. Use a Meter.",
    "You want the line to draw itself in on load. Litt does not animate a sparkline: new data redraws at once.",
  ],
  a11y: [
    "The SVG is role=\"img\" named by a summary built from your label and `formatValue`, such as \"Median build time, last 14 days: from 47 s to 41 s, low 40 s, high 48 s, baseline 45 s\". Pass `summary` to say something better.",
    "It is not interactive: no tab stop and no tooltip, so a keyboard or screen reader user loses nothing a pointer user has. A sparkline shows shape, not values, so always put the exact figure beside it, in a Stat or a table cell.",
    "Color is never the only signal. A hue says which quantity the line is, and the shape and the summary say the rest. The line and the dot reach 3:1 against a card in light and dark, and the dot's text tone reaches 4.5:1.",
    "The dot sits on a 2px ring in the surface color, so it reads on a busy row. Pass `surface` when the sparkline is not on a card, a tile or a table, so the ring matches.",
    "Nothing moves, so there is nothing to reduce under reduced motion.",
    "The caller must give the line a box with a width. In a table cell or a flex row that means a wrapper such as w-40, because a cell sizes itself from its content.",
  ],
};

/* ----------------------------------------------------------------- data

   Fixed arrays, so the same picture renders on the server, the client and in a screenshot. Oldest first. */

/** Deploys per day for 14 days. The last seven add up to the 38 on the tile. */
const DEPLOYS = [5, 6, 4, 7, 6, 2, 4, 3, 1, 8, 5, 7, 9, 5];
/** Median build time per day in seconds. It fell from 47 to 41, against a goal of 45. */
const BUILD = [47, 46, 48, 45, 46, 44, 45, 43, 44, 42, 43, 40, 42, 41];
/** Uptime per day in percent, with one bad day. */
const UPTIME = [99.99, 100, 99.98, 99.99, 99.95, 99.62, 99.98, 99.99, 100, 99.99, 99.97, 99.98, 99.99, 99.98];

const seconds = (v: number) => v + " s";
const percent = (v: number) => v + "%";

type Site = { name: string; visits: number[] };
/** Visits per day for 14 days: weekdays busy, weekends quiet. */
const SITES: Site[] = [
  { name: "Grotta Type", visits: [1450, 1520, 1380, 1610, 1700, 1250, 1180, 1590, 1740, 1980, 2210, 2340, 1890, 1770] },
  { name: "Northwind site", visits: [820, 940, 1010, 880, 760, 410, 380, 910, 1080, 1160, 990, 1040, 520, 470] },
  { name: "Marlow Labs", visits: [640, 610, 590, 560, 540, 300, 280, 520, 500, 470, 450, 430, 240, 210] },
  { name: "Atelier Nord", visits: [310, 290, 340, 360, 300, 150, 140, 320, 380, 410, 395, 450, 210, 180] },
  { name: "Sidebar Weekly", visits: [90, 110, 85, 130, 120, 60, 55, 125, 140, 135, 160, 150, 80, 70] },
];

/** Median reply time to clients in hours, over 30 days. The goal is 4 h. */
const REPLY = [
  3.2, 3.8, 4.4, 5.1, 4.2, 3.6, 3.1, 2.9, 3.4, 4.6, 5.3, 4.8, 4.1, 3.7, 3.3, 3.0, 3.5, 4.2, 4.9, 4.4, 3.8, 3.4, 3.1, 2.8, 3.2, 3.9, 4.3, 3.7,
  3.3, 2.9,
];
const hours = (v: number) => v + " h";

/** Page views per day on litt.design, for the side-by-side stage. */
const VIEWS = [812, 640, 1204, 903, 771, 698, 540, 480, 960, 1120, 1010, 890, 1240, 1180];

/* ----------------------------------------------------------------- demos */

function BesideAFigureDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat
          label="Deploys this week"
          value={38}
          delta="Up 12% on last week"
          tone="good"
          trend={<Sparkline label="Deploys per day, last 14 days" values={DEPLOYS} hue="blue" />}
        />
        <Stat
          label="Median build"
          value={41}
          unit="s"
          delta="Down 6 s on last week"
          tone="good"
          trend={<Sparkline label="Median build time, last 14 days" values={BUILD} formatValue={seconds} baseline={45} />}
        />
        <Stat
          label="Uptime"
          value="99.98"
          unit="%"
          trend={<Sparkline label="Uptime, last 14 days" values={UPTIME} hue="teal" formatValue={percent} />}
        />
        <Stat label="Active projects" value={12} delta="Up 2 on last month" tone="good" />
      </StatGroup>
    </div>
  );
}

function InATableDemo() {
  return (
    <div className="w-full min-w-0 max-w-3xl">
      <Table label="Visits per site, last 14 days">
        <TableHeader>
          <TableRow>
            <TableHead>Site</TableHead>
            <TableHead>Visits per day</TableHead>
            <TableHead numeric>Last 14 days</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SITES.map((site) => (
            <TableRow key={site.name}>
              <TableCell primary>{site.name}</TableCell>
              <TableCell>
                <div className="w-40">
                  <Sparkline label={`${site.name} visits per day, last 14 days`} values={site.visits} hue="blue" min={0} max={2400} />
                </div>
              </TableCell>
              <TableCell numeric>{site.visits.reduce((sum, v) => sum + v, 0).toLocaleString("en-GB")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function GoalLineDemo() {
  return (
    <div className="grid w-full max-w-xl gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-small text-fg">Median reply time</span>
        <span className="text-caption font-normal tabular-nums text-fg-subtle">2.9 h today, goal 4 h</span>
      </div>
      <Sparkline label="Median reply time, last 30 days" values={REPLY} formatValue={hours} baseline={4} height={64} />
    </div>
  );
}

function QuietAndHueDemo() {
  return (
    <div className="grid w-full max-w-xl gap-x-12 gap-y-8 sm:grid-cols-2">
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">Quiet, the default</p>
        <Sparkline label="Page views per day, last 14 days" values={VIEWS} height={48} />
      </div>
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">In a hue</p>
        <Sparkline label="Page views per day, last 14 days" values={VIEWS} hue="blue" height={48} />
      </div>
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): a recorder's week on the library's dashboard, in the ink ---------- */

/** Takes per day for 14 days. The last seven add up to the 38 on the tile. */
const TAKES = [5, 6, 4, 7, 6, 2, 4, 3, 1, 8, 5, 7, 9, 5];
/** The median take's peak per day in dBFS. It came down from −4 to −7, under a ceiling of −6. */
const PEAK = [-4, -5, -4, -6, -5, -6, -5, -6, -7, -6, -7, -8, -7, -7];
/** Card A used at the end of each day, in percent. Offloaded and formatted on day 9. */
const CARD = [12, 21, 30, 41, 48, 51, 58, 66, 4, 15, 27, 38, 52, 62];

/** A true minus, as the LCD writes it. */
const signed = (v: number) => (v < 0 ? "−" + Math.abs(v) : String(v));
const dbfs = (v: number) => signed(v) + " dBFS";

type Channel = { name: string; minutes: number[] };
/** Minutes recorded per day on each channel for 14 days: shoot days busy, rest days quiet. */
const CHANNELS: Channel[] = [
  { name: "Boom", minutes: [182, 196, 171, 205, 214, 40, 36, 199, 221, 236, 228, 240, 120, 96] },
  { name: "Lav 1", minutes: [150, 168, 142, 176, 181, 22, 18, 160, 175, 188, 170, 182, 84, 70] },
  { name: "Lav 2", minutes: [96, 110, 88, 120, 104, 12, 10, 98, 112, 126, 118, 131, 60, 44] },
  { name: "Room L", minutes: [60, 58, 64, 70, 62, 30, 28, 66, 71, 75, 68, 80, 40, 32] },
  { name: "Room R", minutes: [20, 24, 18, 26, 22, 8, 6, 24, 28, 25, 30, 27, 12, 10] },
];

/** The noise floor per day in dB, over 30 days. The ceiling is −60 dB. */
const FLOOR = [
  -64, -62, -59, -57, -61, -63, -65, -66, -63, -58, -56, -58, -61, -63, -64, -66, -63, -60, -57, -59, -62, -64, -65, -67, -64, -61, -59, -62,
  -64, -66,
];
const db = (v: number) => signed(v) + " dB";

function CardWeekDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat label="Takes this week" value={38} delta="Up 12% on last week" tone="good" trend={<Sparkline label="Takes per day, last 14 days" values={TAKES} />} />
        <Stat
          label="Median peak"
          value="−7"
          unit="dBFS"
          delta="Down 1 dB on last week"
          tone="good"
          trend={<Sparkline label="Median peak per take, last 14 days" values={PEAK} formatValue={dbfs} baseline={-6} />}
        />
        <Stat label="Card A used" value={62} unit="%" trend={<Sparkline label="Card A used, last 14 days" values={CARD} formatValue={(v) => v + "%"} min={0} max={100} />} />
        <Stat label="Scenes" value={12} delta="Up 2 on last week" tone="good" />
      </StatGroup>
    </div>
  );
}

function ChannelsDemo() {
  return (
    <div className="w-full min-w-0 max-w-3xl">
      <Table label="Minutes recorded per channel, last 14 days">
        <TableHeader>
          <TableRow>
            <TableHead>Channel</TableHead>
            <TableHead>Minutes per day</TableHead>
            <TableHead numeric>Last 14 days</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CHANNELS.map((channel) => (
            <TableRow key={channel.name}>
              <TableCell primary>{channel.name}</TableCell>
              <TableCell>
                <div className="w-40">
                  <Sparkline label={`${channel.name} minutes per day, last 14 days`} values={channel.minutes} min={0} max={240} />
                </div>
              </TableCell>
              <TableCell numeric>{channel.minutes.reduce((sum, v) => sum + v, 0).toLocaleString("en-GB")} min</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function NoiseFloorDemo() {
  return (
    <div className="grid w-full max-w-xl gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-small text-fg">Noise floor</span>
        <span className="text-caption font-normal tabular-nums text-fg-subtle">−66 dB today, ceiling −60 dB</span>
      </div>
      <Sparkline label="Noise floor, last 30 days" values={FLOOR} formatValue={db} baseline={-60} height={64} />
    </div>
  );
}

function TakesQuietDemo() {
  return (
    <div className="grid w-full max-w-xl gap-x-12 gap-y-8 sm:grid-cols-2">
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">Quiet, the default</p>
        <Sparkline label="Takes per day, last 14 days" values={TAKES} height={48} />
      </div>
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">In a hue</p>
        <Sparkline label="Takes per day, last 14 days" values={TAKES} hue="blue" height={48} />
      </div>
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): a small site's week in figures ---------- */

/** Readers a day for 14 days; the last seven add up to the 1,204 on the tile. */
const READERS = [142, 160, 151, 170, 158, 149, 166, 171, 158, 180, 166, 175, 190, 164];
/** Median minutes on a post, last 14 days. */
const READ_TIME = [3.4, 3.6, 3.5, 3.8, 3.6, 3.9, 3.7, 4.1, 3.9, 4.2, 4, 4.3, 4.1, 4];
const minutes = (v: number) => v + " min";
/** Share of the letter opened, last 14 issues. */
const OPENED = [55, 57, 59, 61, 57, 62, 64, 66, 61, 59, 62, 71, 64, 68];

function SiteWeekDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat
          label="Readers this week"
          value="1,204"
          delta="Up 86 on last week"
          tone="good"
          trend={<Sparkline label="Readers a day, last 14 days" values={READERS} hue="blue" />}
        />
        <Stat
          label="Time on a post"
          value={4}
          unit="min"
          delta="Up 30 s on last week"
          tone="good"
          trend={<Sparkline label="Median minutes on a post, last 14 days" values={READ_TIME} formatValue={minutes} baseline={3.5} />}
        />
        <Stat
          label="Letter opened"
          value={68}
          unit="%"
          trend={<Sparkline label="Share of the letter opened, last 14 issues" values={OPENED} hue="teal" formatValue={percent} />}
        />
        <Stat label="Subscribers" value={412} delta="Up 12 on last month" tone="good" />
      </StatGroup>
    </div>
  );
}

export default function SparklinePage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Beside a figure"
        code="BesideAFigureDemo"
        byWorld={{
          flat: {
            demo: <SiteWeekDemo />,
            title: "A site's week",
            code: "SiteWeekDemo",
            caption:
              "Three of the four tiles carry a trend in the Stat's trend slot. It sits at the foot of the tile, so the lines stay level even though the opened tile has no delta. Readers are blue and the letter's opens are teal, because each color names one quantity. Time on a post stays in the foreground, with a dashed line at its 3.5 min mark. The dot on the latest day is the strongest mark, as in the line chart. The figure above each line is the exact reading, because a sparkline shows shape, not values. Nothing moves.",
          },
          device: {
            demo: <CardWeekDemo />,
            code: "CardWeekDemo",
            caption:
              "Three of the four tiles carry a trend in the Stat's trend slot. It sits at the foot of the tile, so the lines stay level even though the card tile has no delta. Every line is the ink, because Device's charts take no hue. The peak has a dashed line at its −6 dBFS ceiling, and the card drops to 4% on the day it was offloaded. The dot on the latest day is the strongest mark, as in the line chart. The figure above each line is the exact reading, because a sparkline shows shape, not values. Nothing moves.",
          },
        }}
        caption="Three of the four tiles carry a trend in the Stat's trend slot. It sits at the foot of the tile, so the lines stay level even though the uptime tile has no delta. Deploys are blue and uptime is teal, because each color names one quantity. The build time stays in the foreground, with a dashed line at its 45 s goal. The dot on the latest day is the strongest mark, as in the line chart. The figure above each line is the exact reading, because a sparkline shows shape, not values. Nothing moves."
      >
        <BesideAFigureDemo />
      </Stage>

      <Stage
        title="In a table"
        code="InATableDemo"
        byWorld={{
          device: {
            demo: <ChannelsDemo />,
            code: "ChannelsDemo",
            caption:
              "Minutes recorded per day on each channel, one sparkline per row. Every row shares one scale, from 0 to 240 minutes, so a quiet channel reads as quiet. Without a fixed scale each line would fill its own box and Room R would look as busy as the boom. The total sits in its own column in tabular figures, for the exact figure.",
          },
        }}
        caption="Visits per day for each Framer site, one sparkline per row. Every row shares one scale, from 0 to 2,400, so a quiet site reads as quiet. Without a fixed scale each line would fill its own box and Sidebar Weekly would look as lively as Grotta Type. The column measures one thing, so it is one hue. The total sits in its own column in tabular figures, for the exact figure."
      >
        <InATableDemo />
      </Stage>

      <Stage
        title="A goal line"
        code="GoalLineDemo"
        byWorld={{
          device: {
            demo: <NoiseFloorDemo />,
            title: "A ceiling",
            code: "NoiseFloorDemo",
            caption:
              "One wide sparkline of the noise floor with a dashed baseline at the −60 dB ceiling. The line stays in the foreground, because the point is which side of the ceiling each day falls on, and the dashed line is a neutral line. The default scale includes the baseline, so it never leaves the box. The reading and the ceiling are written beside it, for the same reason as before.",
          },
        }}
        caption="One wide sparkline of reply time with a dashed baseline at the 4 h goal. The line stays in the foreground, because the point is which side of the goal each day falls on, and the dashed line is a neutral line, not a hue. The default scale includes the baseline, so it never leaves the box. The reading and the goal are written beside it, for the same reason as before."
      >
        <GoalLineDemo />
      </Stage>

      <Stage
        title="Quiet and in a hue"
        code="QuietAndHueDemo"
        byWorld={{
          device: {
            demo: <TakesQuietDemo />,
            code: "TakesQuietDemo",
            caption:
              "The same takes per day twice. The quiet default is the foreground at 55% with a full-strength dot, right when the line is the only series in view. Device's charts take no hue, so a line given one is drawn in the ink and reads the same: the shape carries it either way.",
          },
        }}
        caption="The same page views twice. The quiet default is the foreground at 55% with a full-strength dot, right when the line is the only series in view. A hue is for when the color says which quantity this is elsewhere on the page. The line takes the hue's mark tone and the dot its stronger text tone. The shape is the same either way."
      >
        <QuietAndHueDemo />
      </Stage>

    </Page>
  );
}
