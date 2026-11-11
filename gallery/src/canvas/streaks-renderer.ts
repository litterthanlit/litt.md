/**
 * One WebGL context for every long exposure on the page. A browser allows about sixteen contexts, and the canvas shows
 * more pictures than that, so no field owns one. The renderer keeps one GL canvas, never attached to the page, and
 * one render loop. Each field is an ordinary 2D canvas: the renderer draws the field into the GL canvas's corner
 * (through the viewport, so the GL canvas only grows) and copies that corner across with drawImage.
 *
 * - One program, compiled on first use and kept.
 * - The loop runs only while some field streams or settles. A field streams while it is on screen, not paused, and
 *   motion is allowed. Under reduced motion a field is drawn once, and again when its palette or strength changes.
 *   Paused, it holds its frame.
 * - A field's size follows its box on screen, which follows the language canvas's zoom, capped at its layout box
 *   times 1.5 and a density of 1.5. A transform fires no ResizeObserver, so the loop re-checks, and a slow poll does
 *   while nothing streams.
 * - Without WebGL, or once the context is lost, a field draws nothing and its host's still gradient shows. A
 *   restored context recompiles on the next frame.
 */
import { FRAGMENT, VERTEX } from "./streaks-shaders";

const SWEEP = 0.6; // seconds for a new palette to come in
const RATE = 0.35; // field time per second of real time, at rest
const QUICKEN = 1.1; // added to the rate under a hand
const DENSITY = 1.5; // the most pixels a field draws per CSS pixel
const POLL = 500; // ms between size checks while nothing streams

type Settings = {
  /** Fifteen floats: the five stops as 0–1 RGB, dark to light. */
  stops: number[];
  seed: number;
  /** 0 draws the field as designed for Gradient Keys; 1 gives it more presence. */
  strength: number;
  paused: boolean;
  reduced: boolean;
};

type Field = Settings & {
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  from: number[];
  to: number[];
  mix: number;
  time: number;
  hover: number;
  hoverTarget: number;
  mouse: [number, number];
  ripple: [number, number, number];
  visible: boolean;
  dirty: boolean;
  running: boolean;
  observer: IntersectionObserver;
};

type Program = { program: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

const UNIFORMS = ["uRes", "uTime", "uMouse", "uHover", "uRipple", "uSeed", "uFrom", "uTo", "uMix", "uStrength"];

const fields = new Set<Field>();
let glCanvas: HTMLCanvasElement | null = null;
let gl: WebGLRenderingContext | null = null;
let failed = false; // no WebGL here: every field keeps its gradient
let lost = false;
let made: Program | null | undefined; // undefined until compiled; null if it would not
let raf = 0;
let last = 0;
let poll = 0;

/** Where a sweep stands, as one palette: mixed in linear light, as the shader mixes. */
function blend(from: number[], to: number[], m: number) {
  return from.map((c, i) => Math.pow(Math.pow(c, 2.2) * (1 - m) + Math.pow(to[i] ?? c, 2.2) * m, 1 / 2.2));
}
const smooth = (x: number) => x * x * (3 - 2 * x);

function context() {
  if (failed) return null;
  if (gl) return lost ? null : gl;
  glCanvas = document.createElement("canvas");
  gl = glCanvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl) {
    failed = true;
    return null;
  }
  glCanvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    for (const f of fields) f.ctx?.clearRect(0, 0, f.canvas.width, f.canvas.height);
  });
  glCanvas.addEventListener("webglcontextrestored", () => {
    lost = false;
    made = undefined;
    setup(gl!);
    for (const f of fields) f.dirty = true;
    wake();
  });
  setup(gl);
  return gl;
}

/** The one triangle that covers the viewport, bound once for every program (aPos is attribute 0 in each). */
function setup(g: WebGLRenderingContext) {
  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
  g.enableVertexAttribArray(0);
  g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
}

function program(g: WebGLRenderingContext) {
  if (made !== undefined) return made;
  const p = g.createProgram()!;
  for (const [type, source] of [[g.VERTEX_SHADER, VERTEX], [g.FRAGMENT_SHADER, FRAGMENT]] as const) {
    const shader = g.createShader(type)!;
    g.shaderSource(shader, source);
    g.compileShader(shader);
    g.attachShader(p, shader);
  }
  g.bindAttribLocation(p, 0, "aPos");
  g.linkProgram(p);
  made = null;
  if (g.getProgramParameter(p, g.LINK_STATUS)) {
    made = { program: p, u: Object.fromEntries(UNIFORMS.map((name) => [name, g.getUniformLocation(p, name)])) };
  } else if (!g.isContextLost()) {
    console.warn("streaks: the long exposure did not compile", g.getProgramInfoLog(p));
  }
  return made;
}

/** Draws a field into the GL canvas's bottom-left corner, then copies that corner into the field's own canvas. */
function render(f: Field) {
  const g = context();
  if (!g || !f.ctx) return;
  const prog = program(g);
  if (!prog) return;
  const { u } = prog;
  const { width, height } = f.canvas;
  const c = glCanvas!;
  if (c.width < width || c.height < height) {
    c.width = Math.max(c.width, width);
    c.height = Math.max(c.height, height);
  }
  g.viewport(0, 0, width, height);
  g.useProgram(prog.program);
  g.uniform2f(u.uRes!, width, height);
  g.uniform1f(u.uTime!, f.time);
  g.uniform2fv(u.uMouse!, f.mouse);
  g.uniform1f(u.uHover!, f.hover);
  g.uniform3fv(u.uRipple!, f.ripple);
  g.uniform1f(u.uSeed!, f.seed);
  g.uniform3fv(u.uFrom!, f.from);
  g.uniform3fv(u.uTo!, f.to);
  g.uniform1f(u.uMix!, f.mix);
  g.uniform1f(u.uStrength!, f.strength);
  g.drawArrays(g.TRIANGLES, 0, 3);
  // The corner the viewport drew, in the GL canvas's own top-down coordinates.
  f.ctx.drawImage(c, 0, c.height - height, width, height, 0, 0, width, height);
}

