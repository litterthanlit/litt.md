/**
 * Streak, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): how long a run has lasted (issues sent, days
 * read) on one white paper: the count as the one standing figure, and a pill for each week or day.
 *
 * - One figure (text-figure) carries the count, its unit beside it in the muted ink, and the status as a word on the
 *   right ("Active"), never a dot.
 * - Each slot is a pill: done is the ink, missed is the grey bubble. Monochrome: the ink says done, and nothing walks a
 *   colour ramp.
 * - The open current slot (when the reader can log it) is a native button in Flat's 1.5px outline, since an outline
 *   means off. One motion idea, a pill pops: logging it fills the pill with the ink and it grows back from the press on
 *   the expressive spring. The figure simply counts on. Under reduced motion it fills at once.
 * - Hovering or focusing a slot reads its detail underneath in plain words; otherwise the line says whether the current
 *   slot is done. Logging announces the new streak in a polite live region. Forced colors keeps real borders.
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

/** One entry in a Streak cadence (a day, an issue, or a week). */
export type StreakSlot = {
  /** Short label printed under the pill capsule, such as "W1" or "Fri". */
  label: string;
  /** Whether this slot is complete. */
  done: boolean;
  /** Optional plain-language detail shown on hover or focus, such as "Issue 12 sent". */
  detail?: string;
  /** Marks this slot as the interactive current slot that the reader can toggle. */
  current?: boolean;
};

export type StreakProps = {
  /** Heading for the cadence, such as "Friday letter" or "Reading streak". */
  label: ReactNode;
  /** Singular and plural unit after the standing figure, e.g. ["week", "weeks"]. */
  unit: [one: string, other: string];
  /** Ordered slots from oldest to newest. */
  slots: StreakSlot[];
  /** Controlled state of the current slot (overrides slot.done on the current slot). */
  checked?: boolean;
  /** Initial state of the current slot when uncontrolled. */
  defaultChecked?: boolean;
  /** Called when the reader toggles the current slot. Leave out for a read-only streak. */
  onToggle?: (done: boolean) => void;
  /** Optional action caption shown beside the current slot toggle, such as "Log this week". */
  actionLabel?: string;
  /** Optional status word beside the figure; defaults to "Active" when the streak is running. */
  statusLabel?: string;
  /** Extra classes on the root container. */
  className?: string;
};

