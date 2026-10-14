/**
 * Menu: a dropdown on @radix-ui/react-dropdown-menu (roles, focus, typeahead,
 * submenus) with everything visual written here.
 *
 * - Surface: floating glass (litt-glass, default float shadow), rounded-surface,
 *   p-1 (4px), min width 240. Rows are 44px and rounded-control, which sits
 *   concentric inside the 4px inset. A submenu is opened from a floating
 *   surface, so it is solid (bg-surface-2 + shadow-float), never glass on glass.
 * - Motion, responsive tier. The panel grows from the trigger: Radix gives
 *   --radix-dropdown-menu-content-transform-origin, and it travels a quarter of
 *   the travel token from the side it actually opens on (after collision
 *   flipping). We wait for Radix to place it, then read data-side. Exit uses
 *   useExit. AnimatePresence + forceMount + controlled open lets the exit play.
 * - The highlight inside is the shared glide (glide.tsx). Radix keeps the active
 *   row on DOM focus, so rows report onFocus and the glide follows it.
 * - Focus by modality: opened with the pointer, no row is highlighted until the
 *   pointer moves or a key is pressed. Opened with Enter, Space or ArrowDown,
 *   Radix focuses the first row and it shows the keyboard ring.
 * - Checkbox and radio rows keep a fixed 16px cell, so toggling never shifts text.
 *
 * On a phone (foundations.md section 6; useDevice().compact, so a desktop can preview it with
 * <DeviceProvider mode="phone">)
 * - The menu stays beside its button, but a submenu never flies out sideways, where it would
 *   land off the screen. It replaces the list inside the same panel, with a Back row first.
 *   The rows of both lists are real menu items, so the arrow keys, Home, End and typeahead
 *   work as before: the list that is not showing is disabled for Radix, and hidden.
 * - The two lists cross-fade and slide as Tabs panels do: the new one enters half of the travel
 *   token from the side it comes from, the old one leaves a quarter of it the other way.
 *   Responsive tier, transform and opacity only. The panel's height snaps to the new list.
 *   (A glass panel cannot clip its content, because its shadow lives on ::before, so an inner
 *   box does it.)
 * - Focus: after a keyboard drill the Back row has it, after Back the row that opened the
 *   submenu has it again, and after a tap or click the panel has it, so nothing is lit.
 *   ArrowRight drills in, ArrowLeft goes back, and Escape still closes the whole menu.
 * - Touch rows fill when pressed (pointer-coarse:active:, instant tier, color only) and the
 *   shortcut hints are hidden. On coarse the glide does not light a row on touch, so the press
 *   fill is the one feedback.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, animate, motion, useMotionValue, usePresence } from "motion/react";
import { useDevice, useExit, useTransition, useTravel } from "@/motion";
import { CheckIcon, ChevronRightIcon } from "./icons";
import { GLIDE_ROW, useGlide, type Glide } from "./glide";

type Side = "top" | "right" | "bottom" | "left";

/**
 * On a phone the submenus are lists inside the one panel, not panels of their own. `stack` holds
 * the ids of the submenus that are open, outermost first, and `slot` is the box they render into.
 */
type Drill = {
  stack: string[];
  /** +1 while going in, -1 while going back: the side the new list comes from. */
  dir: 1 | -1;
  slot: HTMLElement | null;
  backLabel: string;
  push: (id: string, trigger: HTMLElement | null) => void;
  pop: () => void;
};

type PanelContext = {
  glide: Glide;
  setSubOpen: (open: boolean) => void;
  releaseSub: () => void;
  /** Null on a wide screen, where a submenu is a fly-out panel. */
  drill: Drill | null;
  /** The primary pointer is a finger. */
  coarse: boolean;
};
const PanelCtx = createContext<PanelContext | null>(null);
function usePanel() {
  const ctx = useContext(PanelCtx);
  if (!ctx) throw new Error("Menu items must be rendered inside <Menu>");
  return ctx;
}

