/**
 * Pagination, the Flat body (proposals/worlds.md, Bodies; material.md, 7): ink on paper. The range is a line of words in
 * ink with nothing round it, and everything a hand touches is a pill: Previous and Next are grey word pills (--block is
 * --surface-3 under Flat) at the end of the row, and the pages are bare numbers set between them, the current one in a
 * grey bubble (grey means chosen). No tray, no shadow, no hairline: the space between the words is the only divider.
 *
 * - A pill's press shows in its fill, a step darker under the hand (--block-hover), and a finger's press on a page fills
 *   it (fg 6%). Nothing sinks and nothing casts. A disabled end is a grey pill with --fg-disabled words.
 * - The pages are the figure's words in --fg-muted, round pills 28px wide and 32 tall (44 on a coarse pointer), so
 *   the one bubble is a circle. The weight never changes by state.
 * - Forced colors keeps an edge on the pills and a heavier one on the current page.
 */
import type { PaginationBodyProps } from "../pagination";

const TOUCH = "pointer-coarse:h-control-md";
/* A pill: the one shape for what a hand touches. */
const PILL =
  "litt-target relative grid h-control-sm cursor-pointer select-none place-items-center rounded-pill text-small " +
  "[-webkit-tap-highlight-color:transparent] transition-[background-color,color] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " + TOUCH;
const END =
  PILL +
  " px-4 font-title enabled:bg-block enabled:text-fg enabled:hover:bg-(--block-hover) enabled:forced-colors:border " +
  "enabled:pointer-coarse:active:bg-(--block-hover) disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-fg-disabled disabled:forced-colors:border";
const PAGE = PILL + " min-w-8 px-2 font-normal tabular-nums pointer-coarse:min-w-11";
const CURRENT = "bg-block text-fg forced-colors:border-2";
const OTHER = "bg-transparent text-fg-muted hover:bg-surface-3 hover:text-fg pointer-coarse:active:bg-surface-3 pointer-coarse:active:text-fg";

/** Flat, the page: the range in ink words, grey word pills for the ends, bare numbers between. */
export function PaginationFlatBody({ label, className, range, current, count, items, previous, next, onPage }: PaginationBodyProps) {
  return (
    <nav data-body="flat" aria-label={label} className={"@container " + className}>
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
