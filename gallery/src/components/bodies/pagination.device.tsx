/**
 * Pagination, the Device body (proposals/worlds.md, Bodies; material.md, 8): a readout and a row of keys.
 *
 * - The range is a panel: a bezel well (--tray, --tray-shade) holding three panes of LCD glass in seven segments
 *   (Seven-segment), the first row, the last and the total, with TO and OF engraved between them (litt-legend). The
 *   figures are aria-hidden; the range in words stays in the polite live region as hidden text, and the panes all
 *   take the width of the total's digits so the panel never resizes as the page changes.
 * - The keys: Previous and Next are step keys (--block on --key-lift, 2px skirts) at the two ends of a row, their words
 *   engraved. The page numbers are a row of keys in a well between them, in the mono (font-field). The current page is
 *   latched, as the Segmented control's: sunk the whole --press-depth, its face a step darker with --tray-shade. A
 *   disabled step key lies flat (--surface-2, a hairline, --fg-disabled).
 * - Motion: nothing glides. A key sinks and a latch changes in three steps on the instant tier; reduced motion zeroes the tier.
 * - Forced colors gives the wells, the keys and the panes real borders.
 */
import type { CSSProperties } from "react";
import { SevenSegment } from "@/components/seven-segment";
import type { PaginationBodyProps, PaginationEnd } from "../pagination";

/* The detent: the sink, the colors and the cast change in three steps on the instant tier. */
const STEPS = "steps(3, end)";
const flip: CSSProperties = {
  transitionProperty: "transform, color, box-shadow, background-color",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: `${STEPS}, ${STEPS}, ${STEPS}, ${STEPS}`,
};

const WELL = "flex items-center gap-1 rounded-control bg-tray p-1 shadow-(--tray-shade) forced-colors:border";
/* A key's corners: the well's less its 4px inset, so the two stay concentric. */
const KEY_RADIUS = "rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))]";
const KEY =
  "litt-target relative grid h-8 shrink-0 cursor-pointer select-none place-items-center " + KEY_RADIUS + " [-webkit-tap-highlight-color:transparent] " +
  "enabled:bg-block enabled:text-fg enabled:shadow-(--key-lift) enabled:forced-colors:border " +
  "enabled:hover:bg-(--block-hover) enabled:active:shadow-(--block-press) enabled:active:[transform:translateY(var(--press-depth))] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:shadow-[inset_0_0_0_1px_var(--line)] disabled:forced-colors:border " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
/* The chosen page: latched down, a step darker, the well's own cut. */
const LATCHED =
  "bg-[color-mix(in_oklab,var(--block),var(--tray)_55%)] text-fg shadow-(--tray-shade) [transform:translateY(var(--press-depth))] forced-colors:border-2";
const UP = "bg-block text-fg-subtle shadow-(--key-lift) hover:text-fg forced-colors:border";

function Step({ end, word }: { end: PaginationEnd; word: string }) {
  return (
    <button
      ref={end.ref}
      type="button"
      disabled={end.disabled}
      onClick={end.onClick}
      style={flip}
      className={KEY + " px-3 text-caption font-title litt-legend pointer-coarse:h-9"}
    >
      <span className="litt-trim">{word}</span>
    </button>
  );
}

/* A pane's corners are a key's, so they stay concentric with the well. Seven-segment's own radius gives way. */
const PANE = "px-1.5! py-1! rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))]! [font-size:calc(var(--type-caption-size)*0.66)]";

/** One pane of glass: a figure in seven segments, as wide as the total's digits. */
function Pane({ value, digits }: { value: number; digits: number }) {
  return <SevenSegment value={value} digits={digits} className={PANE} />;
}

/** Device, the machine: the range in segments on an LCD panel, step keys at the ends of a row of page keys. */
export function PaginationDeviceBody({ label, className, range, first, last, total, current, count, items, previous, next, onPage }: PaginationBodyProps) {
  const digits = String(total).length;
  return (
    <nav data-body="device" aria-label={label} className={"@container " + className}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p aria-live="polite" aria-atomic="true" className="m-0">
          <span className="sr-only">{range}</span>
          <span aria-hidden="true" className={WELL + " text-fg-subtle"}>
            <Pane value={first} digits={digits} />
            <span className="px-1 text-caption litt-legend">to</span>
            <Pane value={last} digits={digits} />
            <span className="px-1 text-caption litt-legend">of</span>
            <Pane value={total} digits={digits} />
          </span>
        </p>
        <ul className="flex items-center gap-2">
          <li>
            <Step end={previous} word="Previous" />
          </li>
          {count > 1 && (
            <li className="hidden @min-[36rem]:block">
              <ul className={WELL}>
                {items.map((n, i) =>
                  n === null ? (
                    <li key={`gap-${i}`} aria-hidden="true" className="grid min-w-5 place-items-center font-field text-caption text-fg-subtle">
                      …
                    </li>
                  ) : (
                    <li key={n} className="flex">
                      <button
                        type="button"
                        aria-current={n === current ? "page" : undefined}
                        aria-label={`Page ${n}`}
                        onClick={() => onPage(n)}
                        style={flip}
                        className={
                          "litt-target relative grid h-6 min-w-7 shrink-0 cursor-pointer select-none place-items-center px-1.5 font-field text-small tabular-nums " +
                          KEY_RADIUS + " [-webkit-tap-highlight-color:transparent] pointer-coarse:h-8 pointer-coarse:min-w-9 " +
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                          (n === current ? LATCHED : UP)
                        }
                      >
                        <span className="litt-trim">{n}</span>
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </li>
          )}
          <li>
            <Step end={next} word="Next" />
          </li>
        </ul>
      </div>
    </nav>
  );
}
