/* 14-day suite reliability (Plain / Subtraction): 5 suites x 14 days monochrome R7 magnitude heatmap.
   4 crisp ink steps (--ink-8, --ink-18, --ink-42, and solid --ink with --page figure for the 3 < 95 % anomalies).
   Zero floating tooltip box: inspecting a cell frames it in 4 corner hairlines, dims other rows to 0.30, and states the datum in the header. */
(function () {
  const SUITES = [
    {
      name: "Auth",
      days: [
        [100.0, "0 failures"], [100.0, "0 failures"], [98.6, "1 token refresh retry"], [100.0, "0 failures"],
        [98.4, "2 OAuth state retries"], [96.8, "3 PKCE timeouts"], [98.8, "1 session lock retry"], [100.0, "0 failures"],
        [98.5, "2 cookie rotation retries"], [100.0, "0 failures"], [100.0, "0 failures"], [98.7, "1 JWKS cache miss"],
        [100.0, "0 failures"], [100.0, "0 failures"],
      ],
    },
    {
      name: "Billing",
      days: [
        [100.0, "0 failures"], [98.7, "1 ledger lock retry"], [100.0, "0 failures"], [100.0, "0 failures"],
        [98.4, "2 webhook acks delayed"], [100.0, "0 failures"], [98.3, "2 invoice sync retries"], [96.2, "3 gateway slowdowns"],
        [91.2, "4 timeouts"], [95.8, "3 retry recoveries"], [98.6, "1 proration retry"], [100.0, "0 failures"],
        [98.8, "1 idempotency replay"], [100.0, "0 failures"],
      ],
    },
    {
      name: "Search",
      days: [
        [98.5, "2 shard warmups"], [100.0, "0 failures"], [96.4, "3 slow reindex batches"], [93.4, "3 index stalls"],
        [96.0, "3 replica catch-ups"], [98.6, "1 query planner retry"], [100.0, "0 failures"], [100.0, "0 failures"],
        [98.3, "2 ranker timeouts"], [96.6, "3 vector cache misses"], [98.7, "1 tokenizer retry"], [100.0, "0 failures"],
        [100.0, "0 failures"], [98.5, "2 cold shard queries"],
      ],
    },
    {
      name: "CLI",
      days: [
        [100.0, "0 failures"], [98.8, "1 PTY teardown flake"], [100.0, "0 failures"], [98.5, "2 registry mirror retries"],
        [100.0, "0 failures"], [98.4, "2 sandbox mount retries"], [96.5, "3 diff stream stalls"], [98.6, "1 auth token refresh"],
        [100.0, "0 failures"], [96.2, "3 git worktree locks"], [98.7, "1 watch mode debounce"], [100.0, "0 failures"],
        [98.5, "2 exit-code races"], [100.0, "0 failures"],
      ],
    },
    {
      name: "Webhooks",
      days: [
        [100.0, "0 failures"], [96.4, "3 TLS handshake retries"], [98.4, "2 queue backoffs"], [100.0, "0 failures"],
        [96.2, "3 endpoint 502 retries"], [98.5, "2 delivery retries"], [100.0, "0 failures"], [98.3, "2 DNS lookup retries"],
        [96.0, "3 worker pool waits"], [98.6, "1 dead-letter replay"], [95.4, "4 backoff spikes"], [89.6, "5 signature drops"],
        [95.6, "3 replay drains"], [100.0, "0 failures"],
      ],
    },
  ];

  const FILTERS = [
    { key: "all", label: "All cells" },
    { key: "below99", label: "Below 99 %" },
    { key: "anomalies", label: "Anomalies (< 95 %)" },
  ];

  function stepOf(rate) {
    if (rate >= 99.5) return 0;
    if (rate >= 98.0) return 1;
    if (rate >= 95.0) return 2;
    return 3;
  }

  PlainPlayer.registerData({
    slug: "heatmap",
    chapter: "tables",
    span: "full",
    title: "14-day suite reliability",
    css: `
.dd-heatmap { display: grid; gap: 18px; width: 100%; min-width: 0; padding-top: 24px; border-top: 1px solid var(--line) }
.dd-heatmap .hm-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 24px }
.dd-heatmap .hm-meta { display: grid; gap: 4px; min-width: 0 }
.dd-heatmap .hm-title-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 12px }
.dd-heatmap .hm-title-row h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em; color: var(--ink) }
.dd-heatmap .hm-fig { font-size: 24px; line-height: 1.1 }
.dd-heatmap .hm-readout { margin: 0; min-height: 20px; font-size: 13px; line-height: 1.45; color: var(--muted); font-variant-numeric: tabular-nums;
  transition: color var(--dur-instant) var(--ease-out) }
.dd-heatmap .hm-readout.is-active { color: var(--ink) }
.dd-heatmap .hm-readout .hm-alert { color: var(--danger); font-weight: 500 }
.dd-heatmap .hm-filters { position: relative; display: inline-flex; flex-wrap: wrap; align-items: center; gap: 22px; padding: 2px 11px }
.dd-heatmap .hm-filters .q { min-height: 28px; font-size: 13.5px }
.dd-heatmap .hm-scroll { width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 2px }
.dd-heatmap .hm-matrix { position: relative; min-width: 520px; display: grid; gap: 6px }
.dd-heatmap .hm-days,
.dd-heatmap .hm-row { display: grid; grid-template-columns: 84px repeat(14, minmax(0, 1fr)); align-items: center; column-gap: 2px }
.dd-heatmap .hm-days { padding: 0 2px }
.dd-heatmap .hm-day { text-align: center; font-size: 12px; line-height: 1.3; color: var(--muted); font-variant-numeric: tabular-nums;
  user-select: none; transition: color var(--dur-instant) var(--ease-out) }
.dd-heatmap .hm-day.is-active { color: var(--ink); font-weight: 500 }
.dd-heatmap .hm-rows { position: relative; display: grid; row-gap: 2px; padding: 2px }
.dd-heatmap .hm-row { transition: opacity var(--dur-pare) var(--ease-out) }
.dd-heatmap .hm-rows.is-inspecting .hm-row:not(.is-row-active) { opacity: 0.30 }
.dd-heatmap .hm-suite { padding-right: 12px; font-size: 13.5px; font-weight: 400; color: var(--ink); white-space: nowrap;
  transition: opacity var(--dur-pare) var(--ease-out) }
.dd-heatmap .hm-row.is-row-active .hm-suite { font-weight: 500 }
.dd-heatmap .hm-matrix[data-filter="anomalies"] .hm-row[data-has-anomaly="0"] .hm-suite { opacity: 0.36 }
.dd-heatmap .hm-cell { position: relative; aspect-ratio: 1; width: 100%; padding: 0; border: 0; border-radius: 0;
  display: grid; place-items: center; cursor: pointer; font-size: 12px; font-weight: 500; line-height: 1;
  font-variant-numeric: tabular-nums; -webkit-tap-highlight-color: transparent;
  transition: opacity var(--dur-settle) var(--ease-out) }
.dd-heatmap .hm-cell[data-step="0"] { background: var(--ink-8); color: transparent }
.dd-heatmap .hm-cell[data-step="1"] { background: var(--ink-18); color: transparent }
.dd-heatmap .hm-cell[data-step="2"] { background: var(--ink-42); color: transparent }
.dd-heatmap .hm-cell[data-step="3"] { background: var(--ink); color: var(--page) }
.dd-heatmap .hm-matrix[data-filter="below99"] .hm-cell[data-step="0"]:not(.is-cell-active) { opacity: 0.12 }
.dd-heatmap .hm-matrix[data-filter="anomalies"] .hm-cell:not([data-step="3"]):not(.is-cell-active) { opacity: 0.12 }
.dd-heatmap .hm-cell:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; z-index: 2 }
.dd-heatmap .hm-rows > .pm-frame { z-index: 3 }
.dd-heatmap .hm-key { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 20px; font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums }
.dd-heatmap .hm-key-item { display: inline-flex; align-items: center; gap: 7px; transition: opacity var(--dur-pare) var(--ease-out) }
.dd-heatmap .hm-sw { width: 10px; height: 10px; flex: none }
.dd-heatmap .hm-sw-0 { background: var(--ink-8) }
.dd-heatmap .hm-sw-1 { background: var(--ink-18) }
.dd-heatmap .hm-sw-2 { background: var(--ink-42) }
.dd-heatmap .hm-sw-3 { background: var(--ink) }
.dd-heatmap .hm-key[data-filter="below99"] .hm-key-item[data-k="0"] { opacity: var(--step-back) }
.dd-heatmap .hm-key[data-filter="anomalies"] .hm-key-item:not([data-k="3"]) { opacity: var(--step-back) }
@container (max-width: 460px) {
  .dd-heatmap .hm-filters { gap: 13px; padding: 2px 10px }
  .dd-heatmap .hm-filters .q { font-size: 12.5px }
  .dd-heatmap .hm-cell { font-size: 11.5px }
}
`,
    mount(host, ctx) {
      let currentFilter = "all";
      let focusR = 1;
      let focusC = 8; // Billing · Day 9 (91.2 % · 4 timeouts)
      let activeCell = null;

      const totalRates = SUITES.flatMap((s) => s.days.map((d) => d[0]));
      const overall = (totalRates.reduce((a, b) => a + b, 0) / totalRates.length).toFixed(1);

      host.innerHTML = `
<div class="hm-head">
  <div class="hm-meta">
    <div class="hm-title-row">
      <h3>14-day suite reliability</h3>
      <span class="fig hm-fig">${overall} %</span>
    </div>
    <p class="hm-readout"></p>
  </div>
  <div class="hm-filters" role="radiogroup" aria-label="Filter heatmap cells">
    ${FILTERS.map((f) => `<button class="q in-frame" type="button" role="radio" aria-checked="${f.key === "all" ? "true" : "false"}" tabindex="${f.key === "all" ? "0" : "-1"}" data-filter="${f.key}">${f.label}</button>`).join("")}
  </div>
</div>
<div class="hm-scroll">
  <div class="hm-matrix" data-filter="all">
    <div class="hm-days" aria-hidden="true">
      <span></span>
      ${Array.from({ length: 14 }, (_, c) => `<span class="hm-day" data-day="${c}">D${c + 1}</span>`).join("")}
    </div>
    <div class="hm-rows" role="grid" aria-label="14-day suite reliability matrix">
      ${SUITES.map((s, r) => {
        const hasAnomaly = s.days.some((d) => stepOf(d[0]) === 3) ? "1" : "0";
        return `
      <div class="hm-row" role="row" data-r="${r}" data-has-anomaly="${hasAnomaly}">
        <span class="hm-suite" role="rowheader">${s.name}</span>
        ${s.days.map((d, c) => {
          const step = stepOf(d[0]);
          const txt = step === 3 ? `${Math.round(d[0])}%` : "";
          return `<button type="button" class="hm-cell" role="gridcell" data-r="${r}" data-c="${c}" data-step="${step}" tabindex="${r === focusR && c === focusC ? "0" : "-1"}" aria-label="${s.name}, Day ${c + 1}, ${d[0].toFixed(1)} percent, ${d[1]}">${txt}</button>`;
        }).join("")}
      </div>`;
      }).join("")}
    </div>
  </div>
</div>
<div class="hm-key" data-filter="all" aria-label="Monochrome reliability scale">
  <span class="hm-key-item" data-k="0"><i class="hm-sw hm-sw-0" aria-hidden="true"></i>100 %</span>
  <span class="hm-key-item" data-k="1"><i class="hm-sw hm-sw-1" aria-hidden="true"></i>98\u201399 %</span>
  <span class="hm-key-item" data-k="2"><i class="hm-sw hm-sw-2" aria-hidden="true"></i>95\u201397 %</span>
  <span class="hm-key-item" data-k="3"><i class="hm-sw hm-sw-3" aria-hidden="true"></i>&lt; 95 % anomaly (3)</span>
</div>
<p class="sr-only" aria-live="polite"></p>`;

      const readoutEl = host.querySelector(".hm-readout");
      const filterWrap = host.querySelector(".hm-filters");
      const filterBtns = [...filterWrap.querySelectorAll("[data-filter]")];
      const matrixEl = host.querySelector(".hm-matrix");
      const rowsWrap = host.querySelector(".hm-rows");
      const rowEls = [...rowsWrap.querySelectorAll(".hm-row")];
      const dayEls = [...host.querySelectorAll(".hm-day")];
      const keyEl = host.querySelector(".hm-key");
      const sr = host.querySelector("[aria-live]");
      const cells = SUITES.map((_, r) => [...rowEls[r].querySelectorAll(".hm-cell")]);

      const filterFrame = ctx.brackets(filterWrap, { padX: 9, padY: 2, exactPad: true });
      const cellFrame = ctx.brackets(rowsWrap, { padX: 2, padY: 2, size: 6, exactPad: true });

      function defaultReadout() {
        if (currentFilter === "anomalies") {
          return "3 anomalies below 95 % \u00b7 Billing D9 (91.2 %), Search D4 (93.4 %), Webhooks D12 (89.6 %)";
        }
        if (currentFilter === "below99") {
          return "41 degraded suite-days (< 99 %) across 14 days \u00b7 29 clean days stepped back";
        }
        return "5 suites \u00d7 14 days \u00b7 3 anomalies below 95 %";
      }

      function renderCellReadout(r, c) {
        const s = SUITES[r];
        const [rate, note] = s.days[c];
        const step = stepOf(rate);
        readoutEl.classList.add("is-active");
        readoutEl.textContent = "";
        const prefix = document.createTextNode(`${s.name} \u00b7 Day ${c + 1} \u00b7 ${rate.toFixed(1)} % \u00b7 `);
        readoutEl.appendChild(prefix);
        if (step === 3) {
          const span = document.createElement("span");
          span.className = "hm-alert";
          span.textContent = note;
          readoutEl.appendChild(span);
        } else {
          readoutEl.appendChild(document.createTextNode(note));
        }
      }

      function resetReadout() {
        readoutEl.classList.remove("is-active");
        readoutEl.textContent = defaultReadout();
      }

      function syncRoving(focusDom) {
        for (let r = 0; r < SUITES.length; r++) {
          for (let c = 0; c < 14; c++) {
            cells[r][c].tabIndex = r === focusR && c === focusC ? 0 : -1;
          }
        }
        if (focusDom) cells[focusR][focusC].focus({ preventScroll: true });
      }

      function inspectCell(r, c, opts) {
        const o = opts || {};
        const btn = cells[r][c];
        const firstShow = !activeCell;
        activeCell = [r, c];
        rowsWrap.classList.add("is-inspecting");
        rowEls.forEach((el, idx) => el.classList.toggle("is-row-active", idx === r));
        dayEls.forEach((el, idx) => el.classList.toggle("is-active", idx === c));
        for (let rr = 0; rr < SUITES.length; rr++) {
          for (let cc = 0; cc < 14; cc++) {
            cells[rr][cc].classList.toggle("is-cell-active", rr === r && cc === c);
          }
        }
        cellFrame.moveTo(btn, { immediate: !!o.immediate || firstShow });
        renderCellReadout(r, c);
        if (o.announce) {
          const s = SUITES[r];
          const [rate, note] = s.days[c];
          sr.textContent = `${s.name}, Day ${c + 1}, ${rate.toFixed(1)} percent, ${note}.`;
        }
      }

      function clearInspect() {
        if (!activeCell) return;
        activeCell = null;
        rowsWrap.classList.remove("is-inspecting");
        rowEls.forEach((el) => el.classList.remove("is-row-active"));
        dayEls.forEach((el) => el.classList.remove("is-active"));
        for (let rr = 0; rr < SUITES.length; rr++) {
          for (let cc = 0; cc < 14; cc++) cells[rr][cc].classList.remove("is-cell-active");
        }
        cellFrame.pare();
        resetReadout();
      }

      function setFilter(next, immediate, byUser) {
        currentFilter = next;
        matrixEl.dataset.filter = next;
        keyEl.dataset.filter = next;
        for (const b of filterBtns) {
          const on = b.dataset.filter === next;
          b.setAttribute("aria-checked", on ? "true" : "false");
          b.tabIndex = on ? 0 : -1;
          if (on) filterFrame.moveTo(b, { immediate });
        }
        if (!activeCell) resetReadout();
        if (byUser) sr.textContent = defaultReadout();
      }

      for (let r = 0; r < SUITES.length; r++) {
        for (let c = 0; c < 14; c++) {
          const btn = cells[r][c];
          btn.addEventListener("pointerenter", () => {
            inspectCell(r, c, { immediate: false });
          }, { signal: ctx.signal });
          btn.addEventListener("click", () => {
            focusR = r;
            focusC = c;
            syncRoving(true);
            inspectCell(r, c, { announce: true });
          }, { signal: ctx.signal });
        }
      }

      rowsWrap.addEventListener("pointerleave", () => {
        if (!rowsWrap.contains(document.activeElement)) clearInspect();
      }, { signal: ctx.signal });

      rowsWrap.addEventListener("focusin", (e) => {
        const btn = e.target.closest(".hm-cell");
        if (!btn) return;
        const r = Number(btn.dataset.r);
        const c = Number(btn.dataset.c);
        focusR = r;
        focusC = c;
        syncRoving(false);
        inspectCell(r, c, { immediate: false });
      }, { signal: ctx.signal });

      rowsWrap.addEventListener("focusout", (e) => {
        if (!rowsWrap.contains(e.relatedTarget)) clearInspect();
      }, { signal: ctx.signal });

      rowsWrap.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && activeCell) {
          e.preventDefault();
          cells[focusR][focusC].blur();
          clearInspect();
          return;
        }
        let nr = focusR;
        let nc = focusC;
        if (e.key === "ArrowRight") nc = (nc + 1) % 14;
        else if (e.key === "ArrowLeft") nc = (nc + 13) % 14;
        else if (e.key === "ArrowDown") nr = (nr + 1) % SUITES.length;
        else if (e.key === "ArrowUp") nr = (nr + SUITES.length - 1) % SUITES.length;
        else if (e.key === "Home") nc = 0;
        else if (e.key === "End") nc = 13;
        else return;
        e.preventDefault();
        focusR = nr;
        focusC = nc;
        syncRoving(true);
        inspectCell(nr, nc, { announce: true });
      }, { signal: ctx.signal });

      for (const b of filterBtns) {
        b.addEventListener("click", () => setFilter(b.dataset.filter, false, true), { signal: ctx.signal });
      }

      filterWrap.addEventListener("keydown", (e) => {
        const idx = filterBtns.findIndex((b) => b.dataset.filter === currentFilter);
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % filterBtns.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + filterBtns.length) % filterBtns.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = filterBtns.length - 1;
        if (next >= 0) {
          e.preventDefault();
          const btn = filterBtns[next];
          setFilter(btn.dataset.filter, false, true);
          btn.focus();
        }
      }, { signal: ctx.signal });

      setFilter("all", true, false);
    },
  });
})();
