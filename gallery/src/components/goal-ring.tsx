/**
 * GoalRing, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a centered, Dieter Rams radial goal
 * tracker sitting directly on Flat's ground — no outer box, no redundant labels, pure geometry.
 *
 * - One 136px SVG ring stepping through Flat's vivid cotton-candy hues (`--data-sky`, `--data-violet`,
 *   `--data-bubblegum`), with Flat's single 40px standing figure and `/ target` centered cleanly inside.
 * - Directly beneath: the quiet goal title and two balanced circular `−` / `+` keys (`bg-block` / `outline`) that
 *   spring the arc on Flat's 0.28 expressive bounce.
 * - Zero outer card wrapper (matches `Poll`, `Streak`, and `Kudos`), zero `--accent` fills (R6), and zero
 *   auto-animation on mount (R2/R4).
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type GoalRingProps = {
  /** Short title printed quietly beneath the ring, e.g. "2026 Reading goal". */
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
  /** Extra classes on the root wrapper. */
  className?: string;
};

const SIZE = 136;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A minimal centered Flat radial goal tracker: cotton-candy ring with the 40px figure inside and − / + circles below. */
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
    <div className={"inline-grid justify-items-center gap-4 text-fg " + className}>
      {/* Centered cotton-candy ring holding the single 40px standing figure */}
      <div
        role="progressbar"
        aria-labelledby={headingId}
        aria-valuemin={0}
        aria-valuemax={safeTarget}
        aria-valuenow={current}
        aria-valuetext={`${current} of ${safeTarget} ${unit} (${pct}%)`}
        className="relative grid size-[136px] place-items-center"
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
            stroke="color-mix(in oklab, var(--fg) 10%, transparent)"
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

        <div className="absolute grid justify-items-center gap-0.5">
          <motion.span
            key={current}
            data-part="figure"
            initial={reduced ? false : { scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={spring}
            className="text-figure leading-none tabular-nums text-fg"
          >
            {current}
          </motion.span>
          <span data-part="lettering" className="text-caption tabular-nums text-fg-subtle">
            / {safeTarget} {unit}
          </span>
        </div>
      </div>

      {/* Quiet label + balanced circular stepper keys */}
      <div className="grid justify-items-center gap-2.5">
        <span id={headingId} data-part="lettering" className="text-small text-fg-subtle">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-part="outline"
            aria-label={`Decrease ${unit} by 1`}
            disabled={current === 0}
            onClick={() => update(current - 1)}
            className="litt-target grid size-9 cursor-pointer place-items-center rounded-pill text-body font-title text-fg-muted shadow-[inset_0_0_0_1.5px_var(--line-control)] transition-colors duration-(--dur-instant) ease-litt hover:text-fg disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
          >
            <span aria-hidden="true">−</span>
          </button>
          <button
            type="button"
            data-part="circle"
            aria-label={`Add 1 to ${unit}`}
            disabled={current >= safeTarget}
            onClick={() => update(current + 1)}
            className="litt-target grid size-9 cursor-pointer place-items-center rounded-pill bg-block text-body font-title text-fg transition-colors duration-(--dur-instant) ease-litt hover:bg-(--block-hover) disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
