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
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): the underline stretches to the new tab. Its
 *   leading edge goes on fun mode's glide spring and its trailing edge follows on the slower swap spring, so it
 *   reaches out and gathers itself under the tab. While it travels, one line drawn across the list does the moving
 *   (x and a scale from its start, transform only); at rest the tab's own indicator is back, so it rests exactly as
 *   it does without fun mode. The segmented fill glides on the glide spring, as Segmented's surface does. Reduced
 *   motion turns it off.
 * - Corners: rounded-control on tabs. The segmented track is a sunken tray (R3: --tray, --tray-shade) at the
 *   control radius, clipped with overflow-hidden, and its fill is the raised block (--block, --block-lift), concentric
 *   inside the 2px inset: selected is raised, as in Segmented and the Switch.
 * - Flat (proposals/flat-pill.md): no hairline and no track. The chosen tab is a grey bubble (--block) at the control radius, the
 *   others are --fg-muted words, for both variants. Under forced colors the bubble is an outline, as the segmented fill is.
 * - Bodies (proposals/worlds.md): this file keeps the contract (value, variant, size, direction, the roles, the roving
 *   focus and arrow keys, which Radix supplies) and Press's body, the underline that glides. It resolves each piece into
 *   TabsListBodyProps and TabsTriggerBodyProps and picks a body by the material on <html> (byWorld, useMaterial). Flat's
 *   grey bubble is bodies/tabs.flat.tsx; Device's engraved legends, a lamp under the current one that switches on in
 *   place (and, segmented, a row of keys on one skirt with the current one latched down) is bodies/tabs.device.tsx.
 *   Fun mode's travelling underline is Press's alone; the other bodies never glide.
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
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { animate, AnimatePresence, LayoutGroup, motion, useMotionValue, useTransform, type Variants } from "motion/react";
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
  /** Fun mode: the tab the underline is leaving, while it travels, and where it is going. Null at rest. */
  travel: { from: string; to: string } | null;
  /** Fun mode: the underline has arrived. */
  arrived: () => void;
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
  /* Fun mode's underline: set in the same pass as the new value, so the tab's own indicator never shows at the new tab
     before the travelling line has started from the old one. */
  const fun = useFun();
  const material = useMaterial();
  const [travel, setTravel] = useState<{ from: string; to: string } | null>(null);
  const arrived = useCallback(() => setTravel(null), []);
  if (travel && !fun) setTravel(null); // fun mode turned off mid-travel: nothing is travelling any more
  if (seen !== value) {
    setSeen(value);
    const from = triggers.current.get(seen);
    const to = triggers.current.get(value);
    if (from && to) setDir(from.compareDocumentPosition(to) & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : -1);
    if (fun && material === "press" && variant === "underline" && from && to) setTravel({ from: travel?.from ?? seen, to: value });
  }

  return (
    <TabsContext.Provider value={{ value, variant, size, dir, register, travel, arrived, triggers }}>
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

/**
 * Fun mode's travelling underline: one line across the list, from the tab it leaves to the tab it goes to. The edge on
 * the side it is going leads on the glide spring and the other trails on the swap spring. It is drawn only while it
 * travels; when both edges arrive it hands back to the tab's own indicator.
 */
function TravellingLine({ list }: { list: RefObject<HTMLDivElement | null> }) {
  const { travel, arrived, triggers } = useTabs();
  const fun = useFun();
  const start = useMotionValue(0);
  const end = useMotionValue(0);
  const scaleX = useTransform(() => end.get() - start.get());
  const from = useRef<{ start: number; end: number } | null>(null);

  /* Where a tab's indicator sits, in the list's own coordinates (it scrolls with the tabs). */
  const span = (el: HTMLElement) => {
    const box = list.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const left = r.left - box.left - list.current!.clientLeft + list.current!.scrollLeft;
    return { start: left, end: left + r.width };
  };

  useLayoutEffect(() => {
    if (!travel || !fun || !list.current) return;
    const a = triggers.current.get(travel.from);
    const b = triggers.current.get(travel.to);
    if (!a || !b) return arrived();
    /* Caught mid-travel: carry on from where the line is now. */
    const was = from.current ?? span(a);
    if (!from.current) {
      start.jump(was.start);
      end.jump(was.end);
    }
    const to = span(b);
    from.current = to;
    const forward = to.start > start.get();
    const s = animate(start, to.start, forward ? fun.swap : fun.glide);
    const e = animate(end, to.end, forward ? fun.glide : fun.swap);
    let live = true;
    void Promise.all([s, e]).then(() => {
      if (!live) return;
      from.current = null;
      arrived();
    });
    return () => {
      live = false;
      s.stop();
      e.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs for each new destination
  }, [travel?.to]);

  if (!travel || !fun) return null;
  return <motion.span aria-hidden="true" className="in-[[data-material=flat]]:hidden pointer-events-none absolute bottom-0 left-0 z-10 h-0.5 w-px origin-left bg-fg" style={{ x: start, scaleX }} />;
}

/** What a list body gets from the contract: the variant and size, the extra classes, and the tablist's own attributes. A body adds its look and its data-body, and nothing else about what the list is. */
export type TabsListBodyProps = {
  variant: TabsVariant;
  size: TabsSize;
  className: string;
  rootProps: ComponentPropsWithoutRef<typeof TabsPrimitive.List>;
};

/** Press's body: a hairline under the row (underline), or a sunken track (segmented). Fun mode's travelling line lives here. */
function PressListBody({ variant, size, className, rootProps }: TabsListBodyProps) {
  const fun = useFun();
  const list = useRef<HTMLDivElement>(null);
  if (variant === "underline") {
    /* The hairline lives on the wrapper. The list overlaps it by 1px, so the
       2px indicator covers the hairline and nothing is clipped by the scroll. */
    return (
      <div data-body="press" className="border-b border-line in-[[data-material=flat]]:border-b-0">
        {fun ? (
          /* Fun mode: the list is the travelling line's box, and holds it after the tabs. */
          <TabsPrimitive.List
            ref={list}
            className={"relative -mb-px flex w-full overflow-x-auto pb-px in-[[data-material=flat]]:gap-1 [scrollbar-width:none] " + className}
            {...rootProps}
          >
            {rootProps.children}
            <TravellingLine list={list} />
          </TabsPrimitive.List>
        ) : (
          <TabsPrimitive.List
            className={"-mb-px flex w-full overflow-x-auto pb-px in-[[data-material=flat]]:gap-1 [scrollbar-width:none] " + className}
            {...rootProps}
          />
        )}
      </div>
    );
  }
  return (
    <TabsPrimitive.List
      data-body="press"
      className={
        "inline-flex w-fit max-w-full overflow-x-auto overflow-y-hidden rounded-control bg-tray p-0.5 shadow-(--tray-shade) [scrollbar-width:none] " +
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

/* What a finger holding a tab shows: the fg 6% fill that rows and segments share, and the hover text color.
   `enabled:` keeps a disabled tab dead. The indicator sits above this fill, so a selected tab's surface covers it. */
const PRESS =
  "[-webkit-tap-highlight-color:transparent] " +
  "enabled:pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] enabled:pointer-coarse:active:text-fg";

/* Flat: the words are --fg-muted until chosen. */
const F_MUTED = "in-[[data-material=flat]]:text-fg-muted in-[[data-material=flat]]:hover:text-fg in-[[data-material=flat]]:data-[state=active]:text-fg";

/* isolate: the indicator sits at -z-10 inside the tab, behind the label and the focus ring. */
const triggerBase =
  "litt-target relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none font-title " +
  "text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg data-[state=active]:text-fg " +
  F_MUTED + " " +
  PRESS + " " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

const triggerShape: Record<TabsVariant, Record<TabsSize, string>> = {
  underline: {
    md: "h-control-md rounded-control px-control-pad-md text-body",
    sm: "h-control-sm pointer-coarse:h-control-md rounded-control px-control-pad-sm text-small",
  },
  segmented: {
    md: "h-full px-control-pad-md text-small " + FILL_RADIUS,
    sm: "h-full px-control-pad-sm text-caption pointer-coarse:text-small " + FILL_RADIUS,
  },
};

type TabsTriggerProps = ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  /** Which tab this is. Match it to the value of its TabsPanel. */
  value: string;
};

/** What a trigger body gets from the contract: the tab's value, its geometry on the control scale, whether the Press and Flat indicator is drawn on it, and the button's attributes. A body adds its look and its data-body; the selected state is Radix's (aria-selected, data-state). */
export type TabsTriggerBodyProps = {
  value: string;
  variant: TabsVariant;
  size: TabsSize;
  /** The size and padding classes the control scale gives this variant and size. */
  shapeClass: string;
  /** Whether the sliding indicator belongs on this tab now (it is the selected one, and fun mode's line is not carrying it). */
  active: boolean;
  /** Fun mode's travelling line draws the underline, so the tab's own indicator has no layoutId. */
  line: boolean;
  /** The spring the indicator slides on. */
  enter: ReturnType<typeof useTransition>;
  className: string;
  triggerRef: (el: HTMLButtonElement | null) => void;
  rootProps: Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>, "value" | "className" | "children">;
  children: ReactNode;
};

/** Press's body: the label, and a 2px line (or a raised block in the track) that glides behind it. */
function PressTriggerBody({ value, variant, shapeClass, active, line, enter, className, triggerRef, rootProps, children }: TabsTriggerBodyProps) {
  return (
    <TabsPrimitive.Trigger
      ref={triggerRef}
      value={value}
      data-body="press"
      className={[triggerBase, shapeClass, className].join(" ")}
      {...rootProps}
    >
      {active && (
        <motion.span
          layoutId={line ? undefined : "tabs-indicator"}
          transition={enter}
          aria-hidden="true"
          className={
            variant === "underline"
              ? "absolute inset-x-0 -bottom-px -z-10 h-0.5 bg-fg forced-colors:bg-[Highlight] forced-colors:[forced-color-adjust:none] " +
              /* Flat: the line becomes a grey bubble; under forced colors it is a Highlight outline, not a fill. */
              "in-[[data-material=flat]]:inset-y-0 in-[[data-material=flat]]:h-auto in-[[data-material=flat]]:rounded-control in-[[data-material=flat]]:bg-block in-[[data-material=flat]]:forced-colors:bg-transparent in-[[data-material=flat]]:forced-colors:border-2 in-[[data-material=flat]]:forced-colors:border-[Highlight]"
              : "absolute inset-0 -z-10 bg-block shadow-(--block-lift) forced-colors:border " + FILL_RADIUS
          }
        />
      )}
      <span className="litt-trim relative">{children}</span>
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
  const { value: current, variant, size, register, travel } = useTabs();
  const responsive = useTransition("responsive");
  const material = useMaterial();
  /* Fun mode: the segmented fill glides on the glide spring; the underline is drawn by the travelling line until it
     arrives, and has no layoutId, so it never animates on its own when it comes back. Only Press draws that line. */
  const fun = useFun();
  const enter = fun ? fun.glide : responsive;
  const line = !!fun && variant === "underline" && material === "press";
  const active = current === value && !(line && travel);
  const ref = useCallback((el: HTMLButtonElement | null) => register(value, el), [register, value]);
  const Body = byWorld(material, { press: PressTriggerBody, flat: TabsTriggerFlatBody, device: TabsTriggerDeviceBody });

  return (
    <Body
      value={value}
      variant={variant}
      size={size}
      shapeClass={triggerShape[variant][size]}
      active={active}
      line={line}
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
  return <div className={"relative " + className}>{children}</div>;
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
