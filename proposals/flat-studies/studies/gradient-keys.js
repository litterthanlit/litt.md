/* Gradient Keys, after litterthanlit/components, redesigned for Flat (round 2).
   The product underneath is a cover picker: choose the header art for a site or a letter. One cover on paper,
   live, the original's long-exposure shader (noise fanned from below left, flowing along and turning across); the
   palette's name under it as the one large figure; three swatch circles to pick from, the chosen one standing
   larger with a tick. A new palette runs out along the streaks from the swatch that chose it. */
(function () {
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
vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
vec3 stop0(float m) { return mix(toLinear(uFrom[0]), toLinear(uTo[0]), m); }
vec3 stop1(float m) { return mix(toLinear(uFrom[1]), toLinear(uTo[1]), m); }
vec3 stop2(float m) { return mix(toLinear(uFrom[2]), toLinear(uTo[2]), m); }
vec3 stop3(float m) { return mix(toLinear(uFrom[3]), toLinear(uTo[3]), m); }
vec3 stop4(float m) { return mix(toLinear(uFrom[4]), toLinear(uTo[4]), m); }
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
  color = toSrgb(color) + (hash(px + fract(uTime * 7.0) * 113.0) - 0.5) * 0.04;
  gl_FragColor = vec4(color, 1.0);
}`;

  /* Artwork, not tokens: five sRGB stops, dark to light. The palettes are the content. */
  const COVERS = [
    { name: "Wakatake", line: "Young bamboo, through the leaves", palette: ["#264d35", "#3b6e4e", "#6da47a", "#a9cba3", "#e1ecdc"] },
    { name: "Ai", line: "Indigo, fading to asagi blue", palette: ["#16213d", "#1f2f54", "#3f5f8f", "#7fa6c2", "#c9dde6"] },
    { name: "Sakura", line: "Cherry blossom, fading to shell white", palette: ["#b06e7c", "#d796a6", "#e9b5c1", "#f5d8de", "#fbf2ee"] },
  ];
  const FADE = 0.6, STEP = 2000, SEED = 2;
  const toStops = (pal) => pal.flatMap((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));
  const blend = (from, to, m) => from.map((c, i) => Math.pow(Math.pow(c, 2.2) * (1 - m) + Math.pow(to[i], 2.2) * m, 1 / 2.2));
  const fallback = (pal) => "linear-gradient(60deg, " + pal.join(", ") + ")";

  /* One streak field on its own canvas. The study's single loop calls frame(dt). */
  function field(holder, palette, seed, reduced, signal) {
    const canvas = document.createElement("canvas");
    canvas.className = "gk-canvas";
    holder.appendChild(canvas);
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: true });
    const first = toStops(palette);
    const st = { time: 0, hover: 0, hoverTarget: 0, mouse: [0, 0], ripple: [0, 0, -1], from: first, to: first, mix: 1, active: false, paused: false };
    const api = { st, frame() {}, recolour() {}, ringAt() {}, still() {}, destroy() { canvas.remove(); } };
    if (!gl) return api;
    const comp = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, comp(gl.VERTEX_SHADER, VERTEX)); gl.attachShader(prog, comp(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = (n) => gl.getUniformLocation(prog, n);
    const U = { res: u("uRes"), time: u("uTime"), mouse: u("uMouse"), hover: u("uHover"), ripple: u("uRipple"), seed: u("uSeed"), from: u("uFrom"), to: u("uTo"), mix: u("uMix") };
    const centre = () => [canvas.width / 2, canvas.height / 2];
    const eased = () => st.mix * st.mix * (3 - 2 * st.mix);
    function resize() {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(U.res, canvas.width, canvas.height);
      if (!st.hoverTarget) st.mouse = centre();
    }
    function draw() {
      gl.uniform1f(U.time, st.time); gl.uniform2fv(U.mouse, st.mouse); gl.uniform1f(U.hover, st.hover);
      gl.uniform3fv(U.ripple, st.ripple); gl.uniform3fv(U.from, st.from); gl.uniform3fv(U.to, st.to); gl.uniform1f(U.mix, st.mix);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    api.frame = (dt) => {
      const target = Math.max(st.hoverTarget, st.active ? 1 : 0);
      if (st.active && !st.hoverTarget) st.mouse = centre();
      st.hover += (target - st.hover) * (1 - Math.exp(-dt * (target > st.hover ? 10 : 5)));
      if (!st.paused) st.time += dt * (0.35 + st.hover * 1.1);
      if (st.ripple[2] >= 0) { st.ripple[2] += dt; if (st.ripple[2] > 1.6) st.ripple[2] = -1; }
      if (st.mix < 1) st.mix = Math.min(1, st.mix + dt / FADE);
      draw();
    };
    api.still = () => { st.hover = st.hoverTarget || st.active ? 1 : 0; if (st.active && !st.hoverTarget) st.mouse = centre(); draw(); };
    api.ringAt = (fx, fy) => { if (!reduced) st.ripple = [fx * canvas.width, (1 - fy) * canvas.height, 0]; };
    api.recolour = (pal) => { st.from = blend(st.from, st.to, eased()); st.to = toStops(pal); st.mix = reduced ? 1 : 0; if (reduced) api.still(); };
    const local = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * canvas.width, (1 - (e.clientY - r.top) / r.height) * canvas.height]; };
    holder.addEventListener("pointermove", (e) => { st.mouse = local(e); st.hoverTarget = 1; if (reduced) api.still(); }, { signal });
    holder.addEventListener("pointerleave", () => { st.hoverTarget = 0; if (reduced) api.still(); }, { signal });
    holder.addEventListener("pointerdown", (e) => { if (!reduced) st.ripple = local(e).concat(0); }, { signal });
    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);
    gl.uniform1f(U.seed, seed);
    resize(); draw();
    api.destroy = () => { ro.disconnect(); const x = gl.getExtension("WEBGL_lose_context"); if (x) x.loseContext(); canvas.remove(); };
    return api;
  }

  const SPRING = "linear(0, 0.0897, 0.2671, 0.4643, 0.6434, 0.7874, 0.8925, 0.9624, 1.004, 1.0249, 1.0322, 1.0295, 1.0237, 1.0173, 1.0115, 1.0068, 1.0034, 1.0012, 0.9998, 0.9992, 1)";
  const TICK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 10.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  FlatPlayer.register({
    slug: "gradient-keys",
    title: "Gradient Keys",
    tagline: "Pick a cover: long exposures in Japanese palettes.",
    css: `
.fs-gradient-keys .gk { width: min(100%, 580px); user-select: none; -webkit-user-select: none; font-family: var(--font) }
.fs-gradient-keys .gk-paper { background: var(--paper); border-radius: var(--r-paper); padding: 12px; display: grid; gap: 14px }
.fs-gradient-keys .gk-cover { position: relative; aspect-ratio: 2 / 1; border-radius: 6px; overflow: hidden; -webkit-touch-callout: none; cursor: pointer }
.fs-gradient-keys .gk-field { position: absolute; inset: 0 }
.fs-gradient-keys .gk-canvas { display: block; width: 100%; height: 100% }
.fs-gradient-keys .gk-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 6px 6px }
.fs-gradient-keys .gk-words { min-width: 0 }
.fs-gradient-keys .gk-name { margin: 0; font-size: clamp(24px, 6.5cqw, 34px); font-weight: 600; line-height: 1.05; letter-spacing: -0.02em; color: var(--ink) }
.fs-gradient-keys .gk-line { margin: 4px 0 0; font-size: 13px; line-height: 1.3; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-gradient-keys .gk-words.is-new { animation: gk-in 220ms cubic-bezier(0.23, 1, 0.32, 1) }
@keyframes gk-in { from { opacity: 0; transform: translateY(6px) } }
.fs-gradient-keys .gk-swatches { flex: none; display: flex; align-items: center; gap: 4px }
.fs-gradient-keys .gk-sw { all: unset; box-sizing: border-box; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; cursor: pointer; -webkit-tap-highlight-color: transparent }
.fs-gradient-keys .gk-sw i { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; transform: scale(0.7);
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1) }
.fs-gradient-keys .gk-sw i svg { width: 20px; height: 20px; opacity: 0; transform: scale(0.6); transition: opacity 120ms ease-out, transform 120ms ease-out }
.fs-gradient-keys .gk-sw[aria-checked="true"] i { transform: scale(1); transition: transform 420ms ${SPRING} }
.fs-gradient-keys .gk-sw[aria-checked="true"] i svg { opacity: 1; transform: scale(1); transition-delay: 60ms }
.fs-gradient-keys .gk-sw:active i { transform: scale(0.64) }
.fs-gradient-keys .gk-sw[aria-checked="true"]:active i { transform: scale(0.94) }
.fs-gradient-keys .gk-sw:focus-visible { outline: 2px solid var(--ink); outline-offset: 0 }
.fs-gradient-keys.is-tile .gk-line { display: none }
.fs-gradient-keys.is-tile .gk-name { font-size: 24px }
.fs-gradient-keys.is-tile .gk-paper { gap: 10px }
@container (max-width: 380px) {
  .fs-gradient-keys .gk-sw { width: 36px; height: 36px } .fs-gradient-keys .gk-sw i { width: 32px; height: 32px } .fs-gradient-keys .gk-sw i svg { width: 16px; height: 16px }
  .fs-gradient-keys .gk-swatches { gap: 2px }
}
@media (prefers-reduced-motion: reduce) { .fs-gradient-keys .gk-sw i, .fs-gradient-keys .gk-sw i svg { transition: none } .fs-gradient-keys .gk-words.is-new { animation: none } }
`,
    mount(host, ctx) {
      const reduced = ctx.reduced(), S = ctx.signal;
      host.innerHTML = `
