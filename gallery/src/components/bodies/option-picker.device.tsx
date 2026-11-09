/**
 * Option picker, the Device body (proposals/worlds.md, Bodies; material.md, 8): a bank of latching keys.
 *
 * - Words: the values are a row of keys (--block, --key-lift: a face, a dark rim and a 2px skirt) in one well
 *   (--tray, --tray-shade), equal in width. A key's corners are the well's less its 2px inset, so the two stay
 *   concentric at every shape. Its legend is engraved (litt-legend, --engrave) in the mono at the caption size.
 * - Latching: the picked key stays down, as a bank of radio keys does. It sinks the whole --press-depth (2px) onto
 *   its skirt, takes --block-press, and its lamp lights (--fg on the body). The others stand, their lamps a dim ring.
 *   Picking another lets the first up and takes the new one down. Under the hand an unpicked key sinks the same 2px
 *   before it latches. It always travels 2px, and ignores fun mode's deeper sink.
 * - Sold out: the key lies flat in the well (--surface-2, a hairline, no skirt and no sink) and says "sold out" in
 *   words on its face. It stays a radio you can pick, as the contract has it, so the reason is found; picked, its lamp
 *   lights and its legend steps up to --fg-subtle, and the contract's legend says Sold out.
 * - Swatches: each chip stands in a small key of its own, the chip inset 2px with the control radius less 2px. The
 *   picked key sinks and carries the check; a sold-out chip fades under its hairline on a key that lies flat. The color
 *   is the product's and fills only the chip.
 * - Motion: nothing glides. A key switches in place in three steps on the instant tier (100ms), as the Switch's detent
 *   does; reduced motion zeroes the tier, so it switches at once.
 * - Forced colors drops shadows and fills, so the well and each key get real borders, the picked key a 2px one, a lit lamp
 *   is a system highlight and an unlit one an outline.
 */
import type { CSSProperties } from "react";
import { CheckIcon } from "@/components/icons";
import type { OptionPickerBodyProps } from "../option-picker";

/* The detent: a key changes in three steps on the instant tier, never a glide. */
const STEPS = "steps(3, end)";
const detent: CSSProperties = {
  transitionProperty: "transform, box-shadow, color, background-color",
  transitionDuration: "var(--dur-instant)",
  transitionTimingFunction: `${STEPS}, var(--ease-out), var(--ease-out), var(--ease-out)`,
};

/* A key standing, a key down (latched, or held), and a key lying flat (sold out). */
const up = "bg-block shadow-(--key-lift)";
const down = "bg-block shadow-(--block-press) [transform:translateY(var(--press-depth))]";
const held = "active:shadow-(--block-press) active:[transform:translateY(var(--press-depth))]";
const flat = "bg-surface-2 shadow-[inset_0_0_0_1px_var(--line)]";

const lamp = "size-1.5 shrink-0 rounded-pill forced-colors:border";
const lampLit = " bg-fg forced-colors:bg-[Highlight]";
const lampOff = " shadow-[inset_0_0_0_1px_var(--line-control)] forced-colors:bg-transparent";

/** Device: a bank of latching keys with engraved legends and lamps, the picked one down; a sold-out one lies flat. */
export function OptionPickerDeviceBody({ group, values, value, swatches, onPick, labelOf, inkOf }: OptionPickerBodyProps) {
  if (swatches) {
    return (
      <div data-body="device" className="flex flex-wrap gap-2 pb-0.5 pointer-coarse:gap-3">
        {values.map((v) => {
          const on = v.value === value;
          const out = v.available === false;
          const ink = inkOf(v);
          return (
            <label key={v.value} className="litt-target relative block cursor-pointer [-webkit-tap-highlight-color:transparent]">
              <input type="radio" name={group} value={v.value} checked={on} onChange={() => onPick(v.value)} className="peer sr-only" />
              <span className="sr-only">
                {labelOf(v)}
                {out && ", sold out"}
              </span>
              <span
                aria-hidden="true"
                className={
                  "relative grid size-7 place-items-center rounded-control pointer-coarse:size-9 forced-colors:border " +
                  (out ? flat : on ? down : up + " " + held) +
                  " peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
                }
                style={detent}
              >
                <span
                  className="relative grid size-6 place-items-center overflow-hidden rounded-[calc(var(--radius-control)-2px)] bg-cover bg-center pointer-coarse:size-8"
                  style={{
                    backgroundColor: v.swatch?.color,
                    backgroundImage: v.swatch?.image ? `url("${v.swatch.image}")` : undefined,
                    color: ink ?? "var(--fg)",
                  }}
                >
                  {out && <span className="absolute inset-0 bg-canvas opacity-60" />}
                  <span className="pointer-events-none absolute inset-0 rounded-[calc(var(--radius-control)-2px)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_12%,transparent)]" />
                  {on && <CheckIcon className="relative" />}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    );
  }
  return (
    <div
      data-body="device"
      className="relative grid h-control-md w-full grid-flow-col auto-cols-fr items-start gap-0.5 overflow-hidden rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border"
    >
      {values.map((v) => {
        const on = v.value === value;
        const out = v.available === false;
        return (
          <label
            key={v.value}
            className={
              "litt-target relative grid h-9.5 min-w-0 cursor-pointer select-none place-items-center rounded-[calc(var(--radius-control)-2px)] px-2 font-title text-caption litt-legend " +
              "[-webkit-tap-highlight-color:transparent] forced-colors:border " +
              (out
                ? flat + " " + (on ? "text-fg-subtle" : "text-fg-disabled")
                : (on ? down + " text-fg" : up + " " + held + " text-fg-subtle hover:text-fg")) +
              (on ? " forced-colors:border-2" : "")
            }
            style={detent}
          >
            <input type="radio" name={group} value={v.value} checked={on} onChange={() => onPick(v.value)} className="peer sr-only" />
            {/* One line, the lamp at the key's middle, so it stays clear of a round key's curves at every shape. */}
            <span className="relative z-1 flex min-w-0 max-w-full items-center gap-1.5 leading-none">
              <span aria-hidden="true" className={lamp + (on ? (out ? " bg-fg-subtle forced-colors:bg-[Highlight]" : lampLit) : lampOff)} />
              <span className={out ? "shrink-0" : "truncate"}>{labelOf(v)}</span>
              {out && (
                <>
                  {/* The name stays whole; in a narrow key the words after it give way. */}
                  <span aria-hidden="true" className="min-w-0 truncate text-fg-disabled">sold out</span>
                  <span className="sr-only">, sold out</span>
                </>
              )}
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-1 rounded-[calc(var(--radius-control)-2px)] peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
            />
          </label>
        );
      })}
    </div>
  );
}
