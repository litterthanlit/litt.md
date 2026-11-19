/**
 * Sparkline, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a sharp square telemetry bar meter
 * rising from the floor of a black slab, with the latest bar standing out in amber (or the hue's text tone).
 *
 * - Square slab (`rounded-none border border-line bg-canvas`), zero shadows, zero mirrored audio waveform (distinct
 *   from Rack's clip).
 * - Crisp 2px vertical bars rising from the bottom floor every 4px, with the latest bar lit in `tone.dot` (or
 *   `fill-accent-text` when no hue is specified) and an optional dashed baseline across the slab.
 * - Forced colors keeps borders and CanvasText bars.
 */
import type { ReactNode } from "react";
import type { SparklineBodyProps } from "@/components/sparkline";

const PITCH = 4;
const BAR = 2;
const PAD_X = 4;
const PAD_Y = 3;
const MIN_BAR = 2;
const DASH = "3 3";

/** Heat: a square telemetry bar meter rising from the floor. */
export function SparklineHeatBody({ boxRef, width, height, text, data, at, goal, tone, className }: SparklineBodyProps) {
  const n = data.length;
  const cols = Math.max(0, Math.floor((width - 2 * PAD_X + (PITCH - BAR)) / PITCH));
  const x0 = (width - (cols * PITCH - (PITCH - BAR))) / 2;
  const floor = height - PAD_Y;
  const reach = Math.max(MIN_BAR, height - 2 * PAD_Y);

  const isQuiet = tone.dot === "fill-fg";
  const barClass = isQuiet ? "fill-fg-muted" : tone.lit;
  const nowClass = isQuiet ? "fill-accent-text" : tone.dot;

  const bars: ReactNode[] = [];
  if (width > 0 && cols > 0 && n > 0) {
    for (let c = 0; c < cols; c++) {
      const pos = n > 1 && cols > 1 ? (c * (n - 1)) / (cols - 1) : n - 1;
      const i = Math.min(n - 1, Math.floor(pos));
      const next = Math.min(n - 1, i + 1);
      const t = at(data[i]!) + (at(data[next]!) - at(data[i]!)) * (pos - i);
      const h = Math.round(MIN_BAR + t * (reach - MIN_BAR));
      const last = c === cols - 1;
      bars.push(
        <rect
          key={c}
          data-bar={last ? "now" : ""}
          x={x0 + c * PITCH}
          y={floor - h}
          width={BAR}
          height={h}
          className={last ? nowClass + " forced-colors:fill-[Highlight]" : barClass + " forced-colors:fill-[CanvasText]"}
        />,
      );
    }
  }
  const goalY = goal === null ? 0 : Math.round(floor - (MIN_BAR + goal * (reach - MIN_BAR))) + 0.5;

  return (
    <div ref={boxRef} data-body="heat" className={"relative w-full min-w-0 " + className} style={{ height }}>
      <div aria-hidden="true" className="absolute inset-0 rounded-none border border-line bg-canvas forced-colors:border" />
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={text} className="absolute top-0 left-0 block overflow-visible">
          <g aria-hidden="true">
            {goal !== null && (
              <line x1={PAD_X} x2={width - PAD_X} y1={goalY} y2={goalY} strokeWidth={1} strokeDasharray={DASH} opacity={0.65} shapeRendering="crispEdges" className={tone.line} />
            )}
            {bars}
          </g>
        </svg>
      )}
    </div>
  );
}
