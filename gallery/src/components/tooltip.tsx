/**
 * Tooltip: a small label for an icon, a shortcut or a status.
 *
 * - Radix Tooltip is the accessibility layer (aria-describedby, Escape, hover
 *   intent, the skip window). Everything visual is ours.
 * - Look: a solid surface-3 chip with shadow-tooltip. It is too small for glass
 *   to read. rounded-control, text-small, 6px by 8px, 240px at most. A shortcut
 *   is the shared Kbd chip (kbd.tsx).
 * - Motion (responsive tier): it grows from the trigger. Opacity 0 to 1, scale
 *   0.98 to 1, and a nudge of travel/4 toward the trigger, from the side it
 *   really renders on (Radix data-side, read after collision flipping).
 *   transform-origin is Radix's trigger-side origin. The exit is useExit, a
 *   quiet fade, run by AnimatePresence on a force-mounted Radix portal.
 * - Delays are interaction, not animation: 200ms of hover intent, then a 300ms
 *   window in which the next tooltip opens at once. Keyboard focus opens
 *   instantly (Radix does this on its own; a click never opens one).
 * - Touch: Radix never opens on touch. Anything revealed on hover must also be
 *   reachable on touch, so a tap on the trigger shows the tooltip until the
 *   next tap elsewhere.
 */
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";
import { Kbd } from "./kbd";

export type TooltipSide = "top" | "right" | "bottom" | "left";

const OPEN_DELAY = 200; // ms of hover intent before the first tooltip opens (interaction delay, not animation)
const SKIP_WINDOW = 300; // ms after one closes during which the next opens at once (interaction delay)

const HasProvider = createContext(false);

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
  return (
    <HasProvider.Provider value>
      <TooltipPrimitive.Provider delayDuration={OPEN_DELAY} skipDelayDuration={SKIP_WINDOW}>
        {children}
      </TooltipPrimitive.Provider>
    </HasProvider.Provider>
  );
}

export type TooltipProps = {
  /** The label. Keep it short; long text wraps at 240px. */
  content: ReactNode;
  /** A real keyboard shortcut, shown as a mono kbd chip. */
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

/** A short label for the one element inside it. It opens after a hover delay, or at once on focus. */
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
  const hasProvider = useContext(HasProvider);
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const ignoreClose = useRef(false);

  const change = (next: boolean) => {
    // A touch tap opens on pointer up; the click that follows would close it again.
    if (!next && ignoreClose.current) {
      ignoreClose.current = false;
      return;
    }
    setInner(next);
    onOpenChange?.(next);
  };

  const tree = (
    <TooltipPrimitive.Root open={open} onOpenChange={change}>
      <TooltipPrimitive.Trigger
        asChild
        onPointerUp={(e) => {
          if (e.pointerType !== "touch") return;
          ignoreClose.current = true;
          setTimeout(() => (ignoreClose.current = false), 600);
          change(true);
        }}
      >
        {children}
      </TooltipPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <TooltipPrimitive.Portal key="tooltip" forceMount>
            <TooltipSurface side={side} align={align} content={content} shortcut={shortcut} />
          </TooltipPrimitive.Portal>
        )}
      </AnimatePresence>
    </TooltipPrimitive.Root>
  );

  return hasProvider ? tree : <TooltipProvider>{tree}</TooltipProvider>;
}

function TooltipSurface({
  side: requested,
  align,
  content,
  shortcut,
}: Pick<TooltipProps, "content" | "shortcut" | "align"> & { side: TooltipSide }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<TooltipSide>(requested);
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();

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
        className="flex max-w-60 origin-(--radix-tooltip-content-transform-origin) items-center gap-3 rounded-control bg-surface-3 px-2 py-1.5 text-small text-fg shadow-tooltip inset-shadow-highlight"
        initial={{ opacity: 0, scale: 0.98, ...toward }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0, transition: enter }}
        exit={{ opacity: 0, scale: 0.98, transition: exit }}
      >
        <span className="min-w-0 text-pretty">{content}</span>
        {shortcut && <Kbd>{shortcut}</Kbd>}
      </motion.div>
    </TooltipPrimitive.Content>
  );
}
