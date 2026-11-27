/* Multi-Series Line Chart (Plain Data): 8-week benchmark pass rate across Opus, Sonnet, and Haiku in R7 series
   hues, with Tufte direct inline labels (no legend box), 4.5x4.5 square vertices, column scrub hairline, and
   series isolation stepping unselected lines down to 0.18 opacity. */
(function () {
  const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
  const SERIES = [
    {
      key: "opus",
      name: "Opus",
      hue: "var(--data-blue)",
      values: [88.2, 89.6, 91.0, 92.4, 93.1, 94.5, 95.6, 96.4],
    },
    {
      key: "sonnet",
      name: "Sonnet",
      hue: "var(--data-amber)",
      values: [81.4, 83.0, 84.8, 86.2, 87.9, 89.1, 90.5, 91.8],
    },
    {
      key: "haiku",
      name: "Haiku",
      hue: "var(--data-teal)",
      values: [71.6, 72.8, 74.1, 75.0, 76.4, 77.2, 78.5, 79.2],
    },
  ];

  const Y_TICKS = [100, 85, 70];
  const Y_TOP = 18;
  const Y_BOT = 176;
  const V_MIN = 70;
  const V_MAX = 100;
  const yAt = (v) => Y_BOT - ((v - V_MIN) / (V_MAX - V_MIN)) * (Y_BOT - Y_TOP);

  PlainPlayer.registerData({
    slug: "line-chart",
    chapter: "charts",
    span: "half",
    title: "Multi-Series Line Chart",
    css: `
.dd-line-chart .lc { display: grid; gap: 14px }
.dd-line-chart .lc-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 14px }
.dd-line-chart .lc-top h3 { margin: 0; font: 500 15px/1.3 var(--font); letter-spacing: -0.01em; color: var(--ink) }
.dd-line-chart .lc-series-nav { position: relative; display: inline-flex; align-items: center; gap: 11px; padding: 2px 8px }
.dd-line-chart .lc-series-nav .q { min-height: 28px; font-size: 13px }
.dd-line-chart .lc-dot { font-size: 13px; color: var(--muted); opacity: var(--unselected); user-select: none; pointer-events: none }

.dd-line-chart .lc-readout { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 14px; min-height: 28px }
.dd-line-chart .lc-fig { font-size: 22px; font-weight: 500; line-height: 1.15; letter-spacing: -0.022em }
.dd-line-chart .lc-sub { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums }

.dd-line-chart .lc-plot { position: relative; width: 100% }
.dd-line-chart .lc-plot:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px }
.dd-line-chart .lc-svg { display: block; width: 100%; height: auto; overflow: visible; touch-action: pan-y }
.dd-line-chart .lc-axis-lbl { font: 400 12px/1 var(--font); fill: var(--muted); font-variant-numeric: tabular-nums; user-select: none }
.dd-line-chart .lc-week-lbl { font: 400 12px/1 var(--font); fill: var(--muted); font-variant-numeric: tabular-nums; user-select: none;
  transition: fill var(--dur-instant) var(--ease-out) }
.dd-line-chart .lc-week-lbl.is-on { fill: var(--ink); font-weight: 500 }

.dd-line-chart .lc-group { transition: opacity var(--dur-pare) var(--ease-out) }
.dd-line-chart .lc-svg[data-isolate] .lc-group:not([data-active]) { opacity: 0.18 }
.dd-line-chart .lc-vertex { transform-box: fill-box; transform-origin: center; transition: transform var(--dur-instant) var(--ease-out) }
.dd-line-chart .lc-vertex.is-scrub { transform: scale(1.35) }

.dd-line-chart .lc-direct { cursor: pointer }
.dd-line-chart .lc-direct-name { font: 500 12.5px/1 var(--font); fill: var(--ink); font-variant-numeric: tabular-nums; user-select: none }
.dd-line-chart .lc-direct-val { font-weight: 400; fill: var(--muted) }
.dd-line-chart .lc-svg[data-isolate] .lc-group[data-active] .lc-direct-val { fill: var(--ink); font-weight: 500 }
`,
    mount(host, ctx) {
      let pinnedKey = "all";
      let hoverKey = null;
      let scrubWeek = -1;
      /* Default desktop coordinate frame: viewBox="0 0 540 210", right margin 112px (x = 428..540).
         On narrow mobile (< 480px), adapts viewBox width to container px so all 12px SVG labels stay 1:1 legible. */
      let vbW = 540;
      let x0 = 44;
      let x1 = 420;
      let lblX = 428;

      const xAt = (i) => x0 + (i / (WEEKS.length - 1)) * (x1 - x0);

      host.innerHTML = `
<div class="lc">
  <div class="lc-top">
    <h3>Benchmark pass rate</h3>
    <div class="lc-series-nav" role="radiogroup" aria-label="Isolate model series">
      <button type="button" class="q in-frame" role="radio" data-key="all" aria-checked="true" tabindex="0">All</button>
      ${SERIES.map((s) => `<span class="lc-dot" aria-hidden="true">\u00b7</span><button type="button" class="q in-frame" role="radio" data-key="${s.key}" aria-checked="false" tabindex="-1">${s.name}</button>`).join("")}
    </div>
  </div>
  <div class="lc-readout">
    <span class="fig lc-fig">Week 8 \u00b7 Opus 96.4 %</span>
    <span class="lc-sub">Sonnet 91.8 % \u00b7 Haiku 79.2 %</span>
  </div>
  <div class="lc-plot" tabindex="0" role="group" aria-label="Benchmark pass rate across 8 weeks. Use Left and Right arrows to scrub weeks.">
    <svg class="lc-svg" viewBox="0 0 540 210" aria-hidden="true">
      <g class="lc-grid">
        ${Y_TICKS.map((t) => {
          const y = yAt(t).toFixed(1);
          return `<line class="lc-hrule" x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1" shape-rendering="crispEdges"></line>
          <text x="${x0 - 8}" y="${y}" text-anchor="end" dominant-baseline="central" class="lc-axis-lbl">${t} %</text>`;
        }).join("")}
      </g>
      <g class="lc-weeks">
        ${WEEKS.map((w, i) => `<text x="${xAt(i).toFixed(1)}" y="198" text-anchor="middle" class="lc-week-lbl" data-w="${i}">${w}</text>`).join("")}
      </g>
      <line class="lc-scrub" x1="0" x2="0" y1="${Y_TOP}" y2="${Y_BOT}" stroke="var(--ink)" stroke-width="1" shape-rendering="crispEdges" opacity="0"></line>
      <g class="lc-series-wrap">
        ${SERIES.map((s) => {
          const pts = s.values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");
          const lastVal = s.values[s.values.length - 1];
          const yEnd = yAt(lastVal).toFixed(1);
          return `
          <g class="lc-group" data-series="${s.key}">
            <polyline class="lc-poly" points="${pts}" fill="none" stroke="${s.hue}" stroke-width="1.5" stroke-linejoin="miter" stroke-linecap="butt"></polyline>
            ${s.values.map((v, i) => `<rect class="lc-vertex" data-w="${i}" x="${(xAt(i) - 2.25).toFixed(2)}" y="${(yAt(v) - 2.25).toFixed(2)}" width="4.5" height="4.5" fill="${s.hue}"></rect>`).join("")}
            <g class="lc-direct" data-series="${s.key}">
              <rect class="lc-direct-hit" x="${lblX - 4}" y="${(Number(yEnd) - 12).toFixed(1)}" width="${vbW - lblX + 4}" height="24" fill="transparent"></rect>
              <text x="${lblX}" y="${yEnd}" dominant-baseline="central" class="lc-direct-name">${s.name} <tspan class="lc-direct-val">${lastVal.toFixed(1)}%</tspan></text>
            </g>
          </g>`;
        }).join("")}
      </g>
      <rect class="lc-hit" x="${x0 - 10}" y="${Y_TOP - 8}" width="${x1 - x0 + 20}" height="${Y_BOT - Y_TOP + 28}" fill="transparent" style="cursor:crosshair"></rect>
    </svg>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const navEl = host.querySelector(".lc-series-nav");
      const navBtns = [...navEl.querySelectorAll('[role="radio"]')];
      const figEl = host.querySelector(".lc-fig");
      const subEl = host.querySelector(".lc-sub");
      const plotEl = host.querySelector(".lc-plot");
      const svgEl = host.querySelector(".lc-svg");
      const hRules = [...svgEl.querySelectorAll(".lc-hrule")];
      const axisLbls = [...svgEl.querySelectorAll(".lc-axis-lbl")];
      const scrubLine = host.querySelector(".lc-scrub");
      const weekLbls = [...host.querySelectorAll(".lc-week-lbl")];
      const groups = [...host.querySelectorAll(".lc-group")];
      const directEls = [...host.querySelectorAll(".lc-direct")];
      const hitRect = host.querySelector(".lc-hit");
      const sr = host.querySelector("[aria-live]");

      const navFrame = ctx.brackets(navEl, { padX: 6, padY: 2, exactPad: true });

      function applyGeometry(containerW) {
        if (containerW > 0 && containerW < 480) {
          vbW = Math.max(276, Math.round(containerW));
          x0 = 40;
          const rightMargin = vbW < 320 ? 86 : 96;
          x1 = vbW - rightMargin;
          lblX = x1 + 8;
        } else {
          vbW = 540;
          x0 = 44;
          x1 = 420;
          lblX = 428;
        }

        svgEl.setAttribute("viewBox", `0 0 ${vbW} 210`);
        hRules.forEach((ln) => {
          ln.setAttribute("x1", String(x0));
          ln.setAttribute("x2", String(x1));
        });
        axisLbls.forEach((tx) => tx.setAttribute("x", String(x0 - 6)));
        weekLbls.forEach((tx, i) => tx.setAttribute("x", xAt(i).toFixed(1)));
        hitRect.setAttribute("x", String(x0 - 10));
        hitRect.setAttribute("width", String(x1 - x0 + 20));

        groups.forEach((g) => {
          const s = SERIES.find((item) => item.key === g.dataset.series);
          const poly = g.querySelector(".lc-poly");
          poly.setAttribute("points", s.values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" "));
          const rects = g.querySelectorAll(".lc-vertex");
          rects.forEach((r, i) => {
            r.setAttribute("x", (xAt(i) - 2.25).toFixed(2));
            r.setAttribute("y", (yAt(s.values[i]) - 2.25).toFixed(2));
          });
          const dHit = g.querySelector(".lc-direct-hit");
          const dTxt = g.querySelector(".lc-direct-name");
          dHit.setAttribute("x", String(lblX - 4));
          dHit.setAttribute("width", String(Math.max(76, vbW - lblX + 4)));
          dTxt.setAttribute("x", String(lblX));
        });

        if (scrubWeek >= 0) {
          const sx = xAt(scrubWeek).toFixed(1);
          scrubLine.setAttribute("x1", sx);
          scrubLine.setAttribute("x2", sx);
        }
      }

      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver((entries) => {
          for (const e of entries) {
            if (e.contentRect.width > 0) applyGeometry(e.contentRect.width);
          }
        });
        ro.observe(plotEl);
        ctx.signal.addEventListener("abort", () => ro.disconnect(), { once: true });
      }

      function effectiveSeries() {
        if (hoverKey) return hoverKey;
        return pinnedKey === "all" ? null : pinnedKey;
      }

      function syncState(animateText) {
        const iso = effectiveSeries();
        if (iso) {
          svgEl.setAttribute("data-isolate", iso);
          groups.forEach((g) => {
            if (g.dataset.series === iso) g.setAttribute("data-active", "");
            else g.removeAttribute("data-active");
          });
        } else {
          svgEl.removeAttribute("data-isolate");
          groups.forEach((g) => g.removeAttribute("data-active"));
        }

        const w = scrubWeek >= 0 ? scrubWeek : WEEKS.length - 1;
        if (scrubWeek >= 0) {
          const x = xAt(scrubWeek).toFixed(1);
          scrubLine.setAttribute("x1", x);
          scrubLine.setAttribute("x2", x);
          scrubLine.setAttribute("opacity", "1");
        } else {
          scrubLine.setAttribute("opacity", "0");
        }

        weekLbls.forEach((lbl, idx) => lbl.classList.toggle("is-on", idx === scrubWeek));
        groups.forEach((g) => {
          const s = SERIES.find((x) => x.key === g.dataset.series);
          const dval = g.querySelector(".lc-direct-val");
          dval.textContent = s.values[w].toFixed(1) + "%";
          const rects = g.querySelectorAll(".lc-vertex");
          rects.forEach((r, idx) => r.classList.toggle("is-scrub", idx === scrubWeek));
        });

        let figStr = "";
        let subStr = "";
        if (scrubWeek >= 0) {
          const focusS = iso ? SERIES.find((s) => s.key === iso) : SERIES[0];
          figStr = `Week ${w + 1} \u00b7 ${focusS.name} ${focusS.values[w].toFixed(1)} %`;
          subStr = SERIES.map((s) => `${s.name} ${s.values[w].toFixed(1)} %`).join(" \u00b7 ");
        } else if (iso) {
          const s = SERIES.find((x) => x.key === iso);
          const delta = (s.values[7] - s.values[0]).toFixed(1);
          figStr = `Week 8 \u00b7 ${s.name} ${s.values[7].toFixed(1)} %`;
          subStr = `+${delta} pts vs W1 (${s.values[0].toFixed(1)} %)`;
        } else {
          figStr = "Week 8 \u00b7 Opus 96.4 %";
          subStr = "Sonnet 91.8 % \u00b7 Haiku 79.2 %";
        }

        if (animateText) {
          ctx.swapText(figEl, figStr);
          ctx.swapText(subEl, subStr);
        } else {
          figEl.textContent = figStr;
          subEl.textContent = subStr;
        }
      }

      function setPinned(key, immediate, byUser) {
        pinnedKey = key;
        navBtns.forEach((btn) => {
          const on = btn.dataset.key === key;
          btn.setAttribute("aria-checked", on ? "true" : "false");
          btn.tabIndex = on ? 0 : -1;
          if (on) navFrame.moveTo(btn, { immediate });
        });
        syncState(!immediate);
        if (byUser) {
          if (key === "all") sr.textContent = "Showing all three models.";
          else {
            const s = SERIES.find((x) => x.key === key);
            sr.textContent = `Isolated ${s.name}: Week 8 ${s.values[7].toFixed(1)} %.`;
          }
        }
      }

      navBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const next = btn.dataset.key === pinnedKey && pinnedKey !== "all" ? "all" : btn.dataset.key;
          setPinned(next, false, true);
        }, { signal: ctx.signal });
      });

      navEl.addEventListener("keydown", (e) => {
        const idx = navBtns.findIndex((b) => b.dataset.key === pinnedKey);
        let next = idx;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % navBtns.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx + navBtns.length - 1) % navBtns.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = navBtns.length - 1;
        else return;
        e.preventDefault();
        navBtns[next].focus({ preventScroll: true });
        setPinned(navBtns[next].dataset.key, false, true);
      }, { signal: ctx.signal });

      directEls.forEach((el) => {
        const key = el.dataset.series;
        el.addEventListener("pointerenter", (e) => {
          if (e.pointerType === "touch") return;
          hoverKey = key;
          syncState(false);
        }, { signal: ctx.signal });
        el.addEventListener("pointerleave", () => {
          hoverKey = null;
          syncState(false);
        }, { signal: ctx.signal });
        el.addEventListener("click", () => {
          hoverKey = null;
          const next = pinnedKey === key ? "all" : key;
          setPinned(next, false, true);
        }, { signal: ctx.signal });
      });

      function scrubFromPointer(e) {
        const rect = svgEl.getBoundingClientRect();
        if (!rect.width) return;
        const svgX = ((e.clientX - rect.left) / rect.width) * vbW;
        const ratio = Math.max(0, Math.min(1, (svgX - x0) / (x1 - x0)));
        const idx = Math.round(ratio * (WEEKS.length - 1));
        if (scrubWeek !== idx) {
          scrubWeek = idx;
          syncState(false);
        }
      }

      hitRect.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "touch") return;
        scrubFromPointer(e);
      }, { signal: ctx.signal });
      hitRect.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        scrubFromPointer(e);
      }, { signal: ctx.signal });
      hitRect.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "touch") scrubFromPointer(e);
      }, { signal: ctx.signal });
      hitRect.addEventListener("pointerleave", () => {
        scrubWeek = -1;
        syncState(false);
      }, { signal: ctx.signal });

      plotEl.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const cur = scrubWeek >= 0 ? scrubWeek : WEEKS.length - 1;
          scrubWeek = e.key === "ArrowLeft" ? Math.max(0, cur - 1) : Math.min(WEEKS.length - 1, cur + 1);
          syncState(false);
          sr.textContent = `Week ${scrubWeek + 1}: ${SERIES.map((s) => `${s.name} ${s.values[scrubWeek].toFixed(1)} %`).join(", ")}.`;
        } else if (e.key === "Escape") {
          scrubWeek = -1;
          syncState(false);
        }
      }, { signal: ctx.signal });

      plotEl.addEventListener("blur", () => {
        if (scrubWeek >= 0) {
          scrubWeek = -1;
          syncState(false);
        }
      }, { signal: ctx.signal });

      requestAnimationFrame(() => {
        if (plotEl.clientWidth > 0) applyGeometry(plotEl.clientWidth);
      });
      setPinned("all", true, false);
    },
  });
})();
