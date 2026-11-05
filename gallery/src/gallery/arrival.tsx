/**
 * Page arrivals: a page you open comes out of what you clicked (deal.ts in @/motion).
 *
 * - An overview tile's name opens its page out of the tile: the page's stages fan out of a deck on it, the nearest
 *   first, as its mosaic does. The mosaic's Open page opens it out of the mosaic: each stage grows out of its own
 *   piece. Any other link (the sidebar, the header) brings the page in with a nudge from the link's side.
 * - The click says where the next page comes from (arriveFrom, or any same-page link through useLinkOrigins), and
 *   Arrival deals that page once it is on screen. Only what is on screen moves; everything below it is already in
 *   its place when you scroll to it.
 * - Nothing moves on a first load, on Back and Forward, or on a route nobody clicked: only a hand starts it. Under
 *   reduced motion nothing moves at all.
 * - Stages and a page's header carry data-arrive ("stage" or "head"); a header always takes the nudge from below.
 */
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { deal, useDealMotion, type Box, type DealSource } from "@/motion/deal";

/* A click and its page can be a chunk's load apart; a source older than this is from something else. */
const FRESH_MS = 3000;

let pending: { route: string; source: DealSource; at: number } | null = null;

/** Says where the page at `route` comes from. Call it in the click that opens it; a later call replaces it. */
export function arriveFrom(route: string, source: DealSource) {
  pending = { route, source, at: performance.now() };
}

/** The boxes of these elements, for a source of `each`. */
export const boxesOf = (els: Element[]): Box[] => els.map((el) => el.getBoundingClientRect());

/**
 * Any click on a link to another page records the link as where that page comes from. It listens in the capture
 * phase, so a more specific arriveFrom in the link's own onClick (a tile) replaces it.
 */
export function useLinkOrigins() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      const route = link?.getAttribute("href")?.slice(1);
      if (!link || !route || link.target) return;
      arriveFrom(route, { toward: link.getBoundingClientRect() });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}

const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight && r.height > 0;
};

/**
 * Mount beside the page, keyed by it, inside its Suspense boundary: it runs once the page is in the document. It
 * deals the page from where its click came from, or does nothing.
 */
export function Arrival({ route, main }: { route: string; main: RefObject<HTMLElement | null> }) {
  const motion = useDealMotion();
  const live = useRef(motion);
  live.current = motion;
  useLayoutEffect(() => {
    const p = pending;
    pending = null;
    const root = main.current;
    if (!p || !root || p.route !== route || performance.now() - p.at > FRESH_MS) return;
    /* The route scrolls to the top in its own layout effect, which runs after this one (it is the parent's). */
    if (scrollY !== 0) window.scrollTo({ top: 0 });
    const all = [...root.querySelectorAll<HTMLElement>("[data-arrive]")];
    const heads = all.filter((el) => el.dataset.arrive === "head" && onScreen(el));
    const stages = all.filter((el) => el.dataset.arrive === "stage");
    const m = live.current;
    deal(heads, { toward: null }, m);
    if ("each" in p.source) {
      /* Each stage grows out of the piece with its index; stages past the last piece take the nudge. */
      const shown = stages.map((el, i) => ({ el, from: (p.source as { each: (Box | null)[] }).each[i] ?? null })).filter((s) => onScreen(s.el));
      deal(
        shown.map((s) => s.el),
        { each: shown.map((s) => s.from) },
        m,
      );
    } else {
      deal(stages.filter(onScreen), p.source, m);
    }
  }, [route, main]);
  return null;
}
