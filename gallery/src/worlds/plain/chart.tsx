/**
 * Chart, Plain's body (taste v1.23, proposals/plain-studies.md): Tufte bare-paper charts with 1px hairlines, geometric
 * scale cuts through square bars, square line vertices, and Subtraction focus.
 *
 * - Bare on `--canvas`: no sunken tray, no outer 4-sided box, no heavy gridlines. A single 1px `--line-control`
 *   baseline anchors `y(0)`, and short 4px tick marks at `g.ticks` label the scale in tabular figures.
 * - BarChart: square `0px` bars rising on the zero-bounce responsive spring (`enter`). Horizontal `1.5px` `clipPath`
 *   cuts slice cleanly through the bars at intermediate ticks so values read directly without background gridlines and
 *   reveal whatever paper surface lies underneath.
 * - StackedBarChart: square columns parted by `1.5px` open gaps, rising with zero bounce.
 * - LineChart: crisp `1.5px` mitered traces with `5px` square vertex markers over an `8px` clipped gap on the
 *   emphasised point, plus a dashed 1px vertical hairline while inspecting a category.
 * - Subtraction focus: while a category is inspected (`active !== null`), uninvolved bars and stacked columns step
 *   down in opacity (`opacity-30`) at `--dur-instant` instead of painting a grey hover band behind the column.
 */
import { useId } from "react";
import { motion } from "motion/react";
import type { ChartBodyProps } from "@/components/chart";

const FIGURE = 7.2;
const LABEL_GAP = 8;
const TICK = 4;
const MAX_STACK = 20;
const PART_GAP = 1.5;
const VERTEX = 5;
const CUT = 8;
const EDGE = "stroke-[color-mix(in_oklab,var(--fg)_55%,transparent)]";
const MARK_TRANSITION = "transition-[fill,opacity] duration-(--dur-instant) ease-litt";

const round = (n: number) => Math.round(n * 100) / 100;

