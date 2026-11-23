/**
 * AgentThrottle, a Heat part (proposals/heat.md; taste/litt-principles.md, Heat): a street-racing HUD steering and
 * overdrive slab for tuning an agent's reasoning depth, worker parallelism and guardrail stance mid-run.
 *
 * - Framed as a square black slab (`rounded-none border border-line-strong bg-canvas`) banded top and bottom with
 *   diagonal hazard stripes and four 16px outer ink corner brackets (inset inside a 2px-padded wrapper).
 * - Three keyboard-navigable tuning rows (`Reasoning`, `Parallelism`, `Guardrail`) with amber corner brackets and a
 *   chevron on the active row, 12-dash stepped meters (`bg-accent-text`, turning `bg-danger` on Redline), and live
 *   tabular telemetry (`tok/s`, active workers, remaining budget).
 * - Real keyboard controls while focus is inside the slab: `↑`/`↓` select a row, `←`/`→` step its meter, `H` toggles
 *   emergency Halt / Resume, and `R` resets to Cruise. Foot row shows `<Kbd>` hints for every real key, and buttons
 *   carry `aria-keyshortcuts`. Zero `--accent` fills (R6), zero drop shadows, zero rounded corners, zero auto-motion.
 */
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/button";
import { Kbd } from "@/components/kbd";
import { Tag, type TagStatus } from "@/components/tag";

export type ThrottleStatus = "cruise" | "boost" | "redline" | "halted";

export type ThrottleState = {
  /** Reasoning effort depth from 1 to 12. */
  reasoning: number;
  /** Parallel worker lanes from 1 to 6. */
  workers: number;
  /** Guardrail aggressiveness from 1 (strict) to 12 (full send). */
  guardrail: number;
  /** Whether the emergency kill-switch is engaged. */
  halted: boolean;
};

export type AgentThrottleProps = {
  /** Header label naming the throttle slab. Defaults to "Agent overdrive". */
  label?: ReactNode;
  /** Initial throttle state when uncontrolled. */
  defaultState?: Partial<ThrottleState>;
  /** Called whenever any lane, slider or halt state changes. */
  onStateChange?: (next: ThrottleState) => void;
  /** Show interactive keys and answer keyboard shortcuts while focus is inside. Defaults to true. */
  interactive?: boolean;
  /** Extra classes on the outer container. */
  className?: string;
};

export const DEFAULT_THROTTLE_STATE: ThrottleState = {
  reasoning: 7,
  workers: 3,
  guardrail: 5,
  halted: false,
};

const DASHES = 12;

const MARKS =
  "pointer-events-none absolute bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom] ";

const FRAME =
  MARKS +
  "[background-size:16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px,16px_2px,2px_16px] -inset-2 text-fg";

const ROW_BRACKETS =
  MARKS +
  "[background-size:8px_1.5px,1.5px_8px,8px_1.5px,1.5px_8px,8px_1.5px,1.5px_8px,8px_1.5px,1.5px_8px] inset-0 text-accent-text";

const STRIPES = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

const STATUS_META: Record<ThrottleStatus, { word: string; tag: TagStatus }> = {
  cruise: { word: "Cruise", tag: "success" },
  boost: { word: "Boost", tag: "warning" },
  redline: { word: "Redline", tag: "danger" },
  halted: { word: "Halted", tag: "neutral" },
};

type RowKey = "reasoning" | "workers" | "guardrail";

const ROWS: { key: RowKey; label: string; min: number; max: number; describe: (v: number) => string }[] = [
  {
    key: "reasoning",
    label: "Reasoning",
    min: 1,
    max: 12,
    describe: (v) => (v <= 4 ? `Fast (${v}/12)` : v <= 9 ? `Deep (${v}/12)` : `Max (${v}/12)`),
  },
  {
    key: "workers",
    label: "Parallelism",
    min: 1,
    max: 6,
    describe: (v) => `×${v} ${v === 1 ? "worker" : "workers"}`,
  },
  {
    key: "guardrail",
    label: "Guardrail",
    min: 1,
    max: 12,
    describe: (v) => (v <= 4 ? `Strict (${v}/12)` : v <= 9 ? `Balanced (${v}/12)` : `Full send (${v}/12)`),
  },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));

const isTyping = (t: EventTarget) =>
  t instanceof HTMLElement && (t.isContentEditable || t.matches("input, textarea, select"));

