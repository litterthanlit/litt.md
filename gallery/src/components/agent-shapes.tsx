/**
 * AgentShapes, a Flat part (skills/litt-md/taste/litt-principles.md, Flat; the Flat studies, Agent shapes): one
 * abstract shape that follows an agent's run, on a white paper with the step in words and how far along it is.
 *
 * - The paper: white on the grey ground (`litt-paper bg-surface-1 rounded-surface`, no outline and nothing cast). In
 *   it, the shape large, the step as one sentence (the one large thing in words, so no figure competes), and, when
 *   `step` and `steps` are given, how far along as short ink pills with "3 of 8" beside them.
 * - Eight shapes, one per phase, each its own idea of the work: thinking is a spark (rays stretching round an ink
 *   core), searching a graph (a signal running round six nodes), organizing a cube (two layers of blocks twisting),
 *   reasoning an orbit (three ellipses traced), planning a morph (a form turning from round to square), building a
 *   stack (blocks dropping into a cube), running a fold (four tiles parting and meeting), writing a thread (strands on
 *   a looping curve). Each is the soft grey (the ink at 55% on the paper) with its one bright part in the ink.
 * - Motion: one requestAnimationFrame loop per part writes attributes and transforms on the elements it already has
 *   (React never re-renders for a frame), and sweeps a band of ink across the sentence. It runs only while `paused`
 *   is false, the part is on screen and the tab is visible, which an app ties to its run; paused, it holds the frame
 *   it is on. Every shape starts 1.2s in, so a paused one looks mid-work. It is a status, so it never runs on its own:
 *   it runs while you say the work does (R4).
 * - A new phase: the shape grows in from 82% on the expressive spring (Flat's 0.28) and the sentence rises 4px into
 *   place on the responsive tier; the old shape is gone at once, so one thing moves at a time.
 * - Under reduced motion nothing moves: each shape holds its frame and the sentence stands in the ink.
 * - Semantics: role="status" named by the sentence, so a change is read once; the shape, the sentence and the pills
 *   are aria-hidden, and "3 of 8" is part of the name when there are steps.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useMotionDial, useTransition } from "@/motion";

export type AgentShapePhase = "thinking" | "searching" | "organizing" | "reasoning" | "planning" | "building" | "running" | "writing";

/** The phases in the order an agent usually passes through them. */
export const AGENT_SHAPE_PHASES: AgentShapePhase[] = ["thinking", "searching", "organizing", "reasoning", "planning", "building", "running", "writing"];

/** Each phase's own word, for a picker or a log. */
export const SHAPE_WORDS: Record<AgentShapePhase, string> = {
  thinking: "Thinking",
  searching: "Searching",
  organizing: "Organizing",
  reasoning: "Reasoning",
  planning: "Planning",
  building: "Building",
  running: "Running",
  writing: "Writing",
};

/** Each phase's sentence, used when `label` is left out. */
export const SHAPE_LINES: Record<AgentShapePhase, string> = {
  thinking: "Thinking it through",
  searching: "Searching your sources",
  organizing: "Organizing the results",
  reasoning: "Weighing the approaches",
  planning: "Planning the changes",
  building: "Building the project",
  running: "Running the tests",
  writing: "Drafting the answer",
};

export type AgentShapesProps = {
  /** What the agent is doing, which picks the shape. */
  phase: AgentShapePhase;
  /** The step in one sentence ("Searching 12 sources"), in place of the phase's own. It names the status too. */
  label?: string;
  /** Which step the run is on, from 1. With `steps`, it draws how far along it is. */
  step?: number;
  /** How many steps the run has. */
  steps?: number;
  /** Holds the frame it is on. Tie it to your run, so it moves only while the work does. */
  paused?: boolean;
  /** md fits a card or a sidebar (a 76px shape); lg stands alone (a 120px shape and the sentence at the figure size). */
  size?: "md" | "lg";
  className?: string;
};

/* ----------------------------------------------------------------- time and easing */

