/**
 * Sparkline, the Device body (proposals/worlds.md, Bodies): a row of lit dots on LCD glass.
 *
 * - The ground is LCD glass the size of the box (--field, its line and shade). A matrix of unlit dots covers it, one dot
 *   every 4px, the glass's ink at 10%, 2px in from the top and bottom and 10px in from each end, where round corners curve
 *   away. At that pitch a 32px box has seven rows and a 24px box five, enough to keep the
 *   line's shape (the Chart's 6px loses it).
 * - The trend is one lit dot in every column, at the line's height there, and the dots between two columns where the
 *   line climbs or falls more than a dot, so the trace never breaks. It is the ink at 60%; with a `hue` it lights in the
 *   hue's mark tone at 75%.
 * - Today is the strongest mark: the latest column's dot is full strength, with the dot above and the dot below it lit
 *   too, as the Chart's marker is stronger than its trace.
 * - A baseline is its row lit at 30% in every other column, in the ink whatever the hue. The trace wins where they meet.
 * - Nothing draws itself or fades in: the dots are lit where they stand (R4, Device switches where it stands), so
 *   there is no fun path. An empty or unmeasured box is the glass alone at its final height.
 */
import { useId, type ReactNode } from "react";
import type { SparklineBodyProps } from "../sparkline";

const PITCH = 4; // a dot and the gap after it
const DOT = 1.25; // a dot's radius
const PAD_X = 10; // between the glass's end and the matrix, which round corners curve away from
const PAD_Y = 2; // between the glass's top or bottom and the matrix
const TRACE = 0.6;
const TRACE_HUE = 0.75;
const BASELINE = 0.3;

/** Device: a row of lit dots on glass. */
export function SparklineDeviceBody({ boxRef, width, height, text, data, at, goal, hued, tone, className }: SparklineBodyProps) {
  const id = "dots" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const n = data.length;
  const cols = Math.max(0, Math.floor((width - 2 * PAD_X) / PITCH));
  const rows = Math.max(0, Math.floor((height - 2 * PAD_Y) / PITCH));
  const x0 = (width - cols * PITCH) / 2;
  const y0 = (height - rows * PITCH) / 2;
  const cx = (c: number) => x0 + (c + 0.5) * PITCH;
  const cy = (r: number) => y0 + (rows - r - 0.5) * PITCH; // row 0 is the bottom one
  const rowOf = (t: number) => Math.max(0, Math.min(rows - 1, Math.round(t * (rows - 1))));

  const lit: ReactNode[] = [];
  if (width > 0 && cols > 0 && rows > 0 && n > 0) {
    const taken = new Set<string>();
    const light = (c: number, r: number, fill: string, opacity: number, key: string) => {
      if (c < 0 || c >= cols || r < 0 || r >= rows || taken.has(`${c}-${r}`)) return;
      taken.add(`${c}-${r}`);
      lit.push(<circle key={`${key}-${c}-${r}`} data-dot="" cx={cx(c)} cy={cy(r)} r={DOT} opacity={opacity} className={fill} />);
    };
    /* Today first, so its three dots are the full-strength ones. */
    const rLast = rowOf(at(data[n - 1]!));
    for (const dr of [0, 1, -1]) light(cols - 1, rLast + dr, tone.lit, 1, "now");
    /* The trace: each column takes the line's height there, and the dots between where it is steep. */
    let prev: number | null = null;
    for (let c = 0; c < cols; c++) {
      const pos = n > 1 && cols > 1 ? (c * (n - 1)) / (cols - 1) : n - 1;
      const i = Math.min(n - 1, Math.floor(pos));
      const next = Math.min(n - 1, i + 1);
      const t = at(data[i]!) + (at(data[next]!) - at(data[i]!)) * (pos - i);
      const r = rowOf(t);
      const from = prev === null ? r : r > prev ? prev + 1 : r < prev ? prev - 1 : r;
      prev = r;
      for (let q = Math.min(from, r); q <= Math.max(from, r); q++) light(c, q, tone.lit, hued ? TRACE_HUE : TRACE, "line");
    }
    if (goal !== null) for (let c = 0; c < cols; c += 2) light(c, rowOf(goal), "fill-field-ink", BASELINE, "goal");
  }

  return (
    <div ref={boxRef} data-body="device" className={"relative w-full min-w-0 " + className} style={{ height }}>
      <div aria-hidden="true" className="absolute inset-0 rounded-control bg-field shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)] forced-colors:border" />
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={text} className="absolute top-0 left-0 block overflow-visible">
          <defs>
            <pattern id={id} patternUnits="userSpaceOnUse" x={x0} y={y0} width={PITCH} height={PITCH}>
              <circle cx={PITCH / 2} cy={PITCH / 2} r={DOT} opacity={0.1} className="fill-field-ink" />
            </pattern>
          </defs>
          <g aria-hidden="true">
            <rect x={x0} y={y0} width={cols * PITCH} height={rows * PITCH} fill={`url(#${id})`} />
            {lit}
          </g>
        </svg>
      )}
    </div>
  );
}
