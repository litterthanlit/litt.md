import { Activity } from "@/blocks/activity";
import { AppFrame, Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "activity",
  title: "Activity",
  lede: "What happened in the studio, newest first.",
  order: 30.9,
  group: "Blocks",
  verbs: ["select", "press"],
  summary:
    "A studio's activity as one screen: a filter by kind, then the events grouped by day, each one sentence in two inks with its time in the mono. A deploy says how it ended in a tag, in words. Show earlier adds the next day below, and a kind with nothing in it says so. Nothing is accent filled, and nothing moves on its own.",
  tiers: ["instant"],
  block: "activity",
};

function DesktopDemo() {
  return (
    <AppFrame label="Activity, desktop">
      <Activity />
    </AppFrame>
  );
}

function PhoneDemo() {
  return (
    <AppFrame label="Activity, phone" phone>
      <Activity />
    </AppFrame>
  );
}

export default function ActivityPage() {
  return (
    <Page meta={meta}>
      <Stage
        title="Desktop"
        tier="instant"
        size="lg"
        align="start"
        code="DesktopDemo"
        caption="Who and what are in the foreground and the verb is in the grey, so a glance down the column reads the names and the projects. Pick Deploys, Comments or People and the days keep their order. Show earlier adds the day before below, so nothing above it moves. A kind with nothing in it says so, and offers everything again."
      >
        <DesktopDemo />
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        size="lg"
        align="start"
        code="PhoneDemo"
        caption="The same feed in a phone-wide column. The time drops under the sentence when the line runs out, and a commit wraps inside its own line instead of pushing the page sideways."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
