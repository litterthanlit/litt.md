/**
 * Stat with a Sparkline · fun mode. The tile is the real Stat (stat.tsx); its value and trend are fun mode's. Every
 * settled frame is the Stat and the Sparkline (sparkline.tsx) to the pixel: the 2px line with round joins, the 8px dot on
 * its 2px surface ring, the figure in the h3 size with tabular numbers.
 *
 * - The line draws itself from the oldest day to the latest at a steady hand, and the figure counts with the pen, so
 *   the number and the line arrive together. A tween, not a spring: a pen does not bounce, and a count never overshoots.
 * - The latest-day dot pops in as the line reaches it.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import { Stat } from "@/components/stat";
import { FUN, groupDigits, useFun } from "./motion";
import { DrawPath, PopGroup } from "./settle";

const STROKE = 2;
const DOT = 4;
const GAP = 2;
const AIR = 2;
const round = (n: number) => Math.round(n * 100) / 100;
const LINE = "stroke-[color-mix(in_oklab,var(--fg)_55%,transparent)]";

export type FunStatProps = {
  label: string;
  value: number;
  unit?: string;
  delta?: string;
  tone?: "good" | "bad" | "neutral";
  trendLabel: string;
  values: number[];
  play: number;
};

export function FunStat({ label, value, unit, delta, tone, trendLabel, values, play }: FunStatProps) {
  const fun = useFun();
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (play === 0) return;
    if (fun.reduced) return setShown(value);
    setShown(0);
    const run = animate(0, value, { ...FUN.draw, onUpdate: (v) => setShown(Math.round(v)) });
    return () => run.stop();
  }, [play, value, fun.reduced]);
  return (
    <Stat
      label={label}
      value={
        <>
          <span aria-hidden="true">{groupDigits(shown)}</span>
          <span className="sr-only">{groupDigits(value)}</span>
        </>
      }
      unit={unit}
      delta={delta}
      tone={tone}
      trend={<DrawnSparkline label={trendLabel} values={values} play={play} />}
    />
  );
}

/** The Sparkline's geometry, drawn by a pen on `play`. */
function DrawnSparkline({ label, values, play, height = 32 }: { label: string; values: number[]; play: number; height?: number }) {
  const fun = useFun();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    /* offsetWidth, not the screen box: the canvas may be zoomed, and the line is drawn in the tile's own px. */
    const read = () => setWidth(el.offsetWidth);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = values.length;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const top = AIR + STROKE / 2;
  const plotH = Math.max(0, height - 2 * top);
  const y = (v: number) => round(top + (1 - (hi > lo ? (v - lo) / (hi - lo) : 0.5)) * plotH);
  const left = STROKE / 2;
  const right = Math.max(left, width - DOT);
  const x = (i: number) => round(n > 1 ? left + (i * (right - left)) / (n - 1) : right);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(v)}`).join(" ");
  const drawn = play > 0 && !fun.reduced;
  const summary = `${label}: from ${groupDigits(values[0]!)} to ${groupDigits(values[n - 1]!)}, low ${groupDigits(lo)}, high ${groupDigits(hi)}`;

  return (
    <div ref={box} className="relative w-full min-w-0" style={{ height }}>
      {width > 0 && (
        <svg key={play} width={width} height={height} role="img" aria-label={summary} className="absolute top-0 left-0 block overflow-visible">
          <DrawPath d={d} fill="none" strokeWidth={STROKE} strokeLinejoin="round" strokeLinecap="round" className={LINE} draw={drawn} transition={FUN.draw} />
          {/* The dot lands as the pen reaches it. */}
          <PopGroup pop={drawn} x={x(n - 1)} y={y(values[n - 1]!)} transition={{ ...FUN.pop, delay: FUN.draw.duration * 0.92 } /* litt-allow: fun mode, the dot lands with the pen */}>
            <circle cx={x(n - 1)} cy={y(values[n - 1]!)} r={DOT + GAP} stroke="none" className="fill-surface-1" />
            <circle cx={x(n - 1)} cy={y(values[n - 1]!)} r={DOT} stroke="none" className="fill-fg" />
          </PopGroup>
        </svg>
      )}
    </div>
  );
}
