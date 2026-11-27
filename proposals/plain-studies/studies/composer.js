/* Prompt Composer, redesigned in Plain (Subtraction): context files sit above a 1px input rule and three quiet prompt
   starters. Removing a file pares it away; picking a starter or typing subtracts the suggestions so only your prompt
   and Send remain. */
(function () {
  const ALL_FILES = [
    { id: "verify", label: "@verify.ts", tok: 1.1 },
    { id: "session", label: "@session.ts", tok: 0.7 },
    { id: "test", label: "@test.ts", tok: 0.9 },
  ];

  const SUGGESTIONS = [
    { label: "Add regression test", prompt: "Add regression test for expired cookie handling" },
    { label: "Check all callers", prompt: "Check all callers of parseCookie across src/auth" },
    { label: "Explain diff", prompt: "Explain the expired cookie fallback diff in verify.ts" },
  ];

  let uid = 0;

  PlainPlayer.register({
    slug: "composer",
    title: "Prompt Composer",
    tagline: "Attach files, pare suggestions on input, and send.",
    css: `
.ps-composer .cp { width: min(100%, 430px); display: grid; gap: 14px }
.ps-composer .cp-ctx { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; min-height: 24px }
.ps-composer .cp-chip { display: inline-flex; align-items: center; gap: 5px; min-height: 24px; padding: 2px 0; border: 0;
  background: none; font-family: var(--mono); font-size: 12.5px; color: var(--ink); opacity: 0.72; cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: opacity var(--dur-instant) var(--ease-out) }
.ps-composer .cp-chip:hover:not(:disabled), .ps-composer .cp-chip:focus-visible { opacity: 1 }
.ps-composer .cp-chip:disabled { opacity: 0.35; cursor: not-allowed }
.ps-composer .cp-chip-x { color: var(--muted); font-family: var(--font) }
.ps-composer .cp-chip:hover:not(:disabled) .cp-chip-x { color: var(--ink) }
.ps-composer .cp-add { display: inline-flex; align-items: center; min-height: 24px; padding: 2px 0; border: 0; background: none;
  font-family: var(--mono); font-size: 12.5px; color: var(--ink); opacity: var(--unselected); cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: opacity var(--dur-instant) var(--ease-out) }
.ps-composer .cp-add:hover:not(:disabled) { opacity: 1; text-decoration: underline; text-underline-offset: 2px }
.ps-composer .cp-body { display: grid; gap: 14px }
.ps-composer .cp-input { font-size: 15px; line-height: 1.45; padding: 10px 0; min-height: 42px; resize: none }
.ps-composer .cp-input::placeholder { color: var(--muted); opacity: 1 }
.ps-composer .cp-input[readonly] { color: var(--muted) }
.ps-composer .cp-sugs { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 20px }
.ps-composer .cp-sug { min-height: 26px; padding: 0; border: 0; background: none; font-size: 13px; color: var(--ink); opacity: var(--unselected); cursor: pointer;
  -webkit-tap-highlight-color: transparent; transition: opacity var(--dur-pare) var(--ease-out) }
.ps-composer .cp-sug:hover, .ps-composer .cp-sug:focus-visible { opacity: 1; text-decoration: underline; text-underline-offset: 3px }
.ps-composer .cp-foot { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding-right: 10px }
.ps-composer .cp-meta { margin-right: auto; font-size: var(--t-meta); color: var(--muted) }
.ps-composer .cp-meta.is-live { color: var(--ink); font-weight: 500 }
.ps-composer .cp-acts { display: inline-flex; align-items: center; gap: 20px }
.ps-composer.is-tile .cp { width: 100%; gap: 14px }
.ps-composer.is-tile .cp-body { gap: 14px }
.ps-composer.is-tile .cp-input { font-size: 14px; min-height: 40px }
`,
    mount(host, ctx) {
      const inputId = "ps-cp-in-" + ++uid;
      host.innerHTML = `
<div class="cp">
  <div class="cp-ctx" role="group" aria-label="Attached context files"></div>
  <div class="cp-body">
    <div>
      <label class="sr-only" for="${inputId}">Agent prompt</label>
      <input type="text" id="${inputId}" class="field cp-input" placeholder="Check expired cookie handling in…" autocomplete="off" />
    </div>
    <div class="cp-sugs" role="group" aria-label="Prompt suggestions">
      ${SUGGESTIONS.map((s, i) => `<button type="button" class="cp-sug" data-sug="${i}">${s.label}</button>`).join("")}
    </div>
    <div class="cp-foot">
      <span class="cp-meta" hidden></span>
      <span class="cp-acts">
        <button type="button" class="q is-main cp-send">Send</button>
        <button type="button" class="q cp-stop" hidden>Stop</button>
        <button type="button" class="q is-main cp-new" hidden>New prompt</button>
      </span>
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const ctxRow = host.querySelector(".cp-ctx");
      const bodyEl = host.querySelector(".cp-body");
      const inputEl = host.querySelector(".cp-input");
      const sugsEl = host.querySelector(".cp-sugs");
      const metaEl = host.querySelector(".cp-meta");
      const sendBtn = host.querySelector(".cp-send");
      const stopBtn = host.querySelector(".cp-stop");
      const newBtn = host.querySelector(".cp-new");
      const sr = host.querySelector("[aria-live]");

      let attached = ["verify", "session"];
      let paredOnce = false;
      let sugsHidden = false;
      let sugsParing = false;
      let state = "idle";
      let runToken = 0;

      function restoreEl(el) {
        el.style.pointerEvents = "";
        if (el.getAnimations) el.getAnimations().forEach((a) => a.cancel());
        el.hidden = false;
      }

      function renderChips() {
        ctxRow.textContent = "";
        for (const id of attached) {
          const f = ALL_FILES.find((x) => x.id === id);
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "cp-chip";
          btn.dataset.file = id;
          btn.disabled = state !== "idle";
          btn.setAttribute("aria-label", `Remove ${f.label}`);
          btn.innerHTML = `<span>${f.label}</span><span class="cp-chip-x" aria-hidden="true">×</span>`;
          btn.addEventListener("click", () => removeChip(id, btn, true), { signal: ctx.signal });
          ctxRow.appendChild(btn);
        }
        if (paredOnce && attached.length < 2 && state === "idle") {
          const candidate = ALL_FILES.find((x) => x.id === "test" && !attached.includes("test"))
            || ALL_FILES.find((x) => !attached.includes(x.id));
          if (candidate) {
            const addBtn = document.createElement("button");
            addBtn.type = "button";
            addBtn.className = "cp-add";
            addBtn.textContent = `+ Add ${candidate.label}`;
            addBtn.addEventListener("click", () => addChip(candidate.id, true), { signal: ctx.signal });
            ctxRow.appendChild(addBtn);
          }
        }
      }

      function removeChip(id, chipEl, byUser) {
        if (state !== "idle" || !attached.includes(id) || chipEl.dataset.paring) return;
        chipEl.dataset.paring = "1";
        paredOnce = true;
        ctx.pareOut(chipEl, () => {
          attached = attached.filter((x) => x !== id);
          renderChips();
          if (byUser) {
            const f = ALL_FILES.find((x) => x.id === id);
            sr.textContent = `Removed ${f.label}.`;
            const nextFocus = ctxRow.querySelector("button") || inputEl;
            nextFocus.focus({ preventScroll: true });
          }
        });
      }

      function addChip(id, byUser) {
        if (state !== "idle" || attached.includes(id)) return;
        ctx.flip(ctxRow, () => {
          attached.push(id);
          renderChips();
        });
        if (byUser) {
          const f = ALL_FILES.find((x) => x.id === id);
          sr.textContent = `Added ${f.label}.`;
          const added = ctxRow.querySelector(`[data-file="${id}"]`);
          if (added) added.focus({ preventScroll: true });
        }
      }

      function hideSuggestions() {
        if (sugsHidden || sugsParing) return;
        sugsParing = true;
        ctx.pareOut(sugsEl, () => {
          if (!sugsParing) return;
          sugsEl.hidden = true;
          sugsHidden = true;
          sugsParing = false;
        });
      }

      function showSuggestions() {
        if (!sugsHidden && !sugsParing) return;
        sugsParing = false;
        sugsHidden = false;
        ctx.flip(bodyEl, () => {
          restoreEl(sugsEl);
        });
      }

      function pickSuggestion(idx, byUser) {
        if (state !== "idle") return;
        inputEl.value = SUGGESTIONS[idx].prompt;
        hideSuggestions();
        if (byUser) {
          sr.textContent = `Prompt set: ${SUGGESTIONS[idx].prompt}. Suggestions hidden.`;
          sendBtn.focus({ preventScroll: true });
        }
      }

      function sendPrompt(byUser) {
        if (state !== "idle") return;
        if (!inputEl.value.trim()) {
          inputEl.value = "Check expired cookie handling in verify.ts";
        }
        hideSuggestions();
        state = "running";
        const myToken = ++runToken;
        inputEl.readOnly = true;
        renderChips();
        sendBtn.hidden = true;
        stopBtn.hidden = false;
        newBtn.hidden = true;
        metaEl.hidden = false;
        metaEl.classList.add("is-live");
        metaEl.textContent = "Running · 0.4 s";
        if (byUser) {
          sr.textContent = "Dispatching prompt to agent.";
          stopBtn.focus({ preventScroll: true });
        }

        const wait = byUser ? ctx.after : ctx.demoAfter;
        wait(400, () => {
          if (runToken !== myToken || state !== "running") return;
          metaEl.textContent = "Running · 0.8 s";
          wait(400, () => {
            if (runToken !== myToken || state !== "running") return;
            metaEl.textContent = "Running · 1.2 s";
            wait(420, () => {
              if (runToken !== myToken || state !== "running") return;
              completeSend(byUser);
              if (!byUser) scheduleCycle();
            });
          });
        });
      }

      function completeSend(byUser) {
        state = "sent";
        runToken++;
        stopBtn.hidden = true;
        newBtn.hidden = false;
        metaEl.hidden = false;
        metaEl.classList.remove("is-live");
        ctx.swapText(metaEl, "Sent · +8 −3");
        if (byUser) {
          sr.textContent = "Prompt completed: +8 −3.";
          newBtn.focus({ preventScroll: true });
        }
      }

      function stopRun(byUser) {
        if (state !== "running") return;
        state = "sent";
        runToken++;
        stopBtn.hidden = true;
        newBtn.hidden = false;
        metaEl.hidden = false;
        metaEl.classList.remove("is-live");
        ctx.swapText(metaEl, "Stopped · 0 changes");
        if (byUser) {
          sr.textContent = "Agent stopped.";
          newBtn.focus({ preventScroll: true });
        }
      }

      function resetPrompt(byUser) {
        state = "idle";
        runToken++;
        inputEl.readOnly = false;
        inputEl.value = "";
        if (!byUser) {
          attached = ["verify", "session"];
          paredOnce = false;
        }
        renderChips();
        sendBtn.hidden = false;
        stopBtn.hidden = true;
        newBtn.hidden = true;
        metaEl.hidden = true;
        metaEl.classList.remove("is-live");
        metaEl.textContent = "";
        showSuggestions();
        if (byUser) {
          sr.textContent = "Ready for a new prompt.";
          inputEl.focus({ preventScroll: true });
        }
      }

      inputEl.addEventListener("input", () => {
        if (inputEl.value.trim().length > 0) hideSuggestions();
        else if (state === "idle") showSuggestions();
      }, { signal: ctx.signal });

      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && state === "idle") {
          e.preventDefault();
          sendPrompt(true);
        }
      }, { signal: ctx.signal });

      for (const btn of sugsEl.querySelectorAll("[data-sug]")) {
        btn.addEventListener("click", () => pickSuggestion(+btn.dataset.sug, true), { signal: ctx.signal });
      }
      sendBtn.addEventListener("click", () => sendPrompt(true), { signal: ctx.signal });
      stopBtn.addEventListener("click", () => stopRun(true), { signal: ctx.signal });
      newBtn.addEventListener("click", () => resetPrompt(true), { signal: ctx.signal });

      ctx.onHand(() => {
        if (state === "running") {
          const myToken = ++runToken;
          ctx.after(600, () => {
            if (runToken === myToken && state === "running") completeSend(false);
          });
        }
      });

      renderChips();

      function scheduleCycle() {
        ctx.demoAfter(2500, () => {
          resetPrompt(false);
          cycle();
        });
      }

      function cycle() {
        ctx.demoAfter(1800, () => {
          pickSuggestion(0, false);
          ctx.demoAfter(1100, () => {
            sendPrompt(false);
          });
        });
      }
      cycle();
    },
  });
})();
