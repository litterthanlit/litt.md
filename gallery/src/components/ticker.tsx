/**
 * Ticker, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): one quiet line of updates on Flat's paper
 * card, built from a horizontal pill strip, a colored status dot and an expressive vertical transition.
 *
 * - Sits on a borderless Flat paper card (`litt-paper rounded-surface bg-surface-1 p-6`, `data-part="paper"`) with
 *   every painted child marked in Flat's material vocabulary.
 * - One arrival on first view (`useInView` with `once: true`): the strip and status dot settle once on the expressive
 *   spring, then stay still until the reader steps through or a new notice is pushed. No auto-cycling timers on mount.
 * - Tones map strictly to Flat's data hues on the status dot alone (`info` -> `--data-blue`, `warn` -> `--data-amber`,
 *   `alert` -> `--data-rose`). The pill stays neutral ink on block.
 * - Hover and focus track a held state (`data-paused` and optional `onPauseChange`) so live callers can hold incoming
 *   updates while a reader is reading.
 * - Accessibility: `role="group"` with `aria-roledescription="ticker"`, one tab stop, ArrowLeft / ArrowRight / Home /
 *   End / Enter / Space stepping, polite live announcement once per message change, and forced-colors borders.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

/** Semantic severity for a ticker notice, mapped to Flat's data hues on the status dot. */
export type TickerTone = "info" | "warn" | "alert";

/** One queued notice displayed by Ticker. */
export type TickerMessage = {
  /** Monotonic id used for transitions and once-per-change announcements. */
  id: number;
  /** Short single-line notice text in plain sentence case. */
  text: string;
  /** Severity tone carried by the status dot and screen-reader prefix. */
  tone: TickerTone;
};

/** Input shape accepted by `useTicker({ initial })` and `<Ticker messages={...} />`. */
export type TickerInput = {
  /** Short single-line notice text in plain sentence case. */
  text: string;
  /** Optional severity tone. Defaults to `"info"`. */
  tone?: TickerTone;
};

/** Options for `useTicker`. */
export type UseTickerOptions = {
  /** Optional notices seeded into the queue before mount. */
  initial?: TickerInput[];
  /** Starting index within `initial`. Defaults to 0 when `initial` is non-empty. */
  initialIndex?: number;
  /** Maximum number of notices kept in the queue. Defaults to 9. */
  limit?: number;
};

type Queue = {
  messages: TickerMessage[];
  index: number;
  waiting: boolean;
};

/**
 * Imperative notice queue for `Ticker`. Keeps up to `limit` recent notices, tracks the active index, and jumps to each
 * newly pushed notice so interactive updates appear right away.
 */
export function useTicker({ initial = [], initialIndex = 0, limit = 9 }: UseTickerOptions = {}) {
  const nextId = useRef(0);
  const [queue, setQueue] = useState<Queue>(() => {
    const capped = initial.slice(-Math.max(1, limit));
    const seeded: TickerMessage[] = capped.map((item) => {
      nextId.current += 1;
      return { id: nextId.current, text: item.text, tone: item.tone ?? "info" };
    });
    return {
      messages: seeded,
      index: seeded.length > 0 ? Math.min(seeded.length - 1, Math.max(0, initialIndex)) : -1,
      waiting: false,
    };
  });

  const push = useCallback(
    (text: string, { tone = "info" }: { tone?: TickerTone } = {}) => {
      nextId.current += 1;
      const message: TickerMessage = { id: nextId.current, text, tone };
      setQueue((q) => {
        const all = [...q.messages, message];
        const drop = Math.max(0, all.length - Math.max(1, limit));
        const messages = all.slice(drop);
        return {
          messages,
          index: messages.length - 1,
          waiting: false,
        };
      });
      return message.id;
    },
    [limit],
  );

  /** Marks message `id` as finished and advances to the next queued notice, or waits at the end. */
  const finished = useCallback((id: number) => {
    setQueue((q) => {
      if (q.messages[q.index]?.id !== id) return q;
      return q.index < q.messages.length - 1 ? { ...q, index: q.index + 1 } : { ...q, waiting: true };
    });
  }, []);

  /** Jumps to a specific index in the queue, clamped to valid bounds. */
  const go = useCallback((index: number) => {
    setQueue((q) =>
      q.messages.length
        ? { ...q, index: Math.min(q.messages.length - 1, Math.max(0, index)), waiting: false }
        : q,
    );
  }, []);

  /** Steps forward or backward through the queue, wrapping around at either end. */
  const step = useCallback((delta: number) => {
    setQueue((q) => {
      const n = q.messages.length;
      if (n === 0) return q;
      const base = q.index < 0 ? 0 : q.index;
      return { ...q, index: (base + delta + n) % n, waiting: false };
    });
  }, []);

  /** Empties the queue. */
  const clear = useCallback(() => {
    setQueue({ messages: [], index: -1, waiting: false });
  }, []);

  return {
    messages: queue.messages,
    index: queue.index,
    current: queue.messages[queue.index] ?? null,
    /** True when the last message finished and nothing newer is waiting. */
    waiting: queue.waiting,
    push,
    finished,
    go,
    step,
    clear,
  };
}

