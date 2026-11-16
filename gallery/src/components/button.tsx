/**
 * Button: the reference component. Read this before writing another one.
 *
 * - Slightly rounded, three sizes on the shared control scale (R9). Labels sit in
 *   .litt-trim, so side padding equals the visible air at sm and md. lg runs wider
 *   (--button-pad-lg), so a short label never makes a square block.
 * - The label is at the title weight (R8, font-title). State changes color and fill only; the
 *   box never moves or resizes (loading keeps the label mounted at opacity 0).
 * - Loading is busy, not disabled: the button keeps its variant's look and its focus (a disabled button drops focus
 *   to the page), and a click does nothing, a submit's included, until it ends. It does not sink while it waits.
 * - Material (R3), Press's body: a block standing on the surface, raised once, by its cast, with no outline around it
 *   (litt-principles.md, Press: the boards of 26 October 2026). A secondary block is --block with its cast
 *   (--block-lift); the primary is the accent with its lit top edge and its glow. A press sinks it: the cast tightens
 *   (--block-press), the face takes its hover fill and the label drops --press-depth (half a pixel), all at once, never
 *   faded (R2). Ghost lies flat, and so does a disabled button: --surface-2 inside a 1px --line, nothing to push.
 * - More contrast (prefers-contrast: more): the secondary block takes a 1px inset --line-control ring, so its edge
 *   reaches 3:1 against the surface for the people who ask for it. Nobody else sees an outline.
 * - Forced colors drops the cast, so a raised block carries a 1px transparent outline that forced colors draws as its
 *   edge. Focus replaces it with the --focus outline.
 * - Danger (R7): a destructive action is the same raised block with its words in --danger. Inside a dialog's footer
 *   ([data-dialog-footer], matched structurally with Tailwind's in-* variant) it is the confirm of the dialog that
 *   asks, the one red fill: --danger with --danger-fg words and the primary's lit top edge, with no cast and no glow
 *   (the glow is the primary's, R6). Until the dialog's condition is met it is disabled, so it lies flat like any
 *   disabled button.
 * - Motion: the instant tier. Hover is a CSS transition on --dur-instant, which tokens.css owns. A press drops the
 *   label --press-depth (half a pixel) rather than shrinking the box. Tailwind's translate-y-* sets the CSS
 *   `translate` property, not `transform`, so the transition names `translate`; naming `transform` instead would
 *   let the press snap.
 * - Touch: a pressed button also takes its hover fill, so a press still shows under reduced motion (which sets the
 *   depth to 0). The OS tap flash is turned off so the two do not double. Rows and segments fill (see Tabs, List).
 * - Children: one child is the label, trimmed to its cap height. An icon and a word
 *   (`<Button><PlusIcon /> New</Button>`, as shadcn writes it) sit side by side: each
 *   run of text is a trimmed label, and each element sits in the row. A child SVG is
 *   16px, like every button icon. The icon prop is still the documented way.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): the press goes deeper (1px) and the sink moves on fun mode's press spring, as a CSS linear() easing, so the release springs back with a little life. Only the
 *   sink's timing changes; fills keep the instant tier. Still CSS, no script per press. Reduced motion turns it off.
 * - Flat (proposals/flat-pill.md): the secondary is a grey pill with no cast (the tokens), icon-only is a grey circle,
 *   a ghost is words alone, and a disabled button is a grey fill with --fg-disabled words and no hairline.
 * - Corners: rounded-control (4px in litt.md v0.5). Icon-only buttons are
 *   round (pill) and need an aria-label.
 * - Bodies (proposals/worlds.md): this file is the contract (props, the real <button>, aria-busy and aria-disabled,
 *   the sizes, the label, the spinner) and Press's body. It resolves them once into ButtonBodyProps and picks a body
 *   by the material on <html> (byWorld, useMaterial). Flat's pill is worlds/flat/button.tsx; Device's key on its 2px
 *   skirt is worlds/device/button.tsx. Heat keeps the block on its plate that Press had until 2026-11-16, in
 *   worlds/heat/button.tsx. A frame that sets its own material (a study strip, a side-by-side preview)
 *   wraps its buttons in a MaterialProvider to draw that body.
 *   Rack's flat key in a 1px outline is worlds/rack/button.tsx: the accent fill for the primary, a darker outline for a press, nothing that moves.
 */
