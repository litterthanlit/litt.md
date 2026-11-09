/**
 * Input, the Flat body (proposals/worlds.md, Bodies): ink on paper. Nothing stands and nothing is framed.
 *
 * - The field is a grey pill (--cut is --surface-3, at --radius-control, which Flat sets to a pill) with no outline and no shade; a textarea can
 *   hold lines, so it rounds to --radius-surface instead. Typed text is the text weight in --field-ink.
 * - The label is words above in ink at the title weight (--weight-title), the hint plain grey words below
 *   (--fg-subtle). Both are set in from the edge by the pill's padding, so the words line up with the text typed
 *   inside it. No plate, no rule, no card: space is the only divider.
 * - Focus is the ink ring, the one line the field ever draws. An error draws no ring: its words are in --danger and
 *   the pill's fill tints toward --danger, on the color tier. The error never relies on the tint alone; the words and
 *   aria-invalid say it. On focus an invalid pill shows the same ink ring.
 * - Disabled lies flat on --surface-2, its words --fg-disabled.
 * - Forced colors drops fills and shadows, so the pill gets a real border and focus an outline.
 * - A host's className (a width) lands on the pill itself, which sits in a grid column at full width; the label and
 *   the note are not affected.
 */
import type { FieldBodyProps, InputBodyProps, InputSize, TextareaBodyProps } from "../input";

const flatField =
  "w-full min-w-0 bg-field font-normal text-field-ink placeholder:text-field-ink-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) shadow-none " +
  "transition-[box-shadow,background-color] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-none focus-visible:shadow-(--focus-ring) " +
  "aria-invalid:bg-[color-mix(in_oklab,var(--danger)_12%,var(--cut))] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:placeholder:text-fg-disabled " +
  "forced-colors:border forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-offset-2";

/* The text starts a little past the pill's curve, so the words clear the round end. */
const inputSizes: Record<InputSize, string> = {
  sm: "h-control-sm px-[calc(var(--control-pad-sm)+4px)] text-small pointer-coarse:h-control-md",
  md: "h-control-md px-[calc(var(--control-pad-md)+4px)] text-body",
  lg: "h-control-lg px-[calc(var(--control-pad-lg)+4px)] text-(length:--control-text-lg)",
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

/** Flat, the label in ink above the pill, the hint in grey or the error in danger under it, set in to the typed text. */
export function FieldFlatBody({ id, noteId, label, note, error, disabled, children }: FieldBodyProps) {
  return (
    <div data-body="flat" className="grid content-start gap-1.5">
      <label htmlFor={id} className={"px-control-pad-md text-small font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </label>
      {children}
      {note && (
        <p id={noteId} className={"px-control-pad-md text-small " + (error ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </div>
  );
}
