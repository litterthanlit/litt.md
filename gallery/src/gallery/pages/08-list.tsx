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
import { Page, Stage, useReplay, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "list",
  title: "List and cards",
  order: 8,
  summary:
    "Airy project rows and raised cards. The rows arrive in one staggered cascade, this page's single expressive moment; filtering and inserting stay responsive, and hover never moves anything.",
  tiers: ["instant", "responsive", "expressive"],
};

const PROJECTS: Project[] = [
  {
    id: "litt-design-v3",
    name: "litt.design v3",
    client: "Litt Studio",
    deploy: "Deployed 2 days ago",
    status: "live",
    updated: "2026-10-10",
    description: "The studio site on litt.md.",
    tags: ["Framer", "Site"],
    cover: "system",
  },
  {
    id: "gallery-identity",
    name: "Gallery identity",
    client: "Halden Gallery",
    deploy: "No deploy yet",
    status: "review",
    updated: "2026-10-09",
    description: "Wordmark, grid and color.",
    tags: ["Identity"],
    cover: "identity",
  },
  {
    id: "founder-landing",
    name: "Founder landing",
    client: "Marlow Labs",
    deploy: "Deployed 5 days ago",
    status: "live",
    updated: "2026-10-06",
    description: "A launch page for a dev tool.",
    tags: ["Framer", "Landing"],
    cover: "landing",
  },
  {
    id: "framer-template-14",
    name: "Framer template 14",
    client: "Litt Templates",
    deploy: "Published 3 weeks ago",
    status: "live",
    updated: "2026-09-22",
    description: "A portfolio with twelve pages.",
    tags: ["Template", "Framer"],
    cover: "template",
  },
  {
    id: "motion-study-light",
    name: "Motion study: light",
    client: "Internal",
    deploy: "No deploy yet",
    status: "draft",
    updated: "2026-10-08",
    description: "How light moves across objects.",
    tags: ["Research", "Motion"],
    cover: "motion",
  },
  {
    id: "studio-site-refresh",
    name: "Studio site refresh",
    client: "Litt Studio",
    deploy: "Preview deployed yesterday",
    status: "review",
    updated: "2026-10-10",
    description: "Tighter type, faster pages.",
    tags: ["Framer", "Site"],
    cover: "refresh",
  },
  {
    id: "type-foundry-site",
    name: "Type foundry site",
    client: "Grotta Type",
    deploy: "No deploy yet",
    status: "idea",
    updated: "2026-10-02",
    description: "A specimen-first foundry site.",
    tags: ["Site", "Type"],
    cover: "type",
  },
  {
    id: "fintech-dashboard",
    name: "Fintech dashboard",
    client: "Kassa",
    deploy: "Staging deployed 4 days ago",
    status: "draft",
    updated: "2026-10-07",
    description: "Cash, invoices and runway.",
    tags: ["Product", "App"],
    cover: "dashboard",
  },
];

/** What "New project" inserts, in turn. */
const FRESH: Pick<Project, "name" | "client" | "description" | "tags">[] = [
  { name: "Portfolio rebuild", client: "Ines Ortega", description: "A quieter case-study layout.", tags: ["Framer", "Site"] },
  { name: "Pitch deck site", client: "Kassa", description: "The seed deck as one page.", tags: ["Landing"] },
  { name: "Docs site", client: "Marlow Labs", description: "Guides and a changelog.", tags: ["Docs", "Site"] },
  { name: "Case study template", client: "Litt Templates", description: "One long page, six blocks.", tags: ["Template"] },
];

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
    <Page meta={meta}>
      <Stage
        title="Staggered entrance"
        tier="expressive"
        align="start"
        onReplay={replayList}
        caption="Each row fades in and rises from the dial's travel to rest, on the expressive tier. Row n waits n times the stagger, and the stagger is set on the dial. The cascade stops counting at six: rows seven and eight arrive with row six, so a long list never drags. Hover only changes the fill and a row never moves. Change the dial, then press Replay."
      >
        <ProjectList key={listKey} projects={PROJECTS} className="max-w-3xl" />
      </Stage>

      <Stage
        title="Filter, insert and select"
        tier="responsive"
        size="lg"
        align="start"
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
        onReplay={resetEmpty}
        replayLabel="Reset"
        caption="A filter with no results says so in one line, gives a hint, and offers the way out. It waits for the leaving cards to fade before it appears. Clear filter brings the cards back on the responsive tier. Switch between Live and Review to see both."
      >
        <EmptyDemo key={emptyKey} />
      </Stage>
    </Page>
  );
}
