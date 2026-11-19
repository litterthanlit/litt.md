/**
 * Select, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a flat square menu trigger and a black slab
 * dropdown banded top and bottom with diagonal hazard stripes, with four 8px amber corner brackets on the active row.
 *
 * - Trigger: flat square cell (`bg-block border border-line text-fg`) with a flush chevron cell on the right; hover,
 *   open or keyboard focus snaps four 6px amber corner brackets onto the trigger.
 * - List: flat square slab (`bg-canvas border border-line-strong`) with hazard-stripe bands along its top and bottom.
 * - Row: flat square cell; highlighted or checked rows frame themselves in four 8px amber corner brackets
 *   (`text-accent-text`), with a check icon on the selected value.
 * - The contract (props, roles, keys, highlight focus, exit) is select.tsx's.
 */
import * as SelectPrimitive from "@radix-ui/react-select";
import { motion } from "motion/react";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import type { SelectListBodyProps, SelectRowBodyProps, SelectSize, SelectTriggerBodyProps } from "@/components/select";

const stripes = "[background-image:repeating-linear-gradient(135deg,var(--surface-3)_0_6px,transparent_6px_12px)]";

const triggerBrackets =
  "pointer-events-none absolute inset-0 opacity-0 bg-no-repeat text-accent-text " +
  "transition-opacity duration-(--dur-instant) ease-litt " +
  "group-enabled/trigger:group-hover/trigger:opacity-100 group-data-[state=open]/trigger:opacity-100 group-focus-visible/trigger:opacity-100 " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const rowBrackets =
  "pointer-events-none absolute inset-0 opacity-0 bg-no-repeat text-accent-text " +
  "transition-opacity duration-(--dur-instant) ease-litt " +
  "group-data-[quiet=false]/list:group-data-[highlighted]/row:opacity-100 " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const field =
  "group/trigger relative flex w-full min-w-0 cursor-pointer items-center gap-control rounded-none border border-line bg-block text-left font-title text-fg " +
  "data-placeholder:font-normal data-placeholder:text-fg-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) " +
  "[-webkit-tap-highlight-color:transparent] " +
  "hover:border-line-strong hover:bg-(--block-hover) data-[state=open]:border-line-strong data-[state=open]:bg-(--block-hover) " +
  "transition-[background-color,border-color,color] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
  "aria-invalid:border-danger " +
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-fg-disabled disabled:data-placeholder:text-fg-disabled " +
  "forced-colors:border";

const sizes: Record<SelectSize, string> = {
  sm: "h-control-sm pl-control-pad-sm pr-1 text-small pointer-coarse:h-control-md",
  md: "h-control-md pl-control-pad-md pr-1 text-body",
  lg: "h-control-lg pl-control-pad-lg pr-1 text-(length:--control-text-lg)",
};

/** Heat, the trigger: a flat square cell with amber corner brackets on hover or open. */
export function SelectHeatTrigger({ root, size, className, selected, placeholder }: SelectTriggerBodyProps) {
  return (
    <SelectPrimitive.Trigger {...root} data-body="heat" className={[field, sizes[size], className].join(" ")}>
      <span aria-hidden="true" className={triggerBrackets} />
      <span className="min-w-0 flex-1 truncate">
        <SelectPrimitive.Value placeholder={placeholder}>{selected}</SelectPrimitive.Value>
      </span>
      <span
        aria-hidden="true"
        className="my-1 grid aspect-square shrink-0 self-stretch place-items-center border-l border-line text-fg-muted group-data-[state=open]/trigger:text-accent-text group-disabled/trigger:text-fg-disabled"
      >
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="shrink-0" />
        </SelectPrimitive.Icon>
      </span>
    </SelectPrimitive.Trigger>
  );
}

/** Heat, the list: a square black slab with hazard-stripe bands along top and bottom. */
export function SelectHeatList({ root, glide, children }: SelectListBodyProps) {
  return (
    <motion.div
      {...root}
      data-body="heat"
      className={
        "group/list relative z-50 max-h-(--radix-select-content-available-height) max-w-(--radix-select-content-available-width) " +
        "min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) rounded-none border border-line-strong bg-canvas outline-none forced-colors:border"
      }
    >
      <div aria-hidden="true" className={"h-2 border-b border-line bg-surface-1 " + stripes} />
      <SelectPrimitive.Viewport
        ref={glide.ref}
        className="p-1 overscroll-contain [scrollbar-color:var(--line-strong)_transparent]! [scrollbar-width:thin]!"
      >
        {children}
      </SelectPrimitive.Viewport>
      <div aria-hidden="true" className={"h-2 border-t border-line bg-surface-1 " + stripes} />
    </motion.div>
  );
}

const row =
  "group/row relative flex h-control-md w-full scroll-my-1 cursor-pointer select-none items-center gap-3 rounded-none px-3 text-small font-title outline-none " +
  "[-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt " +
  "text-fg-muted data-[state=checked]:bg-surface-1 data-[state=checked]:text-fg " +
  "group-data-[quiet=false]/list:data-[highlighted]:bg-block group-data-[quiet=false]/list:data-[highlighted]:text-accent-text " +
  "forced-colors:group-data-[quiet=false]/list:data-[highlighted]:[forced-color-adjust:none] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:bg-[Highlight] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:text-[HighlightText] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:**:text-[HighlightText] " +
  "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled " +
  "pointer-coarse:active:bg-block pointer-coarse:active:text-accent-text";

/** Heat, a row: square cell with four 8px amber corner brackets when highlighted. */
export function SelectHeatRow({ item, option }: SelectRowBodyProps) {
  return (
    <SelectPrimitive.Item {...item} className={row}>
      <span aria-hidden="true" className={rowBrackets} />
      <span className="min-w-0 flex-1 truncate">
        <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      </span>
      <span className="grid size-4 shrink-0 place-items-center">
        <SelectPrimitive.ItemIndicator className="grid place-items-center text-accent-text">
          <CheckIcon />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}
