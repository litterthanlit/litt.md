/**
 * Input, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a flat square dark field in a crisp 1px
 * control line, with zero inset shadows and a sharp amber focus outline.
 *
 * - Square corners (`rounded-none`), `--field` fill, `--line-control` border, `--field-ink` text.
 * - Hover steps the border to `--fg`; focus takes the 2px `--focus` outline; invalid takes `--danger`; disabled lies
 *   flat on `--surface-2` with `--line` and `--fg-disabled`.
 * - The contract (props, aria-invalid, aria-describedby, the label) is input.tsx's.
 */
import type { InputBodyProps, InputSize, TextareaBodyProps } from "@/components/input";

const field =
  "w-full min-w-0 rounded-none border border-line-control bg-field font-normal text-field-ink placeholder:text-field-ink-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) " +
  "transition-[border-color,background-color] duration-(--dur-instant) ease-litt " +
  "enabled:hover:border-fg " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
  "aria-invalid:border-danger " +
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-fg-disabled disabled:placeholder:text-fg-disabled " +
  "forced-colors:border";

const inputSizes: Record<InputSize, string> = {
  sm: "h-control-sm px-control-pad-sm text-small pointer-coarse:h-control-md",
  md: "h-control-md px-control-pad-md text-body",
  lg: "h-control-lg px-control-pad-lg text-(length:--control-text-lg)",
};

const textareaSizes: Record<InputSize, string> = {
  sm: "px-control-pad-sm py-2 text-small",
  md: "px-control-pad-md py-3 text-body",
  lg: "px-control-pad-lg py-4 text-(length:--control-text-lg)",
};

/** Heat's input: flat square dark field in a crisp 1px control line. */
export function InputHeatBody({ size, invalid, mono, className, control }: InputBodyProps) {
  return (
    <input
      data-body="heat"
      aria-invalid={invalid || undefined}
      className={[field, inputSizes[size], mono ? "font-mono" : "font-field", className].join(" ")}
      {...control}
    />
  );
}

/** Heat's textarea: the same flat square field, vertically resizable. */
export function TextareaHeatBody({ size, invalid, mono, className, control }: TextareaBodyProps) {
  return (
    <textarea
      data-body="heat"
      aria-invalid={invalid || undefined}
      className={[field, "block resize-y", textareaSizes[size], mono ? "font-mono" : "font-field", className].join(" ")}
      {...control}
    />
  );
}
