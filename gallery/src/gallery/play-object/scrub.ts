/**
 * Scrubbing a selector: a press picks the take under it, and a drag along it picks every take it passes, as the
 * player's tape does. One hand (useHand), so a scroll that starts across it still belongs to the page.
 */
import type { PointerEvent } from "react";
import { useHand } from "@/motion/hand";

export function useScrub(n: number, pick: (i: number) => void) {
  const hand = useHand();
  return (e: PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const under = (x: number) => Math.min(n - 1, Math.max(0, Math.floor(((x - box.left) / box.width) * n)));
    const x0 = e.clientX;
    hand.begin(e, {
      axis: "x",
      slop: 2,
      onMove: (p) => pick(under(p.x)),
      onRelease: (r) => {
        if (!r.cancelled && !r.claimed) pick(under(x0));
      },
    });
  };
}