/** How long a run has lasted: the count, its status in a word, and a pill for each day or week, the ink when done. */
export function Streak({
  label,
  unit,
  slots,
  checked,
  defaultChecked,
  onToggle,
  actionLabel = "Log today",
  statusLabel,
  className = "",
}: StreakProps) {
  const headingId = useId();
  const currentIdx = slots.findIndex((s) => s.current);
  const initialDone = currentIdx >= 0 ? (defaultChecked ?? slots[currentIdx]!.done) : false;
  const [innerDone, setInnerDone] = useState(initialDone);
  const [inspectIdx, setInspectIdx] = useState<number | null>(null);
  const [live, setLive] = useState("");
  const spring = useTransition("expressive");
  const settle = useTransition("responsive");
  const { reduced } = useMotionDial();

  const currentDone = checked !== undefined ? checked : innerDone;
  const resolved = slots.map((s, i) => (i === currentIdx ? { ...s, done: currentDone } : s));

  /* Count consecutive completed slots from the latest completed entry backward (including current if done, or up to current if open). */
  let count = 0;
  let end = resolved.length - 1;
  if (currentIdx === resolved.length - 1 && !currentDone) end = resolved.length - 2;
  for (let i = end; i >= 0; i--) {
    if (resolved[i]!.done) count++;
    else break;
  }

  const totalDone = resolved.filter((s) => s.done).length;
  const unitWord = count === 1 ? unit[0] : unit[1];
  const active = count > 0;
  const statusText = statusLabel ?? (active ? "Active" : "Paused");

  const toggleCurrent = () => {
    if (!onToggle && checked === undefined && currentIdx < 0) return;
    const next = !currentDone;
    if (checked === undefined) setInnerDone(next);
    onToggle?.(next);
    const nextCount = next ? count + 1 : Math.max(0, count - 1);
    const nextUnit = nextCount === 1 ? unit[0] : unit[1];
    setLive(next ? `Logged. ${nextCount} ${nextUnit} running.` : `Removed. ${nextCount} ${nextUnit} running.`);
  };

  const focusedSlot = inspectIdx !== null ? resolved[inspectIdx] : null;

  return (
    <div
      data-part="paper"
      className={"litt-paper grid w-full min-w-0 gap-4 rounded-surface bg-surface-1 p-6 forced-colors:border " + className}
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <span id={headingId} data-part="lettering" className="text-small text-fg-muted">
            {label}
          </span>
          <p className="flex items-baseline gap-2 text-fg">
            <span data-part="figure" className="text-figure tabular-nums">
              {count}
            </span>
            <span data-part="lettering" className="text-small text-fg-muted">
              {unitWord}
            </span>
          </p>
        </div>
        <span data-part="lettering" className="pb-1 text-small font-title text-fg">
          {statusText}
        </span>
      </header>

      <div
        role="list"
        aria-labelledby={headingId}
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, resolved.length)}, minmax(0, 1fr))` }}
      >
        {resolved.map((slot, i) => {
          const isCurrent = i === currentIdx;
          const interactive = isCurrent && (onToggle !== undefined || checked === undefined);

          if (interactive) {
            return (
              <div key={slot.label + i} role="listitem" className="grid justify-items-center gap-1.5">
                <motion.button
                  type="button"
                  data-part={slot.done ? "pill" : "outline"}
                  aria-pressed={slot.done}
                  aria-label={`${slot.label}: ${actionLabel}${slot.done ? ", done" : ", not yet"}`}
                  onClick={toggleCurrent}
                  onPointerEnter={() => setInspectIdx(i)}
                  onPointerLeave={() => setInspectIdx((cur) => (cur === i ? null : cur))}
                  onFocus={() => setInspectIdx(i)}
                  onBlur={() => setInspectIdx((cur) => (cur === i ? null : cur))}
                  whileTap={reduced ? undefined : { scale: 0.94 }}
                  animate={reduced ? undefined : { scale: slot.done ? [0.86, 1] : 1 }}
                  transition={slot.done ? spring : settle}
                  className={
                    "litt-target relative h-10 w-full cursor-pointer rounded-pill [-webkit-tap-highlight-color:transparent] " +
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                    (slot.done
                      ? "bg-fg forced-colors:border-2 forced-colors:border-[Highlight] forced-colors:bg-[Highlight]"
                      : "bg-transparent shadow-[inset_0_0_0_1.5px_var(--line-control)] hover:bg-surface-3 forced-colors:border forced-colors:border-[ButtonBorder]")
                  }
                />
                <span aria-hidden="true" data-part="lettering" className="text-caption font-title tabular-nums text-fg">
                  {slot.label}
                </span>
              </div>
            );
          }

          return (
            <div key={slot.label + i} role="listitem" className="grid justify-items-center gap-1.5">
              <button
                type="button"
                aria-label={`${slot.label}: ${slot.done ? "done" : "missed"}${slot.detail ? `, ${slot.detail}` : ""}`}
                data-part="pill"
                onClick={() => setInspectIdx((cur) => (cur === i ? null : i))}
                onPointerEnter={() => setInspectIdx(i)}
                onPointerLeave={() => setInspectIdx((cur) => (cur === i ? null : cur))}
                onFocus={() => setInspectIdx(i)}
                onBlur={() => setInspectIdx((cur) => (cur === i ? null : cur))}
                className={
                  "litt-target relative block h-10 w-full cursor-pointer rounded-pill [-webkit-tap-highlight-color:transparent] " +
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                  (slot.done
                    ? "bg-fg forced-colors:border forced-colors:bg-[CanvasText]"
                    : "bg-surface-3 forced-colors:border")
                }
              />
              <span aria-hidden="true" data-part="lettering" className="text-caption font-normal tabular-nums text-fg-muted">
                {slot.label}
              </span>
            </div>
          );
        })}
      </div>

      <p data-part="lettering" className="min-h-5 text-small text-fg-muted">
        {focusedSlot
          ? `${focusedSlot.label}${focusedSlot.detail ? ` · ${focusedSlot.detail}` : focusedSlot.done ? " · Done" : " · Open"}`
          : currentIdx >= 0
            ? currentDone
              ? `${resolved[currentIdx]!.label} · Done`
              : `${actionLabel} · Not done yet`
            : `${totalDone} of ${resolved.length} completed`}
      </p>
      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
