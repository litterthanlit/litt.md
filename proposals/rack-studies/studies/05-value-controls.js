/* 05-value-controls.js — Drag Value Controls:
   4 Rack numeric cut boxes dragged 1:1 vertically (Shift fine, dblclick home) with vivid colored gauge bars. */
(function () {
  const S = ".rs-value-controls";
  const FIELDS = [
    { name: "Temperature", hue: "coral", min: 0, max: 1.5, step: 0.05, def: 0.25, fmt: (v) => v.toFixed(2) },
    { name: "Max tokens", hue: "blue", min: 1024, max: 32768, step: 1024, def: 8192, fmt: (v) => Math.round(v / 1024) + "k" },
    { name: "Timeout", hue: "violet", min: 5, max: 120, step: 5, def: 30, fmt: (v) => v + "s" },
    { name: "Workers", hue: "emerald", min: 1, max: 12, step: 1, def: 4, fmt: (v) => v + "x" },
  ];

  RackPlayer.register({
    slug: "value-controls",
    title: "Drag Value Controls",
    category: "control",
    tagline: "Inline numeric boxes dragged 1:1 vertically with Shift fine mode, live gauges, and double-click home.",
    motion: "0ms 1:1 pointer drag · 0ms stop",
    css: `
${S} .vc {
  width: min(100%, 440px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); padding: 12px; display: grid; gap: 10px;
}
${S} .vc-top { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; }
${S} .vc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
${S} .vc-item { display: grid; gap: 4px; }
${S} .vc-lbl { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); font-weight: 500; }
${S} .vc-pip { width: 6px; height: 6px; border: 1px solid var(--border); background: var(--surface-2); margin-top: 3px; }
${S} .vc-item.is-mod .vc-pip { background: var(--accent); border-color: var(--border-strong); }
${S} .vc-box {
  position: relative; height: 36px; padding: 0 10px; background: var(--surface-2);
  border: 1px solid var(--border); border-radius: var(--r-control);
  display: flex; align-items: center; justify-content: space-between;
  font: 600 14px/1 var(--mono); cursor: ns-resize; user-select: none; touch-action: none; overflow: hidden;
}
${S} .vc-box:hover { border-color: var(--border-strong); }
${S} .vc-box.is-drag { background: var(--accent); color: var(--on-accent); border-color: var(--border-strong); }
${S} .vc-bar { position: absolute; left: 0; bottom: 0; height: 4px; }
${S} .vc-bar[data-h="coral"] { background: var(--coral); }
${S} .vc-bar[data-h="blue"] { background: var(--blue); }
${S} .vc-bar[data-h="violet"] { background: var(--violet); }
${S} .vc-bar[data-h="emerald"] { background: var(--emerald); }
${S} .vc-box.is-drag .vc-bar { background: var(--on-accent); }
${S} .vc-foot { font: 500 10px/1 var(--mono); color: var(--muted); display: flex; justify-content: space-between; }
${S}.is-tile .vc { padding: 10px; gap: 7px; }
${S}.is-tile .vc-box { height: 30px; font-size: 12px; }
${S}.is-tile .vc-top .rk-btn { height: 22px; padding: 0 8px; font-size: 11px; }
`,
    mount(host, ctx) {
      const vals = FIELDS.map((f) => f.def);

      host.innerHTML =
        '<div class="vc" data-col>' +
          '<div class="vc-top"><span>Model parameters</span><button type="button" class="rk-btn" id="vc-rst">Reset</button></div>' +
          '<div class="vc-grid">' +
            FIELDS.map((f, i) =>
              '<div class="vc-item" data-i="' + i + '">' +
                '<div class="vc-lbl"><span>' + f.name + '</span><i class="vc-pip"></i></div>' +
                '<div class="vc-box" tabindex="0" role="slider" aria-label="' + f.name + '" data-i="' + i + '">' +
                  '<span class="vc-val"></span><span style="font-size:10px;opacity:0.55">↕</span>' +
                  '<i class="vc-bar" data-h="' + f.hue + '"></i>' +
                '</div>' +
              '</div>'
            ).join("") +
          '</div>' +
          '<div class="vc-foot"><span id="vc-cnt"></span><span>DRAG ↕ · SHIFT FINE · DBL-CLICK HOME</span></div>' +
        '</div>';

      const items = [...host.querySelectorAll(".vc-item")];
      const boxes = [...host.querySelectorAll(".vc-box")];
      const cnt = host.querySelector("#vc-cnt");

      function draw() {
        let mod = 0;
        FIELDS.forEach((f, i) => {
          const v = vals[i];
          const ch = Math.abs(v - f.def) > 1e-6;
          if (ch) mod++;
          items[i].classList.toggle("is-mod", ch);
          boxes[i].querySelector(".vc-val").textContent = f.fmt(v);
          boxes[i].querySelector(".vc-bar").style.width = (((v - f.min) / (f.max - f.min)) * 100).toFixed(1) + "%";
        });
        cnt.textContent = mod ? mod + " MODIFIED" : "DEFAULT";
      }

      boxes.forEach((b, i) => {
        const f = FIELDS[i];
        ctx.bindDrag(b, {
          min: f.min, max: f.max, step: f.step, def: f.def,
          get: () => vals[i], set: (v) => { vals[i] = v; draw(); }, signal: ctx.signal,
        });
      });
      host.querySelector("#vc-rst").addEventListener("click", () => { FIELDS.forEach((f, i) => { vals[i] = f.def; }); draw(); }, { signal: ctx.signal });
      draw();

      const snaps = [[0.25, 8192, 30, 4], [0.75, 16384, 60, 8], [0.10, 4096, 15, 2]];
      let auto = !ctx.reduced(), idx = 0;
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2000, () => { if (!auto) return; snaps[++idx % snaps.length].forEach((v, i) => { vals[i] = v; }); draw(); });
    },
  });
})();
