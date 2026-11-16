/**
 * Input, Plain's body (proposals/plain.md, No UI): one line under what you type, and nothing else drawn.
 *
 * - The field has no fill, no frame and no side padding: the typed text lines up with its label and the page. Its one
 *   mark is a 1px --line-control rule along its foot, which says "write here" the way an underline says "press here".
 * - Focus thickens the rule to 2px in --focus; an error draws it 2px in --danger, and the words under the field say
 *   it too, so it never rests on color alone. Disabled thins the rule to --line and the words to --fg-disabled.
 * - The label is words above in --fg at the text weight, the hint grey words below (--fg-subtle), the error --danger.
 * - A textarea is the same: one rule under the last line.
 * - The rule is a 1px background along the foot (--rule, --rule-w), so it never moves the text; forced colors
 *   draws a real bottom border there too.
 */
import type { FieldBodyProps, InputBodyProps, InputSize, TextareaBodyProps } from "@/components/input";

const field =
  "w-full min-w-0 rounded-none bg-transparent px-0 font-normal text-field-ink placeholder:text-field-ink-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) " +
  "bg-[linear-gradient(var(--rule),var(--rule))] bg-[length:100%_var(--rule-w)] bg-bottom bg-no-repeat [--rule:var(--line-control)] [--rule-w:1px] " +
  "focus-visible:outline-none focus-visible:[--rule:var(--focus)] focus-visible:[--rule-w:2px] " +
  "aria-invalid:[--rule:var(--danger)] aria-invalid:[--rule-w:2px] " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:placeholder:text-fg-disabled disabled:[--rule:var(--line)] " +
  "forced-colors:border-b forced-colors:focus-visible:border-b-2";

const inputSizes: Record<InputSize, string> = {
  sm: "h-control-sm text-small pointer-coarse:h-control-md",
  md: "h-control-md text-body",
  lg: "h-control-lg text-(length:--control-text-lg)",
};

const textareaSizes: Record<InputSize, string> = {
  sm: "py-1.5 text-small",
  md: "py-2 text-body",
  lg: "py-3 text-(length:--control-text-lg)",
};

/** Plain, the line under what you type. */
export function InputPlainBody({ size, invalid, mono, className, control }: InputBodyProps) {
  return (
    <input
      data-body="plain"
      aria-invalid={invalid || undefined}
      className={[field, inputSizes[size], mono ? "font-mono" : "font-field", className].join(" ")}
      {...control}
    />
  );
}

/** Plain, the same line under the last line of a longer text. */
export function TextareaPlainBody({ size, invalid, mono, className, control }: TextareaBodyProps) {
  return (
    <textarea
      data-body="plain"
      aria-invalid={invalid || undefined}
      className={[field, "block resize-y", textareaSizes[size], mono ? "font-mono" : "font-field", className].join(" ")}
      {...control}
    />
  );
}

/** Plain, the label above in the text weight, the hint or the error under it, all flush with the typed text. */
export function FieldPlainBody({ id, noteId, label, note, error, disabled, children }: FieldBodyProps) {
  return (
    <div data-body="plain" className="grid content-start gap-1">
      <label htmlFor={id} className={"text-small " + (disabled ? "text-fg-disabled" : "text-fg")}>
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
