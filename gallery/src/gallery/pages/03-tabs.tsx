import type { ReactNode } from "react";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";
import { Page, Stage, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "tabs",
  title: "Tabs",
  order: 3,
  summary:
    "Underline or segmented. The indicator slides between tabs, the label only changes color, and the panel fades in from the side of the tab you picked.",
  tiers: ["instant", "responsive"],
};

function Dot({ tone }: { tone: "success" | "danger" | "muted" }) {
  const color = tone === "success" ? "bg-success" : tone === "danger" ? "bg-danger" : "bg-fg-disabled";
  return <span aria-hidden="true" className={"size-1.5 shrink-0 rounded-pill " + color} />;
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
                <dt className="text-small text-fg-subtle">{label}</dt>
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
                <Dot tone={d.tone} />
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
                <span className="text-fg-subtle">{label}</span>
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
                <span className="text-fg">{p.name}</span>
                <span className="text-fg-subtle">{p.kind}</span>
              </li>
            ))}
          </Rows>
        </TabsPanel>
        <TabsPanel value="grid">
          <ul className="grid grid-cols-2 gap-3">
            {PROJECTS.map((p) => (
              <li key={p.name} className="grid h-28 content-between rounded-surface bg-surface-2 p-4">
                <span className="text-small text-fg">{p.name}</span>
                <span className="text-caption text-fg-subtle">{p.kind}</span>
              </li>
            ))}
          </ul>
        </TabsPanel>
        <TabsPanel value="timeline">
          <ol className="relative grid gap-5 before:absolute before:top-2 before:bottom-2 before:left-[3px] before:w-px before:bg-line">
            {PROJECTS.map((p) => (
              <li key={p.name} className="relative flex items-center gap-4 text-small">
                <span aria-hidden="true" className="relative size-2 shrink-0 rounded-pill bg-fg-subtle" />
                <span className="font-mono text-caption text-fg-subtle">{p.time}</span>
                <span className="text-fg">{p.name}</span>
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

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid h-5 min-w-5 place-items-center rounded-control bg-surface-2 px-1 font-mono text-caption text-fg-subtle shadow-[inset_0_0_0_1px_var(--line)]">
      {children}
    </kbd>
  );
}

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
                <Key key={k}>{k}</Key>
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
    <Page meta={meta}>
      <Stage
        title="Project tabs"
        tier="responsive"
        size="lg"
        caption="Pick a tab. The 2px indicator slides to it on the responsive tier while the label only changes color, on the instant tier. The new panel fades in from the side you chose, about half the travel distance, and the old one fades out the other way."
      >
        <ProjectTabs />
      </Stage>

      <Stage
        title="View switch"
        tier="responsive"
        caption="The segmented style uses the same sliding block as a fill. Pick a view and the preview crossfades. Labels never change weight or size, so the group keeps its exact box."
      >
        <ViewSwitch />
      </Stage>

      <Stage
        title="Keyboard"
        tier="responsive"
        caption="Arrow keys move between tabs and select them, Home and End jump to the first and last, and Tab leaves the list for the panel. The indicator and the panel move the same way they do for a click."
      >
        <KeyboardDemo />
      </Stage>
    </Page>
  );
}