/**
 * Where the list a row sits in is in a drill. A list that has finished leaving is "hidden": display
 * none, and its rows are disabled for Radix, so the arrow keys and typeahead only meet the visible list.
 * A list that is leaving is still whole, so its rows do not flash gray while they fade.
 */
type Phase = "current" | "leaving" | "hidden";
const ViewCtx = createContext<Phase>("current");

/** A tap would focus the row it lands on, and a focused row looks keyboard-lit. */
const keepFocus = (e: MouseEvent) => e.preventDefault();

/**
 * What every row needs from its list and its device: whether Radix may reach it, whether the glide may light
 * it, and, for a finger, not to take focus. A finger shows the press on the row itself (its fill). Letting the
 * tap focus the row too would leave it lit, with the keyboard ring, long after the finger has gone.
 */
function useRowView() {
  const phase = useContext(ViewCtx);
  const { coarse } = usePanel();
  return {
    off: phase === "hidden",
    glideRow: phase === "current" ? GLIDE_ROW : undefined,
    onMouseDown: coarse ? keepFocus : undefined,
  };
}

/* ------------------------------------------------------------------ rows */

const row =
  "relative flex h-control-md w-full scroll-my-1 cursor-pointer select-none items-center gap-3 rounded-control px-3 text-small outline-none " +
  "[-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]";
const tone = "text-fg-muted data-[highlighted]:text-fg pointer-coarse:active:text-fg";
const toneDanger = "text-danger";
/** The group label row, and the caption that names a submenu's list. */
const labelRow = "flex h-control-sm items-center px-3 text-caption text-fg-subtle";

/** The fixed 16px cell at the start of every row. */
function Cell({ children }: { children?: ReactNode }) {
  return <span className="grid size-4 shrink-0 place-items-center">{children}</span>;
}

/** A hint, so it is for a keyboard: a finger has no use for it, and it hides on coarse screens. */
function Shortcut({ children }: { children: ReactNode }) {
  return <span className="ml-auto shrink-0 pl-4 font-mono text-caption text-fg-subtle pointer-coarse:hidden">{children}</span>;
}

type ItemProps = {
  /** 16px icon in a fixed cell before the label. A row without one has no cell, so give every row an icon or none, to keep the labels in line. */
  icon?: ReactNode;
  /** Mono hint on the right, for example ⌘D. It is a hint only: it does not bind the key. */
  shortcut?: string;
  /** Danger color, for actions that delete something. */
  destructive?: boolean;
  /** Dims the row and skips it for the pointer and the arrow keys. */
  disabled?: boolean;
  /** Runs on click, Enter or Space. The menu closes afterward; call event.preventDefault() to keep it open. */
  onSelect?: (event: Event) => void;
  /** Makes the row a real link, so a modifier key or a middle click opens it in a new tab. */
  href?: string;
  /** The row label. It truncates with an ellipsis instead of wrapping. */
  children: ReactNode;
};

/** A row that does something when it is chosen, or goes somewhere when it has an href. */
export function MenuItem({ icon, shortcut, destructive, disabled, onSelect, href, children }: ItemProps) {
  const { glide } = usePanel();
  const { off, glideRow, onMouseDown } = useRowView();
  const content = (
    <>
      {icon !== undefined && <Cell>{icon}</Cell>}
      <span className="min-w-0 truncate">{children}</span>
      {shortcut && <Shortcut>{shortcut}</Shortcut>}
    </>
  );
  return (
    <DropdownMenu.Item
      {...glideRow}
      onMouseDown={onMouseDown}
      asChild={href !== undefined}
      disabled={disabled || off}
      onSelect={onSelect}
      onFocus={(e) => glide.focusRow(e.currentTarget)}
      className={row + " " + (destructive ? toneDanger : tone)}
    >
      {href !== undefined ? <a href={href}>{content}</a> : content}
    </DropdownMenu.Item>
  );
}

const indicator =
  "grid size-4 shrink-0 place-items-center opacity-0 transition-opacity duration-(--dur-instant) ease-litt data-[state=checked]:opacity-100";

