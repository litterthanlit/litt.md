/**
 * AgentRun, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): one assistant turn on a writer's draft, start
 * to finish, on one white paper.
 *
 * - Your request sits in a grey bubble. The assistant thinks with a live timer, runs its steps one by one (a turning
 *   ring that becomes an ink circle with a check, the step's result beside it), folds the work into "Thought for 4s",
 *   then writes its answer in, word by word, behind a caret.
 * - At rest it is the finished turn, folded: nothing moves on load (R4). Run again plays the turn; the fold opens and
 *   closes from its own button. Under reduced motion Run again finishes at once.
 * - The ink is the only colour, no accent fill (R6), and a step's state is its mark and its result, never a dot.
 * - Screen readers hear each phase once, not every word.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useMotionDial, useTransition } from "@/motion";

export type AgentRunStep = {
  id: string;
  /** What the step did, e.g. "Read Spring issue". */
  label: string;
  /** Its result, printed quietly at the end of its row once done, e.g. "412 words". */
  detail: string;
  /** How long it took, e.g. "1.2s". The steps' times add up to the "Thought for" line, and Run again takes as long. */
  duration: string;
};

export type AgentRunProps = {
  /** The turn's accessible name, e.g. the draft or task it works on. */
  title?: string;
  /** What you asked, shown in a grey bubble above the turn. Leave it out to show the turn alone. */
  request?: string;
  /** Steps the assistant runs, in order. */
  steps?: AgentRunStep[];
  /** The answer it writes once the steps are done. */
  answer?: string;
  /** Whether the steps start unfolded. Default false: the finished turn shows "Thought for", folded. */
  defaultExpanded?: boolean;
  /** Fires when a run started by Run again finishes. */
  onComplete?: () => void;
  className?: string;
};

export const DEFAULT_RUN_STEPS: AgentRunStep[] = [
  { id: "read", label: "Read Spring issue", detail: "412 words", duration: "0.8s" },
  { id: "search", label: "Search reader letters", detail: "4 found", duration: "0.9s" },
  { id: "edit", label: "Edit Spring issue", detail: "+18 −9", duration: "0.9s" },
];

export const DEFAULT_RUN_REQUEST = "Make the spring issue open stronger";

export const DEFAULT_RUN_ANSWER =
  "I tightened the intro and moved two reader letters up, so the issue opens with what people wrote in.";

/* The run's own pacing (what the assistant is doing, not an animation): how long it thinks before the first step, and
   how fast each word of the answer comes in. */
const THINK_MS = 1400;
const WORD_MS = 45;

type Phase = "thinking" | "working" | "answering" | "done";

function stepMs(step: AgentRunStep): number {
  const s = Number.parseFloat(step.duration);
  return Number.isFinite(s) ? Math.min(4000, Math.max(300, s * 1000)) : 900;
}

