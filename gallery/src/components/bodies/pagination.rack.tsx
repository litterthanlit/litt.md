/**
 * Pagination, the Rack body (proposals/rack.md): a row of square keys in 1px outlines, as an instrument's page buttons
 * are. The range is a line of words in ink at the start of the row; Previous and Next are keys with their words, and
 * the pages are numbered keys between them.
 *
 * - Every key is --block inside the 1px outline of --block-lift at the control radius, 32px tall (44 on a coarse
 *   pointer), with the figure in tabular numbers at the body weight. The current page is the lit key: the ink (--fg)
 *   with --canvas words, so a page is said by fill and never by the accent (R6). The other pages are keys in --fg-muted.
 * - Hover takes a step of fill and a press darkens the outline to --block-press, on the frame. Nothing moves or sinks.
 *   At an end a key lies flat: --surface-2 with a --line hairline and --fg-disabled words.
 * - Forced colors keeps a real border on every key and a heavier one on the current page.
 */
import type { PaginationBodyProps } from "../pagination";

const TOUCH = "pointer-coarse:h-control-md";
/* A key: a fill in a 1px outline, the square-cornered one shape for what a hand touches. */
const KEY =
  "litt-target relative grid h-control-sm cursor-pointer select-none place-items-center rounded-control text-small " +
  "[-webkit-tap-highlight-color:transparent] transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " + TOUCH;
const END =
  KEY +
  " px-4 font-title enabled:bg-block enabled:text-fg enabled:shadow-(--block-lift) enabled:hover:bg-(--block-hover) enabled:active:shadow-(--block-press) enabled:forced-colors:border " +
  "enabled:pointer-coarse:active:bg-(--block-hover) disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:shadow-[inset_0_0_0_1px_var(--line)] disabled:forced-colors:border";
const PAGE = KEY + " min-w-8 px-2 font-normal tabular-nums pointer-coarse:min-w-11";
const CURRENT = "bg-fg text-canvas shadow-(--block-lift) forced-colors:border-2";
const OTHER =
  "bg-block text-fg-muted shadow-(--block-lift) hover:bg-(--block-hover) hover:text-fg active:shadow-(--block-press) " +
  "pointer-coarse:active:bg-(--block-hover) pointer-coarse:active:text-fg forced-colors:border";

/** Rack, the keys: the range in ink words, then Previous, the pages and Next as keys in outlines. */
export function PaginationRackBody({ label, className, range, current, count, items, previous, next, onPage }: PaginationBodyProps) {
  return (
    <nav data-body="rack" aria-label={label} className={"@container " + className}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p aria-live="polite" aria-atomic="true" className="text-small font-normal tabular-nums text-fg">
          {range}
        </p>
        <ul className="flex items-center gap-1">
          <li>
            <button ref={previous.ref} type="button" disabled={previous.disabled} onClick={previous.onClick} className={END}>
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
                    <span className="litt-trim">{n}</span>
                  </button>
                </li>
              ),
            )}
          <li>
            <button ref={next.ref} type="button" disabled={next.disabled} onClick={next.onClick} className={END}>
              <span className="litt-trim">Next</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
