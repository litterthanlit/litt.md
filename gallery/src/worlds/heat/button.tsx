/**
 * Button, Heat's body: a thick block on its own plate, as Press drew it until 2026-11-16 (plans/022). Press went back
 * to its first boards and dropped the plate, the wall and the lit edge; Heat keeps them, so nothing in Heat changed.
 *
 * - The plate is the button's own border (--slot, 3px at md and lg, 2px at sm); the block is the face inside it, with
 *   a lit top edge (--highlight) and a darker wall along its foot that is its thickness (--block-wall). A secondary
 *   block casts a little (--block-lift) and the primary is the accent with its glow. A press sinks the block into the
 *   plate: the wall goes, the cast tightens (--block-press), the face takes its hover fill and the label drops twice
 *   --press-depth, all at once. Ghost has no plate and lies flat, and so does a disabled button: a plate with a flat
 *   face, nothing to push.
 * - Danger is the same block with its words in --danger; in a dialog's footer it is the confirm, the one red fill.
 * - The contract (props, aria-busy, aria-disabled, sizes, label, spinner) is button.tsx's.
 */
import type { ButtonBodyProps, ButtonSize, ButtonVariant } from "@/components/button";

const base =
  "litt-target group relative inline-flex shrink-0 items-center justify-center gap-control whitespace-nowrap select-none font-title " +
  "cursor-pointer transition-[background-color,color] duration-(--dur-instant) ease-litt " +
  "[-webkit-tap-highlight-color:transparent] border-(length:--plate) border-solid bg-clip-padding " +
  "disabled:cursor-not-allowed data-loading:cursor-wait " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The plate is the border, so it takes room from the box. The side padding gives the same room back, and the button keeps the width it had. */
const plateSize: Record<ButtonSize, string> = {
  sm: "[--plate:2px] [padding-inline:calc(var(--control-pad-sm)-2px)]",
  md: "[--plate:3px] [padding-inline:calc(var(--control-pad-md)-3px)]",
  lg: "[--plate:3px] [padding-inline:calc(var(--button-pad-lg)-3px)]",
};
const plateIcon = "[--plate:3px] px-0";

/* The block's thickness is a wall along its foot (--block-wall, 2px; none under Plain), drawn in the face's own background. A press sinks the block into its plate: the wall goes. */
const wall = "[background-image:linear-gradient(to_top,var(--wall)_var(--block-wall),transparent_var(--block-wall))] enabled:not-data-loading:active:[background-image:none] disabled:[background-image:none]";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-(--slot) bg-accent text-accent-fg hover:bg-accent-hover enabled:pointer-coarse:active:bg-accent-hover shadow-glow " +
    "inset-shadow-[0_1px_0_color-mix(in_oklab,white_22%,transparent)] [--wall:color-mix(in_oklab,black_24%,transparent)] " + wall,
  secondary:
    "border-(--slot) bg-block text-fg [--stack:var(--highlight),var(--block-lift)] enabled:not-data-loading:active:[--stack:var(--highlight),var(--block-press)] " +
    "shadow-(--stack) [--wall:color-mix(in_oklab,var(--fg)_14%,transparent)] " + wall + " " +
    "hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover)",
  ghost:
    "bg-transparent bg-clip-border border-transparent text-fg-muted hover:text-fg hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
    "enabled:pointer-coarse:active:text-fg enabled:pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]",
  danger:
    "border-(--slot) bg-block text-danger [--stack:var(--highlight),var(--block-lift)] enabled:not-data-loading:active:[--stack:var(--highlight),var(--block-press)] " +
    "shadow-(--stack) [--wall:color-mix(in_oklab,var(--fg)_14%,transparent)] " + wall + " " +
    "hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover) " +
    /* A dialog's confirm. These rules sort after the block's, so they win its ties (active, a finger's press). */
    "in-[[data-dialog-footer]]:enabled:bg-danger in-[[data-dialog-footer]]:enabled:text-danger-fg " +
    "in-[[data-dialog-footer]]:enabled:shadow-none in-[[data-dialog-footer]]:enabled:active:shadow-none " +
    "in-[[data-dialog-footer]]:enabled:inset-shadow-[0_1px_0_color-mix(in_oklab,white_22%,transparent)] " +
    "in-[[data-dialog-footer]]:enabled:[--wall:color-mix(in_oklab,black_24%,transparent)] " +
    "in-[[data-dialog-footer]]:enabled:hover:bg-[color-mix(in_oklab,var(--danger),var(--fg)_10%)] " +
    "in-[[data-dialog-footer]]:enabled:pointer-coarse:active:bg-[color-mix(in_oklab,var(--danger),var(--fg)_10%)]",
};
/* Disabled lies flat: the plate stays, and its face has no cast, no lit edge and no wall. */
const disabledLook =
  "disabled:bg-surface-2 disabled:bg-clip-padding disabled:border-(--slot) disabled:text-fg-disabled disabled:shadow-none disabled:inset-shadow-none ";

export function ButtonHeatBody({ variant, size, iconOnly, sizeClass, shapeClass, blockClass, className, fun, children, spinner, loading, rootProps }: ButtonBodyProps) {
  const { style, ...root } = rootProps;
  return (
    <button
      {...root}
      data-body="heat"
      className={[base, sizeClass, iconOnly ? plateIcon : plateSize[size], variants[variant], disabledLook, shapeClass, blockClass, className].join(" ")}
      style={fun ? { ...fun, ...style } : style}
    >
      <span
        className={
          "inline-flex items-center justify-center transition-[background-color,color,translate] duration-(--dur-instant) ease-litt " +
          (variant === "ghost"
            ? "group-[:enabled:not([data-loading]):active]:translate-y-(--press-depth)"
            : "group-[:enabled:not([data-loading]):active]:translate-y-[calc(var(--press-depth)*2)]")
        }
        style={fun}
      >
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          {spinner}
        </span>
      )}
    </button>
  );
}
