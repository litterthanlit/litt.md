/**
 * Thinking: the agent's reasoning as a quiet disclosure above its answer. While the agent thinks it reads
 * "Thinking 4s" with the reasoning streaming in underneath; when it stops it reads "Thought for 12s" and folds
 * itself away. The reader can open any thought and read it.
 *
 * - Row (components.md, Thinking): a button 32px tall (44px on a coarse pointer, or inside a phone
 *   DeviceProvider) with no fill and no padding, so the chevron sits on the column's edge. A 16px chevron, the label
 *   at the small size in fg-muted and the clock in the caption in fg-subtle with tabular numbers. Hover steps
 *   the label to fg, and a press on a finger does the same. The text sits on a shared baseline, so the clock never
 *   rides high or low beside the label.
 * - No shimmer, no pulse, no spinner, no dots, no caret (R2, and "no motion that is not a response to the person").
 *   The only live signal is the clock, which counts whole seconds from when `active` turned true. It is a number
 *   changing, not an animation.
 * - Clock words: under a minute "12s", then "1m 5s", a whole minute "2m", and past an hour "1h 5m". Seconds
 *   are always rounded down. A thought that lasted
 *   under a second reads "Thought for a moment", with no clock. A thought with no known time (never active, no
 *   `duration`) reads just "Thought". `label` replaces the words and keeps the clock: "Reasoning 4s".
 * - Body: the reasoning at the small size in fg-subtle, indented by the chevron and its gap so it lines up with the
 *   label, with no box, no rail and no tint. A grid with --space-2 between paragraphs, so a fragment of <p>
 *   or a bare string both work. It holds to about 68ch, like an answer, and wraps long words instead of widening the page.
 * - Open and closed: uncontrolled, it is open while `active` and closes itself when `active` goes false, unless
 *   the reader toggled it during that thought, so a reader's choice always wins. A new thought opens it again.
 *   `open` and `onOpenChange` control it, and then the auto open and close are the caller's: only a reader's
 *   toggle calls `onOpenChange`. `defaultOpen` sets the first state, which is otherwise `active`.
 * - Motion: the chevron turns a quarter on the instant tier (the `rotate` property, nothing else), and the label's
 *   color fades on the instant tier. The body fades in and travels a quarter of the travel token down on the responsive
 *   tier, and leaves with a fade on the exit token. Its height snaps, never animates: the body unmounts when the fade
 *   ends. It has its own AnimatePresence, without `initial={false}`, so an ancestor's cannot swallow its entrance.
 * - Semantics: a real button with aria-expanded and aria-controls, pointing at a region that is always in the DOM
 *   (empty while closed). The ticking clock is aria-hidden; the finished clock is read as words ("12 seconds").
 *   A polite live region says the label once when the thought starts and "Thought for 12 seconds" when it ends,
 *   in words. It stays silent for a thought loaded from history, and the reasoning is never announced as it streams.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRightIcon } from "@/components/icons";
import { useDevice, useExit, useTransition, useTravel } from "@/motion";

/* ----------------------------------------------------------------- the clock's words */

const whole = (n: number) => Math.max(0, Math.floor(n));

/** "12s", "1m 5s", "2m", "1h 5m": what the row shows. Whole seconds, rounded down. */
function formatClock(total: number): string {
  const s = whole(total);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return m ? `${h}h ${m}m` : `${h}h`;
  if (m) return r ? `${m}m ${r}s` : `${m}m`;
  return `${r}s`;
}

/** "12 seconds", "1 minute 5 seconds": what a screen reader should say where the row shows "12s". */
function speakClock(total: number): string {
  const s = whole(total);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const unit = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;
  if (h) return m ? `${unit(h, "hour")} ${unit(m, "minute")}` : unit(h, "hour");
  if (m) return r ? `${unit(m, "minute")} ${unit(r, "second")}` : unit(m, "minute");
  return unit(r, "second");
}

/** The words before the clock, for a finished thought. `seconds` is null when the time is not known. */
function finishedWords(seconds: number | null): string {
  if (seconds === null) return "Thought";
  return seconds < 1 ? "Thought for a moment" : "Thought for";
}

/* ----------------------------------------------------------------- Thinking */

export type ThinkingProps = {
  /** True while the agent is thinking. The clock counts whole seconds from when it turned true, the body is open, and when it turns false the thought is finished. */
  active?: boolean;
  /** Seconds a finished thought took, for one loaded from history. It is rounded down, and it is ignored while `active`. Without it, a thought that ran here shows the time its clock reached. */
  duration?: number;
  /** Whether the reasoning is open, when you control it. Pair it with onOpenChange. The automatic open and close are then yours. */
  open?: boolean;
  /** Whether it starts open when you do not control it. It starts open while `active` and closed otherwise. */
  defaultOpen?: boolean;
  /** Called with the new state when the reader toggles the row. */
  onOpenChange?: (open: boolean) => void;
  /** Replaces the words "Thinking" and "Thought for", such as "Reasoning". The clock still follows it: "Reasoning 4s", then "Reasoning 12s". */
  label?: string;
  /** The reasoning: paragraphs in the small size, spaced apart. It can be empty while the first words are still on their way. */
  children?: ReactNode;
  /** Extra classes for the whole component, such as a width. */
  className?: string;
};

