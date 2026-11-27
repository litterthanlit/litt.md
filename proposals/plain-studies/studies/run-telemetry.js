/* Run Telemetry, redesigned in Plain (Subtraction): workspace agent metrics in a 2x2 hairline grid over Today, 7 days,
   and 30 days. Pointing at or focusing one metric frames that cell in four corner hairlines while the other three step
   back to 0.36 opacity; leaving returns all four to crisp rest. */
(function () {
  const PERIODS = [
    {
      key: "today",
      label: "Today",
      cells: [
        { label: "Runs merged", fig: "9", delta: "+2 vs prior" },
        { label: "Diffs kept", fig: "94 %", delta: "64 of 68" },
        { label: "Median turn", fig: "3.9 s", delta: "\u22120.5 s" },
        { label: "Agent spend", fig: "$1.26", delta: "$0.14 / run" },
      ],
    },
    {
      key: "7d",
      label: "7 days",
      cells: [
        { label: "Runs merged", fig: "48", delta: "+6 vs prior" },
        { label: "Diffs kept", fig: "91 %", delta: "312 of 342" },
        { label: "Median turn", fig: "4.2 s", delta: "\u22120.8 s" },
        { label: "Agent spend", fig: "$6.80", delta: "$0.14 / run" },
      ],
    },
    {
      key: "30d",
      label: "30 days",
      cells: [
        { label: "Runs merged", fig: "196", delta: "+28 vs prior" },
        { label: "Diffs kept", fig: "89 %", delta: "1,284 of 1,442" },
        { label: "Median turn", fig: "4.5 s", delta: "\u22121.1 s" },
        { label: "Agent spend", fig: "$29.40", delta: "$0.15 / run" },
      ],
    },
  ];

  PlainPlayer.register({
    slug: "run-telemetry",
    title: "Run Telemetry",
    tagline: "Point at one metric and the other three step back.",
    css: `
.ps-run-telemetry .rt { width: min(100%, 400px); display: grid; gap: 12px }
.ps-run-telemetry .rt-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 12px; padding-bottom: 8px; border-bottom: 1px solid var(--line) }
.ps-run-telemetry .rt-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-run-telemetry .rt-periods { position: relative; display: inline-flex; align-items: center; gap: 20px; padding: 2px 9px; margin-left: auto }
.ps-run-telemetry .rt-periods .q { min-height: 24px }
.ps-run-telemetry .rt-grid { position: relative; margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); background: transparent }
.ps-run-telemetry .rt-grid > .pm-frame:not(.is-shown) { display: none }
.ps-run-telemetry .rt-cell { padding: 12px 12px 12px 6px; display: grid; cursor: default; -webkit-tap-highlight-color: transparent }
.ps-run-telemetry .rt-cell:nth-child(odd) { border-right: 1px solid var(--line) }
.ps-run-telemetry .rt-cell:nth-child(even) { padding: 12px 6px 12px 14px }
.ps-run-telemetry .rt-cell:nth-child(-n+2) { border-bottom: 1px solid var(--line) }
.ps-run-telemetry .rt-body { display: grid; gap: 4px; min-width: 0 }
.ps-run-telemetry .rt-cell:focus-visible { outline: 2px solid var(--focus); outline-offset: -2px }
.ps-run-telemetry .rt-name { margin: 0; font-size: 13.5px; font-weight: 400; line-height: 1.3; color: var(--muted) }
.ps-run-telemetry .rt-cell dd { margin: 0; font-variant-numeric: tabular-nums }
.ps-run-telemetry .rt-delta { font-size: 13px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-run-telemetry.is-tile .rt { width: 100%; gap: 10px }
.ps-run-telemetry.is-tile .rt-cell { padding: 10px 10px 10px 6px }
.ps-run-telemetry.is-tile .rt-cell:nth-child(even) { padding: 10px 6px 10px 12px }
.ps-run-telemetry.is-tile .rt-body { gap: 3px }
@container (max-width: 280px) {
  .ps-run-telemetry .rt-cell, .ps-run-telemetry.is-tile .rt-cell { padding: 8px 8px 8px 6px }
  .ps-run-telemetry .rt-cell:nth-child(even), .ps-run-telemetry.is-tile .rt-cell:nth-child(even) { padding: 8px 6px 8px 10px }
  .ps-run-telemetry .rt-periods { gap: 18px }
}
`,
    mount(host, ctx) {
      let periodIdx = 1;
      let activeCell = -1;
      let rovingIdx = 0;

      host.innerHTML = `
<div class="rt">
  <div class="rt-head">
    <h3>Agent runs</h3>
    <div class="rt-periods" role="radiogroup" aria-label="Telemetry period">
      ${PERIODS.map((p, i) => `<button type="button" class="q in-frame" role="radio" data-idx="${i}" aria-checked="${i === 1 ? "true" : "false"}" tabindex="${i === 1 ? "0" : "-1"}">${p.label}</button>`).join("")}
    </div>
  </div>
  <dl class="rt-grid" data-focus-group>
    ${PERIODS[1].cells.map((c, i) => `
    <div class="rt-cell" data-cell="${i}" tabindex="${i === 0 ? "0" : "-1"}">
      <div class="rt-body">
        <dt class="rt-name">${c.label}</dt>
        <dd class="fig rt-fig">${c.fig}</dd>
        <dd class="rt-delta">${c.delta}</dd>
      </div>
    </div>`).join("")}
  </dl>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const periodsEl = host.querySelector(".rt-periods");
      const periodBtns = [...periodsEl.querySelectorAll('[role="radio"]')];
      const gridEl = host.querySelector(".rt-grid");
      const cellEls = [...gridEl.querySelectorAll(".rt-cell")];
      const bodyEls = cellEls.map((c) => c.querySelector(".rt-body"));
      const sr = host.querySelector("[aria-live]");

      const periodFrame = ctx.brackets(periodsEl, { padX: 9, padY: 2, exactPad: true });
      const gridFrame = ctx.brackets(gridEl, { padX: 6, padY: 4, exactPad: true });

      function setPeriod(idx, immediate, byUser) {
        periodIdx = idx;
        const p = PERIODS[idx];
        periodBtns.forEach((btn, i) => {
          const on = i === idx;
          btn.setAttribute("aria-checked", on ? "true" : "false");
          btn.tabIndex = on ? 0 : -1;
          if (on) periodFrame.moveTo(btn, { immediate });
        });
        cellEls.forEach((cell, i) => {
          const figEl = cell.querySelector(".rt-fig");
          const deltaEl = cell.querySelector(".rt-delta");
          if (immediate) {
            figEl.textContent = p.cells[i].fig;
            deltaEl.textContent = p.cells[i].delta;
          } else {
            ctx.swapText(figEl, p.cells[i].fig);
            ctx.swapText(deltaEl, p.cells[i].delta);
          }
        });
        if (byUser) {
          sr.textContent = `${p.label}: ${p.cells.map((c) => `${c.label} ${c.fig}`).join(", ")}.`;
        }
      }

      function focusCell(idx, immediate) {
        activeCell = idx;
        rovingIdx = idx;
        gridEl.setAttribute("data-focusing", "");
        cellEls.forEach((cell, i) => {
          if (i === idx) cell.setAttribute("data-active", "");
          else cell.removeAttribute("data-active");
          cell.tabIndex = i === idx ? 0 : -1;
        });
        gridFrame.moveTo(bodyEls[idx], { immediate });
      }

      function clearFocus() {
        activeCell = -1;
        gridEl.removeAttribute("data-focusing");
        cellEls.forEach((cell, i) => {
          cell.removeAttribute("data-active");
          cell.tabIndex = i === rovingIdx ? 0 : -1;
        });
        gridFrame.pare();
      }

      periodBtns.forEach((btn, i) => {
        btn.addEventListener("click", () => setPeriod(i, false, true), { signal: ctx.signal });
      });

      periodsEl.addEventListener("keydown", (e) => {
        let next = periodIdx;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (periodIdx + 1) % PERIODS.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (periodIdx + PERIODS.length - 1) % PERIODS.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = PERIODS.length - 1;
        else return;
        e.preventDefault();
        periodBtns[next].focus({ preventScroll: true });
        setPeriod(next, false, true);
      }, { signal: ctx.signal });

      cellEls.forEach((cell, i) => {
        cell.addEventListener("pointerenter", (e) => {
          if (e.pointerType === "touch") return;
          focusCell(i, false);
        }, { signal: ctx.signal });
        cell.addEventListener("click", () => {
          if (activeCell === i && !cell.matches(":focus-visible")) clearFocus();
          else focusCell(i, false);
        }, { signal: ctx.signal });
        cell.addEventListener("focus", () => {
          if (cell.matches(":focus-visible")) focusCell(i, false);
        }, { signal: ctx.signal });
      });

      gridEl.addEventListener("pointerleave", () => {
        if (!gridEl.contains(document.activeElement) || !document.activeElement.matches(":focus-visible")) {
          clearFocus();
        }
      }, { signal: ctx.signal });

      gridEl.addEventListener("focusout", (e) => {
        if (!gridEl.contains(e.relatedTarget)) clearFocus();
      }, { signal: ctx.signal });

      gridEl.addEventListener("keydown", (e) => {
        let next = rovingIdx;
        if (e.key === "ArrowRight") next = (rovingIdx + 1) % 4;
        else if (e.key === "ArrowLeft") next = (rovingIdx + 3) % 4;
        else if (e.key === "ArrowDown") next = (rovingIdx + 2) % 4;
        else if (e.key === "ArrowUp") next = (rovingIdx + 2) % 4;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = 3;
        else if (e.key === "Escape") { clearFocus(); return; }
        else return;
        e.preventDefault();
        cellEls[next].focus({ preventScroll: true });
        focusCell(next, false);
      }, { signal: ctx.signal });

      ctx.onHand(() => {
        if (activeCell >= 0 && !gridEl.matches(":hover") && !gridEl.contains(document.activeElement)) {
          clearFocus();
        }
      });

      setPeriod(1, true, false);

      function cycle() {
        ctx.demoAfter(1800, () => {
          focusCell(0, false);
          ctx.demoAfter(1750, () => {
            focusCell(2, false);
            ctx.demoAfter(1750, () => {
              clearFocus();
              ctx.demoAfter(1500, () => {
                setPeriod(2, false, false);
                ctx.demoAfter(2200, () => {
                  setPeriod(1, false, false);
                  cycle();
                });
              });
            });
          });
        });
      }
      cycle();
    },
  });
})();
