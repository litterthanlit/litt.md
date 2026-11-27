import { useState } from "react";
import { Segmented } from "@/components/segmented";
import { Sparkline } from "@/components/sparkline";
import { Stat, StatGroup } from "@/components/stat";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";
import { useSelfRun } from "../self-run";

export const meta: PageMeta = {
  id: "stat",
  title: "Stat",
  lede: "One figure, in a tile.",
  ledeByWorld: {
    heat: "One figure in a cell, under a striped label band.",
    flat: "One figure on a paper card, that rolls to a new value.",
  },
  order: 9.03, group: "Data",
  summary:
    "A number tile for one figure: a small label, the value large in the sans with tabular numbers, an optional delta in words and an optional trend at the foot. Green and red are for news only. A group of tiles measures itself, and nothing about a tile moves.",
  summaryByWorld: {
    flat: "A paper card for one figure: a small label, the value standing up in the ink with tabular numbers (28px in a row of cards, 44px when the card stands alone), an optional delta in words and an optional trend at the foot. Bad news is a word in the danger colour, and nothing is a dot. When the value changes, each digit rolls to its new figure on its own spring, the rightmost first; the first paint is still.",
    heat: "A telemetry slab for one figure: the label on a striped band, the value in its own square cell with tabular numbers, an optional delta in words and an optional trend at the foot. Green and red are for news only. A group of tiles measures itself, and nothing about a tile moves.",
  },
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

/* ---------- Flat's tile: one count on its own paper card, the large figure (v1.22) ---------- */

/** On Flat's wall readers arrive by themselves, now and then one leaves, until a hand arrives. */
const READERS_RUN = [3, 1, 5, -1, 2, 4, 1, -1];

function ReadersTile() {
  const [readers, setReaders] = useState(12_480);
  const run = useSelfRun((n) => setReaders((r) => r + READERS_RUN[n % READERS_RUN.length]), { every: 2600 });
  return (
    <div ref={run.ref} className="w-full max-w-xs">
      <Stat
        label="Subscribers"
        value={readers.toLocaleString("en-US")}
        delta={`Up ${(readers - 11_240).toLocaleString("en-US")} this month`}
        tone="good"
      />
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): a shoot's week in figures ---------- */

function ShootStatsDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat label="Scenes" value={12} delta="Up 2 on last week" tone="good" />
        <Stat label="Takes this week" value={38} delta="Up 12% on last week" tone="good" />
        <Stat label="Median take" value={41} unit="s" delta="Down 6 s on last week" tone="good" />
        <Stat label="Card A left" value={62} unit="%" />
      </StatGroup>
    </div>
  );
}

function ClipsDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat label="Median take" value={41} unit="s" delta="Down 6 s on last week" tone="good" />
        <Stat label="Clipped takes" value={3} delta="Up 2 on last week" tone="bad" />
        <Stat label="Takes this week" value={38} delta="Same as last week" />
        <Stat label="Cards" value={9} />
      </StatGroup>
    </div>
  );
}

/** Takes per day for 14 days; the last seven add up to the 38 on the tile. */
const TAKES = [5, 6, 4, 7, 6, 2, 4, 3, 1, 8, 5, 7, 9, 5];
/** Median take length per day in seconds, against a goal of 45. */
const TAKE_LENGTH = [47, 46, 48, 45, 46, 44, 45, 43, 44, 42, 43, 40, 42, 41];
/** Clipped takes per day; the last seven add up to the 3 on the tile. */
const CLIPPED = [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0];

function TakesTrendDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat label="Takes this week" value={38} delta="Up 12% on last week" tone="good" trend={<Sparkline label="Takes per day, last 14 days" values={TAKES} />} />
        <Stat
          label="Median take"
          value={41}
          unit="s"
          trend={<Sparkline label="Median take length, last 14 days" values={TAKE_LENGTH} formatValue={(v) => v + " s"} baseline={45} />}
        />
        <Stat
          label="Clipped takes"
          value={3}
          delta="Up 2 on last week"
          tone="bad"
          trend={<Sparkline label="Clipped takes per day, last 14 days" values={CLIPPED} />}
        />
        <Stat label="Cards" value={9} />
      </StatGroup>
    </div>
  );
}

function ShootNarrowDemo() {
  return (
    <div className="grid w-full max-w-3xl items-start gap-8 sm:grid-cols-[22rem_16rem]">
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">A group 22rem wide</p>
        <StatGroup>
          <Stat label="Scenes" value={12} />
          <Stat label="Takes this week" value={38} delta="Up 12% on last week" tone="good" />
          <Stat label="Median take" value={41} unit="s" />
          <Stat label="Card A left" value={62} unit="%" />
        </StatGroup>
      </div>
      <div className="grid gap-2">
        <p className="text-caption font-normal text-fg-subtle">A group 16rem wide</p>
        <StatGroup>
          <Stat label="Scenes" value={12} />
          <Stat label="Median take" value={41} unit="s" delta="Down 6 s on last week" tone="good" />
        </StatGroup>
      </div>
    </div>
  );
}

