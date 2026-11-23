/**
 * ToastStack, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a site's notifications, what happened while
 * you were writing, under the ink pill that sends them.
 *
 * - Each notice is a white paper that floats: its title and one quiet line, and a grey circle to dismiss it. No dot.
 * - The newest is in front and older ones tuck 12px behind it, each a step smaller. Hover, focus or a tap on the stack
 *   fans them out at their real heights, with air between them.
 * - A new notice grows out of the Send pill that made it on Flat's expressive spring; a dismissed one leaves upward
 *   without a bounce. Nothing arrives, leaves or times out on its own (R4): every change answers a hand.
 * - The ink is the only colour: Send is the one ink pill (R6).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useMotionDial, useTransition } from "@/motion";

export type StackNotice = {
  id: string;
  title: string;
  body: string;
  /** When it happened, printed quietly beside the title, e.g. "4m ago". Optional. */
  time?: string;
};

export type ToastStackProps = {
  /** Notices in the stack at first (newest first). They are there at rest; nothing arrives on load. */
  defaultNotices?: StackNotice[];
  /** How many notices show, tucked or fanned out. Default 3. */
  visible?: number;
  className?: string;
};

export const DEFAULT_NOTICES: StackNotice[] = [
  { id: "n-1", title: "Issue 12 sent", body: "On its way to 1,204 readers." },
  { id: "n-2", title: "New reader", body: "Ada subscribed to your letters." },
  { id: "n-3", title: "Post published", body: "“Notes on grey” is live on your site." },
];

const SENT_NOTICES: Omit<StackNotice, "id">[] = [
  { title: "New comment", body: "“Love the easing on this one.”" },
  { title: "Draft saved", body: "Spring issue, 412 words." },
  { title: "New reader", body: "Sam subscribed to your letters." },
  { title: "Post published", body: "“Garden notes” is live on your site." },
];

/* The stack's geometry: how far each older notice peeks out below the one in front, how far apart they fan, and how
   much smaller each step back is. Before a notice is measured it is taken to be this tall. */
const PEEK = 12;
const GAP = 10;
const STEP = 0.05;
const FALLBACK_HEIGHT = 64;