/** Sizes each visible field from its box on screen. Reads every box first, then writes. */
function measure() {
  const density = Math.min(devicePixelRatio || 1, DENSITY);
  const sizes: [Field, number, number][] = [];
  for (const f of fields) {
    if (!f.visible) continue;
    const box = f.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(Math.min(box.width * density, f.canvas.clientWidth * DENSITY)));
    const h = Math.max(1, Math.round(Math.min(box.height * density, f.canvas.clientHeight * DENSITY)));
    sizes.push([f, w, h]);
  }
  let changed = false;
  for (const [f, w, h] of sizes) {
    if (f.canvas.width === w && f.canvas.height === h) continue;
    // The light follows the new size: a field not under a hand keeps it in the middle.
    if (!f.hoverTarget) f.mouse = [w / 2, h / 2];
    f.canvas.width = w;
    f.canvas.height = h;
    f.dirty = true;
    changed = true;
  }
  return changed;
}

function setRunning(f: Field, running: boolean) {
  if (f.running === running) return;
  f.running = running;
  if (running) f.host.setAttribute("data-running", "");
  else f.host.removeAttribute("data-running");
}

function frame(now: number) {
  raf = 0;
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
  last = now;
  measure();
  let again = false;
  for (const f of fields) {
    const streams = f.visible && !f.paused && !f.reduced;
    setRunning(f, streams);
    if (!f.visible) continue;
    let moving = streams;
    if (!f.reduced) {
      const target = f.hoverTarget;
      // Exponential ease toward the target: fast in, slightly slower out.
      f.hover += (target - f.hover) * (1 - Math.exp(-dt * (target > f.hover ? 10 : 5)));
      if (Math.abs(target - f.hover) < 0.002) f.hover = target;
      else moving = true;
      if (streams) f.time += dt * (RATE + f.hover * QUICKEN);
      if (f.ripple[2] >= 0) {
        f.ripple[2] += dt;
        if (f.ripple[2] > 1.6) f.ripple[2] = -1;
        moving = true;
      }
      if (f.mix < 1) {
        f.mix = Math.min(1, f.mix + dt / SWEEP);
        moving = true;
      }
    }
    if (moving || f.dirty) {
      render(f);
      f.dirty = false;
    }
    if (moving) again = true;
  }
  if (again) raf = requestAnimationFrame(frame);
  else last = 0;
}

function wake() {
  if (!raf && fields.size) raf = requestAnimationFrame(frame);
}

/** While nothing streams, a zoom still needs a sharper (or cheaper) picture. */
function tick() {
  if (!raf && measure()) wake();
}

export type FieldHandle = {
  update(next: Partial<Settings>): void;
  /** Where the hand is, in CSS pixels from the canvas's top left; null when it leaves. */
  hand(point: [number, number] | null): void;
  press(point: [number, number]): void;
  detach(): void;
};

export function attach(host: HTMLElement, canvas: HTMLCanvasElement, settings: Settings): FieldHandle {
  const f: Field = {
    ...settings,
    host,
    canvas,
    ctx: canvas.getContext("2d"),
    from: settings.stops,
    to: settings.stops,
    mix: 1,
    time: 0,
    hover: 0,
    hoverTarget: 0,
    mouse: [canvas.width / 2, canvas.height / 2],
    ripple: [0, 0, -1],
    visible: false,
    dirty: true,
    running: false,
    observer: new IntersectionObserver(([entry]) => {
      f.visible = Boolean(entry?.isIntersecting);
      if (f.visible) f.dirty = true;
      wake();
    }),
  };
  fields.add(f);
  f.observer.observe(canvas);
  if (!poll) poll = window.setInterval(tick, POLL);

  /** From CSS pixels on screen to the canvas's pixels, bottom up as GL counts them. */
  const toLocal = ([x, y]: [number, number]): [number, number] => {
    const box = canvas.getBoundingClientRect();
    return [(x / box.width) * canvas.width, (1 - y / box.height) * canvas.height];
  };

  return {
    update(next) {
      if (next.stops && next.stops.join() !== f.to.join()) {
        // A new palette sweeps in from wherever the last change had got to.
        f.from = blend(f.from, f.to, smooth(f.mix));
        f.to = next.stops;
        f.mix = f.reduced || next.reduced ? 1 : 0;
      }
      if (next.seed !== undefined) f.seed = next.seed;
      if (next.strength !== undefined) f.strength = next.strength;
      if (next.paused !== undefined) f.paused = next.paused;
      if (next.reduced !== undefined) f.reduced = next.reduced;
      if (f.reduced) {
        f.mix = 1;
        f.hover = f.hoverTarget;
        f.ripple[2] = -1;
      }
      f.dirty = true;
      wake();
    },
    hand(point) {
      if (point) f.mouse = toLocal(point);
      f.hoverTarget = point ? 1 : 0;
      if (f.reduced) f.hover = f.hoverTarget;
      f.dirty = true;
      wake();
    },
    press(point) {
      if (f.reduced) return;
      f.ripple = [...toLocal(point), 0];
      wake();
    },
    detach() {
      f.observer.disconnect();
      fields.delete(f);
      if (!fields.size) {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
        window.clearInterval(poll);
        poll = 0;
      }
    },
  };
}
