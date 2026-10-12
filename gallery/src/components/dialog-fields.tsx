/**
 * Form fields for dialogs and sheets: a labelled text input and a segmented
 * radio group. Built on native inputs, so roles and arrow keys come for free.
 *
 * - Inputs sit on the control scale (44px), edge --line-control, with the control radius.
 *   Text is 15px, and 16px on coarse pointers so iOS never zooms.
 * - Focus: the edge turns --focus and the ring appears (:focus-visible only).
 * - Segmented radio: a group of two or more radios in one hairline box.
 *   Selected changes fill and color only, so no box ever moves.
 */
import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  /** The label above the field. Required, because a placeholder is not a label. Clicking it focuses the input. */
  label: ReactNode;
  /** A hint under the field. An error replaces it. */
  help?: ReactNode;
  /** Shown in danger color and linked to the input. Say how to fix it. */
  error?: ReactNode;
  /** Geist Mono, for slugs, domains and other data. */
  mono?: boolean;
};

/** A labelled text input. The label, the hint and the error are wired to the input for you; every other input attribute goes through. */
export function TextField({ label, help, error, mono = false, className = "", ...rest }: TextFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? help;
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-small text-fg">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={
          "h-control-md w-full rounded-control bg-surface-1 px-control-pad-md text-body text-fg placeholder:text-fg-subtle " +
          "pointer-coarse:text-(length:--control-text-lg) " +
          "shadow-[inset_0_0_0_1px_var(--line-control)] focus-visible:outline-none " +
          "focus-visible:shadow-[inset_0_0_0_1px_var(--focus),var(--focus-ring)] " +
          "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger)] " +
          "aria-invalid:focus-visible:shadow-[inset_0_0_0_1px_var(--danger),var(--focus-ring)] " +
          "disabled:bg-surface-2 disabled:text-fg-disabled " +
          (mono ? "font-mono " : "") +
          className
        }
        {...rest}
      />
      {note && (
        <p id={noteId} className={"text-small " + (error ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </div>
  );
}

export type SegmentedOption<T extends string> = { value: T; label: ReactNode };

/** A group of two or more native radios in one hairline box, for a short choice such as Viewer or Editor. */
export function SegmentedRadio<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  /** The group's label, shown above it and read as its name. */
  legend: ReactNode;
  /** The radios' shared name, unique in the form. It is what makes the arrow keys move between them. */
  name: string;
  /** The value of the selected option. */
  value: T;
  /** Called with the picked option's value. */
  onChange: (value: T) => void;
  /** The choices, in order. Each has a value and a label. Give it two or more. */
  options: SegmentedOption<T>[];
}) {
  const labelId = useId();
  return (
    <div className="grid gap-2">
      <span id={labelId} className="text-small text-fg">
        {legend}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="relative grid overflow-hidden rounded-control"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => (
          <label
            key={o.value}
            className={
              "relative flex h-control-md cursor-pointer items-center justify-center px-control-pad-md text-body text-fg-subtle " +
              "transition-[background-color,color] duration-(--dur-instant) ease-litt hover:text-fg " +
              "not-first:border-l not-first:border-line-control " +
              "has-checked:bg-surface-3 has-checked:text-fg " +
              "has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-focus"
            }
          >
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span className="litt-trim">{o.label}</span>
          </label>
        ))}
        {/* The hairline sits above the fills, so a selected segment never hides it. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-control shadow-[inset_0_0_0_1px_var(--line-control)]"
        />
      </div>
    </div>
  );
}
