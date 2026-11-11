# Plan 007: Nick's long exposures stream on the canvas, beside the bokashi skies, as Flat's second candidate picture

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 29f5425..HEAD -- gallery/src/canvas gallery/src/motion/index.tsx gallery/src/components/button.tsx proposals/bokashi.md`
> If any of these changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S (the code is written and tested; this plan carries it whole)
- **Risk**: LOW (nothing shipped changes: the pictures live on the canvas, which the page checks never visit)
- **Depends on**: 006 (its two canvas pieces and `proposals/bokashi.md` must be present)
- **Category**: direction
- **Planned at**: commit `29f5425`, 2026-11-11

## Why this matters

Nick asked for "japanese moving gradients" in Flat's pictures. Plan 006 built
five bokashi skies on the canvas. On seeing them, Nick said: "Take inspo from
my components repo". That repo (`litterthanlit/components`, public) has a
study called Gradient Keys whose screen shows a long exposure: streaks of
light in a traditional Japanese palette (wakatake greens, ai indigo, sakura
pink), drawn by a WebGL shader. That is the picture Nick had in mind.

This plan puts that picture on the canvas under the skies, so Nick can compare
the two moving, and adds the questions it raises to the proposal. It ships
nothing: Flat's screens, the taste profile and the registry do not change.

The code below was written by the advisor and already tested in a scratch
copy of the repo at commit `29f5425`: typecheck, lint, build and the browser
check in Step 4 all passed. Your job is to place it exactly, prove it again,
and commit. Do not rewrite it.

## Current state

- `gallery/src/canvas/` holds the language canvas (`#canvas`): a freeform
  workspace of live experiments. Content is listed in `registry.tsx`; each
  experiment is a file in the folder.
- `gallery/src/canvas/bokashi.tsx` (plan 006) exports `BokashiSkies` and
  `BokashiHero`. `registry.tsx` imports them and ends its `ITEMS` array with:

```tsx
  { id: "bokashi-skies", name: "Bokashi · five skies, drifting", x: BOKASHI_X, y: 0, width: 1240, height: 420, render: () => <BokashiSkies /> },
  { id: "bokashi-hero", name: "Bokashi · Flat's hero, today and as a sky", x: BOKASHI_X, y: 620, width: 1040, height: 320, render: () => <BokashiHero /> },
];
```

- `registry.tsx` has this import line, which the new import goes after:

```tsx
import { SCALES, ScaleFrame } from "./scale";
```

- `proposals/bokashi.md` has a heading line `## After the decision`. The new
  section goes immediately before it.
- `gallery/.agent-shots/` is gitignored. Scripts and screenshots you make
  there are never committed.
- The lint (`npm run lint:litt --prefix gallery`) fails on a quoted hex
  colour in `gallery/src` unless the line carries the words `litt-allow`. The
  five palette lines in the new file carry them. Do not remove them.

### Repo rules you must honour

- Never push. Never open a pull request.
- Never edit anything under `skills/litt-md/taste/`.
- Never edit generated output (`gallery/src/styles/`, `gallery/src/generated/`, `gallery/public/r/`, `gallery/public/docs/`).
- Refer to Nick by name or as "you"; never use gendered pronouns for Nick.
- Do not put any AI model name in a commit message.

## Commands you will need

