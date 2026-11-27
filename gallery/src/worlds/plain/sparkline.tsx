/**
 * Sparkline, Plain's body (taste v1.23, proposals/plain-studies.md): a crisp 1.5px mitered line bare on white paper,
 * ending in a square vertex mark.
 *
 * - No sunken groove, no slab border, no round pearl: the polyline sits directly on the page with mitered joins and
 *   square caps, an optional 1px dashed `--line-strong` baseline, and a 4.5px square endpoint over a 7.5px square cut
 *   in the surface colour so the line stops cleanly at the mark.
 * - Coordinates are rounded to two decimals so server and client agree on hydration.
 * - Fun mode draws the trace and lands the square endpoint, then hands over to the static mark at rest.
 */
import { useState } from "react";
import { motion } from "motion/react";
import { useFun } from "@/motion";
import type { SparklineBodyProps } from "@/components/sparkline";

const STROKE = 1.5;
const VERTEX = 4.5;
const CUT = 7.5;
const AIR = 2;
const DASH = "4 3";

const round = (n: number) => Math.round(n * 100) / 100;

/** Plain: a crisp 1.5px polyline on bare paper with a square endpoint. */
export function SparklinePlainBody({ boxRef, width, height, text, data, at, goal, tone, ring, className }: SparklineBodyProps) {
  const n = data.length;
  const top = AIR + CUT / 2;
  const plotH = Math.max(0, height - 2 * top);
  const y = (v: number) => round(top + (1 - at(v)) * plotH);
  const left = STROKE / 2;
  const right = Math.max(left, width - CUT / 2);
  const x = (i: number) => round(n > 1 ? left + (i * (right - left)) / (n - 1) : right);

  const fun = useFun();
  const [drawing, setDrawing] = useState(() => !!fun);
  const [landing, setLanding] = useState(() => !!fun);
  const land = fun ? { ...fun.pop, delay: data.length > 1 ? fun.draw.duration : 0 } : undefined;
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(v)}`).join(" ");
  const goalY = goal === null ? 0 : Math.round(round(top + (1 - goal) * plotH)) + 0.5;
  const lastX = n > 0 ? x(n - 1) : 0;
  const lastY = n > 0 ? y(data[n - 1]!) : 0;

  return (
    <div ref={boxRef} data-body="plain" className={"relative w-full min-w-0 " + className} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={text} className="absolute top-0 left-0 block overflow-visible">
          {goal !== null && (
            <line
              x1={0}
              x2={width}
              y1={goalY}
              y2={goalY}
              strokeWidth={1}
              strokeDasharray={DASH}
              shapeRendering="crispEdges"
              className="stroke-line-strong"
            />
          )}
          {n > 1 &&
            (fun && drawing ? (
              <motion.path
                d={line}
                fill="none"
                strokeWidth={STROKE}
                strokeLinejoin="miter"
                strokeLinecap="square"
                className={tone.line}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={fun.draw}
                onAnimationComplete={() => setDrawing(false)}
              />
            ) : (
              <path d={line} fill="none" strokeWidth={STROKE} strokeLinejoin="miter" strokeLinecap="square" className={tone.line} />
            ))}
          {n > 0 &&
            (fun && landing ? (
              <motion.g
                style={{ originX: `${lastX}px`, originY: `${lastY}px` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={land}
                onAnimationComplete={() => setLanding(false)}
              >
                <rect x={round(lastX - CUT / 2)} y={round(lastY - CUT / 2)} width={CUT} height={CUT} stroke="none" className={ring} />
                <rect x={round(lastX - VERTEX / 2)} y={round(lastY - VERTEX / 2)} width={VERTEX} height={VERTEX} stroke="none" className={tone.dot + " forced-colors:fill-[CanvasText]"} />
              </motion.g>
            ) : (
              <>
                <rect x={round(lastX - CUT / 2)} y={round(lastY - CUT / 2)} width={CUT} height={CUT} stroke="none" className={ring} />
                <rect x={round(lastX - VERTEX / 2)} y={round(lastY - VERTEX / 2)} width={VERTEX} height={VERTEX} stroke="none" className={tone.dot + " forced-colors:fill-[CanvasText]"} />
              </>
            ))}
        </svg>
      )}
    </div>
  );
}
