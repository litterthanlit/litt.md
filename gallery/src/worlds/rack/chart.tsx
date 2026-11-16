/**
 * Chart, the Rack body (proposals/rack.md, round two): an arrangement. The plot is a dark panel with hairline gridlines,
 * and the data are clips on it, blocks in the colour of what they say.
 *
 * - The ground is a well (--tray, --tray-shade, a 1px outline) at the plot, square at the control radius, with the value
 *   axis and the category labels outside it in the caption size, tabular. The gridlines are 1px lines of the ink at a low
 *   share (the well is darker than the page, so the line token would vanish on it), the baseline a step stronger.
 * - A bar is a clip: a block in its series' hue's tint with a 1px edge and a 2px top line in the hue's mark tone (which
 *   reaches 3:1 on its tint). The emphasised bar (the last, or the one under the pointer or focus) takes the -text tone
 *   for both, a step stronger, and a 3px top line. A quiet series (no hue) is a flat block of the ink at 55%, the emphasised
 *   one full; several quiet series step down 100%, 55% and 30%, the third with its 1px edge, as the others do.
 * - A line is a 2px line in the mark tone, square at the joins, over a clip of the same tint when it is the chart's only
 *   series (several series would hide each other, so they keep the line alone). The emphasised point is a square in the
 *   text tone. A series told apart by dashes is still dashed (WCAG 1.4.1).
 * - A stack is one column of clips per category, wider than Press's rail: each part a block in its hue's tint with a 1px
 *   mark edge, parts 1px apart, the first at the bottom. The active column takes the text tone on every edge.
 * - Nothing grows, draws or fades in (Rack's motion: things are there on the frame, R4): marks are drawn at their final
 *   size and only their colour changes, on the instant tier. There is no fun path.
 * - The contract (the pointer layer, the buttons, the tooltip, the table) is chart.tsx's. Forced colors keeps a border
 *   on the well.
 */
import type { ChartBodyProps, ChartHue } from "@/components/chart";

const FIGURE = 7.2; // advance of a 12px tabular figure, as the chart measures labels
const LABEL_GAP = 6; // between a value label and the plot
const MAX_CLIP = 24; // a stacked column
const PART_GAP = 1; // air between the parts of a stacked column

/* Literal names, so Tailwind sees the classes and the registry can rename the variables. */
type Tone = { tint: string; markFill: string; textFill: string; markStroke: string; textStroke: string };
const TONE: Record<ChartHue, Tone> = {
  blue: { tint: "fill-data-blue-tint", markFill: "fill-data-blue", textFill: "fill-data-blue-text", markStroke: "stroke-data-blue", textStroke: "stroke-data-blue-text" },
  amber: { tint: "fill-data-amber-tint", markFill: "fill-data-amber", textFill: "fill-data-amber-text", markStroke: "stroke-data-amber", textStroke: "stroke-data-amber-text" },
  teal: { tint: "fill-data-teal-tint", markFill: "fill-data-teal", textFill: "fill-data-teal-text", markStroke: "stroke-data-teal", textStroke: "stroke-data-teal-text" },
  violet: { tint: "fill-data-violet-tint", markFill: "fill-data-violet", textFill: "fill-data-violet-text", markStroke: "stroke-data-violet", textStroke: "stroke-data-violet-text" },
  rose: { tint: "fill-data-rose-tint", markFill: "fill-data-rose", textFill: "fill-data-rose-text", markStroke: "stroke-data-rose", textStroke: "stroke-data-rose-text" },
};
const HUE = /^fill-data-(blue|amber|teal|violet|rose)/;
/** The data hue a paint class names, or null for the quiet ink. */
const hueOf = (fill: string): ChartHue | null => (HUE.exec(fill)?.[1] as ChartHue | undefined) ?? null;

const EDGE = "stroke-[color-mix(in_oklab,var(--fg)_55%,transparent)]";
const GRID = "stroke-[color-mix(in_oklab,var(--fg)_16%,transparent)]";
const BASELINE = "stroke-[color-mix(in_oklab,var(--fg)_45%,transparent)]";
const BAND = "fill-[color-mix(in_oklab,var(--fg)_8%,transparent)]";
const INK_CLIP = "fill-[color-mix(in_oklab,var(--fg)_14%,transparent)]";
const COLOUR = "transition-colors duration-(--dur-instant) ease-litt";
const crisp = (y: number) => Math.round(y) + 0.5;

