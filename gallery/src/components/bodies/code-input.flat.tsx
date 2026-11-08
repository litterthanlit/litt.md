/**
 * Code input, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): a grey pill per cell with no
 * outline, lifted from the Press recipe. The ink ring marks the cell the next character goes into, and the danger ring
 * every cell of an error. A disabled cell is --surface-2 with no ring. The caret is a still 1px line.
 */
import type { CodeInputBodyProps } from "../code-input";

/** Flat, the pills: a grey cell per character, ringed only for the current cell and for an error. */
export function CodeInputFlatBody({ length, cellHeight, code, at, focused, disabled, error }: CodeInputBodyProps) {
  return (
    <div aria-hidden="true" data-body="flat" className="flex w-full gap-2">
      {Array.from({ length }, (_, i) => {
        const char = code[i] ?? "";
        const current = focused && !disabled && i === at;
        return (
          <span
            key={i}
            className={
              "grid min-w-8 flex-1 basis-0 place-items-center rounded-control text-body tabular-nums font-normal " +
              "transition-[box-shadow] duration-(--dur-instant) ease-litt forced-colors:border " +
              cellHeight +
              /* six cells read as two halves of three */
              (length === 6 && i === 3 ? " ml-2" : "") +
              /* Forced colors drop the ring (a box-shadow), so the current cell takes an outline there. */
              (current ? " forced-colors:outline-2 forced-colors:outline-offset-2 forced-colors:outline-[Highlight]" : "") +
              (disabled
                ? " shadow-none"
                : error
                  ? " shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)]"
                  : current
                    ? " shadow-(--focus-ring)"
                    : " shadow-none") +
              (disabled ? " bg-surface-2 text-fg-disabled" : " bg-field font-field text-field-ink")
            }
          >
            {char || (current ? <span className="h-5 w-px bg-field-ink forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]" /> : null)}
          </span>
        );
      })}
    </div>
  );
}
