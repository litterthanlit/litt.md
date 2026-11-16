/**
 * Tabs, the Rack body (proposals/rack.md): square keys along a strip, the chosen one lit. Nothing slides.
 *
 * - Underline: a row of keys, each a flat box in a 1px outline (--block with --block-lift) at the control radius, a
 *   hair apart (4px), over a 1px rule (--line) that runs the width of the strip. The chosen key is lit in the ink
 *   (--fg, with the canvas for words), never the accent (R6), and the rest are --fg-subtle words, --fg on hover. The
 *   words keep their weight and size, so no key changes width when chosen.
 * - Segmented: one box in a 1px outline (--tray, --tray-shade) divided by 1px rules, the chosen key lit in the ink, as the
 *   Segmented control is in this world. It is the same chooser, in a tab list.
 * - Motion: nothing travels between tabs. The fill and the words change on the frame (the instant tier); no underline
 *   glides, no face crosses. Reduced motion zeroes the tier.
 * - Forced colors: real borders on the keys and the box, and Highlight with HighlightText on the chosen key.
 * - The contract (value, variant, size, the roles, roving focus, arrow keys, the touch fill) is tabs.tsx's.
 */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { TabsListBodyProps, TabsTriggerBodyProps } from "@/components/tabs";

/** The row: a rule under the keys (underline), or one outlined box the keys divide (segmented). */
export function TabsListRackBody({ variant, size, className, rootProps }: TabsListBodyProps) {
  if (variant === "underline") {
    return (
      <div data-body="rack" className="border-b border-line">
        <TabsPrimitive.List className={"-mb-px flex w-full gap-1 overflow-x-auto px-px pt-px pb-2 [scrollbar-width:none] " + className} {...rootProps} />
      </div>
    );
  }
  return (
    <TabsPrimitive.List
      data-body="rack"
      className={
        "inline-flex w-fit max-w-full overflow-x-auto overflow-y-hidden rounded-control bg-tray shadow-(--tray-shade) forced-colors:border [scrollbar-width:none] " +
        (size === "sm" ? "h-control-sm pointer-coarse:h-control-md " : "h-control-md ") +
        className
      }
      {...rootProps}
    />
  );
}

const base =
  "litt-target relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none font-title " +
  "[-webkit-tap-highlight-color:transparent] transition-colors duration-(--dur-instant) ease-litt " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/* The geometry, on the control scale, the same as the other worlds' tabs. */
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

/* A key in the strip: a box in an outline, lit when chosen. Each state is its own string, so no two fills meet. */
const keyOff =
  "rounded-control bg-block text-fg-subtle shadow-(--block-lift) hover:bg-(--block-hover) hover:text-fg enabled:pointer-coarse:active:text-fg " +
  "disabled:bg-surface-2 disabled:shadow-[inset_0_0_0_1px_var(--line)] forced-colors:border";
const keyOn =
  "rounded-control bg-fg text-canvas shadow-(--block-lift) forced-colors:border forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";

/* A key in the box: no outline of its own, a rule on its left edge, lit when chosen. */
const cellOff =
  "rounded-none text-fg-subtle hover:text-fg enabled:pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] enabled:pointer-coarse:active:text-fg";
const cellOn = "rounded-none bg-fg text-canvas forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";

/** One tab: a key. The selected state is Radix's data-state. */
export function TabsTriggerRackBody({ value, variant, size, active, className, triggerRef, rootProps, children }: TabsTriggerBodyProps) {
  const underline = variant === "underline";
  const look = underline ? (active ? keyOn : keyOff) : active ? cellOn : cellOff;
  return (
    <TabsPrimitive.Trigger
      ref={triggerRef}
      value={value}
      data-body="rack"
      className={[base, shape[variant][size], look, underline ? "" : "border-l border-line first:border-l-0 forced-colors:border-l-[CanvasText]", className].join(" ")}
      {...rootProps}
    >
      <span className="litt-trim relative">{children}</span>
    </TabsPrimitive.Trigger>
  );
}
