/**
 * Option picker, the Flat body (proposals/worlds.md, Bodies; material.md, 7): the page, in ink. No tray and no track:
 * each value is its own word in a grey pill (--block is the grey), set apart by space, and the one you chose is an ink
 * pill (--fg, with --canvas words). A sold-out value is an outlined pill (off) with its word struck through and
 * "sold out" said beside it in words. A color is a plain circle, and the chosen one is ringed in ink. Nothing glides,
 * nothing casts.
 */
import type { OptionPickerBodyProps } from "../option-picker";

const tweens = "transition-[color,background-color] duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent]";

/** Flat: grey pills with the pick in ink, or plain circles ringed in ink for colors and images. */
export function OptionPickerFlatBody({ group, values, value, swatches, onPick, labelOf }: OptionPickerBodyProps) {
  return (
    <div data-body="flat" className={"flex flex-wrap " + (swatches ? "gap-3 p-1 pointer-coarse:gap-4" : "gap-2")}>
      {values.map((v) => {
        const on = v.value === value;
        const out = v.available === false;
        const radio = (
          <input type="radio" name={group} value={v.value} checked={on} onChange={() => onPick(v.value)} className="peer sr-only" />
        );
        if (swatches) {
          return (
            <label key={v.value} className="litt-target relative block cursor-pointer [-webkit-tap-highlight-color:transparent]">
              {radio}
              <span className="sr-only">
                {labelOf(v)}
                {out && ", sold out"}
              </span>
              <span
                aria-hidden="true"
                className="relative block size-6 overflow-hidden rounded-pill bg-cover bg-center pointer-coarse:size-8"
                style={{
                  backgroundColor: v.swatch?.color,
                  backgroundImage: v.swatch?.image ? `url("${v.swatch.image}")` : undefined,
                }}
              >
                {out && <span className="absolute inset-0 bg-canvas opacity-60" />}
                {/* The product's color needs an edge on any page; this is content, not chrome. */}
                <span className="pointer-events-none absolute inset-0 rounded-pill shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_12%,transparent)]" />
                {/* Sold out is struck: one ink line across the circle. */}
                {out && <span className="absolute top-1/2 left-0 h-px w-full -rotate-45 bg-fg" />}
              </span>
              {/* The ring: ink round the chosen circle, off the circle by 2px. */}
              <span
                aria-hidden="true"
                className={"pointer-events-none absolute -inset-1 rounded-pill border-2 border-fg " + (on ? "" : "hidden")}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-2 rounded-pill peer-focus-visible:outline-2 peer-focus-visible:outline-focus"
              />
            </label>
          );
        }
        return (
          <label
            key={v.value}
            className={
              "litt-target relative flex h-control-sm cursor-pointer select-none items-center gap-1.5 rounded-pill border px-control-pad-sm text-small font-title " +
              tweens +
              " " +
              (on
                ? "border-fg bg-fg text-canvas forced-colors:border-2"
                : out
                  ? "border-line-control bg-transparent text-fg-subtle"
                  : "border-transparent bg-block text-fg-muted hover:bg-[color-mix(in_oklab,var(--fg)_8%,var(--block))] hover:text-fg active:bg-[color-mix(in_oklab,var(--fg)_12%,var(--block))] forced-colors:border")
            }
          >
            {radio}
            <span className={"litt-trim relative z-1 truncate" + (out ? " line-through" : "")}>
              {labelOf(v)}
              {out && <span className="sr-only">, sold out</span>}
            </span>
            {out && (
              <span aria-hidden="true" className="litt-trim relative z-1 text-caption font-normal">
                sold out
              </span>
            )}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-0.5 rounded-pill peer-focus-visible:outline-2 peer-focus-visible:outline-offset-0 peer-focus-visible:outline-focus"
            />
          </label>
        );
      })}
    </div>
  );
}
