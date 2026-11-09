/**
 * Tabs: underline or segmented, built on Radix Tabs (roles, arrow keys, Home
 * and End come from Radix; everything visual is ours).
 *
 * - Labels sit at the title weight (R8) and never change weight or size. Only the color
 *   changes (fg-subtle to fg), on the instant tier.
 * - The indicator (a 2px underline, or the segmented fill block) slides
 *   between tabs with Motion layoutId on the responsive tier. It moves through
 *   transform, so it is allowed.
 * - Panels crossfade. The incoming panel fades in and travels travel/2 from
 *   the side of the tab that was just chosen (right if the new tab sits to the
 *   right of the old one, left if it sits to the left). The outgoing panel
 *   leaves with useExit and drifts travel/4 the other way. It is taken out of
 *   the flow while it leaves (popLayout), so the two never stack and the page
 *   below does not jump. Give panels a shared min-height to keep it still when
 *   their content differs.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): the chosen face (Press's raised tab or block, Flat's
 *   bubble) glides on fun mode's glide spring instead of the responsive one. It rests exactly as it does without fun
 *   mode. Reduced motion turns it off.
 * - Bodies (proposals/worlds.md): this file keeps the contract (value, variant, size, direction, the roles, the roving
 *   focus and arrow keys, which Radix supplies) and Press's body. It resolves each piece into TabsListBodyProps and
 *   TabsTriggerBodyProps and picks a body by the material on <html> (byWorld, useMaterial).
 *   - Press, the instrument. Underline is folder tabs cut from the top edge of a plate: the panel is the plate
 *     (--block, --plate-lift), the chosen tab stands forward in the plate's own face, lit on its top edge and open at its
 *     foot, so it and the panel are one lit surface; the others sit lower in --tray, seated, a shade darker. Segmented is
 *     blocks in a tray (--tray, --tray-shade): the others seated flush, the chosen one raised (--block, --block-lift) and
 *     gliding. A tab under the hand sinks --press-depth (--block-press).
 *   - Flat's words with a grey pill behind the chosen one is bodies/tabs.flat.tsx; Device's engraved legends, a lamp under
 *     the current one that switches on in place (and, segmented, a row of keys on one skirt with the current one latched
 *     down) is bodies/tabs.device.tsx. Only Press's and Flat's faces glide.
 * - Touch: there is no hover, so on a coarse pointer a tab that is held down fills and takes
 *   the --fg text (PRESS, color only, instant tier). The box never moves, and the OS tap flash
 *   is off so the two do not double. Small tabs grow to the control-md height on a coarse
 *   pointer, so no touch target is under 44px: the underline tab itself, and the segmented
 *   track (the same track Segmented uses there).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { AnimatePresence, LayoutGroup, motion, type Variants } from "motion/react";
import { byWorld, useExit, useFun, useMaterial, useTransition, useTravel } from "@/motion";
import { TabsListFlatBody, TabsTriggerFlatBody } from "./bodies/tabs.flat";
import { TabsListDeviceBody, TabsTriggerDeviceBody } from "./bodies/tabs.device";

export type TabsVariant = "underline" | "segmented";
export type TabsSize = "sm" | "md";

type Ctx = {
  value: string;
  variant: TabsVariant;
  size: TabsSize;
  /** +1 when the newest tab sits after the previous one, -1 before it. */
  dir: 1 | -1;
  register: (value: string, el: HTMLElement | null) => void;
  triggers: RefObject<Map<string, HTMLElement>>;
};
const TabsContext = createContext<Ctx | null>(null);
function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs parts must be used inside <Tabs>");
  return ctx;
}

