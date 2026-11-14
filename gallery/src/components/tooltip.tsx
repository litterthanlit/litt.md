/**
 * Tooltip: a small label for an icon, a shortcut or a status.
 *
 * - Radix Tooltip is the accessibility layer (aria-describedby, Escape, hover
 *   intent, the skip window). Everything visual is ours.
 * - Flat: an ink pill with canvas text, no highlight.
 * - Look: a solid surface-3 chip with shadow-tooltip. It is too small for glass
 *   to read. rounded-control, text-small, 6px by 8px, 240px at most. A shortcut
 *   is the shared Kbd chip (kbd.tsx).
 * - Motion (responsive tier): it grows from the trigger. Opacity 0 to 1, scale
 *   the material's grow scale (useOverlayMotion, @/motion/deal; under Device it switches on in steps) to 1, and a nudge of travel/4 toward the trigger, from the side it
 *   really renders on (Radix data-side, read after collision flipping).
 *   transform-origin is Radix's trigger-side origin. The exit is useExit, a
 *   quiet fade, run by AnimatePresence on a force-mounted Radix portal.
 * - Only a cold open plays that entrance: hover after the 200ms delay, or the
 *   touch hold. A tooltip that opens inside the skip window, or on keyboard
 *   focus (the trigger is focused and :focus-visible as it opens), appears in
 *   place with no entrance, so sweeping across a toolbar or tabbing through it
 *   never waits on motion. That is decided once per opening and holds when a
 *   collision flip remounts the surface. Exits never change.
 * - Delays are interaction, not animation: 200ms of hover intent, then a 300ms
 *   window after one closes in which the next opens at once, without the delay
 *   and without the entrance. The window is shared by every tooltip under one
 *   TooltipProvider. Keyboard focus opens instantly (Radix does this on its own;
 *   a click never opens one).
 * - Touch (foundations.md section 6): Radix never opens on touch, and a tap is
 *   the button's own action, so a tap no longer shows a label. A press and hold
 *   of 500ms does (an interaction delay like the 200ms above, not a motion
 *   token). The hold is cancelled by lifting early, by drifting past a small
 *   slop, or by the browser taking the touch to scroll. The click a hold may
 *   leave behind is swallowed once, so reading a label never also runs the
 *   action. The next touch anywhere closes it, and a touch on the trigger
 *   still does what the trigger does. The native long-press menu and text
 *   selection are off on the trigger on coarse pointers. Shortcut chips are
 *   not rendered on coarse pointers.
 * - Both signals come from useDevice (coarse), so <DeviceProvider mode="phone">
 *   previews it with a mouse: there the hold works for any pointer and hover
 *   opens nothing, as on a finger device. A touch on a pointer-fine device
 *   (a touch laptop) holds too.
 */
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "motion/react";
import { useDevice, useExit, useOverlayRoot, useTransition, useTravel } from "@/motion";
import { useOverlayMotion } from "@/motion/deal";
import { Kbd } from "./kbd";

export type TooltipSide = "top" | "right" | "bottom" | "left";

const OPEN_DELAY = 200; // ms of hover intent before the first tooltip opens (interaction delay, not animation)
const SKIP_WINDOW = 300; // ms after one closes during which the next opens at once (interaction delay)
const HOLD_DELAY = 500; // ms of press and hold before a tooltip opens on touch (interaction delay, not animation)
const HOLD_SLOP = 10; // px a finger may drift during the hold before it counts as a scroll or a drag
const CLICK_WINDOW = 500; // ms after a hold ends in which the click it may leave behind is swallowed

/* When a tooltip under this provider last closed. The next one to open inside SKIP_WINDOW of it opens with no entrance. */
type Clock = { closedAt: number };
const SharedClock = createContext<Clock | null>(null);

/**
 * Mount once near the root so every tooltip shares the skip window. Without it each
 * Tooltip adds its own provider, so tooltips still work but do not share that window.
 */
export function TooltipProvider({
  children,
}: {
  /** Your app, or the part of it that holds tooltips. */
  children: ReactNode;
}) {
  const [clock] = useState<Clock>(() => ({ closedAt: -Infinity }));
  return (
    <SharedClock.Provider value={clock}>
      <TooltipPrimitive.Provider delayDuration={OPEN_DELAY} skipDelayDuration={SKIP_WINDOW}>
        {children}
      </TooltipPrimitive.Provider>
    </SharedClock.Provider>
  );
}

