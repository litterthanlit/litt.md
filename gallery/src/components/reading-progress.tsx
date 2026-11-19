/**
 * ReadingProgress, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): an airy editorial reading progress
 * card powered by Flat's sunset heatwave ramp, 40px standing figure, and 0.28 expressive spring.
 *
 * - Sits on Flat's white paper (`data-part="paper"`) with zero border and zero cast shadow.
 * - Displays the reading completion percentage at Flat's 40px standing figure size alongside remaining read time and a
 *   heatwave status circle that warms from gold to plum in light (plum to gold in dark).
 * - Continuous heatwave capsule bar springs smoothly to the active chapter on Flat's 0.28 bounce.
 * - Interactive chapter pills use Flat's grey bubble (`data-part="bubble"`) for the current chapter and 1.5px outline
 *   for other chapters; Prev / Next pills step through the essay cleanly.
 * - Zero `--accent` fills (R6) and zero auto-animation on mount (R2/R4).
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type ReadingChapter = {
  /** Stable chapter id. */
  id: string;
  /** Short chapter title printed on its pill. */
  title: string;
  /** Reading duration in minutes for this chapter. */
  minutes: number;
};

export type ReadingProgressProps = {
  /** Essay or issue title. */
  title?: ReactNode;
  /** Ordered chapters making up the piece. */
  chapters?: ReadingChapter[];
  /** Controlled 0-based active chapter index. */
  chapterIndex?: number;
  /** Initial 0-based active chapter index when uncontrolled. Defaults to 2. */
  defaultChapterIndex?: number;
  /** Called with the next 0-based chapter index when the reader jumps or steps. */
  onChapterChange?: (index: number) => void;
  /** Extra classes on the root paper card. */
  className?: string;
};

export const DEFAULT_CHAPTERS: ReadingChapter[] = [
  { id: "intro", title: "Opening", minutes: 2 },
  { id: "springs", title: "Springs", minutes: 3 },
  { id: "tactile", title: "Tactile feel", minutes: 3 },
  { id: "closing", title: "Closing notes", minutes: 2 },
];

/* Literal CSS variable strings so gen-registry renames every sequential token for host installs. */
const SEQ = ["var(--data-seq-1)", "var(--data-seq-2)", "var(--data-seq-3)", "var(--data-seq-4)"] as const;
function rampAt(t: number) {
  const at = Math.max(0, Math.min(1, t)) * 3;
  const k = Math.min(2, Math.floor(at));
  const u = Math.round((at - k) * 100);
  return `color-mix(in oklab, ${SEQ[k + 1]} ${u}%, ${SEQ[k]})`;
}