export type TabsProps = {
  /** The selected tab, when you control it. Pair it with onValueChange. */
  value?: string;
  /** The tab that starts selected when you do not control it. Pass one, because the default selects none and no panel shows. */
  defaultValue?: string;
  /** Called with the new tab's value each time the selected tab changes, by click, tap or key. */
  onValueChange?: (value: string) => void;
  /** Underline puts a 2px line under the selected tab. Segmented puts a filled block in a track, for view switches. */
  variant?: TabsVariant;
  /** Height on the shared control scale: sm is 32, md is 44. Use sm in dense UI and md everywhere else. On a coarse pointer sm grows to 44. */
  size?: TabsSize;
  /** Extra classes for the root, such as a width. */
  className?: string;
  /** A TabsList and a TabsPanels. */
  children: ReactNode;
};

/** The root. It holds the selected tab and passes the variant and size to the other parts. */
export function Tabs({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  variant = "underline",
  size = "md",
  className = "",
  children,
}: TabsProps) {
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const group = useId();

  /* Trigger elements, so the direction can come from their DOM order. */
  const triggers = useRef(new Map<string, HTMLElement>());
  const register = useCallback((v: string, el: HTMLElement | null) => {
    if (el) triggers.current.set(v, el);
    else triggers.current.delete(v);
  }, []);

  /* Derive the direction while rendering, so panels get it in the same pass as
     the new value, whether the value is controlled or not. */
  const [seen, setSeen] = useState(value);
  const [dir, setDir] = useState<1 | -1>(1);
  if (seen !== value) {
    setSeen(value);
    const from = triggers.current.get(seen);
    const to = triggers.current.get(value);
    if (from && to) setDir(from.compareDocumentPosition(to) & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : -1);
  }

  return (
    <TabsContext.Provider value={{ value, variant, size, dir, register, triggers }}>
      <LayoutGroup id={group}>
        <TabsPrimitive.Root
          value={value}
          onValueChange={(v) => {
            setInner(v);
            onValueChange?.(v);
          }}
          className={"min-w-0 " + className}
        >
          {children}
        </TabsPrimitive.Root>
      </LayoutGroup>
    </TabsContext.Provider>
  );
}

/** What a list body gets from the contract: the variant and size, the extra classes, and the tablist's own attributes. A body adds its look and its data-body, and nothing else about what the list is. */
export type TabsListBodyProps = {
  variant: TabsVariant;
  size: TabsSize;
  className: string;
  rootProps: ComponentPropsWithoutRef<typeof TabsPrimitive.List>;
};

/** Press's list: the row of folder tabs standing on the plate's top edge (underline), or a tray of blocks (segmented). */
function PressListBody({ variant, size, className, rootProps }: TabsListBodyProps) {
  if (variant === "underline") {
    /* The row sits 1px into the plate (-mb-px), above it (z-10), so the chosen tab's face, which runs to the row's foot,
       covers the plate's lit top edge and ring under it: tab and plate are one surface. The 1px of padding keeps the
       tab's ring from being clipped by the scroll. */
    return (
      <div data-body="press" className="relative z-10 -mb-px">
        <TabsPrimitive.List
          className={"-mx-px flex w-[calc(100%+2px)] items-end gap-0.5 overflow-x-auto px-px pt-px [scrollbar-width:none] " + className}
          {...rootProps}
        />
      </div>
    );
  }
  return (
    <TabsPrimitive.List
      data-body="press"
      className={
        "inline-flex w-fit max-w-full gap-0.5 overflow-x-auto overflow-y-hidden rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border [scrollbar-width:none] " +
        (size === "sm" ? "h-control-sm pointer-coarse:h-control-md " : "h-control-md ") +
        className
      }
      {...rootProps}
    />
  );
}

/** The row of tabs. It is a named group, so give it an aria-label. */
export function TabsList({ className = "", ...rest }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  const { variant, size } = useTabs();
  const Body = byWorld(useMaterial(), { press: PressListBody, flat: TabsListFlatBody, device: TabsListDeviceBody });
  return <Body variant={variant} size={size} className={className} rootProps={rest} />;
}

/** Concentric with the track: control radius minus the 2px inset. */
const FILL_RADIUS = "rounded-[calc(var(--radius-control)-2px)]"; // litt-allow: concentric inside the segmented track's 2px inset

