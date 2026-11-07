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
 *   spring, --stagger apart, appearing on the instant tier. Where a piece comes from is the source:
 *     deck    a small deck on one element (a tile): the pieces fan out of it, the nearest first.
 *     each    one element per piece (a mosaic's pieces, for the page they open): each piece grows out of its own.
 *     toward  a nudge of --travel from the side of an element (a link), or from below when there is none: the light
 *             form, for a surface you reach often.
 * - gather() is the way back into a deck on one element, the farthest first, on the expressive exit (an ease-out,
 *   never a bounce). It starts from wherever each piece is drawn, so a close can interrupt a deal.
 * - Smooth on a busy page: both run as Web Animations of transform and opacity alone, which the browser runs off the
 *   main thread, so a deal keeps its frames while the pieces it brings in are still mounting. The springs are the
 *   tokens' own, turned into CSS curves by spring.ts toCss. No filter: a blur repaints every frame.
 * - Nothing is measured while it moves: pass `places`, the untransformed layout boxes, when a piece already carries a
 *   transform.
 * - Reduced motion (useDealMotion's `reduced`): nothing moves, both resolve at once.
 *
 * Each material moves its own way (Nick, 2026-11-05: "each theme should have its own motion language"):
 *   Flat    things come from where you touched them: a set deals out of what opened it, an overlay grows out of its
 *           opener from 0.9, and both go back into it.
 *   Press   things have weight: a set settles into place from half of --travel above, one after another, on the
 *           expressive spring, and an overlay rises and settles from --press-scale, as litt always has. Nothing flies.
 *   Device  things are mechanisms: a set switches on in place in three short steps on the instant tier, one after
 *           another like segments lighting, and an overlay switches on and off with no growth and no slide.
 * The material is data-material on <html> (useMaterial); Press is no attribute.
 *
 * An overlay that opens out of its trigger (a Menu, a Dialog) grows from it: it scales up from GROW with its
 * transform-origin on the trigger, so it comes out of the trigger's side without flying across the screen. openerBox()
 * says where the press that opened it happened, read at the press, so it still answers once the trigger is gone (a
 * menu row that opened a dialog).
 */
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { Transition } from "motion/react";
import { useMotionDial } from "./index";
import { toCss } from "./spring";

export type Box = { left: number; top: number; width: number; height: number };

/** A Web Animations timing: milliseconds and a CSS easing. */
export type Timing = { duration: number; easing: string };

/** The tiers a deal and a gather use, read from the locked tokens (or the Playground's dial). */
export type DealMotion = {
  /** Each piece's way to its place: the expressive spring. */
  spring: Timing;
  /** The responsive spring, for what comes with the pieces (a title bar, a scrim). */
  settle: Timing;
  /** Appearing: the instant tier. */
  appear: Timing;
  /** The way back: the expressive exit. */
  exit: Timing;
  /** Milliseconds between pieces. */
  stagger: number;
  /** The nudge of the light form, in px. */
  travel: number;
  reduced: boolean;
  /** Which motion language: the material's. */
  material: Material;
};

/** litt's materials, each with its own motion language. */
export type Material = "press" | "flat" | "device";

const readMaterial = (): Material => {
  const m = typeof document === "undefined" ? null : document.documentElement.dataset.material;
  return m === "flat" || m === "device" ? m : "press";
};
const watchMaterial = (change: () => void) => {
  const mo = new MutationObserver(change);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-material"] });
  return () => mo.disconnect();
};

/** The material on <html>, kept current when it changes (the gallery's Customize panel). Press on the server. */
export function useMaterial(): Material {
  return useSyncExternalStore(watchMaterial, readMaterial, () => "press");
}

/* Device's step: three even steps, as a display's segments light, never a fade. */
const STEPS = "steps(3, end)";
const stepEase = (p: number) => (p >= 1 ? 1 : Math.floor(p * 3) / 3);

/** Where pieces come from. */
export type DealSource = { deck: Box } | { each: (Box | null)[] } | { toward: Box | null };

export function useDealMotion(): DealMotion {
  const { dial, locked, slow, reduced, tuning } = useMotionDial();
  const material = useMaterial();
  const k = tuning ? slow : 1;
  const out = `cubic-bezier(${locked.easeOut.join(", ")})`;
  const spring = (s: typeof dial.expressive): Timing => {
    const css = toCss(s);
    return { duration: reduced ? 0 : css.duration * k, easing: css.easing };
  };
  return {
    spring: spring(dial.expressive),
    settle: spring(dial.responsive),
    appear: { duration: reduced ? 0 : dial.instant * k, easing: out },
    exit: { duration: reduced ? 0 : dial.expressive.time * 1000 * dial.exit * k, easing: out },
    stagger: reduced ? 0 : dial.stagger * k,
    travel: reduced ? 0 : dial.travel,
    reduced,
    material,
  };
}

const box = (el: Element): Box => el.getBoundingClientRect();
const center = (r: Box) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
const dist = (a: Box, b: Box) => Math.hypot(center(a).x - center(b).x, center(a).y - center(b).y);

/* The animations a deal or a gather runs, named so a gather can stop a deal's without touching anyone else's. */
const ID = "litt-deal";
const ours = (el: Element) => el.getAnimations().filter((a) => a.id === ID);
const done = (anims: Animation[]) =>
  Promise.all(anims.map((a) => a.finished)).then(
    () => undefined,
    () => undefined,
  );

type Offset = { x: number; y: number; scale: number };
const transform = (o: Offset) => `translate(${o.x}px, ${o.y}px) scale(${o.scale})`;

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

/* The layer hint lives only while a piece moves, so a page at rest holds no extra layers. */
function moving(pieces: HTMLElement[], anims: Animation[]) {
  for (const piece of pieces) piece.style.willChange = "transform, opacity";
  const finished = done(anims);
  void finished.then(() => {
    for (const piece of pieces) if (!ours(piece).length) piece.style.willChange = "";
  });
  return finished;
}

/**
 * Springs each piece from its source to its place. Returns the order it dealt them in (gather() wants it) and when
 * the last one has settled. Each piece is drawn at its source from the first frame, delay included.
 */
export function deal(pieces: HTMLElement[], from: DealSource, motion: DealMotion, { places = pieces.map(box) }: { places?: Box[] } = {}) {
  const index = pieces.map((_, i) => i);
  /* Flat deals from the touch outward; Press and Device go in reading order, top to bottom. */
  if (motion.material === "flat" && "deck" in from) index.sort((a, b) => dist(places[a]!, from.deck) - dist(places[b]!, from.deck));
  else if (motion.material !== "flat") index.sort((a, b) => places[a]!.top - places[b]!.top || places[a]!.left - places[b]!.left);
  const order = index.map((i) => pieces[i]!);
  if (motion.reduced || !pieces.length) return { order, finished: Promise.resolve() };

  const anims: Animation[] = [];
  if (motion.material !== "flat") {
    index.forEach((i, k) => {
      const piece = pieces[i]!;
      const delay = k * motion.stagger;
      for (const a of ours(piece)) a.cancel();
      if (motion.material === "device") {
        anims.push(piece.animate([{ opacity: 0 }, { opacity: 1 }], { duration: motion.appear.duration, easing: STEPS, delay, fill: "backwards", id: ID }));
      } else {
        anims.push(
          piece.animate([{ transform: `translateY(${-motion.travel / 2}px)` }, { transform: "none" }], { ...motion.spring, delay, fill: "backwards", id: ID }),
          piece.animate([{ opacity: 0 }, { opacity: 1 }], { ...motion.appear, delay, fill: "backwards", id: ID }),
        );
      }
    });
    return { order, finished: moving(pieces, anims) };
  }
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
    for (const a of ours(piece)) a.cancel();
    anims.push(
      piece.animate([{ transform: transform(start) }, { transform: "none" }], { ...motion.spring, delay, fill: "backwards", id: ID }),
      piece.animate([{ opacity: 0 }, { opacity: 1 }], { ...motion.appear, delay, fill: "backwards", id: ID }),
    );
  });
  return { order, finished: moving(pieces, anims) };
}

