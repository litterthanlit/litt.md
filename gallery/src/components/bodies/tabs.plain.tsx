/**
 * Tabs, Plain's body (proposals/plain.md, No UI): a row of words, like a page's own links to its parts.
 *
 * - The chosen tab is --fg; every other is link blue and underlined (--accent-text), a word to go to. Nothing is drawn
 *   around any of them, no rule under the row and no frame round the panel: space parts the row from what it shows.
 * - Both variants are the same words; segmented sets them small. The first word sits flush with the page's edge.
 * - Under the hand an unchosen word's underline thickens to 2px. Disabled is --fg-disabled with no underline.
 * - Forced colors: the chosen tab gets a Highlight outline, so it still differs from its neighbours in a screenshot.
 * - The contract (value, variant, size, the roles, roving focus, arrow keys) is tabs.tsx's. Nothing glides.
 */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { TabsListBodyProps, TabsTriggerBodyProps, TabsSize, TabsVariant } from "../tabs";

/** The row: words in a line, space between them. */
export function TabsListPlainBody({ variant, size, className, rootProps }: TabsListBodyProps) {
  return (
    <TabsPrimitive.List
      data-body="plain"
      className={
        "flex max-w-full gap-4 overflow-x-auto [scrollbar-width:none] " +
        (variant === "underline" ? "w-full " : "w-fit ") +
        (variant === "segmented" ? (size === "sm" ? "h-control-sm pointer-coarse:h-control-md " : "h-control-md ") : "") +
        className
      }
      {...rootProps}
    />
  );
}

const sizes: Record<TabsVariant, Record<TabsSize, string>> = {
  underline: { md: "h-control-md text-body", sm: "h-control-sm pointer-coarse:h-control-md text-small" },
  segmented: { md: "h-full text-small", sm: "h-full text-caption pointer-coarse:text-small" },
};

const trigger =
  "litt-target group/tab relative inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap select-none font-normal " +
  "text-accent-text data-[state=active]:cursor-default data-[state=active]:text-fg " +
  "[-webkit-tap-highlight-color:transparent] disabled:cursor-not-allowed disabled:text-fg-disabled " +
  "forced-colors:data-[state=active]:outline-2 forced-colors:data-[state=active]:outline-offset-2 forced-colors:data-[state=active]:outline-[Highlight] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const word =
  "litt-trim underline decoration-1 underline-offset-[0.2em] group-enabled/tab:group-hover/tab:decoration-2 " +
  "group-data-[state=active]/tab:no-underline group-disabled/tab:no-underline";

/** One tab: a word, underlined in link blue unless it is the chosen one. */
export function TabsTriggerPlainBody({ value, variant, size, className, triggerRef, rootProps, children }: TabsTriggerBodyProps) {
  return (
    <TabsPrimitive.Trigger ref={triggerRef} value={value} data-body="plain" className={[trigger, sizes[variant][size], className].join(" ")} {...rootProps}>
      <span className={word}>{children}</span>
    </TabsPrimitive.Trigger>
  );
}
