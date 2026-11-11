/**
 * The long exposures' shaders, in three parts: a head every field shares (the uniforms, the noise, the five-stop ramp
 * in linear light), one `field` function per kind of picture, and a main that every field shares (the press ring, the
 * palette sweep, the hand's light and the grain). A program is the head, one field and the main.
 *
 * The fan is Nick's, from Gradient Keys (github.com/litterthanlit/components, src/registry/components/gradient-keys.tsx),
 * cut into these parts and otherwise unchanged. If Nick retunes Gradient Keys, copy the change across.
 */

export const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const HEAD = `
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

// Set by the field: how far along the palette's sweep this point is (0 sweeps first, 1 last).
float gSweep = 0.0;

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
`;

const MAIN = `
void main() {
  vec2 px = gl_FragCoord.xy;
  float unit = ZOOM / min(uRes.x, uRes.y); // field units per pixel
  vec2 p = (px - 0.5 * uRes) * unit;
  float t = uTime;

  // A press: a ring that widens and fades, pushing the field aside as it passes.
  float band = 0.0;
  if (uRipple.z >= 0.0) {
    vec2 dir = p - (uRipple.xy - 0.5 * uRes) * unit;
    float rad = uRipple.z * 1.4 * ZOOM;
    band = exp(-pow((length(dir) - rad) / (0.07 * ZOOM), 2.0)) * exp(-uRipple.z * 2.2);
    p += normalize(dir + 1e-4) * band * 0.09 * ZOOM;
  }

  float v = field(p, t);

  // A new palette runs out across the field, in the order the field gives.
  float m = smoothstep(0.0, 1.0, clamp(uMix * 1.6 - gSweep * 0.6, 0.0, 1.0));

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

/** Each kind of field is one function: a point in field units and the time in, a tone from dark (0) to light (1) out. */
export const FIELD_SOURCES = {
  /* Nick's long exposure, from Gradient Keys: streaks fan from a point below and left of the screen. It keeps
     turning, so the streaks sweep across the screen as well as flowing along it. */
  fan: `
float field(vec2 p, float t) {
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
  // A new palette runs out along the streaks, from the fan's root to its tips.
  gSweep = clamp((r - 2.2) / 1.6, 0.0, 1.0);
  return smoothstep(0.08, 0.92, v) + glint * 0.18;
}
`,
} as const;

export type FieldKind = keyof typeof FIELD_SOURCES;

export const fragment = (kind: FieldKind) => HEAD + FIELD_SOURCES[kind] + MAIN;
