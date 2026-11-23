/* Dither Card, after litterthanlit/components, redesigned in Flat: a row of project cards on the ground, each a white
   paper with its picture, a creature in three-tone ordered dither drawn in the ink (the art is the content). The card
   under the hand springs up and its picture quickens; a press sends a ring through it; the project's line is said once
   under the row, in words. The shader is the original's. */
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
    { title: "Wavr", line: "Shader code in, motion graphics out.", year: "2026", pattern: "butterfly" },
    { title: "Carson", line: "Learn a layout by wrecking one.", year: "2026", pattern: "jellyfish" },
    { title: "litt.works", line: "Prints and long-form pieces.", year: "2024–26", pattern: "bloom" },
  ];
  const FIRST = 350, STEP = 1400, PIXEL = 2, LIFT = 8;

  let swatch = null;
  function readInk(el) {
    swatch = swatch || document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!swatch) return [0.06, 0.06, 0.06];
    swatch.clearRect(0, 0, 1, 1); swatch.fillStyle = "#000"; swatch.fillStyle = getComputedStyle(el).color; swatch.fillRect(0, 0, 1, 1);
    const d = swatch.getImageData(0, 0, 1, 1).data;
    return [d[0] / 255, d[1] / 255, d[2] / 255];
  }

  function makeField(holder, pattern) {
    const canvas = document.createElement("canvas");
    holder.appendChild(canvas);
    const gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
    const state = { time: START[pattern], hover: 0, hoverTarget: 0, active: false, mouse: [0, 0], ripple: [0, 0, -1] };
    if (!gl) return { state, draw() {}, resize() {}, ink() {}, centre: () => [0, 0], toLocal: () => [0, 0], dispose() {} };
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
      resize() {
        /* Layout size, not the drawn box: the sheet grows out of its tile under a transform. */
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
    gl.uniform1f(U.pattern, PATTERNS[pattern]);
    f.ink(); f.resize(); f.draw();
    return f;
  }

  let uid = 0;
  FlatPlayer.register({
    slug: "dither-card",
    title: "Dither Card",
    tagline: "Project cards with a dithered creature on every one.",
    css: `
${S} .dc { width: min(100%, 300px); display: grid; gap: 14px; user-select: none; -webkit-user-select: none }
${S} .dc-row { list-style: none; margin: 0; padding: ${LIFT}px 0 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px }
${S} .dc-card { display: grid; gap: 8px; padding: 6px 6px 10px; border-radius: var(--r-paper); background: var(--paper); color: var(--ink);
  text-decoration: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; translate: 0 calc(var(--lift, 0) * -1px) }
${S} .dc-card:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px }
${S} .dc-press { display: grid; gap: 8px; transition: scale 150ms cubic-bezier(0.23, 1, 0.32, 1) }
${S} .dc-card:active .dc-press { scale: 0.96; transition-duration: 75ms }
${S} .dc-art { aspect-ratio: 1; border-radius: 10px; overflow: hidden; color: var(--ink) }
${S} .dc-art canvas { display: block; width: 100%; height: 100%; image-rendering: pixelated }
${S} .dc-name { padding: 0 4px; font-size: 13px; font-weight: 500; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
${S} .dc-say { margin: 0; min-height: 2.6em; text-align: center; font-size: 14px; line-height: 1.3; color: var(--muted); padding: 0 8px }
${S} .dc-say b { display: block; color: var(--ink); font-weight: 500 }
${S} .dc-say > span { display: block }
${S} .dc-say small { font-size: 0.8em; font-weight: 400; letter-spacing: 0; color: var(--muted) }
@container (min-width: 560px) {
  ${S} .dc { width: 600px; gap: 22px }
  ${S} .dc-row { gap: 16px; padding-top: ${LIFT * 2}px }
  ${S} .dc-card { padding: 10px 10px 14px; gap: 12px } ${S} .dc-press { gap: 12px }
  ${S} .dc-name { font-size: 16px; padding: 0 6px }
  ${S} .dc-say { font-size: 16px } ${S} .dc-say b { font-size: 28px; font-weight: 600; letter-spacing: -0.025em; margin-bottom: 4px }
}
`,
    mount(host, ctx) {
      const id = "fs-dc-" + ++uid;
      host.innerHTML = `
<div class="dc">
  <ul class="dc-row" aria-label="Projects">
    ${PROJECTS.map((p, i) => `<li><a class="dc-card" href="https://litt.design" target="_blank" rel="noreferrer" draggable="false" aria-describedby="${id}-${i}">
      <span class="dc-press"><span class="dc-art" aria-hidden="true"></span><span class="dc-name">${p.title}</span></span>
      <span id="${id}-${i}" hidden>${p.line} ${p.year}.</span><span class="sr-only">(opens in a new tab)</span></a></li>`).join("")}
  </ul>
  <p class="dc-say" aria-hidden="true"><span></span></p>
</div>`;
      const cards = [...host.querySelectorAll(".dc-card")], say = host.querySelector(".dc-say");
      const reduced = ctx.reduced();
      const fields = cards.map((c, i) => makeField(c.querySelector(".dc-art"), PROJECTS[i].pattern));
      const lifts = cards.map((c) => ctx.spring(0, (v) => c.style.setProperty("--lift", v.toFixed(2)), { duration: 0.35, bounce: 0.28 }));
      const sig = { signal: ctx.signal };
      const wide = () => host.clientWidth >= 560;

      /* One card is up at a time: the one under the hand, the one with focus, or the one the self-run is on. */
      let at = -1;
      function show(i) {
        if (i === at) return;
        if (at >= 0) lifts[at].set(0);
        at = i;
        if (i < 0) return;
        lifts[i].set(LIFT * (wide() ? 2 : 1));
        const p = PROJECTS[i];
        const next = document.createElement("span");
        next.innerHTML = `<b></b>`; next.firstChild.textContent = p.title + " "; const y = document.createElement("small"); y.textContent = p.year; next.firstChild.append(y); next.append(p.line);
        say.replaceChildren(next);
        if (!reduced && next.animate) next.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 210, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
      }

      function setActive(f, on) {
        const rising = on && !f.state.active; f.state.active = on;
        if (rising && !reduced) f.state.ripple = [...f.centre(), 0];
        if (reduced) still(f);
      }
      function still(f) {
        f.state.hover = f.state.hoverTarget || f.state.active ? 1 : 0;
        if (f.state.active && !f.state.hoverTarget) f.state.mouse = f.centre();
        f.draw();
      }

      cards.forEach((a, i) => {
        const f = fields[i], art = a.querySelector(".dc-art");
        a.addEventListener("pointermove", (e) => {
          if (e.pointerType === "mouse" && !e.movementX && !e.movementY) return;
          takeOver(); show(i);
        }, sig);
        a.addEventListener("pointerleave", () => { if (touched && at === i && document.activeElement !== a) show(-1); }, sig);
        art.addEventListener("pointermove", (e) => { f.state.mouse = f.toLocal(e); f.state.hoverTarget = 1; if (reduced) still(f); }, sig);
        art.addEventListener("pointerleave", () => { f.state.hoverTarget = 0; if (reduced) still(f); }, sig);
        a.addEventListener("pointerdown", (e) => { a.dataset.quiet = ""; if (!reduced) f.state.ripple = [...f.toLocal(e), 0]; }, sig);
        const check = () => setActive(f, a.matches(":focus-visible") && !a.hasAttribute("data-quiet"));
        a.addEventListener("focus", () => { show(i); check(); }, sig);
        a.addEventListener("keyup", () => { delete a.dataset.quiet; check(); }, sig);
        a.addEventListener("blur", () => { delete a.dataset.quiet; setActive(f, false); }, sig);
      });

      /* The self-run: a beat after mount it lifts the first card, then each next in turn, ringing each as it lands. */
      let ghost = !reduced, lit = -1, timer = 0, touched = false;
      function walk() {
        if (!ghost) return;
        if (lit >= 0) setActive(fields[lit], false);
        lit = (lit + 1) % PROJECTS.length;
        setActive(fields[lit], true); show(lit);
        timer = ctx.after(STEP, walk);
      }
      function takeOver() {
        if (touched) return;
        touched = true; ghost = false; clearTimeout(timer);
        if (lit >= 0) setActive(fields[lit], false);
        lit = -1;
      }
      ctx.onHand(takeOver);
      host.addEventListener("focusin", takeOver, sig);

      if (reduced) { fields.forEach(still); show(0); }
      else {
        timer = ctx.after(FIRST, walk);
        ctx.loop((dt) => {
          for (const f of fields) {
            const s = f.state, target = Math.max(s.hoverTarget, s.active ? 1 : 0);
            if (s.active && !s.hoverTarget) s.mouse = f.centre();
            s.hover += (target - s.hover) * (1 - Math.exp(-dt * (target > s.hover ? 10 : 5)));
            s.time += dt * (0.35 + s.hover * 1.1);
            if (s.ripple[2] >= 0) { s.ripple[2] += dt; if (s.ripple[2] > 1.6) s.ripple[2] = -1; }
            f.draw();
          }
        });
      }

      const reink = () => fields.forEach((f) => { f.ink(); f.draw(); });
      const mo = new MutationObserver(reink);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      matchMedia("(prefers-color-scheme: dark)").addEventListener("change", reink, sig);
      const ro = new ResizeObserver(() => fields.forEach((f) => { f.resize(); f.draw(); }));
      cards.forEach((c) => ro.observe(c.querySelector(".dc-art")));
      return { destroy() { mo.disconnect(); ro.disconnect(); lifts.forEach((l) => l.stop()); fields.forEach((f) => f.dispose()); } };
    },
  });
})();
