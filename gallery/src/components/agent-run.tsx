/**
 * AgentRun, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): an editorial assistant turn start to finish
 * on a white paper card, pairing frameless colored dot steps, a collapsible thinking summary and streamed draft prose.
 *
 * - Framed in Flat's paper card (`litt-paper bg-surface-1 rounded-surface p-6`, no outline and nothing cast).
 * - Each step is a frameless dot tag (filled data hue dot when done, hollow outline dot while queued, matching Flat's
 *   Legend and status Tag) with `font-normal` labels and tabular timings.
 * - Starts settled on mount (zero auto-animation, R4). Tapping "Run again" walks through every step and streams the
 *   draft prose; under reduced motion it completes cleanly on the spot.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type RunHue = "sky" | "blue" | "violet" | "bubblegum" | "teal";

export type AgentRunStep = {
  id: string;
  label: string;
  detail: string;
  duration: string;
  hue: RunHue;
};

export type AgentRunProps = {
  /** Card title naming the draft or task. */
  title?: string;
  /** Steps executed during the turn. */
  steps?: AgentRunStep[];
  /** Draft prose revealed when the turn finishes. */
  answer?: string;
  /** Whether the step list starts expanded. Default true. */
  defaultExpanded?: boolean;
  /** Fires when a replay finishes. */
  onComplete?: () => void;
  className?: string;
};

const HUE_VAR: Record<RunHue, string> = {
  sky: "var(--data-sky)",
  blue: "var(--data-blue)",
  violet: "var(--data-violet)",
  bubblegum: "var(--data-bubblegum)",
  teal: "var(--data-teal)",
};

export const DEFAULT_RUN_STEPS: AgentRunStep[] = [
  { id: "voice", label: "Read voice guide", detail: "Short sentences", duration: "0.6s", hue: "teal" },
  { id: "notes", label: "Scan field notes", detail: "4 passages", duration: "1.1s", hue: "blue" },
  { id: "draft", label: "Draft opening", detail: "62 words", duration: "1.2s", hue: "violet" },
  { id: "check", label: "Check tone", detail: "Clear", duration: "0.5s", hue: "bubblegum" },
];

export const DEFAULT_RUN_ANSWER =
  "Low tide comes early in November. By seven the salt marsh is quiet, the harbor posts stand clear of the water, and the whole coast smells of cedar smoke and rain.";

