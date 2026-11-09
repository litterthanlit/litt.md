/**
 * Legend, the Device body (proposals/worlds.md, Bodies; material.md, 8): a bank of latching keys, one per series.
 *
 * - One well (--tray, --tray-shade) holds the keys, wrapping as a row of keys does. A key is --block on --key-lift,
 *   its corners the well's less its 2px inset, with 2px of the well left under it for its skirt. Its legend is the
 *   series' name, engraved (litt-legend, --engrave) in the mono (font-field) at the title weight, then the optional
 *   reading in the glass's ink.
 * - Latching: a shown series is a key down: sunk the whole --press-depth (2px) onto its skirt, its face a step darker
 *   (--block mixed 55% toward --tray) and inset-shaded with --tray-shade, its lamp lit. A hidden series is a key
 *   standing up, its lamp a dim ring and its word a step down. The word never changes, so the state is said by
 *   aria-pressed and by the key's height, not by the lamp alone.
 * - Lamps carry the data (R7): a lit lamp is in its series' data hue, the same hue the chart draws it in, and a dim one
 *   is the ring in --fg-disabled. With `lines` the lamp is the 12 by 4px rail cut as the chart dashes the line, so a
 *   series is never told by color alone (WCAG 1.4.1).
 * - The last shown key cannot be let up: it stays down, with aria-disabled and the hidden note.
 * - Motion: nothing glides. A key switches in place in three steps on the instant tier (100ms); reduced motion zeroes
 *   the tier, so it switches at once.
 * - Forced colors gives the well and each key a real border, a lit lamp is a system highlight and a dim one an outline.
 */
import type { CSSProperties } from "react";
import type { LegendBodyProps, LegendHue } from "../legend";

/* The detent: a key changes in three steps on the instant tier, never a glide. */
const STEPS = "steps(3, end)";
const detent: CSSProperties = {
  transitionProperty: "transform, color, box-shadow, background-color",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: `${STEPS}, ${STEPS}, ${STEPS}, ${STEPS}`,
};

/* A lit lamp in its series' hue (literal classes, so Tailwind sees them and the registry renames them). */
const LAMP: Record<LegendHue, string> = {
  blue: "bg-data-blue shadow-[0_0_6px_var(--data-blue)]",
  amber: "bg-data-amber shadow-[0_0_6px_var(--data-amber)]",
  teal: "bg-data-teal shadow-[0_0_6px_var(--data-teal)]",
  violet: "bg-data-violet shadow-[0_0_6px_var(--data-violet)]",
  rose: "bg-data-rose shadow-[0_0_6px_var(--data-rose)]",
};
const LINE: Record<LegendHue, string> = {
  blue: "stroke-data-blue",
  amber: "stroke-data-amber",
  teal: "stroke-data-teal",
  violet: "stroke-data-violet",
  rose: "stroke-data-rose",
};
const LINE_OFF = "stroke-fg-disabled";
const DASH: Partial<Record<LegendHue, string>> = { teal: "5 2", violet: "2 2", rose: "6 2 2 2" };

const up = "bg-block text-fg-subtle shadow-(--key-lift)";
const down = "bg-[color-mix(in_oklab,var(--block),var(--tray)_55%)] text-fg shadow-(--tray-shade) [transform:translateY(var(--press-depth))]";
const held =
  "hover:text-fg active:text-fg active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))]";

/** Device: a bank of latching keys, a shown series down with its lamp lit in its hue. */
export function LegendDeviceBody({ label, items, lines, className, noteId, note, press, keyDown }: LegendBodyProps) {
  return (
    <div
      data-body="device"
      role="group"
      aria-label={label}
      className={
        "flex w-fit max-w-full flex-wrap items-start gap-0.5 overflow-hidden rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border " + className
      }
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
            style={detent}
            className={
              "litt-target relative inline-flex h-9.5 grow items-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] px-2.5 font-field font-title text-caption litt-legend " +
              "whitespace-nowrap select-none [-webkit-tap-highlight-color:transparent] forced-colors:border " +
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
              (shown ? down + (last ? " cursor-default forced-colors:border-2" : " cursor-pointer forced-colors:border-2") : up + " cursor-pointer " + held)
            }
            onClick={(e) => press(e, item.name)}
            onKeyDown={(e) => keyDown(e, item.name)}
          >
            {lines && DASH[hue] ? (
              <svg width={12} height={4} aria-hidden="true" focusable="false" className="shrink-0 forced-colors:stroke-[CanvasText]">
                <line x1={0} x2={12} y1={2} y2={2} strokeWidth={4} strokeDasharray={DASH[hue]} className={shown ? LINE[hue] : LINE_OFF} />
              </svg>
            ) : (
              <span
                aria-hidden="true"
                className={
                  "size-1.5 shrink-0 rounded-pill forced-colors:border " +
                  (shown ? LAMP[hue] + " forced-colors:bg-[Highlight]" : "shadow-[inset_0_0_0_1px_var(--fg-disabled)] forced-colors:bg-transparent")
                }
              />
            )}
            <span className="litt-trim">{item.name}</span>
            {item.value !== undefined && <span className="litt-trim font-normal tabular-nums text-fg-subtle">{item.value}</span>}
          </button>
        );
      })}
      <span id={noteId} className="sr-only">
        {note}
      </span>
    </div>
  );
}
