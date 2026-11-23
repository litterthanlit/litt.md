/**
 * Stat: a number tile for one figure that tells you how things stand, such as active projects or the
 * median build time. Compose a row of them in a StatGroup.
 *
 * - Bodies (proposals/worlds.md): this file resolves the state once into StatBodyProps and renders the body the
 *   material picks (byWorld). Press, here, is a calm surface (.litt-raised: hairline and top highlight, zero cast)
 *   with the quiet label along its top and the figure standing directly on the stone in text-figure (no raised
 *   button box around a read-only number). Flat (worlds/flat/stat.tsx) is a paper card holding one figure that rolls
 *   to a new value, the large figure when the Stat stands alone (taste v1.22). Device (worlds/device/stat.tsx) is a plate with the label engraved above an LCD window that
 *   shows the figure in seven segments. Rack (worlds/rack/stat.tsx) is a panel with a value box (a light cut in the
 *   control line) for the figure and the delta as a small flat key. Never glass (R3), never an accent rail. A tile links nowhere, so it has no
 *   hover and no motion.
 * - Type: the label is the small size in fg-subtle, the value is the figure step (18px in Press, 28px in Flat, 44px
 *   for a Flat Stat on its own) in fg
 *   in the sans with tabular numbers (a figure that updates does not wobble), and a unit follows the value at the same
 *   size in regular fg-subtle. The value carries the title weight, and the label and delta stay at the text weight (R8).
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
 * - Motion: none in Press, Device, Rack and Heat. A value that changes just changes; an entrance cascade belongs to the
 *   page. Under Flat a new value rolls its digits into place on the expressive spring (worlds/flat/stat.tsx); the
 *   first paint is still, and reduced motion sets it at once.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): a value given as a number counts up on arrival
 *   with fun mode's pen, the same steady hand that draws a Sparkline in the trend slot, so the figure and its line
 *   arrive together. While it counts, screen readers get the value itself. At rest it is the static tile exactly.
 */
import { createContext, useContext, type ReactNode } from "react";
import { byWorld, useFun, useFunValue, useMaterial } from "@/motion";
import { StatFlatBody } from "@/worlds/flat/stat";
import { StatDeviceBody } from "@/worlds/device/stat";
import { StatRackBody } from "@/worlds/rack/stat";
import { StatHeatBody } from "@/worlds/heat/stat";

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

/** What a body draws: the contract's resolved state (proposals/worlds.md, Bodies). */
export type StatBodyProps = {
  label: string;
  /** The value as given, for a body that draws the figure itself (Device's segments). */
  value: ReactNode;
  /** The value as it shows now: the given one, or fun mode's count while it moves. */
  figure: ReactNode;
  unit?: string;
  delta?: string;
  /** The delta's color class: success, danger or the subtle ink. */
  toneClass: string;
  /** Hidden words after the delta: ", good news", ", bad news" or nothing. */
  toneWord: string;
  trend?: ReactNode;
  /** The Stat stands on its own, outside a StatGroup: its figure is the whole object (Flat sets it large). */
  alone: boolean;
  className: string;
};

/** Press: a calm warm-stone surface (.litt-raised), the label quiet along the top, and the figure standing directly on it with no raised button box. */
function PressBody({ label, figure, unit, delta, toneClass, toneWord, trend, className }: StatBodyProps) {
  return (
    <div
      data-body="press"
      data-part="surface"
      className={"litt-raised flex h-full min-w-0 flex-col gap-1.5 rounded-surface p-4 forced-colors:border @min-[48rem]:p-5 " + className}
    >
      <dt data-part="lettering" className="text-small text-fg-subtle">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-1.5">
        <span data-part="lettering" className="text-figure tabular-nums text-fg">
          {figure}
          {unit && <span className="font-normal text-fg-subtle">{unit}</span>}
        </span>
        {delta && (
          <span data-part="lettering" className={"text-caption font-normal " + toneClass}>
            {delta}
            <span className="sr-only">{toneWord}</span>
          </span>
        )}
        {trend ? <div className="mt-auto pt-3">{trend}</div> : null}
      </dd>
    </div>
  );
}

/** One number tile. Put it in a StatGroup, or on its own. */
export function Stat({ label, value, unit, delta, tone = "neutral", trend, className = "" }: StatProps) {
  const grouped = useContext(InGroup);
  /* Fun mode: a number counts with the pen. Its digits are hidden from screen readers while they move. */
  const fun = useFun();
  const numeric = typeof value === "number";
  const counted = useFunValue(numeric ? value : 0, { kind: "draw" });
  const Body = byWorld(useMaterial(), { press: PressBody, flat: StatFlatBody, device: StatDeviceBody, rack: StatRackBody, heat: StatHeatBody });
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
    <Body label={label} value={value} figure={figure} unit={unit} delta={delta} toneClass={TONE[tone]} toneWord={TONE_WORD[tone]} trend={trend} alone={!grouped} className={className} />
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
