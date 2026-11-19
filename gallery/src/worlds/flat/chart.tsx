/**
 * Chart, Flat's body (skills/litt-md/taste/litt-principles.md, Flat; proposals/flat-pill.md): airy shapes on the ground
 * with no gridlines and no baseline rule.
 *
 * - No lines between things: horizontal gridlines and the baseline hairline are gone, leaving crisp tabular value labels
 *   and category labels in air so the Candy data hues stand on their own.
 * - BarChart: capsule bars (rounded pill corners) that spring up from the baseline on Flat's expressive spring (0.28
 *   bounce on arrival, instant under reduced motion), with a soft rounded bubble band behind the active column.
 * - LineChart: 2.5px smooth-capped traces with a bold circular pearl (5px radius ringed in the canvas) on the active point.
 * - StackedBarChart: pill-capped capsule columns with clean air between segments, springing up from the baseline.
 * - Forced colors keeps a crisp focus ring and CanvasText/Highlight readability; the contract (pointer layer, roving
 *   buttons, tooltip, hidden data table) stays in chart.tsx.
 */
import { motion } from "motion/react";
import { useTransition } from "@/motion";
import type { ChartBodyProps } from "@/components/chart";

const FIGURE = 7.2;
const LABEL_GAP = 8;
const MAX_CAPSULE = 12;
const PART_GAP = 3;
const EDGE = "stroke-[color-mix(in_oklab,var(--fg)_55%,transparent)]";
const COLOUR = "transition-[fill] duration-(--dur-instant) ease-litt";
const BAND = "fill-[color-mix(in_oklab,var(--fg)_5%,transparent)]";

const round = (n: number) => Math.round(n * 100) / 100;

/** Flat: gridline-free pill bars, Candy pearl line points, and bouncy expressive arrival. */
export function ChartFlatBody({ kind, width, height, text, g, labels, fmt, bars, traces, columns, ring, band, emphasis, entrance }: ChartBodyProps) {
  const n = labels.length;
  const spring = useTransition("expressive");

  const axis = (
    <g aria-hidden="true" className="fill-fg-subtle text-caption font-normal tabular-nums">
      {g.ticks.map((t) => (
        <text key={t} x={round(g.left - LABEL_GAP)} y={round(g.y(t))} textAnchor="end" dominantBaseline="central">
          {fmt(t)}
        </text>
      ))}
      {labels.map((l, i) => {
        if ((n - 1 - i) % g.step !== 0) return null;
        const half = (l.length * FIGURE) / 2;
        const last = i === n - 1 && g.cx(i) + half > g.width;
        return (
          <text key={i} x={round(last ? g.width : g.cx(i))} y={round(g.base + 20)} textAnchor={last ? "end" : "middle"}>
            {l}
          </text>
        );
      })}
    </g>
  );

  let marks;
  if (kind === "bar") {
    marks = (
      <g aria-hidden="true">
        {bars.map((b) => {
          const r = round(Math.min(b.width / 2, b.height / 2, 14));
          return (
            <motion.rect
              key={b.key}
              x={round(b.x)}
              y={round(b.y)}
              width={round(b.width)}
              height={round(b.height)}
              rx={r}
              ry={r}
              initial={entrance ? { scaleY: 0 } : false}
              animate={{ scaleY: 1, transition: spring }}
              style={{ originX: 0.5, originY: 1 }}
              strokeWidth={1}
              className={COLOUR + " " + b.fill + (b.edge ? " " + EDGE : " stroke-transparent")}
            />
          );
        })}
        {ring && <rect x={round(ring.x)} y={round(ring.y)} width={round(ring.width)} height={round(ring.height)} rx={8} fill="none" strokeWidth={2} className="stroke-focus" />}
      </g>
    );
  } else if (kind === "stack") {
    const bw = Math.max(4, Math.min(MAX_CAPSULE, Math.floor(g.slotW * 0.55)));
    const baseline = g.y(0);
    marks = (
      <g aria-hidden="true">
        {columns.map((c) => {
          const x = round(c.x - bw / 2);
          let y = baseline;
          return (
            <motion.g
              key={c.index}
              initial={entrance ? { scaleY: 0 } : false}
              animate={{ scaleY: 1, transition: spring }}
              style={{ originX: 0.5, originY: 1, transformOrigin: `${round(c.x)}px ${round(baseline)}px` }}
            >
              {c.parts.map((p, k, all) => {
                const h = Math.max(4, p.height - (k < all.length - 1 ? PART_GAP : 0));
                const top = y - h;
                y = top - PART_GAP;
                const r = round(Math.min(bw / 2, h / 2));
                return (
                  <rect
                    key={p.key}
                    x={x}
                    y={round(top)}
                    width={bw}
                    height={round(h)}
                    rx={r}
                    ry={r}
                    className={COLOUR + " " + p.fill}
                  />
                );
              })}
            </motion.g>
          );
        })}
        {ring && <rect x={round(ring.x)} y={round(ring.y)} width={round(ring.width)} height={round(ring.height)} rx={8} fill="none" strokeWidth={2} className="stroke-focus" />}
      </g>
    );
  } else {
    marks = (
      <g aria-hidden="true">
        <motion.g initial={entrance ? { opacity: 0 } : false} animate={{ opacity: 1, transition: spring }}>
          {traces.map((t) => (
            <path
              key={t.key}
              d={t.points.map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)} ${round(p.y)}`).join(" ")}
              fill="none"
              stroke={t.stroke}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={t.dash}
            />
          ))}
        </motion.g>
        {emphasis !== null &&
          traces.map((t) => {
            const pt = t.points[emphasis];
            if (!pt) return null;
            return (
              <g key={t.key}>
                <circle cx={round(pt.x)} cy={round(pt.y)} r={7.5} className="fill-canvas" />
                <circle cx={round(pt.x)} cy={round(pt.y)} r={5} fill={t.marker} stroke="none" />
              </g>
            );
          })}
        {ring && <rect x={round(ring.x)} y={round(ring.y)} width={round(ring.width)} height={round(ring.height)} rx={999} fill="none" strokeWidth={2} className="stroke-focus" />}
      </g>
    );
  }

  return (
    <svg data-body="flat" width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
      {axis}
      {band && <rect x={round(band.x)} y={round(band.y)} width={round(band.width)} height={round(band.height)} rx={8} className={BAND} />}
      {marks}
    </svg>
  );
}