/** Flat's editorial agent run card: frameless colored dot steps, collapsible thinking summary and live draft prose. */
export function AgentRun({
  title = "Opening draft",
  steps = DEFAULT_RUN_STEPS,
  answer = DEFAULT_RUN_ANSWER,
  defaultExpanded = true,
  onComplete,
  className = "",
}: AgentRunProps) {
  const { reduced } = useMotionDial();
  const spring = useTransition("expressive");
  const settle = useTransition("responsive");
  const headingId = useId();
  const stepsId = useId();

  const words = answer.split(/\s+/).filter(Boolean);
  const [phase, setPhase] = useState<"running" | "writing" | "done">("done");
  const [completedCount, setCompletedCount] = useState(steps.length);
  const [wordCount, setWordCount] = useState(words.length);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [live, setLive] = useState("");

  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const replay = useCallback(() => {
    clearTimers();
    setExpanded(true);

    if (reduced) {
      setCompletedCount(steps.length);
      setWordCount(words.length);
      setPhase("done");
      setLive(`${title} complete: ${steps.length} steps finished.`);
      onComplete?.();
      return;
    }

    setPhase("running");
    setCompletedCount(0);
    setWordCount(0);
    setLive(`Running ${title}: ${steps.length} steps.`);

    const stepMs = 480;
    steps.forEach((_, idx) => {
      const id = window.setTimeout(() => {
        setCompletedCount(idx + 1);
      }, (idx + 1) * stepMs);
      timersRef.current.push(id);
    });

    const streamStart = steps.length * stepMs + 140;
    const writeStartId = window.setTimeout(() => {
      setPhase("writing");
    }, streamStart);
    timersRef.current.push(writeStartId);

    const chunkSize = 3;
    const chunkMs = 70;
    const totalChunks = Math.ceil(words.length / chunkSize);
    for (let c = 1; c <= totalChunks; c++) {
      const id = window.setTimeout(() => {
        const shown = Math.min(words.length, c * chunkSize);
        setWordCount(shown);
        if (shown >= words.length) {
          setPhase("done");
          setLive(`${title} ready: ${steps.length} steps complete.`);
          onComplete?.();
        }
      }, streamStart + c * chunkMs);
      timersRef.current.push(id);
    }
  }, [clearTimers, onComplete, reduced, steps, title, words.length]);

  const activeIndex = phase === "running" ? completedCount : -1;
  const visibleProse = words.slice(0, wordCount).join(" ");
  const statusDot =
    phase === "done"
      ? "var(--success)"
      : phase === "writing"
        ? "var(--data-violet)"
        : HUE_VAR[steps[Math.min(completedCount, Math.max(0, steps.length - 1))]?.hue ?? "blue"];

  const statusText =
    phase === "done"
      ? `Ready · ${steps.length} steps`
      : phase === "writing"
        ? "Writing draft…"
        : `${steps[activeIndex]?.label ?? "Working"}…`;

  return (
    <div
      data-part="paper"
      className={"litt-paper grid w-full max-w-sm min-w-0 gap-4 rounded-surface bg-surface-1 p-6 text-fg forced-colors:border " + className}
    >
      {/* Header with title and frameless status dot */}
      <header className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <span id={headingId} data-part="lettering" className="truncate text-body font-title text-fg">
            {title}
          </span>
          <span data-part="lettering" className="inline-flex items-center gap-2 text-caption font-normal text-fg-subtle">
            <span
              aria-hidden="true"
              data-part="circle"
              className="size-2 shrink-0 rounded-pill forced-colors:[forced-color-adjust:none] forced-colors:bg-[CanvasText]"
              style={{ backgroundColor: statusDot }}
            />
            <span className="truncate">{statusText}</span>
          </span>
        </div>

        <button
          type="button"
          data-part="lettering"
          aria-expanded={expanded}
          aria-controls={stepsId}
          onClick={() => setExpanded((v) => !v)}
          className="litt-target relative inline-flex h-control-sm shrink-0 cursor-pointer items-center gap-1 rounded-pill bg-transparent px-2 text-caption font-normal text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <span>{expanded ? "Hide steps" : `${steps.length} steps`}</span>
          <svg
            width={12}
            height={12}
            viewBox="0 0 12 12"
            aria-hidden="true"
            className={"shrink-0 transition-transform duration-(--dur-instant) ease-litt " + (expanded ? "rotate-180" : "")}
          >
            <path
              d="M3 4.5 6 7.5 9 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      {/* Collapsible frameless dot step list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            id={stepsId}
            aria-labelledby={headingId}
            initial={reduced ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -4 }}
            transition={phase === "done" ? settle : spring}
            className="m-0 grid list-none gap-2 p-0"
          >
            {steps.map((step, i) => {
              const isDone = i < completedCount;
              const isActive = i === activeIndex;
              return (
                <li key={step.id} className="flex items-center justify-between gap-3 text-caption font-normal">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      data-part={isDone || isActive ? "circle" : "outline"}
                      className={
                        "size-2.5 shrink-0 rounded-pill border-2 transition-colors duration-(--dur-instant) ease-litt forced-colors:border-[CanvasText] " +
                        (isDone || isActive ? "border-transparent" : "border-fg-subtle bg-transparent")
                      }
                      style={isDone || isActive ? { backgroundColor: HUE_VAR[step.hue] } : undefined}
                    />
                    <span className={"truncate " + (isDone || isActive ? "text-fg" : "text-fg-subtle")}>
                      {step.label}
                    </span>
                    <span className="truncate text-fg-subtle">{step.detail}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-fg-subtle">
                    {isDone ? step.duration : isActive ? "Now" : "Queued"}
                  </span>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Draft output surface (soft block inside paper, flips cleanly on sheets) */}
      <div
        data-part="bubble"
        className="min-h-16 rounded-control bg-block p-4 text-small text-fg forced-colors:border"
      >
        {visibleProse ? (
          <p className="m-0 leading-relaxed">{visibleProse}</p>
        ) : (
          <p className="m-0 text-fg-subtle">Gathering notes for the opening…</p>
        )}
      </div>

      {/* Footer summary + Replay */}
      <div className="flex items-center justify-between gap-2">
        <span data-part="lettering" className="text-caption font-normal tabular-nums text-fg-subtle">
          {phase === "done" ? `${words.length} words · 3.4s` : `${completedCount} of ${steps.length} steps`}
        </span>
        <button
          type="button"
          data-part="lettering"
          onClick={replay}
          disabled={phase !== "done"}
          className="litt-target relative inline-flex h-control-sm cursor-pointer items-center rounded-pill bg-transparent px-2 text-caption font-normal text-fg transition-colors duration-(--dur-instant) ease-litt hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {phase === "done" ? "Run again" : "Running…"}
        </button>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
