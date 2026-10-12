/**
 * Popover: a floating panel for content that needs more than a row. A small
 * form, a share link, a filter set, a detail card. Rows that run a command
 * belong to Menu.
 *
 * - Radix Popover is the accessibility layer (role="dialog", focus into the
 *   panel and back to the trigger, Esc, outside click, aria-expanded on the
 *   trigger). Everything visual is written here.
 * - Surface: floating glass (litt-glass, default float shadow), rounded-surface,
 *   p-1 (4px) like Menu. The content sits in a 12px pad inside that inset, so a
 *   form field starts 16px from the edge, like a Menu row's label. Turn the pad
 *   off (padded={false}) for rows that bring their own 44px height and 12px side
 *   padding: they then sit concentric in the 4px inset, exactly as Menu rows do.
 * - Glass never sits on glass. When the trigger sits inside a glass surface (a
 *   dialog, the header, a toast) or inside another popover, the panel is solid
 *   (bg-surface-2 + shadow-float), as Menu's submenus are. Found from the DOM
 *   when the panel opens, so nothing has to be wired by hand. `solid` forces it.
 * - Motion, responsive tier. The panel grows from the trigger: Radix gives
 *   --radix-popover-content-transform-origin, and it travels a quarter of the
 *   travel token from the side it actually opens on (after collision flipping).
 *   We wait for Radix to place it, then read data-side. Exit uses useExit.
 *   AnimatePresence + forceMount + controlled open lets the exit play.
 * - Focus: Radix moves it into the panel on open. It lands on the control marked
 *   data-autofocus, else the first focusable control, else the panel itself.
 *   Closing returns it to the trigger. Opened with the pointer, a button gets no
 *   ring (:focus-visible), a text field always does.
 * - Sizes sit on the 8px grid: 256, 320, 384. The panel never grows past the room
 *   on screen, and scrolls inside when it is taller than the room.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as RadixPopover from "@radix-ui/react-popover";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";

type Side = "top" | "right" | "bottom" | "left";

const OpenContext = createContext(false);

export type PopoverProps = {
  /** Whether the popover is open. Pair it with onOpenChange. Leave it out and the popover keeps its own state. */
  open?: boolean;
  /** Start open when you do not control it. */
  defaultOpen?: boolean;
  /** Called with the next state when Esc, a click outside, PopoverClose or PopoverTrigger asks to change it. Ignore a false to keep the popover open, for example while a save runs. */
  onOpenChange?: (open: boolean) => void;
  /** Make the rest of the page inert while it is open: focus is trapped, outside clicks only close it, and screen readers skip the page. */
  modal?: boolean;
  /** The trigger and the content: a PopoverTrigger and a PopoverContent. */
  children: ReactNode;
};

