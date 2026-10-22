import { Dashboard } from "@/blocks/dashboard";
import { AppFrame, Page, Stage, useReplay, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "dashboard",
  title: "Dashboard",
  lede: "A deploy dashboard, built from the parts.",
  order: 30.1, group: "Blocks",
  verbs: ["hover"],
  summary:
    "The studio's deploy dashboard, built from the parts: an app shell with a full-height sidebar, four number tiles, a chart of deploys per day, and a table of recent deploys with its pagination. On a phone the sidebar becomes the bottom sheet. One accent fill in the view would be a primary button, and this view has none.",
  tiers: ["instant", "responsive"],
  block: "dashboard",
};

function DesktopDemo() {
  return (
    <AppFrame label="Studio dashboard, desktop" bare className="[--gutter:var(--space-8)]">
      <Dashboard label="Desktop" viewportHeight="44rem" />
    </AppFrame>
  );
}

function PhoneDemo() {
  return (
    <AppFrame label="Studio dashboard, phone" phone bare className="[--gutter:var(--space-4)]">
      <Dashboard label="Phone" viewportHeight="44rem" />
    </AppFrame>
  );
}

export default function DashboardPage() {
  const [desktop, replayDesktop] = useReplay();
  const [phone, replayPhone] = useReplay();
  return (
    <Page meta={meta}>
      <Stage
        title="Desktop"
        tier="responsive"
        size="lg"
        code="DesktopDemo"
        onReplay={replayDesktop}
        caption="Four parts and nothing else. The sidebar fills the window's height and its links stay put while the page scrolls. The tiles are quiet, the bars are the foreground at 55% with today in full, and the table's status is a mono tag whose text carries the color. The one entrance is the chart's, on the responsive tier. Scroll the frame, hover a bar, and press Next under the table."
      >
        <DesktopDemo key={desktop} />
      </Stage>

      <Stage
        title="Phone"
        tier="expressive"
        size="lg"
        code="PhoneDemo"
        onReplay={replayPhone}
        caption="The sidebar becomes a top bar with a menu button, and the nav opens in the bottom sheet that Dialog and Popover use. The tiles go two across, the chart fits the screen with every other label thinned out, and the table scrolls inside its own box. The sheet does not use up the view's one expressive moment."
      >
        <PhoneDemo key={phone} />
      </Stage>
    </Page>
  );
}
