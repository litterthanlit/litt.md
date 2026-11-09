/**
 * Card picker, the Device body (proposals/worlds.md, Bodies; material.md, 8): a bank of plates with a lamp each.
 *
 * - One well (--tray, --tray-shade) holds every card, and each card is a key plate on its skirt (--block, --key-lift: a
 *   face, a dark rim and 2px of skirt), at the corner radius of the well less its inset, so the two stay concentric at
 *   every shape. The words are in the mono (font-field); at sm the word under the picture is an engraved legend
 *   (litt-legend, --engrave).
 * - A lamp sits in each plate's corner (lg: the top end; sm: the top middle, over the picture). It is size-1.5 and
 *   round. At lg it stands in from the corner by the card's radius at least, so a round shape never cuts across it.
 *   The picked plate is latched: set down the whole --press-depth (2px) into the well, so its skirt is gone, its face a
 *   step darker (--block mixed 55% toward --tray) and inset-shaded (--tray-shade), and its lamp lit in --fg. The
 *   others stand, their lamp a dim ring. A press on a standing plate sinks it the same 2px before it latches, and
 *   picking one lets the last one up. The words say it too: the radio is checked.
 * - A disabled plate lies flat in the well (--surface-2, a hairline, no skirt) with its lamp dim; its line keeps
 *   --fg-subtle, since it says why.
 * - Nothing glides. The change switches in place in three steps on the instant tier (100ms), as the Switch's detent
 *   does; reduced motion zeroes the tier, so it happens at once.
 * - Forced colors drops shadows and fills, so the well and each plate get real borders, the picked one a 2px one, a lit
 *   lamp is a system highlight and a dim one an outline.
 */
import type { CSSProperties } from "react";
import type { CardPickerBodyProps, CardPickerSize } from "../card-picker";

/* The detent: the sink, the colors and the cast change in three steps on the instant tier. */
const STEPS = "steps(3, end)";
const detent: CSSProperties = {
  transitionProperty: "transform, color, box-shadow, background-color",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: `${STEPS}, ${STEPS}, ${STEPS}, ${STEPS}`,
};

/* A plate standing, a plate down (latched), and a plate lying flat (disabled). */
const up = "bg-block shadow-(--key-lift) active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))]";
const down = "bg-[color-mix(in_oklab,var(--block),var(--tray)_55%)] shadow-(--tray-shade) [transform:translateY(var(--press-depth))] forced-colors:border-2";
const flat = "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";

const SIZES: Record<CardPickerSize, { well: string; plate: string; corner: string; lamp: string }> = {
  sm: {
    well: "grid grid-flow-col auto-cols-fr rounded-control p-0.5",
    plate: "grid min-w-0 justify-items-center gap-2 px-1 pt-4 pb-2.5 text-caption",
    corner: "rounded-[calc(var(--radius-control)-2px)]",
    lamp: "top-1.5 left-1/2 -translate-x-1/2",
  },
  lg: {
    well: "grid grid-cols-1 auto-rows-fr gap-1 rounded-surface p-1",
    plate: "flex min-h-16 min-w-0 items-start gap-3 p-4 pr-9 text-left",
    corner: "rounded-[calc(var(--radius-surface)-4px)]",
    /* On the title's line, in from the right edge by 12px or the card's radius if that is more, so the curve never cuts across it. */
    lamp: "top-[calc(1rem+9px)] right-[max(0.75rem,calc(var(--radius-surface)-4px))]",
  },
};

/** Device, the plates: a bank of plates in a well, each with a lamp, the picked one set down into the well with its lamp lit. */
export function CardPickerDeviceBody({ legend, hideLegend, disabled, className, name, size, required, invalid, note, noteId, arrange, cards, pictures, pick }: CardPickerBodyProps) {
  const look = SIZES[size];
  const well = (
    <div
      className={
        look.well +
        " bg-tray forced-colors:border " +
        (invalid ? "shadow-[inset_0_0_0_1px_var(--danger),var(--tray-shade)]" : "shadow-(--tray-shade)") +
        (size === "lg" ? " " + arrange.tray : "")
      }
    >
      {cards.map(({ option: o, picked, off, id, described }) => (
        <label
          key={o.value}
          style={detent}
          className={
            "relative select-none forced-colors:border " + look.corner + " " + look.plate + (size === "lg" ? " " + arrange.card : "") + " " +
            "[-webkit-tap-highlight-color:transparent] " +
            (off ? "cursor-not-allowed text-fg-disabled " + flat : "cursor-pointer " + (picked ? "text-fg " + down : "text-fg-subtle hover:text-fg " + up))
          }
        >
          <input
            type="radio"
            className="peer sr-only"
            name={name}
            value={o.value}
            checked={picked}
            disabled={o.disabled}
            required={required}
            aria-invalid={invalid ? true : undefined}
            aria-labelledby={size === "lg" ? `${id}-label` : undefined}
            aria-describedby={size === "lg" && described ? described : undefined}
            onChange={() => pick(o.value)}
          />
          {/* The lamp: decoration, so a screen reader hears the radio alone. */}
          <span
            aria-hidden="true"
            style={detent}
            className={
              "pointer-events-none absolute size-1.5 rounded-pill forced-colors:border " + look.lamp + " " +
              (picked && !off ? "bg-fg shadow-[0_0_6px_var(--fg)] forced-colors:bg-[Highlight]" : "shadow-[inset_0_0_0_1px_var(--fg-disabled)]")
            }
          />
          {size === "sm" ? (
            <>
              <span aria-hidden="true" className="relative z-1 grid h-8 w-full place-items-center">
                {o.picture}
              </span>
              <span className="litt-trim litt-legend relative z-1 max-w-full font-field font-title">{o.label}</span>
            </>
          ) : (
            <>
              {pictures && (
                <span aria-hidden="true" className="relative z-1 grid min-h-6 min-w-6 shrink-0 items-center justify-items-start">
                  {o.picture}
                </span>
              )}
              <span className="relative z-1 grid min-w-0 flex-1 gap-1">
                <span id={`${id}-label`} className={"font-field text-body font-title " + (off ? "text-fg-disabled" : "text-fg")}>
                  {o.label}
                </span>
                {o.description && (
                  <span id={`${id}-description`} className="text-small text-fg-subtle">
                    {o.description}
                  </span>
                )}
              </span>
              {o.detail && (
                <span id={`${id}-detail`} className={"relative z-1 shrink-0 font-field text-body font-title tabular-nums " + arrange.detail + (off ? " text-fg-disabled" : " text-fg")}>
                  {o.detail}
                </span>
              )}
            </>
          )}
          <span
            aria-hidden="true"
            className={"pointer-events-none absolute inset-0 z-1 " + look.corner + " peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"}
          />
        </label>
      ))}
    </div>
  );
  return (
    <fieldset data-body="device" disabled={disabled} aria-describedby={note ? noteId : undefined} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={hideLegend ? "sr-only" : "mb-2 p-0 text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>{legend}</legend>
      {size === "lg" ? <div className="@container">{well}</div> : well}
      {note && (
        <p id={noteId} className={"mt-2 text-small " + (invalid ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </fieldset>
  );
}
