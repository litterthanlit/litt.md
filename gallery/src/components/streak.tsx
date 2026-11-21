/**
 * Streak, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a publishing or reading cadence tracker built on
 * Flat's standing 40px figure, sunset heatwave ramp and 0.28 expressive bounce.
 *
 * - One 40px figure (text-figure, call 8) carries the live count, paired with its unit in quiet ink and an optional status
 *   dot + word (call 6 amended: small 8px circle in status color, word in ink, no pill).
 * - Each entry in the cadence is a pill capsule: completed slots walk Flat's sunset heatwave ramp (gold to plum in light,
 *   plum to gold in dark) as the streak warms up; missed slots rest in a quiet 8% ink wash.
 * - An open current slot (when onToggle is set) is a native button drawn with Flat's 1.5px outline when off ("an outline
 *   means off", Flat rule 2). Pressing it springs the capsule into the warmest heatwave step on Flat's 0.28 bounce and
 *   steps the figure up.
 * - Hovering or focusing any slot reads its detail note in plain words underneath, and toggling announces the updated
 *   streak in a polite live region. No accent fills (R6); forced colors keeps real borders on every capsule.
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

/* Literal variable strings so gen-registry renames every sequential token for host installs. */
const SEQ = ["var(--data-seq-1)", "var(--data-seq-2)", "var(--data-seq-3)", "var(--data-seq-4)"] as const;
function rampAt(t: number) {
  const at = Math.max(0, Math.min(1, t)) * 3;
  const k = Math.min(2, Math.floor(at));
  const u = Math.round((at - k) * 100);
  return `color-mix(in oklab, ${SEQ[k + 1]} ${u}%, ${SEQ[k]})`;
}

/** A Flat heatwave cadence tracker: standing 40px figure + pill capsules warming along Flat's sunset ramp. */
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

  /* Track order of completed slots so warmth climbs monotonically across done pills. */
  let doneSeen = 0;
  const doneOrder = resolved.map((s) => (s.done ? doneSeen++ : -1));
  const focusedSlot = inspectIdx !== null ? resolved[inspectIdx] : null;

  return (
    <div className={"grid w-full min-w-0 gap-4 " + className}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <span id={headingId} data-part="lettering" className="text-small text-fg-subtle">
            {label}
          </span>
          <p className="flex items-baseline gap-2 text-fg">
            <motion.span
              key={count}
              data-part="figure"
              initial={reduced ? false : { scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={spring}
              className="inline-block origin-left text-figure tabular-nums"
            >
              {count}
            </motion.span>
            <span data-part="lettering" className="text-body text-fg-subtle">
              {unitWord}
            </span>
          </p>
        </div>
        <span data-part="mark" className="inline-flex items-center gap-2 pb-1 text-small text-fg">
          <span aria-hidden="true" data-part="circle" className={"size-2 shrink-0 rounded-pill " + (active ? "bg-success" : "bg-fg-subtle")} />
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
          const rank = doneOrder[i]!;
          const fill = slot.done ? rampAt(totalDone <= 1 ? 1 : rank / (totalDone - 1)) : undefined;

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
                  whileTap={reduced ? undefined : { scale: 0.9 }}
                  animate={reduced ? undefined : { scale: slot.done ? [0.86, 1] : 1 }}
                  transition={spring}
                  className={
                    "litt-target relative h-10 w-full cursor-pointer rounded-pill transition-[background-color,box-shadow] duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                    (slot.done
                      ? "forced-colors:border-2 forced-colors:border-[Highlight] forced-colors:bg-[Highlight]!"
                      : "bg-transparent shadow-[inset_0_0_0_1.5px_var(--line-control)] hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] forced-colors:border forced-colors:border-[ButtonBorder]")
                  }
                  style={slot.done && fill ? { backgroundColor: fill } : undefined}
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
                  "litt-target relative block h-10 w-full cursor-pointer rounded-pill transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                  (slot.done
                    ? "forced-colors:border forced-colors:bg-[CanvasText]!"
                    : "bg-[color-mix(in_oklab,var(--fg)_8%,transparent)] forced-colors:border")
                }
                style={slot.done && fill ? { backgroundColor: fill } : undefined}
              />
              <span aria-hidden="true" data-part="lettering" className="text-caption font-normal tabular-nums text-fg-subtle">
                {slot.label}
              </span>
            </div>
          );
        })}
      </div>

      <p data-part="lettering" className="min-h-5 text-small text-fg-subtle">
        {focusedSlot
          ? `${focusedSlot.label}${focusedSlot.detail ? ` · ${focusedSlot.detail}` : focusedSlot.done ? " · Done" : " · Open"}`
          : currentIdx >= 0
            ? currentDone
              ? `${resolved[currentIdx]!.label} logged · click again to undo`
              : `${actionLabel} · press the outlined pill to light it up`
            : `${totalDone} of ${resolved.length} completed`}
      </p>
      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
