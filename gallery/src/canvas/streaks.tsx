/**
 * Long exposures: candidate pictures for Flat, moving, compared on the canvas beside the bokashi skies
 * (proposals/bokashi.md). The field is Nick's own, from Gradient Keys in the components repo
 * (github.com/litterthanlit/components, src/registry/components/gradient-keys.tsx): a camera swung through foliage
 * with the shutter open, in a traditional Japanese palette. It is noise, not a picture. Streaks fan from a point below
 * and left of the frame, the fan keeps turning while the streaks flow along it, and the sum runs through five stops
 * in linear light under a little grain. The two shaders below are copied from that file unchanged, so the picture
 * here is the picture there. This is an experiment, not a component: what Nick picks becomes Flat's pictures in a
 * later change, and this file goes with the canvas.
 *
 * What differs from Gradient Keys, and why:
 * - It only streams by default. R2 says a gradient never follows the cursor, and the exception Nick chose for
 *   pictures covers moving on its own, not answering a hand. `hand` turns on what Gradient Keys does under a hand
 *   (the light, the quickening, the ring a press sends), so both can be felt on the canvas before Nick decides.
 * - It follows the gallery's motion dial: under reduced motion it draws one still frame. It is also still while it
 *   is off screen and while paused (WCAG 2.2.2). A picture moving on its own is not yet in the profile.
 * - It sizes its canvas from its layout box, not its box on screen: the language canvas zooms with a transform.
 * - The palettes are hex because a shader takes numbers. They are candidates under comparison, so each carries
 *   litt-allow, and the picked ones move into tokens.css.
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { useMotionDial } from "@/motion";

/* --- The shaders, unchanged from Gradient Keys ----------------------------- */

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform vec3 uRipple;   // xy = origin (px), z = age in seconds (<0: none)
uniform float uSeed;
uniform vec3 uFrom[5];  // the palette it is leaving, dark to light, sRGB
uniform vec3 uTo[5];    // the palette it is going to
uniform float uMix;     // 0 → 1 across a change

const float ZOOM = 1.35; // field units across the screen's shorter side

// A hash without sine, so it stays fine-grained however long the page is open.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
// Three octaves only: a long exposure has no fine detail.
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v / 0.875;
}
vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
// Uniform arrays only take constant indices here, hence one function a stop.
vec3 stop0(float m) { return mix(toLinear(uFrom[0]), toLinear(uTo[0]), m); }
vec3 stop1(float m) { return mix(toLinear(uFrom[1]), toLinear(uTo[1]), m); }
vec3 stop2(float m) { return mix(toLinear(uFrom[2]), toLinear(uTo[2]), m); }
vec3 stop3(float m) { return mix(toLinear(uFrom[3]), toLinear(uTo[3]), m); }
vec3 stop4(float m) { return mix(toLinear(uFrom[4]), toLinear(uTo[4]), m); }
vec3 ramp(float v, float m) {
  float x = clamp(v, 0.0, 0.999) * 4.0;
  float f = smoothstep(0.0, 1.0, fract(x));
  if (x < 1.0) return mix(stop0(m), stop1(m), f);
  if (x < 2.0) return mix(stop1(m), stop2(m), f);
  if (x < 3.0) return mix(stop2(m), stop3(m), f);
  return mix(stop3(m), stop4(m), f);
}

