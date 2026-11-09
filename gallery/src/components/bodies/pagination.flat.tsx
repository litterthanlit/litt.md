/**
 * Pagination, the Flat body (proposals/worlds.md, Bodies; material.md, 7): today's Flat recipe lifted into plain classes.
 * No tray; the current page is a grey bubble (--block) at the control radius, the other numbers --fg-muted words with a
 * grey bubble on hover. Previous and Next are Buttons, which are grey pills under Flat.
 */
import { Button } from "@/components/button";
import type { PaginationBodyProps } from "../pagination";

const TOUCH = "pointer-coarse:h-control-md";
const TRAY = "flex h-control-sm items-stretch gap-1 rounded-control bg-transparent p-0 shadow-(--tray-shade) forced-colors:border " + TOUCH;
const PAGE =
  "grid h-full min-w-7 cursor-pointer select-none place-items-center rounded-control px-2 " +
  "text-small font-normal tabular-nums [-webkit-tap-highlight-color:transparent] pointer-coarse:min-w-10 " +
  "transition-[background-color,color,translate] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";
const CURRENT = "bg-block text-fg shadow-(--block-lift) active:shadow-(--block-press) active:translate-y-(--press-depth) forced-colors:border-2";
const OTHER =
  "text-fg-muted hover:text-fg hover:bg-surface-3 pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

/** Flat, the page: the range in words, grey pills for the ends and the pages. */
export function PaginationFlatBody({ label, className, range, current, count, items, previous, next, onPage }: PaginationBodyProps) {
  return (
    <nav data-body="flat" aria-label={label} className={"@container " + className}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p aria-live="polite" aria-atomic="true" className="text-caption font-normal tabular-nums text-fg-subtle">
          {range}
        </p>
        <ul className="flex items-center gap-3">
          <li>
            <Button ref={previous.ref} size="sm" className={TOUCH} disabled={previous.disabled} onClick={previous.onClick}>
              Previous
            </Button>
          </li>
          {count > 1 && (
            <li className="hidden @min-[36rem]:block">
              <ul className={TRAY}>
                {items.map((n, i) =>
                  n === null ? (
                    <li key={`gap-${i}`} aria-hidden="true" className="grid min-w-7 place-items-center text-caption font-normal text-fg-subtle">
                      …
                    </li>
                  ) : (
                    <li key={n} className="flex">
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
              </ul>
            </li>
          )}
          <li>
            <Button ref={next.ref} size="sm" className={TOUCH} disabled={next.disabled} onClick={next.onClick}>
              Next
            </Button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
