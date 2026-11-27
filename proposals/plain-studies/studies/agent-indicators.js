/* Live Status Line, redesigned in Plain (Subtraction): one standing verb + muted detail line over four review phases.
   As each phase finishes, it steps back to 0.4 opacity while corner hairlines glide forward; when Verify finishes,
   the entire phase strip pares away into one calm summary receipt. */
(function () {
  const PHASES = [
    { key: "read", label: "Read", verb: "Reading", detail: " PR #184 \u00b7 3 files" },
    { key: "search", label: "Search", verb: "Tracing", detail: " auth callers \u00b7 6 refs" },
    { key: "edit", label: "Edit", verb: "Drafting", detail: " note on token TTL" },
    { key: "verify", label: "Verify", verb: "Checking", detail: " verify.ts \u00b7 3 rules" },
  ];

  PlainPlayer.register({
    slug: "agent-indicators",
    title: "Live Status Line",
    tagline: "One live verb line; finished phases step back.",
    css: `
.ps-agent-indicators .ai { --t-fig: 22px; width: min(100%, 420px); display: grid; gap: 18px }
.ps-agent-indicators .ai-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-agent-indicators .ai-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-agent-indicators .ai-state { font-size: 13.5px; font-weight: 500; color: var(--ink); transition: color var(--dur-instant) var(--ease-out) }
.ps-agent-indicators .ai-state.is-done { color: var(--muted); font-weight: 400 }
.ps-agent-indicators .ai-line { margin: 0; font-size: var(--t-fig); line-height: 1.25; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; min-height: 28px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ps-agent-indicators .ai-verb { color: var(--ink); font-weight: 500 }
.ps-agent-indicators .ai-detail { color: var(--muted); font-weight: 400 }
.ps-agent-indicators .ai-bottom { padding-top: 10px; border-top: 1px solid var(--line) }
.ps-agent-indicators .ai-bar { display: flex; align-items: center }
.ps-agent-indicators .ai-phases { position: relative; display: inline-flex; align-items: center; gap: 22px; padding: 2px 9px }
.ps-agent-indicators .ai-phases .q { min-height: 24px }
.ps-agent-indicators .ai-phases .q[aria-checked="false"] { opacity: 0.38; color: var(--ink) }
.ps-agent-indicators .ai-phases .q[aria-checked="false"]:hover:not(:disabled) { opacity: 0.85 }
.ps-agent-indicators .ai-summary-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; padding-right: 10px }
.ps-agent-indicators .ai-summary { font-size: 13.5px; color: var(--muted) }
.ps-agent-indicators .ai-again { min-height: 30px }
.ps-agent-indicators.is-tile .ai { --t-fig: 19px; width: 100%; gap: 18px }
.ps-agent-indicators.is-tile .ai-line { min-height: 24px }
@container (max-width: 310px) {
  .ps-agent-indicators .ai { --t-fig: 18px }
  .ps-agent-indicators.is-tile .ai { --t-fig: 17px }
  .ps-agent-indicators .ai-phases { gap: 20px }
}
@container (max-width: 260px) {
  .ps-agent-indicators .ai, .ps-agent-indicators.is-tile .ai { --t-fig: 16px }
  .ps-agent-indicators .ai-phases { gap: 18px }
}
`,
    mount(host, ctx) {
      let curIdx = 3;
      let completed = false;
      let runTimers = [];

      host.innerHTML = `
<div class="ai">
  <div class="ai-head">
    <h3>PR #184 review agent</h3>
    <span class="ai-state">Working</span>
  </div>
  <p class="ai-line"><span class="ai-verb">Checking</span><span class="ai-detail"> verify.ts \u00b7 3 rules</span></p>
  <div class="ai-bottom">
    <div class="ai-bar">
      <div class="ai-phases" role="radiogroup" aria-label="Review phases">
        ${PHASES.map((p) => `<button type="button" class="q in-frame" role="radio" data-key="${p.key}" aria-checked="false" tabindex="-1">${p.label}</button>`).join("")}
      </div>
    </div>
    <div class="ai-summary-row" hidden>
      <span class="ai-summary">Reviewed 3 files \u00b7 0 issues found</span>
      <button type="button" class="q is-main ai-again">Run again</button>
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const stateEl = host.querySelector(".ai-state");
      const lineEl = host.querySelector(".ai-line");
      const verbEl = host.querySelector(".ai-verb");
      const detailEl = host.querySelector(".ai-detail");
      const barEl = host.querySelector(".ai-bar");
      const phasesEl = host.querySelector(".ai-phases");
      const phaseBtns = [...phasesEl.querySelectorAll('[role="radio"]')];
      const summaryRow = host.querySelector(".ai-summary-row");
      const againBtn = host.querySelector(".ai-again");
      const sr = host.querySelector("[aria-live]");
      const phaseFrame = ctx.brackets(phasesEl, { padX: 9, padY: 2, exactPad: true });

      function clearSequence() {
        runTimers.forEach(clearTimeout);
        runTimers = [];
      }

      function swapStatusLine(verb, detail, immediate) {
        if (immediate || ctx.reduced() || !lineEl.animate) {
          verbEl.textContent = verb;
          detailEl.textContent = detail;
          return;
        }
        if (lineEl._pmSwap) { try { lineEl._pmSwap.cancel(); } catch (e) {} }
        const out = lineEl.animate([{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-3px)" }], { duration: 85, easing: PlainPlayer.EASE_OUT });
        lineEl._pmSwap = out;
        out.onfinish = () => {
          if (ctx.signal.aborted) return;
          verbEl.textContent = verb;
          detailEl.textContent = detail;
          lineEl._pmSwap = lineEl.animate([{ opacity: 0, transform: "translateY(3px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 135, easing: PlainPlayer.EASE_OUT });
        };
      }

      function setPhase(idx, immediate, byUser) {
        curIdx = idx;
        const wasDone = completed;
        completed = false;
        if (wasDone) {
          summaryRow.hidden = true;
          if (barEl.getAnimations) barEl.getAnimations().forEach((a) => a.cancel());
          barEl.hidden = false;
          barEl.style.opacity = "";
          barEl.style.transform = "";
          barEl.style.pointerEvents = "";
          stateEl.classList.remove("is-done");
          ctx.swapText(stateEl, "Working");
        }
        const p = PHASES[idx];
        swapStatusLine(p.verb, p.detail, immediate);
        phaseBtns.forEach((btn, i) => {
          const active = i === idx;
          btn.dataset.done = i < idx ? "1" : "0";
          btn.setAttribute("aria-checked", active ? "true" : "false");
          btn.tabIndex = active ? 0 : -1;
        });
        phaseFrame.moveTo(phaseBtns[idx], { immediate: immediate || wasDone });
        if (byUser) sr.textContent = `Phase ${idx + 1} of 4, ${p.label}: ${p.verb}${p.detail}`;
      }

      function finishRun(byUser) {
        if (completed) return;
        completed = true;
        phaseFrame.pare();
        stateEl.classList.add("is-done");
        ctx.swapText(stateEl, "Done");
        swapStatusLine("Passed", " verify.ts \u00b7 3 rules", false);
        ctx.pareOut(barEl, () => {
          if (!completed) return;
          barEl.hidden = true;
          summaryRow.hidden = false;
          if (byUser) {
            sr.textContent = "Done. Reviewed 3 files, 0 issues found.";
            againBtn.focus({ preventScroll: true });
          }
        });
      }

      phaseBtns.forEach((btn, i) => {
        btn.addEventListener("click", () => {
          clearSequence();
          setPhase(i, false, true);
        }, { signal: ctx.signal });
      });

      phasesEl.addEventListener("keydown", (e) => {
        let next = curIdx;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (curIdx + 1) % PHASES.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (curIdx + PHASES.length - 1) % PHASES.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = PHASES.length - 1;
        else return;
        e.preventDefault();
        clearSequence();
        phaseBtns[next].focus({ preventScroll: true });
        setPhase(next, false, true);
      }, { signal: ctx.signal });

      againBtn.addEventListener("click", () => {
        clearSequence();
        setPhase(0, false, true);
        phaseBtns[0].focus({ preventScroll: true });
        const step = (i) => {
          const t = ctx.after(950, () => {
            if (i < PHASES.length) {
              setPhase(i, false, false);
              step(i + 1);
            } else {
              finishRun(false);
              sr.textContent = "Review complete. Reviewed 3 files, 0 issues found.";
            }
          });
          runTimers.push(t);
        };
        step(1);
      }, { signal: ctx.signal });

      ctx.onHand(clearSequence);

      setPhase(3, true, false);

      function cycle() {
        ctx.demoAfter(2100, () => {
          finishRun(false);
          ctx.demoAfter(2600, () => {
            setPhase(0, false, false);
            ctx.demoAfter(1450, () => {
              setPhase(1, false, false);
              ctx.demoAfter(1450, () => {
                setPhase(2, false, false);
                ctx.demoAfter(1450, () => {
                  setPhase(3, false, false);
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