/** An airy Flat essay reading progress card with a sunset heatwave bar, standing 40px percent, and chapter pills. */
export function ReadingProgress({
  title = "Field notes on motion",
  chapters = DEFAULT_CHAPTERS,
  chapterIndex,
  defaultChapterIndex = 2,
  onChapterChange,
  className = "",
}: ReadingProgressProps) {
  const headingId = useId();
  const safeCount = Math.max(1, chapters.length);
  const clamp = (i: number) => Math.max(0, Math.min(safeCount - 1, i));
  const [inner, setInner] = useState(() => clamp(defaultChapterIndex));
  const [live, setLive] = useState("");

  const index = chapterIndex !== undefined ? clamp(chapterIndex) : inner;
  const spring = useTransition("expressive");
  const { reduced } = useMotionDial();

  const totalMinutes = chapters.reduce((sum, c) => sum + c.minutes, 0);
  const completedMinutes = chapters.slice(0, index + 1).reduce((sum, c) => sum + c.minutes, 0);
  const remainingMinutes = Math.max(0, totalMinutes - completedMinutes);
  const pct = totalMinutes > 0 ? Math.round((completedMinutes / totalMinutes) * 100) : 100;
  const ratio = Math.max(0.06, Math.min(1, pct / 100));
  const warmth = rampAt(ratio);

  function go(nextIdx: number) {
    const clamped = clamp(nextIdx);
    if (chapterIndex === undefined) setInner(clamped);
    onChapterChange?.(clamped);
    const ch = chapters[clamped];
    const doneMins = chapters.slice(0, clamped + 1).reduce((sum, c) => sum + c.minutes, 0);
    const nextPct = totalMinutes > 0 ? Math.round((doneMins / totalMinutes) * 100) : 100;
    const left = Math.max(0, totalMinutes - doneMins);
    setLive(`${ch?.title ?? `Chapter ${clamped + 1}`}: ${nextPct}% read, ${left === 0 ? "finished" : `${left} min left`}.`);
  }

  return (
    <section
      aria-labelledby={headingId}
      data-part="paper"
      className={"grid w-full max-w-md min-w-0 gap-4 rounded-surface bg-surface-1 p-5 text-fg forced-colors:border " + className}
    >
      {/* Header + standing 40px figure */}
      <div className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-1">
          <h3 id={headingId} data-part="lettering" className="truncate text-body font-title text-fg">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-small text-fg-subtle">
            <span
              aria-hidden="true"
              data-part="circle"
              className="size-2.5 shrink-0 rounded-pill"
              style={{ backgroundColor: warmth }}
            />
            <span data-part="lettering" className="tabular-nums">
              {remainingMinutes === 0 ? "Finished reading" : `${remainingMinutes} min left`}
            </span>
          </div>
        </div>
        <motion.span
          key={pct}
          data-part="figure"
          initial={reduced ? false : { scale: 0.94 }}
          animate={{ scale: 1 }}
          transition={spring}
          className="shrink-0 origin-right text-figure leading-none tabular-nums text-fg"
        >
          {pct}%
        </motion.span>
      </div>

      {/* Heatwave capsule track */}
      <div
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        data-part="bubble"
        className="relative h-3 w-full overflow-hidden rounded-pill bg-surface-3 forced-colors:border"
      >
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ scaleX: ratio }}
          transition={spring}
          className="h-full w-full origin-left rounded-pill"
          style={{
            backgroundImage: `linear-gradient(90deg, ${SEQ[0]}, ${SEQ[1]}, ${SEQ[2]}, ${SEQ[3]})`,
          }}
        />
      </div>

      {/* Interactive chapter pills */}
      <div role="group" aria-label="Chapters" className="flex flex-wrap items-center gap-1.5">
        {chapters.map((ch, i) => {
          const isCurrent = i === index;
          const isPast = i < index;
          return (
            <button
              key={ch.id}
              type="button"
              data-part={isCurrent ? "bubble" : "outline"}
              aria-current={isCurrent ? "step" : undefined}
              onClick={() => go(i)}
              className={
                "litt-target inline-flex h-control-sm cursor-pointer items-center gap-1.5 rounded-control px-3 text-caption font-title select-none " +
                "transition-colors duration-(--dur-instant) ease-litt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                (isCurrent
                  ? "bg-surface-3 text-fg"
                  : isPast
                    ? "bg-transparent text-fg-muted shadow-[inset_0_0_0_1.5px_var(--line)] hover:text-fg"
                    : "bg-transparent text-fg-subtle shadow-[inset_0_0_0_1.5px_var(--line)] hover:text-fg")
              }
            >
              <span
                aria-hidden="true"
                data-part="circle"
                className="size-1.5 rounded-pill"
                style={{ backgroundColor: i <= index ? rampAt((i + 1) / safeCount) : "var(--line-strong)" }}
              />
              <span>{ch.title}</span>
            </button>
          );
        })}
      </div>

      {/* Stepper footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span data-part="lettering" className="text-caption tabular-nums text-fg-subtle">
          Chapter {index + 1} of {safeCount}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-part="outline"
            disabled={index === 0}
            onClick={() => go(index - 1)}
            className="litt-target inline-flex h-control-sm cursor-pointer items-center rounded-control px-3 text-caption font-title text-fg-muted shadow-[inset_0_0_0_1.5px_var(--line-control)] transition-colors duration-(--dur-instant) ease-litt hover:text-fg disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
          >
            Previous
          </button>
          <button
            type="button"
            data-part="bubble"
            disabled={index >= safeCount - 1}
            onClick={() => go(index + 1)}
            className="litt-target inline-flex h-control-sm cursor-pointer items-center rounded-control bg-surface-3 px-3 text-caption font-title text-fg transition-colors duration-(--dur-instant) ease-litt hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border"
          >
            Next chapter
          </button>
        </div>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </section>
  );
}
