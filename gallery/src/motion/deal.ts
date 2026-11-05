/**
 * Deal and gather: things come from where you touched them, and go back there.
 *
 * The choreography of the gallery's mosaic (after s-p.studio, 2026-11-04), as a building block any surface can use
 * to open from the element that opened it: a tile into its demos, a tile into its page, a link into what it leads to.
 *
 *   const motion = useDealMotion();
 *   const { order } = deal(pieces, { deck: tile.getBoundingClientRect() }, motion);   // open
 *   await gather(order, tile.getBoundingClientRect(), motion);                         // close
 *
 * - deal() starts each piece where it comes from and springs it to its place in the layout, on the expressive
 *   spring, --stagger apart, arriving out of soft focus (a 4px blur on the responsive spring, R4) and appearing on the
 *   instant tier. Where a piece comes from is the source:
 *     deck    a small deck on one element (a tile): the pieces fan out of it, the nearest first.
 *     each    one element per piece (a mosaic's pieces, for the page they open): each piece grows out of its own.
 *     toward  a nudge of --travel from the side of an element (a link), or from below when there is none: the light
 *             form, for a surface you reach often.
 * - gather() is the way back into a deck on one element, the farthest first, on the expressive exit (an ease-out,
 *   never a bounce). It starts from wherever each piece is drawn, so a close can interrupt a deal.
 * - Pieces move by transform, opacity and filter only, and nothing is measured while it moves: pass `places`, the
 *   untransformed layout boxes, when a piece already carries a transform.
 * - Reduced motion (useDealMotion's `reduced`): nothing moves, both resolve at once.
 */
import { animate, type AnimationPlaybackControls, type Transition } from "motion/react";
import { useExit, useMotionDial, useStagger, useTransition, useTravel } from "./index";

export type Box = { left: number; top: number; width: number; height: number };

/** The tiers a deal and a gather use, read from the locked tokens (or the Playground's dial). */
export type DealMotion = {
  /** Each piece's way to its place: the expressive spring. */
  spring: Transition;
  /** Coming into focus: the responsive spring. */
  focus: Transition;
  /** Appearing: the instant tier. */
  appear: Transition;
  /** The way back: the expressive exit. */
  exit: Transition;
  /** Seconds between pieces. */
  stagger: number;
  /** The nudge of the light form, in px. */
  travel: number;
  reduced: boolean;
};

/** Where pieces come from. */
export type DealSource = { deck: Box } | { each: (Box | null)[] } | { toward: Box | null };

/** R4's ceiling for soft focus. */
export const SOFT_FOCUS = 4;

export function useDealMotion(): DealMotion {
  const { reduced } = useMotionDial();
  return {
    spring: useTransition("expressive"),
    focus: useTransition("responsive"),
    appear: useTransition("instant"),
    exit: useExit("expressive"),
    stagger: useStagger(),
    travel: useTravel(),
    reduced,
  };
}

const box = (el: Element): Box => el.getBoundingClientRect();
const center = (r: Box) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
const dist = (a: Box, b: Box) => Math.hypot(center(a).x - center(b).x, center(a).y - center(b).y);
const blur = (px: number) => `blur(${px}px)`;
const settled = (runs: AnimationPlaybackControls[]) =>
  Promise.all(runs.map((r) => r.finished)).then(
    () => undefined,
    () => undefined,
  );

/** Pieces on their way back: a deal that ends after a gather began leaves them to it. */
const leaving = new WeakSet<HTMLElement>();

type Offset = { x: number; y: number; scale: number };

/** The k-th card of a small deck on `on`, scaled to about half of it, as an offset from `place`. */
export function deckOffset(place: Box, on: Box, k: number, n: number): Offset {
  const scale = Math.min((on.width * 0.56) / place.width, (on.height * 0.56) / place.height, 1);
  const fan = (k - (n - 1) / 2) * 3;
  const from = center(place);
  const to = center(on);
  return { x: to.x + fan - from.x, y: to.y + fan * 0.6 - from.y, scale };
}

