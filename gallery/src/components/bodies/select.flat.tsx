/**
 * Select, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): ink on paper.
 *
 * - The trigger is a grey pill (--block is --surface-3) with no outline, no shade and no window: the value in ink and a
 *   plain chevron after it. Under the hand it takes a lighter grey, and while its list is open a darker one. Nothing sinks.
 *   Focus is the ink ring (--focus-ring), an error the danger ring, and disabled lies flat on --surface-2.
 * - The list is a sheet, not a tray: one solid grey card (--surface-3) with no glass, no shadow and no ring, which grows from
 *   the trigger. Inside glass it is the same sheet. Its rows are words parted by space, with nothing between them.
 * - The current row is the grey bubble: a darker grey behind it, its word in the title weight and its check at the end,
 *   so it is never the fill alone. The hand's highlight is the same family, a lighter bubble that glides under the pointer.
 * - Rows are pills (the control radius less the sheet's 4px padding). The bubble is a pseudo-element behind the row, so the
 *   gliding highlight and its keyboard ring still show over it.
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
  "hover:bg-(--block-hover) enabled:pointer-coarse:active:bg-(--block-hover) " +
  "data-[state=open]:bg-[color-mix(in_oklab,var(--block),var(--fg)_9%)] " +
  "transition-[background-color,color] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-none focus-visible:shadow-(--focus-ring) " +
  "aria-invalid:shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--danger)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:data-placeholder:text-fg-disabled " +
  "disabled:shadow-none " +
  "forced-colors:border";

const sizes: Record<SelectSize, string> = {
  sm: "h-control-sm px-control-pad-sm text-small pointer-coarse:h-control-md",
  md: "h-control-md px-control-pad-md text-body",
  lg: "h-control-lg px-control-pad-lg text-(length:--control-text-lg)",
};

/** Flat, the trigger: a grey pill, the value in ink and a plain chevron. */
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

/** Flat, the list: a solid grey sheet that grows from the trigger. */
export function SelectFlatList({ root, glide, children }: SelectListBodyProps) {
  return (
    <motion.div
      {...root}
      data-body="flat"
      className={
        "group/list relative z-50 max-h-(--radix-select-content-available-height) max-w-(--radix-select-content-available-width) " +
        "min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) rounded-control bg-surface-3 outline-none forced-colors:border"
      }
    >
      <SelectPrimitive.Viewport
        ref={glide.ref}
        className="isolate rounded-control p-1 overscroll-contain [&>[data-ring]]:rounded-[calc(var(--radius-control)-4px)] [scrollbar-color:var(--line-strong)_transparent]! [scrollbar-width:thin]!"
      >
        {glide.highlight}
        {children}
      </SelectPrimitive.Viewport>
    </motion.div>
  );
}

const row =
  "relative flex h-control-md w-full scroll-my-1 cursor-pointer select-none items-center gap-3 rounded-[calc(var(--radius-control)-4px)] px-4 text-small outline-none " +
  "[-webkit-tap-highlight-color:transparent] " +
  "before:absolute before:inset-0 before:-z-10 before:rounded-[calc(var(--radius-control)-4px)] " +
  "data-[state=checked]:before:bg-[color-mix(in_oklab,var(--surface-3),var(--fg)_12%)] forced-colors:data-[state=checked]:before:border " +
  "transition-colors duration-(--dur-instant) ease-litt " +
  "text-fg-muted data-[state=checked]:font-title data-[state=checked]:text-fg group-data-[quiet=false]/list:data-[highlighted]:text-fg " +
  "forced-colors:group-data-[quiet=false]/list:data-[highlighted]:[forced-color-adjust:none] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:text-[HighlightText] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:**:text-[HighlightText] " +
  "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] pointer-coarse:active:text-fg";

/** Flat, a row: a word, and on the current one a grey bubble, the title weight and a check. */
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