/** Flat's agent turn: a request bubble, steps that fold into "Thought for", and the answer written in behind a caret. */
export function AgentRun({
  title = "Spring issue",
  request = DEFAULT_RUN_REQUEST,
  steps = DEFAULT_RUN_STEPS,
  answer = DEFAULT_RUN_ANSWER,
  defaultExpanded = false,
  onComplete,
  className = "",
}: AgentRunProps) {
  const { reduced } = useMotionDial();
  const arrive = useTransition("expressive");
  const small = useTransition("responsive");
  const leave = useExit("responsive");
  const foldId = useId();

  const words = answer.split(/(?<=\s)/);
  const thought = Math.max(1, Math.round((THINK_MS + steps.reduce((sum, s) => sum + stepMs(s), 0)) / 1000));

  const [phase, setPhase] = useState<Phase>("done");
  const [revealed, setRevealed] = useState(steps.length);
  const [finished, setFinished] = useState(steps.length);
  const [streamed, setStreamed] = useState(words.length);
  const [open, setOpen] = useState(defaultExpanded);
  const [seconds, setSeconds] = useState(thought);
  const [live, setLive] = useState("");

  const timers = useRef<number[]>([]);
  const ticker = useRef<number | null>(null);
  const headRef = useRef<HTMLButtonElement>(null);

  const clear = useCallback(() => {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
    if (ticker.current !== null) window.clearInterval(ticker.current);
    ticker.current = null;
  }, []);
  useEffect(() => clear, [clear]);

  const busy = phase === "thinking" || phase === "working";

  const run = useCallback(() => {
    clear();
    headRef.current?.focus({ preventScroll: true });
    if (reduced) {
      setPhase("done");
      setRevealed(steps.length);
      setFinished(steps.length);
      setStreamed(words.length);
      setSeconds(thought);
      setLive(`Answer ready. ${answer}`);
      onComplete?.();
      return;
    }
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    const started = Date.now();
    setPhase("thinking");
    setRevealed(0);
    setFinished(0);
    setStreamed(0);
    setOpen(true);
    setSeconds(0);
    setLive("Thinking");
    ticker.current = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);

    let t = THINK_MS;
    steps.forEach((step, i) => {
      at(t, () => {
        setPhase("working");
        setRevealed(i + 1);
        setLive(step.label);
      });
      t += stepMs(step);
      at(t, () => setFinished(i + 1));
    });
    at(t + 250, () => {
      if (ticker.current !== null) window.clearInterval(ticker.current);
      ticker.current = null;
      setSeconds(Math.max(1, Math.round((Date.now() - started) / 1000)));
      setPhase("answering");
      setOpen(false);
    });
    t += 500;
    words.forEach((_, i) => at(t + i * WORD_MS, () => setStreamed(i + 1)));
    t += words.length * WORD_MS;
    at(t, () => {
      setPhase("done");
      setLive(`Answer ready. ${answer}`);
      onComplete?.();
    });
  }, [answer, clear, onComplete, reduced, steps, thought, words]);

  const current = steps[Math.max(0, revealed - 1)];
  const shownSteps = steps.slice(0, revealed);
  const text = words.slice(0, streamed).join("");

  return (
    <section
      aria-label={title}
      aria-busy={busy}
      data-part="paper"
      className={"litt-paper grid w-full max-w-md min-w-0 rounded-surface bg-surface-1 px-5 pt-4 pb-5 text-body text-fg forced-colors:border " + className}
    >
      {request && (
        <p
          data-part="bubble"
          className="m-0 mb-3 ml-auto w-fit max-w-[85%] rounded-surface bg-block px-4 py-2 text-body text-fg forced-colors:border"
        >
          {request}
        </p>
      )}

      {/* The turn's line: what it is doing and for how long, or once done, the fold and Run again */}
      <div className="-mx-2 flex min-h-9 items-center gap-2">
        <button
          ref={headRef}
          type="button"
          aria-expanded={open && revealed > 0}
          aria-controls={foldId}
          aria-disabled={busy || undefined}
          onClick={() => !busy && setOpen((v) => !v)}
          className={
            "litt-target relative flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-pill px-2 py-1.5 text-left transition-colors duration-(--dur-instant) ease-litt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
            (busy ? "cursor-default" : "cursor-pointer hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]")
          }
        >
          {busy ? (
            <>
              <span className="min-w-0 truncate font-title text-fg-subtle">{phase === "thinking" ? "Thinking" : current?.label}</span>
              <span className="ml-auto shrink-0 text-small tabular-nums text-fg-subtle">{seconds}s</span>
            </>
          ) : (
            <>
              <span className="min-w-0 truncate text-fg-subtle">Thought for {seconds}s</span>
              <svg
                width={14}
                height={14}
                viewBox="0 0 16 16"
                aria-hidden="true"
                className={"shrink-0 text-fg-subtle transition-transform duration-(--dur-instant) ease-litt " + (open ? "rotate-90" : "")}
              >
                <path d="m6 4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
        {phase === "done" && (
          <button
            type="button"
            data-part="pill"
            onClick={run}
            className="litt-target relative mr-2 inline-flex h-9 shrink-0 cursor-pointer items-center rounded-pill bg-block px-4 text-small font-title text-fg transition-[background-color,transform] duration-(--dur-instant) ease-litt hover:bg-(--block-hover) motion-safe:active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
          >
            Run again
          </button>
        )}
      </div>

      {/* The steps: each a turning ring that becomes an ink circle with a check, and its result once done */}
      <div id={foldId}>
        <AnimatePresence initial={false}>
          {open && shownSteps.length > 0 && (
            <motion.ol
              initial={reduced ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -4, transition: leave }}
              transition={small}
              className="m-0 grid list-none p-0"
            >
              {shownSteps.map((step, i) => {
                const done = i < finished;
                return (
                  <motion.li
                    key={step.id}
                    initial={reduced ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={small}
                    className="relative flex min-w-0 items-center gap-2.5 pt-2.5"
                  >
                    {i > 0 && <span aria-hidden="true" className="absolute top-0 left-[9px] h-2.5 w-0.5 rounded-pill bg-line" />}
                    <span aria-hidden="true" className="relative size-5 shrink-0">
                      {done ? (
                        <motion.span
                          initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={arrive}
                          className="absolute inset-0 grid place-items-center rounded-pill bg-fg text-canvas forced-colors:bg-[CanvasText] forced-colors:text-[Canvas]"
                        >
                          <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                            <path d="m6 10.4 2.7 2.6L14 7.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.span>
                      ) : (
                        <svg width={20} height={20} viewBox="0 0 20 20" fill="none" className="absolute inset-0 animate-spin motion-reduce:animate-none">{/* litt-allow: the loading spinner */}
                          <circle cx="10" cy="10" r="7.5" stroke="var(--surface-3)" strokeWidth="2.5" />
                          <path d="M17.5 10A7.5 7.5 0 0 0 10 2.5" stroke="var(--fg)" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 truncate font-title text-fg">{step.label}</span>
                    {done && (
                      <span className="ml-auto shrink-0 text-small tabular-nums text-fg-subtle">{step.detail}</span>
                    )}
                  </motion.li>
                );
              })}
            </motion.ol>
          )}
        </AnimatePresence>
      </div>

      {/* The answer, written in word by word behind a caret */}
      {text && (
        <p className="m-0 mt-3 text-body text-fg">
          {text}
          {phase === "answering" && (
            <span aria-hidden="true" className="ml-0.5 inline-block h-[1.05em] w-0.5 translate-y-0.5 rounded-pill bg-fg" />
          )}
        </p>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </section>
  );
}
