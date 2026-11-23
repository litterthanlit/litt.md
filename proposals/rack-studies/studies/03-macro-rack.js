/* 03-macro-rack.js — Ableton Instrument Rack with 8 mapped macro encoders in a 4×2 grid.
   Drag any dial 1:1 vertically (0ms lag), double-click to reset, or jump all 8 on the frame with Snapshots. */
(function () {
  const S = ".rs-macro-rack";
  const MACROS = [
    { name: "Depth", hue: "blue", unit: "%", def: 72 },
    { name: "Speed", hue: "teal", unit: "%", def: 64 },
    { name: "Caution", hue: "amber", unit: "%", def: 80 },
    { name: "Brevity", hue: "violet", unit: "%", def: 55 },
    { name: "Tests", hue: "green", unit: "%", def: 90 },
    { name: "Retries", hue: "amber", unit: "%", def: 40 },
    { name: "Context", hue: "blue", unit: "%", def: 68 },
    { name: "Parallel", hue: "teal", unit: "%", def: 50 },
  ];
  const SNAPS = [
    { name: "Balanced", v: [72, 64, 80, 55, 90, 40, 68, 50] },
    { name: "Fast ship", v: [42, 95, 50, 82, 65, 25, 48, 90] },
    { name: "Deep audit", v: [98, 30, 96, 25, 100, 75, 94, 40] },
    { name: "Dry run", v: [60, 70, 100, 70, 85, 0, 55, 20] },
  ];

  RackPlayer.register({
    slug: "macro-rack",
    title: "8-Macro Agent Rack",
    category: "control",
    tagline: "Eight mapped macro arcs in a 4×2 Ableton rack with instant snapshot recall.",
    motion: "0ms vertical dial drag · 0ms snapshot recall · zero settle",
    css: `
${S} .mr { width: min(100%, 620px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 6px; }
${S} .mr-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px; padding: 6px 8px; background: var(--surface-2); border-radius: var(--r-control); }
${S} .mr-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
${S} .mr-cell {
  background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control);
  padding: 8px 6px 7px; display: grid; justify-items: center; gap: 4px;
  cursor: ns-resize; user-select: none; touch-action: none;
}
${S} .mr-cell.is-drag { border-color: var(--ink); background: var(--block-hover); }
${S} .mr-svg { width: 46px; height: 46px; display: block; }
${S} .mr-trk { fill: none; stroke: var(--slot); stroke-width: 4; stroke-linecap: butt; }
${S} .mr-arc { fill: none; stroke-width: 4; stroke-linecap: butt; }
${S} .mr-cell[data-h="blue"] .mr-arc { stroke: var(--blue); }
${S} .mr-cell[data-h="teal"] .mr-arc { stroke: var(--teal); }
${S} .mr-cell[data-h="amber"] .mr-arc { stroke: var(--amber); }
${S} .mr-cell[data-h="violet"] .mr-arc { stroke: var(--violet); }
${S} .mr-cell[data-h="green"] .mr-arc { stroke: var(--green); }
${S} .mr-ptr { stroke: var(--ink); stroke-width: 2; }
${S} .mr-name { font-size: 11px; font-weight: 600; }
${S} .mr-val { font: 500 10px/1 var(--mono); color: var(--muted); }
${S}.is-tile .mr-svg { width: 34px; height: 34px; }
${S}.is-tile .mr-cell { padding: 5px 4px; gap: 2px; }
${S}.is-tile .mr-name { font-size: 10px; }
${S}.is-tile .rk-seg button { height: 22px; padding: 0 7px; font-size: 10px; }
`,
    mount(host, ctx) {
      let snap = 0;
      const vals = [...SNAPS[0].v];
      const R = 17, CX = 24, CY = 24, START = 135, SWEEP = 270;
      const polar = (deg) => {
        const rad = (deg * Math.PI) / 180;
        return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)];
      };
      const arcPath = (a0, a1) => {
        const [x0, y0] = polar(a0), [x1, y1] = polar(a1);
        const large = a1 - a0 > 180 ? 1 : 0;
        return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      };
      const trackD = arcPath(START, START + SWEEP);

      host.innerHTML =
        '<div class="mr">' +
          '<div class="mr-top">' +
            '<span class="rk-lbl">Macro snapshots</span>' +
            '<div class="rk-seg is-yellow" role="radiogroup" aria-label="Macro snapshot">' +
              SNAPS.map((s, i) => '<button type="button" role="radio" data-s="' + i + '" aria-checked="' + (i === 0) + '">' + s.name + '</button>').join("") +
            '</div>' +
          '</div>' +
          '<div class="mr-grid"></div>' +
        '</div>';

      const grid = host.querySelector(".mr-grid");
      const sBtns = [...host.querySelectorAll("[data-s]")];

      const cells = MACROS.map((m, i) => {
        const el = document.createElement("div");
        el.className = "mr-cell"; el.dataset.h = m.hue; el.dataset.col = String(i % 4);
        el.setAttribute("role", "slider"); el.tabIndex = 0;
        el.setAttribute("aria-label", m.name); el.setAttribute("aria-valuemin", "0"); el.setAttribute("aria-valuemax", "100");
        el.innerHTML =
          '<svg class="mr-svg" viewBox="0 0 48 48">' +
            '<circle cx="24" cy="24" r="12" fill="var(--cut)" stroke="var(--border)" stroke-width="1"/>' +
            '<path class="mr-trk" d="' + trackD + '"/>' +
            '<path class="mr-arc" d=""/>' +
            '<line class="mr-ptr" x1="24" y1="24" x2="24" y2="14"/>' +
          '</svg>' +
          '<span class="mr-name">' + m.name + '</span>' +
          '<span class="mr-val"></span>';
        grid.appendChild(el);
        ctx.bindDrag(el, {
          min: 0, max: 100, step: 2, def: m.def,
          get: () => vals[i],
          set: (v) => { vals[i] = v; snap = -1; draw(); },
          signal: ctx.signal,
        });
        return { el, arc: el.querySelector(".mr-arc"), ptr: el.querySelector(".mr-ptr"), val: el.querySelector(".mr-val") };
      });

      function draw() {
        sBtns.forEach((b, i) => b.setAttribute("aria-checked", String(i === snap)));
        vals.forEach((v, i) => {
          const c = cells[i];
          const a = START + (v / 100) * SWEEP;
          c.arc.setAttribute("d", v > 0 ? arcPath(START, Math.max(START + 1, a)) : "");
          const rad = (a * Math.PI) / 180;
          c.ptr.setAttribute("x2", (CX + 11 * Math.cos(rad)).toFixed(1));
          c.ptr.setAttribute("y2", (CY + 11 * Math.sin(rad)).toFixed(1));
          c.val.textContent = Math.round(v) + "%";
          c.el.setAttribute("aria-valuenow", String(Math.round(v)));
        });
      }

      sBtns.forEach((b, i) => b.addEventListener("click", () => {
        snap = i; SNAPS[i].v.forEach((v, j) => (vals[j] = v)); draw();
      }, { signal: ctx.signal }));
      draw();

      let auto = !ctx.reduced(), k = 0;
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2000, () => {
        if (!auto) return;
        k = (k + 1) % SNAPS.length; snap = k; SNAPS[k].v.forEach((v, j) => (vals[j] = v)); draw();
      });
    },
  });
})();
