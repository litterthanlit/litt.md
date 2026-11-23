/**
 * AgentStatus, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): live agent run status, elapsed time and
 * three latched phase pills on a borderless white paper card.
 *
 * - Sits on Flat's paper card (`litt-paper rounded-surface bg-surface-1 p-6`, `data-part="paper"`) with every painted
 *   child marked in Flat's material vocabulary.
 * - Top row pairs a frameless status dot (`data-part="circle"`) and plain state word (`data-part="lettering"`) with a
 *   clean tabular elapsed figure (`text-figure`, `data-part="figure"`).
 * - Middle row draws three horizontal phase pills (`Think`, `Tool`, `Write`): reached phases latch along Flat's
 *   sequential ramp (`--data-seq-1` to `--data-seq-3`, `data-part="mark"`), while pending phases rest quietly in
 *   `bg-slot` (`data-part="pill"`).
 * - One-shot arrival (`useInView` with `once: true`) sweeps reached phase pills open on `useTransition("expressive")`
 *   (skipped under reduced motion), then waits completely still. No timer runs on mount; elapsed time counts only after
 *   a live state transition, pauses during `waiting`, and freezes on `done`, `error`, or `stopped`.
 * - A polite status region announces state changes once and never on timer ticks.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { motion, useInView } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

/** All seven states an agent run can report. */
export type AgentStatusState = "thinking" | "tool" | "writing" | "waiting" | "done" | "error" | "stopped";

/** The three latched phases shown across the progress pills. */
export type AgentPhase = "thinking" | "tool" | "writing";

/** Action emitted by the optional single pill control. */
export type AgentStatusAction = "stop" | "approve" | "retry" | "run";

export type AgentStatusProps = {
  /** Current state of the run. Defaults to "done". */
  state?: AgentStatusState;
  /** Elapsed live seconds to display or seed the timer with. Defaults to 0. */
  elapsed?: number;
  /** Optional override for which phases are latched. Defaults to latching automatically from state progression. */
  reachedPhases?: AgentPhase[];
  /** Optional handler that shows one quiet pill control (`Stop`, `Approve`, `Retry`, or `Run`) and handles Escape to stop. */
  onAction?: (action: AgentStatusAction) => void;
  /** Optional custom label for the single pill control. */
  actionLabel?: string;
  /** Accessible label for the card region. Defaults to "Agent status". */
  label?: string;
  /** Extra classes on the paper card root. */
  className?: string;
};

/* Literal CSS variable strings so gen-registry renames every data token cleanly for host installs. */
const STATE_DOT: Record<Exclude<AgentStatusState, "stopped">, string> = {
  thinking: "var(--data-violet)",
  tool: "var(--data-blue)",
  writing: "var(--data-teal)",
  waiting: "var(--data-amber)",
  done: "var(--data-teal)",
  error: "var(--data-rose)",
};

const STATE_LABEL: Record<AgentStatusState, string> = {
  thinking: "Thinking",
  tool: "Running tool",
  writing: "Writing",
  waiting: "Waiting",
  done: "Done",
  error: "Error",
  stopped: "Stopped",
};

const STATE_ANNOUNCEMENT: Record<AgentStatusState, string> = {
  thinking: "Agent status: Thinking.",
  tool: "Agent status: Running tool.",
  writing: "Agent status: Writing.",
  waiting: "Agent status: Waiting for approval.",
  done: "Agent status: Done.",
  error: "Agent status: Error.",
  stopped: "Agent status: Stopped.",
};

const PHASES: { key: AgentPhase; label: string; color: string }[] = [
  { key: "thinking", label: "Think", color: "var(--data-seq-1)" },
  { key: "tool", label: "Tool", color: "var(--data-seq-2)" },
  { key: "writing", label: "Write", color: "var(--data-seq-3)" },
];

const isLive = (s: AgentStatusState): s is AgentPhase => s === "thinking" || s === "tool" || s === "writing";
const isEnd = (s: AgentStatusState) => s === "done" || s === "error" || s === "stopped";

function initialPhasesFor(state: AgentStatusState): AgentPhase[] {
  if (state === "thinking") return ["thinking"];
  if (state === "tool" || state === "waiting" || state === "error" || state === "stopped") return ["thinking", "tool"];
  return ["thinking", "tool", "writing"];
}

function nextPhasesFor(prevState: AgentStatusState, nextState: AgentStatusState, prevPhases: AgentPhase[]): AgentPhase[] {
  if (nextState === "done") return ["thinking", "tool", "writing"];
  if (nextState === "error" || nextState === "stopped") {
    return prevPhases.length ? prevPhases : initialPhasesFor(nextState);
  }
  if (nextState === "waiting") {
    const merged = new Set<AgentPhase>(prevPhases.length ? prevPhases : ["thinking"]);
    merged.add("tool");
    return PHASES.filter((p) => merged.has(p.key)).map((p) => p.key);
  }
  // Entering a live phase from an end state begins a fresh latch sequence up to that phase.
  if (isEnd(prevState)) return initialPhasesFor(nextState);
  const merged = new Set<AgentPhase>(prevPhases);
  merged.add(nextState);
  return PHASES.filter((p) => merged.has(p.key)).map((p) => p.key);
}

function actionFor(state: AgentStatusState): { action: AgentStatusAction; label: string } {
  if (isLive(state)) return { action: "stop", label: "Stop" };
  if (state === "waiting") return { action: "approve", label: "Approve" };
  if (state === "error") return { action: "retry", label: "Retry" };
  return { action: "run", label: "Run" };
}

function formatElapsed(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  if (safe >= 60) {
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }
  return `${safe.toFixed(1)}s`;
}

