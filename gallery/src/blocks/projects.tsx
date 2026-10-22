/**
 * Projects: a studio's projects, as rows or cards, filtered by status. A block: a whole screen built from the litt
 * parts, to copy and make your own. Swap the sample projects at the top for yours (the Project shape is the list's);
 * the toolbar, the views and the empty states stay.
 *
 * A title with the count, then one toolbar: the status filters, a search field, a list or grid switch and New project,
 * the one accent fill. The rows arrive in one staggered cascade, the view's expressive moment. Every empty case says
 * why and offers the way back: a search with no match clears the search, and an empty status shows everything.
 * Render it inside your app's shell (the dashboard block's AppShell, for one).
 */
import { useState } from "react";
import { Button } from "@/components/button";
import { PlusIcon } from "@/components/icons";
import { Input } from "@/components/input";
import { ProjectFilters, ProjectGrid, ProjectList, ProjectsEmpty, matchesFilter, type Project, type ProjectFilter } from "@/components/list";
import { Segmented } from "@/components/segmented";
import { Empty } from "@/components/states";

/* ----------------------------------------------------------------- data */

/** The studio's projects. Load yours; `href` makes each row a link to the project. */
const PROJECTS: Project[] = [
  { id: "halo", name: "Halo site", client: "Halo Studio", deploy: "Deployed 2 hours ago", status: "live", updated: "2026-10-20", description: "The studio site, on Framer with a custom CMS.", tags: ["Site", "CMS"], cover: "landing" },
  { id: "northwind", name: "Northwind rebrand", client: "Northwind", deploy: "Deployed 3 days ago", status: "live", updated: "2025-11-04", description: "A new identity and the site that carries it.", tags: ["Identity"], cover: "identity" },
  { id: "atlas", name: "Atlas portfolio", client: "Ines Ortega", deploy: "Preview ready", status: "review", updated: "2026-10-18", description: "A photographer's portfolio on a tight grid.", tags: ["Site"], cover: "type" },
  { id: "lumen", name: "Lumen docs", client: "Marlow Labs", deploy: "Preview ready", status: "review", updated: "2026-10-15", description: "Docs with search and versioned pages.", tags: ["Docs"], cover: "system" },
  { id: "kassa", name: "Kassa pitch deck", client: "Kassa", deploy: "No deploy yet", status: "draft", updated: "2025-09-12", description: "A seed deck, and the motion for its demo.", tags: ["Deck", "Motion"], cover: "motion" },
  { id: "template", name: "Case study template", client: "Litt Templates", deploy: "No deploy yet", status: "draft", updated: "2026-10-02", description: "A template for long case studies.", tags: ["Template"], cover: "template" },
];

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
/** "One project", "Six projects": the number in words, and the noun that goes with it. */
const count = (n: number, one: string, many = `${one}s`) => `${WORDS[n] ?? n} ${n === 1 ? one : many}`;

/** Does a project match what was typed? Its name, its client or a tag. */
const matchesQuery = (p: Project, query: string) => {
  const q = query.trim().toLowerCase();
  return !q || [p.name, p.client, ...(p.tags ?? [])].some((s) => s.toLowerCase().includes(q));
};

/* ----------------------------------------------------------------- the screen */

export function Projects() {
  const [projects, setProjects] = useState(PROJECTS);
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState<string[]>([]);

  const found = projects.filter((p) => matchesQuery(p, query));
  const shown = found.filter((p) => matchesFilter(p, filter));
  const live = projects.filter((p) => p.status === "live").length;

  /* A new project is a draft at the top. Live and Review would hide it, so the filter goes back to All. */
  const create = () => {
    const n = projects.length - PROJECTS.length + 1;
    setProjects([{ id: `new-${n}`, name: n === 1 ? "Untitled project" : `Untitled project ${n}`, client: "Halo Studio", deploy: "No deploy yet", status: "draft", updated: "2026-10-21", cover: "blank" }, ...projects]);
    if (filter === "live" || filter === "review") setFilter("all");
    setQuery("");
  };

  return (
    <div className="@container grid w-full grid-cols-1 gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-h1 text-fg">Projects</h1>
          <p className="text-body text-fg-muted">
            {count(projects.length, "project")}, {count(live, "live", "live").toLowerCase()}.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<PlusIcon />} onClick={create}>
          New project
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <ProjectFilters value={filter} onChange={setFilter} />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <Input
            size="sm"
            type="search"
            aria-label="Search projects"
            placeholder="Search projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full @min-[40rem]:w-56"
          />
          <Segmented
            legend="View"
            size="sm"
            value={view}
            onValueChange={setView}
            options={[
              { value: "list", label: "List" },
              { value: "grid", label: "Grid" },
            ]}
          />
        </div>
      </div>

      {query.trim() && !found.length ? (
        <Empty title={`No project matches “${query.trim()}”.`} action={<Button size="sm" onClick={() => setQuery("")}>Clear search</Button>}>
          Search looks at names, clients and tags.
        </Empty>
      ) : view === "grid" ? (
        <ProjectGrid
          projects={found}
          filter={filter}
          selectedIds={selected}
          onSelectedChange={(id, on) => setSelected((s) => (on ? [...s, id] : s.filter((x) => x !== id)))}
          onClearFilter={() => setFilter("all")}
        />
      ) : shown.length ? (
        <ProjectList projects={shown} label="Projects" />
      ) : (
        <ProjectsEmpty filter={filter} onClearFilter={() => setFilter("all")} />
      )}
    </div>
  );
}
