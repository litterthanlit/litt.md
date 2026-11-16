/**
 * Tabs, Plain's body (proposals/plain.md, Quiet): a row of words, the chosen one held in four corner brackets.
 *
 * - The chosen tab is --fg inside four 4px corner marks; every other is --fg-muted, and comes to --fg under the hand.
 *   Nothing else is drawn, no underline, no rule under the row and no frame round the panel: space parts the row from
 *   what it shows.
 * - Both variants are the same words; segmented sets them small. Each word has room for its brackets on both sides,
 *   and the row steps back by that room, so the first word sits flush with the page's edge.
 * - Disabled is --fg-disabled. Forced colors: the chosen tab's brackets take the system's text color, and it gets a
 *   Highlight outline, so it still differs from its neighbours in a screenshot.
 * - The contract (value, variant, size, the roles, roving focus, arrow keys) is tabs.tsx's. Nothing glides.
 */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { TabsListBodyProps, TabsTriggerBodyProps, TabsSize, TabsVariant } from "@/components/tabs";

/** The row: words in a line. It steps back by a word's side room (-mx-3), so the first word is flush. */
export function TabsListPlainBody({ variant, size, className, rootProps }: TabsListBodyProps) {
  return (
    <TabsPrimitive.List
      data-body="plain"
      className={
        "-mx-3 flex max-w-[calc(100%+24px)] overflow-x-auto [scrollbar-width:none] " +
        (variant === "underline" ? "w-[calc(100%+24px)] " : "w-fit ") +
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
  "litt-target group/tab relative inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap select-none px-3 font-normal " +
  "text-fg-muted enabled:hover:text-fg data-[state=active]:cursor-default data-[state=active]:text-fg " +
  "[-webkit-tap-highlight-color:transparent] disabled:cursor-not-allowed disabled:text-fg-disabled " +
  "forced-colors:data-[state=active]:outline-2 forced-colors:data-[state=active]:-outline-offset-2 forced-colors:data-[state=active]:outline-[Highlight] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/* Four corner marks, each two 1px bars 4px long, in the word's color: only on the chosen tab. */
const brackets =
  "pointer-events-none absolute -inset-x-2 -inset-y-1.5 hidden bg-no-repeat group-data-[state=active]/tab:block " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

/** One tab: a word in grey, or in the ink and the brackets while it is the chosen one. */
export function TabsTriggerPlainBody({ value, variant, size, className, triggerRef, rootProps, children }: TabsTriggerBodyProps) {
  return (
    <TabsPrimitive.Trigger ref={triggerRef} value={value} data-body="plain" className={[trigger, sizes[variant][size], className].join(" ")} {...rootProps}>
      <span className="litt-trim relative">
        <span aria-hidden="true" className={brackets} />
        {children}
      </span>
    </TabsPrimitive.Trigger>
  );
}
