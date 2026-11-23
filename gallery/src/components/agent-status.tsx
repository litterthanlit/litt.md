/**
 * AgentStatus, a Flat part (skills/litt-md/taste/litt-principles.md, Flat; proposals/flat-studies, Agent status): an
 * agent's run as one white paper. The task and its state in words, the time the run has been live as the one large
 * figure, what it is doing now, three pills for the phases it passes through, and only the actions that apply.
 *
 * - Paper on the grey ground (`litt-paper bg-surface-1 rounded-surface`, no outline and nothing cast). The head is the
 *   task in the ink at the label weight with the state after it in words ("Thinking", "Needs your OK", "Didn't
 *   finish" in danger's words); no dot, no badge.
 * - The time (`text-figure-lg`, tabular): minutes, seconds and tenths while the run is live; it holds while a call
 *   waits on your OK and when the run ends, and starts again from 0 when a new run starts. Under reduced motion it
 *   shows whole seconds. The token count sits beside it in the muted ink.
 * - The line: what it is doing now, the verb in the ink and its target in the muted ink ("Reading 12 drafts"). A new
 *   line rises in on the expressive spring (Flat's 0.28) while the old one leaves up with no bounce (Flat's motion,
 *   rule 5).
 * - The phases: Think, Use tools and Write as pills. Outlined (`--line-control`) until reached, the grey bubble once
 *   passed, the ink while it is there (and while a tool call waits on you); after an error the phase it stopped in
 *   is the bubble with danger's words. Each change is a jump on the instant tier, color only.
 * - The actions, only the ones that apply: Stop while it runs or waits; Run, Try again or Run again in the ink when it
 *   does not; and Allow in the ink beside Stop while a call waits on you, growing in from 85% on the expressive
 *   spring. Escape stops a run that can be stopped, and gives Escape back to the page otherwise. A button that goes
 *   away while it has focus hands focus to the one that stays.
 * - Controlled: the app passes the state, the step and the token count, and does what onRun, onStop and onAllow ask.
 *   It never moves on its own (R4): the clock runs only while the state you pass is live.
 * - Semantics: a group named by the task. The state and the line are said once each time they change in a polite
 *   status ("Thinking: Reading 12 drafts"); an error is said in an alert. The ticking time is aria-hidden. Allow is
 *   described by the line, so a screen reader hears what it allows.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useMotionDial, useTransition } from "@/motion";

export type AgentRunState = "ready" | "thinking" | "tool" | "writing" | "waiting" | "done" | "error" | "stopped";

export type AgentStep = {
  /** What it is doing, in the ink: "Reading". */
  verb: string;
  /** What it is doing it to, in the muted ink: "12 drafts". */
  target?: string;
};

export type AgentStatusProps = {
  /** The task, as the person asked for it: "Tidy the drafts". It names the card. */
  task: string;
  /** Where the run is. thinking, tool and writing are live (the clock runs); waiting holds for your OK. */
  state: AgentRunState;
  /** What it is doing now. Leave it out before a run, and the line reads "Not started yet". */
  step?: AgentStep | null;
  /** Tokens used so far in this run, shown beside the time. */
  tokens?: number;
  /** Seconds already on the clock when the card mounts, for a run loaded from history. */
  elapsed?: number;
  /** Called by Run, Try again and Run again. */
  onRun?: () => void;
  /** Called by Stop and by Escape while the run can be stopped. */
  onStop?: () => void;
  /** Called by Allow while a call waits on your OK. */
  onAllow?: () => void;
  className?: string;
};

const PHASES = [
  { key: "thinking", name: "Think" },
  { key: "tool", name: "Use tools" },
  { key: "writing", name: "Write" },
] as const;
type PhaseKey = (typeof PHASES)[number]["key"];

const WORDS: Record<AgentRunState, string> = {
  ready: "Ready",
  thinking: "Thinking",
  tool: "Using a tool",
  writing: "Writing",
  waiting: "Needs your OK",
  done: "Done",
  error: "Didn't finish",
  stopped: "Stopped",
};

const isLive = (s: AgentRunState) => s === "thinking" || s === "tool" || s === "writing";
const isEnd = (s: AgentRunState) => s === "ready" || s === "done" || s === "error" || s === "stopped";
const lineOf = (step?: AgentStep | null) => (step ? [step.verb, step.target].filter(Boolean).join(" ") : "");
const thousands = (n: number) => n.toLocaleString("en-US");

