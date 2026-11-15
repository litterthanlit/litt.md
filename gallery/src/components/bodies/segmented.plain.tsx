/**
 * Segmented control, Plain's body (proposals/plain.md, Quiet): a choice of words, the chosen one held in brackets.
 *
 * - The chosen word is --fg inside four 4px corner marks; every other is --fg-muted, and comes to --fg under the hand.
 *   Nothing else is drawn: no tray, no bubble, no frame, no underline. Space parts the words, and their hit areas
 *   touch, so a pointer never lands between two.
 * - Disabled words are --fg-disabled; a disabled chosen word keeps its brackets.
 * - The radios under the words carry the choice, the keys and the name a form sends; the --focus outline round the
 *   word shows keyboard focus.
 * - Nothing glides: the choice changes the moment you make it.
 */
import type { SegmentedBodyProps, SegmentedSize } from "../segmented";

const sizes: Record<SegmentedSize, { track: string; segment: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", segment: "text-caption pointer-coarse:text-small" },
  md: { track: "h-control-md", segment: "text-small" },
};

/* Four corner marks, each two 1px bars 4px long, in the word's color. */
const brackets =
  "pointer-events-none absolute -inset-x-2 -inset-y-1.5 bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

/** Plain, the words: the chosen one in the ink and the brackets, the rest in grey. */
export function SegmentedPlainBody({ legend, showLegend, name, value, options, size, block, disabled, className, select }: SegmentedBodyProps) {
  const look = sizes[size];
  return (
    <fieldset data-body="plain" disabled={disabled} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={showLegend ? "mb-1 p-0 text-small text-fg" : "sr-only"}>{legend}</legend>
      <div className={"flex " + (block ? "w-full " : "w-fit ") + look.track}>
        {options.map((o) => {
          const selected = value === o.value;
          const off = disabled || !!o.disabled;
          return (
            <label
              key={o.value}
              className={
                "litt-target group/word relative grid h-full select-none place-items-center px-3 " +
                "[-webkit-tap-highlight-color:transparent] " +
                (block ? "flex-1 " : "") +
                look.segment +
                (off ? " cursor-not-allowed text-fg-disabled" : selected ? " cursor-default text-fg" : " cursor-pointer text-fg-muted hover:text-fg")
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
                  select(o.value);
                }}
              />
              <span className="litt-trim relative peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-focus">
                {selected && <span aria-hidden="true" className={brackets} />}
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
