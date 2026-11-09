/**
 * Code input, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): ink on paper. One grey pill per
 * character, parted by space and nothing else. An empty pill is the lighter grey (--surface-2); a typed one is the
 * object grey (--block, --surface-3) with its character in ink at the title weight. The ink ring marks the cell the
 * next character goes into, and the danger ring every cell of an error. Disabled pills are the light grey with
 * --fg-disabled. No shade, no outline. The caret is a still 1px line.
 */
import type { CodeInputBodyProps } from "../code-input";

/** Flat, the pills: grey by fill alone, ink by weight, a ring only for the current cell and for an error. */
export function CodeInputFlatBody({ length, cellHeight, code, at, focused, disabled, error }: CodeInputBodyProps) {
  return (
    <div aria-hidden="true" data-body="flat" className="flex w-full gap-3">
      {Array.from({ length }, (_, i) => {
        const char = code[i] ?? "";
        const current = focused && !disabled && i === at;
        return (
          <span
            key={i}
            className={
              "grid min-w-6 flex-1 basis-0 place-items-center rounded-pill text-body tabular-nums " +
              "transition-[box-shadow] duration-(--dur-instant) ease-litt forced-colors:border " +
              cellHeight +
              /* six cells read as two halves of three, parted by space */
              (length === 6 && i === 3 ? " ml-3" : "") +
              /* Forced colors drop the ring (a box-shadow), so the current cell takes an outline there. */
              (current ? " forced-colors:outline-2 forced-colors:outline-offset-2 forced-colors:outline-[Highlight]" : "") +
              (disabled
                ? " shadow-none"
                : error
                  ? " shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)]"
                  : current
                    ? " shadow-(--focus-ring)"
                    : " shadow-none") +
              (disabled
                ? " bg-surface-2 font-normal text-fg-disabled"
                : char
                  ? " bg-block font-title text-fg"
                  : " bg-surface-2 font-normal text-fg")
            }
          >
            {char || (current ? <span className="h-5 w-px bg-fg forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]" /> : null)}
          </span>
        );
      })}
    </div>
  );
}
