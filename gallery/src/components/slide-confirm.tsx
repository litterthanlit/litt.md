/**
 * Slide to confirm: a deliberate yes to something that cannot be undone, such as deleting a project, made by
 * sliding a thumb to the end of its track (components.md, "Slide to confirm"). It asks for more than a tap, so a
 * stray press on a phone does nothing.
 *
 * - Anatomy: the Segmented control's track (fg 5%, an inset --line, 4px of padding, the surface radius) and one
 *   raised segment as the thumb (--surface-1, the hairline, the top highlight, the control radius), so the two radii
 *   stay concentric. The thumb carries a 16px chevron. The track says what will happen ("Slide to delete Atelier
 *   Nord") at the small size in --fg-subtle, and the part of the track the thumb has passed fills at fg 6%.
 * - Sizes: md is 44 tall, lg 56; on a coarse pointer md grows to 56, because a finger does the sliding.
 * - Drag: the thumb follows the pointer one to one, with no easing, as the Slider's does. The words fade as it
 *   goes, by its position, not by a timer. Let go before the end and it springs back to the start on the
 *   responsive tier (bounce 0). Reach the end and it confirms: the thumb stays there with a check, the words
 *   become the confirmed label, and onConfirm runs once. Esc while dragging sends it back.
 * - Keyboard and assistive tech: the thumb is a real button named by the label. Enter, Space or a screen reader's
 *   activate confirms, because a key press is already deliberate; a mouse click on the thumb does not, or the slide
 *   would be pointless. Every gesture has a button that does the same thing. Focus is the 2px ring on the thumb.
 * - After it confirms, the button is disabled and a polite status says the confirmed label. Remount it (a new key)
 *   to ask again.
 * - Touch: the thumb owns the drag (touch-action none, data-no-drag), so a sheet never moves under it.
 * - Disabled: the track at fg 3%, the thumb --surface-2 with a --line edge, no pointer, no tab stop. The words stay
 *   --fg-subtle, because they still say what it would do, as a disabled Slider's end words do.
 * - Motion: position follows the pointer and never animates, except the spring back. Only transform and opacity
 *   change: the passed part is a full-width band scaled from the left. Under reduced motion it snaps back.
 * - Fun mode (motion/fun.tsx, a trial, off unless a <FunMode> is on): the thumb can be thrown. Let go and it keeps
 *   the speed it had: if that would carry it to the end, it coasts there and confirms when it lands; if not, it
 *   springs back with it. Both landings use fun mode's throw spring, and the ends of the track are walls: a thumb
 *   that arrives with speed squashes against one and springs back to its shape, instead of passing it. The check
 *   pops in. Still only transform and opacity, and the thumb rests exactly where it does without fun mode. A key
 *   or a screen reader still confirms at once. Reduced motion turns it off.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from "motion/react";
import { useFun, useTransition } from "@/motion";
import { CheckIcon, ChevronRightIcon } from "@/components/icons";

export type SlideConfirmSize = "md" | "lg";

export type SlideConfirmProps = {
  /** What sliding does, in the track and as the thumb's name: "Slide to delete Atelier Nord". */
  label: string;
  /** What the track says once it has confirmed: "Deleting Atelier Nord". It is also announced. */
  confirmedLabel?: string;
  /** Runs once, when the thumb reaches the end or the thumb is activated by a key or a screen reader. */
  onConfirm?: () => void;
  /** Height on the control scale: md is 44 (56 on a coarse pointer), lg is 56. */
  size?: SlideConfirmSize;
  /** Makes it unavailable: muted, skipped by Tab, and ignoring the pointer. */
  disabled?: boolean;
  /** Extra classes for the track, such as a width. It fills its container by default. */
  className?: string;
};

const track: Record<SlideConfirmSize, string> = {
  md: "h-control-md pointer-coarse:h-control-lg",
  lg: "h-control-lg",
};

/** How close to the end counts as the end, in px, so a finger need not land on the last pixel. */
const SLACK = 4;

