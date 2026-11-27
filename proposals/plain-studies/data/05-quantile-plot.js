/* Latency Distribution / Quantile Plot (Plain Data): Tufte boxless quartile-range plot across 5 agent tools on a
   shared 0 ms .. 1,200 ms scale. Each row draws a 1px --line-control min-p99 whisker, 7px solid --ink p25-p75
   interquartile block, and a 2px --page vertical median cut at p50, stepping sibling rows back to 0.24 opacity. */
(function () {
  const MAX_MS = 1200;
  const TICKS = [0, 400, 800, 1200];
  const TOOLS = [
    { name: "Read file", min: 8, p25: 22, p50: 42, p75: 84, p95: 130, p99: 180 },
    { name: "Ripgrep", min: 18, p25: 58, p50: 94, p75: 162, p95: 250, p99: 340 },
    { name: "AST parse", min: 35, p25: 110, p50: 175, p75: 280, p95: 420, p99: 540 },
    { name: "Typecheck", min: 140, p25: 290, p50: 410, p75: 590, p95: 790, p99: 940 },
    { name: "Vitest", min: 220, p25: 440, p50: 620, p75: 830, p95: 1040, p99: 1160 },
  ];

  const fmtMs = (n) => n.toLocaleString("en-US") + " ms";
  const pct = (n) => ((n / MAX_MS) * 100).toFixed(2) + "%";

  PlainPlayer.registerData({
    slug: "quantile-plot",
    chapter: "charts",
    span: "half",
    title: "Latency Distribution",
    css: `
.dd-quantile-plot .qp { display: grid; gap: 14px }
.dd-quantile-plot .qp-top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 14px }
.dd-quantile-plot .qp-top h3 { margin: 0; font: 500 15px/1.3 var(--font); letter-spacing: -0.01em; color: var(--ink) }
.dd-quantile-plot .qp-key { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--muted) }
.dd-quantile-plot .qp-key-glyph { position: relative; display: inline-block; width: 24px; height: 7px; flex: none }
.dd-quantile-plot .qp-key-glyph::before { content: ""; position: absolute; left: 0; right: 0; top: 3px; height: 1px; background: var(--line-control) }
.dd-quantile-plot .qp-key-iqr { position: absolute; left: 5px; right: 5px; top: 0; height: 7px; background: var(--ink) }
.dd-quantile-plot .qp-key-cut { position: absolute; left: 11px; top: -1px; width: 2px; height: 9px; background: var(--page) }

.dd-quantile-plot .qp-readout { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 14px; min-height: 28px }
.dd-quantile-plot .qp-fig { font-size: 22px; font-weight: 500; line-height: 1.15; letter-spacing: -0.022em }
.dd-quantile-plot .qp-sub { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums }

.dd-quantile-plot .qp-list { position: relative; display: grid; border-bottom: 1px solid var(--line) }
.dd-quantile-plot .qp-row { display: grid; grid-template-columns: 84px minmax(0, 1fr) 134px; align-items: center;
  gap: 14px; width: 100%; padding: 10px 0; border: 0; border-top: 1px solid var(--line); background: none;
  text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: opacity var(--dur-pare) var(--ease-out) }
.dd-quantile-plot .qp-row:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }
.dd-quantile-plot .qp-list[data-focusing] .qp-row:not([data-active]) { opacity: 0.24 }

.dd-quantile-plot .qp-name { display: inline-block; justify-self: start; font-size: 14px; font-weight: 400; color: var(--ink); white-space: nowrap }
.dd-quantile-plot .qp-row[data-active] .qp-name { font-weight: 500 }

.dd-quantile-plot .qp-track { position: relative; width: 100%; height: 15px }
.dd-quantile-plot .qp-whisker { position: absolute; top: 7px; height: 1px; background: var(--line-control) }
.dd-quantile-plot .qp-p95 { position: absolute; top: 5px; width: 1px; height: 5px; background: var(--line-control); transform: translateX(-0.5px) }
.dd-quantile-plot .qp-p99 { position: absolute; top: 4px; width: 1px; height: 7px; background: var(--line-control); transform: translateX(-0.5px) }
.dd-quantile-plot .qp-iqr { position: absolute; top: 4px; height: 7px; min-width: 7px; background: var(--ink) }
/* Crisp 2px white-paper median cut slicing cleanly through the 7px interquartile block at p50. */
.dd-quantile-plot .qp-p50 { position: absolute; top: 3px; width: 2px; height: 9px; background: var(--page); transform: translateX(-1px) }

.dd-quantile-plot .qp-stats { font-family: var(--mono); font-size: 12.5px; font-variant-numeric: tabular-nums;
  text-align: right; white-space: nowrap; color: var(--ink) }
.dd-quantile-plot .qp-stats span { color: var(--muted) }

.dd-quantile-plot .qp-axis-row { display: grid; grid-template-columns: 84px minmax(0, 1fr) 134px; gap: 14px; padding-top: 2px }
.dd-quantile-plot .qp-axis { position: relative; height: 16px }
.dd-quantile-plot .qp-tick { position: absolute; top: 0; font-size: 12px; line-height: 1; color: var(--muted);
  font-variant-numeric: tabular-nums; transform: translateX(-50%); white-space: nowrap; user-select: none }
.dd-quantile-plot .qp-tick:first-child { transform: none }
.dd-quantile-plot .qp-tick.is-end { right: 0; transform: none }

@container (max-width: 440px) {
  .dd-quantile-plot .qp-row { grid-template-columns: minmax(0, 1fr) auto; gap: 6px 12px }
  .dd-quantile-plot .qp-track { grid-column: 1 / -1; order: 3 }
  .dd-quantile-plot .qp-axis-row { grid-template-columns: minmax(0, 1fr) }
  .dd-quantile-plot .qp-axis-spacer { display: none }
}
`,
    mount(host, ctx) {
      let activeIdx = -1;
      let rovingIdx = 0;

      host.innerHTML = `
<div class="qp">
  <div class="qp-top">
    <h3>Tool call latency</h3>
    <span class="qp-key" aria-hidden="true">
      <i class="qp-key-glyph"><i class="qp-key-iqr"></i><i class="qp-key-cut"></i></i>
      <span>min\u2013p99 \u00b7 p50 cut</span>
    </span>
  </div>
  <div class="qp-readout">
    <span class="fig qp-fig">42 \u2013 620 ms</span>
    <span class="qp-sub">p50 median \u00b7 p99 tail on right</span>
  </div>
  <div class="qp-list" role="group" aria-label="Tool call latency distributions">
    ${TOOLS.map((t, i) => {
      const wLeft = (t.min / MAX_MS) * 100;
      const wWidth = ((t.p99 - t.min) / MAX_MS) * 100;
      const iLeft = (t.p25 / MAX_MS) * 100;
      const iWidth = ((t.p75 - t.p25) / MAX_MS) * 100;
      return `
      <button type="button" class="qp-row" data-idx="${i}" tabindex="${i === 0 ? "0" : "-1"}"
        aria-label="${t.name}: min ${fmtMs(t.min)}, p50 ${fmtMs(t.p50)}, p95 ${fmtMs(t.p95)}, p99 ${fmtMs(t.p99)}">
        <span class="qp-name">${t.name}</span>
        <span class="qp-track" aria-hidden="true">
          <i class="qp-whisker" style="left:${wLeft.toFixed(2)}%;width:${wWidth.toFixed(2)}%"></i>
          <i class="qp-p95" style="left:${pct(t.p95)}"></i>
          <i class="qp-p99" style="left:${pct(t.p99)}"></i>
          <i class="qp-iqr" style="left:${iLeft.toFixed(2)}%;width:${iWidth.toFixed(2)}%"></i>
          <i class="qp-p50" style="left:${pct(t.p50)}"></i>
        </span>
        <span class="qp-stats">${fmtMs(t.p50)} <span>/ ${fmtMs(t.p99)}</span></span>
      </button>`;
    }).join("")}
  </div>
  <div class="qp-axis-row" aria-hidden="true">
    <span class="qp-axis-spacer"></span>
    <div class="qp-axis">
      ${TICKS.map((v, i) => i === TICKS.length - 1 ? `<span class="qp-tick is-end">${fmtMs(v)}</span>` : `<span class="qp-tick" style="left:${pct(v)}">${fmtMs(v)}</span>`).join("")}
    </div>
    <span class="qp-axis-spacer"></span>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const figEl = host.querySelector(".qp-fig");
      const subEl = host.querySelector(".qp-sub");
      const listEl = host.querySelector(".qp-list");
      const rowEls = [...listEl.querySelectorAll(".qp-row")];
      const nameEls = rowEls.map((r) => r.querySelector(".qp-name"));
      const sr = host.querySelector("[aria-live]");

      const rowFrame = ctx.brackets(listEl, { padX: 6, padY: 2, size: 5, exactPad: true });

      function setActive(idx, byKeyboard) {
        activeIdx = idx;
        if (idx >= 0) {
          rovingIdx = idx;
          listEl.setAttribute("data-focusing", "");
          rowEls.forEach((r, i) => {
            if (i === idx) r.setAttribute("data-active", "");
            else r.removeAttribute("data-active");
            r.tabIndex = i === idx ? 0 : -1;
          });
          rowFrame.moveTo(nameEls[idx], { immediate: false });
          const t = TOOLS[idx];
          figEl.textContent = `${t.name} \u00b7 ${fmtMs(t.p50)}`;
          subEl.textContent = `min ${fmtMs(t.min)} \u00b7 p50 ${fmtMs(t.p50)} \u00b7 p95 ${fmtMs(t.p95)} \u00b7 p99 ${fmtMs(t.p99)}`;
          if (byKeyboard) {
            sr.textContent = `${t.name}: min ${fmtMs(t.min)}, p50 ${fmtMs(t.p50)}, p95 ${fmtMs(t.p95)}, p99 ${fmtMs(t.p99)}.`;
          }
        } else {
          listEl.removeAttribute("data-focusing");
          rowEls.forEach((r, i) => {
            r.removeAttribute("data-active");
            r.tabIndex = i === rovingIdx ? 0 : -1;
          });
          rowFrame.pare();
          figEl.textContent = "42 \u2013 620 ms";
          subEl.textContent = "p50 median \u00b7 p99 tail on right";
        }
      }

      rowEls.forEach((row, i) => {
        row.addEventListener("pointerenter", (e) => {
          if (e.pointerType === "touch") return;
          setActive(i, false);
        }, { signal: ctx.signal });
        row.addEventListener("click", () => {
          if (activeIdx === i && !row.matches(":focus-visible")) setActive(-1, false);
          else setActive(i, true);
        }, { signal: ctx.signal });
        row.addEventListener("focus", () => {
          if (row.matches(":focus-visible")) setActive(i, false);
        }, { signal: ctx.signal });
      });

      listEl.addEventListener("pointerleave", () => {
        if (!listEl.contains(document.activeElement) || !document.activeElement.matches(":focus-visible")) {
          setActive(-1, false);
        }
      }, { signal: ctx.signal });

      listEl.addEventListener("focusout", (e) => {
        if (!listEl.contains(e.relatedTarget)) setActive(-1, false);
      }, { signal: ctx.signal });

      listEl.addEventListener("keydown", (e) => {
        let next = rovingIdx;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (rovingIdx + 1) % TOOLS.length;
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (rovingIdx + TOOLS.length - 1) % TOOLS.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = TOOLS.length - 1;
        else if (e.key === "Escape") { setActive(-1, false); return; }
        else return;
        e.preventDefault();
        rowEls[next].focus({ preventScroll: true });
        setActive(next, true);
      }, { signal: ctx.signal });
    },
  });
})();
