/**
 * Legend: toggles which series a chart shows. The Legend filters, the chart draws (growth step, decision 4). It
 * holds which series are hidden and draws nothing else; the page passes the shown series to any chart, a table, or
 * both, so one Legend can drive several views.
 *
 * - Anatomy: a wrapping row of toggle buttons in a `role="group"` named by `label`. Each is a swatch (a 12 by 4px
 *   rail at the control radius, the Breakdown legend's swatch) in the hue's mark tone, the name (small, `--fg`), and
 *   an optional reading after it (caption, `--fg-subtle`, tabular), such as a total. With `lines`, for a LineChart,
 *   the rail is cut as the chart dashes the line (teal dashed, violet dotted, rose dash-dotted), so a series is never
 *   told by color alone (WCAG 1.4.1); blue and amber, solid lines, keep the plain rail.
 * - Hues: assigned exactly as the Chart's `paints(series, true)` does with `hues` on, so a Legend and a BarChart or
 *   LineChart given the same list always agree: an item with `hue` keeps it, and every item without one takes the
 *   next hue in the fixed order (blue, amber, teal, violet, rose), counting only items without one. The order comes
 *   from the full list, never the shown one, so hiding a series never repaints the others. A chart counts only the
 *   series it is given, so pass it the shown series with their hues pinned: `legendHues(items)` gives each name its
 *   hue. Five items at most, as in the Chart: past five the order would start again.
 * - States (R8, state without shift): shown is the hue's swatch and the name in `--fg`, and `aria-pressed="true"`.
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
 * - Bodies (proposals/worlds.md): this file resolves the state once into LegendBodyProps and renders the body the
 *   material picks (byWorld). Press, here, is blocks in a tray: every series is a block in one tray (--tray,
 *   --tray-shade) with its hue chip (the 12 by 4px rail, cut as the chart dashes the line with `lines`) set in the
 *   block's face. A shown series stands: --block on --highlight and --block-lift, its name in --fg. A hidden one
 *   sinks flush with the tray (no block, the bay's own --cut-shade), its chip the Meter's empty track, and says
 *   "Hidden" in words after its name, in the slot the reading uses, so a press never changes the box's size. Under
 *   the hand a block sinks the --press-depth. The tray's floor is darker than the page, so the words on it keep
 *   --fg and --fg-muted, never --fg-subtle. Flat is words with a hue dot; Device is a bank of latching keys, each
 *   lamp in its series' hue (bodies/).
 */
