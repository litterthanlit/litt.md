/**
 * Input, the Rack body (proposals/rack.md): what you type sits in the cut, as a value box does on an instrument.
 *
 * - The field is a light box (--cut, through --field) inside a 1px control line (--line-control), square at the control
 *   radius, with no shade: the line is the only edge. Typed text is --field-ink at the text weight in the rack's sans, the
 *   placeholder --field-ink-subtle. A textarea is the same box, taller.
 * - Focus turns the line to the ink (--focus) and adds the focus ring, on keyboard focus only. An error turns the line to
 *   --danger and keeps the ring on focus. Both change on the instant tier and the box never moves. Disabled lies flat on
 *   --surface-2 with the plain --line and --fg-disabled words.
 * - The label sits above in the title weight and sentence case, the hint under it in --fg-subtle, an error in --danger.
 *   No plate, no rule: the panel the field sits on is the plate already.
 * - Forced colors drops shadows, so the line becomes a real border and focus gets an outline.
 * - The contract (the real input or textarea, its label, aria-invalid, aria-describedby) is input.tsx's.
 */
import type { FieldBodyProps, InputBodyProps, InputSize, TextareaBodyProps } from "../input";

const rackField =
  "w-full min-w-0 rounded-control bg-field font-normal text-field-ink placeholder:text-field-ink-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) " +
  "shadow-[inset_0_0_0_1px_var(--field-line)] " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--focus),var(--focus-ring)] " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger)] " +
  "aria-invalid:focus-visible:shadow-[inset_0_0_0_1px_var(--danger),var(--focus-ring)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:placeholder:text-fg-disabled " +
  "disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
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

/** Rack, the bare input: a light box in the control line. */
export function InputRackBody({ size, invalid, mono, className, control }: InputBodyProps) {
  return (
    <input
      data-body="rack"
      aria-invalid={invalid || undefined}
      className={[rackField, inputSizes[size], mono ? "font-mono" : "font-field", className].join(" ")}
      {...control}
    />
  );
}

/** Rack, the textarea: the same box, taller. */
export function TextareaRackBody({ size, invalid, mono, className, control }: TextareaBodyProps) {
  return (
    <textarea
      data-body="rack"
      aria-invalid={invalid || undefined}
      className={[rackField, "block resize-y", textareaSizes[size], mono ? "font-mono" : "font-field", className].join(" ")}
      {...control}
    />
  );
}

/** Rack, the label above the box in the title weight, the hint or the error under it. */
export function FieldRackBody({ id, noteId, label, note, error, disabled, children }: FieldBodyProps) {
  return (
    <div data-body="rack" className="grid content-start gap-1.5">
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
