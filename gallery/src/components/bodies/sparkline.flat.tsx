/**
 * Sparkline, the Flat body (proposals/worlds.md, Bodies): the trend as it has always been, drawn on the page with no
 * ground.
 *
 * - A 2px line with round joins and caps, an optional dashed 1px baseline, and a dot of 4px radius on the latest value
 *   over a 2px ring in the surface color, so it reads on a busy row and the line does not run into it.
 * - The line is the quiet foreground (or the hue's mark tone) and the dot the full foreground (or the hue's -text tone).
 * - In fun mode (motion/fun.tsx) the line draws itself and the dot lands as the pen reaches it; each hands over to the
 *   plain mark, so at rest it is the static drawing exactly.
 */
import { useState } from "react";
import { motion } from "motion/react";
import { useFun } from "@/motion";
import type { SparklineBodyProps } from "../sparkline";

const STROKE = 2; // the line's width
const DOT = 4; // the dot's radius: 8px across
const GAP = 2; // the ring around the dot
const AIR = 2; // between the line's edge and the box, above and below
const DASH = "4 3";

const round = (n: number) => Math.round(n * 100) / 100;

/** Flat: a thin line on the page. */
export function SparklineFlatBody({ boxRef, width, height, text, data, at, goal, tone, ring, className }: SparklineBodyProps) {
  const n = data.length;
  const top = AIR + STROKE / 2;
  const plotH = Math.max(0, height - 2 * top);
  const y = (v: number) => round(top + (1 - at(v)) * plotH);
  /* The line starts half a stroke in and ends a dot's radius short of the edge, so neither is cut. */
  const left = STROKE / 2;
  const right = Math.max(left, width - DOT);
  const x = (i: number) => round(n > 1 ? left + (i * (right - left)) / (n - 1) : right);

  /* Fun mode: on arrival the line draws itself at a steady hand and the dot lands as the pen reaches it. Each hands
     over to the plain mark once done (a drawn path keeps a dash pattern that antialiases its caps a hair differently). */
  const fun = useFun();
  const [drawing, setDrawing] = useState(() => !!fun);
  const [landing, setLanding] = useState(() => !!fun);
  const land = fun ? { ...fun.pop, delay: data.length > 1 ? fun.draw.duration : 0 } : undefined;
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(v)}`).join(" ");
  /* A 1px line is crisp on the half pixel. */
  const goalY = goal === null ? 0 : Math.round(round(top + (1 - goal) * plotH)) + 0.5;

  return (
    <div ref={boxRef} data-body="flat" className={"relative w-full min-w-0 " + className} style={{ height }}>
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
                strokeLinejoin="round"
                strokeLinecap="round"
                className={tone.line}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={fun.draw}
                onAnimationComplete={() => setDrawing(false)}
              />
            ) : (
              <path d={line} fill="none" strokeWidth={STROKE} strokeLinejoin="round" strokeLinecap="round" className={tone.line} />
            ))}
          {n > 0 &&
            (fun && landing ? (
              <motion.g
                style={{ originX: `${x(n - 1)}px`, originY: `${y(data[n - 1]!)}px` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={land}
                onAnimationComplete={() => setLanding(false)}
              >
                <circle cx={x(n - 1)} cy={y(data[n - 1]!)} r={DOT + GAP} stroke="none" className={ring} />
                <circle cx={x(n - 1)} cy={y(data[n - 1]!)} r={DOT} stroke="none" className={tone.dot} />
              </motion.g>
            ) : (
              <>
                <circle cx={x(n - 1)} cy={y(data[n - 1]!)} r={DOT + GAP} stroke="none" className={ring} />
                <circle cx={x(n - 1)} cy={y(data[n - 1]!)} r={DOT} stroke="none" className={tone.dot} />
              </>
            ))}
        </svg>
      )}
    </div>
  );
}
