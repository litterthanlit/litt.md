/**
 * NumberField, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a flat square dark value box flanked
 * by sharp square − and + keys, with four 6px amber corner brackets snapping on when focused.
 *
 * - Square corners (`rounded-none`), crisp 1px borders (`--line-control` on the field, `--line` on step keys), zero
 *   inset shadows or casts.
 * - Focus takes the 2px `--focus` outline and lights four 6px amber corner brackets around the value box; errors switch
 *   its border to `--danger`.
 * - At a bound or disabled, a step key lies flat on `--surface-2` with `--fg-disabled`.
 */
import { MinusIcon, PlusIcon } from "@/components/icons";
import type { NumberFieldBodyProps } from "@/components/number-field";

const brackets =
  "pointer-events-none absolute inset-0 opacity-0 bg-no-repeat text-accent-text " +
  "transition-opacity duration-(--dur-instant) ease-litt " +
  "group-has-[input:focus-visible]/box:opacity-100 group-data-[disabled]/box:opacity-0 " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const box =
  "group/box relative flex min-w-0 flex-1 items-center rounded-none border border-line-control bg-field font-field font-normal text-field-ink " +
  "transition-[border-color] duration-(--dur-instant) ease-litt " +
  "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus " +
  "data-[invalid]:border-danger " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:border-line data-[disabled]:bg-surface-2 data-[disabled]:text-fg-disabled " +
  "forced-colors:border";

const key =
  "litt-target relative grid h-full w-8 pointer-coarse:w-auto pointer-coarse:aspect-square shrink-0 place-items-center select-none rounded-none border [-webkit-tap-highlight-color:transparent] " +
  "transition-[background-color,color,border-color] duration-(--dur-instant) ease-litt forced-colors:border " +
  "enabled:cursor-pointer enabled:border-line enabled:bg-block enabled:text-fg enabled:hover:border-line-strong enabled:hover:bg-(--block-hover) enabled:hover:text-accent-text " +
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-fg-disabled";

/** Heat, the numeric readout with flat square − and + keys beside it. */
export function NumberFieldHeatBody({ sz, invalid, disabled, unit, input, inputRef, minus, plus, onFieldClick }: NumberFieldBodyProps) {
  return (
    <div data-body="heat" className={"flex min-w-0 items-stretch gap-1 " + sz.field} onClick={onFieldClick}>
      <div data-invalid={invalid ? "" : undefined} data-disabled={disabled ? "" : undefined} className={box}>
        <span aria-hidden="true" className={brackets} />
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