export type TooltipProps = {
  /** The label. Keep it short; long text wraps at 240px. On touch it only shows on a press and hold, so the label that matters must also be the trigger's aria-label or visible text. */
  content: ReactNode;
  /** A real keyboard shortcut, shown as a kbd chip. It is not shown on touch screens. */
  shortcut?: string;
  /** Which side of the trigger it opens on. With no room there it flips to the other side, and the entrance follows. */
  side?: TooltipSide;
  /** How it lines up along that side: with the start, the center or the end of the trigger. */
  align?: "start" | "center" | "end";
  /** Controlled open state. Leave undefined to let hover and focus decide. */
  open?: boolean;
  /** Whether it starts open when you do not control it. Hover and focus decide after that. */
  defaultOpen?: boolean;
  /** Called with true or false each time it opens or closes. Pair it with open to control it. */
  onOpenChange?: (open: boolean) => void;
  /** The trigger: one focusable element. */
  children: ReactElement;
};

const isSide = (v: string | null): v is TooltipSide => v === "top" || v === "right" || v === "bottom" || v === "left";

/** A short label for the one element inside it. It opens after a hover delay, at once on focus, or on a press and hold on touch. */
export function Tooltip({
  content,
  shortcut,
  side = "top",
  align = "center",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: TooltipProps) {
  const shared = useContext(SharedClock);
  const [own] = useState<Clock>(() => ({ closedAt: -Infinity }));
  const clock = shared ?? own;
  const overlayRoot = useOverlayRoot();
  const { coarse } = useDevice();
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const triggerRef = useRef<HTMLButtonElement>(null);

  /* Decided as it opens and kept for the whole opening, so a later render (a flip, a new label) cannot replay the entrance. */
  const [opening, setOpening] = useState({ open, instant: false });
  if (opening.open !== open) {
    const trigger = triggerRef.current;
    const focused = trigger !== null && trigger === document.activeElement && trigger.matches(":focus-visible");
    setOpening({ open, instant: open && (focused || performance.now() - clock.closedAt < SKIP_WINDOW) });
  }
  useLayoutEffect(() => {
    if (!open) return;
    return () => {
      clock.closedAt = performance.now();
    };
  }, [open, clock]);

  const change = (next: boolean) => {
    setInner(next);
    onOpenChange?.(next);
  };
  const latest = useRef(change);
  latest.current = change;

  /* Press and hold. `pending` is the timer and where the finger went down. `held` is true from the moment the hold
     opens the tooltip until that press ends; `swallowUntil` then covers the click the release may cause. */
  const pending = useRef<{ timer: number; x: number; y: number } | null>(null);
  const held = useRef(false);
  const swallowUntil = useRef(0);
  const cancelHold = () => {
    if (pending.current) window.clearTimeout(pending.current.timer);
    pending.current = null;
  };
  useEffect(() => cancelHold, []);

  /* The next touch anywhere closes it, at once: Radix waits for the click of an outside touch, which a scroll never makes. */
  useEffect(() => {
    if (!open) return;
    const onTouch = (e: PointerEvent) => {
      if (e.pointerType === "touch") latest.current(false);
    };
    document.addEventListener("pointerdown", onTouch, true);
    return () => document.removeEventListener("pointerdown", onTouch, true);
  }, [open]);

  const tree = (
    <TooltipPrimitive.Root open={open} onOpenChange={change}>
      <TooltipPrimitive.Trigger
        ref={triggerRef}
        asChild
        className="pointer-coarse:select-none pointer-coarse:[-webkit-touch-callout:none]"
        onPointerDown={(e) => {
          held.current = false;
          swallowUntil.current = 0;
          cancelHold();
          if ((e.pointerType !== "touch" && !coarse) || !e.isPrimary) return;
          pending.current = {
            x: e.clientX,
            y: e.clientY,
            timer: window.setTimeout(() => {
              pending.current = null;
              held.current = true;
              latest.current(true);
            }, HOLD_DELAY),
          };
        }}
        onPointerMove={(e) => {
          const at = pending.current;
          if (at && Math.hypot(e.clientX - at.x, e.clientY - at.y) > HOLD_SLOP) cancelHold();
          /* A finger has no hover. This also keeps a mouse from opening it while a phone is previewed. */
          if (coarse && e.pointerType !== "touch") e.preventDefault();
        }}
        onPointerUp={() => {
          cancelHold();
          if (held.current) swallowUntil.current = performance.now() + CLICK_WINDOW;
          held.current = false;
        }}
        onPointerCancel={() => {
          cancelHold();
          held.current = false;
        }}
        onContextMenu={(e) => {
          /* The long press must not also raise the browser's own menu. */
          if (pending.current || held.current) e.preventDefault();
        }}
        onClickCapture={(e) => {
          /* Reading a label is not pressing the button. Stopping it here also keeps Radix's click from closing the label. */
          if (performance.now() < swallowUntil.current) {
            swallowUntil.current = 0;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {children}
      </TooltipPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <TooltipPrimitive.Portal container={overlayRoot} key="tooltip" forceMount>
            <TooltipSurface side={side} align={align} content={content} shortcut={coarse ? undefined : shortcut} instant={opening.instant} />
          </TooltipPrimitive.Portal>
        )}
      </AnimatePresence>
    </TooltipPrimitive.Root>
  );

  return shared ? tree : <TooltipProvider>{tree}</TooltipProvider>;
}

function TooltipSurface({
  side: requested,
  align,
  content,
  shortcut,
  instant,
}: Pick<TooltipProps, "content" | "shortcut" | "align"> & { side: TooltipSide; instant: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<TooltipSide>(requested);
  /* The material's motion language (@/motion/deal): it grows from om.grow, and under Device it switches on and off
     in steps where it stands, with no slide. */
  const om = useOverlayMotion();
  const springIn = useTransition("responsive");
  const springOut = useExit("responsive");
  const enter = om.switches ? om.switchIn : springIn;
  const exit = om.switches ? om.switchOut : springOut;
  const fullTravel = useTravel();
  const travel = om.slides ? fullTravel : 0;

  /* Radix flips the tooltip when it would collide with the viewport. It writes
     the side it really renders on to data-side, a beat after mount. Follow it,
     and remount the surface (key) so the entrance starts on the right side. */
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const read = () => {
      const s = host.getAttribute("data-side");
      if (isSide(s)) setSide(s);
    };
    read();
    const watch = new MutationObserver(read);
    watch.observe(host, { attributes: true, attributeFilter: ["data-side"] });
    return () => watch.disconnect();
  }, []);

  /* Start a quarter of the travel nearer the trigger, then move away from it. */
  const d = travel / 4;
  const toward = side === "top" ? { y: d } : side === "bottom" ? { y: -d } : side === "left" ? { x: d } : { x: -d };

  return (
    <TooltipPrimitive.Content
      ref={hostRef}
      side={requested}
      align={align}
      sideOffset={8}
      collisionPadding={8}
      className="z-50 data-[state=closed]:pointer-events-none"
    >
      <motion.div
        key={side}
        className="flex max-w-60 origin-(--radix-tooltip-content-transform-origin) items-center gap-3 rounded-control bg-surface-3 px-2 py-1.5 text-small text-fg shadow-tooltip inset-shadow-highlight in-[[data-material=flat]]:bg-fg in-[[data-material=flat]]:text-canvas in-[[data-material=flat]]:inset-shadow-none in-[[data-material=flat]]:px-3 in-[[data-material=flat]]:[&_kbd]:bg-transparent in-[[data-material=flat]]:[&_kbd]:text-canvas in-[[data-material=flat]]:[&_kbd]:opacity-70 in-[[data-material=flat]]:[&_kbd]:shadow-none"
        initial={instant ? false : { opacity: 0, scale: om.grow, ...toward }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0, transition: enter }}
        exit={{ opacity: 0, scale: om.grow, transition: exit }}
      >
        <span className="min-w-0 text-pretty">{content}</span>
        {shortcut && <Kbd>{shortcut}</Kbd>}
      </motion.div>
    </TooltipPrimitive.Content>
  );
}