/** `place` drawn over `over`: the same centre, as wide. */
function fitOffset(place: Box, over: Box): Offset {
  const from = center(place);
  const to = center(over);
  return { x: to.x - from.x, y: to.y - from.y, scale: over.width / place.width };
}

/** A nudge of `travel` from the side `toward` is on, or from below. */
function driftOffset(place: Box, toward: Box | null, travel: number): Offset {
  if (!toward) return { x: 0, y: travel, scale: 1 };
  const from = center(place);
  const to = center(toward);
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: ((to.x - from.x) / len) * travel, y: ((to.y - from.y) / len) * travel, scale: 1 };
}

/**
 * Springs each piece from its source to its place. Returns the order it dealt them in (gather() wants it) and when
 * the last one has settled. Every piece is placed on its source before this returns, so the first frame never shows
 * them in their places.
 */
export function deal(pieces: HTMLElement[], from: DealSource, motion: DealMotion, { places = pieces.map(box) }: { places?: Box[] } = {}) {
  const index = pieces.map((_, i) => i);
  if ("deck" in from) index.sort((a, b) => dist(places[a]!, from.deck) - dist(places[b]!, from.deck));
  const order = index.map((i) => pieces[i]!);
  if (motion.reduced || !pieces.length) return { order, finished: Promise.resolve() };

  const runs: AnimationPlaybackControls[] = [];
  index.forEach((i, k) => {
    const piece = pieces[i]!;
    const place = places[i]!;
    const own = "each" in from ? from.each[i] : null;
    const start =
      "deck" in from
        ? deckOffset(place, from.deck, k, pieces.length)
        : own
          ? fitOffset(place, own)
          : driftOffset(place, "toward" in from ? from.toward : null, motion.travel);
    const delay = k * motion.stagger;
    leaving.delete(piece);
    piece.style.opacity = "0";
    piece.style.transform = `translateX(${start.x}px) translateY(${start.y}px) scale(${start.scale})`;
    piece.style.filter = blur(SOFT_FOCUS);
    runs.push(
      animate(piece, { x: [start.x, 0], y: [start.y, 0], scale: [start.scale, 1] }, { ...motion.spring, delay }),
      animate(piece, { opacity: [0, 1] }, { ...motion.appear, delay }),
      animate(piece, { filter: [blur(SOFT_FOCUS), blur(0)] }, { ...motion.focus, delay }),
    );
  });
  /* At rest a piece carries no filter: even blur(0px) would make it the containing block of fixed parts inside it. */
  const finished = settled(runs).then(() => {
    for (const piece of pieces) if (!leaving.has(piece)) piece.style.filter = "";
  });
  return { order, finished };
}

/**
 * Gathers the pieces back into a deck on `to`, the last dealt first. `places` are their layout boxes as they will be
 * when the gather ends (leave out anything that moves the whole set and goes back to rest with it).
 */
export function gather(order: HTMLElement[], to: Box, motion: DealMotion, { places = order.map(box) }: { places?: Box[] } = {}) {
  for (const piece of order) leaving.add(piece);
  if (motion.reduced || !order.length) return Promise.resolve();
  const half = ((motion.exit as { duration?: number }).duration ?? 0) / 2;
  const runs: AnimationPlaybackControls[] = [];
  for (let j = 0; j < order.length; j++) {
    const k = order.length - 1 - j;
    const piece = order[k]!;
    const d = deckOffset(places[k]!, to, k, order.length);
    const delay = (j * motion.stagger) / 2;
    runs.push(
      animate(piece, { x: d.x, y: d.y, scale: d.scale }, { ...motion.exit, delay }),
      animate(piece, { filter: blur(SOFT_FOCUS) }, { ...motion.exit, delay }),
      animate(piece, { opacity: 0 }, { ...motion.exit, duration: half, delay: delay + half } as Transition),
    );
  }
  return settled(runs);
}
