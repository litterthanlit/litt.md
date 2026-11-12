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
uniform float uStrength; // 0: as Gradient Keys draws it; 1: more presence

const float ZOOM = 1.35; // field units across the screen's shorter side

// Set by the field: how far along the palette's sweep this point is (0 sweeps first, 1 last).
float gSweep = 0.0;
// Set by the field: where it has a glint or a highlight, 0 to 1. Strength brightens these past the lightest stop.
float gGlint = 0.0;
// Field units per pixel, set before the field runs, so a field can fade detail finer than a pixel or two.
float gUnit = 0.0;

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
// Strength deepens the darkest stop and pushes the middle ones away from their own grey, in linear light.
vec3 richer(vec3 c, float k) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return max(vec3(l) + (c - l) * (1.0 + k * uStrength), 0.0);
}
vec3 stop0(float m) { return mix(toLinear(uFrom[0]), toLinear(uTo[0]), m) * (1.0 - 0.45 * uStrength); }
vec3 stop1(float m) { return richer(mix(toLinear(uFrom[1]), toLinear(uTo[1]), m), 0.3); }
vec3 stop2(float m) { return richer(mix(toLinear(uFrom[2]), toLinear(uTo[2]), m), 0.4); }
vec3 stop3(float m) { return richer(mix(toLinear(uFrom[3]), toLinear(uTo[3]), m), 0.25); }
vec3 stop4(float m) { return mix(toLinear(uFrom[4]), toLinear(uTo[4]), m); }
vec3 ramp(float v, float m) {
  float x = clamp(v, 0.0, 0.999) * 4.0;
  float f = smoothstep(0.0, 1.0, fract(x));
  if (x < 1.0) return mix(stop0(m), stop1(m), f);
  if (x < 2.0) return mix(stop1(m), stop2(m), f);
  if (x < 3.0) return mix(stop2(m), stop3(m), f);
  return mix(stop3(m), stop4(m), f);
}
// Strength steepens the tone curve: deeper darks, cleaner lights. At 0 it returns v as it is.
float tone(float v) {
  float c = clamp(v, 0.0, 1.0);
  return v + (c * c * (3.0 - 2.0 * c) - c) * 0.75 * uStrength;
}
`;

const MAIN = `
void main() {
  vec2 px = gl_FragCoord.xy;
  float unit = ZOOM / min(uRes.x, uRes.y); // field units per pixel
  vec2 p = (px - 0.5 * uRes) * unit;
  float t = uTime;
  gUnit = unit;

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
  v = tone(v);
  vec3 color = mix(ramp(v, m), stop4(m), light * 0.18);
  // Strength lifts the glints past the lightest stop.
  color = mix(color, stop4(m) * 1.35 + 0.03, clamp(gGlint, 0.0, 1.0) * 0.5 * uStrength);

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
  // A few thin glints where the light caught a blade. Strength: a few more, and brighter.
  float glint = smoothstep(0.68 - 0.05 * uStrength, 0.86 - 0.03 * uStrength, fbm(vec2(a * 70.0, r * 0.4 - t * 0.25) + uSeed * 9.7));
  float v = streak * 0.85 + fine * 0.25 + (mass - 0.5) * 0.85 - 0.04;
  // A new palette runs out along the streaks, from the fan's root to its tips.
  gSweep = clamp((r - 2.2) / 1.6, 0.0, 1.0);
  gGlint = glint;
  return smoothstep(0.08, 0.92, v) + glint * (0.18 + 0.12 * uStrength);
}
`,

  /* Ink dropped on water and combed: three drops push each other's rings outward, the stick has drawn long waves
     through them and the currents bend them. A new ring keeps rising in each drop, so the rings flow slowly out,
     and the water sways rather than drifts, so the drops stay in the frame. Each ring holds its own dilution. */
  suminagashi: `
