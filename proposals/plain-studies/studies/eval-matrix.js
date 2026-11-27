/* Eval Matrix, redesigned in Plain (Subtraction): four agent capability suites across eight checks, named in R7's four
   series hues. Toggling Failing only steps every passing check back to 0.14 opacity so only regressions remain; Re-run
   glides four corner hairlines across columns 1..8 and heals them in place. */
(function () {
  const SUITES = [
    {
      key: "auth",
      name: "Auth",
      hue: "var(--data-blue)",
      checks: [
        "Session cookie flags",
        "CSRF token check",
        "OAuth PKCE verifier",
        "Refresh token TTL",
        "Role guard middleware",
        "Revoked key lookup",
        "Bearer header parse",
        "Sign-out session clear",
      ],
    },
    {
      key: "api",
      name: "API",
      hue: "var(--data-amber)",
      checks: [
        "OpenAPI schema sync",
        "Idempotency key replay",
        "Pagination cursor bounds",
        "Webhook HMAC verify",
        "429 Retry-After header",
        "Error envelope shape",
        "Streaming SSE flush",
        "Timeout abort signal",
      ],
    },
    {
      key: "types",
      name: "Types",
      hue: "var(--data-teal)",
      checks: [
        "Public exports strict",
        "Zod runtime parity",
        "Exhaustive union switch",
        "Readonly payload AST",
        "Generic tool inference",
        "Async return narrowing",
        "Strict null session guard",
        "Declaration emit clean",
      ],
    },
    {
      key: "a11y",
      name: "A11y",
      hue: "var(--data-violet)",
      checks: [
        "Roving grid tabindex",
        "Focus ring contrast",
        "Dialog Escape restore",
        "Polite live announcements",
        "Switch state in words",
        "Reduced motion instant",
        "Forced-colors hairlines",
        "320px container reflow",
      ],
    },
  ];
  const INITIAL_FAILS = new Set(["0:3", "2:6"]);

  PlainPlayer.register({
    slug: "eval-matrix",
    title: "Eval Matrix",
    tagline: "Four capability suites; filter to isolate failures.",
    css: `
.ps-eval-matrix .em { width: min(100%, 400px); display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px }
.ps-eval-matrix .em-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 12px; padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-eval-matrix .em-lead { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 10px }
.ps-eval-matrix .em-verdict { font-size: 13.5px; color: var(--muted); font-variant-numeric: tabular-nums }
.ps-eval-matrix .em-verdict.is-fail { color: var(--danger); font-weight: 500 }
.ps-eval-matrix .em-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px }
.ps-eval-matrix .em-cols .pm-frame:not(.is-shown) { display: none }
.ps-eval-matrix .em-cols,
.ps-eval-matrix .em-row { display: grid; grid-template-columns: 56px repeat(8, minmax(0, 1fr)); align-items: center; gap: 4px }
.ps-eval-matrix .em-col-spacer { height: 1px }
.ps-eval-matrix .em-col { position: relative; text-align: center; font-size: 12px; line-height: 18px; color: var(--muted); font-variant-numeric: tabular-nums; user-select: none;
  transition: color var(--dur-instant) var(--ease-out) }
.ps-eval-matrix .em-col.is-scan { color: var(--ink); font-weight: 500 }
.ps-eval-matrix .em-suite { display: inline-flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 500; min-width: 0;
  transition: opacity var(--dur-pare) var(--ease-out) }
.ps-eval-matrix .em-sw { width: 8px; height: 8px; background: var(--suite); flex: none }
.ps-eval-matrix .em-cell { position: relative; aspect-ratio: 1; width: 100%; max-width: 26px; justify-self: center; padding: 0; border: 0; background: none;
  display: grid; place-items: center; cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: opacity var(--dur-pare) var(--ease-out), transform var(--dur-instant) var(--ease-out) }
.ps-eval-matrix .em-cell:active { transform: scale(0.92) }
.ps-eval-matrix .em-cell:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px }
.ps-eval-matrix .em-mark { display: grid; place-items: center; width: 13px; height: 13px; background: var(--suite); color: transparent; font-size: 12px; line-height: 1;
  transition: opacity var(--dur-pare) var(--ease-out), transform var(--dur-pare) var(--ease-out) }
.ps-eval-matrix .em-cell[data-fail="1"] .em-mark { width: 18px; height: 18px; background: transparent; border: 1px solid var(--danger); color: var(--danger); font-weight: 500 }
.ps-eval-matrix .em-cell:hover .em-mark { outline: 1px solid var(--ink); outline-offset: 2px }
.ps-eval-matrix .em-cell[data-fail="1"]:hover .em-mark { outline-color: var(--danger); outline-offset: 1px }
.ps-eval-matrix .em-grid[data-filter="fail"] .em-cell[data-fail="0"] { opacity: 0.14 }
.ps-eval-matrix .em-grid[data-filter="fail"] .em-row[data-clean="1"] .em-suite { opacity: 0.36 }
.ps-eval-matrix .em-note { min-height: 20px; font-size: 12.5px; font-family: var(--mono); color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-eval-matrix .em-foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 6px 10px 0; border-top: 1px solid var(--line) }
.ps-eval-matrix .em-filter[aria-checked="false"] { opacity: var(--unselected) }
.ps-eval-matrix .em-filter[aria-checked="false"]:hover:not(:disabled) { opacity: 0.85 }
.ps-eval-matrix .em-filter[aria-checked="true"] { color: var(--ink); font-weight: 500; opacity: 1 }
.ps-eval-matrix .em-filter[aria-checked="true"]:not(:hover)::before { opacity: 0 }
.ps-eval-matrix .em-rerun:disabled::before { opacity: 0 }
.ps-eval-matrix.is-tile .em { width: 100%; gap: 12px }
.ps-eval-matrix.is-tile .em-head { padding-bottom: 9px }
.ps-eval-matrix.is-tile .em-grid { gap: 6px }
.ps-eval-matrix.is-tile .em-suite { font-size: 13.5px }
.ps-eval-matrix.is-tile .em-cell { max-width: 24px }
.ps-eval-matrix.is-tile .em-mark { width: 12px; height: 12px }
.ps-eval-matrix.is-tile .em-cell[data-fail="1"] .em-mark { width: 17px; height: 17px; font-size: 11.5px }
.ps-eval-matrix.is-tile .em-note { display: none }
.ps-eval-matrix.is-tile .em-foot { padding-top: 6px }
.ps-eval-matrix.is-tile .em-foot .q { min-height: 30px; font-size: 13.5px }
@container (max-width: 270px) {
  .ps-eval-matrix .em-cols, .ps-eval-matrix .em-row { grid-template-columns: 52px repeat(8, minmax(0, 1fr)); gap: 2px }
  .ps-eval-matrix .em-mark { width: 10px; height: 10px }
  .ps-eval-matrix .em-cell[data-fail="1"] .em-mark { width: 15px; height: 15px; font-size: 10.5px }
}
`,
    mount(host, ctx) {
      const fails = new Set(INITIAL_FAILS);
      let filterFail = false;
      let running = false;
      let focusR = 0;
      let focusC = 3;
      let runTimers = [];

      host.innerHTML = `
<div class="em">
  <div class="em-head">
    <div class="em-lead">
      <span class="fig em-fig">30 of 32</span>
      <span class="em-verdict is-fail">2 failing</span>
    </div>
  </div>
  <div class="em-grid" role="grid" aria-label="Capability evaluation suites">
    <div class="em-cols" aria-hidden="true">
      <span class="em-col-spacer"></span>
      ${Array.from({ length: 8 }, (_, c) => `<span class="em-col" data-col="${c}">${c + 1}</span>`).join("")}
    </div>
    ${SUITES.map((s, r) => `
    <div class="em-row" role="row" data-r="${r}" style="--suite:${s.hue}">
      <span class="em-suite" role="rowheader"><i class="em-sw" aria-hidden="true"></i>${s.name}</span>
      ${s.checks.map((chk, c) => `<button type="button" class="em-cell" role="gridcell" data-r="${r}" data-c="${c}" data-fail="0" tabindex="-1"><span class="em-mark" aria-hidden="true"></span></button>`).join("")}
    </div>`).join("")}
  </div>
  <div class="em-note"></div>
  <div class="em-foot">
    <button type="button" class="q em-filter" role="switch" aria-checked="false">Failing only \u00b7 Off</button>
    <button type="button" class="q is-main em-rerun">Re-run</button>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const figEl = host.querySelector(".em-fig");
      const verdictEl = host.querySelector(".em-verdict");
      const gridEl = host.querySelector(".em-grid");
      const colsWrap = host.querySelector(".em-cols");
      const colEls = [...colsWrap.querySelectorAll(".em-col")];
      const rowEls = [...gridEl.querySelectorAll(".em-row")];
      const noteEl = host.querySelector(".em-note");
      const filterBtn = host.querySelector(".em-filter");
      const rerunBtn = host.querySelector(".em-rerun");
      const sr = host.querySelector("[aria-live]");
      const cells = SUITES.map((_, r) => [...rowEls[r].querySelectorAll(".em-cell")]);
      const colFrame = ctx.brackets(colsWrap, { padX: 2, padY: 1, size: 5, exactPad: true });

      function cellKey(r, c) { return r + ":" + c; }

      function paintCell(r, c) {
        const btn = cells[r][c];
        const mark = btn.firstElementChild;
        const fail = fails.has(cellKey(r, c));
        btn.dataset.fail = fail ? "1" : "0";
        mark.textContent = fail ? "\u00d7" : "";
        btn.setAttribute("aria-label", `${SUITES[r].name} ${c + 1}, ${SUITES[r].checks[c]}: ${fail ? "failing" : "passing"}`);
      }

      function syncRoving(focusDom) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 8; c++) {
            cells[r][c].tabIndex = r === focusR && c === focusC ? 0 : -1;
          }
        }
        if (focusDom) cells[focusR][focusC].focus({ preventScroll: true });
      }

      function defaultNote() {
        if (fails.size === 0) return "32 checks verified in 1.2 s \u00b7 0 regressions";
        const first = [...fails][0].split(":").map(Number);
        const s = SUITES[first[0]];
        return `${s.name} #${first[1] + 1} \u00b7 ${s.checks[first[1]]} \u2014 failed`;
      }

      function syncSummary(immediate, customNote) {
        const failCount = fails.size;
        const passCount = 32 - failCount;
        const figText = `${passCount} of 32`;
        const verdictText = failCount > 0 ? `${failCount} failing` : "All passing";
        verdictEl.classList.toggle("is-fail", failCount > 0);
        if (immediate) {
          figEl.textContent = figText;
          verdictEl.textContent = verdictText;
        } else {
          ctx.swapText(figEl, figText);
          ctx.swapText(verdictEl, verdictText);
        }
        for (let r = 0; r < 4; r++) {
          const rowHasFail = cells[r].some((_, c) => fails.has(cellKey(r, c)));
          rowEls[r].dataset.clean = rowHasFail ? "0" : "1";
        }
        if (customNote !== false) {
          const n = customNote || defaultNote();
          if (immediate) noteEl.textContent = n;
          else ctx.swapText(noteEl, n);
        }
      }

      function setFilter(on, immediate, byUser) {
        filterFail = on;
        filterBtn.setAttribute("aria-checked", on ? "true" : "false");
        const label = on ? "Failing only \u00b7 On" : "Failing only \u00b7 Off";
        if (immediate) filterBtn.textContent = label;
        else ctx.swapText(filterBtn, label);
        if (on) gridEl.dataset.filter = "fail";
        else delete gridEl.dataset.filter;
        if (byUser) sr.textContent = label + `. ${fails.size} failing of 32.`;
      }

      function clearRun() {
        runTimers.forEach(clearTimeout);
        runTimers = [];
        running = false;
        rerunBtn.disabled = false;
        colEls.forEach((el) => el.classList.remove("is-scan"));
        colFrame.pare();
      }

      function toggleCell(r, c, byUser) {
        if (running) return;
        const k = cellKey(r, c);
        if (fails.has(k)) fails.delete(k);
        else fails.add(k);
        paintCell(r, c);
        const nowFail = fails.has(k);
        const msg = `${SUITES[r].name} #${c + 1} \u00b7 ${SUITES[r].checks[c]} \u2014 ${nowFail ? "failed" : "passed"}`;
        syncSummary(false, msg);
        if (byUser) sr.textContent = msg;
      }

      function rerun(byUser, onDone) {
        if (running) return;
        running = true;
        rerunBtn.disabled = true;
        const schedule = byUser ? ctx.after : ctx.demoAfter;
        const stepMs = 135;

        const stepCol = (c) => {
          if (c >= 8) {
            colEls.forEach((el) => el.classList.remove("is-scan"));
            colFrame.pare();
            running = false;
            rerunBtn.disabled = false;
            if (filterFail) setFilter(false, false, false);
            syncSummary(false, "32 checks verified in 1.2 s \u00b7 0 regressions");
            if (byUser) sr.textContent = "Re-run complete. 32 of 32 passing.";
            if (onDone) onDone();
            return;
          }
          colEls.forEach((el, idx) => el.classList.toggle("is-scan", idx === c));
          colFrame.moveTo(colEls[c], { immediate: c === 0 });
          let healed = false;
          for (let r = 0; r < 4; r++) {
            const k = cellKey(r, c);
            if (fails.has(k)) {
              fails.delete(k);
              paintCell(r, c);
              healed = true;
            }
          }
          if (healed) syncSummary(false, `Fixed column ${c + 1} \u00b7 ${32 - fails.size} of 32 passing`);
          else if (c === 0) ctx.swapText(noteEl, "Running 32 checks across 4 suites\u2026");
          const t = schedule(stepMs, () => stepCol(c + 1));
          if (t) runTimers.push(t);
        };
        stepCol(0);
      }

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          paintCell(r, c);
          const btn = cells[r][c];
          btn.addEventListener("pointerenter", () => {
            if (running) return;
            const fail = fails.has(cellKey(r, c));
            noteEl.textContent = `${SUITES[r].name} #${c + 1} \u00b7 ${SUITES[r].checks[c]} \u2014 ${fail ? "failed" : "passed"}`;
          }, { signal: ctx.signal });
          btn.addEventListener("click", () => {
            focusR = r; focusC = c;
            syncRoving(false);
            toggleCell(r, c, true);
          }, { signal: ctx.signal });
        }
      }
      gridEl.addEventListener("pointerleave", () => {
        if (!running) noteEl.textContent = defaultNote();
      }, { signal: ctx.signal });

      gridEl.addEventListener("keydown", (e) => {
        let nr = focusR, nc = focusC;
        if (e.key === "ArrowRight") nc = (nc + 1) % 8;
        else if (e.key === "ArrowLeft") nc = (nc + 7) % 8;
        else if (e.key === "ArrowDown") nr = (nr + 1) % 4;
        else if (e.key === "ArrowUp") nr = (nr + 3) % 4;
        else if (e.key === "Home") nc = 0;
        else if (e.key === "End") nc = 7;
        else return;
        e.preventDefault();
        focusR = nr; focusC = nc;
        syncRoving(true);
        const fail = fails.has(cellKey(nr, nc));
        noteEl.textContent = `${SUITES[nr].name} #${nc + 1} \u00b7 ${SUITES[nr].checks[nc]} \u2014 ${fail ? "failed" : "passed"}`;
      }, { signal: ctx.signal });

      filterBtn.addEventListener("click", () => setFilter(!filterFail, false, true), { signal: ctx.signal });
      rerunBtn.addEventListener("click", () => rerun(true), { signal: ctx.signal });

      ctx.onHand(() => {
        if (running) clearRun();
      });

      syncRoving(false);
      syncSummary(true);

      function cycle() {
        ctx.demoAfter(2000, () => {
          setFilter(true, false, false);
          ctx.demoAfter(2100, () => {
            rerun(false, () => {
              ctx.demoAfter(2600, () => {
                fails.clear();
                INITIAL_FAILS.forEach((k) => fails.add(k));
                for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) paintCell(r, c);
                syncSummary(false);
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
