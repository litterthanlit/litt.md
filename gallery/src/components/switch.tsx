/**
 * Switch (components.md, "Switch"): an on or off setting that takes effect as a setting.
 *
 * - Built on @radix-ui/react-switch. The root is a <button role="switch"> with aria-checked,
 *   Space toggles it, and inside a <form> a hidden input sends the value like a checkbox:
 *   the value when on, nothing when off. The hidden input is Radix's, so name, value and
 *   required are passed straight to it.
 * - A pill track, 36 by 20, with a 16px round thumb inset 2px (litt.md v0.9). Off: a
 *   --surface-1 track with the --line-control edge and a --line-control thumb, at the start.
 *   On: an --fg track and a --canvas thumb, at the end. Never the accent (P1): a form can
 *   hold many switches, and the accent stays on the one primary action. Position, fill and
 *   thumb color all change, so color is never the only signal.
 * - No invalid state. A choice that can be wrong, such as accepting terms, is a Checkbox.
 * - The label is a real <label for> stretched over the whole row, so a click anywhere in it
 *   toggles the switch. Its accessible name is only its text, and the description is linked
 *   with aria-describedby. By default the switch comes first, like the checkbox. With
 *   align="end" the label and description come first and the switch sits at the row's end,
 *   so the switches of a settings list line up in one column.
 * - Motion: the instant tier only. The thumb slides by translate and the fills fade. The
 *   box never moves. Hover and press show a wash over the track.
 * - Touch: rows are at least 44px tall on coarse pointers.
 * - Forced colors drops box-shadow and background colors, so the track gets a real border and
 *   system colors mark the on state.
 */
import { useId, type ReactNode, type Ref } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

export type SwitchAlign = "start" | "end";

export type SwitchProps = {
  /** The label, beside the switch. Required, because a switch alone has no name. The whole row is clickable. */
  label: ReactNode;
  /** A line of detail under the label. It is linked to the switch with aria-describedby. */
  description?: ReactNode;
  /** Whether the switch is on, when you control it. Pair it with onCheckedChange. */
  checked?: boolean;
  /** Whether the switch starts on, when you do not control it. */
  defaultChecked?: boolean;
  /** Called with the new state each time the switch is toggled, by click, tap, label or Space. */
  onCheckedChange?: (checked: boolean) => void;
  /** Mutes the row, skips it in the tab order and keeps a form from sending it. */
  disabled?: boolean;
  /** Marks the switch as required, for a form that must have it on. It sets aria-required. */
  required?: boolean;
  /** The name a form sends the value under. A form sends it only while the switch is on. */
  name?: string;
  /** What a form sends while the switch is on. */
  value?: string;
  /** The id of the switch, which the label points at. Made up for you when left out. */
  id?: string;
  /** "start" puts the switch first, then the label, like the checkbox. "end" puts the label first and the switch at the end of a full-width row, for settings lists. */
  align?: SwitchAlign;
  /** Extra classes for the row, such as a width. */
  className?: string;
  /** The switch button, for focus or a form library. */
  ref?: Ref<HTMLButtonElement>;
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The track is the button. Its edge is an inset box-shadow, which fades with the fill. The row's label is stretched over the
   whole row, so the track sits above it (z-1) and a click on the track itself still lands on the button. */
const trackBase =
  "peer relative z-1 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center self-start rounded-pill p-0.5 " +
  "bg-surface-1 shadow-[inset_0_0_0_1px_var(--line-control)] " +
  "transition-[background-color,box-shadow] duration-(--dur-instant) ease-litt " +
  "data-[state=checked]:bg-fg data-[state=checked]:shadow-none " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "disabled:data-[state=checked]:bg-surface-3 disabled:data-[state=checked]:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border forced-colors:p-px forced-colors:data-[state=checked]:bg-[Highlight] " + // the border is real, so the padding gives it back its px
  focusRing;

/* The thumb slides 16px: the track's 36, less 2px of inset on each side, less its own 16. Tailwind's translate-* sets the CSS
   `translate` property, so the transition names `translate`. */
const thumb =
  "pointer-events-none block size-4 rounded-pill bg-line-control " +
  "transition-[translate,background-color] duration-(--dur-instant) ease-litt " +
  "data-[state=checked]:translate-x-4 data-[state=checked]:bg-canvas " +
  "data-disabled:bg-fg-disabled data-disabled:data-[state=checked]:bg-fg-disabled " +
  "forced-colors:bg-[ButtonText] forced-colors:data-[state=checked]:bg-[HighlightText] " + // a token color would be forced to the canvas, so the thumb names system colors
  "forced-colors:data-disabled:bg-[GrayText] forced-colors:data-disabled:data-[state=checked]:bg-[GrayText]";

/* Hover and press, as a wash over the track. It is not tied to the button's own :hover, because the row is the target.
   When on, the track is --fg, so an --fg wash would not show: the wash there is --canvas instead. */
const wash =
  "pointer-events-none relative z-1 row-start-1 h-5 w-9 self-start rounded-pill bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] opacity-0 " +
  "transition-[opacity,background-color] duration-(--dur-instant) ease-litt " +
  "group-hover/switch:opacity-100 group-active/switch:bg-[color-mix(in_oklab,var(--fg)_10%,transparent)] group-active/switch:opacity-100 " +
  "peer-data-[state=checked]:bg-[color-mix(in_oklab,var(--canvas)_12%,transparent)] " +
  "group-active/switch:peer-data-[state=checked]:bg-[color-mix(in_oklab,var(--canvas)_20%,transparent)] " +
  "peer-disabled:hidden forced-colors:hidden";

/** One switch with its label. Use checked and onCheckedChange to control it, or defaultChecked to leave it alone. */
export function Switch({
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  required,
  name,
  value,
  id: idProp,
  align = "start",
  className = "",
  ref,
}: SwitchProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const descriptionId = description ? `${id}-description` : undefined;
  const end = align === "end";

  return (
    <div
      className={
        "group/switch relative grid select-none " +
        (end ? "w-full grid-cols-[1fr_auto] gap-x-4 py-3 " : "w-fit grid-cols-[auto_1fr] gap-x-2 py-2 pointer-coarse:py-3 ") +
        className
      }
    >
      <SwitchPrimitive.Root
        ref={ref}
        id={id}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        required={required}
        name={name}
        value={value}
        aria-describedby={descriptionId}
        className={trackBase + (end ? " col-start-2 row-start-1" : " col-start-1 row-start-1")}
      >
        <SwitchPrimitive.Thumb className={thumb} />
      </SwitchPrimitive.Root>
      <span aria-hidden="true" className={wash + (end ? " col-start-2" : " col-start-1")} />
      {/* The label is stretched over the whole row, so a click anywhere in it toggles the switch. */}
      <label
        htmlFor={id}
        className={
          "row-start-1 min-h-5 cursor-pointer text-small [font-weight:var(--weight)] text-fg after:absolute after:inset-0 peer-disabled:cursor-not-allowed peer-disabled:text-fg-disabled " +
          (end ? "col-start-1" : "col-start-2")
        }
      >
        {label}
      </label>
      {description && (
        <p
          id={descriptionId}
          /* A disabled switch keeps its description at --fg-subtle: it is often what says why the switch is off-limits. */
          className={"row-start-2 mt-1 text-small text-fg-subtle " + (end ? "col-start-1" : "col-start-2")}
        >
          {description}
        </p>
      )}
    </div>
  );
}
