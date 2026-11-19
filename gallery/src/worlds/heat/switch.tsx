/**
 * Switch, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a pair of flat square Off / On cells in a
 * black slab, with four 6px corner brackets on the active side.
 *
 * - Square corners (`rounded-none`), zero cast, zero sink, instant cut.
 * - Off highlights the first cell in `--block` with ink corner brackets; On highlights the second cell in `--block` with
 *   amber corner brackets (`text-accent-text`), or solid amber (`bg-accent text-accent-fg`) when `tone="accent"`.
 * - Keeps Radix's `SwitchPrimitive.Root` and `SwitchPrimitive.Thumb` plus `--sw-travel:44px` so keyboard, pointer and
 *   drag behavior stay identical to every other world.
 * - The contract (props, the Radix root, the hand, the label) is switch.tsx's.
 */
import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { SwitchBodyProps } from "@/components/switch";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const track =
  "[--sw-travel:44px] " +
  "peer relative z-1 inline-grid h-8 w-23 shrink-0 cursor-pointer touch-pan-y grid-cols-2 items-stretch self-start overflow-hidden rounded-none border border-line bg-canvas " +
  "transition-[border-color,background-color] duration-(--dur-instant) ease-litt " +
  "enabled:group-hover/switch:border-line-strong " +
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 " +
  "forced-colors:border " +
  focusRing;

/* Four 6px corner brackets in currentColor on the active cell. */
const brackets =
  "pointer-events-none absolute inset-0 bg-no-repeat " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const cellBase =
  "pointer-events-none relative flex select-none items-center justify-center text-caption font-title " +
  "transition-colors duration-(--dur-instant) ease-litt";

/** Heat's body: two flat square cells (Off / On), the active side framed by corner brackets. */
export function SwitchHeatBody({ shown, disabled, tone, words, root, className }: SwitchBodyProps) {
  const offActive = !disabled && !shown;
  const onActive = !disabled && shown;
  const onCell = disabled
    ? "text-fg-disabled"
    : onActive
      ? tone === "accent"
        ? "bg-accent text-accent-fg forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
        : "bg-block text-accent-text forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
      : "text-fg-muted";
  const offCell = disabled
    ? "text-fg-disabled"
    : offActive
      ? "bg-block text-fg forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
      : "text-fg-muted";

  return (
    <SwitchPrimitive.Root {...root} data-body="heat" className={track + className}>
      <span aria-hidden="true" className={cellBase + " border-r border-line " + offCell}>
        {offActive && <span className={brackets + " text-fg"} />}
        {words[0]}
      </span>
      <span aria-hidden="true" className={cellBase + " " + onCell}>
        {onActive && <span className={brackets + (tone === "accent" ? " text-accent-fg" : " text-accent-text")} />}
        {words[1]}
      </span>
      <SwitchPrimitive.Thumb className="sr-only" />
    </SwitchPrimitive.Root>
  );
}
