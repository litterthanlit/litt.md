/**
 * Progress: how far along something is that is happening now, such as an upload, an import or a build
 * (components.md, "Progress"). A Meter shows a quantity against a limit and stands still; Progress moves while the
 * work goes on, then ends done or failed.
 *
 * - Anatomy: the Meter's lockup. The label at the small size in --fg, the reading at the end in tabular figures at the caption
 *   size in --fg-subtle ("3.2 of 8 MB", or the percent), and under them a slot cut into the page (R3, material.md 6: a
 *   slot is what fills), 8px tall at the control radius: the floor --slot, the done part in it in --fg. The walls
 *   (--slot-shade: the top one's shade, the lit lower one) are drawn on a layer above the fill, so the fill sits down in
 *   the channel instead of covering its walls. Never the accent, and never a data hue but under Flat: it is one quantity.
 * - Segments (`segments`): for work counted in whole things (twelve pictures, five steps), the slot is cut into one
 *   segment per thing, 4px apart, each its own slot; a segment lights in the fill once its share is done, never half.
 * - Flat heatwave (v1.21; Nick, 2026-11-19: "C is amazing tho. Flat heatwave is the move"): under Flat how far along
 *   you are is warmth. The fill walks Flat's sunset ramp (its sequential steps, gold to plum in light, plum to gold in
 *   dark), read off the four steps as the Gauge's `ramp` reads them, blended in OKLab between the two a place falls
 *   between. Each done segment lights at its own place on the ramp, the first in the first step and the last in the
 *   fourth. A continuous fill is one color, the step at its value, so it warms as it grows and done is the deepest:
 *   a band of one color, never a gradient (R1, R7). The first steps stand about 2:1 off the slot, so the reading says the
 *   value in words, as the Gauge's figure does. Failed is still --danger. Every other world keeps the ink.
 * - Ending: done fills the slot and the reading says "Done"; failed keeps the fill where it stopped, in --danger (a status
 *   mark, which R7 allows), and the reading says "Failed". A message under the slot says the rest (what failed and what
 *   to do, or the time left).
 * - Not known yet: with no value the slot stays empty and the reading says so in words ("Waiting"). Nothing moves on its
 *   own: no stripes, no shimmer, no sweep. A wait that has no end in sight is a spinner in a button, not a slot.
 * - Motion: the done part is a full-width band scaled from the left, so only a transform changes, on the instant tier,
 *   which keeps up with a value that updates often. Its end is square: a radius would squash with the scale. Under Flat
 *   its color fades to the new step on the same tier, and a segment lights with a color fade on the instant tier. Under
 *   reduced motion both jump.
 * - Forced colors drops the walls and the floor, so the slot (or each segment) gets a real border and the fill takes
 *   CanvasText, over the ramp's color.
 * - Accessibility: role="progressbar", named by the label, with aria-valuenow while the value is known and the reading
 *   as aria-valuetext. Ending done or failed is said once in a polite status, so a long wait need not be watched.
 */
import { useId, type ReactNode } from "react";
import { byWorld, useMaterial } from "@/motion";

export type ProgressStatus = "active" | "done" | "failed";

/** Under Flat, the place `t` (0 at the start of the slot, 1 at its end) read off the sunset ramp's four steps, the two
    it falls between mixed in OKLab, as the Gauge's `ramp` reads a tick. Every other world has no ramp: the ink. */
type Ramp = (t: number) => string;
/* Each name whole in a string, so the registry renames it. */
const SEQ = ["var(--data-seq-1)", "var(--data-seq-2)", "var(--data-seq-3)", "var(--data-seq-4)"] as const;
const RAMP: Ramp = (t) => {
  const at = Math.max(0, Math.min(1, t)) * 3;
  const k = Math.min(2, Math.floor(at));
  const u = Math.round((at - k) * 100);
  return `color-mix(in oklab, ${SEQ[k + 1]} ${u}%, ${SEQ[k]})`;
};

export type ProgressProps = {
  /** What is in progress: "Uploading brief.pdf", "Importing 1,204 pages". */
  label: ReactNode;
  /** How far along it is, from 0 to max. Leave it out while that is not known yet: the slot stays empty and nothing moves. */
  value?: number;
  /** The value that means finished. */
  max?: number;
  /** The reading at the end of the label row, and what a screen reader hears: "3.2 of 8 MB". Default: the percent. */
  valueText?: string;
  /** active while it runs; done fills the slot and says Done; failed keeps the fill where it stopped and says Failed. */
  status?: ProgressStatus;
  /** A line under the slot: the time left, or what failed and what to do about it. */
  message?: ReactNode;
  /** Cuts the slot into this many segments, one per thing counted (12 for twelve pictures). A segment lights once its share is done. Leave it out for one continuous slot. */
  segments?: number;
  /** Hides the label row but keeps it as the name, for a row that already shows the name, such as a file in a list. */
  hideLabel?: boolean;
  className?: string;
};

