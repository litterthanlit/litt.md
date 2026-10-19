/**
 * Bar list: a ranked list where each row carries a thin bar for its share. Top pages, most-used shortcuts,
 * busiest repos. A sibling of the Meter and the Stat delta in chart.tsx and stat.tsx.
 *
 * - Anatomy: an optional lead (a key cap, an icon or a small avatar, up to 48px wide so two key caps fit), the
 *   label (small, fg, truncates), the bar, the value (mono, small, fg, tabular, end-aligned) and an optional delta
 *   (caption). A row is at least 44px tall (airy) and rows are split by `--line` hairlines.
 * - Bar: the Meter's rail, a 4px rail at the control radius. The track is fg at 12% (the Meter's), the fill is `--fg` (the quiet
 *   default) or the hue's mark tone, and its width is value / max, where max defaults to the largest value. One
 *   hue means one thing in a list (P11): the quantity the bars measure, or, with a hue per row, each row's kind. A bar never takes the accent.
 * - Alignment: one grid for the whole list. Every row is a subgrid of it, so the bars start at the same x and end
 *   at the same x, and the values and deltas line up as columns. The list measures itself with a container query,
 *   not the window: under 28rem the bar moves under the label at the full width of the row, and the lead, the
 *   value and the delta stay on the first line.
 * - Delta: a word and the number ("Up 15%"), at the caption size. The word says the direction. The color says
 *   whether it is news: `--success` for good, `--danger` for bad, `--fg-subtle` for neither, with the judgment in
 *   hidden text ("good news"), exactly as the Stat does. Never an arrow glyph alone, never a dot.
 * - Rows: a row with an `href` is a link, and a row without one is a button when the list has `onSelect`. Both
 *   fill with fg at 4% on hover, at the control radius, on the instant tier, and with fg at 6% while pressed on a
 *   coarse pointer. Their focus ring is inset (2px `outline-focus`, -2px offset), because the row is flush with its
 *   neighbours. A static row has no hover and no focus stop.
 * - Semantics: an ordered list named by `label`. Each row reads "Archive, 412 times" plus the delta's words, built
 *   from the visible text and hidden words. The lead and the bar are hidden from assistive tech: put anything that
 *   matters in the label.
 * - Motion: none. The bars never animate, and hover and press are color changes at `--dur-instant`.
 */
import type { ReactNode } from "react";

/** The five data hues, in their fixed order (P11). */
export type BarListHue = "blue" | "amber" | "teal" | "violet" | "rose";

/** Whether a change is good news, bad news or neither. It sets the delta's color, and a hidden word for screen readers. */
type Tone = "good" | "bad" | "neutral";

/** The hue's mark tone fills the bar. */
const HUE: Record<BarListHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};

const TONE: Record<Tone, string> = {
  good: "text-success",
  bad: "text-danger",
  neutral: "text-fg-subtle",
};
const TONE_WORD: Record<Tone, string> = { good: ", good news", bad: ", bad news", neutral: "" };

const groupDigits = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });

export type BarListItem = {
  /** What the row is, in a few words: "Archive". It truncates when the row is narrow. */
  label: string;
  /** The row's quantity, zero or more. It sets the bar's width and is the number shown. */
  value: number;
  /** A node before the label: a Kbd, a 16px icon or a small avatar, up to 48px wide. It is hidden from screen readers. */
  lead?: ReactNode;
  /** Makes the row a link. The row still calls `onSelect` when it is pressed. */
  href?: string;
  /** What changed, in words and a number: "Up 15% on last month". Never an arrow on its own. */
  delta?: string;
  /** Whether the change is good news, bad news or neither. A fall in errors is good, so this is not the direction. */
  tone?: Tone;
  /** This row's own data hue, when the rows are kinds and each kind keeps its color on the page (video in violet). It overrides the list's hue. One hue per kind. */
  hue?: BarListHue;
};

export type BarListProps = {
  /** Names the list for assistive tech and says what it ranks: "Most-used shortcuts". */
  label: string;
  /** The rows, in the order to show them. Sort them yourself: the list does not. */
  items: BarListItem[];
  /** The value that fills a bar. Defaults to the largest value, so the first bar of a sorted list is full. */
  max?: number;
  /** Turns a value into the text shown and read: `(v) => \`${v} s\``. The default groups thousands. */
  formatValue?: (value: number) => string;
  /** What the values count, said after the number to screen readers: "times". Pass ["commit", "commits"] to say the first for exactly 1. Leave it out when the label says it. */
  unit?: string | [one: string, other: string];
  /** Colors the bars with one of the five data hues. Leave it out for the quiet foreground default. */
  hue?: BarListHue;
  /** Makes rows without an `href` buttons, and is called with the row and its index when any row is pressed. */
  onSelect?: (item: BarListItem, index: number) => void;
  /** Extra classes for the list's box, such as a width or a top margin. */
  className?: string;
};

