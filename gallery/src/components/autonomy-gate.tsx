/**
 * AutonomyGate, a Press part (plans/024, Press; taste/litt-principles.md, Press): a tactile agent autonomy selector
 * and queued-action approval gate built from Press's warm stone recessed trays, raised blocks and cut-in budget slot.
 *
 * - Sits directly on Press's warm stone ground with no outer card wrapper.
 * - Top tray (`role="radiogroup"`): three physical stances (Observe, Confirm, Autonomous). The chosen stance rises as a
 *   tactile stone block (`--highlight, --block-lift`) out of the recessed tray (`--tray`, `--tray-shade`); the others
 *   stay flush. One roving tab stop with arrow keys, Home and End.
 * - Middle slot (`role="meter"`): tabular policy readout and a cut-in Press slot (`--slot`, `--slot-shade`,
 *   `--slot-fill`) measuring consumed session action budget.
 * - Bottom tray: the agent's next queued tool call in a shallow cut-in field (`--cut`, `--cut-shade`) with tactile
 *   raised stone keys (Allow once, Hold, or Step up to confirm in Observe mode) that sink `--press-depth` on press.
 * - Zero button outlines, zero decorative color pills, zero `--accent` fills (R6), and zero auto-animation on mount.
 */
import { useId, useRef, useState, type KeyboardEvent } from "react";

export type AutonomyMode = "observe" | "confirm" | "autonomous";

export type AutonomyLevel = {
  /** Stable stance identifier. */
  id: AutonomyMode;
  /** Short stance name, e.g. "Observe", "Confirm", "Autonomous". */
  label: string;
  /** Plain-language guardrail summary shown beside the budget readout. */
  policy: string;
};

export type GateAction = {
  /** Stable action identifier. */
  id: string;
  /** Short verb describing the operation, e.g. "Push", "Edit", "Run". */
  verb: string;
  /** Monospace command or target path waiting at the gate. */
  command: string;
  /** Risk classification stated in words. */
  scope: "read" | "write" | "network";
  /** Estimated dollar cost of executing this step. */
  cost: number;
};

export type AutonomyGateProps = {
  /** Accessible label for the autonomy stance group. Defaults to "Agent autonomy". */
  label?: string;
  /** Ordered autonomy stances. Defaults to Observe, Confirm and Autonomous. */
  levels?: AutonomyLevel[];
  /** Controlled active stance. */
  mode?: AutonomyMode;
  /** Initial stance when uncontrolled. Defaults to "confirm". */
  defaultMode?: AutonomyMode;
  /** Called when the user switches the autonomy stance. */
  onModeChange?: (mode: AutonomyMode) => void;
  /** Queued agent actions waiting at the approval gate. */
  actions?: GateAction[];
  /** Maximum actions permitted in the session budget slot. Defaults to 12. */
  actionBudget?: number;
  /** Actions already consumed before mount. Defaults to 4. */
  initialUsed?: number;
  /** Called when the user allows or holds a queued action. */
  onDecision?: (action: GateAction, decision: "allowed" | "held") => void;
  /** Extra classes on the root wrapper. */
  className?: string;
};

export const DEFAULT_AUTONOMY_LEVELS: AutonomyLevel[] = [
  { id: "observe", label: "Observe", policy: "Read only · writes paused" },
  { id: "confirm", label: "Confirm", policy: "Ask before edits and shell" },
  { id: "autonomous", label: "Autonomous", policy: "Run within session budget" },
];

export const DEFAULT_GATE_ACTIONS: GateAction[] = [
  { id: "a1", verb: "Run", command: "npm test -- auth/session.test.ts", scope: "write", cost: 0.04 },
  { id: "a2", verb: "Edit", command: "src/middleware/verify-token.ts", scope: "write", cost: 0.06 },
  { id: "a3", verb: "Push", command: "git push origin fix/token-refresh", scope: "network", cost: 0.02 },
];

const SCOPE_WORD: Record<GateAction["scope"], string> = {
  read: "Read",
  write: "Write",
  network: "Network",
};

const pressKey =
  "litt-target relative inline-flex h-control-sm cursor-pointer items-center justify-center rounded-control bg-block px-3 text-caption font-title text-fg select-none " +
  "shadow-[var(--highlight),var(--block-lift)] transition-[background-color,color,box-shadow,transform] duration-(--dur-instant) ease-litt " +
  "hover:bg-surface-2 active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border";

