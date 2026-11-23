/* 04-budget-bar.js — Folio image_2-inspired 100% stacked composition bar paired with a sortable
   1px-ruled breakdown table. Hovering or focusing any row cross-highlights its segment on the frame. */
(function () {
  const S = ".rs-budget-bar";
  const ROWS = [
    { id: "coder", name: "Coder", hue: "violet", calls: 148, share: 34, median: 420 },
    { id: "research", name: "Research", hue: "amber", calls: 121, share: 27, median: 375 },
    { id: "verifier", name: "Verifier", hue: "orchid", calls: 87, share: 21, median: 284 },
    { id: "router", name: "Router", hue: "ink", calls: 42, share: 12, median: 129 },
    { id: "other", name: "Cache", hue: "muted", calls: 14, share: 6, median: 48 },
  ];

  RackPlayer.register({
    slug: "budget-bar",
    title: "100% Stacked Composition",
    category: "data",
    tagline: "Proportional compute breakdown paired with a sortable, cross-highlighting table.",
    motion: "0ms cross-highlight · 0ms sort cut · zero blur",
    css: `
${S} .bb { width: min(100%, 720px); display: grid; gap: 14px; }
${S} .bb-h { font-weight: 600; font-size: 13px; margin: 0; }
${S} .bb-ticks { display: flex; width: 100%; font-size: 10px; color: var(--muted); }
${S} .bb-tick { display: grid; justify-items: center; gap: 3px; min-width: 0; }
${S} .bb-tick span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
${S} .bb-tick i { width: 1px; height: 10px; background: var(--border-soft); }
${S} .bb-bar { display: flex; width: 100%; height: 34px; border: 1px solid var(--border); }
${S} .bb-seg {
  display: flex; align-items: center; padding: 0 7px; font-size: 11px; font-weight: 600;
  color: #ffffff; cursor: pointer; overflow: hidden; white-space: nowrap;
}
${S} .bb-seg[data-h="violet"] { background: var(--violet); }
${S} .bb-seg[data-h="amber"] { background: var(--amber); }
${S} .bb-seg[data-h="orchid"] { background: var(--orchid); }
${S} .bb-seg[data-h="ink"] { background: var(--ink); color: var(--on-ink); }
${S} .bb-seg[data-h="muted"] { background: var(--surface-3); color: var(--ink); }
${S} .bb.has-hi .bb-seg:not(.is-hi) { opacity: 0.3; }
${S} .bb-tbl { width: 100%; border-collapse: collapse; font-size: 12px; border-top: 1.5px solid var(--ink); border-bottom: 1.5px solid var(--ink); }
${S} .bb-tbl th { text-align: left; padding: 7px 6px; border-bottom: 1px solid var(--line-strong); font-size: 11px; color: var(--muted); font-weight: 500; }
${S} .bb-tbl th button { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
${S} .bb-tbl th:not(:first-child), ${S} .bb-tbl td:not(:first-child) { text-align: right; }
${S} .bb-tbl td { padding: 7px 6px; border-bottom: 1px solid var(--line); }
${S} .bb-tbl tbody tr { cursor: pointer; }
${S} .bb-tbl tbody tr.is-hi { background: var(--surface-2); font-weight: 600; }
${S} .bb-mini { display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end; }
${S} .bb-track { width: 46px; height: 4px; background: var(--surface-3); display: inline-block; text-align: left; }
${S} .bb-track i { display: block; height: 100%; background: var(--violet); }
${S}.is-tile .bb-tbl th:nth-child(4), ${S}.is-tile .bb-tbl td:nth-child(4) { display: none; }
${S}.is-tile .bb-tbl td, ${S}.is-tile .bb-tbl th { padding: 4px 5px; font-size: 11px; }
${S}.is-tile .bb-bar { height: 26px; }
`,
    mount(host, ctx) {
      let sortKey = "share", sortDir = -1, hi = null;
      host.innerHTML =
        '<div class="bb">' +
          '<div>' +
            '<p class="bb-h">Compute share by stage (100% stacked bar)</p>' +
            '<div class="bb-ticks" style="margin-top:8px"></div>' +
            '<div class="bb-bar"></div>' +
          '</div>' +
          '<table class="bb-tbl">' +
            '<thead><tr>' +
              '<th><button type="button" data-k="name">Stage</button></th>' +
              '<th><button type="button" data-k="calls">Calls</button></th>' +
              '<th><button type="button" data-k="share">Share ↓</button></th>' +
              '<th><button type="button" data-k="median">Median ms</button></th>' +
            '</tr></thead>' +
            '<tbody></tbody>' +
          '</table>' +
        '</div>';

      const root = host.querySelector(".bb");
      const ticks = host.querySelector(".bb-ticks");
      const bar = host.querySelector(".bb-bar");
      const tbody = host.querySelector("tbody");
      const sortBtns = [...host.querySelectorAll("thead button")];

      ROWS.forEach((r) => {
        const t = document.createElement("div");
        t.className = "bb-tick"; t.style.width = r.share + "%";
        t.innerHTML = "<span>" + r.name + "</span><i></i>";
        ticks.appendChild(t);

        const seg = document.createElement("div");
        seg.className = "bb-seg"; seg.dataset.id = r.id; seg.dataset.h = r.hue;
        seg.style.width = r.share + "%";
        seg.textContent = r.share >= 10 ? r.share + "%" : "";
        seg.addEventListener("pointerenter", () => setHi(r.id), { signal: ctx.signal });
        seg.addEventListener("pointerleave", () => setHi(null), { signal: ctx.signal });
        bar.appendChild(seg);
      });

      const segEls = [...bar.children];
      function setHi(id) {
        hi = id;
        root.classList.toggle("has-hi", !!hi);
        segEls.forEach((s) => s.classList.toggle("is-hi", s.dataset.id === hi));
        [...tbody.children].forEach((tr) => tr.classList.toggle("is-hi", tr.dataset.id === hi));
      }

      function renderTable() {
        const sorted = [...ROWS].sort((a, b) =>
          sortKey === "name" ? a.name.localeCompare(b.name) * sortDir : (a[sortKey] - b[sortKey]) * sortDir
        );
        tbody.innerHTML = sorted.map((r) =>
          '<tr data-id="' + r.id + '" tabindex="0">' +
            '<td>' + r.name + '</td>' +
            '<td class="rk-mono">' + r.calls + '</td>' +
            '<td><span class="bb-mini"><span class="bb-track"><i style="width:' + Math.min(100, r.share * 2.5) + '%"></i></span><span class="rk-mono">' + r.share.toFixed(1) + '%</span></span></td>' +
            '<td class="rk-mono">' + r.median + '</td>' +
          '</tr>'
        ).join("");
        [...tbody.children].forEach((tr) => {
          const id = tr.dataset.id;
          tr.addEventListener("pointerenter", () => setHi(id), { signal: ctx.signal });
          tr.addEventListener("pointerleave", () => setHi(null), { signal: ctx.signal });
          tr.addEventListener("focus", () => setHi(id), { signal: ctx.signal });
          tr.addEventListener("blur", () => setHi(null), { signal: ctx.signal });
        });
        sortBtns.forEach((b) => {
          const k = b.dataset.k;
          const base = { name: "Stage", calls: "Calls", share: "Share", median: "Median ms" }[k];
          b.textContent = base + (k === sortKey ? (sortDir < 0 ? " ↓" : " ↑") : "");
        });
        setHi(hi);
      }

      sortBtns.forEach((b) => b.addEventListener("click", () => {
        if (sortKey === b.dataset.k) sortDir *= -1;
        else { sortKey = b.dataset.k; sortDir = b.dataset.k === "name" ? 1 : -1; }
        renderTable();
      }, { signal: ctx.signal }));

      renderTable();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      let step = 0;
      if (auto) {
        ctx.every(1400, () => {
          if (!auto) return;
          setHi(ROWS[step % ROWS.length].id);
          step++;
        });
      }
    },
  });
})();
