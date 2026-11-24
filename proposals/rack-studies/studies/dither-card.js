/* Dither Card, after litterthanlit/components, in Rack 2.0: three projects on one surface, each an object in its own
   colour (tint, 1px edge in the hue, name in the hue's text) holding its dithered art in the hue. The picked one gets a
   second edge and plays; the strip holds Play (the one yellow), its size and Open. The shader is the original's. */
(function () {
  const S = ".fs-dither-card";
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

  const PATTERNS = { butterfly: 0, jellyfish: 1, bloom: 2 };
  const START = { butterfly: (4 * Math.PI) / 2.4, jellyfish: (3.5 * Math.PI) / 2.2, bloom: 3 };
  const PROJECTS = [
    { title: "Wavr", line: "Shader code in, motion graphics out.", hue: "blue", pattern: "butterfly", size: "1080 × 1080", length: "8.0 s", frames: "240", updated: "2 h ago" },
    { title: "Carson", line: "Learn a layout by wrecking one.", hue: "orange", pattern: "jellyfish", size: "1440 × 900", length: "12.0 s", frames: "360", updated: "Yesterday" },
    { title: "litt.works", line: "Prints and long-form pieces.", hue: "purple", pattern: "bloom", size: "2480 × 3508", length: "6.0 s", frames: "180", updated: "3 d ago" },
  ];
  const PIXEL = 2, TICK = 600, GHOST = 2400;

  let swatch = null;
  function readInk(el) {
    swatch = swatch || document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!swatch) return [0.5, 0.5, 0.5];
    swatch.clearRect(0, 0, 1, 1); swatch.fillStyle = "#000"; swatch.fillStyle = getComputedStyle(el).color; swatch.fillRect(0, 0, 1, 1);
    const d = swatch.getImageData(0, 0, 1, 1).data;
    return [d[0] / 255, d[1] / 255, d[2] / 255];
  }

  function makeField(holder, pattern) {
    const canvas = document.createElement("canvas");
    holder.prepend(canvas);
    const gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
    const state = { time: START[pattern], hover: 0, hoverTarget: 0, mouse: [0, 0], ripple: [0, 0, -1] };
    if (!gl) return { state, draw() {}, resize() {}, ink() {}, pattern() {}, centre: () => [0, 0], toLocal: () => [0, 0], dispose() {} };
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const program = gl.createProgram();
    gl.attachShader(program, sh(gl.VERTEX_SHADER, VERTEX)); gl.attachShader(program, sh(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program); gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = (n) => gl.getUniformLocation(program, n);
    const U = { res: u("uRes"), time: u("uTime"), mouse: u("uMouse"), hover: u("uHover"), ripple: u("uRipple"), pattern: u("uPattern"), ink: u("uInk") };
    const centre = () => [canvas.width / 2, canvas.height / 2];
    const f = {
      state, centre,
      ink() { gl.uniform3fv(U.ink, readInk(canvas)); },
      pattern(p) { gl.uniform1f(U.pattern, PATTERNS[p]); state.time = START[p]; },
      resize() {
        canvas.width = Math.max(1, Math.round(canvas.clientWidth / PIXEL)); canvas.height = Math.max(1, Math.round(canvas.clientHeight / PIXEL));
        gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(U.res, canvas.width, canvas.height);
        if (!state.hoverTarget) state.mouse = centre();
      },
      draw() {
        gl.uniform1f(U.time, state.time); gl.uniform2fv(U.mouse, state.mouse); gl.uniform1f(U.hover, state.hover);
        gl.uniform3fv(U.ripple, state.ripple); gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      toLocal(e) {
        const r = canvas.getBoundingClientRect();
        return [((e.clientX - r.left) / r.width) * canvas.width, (1 - (e.clientY - r.top) / r.height) * canvas.height];
      },
      dispose() { const x = gl.getExtension("WEBGL_lose_context"); if (x) x.loseContext(); canvas.remove(); },
    };
    f.pattern(pattern); f.ink(); f.resize(); f.draw();
    return f;
  }


  const PLAY = '<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M1.5 1v6l5-3z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M1.5 1h2v6h-2zM4.5 1h2v6h-2z"/></svg>';
  let uid = 0;

  FlatPlayer.register({
    slug: "dither-card",
    title: "Dither Card",
    tagline: "Projects with a dithered preview each; the one you pick plays.",
    css: `
${S} .pb { width: min(100%, 330px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px; user-select: none; -webkit-user-select: none }
${S} .pb-strip { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 6px; background: var(--panel-2) }
${S} .pb-strip b { font-weight: 600; margin-right: auto }
${S} .pb-key, ${S} .pb-open { all: unset; box-sizing: border-box; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--r-control);
  background: var(--block); box-shadow: var(--edge); color: var(--ink); font: 600 11px/1 var(--font); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out) }
${S} .pb-key { width: 22px } ${S} .pb-key svg { width: 8px; height: 8px; fill: currentColor }
${S} .pb-open { padding: 0 8px; text-decoration: none }
${S} .pb-key:hover, ${S} .pb-open:hover { background: var(--block-hover) }
${S} .pb-key:active, ${S} .pb-open:active { box-shadow: var(--edge-press); scale: 0.98 }
${S} .pb-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
${S} .pb-size { height: 22px; display: inline-flex; align-items: center; padding: 0 6px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px/1 var(--mono); font-variant-numeric: tabular-nums; white-space: nowrap }
${S} .pb-key:focus-visible, ${S} .pb-open:focus-visible, ${S} .pb-p:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px }
${S} .pb-surface { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; padding: 14px }
${S} .pb-p { all: unset; box-sizing: border-box; display: grid; grid-template-rows: auto 1fr; gap: 4px; padding: 6px; min-width: 0; border-radius: var(--r-control); cursor: pointer;
  background: var(--tint); box-shadow: inset 0 0 0 1px var(--hue); color: var(--text); transition: box-shadow var(--cut-in) var(--ease-out) }
${S} .pb-p[aria-checked="true"] { box-shadow: inset 0 0 0 1px var(--hue), 0 0 0 2px var(--hue) }
${S} .pb-p:active { scale: 0.98 }
${S} .pb-name { font: 600 11px/1 var(--font); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
${S} .pb-art { position: relative; aspect-ratio: 1; color: var(--hue) }
${S} .pb-art canvas { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated }
@container (min-width: 560px) {
  ${S} .pb { width: 600px } ${S} .pb-surface { gap: 14px; padding: 16px } ${S} .pb-p { padding: 8px; gap: 6px } ${S} .pb-name { font-size: 12px }
}
`,
    mount(host, ctx) {
      const id = "fs-pb3-" + ++uid;
      const hueVars = (p) => `--hue: var(--clip-${p.hue}); --tint: var(--clip-${p.hue}-tint); --text: var(--clip-${p.hue}-text)`;
      host.innerHTML = `
<section class="pb" aria-labelledby="${id}">
  <div class="pb-strip">
    <button type="button" class="pb-key" aria-pressed="false" aria-label="Play preview">${PLAY}</button>
    <b id="${id}">Projects</b>
    <span class="pb-size" aria-hidden="true"></span>
    <a class="pb-open" href="https://litt.design" target="_blank" rel="noreferrer">Open<span class="sr-only"> project (opens in a new tab)</span></a>
  </div>
  <div class="pb-surface" role="radiogroup" aria-labelledby="${id}">
    ${PROJECTS.map((p, i) => `<button type="button" class="pb-p" role="radio" aria-checked="false" tabindex="-1" style="${hueVars(p)}" aria-label="${p.title}, ${p.size}" aria-describedby="${id}-d${i}">
      <span class="pb-name" aria-hidden="true">${p.title}</span><span class="pb-art" aria-hidden="true"></span><span id="${id}-d${i}" hidden>${p.line}</span></button>`).join("")}
  </div>
  <p class="sr-only" aria-live="polite"></p>
</section>`;
      const items = [...host.querySelectorAll(".pb-p")], size = host.querySelector(".pb-size"), playKey = host.querySelector(".pb-key");
      const live = host.querySelector("[aria-live]");
      const reduced = ctx.reduced();
      const fields = items.map((el, i) => makeField(el.querySelector(".pb-art"), PROJECTS[i].pattern));
      const sig = { signal: ctx.signal };

      /* One project is picked: its edge doubles on the frame, its size shows in the strip, and only it plays. */
      let at = -1, playing = false;
      function choose(i, user) {
        if (i === at) return;
        at = i;
        items.forEach((el, j) => { el.setAttribute("aria-checked", j === i ? "true" : "false"); el.tabIndex = j === i ? 0 : -1; });
        size.textContent = PROJECTS[i].size;
        if (!reduced) fields[i].state.ripple = [...fields[i].centre(), 0];
        if (user) live.textContent = `${PROJECTS[i].title}, ${PROJECTS[i].size}`;
      }
      function setPlaying(on) {
        playing = on && !reduced;
        playKey.setAttribute("aria-pressed", playing ? "true" : "false");
        playKey.setAttribute("aria-label", playing ? "Pause preview" : "Play preview");
        playKey.innerHTML = playing ? PAUSE : PLAY;
      }
      choose(0); setPlaying(true);

      items.forEach((el, i) => {
        const f = fields[i], art = el.querySelector(".pb-art");
        el.addEventListener("click", () => choose(i, true), sig);
        art.addEventListener("pointermove", (e) => { f.state.mouse = f.toLocal(e); f.state.hoverTarget = 1; }, sig);
        art.addEventListener("pointerleave", () => (f.state.hoverTarget = 0), sig);
      });
      host.querySelector(".pb-surface").addEventListener("keydown", (e) => {
        const n = PROJECTS.length;
        const to = { ArrowRight: at + 1, ArrowDown: at + 1, ArrowLeft: at - 1, ArrowUp: at - 1, Home: 0, End: n - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault(); choose((to + n) % n, true); items[at].focus();
      }, sig);
      playKey.addEventListener("click", () => setPlaying(!playing), sig);

      /* The ghost walks the projects; each pick lands on the next tick. A hand ends it for good. */
      let ghost = !reduced, wait = 0;
      ctx.onHand(() => { ghost = false; clearTimeout(wait); });
      if (!reduced) ctx.every(GHOST, () => {
        if (!ghost) return;
        const next = (at + 1) % PROJECTS.length;
        wait = ctx.after(TICK - (performance.now() % TICK), () => { if (ghost) choose(next); });
      });

      if (reduced) fields.forEach((f) => f.draw());
      else ctx.loop((dt) => {
        fields.forEach((f, i) => {
          const s = f.state;
          s.hover += (s.hoverTarget - s.hover) * (1 - Math.exp(-dt * 20));
          if (i === at && playing) s.time += dt * 1.2;
          if (s.ripple[2] >= 0) { s.ripple[2] += dt; if (s.ripple[2] > 1.6) s.ripple[2] = -1; }
          f.draw();
        });
      });

      const reink = () => fields.forEach((f) => { f.ink(); f.draw(); });
      const mo = new MutationObserver(reink);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      matchMedia("(prefers-color-scheme: dark)").addEventListener("change", reink, sig);
      const ro = new ResizeObserver(() => fields.forEach((f) => { f.resize(); f.draw(); }));
      host.querySelectorAll(".pb-art").forEach((el) => ro.observe(el));
      return { destroy() { mo.disconnect(); ro.disconnect(); fields.forEach((f) => f.dispose()); } };
    },
  });
})();
