import type { ReactNode } from "react";
import { Kbd } from "@/components/kbd";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";
import { Tag } from "@/components/tag";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "tabs",
  title: "Tabs",
  order: 5, group: "Controls",
  summary:
    "Underline or segmented tabs. The indicator slides between them, and the panel fades in from the side you picked.",
  tiers: ["instant", "responsive"],
};

export const docs: PageDocs = {
  components: ["tabs"],
  exports: ["Tabs", "TabsList", "TabsTrigger", "TabsPanels", "TabsPanel"],
  usage: `import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";

// Add variant="segmented" for a view switch. Pass value and onValueChange to control it.
<Tabs defaultValue="overview">
  <TabsList aria-label="Atelier Nord">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="deploys">Deploys</TabsTrigger>
  </TabsList>
  {/* One min-height for every panel keeps the page below from jumping. */}
  <TabsPanels className="min-h-72 pt-6">
    <TabsPanel value="overview"><Overview /></TabsPanel>
    <TabsPanel value="activity"><Activity /></TabsPanel>
    <TabsPanel value="deploys"><Deploys /></TabsPanel>
  </TabsPanels>
</Tabs>`,
  use: [
    "Views of one thing that belong together, such as a project's Overview, Activity, Deploys and Settings. Use the underline style.",
    "A compact switch between ways to look at the same content, such as List, Grid and Timeline. Use the segmented style.",
    "Two to six sections with short labels that fit in one row.",
    "Content people read one panel at a time, because only the selected panel is on the page.",
  ],
  skip: [
    "Each section is its own page with its own address. Use links, because tabs do not change the URL.",
    "Steps that must happen in order. Show them as a numbered list on one page.",
    "Choosing a value in a form, such as a plan or a unit. Use radio inputs, which a segmented control is built from.",
    "More sections than fit in one row. The list scrolls sideways and hides the rest. Use Menu.",
    "People need to compare panels or see them together. Use headings on one page, because hidden panels are not in the page at all.",
  ],
  keyboard: [
    [["Tab"], "Moves focus into the tab list, onto the selected tab. Press it again to reach the panel."],
    [["←", "→"], "Moves to the previous or next tab and selects it. At either end it wraps around."],
    [["Home", "PageUp"], "Jumps to the first tab and selects it."],
    [["End", "PageDown"], "Jumps to the last tab and selects it."],
    [["Enter", "Space"], "Selects the focused tab. Focus already selects, so you rarely need it."],
  ],
  a11y: [
    "Radix supplies the ARIA tabs pattern: tablist, tab and tabpanel roles, aria-selected, and each tab and panel pointing at the other.",
    "Only the selected tab is in the tab order, and the arrow keys move between tabs. Tab then moves on to the panel, which can take focus so a keyboard user can always reach it.",
    "Always give TabsList an aria-label, because a group of tabs with no name is announced without context. Each TabsTrigger value must match one TabsPanel value, because that is what links them.",
    "The selected tab is marked by the indicator and by aria-selected, not by color alone. The indicator is hidden from screen readers.",
    "Keyboard focus draws a 2px outline inside the tab, so the scrolling list does not clip it. The panel gets the usual 2px outline at a 2px offset.",
    "Medium tabs are 44px tall and small are 32px. Use medium where people tap, and small in dense UI such as a toolbar. The small segmented list is the exception: on touch screens its track grows to 44px, like the small Segmented control.",
    "Touch has no hover, so on a touch screen a tab held down fills and takes the stronger text color, on the instant tier. The OS tap flash is off, and the tab never moves.",
    "Under reduced motion the indicator jumps and the panel appears without sliding.",
  ],
};

/** A deploy's result as a status Tag in a fixed column, so the hashes line up: the live one, an earlier one that is ready, or a failure. */
function Result({ tone }: { tone: "success" | "danger" | "muted" }) {
  return (
    <span className="flex w-16 shrink-0">
      {tone === "success" ? <Tag status="success">Live</Tag> : tone === "danger" ? <Tag status="danger">Failed</Tag> : <Tag status="neutral">Ready</Tag>}
    </span>
  );
}

