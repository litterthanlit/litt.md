/**
 * Chart, Heat's body (proposals/heat.md; taste/litt-principles.md, Heat): a sharp square telemetry plot on a black
 * slab (bleached sepia paper by day), framed by corner brackets with dashed telemetry gridlines and an amber crosshair
 * tracking the active reading.
 *
 * - Square slab (`rounded-none border border-line-strong bg-canvas`) behind the plot with four 8px ink corner brackets;
 *   zero shadows, zero rounded corners.
 * - Dashed horizontal gridlines (`3 3`) and solid baseline; tabular mono axis figures with the active category lit in
 *   `--accent-text`.
 * - BarChart: sharp square telemetry bars (`crispEdges`) with a 2px top cap on the emphasised bar and 6px amber corner
 *   brackets snapping around the active column.
 * - LineChart: 2px miter-joined telemetry traces with square hollow points on a single series and a vertical dashed amber
 *   crosshair + solid square reticle on the emphasised point.
 * - StackedBarChart: sharp square telemetry columns (2px segment gaps) with a vertical crosshair on the active column.
 * - All SVG coordinates are rounded to two decimals for deterministic SSR hydration.
 * - The contract (pointer layer, roving keyboard buttons, tooltip, hidden data table) stays in chart.tsx.
 */
import type { ChartBodyProps } from "@/components/chart";

const FIGURE = 7.2;
const LABEL_GAP = 6;
const MAX_COL = 14;
const PART_GAP = 2;
const EDGE = "stroke-[color-mix(in_oklab,var(--fg)_55%,transparent)]";
const COLOUR = "transition-colors duration-(--dur-instant) ease-litt";

const round = (n: number) => Math.round(n * 100) / 100;
const crisp = (y: number) => Math.round(y) + 0.5;

const FRAME_MARKS =
  "pointer-events-none absolute -inset-px bg-no-repeat text-fg " +
  "[background-image:linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)] " +
  "[background-size:8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px,8px_2px,2px_8px] " +
  "[background-position:left_top,left_top,right_top,right_top,left_bottom,left_bottom,right_bottom,right_bottom]";