export type TickerController = ReturnType<typeof useTicker>;

export type TickerProps = {
  /** Queue controller returned by `useTicker()`. Takes precedence over `messages`. */
  controller?: TickerController;
  /** Declarative list of notices when `controller` is not supplied. */
  messages?: TickerInput[];
  /** Starting index when using declarative `messages`. Defaults to 0. */
  defaultIndex?: number;
  /** Accessible name for the ticker strip. Defaults to `"Updates"`. */
  label?: string;
  /** Quiet line shown when no notices are queued. Defaults to `"No updates"`. */
  emptyLabel?: string;
  /** Called when hover or keyboard focus pauses or resumes the strip. */
  onPauseChange?: (paused: boolean) => void;
  /** Extra classes on the outer paper card. */
  className?: string;
};

/* Tone dot colors: literal data-hue utility classes so registry token renaming stays intact. */
const TONE_DOT: Record<TickerTone, string> = {
  info: "bg-data-blue",
  warn: "bg-data-amber",
  alert: "bg-data-rose",
};

const TONE_SAID: Record<TickerTone, string> = {
  info: "",
  warn: "Warning: ",
  alert: "Alert: ",
};

/** One quiet line of updates on a Flat paper card: colored status dot, message line and tabular position. */
export function Ticker({
  controller,
  messages: propMessages,
  defaultIndex = 0,
  label = "Updates",
  emptyLabel = "No updates",
  onPauseChange,
  className = "",
}: TickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true });
  const descId = useId();
  const spring = useTransition("expressive");
  const { reduced } = useMotionDial();
  const arrived = reduced || inView;

  const staticMessages = useMemo<TickerMessage[]>(
    () =>
      (propMessages ?? []).map((m, i) => ({
        id: i + 1,
        text: m.text,
        tone: m.tone ?? "info",
      })),
    [propMessages],
  );

  const [localIndex, setLocalIndex] = useState(() =>
    staticMessages.length > 0 ? Math.min(staticMessages.length - 1, Math.max(0, defaultIndex)) : -1,
  );
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const list = controller ? controller.messages : staticMessages;
  const rawIndex = controller ? controller.index : localIndex;
  const safeIndex = list.length > 0 ? Math.min(list.length - 1, Math.max(0, rawIndex < 0 ? 0 : rawIndex)) : -1;
  const current = safeIndex >= 0 ? (list[safeIndex] ?? null) : null;
  const paused = hover || focus;

  // Notify callers when pointer hover or keyboard focus holds the strip.
  const prevPaused = useRef(paused);
  useEffect(() => {
    if (prevPaused.current === paused) return;
    prevPaused.current = paused;
    onPauseChange?.(paused);
  }, [paused, onPauseChange]);

  // Announce each active notice once when it changes after initial mount.
  const lastAnnouncedId = useRef<number | null>(current?.id ?? null);
  useEffect(() => {
    const nextId = current?.id ?? null;
    if (nextId === lastAnnouncedId.current) return;
    lastAnnouncedId.current = nextId;
    if (current) {
      setAnnouncement(`${TONE_SAID[current.tone]}${current.text}, ${safeIndex + 1} of ${list.length}.`);
    } else {
      setAnnouncement(`${emptyLabel}.`);
    }
  }, [current, safeIndex, list.length, emptyLabel]);

  const goTo = (next: number, dir: 1 | -1) => {
    if (list.length === 0) return;
    const clamped = Math.min(list.length - 1, Math.max(0, next));
    if (clamped === safeIndex) return;
    setDirection(dir);
    if (controller) controller.go(clamped);
    else setLocalIndex(clamped);
  };

  const stepBy = (delta: 1 | -1) => {
    if (list.length <= 1) return;
    setDirection(delta);
    if (controller) controller.step(delta);
    else setLocalIndex((i) => {
      const base = i < 0 ? 0 : Math.min(list.length - 1, i);
      return (base + delta + list.length) % list.length;
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (list.length === 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const fwd = e.key === (rtl ? "ArrowLeft" : "ArrowRight") || e.key === "Enter" || e.key === " ";
    const back = e.key === (rtl ? "ArrowRight" : "ArrowLeft");
    if (fwd) {
      e.preventDefault();
      stepBy(1);
    } else if (back) {
      e.preventDefault();
      stepBy(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0, -1);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(list.length - 1, 1);
    }
  };

  const canStep = list.length > 1;

  return (
    <div
      ref={rootRef}
      data-part="paper"
      className={"litt-paper grid w-full min-w-0 gap-3 rounded-surface bg-surface-1 p-6 forced-colors:border " + className}
    >
      <motion.div
        role="group"
        aria-roledescription="ticker"
        aria-label={label}
        aria-describedby={descId}
        tabIndex={0}
        data-part="pill"
        data-tone={current?.tone ?? "empty"}
        data-paused={paused || undefined}
        onClick={() => stepBy(1)}
        onKeyDown={onKeyDown}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHover(true);
        }}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        initial={reduced ? false : { scale: 0.97 }}
        animate={reduced ? undefined : { scale: arrived ? 1 : 0.97 }}
        whileTap={reduced || !canStep ? undefined : { scale: 0.99 }}
        transition={spring}
        className={
          "litt-target relative flex min-h-control-md w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-pill bg-block px-4 py-2 select-none " +
          "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border " +
          (canStep ? "cursor-pointer hover:bg-(--block-hover)" : "")
        }
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <motion.span
            aria-hidden="true"
            data-part="circle"
            initial={reduced ? false : { scale: 0.5 }}
            animate={reduced ? undefined : { scale: arrived ? 1 : 0.5 }}
            transition={spring}
            className={
              "size-2.5 shrink-0 rounded-pill transition-colors duration-(--dur-instant) ease-litt forced-colors:[forced-color-adjust:none] forced-colors:bg-[CanvasText] " +
              (current ? TONE_DOT[current.tone] : "bg-[color-mix(in_oklab,var(--fg)_20%,transparent)]")
            }
          />
          <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={current ? current.id : "empty"}
                data-part="lettering"
                initial={reduced ? false : { opacity: 0, y: direction * 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: direction * -10 }}
                transition={spring}
                className={"block w-full min-w-0 truncate text-small " + (current ? "text-fg" : "text-fg-subtle")}
              >
                {current ? current.text : emptyLabel}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <span data-part="lettering" aria-hidden="true" className="shrink-0 text-caption font-normal tabular-nums text-fg-subtle">
          {list.length > 0 ? `${safeIndex + 1} / ${list.length}` : "—"}
        </span>
      </motion.div>

      <span id={descId} className="sr-only">
        {current ? `${TONE_SAID[current.tone]}${current.text}, ${safeIndex + 1} of ${list.length}` : emptyLabel}
      </span>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
