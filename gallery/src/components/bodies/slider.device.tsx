/**
 * The Slider's Device body (proposals/worlds.md, Bodies; proposals/device.md): a fader. The body is the aluminium, so
 * there is no plate. A well is cut into it (--slot, --slot-shade), its pulled-out part lit, the way a meter lights:
 * in the accent, which is Device's orange, or the ink under Monochrome. Under the well, small engraved ticks (--notch,
 * --engrave) at the marks, or at every tenth of the track when there are none, and a longer one at home. The cap is a
 * key (--key-lift) with a line across its face, standing a little proud of the well. Held, it sinks the whole
 * --press-depth, 2px, onto its skirt, and the key's shade steps down (--block-press). The value is not here: the Slider's
 * label row sets it on an LCD well in the mono when the body is Device.
 *
 * It takes the contract the Slider and the RangeSlider resolve (SliderBodyProps): the props, the keys and the hand are
 * theirs. A mechanism does not lean, so the lean is ignored. The cap glides on the responsive tier and, under reduced
 * motion, jumps. The travel's inset is --sl-pad: the cap's half width, 7px, and a 3px lip of well past it, and 7px of
 * body beyond that. The cap stands proud of the 16px well, so it is never a box inside a curve.
 */
import * as RadixSlider from "@radix-ui/react-slider";
import type { CSSProperties } from "react";
import type { SliderBodyProps } from "../slider";

const rootLook =
  "group relative block h-control-md w-full cursor-grab touch-pan-y select-none " +
  "[--sl-pad:17px] pl-(--sl-pad) data-held:cursor-grabbing data-disabled:cursor-not-allowed forced-colors:border";
/* The well: 16px tall, 12px down, past the cap's travel by its half width and a 3px lip, at the control radius (a pill at most). */
const well =
  "pointer-events-none absolute top-3 h-4 overflow-hidden rounded-control bg-slot shadow-(--slot-shade) " +
  "group-data-disabled:bg-surface-3 group-data-disabled:shadow-none forced-colors:border";
const capTravel = "pointer-events-none absolute inset-y-0";
const fillTravel = "absolute inset-y-0 left-2.5 right-2.5";
/* Lit like a meter: the accent. Disabled, it goes dark. */
const fillLook =
  "bg-accent shadow-(--slot-fill-shade) " +
  "group-data-disabled:bg-[color-mix(in_oklab,var(--fg)_12%,transparent)] group-data-disabled:shadow-none forced-colors:bg-[Highlight]";
const glides = " transition-transform duration-(--dur-responsive) ease-responsive";
/* The cap: a key 14px wide and 28px tall, 6px from the top, centered on its rail's right edge. It sinks while held. */
const capBox = "absolute top-1.5 -right-1.75 h-7 w-3.5 transition-transform duration-(--dur-responsive) ease-responsive";
const capFace = (held: boolean) =>
  "absolute inset-0 rounded-[calc(var(--radius-control)-2px)] forced-colors:border forced-colors:bg-[Highlight] " +
  (held ? "bg-cap-held shadow-(--block-press) " : "bg-cap shadow-(--key-lift) ") +
  "group-data-disabled:bg-surface-2 group-data-disabled:shadow-[inset_0_0_0_1px_var(--line)]";
const capLine = "absolute inset-y-1.5 left-1/2 w-px -translate-x-1/2 bg-cap-grip group-data-disabled:bg-line forced-colors:bg-[CanvasText]";
const ringOne = " group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-focus";
const ringOf = " outline-2 outline-offset-2 outline-focus";
const thumbTrack = "absolute inset-y-0";
const thumbHidden = "block h-full w-3.5 opacity-0 focus-visible:outline-none";

const inset = (less = 0) => `calc(var(--sl-pad) - ${less}px)`;
const insetX = (less = 0): CSSProperties => ({ left: inset(less), right: inset(less) });

/** The ticks: the marks and home when the Slider has them, else every tenth of the track (home's one longer). */
function ticksOf(notches: SliderBodyProps["notches"]) {
  if (notches.some((n) => !n.home)) return notches;
  const home = notches.find((n) => n.home);
  const tenths = Array.from({ length: 11 }, (_, i) => ({ p: i / 10, home: false })).filter((n) => !home || Math.abs(n.p - home.p) > 0.001);
  return home ? [...tenths, home] : tenths;
}

/** The Device body: a fader in a well on a notched rail, for one cap or two. */
export function SliderDevice({ range, caps, fill, notches, glide, held, plateRef, root, thumbs }: SliderBodyProps) {
  return (
    <RadixSlider.Root ref={plateRef} {...root} data-body="device" data-no-drag="" data-held={held ? "" : undefined} className={rootLook}>
      <span aria-hidden="true" className={well} style={insetX(10)}>
        <span className={fillTravel + (range ? " origin-left" : "") + (glide ? glides : "")} style={fill}>
          <span className={(range ? "absolute inset-0 " : "absolute inset-y-0 right-0 w-[calc(100%+0.625rem)] ") + fillLook} />
        </span>
      </span>
      {ticksOf(notches).map((n) => (
        <span
          key={n.p}
          aria-hidden="true"
          className={
            "pointer-events-none absolute top-9 w-px -translate-x-1/2 shadow-(--engrave) group-data-disabled:hidden forced-colors:bg-[CanvasText] " +
            (n.home ? "h-2 bg-notch-home" : "h-1 bg-notch")
          }
          style={{ left: `calc(${inset()} + (100% - 2 * ${inset()}) * ${n.p.toFixed(4)})` }}
        />
      ))}
      {caps.map((cap, i) => (
        <span key={i} aria-hidden="true" className={capTravel + (glide ? glides : "")} style={{ ...insetX(), transform: `translateX(${((cap.p - 1) * 100).toFixed(3)}%)` }}>
          <span className={capBox} style={{ transform: `translateY(${cap.held ? "var(--press-depth)" : "0px"})` }}>
            <span className={capFace(cap.held) + (range ? (cap.ring ? ringOf : "") : ringOne)} />
            <span className={capLine} />
          </span>
        </span>
      ))}
      <RadixSlider.Track className={thumbTrack} style={insetX(7)}>
        {thumbs.map(({ key, ...thumb }) => (
          <RadixSlider.Thumb key={key} {...thumb} className={thumbHidden} />
        ))}
      </RadixSlider.Track>
    </RadixSlider.Root>
  );
}
