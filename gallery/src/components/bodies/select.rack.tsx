/**
 * Select, the Rack body (proposals/rack.md): a value box with a square chevron key, and a list drawn as an opaque panel.
 *
 * - The trigger is a box in a 1px outline (--block with --block-lift): the value in the ink at the control's size, and at
 *   its end a small square key (the box less 2px each way) holding a plain chevron. Under the hand the box takes a
 *   lighter grey, and while its list is open the outline darkens (--block-press) with a darker fill. Nothing sinks.
 *   Focus is the ink ring, an error the danger outline, and disabled lies flat on --surface-2 with a --line hairline.
 * - The list is a panel in a 1px outline: --block, opaque, no cast, square at the control radius. It is there on the
 *   frame (useOverlayMotion's cut under Rack) and gone on the frame. Rows are thin (the control height) and parted by space.
 * - The current row is filled: a lighter block behind it, its word in the title weight and a check at the end, so it is
 *   never the fill alone. The hand's highlight is a tint of the ink that switches from row to row in place, with no glide.
 * - Forced colors drops shadows, so the box, the key and the panel get real borders, and the highlighted row is
 *   Highlight with HighlightText.
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
  "transition-[background-color,color] duration-(--dur-instant) ease-litt " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger)] " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:data-placeholder:text-fg-disabled " +
  "disabled:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border";

const sizes: Record<SelectSize, string> = {
  sm: "h-control-sm pl-control-pad-sm pr-1 text-small pointer-coarse:h-control-md",
  md: "h-control-md pl-control-pad-md pr-1 text-body",
  lg: "h-control-lg pl-control-pad-lg pr-1 text-(length:--control-text-lg)",
};

/** Rack, the trigger: a value box with a square chevron key at its end. */
export function SelectRackTrigger({ root, size, className, selected, placeholder }: SelectTriggerBodyProps) {
  return (
    <SelectPrimitive.Trigger {...root} data-body="rack" className={[field, sizes[size], className].join(" ")}>
      <span className="min-w-0 flex-1 truncate">
        <SelectPrimitive.Value placeholder={placeholder}>{selected}</SelectPrimitive.Value>
      </span>
      <span
        aria-hidden="true"
        className="my-1 grid aspect-square shrink-0 self-stretch place-items-center rounded-none bg-[color-mix(in_oklab,var(--block),var(--fg)_10%)] group-disabled/trigger:bg-transparent forced-colors:border"
      >
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="shrink-0 text-fg-muted group-disabled/trigger:text-fg-disabled" />
        </SelectPrimitive.Icon>
      </span>
    </SelectPrimitive.Trigger>
  );
}

/** Rack, the list: an opaque panel in a 1px outline, there on the frame. */
export function SelectRackList({ root, glide, children }: SelectListBodyProps) {
  return (
    <motion.div
      {...root}
      data-body="rack"
      className={
        "group/list relative z-50 max-h-(--radix-select-content-available-height) max-w-(--radix-select-content-available-width) " +
        "min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) rounded-control bg-block shadow-(--block-lift) outline-none forced-colors:border"
      }
    >
      <SelectPrimitive.Viewport
        ref={glide.ref}
        className="rounded-control p-1 overscroll-contain [scrollbar-color:var(--line-strong)_transparent]! [scrollbar-width:thin]!"
      >
        {children}
      </SelectPrimitive.Viewport>
    </motion.div>
  );
}

const row =
  "relative flex h-control-md w-full scroll-my-1 cursor-pointer select-none items-center gap-3 rounded-none px-3 text-small outline-none " +
  "[-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt " +
  "text-fg-muted data-[state=checked]:bg-[color-mix(in_oklab,var(--block),var(--fg)_12%)] data-[state=checked]:font-title data-[state=checked]:text-fg " +
  "group-data-[quiet=false]/list:data-[highlighted]:bg-[color-mix(in_oklab,var(--block),var(--fg)_18%)] group-data-[quiet=false]/list:data-[highlighted]:text-fg " +
  "forced-colors:group-data-[quiet=false]/list:data-[highlighted]:[forced-color-adjust:none] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:bg-[Highlight] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:text-[HighlightText] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:**:text-[HighlightText] " +
  "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_7%,transparent)] pointer-coarse:active:text-fg";

/** Rack, a row: a thin line of text, the current one filled with its title weight and a check. */
export function SelectRackRow({ item, option }: SelectRowBodyProps) {
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
