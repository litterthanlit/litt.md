/**
 * Cohort grid: retention by signup week as a real table. One row per cohort, one column per period since signup,
 * and in every cell the number itself, with a dot in front of it in one data hue's four steps (R7), so the eye
 * still finds where retention holds. The numbers are the point; the dots are the Heatmap's scale beside them.
 *
 * - Columns: the cohort's name (small, `--fg`, at the start), its size (caption, `--fg-subtle`, tabular, at the end,
 *   headed "Users"), then a cell per period: an 8px dot just before the value (caption at 400, `--fg`,
 *   tabular, end-aligned). Every number keeps the width of the grid's longest, so the dots line up in a column
 *   and the figures do too. Both inks pass 4.5:1, and no value is set quieter for being low: color is never the
 *   only signal.
 * - Color (components.md, Heatmap): zero is an empty dot at fg 8%. The four steps are the hue's mark tone over
 *   transparent at 30, 55, 80 and 100%. The default steps are the quartiles of the non-zero values, as in the
 *   Heatmap. A missing or `null` value (a cohort too young for that period) is an empty cell: no dot, no number,
 *   and "no data" for a screen reader. The legend under the table is "Less", the five levels, "More", hidden from
 *   screen readers because the numbers already say it.
 * - Average: `average` adds a last row in a <tfoot>, over a `--line-strong` hairline. For shares it is "All
 *   cohorts", the share of every user who has reached the period (the cohorts weighted by size), with the total
 *   size. For counts it is "Average cohort", the mean count of the cohorts that have reached the period, with the
 *   mean size, so it stays on the cells' scale and takes its dots from the same steps.
 * - Look: the Table's. A hairline box at the surface radius filled surface-1, rows on 1px `--line`, 44px rows,
 *   the header row at the caption size and the label weight in `--fg-subtle`, sentence case. Period cells are
 *   compact, about 64px. No hover: there is nothing to pick.
 * - Fit: the table keeps the width its content needs and scrolls sideways inside its own box, so the page never
 *   does. The cohort column is sticky at the start on the box's own surface, and a hairline appears at its end
 *   once the periods have scrolled under it. When there is something to scroll, the box becomes a focusable group
 *   named by the caption (the Table's choice: a group, so several grids on a page do not repeat a landmark), so
 *   the arrow keys scroll it. When there is not, it adds no tab stop.
 * - Semantics: a native <table> with an sr-only <caption> (the label), `th scope="col"` headers and a `th
 *   scope="row"` per cohort, so a screen reader announces "12 Oct, Week 3, 41%". The caption is hidden because the
 *   card or section around the grid names it with its own heading, and a visible caption would scroll with the
 *   table. No roving tabindex and no tooltip: every number is already on screen.
 * - Motion: none. Static, like the Meter and the Breakdown.
 */
import { useEffect, useId, useRef, useState } from "react";

/** The five data hues, in their fixed order (R7). */
export type CohortHue = "blue" | "amber" | "teal" | "violet" | "rose";

/** One cohort: the people who signed up in one period, and how many of them were still active in each period after. */
export type Cohort = {
  /** When the cohort signed up, in a few characters: "12 Oct", "Aug 2026". It names the row and every value in it. */
  label: string;
  /** How many people the cohort started with. Shown in the size column, and the weight of the cohort in the average row. */
  size: number;
  /** One value per period since signup, the first period first: the share still active (0 to 100), or a count with `valueType="count"`. A period the cohort has not reached yet is `null`, or leave it off the end. */
  values: (number | null)[];
};

export type CohortGridProps = {
  /** The grid's name: "Retention by signup week". It is the table's hidden caption and names the scroll box. */
  label: string;
  /** The cohorts, oldest first, so the youngest (with the fewest periods) sit at the bottom and the grid reads as a triangle. */
  cohorts: Cohort[];
  /** One header per period column: ["Month 0", "Month 1"]. Leave it out and they are `periodLabel` and the period's number. */
  periods?: string[];
  /** The word before each period's number when `periods` is left out: "Month" gives "Month 0", "Month 1". */
  periodLabel?: string;
  /** The header of the first column, over the cohorts' names. */
  cohortLabel?: string;
  /** The header of the size column. */
  sizeLabel?: string;
  /** Whether the values are shares of the cohort (0 to 100, written "42%") or counts of people (written "1,240"). */
  valueType?: "percent" | "count";
  /** The one data hue the dots are made of. Pick it for what the grid is about and keep it the same for the same thing across a view. */
  hue?: CohortHue;
  /** Where each of the four dot levels starts, lowest first. Zero is always the empty dot, and a value under the first step is still the lightest level. The default is the quartiles of the non-zero values. */
  steps?: [number, number, number, number];
  /** Turns a value into the text in its cell: `(v) => v.toFixed(1) + "%"`. The default rounds a share to a whole percent and groups a count's thousands. */
  formatValue?: (value: number) => string;
  /** Adds a last row that sums up every cohort: "All cohorts" for shares (weighted by size), "Average cohort" for counts. */
  average?: boolean;
  /** Extra classes for the grid's outer box, such as a max width. */
  className?: string;
};

