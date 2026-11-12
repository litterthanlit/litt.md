/**
 * Table: real table semantics, dressed to components.md (Table and list rows). Compose it from
 * Table, TableHeader, TableBody, TableRow, TableHead and TableCell. TableEmpty and TableSkeleton
 * are the empty and loading rows.
 *
 * - Look: rows are separated by a 1px line; cells pad space-3 and space-4 and use the small size. The primary
 *   cell is fg and the rest are fg-subtle. Numbers and dates are caption size, right-aligned, with tabular
 *   figures. Hover is an fg-4% fill on the instant tier and never moves anything. On a coarse pointer
 *   there is no hover, so a row held down fills instead (fg 6%, same tier, color only), and so does a
 *   sortable header; the OS tap flash is off so the two do not double. The header row is sticky,
 *   caption size at the label weight (R8), fg-subtle, sentence case; figures stay at 400. The box is a
 *   hairline at the surface radius (Flat: no frame, no header rule, no row lines; a row is a grey bubble under the pointer, its first and last cell rounded), filled surface-1 so the sticky header can cover the rows that scroll under it.
 * - Semantics: a <table> with a hidden <caption>, <th scope="col"> headers and a <th scope="row"> for each primary
 *   cell, so a screen reader announces the row's name with every value. A sortable header holds a real button and
 *   sets aria-sort on its th.
 * - Phones: the table never makes the page scroll sideways. It keeps the width its content needs and scrolls
 *   inside its own region. When there is something to scroll, the region becomes a focusable group named by the
 *   caption, so the arrow keys scroll it. When there is not, it adds no tab stop. It is a group and not a
 *   landmark, so a page with several tables, or a section with the same name, does not repeat a landmark.
 * - Sticky header: it sticks inside the region, so give the Table a max height (max-h-96) and the rows scroll under it.
 *   Without one the table is as tall as its rows and the header has nothing to stick against.
 * - Motion is opt-in. `entrance` plays the staggered cascade: expressive tier, the travel token, each row
 *   waiting its index times the stagger token, counted up to six. It is the page's single expressive
 *   moment. `animateChanges` adds the responsive tier for rows that are added, removed or re-ordered after
 *   the table has mounted: position only (Motion layout), so text never stretches; rows that leave fade, with no travel.
 *   Both are off by default, so a plain table is plain HTML with a hover fill. Under reduced motion every row
 *   simply appears, because the hooks return zero.
 * - paint containment on the <table> clips a row that is travelling, so the cascade never makes the region
 *   grow a scrollbar for a moment.
 * - Corners: the region is rounded-surface, and clips the hover fill of the first and last row to it.
 * - Sorting is a small, accessible step, not a data layer: the header says which way it is sorted and reports
 *   the press; you sort your rows and keep them keyed, and `animateChanges` moves them.
 *
 * Big tables (components.md, "Table and list rows", Big tables):
 * - TableVirtualBody draws only the rows in view, plus a few either side, between two spacer rows that keep the
 *   scroll height true. Ten thousand rows cost what forty do. It fixes the column widths the first rows give, so the
 *   columns never shift as other rows scroll by; a cell wider than its column ends in an ellipsis, and a resizable
 *   column can be widened. It needs fixed-height rows (the 44px row: keep cells on
 *   one line) and a Table with a max height, which is the scroller. The header stays sticky, and the table keeps its
 *   semantics: aria-rowcount on the table and aria-rowindex on each row, so a screen reader still says "row 4,812 of
 *   10,001". The entrance and change motion are off in it: a long list arrives at once.
 * - Loading as you scroll: with `hasMore` and `onLoadMore` the body asks for the next page once the view comes within
 *   `loadAhead` rows of the last one loaded, once per count, so a fast scroll never asks twice. While `loading`, three
 *   skeleton rows wait after the last row (static, as every skeleton) and the table says "Loading more rows" in its
 *   status. A failed page is one row in words with Retry, which asks again. `total`, when the server knows it, makes
 *   aria-rowcount true; without it, while more can come, it is -1, which says the size is not known yet.
 * - Sticky columns: `stickyColumns` keeps the first one or two columns (a box and the row's name) in view while the table
 *   scrolls sideways. They take an opaque fill that follows the row's hover and selection, and a 1px --line hairline
 *   appears at their edge once anything is scrolled under them. No shadow: depth comes from the hairline (R3).
 * - Resizable columns: `resizable` on a TableHead puts a handle at its end edge. The first drag freezes the widths the
 *   columns have, so nothing jumps, and the table becomes fixed-layout: each column then keeps the width it is given,
 *   and what no longer fits ends in an ellipsis. The handle follows the pointer one to one, ← and → move it 16px (Shift
 *   64), Home gives it its minimum, and a double click fits the column to its widest cell. `columnsId` keeps the widths
 *   in the browser. Its hairline shows under the pointer and on focus, as the Resizable's does.
 * - Selection: TableSelectHead and TableSelectCell are the select-all and per-row boxes (the Checkbox, its label
 *   hidden and named for the row), and `selected` on a TableRow fills it fg 6%. useRowSelection holds the selected ids
 *   in a Set, so a check is constant time at any size: Shift selects the range from the last box pressed, the head
 *   box selects or clears the rows shown, and it counts what is selected for an ActionBar.
 */
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { byWorld, useExit, useMaterial, useStagger, useTransition, useTravel } from "@/motion";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { AlertIcon, RetryIcon } from "@/components/icons";
import { tableFlatDress } from "./bodies/table.flat";

/** The entrance cascade stops counting at this many rows, so a long table never drags. */
const CASCADE_CAP = 6;

/** What a world dresses: the class strings each part of the table takes, and whether rows travel. Tailwind only builds
    classes it can read, so every string is written out whole. Press's dress is below; Flat's and Device's live in
    bodies/table.flat.tsx and bodies/table.device.tsx. */
