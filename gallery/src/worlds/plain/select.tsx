/**
 * Select, Plain's body (proposals/plain.md, Quiet): a field like the text field, and a list that is the page again.
 *
 * - The trigger is the input's line: no fill, no frame, no side padding, the value in --fg and a plain chevron after
 *   it, one 1px --line-control rule along its foot. Under the hand the rule goes to --fg; open, it is 2px in --fg;
 *   focus is 2px in --focus, an error 2px in --danger. Disabled thins it to --line.
 * - The list is the page inside one line: --canvas inside a 1px --line-control edge, no glass, no shadow, square.
 * - Rows are --fg-muted words. The current one is --fg with a check; the row under the hand or the keys is --fg with
 *   four corner brackets round its word. The glide (glide.tsx) draws no wash and no ring here, the brackets are the highlight; forced
 *   colors keeps its Highlight.
 * - The contract (props, roles, keys, the highlight's focus, the exit) is select.tsx's.
 */
import * as SelectPrimitive from "@radix-ui/react-select";
import { motion } from "motion/react";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import type { SelectListBodyProps, SelectRowBodyProps, SelectSize, SelectTriggerBodyProps } from "@/components/select";

const field =
  "group/trigger flex w-full min-w-0 cursor-pointer items-center gap-control rounded-none bg-transparent px-0 text-left font-normal text-fg " +
  "data-placeholder:text-fg-subtle pointer-coarse:text-(length:--control-text-lg) [-webkit-tap-highlight-color:transparent] " +
  "bg-[linear-gradient(var(--rule),var(--rule))] bg-[length:100%_var(--rule-w)] bg-bottom bg-no-repeat [--rule:var(--line-control)] [--rule-w:1px] " +
  "enabled:hover:[--rule:var(--fg)] data-[state=open]:[--rule:var(--fg)] data-[state=open]:[--rule-w:2px] " +
  "focus-visible:outline-none focus-visible:[--rule:var(--focus)] focus-visible:[--rule-w:2px] " +
  "aria-invalid:[--rule:var(--danger)] aria-invalid:[--rule-w:2px] " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:data-placeholder:text-fg-disabled disabled:[--rule:var(--line)] " +
  "forced-colors:border-b";

const sizes: Record<SelectSize, string> = {
  sm: "h-control-sm text-small pointer-coarse:h-control-md",
  md: "h-control-md text-body",
  lg: "h-control-lg text-(length:--control-text-lg)",
};

/** Plain, the trigger: the value on a line, and a plain chevron. */
export function SelectPlainTrigger({ root, size, className, selected, placeholder }: SelectTriggerBodyProps) {
  return (
    <SelectPrimitive.Trigger {...root} data-body="plain" className={[field, sizes[size], className].join(" ")}>
      <span className="min-w-0 flex-1 truncate">
        <SelectPrimitive.Value placeholder={placeholder}>{selected}</SelectPrimitive.Value>
      </span>
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="shrink-0 text-fg-subtle group-disabled/trigger:text-fg-disabled" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/** Plain, the list: the page inside one line. */
export function SelectPlainList({ root, glide, children }: SelectListBodyProps) {
  return (
    <motion.div
      {...root}
      data-body="plain"
      className={
        "group/list relative z-50 max-h-(--radix-select-content-available-height) max-w-(--radix-select-content-available-width) " +
        "min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) rounded-none bg-canvas " +
        "shadow-[inset_0_0_0_1px_var(--line-control)] outline-none forced-colors:border"
      }
    >
      <SelectPrimitive.Viewport
        ref={glide.ref}
        className="isolate p-px overscroll-contain [&>[data-ring]]:rounded-none [&>[data-ring]]:bg-transparent [&>[data-ring]]:shadow-none forced-colors:[&>[data-ring]]:bg-[Highlight] [scrollbar-color:var(--line-strong)_transparent]! [scrollbar-width:thin]!"
      >
        {glide.highlight}
        {children}
      </SelectPrimitive.Viewport>
    </motion.div>
  );
}

const row =
  "group/row relative flex h-control-md w-full scroll-my-1 cursor-pointer select-none items-center gap-3 px-4 text-small text-fg-muted outline-none " +
  "[-webkit-tap-highlight-color:transparent] " +
  "data-[state=checked]:text-fg group-data-[quiet=false]/list:data-[highlighted]:text-fg pointer-coarse:active:text-fg " +
  "forced-colors:group-data-[quiet=false]/list:data-[highlighted]:[forced-color-adjust:none] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:text-[HighlightText] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:**:text-[HighlightText] " +
  "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled";

/* Four corner marks round the row's word, each two 1px bars 4px long, in its color: on the row under the hand or the keys. */
const brackets =
  "pointer-events-none absolute -inset-x-2 -inset-y-1.5 hidden bg-no-repeat " +
  "group-data-[quiet=false]/list:group-data-[highlighted]/row:block pointer-coarse:group-active/row:block " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px,4px_1px,1px_4px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

/** Plain, a row: a word in grey, the current one in the ink with a check, the one under the hand in brackets. */
export function SelectPlainRow({ item, option }: SelectRowBodyProps) {
  return (
    <SelectPrimitive.Item {...item} className={row}>
      <span className="min-w-0 flex-1">
        <span className="litt-trim relative inline-block max-w-full">
          <span aria-hidden="true" className={brackets} />
          <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
        </span>
      </span>
      <span className="grid size-4 shrink-0 place-items-center">
        <SelectPrimitive.ItemIndicator className="grid place-items-center text-fg">
          <CheckIcon />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}