Run from the repo root.

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm ci --prefix gallery` | exit 0 |
| Verify (also generates the files typecheck needs) | `npm run verify --prefix gallery` | exit 0 |
| Typecheck | `npm run typecheck --prefix gallery` | exit 0 |
| Lint | `npm run lint:litt --prefix gallery` | ends with `files clean.` |
| Build | `npm run build --prefix gallery` | exit 0 |
| Skill checks | `node skills/litt-md/scripts/check.mjs` | ends with `All checks passed.` |
| Lock untouched | `git diff --exit-code -- gallery/registry.lock.json` | exit 0, no output |

Step 4 needs Playwright, which is deliberately not a dependency. The script
looks in `$A11Y_TOOLS`, the gallery, then `/opt/node22/lib`. If it reports
Playwright missing, install it beside the repo as CI does:

```bash
npm install --prefix "${TMPDIR:-/tmp}/a11y" --no-save --no-package-lock playwright@1.56.1
"${TMPDIR:-/tmp}/a11y/node_modules/.bin/playwright" install chromium
export A11Y_TOOLS="${TMPDIR:-/tmp}/a11y"
```

## Scope

**In scope** (the only files you should modify or create):
- `gallery/src/canvas/streaks.tsx` (create)
- `gallery/src/canvas/registry.tsx` (one import and two entries)
- `proposals/bokashi.md` (one new section)
- `plans/README.md` (your status row)

**Out of scope** (do NOT touch, even though they look related):
- `gallery/src/canvas/bokashi.tsx` and its two canvas entries: the skies stay, for comparison.
- `gallery/src/gallery/systems/flat.tsx`, `gallery/src/blocks/**`, `gallery/src/components/**`: Flat's screens keep their pictures.
- `skills/litt-md/**`: no token, no rule wording, no lint change.
- `gallery/src/canvas/canvas.tsx`, `layout.ts`, and the other experiments.
- `gallery/CHANGELOG.md`, `gallery/registry.lock.json`: nothing the registry ships changes.
- The shader text inside `streaks.tsx`. It is copied from Nick's Gradient Keys unchanged. Do not tidy it.

## Git workflow

- Branch: the one the operator gave you; otherwise `claude/long-exposures-canvas`.
- Two commits: `gallery: long exposures, streaming, on the canvas` and `proposals: long exposures as Flat's second candidate picture`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline

Run `npm ci --prefix gallery`, then `npm run verify --prefix gallery`.

**Verify**: both exit 0. `ls gallery/src/canvas/bokashi.tsx proposals/bokashi.md` lists both files. `grep -c 'streaks' gallery/src/canvas/registry.tsx` prints `0`.

### Step 2: Create `gallery/src/canvas/streaks.tsx` from this plan

The file is 473 lines and must be exact, so do not retype it. Take it out of
this plan with a small script.

First create `gallery/.agent-shots/take.mjs` (create the folder if it is
missing) with exactly this content:

```js
/* Writes one marked block of a plan to a file: node take.mjs <plan> <name> <out> */
import fs from "node:fs";
const [plan, name, out] = process.argv.slice(2);
const text = fs.readFileSync(plan, "utf8");
const mark = text.indexOf("<!-- " + "file: " + name + " -->");
if (mark < 0) throw new Error("no block named " + name);
const open = text.indexOf("\n", text.indexOf("````", mark)) + 1;
const close = text.indexOf("\n````\n", open);
if (close < 0) throw new Error("block " + name + " is not closed");
fs.writeFileSync(out, text.slice(open, close) + "\n");
console.log(out, text.slice(open, close).split("\n").length, "lines");
```

Then run:

```bash
node gallery/.agent-shots/take.mjs plans/007-long-exposures-on-the-canvas.md streaks.tsx gallery/src/canvas/streaks.tsx
sha256sum gallery/src/canvas/streaks.tsx
```

**Verify**: the first command prints `gallery/src/canvas/streaks.tsx 473 lines`. The checksum is
`e69fc3da33529d5754482d6c27321bc1895b8e281206bfac3e3c6a45126669eb`.
If the checksum differs, STOP: do not edit the file by hand to make it match.

The block (do not copy it by hand; the script reads it):

<!-- file: streaks.tsx -->
````tsx
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
````

### Step 3: Put the two pieces on the canvas, in `gallery/src/canvas/registry.tsx`

1. After the line `import { SCALES, ScaleFrame } from "./scale";` add:

```tsx
import { StreakHero, StreakPrints } from "./streaks";
```

2. After the `bokashi-hero` entry (the last entry of `ITEMS`, shown in "Current state") and before the closing `];`, add these two lines:

```tsx
  { id: "streaks-prints", name: "Long exposure · five palettes, streaming", x: BOKASHI_X, y: 1140, width: 1240, height: 420, render: () => <StreakPrints /> },
  { id: "streaks-hero", name: "Long exposure · Flat's hero, today and as a long exposure", x: BOKASHI_X, y: 1760, width: 1040, height: 380, render: () => <StreakHero /> },
