/**
 * Poll, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a question for readers on one white paper, its
 * choices as grey pills, and everyone's share once the reader votes.
 *
 * - One paper on the ground: the question, then the total votes as the one standing figure (text-figure), then the
 *   choices. Each choice is a grey bubble pill with its label; nothing is outlined, nothing casts, and there are no dots.
 * - One motion idea, a bar fills: picking a choice opens every share as a deeper grey inside its pill, growing from the
 *   left on the expressive spring (it arrives, so it bounces a little); a change of vote moves the shares on the same
 *   spring. Under reduced motion the shares are simply there.
 * - Your pick is the one thing in ink: an ink circle with a check before its label, and the label at the title weight.
 *   The percentage sits at the pill's right end in words.
 * - A hand always wins: picking another choice moves your vote at once, and picking yours again takes it back.
 * - Accessibility: native buttons with aria-pressed, each naming its share once revealed, a polite live line on every
 *   change, and real borders under forced colors.
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { CheckIcon } from "@/components/icons";
import { useMotionDial, useTransition } from "@/motion";

/** One choice in a Poll. */
export type PollOption = {
  /** Stable identifier returned to onVote. */
  id: string;
  /** The choice's label in plain sentence case. */
  label: string;
  /** Starting votes for this choice before the current reader votes. */
  votes: number;
};

export type PollProps = {
  /** The question asked of the reader. */
  question: ReactNode;
  /** Two to six choices. */
  options: PollOption[];
  /** Controlled picked option id, or null when the reader has not voted yet. */
  value?: string | null;
  /** Initial picked option id when uncontrolled. */
  defaultValue?: string | null;
  /** Called when the reader picks a choice, or clears their vote (null). */
  onVote?: (id: string | null) => void;
  /** Show the shares before the reader votes. Defaults to false (revealed on pick). */
  showResults?: boolean;
  /** Show the total votes as the standing figure under the question. Defaults to true; off, the total is a quiet line. */
  showFigure?: boolean;
  /** Optional short note under the poll, such as when it closes. */
  note?: ReactNode;
  /** Extra classes on the root element. */
  className?: string;
};

/** A question for readers: its choices as pills, with everyone's share once the reader votes. */
export function Poll({
  question,
  options,
  value,
  defaultValue = null,
  onVote,
  showResults = false,
  showFigure = true,
  note,
  className = "",
}: PollProps) {
  const headingId = useId();
  const [inner, setInner] = useState<string | null>(defaultValue);
  const [status, setStatus] = useState("");
  const picked = value !== undefined ? value : inner;
  const revealed = showResults || picked !== null;
  const spring = useTransition("expressive");
  const { reduced } = useMotionDial();

  const counts = options.map((o) => o.votes + (picked === o.id ? 1 : 0));
  const total = counts.reduce((sum, n) => sum + n, 0);
  const votesWord = total === 1 ? "vote" : "votes";

  const choose = (o: PollOption) => {
    const next = picked === o.id ? null : o.id;
    if (value === undefined) setInner(next);
    onVote?.(next);
    if (next === null) {
      setStatus(`Removed your vote for ${o.label}.`);
    } else {
      const nextTotal = options.reduce((sum, item) => sum + item.votes + (item.id === next ? 1 : 0), 0);
      const mine = o.votes + 1;
      const pct = nextTotal > 0 ? Math.round((mine / nextTotal) * 100) : 0;
      setStatus(`Voted for ${o.label}, ${pct}%, ${mine} ${mine === 1 ? "vote" : "votes"}.`);
    }
  };

  return (
    <div
      data-part="paper"
      className={"litt-paper grid w-full min-w-0 gap-4 rounded-surface bg-surface-1 p-6 forced-colors:border " + className}
    >
      <header className="grid gap-1">
        <p id={headingId} data-part="lettering" className="text-body font-title text-fg">
          {question}
        </p>
        {showFigure ? (
          <p className="flex items-baseline gap-2 text-fg">
            <span data-part="figure" className="text-figure tabular-nums">
              {total.toLocaleString("en-GB")}
            </span>
            <span data-part="lettering" className="text-small text-fg-muted">
              {votesWord}
            </span>
          </p>
        ) : (
          <p data-part="lettering" className="text-small tabular-nums text-fg-muted">
            {total.toLocaleString("en-GB")} {votesWord}
          </p>
        )}
      </header>

      <div role="group" aria-labelledby={headingId} className="grid gap-2">
        {options.map((o, i) => {
          const count = counts[i]!;
          const share = total > 0 ? count / total : 0;
          const pct = Math.round(share * 100);
          const isPicked = picked === o.id;
          return (
            <button
              key={o.id}
              type="button"
              data-part="pill"
              aria-pressed={isPicked}
              onClick={() => choose(o)}
              className={
                "litt-target relative isolate flex min-h-control-md w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-control bg-block px-4 py-2.5 text-left text-small text-fg select-none " +
                "transition-colors duration-(--dur-instant) ease-litt hover:bg-(--block-hover) [-webkit-tap-highlight-color:transparent] " +
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                (isPicked
                  ? "forced-colors:border-2 forced-colors:border-[Highlight]"
                  : "forced-colors:border forced-colors:border-[ButtonBorder]")
              }
            >
              {revealed && (
                <motion.span
                  aria-hidden="true"
                  data-part="share"
                  initial={reduced ? false : { x: "-100%" }}
                  animate={{ x: `${(share - 1) * 100}%` }}
                  transition={spring}
                  className="pointer-events-none absolute inset-0 -z-10 rounded-control bg-slot-fill"
                />
              )}
              <span className="flex min-w-0 items-center gap-2.5">
                {isPicked && (
                  <span
                    aria-hidden="true"
                    data-part="circle"
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-pill bg-accent text-accent-fg forced-colors:border"
                  >
                    <CheckIcon size={12} />
                  </span>
                )}
                <span className={"min-w-0 truncate " + (isPicked ? "font-title" : "font-normal")}>{o.label}</span>
              </span>
              {revealed && (
                <span className="shrink-0 text-small font-title tabular-nums text-fg">
                  {pct}%
                  <span className="sr-only">
                    {", "}
                    {count} {count === 1 ? "vote" : "votes"}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {note && (
        <p data-part="lettering" className="text-small text-fg-muted">
          {note}
        </p>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {status}
      </span>
    </div>
  );
}
