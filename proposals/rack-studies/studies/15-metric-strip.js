/* 15-metric-strip.js — Live Metric Strip:
   High-contrast 4-column agent telemetry strip with vivid colored sparkbars and 1h / 24h / 7d range toggle. */
(function () {
  const S = ".rs-metric-strip";
  const RANGES = [
    {
      label: "1h",
      cards: [
        { k: "Latency", v: "148ms", d: "-12%", h: "blue", bars: [45, 62, 54, 48, 42, 38] },
        { k: "Pass rate", v: "96.4%", d: "+2.1%", h: "emerald", bars: [78, 82, 85, 90, 94, 96] },
        { k: "Tokens/s", v: "184", d: "+19%", h: "violet", bars: [52, 60, 70, 68, 84, 92] },
        { k: "Cost / run", v: "$0.04", d: "-8%", h: "coral", bars: [68, 60, 56, 50, 44, 40] },
      ],
    },
    {
      label: "24h",
      cards: [
        { k: "Latency", v: "162ms", d: "-6%", h: "blue", bars: [66, 58, 62, 54, 50, 48] },
        { k: "Pass rate", v: "94.8%", d: "+1.4%", h: "emerald", bars: [80, 84, 82, 88, 92, 95] },
        { k: "Tokens/s", v: "168", d: "+11%", h: "violet", bars: [48, 56, 64, 72, 74, 80] },
        { k: "Cost / run", v: "$0.05", d: "-4%", h: "coral", bars: [72, 68, 64, 58, 54, 52] },
      ],
    },
    {
      label: "7d",
      cards: [
        { k: "Latency", v: "184ms", d: "-18%", h: "blue", bars: [86, 78, 72, 64, 58, 52] },
        { k: "Pass rate", v: "93.2%", d: "+4.6%", h: "emerald", bars: [68, 74, 78, 84, 90, 93] },
        { k: "Tokens/s", v: "152", d: "+24%", h: "violet", bars: [42, 50, 58, 64, 72, 78] },
        { k: "Cost / run", v: "$0.06", d: "-15%", h: "coral", bars: [84, 78, 70, 64, 56, 50] },
      ],
    },
  ];

  RackPlayer.register({
    slug: "metric-strip",
    title: "Live Metric Strip",
    category: "data",
    tagline: "Four-column agent telemetry with vivid high-chroma sparkbars and instant range switching.",
    motion: "0ms range switch · 36ms column reveal",
    css: `
${S} .ms {
  width: min(100%, 500px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); padding: 12px; display: grid; gap: 10px;
}
${S} .ms-top { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; }
${S} .ms-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
${S} .ms-card {
  background: var(--panel); border: 1px solid var(--line); border-radius: var(--r-control);
  padding: 8px; display: grid; gap: 6px;
}
${S} .ms-k { font-size: 10px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
${S} .ms-v { font: 600 17px/1 var(--mono); letter-spacing: -0.02em; }
${S} .ms-d { font: 600 10px/1 var(--mono); }
${S} .ms-d[data-h="blue"] { color: var(--blue-text); }
${S} .ms-d[data-h="emerald"] { color: var(--emerald-text); }
${S} .ms-d[data-h="violet"] { color: var(--violet-text); }
${S} .ms-d[data-h="coral"] { color: var(--coral-text); }
${S} .ms-bars { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px; align-items: end; height: 26px; }
${S} .ms-bars i { border-radius: 1px; }
${S} .ms-bars[data-h="blue"] i { background: var(--blue); }
${S} .ms-bars[data-h="emerald"] i { background: var(--emerald); }
${S} .ms-bars[data-h="violet"] i { background: var(--violet); }
${S} .ms-bars[data-h="coral"] i { background: var(--coral); }
${S}.is-tile .ms { padding: 9px; gap: 7px; }
${S}.is-tile .ms-grid { grid-template-columns: repeat(2, 1fr); gap: 5px; }
${S}.is-tile .ms-card { padding: 6px 7px; gap: 4px; }
${S}.is-tile .ms-v { font-size: 15px; }
${S}.is-tile .ms-bars { height: 18px; }
${S}.is-tile .ms-top .rk-seg button { height: 21px; padding: 0 7px; font-size: 10px; }
`,
    mount(host, ctx) {
      let cur = 0;

      host.innerHTML =
        '<div class="ms" data-col>' +
          '<div class="ms-top">' +
            '<span>Agent telemetry</span>' +
            '<div class="rk-seg is-yellow" role="radiogroup">' +
              RANGES.map((r, i) => '<button type="button" role="radio" data-i="' + i + '" aria-checked="' + (i === 0) + '">' + r.label + '</button>').join("") +
            '</div>' +
          '</div>' +
          '<div class="ms-grid" id="ms-grid"></div>' +
        '</div>';

      const grid = host.querySelector("#ms-grid");
      const btns = [...host.querySelectorAll("[role=radio]")];

      function draw() {
        btns.forEach((b, i) => b.setAttribute("aria-checked", String(i === cur)));
        grid.innerHTML = RANGES[cur].cards.map((c) =>
          '<div class="ms-card" data-col>' +
            '<span class="ms-k">' + c.k + '</span>' +
            '<span class="ms-v">' + c.v + '</span>' +
            '<span class="ms-d" data-h="' + c.h + '">' + c.d + '</span>' +
            '<div class="ms-bars" data-h="' + c.h + '">' + c.bars.map((b) => '<i style="height:' + b + '%"></i>').join("") + '</div>' +
          '</div>'
        ).join("");
      }

      btns.forEach((b) => b.addEventListener("click", () => { cur = +b.dataset.i; draw(); }, { signal: ctx.signal }));
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2400, () => { if (!auto) return; cur = (cur + 1) % RANGES.length; draw(); });
    },
  });
})();
