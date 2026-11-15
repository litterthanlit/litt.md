/**
 * Button, Plain's body (proposals/plain.md, No UI): a word you can press, and nothing drawn around it. Plain's rule
 * is that what a hand can use is underlined or in link blue, and nothing else is (WCAG 1.4.11), so a button is its
 * words, underlined.
 *
 * - Primary is link blue (--accent-text) at the title weight; secondary is link blue at the text weight; ghost is
 *   --fg-muted words, underlined, that come to --fg under the hand; danger is --danger words, and in a dialog's footer
 *   the confirm takes the title weight. No fill, no line, no plate, no wall.
 * - Under the hand the underline thickens to 2px: the one change, and it is not color alone.
 * - The height is the control scale's, so the hit area holds (WCAG 2.5.8), but there is no side padding: the words
 *   line up with the text around them. An icon-only button is its icon in link blue on the same square.
 * - Disabled is --fg-disabled with no underline, so it no longer reads as something to press.
 * - Forced colors keeps the underline, which is real text decoration, and the system's ButtonText.
 * - The contract (props, aria-busy, aria-disabled, sizes, label, spinner) is button.tsx's.
 */
import type { ButtonBodyProps, ButtonSize, ButtonVariant } from "../button";

const base =
  "litt-target relative inline-flex shrink-0 items-center justify-center gap-control whitespace-nowrap select-none cursor-pointer " +
  "bg-transparent underline decoration-1 underline-offset-[0.2em] enabled:hover:decoration-2 enabled:pointer-coarse:active:decoration-2 " +
  "[-webkit-tap-highlight-color:transparent] " +
  "disabled:cursor-not-allowed disabled:no-underline data-loading:cursor-wait " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const sizes: Record<ButtonSize, string> = {
  sm: "h-control-sm text-small",
  md: "h-control-md text-body",
  lg: "h-control-lg text-(length:--control-text-lg)",
};

const variants: Record<ButtonVariant, string> = {
  primary: "font-title text-accent-text",
  secondary: "font-normal text-accent-text",
  ghost: "font-normal text-fg-muted enabled:hover:text-fg",
  danger: "font-normal text-danger in-[[data-dialog-footer]]:font-title",
};

export function ButtonPlainBody({ variant, size, shapeClass, blockClass, className, fun, children, spinner, loading, rootProps }: ButtonBodyProps) {
  const { style, ...root } = rootProps;
  return (
    <button
      {...root}
      data-body="plain"
      className={[base, sizes[size], variants[variant], "disabled:text-fg-disabled", shapeClass, blockClass, className].join(" ")}
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
