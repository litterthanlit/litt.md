/**
 * TableFilter: a filter for one column of a Table, in its header (components.md, "Table and list rows", Filters).
 * Pass it as a TableHead's `filter`. It is a small button that opens the Menu with the column's values as rows.
 *
 * - Values: `multiple` (the default) is checkbox rows, any number on; none on means no filter, so every row shows.
 *   A checkbox row can say how many rows it would show, in the Menu's tabular hint at the end ("1,204"); count them
 *   against the other filters, so the numbers are what picking it would give. A Show all row under a hairline clears
 *   the column. Single is radio rows with All first, for buckets of a number such as "Over 60 s".
 * - The button: a 16px funnel in --fg-subtle at rest, 28px, the control radius (44px under a finger, the header's
 *   height). While the column filters, it is raised (R3, selected is raised): the press material's block (--block,
 *   --block-lift), the funnel in --fg and, with several values, how many are on, in tabular figures. Never the accent: a table can
 *   filter on several columns at once.
 * - The Menu does the rest: glass, 44px rows, the gliding highlight, typeahead, and rows that stay open as they toggle,
 *   so several values change in one visit. The rows filter as they toggle; nothing waits for an Apply.
 * - Accessibility: the button is named for the column and what it holds ("Filter status, 2 of 4 on"), and the menu is
 *   named "Filter status". Say the result in a polite status of your own ("1,170 of 10,000 deploys").
 * - Motion: the Menu's, on the responsive tier. The button's fill changes on the instant tier.
 *
 * Filters in the page address (components.md, "Table and list rows", Filters in the address): useUrlFilter and
 * useUrlParam keep a filter, a search or a sort in the query string, so a filtered view can be bookmarked, shared or
 * reloaded, and Back and Forward bring the last one back.
 * - Each value is its own parameter, readable and safe for any text: ?status=failed&site=Halden+Gallery. An empty value
 *   leaves the address, so an unfiltered table has a clean one.
 * - Writes replace the history entry instead of adding one, so Back leaves the page instead of undoing toggles one by
 *   one. They wait 200ms after the last change, so typing a search never floods the history API (Safari throttles it),
 *   while the hooks hand back the new value at once. A write the page has moved on from (another path or hash) is dropped.
 * - The address is untrusted: useUrlFilter keeps only the `values` you allow, so a stale or hand-edited link can never
 *   leave a filter on that nothing can turn off.
 * - Any router: it reads location and writes with history.replaceState, keeping history.state, which Next.js's App
 *   Router and React Router both follow. On the server, and in the render that hydrates, every value is empty, so the
 *   two agree; the address is read right after. In an app without server rendering it is read in the first render.
 */
import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { FilterIcon } from "@/components/icons";
import { Menu, MenuCheckboxItem, MenuItem, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuSeparator } from "@/components/menu";

export type TableFilterOption = {
  /** What the row stands for, in `value` and onValueChange. */
  value: string;
  /** The row's words: "Ready", "Over 60 s". */
  label: string;
  /** How many rows picking it would show, said at the end of a checkbox row. Leave it out to say nothing. */
  count?: number;
};

export type TableFilterProps = {
  /** The column's name, as its header says it: "Status". It names the button and the menu. */
  column: string;
  /** The values to filter by, in the order they should be listed. */
  options: TableFilterOption[];
  /** The values on. An empty list is no filter: every row shows. Single mode holds at most one. */
  value: string[];
  /** Called with the values on after every toggle, or [] for Show all. */
  onValueChange: (value: string[]) => void;
  /** Checkbox rows, any number on (the default), or radio rows with All first, for buckets of a number. */
  multiple?: boolean;
  /** The All row's words in single mode. */
  allLabel?: string;
  /** Which edge of the button the menu lines up with: end for a column at the table's right. */
  align?: "start" | "end";
};

const ALL = "__all__";
const COUNT = new Intl.NumberFormat();

const button =
  "flex h-7 min-w-7 cursor-pointer items-center justify-center gap-1 rounded-control px-1.5 [-webkit-tap-highlight-color:transparent] " +
  "transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
  "pointer-coarse:h-11 pointer-coarse:min-w-11";
const idle =
  "text-fg-subtle hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";
/* Selected is raised (R3): the press material's block, as a switch's block and the current page are. */
const on = "bg-block text-fg shadow-(--block-lift) forced-colors:border";

