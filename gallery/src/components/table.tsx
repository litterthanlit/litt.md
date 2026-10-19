/**
 * Table: real table semantics, dressed to components.md (Table and list rows). Compose it from
 * Table, TableHeader, TableBody, TableRow, TableHead and TableCell. TableEmpty and TableSkeleton
 * are the empty and loading rows.
 *
 * - Look: rows are separated by a 1px line; cells pad space-3 and space-4 and use the small size. The primary
 *   cell names the row, so it is fg at the interface weight (550); the rest are fg-subtle at the text weight
 *   (450). Numbers and dates are mono caption size, right-aligned, with tabular figures. Hover is an fg-4% fill
 *   on the instant tier and never moves anything. On a coarse pointer there is no hover, so a row held down
 *   fills instead (fg 6%, same tier, color only), and so does a sortable header; the OS tap flash is off so the
 *   two do not double. The header row is sticky, caption size at the interface weight, fg-subtle, sentence case.
 *   The box is a hairline at the surface radius, filled surface-1 so the sticky header can cover the rows that
 *   scroll under it.
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
 */
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { useExit, useStagger, useTransition, useTravel } from "@/motion";

/** The entrance cascade stops counting at this many rows, so a long table never drags. */
const CASCADE_CAP = 6;

type TableState = { entrance: boolean; animateChanges: boolean; ready: boolean };
const TableContext = createContext<TableState>({ entrance: false, animateChanges: false, ready: true });
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
  /** Extra classes for the scroll region: a max width, or a max height such as max-h-96 so the header sticks while the rows scroll. */
  className?: string;
  /** A TableHeader and a TableBody. */
  children: ReactNode;
};

