/* Verification Funnel, in Plain (Subtraction): "Autonomous patch funnel" (56.7 % merged) across five verification
   gates with boxless 5px-tall --ink translateX bars and quiet 12px subtracted drop-off notes between stages.
   Pointing at or focusing any stage dims the other four to 0.22 and highlights its gate drop-off. */
(function () {
  const BASE = 120;
  const STAGES = [
    {
      name: "Generated",
      count: 120,
      stat: "120",
      drop: null,
      readout: "120 candidate patches entered verification · 100 % baseline",
    },
    {
      name: "Compiled",
      count: 108,
      stat: "108 · 90 %",
      drop: "−12 failed typecheck",
      readout: "108 of 120 compiled (90.0 %) · −12 failed typecheck (−10.0 %)",
    },
    {
      name: "Tests green",
      count: 86,
      stat: "86 · 72 %",
      drop: "−22 failed vitest",
      readout: "86 of 120 passed tests (71.7 %) · −22 failed vitest (−20.4 % of compiled)",
    },
    {
      name: "Zero regressions",
      count: 74,
      stat: "74 · 62 %",
      drop: "−12 failed review",
      readout: "74 of 120 regression-free (61.7 %) · −12 failed review (−14.0 % of green)",
    },
    {
      name: "Merged",
      count: 68,
      stat: "68 · 57 %",
      drop: "−6 awaiting merge",
      readout: "68 of 120 merged (56.7 %) · −6 awaiting merge (−8.1 % of approved)",
    },
  ];

  const DEFAULT_READOUT = "68 of 120 patches merged · −52 subtracted across 4 gates";

  PlainPlayer.registerData({
    slug: "verification-funnel",
    chapter: "diagrams",
    span: "half",
    title: "Verification Funnel",
    css: `
.dd-verification-funnel .vf { display: grid; gap: 14px; min-width: 0 }
.dd-verification-funnel .vf-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 16px }
.dd-verification-funnel .vf-fig { font-size: 22px; line-height: 1.1; white-space: nowrap }
.dd-verification-funnel .vf-sub { margin: 2px 0 0; font-size: 13px; line-height: 1.4; color: var(--muted);
  overflow-wrap: anywhere; transition: color var(--dur-instant) var(--ease-out) }
.dd-verification-funnel .vf-sub.is-ink { color: var(--ink) }
.dd-verification-funnel .vf-list { position: relative; display: grid; padding: 2px 8px }
.dd-verification-funnel .vf-drop { display: flex; align-items: center; justify-content: flex-end; gap: 6px;
  padding: 2px 0 1px; font-size: 12px; line-height: 1.25; color: var(--muted); font-variant-numeric: tabular-nums;
  transition: opacity var(--dur-pare) var(--ease-out), color var(--dur-instant) var(--ease-out) }
.dd-verification-funnel .vf-drop.is-dim { opacity: 0.22 }
.dd-verification-funnel .vf-drop.is-lit { color: var(--ink); font-weight: 500; opacity: 1 }
.dd-verification-funnel .vf-stage { appearance: none; border: 0; border-radius: 0; background: transparent; margin: 0;
  display: grid; gap: 6px; width: 100%; padding: 6px 0; text-align: left; cursor: pointer; color: var(--ink);
  -webkit-tap-highlight-color: transparent; transition: opacity var(--dur-pare) var(--ease-out) }
.dd-verification-funnel .vf-stage.is-dim { opacity: 0.22 }
.dd-verification-funnel .vf-stage:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px }
.dd-verification-funnel .vf-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 12px }
.dd-verification-funnel .vf-name { font-size: 14px; font-weight: 500; line-height: 1.3; color: var(--ink) }
.dd-verification-funnel .vf-stat { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap;
  transition: color var(--dur-instant) var(--ease-out) }
.dd-verification-funnel .vf-stage.is-lit .vf-stat { color: var(--ink); font-weight: 500 }
.dd-verification-funnel .vf-track { display: block; width: 100%; height: 5px }
.dd-verification-funnel .vf-track > .bar-fill { display: block }
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="vf">
  <header class="vf-head">
    <div class="dd-card-title">
      <h3>Autonomous patch funnel</h3>
      <p class="vf-sub">${DEFAULT_READOUT}</p>
    </div>
    <span class="fig vf-fig">56.7 % merged</span>
  </header>
  <div class="vf-list" role="listbox" aria-label="Verification funnel stages">
    ${STAGES.map((s, i) => {
      const p = (s.count / BASE).toFixed(4);
      const dropHtml = s.drop ? `<div class="vf-drop" data-for="${i}" aria-hidden="true">${s.drop}</div>` : "";
      return `
      ${dropHtml}
      <button type="button" class="vf-stage" role="option" aria-selected="false" data-idx="${i}">
        <span class="vf-meta">
          <span class="vf-name">${s.name}</span>
          <span class="vf-stat">${s.stat}</span>
        </span>
        <span class="bar-track vf-track" aria-hidden="true">
          <span class="bar-fill" style="--p: ${p}"></span>
        </span>
      </button>`;
    }).join("")}
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const listEl = host.querySelector(".vf-list");
      const subEl = host.querySelector(".vf-sub");
      const srEl = host.querySelector("[aria-live]");
      const stageEls = [...listEl.querySelectorAll(".vf-stage")];
      const dropMap = new Map();
      listEl.querySelectorAll(".vf-drop").forEach((el) => dropMap.set(Number(el.dataset.for), el));

      const frame = ctx.brackets(listEl, { padX: 6, padY: 1, exactPad: true });
      let pinnedIdx = -1;
      let hoverIdx = -1;

      function activeIdx() {
        return hoverIdx >= 0 ? hoverIdx : pinnedIdx;
      }

      function syncState(opts) {
        const o = opts || {};
        const cur = activeIdx();
        const hasActive = cur >= 0;

        stageEls.forEach((el, i) => {
          const on = i === cur;
          el.classList.toggle("is-lit", on);
          el.classList.toggle("is-dim", hasActive && !on);
          el.setAttribute("aria-selected", i === pinnedIdx ? "true" : "false");
          el.tabIndex = (pinnedIdx >= 0 ? i === pinnedIdx : i === 0) ? 0 : -1;
        });

        dropMap.forEach((dropEl, forIdx) => {
          const isPriorGate = hasActive && forIdx === cur;
          dropEl.classList.toggle("is-lit", isPriorGate);
          dropEl.classList.toggle("is-dim", hasActive && !isPriorGate);
        });

        if (hasActive) {
          frame.moveTo(stageEls[cur], { immediate: !!o.immediate });
        } else {
          frame.pare();
        }

        const nextSub = hasActive ? STAGES[cur].readout : DEFAULT_READOUT;
        subEl.classList.toggle("is-ink", hasActive);
        if (o.immediate) subEl.textContent = nextSub;
        else ctx.swapText(subEl, nextSub);
        if (o.announce && hasActive) srEl.textContent = STAGES[cur].readout;
      }

      stageEls.forEach((el, i) => {
        el.addEventListener("pointerenter", () => {
          hoverIdx = i;
          syncState({ immediate: false });
        }, { signal: ctx.signal });
        el.addEventListener("pointerleave", () => {
          if (hoverIdx === i) {
            hoverIdx = -1;
            syncState({ immediate: false });
          }
        }, { signal: ctx.signal });
        el.addEventListener("focus", () => {
          hoverIdx = i;
          syncState({ immediate: false });
        }, { signal: ctx.signal });
        el.addEventListener("blur", () => {
          if (hoverIdx === i) {
            hoverIdx = -1;
            syncState({ immediate: false });
          }
        }, { signal: ctx.signal });
        el.addEventListener("click", () => {
          pinnedIdx = pinnedIdx === i ? -1 : i;
          hoverIdx = -1;
          syncState({ immediate: false, announce: pinnedIdx >= 0 });
        }, { signal: ctx.signal });
      });

      listEl.addEventListener("keydown", (e) => {
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
        if (e.key === "ArrowDown") next = (cur + 1) % STAGES.length;
        else if (e.key === "ArrowUp") next = (cur - 1 + STAGES.length) % STAGES.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = STAGES.length - 1;
        pinnedIdx = next;
        hoverIdx = next;
        syncState({ immediate: false, announce: true });
        stageEls[next].focus();
      }, { signal: ctx.signal });

      window.addEventListener("plainfacechange", () => requestAnimationFrame(() => frame.refresh()), { signal: ctx.signal });
      syncState({ immediate: true });
    },
  });
})();
