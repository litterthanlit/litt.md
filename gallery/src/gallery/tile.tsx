/**
 * For a page's tile on the overview's wall (Page's `tile`, kit.tsx): a loop for a tile that shows something working.
 *
 * The wall holds every tile still until a hand reaches it (StillMotion), so arriving and scrolling never play fifty
 * entrances at once, and nothing on it moves by itself (WCAG 2.2.2, and litt's "no looping autoplay"). A tile that
 * shows a process (a plan working through its steps, tabs taking turns) drives it with useLoop(): it plays only while
 * the pointer rests on the tile, pauses when the pointer leaves, and stops for good once someone presses or focuses
 * inside, so whoever reaches in gets a still thing to use.
 */
import { useEffect, useRef, useState, type RefObject } from "react";
import { useMotionDial } from "@/motion";

/**
 * A step counter for a tile that shows something working. It counts only while the pointer is on the tile (the wall's
 * tile around `ref`, or the element itself outside the wall) and the tab is visible, stops for good when someone
 * presses or focuses inside, and never counts under reduced motion or while the wall holds the tile still, where it
 * holds `still`.
 */
export function useLoop<T extends HTMLElement>(length: number, ms: number, still: number): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const { reduced } = useMotionDial();
  const [step, setStep] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = el.closest<HTMLElement>("[data-tile]") ?? el;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    const stop = () => setTouched(true);
    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", stop);
    el.addEventListener("focusin", stop);
    return () => {
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", stop);
      el.removeEventListener("focusin", stop);
    };
  }, []);

  const playing = hovered && !touched && !reduced;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (!document.hidden) setStep((s) => (s + 1) % length);
    }, ms);
    return () => clearInterval(id);
  }, [playing, length, ms]);

  return [ref, reduced && !touched ? still : step];
}
