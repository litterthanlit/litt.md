/* Evaluation ledger (Plain / Subtraction): open-paper sortable & filterable benchmark ledger.
   Zero outer border box: 1px --line-control under thead, 1px --line between body rows, 1px --line-strong above tfoot.
   Unselected filters sit at 0.40 opacity; inactive sort headers sit at 0.55 opacity; row hover dims siblings to 0.32. */
(function () {
  const RUNS = [
    { id: "run_8d12", task: "Migrate billing schema", model: "Opus", files: 9, tokens: 68.4, duration: 5.0, cost: 0.48, status: "regressed" },
    { id: "run_6a90", task: "Refactor AST walker", model: "Opus", files: 6, tokens: 48.4, duration: 6.4, cost: 0.37, status: "passed" },
    { id: "run_4c08", task: "Patch OAuth callback", model: "Opus", files: 5, tokens: 58.2, duration: 7.2, cost: 0.32, status: "regressed" },
    { id: "run_5e47", task: "Sync OpenAPI spec", model: "Sonnet", files: 2, tokens: 71.0, duration: 2.8, cost: 0.24, status: "passed" },
    { id: "run_7b3e", task: "Add rate limiter", model: "Sonnet", files: 3, tokens: 53.6, duration: 3.8, cost: 0.22, status: "passed" },
    { id: "run_9f4c", task: "Fix expired session", model: "Sonnet", files: 3, tokens: 41.2, duration: 2.4, cost: 0.18, status: "passed" },
  ];

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "passed", label: "Passed" },
    { key: "regressed", label: "Regressed" },
  ];

  const SORT_COLS = {
    tokens: { label: "Tokens", prop: "tokens" },
    duration: { label: "Duration", prop: "duration" },
    cost: { label: "Cost", prop: "cost" },
  };

  function median(vals) {
    if (!vals.length) return 0;
    const s = vals.slice().sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function fmtFiles(v) {
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }

  PlainPlayer.registerData({
    slug: "data-table",
    chapter: "tables",
    span: "full",
    title: "Evaluation ledger",
    css: `
.dd-data-table { display: grid; gap: 18px; width: 100%; min-width: 0 }
.dd-data-table .dt-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 10px 24px }
.dd-data-table .dt-titles { display: grid; gap: 3px; min-width: 0 }
.dd-data-table .dt-titles h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em; color: var(--ink) }
.dd-data-table .dt-sub { margin: 0; font-size: 13px; line-height: 1.4; color: var(--muted); font-variant-numeric: tabular-nums }
.dd-data-table .dt-filters { position: relative; display: inline-flex; flex-wrap: wrap; align-items: center; gap: 22px; padding: 2px 11px }
.dd-data-table .dt-filters .q { min-height: 28px; font-size: 13.5px }
.dd-data-table .dt-scroll { width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch }
.dd-data-table .dt-table { width: 100%; min-width: 660px; border: 0; border-collapse: separate; border-spacing: 0; font-variant-numeric: tabular-nums }
.dd-data-table .dt-table th,
.dd-data-table .dt-table td { padding: 10px 12px; text-align: left; vertical-align: baseline; white-space: nowrap; background: transparent }
.dd-data-table .dt-table th:first-child,
.dd-data-table .dt-table td:first-child { padding-left: 0 }
.dd-data-table .dt-table th:last-child,
.dd-data-table .dt-table td:last-child { padding-right: 0 }
.dd-data-table .dt-table .is-num { text-align: right }
.dd-data-table .dt-table .col-status { padding-left: 26px }
.dd-data-table .dt-table thead th { padding-top: 0; padding-bottom: 9px; border: 0; border-bottom: 1px solid var(--line-control);
  font-size: 12px; font-weight: 500; letter-spacing: 0.01em; color: var(--muted) }
.dd-data-table .dt-sort { display: inline-flex; align-items: baseline; justify-content: flex-end; gap: 4px; padding: 0; border: 0;
  background: none; font: 500 12px/1.3 var(--font); letter-spacing: 0.01em; color: var(--ink); opacity: 0.55; cursor: pointer;
  -webkit-tap-highlight-color: transparent; transition: opacity var(--dur-instant) var(--ease-out) }
.dd-data-table .dt-sort:hover { opacity: 0.9 }
.dd-data-table .dt-sort.is-active { opacity: 1 }
.dd-data-table .dt-sort:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px; opacity: 1 }
.dd-data-table .dt-arrow { display: none; font-size: 11.5px }
.dd-data-table .dt-sort.is-active .dt-arrow { display: inline-block }
.dd-data-table .dt-table tbody tr { background: transparent; transition: opacity var(--dur-pare) var(--ease-out) }
.dd-data-table .dt-table tbody:hover tr:not(:hover) { opacity: var(--sibling-dim) }
.dd-data-table .dt-table tbody td { border: 0; font-size: 14px; color: var(--ink) }
.dd-data-table .dt-table tbody tr.has-rule td { border-top: 1px solid var(--line) }
.dd-data-table .dt-run { font-family: var(--mono); font-size: 12.5px; color: var(--muted) }
.dd-data-table .dt-task { font-weight: 400; color: var(--ink) }
.dd-data-table .dt-model { font-size: 13.5px; color: var(--muted) }
.dd-data-table .dt-status-passed { color: var(--ink) }
.dd-data-table .dt-status-regressed { color: var(--danger); font-weight: 500 }
.dd-data-table .dt-table tfoot td { padding-top: 11px; padding-bottom: 2px; border: 0; border-top: 1px solid var(--line-strong);
  font-size: 13.5px; color: var(--ink) }
.dd-data-table .dt-sum-label { font-weight: 500; color: var(--ink) }
.dd-data-table .dt-sum-meta { font-size: 13px; color: var(--muted) }
.dd-data-table .dt-sum-num { font-weight: 500 }
@container (max-width: 480px) {
  .dd-data-table .dt-filters { gap: 18px; padding: 2px 10px }
}
`,
    mount(host, ctx) {
      let currentFilter = "all";
      let sortCol = "cost";
      let sortDir = "desc";

      host.innerHTML = `
<div class="dt-head">
  <div class="dt-titles">
    <h3>Evaluation ledger</h3>
    <p class="dt-sub"></p>
  </div>
  <div class="dt-filters" role="radiogroup" aria-label="Filter runs by status">
    ${FILTERS.map((f) => `<button class="q in-frame" type="button" role="radio" aria-checked="${f.key === "all" ? "true" : "false"}" tabindex="${f.key === "all" ? "0" : "-1"}" data-filter="${f.key}">${f.label}</button>`).join("")}
  </div>
</div>
<div class="dt-scroll">
  <table class="dt-table" aria-label="Evaluation ledger">
    <thead>
      <tr>
        <th scope="col">Run</th>
        <th scope="col">Task</th>
        <th scope="col">Model</th>
        <th scope="col" class="is-num">Files</th>
        <th scope="col" class="is-num" data-th="tokens" aria-sort="none">
          <button type="button" class="dt-sort" data-sort="tokens"><span>Tokens</span><span class="dt-arrow" aria-hidden="true"></span></button>
        </th>
        <th scope="col" class="is-num" data-th="duration" aria-sort="none">
          <button type="button" class="dt-sort" data-sort="duration"><span>Duration</span><span class="dt-arrow" aria-hidden="true"></span></button>
        </th>
        <th scope="col" class="is-num" data-th="cost" aria-sort="descending">
          <button type="button" class="dt-sort is-active" data-sort="cost"><span>Cost</span><span class="dt-arrow" aria-hidden="true">\u2193</span></button>
        </th>
        <th scope="col" class="col-status">Status</th>
      </tr>
    </thead>
    <tbody>
      ${RUNS.map((r) => `
      <tr data-id="${r.id}" data-status="${r.status}">
        <td class="dt-run">${r.id}</td>
        <td class="dt-task">${r.task}</td>
        <td class="dt-model">${r.model}</td>
        <td class="is-num">${r.files}</td>
        <td class="is-num">${r.tokens.toFixed(1)}k</td>
        <td class="is-num">${r.duration.toFixed(1)} s</td>
        <td class="is-num">$${r.cost.toFixed(2)}</td>
        <td class="col-status ${r.status === "regressed" ? "dt-status-regressed" : "dt-status-passed"}">${r.status === "regressed" ? "Regressed" : "Passed"}</td>
      </tr>`).join("")}
    </tbody>
    <tfoot>
      <tr>
        <td class="dt-sum-label">Summary</td>
        <td class="dt-sum-meta" data-sum="scope"></td>
        <td class="dt-sum-meta" data-sum="models"></td>
        <td class="is-num dt-sum-num" data-sum="files"></td>
        <td class="is-num dt-sum-num" data-sum="tokens"></td>
        <td class="is-num dt-sum-num" data-sum="duration"></td>
        <td class="is-num dt-sum-num" data-sum="cost"></td>
        <td class="col-status dt-sum-meta" data-sum="status"></td>
      </tr>
    </tfoot>
  </table>
</div>
<p class="sr-only" aria-live="polite"></p>`;

      const subEl = host.querySelector(".dt-sub");
      const filterWrap = host.querySelector(".dt-filters");
      const filterBtns = [...filterWrap.querySelectorAll("[data-filter]")];
      const sortBtns = [...host.querySelectorAll("[data-sort]")];
      const tbody = host.querySelector("tbody");
      const tfoot = host.querySelector("tfoot");
      const sr = host.querySelector("[aria-live]");
      const rowsById = new Map(RUNS.map((r) => [r.id, tbody.querySelector(`tr[data-id="${r.id}"]`)]));
      const sumEls = {
        scope: tfoot.querySelector('[data-sum="scope"]'),
        models: tfoot.querySelector('[data-sum="models"]'),
        files: tfoot.querySelector('[data-sum="files"]'),
        tokens: tfoot.querySelector('[data-sum="tokens"]'),
        duration: tfoot.querySelector('[data-sum="duration"]'),
        cost: tfoot.querySelector('[data-sum="cost"]'),
        status: tfoot.querySelector('[data-sum="status"]'),
      };

      const filterFrame = ctx.brackets(filterWrap, { padX: 9, padY: 2, exactPad: true });

      function getOrderedRuns() {
        const prop = SORT_COLS[sortCol].prop;
        const mult = sortDir === "asc" ? 1 : -1;
        return RUNS.slice().sort((a, b) => (a[prop] - b[prop]) * mult);
      }

      function getVisibleRuns(ordered) {
        return ordered.filter((r) => currentFilter === "all" || r.status === currentFilter);
      }

      function syncRulesAndSummary(visibleRuns, immediate) {
        let seenVisible = 0;
        for (const tr of [...tbody.children]) {
          if (tr.hidden) {
            tr.classList.remove("has-rule");
          } else {
            tr.classList.toggle("has-rule", seenVisible > 0);
            seenVisible++;
          }
        }

        const total = RUNS.length;
        const vis = visibleRuns.length;
        const regCount = visibleRuns.filter((r) => r.status === "regressed").length;
        const passCount = vis - regCount;
        const sortLabel = SORT_COLS[sortCol].label.toLowerCase() + " " + (sortDir === "asc" ? "\u2191" : "\u2193");

        let subText;
        if (currentFilter === "all") {
          subText = `${total} runs \u00b7 ${passCount} passed, ${regCount} regressed \u00b7 sorted by ${sortLabel}`;
        } else if (currentFilter === "passed") {
          subText = `${vis} of ${total} runs \u00b7 Passed only \u00b7 sorted by ${sortLabel}`;
        } else {
          subText = `${vis} of ${total} runs \u00b7 Regressed only \u00b7 sorted by ${sortLabel}`;
        }

        const opusCount = visibleRuns.filter((r) => r.model === "Opus").length;
        const sonnetCount = vis - opusCount;
        const modelParts = [];
        if (opusCount) modelParts.push(`${opusCount} Opus`);
        if (sonnetCount) modelParts.push(`${sonnetCount} Sonnet`);

        const scopeText = `Median \u00b7 ${vis} ${vis === 1 ? "run" : "runs"}`;
        const modelsText = modelParts.join(" \u00b7 ");
        const filesText = fmtFiles(median(visibleRuns.map((r) => r.files)));
        const tokensText = `${median(visibleRuns.map((r) => r.tokens)).toFixed(1)}k`;
        const durText = `${median(visibleRuns.map((r) => r.duration)).toFixed(1)} s`;
        const costText = `$${median(visibleRuns.map((r) => r.cost)).toFixed(2)}`;
        const statusText = regCount > 0 ? `${regCount} regressed` : "All passed";

        sumEls.status.className = "col-status " + (regCount > 0 ? "dt-status-regressed" : "dt-sum-meta");

        if (immediate) {
          subEl.textContent = subText;
        } else {
          ctx.swapText(subEl, subText);
        }
        sumEls.scope.textContent = scopeText;
        sumEls.models.textContent = modelsText;
        sumEls.files.textContent = filesText;
        sumEls.tokens.textContent = tokensText;
        sumEls.duration.textContent = durText;
        sumEls.cost.textContent = costText;
        sumEls.status.textContent = statusText;
      }

      function syncSortHeaders() {
        for (const btn of sortBtns) {
          const col = btn.dataset.sort;
          const on = col === sortCol;
          const th = btn.closest("th");
          const arrow = btn.querySelector(".dt-arrow");
          btn.classList.toggle("is-active", on);
          th.setAttribute("aria-sort", on ? (sortDir === "asc" ? "ascending" : "descending") : "none");
          arrow.textContent = on ? (sortDir === "asc" ? "\u2191" : "\u2193") : "";
        }
      }

      function applyTableState(opts) {
        const o = opts || {};
        const ordered = getOrderedRuns();
        const visible = getVisibleRuns(ordered);
        const visibleIds = new Set(visible.map((r) => r.id));
        const newlyShown = [];

        for (const r of ordered) {
          const tr = rowsById.get(r.id);
          if (tr.hidden && visibleIds.has(r.id) && !o.immediate) newlyShown.push(tr);
        }

        const footBefore = !o.immediate && !ctx.reduced() ? tfoot.getBoundingClientRect() : null;

        ctx.flip(tbody, () => {
          for (const r of ordered) {
            const tr = rowsById.get(r.id);
            tr.hidden = !visibleIds.has(r.id);
            tbody.appendChild(tr);
          }
          syncRulesAndSummary(visible, !!o.immediate);
        });

        if (footBefore && !ctx.reduced()) {
          const footAfter = tfoot.getBoundingClientRect();
          const dy = footBefore.top - footAfter.top;
          if (Math.abs(dy) > 0.5 && tfoot.animate) {
            tfoot.animate(
              [{ transform: `translateY(${dy.toFixed(1)}px)` }, { transform: "none" }],
              { duration: 210, easing: PlainPlayer.EASE_SETTLE }
            );
          }
          for (const tr of newlyShown) {
            if (tr.animate) {
              tr.animate(
                [{ opacity: 0, transform: "translateX(-4px)" }, { opacity: 1, transform: "none" }],
                { duration: 150, easing: PlainPlayer.EASE_OUT }
              );
            }
          }
        }
      }

      function setFilter(next, immediate, byUser) {
        if (currentFilter === next && !immediate) return;
        currentFilter = next;
        for (const b of filterBtns) {
          const on = b.dataset.filter === next;
          b.setAttribute("aria-checked", on ? "true" : "false");
          b.tabIndex = on ? 0 : -1;
          if (on) filterFrame.moveTo(b, { immediate });
        }
        applyTableState({ immediate });
        if (byUser) {
          const vis = getVisibleRuns(getOrderedRuns()).length;
          sr.textContent = `Showing ${vis} of ${RUNS.length} runs (${next}).`;
        }
      }

      function setSort(col, byUser) {
        if (sortCol === col) {
          sortDir = sortDir === "desc" ? "asc" : "desc";
        } else {
          sortCol = col;
          sortDir = "desc";
        }
        syncSortHeaders();
        applyTableState({ immediate: false });
        if (byUser) {
          sr.textContent = `Sorted by ${SORT_COLS[sortCol].label}, ${sortDir === "asc" ? "ascending" : "descending"}.`;
        }
      }

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

      for (const b of sortBtns) {
        b.addEventListener("click", () => setSort(b.dataset.sort, true), { signal: ctx.signal });
      }

      syncSortHeaders();
      setFilter("all", true, false);
    },
  });
})();
