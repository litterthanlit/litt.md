/**
 * The Slider's Rack body (proposals/rack.md): a value bar, as an instrument draws one. A 24px box cut into the panel
 * (--slot inside --slot-shade's 1px outline) at the control radius, the value filled from the start as a solid bar
 * (--slot-fill, never the accent: a form holds many sliders, R6), and the cap a 2px ink line the height of the box at
 * the value. Nothing to grab or sink: the hand takes the box anywhere, and the line and the bar follow it (the hand is
 * the contract's). The marks are 1px ticks under the box, home's longer. The value is said in words at the box's end,
 * in the ink and tabular. Keyboard focus rings the box (one cap) or the focused line (a range). The travel's inset is
 * --sl-pad, 1px, half the line, which the hand reads back as the root's left padding. A range says its span in the
 * label row, as in the other worlds.
 */
import * as RadixSlider from "@radix-ui/react-slider";
import type { CSSProperties } from "react";
import type { SliderBodyProps } from "../slider";

const rootLook =
  "group relative block h-control-md min-w-0 cursor-ew-resize touch-pan-y select-none rounded-none bg-transparent shadow-none " +
  "[--sl-pad:1px] pl-(--sl-pad) " +
  "data-disabled:cursor-not-allowed forced-colors:border";
const box =
  "pointer-events-none absolute top-2.5 h-6 overflow-hidden rounded-control bg-slot shadow-(--slot-shade) " +
  "group-data-disabled:bg-surface-2 group-data-disabled:shadow-[inset_0_0_0_1px_var(--line)] forced-colors:border";
const fillTravel = "absolute inset-y-0 left-px right-px";
const fillLook = "bg-slot-fill group-data-disabled:bg-[color-mix(in_oklab,var(--fg)_12%,transparent)] forced-colors:bg-[Highlight]";
const glides = " transition-transform duration-(--dur-responsive) ease-responsive";
const capTravel = "pointer-events-none absolute inset-y-0";
const capLine = "absolute top-2.5 -right-px h-6 w-0.5 bg-fg group-data-disabled:bg-fg-disabled forced-colors:bg-[CanvasText]";
/* One cap: the box rings itself when the root has keyboard focus; on a range the focused line rings itself (cap.ring). */
const ringOne = " group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-focus";
const ringOf = " outline-2 outline-offset-2 outline-focus";
const thumbTrack = "absolute inset-y-0";
const thumbHidden = "block h-full w-2 opacity-0 focus-visible:outline-none";
const valueLook = "min-w-[4ch] text-right text-small font-title tabular-nums text-fg group-data-disabled:text-fg-subtle";

const inset = (less = 0) => `calc(var(--sl-pad) - ${less}px)`;
const insetX = (less = 0): CSSProperties => ({ left: inset(less), right: inset(less) });

/** The Rack body: a value bar in a box, a 2px line at the value, for one cap or two, the value in words at the end. */
export function SliderRack({ range, caps, fill, notches, glide, held, shown, disabled, plateRef, root, thumbs }: SliderBodyProps) {
  const slider = (
    <RadixSlider.Root
      ref={plateRef}
      {...root}
      data-body={shown === undefined ? "rack" : undefined}
      data-no-drag=""
      data-held={held ? "" : undefined}
      className={rootLook + (shown === undefined ? " w-full" : " flex-1")}
    >
      <span aria-hidden="true" className={box + (range ? "" : ringOne)} style={insetX(1)}>
        <span className={fillTravel + (range ? " origin-left" : "") + (glide ? glides : "")} style={fill}>
          <span className={(range ? "absolute inset-0 " : "absolute inset-y-0 right-0 w-[calc(100%+1px)] ") + fillLook} />
        </span>
      </span>
      {notches.map((n) => (
        <span
          key={n.p}
          aria-hidden="true"
          className={
            "pointer-events-none absolute top-9 w-px -translate-x-1/2 group-data-disabled:hidden forced-colors:bg-[CanvasText] " +
            (n.home ? "h-2 bg-fg" : "h-1 bg-fg-subtle")
          }
          style={{ left: `calc(${inset()} + (100% - 2 * ${inset()}) * ${n.p.toFixed(4)})` }}
        />
      ))}
      {caps.map((cap, i) => (
        <span key={i} aria-hidden="true" className={capTravel + (glide ? glides : "")} style={{ ...insetX(), transform: `translateX(${((cap.p - 1) * 100).toFixed(3)}%)` }}>
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
    <div data-body="rack" data-disabled={disabled ? "" : undefined} className="group flex items-center gap-3">
      {slider}
      <span aria-hidden="true" className={valueLook}>
        {shown}
      </span>
    </div>
  );
}