import { Children, type ButtonHTMLAttributes, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from "react";
import { byWorld, useFun, useMaterial } from "@/motion";
import { ButtonFlatBody } from "@/worlds/flat/button";
import { ButtonDeviceBody } from "@/worlds/device/button";
import { ButtonPlainBody } from "@/worlds/plain/button";
import { ButtonRackBody } from "@/worlds/rack/button";
import { ButtonHeatBody } from "@/worlds/heat/button";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Primary is the one accent fill in a view. Secondary is the default. Ghost is for quiet actions like Cancel. Danger is a destructive action, a block with red words; in a dialog's footer it is the confirm, filled red once it is enabled. */
  variant?: ButtonVariant;
  /** Height on the shared control scale: sm is 32, md is 44, lg is 56. Use lg for hero actions only, md in a page form and a dialog. */
  size?: ButtonSize;
  /** Swaps the label for a spinner and keeps the width. The button stays focusable and keeps its look, sets aria-busy and aria-disabled, and ignores clicks (a submit's too) until loading ends. */
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
  "litt-target group relative inline-flex shrink-0 items-center justify-center gap-control whitespace-nowrap select-none font-title " +
  "cursor-pointer transition-[background-color,color] duration-(--dur-instant) ease-litt " +
  "[-webkit-tap-highlight-color:transparent] " +
  "disabled:cursor-not-allowed data-loading:cursor-wait " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const sizes: Record<ButtonSize, string> = {
  sm: "h-control-sm px-control-pad-sm text-small",
  md: "h-control-md px-control-pad-md text-body",
  lg: "h-control-lg px-button-pad-lg text-(length:--control-text-lg)",
};
const iconSizes: Record<ButtonSize, string> = { sm: "w-control-sm", md: "w-control-md", lg: "w-control-lg" };

/* Press's sizes. The height and the text are the control scale's. The block once stood on a plate, a border 2px wide at
   sm and 3px at md and lg; the plate is gone and its width comes back as side padding, so the button keeps its size. */
const pressSizes: Record<ButtonSize, string> = {
  sm: "h-control-sm px-[calc(var(--control-pad-sm)+2px)] text-small",
  md: "h-control-md px-[calc(var(--control-pad-md)+3px)] text-body",
  lg: "h-control-lg px-[calc(var(--button-pad-lg)+3px)] text-(length:--control-text-lg)",
};
const pressIconSizes: Record<ButtonSize, string> = { sm: "h-control-sm text-small", md: "h-control-md text-body", lg: "h-control-lg text-(length:--control-text-lg)" };

/* A raised block has no line of its own, so forced colors (which drops the cast) draws this one as its edge. */
const edge = "outline-1 outline-solid outline-transparent ";

/* For a person who asks their system for more contrast (prefers-contrast: more), the secondary block also takes a 1px
   inset --line-control ring, so its edge reaches 3:1 against the surface (WCAG 1.4.11). Everyone else sees the block
   raised once, by its cast. The ring is its own shadow layer, so the cast and the press stay as they are. */
const moreContrast = "contrast-more:enabled:inset-ring contrast-more:enabled:inset-ring-line-control";

const variants: Record<ButtonVariant, string> = {
  primary:
    edge + "bg-accent text-accent-fg hover:bg-accent-hover enabled:pointer-coarse:active:bg-accent-hover shadow-glow " +
    "inset-shadow-[0_1px_0_color-mix(in_oklab,white_22%,transparent)]",
  secondary:
    edge + "bg-block text-fg shadow-(--block-lift) enabled:not-data-loading:active:shadow-(--block-press) " +
    "hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover) " + moreContrast,
  ghost:
    "bg-transparent text-fg-muted hover:text-fg hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
    "enabled:pointer-coarse:active:text-fg enabled:pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]",
  danger:
    edge + "bg-block text-danger shadow-(--block-lift) enabled:not-data-loading:active:shadow-(--block-press) " +
    "hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover) " +
    /* A dialog's confirm. These rules sort after the block's, so they win its ties (active, a finger's press). */
    "in-[[data-dialog-footer]]:enabled:bg-danger in-[[data-dialog-footer]]:enabled:text-danger-fg " +
    "in-[[data-dialog-footer]]:enabled:shadow-none in-[[data-dialog-footer]]:enabled:active:shadow-none " +
    "in-[[data-dialog-footer]]:enabled:inset-shadow-[0_1px_0_color-mix(in_oklab,white_22%,transparent)] " +
    "in-[[data-dialog-footer]]:enabled:hover:bg-[color-mix(in_oklab,var(--danger),var(--fg)_10%)] " +
    "in-[[data-dialog-footer]]:enabled:pointer-coarse:active:bg-[color-mix(in_oklab,var(--danger),var(--fg)_10%)]",
};
/* Disabled lies flat: a --surface-2 face inside a 1px --line, with no cast and no lit edge. */
const disabledLook =
  "disabled:bg-surface-2 disabled:text-fg-disabled disabled:shadow-[inset_0_0_0_1px_var(--line)] disabled:inset-shadow-none ";

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

/** What a body gets from the contract: the resolved state, the geometry the control scale sets, and the element's attributes. A body adds its look and its data-body, and nothing else about what the button is. */
export type ButtonBodyProps = {
  variant: ButtonVariant;
  size: ButtonSize;
  iconOnly: boolean;
  loading: boolean;
  disabled: boolean | undefined;
  /** The control scale's height, side padding and text size for this size. */
  sizeClass: string;
  /** The corner: rounded-control, or a round icon-only button's width and pill. */
  shapeClass: string;
  /** w-full when the button fills its container, else empty. */
  blockClass: string;
  /** The caller's className. */
  className: string;
  /** Fun mode's press (the deeper sink and its spring) as a style; undefined when fun mode is off. */
  fun: CSSProperties | undefined;
  /** The row: icon, label and trailing icon, mounted at opacity 0 while loading so the width holds. */
  children: ReactNode;
  /** The 16px spinner, for the body to place while loading. */
  spinner: ReactNode;
  /** type, disabled, aria-busy, aria-disabled, data-loading, the caller's style and other attributes, and the click handler that ignores presses while loading. */
  rootProps: ComponentPropsWithRef<"button"> & { "data-loading"?: true };
};

/** Press's body: a block standing on the surface, raised once by its cast, sinking half a pixel when pressed. The default, and what a world without a body of its own gets. */
function PressBody({ variant, size, iconOnly, shapeClass, blockClass, className, fun, children, spinner, loading, rootProps }: ButtonBodyProps) {
  const { style, ...root } = rootProps;
  return (
    <button
      {...root}
      data-body="press"
      className={[base, iconOnly ? pressIconSizes[size] : pressSizes[size], variants[variant], disabledLook, shapeClass, blockClass, className].join(" ")}
      style={fun ? { ...fun, ...style } : style}
    >
      <span
        className={
          "inline-flex items-center justify-center transition-[background-color,color,translate] duration-(--dur-instant) ease-litt " +
          "group-[:enabled:not([data-loading]):active]:translate-y-(--press-depth)"
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
  onClick,
  ...rest
}: ButtonProps) {
  const fun = useFun();
  const material = useMaterial();
  /* Fun mode: the sink (the third transitioned property) takes the press spring and goes deeper; the fills keep the instant tier. */
  const press: CSSProperties | undefined = fun
    ? ({
        "--press-depth": "1px",
        transitionDuration: `var(--dur-instant), var(--dur-instant), ${fun.press.duration}ms`,
        transitionTimingFunction: `var(--ease-out), var(--ease-out), ${fun.press.easing}`,
      } as CSSProperties)
    : undefined;
  const Body = byWorld(material, { press: PressBody, flat: ButtonFlatBody, device: ButtonDeviceBody, plain: ButtonPlainBody, rack: ButtonRackBody, heat: ButtonHeatBody });
  return (
    <Body
      variant={variant}
      size={size}
      iconOnly={iconOnly}
      loading={loading}
      disabled={disabled}
      sizeClass={sizes[size]}
      shapeClass={iconOnly ? `${iconSizes[size]} px-0 rounded-pill` : "rounded-control"}
      blockClass={block ? "w-full" : ""}
      className={className}
      fun={press}
      spinner={<Spinner />}
      rootProps={{
        type,
        disabled,
        "aria-busy": loading || undefined,
        "aria-disabled": loading || undefined,
        "data-loading": loading || undefined,
        style,
        ...rest,
        onClick: loading ? (e) => e.preventDefault() : onClick,
      }}
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
    </Body>
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