export type TableDress = {
  /** The scroll region: its corners, frame and ground. */
  region: string;
  /** A header cell: its ground, its rule and the label type. */
  head: string;
  /** More for the select-all header cell. */
  selectHead: string;
  /** A body row: its fill under the hand, held and selected. */
  row: string;
  /** A body cell (TableCell and TableSelectCell): its rule, and whatever draws the row in it. */
  cell: string;
  /** The color of the row's name, and of every other cell. */
  primary: string;
  secondary: string;
  /** A skeleton row's cell, and the bar in it. */
  skeleton: string;
  bar: string;
  /** The failed page's cell, the color of its words, and the variant of its Retry button. */
  error: string;
  alert: string;
  retry: "ghost" | "secondary";
  /** The color of the empty row's sentence. */
  empty: string;
  /** Sticky columns, one or two: the cells stick to the start edge with an opaque fill that follows the row's hover and
      selection, the header's corner cells sit above both, and the edge cell draws a hairline once something is
      scrolled under it. */
  sticky1: string;
  sticky2: string;
  /** Whether rows travel and fade (entrance, animateChanges), or appear where they stand. */
  travels: boolean;
};

/* Press's slat, drawn in every body cell so the row keeps its height: the cell stays clear (the tray shows through it) and
   a ::before is the slat's face, 2px in from the row's top and from the rule under it, so 4px of tray part two slats.
   The first cell's face starts 4px in and the last ends 4px in. Every face is rounded to the tray's radius less those
   4px (concentric), and every end that is not the row's runs 16px past its cell, which clips it: the faces meet square,
   with their corners cut away, and a lifted slat's shadow never falls across its neighbour's face. */
const SLAT =
  "relative overflow-hidden border-b border-transparent " +
  "before:absolute before:-z-1 before:top-0.5 before:bottom-px before:-start-4 before:-end-4 before:rounded-[calc(var(--radius-surface)-4px)] before:bg-block " +
  "first:before:start-1 last:before:end-1 only:before:start-1 only:before:end-1 " +
  "before:transition-[box-shadow] before:duration-(--dur-instant) before:ease-litt forced-colors:before:border";

/** Press: slats in a tray under a raised rail. */
const pressDress: TableDress = {
  /* The tray: the region's ground, its shade drawn inside a clear 1px border so the box keeps today's size. */
  region: "rounded-surface border border-transparent bg-tray bg-clip-padding shadow-(--tray-shade)",
  /* The rail: each header cell is the tray (opaque, so rows pass under it) with the rail's face 4px in from its top and
     its foot, standing on --block-lift. The cell clips the face's ends, as a slat's. */
  head:
    "overflow-hidden border-b border-transparent bg-tray text-caption font-label litt-legend " +
    "before:absolute before:-z-1 before:top-1 before:bottom-1 before:-start-4 before:-end-4 before:rounded-[calc(var(--radius-surface)-4px)] before:bg-block before:shadow-(--block-lift) " +
    "first:before:start-1 last:before:end-1 only:before:start-1 only:before:end-1 forced-colors:before:border",
  selectHead: "",
  /* The row draws nothing itself: its slat is in its cells, and lifts under the hand, held and selected. */
  row: "group/row [-webkit-tap-highlight-color:transparent]",
  cell:
    SLAT +
    " group-hover/row:before:shadow-[var(--highlight),var(--block-lift)] pointer-coarse:group-active/row:before:shadow-[var(--highlight),var(--block-lift)]" +
    " group-data-selected/row:before:shadow-[var(--highlight),var(--block-lift)]",
  primary: "text-fg",
  secondary: "text-fg-subtle",
  /* A loading row is a slat too, its bars on the face. */
  skeleton: SLAT,
  bar: "rounded-control bg-surface-2",
  error: SLAT,
  alert: "text-fg-subtle",
  retry: "ghost",
  empty: "text-fg-muted",
  /* Sticky cells are the tray, opaque, with their slat's face on it as every cell's; the edge cell's hairline is ::after. */
  sticky1: [
    "[&_tr>*:first-child]:sticky [&_tr>*:first-child]:start-0",
    "[&_thead_tr>*:first-child]:z-20 [&_tbody_tr>*:first-child]:z-1 [&_tbody_tr>*:first-child]:bg-tray",
    "[&_tr>*:first-child]:after:pointer-events-none [&_tr>*:first-child]:after:absolute [&_tr>*:first-child]:after:inset-y-0 [&_tr>*:first-child]:after:end-0",
    "[&_tr>*:first-child]:after:w-px [&_tr>*:first-child]:after:bg-line [&_tr>*:first-child]:after:opacity-0 data-scrolled:[&_tr>*:first-child]:after:opacity-100",
  ].join(" "),
  sticky2: [
    "[&_tr>*:nth-child(-n+2)]:sticky [&_tr>*:first-child]:start-0 [&_tr>*:nth-child(2)]:start-(--sticky-2)",
    "[&_thead_tr>*:nth-child(-n+2)]:z-20 [&_tbody_tr>*:nth-child(-n+2)]:z-1 [&_tbody_tr>*:nth-child(-n+2)]:bg-tray",
    "[&_tr>*:nth-child(2)]:after:pointer-events-none [&_tr>*:nth-child(2)]:after:absolute [&_tr>*:nth-child(2)]:after:inset-y-0 [&_tr>*:nth-child(2)]:after:end-0",
    "[&_tr>*:nth-child(2)]:after:w-px [&_tr>*:nth-child(2)]:after:bg-line [&_tr>*:nth-child(2)]:after:opacity-0 data-scrolled:[&_tr>*:nth-child(2)]:after:opacity-100",
  ].join(" "),
  travels: true,
};
type TableState = {
  entrance: boolean;
  animateChanges: boolean;
  ready: boolean;
  region: RefObject<HTMLDivElement | null>;
  table: RefObject<HTMLTableElement | null>;
  /** The columns' widths once one has been resized, else null (the table lays itself out). */
  widths: number[] | null;
  /** Gives column `index` a width, freezing the others at the widths they have. */
  resizeColumn: (index: number, width: number) => void;
  /** Tells onColumnsResize and the browser's storage after a drag or a key. */
  settleColumns: () => void;
  /** Fixes the widths the columns have now, if nothing has yet: a virtual body does it, so columns never shift as rows scroll by. */
  freezeColumns: () => void;
  /** A virtual body says it is loading more rows, so the table's status says so. */
  setLoadingMore: (loading: boolean) => void;
  /** Checks whether the region has something to scroll, so it is focusable from the commit that makes it scroll. */
  measureScroll: () => void;
  /** The world's dress, which every part reads its classes from. */
  dress: TableDress;
};
const TableContext = createContext<TableState>({
  dress: pressDress,
  entrance: false,
  animateChanges: false,
  ready: true,
  region: { current: null },
  table: { current: null },
  widths: null,
  resizeColumn: () => {},
  settleColumns: () => {},
  freezeColumns: () => {},
  setLoadingMore: () => {},
  measureScroll: () => {},
});
/* Inside a TableVirtualBody: the row's place in the whole table, for aria-rowindex. Null elsewhere. */
const VirtualIndexContext = createContext<number | null>(null);
const SectionContext = createContext<"head" | "body">("body");
const RowIndexContext = createContext(0);

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

