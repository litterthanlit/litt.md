/**
 * NumberField, the Flat body (proposals/worlds.md, Bodies; material.md, 7): one grey pill around three words. The
 * figure sits in the middle in ink at the title weight (its unit after it in grey), and − and + are the words either
 * side, set in ink with no fill until a hand is over them. Nothing is nested, nothing is framed and nothing casts: no
 * bubble inside the pill, no icons, no seam. At a bound its word goes grey and light, so the end that cannot move is
 * the one in weaker ink. Focus is the ink ring on the pill, an error the danger ring.
 */
import type { NumberFieldBodyProps } from "../number-field";

/* The pill: the Input's floor with no line, the ring and the danger ring as its only edges. */
const pill =
  "relative flex w-full min-w-0 items-center rounded-pill bg-field p-1 font-field text-field-ink " +
  "transition-[box-shadow] duration-(--dur-instant) ease-litt " +
  "has-[input:focus-visible]:shadow-(--focus-ring) " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-2 data-[disabled]:text-fg-disabled " +
  "forced-colors:border forced-colors:has-[input:focus-visible]:outline-2 forced-colors:has-[input:focus-visible]:outline-solid forced-colors:has-[input:focus-visible]:outline-offset-2";
/* The pill's edge at rest: none, or the danger ring on an error. One or the other, never both on the pill: two shadows
   under no variant have the same specificity, so Tailwind's order would pick between them, not this file's. */
const pillRest = " shadow-none";
const pillInvalid = " shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)]";

/* A word on the pill: a round target, no fill until the pointer is over it. At its bound it is grey and light. */
const word =
  "litt-target relative grid shrink-0 place-items-center rounded-pill font-title select-none [-webkit-tap-highlight-color:transparent] " +
  "transition-[background-color,color] duration-(--dur-instant) ease-litt " +
  "enabled:cursor-pointer enabled:bg-transparent enabled:text-fg enabled:hover:bg-(--block-hover) " +
  "disabled:cursor-not-allowed disabled:font-normal disabled:text-fg-disabled";

/** Flat, the page: one grey pill, − the figure +, set as words. */
export function NumberFieldFlatBody({ sz, invalid, disabled, unit, input, inputRef, minus, plus, onFieldClick }: NumberFieldBodyProps) {
  const type = sz.type + " pointer-coarse:text-(length:--control-text-lg)";
  return (
    <div
      data-body="flat"
      data-invalid={invalid ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={pill + (invalid && !disabled ? pillInvalid : pillRest) + " " + sz.field}
      onClick={onFieldClick}
    >
      <button {...minus} className={word + " order-1 " + sz.step + " " + type}>
        <span aria-hidden="true">−</span>
      </button>
      <span className="order-2 flex min-w-0 flex-1 items-baseline justify-center gap-1.5 px-1">
        <input
          ref={inputRef}
          {...input}
          className={"field-sizing-content min-w-[2ch] max-w-full bg-transparent text-center font-title tabular-nums outline-none placeholder:text-field-ink-subtle disabled:cursor-not-allowed disabled:font-normal " + type}
        />
        {unit && (
          <span aria-hidden="true" className={"shrink-0 " + (disabled ? "text-fg-disabled " : "text-field-ink-subtle ") + type}>
            {unit}
          </span>
        )}
      </span>
      <button {...plus} className={word + " order-3 " + sz.step + " " + type}>
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
