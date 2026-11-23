/* 01-agent-chain.js — Ableton Live modular agent signal chain: 5 clip-colored device panels
   parted by the canvas ground, yellow power switches, 1:1 vertical-drag value boxes, and instant presets. */
(function () {
  const S = ".rs-agent-chain";
  const NODES = [
    { name: "Router", hue: "amber", param: "Gate", min: 50, max: 100, step: 5, def: 85, unit: "%", tool: "Classify", lat: 0.4, tok: 2 },
    { name: "Research", hue: "blue", param: "Depth", min: 1, max: 12, step: 1, def: 6, unit: "doc", tool: "Web", lat: 1.4, tok: 8 },
    { name: "Coder", hue: "teal", param: "Budget", min: 4, max: 32, step: 2, def: 16, unit: "k", tool: "Shell", lat: 2.1, tok: 16 },
    { name: "Verifier", hue: "violet", param: "Strict", min: 20, max: 100, step: 10, def: 80, unit: "%", tool: "Tests", lat: 1.2, tok: 6 },
    { name: "Memory", hue: "green", param: "Window", min: 2, max: 24, step: 2, def: 10, unit: "tr", tool: "Cache", lat: 0.3, tok: 4 },
  ];
  const PRESETS = [
    { name: "Ship", on: [1, 1, 1, 1, 0], vals: [85, 6, 16, 80, 10] },
    { name: "Audit", on: [1, 1, 1, 1, 1], vals: [95, 10, 24, 100, 18] },
    { name: "Triage", on: [1, 1, 0, 0, 1], vals: [70, 3, 8, 50, 6] },
  ];

  RackPlayer.register({
    slug: "agent-chain",
    title: "Agent Signal Chain",
    category: "agent",
    tagline: "Five clip-colored device modules with 1:1 vertical-drag parameters and instant presets.",
    motion: "0ms vertical drag · 0ms bypass · 36ms column beat",
    css: `
${S} .ac { width: min(100%, 840px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 6px; }
${S} .ac-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; padding: 6px 8px; background: var(--surface-2); border-radius: var(--r-control); }
${S} .ac-rd { font: 500 11px/1 var(--mono); color: var(--muted); display: flex; gap: 10px; }
${S} .ac-rd b { color: var(--ink); }
${S} .ac-rack { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 5px; }
${S} .ac-mod { background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control); display: grid; grid-template-rows: auto 1fr auto; overflow: hidden; }
${S} .ac-mod.is-off { background: var(--surface-2); }
${S} .ac-mod.is-off .ac-body, ${S} .ac-mod.is-off .ac-foot { opacity: 0.42; }
${S} .ac-head { display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 5px 6px; border-bottom: 1px solid var(--border); font-size: 11px; font-weight: 600; }
${S} .ac-mod[data-h="amber"] .ac-head { background: var(--amber-tint); color: var(--amber-text); }
${S} .ac-mod[data-h="blue"] .ac-head { background: var(--blue-tint); color: var(--blue-text); }
${S} .ac-mod[data-h="teal"] .ac-head { background: var(--teal-tint); color: var(--teal-text); }
${S} .ac-mod[data-h="violet"] .ac-head { background: var(--violet-tint); color: var(--violet-text); }
${S} .ac-mod[data-h="green"] .ac-head { background: var(--green-tint); color: var(--green-text); }
${S} .ac-mod.is-off .ac-head { background: var(--surface-3); color: var(--muted); }
${S} .ac-pwr { width: 16px; height: 16px; padding: 0; border: 1px solid var(--border); border-radius: var(--r-control); background: var(--block); font: 600 9px/1 var(--mono); cursor: pointer; }
${S} .ac-pwr[aria-pressed="true"] { background: var(--accent); color: var(--on-accent); border-color: var(--ink); }
${S} .ac-body { padding: 8px 6px; display: grid; gap: 5px; }
${S} .ac-lbl { font-size: 10px; font-weight: 600; color: var(--muted); }
${S} .ac-val { position: relative; border: 1px solid var(--border); border-radius: var(--r-control); background: var(--cut); padding: 7px 6px 10px; cursor: ns-resize; user-select: none; touch-action: none; }
${S} .ac-val.is-drag { border-color: var(--ink); background: var(--block-hover); }
${S} .ac-num { font: 600 16px/1 var(--font); display: block; }
${S} .ac-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: var(--slot); }
${S} .ac-fill { height: 100%; }
${S} .ac-mod[data-h="amber"] .ac-fill { background: var(--amber); }
${S} .ac-mod[data-h="blue"] .ac-fill { background: var(--blue); }
${S} .ac-mod[data-h="teal"] .ac-fill { background: var(--teal); }
${S} .ac-mod[data-h="violet"] .ac-fill { background: var(--violet); }
${S} .ac-mod[data-h="green"] .ac-fill { background: var(--green); }
${S} .ac-foot { padding: 5px 6px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; font-size: 10px; }
${S} .ac-tool { border: 1px solid var(--border); border-radius: var(--r-control); background: var(--block); padding: 2px 6px; font-size: 10px; font-weight: 500; cursor: pointer; }
${S} .ac-tool[aria-pressed="true"] { background: var(--ink); color: var(--on-ink); border-color: var(--ink); }
${S}.is-tile .ac-rd, ${S}.is-tile .ac-foot { display: none; }
${S}.is-tile .ac-rack { grid-template-columns: repeat(4, minmax(0, 1fr)); }
${S}.is-tile .ac-mod:nth-child(5) { display: none; }
${S}.is-tile .rk-seg button { height: 22px; padding: 0 7px; font-size: 11px; }
`,
    mount(host, ctx) {
      let preset = 0;
      const state = NODES.map((n, i) => ({ on: !!PRESETS[0].on[i], val: PRESETS[0].vals[i], tool: true }));

      host.innerHTML =
        '<div class="ac">' +
          '<div class="ac-top">' +
            '<div class="rk-seg" role="radiogroup" aria-label="Preset">' +
              PRESETS.map((p, i) => '<button type="button" role="radio" data-p="' + i + '" aria-checked="' + (i === 0) + '">' + p.name + '</button>').join("") +
            '</div>' +
            '<div class="ac-rd"><span id="ac-lat"></span><span id="ac-tok"></span></div>' +
          '</div>' +
          '<div class="ac-rack"></div>' +
        '</div>';

      const rack = host.querySelector(".ac-rack");
      const latEl = host.querySelector("#ac-lat");
      const tokEl = host.querySelector("#ac-tok");
      const pBtns = [...host.querySelectorAll("[data-p]")];

      const els = NODES.map((n, i) => {
        const mod = document.createElement("div");
        mod.className = "ac-mod"; mod.dataset.h = n.hue; mod.dataset.col = String(i);
        mod.innerHTML =
          '<div class="ac-head"><span>' + n.name + '</span><button type="button" class="ac-pwr" aria-label="Toggle ' + n.name + '">I</button></div>' +
          '<div class="ac-body"><span class="ac-lbl">' + n.param + '</span>' +
            '<div class="ac-val" role="slider" tabindex="0" aria-label="' + n.name + ' ' + n.param + '" aria-valuemin="' + n.min + '" aria-valuemax="' + n.max + '">' +
              '<span class="ac-num"></span><div class="ac-bar"><div class="ac-fill"></div></div>' +
            '</div>' +
          '</div>' +
          '<div class="ac-foot"><span class="rk-lbl">Tool</span><button type="button" class="ac-tool" aria-pressed="true">' + n.tool + '</button></div>';
        rack.appendChild(mod);
        const pwr = mod.querySelector(".ac-pwr");
        const valBox = mod.querySelector(".ac-val");
        const tool = mod.querySelector(".ac-tool");
        pwr.addEventListener("click", () => { state[i].on = !state[i].on; preset = -1; draw(); }, { signal: ctx.signal });
        tool.addEventListener("click", () => { state[i].tool = !state[i].tool; draw(); }, { signal: ctx.signal });
        ctx.bindDrag(valBox, {
          min: n.min, max: n.max, step: n.step, def: n.def,
          get: () => state[i].val,
          set: (v) => { state[i].val = v; preset = -1; draw(); },
          signal: ctx.signal,
        });
        return { mod, pwr, valBox, num: mod.querySelector(".ac-num"), fill: mod.querySelector(".ac-fill"), tool };
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
        tokEl.innerHTML = "BUDGET <b>" + totalTok + "k</b>";
      }

      pBtns.forEach((b, i) => b.addEventListener("click", () => {
        preset = i;
        NODES.forEach((_, j) => { state[j].on = !!PRESETS[i].on[j]; state[j].val = PRESETS[i].vals[j]; });
        draw();
      }, { signal: ctx.signal }));
      draw();

      let auto = !ctx.reduced(), k = 0;
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2000, () => {
        if (!auto) return;
        k = (k + 1) % PRESETS.length; preset = k;
        NODES.forEach((_, j) => { state[j].on = !!PRESETS[k].on[j]; state[j].val = PRESETS[k].vals[j]; });
        draw();
      });
    },
  });
})();
