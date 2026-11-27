/* Destructive Guard, redesigned in Plain (Subtraction): the safety bar begins full and drains toward zero only while
   held; releasing early springs it back to full, and reaching zero pares the entire warning gate into one receipt line. */
(function () {
  const HOLD_SEC = 1.2;

  PlainPlayer.register({
    slug: "destructive-guard",
    title: "Destructive Guard",
    tagline: "Hold until the safety bar drains to zero.",
    css: `
.ps-destructive-guard .dg { width: min(100%, 400px); display: grid; gap: 14px }
.ps-destructive-guard .dg-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-destructive-guard .dg-label { font-size: 14px; font-weight: 500; color: var(--danger) }
.ps-destructive-guard .dg-label.is-done { font-weight: 400; color: var(--muted) }
.ps-destructive-guard .dg-stage { display: grid }
.ps-destructive-guard .dg-gate { display: grid; gap: 14px }
.ps-destructive-guard .dg-cmd { padding: 2px 0; font-family: var(--mono); font-size: 12.5px; line-height: 1.45; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-destructive-guard .dg-meta { margin: -4px 0 0; font-size: 13px; color: var(--muted) }
.ps-destructive-guard .dg-bar-fill { transition: none }
.ps-destructive-guard .dg-actions { display: flex; align-items: center; padding: 2px 10px 0 }
.ps-destructive-guard .dg-hold { user-select: none; touch-action: none }
.ps-destructive-guard .dg-done { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px;
  padding: 10px 10px 10px 0; border-bottom: 1px solid var(--line); font-size: 14px }
.ps-destructive-guard .dg-done code { font-family: var(--mono); font-size: 12.5px }
.ps-destructive-guard.is-tile .dg { width: 100%; gap: 12px }
.ps-destructive-guard.is-tile .dg-gate { gap: 12px }
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="dg">
  <div class="dg-head">
    <span class="dg-label">Destructive action</span>
    <span class="fig dg-time">1.2 s left</span>
  </div>
  <div class="dg-stage">
    <div class="dg-gate">
      <div class="dg-cmd">DROP TABLE session_archive</div>
      <p class="dg-meta">18,420 expired rows · staging-db</p>
      <div class="bar-track" role="progressbar" aria-label="Safety hold remaining" aria-valuemin="0" aria-valuemax="1.2" aria-valuenow="1.2">
        <div class="bar-fill dg-bar-fill" style="--p: 1"></div>
      </div>
      <div class="dg-actions">
        <button type="button" class="q is-main is-danger dg-hold">Hold to drop</button>
      </div>
    </div>
    <div class="dg-done" hidden>
      <span>Dropped <code>session_archive</code></span>
      <button type="button" class="q is-main dg-undo">Undo snapshot</button>
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const labelEl = host.querySelector(".dg-label");
      const timeEl = host.querySelector(".dg-time");
      const stageEl = host.querySelector(".dg-stage");
      const gateEl = host.querySelector(".dg-gate");
      const trackEl = host.querySelector(".bar-track");
      const fillEl = host.querySelector(".dg-bar-fill");
      const holdBtn = host.querySelector(".dg-hold");
      const doneEl = host.querySelector(".dg-done");
      const undoBtn = host.querySelector(".dg-undo");
      const sr = host.querySelector("[aria-live]");

      let p = 1;
      let mode = "idle";
      let busy = false;
      let holdLoop = null;
      let demoLoop = null;
      let activeSpring = null;

      function renderProgress(val) {
        p = Math.max(0, Math.min(1, val));
        fillEl.style.setProperty("--p", p.toFixed(4));
        const sec = Math.max(0, p * HOLD_SEC);
        trackEl.setAttribute("aria-valuenow", sec.toFixed(1));
        timeEl.textContent = p <= 0.001 ? "0.0 s" : `${sec.toFixed(1)} s left`;
      }

      function stopLoops() {
        if (holdLoop) { holdLoop.stop = true; holdLoop = null; }
        if (demoLoop) { demoLoop.stop = true; demoLoop = null; }
        if (activeSpring) { activeSpring.stop(); activeSpring = null; }
      }

      function beginHold(byUser) {
        if (mode === "dropped" || mode === "holding" || busy) return;
        stopLoops();
        mode = "holding";
        holdBtn.setAttribute("aria-pressed", "true");
        holdLoop = ctx.loop((dt) => {
          if (mode !== "holding") return false;
          const next = Math.max(0, p - dt / HOLD_SEC);
          renderProgress(next);
          if (next <= 0) {
            completeDrop(byUser);
            return false;
          }
          return true;
        });
      }

      function releaseEarly(byUser) {
        if (mode !== "holding") return;
        stopLoops();
        mode = "returning";
        holdBtn.removeAttribute("aria-pressed");
        const sp = ctx.spring(p, (val) => {
          if (mode !== "returning") return;
          renderProgress(val);
          if (Math.abs(val - 1) < 0.001) {
            renderProgress(1);
            mode = "idle";
          }
        }, { duration: 0.22 });
        activeSpring = sp;
        sp.set(1);
        if (byUser) sr.textContent = "Held back, table untouched";
      }

      function completeDrop(byUser) {
        if (mode === "dropped" || busy) return;
        stopLoops();
        mode = "dropped";
        busy = true;
        renderProgress(0);
        holdBtn.removeAttribute("aria-pressed");
        labelEl.classList.add("is-done");
        ctx.swapText(labelEl, "Migration executed");
        ctx.swapText(timeEl, "0.0 s");
        ctx.pareOut(gateEl, () => {
          busy = false;
          gateEl.hidden = true;
          doneEl.hidden = false;
          if (byUser) {
            sr.textContent = "Dropped session_archive. Undo snapshot available.";
            undoBtn.focus({ preventScroll: true });
          }
        });
      }

      function restore(byUser) {
        if (mode !== "dropped" || busy) return;
        stopLoops();
        mode = "idle";
        ctx.flip(stageEl, () => {
          doneEl.hidden = true;
          if (gateEl.getAnimations) gateEl.getAnimations().forEach((a) => a.cancel());
          gateEl.hidden = false;
          gateEl.style.pointerEvents = "";
          gateEl.style.opacity = "";
          gateEl.style.transform = "";
          renderProgress(1);
        });
        labelEl.classList.remove("is-done");
        ctx.swapText(labelEl, "Destructive action");
        if (byUser) {
          sr.textContent = "Restored session_archive from snapshot";
          holdBtn.focus({ preventScroll: true });
        }
      }

      holdBtn.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        e.preventDefault();
        try { holdBtn.setPointerCapture(e.pointerId); } catch (err) {}
        beginHold(true);
      }, { signal: ctx.signal });

      for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) {
        holdBtn.addEventListener(ev, () => releaseEarly(true), { signal: ctx.signal });
      }

      holdBtn.addEventListener("keydown", (e) => {
        if (e.key !== " " && e.key !== "Enter") return;
        e.preventDefault();
        if (!e.repeat) beginHold(true);
      }, { signal: ctx.signal });

      holdBtn.addEventListener("keyup", (e) => {
        if (e.key === " " || e.key === "Enter") releaseEarly(true);
      }, { signal: ctx.signal });

      holdBtn.addEventListener("blur", () => releaseEarly(false), { signal: ctx.signal });
      undoBtn.addEventListener("click", () => restore(true), { signal: ctx.signal });

      ctx.onHand(() => {
        if (demoLoop) {
          demoLoop.stop = true;
          demoLoop = null;
          if (mode === "holding") releaseEarly(false);
        }
      });

      function demoHoldFor(durationMs, onDone) {
        if (ctx.handed() || mode === "dropped") return;
        mode = "holding";
        holdBtn.setAttribute("aria-pressed", "true");
        let elapsed = 0;
        demoLoop = ctx.loop((dt) => {
          if (ctx.handed() || mode !== "holding") return false;
          elapsed += dt * 1000;
          const next = Math.max(0, p - dt / HOLD_SEC);
          renderProgress(next);
          if (next <= 0) {
            demoLoop = null;
            completeDrop(false);
            if (onDone) onDone();
            return false;
          }
          if (elapsed >= durationMs) {
            demoLoop = null;
            releaseEarly(false);
            if (onDone) onDone();
            return false;
          }
          return true;
        });
      }

      function cycle() {
        ctx.demoAfter(1600, () => {
          demoHoldFor(640, () => {
            ctx.demoAfter(1700, () => {
              demoHoldFor(1400, () => {
                ctx.demoAfter(2600, () => {
                  restore(false);
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
