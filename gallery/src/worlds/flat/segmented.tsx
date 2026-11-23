/**
 * Segmented control, the Flat body (taste v1.22, "Flat is the studies"; proposals/flat-studies/studies/segmented-control.js):
 * words in a line, and one pill under the chosen word. On the grey ground the pill is white paper; inside paper
 * (.litt-paper, a card) it is the grey bubble, since --block is paper on the ground and the bubble on paper. There is
 * no tray and no frame. The chosen word is the ink, the others --fg-muted, all at the title weight.
 *
 * - The pill glides on two springs, after the components repo's: where it starts on the responsive spring, and how
 *   wide it is on the same spring a fifth slower, so it stretches a little as it travels between words of different
 *   widths and keeps its speed if you change your mind mid-way. Both are transforms: the pill is drawn as its two
 *   round ends and the band between them, each moved (and the band scaled) from two motion values, so nothing but a
 *   transform ever changes. A small move: it never bounces.
 * - It snaps, never glides, the first time it is placed and whenever the control itself changes size (fonts loading,
 *   a phone turning). Reduced motion places it at once.
 * - A press on a word shrinks it a little (0.97) while held, on the instant tier.
 * - Space does the dividing: the words' hit areas touch, so a pointer never lands between two.
 * - Forced colors drops the fills, so the chosen word takes a real outline instead.
 */
import { animate, motion, useMotionValue, useTransform, type Transition } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { SegmentedBodyProps, SegmentedSize } from "@/components/segmented";

/* A held unselected word on a coarse pointer takes the --fg text. */
const PRESS = "pointer-coarse:active:text-fg";

/* A segment's words, and its sides: hugging its word, or (a block that fills its row) an even share of the row with a
   small side, so four words still fit at 320px. */
const sizes: Record<SegmentedSize, { track: string; text: string; pad: string }> = {
  sm: { track: "h-control-sm pointer-coarse:h-control-md", text: "text-small pointer-coarse:text-body", pad: "px-3.5" },
  md: { track: "h-control-md", text: "text-body", pad: "px-4.5" },
};

/** The width's spring: the position's, a fifth slower, so the pill stretches as it goes. */
function slower(t: Transition): Transition {
  return t.type === "spring" && typeof t.visualDuration === "number" ? { ...t, visualDuration: t.visualDuration * 1.2 } : t;
}

/** Flat, one pill that glides under the chosen word on two springs. */
export function SegmentedFlatBody({ legend, showLegend, name, value, options, size, block, disabled, className, select, enter }: SegmentedBodyProps) {
  const look = sizes[size];
  const track = useRef<HTMLDivElement>(null);
  /* Where the pill starts and how wide it is, in px from the track's start; its height is the track's. */
  const x = useMotionValue(0);
  const w = useMotionValue(0);
  const h = useMotionValue(0);
  const placed = useRef(false);
  const rightAt = useTransform(() => x.get() + Math.max(0, w.get() - h.get()));
  const bandAt = useTransform(() => x.get() + h.get() / 2);
  const bandScale = useTransform(() => Math.max(0, w.get() - h.get()));

  /* Measure the chosen word and send the pill there: at once the first time, on the two springs after. */
  const go = useRef<(glide: boolean) => void>(() => {});
  go.current = (glide) => {
    const box = track.current;
    const chosen = box?.querySelector<HTMLElement>("label[data-chosen]");
    if (!box || !chosen) return;
    h.set(box.offsetHeight);
    if (!glide || !placed.current) {
      x.jump(chosen.offsetLeft);
      w.jump(chosen.offsetWidth);
      placed.current = true;
      return;
    }
    void animate(x, chosen.offsetLeft, enter);
    void animate(w, chosen.offsetWidth, slower(enter));
  };
  useLayoutEffect(() => go.current(true), [value, size, block, options.length]);
  /* The control changing size snaps the pill, so it never glides on its own. */
  useEffect(() => {
    const box = track.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    let last = box.offsetWidth;
    const watch = new ResizeObserver(() => {
      if (box.offsetWidth === last) return;
      last = box.offsetWidth;
      go.current(false);
    });
    watch.observe(box);
    return () => watch.disconnect();
  }, []);

  const chosenOff = disabled || !!options.find((o) => o.value === value)?.disabled;
  const fill = chosenOff ? "bg-surface-2" : "bg-block";
  const hasChoice = options.some((o) => o.value === value);

  return (
    <fieldset data-body="flat" disabled={disabled} className={"m-0 min-w-0 border-0 p-0 " + className}>
      <legend className={showLegend ? "mb-2 p-0 text-small font-title text-fg" : "sr-only"}>{legend}</legend>
      <div ref={track} className={"relative isolate flex " + (block ? "w-full " : "w-fit ") + look.track}>
        {hasChoice && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-1 forced-colors:hidden">
            {/* The pill: its two round ends, and the band between them, scaled. Only transforms move. */}
            <motion.span className={"absolute inset-y-0 left-0 aspect-square rounded-pill " + fill} style={{ x }} />
            <motion.span className={"absolute inset-y-0 left-0 aspect-square rounded-pill " + fill} style={{ x: rightAt }} />
            <motion.span className={"absolute inset-y-0 left-0 w-px origin-left " + fill} style={{ x: bandAt, scaleX: bandScale }} />
          </span>
        )}
        {options.map((o) => {
          const selected = value === o.value;
          const off = disabled || !!o.disabled;
          return (
            <label
              key={o.value}
              data-chosen={selected ? "" : undefined}
              className={
                "litt-target relative grid h-full select-none place-items-center rounded-pill font-title " +
                "transition-[color,scale] duration-(--dur-instant) ease-litt [-webkit-tap-highlight-color:transparent] " +
                (block ? "min-w-0 flex-1 basis-0 px-2 " : look.pad + " ") +
                look.text +
                (selected ? " forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]" : "") +
                (off
                  ? " cursor-not-allowed text-fg-disabled"
                  : " cursor-pointer active:scale-97 " + (selected ? "text-fg" : "text-fg-muted hover:text-fg " + PRESS))
              }
            >
              <input
                type="radio"
                className="peer sr-only"
                name={name}
                value={o.value}
                checked={selected}
                disabled={o.disabled}
                onChange={() => {
                  select(o.value);
                }}
              />
              <span className="litt-trim relative">{o.label}</span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-pill peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-focus"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
