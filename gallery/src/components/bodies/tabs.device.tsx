/**
 * Tabs, Device's body (proposals/worlds.md, Bodies; material.md, 8): legends engraved on the body, with a lamp under
 * the current one. It switches on in place and never glides.
 *
 * - Underline: each tab is a legend, a caption in the mono as engraved capitals (litt-legend: --label-case,
 *   --label-tracking, --engrave), --fg-subtle until chosen and --fg when it is. Under every legend sits a small lamp
 *   (6px). The current one is lit in --fg, the rest are dim rings. A lamp never says the state alone: aria-selected does,
 *   and so does the word's ink. Tabs take no accent (R6 keeps it for the view's one accent). A hairline runs under the
 *   row, as on the other bodies.
 * - Segmented: a row of keys on one skirt. The track is the skirt, a darker plate with a rim, and the keys stand on it a
 *   hair apart, each a key face (--block, the lit top edge, the darker lower edge). The chosen key is latched down: it
 *   has sunk the whole --press-depth (2px) onto the skirt, its cast is the pressed one (--block-press), and its lamp is
 *   lit. A key under the hand sinks the same 2px, and never more, whatever fun mode asks.
 * - Motion: nothing travels between tabs. The change switches in place in three steps on the instant tier (steps(3,
 *   end), --dur-instant), as the switch's detent does: the lamp lights, the word's ink changes and a key drops.
 *   Reduced motion zeroes the tier, so the step is at once.
 * - Forced colors drops shadows and fills, so the skirt and the keys get real borders, a lit lamp is a system highlight
 *   and an unlit one an outline, and the latched key's border is the highlight.
 * - The contract (value, variant, size, the roles, roving focus, arrow keys, the touch fill) is tabs.tsx's.
 */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { CSSProperties } from "react";
import type { TabsListBodyProps, TabsTriggerBodyProps } from "../tabs";

/* The step: three even steps on the instant tier, as the display's segments light. */
const STEPS = "steps(3, end)";
const STEP: CSSProperties = {
  transitionProperty: "color, background-color, box-shadow, transform",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: STEPS,
};

/** The row: a hairline under the legends (underline), or one skirt the keys stand on (segmented). */
export function TabsListDeviceBody({ variant, size, className, rootProps }: TabsListBodyProps) {
  if (variant === "underline") {
    return (
      <div data-body="device" className="border-b border-line">
        <TabsPrimitive.List className={"-mb-px flex w-full overflow-x-auto pb-px [scrollbar-width:none] " + className} {...rootProps} />
      </div>
    );
  }
  return (
    <TabsPrimitive.List
      data-body="device"
      className={
        "inline-flex w-fit max-w-full gap-px overflow-x-auto overflow-y-hidden rounded-control pb-0.5 [scrollbar-width:none] " +
        "bg-[color-mix(in_oklab,black_42%,var(--block))] shadow-[0_0_0_1px_color-mix(in_oklab,black_22%,transparent)] forced-colors:border " +
        (size === "sm" ? "h-control-sm pointer-coarse:h-control-md " : "h-control-md ") +
        className
      }
      {...rootProps}
    />
  );
}

const base =
  "litt-target group/tab relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none " +
  "font-title font-mono text-caption litt-legend [-webkit-tap-highlight-color:transparent] " +
  "disabled:cursor-not-allowed disabled:text-fg-disabled " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";

/* Underline: a legend with its lamp below. */
const legend: Record<TabsTriggerBodyProps["size"], string> = {
  md: "h-control-md px-control-pad-md pb-1.5",
  sm: "h-control-sm pointer-coarse:h-control-md px-control-pad-sm pb-1",
};
const legendInk = "rounded-control text-fg-subtle hover:text-fg data-[state=active]:text-fg enabled:pointer-coarse:active:text-fg";

/* Segmented: a key on the skirt. Latched, it has sunk its 2px and its cast is the pressed one; under the hand it sinks the same. */
const key: Record<TabsTriggerBodyProps["size"], string> = {
  md: "h-full px-control-pad-md",
  sm: "h-full px-control-pad-sm",
};
const keyFace =
  "rounded-control bg-block text-fg-muted hover:bg-(--block-hover) hover:text-fg " +
  "[--key-edge:var(--highlight),inset_0_-1px_0_color-mix(in_oklab,black_10%,transparent)] shadow-(--key-edge) " +
  "data-[state=active]:text-fg data-[state=active]:shadow-(--block-press) data-[state=active]:[transform:translateY(var(--press-depth))] " +
  "enabled:active:text-fg enabled:active:shadow-(--block-press) enabled:active:[transform:translateY(var(--press-depth))] " +
  "forced-colors:border forced-colors:data-[state=active]:border-[Highlight]";

/* The lamp: unlit a dim ring, lit the ink of the body. */
const lamp =
  "size-1.5 shrink-0 rounded-pill shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_30%,transparent)] " +
  "group-data-[state=active]/tab:bg-fg group-data-[state=active]/tab:shadow-[0_0_5px_color-mix(in_oklab,var(--fg)_45%,transparent)] " +
  "forced-colors:border forced-colors:bg-transparent forced-colors:group-data-[state=active]/tab:bg-[Highlight]";

/** One tab: a legend and its lamp, or a key with its lamp. The selected state is Radix's data-state. */
export function TabsTriggerDeviceBody({ value, variant, size, className, triggerRef, rootProps, children }: TabsTriggerBodyProps) {
  const underline = variant === "underline";
  return (
    <TabsPrimitive.Trigger
      ref={triggerRef}
      value={value}
      data-body="device"
      className={[base, underline ? legend[size] + " " + legendInk : key[size] + " " + keyFace, className].join(" ")}
      {...rootProps}
      style={{ ...STEP, ...rootProps.style }}
    >
      {underline ? (
        <>
          <span className="litt-trim relative">{children}</span>
          <span aria-hidden="true" className={lamp + " absolute bottom-1 left-1/2 -translate-x-1/2"} style={STEP} />
        </>
      ) : (
        <span className="relative inline-flex items-center gap-2">
          <span aria-hidden="true" className={lamp} style={STEP} />
          <span className="litt-trim">{children}</span>
        </span>
      )}
    </TabsPrimitive.Trigger>
  );
}