```

**Verify**: `git diff --stat -- gallery/src/canvas/registry.tsx` shows 3 insertions and 0 deletions. `npm run typecheck --prefix gallery` exits 0. `npm run lint:litt --prefix gallery` ends with `files clean.`

### Step 4: Prove the exposures stream, pause, recolour, and hold still under reduced motion

Build: `npm run build --prefix gallery` (exit 0).

Take the check script out of this plan and run it:

```bash
node gallery/.agent-shots/take.mjs plans/007-long-exposures-on-the-canvas.md check-streaks.mjs gallery/.agent-shots/check-streaks.mjs
sha256sum gallery/.agent-shots/check-streaks.mjs
node gallery/.agent-shots/check-streaks.mjs
```

**Verify**: the checksum is `8d3a8f61f9487118357dae5191b3defe1d9fd913a0e4c1f126eea1b5aa34432d`.
The script prints a table of two rows and ends with
`The exposures stream, pause, recolour, and hold still under reduced motion.` and exit code 0. Expected rows:

| reducedMotion | fields | running | changedIn2s | smallestCanvas | errors | heroRecoloured | changedWhilePaused | runningWhilePaused | changedAfterPlay | fieldsWithHand |
|---|---|---|---|---|---|---|---|---|---|---|
| false | 6 | 6 | 6 | 200 or more | 0 | true | 0 | 0 | 6 | 6 |
| true | 6 | 0 | 0 | 200 or more | 0 | true | | | | |

If it fails, run it once more (a slow machine can miss a frame). If it fails
twice, STOP and report the table and the messages; do not change the script
or the component to make it pass.

It also writes `gallery/.agent-shots/streaks-canvas.png` and `streaks-prints.png`. Open `streaks-prints.png` and confirm it shows five framed pictures of diagonal streaks: green, blue, pink, grey and violet.

The block (the script reads it):

<!-- file: check-streaks.mjs -->
````js
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../dist");
const roots = [process.env.A11Y_TOOLS, path.join(here, ".."), "/opt/node22/lib"].filter(Boolean);
let chromium;
for (const root of roots) {
  try { ({ chromium } = createRequire(path.join(root, "noop.js"))("playwright")); break; } catch { /* next root */ }
}
if (!chromium) { console.error("playwright not found: set A11Y_TOOLS (see the plan's Commands section)"); process.exit(2); }
if (!fs.existsSync(path.join(dist, "index.html"))) { console.error("no build: run npm run build --prefix gallery"); process.exit(2); }

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist + path.sep) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);

/* Every field's picture, as a short fingerprint of its canvas, in page order. A field that streams gives a different one two seconds later. */
const read = (page) => page.evaluate(() => [...document.querySelectorAll("[data-streaks] canvas")].map((c) => {
  const s = c.toDataURL();
  let h = 0;
  for (let i = 0; i < s.length; i += 7) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `${c.width}x${c.height}:${h}`;
}));
const changed = (a, b) => a.filter((t, i) => t !== b[i]).length;
const HERO = 5; // the hero is the sixth field in page order

const browser = await chromium.launch();
const rows = [];
let bad = 0;
const fail = (why) => { bad++; console.error(why); };
for (const reduce of [false, true]) {
  const page = await browser.newPage({ viewport: { width: 2560, height: 1600 }, reducedMotion: reduce ? "reduce" : "no-preference" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`http://localhost:${server.address().port}/index.html?look=flat#canvas`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelectorAll("[data-streaks] canvas").length === 6, null, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
  const fields = await page.evaluate(() => document.querySelectorAll("[data-streaks]").length);
  const running = await page.evaluate(() => document.querySelectorAll("[data-streaks][data-running]").length);
  const sizes = await page.evaluate(() => [...document.querySelectorAll("[data-streaks] canvas")].map((c) => c.width));
  const a = await read(page);
  await page.waitForTimeout(2000);
  const b = await read(page);
  const row = { reducedMotion: reduce, fields, running, changedIn2s: changed(a, b), smallestCanvas: Math.min(...sizes), errors: 0 };
  /* A new palette must show at once under reduced motion, and sweep in otherwise: either way the hero's picture changes. */
  await page.getByRole("button", { name: "Wakatake" }).click();
  await page.waitForTimeout(1200);
  const c = await read(page);
  row.heroRecoloured = c[HERO] !== b[HERO];
  if (!reduce) {
    /* Pause both pieces, then nothing may change; play them, and they change again. */
    for (const name of ["Pause the exposures", "Pause the exposure"]) await page.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(1200);
    const d = await read(page);
    await page.waitForTimeout(2000);
    const e = await read(page);
    row.changedWhilePaused = changed(d, e);
    row.runningWhilePaused = await page.evaluate(() => document.querySelectorAll("[data-streaks][data-running]").length);
    for (const name of ["Play the exposures", "Play the exposure"]) await page.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(600);
    const f = await read(page);
    await page.waitForTimeout(2000);
    const g = await read(page);
    row.changedAfterPlay = changed(f, g);
    /* Following the hand remounts the hero's field; it must come back streaming. */
    await page.getByRole("button", { name: "Follow the hand", exact: true }).click();
    await page.waitForTimeout(1500);
    row.fieldsWithHand = await page.evaluate(() => document.querySelectorAll("[data-streaks][data-running] canvas").length);
    await page.screenshot({ path: path.join(here, "streaks-canvas.png") });
    const box = await page.locator('[data-canvas-item="streaks-prints"]').boundingBox();
    if (box) await page.screenshot({ path: path.join(here, "streaks-prints.png"), clip: box });
  }
  row.errors = errors.length;
  await page.close();
  rows.push(row);
  const mode = reduce ? "reduced" : "motion";
  if (row.fields !== 6) fail(`${mode}: ${row.fields} fields, expected 6`);
  if (row.errors) fail(`${mode}: page errors: ${errors[0]}`);
  if (row.smallestCanvas < 200) fail(`${mode}: a field's canvas is only ${row.smallestCanvas}px wide: it sized itself from the zoomed box, not its layout box`);
  if (!row.heroRecoloured) fail(`${mode}: the hero did not change when Wakatake was picked`);
  if (reduce) {
    if (row.running !== 0) fail(`reduced: ${row.running} fields say they are running`);
    if (row.changedIn2s !== 0) fail(`reduced: ${row.changedIn2s} fields changed`);
  } else {
    if (row.running !== 6) fail(`motion: only ${row.running} of 6 fields are running`);
    if (row.changedIn2s !== 6) fail(`motion: only ${row.changedIn2s} of 6 fields changed in two seconds`);
    if (row.changedWhilePaused !== 0) fail(`motion: ${row.changedWhilePaused} fields changed while paused`);
    if (row.runningWhilePaused !== 0) fail(`motion: ${row.runningWhilePaused} fields still say they are running while paused`);
    if (row.changedAfterPlay !== 6) fail(`motion: only ${row.changedAfterPlay} fields changed after Play`);
    if (row.fieldsWithHand !== 6) fail(`motion: ${row.fieldsWithHand} of 6 fields streaming after Follow the hand`);
  }
}
await browser.close();
server.close();
console.table(rows);
console.log(bad ? `${bad} problem(s).` : "The exposures stream, pause, recolour, and hold still under reduced motion.");
process.exit(bad ? 1 : 0);
````

