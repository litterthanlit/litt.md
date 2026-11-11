/**
 * Chart, the Device body (proposals/worlds.md, Bodies): a dot-matrix screen, the reading in seven segments.
 *
 * - The ground is LCD glass at the plot (--field, its line and shade). A matrix of unlit dots covers it, one dot every
 *   6px, the ink at 10%. Every mark is dots of that matrix lit, so a value is a whole number of dots.
 * - A bar is the dots of its columns lit up to its height. A single series is the glass's ink, the emphasised bar
 *   full and the others at 55%; several series step down (100%, 55%, 30%); a series with a data hue lights in its hue,
 *   where the color carries the data (R7).
 * - A line is a trace: one dot in every column between its first and last point, at the line's height there, and the
 *   dots between two columns where the line is steep, so the trace never breaks. The emphasised category is a plus of
 *   five dots at full strength. A series the chart dashes (never color alone, WCAG 1.4.1) skips every third column.
 * - A stack is one column of dots per category, each part lit in its hue from the baseline up, one unlit dot between
 *   parts. While a category is active the others dim to 55%.
 * - No value axis and no gridlines. The readout above the screen shows, in seven segments (the Seven-segment part), a
 *   single series' emphasised value or the active stack's total: the number the formatted value starts with, without
 *   its unit ("41 s" shows 41). A value that does not start with a number shows no readout. The tooltip and the hidden
 *   table say every value, with its unit.
 * - Category labels are engraved under the screen (litt-legend). Nothing grows or fades in: the dots are lit (R4,
 *   Device switches where it stands).
 */
import { useId, type ReactNode } from "react";
import { SevenSegment } from "@/components/seven-segment";
import type { ChartBodyProps } from "../chart";

const PITCH = 6; // a dot and the gap after it
const DOT = 2; // a dot's radius
const FIGURE = 7.2; // advance of a 12px tabular figure, as the chart measures labels
const LEVEL = [1, 0.55, 0.3];
/** A line's marker: the dot at the point and its four neighbours. */
const PLUS: [number, number][] = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
/** The number a formatted value starts with ("41 s", "2.5 GB", "1204"): what seven segments can show. */
const NUMBER = /^-?[0-9]+(?:\.[0-9]+)?/;

/** Device: a dot-matrix screen. */
export function ChartDeviceBody({ kind, width, height, text, g, labels, bars, traces, columns, ring, reading, emphasis, active }: ChartBodyProps) {
  const id = "dots" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const n = labels.length;
  const cols = Math.max(0, Math.floor(g.plotW / PITCH));
  const rows = Math.max(0, Math.floor(g.plotH / PITCH));
  const x0 = g.left + (g.plotW - cols * PITCH) / 2;
  const y0 = g.base - rows * PITCH;
  const single = !bars.some((b) => b.series > 0);
  const figure = reading === null ? null : (NUMBER.exec(reading.replace(/,/g, ""))?.[0] ?? null);

  /** The matrix column under an x and the row at a y, kept on the screen. */
  const colOf = (x: number) => Math.max(0, Math.min(cols - 1, Math.round((x - x0) / PITCH - 0.5)));
  const rowOf = (y: number) => Math.max(0, Math.min(rows - 1, Math.round((g.base - y) / PITCH - 0.5)));
  const dot = (key: string, c: number, r: number, fill: string, opacity: number) => (
    <circle
      key={key}
      data-dot=""
      cx={x0 + (c + 0.5) * PITCH}
      cy={g.base - (r + 0.5) * PITCH}
      r={DOT}
      opacity={opacity}
      className={"transition-[fill,opacity] duration-(--dur-instant) ease-litt " + fill}
    />
  );

  const traceDots =
    kind !== "line" || cols === 0 || rows === 0
      ? []
      : traces.flatMap((t) => {
          const pts = t.points;
          if (pts.length === 0) return [];
          const fill = t.hue ? t.fill : "fill-field-ink";
          const opacity = t.hue ? 1 : traces.length === 1 ? 0.6 : LEVEL[Math.min(t.series, 2)]!;
          const out: ReactNode[] = [];
          const lit = new Set<string>();
          const light = (c: number, r: number, o: number) => {
            if (c < 0 || c >= cols || r < 0 || r >= rows || lit.has(`${c}-${r}`)) return;
            lit.add(`${c}-${r}`);
            out.push(dot(`${t.key}-${c}-${r}`, c, r, fill, o));
          };
          /* The marker first, so its dots are the full-strength ones. */
          const mark = emphasis === null ? undefined : pts[emphasis];
          if (mark) for (const [dc, dr] of PLUS) light(colOf(mark.x) + dc, rowOf(mark.y) + dr, 1);
          const first = colOf(pts[0]!.x);
          const last = colOf(pts[pts.length - 1]!.x);
          let seg = 0;
          let prev: number | null = null;
          for (let c = first; c <= last; c++) {
            const x = x0 + (c + 0.5) * PITCH;
            while (seg < pts.length - 2 && x > pts[seg + 1]!.x) seg++;
            const a = pts[seg]!;
            const b = pts[Math.min(seg + 1, pts.length - 1)]!;
            const k = b.x === a.x ? 0 : Math.max(0, Math.min(1, (x - a.x) / (b.x - a.x)));
            const r = rowOf(a.y + (b.y - a.y) * k);
            /* Where the line climbs or falls more than a dot between two columns, light the dots between. */
            const from = prev === null ? r : r > prev ? prev + 1 : r < prev ? prev - 1 : r;
            prev = r;
            if (t.dashed && c % 3 === 2) continue;
            for (let q = Math.min(from, r); q <= Math.max(from, r); q++) light(c, q, opacity);
          }
          return out;
        });

  const stackDots =
    kind !== "stack" || cols === 0 || rows === 0
      ? []
      : columns.flatMap((col) => {
          const c = colOf(col.x);
          const opacity = active === null || active === col.index ? 1 : 0.55;
          let r = 0;
          return col.parts.flatMap((p) => {
            const tall = Math.max(1, Math.round(p.height / PITCH));
            const start = r;
            r += tall + 1;
            return Array.from({ length: Math.max(0, Math.min(tall, rows - start)) }, (_, k) => dot(`${p.key}-${k}`, c, start + k, p.fill, opacity));
          });
        });

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
          {traceDots}
          {stackDots}
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
