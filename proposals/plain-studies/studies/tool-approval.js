/* Tool Approval, redesigned in Plain (Subtraction): earlier work steps back while the agent waits on one command;
   pressing Allow or Skip pares the prompt and buttons away into a single ledger receipt row. */
(function () {
  PlainPlayer.register({
    slug: "tool-approval",
    title: "Tool Approval",
    tagline: "Approve a command; the prompt pares into one receipt.",
    css: `
.ps-tool-approval .ta { width: min(100%, 420px); display: grid; gap: 14px }
.ps-tool-approval .ta-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-tool-approval .ta-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-tool-approval .ta-status { font-size: 13px; color: var(--ink); font-weight: 500 }
.ps-tool-approval .ta-status.is-done { color: var(--muted); font-weight: 400 }
.ps-tool-approval .ta-list { display: grid }
.ps-tool-approval .ta-row { display: grid; grid-template-columns: 24px 44px minmax(0, 1fr) auto; align-items: baseline; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 14px }
.ps-tool-approval .ta-num { color: var(--muted); font-size: 12.5px }
.ps-tool-approval .ta-verb { font-weight: 500 }
.ps-tool-approval .ta-target { font-family: var(--mono); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-tool-approval .ta-word { color: var(--muted); font-size: 13px; white-space: nowrap }
.ps-tool-approval .ta-gate { padding: 16px 0 2px; display: grid; gap: 12px }
.ps-tool-approval .ta-cmd { border-left: 2px solid var(--ink); padding: 4px 0 4px 12px; font-family: var(--mono); font-size: 12.5px; line-height: 1.45; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-tool-approval .ta-why { margin: -2px 0 0; font-size: 13px; color: var(--muted) }
.ps-tool-approval .ta-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 24px; padding: 2px 10px 0 }
.ps-tool-approval .ta-foot { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 2px 10px 0 0; font-size: 13px }
.ps-tool-approval.is-tile .ta { width: 100%; gap: 10px }
.ps-tool-approval.is-tile .ta-row { padding: 8px 0; font-size: 13.5px }
.ps-tool-approval.is-tile .ta-gate { padding: 12px 0 0; gap: 10px }
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="ta">
  <div class="ta-head">
    <h3>Fix session expiry</h3>
    <span class="ta-status">Needs your OK</span>
  </div>
  <div class="ta-list" data-focus-group data-focusing>
    <div class="ta-row"><span class="ta-num">01</span><span class="ta-verb">Edit</span><span class="ta-target">src/auth/verify.ts</span><span class="ta-word">+6 −2</span></div>
    <div class="ta-gate" data-active>
      <div class="ta-cmd">git push origin agent/session-ttl</div>
      <p class="ta-why">Updates PR #184 · 14 tests green</p>
      <div class="ta-actions" role="group" aria-label="Approve command">
        <button type="button" class="q is-main" data-act="allow">Allow</button>
        <button type="button" class="q" data-act="session">Always allow</button>
        <button type="button" class="q" data-act="skip">Skip</button>
      </div>
    </div>
  </div>
  <div class="ta-foot" hidden>
    <span class="ta-summary muted"></span>
    <button type="button" class="q ta-replay">Ask again</button>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const list = host.querySelector(".ta-list");
      const status = host.querySelector(".ta-status");
      const foot = host.querySelector(".ta-foot");
      const summary = host.querySelector(".ta-summary");
      const replay = host.querySelector(".ta-replay");
      const sr = host.querySelector("[aria-live]");
      let state = "waiting";
      let busy = false;

      function decide(kind, byUser) {
        if (state !== "waiting" || busy) return;
        state = kind;
        busy = true;
        const gate = list.querySelector(".ta-gate");
        const word = kind === "skip" ? "Skipped" : kind === "session" ? "Allowed (always)" : "Allowed";
        const note = kind === "skip" ? "Kept local" : "PR #184 updated";
        list.removeAttribute("data-focusing");
        ctx.pareOut(gate, () => {
          busy = false;
          if (gate) gate.remove();
          const row = document.createElement("div");
          row.className = "ta-row";
          row.innerHTML = `<span class="ta-num">02</span><span class="ta-verb">Push</span><span class="ta-target">origin/agent/session-ttl</span><span class="ta-word">${word}</span>`;
          list.appendChild(row);
          foot.hidden = false;
          summary.textContent = note;
          status.classList.add("is-done");
          ctx.swapText(status, kind === "skip" ? "Stopped" : "Done");
          if (byUser) { sr.textContent = word + ". " + note; replay.focus({ preventScroll: true }); }
        });
      }

      function reset(byUser) {
        if (state === "waiting" || busy) return;
        state = "waiting";
        ctx.flip(list, () => {
          list.querySelectorAll(".ta-gate").forEach((g) => g.remove());
          const second = list.querySelectorAll(".ta-row")[1];
          if (second) second.remove();
          foot.hidden = true;
          const gate = document.createElement("div");
          gate.className = "ta-gate";
          gate.setAttribute("data-active", "");
          gate.innerHTML = `
      <div class="ta-cmd">git push origin agent/session-ttl</div>
      <p class="ta-why">Updates PR #184 · 14 tests green</p>
      <div class="ta-actions" role="group" aria-label="Approve command">
        <button type="button" class="q is-main" data-act="allow">Allow</button>
        <button type="button" class="q" data-act="session">Always allow</button>
        <button type="button" class="q" data-act="skip">Skip</button>
      </div>`;
          list.appendChild(gate);
          list.setAttribute("data-focusing", "");
          bindGate(gate);
        });
        status.classList.remove("is-done");
        ctx.swapText(status, "Needs your OK");
        if (byUser) {
          const allowBtn = list.querySelector('[data-act="allow"]');
          if (allowBtn) allowBtn.focus({ preventScroll: true });
        }
      }

      function bindGate(gate) {
        for (const btn of gate.querySelectorAll("[data-act]")) {
          btn.addEventListener("click", () => decide(btn.dataset.act, true), { signal: ctx.signal });
        }
      }
      bindGate(list.querySelector(".ta-gate"));
      replay.addEventListener("click", () => reset(true), { signal: ctx.signal });

      function cycle() {
        ctx.demoAfter(2400, () => {
          decide("allow", false);
          ctx.demoAfter(2800, () => {
            reset(false);
            cycle();
          });
        });
      }
      cycle();
    },
  });
})();
