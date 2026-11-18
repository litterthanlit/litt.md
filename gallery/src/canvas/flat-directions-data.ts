/**
 * Candidate colours for Flat's three directions (flat-directions.tsx, Nick 2026-11-18: "I feel like we should design
 * flat now, new components fun airy easy approach colorful"). Comparison data, not tokens: the palette Nick picks goes
 * through evolve.md and into Flat's block of tokens.css, and this file stays with the canvas. Each colour has a light
 * and a dark value; a frame sets them as custom properties on its own Flat element (`paletteVars`), so every part
 * inside reads them. Every line carries litt-allow, since every value is a candidate.
 *
 * Words on every fill are the ink of the theme the fill is drawn for (black on a light fill, white on a dark one); the
 * measured ratios are in the canvas item's note and in the report (scratchpad contrast.mjs reads this file).
 */
import type { CSSProperties } from "react";

export type Pair = { light: string; dark: string };

/** A · Soft colour: one pastel fill per kind of thing. Light: tints near white; dark: the same hue, deep and quiet. */
export const SOFT = {
  sky: { light: "#dcebff", dark: "#1a2a3f" }, // litt-allow: candidate pastel, posts
  mint: { light: "#d5f3e2", dark: "#163327" }, // litt-allow: candidate pastel, readers
  butter: { light: "#fff0c2", dark: "#352c12" }, // litt-allow: candidate pastel, the letter
  peach: { light: "#ffe1d3", dark: "#3b2218" }, // litt-allow: candidate pastel, numbers
  lilac: { light: "#ebe3ff", dark: "#29213f" }, // litt-allow: candidate pastel, people
  rose: { light: "#ffdfe9", dark: "#3a1b27" }, // litt-allow: candidate pastel, likes and replies
};

/** A · the deeper step of each pastel, for a chosen thing or a mark on the pastel (the bubble's job, in colour). */
export const SOFT_DEEP = {
  sky: { light: "#bcd8fb", dark: "#25405f" }, // litt-allow: candidate pastel, a step deeper
  mint: { light: "#b2e7c9", dark: "#1f4a38" }, // litt-allow: candidate pastel, a step deeper
  butter: { light: "#fde29a", dark: "#4d401a" }, // litt-allow: candidate pastel, a step deeper
  peach: { light: "#ffc8af", dark: "#563123" }, // litt-allow: candidate pastel, a step deeper
  lilac: { light: "#d6c8ff", dark: "#3b305c" }, // litt-allow: candidate pastel, a step deeper
  rose: { light: "#ffc4d7", dark: "#55283a" }, // litt-allow: candidate pastel, a step deeper
};

/** B · Colour pops: six bright, friendly hues on today's grey and white. One hue per object; black words on each. */
export const POPS = {
  tomato: { light: "#ff6a55", dark: "#ff7a66" }, // litt-allow: candidate pop
  sun: { light: "#ffc83d", dark: "#ffcf52" }, // litt-allow: candidate pop
  grass: { light: "#3ccf78", dark: "#4ad884" }, // litt-allow: candidate pop
  sky: { light: "#4aa3ff", dark: "#5aadff" }, // litt-allow: candidate pop
  grape: { light: "#a27bff", dark: "#ae8cff" }, // litt-allow: candidate pop
  bubblegum: { light: "#ff7ebd", dark: "#ff8cc5" }, // litt-allow: candidate pop
};

/** B · the mark step: each pop deepened until it stands 3:1 off the grey ground and white paper, for a chart's bar or
    a line, where a pop alone is too light (the sun most of all). In dark the pop itself already stands 3:1. */
export const POP_MARKS = {
  tomato: { light: "#e0412c", dark: "#ff7a66" }, // litt-allow: candidate pop, mark step
  sun: { light: "#9c6f00", dark: "#ffcf52" }, // litt-allow: candidate pop, mark step
  grass: { light: "#14904a", dark: "#4ad884" }, // litt-allow: candidate pop, mark step
  sky: { light: "#1f7ce0", dark: "#5aadff" }, // litt-allow: candidate pop, mark step
  grape: { light: "#7a4fe6", dark: "#ae8cff" }, // litt-allow: candidate pop, mark step
  bubblegum: { light: "#d9468e", dark: "#ff8cc5" }, // litt-allow: candidate pop, mark step
};

/** C · Playful: colour blocks behind whole sections, louder than A's pastels; black words in light, white in dark. */
export const BLOCKS = {
  lemon: { light: "#ffe55c", dark: "#3f3608" }, // litt-allow: candidate block
  mint: { light: "#8eebbb", dark: "#0f3f2a" }, // litt-allow: candidate block
  lilac: { light: "#c9b5ff", dark: "#2f2257" }, // litt-allow: candidate block
  peach: { light: "#ffb899", dark: "#4a2316" }, // litt-allow: candidate block
  sky: { light: "#a6d4ff", dark: "#11324f" }, // litt-allow: candidate block
  rose: { light: "#ffc2d6", dark: "#48192b" }, // litt-allow: candidate block
};

/** C · stickers: the pops, as they are, in both themes. */
export const STICKERS = POPS;

type Palette = Record<string, Pair>;

/** A palette as custom properties on a frame: `--{prefix}-{name}` for the theme the frame is in. */
export function paletteVars(prefix: string, palette: Palette, dark: boolean): CSSProperties {
  const out: Record<string, string> = {};
  for (const [name, pair] of Object.entries(palette)) out[`--${prefix}-${name}`] = dark ? pair.dark : pair.light;
  return out as CSSProperties;
}