void main() {
  vec2 px = gl_FragCoord.xy;
  float unit = ZOOM / min(uRes.x, uRes.y); // field units per pixel
  vec2 p = (px - 0.5 * uRes) * unit;
  float t = uTime;

  // A press: a ring that widens and fades, pushing the streaks aside as it passes.
  float band = 0.0;
  if (uRipple.z >= 0.0) {
    vec2 dir = p - (uRipple.xy - 0.5 * uRes) * unit;
    float rad = uRipple.z * 1.4 * ZOOM;
    band = exp(-pow((length(dir) - rad) / (0.07 * ZOOM), 2.0)) * exp(-uRipple.z * 2.2);
    p += normalize(dir + 1e-4) * band * 0.09 * ZOOM;
  }

  // The fan: polar coordinates about a point below and left of the screen. It keeps turning,
  // so the streaks sweep across the screen as well as flowing along it.
  vec2 d = p - vec2(-2.6, -1.4);
  float r = length(d);
  float a = atan(d.y, d.x) + t * 0.05;
  vec2 q = vec2(a * 8.0, r * 0.32 - t * 0.18);
  q.x += (fbm(vec2(a * 2.0, r * 0.35 - t * 0.1) + uSeed) - 0.5) * 1.4;
  float streak = fbm(q + uSeed * 3.1);
  float fine = fbm(vec2(a * 34.0, r * 0.5 - t * 0.29) + uSeed * 5.3);
  // Out-of-focus masses of light and dark, drifting.
  float mass = fbm(p * 0.55 + vec2(t * 0.08, -t * 0.05) + uSeed * 7.0);
  // A few thin glints where the light caught a blade.
  float glint = smoothstep(0.68, 0.86, fbm(vec2(a * 70.0, r * 0.4 - t * 0.25) + uSeed * 9.7));
  float v = streak * 0.85 + fine * 0.25 + (mass - 0.5) * 0.85 - 0.04;
  v = smoothstep(0.08, 0.92, v) + glint * 0.18;

  // A new palette runs out along the streaks, from the fan's root to its tips.
  float m = smoothstep(0.0, 1.0, clamp(uMix * 1.6 - clamp((r - 2.2) / 1.6, 0.0, 1.0) * 0.6, 0.0, 1.0));

  // The hand lifts the exposure under it, toward the palette's lightest stop.
  float reach = 0.5 * min(uRes.x, uRes.y);
  float dm = distance(px, uMouse);
  float light = exp(-(dm * dm) / (reach * reach)) * uHover;
  v += light * 0.22 + band * 0.12;
  vec3 color = mix(ramp(v, m), stop4(m), light * 0.18);

  color = toSrgb(color) + (hash(px + fract(uTime * 7.0) * 113.0) - 0.5) * 0.04;
  gl_FragColor = vec4(color, 1.0);
}
`;

/* --- Palettes -------------------------------------------------------------- */

/** Five sRGB hex stops, dark to light. Artwork, not tokens: the same in both themes. */
export type Palette = readonly [string, string, string, string, string];

export type Exposure = {
  id: string;
  name: string;
  note: string;
  palette: Palette;
  /** Picks the exposure: the same seed always opens on the same frame. */
  seed: number;
};

/* The first three are Gradient Keys' own, with their seeds. Sumi and Fuji are new here, in the same five steps. */
export const EXPOSURES: Exposure[] = [
  { id: "wakatake", name: "Wakatake", note: "Young bamboo", seed: 3, palette: ["#264d35", "#3b6e4e", "#6da47a", "#a9cba3", "#e1ecdc"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "ai", name: "Ai", note: "Indigo, fading to asagi", seed: 1, palette: ["#16213d", "#1f2f54", "#3f5f8f", "#7fa6c2", "#c9dde6"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "sakura", name: "Sakura", note: "Cherry, fading to shell white", seed: 5, palette: ["#b06e7c", "#d796a6", "#e9b5c1", "#f5d8de", "#fbf2ee"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "sumi", name: "Sumi", note: "Ink, from full to paper. New here", seed: 7, palette: ["#2b2c30", "#55575d", "#8f9197", "#c8cacd", "#f0f0ee"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
  { id: "fuji", name: "Fuji", note: "Wisteria. New here", seed: 9, palette: ["#463c69", "#6a5d94", "#9b8fc0", "#cbc3e0", "#f0ecf6"] }, // litt-allow: artwork, a candidate palette (proposals/bokashi.md)
];

/* --- Helpers --------------------------------------------------------------- */

const SWEEP = 0.6; // seconds for a new palette to sweep in
const RATE = 0.35; // field time per second of real time, at rest
const QUICKEN = 1.1; // added to the rate under a hand

/** Fifteen floats, the five stops as 0–1 RGB. */
const toStops = (key: string) => key.split(",").flatMap((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));

/** Where a sweep stands, as one palette: mixed in linear light, as the shader mixes. */
function blend(from: number[], to: number[], m: number) {
  return from.map((c, i) => Math.pow(Math.pow(c, 2.2) * (1 - m) + Math.pow(to[i] ?? c, 2.2) * m, 1 / 2.2));
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

/* --- StreakField ----------------------------------------------------------- */

type StreakFieldProps = {
  /** Names the field for the checks (`data-streaks`). */
  id: string;
  /** A new palette sweeps in over 600ms, without restarting the field. */
  palette: Palette;
  seed?: number;
  /** Hold the motion where it stands. */
  paused?: boolean;
  /** Answer a hand as Gradient Keys does: light under the pointer, a quicker stream, a ring from a press. */
  hand?: boolean;
};

/**
 * A long-exposure field that fills its box. Raw WebGL, no library. It streams only while it is on screen, not
 * paused, and motion is allowed; otherwise it holds a still frame. Without WebGL it is a still gradient of its palette.
 */
export function StreakField({ id, palette, seed = 0, paused = false, hand = false }: StreakFieldProps) {
  const { reduced } = useMotionDial();
  const hostRef = useRef<HTMLSpanElement>(null);
  // Bridges from React props into the render loop, so a change never restarts it.
  const pausedRef = useRef(paused);
  // The stops as one string, so a new array with the same colours is no change.
  const stops = palette.join(",");
  const stopsRef = useRef(stops);
  const wakeRef = useRef<() => void>(() => {});
  const recolourRef = useRef<(stops: string) => void>(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    wakeRef.current();
  }, [paused]);

  useEffect(() => {
    if (stops === stopsRef.current) return;
    stopsRef.current = stops;
    recolourRef.current(stops);
  }, [stops]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // Made here, not rendered: the cleanup loses its context for good, so every mount needs a canvas of its own.
    const canvas = document.createElement("canvas");
    canvas.className = "block size-full";
    host.append(canvas);
    const context = canvas.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: true });
    if (!context) return () => canvas.remove();
    const gl = context;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uRes = u("uRes"), uTime = u("uTime"), uMouse = u("uMouse"), uHover = u("uHover");
    const uRipple = u("uRipple"), uSeed = u("uSeed"), uFrom = u("uFrom"), uTo = u("uTo"), uMix = u("uMix");

    const first = toStops(stopsRef.current);
    const state = {
      time: 0,
      hover: 0,
      hoverTarget: 0,
      mouse: [0, 0] as [number, number],
      ripple: [0, 0, -1] as [number, number, number],
      from: first,
      to: first,
      mix: 1,
      visible: false,
      raf: 0,
      last: 0,
    };
    const centre = (): [number, number] => [canvas.width / 2, canvas.height / 2];
    const eased = () => state.mix * state.mix * (3 - 2 * state.mix);

    function resize() {
      // The layout box, not the box on screen: a zoomed canvas would otherwise draw a few pixels and stretch them.
      const density = Math.min(devicePixelRatio, 1.5);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * density));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * density));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      if (!state.hoverTarget) state.mouse = centre();
    }

    function draw() {
      gl.uniform1f(uTime, state.time);
      gl.uniform2fv(uMouse, state.mouse);
      gl.uniform1f(uHover, state.hover);
      gl.uniform3fv(uRipple, state.ripple);
      gl.uniform3fv(uFrom, state.from);
      gl.uniform3fv(uTo, state.to);
      gl.uniform1f(uMix, state.mix);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - (state.last || now)) / 1000);
      state.last = now;
      const target = state.hoverTarget;
      // Exponential ease toward the target: fast in, slightly slower out.
      state.hover += (target - state.hover) * (1 - Math.exp(-dt * (target > state.hover ? 10 : 5)));
      if (!pausedRef.current) state.time += dt * (RATE + state.hover * QUICKEN);
      if (state.ripple[2] >= 0) {
        state.ripple[2] += dt;
        if (state.ripple[2] > 1.6) state.ripple[2] = -1;
      }
      if (state.mix < 1) state.mix = Math.min(1, state.mix + dt / SWEEP);
      // Held, the loop runs only until the light has settled, the ring has gone and the colours have landed.
      const settled = pausedRef.current && Math.abs(target - state.hover) < 0.002 && state.ripple[2] < 0 && state.mix === 1;
      if (settled) state.hover = target;
      draw();
      state.raf = state.visible && !settled ? requestAnimationFrame(frame) : 0;
      if (!state.raf) host!.removeAttribute("data-running");
    }

    /** Reduced motion: no loop, one still frame. */
    function still() {
      state.hover = state.hoverTarget;
      draw();
    }

    function start() {
      if (reduced) return still();
      if (!state.raf && state.visible) {
        state.last = 0;
        state.raf = requestAnimationFrame(frame);
        host!.setAttribute("data-running", "");
      }
    }

    function toLocal(event: PointerEvent): [number, number] {
      const rect = canvas.getBoundingClientRect();
      return [
        ((event.clientX - rect.left) / rect.width) * canvas.width,
        (1 - (event.clientY - rect.top) / rect.height) * canvas.height,
      ];
    }

    const onMove = (e: PointerEvent) => {
      state.mouse = toLocal(e);
      state.hoverTarget = 1;
      start();
    };
    const onLeave = () => {
      state.hoverTarget = 0;
      start();
    };
    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      state.ripple = [...toLocal(e), 0];
      start();
    };
    if (hand) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      host.addEventListener("pointerdown", onDown);
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(canvas);

    const visibility = new IntersectionObserver(([entry]) => {
      state.visible = Boolean(entry?.isIntersecting);
      if (state.visible) start();
    });
    visibility.observe(canvas);

    wakeRef.current = start;
    // A new palette sweeps in from wherever the last change had got to.
    recolourRef.current = (next) => {
      state.from = blend(state.from, state.to, eased());
      state.to = toStops(next);
      state.mix = reduced ? 1 : 0;
      start();
    };

    gl.uniform1f(uSeed, seed);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(state.raf);
      state.visible = false;
      resizeObserver.disconnect();
      visibility.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      host.removeAttribute("data-running");
      wakeRef.current = () => {};
      recolourRef.current = () => {};
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [seed, reduced, hand]);

  return (
    <span
      ref={hostRef}
      aria-hidden="true"
      data-streaks={id}
      className="block size-full"
      style={{ background: `linear-gradient(60deg, ${palette.join(", ")})` }}
    />
  );
}

/* --- The canvas pieces ----------------------------------------------------- */

/** A field in a frame with a name. `ratio` is its width over its height. */
function Print({ id, exposure, ratio, paused, hand }: { id: string; exposure: Exposure; ratio: number; paused: boolean; hand: boolean }) {
  return (
    <div
      role="img"
      aria-label={`${exposure.name}: ${exposure.note}`}
      className="relative isolate w-full overflow-hidden rounded-surface"
      style={{ aspectRatio: String(ratio) }}
    >
      <StreakField id={id} palette={exposure.palette} seed={exposure.seed} paused={paused} hand={hand} />
    </div>
  );
}

/** The five palettes in a row, as prints (4 to 5), with one button that pauses them all. */
export function StreakPrints() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-5 gap-5">
        {EXPOSURES.map((exposure) => (
          <figure key={exposure.id} className="m-0 grid content-start gap-3">
            <Print id={exposure.id} exposure={exposure} ratio={0.8} paused={paused} hand={false} />
            <figcaption className="grid gap-0.5">
              <span className="text-small font-title text-fg">{exposure.name}</span>
              <span className="text-caption font-normal text-fg-subtle">{exposure.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div>
        <Button size="sm" variant="ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? "Play the exposures" : "Pause the exposures"}
        </Button>
      </div>
    </div>
  );
}

/** Flat's hero picture, 2.4 to 1: the grey plate it is today, and a long exposure in its place, in any palette. */
export function StreakHero() {
  const [paused, setPaused] = useState(false);
  const [hand, setHand] = useState(false);
  const [picked, setPicked] = useState("sakura");
  const exposure = EXPOSURES.find((e) => e.id === picked) ?? EXPOSURES[0]!;
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-6">
        <figure className="m-0 grid content-start gap-3">
          <div className="grid w-full place-items-center rounded-surface bg-surface-3 text-caption text-fg-muted" style={{ aspectRatio: "2.4" }}>
            Hero, Bakehouse Nord
          </div>
          <figcaption className="text-small text-fg-subtle">Today</figcaption>
        </figure>
        <figure className="m-0 grid content-start gap-3">
          {/* One field for every palette: a new one sweeps in, the field does not restart. Its seed stays Ai's. */}
          <Print id="hero" exposure={{ ...exposure, seed: 1 }} ratio={2.4} paused={paused} hand={hand} />
          <figcaption className="text-small text-fg-subtle">As a long exposure: {exposure.name}</figcaption>
        </figure>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {EXPOSURES.map((e) => (
          <Button key={e.id} size="sm" variant={e.id === picked ? "secondary" : "ghost"} aria-pressed={e.id === picked} onClick={() => setPicked(e.id)}>
            {e.name}
          </Button>
        ))}
        <Button size="sm" variant="ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? "Play the exposure" : "Pause the exposure"}
        </Button>
        <Button size="sm" variant="ghost" aria-pressed={hand} onClick={() => setHand((h) => !h)}>
          {hand ? "Stop following the hand" : "Follow the hand"}
        </Button>
      </div>
    </div>
  );
}
