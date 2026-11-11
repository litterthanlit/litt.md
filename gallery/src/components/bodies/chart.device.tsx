/**
 * BarChart, the Device body (proposals/worlds.md, Bodies): a dot-matrix screen, the reading in seven segments.
 *
 * - The ground is LCD glass at the plot (--field, its line and shade). A matrix of unlit dots covers it, one dot every
 *   6px, the ink at 10%; a bar is the dots of its columns lit up to its height, snapped to the matrix, so a value is
 *   always a whole number of dots and never a partial one.
 * - A single series is the glass's ink, the emphasised bar full and the others at 55%. Several series step down
 *   (100%, 55%, 30%), and a series with a data hue lights in its hue, where the color carries the data (R7).
 * - No value axis and no gridlines. The emphasised category's value shows in seven segments on the bezel above the
 *   screen (the Seven-segment part), when segments can show it; the tooltip and the hidden table say every value.
 * - Category labels are engraved under the screen (litt-legend). Nothing grows or fades in: the dots are lit (R4,
 *   Device switches where it stands).
 */
import { useId } from "react";
import { SevenSegment } from "@/components/seven-segment";
import type { ChartBodyProps } from "../chart";

const PITCH = 6; // a dot and the gap after it
const DOT = 2; // a dot's radius
const FIGURE = 7.2; // advance of a 12px tabular figure, as the chart measures labels
const LEVEL = [1, 0.55, 0.3];
/** What seven segments can show. */
const SEGMENTS = /^[0-9. -]+$/;

/** Device: a dot-matrix screen. */
export function ChartDeviceBody({ width, height, text, g, labels, bars, ring, reading }: ChartBodyProps) {
  const id = "dots" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const n = labels.length;
  const cols = Math.max(0, Math.floor(g.plotW / PITCH));
  const rows = Math.max(0, Math.floor(g.plotH / PITCH));
  const x0 = g.left + (g.plotW - cols * PITCH) / 2;
  const y0 = g.base - rows * PITCH;
  const single = !bars.some((b) => b.series > 0);
  const plain = reading === null ? null : reading.replace(/,/g, "");
  const figure = plain !== null && SEGMENTS.test(plain) ? plain : null;
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute -z-10 rounded-control bg-field shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)]"
        style={{ left: g.left, top: g.top - 4, width: g.plotW, height: g.plotH + 8 }}
      />
      {figure !== null && (
        <div aria-hidden="true" className="absolute top-0 right-0">
          <SevenSegment value={figure} className="px-1.5! py-1! [font-size:var(--type-caption-size)]" />
        </div>
      )}
      <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
        <defs>
          <pattern id={id} patternUnits="userSpaceOnUse" x={x0} y={y0} width={PITCH} height={PITCH}>
            <circle cx={PITCH / 2} cy={PITCH / 2} r={DOT} opacity={0.1} className="fill-field-ink" />
          </pattern>
        </defs>
        <g aria-hidden="true">
          <rect x={x0} y={y0} width={cols * PITCH} height={rows * PITCH} fill={`url(#${id})`} />
          {bars.flatMap((b) => {
            const c0 = Math.max(0, Math.min(cols - 1, Math.round((b.x - x0) / PITCH)));
            const wide = Math.max(1, Math.min(cols - c0, Math.round(b.width / PITCH)));
            const tall = Math.max(1, Math.min(rows, Math.round(b.height / PITCH)));
            const opacity = b.hue ? 1 : single ? (b.strong ? 1 : 0.55) : LEVEL[Math.min(b.series, 2)];
            return Array.from({ length: wide * tall }, (_, k) => (
              <circle
                key={`${b.key}-${k}`}
                data-dot=""
                cx={x0 + (c0 + (k % wide) + 0.5) * PITCH}
                cy={g.base - (Math.floor(k / wide) + 0.5) * PITCH}
                r={DOT}
                opacity={opacity}
                className={"transition-[fill,opacity] duration-(--dur-instant) ease-litt " + (b.hue ? b.fill : "fill-field-ink")}
              />
            ));
          })}
          <g className="litt-legend fill-fg-subtle text-caption font-normal tabular-nums">
            {labels.map((l, i) => {
              if ((n - 1 - i) % g.step !== 0) return null;
              const last = i === n - 1 && g.cx(i) + (l.length * FIGURE) / 2 > g.width;
              return (
                <text key={i} x={last ? g.width : g.cx(i)} y={g.base + 20} textAnchor={last ? "end" : "middle"}>
                  {l}
                </text>
              );
            })}
          </g>
          {ring && <rect {...ring} fill="none" strokeWidth={2} className="stroke-focus" />}
        </g>
      </svg>
    </>
  );
}
