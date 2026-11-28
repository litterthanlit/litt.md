/**
 * HoldConfirm, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a destructive action that asks for intent.
 * A draft on one white paper, and under it a grey pill that fills with the ink from the left while you hold it.
 *
 * - Press and hold the pill (mouse, touch, or Space and Enter): the ink grows across it from the left, its words turning
 *   to paper as it passes. Let go early and the ink runs back. Once full it stays lit a moment, then the pill turns into
 *   the done line and an ink Undo pill, the draft's name struck through.
 * - Undo brings the draft back, rising in on the expressive spring, and the pill is ready again.
 * - Under reduced motion a single click or key press confirms, with no timed hold.
 * - The ink is the only colour, no accent fill (R6), and nothing moves until a hand presses (R4).
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type HoldConfirmProps = {
  /** Small quiet label above the title while the item is there, e.g. "Draft". */
  eyebrow?: string;
  /** The item the action acts on, standing as the card's figure. */
  title?: string;
  /** Quiet line under the title, e.g. "412 words, edited Tuesday". */
  readyNote?: string;
  /** The words beside Undo once the hold completes, e.g. "Draft deleted". */
  doneNote?: string;
  /** The pill's words, e.g. "Hold to delete". */
  actionLabel?: string;
  /** The pill's words while it is held. Defaults to `actionLabel`. */
  holdingLabel?: string;
  /** Small quiet label above the title once the hold completes, e.g. "Deleted". */
  doneLabel?: string;
  /** Hold duration in milliseconds. Default 1200. */
  duration?: number;
  /** Fires when the hold reaches the end. */
  onConfirm?: () => void;
  /** Fires when the reader chooses Undo after confirming. */
  onUndo?: () => void;
  /**
   * Rehearses the action each time it changes, for a demo that runs itself: a full hold if the item is there, Undo if
   * it is gone. A rehearsal moves no focus, says nothing and fires neither onConfirm nor onUndo. Leave it out and only
   * a hand holds.
   */
  rehearse?: number;
  className?: string;
};

/* How fast the ink runs back when let go early, and how long a full pill stays lit before it turns into Undo. These
   are the hold's own timing (what the hand is doing), not an animation's. */
const REWIND_MS = 220;
const LIT_MS = 450;