/** How far into its run a shape starts, in seconds, so it never paints at rest. */
const AHEAD = 1.2;

/** A CSS cubic-bezier, solved for x by Newton's method then bisection. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, t: number) => ((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t * t + 3 * a * t;
  const slope = (a: number, b: number, t: number) => 3 * (1 - 3 * b + 3 * a) * t * t + 2 * (3 * b - 6 * a) * t + 3 * a;
  return (x: number) => {
    if (x <= 0 || x >= 1) return x;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = slope(x1, x2, t);
      if (Math.abs(d) < 1e-6) break;
      t -= (at(x1, x2, t) - x) / d;
    }
    if (t < 0 || t > 1 || Math.abs(at(x1, x2, t) - x) > 1e-4) {
      let lo = 0;
      let hi = 1;
      t = x;
      for (let i = 0; i < 24; i++) {
        if (at(x1, x2, t) < x) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
    }
    return at(y1, y2, t);
  };
}
const EASE_IO = bezier(0.77, 0, 0.175, 1);
const LINEAR = (x: number) => x;

/** Where a looping animation of `ms` is at time `t` (seconds), shifted on by `shift` of a loop, from 0 to 1. */
const cycle = (t: number, ms: number, shift = 0) => ((((t * 1000) / ms + shift) % 1) + 1) % 1;

/** Keyframes: stops of [at, ...values], eased within each interval as CSS does. */
function keys(p: number, stops: number[][], ease = EASE_IO): number[] {
  let i = 0;
  while (i < stops.length - 2 && p > stops[i + 1][0]) i++;
  const [a, ...from] = stops[i];
  const [b, ...to] = stops[i + 1];
  const k = b === a ? 1 : ease(Math.min(1, Math.max(0, (p - a) / (b - a))));
  return from.map((v, j) => v + (to[j] - v) * k);
}

/* ----------------------------------------------------------------- the shapes */

const NS = "http://www.w3.org/2000/svg";
/** Draws the shape at a time in seconds. */
type Draw = (t: number) => void;
type Build = (host: HTMLElement, size: number) => Draw;

const HI = "var(--fg)";
const LO = "color-mix(in oklab, var(--fg) 55%, var(--surface-1))";
const LINE = "color-mix(in oklab, var(--fg) 15%, var(--surface-1))";

function svgIn(host: HTMLElement): SVGSVGElement {
  const svg = document.createElementNS(NS, "svg") as SVGSVGElement;
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("fill", "none");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("class", "size-full overflow-visible");
  host.replaceChildren(svg);
  return svg;
}
function el(parent: Element, tag: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(NS, tag) as SVGElement;
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  parent.appendChild(e);
  return e;
}
const set = (e: Element, name: string, value: string) => {
  if (e.getAttribute(name) !== value) e.setAttribute(name, value);
};

/** A path drawn in the soft line, and a dash of it that runs round. */
const trace = (svg: Element, d: string, width: number, color: string, extra: Record<string, string | number> = {}) =>
  el(svg, "path", { d, pathLength: 1, stroke: color, "stroke-width": width, "stroke-linecap": "round", "stroke-linejoin": "round", ...extra });

