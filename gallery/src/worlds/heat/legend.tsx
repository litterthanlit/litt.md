/**
 * Legend, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a row of sharp square telemetry keys with
 * solid square swatches and amber corner brackets snapping on under hover/focus.
 *
 * - Square keys (`rounded-none`), zero cast; active items show their solid hue swatch (or dashed line when `lines` is
 *   on) and `--fg` title; hidden items show an empty bordered square and `--fg-subtle` title.
 * - Hover and focus snap four 6px amber corner brackets onto toggleable keys.
 */
import type { LegendBodyProps, LegendHue } from "@/components/legend";

const SWATCH: Record<LegendHue, string> = {
  blue: "bg-data-blue border-data-blue",
  amber: "bg-data-amber border-data-amber",
  teal: "bg-data-teal border-data-teal",
  violet: "bg-data-violet border-data-violet",
  rose: "bg-data-rose border-data-rose",
  sky: "bg-data-sky border-data-sky",
  bubblegum: "bg-data-bubblegum border-data-bubblegum",
  sun: "bg-data-sun border-data-sun",
};
const EMPTY = "bg-transparent border-fg-subtle";
const LINE: Record<LegendHue, string> = {
  blue: "stroke-data-blue",
  amber: "stroke-data-amber",
  teal: "stroke-data-teal",
  violet: "stroke-data-violet",
  rose: "stroke-data-rose",
  sky: "stroke-data-sky",
  bubblegum: "stroke-data-bubblegum",
  sun: "stroke-data-sun",
};
const DASH: Partial<Record<LegendHue, string>> = { teal: "5 2", violet: "2 2", rose: "6 2 2 2", sky: "8 2", bubblegum: "4 1 1 1 1 1", sun: "1 1" };

const brackets =
  "pointer-events-none absolute inset-0 opacity-0 bg-no-repeat text-accent-text " +
  "transition-opacity duration-(--dur-instant) ease-litt " +
  "group-hover/leg:opacity-100 group-focus-visible/leg:opacity-100 " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

/** Heat: sharp square telemetry keys with square swatches and amber hover brackets. */
export function LegendHeatBody({ label, items, lines, className, noteId, note, press, keyDown }: LegendBodyProps) {
  return (
    <div data-body="heat" role="group" aria-label={label} className={"flex flex-wrap gap-1 " + className}>
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
            className={
              "group/leg litt-target relative inline-flex h-control-sm shrink-0 items-center gap-2 rounded-none border border-line bg-canvas px-2.5 whitespace-nowrap select-none " +
              "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] pointer-coarse:h-control-md forced-colors:border " +
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
              (last ? "cursor-default" : "cursor-pointer hover:border-line-strong hover:bg-surface-1 pointer-coarse:active:bg-surface-1")
            }
            onClick={(e) => press(e, item.name)}
            onKeyDown={(e) => keyDown(e, item.name)}
          >
            {!last && <span aria-hidden="true" className={brackets} />}
            <span
              aria-hidden="true"
              className={
                "relative flex h-3 w-4 shrink-0 items-center justify-center rounded-none border transition-colors duration-(--dur-instant) ease-litt " +
                (lines && DASH[hue]
                  ? "border-line bg-surface-1"
                  : shown
                    ? SWATCH[hue]
                    : EMPTY + " forced-colors:border-dashed")
              }
            >
              {lines && DASH[hue] && (
                <svg width={14} height={10} aria-hidden="true" focusable="false">
                  <line x1={0} x2={14} y1={5} y2={5} strokeWidth={2} strokeDasharray={DASH[hue]} className={shown ? LINE[hue] : "stroke-fg-subtle"} />
                </svg>
              )}
            </span>
            <span className={"litt-trim text-small font-title transition-colors duration-(--dur-instant) ease-litt " + (shown ? "text-fg" : "text-fg-subtle")}>
              {item.name}
            </span>
            {item.value !== undefined && <span className="litt-trim text-caption font-normal tabular-nums text-fg-subtle">{item.value}</span>}
          </button>
        );
      })}
      <span id={noteId} className="sr-only">
        {note}
      </span>
    </div>
  );
}
