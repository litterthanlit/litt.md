/* Deploy Passkey, redesigned in Plain (Subtraction): six standing digits over 1px rules backed by a native numeric input;
   wrong codes warn in danger ink, and entering 482913 pares all six slots down into one deploy receipt line. */
(function () {
  const TARGET = "482913";
  let uid = 0;

  PlainPlayer.register({
    slug: "approval-code",
    title: "Deploy Passkey",
    tagline: "Six passkey digits to unlock a production deploy.",
    css: `
.ps-approval-code .ac { width: min(100%, 400px); display: grid; gap: 14px }
.ps-approval-code .ac-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px;
  padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-approval-code .ac-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-approval-code .ac-sub { font-size: 13px; color: var(--muted) }
.ps-approval-code .ac-stage { display: grid }
.ps-approval-code .ac-gate { display: grid; gap: 14px }
.ps-approval-code .ac-entry { position: relative; padding: 2px 0 0 }
.ps-approval-code .ac-input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0; border: 0;
  background: transparent; color: transparent; caret-color: transparent; opacity: 0; cursor: text }
.ps-approval-code .ac-slots { position: relative; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px }
.ps-approval-code .ac-slot { display: grid; place-items: center; height: 44px; border-bottom: 1px solid var(--line-control);
  font-size: var(--t-fig); font-weight: 500; line-height: 1.15; letter-spacing: -0.025em; font-variant-numeric: tabular-nums; color: var(--ink);
  transition: opacity var(--dur-pare) var(--ease-out), color var(--dur-instant) var(--ease-out), border-color var(--dur-instant) var(--ease-out) }
.ps-approval-code .ac-slot.is-empty:not(.is-cursor) { opacity: 0.38; font-weight: 400 }
.ps-approval-code .ac-slot.is-cursor { border-bottom-color: var(--ink); opacity: 1 }
.ps-approval-code .ac-entry:focus-within .ac-slot.is-cursor { border-bottom: 2px solid var(--focus) }
.ps-approval-code .ac-slots.is-error .ac-slot { border-bottom: 2px solid var(--danger); color: var(--danger); opacity: 1 }
.ps-approval-code .ac-msg { margin: -2px 0 0; font-size: 13px; color: var(--danger) }
.ps-approval-code .ac-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 24px; padding: 2px 10px 0 }
.ps-approval-code .ac-done { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px;
  padding: 10px 10px 10px 0; border-bottom: 1px solid var(--line); font-size: 14px }
.ps-approval-code.is-tile .ac { width: 100%; gap: 12px }
.ps-approval-code.is-tile .ac-gate { gap: 12px }
.ps-approval-code.is-tile .ac-slots { gap: 10px }
.ps-approval-code.is-tile .ac-slot { height: 40px }
`,
    mount(host, ctx) {
      const id = "ps-ac-" + ++uid;
      host.innerHTML = `
<div class="ac">
  <div class="ac-head">
    <h3>Production deploy · v2.14.0</h3>
    <span class="ac-sub">Confirm passkey</span>
  </div>
  <div class="ac-stage">
    <div class="ac-gate">
      <div class="ac-entry">
        <label class="sr-only" for="${id}-in">Six-digit deploy passkey</label>
        <div class="ac-slots" aria-hidden="true">
          ${[0, 1, 2, 3, 4, 5].map((i) => `<span class="ac-slot" data-slot="${i}"></span>`).join("")}
        </div>
        <input id="${id}-in" class="ac-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value="4829" aria-invalid="false">
      </div>
      <p class="ac-msg" hidden></p>
      <div class="ac-actions">
        <button type="button" class="q is-main ac-paste">Paste 482 913</button>
        <button type="button" class="q ac-wrong">Test wrong</button>
      </div>
    </div>
    <div class="ac-done" hidden>
      <span>Verified · Deploying v2.14.0</span>
      <button type="button" class="q is-main ac-lock">Lock again</button>
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const subEl = host.querySelector(".ac-sub");
      const stageEl = host.querySelector(".ac-stage");
      const gateEl = host.querySelector(".ac-gate");
      const slotsWrap = host.querySelector(".ac-slots");
      const slots = [...slotsWrap.querySelectorAll(".ac-slot")];
      const input = host.querySelector(".ac-input");
      const msgEl = host.querySelector(".ac-msg");
      const pasteBtn = host.querySelector(".ac-paste");
      const wrongBtn = host.querySelector(".ac-wrong");
      const doneEl = host.querySelector(".ac-done");
      const lockBtn = host.querySelector(".ac-lock");
      const sr = host.querySelector("[aria-live]");

      let code = "4829";
      let unlocked = false;
      let busy = false;
      let unlockTimer = 0;

      function syncSlots(immediate) {
        const isErr = code.length === 6 && code !== TARGET;
        slotsWrap.classList.toggle("is-error", isErr);
        input.setAttribute("aria-invalid", isErr ? "true" : "false");
        const cursorIdx = code.length < 6 ? code.length : -1;

        slots.forEach((el, i) => {
          const ch = code[i] || "";
          el.textContent = ch;
          el.classList.toggle("is-empty", !ch);
          el.classList.toggle("is-cursor", i === cursorIdx);
        });

        const nextHidden = !isErr;
        if (msgEl.hidden !== nextHidden) {
          const toggle = () => {
            msgEl.hidden = nextHidden;
            msgEl.textContent = isErr ? "Invalid passkey · deploy stays locked" : "";
          };
          if (immediate) toggle();
          else ctx.flip(gateEl, toggle);
        } else if (isErr) {
          msgEl.textContent = "Invalid passkey · deploy stays locked";
        }
      }

      function applyCode(next, opts) {
        const o = Object.assign({ immediate: false, byUser: false, fromDemo: false }, opts);
        if (unlocked || busy) return;
        clearTimeout(unlockTimer);
        code = String(next).replace(/\D/g, "").slice(0, 6);
        input.value = code;
        syncSlots(o.immediate);

        if (code === TARGET) {
          const finish = () => {
            if (unlocked || busy || code !== TARGET) return;
            unlocked = true;
            busy = true;
            ctx.swapText(subEl, "Unlocked");
            ctx.pareOut(gateEl, () => {
              busy = false;
              if (!unlocked) return;
              gateEl.hidden = true;
              doneEl.hidden = false;
              if (o.byUser) {
                sr.textContent = "Verified. Deploying v2.14.0.";
                lockBtn.focus({ preventScroll: true });
              }
            });
          };
          if (ctx.reduced() || o.immediate) finish();
          else unlockTimer = o.fromDemo ? ctx.demoAfter(220, finish) : ctx.after(200, finish);
        } else if (code.length === 6 && o.byUser) {
          sr.textContent = "Invalid passkey, deploy stays locked";
        }
      }

      function lockAgain(byUser) {
        if (!unlocked || busy) return;
        unlocked = false;
        clearTimeout(unlockTimer);
        ctx.flip(stageEl, () => {
          doneEl.hidden = true;
          if (gateEl.getAnimations) gateEl.getAnimations().forEach((a) => a.cancel());
          gateEl.hidden = false;
          gateEl.style.pointerEvents = "";
          gateEl.style.opacity = "";
          gateEl.style.transform = "";
          code = "4829";
          input.value = code;
          syncSlots(true);
        });
        ctx.swapText(subEl, "Confirm passkey");
        if (byUser) {
          sr.textContent = "Deploy locked again";
          input.focus({ preventScroll: true });
          try { input.setSelectionRange(code.length, code.length); } catch (e) {}
        }
      }

      input.addEventListener("focus", () => {
        try { input.setSelectionRange(code.length, code.length); } catch (e) {}
      }, { signal: ctx.signal });

      input.addEventListener("keydown", (e) => {
        if (/^\d$/.test(e.key) && code.length === 6 && code !== TARGET) {
          e.preventDefault();
          applyCode("4829" + e.key, { byUser: true });
        }
      }, { signal: ctx.signal });

      input.addEventListener("input", () => {
        applyCode(input.value, { byUser: true });
      }, { signal: ctx.signal });

      input.addEventListener("paste", (e) => {
        const raw = (e.clipboardData && e.clipboardData.getData("text")) || "";
        const digits = raw.replace(/\D/g, "");
        if (!digits) return;
        e.preventDefault();
        const combined = digits.length >= 6 ? digits.slice(0, 6) : (code.length === 6 ? digits : code + digits).slice(0, 6);
        applyCode(combined, { byUser: true });
      }, { signal: ctx.signal });

      pasteBtn.addEventListener("click", () => applyCode(TARGET, { byUser: true }), { signal: ctx.signal });
      wrongBtn.addEventListener("click", () => {
        applyCode("482907", { byUser: true });
        input.focus({ preventScroll: true });
      }, { signal: ctx.signal });
      lockBtn.addEventListener("click", () => lockAgain(true), { signal: ctx.signal });

      syncSlots(true);

      function cycle() {
        ctx.demoAfter(1800, () => {
          applyCode("482907", { fromDemo: true });
          ctx.demoAfter(1800, () => {
            applyCode(TARGET, { fromDemo: true });
            ctx.demoAfter(2800, () => {
              lockAgain(false);
              cycle();
            });
          });
        });
      }
      cycle();
    },
  });
})();