/* ---------- (a) Project tabs, underline ---------- */

const STATS: [string, string][] = [
  ["Visits, last 7 days", "12,480"],
  ["Pages", "18"],
  ["Published", "4 min ago"],
  ["Build time", "42s"],
];

const ACTIVITY: [string, string][] = [
  ["Published to production", "4 min ago"],
  ["Updated pricing copy on /services", "2 h ago"],
  ["Added the Case studies collection", "Yesterday"],
  ["Connected atelier-nord.com", "3 days ago"],
];

const DEPLOYS: { hash: string; message: string; time: string; tone: "success" | "danger" | "muted" }[] = [
  { hash: "5f2e9c1", message: "Tighten hero spacing", time: "42s", tone: "success" },
  { hash: "c81d0a7", message: "Swap in new case study images", time: "1m 08s", tone: "muted" },
  { hash: "3d19b8e", message: "Add testimonials section", time: "12s", tone: "danger" },
  { hash: "9b4e6d3", message: "Fix mobile nav overflow", time: "38s", tone: "muted" },
  { hash: "e07a52f", message: "Update footer links", time: "35s", tone: "muted" },
];

const SETTINGS: [string, string][] = [
  ["Domain", "atelier-nord.com"],
  ["Region", "Frankfurt"],
  ["Visibility", "Public"],
  ["Password", "Off"],
];

