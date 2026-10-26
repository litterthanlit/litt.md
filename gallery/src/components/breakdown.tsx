/**
 * Breakdown: one whole split into its parts. Storage by file type, credits by feature, time by project. The
 * Meter's thin rail (chart.tsx) grown into a component: a hue is a thread through neutral space, never an area.
 *
 * - Header: the Meter's row. The label at the start (small, `--fg`), the reading at the end (tabular, caption,
 *   `--fg-subtle`, tabular). A long label truncates; the reading never does.
 * - Split rail: a 4px rail under the header, one segment per part, each as wide as its share of the whole, in its
 *   hue's mark tone, at the control radius (so each segment has the Meter fill's rounded ends), with 2px of air
 *   between segments. When `total` is more than the sum, the rest is one last segment in fg at 12%, the Meter's
 *   track. A part too small to draw keeps 4px, taken from the widest segment (the free space or the largest part),
 *   so the rail never overflows. A part of zero draws nothing.
 * - Rows (the default): one row per part, `--space-6` apart, in exactly the Meter's anatomy: the label, the reading
 *   (the value, then its share of the whole), and a 4px rail on fg at 12% filled to the share in the part's hue. The
 *   rows line up with a plain Meter beside them. No dividers and no boxes.
 * - Legend: for a tile or a narrow panel. Under the split rail, a wrapping row of entries: a 12px by 4px swatch rail
 *   in the hue at the control radius, the label (small, fg) and the value (tabular, caption, fg-subtle).
 * - Hues (R7): a part without a hue takes the next free one in the fixed order (blue, amber, teal, violet, rose).
 *   Parts past the fifth fold into one "Other" part in fg at 55% (their values summed), so the hues are never cycled
 *   and a sixth never gets one. A hue the caller sets is never reused for another part in the same Breakdown: if it
 *   would be, development logs a console error and the part takes the next free hue.
 * - Semantics: the split rail is `role="img"` named by a summary ("Storage, 91 of 100 GB: Video 58 GB, ..., 9 GB
 *   free"). In rows, each row is a list item whose rail is `role="meter"` named by the row's label, with the value,
 *   the whole, and the reading as its text; the visible header of the Breakdown and of each row is hidden from
 *   assistive tech so nothing is read twice. In the legend the entries are a list, read as "Video, 58 GB".
 * - Motion: none. Static, like the Meter: no entrance, no hover, no focus stop. A value that changes just changes.
 */
import { useEffect, useId } from "react";

/** The five data hues, in their fixed order (R7). */
export type BreakdownHue = "blue" | "amber" | "teal" | "violet" | "rose";

/** The hues in the order a part without one takes them. */
const ORDER: BreakdownHue[] = ["blue", "amber", "teal", "violet", "rose"];

/** A hue's mark tone fills a segment, a swatch and a row's rail. */
const MARK: Record<BreakdownHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};
/** The folded part is the quiet foreground, the way a sixth series is in chart.tsx. */
const OTHER = "bg-[color-mix(in_oklab,var(--fg)_55%,transparent)]";
/** The Meter's track, and the free space in the split rail. */
const FREE = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]";

/** How many parts get a hue before the rest fold into Other. */
const HUED = ORDER.length;
/** The least a drawn segment is wide, in px: the rail's own height, so a tiny part is still a dot. */
const SEGMENT_MIN = 4;
/** The air between segments, in px. */
const SEGMENT_GAP = 2;

const groupDigits = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });
const clean = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);
const tidy = (n: number) => Math.round(n * 1e6) / 1e6;

export type BreakdownItem = {
  /** What the part is, in a few words: "Video". It names the row and the legend entry, and truncates when narrow. */
  label: string;
  /** The part's quantity, zero or more. It sets the segment's width and the row's fill. */
  value: number;
  /** Pins this part to one of the five data hues, so a kind keeps its color wherever it appears. Never reuse one hue for two parts in the same Breakdown. */
  hue?: BreakdownHue;
};