/** The agent's reasoning as a disclosure: a row with a label and a clock, and the reasoning folded under it. Open while the agent thinks, closed once it has, and always the reader's to toggle. */
export function Thinking({
  active = false,
  duration,
  open: openProp,
  defaultOpen,
  onOpenChange,
  label,
  children,
  className = "",
}: ThinkingProps) {
  const uid = useId();
  const bodyId = `${uid}-body`;
  const { coarse } = useDevice();
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();

  const controlled = openProp !== undefined;
  const [innerOpen, setInnerOpen] = useState(defaultOpen ?? active);
  const open = controlled ? openProp : innerOpen;

  /* The clock: whole seconds since `active` turned true. It keeps its last value once the thought ends, which is
     what the finished label shows. */
  const [elapsed, setElapsed] = useState(0);
  const [ran, setRan] = useState(active);
  const [touched, setTouched] = useState(false);
  const [prevActive, setPrevActive] = useState(active);
  const [said, setSaid] = useState("");

  /* A thought starting or stopping is adjusted while rendering, so the first frame after the change is already right:
     a new thought starts at 0s and open, and a finished one closes itself unless the reader toggled it. */
  if (active !== prevActive) {
    setPrevActive(active);
    if (active) {
      setElapsed(0);
      setRan(true);
      setTouched(false);
      setInnerOpen(true);
    } else if (!touched) {
      setInnerOpen(false);
    }
  }

  /* Count from the moment it turned on. Each tick lands on the next whole second, so the clock does not drift, and
     the time is read from the clock rather than counted, so a throttled background tab still shows the truth. A
     layout effect, so the final reading is in place before the frame in which the thought reads as finished. */
  const finished = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (!active) return;
    const start = performance.now();
    const read = () => Math.floor((performance.now() - start) / 1000);
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setElapsed(read());
      timer = setTimeout(tick, 1000 - ((performance.now() - start) % 1000));
    };
    timer = setTimeout(tick, 1000);
    return () => {
      clearTimeout(timer);
      finished.current = read();
      setElapsed(finished.current);
    };
  }, [active]);

  const given = typeof duration === "number" && Number.isFinite(duration) ? whole(duration) : null;
  const seconds = active ? elapsed : (given ?? (ran ? elapsed : null));
  const words = label ?? (active ? "Thinking" : finishedWords(seconds));
  const showClock = seconds !== null && (active || seconds >= 1);

  /* The two announcements, in words: once at the start and once at the end. Nothing for a thought that was
     loaded finished, and nothing while the reasoning streams. */
  const announced = useRef(false);
  useEffect(() => {
    if (active) {
      announced.current = true;
      setSaid(label ?? "Thinking");
    } else if (announced.current) {
      announced.current = false;
      const took = given ?? finished.current ?? seconds;
      const spoken = took !== null && took >= 1 ? speakClock(took) : null;
      setSaid(label ? (spoken ? `${label} finished after ${spoken}` : `${label} finished`) : spoken ? `Thought for ${spoken}` : finishedWords(took));
    }
    // Only a change of `active` is an announcement, and it says the words of the render that changed it.
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle() {
    const next = !open;
    setTouched(true);
    if (!controlled) setInnerOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div data-state={open ? "open" : "closed"} className={"relative " + className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={toggle}
        className={
          "group inline-flex max-w-full cursor-pointer items-center gap-2 rounded-control text-small font-normal text-fg-muted select-none " +
          "transition-[color] duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
          "hover:text-fg pointer-coarse:active:text-fg pointer-coarse:h-control-md " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
          (coarse ? "h-control-md" : "h-control-sm")
        }
      >
        <ChevronRightIcon
          className={
            "shrink-0 text-fg-subtle transition-[rotate,color] duration-(--dur-instant) ease-litt group-hover:text-fg-muted " +
            (open ? "rotate-90" : "rotate-0")
          }
        />
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 truncate">{words}</span>
          {showClock && (
            <span aria-hidden="true" className="shrink-0 text-caption font-normal tabular-nums text-fg-subtle">
              {formatClock(seconds)}
            </span>
          )}
        </span>
        {/* A finished clock is read in words. A ticking one is never read. */}
        {!active && showClock && <span className="sr-only"> {speakClock(seconds)}</span>}
      </button>

      {/* The region is always here, so aria-controls always points at something. Its own AnimatePresence keeps an
          ancestor's initial={false} from swallowing the entrance. */}
      <div id={bodyId}>
        <AnimatePresence>
          {open && (
            <motion.div
              key="body"
              initial={{ opacity: 0, y: -travel / 4 }}
              animate={{ opacity: 1, y: 0, transition: enter }}
              exit={{ opacity: 0, transition: exit }}
              className="grid max-w-[68ch] gap-2 pt-1 pb-1 pl-6 text-small break-words text-fg-subtle"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </div>
    </div>
  );
}
