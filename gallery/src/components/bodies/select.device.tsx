/**
 * Select, the Device body (proposals/worlds.md, Bodies; material.md, 8): an LCD readout with step keys, and a list drawn
 * as a screen.
 *
 * - The trigger is a readout: the value in the mono on LCD glass (--field, --field-shade, --field-ink), at the Input's
 *   sizes. Pressing the readout opens the list, as Radix's trigger does. Its end carries a pair of small keys
 *   (--block, --key-lift) that step to the previous and the next option without opening the list. They stack on a
 *   pointer with a mouse and sit side by side, 44px wide, on a coarse pointer, each with a 44px target. They sink the whole
 *   --press-depth (2px) under the hand, and one lies flat when there is nowhere left to step.
 * - The keys are a pointer extra. They are out of the tab order (tabIndex -1) and out of the accessibility tree
 *   (aria-hidden), and a press on them never moves focus, so the keyboard is Radix's alone: Space, Enter or an arrow
 *   opens the list, typing on the closed trigger picks, and Tab never lands on a key.
 * - The list is a screen: LCD glass at the control radius with the float shadow under it, rows in the mono. The current
 *   row is marked by a lamp at its start, lit in the glass's ink (the accent is the view's one fill, R6), an unlit lamp
 *   a dim dot on the other rows, so the lamp never says the state alone: the word stays, and aria-selected says it.
 * - The highlight is not a glide. It switches from row to row in place, a tint of the ink behind the row, in steps on the
 *   instant tier. The list itself switches on and off in steps where it stands (useOverlayMotion), with no slide.
 * - Forced colors drops shadows and fills, so the readout, the keys and the screen get real borders, a lit lamp is a
 *   system highlight and an unlit one an outline, and the highlighted row is Highlight with HighlightText.
 * - The contract (props, roles, keys, the exit) is select.tsx's.
 */
import * as SelectPrimitive from "@radix-ui/react-select";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import type { SelectListBodyProps, SelectRowBodyProps, SelectSize, SelectTriggerBodyProps } from "../select";


/* The readout is the glass; the trigger and the keys sit in it, 2px in, so their corners are the glass's less 2px. */
/* Device changes in place, in three steps on the instant tier: the class names the tier, this is the step. */
const STEPS = "steps(3, end)";
const stepped: CSSProperties = { transitionTimingFunction: `${STEPS}` };

const glass =
  "group/readout relative flex w-full min-w-0 items-stretch gap-0.5 rounded-control bg-field p-0.5 font-field text-field-ink " +
  "shadow-(--field-shade) forced-colors:border " +
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus " +
  "data-[invalid]:shadow-[inset_0_0_0_1px_var(--danger),var(--field-shade)] " +
  "data-[disabled]:bg-surface-2 data-[disabled]:text-fg-disabled data-[disabled]:shadow-[inset_0_0_0_1px_var(--line)]";

const sizes: Record<SelectSize, string> = {
  sm: "h-control-sm text-small pointer-coarse:h-control-md",
  md: "h-control-md text-body",
  lg: "h-control-lg text-(length:--control-text-lg)",
};
const pads: Record<SelectSize, string> = {
  sm: "pl-control-pad-sm",
  md: "pl-control-pad-md",
  lg: "pl-control-pad-lg",
};

const readout =
  "flex h-full min-w-0 flex-1 cursor-pointer items-center rounded-[calc(var(--radius-control)-2px)] text-left font-normal text-field-ink outline-none " +
  "data-placeholder:text-field-ink-subtle pointer-coarse:text-(length:--control-text-lg) " +
  "[-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt " +
  "hover:bg-[color-mix(in_oklab,var(--field-ink)_8%,transparent)] data-[state=open]:bg-[color-mix(in_oklab,var(--field-ink)_14%,transparent)] " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent";

const keys = "flex shrink-0 flex-col gap-px pointer-coarse:flex-row pointer-coarse:gap-0.5";
const keyBox =
  "litt-target relative grid w-6 flex-1 cursor-pointer place-items-center rounded-[calc(var(--radius-control)-2px)] bg-block text-fg-muted shadow-(--key-lift) " +
  "pointer-coarse:w-11 pointer-coarse:flex-none [-webkit-tap-highlight-color:transparent] " +
  "transition-[transform,box-shadow,color,background-color] duration-(--dur-instant) ease-litt " +
  "enabled:hover:bg-(--block-hover) enabled:hover:text-fg " +
  "enabled:active:shadow-(--block-press) enabled:active:[transform:translateY(var(--press-depth))] " +
  "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-field-ink-subtle disabled:shadow-[inset_0_0_0_1px_var(--field-line)] " +
  "forced-colors:border";

