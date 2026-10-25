/**
 * Legend: toggles which series a chart shows. The Legend filters, the chart draws (growth step, decision 4). It
 * holds which series are hidden and draws nothing else; the page passes the shown series to any chart, a table, or
 * both, so one Legend can drive several views.
 *
 * - Anatomy: a wrapping row of toggle buttons in a `role="group"` named by `label`. Each is a swatch (a 12 by 4px
 *   rail at the control radius, the Breakdown legend's swatch) in the hue's mark tone, the name (small, `--fg`), and
 *   an optional reading after it (caption, `--fg-subtle`, tabular), such as a total.
 * - Hues: assigned exactly as the Chart's `paints(series, true)` does with `hues` on, so a Legend and a BarChart or
 *   LineChart given the same list always agree: an item with `hue` keeps it, and every item without one takes the
 *   next hue in the fixed order (blue, amber, teal, violet, rose), counting only items without one. The order comes
 *   from the full list, never the shown one, so hiding a series never repaints the others. A chart counts only the
 *   series it is given, so pass it the shown series with their hues pinned: `legendHues(items)` gives each name its
 *   hue. Five items at most, as in the Chart: past five the order would start again.
 * - States (P9, state without shift): shown is the hue's swatch and the name in `--fg`, and `aria-pressed="true"`.
 *   Hidden is the swatch as the Meter's track (fg at 12%) and the name in `--fg-subtle`. Only color changes, on the
 *   instant tier: nothing moves, the box never changes size, and the weight stays 400.
 * - Size: `h-control-sm` (32) with 8px of side padding at the control radius, and 44px tall on a coarse pointer.
 *   Hover fills fg 6%. On a coarse pointer a press fills the same fg 6%, as rows do. The OS tap flash is off.
 * - The last shown item cannot be hidden: pressing it does nothing, and while it is the only one shown it carries
 *   `aria-disabled="true"` and a visually hidden note, "At least one series stays shown." It is never natively
 *   disabled, so it keeps its tab stop and its name.
 * - Solo: Alt (Option) with a click, or Alt with Enter, shows only that item. On the item that is already the only
 *   one shown it does nothing, like a plain press.
 * - Keyboard: each item is its own tab stop (they are independent toggles, not a radio group). Space or Enter
 *   toggles, because each is a native button. Focus shows the house `:focus-visible` ring, 2px out.
 * - Motion: none beyond the instant tier's color change.
 */
import { useId, useState, type KeyboardEvent, type MouseEvent } from "react";

/** The five data hues, in their fixed order (P11). The same names as the Chart's and the Breakdown's. */
export type LegendHue = "blue" | "amber" | "teal" | "violet" | "rose";

/** The order an item without a hue takes them in: the Chart's `HUE_ORDER`. */
const HUE_ORDER: LegendHue[] = ["blue", "amber", "teal", "violet", "rose"];

/** A hue's mark tone fills the swatch, as literal classes so Tailwind sees them and the registry can rename them. */
const MARK: Record<LegendHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};
/** A hidden series' swatch: the Meter's track. */
const TRACK = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]";

export type LegendItem = {
  /** The series' name, exactly as the chart's series is named: "Builds". It is the button's text and the key in `hidden`, so keep names unique. */
  name: string;
  /** Pins the series to one of the five data hues. Give the chart's series the same hue, or use `legendHues` to read them. */
  hue?: LegendHue;
  /** A reading shown after the name in tabular figures, such as the series' total: "1,240". Leave it out when the name is enough. */
  value?: string;
};

export type LegendProps = {
  /** Names the group for assistive tech, such as "Series" or "Kinds of build". It is not shown. */
  label: string;
  /** The series, in the chart's order. Five at most. */
  items: LegendItem[];
  /** The names of the hidden series, when you control it. Pair it with `onHiddenChange`. */
  hidden?: string[];
  /** The names hidden at first, when you do not control it. */
  defaultHidden?: string[];
  /** Called with the new list of hidden names each time an item is pressed. Pass the shown series to the chart from it. */
  onHiddenChange?: (hidden: string[]) => void;
  /** Extra classes for the row, such as a bottom margin. */
  className?: string;
};