function TakesTile() {
  return (
    <div className="w-full max-w-xs">
      <Stat label="Takes this week" value={38} delta="Up 12% on last week" tone="good" trend={<Sparkline label="Takes per day, last 14 days" values={TILE_DEPLOYS} />} />
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): a small site's week in figures ---------- */

type Period = "today" | "week" | "all";

const READER_PERIODS: Record<Period, { label: string; value: string; delta: string }> = {
  today: { label: "Today", value: "38", delta: "Up 12 on yesterday" },
  week: { label: "This week", value: "412", delta: "Up 64 on last week" },
  all: { label: "All time", value: "12,480", delta: "Up 1,240 this month" },
};

/** A newsletter's subscriber count on its own card: pick a period and the figure rolls to it, digit by digit. */
function SubscriberCountDemo() {
  const [period, setPeriod] = useState<Period>("all");
  const shown = READER_PERIODS[period];
  return (
    <div className="grid w-full max-w-xs justify-items-center gap-4">
      <div className="w-full">
        <Stat label="Subscribers" value={shown.value} delta={shown.delta} tone="good" />
      </div>
      <Segmented
        legend="Period"
        size="sm"
        value={period}
        onValueChange={setPeriod}
        options={(Object.keys(READER_PERIODS) as Period[]).map((value) => ({ value, label: READER_PERIODS[value].label }))}
      />
    </div>
  );
}

function LetterNewsDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat label="Time on a post" value={4} unit="min" delta="Up 30 s on last week" tone="good" />
        <Stat label="Unsubscribed" value={3} delta="Up 2 on last week" tone="bad" />
        <Stat label="Replies this week" value={14} delta="Same as last week" />
        <Stat label="Series" value={3} />
      </StatGroup>
    </div>
  );
}

/* ---------- Heat's own (proposals/heat.md): session telemetry, speed trap, and bounty figures ---------- */

const HEAT_SPEEDS = [294, 298, 301, 305, 303, 309, 307, 311, 310, 314, 312, 316, 315, 318];
const HEAT_LAPS = [73.4, 73.1, 72.8, 72.9, 72.5, 72.2, 72.3, 72.0, 71.9, 71.8, 71.7, 71.6, 71.5, 71.4];
const HEAT_INFRACTIONS = [1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 1, 2, 1];

function RaceStatTile() {
  return (
    <div className="w-full max-w-xs">
      <Stat
        label="Top speed"
        value={318}
        unit="km/h"
        delta="Up 9 km/h on last run"
        tone="good"
        trend={<Sparkline label="Top speed per run, last 14 runs" values={HEAT_SPEEDS} formatValue={(v) => `${v} km/h`} />}
      />
    </div>
  );
}

function RaceStatsDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat label="Best lap" value="1:11.4" delta="Down 0.25 s on session" tone="good" />
        <Stat label="Top speed" value={318} unit="km/h" delta="Up 9 km/h on last run" tone="good" />
        <Stat label="Bounty" value="142,500" delta="Up 24,000 tonight" tone="good" />
        <Stat label="Heat level" value="×3" />
      </StatGroup>
    </div>
  );
}

function RaceNewsDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat label="Best lap" value="1:11.4" delta="Down 0.25 s on session" tone="good" />
        <Stat label="Infractions" value={6} delta="Up 2 in pursuit" tone="bad" />
        <Stat label="Clean laps" value={14} delta="Same as last night" />
        <Stat label="Blacklist rank" value="#4" />
      </StatGroup>
    </div>
  );
}

function RaceTrendDemo() {
  return (
    <div className="w-full max-w-3xl">
      <StatGroup>
        <Stat
          label="Top speed"
          value={318}
          unit="km/h"
          delta="Up 9 km/h on last run"
          tone="good"
          trend={<Sparkline label="Top speed per run, last 14 runs" values={HEAT_SPEEDS} formatValue={(v) => `${v} km/h`} />}
        />
        <Stat
          label="Lap pace"
          value="71.4"
          unit="s"
          trend={<Sparkline label="Lap time, last 14 laps" values={HEAT_LAPS} formatValue={(v) => `${v} s`} baseline={72} />}
        />
        <Stat
          label="Infractions"
          value={6}
          delta="Up 2 in pursuit"
          tone="bad"
          trend={<Sparkline label="Infractions per pursuit, last 14 pursuits" values={HEAT_INFRACTIONS} />}
        />
        <Stat label="Blacklist rank" value="#4" />
      </StatGroup>
    </div>
  );
}

