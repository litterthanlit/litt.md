/**
 * Kudos, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a reader's cheer for a post, given up to max times,
 * on one white paper.
 *
 * - The pill is the one action. Before the reader gives any it is the ink with an open heart; once they have, it turns
 *   to the grey bubble with the heart filled (a newsletter's Subscribe becoming Subscribed), and a quiet "3 of 5" beside
 *   it says how many of the most they have given. At the most its words read "Clear my kudos".
 * - With prominent, the total stands above the pill as the one large figure (text-figure-lg): the count is the whole
 *   object. Without it, the total sits in the pill itself.
 * - One motion idea, digits roll: each kudos rolls the changed digits of the total (RollingNumber). The pill gives under
 *   the finger and comes back on the responsive spring; nothing floats, pops or flashes.
 * - One more at max clears your kudos back to zero, so a reader can always undo ("a hand always wins").
 * - Accessibility: a native button with aria-pressed whose name starts with its visible words and carries the subject,
 *   the total and how many of the most you gave, and a polite live region announcing each change in words. Reduced
 *   motion changes the figures at once.
 */
import { useState } from "react";
import { motion } from "motion/react";
import { RollingNumber } from "@/components/rolling-number";
import { useMotionDial, useTransition } from "@/motion";

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
  /** Show the total as the one large figure above the pill (text-figure-lg). Defaults to false. */
  prominent?: boolean;
  /** Extra classes on the root wrapper. */
  className?: string;
};

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="shrink-0">
      <path
        d="M8 13.25S2 10 2 6.1a3.1 3.1 0 0 1 6-1.5 3.1 3.1 0 0 1 6 1.5c0 3.9-6 7.15-6 7.15z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A reader's cheer for a post: an ink pill until they give kudos, then the grey bubble with how many they gave. */
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
  const [live, setLive] = useState("");
  const mine = value !== undefined ? Math.max(0, Math.min(cap, value)) : inner;
  const given = mine > 0;
  const total = count + mine;
  const settle = useTransition("responsive");
  const { reduced } = useMotionDial();

  const tap = () => {
    const next = mine >= cap ? 0 : mine + 1;
    if (value === undefined) setInner(next);
    onChange?.(next);
    if (next > mine) {
      setLive(
        next === cap
          ? `${count + next} kudos for ${subject}. You gave the most, ${cap} of ${cap}.`
          : `${count + next} kudos for ${subject}. You gave ${next} of ${cap}.`,
      );
    } else {
      setLive(`Cleared your kudos for ${subject}. ${count} kudos.`);
    }
  };

  const totalWords = `${total.toLocaleString("en-GB")} ${total === 1 ? "kudo" : "kudos"}`;
  const verb = mine >= cap ? "Clear my kudos" : "Give kudos";
  const yours = given ? `, you gave ${mine} of ${cap}` : "";
  /* The visible words lead the name (WCAG 2.5.3). */
  const name = prominent
    ? `${verb}, ${subject}, ${totalWords}${yours}`
    : `${totalWords}, ${verb.toLowerCase()}, ${subject}${yours}`;

  return (
    <div
      data-part="paper"
      className={
        "litt-paper inline-flex flex-col gap-3 rounded-surface bg-surface-1 p-6 forced-colors:border " +
        (prominent ? "items-center text-center " : "items-start ") +
        className
      }
    >
      {prominent && (
        <div className="grid justify-items-center gap-1 text-fg">
          <span data-part="figure" className="text-figure-lg tabular-nums">
            <RollingNumber value={total} />
          </span>
          <span data-part="lettering" className="text-small text-fg-muted">
            {total === 1 ? "kudo for " : "kudos for "}
            {subject}
          </span>
        </div>
      )}

      <div className={"flex items-center gap-3 " + (prominent ? "mt-1" : "")}>
        <motion.button
          type="button"
          data-part="pill"
          aria-pressed={given}
          aria-label={name}
          onClick={tap}
          whileTap={reduced ? undefined : { scale: 0.97 }}
          transition={settle}
          className={
            "litt-target relative inline-flex h-control-md cursor-pointer items-center gap-2 rounded-pill px-5 text-small font-title select-none [-webkit-tap-highlight-color:transparent] " +
            "transition-colors duration-(--dur-instant) ease-litt " +
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
            (given
              ? "bg-block text-fg hover:bg-(--block-hover) forced-colors:border-2 forced-colors:border-[Highlight]"
              : "bg-accent text-accent-fg hover:bg-accent-hover forced-colors:border forced-colors:border-[ButtonBorder]")
          }
        >
          <Heart filled={given} />
          {prominent ? (
            <span>{verb}</span>
          ) : (
            <span className="tabular-nums">
              <RollingNumber value={total} />
            </span>
          )}
        </motion.button>
        {given && (
          <span aria-hidden="true" data-part="lettering" className="text-small tabular-nums text-fg-muted">
            {mine} of {cap}
          </span>
        )}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