/*
 * The columns, named by their start line. 0.5rem edge tracks hold the rows' side padding, so a fill reaches past
 * the text. Cells carry their own air (no column gap), so a column that no row uses is 0px wide.
 */
const WIDE = "grid-cols-[0.5rem_[lead]_auto_[label]_fit-content(14rem)_[bar]_minmax(6rem,1fr)_[value]_auto_[delta]_auto_[end]_0.5rem]";
const NARROW = "@max-[28rem]:grid-cols-[0.5rem_[lead]_auto_[label]_minmax(0,1fr)_[value]_auto_[delta]_auto_[end]_0.5rem]";

const ROW = "col-span-full grid min-h-control-md grid-cols-subgrid items-center rounded-control py-2 text-left";
const PRESS =
  "w-full cursor-pointer [-webkit-tap-highlight-color:transparent] transition-[background-color] duration-(--dur-instant) ease-litt " +
  "hover:bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

function Row({
  item,
  index,
  share,
  fill,
  shown,
  said,
  onSelect,
}: {
  item: BarListItem;
  index: number;
  share: number;
  fill: string;
  shown: string;
  said: string;
  onSelect?: (item: BarListItem, index: number) => void;
}) {
  const tone = item.tone ?? "neutral";
  const press = () => onSelect?.(item, index);
  const cells = (
    <>
      {item.lead != null && (
        <span aria-hidden="true" className="col-start-[lead] row-start-1 pr-3">
          <span className="flex max-w-12 items-center gap-1">{item.lead}</span>
        </span>
      )}
      <span className="col-start-[label] row-start-1 block min-w-0 truncate text-small [font-weight:var(--weight)] text-fg">
        {item.label}
        <span className="sr-only">, </span>
      </span>
      <span
        aria-hidden="true"
        className="col-start-[bar] row-start-1 px-4 @max-[28rem]:col-start-[label] @max-[28rem]:col-end-[end] @max-[28rem]:row-start-2 @max-[28rem]:px-0 @max-[28rem]:pt-1"
      >
        <span className="block h-1 overflow-hidden rounded-control bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]">
          <span className={"block h-full rounded-control " + fill} style={{ width: `${share}%` }} />
        </span>
      </span>
      <span className="col-start-[value] row-start-1 text-right @max-[28rem]:pl-3 font-mono text-small tabular-nums text-fg">
        {shown}
        {said && <span className="sr-only">{said}</span>}
      </span>
      {item.delta && (
        <span className={"col-start-[delta] row-start-1 pl-4 text-caption whitespace-nowrap " + TONE[tone]}>
          {item.delta}
          <span className="sr-only">{TONE_WORD[tone]}</span>
        </span>
      )}
    </>
  );
  return (
    <li className="col-span-full grid grid-cols-subgrid border-t border-line first:border-t-0">
      {item.href ? (
        <a href={item.href} onClick={press} className={ROW + " " + PRESS}>
          {cells}
        </a>
      ) : onSelect ? (
        <button type="button" onClick={press} className={ROW + " " + PRESS}>
          {cells}
        </button>
      ) : (
        <div className={ROW}>{cells}</div>
      )}
    </li>
  );
}

/** A ranked list with a thin bar in each row. Rows can link or be pressed; the bars never animate. */
export function BarList({ label, items, max, formatValue, unit, hue, onSelect, className = "" }: BarListProps) {
  const fmt = formatValue ?? groupDigits;
  const top = max ?? Math.max(0, ...items.map((item) => item.value));
  const fill = hue ? HUE[hue] : "bg-fg";
  const unitFor = (v: number) => (Array.isArray(unit) ? (v === 1 ? unit[0] : unit[1]) : unit);
  return (
    <div className={"@container w-full " + className}>
      <ol role="list" aria-label={label} className={"m-0 grid list-none p-0 " + WIDE + " " + NARROW}>
        {items.map((item, i) => {
          const share = top > 0 ? Math.max(0, Math.min(100, (item.value / top) * 100)) : 0;
          const word = unit ? unitFor(item.value) : "";
          /* Hidden words after the number: the unit, then a comma when the delta follows. */
          const said = (word ? ` ${word}` : "") + (item.delta ? ", " : "");
          return <Row key={`${i}-${item.label}`} item={item} index={i} share={share} fill={item.hue ? HUE[item.hue] : fill} shown={fmt(item.value)} said={said} onSelect={onSelect} />;
        })}
      </ol>
    </div>
  );
}
