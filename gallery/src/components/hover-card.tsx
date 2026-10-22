/**
 * HoverCard: a preview of what a link points at, shown while the pointer rests on it or keyboard focus is on it
 * (components.md, "Hover card"). A person's card behind their name, a project's status behind its link, a commit
 * behind its hash. HoverCard, HoverCardTrigger and HoverCardContent, as shadcn names them.
 *
 * - It only previews. The trigger is a real link or button that leads to the same thing, so a touch screen, which has
 *   no hover, loses nothing: a tap follows the link and the card never opens. Never put the only way to do something
 *   in a hover card.
 * - Opens after the pointer rests 500ms on the trigger (`openDelay`), and at once when keyboard focus lands on it.
 *   Closes 200ms after the pointer leaves both the trigger and the card (`closeDelay`), so the pointer can cross the gap
 *   to a link inside it, and at once on blur or Esc. Focus never moves into it.
 * - Surface: floating glass at the surface radius with the float shadow, 16px of padding, 256 or 320px wide. Solid
 *   (surface-2) when the trigger sits inside another glass surface, as the Popover is: glass never sits on glass.
 * - Motion: the Popover's, on the responsive tier. It grows from the trigger and travels a quarter of the travel token
 *   from the side it opens on, and leaves on the exit token. Under reduced motion it appears and goes.
 * - Built on Radix Popover's positioning (collision flipping, the transform origin), without its dialog role or its
 *   focus moves: the card is supplementary, and what it says must also be reachable by following the trigger.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import * as RadixPopover from "@radix-ui/react-popover";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";

type Side = "top" | "right" | "bottom" | "left";

type Ctx = {
  open: boolean;
  /** Open after the delay (true) or close after the delay (false). */
  later: (next: boolean) => void;
  /** Open or close now. */
  now: (next: boolean) => void;
  /** Keep it as it is: the pointer came back. */
  hold: () => void;
  anchor: RefObject<HTMLElement | null>;
};

const HoverCardContext = createContext<Ctx | null>(null);

export type HoverCardProps = {
  /** Whether it is open. Pair it with onOpenChange. Leave it out and the card keeps its own state. */
  open?: boolean;
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** How long the pointer rests on the trigger before it opens, in ms. Keyboard focus opens it at once. */
  openDelay?: number;
  /** How long after the pointer leaves the trigger and the card before it closes, in ms. Room to cross the gap. */
  closeDelay?: number;
  /** A HoverCardTrigger and a HoverCardContent. */
  children: ReactNode;
};

/** The root: holds the open state and the timers. Put a HoverCardTrigger and a HoverCardContent inside it. */
export function HoverCard({ open: openProp, onOpenChange, openDelay = 500, closeDelay = 200, children }: HoverCardProps) {
  const [inner, setInner] = useState(false);
  const open = openProp ?? inner;
  const timer = useRef(0);
  const anchor = useRef<HTMLElement | null>(null);

  const now = useCallback(
    (next: boolean) => {
      window.clearTimeout(timer.current);
      setInner(next);
      if (next !== open) onOpenChange?.(next);
    },
    [open, onOpenChange],
  );
  const later = useCallback(
    (next: boolean) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => now(next), next ? openDelay : closeDelay);
    },
    [now, openDelay, closeDelay],
  );
  const hold = useCallback(() => window.clearTimeout(timer.current), []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <HoverCardContext value={{ open, later, now, hold, anchor }}>
      <RadixPopover.Root open={open} onOpenChange={now} modal={false}>
        {children}
      </RadixPopover.Root>
    </HoverCardContext>
  );
}

export type HoverCardTriggerProps = {
  /** One element: the link or button that leads to what the card previews. It keeps its own look and behavior. */
  children: ReactElement;
};

/** Wraps the link the card previews. The pointer resting on it, or keyboard focus, opens the card; a touch never does. */
export function HoverCardTrigger({ children }: HoverCardTriggerProps) {
  const ctx = useContext(HoverCardContext);
  if (!ctx) throw new Error("HoverCardTrigger must sit inside a HoverCard.");
  const { later, now, anchor } = ctx;
  return (
    <RadixPopover.Anchor
      asChild
      ref={anchor as Ref<HTMLDivElement>}
      onPointerEnter={(e: ReactPointerEvent) => {
        if (e.pointerType !== "touch") later(true);
      }}
      onPointerLeave={(e: ReactPointerEvent) => {
        if (e.pointerType !== "touch") later(false);
      }}
      onFocus={(e: FocusEvent<HTMLElement>) => {
        /* Keyboard focus only: a tap focuses too, and must not open it. */
        if (e.currentTarget.matches(":focus-visible")) now(true);
      }}
      onBlur={() => now(false)}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === "Escape") now(false);
      }}
    >
      {children}
    </RadixPopover.Anchor>
  );
}

