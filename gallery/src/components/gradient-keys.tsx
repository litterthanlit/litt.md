/**
 * GradientKeys, a Flat part (the Flat studies, Gradient keys): a cover picker. One cover on white paper, a long
 * exposure drawn live; the cover's name under it as the one large figure, its line in the muted ink, and a swatch
 * circle per cover to pick from, the chosen one standing larger with a tick.
 *
 * - The covers are content, as images are: each is a name, a line and five colour stops, dark to light, that the
 *   host passes in. The part draws them; it holds no palette of its own.
 * - The picture: a WebGL field of streaks fanned from below left, flowing along and turning across (the Flat studies'
 *   long exposure), on its own canvas at a 2:1 cover. Without WebGL it is a still gradient of the same stops.
 * - Motion: nothing moves on its own (R4). At rest the field holds one frame. Under a hand it streams, quickening
 *   where the pointer is; a press rings out from the press. A new cover runs out along the streaks over 600ms from the
 *   edge nearest the swatch that chose it, and the name rises 6px into place on the responsive tier. The chosen
 *   swatch grows on Flat's expressive spring. Under reduced motion the field is drawn once per cover and nothing rings.
 * - Keys: the swatches are a radio group named Cover. Arrows move and pick, Home and End go to the ends.
 * - Semantics: the picture is an image named by the cover ("Cover: Wakatake, young bamboo"), each swatch a radio named
 *   by its cover, and a pick is said once in a polite status.
 */
import { motion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useMotionDial, useTransition } from "@/motion";

/** Five colour stops, dark to light: any CSS colour the browser reads, as content. */
export type CoverStops = readonly [string, string, string, string, string];

export type GradientCover = {
  id: string;
  name: string;
  /** What it is, in a few words ("Young bamboo, through the leaves"). */
  line?: string;
  stops: CoverStops;
  /** Picks the exposure: the same seed always opens on the same frame. */
  seed?: number;
};

export type GradientKeysProps = {
  covers: GradientCover[];
  /** The chosen cover's id, when you control it. Pair it with onValueChange. */
  value?: string;
  /** The cover chosen first, when you leave it alone. Default the first. */
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** The radio group's name. */
  label?: string;
  className?: string;
};

/* ---------------------------------------------------------------- the field */

const VERTEX = "attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }";
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uHover; uniform vec3 uRipple;
uniform float uSeed; uniform vec3 uFrom[5]; uniform vec3 uTo[5]; uniform float uMix;
const float ZOOM = 1.35;
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v / 0.875; }
vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
vec3 srgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
vec3 stop0(float m) { return mix(lin(uFrom[0]), lin(uTo[0]), m); }
vec3 stop1(float m) { return mix(lin(uFrom[1]), lin(uTo[1]), m); }
vec3 stop2(float m) { return mix(lin(uFrom[2]), lin(uTo[2]), m); }
vec3 stop3(float m) { return mix(lin(uFrom[3]), lin(uTo[3]), m); }
vec3 stop4(float m) { return mix(lin(uFrom[4]), lin(uTo[4]), m); }
vec3 ramp(float v, float m) { float x = clamp(v, 0.0, 0.999) * 4.0; float f = smoothstep(0.0, 1.0, fract(x));
  if (x < 1.0) return mix(stop0(m), stop1(m), f); if (x < 2.0) return mix(stop1(m), stop2(m), f);
  if (x < 3.0) return mix(stop2(m), stop3(m), f); return mix(stop3(m), stop4(m), f); }
