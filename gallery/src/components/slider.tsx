/**
 * Slider (components.md, "Slider"): one value on a continuous range, such as the default
 * animation speed. Built on Radix Slider (one thumb), which gives the role, the keys and the
 * pointer maths. litt owns the look, the label row and the end words.
 *
 * - Rail: 4px, the control radius, filled at fg 12%. The range from the start to the thumb is
 *   --fg, never the accent (P1): a form can hold many sliders, and the accent stays on the one
 *   primary action. The thumb is a 20px circle (a slider thumb is a circle, v0.9) in --surface-1
 *   with an inset --line-control edge and the top highlight, --surface-2 on hover.
 * - Label: above, like the Input's. The value can sit at the end of the label row in the mono
 *   at the small size. Words for the two ends sit under the rail ("Slower", "Faster").
 * - The label names the thumb (aria-labelledby), the help text describes it, and formatValue
 *   feeds both the visible value and aria-valuetext.
 * - Motion: none on the position. The thumb and the range follow the pointer and the keys at
 *   once, because position is a layout value and an eased jump would lag the input. Only colors
 *   fade, on the instant tier. The thumb never changes size on hover, focus or drag.
 * - Keys: arrows step, Home and End go to the ends, Page Up and Page Down move about a tenth of
 *   the range (whole steps, never fewer than one). The focus ring is :focus-visible only.
 * - Touch: the hit area is 44px tall on coarse pointers. The row grows, the rail does not. The
 *   slider owns horizontal drags: it is marked data-no-drag, so a sheet never moves under it,
 *   and its touch-action leaves vertical scrolling to the page.
 * - Disabled: the rail at fg 6%, the range --fg-disabled, the thumb --surface-2 with a --line edge.
 * - Forced colors drops box-shadow, so the rail and the thumb get real borders.
 */
