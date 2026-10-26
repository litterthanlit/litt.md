import { Gauge } from "@/components/gauge";
import { Page, Stage, TryIt, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "gauge",
  title: "Gauge",
  lede: "One value against a range.",
  order: 17.5,
  group: "Data",
  summary:
    "One value against a range, drawn as a semicircle of fine ticks with the figure in the opening. The ticks up to the value take the foreground or one data hue, and the last one is longer to mark the value. It is static, like the meter.",
  fun: "The ticks sweep to the value with a needle's weight, and the figure counts with them.",
  tiers: [],
};

export const docs: PageDocs = {
  components: ["gauge"],
  exports: ["Gauge"],
  usage: `import { Gauge } from "@/components/gauge";

// A hue colors the ticks up to the value. The label names the meter, and valueText is what it announces.
<Gauge
  label="Credits left"
  value={20830}
  max={30000}
  valueText="20,830 credits"
  figure="20,830"
  caption="2k a day on average"
  hue="teal"
/>

// No hue is the quiet default: the ticks are the foreground.
<Gauge label="Storage" value={42} max={100} valueText="42 of 100 GB" figure="42 GB" caption="of 100 GB" />

// The width is \`size\`. The gauge scales down to fit a narrower box and never exceeds it.
<Gauge label="Build minutes" value={1380} max={3000} valueText="1,380 of 3,000" size={160} />`,
  use: [
    "One number is the point and it sits against a limit or a range: credits left, storage used, a quota.",
    "The figure should be the largest thing in the view, with the arc as its frame.",
    "The reading is quiet by default. Add a data hue when the quantity needs a color of its own next to other panels.",
    "The gauge sits in a card, a tile or a sidebar. It scales to its box.",
  ],
  skip: [
    "A thin bar is enough, or the value shares a row with a label. Use a Meter.",
    "The point is the change since last time. Use a Stat with a delta.",
    "You need several values or a trend. Use a Chart.",
    "The value should sweep or count up on load. Litt does not animate a figure.",
  ],
  a11y: [
    "The gauge is role=\"meter\" with the label as its name, a min, a max, a now and the value text, so a screen reader hears \"Credits left, 20,830 credits\". The caption is its description.",
    "The ticks and the text over them are hidden from assistive tech, so nothing is read twice. Always pass a value text that says the unit, because the figure alone may be a bare number.",
    "The filled part is a color and a length. The longer, stronger tick marks the value, so the reading does not depend on telling the hue from the grey. The figure says the number in words.",
    "The ticks are marks, so they reach 3:1 against the card in light and dark. The empty ticks are fg at 12% on purpose and carry no meaning of their own.",
    "The gauge has no hover, no focus stop and no motion, so nothing changes under reduced motion.",
    "Under about 200px there is room for a short label and the figure, not a caption. Pass none there.",
  ],
};

function CreditsDemo() {
  return (
    <Gauge
      label="Credits left"
      value={20830}
      max={30000}
      valueText="20,830 credits"
      figure="20,830"
      caption="2k a day on average"
      hue="teal"
    />
  );
}

function StorageDemo() {
  return <Gauge label="Storage" value={42} max={100} valueText="42 of 100 GB" figure="42 GB" caption="of 100 GB" />;
}

function SizesDemo() {
  return (
    <div className="flex w-full flex-wrap items-end justify-center gap-x-16 gap-y-12">
      <div className="grid w-full max-w-40 gap-2">
        <Gauge label="Minutes" value={1380} max={3000} valueText="1,380 of 3,000 minutes" figure="1,380" size={160} hue="teal" />
        <p className="tabular-nums text-caption font-normal text-fg-subtle">160 wide</p>
      </div>
      <div className="grid w-full max-w-80 gap-2">
        <Gauge
          label="Build minutes"
          value={1380}
          max={3000}
          valueText="1,380 of 3,000 minutes"
          figure="1,380"
          caption="of 3,000 this month"
          size={320}
          hue="teal"
        />
        <p className="tabular-nums text-caption font-normal text-fg-subtle">320 wide</p>
      </div>
      <div className="grid w-full max-w-[17.5rem] gap-2">
        <Gauge
          label="Build minutes"
          value={1380}
          max={3000}
          valueText="1,380 of 3,000 minutes"
          figure="1,380"
          caption="of 3,000 this month"
          size={320}
          hue="teal"
        />
        <p className="tabular-nums text-caption font-normal text-fg-subtle">A 320 gauge in a box 17.5rem wide</p>
      </div>
    </div>
  );
}

export default function GaugePage() {
  return (
    <Page meta={meta} docs={docs} tile={<Gauge label="Credits left" value={20830} max={30000} valueText="20,830 credits" figure="20,830" caption="2k a day on average" hue="teal" size={200} />}>
      <Stage
        title="Credits left"
        code="CreditsDemo"
        caption="Forty-eight fine ticks over a half circle. The ticks up to the value are the teal mark tone, the rest are the foreground at 12%, and the last filled tick reaches 4px further out in the stronger teal text tone, where a needle would have been. The label sits above the figure and a caption below, in the opening. Teal says this is the quantity, and the figure and the words say how much. Nothing glows and nothing moves."
      >
        <CreditsDemo />
      </Stage>

      <Stage
        title="Storage"
        code="StorageDemo"
        caption="With no hue the ticks are the foreground, the quiet default for a single quantity. The figure can read shorter than the value text: it says 42 GB, and a screen reader hears 42 of 100 GB. The caption carries the limit."
      >
        <StorageDemo />
      </Stage>

      <Stage
        title="Sizes"
        code="SizesDemo"
        caption="The width is a prop, and the tick length follows it. The 160 gauge has room for a short label and the figure only. The last one is a 320 gauge in a box 17.5rem wide: the drawing scales down to the box and never passes it, while the text stays at its own size and stays sharp, because it is set in HTML over the SVG."
      >
        <SizesDemo />
      </Stage>

      <TryIt of="Gauge" component={Gauge} props={{ label: "Build minutes", value: 62 }} derive={(v) => ({ valueText: `${v.value} of 100 minutes used` })} controls={[{ name: "value", type: "number", min: 0, max: 100, step: 1 }, "hue", "label"]} />
    </Page>
  );
}
