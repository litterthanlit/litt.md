/* Slash Palette, redesigned in Plain (Subtraction): an open specification list with a 1px bottom-ruled search field and
   1px hairline-divided commands and workspace files. Typing pares non-matching rows away via FLIP, arrow keys glide one
   shared 4-corner frame across options, and Enter subtracts the whole palette into a one-line execution receipt. */
(function () {
  const ITEMS = [
    { key: "compact", group: "Session", kind: "cmd", cmd: "/compact", desc: "Summarize old turns", receipt: "freed 43k tokens" },
    { key: "rollback", group: "Session", kind: "cmd", cmd: "/rollback", desc: "Rewind to checkpoint", receipt: "rewound to step 02" },
    { key: "clear", group: "Session", kind: "cmd", cmd: "/clear", desc: "Reset context", receipt: "reset to 14k system" },
    { key: "review", group: "Agents", kind: "cmd", cmd: "/review", desc: "Audit staged diff", receipt: "2 notes on verify.ts" },
    { key: "spawn", group: "Agents", kind: "cmd", cmd: "/spawn", desc: "Start background run", receipt: "started background run" },
    { key: "test", group: "Agents", kind: "cmd", cmd: "/test", desc: "Run failing specs", receipt: "14 passed in vitest" },
    { key: "verify", group: "Files", kind: "file", cmd: "@src/auth/verify.ts", desc: "Pin file · 2.1k", receipt: "pinned (+2.1k)" },
    { key: "session", group: "Files", kind: "file", cmd: "@src/auth/session.ts", desc: "Pin file · 1.4k", receipt: "pinned (+1.4k)" },
  ];
  const GROUPS = ["Session", "Agents", "Files"];
  let uid = 0;

  PlainPlayer.register({
    slug: "command-menu",
    title: "Slash Palette",
    tagline: "Type to pare commands down; arrows move the frame.",
    css: `
.ps-command-menu .cm { width: min(100%, 440px); min-height: 368px; display: grid; align-content: start }
.ps-command-menu .cm.is-closed { min-height: 0; align-content: center }
.ps-command-menu .cm-box { width: 100%; border: 0; padding: 0; background: transparent }
.ps-command-menu .cm-top { position: relative }
.ps-command-menu .cm-input { font-family: var(--mono); font-size: 14px; padding-right: 96px }
.ps-command-menu .cm-count { position: absolute; right: 0; top: 50%; transform: translateY(-50%); font-size: 13px; color: var(--muted); pointer-events: none }
.ps-command-menu .cm-list { position: relative; padding: 6px 0 0; display: grid; gap: 0 }
.ps-command-menu .cm-group { padding: 12px 0 4px }
.ps-command-menu .cm-group:first-child { padding-top: 4px }
.ps-command-menu .cm-opt { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 9px 10px;
  border-bottom: 1px solid var(--line); opacity: 0.42; cursor: pointer; font-size: 14px; line-height: 1.4; -webkit-tap-highlight-color: transparent;
  transition: opacity var(--dur-pare) var(--ease-out) }
.ps-command-menu .cm-opt:hover { opacity: 0.82 }
.ps-command-menu .cm-opt[aria-selected="true"] { opacity: 1 }
.ps-command-menu .cm-cmd { font-family: var(--mono); font-size: 13px; color: var(--ink); white-space: nowrap; flex: none }
.ps-command-menu .cm-opt[aria-selected="true"] .cm-cmd { font-weight: 500 }
.ps-command-menu .cm-desc { color: var(--muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; text-align: right }
.ps-command-menu .cm-opt[aria-selected="true"] .cm-desc { color: var(--ink) }
.ps-command-menu .cm-empty { padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 14px; color: var(--muted) }
.ps-command-menu .cm-receipt { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 16px;
  padding: 10px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); font-size: 14px; line-height: 1.4 }
.ps-command-menu .cm-ran code { font-family: var(--mono); font-size: 13px; font-weight: 500 }
.ps-command-menu .cm-reopen { min-height: 26px; margin-right: 10px; font-size: 13px }
.ps-command-menu.is-tile .cm { width: 100%; min-height: 196px }
.ps-command-menu.is-tile .cm.is-closed { min-height: 0 }
.ps-command-menu.is-tile .cm-input { min-height: 36px; padding: 6px 92px 6px 0 }
.ps-command-menu.is-tile .cm-group { display: none }
.ps-command-menu.is-tile .cm-list { padding: 6px 0 0; gap: 0 }
.ps-command-menu.is-tile .cm-opt { padding: 8px 8px }
`,
    mount(host, ctx) {
      const id = "ps-cm-" + ++uid;
      const pool = ctx.tile ? ITEMS.slice(0, 4) : ITEMS;
      const poolGroups = ctx.tile ? [] : GROUPS;
      host.innerHTML = `
<div class="cm">
  <div class="cm-box">
    <div class="cm-top">
      <input type="text" class="field cm-input" role="combobox" aria-expanded="true" aria-autocomplete="list"
        aria-controls="${id}-list" aria-label="Slash command palette" value="/" spellcheck="false" autocomplete="off">
      <span class="cm-count" aria-hidden="true">${ctx.tile ? "4 commands" : "6 commands"}</span>
    </div>
    <div class="cm-list" id="${id}-list" role="listbox" aria-label="Commands and files">
      ${ctx.tile
        ? pool.map((it) => `<div class="cm-opt" id="${id}-opt-${it.key}" role="option" aria-selected="false" data-key="${it.key}" data-group="${it.group}">
            <span class="cm-cmd">${it.cmd}</span>
            <span class="cm-desc">${it.desc}</span>
          </div>`).join("")
        : GROUPS.map((g) => {
            const gItems = pool.filter((it) => it.group === g);
            return `<div class="cm-group label" role="presentation" data-group="${g}">${g}</div>` +
              gItems.map((it) => `<div class="cm-opt" id="${id}-opt-${it.key}" role="option" aria-selected="false" data-key="${it.key}" data-group="${g}">
                <span class="cm-cmd">${it.cmd}</span>
                <span class="cm-desc">${it.desc}</span>
              </div>`).join("");
          }).join("")}
      <div class="cm-empty" hidden>No matching commands or files</div>
    </div>
  </div>
  <div class="cm-receipt" hidden>
    <span class="cm-ran"></span>
    <button type="button" class="q is-main cm-reopen">Open palette</button>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const boxEl = host.querySelector(".cm-box");
      const inputEl = host.querySelector(".cm-input");
      const countEl = host.querySelector(".cm-count");
      const listEl = host.querySelector(".cm-list");
      const groupEls = new Map(poolGroups.map((g) => [g, listEl.querySelector(`.cm-group[data-group="${g}"]`)]));
      const optEls = new Map(pool.map((it) => [it.key, listEl.querySelector(`.cm-opt[data-key="${it.key}"]`)]));
      const emptyEl = listEl.querySelector(".cm-empty");
      const receiptEl = host.querySelector(".cm-receipt");
      const ranEl = host.querySelector(".cm-ran");
      const reopenBtn = host.querySelector(".cm-reopen");
      const sr = host.querySelector("[aria-live]");

      const frame = ctx.brackets(listEl, { padX: 0, padY: -2, exactPad: true });
      let activeKey = "compact";
      let closed = false;
      let busy = false;

      function matchItems(raw) {
        const q = raw.trim().toLowerCase();
        if (!q) return pool.slice();
        if (q.startsWith("/")) {
          const rest = q.slice(1).trim();
          return pool.filter((it) => it.kind === "cmd" && (!rest || (it.cmd.slice(1) + " " + it.desc).toLowerCase().includes(rest)));
        }
        if (q.startsWith("@")) {
          const rest = q.slice(1).trim();
          return pool.filter((it) => it.kind === "file" && (!rest || (it.cmd.slice(1) + " " + it.desc).toLowerCase().includes(rest)));
        }
        return pool.filter((it) => (it.cmd + " " + it.desc + " " + it.group).toLowerCase().includes(q));
      }

      function countLabel(matches, raw) {
        const q = raw.trim();
        const n = matches.length;
        if (q.startsWith("@")) return `${n} ${n === 1 ? "file" : "files"}`;
        if (q.startsWith("/")) return `${n} ${n === 1 ? "command" : "commands"}`;
        return `${n} ${n === 1 ? "item" : "items"}`;
      }

      function applySelection(nextKey, immediate) {
        activeKey = nextKey;
        for (const it of pool) {
          const el = optEls.get(it.key);
          const sel = it.key === activeKey && !el.hidden;
          el.setAttribute("aria-selected", sel ? "true" : "false");
        }
        const activeEl = activeKey ? optEls.get(activeKey) : null;
        if (activeEl && !activeEl.hidden) {
          inputEl.setAttribute("aria-activedescendant", activeEl.id);
          frame.moveTo(activeEl, { immediate: !!immediate });
        } else {
          inputEl.removeAttribute("aria-activedescendant");
          frame.pare();
        }
      }

      function filterList(opts) {
        const o = opts || {};
        const raw = inputEl.value;
        const matches = matchItems(raw);
        const matchSet = new Set(matches.map((m) => m.key));
        const groupsShown = new Set(matches.map((m) => m.group));

        const mutate = () => {
          for (const g of poolGroups) {
            groupEls.get(g).hidden = !groupsShown.has(g);
          }
          for (const it of pool) {
            optEls.get(it.key).hidden = !matchSet.has(it.key);
          }
          emptyEl.hidden = matches.length > 0;
        };

        if (o.immediate) mutate();
        else ctx.flip(listEl, mutate);

        const cText = countLabel(matches, raw);
        if (o.immediate) countEl.textContent = cText;
        else ctx.swapText(countEl, cText);

        let nextKey = activeKey;
        if (!matchSet.has(nextKey)) {
          const pref = matches.find((m) => m.cmd.toLowerCase().startsWith(raw.trim().toLowerCase()));
          nextKey = (pref || matches[0] || {}).key || null;
        } else if (raw.trim().length > 1) {
          const pref = matches.find((m) => m.cmd.toLowerCase().startsWith(raw.trim().toLowerCase()));
          if (pref) nextKey = pref.key;
        }
        applySelection(nextKey, o.immediate);
        if (!o.immediate && !ctx.reduced()) {
          ctx.after(225, () => {
            if (!closed && !busy) applySelection(activeKey, true);
          });
        }
        if (o.announce) sr.textContent = cText;
      }

      function executeKey(key, byUser) {
        const item = pool.find((it) => it.key === key);
        if (!item || closed || busy) return;
        closed = true;
        busy = true;
        const rootEl = host.querySelector(".cm");
        inputEl.setAttribute("aria-expanded", "false");
        frame.pare();

        const prefix = item.kind === "file" ? "Pinned" : "Ran";
        ctx.pareOut(boxEl, () => {
          busy = false;
          rootEl.classList.add("is-closed");
          if (boxEl.getAnimations) boxEl.getAnimations().forEach((a) => a.cancel());
          boxEl.style.pointerEvents = "";
          boxEl.style.opacity = "";
          boxEl.style.transform = "";
          boxEl.hidden = true;
          ranEl.innerHTML = `${prefix} <code>${item.cmd}</code> · ${item.receipt}`;
          receiptEl.hidden = false;
          if (!ctx.reduced() && receiptEl.animate) {
            receiptEl.animate([{ opacity: 0, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], {
              duration: 150,
              easing: PlainPlayer.EASE_OUT,
            });
          }
          if (byUser) {
            sr.textContent = `${prefix} ${item.cmd}, ${item.receipt}.`;
            reopenBtn.focus({ preventScroll: true });
          }
        });
      }

      function reopen(byUser) {
        if (!closed || busy) return;
        closed = false;
        busy = true;
        ctx.after(180, () => { busy = false; });
        const rootEl = host.querySelector(".cm");
        ctx.flip(rootEl, () => {
          rootEl.classList.remove("is-closed");
          receiptEl.hidden = true;
          if (boxEl.getAnimations) boxEl.getAnimations().forEach((a) => a.cancel());
          boxEl.style.pointerEvents = "";
          boxEl.style.opacity = "";
          boxEl.style.transform = "";
          boxEl.hidden = false;
          inputEl.value = "/";
          inputEl.setAttribute("aria-expanded", "true");
          activeKey = "compact";
          filterList({ immediate: true });
        });
        if (!ctx.reduced()) {
          ctx.after(225, () => {
            if (!closed && !busy) applySelection(activeKey, true);
          });
        }
        if (byUser) {
          sr.textContent = `Slash palette open, ${ctx.tile ? "4" : "6"} commands.`;
          inputEl.focus({ preventScroll: true });
          inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
        }
      }

      inputEl.addEventListener("input", () => filterList({ immediate: false, announce: true }), { signal: ctx.signal });
      inputEl.addEventListener("keydown", (e) => {
        const vis = matchItems(inputEl.value);
        if (e.key === "ArrowDown" && vis.length) {
          e.preventDefault();
          const idx = vis.findIndex((it) => it.key === activeKey);
          const next = vis[(idx + 1) % vis.length];
          applySelection(next.key, false);
        } else if (e.key === "ArrowUp" && vis.length) {
          e.preventDefault();
          const idx = vis.findIndex((it) => it.key === activeKey);
          const next = vis[(idx - 1 + vis.length) % vis.length];
          applySelection(next.key, false);
        } else if (e.key === "Enter" && activeKey) {
          e.preventDefault();
          executeKey(activeKey, true);
        } else if (e.key === "Escape" && inputEl.value !== "/" && inputEl.value !== "") {
          e.preventDefault();
          inputEl.value = "/";
          filterList({ immediate: false, announce: true });
        }
      }, { signal: ctx.signal });

      for (const it of pool) {
        const el = optEls.get(it.key);
        el.addEventListener("pointerenter", () => {
          if (!closed && !busy && !el.hidden) applySelection(it.key, false);
        }, { signal: ctx.signal });
        el.addEventListener("click", () => executeKey(it.key, true), { signal: ctx.signal });
      }

      reopenBtn.addEventListener("click", () => reopen(true), { signal: ctx.signal });

      filterList({ immediate: true });

      function cycle() {
        ctx.demoAfter(1500, () => {
          applySelection("rollback", false);
          ctx.demoAfter(1100, () => {
            inputEl.value = "/c";
            filterList({ immediate: false });
            ctx.demoAfter(1100, () => {
              inputEl.value = "/co";
              filterList({ immediate: false });
              ctx.demoAfter(1200, () => {
                executeKey("compact", false);
                ctx.demoAfter(2500, () => {
                  reopen(false);
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