type CheckboxProps = {
  /** Whether the option is on. You own the state: pass it in and update it in onCheckedChange. */
  checked: boolean;
  /** Called with the new value when the row is toggled. */
  onCheckedChange: (checked: boolean) => void;
  /** Mono hint on the right, for example ⌘T. It is a hint only: it does not bind the key. */
  shortcut?: string;
  /** Close the menu after toggling. Off by default, so several options can change in one visit. */
  closeOnSelect?: boolean;
  /** The option label. It truncates with an ellipsis instead of wrapping. */
  children: ReactNode;
};

/** A row that turns one option on or off. The check sits in a fixed 16px cell, so toggling never shifts the label. */
export function MenuCheckboxItem({ checked, onCheckedChange, shortcut, closeOnSelect = false, children }: CheckboxProps) {
  const { glide } = usePanel();
  const { off, glideRow, onMouseDown } = useRowView();
  return (
    <DropdownMenu.CheckboxItem
      {...glideRow}
      onMouseDown={onMouseDown}
      disabled={off}
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(e) => !closeOnSelect && e.preventDefault()}
      onFocus={(e) => glide.focusRow(e.currentTarget)}
      className={row + " " + tone}
    >
      <DropdownMenu.ItemIndicator forceMount className={indicator}>
        <CheckIcon />
      </DropdownMenu.ItemIndicator>
      <span className="min-w-0 truncate">{children}</span>
      {shortcut && <Shortcut>{shortcut}</Shortcut>}
    </DropdownMenu.CheckboxItem>
  );
}

/** Holds the single choice for a set of MenuRadioItem rows. */
export function MenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  /** The value of the selected row. You own the state: pass it in and update it in onValueChange. */
  value: string;
  /** Called with the value of the row that was picked. */
  onValueChange: (value: string) => void;
  /** The MenuRadioItem rows. */
  children: ReactNode;
}) {
  return (
    <DropdownMenu.RadioGroup value={value} onValueChange={onValueChange}>
      {children}
    </DropdownMenu.RadioGroup>
  );
}

/** One choice inside a MenuRadioGroup. It shows the check when its value matches the group's value. */
export function MenuRadioItem({
  value,
  closeOnSelect = false,
  children,
}: {
  /** What this row stands for. It is passed to onValueChange when the row is picked. */
  value: string;
  /** Close the menu after picking. Off by default, so several options can change in one visit. */
  closeOnSelect?: boolean;
  /** The choice label. It truncates with an ellipsis instead of wrapping. */
  children: ReactNode;
}) {
  const { glide } = usePanel();
  const { off, glideRow, onMouseDown } = useRowView();
  return (
    <DropdownMenu.RadioItem
      {...glideRow}
      onMouseDown={onMouseDown}
      disabled={off}
      value={value}
      onSelect={(e) => !closeOnSelect && e.preventDefault()}
      onFocus={(e) => glide.focusRow(e.currentTarget)}
      className={row + " " + tone}
    >
      <DropdownMenu.ItemIndicator forceMount className={indicator}>
        <CheckIcon />
      </DropdownMenu.ItemIndicator>
      <span className="min-w-0 truncate">{children}</span>
    </DropdownMenu.RadioItem>
  );
}

/** A group label: caption size, fg-subtle. It is not a row, so the arrow keys skip it. */
export function MenuLabel({
  children,
}: {
  /** The label text. */
  children: ReactNode;
}) {
  return <DropdownMenu.Label className={labelRow}>{children}</DropdownMenu.Label>;
}

/** Wraps related rows in a role="group". It adds no visual of its own; use MenuLabel and MenuSeparator for that. */
export function MenuGroup({
  children,
}: {
  /** The rows in the group. */
  children: ReactNode;
}) {
  return <DropdownMenu.Group>{children}</DropdownMenu.Group>;
}

/** Full-bleed 1px hairline: it ignores the 4px inset of the panel. */
export function MenuSeparator() {
  return <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-line" />;
}

/** What the two submenu implementations share. */
type SubProps = {
  icon?: ReactNode;
  label: string;
  children: ReactNode;
};

