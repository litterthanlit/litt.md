import { useState } from "react";
import { ActionBar } from "@/components/action-bar";
import { Button } from "@/components/button";
import { ArchiveIcon, ShareIcon } from "@/components/icons";
import { ProjectGrid, type Project } from "@/components/list";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "action-bar",
  title: "Action bar",
  lede: "What to do with what you selected.",
  order: 17.05,
  group: "Data",
  verbs: ["select", "press"],
  summary:
    "A glass bar that floats at the bottom of the view while something is selected: the count in words, the actions as small buttons, and Clear. It rises by the travel token on the responsive tier when the selection starts and drops away when it ends. It is a toolbar: one Tab stop, the arrow keys between its buttons, and Esc clears.",
  tiers: ["responsive"],
};

export const docs: PageDocs = {
  components: ["action-bar"],
  exports: ["ActionBar"],
  usage: `import { ActionBar } from "@/components/action-bar";

const [selected, setSelected] = useState<string[]>([]);

// After the list, inside the same scrolling area. It shows while something is selected.
<ProjectGrid projects={projects} selectedIds={selected} onSelectedChange={…} />
<ActionBar count={selected.length} noun="projects" onClear={() => setSelected([])}>
  <Button size="sm" icon={<ArchiveIcon />} onClick={archive}>Archive</Button>
  <Button size="sm" variant="ghost">Export</Button>
</ActionBar>`,
  use: [
    "Rows or cards people select to act on together: archive projects, export invoices, move files.",
    "Actions that only make sense with a selection, so they need not take room in the toolbar the rest of the time.",
  ],
  skip: [
    "Actions on one item. Put them on the item, in a Menu on its row.",
    "A page's own actions, such as New project. Those sit in the page's header.",
    "A message after the action. That is a Toast, with Undo.",
  ],
  keyboard: [
    [["Tab"], "Enters the bar once, on the action used last, and leaves it."],
    [["ArrowLeft", "ArrowRight"], "Move between the bar's buttons, wrapping at the ends."],
    [["Home", "End"], "The first or the last button."],
    [["Escape"], "Clears the selection, and the bar goes."],
  ],
  a11y: [
    "role=\"toolbar\", named for what it acts on (\"Actions for the selected projects\"), with one Tab stop and the arrow keys inside.",
    "The count is said once in a polite status as it changes (\"3 projects selected\"), so a screen reader hears each box it ticks.",
    "Clear is a round ghost button named \"Clear selection\", 44px on a touch screen; so are the actions.",
    "When the bar goes while focus is in it, focus goes back to where it came from, such as the last box ticked.",
    "Under reduced motion it appears and goes without moving.",
  ],
};

const PROJECTS: Project[] = [
  { id: "halo", name: "Halo site", client: "Halo Studio", deploy: "Deployed 2 hours ago", status: "live", updated: "2026-10-20", description: "The studio site, on Framer.", tags: ["Site"], cover: "landing" },
  { id: "northwind", name: "Northwind rebrand", client: "Northwind", deploy: "Deployed 3 days ago", status: "live", updated: "2025-11-04", description: "A new identity and its site.", tags: ["Identity"], cover: "identity" },
  { id: "atlas", name: "Atlas portfolio", client: "Ines Ortega", deploy: "Preview ready", status: "review", updated: "2026-10-18", description: "A photographer's portfolio.", tags: ["Site"], cover: "type" },
  { id: "lumen", name: "Lumen docs", client: "Marlow Labs", deploy: "Preview ready", status: "review", updated: "2026-10-15", description: "Docs with search.", tags: ["Docs"], cover: "system" },
  { id: "kassa", name: "Kassa pitch deck", client: "Kassa", deploy: "No deploy yet", status: "draft", updated: "2025-09-12", description: "A seed deck.", tags: ["Deck"], cover: "motion" },
  { id: "template", name: "Case study template", client: "Litt Templates", deploy: "No deploy yet", status: "draft", updated: "2026-10-02", description: "For long case studies.", tags: ["Template"], cover: "template" },
];

function SelectDemo() {
  const [projects, setProjects] = useState(PROJECTS);
  const [selected, setSelected] = useState<string[]>([]);
  const archive = () => {
    setProjects((all) => all.filter((p) => !selected.includes(p.id)));
    setSelected([]);
  };
  return (
    <div className="grid w-full gap-6">
      <ProjectGrid
        projects={projects}
        filter="all"
        selectedIds={selected}
        onSelectedChange={(id, on) => setSelected((s) => (on ? [...s, id] : s.filter((x) => x !== id)))}
        onClearFilter={() => {}}
      />
      <ActionBar count={selected.length} noun="projects" onClear={() => setSelected([])}>
        <Button size="sm" icon={<ArchiveIcon />} onClick={archive}>
          Archive
        </Button>
        <Button size="sm" variant="ghost" icon={<ShareIcon />}>
          Share
        </Button>
      </ActionBar>
      {projects.length < PROJECTS.length && (
        <Button size="sm" variant="ghost" className="justify-self-start" onClick={() => setProjects(PROJECTS)}>
          Bring them back
        </Button>
      )}
    </div>
  );
}

export default function ActionBarPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="A selection of projects"
        tier="responsive"
        size="lg"
        align="start"
        code="SelectDemo"
        caption="Tick a card's box. The bar rises by the travel token on the responsive tier and sticks 16px above the bottom of the view while the grid scrolls; at the end of the grid it rests under it, so it never covers a card. Tick more and the count changes in place. Archive acts on all of them, then the selection ends and the bar drops away. Esc in the bar clears it too."
      >
        <SelectDemo />
      </Stage>
    </Page>
  );
}
