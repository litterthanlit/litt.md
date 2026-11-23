/**
 * ReactionBar, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): readers' reactions to a post, each a pill in
 * one of Flat's data hues (--data-bubblegum, --data-sky, --data-violet, --data-teal) on the expressive spring.
 *
 * - Each pill carries only its glyph and tabular count. Full reaction names live in `aria-label` and `title`.
 * - Reactions this reader has not chosen rest in Flat's 1.5px outline ("an outline means off", Flat rule 2). Choosing
 *   one fills the pill with its hue's tint (never an accent fill, R6), colors its glyph in the hue, pops on the
 *   expressive spring, and floats a small "+1" upward.
 * - Choosing an active reaction again removes it, so every choice stays reversible.
 * - Reduced motion removes the spring and the floating badges and updates the pills and counts at once.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useMotionDial, useTransition } from "@/motion";

export type ReactionIcon = "heart" | "sparkles" | "flame" | "bookmark";
export type ReactionHue = "bubblegum" | "sky" | "violet" | "teal" | "blue" | "amber" | "rose";

export type ReactionItem = {
  /** Stable id for this reaction. */
  id: string;
  /** Accessible name for this reaction, e.g. "Love", "Insightful", "Sharp", "Save". */
  label: string;
  /** Icon glyph inside the pill. */
  icon: ReactionIcon;
  /** Data hue painted on the chosen tint and the glyph. */
  hue: ReactionHue;
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
  /** Show the combined reaction total at Flat's standing 40px figure size. Defaults to false. */
  prominent?: boolean;
  /** Extra classes on the root wrapper. */
  className?: string;
};

export const DEFAULT_REACTIONS: ReactionItem[] = [
  { id: "love", label: "Love", icon: "heart", hue: "bubblegum", count: 42 },
  { id: "spark", label: "Insightful", icon: "sparkles", hue: "sky", count: 19 },
  { id: "fire", label: "Sharp", icon: "flame", hue: "violet", count: 14 },
  { id: "save", label: "Save", icon: "bookmark", hue: "teal", count: 9 },
];

/* Literal CSS variable & utility strings so gen-registry renames every data token for host installs. */
const HUE: Record<ReactionHue, { mark: string; tint: string }> = {
  bubblegum: { mark: "var(--data-bubblegum)", tint: "bg-data-bubblegum-tint" },
  sky: { mark: "var(--data-sky)", tint: "bg-data-sky-tint" },
  violet: { mark: "var(--data-violet)", tint: "bg-data-violet-tint" },
  teal: { mark: "var(--data-teal)", tint: "bg-data-teal-tint" },
  blue: { mark: "var(--data-blue)", tint: "bg-data-blue-tint" },
  amber: { mark: "var(--data-amber)", tint: "bg-data-amber-tint" },
  rose: { mark: "var(--data-rose)", tint: "bg-data-rose-tint" },
};

function Glyph({ icon, color }: { icon: ReactionIcon; color?: string }) {
  const stroke = color ?? "currentColor";
  if (icon === "sparkles") {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 2.2 9.4 6l3.8 1.4-3.8 1.4L8 12.6 6.6 8.8 2.8 7.4 6.6 6 8 2.2Z" fill={color ?? "none"} />
      </svg>
    );
  }
  if (icon === "flame") {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8.4 2.2c.4 2.3-1.4 3.4-1.4 5.1 0 .8.6 1.4 1.3 1.4 1 0 1.7-.9 1.9-2.1 1.4 1.2 2.3 2.7 2.3 4.4A4.5 4.5 0 0 1 8 15.5a4.5 4.5 0 0 1-4.5-4.5c0-2.6 1.7-4.9 4.9-8.8Z" fill={color ?? "none"} />
      </svg>
    );
  }
  if (icon === "bookmark") {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4.2 2.5h7.6a.7.7 0 0 1 .7.7v10.3L8 10.6l-4.5 2.9V3.2a.7.7 0 0 1 .7-.7Z" fill={color ?? "none"} />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 13.6s-5.2-3.2-5.2-6.8A3.1 3.1 0 0 1 8 4.6a3.1 3.1 0 0 1 5.2 2.2c0 3.6-5.2 6.8-5.2 6.8Z" fill={color ?? "none"} />
    </svg>
  );
}

/** Readers' reactions to a post: outlined pills that take their color when a reader chooses one, each with its count. */
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
  const [burst, setBurst] = useState<{ id: string; n: number } | null>(null);
  const [live, setLive] = useState("");

  const active = value !== undefined ? value : inner;
  const spring = useTransition("expressive");
  const fade = useExit("expressive");
  const flight = { ...spring, opacity: fade };
  const { reduced } = useMotionDial();

  const total = items.reduce((sum, item) => sum + item.count + (active.includes(item.id) ? 1 : 0), 0);

  function toggle(item: ReactionItem) {
    const isOn = active.includes(item.id);
    const next = isOn ? active.filter((id) => id !== item.id) : [...active, item.id];
    if (value === undefined) setInner(next);
    onChange?.(next);
    if (!isOn) {
      setBurst((cur) => ({ id: item.id, n: (cur?.n ?? 0) + 1 }));
      setLive(`Added ${item.label} to ${subject}. ${item.count + 1} total.`);
    } else {
      setLive(`Removed ${item.label} from ${subject}. ${item.count} total.`);
    }
  }

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
            {total === 1 ? "reaction" : "reactions"}
          </span>
        </div>
      )}

      <div role="group" aria-label={`Reactions for ${subject}`} className="flex flex-wrap items-center gap-2">
        {items.map((item) => {
          const isOn = active.includes(item.id);
          const count = item.count + (isOn ? 1 : 0);
          const tone = HUE[item.hue];
          const showPop = !reduced && burst?.id === item.id && isOn;

          return (
            <div key={item.id} className="relative inline-flex">
              <motion.button
                type="button"
                title={item.label}
                data-part={isOn ? "pill" : "lettering"}
                aria-pressed={isOn}
                aria-label={`${item.label}, ${count} ${count === 1 ? "reaction" : "reactions"}${isOn ? ", selected" : ""}`}
                onClick={() => toggle(item)}
                whileTap={reduced ? undefined : { scale: 0.92 }}
                animate={reduced ? undefined : isOn ? { scale: [0.92, 1] } : { scale: 1 }}
                transition={spring}
                className={
                  "litt-target relative inline-flex h-control-sm cursor-pointer items-center gap-2 rounded-pill px-3 text-small select-none [-webkit-tap-highlight-color:transparent] " +
                  "transition-colors duration-(--dur-instant) ease-litt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                  (isOn
                    ? "bg-block font-title text-fg hover:bg-(--block-hover)"
                    : "bg-transparent font-normal text-fg-subtle hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] hover:text-fg")
                }
              >
                <span data-part="mark" className="inline-flex items-center">
                  <Glyph icon={item.icon} color={isOn ? tone.mark : undefined} />
                </span>
                <span className="tabular-nums">{count}</span>
              </motion.button>

              <AnimatePresence>
                {showPop && (
                  <motion.span
                    key={burst.n}
                    data-part="float"
                    aria-hidden="true"
                    initial={{ opacity: 0, y: 4, scale: 0.7 }}
                    animate={{ opacity: 1, y: -22, scale: 1 }}
                    exit={{ opacity: 0, y: -32, scale: 0.85 }}
                    transition={flight}
                    className="pointer-events-none absolute -top-1 right-2.5 rounded-pill bg-surface-1 px-1.5 py-0.5 text-caption font-title tabular-nums shadow-float"
                    style={{ color: tone.mark }}
                  >
                    +1
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
