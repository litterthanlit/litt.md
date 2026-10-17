/**
 * Plan: an agent's steps for a task, ticked off as it works, such as "Move the Northwind site to the new grid".
 * It sits bare in a turn beside the turn's other parts, or in a raised panel the caller draws beside the chat.
 *
 * - Header (components.md, Plan): the label at the small size in fg and the count in the mono caption in fg-subtle
 *   with tabular numbers ("3 of 7"), over a 4px rail drawn exactly as the Meter's: a track at fg 12% and the done
 *   share in fg, both at the control radius. Progress is one quantity, not a category, so the rail takes no hue
 *   (P11), and its fill moves at once, as the Slider's range does. The Meter itself is not imported: it is a
 *   role="meter" and the list is already named by the label, so the rail is decoration here, and a plan should not
 *   pull in the whole chart file.
 * - What counts as done: the count is the steps whose status is done, over all the steps, and the rail is the same
 *   share. A failed step has not been done and a skipped step never will be, so neither counts. A plan with one
 *   skipped step ends at "6 of 7", and the step says "Skipped" in words, so the number is never read as a miss.
 * - Steps: an ordered list named by the label, rows at least 32px tall (the Timeline's row), each the 16px
 *   StatusIcon and the label at the small size. Pending is fg-subtle. Running, the current step, is fg with the
 *   half-filled circle, never spinning or pulsing, and carries aria-current="step". Done is fg-muted with the check,
 *   never struck through: the color steps it back. Failed takes the x in danger, its label stays fg, and "Failed"
 *   follows in words. Skipped is the dashed circle in fg-subtle with "Skipped". Status color stays on the icon.
 * - Detail: a step can carry one line under it at the caption size in fg-subtle, in the label's column.
 * - Words: every status is also said in hidden text after the label ("Run the build, running"), and the visible
 *   "Failed" and "Skipped" are hidden from assistive tech so the status is said once.
 * - Live region: a polite status says "Step 4 of 7: Run the build" when the running step changes, "Plan done" when
 *   every step is done or skipped (nothing is left to run), and "Step 4 of 7 failed: Run the build" when a step
 *   fails, so a stalled plan is never silent. It never speaks on the first render, so a plan loaded from history
 *   stays quiet.
 * - Motion: none on the steps. A status swaps at once and its colors fade on the instant tier. A step added when the
 *   plan changes fades in on the responsive tier with a quarter of the travel token, and never moves the steps
 *   above it. Steps present on the first render do not animate. Keys come from `id`, so give every step an id when
 *   the plan can change; without ids the position is the key. A removed step is gone at once.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { StatusIcon, type StepStatus } from "@/components/icons";
import { useTransition, useTravel } from "@/motion";

/** One step of a plan. */
export type PlanStep = {
  /** A stable id, so a step keeps its place and only a new one fades in when the plan changes. Without it the step's position is its key. */
  id?: string;
  /** What the step does, in sentence case: "Run the build". It wraps in a narrow column and it is what a screen reader hears when the step starts. */
  label: string;
  /** How the step stands: pending, running (the current step), done, failed or skipped. The icon, the label's color and a hidden word say it. */
  status: StepStatus;
  /** One line under the label at the caption size, such as why a step failed: "Build failed: font file missing". */
  detail?: ReactNode;
};

export type PlanProps = {
  /** What the plan is for, in a few words: "Move the Northwind site to the new grid". It is shown at the top and names the list for assistive tech. */
  label: string;
  /** The steps in order. Give each a stable id when steps can be added later, and update a step's status in place as the agent works. */
  steps: PlanStep[];
  /** Extra classes for the plan, such as a width. It fills its container. */
  className?: string;
};

/* ----------------------------------------------------------------- lookups */

/** The icon takes the text color, so the tone is set here: running fg, done fg-muted, failed danger, the rest fg-subtle. */
const ICON_TONE: Record<StepStatus, string> = {
  pending: "text-fg-subtle",
  running: "text-fg",
  done: "text-fg-muted",
  failed: "text-danger",
  skipped: "text-fg-subtle",
};

/** The label steps its color for state. A failed step's label stays fg: the x and the word say it. */
const LABEL_TONE: Record<StepStatus, string> = {
  pending: "text-fg-subtle",
  running: "text-fg",
  done: "text-fg-muted",
  failed: "text-fg",
  skipped: "text-fg-subtle",
};

/** What a screen reader hears after the label. */
const SAID: Record<StepStatus, string> = {
  pending: "pending",
  running: "running",
  done: "done",
  failed: "failed",
  skipped: "skipped",
};

