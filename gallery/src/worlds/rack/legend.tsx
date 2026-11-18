/**
 * Legend, the Rack body (proposals/rack.md): a row of track names, each with its clip colour beside it.
 *
 * - Each item is a toggle button with a small clip for a swatch: a 16 by 12px block in the series' hue's tint inside a 1px
 *   edge of its mark tone, then the name (small, --fg) and the reading (caption, tabular, --fg-subtle). Items touch, so
 *   no pointer lands between two (the hit area has no gap); a hover fills the ink at 8%, on the instant tier.
 * - A hidden series is its swatch as an empty outline (no tint, the edge in --fg-subtle) and its name in --fg-subtle, so only
 *   colour changes: the box never changes size and the weight stays put. aria-pressed says the state.
 * - With `lines` the swatch holds the chart's dash, drawn as a 2px line in the mark tone across the clip (never colour
 *   alone, WCAG 1.4.1); hidden, the same dashes in --fg-subtle.
 * - The last shown item cannot be hidden: aria-disabled, the hidden note, and it keeps its tab stop. Focus is the house
 *   ring, 2px out. Forced colors gives the swatch a real border and the hidden one a dashed border.
 */
import type { LegendBodyProps, LegendHue } from "@/components/legend";

/* A shown swatch: the hue's tint inside its mark edge. A hidden one is an empty outline. Literal classes, so Tailwind sees them. */
const CLIP: Record<LegendHue, string> = {
  blue: "bg-data-blue-tint border-data-blue",
  amber: "bg-data-amber-tint border-data-amber",
  teal: "bg-data-teal-tint border-data-teal",
  violet: "bg-data-violet-tint border-data-violet",
  rose: "bg-data-rose-tint border-data-rose",
  sky: "bg-data-sky-tint border-data-sky",
  bubblegum: "bg-data-bubblegum-tint border-data-bubblegum",
  sun: "bg-data-sun-tint border-data-sun",
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

/** Rack: a small clip beside each name, a hidden one an empty outline. */
export function LegendRackBody({ label, items, lines, className, noteId, note, press, keyDown }: LegendBodyProps) {
  return (
    <div data-body="rack" role="group" aria-label={label} className={"flex flex-wrap " + className}>
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
              "litt-target inline-flex h-control-sm shrink-0 items-center gap-2 rounded-control px-2.5 whitespace-nowrap select-none " +
              "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] pointer-coarse:h-control-md " +
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
              (last
                ? "cursor-default"
                : "cursor-pointer hover:bg-[color-mix(in_oklab,var(--fg)_8%,transparent)] pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]")
            }
            onClick={(e) => press(e, item.name)}
            onKeyDown={(e) => keyDown(e, item.name)}
          >
            <span
              aria-hidden="true"
              className={
                "relative h-3 w-4 shrink-0 rounded-control border transition-colors duration-(--dur-instant) ease-litt " +
                (shown ? CLIP[hue] : EMPTY + " forced-colors:border-dashed")
              }
            >
              {lines && DASH[hue] && (
                <svg width={14} height={10} aria-hidden="true" focusable="false" className="absolute top-0 left-0">
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
