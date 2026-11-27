/* File Changes, redesigned in Plain (Subtraction): three changed files reviewed one at a time. The active pending file
   shows a two-line diff hunk inside four living corner hairlines; keeping or undoing pares the hunk away into a single
   receipt word and glides the frame onto the next file. */
(function () {
  const FILES = [
    {
      path: "src/auth/verify.ts",
      stat: "+1 −1",
      lines: [
        { kind: "del", text: "- if (!token) return guest();" },
        { kind: "add", text: "+ if (!token || expired) return reject();" },
      ],
    },
    {
      path: "src/auth/session.ts",
      stat: "+1 −1",
      lines: [
        { kind: "del", text: "- return user ?? guest();" },
        { kind: "add", text: "+ return user ?? clearCookie(res);" },
      ],
    },
    {
      path: "tests/verify.test.ts",
      stat: "+2 −0",
      lines: [
        { kind: "add", text: '+ it("rejects expired token", () => {' },
        { kind: "add", text: "+   expect(verify(stale)).toBe(reject());" },
      ],
    },
  ];

  PlainPlayer.register({
    slug: "file-changes",
    title: "File Changes",
    tagline: "Review diffs; each kept or undone file folds away.",
    css: `
.ps-file-changes .fc { width: min(100%, 430px); display: grid }
.ps-file-changes .fc-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-file-changes .fc-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-file-changes .fc-head-acts { display: inline-flex; align-items: center; gap: 20px; padding-right: 10px }
.ps-file-changes .fc-head-acts .q { min-height: 28px; font-size: var(--t-meta) }
.ps-file-changes .fc-list { position: relative; display: grid }
.ps-file-changes .fc-item { padding: 0 8px; border-bottom: 1px solid var(--line); transition: opacity var(--dur-pare) var(--ease-out) }
.ps-file-changes .fc-list[data-focusing] > .fc-item:not([data-active]) { opacity: 0.38 }
.ps-file-changes .fc-list:not([data-focusing]) > .fc-item[data-decided="undo"] { opacity: 0.48 }
.ps-file-changes .fc-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: baseline; gap: 10px; padding: 9px 0; font-size: 14px }
.ps-file-changes .fc-item[data-decided] .fc-row { cursor: pointer }
.ps-file-changes .fc-path { font-family: var(--mono); font-size: 14px; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-file-changes .fc-item[data-decided] .fc-path { color: var(--muted) }
.ps-file-changes .fc-stat { font-family: var(--mono); font-size: 12.5px; color: var(--muted); white-space: nowrap }
.ps-file-changes .fc-verdict { font-size: var(--t-meta); color: var(--ink); font-weight: 500; white-space: nowrap }
.ps-file-changes .fc-verdict.is-undo { color: var(--muted); font-weight: 400 }
.ps-file-changes .fc-hunk { padding: 2px 0 2px 12px; border-left: 1px solid var(--line-control); display: grid; gap: 2px }
.ps-file-changes .fc-line { font-family: var(--mono); font-size: 12.5px; line-height: 1.55; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted) }
.ps-file-changes .fc-line.is-add { color: var(--success) }
.ps-file-changes .fc-line.is-del { color: var(--danger) }
.ps-file-changes .fc-acts { display: flex; align-items: center; gap: 22px; padding: 6px 0 9px }
.ps-file-changes .fc-acts .q { min-height: 28px; font-size: 13.5px }
.ps-file-changes .fc-acts .q.in-frame:hover:not(:disabled) { text-decoration: underline; text-underline-offset: 3px }
.ps-file-changes.is-tile .fc { width: 100% }
.ps-file-changes.is-tile .fc-item { padding: 0 6px }
.ps-file-changes.is-tile .fc-row { padding: 8px 0; gap: 8px }
.ps-file-changes.is-tile .fc-acts { padding: 5px 0 8px }
@container (max-width: 270px) {
  .ps-file-changes .fc-path { font-size: 13.5px }
  .ps-file-changes .fc-line { font-size: 12px }
}
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="fc">
  <div class="fc-head">
    <h3 class="fc-title">3 files changed</h3>
    <span class="fc-head-acts">
      <button type="button" class="q fc-keep-rest">Keep rest</button>
      <button type="button" class="q fc-reset" hidden>Reset</button>
    </span>
  </div>
  <div class="fc-list" data-focus-group data-focusing></div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const titleEl = host.querySelector(".fc-title");
      const keepRestBtn = host.querySelector(".fc-keep-rest");
      const resetBtn = host.querySelector(".fc-reset");
      const listEl = host.querySelector(".fc-list");
      const sr = host.querySelector("[aria-live]");

      let decisions = [null, null, null];
      let activeIdx = 0;
      let busy = false;

      const itemEls = FILES.map((f, idx) => {
        const el = document.createElement("div");
        el.className = "fc-item";
        el.innerHTML = `
  <div class="fc-row">
    <span class="fc-path">${f.path}</span>
    <span class="fc-stat">${f.stat}</span>
    <span class="fc-verdict" hidden></span>
  </div>`;
        listEl.appendChild(el);
        el.querySelector(".fc-row").addEventListener("click", () => {
          if (busy || decisions[idx] === null) return;
          reopen(idx);
        }, { signal: ctx.signal });
        return el;
      });

      const frame = ctx.brackets(listEl, { padX: 0, padY: -1, exactPad: true });

      function buildDetail(idx) {
        const wrap = document.createElement("div");
        wrap.className = "fc-detail";
        const linesHtml = FILES[idx].lines
          .map((l) => `<div class="fc-line${l.kind === "add" ? " is-add" : l.kind === "del" ? " is-del" : ""}"></div>`)
          .join("");
        wrap.innerHTML = `
  <div class="fc-hunk">${linesHtml}</div>
  <div class="fc-acts" role="group" aria-label="Review ${FILES[idx].path}">
    <button type="button" class="q is-ink in-frame" data-act="keep">Keep</button>
    <button type="button" class="q in-frame" data-act="undo">Undo</button>
  </div>`;
        const lineNodes = wrap.querySelectorAll(".fc-line");
        FILES[idx].lines.forEach((l, i) => { lineNodes[i].textContent = l.text; });
        for (const btn of wrap.querySelectorAll("[data-act]")) {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            decide(idx, btn.dataset.act, true);
          }, { signal: ctx.signal });
        }
        return wrap;
      }

      function syncHeader(immediate) {
        const pending = decisions.filter((d) => d === null).length;
        const decided = FILES.length - pending;
        const nextTitle = pending === 0 ? "All 3 reviewed" : pending === 3 ? "3 files changed" : `${pending} ${pending === 1 ? "file" : "files"} left`;
        if (immediate) titleEl.textContent = nextTitle;
        else ctx.swapText(titleEl, nextTitle);
        keepRestBtn.hidden = pending === 0;
        resetBtn.hidden = decided === 0;
      }

      function syncFrame(immediate) {
        if (activeIdx >= 0 && activeIdx < FILES.length) {
          listEl.setAttribute("data-focusing", "");
          itemEls.forEach((el, i) => {
            if (i === activeIdx) el.setAttribute("data-active", "");
            else el.removeAttribute("data-active");
          });
          frame.moveTo(itemEls[activeIdx], { immediate });
          if (!immediate) {
            ctx.after(225, () => {
              if (activeIdx >= 0) frame.moveTo(itemEls[activeIdx]);
            });
          }
        } else {
          listEl.removeAttribute("data-focusing");
          itemEls.forEach((el) => el.removeAttribute("data-active"));
          frame.pare();
        }
      }

      function mountInitial() {
        decisions = [null, null, null];
        activeIdx = 0;
        itemEls.forEach((el, i) => {
          el.removeAttribute("data-decided");
          const v = el.querySelector(".fc-verdict");
          v.hidden = true;
          v.textContent = "";
          v.classList.remove("is-undo");
          const old = el.querySelector(".fc-detail");
          if (old) old.remove();
          if (i === 0) el.appendChild(buildDetail(0));
        });
        syncHeader(true);
        syncFrame(true);
      }

      function decide(idx, kind, byUser) {
        if (busy || decisions[idx] !== null || activeIdx !== idx) return;
        busy = true;
        decisions[idx] = kind;
        const nextIdx = decisions.findIndex((d) => d === null);
        activeIdx = nextIdx;
        const detail = itemEls[idx].querySelector(".fc-detail");
        const verdictWord = kind === "undo" ? "Undone" : "Kept";

        ctx.pareOut(detail, () => {
          ctx.flip(listEl, () => {
            if (detail) detail.remove();
            itemEls[idx].setAttribute("data-decided", kind);
            const v = itemEls[idx].querySelector(".fc-verdict");
            v.textContent = verdictWord;
            v.classList.toggle("is-undo", kind === "undo");
            v.hidden = false;

            if (nextIdx >= 0) {
              itemEls[nextIdx].appendChild(buildDetail(nextIdx));
            }
            syncHeader(false);
            syncFrame(false);
          });
          busy = false;
          if (byUser) {
            sr.textContent = `${FILES[idx].path} ${verdictWord.toLowerCase()}. ` + (nextIdx >= 0 ? `Next: ${FILES[nextIdx].path}.` : "All 3 files reviewed.");
            if (nextIdx >= 0) {
              const nextKeep = itemEls[nextIdx].querySelector('[data-act="keep"]');
              if (nextKeep) nextKeep.focus({ preventScroll: true });
            } else {
              resetBtn.focus({ preventScroll: true });
            }
          }
        });
      }

      function keepRest(byUser) {
        if (busy) return;
        const cur = activeIdx >= 0 ? itemEls[activeIdx].querySelector(".fc-detail") : null;
        busy = true;
        const finishAll = () => {
          ctx.flip(listEl, () => {
            decisions = decisions.map((d) => d || "keep");
            activeIdx = -1;
            itemEls.forEach((el, i) => {
              const det = el.querySelector(".fc-detail");
              if (det) det.remove();
              el.setAttribute("data-decided", decisions[i]);
              const v = el.querySelector(".fc-verdict");
              v.textContent = decisions[i] === "undo" ? "Undone" : "Kept";
              v.classList.toggle("is-undo", decisions[i] === "undo");
              v.hidden = false;
            });
            syncHeader(false);
            syncFrame(false);
          });
          busy = false;
          if (byUser) {
            sr.textContent = "Kept remaining files. All 3 reviewed.";
            resetBtn.focus({ preventScroll: true });
          }
        };
        if (cur) ctx.pareOut(cur, finishAll);
        else finishAll();
      }

      function reopen(idx) {
        ctx.flip(listEl, () => {
          if (activeIdx >= 0) {
            const prevDet = itemEls[activeIdx].querySelector(".fc-detail");
            if (prevDet) prevDet.remove();
          }
          decisions[idx] = null;
          activeIdx = idx;
          itemEls[idx].removeAttribute("data-decided");
          const v = itemEls[idx].querySelector(".fc-verdict");
          v.hidden = true;
          itemEls[idx].appendChild(buildDetail(idx));
          syncHeader(false);
          syncFrame(false);
        });
        const keepBtn = itemEls[idx].querySelector('[data-act="keep"]');
        if (keepBtn) keepBtn.focus({ preventScroll: true });
      }

      function resetAll(byUser) {
        if (busy) return;
        ctx.flip(listEl, () => {
          mountInitial();
        });
        if (byUser) {
          sr.textContent = "Reset all 3 file changes.";
          const keepBtn = itemEls[0].querySelector('[data-act="keep"]');
          if (keepBtn) keepBtn.focus({ preventScroll: true });
        }
      }

      keepRestBtn.addEventListener("click", () => keepRest(true), { signal: ctx.signal });
      resetBtn.addEventListener("click", () => resetAll(true), { signal: ctx.signal });

      mountInitial();

      function cycle() {
        ctx.demoAfter(2000, () => {
          decide(0, "keep", false);
          ctx.demoAfter(1800, () => {
            decide(1, "keep", false);
            ctx.demoAfter(1800, () => {
              decide(2, "keep", false);
              ctx.demoAfter(2600, () => {
                resetAll(false);
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
