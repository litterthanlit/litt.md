/* Execution Trace Waterfall, in Plain (Subtraction): "Turn trace · 2.84 s" with a [ Critical path ] toggle in the
   header, a 1px tree-hierarchy indent guide on the left, and sharp 6px-tall boxless span bars on a 0 s .. 3.0 s
   timeline (--ink for blocking critical-path spans, --ink-42 for parallel non-blocking spans). */
(function () {
  const MAX_S = 3.0;
  const SPANS = [
    {
      id: "plan",
      label: "Plan",
      root: true,
      start: 0.0,
      dur: 0.38,
      durText: "380 ms",
      critical: true,
      detail: "Plan · 0.00 s → 0.38 s (380 ms · 13.4 %) · blocking",
    },
    {
      id: "read",
      label: "Read 3 files",
      start: 0.38,
      dur: 0.48,
      durText: "480 ms",
      critical: true,
      detail: "Read 3 files · 0.38 s → 0.86 s (480 ms · 16.9 %) · blocking",
    },
    {
      id: "docs",
      label: "Fetch docs",
      start: 0.44,
      dur: 0.74,
      durText: "740 ms",
      critical: false,
      detail: "Fetch docs · 0.44 s → 1.18 s (740 ms · parallel async) · non-blocking",
    },
    {
      id: "patch",
      label: "Generate patch",
      start: 0.86,
      dur: 1.18,
      durText: "1.18 s",
      critical: true,
      detail: "Generate patch · 0.86 s → 2.04 s (1.18 s · 41.5 %) · blocking",
    },
    {
      id: "lint",
      label: "Lint",
      start: 2.04,
      dur: 0.42,
      durText: "420 ms",
      critical: false,
      detail: "Lint · 2.04 s → 2.46 s (420 ms · parallel check) · non-blocking",
    },
    {
      id: "vitest",
      label: "Run vitest",
      last: true,
      start: 2.04,
      dur: 0.80,
      durText: "800 ms",
      critical: true,
      detail: "Run vitest · 2.04 s → 2.84 s (800 ms · 28.2 %) · blocking",
    },
  ];

  const REST_SUMMARY = "4 blocking spans (2.84 s) · 2 parallel non-blocking spans";
  const CRIT_SUMMARY = "Critical path isolated · 4 blocking handoffs · 0.00 s → 2.84 s";

  PlainPlayer.registerData({
    slug: "trace-waterfall",
    chapter: "diagrams",
    span: "half",
    title: "Execution Trace Waterfall",
    css: `
.dd-trace-waterfall .tw { display: grid; gap: 14px; min-width: 0 }
.dd-trace-waterfall .tw-top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 16px }
.dd-trace-waterfall .tw-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px }
.dd-trace-waterfall .tw-heading h3 { margin: 0; font: 500 15px/1.3 var(--font); letter-spacing: -0.01em }
.dd-trace-waterfall .tw-fig { font-size: 22px; line-height: 1.1 }
.dd-trace-waterfall .tw-actions { padding: 0 14px }
.dd-trace-waterfall .tw-crit-btn { font-size: 13.5px; min-height: 28px }
.dd-trace-waterfall .tw-sub { margin: 0; font-family: var(--mono); font-size: 12px; line-height: 1.4; color: var(--muted);
  overflow-wrap: anywhere; transition: color var(--dur-instant) var(--ease-out) }
.dd-trace-waterfall .tw-sub.is-ink { color: var(--ink) }
.dd-trace-waterfall .tw-axis { display: grid; grid-template-columns: 148px minmax(0, 1fr) 48px; align-items: end; gap: 12px;
  padding: 0 6px 6px; border-bottom: 1px solid var(--line) }
.dd-trace-waterfall .tw-axis-name { font-size: 12px; color: var(--muted) }
.dd-trace-waterfall .tw-ticks { position: relative; height: 16px }
.dd-trace-waterfall .tw-tick { position: absolute; top: 0; font-size: 12px; line-height: 1.2; color: var(--muted);
  font-variant-numeric: tabular-nums; transform: translateX(-50%); white-space: nowrap }
.dd-trace-waterfall .tw-tick.is-start { left: 0; transform: none }
.dd-trace-waterfall .tw-tick.is-end { left: 100%; transform: translateX(-100%) }
.dd-trace-waterfall .tw-tshort { display: none }
.dd-trace-waterfall .tw-axis-dur { font-size: 12px; color: var(--muted); text-align: right }
.dd-trace-waterfall .tw-rows { position: relative; display: grid; padding: 2px 6px }
/* Continuous 1px vertical tree trunk from Plan down to Run vitest */
.dd-trace-waterfall .tw-trunk { position: absolute; left: 10px; top: 32px; bottom: 18px; width: 1px;
  background: var(--line-strong); pointer-events: none }
.dd-trace-waterfall .tw-guides { position: absolute; top: 0; bottom: 0; left: calc(6px + 148px + 12px); right: calc(6px + 48px + 12px);
  pointer-events: none }
.dd-trace-waterfall .tw-gline { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--line); opacity: 0.65 }
.dd-trace-waterfall .tw-cursor { position: absolute; top: -4px; bottom: 0; width: 1px; background: var(--line-strong);
  opacity: 0; transition: opacity var(--dur-instant) var(--ease-out) }
.dd-trace-waterfall .tw-guides.has-cursor .tw-cursor { opacity: 0.7 }
.dd-trace-waterfall .tw-row { appearance: none; border: 0; border-radius: 0; background: transparent; margin: 0;
  position: relative; z-index: 1; display: grid; grid-template-columns: 148px minmax(0, 1fr) 48px; align-items: center; gap: 12px;
  width: 100%; padding: 8px 0; text-align: left; cursor: pointer; color: var(--ink); -webkit-tap-highlight-color: transparent;
  transition: opacity var(--dur-pare) var(--ease-out) }
.dd-trace-waterfall .tw-row.is-dim { opacity: 0.18 }
.dd-trace-waterfall .tw-row:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }
.dd-trace-waterfall .tw-tree { position: relative; display: flex; align-items: center; min-width: 0; padding-left: 0 }
.dd-trace-waterfall .tw-tree.is-child { padding-left: 16px }
.dd-trace-waterfall .tw-tree.is-child::after { content: ""; position: absolute; left: 4px; top: 50%;
  width: 8px; height: 1px; background: var(--line-strong) }
.dd-trace-waterfall .tw-sname { font-family: var(--mono); font-size: 12.5px; line-height: 1.3; color: var(--ink);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.dd-trace-waterfall .tw-row.is-async .tw-sname { color: var(--muted) }
.dd-trace-waterfall .tw-lane { position: relative; height: 14px; display: flex; align-items: center }
.dd-trace-waterfall .tw-bar { position: absolute; top: 4px; height: 6px; background: var(--ink) }
.dd-trace-waterfall .tw-row.is-async .tw-bar { background: var(--ink-42) }
.dd-trace-waterfall .tw-dur { font-size: 12px; color: var(--muted); text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap }
@media (max-width: 460px) {
  .dd-trace-waterfall .tw-axis { grid-template-columns: 114px minmax(0, 1fr) 40px; gap: 8px }
  .dd-trace-waterfall .tw-guides { left: calc(6px + 114px + 8px); right: calc(6px + 40px + 8px) }
  .dd-trace-waterfall .tw-row { grid-template-columns: 114px minmax(0, 1fr) 40px; gap: 8px }
  .dd-trace-waterfall .tw-sname { font-size: 12px }
  .dd-trace-waterfall .tw-tree.is-child { padding-left: 13px }
  .dd-trace-waterfall .tw-tree.is-child::after { width: 6px }
  .dd-trace-waterfall .tw-tfull { display: none }
  .dd-trace-waterfall .tw-tshort { display: inline }
}
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="tw">
  <header class="tw-head">
    <div class="tw-top">
      <div class="tw-heading">
        <h3>Turn trace</h3>
        <span class="fig tw-fig">2.84 s</span>
      </div>
      <div class="tw-actions">
        <button type="button" class="q tw-crit-btn" role="switch" aria-checked="false">Critical path</button>
      </div>
    </div>
    <p class="tw-sub">${REST_SUMMARY}</p>
  </header>
  <div class="tw-body">
    <div class="tw-axis" aria-hidden="true">
      <span class="tw-axis-name">Span</span>
      <div class="tw-ticks">
        <span class="tw-tick is-start">0 s</span>
        <span class="tw-tick" style="left: 33.333%"><span class="tw-tfull">1.0 s</span><span class="tw-tshort">1 s</span></span>
        <span class="tw-tick" style="left: 66.667%"><span class="tw-tfull">2.0 s</span><span class="tw-tshort">2 s</span></span>
        <span class="tw-tick is-end"><span class="tw-tfull">3.0 s</span><span class="tw-tshort">3 s</span></span>
      </div>
      <span class="tw-axis-dur">Time</span>
    </div>
    <div class="tw-rows" role="listbox" aria-label="Execution trace spans">
      <i class="tw-trunk" aria-hidden="true"></i>
      <div class="tw-guides" aria-hidden="true">
        <i class="tw-gline" style="left: 33.333%"></i>
        <i class="tw-gline" style="left: 66.667%"></i>
        <i class="tw-cursor tw-c0"></i>
        <i class="tw-cursor tw-c1"></i>
      </div>
      ${SPANS.map((s, i) => {
        const leftPct = ((s.start / MAX_S) * 100).toFixed(3);
        const widthPct = ((s.dur / MAX_S) * 100).toFixed(3);
        const treeCls = s.root ? "tw-tree" : "tw-tree is-child" + (s.last ? " is-last" : "");
        return `
        <button type="button" class="tw-row${s.critical ? "" : " is-async"}" role="option" aria-selected="false" data-idx="${i}">
          <span class="${treeCls}"><span class="tw-sname">${s.label}</span></span>
          <span class="tw-lane"><span class="tw-bar" style="left: ${leftPct}%; width: ${widthPct}%"></span></span>
          <span class="tw-dur">${s.durText}</span>
        </button>`;
      }).join("")}
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const critBtn = host.querySelector(".tw-crit-btn");
      const subEl = host.querySelector(".tw-sub");
      const rowsWrap = host.querySelector(".tw-rows");
      const guidesEl = host.querySelector(".tw-guides");
      const c0 = host.querySelector(".tw-c0");
      const c1 = host.querySelector(".tw-c1");
      const rowEls = [...rowsWrap.querySelectorAll(".tw-row")];
      const srEl = host.querySelector("[aria-live]");

      const frame = ctx.brackets(rowsWrap, { padX: 6, padY: 1, exactPad: true });
      let criticalOnly = false;
      let pinnedIdx = -1;
      let hoverIdx = -1;

      function activeIdx() {
        return hoverIdx >= 0 ? hoverIdx : pinnedIdx;
      }

      function syncState(opts) {
        const o = opts || {};
        const cur = activeIdx();
        const hasInspect = cur >= 0;
        const span = hasInspect ? SPANS[cur] : null;

        critBtn.setAttribute("aria-checked", criticalOnly ? "true" : "false");

        rowEls.forEach((row, i) => {
          const s = SPANS[i];
          let dim = false;
          if (hasInspect) dim = i !== cur;
          else if (criticalOnly) dim = !s.critical;
          row.classList.toggle("is-dim", dim);
          row.setAttribute("aria-selected", i === pinnedIdx ? "true" : "false");
          row.tabIndex = (pinnedIdx >= 0 ? i === pinnedIdx : i === 0) ? 0 : -1;
        });

        if (hasInspect) {
          frame.moveTo(rowEls[cur], { immediate: !!o.immediate });
          c0.style.left = `${((span.start / MAX_S) * 100).toFixed(3)}%`;
          c1.style.left = `${(((span.start + span.dur) / MAX_S) * 100).toFixed(3)}%`;
          guidesEl.classList.add("has-cursor");
        } else {
          frame.pare();
          guidesEl.classList.remove("has-cursor");
        }

        const nextSub = hasInspect ? span.detail : criticalOnly ? CRIT_SUMMARY : REST_SUMMARY;
        subEl.classList.toggle("is-ink", hasInspect || criticalOnly);
        if (o.immediate) subEl.textContent = nextSub;
        else ctx.swapText(subEl, nextSub);
        if (o.announce) srEl.textContent = nextSub;
      }

      critBtn.addEventListener("click", () => {
        criticalOnly = !criticalOnly;
        pinnedIdx = -1;
        hoverIdx = -1;
        syncState({ immediate: false, announce: true });
      }, { signal: ctx.signal });

      rowEls.forEach((row, i) => {
        row.addEventListener("pointerenter", () => {
          hoverIdx = i;
          syncState({ immediate: false });
        }, { signal: ctx.signal });
        row.addEventListener("pointerleave", () => {
          if (hoverIdx === i) {
            hoverIdx = -1;
            syncState({ immediate: false });
          }
        }, { signal: ctx.signal });
        row.addEventListener("focus", () => {
          hoverIdx = i;
          syncState({ immediate: false });
        }, { signal: ctx.signal });
        row.addEventListener("blur", () => {
          if (hoverIdx === i) {
            hoverIdx = -1;
            syncState({ immediate: false });
          }
        }, { signal: ctx.signal });
        row.addEventListener("click", () => {
          pinnedIdx = pinnedIdx === i ? -1 : i;
          hoverIdx = -1;
          syncState({ immediate: false, announce: true });
        }, { signal: ctx.signal });
      });

      rowsWrap.addEventListener("keydown", (e) => {
        const keys = ["ArrowDown", "ArrowUp", "Home", "End", "Escape"];
        if (!keys.includes(e.key)) return;
        e.preventDefault();
        if (e.key === "Escape") {
          pinnedIdx = -1;
          hoverIdx = -1;
          syncState({ immediate: false });
          return;
        }
        const cur = activeIdx() >= 0 ? activeIdx() : 0;
        let next = cur;
        if (e.key === "ArrowDown") next = (cur + 1) % SPANS.length;
        else if (e.key === "ArrowUp") next = (cur - 1 + SPANS.length) % SPANS.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = SPANS.length - 1;
        pinnedIdx = next;
        hoverIdx = next;
        syncState({ immediate: false, announce: true });
        rowEls[next].focus();
      }, { signal: ctx.signal });

      window.addEventListener("plainfacechange", () => requestAnimationFrame(() => frame.refresh()), { signal: ctx.signal });
      syncState({ immediate: true });
    },
  });
})();
