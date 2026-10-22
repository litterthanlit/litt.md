/**
 * Timeline · fun mode. Every settled frame is the Timeline (timeline.tsx) to the pixel: four columns, the 16px status
 * icons on a 1px line-strong rail, the phase headings with their totals, the result under a hairline.
 *
 * - The run plays in time-lapse. A step that starts pops its running icon in; a step that ends draws its check, as a
 *   pen would, and its label steps from fg-subtle to fg. The running step's duration ticks in the mono.
 * - A phase's total arrives when its last step ends. The result rises in last, and a run that went live gets the one
 *   celebration: a few dots in the phases' own hues, once.
 * - A step that fails shakes its icon once, sideways, the way a wrong password does, and the steps after it are skipped.
 * - Under reduced motion each state simply replaces the last; the run still plays, because its states are data.
 */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTransition, useTravel } from "@/motion";
import { FUN, useFun } from "./motion";
import { DrawPath } from "./settle";
import type { FunHue } from "./meter";

export type Status = "done" | "running" | "pending" | "skipped" | "failed";
export type FunPhase = { label: string; hue: FunHue; steps: { label: string; seconds: number }[] };

const ICON_TONE: Record<Status, string> = {
  done: "text-fg-muted",
  running: "text-fg",
  pending: "text-fg-subtle",
  skipped: "text-fg-subtle",
  failed: "text-danger",
};
const DOT_HUE: Record<FunHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
};
/** How many run seconds pass in one real second while it plays. */
const SPEED = 5;

const fmt = (s: number) => (s < 60 ? `${Math.floor(s)}s` : `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s`);
const clock = (s: number) => `00:${String(Math.floor(s)).padStart(2, "0")}`;

export type FunTimelineProps = {
  label: string;
  phases: FunPhase[];
  result: string;
  failed: string;
  /** Change it to play the run from the start. */
  play: number;
  /** Fail the last step of the first phase on this run. */
  fail: boolean;
};

