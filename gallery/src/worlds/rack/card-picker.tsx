/**
 * Card picker, the Rack body (proposals/rack.md): cards as flat panels in 1px outlines, the picked one outlined in the ink.
 *
 * - No tray. Each card is its own panel (--block with --block-lift's 1px outline) at the surface radius (the control
 *   radius at sm), a hair apart (8px at lg, 4px at sm). They stand level with the page: nothing is raised or seated, and
 *   under the hand a card takes a lighter grey (--block-hover), on the frame. Words are in the ink at the title
 *   weight, the line and the picture's colour --fg-subtle.
 * - Picked: the outline becomes 2px in the ink (--fg), the words step up to --fg, and a small lit key sits in the card's
 *   top end: a 20px square in the ink holding a canvas check. The check is never the only sign, since the radio is checked
 *   and the outline says it too. Never an accent fill (R6).
 * - A disabled card lies flat (--surface-2, a --line hairline) with its words in --fg-disabled, its line keeping
 *   --fg-subtle, since it says why. An error outlines every card in the danger colour.
 * - Nothing glides, grows or bounces; the outline and the colours change on the frame (the instant tier).
 * - Forced colors drops shadows, so every card gets a real border, the picked one a 2px Highlight one, and the key a border.
 */
import { CheckIcon } from "@/components/icons";
import type { CardPickerBodyProps, CardPickerSize } from "@/components/card-picker";

const SIZES: Record<CardPickerSize, { tray: string; plate: string; corner: string; key: string }> = {
  sm: {
    tray: "grid grid-flow-col auto-cols-fr gap-1",
    plate: "grid min-w-0 justify-items-center gap-2 px-1 py-3 text-caption",
    corner: "rounded-control",
    key: "top-1 right-1",
  },
  lg: {
    tray: "grid grid-cols-1 auto-rows-fr gap-2",
    plate: "flex min-h-16 min-w-0 items-start gap-3 p-4 pr-11 text-left",
    corner: "rounded-surface",
    key: "top-3 right-3",
  },
};

/* A panel standing, picked, and lying flat; the danger outline replaces the standing one under an error. Each its own string. */
const standing = "forced-colors:border bg-block shadow-(--block-lift) hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover)";
const danger = "forced-colors:border bg-block shadow-[inset_0_0_0_1px_var(--danger)] hover:bg-(--block-hover)";
const picked = "bg-block shadow-[inset_0_0_0_2px_var(--fg)] forced-colors:border-2 forced-colors:border-[Highlight]";
const flat = "forced-colors:border bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";

/** Rack, the panels: each card a flat panel in an outline, the picked one outlined 2px in the ink with a lit check key. */
export function CardPickerRackBody({ legend, hideLegend, disabled, className, name, size, required, invalid, note, noteId, arrange, cards, pictures, pick }: CardPickerBodyProps) {
  const look = SIZES[size];
  const tray = (
    <div className={look.tray + (size === "lg" ? " " + arrange.tray : "")}>
      {cards.map(({ option: o, picked: on, off, id, described }) => (
        <label
          key={o.value}
          className={
            "relative select-none transition-colors duration-(--dur-instant) ease-litt " +
            look.corner + " " + look.plate + (size === "lg" ? " " + arrange.card : "") + " " +
            "[-webkit-tap-highlight-color:transparent] " +
            (off ? "cursor-not-allowed text-fg-disabled " + flat : "cursor-pointer " + (on ? "text-fg " + picked : "text-fg-subtle hover:text-fg " + (invalid ? danger : standing)))
          }
        >
          <input
            type="radio"
            className="peer sr-only"
            name={name}
            value={o.value}
            checked={on}
            disabled={o.disabled}
            required={required}
            aria-invalid={invalid ? true : undefined}
            aria-labelledby={size === "lg" ? `${id}-label` : undefined}
            aria-describedby={size === "lg" && described ? described : undefined}
            onChange={() => pick(o.value)}
          />
          {size === "sm" ? (
            <>
              <span aria-hidden="true" className="relative z-1 grid h-8 w-full place-items-center">
                {o.picture}
              </span>
              <span className="litt-trim relative z-1 max-w-full font-title">{o.label}</span>
            </>
          ) : (
            <>
              {pictures && (
                <span aria-hidden="true" className="relative z-1 grid min-h-6 min-w-6 shrink-0 items-center justify-items-start">
                  {o.picture}
                </span>
              )}
              <span className="relative z-1 grid min-w-0 flex-1 gap-1">
                <span id={`${id}-label`} className={"text-body font-title " + (off ? "text-fg-disabled" : "text-fg")}>
                  {o.label}
                </span>
                {o.description && (
                  <span id={`${id}-description`} className="text-small text-fg-subtle">
                    {o.description}
                  </span>
                )}
              </span>
              {o.detail && (
                <span id={`${id}-detail`} className={"relative z-1 shrink-0 text-body font-title tabular-nums " + arrange.detail + (off ? " text-fg-disabled" : " text-fg")}>
                  {o.detail}
                </span>
              )}
            </>
          )}
          {/* The lit key: decoration, since the radio says it is checked and the outline says it too. */}
          {on && (
            <span
              aria-hidden="true"
              className={"pointer-events-none absolute z-1 grid size-5 place-items-center rounded-none bg-fg text-canvas forced-colors:border forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] " + look.key}
            >
              <CheckIcon className="size-3.5" />
            </span>
          )}
          <span
            aria-hidden="true"
            className={"pointer-events-none absolute inset-0 z-1 " + look.corner + " peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"}
          />
        </label>
      ))}
    </div>
  );
  return (
    <fieldset data-body="rack" disabled={disabled} aria-describedby={note ? noteId : undefined} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={hideLegend ? "sr-only" : "mb-2 p-0 text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>{legend}</legend>
      {size === "lg" ? <div className="@container">{tray}</div> : tray}
      {note && (
        <p id={noteId} className={"mt-2 text-small " + (invalid ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </fieldset>
  );
}