/** A table in its own scroll region. Compose it from TableHeader and TableBody. */
export function Table({ label, entrance = false, animateChanges = false, busy = false, className = "", children }: TableProps) {
  const captionId = useId();
  const region = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLTableElement>(null);
  const [ready, setReady] = useState(false);
  const [scrolls, setScrolls] = useState(false);

  // Rows that mount with the table are its first wave. Rows that mount later are insertions.
  useEffect(() => setReady(true), []);

  // The region is focusable only while there is something to scroll.
  useEffect(() => {
    const el = region.current;
    if (!el) return;
    const measure = () => setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (table.current) observer.observe(table.current);
    return () => observer.disconnect();
  }, []);

  return (
    <TableContext.Provider value={{ entrance, animateChanges, ready }}>
      <motion.div
        ref={region}
        layoutScroll
        {...(scrolls ? { role: "group", "aria-labelledby": captionId, tabIndex: 0 } : {})}
        aria-busy={busy || undefined}
        className={
          "relative w-full overflow-auto rounded-surface border border-line bg-surface-1 " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
          className
        }
      >
        <table ref={table} className="w-full min-w-max border-separate border-spacing-0 contain-paint text-left text-small">
          <caption id={captionId} className="sr-only">
            {label}
          </caption>
          {children}
        </table>
        <div role="status" className="sr-only">
          {busy ? `Loading ${label}` : ""}
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
  const { entrance, animateChanges } = useContext(TableContext);
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
        {entrance || animateChanges ? <AnimatePresence>{rows}</AnimatePresence> : rows}
      </tbody>
    </SectionContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* TableRow                                                                   */
/* -------------------------------------------------------------------------- */

const rowHover =
  "transition-[background-color] duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
  "hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]";

export type TableRowProps = Omit<ComponentProps<"tr">, "ref"> & {
  /** The row's cells. */
  children?: ReactNode;
  /** Extra classes for the row. */
  className?: string;
};

/** A row. In the body it gets the hover fill, and the entrance or change motion when the Table asks for it. */
export function TableRow({ className = "", children, ...rest }: TableRowProps) {
  const section = useContext(SectionContext);
  const { entrance, animateChanges } = useContext(TableContext);
  if (section === "head" || !(entrance || animateChanges)) {
    return (
      <tr className={(section === "head" ? "" : rowHover + " ") + className} {...rest}>
        {children}
      </tr>
    );
  }
  return (
    <MotionRow className={className} {...rest}>
      {children}
    </MotionRow>
  );
}

function MotionRow({ className = "", children, ...rest }: TableRowProps) {
  const { entrance, animateChanges, ready } = useContext(TableContext);
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
      className={rowHover + " " + className}
      {...(rest as HTMLMotionProps<"tr">)}
    >
      {children}
    </motion.tr>
  );
}

/* -------------------------------------------------------------------------- */
/* TableHead                                                                  */
/* -------------------------------------------------------------------------- */

const head =
  "sticky top-0 z-10 h-control-md border-b border-line bg-surface-1 text-caption [font-weight:var(--weight)] whitespace-nowrap";

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

export type TableHeadProps = Omit<ComponentProps<"th">, "ref" | "scope" | "aria-sort"> & {
  /** Right-aligns the header over a column of numbers or dates. */
  numeric?: boolean;
  /** Which way this column is sorted now. Only read when onSort is set. */
  sort?: SortDirection;
  /** Makes the header a sortable button and sets aria-sort. Called when it is pressed; you sort the rows and pass the new `sort`. */
  onSort?: () => void;
  /** The column's name, in sentence case. */
  children?: ReactNode;
  /** Extra classes for the header cell. */
  className?: string;
};

/** A column header. Sticky, caption size, fg-subtle. Add onSort to make it a sortable button. */
export function TableHead({ numeric = false, sort = "none", onSort, className = "", children, ...rest }: TableHeadProps) {
  const align = numeric ? "text-right" : "text-left";
  if (!onSort) {
    return (
      <th scope="col" className={[head, align, "px-4 py-3 text-fg-subtle", className].join(" ")} {...rest}>
        {children}
      </th>
    );
  }
  return (
    <th scope="col" aria-sort={sort} className={[head, align, "p-0", className].join(" ")} {...rest}>
      <button
        type="button"
        onClick={onSort}
        className={[
          "flex h-control-md w-full cursor-pointer items-center gap-1 px-4 text-caption [font-weight:var(--weight)]",
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

/** A body cell. fg-subtle by default; `primary` makes it the row's name, and `numeric` sets figures in mono. */
export function TableCell({ numeric = false, primary = false, className = "", children, ...rest }: TableCellProps) {
  const cls = [
    // The size class sets the text weight (450), which also undoes a <th>'s default bold in a host app. The primary
    // cell names the row, so it takes the interface weight (550).
    "h-control-md border-b border-line px-4 py-3 align-middle whitespace-nowrap",
    numeric ? "text-right font-mono text-caption tabular-nums" : "text-left text-small",
    primary ? "[font-weight:var(--weight)] text-fg" : "text-fg-subtle",
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
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-8 text-left align-top">
        <p role="status" className="max-w-[20rem] text-small text-fg-muted">
          {children}
        </p>
        {action && <div className="mt-4">{action}</div>}
      </td>
    </tr>
  );
}

type SkeletonColumn = "primary" | "text" | "number";
const skeletonBar: Record<SkeletonColumn, string> = {
  primary: "w-40",
  text: "w-24",
  number: "ml-auto w-12",
};

export type TableSkeletonProps = {
  /** One entry per column, so each bar has its column's width and alignment: primary, text or number. */
  columns: SkeletonColumn[];
  /** How many placeholder rows to draw. */
  rows?: number;
};

/** Placeholder rows at the real row height: surface-2 bars, static, and hidden from screen readers. Pair it with `busy` on the Table. */
export function TableSkeleton({ columns, rows = 4 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row} aria-hidden="true">
          {columns.map((kind, col) => (
            <td key={col} className="h-control-md border-b border-line px-4 py-3 align-middle">
              <span className={"block h-4 rounded-control bg-surface-2 " + skeletonBar[kind]} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
