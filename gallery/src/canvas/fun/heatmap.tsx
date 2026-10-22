/**
 * Heatmap · fun mode. At rest it is the Heatmap (heatmap.tsx) to the pixel: the label column, dots at the cell size on
 * a pitch of the cell plus 4px, the four steps of one hue over the empty fg-8% dot, the totals, the Less/More legend,
 * and the Tooltip's look over the dot in use.
 *
 * - Arrival, in two beats: the empty grid pops in on a diagonal wave (structure first), then the data fills in by
 *   level, the quietest dots first and the busiest last, so the peaks are the final thing to land. The totals count
 *   up as their row fills.
 * - Touch: a lens follows the pointer, as on the Apple Watch's app grid. Dots near it swell and ease their neighbours
 *   aside, falling off smoothly over two and a half dots; pressing deepens it. The dot under the pointer is ringed and
 *   named in the tooltip, as in the Heatmap. The lens fades in and out; it never jumps.
 * - Everything is transform and opacity. Under reduced motion there is no lens and no wave: the ring and the tooltip
 *   still follow the pointer, as they do in the Heatmap.
 * - The pointer is read in the grid's own units (the box's width against the grid's), so the lens stays exact inside
 *   a zoomed canvas.
 * - Cost: the arrival is drawn on one canvas over the grid, on the same springs (Motion's spring generator), about
 *   140 circles a frame. Hundreds of animated elements would each need their own compositing layer; one canvas needs
 *   one. When the last dot lands the canvas goes and the plain dots, the Heatmap's own markup, are what stays. The lens
 *   writes transforms itself, once a frame, to the dozen dots near the pointer and to the ones it just left. The
 *   totals count in their own component. The dots never re-render while anything moves.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { animate, motion, spring, useMotionValue, useMotionValueEvent, useSpring } from "motion/react";
import { useTransition } from "@/motion";
import { FUN, useFun } from "./motion";
import type { FunHue } from "./meter";

const GAP = 4;
const EMPTY = "bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]";
const HUE: Record<FunHue, readonly [string, string, string, string]> = {
  blue: ["bg-[color-mix(in_oklab,var(--data-blue)_30%,transparent)]", "bg-[color-mix(in_oklab,var(--data-blue)_55%,transparent)]", "bg-[color-mix(in_oklab,var(--data-blue)_80%,transparent)]", "bg-data-blue"],
  amber: ["bg-[color-mix(in_oklab,var(--data-amber)_30%,transparent)]", "bg-[color-mix(in_oklab,var(--data-amber)_55%,transparent)]", "bg-[color-mix(in_oklab,var(--data-amber)_80%,transparent)]", "bg-data-amber"],
  teal: ["bg-[color-mix(in_oklab,var(--data-teal)_30%,transparent)]", "bg-[color-mix(in_oklab,var(--data-teal)_55%,transparent)]", "bg-[color-mix(in_oklab,var(--data-teal)_80%,transparent)]", "bg-data-teal"],
  violet: ["bg-[color-mix(in_oklab,var(--data-violet)_30%,transparent)]", "bg-[color-mix(in_oklab,var(--data-violet)_55%,transparent)]", "bg-[color-mix(in_oklab,var(--data-violet)_80%,transparent)]", "bg-data-violet"],
  rose: ["bg-[color-mix(in_oklab,var(--data-rose)_30%,transparent)]", "bg-[color-mix(in_oklab,var(--data-rose)_55%,transparent)]", "bg-[color-mix(in_oklab,var(--data-rose)_80%,transparent)]", "bg-data-rose"],
};

/* The lens: how far it reaches, in dots, how much the centre swells and how far neighbours step aside, in px. */
const LENS_REACH = 2.6;
const LENS_SWELL = 0.55;
const LENS_PUSH = 3;
/** How the lens follows the pointer: fun mode's follow spring. */
const LENS_GLIDE = { visualDuration: FUN.follow.visualDuration, bounce: FUN.follow.bounce };

function quantile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const at = (sorted.length - 1) * p;
  const lo = Math.floor(at);
  const hi = Math.ceil(at);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (at - lo);
}
function levelOf(v: number, steps: number[]) {
  if (!(v > 0)) return 0;
  let level = 1;
  for (let k = 1; k < 4; k++) if (v >= steps[k]!) level = k + 1;
  return level;
}

export type FunHeatmapRow = { label: string; values: number[]; total: number };

export type FunHeatmapProps = {
  label: string;
  rows: FunHeatmapRow[];
  columns: string[];
  hue: FunHue;
  unit: [one: string, other: string];
  cell?: number;
  play: number;
};

