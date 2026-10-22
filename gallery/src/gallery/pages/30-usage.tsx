import { Usage } from "@/blocks/usage";
import { AppFrame, Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "usage",
  title: "Usage",
  lede: "A plan's usage, drawn only in rails.",
  order: 30.2, group: "Blocks",
  summary:
    "A studio plan's usage, drawn only in rails: trends in thin lines at the foot of the figures, storage and bandwidth split by kind, the plan's limits with their budgets, and build times by site. Each hue names one kind of file across the whole page, everything else stays in the foreground, and nothing moves.",
  tiers: [],
  block: "usage",
};

function UsageDemo() {
  return <Usage />;
}

function PhoneDemo() {
  return (
    <AppFrame label="Usage, phone" phone>
      <Usage />
    </AppFrame>
  );
}

export default function UsagePage() {
  return (
    <Page meta={meta}>
      <Stage
        title="A plan, in rails"
        size="lg"
        align="start"
        code="UsageDemo"
        caption="Every mark here is thin: a 2px line under each figure, 4px rails for storage, bandwidth and the limits, and one rail per site for build times. The hues name kinds of file and keep them everywhere: video is violet in storage and in bandwidth. Rose is build time. The trends and the limits measure one thing each, so they stay in the foreground. There are no boxes between the sections, only air, and nothing moves."
      >
        <UsageDemo />
      </Stage>

      <Stage
        title="On a phone"
        align="start"
        code="PhoneDemo"
        caption="The same page in one column. The figures go two across, the two columns stack, the spread puts each site's name above its rail, and every reading stays whole."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
