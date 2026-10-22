/**
 * ActionBar: what can be done to the rows or cards someone has selected, in a bar that floats at the bottom of the
 * view while the selection lasts (components.md, "Action bar"). Archive three projects, export twelve invoices.
 *
 * - It appears when `count` goes above zero and goes when it is back to zero. Place it after the list, inside the same
 *   scrolling area: it sticks 16px above the bottom of the view while the list scrolls, and rests under the list at
 *   its end, so it never covers the last row.
 * - Two or three actions fit a phone. With more, keep the usual ones and put the rest behind a "More" Menu.
 * - Surface: floating glass at the surface radius with the float shadow (it floats over content, so glass is earned,
 *   P3), padded 4px so sm buttons sit concentric in it. The count in words at the start ("3 selected", small, --fg),
 *   a hairline, the actions as sm buttons, then a round ghost Clear. Never an accent fill: a selection can be large
 *   and the view's one primary action is elsewhere. A destructive action keeps its word ("Delete"), not a red fill.
 * - Motion: it rises by --travel and fades in on the responsive tier, and drops by half that on the exit token. The
 *   count changes in place. Under reduced motion it appears and goes.
 * - Keyboard: a toolbar. Tab enters it once, on the first action; ← and → move between its buttons, Home and End go
 *   to the ends; Esc clears the selection. When it goes while focus is inside, focus goes back to where it came from.
 * - Accessibility: role="toolbar" named for what it acts on, and the count said once in a polite status as it
 *   changes ("3 projects selected").
 */
import { useEffect, useRef, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";
import { XIcon } from "@/components/icons";

export type ActionBarProps = {
  /** How many are selected. The bar shows while it is above zero. */
  count: number;
  /** What the rows are, for the toolbar's name and the spoken count: "projects" makes "3 projects selected". */
  noun?: string;
  /** Clears the selection: the Clear button and Esc call it. */
  onClear: () => void;
  /** The actions, as sm Buttons: secondary for the usual ones, ghost for quieter ones. Icons are welcome; words are required. */
  children: ReactNode;
  /** Extra classes for the sticky wrapper, such as a different bottom offset. */
  className?: string;
};

/** A floating bar of actions for the current selection: the count, the actions and Clear. Place it after the list. */
export function ActionBar({ count, noun = "items", onClear, children, className = "" }: ActionBarProps) {
  const spoken = count === 0 ? "" : `${count} ${count === 1 ? noun.replace(/s$/, "") : noun} selected`;
  return (
    <div className={"pointer-events-none sticky bottom-4 z-10 flex justify-center " + className}>
      <AnimatePresence>{count > 0 && <Bar key="bar" count={count} noun={noun} onClear={onClear}>{children}</Bar>}</AnimatePresence>
      <p role="status" className="sr-only">
        {spoken}
      </p>
    </div>
  );
}

const ITEMS = "button:not(:disabled), a[href], [role=menuitem]";

function Bar({ count, noun, onClear, children }: Required<Pick<ActionBarProps, "count" | "noun" | "onClear" | "children">>) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  const bar = useRef<HTMLDivElement>(null);
  /* Where focus came from, to give it back if the bar goes while focus is inside it. */
  const cameFrom = useRef<HTMLElement | null>(null);
  const inside = useRef(false);

  const items = () => Array.from(bar.current?.querySelectorAll<HTMLElement>(ITEMS) ?? []);

  /* Roving tabindex: one Tab stop, on the item focused last (the first one to start with). */
  const rove = (active: HTMLElement | undefined) => {
    for (const el of items()) el.tabIndex = el === active ? 0 : -1;
  };
  useEffect(() => {
    const all = items();
    rove(all.find((el) => el.tabIndex === 0) ?? all[0]);
  });

  useEffect(() => {
    const node = bar.current;
    return () => {
      /* The focused button went with the bar, so focus fell to the body. */
      if (inside.current && (node?.contains(document.activeElement) || document.activeElement === document.body)) {
        const back = cameFrom.current;
        if (back?.isConnected) back.focus({ preventScroll: true });
      }
    };
  }, []);

  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    inside.current = true;
    const from = e.relatedTarget as HTMLElement | null;
    if (from && !e.currentTarget.contains(from)) cameFrom.current = from;
    if (e.target instanceof HTMLElement && items().includes(e.target)) rove(e.target);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClear();
      return;
    }
    const all = items();
    const at = all.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const fwd = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const to = e.key === fwd ? (at + 1) % all.length : e.key === back ? (at - 1 + all.length) % all.length : e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    all[to]!.focus();
  };

  return (
    <motion.div
      ref={bar}
      role="toolbar"
      aria-label={`Actions for the selected ${noun}`}
      onFocus={onFocus}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) inside.current = false;
      }}
      onKeyDown={onKeyDown}
      className="litt-glass pointer-events-auto flex max-w-full min-w-0 items-center gap-1 rounded-surface p-1 [--glass-shadow:var(--shadow-float)] [&_button]:pointer-coarse:h-control-md"
      initial={{ opacity: 0, y: travel }}
      animate={{ opacity: 1, y: 0, transition: enter }}
      exit={{ opacity: 0, y: travel / 2, transition: exit }}
    >
      <span className="shrink-0 truncate pr-2 pl-3 text-small text-fg tabular-nums">{count} selected</span>
      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-line" />
      <div className="flex min-w-0 items-center gap-1">{children}</div>
      <button
        type="button"
        aria-label="Clear selection"
        onClick={onClear}
        className={
          "grid size-8 shrink-0 cursor-pointer place-items-center rounded-pill text-fg-muted [-webkit-tap-highlight-color:transparent] " +
          "transition-[background-color,color] duration-(--dur-instant) ease-litt " +
          "hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:size-11"
        }
      >
        <XIcon />
      </button>
    </motion.div>
  );
}
