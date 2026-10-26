/**
 * Funnel: how many went on at each step. Visited, signed up, activated, paid. Rows, not a trapezoid: the Meter's
 * thin rail (chart.tsx) once per step, every rail measured against the first step.
 *
 * - Header: the Breakdown's row. The label at the start (small, `--fg`), the overall conversion at the end (tabular,
 *   caption, `--fg-subtle`, tabular): "4.1% overall", the last step as a share of the first. A long label truncates;
 *   the reading never does.
 * - Steps: one row per step, in order, in exactly the Meter's anatomy: the label, the reading (the value, then its
 *   share of the first step: "6,930  38%"), and under them a 4px rail on fg at 12% filled to that share. No
 *   dividers and no boxes.
 * - Between two steps: one quiet line at the caption size in `--fg-subtle` that says in words how many went on
 *   ("38% continued"). Never red, never an arrow or a dash doing the talking. `formatStep` rewrites it.
 * - Hue (R7): one data hue for the whole funnel, blue unless `hue` says otherwise. It is one quantity, so one hue.
 * - Shares: whole percentages, with one decimal under 10% ("4.1%") so the small end of a funnel still reads, and
 *   "<0.1%" for a step that is there but tiny.
 * - Bad data still draws: a step larger than the one before it fills to its share, held at 100% of the first, and
 *   its line says it is more than the step before. A first step of 0 draws empty rails and no shares.
 * - Semantics: an ordered list named by the label. Each step is a list item whose rail is `role="meter"` named by
 *   the step's label, from 0 to the first step's value, with the value and its share as its text ("6,930 people,
 *   38% of 18,240"). The line between steps is plain text at the start of the next item, so it is read in order.
 *   The visible header and every visible reading are hidden from assistive tech, and a visually hidden line says
 *   the overall conversion ("Signups, 4.1% overall: 748 of 18,240"), so nothing is read twice.
 * - Motion: none. Static, like the Meter: no entrance, no hover, no focus stop. A value that changes just changes.
 */
import { useId } from "react";

/** The five data hues, in their fixed order (R7). */
export type FunnelHue = "blue" | "amber" | "teal" | "violet" | "rose";

/** A hue's mark tone fills every rail. */
const MARK: Record<FunnelHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};
/** The Meter's track. */
const TRACK = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]";

const groupDigits = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });
const clean = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

/**
 * A share as the funnel shows it: "38%", "4.1%" under 10% so the small end still reads, "<0.1%" for a step that is
 * there but tiny, and "0%" for none.
 */
const percent = (share: number) => {
  if (!(share > 0)) return "0%";
  if (share < 0.001) return "<0.1%";
  if (share < 0.1) return `${(Math.round(share * 1000) / 10).toLocaleString("en-GB", { minimumFractionDigits: 1 })}%`;
  return `${Math.round(share * 100)}%`;
};

/** The default line between two steps, in words. */
const continued = (value: number, previous: number) =>
  previous <= 0 ? "Nothing to continue from" : value > previous ? `${percent(value / previous)} of the step before` : `${percent(value / previous)} continued`;

export type FunnelStep = {
  /** What happened at this step, in a few words: "Signed up". It names the step's meter, and truncates when narrow. */
  label: string;
  /** How many reached this step, zero or more. Its rail fills to its share of the first step. */
  value: number;
};

export type FunnelProps = {
  /** What the funnel follows, at the start of the header: "Signups". It names the list for assistive tech. */
  label: string;
  /** The steps, in the order people go through them. Every rail is measured against the first. */
  steps: FunnelStep[];
  /** The one data hue every rail fills with. A funnel is one quantity, so it takes one hue. */
  hue?: FunnelHue;
  /** The reading at the end of the header, in tabular figures. Defaults to the last step as a share of the first: "4.1% overall". */
  overallText?: string;
  /** Turns a value into the text shown and read: `(v) => \`${v} builds\``. The default groups thousands. */
  formatValue?: (value: number) => string;
  /** What the values count, said after each number to screen readers: "people". Pass ["person", "people"] to say the first for exactly 1. Leave it out when `formatValue` already says it. */
  unit?: string | [one: string, other: string];
  /** Writes the line between two steps from this step's value and the one before. The default says "38% continued", or "126% of the step before" when a step went up. */
  formatStep?: (value: number, previous: number) => string;
  /** Extra classes for the funnel, such as a width. */
  className?: string;
};

/** How many went on at each step: a thin rail per step against the first, with the step-to-step share in words. Static: it never animates. */
export function Funnel({ label, steps, hue = "blue", overallText, formatValue, unit, formatStep, className = "" }: FunnelProps) {
  const id = useId();
  const fmt = formatValue ?? groupDigits;
  const unitFor = (v: number) => (Array.isArray(unit) ? (v === 1 ? unit[0] : unit[1]) : unit);
  const withUnit = (v: number) => fmt(v) + (unit ? ` ${unitFor(v)}` : "");
  const between = formatStep ?? continued;
  const fill = MARK[hue] ?? MARK.blue;

  const rows = steps.map((s) => ({ label: s.label, value: clean(s.value) }));
  const first = rows.length ? rows[0].value : 0;
  const last = rows.length ? rows[rows.length - 1].value : 0;
  const measured = first > 0;
  /* The overall conversion only means something with two steps and a first step to measure against. */
  const overall = rows.length > 1 && measured ? percent(last / first) + " overall" : "";
  const reading = overallText ?? overall;
  const spoken =
    overallText != null
      ? `${label}, ${overallText}`
      : overall
        ? `${label}, ${overall}: ${fmt(last)} of ${withUnit(first)}`
        : "";

  return (
    <div className={"grid grid-cols-1 content-start gap-6 " + className}>
      <div aria-hidden="true" className="flex items-baseline justify-between gap-4">
        <span className="min-w-0 truncate text-small text-fg">{label}</span>
        {reading && <span className="shrink-0 whitespace-nowrap text-caption font-normal tabular-nums text-fg-subtle">{reading}</span>}
      </div>
      {spoken && <p className="sr-only">{spoken}</p>}

      <ol role="list" aria-label={label} className="m-0 grid grid-cols-1 list-none gap-3 p-0">
        {rows.map((step, i) => {
          const share = measured ? step.value / first : 0;
          const nameId = `${id}-${i}`;
          const text = !measured || i === 0 ? withUnit(step.value) : `${withUnit(step.value)}, ${percent(share)} of ${fmt(first)}`;
          return (
            <li key={`${i}-${step.label}`} className="grid grid-cols-1 gap-2">
              {i > 0 && <p className="m-0 pb-1 text-caption font-normal tabular-nums text-fg-subtle">{between(step.value, rows[i - 1].value)}</p>}
              <div aria-hidden="true" className="flex items-baseline justify-between gap-4">
                <span id={nameId} className="min-w-0 truncate text-small text-fg">
                  {step.label}
                </span>
                <span className="shrink-0 whitespace-nowrap text-caption font-normal tabular-nums text-fg-subtle">
                  {fmt(step.value)}
                  {measured && <span className="ml-2 inline-block min-w-[4ch] text-right">{percent(share)}</span>}
                </span>
              </div>
              <div
                role="meter"
                aria-labelledby={nameId}
                aria-valuemin={0}
                aria-valuemax={measured ? first : 1}
                aria-valuenow={measured ? Math.min(step.value, first) : 0}
                aria-valuetext={text}
                className={"h-1 overflow-hidden rounded-control " + TRACK}
              >
                <div className={"h-full rounded-control " + fill} style={{ width: `${Math.round(Math.min(1, share) * 1e5) / 1e3}%` }} />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
