/**
 * GoalRing, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): progress toward one goal you can count, on one
 * white paper on the grey ground.
 *
 * - One 136px SVG ring in the ink over a grey track, with the count standing inside it at the large figure (44px,
 *   `text-figure-lg`, since the count is the whole object) and `/ target unit` under it.
 * - Beneath: the goal's name and two grey circles, − and +, that step the count; the arc and the figure follow on the
 *   expressive spring.
 * - Monochrome: the ink is the only colour (v1.22), no accent fill (R6), and nothing moves until a hand steps it (R4).
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type GoalRingProps = {
  /** The goal's name, printed quietly beneath the ring in sentence case, e.g. "Books read in 2026". */
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

/** Progress toward one goal you can count: an ink ring with the count inside and − and + circles below. */
export function GoalRing({
  title = "Books read in 2026",
  target = 24,
  unit = "books",
  value,
  defaultValue = 18,
  onChange,
  className = "",
}: GoalRingProps) {
  const headingId = useId();
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
    <div
      data-part="paper"
      className={"litt-paper inline-grid justify-items-center gap-4 rounded-surface bg-surface-1 p-6 text-fg forced-colors:border " + className}
    >
      {/* The ring in the ink, the count standing inside it */}
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
            stroke="var(--fg)"
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
            className="text-figure-lg leading-none tabular-nums text-fg"
          >
            {current}
          </motion.span>
          <span data-part="lettering" className="text-caption font-normal tabular-nums text-fg-subtle">
            / {safeTarget} {unit}
          </span>
        </div>
      </div>

      {/* The goal's name, and − and + as two grey circles */}
      <div className="grid justify-items-center gap-2.5">
        <span id={headingId} data-part="lettering" className="text-small text-fg-subtle">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-part="circle"
            aria-label={`Decrease ${unit} by 1`}
            disabled={current === 0}
            onClick={() => update(current - 1)}
            className="litt-target relative grid size-10 cursor-pointer place-items-center rounded-pill bg-block text-body font-title text-fg transition-[background-color,transform] duration-(--dur-instant) ease-litt hover:bg-(--block-hover) motion-safe:active:scale-95 disabled:cursor-not-allowed disabled:text-fg-disabled focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
          >
            <span aria-hidden="true">−</span>
          </button>
          <button
            type="button"
            data-part="circle"
            aria-label={`Add 1 to ${unit}`}
            disabled={current >= safeTarget}
            onClick={() => update(current + 1)}
            className="litt-target relative grid size-10 cursor-pointer place-items-center rounded-pill bg-block text-body font-title text-fg transition-[background-color,transform] duration-(--dur-instant) ease-litt hover:bg-(--block-hover) motion-safe:active:scale-95 disabled:cursor-not-allowed disabled:text-fg-disabled focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
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
