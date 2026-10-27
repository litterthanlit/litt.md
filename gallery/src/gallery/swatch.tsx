/**
 * An accent as a small button in its own color: the deck's segments and the Customize panel's tiles show each accent
 * this way, so a choice reads as "a primary action in this color" before its name. A sample, not an action: it is
 * aria-hidden, so it never counts as a view's accent fill (R6), and the name beside it says the accent in words (R5).
 */
import { accentScope, useDark, type Accent } from "./customize-state";

export function AccentChip({ accent, size = "md" }: { accent: Accent; size?: "sm" | "md" }) {
  const dark = useDark();
  return (
    <span
      aria-hidden="true"
      {...accentScope(accent, dark)}
      className={
        "inline-grid shrink-0 place-items-center rounded-pill bg-accent text-accent-fg shadow-(--glow) " +
        (size === "sm" ? "h-2.5 w-4" : "h-6 px-3 text-caption font-title")
      }
    >
      {size === "md" && "Go"}
    </span>
  );
}
