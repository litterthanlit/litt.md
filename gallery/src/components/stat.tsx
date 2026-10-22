/**
 * Stat: a number tile for one figure that tells you how things stand, such as active projects or the
 * median build time. Compose a row of them in a StatGroup.
 *
 * - Surface (components.md, Stat): `.litt-raised`, so the surface radius, surface-1, an inset hairline and the
 *   top highlight, and no outer shadow (P4). Never glass (P3), never an accent rail. Padding is space-4 in a narrow
 *   group and space-6 once the group is 48rem wide. A tile links nowhere, so it has no hover and no motion.
 * - Type: the label is the small size in fg-subtle, the value is the h3 size in fg in the sans with tabular
 *   numbers (a figure that updates does not wobble), and a unit follows the value at the same size in fg-subtle.
 *   The value carries the title weight that comes with the h3 step, and the label stays at the text weight (P9).
 * - Delta: a word and the number ("Up 12% on last week") at the caption size. The word says the direction. The
 *   color says whether it is news: success for good, danger for bad, fg-subtle for neither. Hidden text repeats
 *   the judgment ("good news"), so color is never the only signal. No arrow glyph, no dot.
 * - Trend: an optional slot at the foot of the tile, under the delta and the full width of the tile, for a Sparkline.
 *   It sits at the bottom whatever else the tile holds, so the trends in a row of tiles line up even when only some
 *   tiles have a delta. It is part of the description, so a screen reader reads the value, the delta, then the trend.
 * - Group: a description list laid out as a grid that measures itself (a container query), not the window: the
 *   shell takes 240px of a laptop screen, so the window is the wrong measure. Two across, four across from 40rem,
 *   one below 20rem. Tiles in a row share the row's height.
 * - Semantics: each tile is a term (the label) and its description (the value), so a screen reader reads
 *   "Active projects, 12". A Stat outside a group wraps itself in its own list.
 * - Motion: none. A value that changes just changes; an entrance cascade belongs to the page.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): a value given as a number counts up on arrival
 *   with fun mode's pen, the same steady hand that draws a Sparkline in the trend slot, so the figure and its line
 *   arrive together. While it counts, screen readers get the value itself. At rest it is the static tile exactly.
 */
import { createContext, useContext, type ReactNode } from "react";
import { useFun, useFunValue } from "@/motion";

/** Whether a change is good news, bad news or neither. It sets the delta's color, and a hidden word for screen readers. */
export type StatTone = "good" | "bad" | "neutral";

const TONE: Record<StatTone, string> = {
  good: "text-success",
  bad: "text-danger",
  neutral: "text-fg-subtle",
};
const TONE_WORD: Record<StatTone, string> = { good: ", good news", bad: ", bad news", neutral: "" };

const InGroup = createContext(false);

export type StatProps = {
  /** What the figure measures, in sentence case with no colon: "Deploys this week". */
  label: string;
  /** The figure. A number or a short string such as "99.98". It is set in the sans with tabular numbers. */
  value: ReactNode;
  /** A unit that follows the value in fg-subtle, such as "s" or "%". Leave it out for a plain count. */
  unit?: string;
  /** A word and the number: "Up 12% on last week". Say the direction in words. Never write an arrow on its own. */
  delta?: string;
  /** Whether the change is good news, bad news or neither. A fall in build time is good, so this is not the direction. */
  tone?: StatTone;
  /** A Sparkline for the foot of the tile, under the delta and the full width of the tile. It sits at the bottom, so trends in a row line up whether or not a tile has a delta. */
  trend?: ReactNode;
  /** Extra classes for the tile, such as a column span. */
  className?: string;
};

/** One number tile. Put it in a StatGroup, or on its own. */
export function Stat({ label, value, unit, delta, tone = "neutral", trend, className = "" }: StatProps) {
  const grouped = useContext(InGroup);
  /* Fun mode: a number counts with the pen. Its digits are hidden from screen readers while they move. */
  const fun = useFun();
  const numeric = typeof value === "number";
  const counted = useFunValue(numeric ? value : 0, { kind: "draw" });
  const figure =
    fun && numeric && counted.moving ? (
      <>
        <span aria-hidden="true">{Math.round(counted.shown)}</span>
        <span className="sr-only">{value}</span>
      </>
    ) : (
      value
    );
  const tile = (
    <div
      className={
        "litt-raised flex h-full min-w-0 flex-col gap-2 rounded-surface p-4 @min-[48rem]:p-6 " + className
      }
    >
      <dt className="text-small text-fg-subtle">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-1">
        <span className="text-h3 tabular-nums text-fg">
          {figure}
          {unit && <span className="text-fg-subtle">{unit}</span>}
        </span>
        {delta && (
          <span className={"text-caption " + TONE[tone]}>
            {delta}
            <span className="sr-only">{TONE_WORD[tone]}</span>
          </span>
        )}
        {trend ? <div className="mt-auto pt-3">{trend}</div> : null}
      </dd>
    </div>
  );
  return grouped ? tile : <dl className="@container">{tile}</dl>;
}

export type StatGroupProps = {
  /** The tiles. Each is a Stat. */
  children: ReactNode;
  /** Extra classes for the grid, such as a top margin. */
  className?: string;
};

/** A grid of Stats that measures its own width: two across, four across from 40rem, one below 20rem. */
export function StatGroup({ children, className = "" }: StatGroupProps) {
  return (
    <InGroup.Provider value>
      <div className="@container">
        <dl className={"grid grid-cols-2 gap-4 @max-[20rem]:grid-cols-1 @min-[40rem]:grid-cols-4 " + className}>
          {children}
        </dl>
      </div>
    </InGroup.Provider>
  );
}
