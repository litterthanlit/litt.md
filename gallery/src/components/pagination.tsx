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
 * - Flat: no tray; the current page is a grey bubble (--block) at the control radius, the other numbers --fg-muted words with a grey bubble on hover.
 * - Bodies: Pagination resolves the range, the run of pages and the two ends once, into PaginationBodyProps, and renders the
 *   body the material picks (byWorld). Press is the tray, above. Each body carries data-body on its nav and never changes
 *   a prop, the order of the tab stops, the live range or the focus handoff.
 */
import { useRef, type RefObject } from "react";
import { byWorld, useMaterial } from "@/motion";
import { Button } from "@/components/button";
import { PaginationDeviceBody } from "./bodies/pagination.device";
import { PaginationFlatBody } from "./bodies/pagination.flat";


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
const TRAY = "flex h-control-sm items-stretch rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border " +
  /* Flat: no tray, the pages stand apart as pills. */
  "in-[[data-material=flat]]:gap-1 in-[[data-material=flat]]:p-0 in-[[data-material=flat]]:bg-transparent " + TOUCH;

const PAGE =
  "grid h-full min-w-7 cursor-pointer select-none place-items-center rounded-[calc(var(--radius-control)-2px)] in-[[data-material=flat]]:rounded-control px-2 " +
  "text-small font-normal tabular-nums [-webkit-tap-highlight-color:transparent] pointer-coarse:min-w-10 " +
  "transition-[background-color,color,translate] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";
const CURRENT =
  "bg-block text-fg shadow-(--block-lift) active:shadow-(--block-press) active:translate-y-(--press-depth) forced-colors:border-2";
/** Another page: quiet until hovered, and a finger's press fills it, as on a segment. */
const OTHER =
  "text-fg-subtle in-[[data-material=flat]]:text-fg-muted hover:text-fg in-[[data-material=flat]]:hover:bg-surface-3 pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

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

/** An end button's state: whether it is off, the ref focus can return to, and what a press does. */
export type PaginationEnd = {
  disabled: boolean;
  ref: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
};

/**
 * What every body of the Pagination draws (proposals/worlds.md, Bodies). Pagination resolves it once, so a body only lays
 * out and styles. `range` is the words a screen reader hears in the live region ("21 to 40 of 143"); the figures
 * (`first`, `last`, `total`) are there for a body that draws them another way, and its drawing is aria-hidden. Each
 * body carries data-body on its nav.
 */
export type PaginationBodyProps = {
  label: string;
  className: string;
  /** The range in words: "21 to 40 of 143", or "No results". */
  range: string;
  first: number;
  last: number;
  total: number;
  /** The current page, counting from 1, and how many pages there are. */
  current: number;
  count: number;
  /** The run of pages to show; `null` is a gap. */
  items: (number | null)[];
  previous: PaginationEnd;
  next: PaginationEnd;
  /** Go to a page number. */
  onPage: (page: number) => void;
};

/** Press, the tray: the range in type, Previous and Next as raised blocks, the pages in a sunken tray between. */
function PressBody({ label, className, range, current, count, items, previous, next, onPage }: PaginationBodyProps) {
  return (
    <nav data-body="press" aria-label={label} className={"@container " + className}>
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

  const Body = byWorld(useMaterial(), { press: PressBody, flat: PaginationFlatBody, device: PaginationDeviceBody });
  return (
    <Body
      label={label}
      className={className}
      range={total === 0 ? "No results" : `${GROUP(first)} to ${GROUP(last)} of ${GROUP(total)}`}
      first={first}
      last={last}
      total={total}
      current={current}
      count={count}
      items={pageItems(current, count)}
      previous={{ disabled: current <= 1, ref: previous, onClick: () => go(current - 1, "previous") }}
      next={{ disabled: current >= count, ref: next, onClick: () => go(current + 1, "next") }}
      onPage={(n) => go(n)}
    />
  );
}
