/* 05-eval-dumbbell.js — Folio image_3-inspired dumbbell eval comparison (Baseline ○ vs Candidate ●)
   with live 1px-ruled sort strip (By current | By delta | By baseline) and accessible data table. */
(function () {
  const S = ".rs-eval-dumbbell";
  const DATA = [
    { name: "Tool routing", base: 31, cur: 62 },
    { name: "Multi-file edit", base: 22, cur: 54 },
    { name: "Patch accuracy", base: 44, cur: 57 },
    { name: "Test repair", base: 18, cur: 41 },
    { name: "Context recall", base: 29, cur: 38 },
    { name: "Legacy fallback", base: 47, cur: 36 },
    { name: "Zero-shot plan", base: 6, cur: 19 },
  ];

  RackPlayer.register({
    slug: "eval-dumbbell",
    title: "Eval Delta Dumbbell",
    category: "data",
    tagline: "Baseline vs candidate agent eval scores with crisp beat-cut reordering.",
    motion: "140ms bar snap · 0ms sort cut · zero overshoot",
    css: `
${S} .ed { width: min(100%, 720px); display: grid; gap: 12px; }
${S} .ed-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
${S} .ed-cap { font-weight: 600; font-size: 13px; }
${S} .ed-leg { display: flex; align-items: center; gap: 14px; font-size: 11px; color: var(--muted); padding-left: 150px; }
${S} .ed-leg span { display: inline-flex; align-items: center; gap: 5px; }
${S} .ed-o { width: 9px; height: 9px; border-radius: 50%; border: 2px solid var(--ink); background: var(--panel); display: inline-block; }
${S} .ed-f { width: 9px; height: 9px; border-radius: 50%; background: var(--violet); display: inline-block; }
${S} .ed-rows { display: grid; gap: 0; position: relative; }
${S} .ed-row { display: grid; grid-template-columns: 144px 1fr 56px; align-items: center; gap: 10px; height: 32px; }
${S} .ed-row:hover { background: var(--surface-2); }
${S} .ed-name { font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 4px; }
${S} .ed-plot { position: relative; height: 100%; border-left: 1.5px solid var(--ink);
  background: repeating-linear-gradient(90deg, transparent 0, transparent calc(14.285% - 1px), var(--line) calc(14.285% - 1px), var(--line) 14.285%); }
${S} .ed-line { position: absolute; top: 50%; height: 2px; margin-top: -1px; background: var(--violet); }
${S} .ed-line.is-neg { background: var(--amber); }
${S} .ed-dot { position: absolute; top: 50%; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%; }
${S} .ed-dot.is-base { border: 2px solid var(--ink); background: var(--panel); z-index: 2; }
${S} .ed-dot.is-cur { background: var(--violet); z-index: 3; }
${S} .ed-delta { font: 600 11px/1 var(--mono); text-align: right; color: var(--violet-text); padding-right: 4px; }
${S} .ed-delta.is-neg { color: var(--amber-text); }
${S} .ed-axis { display: grid; grid-template-columns: 144px 1fr 56px; gap: 10px; font: 400 10px/1 var(--mono); color: var(--subtle); padding-top: 4px; }
${S} .ed-ticks { display: flex; justify-content: space-between; }
${S}.is-tile .ed-row { grid-template-columns: 98px 1fr 44px; height: 24px; gap: 6px; }
${S}.is-tile .ed-row:nth-child(n+6) { display: none; }
${S}.is-tile .ed-leg { padding-left: 104px; font-size: 10px; }
${S}.is-tile .ed-axis { display: none; }
${S}.is-tile .ed-name { font-size: 11px; }
${S}.is-tile .rk-seg button { height: 22px; padding: 0 7px; font-size: 10px; }
`,
    mount(host, ctx) {
      let mode = "cur";
      host.innerHTML =
        '<div class="ed">' +
          '<div class="ed-top">' +
            '<span class="ed-cap">% pass benchmark across agent skills, v1 vs v2</span>' +
            '<div class="rk-seg" role="radiogroup" aria-label="Sort order">' +
              '<button type="button" role="radio" data-m="cur" aria-checked="true">By v2</button>' +
              '<button type="button" role="radio" data-m="delta" aria-checked="false">By delta</button>' +
              '<button type="button" role="radio" data-m="base" aria-checked="false">By v1</button>' +
            '</div>' +
          '</div>' +
          '<div class="ed-leg"><span><i class="ed-o"></i> v1 baseline</span><span><i class="ed-f"></i> v2 candidate</span></div>' +
          '<div class="ed-rows"></div>' +
          '<div class="ed-axis"><span></span><div class="ed-ticks"><span>0%</span><span>10%</span><span>20%</span><span>30%</span><span>40%</span><span>50%</span><span>60%</span><span>70%</span></div><span></span></div>' +
        '</div>';

      const rowsEl = host.querySelector(".ed-rows");
      const btns = [...host.querySelectorAll("[data-m]")];

      function draw(animate) {
        btns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.m === mode)));
        const list = [...DATA].sort((a, b) => {
          if (mode === "delta") return (b.cur - b.base) - (a.cur - a.base);
          return b[mode] - a[mode];
        });
        rowsEl.innerHTML = list.map((d) => {
          const delta = d.cur - d.base;
          const neg = delta < 0;
          const x1 = (Math.min(d.base, d.cur) / 70) * 100;
          const x2 = (Math.max(d.base, d.cur) / 70) * 100;
          const xb = (d.base / 70) * 100;
          const xc = (d.cur / 70) * 100;
          return '<div class="ed-row">' +
            '<span class="ed-name">' + d.name + '</span>' +
            '<div class="ed-plot">' +
              '<span class="ed-line' + (neg ? ' is-neg' : '') + '" style="left:' + x1.toFixed(2) + '%;width:' + (x2 - x1).toFixed(2) + '%"></span>' +
              '<span class="ed-dot is-base" style="left:' + xb.toFixed(2) + '%"></span>' +
              '<span class="ed-dot is-cur" style="left:' + xc.toFixed(2) + '%"></span>' +
            '</div>' +
            '<span class="ed-delta' + (neg ? ' is-neg' : '') + '">' + (delta > 0 ? '+' : '−') + Math.abs(delta) + ' pp</span>' +
          '</div>';
        }).join("");
        if (animate && !ctx.tile) ctx.cutIn(rowsEl, 0);
      }

      btns.forEach((b) => b.addEventListener("click", () => { mode = b.dataset.m; draw(true); }, { signal: ctx.signal }));
      draw(false);

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      const seq = ["cur", "delta", "base"];
      let k = 0;
      if (auto) {
        ctx.every(2200, () => {
          if (!auto) return;
          k = (k + 1) % seq.length;
          mode = seq[k];
          draw();
        });
      }
    },
  });
})();
