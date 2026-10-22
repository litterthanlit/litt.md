/**
 * TableFilter: a filter for one column of a Table, in its header (components.md, "Table and list rows", Filters).
 * Pass it as a TableHead's `filter`. It is a small button that opens the Menu with the column's values as rows.
 *
 * - Values: `multiple` (the default) is checkbox rows, any number on; none on means no filter, so every row shows.
 *   A checkbox row can say how many rows it would show, in the Menu's mono hint at the end ("1,204"); count them
 *   against the other filters, so the numbers are what picking it would give. A Show all row under a hairline clears
 *   the column. Single is radio rows with All first, for buckets of a number such as "Over 60 s".
 * - The button: a 16px funnel in --fg-subtle at rest, 28px, the control radius (44px under a finger, the header's
 *   height). While the column filters, it wears the selected segment (P12): --surface-2 with the hairline and the top
 *   highlight, the funnel in --fg and, with several values, how many are on in the mono. Never the accent: a table can
 *   filter on several columns at once.
 * - The Menu does the rest: glass, 44px rows, the gliding highlight, typeahead, and rows that stay open as they toggle,
 *   so several values change in one visit. The rows filter as they toggle; nothing waits for an Apply.
 * - Accessibility: the button is named for the column and what it holds ("Filter status, 2 of 4 on"), and the menu is
 *   named "Filter status". Say the result in a polite status of your own ("1,170 of 10,000 deploys").
 * - Motion: the Menu's, on the responsive tier. The button's fill changes on the instant tier.
 */
import { type ReactNode } from "react";
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
/* The selected segment (P12), one surface up from the header's surface-1. */
const on = "bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--line),var(--highlight)]";

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
        <span aria-hidden="true" className="font-mono text-caption font-normal tabular-nums">
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