function deriveStatus(s: ThrottleState): ThrottleStatus {
  if (s.halted) return "halted";
  if (s.guardrail >= 10 || (s.reasoning >= 10 && s.workers >= 5)) return "redline";
  if (s.reasoning >= 7 || s.workers >= 4 || s.guardrail >= 7) return "boost";
  return "cruise";
}

/** Heat's agent overdrive and steering HUD: striped bracketed slab with stepped 12-dash tuning rows and Halt kill-switch. */
export function AgentThrottle({
  label = "Agent overdrive",
  defaultState,
  onStateChange,
  interactive = true,
  className = "",
}: AgentThrottleProps) {
  const titleId = useId();
  const [state, setState] = useState<ThrottleState>(() => ({
    reasoning: clamp(defaultState?.reasoning ?? DEFAULT_THROTTLE_STATE.reasoning, 1, 12),
    workers: clamp(defaultState?.workers ?? DEFAULT_THROTTLE_STATE.workers, 1, 6),
    guardrail: clamp(defaultState?.guardrail ?? DEFAULT_THROTTLE_STATE.guardrail, 1, 12),
    halted: defaultState?.halted ?? DEFAULT_THROTTLE_STATE.halted,
  }));
  const [selectedRow, setSelectedRow] = useState(0);
  const [live, setLive] = useState("");

  const status = deriveStatus(state);
  const meta = STATUS_META[status];
  const tokPerSec = state.halted ? 0 : Math.round(28 * state.workers + state.reasoning * 9 + state.guardrail * 4);
  const budgetLeft = Math.max(8, 100 - state.reasoning * 3 - state.workers * 5 - state.guardrail * 2);

  function commit(next: ThrottleState, note: string) {
    setState(next);
    onStateChange?.(next);
    setLive(note);
  }

  function stepRow(rowIndex: number, delta: number) {
    const spec = ROWS[rowIndex]!;
    const current = state[spec.key];
    const nextVal = clamp(current + delta, spec.min, spec.max);
    if (nextVal === current) return;
    const next: ThrottleState = { ...state, [spec.key]: nextVal, halted: false };
    commit(next, `${spec.label}: ${spec.describe(nextVal)}. Status ${STATUS_META[deriveStatus(next)].word}.`);
  }

  function toggleHalt() {
    const next: ThrottleState = { ...state, halted: !state.halted };
    commit(next, next.halted ? "Agent halted. Token burn stopped." : `Agent resumed at ${STATUS_META[deriveStatus(next)].word}.`);
  }

  function resetCruise() {
    const next: ThrottleState = { reasoning: 4, workers: 2, guardrail: 4, halted: false };
    commit(next, "Throttle reset to Cruise.");
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.ctrlKey || e.altKey || e.metaKey || e.nativeEvent.isComposing || isTyping(e.target)) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedRow((r) => (r + 1) % ROWS.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedRow((r) => (r - 1 + ROWS.length) % ROWS.length);
      return;
    }
    if (e.key === "ArrowRight" || e.key === "+" || e.key === "=") {
      e.preventDefault();
      stepRow(selectedRow, 1);
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "-") {
      e.preventDefault();
      stepRow(selectedRow, -1);
      return;
    }
    if (e.key === "h" || e.key === "H") {
      e.preventDefault();
      toggleHalt();
      return;
    }
    if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      resetCruise();
    }
  }

  return (
    <div
      data-body="heat"
      onKeyDown={interactive ? onKeyDown : undefined}
      className={"grid w-full min-w-0 gap-3 p-2 text-fg " + className}
    >
      <div className="relative min-w-0">
        <span aria-hidden="true" className={FRAME} />
        <div className="grid min-w-0 rounded-none border border-line-strong bg-canvas forced-colors:border">
          {/* Striped header band */}
          <div className={"flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-1 px-3 py-2 " + STRIPES}>
            <span id={titleId} className="bg-canvas px-2 py-0.5 text-small font-title text-fg">
              {label}
            </span>
            <Tag status={meta.tag}>{meta.word}</Tag>
          </div>

          {/* Primary HUD telemetry row */}
          <div className="grid grid-cols-3 gap-2 border-b border-line bg-surface-1 px-4 py-2.5">
            <div className="grid gap-0.5">
              <span className="text-caption font-normal text-fg-subtle">Burn rate</span>
              <span className="font-mono text-h3 font-title tabular-nums text-accent-text">
                {tokPerSec} tok/s
              </span>
            </div>
            <div className="grid gap-0.5">
              <span className="text-caption font-normal text-fg-subtle">Lanes</span>
              <span className="font-mono text-h3 font-title tabular-nums text-fg">
                {state.halted ? "×0" : `×${state.workers}`}
              </span>
            </div>
            <div className="grid gap-0.5 text-right">
              <span className="text-caption font-normal text-fg-subtle">Budget</span>
              <span className="font-mono text-h3 font-title tabular-nums text-fg">
                {budgetLeft}%
              </span>
            </div>
          </div>

          {/* Three stepped tuning rows */}
          <div className="grid gap-2 px-3 py-3" role="group" aria-labelledby={titleId}>
            {ROWS.map((row, idx) => {
              const val = state[row.key];
              const active = idx === selectedRow;
              const litCount = Math.round((val / row.max) * DASHES);
              const redlineRow = !state.halted && ((row.key === "guardrail" && val >= 10) || status === "redline");
              return (
                <div
                  key={row.key}
                  onClick={() => setSelectedRow(idx)}
                  className={
                    "relative grid gap-1.5 rounded-none border px-2.5 py-2 forced-colors:border " +
                    (active ? "border-line-strong bg-surface-1" : "border-line bg-canvas")
                  }
                >
                  {active && <span aria-hidden="true" className={ROW_BRACKETS} />}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className={"font-mono text-caption " + (active ? "text-accent-text" : "text-fg-subtle")}
                      >
                        {active ? "▸" : "·"}
                      </span>
                      <span className={"text-caption font-title " + (active ? "text-accent-text" : "text-fg")}>
                        {row.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-caption font-normal tabular-nums text-fg-muted">
                        {row.describe(val)}
                      </span>
                      {interactive && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={val <= row.min}
                            aria-label={`Decrease ${row.label}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRow(idx);
                              stepRow(idx, -1);
                            }}
                            className="litt-target relative inline-flex size-6 cursor-pointer items-center justify-center rounded-none border border-line-strong bg-block font-mono text-caption text-fg disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            disabled={val >= row.max}
                            aria-label={`Increase ${row.label}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRow(idx);
                              stepRow(idx, 1);
                            }}
                            className="litt-target relative inline-flex size-6 cursor-pointer items-center justify-center rounded-none border border-line-strong bg-block font-mono text-caption text-fg disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 12-dash stepped meter */}
                  <div
                    role="meter"
                    aria-label={row.label}
                    aria-valuemin={row.min}
                    aria-valuemax={row.max}
                    aria-valuenow={val}
                    aria-valuetext={row.describe(val)}
                    className="flex h-3.5 items-center gap-1 rounded-none border border-line bg-tray px-1 forced-colors:border"
                  >
                    {Array.from({ length: DASHES }, (_, d) => {
                      const lit = !state.halted && d < litCount;
                      return (
                        <span
                          key={d}
                          aria-hidden="true"
                          className={
                            "h-1.5 flex-1 rounded-none transition-colors duration-(--dur-instant) ease-litt " +
                            (lit
                              ? redlineRow && d >= DASHES - 3
                                ? "bg-danger forced-colors:bg-[Highlight]"
                                : "bg-accent-text forced-colors:bg-[Highlight]"
                              : "bg-line-strong")
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action strip */}
          {interactive && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5">
              <span className="font-mono text-caption font-normal text-fg-subtle">
                {state.halted ? "Kill-switch engaged" : `Row ${selectedRow + 1} of ${ROWS.length}`}
              </span>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="secondary" aria-keyshortcuts="r" onClick={resetCruise}>
                  Cruise
                </Button>
                <Button size="sm" variant="secondary" aria-keyshortcuts="h" onClick={toggleHalt}>
                  {state.halted ? "Resume" : "Halt"}
                </Button>
              </div>
            </div>
          )}

          {/* Bottom hazard stripe band */}
          <div aria-hidden="true" className={"h-2.5 border-t border-line bg-surface-1 " + STRIPES} />
        </div>
      </div>

      {/* Real keyboard hints */}
      {interactive && (
        <div aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span>Row</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>←</Kbd>
            <Kbd>→</Kbd>
            <span>Tune</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>H</Kbd>
            <span>{state.halted ? "Resume" : "Halt"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>R</Kbd>
            <span>Cruise</span>
          </span>
        </div>
      )}

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
