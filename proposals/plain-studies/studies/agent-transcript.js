/* Checkpoint Ledger, redesigned in Plain (Subtraction): an agent run's steps as a compact ledger with one gliding
   4-corner filter frame. Rolling back to any checkpoint pares every later step off the page and leaves one receipt line. */
(function () {
  const STEPS = [
    { num: "01", verb: "Read", target: "session.ts", status: "Applied" },
    { num: "02", verb: "Edit", target: "verify.ts", status: "Applied" },
    { num: "03", verb: "Run", target: "vitest", status: "Applied" },
    { num: "04", verb: "Push", target: "origin/fix", status: "Waiting" },
  ];
  const FILTERS = ["All", "Applied", "Waiting"];

  PlainPlayer.register({
    slug: "agent-transcript",
    title: "Checkpoint Ledger",
    tagline: "Roll back to any step; later steps pare away.",
    css: `
.ps-agent-transcript .at { width: min(100%, 440px); display: grid }
.ps-agent-transcript .at-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 12px;
  padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-agent-transcript .at-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-agent-transcript .at-filters { position: relative; display: inline-flex; align-items: center; gap: 20px; padding: 2px 9px }
.ps-agent-transcript .at-filter { min-height: 22px; font-size: 13px; line-height: 1.4 }
.ps-agent-transcript .at-list { display: grid }
.ps-agent-transcript .at-row { position: relative; display: grid; grid-template-columns: 24px 42px minmax(0, 1fr) auto; align-items: center; gap: 10px;
  padding: 9px 0; border-bottom: 1px solid var(--line); font-size: 14px; line-height: 1.4 }
.ps-agent-transcript .at-num { font-size: 12.5px; color: var(--muted) }
.ps-agent-transcript .at-verb { font-weight: 500 }
.ps-agent-transcript .at-target { font-family: var(--mono); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-agent-transcript .at-tail { position: relative; display: inline-flex; align-items: center; justify-content: flex-end; padding-right: 10px; white-space: nowrap }
.ps-agent-transcript .at-state { font-size: 13px; color: var(--muted); transition: opacity var(--dur-instant) var(--ease-out) }
.ps-agent-transcript .at-row[data-status="Waiting"] .at-state { color: var(--ink); font-weight: 500 }
.ps-agent-transcript .at-rb, .ps-agent-transcript .at-restore { min-height: 24px; font-size: 13px }
.ps-agent-transcript .at-row.is-featured .at-state { display: none }
.ps-agent-transcript .at-row:not(.is-featured) .at-rb { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); opacity: 0; pointer-events: none }
.ps-agent-transcript .at-row:not(.is-featured):hover .at-rb,
.ps-agent-transcript .at-row:not(.is-featured):focus-within .at-rb { opacity: 1; pointer-events: auto }
.ps-agent-transcript .at-row:not(.is-featured):hover .at-state,
.ps-agent-transcript .at-row:not(.is-featured):focus-within .at-state { opacity: 0 }
.ps-agent-transcript .at-empty { padding: 14px 0; border-bottom: 1px solid var(--line); font-size: 13.5px; color: var(--muted) }
.ps-agent-transcript .at-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; padding: 10px 10px 0 0; font-size: 13px; line-height: 1.4 }
.ps-agent-transcript.is-tile .at { width: 100% }
.ps-agent-transcript.is-tile .at-head { padding-bottom: 8px }
.ps-agent-transcript.is-tile .at-row { grid-template-columns: 22px 40px minmax(0, 1fr) auto; gap: 8px; padding: 8px 0; font-size: 13.5px }
.ps-agent-transcript.is-tile .at-foot { padding-top: 8px }
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="at">
  <div class="at-head">
    <h3>Session fix</h3>
    <div class="at-filters" role="radiogroup" aria-label="Filter checkpoints">
      ${FILTERS.map((f, i) => `<button type="button" class="q in-frame at-filter" role="radio" aria-checked="${i === 0 ? "true" : "false"}" tabindex="${i === 0 ? "0" : "-1"}" data-filter="${f}">${f}</button>`).join("")}
    </div>
  </div>
  <div class="at-list"></div>
  <div class="at-foot" hidden>
    <span class="at-summary muted"></span>
    <button type="button" class="q is-ink at-restore">Restore 4 steps</button>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const filterWrap = host.querySelector(".at-filters");
      const filterBtns = [...filterWrap.querySelectorAll(".at-filter")];
      const listEl = host.querySelector(".at-list");
      const footEl = host.querySelector(".at-foot");
      const summaryEl = host.querySelector(".at-summary");
      const restoreBtn = host.querySelector(".at-restore");
      const sr = host.querySelector("[aria-live]");

      const filterFrame = ctx.brackets(filterWrap, { padX: 9, padY: 2, exactPad: true });
      let curFilter = "All";
      let keepCount = STEPS.length;
      let busy = false;

      function visibleSteps() {
        return STEPS.slice(0, keepCount).filter((s) => curFilter === "All" || s.status === curFilter);
      }

      const rowEls = STEPS.map((step, idx) => {
        const row = document.createElement("div");
        row.className = "at-row";
        row.dataset.num = step.num;
        row.dataset.idx = String(idx);
        row.dataset.status = step.status;
        row.innerHTML = `
          <span class="at-num">${step.num}</span>
          <span class="at-verb">${step.verb}</span>
          <span class="at-target">${step.target}</span>
          <span class="at-tail">
            <span class="at-state">${step.status}</span>
            <button type="button" class="q is-ink at-rb" data-rb="${idx}" aria-label="Roll back to step ${step.num} ${step.verb} ${step.target}">Rollback</button>
          </span>`;
        row.querySelector(".at-rb").addEventListener("click", () => rollbackTo(idx, true), { signal: ctx.signal });
        listEl.appendChild(row);
        return row;
      });
      const emptyEl = document.createElement("div");
      emptyEl.className = "at-empty";
      emptyEl.hidden = true;
      listEl.appendChild(emptyEl);

      function renderList() {
        const vis = visibleSteps();
        const visSet = new Set(vis);
        STEPS.forEach((step, idx) => {
          const row = rowEls[idx];
          const shown = visSet.has(step);
          const canRollback = idx < keepCount - 1;
          const featured = canRollback && step.num === "02" && keepCount === STEPS.length;
          row.hidden = !shown;
          row.style.pointerEvents = "";
          if (row.getAnimations) row.getAnimations().forEach((a) => a.cancel());
          row.classList.toggle("is-featured", featured);
          row.querySelector(".at-rb").hidden = !canRollback;
        });
        if (!vis.length) {
          emptyEl.hidden = false;
          emptyEl.textContent = keepCount < STEPS.length
            ? `No ${curFilter.toLowerCase()} steps after rewind to ${STEPS[keepCount - 1].num}`
            : `No ${curFilter.toLowerCase()} steps`;
        } else {
          emptyEl.hidden = true;
        }
      }

      function syncFoot(immediate) {
        if (keepCount < STEPS.length) {
          const undone = STEPS.length - keepCount;
          const targetNum = STEPS[keepCount - 1].num;
          const text = `Rewound to ${targetNum} · ${undone} ${undone === 1 ? "step" : "steps"} undone`;
          footEl.hidden = false;
          if (immediate) summaryEl.textContent = text;
          else ctx.swapText(summaryEl, text);
        } else {
          footEl.hidden = true;
        }
      }

      function setFilter(next, immediate, byUser) {
        if (curFilter === next && !immediate) return;
        curFilter = next;
        for (const b of filterBtns) {
          const on = b.dataset.filter === next;
          b.setAttribute("aria-checked", on ? "true" : "false");
          b.tabIndex = on ? 0 : -1;
          if (on) filterFrame.moveTo(b, { immediate });
        }
        if (immediate) {
          renderList();
        } else {
          ctx.flip(host.querySelector(".at"), () => {
            ctx.flip(listEl, () => {
              renderList();
            });
          });
        }
        if (byUser) {
          const n = visibleSteps().length;
          sr.textContent = `${next}, ${n} ${n === 1 ? "step" : "steps"} shown`;
        }
      }

      function rollbackTo(stepIdx, byUser) {
        const nextKeep = stepIdx + 1;
        if (busy || nextKeep >= keepCount) return;
        const rowsAfter = rowEls.filter((r, idx) => !r.hidden && idx > stepIdx);
        keepCount = nextKeep;

        const finish = () => {
          busy = false;
          renderList();
          syncFoot(false);
          if (byUser) {
            const undone = STEPS.length - keepCount;
            sr.textContent = `Rewound to ${STEPS[stepIdx].num}, ${undone} ${undone === 1 ? "step" : "steps"} undone.`;
            restoreBtn.focus({ preventScroll: true });
          }
        };

        if (!rowsAfter.length || ctx.reduced()) {
          ctx.flip(host.querySelector(".at"), finish);
          return;
        }

        busy = true;
        for (const extra of rowsAfter.slice(1)) {
          extra.style.pointerEvents = "none";
          if (extra.animate) {
            extra.animate([{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: "translateX(-6px)" }], {
              duration: 140,
              easing: PlainPlayer.EASE_OUT,
              fill: "forwards",
            });
          }
        }
        ctx.pareOut(rowsAfter[0], () => {
          ctx.flip(host.querySelector(".at"), finish);
        });
      }

      function restoreAll(byUser) {
        if (busy || keepCount === STEPS.length) return;
        keepCount = STEPS.length;
        ctx.flip(host.querySelector(".at"), () => {
          if (curFilter !== "All" && !visibleSteps().length) {
            setFilter("All", true, false);
          } else {
            renderList();
          }
          syncFoot(false);
        });
        if (byUser) {
          sr.textContent = "Restored all 4 steps.";
          const rb02 = listEl.querySelector('[data-rb="1"]');
          if (rb02) rb02.focus({ preventScroll: true });
        }
      }

      for (const btn of filterBtns) {
        btn.addEventListener("click", () => setFilter(btn.dataset.filter, false, true), { signal: ctx.signal });
      }
      filterWrap.addEventListener("keydown", (e) => {
        const i = filterBtns.findIndex((b) => b.dataset.filter === curFilter);
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % filterBtns.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + filterBtns.length) % filterBtns.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = filterBtns.length - 1;
        if (next >= 0) {
          e.preventDefault();
          filterBtns[next].focus({ preventScroll: true });
          setFilter(filterBtns[next].dataset.filter, false, true);
        }
      }, { signal: ctx.signal });

      restoreBtn.addEventListener("click", () => restoreAll(true), { signal: ctx.signal });

      setFilter("All", true, false);
      syncFoot(true);

      function cycle() {
        ctx.demoAfter(2300, () => {
          rollbackTo(1, false);
          ctx.demoAfter(2700, () => {
            restoreAll(false);
            cycle();
          });
        });
      }
      cycle();
    },
  });
})();
