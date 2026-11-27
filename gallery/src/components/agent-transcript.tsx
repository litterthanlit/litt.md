/**
 * AgentTranscript, a Plain part (proposals/plain-studies.md; taste/litt-principles.md, Plain): a document-native agent
 * ledger and checkpoint control built from Plain's grammar — black words on white paper in Helvetica Neue, bare 1px
 * rules, link-blue inline actions, four gliding 4px corner brackets on the active filter, and Subtraction motion.
 *
 * - Bare on white paper: no 4-sided card box, no fills, no shadows.
 * - Filter row (`role="tablist"`): Plain's word strip where the chosen filter sits in `--fg` inside four gliding 4px
 *   corner marks (`200ms` zero-bounce spring), and unselected filters step back in `--fg-muted`. Arrow keys move across
 *   filters as one roving tab stop.
 * - Step ledger: numbered rows parted by 1px `--line` hairlines, each carrying step index, verb and target, tabular
 *   token cost, plain-word status (`Applied`, `Waiting`, `Skipped`) and inline link-blue controls (`Inspect`,
 *   `Approve`, `Skip`, `Rollback after step N`). Superseded rows and closed payloads pare away cleanly with zero bounce.
 * - Zero `--accent` fills (R6); link blue is used strictly as underlined text links, matching HTML.
 */
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useExit, useTransition } from "@/motion";

export type TranscriptStepState = "applied" | "waiting" | "skipped";

export type TranscriptStep = {
  /** Stable step identifier. */
  id: string;
  /** Short verb describing the agent action, e.g. "Read", "Edit", "Run". */
  verb: string;
  /** Target file path or command string. */
  target: string;
  /** Token usage for this step, e.g. 1420. */
  tokens: number;
  /** Current state of the step in the ledger. */
  state: TranscriptStepState;
  /** Raw plain-text payload revealed when the reader chooses Inspect. */
  detail: string;
};

export type AgentTranscriptProps = {
  /** Document heading for the agent run. Defaults to "Run 42 — Refactor session middleware". */
  title?: ReactNode;
  /** Ordered ledger steps for the run. */
  steps?: TranscriptStep[];
  /** Called whenever a step is approved, skipped or rolled back. */
  onStepsChange?: (steps: TranscriptStep[]) => void;
  /** Extra classes on the root wrapper. */
  className?: string;
};

export const DEFAULT_TRANSCRIPT_STEPS: TranscriptStep[] = [
  {
    id: "s1",
    verb: "Read",
    target: "src/auth/session.ts",
    tokens: 1420,
    state: "applied",
    detail: "Loaded 148 lines. Identified expired cookie fallback on line 92.",
  },
  {
    id: "s2",
    verb: "Edit",
    target: "src/auth/verify.ts",
    tokens: 2180,
    state: "applied",
    detail: "- if (!token) return guest();\n+ if (!token || expired(token)) return unauthorized();",
  },
  {
    id: "s3",
    verb: "Run",
    target: "npm test -- auth/verify.test.ts",
    tokens: 890,
    state: "waiting",
    detail: "Command queued for approval before executing test runner in workspace.",
  },
  {
    id: "s4",
    verb: "Edit",
    target: "CHANGELOG.md",
    tokens: 640,
    state: "skipped",
    detail: "Deferred until auth verification passes.",
  },
];

type FilterKey = "all" | TranscriptStepState;

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "waiting", label: "Waiting" },
  { id: "applied", label: "Applied" },
  { id: "skipped", label: "Skipped" },
];

const corner = "pointer-events-none absolute size-1 border-current";

const STATE_WORD: Record<TranscriptStepState, string> = {
  applied: "Applied",
  waiting: "Waiting",
  skipped: "Skipped",
};

const linkButton =
  "litt-target relative inline-flex cursor-pointer items-center text-caption font-normal text-accent-text underline underline-offset-2 " +
  "transition-colors duration-(--dur-instant) ease-litt hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function formatTok(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k tok` : `${n} tok`;
}