Commit the code now: `git add gallery/src/canvas/streaks.tsx gallery/src/canvas/registry.tsx` and commit with the message `gallery: long exposures, streaming, on the canvas`.

### Step 5: Add the section to `proposals/bokashi.md`

Take the section out of this plan and insert it before the heading `## After the decision`:

```bash
node gallery/.agent-shots/take.mjs plans/007-long-exposures-on-the-canvas.md proposal-section.md gallery/.agent-shots/proposal-section.md
sha256sum gallery/.agent-shots/proposal-section.md
node -e '
const fs = require("fs");
const p = "proposals/bokashi.md";
const s = fs.readFileSync(p, "utf8");
const add = fs.readFileSync("gallery/.agent-shots/proposal-section.md", "utf8");
const at = s.indexOf("## After the decision");
if (at < 0) throw new Error("heading not found");
if (s.includes("## A second candidate")) throw new Error("section already there");
fs.writeFileSync(p, s.slice(0, at) + add + s.slice(at));
'
```

**Verify**: the checksum is `bb16a38d89cc23d5b36a76edc6cba7dfb193208b8083c076f0a779a927319e3e`.
`git diff --stat -- proposals/bokashi.md` shows 37 insertions and 0 deletions. `grep -n '^## ' proposals/bokashi.md` lists, in order: `## What a sky is`, `## What moving costs`, `## Decisions`, `## A second candidate: long exposures`, `## After the decision`.

