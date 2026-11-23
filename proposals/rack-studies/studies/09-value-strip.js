/* 09-value-strip.js — Rack's signature vertical-drag parameter strip: 6 dense cut value boxes
   with 1:1 pointer drag, Shift fine mode, wheel, arrow keys, double-click home reset, and zero settle. */
(function () {
  const S = ".rs-value-strip";
  const PARAMS = [
    { name: "Temp", hue: "amber", min: 0, max: 1, step: 0.02, def: 0.2, fmt: (v) => v.toFixed(2) },
    { name: "Top-P", hue: "blue", min: 0.1, max: 1, step: 0.02, def: 0.92, fmt: (v) => v.toFixed(2) },
    { name: "Max tok", hue: "violet", min: 2, max: 64, step: 2, def: 16, fmt: (v) => v + "k" },
    { name: "Retries", hue: "teal", min: 0, max: 8, step: 1, def: 3, fmt: (v) => v + "×" },
    { name: "Timeout", hue: "orchid", min: 5, max: 120, step: 5, def: 45, fmt: (v) => v + "s" },
    { name: "Workers", hue: "green", min: 1, max: 16, step: 1, def: 4, fmt: (v) => String(v) },
  ];

  RackPlayer.register({
    slug: "value-strip",
    title: "Vertical-Drag Value Strip",
    category: "control",
    tagline: "Six dense cut value boxes that track 1:1 vertically and stop dead on release.",
    motion: "0ms 1:1 vertical drag · 0ms home snap · zero settle",
    css: `
${S} .vs { width: min(100%, 760px); border: 1px solid var(--border); background: var(--panel); display: grid; }
${S} .vs-top { display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; border-bottom: 1px solid var(--border); background: var(--surface-2); font-size: 12px; font-weight: 600; }
${S} .vs-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); }
${S} .vs-cell { border-right: 1px solid var(--line-strong); padding: 10px 8px; display: grid; gap: 7px; }
${S} .vs-cell:last-child { border-right: 0; }
${S} .vs-lbl { font: 500 10px/1 var(--mono); color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; display: flex; justify-content: space-between; }
${S} .vs-box {
  position: relative; border: 1px solid var(--border); background: var(--cut);
  padding: 12px 8px 14px; cursor: ns-resize; user-select: none; touch-action: none;
}
${S} .vs-box.is-drag { border-color: var(--ink); background: var(--block-hover); }
${S} .vs-num { font: 600 22px/1 var(--font); letter-spacing: -0.03em; display: block; }
${S} .vs-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 5px; background: var(--slot); }
${S} .vs-fill { height: 100%; }
${S} .vs-cell[data-h="amber"] .vs-fill { background: var(--amber); }
${S} .vs-cell[data-h="blue"] .vs-fill { background: var(--blue); }
${S} .vs-cell[data-h="violet"] .vs-fill { background: var(--violet); }
${S} .vs-cell[data-h="teal"] .vs-fill { background: var(--teal); }
${S} .vs-cell[data-h="orchid"] .vs-fill { background: var(--orchid); }
${S} .vs-cell[data-h="green"] .vs-fill { background: var(--green); }
${S} .vs-foot { padding: 7px 10px; border-top: 1px solid var(--line-strong); background: var(--surface-2); display: flex; justify-content: space-between; align-items: center; font: 400 11px/1 var(--mono); color: var(--subtle); }
${S}.is-tile .vs-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
${S}.is-tile .vs-cell { border-bottom: 1px solid var(--line-strong); padding: 7px 6px; }
${S}.is-tile .vs-box { padding: 7px 6px 9px; }
${S}.is-tile .vs-num { font-size: 16px; }
${S}.is-tile .vs-foot { display: none; }
@container (max-width: 560px) {
  ${S} .vs-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  ${S} .vs-cell { border-bottom: 1px solid var(--line-strong); }
}
`,
    mount(host, ctx) {
      const vals = PARAMS.map((p) => p.def);
      host.innerHTML =
        '<div class="vs">' +
          '<div class="vs-top"><span>Model &amp; runtime parameters</span><button type="button" class="rk-btn" id="vs-reset">Reset defaults</button></div>' +
          '<div class="vs-grid"></div>' +
          '<div class="vs-foot"><span>DRAG ↑↓ 1:1 · SHIFT FINE · DOUBLE-CLICK HOME</span><span id="vs-mod">0 MODIFIED</span></div>' +
        '</div>';

      const grid = host.querySelector(".vs-grid");
      const modEl = host.querySelector("#vs-mod");

      const boxes = PARAMS.map((p, i) => {
        const cell = document.createElement("div");
        cell.className = "vs-cell"; cell.dataset.h = p.hue; cell.dataset.col = String(i);
        cell.innerHTML =
          '<div class="vs-lbl"><span>' + p.name + '</span><span class="vs-dot"></span></div>' +
          '<div class="vs-box" role="slider" tabindex="0" aria-label="' + p.name + '" aria-valuemin="' + p.min + '" aria-valuemax="' + p.max + '">' +
            '<span class="vs-num"></span><div class="vs-bar"><div class="vs-fill"></div></div>' +
          '</div>';
        grid.appendChild(cell);
        const box = cell.querySelector(".vs-box");
        const num = cell.querySelector(".vs-num");
        const fill = cell.querySelector(".vs-fill");
        const dot = cell.querySelector(".vs-dot");
        ctx.bindDrag(box, {
          min: p.min, max: p.max, step: p.step, def: p.def,
          get: () => vals[i],
          set: (v) => { vals[i] = v; draw(); },
          signal: ctx.signal,
        });
        return { box, num, fill, dot };
      });

      function draw() {
        let changed = 0;
        PARAMS.forEach((p, i) => {
          const v = vals[i], b = boxes[i];
          const pct = ((v - p.min) / (p.max - p.min)) * 100;
          b.num.textContent = p.fmt(v);
          b.fill.style.width = pct.toFixed(1) + "%";
          b.box.setAttribute("aria-valuenow", String(v));
          const mod = Math.abs(v - p.def) > 1e-6;
          if (mod) changed++;
          b.dot.textContent = mod ? "●" : "";
        });
        modEl.textContent = changed + " MODIFIED";
      }

      host.querySelector("#vs-reset").addEventListener("click", () => {
        PARAMS.forEach((p, i) => (vals[i] = p.def));
        draw();
      }, { signal: ctx.signal });
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      const demo = [
        [0.2, 0.92, 16, 3, 45, 4],
        [0.64, 0.80, 32, 2, 60, 8],
        [0.08, 0.96, 8, 5, 30, 2],
      ];
      let d = 0;
      if (auto) {
        ctx.every(1600, () => {
          if (!auto) return;
          d = (d + 1) % demo.length;
          demo[d].forEach((v, i) => (vals[i] = v));
          draw();
        });
      }
    },
  });
})();