/** Flat's hold to confirm: a draft on paper and a pill that fills with the ink while held, then offers Undo. */
export function HoldConfirm({
  eyebrow = "Draft",
  title = "Spring issue",
  readyNote = "412 words, edited Tuesday",
  doneNote = "Draft deleted",
  actionLabel = "Hold to delete",
  holdingLabel,
  doneLabel = "Deleted",
  duration = 1200,
  onConfirm,
  onUndo,
  rehearse,
  className = "",
}: HoldConfirmProps) {
  const { reduced } = useMotionDial();
  const arrive = useTransition("expressive");
  const press = useTransition("responsive");
  const hintId = useId();
  const safeDuration = Math.max(300, duration);

  const [progress, setProgress] = useState(0); // 0..1
  const [holding, setHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [restored, setRestored] = useState(0);
  const [live, setSpoken] = useState("");
  /* True while a rehearsal plays: it is not the hand's, so it moves no focus, says nothing and calls nothing. */
  const rehearsing = useRef(false);
  const setLive = useCallback((line: string) => !rehearsing.current && setSpoken(line), []);

  const rafRef = useRef<number | null>(null);
  const litRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const holdingRef = useRef(false);
  const lastFrameRef = useRef<number | null>(null);
  const holdRef = useRef<HTMLButtonElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const focusNext = useRef<"undo" | "hold" | null>(null);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameRef.current = null;
  }, []);

  const finish = useCallback(() => {
    litRef.current = null;
    progressRef.current = 0;
    setProgress(0);
    const active = document.activeElement;
    if (!rehearsing.current && (active === holdRef.current || active === document.body)) focusNext.current = "undo";
    setConfirmed(true);
    setLive(`${doneNote}: ${title}. Undo is available.`);
    if (!rehearsing.current) onConfirm?.();
    rehearsing.current = false;
  }, [doneNote, onConfirm, setLive, title]);

  const complete = useCallback(() => {
    stopLoop();
    holdingRef.current = false;
    progressRef.current = 1;
    setHolding(false);
    setProgress(1);
    // Full, the pill stays lit a moment so the hand sees it land, then turns into Undo.
    litRef.current = window.setTimeout(finish, reduced ? 0 : LIT_MS);
  }, [finish, reduced, stopLoop]);

  const tick = useCallback(
    (now: number) => {
      const prev = lastFrameRef.current ?? now;
      const dt = Math.min(64, Math.max(0, now - prev));
      lastFrameRef.current = now;

      if (holdingRef.current) {
        const next = Math.min(1, progressRef.current + dt / safeDuration);
        progressRef.current = next;
        setProgress(next);
        if (next >= 1) {
          complete();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      } else {
        const next = Math.max(0, progressRef.current - dt / REWIND_MS);
        progressRef.current = next;
        setProgress(next);
        if (next > 0) rafRef.current = requestAnimationFrame(tick);
        else stopLoop();
      }
    },
    [complete, safeDuration, stopLoop],
  );

  const startHold = useCallback(() => {
    if (confirmed || holdingRef.current || litRef.current !== null) return;
    if (reduced) {
      complete();
      return;
    }
    holdingRef.current = true;
    setHolding(true);
    lastFrameRef.current = performance.now();
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
  }, [complete, confirmed, reduced, tick]);

  const endHold = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    if (progressRef.current < 1) {
      setLive("Let go early. Nothing changed.");
      lastFrameRef.current = performance.now();
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    }
  }, [setLive, tick]);

  const undo = useCallback(() => {
    stopLoop();
    holdingRef.current = false;
    progressRef.current = 0;
    setHolding(false);
    setProgress(0);
    if (!rehearsing.current) focusNext.current = "hold";
    setConfirmed(false);
    setRestored((n) => n + 1);
    setLive(`${title} restored.`);
    if (!rehearsing.current) onUndo?.();
  }, [onUndo, setLive, stopLoop, title]);

  /* A rehearsal: a full hold while the item is there, Undo once it is gone.  */
  const latest = useRef({ confirmed, startHold, undo });
  latest.current = { confirmed, startHold, undo };
  const firstRehearsal = useRef(rehearse);
  useEffect(() => {
    if (rehearse === undefined || rehearse === firstRehearsal.current) return;
    const { confirmed: gone, startHold: hold, undo: back } = latest.current;
    rehearsing.current = true;
    if (gone) {
      back();
      rehearsing.current = false;
    } else hold();
  }, [rehearse]);

  // Focus follows the hand: from the pill to Undo once it turns, and back to the pill after Undo.
  useEffect(() => {
    const target = focusNext.current === "undo" ? undoRef.current : focusNext.current === "hold" ? holdRef.current : null;
    focusNext.current = null;
    target?.focus({ preventScroll: true });
  }, [confirmed]);

  useEffect(
    () => () => {
      stopLoop();
      if (litRef.current !== null) window.clearTimeout(litRef.current);
    },
    [stopLoop],
  );

  const seconds = (safeDuration / 1000).toFixed(1).replace(/\.0$/, "");
  const label = holding && holdingLabel ? holdingLabel : actionLabel;

  return (
    <div
      data-part="paper"
      className={"litt-paper grid w-full max-w-sm min-w-0 gap-5 rounded-surface bg-surface-1 p-5 text-fg select-none forced-colors:border " + className}
    >
      {/* The draft: a quiet label, its name standing as the figure, and one quiet line */}
      <motion.div
        key={restored}
        initial={reduced || restored === 0 ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={arrive}
        className="grid min-w-0 gap-1"
      >
        <span data-part="lettering" className="truncate text-small text-fg-subtle">
          {confirmed ? doneLabel : eyebrow}
        </span>
        <span
          data-part="figure"
          className={
            "truncate text-figure " + (confirmed ? "text-fg-subtle line-through decoration-2" : "text-fg")
          }
        >
          {title}
        </span>
        <span data-part="lettering" className="truncate text-small text-fg-subtle">
          {readyNote}
        </span>
      </motion.div>

      {/* The pill, or once it has run, the done line and Undo in its place */}
      <div className="relative h-13">
        {confirmed ? (
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={arrive}
              className="absolute inset-0 flex items-center justify-between gap-3 pl-1"
            >
              <span data-part="lettering" className="min-w-0 truncate text-body font-title text-fg">
                {doneNote}
              </span>
              <button
                ref={undoRef}
                type="button"
                data-part="pill"
                onClick={undo}
                className="litt-target relative inline-flex h-full shrink-0 cursor-pointer items-center rounded-pill bg-fg px-6 text-body font-title text-canvas transition-[opacity,transform] duration-(--dur-instant) ease-litt hover:opacity-90 motion-safe:active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
              >
                Undo
              </button>
            </motion.div>
        ) : (
          <motion.button
            ref={holdRef}
            type="button"
            data-part="pill"
            aria-label={`${actionLabel}: ${title}`}
            aria-describedby={hintId}
            onPointerDown={(e) => {
              if (e.button !== 0 && e.pointerType === "mouse") return;
              e.currentTarget.setPointerCapture?.(e.pointerId);
              startHold();
            }}
            onPointerUp={endHold}
            onPointerCancel={endHold}
            onLostPointerCapture={endHold}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.repeat) return;
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                startHold();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                endHold();
              }
            }}
            onBlur={endHold}
            animate={reduced ? undefined : { scale: holding ? 0.98 : 1 }}
            transition={press}
            className="litt-target absolute inset-0 cursor-pointer touch-none overflow-hidden rounded-pill bg-block text-body font-title text-fg [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
          >
            <span className="absolute inset-0 grid place-items-center px-4">{label}</span>
            {/* The ink: an ink pill that slides in from the left under the button's own round clip, its words held still */}
            <span
              aria-hidden="true"
              data-part="mark"
              className="absolute inset-0 overflow-hidden rounded-pill bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
              style={{ transform: `translateX(${(progress - 1) * 100}%)` }}
            >
              <span
                className="absolute inset-0 grid place-items-center px-4"
                style={{ transform: `translateX(${(1 - progress) * 100}%)` }}
              >
                {label}
              </span>
            </span>
          </motion.button>
        )}
      </div>

      <span id={hintId} className="sr-only">
        {reduced ? "Press to confirm." : `Press and hold for ${seconds} seconds to confirm.`}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
