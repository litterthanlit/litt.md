/**
 * Legend, the Flat body (proposals/worlds.md, Bodies): series are words with a hue dot, ink on paper.
 *
 * - No tray, no block, no fill at rest. Each series is its name in ink at the title weight, a 10px dot before it in the
 *   series' hue (R7, where the color carries the data), set in a pill whose hit area touches its neighbours', so space
 *   does the dividing and a pointer never lands between two. Under the hand the pill takes a grey bubble (fg 6%).
 * - Ink means on, an outline means off: a shown series is a filled dot and its word in --fg; a hidden one is the dot as
 *   an outline in --fg-subtle (the same 10px, a 2px border either way) and its word in --fg-subtle, so only color
 *   changes, on the instant tier, and the weight never does. The reading after the name is --fg-subtle caption.
 * - With `lines` the dot is the 12px rail cut as the chart dashes the line (never color alone, WCAG 1.4.1); hidden, it
 *   is the same dashes drawn thin.
 * - The last shown series cannot be hidden: aria-disabled and the hidden note, and it keeps its tab stop. Focus is the
 *   house ring, 2px out. Forced colors gives the hidden dot a real border.
 */
import type { LegendBodyProps, LegendHue } from "../legend";

const MARK: Record<LegendHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};
const LINE: Record<LegendHue, string> = {
  blue: "stroke-data-blue",
  amber: "stroke-data-amber",
  teal: "stroke-data-teal",
  violet: "stroke-data-violet",
  rose: "stroke-data-rose",
};
const DASH: Partial<Record<LegendHue, string>> = { teal: "5 2", violet: "2 2", rose: "6 2 2 2" };

/** Flat: words with a hue dot, a hidden one grey with an outline dot. */
export function LegendFlatBody({ label, items, lines, className, noteId, note, press, keyDown }: LegendBodyProps) {
  return (
    <div data-body="flat" role="group" aria-label={label} className={"flex flex-wrap " + className}>
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
              "litt-target inline-flex h-control-sm shrink-0 items-center gap-2 rounded-pill px-3 whitespace-nowrap select-none font-title " +
              "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] pointer-coarse:h-control-md " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
              (last
                ? "cursor-default"
                : "cursor-pointer hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]")
            }
            onClick={(e) => press(e, item.name)}
            onKeyDown={(e) => keyDown(e, item.name)}
          >
            {lines && DASH[hue] ? (
              <svg width={12} height={10} aria-hidden="true" focusable="false" className="shrink-0">
                <line
                  x1={0}
                  x2={12}
                  y1={5}
                  y2={5}
                  strokeWidth={shown ? 4 : 1}
                  strokeDasharray={DASH[hue]}
                  className={"transition-colors duration-(--dur-instant) ease-litt " + (shown ? LINE[hue] : "stroke-fg-subtle")}
                />
              </svg>
            ) : (
              <span
                aria-hidden="true"
                className={
                  "size-2.5 shrink-0 rounded-pill border-2 transition-colors duration-(--dur-instant) ease-litt forced-colors:border-[CanvasText] " +
                  (shown ? "border-transparent " + MARK[hue] : "border-fg-subtle bg-transparent")
                }
              />
            )}
            <span className={"litt-trim text-small transition-colors duration-(--dur-instant) ease-litt " + (shown ? "text-fg" : "text-fg-subtle")}>
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
