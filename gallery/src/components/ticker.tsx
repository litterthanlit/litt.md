/**
 * Ticker, a Flat part (the Flat studies, Ticker; after the components repo's ticker): notifications as one line, a
 * white pill on the grey ground that types each message as it arrives.
 *
 * - The pill: white paper (`bg-surface-1`, no edge and nothing cast) at the pill radius, 52px tall (60 from sm). In it
 *   the message at the reading size and the label weight, then the count ("2 of 4") in the muted ink and two grey
 *   circles (`bg-block`) to step back and on through the queue. A warning leads with "Heads up" and an alert with
 *   "Alert", in words at the title weight, so the tone never rests on a colour. With nothing to say it reads "You're all
 *   caught up" in the muted ink.
 * - A new message: the pill gives a little and comes back on Flat's expressive spring, and the message types on at 42
 *   characters a second behind a caret. A message that fits stays two seconds and a little per character, then the
 *   next one in the queue takes its place. A longer one keeps the caret in view as it types (the line slides with it,
 *   its start fading out under a mask), holds a second at its end, then glides back to its start on the responsive
 *   spring. The last message rests on the line.
 * - Messages already there when it mounts show whole, at once: nothing moves on load (R4). It moves only when the app
 *   gives it a message, which is the point of a ticker.
 * - A hand holds it: hover, focus or a press on the line pauses the typing, the slide and the dwell, and leaving goes on
 *   from where it was. On the line ← and → step through the queue, Home and End go to its ends.
 * - Under reduced motion nothing types or slides: each message shows whole, and a long one is cut with an ellipsis (its
 *   full text is the line's description).
 * - Semantics: the line is a group named Notifications and described by the current message in full ("Notification 2
 *   of 4: Heads up: Storage is 88% full"); each new message is said once in a polite status. The typing itself is
 *   hidden from a screen reader.
 */
import { animate, motion, useAnimate } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { useMotionDial, useTransition } from "@/motion";

export type TickerTone = "info" | "warn" | "alert";

export type TickerMessage = {
  /** Stable and unique: a new id is a new message. */
  id: string | number;
  text: string;
  /** "warn" leads with Heads up, "alert" with Alert. Default "info", which leads with nothing. */
  tone?: TickerTone;
};

export type TickerProps = {
  /** The queue, oldest first. Append to it as notifications arrive; the line types each new one. */
  messages: TickerMessage[];
  /** The group's name for a screen reader. */
  label?: string;
  /** What the line says with no messages. */
  emptyLabel?: string;
  className?: string;
};

/** Each tone's lead word, said and shown. */
export const TONE_WORDS: Record<TickerTone, string> = { info: "", warn: "Heads up", alert: "Alert" };

const TYPE_RATE = 42; // characters a second while typing
const DWELL = 2000; // ms a message that fits stays, plus PER_CHAR a character
const PER_CHAR = 40;
const HOLD = 1000; // ms a long message holds at its end before it glides back

type Phase = "typing" | "dwell" | "hold" | "rest";

