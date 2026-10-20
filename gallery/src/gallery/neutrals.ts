/**
 * The neutral temperatures the Customize panel offers: a split test for Q9
 * (keep the cool neutrals, or warm them).
 *
 * A trial adds no color of its own. It takes the locked neutrals from
 * tokens.css, keeps each one's lightness, and moves only its hue and chroma
 * (app.css, under "Neutrals trial"). Contrast stays where the tokens put it,
 * both themes follow the theme switch, and the accent, status and data hues
 * are untouched. The choice is written as data-neutrals on <body>.
 */
import type { RuleRow } from "@/motion/rules";

export type Neutrals = {
  /** "cool" for the locked neutrals. Also the data-neutrals value. */
  id: "cool" | "gray" | "stone" | "sand";
  name: string;
  /** What changes, for the rules row and the snippet. */
  note: string;
};

export const NEUTRALS: readonly Neutrals[] = [
  { id: "cool", name: "Cool", note: "the locked neutrals, OKLCH hue about 262" },
  { id: "gray", name: "Gray", note: "chroma 0, a true neutral gray like litt.design and Vercel" },
  { id: "stone", name: "Stone", note: "hue 60 at the locked chroma, a warm stone gray" },
  { id: "sand", name: "Sand", note: "hue 75 at twice the locked chroma, a warmer sand" },
];

export const neutralsById = (id: string | undefined) => NEUTRALS.find((n) => n.id === id) ?? NEUTRALS[0];

/** The Color decision: cool neutrals on hue 262. Q9 asks whether it stays. */
export function neutralsRule(n: Neutrals): RuleRow {
  return { ok: n.id === "cool", text: `Cool neutrals on OKLCH hue 262 (Q9 is open): ${n.name}, ${n.note}` };
}

/** The snippet's lines for a trial. The hex values come from evolve.md once one wins, for both themes. */
export function neutralsSnippet(n: Neutrals): string[] {
  if (n.id === "cool") return [];
  return [`/* Neutrals: ${n.name}, ${n.note}. Not pasteable: once it wins, evolve.md rewrites every neutral in both themes. */`];
}
