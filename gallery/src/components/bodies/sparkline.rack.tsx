/**
 * Sparkline, the Rack body (proposals/rack.md, round two): a clip. A block in the clip's colour with the values drawn
 * in it as a waveform, as an arrangement draws audio.
 *
 * - The clip is the box: the hue's own tint (a pastel in light and a deep colour in dark), or with no hue
 *   a grey clip (--surface-3), at the control radius, inside a 1px edge of the ink at 22%. It keeps the caller's
 *   height, as every body does.
 * - The waveform: one 2px bar every 3px across the clip, 4px in from each end, mirrored about the middle, each as tall
 *   as the line is high there (a value at the bottom of the scale is a 2px dot, never nothing, so silence still reads,
 *   as a waveform's quiet passages do). The bars are the hue's mark tone, which reaches 3:1 on its own tint (check 14);
 *   with no hue, the ink.
 * - Today is the strongest mark: the last bar takes the hue's -text tone (4.5:1 on its tint), a step stronger.
 * - A baseline is the level it marks on both sides of the middle, a 1px dashed line in the mark tone at 60%.
 * - Nothing draws itself or fades in (Rack's motion: things are there on the frame, R4), so there is no fun path. An
 *   empty or unmeasured box is the clip alone at its final height.
 */
import type { ReactNode } from "react";
import type { SparklineBodyProps } from "../sparkline";

const PITCH = 3; // a bar and the gap after it
const BAR = 2; // a bar's width
const PAD_X = 4; // between the clip's ends and the first and last bar
const PAD_Y = 3; // between the clip's top or bottom and the tallest bar
const QUIET = 1; // half of the shortest bar: a 2px dot at the bottom of the scale
const DASH = "3 3";

/** Rack: a clip, its waveform in it. */
export function SparklineRackBody({ boxRef, width, height, text, data, at, goal, tone, className }: SparklineBodyProps) {
  const n = data.length;
  const cols = Math.max(0, Math.floor((width - 2 * PAD_X + (PITCH - BAR)) / PITCH));
  const x0 = (width - (cols * PITCH - (PITCH - BAR))) / 2;
  const mid = height / 2;
  const reach = Math.max(QUIET, mid - PAD_Y);
  const half = (t: number) => QUIET + t * (reach - QUIET);

  const bars: ReactNode[] = [];
  if (width > 0 && cols > 0 && n > 0) {
    for (let c = 0; c < cols; c++) {
      const pos = n > 1 && cols > 1 ? (c * (n - 1)) / (cols - 1) : n - 1;
      const i = Math.min(n - 1, Math.floor(pos));
      const next = Math.min(n - 1, i + 1);
      const t = at(data[i]!) + (at(data[next]!) - at(data[i]!)) * (pos - i);
      const h = Math.round(half(t) * 2) / 2;
      const last = c === cols - 1;
      bars.push(<rect key={c} data-bar={last ? "now" : ""} x={x0 + c * PITCH} y={mid - h} width={BAR} height={2 * h} className={last ? tone.dot : tone.lit} />);
    }
  }
  const level = goal === null ? 0 : Math.round(half(goal));

  return (
    <div ref={boxRef} data-body="rack" className={"relative w-full min-w-0 " + className} style={{ height }}>
      <div
        aria-hidden="true"
        data-clip=""
        className={"absolute inset-0 rounded-control shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_22%,transparent)] forced-colors:border " + tone.clip}
      />
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={text} className="absolute top-0 left-0 block overflow-visible">
          <g aria-hidden="true">
            {goal !== null &&
              [mid - level, mid + level].map((y) => (
                <line key={y} x1={PAD_X} x2={width - PAD_X} y1={Math.round(y) + 0.5} y2={Math.round(y) + 0.5} strokeWidth={1} strokeDasharray={DASH} opacity={0.6} shapeRendering="crispEdges" className={tone.line} />
              ))}
            {bars}
          </g>
        </svg>
      )}
    </div>
  );
}
