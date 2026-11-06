/**
 * Pagination: previous and next for a table or list that shows one page of many. The range is the main
 * information, so it comes first, in words.
 *
 * - Range (components.md, Pagination): "21 to 40 of 143" at the caption size, fg-subtle, with tabular
 *   figures, at the start of the row. No dashes. With no rows it says "No results". It is a polite live region, so
 *   a screen reader hears the new range after a page change.
 * - Buttons: Previous and Next are sm secondary Buttons (44px on a coarse pointer), raised blocks outside the tray,
 *   text only, 12px apart at the end of the row. The first page disables Previous and the last disables Next, and a
 *   disabled one lies flat. If the button you just pressed becomes disabled, focus moves to the other one, so it
 *   never drops to the page.
 * - Page buttons: the numbers sit in one sunken tray between the two (R3: --tray, --tray-shade, 2px in, as the
 *   Segmented control's), in tabular figures at the text weight, --fg-subtle and --fg on hover. The current page is
 *   the raised block in the tray (--block, --block-lift) in --fg, with aria-current="page": selected is raised, so
 *   the page is said by its shape, not by color. Its corners are the control radius less the tray's 2px, so they
 *   stay concentric. The tray is 32px (44 on a coarse pointer), as the sm buttons beside it, and a finger's press
 *   on another page fills it (fg 6%), as on a segment. A long run folds: the first, the last, and one either side
 *   of the current page, with an ellipsis between. They only show when the row is 36rem wide (the row measures
 *   itself, not the window); below that the range and the two buttons are enough.
 * - Semantics: a nav with its own name, and a list inside it.
 * - Motion: none of its own. The current block jumps to its page rather than gliding, because the run of numbers
 *   reshapes around it. A press on it tightens its cast (--block-press) and sinks it --press-depth, at once (R2,
 *   R4); Previous and Next press as Button does. The rows it pages are the table's job (Table, animateChanges).
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

/** The tray the numbers sit in, as the Segmented control's: 2px in, so a page is the tray's height less 4px. */
const TRAY = "flex h-control-sm items-stretch rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border " + TOUCH;

const PAGE =
  "grid h-full min-w-7 cursor-pointer select-none place-items-center rounded-[calc(var(--radius-control)-2px)] px-2 " +
  "text-small font-normal tabular-nums [-webkit-tap-highlight-color:transparent] pointer-coarse:min-w-10 " +
  "transition-[background-color,color,translate] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";
const CURRENT =
  "bg-block text-fg shadow-(--block-lift) active:shadow-(--block-press) active:translate-y-(--press-depth) forced-colors:border-2";
/** Another page: quiet until hovered, and a finger's press fills it, as on a segment. */
const OTHER =
  "text-fg-subtle hover:text-fg pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

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
        <p aria-live="polite" aria-atomic="true" className="text-caption font-normal tabular-nums text-fg-subtle">
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
              <ul className={TRAY}>
                {pageItems(current, count).map((n, i) =>
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
                        onClick={() => go(n)}
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
            <Button ref={next} size="sm" className={TOUCH} disabled={current >= count} onClick={() => go(current + 1, "next")}>
              Next
            </Button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
