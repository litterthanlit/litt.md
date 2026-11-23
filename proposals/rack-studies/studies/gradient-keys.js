/* Gradient Keys, after litterthanlit/components, redesigned in Rack.
   The product underneath is a look launcher for a video or motion tool: a preview device beside a column of clips,
   each a look (a long exposure in a traditional Japanese palette). Launching a clip queues it, and on the next tick the
   preview cuts to it, as Live launches a clip on its quantise. The playing clip's bar runs with the clock. The clips
   wear the hue of their palette (green, blue, pink); the preview's power is the one lit key. The streaks are the
   original's WebGL shader, the work that moves; the palette change is a cut, not a sweep. */
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

  /* Artwork, not tokens: five sRGB stops, dark to light. The looks are the content; each clip wears the hue nearest it. */
  const LOOKS = [
    { name: "Wakatake", line: "Young bamboo greens", hue: "green", palette: ["#264d35", "#3b6e4e", "#6da47a", "#a9cba3", "#e1ecdc"] },
    { name: "Ai", line: "Indigo to asagi", hue: "blue", palette: ["#16213d", "#1f2f54", "#3f5f8f", "#7fa6c2", "#c9dde6"] },
    { name: "Sakura", line: "Cherry blossom to gofun", hue: "pink", palette: ["#b06e7c", "#d796a6", "#e9b5c1", "#f5d8de", "#fbf2ee"] },
  ];
  const FADE = 0.1, SEED = 2;
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
    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);
    gl.uniform1f(U.seed, seed);
    resize(); draw();
    api.destroy = () => { ro.disconnect(); const x = gl.getExtension("WEBGL_lose_context"); if (x) x.loseContext(); canvas.remove(); };
    return api;
  }

  const TICK = 0.5, LOOP = 4, GHOST = 2; /* s: switches land on the next tick; a look loops every 4 s */
  const PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1v8l7-4z"/></svg>';
  const STOP = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="2" y="2" width="6" height="6"/></svg>';

  FlatPlayer.register({
    slug: "gradient-keys",
    title: "Gradient Keys",
    tagline: "Launch a look: long exposures in Japanese palettes, on the next tick.",
    css: `
.fs-gradient-keys .rk { width: min(100%, 680px); background: var(--body); border-radius: var(--r-panel); padding: 3px; display: grid; grid-template-columns: 1fr; gap: 3px;
  font-family: var(--font); user-select: none; -webkit-user-select: none; container-type: inline-size }
.fs-gradient-keys .rk-panel { background: var(--panel); border-radius: var(--r-panel); overflow: hidden; min-width: 0 }
.fs-gradient-keys .rk-strip { display: flex; align-items: center; gap: 6px; padding: 4px 4px 4px 8px; background: var(--panel-2); min-height: 30px }
.fs-gradient-keys .rk-name { font-size: 12px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; margin-right: auto }
.fs-gradient-keys .rk-box { height: 22px; display: inline-flex; align-items: center; padding: 0 6px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 500 11px/1 var(--mono); font-variant-numeric: tabular-nums; color: var(--ink); white-space: nowrap }
.fs-gradient-keys .rk-key { all: unset; box-sizing: border-box; display: grid; place-items: center; height: 22px; padding: 0 8px; border-radius: var(--r-control); background: var(--block);
  box-shadow: var(--edge); font: 500 11px/1 var(--font); color: var(--ink); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out) }
.fs-gradient-keys .rk-key:hover { background: var(--block-hover) }
.fs-gradient-keys .rk-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-gradient-keys .rk-key.is-lit { background: var(--accent); color: var(--accent-fg) }
.fs-gradient-keys .rk-key:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px }
.fs-gradient-keys .rk-screen { position: relative; margin: 6px; aspect-ratio: 16 / 9; border-radius: var(--r-control); overflow: hidden; background: var(--slot) }
.fs-gradient-keys .gk-field { position: absolute; inset: 0 }
.fs-gradient-keys .gk-canvas { display: block; width: 100%; height: 100% }
.fs-gradient-keys .rk-clips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; padding: 6px }
.fs-gradient-keys .rk-clip { all: unset; box-sizing: border-box; position: relative; display: grid; grid-template-columns: auto 1fr; align-items: center; column-gap: 6px; row-gap: 2px;
  padding: 6px 7px 8px; border-radius: var(--r-control); background: var(--c-tint); box-shadow: var(--edge); color: var(--c-text); cursor: pointer; overflow: hidden; min-width: 0;
  transition: box-shadow var(--cut-in) var(--ease-out) }
.fs-gradient-keys .rk-clip:active { box-shadow: var(--edge-press) }
.fs-gradient-keys .rk-clip:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px }
.fs-gradient-keys .rk-clip svg { width: 9px; height: 9px; fill: currentColor; opacity: 0.55 }
.fs-gradient-keys .rk-clip[aria-checked="true"] svg { opacity: 1 }
.fs-gradient-keys .rk-clip b { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-gradient-keys .rk-clip small { grid-column: 2; font: 500 10px/1.2 var(--mono); opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-gradient-keys .rk-clip .rk-sw { grid-column: 1 / -1; height: 6px; border-radius: 1px; margin-top: 3px }
.fs-gradient-keys .rk-bar { position: absolute; left: 0; bottom: 0; height: 2px; width: calc(var(--p, 0) * 100%); background: var(--c); opacity: 0 }
.fs-gradient-keys .rk-clip[aria-checked="true"] .rk-bar { opacity: 1 }
.fs-gradient-keys .rk-clip.is-queued small { color: var(--ink) }
@container (min-width: 560px) {
  .fs-gradient-keys .rk { grid-template-columns: 1.7fr 1fr }
  .fs-gradient-keys .rk-clips { grid-template-columns: 1fr; padding: 6px }
  .fs-gradient-keys .rk-clip { padding: 8px 8px 10px }
}
.fs-gradient-keys.is-tile .rk-clip small, .fs-gradient-keys.is-tile .rk-sw, .fs-gradient-keys.is-tile .rk-bpm { display: none }
.fs-gradient-keys.is-tile .rk-screen { aspect-ratio: 2.3 / 1 }
.fs-gradient-keys.is-tile .rk-looks-strip { display: none }
.fs-gradient-keys.is-tile .rk-clip { padding: 7px 7px 8px }
`,
    mount(host, ctx) {
      const reduced = ctx.reduced(), S = ctx.signal;
      host.innerHTML = `
<div class="rk">
  <div class="rk-panel">
    <div class="rk-strip"><span class="rk-name">Preview</span><span class="rk-box rk-pos" aria-hidden="true">0:00.0</span><span class="rk-box rk-bpm" aria-hidden="true">1920 × 1080</span><button type="button" class="rk-key rk-power" aria-label="Preview playing"></button></div>
    <div class="rk-screen" role="img"><span class="gk-field" aria-hidden="true"></span></div>
  </div>
  <div class="rk-panel">
    <div class="rk-strip rk-looks-strip"><span class="rk-name">Looks</span><span class="rk-box" aria-hidden="true">Switches on next tick</span></div>
    <div class="rk-clips" role="radiogroup" aria-label="Looks"></div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const $ = (q) => host.querySelector(q);
      const screen = $(".rk-screen"), clipsEl = $(".rk-clips"), posEl = $(".rk-pos"), power = $(".rk-power"), live = $("[aria-live]");
      const f = field($(".gk-field"), LOOKS[0].palette, SEED, reduced, S);
      let at = 0, queued = -1, running = !reduced, ghost = !reduced, clock = 0, launchedAt = 0;
      const clips = LOOKS.map((l, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "rk-clip"; b.setAttribute("role", "radio");
        b.style.setProperty("--c", `var(--clip-${l.hue})`); b.style.setProperty("--c-tint", `var(--clip-${l.hue}-tint)`); b.style.setProperty("--c-text", `var(--clip-${l.hue}-text)`);
        b.innerHTML = `<span class="rk-glyph"></span><b></b><small></small><span class="rk-sw" aria-hidden="true"></span><span class="rk-bar" aria-hidden="true"></span>`;
        b.querySelector("b").textContent = l.name;
        b.querySelector(".rk-sw").style.background = "linear-gradient(90deg, " + l.palette.join(", ") + ")";
        b.setAttribute("aria-label", l.name + ", " + l.line);
        clipsEl.appendChild(b);
        return b;
      });
      function render() {
        clips.forEach((b, i) => {
          b.setAttribute("aria-checked", String(i === at)); b.tabIndex = i === at ? 0 : -1;
          b.classList.toggle("is-queued", i === queued);
          b.querySelector(".rk-glyph").innerHTML = i === at ? PLAY : i === queued ? PLAY : STOP;
          b.querySelector("small").textContent = i === queued ? "Next tick" : i === at ? "Playing" : LOOP.toFixed(1) + " s";
        });
        screen.setAttribute("aria-label", "Preview: " + LOOKS[at].name + ", " + LOOKS[at].line);
        power.classList.toggle("is-lit", running);
        power.textContent = running ? "On" : "Off";
        power.setAttribute("aria-pressed", String(running));
      }
      /* A launch waits for the next tick, then the screen cuts to the look. */
      function launch(i) {
        at = i; queued = -1; launchedAt = clock;
        f.recolour(LOOKS[i].palette);
        render();
        live.textContent = LOOKS[i].name + " playing";
      }
      function queue(i, say) {
        if (i === at && queued < 0) return;
        if (reduced || !running) { launch(i); return; }
        queued = i; render();
        if (say) live.textContent = LOOKS[i].name + " queued";
      }
      render();

      ctx.onHand(() => { ghost = false; });
      clips.forEach((b, i) => {
        b.addEventListener("click", () => queue(i, true), { signal: S });
        b.addEventListener("keydown", (e) => {
          const n = LOOKS.length, k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          const next = k ? (i + k + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
          if (next === null) return;
          e.preventDefault(); clips[next].focus(); queue(next, true);
        }, { signal: S });
      });
      power.addEventListener("click", () => { running = !running; f.st.paused = !running; if (!running && queued >= 0) launch(queued); render(); live.textContent = running ? "Preview on" : "Preview off"; }, { signal: S });

      if (reduced) { f.still(); return { destroy() { f.destroy(); } }; }
      let nextGhost = GHOST;
      ctx.loop((dt) => {
        if (running) {
          const before = clock; clock += dt;
          if (Math.floor(clock / TICK) !== Math.floor(before / TICK) && queued >= 0) launch(queued);
          if (ghost && clock >= nextGhost) { nextGhost += GHOST; queue((at + 1) % LOOKS.length, false); }
          posEl.textContent = Math.floor(clock / 60) + ":" + (clock % 60).toFixed(1).padStart(4, "0");
          clips[at].style.setProperty("--p", (((clock - launchedAt) % LOOP) / LOOP).toFixed(4));
        }
        f.frame(Math.min(0.05, dt));
      });
      return { destroy() { f.destroy(); } };
    },
  });
})();
