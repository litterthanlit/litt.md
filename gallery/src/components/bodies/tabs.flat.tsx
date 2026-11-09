/**
 * Tabs, Flat's body (proposals/worlds.md, Bodies; proposals/flat-pill.md): words on the page, and a grey bubble behind
 * the chosen one. Ink on paper: nothing stands up, nothing is framed, and the panel below is bare.
 *
 * - Both variants are the same few things: words in a line, space between them, no hairline under the row and no
 *   tray around it. The unchosen are --fg-muted words; the chosen is --fg (ink) with a grey bubble behind it (--block,
 *   which is --surface-3 under Flat), a pill, the one shape for what a hand touches. The bubble glides between tabs
 *   with layoutId on the responsive tier (transform only); under fun mode it glides on the glide spring.
 * - Underline reads as a heading row at the body size; segmented is the same row set small, for switching a view.
 *   Neither has a track, so the bubble is the only thing drawn, and it says "chosen" the way Flat always does.
 * - Under forced colors the bubble is a Highlight outline, not a fill, so the chosen tab still differs from its
 *   neighbours.
 * - Nothing here is lifted by light or shade (R2, R3), and the row never scrolls a ring out of its box: the focus
 *   outline is inside the tab.
 * - The contract (value, variant, size, the roles, roving focus, arrow keys, the touch fill) is tabs.tsx's. This file
 *   only says what the tab is made of.
 */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";
import type { TabsListBodyProps, TabsTriggerBodyProps } from "../tabs";

/** The row: words in a line, space between them. No hairline, no tray. */
export function TabsListFlatBody({ variant, size, className, rootProps }: TabsListBodyProps) {
  if (variant === "underline") {
    return (
      <div data-body="flat">
        <TabsPrimitive.List className={"flex w-full gap-1 overflow-x-auto [scrollbar-width:none] " + className} {...rootProps} />
      </div>
    );
  }
  return (
    <TabsPrimitive.List
      data-body="flat"
      className={
        "inline-flex w-fit max-w-full gap-0.5 overflow-x-auto overflow-y-hidden [scrollbar-width:none] " +
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
  "litt-target relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none rounded-pill font-title " +
  "text-fg-muted transition-colors duration-(--dur-instant) ease-litt hover:text-fg data-[state=active]:text-fg " +
  press + " " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/** One tab: the word, and the bubble behind it while it is the chosen one. */
export function TabsTriggerFlatBody({ value, active, shapeClass, enter, className, triggerRef, rootProps, children }: TabsTriggerBodyProps) {
  return (
    <TabsPrimitive.Trigger ref={triggerRef} value={value} data-body="flat" className={[trigger, shapeClass, className].join(" ")} {...rootProps}>
      {active && (
        <motion.span
          layoutId="tabs-indicator"
          transition={enter}
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-pill bg-block forced-colors:border-2 forced-colors:border-[Highlight] forced-colors:bg-transparent forced-colors:[forced-color-adjust:none]"
        />
      )}
      <span className="litt-trim relative">{children}</span>
    </TabsPrimitive.Trigger>
  );
}
