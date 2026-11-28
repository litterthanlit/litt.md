/**
 * DitherCards, a Flat part (the Flat studies, Dither card): a row of project cards on the grey ground, each a white
 * paper with its picture, a creature (a butterfly, a jellyfish, a bloom) in three-tone ordered dither drawn in the ink.
 *
 * - A card: white paper (`litt-paper bg-surface-1 rounded-surface`), its picture square at the top in the ink on the
 *   paper, its name under it. It is a link to the project. Under the row the up card's name, year and line are said in
 *   words: the name at the figure size from 35rem up.
 * - The picture: a WebGL field drawn at half resolution and shown pixelated, so the dither's dots stay crisp. It reads
 *   the ink from the page (--fg), so it follows the theme. Without WebGL the picture is the paper.
 * - Motion: nothing moves on its own (R4). At rest each picture holds one frame. The card under the hand, with focus,
 *   or named by `active` lifts on Flat's expressive spring, and its picture quickens and brightens toward the
 *   pointer; a press rings out from the press, and a card that comes up by focus or by `active` rings from its centre.
 *   A press shrinks the card to --press-scale. Under reduced motion each picture is drawn once, a card lifts at once,
 *   and nothing rings.
 * - Semantics: a list named Projects; each card is a link named by its project and described by its line and year.
 *   Pictures are hidden from a screen reader.
 */
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useMotionDial, useTransition } from "@/motion";

export type DitherCreature = "butterfly" | "jellyfish" | "bloom";

export type DitherProject = {
  id: string;
  title: string;
  /** What it is, in a line ("Shader code in, motion graphics out."). */
  line: string;
  year?: string;
  href: string;
  /** The creature on its card. */
  creature: DitherCreature;
};

