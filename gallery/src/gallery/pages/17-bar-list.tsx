import { useState } from "react";
import { BarList, type BarListItem } from "@/components/bar-list";
import { Kbd } from "@/components/kbd";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "bar-list",
  title: "Bar list",
  lede: "A ranked list with a thin bar for each share.",
  order: 17.4,
  group: "Data",
  verbs: ["press"],
  summary:
    "A ranked list where each row carries a thin bar for its share: a label, a bar, a mono value and a change in words. The bars and values line up across rows, the list measures itself, and nothing about it moves.",
  fun: "Bars grow in rank order and their values count; change the data and rows slide past each other.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["bar-list"],
  exports: ["BarList"],
  usage: `import { BarList } from "@/components/bar-list";
import { Kbd } from "@/components/kbd";

// A ranked list. The label names it, and the bars share the largest value unless you pass max.
// unit is said after each number to screen readers: "Archive, 412 times".
<BarList
  label="Most-used shortcuts"
  unit={["time", "times"]}
  hue="blue"
  items={[
    { label: "Archive", value: 412, lead: <Kbd>E</Kbd> },
    { label: "Reply", value: 164, lead: <Kbd>R</Kbd> },
    { label: "Snooze", value: 31, lead: <Kbd>H</Kbd> },
  ]}
/>

// A change in words. The tone says whether it is good news, which is not the same as the direction.
<BarList
  label="Top repos"
  unit={["commit", "commits"]}
  items={[
    { label: "litt-studio/litt-design", value: 214, delta: "Up 15%", tone: "good" },
    { label: "litt-studio/halden-gallery", value: 168, delta: "Down 27%", tone: "bad" },
  ]}
/>

// A row with an href is a link. With onSelect, the other rows are buttons.
<BarList
  label="Pages by visits"
  unit={["visit", "visits"]}
  items={[{ label: "/work", value: 9870, href: "/work" }]}
  onSelect={(item, index) => track(item.label, index)}
/>`,
  use: [
    "A ranking is the point: top pages, most-used shortcuts, busiest repos, biggest clients. The bar shows each row's share, and the number gives the exact count.",
    "The rows have a short name, one number and perhaps a change. Add a lead (a key cap, an icon or a small avatar) when it helps the eye find the row.",
    "The list should work at any width. It measures its own box, so it fits a card, a sidebar and a phone.",
    "A row opens something. Give it an href or an onSelect and it becomes a link or a button.",
  ],
  skip: [
    "The numbers are the point and there are several columns. Use a Table, which lines up any number of columns.",
    "One value against a limit. Use a Meter, or a Gauge when the figure is the centerpiece.",
    "The shape over time matters. Use a Chart.",
    "More than a dozen rows. Show the top few and link to the rest, because a long ranking reads as noise.",
  ],
  keyboard: [
    [["Tab"], "Moves through the rows that are links or buttons. Static rows are skipped."],
    [["Enter"], "Follows a link row, or presses a button row."],
    [["Space"], "Presses a button row. A link row answers to Enter only."],
  ],
  a11y: [
    "The list is an ordered list named by its label, and each row is one item. A row reads as its label, its value with the unit and the change in words: \"Archive, 412 times\" or \"litt-studio/halden-gallery, 168 commits, Down 27%, bad news\".",
    "The bar is a picture of the number, so it is hidden from screen readers. The value is always written next to it.",
    "The lead is hidden from screen readers too. Put anything that matters in the label, because a key cap or an icon is not read.",
    "Color is never the only signal. A delta says the direction in words, and a hidden \"good news\" or \"bad news\" says what the green or the red shows. The hue of the bars is one meaning, the quantity.",
    "A link or button row is the whole row, at least 44px tall, with an inset focus ring in the focus color. A static row has no focus stop.",
    "Hover and press only change a fill, and nothing is revealed on hover, so touch loses nothing. Nothing moves, so there is nothing to reduce.",
  ],
};

function ShortcutsDemo() {
  return (
    <BarList
      className="max-w-xl"
      label="Most-used shortcuts"
      unit={["time", "times"]}
      hue="blue"
      items={[
        { label: "Archive", value: 412, lead: <Kbd>E</Kbd> },
        {
          label: "Next and previous",
          value: 388,
          lead: (
            <>
              <Kbd>J</Kbd>
              <Kbd>K</Kbd>
            </>
          ),
        },
        { label: "Reply", value: 164, lead: <Kbd>R</Kbd> },
        { label: "Snooze", value: 31, lead: <Kbd>H</Kbd> },
      ]}
    />
  );
}

function RepoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="text-fg-subtle"
    >
      <path d="M3.5 12.25V3.25a1.5 1.5 0 0 1 1.5-1.5h7.75v10.5H5a1.5 1.5 0 0 0-1.5 1.5v0A1.5 1.5 0 0 0 5 15.25h7.75" />
    </svg>
  );
}