/** Rack: clips on a dark well. */
export function ChartRackBody({ kind, width, height, text, g, labels, fmt, bars, traces, columns, ring, band, emphasis }: ChartBodyProps) {
  const n = labels.length;
  const single = traces.length === 1;

  const grid = (
    <g aria-hidden="true">
      <g shapeRendering="crispEdges">
        {g.ticks.map((t, i) => (
          <line key={t} x1={g.left} x2={g.width} y1={crisp(g.y(t))} y2={crisp(g.y(t))} strokeWidth={1} className={i === 0 ? BASELINE : GRID} />
        ))}
      </g>
      <g className="fill-fg-subtle text-caption font-normal tabular-nums">
        {g.ticks.map((t) => (
          <text key={t} x={g.left - LABEL_GAP} y={g.y(t)} textAnchor="end" dominantBaseline="central">
            {fmt(t)}
          </text>
        ))}
        {labels.map((l, i) => {
          if ((n - 1 - i) % g.step !== 0) return null;
          /* The last label would hang past the right edge: right-align it to the edge instead. */
          const half = (l.length * FIGURE) / 2;
          const last = i === n - 1 && g.cx(i) + half > g.width;
          return (
            <text key={i} x={last ? g.width : g.cx(i)} y={g.base + 20} textAnchor={last ? "end" : "middle"}>
              {l}
            </text>
          );
        })}
      </g>
    </g>
  );

  /* A bar is a clip: the tint, a 1px edge inside it and a top line, in the mark tone (the text tone when emphasised). */
  const clip = (key: string, x: number, y: number, w: number, h: number, hue: ChartHue, strong: boolean) => {
    const tone = TONE[hue];
    const edge = strong ? tone.textStroke : tone.markStroke;
    const top = strong ? tone.textFill : tone.markFill;
    return (
      <g key={key} shapeRendering="crispEdges">
        <rect x={x + 0.5} y={y + 0.5} width={Math.max(0, w - 1)} height={Math.max(0, h - 1)} strokeWidth={1} className={COLOUR + " " + tone.tint + " " + edge} />
        <rect x={x} y={y} width={w} height={Math.min(h, strong ? 3 : 2)} className={COLOUR + " " + top} />
      </g>
    );
  };

  let marks;
  if (kind === "bar") {
    marks = bars.map((b) => {
      const hue = hueOf(b.fill);
      if (hue) return clip(b.key, b.x, b.y, b.width, b.height, hue, b.strong);
      return (
        <rect
          key={b.key}
          x={b.x}
          y={b.y}
          width={b.width}
          height={b.height}
          strokeWidth={1}
          shapeRendering="crispEdges"
          className={COLOUR + " " + b.fill + (b.edge ? " " + EDGE : " stroke-transparent")}
        />
      );
    });
  } else if (kind === "stack") {
    const bw = Math.max(2, Math.min(MAX_CLIP, Math.floor(g.slotW * 0.6)));
    marks = columns.map((c) => {
      const x = Math.round(c.x - bw / 2);
      let y = g.y(0);
      return c.parts.map((p) => {
        const h = Math.max(2, p.height - PART_GAP);
        const top = y - h;
        y = top - PART_GAP;
        const tone = TONE[hueOf(p.fill) ?? "blue"];
        return (
          <rect
            key={p.key}
            x={x + 0.5}
            y={top + 0.5}
            width={bw - 1}
            height={Math.max(0, h - 1)}
            strokeWidth={1}
            shapeRendering="crispEdges"
            className={COLOUR + " " + tone.tint + " " + (emphasis === c.index ? tone.textStroke : tone.markStroke)}
          />
        );
      });
    });
  } else {
    marks = traces.map((t) => {
      const hue = hueOf(t.fill);
      const points = t.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
      const first = t.points[0];
      const last = t.points[t.points.length - 1];
      const area = single && first && last && t.points.length > 1 ? `${points} L${last.x} ${g.base} L${first.x} ${g.base} Z` : null;
      const at = emphasis === null ? null : t.points[emphasis];
      return (
        <g key={t.key}>
          {area && <path d={area} stroke="none" className={hue ? TONE[hue].tint : INK_CLIP} />}
          <path
            d={points}
            fill="none"
            stroke={t.stroke}
            strokeWidth={2}
            strokeLinejoin="miter"
            strokeLinecap={t.dash ? "round" : "butt"}
            strokeDasharray={t.dash}
          />
          {at && <rect x={at.x - 3.5} y={at.y - 3.5} width={7} height={7} fill={t.marker} stroke="none" />}
        </g>
      );
    });
  }

  return (
    <>
      <div
        aria-hidden="true"
        data-well=""
        className="absolute -z-10 rounded-control bg-tray shadow-(--tray-shade) forced-colors:border"
        style={{ left: g.left, top: g.top, width: g.plotW, height: g.plotH }}
      />
      <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
        {grid}
        {band && <rect {...band} className={BAND} />}
        <g aria-hidden="true">
          {marks}
          {ring && <rect {...ring} fill="none" strokeWidth={2} className="stroke-focus" />}
        </g>
      </svg>
    </>
  );
}