const ELLIPSE = "M3 16a13 5 0 1 0 26 0a13 5 0 1 0 -26 0";
const NODES = [
  [6, 7],
  [18, 4],
  [28, 12],
  [23, 26],
  [9, 27],
  [4, 17],
];
const LOOP = `M${NODES.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
const NODE_AT = (() => {
  const edges = NODES.map(([x, y], i) => {
    const [nx, ny] = NODES[(i + 1) % NODES.length];
    return Math.hypot(nx - x, ny - y);
  });
  const total = edges.reduce((s, d) => s + d, 0);
  return NODES.map((_, i) => edges.slice(0, i).reduce((s, d) => s + d, 0) / total);
})();
const CURVE = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    pts.push(`${(16 + 12.5 * Math.cos(3 * t)).toFixed(2)} ${(16 + 10 * Math.sin(2 * t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
})();

/* Cubes: real CSS 3D, isometric, each face mixed from its colour by how much light it takes. */
const ISOMETRIC = "rotateX(-35.26deg) rotateY(45deg)";
const FACES = [
  { turn: "rotateX(90deg)", ink: 100 },
  { turn: "rotateY(0deg)", ink: 62 },
  { turn: "rotateY(180deg)", ink: 62 },
  { turn: "rotateY(90deg)", ink: 38 },
  { turn: "rotateY(-90deg)", ink: 38 },
];
const BLOCKS = (half: number) => [1, -1].flatMap((y) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => [x * half, y * half, z * half]));
function span(parent: HTMLElement, style: string): HTMLElement {
  const s = document.createElement("span");
  s.setAttribute("style", "position:absolute;top:0;left:0;transform-style:preserve-3d;" + style);
  parent.appendChild(s);
  return s;
}
function cubelet(parent: HTMLElement, at: number[], edge: number, hi: boolean): HTMLElement {
  const place = span(parent, `transform:translate3d(${at[0]}px,${at[1]}px,${at[2]}px)`);
  const body = span(place, "");
  for (const { turn, ink } of FACES) {
    const amount = hi ? ink : ink * 0.55;
    span(
      body,
      `width:${edge}px;height:${edge}px;left:${-edge / 2}px;top:${-edge / 2}px;transform:${turn} translateZ(${edge / 2}px);` +
        `background:color-mix(in oklab, var(--fg) ${amount.toFixed(1)}%, var(--surface-1))`,
    );
  }
  return body;
}
function scene(host: HTMLElement): HTMLElement {
  host.replaceChildren();
  const stage = document.createElement("span");
  stage.setAttribute("style", "position:absolute;inset:0;display:grid;place-items:center");
  host.appendChild(stage);
  const iso = document.createElement("span");
  iso.setAttribute("style", `position:relative;transform-style:preserve-3d;transform:${ISOMETRIC}`);
  stage.appendChild(iso);
  return iso;
}
const metrics = (size: number) => {
  const edge = size * 0.26;
  return { edge, half: (edge + size * 0.03) / 2 };
};

