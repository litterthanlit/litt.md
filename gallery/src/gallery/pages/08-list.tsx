import { useState } from "react";
import { Button } from "@/components/button";
import { PlusIcon } from "@/components/icons";
import {
  ProjectFilters,
  ProjectGrid,
  ProjectList,
  matchesFilter,
  type Project,
  type ProjectFilter,
} from "@/components/list";
import { PROJECTS } from "../fixtures";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "list",
  title: "List and cards",
  order: 8,
  summary:
    "Airy project rows and raised cards. The rows arrive in one staggered cascade, this page's single expressive moment; filtering and inserting stay responsive, and hover never moves anything.",
  tiers: ["instant", "responsive", "expressive"],
};

export const docs: PageDocs = {
  components: ["list", "list-cover"],
  exports: ["ProjectList", "ProjectGrid", "ProjectCard", "ProjectFilters", "ProjectsEmpty", "StatusTag", "ProjectCover", "matchesFilter"],
  usage: `import { useState } from "react";
import { ProjectFilters, ProjectGrid, ProjectList, type Project, type ProjectFilter } from "@/components/list";

// These components read a Project. You copy them, so rename the fields in list.tsx to fit your data.
const projects: Project[] = [
  {
    id: "litt-design-v3", // unique: the React key, and what selection tracks
    name: "litt.design v3",
    client: "Litt Studio",
    deploy: "Deployed 2 days ago", // last deploy, in words
    status: "live", // "live" | "review" | "draft" | "idea"
    updated: "2026-10-10", // ISO date, YYYY-MM-DD
    description: "The studio site on litt.md.", // one line
    tags: ["Framer", "Site"],
    cover: "system", // a CoverName: see list-cover.tsx
    href: "/work/litt-design-v3", // optional: the row becomes a link
  },
];

// Rows, with the staggered entrance.
<ProjectList projects={projects} onOpen={(p) => openProject(p.id)} />

// Or cards, with a filter. The grid applies the filter itself, so it can animate the change.
const [filter, setFilter] = useState<ProjectFilter>("all");
<ProjectFilters value={filter} onChange={setFilter} />
<ProjectGrid
  projects={projects}
  filter={filter}
  onClearFilter={() => setFilter("all")}
  onOpen={(p) => openProject(p.id)}
/>`,
  use: [
    "Your content is projects, or close to it: a name, a client, a status, a date and a few tags. These components read a Project, so copy list.tsx and rename its fields to fit your data.",
    "People scan and open a work list: use ProjectList, because a row is compact and shows the status and date in line.",
    "A visual overview people filter and select from: use ProjectGrid and ProjectFilters.",
    "A list that is the view's one expressive moment. The rows arrive in a single staggered cascade that stops counting at six.",
    "A filter that can come up empty: ProjectGrid shows ProjectsEmpty for you, with a way out.",
  ],
  skip: [
    "Your data is not project-shaped, or you need columns, sorting or a dense table. Build a table from the \"Table and list rows\" rules in components.md, because these rows have a fixed layout.",
    "A short list of actions or commands. Use Menu or the Command menu, because they glide a highlight and answer to the arrow keys.",
    "Switching between views rather than filtering a collection. Use Tabs.",
    "A page that already plays another expressive entrance. The list entrance is the page's one moment, so pass entrance={false}.",
    "Thousands of rows. Nothing here is virtualised, so reach for a virtualised table.",
  ],
  keyboard: [
    [["Tab"], "Moves through the rows, or on cards through each checkbox and then the card's open button, and through the filter chips."],
    [["Enter"], "Opens the focused row or card, follows a row that is a link, and picks a filter chip."],
    [["Space"], "On a button, does what Enter does. On a card's checkbox, it selects or clears the card. A row that is a link answers to Enter only."],
  ],
  a11y: [
    "ProjectList is a list named by its label (default Projects), and every row is one button or one link, so the whole row is the target and is 64px tall. Change the label when a page has more than one list.",
    "Status is text and a dot, never color alone. Idea and Draft share a color, so Idea gets a hollow dot. The date is a <time> element.",
    "A card is an article with one stretched button, named Open plus the project's name. Its checkbox is named Select plus the name, and its target grows from 32px to 44px on touch.",
    "Selection is the checkbox's checked state. The ring that turns to the focus color only echoes it, so it never carries the meaning alone.",
    "The filter chips are a group named Filter projects, and each is a button with aria-pressed.",
    "ProjectsEmpty is a role=\"status\", so an empty result is announced. Nothing announces how many projects match a filter. If that matters, add a polite live region, like the selected count in the demo.",
    "Hover only changes a fill or a hairline, and never reveals anything, so nothing is lost on touch.",
    "Under reduced motion rows and cards appear and move at once, with no travel or stagger.",
  ],
};

