/* 06-xy-router.js — Ableton XY Pad for live agent routing policy:
   1:1 draggable yellow crosshair balancing Speed ↔ Depth (X) and Lean ↔ Thorough (Y),
   with corner snap presets and live model/budget selection. */
(function () {
  const S = ".rs-xy-router";
  const SNAPS = [
    { name: "Draft", x: 0.22, y: 0.28 },
    { name: "Balanced", x: 0.54, y: 0.58 },
    { name: "Ship", x: 0.72, y: 0.76 },
    { name: "Deep audit", x: 0.90, y: 0.92 },
  ];

  RackPlayer.register({
    slug: "xy-router",
    title: "XY Policy Pad",
    category: "control",
    tagline: "Drag a yellow crosshair 1:1 across Speed vs Depth to route model tier and budget.",
    motion: "0ms 1:1 XY pointer tracking · 0ms corner snap · zero inertia",
    css: `
${S} .xy { width: min(100%, 560px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 6px; }
${S} .xy-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px; padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control); }
${S} .xy-main { display: grid; grid-template-columns: 1fr 176px; gap: 6px; }
${S} .xy-pad {
  position: relative; height: 210px; border: 1px solid var(--border); border-radius: var(--r-control);
  background: var(--cut); cursor: crosshair; user-select: none; touch-action: none; overflow: hidden;
  background-image:
    linear-gradient(to right, var(--line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--line) 1px, transparent 1px);
  background-size: 25% 25%;
}
${S} .xy-cx { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--border); pointer-events: none; }
${S} .xy-cy { position: absolute; left: 0; right: 0; height: 1px; background: var(--border); pointer-events: none; }
${S} .xy-fill { position: absolute; left: 0; bottom: 0; background: var(--blue-tint); opacity: 0.45; pointer-events: none; }
${S} .xy-pt { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px; background: var(--accent); border: 1.5px solid var(--ink); border-radius: var(--r-control); pointer-events: none; }
${S} .xy-cor { position: absolute; font: 600 9px/1 var(--mono); color: var(--muted); padding: 5px 6px; pointer-events: none; }
${S} .xy-side { background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control); padding: 8px; display: grid; gap: 8px; align-content: space-between; }
${S} .xy-kv { display: grid; gap: 3px; border-bottom: 1px solid var(--line); padding-bottom: 6px; }
${S} .xy-kv:last-child { border-bottom: 0; padding-bottom: 0; }
${S} .xy-kv b { font: 600 15px/1.1 var(--mono); }
${S} .xy-chip { display: inline-block; padding: 3px 6px; font: 600 10px/1 var(--mono); border-radius: var(--r-control); background: var(--violet-tint); color: var(--violet-text); width: fit-content; }
${S}.is-tile .xy-main { grid-template-columns: 1fr 122px; }
${S}.is-tile .xy-pad { height: 164px; }
${S}.is-tile .xy-kv b { font-size: 12px; }
${S}.is-tile .rk-seg button { height: 22px; padding: 0 6px; font-size: 10px; }
`,
    mount(host, ctx) {
      let x = 0.72, y = 0.76, snap = 2, drag = false;
      host.innerHTML =
        '<div class="xy">' +
          '<div class="xy-top">' +
            '<span class="rk-lbl">Routing XY</span>' +
            '<div class="rk-seg is-yellow" role="radiogroup" aria-label="Policy snap">' +
              SNAPS.map((s, i) => '<button type="button" role="radio" data-s="' + i + '">' + s.name + '</button>').join("") +
            '</div>' +
          '</div>' +
          '<div class="xy-main">' +
            '<div class="xy-pad" tabindex="0" aria-label="XY routing pad">' +
              '<span class="xy-cor" style="top:0;left:0">THOROUGH</span>' +
              '<span class="xy-cor" style="top:0;right:0">DEEP AUDIT</span>' +
              '<span class="xy-cor" style="bottom:0;left:0">FAST / LEAN</span>' +
              '<span class="xy-cor" style="bottom:0;right:0">HIGH DEPTH</span>' +
              '<div class="xy-fill" id="xy-f"></div>' +
              '<div class="xy-cx" id="xy-x"></div>' +
              '<div class="xy-cy" id="xy-y"></div>' +
              '<div class="xy-pt" id="xy-p"></div>' +
            '</div>' +
            '<div class="xy-side" data-col="1">' +
              '<div class="xy-kv"><span class="rk-lbl">Depth (X)</span><b id="xy-vx"></b></div>' +
              '<div class="xy-kv"><span class="rk-lbl">Verify (Y)</span><b id="xy-vy"></b></div>' +
              '<div class="xy-kv"><span class="rk-lbl">Routed tier</span><span class="xy-chip" id="xy-tier"></span></div>' +
            '</div>' +
          '</div>' +
        '</div>';

      const pad = host.querySelector(".xy-pad");
      const fx = host.querySelector("#xy-f"), lx = host.querySelector("#xy-x"), ly = host.querySelector("#xy-y"), pt = host.querySelector("#xy-p");
      const vx = host.querySelector("#xy-vx"), vy = host.querySelector("#xy-vy"), tier = host.querySelector("#xy-tier");
      const sBtns = [...host.querySelectorAll("[data-s]")];

      function draw() {
        const px = (x * 100).toFixed(1) + "%", py = ((1 - y) * 100).toFixed(1) + "%";
        lx.style.left = px; ly.style.top = py; pt.style.left = px; pt.style.top = py;
        fx.style.width = px; fx.style.height = (y * 100).toFixed(1) + "%";
        vx.textContent = Math.round(x * 100) + "%";
        vy.textContent = Math.round(y * 100) + "%";
        const score = (x + y) / 2;
        tier.textContent = score > 0.78 ? "PRO · 32K" : score > 0.45 ? "SONNET · 16K" : "FLASH · 4K";
        sBtns.forEach((b, i) => b.setAttribute("aria-checked", String(i === snap)));
      }

      const move = (e) => {
        const r = pad.getBoundingClientRect();
        x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        y = Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height));
        snap = -1; draw();
      };
      pad.addEventListener("pointerdown", (e) => { drag = true; pad.setPointerCapture(e.pointerId); move(e); e.preventDefault(); }, { signal: ctx.signal });
      pad.addEventListener("pointermove", (e) => { if (drag) move(e); }, { signal: ctx.signal });
      pad.addEventListener("pointerup", () => { drag = false; }, { signal: ctx.signal });
      pad.addEventListener("keydown", (e) => {
        const d = 0.05;
        if (e.key === "ArrowRight") { x = Math.min(1, x + d); snap = -1; draw(); e.preventDefault(); }
        if (e.key === "ArrowLeft") { x = Math.max(0, x - d); snap = -1; draw(); e.preventDefault(); }
        if (e.key === "ArrowUp") { y = Math.min(1, y + d); snap = -1; draw(); e.preventDefault(); }
        if (e.key === "ArrowDown") { y = Math.max(0, y - d); snap = -1; draw(); e.preventDefault(); }
      }, { signal: ctx.signal });

      sBtns.forEach((b, i) => b.addEventListener("click", () => { snap = i; x = SNAPS[i].x; y = SNAPS[i].y; draw(); }, { signal: ctx.signal }));
      draw();

      let auto = !ctx.reduced(), k = 0;
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(1900, () => {
        if (!auto) return;
        k = (k + 1) % SNAPS.length; snap = k; x = SNAPS[k].x; y = SNAPS[k].y; draw();
      });
    },
  });
})();
