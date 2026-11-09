/**
 * Token input, the Device body (proposals/worlds.md, Bodies; material.md, 8): the Input's glass, with the tokens as lit
 * cells on it.
 *
 * - The field is the Input's: a bezel well (--tray, --tray-shade, 2px of body between the glass and the wall) around a
 *   pane of LCD glass (--field, --field-shade, the mono through font-field). It grows by whole rows of cells as they
 *   wrap, never under the control height (32, 44, 56). Focus and an error ring the well, not the glass.
 * - A token is an inverted cell: the glass lit in --field-ink with its words dark on it, in the mono at the caption
 *   size. At its right end sits a small key (--block, --key-lift) that removes it. The key is a real button named
 *   "Remove @stripe.com", 20px, and a 44px target on coarse pointers through an invisible ::before. Pressed, it sinks the
 *   whole --press-depth and its cast steps down (--block-press).
 * - The "+N" stands for tokens and is not one, so it is plain lit words on the glass in --field-ink-subtle, with no cell
 *   and no key.
 * - Disabled lies flat: a --surface-2 well with a hairline, the glass dimmed, the cells plain --surface-3 with their
 *   words in --fg-subtle and the keys off.
 * - Motion: nothing glides. A token switches in and out in place in three steps on the instant tier, its neighbors do
 *   not slide, and the ring switches in steps too. Reduced motion zeroes the tier.
 * - The label is engraved on the body above the well (litt-legend). The hint is a dim LCD line under it, an error its
 *   words beside a lamp in --danger, as the Input's note.
 * - Forced colors drops shadows and fills, so the well, the glass, the cells and the keys get real borders.
 */
import type { CSSProperties } from "react";
import { useDevice } from "@/motion";
import type { TokenInputBodyProps, TokenSkin } from "../token-input";

/* Switches in three steps on the instant tier, as the switch's detent does. */
const STEPS = "steps(3, end)";
const steps: CSSProperties = { transitionProperty: "box-shadow", transitionDuration: "var(--dur-instant)", transitionTimingFunction: `${STEPS}` };
const stepsKey: CSSProperties = { transitionProperty: "transform,box-shadow,color,background-color", transitionDuration: "var(--dur-instant)", transitionTimingFunction: `${STEPS}` };

/* The bezel. It carries the field's state through :has and data, because the element inside is the one that takes focus. */
const WELL =
  "relative flex w-full min-w-0 cursor-text bg-tray p-0.5 shadow-(--tray-shade) " +
  "has-[input:focus-visible]:shadow-[var(--tray-shade),var(--focus-ring)] " +
  "data-[invalid]:shadow-[var(--tray-shade),0_0_0_2px_var(--danger)] " +
  "data-[invalid]:has-[input:focus-visible]:shadow-[var(--tray-shade),0_0_0_2px_var(--danger),var(--focus-ring)] " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-2 data-[disabled]:shadow-[inset_0_0_0_1px_var(--line)] " +
  "forced-colors:border forced-colors:has-[input:focus-visible]:outline-2 forced-colors:has-[input:focus-visible]:outline-solid forced-colors:has-[input:focus-visible]:outline-offset-2";

/* The well's corners: the control radius, never past half the one-line height, so a field that wraps keeps the corners it had on one line. The glass's are the same less the 2px of bezel. */
const RADIUS = {
  sm: "rounded-[min(var(--radius-control),calc(var(--control-sm)/2))] pointer-coarse:rounded-[min(var(--radius-control),calc(var(--control-md)/2))]",
  md: "rounded-[min(var(--radius-control),calc(var(--control-md)/2))]",
  lg: "rounded-[min(var(--radius-control),calc(var(--control-lg)/2))]",
};
const WELL_SIZE = {
  sm: "min-h-control-sm pointer-coarse:min-h-control-md",
  md: "min-h-control-md",
  lg: "min-h-control-lg",
};

