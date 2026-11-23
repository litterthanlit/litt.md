/* 08-context-budget.js — Context Budget Bar:
   High-chroma stacked context-window meter where clicking any slice prunes/restores it live + Compact key. */
(function () {
  const S = ".rs-context-budget";
  const CAP = 128;
  const SLICES = [
    { name: "System", hue: "violet", k: 14, on: true },
    { name: "Repo files", hue: "blue", k: 42, on: true },
    { name: "Active diff", hue: "coral", k: 22, on: true },
    { name: "Tool logs", hue: "emerald", k: 18, on: true },
  ];

  RackPlayer.register({
    slug: "context-budget",
    title: "Context Budget Bar",
    category: "agent",
    tagline: "Interactive stacked context window — toggle slices to prune tokens or snap-compact.",
    motion: "0ms slice prune · 0ms budget recalculation",
    css: `
${S} .cb {
  width: min(100%, 480px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); padding: 14px; display: grid; gap: 12px;
}
${S} .cb-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
${S} .cb-num { font: 600 22px/1 var(--mono); letter-spacing: -0.02em; }
${S} .cb-cap { font: 500 11px/1 var(--mono); color: var(--muted); }
${S} .cb-track {
  height: 28px; display: flex; gap: 2px; padding: 3px;
  background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--r-control);
}
${S} .cb-seg { height: 100%; border-radius: 1px; cursor: pointer; border: 0; padding: 0; }
${S} .cb-seg[data-h="violet"] { background: var(--violet); }
${S} .cb-seg[data-h="blue"] { background: var(--blue); }
${S} .cb-seg[data-h="coral"] { background: var(--coral); }
${S} .cb-seg[data-h="emerald"] { background: var(--emerald); }
${S} .cb-chips { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
${S} .cb-chip {
  display: flex; justify-content: space-between; align-items: center; gap: 6px;
  padding: 6px 8px; border: 1px solid var(--border); border-radius: var(--r-control);
  background: var(--panel); cursor: pointer; font-size: 12px;
}
${S} .cb-chip.is-off { opacity: 0.4; text-decoration: line-through; }
${S} .cb-l { display: flex; align-items: center; gap: 6px; font-weight: 500; }
${S} .cb-sw { width: 10px; height: 10px; border-radius: 1px; flex: none; }
${S} .cb-sw[data-h="violet"] { background: var(--violet); }
${S} .cb-sw[data-h="blue"] { background: var(--blue); }
${S} .cb-sw[data-h="coral"] { background: var(--coral); }
${S} .cb-sw[data-h="emerald"] { background: var(--emerald); }
${S}.is-tile .cb { padding: 10px; gap: 8px; }
${S}.is-tile .cb-num { font-size: 18px; }
${S}.is-tile .cb-track { height: 22px; }
${S}.is-tile .cb-chip { padding: 4px 6px; font-size: 11px; }
`,
    mount(host, ctx) {
      const items = SLICES.map((s) => ({ ...s }));

      host.innerHTML =
        '<div class="cb" data-col>' +
          '<div class="cb-top">' +
            '<div><span class="cb-num" id="cb-num"></span> <span class="cb-cap">/ ' + CAP + 'k tok</span></div>' +
            '<button type="button" class="rk-btn is-accent" id="cb-cmp">Compact</button>' +
          '</div>' +
          '<div class="cb-track" id="cb-track"></div>' +
          '<div class="cb-chips">' +
            items.map((s, i) =>
              '<button type="button" class="cb-chip" data-i="' + i + '">' +
                '<span class="cb-l"><i class="cb-sw" data-h="' + s.hue + '"></i>' + s.name + '</span>' +
                '<span class="rk-mono" style="font-size:11px" data-k="' + i + '"></span>' +
              '</button>'
            ).join("") +
          '</div>' +
        '</div>';

      const numEl = host.querySelector("#cb-num");
      const track = host.querySelector("#cb-track");
      const chips = [...host.querySelectorAll(".cb-chip")];

      function draw() {
        const used = items.reduce((a, s) => a + (s.on ? s.k : 0), 0);
        numEl.textContent = used + "k";
        track.innerHTML = items.filter((s) => s.on && s.k > 0).map((s) =>
          '<button type="button" class="cb-seg" data-h="' + s.hue + '" data-n="' + s.name + '" style="width:' + ((s.k / CAP) * 100).toFixed(1) + '%" aria-label="Toggle ' + s.name + '"></button>'
        ).join("");
        track.querySelectorAll(".cb-seg").forEach((b) => b.addEventListener("click", () => {
          const it = items.find((x) => x.name === b.dataset.n);
          if (it) { it.on = false; draw(); }
        }));
        chips.forEach((c, i) => {
          c.classList.toggle("is-off", !items[i].on);
          c.querySelector("[data-k]").textContent = items[i].k + "k";
        });
      }

      chips.forEach((c) => c.addEventListener("click", () => {
        const i = +c.dataset.i; items[i].on = !items[i].on; draw();
      }, { signal: ctx.signal }));
      host.querySelector("#cb-cmp").addEventListener("click", () => {
        const compacted = items[1].k < 30;
        items.forEach((s, i) => { s.on = true; s.k = compacted ? SLICES[i].k : Math.max(6, Math.round(SLICES[i].k * 0.55)); });
        draw();
      }, { signal: ctx.signal });
      draw();

      let auto = !ctx.reduced(), step = 0;
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2200, () => {
        if (!auto) return;
        step = (step + 1) % 3;
        if (step === 0) items.forEach((s, i) => { s.on = true; s.k = SLICES[i].k; });
        else if (step === 1) items[3].on = false;
        else items.forEach((s, i) => { s.on = true; s.k = Math.max(6, Math.round(SLICES[i].k * 0.55)); });
        draw();
      });
    },
  });
})();
