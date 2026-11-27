/* Session Handoff, redesigned in Plain (Subtraction): switch between Resume CLI and Checkout branch; pressing Copy
   swaps Copy -> Copied inside clean corner hairlines and steps surrounding chrome back so the command stands alone. */
(function () {
  const MODES = [
    {
      key: "cli",
      label: "Resume CLI",
      cmd: "claude --resume run_9f4c2a",
      note: "Replays 41k tok context in your local terminal",
    },
    {
      key: "git",
      label: "Checkout branch",
      cmd: "git switch -c agent/session-ttl origin/agent/session-ttl",
      note: "Fetches PR #184 branch with 2 staged edits",
    },
  ];
  let uid = 0;

  function writeClip(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    } catch (e) {}
  }

  PlainPlayer.register({
    slug: "handoff-command",
    title: "Session Handoff",
    tagline: "Copy the resume command to take over locally.",
    css: `
.ps-handoff-command .hc { width: min(100%, 420px); display: grid; gap: 14px }
.ps-handoff-command .hc-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--line) }
.ps-handoff-command .hc-tabs { display: flex; align-items: baseline; gap: 20px }
.ps-handoff-command .hc-tab { all: unset; box-sizing: border-box; position: relative; padding: 0 0 10px; margin-bottom: -1px;
  font: 400 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em; color: var(--ink); opacity: var(--unselected); border-bottom: 2px solid transparent;
  white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: opacity var(--dur-pare) var(--ease-out), border-color var(--dur-instant) var(--ease-out) }
.ps-handoff-command .hc-tab:hover { opacity: 0.85 }
.ps-handoff-command .hc-tab[aria-selected="true"] { font-weight: 500; opacity: 1; border-bottom-color: var(--ink) }
.ps-handoff-command .hc-tab:focus-visible { opacity: 1; outline: 2px solid var(--focus); outline-offset: 3px }
.ps-handoff-command .hc-status { font-size: 13px; color: var(--muted); white-space: nowrap }
.ps-handoff-command .hc-box { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 16px;
  padding: 12px 10px 12px 0; border-bottom: 1px solid var(--line) }
.ps-handoff-command .hc-cmd { font-family: var(--mono); font-size: 12.5px; line-height: 1.45; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; user-select: all }
.ps-handoff-command .hc-copy { min-height: 28px }
.ps-handoff-command .hc-note { margin: 0; font-size: 13px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-handoff-command.is-tile .hc { width: 100%; gap: 12px }
.ps-handoff-command.is-tile .hc-tabs { gap: 18px }
@container (max-width: 295px) {
  .ps-handoff-command .hc-status { display: none }
}
`,
    mount(host, ctx) {
      const id = "ps-hc-" + ++uid;
      host.innerHTML = `
<div class="hc" data-focus-group>
  <div class="hc-head">
    <div class="hc-tabs" role="tablist" aria-label="Session handoff mode">
      ${MODES.map((m) => `<button type="button" class="hc-tab" role="tab" id="${id}-${m.key}" aria-selected="false" aria-controls="${id}-panel" tabindex="-1" data-mode="${m.key}">${m.label}</button>`).join("")}
    </div>
    <span class="hc-status">Paused</span>
  </div>
  <div class="hc-box" id="${id}-panel" role="tabpanel" data-active>
    <code class="hc-cmd"></code>
    <button type="button" class="q is-main hc-copy">Copy</button>
  </div>
  <p class="hc-note"></p>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const rootEl = host.querySelector(".hc");
      const tabsEl = host.querySelector(".hc-tabs");
      const tabs = [...tabsEl.querySelectorAll('[role="tab"]')];
      const panelEl = host.querySelector(".hc-box");
      const cmdEl = host.querySelector(".hc-cmd");
      const copyBtn = host.querySelector(".hc-copy");
      const noteEl = host.querySelector(".hc-note");
      const sr = host.querySelector("[aria-live]");

      let curIdx = 0;
      let copyTimer = 0;

      function resetCopyState(immediate) {
        clearTimeout(copyTimer);
        copyTimer = 0;
        rootEl.removeAttribute("data-focusing");
        if (copyBtn._pmSwap) {
          try { copyBtn._pmSwap.cancel(); } catch (e) {}
          copyBtn._pmSwap = null;
        }
        if (copyBtn.getAnimations) copyBtn.getAnimations().forEach((a) => a.cancel());
        if (immediate) copyBtn.textContent = "Copy";
        else ctx.swapText(copyBtn, "Copy");
      }

      function selectMode(idx, opts) {
        const o = Object.assign({ immediate: false, byUser: false, focusTab: false }, opts);
        curIdx = idx;
        const m = MODES[idx];
        resetCopyState(o.immediate);

        tabs.forEach((btn, i) => {
          const on = i === idx;
          btn.setAttribute("aria-selected", on ? "true" : "false");
          btn.tabIndex = on ? 0 : -1;
          if (on) {
            panelEl.setAttribute("aria-labelledby", btn.id);
            if (o.focusTab) btn.focus({ preventScroll: true });
          }
        });

        if (o.immediate) {
          cmdEl.textContent = m.cmd;
          noteEl.textContent = m.note;
        } else {
          ctx.swapText(cmdEl, m.cmd);
          ctx.swapText(noteEl, m.note);
        }

        if (o.byUser) sr.textContent = `${m.label}: ${m.cmd}`;
      }

      function triggerCopy(byUser, fromDemo) {
        clearTimeout(copyTimer);
        const m = MODES[curIdx];
        if (byUser) writeClip(m.cmd);
        rootEl.setAttribute("data-focusing", "");
        ctx.swapText(copyBtn, "Copied");
        if (byUser) sr.textContent = `Copied ${m.cmd}`;

        const restore = () => resetCopyState(false);
        copyTimer = fromDemo ? ctx.demoAfter(1600, restore) : ctx.after(1600, restore);
      }

      tabs.forEach((btn, i) => {
        btn.addEventListener("click", () => selectMode(i, { byUser: true }), { signal: ctx.signal });
      });

      tabsEl.addEventListener("keydown", (e) => {
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (curIdx + 1) % MODES.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (curIdx - 1 + MODES.length) % MODES.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = MODES.length - 1;
        if (next >= 0) {
          e.preventDefault();
          selectMode(next, { byUser: true, focusTab: true });
        }
      }, { signal: ctx.signal });

      copyBtn.addEventListener("click", () => triggerCopy(true, false), { signal: ctx.signal });

      selectMode(0, { immediate: true });

      function cycle() {
        ctx.demoAfter(1800, () => {
          triggerCopy(false, true);
          ctx.demoAfter(2300, () => {
            selectMode(1);
            ctx.demoAfter(1800, () => {
              triggerCopy(false, true);
              ctx.demoAfter(2300, () => {
                selectMode(0);
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
