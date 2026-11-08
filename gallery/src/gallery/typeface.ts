/**
 * The faces the Customize panel offers.
 *
 * Each world sets its own face (tokens.css, proposals/worlds.md decision 14): Press Helvetica Neue, Flat Geist, Device
 * Geist Mono. That is the first choice, named by the world, and choosing it sets nothing. Every other face is a trial
 * to compare against it, written as --font-choice on <html> (customize-state.tsx), which every world reads first, so a
 * chosen face wins in every world and in every frame that shows another: faces litt.md has set before, Geist and
 * Helvetica Neue (installed only on Apple's systems, so elsewhere it shows as Helvetica or Arial), and the system stack.
 * A Google face loads the first time it is picked. Sizes, weights by role and tracking stay locked; only the family
 * changes.
 */
import { useMemo } from "react";
import { materialOf, type Material } from "./look";

export type Typeface = {
  /** "locked" for the world's own face. */
  id: string;
  /** The family name a reader sees. */
  name: string;
  /** A shorter name for a tight control, when the full one would wrap. */
  short?: string;
  /** The value for --font-choice, and the stack the picker draws the name in. */
  stack: string;
  /** Google Fonts CSS that loads it, in the three weights by role. */
  href?: string;
};

const FALLBACK = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const GOOGLE = "https://fonts.googleapis.com/css2?display=swap&";

/** Every face the panel can choose, the worlds' own among them (index.html loads Geist and Geist Mono). */
export const FACES: readonly Typeface[] = [
  { id: "helvetica", name: "Helvetica Neue", short: "Helvetica", stack: FALLBACK },
  { id: "geist", name: "Geist", stack: `"Geist", "Geist Sans", ${FALLBACK}` },
  { id: "geist-mono", name: "Geist Mono", short: "Mono", stack: '"Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace' },
  { id: "inter", name: "Inter", stack: `"Inter", ${FALLBACK}`, href: `${GOOGLE}family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600` },
  { id: "hanken", name: "Hanken Grotesk", short: "Hanken", stack: `"Hanken Grotesk", ${FALLBACK}`, href: `${GOOGLE}family=Hanken+Grotesk:wght@400;500;600` },
  { id: "system", name: "System", stack: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' },
];

/** The world's own face as the locked choice, then every other face. Geist Mono is offered only where it is the world's own. */
export function useTypefaces(material: Material): Typeface[] {
  return useMemo(() => {
    const own = materialOf(material).face;
    const face = FACES.find((f) => f.name === own)!;
    return [{ ...face, id: "locked", href: undefined }, ...FACES.filter((f) => f.name !== own && f.id !== "geist-mono")];
  }, [material]);
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
