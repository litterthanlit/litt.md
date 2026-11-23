/**
 * Poll, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a question for readers, built from Flat's pills,
 * its data hues and the expressive spring.
 *
 * - Before a pick, every choice sits as a plain white paper pill on the grey ground (or a grey bubble inside paper) with
 *   an 8px data dot naming its option. No frames, no dividers, nothing cast.
 * - Picking a choice reveals the shares: each pill's tinted data bar springs open from the left on the expressive
 *   spring (instant under reduced motion), with the percentage and vote count in ink words.
 * - A standing 40px figure (text-figure, Flat's call 8) holds the total votes at the top when showFigure is set.
 * - Color stays strictly on data (the hues carry each choice's vote share, R7), and no large fill uses the accent (R6).
 * - A hand always wins: picking another option moves your vote at once, and picking your current choice takes it back.
 * - Accessibility: native radiogroup / radio buttons with full text names, polite live announcement on change, and clear
 *   forced-colors borders on every pill and the chosen row.
 */
import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { CheckIcon } from "@/components/icons";
import { useMotionDial, useTransition } from "@/motion";

/** Data hues for poll options, in R7's fixed order (Flat's eight slots). */
export type PollHue = "blue" | "amber" | "teal" | "violet" | "rose" | "sky" | "bubblegum" | "sun";

/** One choice in a Poll. */
export type PollOption = {
  /** Stable identifier returned to onVote. */
  id: string;
  /** The choice's label in plain sentence case. */
  label: string;
  /** Starting votes for this choice before the current reader votes. */
  votes: number;
  /** Optional data hue; defaults to the option's slot in R7's order. */
  hue?: PollHue;
};

export type PollProps = {
  /** The question asked of the reader. */
  question: ReactNode;
  /** Two to six choices. Each gets its own data hue in R7's order. */
  options: PollOption[];
  /** Controlled picked option id, or null when the reader has not voted yet. */
  value?: string | null;
  /** Initial picked option id when uncontrolled. */
  defaultValue?: string | null;
  /** Called when the reader picks a choice, or clears their vote (null). */
  onVote?: (id: string | null) => void;
  /** Show the shares before the reader votes. Defaults to false (revealed on pick). */
  showResults?: boolean;
  /** Show the total votes as Flat's standing 40px figure above the pills. Defaults to true. */
  showFigure?: boolean;
  /** Optional short note under the poll, such as when it closes. */
  note?: ReactNode;
  /** Extra classes on the root element. */
  className?: string;
};

/* Literal variable strings so gen-registry renames every data token cleanly for host installs. */
const HUE_ORDER: PollHue[] = ["blue", "amber", "teal", "violet", "rose", "sky", "bubblegum", "sun"];
const HUE_DOT: Record<PollHue, string> = {
  blue: "bg-data-blue",
  amber: "bg-data-amber",
  teal: "bg-data-teal",
  violet: "bg-data-violet",
  rose: "bg-data-rose",
  sky: "bg-data-sky",
  bubblegum: "bg-data-bubblegum",
  sun: "bg-data-sun",
};
const HUE_BAR: Record<PollHue, string> = {
  blue: "bg-[color-mix(in_oklab,var(--data-blue)_20%,transparent)]",
  amber: "bg-[color-mix(in_oklab,var(--data-amber)_20%,transparent)]",
  teal: "bg-[color-mix(in_oklab,var(--data-teal)_20%,transparent)]",
  violet: "bg-[color-mix(in_oklab,var(--data-violet)_20%,transparent)]",
  rose: "bg-[color-mix(in_oklab,var(--data-rose)_20%,transparent)]",
  sky: "bg-[color-mix(in_oklab,var(--data-sky)_20%,transparent)]",
  bubblegum: "bg-[color-mix(in_oklab,var(--data-bubblegum)_20%,transparent)]",
  sun: "bg-[color-mix(in_oklab,var(--data-sun)_20%,transparent)]",
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

  const choose = (o: PollOption) => {
    const next = picked === o.id ? null : o.id;
    if (value === undefined) setInner(next);
    onVote?.(next);
    if (next === null) {
      setStatus(`Removed vote for ${o.label}.`);
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
              {total.toLocaleString()}
            </span>
            <span data-part="lettering" className="text-small text-fg-subtle">
              {total === 1 ? "vote" : "votes"}
            </span>
          </p>
        ) : (
          <p data-part="lettering" className="text-caption font-normal tabular-nums text-fg-subtle">
            {total.toLocaleString()} {total === 1 ? "vote" : "votes"}
          </p>
        )}
      </header>

      <div role="group" aria-labelledby={headingId} className="grid gap-2">
        {options.map((o, i) => {
          const hue = o.hue ?? HUE_ORDER[i % HUE_ORDER.length]!;
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
                  data-part="bubble"
                  initial={reduced ? { scaleX: share } : { scaleX: 0 }}
                  animate={{ scaleX: share }}
                  transition={spring}
                  style={{ originX: 0 }}
                  className={"pointer-events-none absolute inset-0 -z-10 " + HUE_BAR[hue]}
                />
              )}
              <span className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden="true" data-part="circle" className={"size-2.5 shrink-0 rounded-pill " + HUE_DOT[hue]} />
                <span className={"min-w-0 truncate " + (isPicked ? "font-title" : "font-normal")}>{o.label}</span>
                {isPicked && (
                  <span aria-hidden="true" data-part="mark" className="inline-flex shrink-0 text-fg">
                    <CheckIcon />
                  </span>
                )}
              </span>
              {revealed && (
                <span className="shrink-0 text-caption font-title tabular-nums text-fg-muted">
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
        <p data-part="lettering" className="text-small text-fg-subtle">
          {note}
        </p>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {status}
      </span>
    </div>
  );
}