/**
 * Each item's hue by name, assigned the way the Chart assigns them with `hues`: a set hue is kept, and every item
 * without one takes the next hue in the fixed order. Pin these on the series you pass to a chart, so a series keeps
 * its color when others are hidden.
 */
export function legendHues(items: LegendItem[]): Record<string, LegendHue> {
  let next = 0;
  const out: Record<string, LegendHue> = {};
  for (const item of items) out[item.name] = item.hue ?? HUE_ORDER[next++ % HUE_ORDER.length]!;
  return out;
}

const NOTE = "At least one series stays shown.";

const base =
  "inline-flex h-control-sm shrink-0 items-center gap-2 rounded-control px-2 whitespace-nowrap select-none " +
  "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
  "pointer-coarse:h-control-md " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
/** A press does something: the hover fill, and the same fill held down on a coarse pointer. */
const live =
  "cursor-pointer hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]";

/** A row of toggles, one per series: a hued swatch and the name, pressed while the series shows. */
export function Legend({ label, items, hidden: hiddenProp, defaultHidden = [], onHiddenChange, className = "" }: LegendProps) {
  const noteId = useId();
  const [inner, setInner] = useState<string[]>(defaultHidden);
  const hidden = hiddenProp ?? inner;
  const hues = legendHues(items);
  const isShown = (name: string) => !hidden.includes(name);
  const shownCount = items.filter((item) => isShown(item.name)).length;

  const commit = (next: string[]) => {
    if (hiddenProp === undefined) setInner(next);
    onHiddenChange?.(next);
  };
  const toggle = (name: string) => {
    if (isShown(name)) {
      if (shownCount <= 1) return; // the last one stays
      commit([...hidden, name]);
    } else {
      commit(hidden.filter((n) => n !== name));
    }
  };
  const solo = (name: string) => {
    if (isShown(name) && shownCount <= 1) return;
    /* Keep names the caller hid that are not items, so a shared hidden list is not wiped. */
    const others = hidden.filter((n) => !items.some((item) => item.name === n));
    commit([...others, ...items.map((item) => item.name).filter((n) => n !== name)]);
  };

  return (
    <div role="group" aria-label={label} className={"flex flex-wrap gap-x-1 gap-y-1 " + className}>
      {items.map((item) => {
        const shown = isShown(item.name);
        const last = shown && shownCount <= 1;
        return (
          <button
            key={item.name}
            type="button"
            aria-pressed={shown}
            aria-disabled={last || undefined}
            aria-describedby={last ? noteId : undefined}
            aria-keyshortcuts="Alt+Enter"
            className={base + " " + (last ? "cursor-default" : live)}
            onClick={(e: MouseEvent<HTMLButtonElement>) => (e.altKey ? solo(item.name) : toggle(item.name))}
            onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
              if (e.altKey && e.key === "Enter") {
                e.preventDefault();
                solo(item.name);
              }
            }}
          >
            <span
              aria-hidden="true"
              className={"h-1 w-3 shrink-0 rounded-control transition-colors duration-(--dur-instant) ease-litt " + (shown ? MARK[hues[item.name]!] : TRACK)}
            />
            <span className={"litt-trim text-small transition-colors duration-(--dur-instant) ease-litt " + (shown ? "text-fg" : "text-fg-subtle")}>
              {item.name}
            </span>
            {item.value !== undefined && (
              <span className="litt-trim text-caption font-normal tabular-nums text-fg-subtle">{item.value}</span>
            )}
          </button>
        );
      })}
      <span id={noteId} className="sr-only">
        {NOTE}
      </span>
    </div>
  );
}
