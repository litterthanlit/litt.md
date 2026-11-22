/**
 * ReadingProgress, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): how far a reader is through a long post,
 * sitting directly on Flat's ground with no box around it.
 *
 * - The same rhythm as `Poll` and `Streak`: the post's title above the 40px standing percentage and the time left, then
 *   a bar of chapter buttons lit up to the current one (`--data-sky` -> `--data-blue` -> `--data-violet` ->
 *   `--data-bubblegum`), and one quiet line naming the current chapter.
 * - No outer box, no `--accent` fills (R6), and nothing moves on mount (R2/R4).
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type ReadingChapter = {
  /** Stable chapter id. */
  id: string;
  /** Short chapter title printed quietly beneath the segmented bar. */
  title: string;
  /** Reading duration in minutes for this chapter. */
  minutes: number;
};

export type ReadingProgressProps = {
  /** The post or issue's title, in sentence case. */
  title?: ReactNode;
  /** Ordered chapters making up the post. */
  chapters?: ReadingChapter[];
  /** Controlled 0-based current chapter index. */
  chapterIndex?: number;
  /** Initial 0-based current chapter index when uncontrolled. Defaults to 2. */
  defaultChapterIndex?: number;
  /** Called with the next 0-based chapter index when the reader chooses a chapter. */
  onChapterChange?: (index: number) => void;
  /** Extra classes on the root wrapper. */
  className?: string;
};

export const DEFAULT_CHAPTERS: ReadingChapter[] = [
  { id: "leaving", title: "Getting there", minutes: 2 },
  { id: "tide", title: "Low tide", minutes: 3 },
  { id: "lighthouse", title: "The lighthouse", minutes: 3 },
  { id: "home", title: "Coming home", minutes: 2 },
];

/* Literal CSS variable strings so gen-registry renames every data token for host installs. */
const RAMP = ["var(--data-sky)", "var(--data-blue)", "var(--data-violet)", "var(--data-bubblegum)"] as const;
function rampAt(t: number) {
  const at = Math.max(0, Math.min(1, t)) * 3;
  const k = Math.min(2, Math.floor(at));
  const u = Math.round((at - k) * 100);
  return `color-mix(in oklab, ${RAMP[k + 1]} ${u}%, ${RAMP[k]})`;
}

/** How far a reader is through a long post: the percent read, the time left and a bar of chapters to jump between. */
export function ReadingProgress({
  title = "A week on the coast",
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
  const activeChapter = chapters[index];

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
    <div className={"grid w-full max-w-sm min-w-0 gap-3 text-fg " + className}>
      {/* Streak-matched typographic header: quiet title over standing 40px figure */}
      <header className="grid gap-1">
        <span id={headingId} data-part="lettering" className="truncate text-small text-fg-subtle">
          {title}
        </span>
        <p className="flex items-baseline gap-2.5 text-fg">
          <motion.span
            key={pct}
            data-part="figure"
            initial={reduced ? false : { scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={spring}
            className="inline-block origin-left text-figure leading-none tabular-nums"
          >
            {pct}%
          </motion.span>
          <span data-part="lettering" className="text-small tabular-nums text-fg-subtle">
            {remainingMinutes === 0 ? "Finished" : `${remainingMinutes} min left`}
          </span>
        </p>
      </header>

      {/* The chapter bar: a button per chapter, lit up to the current one */}
      <div
        role="group"
        aria-labelledby={headingId}
        data-part="bubble"
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${safeCount}, minmax(0, 1fr))` }}
      >
        {chapters.map((ch, i) => {
          const isLit = i <= index;
          const isCurrent = i === index;
          const color = rampAt(safeCount <= 1 ? 1 : i / (safeCount - 1));
          return (
            <button
              key={ch.id}
              type="button"
              title={ch.title}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Chapter ${i + 1}: ${ch.title}, ${ch.minutes} min${isCurrent ? ", current" : ""}`}
              onClick={() => go(i)}
              className="litt-target relative group flex h-6 cursor-pointer items-center rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={reduced ? undefined : { scaleY: isCurrent ? 1.25 : 1 }}
                transition={spring}
                className="block h-2 w-full rounded-pill transition-colors duration-(--dur-instant) ease-litt forced-colors:border"
                style={{ backgroundColor: isLit ? color : "color-mix(in oklab, var(--fg) 10%, transparent)" }}
              />
            </button>
          );
        })}
      </div>

      {/* Single quiet line naming the active chapter */}
      <p data-part="lettering" className="text-caption text-fg-subtle">
        <span className="font-title text-fg">{activeChapter?.title ?? `Chapter ${index + 1}`}</span>
        {" · "}
        <span className="tabular-nums">
          {index + 1} of {safeCount}
        </span>
      </p>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