/** The run's clock and every step's status, shared by fun mode and today's Timeline so both play the same run. */
export function useRun(phases: FunPhase[], play: number, fail: boolean) {
  const flat = useMemo(() => {
    let at = 0;
    return phases.flatMap((p, pi) => p.steps.map((s) => ({ ...s, phase: pi, start: (at += s.seconds) - s.seconds, end: at })));
  }, [phases]);
  const total = flat.at(-1)?.end ?? 0;
  /* Which step fails, and when: most of the way through the first phase's last step. Fixed for a run when it starts,
     so turning the switch afterwards never rewrites a run that already happened. */
  const failStep = phases[0]!.steps.length - 1;
  const failTime = flat[failStep]!.start + flat[failStep]!.seconds * 0.7;
  const [runFails, setRunFails] = useState(false);
  const failing = runFails ? failStep : -1;
  const failAt = runFails ? failTime : Infinity;

  /* The run's clock. At rest (before the first play) the run is over: the Timeline's own settled frame. */
  const [t, setT] = useState(play === 0 ? total : 0);
  useEffect(() => {
    if (play === 0) return;
    const stop = fail ? failTime : total;
    setRunFails(fail);
    setT(0);
    let frame = 0;
    const began = performance.now();
    const step = (now: number) => {
      const next = Math.min(stop, ((now - began) / 1000) * SPEED);
      setT(next);
      if (next < stop) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a run starts on `play` only; `fail` is read for that run
  }, [play]);

  const failedRun = play > 0 && runFails;
  const statusOf = (i: number): Status => {
    const s = flat[i]!;
    if (failedRun && i === failing && t >= failAt) return "failed";
    if (failedRun && t >= failAt && i > failing) return "skipped";
    if (t >= s.end) return "done";
    if (t >= s.start) return "running";
    return "pending";
  };
  const ended = failedRun ? t >= failAt : t >= total;

  return { flat, total, failing, failAt, t, statusOf, ended, failedRun };
}

export function FunTimeline({ label, phases, result, failed: failedLabel, play, fail }: FunTimelineProps) {
  const fun = useFun();
  const { flat, total, failAt, t, statusOf, ended, failedRun } = useRun(phases, play, fail);

  return (
    <ol role="list" aria-label={label} className="@container m-0 list-none p-0">
      {phases.map((phase, pi) => {
        const steps = flat.map((s, i) => ({ ...s, i })).filter((s) => s.phase === pi);
        const phaseDone = steps.every((s) => statusOf(s.i) === "done");
        const phaseTotal = steps.reduce((sum, s) => sum + s.seconds, 0);
        return (
          <li key={phase.label} className="not-first:mt-4">
            <div className="flex min-h-8 items-center justify-between gap-4">
              <span className="text-small text-fg-subtle">{phase.label}</span>
              <AnimatePresence initial={false}>
                {phaseDone && (
                  <motion.span
                    key="total"
                    className="font-mono text-caption font-normal tabular-nums text-fg-subtle"
                    initial={{ opacity: 0, y: fun.reduced ? 0 : 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={fun.pop}
                  >
                    {fmt(phaseTotal)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <ol role="list" aria-label={phase.label} className="m-0 list-none p-0">
              {steps.map((s) => {
                const status = statusOf(s.i);
                const ran = status === "done" || status === "running" || status === "failed";
                const took = status === "running" ? t - s.start : status === "failed" ? failAt - s.start : s.seconds;
                const dim = status === "pending" || status === "skipped";
                return (
                  <li
                    key={s.label}
                    data-step=""
                    className="grid min-h-8 grid-cols-[2.5rem_1rem_minmax(0,1fr)_auto] items-start gap-x-3 @min-[28rem]:grid-cols-[3rem_1rem_minmax(0,1fr)_auto] @min-[28rem]:gap-x-4"
                  >
                    <span className="flex h-8 items-center whitespace-nowrap font-mono text-caption font-normal tabular-nums text-fg-subtle">
                      {ran ? clock(s.start) : ""}
                    </span>
                    <span aria-hidden="true" className="relative block self-stretch">
                      <span className="absolute top-0 left-1/2 hidden h-2 w-px -translate-x-1/2 bg-line-strong [[data-step]+[data-step]_&]:block" />
                      <span className="absolute top-6 bottom-0 left-1/2 hidden w-px -translate-x-1/2 bg-line-strong [[data-step]:has(+[data-step])_&]:block" />
                      <Icon key={status} status={status} live={play > 0} />
                    </span>
                    <span
                      className={
                        "relative min-w-0 self-stretch py-1.5 text-small transition-colors duration-(--dur-instant) ease-litt " +
                        (dim ? "text-fg-subtle" : "text-fg")
                      }
                    >
                      {s.label}
                      <span className="sr-only">{`, ${status}`}</span>
                    </span>
                    <span className="flex h-8 items-center justify-end whitespace-nowrap font-mono text-caption font-normal tabular-nums text-fg-subtle">
                      {status === "skipped" ? "skipped" : ran ? fmt(took) : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          </li>
        );
      })}
      <AnimatePresence initial={false}>
        {ended && (
          <Result key={`${play}-${failedRun}`} label={failedRun ? failedLabel : result} total={failedRun ? fmt(failAt) : fmt(total)} tone={failedRun ? "danger" : "success"} hues={phases.map((p) => p.hue)} celebrate={play > 0 && !failedRun} />
        )}
      </AnimatePresence>
    </ol>
  );
}

/** The step icons, the Timeline's own: a check in a circle, a half-filled circle, an empty one, a dashed one, an x. In a
    live run a new status pops in (a failure shakes), then the plain icon takes over, as in the Timeline. */
function Icon({ status, live }: { status: Status; live: boolean }) {
  const fun = useFun();
  const [settled, setSettled] = useState(!live || fun.reduced || status === "pending");
  const skipped = status === "skipped";
  const look = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    className: "absolute top-2 left-0 " + ICON_TONE[status],
  };
  const marks = (drawCheck: boolean) => (
    <>
      <circle cx="8" cy="8" r="6.25" strokeDasharray={skipped ? "2.45" : undefined} strokeLinecap={skipped ? "butt" : undefined} />
      {status === "done" && <DrawPath d="m5.25 8.25 2 2 3.5-4.25" draw={drawCheck} transition={{ ...FUN.draw, duration: 0.28 } /* litt-allow: fun mode, the check draws */} />}
      {status === "running" && <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" />}
      {status === "failed" && <path d="m6 6 4 4m0-4-4 4" />}
    </>
  );
  if (settled) return <svg {...look}>{marks(false)}</svg>;
  return (
    <motion.svg
      {...look}
      initial={{ scale: 0.6 }}
      animate={status === "failed" ? { scale: 1, x: [0, -3, 3, -2, 2, 0] } : { scale: 1 }}
      transition={status === "failed" ? { scale: FUN.pop, x: { duration: 0.4, ease: "easeOut" } } : FUN.pop} // litt-allow: fun mode, the shake
      onAnimationComplete={() => setSettled(true)}
    >
      {marks(true)}
    </motion.svg>
  );
}

const RESULT_TONE = { success: "text-success", danger: "text-danger" } as const;

/** The closing row: it rises in on the expressive tier. A run that went live scatters a few dots in its phases' hues. */
function Result({ label, total, tone, hues, celebrate }: { label: string; total: string; tone: "success" | "danger"; hues: FunHue[]; celebrate: boolean }) {
  const enter = useTransition("expressive");
  const travel = useTravel();
  const fun = useFun();
  return (
    <motion.li
      className="relative mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4"
      initial={{ opacity: 0, y: travel }}
      animate={{ opacity: 1, y: 0 }}
      transition={enter}
    >
      <span className={"relative min-w-0 text-body " + RESULT_TONE[tone]}>
        {label}
        <span className="sr-only">{tone === "success" ? ", success" : ", error"}</span>
        {celebrate && !fun.reduced && (
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-0">
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const reach = 22 + (i % 3) * 9;
              return (
                <motion.span
                  key={i}
                  className={"absolute size-1.5 rounded-pill " + DOT_HUE[hues[i % hues.length]!]}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: Math.cos(a) * reach, y: Math.sin(a) * reach * 0.7, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.7, ease: [0.2, 0, 0, 1], delay: 0.12 }} // litt-allow: fun mode, the celebration
                />
              );
            })}
          </span>
        )}
      </span>
      <span className="font-mono text-small tabular-nums whitespace-nowrap text-fg">{total}</span>
    </motion.li>
  );
}
