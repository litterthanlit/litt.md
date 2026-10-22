import { useDeferredValue, useMemo, useState } from "react";
import { ActionBar } from "@/components/action-bar";
import { Button } from "@/components/button";
import { PlusIcon, RetryIcon } from "@/components/icons";
import { Input } from "@/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  TableSelectCell,
  TableSelectHead,
  TableSkeleton,
  TableVirtualBody,
  useRowSelection,
} from "@/components/table";
import { TableFilter } from "@/components/table-filter";
import { Tag } from "@/components/tag";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "table",
  title: "Table",
  lede: "Rows and columns, with real table semantics.",
  order: 16, group: "Data",
  verbs: ["press"],
  summary:
    "Real table semantics with hairline rows, mono figures and a sticky header. Its rows can arrive in one staggered cascade, this page's single expressive moment; sorting, filtering and inserting stay responsive, and hover never moves anything. A virtual body draws only the rows in view, so ten thousand rows scroll as lightly as forty, and rows can be selected with a box, Shift for a range.",
  tiers: ["instant", "responsive", "expressive"],
};

export const docs: PageDocs = {
  components: ["table", "table-filter"],
  exports: ["Table", "TableHeader", "TableBody", "TableRow", "TableHead", "TableCell", "TableEmpty", "TableSkeleton", "TableVirtualBody", "TableSelectHead", "TableSelectCell", "useRowSelection", "TableFilter"],
  usage: `import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/table";

// label names the table. entrance plays the staggered cascade: turn it on for one table per page.
// max-h-96 gives the header something to stick against while the rows scroll.
<Table label="Deploy history" entrance className="max-h-96">
  <TableHeader>
    <TableRow>
      <TableHead>Site</TableHead>
      <TableHead>Status</TableHead>
      <TableHead numeric>Build time</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {deploys.map((d) => (
      <TableRow key={d.id}>
        <TableCell primary>{d.site}</TableCell>
        <TableCell>{d.status}</TableCell>
        <TableCell numeric>{d.seconds} s</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// Sortable: add onSort and the current direction. You sort the rows; animateChanges moves them.
<TableHead numeric sort="descending" onSort={() => setDirection("ascending")}>Amount</TableHead>

// Loading and empty rows.
<TableBody>{loading ? <TableSkeleton columns={["primary", "text", "number"]} /> : rows}</TableBody>
<TableEmpty columns={3} action={<Button size="sm">Add site</Button>}>No deploys yet.</TableEmpty>

// Thousands of rows: a virtual body draws only the ones in view. The Table's max height is the scroller.
// Filter with a deferred query, so typing never waits for the table.
const query = useDeferredValue(search);
const shown = useMemo(() => deploys.filter((d) => d.site.includes(query)), [query]);
const selection = useRowSelection(shown.map((d) => d.id));

<Table label="Deploys" className="max-h-[28rem]">
  <TableHeader>
    <TableRow>
      <TableSelectHead state={selection.head} onToggle={selection.toggleAll} />
      <TableHead>Site</TableHead>
      <TableHead numeric>Build time</TableHead>
    </TableRow>
  </TableHeader>
  <TableVirtualBody count={shown.length} columns={3}>
    {(i) => {
      const d = shown[i];
      return (
        <TableRow key={d.id} selected={selection.isSelected(d.id)}>
          <TableSelectCell label={\`Select \${d.site}\`} checked={selection.isSelected(d.id)} onToggle={(range) => selection.toggle(d.id, range)} />
          <TableCell primary>{d.site}</TableCell>
          <TableCell numeric>{d.seconds} s</TableCell>
        </TableRow>
      );
    }}
  </TableVirtualBody>
</Table>
<ActionBar count={selection.count} noun="deploys" onClear={selection.clear}>…</ActionBar>

// A column filter sits in its header. Checkbox rows by default (none on is no filter), with counts.
import { TableFilter } from "@/components/table-filter";
<TableHead filter={<TableFilter column="Status" value={statuses} onValueChange={setStatuses}
  options={[{ value: "ready", label: "Ready", count: 9214 }, { value: "failed", label: "Failed", count: 786 }]} />}>
  Status
</TableHead>
// Buckets of a number: one choice, All first.
<TableHead numeric filter={<TableFilter column="Build time" multiple={false} align="end" value={speed} onValueChange={setSpeed}
  options={[{ value: "fast", label: "Under 30 s" }, { value: "slow", label: "Over 60 s" }]} />}>
  Build time
</TableHead>`,
  use: [
    "People compare rows across the same few fields: deploys, invoices, clients, builds. A table lines the values up so the eye can run down a column.",
    "The numbers and dates matter. They are set in mono, right-aligned, so figures line up by place.",
    "The list is long enough to scroll. The header stays in view once you give the Table a max height.",
    "Thousands of rows, such as a deploy history or an audit log. Use TableVirtualBody, so only the rows in view are drawn.",
    "People act on several rows at once. Add TableSelectHead and TableSelectCell with useRowSelection, and an ActionBar after the table.",
    "People narrow a long table by a column's values: status, site, a range of build times. Give that column's TableHead a TableFilter.",
    "Rows can be sorted, filtered or inserted. Turn on animateChanges and they glide to their new places.",
    "You need a table on a phone. It scrolls sideways inside its own labelled region and never widens the page.",
  ],
  skip: [
    "Each item is an independent object with a picture, such as a client site. Use Card, or List and cards.",
    "A short list of one field, such as actions or commands. Use Menu or the Command menu.",
    "Layout. A table is for data, so do not use it to place things in columns.",
    "Rows of different heights in a long list, such as wrapped notes. The virtual body needs every row one line tall; use Pagination instead.",
    "You want a whole row to be a button. Put a real link in the primary cell instead, because a click handler on a row is not reachable by keyboard.",
  ],
  keyboard: [
    [["Tab"], "Moves through the sortable headers and any links or buttons in the cells. When the table scrolls, it also stops once on the scroll region itself."],
    [["Enter", "Space"], "On a sortable header, calls onSort."],
    [["↑", "↓", "←", "→"], "On the focused scroll region, scrolls it. The region only takes focus when there is something to scroll."],
    [["Space"], "On a row's box, selects or clears the row. On the head box, selects or clears every row shown."],
    [["Shift"], "Held while pressing a row's box (click or Space), selects or clears every row between it and the last box pressed."],
    [["Enter", "Space", "ArrowDown"], "On a column's filter button, opens its values. In the menu, Space toggles a value and keeps the menu open; Esc closes it."],
  ],
  a11y: [
    "It is a real <table> with a hidden <caption>, <th scope=\"col\"> headers and a <th scope=\"row\"> for each primary cell, so a screen reader can read a value with its column and its row.",
    "A sortable header holds a button, and its <th> carries aria-sort. The arrow shows the direction as well as the color, and the unsorted icon shows the column can be sorted. Nothing announces that the rows changed order, so add a polite live region if that matters.",
    "When the table is wider or taller than its space, the region becomes focusable and is labelled with the table's name, so a keyboard user can scroll it. When it fits, there is no extra tab stop.",
    "The page never scrolls sideways. A cell does not wrap, so a narrow screen scrolls the table inside its region; add whitespace-normal to a cell that must wrap.",
    "Pass busy while loading. It sets aria-busy and announces \"Loading\" with the label. The skeleton rows are hidden from screen readers, and TableEmpty is a status.",
    "Hover is a fill and never reveals anything, so touch loses nothing. On a touch screen a row held down gets the same kind of fill, and so does a sortable header, as feedback only: a row is not a button. Rows are 44px tall, and a sortable header is 44px.",
    "Color never carries a status alone. The demos use status Tags, which always say the status in words.",
    "Under reduced motion the rows appear at once, with no travel or stagger, and the hover fill changes without a fade.",
    "A virtual body keeps the table's semantics: aria-rowcount on the table and aria-rowindex on each row, so a screen reader says where a row sits in the whole list. Only the drawn rows can be tabbed to or found with the browser's find, so give a long table a search field.",
    "A column's filter button is named for the column and what it holds (\"Filter status, 2 of 4 on\"), and its menu is named \"Filter status\". A filtering column's button looks selected and says how many values are on, so color never says it alone. Say the result in a polite status, as the count above the table does.",
    "Each row's box is named for the row (\"Select Halden Gallery\") and the head box for what it selects; it is mixed while only some rows shown are selected. A selected row is also filled, but the box carries the state.",
  ],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-24" becomes "24 Oct": always six characters, so mono dates align. */
function shortDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day} ${MONTHS[Number(month) - 1]}`;
}

type Tone = "success" | "warning" | "danger" | "neutral";

/** A status as a Tag: the word in the status color. Two neutral statuses differ by their words. */
function Status({ tone, children }: { tone: Tone; children: string }) {
  return <Tag status={tone}>{children}</Tag>;
}

/* ---------- (a) Deploy history: the entrance ---------- */

type Deploy = { id: string; site: string; env: string; ok: boolean; seconds: number; at: string };

const DEPLOYS: Deploy[] = [
  { id: "d1", site: "litt.design v3", env: "Production", ok: true, seconds: 38, at: "2026-10-10" },
  { id: "d2", site: "Studio site refresh", env: "Preview", ok: true, seconds: 41, at: "2026-10-10" },
  { id: "d3", site: "Halden Gallery", env: "Preview", ok: false, seconds: 12, at: "2026-10-09" },
  { id: "d4", site: "Founder landing", env: "Production", ok: true, seconds: 52, at: "2026-10-06" },
  { id: "d5", site: "Kassa dashboard", env: "Preview", ok: true, seconds: 84, at: "2026-10-04" },
  { id: "d6", site: "Framer template 14", env: "Production", ok: true, seconds: 47, at: "2026-09-22" },
  { id: "d7", site: "Grotta Type", env: "Preview", ok: false, seconds: 9, at: "2026-09-21" },
  { id: "d8", site: "Marlow Labs docs", env: "Production", ok: true, seconds: 63, at: "2026-09-19" },
  { id: "d9", site: "litt.design v3", env: "Preview", ok: true, seconds: 36, at: "2026-09-17" },
  { id: "d10", site: "Studio site refresh", env: "Production", ok: true, seconds: 44, at: "2026-09-15" },
];

function DeployHistoryDemo() {
  return (
    <Table label="Deploy history" entrance className="max-h-96 max-w-3xl">
      <TableHeader>
        <TableRow>
          <TableHead>Site</TableHead>
          <TableHead>Environment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead numeric>Build time</TableHead>
          <TableHead numeric>Deployed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {DEPLOYS.map((d) => (
          <TableRow key={d.id}>
            <TableCell primary>{d.site}</TableCell>
            <TableCell>{d.env}</TableCell>
            <TableCell>
              <Status tone={d.ok ? "success" : "danger"}>{d.ok ? "Ready" : "Failed"}</Status>
            </TableCell>
            <TableCell numeric>{d.seconds} s</TableCell>
            <TableCell numeric>
              <time dateTime={d.at}>{shortDate(d.at)}</time>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ---------- (a2) Ten thousand deploys: the virtual body and selection ---------- */

type BigDeploy = { id: string; site: string; branch: string; ok: boolean; seconds: number; at: string };

const SITES = ["litt.design v3", "Studio site refresh", "Halden Gallery", "Founder landing", "Kassa dashboard", "Grotta Type", "Marlow Labs docs", "Atlas portfolio"];
const BRANCHES = ["main", "preview/type", "fix/og-image", "feat/cms", "main", "main"];

/** Ten thousand deploys, the same every time: a small seeded generator, so the page fetches nothing. */
const MANY: BigDeploy[] = (() => {
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const out: BigDeploy[] = [];
  let day = Date.UTC(2026, 9, 22);
  for (let i = 0; i < 10000; i++) {
    if (next() < 0.3) day -= 86400000;
    out.push({
      id: `dpl_${(10000 - i).toString(36).padStart(4, "0")}`,
      site: SITES[Math.floor(next() * SITES.length)]!,
      branch: BRANCHES[Math.floor(next() * BRANCHES.length)]!,
      ok: next() > 0.08,
      seconds: 20 + Math.floor(next() * 70),
      at: new Date(day).toISOString().slice(0, 10),
    });
  }
  return out;
})();

const COUNT = new Intl.NumberFormat("en-GB");

/* Build time in buckets, for the single-choice filter. */
const SPEEDS = [
  { value: "fast", label: "Under 30 s", test: (s: number) => s < 30 },
  { value: "usual", label: "30 to 60 s", test: (s: number) => s >= 30 && s <= 60 },
  { value: "slow", label: "Over 60 s", test: (s: number) => s > 60 },
];
const STATUSES = [
  { value: "ready", label: "Ready" },
  { value: "failed", label: "Failed" },
];

function ManyDeploysDemo() {
  const [search, setSearch] = useState("");
  const [slowFirst, setSlowFirst] = useState(false);
  const [statusOn, setStatusOn] = useState<string[]>([]);
  const [sitesOn, setSitesOn] = useState<string[]>([]);
  const [speedOn, setSpeedOn] = useState<string[]>([]);
  /* The table follows the query and the filters a beat behind the controls, so nothing waits on ten thousand rows. */
  const query = useDeferredValue(search.trim().toLowerCase());
  /* Each list is deferred on its own: they keep their identity until they change, so the rows are worked out again only then. */
  const statusD = useDeferredValue(statusOn);
  const sitesD = useDeferredValue(sitesOn);
  const speedD = useDeferredValue(speedOn);

  /* One pass: the rows that match everything, and for each filter's values how many rows match everything else, so
     each count in a menu is what picking that value would give. */
  const { shown, counts } = useMemo(() => {
    const speed = SPEEDS.find((b) => b.value === speedD[0]);
    const counts = { status: new Map<string, number>(), site: new Map<string, number>() };
    const found: BigDeploy[] = [];
    for (const d of MANY) {
      if (query && !(d.site.toLowerCase().includes(query) || d.branch.includes(query) || d.id.includes(query))) continue;
      const status = d.ok ? "ready" : "failed";
      const byStatus = !statusD.length || statusD.includes(status);
      const bySite = !sitesD.length || sitesD.includes(d.site);
      const bySpeed = !speed || speed.test(d.seconds);
      if (bySite && bySpeed) counts.status.set(status, (counts.status.get(status) ?? 0) + 1);
      if (byStatus && bySpeed) counts.site.set(d.site, (counts.site.get(d.site) ?? 0) + 1);
      if (byStatus && bySite && bySpeed) found.push(d);
    }
    return { shown: slowFirst ? found.sort((a, b) => b.seconds - a.seconds) : found, counts };
  }, [query, statusD, sitesD, speedD, slowFirst]);
  const ids = useMemo(() => shown.map((d) => d.id), [shown]);
  const selection = useRowSelection(ids);
  const filtering = statusOn.length + sitesOn.length + speedOn.length > 0;
  const clearAll = () => {
    setStatusOn([]);
    setSitesOn([]);
    setSpeedOn([]);
    setSearch("");
  };

  return (
    <div className="grid w-full max-w-4xl gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          size="sm"
          type="search"
          aria-label="Search deploys"
          placeholder="Search site, branch or id"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <div className="flex items-center gap-3">
          <p aria-live="polite" className="font-mono text-caption font-normal tabular-nums text-fg-subtle">
            {shown.length === MANY.length ? `${COUNT.format(MANY.length)} deploys` : `${COUNT.format(shown.length)} of ${COUNT.format(MANY.length)} deploys`}
          </p>
          {(filtering || search) && (
            <Button size="sm" variant="ghost" onClick={clearAll}>
              Clear filters
            </Button>
          )}
        </div>
      </div>
      <Table label="Deploys" className="max-h-[28rem]">
        <TableHeader>
          <TableRow>
            <TableSelectHead state={selection.head} onToggle={selection.toggleAll} label="Select every deploy shown" />
            <TableHead>Deploy</TableHead>
            <TableHead
              filter={
                <TableFilter
                  column="Site"
                  value={sitesOn}
                  onValueChange={setSitesOn}
                  options={SITES.map((site) => ({ value: site, label: site, count: counts.site.get(site) ?? 0 }))}
                />
              }
            >
              Site
            </TableHead>
            <TableHead>Branch</TableHead>
            <TableHead
              filter={
                <TableFilter
                  column="Status"
                  value={statusOn}
                  onValueChange={setStatusOn}
                  options={STATUSES.map((st) => ({ ...st, count: counts.status.get(st.value) ?? 0 }))}
                />
              }
            >
              Status
            </TableHead>
            <TableHead
              numeric
              sort={slowFirst ? "descending" : "none"}
              onSort={() => setSlowFirst((v) => !v)}
              filter={<TableFilter column="Build time" multiple={false} align="end" value={speedOn} onValueChange={setSpeedOn} options={SPEEDS} allLabel="Any time" />}
            >
              Build time
            </TableHead>
            <TableHead numeric>Deployed</TableHead>
          </TableRow>
        </TableHeader>
        {shown.length ? (
          <TableVirtualBody count={shown.length} columns={7}>
            {(i) => {
              const d = shown[i]!;
              const on = selection.isSelected(d.id);
              return (
                <TableRow key={d.id} selected={on}>
                  <TableSelectCell label={`Select ${d.id}`} checked={on} onToggle={(range) => selection.toggle(d.id, range)} />
                  <TableCell primary>
                    <span className="font-mono text-caption font-normal">{d.id}</span>
                  </TableCell>
                  <TableCell>{d.site}</TableCell>
                  <TableCell>
                    <span className="font-mono text-caption font-normal">{d.branch}</span>
                  </TableCell>
                  <TableCell>
                    <Status tone={d.ok ? "success" : "danger"}>{d.ok ? "Ready" : "Failed"}</Status>
                  </TableCell>
                  <TableCell numeric>{d.seconds} s</TableCell>
                  <TableCell numeric>
                    <time dateTime={d.at}>{shortDate(d.at)}</time>
                  </TableCell>
                </TableRow>
              );
            }}
          </TableVirtualBody>
        ) : (
          <TableBody>
            <TableEmpty columns={7} action={<Button size="sm" onClick={clearAll}>Clear filters</Button>}>
              No deploy matches these filters.
            </TableEmpty>
          </TableBody>
        )}
      </Table>
      <ActionBar count={selection.count} noun="deploys" onClear={selection.clear}>
        <Button size="sm" icon={<RetryIcon />} onClick={selection.clear}>
          Redeploy
        </Button>
      </ActionBar>
    </div>
  );
}

/* ---------- (b) Invoices: sort, filter and insert ---------- */

type InvoiceStatus = "Paid" | "Sent" | "Overdue" | "Draft";
type Invoice = { id: string; client: string; status: InvoiceStatus; amount: number; due: string };

const INVOICES: Invoice[] = [
  { id: "INV-0412", client: "Halden Gallery", status: "Sent", amount: 4800, due: "2026-10-24" },
  { id: "INV-0411", client: "Marlow Labs", status: "Paid", amount: 1200, due: "2026-10-15" },
  { id: "INV-0410", client: "Kassa", status: "Overdue", amount: 3600, due: "2026-10-01" },
  { id: "INV-0409", client: "Grotta Type", status: "Draft", amount: 2400, due: "2026-11-05" },
  { id: "INV-0408", client: "Litt Templates", status: "Paid", amount: 950, due: "2026-09-30" },
  { id: "INV-0407", client: "Marlow Labs", status: "Paid", amount: 1200, due: "2026-09-15" },
  { id: "INV-0406", client: "Halden Gallery", status: "Overdue", amount: 1800, due: "2026-09-20" },
  { id: "INV-0405", client: "Ines Ortega", status: "Paid", amount: 2800, due: "2026-09-01" },
];

const TONE: Record<InvoiceStatus, Tone> = { Paid: "success", Sent: "neutral", Overdue: "danger", Draft: "neutral" };
const EUR = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" });
const FILTERS = ["All", "Paid", "Sent", "Overdue"] as const;
type Filter = (typeof FILTERS)[number];
type SortKey = "amount" | "due";
type Direction = "ascending" | "descending";

function InvoicesDemo() {
  const [invoices, setInvoices] = useState<Invoice[]>(INVOICES);
  const [filter, setFilter] = useState<Filter>("All");
  const [sort, setSort] = useState<{ key: SortKey; direction: Direction } | null>(null);

  const shown = invoices
    .filter((inv) => filter === "All" || inv.status === filter)
    .sort((a, b) => {
      if (!sort) return 0;
      const order = sort.key === "amount" ? a.amount - b.amount : a.due.localeCompare(b.due);
      return sort.direction === "ascending" ? order : -order;
    });

  // none, then ascending, then descending, then back to the order the rows came in.
  const press = (key: SortKey) =>
    setSort((s) =>
      s?.key !== key ? { key, direction: "ascending" } : s.direction === "ascending" ? { key, direction: "descending" } : null,
    );
  const sortOf = (key: SortKey) => (sort?.key === key ? sort.direction : "none");

  const add = () => {
    const number = 413 + invoices.length - INVOICES.length;
    setInvoices((all) => [
      { id: `INV-0${number}`, client: "Studio site refresh", status: "Draft", amount: 2000, due: "2026-11-12" },
      ...all,
    ]);
    // A new draft would be hidden by the other filters, so show everything.
    if (filter !== "All") setFilter("All");
  };

  return (
    <div className="grid w-full max-w-3xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Filter invoices" className="flex flex-wrap gap-2">
          {FILTERS.map((name) => (
            <Button
              key={name}
              size="sm"
              variant={filter === name ? "secondary" : "ghost"}
              aria-pressed={filter === name}
              onClick={() => setFilter(name)}
            >
              {name}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span aria-live="polite" className="text-small tabular-nums text-fg-subtle">
            {shown.length} {shown.length === 1 ? "invoice" : "invoices"}
          </span>
          <Button variant="primary" size="sm" icon={<PlusIcon />} onClick={add}>
            New invoice
          </Button>
        </div>
      </div>

      <Table label="Invoices" animateChanges className="max-h-112">
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead numeric sort={sortOf("amount")} onSort={() => press("amount")}>
              Amount
            </TableHead>
            <TableHead numeric sort={sortOf("due")} onSort={() => press("due")}>
              Due
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell primary>{inv.id}</TableCell>
              <TableCell>{inv.client}</TableCell>
              <TableCell>
                <Status tone={TONE[inv.status]}>
                  {inv.status}
                </Status>
              </TableCell>
              <TableCell numeric>{EUR.format(inv.amount)}</TableCell>
              <TableCell numeric>
                <time dateTime={inv.due}>{shortDate(inv.due)}</time>
              </TableCell>
            </TableRow>
          ))}
          {shown.length === 0 && (
            <TableEmpty columns={5} action={<Button size="sm" onClick={() => setFilter("All")}>Show all invoices</Button>}>
              No invoices match this filter.
            </TableEmpty>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* ---------- (c) Loading and empty ---------- */

type Client = { id: string; name: string; sites: number; plan: string; monthly: number };

const CLIENTS: Client[] = [
  { id: "c1", name: "Halden Gallery", sites: 2, plan: "Studio", monthly: 480 },
  { id: "c2", name: "Marlow Labs", sites: 3, plan: "Studio", monthly: 720 },
  { id: "c3", name: "Kassa", sites: 1, plan: "Starter", monthly: 190 },
  { id: "c4", name: "Grotta Type", sites: 1, plan: "Starter", monthly: 190 },
];

const STATES = ["Loading", "Loaded", "Empty"] as const;
type DataState = (typeof STATES)[number];

function StatesDemo() {
  const [state, setState] = useState<DataState>("Loading");
  return (
    <div className="grid w-full max-w-2xl gap-6">
      <div role="group" aria-label="Table state" className="flex gap-2">
        {STATES.map((name) => (
          <Button
            key={name}
            size="sm"
            variant={state === name ? "secondary" : "ghost"}
            aria-pressed={state === name}
            onClick={() => setState(name)}
          >
            {name}
          </Button>
        ))}
      </div>

      <Table label="Clients" busy={state === "Loading"} animateChanges>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead numeric>Sites</TableHead>
            <TableHead numeric>Monthly</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state === "Loading" && <TableSkeleton columns={["primary", "text", "number", "number"]} rows={4} />}
          {state === "Loaded" &&
            CLIENTS.map((c) => (
              <TableRow key={c.id}>
                <TableCell primary>{c.name}</TableCell>
                <TableCell>{c.plan}</TableCell>
                <TableCell numeric>{c.sites}</TableCell>
                <TableCell numeric>{EUR.format(c.monthly)}</TableCell>
              </TableRow>
            ))}
          {state === "Empty" && (
            <TableEmpty columns={4} action={<Button size="sm">Add a client</Button>}>
              No clients yet. A client appears here once you add their first site.
            </TableEmpty>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* ---------- (d) A narrow screen ---------- */

type Account = { id: string; name: string; region: string; plan: string; sites: number; monthly: number; renews: string };

const ACCOUNTS: Account[] = [
  { id: "a1", name: "Halden Gallery", region: "Oslo", plan: "Studio", sites: 2, monthly: 480, renews: "2026-11-01" },
  { id: "a2", name: "Marlow Labs", region: "Berlin", plan: "Studio", sites: 3, monthly: 720, renews: "2026-11-14" },
  { id: "a3", name: "Kassa", region: "Lisbon", plan: "Starter", sites: 1, monthly: 190, renews: "2026-12-02" },
  { id: "a4", name: "Grotta Type", region: "Milan", plan: "Starter", sites: 1, monthly: 190, renews: "2026-12-19" },
  { id: "a5", name: "Ines Ortega", region: "Madrid", plan: "Starter", sites: 1, monthly: 190, renews: "2027-01-08" },
];

function NarrowDemo() {
  return (
    <Table label="Accounts" className="max-w-sm">
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Region</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead numeric>Sites</TableHead>
          <TableHead numeric>Monthly</TableHead>
          <TableHead numeric>Renews</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ACCOUNTS.map((a) => (
          <TableRow key={a.id}>
            <TableCell primary>{a.name}</TableCell>
            <TableCell>{a.region}</TableCell>
            <TableCell>{a.plan}</TableCell>
            <TableCell numeric>{a.sites}</TableCell>
            <TableCell numeric>{EUR.format(a.monthly)}</TableCell>
            <TableCell numeric>
              <time dateTime={a.renews}>{shortDate(a.renews)}</time>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function TablePage() {
  const [deployKey, replayDeploys] = useReplay();
  const [invoiceKey, resetInvoices] = useReplay();
  const [stateKey, resetStates] = useReplay();
  return (
    <Page meta={meta} docs={docs}>
      <Stage
        title="Deploy history"
        tier="expressive"
        size="lg"
        align="start"
        code="DeployHistoryDemo"
        onReplay={replayDeploys}
        caption="Rows fade in and rise from the travel token's distance to rest, on the expressive tier. Row n waits n times the stagger token, and the cascade stops counting at six. It is this page's one expressive moment. The header is sticky inside the table's region, so scroll the rows and it stays. Hover fills a row and nothing moves; on a touch screen the row you hold fills instead. Press Replay to watch it again."
      >
        <DeployHistoryDemo key={deployKey} />
      </Stage>

      <Stage
        title="Ten thousand deploys"
        tier="responsive"
        size="lg"
        align="start"
        code="ManyDeploysDemo"
        caption="Ten thousand rows, and only the forty or so in view are drawn, between two spacers that keep the scrollbar true; scroll as fast as you like. Filter by site, status or build time from the funnels in the headers: each value says how many deploys it would show, and a column that filters wears the selected segment. Type in the search: the field never waits, because the table follows a beat behind. Tick a box, then Shift-tick another to take the range between them; the head box takes every deploy shown, and the action bar counts them."
      >
        <ManyDeploysDemo />
      </Stage>

      <Stage
        title="Sort, filter and insert"
        tier="responsive"
        size="lg"
        align="start"
        code="InvoicesDemo"
        onReplay={resetInvoices}
        replayLabel="Reset"
        caption="Press Amount or Due to sort. Pick a filter, or add an invoice. Rows slide to their new places on the responsive tier, as position only, so text never stretches. Rows that leave fade with no travel, and a new row fades in from half the travel token. The cascade above already used this page's expressive moment. Sort headers are real buttons with aria-sort."
      >
        <InvoicesDemo key={invoiceKey} />
      </Stage>

      <Stage
        title="Loading and empty"
        tier="responsive"
        align="start"
        code="StatesDemo"
        onReplay={resetStates}
        replayLabel="Reset"
        caption="Loading draws surface-2 bars at the real row height, still, with no shimmer, and the table says it is busy. Loaded rows fade in on the responsive tier. Empty is one sentence and one action, left-aligned, with no illustration."
      >
        <StatesDemo key={stateKey} />
      </Stage>

      <Stage
        title="A narrow screen"
        tier="instant"
        align="start"
        code="NarrowDemo"
        caption="The table keeps the width its columns need and scrolls inside its own region, so the page never scrolls sideways. Tab to the region and the arrow keys scroll it. It only takes focus when there is something to scroll, and it carries the table's name."
      >
        <NarrowDemo />
      </Stage>
    </Page>
  );
}