void main() {
  vec2 px = gl_FragCoord.xy; float unit = ZOOM / min(uRes.x, uRes.y); vec2 p = (px - 0.5 * uRes) * unit; float t = uTime;
  float band = 0.0;
  if (uRipple.z >= 0.0) { vec2 dir = p - (uRipple.xy - 0.5 * uRes) * unit; float rad = uRipple.z * 1.4 * ZOOM;
    band = exp(-pow((length(dir) - rad) / (0.07 * ZOOM), 2.0)) * exp(-uRipple.z * 2.2); p += normalize(dir + 1e-4) * band * 0.09 * ZOOM; }
  vec2 d = p - vec2(-2.6, -1.4); float r = length(d); float a = atan(d.y, d.x) + t * 0.05;
  vec2 q = vec2(a * 8.0, r * 0.32 - t * 0.18);
  q.x += (fbm(vec2(a * 2.0, r * 0.35 - t * 0.1) + uSeed) - 0.5) * 1.4;
  float streak = fbm(q + uSeed * 3.1);
  float fine = fbm(vec2(a * 34.0, r * 0.5 - t * 0.29) + uSeed * 5.3);
  float mass = fbm(p * 0.55 + vec2(t * 0.08, -t * 0.05) + uSeed * 7.0);
  float glint = smoothstep(0.68, 0.86, fbm(vec2(a * 70.0, r * 0.4 - t * 0.25) + uSeed * 9.7));
  float v = streak * 0.85 + fine * 0.25 + (mass - 0.5) * 0.85 - 0.04;
  v = smoothstep(0.08, 0.92, v) + glint * 0.18;
  float m = smoothstep(0.0, 1.0, clamp(uMix * 1.6 - clamp((r - 2.2) / 1.6, 0.0, 1.0) * 0.6, 0.0, 1.0));
  float reach = 0.5 * min(uRes.x, uRes.y); float dm = distance(px, uMouse);
  float light = exp(-(dm * dm) / (reach * reach)) * uHover;
  v += light * 0.22 + band * 0.12;
  vec3 color = mix(ramp(v, m), stop4(m), light * 0.18);
  color = srgb(color) + (hash(px) - 0.5) * 0.04;
  gl_FragColor = vec4(color, 1.0);
}`;

/** Seconds for a new cover to run out along the streaks. */
const SWEEP = 0.6;
/** Field time per second at rest under a hand, and what the pointer adds. */
const RATE = 0.35;
const QUICKEN = 1.1;
/** Where the field opens, so a still frame looks mid-flow. */
const START = 4;

/** Any CSS colour as 0–1 sRGB, read through a 2D canvas. */
function rgbOf(color: string): [number, number, number] {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [0.5, 0.5, 0.5];
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255];
}
const flatten = (stops: CoverStops) => stops.flatMap(rgbOf);
const blend = (a: number[], b: number[], m: number) => a.map((c, i) => Math.pow(Math.pow(c, 2.2) * (1 - m) + Math.pow(b[i], 2.2) * m, 1 / 2.2));

type Field = {
  /** Draws a new cover, running out from (fx, fy) in the canvas, 0–1 from the bottom left. */
  recolour: (stops: CoverStops, fx: number, fy: number) => void;
  /** Runs the loop for a while (a hand, a sweep). */
  wake: () => void;
  hand: (x: number, y: number, on: boolean) => void;
  ring: (x: number, y: number) => void;
  destroy: () => void;
  ok: boolean;
};

function makeField(canvas: HTMLCanvasElement, first: CoverStops, seed: number, still: () => boolean): Field {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: true });
  const none: Field = { recolour() {}, wake() {}, hand() {}, ring() {}, destroy() {}, ok: false };
  if (!gl) return none;
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return none;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = { res: u("uRes"), time: u("uTime"), mouse: u("uMouse"), hover: u("uHover"), ripple: u("uRipple"), seed: u("uSeed"), from: u("uFrom"), to: u("uTo"), mix: u("uMix") };

  const st = { time: START, hover: 0, hoverTarget: 0, mouse: [0, 0], ripple: [0, 0, -1], from: flatten(first), to: flatten(first), mix: 1 };
  let raf = 0;
  let last = 0;

  const draw = () => {
    gl.uniform1f(U.time, st.time);
    gl.uniform2fv(U.mouse, st.mouse);
    gl.uniform1f(U.hover, st.hover);
    gl.uniform3fv(U.ripple, st.ripple);
    gl.uniform3fv(U.from, st.from);
    gl.uniform3fv(U.to, st.to);
    gl.uniform1f(U.mix, st.mix);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, canvas.width, canvas.height);
    draw();
  };
  /* The loop runs while a hand is on it, a sweep or a ring is under way, or the light is fading; then it stops. */
  const busy = () => st.hoverTarget > 0 || st.hover > 0.01 || st.mix < 1 || st.ripple[2] >= 0;
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    st.hover += (st.hoverTarget - st.hover) * (1 - Math.exp(-dt * (st.hoverTarget > st.hover ? 10 : 5)));
    if (st.hoverTarget > 0) st.time += dt * (RATE + st.hover * QUICKEN);
    if (st.ripple[2] >= 0) st.ripple[2] = st.ripple[2] + dt > 1.6 ? -1 : st.ripple[2] + dt;
    if (st.mix < 1) st.mix = Math.min(1, st.mix + dt / SWEEP);
    draw();
    raf = busy() ? requestAnimationFrame(tick) : 0;
  };
  const wake = () => {
    if (still()) {
      st.mix = 1;
      st.ripple[2] = -1;
      st.hover = 0;
      draw();
      return;
    }
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  const eased = () => st.mix * st.mix * (3 - 2 * st.mix);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  gl.uniform1f(U.seed, seed);
  resize();

  return {
    ok: true,
    wake,
    recolour(stops, fx, fy) {
      st.from = blend(st.from, st.to, eased());
      st.to = flatten(stops);
      st.mix = 0;
      st.ripple = [fx * canvas.width, fy * canvas.height, 0];
      wake();
    },
    hand(x, y, on) {
      const r = canvas.getBoundingClientRect();
      st.mouse = [((x - r.left) / r.width) * canvas.width, (1 - (y - r.top) / r.height) * canvas.height];
      st.hoverTarget = on ? 1 : 0;
      wake();
    },
    ring(x, y) {
      const r = canvas.getBoundingClientRect();
      st.ripple = [((x - r.left) / r.width) * canvas.width, (1 - (y - r.top) / r.height) * canvas.height, 0];
      wake();
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/* ---------------------------------------------------------------- the part */

const still = (stops: CoverStops) => `linear-gradient(60deg, ${stops.join(", ")})`;
/** The tick reads on its swatch: the darkest stop on a light swatch, the lightest on a dark one. */
function tickOn(stops: CoverStops) {
  const [r, g, b] = rgbOf(stops[2]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? stops[0] : stops[4];
}

/** A cover picker: one live long exposure on paper, its name as the figure, and a swatch per cover. A Flat part. */
export function GradientKeys({ covers, value, defaultValue, onValueChange, label = "Cover", className = "" }: GradientKeysProps) {
  const { reduced } = useMotionDial();
  const grow = useTransition("expressive");
  const settle = useTransition("responsive");
  const [own, setOwn] = useState(defaultValue ?? covers[0]?.id);
  const chosenId = value ?? own;
  const at = Math.max(0, covers.findIndex((c) => c.id === chosenId));
  const cover = covers[at];
  const [said, setSaid] = useState("");
  const [ticks, setTicks] = useState<string[]>([]);
  const status = useId();

  const canvas = useRef<HTMLCanvasElement>(null);
  const field = useRef<Field | null>(null);
  const reducedNow = useRef(reduced);
  reducedNow.current = reduced;
  const swatches = useRef<(HTMLButtonElement | null)[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const shown = useRef(cover?.id);
  const first = useRef(true);

  useEffect(() => setTicks(covers.map((c) => tickOn(c.stops))), [covers]);

  /* One field for the part's life; it opens on the cover chosen first. */
  useEffect(() => {
    const el = canvas.current;
    if (!el || !cover) return;
    const f = makeField(el, cover.stops, cover.seed ?? 2, () => reducedNow.current);
    field.current = f;
    return () => {
      f.destroy();
      field.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* A new cover runs out from the edge nearest the swatch that chose it. */
  useEffect(() => {
    if (!cover || shown.current === cover.id) return;
    shown.current = cover.id;
    const sw = swatches.current[at]?.getBoundingClientRect();
    const r = box.current?.getBoundingClientRect();
    const fx = sw && r && r.width ? Math.min(1, Math.max(0, (sw.left + sw.width / 2 - r.left) / r.width)) : 1;
    field.current?.recolour(cover.stops, fx, 0.02);
  }, [cover, at]);

  useEffect(() => {
    first.current = false;
  }, []);

  if (!cover) return null;

  const pick = (i: number, say: boolean) => {
    const c = covers[i];
    if (!c) return;
    if (value === undefined) setOwn(c.id);
    onValueChange?.(c.id);
    if (say) setSaid(`${c.name}.${c.line ? ` ${c.line}.` : ""}`);
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = covers.length;
    const to = ({ ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i + n - 1) % n, ArrowUp: (i + n - 1) % n, Home: 0, End: n - 1 } as Record<string, number>)[e.key];
    if (to === undefined) return;
    e.preventDefault();
    pick(to, true);
    swatches.current[to]?.focus();
  };

  return (
    <div className={"w-full max-w-xl min-w-0 " + className}>
      <div className="litt-paper grid gap-3.5 rounded-surface bg-surface-1 p-3 text-fg select-none forced-colors:border">
        <div
          ref={box}
          role="img"
          aria-label={`Cover: ${cover.name}${cover.line ? `, ${cover.line}` : ""}`}
          onPointerMove={(e) => field.current?.hand(e.clientX, e.clientY, true)}
          onPointerLeave={(e) => field.current?.hand(e.clientX, e.clientY, false)}
          onPointerDown={(e) => field.current?.ring(e.clientX, e.clientY)}
          style={{ background: still(cover.stops) }}
          className="relative aspect-[2/1] cursor-pointer overflow-hidden rounded-[calc(var(--radius-surface)-12px)] [-webkit-touch-callout:none]"
        >
          <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 block size-full" />
        </div>
        <div className="flex items-center justify-between gap-3 px-1.5 pb-1.5">
          <motion.div
            key={cover.id}
            aria-hidden="true"
            initial={first.current || reduced ? false : { y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={settle}
            className="min-w-0"
          >
            <p className="text-figure leading-none">{cover.name}</p>
            {cover.line && <p className="mt-1 truncate text-small text-fg-muted">{cover.line}</p>}
          </motion.div>
          <div role="radiogroup" aria-label={label} className="flex shrink-0 items-center gap-1">
            {covers.map((c, i) => {
              const on = i === at;
              return (
                <button
                  key={c.id}
                  ref={(el) => {
                    swatches.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${c.name}${c.line ? `, ${c.line}` : ""}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => pick(i, true)}
                  onKeyDown={(e) => onKey(e, i)}
                  className="litt-target relative grid size-11 cursor-pointer place-items-center rounded-pill focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus [-webkit-tap-highlight-color:transparent]"
                >
                  <motion.span
                    aria-hidden="true"
                    initial={false}
                    animate={{ scale: on ? 1 : 0.7 }}
                    transition={grow}
                    style={{ background: `linear-gradient(135deg, ${c.stops[0]}, ${c.stops[2]} 55%, ${c.stops[4]})`, color: ticks[i] }}
                    className="grid size-10 place-items-center rounded-pill forced-colors:border"
                  >
                    <svg viewBox="0 0 20 20" aria-hidden="true" className={"size-5 transition-opacity duration-(--dur-instant) ease-litt " + (on ? "opacity-100" : "opacity-0")}>
                      <path d="M5.5 10.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <p id={status} role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
