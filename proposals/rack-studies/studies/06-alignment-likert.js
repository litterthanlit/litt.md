/* 06-alignment-likert.js — Folio image_5-inspired diverging 5-point Likert bars centered on a black
   neutral midpoint for agent rubric evaluations. Sort cuts cleanly between original order and pass rate. */
(function () {
  const S = ".rs-alignment-likert";
  const RUBRICS = [
    { q: "Tool calls stay minimal and deterministic", v: [4, 9, 17, 36, 34] },
    { q: "Diffs preserve unrelated comments and formatting", v: [18, 41, 22, 14, 5] },
    { q: "Edits compile cleanly on first verification pass", v: [12, 24, 31, 23, 10] },
    { q: "Escalates before destructive git or deploy actions", v: [6, 14, 25, 33, 22] },
    { q: "Citations and file links resolve without hallucination", v: [3, 8, 19, 34, 36] },
  ];

  RackPlayer.register({
    slug: "alignment-likert",
    title: "Diverging Eval Sentiment",
    category: "data",
    tagline: "Five-point diverging rubric bars anchored on a crisp black neutral midpoint.",
    motion: "100ms cut on sort · 0ms axis lock · zero bounce",
    css: `
${S} .al { width: min(100%, 740px); display: grid; gap: 12px; }
${S} .al-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
${S} .al-cap { font-weight: 600; font-size: 13px; }
${S} .al-leg { display: flex; flex-wrap: wrap; gap: 10px 14px; font-size: 11px; color: var(--muted); }
${S} .al-leg span { display: inline-flex; align-items: center; gap: 5px; }
${S} .al-sw { width: 10px; height: 10px; display: inline-block; }
${S} .al-list { display: grid; gap: 12px; }
${S} .al-item { display: grid; gap: 5px; }
${S} .al-q { font-size: 12px; font-weight: 500; }
${S} .al-track { position: relative; display: grid; grid-template-columns: 1fr 1fr; height: 18px; align-items: center; }
${S} .al-track::after { content: ""; position: absolute; left: 50%; top: -3px; bottom: -3px; width: 1.5px; background: var(--ink); z-index: 3; }
${S} .al-left { display: flex; justify-content: flex-end; align-items: center; height: 100%; }
${S} .al-right { display: flex; justify-content: flex-start; align-items: center; height: 100%; }
${S} .al-seg { height: 14px; }
${S} .al-seg.s0 { background: var(--amber); }
${S} .al-seg.s1 { background: color-mix(in oklab, var(--amber), var(--panel) 50%); }
${S} .al-seg.s2 { background: var(--surface-3); }
${S} .al-seg.s3 { background: color-mix(in oklab, var(--violet), var(--panel) 48%); }
${S} .al-seg.s4 { background: var(--violet); }
${S} .al-pct { font: 600 11px/1 var(--mono); padding: 0 6px; white-space: nowrap; }
${S} .al-pct.is-l { color: var(--amber-text); }
${S} .al-pct.is-r { color: var(--violet-text); }
${S}.is-tile .al-item:nth-child(n+4) { display: none; }
${S}.is-tile .al-leg { display: none; }
${S}.is-tile .al-q { font-size: 11px; }
${S}.is-tile .rk-seg button { height: 22px; padding: 0 7px; font-size: 10px; }
`,
    mount(host, ctx) {
      let sort = "orig";
      host.innerHTML =
        '<div class="al">' +
          '<div class="al-top">' +
            '<span class="al-cap">Diverging rubric evaluation bars</span>' +
            '<div class="rk-seg" role="radiogroup" aria-label="Order">' +
              '<button type="button" role="radio" data-s="orig" aria-checked="true">Original order</button>' +
              '<button type="button" role="radio" data-s="pass" aria-checked="false">Sort by pass</button>' +
            '</div>' +
          '</div>' +
          '<div class="al-leg">' +
            '<span><i class="al-sw" style="background:var(--amber)"></i>Fail</span>' +
            '<span><i class="al-sw" style="background:color-mix(in oklab,var(--amber),var(--panel) 50%)"></i>Weak</span>' +
            '<span><i class="al-sw" style="background:var(--surface-3)"></i>Neutral</span>' +
            '<span><i class="al-sw" style="background:color-mix(in oklab,var(--violet),var(--panel) 48%)"></i>Strong</span>' +
            '<span><i class="al-sw" style="background:var(--violet)"></i>Pass</span>' +
          '</div>' +
          '<div class="al-list"></div>' +
        '</div>';

      const list = host.querySelector(".al-list");
      const btns = [...host.querySelectorAll("[data-s]")];

      function draw(animate) {
        btns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.s === sort)));
        const rows = sort === "pass"
          ? [...RUBRICS].sort((a, b) => (b.v[3] + b.v[4]) - (a.v[3] + a.v[4]))
          : RUBRICS;
        list.innerHTML = rows.map((r) => {
          const [s0, s1, s2, s3, s4] = r.v;
          const failTot = s0 + s1, passTot = s3 + s4;
          const scale = 0.85;
          return '<div class="al-item">' +
            '<span class="al-q">' + r.q + '</span>' +
            '<div class="al-track">' +
              '<div class="al-left">' +
                '<span class="al-pct is-l">' + failTot + '%</span>' +
                '<span class="al-seg s0" style="width:' + (s0 * scale) + '%"></span>' +
                '<span class="al-seg s1" style="width:' + (s1 * scale) + '%"></span>' +
                '<span class="al-seg s2" style="width:' + ((s2 / 2) * scale) + '%"></span>' +
              '</div>' +
              '<div class="al-right">' +
                '<span class="al-seg s2" style="width:' + ((s2 / 2) * scale) + '%"></span>' +
                '<span class="al-seg s3" style="width:' + (s3 * scale) + '%"></span>' +
                '<span class="al-seg s4" style="width:' + (s4 * scale) + '%"></span>' +
                '<span class="al-pct is-r">' + passTot + '%</span>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join("");
        if (animate && !ctx.tile) ctx.cutIn(list, 0);
      }

      btns.forEach((b) => b.addEventListener("click", () => { sort = b.dataset.s; draw(true); }, { signal: ctx.signal }));
      draw(false);

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) {
        ctx.every(2400, () => {
          if (!auto) return;
          sort = sort === "orig" ? "pass" : "orig";
          draw();
        });
      }
    },
  });
})();