/** Flat's agent status card: frameless state dot, standing elapsed figure, three latched phase pills and one optional action. */
export function AgentStatus({
  state = "done",
  elapsed,
  reachedPhases,
  onAction,
  actionLabel,
  label = "Agent status",
  className = "",
}: AgentStatusProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true });
  const headingId = useId();
  const spring = useTransition("expressive");
  const { reduced } = useMotionDial();
  const arrived = reduced || inView;

  const [latched, setLatched] = useState<AgentPhase[]>(() => initialPhasesFor(state));
  const [displaySeconds, setDisplaySeconds] = useState<number>(() => elapsed ?? 0);
  const [announcement, setAnnouncement] = useState("");

  const prevStateRef = useRef<AgentStatusState>(state);
  const prevElapsedRef = useRef<number | undefined>(elapsed);
  const bankedRef = useRef<number>(elapsed ?? 0);
  const sinceRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stopTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Sync explicit elapsed updates without starting any timer on mount.
  useEffect(() => {
    if (elapsed === prevElapsedRef.current) return;
    prevElapsedRef.current = elapsed;
    if (elapsed === undefined) return;
    const safe = Math.max(0, elapsed);
    bankedRef.current = safe;
    if (sinceRef.current !== null) sinceRef.current = performance.now();
    setDisplaySeconds(safe);
  }, [elapsed]);

  // React only to post-mount state transitions: latch phases, manage live/paused/frozen timer, and announce once.
  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev === state) return;
    prevStateRef.current = state;

    setLatched((current) => nextPhasesFor(prev, state, current));
    setAnnouncement(STATE_ANNOUNCEMENT[state]);

    const now = performance.now();
    if (isLive(state)) {
      if (isEnd(prev) && elapsed === undefined) {
        bankedRef.current = 0;
        setDisplaySeconds(0);
      }
      if (sinceRef.current === null) sinceRef.current = now;
      stopTimer();
      const stepMs = reduced ? 1000 : 100;
      intervalRef.current = window.setInterval(() => {
        if (sinceRef.current === null) return;
        const next = bankedRef.current + (performance.now() - sinceRef.current) / 1000;
        setDisplaySeconds(reduced ? Math.floor(next) : next);
      }, stepMs);
    } else {
      // Waiting pauses the banked clock; done, error and stopped freeze it.
      if (sinceRef.current !== null) {
        bankedRef.current += (now - sinceRef.current) / 1000;
        sinceRef.current = null;
        setDisplaySeconds(bankedRef.current);
      }
      stopTimer();
    }
  }, [state, elapsed, reduced]);

  // Clean up any active timer on unmount.
  useEffect(() => () => stopTimer(), []);

  const activePhases = reachedPhases ?? latched;
  const currentPhase: AgentPhase | null = isLive(state) ? state : state === "waiting" ? "tool" : null;
  const control = actionFor(state);
  const canEscapeStop = (isLive(state) || state === "waiting") && Boolean(onAction);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && canEscapeStop) {
      e.preventDefault();
      onAction?.("stop");
    }
  };

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label={label}
      onKeyDown={onKeyDown}
      data-part="paper"
      className={"litt-paper grid w-full min-w-0 gap-4 rounded-surface bg-surface-1 p-6 forced-colors:border " + className}
    >
      {/* Top row: frameless status dot + plain state word on the left, standing tabular elapsed figure on the right */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            data-part="circle"
            className={
              "size-2.5 shrink-0 rounded-pill forced-colors:[forced-color-adjust:none] forced-colors:bg-[CanvasText] " +
              (state === "stopped" ? "bg-fg-disabled" : "")
            }
            style={state === "stopped" ? undefined : { backgroundColor: STATE_DOT[state] }}
          />
          <span id={headingId} data-part="lettering" className="truncate text-body font-title text-fg">
            {STATE_LABEL[state]}
          </span>
        </div>
        <span data-part="figure" className="shrink-0 text-figure tabular-nums text-fg">
          {formatElapsed(displaySeconds)}
        </span>
      </header>

      {/* Middle row: three horizontal phase pills latching across the sequential ramp */}
      <div role="group" aria-labelledby={headingId} className="grid grid-cols-3 gap-2">
        {PHASES.map((phase) => {
          const isReached = activePhases.includes(phase.key);
          const isCurrent = currentPhase === phase.key;
          const phaseWord = isCurrent ? "active" : isReached ? "reached" : "pending";
          return (
            <div key={phase.key} className="grid min-w-0 gap-1.5">
              <span
                aria-hidden="true"
                data-part="pill"
                className="relative block h-2.5 w-full overflow-hidden rounded-pill bg-slot forced-colors:border"
              >
                <motion.span
                  data-part="mark"
                  initial={reduced ? false : { scaleX: 0 }}
                  animate={{ scaleX: arrived && isReached ? 1 : 0 }}
                  transition={spring}
                  style={{ originX: 0, backgroundColor: phase.color }}
                  className="block h-full w-full rounded-pill forced-colors:bg-[Highlight]"
                />
              </span>
              <span
                data-part="lettering"
                className={"truncate text-caption font-normal " + (isCurrent ? "text-fg" : "text-fg-subtle")}
              >
                {phase.label}
                <span className="sr-only">{`, ${phaseWord}`}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Optional single quiet pill control */}
      {onAction && (
        <div className="flex items-center justify-end">
          <motion.button
            type="button"
            data-part="pill"
            onClick={() => onAction(control.action)}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            transition={spring}
            className="litt-target relative inline-flex h-control-sm cursor-pointer items-center justify-center rounded-pill bg-block px-4 text-small font-title text-fg select-none [-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt hover:bg-(--block-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
          >
            {actionLabel ?? control.label}
          </motion.button>
        </div>
      )}

      {/* Announces state changes once; never updates on elapsed timer ticks */}
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