function Rows({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-line">{children}</ul>;
}

function ProjectTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-xl">
      <TabsList aria-label="Atelier Nord">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="deploys">Deploys</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsPanels className="min-h-72 px-control-pad-md pt-6">
        <TabsPanel value="overview">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8">
            {STATS.map(([label, value]) => (
              <div key={label} className="grid gap-1">
                <dt className="text-small [font-weight:var(--weight)] text-fg-subtle">{label}</dt>
                <dd className="text-h3 text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </TabsPanel>
        <TabsPanel value="activity">
          <Rows>
            {ACTIVITY.map(([what, when]) => (
              <li key={what} className="flex min-h-control-md items-center justify-between gap-4 py-2 text-small">
                <span className="text-fg">{what}</span>
                <span className="shrink-0 text-fg-subtle">{when}</span>
              </li>
            ))}
          </Rows>
        </TabsPanel>
        <TabsPanel value="deploys">
          <Rows>
            {DEPLOYS.map((d) => (
              <li key={d.hash} className="flex min-h-control-md items-center gap-3 py-2 text-small">
                <Result tone={d.tone} />
                <span className="font-mono text-caption text-fg-subtle">{d.hash}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{d.message}</span>
                <span className="shrink-0 font-mono text-caption text-fg-subtle">{d.time}</span>
              </li>
            ))}
          </Rows>
        </TabsPanel>
        <TabsPanel value="settings">
          <Rows>
            {SETTINGS.map(([label, value]) => (
              <li key={label} className="flex min-h-control-md items-center justify-between gap-4 py-2 text-small">
                <span className="[font-weight:var(--weight)] text-fg-subtle">{label}</span>
                <span className="text-fg">{value}</span>
              </li>
            ))}
          </Rows>
        </TabsPanel>
      </TabsPanels>
    </Tabs>
  );
}

/* ---------- (b) View switch, segmented ---------- */

const PROJECTS: { name: string; kind: string; when: string; time: string }[] = [
  { name: "Atelier Nord", kind: "Framer site", when: "4 min ago", time: "09:12" },
  { name: "Kiln & Co.", kind: "Framer site", when: "2 h ago", time: "07:40" },
  { name: "Sundial", kind: "CMS migration", when: "Yesterday", time: "16:05" },
  { name: "Parcel", kind: "Design system", when: "3 days ago", time: "11:30" },
];

function ViewSwitch() {
  return (
    <Tabs defaultValue="list" variant="segmented" className="grid w-full max-w-md gap-6">
      <TabsList aria-label="View">
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="grid">Grid</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>
      <TabsPanels className="min-h-64">
        <TabsPanel value="list">
          <Rows>
            {PROJECTS.map((p) => (
              <li key={p.name} className="flex min-h-control-md items-center justify-between gap-4 py-2 text-small">
                <span className="[font-weight:var(--weight)] text-fg">{p.name}</span>
                <span className="text-fg-subtle">{p.kind}</span>
              </li>
            ))}
          </Rows>
        </TabsPanel>
        <TabsPanel value="grid">
          <ul className="grid grid-cols-2 gap-3">
            {PROJECTS.map((p) => (
              <li key={p.name} className="grid h-28 content-between rounded-surface bg-surface-2 p-4">
                <span className="text-small [font-weight:var(--weight)] text-fg">{p.name}</span>
                <span className="text-caption text-fg-subtle">{p.kind}</span>
              </li>
            ))}
          </ul>
        </TabsPanel>
        <TabsPanel value="timeline">
          <ol className="relative grid gap-5 before:absolute before:top-2 before:bottom-2 before:left-[3px] before:w-px before:bg-line">
            {PROJECTS.map((p) => (
              <li key={p.name} className="relative flex items-center gap-4 text-small">
                <span aria-hidden="true" className="relative h-px w-2 shrink-0 bg-fg-subtle" />
                <span className="font-mono text-caption text-fg-subtle">{p.time}</span>
                <span className="[font-weight:var(--weight)] text-fg">{p.name}</span>
                <span className="text-fg-subtle">{p.when}</span>
              </li>
            ))}
          </ol>
        </TabsPanel>
      </TabsPanels>
    </Tabs>
  );
}

/* ---------- (c) Keyboard ---------- */

const PHASES: [string, string][] = [
  ["brief", "Scope agreed. Two Framer pages and a CMS collection."],
  ["design", "Frames signed off. Breakpoints are next."],
  ["build", "Home and services are built. Case studies are in progress."],
  ["review", "Two rounds of comments. One open on the footer."],
  ["ship", "Domain connected. Publish when the copy is final."],
];

function KeyboardDemo() {
  return (
    <div className="grid w-full min-w-0 max-w-xl gap-8">
      <Tabs defaultValue="design" size="sm">
        <TabsList aria-label="Project phase">
          {PHASES.map(([id]) => (
            <TabsTrigger key={id} value={id}>
              {id[0].toUpperCase() + id.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsPanels className="min-h-20 px-control-pad-sm pt-4">
          {PHASES.map(([id, text]) => (
            <TabsPanel key={id} value={id}>
              <p className="text-small text-fg-muted">{text}</p>
            </TabsPanel>
          ))}
        </TabsPanels>
      </Tabs>
      <dl className="grid gap-3 text-small text-fg-subtle">
        {(
          [
            [["←", "→"], "Move to the previous or next tab"],
            [["Home", "End"], "Jump to the first or last tab"],
            [["Tab"], "Leave the list for the panel"],
          ] as [string[], string][]
        ).map(([keys, label]) => (
          <div key={label} className="flex items-center gap-3">
            <dt className="flex min-w-24 gap-1">
              {keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function TabsPage() {
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Project tabs"
        tier="responsive"
        size="lg"
        caption="Pick a tab. The 2px indicator slides to it on the responsive tier while the label only changes color, on the instant tier. The new panel fades in from the side you chose, about half the travel distance, and the old one fades out the other way."
        code="ProjectTabs"
      >
        <ProjectTabs />
      </Stage>

      <Stage
        title="View switch"
        tier="responsive"
        caption="The segmented style uses the same sliding block as a fill. Pick a view and the preview crossfades. Labels never change weight or size, so the group keeps its exact box. On a touch screen a tab you hold fills."
        code="ViewSwitch"
      >
        <ViewSwitch />
      </Stage>

      <Stage
        title="Keyboard navigation"
        tier="responsive"
        caption="Arrow keys move between tabs and select them, Home and End jump to the first and last, and Tab leaves the list for the panel. The indicator and the panel move the same way they do for a click."
        code="KeyboardDemo"
      >
        <KeyboardDemo />
      </Stage>
    </Page>
  );
}