/* isolate: the faces sit at -z-10 inside the tab, behind the label and the focus ring. The chosen tab is above its
   neighbours (z-10), so its face glides over them whichever way it goes. */
const triggerBase =
  "litt-target group/tab relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none font-title " +
  "text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg data-[state=active]:z-10 data-[state=active]:text-fg " +
  "[-webkit-tap-highlight-color:transparent] enabled:pointer-coarse:active:text-fg " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/* The radius is the body's: Press's tab is cut square at its foot, its segment is concentric with the tray. */
const triggerShape: Record<TabsVariant, Record<TabsSize, string>> = {
  underline: {
    md: "h-control-md px-control-pad-md text-body",
    sm: "h-control-sm pointer-coarse:h-control-md px-control-pad-sm text-small",
  },
  segmented: {
    md: "h-full px-control-pad-md text-small",
    sm: "h-full px-control-pad-sm text-caption pointer-coarse:text-small",
  },
};

type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  /** Which tab this is. Match it to the value of its TabsPanel. */
  value: string;
};

/** What a trigger body gets from the contract: the tab's value, its geometry on the control scale (without a radius), whether the sliding face belongs on this tab, and the button's attributes. A body adds its look, its radius and its data-body; the selected state is Radix's (aria-selected, data-state). */
export type TabsTriggerBodyProps = {
  value: string;
  variant: TabsVariant;
  size: TabsSize;
  /** The size and padding classes the control scale gives this variant and size. */
  shapeClass: string;
  /** Whether the sliding face (Press's raised tab or block, Flat's bubble) belongs on this tab: it is the selected one. */
  active: boolean;
  /** The spring the face slides on. */
  enter: ReturnType<typeof useTransition>;
  className: string;
  triggerRef: (el: HTMLButtonElement | null) => void;
  rootProps: Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>, "value" | "className" | "children">;
  children: ReactNode;
};

/* A segment under the hand sinks the --press-depth with the pressed cast; on touch the held tab shows it too. */
const SINK = "group-active/tab:translate-y-(--press-depth) group-active/tab:shadow-(--block-press)";

/** Press's tab: a folder tab cut from the plate's top edge (underline) or a block seated in the tray (segmented). */
function PressTriggerBody({ value, variant, shapeClass, active, enter, className, triggerRef, rootProps, children }: TabsTriggerBodyProps) {
  const underline = variant === "underline";
  return (
    <TabsPrimitive.Trigger
      ref={triggerRef}
      value={value}
      data-body="press"
      className={[triggerBase, shapeClass, underline ? "rounded-t-control" : FILL_RADIUS, className].join(" ")}
      {...rootProps}
    >
      {/* Every tab has its seated face: a tab a shade darker and lower than the plate, or a block flush with the tray. */}
      <span
        aria-hidden="true"
        className={
          (underline
            ? "absolute inset-x-0 top-1 bottom-0.5 -z-10 rounded-t-control bg-tray shadow-(--tray-shade) forced-colors:border group-hover/tab:bg-[color-mix(in_oklab,var(--tray),var(--fg)_4%)] group-active/tab:translate-y-(--press-depth) "
            : "absolute inset-0 -z-10 bg-[color-mix(in_oklab,var(--block),var(--tray)_55%)] group-hover/tab:bg-[color-mix(in_oklab,var(--block),var(--tray)_30%)] " + FILL_RADIUS + " ") +
          "transition-colors duration-(--dur-instant) ease-litt"
        }
      />
      {active && (
        <motion.span
          layoutId="tabs-indicator"
          transition={enter}
          aria-hidden="true"
          className={
            underline
              ? /* Standing forward: the plate's own face, lit on its top edge, open at its foot (the cast below is clipped). */
                "absolute inset-x-0 top-0 bottom-0 -z-10 rounded-t-control bg-block shadow-(--plate-lift) [clip-path:inset(-4px_-4px_0_-4px)] forced-colors:border forced-colors:border-b-0 forced-colors:border-[Highlight] forced-colors:[forced-color-adjust:none]"
              : "absolute inset-0 -z-10 bg-block [box-shadow:var(--highlight),var(--block-lift)] forced-colors:border forced-colors:border-[Highlight] " + FILL_RADIUS + " " + SINK
          }
        />
      )}
      <span className={"litt-trim relative" + (underline && !active ? " translate-y-0.5" : "")}>{children}</span>
    </TabsPrimitive.Trigger>
  );
}

