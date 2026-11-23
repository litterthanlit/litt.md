/**
 * The Slider's Flat body (proposals/worlds.md, Bodies; proposals/flat-pill.md; plans/027): a page, not an instrument.
 * No plate, no shadow, no notch cut into anything. The track is an 8px pill (`data-part="pill"`), the pulled-out part
 * walks Flat's sunset ramp (`--data-seq-1..4`, `data-part="mark"`), and the knob is a round 20px ink circle
 * (`data-part="circle"`) with no grip line: held, it swells immediately under the finger on the instant tier and
 * settles on release on Flat's expressive spring. Optional marks are dots (`data-part="circle"`) under the track and
 * home's is a larger dot. The value is said in words at the end of the track (`data-part="lettering"`), in the ink,
 * so a slider reads as a line of text with a track in it.
 *
 * When it first enters view (`useInView`, once), the sunset fill and knob sweep in once to the starting value on Flat's
 * expressive spring, then wait; until then they rest at the start, from the first frame. Any pointerdown, key press,
 * or value change cancels the arrival immediately so the hand always wins. Under reduced motion
 * (`useMotionDial().reduced`) the arrival is skipped completely.
 *
 * The travel's inset is --sl-pad, the knob's radius (10px), which the root sets and the hand reads back as its left
 * padding. The ring for keyboard focus goes on the knob, since the root is invisible. It takes the contract the Slider
 * and the RangeSlider resolve (SliderBodyProps): the props, the keys and the hand are theirs, not this file's.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
  type RefObject,
} from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { animate, motion, useInView, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react";
import type { SliderBodyProps } from "@/components/slider";
import { useMotionDial, useTransition } from "@/motion";

const rootLook =
  "group relative block h-control-md min-w-0 cursor-grab touch-pan-y select-none rounded-none bg-transparent shadow-none " +
  "[--sl-pad:10px] pl-(--sl-pad) data-held:cursor-grabbing " +
  "data-disabled:cursor-not-allowed forced-colors:border";
const track =
  "pointer-events-none absolute top-4.5 h-2 overflow-hidden rounded-pill bg-slot " +
  "group-data-disabled:bg-surface-2 forced-colors:border";
const capTravel = "pointer-events-none absolute inset-y-0";
const fillTravel = "absolute inset-y-0 left-2 right-2";
/* Literal token strings so gen-registry renames every sequential token cleanly for host installs. */
const SUNSET_FILL = "linear-gradient(90deg, var(--data-seq-1), var(--data-seq-2), var(--data-seq-3), var(--data-seq-4))";
const fillLook =
  "group-data-disabled:bg-[color-mix(in_oklab,var(--fg)_12%,transparent)] forced-colors:bg-[Highlight] forced-colors:[background-image:none]";
const glides = " transition-transform duration-(--dur-responsive) ease-responsive";
const capBox = "absolute top-3 -right-2.5 h-5 w-5 origin-center";
const capFace = "absolute inset-0 rounded-pill bg-fg forced-colors:border forced-colors:bg-[Highlight] group-data-disabled:bg-fg-disabled";
/* One cap rings itself when the root has keyboard focus; on a range the focused cap rings itself (cap.ring). */
const ringOne = " group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-focus";
const ringOf = " outline-2 outline-offset-2 outline-focus";
const thumbTrack = "absolute inset-y-0";
const thumbHidden = "block h-full w-2 opacity-0 focus-visible:outline-none";
/* The value in words: the ink, tabular, a fixed width so the track does not breathe as it changes. */
const valueLook = "shrink-0 min-w-[4ch] text-right text-small font-title tabular-nums text-fg group-data-disabled:text-fg-subtle";

const inset = (less = 0) => `calc(var(--sl-pad) - ${less}px)`;
const insetX = (less = 0): CSSProperties => ({ left: inset(less), right: inset(less) });
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function assignRef<T>(ref: Ref<T> | undefined, el: T | null) {
  if (typeof ref === "function") ref(el);
  else if (ref) (ref as RefObject<T | null>).current = el;
}

