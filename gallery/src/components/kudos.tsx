/**
 * Kudos, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a reader's cheer for a post, given up to max times,
 * on the expressive spring.
 *
 * - The pill is a grey bubble on the paper card (never an accent fill, R6). Giving kudos fills the heart in ink, pops
 *   the pill on the expressive spring, increments the count, and floats a small "+N" pill upward before fading on the
 *   exit tween.
 * - One more at max clears your kudos back to zero, so a reader can always undo ("a hand always wins").
 * - Reduced motion removes the spring and the floating badges and updates the count at once.
 * - Accessibility: native button with full readable count and remaining taps, plus a polite live region announcing each
 *   change in words.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useMotionDial, useTransition } from "@/motion";

export type KudosProps = {
  /** Kudos from other readers before this reader gives any. */
  count: number;
  /** Accessible subject being cheered, such as "Dusk tide" or "Issue 14". */
  subject: string;
  /** The most kudos one reader can give. Defaults to 5. */
  max?: number;
  /** Controlled kudos given by this reader (0 to max). */
  value?: number;
  /** Initial kudos from this reader when uncontrolled. Defaults to 0. */
  defaultValue?: number;
  /** Called with the reader's updated kudos (0 to max) each time it changes. */
  onChange?: (mine: number) => void;
  /** Show the total count as Flat's standing 40px figure above the pill. Defaults to false. */
  prominent?: boolean;
  /** Extra classes on the root wrapper. */
  className?: string;
};

/** A reader's cheer for a post: a pill whose heart fills once they give kudos, up to max times. */
export function Kudos({
  count,
  subject,
  max = 5,
  value,
  defaultValue = 0,
  onChange,
  prominent = false,
  className = "",
}: KudosProps) {
  const cap = Math.max(1, Math.min(10, Math.round(max)));
  const [inner, setInner] = useState(Math.max(0, Math.min(cap, defaultValue)));
  const [burst, setBurst] = useState(0);
  const [live, setLive] = useState("");
  const mine = value !== undefined ? Math.max(0, Math.min(cap, value)) : inner;
  const total = count + mine;
  const spring = useTransition("expressive");
  const fade = useExit("expressive");
  const flight = { ...spring, opacity: fade };
  const { reduced } = useMotionDial();

  const tap = () => {
    const next = mine >= cap ? 0 : mine + 1;
    if (value === undefined) setInner(next);
    onChange?.(next);
    if (next > mine) {
      setBurst((b) => b + 1);
      setLive(
        next === cap
          ? `${count + next} kudos for ${subject}. Maximum ${cap} of ${cap} given.`
          : `${count + next} kudos for ${subject}. You gave ${next} of ${cap}.`,
      );
    } else {
      setLive(`Cleared your kudos for ${subject}. ${count} kudos.`);
    }
  };

  return (
    <div
      data-part="paper"
      className={"litt-paper inline-flex flex-col items-start gap-3 rounded-surface bg-surface-1 p-6 forced-colors:border " + className}
    >
      {prominent && (
        <div className="flex items-baseline gap-2 text-fg">
          <motion.span
            key={total}
            data-part="figure"
            initial={reduced ? false : { scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={spring}
            className="inline-block origin-left text-figure tabular-nums"
          >
            {total.toLocaleString()}
          </motion.span>
          <span data-part="lettering" className="text-small text-fg-subtle">
            {total === 1 ? "kudo" : "kudos"}
          </span>
        </div>
      )}

      <div className="relative inline-flex">
        <motion.button
          type="button"
          data-part="pill"
          aria-pressed={mine > 0}
          aria-label={
            prominent
              ? mine >= cap
                ? `+${mine}, clear your ${cap} kudos for ${subject}, ${total} total`
                : mine > 0
                  ? `+${mine}, give kudos to ${subject}, ${total} total, ${mine} of ${cap}`
                  : `Give kudos to ${subject}, ${total} total`
              : mine >= cap
                ? `${total.toLocaleString()} +${mine}, clear your ${cap} kudos for ${subject}`
                : mine > 0
                  ? `${total.toLocaleString()} +${mine}, give kudos to ${subject}, ${mine} of ${cap}`
                  : `${total.toLocaleString()}, give kudos to ${subject}`
          }
          onClick={tap}
          whileTap={reduced ? undefined : { scale: 0.92 }}
          animate={reduced ? undefined : mine > 0 ? { scale: [0.92, 1] } : { scale: 1 }}
          transition={spring}
          className={
            "litt-target relative inline-flex h-control-md cursor-pointer items-center gap-2.5 rounded-pill px-4 text-small font-title text-fg select-none [-webkit-tap-highlight-color:transparent] " +
            "bg-block hover:bg-(--block-hover) transition-[background-color] duration-(--dur-instant) ease-litt " +
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
            (mine > 0 ? "forced-colors:border-2 forced-colors:border-[Highlight]" : "forced-colors:border forced-colors:border-[ButtonBorder]")
          }
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
            className="shrink-0"
          >
            <path
              d="M8 13.25S2 10 2 6.1a3.1 3.1 0 0 1 6-1.5 3.1 3.1 0 0 1 6 1.5c0 3.9-6 7.15-6 7.15z"
              fill={mine > 0 ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span className="tabular-nums">{prominent ? (mine > 0 ? `+${mine}` : "Give kudos") : total.toLocaleString()}</span>
          {!prominent && mine > 0 && (
            <span aria-hidden="true" className="text-caption font-normal tabular-nums text-fg-subtle">
              +{mine}
            </span>
          )}
        </motion.button>

        {!reduced && (
          <AnimatePresence>
            {burst > 0 && mine > 0 && (
              <motion.span
                key={burst}
                aria-hidden="true"
                data-part="pill"
                initial={{ opacity: 1, y: 0, scale: 0.7 }}
                animate={{ opacity: 0, y: -30, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={flight}
                className="pointer-events-none absolute -top-2 left-1/2 inline-flex -translate-x-1/2 items-center rounded-pill bg-block px-2 py-0.5 text-caption font-title tabular-nums text-fg shadow-tooltip"
              >
                +{mine}
              </motion.span>
            )}
          </AnimatePresence>
        )}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
