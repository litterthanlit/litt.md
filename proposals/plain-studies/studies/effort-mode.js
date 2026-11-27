/* Effort & Depth, redesigned in Plain (Subtraction): pick Fast, Balanced or Deep; four corner hairlines glide across
   the effort strip, the thinking-token ceiling updates, and unused reasoning phases pare away so the dispatch line
   closes the gap. */
(function () {
  const MODES = [
    {
      key: "fast",
      label: "Fast",
      budget: "0 thinking tok",
      meta: "~2 s · $0.01 est.",
      steps: [
        { num: "01", name: "Direct edit", detail: "Single pass on verify.ts" },
      ],
    },
    {
      key: "balanced",
      label: "Balanced",
      budget: "8k thinking tok",
      meta: "~9 s · $0.06 est.",
      steps: [
        { num: "01", name: "Plan", detail: "Map session call sites" },
        { num: "02", name: "Edit & test", detail: "Run vitest on touched files" },
      ],
    },
    {
      key: "deep",
      label: "Deep",
      budget: "32k thinking tok",
      meta: "~28 s · $0.24 est.",
      steps: [
        { num: "01", name: "Plan", detail: "Check cross-file invariants" },
        { num: "02", name: "Multi-file edit", detail: "Update auth & session callers" },
        { num: "03", name: "Self-critique & test", detail: "Full suite + edge cases" },
      ],
    },
  ];
  let uid = 0;

  PlainPlayer.register({
    slug: "effort-mode",
    title: "Effort & Depth",
    tagline: "Pick effort depth; unused reasoning steps subtract.",
    css: `
.ps-effort-mode .em { width: min(100%, 400px); display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px }
.ps-effort-mode .em-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--line); min-width: 0 }
.ps-effort-mode .em-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em; white-space: nowrap }
.ps-effort-mode .em-target { font-family: var(--mono); font-size: 12.5px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0 }
.ps-effort-mode .em-modes { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 22px; padding: 2px 9px }
.ps-effort-mode .em-modes .q { min-height: 24px }
.ps-effort-mode .em-modes .q[aria-checked="true"] { font-weight: 500; color: var(--ink) }
.ps-effort-mode .em-body { display: grid; grid-template-columns: minmax(0, 1fr) }
.ps-effort-mode .em-readout { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; padding: 2px 0 10px; border-bottom: 1px solid var(--line); min-width: 0 }
.ps-effort-mode .em-meta { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums }
.ps-effort-mode .em-flow { display: grid; grid-template-columns: minmax(0, 1fr) }
.ps-effort-mode .em-step { display: grid; grid-template-columns: 24px auto minmax(0, 1fr); align-items: baseline; gap: 10px;
  padding: 9px 0; border-bottom: 1px solid var(--line); font-size: 14px; min-width: 0 }
.ps-effort-mode .em-num { font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums }
.ps-effort-mode .em-name { font-weight: 500; color: var(--ink); white-space: nowrap }
.ps-effort-mode .em-detail { font-size: 13px; color: var(--muted); text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0 }
.ps-effort-mode .em-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 10px 0 }
.ps-effort-mode.is-tile .em { width: 100%; gap: 8px }
.ps-effort-mode.is-tile .em-head { padding-bottom: 7px }
.ps-effort-mode.is-tile .em-foot .q { min-height: 28px }
.ps-effort-mode.is-tile .em-readout { padding: 0 0 8px }
.ps-effort-mode.is-tile .em-step { padding: 8px 0 }
.ps-effort-mode.is-tile .em-foot { padding-top: 6px }
`,
    mount(host, ctx) {
      const id = "ps-em-" + ++uid;
      host.innerHTML = `
<div class="em">
  <div class="em-head">
    <h3 id="${id}-lbl">Refactor session auth</h3>
    <span class="em-target">src/auth/verify.ts</span>
  </div>
  <div class="em-modes" role="radiogroup" aria-labelledby="${id}-lbl">
    ${MODES.map((m) => `<button type="button" class="q in-frame" role="radio" aria-checked="false" tabindex="-1" data-mode="${m.key}">${m.label}</button>`).join("")}
  </div>
  <div class="em-body">
    <div class="em-readout">
      <span class="fig em-fig"></span>
      <span class="em-meta"></span>
    </div>
    <div class="em-flow" data-focus-group>
      <div class="em-step" data-idx="0"><span class="em-num">01</span><span class="em-name"></span><span class="em-detail"></span></div>
      <div class="em-step" data-idx="1"><span class="em-num">02</span><span class="em-name"></span><span class="em-detail"></span></div>
      <div class="em-step" data-idx="2"><span class="em-num">03</span><span class="em-name"></span><span class="em-detail"></span></div>
      <div class="em-foot" data-active>
        <button type="button" class="q is-ink em-run">Dispatch run</button>
        <button type="button" class="q em-stop" hidden>Reset</button>
      </div>
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const modesEl = host.querySelector(".em-modes");
      const radios = [...modesEl.querySelectorAll('[role="radio"]')];
      const figEl = host.querySelector(".em-fig");
      const metaEl = host.querySelector(".em-meta");
      const flowEl = host.querySelector(".em-flow");
      const stepEls = [...flowEl.querySelectorAll(".em-step")];
      const runBtn = host.querySelector(".em-run");
      const stopBtn = host.querySelector(".em-stop");
      const sr = host.querySelector("[aria-live]");
      const frame = ctx.brackets(modesEl, { padX: 9, padY: 2, exactPad: true });

      let curIdx = 1;
      let dispatched = false;
      let animSeq = 0;
      let pendingAnims = [];

      function clearPending() {
        for (const a of pendingAnims) {
          try { a.cancel(); } catch (e) {}
        }
        pendingAnims = [];
        for (const s of stepEls) {
          s.style.opacity = "";
          s.style.transform = "";
          s.style.pointerEvents = "";
        }
      }

      function clearDispatch(immediate) {
        if (!dispatched) return;
        dispatched = false;
        flowEl.removeAttribute("data-focusing");
        stepEls[0].removeAttribute("data-active");
        const m = MODES[curIdx];
        stepEls[0].querySelector(".em-detail").textContent = m.steps[0].detail;
        stopBtn.hidden = true;
        runBtn.disabled = false;
        runBtn.classList.add("is-ink");
        if (immediate) runBtn.textContent = "Dispatch run";
        else ctx.swapText(runBtn, "Dispatch run");
      }

      function applyMode(idx, opts) {
        const o = Object.assign({ immediate: false, byUser: false, focusRadio: false }, opts);
        const prevCount = stepEls.filter((el) => !el.hidden).length;
        curIdx = idx;
        const m = MODES[idx];
        const seq = ++animSeq;
        clearPending();
        clearDispatch(o.immediate);

        radios.forEach((btn, i) => {
          const on = i === idx;
          btn.setAttribute("aria-checked", on ? "true" : "false");
          btn.tabIndex = on ? 0 : -1;
          if (on && o.focusRadio) btn.focus({ preventScroll: true });
        });
        frame.moveTo(radios[idx], { immediate: o.immediate });

        if (o.immediate) {
          figEl.textContent = m.budget;
          metaEl.textContent = m.meta;
          stepEls.forEach((el, i) => {
            const st = m.steps[i];
            el.hidden = !st;
            if (st) {
              el.querySelector(".em-name").textContent = st.name;
              el.querySelector(".em-detail").textContent = st.detail;
            }
          });
          return;
        }

        ctx.swapText(figEl, m.budget);
        ctx.swapText(metaEl, m.meta);

        const nextCount = m.steps.length;
        if (nextCount < prevCount && !ctx.reduced()) {
          for (let i = 0; i < nextCount; i++) {
            const st = m.steps[i];
            ctx.swapText(stepEls[i].querySelector(".em-name"), st.name);
            ctx.swapText(stepEls[i].querySelector(".em-detail"), st.detail);
          }
          const leaving = stepEls.slice(nextCount, prevCount);
          let done = 0;
          for (const el of leaving) {
            el.style.pointerEvents = "none";
            if (el.animate) {
              const a = el.animate(
                [{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: "translateX(-6px)" }],
                { duration: 140, easing: PlainPlayer.EASE_OUT, fill: "forwards" }
              );
              pendingAnims.push(a);
              a.onfinish = () => {
                done++;
                if (done === leaving.length && seq === animSeq && !ctx.signal.aborted) {
                  clearPending();
                  ctx.flip(flowEl, () => {
                    stepEls.forEach((s, i) => { s.hidden = i >= nextCount; });
                  });
                }
              };
            } else {
              el.hidden = true;
            }
          }
        } else {
          ctx.flip(flowEl, () => {
            stepEls.forEach((el, i) => {
              const st = m.steps[i];
              const wasHidden = el.hidden;
              el.hidden = !st;
              if (st) {
                if (wasHidden) {
                  el.querySelector(".em-name").textContent = st.name;
                  el.querySelector(".em-detail").textContent = st.detail;
                  if (!ctx.reduced() && el.animate) {
                    const a = el.animate(
                      [{ opacity: 0, transform: "translateX(-4px)" }, { opacity: 1, transform: "translateX(0)" }],
                      { duration: 160, easing: PlainPlayer.EASE_OUT }
                    );
                    pendingAnims.push(a);
                  }
                } else {
                  ctx.swapText(el.querySelector(".em-name"), st.name);
                  ctx.swapText(el.querySelector(".em-detail"), st.detail);
                }
              }
            });
          });
        }

        if (o.byUser) {
          sr.textContent = `${m.label}: ${m.budget}, ${m.steps.length} ${m.steps.length === 1 ? "phase" : "phases"}`;
        }
      }

      function dispatch(byUser) {
        if (dispatched) return;
        dispatched = true;
        stepEls[0].setAttribute("data-active", "");
        if (MODES[curIdx].steps.length > 1) flowEl.setAttribute("data-focusing", "");
        ctx.swapText(stepEls[0].querySelector(".em-detail"), "Running now");
        ctx.swapText(runBtn, "Dispatched · step 1");
        runBtn.disabled = true;
        runBtn.classList.remove("is-ink");
        stopBtn.hidden = false;
        if (byUser) {
          sr.textContent = `Dispatched ${MODES[curIdx].label} run, step 1 active`;
          stopBtn.focus({ preventScroll: true });
        }
      }

      radios.forEach((btn, i) => {
        btn.addEventListener("click", () => applyMode(i, { byUser: true }), { signal: ctx.signal });
      });

      modesEl.addEventListener("keydown", (e) => {
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (curIdx + 1) % MODES.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (curIdx - 1 + MODES.length) % MODES.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = MODES.length - 1;
        if (next >= 0) {
          e.preventDefault();
          applyMode(next, { byUser: true, focusRadio: true });
        }
      }, { signal: ctx.signal });

      runBtn.addEventListener("click", () => dispatch(true), { signal: ctx.signal });
      stopBtn.addEventListener("click", () => {
        clearDispatch(false);
        sr.textContent = "Run reset";
        runBtn.focus({ preventScroll: true });
      }, { signal: ctx.signal });

      applyMode(1, { immediate: true });

      function cycle() {
        ctx.demoAfter(2000, () => {
          applyMode(0);
          ctx.demoAfter(2200, () => {
            applyMode(2);
            ctx.demoAfter(2200, () => {
              dispatch(false);
              ctx.demoAfter(2200, () => {
                applyMode(1);
                cycle();
              });
            });
          });
        });
      }
      cycle();
    },
  });
})();
