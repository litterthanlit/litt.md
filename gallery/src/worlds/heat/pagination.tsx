/**
 * Pagination, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a row of flat square cells with four
 * 6px amber corner brackets framing the current page, and square Previous / Next keys.
 *
 * - Every cell is flat (`rounded-none`, 1px `--line` border, zero cast).
 * - The current page stands out in `--block` with `--accent-text` and four 6px amber corner brackets (never an accent
 *   background fill, R6).
 * - Disabled Previous / Next keys lie flat in `--surface-2` with `--fg-disabled`.
 * - Forced colors keeps borders on every cell and Highlight on the current page.
 */
import type { PaginationBodyProps } from "@/components/pagination";

const TOUCH = "pointer-coarse:h-control-md";

const brackets =
  "pointer-events-none absolute inset-0 bg-no-repeat text-accent-text " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const KEY =
  "litt-target relative inline-flex h-control-sm cursor-pointer select-none items-center justify-center rounded-none border text-small " +
  "[-webkit-tap-highlight-color:transparent] transition-[background-color,color,border-color] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border " +
  TOUCH;

const END =
  KEY +
  " gap-1.5 px-3.5 font-title enabled:border-line enabled:bg-block enabled:text-fg enabled:hover:border-line-strong enabled:hover:bg-(--block-hover) " +
  "enabled:pointer-coarse:active:bg-(--block-hover) disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-fg-disabled";

const PAGE = KEY + " min-w-8 px-2 tabular-nums pointer-coarse:min-w-11";
const CURRENT =
  "border-line-strong bg-block font-title text-accent-text forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";
const OTHER =
  "border-line bg-canvas font-normal text-fg-muted hover:border-line-strong hover:bg-surface-1 hover:text-fg " +
  "pointer-coarse:active:bg-surface-1 pointer-coarse:active:text-fg";

/** Heat, the menu pager: square cells with four 6px amber corner brackets on the current page. */
export function PaginationHeatBody({ label, className, range, current, count, items, previous, next, onPage }: PaginationBodyProps) {
  return (
    <nav data-body="heat" aria-label={label} className={"@container " + className}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p aria-live="polite" aria-atomic="true" className="text-small font-normal tabular-nums text-fg">
          {range}
        </p>
        <ul className="flex items-center gap-1">
          <li>
            <button ref={previous.ref} type="button" disabled={previous.disabled} onClick={previous.onClick} className={END}>
              <span aria-hidden="true">‹</span>
              <span className="litt-trim">Previous</span>
            </button>
          </li>
          {count > 1 &&
            items.map((n, i) =>
              n === null ? (
                <li key={`gap-${i}`} aria-hidden="true" className="hidden min-w-6 place-items-center text-small text-fg-muted @min-[36rem]:grid">
                  …
                </li>
              ) : (
                <li key={n} className="hidden @min-[36rem]:block">
                  <button
                    type="button"
                    aria-current={n === current ? "page" : undefined}
                    aria-label={`Page ${n}`}
                    className={PAGE + " " + (n === current ? CURRENT : OTHER)}
                    onClick={() => onPage(n)}
                  >
                    {n === current && <span aria-hidden="true" className={brackets} />}
                    <span className="litt-trim">{n}</span>
                  </button>
                </li>
              ),
            )}
          <li>
            <button ref={next.ref} type="button" disabled={next.disabled} onClick={next.onClick} className={END}>
              <span className="litt-trim">Next</span>
              <span aria-hidden="true">›</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