export function Ticker({ messages, label = "Notifications", emptyLabel = "You're all caught up", className = "" }: TickerProps) {
  const { reduced } = useMotionDial();
  const pop = useTransition("expressive");
  const glide = useTransition("responsive");
  const described = useId();
  const [scope, animatePill] = useAnimate<HTMLDivElement>();

  /* Which message shows. The first render shows the newest whole; a later arrival is typed. */
  /* Kept by id, so the line stays on its message when older ones drop off the front of the queue. */
  const [shownId, setShownId] = useState<TickerMessage["id"] | null>(() => messages[messages.length - 1]?.id ?? null);
  const at = messages.findIndex((m) => m.id === shownId);
  const setAt = (i: number) => setShownId(messages[i]?.id ?? null);
  const known = useRef(new Set(messages.map((m) => m.id)));
  /* What was there at mount shows whole; only what arrives later types. */
  const initial = useRef(new Set(messages.map((m) => m.id)));
  const [said, setSaid] = useState("");

  const view = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const [long, setLong] = useState(false);
  const [moved, setMoved] = useState(false);

  /* The hand: hover, focus and a press each hold the line. */
  const holds = useRef(new Set<string>());
  const [held, setHeld] = useState(false);
  const hold = (why: string, on: boolean) => {
    if (on) holds.current.add(why);
    else holds.current.delete(why);
    setHeld(holds.current.size > 0);
  };

  /* An arrival: the newest new message is the one the line goes to, and it is said once. */
  useEffect(() => {
    const added = messages.filter((m) => !known.current.has(m.id));
    for (const m of messages) known.current.add(m.id);
    if (!messages.length) {
      setShownId(null);
      return;
    }
    const lost = !messages.some((m) => m.id === shownId);
    if (!added.length) {
      if (lost) setShownId(messages[0].id);
      return;
    }
    if (lost || phaseRef.current === "rest") setShownId(added[0].id);
    const last = added[added.length - 1];
    setSaid((TONE_WORDS[last.tone ?? "info"] ? `${TONE_WORDS[last.tone ?? "info"]}: ` : "") + last.text);
    if (!reduced && scope.current) animatePill(scope.current, { scale: [0.96, 1] }, pop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const current = at >= 0 ? messages[at] : undefined;
  const phaseRef = useRef<Phase>("rest");
  const [phase, setPhase] = useState<Phase>("rest");
  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  /* A new current message: typed if it arrived since mount and motion is allowed, else shown whole. */
  const typed = useRef(Infinity);
  const offset = useRef(0);
  const chars = useRef<string[]>([]);
  const paint = () => {
    const t = text.current;
    const v = view.current;
    if (!t || !v) return;
    const shown = Number.isFinite(typed.current) ? chars.current.slice(0, Math.floor(typed.current)).join("") : chars.current.join("");
    if (t.textContent !== shown) t.textContent = shown;
    const width = t.scrollWidth;
    const room = v.clientWidth;
    if (phaseRef.current === "typing") offset.current = Math.max(0, width + 6 - room);
    t.style.transform = `translateX(${-offset.current}px)`;
    if (caret.current) caret.current.style.transform = `translateX(${width - offset.current}px)`;
    setMoved(offset.current > 0.5);
  };

  useLayoutEffect(() => {
    if (!current) {
      go("rest");
      return;
    }
    chars.current = Array.from(current.text);
    offset.current = 0;
    const typeIt = !reduced && !initial.current.has(current.id);
    typed.current = typeIt ? 0 : Infinity;
    go(typeIt ? "typing" : "dwell");
    paint();
    const t = text.current;
    const v = view.current;
    if (t && v) {
      t.textContent = chars.current.join("");
      setLong(t.scrollWidth > v.clientWidth + 1);
      paint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, reduced]);


  /* The typing loop. */
  useEffect(() => {
    if (phase !== "typing" || held) return;
    let last = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      typed.current = Math.min(chars.current.length, typed.current + TYPE_RATE * Math.min(0.1, (now - last) / 1000));
      last = now;
      paint();
      if (typed.current >= chars.current.length) {
        typed.current = Infinity;
        go(offset.current > 0 ? "hold" : "dwell");
        return;
      }
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, held]);

  /* The dwell, and a long message's hold at its end: then the next message, or, with nothing after it, a long one
     glides back to its start and rests there. What is left of the wait is kept for the message and phase it belongs
     to, so a hand pauses it and a step starts the next one afresh. */
  const left = useRef<{ key: string; ms: number } | null>(null);
  useEffect(() => {
    if ((phase !== "dwell" && phase !== "hold") || !current || held) return;
    const key = `${current.id}:${phase}`;
    if (left.current?.key !== key) left.current = { key, ms: phase === "hold" ? HOLD : DWELL + current.text.length * PER_CHAR };
    const started = performance.now();
    const timer = window.setTimeout(() => {
      left.current = null;
      if (at < messages.length - 1) {
        setAt(at + 1);
        return;
      }
      go("rest");
      if (phase === "hold")
        animate(offset.current, 0, {
          ...glide,
          onUpdate: (x) => {
            offset.current = x;
            paint();
          },
        });
    }, left.current.ms);
    return () => {
      window.clearTimeout(timer);
      if (left.current?.key === key) left.current.ms = Math.max(0, left.current.ms - (performance.now() - started));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, held, current?.id]);

  const step = (to: number) => {
    if (!messages.length || to < 0 || to >= messages.length || to === at) return;
    left.current = null;
    setAt(to);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const to = ({ ArrowLeft: at - 1, ArrowRight: at + 1, Home: 0, End: messages.length - 1 } as Record<string, number>)[e.key];
    if (to === undefined || e.target !== e.currentTarget) return;
    e.preventDefault();
    step(to);
  };

  const word = current ? TONE_WORDS[current.tone ?? "info"] : "";
  const now = current ? `Notification ${at + 1} of ${messages.length}: ${word ? `${word}: ` : ""}${current.text}` : emptyLabel;
  const mask = !reduced && long ? (moved ? "[mask-image:linear-gradient(90deg,transparent,black_20px,black_calc(100%-20px),transparent)]" : "[mask-image:linear-gradient(90deg,black_calc(100%-20px),transparent)]") : "";

  return (
    <div className={"grid w-full max-w-lg min-w-0 " + className}>
      <motion.div
        ref={scope}
        role="group"
        tabIndex={0}
        aria-label={label}
        aria-describedby={described}
        onKeyDown={onKey}
        onPointerEnter={(e) => e.pointerType === "mouse" && hold("hover", true)}
        onPointerLeave={() => hold("hover", false)}
        onFocus={() => hold("focus", true)}
        onBlur={() => hold("focus", false)}
        className="flex h-13 w-full min-w-0 items-center gap-2.5 rounded-pill bg-surface-1 ps-5 pe-2 text-fg select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border sm:h-15 sm:ps-6"
      >
        {word && (
          <span aria-hidden="true" className="shrink-0 text-body font-title">
            {word}
          </span>
        )}
        <span ref={view} aria-hidden="true" className={"relative h-full min-w-0 flex-1 overflow-hidden " + mask}>
          {current ? (
            <>
              <span
                ref={text}
                className={"absolute top-1/2 left-0 -translate-y-1/2 text-body font-label " + (reduced && long ? "max-w-full truncate" : "whitespace-pre")}
              />
              {phase === "typing" && <span ref={caret} className="absolute top-1/2 left-0 -mt-2.5 h-5 w-0.5 rounded-pill bg-fg" />}
            </>
          ) : (
            <span className="absolute inset-0 flex items-center text-body text-fg-muted">{emptyLabel}</span>
          )}
        </span>
        {messages.length > 0 && (
          <span aria-hidden="true" className="shrink-0 text-small whitespace-nowrap text-fg-muted tabular-nums">
            {at + 1} of {messages.length}
          </span>
        )}
        <span className="flex shrink-0">
          {[
            { to: at - 1, name: "Previous notification", d: "M8.5 3.5 5 7l3.5 3.5", off: at <= 0 },
            { to: at + 1, name: "Next notification", d: "M5.5 3.5 9 7l-3.5 3.5", off: at >= messages.length - 1 },
          ].map((b) => (
            <button
              key={b.name}
              type="button"
              tabIndex={-1}
              aria-label={b.name}
              aria-disabled={b.off}
              onClick={() => !b.off && step(b.to)}
              className={
                "litt-target relative grid size-10 place-items-center rounded-pill bg-block text-fg transition-[scale,opacity] duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] forced-colors:border " +
                (b.off ? "cursor-default opacity-40" : "cursor-pointer active:scale-[var(--press-scale)]")
              }
            >
              <svg viewBox="0 0 14 14" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d={b.d} />
              </svg>
            </button>
          ))}
        </span>
      </motion.div>
      <p id={described} className="sr-only">
        {now}. Hover or focus to pause; the left and right arrows step through the notifications.
      </p>
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
