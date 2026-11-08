/**
 * Option picker, the Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): the text track is the Segmented
 * control's Flat look (no frame, the pick a grey bubble in ink), gliding to the pick; swatch chips keep their fg-12%
 * hairline, since the product's color needs an edge. The classes are the Press body's: the tokens answer Flat, so the
 * same recipe draws grey pills here.
 */
import { LayoutGroup, motion } from "motion/react";
import { CheckIcon } from "@/components/icons";
import type { OptionPickerBodyProps } from "../option-picker";

/** What a finger holding an unpicked segment shows: the fg 6% fill that rows and tabs share, and the hover text color. */
const PRESS = "pointer-coarse:active:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] pointer-coarse:active:text-fg";

/** Flat: grey pills with the pick lifted in ink, or chips for colors and images. */
export function OptionPickerFlatBody({ group, values, value, swatches, onPick, labelOf, inkOf, glide, groupId }: OptionPickerBodyProps) {
  return swatches ? (
    <div data-body="flat" className="flex flex-wrap gap-2 pointer-coarse:gap-3">
      {values.map((v) => {
        const on = v.value === value;
        const out = v.available === false;
        const ink = inkOf(v);
        return (
          <label key={v.value} className="litt-target relative block cursor-pointer [-webkit-tap-highlight-color:transparent]">
            <input
              type="radio"
              name={group}
              value={v.value}
              checked={on}
              onChange={() => onPick(v.value)}
              className="peer sr-only"
            />
            <span className="sr-only">
              {labelOf(v)}
              {out && ", sold out"}
            </span>
            <span
              aria-hidden="true"
              className={
                "relative grid size-6 place-items-center overflow-hidden rounded-control bg-cover bg-center pointer-coarse:size-8 " +
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
              }
              style={{
                backgroundColor: v.swatch?.color,
                backgroundImage: v.swatch?.image ? `url("${v.swatch.image}")` : undefined,
                color: ink ?? "var(--fg)",
              }}
            >
              {/* Sold out fades the color, never the hairline, so the chip keeps its edge on any surface. */}
              {out && <span className="absolute inset-0 bg-canvas opacity-60" />}
              <span className="pointer-events-none absolute inset-0 rounded-control shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_12%,transparent)]" />
              {on && <CheckIcon className="relative" />}
            </span>
          </label>
        );
      })}
    </div>
  ) : (
    <LayoutGroup id={groupId}>
      <div data-body="flat" className="relative grid h-control-md w-full grid-flow-col auto-cols-fr rounded-control bg-tray p-0.5 shadow-(--tray-shade) forced-colors:border">
        {values.map((v) => {
          const on = v.value === value;
          const out = v.available === false;
          return (
            <label
              key={v.value}
              className={
                "litt-target relative grid h-full min-w-0 cursor-pointer select-none place-items-center rounded-[calc(var(--radius-control)-2px)] px-2 text-small font-title " +
                "transition-colors duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                (out ? "text-fg-disabled" : on ? "text-fg" : "text-fg-subtle hover:text-fg " + PRESS)
              }
            >
              <input
                type="radio"
                name={group}
                value={v.value}
                checked={on}
                onChange={() => onPick(v.value)}
                className="peer sr-only"
              />
              {on && (
                <motion.span
                  layoutId="option-surface"
                  transition={glide}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[calc(var(--radius-control)-2px)] bg-block shadow-(--block-lift) forced-colors:border-2"
                />
              )}
              <span className="litt-trim relative z-1 truncate">
                {labelOf(v)}
                {out && <span className="sr-only">, sold out</span>}
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-1 rounded-[calc(var(--radius-control)-2px)] peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
              />
            </label>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
