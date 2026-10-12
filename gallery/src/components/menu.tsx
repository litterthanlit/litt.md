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
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";
import { CheckIcon, ChevronRightIcon } from "./icons";
import { GLIDE_ROW, useGlide, type Glide } from "./glide";

type Side = "top" | "right" | "bottom" | "left";

type PanelContext = { glide: Glide; setSubOpen: (open: boolean) => void; releaseSub: () => void };
const PanelCtx = createContext<PanelContext | null>(null);
function usePanel() {
  const ctx = useContext(PanelCtx);
  if (!ctx) throw new Error("Menu items must be rendered inside <Menu>");
  return ctx;
}

/* ------------------------------------------------------------------ rows */

const row =
  "relative flex h-control-md w-full scroll-my-1 cursor-pointer select-none items-center gap-3 rounded-control px-3 text-small outline-none " +
  "transition-colors duration-(--dur-instant) ease-litt data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled";
const tone = "text-fg-muted data-[highlighted]:text-fg";
const toneDanger = "text-danger";

/** The fixed 16px cell at the start of every row. */
function Cell({ children }: { children?: ReactNode }) {
  return <span className="grid size-4 shrink-0 place-items-center">{children}</span>;
}

function Shortcut({ children }: { children: ReactNode }) {
  return <span className="ml-auto shrink-0 pl-4 font-mono text-caption text-fg-subtle">{children}</span>;
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
  const content = (
    <>
      {icon !== undefined && <Cell>{icon}</Cell>}
      <span className="min-w-0 truncate">{children}</span>
      {shortcut && <Shortcut>{shortcut}</Shortcut>}
    </>
  );
  return (
    <DropdownMenu.Item
      {...GLIDE_ROW}
      asChild={href !== undefined}
      disabled={disabled}
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
  return (
    <DropdownMenu.CheckboxItem
      {...GLIDE_ROW}
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
  return (
    <DropdownMenu.RadioItem
      {...GLIDE_ROW}
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
  return <DropdownMenu.Label className="flex h-control-sm items-center px-3 text-caption text-fg-subtle">{children}</DropdownMenu.Label>;
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

/** A submenu. Its panel is solid, because it floats over a floating surface. It opens on hover, click, Enter, Space or ArrowRight. */
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
  const parent = usePanel();
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
        {...GLIDE_ROW}
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

/* ----------------------------------------------------------------- panel */

type PanelProps = {
  sub?: boolean;
  label?: string;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  collisionBoundary?: Element | null;
  children: ReactNode;
};

/** The animated surface for both the menu and a submenu. */
function Panel({ sub = false, label, side, align, sideOffset, collisionBoundary, children }: PanelProps) {
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
  const subOpen = useRef(false);

  const glide = useGlide({ focusRows: true, keepOnLeave: () => subOpen.current });
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      el.current = node;
      glide.ref(node);
    },
    [glide],
  );

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
  const ctx: PanelContext = {
    glide,
    setSubOpen: (open) => {
      subOpen.current = open;
    },
    releaseSub: glide.release,
  };

  /* Radix forwards onPlaced to its popper, but the menu types omit it. */
  const placedProp = { onPlaced } as Record<string, unknown>;

  const motionProps = {
    ref: setRefs,
    ...glide.props,
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: placed ? 1 : 0, scale: placed ? 1 : 0.98, transition: enter },
    exit: { opacity: 0, scale: 0.98, x: out.x, y: out.y, transition: exit },
    style: { x, y },
  };
  const surface = "relative z-50 min-w-60 rounded-surface p-1 outline-none origin-(--radix-dropdown-menu-content-transform-origin) data-[state=closed]:pointer-events-none";

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
          <motion.div {...motionProps} className={surface + " bg-surface-2 shadow-float"}>
            {glide.highlight}
            {children}
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
          <motion.div {...motionProps} className={surface + " litt-glass"}>
            {glide.highlight}
            {children}
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
  /** The rows: MenuItem, MenuSub, MenuCheckboxItem, MenuRadioGroup, MenuLabel, MenuGroup and MenuSeparator. */
  children: ReactNode;
};

/** The root. It wraps your trigger and the rows, and owns its open state, so there is no open prop. */
export function Menu({ trigger, label, side = "bottom", align = "start", sideOffset = 8, collisionBoundary, children }: MenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <AnimatePresence>
        {open && (
          <DropdownMenu.Portal forceMount key="menu">
            <Panel label={label} side={side} align={align} sideOffset={sideOffset} collisionBoundary={collisionBoundary}>
              {children}
            </Panel>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Root>
  );
}