Commit: `git add proposals/bokashi.md`, message `proposals: long exposures as Flat's second candidate picture`.

The block (the script reads it):

<!-- file: proposal-section.md -->
````md
## A second candidate: long exposures

Nick, on seeing the skies, 2026-11-11: "Take inspo from my components repo". That repo (`litterthanlit/components`) has Gradient Keys: a launcher whose screen shows a long exposure, "a camera swung through foliage with the shutter open, in a traditional Japanese palette". It is a shader, not layers. Streaks fan from a point below and left of the frame, the fan turns slowly while the streaks flow along it, soft masses of light and dark drift behind, and thin glints pick out a few blades, in five stops from dark to light under a fine grain.

It is live on the canvas under the skies ("Long exposure · five palettes, streaming" and "Long exposure · Flat's hero, today and as a long exposure"; `gallery/src/canvas/streaks.tsx`). The two shaders are copied from Gradient Keys unchanged.

| Palette | From | What it is |
|---|---|---|
| Wakatake | Gradient Keys | young bamboo greens |
| Ai | Gradient Keys | indigo, fading to asagi |
| Sakura | Gradient Keys | cherry, fading to gofun, the shell white |
| Sumi | new here | ink, from full to paper |
| Fuji | new here | wisteria |

What it has that the skies lack:

- It is Nick's own picture, already drawn and tuned.
- It has no sun. The components repo's `DESIGN.md` asks artwork to stay "clear of red, orange and the accent so it never reads as a signal"; Dawn's and Evening's suns do not.
- A new palette sweeps in over 600ms without the picture restarting, and one field fills a frame of any shape.

What it costs that the skies do not:

- **It is WebGL.** Each picture is a canvas with a context of its own, and browsers allow about sixteen at once. A screen with a hero and a few covers is fine; a wall of them is not. Without WebGL it is a still gradient of its palette.
- **The gradient itself moves, and so does the grain.** The skies move layers by transform, so the R2 wording above ("by transform only, and its grain stays still") does not cover this. For long exposures R2's sentence would be: "A picture is content, not material: a picture that is itself a gradient (Flat's long exposures) may stream, grain included." R4's exception stands with "by transform only" removed.
- **Under a hand.** In Gradient Keys a hand lights the field under it and quickens it, and a press sends a ring. R2 says a gradient never follows the cursor, and the exception Nick chose covers a picture moving on its own. On the canvas the pictures only stream; the hero's Follow the hand button turns the rest on, so both can be felt.
- **Hex values.** A shader takes numbers, so the palettes are hex, marked as candidates. Picked palettes move into `tokens.css` as picture tokens (decision 6 becomes a yes).

