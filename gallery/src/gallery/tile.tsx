/**
 * What a page's tile on the overview's wall can ask of the wall (Page's `tile`, kit.tsx).
 *
 * The wall holds every tile still until a hand reaches it (StillMotion), so arriving and scrolling never play fifty
 * entrances at once. A tile that plays on its own, as a loop, calls usePlaysOnItsOwn() so the wall wakes it as it
 * mounts, and drives the loop with useLoop(), which counts only while the tile is on screen, stops for good once
 * someone reaches into it, and never counts under reduced motion.
 */
import { createContext, useContext, useEffect, useRef, useState, type RefObject } from "react";
import { useMotionDial } from "@/motion";

/** Set by the wall around each tile: wakes the tile in place. Outside the wall it does nothing. */
export const WakeContext = createContext<() => void>(() => {});

/** A tile that moves on its own calls this, so the wall does not hold it still. */
export function usePlaysOnItsOwn() {
  const wake = useContext(WakeContext);
  useEffect(() => wake(), [wake]);
}

/**
 * A step counter for a tile that plays on its own. It counts only while the
 * tile is on screen and the tab is visible, stops for good when someone reaches
 * into the tile (a press or focus inside it), and never counts under reduced
 * motion, where it holds `still`.
 */
export function useLoop<T extends HTMLElement>(length: number, ms: number, still: number): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const { reduced } = useMotionDial();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    const stop = () => setTouched(true);
    el.addEventListener("pointerdown", stop);
    el.addEventListener("focusin", stop);
    return () => {
      io.disconnect();
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("focusin", stop);
    };
  }, []);

  const playing = visible && !touched && !reduced;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (!document.hidden) setStep((s) => (s + 1) % length);
    }, ms);
    return () => clearInterval(id);
  }, [playing, length, ms]);

  return [ref, reduced && !touched ? still : step];
}
