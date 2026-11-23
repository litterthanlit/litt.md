/* 03-kpi-columns.js — Folio image_4-inspired monumental vertical KPI bars for agent run outcomes.
   Full-bleed flat colored bars with rotated giant figures and crisp 1px-ruled filter strip. */
(function () {
  const S = ".rs-kpi-columns";
  const SCOPES = [
    { id: "all", name: "All agents", vals: [18, 58, 24] },
    { id: "coder", name: "Coder", vals: [31, 52, 17] },
    { id: "research", name: "Research", vals: [64, 28, 8] },
    { id: "reviewer", name: "Reviewer", vals: [44, 41, 15] },
    { id: "ops", name: "Ops", vals: [22, 66, 12] },
  ];
  const COLS = [
    { label: "Auto-merged", hue: "violet" },
    { label: "Needs review", hue: "amber" },
    { label: "Escalated", hue: "orchid" },
  ];

  RackPlayer.register({
    slug: "kpi-columns",
    title: "Oversized KPI Bars",
    category: "data",
    tagline: "Monumental rotated percentages stamped straight across flat full-bleed outcome bars.",
    motion: "140ms crisp height snap · zero bounce · 0ms filter inversion",
    css: `
${S} .kc { width: min(100%, 620px); display: grid; gap: 14px; }
${S} .kc-head { display: grid; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
${S} .kc-head h3 { margin: 0; font: 600 22px/1.1 var(--font); letter-spacing: -0.03em; }
${S} .kc-chart { display: grid; grid-template-columns: repeat(3, 1fr); align-items: end; height: 270px; border-bottom: 1.5px solid var(--ink); }
${S} .kc-col { position: relative; height: 100%; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; }
${S} .kc-bar { width: 100%; transition: height var(--dur-snap) ease-out; }
${S} .kc-col[data-h="violet"] .kc-bar { background: var(--violet); }
${S} .kc-col[data-h="amber"] .kc-bar { background: var(--amber); }
${S} .kc-col[data-h="orchid"] .kc-bar { background: var(--orchid); }
${S} .kc-pct {
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  writing-mode: vertical-rl; transform: translateX(-50%) rotate(180deg);
  font: 500 clamp(44px, 11cqw, 92px)/0.85 var(--font); letter-spacing: -0.04em;
  color: var(--ink); pointer-events: none; user-select: none;
}
${S} .kc-labels { display: grid; grid-template-columns: repeat(3, 1fr); font-size: 12px; font-weight: 500; padding-top: 6px; }
${S}.is-tile .kc-head h3 { display: none; }
${S}.is-tile .kc-head { padding-bottom: 6px; gap: 0; }
${S}.is-tile .rk-seg button { height: 22px; padding: 0 7px; font-size: 10px; }
${S}.is-tile .kc-chart { height: 165px; }
${S}.is-tile .kc-pct { font-size: 46px; }
`,
    mount(host, ctx) {
      let at = 0;
      host.innerHTML =
        '<div class="kc">' +
          '<div class="kc-head">' +
            '<h3>Filter agent outcomes with live quantized KPI bars.</h3>' +
            '<div class="rk-seg" role="radiogroup" aria-label="Agent scope">' +
              SCOPES.map((s, i) => '<button type="button" role="radio" data-i="' + i + '" aria-checked="' + (i === 0) + '">' + s.name + '</button>').join("") +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div class="kc-chart">' +
              COLS.map((c, i) => '<div class="kc-col" data-h="' + c.hue + '" data-col="' + i + '"><div class="kc-bar"></div><span class="kc-pct"></span></div>').join("") +
            '</div>' +
            '<div class="kc-labels">' + COLS.map((c) => '<span>' + c.label + '</span>').join("") + '</div>' +
          '</div>' +
        '</div>';

      const btns = [...host.querySelectorAll("[data-i]")];
      const bars = [...host.querySelectorAll(".kc-bar")];
      const pcts = [...host.querySelectorAll(".kc-pct")];

      function draw() {
        const vals = SCOPES[at].vals;
        const max = Math.max(...vals, 60);
        btns.forEach((b, i) => b.setAttribute("aria-checked", String(i === at)));
        vals.forEach((v, i) => {
          bars[i].style.height = Math.max(12, Math.round((v / max) * 100)) + "%";
          pcts[i].textContent = v + "%";
        });
      }

      btns.forEach((b, i) => b.addEventListener("click", () => { at = i; draw(); }, { signal: ctx.signal }));
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) {
        ctx.every(1800, () => {
          if (!auto) return;
          at = (at + 1) % SCOPES.length;
          draw();
        });
      }
    },
  });
})();
