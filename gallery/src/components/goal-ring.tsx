/**
 * GoalRing, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a playful radial milestone tracker with a
 * sunset heatwave ring, Flat's 40px standing figure, and tactile pill controls on Flat's 0.28 expressive spring.
 *
 * - Sits on Flat's white paper (`data-part="paper"`) with zero border and zero cast shadow.
 * - The SVG ring warms through Flat's four-stop sunset heatwave gradient (`--data-seq-1` to `--data-seq-4`) and
 *   springs smoothly to the updated ratio on Flat's 0.28 expressive bounce (instant under reduced motion).
 * - Displays the current value at Flat's 40px figure size alongside target copy and pill controls (`+1`, `+5`, `Reset`)
 *   that never claim an `--accent` fill (R6).
 * - Zero auto-animation on mount (R2/R4); every increment announces the updated progress once in a polite live region.
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type GoalRingProps = {
  /** Short title for the goal, e.g. "2026 Reading goal" or "Issue subscribers". */
  title?: ReactNode;
  /** Target value to reach. Defaults to 24. */
  target?: number;
  /** Plural unit label, e.g. "books", "issues", "runs". Defaults to "books". */
  unit?: string;
  /** Controlled current value. */
  value?: number;
  /** Initial current value when uncontrolled. Defaults to 18. */
  defaultValue?: number;
  /** Called with the updated value when incremented or reset. */
  onChange?: (next: number) => void;
  /** Extra classes on the root paper card. */
  className?: string;
};

/* Literal CSS variable strings so gen-registry renames every sequential token for host installs. */
const SEQ = ["var(--data-seq-1)", "var(--data-seq-2)", "var(--data-seq-3)", "var(--data-seq-4)"] as const;
function rampAt(t: number) {
  const at = Math.max(0, Math.min(1, t)) * 3;
  const k = Math.min(2, Math.floor(at));
  const u = Math.round((at - k) * 100);
  return `color-mix(in oklab, ${SEQ[k + 1]} ${u}%, ${SEQ[k]})`;
}

const SIZE = 104;
const STROKE = 11;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A playful Flat radial goal card with a sunset heatwave ring, 40px standing figure, and pill increment controls. */
export function GoalRing({
  title = "2026 Reading goal",
  target = 24,
  unit = "books",
  value,
  defaultValue = 18,
  onChange,
  className = "",
}: GoalRingProps) {
  const headingId = useId();
  const gradId = useId();
  const safeTarget = Math.max(1, Math.round(target));
  const clamp = (n: number) => Math.max(0, Math.min(safeTarget, Math.round(n)));
  const [inner, setInner] = useState(() => clamp(defaultValue));
  const [live, setLive] = useState("");

  const current = value !== undefined ? clamp(value) : inner;
  const ratio = current / safeTarget;
  const pct = Math.round(ratio * 100);
  const offset = Math.round(CIRCUMFERENCE * (1 - ratio) * 100) / 100;
  const spring = useTransition("expressive");
  const { reduced } = useMotionDial();
  const warmth = rampAt(ratio);

  function update(nextVal: number) {
    const clamped = clamp(nextVal);
    if (value === undefined) setInner(clamped);
    onChange?.(clamped);
    const nextPct = Math.round((clamped / safeTarget) * 100);
    setLive(
      clamped >= safeTarget
        ? `${clamped} of ${safeTarget} ${unit}, goal complete.`
        : `${clamped} of ${safeTarget} ${unit}, ${nextPct}%.`,
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      data-part="paper"
      className={"grid w-full max-w-sm min-w-0 gap-4 rounded-surface bg-surface-1 p-5 text-fg forced-colors:border " + className}
    >
      <div className="flex items-center gap-5">
        {/* Heatwave SVG ring */}
        <div
          role="progressbar"
          aria-labelledby={headingId}
          aria-valuemin={0}
          aria-valuemax={safeTarget}
          aria-valuenow={current}
          aria-valuetext={`${current} of ${safeTarget} ${unit} (${pct}%)`}
          className="relative grid size-[104px] shrink-0 place-items-center"
        >
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden="true">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={SEQ[0]} />
                <stop offset="35%" stopColor={SEQ[1]} />
                <stop offset="70%" stopColor={SEQ[2]} />
                <stop offset="100%" stopColor={SEQ[3]} />
              </linearGradient>
            </defs>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--surface-3)"
              strokeWidth={STROKE}
            />
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={false}
              animate={{ strokeDashoffset: offset }}
              transition={spring}
            />
          </svg>
          <span data-part="lettering" className="absolute text-small font-title tabular-nums text-fg">
            {pct}%
          </span>
        </div>

        {/* Standing 40px figure + title */}
        <div className="grid min-w-0 gap-1">
          <h3 id={headingId} data-part="lettering" className="truncate text-small font-title text-fg-muted">
            {title}
          </h3>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={current}
              data-part="figure"
              initial={reduced ? false : { scale: 0.92 }}
              animate={{ scale: 1 }}
              transition={spring}
              className="inline-block origin-left text-figure leading-none tabular-nums text-fg"
            >
              {current}
            </motion.span>
            <span data-part="lettering" className="text-small tabular-nums text-fg-subtle">
              / {safeTarget} {unit}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5 text-caption text-fg-subtle">
            <span
              aria-hidden="true"
              data-part="circle"
              className="size-2 shrink-0 rounded-pill"
              style={{ backgroundColor: warmth }}
            />
            <span data-part="lettering">
              {current >= safeTarget ? "Goal reached" : `${safeTarget - current} more to go`}
            </span>
          </div>
        </div>
      </div>

      {/* Tactile pill controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-part="bubble"
          disabled={current >= safeTarget}
          onClick={() => update(current + 1)}
          className="litt-target inline-flex h-control-sm cursor-pointer items-center rounded-control bg-surface-3 px-3.5 text-caption font-title text-fg transition-colors duration-(--dur-instant) ease-litt hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
        >
          Log +1
        </button>
        <button
          type="button"
          data-part="outline"
          disabled={current >= safeTarget}
          onClick={() => update(current + 5)}
          className="litt-target inline-flex h-control-sm cursor-pointer items-center rounded-control px-3 text-caption font-title text-fg-muted shadow-[inset_0_0_0_1.5px_var(--line-control)] transition-colors duration-(--dur-instant) ease-litt hover:text-fg disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
        >
          +5
        </button>
        <button
          type="button"
          data-part="outline"
          disabled={current === 0}
          onClick={() => update(0)}
          className="litt-target ml-auto inline-flex h-control-sm cursor-pointer items-center rounded-control px-3 text-caption font-title text-fg-subtle shadow-[inset_0_0_0_1.5px_var(--line)] transition-colors duration-(--dur-instant) ease-litt hover:text-fg disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
        >
          Reset
        </button>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </section>
  );
}