export type DitherCardsProps = {
  projects: DitherProject[];
  /** The card that is up when no hand or focus is on the row, when you control it (a featured project). */
  active?: string;
  /** Opens the links in a new tab (and says so). */
  newTab?: boolean;
  /** The list's name. */
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
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uHover; uniform vec3 uRipple; uniform float uPattern; uniform vec3 uInk;
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }
float contour(float x, float n, float sharp) { return pow(abs(cos(x * n * 3.14159)), sharp); }
float ellipse(vec2 p, vec2 c, vec2 r) { return length((p - c) / r) - 1.0; }
mat2 rot(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
float wing(vec2 q, vec2 c, vec2 r, float tilt, vec2 eye) {
  vec2 w = rot(tilt) * (q - c); float d = length(w / r) - 1.0; if (d > 0.0) return 0.0;
  float veins = contour(atan(q.y, q.x) * 0.9, 3.0, 24.0) * 0.25; float rim = smoothstep(-0.28, -0.16, d);
  float e = length(q - eye); float spot = smoothstep(0.045, 0.035, e) - smoothstep(0.025, 0.017, e) * 0.85;
  return clamp(0.36 + veins + rim * 0.62 + spot * 0.6, 0.0, 1.0); }
float butterfly(vec2 p, float t, float hair) {
  p.y -= sin(t * 0.9) * 0.025; float flap = 0.3 + 0.7 * abs(cos(t * 2.4)); vec2 q = vec2(abs(p.x) / flap, p.y);
  float v = max(wing(q, vec2(0.15, 0.08), vec2(0.17, 0.12), -0.5, vec2(0.2, 0.12)), wing(q, vec2(0.11, -0.1), vec2(0.11, 0.085), 0.6, vec2(0.13, -0.12)));
  float body = step(abs(p.x), max(0.016, hair)) * step(-0.17, p.y) * step(p.y, 0.15);
  vec2 a = vec2(abs(p.x), p.y - 0.15);
  float antenna = step(abs(a.x - a.y * 0.55), max(0.006, hair)) * step(0.0, a.y) * step(a.y, 0.12);
  float tip = step(length(a - vec2(0.066, 0.12)), max(0.014, hair * 1.5));
  return max(v, max(body, max(antenna, tip))); }
float jellyfish(vec2 p, float t, float hair) {
  float pulse = sin(t * 2.2); p.y -= 0.04 + pulse * 0.02;
  vec2 c = vec2(0.0, 0.08); vec2 r = vec2(0.24 - pulse * 0.025, 0.2 + pulse * 0.02);
  float hem = c.y - 0.02 + 0.012 * sin(p.x * 70.0); float d = ellipse(p, c, r); float bell = 0.0;
  if (d < 0.0 && p.y > hem) { float depth = (p.y - hem) / r.y; bell = 0.32 + contour(d, 4.0, 10.0) * 0.4 + smoothstep(-0.18, -0.06, d) * 0.5 + (1.0 - depth) * 0.12; }
  float tent = 0.0;
  for (int i = 0; i < 6; i++) { float fi = float(i); float x0 = -0.17 + fi * 0.068; float len = 0.34 + 0.08 * sin(fi * 2.3); float y = hem - p.y;
    float sway = sin(y * 16.0 - t * 2.6 + fi * 1.7) * 0.03 * smoothstep(0.0, 0.2, y);
    float width = max(mix(0.009, 0.003, clamp(y / len, 0.0, 1.0)), hair);
    tent = max(tent, step(abs(p.x - x0 - sway), width) * step(0.0, y) * step(y, len)); }
  return clamp(max(bell, tent), 0.0, 1.0); }
float bloom(vec2 p, float t) {
  float breathe = 1.0 + sin(t * 1.3) * 0.04; p /= breathe; float r = length(p), a = atan(p.y, p.x); float spin = t * 0.25;
  float outer = 0.3 * (0.45 + 0.55 * pow(abs(cos(a * 2.5 + spin)), 0.7));
  float inner = 0.19 * (0.5 + 0.5 * pow(abs(cos(a * 2.5 - spin * 1.4 + 0.63)), 0.7));
  float v = 0.0;
  if (r < outer) v = 0.3 + smoothstep(outer - 0.05, outer - 0.015, r) * 0.6 + contour(a * 0.8 + spin * 0.32, 4.0, 30.0) * 0.12;
  if (r < inner) v = 0.5 + smoothstep(inner - 0.04, inner - 0.01, r) * 0.5;
  if (r < 0.065) v = 0.55 + 0.45 * step(0.5, fract(r * 40.0 - t * 0.3 + sin(a * 8.0) * 0.1));
  return v; }
float field(vec2 uv, float t) {
  float aspect = uRes.x / uRes.y; float fit = min(aspect, 1.0) * 1.3; vec2 p = (uv - 0.5) * vec2(aspect, 1.0) / fit;
  float hair = 0.5 / (uRes.y * fit); float ground = smoothstep(0.45, 0.9, fbm(uv * 3.0 + t * 0.05)) * 0.22;
  float shape = uPattern < 0.5 ? butterfly(p, t, hair) : uPattern < 1.5 ? jellyfish(p, t, hair) : bloom(p, t);
  return max(ground, shape); }
void main() {
  vec2 px = gl_FragCoord.xy; vec2 uv = px / uRes; float v = field(uv, uTime) * 0.86;
  float r = uRes.y * 0.42; float d = distance(px, uMouse); float light = exp(-(d * d) / (r * r)) * uHover;
  float ring = 0.0;
  if (uRipple.z >= 0.0) { float rad = uRipple.z * uRes.y * 1.4; float rd = abs(distance(px, uRipple.xy) - rad); ring = smoothstep(uRes.y * 0.03, 0.0, rd) * exp(-uRipple.z * 2.2); }
  float threshold = bayer8(px); float level = clamp(v + light * 0.55 + ring, 0.0, 1.0);
  float scaled = level * 2.0; float tone = min(2.0, floor(scaled) + step(threshold, fract(scaled)));
  float alpha = tone > 1.5 ? 1.0 : tone > 0.5 ? mix(0.3, 0.55, max(light, ring)) : light * 0.07;
  gl_FragColor = vec4(uInk * alpha, alpha); }`;

const PATTERN: Record<DitherCreature, number> = { butterfly: 0, jellyfish: 1, bloom: 2 };
/** Where each creature opens, so a still frame reads as the creature. */
const START: Record<DitherCreature, number> = { butterfly: (4 * Math.PI) / 2.4, jellyfish: (3.5 * Math.PI) / 2.2, bloom: 3 };
/** The field draws one pixel per this many CSS pixels, shown pixelated. */
const PIXEL = 2;
/** How high an up card rises (px), and from 35rem up. */
const LIFT = 8;
const LIFT_WIDE = 16;

function inkOf(el: Element): [number, number, number] {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return [0, 0, 0];
  ctx.fillStyle = getComputedStyle(el).color;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255];
}

type Field = {
  /** Up: brightens and quickens; with `ring`, rings from the centre as it comes up. */
  up: (on: boolean, ring: boolean) => void;
  hand: (x: number, y: number, on: boolean) => void;
  ring: (x: number, y: number) => void;
  reink: () => void;
  destroy: () => void;
};

function makeField(canvas: HTMLCanvasElement, creature: DitherCreature, still: () => boolean): Field | null {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  if (!gl) return null;
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
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = { res: u("uRes"), time: u("uTime"), mouse: u("uMouse"), hover: u("uHover"), ripple: u("uRipple"), pattern: u("uPattern"), ink: u("uInk") };

  const st = { time: START[creature], hover: 0, hoverTarget: 0, active: false, mouse: [0, 0], ripple: [0, 0, -1] };
  let raf = 0;
  let last = 0;
  const centre = () => [canvas.width / 2, canvas.height / 2];
  const draw = () => {
    gl.uniform1f(U.time, st.time);
    gl.uniform2fv(U.mouse, st.mouse);
    gl.uniform1f(U.hover, st.hover);
    gl.uniform3fv(U.ripple, st.ripple);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const resize = () => {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth / PIXEL));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight / PIXEL));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, canvas.width, canvas.height);
    if (!st.hoverTarget) st.mouse = centre();
    draw();
  };
  const target = () => Math.max(st.hoverTarget, st.active ? 1 : 0);
  /* The loop runs while the card is up or its light is fading, or a ring is out; then it holds its frame. */
  const busy = () => target() > 0 || st.hover > 0.01 || st.ripple[2] >= 0;
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const to = target();
    if (st.active && !st.hoverTarget) st.mouse = centre();
    st.hover += (to - st.hover) * (1 - Math.exp(-dt * (to > st.hover ? 10 : 5)));
    if (to > 0) st.time += dt * (0.35 + st.hover * 1.1);
    if (st.ripple[2] >= 0) st.ripple[2] = st.ripple[2] + dt > 1.6 ? -1 : st.ripple[2] + dt;
    draw();
    raf = busy() ? requestAnimationFrame(tick) : 0;
  };
  const wake = () => {
    if (still()) {
      st.hover = target();
      st.ripple[2] = -1;
      if (st.active && !st.hoverTarget) st.mouse = centre();
      draw();
      return;
    }
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  const local = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect();
    return [((x - r.left) / r.width) * canvas.width, (1 - (y - r.top) / r.height) * canvas.height];
  };
  const reink = () => {
    gl.uniform3fv(U.ink, inkOf(canvas));
    draw();
  };
  gl.uniform1f(U.pattern, PATTERN[creature]);
  gl.uniform3fv(U.ink, inkOf(canvas));
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  return {
    up(on, ring) {
      const rising = on && !st.active;
      st.active = on;
      if (rising && ring && !still()) st.ripple = [...centre(), 0];
      wake();
    },
    hand(x, y, on) {
      st.mouse = local(x, y);
      st.hoverTarget = on ? 1 : 0;
      wake();
    },
    ring(x, y) {
      if (!still()) st.ripple = [...local(x, y), 0];
      wake();
    },
    reink,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/* ---------------------------------------------------------------- one card */

function Card({ project, up, newTab, onHand }: { project: DitherProject; up: "hand" | "focus" | "active" | null; newTab: boolean; onHand: (on: boolean, focus: boolean) => void }) {
  const { reduced } = useMotionDial();
  const lift = useTransition("expressive");
  const canvas = useRef<HTMLCanvasElement>(null);
  const field = useRef<Field | null>(null);
  const reducedNow = useRef(reduced);
  reducedNow.current = reduced;
  const describedBy = `dither-${project.id}`;
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const f = makeField(el, project.creature, () => reducedNow.current);
    field.current = f;
    /* The ink follows the theme. */
    const mo = new MutationObserver(() => f?.reink());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const re = () => f?.reink();
    mq.addEventListener("change", re);
    const wq = window.matchMedia("(min-width: 35rem)");
    const ww = () => setWide(wq.matches);
    ww();
    wq.addEventListener("change", ww);
    return () => {
      f?.destroy();
      mo.disconnect();
      mq.removeEventListener("change", re);
      wq.removeEventListener("change", ww);
      field.current = null;
    };
  }, [project.creature]);

  useEffect(() => {
    field.current?.up(up !== null, up === "focus" || up === "active");
  }, [up]);

  return (
    <li className="min-w-0">
      <motion.a
        href={project.href}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noreferrer" : undefined}
        draggable={false}
        aria-describedby={describedBy}
        animate={{ y: up ? -(wide ? LIFT_WIDE : LIFT) : 0 }}
        transition={lift}
        onPointerEnter={(e) => e.pointerType === "mouse" && onHand(true, false)}
        onPointerLeave={() => onHand(false, false)}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && onHand(true, true)}
        onBlur={() => onHand(false, true)}
        onPointerDown={(e) => field.current?.ring(e.clientX, e.clientY)}
        className="litt-paper group/card grid gap-2 rounded-surface bg-surface-1 p-2 pb-3 text-fg no-underline select-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus forced-colors:border sm:gap-3 sm:p-3 sm:pb-4 [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
      >
        <span className="grid gap-2 transition-[scale] duration-(--dur-instant) ease-litt group-active/card:scale-[var(--press-scale)] sm:gap-3">
          <span
            aria-hidden="true"
            onPointerMove={(e) => field.current?.hand(e.clientX, e.clientY, true)}
            onPointerLeave={(e) => field.current?.hand(e.clientX, e.clientY, false)}
            className="block aspect-square overflow-hidden rounded-[calc(var(--radius-surface)-8px)] text-fg sm:rounded-[calc(var(--radius-surface)-12px)]"
          >
            <canvas ref={canvas} className="block size-full [image-rendering:pixelated]" />
          </span>
          <span className="truncate px-1 text-small font-label sm:px-1.5 sm:text-body">{project.title}</span>
        </span>
        <span id={describedBy} hidden>
          {project.line}
          {project.year ? ` ${project.year}.` : ""}
        </span>
        {newTab && <span className="sr-only">(opens in a new tab)</span>}
      </motion.a>
    </li>
  );
}

/* ---------------------------------------------------------------- the row */

/** A row of project cards, each with a creature in dither; the card under the hand lifts and its picture quickens. A Flat part. */
export function DitherCards({ projects, active, newTab = false, label = "Projects", className = "" }: DitherCardsProps) {
  const { reduced } = useMotionDial();
  const settle = useTransition("responsive");
  const [hand, setHand] = useState<{ id: string; focus: boolean } | null>(null);
  const upId = hand?.id ?? active ?? null;
  const shown = projects.find((p) => p.id === upId);

  return (
    <div className={"grid w-full max-w-xl min-w-0 gap-3.5 sm:gap-5 " + className}>
      <ul aria-label={label} className="grid grid-cols-3 gap-2 pt-2 sm:gap-4 sm:pt-4">
        {projects.map((p) => (
          <Card
            key={p.id}
            project={p}
            newTab={newTab}
            up={upId !== p.id ? null : hand ? (hand.focus ? "focus" : "hand") : "active"}
            onHand={(on, focus) => setHand((h) => (on ? { id: p.id, focus } : h?.id === p.id ? null : h))}
          />
        ))}
      </ul>
      <p aria-hidden="true" className="min-h-[2.6em] px-2 text-center text-small text-fg-muted sm:text-body">
        {shown && (
          <motion.span key={shown.id} initial={reduced ? false : { y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={settle} className="block">
            <b className="block font-label text-fg sm:mb-1 sm:text-figure">
              {shown.title}
              {shown.year && <small className="ms-1.5 text-small font-normal text-fg-muted">{shown.year}</small>}
            </b>
            {shown.line}
          </motion.span>
        )}
      </p>
    </div>
  );
}
