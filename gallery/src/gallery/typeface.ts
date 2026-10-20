/**
 * The Playground's typeface switch: try the sans in another face, on that page
 * only.
 *
 * The locked face is whatever tokens.css sets in --font-sans, read at runtime,
 * so this list never drifts from the tokens. The others are trials to compare
 * against it: faces litt.md has set before, and the system stack. A trial face
 * loads from Google Fonts the first time it is picked. Sizes, weights by role
 * and tracking stay locked; only the family changes.
 */
import { useLayoutEffect, useMemo } from "react";

export type Typeface = {
  /** "locked" for the tokens' face. */
  id: string;
  /** The family name a reader sees. */
  name: string;
  /** The value for --font-sans. */
  stack: string;
  /** Google Fonts CSS that loads it, in the three weights by role. */
  href?: string;
};

const FALLBACK = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const GOOGLE = "https://fonts.googleapis.com/css2?display=swap&";

const TRIALS: Typeface[] = [
  { id: "inter", name: "Inter", stack: `"Inter", ${FALLBACK}`, href: `${GOOGLE}family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600` },
  { id: "hanken", name: "Hanken Grotesk", stack: `"Hanken Grotesk", ${FALLBACK}`, href: `${GOOGLE}family=Hanken+Grotesk:wght@400;500;600` },
  { id: "system", name: "System", stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' },
];

/** The first family in a stack, unquoted: "Geist" for `"Geist", "Geist Sans", …`. */
const firstFamily = (stack: string) => stack.split(",")[0].trim().replace(/^["']|["']$/g, "");

/** The locked face from tokens.css, then every trial that is not the same face. */
export function useTypefaces(): Typeface[] {
  return useMemo(() => {
    const stack = getComputedStyle(document.documentElement).getPropertyValue("--font-sans").trim();
    const name = firstFamily(stack) || "Locked";
    return [{ id: "locked", name, stack }, ...TRIALS.filter((t) => t.name !== name)];
  }, []);
}

/** Loads a trial face once. The link stays after the page is left; it only declares fonts. */
function load(face: Typeface) {
  if (!face.href) return;
  const id = `litt-playground-font-${face.id}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = face.href;
  document.head.appendChild(link);
}

/**
 * Sets --font-sans on <html> while a trial face is picked, and removes it when
 * the locked face comes back or the page is left. A layout effect, so a page
 * change never paints the trial face.
 */
export function useTypefaceOverride(face: Typeface) {
  useLayoutEffect(() => {
    if (face.id === "locked") return;
    load(face);
    const s = document.documentElement.style;
    s.setProperty("--font-sans", face.stack);
    return () => {
      s.removeProperty("--font-sans");
    };
  }, [face]);
}
