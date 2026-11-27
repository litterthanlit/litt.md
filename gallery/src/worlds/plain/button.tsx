/**
 * Button, Plain's body (proposals/plain.md, Quiet): a word, and the main one held in four corner brackets.
 *
 * - Nothing is filled, lined or underlined. Primary is --fg at the title weight inside four 6px corner marks, the one
 *   framed thing on a screen, so the main action is found without a fill. Secondary and ghost are --fg-muted words
 *   that come to --fg, and take the brackets, under the hand. Danger is --danger words that take them under the hand;
 *   in a dialog's footer the confirm is framed at the title weight.
 * - The brackets are the word's own color (currentColor), drawn as a background, so they move nothing.
 * - The height is the control scale's, so the hit area holds (WCAG 2.5.8), with no side padding: the words line up
 *   with the text around them, and the brackets stand just outside them.
 * - Disabled is --fg-disabled with no brackets. Focus is the --focus outline.
 * - The contract (props, aria-busy, aria-disabled, sizes, label, spinner) is button.tsx's.
 */
import type { ButtonBodyProps, ButtonSize, ButtonVariant } from "@/components/button";

const base =
  "litt-target group/btn relative inline-flex shrink-0 items-center justify-center gap-control whitespace-nowrap select-none cursor-pointer " +
  "bg-transparent transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
  "disabled:cursor-not-allowed data-loading:cursor-wait " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus";

/* Four corner marks, each two 1px bars 6px long, in the word's color; they tighten slightly inward on press. */
const brackets =
  "pointer-events-none absolute -inset-x-2.5 inset-y-1.5 bg-no-repeat " +
  "transition-[opacity,scale] duration-(--dur-instant) ease-litt group-enabled/btn:group-active/btn:scale-[0.96] " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:6px_1px,1px_6px,6px_1px,1px_6px,6px_1px,1px_6px,6px_1px,1px_6px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom] " +
  "group-disabled/btn:hidden";

const sizes: Record<ButtonSize, string> = {
  sm: "h-control-sm text-small",
  md: "h-control-md text-body",
  lg: "h-control-lg text-(length:--control-text-lg)",
};

const variants: Record<ButtonVariant, string> = {
  primary: "font-title text-fg",
  secondary: "font-normal text-fg-muted enabled:hover:text-fg enabled:pointer-coarse:active:text-fg",
  ghost: "font-normal text-fg-muted enabled:hover:text-fg enabled:pointer-coarse:active:text-fg",
  danger: "font-normal text-danger in-[[data-dialog-footer]]:font-title",
};

/* When the brackets show: always for the main action, under the hand for the rest. */
const framed: Record<ButtonVariant, string> = {
  primary: "",
  secondary: "opacity-0 group-enabled/btn:group-hover/btn:opacity-100 group-enabled/btn:pointer-coarse:group-active/btn:opacity-100",
  ghost: "opacity-0 group-enabled/btn:group-hover/btn:opacity-100 group-enabled/btn:pointer-coarse:group-active/btn:opacity-100",
  danger:
    "opacity-0 group-enabled/btn:group-hover/btn:opacity-100 group-enabled/btn:pointer-coarse:group-active/btn:opacity-100 in-[[data-dialog-footer]]:opacity-100",
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
      <span aria-hidden="true" className={brackets + " " + framed[variant]} />
      {children}
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          {spinner}
        </span>
      )}
    </button>
  );
}
