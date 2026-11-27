/* Standing Figures & Sparklines (Plain Data): open 4-column workspace telemetry strip with zero outer box,
   gliding period brackets (24h · 7d · 30d), 1px dashed mean baselines, 1.5px ink polylines, 4.5x4.5 square
   point markers, and direct in-place scrub readouts while sibling cells step back to 0.25 opacity. */
(function () {
  const PERIODS = [
    {
      key: "24h",
      label: "24h",
      times: ["02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "Now"],
      metrics: [
        {
          name: "Throughput",
          fig: "1,840 tok/s",
          delta: "+12 %",
          fmt: (v) => Math.round(v).toLocaleString("en-US") + " tok/s",
          values: [1490, 1520, 1580, 1660, 1740, 1790, 1710, 1810, 1860, 1780, 1820, 1840],
        },
        {
          name: "Pass rate",
          fig: "94.2 %",
          delta: "+1.8 pts",
          fmt: (v) => v.toFixed(1) + " %",
          values: [91.6, 92.0, 91.8, 92.5, 93.1, 92.9, 93.4, 93.8, 93.5, 94.0, 93.9, 94.2],
        },
        {
          name: "Median turn",
          fig: "1.38 s",
          delta: "\u22120.24 s",
          fmt: (v) => v.toFixed(2) + " s",
          values: [1.72, 1.68, 1.64, 1.59, 1.55, 1.51, 1.54, 1.48, 1.44, 1.42, 1.40, 1.38],
        },
        {
          name: "Daily spend",
          fig: "$14.20",
          delta: "$0.11 / run",
          fmt: (v) => "$" + v.toFixed(2),
          values: [10.8, 11.2, 11.9, 12.6, 13.4, 14.1, 13.6, 14.5, 14.9, 13.8, 14.0, 14.2],
        },
      ],
    },
    {
      key: "7d",
      label: "7d",
      times: ["Tue AM", "Tue PM", "Wed AM", "Wed PM", "Thu AM", "Thu PM", "Fri AM", "Fri PM", "Sat", "Sun", "Mon AM", "Mon PM"],
      metrics: [
        {
          name: "Throughput",
          fig: "1,760 tok/s",
          delta: "+9 %",
          fmt: (v) => Math.round(v).toLocaleString("en-US") + " tok/s",
          values: [1540, 1590, 1630, 1680, 1720, 1750, 1790, 1820, 1640, 1610, 1730, 1760],
        },
        {
          name: "Pass rate",
          fig: "93.6 %",
          delta: "+2.4 pts",
          fmt: (v) => v.toFixed(1) + " %",
          values: [90.8, 91.2, 91.5, 92.1, 92.4, 92.8, 93.0, 93.3, 93.1, 93.2, 93.4, 93.6],
        },
        {
          name: "Median turn",
          fig: "1.46 s",
          delta: "\u22120.31 s",
          fmt: (v) => v.toFixed(2) + " s",
          values: [1.82, 1.79, 1.74, 1.69, 1.65, 1.60, 1.58, 1.54, 1.52, 1.50, 1.48, 1.46],
        },
        {
          name: "Daily spend",
          fig: "$13.60",
          delta: "$0.11 / run",
          fmt: (v) => "$" + v.toFixed(2),
          values: [12.4, 14.8, 15.6, 16.2, 15.1, 14.9, 14.4, 13.8, 7.2, 6.4, 13.1, 13.6],
        },
      ],
    },
    {
      key: "30d",
      label: "30d",
      times: ["d\u221228", "d\u221225", "d\u221222", "d\u221220", "d\u221217", "d\u221214", "d\u221212", "d\u22129", "d\u22126", "d\u22124", "d\u22122", "Today"],
      metrics: [
        {
          name: "Throughput",
          fig: "1,690 tok/s",
          delta: "+18 %",
          fmt: (v) => Math.round(v).toLocaleString("en-US") + " tok/s",
          values: [1380, 1410, 1450, 1490, 1510, 1560, 1590, 1620, 1640, 1660, 1675, 1690],
        },
        {
          name: "Pass rate",
          fig: "92.8 %",
          delta: "+4.1 pts",
          fmt: (v) => v.toFixed(1) + " %",
          values: [88.4, 88.9, 89.5, 90.1, 90.4, 91.0, 91.3, 91.8, 92.1, 92.4, 92.6, 92.8],
        },
        {
          name: "Median turn",
          fig: "1.54 s",
          delta: "\u22120.42 s",
          fmt: (v) => v.toFixed(2) + " s",
          values: [1.98, 1.93, 1.88, 1.84, 1.79, 1.74, 1.70, 1.66, 1.62, 1.59, 1.56, 1.54],
        },
        {
          name: "Daily spend",
          fig: "$12.90",
          delta: "$0.12 / run",
          fmt: (v) => "$" + v.toFixed(2),
          values: [9.8, 10.4, 10.9, 11.5, 11.8, 12.2, 12.0, 12.6, 12.5, 12.7, 12.8, 12.9],
        },
      ],
    },
  ];

  PlainPlayer.registerData({
    slug: "stat-strip",
    chapter: "charts",
    span: "full",
    title: "Standing Figures & Sparklines",
    css: `
.dd-stat-strip .ss { display: grid; gap: 18px }
.dd-stat-strip .ss-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px;
  padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.dd-stat-strip .ss-head h3 { margin: 0; font: 500 15px/1.3 var(--font); letter-spacing: -0.01em; color: var(--ink) }
.dd-stat-strip .ss-periods { position: relative; display: inline-flex; align-items: center; gap: 12px; padding: 2px 8px }
.dd-stat-strip .ss-periods .q { min-height: 28px; font-size: 13px }
.dd-stat-strip .ss-dot { font-size: 13px; color: var(--muted); opacity: var(--unselected); user-select: none; pointer-events: none }

/* Open 4-column hairline strip: ONLY interior 1px dividers, zero outer box. */
.dd-stat-strip .ss-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0 }
.dd-stat-strip .ss-cell { min-width: 0; display: grid; align-content: start; gap: 6px; padding: 2px 24px 2px 0;
  cursor: crosshair; -webkit-tap-highlight-color: transparent }
.dd-stat-strip .ss-cell + .ss-cell { border-left: 1px solid var(--line); padding-left: 24px }
.dd-stat-strip .ss-cell:last-child { padding-right: 0 }
.dd-stat-strip .ss-cell:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px }

.dd-stat-strip .ss-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0 }
.dd-stat-strip .ss-name { font-size: 13.5px; font-weight: 400; color: var(--muted); white-space: nowrap;
  transition: color var(--dur-instant) var(--ease-out) }
.dd-stat-strip .ss-cell[data-active] .ss-name { color: var(--ink); font-weight: 500 }
.dd-stat-strip .ss-delta { font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap }
.dd-stat-strip .ss-fig { font-size: var(--t-fig); font-weight: 500; line-height: 1.12; letter-spacing: -0.025em;
  color: var(--ink); font-variant-numeric: tabular-nums; white-space: nowrap }
.dd-stat-strip .ss-spark { position: relative; width: 100%; height: 36px; margin-top: 6px }
.dd-stat-strip .ss-spark svg { display: block; width: 100%; height: 36px; overflow: visible }

/* Tablet: 2x2 interior hairline cross, zero outer box */
@container (max-width: 860px) {
  .dd-stat-strip .ss-strip { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  .dd-stat-strip .ss-cell:nth-child(1) { padding: 0 20px 18px 0; border-left: 0 }
  .dd-stat-strip .ss-cell:nth-child(2) { padding: 0 0 18px 20px; border-left: 1px solid var(--line) }
  .dd-stat-strip .ss-cell:nth-child(3) { padding: 18px 20px 0 0; border-left: 0; border-top: 1px solid var(--line) }
  .dd-stat-strip .ss-cell:nth-child(4) { padding: 18px 0 0 20px; border-left: 1px solid var(--line); border-top: 1px solid var(--line) }
}

/* Mobile: 1-column stack parted by interior horizontal hairlines, zero outer box */
@container (max-width: 480px) {
  .dd-stat-strip .ss-strip { grid-template-columns: minmax(0, 1fr) }
  .dd-stat-strip .ss-cell:nth-child(n) { padding: 16px 0; border-left: 0; border-top: 1px solid var(--line) }
  .dd-stat-strip .ss-cell:first-child { padding-top: 0; border-top: 0 }
  .dd-stat-strip .ss-cell:last-child { padding-bottom: 0 }
}
`,
    mount(host, ctx) {
      let periodIdx = 0;
      let activeCell = -1;
      let rovingCell = 0;
      const scrubIdx = [-1, -1, -1, -1];
      const widths = [240, 240, 240, 240];

      host.innerHTML = `
<div class="ss">
  <div class="ss-head">
    <h3>Workspace overview</h3>
    <div class="ss-periods" role="radiogroup" aria-label="Overview period">
      ${PERIODS.map((p, i) => `${i > 0 ? '<span class="ss-dot" aria-hidden="true">\u00b7</span>' : ""}<button type="button" class="q in-frame" role="radio" data-idx="${i}" aria-checked="${i === 0 ? "true" : "false"}" tabindex="${i === 0 ? "0" : "-1"}">${p.label}</button>`).join("")}
    </div>
  </div>
  <div class="ss-strip" data-focus-group role="region" aria-label="Key workspace metrics">
    ${PERIODS[0].metrics.map((m, i) => `
    <div class="ss-cell" data-cell="${i}" tabindex="${i === 0 ? "0" : "-1"}" role="group" aria-label="${m.name}">
      <div class="ss-top">
        <span class="ss-name">${m.name}</span>
        <span class="ss-delta">${m.delta}</span>
      </div>
      <div class="fig ss-fig">${m.fig}</div>
      <div class="ss-spark" aria-hidden="true">
        <svg viewBox="0 0 240 36">
          <line class="ss-mean" x1="0" x2="240" y1="18" y2="18" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="3 3" shape-rendering="crispEdges"></line>
          <line class="ss-cursor" x1="0" x2="0" y1="0" y2="36" stroke="var(--line-control)" stroke-width="1" shape-rendering="crispEdges" opacity="0"></line>
          <polyline class="ss-line" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="miter" stroke-linecap="butt"></polyline>
          <rect class="ss-pt" width="4.5" height="4.5" fill="var(--ink)"></rect>
        </svg>
      </div>
    </div>`).join("")}
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const periodsEl = host.querySelector(".ss-periods");
      const periodBtns = [...periodsEl.querySelectorAll('[role="radio"]')];
      const stripEl = host.querySelector(".ss-strip");
      const cellEls = [...stripEl.querySelectorAll(".ss-cell")];
      const sr = host.querySelector("[aria-live]");
      const periodFrame = ctx.brackets(periodsEl, { padX: 7, padY: 2, exactPad: true });

      const refs = cellEls.map((cell) => ({
        cell,
        fig: cell.querySelector(".ss-fig"),
        delta: cell.querySelector(".ss-delta"),
        spark: cell.querySelector(".ss-spark"),
        svg: cell.querySelector("svg"),
        mean: cell.querySelector(".ss-mean"),
        cursor: cell.querySelector(".ss-cursor"),
        line: cell.querySelector(".ss-line"),
        pt: cell.querySelector(".ss-pt"),
      }));

      function geomFor(cellIdx) {
        const p = PERIODS[periodIdx];
        const m = p.metrics[cellIdx];
        const vals = m.values;
        const w = Math.max(120, widths[cellIdx] || 240);
        const h = 36;
        const padX = 3;
        const padY = 5.5;
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const span = max - min || 1;
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const xAt = (k) => padX + (k / (vals.length - 1)) * (w - padX * 2);
        const yAt = (v) => h - padY - ((v - min) / span) * (h - padY * 2);
        return { p, m, vals, w, h, xAt, yAt, yMean: yAt(avg) };
      }

      function paintSpark(cellIdx) {
        const r = refs[cellIdx];
        const g = geomFor(cellIdx);
        r.svg.setAttribute("viewBox", `0 0 ${g.w} ${g.h}`);
        r.mean.setAttribute("x1", "0");
        r.mean.setAttribute("x2", String(g.w));
        r.mean.setAttribute("y1", g.yMean.toFixed(1));
        r.mean.setAttribute("y2", g.yMean.toFixed(1));

        const pts = g.vals.map((v, k) => `${g.xAt(k).toFixed(1)},${g.yAt(v).toFixed(1)}`).join(" ");
        r.line.setAttribute("points", pts);

        const k = scrubIdx[cellIdx] >= 0 ? scrubIdx[cellIdx] : g.vals.length - 1;
        const px = g.xAt(k);
        const py = g.yAt(g.vals[k]);
        r.pt.setAttribute("x", (px - 2.25).toFixed(2));
        r.pt.setAttribute("y", (py - 2.25).toFixed(2));

        if (scrubIdx[cellIdx] >= 0) {
          r.cursor.setAttribute("x1", px.toFixed(1));
          r.cursor.setAttribute("x2", px.toFixed(1));
          r.cursor.setAttribute("opacity", "1");
          r.fig.textContent = g.m.fmt(g.vals[k]);
          r.delta.textContent = g.p.times[k];
        } else {
          r.cursor.setAttribute("opacity", "0");
        }
      }

      function setFocusCell(idx) {
        activeCell = idx;
        if (idx >= 0) {
          rovingCell = idx;
          stripEl.setAttribute("data-focusing", "");
          cellEls.forEach((c, i) => {
            if (i === idx) c.setAttribute("data-active", "");
            else c.removeAttribute("data-active");
            c.tabIndex = i === idx ? 0 : -1;
          });
        } else {
          stripEl.removeAttribute("data-focusing");
          cellEls.forEach((c, i) => {
            c.removeAttribute("data-active");
            c.tabIndex = i === rovingCell ? 0 : -1;
          });
        }
      }

      function resetScrub(idx) {
        if (scrubIdx[idx] === -1) return;
        scrubIdx[idx] = -1;
        const m = PERIODS[periodIdx].metrics[idx];
        refs[idx].fig.textContent = m.fig;
        refs[idx].delta.textContent = m.delta;
        paintSpark(idx);
      }

      function setPeriod(idx, immediate, byUser) {
        periodIdx = idx;
        const p = PERIODS[idx];
        periodBtns.forEach((btn, i) => {
          const on = i === idx;
          btn.setAttribute("aria-checked", on ? "true" : "false");
          btn.tabIndex = on ? 0 : -1;
          if (on) periodFrame.moveTo(btn, { immediate });
        });
        for (let i = 0; i < 4; i++) {
          scrubIdx[i] = -1;
          const m = p.metrics[i];
          if (immediate) {
            refs[i].fig.textContent = m.fig;
            refs[i].delta.textContent = m.delta;
          } else {
            ctx.swapText(refs[i].fig, m.fig);
            ctx.swapText(refs[i].delta, m.delta);
          }
          paintSpark(i);
        }
        if (byUser) {
          sr.textContent = `${p.label}: ${p.metrics.map((m) => `${m.name} ${m.fig}`).join(", ")}.`;
        }
      }

      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver((entries) => {
          for (const e of entries) {
            const idx = refs.findIndex((r) => r.spark === e.target);
            if (idx >= 0 && e.contentRect.width > 0) {
              widths[idx] = Math.round(e.contentRect.width);
              paintSpark(idx);
            }
          }
        });
        refs.forEach((r) => ro.observe(r.spark));
        ctx.signal.addEventListener("abort", () => ro.disconnect(), { once: true });
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

      refs.forEach((r, i) => {
        const onScrubPointer = (e) => {
          const rect = r.spark.getBoundingClientRect();
          if (!rect.width) return;
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const len = PERIODS[periodIdx].metrics[i].values.length;
          const k = Math.round(ratio * (len - 1));
          if (activeCell !== i) {
            for (let j = 0; j < 4; j++) if (j !== i) resetScrub(j);
            setFocusCell(i);
          }
          if (scrubIdx[i] !== k) {
            scrubIdx[i] = k;
            paintSpark(i);
          }
        };

        r.cell.addEventListener("pointerenter", (e) => {
          if (e.pointerType === "touch") return;
          onScrubPointer(e);
        }, { signal: ctx.signal });

        r.cell.addEventListener("pointermove", (e) => {
          if (e.pointerType === "touch") return;
          onScrubPointer(e);
        }, { signal: ctx.signal });

        r.cell.addEventListener("pointerdown", (e) => {
          if (e.pointerType === "touch") onScrubPointer(e);
        }, { signal: ctx.signal });

        r.cell.addEventListener("pointerleave", () => {
          resetScrub(i);
        }, { signal: ctx.signal });

        r.cell.addEventListener("focus", () => {
          if (r.cell.matches(":focus-visible")) setFocusCell(i);
        }, { signal: ctx.signal });
      });

      stripEl.addEventListener("pointerleave", () => {
        for (let i = 0; i < 4; i++) resetScrub(i);
        if (!stripEl.contains(document.activeElement) || !document.activeElement.matches(":focus-visible")) {
          setFocusCell(-1);
        }
      }, { signal: ctx.signal });

      stripEl.addEventListener("focusout", (e) => {
        if (!stripEl.contains(e.relatedTarget)) {
          for (let i = 0; i < 4; i++) resetScrub(i);
          setFocusCell(-1);
        }
      }, { signal: ctx.signal });

      stripEl.addEventListener("keydown", (e) => {
        const len = PERIODS[periodIdx].metrics[rovingCell].values.length;
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          resetScrub(rovingCell);
          const next = e.key === "ArrowRight" ? (rovingCell + 1) % 4 : (rovingCell + 3) % 4;
          cellEls[next].focus({ preventScroll: true });
          setFocusCell(next);
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          setFocusCell(rovingCell);
          const cur = scrubIdx[rovingCell] >= 0 ? scrubIdx[rovingCell] : len - 1;
          const nextK = e.key === "ArrowUp" ? Math.min(len - 1, cur + 1) : Math.max(0, cur - 1);
          scrubIdx[rovingCell] = nextK;
          paintSpark(rovingCell);
          const p = PERIODS[periodIdx];
          const m = p.metrics[rovingCell];
          sr.textContent = `${m.name}, ${p.times[nextK]}: ${m.fmt(m.values[nextK])}`;
        } else if (e.key === "Escape") {
          resetScrub(rovingCell);
          setFocusCell(-1);
        }
      }, { signal: ctx.signal });

      requestAnimationFrame(() => {
        refs.forEach((r, i) => {
          if (r.spark.clientWidth > 0) widths[i] = Math.round(r.spark.clientWidth);
          paintSpark(i);
        });
      });

      setPeriod(0, true, false);
    },
  });
})();