<div class="gk">
  <div class="gk-paper">
    <div class="gk-cover" role="img"><span class="gk-field" aria-hidden="true"></span></div>
    <div class="gk-row">
      <div class="gk-words" aria-hidden="true"><p class="gk-name"></p><p class="gk-line"></p></div>
      <div class="gk-swatches" role="radiogroup" aria-label="Cover"></div>
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const $ = (q) => host.querySelector(q);
      const cover = $(".gk-cover"), words = $(".gk-words"), nameEl = $(".gk-name"), lineEl = $(".gk-line"), group = $(".gk-swatches"), live = $("[aria-live]"), paper = $(".gk-paper");
      let at = 0;
      cover.style.background = fallback(COVERS[0].palette);
      const f = field($(".gk-field"), COVERS[0].palette, SEED, reduced, S);
      const sws = COVERS.map((c, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "gk-sw"; b.setAttribute("role", "radio"); b.setAttribute("aria-label", c.name + ", " + c.line);
        b.innerHTML = "<i>" + TICK + "</i>";
        const dot = b.firstChild;
        dot.style.background = "linear-gradient(135deg, " + c.palette[0] + ", " + c.palette[2] + " 55%, " + c.palette[4] + ")";
        dot.style.color = i === 2 ? c.palette[0] : "#ffffff"; // the tick reads on its own swatch
        group.appendChild(b);
        return b;
      });

      function select(i, say) {
        const changed = i !== at;
        at = i;
        const c = COVERS[i];
        sws.forEach((b, j) => { b.setAttribute("aria-checked", String(j === i)); b.tabIndex = j === i ? 0 : -1; });
        cover.setAttribute("aria-label", "Cover: " + c.name + ", " + c.line);
        nameEl.textContent = c.name; lineEl.textContent = c.line;
        if (changed) {
          words.classList.remove("is-new"); void words.offsetWidth; words.classList.add("is-new");
          f.recolour(c.palette); cover.style.background = fallback(c.palette);
          /* The new palette rings out from the edge nearest the swatch that chose it. */
          const r = cover.getBoundingClientRect(), s = sws[i].getBoundingClientRect();
          if (r.width) f.ringAt(Math.min(1, Math.max(0, (s.left + s.width / 2 - r.left) / r.width)), 0.98);
        }
        if (say) live.textContent = c.name + ". " + c.line + ".";
      }
      select(0, false);

      /* The self-run: the choice steps on every 2 s until a hand arrives (in a wall tile it never does). */
      let cycling = !reduced;
      const stop = () => { cycling = false; };
      ctx.onHand(stop);
      paper.addEventListener("pointermove", (e) => { if (!ctx.tile && (e.pointerType !== "mouse" || e.movementX || e.movementY)) stop(); }, { signal: S });
      paper.addEventListener("focusin", stop, { signal: S });
      if (cycling) ctx.every(STEP, () => { if (cycling) select((at + 1) % COVERS.length, false); });

      sws.forEach((b, i) => {
        b.addEventListener("click", () => select(i, true), { signal: S });
        b.addEventListener("keydown", (e) => {
          const n = COVERS.length;
          const next = { ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i + n - 1) % n, ArrowUp: (i + n - 1) % n, Home: 0, End: n - 1 }[e.key];
          if (next === undefined) return;
          e.preventDefault();
          select(next, true); sws[next].focus();
        }, { signal: S });
      });

      if (reduced) f.still();
      else ctx.loop((dt) => { f.frame(Math.min(0.05, dt)); });
      return { destroy() { f.destroy(); } };
    },
  });
})();