/** A track with a thumb to slide to the end. The thumb is also a button: Enter, Space or a screen reader confirms. */
export function SlideConfirm({ label, confirmedLabel = "Done", onConfirm, size = "md", disabled = false, className = "" }: SlideConfirmProps) {
  const back = useTransition("responsive");
  const hintId = useId();
  const box = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const [max, setMax] = useState(0); // how far the thumb can travel
  const [inner, setInner] = useState(0); // the track's width inside its padding
  const [done, setDone] = useState(false);
  const drag = useRef<{ from: number; id: number } | null>(null);
  /* Fun mode: the throw. The last moves, to read the speed the thumb is let go at, and the flight it is on. */
  const fun = useFun();
  const trail = useRef<{ t: number; x: number }[]>([]);
  const flight = useRef<AnimationPlaybackControls | null>(null);
  /* A thumb still in the air when the track goes away never lands, so it never confirms. */
  useEffect(
    () => () => {
      flight.current?.stop();
      flight.current = null;
    },
    [],
  );

  /* Measured before paint and kept current, so the end is always the end. */
  useLayoutEffect(() => {
    const el = box.current;
    const t = thumb.current;
    if (!el || !t) return;
    const read = () => {
      const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      const w = el.clientWidth - 2 * pad;
      setInner(w);
      setMax(Math.max(0, w - t.offsetWidth));
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* A confirmed thumb stays at the end, also when the track is resized. */
  useEffect(() => {
    if (done) x.set(max);
  }, [done, max, x]);

  /* The transforms read the sizes from a ref, so a resize never leaves them holding an old width. */
  const span = useRef({ max: 0, inner: 0 });
  span.current = { max, inner };
  const words = useTransform(x, (v) => Math.max(0, 1 - v / Math.max(1, span.current.max * 0.6)));
  const band = useTransform(x, (v) => (span.current.inner > 0 && thumb.current ? (v + thumb.current.offsetWidth) / span.current.inner : 0));
  /* Fun mode's walls: a throw's spring may carry x past an end, but the thumb stops there and squashes by how far it
     went, against the wall it hit, then springs back to its shape as x comes back. */
  const walled = useTransform(x, (v) => Math.min(span.current.max, Math.max(0, v)));
  const squash = useTransform(x, (v) => {
    const over = v > span.current.max ? v - span.current.max : v < 0 ? -v : 0;
    const size = thumb.current?.offsetWidth || 1;
    return 1 - Math.min(0.5, over / size);
  });
  const wall = useTransform(x, (v) => (v < 0 ? 0 : 1));

  const confirm = () => {
    if (done || disabled) return;
    drag.current = null;
    x.set(max);
    setDone(true);
    onConfirm?.();
  };
  const goBack = () => {
    drag.current = null;
    if (fun) return fly(0, 0);
    void animate(x, 0, back);
  };

  /* Fun mode: a throw to `to`, carrying `velocity` (px/s). Landing at the end confirms, as reaching it by hand does. */
  const fly = (to: number, velocity: number) => {
    if (!fun) return;
    flight.current?.stop();
    const run = animate(x, to, { ...fun.throw, velocity });
    flight.current = run;
    void run.then(() => {
      if (flight.current !== run) return;
      flight.current = null;
      if (to === max) confirm();
    });
  };
  /* The speed over the last 100ms of moves, in px/s: zero if the finger rested before letting go. */
  const releaseSpeed = () => {
    const now = performance.now();
    const recent = trail.current.filter((p) => now - p.t <= 100);
    const first = recent[0];
    const last = recent[recent.length - 1];
    return first && last && last.t > first.t ? ((last.x - first.x) / (last.t - first.t)) * 1000 : 0;
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (done || disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (fun) {
      flight.current?.stop(); // caught mid-flight: it is in the hand again, wherever it was
      flight.current = null;
      x.set(Math.min(max, Math.max(0, x.get())));
      trail.current = [];
    }
    drag.current = { from: e.clientX - x.get(), id: e.pointerId };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    x.set(Math.min(max, Math.max(0, e.clientX - drag.current.from)));
    if (fun) trail.current.push({ t: performance.now(), x: x.get() });
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    if (fun) {
      drag.current = null;
      const velocity = releaseSpeed();
      const at = x.get();
      return fly(at + fun.coast(velocity) >= max - SLACK ? max : 0, velocity);
    }
    if (x.get() >= max - SLACK) confirm();
    else goBack();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Escape" && drag.current) {
      e.preventDefault();
      goBack();
    }
  };

  const ink = done ? "text-fg" : "text-fg-subtle"; // disabled words stay fg-subtle: they still say what it would do, as a disabled Slider's end words do

  return (
    <div
      ref={box}
      data-no-drag=""
      className={
        "relative isolate flex w-full items-center overflow-hidden rounded-surface p-1 select-none forced-colors:border " +
        (disabled
          ? "bg-[color-mix(in_oklab,var(--fg)_3%,transparent)] shadow-[inset_0_0_0_1px_var(--line)] "
          : "bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] shadow-[inset_0_0_0_1px_var(--line)] ") +
        track[size] +
        " " +
        className
      }
    >
      {/* The part the thumb has passed: a full-width band scaled from the left, so only a transform changes. */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 left-1 -z-1 w-[calc(100%-0.5rem)] origin-left rounded-control bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]"
        style={{ scaleX: band }}
      />
      <motion.span
        aria-hidden="true"
        className={"pointer-events-none absolute inset-0 grid place-items-center px-14 text-center text-small " + ink}
        style={{ opacity: done ? 1 : words }}
      >
        <span className="truncate">{done ? confirmedLabel : label}</span>
      </motion.span>
      <motion.button
        ref={thumb}
        type="button"
        disabled={disabled || done}
        aria-label={label}
        aria-describedby={hintId}
        style={fun ? { x: walled, scaleX: squash, originX: wall } : { x }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={goBack}
        onKeyDown={onKeyDown}
        /* detail is 0 for a click made by a key or by assistive tech, and 1 or more for a real press. */
        onClick={(e) => e.detail === 0 && confirm()}
        className={
          "relative grid aspect-square h-full shrink-0 touch-none place-items-center rounded-control [-webkit-tap-highlight-color:transparent] " +
          "transition-colors duration-(--dur-instant) ease-litt " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus forced-colors:border " +
          (disabled
            ? "cursor-not-allowed bg-surface-2 text-fg-disabled shadow-[inset_0_0_0_1px_var(--line)]"
            : "bg-surface-1 text-fg shadow-[inset_0_0_0_1px_var(--line),var(--highlight)] " + (done ? "cursor-default" : "cursor-grab active:cursor-grabbing"))
        }
      >
        {fun ? (
          /* Fun mode: the check pops in where the chevron was. */
          <motion.span key={done ? "done" : "slide"} className="grid place-items-center" initial={done ? { scale: 0.4, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={fun.pop}>
            {done ? <CheckIcon /> : <ChevronRightIcon />}
          </motion.span>
        ) : done ? (
          <CheckIcon />
        ) : (
          <ChevronRightIcon />
        )}
      </motion.button>
      <span id={hintId} className="sr-only">
        Drag the thumb to the end, or press Enter.
      </span>
      <span role="status" className="sr-only">
        {done ? confirmedLabel : ""}
      </span>
    </div>
  );
}