export type TableProps = {
  /** The table's name. It labels the scroll region and is the table's hidden caption, so say what the rows are: "Deploy history". */
  label: string;
  /** Plays the staggered entrance (expressive tier) when the table mounts. It is the page's one expressive moment, so turn it on for one table. Remount with a new key to replay. */
  entrance?: boolean;
  /** Animates rows added, removed or re-ordered after the table has mounted (responsive tier, position only). Give every row a stable key. */
  animateChanges?: boolean;
  /** Marks the table as loading: sets aria-busy and announces "Loading" with the label. Render a TableSkeleton for the rows. */
  busy?: boolean;
  /** Keeps the first one or two columns in view while the table scrolls sideways: the row's box and its name. */
  stickyColumns?: 0 | 1 | 2;
  /** Keeps resized column widths in the browser under this name, so the layout someone chose comes back. */
  columnsId?: string;
  /** Called with every column's width in px after one is resized. */
  onColumnsResize?: (widths: number[]) => void;
  /** Extra classes for the scroll region: a max width, or a max height such as max-h-96 so the header sticks while the rows scroll. */
  className?: string;
  /** A TableHeader and a TableBody. */
  children: ReactNode;
};

/* Once resized, every cell clips to its column and ends in an ellipsis. */
const FIXED = "table-fixed [&_td]:overflow-hidden [&_td]:text-ellipsis [&_th]:overflow-hidden [&_th]:text-ellipsis";

const COLUMNS_STORE = (id: string) => `litt-table-columns:${id}`;

