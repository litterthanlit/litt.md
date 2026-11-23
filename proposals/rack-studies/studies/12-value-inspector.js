/* 12-value-inspector.js — Parameter Inspector Strip:
   6 Ableton cut value boxes (Temp, Top-P, Max tok, Retries, Timeout, Workers) with 1:1 vertical drag,
   Shift fine mode, double-click home reset, colored bottom fill bars, and modified markers. */
(function () {
  const S = ".rs-value-inspector";
  const PARAMS = [
    { id: "temp", name: "Temp", hue: "amber", min: 0, max: 1.5, step: 0.05, def: 0.3, fmt: (v) => v.toFixed(2) },
    { id: "topp", name: "Top-P", hue: "blue", min: 0.1, max: 1.0, step: 0.02, def: 0.92, fmt: (v) => v.toFixed(2) },
    { id: "maxt", name: "Max tok", hue: "teal", min: 512, max: 16384, step: 512, def: 4096, fmt: (v) => Math.round(v) + "" },
    { id: "ret", name: "Retries", hue: "violet", min: 0, max: 6, step: 1, def: 2, fmt: (v) => v + "×" },
    { id: "tmo", name: "Timeout", hue: "green", min: 5, max: 120, step: 5, def: 30, fmt: (v) => v + "s" },
    { id: "wrk", name: "Workers", hue: "blue", min: 1, max: 16, step: 1, def: 4, fmt: (v) => v + " ch" },
  ];

  RackPlayer.register({
    slug: "value-inspector",
    title: "Parameter Inspector Strip",
    category: "control",
    tagline: "6 cut value boxes dragged 1:1 vertically with Shift fine mode, double-click home, and fill bars.",
    motion: "0ms 1:1 drag · 0ms stop on release",
    css: `
${S} .vi { width: min(100%, 700px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .vi-top { display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control); }
${S} .vi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
${S} .vi-cell {
  background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control);
  padding: 7px 8px; display: grid; gap: 5px;
}
${S} .vi-h { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 600; color: var(--muted); }
${S} .vi-mod { width: 6px; height: 6px; border: 1px solid var(--border); background: var(--tray); }
${S} .vi-cell.is-mod .vi-mod { background: var(--accent); border-color: var(--ink); }
${S} .vi-box {
  position: relative; height: 32px; background: var(--cut); border: 1px solid var(--border); border-radius: var(--r-control);
  display: flex; align-items: center; justify-content: space-between; padding: 0 8px;
  font: 600 13px/1 var(--mono); cursor: ns-resize; user-select: none; touch-action: none; overflow: hidden;
}
${S} .vi-box:hover { border-color: var(--ink); }
${S} .vi-box.is-drag { background: var(--accent); color: var(--on-accent); border-color: var(--ink); }
${S} .vi-bar { position: absolute; left: 0; bottom: 0; height: 4px; background: var(--blue); }
${S} .vi-bar[data-h="amber"] { background: var(--amber); }
${S} .vi-bar[data-h="teal"] { background: var(--teal); }
${S} .vi-bar[data-h="violet"] { background: var(--violet); }
${S} .vi-bar[data-h="green"] { background: var(--green); }
${S} .vi-box.is-drag .vi-bar { background: var(--ink); }
${S} .vi-ar { font-size: 9px; color: var(--muted); }
${S} .vi-box.is-drag .vi-ar { color: var(--on-accent); }
${S} .vi-foot { display: flex; justify-content: space-between; font: 500 10px/1 var(--mono); color: var(--muted); padding: 2px 4px 0; }
${S}.is-tile .vi-cell { padding: 5px 6px; gap: 4px; }
${S}.is-tile .vi-box { height: 26px; font-size: 11px; padding: 0 6px; }
${S}.is-tile .vi-top .rk-btn { height: 21px; padding: 0 7px; font-size: 10px; }
`,
    mount(host, ctx) {
      const vals = PARAMS.map((p) => p.def);

      host.innerHTML =
        '<div class="vi">' +
          '<div class="vi-top">' +
            '<span class="rk-lbl">RUNTIME PARAMETERS · DRAG ↕ · SHIFT FINE</span>' +
            '<button type="button" class="rk-btn" id="vi-rst">Reset All</button>' +
          '</div>' +
          '<div class="vi-grid">' +
            PARAMS.map((p, i) =>
              '<div class="vi-cell" data-col data-i="' + i + '">' +
                '<div class="vi-h"><span>' + p.name + '</span><i class="vi-mod" aria-hidden="true"></i></div>' +
                '<div class="vi-box" tabindex="0" role="slider" aria-label="' + p.name + '" aria-valuemin="' + p.min + '" aria-valuemax="' + p.max + '" data-i="' + i + '">' +
                  '<span class="vi-val"></span><span class="vi-ar">↕</span>' +
                  '<i class="vi-bar" data-h="' + p.hue + '"></i>' +
                '</div>' +
              '</div>'
            ).join("") +
          '</div>' +
          '<div class="vi-foot"><span id="vi-modcnt"></span><span>DBL-CLICK OR BACKSPACE = HOME</span></div>' +
        '</div>';

      const cells = [...host.querySelectorAll(".vi-cell")];
      const boxes = [...host.querySelectorAll(".vi-box")];
      const modCnt = host.querySelector("#vi-modcnt");

      function draw() {
        let modified = 0;
        PARAMS.forEach((p, i) => {
          const v = vals[i];
          const isMod = Math.abs(v - p.def) > 1e-6;
          if (isMod) modified++;
          cells[i].classList.toggle("is-mod", isMod);
          const b = boxes[i];
          b.querySelector(".vi-val").textContent = p.fmt(v);
          b.setAttribute("aria-valuenow", String(v));
          const pct = ((v - p.min) / (p.max - p.min)) * 100;
          b.querySelector(".vi-bar").style.width = pct.toFixed(1) + "%";
        });
        modCnt.textContent = modified ? modified + " MODIFIED" : "ALL AT HOME";
      }

      boxes.forEach((b, i) => {
        const p = PARAMS[i];
        ctx.bindDrag(b, {
          min: p.min, max: p.max, step: p.step, def: p.def,
          get: () => vals[i],
          set: (v) => { vals[i] = v; draw(); },
          signal: ctx.signal,
        });
      });

      host.querySelector("#vi-rst").addEventListener("click", () => {
        PARAMS.forEach((p, i) => { vals[i] = p.def; });
        draw();
      }, { signal: ctx.signal });

      draw();

      const demo = [
        [0.15, 0.86, 8192, 3, 45, 8],
        [0.60, 0.96, 2048, 1, 15, 2],
        [0.30, 0.92, 4096, 2, 30, 4],
      ];
      let auto = !ctx.reduced(), idx = 0;
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(1900, () => {
        if (!auto) return;
        const snap = demo[idx++ % demo.length];
        snap.forEach((v, i) => { vals[i] = v; });
        draw();
      });
    },
  });
})();
