/**
 * Card picker, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): no tray. Each option is a grey card
 * (--surface-3, --space-2 apart, at the surface radius), and the picked one lifts to --surface-1 with a 2px ink ring,
 * which is the block gliding in. The ring is an inset shadow, so forced colors keeps the surface's border.
 */
import { LayoutGroup, motion } from "motion/react";
import type { CardPickerBodyProps, CardPickerSize } from "../card-picker";

/** What a finger holding an unpicked card shows. */
const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

const SIZES: Record<CardPickerSize, { tray: string; card: string }> = {
  sm: {
    tray: "grid grid-flow-col auto-cols-fr gap-2 rounded-surface",
    card: "grid min-w-0 justify-items-center gap-2 px-1 pt-3 pb-2.5 text-caption font-title",
  },
  lg: {
    tray: "grid grid-cols-1 auto-rows-fr gap-2 rounded-surface",
    card: "flex min-h-16 min-w-0 items-start gap-3 p-4 text-left",
  },
};

/** Flat, grey cards with the pick lifted and ringed in ink. */
export function CardPickerFlatBody({ legend, hideLegend, disabled, className, name, size, required, invalid, note, noteId, groupId, arrange, cards, pictures, glide, pick }: CardPickerBodyProps) {
  const look = SIZES[size];
  const tray = (
    <div
      className={
        look.tray +
        " bg-tray forced-colors:border " +
        (invalid ? "shadow-[inset_0_0_0_1px_var(--danger),var(--tray-shade)]" : "shadow-(--tray-shade)") +
        (size === "lg" ? " " + arrange.tray : "")
      }
    >
      {cards.map(({ option: o, picked, off, id, described }) => (
        <label
          key={o.value}
          className={
            "relative select-none " + (picked ? "" : "bg-surface-3 hover:bg-(--block-hover) ") + "rounded-surface " + look.card + (size === "lg" ? " " + arrange.card : "") + " " +
            "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
            (off
              ? "cursor-not-allowed text-fg-disabled"
              : "cursor-pointer " +
                (picked ? "text-fg" : "text-fg-subtle hover:text-fg " + PRESS))
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
          {picked && (
            <motion.span
              layoutId="card-picker-surface"
              transition={glide}
              aria-hidden="true"
              className="absolute inset-0 rounded-surface bg-surface-1 shadow-[inset_0_0_0_2px_var(--fg)] forced-colors:border-2"
            />
          )}
          {size === "sm" ? (
            <>
              <span aria-hidden="true" className="relative z-1 grid h-8 w-full place-items-center">
                {o.picture}
              </span>
              <span className="litt-trim relative z-1 max-w-full">{o.label}</span>
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
          {/* The pictures, the words and the ring sit above the surface (z-1), so it never covers them while it glides. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-1 rounded-surface peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
          />
        </label>
      ))}
    </div>
  );
  return (
    <fieldset data-body="flat" disabled={disabled} aria-describedby={note ? noteId : undefined} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={hideLegend ? "sr-only" : "mb-2 p-0 text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>{legend}</legend>
      <LayoutGroup id={groupId}>{size === "lg" ? <div className="@container">{tray}</div> : tray}</LayoutGroup>
      {note && (
        <p id={noteId} className={"mt-2 text-small " + (invalid ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </fieldset>
  );
}