export type BreakdownProps = {
  /** The whole that is split, at the start of the header: "Storage". It names the list and the split rail for assistive tech. */
  label: string;
  /** The parts, in the order to show them. Sort them yourself, largest first: the Breakdown does not. Past the fifth they fold into Other. */
  items: BreakdownItem[];
  /** The whole, such as the plan's 100 GB. When it is more than the sum of the parts, the rest shows as free space. Defaults to the sum, and is never less than it. */
  total?: number;
  /** The reading at the end of the header, in tabular figures: "91 of 100 GB". Defaults to the sum, or "91 of 100" when there is a total, written by `formatValue`. */
  totalText?: string;
  /** Turns a value into the text shown and read: `(v) => \`${v} GB\``. The default groups thousands. */
  formatValue?: (value: number) => string;
  /** What the values count, said after each number to screen readers: "credits". Pass ["credit", "credits"] to say the first for exactly 1. Leave it out when `formatValue` already says it. */
  unit?: string | [one: string, other: string];
  /** Rows draw one thin rail per part with its label and reading. The legend is a wrapping row of small swatches for a tile or a narrow panel. */
  layout?: "rows" | "legend";
  /** Extra classes for the Breakdown, such as a width. */
  className?: string;
};

type Part = { label: string; value: number; fill: string };

/**
 * Cuts the items into drawn parts: the first five keep their own hue, the rest fold into Other. Hues the caller set
 * are reserved first, then every part without one takes the next free hue in the fixed order, so pinning one part
 * never repaints the others by position.
 */
function plan(items: BreakdownItem[], name: string) {
  const shown = items.slice(0, HUED);
  const folded = items.slice(HUED);
  const taken = new Set<BreakdownHue>();
  const problems: string[] = [];
  const pinned = shown.map((item) => {
    if (!item.hue || !ORDER.includes(item.hue)) return null;
    if (taken.has(item.hue)) {
      problems.push(
        `Breakdown "${name}": the hue "${item.hue}" is set on more than one part ("${item.label}" is the second). A hue means one part in one Breakdown, so "${item.label}" takes the next free hue.`,
      );
      return null;
    }
    taken.add(item.hue);
    return item.hue;
  });
  const parts: Part[] = shown.map((item, i) => {
    let hue = pinned[i];
    if (!hue) {
      hue = ORDER.find((h) => !taken.has(h)) ?? ORDER[0];
      taken.add(hue);
    }
    return { label: item.label, value: clean(item.value), fill: MARK[hue] };
  });
  if (folded.length) parts.push({ label: "Other", value: folded.reduce((sum, item) => sum + clean(item.value), 0), fill: OTHER });
  return { parts, problems };
}

/** Whether this is a development build. The bundler replaces `process.env.NODE_ENV`; where it does not, stay quiet. */
declare const process: { env: { NODE_ENV?: string } };
const inDevelopment = () => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
};

/** A share as the reading shows it: "24%", and "<1%" for a part that is there but under one percent. */
const percent = (share: number) => (share <= 0 ? "0%" : share < 0.01 ? "<1%" : `${Math.round(share * 100)}%`);

