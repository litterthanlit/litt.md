/**
 * The Slider's Flat body (taste v1.22, "Flat is the studies"; proposals/flat-studies/studies/knob.js and fader.js): a
 * fat round-ended pill, 28px tall, that fills with ink from its start to a white circle riding at the fill's end. The
 * track is --slot: paper on the grey ground, the grey bubble inside paper. The fill is the ink, round at both ends, and
 * at the start it is a circle round the knob, so a slider at its lowest still says where it is. The knob is a 20px
 * paper circle 4px in from the fill's end; held, it shrinks a little under the finger (0.85), on the instant tier.
 * Nothing casts, sinks or is cut into anything, and nothing is drawn as a dot: a mark is a short upright line under
 * the track, and home's is taller. The value is said in words at the end of the track, in the ink at the title weight.
 *
 * - The root is the track, 28px tall with 8px of air above and below, so the row keeps the control's 44px; a touch
 *   target grows it to 44px for a finger. The travel's inset is --sl-pad, 14px, the track's own radius, so the knob's centre runs from the centre of one
 *   round end to the centre of the other. The root sets it and the hand reads it back as its left padding.
 * - Only transforms move: the fill is a pill as wide as the travel plus its two ends, moved so its end sits at the knob,
 *   and clipped by the track; the knob rides on the same translate. A jump glides on the responsive spring; a drag
 *   follows 1:1. The ring for keyboard focus goes on the knob, since the root is invisible.
 * - It takes the contract the Slider and the RangeSlider resolve (SliderBodyProps): the props, the keys and the hand are
 *   theirs. A range fills the band between its two knobs, and its label row says its span.
 */
import * as RadixSlider from "@radix-ui/react-slider";
import type { CSSProperties } from "react";
import type { SliderBodyProps } from "@/components/slider";

/* The root is the track: a 28px pill, with 8px above and below it so the row keeps the control's 44px, and a touch
   target (litt-target) that grows it to 44px for a finger. */
const rootLook =
  "litt-target group relative my-2 block h-7 min-w-0 cursor-grab touch-pan-y select-none rounded-pill bg-slot shadow-none " +
  "[--sl-pad:14px] pl-(--sl-pad) data-held:cursor-grabbing " +
  "data-disabled:cursor-not-allowed data-disabled:bg-surface-2 forced-colors:border";
/* The ink's window: the track's own shape, so the fill takes its round ends. */
const track = "pointer-events-none absolute inset-0 overflow-hidden rounded-pill";
const capTravel = "pointer-events-none absolute inset-y-0";
/* The fill's rail is as wide as the travel, so its right edge sits at the knob's centre; the ink reaches the track's
   radius past it, round, and far enough back to cover the start. */
const fillTravel = "absolute inset-y-0";
const fillLook =
  "bg-fg group-data-disabled:bg-[color-mix(in_oklab,var(--fg)_14%,transparent)] forced-colors:bg-[Highlight]";
const glides = " transition-transform duration-(--dur-responsive) ease-responsive";
const capBox = "absolute top-1 -right-2.5 size-5 origin-center transition-[scale] duration-(--dur-instant) ease-litt";
const capFace =
  "absolute inset-0 rounded-pill bg-surface-1 forced-colors:border forced-colors:bg-[Canvas] group-data-disabled:bg-surface-1";
/* One knob rings itself when the root has keyboard focus; on a range the focused knob rings itself (cap.ring). */
const ringOne = " group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-focus";
const ringOf = " outline-2 outline-offset-2 outline-focus";
const thumbTrack = "absolute inset-y-0";
const thumbHidden = "block h-full w-2 opacity-0 focus-visible:outline-none";
/* The value in words: the ink, tabular, a fixed width so the track does not breathe as it changes. */
const valueLook = "min-w-[4ch] text-right text-small font-title tabular-nums text-fg group-data-disabled:text-fg-subtle";

const inset = (less = 0) => `calc(var(--sl-pad) - ${less}px)`;
const insetX = (less = 0): CSSProperties => ({ left: inset(less), right: inset(less) });

/** The Flat body: a fat pill track, an ink fill to a white knob, for one knob or two, with the value in words at the track's end. */
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
      <span aria-hidden="true" className={track}>
        {range ? (
          /* A range: the band between the knobs, from one knob's ends to the other's (a scale on its rail), under round ends that ride with each knob. */
          <>
            <span className={fillTravel + " origin-left" + (glide ? glides : "")} style={{ ...insetX(), ...fill }}>
              <span className={"absolute inset-0 " + fillLook} />
            </span>
            {caps.map((cap, i) => (
              <span key={i} className={fillTravel + (glide ? glides : "")} style={{ ...insetX(), transform: `translateX(${((cap.p - 1) * 100).toFixed(3)}%)` }}>
                <span className={"absolute inset-y-0 -right-3.5 w-7 rounded-pill " + fillLook} />
              </span>
            ))}
          </>
        ) : (
          <span className={fillTravel + (glide ? glides : "")} style={{ ...insetX(), ...fill }}>
            <span className={"absolute inset-y-0 -right-3.5 w-[calc(100%+1.75rem)] rounded-pill " + fillLook} />
          </span>
        )}
      </span>
      {notches.map((n) => (
        <span
          key={n.p}
          aria-hidden="true"
          className={
            "pointer-events-none absolute top-full mt-0.5 w-0.5 -translate-x-1/2 rounded-pill group-data-disabled:hidden forced-colors:bg-[CanvasText] " +
            (n.home ? "h-2 bg-fg" : "h-1.5 bg-fg-subtle")
          }
          style={{ left: `calc(${inset()} + (100% - 2 * ${inset()}) * ${n.p.toFixed(4)})` }}
        />
      ))}
      {caps.map((cap, i) => (
        <span key={i} aria-hidden="true" className={capTravel + (glide ? glides : "")} style={{ ...insetX(), transform: `translateX(${((cap.p - 1) * 100).toFixed(3)}%)` }}>
          <span className={capBox} style={{ scale: cap.held ? "0.85" : "1" }}>
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