/** The words that follow the label on screen. Pending, running and done say it with their color and mark alone, and hidden text. */
const SHOWN: Partial<Record<StepStatus, string>> = { failed: "Failed", skipped: "Skipped" };

/** The Meter's track and fill. */
const TRACK = "bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]";

const FADE = "transition-[color] duration-(--dur-instant) ease-litt";

/* ----------------------------------------------------------------- what to announce */

type Reading = { running: string | null; finished: boolean; failed: Set<string> };

/** The steps' keys: the id, or the position when a step has none. */
const keysOf = (steps: PlanStep[]) => steps.map((s, i) => s.id ?? `#${i}`);

function read(steps: PlanStep[], keys: string[]): Reading {
  const running = steps.findIndex((s) => s.status === "running");
  return {
    running: running < 0 ? null : keys[running],
    /* Nothing is left to run and nothing failed: every step is done or skipped, and at least one is done. */
    finished: steps.some((s) => s.status === "done") && steps.every((s) => s.status === "done" || s.status === "skipped"),
    failed: new Set(keys.filter((_, i) => steps[i].status === "failed")),
  };
}

/* ----------------------------------------------------------------- Plan */

/** An agent's steps as an ordered list under a count and a thin rail. A polite live region says when the running step changes, when a step fails and when the plan is done. */
export function Plan({ label, steps, className = "" }: PlanProps) {
  const id = useId();
  const enter = useTransition("responsive");
  const travel = useTravel();
  const keys = keysOf(steps);

  const total = steps.length;
  const done = steps.filter((s) => s.status === "done").length;
  const share = total > 0 ? (done / total) * 100 : 0;

  /* Which steps were on screen at the last commit, so only a step that arrives later fades in. The first render
     marks every step as seen, so a plan that loads full (or renders on the server) never animates. */
  const seen = useRef<Set<string> | null>(null);
  if (seen.current === null) seen.current = new Set(keys);
  const shown = seen.current;
  useEffect(() => {
    seen.current = new Set(keys);
  });

  /* What the live region says. It stays empty on the first render, and only a change fills it. */
  const [said, setSaid] = useState("");
  const last = useRef<Reading | null>(null);
  useEffect(() => {
    const now = read(steps, keys);
    const before = last.current;
    last.current = now;
    if (!before) return;
    const lines: string[] = [];
    const failedAt = keys.findIndex((k) => now.failed.has(k) && !before.failed.has(k));
    if (failedAt >= 0) lines.push(`Step ${failedAt + 1} of ${total} failed: ${steps[failedAt].label}`);
    if (now.finished && !before.finished) {
      lines.push("Plan done");
    } else if (now.running !== null && now.running !== before.running) {
      const at = keys.indexOf(now.running);
      lines.push(`Step ${at + 1} of ${total}: ${steps[at].label}`);
    }
    if (lines.length) setSaid(lines.join(". "));
  });

  return (
    <div className={className}>
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-4">
          <span id={id} className="text-small text-fg">
            {label}
          </span>
          <span className="font-mono text-caption tabular-nums text-fg-subtle">
            {done} of {total}
            <span className="sr-only"> steps done</span>
          </span>
        </div>
        <div aria-hidden="true" className={"h-1 overflow-hidden rounded-control " + TRACK}>
          <div className="h-full rounded-control bg-fg" style={{ width: `${share}%` }} />
        </div>
      </div>

      <ol role="list" aria-labelledby={id} className="m-0 mt-2 list-none p-0">
        {steps.map((step, i) => {
          const key = keys[i];
          const word = SHOWN[step.status];
          return (
            <motion.li
              key={key}
              aria-current={step.status === "running" ? "step" : undefined}
              initial={shown.has(key) ? false : { opacity: 0, y: -travel / 4 }}
              animate={{ opacity: 1, y: 0, transition: enter }}
              className="grid min-h-8 grid-cols-[1rem_minmax(0,1fr)] items-start gap-x-3 py-1.5"
            >
              <span className={`flex h-[1lh] items-center text-small ${FADE} ${ICON_TONE[step.status]}`}>
                <StatusIcon status={step.status} />
              </span>
              <div className="min-w-0">
                <p className={`text-small ${FADE} ${LABEL_TONE[step.status]}`}>
                  {step.label}
                  <span className="sr-only">, {SAID[step.status]}</span>
                  {word && (
                    <span aria-hidden="true" className="ml-2 text-caption whitespace-nowrap text-fg-subtle">
                      {word}
                    </span>
                  )}
                </p>
                {step.detail != null && step.detail !== false && <p className="mt-0.5 text-caption text-fg-subtle">{step.detail}</p>}
              </div>
            </motion.li>
          );
        })}
      </ol>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </div>
    </div>
  );
}
