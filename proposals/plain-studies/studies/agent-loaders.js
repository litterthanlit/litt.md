/* Determinate Work, redesigned in Plain (Subtraction): one repository indexing task read four spinner-free ways —
   Elapsed, Count, Bar, or tailing Log — framed by gliding corner hairlines. When 240/240 completes, the active
   scaffolding pares away into a single quiet receipt line. */
(function () {
  const TOTAL = 240;
  const START = 184;
  const MODES = [
    { key: "elapsed", label: "Elapsed" },
    { key: "count", label: "Count" },
    { key: "bar", label: "Bar" },
    { key: "log", label: "Log" },
  ];
  const PATHS = [
    "src/auth/session.ts",
    "src/auth/verify.ts",
    "src/router/dispatch.ts",
    "src/agent/planner.ts",
    "src/agent/sandbox.ts",
    "src/tools/diff-apply.ts",
    "src/tools/shell-guard.ts",
    "src/store/transcript.ts",
    "docs/architecture.md",
    "docs/permissions.md",
    "docs/telemetry.md",
    "docs/eval-suites.md",
  ];

  PlainPlayer.register({
    slug: "agent-loaders",
    title: "Determinate Work",
    tagline: "Elapsed, count, bar or log \u2014 zero spinners.",
    css: `
.ps-agent-loaders .al { width: min(100%, 400px); display: grid; gap: 16px }
.ps-agent-loaders .al-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--line) }
.ps-agent-loaders .al-tabs { position: relative; display: inline-flex; align-items: center; gap: 22px; padding: 2px 9px }
.ps-agent-loaders .al-tabs .q { min-height: 24px }
.ps-agent-loaders .al-task { font-size: 13.5px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-agent-loaders .al-task span { font-family: var(--mono); font-size: 12.5px }
.ps-agent-loaders .al-stage { min-height: 76px; display: grid; align-content: center }
.ps-agent-loaders .al-stage.is-done { min-height: 0 }
.ps-agent-loaders .al-view { display: grid; gap: 10px }
.ps-agent-loaders .al-pair { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 12px }
.ps-agent-loaders .al-sub { font-size: 13.5px; color: var(--muted); font-variant-numeric: tabular-nums }
.ps-agent-loaders .al-log { border-left: 1px solid var(--line-control); padding: 2px 0 2px 12px; display: grid; gap: 4px; overflow: hidden }
.ps-agent-loaders .al-line { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; align-items: baseline; gap: 8px;
  font-family: var(--mono); font-size: 12.5px; line-height: 1.45; opacity: 0.42; transition: opacity var(--dur-pare) var(--ease-out) }
.ps-agent-loaders .al-line.is-cur { opacity: 1 }
.ps-agent-loaders .al-idx { color: var(--muted); font-variant-numeric: tabular-nums }
.ps-agent-loaders .al-path { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-agent-loaders .al-st { color: var(--muted); font-family: var(--font); font-size: 12.5px }
.ps-agent-loaders .al-line.is-cur .al-st { color: var(--ink); font-weight: 500 }
.ps-agent-loaders .al-receipt { font-size: 15px; font-weight: 500; padding: 8px 0; font-variant-numeric: tabular-nums }
.ps-agent-loaders .al-foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 8px 10px 0; border-top: 1px solid var(--line) }
.ps-agent-loaders .al-left-acts { display: flex; align-items: center; gap: 24px }
.ps-agent-loaders .al-foot .q { min-height: 30px }
.ps-agent-loaders.is-tile .al { width: 100%; gap: 16px }
.ps-agent-loaders.is-tile .al-stage { min-height: 70px }
@container (max-width: 260px) {
  .ps-agent-loaders .al-tabs { gap: 14px }
}
`,
    mount(host, ctx) {
      let mode = "elapsed";
      let done = START;
      let running = false;
      let runTimer = 0;
      let logSeq = START;

      host.innerHTML = `
<div class="al">
  <div class="al-top">
    <div class="al-tabs" role="radiogroup" aria-label="Progress readout mode">
      ${MODES.map((m, i) => `<button type="button" class="q in-frame" role="radio" data-mode="${m.key}" aria-checked="${i === 0 ? "true" : "false"}" tabindex="${i === 0 ? "0" : "-1"}">${m.label}</button>`).join("")}
    </div>
  </div>
  <div class="al-task">Indexing repository \u00b7 <span>src/ &amp; docs/</span></div>
  <div class="al-stage"></div>
  <div class="al-foot">
    <div class="al-left-acts">
      <button type="button" class="q is-ink al-run">Run</button>
      <button type="button" class="q al-step">Step</button>
    </div>
    <button type="button" class="q al-reset">Reset</button>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const tabsEl = host.querySelector(".al-tabs");
      const tabBtns = [...tabsEl.querySelectorAll('[role="radio"]')];
      const stageEl = host.querySelector(".al-stage");
      const runBtn = host.querySelector(".al-run");
      const stepBtn = host.querySelector(".al-step");
      const resetBtn = host.querySelector(".al-reset");
      const sr = host.querySelector("[aria-live]");
      const modeFrame = ctx.brackets(tabsEl, { padX: 9, padY: 2, exactPad: true });

      function statsFor(n) {
        const clamped = Math.max(0, Math.min(TOTAL, n));
        const elapsed = clamped <= START
          ? (clamped / START) * 11.4
          : 11.4 + (clamped - START) * 0.05;
        const rem = Math.max(0, 14.2 - elapsed);
        const pct = Math.round((clamped / TOTAL) * 100);
        const left = TOTAL - clamped;
        return {
          done: clamped,
          elapsed: elapsed.toFixed(1),
          rem: rem < 0.6 ? "<1 s remaining" : `~${Math.max(1, Math.round(rem))} s remaining`,
          pct,
          p: (clamped / TOTAL).toFixed(4),
          left,
        };
      }

      function pathAt(idx) {
        return PATHS[((idx % PATHS.length) + PATHS.length) % PATHS.length];
      }

      function logRowHTML(num, isCur) {
        const n = Math.max(1, Math.min(TOTAL, num));
        return `<div class="al-line${isCur ? " is-cur" : ""}" data-n="${n}"><span class="al-idx">${String(n).padStart(3, "0")}</span><span class="al-path">${pathAt(n)}</span><span class="al-st">${isCur ? "reading" : "indexed"}</span></div>`;
      }

      function buildActiveView() {
        const s = statsFor(done);
        stageEl.classList.remove("is-done");
        if (mode === "elapsed") {
          stageEl.innerHTML = `<div class="al-view" data-view="elapsed"><div class="al-pair"><span class="fig al-fig">${s.elapsed} s</span><span class="al-sub">${s.rem}</span></div></div>`;
        } else if (mode === "count") {
          stageEl.innerHTML = `<div class="al-view" data-view="count"><div class="al-pair"><span class="fig al-fig">${s.done} of ${TOTAL}</span><span class="al-sub">${s.left} files left</span></div></div>`;
        } else if (mode === "bar") {
          stageEl.innerHTML = `<div class="al-view" data-view="bar"><div class="al-pair"><span class="fig al-fig">${s.pct} %</span><span class="al-sub">${s.done} of ${TOTAL} files</span></div><div class="bar-track" role="progressbar" aria-label="Repository indexing progress" aria-valuemin="0" aria-valuemax="${TOTAL}" aria-valuenow="${s.done}" aria-valuetext="${s.pct} percent, ${s.done} of ${TOTAL} files"><div class="bar-fill" style="--p:${s.p}"></div></div></div>`;
        } else {
          const base = Math.max(3, s.done);
          stageEl.innerHTML = `<div class="al-view" data-view="log"><div class="al-log">${logRowHTML(base - 2, false)}${logRowHTML(base - 1, false)}${logRowHTML(base, true)}</div></div>`;
        }
      }

      function syncControls() {
        const finished = done >= TOTAL;
        runBtn.disabled = finished;
        runBtn.classList.toggle("is-ink", !finished);
        resetBtn.classList.toggle("is-ink", finished);
        stepBtn.disabled = finished || running;
        runBtn.textContent = running ? "Pause" : "Run";
      }

      function showReceipt(animate, byUser) {
        stopRun();
        syncControls();
        const current = stageEl.firstElementChild;
        const mountReceipt = () => {
          stageEl.classList.add("is-done");
          stageEl.innerHTML = `<div class="al-receipt">Indexed 240 files in 14.2 s \u00b7 0 skipped</div>`;
          if (byUser) sr.textContent = "Indexed 240 files in 14.2 seconds, 0 skipped.";
        };
        if (animate && current && !current.classList.contains("al-receipt")) {
          ctx.pareOut(current, mountReceipt);
        } else {
          mountReceipt();
        }
      }

      function updateView(prevDone, byUser) {
        syncControls();
        if (done >= TOTAL) {
          showReceipt(true, byUser);
          return;
        }
        const view = stageEl.querySelector(".al-view");
        if (!view || view.dataset.view !== mode) {
          buildActiveView();
          return;
        }
        const s = statsFor(done);
        if (mode === "elapsed") {
          view.querySelector(".al-fig").textContent = `${s.elapsed} s`;
          view.querySelector(".al-sub").textContent = s.rem;
        } else if (mode === "count") {
          view.querySelector(".al-fig").textContent = `${s.done} of ${TOTAL}`;
          view.querySelector(".al-sub").textContent = `${s.left} files left`;
        } else if (mode === "bar") {
          view.querySelector(".al-fig").textContent = `${s.pct} %`;
          view.querySelector(".al-sub").textContent = `${s.done} of ${TOTAL} files`;
          const pb = view.querySelector('[role="progressbar"]');
          pb.setAttribute("aria-valuenow", String(s.done));
          pb.setAttribute("aria-valuetext", `${s.pct} percent, ${s.done} of ${TOTAL} files`);
          view.querySelector(".bar-fill").style.setProperty("--p", s.p);
        } else if (mode === "log" && done !== prevDone) {
          const logBox = view.querySelector(".al-log");
          const first = logBox && logBox.querySelector(".al-line:not([data-paring])");
          const rowNum = (logSeq = s.done);
          if (first) {
            first.dataset.paring = "1";
            ctx.pareOut(first, () => {
              first.remove();
              for (const line of logBox.querySelectorAll(".al-line")) {
                line.classList.remove("is-cur");
                const st = line.querySelector(".al-st");
                if (st) st.textContent = "indexed";
              }
              const wrap = document.createElement("div");
              wrap.innerHTML = logRowHTML(rowNum, true);
              logBox.appendChild(wrap.firstElementChild);
            });
          }
        }
      }

      function setMode(nextMode, immediate, byUser) {
        mode = nextMode;
        for (const b of tabBtns) {
          const on = b.dataset.mode === mode;
          b.setAttribute("aria-checked", on ? "true" : "false");
          b.tabIndex = on ? 0 : -1;
          if (on) modeFrame.moveTo(b, { immediate });
        }
        if (done < TOTAL) buildActiveView();
        if (byUser) {
          const s = statsFor(done);
          sr.textContent = done >= TOTAL
            ? `${mode} view. Indexed 240 files in 14.2 seconds.`
            : `${mode} view, ${s.done} of ${TOTAL} files.`;
        }
      }

      function stopRun() {
        if (runTimer) { clearInterval(runTimer); runTimer = 0; }
        running = false;
      }

      function toggleRun(byUser) {
        if (done >= TOTAL) return;
        if (running) {
          stopRun();
          syncControls();
          if (byUser) sr.textContent = `Paused at ${done} of ${TOTAL} files.`;
          return;
        }
        running = true;
        syncControls();
        const stepSize = mode === "log" ? 8 : 7;
        runTimer = ctx.every(mode === "log" ? 260 : 120, () => {
          const prev = done;
          done = Math.min(TOTAL, done + stepSize);
          updateView(prev, byUser);
          if (done >= TOTAL) stopRun();
        });
      }

      for (const b of tabBtns) {
        b.addEventListener("click", () => setMode(b.dataset.mode, false, true), { signal: ctx.signal });
      }
      tabsEl.addEventListener("keydown", (e) => {
        const idx = tabBtns.findIndex((b) => b.dataset.mode === mode);
        let next = idx;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % tabBtns.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx + tabBtns.length - 1) % tabBtns.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabBtns.length - 1;
        else return;
        e.preventDefault();
        tabBtns[next].focus({ preventScroll: true });
        setMode(tabBtns[next].dataset.mode, false, true);
      }, { signal: ctx.signal });

      stepBtn.addEventListener("click", () => {
        if (done >= TOTAL || running) return;
        const prev = done;
        done = Math.min(TOTAL, done + 14);
        updateView(prev, true);
        if (done < TOTAL) sr.textContent = `${done} of ${TOTAL} files indexed.`;
      }, { signal: ctx.signal });

      runBtn.addEventListener("click", () => toggleRun(true), { signal: ctx.signal });

      resetBtn.addEventListener("click", () => {
        stopRun();
        done = done === START ? 0 : START;
        ctx.flip( host.querySelector(".al"), () => {
          buildActiveView();
          syncControls();
        });
        sr.textContent = `Reset to ${done} of ${TOTAL} files.`;
      }, { signal: ctx.signal });

      setMode("elapsed", true, false);
      syncControls();

      function cycle() {
        ctx.demoAfter(1900, () => {
          setMode("count", false, false);
          const p1 = done; done = 198; updateView(p1, false);
          ctx.demoAfter(1900, () => {
            setMode("bar", false, false);
            const p2 = done; done = 216; updateView(p2, false);
            ctx.demoAfter(1900, () => {
              setMode("log", false, false);
              ctx.demoAfter(900, () => {
                const p3 = done; done = 232; updateView(p3, false);
                ctx.demoAfter(1100, () => {
                  const p4 = done; done = TOTAL; updateView(p4, false);
                  ctx.demoAfter(2500, () => {
                    done = START;
                    setMode("elapsed", false, false);
                    syncControls();
                    cycle();
                  });
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
