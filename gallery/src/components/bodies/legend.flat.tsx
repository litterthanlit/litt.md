/**
 * Legend, the Flat body (proposals/worlds.md, Bodies): today's row of toggles, lifted out of the part unchanged.
 */
import type { LegendBodyProps, LegendHue } from "../legend";

const MARK: Record<LegendHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};
const TRACK = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]";
const LINE: Record<LegendHue, string> = {
  blue: "stroke-data-blue",
  amber: "stroke-data-amber",
  teal: "stroke-data-teal",
  violet: "stroke-data-violet",
  rose: "stroke-data-rose",
};
const LINE_TRACK = "stroke-[color-mix(in_oklab,var(--fg)_12%,transparent)]";
const DASH: Partial<Record<LegendHue, string>> = { teal: "5 2", violet: "2 2", rose: "6 2 2 2" };

const base =
  "inline-flex h-control-sm shrink-0 items-center gap-2 rounded-control px-2 whitespace-nowrap select-none " +
  "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
  "pointer-coarse:h-control-md " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
const live =
  "cursor-pointer hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]";

/** Flat: the row of toggles. */
export function LegendFlatBody({ label, items, lines, className, noteId, note, press, keyDown }: LegendBodyProps) {
  return (
    <div data-body="flat" role="group" aria-label={label} className={"flex flex-wrap gap-x-1 gap-y-1 " + className}>
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
            className={base + " " + (last ? "cursor-default" : live)}
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
        {note}
      </span>
    </div>
  );
}
