/**
 * Tabs: underline or segmented, built on Radix Tabs (roles, arrow keys, Home
 * and End come from Radix; everything visual is ours).
 *
 * - Labels never change weight or size. Only the color changes (fg-subtle to
 *   fg), on the instant tier.
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
 * - Corners: rounded-control on tabs. The segmented track is rounded-control
 *   too, clipped with overflow-hidden, and its fill sits concentric inside the
 *   2px inset.
 */
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { AnimatePresence, LayoutGroup, motion, type Variants } from "motion/react";
import { useExit, useTransition, useTravel } from "@/motion";

export type TabsVariant = "underline" | "segmented";
export type TabsSize = "sm" | "md";

type Ctx = {
  value: string;
  variant: TabsVariant;
  size: TabsSize;
  /** +1 when the newest tab sits after the previous one, -1 before it. */
  dir: 1 | -1;
  register: (value: string, el: HTMLElement | null) => void;
};
const TabsContext = createContext<Ctx | null>(null);
function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs parts must be used inside <Tabs>");
  return ctx;
}

export type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  className?: string;
  children: ReactNode;
};

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
    <TabsContext.Provider value={{ value, variant, size, dir, register }}>
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

export function TabsList({ className = "", ...rest }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  const { variant, size } = useTabs();
  if (variant === "underline") {
    /* The hairline lives on the wrapper. The list overlaps it by 1px, so the
       2px indicator covers the hairline and nothing is clipped by the scroll. */
    return (
      <div className="border-b border-line">
        <TabsPrimitive.List
          className={"-mb-px flex w-full overflow-x-auto pb-px [scrollbar-width:none] " + className}
          {...rest}
        />
      </div>
    );
  }
  return (
    <TabsPrimitive.List
      className={
        "inline-flex w-fit max-w-full overflow-x-auto overflow-y-hidden rounded-control bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] p-0.5 shadow-[inset_0_0_0_1px_var(--line)] [scrollbar-width:none] " +
        (size === "sm" ? "h-control-sm " : "h-control-md ") +
        className
      }
      {...rest}
    />
  );
}

/** Concentric with the track: control radius minus the 2px inset. */
const FILL_RADIUS = "rounded-[calc(var(--radius-control)-2px)]"; // litt-allow: concentric inside the segmented track's 2px inset

const triggerBase =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none font-normal " +
  "text-fg-subtle transition-colors duration-(--dur-instant) ease-litt hover:text-fg data-[state=active]:text-fg " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

const triggerShape: Record<TabsVariant, Record<TabsSize, string>> = {
  underline: {
    md: "h-control-md rounded-control px-control-pad-md text-body",
    sm: "h-control-sm rounded-control px-control-pad-sm text-small",
  },
  segmented: {
    md: "h-full px-control-pad-md text-small " + FILL_RADIUS,
    sm: "h-full px-control-pad-sm text-caption " + FILL_RADIUS,
  },
};

export function TabsTrigger({
  value,
  className = "",
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  const { value: current, variant, size, register } = useTabs();
  const enter = useTransition("responsive");
  const active = current === value;
  const ref = useCallback((el: HTMLButtonElement | null) => register(value, el), [register, value]);

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={[triggerBase, triggerShape[variant][size], className].join(" ")}
      {...rest}
    >
      {active && (
        <motion.span
          layoutId="tabs-indicator"
          transition={enter}
          aria-hidden="true"
          className={
            variant === "underline"
              ? "absolute inset-x-0 -bottom-px h-0.5 bg-fg"
              : "absolute inset-0 bg-surface-1 shadow-[inset_0_0_0_1px_var(--line),var(--highlight)] " + FILL_RADIUS
          }
        />
      )}
      <span className="litt-trim relative">{children}</span>
    </TabsPrimitive.Trigger>
  );
}

/** The positioned box the panels live in. Put the shared min-height here. */
export function TabsPanels({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={"relative " + className}>{children}</div>;
}

export function TabsPanel({
  value,
  className = "",
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const { value: current, dir } = useTabs();
  const enter = useTransition("responsive");
  const exit = useExit("responsive");
  const travel = useTravel();

  const variants: Variants = {
    in: (d: 1 | -1) => ({ opacity: 0, x: d * (travel / 2) }),
    show: { opacity: 1, x: 0, transition: enter },
    out: (d: 1 | -1) => ({ opacity: 0, x: -d * (travel / 4), transition: exit }),
  };

  return (
    <AnimatePresence initial={false} mode="popLayout" custom={dir}>
      {current === value && (
        <TabsPrimitive.Content key={value} value={value} forceMount asChild>
          <motion.div
            custom={dir}
            variants={variants}
            initial="in"
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
