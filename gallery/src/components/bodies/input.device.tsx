/**
 * Input, the Device body (proposals/worlds.md, Bodies; material.md, 8): LCD glass set in a bezel well.
 *
 * - The well is the bezel around the glass: --tray with --tray-shade, 2px of body between the glass and the wall, at
 *   the control height (32, 44, 56), so the field takes the room it takes in Press. The glass is --field with
 *   --field-shade in the mono (font-field), its corners the well's less those 2px, so the two stay concentric at every
 *   shape. Typed text is --field-ink, the placeholder --field-ink-subtle.
 * - Focus and an error are said on the bezel, not the glass: focus-visible draws --focus-ring around the well, an error
 *   rings it in --danger (and keeps the focus ring on focus). They switch in three steps on the instant tier, never a
 *   fade, and the box never moves. Disabled lies flat: a surface-2 well with a hairline and dimmed glass.
 * - A textarea is the same well and glass with a taller pane; its height comes from rows and it resizes vertically.
 * - The label is engraved on the body above the well (litt-legend: capitals, tracked, --engrave). The hint is a dim
 *   LCD line under it (--field, --field-ink-subtle). An error replaces it on the same glass, its words in --field-ink
 *   beside a lamp in --danger. The lamp never says the error alone: the words do, and aria-invalid and
 *   aria-describedby on the control say it to a screen reader.
 * - Forced colors drops shadows and fills, so the well and the glass get real borders, focus an outline, and the lamp
 *   is a system highlight.
 * - The contract (the real input or textarea, its label, aria-invalid, aria-describedby) is input.tsx's.
 */
import type { CSSProperties } from "react";
import type { FieldBodyProps, InputBodyProps, InputSize, TextareaBodyProps } from "../input";

/* The bezel. It carries the field's whole state through :has, because the element inside is the one that takes focus. */
const well =
  "min-w-0 rounded-control bg-tray p-0.5 shadow-(--tray-shade) " +
  "has-focus-visible:shadow-[var(--tray-shade),var(--focus-ring)] " +
  "has-[[aria-invalid=true]]:shadow-[var(--tray-shade),0_0_0_2px_var(--danger)] " +
  "has-[[aria-invalid=true]:focus-visible]:shadow-[var(--tray-shade),0_0_0_2px_var(--danger),var(--focus-ring)] " +
  "has-disabled:cursor-not-allowed has-disabled:bg-surface-2 has-disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border forced-colors:has-focus-visible:outline-2 forced-colors:has-focus-visible:outline-solid forced-colors:has-focus-visible:outline-offset-2";

/* The ring switches in three steps on the instant tier, as the switch's detent does. */
const STEPS = "steps(3, end)";
const steps: CSSProperties = { transitionProperty: "box-shadow", transitionDuration: "var(--dur-instant)", transitionTimingFunction: `${STEPS}` };

/* The glass, in the mono. It fills the well's pane. */
const glass =
  "w-full min-w-0 rounded-[calc(var(--radius-control)-2px)] bg-field font-field text-field-ink placeholder:text-field-ink-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) shadow-(--field-shade) outline-none " +
  "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-fg-disabled disabled:placeholder:text-fg-disabled disabled:shadow-none " +
  "forced-colors:border";

const wellSizes: Record<InputSize, string> = {
  sm: "h-control-sm pointer-coarse:h-control-md",
  md: "h-control-md",
  lg: "h-control-lg",
};
const inputSizes: Record<InputSize, string> = {
  sm: "px-[calc(var(--control-pad-sm)-2px)] text-small",
  md: "px-[calc(var(--control-pad-md)-2px)] text-body",
  lg: "px-[calc(var(--control-pad-lg)-2px)] text-(length:--control-text-lg)",
};
const textareaSizes: Record<InputSize, string> = {
  sm: "px-[calc(var(--control-pad-sm)-2px)] py-1.5 text-small",
  md: "px-[calc(var(--control-pad-md)-2px)] py-2.5 text-body",
  lg: "px-[calc(var(--control-pad-lg)-2px)] py-3.5 text-(length:--control-text-lg)",
};

/** Device, the bare input: LCD glass in a bezel well. */
export function InputDeviceBody({ size, invalid, mono, className, control }: InputBodyProps) {
  return (
    <span data-body="device" className={["flex w-full", wellSizes[size], well, className].join(" ")} style={steps}>
      <input aria-invalid={invalid || undefined} className={[glass, "h-full", inputSizes[size], mono ? "font-mono" : ""].join(" ")} {...control} />
    </span>
  );
}

/** Device, the textarea: the same well and glass, taller. */
export function TextareaDeviceBody({ size, invalid, mono, className, control }: TextareaBodyProps) {
  return (
    <span data-body="device" className={["block w-full", well, className].join(" ")} style={steps}>
      <textarea aria-invalid={invalid || undefined} className={[glass, "block resize-y", textareaSizes[size], mono ? "font-mono" : ""].join(" ")} {...control} />
    </span>
  );
}

/** Device, the engraved label above the well, and the hint or error as a dim LCD line under it. */
export function FieldDeviceBody({ id, noteId, label, note, error, disabled, children }: FieldBodyProps) {
  return (
    <div data-body="device" className="grid gap-2">
      <label htmlFor={id} className={"litt-legend text-caption font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </label>
      {children}
      {note && (
        <p
          id={noteId}
          className="flex w-fit max-w-full items-start gap-1.5 rounded-control bg-field px-2.5 py-1 font-field text-caption shadow-(--field-shade) forced-colors:border"
        >
          {error && (
            <span
              aria-hidden="true"
              className="mt-[5px] size-1.5 shrink-0 rounded-pill bg-danger shadow-[0_0_6px_var(--danger)] forced-colors:bg-[Highlight]"
            />
          )}
          <span className={error ? "text-field-ink" : "text-field-ink-subtle"}>{note}</span>
        </p>
      )}
    </div>
  );
}
