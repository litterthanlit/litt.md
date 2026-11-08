/**
 * Tabs, Flat's body (proposals/worlds.md, Bodies; proposals/flat-pill.md): a grey bubble that glides behind the chosen
 * label. No hairline and no track: the words are --fg-muted until chosen and --fg when they are, for both variants.
 *
 * - Underline becomes the bubble: the indicator is --block (--surface-3 under Flat) at the control radius, behind the
 *   label, sliding between tabs with layoutId on the responsive tier (transform only). Under forced colors it is a
 *   Highlight outline, not a fill.
 * - Segmented keeps its track and fill, which the Flat tokens flatten: the track is no tray and the fill casts nothing.
 * - Nothing here is lifted by light or shade (R2, R3). Fun mode's travelling underline is Press's alone; the bubble
 *   glides on the glide spring instead.
 * - The contract (value, variant, size, the roles, roving focus, arrow keys, the touch fill) is tabs.tsx's. This file
 *   only says what the tab is made of.
 */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";
import type { TabsListBodyProps, TabsTriggerBodyProps } from "../tabs";

/** The row: no hairline, tabs a gap apart (underline), or the flattened track (segmented). */
export function TabsListFlatBody({ variant, size, className, rootProps }: TabsListBodyProps) {
  if (variant === "underline") {
    return (
      <div data-body="flat">
        <TabsPrimitive.List className={"-mb-px flex w-full gap-1 overflow-x-auto pb-px [scrollbar-width:none] " + className} {...rootProps} />
      </div>
    );
  }
  return (
    <TabsPrimitive.List
      data-body="flat"
      className={
        "inline-flex w-fit max-w-full overflow-x-auto overflow-y-hidden rounded-control bg-tray p-0.5 shadow-(--tray-shade) [scrollbar-width:none] " +
        (size === "sm" ? "h-control-sm pointer-coarse:h-control-md " : "h-control-md ") +
        className
      }
      {...rootProps}
    />
  );
}

/* What a finger holding a tab shows: the fg 6% fill that rows and segments share, and the stronger text color. */
const press =
  "[-webkit-tap-highlight-color:transparent] " +
  "enabled:pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] enabled:pointer-coarse:active:text-fg";

const trigger =
  "litt-target relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none font-title " +
  "text-fg-muted transition-colors duration-(--dur-instant) ease-litt hover:text-fg data-[state=active]:text-fg " +
  press + " " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/** One tab: the word, and the bubble behind it while it is the chosen one. */
export function TabsTriggerFlatBody({ value, variant, shapeClass, active, enter, className, triggerRef, rootProps, children }: TabsTriggerBodyProps) {
  return (
    <TabsPrimitive.Trigger ref={triggerRef} value={value} data-body="flat" className={[trigger, shapeClass, className].join(" ")} {...rootProps}>
      {active && (
        <motion.span
          layoutId="tabs-indicator"
          transition={enter}
          aria-hidden="true"
          className={
            variant === "underline"
              ? "absolute inset-0 -z-10 rounded-control bg-block forced-colors:border-2 forced-colors:border-[Highlight] forced-colors:bg-transparent forced-colors:[forced-color-adjust:none]"
              : "absolute inset-0 -z-10 rounded-[calc(var(--radius-control)-2px)] bg-block shadow-(--block-lift) forced-colors:border" // litt-allow: concentric inside the segmented track's 2px inset
          }
        />
      )}
      <span className="litt-trim relative">{children}</span>
    </TabsPrimitive.Trigger>
  );
}