import { useId, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { byWorld, useMaterial } from "@/motion";
import { LegendFlatBody } from "./bodies/legend.flat";
import { LegendDeviceBody } from "./bodies/legend.device";

/** The five data hues, in their fixed order (R7). The same names as the Chart's and the Breakdown's. */
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
const LINE: Record<LegendHue, string> = {
  blue: "stroke-data-blue",
  amber: "stroke-data-amber",
  teal: "stroke-data-teal",
  violet: "stroke-data-violet",
  rose: "stroke-data-rose",
};
const LINE_TRACK = "stroke-[color-mix(in_oklab,var(--fg)_12%,transparent)]";
/** The LineChart's dashes (its HUE_DASH: dashed, dotted, dash-dotted) cut into this swatch's 12 by 4px rail. */
const DASH: Partial<Record<LegendHue, string>> = { teal: "5 2", violet: "2 2", rose: "6 2 2 2" };

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
  /** Cuts each swatch the way the LineChart dashes that hue's line. Set it when the Legend keys a LineChart. */
  lines?: boolean;
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

/** One series as a body draws it: its hue resolved from the whole list, and whether it shows or is the last one standing. */
export type LegendBodyItem = LegendItem & { hue: LegendHue; shown: boolean; last: boolean };

/** What a body gets: the state resolved once. Every body renders the same group of toggle buttons. */
export type LegendBodyProps = {
  label: string;
  items: LegendBodyItem[];
  lines: boolean;
  className: string;
  /** The id of the hidden note the last shown item points at; the body renders the note itself. */
  noteId: string;
  /** The hidden note's words. */
  note: string;
  /** A click: toggles the series, or with Alt solos it. */
  press: (e: MouseEvent<HTMLButtonElement>, name: string) => void;
  /** Alt with Enter solos the series. */
  keyDown: (e: KeyboardEvent<HTMLButtonElement>, name: string) => void;
};


const LEGEND_NOTE = "At least one series stays shown.";

/* A block changes in the instant tier's colors, and sinks by transform: the cast, the face and the travel. */
const flip: CSSProperties = {
  transitionProperty: "transform, color, background-color, box-shadow",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: "var(--ease-out)",
};
/* A block standing in the tray, and a bay with no block in it (hidden): the cut's own shade, flush with the floor. */
const standing = "bg-block text-fg shadow-[var(--highlight),var(--block-lift)]";
const flush = "bg-transparent text-fg shadow-(--cut-shade)";
const handle =
  "hover:bg-[color-mix(in_oklab,var(--block),transparent_55%)] " +
  "active:shadow-[var(--highlight),var(--block-press)] active:[transform:translateY(var(--press-depth))]";

/** Press, blocks in a tray: a shown series is a block with its hue chip, a hidden one sinks flush and says Hidden. */
function PressBody({ label, items, lines, className, noteId, note, press, keyDown }: LegendBodyProps) {
  return (
    <div
      data-body="press"
      role="group"
      aria-label={label}
      className={"flex w-fit max-w-full flex-wrap gap-0.5 overflow-hidden rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border " + className}
    >
      {items.map((item) => {
        const { shown, hue, last } = item;
        return (
          <button
            key={item.name}
            type="button"
            aria-pressed={shown}
            aria-disabled={last || undefined}
            aria-describedby={last ? noteId : undefined}
            aria-keyshortcuts="Alt+Enter"
            style={flip}
            className={
              "litt-target relative inline-flex h-control-sm grow items-center gap-2 rounded-[calc(var(--radius-control)-2px)] px-2.5 " +
              "whitespace-nowrap select-none text-small [-webkit-tap-highlight-color:transparent] pointer-coarse:h-control-md forced-colors:border " +
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
              (shown ? standing : flush + " forced-colors:border-dashed") +
              (last ? " cursor-default" : " cursor-pointer " + handle)
            }
            onClick={(e) => press(e, item.name)}
            onKeyDown={(e) => keyDown(e, item.name)}
          >
            {lines && DASH[hue] ? (
              <svg width={12} height={4} aria-hidden="true" focusable="false" className="shrink-0">
                <line
                  x1={0}
                  x2={12}
                  y1={2}
                  y2={2}
                  strokeWidth={4}
                  strokeDasharray={DASH[hue]}
                  className={"transition-colors duration-(--dur-instant) ease-litt " + (shown ? LINE[hue] : LINE_TRACK)}
                />
              </svg>
            ) : (
              <span
                aria-hidden="true"
                className={"h-1 w-3 shrink-0 rounded-control transition-colors duration-(--dur-instant) ease-litt " + (shown ? MARK[hue] : TRACK)}
              />
            )}
            <span className="litt-trim font-title">{item.name}</span>
            {/* The reading and the word Hidden share one slot, sized to the wider, so a press never moves the block. */}
            <span className="grid text-caption font-normal">
              <span aria-hidden="true" className={"col-start-1 row-start-1 text-fg-muted" + (shown ? " invisible" : "")}>
                <span className="litt-trim">Hidden</span>
              </span>
              {item.value !== undefined && (
                <span className={"col-start-1 row-start-1 justify-self-end tabular-nums text-fg-muted" + (shown ? "" : " invisible")}>
                  <span className="litt-trim">{item.value}</span>
                </span>
              )}
            </span>
          </button>
        );
      })}
      <span id={noteId} className="sr-only">
        {note}
      </span>
    </div>
  );
}

/** A row of toggles, one per series: a hued swatch and the name, pressed while the series shows. */
export function Legend({ label, items, hidden: hiddenProp, defaultHidden = [], onHiddenChange, lines = false, className = "" }: LegendProps) {
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

  const Body = byWorld(useMaterial(), { press: PressBody, flat: LegendFlatBody, device: LegendDeviceBody });

  return (
    <Body
      label={label}
      lines={lines}
      className={className}
      noteId={noteId}
      note={LEGEND_NOTE}
      items={items.map((item) => {
        const shown = isShown(item.name);
        return { ...item, hue: hues[item.name]!, shown, last: shown && shownCount <= 1 };
      })}
      press={(e, name) => (e.altKey ? solo(name) : toggle(name))}
      keyDown={(e, name) => {
        if (e.altKey && e.key === "Enter") {
          e.preventDefault();
          solo(name);
        }
      }}
    />
  );
}