/** A column's filter: a funnel button in its header that opens the column's values as checkbox (or radio) rows. */
export function TableFilter({ column, options, value, onValueChange, multiple = true, allLabel = "All", align = "start" }: TableFilterProps) {
  const active = value.length > 0;
  const name = column.toLowerCase();
  const picked = options.find((o) => o.value === value[0]);
  const said = !active ? "" : multiple ? `, ${value.length} of ${options.length} on` : `, ${picked?.label ?? value[0]}`;
  const hint = (o: TableFilterOption): string | undefined => (o.count === undefined ? undefined : COUNT.format(o.count));

  const trigger = (
    <button type="button" aria-label={`Filter ${name}${said}`} className={button + " " + (active ? on : idle)}>
      <FilterIcon />
      {active && multiple && (
        <span aria-hidden="true" className="text-caption font-normal tabular-nums">
          {value.length}
        </span>
      )}
    </button>
  );

  let rows: ReactNode;
  if (multiple) {
    rows = options.map((o) => (
      <MenuCheckboxItem
        key={o.value}
        checked={value.includes(o.value)}
        shortcut={hint(o)}
        onCheckedChange={(checked) => onValueChange(checked ? [...value, o.value] : value.filter((v) => v !== o.value))}
      >
        {o.label}
      </MenuCheckboxItem>
    ));
  } else {
    rows = (
      <MenuRadioGroup value={value[0] ?? ALL} onValueChange={(v) => onValueChange(v === ALL ? [] : [v])}>
        <MenuRadioItem value={ALL}>{allLabel}</MenuRadioItem>
        {options.map((o) => (
          <MenuRadioItem key={o.value} value={o.value}>
            {o.label}
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
    );
  }

  return (
    <Menu trigger={trigger} label={`Filter ${name}`} align={align}>
      <MenuLabel>{column}</MenuLabel>
      {rows}
      {multiple && (
        <>
          <MenuSeparator />
          <MenuItem disabled={!active} onSelect={() => onValueChange([])}>
            Show all
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

/* -------------------------------------------------------------------------- */
/* Filters in the page address                                                */
/* -------------------------------------------------------------------------- */

/** How long a write waits after the last change before it reaches the history, in ms. */
const WRITE_AFTER = 200;

/* One store for every hook on the page: the query string, with a write that has not reached the history yet. */
const listeners = new Set<() => void>();
let pending: { search: string; at: string } | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

const here = () => window.location.pathname + window.location.hash;
const readSearch = () => (pending && pending.at === here() ? pending.search : window.location.search);
const notify = () => listeners.forEach((listener) => listener());

function flush() {
  clearTimeout(timer);
  if (!pending) return;
  const { search, at } = pending;
  /* The page moved on while the write waited: never put one page's filters on another. */
  if (at !== here()) {
    pending = null;
    notify();
    return;
  }
  try {
    window.history.replaceState(window.history.state, "", window.location.pathname + search + window.location.hash);
    pending = null;
  } catch {
    /* The browser throttled the history API: the value holds, and it tries again in a moment. */
    timer = setTimeout(flush, 1000);
  }
}

/* Back and Forward: the address wins over a write still waiting. */
function onPopState() {
  clearTimeout(timer);
  pending = null;
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pagehide", flush);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    window.removeEventListener("popstate", onPopState);
    window.removeEventListener("pagehide", flush);
  };
}

function writeParam(name: string, values: readonly string[]) {
  const params = new URLSearchParams(readSearch());
  params.delete(name);
  for (const v of values) if (v !== "") params.append(name, v);
  const text = params.toString();
  const search = text ? `?${text}` : "";
  if (search === readSearch()) return;
  pending = { search, at: here() };
  notify();
  clearTimeout(timer);
  timer = setTimeout(flush, WRITE_AFTER);
}

/** The query string, empty on the server and in the render that hydrates. */
function useSearch() {
  return useSyncExternalStore(subscribe, readSearch, () => "");
}

export type UrlFilterOptions = {
  /** The values this parameter may hold, such as the TableFilter's option values. Anything else in the address is ignored. */
  values?: readonly string[];
  /** false keeps one value at most, for a TableFilter with multiple={false}. */
  multiple?: boolean;
};

/**
 * A TableFilter's values, kept in the page address as one parameter per value: `?status=ready&status=failed`. Returns
 * the values on and a setter, the shape of TableFilter's `value` and `onValueChange`. The list keeps its identity until
 * the parameter changes, so it can sit in a useMemo's or useDeferredValue's inputs.
 */
export function useUrlFilter(name: string, { values, multiple = true }: UrlFilterOptions = {}): [string[], (next: string[]) => void] {
  const search = useSearch();
  /* Joined, so an options list rebuilt every render does not count as a change. */
  const allowed = values?.join("\u0000");
  const value = useMemo(() => {
    const ok = allowed === undefined ? null : new Set(allowed.split("\u0000"));
    const all = new URLSearchParams(search).getAll(name).filter((v, i, list) => (!ok || ok.has(v)) && list.indexOf(v) === i);
    return multiple ? all : all.slice(0, 1);
  }, [search, name, allowed, multiple]);
  const set = useCallback((next: string[]) => writeParam(name, multiple ? next : next.slice(0, 1)), [name, multiple]);
  return [value, set];
}

/**
 * One text value kept in the page address, such as a search (`?q=halden`) or a sort (`?sort=slow`). Returns it, or ""
 * when the address has none, and a setter; setting "" takes the parameter out.
 */
export function useUrlParam(name: string): [string, (next: string) => void] {
  const search = useSearch();
  const value = useMemo(() => new URLSearchParams(search).get(name) ?? "", [search, name]);
  const set = useCallback((next: string) => writeParam(name, [next]), [name]);
  return [value, set];
}
