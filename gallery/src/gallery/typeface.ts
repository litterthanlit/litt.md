/**
 * The faces the Customize panel offers.
 *
 * The locked face is whatever tokens.css sets in --font-sans, read at runtime
 * from <html> (Customize writes its override on <body>, so this never sees it),
 * so the list never drifts from the tokens. The others are trials to compare
 * against it: faces litt.md has set before, Helvetica Neue (the tokens' own
 * fallback, installed only on Apple's systems, so elsewhere it shows as
 * Helvetica or Arial), and the system stack. A Google face loads the first
 * time it is picked. Sizes, weights by role and tracking stay locked; only the
 * family changes.
 */
import { useMemo } from "react";

export type Typeface = {
  /** "locked" for the tokens' face. */
  id: string;
  /** The family name a reader sees. */
  name: string;
  /** A shorter name for a tight control, when the full one would wrap. */
  short?: string;
  /** The value for --font-sans. */
  stack: string;
  /** Google Fonts CSS that loads it, in the three weights by role. */
  href?: string;
};

const FALLBACK = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const GOOGLE = "https://fonts.googleapis.com/css2?display=swap&";

const TRIALS: Typeface[] = [
  { id: "inter", name: "Inter", stack: `"Inter", ${FALLBACK}`, href: `${GOOGLE}family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600` },
  { id: "hanken", name: "Hanken Grotesk", short: "Hanken", stack: `"Hanken Grotesk", ${FALLBACK}`, href: `${GOOGLE}family=Hanken+Grotesk:wght@400;500;600` },
  { id: "helvetica", name: "Helvetica Neue", short: "Helvetica", stack: FALLBACK },
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

/** Loads a face's stylesheet once. It only declares fonts, so it can stay after the face is dropped. */
export function loadTypeface(face: Pick<Typeface, "href">) {
  if (!face.href || document.querySelector(`link[data-litt-face="${face.href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = face.href;
  link.dataset.littFace = face.href;
  document.head.appendChild(link);
}
