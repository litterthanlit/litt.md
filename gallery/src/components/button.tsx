/**
 * Button: the reference component. Read this before writing another one.
 *
 * - Square, three sizes on the shared control scale (P10). Labels sit in
 *   .litt-trim, so side padding equals the visible air.
 * - Weight 400 always (P9). State changes color and fill only; the box never
 *   moves or resizes (loading keeps the label mounted at opacity 0).
 * - Motion: the instant tier. Hover and press are CSS transitions on
 *   --dur-instant, which the dial rewrites live. Press is scale(--press-scale).
 * - Corners: rounded-control (the shape trial, litt.md Q19). Icon-only buttons
 *   are round (pill) and need an aria-label.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** 16px icon before the label. */
  icon?: ReactNode;
  /** 16px icon after the label. */
  iconRight?: ReactNode;
  /** Round icon-only button. Requires aria-label. */
  iconOnly?: boolean;
  block?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
};

const base =
  "relative inline-flex shrink-0 items-center justify-center gap-control whitespace-nowrap select-none font-normal " +
  "cursor-pointer transition-[background-color,color,transform] duration-(--dur-instant) ease-litt " +
  "active:scale-(--press-scale) disabled:cursor-not-allowed disabled:active:scale-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const sizes: Record<ButtonSize, string> = {
  sm: "h-control-sm px-control-pad-sm text-small",
  md: "h-control-md px-control-pad-md text-body",
  lg: "h-control-lg px-control-pad-lg text-(length:--control-text-lg)",
};
const iconSizes: Record<ButtonSize, string> = { sm: "w-control-sm", md: "w-control-md", lg: "w-control-lg" };

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover shadow-glow " +
    "inset-shadow-[0_1px_0_color-mix(in_oklab,white_22%,transparent)]",
  secondary:
    "bg-surface-1 text-fg hover:bg-surface-2 shadow-[inset_0_0_0_1px_var(--line-strong),var(--highlight)]",
  ghost: "bg-transparent text-fg-muted hover:text-fg hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]",
};
const disabledLook =
  "disabled:bg-surface-2 disabled:text-fg-disabled disabled:shadow-none disabled:inset-shadow-none";

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  iconOnly = false,
  block = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const shape = iconOnly ? `${iconSizes[size]} px-0 rounded-pill` : "rounded-control";
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[base, sizes[size], variants[variant], disabledLook, shape, block ? "w-full" : "", className].join(" ")}
      {...rest}
    >
      <span
        className={
          "inline-flex items-center gap-control transition-opacity duration-(--dur-instant) ease-litt " +
          (loading ? "opacity-0" : "opacity-100")
        }
      >
        {icon}
        {!iconOnly && children != null && <span className="litt-trim">{children}</span>}
        {iconOnly && children}
        {iconRight}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <Spinner />
        </span>
      )}
    </button>
  );
}

/** 16px spinner, 1.5px stroke, currentColor. The rotation is a loading signal, not decoration. */
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="animate-spin" /* litt-allow: spinner */>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeOpacity=".25" strokeWidth="1.5" />
      <path d="M14.25 8A6.25 6.25 0 0 0 8 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
