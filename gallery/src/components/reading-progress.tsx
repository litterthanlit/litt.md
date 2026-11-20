/**
 * ReadingProgress, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a minimal Dieter Rams reading
 * progress instrument in Flat's cotton-candy palette (sky -> blue -> violet -> bubblegum) on Flat's 0.28 bounce.
 *
 * - As little design as possible: one borderless paper card (`data-part="paper"`), one quiet title, one 40px standing
 *   percentage, one directly-clickable segmented capsule bar where each chapter IS its segment, and one quiet footer
 *   line naming the active chapter and remaining time. Zero redundant chapter pill rows or Prev/Next chrome.
 * - Completed segments step smoothly along Flat's vivid cotton-candy hues (`--data-sky`, `--data-blue`, `--data-violet`,
 *   `--data-bubblegum`); unread segments rest in Flat's quiet grey bubble (`--surface-3`).
 * - Zero `--accent` fills (R6) and zero auto-animation on mount (R2/R4).
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
  /** Essay or issue title. */
  title?: ReactNode;
  /** Ordered chapters making up the piece. */
  chapters?: ReadingChapter[];
  /** Controlled 0-based active chapter index. */
  chapterIndex?: number;
  /** Initial 0-based active chapter index when uncontrolled. Defaults to 2. */
  defaultChapterIndex?: number;
  /** Called with the next 0-based chapter index when the reader clicks a segment. */
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

/* Literal CSS variable strings so gen-registry renames every data token for host installs. */
const CANDY_RAMP = ["var(--data-sky)", "var(--data-blue)", "var(--data-violet)", "var(--data-bubblegum)"] as const;
function candyAt(t: number) {
  const at = Math.max(0, Math.min(1, t)) * 3;
  const k = Math.min(2, Math.floor(at));
  const u = Math.round((at - k) * 100);
  return `color-mix(in oklab, ${CANDY_RAMP[k + 1]} ${u}%, ${CANDY_RAMP[k]})`;
}

/** A minimal Flat reading progress card with directly-clickable cotton-candy segments and a 40px standing figure. */
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
    <section
      aria-labelledby={headingId}
      data-part="paper"
      className={"grid w-full max-w-sm min-w-0 gap-4 rounded-surface bg-surface-1 p-5 text-fg forced-colors:border " + className}
    >
      {/* Top row: quiet title + single 40px standing figure */}
      <div className="flex items-baseline justify-between gap-4">
        <h3 id={headingId} data-part="lettering" className="truncate text-small font-title text-fg-muted">
          {title}
        </h3>
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

      {/* Directly-clickable segmented cotton-candy capsule bar */}
      <div role="group" aria-label="Chapters" data-part="bubble" className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${safeCount}, minmax(0, 1fr))` }}>
        {chapters.map((ch, i) => {
          const isLit = i <= index;
          const isCurrent = i === index;
          const color = candyAt(safeCount <= 1 ? 1 : i / (safeCount - 1));
          return (
            <button
              key={ch.id}
              type="button"
              title={ch.title}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Chapter ${i + 1}: ${ch.title}, ${ch.minutes} min${isCurrent ? ", current" : ""}`}
              onClick={() => go(i)}
              className="litt-target group flex h-7 cursor-pointer items-center rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={reduced ? undefined : { scaleY: isCurrent ? 1.25 : 1 }}
                transition={spring}
                className="block h-2.5 w-full rounded-pill transition-colors duration-(--dur-instant) ease-litt forced-colors:border"
                style={{ backgroundColor: isLit ? color : "var(--surface-3)" }}
              />
            </button>
          );
        })}
      </div>

      {/* Quiet single-line caption: active chapter + remaining read time */}
      <div className="flex items-baseline justify-between gap-3">
        <span data-part="lettering" className="truncate text-small font-title text-fg">
          {activeChapter?.title ?? `Chapter ${index + 1}`}
        </span>
        <span data-part="lettering" className="shrink-0 text-caption tabular-nums text-fg-subtle">
          {remainingMinutes === 0 ? "Finished" : `${remainingMinutes} min left`}
        </span>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </section>
  );
}
