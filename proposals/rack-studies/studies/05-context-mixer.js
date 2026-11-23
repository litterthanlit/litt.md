/* 05-context-mixer.js — Ableton Mixer Channel Strips for context window allocation:
   5 vertical clip-colored fader channels you drag 1:1 vertically, yellow channel activators,
   and a live Master Budget strip on the right. */
(function () {
  const S = ".rs-context-mixer";
  const MAX_K = 128;
  const CH = [
    { name: "Core", hue: "violet", k: 24, max: 40, on: true },
    { name: "Diff", hue: "amber", k: 22, max: 40, on: true },
    { name: "Code", hue: "blue", k: 18, max: 40, on: true },
    { name: "Logs", hue: "teal", k: 14, max: 40, on: false },
    { name: "Web", hue: "green", k: 10, max: 40, on: true },
  ];

  RackPlayer.register({
    slug: "context-mixer",
    title: "Context Channel Mixer",
    category: "agent",
    tagline: "Five vertical mixer channels with 1:1 token faders, yellow mute keys, and a master meter.",
    motion: "0ms vertical fader drag · 0ms channel mute · zero settle",
    css: `
${S} .cm { width: min(100%, 660px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .cm-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)) 86px; gap: 5px; }
${S} .cm-ch { background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control); display: grid; grid-template-rows: auto 1fr auto auto; overflow: hidden; }
${S} .cm-ch.is-off .cm-well, ${S} .cm-ch.is-off .cm-k { opacity: 0.36; }
${S} .cm-h { padding: 4px 5px; border-bottom: 1px solid var(--border); font-size: 11px; font-weight: 600; text-align: center; }
${S} .cm-ch[data-h="violet"] .cm-h { background: var(--violet-tint); color: var(--violet-text); }
${S} .cm-ch[data-h="amber"] .cm-h { background: var(--amber-tint); color: var(--amber-text); }
${S} .cm-ch[data-h="blue"] .cm-h { background: var(--blue-tint); color: var(--blue-text); }
${S} .cm-ch[data-h="teal"] .cm-h { background: var(--teal-tint); color: var(--teal-text); }
${S} .cm-ch[data-h="green"] .cm-h { background: var(--green-tint); color: var(--green-text); }
${S} .cm-ch.is-m .cm-h { background: var(--surface-2); color: var(--muted); font: 600 10px/1.3 var(--mono); }
${S} .cm-well { position: relative; height: 126px; margin: 8px 12px; border: 1px solid var(--border); background: var(--slot); cursor: ns-resize; user-select: none; touch-action: none; }
${S} .cm-fill { position: absolute; left: 0; right: 0; bottom: 0; }
${S} .cm-ch[data-h="violet"] .cm-fill { background: var(--violet); }
${S} .cm-ch[data-h="amber"] .cm-fill { background: var(--amber); }
${S} .cm-ch[data-h="blue"] .cm-fill { background: var(--blue); }
${S} .cm-ch[data-h="teal"] .cm-fill { background: var(--teal); }
${S} .cm-ch[data-h="green"] .cm-fill { background: var(--green); }
${S} .cm-ch.is-m .cm-fill { background: var(--slot-fill); }
${S} .cm-ch.is-m.is-over .cm-fill { background: var(--danger); }
${S} .cm-cap { position: absolute; left: -3px; right: -3px; height: 6px; background: var(--cap); border: 1px solid var(--ink); pointer-events: none; }
${S} .cm-k { text-align: center; font: 600 11px/1 var(--mono); padding: 3px 2px 5px; }
${S} .cm-on { margin: 0 6px 6px; height: 22px; border: 1px solid var(--border); border-radius: var(--r-control); background: var(--block); font: 600 10px/1 var(--mono); cursor: pointer; }
${S} .cm-on[aria-pressed="true"] { background: var(--accent); color: var(--on-accent); border-color: var(--ink); }
${S}.is-tile .cm-well { height: 96px; margin: 6px 9px; }
${S}.is-tile .cm-grid { grid-template-columns: repeat(5, minmax(0, 1fr)) 68px; gap: 3px; }
${S}.is-tile .cm-h { font-size: 10px; padding: 3px; }
${S}.is-tile .cm-on { height: 18px; margin: 0 4px 4px; font-size: 9px; }
`,
    mount(host, ctx) {
      const st = CH.map((c) => ({ k: c.k, on: c.on }));
      host.innerHTML = '<div class="cm"><div class="cm-grid"></div></div>';
      const grid = host.querySelector(".cm-grid");

      const els = CH.map((c, i) => {
        const el = document.createElement("div");
        el.className = "cm-ch"; el.dataset.h = c.hue; el.dataset.col = String(i);
        el.innerHTML =
          '<div class="cm-h">' + c.name + '</div>' +
          '<div class="cm-well" role="slider" tabindex="0" aria-label="' + c.name + ' budget" aria-valuemin="0" aria-valuemax="' + c.max + '">' +
            '<div class="cm-fill"></div><div class="cm-cap"></div>' +
          '</div>' +
          '<div class="cm-k"></div>' +
          '<button type="button" class="cm-on" aria-label="Activate ' + c.name + '">' + (i + 1) + '</button>';
        grid.appendChild(el);
        const well = el.querySelector(".cm-well"), btn = el.querySelector(".cm-on");
        btn.addEventListener("click", () => { st[i].on = !st[i].on; draw(); }, { signal: ctx.signal });
        ctx.bindDrag(well, {
          min: 0, max: c.max, step: 2, def: c.k, rangePx: 110,
          get: () => st[i].k,
          set: (v) => { st[i].k = v; draw(); },
          signal: ctx.signal,
        });
        return { el, well, fill: el.querySelector(".cm-fill"), cap: el.querySelector(".cm-cap"), k: el.querySelector(".cm-k"), btn };
      });

      const master = document.createElement("div");
      master.className = "cm-ch is-m"; master.dataset.col = "5";
      master.innerHTML =
        '<div class="cm-h">MASTER</div>' +
        '<div class="cm-well" style="cursor:default"><div class="cm-fill"></div></div>' +
        '<div class="cm-k" id="cm-tot"></div>' +
        '<button type="button" class="cm-on" id="cm-cmp">Trim</button>';
      grid.appendChild(master);
      const mFill = master.querySelector(".cm-fill"), mTot = master.querySelector("#cm-tot");
      master.querySelector("#cm-cmp").addEventListener("click", () => {
        st.forEach((s, i) => { if (i >= 3) s.on = false; else s.k = Math.min(s.k, 18); });
        draw();
      }, { signal: ctx.signal });

      function draw() {
        let total = 0;
        CH.forEach((c, i) => {
          const s = st[i], e = els[i];
          const pct = (s.k / c.max) * 100;
          e.el.classList.toggle("is-off", !s.on);
          e.fill.style.height = pct.toFixed(1) + "%";
          e.cap.style.bottom = `calc(${pct.toFixed(1)}% - 3px)`;
          e.k.textContent = s.k + "k";
          e.btn.setAttribute("aria-pressed", String(s.on));
          e.well.setAttribute("aria-valuenow", String(s.k));
          if (s.on) total += s.k;
        });
        const mpct = Math.min(100, (total / MAX_K) * 100);
        master.classList.toggle("is-over", total > 100);
        mFill.style.height = mpct.toFixed(1) + "%";
        mTot.textContent = total + "k";
      }

      draw();
      let auto = !ctx.reduced(), step = 0;
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(1600, () => {
        if (!auto) return;
        const idx = step % 5;
        st[idx].k = [24, 34, 14, 28, 18][(step + idx) % 5];
        st[3].on = step % 2 === 0;
        step++; draw();
      });
    },
  });
})();