/* ----------------------------------------------------------------- tokens and helpers */

/** An empty dot: the foreground at 8%. */
const EMPTY = "bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]";

/** The four steps of each hue as classes, 30, 55, 80 and 100% of the mark tone over transparent. Literal strings, so Tailwind sees them. */
const HUE: Record<CohortHue, readonly [string, string, string, string]> = {
  blue: [
    "bg-[color-mix(in_oklab,var(--data-blue)_30%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-blue)_55%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-blue)_80%,transparent)]",
    "bg-data-blue",
  ],
  amber: [
    "bg-[color-mix(in_oklab,var(--data-amber)_30%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-amber)_55%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-amber)_80%,transparent)]",
    "bg-data-amber",
  ],
  teal: [
    "bg-[color-mix(in_oklab,var(--data-teal)_30%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-teal)_55%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-teal)_80%,transparent)]",
    "bg-data-teal",
  ],
  violet: [
    "bg-[color-mix(in_oklab,var(--data-violet)_30%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-violet)_55%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-violet)_80%,transparent)]",
    "bg-data-violet",
  ],
  rose: [
    "bg-[color-mix(in_oklab,var(--data-rose)_30%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-rose)_55%,transparent)]",
    "bg-[color-mix(in_oklab,var(--data-rose)_80%,transparent)]",
    "bg-data-rose",
  ],
};

const groupDigits = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
const wholePercent = (n: number) => `${Math.round(n)}%`;
const isValue = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);

/** The value at a fraction of the sorted list, interpolating between neighbours. */
function quantile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const at = (sorted.length - 1) * p;
  const lo = Math.floor(at);
  const hi = Math.ceil(at);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (at - lo);
}

/** The quartiles of the non-zero values: the level 1 start, then the first, second and third quartile. The Heatmap's scale. */
function quartileSteps(cohorts: Cohort[]): [number, number, number, number] {
  const values = cohorts.flatMap((c) => c.values).filter((v): v is number => isValue(v) && v > 0);
  if (values.length === 0) return [1, 2, 3, 4];
  const sorted = values.sort((a, b) => a - b);
  return [sorted[0]!, quantile(sorted, 0.25), quantile(sorted, 0.5), quantile(sorted, 0.75)];
}

/** 0 for an empty dot, then 1 to 4. A non-zero value under the first step is still level 1. */
function levelOf(value: number, steps: readonly number[]) {
  if (!(value > 0)) return 0;
  let level = 1;
  for (let k = 1; k < 4; k++) if (value >= steps[k]!) level = k + 1;
  return level;
}

/** The summary row: for shares, every user who reached the period (cohorts weighted by size); for counts, the mean cohort. */
function averageRow(cohorts: Cohort[], periods: number, valueType: "percent" | "count"): Cohort {
  const values = Array.from({ length: periods }, (_, p) => {
    const reached = cohorts.filter((c) => isValue(c.values[p]));
    if (reached.length === 0) return null;
    if (valueType === "count") return reached.reduce((s, c) => s + c.values[p]!, 0) / reached.length;
    const people = reached.reduce((s, c) => s + Math.max(0, c.size), 0);
    return people > 0 ? reached.reduce((s, c) => s + c.values[p]! * Math.max(0, c.size), 0) / people : null;
  });
  const total = cohorts.reduce((s, c) => s + Math.max(0, c.size), 0);
  return valueType === "count"
    ? { label: "Average cohort", size: cohorts.length ? total / cohorts.length : 0, values }
    : { label: "All cohorts", size: total, values };
}

/* ----------------------------------------------------------------- cells */

const headCell = "h-control-md border-b border-line px-3 py-3 align-middle text-caption font-label whitespace-nowrap text-fg-subtle";
const bodyCell = "h-control-md px-3 py-3 align-middle whitespace-nowrap";
/** The sticky cohort column: the box's own surface under it, and a hairline at its end once the periods scroll under it. */
const sticky =
  "sticky left-0 z-10 bg-surface-1 pl-4 text-left after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-line after:opacity-0 group-data-[scrolled=true]:after:opacity-100";
const figures = "text-caption font-normal tabular-nums";