const WIDTH = { sm: "w-64", md: "w-80" } as const;
/** What a card must not be glass over: any glass surface, and any popover. */
const FLOATING = ".litt-glass, [data-popover-surface]";

export type HoverCardContentProps = {
  /** The side of the trigger it opens on first. With no room there it flips. */
  side?: Side;
  /** Which edge of the trigger it lines up with. */
  align?: "start" | "center" | "end";
  /** Gap between the trigger and the card, in px. */
  sideOffset?: number;
  /** sm is 256px, md is 320px. It never grows past the room on screen. */
  size?: "sm" | "md";
  /** Draw a solid surface instead of glass. Left out, it is solid only when the trigger sits inside a glass surface. */
  solid?: boolean;
  /** The preview: a name and a line, an avatar, a status, a link or two. */
  children: ReactNode;
};

/** The card. Render it inside a HoverCard, next to the HoverCardTrigger. */
export function HoverCardContent({ side = "bottom", align = "start", sideOffset = 8, size = "sm", solid, children }: HoverCardContentProps) {
  const ctx = useContext(HoverCardContext);
  if (!ctx) throw new Error("HoverCardContent must sit inside a HoverCard.");
  return (
    <RadixPopover.Portal forceMount>
      <AnimatePresence>
        {ctx.open && (
          <Surface key="card" ctx={ctx} side={side} align={align} sideOffset={sideOffset} size={size} solid={solid}>
            {children}
          </Surface>
        )}
      </AnimatePresence>
    </RadixPopover.Portal>
  );
}

function Surface({
  ctx,
  side,
  align,
  sideOffset,
  size,
  solid,
  children,
}: Required<Omit<HoverCardContentProps, "solid">> & { ctx: Ctx; solid?: boolean }) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  const latest = useRef(enter);
  latest.current = enter;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const el = useRef<HTMLDivElement | null>(null);
  /* null until Radix has placed the card; then the side it really opened on. */
  const [placed, setPlaced] = useState<Side | null>(null);
  const [overFloating, setOverFloating] = useState(false);

  useLayoutEffect(() => {
    setOverFloating(Boolean(ctx.anchor.current?.closest(FLOATING)));
  }, [ctx.anchor]);

  /* A quarter of the travel, starting nearer the trigger than the resting place. */
  const offset = (s: Side) => {
    const d = travel / 4;
    return { x: s === "left" ? d : s === "right" ? -d : 0, y: s === "top" ? d : s === "bottom" ? -d : 0 };
  };
  const onPlaced = () => {
    const s = (el.current?.dataset.side as Side | undefined) ?? "bottom";
    const o = offset(s);
    x.jump(o.x);
    y.jump(o.y);
    setPlaced(s);
  };
  useEffect(() => {
    if (!placed) return;
    animate(x, 0, latest.current);
    animate(y, 0, latest.current);
  }, [placed, x, y]);
  const out = offset(placed ?? side);

  /* Radix forwards onPlaced to its popper, but the popover types omit it. It is a preview, not a dialog: no role, and
     focus never moves into it or back. */
  const extra = { onPlaced, role: undefined } as Record<string, unknown>;
  const flat = solid ?? overFloating;

  return (
    <RadixPopover.Content
      forceMount
      asChild
      side={side}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={8}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      onFocusOutside={(e) => {
        /* Focus on the trigger is what opened it: the card mounts during that same focus event, which then reaches
           Radix's outside-focus listener. It is not a reason to close. */
        if (ctx.anchor.current?.contains(e.target as Node)) e.preventDefault();
      }}
      {...extra}
    >
      <motion.div
        ref={el}
        data-popover-surface=""
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") ctx.hold();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "touch") ctx.later(false);
        }}
        className={
          "relative z-50 max-w-(--radix-popover-content-available-width) rounded-surface p-4 outline-none " +
          "origin-(--radix-popover-content-transform-origin) data-[state=closed]:pointer-events-none " +
          WIDTH[size] +
          (flat ? " bg-surface-2 shadow-float" : " litt-glass")
        }
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: placed ? 1 : 0, scale: placed ? 1 : 0.98, transition: enter }}
        exit={{ opacity: 0, scale: 0.98, x: out.x, y: out.y, transition: exit }}
        style={{ x, y }}
      >
        {children}
      </motion.div>
    </RadixPopover.Content>
  );
}
