/**
 * Switch, the Flat body (taste v1.22, "Flat is the studies"; proposals/flat-studies/studies/switch.js): the switch of a
 * settings list. A pill, 52 by 32, outlined when off (the 1.5px --line-control edge) and the ink when on, with a 24px
 * circle set 4px in that crosses 20px (--sw-travel). Off, the circle is the outline's grey; on, it is paper on the ink.
 * Nothing else is drawn: no word beside it, no tray, no cast. The row's label says what it does, its description
 * what that means, and the state reads from where the circle stands and whether the pill is filled.
 *
 * - The hand is this body's, after the components repo's over-centre switch (Flat's motion, rule 3). Under a finger
 *   the circle lags toward the middle, snaps through it and lands while you still hold it, and the switch changes the
 *   moment it snaps; let go short and it falls back, unless you flicked it, in which case the flick carries it over.
 *   A tap, a click on the row, Space or Enter flips it the same way: the spring throws the circle over and it lands
 *   against its stop. The ink grows behind the circle as it goes (a transform and an opacity, nothing else), so the
 *   fill and the circle are one motion.
 * - It runs on a small integrator of its own, a frame at a time, only while the circle is away from its stop. Nothing
 *   moves without a hand or a new state. Reduced motion (or a still preview) puts the circle on its side at once.
 * - The accent fills the pill only for tone="accent", the one main switch (R6). Under Flat it is the ink anyway.
 * - Forced colors drops the fills, so the pill keeps a border and the ink is the system highlight.
 */
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { useCallback, useEffect, useLayoutEffect, useRef, type MouseEvent, type PointerEvent, type Ref } from "react";
import type { SwitchBodyProps, SwitchTone } from "@/components/switch";
import { useMotionDial } from "@/motion";

/* The pill, in px: 52 by 32, the circle 24 and 4px in, so it crosses 20. */
const TRAVEL = 20;

/* The mechanism, in travel (0 is off, 1 is on) and seconds: the components repo's numbers. */
const BREAKOUT = 0.03;
const SNAP_AT = 0.72;
const BEND = SNAP_AT - 0.5 - BREAKOUT;
const RUBBER = 0.1;
/** The circle under a finger: a stiff, near-critical follow. */
const FOLLOW = { k: 2200, c: 84 };
/** The over-centre spring, once nothing holds it: a preload toward its side, strongest at the middle. */
const THROW = { preload: 40, peak: 260 };
/** The stop at each end: stiff and well damped, so it lands rather than bounces. */
const STOP = { k: 16000, c: 180 };
const AIR = 6;
/** A flick: how far ahead its speed is read, the least speed that counts, and the speed a carried flick keeps. */
const FLICK = { ahead: 0.15, least: 0.8, carry: 12 };
const STEP = 1 / 480;
/** How far a finger moves before a press becomes a drag, in px. */
const SLOP = 5;

