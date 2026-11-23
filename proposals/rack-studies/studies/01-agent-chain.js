/* 01-agent-chain.js — Ableton Live modular agent signal chain: 5 clip-colored stages,
   1:1 vertical-drag parameter boxes, instant-cut bypass & tool switches, and beat-cut presets. */
(function () {
  const S = ".rs-agent-chain";
  const NODES = [
    { id: "router", name: "Router", hue: "amber", param: "Gate", min: 50, max: 100, step: 5, def: 85, unit: "%", tool: "Classify", lat: 0.4, tok: 2 },
    { id: "research", name: "Research", hue: "blue", param: "Depth", min: 1, max: 12, step: 1, def: 6, unit: "doc", tool: "Web", lat: 1.4, tok: 8 },
    { id: "coder", name: "Coder", hue: "teal", param: "Budget", min: 4, max: 32, step: 2, def: 16, unit: "k", tool: "Shell", lat: 2.1, tok: 16 },
    { id: "verifier", name: "Verifier", hue: "violet", param: "Strict", min: 20, max: 100, step: 10, def: 80, unit: "%", tool: "Tests", lat: 1.2, tok: 6 },
    { id: "memory", name: "Memory", hue: "green", param: "Window", min: 2, max: 24, step: 2, def: 10, unit: "tr", tool: "Cache", lat: 0.3, tok: 4 },
  ];
  const PRESETS = [
    { name: "Ship feature", on: [1, 1, 1, 1, 0], vals: [85, 6, 16, 80, 10] },
    { name: "Deep audit", on: [1, 1, 1, 1, 1], vals: [95, 10, 24, 100, 18] },
    { name: "Fast triage", on: [1, 1, 0, 0, 1], vals: [70, 3, 8, 50, 6] },
  ];

  RackPlayer.register({
    slug: "agent-chain",
    title: "Agent Signal Chain",
    category: "agent",
    tagline: "Five clip-colored stages with 1:1 vertical-drag parameters and instant presets.",
    motion: "0ms vertical drag · 0ms bypass cut · column beat entrance",
    css: `
${S} .ac { width: min(100%, 860px); border: 1px solid var(--border); background: var(--panel); display: grid; }
${S} .ac-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--border); background: var(--surface-2); }
${S} .ac-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 12px; }
${S} .ac-readout { font: 500 11px/1 var(--mono); color: var(--muted); display: flex; gap: 10px; }
${S} .ac-readout b { color: var(--ink); font-weight: 600; }
${S} .ac-rack { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0; }
${S} .ac-mod { border-right: 1px solid var(--line-strong); display: grid; grid-template-rows: auto 1fr auto; background: var(--panel); }
${S} .ac-mod:last-child { border-right: 0; }
${S} .ac-mod.is-off { background: var(--surface-2); }
${S} .ac-mod.is-off .ac-body, ${S} .ac-mod.is-off .ac-foot { opacity: 0.45; }
${S} .ac-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 6px 8px; border-bottom: 1px solid var(--border); font-size: 11px; font-weight: 600; }
${S} .ac-mod[data-hue="amber"] .ac-head { background: var(--amber-tint); color: var(--amber-text); }
${S} .ac-mod[data-hue="blue"] .ac-head { background: var(--blue-tint); color: var(--blue-text); }
${S} .ac-mod[data-hue="teal"] .ac-head { background: var(--teal-tint); color: var(--teal-text); }
${S} .ac-mod[data-hue="violet"] .ac-head { background: var(--violet-tint); color: var(--violet-text); }
${S} .ac-mod[data-hue="green"] .ac-head { background: var(--green-tint); color: var(--green-text); }
${S} .ac-mod.is-off .ac-head { background: var(--surface-3); color: var(--muted); }
${S} .ac-pwr { width: 16px; height: 16px; padding: 0; border: 1px solid var(--border); background: var(--block); cursor: pointer; display: grid; place-items: center; font: 600 9px/1 var(--mono); }
${S} .ac-pwr[aria-pressed="true"] { background: var(--accent); color: var(--on-accent); border-color: var(--ink); }
${S} .ac-body { padding: 10px 8px; display: grid; gap: 6px; }
${S} .ac-lbl { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; font-family: var(--mono); }
${S} .ac-val { position: relative; border: 1px solid var(--border); background: var(--cut); padding: 8px 7px 11px; cursor: ns-resize; user-select: none; touch-action: none; }
${S} .ac-val.is-drag { border-color: var(--ink); background: var(--block-hover); }
${S} .ac-num { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; display: block; }
${S} .ac-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: var(--slot); }
${S} .ac-fill { height: 100%; width: 50%; }
${S} .ac-mod[data-hue="amber"] .ac-fill { background: var(--amber); }
${S} .ac-mod[data-hue="blue"] .ac-fill { background: var(--blue); }
${S} .ac-mod[data-hue="teal"] .ac-fill { background: var(--teal); }
${S} .ac-mod[data-hue="violet"] .ac-fill { background: var(--violet); }
${S} .ac-mod[data-hue="green"] .ac-fill { background: var(--green); }
${S} .ac-foot { padding: 6px 8px; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; font-size: 11px; }
${S} .ac-tool { border: 1px solid var(--border-soft); background: var(--block); padding: 2px 6px; font-size: 10px; font-weight: 500; cursor: pointer; }
${S} .ac-tool[aria-pressed="true"] { background: var(--ink); color: var(--on-ink); border-color: var(--ink); }
${S}.is-tile .ac-readout, ${S}.is-tile .ac-foot { display: none; }
${S}.is-tile .ac-title > span { display: none; }
${S}.is-tile .ac-top { padding: 6px 8px; }
${S}.is-tile .rk-seg button { height: 22px; padding: 0 7px; font-size: 10px; }
${S}.is-tile .ac-rack { grid-template-columns: repeat(4, minmax(0, 1fr)); }
${S}.is-tile .ac-mod:nth-child(5) { display: none; }
${S}.is-tile .ac-num { font-size: 15px; }
@container (max-width: 540px) {
  ${S} .ac-rack { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  ${S} .ac-mod { border-bottom: 1px solid var(--line-strong); }
}
`,
    mount(host, ctx) {
      let preset = 0;
      const state = NODES.map((n, i) => ({ on: !!PRESETS[0].on[i], val: PRESETS[0].vals[i], tool: true }));

      host.innerHTML =
        '<div class="ac">' +
          '<div class="ac-top">' +
            '<div class="ac-title"><span>Agent signal chain</span>' +
              '<div class="rk-seg" role="radiogroup" aria-label="Preset">' +
                PRESETS.map((p, i) => '<button type="button" role="radio" data-p="' + i + '" aria-checked="' + (i === 0) + '">' + p.name + '</button>').join("") +
              '</div>' +
            '</div>' +
            '<div class="ac-readout"><span id="ac-lat"></span><span id="ac-tok"></span></div>' +
          '</div>' +
          '<div class="ac-rack"></div>' +
        '</div>';

      const rack = host.querySelector(".ac-rack");
      const latEl = host.querySelector("#ac-lat");
      const tokEl = host.querySelector("#ac-tok");
      const pBtns = [...host.querySelectorAll("[data-p]")];

      const els = NODES.map((n, i) => {
        const mod = document.createElement("div");
        mod.className = "ac-mod";
        mod.dataset.hue = n.hue;
        mod.dataset.col = String(i);
        mod.innerHTML =
          '<div class="ac-head"><span>' + n.name + '</span><button type="button" class="ac-pwr" aria-label="Toggle ' + n.name + '">I</button></div>' +
          '<div class="ac-body"><span class="ac-lbl">' + n.param + '</span>' +
            '<div class="ac-val" role="slider" tabindex="0" aria-label="' + n.name + ' ' + n.param + '" aria-valuemin="' + n.min + '" aria-valuemax="' + n.max + '">' +
              '<span class="ac-num"></span><div class="ac-bar"><div class="ac-fill"></div></div>' +
            '</div>' +
          '</div>' +
          '<div class="ac-foot"><span class="rk-fig">Tool</span><button type="button" class="ac-tool" aria-pressed="true">' + n.tool + '</button></div>';
        rack.appendChild(mod);
        const pwr = mod.querySelector(".ac-pwr");
        const valBox = mod.querySelector(".ac-val");
        const num = mod.querySelector(".ac-num");
        const fill = mod.querySelector(".ac-fill");
        const tool = mod.querySelector(".ac-tool");

        pwr.addEventListener("click", () => { state[i].on = !state[i].on; preset = -1; draw(); }, { signal: ctx.signal });
        tool.addEventListener("click", () => { state[i].tool = !state[i].tool; draw(); }, { signal: ctx.signal });
        ctx.bindDrag(valBox, {
          min: n.min, max: n.max, step: n.step, def: n.def,
          get: () => state[i].val,
          set: (v) => { state[i].val = v; preset = -1; draw(); },
          signal: ctx.signal,
        });
        return { mod, pwr, valBox, num, fill, tool };
      });

      function draw() {
        let totalLat = 0, totalTok = 0;
        NODES.forEach((n, i) => {
          const st = state[i], e = els[i];
          e.mod.classList.toggle("is-off", !st.on);
          e.pwr.setAttribute("aria-pressed", String(st.on));
          e.pwr.textContent = st.on ? "I" : "O";
          e.num.textContent = st.val + n.unit;
          const pct = ((st.val - n.min) / (n.max - n.min)) * 100;
          e.fill.style.width = pct.toFixed(1) + "%";
          e.valBox.setAttribute("aria-valuenow", String(st.val));
          e.tool.setAttribute("aria-pressed", String(st.tool));
          if (st.on) {
            const scale = 0.6 + 0.8 * (pct / 100);
            totalLat += n.lat * scale;
            totalTok += Math.round(n.tok * scale);
          }
        });
        pBtns.forEach((b, i) => b.setAttribute("aria-checked", String(i === preset)));
        latEl.innerHTML = "LAT <b>" + totalLat.toFixed(1) + "s</b>";
        tokEl.innerHTML = "BUDGET <b>" + totalTok + "k tok</b>";
      }

      function applyPreset(idx) {
        preset = idx;
        const p = PRESETS[idx];
        NODES.forEach((_, i) => { state[i].on = !!p.on[i]; state[i].val = p.vals[i]; });
        draw();
      }

      pBtns.forEach((b, i) => b.addEventListener("click", () => applyPreset(i), { signal: ctx.signal }));
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      let stepIdx = 0;
      if (auto) {
        ctx.every(2000, () => {
          if (!auto) return;
          stepIdx = (stepIdx + 1) % PRESETS.length;
          applyPreset(stepIdx);
        });
      }
    },
  });
})();
