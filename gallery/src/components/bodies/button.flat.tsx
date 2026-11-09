/**
 * Button, Flat's body (proposals/worlds.md, Bodies; proposals/flat-pill.md): a pill drawn by fill alone. Nothing casts,
 * catches the light or keeps a hairline, so the press shows in the fill: a step darker under the hand (hover, and the
 * finger's press on a touch screen).
 *
 * - Every button takes the control radius, which Flat opens at the pill (the one shape for what a hand touches), and
 *   follows a shape the Customize panel asks for. Primary is an ink pill (the accent fill where an accent is set), a step softer under the hand, with no
 *   glow and no highlight (Flat has no light, R2). Secondary is a grey pill (--block is --surface-3 under Flat),
 *   icon-only a grey circle. Ghost is words alone: no fill, even under the hand, which only brings the words to --fg.
 *   Danger is the grey pill with red words; in a dialog's footer it is the confirm, the one red fill.
 * - A disabled button is a grey fill with --fg-disabled words and no hairline.
 * - The contract (props, aria-busy, aria-disabled, sizes, label, spinner) is button.tsx's. This file only says what the
 *   pill is made of. Fun mode's deeper sink still applies, since it is a movement and not a look.
 */
import type { ButtonBodyProps, ButtonVariant } from "../button";

const base =
  "litt-target relative inline-flex shrink-0 items-center justify-center gap-control whitespace-nowrap select-none font-title " +
  "cursor-pointer transition-[background-color,color,translate] duration-(--dur-instant) ease-litt " +
  "[-webkit-tap-highlight-color:transparent] " +
  "active:translate-y-(--press-depth) disabled:cursor-not-allowed disabled:active:translate-y-0 " +
  "data-loading:cursor-wait data-loading:active:translate-y-0 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover enabled:pointer-coarse:active:bg-accent-hover",
  secondary: "bg-block text-fg forced-colors:border hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover)",
  ghost: "bg-transparent text-fg-muted hover:text-fg enabled:pointer-coarse:active:text-fg",
  danger:
    "bg-block text-danger forced-colors:border hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover) " +
    /* A dialog's confirm. These rules sort after the pill's, so they win its ties (hover, a finger's press). */
    "in-[[data-dialog-footer]]:enabled:bg-danger in-[[data-dialog-footer]]:enabled:text-danger-fg " +
    "in-[[data-dialog-footer]]:enabled:hover:bg-[color-mix(in_oklab,var(--danger),var(--fg)_10%)] " +
    "in-[[data-dialog-footer]]:enabled:pointer-coarse:active:bg-[color-mix(in_oklab,var(--danger),var(--fg)_10%)]",
};

const disabledLook = "disabled:bg-surface-3 disabled:text-fg-disabled disabled:shadow-none disabled:inset-shadow-none";

export function ButtonFlatBody({ variant, sizeClass, shapeClass, blockClass, className, fun, children, spinner, loading, rootProps }: ButtonBodyProps) {
  const { style, ...root } = rootProps;
  return (
    <button
      {...root}
      data-body="flat"
      className={[base, sizeClass, variants[variant], disabledLook, shapeClass, blockClass, className].join(" ")}
      style={fun ? { ...fun, ...style } : style}
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
