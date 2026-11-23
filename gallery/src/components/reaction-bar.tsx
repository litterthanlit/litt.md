/**
 * ReactionBar, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): readers' reactions to a post on one white
 * paper, each a pill with a symbol and its count.
 *
 * - Each pill carries only its symbol and its count; the reaction's name is its accessible name and its title.
 * - Monochrome. A reaction this reader has not chosen is off, so it keeps Flat's 1.5px outline and its words in the
 *   muted ink. Choosing one makes it the grey bubble, what is chosen inside paper: its symbol fills and its count turns
 *   to the ink at the title weight. No hue and no tint.
 * - One motion idea, digits roll: choosing rolls the pill's count (and the total, with prominent) to the new figure
 *   (RollingNumber). The pill gives under the finger and comes back on the responsive spring; nothing floats.
 * - With prominent, the combined total stands above the pills as the one standing figure (text-figure).
 * - Choosing an active reaction again removes it, so every choice stays reversible. Reduced motion changes the counts
 *   at once.
 */
import { useState } from "react";
import { motion } from "motion/react";
import { RollingNumber } from "@/components/rolling-number";
import { useMotionDial, useTransition } from "@/motion";

export type ReactionIcon = "heart" | "sparkles" | "flame" | "bookmark";

export type ReactionItem = {
  /** Stable id for this reaction. */
  id: string;
  /** Accessible name for this reaction, e.g. "Love", "Insightful", "Sharp", "Save". */
  label: string;
  /** Icon glyph inside the pill. */
  icon: ReactionIcon;
  /** Baseline count from other readers. */
  count: number;
};

export type ReactionBarProps = {
  /** Accessible subject being reacted to, e.g. "Issue 18" or "Dusk tide". */
  subject?: string;
  /** Reaction pills to display. */
  items?: ReactionItem[];
  /** Controlled list of active reaction ids. */
  value?: string[];
  /** Initial active reaction ids when uncontrolled. */
  defaultValue?: string[];
  /** Called with the updated list of active reaction ids on toggle. */
  onChange?: (active: string[]) => void;
  /** Show the combined reaction total above the pills as the standing figure (text-figure). Defaults to false. */
  prominent?: boolean;
  /** Extra classes on the root wrapper. */
  className?: string;
};

export const DEFAULT_REACTIONS: ReactionItem[] = [
  { id: "love", label: "Love", icon: "heart", count: 42 },
  { id: "spark", label: "Insightful", icon: "sparkles", count: 19 },
  { id: "fire", label: "Sharp", icon: "flame", count: 14 },
  { id: "save", label: "Save", icon: "bookmark", count: 9 },
];

const PATHS: Record<ReactionIcon, string> = {
  heart: "M8 13.6s-5.2-3.2-5.2-6.8A3.1 3.1 0 0 1 8 4.6a3.1 3.1 0 0 1 5.2 2.2c0 3.6-5.2 6.8-5.2 6.8Z",
  sparkles: "M8 2.2 9.4 6l3.8 1.4-3.8 1.4L8 12.6 6.6 8.8 2.8 7.4 6.6 6 8 2.2Z",
  flame:
    "M8.4 2.2c.4 2.3-1.4 3.4-1.4 5.1 0 .8.6 1.4 1.3 1.4 1 0 1.7-.9 1.9-2.1 1.4 1.2 2.3 2.7 2.3 4.4A4.5 4.5 0 0 1 8 15.5a4.5 4.5 0 0 1-4.5-4.5c0-2.6 1.7-4.9 4.9-8.8Z",
  bookmark: "M4.2 2.5h7.6a.7.7 0 0 1 .7.7v10.3L8 10.6l-4.5 2.9V3.2a.7.7 0 0 1 .7-.7Z",
};

function Glyph({ icon, filled }: { icon: ReactionIcon; filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[icon]} fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}

/** Readers' reactions to a post: outlined pills that become the grey bubble when a reader chooses one, each with its count. */
export function ReactionBar({
  subject = "this essay",
  items = DEFAULT_REACTIONS,
  value,
  defaultValue = ["love"],
  onChange,
  prominent = false,
  className = "",
}: ReactionBarProps) {
  const [inner, setInner] = useState<string[]>(defaultValue);
  const [live, setLive] = useState("");

  const active = value !== undefined ? value : inner;
  const settle = useTransition("responsive");
  const { reduced } = useMotionDial();

  const total = items.reduce((sum, item) => sum + item.count + (active.includes(item.id) ? 1 : 0), 0);

  function toggle(item: ReactionItem) {
    const isOn = active.includes(item.id);
    const next = isOn ? active.filter((id) => id !== item.id) : [...active, item.id];
    if (value === undefined) setInner(next);
    onChange?.(next);
    setLive(isOn ? `Removed ${item.label} from ${subject}. ${item.count} total.` : `Added ${item.label} to ${subject}. ${item.count + 1} total.`);
  }

  return (
    <div
      data-part="paper"
      className={"litt-paper inline-flex flex-col items-start gap-3 rounded-surface bg-surface-1 p-6 forced-colors:border " + className}
    >
      {prominent && (
        <div className="flex items-baseline gap-2 text-fg">
          <span data-part="figure" className="text-figure tabular-nums">
            <RollingNumber value={total} />
          </span>
          <span data-part="lettering" className="text-small text-fg-muted">
            {total === 1 ? "reaction" : "reactions"}
          </span>
        </div>
      )}

      <div role="group" aria-label={`Reactions for ${subject}`} className="flex flex-wrap items-center gap-2">
        {items.map((item) => {
          const isOn = active.includes(item.id);
          const count = item.count + (isOn ? 1 : 0);
          return (
            <motion.button
              key={item.id}
              type="button"
              title={item.label}
              data-part="pill"
              aria-pressed={isOn}
              aria-label={`${item.label}, ${count} ${count === 1 ? "reaction" : "reactions"}`}
              onClick={() => toggle(item)}
              whileTap={reduced ? undefined : { scale: 0.97 }}
              transition={settle}
              className={
                "litt-target relative inline-flex h-control-sm cursor-pointer items-center gap-2 rounded-pill px-3 text-small select-none [-webkit-tap-highlight-color:transparent] " +
                "transition-colors duration-(--dur-instant) ease-litt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
                (isOn
                  ? "bg-block font-title text-fg hover:bg-(--block-hover) forced-colors:border-2 forced-colors:border-[Highlight]"
                  : "bg-transparent font-normal text-fg-muted shadow-[inset_0_0_0_1.5px_var(--line-control)] hover:text-fg forced-colors:border forced-colors:border-[ButtonBorder]")
              }
            >
              <Glyph icon={item.icon} filled={isOn} />
              <RollingNumber value={count} />
            </motion.button>
          );
        })}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