/** Where the circle sits for a finger q of the way across: it lags, then catches up past the middle. */
function capFor(q: number) {
  if (q < 0) return -RUBBER * (1 - Math.exp(q / (2.5 * RUBBER)));
  return Math.max(0, q - BREAKOUT - BEND * (q / SNAP_AT) ** 2);
}
/** The finger that puts the circle at r: capFor's inverse. */
function fingerFor(r: number) {
  if (r < 0) return 2.5 * RUBBER * Math.log(1 + Math.max(-0.99 * RUBBER, r) / RUBBER);
  if (r < 1e-3) return 0;
  const a = BEND / SNAP_AT ** 2;
  return (1 - Math.sqrt(Math.max(0, 1 - 4 * a * (BREAKOUT + r)))) / (2 * a);
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/* The button is the pill. The row's label is stretched over the whole row, so the pill sits above it (z-1) and a press
   on it still lands on the button. It stands in the middle of the label and its description. */
const pill =
  "[--sw-travel:20px] [--x:0] " +
  "peer relative z-1 inline-flex h-8 w-13 shrink-0 cursor-pointer touch-pan-y self-center overflow-hidden rounded-pill row-end-3 " +
  "shadow-[inset_0_0_0_1.5px_var(--line-control)] [-webkit-tap-highlight-color:transparent] " +
  "disabled:cursor-not-allowed disabled:opacity-40 " +
  "forced-colors:border " +
  focusRing;

/* The ink: a whole pill behind the circle, its right end riding with it, clipped by the pill. Faded in over the first
   sixth of the way, so off is the outline alone. */
const inkBase =
  "pointer-events-none absolute inset-y-0 left-0 w-13 rounded-pill forced-colors:bg-[Highlight] " +
  "[translate:calc((var(--x)_-_1)*var(--sw-travel))_0] [opacity:clamp(0,calc(var(--x)*6),1)] group-data-[state=checked]/pill:opacity-100";
const ink: Record<SwitchTone, string> = { neutral: " bg-fg", accent: " bg-accent" };

/* The circle: the outline's grey when off, paper on the ink when on. Its colour changes on the instant tier. */
const cap =
  "pointer-events-none absolute top-1 left-1 size-6 rounded-pill forced-colors:border " +
  "[translate:calc(var(--x)*var(--sw-travel))_0] transition-[background-color] duration-(--dur-instant) ease-litt";

type Hand = { id: number; anchorX: number; anchorP: number; lastX: number; startX: number; travelPx: number; samples: [number, number][]; moved: boolean; flying: number };

/** Flat, the settings list's switch: an outlined pill that fills with ink, and a circle you can tap, drag or flick over its centre. */
export function SwitchFlatBody({ disabled, tone, root: rootProps, className }: SwitchBodyProps) {
  const { ref: outerRef, checked, onCheckedChange, ...rest } = rootProps;
  const on = !!checked;
  const { reduced } = useMotionDial();

  const el = useRef<HTMLButtonElement | null>(null);
  const sim = useRef({ x: on ? 1 : 0, v: 0, side: on ? 1 : 0, time: 0, raf: 0, last: 0 });
  const hand = useRef<Hand | null>(null);
  const ghost = useRef<{ t0: number; q0: number; speed: number } | null>(null);
  const dropped = useRef(-1);
  const set = useRef(onCheckedChange);
  set.current = onCheckedChange;
  const shownOn = useRef(on);
  shownOn.current = on;
  const still = useRef(reduced);
  still.current = reduced;

  const draw = useCallback(() => {
    el.current?.style.setProperty("--x", sim.current.x.toFixed(4));
  }, []);

  const frame = useCallback(
    (now: number) => {
      const s = sim.current;
      s.raf = 0;
      if (!el.current) return;
      const rel = (p: number) => (s.side ? 1 - p : p);
      const abs = (r: number) => (s.side ? 1 - r : r);
      const target = () => {
        const g = ghost.current;
        if (g) return abs(capFor(g.q0 + g.speed * (s.time - g.t0)));
        const h = hand.current;
        if (!h || h.flying || !h.moved) return null;
        return abs(capFor(rel(h.anchorP + (h.lastX - h.anchorX) / h.travelPx)));
      };
      let dt = Math.min(0.05, s.last ? (now - s.last) / 1000 : STEP);
      s.last = now;
      while (dt > 1e-9) {
        const h = Math.min(STEP, dt);
        dt -= h;
        s.time += h;
        const to = target();
        let f: number;
        if (to !== null) f = FOLLOW.k * (to - s.x) - FOLLOW.c * s.v;
        else {
          f = (s.side ? 1 : -1) * (THROW.preload + THROW.peak * Math.max(0, 1 - Math.abs(2 * s.x - 1))) - AIR * s.v;
          if (s.x > 1) f -= STOP.k * (s.x - 1) + STOP.c * s.v;
          else if (s.x < 0) f -= STOP.k * s.x + STOP.c * s.v;
        }
        s.v += f * h;
        s.x += s.v * h;
        /* Over the centre: the switch changes now, under the finger, and the spring takes it the rest of the way. */
        if (rel(s.x) >= 0.5) {
          s.side = s.side ? 0 : 1;
          ghost.current = null;
          const held = hand.current;
          if (held) {
            held.flying = s.time;
            held.anchorX = held.lastX;
            held.anchorP = s.side;
          }
          /* A state from outside already says so; a hand's snap tells the contract. */
          if ((s.side === 1) !== shownOn.current) set.current?.(s.side === 1);
        }
        const held = hand.current;
        if (held && held.flying && ((rel(s.x) < 0.02 && Math.abs(s.v) < 0.6) || s.time - held.flying > 0.25)) held.flying = 0;
      }
      const rest = s.side + (s.side ? 1 : -1) * (THROW.preload / STOP.k);
      if (!hand.current && !ghost.current && Math.abs(s.v) < 0.005 && Math.abs(s.x - rest) < 0.002) {
        s.x = s.side;
        s.v = 0;
        s.last = 0;
        draw();
        return;
      }
      draw();
      s.raf = requestAnimationFrame(frame);
    },
    [draw],
  );
  const run = useCallback(() => {
    const s = sim.current;
    if (!s.raf) s.raf = requestAnimationFrame(frame);
  }, [frame]);
  const place = useCallback(
    (side: number) => {
      const s = sim.current;
      if (s.raf) cancelAnimationFrame(s.raf);
      Object.assign(s, { x: side, v: 0, side, raf: 0, last: 0 });
      ghost.current = null;
      draw();
    },
    [draw],
  );

  /* The circle starts on its side, before the first paint. */
  useLayoutEffect(() => {
    draw();
    const s = sim.current;
    return () => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [draw]);

  /* A new state from outside the hand (a click on the row, Space, a controlled value): a quick push takes the circle
     over its centre, as a finger would, and the spring throws it the rest of the way. Under reduced motion it is simply
     there. */
  useEffect(() => {
    const s = sim.current;
    const side = on ? 1 : 0;
    if (s.side === side) return;
    if (still.current) return place(side);
    const rel = s.side ? 1 - s.x : s.x;
    ghost.current = { t0: s.time, q0: fingerFor(Math.max(0, rel)), speed: FLICK.carry };
    run();
  }, [on, place, run]);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    const s = sim.current;
    const box = e.currentTarget;
    const scale = box.getBoundingClientRect().width / (box.offsetWidth || 1) || 1;
    box.setPointerCapture(e.pointerId);
    ghost.current = null;
    const rel = s.side ? 1 - s.x : s.x;
    const p = s.side ? 1 - fingerFor(rel) : fingerFor(rel);
    hand.current = { id: e.pointerId, anchorX: e.clientX, anchorP: p, lastX: e.clientX, startX: e.clientX, travelPx: TRAVEL * scale, samples: [[e.timeStamp, e.clientX]], moved: false, flying: 0 };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    h.lastX = e.clientX;
    h.samples.push([e.timeStamp, e.clientX]);
    while (h.samples.length > 2 && e.timeStamp - h.samples[0]![0] > 100) h.samples.shift();
    if (!h.moved && Math.abs(e.clientX - h.startX) <= SLOP) return;
    h.moved = true;
    if (still.current) {
      /* Reduced motion: no follow, the side the finger is over. */
      const s = sim.current;
      const over = (e.clientX - h.anchorX) / h.travelPx + h.anchorP > 0.5 ? 1 : 0;
      if (over !== s.side) {
        place(over);
        set.current?.(over === 1);
      }
      return;
    }
    run();
  };
  const onPointerEnd = (e: PointerEvent<HTMLButtonElement>) => {
    const h = hand.current;
    if (!h || h.id !== e.pointerId) return;
    hand.current = null;
    /* A press that never moved is a tap: the click that follows flips it, as a key does. */
    if (!h.moved) return;
    dropped.current = e.timeStamp;
    if (e.type === "pointercancel" || h.flying || still.current) return run();
    const s = sim.current;
    const [t0, x0] = h.samples[0]!;
    const speed = e.timeStamp > t0 + 8 ? ((h.lastX - x0) / h.travelPx / (e.timeStamp - t0)) * 1000 : 0;
    const toward = s.side ? -speed : speed;
    const rel = s.side ? 1 - s.x : s.x;
    if (toward > FLICK.least && rel + toward * FLICK.ahead >= 0.5) ghost.current = { t0: s.time, q0: fingerFor(Math.max(0, rel)), speed: Math.max(FLICK.carry, toward) };
    run();
  };
  /* The click after a drag must not flip it again: the drag already chose. */
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (dropped.current >= 0 && e.timeStamp - dropped.current < 500) e.preventDefault();
    dropped.current = -1;
  };

  const ref = (node: HTMLButtonElement | null) => {
    el.current = node;
    setRef(outerRef, node);
  };

  return (
    <SwitchPrimitive.Root
      {...rest}
      ref={ref}
      checked={checked}
      onCheckedChange={onCheckedChange}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClick={onClick}
      data-body="flat"
      className={"group/pill " + pill + className}
    >
      <span aria-hidden="true" className={inkBase + ink[tone]} />
      <SwitchPrimitive.Thumb className={cap + (on && !disabled ? " bg-surface-1 forced-colors:bg-[Canvas]" : " bg-line-control forced-colors:bg-[CanvasText]")} />
    </SwitchPrimitive.Root>
  );
}

/** Hands an element to a ref the caller passed, of either kind. */
function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}
