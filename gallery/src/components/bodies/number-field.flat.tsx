/**
 * NumberField, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md, idea C): a grey track with no
 * outline, the value (and its unit) in a --surface-1 bubble that fills it, and a round − and + either side with no fill
 * until the pointer is over them. Nothing casts and nothing travels. Focus is the ink ring on the track, an error the
 * danger ring. It is today's Flat cut, lifted out of the Press body's classes.
 */
import type { NumberFieldBodyProps } from "../number-field";
import { MinusIcon, PlusIcon } from "@/components/icons";

/* The track: the Input's floor with no line, the ring and the danger ring as its only edges. */
const track =
  "relative flex w-full min-w-0 items-center rounded-control bg-field py-1 pr-1 pl-1 font-field font-normal text-field-ink " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-2 data-[disabled]:text-fg-disabled " +
  "forced-colors:border forced-colors:has-[input:focus-visible]:outline-2 forced-colors:has-[input:focus-visible]:outline-solid forced-colors:has-[input:focus-visible]:outline-offset-2";
/* The ring is the track's only edge: the focus ring, the danger ring with an error, or none. */
const trackRing = " shadow-none has-[input:focus-visible]:shadow-(--focus-ring)";
const trackInvalid = " shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)]";

/* The bubble between the round keys. A disabled field's bubble is clear. */
const bubble =
  "order-2 flex min-w-0 flex-1 items-center self-stretch rounded-[calc(var(--radius-control)-2px)] bg-surface-1 has-[input:disabled]:bg-transparent " +
  "forced-colors:border";

/* A round key on the track: no fill until the pointer is over it. At its bound it is disabled and lies flat. */
const key =
  "litt-target relative grid shrink-0 place-items-center rounded-pill select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-[background-color,color,translate] duration-(--dur-instant) ease-litt " +
  "enabled:cursor-pointer enabled:bg-transparent enabled:text-fg enabled:forced-colors:border " +
  "enabled:hover:bg-(--block-hover) " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled";

/** Flat: the grey track, the value in a bubble, round − and + either side. */
export function NumberFieldFlatBody({ sz, invalid, disabled, unit, input, inputRef, minus, plus, onFieldClick }: NumberFieldBodyProps) {
  return (
    <div
      data-body="flat"
      data-invalid={invalid ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={track + (invalid && !disabled ? trackInvalid : trackRing) + " " + sz.field}
      onClick={onFieldClick}
    >
      <span className={bubble}>
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
      </span>
      <button {...minus} className={key + " order-1 " + sz.step}>
        <MinusIcon />
      </button>
      <button {...plus} className={key + " order-3 " + sz.step}>
        <PlusIcon />
      </button>
    </div>
  );
}