/** The root. It holds the open state and shares it with PopoverTrigger and PopoverContent, which go inside it. */
export function Popover({ open: openProp, defaultOpen = false, onOpenChange, modal = false, children }: PopoverProps) {
  const [inner, setInner] = useState(defaultOpen);
  const open = openProp ?? inner;
  const change = useCallback(
    (next: boolean) => {
      setInner(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  return (
    <OpenContext.Provider value={open}>
      <RadixPopover.Root open={open} onOpenChange={change} modal={modal}>
        {children}
      </RadixPopover.Root>
    </OpenContext.Provider>
  );
}

/** Opens and closes the popover. Wrap your own Button with asChild, so it keeps its look and gets aria-expanded and the toggle. */
export const PopoverTrigger = RadixPopover.Trigger;
/** Closes the popover. Wrap a Cancel or Done button with asChild. */
export const PopoverClose = RadixPopover.Close;

export type PopoverContentProps = {
  /** The popover's accessible name. It is a dialog, and a dialog needs a name, so this is required. */
  label: string;
  /** The side of the trigger it opens on first. With no room there it flips to the opposite side, and the entrance follows. */
  side?: Side;
  /** Which edge of the trigger it lines up with. */
  align?: "start" | "center" | "end";
  /** Gap between the trigger and the popover, in px. */
  sideOffset?: number;
  /** Width on the 8px grid: sm is 256px, md is 320px, lg is 384px. It never grows past the room on screen. */
  size?: "sm" | "md" | "lg";
  /** Pad the content 12px inside the 4px inset, so it sits 16px from the edge. Turn it off for rows that bring their own 44px height and 12px side padding. */
  padded?: boolean;
  /** Draw a solid surface instead of glass. Left out, it is solid only when the trigger sits inside a glass surface or another popover. */
  solid?: boolean;
  /** Flip against this element instead of the viewport (a stage, a card). */
  collisionBoundary?: Element | null;
  /** The content: a form, a link and a button, a detail card, a set of options. */
  children: ReactNode;
};

const WIDTH = { sm: "w-64", md: "w-80", lg: "w-96" } as const;
/** What a popover must not be glass over: any glass surface, and any popover. */
const FLOATING = ".litt-glass, [data-popover-surface]";

/**
 * The panel. Render it inside a Popover, next to the PopoverTrigger.
 * Focus lands on the control marked data-autofocus, else the first focusable control, else the panel itself.
 */
export function PopoverContent({
  label,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  size = "md",
  padded = true,
  solid,
  collisionBoundary,
  children,
}: PopoverContentProps) {
  const open = useContext(OpenContext);
  return (
    <RadixPopover.Portal forceMount>
      <AnimatePresence>
        {open && (
          <Surface
            key="popover"
            label={label}
            side={side}
            align={align}
            sideOffset={sideOffset}
            size={size}
            padded={padded}
            solid={solid}
            collisionBoundary={collisionBoundary}
          >
            {children}
          </Surface>
        )}
      </AnimatePresence>
    </RadixPopover.Portal>
  );
}

/** The animated surface. */
function Surface({
  label,
  side,
  align,
  sideOffset,
  size,
  padded,
  solid,
  collisionBoundary,
  children,
}: Required<Pick<PopoverContentProps, "label" | "side" | "align" | "sideOffset" | "size" | "padded">> &
  Pick<PopoverContentProps, "solid" | "collisionBoundary" | "children">) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  const latest = useRef(enter);
  latest.current = enter;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const el = useRef<HTMLDivElement | null>(null);
  /* null until Radix has placed the panel; then the side it really opened on. */
  const [placed, setPlaced] = useState<Side | null>(null);
  /* Is the trigger inside another floating surface? Radix gives the trigger aria-controls = this
     panel's id while it is open, so find it from there, before the first paint. */
  const [overFloating, setOverFloating] = useState(false);

  useLayoutEffect(() => {
    const id = el.current?.id;
    const trigger = id ? document.querySelector(`[aria-controls="${CSS.escape(id)}"]`) : null;
    setOverFloating(Boolean(trigger?.closest(FLOATING)));
  }, []);

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

  /* Radix forwards onPlaced to its popper, but the popover types omit it. */
  const placedProp = { onPlaced } as Record<string, unknown>;

  const flat = solid ?? overFloating;
  const surface =
    "relative z-50 max-w-(--radix-popover-content-available-width) rounded-surface p-1 outline-none " +
    "origin-(--radix-popover-content-transform-origin) data-[state=closed]:pointer-events-none " +
    WIDTH[size] +
    (flat ? " bg-surface-2 shadow-float" : " litt-glass");

  return (
    <RadixPopover.Content
      forceMount
      asChild
      aria-label={label}
      side={side}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={8}
      collisionBoundary={collisionBoundary ?? undefined}
      onOpenAutoFocus={(e) => {
        const target = el.current?.querySelector<HTMLElement>("[data-autofocus]");
        if (!target) return;
        e.preventDefault();
        target.focus({ preventScroll: true });
      }}
      {...placedProp}
    >
      <motion.div
        ref={el}
        data-popover-surface=""
        className={surface}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: placed ? 1 : 0, scale: placed ? 1 : 0.98, transition: enter }}
        exit={{ opacity: 0, scale: 0.98, x: out.x, y: out.y, transition: exit }}
        style={{ x, y }}
      >
        <div
          className={
            "max-h-[calc(var(--radix-popover-content-available-height)-0.5rem)] overflow-y-auto overscroll-contain rounded-control" +
            (padded ? " p-3" : "")
          }
        >
          {children}
        </div>
      </motion.div>
    </RadixPopover.Content>
  );
}