/** A submenu. On a wide screen its panel flies out beside the row and is solid, because it floats over a floating surface. On a phone it replaces the list in the same panel, with a Back row first. It opens on hover, click, Enter, Space or ArrowRight. */
export function MenuSub({
  icon,
  label,
  children,
}: {
  /** 16px icon in a fixed cell before the label, like MenuItem. */
  icon?: ReactNode;
  /** Text of the row that opens the submenu. */
  label: string;
  /** The submenu rows. Use the same parts as Menu. */
  children: ReactNode;
}) {
  const { drill } = usePanel();
  return drill ? (
    <DrillSub drill={drill} icon={icon} label={label}>
      {children}
    </DrillSub>
  ) : (
    <FlySub icon={icon} label={label}>
      {children}
    </FlySub>
  );
}

/** The wide-screen submenu: a solid panel that flies out beside its row. */
function FlySub({ icon, label, children }: SubProps) {
  const parent = usePanel();
  const { off, glideRow, onMouseDown } = useRowView();
  const [open, setOpen] = useState(false);
  const change = (next: boolean) => {
    setOpen(next);
    parent.setSubOpen(next);
    if (next) parent.glide.setRing(false);
    else parent.releaseSub();
  };
  return (
    <DropdownMenu.Sub open={open} onOpenChange={change}>
      <DropdownMenu.SubTrigger
        {...glideRow}
        onMouseDown={onMouseDown}
        disabled={off}
        onFocus={(e) => parent.glide.focusRow(e.currentTarget)}
        className={row + " " + tone + " data-[state=open]:text-fg"}
      >
        {icon !== undefined && <Cell>{icon}</Cell>}
        <span className="min-w-0 truncate">{label}</span>
        <span className="ml-auto shrink-0 text-fg-subtle">
          <ChevronRightIcon />
        </span>
      </DropdownMenu.SubTrigger>
      <AnimatePresence>
        {open && (
          <DropdownMenu.Portal forceMount key="sub">
            <Panel sub>{children}</Panel>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Sub>
  );
}

/**
 * The phone submenu. Its row stays in the parent list and is a plain menu item that drills in; its
 * rows render into the panel's slot, as a list of their own with a Back row first. They stay
 * children of this component, so state in them stays live while another list shows.
 */
function DrillSub({ drill, icon, label, children }: SubProps & { drill: Drill }) {
  const { glide } = usePanel();
  const { off, glideRow, onMouseDown } = useRowView();
  const id = useId();
  const heading = useId();
  const trigger = useRef<HTMLDivElement | null>(null);
  const open = drill.stack.includes(id);
  const top = drill.stack[drill.stack.length - 1] === id;
  return (
    <>
      <DropdownMenu.Item
        ref={trigger}
        {...glideRow}
        onMouseDown={onMouseDown}
        disabled={off}
        aria-haspopup="menu"
        /* Keep the menu open: the list changes, the panel stays. */
        onSelect={(e) => {
          e.preventDefault();
          drill.push(id, trigger.current);
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight") return;
          e.preventDefault();
          drill.push(id, trigger.current);
        }}
        onFocus={(e) => glide.focusRow(e.currentTarget)}
        className={row + " " + tone}
      >
        {icon !== undefined && <Cell>{icon}</Cell>}
        <span className="min-w-0 truncate">{label}</span>
        <span className="ml-auto shrink-0 text-fg-subtle">
          <ChevronRightIcon />
        </span>
      </DropdownMenu.Item>
      {drill.slot &&
        createPortal(
          <AnimatePresence>
            {open && (
              <SubView key={id} current={top}>
                <BackItem />
                <DropdownMenu.Group aria-labelledby={heading}>
                  <DropdownMenu.Label id={heading} className={labelRow}>
                    {label}
                  </DropdownMenu.Label>
                  {children}
                </DropdownMenu.Group>
              </SubView>
            )}
          </AnimatePresence>,
          drill.slot,
        )}
    </>
  );
}

/** The first row of a submenu's list: a real menu item, so the arrow keys reach it like any other. */
function BackItem() {
  const { glide, drill } = usePanel();
  const { off, glideRow, onMouseDown } = useRowView();
  if (!drill) return null;
  return (
    <DropdownMenu.Item
      {...glideRow}
      onMouseDown={onMouseDown}
      disabled={off}
      onSelect={(e) => {
        e.preventDefault();
        drill.pop();
      }}
      onFocus={(e) => glide.focusRow(e.currentTarget)}
      className={row + " " + tone}
    >
      <Cell>
        <span className="grid rotate-180">
          <ChevronRightIcon />
        </span>
      </Cell>
      <span className="min-w-0 truncate">{drill.backLabel}</span>
    </DropdownMenu.Item>
  );
}

/** A submenu's list, which AnimatePresence keeps mounted while it leaves. */
function SubView({ current, children }: { current: boolean; children: ReactNode }) {
  const [present, safeToRemove] = usePresence();
  return (
    <DrillView current={current} present={present} onGone={safeToRemove ?? undefined} born>
      {children}
    </DrillView>
  );
}

/**
 * One list of a drill: the menu's own rows, or a submenu's. The one that shows sits in the flow, so the
 * panel is exactly as tall as it. It enters half of the travel token from the side it comes from, and the
 * one it replaces leaves a quarter of it the other way, taken out of the flow while it goes (as a Tabs
 * panel is), so the height snaps and never animates. Responsive tier, transform and opacity only.
 */
function DrillView({
  current,
  present = true,
  onGone,
  born = false,
  children,
}: {
  /** This is the list the stack ends on. */
  current: boolean;
  /** False while its AnimatePresence is removing it. */
  present?: boolean;
  /** Tells AnimatePresence the exit is done. */
  onGone?: () => void;
  /** Added by a drill, so it enters. The menu's own first list is simply there. */
  born?: boolean;
  children: ReactNode;
}) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  /* From context, not a prop: AnimatePresence keeps a leaving list's old props, and the way it leaves is the way back. */
  const dir = usePanel().drill?.dir ?? 1;
  const shown = current && present;
  /* The exit has finished: the list is display none until it is shown again. */
  const [settled, setSettled] = useState(false);
  const x = useMotionValue(born ? dir * (travel / 2) : 0);
  const opacity = useMotionValue(born ? 0 : 1);
  const latest = useRef({ enter, exit, travel, dir, onGone });
  latest.current = { enter, exit, travel, dir, onGone };

  useEffect(() => {
    const { enter, exit, travel, dir } = latest.current;
    let alive = true;
    const runs: { stop: () => void }[] = [];
    if (shown) {
      setSettled(false);
      /* Coming back from the side, or from a half-finished exit: start from where a new list starts. */
      if (opacity.get() < 1) {
        x.jump(dir * (travel / 2));
        opacity.jump(0);
      }
      runs.push(animate(x, 0, enter), animate(opacity, 1, enter));
    } else {
      runs.push(animate(x, -dir * (travel / 4), exit));
      runs.push(
        animate(opacity, 0, {
          ...exit,
          onComplete: () => {
            if (!alive) return;
            setSettled(true);
            latest.current.onGone?.();
          },
        }),
      );
    }
    return () => {
      alive = false;
      runs.forEach((r) => r.stop());
    };
  }, [shown, present, x, opacity]);

  const phase: Phase = shown ? "current" : settled ? "hidden" : "leaving";
  return (
    <ViewCtx.Provider value={phase}>
      <motion.div
        style={{ x, opacity }}
        inert={phase !== "current"}
        className={
          "p-1 " + (phase === "hidden" ? "hidden" : phase === "leaving" ? "pointer-events-none absolute inset-x-0 top-0" : "")
        }
      >
        {children}
      </motion.div>
    </ViewCtx.Provider>
  );
}

/* ----------------------------------------------------------------- panel */

type PanelProps = {
  sub?: boolean;
  label?: string;
  backLabel?: string;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  collisionBoundary?: Element | null;
  children: ReactNode;
};

/** The animated surface for both the menu and a submenu. */
function Panel({ sub = false, label, backLabel = "Back", side, align, sideOffset, collisionBoundary, children }: PanelProps) {
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();
  const latest = useRef(enter);
  latest.current = enter;
  const { compact, coarse } = useDevice();
  /* On a phone the menu's submenus are lists inside this panel, not panels of their own. */
  const drilling = compact && !sub;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const el = useRef<HTMLDivElement | null>(null);
  /* null until Radix has placed the panel; then the side it really opened on. */
  const [placed, setPlaced] = useState<Side | null>(null);
  const subOpen = useRef(false);

  const glide = useGlide({ focusRows: true, keepOnLeave: () => subOpen.current });
  const glideRef = glide.ref;

  /* The glide measures rows against the box that holds them: the panel, or on a phone the inner box that clips. */
  const scroller = useRef<HTMLDivElement | null>(null);
  const setPanel = useCallback(
    (node: HTMLDivElement | null) => {
      el.current = node;
      if (!drilling) glideRef(node);
    },
    [glideRef, drilling],
  );
  const setScroller = useCallback(
    (node: HTMLDivElement | null) => {
      scroller.current = node;
      if (drilling) glideRef(node);
    },
    [glideRef, drilling],
  );

  /* The drill: which submenus are open, which way the last move went, and where the next list renders. */
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const [stack, setStack] = useState<string[]>([]);
  const [dir, setDir] = useState<1 | -1>(1);
  const stackRef = useRef(stack);
  stackRef.current = stack;
  const triggers = useRef(new Map<string, HTMLElement>());
  const input = useRef<"key" | "pointer">("pointer");
  const moved = useRef<{ via: "key" | "pointer"; to: HTMLElement | null } | null>(null);

  const push = useCallback((id: string, trigger: HTMLElement | null) => {
    if (trigger) triggers.current.set(id, trigger);
    moved.current = { via: input.current, to: null };
    setDir(1);
    setStack((s) => [...s, id]);
  }, []);
  const pop = useCallback(() => {
    const id = stackRef.current[stackRef.current.length - 1];
    if (id === undefined) return;
    moved.current = { via: input.current, to: triggers.current.get(id) ?? null };
    setDir(-1);
    setStack((s) => s.slice(0, -1));
  }, []);

  useEffect(() => {
    if (!drilling) setStack([]);
  }, [drilling]);

  /* After the lists have swapped: start at the top, let go of the old highlight, and put focus where it
     belongs. A key moved us, so a row has it (the Back row going in, the opening row going back) and shows
     the ring. A finger or a mouse moved us, so the panel has it and nothing is lit. */
  useLayoutEffect(() => {
    const m = moved.current;
    if (!m) return;
    moved.current = null;
    if (scroller.current) scroller.current.scrollTop = 0;
    glide.hide();
    if (m.via === "pointer") el.current?.focus({ preventScroll: true });
    else (m.to ?? scroller.current?.querySelector<HTMLElement>("[data-glide-row]"))?.focus({ preventScroll: true });
  }, [stack]);

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

  const out = offset(placed ?? (sub ? "right" : "bottom"));
  const drill: Drill | null = drilling ? { stack, dir, slot, backLabel, push, pop } : null;
  const ctx: PanelContext = {
    glide,
    setSubOpen: (open) => {
      subOpen.current = open;
    },
    releaseSub: glide.release,
    drill,
    coarse,
  };

  /* Radix forwards onPlaced to its popper, but the menu types omit it. */
  const placedProp = { onPlaced } as Record<string, unknown>;

  const gp = glide.props;
  const motionProps = {
    ref: setPanel,
    ...gp,
    onKeyDownCapture: (e: KeyboardEvent) => {
      input.current = "key";
      gp.onKeyDownCapture(e);
    },
    onPointerDownCapture: (e: PointerEvent) => {
      input.current = "pointer";
      /* A finger's press shows on the row itself (its own fill), so the glide does not light it as well. */
      if (coarse && e.pointerType === "touch") return;
      gp.onPointerDownCapture(e);
    },
    /* ArrowLeft goes back, as it closes a fly-out submenu. */
    onKeyDown: (e: KeyboardEvent) => {
      if (!drilling || e.key !== "ArrowLeft" || stackRef.current.length === 0) return;
      e.preventDefault();
      pop();
    },
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: placed ? 1 : 0, scale: placed ? 1 : 0.98, transition: enter },
    exit: { opacity: 0, scale: 0.98, x: out.x, y: out.y, transition: exit },
    style: { x, y },
  };
  const surface =
    "relative z-50 min-w-60 rounded-surface outline-none origin-(--radix-dropdown-menu-content-transform-origin) data-[state=closed]:pointer-events-none " +
    (drilling ? "" : "p-1 ");

  /* A glass surface cannot clip: its shadow lives on ::before. So on a phone an inner box clips the list that is
     leaving, and scrolls a list taller than the screen. The lists carry the 4px inset, so the panel has none. */
  const body = drill ? (
    <div
      ref={setScroller}
      className="relative max-h-(--radix-dropdown-menu-content-available-height) overflow-x-hidden overflow-y-auto overscroll-contain rounded-surface"
    >
      {glide.highlight}
      <DrillView current={stack.length === 0}>
        {children}
      </DrillView>
      <div ref={setSlot} />
    </div>
  ) : (
    <>
      {glide.highlight}
      {children}
    </>
  );

  return (
    <PanelCtx.Provider value={ctx}>
      {sub ? (
        <DropdownMenu.SubContent
          forceMount
          asChild
          sideOffset={4}
          alignOffset={-4}
          collisionPadding={8}
          loop
          {...placedProp}
        >
          <motion.div {...motionProps} className={surface + "bg-surface-2 shadow-float"}>
            {body}
          </motion.div>
        </DropdownMenu.SubContent>
      ) : (
        <DropdownMenu.Content
          forceMount
          asChild
          aria-label={label}
          /* Radix names the menu by its trigger (aria-labelledby), which beats aria-label.
             A label you pass should win, so clear it then. */
          {...(label ? { "aria-labelledby": undefined } : {})}
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={8}
          collisionBoundary={collisionBoundary ?? undefined}
          loop
          {...placedProp}
        >
          <motion.div {...motionProps} className={surface + "litt-glass"}>
            {body}
          </motion.div>
        </DropdownMenu.Content>
      )}
    </PanelCtx.Provider>
  );
}