/** Press's tactile agent autonomy selector and approval gate: raised stone blocks, cut-in budget slot and queued action tray. */
export function AutonomyGate({
  label = "Agent autonomy",
  levels = DEFAULT_AUTONOMY_LEVELS,
  mode: modeProp,
  defaultMode = "confirm",
  onModeChange,
  actions = DEFAULT_GATE_ACTIONS,
  actionBudget = 12,
  initialUsed = 4,
  onDecision,
  className = "",
}: AutonomyGateProps) {
  const budgetId = useId();
  const [innerMode, setInnerMode] = useState<AutonomyMode>(defaultMode);
  const [cursor, setCursor] = useState(0);
  const [used, setUsed] = useState(() => Math.max(0, Math.min(actionBudget, initialUsed)));
  const [spent, setSpent] = useState(0.18);
  const [allowedCount, setAllowedCount] = useState(0);
  const [heldCount, setHeldCount] = useState(0);
  const [live, setLive] = useState("");
  const primaryKeyRef = useRef<HTMLButtonElement>(null);
  const resetKeyRef = useRef<HTMLButtonElement>(null);

  const mode = modeProp ?? innerMode;
  const currentLevel = levels.find((l) => l.id === mode) ?? levels[0]!;
  const safeBudget = Math.max(1, actionBudget);
  const usedClamped = Math.max(0, Math.min(safeBudget, used));
  const budgetPct = Math.round((usedClamped / safeBudget) * 100);
  const pending = actions[cursor] ?? null;
  const blockedByObserve = pending !== null && mode === "observe" && pending.scope !== "read";
  const autoReady = pending !== null && mode === "autonomous" && usedClamped < safeBudget;

  function setMode(next: AutonomyLevel) {
    if (modeProp === undefined) setInnerMode(next.id);
    onModeChange?.(next.id);
    setLive(`${next.label} mode: ${next.policy}.`);
  }

  function onRadioKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const at = levels.findIndex((l) => l.id === currentLevel.id);
    const n = levels.length;
    if (n === 0) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const fwd = e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const back = e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft");
    const to = fwd ? (at + 1) % n : back ? (at - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const target = levels[to]!;
    if (target.id !== currentLevel.id) setMode(target);
    e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")[to]?.focus();
  }

  function decide(decision: "allowed" | "held") {
    if (!pending) return;
    const nextCursor = cursor + 1;
    const cleared = nextCursor >= actions.length;
    if (decision === "allowed") {
      setUsed((u) => Math.min(safeBudget, u + 1));
      setSpent((s) => Math.round((s + pending.cost) * 100) / 100);
      setAllowedCount((c) => c + 1);
      setLive(`Allowed ${pending.verb.toLowerCase()} ${pending.command}. ${cleared ? "Queue clear." : `${actions.length - nextCursor} left in queue.`}`);
    } else {
      setHeldCount((c) => c + 1);
      setLive(`Held ${pending.verb.toLowerCase()} ${pending.command}. ${cleared ? "Queue clear." : `${actions.length - nextCursor} left in queue.`}`);
    }
    setCursor(nextCursor);
    onDecision?.(pending, decision);
    if (cleared) {
      queueMicrotask(() => resetKeyRef.current?.focus());
    }
  }

  function stepUpToConfirm() {
    const confirmLevel = levels.find((l) => l.id === "confirm");
    if (confirmLevel) setMode(confirmLevel);
    queueMicrotask(() => primaryKeyRef.current?.focus());
  }

  function resetQueue() {
    setCursor(0);
    setUsed(Math.max(0, Math.min(safeBudget, initialUsed)));
    setSpent(0.18);
    setAllowedCount(0);
    setHeldCount(0);
    setLive(`Queue reset: ${actions.length} actions waiting.`);
    queueMicrotask(() => primaryKeyRef.current?.focus());
  }

  return (
    <div data-body="press" className={"grid w-full max-w-md min-w-0 gap-3 text-fg " + className}>
      {/* Recessed tray holding the three autonomy stance blocks */}
      <div
        role="radiogroup"
        aria-label={label}
        onKeyDown={onRadioKeyDown}
        data-part="tray"
        className="grid gap-1 rounded-control bg-tray p-1 shadow-(--tray-shade) forced-colors:border"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, levels.length)}, minmax(0, 1fr))` }}
      >
        {levels.map((lvl) => {
          const selected = lvl.id === currentLevel.id;
          return (
            <button
              key={lvl.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              data-part={selected ? "block" : "tray"}
              onClick={() => setMode(lvl)}
              className={
                "litt-target relative flex h-control-sm min-w-0 cursor-pointer items-center justify-center rounded-[calc(var(--radius-control)-2px)] px-2.5 text-caption select-none " +
                "transition-[background-color,color,box-shadow,transform] duration-(--dur-instant) ease-litt " +
                "active:[transform:translateY(var(--press-depth))] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                (selected
                  ? "bg-block font-title text-fg shadow-[var(--highlight),var(--block-lift)] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                  : "bg-transparent font-normal text-fg-muted hover:text-fg")
              }
            >
              <span className="truncate">{lvl.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quiet policy and session budget readout + cut-in Press slot */}
      <div className="grid gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span id={budgetId} data-part="lettering" className="truncate text-small text-fg">
            {currentLevel.policy}
          </span>
          <span data-part="lettering" className="shrink-0 font-mono text-caption font-normal tabular-nums text-fg-subtle">
            {usedClamped} / {safeBudget} actions · ${spent.toFixed(2)}
          </span>
        </div>

        <div
          role="meter"
          aria-labelledby={budgetId}
          aria-valuemin={0}
          aria-valuemax={safeBudget}
          aria-valuenow={usedClamped}
          aria-valuetext={`${usedClamped} of ${safeBudget} session actions used (${budgetPct}%)`}
          data-part="slot"
          className="relative h-2.5 w-full overflow-hidden rounded-control bg-slot shadow-(--slot-shade) forced-colors:border"
        >
          <div
            data-part="fill"
            className="h-full w-full origin-left bg-slot-fill shadow-(--slot-fill-shade) transition-transform duration-(--dur-instant) ease-litt forced-colors:bg-[Highlight]"
            style={{ transform: `scaleX(${usedClamped / safeBudget})` }}
          />
        </div>
      </div>

      {/* Recessed approval tray holding the next queued agent action */}
      <div data-part="tray" className="grid min-w-0 gap-2 rounded-surface bg-tray p-1 shadow-(--tray-shade) forced-colors:border">
        {pending ? (
          <>
            <div data-part="cut" className="grid min-w-0 gap-1 rounded-control bg-cut px-3 py-2.5 shadow-(--cut-shade) forced-colors:border">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span data-part="lettering" className="text-caption font-title text-fg">
                  {blockedByObserve
                    ? "Paused in observe mode"
                    : autoReady
                      ? "Within guardrail · Ready"
                      : `${pending.verb} · ${SCOPE_WORD[pending.scope]}`}
                </span>
                <span data-part="lettering" className="font-mono text-caption font-normal tabular-nums text-fg-subtle">
                  {cursor + 1} of {actions.length} · ${pending.cost.toFixed(2)}
                </span>
              </div>
              <code className="truncate font-mono text-small text-fg">{pending.command}</code>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
              <span data-part="lettering" className="text-caption font-normal text-fg-subtle">
                {blockedByObserve ? "Writes need Confirm mode" : autoReady ? "Auto-runs within budget" : "Waiting on your call"}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {blockedByObserve ? (
                  <button ref={primaryKeyRef} type="button" data-part="block" onClick={stepUpToConfirm} className={pressKey}>
                    Step up to confirm
                  </button>
                ) : (
                  <button ref={primaryKeyRef} type="button" data-part="block" onClick={() => decide("allowed")} className={pressKey}>
                    {autoReady ? "Run now" : "Allow once"}
                  </button>
                )}
                <button
                  type="button"
                  data-part="tray"
                  onClick={() => decide("held")}
                  className="litt-target relative inline-flex h-control-sm cursor-pointer items-center justify-center rounded-control px-2.5 text-caption font-normal text-fg-muted transition-colors duration-(--dur-instant) ease-litt hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus forced-colors:border"
                >
                  Hold
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-2">
            <div className="grid gap-0.5">
              <span data-part="lettering" className="text-small font-title text-fg">
                Queue clear
              </span>
              <span data-part="lettering" className="text-caption font-normal tabular-nums text-fg-subtle">
                {allowedCount} allowed · {heldCount} held
              </span>
            </div>
            <button ref={resetKeyRef} type="button" data-part="block" onClick={resetQueue} className={pressKey}>
              Reset queue
            </button>
          </div>
        )}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
