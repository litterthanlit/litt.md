/**
 * Segmented control (components.md, "Segmented control"): a short choice of two to five
 * options, in one track. Built from a fieldset and native radio inputs, so the role, the
 * arrow keys and the form value come from the browser.
 *
 * - Track: --radius-surface (8), fill at fg 5%, inset --line edge, 4px padding. The
 *   segments inside sit at --radius-control (4), so the corners stay concentric.
 * - Segment: --fg-subtle, and --fg on hover. The selected one gets --surface-1, --fg, an
 *   inset --line and --highlight. Labels at the title weight (P9), and no segment changes size when selected.
 * - Sizes are on the control scale: sm is a 32px track with caption text (the spec), md is a
 *   44px track with small text, for forms beside 44px inputs. On touch screens sm grows to 44px.
 * - Segments share one width (the widest label), so the selected surface keeps its shape as
 *   it moves.
 * - Motion: the selected surface glides to the picked segment on the responsive tier (it
 *   moves through transform), as in Tabs. Color changes are instant.
 * - Touch: there is no hover, so on a coarse pointer an unselected segment that is held down fills
 *   (PRESS: fg 6%, color only, instant tier) and takes the --fg text. The selected one needs no fill,
 *   its surface is the answer. The box never moves. The OS tap flash is off, so the two do not double.
 * - The legend is visually hidden by default, as the spec says. Pass showLegend in a form.
 */
import { useId, useState, type ReactNode } from "react";
import { LayoutGroup, motion } from "motion/react";
import { useTransition } from "@/motion";

export type SegmentedSize = "sm" | "md";
export type SegmentedOption<T extends string> = {
  /** What onValueChange gets and what a form sends. */
  value: T;
  /** The text in the segment. Keep it to a word or two. */
  label: ReactNode;
  /** Makes this one option unavailable. The others keep working. */
  disabled?: boolean;
};

export type SegmentedProps<T extends string> = {
  /** The group's name, read out with each option. Required. Hidden from sight unless you pass showLegend. */
  legend: ReactNode;
  /** Shows the legend as a label above the track, for a form. Off by default, because a switch in a toolbar is named by its options. */
  showLegend?: boolean;
  /** The radios' shared name, which is what makes the arrow keys move between them and what a form sends. Made up for you when left out. */
  name?: string;
  /** The value of the selected option, when you control it. Pair it with onValueChange. */
  value?: T;
  /** The option that starts selected when you do not control it. Without one, the first option starts selected. */
  defaultValue?: T;
  /** Called with the picked option's value each time the selection changes, by click, tap or arrow key. */
  onValueChange?: (value: T) => void;
  /** The choices, in order. Give it two to five. */
  options: SegmentedOption<T>[];
  /** Track height on the control scale: sm is 32 with 12px text, md is 44 with 13px text. Use md in forms. */
  size?: SegmentedSize;
  /** Fills the width of its container, with equal segments. */
  block?: boolean;
  /** Disables every option, through the fieldset. */
  disabled?: boolean;
  /** Extra classes for the fieldset, such as a width. */
  className?: string;
};

/** What a finger holding an unselected segment shows: the fg 6% fill that rows and tabs share, and the hover text color. */
const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

const sizes: Record<SegmentedSize, { track: string; segment: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", segment: "px-control-pad-sm text-caption pointer-coarse:text-small" },
  md: { track: "h-control-md", segment: "px-control-pad-md text-small" },
};

/** A group of native radios in one track, for a short choice such as Viewer or Editor, or System, Light and Dark. */
export function Segmented<T extends string>({
  legend,
  showLegend = false,
  name: nameProp,
  value: valueProp,
  defaultValue,
  onValueChange,
  options,
  size = "md",
  block = false,
  disabled = false,
  className = "",
}: SegmentedProps<T>) {
  const auto = useId();
  const name = nameProp ?? auto;
  const enter = useTransition("responsive");
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? options.find((o) => !o.disabled)?.value);
  const value = valueProp ?? inner;
  const look = sizes[size];

  return (
    <fieldset disabled={disabled} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={showLegend ? "mb-2 p-0 text-small font-title text-fg" : "sr-only"}>{legend}</legend>
      <LayoutGroup id={auto}>
        <div
          className={
            "relative grid-flow-col auto-cols-fr rounded-surface bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] p-1 " +
            "shadow-[inset_0_0_0_1px_var(--line)] forced-colors:border " +
            (block ? "grid w-full " : "inline-grid ") +
            look.track
          }
        >
          {options.map((o) => {
            const selected = value === o.value;
            const off = disabled || !!o.disabled;
            return (
              <label
                key={o.value}
                className={
                  "relative grid h-full select-none place-items-center rounded-control font-title " +
                  "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                  look.segment +
                  (off
                    ? " cursor-not-allowed text-fg-disabled"
                    : " cursor-pointer " + (selected ? "text-fg" : "text-fg-subtle hover:text-fg " + PRESS))
                }
              >
                <input
                  type="radio"
                  className="peer sr-only"
                  name={name}
                  value={o.value}
                  checked={selected}
                  disabled={o.disabled}
                  onChange={() => {
                    setInner(o.value);
                    onValueChange?.(o.value);
                  }}
                />
                {selected && (
                  <motion.span
                    layoutId="segmented-surface"
                    transition={enter}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-control bg-surface-1 shadow-[inset_0_0_0_1px_var(--line),var(--highlight)] forced-colors:border-2"
                  />
                )}
                <span className="litt-trim relative z-1">{o.label}</span>
                {/* The label and the ring sit above the selected surface (z-1), so the surface never covers them while it glides. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-1 rounded-control peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
                />
              </label>
            );
          })}
        </div>
      </LayoutGroup>
    </fieldset>
  );
}