export default function StatPage() {
  return (
    <Page meta={meta} docs={docs} tile={<StatTile />} tileByWorld={{ device: <TakesTile />, flat: <ReadersTile />, heat: <RaceStatTile /> }}>
      <Stage
        title="The studio this week"
        code="StudioStatsDemo"
        byWorld={{
          flat: {
            demo: <SubscriberCountDemo />,
            title: "Subscribers",
            code: "SubscriberCountDemo",
            caption:
              "One count on its own paper card, so its figure is the large one. Pick a period and each digit rolls to its new figure on its own spring, the rightmost first: forward through nine to nought when the count goes up, as a counter carries, and back when it goes down. It moves only when the value changes, and a screen reader reads the number itself.",
          },
          device: {
            demo: <ShootStatsDemo />,
            title: "The shoot this week",
            code: "ShootStatsDemo",
            caption:
              "Four tiles in a group. The label is engraved and quiet, the value is the largest thing on the tile, in seven segments on its LCD, and a delta says what changed in words. The tiles in a row share its height, so the one without a delta stays level with the others. Nothing here moves, and a tile has no hover because it links nowhere.",
          },
          heat: {
            demo: <RaceStatsDemo />,
            title: "Session telemetry",
            code: "RaceStatsDemo",
            caption:
              "Four Heat telemetry slabs framed by corner marks and a diagonal hazard-stripe header band. Best lap, Top speed, Bounty and Heat level share one height across the row.",
          },
        }}
        caption="Four tiles in a group. The label is small and quiet, the value is the largest thing on the tile, and a delta says what changed in words. The tiles in a row share its height, so the one without a delta stays level with the others. Nothing here moves, and a tile has no hover because it links nowhere."
      >
        <StudioStatsDemo />
      </Stage>

      <Stage
        title="Good news, bad news, no news"
        code="NewsDemo"
        byWorld={{
          flat: {
            demo: <LetterNewsDemo />,
            code: "LetterNewsDemo",
            caption:
              "A change that is good news is the ink and one that is bad warns in the danger colour, whichever way the number went; a change that is neither stays in the quiet grey. Time on a post that rose is good news, and readers who left are bad. Nothing stands before the words, no dot and no arrow: they carry the direction, and a screen reader also hears whether it was good or bad.",
          },
          device: {
            demo: <ClipsDemo />,
            code: "ClipsDemo",
            caption:
              "Device has no green: a change that is good news is the ink, and one that is bad, here takes that clipped, is red, the colour it keeps for a fault, whichever way the number went. A take length that fell is good news, and clipped takes that rose are bad. A change that is neither stays in the subtle grey. The words carry the direction, and a screen reader also hears whether it was good or bad.",
          },
          heat: {
            demo: <RaceNewsDemo />,
            code: "RaceNewsDemo",
            caption:
              "Green marks a faster lap and red marks extra infractions, while clean laps and rank stay neutral. Words always carry the direction.",
          },
        }}
        caption="Green is for a change that is good news and red for one that is bad, whichever way the number went. A build time that fell is green, and failed deploys that rose are red. A change that is neither stays in the subtle gray. The words carry the direction, and a screen reader also hears whether it was good or bad."
      >
        <NewsDemo />
      </Stage>

      <Stage
        title="A trend at the foot"
        code="TrendDemo"
        byWorld={{
          device: {
            demo: <TakesTrendDemo />,
            code: "TakesTrendDemo",
            caption:
              "A tile can hold a trend: pass a Sparkline as the trend prop. It sits at the very bottom of the tile, under the delta, and fills the tile's width. The median take tile has no delta and the cards tile has no trend, and the lines that exist still sit level, because every tile in a row shares its height and the trend takes the foot. The figure stays above it, since the line shows shape and not values.",
          },
          heat: {
            demo: <RaceTrendDemo />,
            code: "RaceTrendDemo",
            caption:
              "Each slab pairs its figure with Heat's floor-rising telemetry bar Sparkline at the foot, the latest bar lit in amber.",
          },
        }}
        caption="A tile can hold a trend: pass a Sparkline as the trend prop. It sits at the very bottom of the tile, under the delta, and fills the tile's width. The median build tile has no delta and the clients tile has no trend, and the lines that exist still sit level, because every tile in a row shares its height and the trend takes the foot. The figure stays above it, since the line shows shape and not values."
      >
        <TrendDemo />
      </Stage>

      <Stage
        title="A narrow group"
        align="start"
        code="NarrowDemo"
        byWorld={{ device: { demo: <ShootNarrowDemo />, code: "ShootNarrowDemo" } }}
        caption="The group measures its own width, not the window's. At 22rem it stays two across, and under 20rem it drops to one. The same group works in a phone-wide frame, beside a sidebar and on a full page. Four across needs 40rem."
      >
        <NarrowDemo />
      </Stage>

      <TryIt of="Stat" component={Stat} props={{ label: "Median build", value: "41", unit: "s", delta: "Down 6 s on last week" }} />
    </Page>
  );
}