const SHAPES: Record<AgentShapePhase, Build> = {
  // A spark: eight rays stretching in turn round an ink core, the whole turning slowly.
  thinking(host) {
    const svg = svgIn(host);
    const spin = el(svg, "g", {});
    const rays = Array.from({ length: 8 }, (_, i) => {
      const arm = el(spin, "g", { transform: `rotate(${i * 45} 16 16)` });
      return el(arm, "line", { x1: 16, x2: 16, y1: 11.5, y2: 0.6, stroke: LO, "stroke-width": 2.9, "stroke-linecap": "round" });
    });
    el(svg, "circle", { cx: 16, cy: 16, r: 3.5, fill: HI });
    return (t) => {
      set(spin, "transform", `rotate(${(cycle(t, 9000) * 360).toFixed(2)} 16 16)`);
      rays.forEach((ray, i) => {
        const [s, o] = keys(cycle(t, 1600, i / 8), [
          [0, 0.3, 0.3],
          [0.5, 1, 1],
          [1, 0.3, 0.3],
        ]);
        set(ray, "y2", (11.5 - 10.9 * s).toFixed(2));
        set(ray, "opacity", o.toFixed(3));
      });
    };
  },
  // A graph: a signal runs round six nodes, and each node lights as it passes.
  searching(host) {
    const svg = svgIn(host);
    el(svg, "path", { d: LOOP, stroke: LINE, "stroke-width": 1, "stroke-linejoin": "round" });
    for (const [a, b] of [
      [1, 4],
      [2, 5],
    ])
      el(svg, "line", { x1: NODES[a][0], y1: NODES[a][1], x2: NODES[b][0], y2: NODES[b][1], stroke: LINE, "stroke-width": 1 });
    const signal = trace(svg, LOOP, 1.75, HI, { "stroke-dasharray": "0.16 0.84" });
    const nodes = NODES.map(([x, y]) => el(svg, "circle", { cx: x, cy: y, r: 2.6, fill: LO }));
    return (t) => {
      set(signal, "stroke-dashoffset", (-cycle(t, 2400)).toFixed(4));
      nodes.forEach((n, i) => {
        const [s, o] = keys(cycle(t, 2400, 0.5 - NODE_AT[i] + 0.16), [
          [0, 0.7, 0.2],
          [0.5, 1, 1],
          [1, 0.7, 0.2],
        ]);
        set(n, "r", (2.6 * s).toFixed(3));
        set(n, "opacity", o.toFixed(3));
      });
    };
  },
  // A cube of eight blocks in two layers, twisting a quarter turn at a time, one against the other.
  organizing(host, size) {
    const iso = scene(host);
    const { edge, half } = metrics(size);
    const blocks = BLOCKS(half);
    const layers = [blocks.slice(0, 4), blocks.slice(4)].map((layer, i) => {
      const twist = span(iso, "");
      layer.forEach((at, j) => cubelet(twist, at, edge, i === 1 && j === 3));
      return twist;
    });
    const TWIST = [
      [0, 0],
      [0.125, 0],
      [0.25, 90],
      [0.375, 90],
      [0.5, 180],
      [0.625, 180],
      [0.75, 270],
      [0.875, 270],
      [1, 360],
    ];
    return (t) => {
      const p = cycle(t, 4800);
      layers.forEach((layer, i) => {
        const [deg] = keys(i === 0 ? 1 - p : p, TWIST);
        layer.style.transform = `rotateY(${deg.toFixed(2)}deg)`;
      });
    };
  },
  // An orbit: three ellipses round a pulsing centre, each traced at its own pace.
  reasoning(host) {
    const svg = svgIn(host);
    const rings = [1800, 2400, 3000].map((ms, i) => {
      const g = el(svg, "g", { transform: `rotate(${i * 60} 16 16)` });
      el(g, "path", { d: ELLIPSE, stroke: LINE, "stroke-width": 1 });
      return { ms, i, dash: trace(g, ELLIPSE, 1.75, i === 0 ? HI : LO, { "stroke-dasharray": "0.12 0.88" }) };
    });
    const core = el(svg, "circle", { cx: 16, cy: 16, r: 3, fill: LO });
    return (t) => {
      for (const { ms, i, dash } of rings) set(dash, "stroke-dashoffset", (-cycle(t, ms, i / 3)).toFixed(4));
      const [s, o] = keys(cycle(t, 1400), [
        [0, 0.7, 0.2],
        [0.5, 1, 1],
        [1, 0.7, 0.2],
      ]);
      set(core, "r", (3 * s).toFixed(3));
      set(core, "opacity", o.toFixed(3));
    };
  },
  // A morph: a soft form and its ink outline turning from round to square and back, a beat apart.
  planning(host) {
    const svg = svgIn(host);
    const ghost = el(svg, "rect", { x: 4.5, y: 4.5, width: 23, height: 23, stroke: HI, "stroke-width": 0.9 });
    const form = el(svg, "rect", { x: 7.7, y: 7.7, width: 16.6, height: 16.6, fill: LO });
    const MORPH = [
      [0, 0.5, 0, 1],
      [0.25, 0.28, 90, 0.9],
      [0.5, 0.06, 225, 0.78],
      [0.75, 0.28, 315, 0.92],
      [1, 0.5, 360, 1],
    ];
    const pose = (rect: SVGElement, w: number, p: number) => {
      const [round, deg, s] = keys(p, MORPH);
      set(rect, "rx", (round * w).toFixed(3));
      set(rect, "transform", `rotate(${deg.toFixed(2)} 16 16) translate(16 16) scale(${s.toFixed(4)}) translate(-16 -16)`);
    };
    return (t) => {
      pose(ghost, 23, cycle(t, 3200, 0.9));
      pose(form, 16.6, cycle(t, 3200));
    };
  },
  // A stack: blocks drop one by one into a cube, hold, and lift away again.
  building(host, size) {
    const iso = scene(host);
    const { edge, half } = metrics(size);
    const lift = edge * 2.2;
    const blocks = BLOCKS(half).map((at, i) => cubelet(iso, at, edge, i === 7));
    return (t) => {
      const [built] = keys(
        cycle(t, 4400),
        [
          [0, 0],
          [0.55, 1],
          [0.82, 1],
          [1, 0],
        ],
        LINEAR,
      );
      blocks.forEach((b, i) => {
        const away = Math.min(1, Math.max(0, ((i + 2) / 9 - built) / (2 / 9)));
        b.style.transform = `translateY(${(-away * lift).toFixed(2)}px)`;
        b.style.opacity = (1 - away).toFixed(3);
      });
    };
  },
  // A fold: four tiles part to the corners, small and faint, and meet again, one after another.
  running(host) {
    const svg = svgIn(host);
    const tile = 8.45;
    const at = [6.4, 6.4 + tile + 2.3];
    const TILES = [
      { x: at[0], y: at[0], fx: -1, fy: -1, turn: 0 },
      { x: at[1], y: at[0], fx: 1, fy: -1, turn: 1 },
      { x: at[0], y: at[1], fx: -1, fy: 1, turn: 3 },
      { x: at[1], y: at[1], fx: 1, fy: 1, turn: 2 },
    ];
    const rects = TILES.map((d, i) => ({ d, r: el(svg, "rect", { x: d.x, y: d.y, width: tile, height: tile, rx: 1.86, fill: i === 3 ? HI : LO }) }));
    const ASSEMBLE = [
      [0, 0, 1, 1],
      [0.25, 0, 1, 1],
      [0.55, 1, 0.6, 0.35],
      [0.65, 1, 0.6, 0.35],
      [1, 0, 1, 1],
    ];
    return (t) => {
      for (const { d, r } of rects) {
        const [out, s, o] = keys(cycle(t, 2000, (((d.turn / 4) % 1) + 1) % 1), ASSEMBLE);
        const cx = d.x + tile / 2 + d.fx * 0.45 * tile * out;
        const cy = d.y + tile / 2 + d.fy * 0.45 * tile * out;
        set(r, "transform", `translate(${cx.toFixed(3)} ${cy.toFixed(3)}) scale(${s.toFixed(4)}) translate(${(-d.x - tile / 2).toFixed(3)} ${(-d.y - tile / 2).toFixed(3)})`);
        set(r, "opacity", o.toFixed(3));
      }
    };
  },
  // A thread: three strands of falling length running round a looping curve, the shortest in the ink.
  writing(host) {
    const svg = svgIn(host);
    el(svg, "path", { d: CURVE, stroke: LINE, "stroke-width": 1 });
    const strands = [
      { length: 0.26, opacity: 0.2 },
      { length: 0.14, opacity: 0.5 },
      { length: 0.05, opacity: 1 },
    ].map(({ length, opacity }, i) => ({
      length,
      e: trace(svg, CURVE, 1.75, i === 2 ? HI : LO, { "stroke-dasharray": `${length} ${1 - length}`, opacity }),
    }));
    return (t) => {
      for (const { length, e } of strands) set(e, "stroke-dashoffset", (-cycle(t, 3200, 0.26 - length)).toFixed(4));
    };
  },
};

