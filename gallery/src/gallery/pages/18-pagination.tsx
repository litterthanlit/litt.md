import { useState } from "react";
import { Pagination } from "@/components/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Tag, type TagStatus } from "@/components/tag";
import { Page, Stage, useReplay, type PageDocs, type PageMeta } from "../kit";

export const meta: PageMeta = {
  id: "pagination",
  title: "Pagination",
  lede: "Previous and next, for one page of many.",
  order: 17.1, group: "Data",
  verbs: ["press"],
  summary:
    "Previous and next for a table that shows one page of many. The range comes first, in words and mono. Page numbers show only when the row is wide enough, and the buttons at either end disable. Nothing about it moves; the rows it pages are the table's job.",
  tiers: ["instant"],
};

export const docs: PageDocs = {
  components: ["pagination"],
  exports: ["Pagination"],
  usage: `import { useState } from "react";
import { Pagination } from "@/components/pagination";

// You hold the page. Pagination shows the range and reports where to go next.
const [page, setPage] = useState(1);
const rows = deploys.slice((page - 1) * 20, page * 20);

<Table label="Deploys" animateChanges>{/* the rows */}</Table>
<Pagination
  className="mt-4"
  label="Deploys pages"
  page={page}
  pageSize={20}
  total={deploys.length}
  onPageChange={setPage}
/>`,
  use: [
    "A table or list has more rows than fit: deploys, invoices, clients. Show one page and say how many there are in all.",
    "Rows come from a server and each page is a request. Pagination only reports the next page, so you fetch it.",
    "The reader needs to know where they are. \"21 to 40 of 143\" says it better than a row of numbers.",
    "The same bar must work on a phone. The range and two buttons always fit, and the numbered pages appear when there is room.",
  ],
  skip: [
    "The rows are few enough to scroll. Use a Table with a max height, and let the header stick.",
    "A feed that keeps loading more, such as an activity log. Use a Button that says \"Load more\".",
    "The pages are separate screens a person moves between, such as an app's sections. Use the App shell's nav.",
    "The reader should jump straight to a row by name. Use the Command menu.",
  ],
  keyboard: [
    [["Tab"], "Moves through Previous, the page numbers when they show, and Next. A disabled button is skipped."],
    [["Enter", "Space"], "Press the focused button."],
  ],
  a11y: [
    "It is a nav with its own name, so a page with two tables can have two paginations and a screen reader tells them apart.",
    "The range is a polite live region: after a page change a screen reader hears \"21 to 40 of 143\" without moving focus.",
    "The current page number has aria-current=\"page\" and a filled button, so it does not rely on color. Each number is named \"Page 3\".",
    "An end button that is pressed and becomes disabled hands its focus to the other one, so focus never drops to the page.",
    "Buttons are 32px, and 44px on a touch screen. The numbered pages are hidden under 36rem, which is a width and not a device, so a narrow frame on a desktop gets the same bar as a phone.",
    "Under reduced motion nothing changes: pagination has no motion of its own.",
  ],
};

const SITES = ["Halo site", "Northwind rebrand", "Atlas portfolio", "Lumen docs", "Kassa pitch deck", "Case study template"];
const BRANCHES = ["main", "redesign/nav", "main", "fix/search", "main", "content/q4", "main"];

function ago(i: number) {
  const m = Math.round(2 * 1.55 ** i);
  const say = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return say(Math.round(m / 60), "hour");
  return say(Math.round(m / 1440), "day");
}

type Deploy = { id: number; site: string; branch: string; status: "ready" | "building" | "failed"; at: string };
const DEPLOYS: Deploy[] = Array.from({ length: 23 }, (_, i) => ({
  id: i,
  site: SITES[i % SITES.length]!,
  branch: BRANCHES[(i * 3) % BRANCHES.length]!,
  status: i === 1 ? "building" : i % 7 === 3 ? "failed" : "ready",
  at: ago(i),
}));
const TONE: Record<Deploy["status"], TagStatus> = { ready: "success", building: "neutral", failed: "danger" };

function DeploysDemo() {
  const [page, setPage] = useState(1);
  const size = 5;
  const rows = DEPLOYS.slice((page - 1) * size, page * size);
  return (
    <div className="w-full min-w-0 max-w-3xl">
      <Table label="Recent deploys">
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
            <TableRow key={d.id}>
              <TableCell primary>{d.site}</TableCell>
              <TableCell>{d.branch}</TableCell>
              <TableCell>
                <Tag status={TONE[d.status]}>{d.status}</Tag>
              </TableCell>
              <TableCell numeric>{d.at}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination className="mt-4" label="Deploys pages" page={page} pageSize={size} total={DEPLOYS.length} onPageChange={setPage} />
    </div>
  );
}

function LongRunDemo() {
  const [page, setPage] = useState(31);
  return (
    <div className="w-full max-w-3xl">
      <Pagination label="All deploys pages" page={page} pageSize={20} total={1240} onPageChange={setPage} />
    </div>
  );
}

function NarrowDemo() {
  const [page, setPage] = useState(2);
  return (
    <div className="w-full max-w-sm">
      <Pagination label="Clients pages" page={page} pageSize={20} total={143} onPageChange={setPage} />
    </div>
  );
}

/* ---------- the overview's tile ---------- */

/** The control alone: where you are in 143 clients, and the way to the next twenty. */
function PagesTile() {
  const [page, setPage] = useState(1);
  return (
    <div className="w-full max-w-sm">
      <Pagination label="Clients pages" page={page} pageSize={20} total={143} onPageChange={setPage} />
    </div>
  );
}

export default function PaginationPage() {
  const [key, reset] = useReplay();
  return (
    <Page meta={meta} docs={docs} tile={<PagesTile />}>
      <Stage
        title="Under a table"
        tier="instant"
        size="lg"
        align="start"
        code="DeploysDemo"
        onReplay={reset}
        replayLabel="Reset"
        caption="Five rows to a page, 23 deploys in all. The range says where you are, and Previous is disabled on the first page. Press Next to the end and Next is disabled while focus moves to Previous, so a keyboard user is never dropped. The page numbers show because the row is wide enough. Buttons change color on the instant tier and the box never moves."
      >
        <DeploysDemo key={key} />
      </Stage>

      <Stage
        title="A long run"
        tier="instant"
        code="LongRunDemo"
        caption="62 pages fold to the first, the last and the neighbours of the current page, with an ellipsis for the gaps. The current page is filled and carries aria-current. Move to page 3 or page 60 and the run reshapes at the end."
      >
        <LongRunDemo />
      </Stage>

      <Stage
        title="A narrow row"
        tier="instant"
        code="NarrowDemo"
        caption="The row measures its own width. Under 36rem the page numbers go, and the range with Previous and Next is all there is. That is the phone layout, and a narrow column on a desktop gets it too."
      >
        <NarrowDemo />
      </Stage>
    </Page>
  );
}
