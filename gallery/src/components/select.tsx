/**
 * Select: one value from a short list (components.md, "Select"), on @radix-ui/react-select
 * with position="popper". Radix supplies the roles, typeahead, keyboard, focus return and the
 * hidden native <select> a form reads. Everything visual is written here.
 *
 * - Two parts, like Input. Select is the bare trigger and list, for a toolbar or inline use, and it
 *   needs an aria-label or aria-labelledby. SelectField adds the label above and the help or error
 *   below, all wired up, in the same layout as TextField.
 * - Trigger (Press): you press it, so it is raised, not cut (R3, material.md 6): the secondary Button's block
 *   (--block, --block-lift), its hover fill and its press, which tightens the cast (--block-press) at once
 *   and sinks it --press-depth. While its list is open it stays pressed. The Input's sizes (sm 32, md 44,
 *   lg 56, 16px text on coarse pointers), the value in --fg at the text weight, the placeholder in
 *   --fg-subtle, and at its end a window cut into the block (--cut, --cut-shade, 4px in) holding a 16px up and down mark that never turns. Focus is the 2px --focus outline at a 2px offset,
 *   as on every button. An error draws a 1px --danger edge inside the block and keeps its cast; disabled,
 *   it lies flat on --surface-2 with the hairline. A long value truncates with an ellipsis.
 * - Flat (bodies/select.flat.tsx): a grey pill and a solid grey sheet; the current row is a grey bubble, the title weight and a check.
 * - List (Press): glass at the surface radius with a tray cut into it 4px in (--tray, --tray-shade), 44px slats in the tray
 *   with 12px side padding, one gliding highlight (glide.tsx), and the current slat lifted: a block face behind it (z -10, so
 *   the highlight and its ring show over it) and a 16px check in a fixed cell at its end. It is at least as wide as the trigger and never taller
 *   than the room on screen, and it scrolls inside. Opened inside glass (a dialog, a sheet, the
 *   header, a popover) it is solid (bg-surface-2 + shadow-float), found from the DOM when it opens.
 * - Motion, responsive tier, as the Menu. The list grows from the trigger
 *   (--radix-select-content-transform-origin) and travels a quarter of the travel token from the side
 *   it really opens on, after collision flipping. Radix Select unmounts its content on close and keeps
 *   the options in a detached fragment, so the exit is held with Content's forceMount: the select
 *   marks itself "leaving" in the same render that closes it, plays the exit on useExit, and then lets
 *   Radix unmount. Radix Select overrides onPlaced, so "placed" is read from the content's inline
 *   `animation: none`, which Radix's popper removes once it has measured and positioned the list.
 * - The highlight follows Radix's focus: Radix focuses the highlighted option, so each row reports
 *   onFocus to the glide, as Menu rows do. Opened with the pointer, nothing is lit until the pointer
 *   moves or a key is pressed. Opened with Space, Enter or an arrow, the current option is lit with
 *   the keyboard ring. A finger's press shows on the row itself (pointer-coarse:active:), and a tap
 *   never takes focus, so nothing stays lit after it.
 * - On compact screens the list stays anchored, like a dropdown menu. It is not a sheet.
 * - Closing returns focus to the trigger at once, not when the exit has finished.
 * - One contract, three bodies (proposals/worlds.md, Bodies). This file is the contract: the props, Radix's roles and keys,
 *   the value, the open state, the exit and the highlight's focus. It resolves them into SelectTriggerBodyProps,
 *   SelectListBodyProps and SelectRowBodyProps and renders the body the material picks (byWorld). The Press bodies are
 *   below, the default. bodies/select.flat.tsx is the grey pill and the solid card. bodies/select.device.tsx is an LCD
 *   readout with a pair of step keys at its end (a pointer extra: they are out of the tab order and out of the
 *   accessibility tree, and the keyboard stays Radix's) and a list drawn as a screen, its current row a lit lamp and its
 *   highlight switching row to row with no glide.
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
  type ComponentProps,
  type MutableRefObject,
  type ReactNode,
  type Ref,
} from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { animate, motion, useMotionValue, type AnimationPlaybackControls, type HTMLMotionProps } from "motion/react";
import { byWorld, useExit, useMaterial, useOverlayRoot, useTransition, useTravel } from "@/motion";
import { useOverlayMotion } from "@/motion/deal";
import { CheckIcon, ChevronsUpDownIcon } from "@/components/icons";
import { GLIDE_ROW, useGlide, type Glide } from "@/components/glide";
import { SelectDeviceList, SelectDeviceRow, SelectDeviceTrigger } from "./bodies/select.device";
import { SelectFlatList, SelectFlatRow, SelectFlatTrigger } from "./bodies/select.flat";

export type SelectSize = "sm" | "md" | "lg";

export type SelectOption = {
  /** What the form sends and onValueChange receives. Keep it unique, and not an empty string. */
  value: string;
  /** What people read, in the list and in the trigger. It truncates with an ellipsis instead of wrapping. */
  label: ReactNode;
  /** Dims the option and skips it for the pointer, the arrow keys and typeahead. */
  disabled?: boolean;
  /** Plain text for typeahead, and for the hidden native field, when label is not a string. */
  textValue?: string;
};

