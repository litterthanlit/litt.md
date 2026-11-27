/* Parallel Runs, redesigned in Plain (Subtraction): four concurrent agent runs in a roving-tabindex list with one
   gliding 4-corner frame. Archiving finished runs pares them off the page so only agents that need you remain. */
(function () {
  const RUNS = [
    { id: "auth", num: "01", title: "Fix flaky auth spec", meta: "Needs your OK", done: false, urgent: true },
    { id: "billing", num: "02", title: "Migrate billing types", meta: "Step 4 of 6", done: false, urgent: false },
    { id: "docs", num: "03", title: "Sync API reference", meta: "Done", done: true, urgent: false },
    { id: "vite", num: "04", title: "Upgrade Vite to v6", meta: "Done", done: true, urgent: false },
  ];

  PlainPlayer.register({
    slug: "run-list",
    title: "Parallel Runs",
    tagline: "Archive finished runs so only active agents remain.",
    css: `
.ps-run-list .rl { width: min(100%, 440px); display: grid }
.ps-run-list .rl-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--line) }
.ps-run-list .rl-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-run-list .rl-count { font-weight: 400; color: var(--muted) }
.ps-run-list .rl-bulk { min-height: 26px; margin-right: 10px; font-size: 13px }
.ps-run-list .rl-list { position: relative; display: grid }
.ps-run-list .rl-item { border-bottom: 1px solid var(--line); transition: opacity var(--dur-pare) var(--ease-out) }
.ps-run-list .rl-item.is-done:not([data-active]) { opacity: 0.48 }
.ps-run-list .rl-list[data-focusing] > .rl-item:not([data-active]) { opacity: 0.38 }
.ps-run-list .rl-row { all: unset; box-sizing: border-box; width: 100%; display: grid; grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: baseline; gap: 10px; padding: 10px 10px; cursor: pointer; font-size: 14px; line-height: 1.4; -webkit-tap-highlight-color: transparent }
.ps-run-list .rl-row:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }
.ps-run-list .rl-num { font-size: 12.5px; color: var(--muted) }
.ps-run-list .rl-title { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-run-list .rl-item.is-done .rl-title { font-weight: 400 }
.ps-run-list .rl-meta { font-size: 13px; color: var(--muted); white-space: nowrap }
.ps-run-list .rl-item.is-urgent .rl-meta { color: var(--ink); font-weight: 500 }
.ps-run-list .rl-foot { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 10px 10px 0; font-size: 13px; line-height: 1.4 }
.ps-run-list.is-tile .rl { width: 100% }
.ps-run-list.is-tile .rl-head { padding-bottom: 7px }
.ps-run-list.is-tile .rl-row { grid-template-columns: 22px minmax(0, 1fr) auto; gap: 8px; padding: 9px 8px }
.ps-run-list.is-tile .rl-foot { padding: 8px 8px 0 }
@container (max-width: 280px) {
  .ps-run-list .rl-row { grid-template-columns: 20px minmax(0, 1fr); row-gap: 2px }
  .ps-run-list .rl-meta { grid-column: 2; font-size: 12.5px }
  .ps-run-list.is-tile .rl-row { padding: 6px 6px }
}
`,
    mount(host, ctx) {
      const pool = ctx.tile ? RUNS.slice(0, 3) : RUNS;
      host.innerHTML = `
<div class="rl">
  <div class="rl-head">
    <h3>Agents · <span class="rl-count">${pool.length} runs</span></h3>
    <button type="button" class="q is-ink rl-bulk">Archive done</button>
  </div>
  <div class="rl-list" role="list" data-focus-group>
    ${pool.map((r, i) => `
      <div class="rl-item${r.done ? " is-done" : ""}${r.urgent ? " is-urgent" : ""}" role="listitem" data-id="${r.id}">
        <button type="button" class="rl-row" tabindex="${i === 0 ? "0" : "-1"}" data-id="${r.id}">
          <span class="rl-num">${r.num}</span>
          <span class="rl-title">${r.title}</span>
          <span class="rl-meta">${r.meta}</span>
        </button>
      </div>`).join("")}
  </div>
  <div class="rl-foot" hidden>
    <span class="rl-note muted"></span>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const countEl = host.querySelector(".rl-count");
      const bulkBtn = host.querySelector(".rl-bulk");
      const listEl = host.querySelector(".rl-list");
      const footEl = host.querySelector(".rl-foot");
      const noteEl = host.querySelector(".rl-note");
      const sr = host.querySelector("[aria-live]");

      const itemsById = new Map(pool.map((r) => [r.id, listEl.querySelector(`.rl-item[data-id="${r.id}"]`)]));
      const archived = new Set();
      const doneIds = pool.filter((r) => r.done).map((r) => r.id);
      const totalDone = doneIds.length;
      const frame = ctx.brackets(listEl, { padX: 0, padY: -2, exactPad: true });
      let activeId = pool[0].id;
      let busy = false;

      function visibleItems() {
        return pool.filter((r) => !archived.has(r.id)).map((r) => itemsById.get(r.id));
      }

      function setActive(id, opts) {
        const o = opts || {};
        if (archived.has(id)) id = pool.find((r) => !archived.has(r.id)).id;
        activeId = id;
        for (const r of pool) {
          const item = itemsById.get(r.id);
          const btn = item.querySelector(".rl-row");
          const on = r.id === activeId && !archived.has(r.id);
          btn.tabIndex = on ? 0 : -1;
          if (on) item.setAttribute("data-active", "");
          else item.removeAttribute("data-active");
        }
        const targetEl = itemsById.get(activeId);
        frame.moveTo(targetEl, { immediate: !!o.immediate });
        if (o.focus) targetEl.querySelector(".rl-row").focus({ preventScroll: true });
      }

      function syncHeader(immediate) {
        const visCount = pool.length - archived.size;
        const countText = `${visCount} ${visCount === 1 ? "run" : "runs"}`;
        const allDoneArchived = archived.size === totalDone;
        const bulkText = allDoneArchived ? "Restore done" : "Archive done";

        if (immediate) {
          countEl.textContent = countText;
          bulkBtn.textContent = bulkText;
        } else {
          ctx.swapText(countEl, countText);
          ctx.swapText(bulkBtn, bulkText);
        }

        if (archived.size > 0) {
          footEl.hidden = false;
          const noteText = `${archived.size} finished ${archived.size === 1 ? "run" : "runs"} archived`;
          if (immediate) noteEl.textContent = noteText;
          else ctx.swapText(noteEl, noteText);
        } else {
          footEl.hidden = true;
        }
      }

      function archiveIds(ids, byUser) {
        const targets = ids.filter((id) => itemsById.has(id) && !archived.has(id));
        if (!targets.length || busy) return;
        const els = targets.map((id) => itemsById.get(id));
        for (const id of targets) archived.add(id);

        const finish = () => {
          busy = false;
          for (const el of els) {
            el.hidden = true;
            el.style.pointerEvents = "";
            if (el.getAnimations) el.getAnimations().forEach((a) => a.cancel());
          }
          listEl.removeAttribute("data-focusing");
          syncHeader(false);
          setActive(archived.has(activeId) ? pool[0].id : activeId, { immediate: true });
          if (byUser) {
            sr.textContent = `Archived ${targets.length} finished ${targets.length === 1 ? "run" : "runs"}. ${pool.length - archived.size} runs remaining.`;
            bulkBtn.focus({ preventScroll: true });
          }
        };

        if (ctx.reduced()) {
          ctx.flip(host.querySelector(".rl"), finish);
          return;
        }

        busy = true;
        frame.pare();
        for (const extra of els.slice(1)) {
          extra.style.pointerEvents = "none";
          if (extra.animate) {
            extra.animate([{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: "translateX(-6px)" }], {
              duration: 140,
              easing: PlainPlayer.EASE_OUT,
              fill: "forwards",
            });
          }
        }
        ctx.pareOut(els[0], () => {
          ctx.flip(host.querySelector(".rl"), finish);
          if (!ctx.reduced()) ctx.after(225, () => { if (!busy) setActive(activeId, { immediate: true }); });
        });
      }

      function restoreDone(byUser) {
        if (!archived.size || busy) return;
        const count = archived.size;
        archived.clear();
        ctx.flip(host.querySelector(".rl"), () => {
          for (const r of pool) {
            itemsById.get(r.id).hidden = false;
          }
          syncHeader(false);
          setActive(activeId, { immediate: true });
        });
        if (!ctx.reduced()) ctx.after(225, () => { if (!busy) setActive(activeId, { immediate: true }); });
        if (byUser) {
          sr.textContent = `Restored ${count} finished ${count === 1 ? "run" : "runs"}. ${pool.length} runs shown.`;
          bulkBtn.focus({ preventScroll: true });
        }
      }

      bulkBtn.addEventListener("click", () => {
        if (archived.size === totalDone) restoreDone(true);
        else archiveIds(doneIds, true);
      }, { signal: ctx.signal });

      for (const r of pool) {
        const item = itemsById.get(r.id);
        const rowBtn = item.querySelector(".rl-row");
        rowBtn.addEventListener("click", () => {
          setActive(r.id, { focus: true });
          listEl.setAttribute("data-focusing", "");
          sr.textContent = `${r.title}, ${r.meta}`;
        }, { signal: ctx.signal });
        item.addEventListener("pointerenter", () => {
          if (busy || archived.has(r.id)) return;
          setActive(r.id);
          listEl.setAttribute("data-focusing", "");
        }, { signal: ctx.signal });
      }

      listEl.addEventListener("pointerleave", () => {
        if (!listEl.contains(document.activeElement)) listEl.removeAttribute("data-focusing");
      }, { signal: ctx.signal });
      listEl.addEventListener("focusin", (e) => {
        const item = e.target.closest(".rl-item");
        if (item && !archived.has(item.dataset.id)) {
          setActive(item.dataset.id);
          listEl.setAttribute("data-focusing", "");
        }
      }, { signal: ctx.signal });
      listEl.addEventListener("focusout", (e) => {
        if (!listEl.contains(e.relatedTarget)) listEl.removeAttribute("data-focusing");
      }, { signal: ctx.signal });

      listEl.addEventListener("keydown", (e) => {
        if (!e.target.classList.contains("rl-row")) return;
        const vis = visibleItems();
        const idx = vis.findIndex((el) => el.dataset.id === activeId);
        let next = -1;
        if (e.key === "ArrowDown") next = (idx + 1) % vis.length;
        else if (e.key === "ArrowUp") next = (idx - 1 + vis.length) % vis.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = vis.length - 1;
        if (next >= 0) {
          e.preventDefault();
          setActive(vis[next].dataset.id, { focus: true });
        }
      }, { signal: ctx.signal });

      syncHeader(true);
      setActive(pool[0].id, { immediate: true });

      function cycle() {
        ctx.demoAfter(1700, () => {
          setActive("billing");
          listEl.setAttribute("data-focusing", "");
          ctx.demoAfter(1200, () => {
            listEl.removeAttribute("data-focusing");
            setActive("auth");
            ctx.demoAfter(1100, () => {
              archiveIds(doneIds, false);
              ctx.demoAfter(2600, () => {
                restoreDone(false);
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