/** Plain's document-native agent ledger: 1px rules, four gliding corner brackets on the active filter, link-blue controls and Subtraction motion. */
export function AgentTranscript({
  title = "Run 42 — Refactor session middleware",
  steps: initialSteps = DEFAULT_TRANSCRIPT_STEPS,
  onStepsChange,
  className = "",
}: AgentTranscriptProps) {
  const headingId = useId();
  const enter = useTransition("responsive");
  const pare = useExit("responsive");
  const [steps, setSteps] = useState<TranscriptStep[]>(initialSteps);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [live, setLive] = useState("");

  const counts: Record<FilterKey, number> = {
    all: steps.length,
    waiting: steps.filter((s) => s.state === "waiting").length,
    applied: steps.filter((s) => s.state === "applied").length,
    skipped: steps.filter((s) => s.state === "skipped").length,
  };
  const totalTokens = steps.reduce((sum, s) => sum + s.tokens, 0);
  const visible = filter === "all" ? steps : steps.filter((s) => s.state === filter);

  const summaryLine =
    counts.waiting > 0
      ? `${counts.waiting} waiting · ${counts.applied} applied · ${formatTok(totalTokens)}`
      : `All done · ${counts.applied} applied, ${counts.skipped} skipped · ${formatTok(totalTokens)}`;

  function commit(next: TranscriptStep[], note: string) {
    setSteps(next);
    onStepsChange?.(next);
    setLive(note);
  }

  function setStepState(step: TranscriptStep, nextState: TranscriptStepState) {
    const next = steps.map((s) => (s.id === step.id ? { ...s, state: nextState } : s));
    commit(next, `${step.verb} ${step.target}: ${STATE_WORD[nextState]}.`);
  }

  function rollbackTo(index: number) {
    const target = steps[index];
    if (!target) return;
    const next: TranscriptStep[] = steps.map((s, i) => (i > index ? { ...s, state: "waiting" } : s));
    commit(next, `Rewound ledger after step ${index + 1} (${target.target}).`);
  }

  function toggleInspect(step: TranscriptStep) {
    setOpenIds((prev) => ({ ...prev, [step.id]: !prev[step.id] }));
  }

  function onFilterKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const at = FILTERS.findIndex((f) => f.id === filter);
    const n = FILTERS.length;
    const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
    const to = fwd ? (at + 1) % n : back ? (at - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const next = FILTERS[to]!;
    setFilter(next.id);
    e.currentTarget.querySelectorAll<HTMLElement>("[role=tab]")[to]?.focus();
  }

  return (
    <div data-body="plain" className={"grid w-full max-w-xl min-w-0 gap-3 text-fg " + className}>
      {/* Document heading and plain-word status */}
      <header className="grid gap-1 border-b border-line pb-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span id={headingId} className="text-body font-title text-fg">
            {title}
          </span>
          <span className="text-caption font-normal tabular-nums text-fg-subtle">
            {summaryLine}
          </span>
        </div>

        {/* Plain corner-bracket filter row */}
        <LayoutGroup id={headingId}>
          <div
            role="tablist"
            aria-label="Filter ledger steps"
            onKeyDown={onFilterKeyDown}
            className="-mx-2.5 flex flex-wrap items-center gap-1 pt-1"
          >
            {FILTERS.map((f) => {
              const active = f.id === filter;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setFilter(f.id)}
                  className={
                    "litt-target relative inline-flex h-control-sm cursor-pointer items-center px-2.5 text-caption font-normal select-none " +
                    "transition-colors duration-(--dur-instant) ease-litt " +
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
                    (active
                      ? "text-fg forced-colors:outline-2 forced-colors:outline-[Highlight]"
                      : "text-fg-muted hover:text-fg")
                  }
                >
                  <span className="litt-trim relative tabular-nums">
                    {active && (
                      <>
                        <motion.span layoutId="at-tl" transition={enter} aria-hidden="true" className={corner + " -top-1.5 -left-2 border-t border-l"} />
                        <motion.span layoutId="at-tr" transition={enter} aria-hidden="true" className={corner + " -top-1.5 -right-2 border-t border-r"} />
                        <motion.span layoutId="at-bl" transition={enter} aria-hidden="true" className={corner + " -bottom-1.5 -left-2 border-b border-l"} />
                        <motion.span layoutId="at-br" transition={enter} aria-hidden="true" className={corner + " -bottom-1.5 -right-2 border-b border-r"} />
                      </>
                    )}
                    {f.label} ({counts[f.id]})
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </header>

      {/* Numbered document ledger */}
      {visible.length === 0 ? (
        <p className="py-2 text-small text-fg-subtle">No steps match this filter.</p>
      ) : (
        <ol aria-labelledby={headingId} className="grid divide-y divide-line border-b border-line">
          <AnimatePresence initial={false}>
            {visible.map((step) => {
              const origIdx = steps.findIndex((s) => s.id === step.id);
              const open = Boolean(openIds[step.id]);
              const canRollback = step.state === "applied" && origIdx < steps.length - 1 && steps.slice(origIdx + 1).some((s) => s.state !== "waiting");
              return (
                <motion.li
                  key={step.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0, transition: enter }}
                  exit={{ opacity: 0, y: -4, transition: pare }}
                  className="grid gap-1.5 py-2.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-2">
                      <span className="text-caption font-normal tabular-nums text-fg-subtle">
                        {String(origIdx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-small font-title text-fg">{step.verb}</span>
                      <code className="break-all font-mono text-small text-fg">{step.target}</code>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-3 text-caption font-normal tabular-nums">
                      <span className="text-fg-subtle">{formatTok(step.tokens)}</span>
                      <span className={step.state === "waiting" ? "font-title text-fg" : "text-fg-subtle"}>
                        {STATE_WORD[step.state]}
                      </span>
                    </div>
                  </div>

                  {/* Inline link-blue document actions */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-6">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => toggleInspect(step)}
                      className={linkButton}
                    >
                      {open ? "Hide detail" : "Inspect"}
                    </button>

                    {step.state === "waiting" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setStepState(step, "applied")}
                          className={linkButton}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setStepState(step, "skipped")}
                          className={linkButton}
                        >
                          Skip
                        </button>
                      </>
                    )}

                    {step.state === "skipped" && (
                      <button
                        type="button"
                        onClick={() => setStepState(step, "waiting")}
                        className={linkButton}
                      >
                        Re-queue
                      </button>
                    )}

                    {canRollback && (
                      <button
                        type="button"
                        onClick={() => rollbackTo(origIdx)}
                        className={linkButton}
                      >
                        Rollback after step {origIdx + 1}
                      </button>
                    )}
                  </div>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.pre
                        key="detail"
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0, transition: enter }}
                        exit={{ opacity: 0, y: -2, transition: pare }}
                        className="ml-6 overflow-x-auto border-l border-line-strong pl-3 font-mono text-caption font-normal text-fg-muted whitespace-pre-wrap"
                      >
                        {step.detail}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
