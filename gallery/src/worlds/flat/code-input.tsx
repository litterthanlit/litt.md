/**
 * Code input, the Flat body (taste v1.22, "Flat is the studies"; proposals/flat-studies/studies/one-time-code.js):
 * a sign-in's code as one white rounded square per character on the grey ground, with one large figure in each (the
 * large figure, text-figure-lg, 44px, in a cell as tall as five sixths of its width allows). The cells are --cut,
 * paper on the ground and the grey bubble inside paper, at the surface radius, parted by space alone: no outline and
 * nothing cast. They are drawn from the contract's one real input, which lies over them, so paste, autofill, password
 * managers and screen readers all work.
 *
 * - The cell the next character goes into, while the field has focus, takes a 2px ink ring inside it, and an empty
 *   one shows a still ink bar where the figure will stand. Nothing blinks.
 * - A typed character arrives in its cell on the expressive spring (it grows from 0.9), the one thing that moves: a
 *   hand typed it. What the field starts with is simply there, and reduced motion puts it there at once.
 * - An error turns every figure the danger colour and the message under the cells says what to do, in words.
 * - Disabled cells are the light grey with --fg-disabled figures.
 */
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { CodeInputBodyProps } from "@/components/code-input";
import { useTransition } from "@/motion";

/** Flat, white rounded squares on the ground, one large figure each. */
export function CodeInputFlatBody({ length, code, at, focused, disabled, error }: CodeInputBodyProps) {
  const arrive = useTransition("expressive");
  /* Only a character typed after the first paint arrives; what the field starts with is simply there. */
  const typed = useRef(false);
  useEffect(() => {
    typed.current = true;
  }, []);
  return (
    <div aria-hidden="true" data-body="flat" className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${length}, minmax(2.25rem, 1fr))` }}>
      {Array.from({ length }, (_, i) => {
        const char = code[i] ?? "";
        const current = focused && !disabled && i === at;
        return (
          <span
            key={i}
            className={
              "relative grid aspect-5/6 min-w-9 place-items-center overflow-hidden rounded-surface text-figure-lg tabular-nums " +
              "transition-[box-shadow,color] duration-(--dur-instant) ease-litt forced-colors:border " +
              /* Forced colors drop the ring (a box-shadow), so the current cell takes an outline there. */
              (current ? "shadow-[inset_0_0_0_2px_var(--fg)] forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight] " : "") +
              (disabled ? "bg-surface-2 text-fg-disabled" : error ? "bg-cut text-danger" : "bg-cut text-fg")
            }
          >
            {char ? (
              <motion.span key={char + i} initial={typed.current ? { scale: 0.9 } : false} animate={{ scale: 1 }} transition={arrive} className="block leading-none">
                {char}
              </motion.span>
            ) : current ? (
              <span className="h-[0.6em] w-0.5 rounded-pill bg-fg forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]" />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
