/**
 * ReadingProgress, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): how far a reader is through a long
 * post, on one white paper.
 *
 * - The post's title and the time left on the left, the percent read on the right as the one standing figure
 *   (text-figure), then a bar of chapters and one quiet line naming the current chapter.
 * - Monochrome: each chapter is a segment of the bar, the grey bubble until it is read and the ink once it is. The ink
 *   says how far along; nothing walks a colour ramp, and the current chapter is named in words, never marked by a dot.
 * - One motion idea, a bar fills: choosing a chapter fills the segments up to it from the left, or empties those past
 *   it, on the responsive spring (a small move, so it never bounces). The figure simply changes. Nothing moves on
 *   mount, and under reduced motion the segments are simply there.
 * - Each segment is a button with a finger-sized target, so a reader can jump to any chapter.
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useTransition } from "@/motion";

export type ReadingChapter = {
  /** Stable chapter id. */
  id: string;
  /** Short chapter title, named under the bar when it is the current one. */
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
  const settle = useTransition("responsive");

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
    <div
      data-part="paper"
      className={"litt-paper grid w-full max-w-sm min-w-0 gap-4 rounded-surface bg-surface-1 p-6 text-fg forced-colors:border " + className}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-0.5">
          <span id={headingId} data-part="lettering" className="truncate text-body font-title text-fg">
            {title}
          </span>
          <span data-part="lettering" className="text-small tabular-nums text-fg-muted">
            {remainingMinutes === 0 ? "Finished" : `${remainingMinutes} min left`}
          </span>
        </div>
        <span data-part="figure" className="shrink-0 text-figure tabular-nums">
          {pct}%
        </span>
      </header>

      <div
        role="group"
        aria-labelledby={headingId}
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${safeCount}, minmax(0, 1fr))` }}
      >
        {chapters.map((ch, i) => {
          const isRead = i <= index;
          const isCurrent = i === index;
          return (
            <button
              key={ch.id}
              type="button"
              title={ch.title}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Chapter ${i + 1}: ${ch.title}, ${ch.minutes} min`}
              onClick={() => go(i)}
              className="litt-target relative flex h-6 cursor-pointer items-center rounded-pill [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span
                aria-hidden="true"
                data-part="bubble"
                className="relative block h-2.5 w-full overflow-hidden rounded-pill bg-surface-3 forced-colors:border"
              >
                <motion.span
                  data-part="ink"
                  initial={false}
                  animate={{ x: isRead ? "0%" : "-100%" }}
                  transition={settle}
                  className="absolute inset-0 rounded-pill bg-fg forced-colors:bg-[CanvasText]"
                />
              </span>
            </button>
          );
        })}
      </div>

      <p data-part="lettering" className="text-small text-fg-muted">
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
