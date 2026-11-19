/**
 * Button, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a flat square racing-menu key.
 *
 * - Square corners (`rounded-none`), zero cast, zero bevel, zero bottom wall. Press answers on the frame
 *   (`active:scale-[var(--press-scale)]`).
 * - Primary is the amber fill (`bg-accent text-accent-fg`) in a crisp 1px control line, with ink corner brackets
 *   appearing under the hand.
 * - Secondary is a flat dark cell (`bg-block text-fg border border-line`) whose four 8px amber corner brackets
 *   (`text-accent-text`) snap on under hover and press.
 * - Ghost is plain flat words (`text-fg-muted hover:text-fg`) that take four 6px amber corner brackets under the hand.
 * - Danger is the flat cell with danger words, flipping to solid danger fill inside a dialog footer (confirm).
 * - Disabled lies flat on `--surface-2` with `--fg-disabled` words and no brackets.
 * - The contract (props, aria-busy, aria-disabled, sizes, label, spinner) is button.tsx's.
 */
import type { ButtonBodyProps, ButtonSize, ButtonVariant } from "@/components/button";

const base =
  "litt-target group relative inline-flex shrink-0 items-center justify-center gap-control whitespace-nowrap select-none font-title rounded-none " +
  "cursor-pointer transition-[background-color,color,border-color,transform] duration-(--dur-instant) ease-litt " +
  "[-webkit-tap-highlight-color:transparent] enabled:not-data-loading:active:scale-[var(--press-scale)] " +
  "disabled:cursor-not-allowed data-loading:cursor-wait " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const pads: Record<ButtonSize, string> = {
  sm: "px-control-pad-sm",
  md: "px-control-pad-md",
  lg: "px-button-pad-lg",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-line-control bg-accent text-accent-fg hover:bg-accent-hover enabled:pointer-coarse:active:bg-accent-hover forced-colors:border",
  secondary:
    "border border-line bg-block text-fg hover:border-line-strong hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover) forced-colors:border",
  ghost:
    "border border-transparent bg-transparent text-fg-muted hover:bg-surface-1 hover:text-fg enabled:pointer-coarse:active:bg-surface-1 enabled:pointer-coarse:active:text-fg",
  danger:
    "border border-line bg-block text-danger hover:border-line-strong hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover) forced-colors:border " +
    "in-[[data-dialog-footer]]:enabled:border-danger in-[[data-dialog-footer]]:enabled:bg-danger in-[[data-dialog-footer]]:enabled:text-danger-fg " +
    "in-[[data-dialog-footer]]:enabled:hover:bg-[color-mix(in_oklab,var(--danger),var(--fg)_10%)] " +
    "in-[[data-dialog-footer]]:enabled:pointer-coarse:active:bg-[color-mix(in_oklab,var(--danger),var(--fg)_10%)]",
};

const disabledLook =
  "disabled:border-line disabled:bg-surface-2 disabled:text-fg-disabled";

/* Four 8px corner marks that snap in on hover/active/focus-visible (never on disabled). */
const brackets =
  "pointer-events-none absolute inset-0 opacity-0 bg-no-repeat " +
  "transition-opacity duration-(--dur-instant) ease-litt " +
  "group-enabled:group-hover:opacity-100 group-enabled:group-active:opacity-100 group-enabled:group-focus-visible:opacity-100 " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

export function ButtonHeatBody({ variant, size, iconOnly, sizeClass, shapeClass, blockClass, className, fun, children, spinner, loading, rootProps }: ButtonBodyProps) {
  const { style, ...root } = rootProps;
  const bracketTone = variant === "primary" ? " text-accent-fg" : variant === "danger" ? " text-danger" : " text-accent-text";
  return (
    <button
      {...root}
      data-body="heat"
      className={[base, sizeClass, iconOnly ? "px-0" : pads[size], variants[variant], disabledLook, shapeClass, blockClass, className].join(" ")}
      style={fun ? { ...fun, ...style } : style}
    >
      <span aria-hidden="true" className={brackets + bracketTone} />
      <span className="inline-flex items-center justify-center">{children}</span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          {spinner}
        </span>
      )}
    </button>
  );
}
