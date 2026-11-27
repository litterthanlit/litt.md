/* Stacked Composition (Plain Data): 7-day agent tool spend ($98.40) across 4 R7 series hues parted by 1.5px
   --page paper cuts, paired with a 4-row hairline table. Hovering or pinning a tool steps the other 3 categories
   across all 7 columns and table rows down to 0.16 opacity. */
(function () {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const TOOLS = [
    {
      key: "edit",
      name: "Code edit",
      hue: "var(--data-blue)",
      total: 46.20,
      share: 47,
      daily: [7.80, 8.60, 9.20, 8.40, 7.60, 2.60, 2.00],
    },
    {
      key: "test",
      name: "Test runner",
      hue: "var(--data-amber)",
      total: 24.60,
      share: 25,
      daily: [4.10, 4.60, 5.00, 4.40, 4.10, 1.40, 1.00],
    },
    {
      key: "search",
      name: "Repo search",
      hue: "var(--data-teal)",
      total: 16.80,
      share: 17,
      daily: [2.80, 3.10, 3.40, 3.00, 2.70, 1.00, 0.80],
    },
    {
      key: "browser",
      name: "Browser",
      hue: "var(--data-violet)",
      total: 10.80,
      share: 11,
      daily: [1.70, 2.00, 2.20, 1.90, 1.80, 0.70, 0.50],
    },
  ];
  const GRAND_TOTAL = 98.40;
  const MAX_DAY = 21.0;
  const PLOT_H = 124;
  const GAP_PX = 1.5;
  const USABLE_H = PLOT_H - GAP_PX * (TOOLS.length - 1);

  PlainPlayer.registerData({
    slug: "stacked-breakdown",
    chapter: "charts",
    span: "half",
    title: "Stacked Composition",
    css: `
.dd-stacked-breakdown .sb { display: grid; gap: 14px }
.dd-stacked-breakdown .sb-top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 14px }
.dd-stacked-breakdown .sb-top h3 { margin: 0; font: 500 15px/1.3 var(--font); letter-spacing: -0.01em; color: var(--ink) }
.dd-stacked-breakdown .sb-meta { font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums }

.dd-stacked-breakdown .sb-readout { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 14px; min-height: 28px }
.dd-stacked-breakdown .sb-fig { font-size: 22px; font-weight: 500; line-height: 1.15; letter-spacing: -0.022em }
.dd-stacked-breakdown .sb-sub { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums }

.dd-stacked-breakdown .sb-bars-wrap { display: grid; gap: 8px; padding-top: 4px }
.dd-stacked-breakdown .sb-cols { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 12px;
  height: ${PLOT_H}px; align-items: end; border-bottom: 1px solid var(--line-control) }
.dd-stacked-breakdown .sb-day-col { display: flex; flex-direction: column-reverse; align-items: stretch; gap: 1.5px;
  width: 100%; max-width: 44px; justify-self: center }
.dd-stacked-breakdown .sb-seg { display: block; width: 100%; background: var(--hue); cursor: pointer;
  transition: opacity var(--dur-pare) var(--ease-out) }

.dd-stacked-breakdown .sb-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 12px }
.dd-stacked-breakdown .sb-day-lbl { text-align: center; font-size: 12px; line-height: 1; color: var(--muted);
  font-variant-numeric: tabular-nums; user-select: none; transition: color var(--dur-instant) var(--ease-out) }
.dd-stacked-breakdown .sb-day-lbl.is-on { color: var(--ink); font-weight: 500 }

.dd-stacked-breakdown .sb-table { position: relative; display: grid; margin-top: 2px; border-bottom: 1px solid var(--line) }
.dd-stacked-breakdown .sb-row { display: grid; grid-template-columns: 8px minmax(0, 1fr) auto 44px; align-items: center;
  gap: 10px; width: 100%; padding: 8px 0; border: 0; border-top: 1px solid var(--line); background: none;
  text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: opacity var(--dur-pare) var(--ease-out) }
.dd-stacked-breakdown .sb-row:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }
.dd-stacked-breakdown .sb-sw { width: 8px; height: 8px; background: var(--hue) }
.dd-stacked-breakdown .sb-name { display: inline-block; justify-self: start; font-size: 14px; font-weight: 400; color: var(--ink) }
.dd-stacked-breakdown .sb-row[data-active] .sb-name { font-weight: 500 }
.dd-stacked-breakdown .sb-amt { font-size: 13.5px; color: var(--ink); font-variant-numeric: tabular-nums; text-align: right }
.dd-stacked-breakdown .sb-pct { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; text-align: right }

/* Subtract the other 3 categories across ALL 7 columns AND in the table to 0.16 opacity. */
.dd-stacked-breakdown .sb[data-focusing] .sb-seg:not([data-active]),
.dd-stacked-breakdown .sb[data-focusing] .sb-row:not([data-active]) { opacity: 0.16 }

@container (max-width: 360px) {
  .dd-stacked-breakdown .sb-cols,
  .dd-stacked-breakdown .sb-days { gap: 6px }
}
`,
    mount(host, ctx) {
      let pinnedIdx = -1;
      let hoverIdx = -1;
      let hoverDay = -1;
      let rovingIdx = 0;

      const dayTotals = DAYS.map((_, d) => TOOLS.reduce((sum, t) => sum + t.daily[d], 0));

      host.innerHTML = `
<div class="sb">
  <div class="sb-top">
    <h3>Weekly spend by tool</h3>
    <span class="sb-meta">7 days \u00b7 894 runs</span>
  </div>
  <div class="sb-readout">
    <span class="fig sb-fig">$98.40</span>
    <span class="sb-sub">total across 4 tools</span>
  </div>
  <div class="sb-bars-wrap" aria-hidden="true">
    <div class="sb-cols">
      ${DAYS.map((_, d) => `
      <div class="sb-day-col" data-day="${d}">
        ${TOOLS.map((t, ti) => {
          const h = Math.max(2, (t.daily[d] / MAX_DAY) * USABLE_H);
          return `<span class="sb-seg" data-tool="${ti}" data-day="${d}" style="--hue:${t.hue};height:${h.toFixed(2)}px"></span>`;
        }).join("")}
      </div>`).join("")}
    </div>
    <div class="sb-days">
      ${DAYS.map((day, d) => `<span class="sb-day-lbl" data-day="${d}">${day}</span>`).join("")}
    </div>
  </div>
  <div class="sb-table" role="group" aria-label="Spend breakdown by tool">
    ${TOOLS.map((t, i) => `
    <button type="button" class="sb-row" data-tool="${i}" tabindex="${i === 0 ? "0" : "-1"}" aria-pressed="false" style="--hue:${t.hue}">
      <i class="sb-sw" aria-hidden="true"></i>
      <span class="sb-name">${t.name}</span>
      <span class="sb-amt">$${t.total.toFixed(2)}</span>
      <span class="sb-pct">${t.share} %</span>
    </button>`).join("")}
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const rootEl = host.querySelector(".sb");
      const figEl = host.querySelector(".sb-fig");
      const subEl = host.querySelector(".sb-sub");
      const segEls = [...host.querySelectorAll(".sb-seg")];
      const dayLbls = [...host.querySelectorAll(".sb-day-lbl")];
      const tableEl = host.querySelector(".sb-table");
      const rowEls = [...tableEl.querySelectorAll(".sb-row")];
      const nameEls = rowEls.map((r) => r.querySelector(".sb-name"));
      const sr = host.querySelector("[aria-live]");

      const rowFrame = ctx.brackets(tableEl, { padX: 6, padY: 2, size: 5, exactPad: true });

      function currentTool() {
        return hoverIdx >= 0 ? hoverIdx : pinnedIdx;
      }

      function syncUI(animateText) {
        const idx = currentTool();
        if (idx >= 0) {
          rootEl.setAttribute("data-focusing", "");
          segEls.forEach((s) => {
            if (Number(s.dataset.tool) === idx) s.setAttribute("data-active", "");
            else s.removeAttribute("data-active");
          });
          rowEls.forEach((r, i) => {
            if (i === idx) r.setAttribute("data-active", "");
            else r.removeAttribute("data-active");
          });
          rowFrame.moveTo(nameEls[idx], { immediate: false });
        } else {
          rootEl.removeAttribute("data-focusing");
          segEls.forEach((s) => s.removeAttribute("data-active"));
          rowEls.forEach((r) => r.removeAttribute("data-active"));
          rowFrame.pare();
        }

        rowEls.forEach((r, i) => {
          r.setAttribute("aria-pressed", pinnedIdx === i ? "true" : "false");
        });
        dayLbls.forEach((l, d) => l.classList.toggle("is-on", d === hoverDay));

        let figStr = `$${GRAND_TOTAL.toFixed(2)}`;
        let subStr = "total across 4 tools";
        if (idx >= 0) {
          const t = TOOLS[idx];
          figStr = `${t.name} \u00b7 $${t.total.toFixed(2)} \u00b7 ${t.share} %`;
          if (hoverDay >= 0) {
            subStr = `${DAYS[hoverDay]} \u00b7 $${t.daily[hoverDay].toFixed(2)} of $${dayTotals[hoverDay].toFixed(2)}`;
          } else {
            subStr = `$${(t.total / 7).toFixed(2)} / day avg \u00b7 peak Wed $${t.daily[2].toFixed(2)}`;
          }
        }

        if (animateText) {
          ctx.swapText(figEl, figStr);
          ctx.swapText(subEl, subStr);
        } else {
          figEl.textContent = figStr;
          subEl.textContent = subStr;
        }
      }

      function togglePin(idx, byUser) {
        pinnedIdx = pinnedIdx === idx ? -1 : idx;
        rovingIdx = idx;
        rowEls.forEach((r, i) => (r.tabIndex = i === rovingIdx ? 0 : -1));
        syncUI(true);
        if (byUser) {
          if (pinnedIdx >= 0) {
            const t = TOOLS[pinnedIdx];
            sr.textContent = `${t.name}: $${t.total.toFixed(2)}, ${t.share} percent of weekly spend.`;
          } else {
            sr.textContent = `All tools: $${GRAND_TOTAL.toFixed(2)} weekly spend.`;
          }
        }
      }

      segEls.forEach((seg) => {
        const ti = Number(seg.dataset.tool);
        const di = Number(seg.dataset.day);
        seg.addEventListener("pointerenter", (e) => {
          if (e.pointerType === "touch") return;
          hoverIdx = ti;
          hoverDay = di;
          syncUI(false);
        }, { signal: ctx.signal });
        seg.addEventListener("pointerleave", () => {
          hoverIdx = -1;
          hoverDay = -1;
          syncUI(false);
        }, { signal: ctx.signal });
        seg.addEventListener("click", () => {
          hoverIdx = -1;
          hoverDay = -1;
          togglePin(ti, true);
        }, { signal: ctx.signal });
      });

      rowEls.forEach((row, i) => {
        row.addEventListener("pointerenter", (e) => {
          if (e.pointerType === "touch") return;
          hoverIdx = i;
          hoverDay = -1;
          syncUI(false);
        }, { signal: ctx.signal });
        row.addEventListener("pointerleave", () => {
          hoverIdx = -1;
          syncUI(false);
        }, { signal: ctx.signal });
        row.addEventListener("click", () => {
          hoverIdx = -1;
          togglePin(i, true);
        }, { signal: ctx.signal });
        row.addEventListener("focus", () => {
          if (row.matches(":focus-visible")) {
            rovingIdx = i;
            hoverIdx = i;
            syncUI(false);
          }
        }, { signal: ctx.signal });
      });

      tableEl.addEventListener("focusout", (e) => {
        if (!tableEl.contains(e.relatedTarget)) {
          hoverIdx = -1;
          syncUI(false);
        }
      }, { signal: ctx.signal });

      tableEl.addEventListener("keydown", (e) => {
        let next = rovingIdx;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (rovingIdx + 1) % TOOLS.length;
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (rovingIdx + TOOLS.length - 1) % TOOLS.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = TOOLS.length - 1;
        else if (e.key === "Escape") {
          pinnedIdx = -1;
          hoverIdx = -1;
          syncUI(false);
          return;
        } else return;
        e.preventDefault();
        rovingIdx = next;
        rowEls.forEach((r, i) => (r.tabIndex = i === next ? 0 : -1));
        rowEls[next].focus({ preventScroll: true });
        hoverIdx = next;
        syncUI(false);
      }, { signal: ctx.signal });
    },
  });
})();
