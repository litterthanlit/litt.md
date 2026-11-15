/**
 * NumberField, the Rack body (proposals/rack.md): a value box, as an instrument shows a number you can also step.
 *
 * - The figure sits in a light box (--cut through --field) in a 1px control line (--line-control), square at the control
 *   radius, no shade, the number in tabular figures at the text weight with its unit after it in --field-ink-subtle.
 *   Focus turns the line to --focus and adds the focus ring, an error the --danger line, both on the instant tier.
 * - − and + are two small flat keys beside the box, 4px from it and from each other, each the box's height square: a
 *   key (--block) in the 1px outline of --block-lift, the sign in the ink. Hover lightens the fill, a press darkens the
 *   outline (--block-press), on the frame; a key never moves or sinks. At a bound its key lies flat, --surface-2 with a
 *   --line hairline and --fg-disabled sign, so the end that cannot move is the quiet one.
 * - Nothing animates: the value changes at once. A held key repeats and the keys never take focus, as the contract says.
 * - Forced colors drops shadows, so the box and the keys get real borders and focus an outline.
 */
import { MinusIcon, PlusIcon } from "@/components/icons";
import type { NumberFieldBodyProps } from "../number-field";

const box =
  "relative flex min-w-0 flex-1 items-center rounded-control bg-field font-field font-normal text-field-ink " +
  "shadow-[inset_0_0_0_1px_var(--field-line)] " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[input:focus-visible]:shadow-[inset_0_0_0_1px_var(--focus),var(--focus-ring)] " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-2 data-[disabled]:text-fg-disabled data-[disabled]:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border forced-colors:has-[input:focus-visible]:outline-2 forced-colors:has-[input:focus-visible]:outline-solid forced-colors:has-[input:focus-visible]:outline-offset-2";
/* One edge at a time on the box, so the danger line and the plain one never meet. */
const boxInvalid =
  " data-[invalid]:shadow-[inset_0_0_0_1px_var(--danger)] data-[invalid]:has-[input:focus-visible]:shadow-[inset_0_0_0_1px_var(--danger),var(--focus-ring)]";

const key =
  "litt-target relative grid h-full aspect-square shrink-0 place-items-center select-none rounded-control [-webkit-tap-highlight-color:transparent] " +
  "transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
  "enabled:cursor-pointer enabled:bg-block enabled:text-fg enabled:shadow-(--block-lift) enabled:forced-colors:border " +
  "enabled:hover:bg-(--block-hover) enabled:active:shadow-(--block-press) " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:shadow-[inset_0_0_0_1px_var(--line)] forced-colors:border";

/** Rack, the value box with − and + as small keys beside it. */
export function NumberFieldRackBody({ sz, invalid, disabled, unit, input, inputRef, minus, plus, onFieldClick }: NumberFieldBodyProps) {
  return (
    <div data-body="rack" className={"flex min-w-0 items-stretch gap-1 " + sz.field} onClick={onFieldClick}>
      <div data-invalid={invalid ? "" : undefined} data-disabled={disabled ? "" : undefined} className={box + boxInvalid}>
        <input
          ref={inputRef}
          {...input}
          className={
            "h-full min-w-0 flex-1 bg-transparent tabular-nums outline-none placeholder:text-field-ink-subtle disabled:cursor-not-allowed " +
            "pointer-coarse:text-(length:--control-text-lg) " +
            sz.pad +
            " " +
            sz.type
          }
        />
        {unit && (
          <span aria-hidden="true" className={"shrink-0 pr-2 pl-1 pointer-coarse:text-(length:--control-text-lg) " + (disabled ? "text-fg-disabled " : "text-field-ink-subtle ") + sz.type}>
            {unit}
          </span>
        )}
      </div>
      <button {...minus} data-dir="minus" className={key}>
        <MinusIcon />
      </button>
      <button {...plus} data-dir="plus" className={key}>
        <PlusIcon />
      </button>
    </div>
  );
}
