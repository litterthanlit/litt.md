/**
 * HoldConfirm, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): an intentional publishing action
 * framed on a white paper card with no outline and nothing cast.
 *
 * - Press and hold the pill (mouse, touch, or Space/Enter) and one ink bar fills alongside a live 28px percentage
 *   readout (`text-figure`); releasing early springs smoothly back to zero, while holding to
 *   100% completes the action with Flat's expressive bounce (0.28) and offers one-tap Undo.
 * - Under reduced motion, a single click or key press confirms without requiring a timed hold.
 * - Zero `--accent` misuse (one primary ink action button per card, R6) and zero auto-animation on mount (R4).
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type HoldConfirmProps = {
  /** Small category label above the title. */
  eyebrow?: string;
  /** Main action title shown on the paper card. */
  title?: string;
  /** Quiet note under the title before confirming. */
  readyNote?: string;
  /** Quiet note under the title after confirming. */
  doneNote?: string;
  /** Primary button label while idle. */
  actionLabel?: string;
  /** Primary button label while actively held. */
  holdingLabel?: string;
  /** Label shown once the hold completes. */
  doneLabel?: string;
  /** Hold duration in milliseconds. Default 1200. */
  duration?: number;
  /** Fires when the hold reaches 100%. */
  onConfirm?: () => void;
  /** Fires when the reader chooses Undo after confirming. */
  onUndo?: () => void;
  className?: string;
};

/** Flat's press-and-hold confirmation card: one ink bar, 28px live readout, spring pop and Undo. */
export function HoldConfirm({
  eyebrow = "Newsletter",
  title = "Publish Issue 15",
  readyNote = "Ready · 1,204 subscribers",
  doneNote = "Sent to 1,204 subscribers",
  actionLabel = "Hold to publish",
  holdingLabel = "Keep holding…",
  doneLabel = "Published",
  duration = 1200,
  onConfirm,
  onUndo,
  className = "",
}: HoldConfirmProps) {
  const { reduced } = useMotionDial();
  const spring = useTransition("expressive");
  const headingId = useId();
  const safeDuration = Math.max(300, duration);

  const [progress, setProgress] = useState(0); // 0..1
  const [holding, setHolding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [live, setLive] = useState("");

  const rafRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const holdingRef = useRef(false);
  const lastFrameRef = useRef<number | null>(null);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastFrameRef.current = null;
  }, []);

  const complete = useCallback(() => {
    stopLoop();
    holdingRef.current = false;
    progressRef.current = 1;
    setHolding(false);
    setProgress(1);
    setConfirmed(true);
    setLive(`${title}: ${doneNote}.`);
    onConfirm?.();
  }, [doneNote, onConfirm, stopLoop, title]);

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
        // Spring back smoothly when released early (~240ms full rewind)
        const next = Math.max(0, progressRef.current - dt / 240);
        progressRef.current = next;
        setProgress(next);
        if (next > 0) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          stopLoop();
        }
      }
    },
    [complete, safeDuration, stopLoop],
  );

  const startHold = useCallback(() => {
    if (confirmed) return;
    if (reduced) {
      complete();
      return;
    }
    holdingRef.current = true;
    setHolding(true);
    lastFrameRef.current = performance.now();
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [complete, confirmed, reduced, tick]);

  const endHold = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    if (progressRef.current < 1) {
      setLive("Cancelled before sending.");
      lastFrameRef.current = performance.now();
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
  }, [tick]);

  const undo = useCallback(() => {
    stopLoop();
    holdingRef.current = false;
    progressRef.current = 0;
    setHolding(false);
    setProgress(0);
    setConfirmed(false);
    setLive(`Undid ${title}. Ready to send again.`);
    onUndo?.();
  }, [onUndo, stopLoop, title]);

  useEffect(() => stopLoop, [stopLoop]);

  const pct = Math.round(progress * 100);
  const seconds = (safeDuration / 1000).toFixed(1).replace(/\.0$/, "");

  return (
    <div
      data-part="paper"
      className={"litt-paper grid w-full max-w-sm min-w-0 gap-4 rounded-surface bg-surface-1 p-6 text-fg forced-colors:border " + className}
    >
      {/* Quiet eyebrow, title and note */}
      <header className="grid gap-1">
        <span data-part="lettering" className="truncate text-caption font-normal text-fg-subtle">
          {eyebrow}
        </span>
        <span id={headingId} data-part="lettering" className="truncate text-body font-title text-fg">
          {title}
        </span>
        <span data-part="lettering" className="truncate pt-1 text-caption font-normal text-fg-subtle">
          {confirmed ? doneNote : readyNote}
        </span>
      </header>

      {/* Standing 28px live readout + one ink bar */}
      <div className="grid gap-2">
        <div className="flex items-baseline gap-2">
          <motion.span
            key={confirmed ? "done" : "pct"}
            data-part="figure"
            initial={reduced ? false : { scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={spring}
            className="inline-block origin-left text-figure tabular-nums text-fg"
          >
            {confirmed ? doneLabel : `${pct}%`}
          </motion.span>
          <span data-part="lettering" className="text-small tabular-nums text-fg-subtle">
            {confirmed ? "Just now" : holding ? "Release to cancel" : `Hold ${seconds}s to confirm`}
          </span>
        </div>

        <div
          role="progressbar"
          aria-labelledby={headingId}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={confirmed ? doneNote : `${pct}% held`}
          data-part="bubble"
          className="h-2 overflow-hidden rounded-pill forced-colors:border"
          style={{ backgroundColor: "color-mix(in oklab, var(--fg) 10%, transparent)" }}
        >
          <span
            data-part="mark"
            aria-hidden="true"
            className="block h-full rounded-pill bg-fg forced-colors:bg-[Highlight]"
            style={{ transform: `translateX(${(progress - 1) * 100}%)` }}
          />
        </div>
      </div>

      {/* Primary action pill (one ink fill, R6) or Undo once confirmed */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {confirmed ? (
          <>
            <motion.span
              initial={reduced ? false : { scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring}
              data-part="lettering"
              className="inline-flex items-center gap-2 text-small font-title text-fg"
            >
              <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
                <path
                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{doneLabel}</span>
            </motion.span>
            <button
              type="button"
              data-part="pill"
              onClick={undo}
              className="litt-target relative inline-flex h-control-sm cursor-pointer items-center rounded-pill bg-block px-4 text-small font-title text-fg transition-colors duration-(--dur-instant) ease-litt hover:bg-(--block-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
            >
              Undo
            </button>
          </>
        ) : (
          <motion.button
            type="button"
            data-part="pill"
            aria-label={`${actionLabel}: ${title}. Hold for ${seconds} seconds to confirm.`}
            onPointerDown={(e) => {
              if (e.button !== 0 && e.pointerType === "mouse") return;
              e.currentTarget.setPointerCapture?.(e.pointerId);
              startHold();
            }}
            onPointerUp={endHold}
            onPointerCancel={endHold}
            onLostPointerCapture={endHold}
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
            animate={reduced ? undefined : { scale: holding ? 0.96 : 1 }}
            transition={spring}
            className="litt-target relative inline-flex h-control-md w-full cursor-pointer items-center justify-center rounded-pill bg-fg px-4 text-small font-title text-canvas select-none [-webkit-tap-highlight-color:transparent] transition-opacity duration-(--dur-instant) ease-litt hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
          >
            {holding ? holdingLabel : actionLabel}
          </motion.button>
        )}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