function timeText(seconds: number, whole: boolean) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  return whole ? `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}` : `${m}:${(s % 60).toFixed(1).padStart(4, "0")}`;
}

function sayFor(state: AgentRunState, line: string) {
  const w = (word: string) => (line ? `${word}: ${line}` : word);
  if (state === "tool") return line || "Using a tool";
  if (state === "waiting") return w("Waiting for your OK");
  if (state === "ready") return "Ready";
  if (state === "stopped") return "Stopped";
  return w(WORDS[state]);
}

type Light = "off" | "passed" | "here" | "fault";

const PILL: Record<Light, string> = {
  off: "border-line-control text-fg-muted",
  passed: "border-transparent bg-block text-fg",
  here: "border-transparent bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
  fault: "border-transparent bg-block text-danger",
};

/** An agent's run on one white paper: the task, the time it has been live, what it is doing, its phases and the actions that apply. A Flat part. */
export function AgentStatus({ task, state, step, tokens = 0, elapsed = 0, onRun, onStop, onAllow, className = "" }: AgentStatusProps) {
  const { reduced } = useMotionDial();
  const arrive = useTransition("expressive");
  const leave = useExit("responsive");
  const lineId = useId();
  const timeRef = useRef<HTMLParagraphElement>(null);
  const goRef = useRef<HTMLButtonElement>(null);
  const stopRef = useRef<HTMLButtonElement>(null);
  const focused = useRef<"go" | "stop" | null>(null);
  const mounted = useRef(false);
  const line = lineOf(step);
  const live = isLive(state);
  const waiting = state === "waiting";
  const canStop = live || waiting;

  /* Which phases it has reached in this run, and the one it is in: a run that starts from an end starts afresh. */
  const [track, setTrack] = useState<{ at: PhaseKey | null; seen: PhaseKey[]; state: AgentRunState }>(() => ({
    at: live ? (state as PhaseKey) : waiting ? "tool" : null,
    seen: live ? [state as PhaseKey] : waiting ? ["thinking", "tool"] : [],
    state,
  }));
  if (track.state !== state) {
    const fresh = state === "ready" || (live && isEnd(track.state));
    const at: PhaseKey | null = live ? (state as PhaseKey) : waiting ? "tool" : state === "ready" ? null : track.at;
    const seen = fresh ? [] : track.seen;
    setTrack({ at, seen: at && !seen.includes(at) ? [...seen, at] : seen, state });
  }

  /* The clock: banked seconds plus the live stretch, drawn into the figure by a frame loop that runs only while live. */
  const clock = useRef({ banked: elapsed, since: 0, was: state });
  useLayoutEffect(() => {
    const c = clock.current;
    const now = performance.now();
    if (state === "ready") {
      c.banked = 0;
      c.since = 0;
    } else if (live && !c.since) {
      if (isEnd(c.was)) c.banked = 0;
      c.since = now;
    } else if (!live && c.since) {
      c.banked += (now - c.since) / 1000;
      c.since = 0;
    }
    c.was = state;
    const paint = () => {
      const t = c.banked + (c.since ? (performance.now() - c.since) / 1000 : 0);
      const text = timeText(t, reduced && !!c.since);
      if (timeRef.current && timeRef.current.textContent !== text) timeRef.current.textContent = text;
    };
    paint();
    if (!live) return;
    let id = requestAnimationFrame(function tick() {
      paint();
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [state, live, reduced]);

  /* What a screen reader hears: once per change of state or line, never on mount. */
  const [said, setSaid] = useState({ status: "", alert: "" });
  const lastSaid = useRef(`${state}|${line}`);
  useEffect(() => {
    const key = `${state}|${line}`;
    if (key === lastSaid.current) return;
    lastSaid.current = key;
    const words = sayFor(state, line);
    setSaid(state === "error" ? { status: "", alert: words } : { status: words, alert: "" });
  }, [state, line]);

  /* A button that went away with focus on it hands focus to the one that stays. */
  useLayoutEffect(() => {
    const which = focused.current;
    if (!which) return;
    const gone = which === "go" ? live : !canStop;
    if (!gone) return;
    const active = document.activeElement;
    if (active && active !== document.body && active !== goRef.current && active !== stopRef.current) return;
    const other = which === "go" ? stopRef.current : goRef.current;
    if (other && !other.hidden) other.focus({ preventScroll: true });
  }, [live, canStop]);

  useEffect(() => {
    mounted.current = true;
  }, []);

  const lightOf = (phase: PhaseKey): Light => {
    if (phase === track.at && state !== "done") return live || waiting ? "here" : state === "error" ? "fault" : "passed";
    return track.seen.includes(phase) && state !== "ready" ? "passed" : "off";
  };

  const goLabel = waiting ? "Allow" : state === "error" ? "Try again" : state === "ready" ? "Run" : "Run again";
  const grow = waiting && mounted.current && !reduced;
  const stateWord = WORDS[state];
  const stateTone = state === "error" ? "font-label text-danger" : state === "ready" || state === "stopped" ? "text-fg-muted" : "font-label text-fg";

  return (
    <div
      role="group"
      aria-label={task}
      data-part="paper"
      data-state={state}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || !canStop) return;
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) onStop?.();
      }}
      className={"litt-paper grid w-full max-w-md min-w-0 gap-3 rounded-surface bg-surface-1 p-4 text-fg select-none sm:gap-4 sm:p-6 forced-colors:border " + className}
    >
      <div aria-hidden="true" className="flex min-w-0 items-baseline gap-3">
        <span className="min-w-0 flex-1 truncate text-body font-label">{task}</span>
        <span className={"shrink-0 text-small " + stateTone}>{stateWord}</span>
      </div>

      <div aria-hidden="true" className="grid gap-1.5">
        <div className="flex items-baseline gap-3">
          <p
            ref={timeRef}
            className={"m-0 text-figure-lg tabular-nums transition-colors duration-(--dur-instant) ease-litt " + (waiting || state === "stopped" ? "text-fg-muted" : "text-fg")}
          />
          {state !== "ready" && tokens > 0 && <span className="ms-auto text-small whitespace-nowrap tabular-nums text-fg-muted">{`${thousands(tokens)} tokens`}</span>}
        </div>
        <p id={lineId} className="relative m-0 grid min-w-0 overflow-hidden text-body">
          <AnimatePresence initial={false}>
            <motion.span
              key={line || "none"}
              initial={reduced ? false : { y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: arrive }}
              exit={{ y: -14, opacity: 0, transition: leave }}
              className="col-start-1 row-start-1 truncate"
            >
              {step ? (
                <>
                  {step.verb}
                  {step.target && <span className="text-fg-muted"> {step.target}</span>}
                </>
              ) : (
                <span className="text-fg-muted">Not started yet</span>
              )}
            </motion.span>
          </AnimatePresence>
        </p>
      </div>

      <div aria-hidden="true" className="flex gap-1.5">
        {PHASES.map((p) => (
          <span
            key={p.key}
            className={
              "grid h-8 min-w-0 flex-1 basis-0 place-items-center truncate rounded-pill border-[1.5px] px-2 text-caption font-label transition-colors duration-(--dur-instant) ease-litt sm:text-small " +
              PILL[lightOf(p.key)]
            }
          >
            {p.name}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <motion.button
          key={goLabel}
          ref={goRef}
          type="button"
          hidden={live}
          aria-describedby={waiting ? lineId : undefined}
          onFocus={() => (focused.current = "go")}
          onBlur={(e) => {
            if (e.relatedTarget) focused.current = null;
          }}
          onClick={() => (waiting ? onAllow?.() : onRun?.())}
          initial={grow ? { scale: 0.85, opacity: 0.85 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={arrive}
          className="litt-target relative inline-flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-pill bg-fg px-5 text-body font-label text-canvas [-webkit-tap-highlight-color:transparent] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
        >
          {goLabel}
        </motion.button>
        <button
          ref={stopRef}
          type="button"
          hidden={!canStop}
          aria-keyshortcuts="Escape"
          onFocus={() => (focused.current = "stop")}
          onBlur={(e) => {
            if (e.relatedTarget) focused.current = null;
          }}
          onClick={() => onStop?.()}
          className="litt-target relative inline-flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-pill bg-block px-5 text-body font-label text-fg [-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt hover:bg-(--block-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
        >
          Stop
        </button>
      </div>

      <span role="status" className="sr-only">
        {said.status}
      </span>
      <span role="alert" className="sr-only">
        {said.alert}
      </span>
    </div>
  );
}
