/* 02-token-matrix.js — Folio-inspired unit matrix for an agent run (1 square = 1k tokens).
   Crisp 1px-ruled grouping strip disaggregates 120 squares into labeled quadrants on the beat,
   with FIG. 02 caption and expandable Show data table ↓. */
(function () {
  const S = ".rs-token-matrix";
  const TOTAL = 120;
  const GROUPS = {
    all: [{ label: "Full context window", hue: "mix", count: 120 }],
    stage: [
      { label: "Reasoning", hue: "violet", count: 44 },
      { label: "Tool I/O", hue: "amber", count: 34 },
      { label: "File reads", hue: "orchid", count: 26 },
      { label: "Output", hue: "ink", count: 16 },
    ],
    agent: [
      { label: "Coder", hue: "violet", count: 52 },
      { label: "Research", hue: "amber", count: 30 },
      { label: "Verifier", hue: "orchid", count: 24 },
      { label: "Router", hue: "ink", count: 14 },
    ],
    cache: [
      { label: "Cache hit", hue: "violet", count: 68 },
      { label: "Fresh prompt", hue: "amber", count: 28 },
      { label: "Tool delta", hue: "orchid", count: 14 },
      { label: "Stream out", hue: "ink", count: 10 },
    ],
  };
  const MODES = [
    { id: "stage", name: "Stage" },
    { id: "agent", name: "Agent" },
    { id: "cache", name: "Cache" },
    { id: "all", name: "All" },
  ];

  RackPlayer.register({
    slug: "token-matrix",
    title: "Unit Token Matrix",
    category: "data",
    tagline: "One square per 1k tokens, disaggregated on the beat with an accessible data table.",
    motion: "100ms column cut-in · 0ms grouping snap · zero bounce",
    css: `
${S} .tm { width: min(100%, 760px); display: grid; gap: 12px; }
${S} .tm-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
${S} .tm-cap { font-weight: 600; font-size: 13px; letter-spacing: -0.01em; }
${S} .tm-quads { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 18px; }
${S} .tm-quads.is-all { grid-template-columns: 1fr; }
${S} .tm-q { display: grid; gap: 6px; align-content: start; }
${S} .tm-qh { font-size: 11px; font-weight: 500; display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }
${S} .tm-qh span { color: var(--muted); font-family: var(--mono); font-size: 10px; }
${S} .tm-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 3px; }
${S} .tm-quads.is-all .tm-grid { grid-template-columns: repeat(24, 1fr); }
${S} .tm-sq { aspect-ratio: 1; background: var(--ink); }
${S} .tm-sq[data-h="violet"] { background: var(--violet); }
${S} .tm-sq[data-h="amber"] { background: var(--amber); }
${S} .tm-sq[data-h="orchid"] { background: var(--orchid); }
${S} .tm-sq[data-h="ink"] { background: var(--ink); }
${S} .tm-foot { border-top: 1px solid var(--line-strong); padding-top: 10px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
${S} .tm-tbl { width: 100%; border-collapse: collapse; font-size: 12px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--cut); }
${S} .tm-tbl th, ${S} .tm-tbl td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); }
${S} .tm-tbl th:not(:first-child), ${S} .tm-tbl td:not(:first-child) { text-align: right; font-family: var(--mono); }
${S} .tm-tbl[hidden] { display: none; }
${S}.is-tile .tm-foot, ${S}.is-tile .tm-tbl { display: none; }
${S}.is-tile .tm-cap { font-size: 11px; }
${S}.is-tile .rk-seg button { height: 22px; padding: 0 7px; font-size: 10px; }
${S}.is-tile .tm-quads { gap: 8px 10px; }
${S}.is-tile .tm-grid { gap: 2px; }
`,
    mount(host, ctx) {
      let mode = "stage", tblOpen = false;
      host.innerHTML =
        '<div class="tm">' +
          '<div class="tm-bar">' +
            '<span class="tm-cap">Unit matrix, one square per 1k tokens</span>' +
            '<div class="rk-seg" role="radiogroup" aria-label="Grouping">' +
              MODES.map((m) => '<button type="button" role="radio" data-m="' + m.id + '" aria-checked="' + (m.id === mode) + '">' + m.name + '</button>').join("") +
            '</div>' +
          '</div>' +
          '<div class="tm-quads"></div>' +
          '<div class="tm-foot">' +
            '<div><div class="rk-fig">FIG. 02</div><div style="font-size:11px;color:var(--muted)">120k context budget across active session; switch grouping to disaggregate.</div></div>' +
            '<button type="button" class="rk-btn" id="tm-toggle">Show data table ↓</button>' +
          '</div>' +
          '<table class="tm-tbl" hidden><thead><tr><th>Bucket</th><th>Tokens</th><th>Share</th></tr></thead><tbody></tbody></table>' +
        '</div>';

      const quads = host.querySelector(".tm-quads");
      const btns = [...host.querySelectorAll("[data-m]")];
      const toggle = host.querySelector("#tm-toggle");
      const tbl = host.querySelector(".tm-tbl");
      const tbody = tbl.querySelector("tbody");

      function render(animate) {
        btns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.m === mode)));
        quads.classList.toggle("is-all", mode === "all");
        quads.textContent = "";
        const items = GROUPS[mode];
        if (mode === "all") {
          const q = document.createElement("div");
          q.className = "tm-q"; q.dataset.col = "0";
          const h = document.createElement("div"); h.className = "tm-qh";
          h.innerHTML = "<b>All buckets · 120k</b><span>100.0%</span>";
          const g = document.createElement("div"); g.className = "tm-grid";
          GROUPS.stage.forEach((sg) => {
            for (let i = 0; i < sg.count; i++) {
              const s = document.createElement("i"); s.className = "tm-sq"; s.dataset.h = sg.hue; g.appendChild(s);
            }
          });
          q.append(h, g); quads.appendChild(q);
        } else {
          items.forEach((it, idx) => {
            const pct = ((it.count / TOTAL) * 100).toFixed(1) + "%";
            const q = document.createElement("div"); q.className = "tm-q"; q.dataset.col = String(idx % 2);
            const h = document.createElement("div"); h.className = "tm-qh";
            h.innerHTML = "<b>" + it.label + "</b><span>" + it.count + "k (" + pct + ")</span>";
            const g = document.createElement("div"); g.className = "tm-grid";
            for (let i = 0; i < it.count; i++) {
              const s = document.createElement("i"); s.className = "tm-sq"; s.dataset.h = it.hue; g.appendChild(s);
            }
            q.append(h, g); quads.appendChild(q);
          });
        }
        if (animate && !ctx.tile) ctx.beatColumns(quads, ".tm-q");
        const rows = mode === "all" ? GROUPS.stage : items;
        tbody.innerHTML = rows.map((r) =>
          "<tr><td>" + r.label + "</td><td>" + r.count + ",000</td><td>" + ((r.count / TOTAL) * 100).toFixed(1) + "%</td></tr>"
        ).join("");
      }

      btns.forEach((b) => b.addEventListener("click", () => { mode = b.dataset.m; render(true); }, { signal: ctx.signal }));
      toggle.addEventListener("click", () => {
        tblOpen = !tblOpen;
        tbl.hidden = !tblOpen;
        toggle.textContent = tblOpen ? "Hide data table ↑" : "Show data table ↓";
      }, { signal: ctx.signal });

      render(false);

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      const seq = ["stage", "agent", "cache", "all"];
      let k = 0;
      if (auto) {
        ctx.every(2200, () => {
          if (!auto) return;
          k = (k + 1) % seq.length;
          mode = seq[k];
          render();
        });
      }
    },
  });
})();