| # | Question | Suggested | Decision |
|---|---|---|---|
| 8 | Skies, long exposures, or both? | Long exposures: they are Nick's already, and they suit Flat's airy look without a sun. Keep the skies on the canvas until this is settled, then remove the one not picked. | |
| 9 | Which palettes go in? | Sakura for the hero, with Ai and Wakatake. Sumi matches Flat's ink accent but is the least Japanese in colour; Fuji is optional. | |
| 10 | Does a picture answer a hand? | Not in Flat: it only streams. Try Follow the hand on the hero before deciding. | |
| 11 | The R2 wording for a streaming gradient, above | Approve or edit, with decision 4. | |
| 12 | Is the stream the right speed? | It runs at Gradient Keys' resting speed. If it is busy behind text, slow it before dimming it. | |

Whichever candidate is picked, the plan after the decision ships that one and removes the other from the canvas.

````

### Step 6: Final checks

Run, in order: `npm run verify --prefix gallery`, `npm run build --prefix gallery`, `node skills/litt-md/scripts/check.mjs`, `git diff --exit-code -- gallery/registry.lock.json`.

**Verify**: each exits 0; the skill checks end with `All checks passed.`; `git status --short` prints nothing except, at most, `plans/README.md`.

## Test plan

- No unit test: the canvas has none, and the page checks never visit it.
- The proof is Step 4's browser check, with motion allowed and reduced, and the reviewer's own look at the pictures.

## Done criteria

- [ ] `sha256sum gallery/src/canvas/streaks.tsx` matches Step 2
- [ ] `node gallery/.agent-shots/check-streaks.mjs` exits 0 with the two expected rows
- [ ] `npm run verify --prefix gallery` and `npm run build --prefix gallery` exit 0
- [ ] `node skills/litt-md/scripts/check.mjs` ends with `All checks passed.`
- [ ] `git diff --stat <starting commit> HEAD` lists only `gallery/src/canvas/streaks.tsx`, `gallery/src/canvas/registry.tsx` and `proposals/bokashi.md` (and `plans/README.md` if you maintain the index)
- [ ] `gallery/registry.lock.json` and `gallery/CHANGELOG.md` unchanged
- [ ] Two commits, with the messages above

## STOP conditions

Stop and report back (do not improvise) if:

- `gallery/src/canvas/bokashi.tsx` or `proposals/bokashi.md` is missing, or `registry.tsx` does not end with the two bokashi entries shown in "Current state".
- Any checksum differs from the one in its step.
- Typecheck or lint fails on `streaks.tsx`. Report the exact message; do not edit the file.
- The browser check fails twice.
- `verify` fails on anything, including a registry version or lock complaint: this plan must not change what the registry ships.
- The work seems to need a change to any file outside the scope.

## Maintenance notes

- **Two files hold one shader.** The vertex and fragment shaders in `streaks.tsx` are copies of the ones in `litterthanlit/components`, `src/registry/components/gradient-keys.tsx`. If Nick retunes Gradient Keys, copy the new shaders across; do not let the two drift apart unnoticed.
- **This is an experiment.** When Nick picks between the skies and the long exposures (`proposals/bokashi.md`, decisions 8 to 12), a later plan ships the picked one into Flat and deletes the other from the canvas. That plan must also move the picked palettes into `tokens.css`, write the rule wording into the profile through `workflows/evolve.md`, and place a pause control on each moving picture (WCAG 2.2.2).
- **Contexts are limited.** Each field owns a WebGL context, and a browser allows about sixteen. The canvas has six. A shipped screen should share one context between its pictures, or draw only the pictures on screen.
- **Sizing.** The field sizes its canvas from `clientWidth` and `clientHeight` because the language canvas zooms with a CSS transform. On an ordinary page either measure would do.
