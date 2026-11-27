/**
 * Segmented control, Plain's body (taste v1.23, proposals/plain-studies.md): a choice of words, the chosen one held in
 * four gliding corner marks.
 *
 * - The chosen word is `--fg` inside four 4px corner marks; every other is `--fg-muted`, and comes to `--fg` under the
 *   hand. Nothing else is drawn: no tray, no bubble, no frame, no underline. Space parts the words, and their hit areas
 *   touch, so a pointer never lands between two.
 * - Subtraction motion: the four 4px corner marks glide from option to option on the `200ms` zero-bounce responsive
 *   spring (`enter`), translating independently inside `LayoutGroup` so 1px strokes stay crisp across word lengths.
 * - Disabled words are `--fg-disabled`; a disabled chosen word keeps its brackets.
 */
import { LayoutGroup, motion, type Transition } from "motion/react";
import type { SegmentedBodyProps, SegmentedSize } from "@/components/segmented";

const sizes: Record<SegmentedSize, { track: string; segment: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", segment: "text-caption pointer-coarse:text-small" },
  md: { track: "h-control-md", segment: "text-small" },
};

const corner = "pointer-events-none absolute size-1 border-current";

function GlidingCorners({ enter }: { enter: Transition }) {
  return (
    <>
      <motion.span layoutId="seg-plain-tl" transition={enter} aria-hidden="true" className={corner + " -top-1.5 -left-2 border-t border-l"} />
      <motion.span layoutId="seg-plain-tr" transition={enter} aria-hidden="true" className={corner + " -top-1.5 -right-2 border-t border-r"} />
      <motion.span layoutId="seg-plain-bl" transition={enter} aria-hidden="true" className={corner + " -bottom-1.5 -left-2 border-b border-l"} />
      <motion.span layoutId="seg-plain-br" transition={enter} aria-hidden="true" className={corner + " -bottom-1.5 -right-2 border-b border-r"} />
    </>
  );
}

/** Plain, the words: the chosen one in the ink and four gliding corner marks, the rest in grey. */
export function SegmentedPlainBody({ legend, showLegend, name, value, options, size, block, disabled, className, select, groupId, enter }: SegmentedBodyProps) {
  const look = sizes[size];
  return (
    <fieldset data-body="plain" disabled={disabled} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={showLegend ? "mb-1 p-0 text-small text-fg" : "sr-only"}>{legend}</legend>
      <LayoutGroup id={groupId}>
        <div className={"flex " + (block ? "w-full " : "w-fit ") + look.track}>
          {options.map((o) => {
            const selected = value === o.value;
            const off = disabled || !!o.disabled;
            return (
              <label
                key={o.value}
                data-chosen={selected ? "" : undefined}
                className={
                  "litt-target group/word relative grid h-full select-none place-items-center px-3 " +
                  "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
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
                  {selected && <GlidingCorners enter={enter} />}
                  {o.label}
                </span>
              </label>
            );
          })}
        </div>
      </LayoutGroup>
    </fieldset>
  );
}
