import { Projects } from "@/blocks/projects";
import { AppFrame, Page, Stage, useReplay, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "projects",
  title: "Projects",
  lede: "A studio's projects, as rows or cards.",
  order: 30.6,
  group: "Blocks",
  verbs: ["select", "type", "press"],
  summary:
    "A studio's projects as one screen: a title with the count, one toolbar with the status filters, a search, a list or grid switch and New project, then the rows or the cards. Every empty case says why and offers the way back. The rows arrive in one staggered cascade, and New project is the one accent fill.",
  tiers: ["instant", "responsive", "expressive"],
  block: "projects",
};

function DesktopDemo() {
  return (
    <AppFrame label="Projects, desktop">
      <Projects />
    </AppFrame>
  );
}

function PhoneDemo() {
  return (
    <AppFrame label="Projects, phone" phone>
      <Projects />
    </AppFrame>
  );
}

export default function ProjectsPage() {
  const [desktop, replay] = useReplay();
  return (
    <Page meta={meta}>
      <Stage
        title="Desktop"
        tier="expressive"
        size="lg"
        align="start"
        code="DesktopDemo"
        onReplay={replay}
        caption="The rows arrive in one cascade, the view's expressive moment, and filtering after that is instant. Pick a status, type in the search, or switch to Grid: the cards take the same filter and let you select several. Search for something that is not there and the empty state offers to clear it. New project puts a draft at the top and shows everything, so it never lands hidden behind a filter."
      >
        <DesktopDemo key={desktop} />
      </Stage>

      <Stage
        title="On a phone"
        tier="instant"
        size="lg"
        align="start"
        code="PhoneDemo"
        caption="The same screen in one column. The toolbar wraps: the filters first, then the search across the full width with the view switch beside it. Each row keeps the name and the status, and drops the client's line under it before it would crowd them."
      >
        <PhoneDemo />
      </Stage>
    </Page>
  );
}
