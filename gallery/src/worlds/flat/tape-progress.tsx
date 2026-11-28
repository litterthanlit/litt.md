/**
 * Tape progress, the Flat body (the Flat studies, Tape reels: the progress underneath the reels): one white paper with
 * the label and its state at the top left, the percentage as the large figure at the top right, a fat pill under them
 * that fills with the ink, and the message and the action at the foot.
 *
 * - The pill: the grey bubble (`bg-block`) at the pill radius, 20px tall, its fill the ink drawn by a clip, so only a
 *   clip changes as it fills. The figure is `text-figure-lg`, with a small "%" in the muted ink.
 * - Motion: the value is eased by the reels' spring (critically damped, stiffness 140, damping 24, in fixed steps), so
 *   a progress that arrives in uneven steps glides instead of snapping. The loop writes the clip and the figure on the
 *   elements it has, never React state, and stops when the spring has settled. Nothing moves on its own (R4), and the
 *   first render sits at the value. Reduced motion jumps to each new value.
 * - Ending: done fills the pill and the state says Done; failed stops where it is and says Failed in --danger; with no
 *   value yet the pill is empty and the state says Waiting.
 */
import { useEffect, useId, useRef } from "react";
import { useMotionDial } from "@/motion";
import { DAMPING, STEP, STIFFNESS, type TapeProgressProps } from "@/components/tape-progress";

const clipOf = (p: number) => `inset(0 ${((1 - p) * 100).toFixed(3)}% 0 0 round 999px)`;

export function TapeProgressFlatBody({ label, value, max = 100, valueText, status = "active", message, hideLabel = false, action, className = "" }: TapeProgressProps) {
  const labelId = useId();
  const messageId = useId();
  const { reduced } = useMotionDial();
  const known = value !== undefined || status === "done";
  const share = status === "done" ? 1 : max > 0 && value !== undefined ? Math.max(0, Math.min(1, value / max)) : 0;
  const reading =
    status === "done" ? "Done" : status === "failed" ? "Failed" : value === undefined ? (valueText ?? "Waiting") : (valueText ?? `${Math.round(share * 100)}%`);
  const state = status === "done" ? "Done" : status === "failed" ? "Failed" : value === undefined ? "Waiting" : null;

  const fill = useRef<HTMLSpanElement>(null);
  const figure = useRef<HTMLSpanElement>(null);
  const first = useRef(share);
  const sim = useRef({ x: share, v: 0, target: share, frame: 0, ready: false });

  const paint = (x: number) => {
    if (fill.current) fill.current.style.clipPath = clipOf(x);
    if (figure.current) figure.current.textContent = String(Math.round(x * 100));
  };

  useEffect(() => {
    const s = sim.current;
    s.target = share;
    cancelAnimationFrame(s.frame);
    s.frame = 0;
    if (reduced || !s.ready) {
      s.ready = true;
      s.x = share;
      s.v = 0;
      paint(share);
      return;
    }
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      while (acc >= STEP) {
        s.v += (STIFFNESS * (s.target - s.x) - DAMPING * s.v) * STEP;
        s.x += s.v * STEP;
        acc -= STEP;
      }
      const settled = Math.abs(s.target - s.x) < 5e-5 && Math.abs(s.v) < 1e-3;
      if (settled) {
        s.x = s.target;
        s.v = 0;
      }
      paint(s.x);
      s.frame = settled ? 0 : requestAnimationFrame(frame);
    };
    s.frame = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(s.frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share, reduced]);

  return (
    <div className={"litt-paper grid w-full max-w-sm min-w-0 gap-4 rounded-surface bg-surface-1 p-5 text-fg select-none forced-colors:border " + className}>
      <div className={hideLabel ? "sr-only" : "flex min-w-0 items-baseline justify-between gap-4"}>
        <span className="grid min-w-0 gap-0.5">
          <span id={labelId} className="truncate text-body font-label">
            {label}
          </span>
          {state && <span className={"text-small " + (status === "failed" ? "text-danger" : "text-fg-muted")}>{state}</span>}
        </span>
        <span aria-hidden="true" className="shrink-0 text-figure-lg leading-none whitespace-nowrap tabular-nums">
          <span ref={figure}>{Math.round(first.current * 100)}</span>
          <small className="ms-0.5 text-body font-label text-fg-muted">%</small>
        </span>
      </div>
      <div
        role="progressbar"
        aria-labelledby={labelId}
        aria-describedby={message ? messageId : undefined}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={known ? Math.round(share * max) : undefined}
        aria-valuetext={reading}
        className="relative h-5 overflow-hidden rounded-pill bg-block forced-colors:border"
      >
        <span ref={fill} aria-hidden="true" className="absolute inset-0 rounded-pill bg-fg forced-colors:bg-[CanvasText]" style={{ clipPath: clipOf(first.current) }} />
      </div>
      {(message || action) && (
        <div className="flex min-w-0 items-center justify-between gap-3">
          {message ? (
            <p id={messageId} className={"min-w-0 truncate text-small tabular-nums " + (status === "failed" ? "text-danger" : "text-fg-muted")}>
              {message}
            </p>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      <span role="status" className="sr-only">
        {status === "active" ? "" : `${typeof label === "string" ? `${label}: ` : ""}${status === "done" ? "done" : "failed"}.`}
      </span>
    </div>
  );
}
