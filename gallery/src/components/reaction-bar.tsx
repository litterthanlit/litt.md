/**
 * ReactionBar, a Flat part (skills/litt-md/taste/litt-principles.md, Flat): a playful reader reaction pill cluster
 * powered by Flat's 0.28 expressive spring and Candy data hues.
 *
 * - Untouched reactions rest in Flat's 1.5px outline ("an outline means off", Flat rule 2). Toggling a reaction flips
 *   it to crisp white paper (never an accent fill, R6), lights its Candy data dot, pops the pill on Flat's 0.28
 *   expressive bounce, increments the count, and floats a tiny "+1" pill upward.
 * - Clicking an active reaction removes your reaction cleanly so every press stays reversible ("a hand always wins").
 * - Optional prominent mode displays the combined reaction count at Flat's 40px standing figure size above the pills.
 * - Reduced motion removes all bounce and floating badges and updates the pills and counts at once.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useMotionDial, useTransition } from "@/motion";

export type ReactionIcon = "heart" | "sparkles" | "flame" | "bookmark";
export type ReactionHue = "rose" | "amber" | "blue" | "teal" | "violet";

export type ReactionItem = {
  /** Stable id for this reaction. */
  id: string;
  /** Short plain label, e.g. "Love", "Insightful", "Fire", "Save". */
  label: string;
  /** Icon glyph inside the pill. */
  icon: ReactionIcon;
  /** Candy data hue painted on the active dot and icon. */
  hue: ReactionHue;
  /** Baseline count from other readers. */
  count: number;
};

export type ReactionBarProps = {
  /** Accessible subject being reacted to, e.g. "Issue 18" or "Field notes". */
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
  { id: "love", label: "Love", icon: "heart", hue: "rose", count: 42 },
  { id: "spark", label: "Insightful", icon: "sparkles", hue: "amber", count: 19 },
  { id: "fire", label: "Sharp", icon: "flame", hue: "blue", count: 14 },
  { id: "save", label: "Save", icon: "bookmark", hue: "teal", count: 9 },
];

/* Literal CSS variable strings so gen-registry renames every data token for host installs. */
const HUE_VAR: Record<ReactionHue, string> = {
  rose: "var(--data-rose)",
  amber: "var(--data-amber)",
  blue: "var(--data-blue)",
  teal: "var(--data-teal)",
  violet: "var(--data-violet)",
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

/** A playful Flat reader reaction pill cluster with Candy data dots and Flat's 0.28 expressive bounce. */
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
            {total === 1 ? "reaction" : "reactions"}
          </span>
        </div>
      )}

      <div role="group" aria-label={`Reactions for ${subject}`} className="flex flex-wrap items-center gap-2">
        {items.map((item) => {
          const isOn = active.includes(item.id);
          const count = item.count + (isOn ? 1 : 0);
          const hueColor = HUE_VAR[item.hue];
          const showPop = !reduced && burst?.id === item.id && isOn;

          return (
            <div key={item.id} className="relative inline-flex">
              <motion.button
                type="button"
                data-part={isOn ? "pill" : "outline"}
                aria-pressed={isOn}
                aria-label={`${item.label}, ${count} ${count === 1 ? "reaction" : "reactions"}${isOn ? ", selected" : ""}`}
                onClick={() => toggle(item)}
                whileTap={reduced ? undefined : { scale: 0.93 }}
                animate={reduced ? undefined : isOn ? { scale: [0.94, 1] } : { scale: 1 }}
                transition={spring}
                className={
                  "litt-target relative inline-flex h-control-md cursor-pointer items-center gap-2 rounded-control px-3.5 text-small font-title select-none [-webkit-tap-highlight-color:transparent] " +
                  "transition-colors duration-(--dur-instant) ease-litt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border " +
                  (isOn
                    ? "bg-surface-1 text-fg"
                    : "bg-transparent text-fg-muted shadow-[inset_0_0_0_1.5px_var(--line-control)] hover:text-fg")
                }
              >
                <span
                  aria-hidden="true"
                  data-part="circle"
                  className="size-2 shrink-0 rounded-pill transition-transform duration-(--dur-instant) ease-litt"
                  style={{ backgroundColor: isOn ? hueColor : "var(--line-strong)" }}
                />
                <span data-part="mark" className="inline-flex items-center">
                  <Glyph icon={item.icon} color={isOn ? hueColor : undefined} />
                </span>
                <span>{item.label}</span>
                <span className="tabular-nums text-fg-subtle">{count}</span>
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
                    className="pointer-events-none absolute -top-1 right-3 rounded-pill bg-surface-1 px-1.5 py-0.5 text-caption font-title tabular-nums text-fg shadow-float"
                    style={{ color: hueColor }}
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
