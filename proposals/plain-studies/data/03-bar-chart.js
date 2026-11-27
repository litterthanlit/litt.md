/* Tufte Cut Bar Chart (Plain Data): single-quantity token breakdown across 6 agent turn stages in pure --ink,
   rising from a 1px --line-control baseline via scaleY, sliced by 1.5px --page white-paper scale cuts at 10k,
   20k, and 30k so zero gridlines clutter empty air. */
(function () {
  const STAGES = ["Read", "Search", "Plan", "Edit", "Test", "Review"];
  const MODES = [
    {
      key: "mean",
      label: "Mean",
      total: 84.2,
      sub: "total per turn",
      values: [14.6, 9.8, 28.4, 16.2, 10.4, 4.8],
    },
    {
      key: "p95",
      label: "p95",
      total: 129.0,
      sub: "p95 total per turn",
      values: [21.2, 15.4, 36.8, 26.5, 19.6, 9.5],
    },
  ];
  const MAX_SCALE = 38;
  const CUTS = [10, 20, 30];

  PlainPlayer.registerData({
    slug: "bar-chart",
    chapter: "charts",
    span: "half",
    title: "Tufte Cut Bar Chart",
    css: `
.dd-bar-chart .bc { display: grid; gap: 14px }
.dd-bar-chart .bc-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 14px }
.dd-bar-chart .bc-top h3 { margin: 0; font: 500 15px/1.3 var(--font); letter-spacing: -0.01em; color: var(--ink) }
.dd-bar-chart .bc-modes { position: relative; display: inline-flex; align-items: center; gap: 12px; padding: 2px 8px }
.dd-bar-chart .bc-modes .q { min-height: 28px; font-size: 13px }
.dd-bar-chart .bc-dot { font-size: 13px; color: var(--muted); opacity: var(--unselected); user-select: none; pointer-events: none }

.dd-bar-chart .bc-readout { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 14px; min-height: 28px }
.dd-bar-chart .bc-fig { font-size: 22px; font-weight: 500; line-height: 1.15; letter-spacing: -0.022em }
.dd-bar-chart .bc-sub { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums }

.dd-bar-chart .bc-chart { position: relative; display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 0 10px; padding-top: 6px }
.dd-bar-chart .bc-yaxis { position: relative; height: 170px; pointer-events: none; user-select: none }
.dd-bar-chart .bc-ytick { position: absolute; right: 0; transform: translateY(50%); font-size: 12px; line-height: 1;
  color: var(--muted); font-variant-numeric: tabular-nums }

.dd-bar-chart .bc-stage-area { position: relative; min-width: 0 }
/* Tufte white-paper scale cuts: 1.5px --page lines slice cleanly across ink bars while staying invisible over empty air. */
.dd-bar-chart .bc-cuts { position: absolute; left: 0; right: 0; top: 0; height: 170px; pointer-events: none; z-index: 2 }
.dd-bar-chart .bc-cut { position: absolute; left: 0; right: 0; height: 1.5px; background: var(--page); transform: translateY(50%) }
.dd-bar-chart .bc-baseline { position: absolute; left: 0; right: 0; top: 170px; height: 1px; background: var(--line-control); pointer-events: none; z-index: 3 }

.dd-bar-chart .bc-cols { position: relative; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px }
.dd-bar-chart .bc-col { position: relative; display: grid; grid-template-rows: 170px auto; justify-items: center; padding: 0; border: 0;
  background: none; cursor: pointer; -webkit-tap-highlight-color: transparent }
.dd-bar-chart .bc-col:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px }

.dd-bar-chart .bc-well { width: 100%; height: 170px; display: flex; align-items: flex-end; justify-content: center }
.dd-bar-chart .bc-bar { width: 100%; max-width: 46px; height: 100%; background: var(--ink);
  transform-origin: bottom; transform: scaleY(var(--sy, 0));
  transition: transform var(--dur-settle) var(--ease-settle), opacity var(--dur-pare) var(--ease-out);
  will-change: transform, opacity }

.dd-bar-chart .bc-lbl { margin-top: 10px; font-size: 12.5px; line-height: 1.2; color: var(--muted); white-space: nowrap;
  transition: color var(--dur-instant) var(--ease-out), opacity var(--dur-pare) var(--ease-out) }
.dd-bar-chart .bc-col[data-active] .bc-lbl { color: var(--ink); font-weight: 500 }

.dd-bar-chart .bc-cols[data-focusing] .bc-col:not([data-active]) .bc-bar,
.dd-bar-chart .bc-cols[data-focusing] .bc-col:not([data-active]) .bc-lbl { opacity: 0.20 }

@container (max-width: 360px) {
  .dd-bar-chart .bc-chart { grid-template-columns: 28px minmax(0, 1fr); gap: 0 6px }
  .dd-bar-chart .bc-cols { gap: 5px }
  .dd-bar-chart .bc-lbl { font-size: 11.5px }
}
`,
    mount(host, ctx) {
      let modeIdx = 0;
      let activeIdx = -1;
      let rovingIdx = 2;

      host.innerHTML = `
<div class="bc">
  <div class="bc-top">
    <h3>Tokens by turn stage</h3>
    <div class="bc-modes" role="radiogroup" aria-label="Token aggregation">
      ${MODES.map((m, i) => `${i > 0 ? '<span class="bc-dot" aria-hidden="true">\u00b7</span>' : ""}<button type="button" class="q in-frame" role="radio" data-idx="${i}" aria-checked="${i === 0 ? "true" : "false"}" tabindex="${i === 0 ? "0" : "-1"}">${m.label}</button>`).join("")}
    </div>
  </div>
  <div class="bc-readout">
    <span class="fig bc-fig">84.2k tok</span>
    <span class="bc-sub">total per turn</span>
  </div>
  <div class="bc-chart">
    <div class="bc-yaxis" aria-hidden="true">
      ${CUTS.map((k) => `<span class="bc-ytick" style="bottom:${((k / MAX_SCALE) * 100).toFixed(2)}%">${k}k</span>`).join("")}
    </div>
    <div class="bc-stage-area">
      <div class="bc-cuts" aria-hidden="true">
        ${CUTS.map((k) => `<i class="bc-cut" style="bottom:${((k / MAX_SCALE) * 100).toFixed(2)}%"></i>`).join("")}
      </div>
      <div class="bc-baseline" aria-hidden="true"></div>
      <div class="bc-cols" role="group" aria-label="Turn stages">
        ${STAGES.map((st, i) => `
        <button type="button" class="bc-col" data-idx="${i}" tabindex="${i === 2 ? "0" : "-1"}">
          <span class="bc-well" aria-hidden="true"><span class="bc-bar"></span></span>
          <span class="bc-lbl">${st}</span>
        </button>`).join("")}
      </div>
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const modesEl = host.querySelector(".bc-modes");
      const modeBtns = [...modesEl.querySelectorAll('[role="radio"]')];
      const figEl = host.querySelector(".bc-fig");
      const subEl = host.querySelector(".bc-sub");
      const colsWrap = host.querySelector(".bc-cols");
      const colBtns = [...colsWrap.querySelectorAll(".bc-col")];
      const barEls = colBtns.map((b) => b.querySelector(".bc-bar"));
      const lblEls = colBtns.map((b) => b.querySelector(".bc-lbl"));
      const sr = host.querySelector("[aria-live]");

      const modeFrame = ctx.brackets(modesEl, { padX: 7, padY: 2, exactPad: true });
      const stageFrame = ctx.brackets(colsWrap, { padX: 5, padY: 2, size: 5, exactPad: true });

      function syncReadout(animate) {
        const m = MODES[modeIdx];
        let figStr = `${m.total.toFixed(1)}k tok`;
        let subStr = m.sub;

        if (activeIdx >= 0) {
          const val = m.values[activeIdx];
          const pct = Math.round((val / m.total) * 100);
          figStr = `${STAGES[activeIdx]} \u00b7 ${val.toFixed(1)}k tok \u00b7 ${pct} %`;
          subStr = `of ${m.total.toFixed(1)}k ${m.label.toLowerCase()} turn`;
        }

        if (animate) {
          ctx.swapText(figEl, figStr);
          ctx.swapText(subEl, subStr);
        } else {
          figEl.textContent = figStr;
          subEl.textContent = subStr;
        }
      }

      function paintBars() {
        const m = MODES[modeIdx];
        colBtns.forEach((btn, i) => {
          const v = m.values[i];
          const pct = Math.round((v / m.total) * 100);
          barEls[i].style.setProperty("--sy", (v / MAX_SCALE).toFixed(4));
          btn.setAttribute("aria-label", `${STAGES[i]}: ${v.toFixed(1)}k tokens (${pct} % of ${m.label})`);
        });
      }

      function setMode(idx, immediate, byUser) {
        modeIdx = idx;
        modeBtns.forEach((btn, i) => {
          const on = i === idx;
          btn.setAttribute("aria-checked", on ? "true" : "false");
          btn.tabIndex = on ? 0 : -1;
          if (on) modeFrame.moveTo(btn, { immediate });
        });
        paintBars();
        syncReadout(!immediate);
        if (byUser) {
          const m = MODES[idx];
          sr.textContent = `${m.label}: ${m.total.toFixed(1)}k tokens per turn.`;
        }
      }

      function setActiveBar(idx, immediate) {
        activeIdx = idx;
        if (idx >= 0) {
          rovingIdx = idx;
          colsWrap.setAttribute("data-focusing", "");
          colBtns.forEach((btn, i) => {
            if (i === idx) btn.setAttribute("data-active", "");
            else btn.removeAttribute("data-active");
            btn.tabIndex = i === idx ? 0 : -1;
          });
          stageFrame.moveTo(lblEls[idx], { immediate });
        } else {
          colsWrap.removeAttribute("data-focusing");
          colBtns.forEach((btn, i) => {
            btn.removeAttribute("data-active");
            btn.tabIndex = i === rovingIdx ? 0 : -1;
          });
          stageFrame.pare();
        }
        syncReadout(false);
      }

      modeBtns.forEach((btn, i) => {
        btn.addEventListener("click", () => setMode(i, false, true), { signal: ctx.signal });
      });

      modesEl.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        const next = (modeIdx + 1) % MODES.length;
        modeBtns[next].focus({ preventScroll: true });
        setMode(next, false, true);
      }, { signal: ctx.signal });

      colBtns.forEach((btn, i) => {
        btn.addEventListener("pointerenter", (e) => {
          if (e.pointerType === "touch") return;
          setActiveBar(i, false);
        }, { signal: ctx.signal });
        btn.addEventListener("click", () => {
          if (activeIdx === i && !btn.matches(":focus-visible")) setActiveBar(-1, false);
          else setActiveBar(i, false);
        }, { signal: ctx.signal });
        btn.addEventListener("focus", () => {
          if (btn.matches(":focus-visible")) setActiveBar(i, false);
        }, { signal: ctx.signal });
      });

      colsWrap.addEventListener("pointerleave", () => {
        if (!colsWrap.contains(document.activeElement) || !document.activeElement.matches(":focus-visible")) {
          setActiveBar(-1, false);
        }
      }, { signal: ctx.signal });

      colsWrap.addEventListener("focusout", (e) => {
        if (!colsWrap.contains(e.relatedTarget)) setActiveBar(-1, false);
      }, { signal: ctx.signal });

      colsWrap.addEventListener("keydown", (e) => {
        let next = rovingIdx;
        if (e.key === "ArrowRight") next = (rovingIdx + 1) % STAGES.length;
        else if (e.key === "ArrowLeft") next = (rovingIdx + STAGES.length - 1) % STAGES.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = STAGES.length - 1;
        else if (e.key === "Escape") { setActiveBar(-1, false); return; }
        else return;
        e.preventDefault();
        colBtns[next].focus({ preventScroll: true });
        setActiveBar(next, false);
      }, { signal: ctx.signal });

      setMode(0, true, false);
    },
  });
})();