/** What "New project" inserts, in turn. */
const FRESH: Pick<Project, "name" | "client" | "description" | "tags">[] = [
  { name: "Portfolio rebuild", client: "Ines Ortega", description: "A quieter case-study layout.", tags: ["Framer", "Site"] },
  { name: "Pitch deck site", client: "Kassa", description: "The seed deck as one page.", tags: ["Landing"] },
  { name: "Docs site", client: "Marlow Labs", description: "Guides and a changelog.", tags: ["Docs", "Site"] },
  { name: "Case study template", client: "Litt Templates", description: "One long page, six blocks.", tags: ["Template"] },
];

function EntranceDemo() {
  return <ProjectList projects={PROJECTS} className="max-w-3xl" />;
}

function CardsDemo() {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const added = projects.length - PROJECTS.length;
  const visibleSelected = selected.filter((id) => {
    const p = projects.find((x) => x.id === id);
    return p ? matchesFilter(p, filter) : false;
  });

  const insert = () => {
    const base = FRESH[added % FRESH.length];
    const round = Math.floor(added / FRESH.length);
    const fresh: Project = {
      ...base,
      id: `new-${added + 1}`,
      name: round ? `${base.name} ${round + 1}` : base.name,
      deploy: "No deploy yet",
      status: "draft",
      updated: "2026-10-11",
      cover: "blank",
    };
    setProjects((ps) => [fresh, ...ps]);
    // A new draft would be hidden by Live or Review, so show everything.
    if (filter === "live" || filter === "review") setFilter("all");
  };

  return (
    <div className="grid w-full gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ProjectFilters value={filter} onChange={setFilter} />
        <div className="flex items-center">
          <span aria-live="polite" className="text-small tabular-nums text-fg-subtle not-empty:mr-4">
            {visibleSelected.length ? `${visibleSelected.length} selected` : ""}
          </span>
          <Button variant="primary" size="sm" icon={<PlusIcon />} onClick={insert}>
            New project
          </Button>
        </div>
      </div>
      <ProjectGrid
        projects={projects}
        filter={filter}
        selectedIds={selected}
        onSelectedChange={(id, on) => setSelected((s) => (on ? [...s, id] : s.filter((x) => x !== id)))}
        onClearFilter={() => setFilter("all")}
      />
    </div>
  );
}

/** Three live projects and no reviews or drafts: Review and Draft are empty. */
const LIVE_ONLY = PROJECTS.filter((p) => p.status === "live");

function EmptyDemo() {
  const [filter, setFilter] = useState<ProjectFilter>("review");
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="grid w-full gap-8">
      <ProjectFilters value={filter} onChange={setFilter} />
      <ProjectGrid
        projects={LIVE_ONLY}
        filter={filter}
        selectedIds={selected}
        onSelectedChange={(id, on) => setSelected((s) => (on ? [...s, id] : s.filter((x) => x !== id)))}
        onClearFilter={() => setFilter("all")}
      />
    </div>
  );
}

export default function ListPage() {
  const [listKey, replayList] = useReplay();
  const [cardsKey, resetCards] = useReplay();
  const [emptyKey, resetEmpty] = useReplay();
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Staggered entrance"
        tier="expressive"
        align="start"
        code="EntranceDemo"
        onReplay={replayList}
        caption="Each row fades in and rises from the travel token's distance to rest, on the expressive tier. Row n waits n times the stagger token. The cascade stops counting at six: rows seven and eight arrive with row six, so a long list never drags. Hover only changes the fill and a row never moves. Press Replay to watch it again."
      >
        <EntranceDemo key={listKey} />
      </Stage>

      <Stage
        title="Filter, insert and select"
        tier="responsive"
        size="lg"
        align="start"
        code="CardsDemo"
        onReplay={resetCards}
        replayLabel="Reset"
        caption="Pick a filter and the grid re-flows. Cards that stay slide to their new place on the responsive tier, as position only so text never stretches. Cards that leave fade and shrink to 0.98 with no travel. New project adds a card at the start on the same tier, because the list above holds this page's one expressive moment. Hover steps the hairline and the cover fill. The checkbox only turns the ring to the focus color."
      >
        <CardsDemo key={cardsKey} />
      </Stage>

      <Stage
        title="Empty state"
        tier="responsive"
        align="start"
        code="EmptyDemo"
        onReplay={resetEmpty}
        replayLabel="Reset"
        caption="A filter with no results says so in one line, gives a hint, and offers the way out. It waits for the leaving cards to fade before it appears. Clear filter brings the cards back on the responsive tier. Switch between Live and Review to see both."
      >
        <EmptyDemo key={emptyKey} />
      </Stage>
    </Page>
  );
}