const REPOS: BarListItem[] = [
  { label: "litt-studio/litt-design", value: 214, lead: <RepoIcon />, delta: "Up 15%", tone: "good" },
  { label: "litt-studio/halden-gallery", value: 168, lead: <RepoIcon />, delta: "Down 27%", tone: "bad" },
  { label: "litt-studio/marlow-launch", value: 131, lead: <RepoIcon />, delta: "Up 4%", tone: "good" },
  { label: "litt-studio/framer-templates", value: 96, lead: <RepoIcon />, delta: "No change" },
  { label: "litt-studio/atlas-portfolio", value: 42, lead: <RepoIcon />, delta: "Down 9%", tone: "bad" },
];

function ReposDemo() {
  return <BarList className="max-w-xl" label="Top repos by commits" unit={["commit", "commits"]} items={REPOS} />;
}

function PagesDemo() {
  return (
    <BarList
      className="max-w-xl"
      label="Pages by visits"
      unit={["visit", "visits"]}
      items={[
        { label: "/", value: 18240, href: "#bar-list" },
        { label: "/work", value: 9870, href: "#bar-list" },
        { label: "/work/halden-gallery", value: 6415, href: "#bar-list" },
        { label: "/journal", value: 4102, href: "#bar-list" },
        { label: "/contact", value: 1236, href: "#bar-list" },
      ]}
    />
  );
}

function NarrowDemo() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className="grid w-full max-w-[22.375rem] gap-4">
      <BarList label="Top repos by commits" unit={["commit", "commits"]} items={REPOS} onSelect={(item) => setOpened(item.label)} />
      <p aria-live="polite" className="min-h-5 font-mono text-caption font-normal text-fg-subtle">
        {opened ? `Opened ${opened}` : ""}
      </p>
    </div>
  );
}

const KINDS: BarListItem[] = [
  { label: "Video", value: 58, hue: "violet" },
  { label: "Images", value: 24, hue: "teal" },
  { label: "Documents", value: 9, hue: "blue" },
  { label: "Fonts", value: 3, hue: "amber" },
];

function KindsDemo() {
  return (
    <div className="w-full max-w-md">
      <BarList label="Storage by kind" items={KINDS} formatValue={(v) => `${v} GB`} max={100} />
    </div>
  );
}

/* ---------- the overview's tile ---------- */

function BarListTile() {
  return (
    <div className="w-full max-w-sm">
      <BarList
        label="Most-used shortcuts"
        unit={["time", "times"]}
        hue="blue"
        items={[
          { label: "Archive", value: 412, lead: <Kbd>E</Kbd> },
          { label: "Reply", value: 164, lead: <Kbd>R</Kbd> },
          { label: "Snooze", value: 31, lead: <Kbd>H</Kbd> },
        ]}
      />
    </div>
  );
}

export default function BarListPage() {
  return (
    <Page meta={meta} docs={docs} tile={<BarListTile />}>
      <Stage
        title="Most-used shortcuts"
        align="start"
        code="ShortcutsDemo"
        caption="Each row is a key cap, a name, a 4px rail and a count. The rail is the Meter's: a quiet track with the fill in the blue mark tone, as wide as the row's share of the largest count. Blue says these bars count presses and nothing else. The key caps sit in a lead column up to 48px wide, so two fit. Every bar starts and ends at the same place, and the counts line up on their right edge."
      >
        <ShortcutsDemo />
      </Stage>

      <Stage
        title="Top repos"
        align="start"
        code="ReposDemo"
        caption="With no hue the bars are the foreground, the quiet default. A small repo icon leads each row. The change is a word and a number at the caption size. Green is for news that is good and red for news that is bad, whichever way the number went, so a fall in commits on a repo you care about is red. A hidden good news or bad news says it for screen readers. One row has no news and stays gray."
      >
        <ReposDemo />
      </Stage>

      <Stage
        title="Pages by visits"
        align="start"
        code="PagesDemo"
        caption="A row with an href is a link. It fills with the foreground at 4% on hover, at the control radius, on the instant tier, and with 6% while a finger holds it. The fill is the only thing that changes, so the row never moves. The focus ring runs inside the row, because the rows are flush."
      >
        <PagesDemo />
      </Stage>

      <Stage
        title="Kinds in their hues"
        code="KindsDemo"
        caption="When the rows are kinds rather than one measure, each row can keep its own hue, the one that kind has everywhere on the page: video in violet, images in teal. The rails are drawn against the whole plan, so the empty track is the free space. One hue per kind, and the words and the numbers stay neutral."
      >
        <KindsDemo />
      </Stage>

      <Stage
        title="A narrow screen"
        align="start"
        code="NarrowDemo"
        caption="The list measures its own width, not the window's. Under 28rem the bar moves under the label at the full width of the row, while the key, the count and the change stay on the first line. A long name truncates. With an onSelect, rows without a link are buttons, at least 44px tall. Press one."
      >
        <NarrowDemo />
      </Stage>
    </Page>
  );
}
