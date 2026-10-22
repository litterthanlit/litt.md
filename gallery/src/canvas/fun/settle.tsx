/**
 * Settling: fun mode moves things with whatever is cheapest and exact (transforms, a dash that draws a path), then
 * hands over to the production component's own markup once still. A drawn path keeps a dash pattern that antialiases
 * its round caps a hair differently, and a transform at rest can shift an edge by a subpixel, so the settled frame is
 * always the plain one: that is how fun mode's rest frame matches today's to the pixel.
 */
import { useState, type ReactNode } from "react";
import { motion, type Transition } from "motion/react";

type PathLook = { d: string; className?: string; fill?: string; strokeWidth?: number; strokeLinecap?: "round" | "butt"; strokeLinejoin?: "round" };

/** A path a pen draws in when `draw` is set, then the plain path. Remount it (a new key) to draw again. */
export function DrawPath({ draw, transition, ...look }: PathLook & { draw: boolean; transition: Transition }) {
  const [drawing, setDrawing] = useState(draw);
  if (!drawing) return <path {...look} />;
  return <motion.path {...look} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={transition} onAnimationComplete={() => setDrawing(false)} />;
}

/** An SVG group that pops in from a point when `pop` is set, then a plain group. */
export function PopGroup({ pop, x, y, transition, children }: { pop: boolean; x: number; y: number; transition: Transition; children: ReactNode }) {
  const [popping, setPopping] = useState(pop);
  if (!popping) return <>{children}</>;
  return (
    <motion.g style={{ originX: `${x}px`, originY: `${y}px` }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={transition} onAnimationComplete={() => setPopping(false)}>
      {children}
    </motion.g>
  );
}
