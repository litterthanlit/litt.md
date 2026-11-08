/**
 * The Slider's Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): a page, not an instrument. No plate. The
 * slot is a thin 4px --surface-3 track, the pulled-out part is the ink, and the cap is a 20px ink knob ringed in
 * --canvas, with no grip line. The travel's inset is --sl-pad, the knob's radius (10px), which the root sets and the
 * hand reads back as its left padding. The ring for keyboard focus goes on the knob, since the root is invisible.
 * It takes the contract the Slider and the RangeSlider resolve (SliderBodyProps): the props, the keys and the hand are
 * theirs, not this file's.
 */
import * as RadixSlider from "@radix-ui/react-slider";
import type { CSSProperties } from "react";
import type { SliderBodyProps } from "../slider";

const rootLook =
  "group relative block h-control-md w-full cursor-grab touch-pan-y select-none rounded-none bg-transparent shadow-none " +
  "[--sl-pad:10px] pl-(--sl-pad) data-held:cursor-grabbing " +
  "data-disabled:cursor-not-allowed data-disabled:bg-transparent data-disabled:shadow-none " +
  "forced-colors:border";
const slot =
  "pointer-events-none absolute top-5 h-1 overflow-hidden rounded-[calc(var(--radius-control)-2px)] bg-slot shadow-(--slot-shade) " +
  "group-data-disabled:bg-surface-3 group-data-disabled:shadow-none forced-colors:border";
const capTravel = "pointer-events-none absolute inset-y-0";
const fillTravel = "absolute inset-y-0 left-2 right-2";
const fillLook =
  "bg-fg shadow-(--slot-fill-shade) " +
  "group-data-disabled:bg-[color-mix(in_oklab,var(--fg)_12%,transparent)] group-data-disabled:shadow-none forced-colors:bg-[Highlight]";
const glides = " transition-transform duration-(--dur-responsive) ease-responsive";
const capBox = "absolute top-3 -right-2.5 h-5 w-5 origin-center transition-transform duration-(--dur-responsive) ease-responsive";
const capFace =
  "absolute inset-0 rounded-pill bg-fg shadow-[0_0_0_3px_var(--canvas)] forced-colors:border forced-colors:bg-[Highlight] " +
  "group-data-disabled:bg-fg-disabled group-data-disabled:shadow-[0_0_0_3px_var(--canvas)]";
/* One cap rings itself when the root has keyboard focus; on a range the focused cap rings itself (cap.ring). */
const ringOne = " group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-focus";
const ringOf = " outline-2 outline-offset-2 outline-focus";
const thumbTrack = "absolute inset-y-0";
const thumbHidden = "block h-full w-2 opacity-0 focus-visible:outline-none";

const inset = (less = 0) => `calc(var(--sl-pad) - ${less}px)`;
const insetX = (less = 0): CSSProperties => ({ left: inset(less), right: inset(less) });

/** The Flat body: a thin track, an ink fill and a round knob, for one cap or two. */
export function SliderFlat({ range, caps, fill, notches, glide, held, plateRef, root, thumbs }: SliderBodyProps) {
  return (
    <RadixSlider.Root ref={plateRef} {...root} data-body="flat" data-no-drag="" data-held={held ? "" : undefined} className={rootLook}>
      <span aria-hidden="true" className={slot} style={insetX(8)}>
        <span className={fillTravel + (range ? " origin-left" : "") + (glide ? glides : "")} style={fill}>
          <span className={(range ? "absolute inset-0 " : "absolute inset-y-0 right-0 w-[calc(100%+0.5rem)] ") + fillLook} />
        </span>
      </span>
      {notches.map((n) => (
        <span
          key={n.p}
          aria-hidden="true"
          className={
            "pointer-events-none absolute w-px -translate-x-1/2 group-data-disabled:hidden forced-colors:bg-[CanvasText] " +
            (n.home ? "top-8 h-2 bg-notch-home" : "top-8 h-1 bg-notch")
          }
          style={{ left: `calc(${inset()} + (100% - 2 * ${inset()}) * ${n.p.toFixed(4)})` }}
        />
      ))}
      {caps.map((cap, i) => (
        <span key={i} aria-hidden="true" className={capTravel + (glide ? glides : "")} style={{ ...insetX(), transform: `translateX(${((cap.p - 1) * 100).toFixed(3)}%)` }}>
          <span className={capBox} style={{ transform: `translateY(${cap.held ? "var(--press-depth)" : "0px"}) rotate(${cap.lean}deg)` }}>
            <span className={capFace + (range ? (cap.ring ? ringOf : "") : ringOne)} />
          </span>
        </span>
      ))}
      <RadixSlider.Track className={thumbTrack} style={insetX(4)}>
        {thumbs.map(({ key, ...thumb }) => (
          <RadixSlider.Thumb key={key} {...thumb} className={thumbHidden} />
        ))}
      </RadixSlider.Track>
    </RadixSlider.Root>
  );
}