export type SelectProps = {
  /** The choices, in the order they show. */
  options: SelectOption[];
  /** The picked value. Pair it with onValueChange. Leave it out and the select keeps its own. */
  value?: string;
  /** The value to start with when you do not control it. Leave it out to start on the placeholder. */
  defaultValue?: string;
  /** Called with the value of the option that was picked. */
  onValueChange?: (value: string) => void;
  /** Shown while nothing is picked, in the subtle color. It is not a label. */
  placeholder?: ReactNode;
  /** Height on the shared control scale: sm is 32, md is 44, lg is 56. Use lg next to an lg button, and sm in a toolbar. */
  size?: SelectSize;
  /** Draws the error edge and sets aria-invalid. The bare Select shows no message, so link yours with aria-describedby. */
  invalid?: boolean;
  /** Dims the trigger and keeps the list closed. */
  disabled?: boolean;
  /** Marks the field as required for assistive tech and for the hidden native field. */
  required?: boolean;
  /** The field name a form sends the value under. The value travels in a hidden native select inside the form. */
  name?: string;
  /** The id of the trigger. SelectField sets one for you. */
  id?: string;
  /** Extra classes for the trigger. It fills its container, so set a width on a wrapper. */
  className?: string;
  /** The select's accessible name, when no visible label names it. The bare Select needs this or aria-labelledby. */
  "aria-label"?: string;
  /** The id of the element that names the select, such as a visible label. */
  "aria-labelledby"?: string;
  /** The id of the help or error text under the select. */
  "aria-describedby"?: string;
  /** Whether the list is open. Pair it with onOpenChange. Leave it out and the select keeps its own state. */
  open?: boolean;
  /** Start open when you do not control it. */
  defaultOpen?: boolean;
  /** Called with the next state when the trigger, a pick, Esc or a click outside asks to change it. */
  onOpenChange?: (open: boolean) => void;
};

type Side = "top" | "right" | "bottom" | "left";

/** What the list must not be glass over: any glass surface, and any popover. */
const FLOATING = ".litt-glass, [data-popover-surface]";

/* ---------------------------------------------------------------- trigger */

/** What a trigger body draws: Radix's trigger props, the picked label and the step keys' state. */
export type SelectTriggerBodyProps = {
  /** Everything Radix's trigger needs (ref, id, aria-*, the pointer and key handlers). Spread it onto the one trigger button. */
  root: ComponentProps<typeof SelectPrimitive.Trigger>;
  size: SelectSize;
  /** The caller's extra classes; the body puts them on its outermost box. */
  className: string;
  invalid: boolean;
  disabled: boolean;
  /** Whether the list is open. */
  open: boolean;
  /** The picked option's label, or undefined while nothing is picked. */
  selected: ReactNode;
  placeholder: ReactNode;
  /** Stepping through the options without opening the list: the Device body's keys. Out of the tab order. */
  step: { prev: () => void; next: () => void; canPrev: boolean; canNext: boolean };
};

/* The Press trigger, which the Date and Color pickers copy: a raised block with a window cut into its end. */
const field =
  "group/trigger flex w-full min-w-0 cursor-pointer items-center gap-control rounded-control bg-block text-left font-normal text-fg " +
  "data-placeholder:text-fg-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) " +
  "[-webkit-tap-highlight-color:transparent] " +
  "shadow-(--block-lift) enabled:active:shadow-(--block-press) data-[state=open]:shadow-(--block-press) " +
  "hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover) " +
  "transition-[background-color,color,translate] duration-(--dur-instant) ease-litt " +
  "active:translate-y-(--press-depth) disabled:active:translate-y-0 data-[state=open]:translate-y-(--press-depth) " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger),var(--block-lift)] " +
  "aria-invalid:enabled:active:shadow-[inset_0_0_0_1px_var(--danger),var(--block-press)] " +
  "aria-invalid:data-[state=open]:shadow-[inset_0_0_0_1px_var(--danger),var(--block-press)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:data-placeholder:text-fg-disabled " +
  "disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  /* Forced colors (Windows high contrast) drops box-shadow, so the block keeps its shape with a real border. */
  "forced-colors:border";

