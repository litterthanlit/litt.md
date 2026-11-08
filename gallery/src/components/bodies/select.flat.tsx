/**
 * Select, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): a grey pill and a solid card.
 *
 * - The trigger is the Press trigger with Flat's rules written plainly: no outline, the ink ring (--focus-ring) for focus,
 *   a danger ring for an error, flat when disabled. Its fills and the cast come from the Flat tokens.
 * - The list is the same panel as Press (glass, or solid inside glass). Its rows are grey bubbles under the pointer at the
 *   panel radius less its 4px padding, with the current one marked by its check.
 * - The contract (props, roles, keys, the highlight's focus, the exit) is select.tsx's.
 */
import * as SelectPrimitive from "@radix-ui/react-select";
import { motion } from "motion/react";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import type { SelectListBodyProps, SelectRowBodyProps, SelectSize, SelectTriggerBodyProps } from "../select";

const field =
  "group/trigger flex w-full min-w-0 cursor-pointer items-center gap-control rounded-control bg-block text-left font-normal text-fg " +
  "data-placeholder:text-fg-subtle " +
  "pointer-coarse:text-(length:--control-text-lg) " +
  "[-webkit-tap-highlight-color:transparent] " +
  "shadow-(--block-lift) enabled:active:shadow-(--block-press) data-[state=open]:shadow-(--block-press) " +
  "hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover) " +
  "transition-[background-color,color,translate] duration-(--dur-instant) ease-litt " +
  "active:translate-y-(--press-depth) disabled:active:translate-y-0 data-[state=open]:translate-y-(--press-depth) " +
  "focus-visible:outline-none focus-visible:shadow-(--focus-ring) " +
  "aria-invalid:shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)] " +
  "aria-invalid:enabled:active:shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)] " +
  "aria-invalid:data-[state=open]:shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:data-placeholder:text-fg-disabled " +
  "disabled:shadow-none " +
  "forced-colors:border";

const sizes: Record<SelectSize, string> = {
  sm: "h-control-sm px-control-pad-sm text-small pointer-coarse:h-control-md",
  md: "h-control-md px-control-pad-md text-body",
  lg: "h-control-lg px-control-pad-lg text-(length:--control-text-lg)",
};

/** Flat, the trigger: a grey pill with no outline. */
export function SelectFlatTrigger({ root, size, className, selected, placeholder }: SelectTriggerBodyProps) {
  return (
    <SelectPrimitive.Trigger {...root} data-body="flat" className={[field, sizes[size], className].join(" ")}>
      <span className="min-w-0 flex-1 truncate">
        <SelectPrimitive.Value placeholder={placeholder}>{selected}</SelectPrimitive.Value>
      </span>
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="shrink-0 text-fg-subtle group-disabled/trigger:text-fg-disabled" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/** Flat, the list: the same panel, solid inside glass. */
export function SelectFlatList({ root, flat, glide, children }: SelectListBodyProps) {
  return (
    <motion.div
      {...root}
      data-body="flat"
      className={
        "group/list relative z-50 max-h-(--radix-select-content-available-height) max-w-(--radix-select-content-available-width) " +
        "min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) rounded-surface outline-none " +
        (flat ? "bg-surface-2 shadow-float" : "litt-glass")
      }
    >
      <SelectPrimitive.Viewport
        ref={glide.ref}
        className="rounded-surface p-1 overscroll-contain [scrollbar-color:var(--line-strong)_transparent]! [scrollbar-width:thin]!"
      >
        {glide.highlight}
        {children}
      </SelectPrimitive.Viewport>
    </motion.div>
  );
}

const row =
  "relative flex h-control-md w-full scroll-my-1 cursor-pointer select-none items-center gap-3 rounded-[calc(var(--radius-surface)-4px)] px-3 text-small outline-none " +
  "[-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt " +
  "text-fg-muted data-[state=checked]:text-fg group-data-[quiet=false]/list:data-[highlighted]:text-fg " +
  "forced-colors:group-data-[quiet=false]/list:data-[highlighted]:[forced-color-adjust:none] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:text-[HighlightText] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:**:text-[HighlightText] " +
  "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] pointer-coarse:active:text-fg";

/** Flat, a row: a grey bubble under the pointer, the current one marked by its check. */
export function SelectFlatRow({ item, option }: SelectRowBodyProps) {
  return (
    <SelectPrimitive.Item {...item} className={row}>
      <span className="min-w-0 flex-1 truncate">
        <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      </span>
      <span className="grid size-4 shrink-0 place-items-center">
        <SelectPrimitive.ItemIndicator className="grid place-items-center text-fg">
          <CheckIcon />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}
