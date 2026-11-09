/**
 * Pagination: previous and next for a table or list that shows one page of many. The range is the main
 * information, so it comes first, in words.
 *
 * - Contract: a nav with its own name and a list inside it. The range ("21 to 40 of 143", "No results") is a polite
 *   live region, so a screen reader hears the new range after a page change, in words in every body. Previous and Next
 *   disable on the first and last page, and if the button you just pressed becomes disabled, focus moves to the other
 *   one, so it never drops to the page. The numbered pages show only when the row is 36rem wide (the row measures
 *   itself, not the window); below that the range and the two buttons are enough. A long run folds: the first, the
 *   last, and one either side of the current page, with an ellipsis between. The current page has aria-current="page".
 *   44px targets on a coarse pointer. Nothing moves of its own: the current page jumps to its page rather than gliding,
 *   because the run of numbers reshapes around it. The rows it pages are the table's job (Table, animateChanges).
 * - Press, the tray: the range sits on a raised face (--block, --block-lift) at the start of the row, and one sunken tray
 *   (--tray, --tray-shade, 2px in) at its end holds the whole control: Previous and Next as raised blocks (--block,
 *   --block-lift) at its two ends, the pages between them. The current page is a raised block too, in --fg, so a
 *   page is said by its shape and not by color. Every block's corners are the control radius less the tray's 2px, so
 *   they stay concentric. Pressed, a block sinks --press-depth and its cast tightens (--block-press) at once (R2,
 *   R4). At an end a block lies flat in its socket (--slot, --tray-shade, --fg-disabled). The tray is 32px (44 on a
 *   coarse pointer), and a finger's press on another page fills it (fg 6%), as on a segment.
 * - Flat, the page: bodies/pagination.flat.tsx. Device, the machine: bodies/pagination.device.tsx.
 * - Bodies: Pagination resolves the range, the run of pages and the two ends once, into PaginationBodyProps, and renders the
 *   body the material picks (byWorld). Each body carries data-body on its nav and never changes a prop, the order of the
 *   tab stops, the live range or the focus handoff.
 */
import { useRef, type RefObject } from "react";
import { byWorld, useMaterial } from "@/motion";
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
/** The tray is 32px; on a finger it is 44px. */
const TOUCH = "pointer-coarse:h-control-md";
/** A block's corners: the control radius less the tray's 2px, so they stay concentric. */
const BLOCK_RADIUS = "rounded-[calc(var(--radius-control)-2px)]";

/** The raised face the range sits on, as the Number field's figure: a block of its own at the start of the row. */
const FACE =
  "flex h-control-sm items-center rounded-control bg-block px-3 text-caption font-normal tabular-nums text-fg " +
  "shadow-(--block-lift) forced-colors:border " + TOUCH;
/** The tray holds the whole control, sunk into the page. */
const TRAY = "flex h-control-sm items-stretch gap-0.5 rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border " + TOUCH;
/** A cell of the tray: its shape and focus, with no fill yet. */
const CELL =
  "litt-target relative grid h-full cursor-pointer select-none place-items-center " + BLOCK_RADIUS + " " +
  "text-small tabular-nums [-webkit-tap-highlight-color:transparent] " +
  "transition-[background-color,color,translate] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";
/** A block: Previous, Next and the current page stand up in the tray and sink under a hand. */
const BLOCK =
  CELL + " " +
  "enabled:bg-block enabled:text-fg enabled:shadow-(--block-lift) enabled:forced-colors:border " +
  "enabled:hover:bg-(--block-hover) enabled:active:shadow-(--block-press) enabled:active:translate-y-(--press-depth) " +
  "disabled:cursor-not-allowed disabled:bg-slot disabled:text-fg-disabled disabled:shadow-(--tray-shade) disabled:forced-colors:border";
const END = "px-3 font-title";
const PAGE = "min-w-7 px-2 font-normal pointer-coarse:min-w-10";
/** Another page: a quiet word on the tray's floor until hovered, and a finger's press fills it, as on a segment. */
const OTHER =
  "cursor-pointer select-none text-fg-muted hover:text-fg pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

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

/** Press, the tray: the range on a raised face, then one tray with Previous and Next as blocks at its ends and the pages between. */
function PressBody({ label, className, range, current, count, items, previous, next, onPage }: PaginationBodyProps) {
  return (
    <nav data-body="press" aria-label={label} className={"@container " + className}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p aria-live="polite" aria-atomic="true" className={FACE}>
          {range}
        </p>
        <ul className={TRAY}>
          <li className="flex">
            <button ref={previous.ref} type="button" disabled={previous.disabled} onClick={previous.onClick} className={BLOCK + " " + END}>
              <span className="litt-trim">Previous</span>
            </button>
          </li>
          {count > 1 &&
            items.map((n, i) =>
              n === null ? (
                <li key={`gap-${i}`} aria-hidden="true" className="hidden min-w-7 place-items-center text-caption font-normal text-fg-muted @min-[36rem]:grid">
                  …
                </li>
              ) : (
                <li key={n} className="hidden @min-[36rem]:flex">
                  <button
                    type="button"
                    aria-current={n === current ? "page" : undefined}
                    aria-label={`Page ${n}`}
                    className={(n === current ? BLOCK : CELL + " " + OTHER) + " " + PAGE}
                    onClick={() => onPage(n)}
                  >
                    <span className="litt-trim">{n}</span>
                  </button>
                </li>
              ),
            )}
          <li className="flex">
            <button ref={next.ref} type="button" disabled={next.disabled} onClick={next.onClick} className={BLOCK + " " + END}>
              <span className="litt-trim">Next</span>
            </button>
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
