import { Sparkline } from "@/components/sparkline";
import { Stat, StatGroup } from "@/components/stat";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "stat",
  title: "Stat",
  lede: "One figure, in a tile.",
  order: 17.2, group: "Data",
  summary:
    "A number tile for one figure: a small label, the value large in the sans with tabular numbers, an optional delta in words and an optional trend at the foot. Green and red are for news only. A group of tiles measures itself, and nothing about a tile moves.",
  fun: "The figure counts up with the same pen as the sparkline under it.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["stat"],
  exports: ["Stat", "StatGroup"],
  usage: `import { Sparkline } from "@/components/sparkline";
import { Stat, StatGroup } from "@/components/stat";

// A row of tiles. The group measures its own width: two across, four across from 40rem.
<StatGroup>
  <Stat label="Active projects" value={12} />
  <Stat label="Deploys this week" value={38} delta="Up 12% on last week" tone="good" />
  <Stat label="Median build" value={41} unit="s" delta="Down 6 s on last week" tone="good" />
  <Stat label="Uptime" value="99.98" unit="%" delta="Same as last week" />
</StatGroup>

// Say the direction in words. The tone says whether it is good or bad news, which is not the same thing.
<Stat label="Failed deploys" value={3} delta="Up 2 on last week" tone="bad" />

// A trend sits at the foot of the tile, under the delta. Pass a Sparkline, and keep the figure above it.
<Stat
  label="Deploys this week"
  value={38}
  delta="Up 12% on last week"
  tone="good"
  trend={<Sparkline label="Deploys per day, last 14 days" values={deploys} hue="blue" />}
/>`,
  use: [
    "One number is the point of the tile: how many, how long, how much. Four to eight of them sit at the top of a dashboard.",
    "A change since last time is worth a line. Say it in words, such as \"Up 12% on last week\".",
    "The shape of the last days or weeks is worth a glance beside the figure. Pass a Sparkline as `trend`: it sits at the foot of the tile, so the trends in a row line up whether or not a tile has a delta.",
    "The tiles share a row, and you want them to stay level when one has a delta and another does not.",
    "The set sits in a main area of any width. The group measures itself, so it works in a frame, on a phone and beside a sidebar.",
  ],
  skip: [
    "You need to compare values across a series. Use a Chart, or a Table when the numbers matter more than the shape.",
    "The tile should open something. Use a Card, which has a link and a hover.",
    "The figure is progress toward a limit, such as storage used. Use a Meter.",
    "You want the number to count up or change when you look at it. Litt does not animate a figure.",
  ],
  a11y: [
    "The group is a description list: each label is a term and its value is the description, so a screen reader reads \"Active projects, 12\".",
    "Color is never the only signal. The words in the delta say the direction, and a hidden \"good news\" or \"bad news\" says the judgment that the green or the red shows.",
    "Success and danger text reach 4.5:1 on the tile in light and dark. A neutral delta is fg-subtle, which does too.",
    "A trend is part of the same description, read after the value and the delta. A Sparkline in it is an image named by its summary, so the exact figure stays in the value above it.",
    "The tile has no hover, no focus stop and no motion, so there is nothing to reduce under reduced motion.",
    "Write the unit in the unit prop or in the label. A bare \"41\" says nothing.",
  ],
};

function StudioStatsDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat label="Active projects" value={12} delta="Up 2 on last month" tone="good" />
        <Stat label="Deploys this week" value={38} delta="Up 12% on last week" tone="good" />
        <Stat label="Median build" value={41} unit="s" delta="Down 6 s on last week" tone="good" />
        <Stat label="Uptime" value="99.98" unit="%" />
      </StatGroup>
    </div>
  );
}

function NewsDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat label="Median build" value={41} unit="s" delta="Down 6 s on last week" tone="good" />
        <Stat label="Failed deploys" value={3} delta="Up 2 on last week" tone="bad" />
        <Stat label="Deploys this week" value={38} delta="Same as last week" />
        <Stat label="Clients" value={9} />
      </StatGroup>
    </div>
  );
}

