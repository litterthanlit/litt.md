/**
 * Code input, the Rack body (proposals/rack.md): one square cell per character, each a light box in the control line,
 * as an instrument's row of value boxes.
 *
 * - Each cell is a light box (--cut) in a 1px control line (--line-control), square at the control radius, with no shade
 *   and no plate under them: 8px of the panel between cells, and a wider gap between the halves of a six-digit code. A
 *   typed character is --field-ink at the title weight in tabular figures.
 * - The cell the next character goes into is outlined in the ink: a 2px line in --focus, and an empty one shows a still
 *   1px caret. An error turns every cell's line to --danger (the current one keeps the focus ring as well). Lines change
 *   on the instant tier and nothing moves or blinks.
 * - Disabled lies flat: --surface-2 with the plain --line hairline and --fg-disabled characters.
 * - Forced colors drops shadows, so each cell gets a real border and the current one an outline.
 */
import type { CodeInputBodyProps } from "../code-input";

/** Rack, the cells: a light box in a line each, the current one outlined in the ink. */
export function CodeInputRackBody({ length, cellHeight, code, at, focused, disabled, error }: CodeInputBodyProps) {
  return (
    <div aria-hidden="true" data-body="rack" className="flex w-full gap-2">
      {Array.from({ length }, (_, i) => {
        const char = code[i] ?? "";
        const current = focused && !disabled && i === at;
        const look = disabled
          ? "bg-surface-2 font-normal text-fg-disabled shadow-[inset_0_0_0_1px_var(--line)]"
          : error
            ? current
              ? "bg-cut text-field-ink shadow-[inset_0_0_0_1px_var(--danger),var(--focus-ring)]"
              : "bg-cut text-field-ink shadow-[inset_0_0_0_1px_var(--danger)]"
            : current
              ? "bg-cut text-field-ink shadow-[inset_0_0_0_2px_var(--focus)]"
              : "bg-cut text-field-ink shadow-[inset_0_0_0_1px_var(--field-line)]";
        return (
          <span
            key={i}
            className={
              "grid min-w-7 flex-1 basis-0 place-items-center rounded-control text-body tabular-nums " +
              "transition-[box-shadow] duration-(--dur-instant) ease-litt forced-colors:border " +
              cellHeight +
              (char && !disabled ? " font-title" : "") +
              /* six cells read as two halves of three */
              (length === 6 && i === 3 ? " ml-2" : "") +
              (current ? " forced-colors:outline-2 forced-colors:outline-offset-2 forced-colors:outline-[Highlight]" : "") +
              " " +
              look
            }
          >
            {char || (current ? <span className="h-5 w-px bg-field-ink forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]" /> : null)}
          </span>
        );
      })}
    </div>
  );
}