type DotEls = { lens: HTMLSpanElement; arrive: HTMLSpanElement; empty: HTMLSpanElement; fill: HTMLSpanElement | null };

export function FunHeatmap({ label, rows, columns, hue, unit, cell = 12, play }: FunHeatmapProps) {
  const fun = useFun();
  const pitch = cell + GAP;
  const cols = columns.length;
  const gridW = cols * pitch - GAP;
  const gridH = rows.length * pitch - GAP;
  const levels = useMemo(() => {
    const sorted = rows.flatMap((r) => r.values).filter((v) => v > 0).sort((a, b) => a - b);
    const steps = sorted.length ? [sorted[0]!, quantile(sorted, 0.25), quantile(sorted, 0.5), quantile(sorted, 0.75)] : [1, 2, 3, 4];
    return rows.map((r) => r.values.map((v) => levelOf(v, steps)));
  }, [rows]);

  /* Every dot's elements, by row and column, for the arrival and the lens to reach without React. */
  const dots = useRef<(DotEls | undefined)[][]>([]);
  const register = useCallback((r: number, c: number, els: DotEls | null) => {
    (dots.current[r] ??= [])[c] = els ?? undefined;
  }, []);

  /* ---------------------------------------------------------- arrival */

  /* Arriving: the canvas draws, and the plain dots wait under it, hidden. */
  const [arriving, setArriving] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (play === 0 || fun.reduced) return;
    setArriving(true);
  }, [play, fun.reduced]);
  useEffect(() => {
    if (!arriving) return;
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || !probe.current) return setArriving(false);
    /* The tokens, resolved by the browser once: the empty dot and the four steps, in the current theme. */
    const colors = [EMPTY, ...HUE[hue]].map((cls) => {
      probe.current!.className = cls + " hidden";
      return getComputedStyle(probe.current!).backgroundColor;
    });
    /* Drawn at the size it shows, so the dots are crisp at any zoom of the canvas. */
    const shown = el.getBoundingClientRect().width / gridW;
    const scale = Math.max(1, devicePixelRatio * shown);
    el.width = Math.round(gridW * scale);
    el.height = Math.round(gridH * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const pop = spring({ keyframes: [0, 1], visualDuration: FUN.pop.visualDuration, bounce: FUN.pop.bounce });
    const at = (t: number) => (t <= 0 ? 0 : pop.next(t * 1000).value);
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const half = cell / 2;
    /* The last dot's data lands after its delay plus the spring's settle. */
    const lastData = 0.32 + 3 * 0.11 + (cols - 1) * FUN.wave * 0.5;
    const end = Math.max((levels.length + cols) * FUN.wave, lastData) + 1.2;
    let frame = 0;
    const began = performance.now();
    const draw = (now: number) => {
      const t = (now - began) / 1000;
      ctx.clearRect(0, 0, gridW, gridH);
      const lx = px.get();
      const ly = py.get();
      const ls = strength.get();
      levels.forEach((row, r) =>
        row.forEach((level, c) => {
          const a = at(t - (r + c) * FUN.wave); // the diagonal wave of the empty grid
          if (a <= 0) return;
          const data = 0.32 + (level - 1) * 0.11 + c * FUN.wave * 0.5; // then the data, quietest first, peaks last
          /* The lens, as the plain dots have it, so a pointer over the grid meets the same lens mid-arrival. */
          const dx = c - lx;
          const dy = r - ly;
          const d = Math.hypot(dx, dy);
          const f = ls > 0 ? Math.max(0, 1 - d / LENS_REACH) ** 2 * ls : 0;
          const push = d > 0.001 ? (LENS_PUSH * f) / d : 0;
          const cx = c * pitch + half + dx * push;
          const cy = r * pitch + half + dy * push;
          const size = a * (1 + LENS_SWELL * f);
          const alpha = clamp(a);
          const emptyAlpha = level === 0 ? 1 : 1 - clamp((t - data) / 0.2);
          if (emptyAlpha > 0) {
            ctx.globalAlpha = alpha * emptyAlpha;
            ctx.fillStyle = colors[0]!;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(0, half * size), 0, Math.PI * 2);
            ctx.fill();
          }
          if (level > 0) {
            const g = at(t - data);
            if (g > 0) {
              ctx.globalAlpha = alpha * clamp(g);
              ctx.fillStyle = colors[level]!;
              ctx.beginPath();
              ctx.arc(cx, cy, Math.max(0, half * size * (0.4 + 0.6 * g)), 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }),
      );
      ctx.globalAlpha = 1;
      if (t < end) frame = requestAnimationFrame(draw);
      else setArriving(false);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one arrival per `arriving`; the rest is read as it draws
  }, [arriving]);

  /* ---------------------------------------------------------- the lens */

  /* The pointer in dots, smoothed so the lens glides. Strength 0 is no lens, 1 is hover, more is a press. */
  const rawX = useMotionValue(-10);
  const rawY = useMotionValue(-10);
  const px = useSpring(rawX, LENS_GLIDE);
  const py = useSpring(rawY, LENS_GLIDE);
  const strength = useMotionValue(0);
  const lensed = useRef(new Set<HTMLSpanElement>());
  const frame = useRef(0);
  const paint = useCallback(() => {
    frame.current = 0;
    const x = px.get();
    const y = py.get();
    const s = strength.get();
    const touched = new Set<HTMLSpanElement>();
    if (s > 0.001) {
      const reach = Math.ceil(LENS_REACH);
      for (let r = Math.max(0, Math.floor(y) - reach); r <= Math.min(levels.length - 1, Math.ceil(y) + reach); r++) {
        for (let c = Math.max(0, Math.floor(x) - reach); c <= Math.min(cols - 1, Math.ceil(x) + reach); c++) {
          const el = dots.current[r]?.[c]?.lens;
          if (!el) continue;
          const dx = c - x;
          const dy = r - y;
          const d = Math.hypot(dx, dy);
          const f = Math.max(0, 1 - d / LENS_REACH) ** 2 * s;
          if (f < 0.002) continue;
          const push = d > 0.001 ? (LENS_PUSH * f) / d : 0;
          el.style.transform = `translate(${(dx * push).toFixed(2)}px, ${(dy * push).toFixed(2)}px) scale(${(1 + LENS_SWELL * f).toFixed(3)})`;
          touched.add(el);
        }
      }
    }
    /* The dots the lens just left go back to their own, untransformed markup. */
    lensed.current.forEach((el) => !touched.has(el) && (el.style.transform = ""));
    lensed.current = touched;
  }, [px, py, strength, levels.length, cols]);
  const schedule = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  }, [paint]);
  useMotionValueEvent(px, "change", schedule);
  useMotionValueEvent(py, "change", schedule);
  useMotionValueEvent(strength, "change", schedule);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const where = (e: PointerEvent<HTMLDivElement>) => {
    const r = box.current!.getBoundingClientRect();
    const k = gridW / r.width; // the canvas may be zoomed: read in the grid's own px
    return { x: ((e.clientX - r.left) * k + GAP / 2) / pitch, y: ((e.clientY - r.top) * k + GAP / 2) / pitch };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = where(e);
    if (strength.get() === 0) {
      /* A fresh entry: the lens starts where the pointer is, never sliding in from where it last left. */
      px.jump(p.x - 0.5);
      py.jump(p.y - 0.5);
    }
    rawX.set(p.x - 0.5);
    rawY.set(p.y - 0.5);
    if (!fun.reduced && strength.get() < 1 && !strength.isAnimating()) animate(strength, 1, FUN.follow);
    const c = Math.floor(p.x);
    const r = Math.floor(p.y);
    const inside = r >= 0 && r < rows.length && c >= 0 && c < cols;
    setActive((a) => (inside ? (a?.r === r && a.c === c ? a : { r, c }) : null));
  };
  const onLeave = () => {
    animate(strength, 0, fun.follow);
    setActive(null);
  };

  const name = (r: number, c: number) => `${rows[r]!.label}, ${columns[c]}`;
  const valueText = (v: number) => `${v.toLocaleString("en-GB")} ${v === 1 ? unit[0] : unit[1]}`;
  const sum = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="relative grid w-fit max-w-full grid-cols-[auto_minmax(0,max-content)_auto]" role="img" aria-label={`${label}, ${sum} in all`}>
      <div aria-hidden="true" className="pt-1 pr-4 font-mono text-caption font-normal whitespace-nowrap text-fg-subtle">
        <div className="flex flex-col" style={{ gap: GAP }}>
          {rows.map((row, r) => (
            <div key={r} className="flex items-center" style={{ height: cell }}>
              <span className="litt-trim">{row.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0 px-1 py-1">
        <div
          ref={box}
          aria-hidden="true"
          className="relative touch-pan-y select-none"
          style={{ width: gridW, height: gridH }}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onPointerDown={() => !fun.reduced && animate(strength, 1.35, FUN.pop)}
          onPointerUp={() => !fun.reduced && animate(strength, 1, FUN.pop)}
        >
          <div className="absolute inset-0" style={arriving ? { visibility: "hidden" } : undefined}>
            {levels.map((row, r) =>
              row.map((level, c) => (
                <Dot key={`${r}-${c}`} r={r} c={c} cell={cell} pitch={pitch} level={level} fill={HUE[hue]} ringed={active?.r === r && active.c === c} register={register} />
              )),
            )}
          </div>
          {arriving && <canvas ref={canvas} className="absolute inset-0" style={{ width: gridW, height: gridH }} />}
          <span ref={probe} className="hidden" />
          {active && (
            <Tip left={active.c * pitch + cell / 2} top={active.r * pitch} width={gridW}>
              <span className="text-fg-muted">{name(active.r, active.c)}</span>
              <span className="font-mono text-caption font-normal tabular-nums">{valueText(rows[active.r]!.values[active.c]!)}</span>
            </Tip>
          )}
        </div>
      </div>

      <Totals rows={rows} cell={cell} play={play} reduced={fun.reduced} />

      <div aria-hidden="true" className="col-start-2 col-end-3 mt-3 flex items-center gap-2 justify-self-end font-mono text-caption font-normal whitespace-nowrap text-fg-subtle">
        <span>Less</span>
        <span className="flex items-center" style={{ gap: GAP }}>
          {[EMPTY, ...HUE[hue]].map((f, i) => (
            <span key={i} className={"rounded-pill " + f} style={{ width: cell, height: cell }} />
          ))}
        </span>
        <span>More</span>
      </div>
    </div>
  );
}

/** The row totals, counting up as their rows fill. Their own component, so the count never re-renders the dots. */
function Totals({ rows, cell, play, reduced }: { rows: FunHeatmapRow[]; cell: number; play: number; reduced: boolean }) {
  const [counted, setCounted] = useState<number[]>(() => rows.map((r) => r.total));
  useEffect(() => {
    if (play === 0) return;
    if (reduced) return setCounted(rows.map((r) => r.total));
    const run = animate(0, 1, { ...FUN.draw, delay: 0.4, onUpdate: (t) => setCounted(rows.map((r) => Math.round(r.total * t))) }); // litt-allow: fun mode, the totals count with the fill
    return () => run.stop();
  }, [play, reduced, rows]);
  return (
    <div aria-hidden="true" className="pt-1 pl-4 text-right font-mono text-small whitespace-nowrap text-fg tabular-nums">
      <div className="flex flex-col" style={{ gap: GAP }}>
        {rows.map((_, r) => (
          <div key={r} className="flex items-center justify-end" style={{ height: cell }}>
            <span className="litt-trim">{counted[r]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type DotProps = {
  r: number;
  c: number;
  cell: number;
  pitch: number;
  level: number;
  fill: readonly [string, string, string, string];
  ringed: boolean;
  register: (r: number, c: number, els: DotEls | null) => void;
};

/** One dot, in plain markup: the Heatmap's own at rest. The lens transforms its outer span; the arrival, its inner ones. */
const Dot = memo(function Dot({ r, c, cell, pitch, level, fill, ringed, register }: DotProps) {
  const lens = useRef<HTMLSpanElement>(null);
  const arrive = useRef<HTMLSpanElement>(null);
  const empty = useRef<HTMLSpanElement>(null);
  const filled = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    register(r, c, { lens: lens.current!, arrive: arrive.current!, empty: empty.current!, fill: filled.current });
    return () => register(r, c, null);
  }, [r, c, register]);
  return (
    <span ref={lens} className="absolute" style={{ left: c * pitch, top: r * pitch, width: cell, height: cell }}>
      <span ref={arrive} className="absolute inset-0">
        {/* Under a filled dot the empty dot is hidden, so at rest a filled dot is its fill alone, as in the Heatmap. */}
        <span ref={empty} className={"absolute inset-0 rounded-pill " + EMPTY} style={level === 0 ? undefined : { visibility: "hidden" }} />
        {level > 0 && <span ref={filled} className={"absolute inset-0 rounded-pill " + fill[level - 1]} />}
        {ringed && <span className="absolute inset-0 rounded-pill outline-1 outline-offset-1 outline-fg" />}
      </span>
    </span>
  );
});

/** The Tooltip's look over the dot in use, kept inside the grid. */
function Tip({ left, top, width, children }: { left: number; top: number; width: number; children: ReactNode }) {
  const enter = useTransition("responsive");
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => setW(ref.current?.offsetWidth ?? 0), [children]);
  const x = Math.max(w / 2, Math.min(width - w / 2, left));
  return (
    <div aria-hidden="true" className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full" style={{ left: x, top: top - 8 }}>
      <motion.div
        ref={ref}
        className="flex origin-bottom items-center gap-3 rounded-control bg-surface-3 px-2 py-1.5 text-small whitespace-nowrap text-fg shadow-tooltip inset-shadow-highlight"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1, transition: enter }}
      >
        {children}
      </motion.div>
    </div>
  );
}
