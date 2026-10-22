import { Deployment } from "@/blocks/deployment";
import { AppFrame, Page, Stage, useReplay, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "deployment",
  title: "Deployment",
  lede: "One deploy, from the first line to live.",
  order: 30.65,
  group: "Blocks",
  verbs: ["watch", "select", "drag", "hover"],
  summary:
    "One deploy as a screen: where it sits, its commit as the title with who started it behind a hover card, the status in words, the facts in a row and a progress rail while it builds. The files it changed sit in a tree beside the build log, with a line between them to drag; pick a file and its diff takes the log's place. On a phone the two take turns. Visit site is the one accent fill and waits until the site is live.",
  tiers: ["instant", "responsive"],
  block: "deployment",
};

function DesktopDemo() {
  return (
    <AppFrame label="Deployment, desktop">
      <Deployment />
    </AppFrame>
  );
}

function PhoneDemo() {
  return (
    <AppFrame label="Deployment, phone" phone>
      <Deployment />
    </AppFrame>
  );
}

export default function DeploymentPage() {
  const [desktop, replay] = useReplay();
  return (
    <Page meta={meta}>
      <Stage
        title="Desktop"
        tier="responsive"
        size="lg"
        align="start"
        code="DesktopDemo"
        onReplay={replay}
        caption="The build plays as it would stream: the log follows its newest line, the rail fills, and at the end the status turns Ready and Visit site wakes. Rest the pointer on the name for who started it. Pick a file in the tree and its diff takes the log's place; drag the line between them, and the split is kept for next time."
      >
        <DesktopDemo key={desktop} />
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        size="lg"
        align="start"
        code="PhoneDemo"
        caption="Two panels side by side would both be too narrow, so the log and the changed files take turns behind a segmented control. Pick a file and its diff opens under the tree."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
