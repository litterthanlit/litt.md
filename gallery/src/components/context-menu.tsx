/**
 * Context menu: the Menu at the pointer, on @radix-ui/react-context-menu (roles, focus, typeahead, submenus,
 * dismissal) with Menu's own panel and rows.
 *
 * - Look and rows: the Menu's exactly. It renders MenuPanel from menu.tsx with ContextMenu's Radix parts, so
 *   MenuItem, MenuSub, MenuCheckboxItem, MenuRadioGroup, MenuRadioItem, MenuLabel, MenuGroup and MenuSeparator
 *   work in it unchanged: glass at the surface radius with the float shadow, 44px rows, one gliding highlight,
 *   checks in a fixed 16px cell, solid submenus, focus by modality, and on a phone a submenu that replaces the
 *   list in place with a Back row first.
 * - Open. A right-click opens it at the pointer. Shift+F10 or the menu key opens it on the focused element inside
 *   the target, at that element's bottom-left corner, with the first row lit and ringed, as any keyboard open is.
 *   On touch a press and hold of 500ms (the tooltip's hold: an interaction delay, not a motion token) opens it at
 *   the finger. Lifting early, drifting past a small slop or scrolling cancels the hold, and the click a hold may
 *   leave behind is swallowed, so the target's own action does not also run. The target turns off the browser's
 *   callout, and its text selection on coarse pointers.
 * - Why the target does not take all of Radix's trigger: Radix holds for 700ms, and React bubbles events out of
 *   portals rendered from inside the target (a row's "⋯" Menu, a Dialog) into its handlers. So the target takes
 *   only Radix's open handler (and its state and style), and this file decides when to call it: for events whose
 *   element really sits inside the target, and for the hold and the keys by sending a contextmenu event at the
 *   point it should open from. Nested targets work: the innermost one opens.
 * - While it is open the browser's own menu is held back, so a second contextmenu event (the menu key sends one
 *   on keyup on Windows) or a right-click on the panel never stacks a native menu on top of it.
 * - Motion, responsive tier, owned by MenuPanel: it grows from the pointer's corner (Radix's transform origin),
 *   travels a quarter of the travel token from the side it opens on after collision flipping, and leaves on the
 *   exit token. The hooks zero all of it under reduced motion.
 *
 * On a phone (foundations.md section 6) it stays anchored at the finger, like the Menu, and a submenu replaces
 * the list in place. Every action in it must also be reachable another way (a "⋯" Menu on the row, a toolbar, a
 * shortcut): a context menu is a shortcut, and a touch or keyboard user may never find it.
 */
