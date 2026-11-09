/**
 * The Slider's Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md): a page, not an instrument. No plate, no
 * shadow, no notch cut into anything. The track is a 6px --surface-3 pill, the pulled-out part is the ink, and the cap is
 * a round 20px ink knob with no grip line and nothing to sink into: held, it only swells a little under the finger. The
 * marks are dots under the track and home's is a larger dot. The value is said in words at the end of the track, in the
 * ink, so a slider reads as a line of text with a track in it. The travel's inset is --sl-pad, the knob's radius (10px),
 * which the root sets and the hand reads back as its left padding. The ring for keyboard focus goes on the knob, since
 * the root is invisible. It takes the contract the Slider and the RangeSlider resolve (SliderBodyProps): the props, the
 * keys and the hand are theirs, not this file's. A range has no end to say its span at, so its label row does.
 */
import * as RadixSlider from "@radix-ui/react-slider";
import type { CSSProperties } from "react";
import type { SliderBodyProps } from "../slider";

const rootLook =
  "group relative block h-control-md min-w-0 cursor-grab touch-pan-y select-none rounded-none bg-transparent shadow-none " +
  "[--sl-pad:10px] pl-(--sl-pad) data-held:cursor-grabbing " +
  "data-disabled:cursor-not-allowed forced-colors:border";
const track =
  "pointer-events-none absolute top-4.75 h-1.5 overflow-hidden rounded-pill bg-surface-3 " +
  "group-data-disabled:bg-surface-2 forced-colors:border";
const capTravel = "pointer-events-none absolute inset-y-0";
const fillTravel = "absolute inset-y-0 left-2 right-2";
const fillLook = "bg-fg group-data-disabled:bg-[color-mix(in_oklab,var(--fg)_12%,transparent)] forced-colors:bg-[Highlight]";
const glides = " transition-transform duration-(--dur-responsive) ease-responsive";
const capBox = "absolute top-3 -right-2.5 h-5 w-5 origin-center transition-transform duration-(--dur-responsive) ease-responsive";
const capFace = "absolute inset-0 rounded-pill bg-fg forced-colors:border forced-colors:bg-[Highlight] group-data-disabled:bg-fg-disabled";
/* One cap rings itself when the root has keyboard focus; on a range the focused cap rings itself (cap.ring). */
const ringOne = " group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-focus";
const ringOf = " outline-2 outline-offset-2 outline-focus";
const thumbTrack = "absolute inset-y-0";
const thumbHidden = "block h-full w-2 opacity-0 focus-visible:outline-none";
/* The value in words: the ink, tabular, a fixed width so the track does not breathe as it changes. */
const valueLook = "min-w-[4ch] text-right text-small font-title tabular-nums text-fg group-data-disabled:text-fg-subtle";

const inset = (less = 0) => `calc(var(--sl-pad) - ${less}px)`;
const insetX = (less = 0): CSSProperties => ({ left: inset(less), right: inset(less) });

/** The Flat body: a pill track, an ink fill and a round knob, for one cap or two, with the value in words at the track's end. */
export function SliderFlat({ range, caps, fill, notches, glide, held, shown, disabled, plateRef, root, thumbs }: SliderBodyProps) {
  const slider = (
    <RadixSlider.Root
      ref={plateRef}
      {...root}
      data-body={shown === undefined ? "flat" : undefined}
      data-no-drag=""
      data-held={held ? "" : undefined}
      className={rootLook + (shown === undefined ? " w-full" : " flex-1")}
    >
      <span aria-hidden="true" className={track} style={insetX(8)}>
        <span className={fillTravel + (range ? " origin-left" : "") + (glide ? glides : "")} style={fill}>
          <span className={(range ? "absolute inset-0 " : "absolute inset-y-0 right-0 w-[calc(100%+0.5rem)] ") + fillLook} />
        </span>
      </span>
      {notches.map((n) => (
        <span
          key={n.p}
          aria-hidden="true"
          className={
            "pointer-events-none absolute -translate-x-1/2 rounded-pill group-data-disabled:hidden forced-colors:bg-[CanvasText] " +
            (n.home ? "top-9 size-1.5 bg-fg" : "top-9.5 size-1 bg-fg-subtle")
          }
          style={{ left: `calc(${inset()} + (100% - 2 * ${inset()}) * ${n.p.toFixed(4)})` }}
        />
      ))}
      {caps.map((cap, i) => (
        <span key={i} aria-hidden="true" className={capTravel + (glide ? glides : "")} style={{ ...insetX(), transform: `translateX(${((cap.p - 1) * 100).toFixed(3)}%)` }}>
          <span className={capBox} style={{ transform: `scale(${cap.held ? 1.12 : 1})` }}>
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
  if (shown === undefined) return slider;
  return (
    <div data-body="flat" data-disabled={disabled ? "" : undefined} className="group flex items-center gap-3">
      {slider}
      <span aria-hidden="true" className={valueLook}>
        {shown}
      </span>
    </div>
  );
}
