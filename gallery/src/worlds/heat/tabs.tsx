/**
 * Tabs, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a flat square menu strip whose active tab
 * snaps into four 8px amber corner brackets with `‹ label ›` chevrons. Nothing slides.
 *
 * - Underline: a row of flat square cells sitting on a 1px `--line` rule; unselected tabs stay quiet in `--fg-muted`,
 *   and the active tab takes `--surface-1`, `--accent-text` and four 8px amber corner brackets.
 * - Segmented: one square bordered slab (`bg-canvas border border-line`) divided by 1px rules, the active cell lit in
 *   `--block` with `--accent-text` and four 8px corner brackets.
 * - Instant cuts only (`duration-(--dur-instant) ease-litt`), forced colors keeps borders and Highlight.
 * - The contract (value, variant, size, roles, roving focus, arrow keys) is tabs.tsx's.
 */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { TabsListBodyProps, TabsTriggerBodyProps } from "@/components/tabs";

/* Four 8px corner marks in amber (--accent-text) on the active tab. */
const brackets =
  "pointer-events-none absolute inset-0 bg-no-repeat text-accent-text " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

/** The row: flat square cells over a 1px rule (underline), or a bordered dark strip (segmented). */
export function TabsListHeatBody({ variant, size, className, rootProps }: TabsListBodyProps) {
  if (variant === "underline") {
    return (
      <div data-body="heat" className="border-b border-line">
        <TabsPrimitive.List className={"flex w-full gap-1 overflow-x-auto pb-1 [scrollbar-width:none] " + className} {...rootProps} />
      </div>
    );
  }
  return (
    <TabsPrimitive.List
      data-body="heat"
      className={
        "inline-flex w-fit max-w-full overflow-x-auto overflow-y-hidden rounded-none border border-line bg-canvas forced-colors:border [scrollbar-width:none] " +
        (size === "sm" ? "h-control-sm pointer-coarse:h-control-md " : "h-control-md ") +
        className
      }
      {...rootProps}
    />
  );
}

const base =
  "litt-target relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-none whitespace-nowrap select-none font-title " +
  "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

const shape = {
  underline: {
    md: "h-control-md px-control-pad-md text-body",
    sm: "h-control-sm pointer-coarse:h-control-md px-control-pad-sm text-small",
  },
  segmented: {
    md: "h-full px-control-pad-md text-small",
    sm: "h-full px-control-pad-sm text-caption pointer-coarse:text-small",
  },
};

const underOff = "bg-transparent text-fg-muted hover:bg-surface-1 hover:text-fg";
const underOn = "bg-surface-1 text-accent-text forced-colors:border forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";
const segOff = "bg-canvas text-fg-muted hover:bg-surface-1 hover:text-fg";
const segOn = "bg-block text-accent-text forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";

/** One tab: flat square cell, framed in amber corner brackets with chevrons while active. */
export function TabsTriggerHeatBody({ value, variant, size, active, className, triggerRef, rootProps, children }: TabsTriggerBodyProps) {
  const underline = variant === "underline";
  const look = underline ? (active ? underOn : underOff) : active ? segOn : segOff;
  return (
    <TabsPrimitive.Trigger
      ref={triggerRef}
      value={value}
      data-body="heat"
      className={[base, shape[variant][size], look, underline ? "" : "border-l border-line first:border-l-0 forced-colors:border-l-[CanvasText]", className].join(" ")}
      {...rootProps}
    >
      {active && <span aria-hidden="true" className={brackets} />}
      {active && <span aria-hidden="true">‹</span>}
      <span className="litt-trim relative">{children}</span>
      {active && <span aria-hidden="true">›</span>}
    </TabsPrimitive.Trigger>
  );
}
