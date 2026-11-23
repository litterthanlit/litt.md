/* 14-facet-bar.js — Filter & Facet Bar:
   Vivid multi-facet square chip filters with live counts, 0ms toggles, and instant matching list rows. */
(function () {
  const S = ".rs-facet-bar";
  const FACETS = [
    { id: "agent", label: "Agent", hue: "blue" },
    { id: "diff", label: "Diff", hue: "coral" },
    { id: "eval", label: "Eval", hue: "emerald" },
    { id: "policy", label: "Policy", hue: "violet" },
  ];
  const ROWS = [
    { cat: "agent", title: "Session handoff summary", meta: "142ms" },
    { cat: "diff", title: "Updated Rack bright neutral ramp", meta: "+48 -32" },
    { cat: "eval", title: "APCA Lc 60 contrast suite", meta: "18/18" },
    { cat: "policy", title: "Auto-approve read-only tools", meta: "active" },
    { cat: "agent", title: "Tool dependency graph scan", meta: "64ms" },
  ];

  RackPlayer.register({
    slug: "facet-bar",
    title: "Filter & Facet Bar",
    category: "data",
    tagline: "Multi-select square facet chips with vivid fills, live counts, and 0ms list filtering.",
    motion: "0ms chip toggle · 0ms list cut",
    css: `
${S} .fb {
  width: min(100%, 470px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); padding: 12px; display: grid; gap: 10px;
}
${S} .fb-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
${S} .fb-chip {
  display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 8px;
  border: 1px solid var(--border); border-radius: var(--r-control); background: var(--surface-2);
  font-size: 11px; font-weight: 600; cursor: pointer;
}
${S} .fb-chip.is-on[data-h="blue"] { background: var(--blue); color: #fff; border-color: var(--blue); }
${S} .fb-chip.is-on[data-h="coral"] { background: var(--coral); color: #fff; border-color: var(--coral); }
${S} .fb-chip.is-on[data-h="emerald"] { background: var(--emerald); color: #fff; border-color: var(--emerald); }
${S} .fb-chip.is-on[data-h="violet"] { background: var(--violet); color: #fff; border-color: var(--violet); }
${S} .fb-cnt { font: 600 9px/1 var(--mono); opacity: 0.85; }
${S} .fb-list { display: grid; gap: 4px; }
${S} .fb-row {
  display: grid; grid-template-columns: 8px 1fr auto; align-items: center; gap: 8px;
  padding: 6px 8px; background: var(--panel); border: 1px solid var(--line); border-radius: var(--r-control);
  font-size: 12px;
}
${S} .fb-dot { width: 8px; height: 8px; border-radius: 1px; }
${S} .fb-dot[data-h="blue"] { background: var(--blue); }
${S} .fb-dot[data-h="coral"] { background: var(--coral); }
${S} .fb-dot[data-h="emerald"] { background: var(--emerald); }
${S} .fb-dot[data-h="violet"] { background: var(--violet); }
${S}.is-tile .fb { padding: 9px; gap: 7px; }
${S}.is-tile .fb-chip { height: 22px; padding: 0 7px; font-size: 10px; }
${S}.is-tile .fb-row { padding: 4px 7px; font-size: 11px; }
${S}.is-tile .fb-row:nth-child(n+4) { display: none; }
`,
    mount(host, ctx) {
      const on = new Set(["agent", "diff", "eval"]);
      const hueOf = Object.fromEntries(FACETS.map((f) => [f.id, f.hue]));

      host.innerHTML =
        '<div class="fb" data-col>' +
          '<div class="fb-bar">' +
            FACETS.map((f) => {
              const c = ROWS.filter((r) => r.cat === f.id).length;
              return '<button type="button" class="fb-chip" data-id="' + f.id + '" data-h="' + f.hue + '">' + f.label + ' <span class="fb-cnt">' + c + '</span></button>';
            }).join("") +
            '<button type="button" class="rk-btn" id="fb-all" style="margin-left:auto;height:24px;padding:0 7px;font-size:10px">All</button>' +
          '</div>' +
          '<div class="fb-list" id="fb-list"></div>' +
        '</div>';

      const chips = [...host.querySelectorAll(".fb-chip")];
      const listEl = host.querySelector("#fb-list");

      function draw() {
        chips.forEach((c) => c.classList.toggle("is-on", on.has(c.dataset.id)));
        const rows = on.size ? ROWS.filter((r) => on.has(r.cat)) : ROWS;
        listEl.innerHTML = rows.map((r) =>
          '<div class="fb-row"><i class="fb-dot" data-h="' + hueOf[r.cat] + '"></i><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + r.title + '</span><span class="rk-mono" style="font-size:10px;color:var(--muted)">' + r.meta + '</span></div>'
        ).join("");
      }

      chips.forEach((c) => c.addEventListener("click", () => {
        const id = c.dataset.id;
        if (on.has(id)) on.delete(id); else on.add(id);
        draw();
      }, { signal: ctx.signal }));
      host.querySelector("#fb-all").addEventListener("click", () => { FACETS.forEach((f) => on.add(f.id)); draw(); }, { signal: ctx.signal });
      draw();

      const seq = [["agent", "diff", "eval"], ["eval", "policy"], ["agent", "coral" ? "diff" : "diff"], ["agent", "diff", "eval", "policy"]];
      let auto = !ctx.reduced(), idx = 0;
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2000, () => {
        if (!auto) return;
        on.clear();
        seq[++idx % seq.length].forEach((x) => on.add(x));
        draw();
      });
    },
  });
})();