/* Small solid triangles, the way a hardware key is marked. They draw in the key's ink. */
function Arrow({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true" className="size-2 shrink-0 forced-colors:fill-[CanvasText]">
      <path d={up ? "M1 5.5 4 2.5 7 5.5Z" : "M1 2.5 4 5.5 7 2.5Z"} fill="currentColor" />
    </svg>
  );
}

function Key({ up, onPress, disabled }: { up?: boolean; onPress: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      disabled={disabled}
      /* A press never takes focus from the readout, and never starts a drag on the page behind. */
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      className={keyBox}
      style={stepped}
    >
      <Arrow up={up} />
    </button>
  );
}

/** Device, the trigger: an LCD readout with a pair of step keys at its end. */
export function SelectDeviceTrigger({ root, size, className, invalid, disabled, selected, placeholder, step }: SelectTriggerBodyProps) {
  return (
    <div
      data-body="device"
      data-invalid={invalid ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={[glass, sizes[size], className].join(" ")}
    >
      <SelectPrimitive.Trigger {...root} className={[readout, pads[size]].join(" ")} style={stepped}>
        <span className="min-w-0 flex-1 truncate">
          <SelectPrimitive.Value placeholder={placeholder}>{selected}</SelectPrimitive.Value>
        </span>
      </SelectPrimitive.Trigger>
      <span className={keys}>
        <Key up onPress={step.prev} disabled={disabled || !step.canPrev} />
        <Key onPress={step.next} disabled={disabled || !step.canNext} />
      </span>
    </div>
  );
}

/** Device, the list: a screen of LCD glass. Its highlight is the rows' own tint, with no glide. */
export function SelectDeviceList({ root, glide, children }: SelectListBodyProps) {
  return (
    <motion.div
      {...root}
      data-body="device"
      className={
        "group/list relative z-50 max-h-(--radix-select-content-available-height) max-w-(--radix-select-content-available-width) " +
        "min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) rounded-control bg-field font-field text-field-ink outline-none " +
        "shadow-[var(--field-shade),var(--shadow-float)] forced-colors:border"
      }
    >
      <SelectPrimitive.Viewport
        ref={glide.ref}
        className="rounded-control p-1 overscroll-contain [scrollbar-color:var(--field-line)_transparent]! [scrollbar-width:thin]!"
      >
        {children}
      </SelectPrimitive.Viewport>
    </motion.div>
  );
}

const row =
  "relative flex h-control-md w-full scroll-my-1 cursor-pointer select-none items-center gap-3 rounded-[calc(var(--radius-control)-4px)] px-3 text-small outline-none " +
  "[-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-(--dur-instant) ease-litt " +
  "text-field-ink-subtle data-[state=checked]:text-field-ink " +
  "group-data-[quiet=false]/list:data-[highlighted]:text-field-ink group-data-[quiet=false]/list:data-[highlighted]:bg-[color-mix(in_oklab,var(--field-ink)_16%,transparent)] " +
  "forced-colors:group-data-[quiet=false]/list:data-[highlighted]:[forced-color-adjust:none] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:bg-[Highlight] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:text-[HighlightText] forced-colors:group-data-[quiet=false]/list:data-[highlighted]:**:text-[HighlightText] " +
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-40 " +
  "pointer-coarse:active:bg-[color-mix(in_oklab,var(--field-ink)_16%,transparent)] pointer-coarse:active:text-field-ink";

const unlit = "size-1.5 rounded-pill bg-field-line forced-colors:border forced-colors:bg-transparent";
const lit = "size-1.5 rounded-pill bg-field-ink shadow-[0_0_6px_var(--field-ink)] forced-colors:bg-[Highlight]";

/** Device, a row: a lamp at its start, lit on the current option, and the word in the mono. */
export function SelectDeviceRow({ item, option }: SelectRowBodyProps) {
  return (
    <SelectPrimitive.Item {...item} className={row} style={stepped}>
      <span aria-hidden="true" className="relative grid size-4 shrink-0 place-items-center">
        <span className={unlit} />
        <SelectPrimitive.ItemIndicator className="absolute inset-0 grid place-items-center">
          <span className={lit} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <span className="min-w-0 flex-1 truncate">
        <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      </span>
    </SelectPrimitive.Item>
  );
}
