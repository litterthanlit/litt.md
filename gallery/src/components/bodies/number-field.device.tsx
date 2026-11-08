/**
 * NumberField, the Device body (proposals/worlds.md, Bodies; material.md, 8): an LCD readout with keys.
 *
 * - A bezel well (--tray, --tray-shade) the field's height holds three things in a row, 4px in from its walls: a key
 *   for −, the glass, a key for +. The keys are beside the glass, not inside it.
 * - The glass (--field, --field-shade, the mono through font-field): the figure at the text size with tabular figures,
 *   right-aligned the way a readout is, its unit after it in --field-ink-subtle. It is the one spinbutton; the text
 *   takes the focus ring on the well, and an error puts the danger line on the well.
 * - A key (--block, --key-lift: its face, a dark rim and a 2px skirt), square at the field's height less 8px, with
 *   corners the well's radius less its inset so the two stay concentric. Pressed, it sinks the whole --press-depth
 *   (2px) and its cast steps down (--block-press) on the instant tier, and a held key repeats as the contract says.
 *   Fun mode's deeper sink is not used: a key travels 2px. At its bound a key lies flat: --surface-2 with a hairline
 *   and --fg-disabled glyph.
 * - Motion: nothing glides. The value changes at once, the key's sink and fill step on the instant tier, and reduced
 *   motion zeroes the tier.
 * - Forced colors drops shadows and fills, so the well, the glass and the keys get real borders.
 */
import type { NumberFieldBodyProps } from "../number-field";
import { MinusIcon, PlusIcon } from "@/components/icons";

/* The bezel is cut into the body. It clips the keys' cast, so nothing spills past its walls. */
const well =
  "relative flex w-full min-w-0 items-center gap-1 overflow-hidden rounded-control p-1 " +
  "bg-tray shadow-(--tray-shade) " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-2 data-[disabled]:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border";
const wellInvalid = " shadow-[inset_0_0_0_1px_var(--danger),var(--tray-shade)]";

/* The glass, concentric with the well: the same radius as a key. */
const glass =
  "flex min-w-0 flex-1 items-center self-stretch rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))] " +
  "bg-field font-field text-field-ink shadow-(--field-shade) " +
  "has-[input:disabled]:bg-transparent has-[input:disabled]:text-fg-disabled has-[input:disabled]:shadow-none " +
  "forced-colors:border";

/* A key on its skirt. Its sink and fill step on the instant tier. */
const key =
  "litt-target relative grid shrink-0 place-items-center rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))] select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-[background-color,color,transform,box-shadow] duration-(--dur-instant) ease-litt " +
  "enabled:cursor-pointer enabled:bg-block enabled:text-fg enabled:shadow-(--key-lift) enabled:forced-colors:border " +
  "enabled:hover:bg-(--block-hover) " +
  "enabled:active:shadow-(--block-press) enabled:active:[transform:translateY(var(--press-depth))] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:shadow-[inset_0_0_0_1px_var(--line)] disabled:forced-colors:border";

/** Device: a readout on LCD glass in a bezel well, with − and + as keys beside the glass. */
export function NumberFieldDeviceBody({ sz, invalid, disabled, unit, input, inputRef, minus, plus, onFieldClick }: NumberFieldBodyProps) {
  return (
    <div
      data-body="device"
      data-invalid={invalid ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={well + (invalid && !disabled ? wellInvalid : "") + " " + sz.field}
      onClick={onFieldClick}
    >
      <button {...minus} className={key + " " + sz.step}>
        <MinusIcon />
      </button>
      <span className={glass}>
        <input
          ref={inputRef}
          {...input}
          className={
            "h-full min-w-0 flex-1 bg-transparent text-right tabular-nums outline-none placeholder:text-field-ink-subtle disabled:cursor-not-allowed " +
            "pointer-coarse:text-(length:--control-text-lg) " +
            "pl-2 " +
            (unit ? "pr-0 " : "pr-2 ") +
            sz.type
          }
        />
        {unit && (
          <span aria-hidden="true" className={"shrink-0 pr-2 pl-1.5 pointer-coarse:text-(length:--control-text-lg) " + (disabled ? "text-fg-disabled " : "text-field-ink-subtle ") + sz.type}>
            {unit}
          </span>
        )}
      </span>
      <button {...plus} className={key + " " + sz.step}>
        <PlusIcon />
      </button>
    </div>
  );
}
