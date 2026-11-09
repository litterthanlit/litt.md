/**
 * Card picker, the Flat body (proposals/worlds.md, Bodies; material.md, 7): pictures and words on the page. There is no
 * tray and no card: an option is its picture over or beside its words, in --fg-muted, set apart by its own padding,
 * and the hit areas touch, so a pointer never lands between two. The one you chose sits in a grey bubble (--block, at
 * the surface radius) with an ink tick (--fg) and its word stepped up to --fg. The bubble glides to the pick. Grey means
 * chosen, so an unpicked option has no ground until a hand is on it, and then it takes a grey wash.
 * Forced colors gives the bubble a real border, the only edge, since there is no tray to keep.
 */
import { LayoutGroup, motion } from "motion/react";
import { CheckIcon } from "@/components/icons";
import type { CardPickerBodyProps, CardPickerSize } from "../card-picker";

/* A hand on an unpicked option: a grey wash (fg 6%, color only), and the word steps up to --fg. */
const WASH = "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg active:bg-[color-mix(in_oklab,var(--fg)_10%,transparent)] active:text-fg";

const SIZES: Record<CardPickerSize, { tray: string; card: string }> = {
  sm: {
    tray: "grid grid-flow-col auto-cols-fr",
    card: "grid min-w-0 justify-items-center gap-2 px-1 pt-3 pb-2.5 text-caption font-title",
  },
  lg: {
    tray: "grid grid-cols-1 auto-rows-fr",
    card: "flex min-h-16 min-w-0 items-start gap-3 p-4 text-left",
  },
};

/** Flat, pictures and words, the pick in a grey bubble with an ink tick. */
export function CardPickerFlatBody({ legend, hideLegend, disabled, className, name, size, required, invalid, note, noteId, groupId, arrange, cards, pictures, glide, pick }: CardPickerBodyProps) {
  const look = SIZES[size];
  const tray = (
    <div className={look.tray + (size === "lg" ? " " + arrange.tray : "")}>
      {cards.map(({ option: o, picked, off, id, described }) => (
        <label
          key={o.value}
          className={
            "relative select-none rounded-surface " + look.card + (size === "lg" ? " " + arrange.card : "") + " " +
            "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
            (off
              ? "cursor-not-allowed " + (picked ? "text-fg-subtle" : "text-fg-disabled")
              : "cursor-pointer " + (picked ? "text-fg" : "text-fg-muted " + WASH))
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
              layoutId="card-picker-bubble"
              transition={glide}
              aria-hidden="true"
              className={"absolute inset-0 rounded-surface forced-colors:border-2 " + (off ? "bg-surface-2" : "bg-block")}
            />
          )}
          {size === "sm" ? (
            <>
              <span aria-hidden="true" className="relative z-1 grid h-8 w-full place-items-center">
                {o.picture}
              </span>
              <span className="litt-trim relative z-1 max-w-full">{o.label}</span>
              {/* The tick: ink, in the bubble's corner. Decoration, since the radio says it is checked. */}
              {picked && <CheckIcon className="absolute top-2 right-2 z-1" />}
            </>
          ) : (
            <>
              {pictures && (
                <span aria-hidden="true" className="relative z-1 grid min-h-6 min-w-6 shrink-0 items-center justify-items-start">
                  {o.picture}
                </span>
              )}
              <span className="relative z-1 grid min-w-0 flex-1 gap-1">
                <span id={`${id}-label`} className={"flex items-center gap-2 text-body font-title " + (off ? "text-fg-disabled" : picked ? "text-fg" : "text-inherit")}>
                  <span className="min-w-0">{o.label}</span>
                  {picked && <CheckIcon className="shrink-0" />}
                </span>
                {o.description && (
                  <span id={`${id}-description`} className="text-small text-fg-subtle">
                    {o.description}
                  </span>
                )}
              </span>
              {o.detail && (
                <span id={`${id}-detail`} className={"relative z-1 shrink-0 text-body font-title tabular-nums " + arrange.detail + (off ? " text-fg-disabled" : picked ? " text-fg" : " text-inherit")}>
                  {o.detail}
                </span>
              )}
            </>
          )}
          {/* The words and the ring sit above the bubble (z-1), so it never covers them while it glides. */}
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
