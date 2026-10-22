import { Growth } from "@/blocks/growth";
import { AppFrame, Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "growth",
  title: "Growth",
  lede: "Twelve weeks of growth, drawn in rails.",
  order: 30.3, group: "Blocks",
  verbs: ["hover", "press"],
  summary:
    "A template store's last twelve weeks, drawn in rails: sign-ups by source as thin stacked columns you can filter by source and by week, the funnel from visit to paid, and retention by signup week. Each source keeps one hue, everything else stays in the foreground, and only the chart's entrance moves.",
  tiers: ["instant", "responsive"],
  block: "growth",
};

function GrowthDemo() {
  return <Growth />;
}

function PhoneDemo() {
  return (
    <AppFrame label="Growth, phone" phone>
      <Growth />
    </AppFrame>
  );
}

export default function GrowthPage() {
  return (
    <Page meta={meta}>
      <Stage
        title="Twelve weeks, in rails"
        size="lg"
        align="start"
        code="GrowthDemo"
        caption="Sign-ups by source stack into one thin rail per week, a hue per source. The legend hides a source and the slider narrows the weeks: the chart redraws at once, and the colors stay with their sources because a hue belongs to the series, not its place. The funnel is one quantity in one hue, and retention is a table whose dots step through one hue, with the number in every cell. Nothing is boxed; air separates the sections."
      >
        <GrowthDemo />
      </Stage>

      <Stage
        title="On a phone"
        align="start"
        code="PhoneDemo"
        caption="The same page in one column. The figures go two across, the filters stack above the chart, the funnel and retention follow, and the retention table scrolls sideways inside its own box with the signup week held at the start."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