/**
 * Gathers the pieces back into a deck on `to`, the last dealt first, from wherever each is drawn now. `places` are
 * their layout boxes as they will be when the gather ends; `shift` is how far the whole set is moved right now by
 * something that goes back to rest with it (a drag).
 */
export function gather(
  order: HTMLElement[],
  to: Box,
  motion: DealMotion,
  { places = order.map(box), shift = { x: 0, y: 0 } }: { places?: Box[]; shift?: { x: number; y: number } } = {},
) {
  if (motion.reduced || !order.length) return Promise.resolve();
  const half = motion.exit.duration / 2;
  const anims: Animation[] = [];
  if (motion.material !== "flat") {
    for (let j = 0; j < order.length; j++) {
      const piece = order[order.length - 1 - j]!;
      const opacity = getComputedStyle(piece).opacity;
      const lifted = motion.material === "device" ? null : getComputedStyle(piece).transform;
      for (const a of ours(piece)) a.cancel();
      const delay = (j * motion.stagger) / 2;
      if (motion.material === "device") {
        anims.push(piece.animate([{ opacity }, { opacity: 0 }], { duration: motion.appear.duration, easing: STEPS, delay, fill: "both", id: ID }));
      } else {
        /* Press lifts a little off its place as it goes, the way it came, and never gathers anywhere. */
        anims.push(
          piece.animate([{ transform: lifted === "none" ? "none" : lifted! }, { transform: `translateY(${-motion.travel / 4}px)` }], { ...motion.exit, delay, fill: "both", id: ID }),
          piece.animate([{ opacity }, { opacity: 0 }], { ...motion.exit, delay, fill: "both", id: ID }),
        );
      }
    }
    return moving(order, anims);
  }
  for (let j = 0; j < order.length; j++) {
    const k = order.length - 1 - j;
    const piece = order[k]!;
    const place = places[k]!;
    /* Where it is drawn now, against where its box is now, before its running deal lets go of it. */
    const seen = box(piece);
    const opacity = getComputedStyle(piece).opacity;
    const now = { left: place.left + shift.x, top: place.top + shift.y, width: place.width, height: place.height };
    const from = fitOffset(now, seen);
    for (const a of ours(piece)) a.cancel();
    const delay = (j * motion.stagger) / 2;
    anims.push(
      piece.animate([{ transform: transform(from) }, { transform: transform(deckOffset(place, to, k, order.length)) }], {
        ...motion.exit,
        delay,
        fill: "both",
        id: ID,
      }),
      piece.animate([{ opacity }, { opacity: 0 }], { duration: half, easing: motion.exit.easing, delay: delay + half, fill: "both", id: ID }),
    );
  }
  return moving(order, anims);
}