/* The glass, concentric with the well: its radius less the 2px of bezel. Its air plus a 24px row of cells fills the well. */
const GLASS_RADIUS = {
  sm: "calc(min(var(--radius-control), calc(var(--control-sm) / 2)) - 2px)",
  md: "calc(min(var(--radius-control), calc(var(--control-md) / 2)) - 2px)",
  lg: "calc(min(var(--radius-control), calc(var(--control-lg) / 2)) - 2px)",
};
const glassRadius = (size: "sm" | "md" | "lg", coarse: boolean): CSSProperties => ({ borderRadius: GLASS_RADIUS[size === "sm" && coarse ? "md" : size] });
const GLASS_SIZE = {
  sm: "px-1 py-0.5",
  md: "px-2 py-2",
  lg: "px-4 py-3.5",
};
const TEXT_SIZE = {
  sm: "text-small",
  md: "text-body",
  lg: "text-(length:--control-text-lg)",
};
const GLASS =
  "flex min-w-0 flex-1 items-center bg-field font-field text-field-ink shadow-(--field-shade) forced-colors:border " +
  "data-[disabled]:bg-transparent data-[disabled]:shadow-none";

/* The cell sits 8px in from the glass's walls (4px at sm), the key 2px in from the cell's. */
const CELL_RADIUS = "rounded-[max(calc(var(--radius-control)-4px),min(calc(var(--radius-control)-2px),2px))]";
const KEY_RADIUS = CELL_RADIUS;

const REMOVE =
  "relative grid size-5 shrink-0 cursor-pointer place-items-center select-none " + KEY_RADIUS + " bg-block text-fg shadow-(--key-lift) " +
  "hover:bg-(--block-hover) active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))] " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:shadow-none disabled:hover:bg-surface-2 " +
  "forced-colors:border " +
  /* An invisible 44px target around the 20px key on a finger. */
  "pointer-coarse:before:absolute pointer-coarse:before:-inset-3";

/** A 16px cross, drawn inside the 20px key. */
function Cross() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" />
    </svg>
  );
}

const SKIN: TokenSkin = {
  Chip: ({ disabled, children }) => (
    <span
      className={
        "inline-flex h-6 max-w-full min-w-0 items-center gap-1 whitespace-nowrap pr-0.5 pl-2 text-caption " +
        CELL_RADIUS +
        (disabled ? " bg-surface-3 text-fg-subtle" : " bg-field-ink text-field") +
        " forced-colors:border"
      }
      style={stepsKey}
    >
      {children}
    </span>
  ),
  text: () => "min-w-0 truncate",
  remove: REMOVE,
  Cross,
  more: "inline-flex h-6 shrink-0 cursor-default items-center px-2 text-caption text-field-ink-subtle",
};

/** Device, LCD glass in a bezel well, the tokens as lit cells with a key each. */
export function TokenInputDeviceBody({ size, invalid, disabled, className, label, labelId, inputId, note, noteId, field, list, input, hidden, said }: TokenInputBodyProps) {
  const { coarse } = useDevice();
  return (
    <div data-body="device" className={"grid gap-2 " + className}>
      <label id={labelId} htmlFor={inputId} className={"litt-legend text-caption font-title " + (disabled ? "text-fg-disabled" : "text-fg")}>
        {label}
      </label>

      <div
        ref={field.ref}
        data-invalid={invalid ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={[WELL, RADIUS[size], WELL_SIZE[size]].join(" ")}
        style={steps}
        onMouseDown={field.onMouseDown}
        onFocus={field.onFocus}
        onBlur={field.onBlur}
      >
        <div data-disabled={disabled ? "" : undefined} style={glassRadius(size, coarse)} className={[GLASS,GLASS_SIZE[size], TEXT_SIZE[size], "pointer-coarse:text-(length:--control-text-lg)"].join(" ")}>
          <div className="relative flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {list(SKIN)}
            {input}
          </div>
        </div>
        {hidden}
      </div>

      {note && (
        <p id={noteId} className="flex max-w-full items-center gap-2 font-field text-caption">
          {/* The error's lamp sits on the body beside the glass, clear of the glass's curve. */}
          {invalid && (
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-pill bg-danger shadow-[0_0_6px_var(--danger)] forced-colors:bg-[Highlight]" />
          )}
          <span
            className={
              "w-fit max-w-full rounded-control bg-field px-2.5 py-1 shadow-(--field-shade) forced-colors:border " +
              (invalid ? "text-field-ink" : "text-field-ink-subtle")
            }
          >
            {note}
          </span>
        </p>
      )}

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {said}
      </div>
    </div>
  );
}
