/**
 * GoalRing, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a minimal Dieter Rams radial goal tracker in
 * Flat's vivid cotton-candy palette (sky -> violet -> bubblegum) on Flat's 0.28 expressive spring.
 *
 * - As little design as possible: one borderless paper card (`data-part="paper"`) holding three honest parts in a
 *   single balanced row — the open cotton-candy SVG ring (no redundant percent crammed inside), the single 40px
 *   standing figure beside its target, and two silent Braun-style circular `−` / `+` keys (`data-part="circle"`).
 * - Zero `--accent` fills (R6) and zero auto-animation on mount (R2/R4).
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type GoalRingProps = {
  /** Short title for the goal, e.g. "2026 Reading goal" or "Spring subscribers". */
  title?: ReactNode;
  /** Target value to reach. Defaults to 24. */
  target?: number;
  /** Plural unit label, e.g. "books", "issues", "runs". Defaults to "books". */
  unit?: string;
  /** Controlled current value. */
  value?: number;
  /** Initial current value when uncontrolled. Defaults to 18. */
  defaultValue?: number;
  /** Called with the updated value when stepped down or up. */
  onChange?: (next: number) => void;
  /** Extra classes on the root paper card. */
  className?: string;
};

const SIZE = 84;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A minimal Flat radial goal card: cotton-candy SVG ring, 40px standing figure, and circular − / + keys. */
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
      className={"flex w-full max-w-sm min-w-0 items-center gap-4 rounded-surface bg-surface-1 p-5 text-fg forced-colors:border sm:gap-5 " + className}
    >
      {/* Open cotton-candy SVG ring */}
      <div
        role="progressbar"
        aria-labelledby={headingId}
        aria-valuemin={0}
        aria-valuemax={safeTarget}
        aria-valuenow={current}
        aria-valuetext={`${current} of ${safeTarget} ${unit} (${pct}%)`}
        className="relative grid size-[76px] shrink-0 place-items-center sm:size-[84px]"
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--data-sky)" />
              <stop offset="52%" stopColor="var(--data-violet)" />
              <stop offset="100%" stopColor="var(--data-bubblegum)" />
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
      </div>

      {/* Standing 40px figure + quiet title */}
      <div className="grid min-w-0 flex-1 gap-1">
        <h3 id={headingId} data-part="lettering" className="truncate text-caption text-fg-subtle">
          {title}
        </h3>
        <div className="flex flex-wrap items-baseline gap-x-1.5">
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
          <span data-part="lettering" className="truncate text-small tabular-nums text-fg-subtle">
            / {safeTarget} {unit}
          </span>
        </div>
      </div>

      {/* Quiet Braun-style circular stepper keys */}
      <div className="flex shrink-0 flex-col-reverse items-center gap-1.5 sm:flex-row">
        <button
          type="button"
          data-part="outline"
          aria-label={`Decrease ${unit} by 1`}
          disabled={current === 0}
          onClick={() => update(current - 1)}
          className="litt-target grid size-8 cursor-pointer place-items-center rounded-pill text-body font-title text-fg-muted shadow-[inset_0_0_0_1.5px_var(--line-control)] transition-colors duration-(--dur-instant) ease-litt hover:text-fg disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border sm:size-9"
        >
          <span aria-hidden="true">−</span>
        </button>
        <button
          type="button"
          data-part="circle"
          aria-label={`Add 1 to ${unit}`}
          disabled={current >= safeTarget}
          onClick={() => update(current + 1)}
          className="litt-target grid size-8 cursor-pointer place-items-center rounded-pill bg-surface-3 text-body font-title text-fg transition-colors duration-(--dur-instant) ease-litt hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border sm:size-9"
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </section>
  );
}
