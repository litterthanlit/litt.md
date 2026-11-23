/**
 * Poll, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a question for readers, built from Flat's paper,
 * pills, data hues and expressive spring.
 *
 * - Sits on a borderless Flat paper card (`litt-paper rounded-surface bg-surface-1 p-6`, `data-part="paper"`) with
 *   every painted child marked in Flat's material vocabulary.
 * - One arrival on first view (`useInView` with `once: true`): revealed share bars sweep smoothly open from zero and
 *   the standing vote figure settles once on the expressive spring, then waits. Nothing animates under reduced motion.
 * - Picking a choice reveals the shares: each pill's tinted data bar springs open from the left on the expressive
 *   spring (instant under reduced motion), with the percentage and vote count in ink words.
 * - A standing figure (`text-figure`, Flat's call 8) holds the total votes at the top when `showFigure` is set.
 * - Color stays strictly on data (the hues carry each choice's vote share, R7), and no large fill uses the accent (R6).
 * - A hand always wins: each choice answers on pointerdown with a brief scale dip, picking another option moves your
 *   vote at once, and picking your current choice takes it back.
 * - Accessibility: roving-tabindex `role="radiogroup"` (`aria-labelledby` pointing to the question) with `role="radio"`,
 *   `aria-checked`, one tab stop, Arrow/Home/End navigation, polite live announcement on change, and forced-colors
 *   borders on every pill and the chosen row.
 */
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, useInView } from "motion/react";
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
  /** Show the total votes as Flat's standing figure above the pills. Defaults to true. */
  showFigure?: boolean;
  /** Optional short note under the poll, such as when it closes. */
  note?: ReactNode;
  /** Extra classes on the root element. */
  className?: string;
};

