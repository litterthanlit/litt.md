/**
 * Button: the reference component. Read this before writing another one.
 *
 * - Slightly rounded, three sizes on the shared control scale (P10). Labels sit in
 *   .litt-trim, so side padding equals the visible air at sm and md. lg runs wider
 *   (--button-pad-lg), so a short label never makes a square block.
 * - The label is at the title weight (P9, font-title). State changes color and fill only; the
 *   box never moves or resizes (loading keeps the label mounted at opacity 0).
 * - Motion: the instant tier. Hover and press are CSS transitions on
 *   --dur-instant, which tokens.css owns. Press is scale(--press-scale). Tailwind's
 *   active:scale-* sets the CSS `scale` property, not `transform`, so the transition
 *   names `scale`; naming `transform` instead would let the press snap.
 * - Touch: the button keeps the press scale, and a pressed button also takes its hover
 *   fill, so a press still shows under reduced motion (which sets the scale to 1). The OS
 *   tap flash is turned off so the two do not double. Rows and segments fill (see Tabs, List).
 * - Children: one child is the label, trimmed to its cap height. An icon and a word
 *   (`<Button><PlusIcon /> New</Button>`, as shadcn writes it) sit side by side: each
 *   run of text is a trimmed label, and each element sits in the row. A child SVG is
 *   16px, like every button icon. The icon prop is still the documented way.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): the press goes deeper (0.95) and the scale moves
 *   on fun mode's press spring, as a CSS linear() easing, so the release springs back with a little life. Only the
 *   scale's timing changes; fills keep the instant tier. Still CSS, no script per press. Reduced motion turns it off.
 * - Disabled keeps a hairline, so the button keeps its shape on a surface-2 area.
 * - Corners: rounded-control (4px in litt.md v0.5). Icon-only buttons are
 *   round (pill) and need an aria-label.
 */
import { Children, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { useFun } from "@/motion";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Primary is the one accent fill in a view. Secondary is the default. Ghost is for quiet actions like Cancel. */
  variant?: ButtonVariant;
  /** Height on the shared control scale: sm is 32, md is 44, lg is 56. Use lg for hero actions only, md in a page form and a dialog. */
  size?: ButtonSize;
  /** Swaps the label for a spinner, keeps the width, sets aria-busy and disables the button. */
  loading?: boolean;
  /** 16px icon before the label. */
  icon?: ReactNode;
  /** 16px icon after the label. */
  iconRight?: ReactNode;
  /** Round icon-only button. Requires aria-label. */
  iconOnly?: boolean;
  /** Fills the width of its container. */
  block?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
};

const base =
  "relative inline-flex shrink-0 items-center justify-center gap-control whitespace-nowrap select-none font-title " +
  "cursor-pointer transition-[background-color,color,scale] duration-(--dur-instant) ease-litt " +
  "[-webkit-tap-highlight-color:transparent] " +
  "active:scale-(--press-scale) disabled:cursor-not-allowed disabled:active:scale-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const sizes: Record<ButtonSize, string> = {
  sm: "h-control-sm px-control-pad-sm text-small",
  md: "h-control-md px-control-pad-md text-body",
  lg: "h-control-lg px-button-pad-lg text-(length:--control-text-lg)",
};
const iconSizes: Record<ButtonSize, string> = { sm: "w-control-sm", md: "w-control-md", lg: "w-control-lg" };

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover enabled:pointer-coarse:active:bg-accent-hover shadow-glow " +
    "inset-shadow-[0_1px_0_color-mix(in_oklab,white_22%,transparent)]",
  secondary:
    "bg-surface-1 text-fg hover:bg-surface-2 enabled:pointer-coarse:active:bg-surface-2 " +
    "shadow-[inset_0_0_0_1px_var(--line-strong),var(--highlight)]",
  ghost:
    "bg-transparent text-fg-muted hover:text-fg hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
    "enabled:pointer-coarse:active:text-fg enabled:pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]",
};
const disabledLook =
  "disabled:bg-surface-2 disabled:text-fg-disabled disabled:shadow-[inset_0_0_0_1px_var(--line)] disabled:inset-shadow-none";

/* One child is the label. Several (an icon and a word) sit in the row: text runs are trimmed labels, elements sit as they are. */
function label(children: ReactNode): ReactNode {
  const parts = Children.toArray(children);
  if (parts.length < 2) return parts.length ? <span className="litt-trim">{children}</span> : null;
  const out: ReactNode[] = [];
  let text = "";
  const flush = () => {
    const t = text.trim();
    if (t) out.push(<span key={`label-${out.length}`} className="litt-trim">{t}</span>);
    text = "";
  };
  for (const part of parts) {
    if (typeof part === "string" || typeof part === "number") text += part;
    else { flush(); out.push(part); }
  }
  flush();
  return out;
}

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
  style,
  ...rest
}: ButtonProps) {
  const fun = useFun();
  const shape = iconOnly ? `${iconSizes[size]} px-0 rounded-pill` : "rounded-control";
  /* Fun mode: the scale (the third transitioned property) takes the press spring; the fills keep the instant tier. */
  const press: CSSProperties | undefined = fun
    ? ({
        "--press-scale": fun.press.scale,
        transitionDuration: `var(--dur-instant), var(--dur-instant), ${fun.press.duration}ms`,
        transitionTimingFunction: `var(--ease-out), var(--ease-out), ${fun.press.easing}`,
      } as CSSProperties)
    : undefined;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[base, sizes[size], variants[variant], disabledLook, shape, block ? "w-full" : "", className].join(" ")}
      style={press ? { ...press, ...style } : style}
      {...rest}
    >
      <span
        className={
          "inline-flex items-center gap-control transition-opacity duration-(--dur-instant) ease-litt " +
          "[&>svg]:size-4 [&>svg]:shrink-0 " +
          (loading ? "opacity-0" : "opacity-100")
        }
      >
        {icon}
        {!iconOnly && label(children)}
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
export function Spinner({
  size = 16,
}: {
  /** Width and height in px. */
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="animate-spin" /* litt-allow: spinner */>
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeOpacity=".25" strokeWidth="1.5" />
      <path d="M14.25 8A6.25 6.25 0 0 0 8 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