/** Deploys per day for 14 days; the last seven add up to the 38 on the tile. */
const DEPLOYS = [5, 6, 4, 7, 6, 2, 4, 3, 1, 8, 5, 7, 9, 5];
/** Median build time per day in seconds, against a goal of 45. */
const BUILD = [47, 46, 48, 45, 46, 44, 45, 43, 44, 42, 43, 40, 42, 41];
/** Failed deploys per day; the last seven add up to the 3 on the tile. */
const FAILED = [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0];

function TrendDemo() {
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
          trend={<Sparkline label="Median build time, last 14 days" values={BUILD} formatValue={(v) => v + " s"} baseline={45} />}
        />
        <Stat
          label="Failed deploys"
          value={3}
          delta="Up 2 on last week"
          tone="bad"
          trend={<Sparkline label="Failed deploys per day, last 14 days" values={FAILED} />}
        />
        <Stat label="Clients" value={9} />
      </StatGroup>
    </div>
  );
}

function NarrowDemo() {
  return (
    <div className="grid w-full max-w-3xl items-start gap-8 sm:grid-cols-[22rem_16rem]">
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">A group 22rem wide</p>
        <StatGroup>
          <Stat label="Active projects" value={12} />
          <Stat label="Deploys this week" value={38} delta="Up 12% on last week" tone="good" />
          <Stat label="Median build" value={41} unit="s" />
          <Stat label="Uptime" value="99.98" unit="%" />
        </StatGroup>
      </div>
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">A group 16rem wide</p>
        <StatGroup>
          <Stat label="Active projects" value={12} />
          <Stat label="Median build" value={41} unit="s" delta="Down 6 s on last week" tone="good" />
        </StatGroup>
      </div>
    </div>
  );
}

/* ---------- the overview's tile ---------- */

const TILE_DEPLOYS = [5, 7, 4, 9, 6, 1, 0, 6, 8, 5, 9, 7, 2, 1];

function StatTile() {
  return (
    <div className="w-full max-w-xs">
      <Stat
        label="Deploys this week"
        value={38}
        delta="Up 12% on last week"
        tone="good"
        trend={<Sparkline label="Deploys per day, last 14 days" values={TILE_DEPLOYS} hue="blue" />}
      />
    </div>
  );
}

export default function StatPage() {
  return (
    <Page meta={meta} docs={docs} tile={<StatTile />}>
      <Stage
        title="The studio this week"
        code="StudioStatsDemo"
        caption="Four tiles in a group. The label is small and quiet, the value is the largest thing on the tile, and a delta says what changed in words. The tiles in a row share its height, so the one without a delta stays level with the others. Nothing here moves, and a tile has no hover because it links nowhere."
      >
        <StudioStatsDemo />
      </Stage>

      <Stage
        title="Good news, bad news, no news"
        code="NewsDemo"
        caption="Green is for a change that is good news and red for one that is bad, whichever way the number went. A build time that fell is green, and failed deploys that rose are red. A change that is neither stays in the subtle gray. The words carry the direction, and a screen reader also hears whether it was good or bad."
      >
        <NewsDemo />
      </Stage>

      <Stage
        title="A trend at the foot"
        code="TrendDemo"
        caption="A tile can hold a trend: pass a Sparkline as the trend prop. It sits at the very bottom of the tile, under the delta, and fills the tile's width. The median build tile has no delta and the clients tile has no trend, and the lines that exist still sit level, because every tile in a row shares its height and the trend takes the foot. The figure stays above it, since the line shows shape and not values."
      >
        <TrendDemo />
      </Stage>

      <Stage
        title="A narrow group"
        align="start"
        code="NarrowDemo"
        caption="The group measures its own width, not the window's. At 22rem it stays two across, and under 20rem it drops to one. The same group works in a phone-wide frame, beside a sidebar and on a full page. Four across needs 40rem."
      >
        <NarrowDemo />
      </Stage>

      <TryIt of="Stat" component={Stat} props={{ label: "Median build", value: "41", unit: "s", delta: "Down 6 s on last week" }} />
    </Page>
  );
}
