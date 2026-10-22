/**
 * Dashboard: a deploy dashboard, built from the parts. A block: a whole screen built from the litt parts, to copy and
 * make your own. Swap the sample data and the links at the top for yours; the layout and the words around them stay.
 *
 * An app shell with a full-height sidebar, four number tiles, a chart of deploys per day, and a table of recent deploys
 * with its pagination. On a phone the sidebar becomes a top bar and the nav opens in the bottom sheet. One accent fill
 * in the view would be a primary button, and this view has none.
 */
import { useId, useState, type ReactNode } from "react";
import { AppShell, SidebarLink, SidebarNav } from "@/components/app-shell";
import { BarChart } from "@/components/chart";
import { Pagination } from "@/components/pagination";
import { Stat, StatGroup } from "@/components/stat";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag, type TagStatus } from "@/components/tag";

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

/** The links in the sidebar. Point them at your own routes. */
const NAV = [
  { label: "Overview", href: "/", current: true },
  { label: "Projects", href: "/projects" },
  { label: "Clients", href: "/clients" },
  { label: "Settings", href: "/settings" },
];

export type DashboardProps = {
  /** Starts every landmark's name ("Studio navigation", "Studio recent deploys"). Change it when two dashboards share a page. */
  label?: string;
  /** The window's height, passed to AppShell. Set it when the dashboard sits in a box shorter than the viewport. */
  viewportHeight?: string;
};

export function Dashboard({ label = "Studio", viewportHeight }: DashboardProps) {
  const [page, setPage] = useState(1);
  const rows = DEPLOYS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <AppShell
      viewportHeight={viewportHeight}
      wordmark={<a href="/">litt.design</a>}
      nav={
        <SidebarNav label={`${label} navigation`}>
          {NAV.map((l) => (
            <SidebarLink key={l.href} href={l.href} current={l.current}>
              {l.label}
            </SidebarLink>
          ))}
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