/** Plain: bare-paper square bars with clipped scale cuts, mitered lines with square vertices, and Subtraction focus. */
export function ChartPlainBody({ kind, width, height, text, g, labels, fmt, bars, traces, columns, ring, emphasis, active, entrance, enter }: ChartBodyProps) {
  const cutClipId = useId();
  const n = labels.length;
  const baseLineY = Math.round(g.y(0)) + 0.5;
  const maxTick = g.ticks.length ? Math.max(...g.ticks) : 0;
  const scaleCuts = g.ticks.filter((t) => t > 0 && t < maxTick);

  const axis = (
    <g aria-hidden="true" className="text-caption font-normal tabular-nums">
      {g.ticks.map((t) => {
        const ty = round(g.y(t));
        const crispY = Math.round(ty) + 0.5;
        return (
          <g key={t}>
            {t > 0 && <line x1={round(g.left - TICK)} x2={round(g.left)} y1={crispY} y2={crispY} strokeWidth={1} shapeRendering="crispEdges" className="stroke-line" />}
            <text x={round(g.left - LABEL_GAP)} y={ty} textAnchor="end" dominantBaseline="central" className="fill-fg-subtle">
              {fmt(t)}
            </text>
          </g>
        );
      })}
      <line x1={round(g.left)} x2={round(g.width)} y1={baseLineY} y2={baseLineY} strokeWidth={1} shapeRendering="crispEdges" className="stroke-line-control" />
      {labels.map((l, i) => {
        if ((n - 1 - i) % g.step !== 0) return null;
        const half = (l.length * FIGURE) / 2;
        const last = i === n - 1 && g.cx(i) + half > g.width;
        const isCurrent = active === i;
        return (
          <text
            key={i}
            x={round(last ? g.width : g.cx(i))}
            y={round(g.base + 20)}
            textAnchor={last ? "end" : "middle"}
            className={isCurrent ? "fill-fg" : "fill-fg-subtle"}
          >
            {l}
          </text>
        );
      })}
    </g>
  );

  const outerBox = `M -16 -16 H ${round(width + 16)} V ${round(height + 16)} H -16 Z`;
  let defs = null;
  let marks;
  if (kind === "bar") {
    if (scaleCuts.length > 0) {
      const holes = scaleCuts
        .map((t) => {
          const y0 = round(Math.round(g.y(t)) - 0.25);
          const y1 = round(y0 + 1.5);
          return `M 0 ${y0} V ${y1} H ${round(width)} V ${y0} Z`;
        })
        .join(" ");
      defs = (
        <defs>
          <clipPath id={cutClipId} clipPathUnits="userSpaceOnUse">
            <path clipRule="evenodd" d={`${outerBox} ${holes}`} />
          </clipPath>
        </defs>
      );
    }
    marks = (
      <g aria-hidden="true">
        <g clipPath={scaleCuts.length > 0 ? `url(#${cutClipId})` : undefined}>
          {bars.map((b) => {
            const dimmed = active !== null && b.index !== active;
            return (
              <motion.rect
                key={b.key}
                x={round(b.x)}
                y={round(b.y)}
                width={round(b.width)}
                height={round(b.height)}
                initial={entrance ? { scaleY: 0 } : false}
                animate={{ scaleY: 1, transition: enter }}
                style={{ originX: 0.5, originY: 1 }}
                strokeWidth={1}
                className={
                  MARK_TRANSITION +
                  " " +
                  b.fill +
                  (dimmed ? " opacity-30" : "") +
                  (b.edge ? " " + EDGE : " stroke-transparent") +
                  " forced-colors:fill-[CanvasText]"
                }
              />
            );
          })}
        </g>
        {ring && <rect x={round(ring.x)} y={round(ring.y)} width={round(ring.width)} height={round(ring.height)} fill="none" strokeWidth={2} className="stroke-focus" />}
      </g>
    );
  } else if (kind === "stack") {
    const bw = Math.max(6, Math.min(MAX_STACK, Math.floor(g.slotW * 0.55)));
    const baseline = g.y(0);
    marks = (
      <g aria-hidden="true">
        {columns.map((c) => {
          const x = round(c.x - bw / 2);
          let y = baseline;
          const dimmed = active !== null && c.index !== active;
          return (
            <motion.g
              key={c.index}
              initial={entrance ? { scaleY: 0 } : false}
              animate={{ scaleY: 1, transition: enter }}
              style={{ originX: 0.5, originY: 1, transformOrigin: `${round(c.x)}px ${round(baseline)}px` }}
              className={"transition-opacity duration-(--dur-instant) ease-litt" + (dimmed ? " opacity-30" : "")}
            >
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
                    className={"transition-[fill] duration-(--dur-instant) ease-litt " + p.fill + " forced-colors:fill-[CanvasText]"}
                  />
                );
              })}
            </motion.g>
          );
        })}
        {ring && <rect x={round(ring.x)} y={round(ring.y)} width={round(ring.width)} height={round(ring.height)} fill="none" strokeWidth={2} className="stroke-focus" />}
      </g>
    );
  } else {
    const activeX = active === null ? null : Math.round(g.cx(active)) + 0.5;
    const cutPoints = emphasis === null ? [] : traces.flatMap((t) => (t.points[emphasis] ? [t.points[emphasis]!] : []));
    if (cutPoints.length > 0) {
      const holes = cutPoints
        .map((pt) => {
          const x0 = round(pt.x - CUT / 2);
          const y0 = round(pt.y - CUT / 2);
          const x1 = round(x0 + CUT);
          const y1 = round(y0 + CUT);
          return `M ${x0} ${y0} V ${y1} H ${x1} V ${y0} Z`;
        })
        .join(" ");
      defs = (
        <defs>
          <clipPath id={cutClipId} clipPathUnits="userSpaceOnUse">
            <path clipRule="evenodd" d={`${outerBox} ${holes}`} />
          </clipPath>
        </defs>
      );
    }
    marks = (
      <g aria-hidden="true">
        {activeX !== null && (
          <line
            x1={activeX}
            x2={activeX}
            y1={round(g.top)}
            y2={baseLineY}
            strokeWidth={1}
            strokeDasharray="2 2"
            shapeRendering="crispEdges"
            className="stroke-line-strong"
          />
        )}
        <motion.g
          initial={entrance ? { opacity: 0 } : false}
          animate={{ opacity: 1, transition: enter }}
          clipPath={cutPoints.length > 0 ? `url(#${cutClipId})` : undefined}
        >
          {traces.map((t) => (
            <path
              key={t.key}
              d={t.points.map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`).join(" ")}
              fill="none"
              stroke={t.stroke}
              strokeWidth={1.5}
              strokeLinejoin="miter"
              strokeLinecap="butt"
              strokeDasharray={t.dash}
            />
          ))}
        </motion.g>
        {emphasis !== null &&
          traces.map((t) => {
            const pt = t.points[emphasis];
            if (!pt) return null;
            return <rect key={t.key} x={round(pt.x - VERTEX / 2)} y={round(pt.y - VERTEX / 2)} width={VERTEX} height={VERTEX} fill={t.marker} stroke="none" />;
          })}
        {ring && <rect x={round(ring.x)} y={round(ring.y)} width={round(ring.width)} height={round(ring.height)} fill="none" strokeWidth={2} className="stroke-focus" />}
      </g>
    );
  }

  return (
    <svg data-body="plain" width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
      {defs}
      {axis}
      {marks}
    </svg>
  );
}
