import { Breakdown, type BreakdownHue, type BreakdownItem } from "@/components/breakdown";
import { Stat } from "@/components/stat";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "breakdown",
  title: "Breakdown",
  order: 17.35,
  group: "Data",
  summary: "One whole split into its parts on a thin rail, with a row or a legend entry per part. Only the parts take a hue.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["breakdown"],
  exports: ["Breakdown"],
  usage: `import { Breakdown } from "@/components/breakdown";

// One whole in its parts, largest first. A total above the sum shows the rest as free space.
// totalText is the reading at the end of the header, and formatValue writes every value.
<Breakdown
  label="Storage"
  total={100}
  totalText="91 of 100 GB"
  formatValue={(v) => v + " GB"}
  items={[
    { label: "Video", value: 58 },
    { label: "Images", value: 24 },
    { label: "Documents", value: 6 },
    { label: "Fonts", value: 3 },
  ]}
/>

// No total: the whole is the sum. unit is said after each number to screen readers: "1,240 credits".
<Breakdown
  label="Credits this month"
  unit={["credit", "credits"]}
  items={[
    { label: "Builds", value: 1240 },
    { label: "Preview links", value: 860 },
  ]}
/>

// Pin a hue so a kind keeps its color wherever it appears. The legend layout is for a tile.
<Breakdown
  layout="legend"
  label="Storage"
  items={[{ label: "Images", value: 24, hue: "teal" }, { label: "Fonts", value: 3, hue: "amber" }]}
/>`,
  use: [
    "One whole is the point, and its parts add up to it: storage by file type, credits by feature, time by project, spend by client.",
    "The parts are a handful, in a known order, with the largest first. The split rail shows how they share the whole, and each row gives the exact reading.",
    "The whole is a limit with room left, such as a 100 GB plan. Pass the total and the free space shows as the last segment.",
    "The same kinds appear in several places on a page. Pin a hue to each kind and it keeps its color everywhere.",
    "A tile or a narrow panel has no room for rows. The legend layout keeps the split rail and wraps the entries.",
  ],
  skip: [
    "One value against a limit. Use a Meter, or a Gauge when the figure is the centerpiece.",
    "A ranking of many items by size. Use a Bar list, which scales to its largest value and takes any number of rows.",
    "The parts change over time. Use a Chart with a series per part.",
    "More than five or six parts matter. The rest fold into Other, so show a Table when each one needs its own line.",
  ],
  a11y: [
    "The split rail is an image named by a summary that says the whole and every part: \"Storage, 91 of 100 GB: Video 58 GB, Images 24 GB, Documents 6 GB, Fonts 3 GB, 9 GB free\". The segments are marks and carry no text.",
    "In rows, the list is named by the label, and each part is a list item with a meter named by its label, with a min of 0, the whole as its max, the value as its now and the reading as its text: \"Images, 24 GB, 24%\". The visible header and the visible reading are hidden from assistive tech, so nothing is read twice.",
    "In the legend, the entries are a list read as the label and the value, \"Video, 58 GB\".",
    "Color is never the only signal. Every part has its label and its number, and the rows and the legend follow the split rail's order. Marks reach 3:1 against the card in light and dark, and Other is the foreground at 55%.",
    "Pass a unit, or a formatValue that writes one, so a screen reader hears \"1,240 credits\" and not a bare number. A long label truncates and the reading never does, so keep the full name in the label.",
    "It has no hover, no focus stop and no motion, so touch loses nothing and there is nothing to reduce under reduced motion.",
  ],
};

const gb = (v: number) => v + " GB";

function StorageDemo() {
  return (
    <Breakdown
      className="w-full max-w-md"
      label="Storage"
      total={100}
      totalText="91 of 100 GB"
      formatValue={gb}
      items={[
        { label: "Video", value: 58, hue: "violet" },
        { label: "Images", value: 24, hue: "teal" },
        { label: "Documents", value: 6, hue: "blue" },
        { label: "Fonts", value: 3, hue: "amber" },
      ]}
    />
  );
}

