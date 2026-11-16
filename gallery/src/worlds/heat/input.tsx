/**
 * Input, Heat's body: the cut with the slot's walls and a deeper floor, as Press drew it until 2026-11-16 (plans/022).
 * Press went back to its first boards, the cut inside the 3:1 control line (--line-control, --cut-shade); Heat keeps
 * the deeper cut (--slot-shade with --field-shade stacked on it), so nothing in Heat changed.
 *
 * - The bare input and the textarea are Heat's; the labelled field around them is Press's (input.tsx).
 * - The contract (props, aria-invalid, aria-describedby, the label) is input.tsx's.
 */
import type { InputBodyProps, InputSize, TextareaBodyProps } from "@/components/input";

/* The cut every field shares: floor, line, shade, focus, error, disabled. */
const field =
  "w-full min-w-0 rounded-control bg-field font-normal text-field-ink placeholder:text-field-ink-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) " +
  "shadow-[var(--slot-shade),var(--field-shade)] " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-none focus-visible:shadow-[var(--slot-shade),var(--field-shade),var(--focus-ring)] " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger),var(--slot-shade),var(--field-shade)] " +
  "aria-invalid:focus-visible:shadow-[inset_0_0_0_1px_var(--danger),var(--slot-shade),var(--field-shade),var(--focus-ring)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:placeholder:text-fg-disabled " +
  "disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  /* Forced colors (Windows high contrast) drops box-shadow, so the edge becomes a real border and focus gets an outline. */
  "forced-colors:border forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-offset-2";

const inputSizes: Record<InputSize, string> = {
  sm: "h-control-sm px-control-pad-sm text-small pointer-coarse:h-control-md",
  md: "h-control-md px-control-pad-md text-body",
  lg: "h-control-lg px-control-pad-lg text-(length:--control-text-lg)",
};

/* A textarea has no fixed height, so its size sets the air above and below the text instead. */
const textareaSizes: Record<InputSize, string> = {
  sm: "px-control-pad-sm py-2 text-small",
  md: "px-control-pad-md py-3 text-body",
  lg: "px-control-pad-lg py-4 text-(length:--control-text-lg)",
};

/* Heat's input: the deeper cut. */
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

/* Heat's textarea: the same deeper cut. */
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
