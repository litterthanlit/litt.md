/**
 * Input, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): a grey pill (--cut is --surface-3) with
 * no outline and no shade. Focus is the ink ring, an error the danger ring, disabled lies flat with no hairline. A
 * textarea rounds to --radius-surface. The label, the control and the note stack as in Press.
 */
import type { FieldBodyProps, InputBodyProps, InputSize, TextareaBodyProps } from "../input";

const flatField =
  "w-full min-w-0 bg-field font-normal text-field-ink placeholder:text-field-ink-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) " +
  "shadow-none " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-none focus-visible:shadow-(--focus-ring) " +
  "aria-invalid:shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)] " +
  "aria-invalid:focus-visible:shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:placeholder:text-fg-disabled " +
  "disabled:shadow-none " +
  "forced-colors:border forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-offset-2";

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

/** Flat, the grey pill: no outline, no shade. */
export function InputFlatBody({ size, invalid, mono, className, control }: InputBodyProps) {
  return (
    <input
      data-body="flat"
      aria-invalid={invalid || undefined}
      className={[flatField, "rounded-control", inputSizes[size], mono ? "font-mono" : "font-field", className].join(" ")}
      {...control}
    />
  );
}

/** Flat, the grey field for longer text, rounded to the surface radius. */
export function TextareaFlatBody({ size, invalid, mono, className, control }: TextareaBodyProps) {
  return (
    <textarea
      data-body="flat"
      aria-invalid={invalid || undefined}
      className={[flatField, "block resize-y rounded-surface", textareaSizes[size], mono ? "font-mono" : "font-field", className].join(" ")}
      {...control}
    />
  );
}

/** Flat, the label, the control and the note, stacked as in Press. */
export function FieldFlatBody({ id, noteId, label, note, error, disabled, children }: FieldBodyProps) {
  return (
    <div data-body="flat" className="grid gap-2">
      <label htmlFor={id} className={"text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </label>
      {children}
      {note && (
        <p id={noteId} className={"text-small " + (error ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </div>
  );
}
