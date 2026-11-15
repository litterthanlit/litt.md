/**
 * Segmented control, Plain's body (proposals/plain.md, No UI): a choice of words, set in a line.
 *
 * - The chosen word is --fg; every other is link blue and underlined (--accent-text), a word to pick. Nothing is
 *   drawn around any of them: no tray, no bubble, no frame. Space parts them, and their hit areas touch, so a pointer
 *   never lands between two.
 * - Under the hand an unchosen word's underline thickens to 2px. Disabled words are --fg-disabled with no underline.
 * - The radios under the words carry the choice, the keys and the name a form sends; a ring around the word shows
 *   keyboard focus.
 * - Nothing glides: the choice changes the moment you make it.
 */
import type { SegmentedBodyProps, SegmentedSize } from "../segmented";

const sizes: Record<SegmentedSize, { track: string; segment: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", segment: "text-caption pointer-coarse:text-small" },
  md: { track: "h-control-md", segment: "text-small" },
};

/** Plain, the words: the chosen one in the ink, the rest underlined in link blue. */
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
                "litt-target group/word relative grid h-full select-none place-items-center px-1.5 first:ps-0 last:pe-0 " +
                "[-webkit-tap-highlight-color:transparent] " +
                (block ? "flex-1 " : "") +
                look.segment +
                (off ? " cursor-not-allowed text-fg-disabled" : selected ? " cursor-default text-fg" : " cursor-pointer text-accent-text")
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
              <span
                className={
                  "litt-trim peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus " +
                  (off || selected ? "" : "underline decoration-1 underline-offset-[0.2em] group-hover/word:decoration-2")
                }
              >
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