/* ------------------------------------------------------------------ root */

export type MenuProps = {
  /** The element that opens the menu. It receives the Radix trigger props. */
  trigger: ReactElement;
  /** The menu's accessible name. Without it, the menu is named by its trigger, so name the trigger either way. */
  label?: string;
  /** The side of the trigger the menu opens on first. It flips to the other side when there is no room. */
  side?: "top" | "bottom";
  /** Which edge of the trigger the menu lines up with. */
  align?: "start" | "center" | "end";
  /** Gap between the trigger and the menu, in px. */
  sideOffset?: number;
  /** Flip against this element instead of the viewport (a stage, a card). */
  collisionBoundary?: Element | null;
  /** The text of the Back row that leaves a submenu on a phone, where a submenu replaces the list instead of flying out. Translate it with the rest of your labels. */
  backLabel?: string;
  /** The rows: MenuItem, MenuSub, MenuCheckboxItem, MenuRadioGroup, MenuLabel, MenuGroup and MenuSeparator. */
  children: ReactNode;
};

/** The root. It wraps your trigger and the rows, and owns its open state, so there is no open prop. */
export function Menu({
  trigger,
  label,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  collisionBoundary,
  backLabel = "Back",
  children,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <AnimatePresence>
        {open && (
          <DropdownMenu.Portal forceMount key="menu">
            <Panel
              label={label}
              backLabel={backLabel}
              side={side}
              align={align}
              sideOffset={sideOffset}
              collisionBoundary={collisionBoundary}
            >
              {children}
            </Panel>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Root>
  );
}