/** A table in its own scroll region. Compose it from TableHeader and TableBody. */
export function Table({
  label,
  entrance = false,
  animateChanges = false,
  busy = false,
  stickyColumns = 0,
  columnsId,
  onColumnsResize,
  className = "",
  children,
}: TableProps) {
  const captionId = useId();
  const region = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLTableElement>(null);
  const [ready, setReady] = useState(false);
  const [scrolls, setScrolls] = useState(false);
  const [widths, setWidths] = useState<number[] | null>(null);
  const latestWidths = useRef<number[] | null>(null);
  latestWidths.current = widths;
  /* Who fixed the widths: a virtual body (the table still fills its region) or a person (each column keeps its width). */
  const [frozenBy, setFrozenBy] = useState<"auto" | "person">("auto");
  const [scrolledX, setScrolledX] = useState(false);
  const [stickyStart, setStickyStart] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const material = useMaterial();
  const dress = byWorld(material, { press: pressDress, flat: tableFlatDress });

  /* The widths the header cells have now, to freeze before the first resize. */
  const measureColumns = useCallback(() => {
    const cells = table.current?.tHead?.rows[0]?.cells;
    /* Rounded up, so a column fixed at the width it had never clips its own widest cell by a fraction of a pixel. */
    return cells ? Array.from(cells, (c) => Math.ceil(c.getBoundingClientRect().width)) : [];
  }, []);

  const resizeColumn = useCallback(
    (index: number, width: number) => {
      const base = latestWidths.current ?? measureColumns();
      if (index < 0 || index >= base.length) return;
      const next = [...base];
      next[index] = Math.round(width);
      latestWidths.current = next;
      setWidths(next);
      setFrozenBy("person");
    },
    [measureColumns],
  );

  const freezeColumns = useCallback(() => {
    if (latestWidths.current) return;
    const now = measureColumns();
    /* A table drawn while hidden (a closed tab) measures zeros: leave it to lay itself out. */
    if (!now.length || now.some((w) => w === 0)) return;
    latestWidths.current = now;
    setWidths(now);
  }, [measureColumns]);

  const settleColumns = useCallback(() => {
    const now = latestWidths.current;
    if (!now) return;
    onColumnsResize?.(now);
    if (!columnsId) return;
    try {
      localStorage.setItem(COLUMNS_STORE(columnsId), JSON.stringify(now));
    } catch {
      /* storage is full or off: the widths still hold for this visit */
    }
  }, [columnsId, onColumnsResize]);

  /* Saved widths come back after the first render, so the server and the browser agree on that one. A saved list that
     no longer has one width per column is ignored. */
  useLayoutEffect(() => {
    if (!columnsId) return;
    try {
      const saved = JSON.parse(localStorage.getItem(COLUMNS_STORE(columnsId)) ?? "null") as unknown;
      const count = table.current?.tHead?.rows[0]?.cells.length ?? -1;
      if (Array.isArray(saved) && saved.length === count && saved.every((n) => typeof n === "number" && n > 0)) {
        latestWidths.current = saved as number[];
        setWidths(saved as number[]);
        setFrozenBy("person");
      }
    } catch {
      /* no storage, or something else stored there */
    }
  }, [columnsId]);

  /* Sticky columns: the second one starts where the first ends, and the edge hairline shows once anything is scrolled under them. */
  useLayoutEffect(() => {
    if (stickyColumns === 0) return;
    const el = region.current;
    const first = table.current?.tHead?.rows[0]?.cells[0];
    if (!el) return;
    const onScroll = () => setScrolledX(Math.abs(el.scrollLeft) > 0);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    const observer = first ? new ResizeObserver(() => setStickyStart(first.getBoundingClientRect().width)) : null;
    if (first && observer) observer.observe(first);
    return () => {
      el.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, [stickyColumns]);

  // Rows that mount with the table are its first wave. Rows that mount later are insertions.
  useEffect(() => setReady(true), []);

  /* The region is focusable only while there is something to scroll. It is measured after every commit, in the same
     frame, so rows that land never make it scroll a frame before it can take focus (a virtual body measures after its
     own commits too). The observer catches what React does not draw: a resize, a font that loads. */
  const measureScroll = useCallback(() => {
    const el = region.current;
    if (el) setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
  }, []);
  useLayoutEffect(measureScroll);
  useEffect(() => {
    const observer = new ResizeObserver(() => flushSync(measureScroll));
    if (region.current) observer.observe(region.current);
    if (table.current) observer.observe(table.current);
    return () => observer.disconnect();
  }, [measureScroll]);

  return (
    <TableContext.Provider
      value={{ entrance, animateChanges, ready, region, table, widths, resizeColumn, settleColumns, freezeColumns, setLoadingMore, measureScroll, dress }}
    >
      <motion.div
        ref={region}
        layoutScroll
        data-body={material}
        {...(scrolls ? { role: "group", "aria-labelledby": captionId, tabIndex: 0 } : {})}
        aria-busy={busy || undefined}
        className={
          "relative w-full overflow-auto " +
          dress.region +
          " focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
          className
        }
      >
        <table
          ref={table}
          data-scrolled={scrolledX || undefined}
          className={[
            "border-separate border-spacing-0 contain-paint text-left text-small",
            widths ? FIXED + (frozenBy === "auto" ? " min-w-full" : "") : "w-full min-w-max",
            stickyColumns === 1 ? dress.sticky1 : stickyColumns === 2 ? dress.sticky2 : "",
          ].join(" ")}
          style={{
            ...(widths ? { width: widths.reduce((a, b) => a + b, 0) } : {}),
            ...(stickyColumns === 2 ? ({ "--sticky-2": `${stickyStart}px` } as CSSProperties) : {}),
          }}
        >
          <caption id={captionId} className="sr-only">
            {label}
          </caption>
          {widths && (
            <colgroup>
              {widths.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
          )}
          {children}
        </table>
        <div role="status" className="sr-only">
          {busy ? `Loading ${label}` : loadingMore ? "Loading more rows" : ""}
        </div>
      </motion.div>
    </TableContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* TableHeader, TableBody                                                     */
/* -------------------------------------------------------------------------- */

export type TableHeaderProps = {
  /** One TableRow of TableHead cells. */
  children: ReactNode;
};

/** The header section. Its cells stick to the top of the table's region. */
export function TableHeader({ children }: TableHeaderProps) {
  return (
    <SectionContext.Provider value="head">
      <thead>{children}</thead>
    </SectionContext.Provider>
  );
}

export type TableBodyProps = {
  /** The rows, as direct children (an array from map is fine), each with a stable key. A TableEmpty or TableSkeleton can stand in for them. */
  children: ReactNode;
};

/** The body section. It numbers its rows for the entrance cascade and hosts the leaving rows. */
export function TableBody({ children }: TableBodyProps) {
  const { entrance, animateChanges, dress } = useContext(TableContext);
  // Each row learns its place through context, so a row can be your own component and still be counted.
  const rows = Children.toArray(children).map((child, i) =>
    isValidElement(child) ? (
      <RowIndexContext.Provider key={child.key} value={i}>
        {child}
      </RowIndexContext.Provider>
    ) : (
      child
    ),
  );
  return (
    <SectionContext.Provider value="body">
      {/* The last row keeps no line under it: the region's own hairline closes the table. */}
      <tbody className="[&>tr:last-child>*]:border-b-0">
        {/* Its own AnimatePresence gives the rows a presence of their own. It hosts the leaving rows, and it keeps an
            ancestor's initial={false} (the Tabs panel has one) from swallowing the entrance cascade. */}
        {dress.travels && (entrance || animateChanges) ? <AnimatePresence>{rows}</AnimatePresence> : rows}
      </tbody>
    </SectionContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* TableVirtualBody                                                           */
/* -------------------------------------------------------------------------- */

/** The row height a virtual body starts from: the 44px row (h-control-md). It measures the real one once drawn. */
const ROW_HEIGHT = 44;

export type TableVirtualBodyProps = {
  /** How many rows there are in all. */
  count: number;
  /** Draws row `index`: a TableRow with a stable key. Called only for the rows in view. */
  children: (index: number) => ReactNode;
  /** How many rows to draw beyond each edge of the view, so a fast scroll never shows a gap. */
  overscan?: number;
  /** How many columns the table has, so the spacer rows span it. */
  columns: number;
  /** There are rows beyond `count` still to load: the body calls onLoadMore as the view nears the last row loaded. */
  hasMore?: boolean;
  /** Called once per count when the view comes within `loadAhead` rows of the end and hasMore is set. Fetch the next page and append it. To start over (a new filter on the server), empty the rows: the body asks for the first page itself. */
  onLoadMore?: () => void;
  /** A page is on its way: skeleton rows wait after the last row, and the table says "Loading more rows". */
  loading?: boolean;
  /** The last page failed, in plain words: "The next deploys did not load.". It shows as the last row, with Retry calling onLoadMore. */
  loadError?: string;
  /** How many rows before the last one loaded to ask for more, so the next page is usually there before anyone reaches the end. */
  loadAhead?: number;
  /** How many rows there are on the server, when it says. It makes aria-rowcount true while rows are still loading. */
  total?: number;
  /** One entry per column for the loading rows, as TableSkeleton's columns. By default a text bar in each. */
  skeleton?: SkeletonColumn[];
};

/**
 * A body that draws only the rows in view. Give the Table a max height (it is the scroller) and keep each row on one
 * line, so every row is the same height. The rows are read from `children(index)`. With hasMore and onLoadMore it
 * loads the next page from a server as the view nears the end.
 */
export function TableVirtualBody({
  count,
  children,
  overscan = 8,
  columns,
  hasMore = false,
  onLoadMore,
  loading = false,
  loadError,
  loadAhead = 20,
  total,
  skeleton,
}: TableVirtualBodyProps) {
  const { region, table, freezeColumns, setLoadingMore, measureScroll, dress } = useContext(TableContext);
  const body = useRef<HTMLTableSectionElement>(null);

  const [height, setHeight] = useState(ROW_HEIGHT);
  /* start and end are the rows drawn; last is the last row in view, which decides when to load more. */
  const [range, setRange] = useState({ start: 0, end: Math.min(count, 30), last: Math.min(count, 30) });

  /* Which rows the view shows, from the scroll position, less the sticky header's height above the first row. */
  const measure = useCallback(() => {
    const el = region.current;
    const tbody = body.current;
    if (!el || !tbody) return;
    const top = tbody.offsetTop;
    const first = Math.floor(Math.max(0, el.scrollTop - top) / height);
    const shown = Math.ceil(el.clientHeight / height);
    const start = Math.max(0, first - overscan);
    const end = Math.min(count, first + shown + overscan);
    const last = first + shown;
    setRange((r) => (r.start === start && r.end === end && r.last === last ? r : { start, end, last }));
  }, [region, height, overscan, count]);

  useLayoutEffect(() => {
    measure();
    const el = region.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    /* Spacer heights change as it scrolls, so the browser must not try to keep a row anchored in place. */
    const anchor = el.style.overflowAnchor;
    el.style.overflowAnchor = "none";
    return () => {
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.style.overflowAnchor = anchor;
    };
  }, [region, measure]);

  /* The real row height, read from the first row drawn, in case the host's type makes it taller than 44px. */
  useLayoutEffect(() => {
    const row = body.current?.querySelector<HTMLElement>("tr[aria-rowindex]");
    const real = row?.getBoundingClientRect().height;
    if (real && Math.abs(real - height) > 0.5) setHeight(real);
  });
  /* Its own commits change the spacers' height, so the region's: the table rechecks whether it scrolls. */
  useLayoutEffect(measureScroll);

  /* The whole table's size, for screen readers: the header row plus every row. -1 says it is not known yet. */
  useEffect(() => {
    const el = table.current;
    if (!el) return;
    el.setAttribute("aria-rowcount", String(total !== undefined ? total + 1 : hasMore ? -1 : count + 1));
    return () => el.removeAttribute("aria-rowcount");
  }, [table, count, total, hasMore]);

  /* The next page, asked for once per count: a scroll that keeps moving near the end, or a second run of this effect in
     development, never asks twice for the same page. Retry asks again on purpose. */
  const asked = useRef(-1);
  useEffect(() => {
    if (!hasMore || loading || loadError || !onLoadMore) return;
    if (count - range.last > loadAhead || asked.current === count) return;
    asked.current = count;
    onLoadMore();
  }, [hasMore, loading, loadError, onLoadMore, count, range.last, loadAhead]);

  useEffect(() => {
    setLoadingMore(loading);
    return () => setLoadingMore(false);
  }, [loading, setLoadingMore]);

  const start = Math.min(range.start, count);
  const end = Math.min(range.end, count);

  /* The browser sizes a table's columns from the rows it has, and a virtual body has different rows at every scroll
     position, so the columns would shift as it scrolls. Fix them at the widths the first rows drawn give: not before,
     or a first page from a server would fix them to the header's words alone. A passive effect, because React attaches
     the <table>'s ref after this body's layout effects run. */
  const drawn = end > start;
  useEffect(() => {
    if (drawn) freezeColumns();
  }, [drawn, freezeColumns]);
  const rows: ReactNode[] = [];
  for (let i = start; i < end; i++) {
    rows.push(
      <VirtualIndexContext.Provider key={i} value={i + 2}>
        {children(i)}
      </VirtualIndexContext.Provider>,
    );
  }
  const spacer = (h: number, key: string) =>
    h > 0 ? (
      <tr key={key} aria-hidden="true">
        <td colSpan={columns} className="border-0 p-0" style={{ height: h }} />
      </tr>
    ) : null;

  const retry = () => {
    asked.current = count;
    onLoadMore?.();
  };

  return (
    <SectionContext.Provider value="body">
      {/* The last row keeps no line under it. At the end of the list that is the last real row; before it, the spacer. */}
      <tbody ref={body} className="[&>tr:last-child>*]:border-b-0">
        {spacer(start * height, "before")}
        {rows}
        {spacer((count - end) * height, "after")}
        {loadError ? (
          <tr>
            <td colSpan={columns} className={"h-control-md px-4 py-1 align-middle " + dress.error}>
              {/* Sticky, so the words and Retry stay in view in a table scrolled sideways. */}
              <div role="alert" className={"sticky start-4 flex w-max items-center gap-3 text-small " + dress.alert}>
                <span className="text-danger">
                  <AlertIcon />
                </span>
                {loadError}
                <Button size="sm" variant={dress.retry} icon={<RetryIcon />} onClick={retry}>
                  Retry
                </Button>
              </div>
            </td>
          </tr>
        ) : (
          loading && hasMore && <TableSkeleton columns={skeleton ?? Array.from({ length: columns }, () => "text")} rows={3} />
        )}
      </tbody>
    </SectionContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Selection                                                                  */
/* -------------------------------------------------------------------------- */

export type RowSelection = {
  /** The selected ids. */
  selected: ReadonlySet<string>;
  /** How many are selected, shown or not. */
  count: number;
  /** Whether one id is selected. Constant time. */
  isSelected: (id: string) => boolean;
  /** Turns one row on or off. With `range` (Shift held), every row shown between it and the last row pressed follows. */
  toggle: (id: string, range?: boolean) => void;
  /** The head box's state over the rows shown: all, some or none of them selected. */
  head: "all" | "some" | "none";
  /** The head box: selects every row shown, or clears them when all are selected. */
  toggleAll: () => void;
  /** Clears the whole selection, for an ActionBar's Clear. */
  clear: () => void;
};

/**
 * Selected rows for a Table of any size, by id. Pass the ids of the rows shown, in their order (after your filter and
 * sort): Shift ranges follow that order and the head box acts on those rows. Rows hidden by a filter stay selected.
 */
export function useRowSelection(shown: readonly string[], initial: Iterable<string> = []): RowSelection {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(initial));
  const anchor = useRef<string | null>(null);
  const order = useMemo(() => new Map(shown.map((id, i) => [id, i])), [shown]);

  const toggle = useCallback(
    (id: string, range = false) => {
      setSelected((now) => {
        const next = new Set(now);
        const on = !now.has(id);
        const from = anchor.current === null ? undefined : order.get(anchor.current);
        const to = order.get(id);
        if (range && from !== undefined && to !== undefined) {
          for (let i = Math.min(from, to); i <= Math.max(from, to); i++) {
            if (on) next.add(shown[i]!);
            else next.delete(shown[i]!);
          }
        } else if (on) next.add(id);
        else next.delete(id);
        return next;
      });
      anchor.current = id;
    },
    [order, shown],
  );

  let inView = 0;
  for (const id of shown) if (selected.has(id)) inView++;
  const head = inView === 0 ? "none" : inView === shown.length ? "all" : "some";

  const toggleAll = useCallback(() => {
    setSelected((now) => {
      const next = new Set(now);
      const all = shown.length > 0 && shown.every((id) => now.has(id));
      for (const id of shown) {
        if (all) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }, [shown]);

  const clear = useCallback(() => {
    setSelected(new Set());
    anchor.current = null;
  }, []);

  return { selected, count: selected.size, isSelected: (id) => selected.has(id), toggle, head, toggleAll, clear };
}

/** Whether Shift was held for this change: a click's, or the key's on Space. */
const shifted = (e: ChangeEvent<HTMLInputElement>) => (e.nativeEvent as MouseEvent).shiftKey === true;

const selectCell = "w-12 py-0 pr-0 pl-4 align-middle [&>div]:py-0";

export type TableSelectHeadProps = {
  /** All, some or none of the rows shown are selected: useRowSelection's `head`. */
  state: "all" | "some" | "none";
  /** Called when the box is pressed: useRowSelection's `toggleAll`. */
  onToggle: () => void;
  /** What the box selects, for screen readers: "Select every deploy shown". */
  label?: string;
};

/** The select-all box, as the first header cell. Mixed while some of the rows shown are selected. */
export function TableSelectHead({ state, onToggle, label = "Select every row shown" }: TableSelectHeadProps) {
  const { dress } = useContext(TableContext);
  return (
    <th scope="col" className={[head, dress.head, selectCell, dress.selectHead].join(" ")}>
      <Checkbox
        label={<span className="sr-only">{label}</span>}
        checked={state === "all"}
        indeterminate={state === "some"}
        onChange={onToggle}
      />
    </th>
  );
}

export type TableSelectCellProps = {
  /** Whether the row is selected: useRowSelection's `isSelected(id)`. */
  checked: boolean;
  /** Called with whether Shift was held: pass it to useRowSelection's `toggle(id, range)`. */
  onToggle: (range: boolean) => void;
  /** Names the box for the row: "Select deploy 8f2ka1c". */
  label: string;
};

/** The row's box, as the first cell. Shift-press selects the range from the last box pressed. */
export function TableSelectCell({ checked, onToggle, label }: TableSelectCellProps) {
  const { dress } = useContext(TableContext);
  return (
    <td className={[selectCell, dress.cell, "h-control-md"].join(" ")}>
      <Checkbox label={<span className="sr-only">{label}</span>} checked={checked} onChange={(e) => onToggle(shifted(e))} />
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/* TableRow                                                                   */
/* -------------------------------------------------------------------------- */

export type TableRowProps = Omit<ComponentProps<"tr">, "ref"> & {
  /** Fills the row fg 6%, for a row whose TableSelectCell is checked. */
  selected?: boolean;
  /** The row's cells. */
  children?: ReactNode;
  /** Extra classes for the row. */
  className?: string;
};

/** A row. In the body it gets the hover fill, and the entrance or change motion when the Table asks for it. */
export function TableRow({ selected = false, className = "", children, ...rest }: TableRowProps) {
  const section = useContext(SectionContext);
  const { entrance, animateChanges, dress } = useContext(TableContext);
  const virtualIndex = useContext(VirtualIndexContext);
  const marks = { "data-selected": selected || undefined, "aria-rowindex": virtualIndex ?? undefined };
  if (section === "head" || virtualIndex !== null || !dress.travels || !(entrance || animateChanges)) {
    return (
      <tr className={(section === "head" ? "" : dress.row + " ") + className} {...marks} {...rest}>
        {children}
      </tr>
    );
  }
  return (
    <MotionRow className={className} {...marks} {...rest}>
      {children}
    </MotionRow>
  );
}

function MotionRow({ className = "", children, ...rest }: TableRowProps) {
  const { entrance, animateChanges, ready, dress } = useContext(TableContext);
  const index = useContext(RowIndexContext);
  const enter = useTransition("expressive");
  const settle = useTransition("responsive");
  const leave = useExit("responsive");
  const travel = useTravel();
  const stagger = useStagger();
  // Fixed when the row mounts: did it arrive with the table, or after it?
  const [withTable] = useState(!ready);
  const cascade = withTable && entrance;
  const inserted = !withTable && animateChanges;
  // Rows after the sixth reuse the sixth's delay.
  const wait = Math.min(index, CASCADE_CAP - 1) * stagger;
  return (
    <motion.tr
      layout={animateChanges ? "position" : false}
      initial={cascade ? { opacity: 0, y: travel } : inserted ? { opacity: 0, y: travel / 2 } : false}
      animate={{ opacity: 1, y: 0, transition: cascade ? { ...enter, delay: wait } : settle }}
      exit={animateChanges ? { opacity: 0, transition: leave } : undefined}
      className={dress.row + " " + className}
      {...(rest as HTMLMotionProps<"tr">)}
    >
      {children}
    </motion.tr>
  );
}

/* -------------------------------------------------------------------------- */
/* TableHead                                                                  */
/* -------------------------------------------------------------------------- */

/* Every header cell; its ground, rule and type are the dress's. */
const head = "group/head sticky top-0 z-10 h-control-md whitespace-nowrap";

/** How far one press of ← or → moves a column's edge, in px; Shift moves four times as far. */
const COLUMN_STEP = 16;

/**
 * The end edge of a resizable column: a 12px handle inside the header with a 1px hairline at the edge, shown under the
 * pointer, on focus and while dragged. A separator, valued in px, so a screen reader can say how wide the column is.
 */
function ColumnHandle({ name, minWidth }: { name: string; minWidth: number }) {
  const { widths, resizeColumn, settleColumns, table } = useContext(TableContext);
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(-1);
  const [dragging, setDragging] = useState(false);
  const [natural, setNatural] = useState(0);
  useLayoutEffect(() => {
    const th = ref.current?.closest("th");
    if (!th) return;
    setIndex(th.cellIndex);
    setNatural(Math.round(th.getBoundingClientRect().width));
  }, [widths]);
  const width = (index >= 0 && widths?.[index]) || natural;
  const rtl = () => (ref.current ? getComputedStyle(ref.current).direction === "rtl" : false);
  const set = (w: number) => resizeColumn(index, Math.max(minWidth, w));

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const th = ref.current?.closest("th");
    if (e.button !== 0 || !th) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    el.focus({ preventScroll: true });
    const start = th.getBoundingClientRect().width;
    const from = e.clientX;
    const sign = rtl() ? -1 : 1;
    el.setPointerCapture(e.pointerId);
    setDragging(true);
    const cursor = document.body.style.cursor;
    document.body.style.cursor = "col-resize";
    const move = (ev: PointerEvent) => set(start + (ev.clientX - from) * sign);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      document.body.style.cursor = cursor;
      setDragging(false);
      settleColumns();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const by = e.shiftKey ? COLUMN_STEP * 4 : COLUMN_STEP;
    const grow = rtl() ? "ArrowLeft" : "ArrowRight";
    const shrink = rtl() ? "ArrowRight" : "ArrowLeft";
    if (e.key === grow) set(width + by);
    else if (e.key === shrink) set(width - by);
    else if (e.key === "Home") set(minWidth);
    else return;
    e.preventDefault();
    settleColumns();
  };

  /* A double click fits the column to its widest cell drawn: what each cell would need with nothing clipped. */
  const fit = () => {
    const rows = table.current?.rows;
    if (!rows || index < 0) return;
    let widest = minWidth;
    for (const row of Array.from(rows)) {
      const cell = row.cells[index];
      if (!cell || cell.colSpan > 1) continue;
      const clone = cell.cloneNode(true) as HTMLElement;
      clone.style.cssText = "position:absolute;visibility:hidden;width:auto;max-width:none;overflow:visible";
      row.appendChild(clone);
      widest = Math.max(widest, Math.ceil(clone.getBoundingClientRect().width));
      clone.remove();
    }
    set(widest);
    settleColumns();
  };

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={`Resize the ${name.toLowerCase()} column`}
      aria-valuenow={Math.round(width)}
      aria-valuemin={minWidth}
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={fit}
      onClick={(e) => e.stopPropagation()}
      className={
        "group/edge absolute inset-y-0 end-0 z-1 w-3 cursor-col-resize touch-none pointer-coarse:w-5 " +
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      }
    >
      <span
        aria-hidden="true"
        className={
          "absolute inset-y-2 end-0 w-px bg-line-strong opacity-0 transition-[opacity,background-color] duration-(--dur-instant) ease-litt " +
          "group-hover/head:opacity-100 group-focus-visible/edge:opacity-100 group-data-dragging/edge:bg-fg-subtle group-data-dragging/edge:opacity-100"
        }
      />
    </div>
  );
}

export type SortDirection = "ascending" | "descending" | "none";

/** 16px, 1.5px stroke, like the icon set. Unsorted shows both chevrons so the header reads as sortable without color. */
function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {direction === "none" ? (
        <path d="m5 6.25 3-3 3 3M5 9.75l3 3 3-3" />
      ) : direction === "ascending" ? (
        <path d="M8 13V3M4.5 6.5 8 3l3.5 3.5" />
      ) : (
        <path d="M8 3v10M4.5 9.5 8 13l3.5-3.5" />
      )}
    </svg>
  );
}

export type TableHeadProps = Omit<ComponentProps<"th">, "ref" | "scope" | "aria-sort" | "filter"> & {
  /** Right-aligns the header over a column of numbers or dates. */
  numeric?: boolean;
  /** A TableFilter (table-filter) for this column. It sits at the end of the header, or before the label over numbers. */
  filter?: ReactNode;
  /** Puts a handle at the header's end edge to drag the column wider or narrower. Name the column in children, so the handle says what it resizes. */
  resizable?: boolean;
  /** The narrowest a resizable column may be, in px. */
  minWidth?: number;
  /** Which way this column is sorted now. Only read when onSort is set. */
  sort?: SortDirection;
  /** Makes the header a sortable button and sets aria-sort. Called when it is pressed; you sort the rows and pass the new `sort`. */
  onSort?: () => void;
  /** The column's name, in sentence case. */
  children?: ReactNode;
  /** Extra classes for the header cell. */
  className?: string;
};

/** A column header. Sticky, caption size at the label weight, fg-subtle. Add onSort to make it a sortable button, and filter for a TableFilter. */
export function TableHead({
  numeric = false,
  sort = "none",
  onSort,
  filter,
  resizable = false,
  minWidth = 64,
  className = "",
  children,
  ...rest
}: TableHeadProps) {
  const { dress } = useContext(TableContext);
  const align = numeric ? "text-right" : "text-left";
  const handle = resizable ? <ColumnHandle name={typeof children === "string" ? children : "this"} minWidth={minWidth} /> : null;
  /* With a filter the cell is a row of two: the label (or the sort button) and the filter's button. Over numbers the
     filter goes first, so the label stays flush right above the figures. */
  const withFilter = (label: ReactNode) => (
    <div className={"flex h-control-md items-center " + (numeric ? "flex-row-reverse pl-2" : "pr-2")}>
      <div className="min-w-0 flex-1">{label}</div>
      <div className="shrink-0">{filter}</div>
    </div>
  );
  if (!onSort) {
    const label = filter ? <span className={"block px-4 " + align}>{children}</span> : children;
    return (
      <th scope="col" className={[head, dress.head, align, filter ? "p-0 text-fg-subtle" : "px-4 py-3 text-fg-subtle", className].join(" ")} {...rest}>
        {filter ? withFilter(label) : label}
        {handle}
      </th>
    );
  }
  const button = (
    <button
      type="button"
      onClick={onSort}
      className={[
        "flex h-control-md w-full cursor-pointer items-center gap-1 px-4 text-caption litt-legend",
        // Numbers sit flush right, so the icon goes to the left of the label to keep the label above the figures.
        numeric ? "flex-row-reverse" : "",
        "transition-[background-color,color] duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent]",
        "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
        sort === "none" ? "text-fg-subtle hover:text-fg pointer-coarse:active:text-fg" : "text-fg",
      ].join(" ")}
    >
      <span>{children}</span>
      <SortIcon direction={sort} />
    </button>
  );
  return (
    <th scope="col" aria-sort={sort} className={[head, dress.head, align, "p-0", className].join(" ")} {...rest}>
      {filter ? withFilter(button) : button}
      {handle}
    </th>
  );
}

/* -------------------------------------------------------------------------- */
/* TableCell                                                                  */
/* -------------------------------------------------------------------------- */

export type TableCellProps = Omit<ComponentProps<"td">, "ref" | "scope"> & {
  /** Mono caption size, right-aligned with tabular figures. For numbers and dates. */
  numeric?: boolean;
  /** The row's name: fg instead of fg-subtle, and a row header (<th scope="row">) so a screen reader announces it with each value. One per row. */
  primary?: boolean;
  /** The cell's content. Keep it on one line; a cell never wraps unless you add whitespace-normal. */
  children?: ReactNode;
  /** Extra classes for the cell. */
  className?: string;
};

/** A body cell. fg-subtle by default; `primary` makes it the row's name, and `numeric` sets tabular figures. */
export function TableCell({ numeric = false, primary = false, className = "", children, ...rest }: TableCellProps) {
  const { dress } = useContext(TableContext);
  const cls = [
    // font-normal because a <th> is bold by default, and a host app may not reset it.
    "h-control-md px-4 py-3 align-middle font-normal whitespace-nowrap",
    dress.cell,
    numeric ? "text-right text-caption font-normal tabular-nums" : "text-left text-small",
    primary ? dress.primary : dress.secondary,
    className,
  ].join(" ");
  return primary ? (
    <th scope="row" className={cls} {...(rest as ComponentProps<"th">)}>
      {children}
    </th>
  ) : (
    <td className={cls} {...rest}>
      {children}
    </td>
  );
}

/* -------------------------------------------------------------------------- */
/* TableEmpty, TableSkeleton                                                  */
/* -------------------------------------------------------------------------- */

export type TableEmptyProps = {
  /** How many columns the table has, so the message spans the row. */
  columns: number;
  /** One sentence saying what will appear here. */
  children: ReactNode;
  /** The one action that makes rows appear, such as a Button. */
  action?: ReactNode;
};

/** The empty body row: one sentence and one action, left-aligned, with no illustration. It is announced as a status. */
export function TableEmpty({ columns, children, action }: TableEmptyProps) {
  const { dress } = useContext(TableContext);
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-8 text-left align-top">
        <p role="status" className={"max-w-[20rem] text-small " + dress.empty}>
          {children}
        </p>
        {action && <div className="mt-4">{action}</div>}
      </td>
    </tr>
  );
}

export type SkeletonColumn = "primary" | "text" | "number" | "box";
const skeletonBar: Record<SkeletonColumn, string> = {
  primary: "h-4 w-40",
  text: "h-4 w-24",
  number: "ml-auto h-4 w-12",
  box: "size-5",
};

export type TableSkeletonProps = {
  /** One entry per column, so each bar has its column's width and alignment: primary, text or number, or box for a TableSelectCell's column. */
  columns: SkeletonColumn[];
  /** How many placeholder rows to draw. */
  rows?: number;
};

/** Placeholder rows at the real row height: surface-2 bars, static, and hidden from screen readers. Pair it with `busy` on the Table. */
export function TableSkeleton({ columns, rows = 4 }: TableSkeletonProps) {
  const { dress } = useContext(TableContext);
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row} aria-hidden="true">
          {columns.map((kind, col) => (
            <td key={col} className={"h-control-md px-4 py-3 align-middle " + dress.skeleton}>
              <span className={"block " + dress.bar + " " + skeletonBar[kind]} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
