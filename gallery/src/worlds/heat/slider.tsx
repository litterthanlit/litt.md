/**
 * The Slider's Heat body (proposals/heat.md; taste/litt-principles.md, Heat): a row of gold/amber dashed bars in a
 * square channel, lit up to the value (or between both caps for a range), as in the racing menu's Audio settings.
 *
 * - 16 crisp square dashes inside a flat dark channel (`bg-tray border border-line`), lit in `--accent-text` (amber at
 *   night, ink by day) and unlit in `--line-strong`. Zero shadows, zero rounded corners, instant cut.
 * - While held or focused via keyboard, four 6px amber corner brackets frame the channel (`--accent-text`), and a 2px
 *   ink marker sits at each cap's exact position.
 * - Takes `SliderBodyProps` from slider.tsx unchanged: pointer scrub, arrow keys, Home/End, range and form value stay
 *   the contract's.
 */
import * as RadixSlider from "@radix-ui/react-slider";
import type { CSSProperties } from "react";
import type { SliderBodyProps } from "@/components/slider";

const DASHES = 16;

const rootLook =
  "group relative block h-control-md min-w-0 cursor-ew-resize touch-pan-y select-none rounded-none bg-transparent " +
  "[--sl-pad:2px] pl-(--sl-pad) data-disabled:cursor-not-allowed forced-colors:border";

const channel =
  "pointer-events-none absolute top-2.5 flex h-6 items-center gap-1 rounded-none border border-line bg-tray px-1.5 " +
  "transition-[border-color] duration-(--dur-instant) ease-litt " +
  "group-hover:border-line-strong group-data-held:border-line-strong " +
  "group-data-disabled:bg-surface-2 group-data-disabled:border-line forced-colors:border";

const brackets =
  "pointer-events-none absolute -inset-px opacity-0 bg-no-repeat text-accent-text " +
  "transition-opacity duration-(--dur-instant) ease-litt " +
  "group-data-held:opacity-100 group-has-[:focus-visible]:opacity-100 group-data-disabled:opacity-0 " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px,6px_2px,2px_6px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

const capTravel = "pointer-events-none absolute inset-y-0";
const capLine = "absolute top-2.5 -right-px h-6 w-0.5 bg-fg group-data-disabled:bg-fg-disabled forced-colors:bg-[CanvasText]";
const ringOne = " group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-focus";
const ringOf = " outline-2 outline-offset-2 outline-focus";
const thumbTrack = "absolute inset-y-0";
const thumbHidden = "block h-full w-2 opacity-0 focus-visible:outline-none";
const valueLook = "min-w-[4ch] text-right text-small font-title tabular-nums text-fg group-data-disabled:text-fg-subtle";

const inset = (less = 0) => `calc(var(--sl-pad) - ${less}px)`;
const insetX = (less = 0): CSSProperties => ({ left: inset(less), right: inset(less) });

/** Heat's body: a row of dashed amber bars in a flat square channel, lit up to the value. */
export function SliderHeat({ range, caps, notches, held, shown, disabled, plateRef, root, thumbs }: SliderBodyProps) {
  const lo = range ? (caps[0]?.p ?? 0) : 0;
  const hi = range ? (caps[1]?.p ?? 1) : (caps[0]?.p ?? 0);

  const slider = (
    <RadixSlider.Root
      ref={plateRef}
      {...root}
      data-body={shown === undefined ? "heat" : undefined}
      data-no-drag=""
      data-held={held ? "" : undefined}
      className={rootLook + (shown === undefined ? " w-full" : " flex-1")}
    >
      <span aria-hidden="true" className={channel + (range ? "" : ringOne)} style={insetX(2)}>
        <span className={brackets} />
        {Array.from({ length: DASHES }, (_, i) => {
          const mid = (i + 0.5) / DASHES;
          const lit = !disabled && (range ? mid >= lo - 1e-4 && mid <= hi + 1e-4 : hi > 0 && mid <= hi + 1e-4);
          return (
            <span
              key={i}
              className={
                "h-2.5 flex-1 transition-colors duration-(--dur-instant) ease-litt " +
                (lit
                  ? "bg-accent-text forced-colors:bg-[Highlight]"
                  : "bg-line-strong group-data-disabled:bg-line")
              }
            />
          );
        })}
      </span>
      {notches.map((n) => (
        <span
          key={n.p}
          aria-hidden="true"
          className={
            "pointer-events-none absolute top-9 w-px -translate-x-1/2 group-data-disabled:hidden forced-colors:bg-[CanvasText] " +
            (n.home ? "h-2 bg-accent-text" : "h-1 bg-line-strong")
          }
          style={{ left: `calc(${inset()} + (100% - 2 * ${inset()}) * ${n.p.toFixed(4)})` }}
        />
      ))}
      {caps.map((cap, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={capTravel}
          style={{ ...insetX(), transform: `translateX(${((cap.p - 1) * 100).toFixed(3)}%)` }}
        >
          <span className={capLine + (range && cap.ring ? ringOf : "")} />
        </span>
      ))}
      <RadixSlider.Track className={thumbTrack} style={insetX(4)}>
        {thumbs.map(({ key, ...thumb }) => (
          <RadixSlider.Thumb key={key} {...thumb} className={thumbHidden} />
        ))}
      </RadixSlider.Track>
    </RadixSlider.Root>
  );

  if (shown === undefined) return slider;
  return (
    <div data-body="heat" data-disabled={disabled ? "" : undefined} className="group flex items-center gap-3">
      {slider}
      <span aria-hidden="true" className={valueLook}>
        {shown}
      </span>
    </div>
  );
}
