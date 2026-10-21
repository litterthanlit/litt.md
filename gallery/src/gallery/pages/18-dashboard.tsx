import { useId, useState, type ReactNode } from "react";
import { AppShell, SidebarLink, SidebarNav } from "@/components/app-shell";
import { BarChart } from "@/components/chart";
import { Pagination } from "@/components/pagination";
import { Stat, StatGroup } from "@/components/stat";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag, type TagStatus } from "@/components/tag";
import { DeviceProvider } from "@/motion";
import { Page, Stage, useReplay, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "dashboard",
  title: "Dashboard",
  lede: "A deploy dashboard, built from the parts.",
  order: 18.6, group: "Data",
  verbs: ["hover"],
  summary:
    "The studio's deploy dashboard, built from the parts: an app shell with a full-height sidebar, four number tiles, a chart of deploys per day, and a table of recent deploys with its pagination. On a phone the sidebar becomes the bottom sheet. One accent fill in the view would be a primary button, and this view has none.",
  tiers: ["instant", "responsive"],
};

const DAYS = ["3 Oct", "4 Oct", "5 Oct", "6 Oct", "7 Oct", "8 Oct", "9 Oct", "10 Oct", "11 Oct", "12 Oct", "13 Oct", "14 Oct", "15 Oct", "16 Oct"];
const PER_DAY = [5, 7, 4, 9, 6, 1, 0, 6, 8, 5, 9, 7, 2, 1];

type Status = "ready" | "building" | "failed";
type Deploy = { project: string; branch: string; status: Status; time: string };
const TONE: Record<Status, TagStatus> = { ready: "success", building: "neutral", failed: "danger" };

const FIRST_PAGE: Deploy[] = [
  { project: "Halo site", branch: "main", status: "ready", time: "2 min ago" },
  { project: "Northwind rebrand", branch: "redesign/nav", status: "building", time: "9 min ago" },
  { project: "Atlas portfolio", branch: "main", status: "ready", time: "1 hour ago" },
  { project: "Lumen docs", branch: "fix/search", status: "failed", time: "3 hours ago" },
  { project: "Kassa pitch deck", branch: "main", status: "ready", time: "yesterday" },
  { project: "Case study template", branch: "content/q4", status: "ready", time: "2 days ago" },
];

/** The rest of the history, so the pager has pages to go to. Older rows are all ready except one. */
const EARLIER: Deploy[] = Array.from({ length: 18 }, (_, i) => ({
  project: FIRST_PAGE[(i + 2) % 6]!.project,
  branch: FIRST_PAGE[(i + 2) % 6]!.branch,
  status: i === 7 ? "failed" : "ready",
  time: i < 4 ? `${i + 3} days ago` : `${i - 1} weeks ago`,
}));
const DEPLOYS = [...FIRST_PAGE, ...EARLIER];
const PAGE_SIZE = 6;

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="grid grid-cols-1 gap-4">
      <div className="grid gap-1">
        <h2 id={id} className="text-body text-fg">
          {title}
        </h2>
        <p className="text-small text-fg-subtle">{note}</p>
      </div>
      {children}
    </section>
  );
}

function Dashboard({ label }: { label: string }) {
  const [page, setPage] = useState(1);
  const rows = DEPLOYS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const link = (name: string, current = false) => (
    <SidebarLink
      href={`#${name.toLowerCase()}`}
      current={current}
      onClick={(e) => e.preventDefault() /* the links go nowhere in this demo, and must not move the gallery's own hash */}
    >
      {name}
    </SidebarLink>
  );
  return (
    <AppShell
      viewportHeight="44rem"
      wordmark={<a href="#overview" onClick={(e) => e.preventDefault()}>litt.design</a>}
      nav={
        <SidebarNav label={`${label} navigation`}>
          {link("Overview", true)}
          {link("Projects")}
          {link("Clients")}
          {link("Settings")}
        </SidebarNav>
      }
    >
      <div className="@container grid grid-cols-1 gap-8">
        <h1 className="text-h3 text-fg">Overview</h1>

        <StatGroup>
          <Stat label="Active projects" value={12} delta="Up 2 on last month" tone="good" />
          <Stat label="Deploys this week" value={38} delta="Up 12% on last week" tone="good" />
          <Stat label="Median build" value={41} unit="s" delta="Down 6 s on last week" tone="good" />
          <Stat label="Uptime" value="99.98" unit="%" delta="Same as last month" />
        </StatGroup>

        <Section title="Deploys per day" note="The last 14 days, oldest first. Today is the full-strength bar.">
          <div className="litt-raised rounded-surface p-4 @min-[36rem]:p-6">
            <BarChart
              label="Deploys per day, last 14 days"
              labels={DAYS}
              series={[{ name: "Deploys", values: PER_DAY }]}
              unit={["deploy", "deploys"]}
              xTitle="Day"
              height={220}
            />
          </div>
        </Section>

        <Section title="Recent deploys" note="Every build on every branch, newest first.">
          <div>
            <Table label={`${label} recent deploys`}>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead numeric>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={`${page}-${d.project}-${d.time}`}>
                    <TableCell primary>{d.project}</TableCell>
                    <TableCell>{d.branch}</TableCell>
                    <TableCell>
                      <Tag status={TONE[d.status]}>{d.status}</Tag>
                    </TableCell>
                    <TableCell numeric>{d.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination className="mt-4" label={`${label} deploys pages`} page={page} pageSize={PAGE_SIZE} total={DEPLOYS.length} onPageChange={setPage} />
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function Frame({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={
        "relative h-176 w-full overflow-y-auto overscroll-contain rounded-surface bg-canvas outline-1 -outline-offset-1 outline-line " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
        className
      }
    >
      {children}
    </div>
  );
}

function DesktopDemo() {
  return (
    <Frame label="Studio dashboard, desktop" className="[--gutter:var(--space-8)]">
      <Dashboard label="Desktop" />
    </Frame>
  );
}

function PhoneDemo() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <Frame label="Studio dashboard, phone" className="[--gutter:var(--space-4)]">
        <DeviceProvider mode="phone">
          <Dashboard label="Phone" />
        </DeviceProvider>
      </Frame>
    </div>
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