float field(vec2 p, float t) {
  vec2 q = p + vec2(sin(t * 0.05 + uSeed), cos(t * 0.04 + uSeed)) * 0.12;
  q.x += sin(q.y * 3.1 + uSeed + t * 0.03) * 0.13;
  q.y += sin(q.x * 2.2 + uSeed * 2.0 - t * 0.025) * 0.08;
  vec2 w = vec2(fbm(q * 1.2 + vec2(uSeed, t * 0.04)), fbm(q * 1.2 + vec2(4.7 - t * 0.035, uSeed * 1.3)));
  q += (w - 0.5) * 0.9;
  vec2 c1 = vec2(-0.30, 0.25), c2 = vec2(0.42, -0.30), c3 = vec2(0.05, 0.70);
  float d1 = length(q - c1) + 0.1, d2 = length(q - c2) + 0.1, d3 = length(q - c3) + 0.1;
  float phi = log(d1) + 0.8 * log(d2) + 0.55 * log(d3);
  float rings = phi * 3.4 - t * 0.1;
  // How many rings a pixel spans: where they crowd, the edges soften and the rings even out, so nothing aliases.
  float perPx = 3.4 * (1.0 / d1 + 0.8 / d2 + 0.55 / d3) * gUnit;
  float dilution = hash(vec2(floor(rings + 0.5), uSeed + 3.0));
  float wave = 0.5 + 0.5 * cos(6.2832 * rings);
  float soft = 0.08 + perPx * 2.0;
  float ink = smoothstep(0.76 - soft, 0.76 + soft, wave);
  ink = mix(ink, 0.3, smoothstep(0.12, 0.4, perPx));
  float paper = 0.9 + (fbm(p * 1.6 + uSeed * 5.0) - 0.5) * 0.2;
  float v = paper - ink * (0.3 + 0.55 * dilution) * (0.85 + 0.15 * uStrength) - 0.08 * smoothstep(0.3, 0.7, dilution);
  // The ink pools where it was dropped: a soft dark heart in each drop.
  v -= (exp(-d1 * d1 * 18.0) + exp(-d2 * d2 * 18.0)) * 0.12;
  gSweep = clamp(phi * 0.25 + 0.6, 0.0, 1.0);
  gGlint = (1.0 - ink) * smoothstep(0.6, 1.0, fbm(q * 3.0 + t * 0.05)) * 0.4;
  return v;
}
`,

  /* Mist: a sky that deepens toward the top, two ranges of hills (the far one paler, as distance pales it), and
     long bands of mist sliding across their feet at their own speeds, alternate ones the other way. The bokashi
     gradation as a field. */
  kasumi: `
float field(vec2 p, float t) {
  float y = p.y;
  float aa = gUnit * 1.5;
  float v = mix(0.04, 0.9, pow(smoothstep(0.9, -0.15, y), 1.2));
  float m1 = fbm(vec2(p.x * 1.1 + uSeed * 3.0, 1.0));
  float m2 = fbm(vec2(p.x * 1.6 + uSeed * 5.0, 7.0));
  float r1 = -0.2 + 0.55 * m1 * m1;
  float r2 = -0.5 + 0.38 * m2 * m2;
  float hill1 = smoothstep(r1 + aa, r1 - aa, y);
  float hill2 = smoothstep(r2 + aa, r2 - aa, y);
  // Each range pales toward its foot, where the mist lies.
  v = mix(v, 0.42 + clamp((r1 - y) * 1.2, 0.0, 0.5), hill1);
  v = mix(v, 0.16 + clamp((r2 - y) * 0.8, 0.0, 0.3), hill2);
  float mist = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float yi = 0.22 - fi * 0.2 + 0.05 * sin(fi * 3.1 + uSeed);
    float dir = mod(fi, 2.0) * 2.0 - 1.0;
    float x = p.x - t * (0.06 + 0.025 * fi) * dir;
    float wob = (fbm(vec2(x * 0.7, fi * 5.3 + uSeed)) - 0.5) * 0.12;
    float th = 0.035 + 0.05 * fbm(vec2(x * 0.5 + 9.0, fi * 2.1));
    float d = (y - yi - wob) / th;
    float pieces = smoothstep(0.38, 0.62, fbm(vec2(x * 0.95 + fi * 13.0, fi + uSeed)));
    mist += exp(-d * d * d * d * 0.5) * pieces;
  }
  mist = clamp(mist, 0.0, 1.0);
  v = mix(v, 0.97, mist * (0.8 + 0.15 * uStrength));
  gSweep = clamp(0.55 - y * 0.5, 0.0, 1.0);
  gGlint = mist * 0.5;
  return v;
}
`,

  /* Light through leaves: large out-of-focus discs over dark foliage, in three depths, the nearer ones bigger,
     sharper and quicker. Each disc wanders a little about its place and slowly swells, and the light gathers at
     its rim, as a lens draws it. Overlaps add as light does, never past white. */
  komorebi: `