/** One whole split into its parts: a split rail, then a thin rail per part or a legend. Static: it never animates. */
export function Breakdown({ label, items, total, totalText, formatValue, unit, layout = "rows", className = "" }: BreakdownProps) {
  const id = useId();
  const fmt = formatValue ?? groupDigits;
  const unitFor = (v: number) => (Array.isArray(unit) ? (v === 1 ? unit[0] : unit[1]) : unit);
  const withUnit = (v: number) => fmt(v) + (unit ? ` ${unitFor(v)}` : "");

  const { parts, problems } = plan(items, label);
  useEffect(() => {
    if (problems.length && inDevelopment()) for (const problem of problems) console.error(problem);
  }, [problems.join("\n")]);

  const sum = tidy(parts.reduce((s, p) => s + p.value, 0));
  const whole = tidy(Math.max(total != null && Number.isFinite(total) ? total : sum, sum));
  const free = tidy(whole - sum);
  const reading = totalText ?? (total != null ? `${fmt(sum)} of ${fmt(whole)}` : fmt(sum));
  const spoken = totalText ?? (total != null ? `${fmt(sum)} of ${withUnit(whole)}` : withUnit(sum));
  const summary =
    `${label}, ${spoken}` +
    (parts.length || free > 0
      ? ": " + [...parts.map((p) => `${p.label} ${withUnit(p.value)}`), ...(free > 0 ? [`${withUnit(free)} free`] : [])].join(", ")
      : "");

  /* The split rail: parts of zero draw nothing, and an empty Breakdown is one quiet track. */
  const segments = [
    ...parts.filter((p) => p.value > 0).map((p, i) => ({ key: `${i}-${p.label}`, value: p.value, fill: p.fill })),
    ...(free > 0 ? [{ key: "free", value: free, fill: FREE }] : []),
  ];
  if (!segments.length) segments.push({ key: "empty", value: 1, fill: FREE });
  /* The widest segment (the free space or the largest part) takes what is left, so a part held to 4px costs it, never the rail. */
  const widest = segments.reduce((best, s, i) => (s.value > segments[best].value ? i : best), 0);
  const gaps = (segments.length - 1) * SEGMENT_GAP;

  return (
    <div className={"grid grid-cols-1 content-start " + (layout === "legend" ? "gap-4 " : "gap-6 ") + className}>
      <div className="grid grid-cols-1 gap-2">
        <div aria-hidden="true" className="flex items-baseline justify-between gap-4">
          <span className="min-w-0 truncate text-small text-fg">{label}</span>
          <span className="shrink-0 whitespace-nowrap text-caption font-normal tabular-nums text-fg-subtle">{reading}</span>
        </div>
        <div role="img" aria-label={summary} className="flex h-1 gap-0.5 overflow-hidden">
          {segments.map((s, i) =>
            i === widest ? (
              <span key={s.key} className={"min-w-1 flex-1 rounded-control " + s.fill} />
            ) : (
              <span
                key={s.key}
                className={"shrink-0 rounded-control " + s.fill}
                style={{ width: `max(${SEGMENT_MIN}px, calc((100% - ${gaps}px) * ${Math.round((s.value / whole) * 1e5) / 1e5}))` }}
              />
            ),
          )}
        </div>
      </div>

      {layout === "legend" ? (
        <ul role="list" aria-label={label} className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
          {parts.map((p, i) => (
            <li key={`${i}-${p.label}`} className="flex max-w-full min-w-0 items-baseline gap-2">
              <span aria-hidden="true" className={"h-1 w-3 shrink-0 self-center rounded-control " + p.fill} />
              <span className="min-w-0 truncate text-small text-fg">
                {p.label}
                <span className="sr-only">, </span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-caption font-normal tabular-nums text-fg-subtle">
                {fmt(p.value)}
                {unit && <span className="sr-only"> {unitFor(p.value)}</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ul role="list" aria-label={label} className="m-0 grid grid-cols-1 list-none gap-6 p-0">
          {parts.map((p, i) => {
            const share = whole > 0 ? Math.min(1, p.value / whole) : 0;
            const nameId = `${id}-${i}`;
            return (
              <li key={`${i}-${p.label}`} className="grid grid-cols-1 gap-2">
                <div aria-hidden="true" className="flex items-baseline justify-between gap-4">
                  <span id={nameId} className="min-w-0 truncate text-small text-fg">
                    {p.label}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-caption font-normal tabular-nums text-fg-subtle">
                    {fmt(p.value)}
                    <span className="ml-2 inline-block min-w-[4ch] text-right">{percent(share)}</span>
                  </span>
                </div>
                <div
                  role="meter"
                  aria-labelledby={nameId}
                  aria-valuemin={0}
                  aria-valuemax={whole}
                  aria-valuenow={p.value}
                  aria-valuetext={`${withUnit(p.value)}, ${percent(share)}`}
                  className={"h-1 overflow-hidden rounded-control " + FREE}
                >
                  <div className={"h-full rounded-control " + p.fill} style={{ width: `${Math.round(share * 1e5) / 1e3}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
