/**
 * Soft focus (R4, foundations.md §5): content a hand swaps (a screen, a caption, a tab's panel) arrives in a fade with
 * a blur of at most LIMITS.softBlur px that clears on the responsive spring. The one place in litt where a blur moves:
 * the gallery's lint fails a filter animated anywhere else.
 *
 * - Keyed by `swapKey`: a new key swaps the content; the same key leaves it alone.
 * - Never on the first paint: what is there when the page opens is simply there.
 * - The old content fades out on the responsive exit, with no blur, before the new one comes in.
 * - Under reduced motion nothing blurs or fades: the new content replaces the old.
 * - Material never moves (R2): put SoftSwap around content, not around a surface's shadow or glass.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useMotionDial, useTransition } from "./index";
import { LIMITS } from "./rules";

export function SoftSwap({ swapKey, className, children }: { swapKey: string; className?: string; children: ReactNode }) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const { reduced } = useMotionDial();
  /* Not AnimatePresence's initial={false}: that also swallows the entrances of everything inside. */
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  const soft = mounted.current && !reduced;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={swapKey}
        data-soft-swap=""
        className={className}
        initial={soft ? { opacity: 0, filter: `blur(${LIMITS.softBlur}px)` } : false}
        animate={{ opacity: 1, filter: "blur(0px)", transition: enter, transitionEnd: { filter: "none" } }}
        exit={reduced ? undefined : { opacity: 0, transition: exit }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
