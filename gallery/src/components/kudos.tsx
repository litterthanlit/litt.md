/**
 * Kudos, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a reader's cheer for a post, given up to max times,
 * on the expressive spring with progress dots on the sequential ramp (--data-seq-1 to --data-seq-4).
 *
 * - Before any kudos (mine === 0), the pill carries Flat's 1.5px outline ("an outline means off", Flat rule 2). Giving
 *   one turns it into white paper (never an accent fill, R6) and pops it on the expressive spring.
 * - Each kudos up to max lights the next dot along the sequential ramp (gold to plum in light, plum to gold in dark:
 *   progress warmth, R7), warms the heart glyph to that step, increments the total count, and floats a small "+1"
 *   pill upward on the expressive spring before fading on the exit tween.
 * - One more at max clears your kudos back to zero, so a reader can always undo ("a hand always wins").
 * - Reduced motion removes the spring and the floating badges and updates the count and dots at once.
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

/* Literal variable strings so gen-registry renames every sequential token for host installs. */
const SEQ = ["var(--data-seq-1)", "var(--data-seq-2)", "var(--data-seq-3)", "var(--data-seq-4)"] as const;
function rampAt(t: number) {
  const at = Math.max(0, Math.min(1, t)) * 3;
  const k = Math.min(2, Math.floor(at));
  const u = Math.round((at - k) * 100);
  return `color-mix(in oklab, ${SEQ[k + 1]} ${u}%, ${SEQ[k]})`;
}

/** A reader's cheer for a post: an outlined pill until they give kudos, then white, with a dot warming for each one. */
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

  const warmth = mine > 0 ? rampAt(cap <= 1 ? 1 : (mine - 1) / (cap - 1)) : undefined;

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
    <div className={"inline-flex flex-col items-start gap-3 " + className}>
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

      <div className="relative inline-flex flex-wrap items-center gap-3">
        <div className="relative inline-flex">
          <motion.button
            type="button"
            data-part={mine > 0 ? "pill" : "outline"}
            aria-pressed={mine > 0}
            aria-label={
              mine >= cap
                ? `Clear your ${cap} kudos for ${subject}, ${total} total`
                : `Give kudos to ${subject}, ${total} total, you gave ${mine} of ${cap}`
            }
            onClick={tap}
            whileTap={reduced ? undefined : { scale: 0.92 }}
            animate={reduced ? undefined : mine > 0 ? { scale: [0.92, 1] } : { scale: 1 }}
            transition={spring}
            className={
              "litt-target relative inline-flex h-control-md cursor-pointer items-center gap-2.5 rounded-pill px-4 text-small font-title text-fg select-none [-webkit-tap-highlight-color:transparent] " +
              "transition-[background-color,box-shadow] duration-(--dur-instant) ease-litt " +
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
              (mine > 0
                ? "bg-block hover:bg-(--block-hover) forced-colors:border-2 forced-colors:border-[Highlight]"
                : "bg-transparent shadow-[inset_0_0_0_1.5px_var(--line-control)] hover:bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] forced-colors:border forced-colors:border-[ButtonBorder]")
            }
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 16 16"
              aria-hidden="true"
              focusable="false"
              className="shrink-0 transition-colors duration-(--dur-instant) ease-litt"
              style={{ color: warmth ?? "var(--fg)" }}
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
                  className="pointer-events-none absolute -top-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-pill bg-block px-2 py-0.5 text-caption font-title tabular-nums text-fg shadow-tooltip"
                >
                  <span className="size-1.5 rounded-pill" style={{ backgroundColor: warmth }} />
                  +{mine}
                </motion.span>
              )}
            </AnimatePresence>
          )}
        </div>

        <div aria-hidden="true" className="flex items-center gap-1.5">
          {Array.from({ length: cap }, (_, i) => {
            const lit = i < mine;
            const dotColor = rampAt(cap <= 1 ? 1 : i / (cap - 1));
            return (
              <motion.span
                key={i}
                data-part="circle"
                animate={reduced ? undefined : { scale: lit ? 1 : 0.78 }}
                transition={spring}
                className={
                  "size-2.5 rounded-pill transition-colors duration-(--dur-instant) ease-litt " +
                  (lit ? "forced-colors:bg-[Highlight]!" : "bg-[color-mix(in_oklab,var(--fg)_14%,transparent)] forced-colors:border")
                }
                style={lit ? { backgroundColor: dotColor } : undefined}
              />
            );
          })}
        </div>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
