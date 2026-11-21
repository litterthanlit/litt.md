/**
 * DeployStatus, a Press part (plans/024, Press; taste/litt-principles.md, Press): a minimal tactile deployment
 * pipeline sitting directly on Press's warm stone ground — depth alone says what is live and what is waiting.
 *
 * - Recessed tray (`bg-tray shadow-(--tray-shade)`) holds the ordered deploy stages (`Build`, `Checks`, `Edge`,
 *   `Live`). Completed and active stages rise out of the tray as tactile raised blocks (`bg-block` lit along the top
 *   edge by `--highlight` and lifted by `--block-lift`, with zero outline); pending stages stay recessed in the tray.
 * - It is a readout, not a control: the stages are a list (`role="list"`, the current one `aria-current="step"`), and
 *   none of them is a button or a tab stop. Rebuild and Next stage (it reads Promote before the last stage) are the
 *   only keys, and the only tab stops. When a press disables the key it was on (Next stage at the last stage, Rebuild at
 *   the first), focus moves to the other key, so it never falls to the page.
 * - The header says the state in words: the current stage and "running" while the deploy moves ("Edge, running"), and
 *   the last stage's word alone once it is reached ("Live"). Each stage also says its state to a screen reader (done,
 *   running, pending), never by decorative status pills.
 * - Zero outer card wrapper, zero button outlines, zero `--accent` fills (R6), and zero auto-animation on mount (R2/R4).
 */
import { useId, useRef, useState, type ReactNode } from "react";

export type DeployStage = {
  /** Stable stage id. */
  id: string;
  /** Short stage label, e.g. "Build", "Checks", "Edge", "Live". */
  label: string;
  /** Elapsed duration for this stage, e.g. "28s". */
  duration: string;
};

export type DeployStatusProps = {
  /** Project name printed on the quiet top line. Defaults to "harbor-web". */
  project?: ReactNode;
  /** Branch and short commit hash. Defaults to "main · 4f9c2e1". */
  refLabel?: string;
  /** Target region code. Defaults to "fra1". */
  region?: string;
  /** Ordered pipeline stages. */
  stages?: DeployStage[];
  /** Controlled 0-based active stage index. */
  stageIndex?: number;
  /** Initial 0-based active stage index when uncontrolled. Defaults to 3 ("Live"). */
  defaultStageIndex?: number;
  /** Called with the updated stage index when Rebuild or Next stage (Promote) is pressed. */
  onStageChange?: (index: number) => void;
  /** Extra classes on the root wrapper. */
  className?: string;
};

export const DEFAULT_STAGES: DeployStage[] = [
  { id: "build", label: "Build", duration: "42s" },
  { id: "checks", label: "Checks", duration: "24s" },
  { id: "edge", label: "Edge", duration: "19s" },
  { id: "live", label: "Live", duration: "1m 25s" },
];

const keyCls =
  "litt-target relative inline-flex h-control-sm cursor-pointer items-center justify-center rounded-control bg-block px-3 text-caption font-title text-fg select-none " +
  "shadow-[var(--highlight),var(--block-lift)] transition-[background-color,box-shadow,transform] duration-(--dur-instant) ease-litt " +
  "hover:bg-(--block-hover) active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:shadow-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border";

/** Press's tactile deploy pipeline: raised blocks in a recessed stone tray show live progress without extra chrome. */
export function DeployStatus({
  project = "harbor-web",
  refLabel = "main · 4f9c2e1",
  region = "fra1",
  stages = DEFAULT_STAGES,
  stageIndex,
  defaultStageIndex = 3,
  onStageChange,
  className = "",
}: DeployStatusProps) {
  const headingId = useId();
  const safeCount = Math.max(1, stages.length);
  const clamp = (i: number) => Math.max(0, Math.min(safeCount - 1, i));
  const [inner, setInner] = useState(() => clamp(defaultStageIndex));
  const [live, setLive] = useState("");
  const rebuildKey = useRef<HTMLButtonElement>(null);
  const nextKey = useRef<HTMLButtonElement>(null);

  const index = stageIndex !== undefined ? clamp(stageIndex) : inner;
  const activeStage = stages[index];
  const isLive = index === safeCount - 1;
  /** The state in words: the stage and "running" while the deploy moves, the last stage's word once it is reached. */
  const stateOf = (i: number) => {
    const word = stages[i]?.label ?? `Stage ${i + 1}`;
    return i === safeCount - 1 ? word : `${word}, running`;
  };
  const state = stateOf(index);

  function go(nextIdx: number) {
    const clamped = clamp(nextIdx);
    if (stageIndex === undefined) setInner(clamped);
    onStageChange?.(clamped);
    const st = stages[clamped];
    setLive(`${String(project)}: ${stateOf(clamped)}${st?.duration ? `, ${st.duration}` : ""}.`);
  }

  return (
    <div data-body="press" className={"grid w-full max-w-md min-w-0 gap-3 text-fg " + className}>
      {/* Quiet header line: project + commit left, plain state word right */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <span id={headingId} data-part="lettering" data-slot="project" className="truncate text-small font-title text-fg">
            {project}
          </span>
          <span data-part="lettering" className="truncate font-mono text-caption text-fg-subtle">
            {refLabel}
          </span>
        </div>
        <span data-part="lettering" data-slot="state" className="shrink-0 text-caption font-title text-fg">
          {state}
        </span>
      </div>

      {/* Recessed stone tray holding raised blocks for reached stages: a read-only list, not a row of keys */}
      <div
        role="list"
        aria-labelledby={headingId}
        data-part="tray"
        className="grid gap-1 rounded-control bg-tray p-1 shadow-(--tray-shade) forced-colors:border"
        style={{ gridTemplateColumns: `repeat(${safeCount}, minmax(0, 1fr))` }}
      >
        {stages.map((st, i) => {
          const raised = i <= index;
          const current = i === index;
          return (
            <div
              key={st.id}
              role="listitem"
              data-part={raised ? "block" : "tray"}
              aria-current={current ? "step" : undefined}
              className={
                "flex h-control-sm min-w-0 items-center justify-center rounded-[calc(var(--radius-control)-2px)] px-2 text-caption select-none forced-colors:border " +
                "transition-[background-color,color,box-shadow] duration-(--dur-instant) ease-litt " +
                (raised
                  ? "bg-block font-title text-fg shadow-[var(--highlight),var(--block-lift)]"
                  : "bg-transparent font-normal text-fg-subtle")
              }
            >
              <span className="truncate">{st.label}</span>
              <span className="sr-only">{`, ${st.duration}, ${current ? (i === safeCount - 1 ? "done" : "running") : raised ? "done" : "pending"}`}</span>
            </div>
          );
        })}
      </div>

      {/* Quiet footer: duration + region left, tactile step keys right */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span data-part="lettering" className="font-mono text-caption tabular-nums text-fg-subtle">
          {activeStage?.duration ?? "—"} · {region}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-part="block"
            ref={rebuildKey}
            disabled={index === 0}
            onClick={() => {
              go(0);
              if (safeCount > 1) nextKey.current?.focus();
            }}
            className={keyCls}
          >
            Rebuild
          </button>
          <button
            type="button"
            data-part="block"
            ref={nextKey}
            disabled={isLive}
            onClick={() => {
              go(index + 1);
              if (index + 1 >= safeCount - 1) rebuildKey.current?.focus();
            }}
            className={keyCls}
          >
            {index === safeCount - 2 ? "Promote" : "Next stage"}
          </button>
        </div>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
