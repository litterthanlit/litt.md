/* Agent Run, redesigned in Plain (Subtraction): four numbered tool steps run under a gliding 4-corner frame while
   uninvolved steps step back; once step 04 passes, the steps fold into a single receipt line above the report. */
(function () {
  const STEPS = [
    { num: "01", verb: "Read", target: "src/auth/session.ts", done: "148 lines", live: "Reading…" },
    { num: "02", verb: "Search", target: "guest() callers", done: "3 files", live: "Scanning…" },
    { num: "03", verb: "Edit", target: "src/auth/verify.ts", done: "+8 −3", live: "+8 −3" },
    { num: "04", verb: "Test", target: "auth/verify.test.ts", done: "14 passed", live: "Running…" },
  ];

  let uid = 0;

  PlainPlayer.register({
    slug: "agent-run",
    title: "Agent Run",
    tagline: "Four tool steps that fold once tests pass.",
    css: `
.ps-agent-run .ar { width: min(100%, 430px); display: grid }
.ps-agent-run .ar-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-agent-run .ar-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-agent-run .ar-status { font-size: var(--t-meta); color: var(--ink); font-weight: 500; white-space: nowrap }
.ps-agent-run .ar-status.is-done { color: var(--muted); font-weight: 400 }
.ps-agent-run .ar-body { display: grid; gap: 12px }
.ps-agent-run .ar-summary { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 16px; padding-top: 14px }
.ps-agent-run .ar-receipt { font-size: var(--t-meta); color: var(--ink); font-weight: 500 }
.ps-agent-run .ar-acts { display: inline-flex; align-items: center; gap: 22px; padding-right: 10px; font-size: var(--t-meta) }
.ps-agent-run .ar-list { position: relative; list-style: none; margin: 0; padding: 0; display: grid }
.ps-agent-run .ar-summary:not([hidden]) ~ .ar-list .ar-row:first-child { border-top: 1px solid var(--line) }
.ps-agent-run .ar-row { display: grid; grid-template-columns: 24px 54px minmax(0, 1fr) auto; align-items: baseline; gap: 10px;
  padding: 9px 8px; border-bottom: 1px solid var(--line); font-size: 14px }
.ps-agent-run .ar-list[data-focusing] > .ar-row:not([data-active]) { opacity: 0.38 }
.ps-agent-run .ar-list:not([data-focusing]) > .ar-row { opacity: 0.65 }
.ps-agent-run .ar-num { font-size: 12.5px; color: var(--muted) }
.ps-agent-run .ar-verb { font-weight: 500 }
.ps-agent-run .ar-target { font-family: var(--mono); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-agent-run .ar-meta { font-size: var(--t-meta); color: var(--muted); white-space: nowrap }
.ps-agent-run .ar-row[data-active] .ar-meta { color: var(--ink); font-weight: 500 }
.ps-agent-run .ar-report { margin: 0; font-size: 14px; line-height: 1.55; color: var(--ink) }
.ps-agent-run .ar-report .mono { font-size: 12.5px }
.ps-agent-run.is-tile .ar { width: 100% }
.ps-agent-run.is-tile .ar-row { padding: 8px 6px; font-size: 13.5px; grid-template-columns: 22px 50px minmax(0, 1fr) auto; gap: 8px }
.ps-agent-run.is-tile .ar-meta { font-size: 12.5px }
.ps-agent-run.is-tile .ar-report { font-size: 13.5px; line-height: 1.5 }
`,
    mount(host, ctx) {
      const listId = "ps-ar-list-" + ++uid;
      host.innerHTML = `
<div class="ar">
  <div class="ar-head">
    <h3>Fix expired cookie fallback</h3>
    <span class="ar-status">Step 3 of 4</span>
  </div>
  <div class="ar-body">
    <div class="ar-summary" hidden>
      <span class="ar-receipt">4 steps · +8 −3 · 2.6 s</span>
      <span class="ar-acts">
        <button type="button" class="q ar-toggle" aria-expanded="false" aria-controls="${listId}">Show steps</button>
        <button type="button" class="q ar-replay">Replay</button>
      </span>
    </div>
    <ol class="ar-list" id="${listId}" data-focus-group data-focusing>
      ${STEPS.map((s) => `<li class="ar-row"><span class="ar-num">${s.num}</span><span class="ar-verb">${s.verb}</span><span class="ar-target">${s.target}</span><span class="ar-meta">${s.done}</span></li>`).join("")}
    </ol>
    <p class="ar-report" hidden>Expired cookies now throw <span class="mono">TokenExpiredError</span> instead of falling back to <span class="mono">guest()</span>.</p>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const statusEl = host.querySelector(".ar-status");
      const bodyEl = host.querySelector(".ar-body");
      const summaryEl = host.querySelector(".ar-summary");
      const toggleBtn = host.querySelector(".ar-toggle");
      const replayBtn = host.querySelector(".ar-replay");
      const listEl = host.querySelector(".ar-list");
      const reportEl = host.querySelector(".ar-report");
      const sr = host.querySelector("[aria-live]");
      const rowEls = [...listEl.querySelectorAll(".ar-row")];
      const frame = ctx.brackets(listEl, { padX: 0, padY: -1, exactPad: true });

      let state = "running";
      let curStep = 2;
      let stepsShown = false;
      let busy = false;
      let runToken = 0;

      function restoreEl(el) {
        el.style.pointerEvents = "";
        if (el.getAnimations) el.getAnimations().forEach((a) => a.cancel());
        el.hidden = false;
      }

      function paintStep(idx, immediate) {
        curStep = idx;
        listEl.setAttribute("data-focusing", "");
        rowEls.forEach((row, i) => {
          const meta = row.querySelector(".ar-meta");
          if (i === idx) row.setAttribute("data-active", "");
          else row.removeAttribute("data-active");
          const nextMeta = i < idx ? STEPS[i].done : i === idx ? STEPS[i].live : "Queued";
          if (immediate) meta.textContent = nextMeta;
          else ctx.swapText(meta, nextMeta);
        });
        frame.moveTo(rowEls[idx], { immediate });
        const st = `Step ${idx + 1} of 4`;
        statusEl.classList.remove("is-done");
        if (immediate) statusEl.textContent = st;
        else ctx.swapText(statusEl, st);
      }

      function finishRun(byUser) {
        if (state === "done" || busy) return;
        state = "done";
        busy = true;
        stepsShown = false;
        runToken++;
        rowEls.forEach((row, i) => {
          row.removeAttribute("data-active");
          row.querySelector(".ar-meta").textContent = STEPS[i].done;
        });
        listEl.removeAttribute("data-focusing");
        frame.pare();
        statusEl.classList.add("is-done");
        ctx.swapText(statusEl, "Passed");

        ctx.pareOut(listEl, () => {
          busy = false;
          if (state !== "done") return;
          listEl.hidden = true;
          summaryEl.hidden = false;
          toggleBtn.setAttribute("aria-expanded", "false");
          toggleBtn.classList.remove("is-on");
          toggleBtn.textContent = "Show steps";
          restoreEl(reportEl);
          if (!ctx.reduced() && reportEl.animate) {
            reportEl.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 170, easing: PlainPlayer.EASE_OUT });
          }
          if (byUser) {
            sr.textContent = "Run passed. 4 steps folded into summary.";
            toggleBtn.focus({ preventScroll: true });
          }
        });
      }

      function toggleSteps() {
        if (state !== "done" || busy) return;
        stepsShown = !stepsShown;
        toggleBtn.setAttribute("aria-expanded", stepsShown ? "true" : "false");
        toggleBtn.classList.toggle("is-on", stepsShown);
        ctx.swapText(toggleBtn, stepsShown ? "Hide steps" : "Show steps");
        if (stepsShown) {
          ctx.flip(bodyEl, () => {
            restoreEl(listEl);
            listEl.removeAttribute("data-focusing");
            rowEls.forEach((row, i) => {
              row.removeAttribute("data-active");
              row.querySelector(".ar-meta").textContent = STEPS[i].done;
            });
          });
          if (!ctx.reduced() && listEl.animate) {
            listEl.animate([{ opacity: 0, transform: "translateY(-3px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 150, easing: PlainPlayer.EASE_OUT });
          }
          sr.textContent = "4 tool steps shown.";
        } else {
          ctx.pareOut(listEl, () => {
            if (!stepsShown && state === "done") listEl.hidden = true;
          });
          sr.textContent = "Tool steps hidden.";
        }
      }

      function replay(byUser) {
        if (busy) return;
        const myToken = ++runToken;
        state = "running";
        stepsShown = false;
        ctx.flip(bodyEl, () => {
          summaryEl.hidden = true;
          reportEl.hidden = true;
          restoreEl(listEl);
          paintStep(0, true);
        });
        if (byUser) sr.textContent = "Replaying 4 agent steps.";

        const wait = byUser ? ctx.after : ctx.demoAfter;
        wait(560, () => {
          if (runToken !== myToken || state !== "running") return;
          paintStep(1, false);
          wait(560, () => {
            if (runToken !== myToken || state !== "running") return;
            paintStep(2, false);
            wait(620, () => {
              if (runToken !== myToken || state !== "running") return;
              paintStep(3, false);
              ctx.after(320, () => {
                if (runToken !== myToken || state !== "running") return;
                ctx.swapText(rowEls[3].querySelector(".ar-meta"), STEPS[3].done);
              });
              wait(720, () => {
                if (runToken !== myToken || state !== "running") return;
                finishRun(byUser);
                if (!byUser) scheduleCycle();
              });
            });
          });
        });
      }

      toggleBtn.addEventListener("click", toggleSteps, { signal: ctx.signal });
      replayBtn.addEventListener("click", () => replay(true), { signal: ctx.signal });

      ctx.onHand(() => {
        if (state === "running") {
          const myToken = ++runToken;
          ctx.after(550, () => {
            if (runToken !== myToken || state !== "running") return;
            if (curStep < 3) {
              paintStep(3, false);
              ctx.after(650, () => {
                if (runToken === myToken && state === "running") finishRun(false);
              });
            } else {
              finishRun(false);
            }
          });
        }
      });

      function scheduleCycle() {
        ctx.demoAfter(2800, () => {
          replay(false);
        });
      }

      /* Initial mount rests mid-run with step 03 framed. */
      paintStep(2, true);
      if (!ctx.reduced()) {
        ctx.demoAfter(1500, () => {
          if (state !== "running") return;
          paintStep(3, false);
          ctx.demoAfter(350, () => {
            if (state !== "running") return;
            ctx.swapText(rowEls[3].querySelector(".ar-meta"), STEPS[3].done);
          });
          ctx.demoAfter(950, () => {
            finishRun(false);
            scheduleCycle();
          });
        });
      } else {
        /* Under reduced motion, allow clicking the framed list to advance/complete cleanly too. */
        listEl.style.cursor = "pointer";
        listEl.addEventListener("click", () => { if (state === "running") finishRun(true); }, { signal: ctx.signal });
      }
    },
  });
})();