/* The window sits 4px in from the block's end, top and bottom, so its corners are the block's less 4px. */
const sizes: Record<SelectSize, string> = {
  sm: "h-control-sm pl-control-pad-sm pr-1 text-small pointer-coarse:h-control-md",
  md: "h-control-md pl-control-pad-md pr-1 text-body",
  lg: "h-control-lg pl-control-pad-lg pr-1 text-(length:--control-text-lg)",
};

/** The Press trigger: a raised block with a cut window at its end holding the up and down mark. */
function PressTrigger({ root, size, className, selected, placeholder }: SelectTriggerBodyProps) {
  return (
    <SelectPrimitive.Trigger {...root} data-body="press" className={[field, sizes[size], className].join(" ")}>
      {/* Radix drops a className on Value, so this span carries the truncation and pushes the window to the end. */}
      <span className="min-w-0 flex-1 truncate">
        <SelectPrimitive.Value placeholder={placeholder}>{selected}</SelectPrimitive.Value>
      </span>
      <span
        aria-hidden="true"
        className="my-1 grid aspect-square shrink-0 self-stretch place-items-center rounded-[calc(var(--radius-control)-4px)] bg-cut shadow-(--cut-shade) group-disabled/trigger:bg-transparent group-disabled/trigger:shadow-none forced-colors:border"
      >
        <SelectPrimitive.Icon asChild>
          <ChevronsUpDownIcon className="shrink-0 text-fg-subtle group-disabled/trigger:text-fg-disabled" />
        </SelectPrimitive.Icon>
      </span>
    </SelectPrimitive.Trigger>
  );
}

/* --------------------------------------------------------------- the list */

/** Shared by the rows of one open list. */
type ListContext = {
  glide: Glide;
  /** True while a pointer opened the list and nothing has moved or been pressed yet: no row is lit. */
  quiet: MutableRefObject<boolean>;
  /** True when the last press was a finger's. */
  touch: MutableRefObject<boolean>;
};
const ListCtx = createContext<ListContext | null>(null);

/* A slat sits in the tray with 4px around it, so its corners are the tray's less 4px, and the tray's the glass's less 4px. The
   current slat's raised face is a pseudo-element behind everything, so the gliding highlight and its keyboard ring still show over it. */
const row =
  "relative flex h-control-md w-full scroll-my-1 cursor-pointer select-none items-center gap-3 rounded-[calc(var(--radius-surface)-8px)] px-3 text-small outline-none " +
  "[-webkit-tap-highlight-color:transparent] " +
  "before:absolute before:inset-0 before:-z-10 before:rounded-[calc(var(--radius-surface)-8px)] " +
  "data-[state=checked]:before:bg-block data-[state=checked]:before:shadow-[var(--highlight),var(--block-lift)] forced-colors:data-[state=checked]:before:border " +
  "transition-colors duration-(--dur-instant) ease-litt " +
  "text-fg-muted data-[state=checked]:text-fg group-data-[quiet=false]/list:data-[highlighted]:text-fg " +
  "forced-colors:group-data-[quiet=false]/list:data-[highlighted]:[forced-color-adjust:none] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:text-[HighlightText] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:**:text-[HighlightText] " +
  "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] pointer-coarse:active:text-fg";

/** What a row body draws: the props Radix's item needs, and the option. */
export type SelectRowBodyProps = {
  item: Omit<ComponentProps<typeof SelectPrimitive.Item>, "className" | "children">;
  option: SelectOption;
};

