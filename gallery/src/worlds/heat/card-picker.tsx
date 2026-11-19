/**
 * Card picker, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): flat square dark slabs in 1px lines,
 * with four 8px amber corner brackets and an amber check badge framing the picked card.
 *
 * - Square corners (`rounded-none`), zero cast, instant cut.
 * - Unpicked cards sit in `--surface-1` inside a 1px `--line` border, stepping to `--block` on hover; picked cards step
 *   to `--block` with `--line-strong`, four 8px amber corner brackets (`--accent-text`), and a crisp square check badge
 *   in the top-right corner. Never an accent background fill (R6).
 * - Disabled lies flat on `--surface-2` with `--line` and `--fg-disabled`; errors switch the border to `--danger`.
 * - Forced colors keeps borders on every card and Highlight on the picked badge and outline.
 */
import { CheckIcon } from "@/components/icons";
import type { CardPickerBodyProps, CardPickerSize } from "@/components/card-picker";

const SIZES: Record<CardPickerSize, { tray: string; plate: string; key: string }> = {
  sm: {
    tray: "grid grid-flow-col auto-cols-fr gap-1",
    plate: "grid min-w-0 justify-items-center gap-2 px-1 py-3 text-caption",
    key: "top-1 right-1",
  },
  lg: {
    tray: "grid grid-cols-1 auto-rows-fr gap-2",
    plate: "flex min-h-16 min-w-0 items-start gap-3 p-4 pr-11 text-left",
    key: "top-3 right-3",
  },
};

const brackets =
  "pointer-events-none absolute inset-0 z-1 bg-no-repeat text-accent-text " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const standing = "border-line bg-surface-1 hover:border-line-strong hover:bg-block enabled:pointer-coarse:active:bg-block forced-colors:border";
const danger = "border-danger bg-surface-1 hover:bg-block forced-colors:border";
const picked = "border-line-strong bg-block forced-colors:border-2 forced-colors:border-[Highlight]";
const flat = "border-line bg-surface-2 forced-colors:border";

/** Heat, the slabs: flat square dark cards framed in four 8px amber corner brackets when picked. */
export function CardPickerHeatBody({ legend, hideLegend, disabled, className, name, size, required, invalid, note, noteId, arrange, cards, pictures, pick }: CardPickerBodyProps) {
  const look = SIZES[size];
  const tray = (
    <div className={look.tray + (size === "lg" ? " " + arrange.tray : "")}>
      {cards.map(({ option: o, picked: on, off, id, described }) => (
        <label
          key={o.value}
          className={
            "relative select-none rounded-none border transition-colors duration-(--dur-instant) ease-litt " +
            look.plate + (size === "lg" ? " " + arrange.card : "") + " " +
            "[-webkit-tap-highlight-color:transparent] " +
            (off ? "cursor-not-allowed text-fg-disabled " + flat : "cursor-pointer " + (on ? "text-accent-text " + picked : "text-fg-subtle hover:text-fg " + (invalid ? danger : standing)))
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
          {on && !off && <span aria-hidden="true" className={brackets} />}
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
                <span id={`${id}-label`} className={"text-body font-title " + (off ? "text-fg-disabled" : on ? "text-accent-text" : "text-fg")}>
                  {o.label}
                </span>
                {o.description && (
                  <span id={`${id}-description`} className="text-small text-fg-subtle">
                    {o.description}
                  </span>
                )}
              </span>
              {o.detail && (
                <span id={`${id}-detail`} className={"relative z-1 shrink-0 text-body font-title tabular-nums " + arrange.detail + (off ? " text-fg-disabled" : on ? " text-accent-text" : " text-fg")}>
                  {o.detail}
                </span>
              )}
            </>
          )}
          {on && (
            <span
              aria-hidden="true"
              className={"pointer-events-none absolute z-1 grid size-5 place-items-center rounded-none border border-line-strong bg-canvas text-accent-text forced-colors:border forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] " + look.key}
            >
              <CheckIcon className="size-3.5" />
            </span>
          )}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-1 rounded-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
          />
        </label>
      ))}
    </div>
  );
  return (
    <fieldset data-body="heat" disabled={disabled} aria-describedby={note ? noteId : undefined} className={"m-0 min-w-0 border-0 p-0 " + className}>
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
