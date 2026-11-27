/**
 * Legend, Plain's body (taste v1.23, proposals/plain-studies.md): bare inline words beside a 12px square rule swatch,
 * with hidden series struck through.
 *
 * - No tray, no card frame, no round dots: each series is a square button on the page carrying a 12px rule in its data
 *   hue (`2px` thick when shown, `1px` `--line-strong` when subtracted) and its name in `--fg`.
 * - Subtracting a series turns its word to `--fg-subtle` with a line-through, so shown vs hidden reads immediately
 *   without relying on colour alone (R5, WCAG 1.4.1).
 * - With `lines`, dashed series cut their 12px rule with the LineChart's dash pattern.
 * - Forced colors keeps borders and Highlight cues.
 */
import type { LegendBodyProps, LegendHue } from "@/components/legend";

const MARK: Record<LegendHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
  sky: "bg-data-sky",
  bubblegum: "bg-data-bubblegum",
  sun: "bg-data-sun",
};
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

/** Plain: bare inline series words beside a 12px rule swatch, struck through when subtracted. */
export function LegendPlainBody({ label, items, lines, className, noteId, note, press, keyDown }: LegendBodyProps) {
  return (
    <div data-body="plain" role="group" aria-label={label} className={"-mx-2.5 flex flex-wrap items-center gap-x-1 " + className}>
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
              "litt-target relative inline-flex h-control-sm shrink-0 items-center gap-2 rounded-none px-2.5 whitespace-nowrap select-none " +
              "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] pointer-coarse:h-control-md " +
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
              (last ? "cursor-default" : "cursor-pointer hover:text-fg")
            }
            onClick={(e) => press(e, item.name)}
            onKeyDown={(e) => keyDown(e, item.name)}
          >
            {lines && DASH[hue] ? (
              <svg width={12} height={8} aria-hidden="true" focusable="false" className="shrink-0">
                <line
                  x1={0}
                  x2={12}
                  y1={4}
                  y2={4}
                  strokeWidth={shown ? 2 : 1}
                  strokeDasharray={DASH[hue]}
                  className={"transition-colors duration-(--dur-instant) ease-litt " + (shown ? LINE[hue] : "stroke-line-strong")}
                />
              </svg>
            ) : (
              <span
                aria-hidden="true"
                className={
                  "w-3 shrink-0 rounded-none transition-colors duration-(--dur-instant) ease-litt forced-colors:border forced-colors:border-[CanvasText] " +
                  (shown ? "h-0.5 " + MARK[hue] : "h-px bg-line-strong")
                }
              />
            )}
            <span
              className={
                "litt-trim text-small transition-colors duration-(--dur-instant) ease-litt " +
                (shown ? "font-normal text-fg" : "font-normal text-fg-subtle line-through decoration-line-strong")
              }
            >
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
