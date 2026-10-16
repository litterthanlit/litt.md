/**
 * Pagination: previous and next for a table or list that shows one page of many. The range is the main
 * information, so it comes first, in words.
 *
 * - Range (components.md, Pagination): "21 to 40 of 143" in mono at the caption size, fg-subtle, with tabular
 *   figures, at the start of the row. No dashes. With no rows it says "No results". It is a polite live region, so
 *   a screen reader hears the new range after a page change.
 * - Buttons: Previous and Next are sm secondary Buttons (44px on a coarse pointer), text only, 12px apart at the end of the row. The first page
 *   disables Previous and the last disables Next. If the button you just pressed becomes disabled, focus moves to
 *   the other one, so it never drops to the page.
 * - Page buttons: numbered ghost buttons in mono between the two, the current one secondary with
 *   aria-current="page". A long run folds: the first, the last, and one either side of the current page, with an
 *   ellipsis between. They only show when the row is 36rem wide (the row measures itself, not the window); below
 *   that the range and the two buttons are enough.
 * - Semantics: a nav with its own name, and a list inside it.
 * - Motion: none of its own. The rows it pages are the table's job (Table, animateChanges). The buttons' own
 *   hover and press are Button's: instant, and the box never moves.
 */
import { useRef } from "react";
import { Button } from "@/components/button";

export type PaginationProps = {
  /** The nav's name, which says what is paged: "Deploys pages". Give each pagination on a page its own. */
  label: string;
  /** The current page, counting from 1. You hold it in state, and Pagination only reports changes. */
  page: number;
  /** How many rows a page shows. */
  pageSize: number;
  /** How many rows there are in all, not just on this page. */
  total: number;
  /** Called with the page to show next, counting from 1. Fetch or slice your rows and pass the new `page`. */
  onPageChange: (page: number) => void;
  /** Extra classes for the nav, such as a top margin. */
  className?: string;
};

const GROUP = (n: number) => n.toLocaleString("en-GB");
/** An sm button is 32px; on a finger it is 44px. */
const TOUCH = "pointer-coarse:h-control-md";

/** The page numbers to show: all of them when there are few, otherwise the ends and the current page's neighbours. `null` is a gap. */
function pageItems(page: number, count: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const keep = new Set([1, count, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => keep.add(n));
  if (page >= count - 2) [count - 3, count - 2, count - 1].forEach((n) => keep.add(n));
  const sorted = [...keep].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1]! > 1) out.push(null);
    out.push(n);
  });
  return out;
}

/** The range and the buttons under a table. */
export function Pagination({ label, page, pageSize, total, onPageChange, className = "" }: PaginationProps) {
  const count = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const current = Math.min(Math.max(1, page), count);
  const first = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const last = Math.min(total, current * pageSize);
  const previous = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);

  /* A pressed button that is about to be disabled hands its focus to the other one. */
  const go = (to: number, from?: "previous" | "next") => {
    onPageChange(to);
    if (from === "previous" && to <= 1) requestAnimationFrame(() => next.current?.focus());
    if (from === "next" && to >= count) requestAnimationFrame(() => previous.current?.focus());
  };

  return (
    <nav aria-label={label} className={"@container " + className}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p aria-live="polite" aria-atomic="true" className="font-mono text-caption tabular-nums text-fg-subtle">
          {total === 0 ? "No results" : `${GROUP(first)} to ${GROUP(last)} of ${GROUP(total)}`}
        </p>
        <ul className="flex items-center gap-3">
          <li>
            <Button ref={previous} size="sm" className={TOUCH} disabled={current <= 1} onClick={() => go(current - 1, "previous")}>
              Previous
            </Button>
          </li>
          {count > 1 && (
            <li className="hidden @min-[36rem]:block">
              <ul className="flex items-center gap-1">
                {pageItems(current, count).map((n, i) =>
                  n === null ? (
                    <li key={`gap-${i}`} aria-hidden="true" className="grid min-w-control-sm place-items-center font-mono text-caption text-fg-subtle">
                      …
                    </li>
                  ) : (
                    <li key={n}>
                      <Button
                        size="sm"
                        variant={n === current ? "secondary" : "ghost"}
                        aria-current={n === current ? "page" : undefined}
                        aria-label={`Page ${n}`}
                        className={TOUCH + " min-w-control-sm pointer-coarse:min-w-control-md font-mono tabular-nums"}
                        onClick={() => go(n)}
                      >
                        {n}
                      </Button>
                    </li>
                  ),
                )}
              </ul>
            </li>
          )}
          <li>
            <Button ref={next} size="sm" className={TOUCH} disabled={current >= count} onClick={() => go(current + 1, "next")}>
              Next
            </Button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
