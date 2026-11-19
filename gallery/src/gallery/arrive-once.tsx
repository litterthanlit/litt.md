/**
 * Flat's first-frame moment (plans/024, Flat, round 3; R10, felt): on #flat/components and #flat/about the readers'
 * faces arrive once on load, one after another on Flat's expressive spring (its 0.28 bounce), so the view is warm
 * before a hand moves. Gallery chrome, never shipped: a component never plays on load.
 *
 * - Once: a key plays the first time it mounts in a visit, and never again (a tile that remounts as it scrolls back is
 *   still).
 * - Only where asked: the wall's first tile in Flat's gallery view (ArriveContext, set by WallTile) and Flat's About
 *   scene. The player's screen never asks, so nothing plays there on load (plans/018, Decision 1).
 * - Under reduced motion, and inside StillMotion, nothing moves: the faces are there from the first frame.
 * - At rest nothing differs: the wrapper is an inline-flex span at scale 1.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useMotionDial, useStagger, useTransition } from "@/motion";

/** True inside the one wall tile that may play its arrival on load. */
export const ArriveContext = createContext(false);

const played = new Set<string>();

/** Whether a part keyed `key` arrives now: asked for, and not yet played in this visit. */
export function useArriveOnce(key: string, asked: boolean): boolean {
  const [arrive] = useState(() => asked && !played.has(key));
  useEffect(() => {
    if (arrive) played.add(key);
  }, [arrive, key]);
  return arrive;
}

/** One face of a row arriving: the `index`th, a stagger after the one before. At rest it is the child as it was. */
export function Arrive({ on, index, children }: { on: boolean; index: number; children: ReactNode }) {
  const { reduced } = useMotionDial();
  const spring = useTransition("expressive");
  const stagger = useStagger();
  const move = on && !reduced;
  const enter = move ? { ...spring, delay: index * stagger } : spring;
  return (
    <motion.span
      className="inline-flex"
      initial={move ? { scale: 0.4, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={enter}
    >
      {children}
    </motion.span>
  );
}

/** The wall tile's ask, for a demo that draws in a tile. */
export const useArriveAsked = () => useContext(ArriveContext);