/** A slot for work that is happening now: it fills as the value grows, then ends done or failed, said in words. */
export function Progress({ label, value, max = 100, valueText, status = "active", message, segments, hideLabel = false, className = "" }: ProgressProps) {
  const labelId = useId();
  const messageId = useId();
  const known = value !== undefined || status === "done";
  const share = status === "done" ? 1 : max > 0 && value !== undefined ? Math.max(0, Math.min(1, value / max)) : 0;
  const reading =
    status === "done" ? "Done" : status === "failed" ? "Failed" : value === undefined ? (valueText ?? "Waiting") : (valueText ?? `${Math.round(share * 100)}%`);
  const tone = status === "failed" ? "text-danger" : "text-fg-subtle";
  const material = useMaterial();
  const isHeat = material === "heat";
  /* Under Flat the fill walks the sunset (Flat heatwave, v1.21); under Heat it lights amber dashes in a square channel; failed keeps danger. */
  const worldRamp = byWorld<Ramp | null>(material, { press: null, flat: RAMP });
  const ramp = status === "failed" ? null : worldRamp;
  const fill = status === "failed" ? "bg-danger" : isHeat ? "bg-accent-text" : "bg-fg";
  const count = segments !== undefined ? Math.max(1, Math.round(segments)) : isHeat ? 16 : 0;
  /* A segment lights only once its whole share is done. */
  const lit = count ? Math.floor(share * count + 1e-6) : 0;

  return (
    <div className={"grid min-w-0 gap-2 " + className}>
      <div className={hideLabel ? "sr-only" : "flex items-baseline justify-between gap-4"}>
        <span id={labelId} className="min-w-0 truncate text-small text-fg">
          {label}
        </span>
        <span className={"shrink-0 text-caption font-normal tabular-nums " + tone}>{reading}</span>
      </div>
      <div
        role="progressbar"
        aria-labelledby={labelId}
        aria-describedby={message ? messageId : undefined}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={known ? Math.round(share * max) : undefined}
        aria-valuetext={reading}
        className={
          count
            ? isHeat
              ? "grid gap-1 border border-line bg-tray p-1 forced-colors:border"
              : "grid gap-1"
            : "relative h-2 overflow-hidden rounded-control bg-slot forced-colors:border"
        }
        style={count ? { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` } : undefined}
      >
        {count ? (
          /* One slot per thing counted: a done one lights in the fill, at its own place on the ramp under Flat. */
          Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className={
                "relative h-2 overflow-hidden forced-colors:border " +
                (isHeat ? "rounded-none bg-line-strong" : "rounded-control bg-slot")
              }
            >
              {/* Always there, so lighting is a color fade on the instant tier (a jump under reduced motion). */}
              <span
                className={"absolute inset-0 transition-colors duration-(--dur-instant) ease-litt " + (i < lit ? "forced-colors:bg-[CanvasText]! " + fill : "")}
                style={i < lit && ramp ? { backgroundColor: ramp(i / Math.max(1, count - 1)) } : undefined}
              />
              {!isHeat && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-control shadow-(--slot-shade) in-[[data-material=flat]]:shadow-none" />}
            </span>
          ))
        ) : (
          <>
            {/* A full-width band scaled from the left: only a transform changes as the value grows. */}
            <div
              className={"h-full w-full origin-left transition-[transform,background-color] duration-(--dur-instant) ease-litt forced-colors:bg-[CanvasText]! " + fill}
              style={{ transform: `scaleX(${share})`, ...(ramp ? { backgroundColor: ramp(share) } : {}) }}
            />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-control shadow-(--slot-shade) in-[[data-material=flat]]:shadow-none" />
          </>
        )}
      </div>
      {message && (
        <p id={messageId} className={"text-small " + (status === "failed" ? "text-danger" : "text-fg-subtle")}>
          {message}
        </p>
      )}
      {/* The end is said once, so nobody has to watch the slot. Kept mounted, so the change is announced. */}
      <span role="status" className="sr-only">
        {status === "active" ? "" : `${typeof label === "string" ? `${label}: ` : ""}${status === "done" ? "done" : "failed"}.`}
      </span>
    </div>
  );
}