/** One tab. Its label only changes color, so the tab never moves or resizes. */
export function TabsTrigger({
  value,
  className = "",
  children,
  ...rest
}: TabsTriggerProps) {
  const { value: current, variant, size, register } = useTabs();
  const responsive = useTransition("responsive");
  const material = useMaterial();
  /* Fun mode: the chosen face glides on the glide spring. */
  const fun = useFun();
  const enter = fun ? fun.glide : responsive;
  const active = current === value;
  const ref = useCallback((el: HTMLButtonElement | null) => register(value, el), [register, value]);
  const Body = byWorld(material, { press: PressTriggerBody, flat: TabsTriggerFlatBody, device: TabsTriggerDeviceBody });

  return (
    <Body
      value={value}
      variant={variant}
      size={size}
      shapeClass={triggerShape[variant][size]}
      active={active}
      enter={enter}
      className={className}
      triggerRef={ref}
      rootProps={rest}
    >
      {children}
    </Body>
  );
}

/** The positioned box the panels live in. Put the shared min-height here. */
export function TabsPanels({
  className = "",
  children,
}: {
  /** Extra classes for the box, such as a shared min-height and padding. */
  className?: string;
  /** The TabsPanel for each tab. */
  children: ReactNode;
}) {
  const { variant } = useTabs();
  /* Press's underline tabs stand on a plate: the panel box is that plate (the chosen tab joins it), square at the corner
     the first tab stands on. Every other body, and the segmented variant, leaves the panel bare. */
  const plate = useMaterial() === "press" && variant === "underline";
  return (
    <div
      data-body={plate ? "press" : undefined}
      className={"relative " + (plate ? "rounded-surface rounded-tl-none bg-block pb-4 shadow-(--plate-lift) forced-colors:border " : "") + className}
    >
      {children}
    </div>
  );
}

/** The content for one tab. Only the selected panel is mounted, so state inside the others resets when you leave them. */
export function TabsPanel({
  value,
  className = "",
  tabIndex,
  children,
}: {
  /** Which tab this panel belongs to. Match it to the value of its TabsTrigger. */
  value: string;
  /** Extra classes for this panel. */
  className?: string;
  /** The panel is a Tab stop by default. Pass -1 when it starts with its own focusable content, so it is not an extra stop. */
  tabIndex?: number;
  /** What shows when this tab is selected. */
  children: ReactNode;
}) {
  const { value: current, dir } = useTabs();
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();

  /* The first panel appears without a fade. Not through AnimatePresence initial={false}: that reaches
     every motion component inside the panel and swallows their own entrances, such as a list cascade. */
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  const variants: Variants = {
    in: (d: 1 | -1) => ({ opacity: 0, x: d * (travel / 2) }),
    show: { opacity: 1, x: 0, transition: enter },
    out: (d: 1 | -1) => ({ opacity: 0, x: -d * (travel / 4), transition: exit }),
  };

  return (
    <AnimatePresence mode="popLayout" custom={dir}>
      {current === value && (
        <TabsPrimitive.Content key={value} value={value} forceMount asChild {...(tabIndex === undefined ? {} : { tabIndex })}>
          <motion.div
            custom={dir}
            variants={variants}
            initial={mounted.current ? "in" : false}
            animate="show"
            exit="out"
            className={"data-[state=inactive]:pointer-events-none " + className}
          >
            {children}
          </motion.div>
        </TabsPrimitive.Content>
      )}
    </AnimatePresence>
  );
}