import { useId, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import * as RadixSlider from "@radix-ui/react-slider";

export type SliderProps = {
  /** The label above the slider. Required, because it names the thumb for screen readers. */
  label: ReactNode;
  /** A hint under the slider, linked to the thumb with aria-describedby. */
  help?: ReactNode;
  /** The value, when you control it. Pair it with onValueChange. */
  value?: number;
  /** The value it starts at when you do not control it. Without one, it starts at min. */
  defaultValue?: number;
  /** Called with the new value on every move of the thumb, by pointer or key. */
  onValueChange?: (value: number) => void;
  /** Called with the final value when a drag is released, or right after a key moves the thumb. Use it to save. */
  onValueCommit?: (value: number) => void;
  /** The lowest value, at the start of the rail. */
  min?: number;
  /** The highest value, at the end of the rail. */
  max?: number;
  /** The gap between values. The thumb snaps to it, and an arrow key moves one step. */
  step?: number;
  /** A word under the start of the rail, such as "Slower". Say which way is which. */
  minLabel?: ReactNode;
  /** A word under the end of the rail, such as "Faster". */
  maxLabel?: ReactNode;
  /** Shows the value at the end of the label row, in the mono. Off by default. */
  showValue?: boolean;
  /** Turns a value into text, such as 1 into "1.0x". It feeds the shown value and aria-valuetext. Without it, the number is shown as it is. */
  formatValue?: (value: number) => string;
  /** Makes the slider unavailable: muted, skipped by Tab, and left out of a form, like a native field. */
  disabled?: boolean;
  /** The field name a form sends the value under. */
  name?: string;
  /** The id of the thumb, when you need your own. The label and the help text derive their ids from it. */
  id?: string;
  /** Extra classes for the wrapper, such as a width. */
  className?: string;
  /** The thumb, for focus or a form library. */
  ref?: Ref<HTMLSpanElement>;
};

/* The hit area: the thumb's own height on a fine pointer, 44px on a coarse one. The rail stays centered and 4px. */
const root =
  "relative flex h-5 w-full touch-pan-y select-none items-center pointer-coarse:h-control-md " +
  "cursor-pointer data-disabled:cursor-not-allowed";

const rail =
  "relative h-1 grow rounded-control bg-[color-mix(in_oklab,var(--fg)_12%,transparent)] " +
  "transition-[background-color] duration-(--dur-instant) ease-litt " +
  "data-disabled:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
  /* Forced colors drops background colors and box-shadow, so the rail is outlined and the range takes a system color. */
  "forced-colors:border";

const range =
  "absolute h-full rounded-control bg-fg " +
  "transition-[background-color] duration-(--dur-instant) ease-litt " +
  "data-disabled:bg-fg-disabled " +
  "forced-colors:bg-[Highlight]";

const thumb =
  "block size-5 rounded-pill bg-surface-1 " +
  "shadow-[inset_0_0_0_1px_var(--line-control),var(--highlight)] " +
  "transition-[background-color,box-shadow] duration-(--dur-instant) ease-litt " +
  "hover:bg-surface-2 pointer-coarse:active:bg-surface-2 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
  "data-disabled:bg-surface-2 data-disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border";

/** How many digits a number needs after the point, so snapping to a step of 0.1 never leaves 0.30000000000000004. */
function places(n: number) {
  return (String(n).split(".")[1] ?? "").length;
}

/** One slider: a label above, a rail with one thumb, and optional words under its ends. Every value is a number, and a form sends it under name. */
export function Slider({
  label,
  help,
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  minLabel,
  maxLabel,
  showValue = false,
  formatValue,
  disabled = false,
  name,
  id: idProp,
  className = "",
  ref,
}: SliderProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const labelId = `${id}-label`;
  const helpId = help ? `${id}-help` : undefined;

  /* The slider keeps its own value when you do not control it, because Page Up needs to read it. */
  const [inner, setInner] = useState(defaultValue ?? min);
  const value = valueProp ?? inner;
  const text = formatValue ? formatValue(value) : String(value);

  const change = (next: number | undefined) => {
    if (next === undefined) return;
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
  };

  /* Radix moves ten steps on Page Up and Page Down. The spec says about a tenth of the range, in whole steps. */
  const pageKeys = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (disabled || (event.key !== "PageUp" && event.key !== "PageDown")) return;
    event.preventDefault();
    const pages = Math.max(1, Math.round((max - min) / step / 10));
    const raw = value + (event.key === "PageUp" ? 1 : -1) * pages * step;
    const snapped = Math.round((raw - min) / step) * step + min;
    const next = Math.min(max, Math.max(min, Number(snapped.toFixed(Math.max(places(step), places(min))))));
    if (next === value) return;
    change(next);
    onValueCommit?.(next);
  };

  return (
    <div className={["grid gap-2", className].join(" ")}>
      <div className="flex items-baseline justify-between gap-4">
        <span id={labelId} className={"text-small " + (disabled ? "text-fg-disabled" : "text-fg")}>
          {label}
        </span>
        {showValue && (
          <span aria-hidden="true" className={"font-mono text-small tabular-nums " + (disabled ? "text-fg-disabled" : "text-fg-muted")}>
            {text}
          </span>
        )}
      </div>
      <div className="grid gap-1">
        <RadixSlider.Root
          name={disabled ? undefined : name}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={[value]}
          onValueChange={(v) => change(v[0])}
          onValueCommit={(v) => v[0] !== undefined && onValueCommit?.(v[0])}
          onKeyDown={pageKeys}
          data-no-drag=""
          className={root}
        >
          <RadixSlider.Track className={rail}>
            <RadixSlider.Range className={range} />
          </RadixSlider.Track>
          <RadixSlider.Thumb
            ref={ref}
            id={id}
            aria-labelledby={labelId}
            aria-describedby={helpId}
            aria-valuetext={formatValue ? text : undefined}
            className={thumb}
          />
        </RadixSlider.Root>
        {(minLabel || maxLabel) && (
          <div className={"flex justify-between gap-4 text-caption " + (disabled ? "text-fg-disabled" : "text-fg-subtle")}>
            <span>{minLabel}</span>
            <span className="text-right">{maxLabel}</span>
          </div>
        )}
      </div>
      {help && (
        <p id={helpId} className="text-small text-fg-subtle">
          {help}
        </p>
      )}
    </div>
  );
}