function CreditsDemo() {
  return (
    <Breakdown
      className="w-full max-w-md"
      label="Credits this month"
      totalText="2,930 credits"
      unit={["credit", "credits"]}
      items={[
        { label: "Builds", value: 1240 },
        { label: "Preview links", value: 860 },
        { label: "Image resizing", value: 410 },
        { label: "Analytics", value: 220 },
        { label: "Forms", value: 140 },
        { label: "Webhooks", value: 60 },
      ]}
    />
  );
}

function TileDemo() {
  return (
    <div className="flex w-full min-w-0 max-w-3xl flex-wrap items-stretch justify-center gap-4">
      <div className="grid w-48">
        <Stat label="Sites live" value={14} delta="Up 2 on last month" tone="good" />
      </div>
      <div className="litt-raised w-80 min-w-0 max-w-full rounded-surface p-4">
        <Breakdown
          layout="legend"
          label="Storage"
          total={100}
          totalText="91 of 100 GB"
          formatValue={gb}
          items={[
            { label: "Video", value: 58, hue: "violet" },
            { label: "Images", value: 24, hue: "teal" },
            { label: "Documents", value: 6, hue: "blue" },
            { label: "Fonts", value: 3, hue: "amber" },
          ]}
        />
      </div>
    </div>
  );
}

/** Each kind of file has one hue on this page, wherever it shows up. */
const KIND_HUE: Record<string, BreakdownHue> = { Video: "violet", Images: "teal", Documents: "blue", Fonts: "amber" };
const kind = (label: string, value: number): BreakdownItem => ({ label, value, hue: KIND_HUE[label] });

function PinnedDemo() {
  return (
    <div className="grid w-full max-w-3xl gap-12 sm:grid-cols-2">
      <Breakdown
        label="All projects"
        total={100}
        totalText="91 of 100 GB"
        formatValue={gb}
        items={[kind("Video", 58), kind("Images", 24), kind("Documents", 6), kind("Fonts", 3)]}
      />
      <Breakdown
        label="Uploaded this week"
        totalText="5.7 GB"
        formatValue={gb}
        items={[kind("Images", 4.2), kind("Documents", 1.1), kind("Fonts", 0.4)]}
      />
    </div>
  );
}

export default function BreakdownPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Storage by kind"
        code="StorageDemo"
        caption="A 4px split rail has a segment per part, as wide as its share of the plan, with 2px of air between them. The last grey segment is the free space. Under it each part is a row in the Meter's anatomy: the label, the reading with its share, and a thin rail filled in the part's hue. The track, the words and the numbers stay neutral, so color only says which part is which. The rows follow the segments' order, so the order says it too. Nothing animates."
      >
        <StorageDemo />
      </Stage>

      <Stage
        title="Credits by feature"
        code="CreditsDemo"
        caption="No total is passed, so the whole is the sum and there is no free space. Parts without a hue take the next one in the fixed order: blue, amber, teal, violet, rose. Only five exist and none is cycled, so the sixth feature folds into Other, in the foreground at 55%. Sort the parts largest first, because the ones past the fifth are the ones that fold."
      >
        <CreditsDemo />
      </Stage>

      <Stage
        title="In a tile"
        code="TileDemo"
        caption="The legend layout is for a tile or a narrow panel. It keeps the split rail and replaces the rows with a wrapping row of entries: a 12px swatch rail in the hue, the label and the value. Here it sits in a raised box 20rem wide beside a Stat, as it would in a dashboard row, and it wraps to another line as the box narrows."
      >
        <TileDemo />
      </Stage>

      <Stage
        title="Set hues"
        code="PinnedDemo"
        caption="Pin a hue to a kind and it keeps its color wherever it shows up. Images are teal in both Breakdowns, even though the second has no video. Without the pins, images would take blue there and amber above, and the same kind would change color from one panel to the next. A hue is never reused for another part in the same Breakdown: setting it twice logs an error in development, and the second part takes the next free hue."
      >
        <PinnedDemo />
      </Stage>
    </Page>
  );
}
