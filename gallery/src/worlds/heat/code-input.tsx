/**
 * Code input, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a row of flat square dark cells, the
 * active cell framed by four 8px amber corner brackets.
 *
 * - Square corners (`rounded-none`), crisp 1px border (`border-line-control`), dark `--block` fill, cream tabular figure.
 * - The cell awaiting the next character lights four 8px amber corner brackets (`text-accent-text`) and shows a still
 *   2px amber caret when empty. Errors switch the cell border to `--danger`.
 * - Disabled lies flat on `--surface-2` with `--line` and `--fg-disabled`. Forced colors keeps borders and Highlight.
 */
import type { CodeInputBodyProps } from "@/components/code-input";

const brackets =
  "pointer-events-none absolute inset-0 bg-no-repeat text-accent-text " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

/** Heat, the cells: flat square dark boxes with four 8px amber corner brackets on the active cell. */
export function CodeInputHeatBody({ length, cellHeight, code, at, focused, disabled, error }: CodeInputBodyProps) {
  return (
    <div aria-hidden="true" data-body="heat" className="flex w-full gap-2">
      {Array.from({ length }, (_, i) => {
        const char = code[i] ?? "";
        const current = focused && !disabled && i === at;
        const look = disabled
          ? "border-line bg-surface-2 font-normal text-fg-disabled"
          : error
            ? "border-danger bg-block text-fg"
            : current
              ? "border-line-strong bg-block text-accent-text"
              : "border-line-control bg-block text-fg";
        return (
          <span
            key={i}
            className={
              "relative grid min-w-7 flex-1 basis-0 place-items-center rounded-none border text-body tabular-nums " +
              "transition-[border-color,color] duration-(--dur-instant) ease-litt forced-colors:border " +
              cellHeight +
              (char && !disabled ? " font-title" : "") +
              (length === 6 && i === 3 ? " ml-2" : "") +
              (current ? " forced-colors:outline-2 forced-colors:outline-offset-2 forced-colors:outline-[Highlight]" : "") +
              " " +
              look
            }
          >
            {current && <span className={brackets} />}
            {char || (current ? <span className="h-5 w-0.5 bg-accent-text forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]" /> : null)}
          </span>
        );
      })}
    </div>
  );
}