import {
  cloneElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { AnimatePresence } from "motion/react";
import { useDevice } from "@/motion";
import { MenuPanel, type MenuParts } from "./menu";

const HOLD_DELAY = 500; // ms of press and hold before it opens on touch: the tooltip's hold (an interaction delay, not animation)
const HOLD_SLOP = 10; // px a finger may drift during the hold before it counts as a scroll or a drag
const CLICK_WINDOW = 500; // ms after a hold ends in which the click it may leave behind is swallowed

const CONTEXT_PARTS: MenuParts = {
  Item: ContextMenuPrimitive.Item,
  CheckboxItem: ContextMenuPrimitive.CheckboxItem,
  ItemIndicator: ContextMenuPrimitive.ItemIndicator,
  RadioGroup: ContextMenuPrimitive.RadioGroup,
  RadioItem: ContextMenuPrimitive.RadioItem,
  Label: ContextMenuPrimitive.Label,
  Group: ContextMenuPrimitive.Group,
  Separator: ContextMenuPrimitive.Separator,
  Sub: ContextMenuPrimitive.Sub,
  SubTrigger: ContextMenuPrimitive.SubTrigger,
  SubContent: ContextMenuPrimitive.SubContent,
  Portal: ContextMenuPrimitive.Portal,
  /* It takes no side, align or sideOffset: it opens to the right of the pointer, and flips. */
  Content: ContextMenuPrimitive.Content as MenuParts["Content"],
  origin: "origin-(--radix-context-menu-content-transform-origin)",
  fit: "max-h-(--radix-context-menu-content-available-height)",
};

/** The handlers and looks the target element may already have. Each one still runs, before the menu's own. */
type OwnProps = {
  className?: string;
  style?: CSSProperties;
  onContextMenu?: (e: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
  onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
  onPointerMove?: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp?: (e: PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (e: PointerEvent<HTMLElement>) => void;
  onClickCapture?: (e: MouseEvent<HTMLElement>) => void;
};

type TargetProps = {
  element: ReactElement;
  coarse: boolean;
  /* What Radix's trigger hands its child through asChild. Its touch handlers (the 700ms hold) arrive too, and are dropped. */
  onContextMenu?: (e: MouseEvent<HTMLElement>) => void;
  style?: CSSProperties;
  "data-state"?: string;
};

/** An event from an element that really sits inside the target, not one React bubbled out of a portal. */
const inside = (e: { currentTarget: EventTarget; target: EventTarget }) => (e.currentTarget as Node).contains(e.target as Node);

/** Open at a point through the path a right-click takes, so Radix puts its anchor there. */
const openAt = (el: Element, x: number, y: number) =>
  el.dispatchEvent(new window.MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 }));

/** The target element, with the menu's ways in added to its own handlers. */
function Target({ element, coarse, onContextMenu: open, style, "data-state": state }: TargetProps) {
  const own = element.props as OwnProps;
  /* `pending` is the hold's timer and where it started. `held` is true from the moment a hold opens the menu until
     that press ends; `swallowUntil` then covers the click the release may cause. */
  const pending = useRef<{ timer: number; x: number; y: number } | null>(null);
  const held = useRef(false);
  const swallowUntil = useRef(0);
  const cancelHold = () => {
    if (pending.current) window.clearTimeout(pending.current.timer);
    pending.current = null;
  };
  useEffect(() => cancelHold, []);

  return cloneElement(element as ReactElement<OwnProps & { "data-state"?: string }>, {
    "data-state": state,
    style: { ...style, ...own.style },
    className: [own.className, "pointer-coarse:select-none pointer-coarse:[-webkit-touch-callout:none]"].filter(Boolean).join(" "),
    onContextMenu: (e: MouseEvent<HTMLElement>) => {
      own.onContextMenu?.(e);
      /* Handled already: by the element, by a target nested in this one, or held back while a menu is open. */
      if (e.defaultPrevented || !inside(e)) return;
      if (e.nativeEvent.isTrusted && pending.current) {
        /* The browser's own long press got there first: that open stands for the hold. */
        cancelHold();
        held.current = true;
      }
      open?.(e);
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      own.onKeyDown?.(e);
      if (e.defaultPrevented || e.repeat || !inside(e) || !open) return;
      const menuKey = e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey);
      if (!menuKey) return;
      /* Ours, so the browser does not open its own menu as well. */
      e.preventDefault();
      const el = e.target as Element;
      const r = el.getBoundingClientRect();
      openAt(el, r.left, r.bottom);
    },
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      own.onPointerDown?.(e);
      cancelHold();
      held.current = false;
      swallowUntil.current = 0;
      if (!inside(e) || !e.isPrimary || e.button !== 0) return;
      /* A mouse right-clicks. A finger or a pen holds, and so does a mouse while a phone is previewed. */
      if (e.pointerType === "mouse" && !coarse) return;
      const el = e.target as Element;
      const x = e.clientX;
      const y = e.clientY;
      pending.current = {
        x,
        y,
        timer: window.setTimeout(() => {
          pending.current = null;
          held.current = true;
          openAt(el, x, y);
        }, HOLD_DELAY),
      };
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      own.onPointerMove?.(e);
      const at = pending.current;
      if (at && Math.hypot(e.clientX - at.x, e.clientY - at.y) > HOLD_SLOP) cancelHold();
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      own.onPointerUp?.(e);
      cancelHold();
      if (held.current) swallowUntil.current = performance.now() + CLICK_WINDOW;
      held.current = false;
    },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => {
      own.onPointerCancel?.(e);
      cancelHold();
      held.current = false;
    },
    onClickCapture: (e: MouseEvent<HTMLElement>) => {
      own.onClickCapture?.(e);
      /* Opening the menu is not choosing the target. */
      if (performance.now() < swallowUntil.current) {
        swallowUntil.current = 0;
        e.preventDefault();
        e.stopPropagation();
      }
    },
  });
}

export type ContextMenuProps = {
  /** The target: one element, such as a list row, a card or a file grid, or a component that passes its props on to one. A right-click on it, a press and hold, or Shift+F10 on something focused inside it opens the menu. Put something focusable inside it, so the keys can reach it. */
  trigger: ReactElement;
  /** The menu's accessible name, for example "Founder landing actions". A target has no name to lend it, so it is required. */
  label: string;
  /** The text of the Back row that leaves a submenu on a phone, where a submenu replaces the list instead of flying out. Translate it with the rest of your labels. */
  backLabel?: string;
  /** The rows, the Menu's own: MenuItem, MenuSub, MenuCheckboxItem, MenuRadioGroup, MenuLabel, MenuGroup and MenuSeparator. Put every one of these actions somewhere else too. */
  children: ReactNode;
};

/** The Menu at the pointer. It wraps your target and the rows, and owns its open state, so there is no open prop. */
export function ContextMenu({ trigger, label, backLabel = "Back", children }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const { coarse } = useDevice();

  /* While it is open, the browser's own menu stays shut: no native menu stacks on top of this one. */
  useEffect(() => {
    if (!open) return;
    const hold = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", hold, true);
    return () => document.removeEventListener("contextmenu", hold, true);
  }, [open]);

  return (
    <ContextMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <ContextMenuPrimitive.Trigger asChild>
        <Target element={trigger} coarse={coarse} />
      </ContextMenuPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <ContextMenuPrimitive.Portal forceMount key="menu">
            <MenuPanel parts={CONTEXT_PARTS} label={label} backLabel={backLabel}>
              {children}
            </MenuPanel>
          </ContextMenuPrimitive.Portal>
        )}
      </AnimatePresence>
    </ContextMenuPrimitive.Root>
  );
}
