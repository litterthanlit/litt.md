/**
 * Button, Rack's body (proposals/rack.md): a flat key in a 1px outline, as an instrument's buttons are. Nothing casts,
 * glows or sinks, and nothing moves.
 *
 * - Every button is a fill inside the 1px outline of --block-lift, at the control radius, with the label at the title
 *   weight. Secondary is a key in the panel's grey (--block). Primary is the accent fill with --accent-fg words inside
 *   the same outline, the one lit key in a view (R6). Ghost is words alone, with no fill and no outline until the hand
 *   is over it. Danger is the key with its words in --danger; in a dialog's footer it is the confirm, the one red fill.
 *   Icon-only is a round key, the same fill and outline.
 * - A press answers on the frame: the outline darkens to --block-press and the fill takes a step, and the label stays
 *   where it is. A press shows on a touch screen too, since the finger's press takes the hover fill. Loading keeps the
 *   label mounted at opacity 0 behind the spinner, so the width holds, and does not answer a press.
 * - A disabled button lies flat: --surface-2 with a --line hairline and --fg-disabled words.
 * - Forced colors: a real border, since box-shadow is dropped.
 * - The contract (props, aria-busy, aria-disabled, sizes, label, spinner) is button.tsx's. This file only says what the
 *   key is made of. Fun mode has no sink here, since a Rack key does not move.
 */
import type { ButtonBodyProps, ButtonVariant } from "@/components/button";

const base =
  "litt-target relative inline-flex shrink-0 items-center justify-center gap-control whitespace-nowrap select-none font-title " +
  "cursor-pointer transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
  "[-webkit-tap-highlight-color:transparent] " +
  "disabled:cursor-not-allowed data-loading:cursor-wait " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const press = "enabled:not-data-loading:active:shadow-(--block-press)";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg shadow-(--block-lift) hover:bg-accent-hover forced-colors:border " + press +
    " enabled:not-data-loading:active:bg-accent-hover",
  secondary:
    "bg-block text-fg shadow-(--block-lift) hover:bg-(--block-hover) forced-colors:border " + press +
    " enabled:not-data-loading:active:bg-(--block-hover)",
  ghost:
    "bg-transparent text-fg-muted shadow-none hover:text-fg hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
    "enabled:not-data-loading:active:text-fg enabled:not-data-loading:active:bg-[color-mix(in_oklab,var(--fg)_10%,transparent)]",
  danger:
    "bg-block text-danger shadow-(--block-lift) hover:bg-(--block-hover) forced-colors:border " + press +
    " enabled:not-data-loading:active:bg-(--block-hover) " +
    /* A dialog's confirm. These rules sort after the key's, so they win its ties (hover, press). */
    "in-[[data-dialog-footer]]:enabled:bg-danger in-[[data-dialog-footer]]:enabled:text-danger-fg " +
    "in-[[data-dialog-footer]]:enabled:hover:bg-[color-mix(in_oklab,var(--danger),var(--fg)_10%)] " +
    "in-[[data-dialog-footer]]:enabled:not-data-loading:active:bg-[color-mix(in_oklab,var(--danger),var(--fg)_18%)]",
};

const disabledLook = "disabled:bg-surface-2 disabled:text-fg-disabled disabled:shadow-[inset_0_0_0_1px_var(--line)]";

export function ButtonRackBody({ variant, sizeClass, shapeClass, blockClass, className, children, spinner, loading, rootProps }: ButtonBodyProps) {
  const { style, ...root } = rootProps;
  return (
    <button
      {...root}
      data-body="rack"
      className={[base, sizeClass, variants[variant], disabledLook, shapeClass, blockClass, className].join(" ")}
      style={style}
    >
      {children}
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          {spinner}
        </span>
      )}
    </button>
  );
}
