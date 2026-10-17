import { Stat, StatGroup } from "@/components/stat";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "stat",
  title: "Stat",
  order: 15.5, group: "Layout and data",
  summary:
    "A number tile for one figure: a small label, the value large in the sans with tabular numbers, and an optional delta in words. Green and red are for news only. A group of tiles measures itself, and nothing about a tile moves.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["stat"],
  exports: ["Stat", "StatGroup"],
  usage: `import { Stat, StatGroup } from "@/components/stat";

// A row of tiles. The group measures its own width: two across, four across from 40rem.
<StatGroup>
  <Stat label="Active projects" value={12} />
  <Stat label="Deploys this week" value={38} delta="Up 12% on last week" tone="good" />
  <Stat label="Median build" value={41} unit="s" delta="Down 6 s on last week" tone="good" />
  <Stat label="Uptime" value="99.98" unit="%" delta="Same as last week" />
</StatGroup>

// Say the direction in words. The tone says whether it is good or bad news, which is not the same thing.
<Stat label="Failed deploys" value={3} delta="Up 2 on last week" tone="bad" />`,
  use: [
    "One number is the point of the tile: how many, how long, how much. Four to eight of them sit at the top of a dashboard.",
    "A change since last time is worth a line. Say it in words, such as \"Up 12% on last week\".",
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

function NarrowDemo() {
  return (
    <div className="grid w-full max-w-3xl items-start gap-8 sm:grid-cols-[22rem_16rem]">
      <div className="grid gap-2">
        <p className="font-mono text-caption text-fg-subtle">A group 22rem wide</p>
        <StatGroup>
          <Stat label="Active projects" value={12} />
          <Stat label="Deploys this week" value={38} delta="Up 12% on last week" tone="good" />
          <Stat label="Median build" value={41} unit="s" />
          <Stat label="Uptime" value="99.98" unit="%" />
        </StatGroup>
      </div>
      <div className="grid gap-2">
        <p className="font-mono text-caption text-fg-subtle">A group 16rem wide</p>
        <StatGroup>
          <Stat label="Active projects" value={12} />
          <Stat label="Median build" value={41} unit="s" delta="Down 6 s on last week" tone="good" />
        </StatGroup>
      </div>
    </div>
  );
}

export default function StatPage() {
  return (
    <Page meta={meta} docs={docs}>
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
        title="A narrow group"
        align="start"
        code="NarrowDemo"
        caption="The group measures its own width, not the window's. At 22rem it stays two across, and under 20rem it drops to one. The same group works in a phone-wide frame, beside a sidebar and on a full page. Four across needs 40rem."
      >
        <NarrowDemo />
      </Stage>
    </Page>
  );
}