/** Flat's notifications: a Send pill, and paper notices that tuck behind the newest and fan out when you look. */
export function ToastStack({ defaultNotices = DEFAULT_NOTICES, visible = 3, className = "" }: ToastStackProps) {
  const { reduced } = useMotionDial();
  const spring = useTransition("expressive");
  const exit = useExit("responsive");

  const [notices, setNotices] = useState<StackNotice[]>(defaultNotices);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [live, setLive] = useState("");
  const seq = useRef(0);
  const sendRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const shown = Math.max(1, Math.round(visible));
  const expanded = hovered || focused || pinned;

  /* Measure each notice at its natural height, so the stack fans out at real heights. */
  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const next: Record<string, number> = {};
    for (const el of list.querySelectorAll<HTMLElement>("[data-notice]")) next[el.dataset.notice!] = el.offsetHeight;
    setHeights((cur) => {
      const keys = Object.keys(next);
      return keys.length === Object.keys(cur).length && keys.every((k) => cur[k] === next[k]) ? cur : next;
    });
  }, []);
  useLayoutEffect(measure, [measure, notices]);
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [measure]);

  const heightOf = (n: StackNotice) => heights[n.id] ?? FALLBACK_HEIGHT;
  const inView = notices.slice(0, shown);
  const front = inView[0] ? heightOf(inView[0]) : 0;
  const fanned = inView.reduce((sum, n, i) => sum + heightOf(n) + (i ? GAP : 0), 0);
  const tucked = front + PEEK * Math.max(0, inView.length - 1);
  const listHeight = expanded ? fanned : tucked;

  function send() {
    const sample = SENT_NOTICES[seq.current % SENT_NOTICES.length]!;
    seq.current += 1;
    const next: StackNotice = { id: `sent-${seq.current}`, ...sample };
    setNotices((cur) => [next, ...cur]);
    setLive(`${next.title}. ${next.body}`);
  }

  function dismiss(item: StackNotice) {
    const hadFocus = listRef.current?.querySelector(`[data-notice="${CSS.escape(item.id)}"]`)?.contains(document.activeElement);
    const rest = notices.filter((n) => n.id !== item.id);
    setNotices(rest);
    setLive(`Dismissed ${item.title}.`);
    if (hadFocus) {
      // Focus goes to the notice now in front, or back to Send when none is left.
      const nextFront = rest[0];
      requestAnimationFrame(() => {
        const target = nextFront
          ? listRef.current?.querySelector<HTMLButtonElement>(`[data-notice="${CSS.escape(nextFront.id)}"] button`)
          : sendRef.current;
        target?.focus({ preventScroll: true });
      });
    }
  }

  // A tap on the stack (not on a dismiss) fans it out or tucks it away; a mouse does the same by hovering.
  function tapStack(e: PointerEvent<HTMLElement>) {
    if (e.pointerType === "mouse" || (e.target as Element).closest("button")) return;
    setPinned((v) => !v);
  }

  let offset = 0;
  return (
    <div className={"grid w-full max-w-sm min-w-0 justify-items-center gap-5 text-fg " + className}>
      <button
        ref={sendRef}
        type="button"
        data-part="pill"
        onClick={send}
        className="litt-target relative inline-flex h-10 cursor-pointer items-center rounded-pill bg-fg px-5 text-body font-title text-canvas transition-[opacity,transform] duration-(--dur-instant) ease-litt hover:opacity-90 motion-safe:active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
      >
        Send notification
      </button>

      <section
        aria-label="Notifications"
        className="relative w-full min-w-0"
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
        onPointerUp={tapStack}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        <ol ref={listRef} className="relative m-0 list-none p-0" style={{ height: listHeight }}>
          <AnimatePresence initial={false}>
            {notices.map((item, i) => {
              const hidden = i >= shown;
              const y = expanded ? offset : Math.min(i, shown - 1) * PEEK;
              const scale = expanded ? 1 : 1 - Math.min(i, shown - 1) * STEP;
              if (!hidden) offset += heightOf(item) + GAP;
              const clipped = !expanded && i > 0;
              return (
                <motion.li
                  key={item.id}
                  data-part="paper"
                  inert={hidden}
                  initial={reduced ? false : { opacity: 0, y: -46, scale: 0.55 }}
                  animate={{ opacity: hidden ? 0 : 1, y, scale }}
                  exit={reduced ? undefined : { opacity: 0, y: y - 8, scale: 0.96, transition: exit }}
                  transition={spring}
                  className="litt-paper absolute inset-x-0 top-0 origin-top overflow-hidden rounded-surface bg-surface-1 shadow-float forced-colors:border"
                  style={{
                    zIndex: notices.length - i,
                    height: clipped ? front : undefined,
                    pointerEvents: hidden ? "none" : undefined,
                  }}
                >
                  <div data-notice={item.id} className="flex items-start gap-2.5 py-3 pr-2.5 pl-4">
                    <div className="grid min-w-0 flex-1 gap-0.5">
                      <p className="m-0 flex min-w-0 items-baseline gap-2 text-body font-title text-fg">
                        <span className="truncate">{item.title}</span>
                        {item.time && (
                          <span className="shrink-0 text-small font-normal tabular-nums text-fg-subtle">{item.time}</span>
                        )}
                      </p>
                      <p className="m-0 text-small text-fg-subtle">{item.body}</p>
                    </div>
                    <button
                      type="button"
                      data-part="circle"
                      aria-label={`Dismiss: ${item.title}`}
                      onClick={() => dismiss(item)}
                      className={
                        "litt-target relative -mt-0.5 grid size-7 shrink-0 cursor-pointer place-items-center rounded-pill bg-transparent text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:bg-block hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus " +
                        // Tucked behind the front notice, a dismiss would take its taps: it waits until the stack fans out.
                        (clipped ? "invisible" : "")
                      }
                    >
                      <svg width={15} height={15} viewBox="0 0 16 16" aria-hidden="true">
                        <path d="m4.5 4.5 7 7m0-7-7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      </section>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