/* ----------------------------------------------------------------- AgentShapes */

const GLYPH = { md: 76, lg: 120 } as const;

/** One abstract shape following an agent's run, with the step in words and how far along it is. A Flat part. */
export function AgentShapes({ phase, label, step, steps, paused = false, size = "md", className = "" }: AgentShapesProps) {
  const { reduced } = useMotionDial();
  const arrive = useTransition("expressive");
  const settle = useTransition("responsive");
  const root = useRef<HTMLDivElement>(null);
  const glyph = useRef<HTMLSpanElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const draw = useRef<Draw | null>(null);
  const clock = useRef(AHEAD);
  const seen = useRef(false);
  const [visible, setVisible] = useState(true);
  const running = !paused && !reduced && visible;
  const sentence = label ?? SHAPE_LINES[phase];
  const counted = step !== undefined && steps !== undefined && steps > 0;
  const said = counted ? `${sentence}, step ${step} of ${steps}` : sentence;
  const px = GLYPH[size];

  /* Builds the phase's shape and draws its first frame, already mid-work, before it paints. */
  useLayoutEffect(() => {
    const host = glyph.current;
    if (!host) return;
    const d = SHAPES[phase](host, px);
    d(clock.current);
    draw.current = d;
    return () => {
      draw.current = null;
    };
  }, [phase, px]);

  /* Off screen or in a hidden tab, it stops. */
  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    let onScreen = true;
    const update = () => setVisible(onScreen && document.visibilityState !== "hidden");
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      update();
    });
    io.observe(node);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  /* One loop: the shape, and a band of ink across the sentence. */
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      clock.current += Math.min(0.1, (now - last) / 1000);
      last = now;
      draw.current?.(clock.current);
      if (line.current) line.current.style.backgroundPosition = `${(100 - cycle(clock.current, 2000) * 200).toFixed(2)}% 0`;
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [running]);

  /* The first phase is there at once; every later one arrives. */
  const fresh = seen.current && !reduced;
  useEffect(() => {
    seen.current = true;
  }, []);

  const lg = size === "lg";
  return (
    <div
      ref={root}
      role="status"
      aria-label={said}
      className={
        "litt-paper grid w-full min-w-0 justify-items-center rounded-surface bg-surface-1 text-fg select-none forced-colors:border " +
        (lg ? "max-w-lg gap-4 px-6 pt-8 pb-6 sm:px-8 sm:pt-9" : "max-w-xs gap-3.5 px-5 pt-5 pb-4.5") +
        " " +
        className
      }
    >
      <motion.span
        key={phase}
        ref={glyph}
        aria-hidden="true"
        initial={fresh ? { scale: 0.82, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={arrive}
        className="relative block shrink-0 forced-colors:[forced-color-adjust:none]"
        style={{ width: px, height: px }}
      />
      <motion.span
        key={sentence}
        ref={line}
        aria-hidden="true"
        initial={fresh ? { y: 4, opacity: 0 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={settle}
        className={
          "block max-w-full truncate " +
          (lg ? "text-figure" : "text-body font-label") +
          (reduced
            ? " text-fg"
            : " bg-[linear-gradient(90deg,var(--fg-muted)_0%,var(--fg-muted)_40%,var(--fg)_50%,var(--fg-muted)_60%,var(--fg-muted)_100%)] bg-size-[200%_100%] bg-clip-text text-transparent [background-position:100%_0] forced-colors:bg-none forced-colors:text-[CanvasText]")
        }
      >
        {sentence}
      </motion.span>
      {counted && (
        <span aria-hidden="true" className={"grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 " + (lg ? "max-w-xs" : "")}>
          <span className="grid gap-1" style={{ gridTemplateColumns: `repeat(${steps}, minmax(0, 1fr))` }}>
            {Array.from({ length: steps }, (_, i) => (
              <span key={i} className="h-1.5 overflow-hidden rounded-pill bg-block forced-colors:border">
                <span
                  className={
                    "block h-full origin-left rounded-pill bg-fg transition-transform duration-(--dur-responsive) ease-responsive forced-colors:bg-[CanvasText] " +
                    (i < step ? "scale-x-100" : "scale-x-0")
                  }
                />
              </span>
            ))}
          </span>
          <span className="text-small whitespace-nowrap text-fg-muted tabular-nums">
            {step} of {steps}
          </span>
        </span>
      )}
    </div>
  );
}
