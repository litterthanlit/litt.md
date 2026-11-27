/**
 * Tabs, Plain's body (taste v1.23, proposals/plain-studies.md): a row of words, the chosen one held in four gliding
 * corner brackets.
 *
 * - The chosen tab is `--fg` inside four 4px corner marks; every other is `--fg-muted`, and comes to `--fg` under the
 *   hand. Nothing else is drawn: no underline, no rule under the row and no frame round the panel.
 * - Subtraction motion: the four 4px corner marks carry independent `layoutId`s inside `<Tabs>`'s `LayoutGroup` and
 *   glide cleanly across words on the `200ms` zero-bounce responsive spring (`enter`). Because each mark is always
 *   `4px × 4px`, its 1px stroke never stretches between short and long words, and passive resizes never animate.
 * - Disabled is `--fg-disabled`. Forced colors gives the active tab a Highlight outline.
 */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, type Transition } from "motion/react";
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
  "text-fg-muted transition-colors duration-(--dur-instant) ease-litt enabled:hover:text-fg data-[state=active]:cursor-default data-[state=active]:text-fg " +
  "[-webkit-tap-highlight-color:transparent] disabled:cursor-not-allowed disabled:text-fg-disabled " +
  "forced-colors:data-[state=active]:outline-2 forced-colors:data-[state=active]:-outline-offset-2 forced-colors:data-[state=active]:outline-[Highlight] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

const corner = "pointer-events-none absolute size-1 border-current";

function GlidingCorners({ enter }: { enter: Transition }) {
  return (
    <>
      <motion.span layoutId="tabs-plain-tl" transition={enter} aria-hidden="true" className={corner + " -top-1.5 -left-2 border-t border-l"} />
      <motion.span layoutId="tabs-plain-tr" transition={enter} aria-hidden="true" className={corner + " -top-1.5 -right-2 border-t border-r"} />
      <motion.span layoutId="tabs-plain-bl" transition={enter} aria-hidden="true" className={corner + " -bottom-1.5 -left-2 border-b border-l"} />
      <motion.span layoutId="tabs-plain-br" transition={enter} aria-hidden="true" className={corner + " -bottom-1.5 -right-2 border-b border-r"} />
    </>
  );
}

/** One tab: a word in grey, or in the ink with four gliding corner marks while chosen. */
export function TabsTriggerPlainBody({ value, variant, size, active, enter, className, triggerRef, rootProps, children }: TabsTriggerBodyProps) {
  return (
    <TabsPrimitive.Trigger ref={triggerRef} value={value} data-body="plain" className={[trigger, sizes[variant][size], className].join(" ")} {...rootProps}>
      <span className="litt-trim relative">
        {active && <GlidingCorners enter={enter} />}
        {children}
      </span>
    </TabsPrimitive.Trigger>
  );
}
