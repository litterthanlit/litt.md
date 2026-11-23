/* 16-metric-strip.js — Folio image_1 bottom hairline KPI strip × Rack segmented level meters.
   Four bold tabular figures separated by crisp vertical hairlines with a 1H | 24H | 7D | 30D switcher. */
(function () {
  const S = ".rs-metric-strip";
  const WINDOWS = [
    { id: "1h", name: "1H", vals: ["38", "14", "$0.42", "97.4%"], bars: [72, 48, 30, 97], sub: ["agent runs", "active tools", "token spend", "first-pass rate"] },
    { id: "24h", name: "24H", vals: ["412", "64", "$1.84", "94.1%"], bars: [86, 64, 52, 94], sub: ["agent runs", "active tools", "token spend", "first-pass rate"] },
    { id: "7d", name: "7D", vals: ["2,840", "92", "$14.60", "92.8%"], bars: [92, 78, 68, 93], sub: ["agent runs", "active tools", "token spend", "first-pass rate"] },
    { id: "30d", name: "30D", vals: ["11.4k", "128", "$58.20", "95.2%"], bars: [98, 90, 82, 95], sub: ["agent runs", "active tools", "token spend", "first-pass rate"] },
  ];
  const HUES = ["violet", "amber", "orchid", "teal"];

  RackPlayer.register({
    slug: "metric-strip",
    title: "Live Telemetry Strip",
    category: "data",
    tagline: "Four hairline-divided editorial KPIs over crisp segmented Rack throughput meters.",
    motion: "0ms window cut · 140ms meter snap · column beat entrance",
    css: `
${S} .ms { width: min(100%, 820px); display: grid; gap: 12px; }
${S} .ms-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; }
${S} .ms-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1.5px solid var(--ink); border-bottom: 1px solid var(--line-strong); }
${S} .ms-cell { padding: 14px 12px 12px; border-right: 1px solid var(--line-strong); display: grid; gap: 8px; }
${S} .ms-cell:last-child { border-right: 0; }
${S} .ms-num { font: 500 clamp(24px, 4.2cqw, 42px)/1 var(--font); letter-spacing: -0.04em; }
${S} .ms-sub { font-size: 11px; color: var(--muted); }
${S} .ms-meter { display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; height: 8px; }
${S} .ms-pip { background: var(--surface-3); }
${S} .ms-cell[data-h="violet"] .ms-pip.is-on { background: var(--violet); }
${S} .ms-cell[data-h="amber"] .ms-pip.is-on { background: var(--amber); }
${S} .ms-cell[data-h="orchid"] .ms-pip.is-on { background: var(--orchid); }
${S} .ms-cell[data-h="teal"] .ms-pip.is-on { background: var(--teal); }
${S}.is-tile .ms-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
${S}.is-tile .ms-cell { padding: 8px; border-bottom: 1px solid var(--line-strong); }
${S}.is-tile .ms-num { font-size: 24px; }
${S}.is-tile .rk-seg button { height: 22px; padding: 0 7px; font-size: 10px; }
@container (max-width: 480px) {
  ${S} .ms-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  ${S} .ms-cell { border-bottom: 1px solid var(--line-strong); }
}
`,
    mount(host, ctx) {
      let at = 1;
      host.innerHTML =
        '<div class="ms">' +
          '<div class="ms-top">' +
            '<span style="font-weight:600;font-size:13px">Workspace telemetry · live window</span>' +
            '<div class="rk-seg" role="radiogroup" aria-label="Time window">' +
              WINDOWS.map((w, i) => '<button type="button" role="radio" data-i="' + i + '" aria-checked="' + (i === at) + '">' + w.name + '</button>').join("") +
            '</div>' +
          '</div>' +
          '<div class="ms-grid">' +
            HUES.map((h, i) =>
              '<div class="ms-cell" data-h="' + h + '" data-col="' + i + '">' +
                '<span class="ms-num"></span>' +
                '<span class="ms-sub"></span>' +
                '<div class="ms-meter">' + Array.from({ length: 10 }, () => '<i class="ms-pip"></i>').join("") + '</div>' +
              '</div>'
            ).join("") +
          '</div>' +
        '</div>';

      const btns = [...host.querySelectorAll("[data-i]")];
      const cells = [...host.querySelectorAll(".ms-cell")];

      function draw() {
        const w = WINDOWS[at];
        btns.forEach((b, i) => b.setAttribute("aria-checked", String(i === at)));
        cells.forEach((c, i) => {
          c.querySelector(".ms-num").textContent = w.vals[i];
          c.querySelector(".ms-sub").textContent = w.sub[i];
          const lit = Math.round(w.bars[i] / 10);
          [...c.querySelectorAll(".ms-pip")].forEach((p, k) => p.classList.toggle("is-on", k < lit));
        });
      }

      btns.forEach((b, i) => b.addEventListener("click", () => { at = i; draw(); }, { signal: ctx.signal }));
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) {
        ctx.every(1900, () => {
          if (!auto) return;
          at = (at + 1) % WINDOWS.length;
          draw();
        });
      }
    },
  });
})();