/** The Flat body: a pill track, a sunset ramp fill and a round knob, for one cap or two, with the value in words at the track's end. */
export function SliderFlat({ range, caps, fill, notches, glide, held, shown, disabled, plateRef, root, thumbs }: SliderBodyProps) {
  const rootElRef = useRef<HTMLSpanElement | null>(null);
  const setRootRef = useCallback(
    (el: HTMLSpanElement | null) => {
      rootElRef.current = el;
      assignRef(plateRef, el);
    },
    [plateRef],
  );

  const { reduced } = useMotionDial();
  const expressive = useTransition("expressive");
  const instant = useTransition("instant");
  const inView = useInView(rootElRef, { once: true, amount: 0.2 });

  const p0 = caps[0]?.p ?? 0;
  const p1 = caps[1]?.p ?? p0;
  /* While the arrival is pending the fill and knob start at the start from the first frame, so they never show the
     value, snap back and sweep. Under reduced motion, disabled, or with nothing to sweep they start at the value. */
  const pending = !reduced && !disabled && !held && (range ? Math.abs(p1 - p0) > 1e-4 : p0 > 1e-4);
  const progress = useMotionValue(pending ? 0 : 1);
  const [arriving, setArriving] = useState(pending);
  const animRef = useRef<AnimationPlaybackControls | null>(null);
  const doneRef = useRef(false);

  const initialRef = useRef({ p0, p1 });
  const targetRef = useRef({ p0, p1, range });
  targetRef.current = { p0, p1, range };
  const expressiveRef = useRef(expressive);
  expressiveRef.current = expressive;

  const cancelArrival = useCallback(() => {
    doneRef.current = true;
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }
    progress.set(1);
    setArriving(false);
  }, [progress]);

  useEffect(() => () => animRef.current?.stop(), []);

  useEffect(() => {
    if (reduced || disabled || held) cancelArrival();
  }, [reduced, disabled, held, cancelArrival]);

  useEffect(() => {
    if (p0 !== initialRef.current.p0 || p1 !== initialRef.current.p1) cancelArrival();
  }, [p0, p1, cancelArrival]);

  useEffect(() => {
    if (!inView || doneRef.current || reduced || disabled || held) return;
    doneRef.current = true;
    const { p0: a, p1: b, range: isRange } = targetRef.current;
    const hasSpan = isRange ? Math.abs(b - a) > 1e-4 : a > 1e-4;
    if (!hasSpan) return;
    progress.set(0);
    setArriving(true);
    const controls = animate(progress, 1, {
      ...expressiveRef.current,
      onComplete: () => {
        if (animRef.current !== controls) return;
        animRef.current = null;
        setArriving(false);
      },
    });
    animRef.current = controls;
  }, [inView, reduced, disabled, held, progress]);

  const arrivalFillTransform = useTransform(progress, (t) => {
    const { p0: a, p1: b, range: isRange } = targetRef.current;
    if (!isRange) {
      const p = clamp01(a * t);
      return `scaleX(${p.toFixed(4)})`;
    }
    const mid = (a + b) / 2;
    const pf = clamp01(mid + (a - mid) * t);
    const pt = clamp01(mid + (b - mid) * t);
    return `translateX(${(pf * 100).toFixed(3)}%) scaleX(${Math.max(0, pt - pf).toFixed(4)})`;
  });

  const arrivalCap0Transform = useTransform(progress, (t) => {
    const { p0: a, p1: b, range: isRange } = targetRef.current;
    const p = isRange ? clamp01((a + b) / 2 + (a - (a + b) / 2) * t) : clamp01(a * t);
    return `translateX(${((p - 1) * 100).toFixed(3)}%)`;
  });

  const arrivalCap1Transform = useTransform(progress, (t) => {
    const { p0: a, p1: b } = targetRef.current;
    const p = clamp01((a + b) / 2 + (b - (a + b) / 2) * t);
    return `translateX(${((p - 1) * 100).toFixed(3)}%)`;
  });

  const handlePointerDown: NonNullable<SliderBodyProps["root"]["onPointerDown"]> = (e) => {
    if (arriving || !doneRef.current) cancelArrival();
    root.onPointerDown?.(e);
  };

  const handleKeyDown: NonNullable<SliderBodyProps["root"]["onKeyDown"]> = (e) => {
    if (arriving || !doneRef.current) cancelArrival();
    root.onKeyDown?.(e);
  };

  const steadyFill: CSSProperties = range ? fill : { transform: `scaleX(${clamp01(p0).toFixed(4)})` };

  const slider = (
    <RadixSlider.Root
      ref={setRootRef}
      {...root}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      data-body={shown === undefined ? "flat" : undefined}
      data-no-drag=""
      data-held={held ? "" : undefined}
      className={rootLook + (shown === undefined ? " w-full" : " flex-1")}
    >
      <span aria-hidden="true" data-part="pill" className={track} style={insetX(8)}>
        {!range && p0 > 1e-4 && (
          <span
            data-part="mark"
            className={"absolute inset-y-0 left-0 w-2 " + fillLook}
            style={disabled ? undefined : { backgroundColor: "var(--data-seq-1)" }}
          />
        )}
        <motion.span
          className={fillTravel + " origin-left" + (!arriving && glide ? glides : "")}
          style={arriving ? { transform: arrivalFillTransform } : steadyFill}
        >
          <span
            data-part="mark"
            className={"absolute inset-0 " + fillLook}
            style={disabled ? undefined : { backgroundImage: SUNSET_FILL }}
          />
        </motion.span>
      </span>
      {notches.map((n) => (
        <span
          key={n.p}
          aria-hidden="true"
          data-part="circle"
          className={
            "pointer-events-none absolute -translate-x-1/2 rounded-pill group-data-disabled:hidden forced-colors:bg-[CanvasText] " +
            (n.home ? "top-9 size-1.5 bg-fg" : "top-9.5 size-1 bg-fg-subtle")
          }
          style={{ left: `calc(${inset()} + (100% - 2 * ${inset()}) * ${n.p.toFixed(4)})` }}
        />
      ))}
      {caps.map((cap, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className={capTravel + (!arriving && glide ? glides : "")}
          style={
            arriving
              ? { ...insetX(), transform: i === 0 ? arrivalCap0Transform : arrivalCap1Transform }
              : { ...insetX(), transform: `translateX(${((cap.p - 1) * 100).toFixed(3)}%)` }
          }
        >
          <motion.span
            className={capBox}
            initial={false}
            animate={{ scale: cap.held ? 1.14 : 1 }}
            transition={cap.held ? instant : expressive}
          >
            <span data-part="circle" className={capFace + (range ? (cap.ring ? ringOf : "") : ringOne)} />
          </motion.span>
        </motion.span>
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
    <div data-body="flat" data-disabled={disabled ? "" : undefined} className="group flex min-w-0 items-center gap-3">
      {slider}
      <span aria-hidden="true" data-part="lettering" className={valueLook}>
        {shown}
      </span>
    </div>
  );
}
