/* Agent Inbox, redesigned in Plain (Subtraction): background run events sit as clean open rows parted by 1px hairlines;
   dismissing pares each row away and surviving rows glide upward via FLIP until only one quiet empty line remains. */
(function () {
  const INITIAL = [
    { title: "PR #184 ready", detail: "+14 −4, all checks green" },
    { title: "Billing agent paused", detail: "Needs schema OK" },
    { title: "Docs sync done", detail: "6 pages updated" },
  ];

  const EXTRA_POOL = [
    { title: "Test runner green", detail: "42 passed in 1.1 s" },
    { title: "Auth audit finished", detail: "0 leaked secrets" },
    { title: "Branch rebased", detail: "agent/session-ttl onto main" },
  ];

  PlainPlayer.register({
    slug: "event-inbox",
    title: "Agent Inbox",
    tagline: "Background run events; dismissing pares each away.",
    css: `
.ps-event-inbox .ei { width: min(100%, 420px); display: grid; gap: 6px }
.ps-event-inbox .ei-head { display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding-bottom: 8px; border-bottom: 1px solid var(--line) }
.ps-event-inbox .ei-title { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em; white-space: nowrap }
.ps-event-inbox .ei-actions { display: inline-flex; align-items: center; gap: 22px; padding: 0 10px }
.ps-event-inbox .ei-list { display: grid }
.ps-event-inbox .ei-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--line) }
.ps-event-inbox .ei-copy { display: grid; gap: 2px; min-width: 0 }
.ps-event-inbox .ei-copy b { font-size: 14px; font-weight: 500; line-height: 1.3; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-event-inbox .ei-copy span { font-size: 13px; line-height: 1.35; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-event-inbox .ei-dismiss { min-height: 28px; margin-right: 10px; font-size: 13px }
.ps-event-inbox .ei-more-wrap { padding: 4px 0 0 10px }
.ps-event-inbox .ei-more { min-height: 28px; font-size: 13px }
.ps-event-inbox .ei-empty { padding: 14px 0; border-bottom: 1px solid var(--line); font-size: 14px; color: var(--muted) }
.ps-event-inbox.is-tile .ei { width: 100%; gap: 4px }
.ps-event-inbox.is-tile .ei-head { padding-bottom: 7px }
.ps-event-inbox.is-tile .ei-actions { padding-right: 10px }
.ps-event-inbox.is-tile .ei-actions .q { min-height: 28px }
.ps-event-inbox.is-tile .ei-clear { display: none }
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="ei">
  <div class="ei-head">
    <h3 class="ei-title">Agent events</h3>
    <div class="ei-actions">
      <button type="button" class="q is-main ei-queue">Queue</button>
      <button type="button" class="q ei-clear">Clear</button>
    </div>
  </div>
  <div class="ei-list" role="region" aria-label="Agent events"></div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const queueBtn = host.querySelector(".ei-queue");
      const clearBtn = host.querySelector(".ei-clear");
      const listEl = host.querySelector(".ei-list");
      const sr = host.querySelector("[aria-live]");

      const maxVisible = ctx.tile ? 2 : 3;
      const baseItems = ctx.tile ? INITIAL.slice(0, 2) : INITIAL;
      let seq = 0;
      let poolIdx = 0;
      let expanded = false;
      let clearing = false;
      let items = baseItems.map((x) => ({ id: ++seq, title: x.title, detail: x.detail }));
      const rowNodes = new Map();

      const emptyNode = document.createElement("div");
      emptyNode.className = "ei-empty";
      emptyNode.textContent = "Inbox clear";

      const moreWrap = document.createElement("div");
      moreWrap.className = "ei-more-wrap";
      const moreBtn = document.createElement("button");
      moreBtn.type = "button";
      moreBtn.className = "q ei-more";
      moreWrap.appendChild(moreBtn);

      moreBtn.addEventListener("click", () => {
        if (clearing) return;
        expanded = !expanded;
        ctx.flip(listEl, () => renderRows());
      }, { signal: ctx.signal });

      function getRowNode(item) {
        let el = rowNodes.get(item.id);
        if (el) return el;
        el = document.createElement("div");
        el.className = "ei-row";
        el.dataset.id = String(item.id);
        el.innerHTML = `<div class="ei-copy"><b></b><span></span></div><button type="button" class="q ei-dismiss">Dismiss</button>`;
        el.querySelector("b").textContent = item.title;
        el.querySelector("span").textContent = item.detail;
        const btn = el.querySelector(".ei-dismiss");
        btn.setAttribute("aria-label", "Dismiss " + item.title);
        btn.addEventListener("click", () => dismissOne(item.id, true), { signal: ctx.signal });
        rowNodes.set(item.id, el);
        return el;
      }

      function syncHeader() {
        clearBtn.disabled = items.length === 0 || clearing;
      }

      function renderRows(newItemId) {
        if (items.length === 0) {
          expanded = false;
          listEl.replaceChildren(emptyNode);
          return;
        }
        const limit = expanded ? items.length : Math.min(maxVisible, items.length);
        const visible = items.slice(0, limit);
        const desired = visible.map(getRowNode);
        if (!ctx.tile && items.length > maxVisible) {
          const hiddenCount = items.length - maxVisible;
          moreBtn.textContent = expanded ? `Show latest ${maxVisible}` : `+${hiddenCount} older`;
          desired.push(moreWrap);
        }
        if (emptyNode.parentElement === listEl) emptyNode.remove();
        for (const child of [...listEl.children]) {
          if (!desired.includes(child)) child.remove();
        }
        desired.forEach((node, idx) => {
          if (listEl.children[idx] !== node) {
            listEl.insertBefore(node, listEl.children[idx] || null);
          }
          if (newItemId && node.dataset && Number(node.dataset.id) === newItemId && !ctx.reduced() && node.animate) {
            node.animate(
              [{ opacity: 0, transform: "translateX(-6px)" }, { opacity: 1, transform: "translateX(0)" }],
              { duration: 160, easing: PlainPlayer.EASE_OUT }
            );
          }
        });
      }

      function dismissOne(id, byUser) {
        if (clearing) return;
        const idx = items.findIndex((x) => x.id === id);
        if (idx < 0) return;
        const removed = items[idx];
        const el = rowNodes.get(id);
        items.splice(idx, 1);
        rowNodes.delete(id);
        syncHeader();
        ctx.pareOut(el, () => {
          if (el) el.remove();
          if (clearing) return;
          renderRows();
          if (byUser) {
            sr.textContent = items.length === 0
              ? `Dismissed ${removed.title}. Inbox clear.`
              : `Dismissed ${removed.title}. ${items.length} remaining.`;
            const nextBtn = listEl.querySelector(".ei-dismiss") || queueBtn;
            if (nextBtn) nextBtn.focus({ preventScroll: true });
          }
        });
      }

      function queueNext(byUser) {
        if (clearing) return;
        const src = EXTRA_POOL[poolIdx++ % EXTRA_POOL.length];
        const item = { id: ++seq, title: src.title, detail: src.detail };
        items.unshift(item);
        syncHeader();
        ctx.flip(listEl, () => renderRows(item.id));
        if (byUser) sr.textContent = `Queued ${item.title}. ${items.length} events.`;
      }

      function clearAll(byUser) {
        if (items.length === 0 || clearing) return;
        clearing = true;
        const rows = [...listEl.querySelectorAll(".ei-row")];
        items = [];
        rowNodes.clear();
        syncHeader();

        const finish = () => {
          clearing = false;
          if (ctx.signal.aborted) return;
          syncHeader();
          ctx.flip(listEl, () => renderRows());
          if (byUser) {
            sr.textContent = "Inbox clear";
            queueBtn.focus({ preventScroll: true });
          }
        };

        if (!rows.length || ctx.reduced() || !rows[0].animate) {
          finish();
          return;
        }
        let done = 0;
        rows.forEach((r) => {
          r.style.pointerEvents = "none";
          const a = r.animate(
            [{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: "translateX(-6px)" }],
            { duration: 140, easing: PlainPlayer.EASE_OUT, fill: "forwards" }
          );
          a.onfinish = () => {
            if (++done === rows.length) finish();
          };
        });
      }

      function restoreInitial() {
        items = baseItems.map((x) => ({ id: ++seq, title: x.title, detail: x.detail }));
        rowNodes.clear();
        expanded = false;
        syncHeader();
        ctx.flip(listEl, () => renderRows());
      }

      queueBtn.addEventListener("click", () => queueNext(true), { signal: ctx.signal });
      clearBtn.addEventListener("click", () => clearAll(true), { signal: ctx.signal });

      syncHeader();
      renderRows();

      function cycle() {
        ctx.demoAfter(1900, () => {
          if (items[0]) dismissOne(items[0].id, false);
          ctx.demoAfter(1900, () => {
            queueNext(false);
            ctx.demoAfter(1900, () => {
              clearAll(false);
              ctx.demoAfter(2200, () => {
                restoreInitial();
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