float field(vec2 p, float t) {
  float v = 0.02 + 0.2 * fbm(p * 1.1 + vec2(t * 0.02, 0.0) + uSeed) + 0.08 * fbm(p * 4.0 + uSeed * 2.0)
    + 0.16 * smoothstep(-0.9, 0.9, p.y + p.x * 0.4);
  float dark = 1.0;
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float scale = 2.1 - fl * 0.55;
    vec2 g = (p + vec2(t * (0.03 + 0.025 * fl), t * 0.012)) * scale + fl * 17.0 + uSeed;
    vec2 id = floor(g);
    vec2 f = fract(g);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 o = vec2(float(i), float(j));
        vec2 n = id + o;
        float h = hash(n + fl * 31.0);
        float h2 = hash(n * 1.7 + 5.0 + fl);
        float on = smoothstep(0.5, 0.75, h);
        vec2 c = o + 0.5 + 0.28 * vec2(sin(t * 0.13 + h2 * 6.28), cos(t * 0.11 + h * 6.28));
        float rad = (0.26 + 0.18 * h2) * (1.0 + 0.12 * sin(t * 0.4 + h * 6.28));
        float d = length(f - c);
        float aa = max(rad * (0.32 - 0.11 * fl), gUnit * scale * 2.0);
        float disc = 1.0 - smoothstep(rad - aa, rad, d);
        float rim = exp(-pow((d - rad * 0.86) / (rad * 0.16), 2.0));
        float b = disc * on * (0.35 + 0.45 * h2) * (0.55 + 0.25 * fl) * (0.8 + 0.3 * rim);
        dark *= 1.0 - clamp(b, 0.0, 0.95);
      }
    }
  }
  // The leaves between the sun and the lens shade some of it, swaying.
  float leaves = smoothstep(0.3, 0.85, fbm(p * 3.2 + vec2(sin(t * 0.07), cos(t * 0.05)) * 0.3 + uSeed * 4.0));
  float light = (1.0 - dark) * (1.0 - leaves * 0.25);
  v += light * (0.85 + 0.1 * uStrength);
  gSweep = clamp(0.5 - (p.x + p.y) * 0.3, 0.0, 1.0);
  gGlint = smoothstep(0.7, 0.95, light);
  return v;
}
`,

  /* Rain, after a woodblock print: fine streaks of different lengths falling at a slant, in three sheets over a
     soft gradation with a heavy band of sky at the top. The far sheet is paler than the air, the near one darker,
     longer and quicker. Lines finer than a few pixels fade into the ground rather than shimmer. */
  ame: `
float field(vec2 p, float t) {
  float v = 0.78 - 0.55 * smoothstep(-0.25, 0.85, p.y) + (fbm(p * vec2(0.6, 1.5) + vec2(t * 0.02, uSeed)) - 0.5) * 0.3;
  const float SLANT = 0.22;
  vec2 r = vec2(p.x * cos(SLANT) - p.y * sin(SLANT), p.x * sin(SLANT) + p.y * cos(SLANT));
  float rain = 0.0;
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float cols = 38.0 - fl * 11.0;
    float vis = smoothstep(2.5, 5.0, 1.0 / (cols * gUnit));
    float x = r.x * cols + fl * 0.37;
    float k = floor(x);
    float h = hash(vec2(k, fl + uSeed));
    float h2 = hash(vec2(k * 1.3, fl * 7.0 + 2.0));
    float fx = fract(x) - 0.5 + (h - 0.5) * 0.5;
    float w = max(0.05, (0.5 + 0.3 * fl) * gUnit * cols);
    float across = exp(-fx * fx / (w * w));
    float len = 0.24 + 0.3 * h2 + 0.18 * fl;
    float period = len * (1.8 + 2.2 * hash(vec2(k, 3.3 + fl)));
    float s = fract((r.y + t * (0.9 + 0.35 * fl + 0.2 * h) + h2 * 7.0) / period) * period;
    float along = smoothstep(0.0, 0.02, s) * smoothstep(len, len * 0.2, s);
    // The far sheet pale, the near ones dark.
    rain += across * along * vis * (fl < 0.5 ? -0.35 : 0.22 + 0.16 * fl);
  }
  v -= rain * (0.5 + 0.15 * uStrength);
  gSweep = clamp(0.5 - p.y * 0.5, 0.0, 1.0);
  gGlint = clamp(-rain, 0.0, 1.0);
  return v;
}
`,
} as const;

export type FieldKind = keyof typeof FIELD_SOURCES;

export const fragment = (kind: FieldKind) => HEAD + FIELD_SOURCES[kind] + MAIN;

/** The kinds of field, in the order the canvas shows them. */
export const FIELDS: { id: FieldKind; name: string; kanji: string; gloss: string; note: string }[] = [
  { id: "fan", name: "Nagashi", kanji: "流し", gloss: "the pan, as in nagashi-dori", note: "Nick's long exposure: a camera swung through foliage." },
  { id: "suminagashi", name: "Suminagashi", kanji: "墨流し", gloss: "floating ink", note: "Ink dropped on water and combed: nested rings, drifting." },
  { id: "kasumi", name: "Kasumi", kanji: "霞", gloss: "mist", note: "Bands of mist sliding over hills under a deepening sky." },
  { id: "komorebi", name: "Komorebi", kanji: "木漏れ日", gloss: "light through leaves", note: "Out-of-focus discs of light over foliage, slowly swelling." },
  { id: "ame", name: "Ame", kanji: "雨", gloss: "rain", note: "Fine rain falling at a slant, after a woodblock print." },
];