/* Literal variable strings so gen-registry renames every data token cleanly for host installs. */
const HUE_ORDER: PollHue[] = ["blue", "amber", "teal", "violet", "rose", "sky", "bubblegum", "sun"];
const HUE_BAR: Record<PollHue, string> = {
  blue: "bg-[color-mix(in_oklab,var(--data-blue)_28%,transparent)]",
  amber: "bg-[color-mix(in_oklab,var(--data-amber)_28%,transparent)]",
  teal: "bg-[color-mix(in_oklab,var(--data-teal)_28%,transparent)]",
  violet: "bg-[color-mix(in_oklab,var(--data-violet)_28%,transparent)]",
  rose: "bg-[color-mix(in_oklab,var(--data-rose)_28%,transparent)]",
  sky: "bg-[color-mix(in_oklab,var(--data-sky)_28%,transparent)]",
  bubblegum: "bg-[color-mix(in_oklab,var(--data-bubblegum)_28%,transparent)]",
  sun: "bg-[color-mix(in_oklab,var(--data-sun)_28%,transparent)]",
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
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true });
  const headingId = useId();
  const [inner, setInner] = useState<string | null>(defaultValue);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const picked = value !== undefined ? value : inner;
  const revealed = showResults || picked !== null;
  const spring = useTransition("expressive");
  const { reduced } = useMotionDial();
  const arrived = reduced || inView;

  const counts = options.map((o) => o.votes + (picked === o.id ? 1 : 0));
  const total = counts.reduce((sum, n) => sum + n, 0);

  const announce = (o: PollOption, next: string | null) => {
    if (next === null) {
      setStatus(`Removed vote for ${o.label}.`);
    } else {
      const nextTotal = options.reduce((sum, item) => sum + item.votes + (item.id === next ? 1 : 0), 0);
      const mine = o.votes + 1;
      const pct = nextTotal > 0 ? Math.round((mine / nextTotal) * 100) : 0;
      setStatus(`Voted for ${o.label}, ${pct}%, ${mine} ${mine === 1 ? "vote" : "votes"}.`);
    }
  };

  /** Pointer or Enter/Space activation: votes for the choice, or clears the vote when already picked. */
  const choose = (o: PollOption) => {
    const next = picked === o.id ? null : o.id;
    setFocusId(o.id);
    if (value === undefined) setInner(next);
    onVote?.(next);
    announce(o, next);
  };

  /** Arrow, Home and End keys: move focus and select the choice without clearing an existing pick. */
  const select = (o: PollOption) => {
    setFocusId(o.id);
    if (picked === o.id) return;
    if (value === undefined) setInner(o.id);
    onVote?.(o.id);
    announce(o, o.id);
  };

  const activeId =
    (picked !== null && options.some((o) => o.id === picked) ? picked : null) ??
    (focusId !== null && options.some((o) => o.id === focusId) ? focusId : null) ??
    options[0]?.id ??
    null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = options.length;
    if (n === 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    const radios = [...e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")];
    const focused = radios.indexOf(document.activeElement as HTMLElement);
    const at = focused >= 0 ? focused : Math.max(0, options.findIndex((o) => o.id === activeId));
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const fwd = e.key === "ArrowDown" || e.key === (rtl ? "ArrowLeft" : "ArrowRight");
    const back = e.key === "ArrowUp" || e.key === (rtl ? "ArrowRight" : "ArrowLeft");
    const to = fwd ? (at + 1) % n : back ? (at - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    const target = options[to];
    if (!target) return;
    select(target);
    radios[to]?.focus();
  };

  return (
    <div
      ref={rootRef}
      data-part="paper"
      className={"litt-paper grid w-full min-w-0 gap-4 rounded-surface bg-surface-1 p-6 forced-colors:border " + className}
    >
      <header className="grid min-w-0 gap-1">
        <p id={headingId} data-part="lettering" className="text-body font-title text-fg">
          {question}
        </p>
        {showFigure ? (
          <p className="flex flex-wrap items-baseline gap-2 text-fg">
            <motion.span
              key={total}
              data-part="figure"
              initial={reduced ? false : { scale: 0.92 }}
              animate={reduced ? undefined : { scale: arrived ? 1 : 0.92 }}
              transition={spring}
              className="inline-block origin-left text-figure tabular-nums"
            >
              {total.toLocaleString()}
            </motion.span>
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

      <div role="radiogroup" aria-labelledby={headingId} onKeyDown={onKeyDown} className="grid min-w-0 gap-2">
        {options.map((o, i) => {
          const hue = o.hue ?? HUE_ORDER[i % HUE_ORDER.length]!;
          const count = counts[i]!;
          const share = total > 0 ? count / total : 0;
          const pct = Math.round(share * 100);
          const isPicked = picked === o.id;
          return (
            <motion.button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={isPicked}
              tabIndex={o.id === activeId ? 0 : -1}
              data-part="pill"
              onClick={() => choose(o)}
              onFocus={() => setFocusId(o.id)}
              whileTap={reduced ? undefined : { scale: 0.98 }}
              transition={spring}
              className={
                "litt-target relative isolate flex min-h-control-md w-full min-w-0 cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-control bg-block px-4 py-2 text-left text-small text-fg select-none " +
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
                  initial={reduced ? false : { scaleX: 0 }}
                  animate={{ scaleX: arrived ? share : 0 }}
                  transition={spring}
                  style={{ originX: 0 }}
                  className={"pointer-events-none absolute inset-0 -z-10 " + HUE_BAR[hue]}
                />
              )}
              <span className="flex min-w-0 items-center gap-2">
                <span data-part="lettering" className={"min-w-0 truncate " + (isPicked ? "font-title" : "font-normal")}>
                  {o.label}
                </span>
                {isPicked && (
                  <span aria-hidden="true" data-part="mark" className="inline-flex shrink-0 text-fg">
                    <CheckIcon />
                  </span>
                )}
              </span>
              {revealed && (
                <span data-part="lettering" className="shrink-0 text-caption font-normal tabular-nums text-fg-subtle">
                  {pct}%
                  <span className="sr-only">
                    {", "}
                    {count} {count === 1 ? "vote" : "votes"}
                  </span>
                </span>
              )}
            </motion.button>
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
