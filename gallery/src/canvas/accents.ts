/**
 * Nick's six candidate blues for the accent (2026-10-25: "feels too dark"), and today's cobalt, compared on the canvas.
 * These are comparison data, not tokens: the one picked moves into tokens.css, and this file goes with the canvas.
 * Each value is the sRGB form of Nick's P3 swatch; they are the same colors, all inside sRGB.
 * The contrast figures are WCAG 2: white text on the fill, and the fill as text on the light canvas.
 */
import type { CSSProperties } from "react";

export type Accent = { n: string; name: string; hex: string; white: number; asText: number; oklch: string };

export const ACCENTS: Accent[] = [
  { n: "Today", name: "Cobalt", hex: "#264bd1", white: 6.98, asText: 6.75, oklch: "0.479 0.210 266" }, // litt-allow: today's accent, for comparison
  { n: "1", name: "Blue 1", hex: "#0077e9", white: 4.36, asText: 4.22, oklch: "0.580 0.194 255" }, // litt-allow: candidate accent
  { n: "2", name: "Blue 2", hex: "#007fff", white: 3.83, asText: 3.71, oklch: "0.613 0.212 256" }, // litt-allow: candidate accent
  { n: "3", name: "Blue 3", hex: "#0069fe", white: 4.72, asText: 4.56, oklch: "0.568 0.236 260" }, // litt-allow: candidate accent
  { n: "4", name: "Blue 4", hex: "#0957fd", white: 5.54, asText: 5.36, oklch: "0.536 0.254 263" }, // litt-allow: candidate accent
  { n: "5", name: "Blue 5", hex: "#0e4ada", white: 6.98, asText: 6.75, oklch: "0.480 0.226 263" }, // litt-allow: candidate accent
  { n: "6", name: "Blue 6", hex: "#2348c3", white: 7.54, asText: 7.29, oklch: "0.460 0.196 266" }, // litt-allow: candidate accent
];

/**
 * The accent tokens a candidate sets for everything inside it: the fill, its hover (a step darker), the focus ring and
 * accent text. In dark, accent text is lifted toward white, as the dark theme's own --accent-text is, so every
 * candidate is read the way it would ship.
 */
export function accentVars(hex: string, dark = false): CSSProperties {
  return {
    "--accent": hex,
    "--accent-hover": `color-mix(in oklab, ${hex}, black 14%)`,
    "--focus": hex,
    "--accent-text": dark ? `color-mix(in oklab, ${hex}, white 35%)` : hex,
    /* --glow is worked out where tokens.css defines it, from the accent there, so it is restated here to follow the candidate. */
    "--glow": `0 0 0 1px color-mix(in oklab, ${hex} 55%, transparent), 0 0 24px color-mix(in oklab, ${hex} var(--glow-strength), transparent)`,
  } as CSSProperties;
}

/** Blue 4: the brightest of the six that still carries white text past 4.5:1 with room to spare. */
export const PICK = ACCENTS.find((a) => a.n === "4")!;