/** The scale an overlay grows from when it comes out of its trigger, under Flat. */
export const GROW = 0.9;
/* Press grows from --press-scale, as litt's overlays always have. */
const PRESS_GROW = 0.98;

/** How an overlay (a menu, a popover, a dialog) enters and leaves under the current material. */
export type OverlayMotion = {
  material: Material;
  /** The scale it grows from: 0.9 under Flat, 0.98 under Press, 1 under Device (it does not grow). */
  grow: number;
  /** Whether it slides its quarter of --travel from the side it opens on: not under Device. */
  slides: boolean;
  /** Under Device it switches on and off in steps instead: use these as its transitions. */
  switches: boolean;
  switchIn: Transition;
  switchOut: Transition;
};

export function useOverlayMotion(): OverlayMotion {
  const material = useMaterial();
  const { dial, reduced, tuning, slow } = useMotionDial();
  const step: Transition = { duration: reduced ? 0 : (dial.instant / 1000) * (tuning ? slow : 1), ease: stepEase };
  return {
    material,
    grow: material === "flat" ? GROW : material === "press" ? PRESS_GROW : 1,
    slides: material !== "device",
    switches: material === "device",
    switchIn: step,
    switchOut: step,
  };
}

/* The last press on something that opens things: where it was and when. */
let pressed: { box: Box; at: number } | null = null;
let listening = false;
/* A press opens its overlay in the same task or the next few frames; one older than this opened something else. */
const PRESS_MS = 1000;
const OPENERS = "button, a[href], [role=button], [role=menuitem], [role=menuitemcheckbox], [role=menuitemradio], [role=option], [role=tab]";

function listen() {
  if (listening || typeof document === "undefined") return;
  listening = true;
  const note = (e: Event) => {
    const el = (e.target as Element | null)?.closest?.(OPENERS);
    if (el) pressed = { box: el.getBoundingClientRect(), at: performance.now() };
  };
  document.addEventListener("pointerdown", note, true);
  document.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && note(e), true);
}

/* From the moment the engine loads, so the press that mounts an overlay is already noted when the overlay asks. */
listen();

/** Starts noting presses (once per page), so openerBox() can answer. Call it in any overlay that grows from its opener. */
export function useOpeners() {
  useEffect(listen, []);
}

/** The box of whatever was just pressed to open an overlay, or null when nothing was (it opened by itself, or by code). */
export function openerBox(): Box | null {
  const p = pressed;
  return p && performance.now() - p.at < PRESS_MS ? p.box : null;
}

/**
 * The transform-origin, in px of `panel`'s own box, that puts the origin on `opener`'s centre. `panel` may already be
 * drawn at `scale` about its centre (its first frame); its untransformed box is worked out from that.
 */
export function originOn(panel: Element, opener: Box, scale = 1) {
  const r = panel.getBoundingClientRect();
  const w = r.width / scale;
  const h = r.height / scale;
  const c = center(r);
  const o = center(opener);
  return `${o.x - (c.x - w / 2)}px ${o.y - (c.y - h / 2)}px`;
}

/**
 * For an overlay that grows out of the press that opened it (a Dialog, the Command menu, a Lightbox): whether it does,
 * and a ref for the panel that puts its transform-origin on the opener before the first frame, while the panel is drawn
 * at GROW. Read on the render where `open` turns true; `enabled` false (a sheet) never grows.
 */
export function useGrowFrom<T extends HTMLElement>(open: boolean, enabled = true): { grows: boolean; ref: (el: T | null) => void } {
  useOpeners();
  /* Only Flat grows out of its opener; Press rises and Device switches on where it is. */
  const material = useMaterial();
  enabled = enabled && material === "flat";
  const opener = useRef<Box | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current) opener.current = enabled ? openerBox() : null;
  wasOpen.current = open;
  const ref = useCallback((el: T | null) => {
    if (el && opener.current && !el.style.transformOrigin) el.style.transformOrigin = originOn(el, opener.current, GROW);
  }, []);
  return { grows: opener.current !== null, ref };
}