/** Four 5px SVG corner brackets around a box, in `--accent-text`. */
function CornerBrackets({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  const m = Math.min(5, width / 2, height / 2);
  const x0 = round(x);
  const y0 = round(y);
  const x1 = round(x + width);
  const y1 = round(y + height);
  const d = [
    `M${x0} ${round(y0 + m)}V${y0}H${round(x0 + m)}`,
    `M${round(x1 - m)} ${y0}H${x1}V${round(y0 + m)}`,
    `M${x0} ${round(y1 - m)}V${y1}H${round(x0 + m)}`,
    `M${round(x1 - m)} ${y1}H${x1}V${round(y1 - m)}`,
  ].join(" ");
  return <path d={d} fill="none" strokeWidth={1.5} className="stroke-accent-text forced-colors:stroke-[Highlight]" />;
}

/** Heat: sharp telemetry slab, dashed gridlines, square bars/traces, and amber crosshair tracking. */
export function ChartHeatBody({ kind, width, height, text, g, labels, fmt, bars, traces, columns, ring, band, emphasis, active }: ChartBodyProps) {
  const n = labels.length;
  const single = traces.length === 1;
  const activeIdx = active ?? emphasis;

  const grid = (
    <g aria-hidden="true">
      <g shapeRendering="crispEdges">
        {g.ticks.map((t, i) => (
          <line
            key={t}
            x1={round(g.left)}
            x2={round(g.width)}
            y1={crisp(g.y(t))}
            y2={crisp(g.y(t))}
            strokeWidth={1}
            strokeDasharray={i === 0 ? undefined : "3 3"}
            className={i === 0 ? "stroke-line-strong" : "stroke-line"}
          />
        ))}
        {activeIdx !== null && activeIdx >= 0 && activeIdx < n && (
          <line
            x1={crisp(g.cx(activeIdx))}
            x2={crisp(g.cx(activeIdx))}
            y1={round(g.top)}
            y2={round(g.base)}
            strokeWidth={1}
            strokeDasharray="2 2"
            className="stroke-accent-text opacity-70 forced-colors:stroke-[Highlight]"
          />
        )}
      </g>
      <g className="font-mono text-caption font-normal tabular-nums">
        {g.ticks.map((t) => (
          <text key={t} x={round(g.left - LABEL_GAP)} y={round(g.y(t))} textAnchor="end" dominantBaseline="central" className="fill-fg-subtle">
            {fmt(t)}
          </text>
        ))}
        {labels.map((l, i) => {
          if ((n - 1 - i) % g.step !== 0) return null;
          const half = (l.length * FIGURE) / 2;
          const last = i === n - 1 && g.cx(i) + half > g.width;
          const isLit = i === activeIdx;
          return (
            <text
              key={i}
              x={round(last ? g.width : g.cx(i))}
              y={round(g.base + 20)}
              textAnchor={last ? "end" : "middle"}
              className={isLit ? "fill-accent-text font-title" : "fill-fg-subtle"}
            >
              {l}
            </text>
          );
        })}
      </g>
    </g>
  );

  let marks;
  if (kind === "bar") {
    const activeBars = activeIdx !== null ? bars.filter((b) => b.index === activeIdx) : [];
    const bracketBox =
      activeBars.length > 0
        ? {
            x: Math.min(...activeBars.map((b) => b.x)) - 2,
            y: Math.min(...activeBars.map((b) => b.y)) - 2,
            width: Math.max(...activeBars.map((b) => b.x + b.width)) - Math.min(...activeBars.map((b) => b.x)) + 4,
            height: g.y(0) - Math.min(...activeBars.map((b) => b.y)) + 4,
          }
        : null;
    marks = (
      <g aria-hidden="true">
        {bars.map((b) => (
          <g key={b.key} shapeRendering="crispEdges">
            <rect
              x={round(b.x)}
              y={round(b.y)}
              width={round(b.width)}
              height={round(b.height)}
              strokeWidth={1}
              className={COLOUR + " " + b.fill + (b.edge ? " " + EDGE : " stroke-transparent")}
            />
            {b.strong && (
              <rect
                x={round(b.x)}
                y={round(b.y)}
                width={round(b.width)}
                height={Math.min(2, round(b.height))}
                className="fill-accent-text forced-colors:fill-[Highlight]"
              />
            )}
          </g>
        ))}
        {bracketBox && <CornerBrackets {...bracketBox} />}
      </g>
    );
  } else if (kind === "stack") {
    const bw = Math.max(4, Math.min(MAX_COL, Math.floor(g.slotW * 0.55)));
    marks = (
      <g aria-hidden="true">
        {columns.map((c) => {
          const x = Math.round(c.x - bw / 2);
          let y = g.y(0);
          return (
            <g key={c.index} shapeRendering="crispEdges">
              {c.parts.map((p, k, all) => {
                const h = Math.max(2, p.height - (k < all.length - 1 ? PART_GAP : 0));
                const top = y - h;
                y = top - PART_GAP;
                return (
                  <rect
                    key={p.key}
                    x={x}
                    y={round(top)}
                    width={bw}
                    height={round(h)}
                    className={COLOUR + " " + p.fill}
                  />
                );
              })}
            </g>
          );
        })}
      </g>
    );
  } else {
    marks = (
      <g aria-hidden="true">
        {traces.map((t) => {
          const d = t.points.map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`).join(" ");
          const at = activeIdx !== null ? t.points[activeIdx] : null;
          return (
            <g key={t.key}>
              <path
                d={d}
                fill="none"
                stroke={t.stroke}
                strokeWidth={2}
                strokeLinejoin="miter"
                strokeLinecap={t.dash ? "butt" : "square"}
                strokeDasharray={t.dash}
              />
              {single &&
                t.points.map((pt, i) =>
                  i === activeIdx ? null : (
                    <rect
                      key={i}
                      x={round(pt.x - 2.5)}
                      y={round(pt.y - 2.5)}
                      width={5}
                      height={5}
                      stroke={t.marker}
                      strokeWidth={1.5}
                      className="fill-canvas"
                    />
                  ),
                )}
              {at && (
                <g>
                  <rect
                    x={round(at.x - 3.5)}
                    y={round(at.y - 3.5)}
                    width={7}
                    height={7}
                    className={t.hue ? "" : "fill-accent-text forced-colors:fill-[Highlight]"}
                    fill={t.hue ? t.marker : undefined}
                  />
                  <CornerBrackets x={at.x - 7} y={at.y - 7} width={14} height={14} />
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <>
      <div
        aria-hidden="true"
        data-body="heat"
        className="pointer-events-none absolute -z-10 rounded-none border border-line-strong bg-canvas forced-colors:border"
        style={{ left: round(g.left), top: round(g.top), width: round(g.plotW), height: round(g.plotH) }}
      >
        <span className={FRAME_MARKS} />
      </div>
      <svg data-body="heat" width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
        {grid}
        {band && <rect x={round(band.x)} y={round(band.y)} width={round(band.width)} height={round(band.height)} className="fill-surface-1 opacity-75" />}
        {marks}
        {ring && <rect x={round(ring.x)} y={round(ring.y)} width={round(ring.width)} height={round(ring.height)} fill="none" strokeWidth={2} className="stroke-focus" />}
      </svg>
    </>
  );
}
