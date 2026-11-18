import { useState, type ReactNode } from "react";
import { Kbd } from "@/components/kbd";
import { Tabs, TabsList, TabsPanel, TabsPanels, TabsTrigger } from "@/components/tabs";
import { Tag } from "@/components/tag";
import { Page, Stage, type PageDocs, type PageMeta } from "../kit";
import { useLoop } from "../tile";

export const meta: PageMeta = {
  id: "tabs",
  title: "Tabs",
  lede: "Views that slide into place.",
  order: 3.07, group: "Selection",
  verbs: ["select"],
  summary:
    "Underline or segmented. The chosen face slides between tabs, the label only changes color, and the panel fades in from the side of the tab you picked. Press cuts them as folder tabs on a plate; Flat sets them as words with a grey bubble.",
  fun: "Pick a tab far away: the standing tab, or the bubble, glides over on a looser spring.",
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
                <Result tone={d.tone} />
                <span className="font-mono text-caption font-normal text-fg-subtle">{d.hash}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{d.message}</span>
                <span className="shrink-0 tabular-nums text-caption font-normal text-fg-subtle">{d.time}</span>
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
                <span className="text-small font-title text-fg">{p.name}</span>
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
                <span className="tabular-nums text-caption font-normal text-fg-subtle">{p.time}</span>
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

/* ---------- the overview's tile ---------- */

const TILE_TABS = ["Overview", "Activity", "Deploys"];
const TILE_TEXT = ["12,480 visits in the last 7 days.", "Published to production 4 minutes ago.", "Build 5f2e9c1 finished in 42 seconds."];

/** While the pointer rests on the tile, the underline glides from tab to tab on the responsive tier, until someone
    picks one. */
function TabsTile() {
  const [ref, step] = useLoop<HTMLDivElement>(TILE_TABS.length, 2200, 0);
  const [own, setOwn] = useState<string | null>(null);
  const value = own ?? TILE_TABS[step]!;
  return (
    <div ref={ref} className="w-full max-w-sm">
      <Tabs value={value} onValueChange={setOwn}>
        <TabsList aria-label="Atelier Nord">
          {TILE_TABS.map((t) => (
            <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
          ))}
        </TabsList>
        <TabsPanels className="min-h-16 px-control-pad-md pt-4">
          {TILE_TABS.map((t, i) => (
            <TabsPanel key={t} value={t}>
              <p className="text-small text-fg-muted">{TILE_TEXT[i]}</p>
            </TabsPanel>
          ))}
        </TabsPanels>
      </Tabs>
    </div>
  );
}

/* ---------- Device's own (plans/024, phase 3): a take's tabs, the takes view and a take's steps ---------- */

function ExportResult({ tone }: { tone: "success" | "danger" | "muted" }) {
  return (
    <span className="flex w-16 shrink-0">
      {tone === "success" ? <Tag status="success">Done</Tag> : tone === "danger" ? <Tag status="danger">Failed</Tag> : <Tag status="neutral">Queued</Tag>}
    </span>
  );
}

const TAKE_STATS: [string, string][] = [
  ["Length", "00M 47S 08F"],
  ["Format", "48 kHz · 24 bit"],
  ["Peak", "−1.2 dB"],
  ["Size", "13 MB"],
];

const TAKE_MARKERS: [string, string][] = [
  ["Marker 3: room tone", "00M 39S"],
  ["Input 1 clipped at 0 dB", "00M 31S"],
  ["Marker 2: the answer", "00M 18S"],
  ["Marker 1: first question", "00M 06S"],
];

const TAKE_EXPORTS: { id: string; format: string; to: string; time: string; tone: "success" | "danger" | "muted" }[] = [
  { id: "exp-5", format: "WAV", to: "To card A, 48 kHz · 24 bit", time: "4s", tone: "success" },
  { id: "exp-4", format: "MP3", to: "To the phone, 320 kbps", time: "—", tone: "muted" },
  { id: "exp-3", format: "WAV", to: "To card B, not in the slot", time: "0s", tone: "danger" },
  { id: "exp-2", format: "FLAC", to: "To the computer, over USB-C", time: "6s", tone: "success" },
  { id: "exp-1", format: "WAV", to: "To card A, the first cut", time: "4s", tone: "success" },
];

const TAKE_SETTINGS: [string, string][] = [
  ["Scene", "Scene A"],
  ["Location", "By the road"],
  ["Input", "Input 1, lavalier"],
  ["Safety track", "On, 12 dB lower"],
];

function TakeTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-xl">
      <TabsList aria-label="take_04.wav">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="markers">Markers</TabsTrigger>
        <TabsTrigger value="exports">Exports</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsPanels className="min-h-72 px-control-pad-md pt-6">
        <TabsPanel value="overview">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8">
            {TAKE_STATS.map(([label, value]) => (
              <div key={label} className="grid gap-1">
                <dt className="text-small text-fg-subtle">{label}</dt>
                <dd className="text-h3 text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </TabsPanel>
        <TabsPanel value="markers">
          <Rows>
            {TAKE_MARKERS.map(([what, when]) => (
              <li key={what} className="flex min-h-control-md items-center justify-between gap-4 py-2 text-small">
                <span className="text-fg">{what}</span>
                <span className="shrink-0 tabular-nums text-fg-subtle">{when}</span>
              </li>
            ))}
          </Rows>
        </TabsPanel>
        <TabsPanel value="exports">
          <Rows>
            {TAKE_EXPORTS.map((x) => (
              <li key={x.id} className="flex min-h-control-md items-center gap-3 py-2 text-small">
                <ExportResult tone={x.tone} />
                <span className="font-mono text-caption font-normal text-fg-subtle">{x.format}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{x.to}</span>
                <span className="shrink-0 tabular-nums text-caption font-normal text-fg-subtle">{x.time}</span>
              </li>
            ))}
          </Rows>
        </TabsPanel>
        <TabsPanel value="settings">
          <Rows>
            {TAKE_SETTINGS.map(([label, value]) => (
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

const TAKES: { name: string; kind: string; when: string; time: string }[] = [
  { name: "take_04.wav", kind: "Interview", when: "4 min ago", time: "09:12" },
  { name: "take_03.wav", kind: "Room tone", when: "2 h ago", time: "07:40" },
  { name: "take_02.wav", kind: "Dawn chorus", when: "Yesterday", time: "05:05" },
  { name: "take_01.wav", kind: "Slate test", when: "3 days ago", time: "11:30" },
];

function TakesViewSwitch() {
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
            {TAKES.map((t) => (
              <li key={t.name} className="flex min-h-control-md items-center justify-between gap-4 py-2 text-small">
                <span className="text-fg">{t.name}</span>
                <span className="text-fg-subtle">{t.kind}</span>
              </li>
            ))}
          </Rows>
        </TabsPanel>
        <TabsPanel value="grid">
          <ul className="grid grid-cols-2 gap-3">
            {TAKES.map((t) => (
              <li key={t.name} className="grid h-28 content-between rounded-surface bg-surface-2 p-4">
                <span className="text-small font-title text-fg">{t.name}</span>
                <span className="text-caption text-fg-subtle">{t.kind}</span>
              </li>
            ))}
          </ul>
        </TabsPanel>
        <TabsPanel value="timeline">
          <ol className="relative grid gap-5 before:absolute before:top-2 before:bottom-2 before:left-[3px] before:w-px before:bg-line">
            {TAKES.map((t) => (
              <li key={t.name} className="relative flex items-center gap-4 text-small">
                <span aria-hidden="true" className="relative h-px w-2 shrink-0 bg-fg-subtle" />
                <span className="tabular-nums text-caption font-normal text-fg-subtle">{t.time}</span>
                <span className="text-fg">{t.name}</span>
                <span className="text-fg-subtle">{t.when}</span>
              </li>
            ))}
          </ol>
        </TabsPanel>
      </TabsPanels>
    </Tabs>
  );
}

const TAKE_STEPS: [string, string][] = [
  ["slate", "Scene A, take 4, by the road."],
  ["record", "00M 47S 08F at 48 kHz · 24 bit."],
  ["review", "Three markers, and one clip at 00M 31S."],
  ["mix", "Input 1 at −3 dB, with the safety track under the clip."],
  ["export", "take_04.wav to card A and the phone."],
];

function TakeStepsDemo() {
  return (
    <div className="grid w-full min-w-0 max-w-xl gap-8">
      <Tabs defaultValue="record" size="sm">
        <TabsList aria-label="Take step">
          {TAKE_STEPS.map(([id]) => (
            <TabsTrigger key={id} value={id}>
              {id[0].toUpperCase() + id.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsPanels className="min-h-20 px-control-pad-sm pt-4">
          {TAKE_STEPS.map(([id, text]) => (
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

const TAKE_TILE_TABS = ["Overview", "Markers", "Exports"];
const TAKE_TILE_TEXT = ["take_04.wav · 48 kHz · 24 bit, 00M 47S.", "Marker 3, room tone, at 00M 39S.", "Exported to card A in 4 seconds."];

function TakeTabsTile() {
  const [ref, step] = useLoop<HTMLDivElement>(TAKE_TILE_TABS.length, 2200, 0);
  const [own, setOwn] = useState<string | null>(null);
  const value = own ?? TAKE_TILE_TABS[step]!;
  return (
    <div ref={ref} className="w-full max-w-sm">
      <Tabs value={value} onValueChange={setOwn}>
        <TabsList aria-label="take_04.wav">
          {TAKE_TILE_TABS.map((t) => (
            <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
          ))}
        </TabsList>
        <TabsPanels className="min-h-16 px-control-pad-md pt-4">
          {TAKE_TILE_TABS.map((t, i) => (
            <TabsPanel key={t} value={t}>
              <p className="text-small text-fg-muted">{TAKE_TILE_TEXT[i]}</p>
            </TabsPanel>
          ))}
        </TabsPanels>
      </Tabs>
    </div>
  );
}

/* ---------- Flat's own (plans/024, phase 3): a small site's dashboard ---------- */

function IssueResult({ tone }: { tone: "success" | "warning" | "muted" }) {
  return (
    <span className="flex w-20 shrink-0">
      {tone === "success" ? <Tag status="success">Sent</Tag> : tone === "warning" ? <Tag status="warning">Friday</Tag> : <Tag status="neutral">Draft</Tag>}
    </span>
  );
}

const SITE_STATS: [string, string][] = [
  ["Readers, last 7 days", "1,204"],
  ["Subscribers", "412"],
  ["Last post", "2 days ago"],
  ["Posts", "38"],
];

const SITE_ACTIVITY: [string, string][] = [
  ["Mara Lindqvist subscribed", "5 h ago"],
  ["Published Open water", "2 days ago"],
  ["Issue 13 sent to 408 readers", "Friday"],
  ["Started the spring series", "March"],
];

const ISSUES: { n: number; title: string; when: string; tone: "success" | "warning" | "muted" }[] = [
  { n: 15, title: "A new series, maybe", when: "No date", tone: "muted" },
  { n: 14, title: "The last of the spring series", when: "Fri 9:00", tone: "warning" },
  { n: 13, title: "A red sun in March", when: "14 Nov", tone: "success" },
  { n: 12, title: "What the garden did", when: "7 Nov", tone: "success" },
  { n: 11, title: "Notes on a slow shutter", when: "31 Oct", tone: "success" },
];

const SITE_SETTINGS: [string, string][] = [
  ["Address", "lowtide.site"],
  ["Letter", "Fridays at 9:00"],
  ["Visibility", "Public"],
  ["Replies", "On"],
];

function SiteTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-xl">
      <TabsList aria-label="Low Tide">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="letter">Letter</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsPanels className="min-h-72 px-control-pad-md pt-6">
        <TabsPanel value="overview">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8">
            {SITE_STATS.map(([label, value]) => (
              <div key={label} className="grid gap-1">
                <dt className="text-small text-fg-subtle">{label}</dt>
                <dd className="text-h3 text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </TabsPanel>
        <TabsPanel value="activity">
          <Rows>
            {SITE_ACTIVITY.map(([what, when]) => (
              <li key={what} className="flex min-h-control-md items-center justify-between gap-4 py-2 text-small">
                <span className="text-fg">{what}</span>
                <span className="shrink-0 text-fg-subtle">{when}</span>
              </li>
            ))}
          </Rows>
        </TabsPanel>
        <TabsPanel value="letter">
          <Rows>
            {ISSUES.map((issue) => (
              <li key={issue.n} className="flex min-h-control-md items-center gap-3 py-2 text-small">
                <IssueResult tone={issue.tone} />
                <span className="tabular-nums text-caption font-normal text-fg-subtle">Issue {issue.n}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{issue.title}</span>
                <span className="shrink-0 tabular-nums text-caption font-normal text-fg-subtle">{issue.when}</span>
              </li>
            ))}
          </Rows>
        </TabsPanel>
        <TabsPanel value="settings">
          <Rows>
            {SITE_SETTINGS.map(([label, value]) => (
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

const SITE_POSTS: { name: string; kind: string; when: string; time: string }[] = [
  { name: "Open water", kind: "Spring series", when: "2 days ago", time: "08:10" },
  { name: "Dusk tide", kind: "Spring series", when: "Last week", time: "19:42" },
  { name: "What the garden did", kind: "The garden", when: "October", time: "07:05" },
  { name: "Drawing the tide line", kind: "Pencil studies", when: "October", time: "11:30" },
];

function PostViewSwitch() {
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
            {SITE_POSTS.map((p) => (
              <li key={p.name} className="flex min-h-control-md items-center justify-between gap-4 py-2 text-small">
                <span className="text-fg">{p.name}</span>
                <span className="text-fg-subtle">{p.kind}</span>
              </li>
            ))}
          </Rows>
        </TabsPanel>
        <TabsPanel value="grid">
          <ul className="grid grid-cols-2 gap-3">
            {SITE_POSTS.map((p) => (
              <li key={p.name} className="grid h-28 content-between rounded-surface bg-surface-2 p-4">
                <span className="text-small font-title text-fg">{p.name}</span>
                <span className="text-caption text-fg-subtle">{p.kind}</span>
              </li>
            ))}
          </ul>
        </TabsPanel>
        <TabsPanel value="timeline">
          <ol className="relative grid gap-5 before:absolute before:top-2 before:bottom-2 before:left-[3px] before:w-px before:bg-line">
            {SITE_POSTS.map((p) => (
              <li key={p.name} className="relative flex items-center gap-4 text-small">
                <span aria-hidden="true" className="relative h-px w-2 shrink-0 bg-fg-subtle" />
                <span className="tabular-nums text-caption font-normal text-fg-subtle">{p.time}</span>
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

const ISSUE_PHASES: [string, string][] = [
  ["draft", "The opening lines are written. Two posts and one picture to add."],
  ["pictures", "Six pictures picked. Each gets a line saying what it shows."],
  ["read", "Read it aloud once. One sentence in the second post is too long."],
  ["test", "A test went to you. The links all work on a phone."],
  ["send", "Goes out Friday at 9:00 to 412 subscribers."],
];

function IssueStepsDemo() {
  return (
    <div className="grid w-full min-w-0 max-w-xl gap-8">
      <Tabs defaultValue="pictures" size="sm">
        <TabsList aria-label="Issue 14">
          {ISSUE_PHASES.map(([id]) => (
            <TabsTrigger key={id} value={id}>
              {id[0].toUpperCase() + id.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsPanels className="min-h-20 px-control-pad-sm pt-4">
          {ISSUE_PHASES.map(([id, text]) => (
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

const SITE_TILE_TABS = ["Overview", "Readers", "Letter"];
const SITE_TILE_TEXT = ["1,204 readers in the last 7 days.", "Mara Lindqvist subscribed 5 hours ago.", "Issue 14 goes out Friday at 9:00."];

function SiteTabsTile() {
  const [ref, step] = useLoop<HTMLDivElement>(SITE_TILE_TABS.length, 2200, 0);
  const [own, setOwn] = useState<string | null>(null);
  const value = own ?? SITE_TILE_TABS[step]!;
  return (
    <div ref={ref} className="w-full max-w-sm">
      <Tabs value={value} onValueChange={setOwn}>
        <TabsList aria-label="Low Tide">
          {SITE_TILE_TABS.map((t) => (
            <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
          ))}
        </TabsList>
        <TabsPanels className="min-h-16 px-control-pad-md pt-4">
          {SITE_TILE_TABS.map((t, i) => (
            <TabsPanel key={t} value={t}>
              <p className="text-small text-fg-muted">{SITE_TILE_TEXT[i]}</p>
            </TabsPanel>
          ))}
        </TabsPanels>
      </Tabs>
    </div>
  );
}

export default function TabsPage() {
  return (
    <Page meta={meta} docs={docs} tile={<TabsTile />} tileByWorld={{ device: <TakeTabsTile />, flat: <SiteTabsTile /> }}>
      <Stage
        title="Project tabs"
        tier="responsive"
        size="lg"
        caption="Pick a tab. The chosen face (a tab standing on the plate in Press, a grey bubble in Flat) slides to it on the responsive tier while the label only changes color, on the instant tier. The new panel fades in from the side you chose, about half the travel distance, and the old one fades out the other way."
        code="ProjectTabs"
        byWorld={{
          flat: {
            demo: <SiteTabs />,
            title: "A site's tabs",
            code: "SiteTabs",
            caption:
              "A small site's dashboard: its overview, what happened, its letter and its settings. Pick a tab. The grey bubble slides to it on the responsive tier while the label only changes color, on the instant tier. The new panel fades in from the side you chose, about half the travel distance, and the old one fades out the other way.",
          },
          device: {
            demo: <TakeTabs />,
            title: "A take's tabs",
            code: "TakeTabs",
            caption:
              "A take's page in a recorder's app: its overview, its markers, its exports and its settings. Pick a tab. The chosen face slides to it on the responsive tier while the label only changes colour, on the instant tier. The new panel fades in from the side you chose, about half the travel distance, and the old one fades out the other way.",
          },
        }}
      >
        <ProjectTabs />
      </Stage>

      <Stage
        title="View switch"
        tier="responsive"
        caption="The segmented style uses the same sliding face as a raised block in a tray (Press) or a bubble behind the word (Flat). Pick a view and the preview crossfades. Labels never change weight or size, so the group keeps its exact box. On a touch screen a tab you hold fills."
        code="ViewSwitch"
        byWorld={{ flat: { demo: <PostViewSwitch />, code: "PostViewSwitch" }, device: { demo: <TakesViewSwitch />, code: "TakesViewSwitch" } }}
      >
        <ViewSwitch />
      </Stage>

      <Stage
        title="Keyboard navigation"
        tier="responsive"
        caption="Arrow keys move between tabs and select them, Home and End jump to the first and last, and Tab leaves the list for the panel. The indicator and the panel move the same way they do for a click."
        code="KeyboardDemo"
        byWorld={{ flat: { demo: <IssueStepsDemo />, code: "IssueStepsDemo" }, device: { demo: <TakeStepsDemo />, code: "TakeStepsDemo" } }}
      >
        <KeyboardDemo />
      </Stage>

    </Page>
  );
}