function PressRow({ item, option }: SelectRowBodyProps) {
  return (
    <SelectPrimitive.Item {...item} className={row}>
      <span className="min-w-0 flex-1 truncate">
        <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      </span>
      <span className="grid size-4 shrink-0 place-items-center">
        <SelectPrimitive.ItemIndicator className="grid place-items-center text-fg">
          <CheckIcon />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function Row({ option }: { option: SelectOption }) {
  const ctx = useContext(ListCtx);
  const Body = byWorld(useMaterial(), { press: PressRow, flat: SelectFlatRow, device: SelectDeviceRow });
  if (!ctx) return null;
  const { glide, quiet, touch } = ctx;
  return (
    <Body
      option={option}
      item={{
        ...GLIDE_ROW,
        value: option.value,
        disabled: option.disabled,
        textValue: option.textValue,
        /* A tap would focus the row it lands on, and a focused row looks keyboard-lit. */
        onMouseDown: (e) => {
          if (touch.current) e.preventDefault();
        },
        onFocus: (e) => {
          if (!quiet.current) glide.focusRow(e.currentTarget);
        },
      }}
    />
  );
}

/** What a list body draws: the animated surface's props, the glide, and the rows. */
export type SelectListBodyProps = {
  /** The props for the one surface element: Radix's, the motion values, the quiet flag and the pointer and key handlers. */
  root: HTMLMotionProps<"div"> & { ref?: Ref<HTMLDivElement>; "data-quiet"?: boolean };
  /** True when the list sits inside glass (a dialog, a sheet, the header, a popover) and must be solid. */
  flat: boolean;
  glide: Glide;
  children: ReactNode;
};

/** The Press list: a glass panel with a tray cut into it, the options as slats, the current one a raised block. */
function PressList({ root, flat, glide, children }: SelectListBodyProps) {
  return (
    <motion.div
      {...root}
      data-body="press"
      className={
        "group/list relative z-50 max-h-(--radix-select-content-available-height) max-w-(--radix-select-content-available-width) " +
        "min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) rounded-surface p-1 outline-none " +
        (flat ? "bg-surface-2 shadow-float" : "litt-glass")
      }
    >
      {/* The glass cannot clip, its shadow lives on ::before, so the viewport is the tray: it clips and scrolls the slats.
          Radix hides the scrollbar by default; a long list gets a thin one back, so it reads as scrollable. It is its own
          stacking context, so a slat's raised face (z -10) stays above the tray and under the highlight. */}
      <SelectPrimitive.Viewport
        ref={glide.ref}
        className="isolate rounded-[calc(var(--radius-surface)-4px)] bg-tray p-1 shadow-(--tray-shade) forced-colors:border overscroll-contain [&>[data-ring]]:rounded-[calc(var(--radius-surface)-8px)] [scrollbar-color:var(--line-strong)_transparent]! [scrollbar-width:thin]!"
      >
        {glide.highlight}
        {children}
      </SelectPrimitive.Viewport>
    </motion.div>
  );
}

const compose =
  <A extends unknown[]>(a: ((...args: A) => void) | undefined, b: (...args: A) => void) =>
  (...args: A) => {
    a?.(...args);
    b(...args);
  };

type SurfaceProps = Omit<HTMLMotionProps<"div">, "ref" | "children"> & {
  /** Radix hands the content its ref through Slot. */
  ref?: Ref<HTMLDivElement>;
  options: SelectOption[];
  open: boolean;
  leaving: boolean;
  flat: boolean;
  input: MutableRefObject<"key" | "pointer">;
  onExited: () => void;
};

/**
 * The animated surface. It is the direct child of SelectPrimitive.Content (asChild), so it receives the props
 * Radix puts on the content (role, id, data-state, the keyboard handlers, the focus trap) and puts them on the
 * element. It mounts when the list opens, and stays mounted through the exit.
 */
function Surface({ ref, options, open, leaving, flat, input, onExited, style, ...rest }: SurfaceProps) {
  /* The material's motion language (@/motion/deal): it grows from om.grow, and under Device it switches on and off
     in steps where it stands, with no slide. */
  const om = useOverlayMotion();
  const springIn = useTransition("responsive");
  const springOut = useExit("responsive");
  const enter = om.switches ? om.switchIn : springIn;
  const exit = om.switches ? om.switchOut : springOut;
  const fullTravel = useTravel();
  const travel = om.slides ? fullTravel : 0;
  const latest = useRef({ enter, exit, travel, onExited });
  latest.current = { enter, exit, travel, onExited };

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(om.grow);
  const opacity = useMotionValue(0);
  const node = useRef<HTMLDivElement | null>(null);
  const side = useRef<Side>("bottom");
  const entered = useRef(false);

  const setNode = useCallback(
    (el: HTMLDivElement | null) => {
      node.current = el;
      if (typeof ref === "function") return ref(el);
      if (ref) ref.current = el;
    },
    [ref],
  );

  /* A quarter of the travel, starting nearer the trigger than the resting place. */
  const offset = (s: Side) => {
    const d = latest.current.travel / 4;
    return { x: s === "left" ? d : s === "right" ? -d : 0, y: s === "top" ? d : s === "bottom" ? -d : 0 };
  };

  /* Enter. Radix removes the inline `animation: none` once it has measured and placed the list, and until
     then the list sits off the page, so wait for that, then read the side it really opened on. */
  useEffect(() => {
    const el = node.current;
    if (!open || !el || !el.isConnected) return;
    let alive = true;
    let frame = 0;
    let runs: AnimationPlaybackControls[] = [];
    const start = () => {
      if (!alive) return;
      if (el.style.animationName === "none") {
        frame = requestAnimationFrame(start);
        return;
      }
      side.current = (el.dataset.side as Side | undefined) ?? "bottom";
      const { enter } = latest.current;
      /* Opened again while it was still leaving: carry on from where it is. */
      if (!entered.current) {
        const o = offset(side.current);
        x.jump(o.x);
        y.jump(o.y);
        scale.jump(om.grow);
        opacity.jump(0);
      }
      entered.current = true;
      runs = [animate(x, 0, enter), animate(y, 0, enter), animate(scale, 1, enter), animate(opacity, 1, enter)];
    };
    start();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      runs.forEach((r) => r.stop());
    };
  }, [open, x, y, scale, opacity]);

  /* Exit. The select holds this mounted (forceMount) until it is told the exit is done. */
  useEffect(() => {
    if (open || !leaving) return;
    let alive = true;
    const { exit } = latest.current;
    const o = offset(side.current);
    const runs = [
      animate(x, o.x, exit),
      animate(y, o.y, exit),
      animate(scale, om.grow, exit),
      animate(opacity, 0, {
        ...exit,
        onComplete: () => {
          if (alive) latest.current.onExited();
        },
      }),
    ];
    return () => {
      alive = false;
      runs.forEach((r) => r.stop());
    };
  }, [open, leaving, x, y, scale, opacity]);

  const glide = useGlide({ focusRows: true });
  const gp = glide.props;
  /* Opened by a pointer, no row is lit until the pointer moves or a key is pressed. */
  const quietRef = useRef(input.current === "pointer");
  const [quiet, setQuiet] = useState(quietRef.current);
  const touch = useRef(false);
  const wake = () => {
    if (!quietRef.current) return;
    quietRef.current = false;
    setQuiet(false);
  };
  const ctx: ListContext = { glide, quiet: quietRef, touch };

  const List = byWorld(useMaterial(), { press: PressList, flat: SelectFlatList, device: SelectDeviceList });
  const root: SelectListBodyProps["root"] = {
    ...rest,
    ref: setNode,
    "data-quiet": quiet,
    style: { ...style, x, y, scale, opacity, ...(open ? null : { pointerEvents: "none" as const }) },
    onPointerEnter: compose(rest.onPointerEnter, gp.onPointerEnter),
    onPointerLeave: compose(rest.onPointerLeave, gp.onPointerLeave),
    onPointerMoveCapture: compose(rest.onPointerMoveCapture, (e) => {
      if (e.pointerType !== "touch") wake();
      gp.onPointerMoveCapture(e);
    }),
    onPointerDownCapture: compose(rest.onPointerDownCapture, (e) => {
      touch.current = e.pointerType === "touch";
      /* A finger's press shows on the row itself (its own fill), so the glide does not light it as well. */
      if (!touch.current) gp.onPointerDownCapture(e);
    }),
    onKeyDownCapture: compose(rest.onKeyDownCapture, (e) => {
      wake();
      gp.onKeyDownCapture(e);
    }),
  };

  return (
    <ListCtx.Provider value={ctx}>
      <List root={root} flat={flat} glide={glide}>
        {options.map((o) => (
          <Row key={o.value} option={o} />
        ))}
      </List>
    </ListCtx.Provider>
  );
}

/* ----------------------------------------------------------------- select */

/**
 * The bare select: a trigger and its list, with no label. Use it in a toolbar or inline, and give it an aria-label
 * or aria-labelledby, because a placeholder is not a label. For a form field use SelectField.
 */
export function Select({
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  placeholder,
  size = "md",
  invalid = false,
  disabled,
  required,
  name,
  id,
  className = "",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: SelectProps) {
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");
  const overlayRoot = useOverlayRoot();
  const value = valueProp ?? innerValue;
  const pick = (next: string) => {
    setInnerValue(next);
    onValueChange?.(next);
  };

  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = openProp ?? innerOpen;
  const change = (next: boolean) => {
    setInnerOpen(next);
    onOpenChange?.(next);
  };

  /* Closing marks the list as leaving in the same render, so Radix never sees it unmounted before the exit has played. */
  const [prevOpen, setPrevOpen] = useState(open);
  const [leaving, setLeaving] = useState(false);
  if (prevOpen !== open) {
    setPrevOpen(open);
    setLeaving(!open);
  }

  const trigger = useRef<HTMLButtonElement | null>(null);
  const input = useRef<"key" | "pointer">("key");

  /* Focus goes back to the trigger as the list starts to leave, so the next key is meant for the trigger. */
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) trigger.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  /* Glass never sits on glass: is the trigger inside another floating surface? Found before the first paint. */
  const [flat, setFlat] = useState(false);
  useLayoutEffect(() => {
    if (open) setFlat(trigger.current?.closest(FLOATING) != null);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const done = useCallback(() => setLeaving(false), []);

  /* The step keys (Device): the neighbour among the options a hand can pick. Nothing picked, either key picks the first. */
  const Trigger = byWorld(useMaterial(), { press: PressTrigger, flat: SelectFlatTrigger, device: SelectDeviceTrigger });
  const pickable = options.filter((o) => !o.disabled);
  const at = pickable.findIndex((o) => o.value === value);
  const step = {
    canPrev: !disabled && pickable.length > 0 && at !== 0,
    canNext: !disabled && pickable.length > 0 && at !== pickable.length - 1,
    prev: () => pickable.length > 0 && pick(pickable[Math.max(at - 1, 0)].value),
    next: () => pickable.length > 0 && pick(pickable[Math.min(at + 1, pickable.length - 1)].value),
  };

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={pick}
      open={open}
      onOpenChange={change}
      disabled={disabled}
      required={required}
      name={name}
    >
      <Trigger
        root={{
          ref: trigger,
          id,
          "aria-label": ariaLabel,
          "aria-labelledby": ariaLabelledBy,
          "aria-describedby": ariaDescribedBy,
          "aria-invalid": invalid || undefined,
          onPointerDown: () => {
            input.current = "pointer";
          },
          onKeyDown: () => {
            input.current = "key";
          },
        }}
        size={size}
        className={className}
        invalid={invalid}
        disabled={!!disabled}
        open={open}
        selected={selected?.label}
        placeholder={placeholder}
        step={step}
      />

      <SelectPrimitive.Portal container={overlayRoot}>
        <SelectPrimitive.Content
          asChild
          position="popper"
          forceMount={leaving ? true : undefined}
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={8}
        >
          <Surface
            options={options}
            open={open}
            leaving={leaving}
            flat={flat}
            input={input}
            onExited={done}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
          />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/* ------------------------------------------------------------ select field */

export type SelectFieldProps = Omit<SelectProps, "invalid"> & {
  /** The label above the trigger. Required, because a placeholder is not a label. Clicking it focuses the trigger. */
  label: ReactNode;
  /** A hint under the field. An error replaces it. */
  help?: ReactNode;
  /** Shown in danger color and linked to the trigger with aria-describedby. Also sets aria-invalid. Say how to fix it. */
  error?: ReactNode;
};

/**
 * A labelled select. The label, the hint and the error are wired to the trigger for you, in the same layout as
 * TextField: label above, hint or error below. Pass name and it works in a form.
 */
export function SelectField({
  label,
  help,
  error,
  id: idProp,
  "aria-describedby": describedByProp,
  "aria-labelledby": labelledByProp,
  ...rest
}: SelectFieldProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const labelId = `${id}-label`;
  const noteId = `${id}-note`;
  const note = error ?? help;
  const describedBy = [describedByProp, note ? noteId : undefined].filter(Boolean).join(" ") || undefined;
  return (
    <div className="grid gap-2">
      {/* The label points at the trigger, but a click only moves focus: a label click would otherwise open the list. */}
      <label
        id={labelId}
        htmlFor={id}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById(id)?.focus();
        }}
        className={"text-small font-title " + (rest.disabled ? "text-fg-disabled" : "text-fg")}
      >
        {label}
      </label>
      <Select
        {...rest}
        id={id}
        invalid={!!error}
        aria-labelledby={[labelId, labelledByProp].filter(Boolean).join(" ")}
        aria-describedby={describedBy}
      />
      {note && (
        <p id={noteId} className={"text-small " + (error ? "text-danger" : "text-fg-subtle")}>
          {note}
        </p>
      )}
    </div>
  );
}
