/* 07-automation-lane.js — Ableton Live Automation Envelope Lane for agent reasoning pacing:
   Drag breakpoints 1:1 on the grid (0ms lag), toggle Linear vs Stepped quantization, and read live level at the playhead. */
(function () {
  const S = ".rs-automation-lane";
  const DEFAULT_PTS = [
    { x: 0.05, y: 0.35 }, { x: 0.28, y: 0.85 }, { x: 0.52, y: 0.55 }, { x: 0.76, y: 0.92 }, { x: 0.95, y: 0.25 },
  ];

  RackPlayer.register({
    slug: "automation-lane",
    title: "Automation Envelope Lane",
    category: "control",
    tagline: "Drag reasoning-budget breakpoints 1:1 across a run with stepped or linear quantization.",
    motion: "0ms breakpoint drag · quantized beat playhead",
    css: `
${S} .al { width: min(100%, 740px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .al-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px; padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control); }
${S} .al-lane { border: 1px solid var(--border); border-radius: var(--r-control); background: var(--cut); overflow: hidden; }
${S} .al-svg { width: 100%; height: 184px; display: block; touch-action: none; user-select: none; }
${S} .al-foot { display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control); font: 500 11px/1 var(--mono); color: var(--muted); }
${S} .al-foot b { color: var(--ink); }
${S}.is-tile .al-svg { height: 146px; }
${S}.is-tile .rk-seg button, ${S}.is-tile .rk-btn { height: 22px; padding: 0 7px; font-size: 10px; }
`,
    mount(host, ctx) {
      let pts = DEFAULT_PTS.map((p) => ({ ...p }));
      let mode = "linear", headX = 0.28, dragIdx = -1;

      host.innerHTML =
        '<div class="al">' +
          '<div class="al-top">' +
            '<span class="rk-lbl">Reasoning envelope · Turn 1–8</span>' +
            '<div style="display:flex;gap:6px;align-items:center">' +
              '<div class="rk-seg" role="radiogroup" aria-label="Envelope mode">' +
                '<button type="button" role="radio" data-m="linear" aria-checked="true">Linear</button>' +
                '<button type="button" role="radio" data-m="step" aria-checked="false">Stepped</button>' +
              '</div>' +
              '<button type="button" class="rk-btn" id="al-rst">Reset</button>' +
            '</div>' +
          '</div>' +
          '<div class="al-lane"><svg class="al-svg" viewBox="0 0 600 180" preserveAspectRatio="none">' +
            '<path d="M75 0V180 M150 0V180 M225 0V180 M300 0V180 M375 0V180 M450 0V180 M525 0V180 M0 45H600 M0 90H600 M0 135H600" stroke="var(--line)" stroke-width="1"/>' +
            '<path id="al-area" fill="var(--teal-tint)" opacity="0.55"/>' +
            '<path id="al-line" fill="none" stroke="var(--teal)" stroke-width="2.5"/>' +
            '<line id="al-hd" y1="0" y2="180" stroke="var(--ink)" stroke-width="1.5"/>' +
            '<g id="al-pts"></g>' +
          '</svg></div>' +
          '<div class="al-foot"><span id="al-rd"></span><span>DRAG NODES ↑↓←→ · 0MS TRACK</span></div>' +
        '</div>';

      const svg = host.querySelector(".al-svg"), area = host.querySelector("#al-area"), line = host.querySelector("#al-line");
      const hd = host.querySelector("#al-hd"), ptsG = host.querySelector("#al-pts"), rd = host.querySelector("#al-rd");
      const mBtns = [...host.querySelectorAll("[data-m]")];

      function sample(x) {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          if (x >= a.x && x <= b.x) {
            if (mode === "step") return a.y;
            const u = (x - a.x) / Math.max(0.001, b.x - a.x);
            return a.y + (b.y - a.y) * u;
          }
        }
        return x < pts[0].x ? pts[0].y : pts[pts.length - 1].y;
      }

      function draw() {
        mBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.m === mode)));
        const px = (u) => u * 600, py = (v) => 170 - v * 156;
        let d = `M ${px(pts[0].x).toFixed(1)} ${py(pts[0].y).toFixed(1)}`;
        for (let i = 1; i < pts.length; i++) {
          if (mode === "step") d += ` L ${px(pts[i].x).toFixed(1)} ${py(pts[i - 1].y).toFixed(1)}`;
          d += ` L ${px(pts[i].x).toFixed(1)} ${py(pts[i].y).toFixed(1)}`;
        }
        line.setAttribute("d", d);
        area.setAttribute("d", `${d} L ${px(pts[pts.length - 1].x).toFixed(1)} 180 L ${px(pts[0].x).toFixed(1)} 180 Z`);
        hd.setAttribute("x1", px(headX).toFixed(1)); hd.setAttribute("x2", px(headX).toFixed(1));
        ptsG.innerHTML = pts.map((p, i) =>
          `<rect data-i="${i}" x="${(px(p.x) - 5.5).toFixed(1)}" y="${(py(p.y) - 5.5).toFixed(1)}" width="11" height="11" fill="${i === dragIdx ? "var(--accent)" : "var(--panel)"}" stroke="var(--ink)" stroke-width="1.5" style="cursor:grab"/>`
        ).join("");
        const val = Math.round(sample(headX) * 32);
        rd.innerHTML = "TURN <b>" + (Math.floor(headX * 8) + 1) + "/8</b> · BUDGET <b>" + val + "k tok</b>";
      }

      svg.addEventListener("pointerdown", (e) => {
        const hit = e.target.closest("[data-i]");
        if (!hit) return;
        dragIdx = +hit.dataset.i;
        svg.setPointerCapture(e.pointerId);
        draw(); e.preventDefault();
      }, { signal: ctx.signal });
      svg.addEventListener("pointermove", (e) => {
        if (dragIdx < 0) return;
        const r = svg.getBoundingClientRect();
        const u = Math.max(0.02, Math.min(0.98, (e.clientX - r.left) / r.width));
        const v = Math.max(0.05, Math.min(0.98, 1 - (e.clientY - r.top) / r.height));
        const minX = dragIdx > 0 ? pts[dragIdx - 1].x + 0.05 : 0.02;
        const maxX = dragIdx < pts.length - 1 ? pts[dragIdx + 1].x - 0.05 : 0.98;
        pts[dragIdx].x = Math.max(minX, Math.min(maxX, u));
        pts[dragIdx].y = v;
        draw();
      }, { signal: ctx.signal });
      svg.addEventListener("pointerup", () => { if (dragIdx >= 0) { dragIdx = -1; draw(); } }, { signal: ctx.signal });

      mBtns.forEach((b) => b.addEventListener("click", () => { mode = b.dataset.m; draw(); }, { signal: ctx.signal }));
      host.querySelector("#al-rst").addEventListener("click", () => { pts = DEFAULT_PTS.map((p) => ({ ...p })); draw(); }, { signal: ctx.signal });

      draw();
      let auto = !ctx.reduced(); ctx.onHand(() => { auto = false; });
      ctx.onBeat(() => { if (!auto) return; headX = (headX + 1 / 32) % 1; draw(); });
    },
  });
})();