function ValueCell({ value, fill, text, line, chars }: { value: number | null | undefined; fill: string; text: string; line: string; chars: number }) {
  if (!isValue(value)) {
    return (
      <td className={bodyCell + " " + line}>
        <span className="sr-only">no data</span>
      </td>
    );
  }
  return (
    <td className={bodyCell + " " + line}>
      {/* The dot sits just before its number, and the number keeps the width of the grid's longest, so the dots line up too. */}
      <span className="flex items-center justify-end gap-2">
        <span aria-hidden="true" className={"size-2 shrink-0 rounded-pill " + fill} />
        <span className={figures + " text-right text-fg"} style={{ minWidth: `${chars}ch` }}>
          {text}
        </span>
      </span>
    </td>
  );
}

/* ----------------------------------------------------------------- the grid */

/** Retention by cohort as a table: a row per cohort, a cell per period with its number and a dot in one hue's four steps. Static. */
export function CohortGrid({
  label,
  cohorts,
  periods,
  periodLabel = "Week",
  cohortLabel = "Cohort",
  sizeLabel = "Users",
  valueType = "percent",
  hue = "teal",
  steps,
  formatValue,
  average = false,
  className = "",
}: CohortGridProps) {
  const captionId = useId();
  const region = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const fmt = formatValue ?? (valueType === "count" ? groupDigits : wholePercent);
  const count = Math.max(periods?.length ?? 0, ...cohorts.map((c) => c.values.length));
  const headers = Array.from({ length: count }, (_, p) => periods?.[p] ?? `${periodLabel} ${p}`);
  const scale = steps ?? quartileSteps(cohorts);
  const fillOf = (v: number) => {
    const level = levelOf(v, scale);
    return level === 0 ? EMPTY : HUE[hue][level - 1]!;
  };
  const summary = average && cohorts.length > 0 ? averageRow(cohorts, count, valueType) : null;
  /* The longest value as written, in tabular figures, so every number takes the same width and the dots form columns. */
  const chars = Math.max(
    1,
    ...[...cohorts, ...(summary ? [summary] : [])].flatMap((c) => c.values.filter(isValue).map((v) => fmt(v).length)),
  );

  // The box is focusable only while there is something to scroll, and the sticky column's edge shows once it has scrolled.
  useEffect(() => {
    const el = region.current;
    if (!el) return;
    const measure = () => {
      setScrolls(el.scrollWidth > el.clientWidth + 1);
      setScrolled(el.scrollLeft > 1);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, []);

  const row = (cohort: Cohort, line: string, key: string) => (
    <tr key={key}>
      <th scope="row" className={bodyCell + " " + sticky + " " + line + " text-small font-normal text-fg"}>
        {cohort.label}
      </th>
      <td className={bodyCell + " " + line + " text-right " + figures + " text-fg-subtle"}>{groupDigits(cohort.size)}</td>
      {headers.map((_, p) => {
        const v = cohort.values[p];
        const end = p === headers.length - 1 ? " pr-4" : "";
        return <ValueCell key={p} value={v} fill={isValue(v) ? fillOf(v) : ""} text={isValue(v) ? fmt(v) : ""} line={line + end} chars={chars} />;
      })}
    </tr>
  );

  return (
    <div className={"grid min-w-0 grid-cols-1 gap-3 " + className}>
      <div
        ref={region}
        onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 1)}
        {...(scrolls ? { role: "group", "aria-labelledby": captionId, tabIndex: 0 } : {})}
        data-scrolled={scrolled}
        className={
          "group relative w-full overflow-x-auto rounded-surface border border-line bg-surface-1 " +
          "[scrollbar-color:var(--line-strong)_transparent] [scrollbar-width:thin] " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        }
      >
        <table className="w-full min-w-max border-separate border-spacing-0 text-left text-small">
          <caption id={captionId} className="sr-only">
            {label}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={headCell + " " + sticky}>
                {cohortLabel}
              </th>
              <th scope="col" className={headCell + " text-right"}>
                {sizeLabel}
              </th>
              {headers.map((h, p) => (
                <th key={p} scope="col" className={headCell + " text-right" + (p === headers.length - 1 ? " pr-4" : "")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c, i) => row(c, i === cohorts.length - 1 ? "" : "border-b border-line", `${i}-${c.label}`))}
          </tbody>
          {summary && <tfoot>{row(summary, "border-t border-line-strong", "summary")}</tfoot>}
        </table>
      </div>
      <Legend hue={hue} />
    </div>
  );
}

/* ----------------------------------------------------------------- legend */

/** "Less", the five levels, "More", under the table at its end. Hidden from screen readers: the numbers carry it. */
function Legend({ hue }: { hue: CohortHue }) {
  return (
    <div aria-hidden="true" className={"flex items-center gap-2 justify-self-end whitespace-nowrap text-fg-subtle " + figures}>
      <span>Less</span>
      <span className="flex items-center gap-1">
        {[EMPTY, ...HUE[hue]].map((fill, i) => (
          <span key={i} className={"size-2 rounded-pill " + fill} />
        ))}
      </span>
      <span>More</span>
    </div>
  );
}
