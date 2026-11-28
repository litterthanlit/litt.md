/**
 * Self-running demos (plans/026, phase 3; taste v1.22, R4): a Flat tile on `#flat/components` and the component open
 * in Flat's viewer run their demo by themselves, as the Flat studies do, until a hand arrives. This is the gallery's,
 * never a shipped part's: a component never moves on its own. A demo calls `useSelfRun` with one step and an interval;
 * nothing runs unless a `SelfRunProvider` says so (the Flat wall's tiles and Flat's viewer), and nothing runs under
 * reduced motion, while the demo is off screen or while the tab is hidden, nor while <html> carries data-hold-self-run
 * (a page check reading the wall at rest).
 *
 * A hand is a pointer press, a key or focus inside the demo (never the wheel, which only scrolls the page past it). The first one stops the run for good: what the
 * hand finds is where the run left it, and from then on the demo is the hand's. While it runs, `running` is true, so a
 * demo can keep its live region quiet (a step the hand did not take is not news).
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type RefCallback } from "react";
import { useMotionDial } from "@/motion";

const SelfRunContext = createContext(false);

/** Lets the demos inside it run by themselves. Only the Flat wall's tiles and Flat's viewer mount one. */
export function SelfRunProvider({ on, children }: { on: boolean; children: ReactNode }) {
  return <SelfRunContext.Provider value={on}>{children}</SelfRunContext.Provider>;
}

/* A wheel is not a hand: scrolling the wall past a tile must not stop it. */
const HANDS = ["pointerdown", "keydown", "focusin"] as const;

/** On <html>, holds every self-run where it is: a page check that reads the wall at rest sets it (a11y.mjs). */
const HOLD = "data-hold-self-run";

/**
 * Runs `step` every `every` ms (the first after `first`), with the count of steps taken so far, until a hand arrives.
 * Returns the ref for the demo's root, which is where a hand is listened for, and whether the run is going.
 */
export function useSelfRun<T extends HTMLElement = HTMLDivElement>(
  step: (n: number) => void,
  { every = 2000, first = 600 }: { every?: number; first?: number } = {},
): { ref: RefCallback<T>; running: boolean } {
  const allowed = useContext(SelfRunContext);
  const { reduced } = useMotionDial();
  const [node, setNode] = useState<T | null>(null);
  const [handed, setHanded] = useState(false);
  const latest = useRef(step);
  latest.current = step;
  const count = useRef(0);
  const running = allowed && !reduced && !handed;

  useEffect(() => {
    if (!running || !node) return;
    /* Only a real hand: the ghost pointer below dispatches events too, and they must not stop the run. */
    const stop = (e: Event) => e.isTrusted && setHanded(true);
    for (const type of HANDS) node.addEventListener(type, stop, { capture: true, passive: true });

    let visible = false;
    let timer = 0;
    const tick = () => {
      if (visible && !document.hidden && !document.documentElement.hasAttribute(HOLD)) latest.current(count.current++);
      timer = window.setTimeout(tick, every);
    };
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(node);
    timer = window.setTimeout(tick, first);
    return () => {
      for (const type of HANDS) node.removeEventListener(type, stop, { capture: true });
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [running, node, every, first]);

  const ref = useCallback<RefCallback<T>>((el) => setNode(el), []);
  return { ref, running };
}

/**
 * A ghost pointer for a demo that answers the pointer (a spotlight, a magnet): moves a mouse pointer to the point at
 * (fx, fy), fractions of `root`'s box, by dispatching a pointermove there. A real hand stops the run, and with it the
 * ghost, since its events are not trusted.
 */
export function ghostMove(root: HTMLElement, fx: number, fy: number) {
  const r = root.getBoundingClientRect();
  const x = r.left + fx * r.width;
  const y = r.top + fy * r.height;
  const at = document.elementFromPoint(x, y);
  const target = at && root.contains(at) ? at : root;
  target.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, composed: true, clientX: x, clientY: y, pointerType: "mouse", isPrimary: true }));
}

/** Takes the ghost pointer away from `root`, as a mouse leaving it would. */
export function ghostLeave(root: HTMLElement) {
  root.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, composed: true, relatedTarget: null, pointerType: "mouse", isPrimary: true }));
}
