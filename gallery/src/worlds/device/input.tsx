/**
 * Input, the Device body (proposals/worlds.md, Bodies; material.md, 8): LCD glass set in a bezel well.
 *
 * - The well is pressed into the plate around the glass (`data-part="well"`): --tray with --tray-shade, 4px of it
 *   between the glass and the wall, at the control height (32, 44, 56), so the field takes the room it takes in Press.
 *   Its corner is Device's well radius (--radius-well, 1.05em, R9's exception) and the glass's the well's less those
 *   4px, at the same size, so the two stay concentric. The glass (`data-part="lcd"`) is --field under the LCD's sheen
 *   (--lcd) with --field-shade, in the mono (font-field). Typed text is --field-ink, the placeholder --field-ink-subtle.
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
import type { FieldBodyProps, InputBodyProps, InputSize, TextareaBodyProps } from "@/components/input";

/* The bezel. It carries the field's whole state through :has, because the element inside is the one that takes focus. */
const well =
  "min-w-0 rounded-well bg-tray p-1 shadow-(--tray-shade) " +
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
  "w-full min-w-0 rounded-[calc(var(--radius-well)-4px)] bg-field [background-image:var(--lcd)] font-field text-field-ink placeholder:text-field-ink-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) shadow-(--field-shade) outline-none " +
  "disabled:cursor-not-allowed disabled:bg-transparent disabled:[background-image:none] disabled:text-fg-disabled disabled:placeholder:text-fg-disabled disabled:shadow-none " +
  "forced-colors:border";

/* The well carries the field's type size too, so its em corner and the glass's are measured in the same em. */
const wellSizes: Record<InputSize, string> = {
  sm: "h-control-sm text-small pointer-coarse:h-control-md",
  md: "h-control-md text-body",
  lg: "h-control-lg text-(length:--control-text-lg)",
};
const wellText: Record<InputSize, string> = {
  sm: "text-small",
  md: "text-body",
  lg: "text-(length:--control-text-lg)",
};
const inputSizes: Record<InputSize, string> = {
  sm: "px-[calc(var(--control-pad-sm)-4px)] text-small",
  md: "px-[calc(var(--control-pad-md)-4px)] text-body",
  lg: "px-[calc(var(--control-pad-lg)-4px)] text-(length:--control-text-lg)",
};
const textareaSizes: Record<InputSize, string> = {
  sm: "px-[calc(var(--control-pad-sm)-4px)] py-1 text-small",
  md: "px-[calc(var(--control-pad-md)-4px)] py-2 text-body",
  lg: "px-[calc(var(--control-pad-lg)-4px)] py-3 text-(length:--control-text-lg)",
};

/** Device, the bare input: LCD glass in a bezel well. */
export function InputDeviceBody({ size, invalid, mono, className, control }: InputBodyProps) {
  return (
    <span data-body="device" data-part="well" className={["flex w-full", wellSizes[size], well, className].join(" ")} style={steps}>
      <input data-part="lcd" aria-invalid={invalid || undefined} className={[glass, "h-full", inputSizes[size], mono ? "font-mono" : ""].join(" ")} {...control} />
    </span>
  );
}

/** Device, the textarea: the same well and glass, taller. */
export function TextareaDeviceBody({ size, invalid, mono, className, control }: TextareaBodyProps) {
  return (
    <span data-body="device" data-part="well" className={["block w-full", wellText[size], well, className].join(" ")} style={steps}>
      <textarea data-part="lcd" aria-invalid={invalid || undefined} className={[glass, "block resize-y", textareaSizes[size], mono ? "font-mono" : ""].join(" ")} {...control} />
    </span>
  );
}

/** Device, the engraved label above the well, and the hint or error as a dim LCD line under it. */
export function FieldDeviceBody({ id, noteId, label, note, error, disabled, children }: FieldBodyProps) {
  return (
    <div data-body="device" className="grid gap-2">
      <label htmlFor={id} data-part="lettering" className={"litt-legend text-caption font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </label>
      {children}
      {note && (
        <p
          id={noteId}
          className="flex max-w-full items-center gap-2 font-field text-caption"
        >
          {/* The error's lamp sits on the body beside the glass, an indicator on the bezel, clear of the glass's curve. */}
          {error && (
            <span
              aria-hidden="true"
              data-part="light"
              className="size-1.5 shrink-0 rounded-pill bg-signal text-signal shadow-(--lamp-glow) forced-colors:bg-[Highlight]"
            />
          )}
          <span data-part="lcd" className={"w-fit max-w-full rounded-control bg-field [background-image:var(--lcd)] px-2.5 py-1 shadow-(--field-shade) forced-colors:border " + (error ? "text-field-ink" : "text-field-ink-subtle")}>{note}</span>
        </p>
      )}
    </div>
  );
}
