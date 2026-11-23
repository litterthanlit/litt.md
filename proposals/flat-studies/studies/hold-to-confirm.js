/* Hold to Confirm, redesigned for Flat: a destructive action that asks for intent. A draft on paper, and a Delete pill that
   fills with the ink from the left while you hold it; let go early and it runs back. Once full, the draft is deleted and
   the pill turns into Undo. The hold logic is the original's: 1200 ms to fill, 220 ms to run back, lit a moment once done. */
(function () {
  const DURATION = 1200, REWIND = 220, HOLD_LIT = 450;
  const DRAFTS = [
    { title: "Spring issue", meta: "412 words, edited Tuesday" },
    { title: "Notes from the garden", meta: "1,080 words, edited yesterday" },
    { title: "Reader letters, March", meta: "236 words, edited today" },
  ];
  let n = 0;

  FlatPlayer.register({
    slug: "hold-to-confirm",
    title: "Hold to Confirm",
    tagline: "Hold the button until it fills.",
    css: `
.fs-hold-to-confirm .hc { width: min(21em, 100%); font-size: clamp(13px, calc(2.2cqw + 6px), 16px); background: var(--paper); border-radius: var(--r-paper);
  padding: 1.25em; display: grid; gap: 1.25em; -webkit-user-select: none; user-select: none }
.fs-hold-to-confirm .hc-draft { display: grid; gap: 0.2em; min-width: 0 }
.fs-hold-to-confirm .hc-kicker { font-size: 0.87em; color: var(--muted) }
.fs-hold-to-confirm .hc-title { font-size: 1.45em; font-weight: 600; letter-spacing: -0.02em; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-hold-to-confirm .hc-meta { font-size: 0.93em; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-hold-to-confirm .is-gone .hc-title { color: var(--muted); text-decoration: line-through; text-decoration-thickness: 2px }
.fs-hold-to-confirm .hc-slot { position: relative; height: 3.25em }
.fs-hold-to-confirm .hc-btn { position: absolute; inset: 0; border: 0; padding: 0; border-radius: var(--r-pill); background: var(--bubble); color: var(--ink);
  font-weight: 500; cursor: pointer; overflow: hidden; touch-action: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1) }
.fs-hold-to-confirm .hc-btn[data-pressed] { transform: scale(0.98); transition-duration: 75ms }
.fs-hold-to-confirm .hc-btn span { position: absolute; inset: 0; display: grid; place-items: center }
.fs-hold-to-confirm .hc-fill { background: var(--ink); color: var(--on-ink); clip-path: inset(0 calc(100% - var(--p, 0) * 100%) 0 0 round var(--r-pill)) }
.fs-hold-to-confirm .hc-done { position: absolute; inset: 0; display: flex; align-items: center; justify-content: space-between; gap: 0.75em; padding-left: 0.25em }
.fs-hold-to-confirm .hc-done[hidden] { display: none }
.fs-hold-to-confirm .hc-done b { font-weight: 500 }
.fs-hold-to-confirm .hc-undo { height: 100%; padding: 0 1.5em; border: 0; border-radius: var(--r-pill); background: var(--ink); color: var(--on-ink); font-weight: 500;
  cursor: pointer; transition: transform 100ms }
.fs-hold-to-confirm .hc-undo:active { transform: scale(0.97) }
`,
    mount(host, ctx) {
      const id = "hc" + ++n;
      host.innerHTML = `
<div class="hc">
  <div class="hc-draft"><span class="hc-kicker">Draft</span><span class="hc-title"></span><span class="hc-meta"></span></div>
  <div class="hc-slot">
    <button class="hc-btn" type="button" aria-describedby="${id}-hint"><span>Hold to delete</span><span class="hc-fill" aria-hidden="true">Hold to delete</span></button>
    <div class="hc-done" hidden><b>Draft deleted</b><button class="hc-undo" type="button">Undo</button></div>
  </div>
  <span id="${id}-hint" class="sr-only">Press and hold to delete this draft</span>
  <p class="sr-only" role="status" aria-live="polite"></p>
</div>`;
      const sig = { signal: ctx.signal };
      const draftEl = host.querySelector(".hc-draft"), titleEl = host.querySelector(".hc-title"), metaEl = host.querySelector(".hc-meta"), kicker = host.querySelector(".hc-kicker");
      const btn = host.querySelector(".hc-btn"), done = host.querySelector(".hc-done"), undo = host.querySelector(".hc-undo"), live = host.querySelector("[role=status]");
      let which = 0, deleted = false, nextTimer = 0;

      function showDraft(arrive) {
        const d = DRAFTS[which];
        titleEl.textContent = d.title; metaEl.textContent = d.meta;
        kicker.textContent = deleted ? "Deleted" : "Draft";
        draftEl.classList.toggle("is-gone", deleted);
        btn.hidden = deleted; done.hidden = !deleted;
        if (arrive) {
          const s = ctx.spring(12, (y) => { draftEl.style.transform = "translateY(" + y.toFixed(2) + "px)"; draftEl.style.opacity = String(Math.max(0, 1 - y / 12)); }, { bounce: 0.28 });
          s.set(0);
        }
      }
      showDraft(false);

      /* The fill: grows while held, runs back when let go, stays full a moment once the action has run. */
      let p = 0, holding = false, ghost = false, litUntil = 0, loop = null;
      const draw = () => btn.style.setProperty("--p", p.toFixed(4));
      function frame(dt, now) {
        if (holding) {
          p = Math.min(1, p + (dt * 1000) / DURATION);
          if (p >= 1) { holding = false; litUntil = now + HOLD_LIT; btn.removeAttribute("data-pressed"); if (!ghost) confirm(); }
        } else if (now >= litUntil) p = Math.max(0, p - (dt * 1000) / REWIND);
        draw();
        if (holding || p > 0) return true;
        loop = null; return false;
      }
      const run = () => { if (!loop) loop = ctx.loop(frame); };
      function press(rehearsal) {
        if (deleted || holding || performance.now() < litUntil) return;
        ghost = !!rehearsal; holding = true; btn.setAttribute("data-pressed", ""); run();
      }
      function release() { if (!holding) return; holding = false; btn.removeAttribute("data-pressed"); run(); }
      function confirm() {
        deleted = true;
        ctx.after(HOLD_LIT, () => { p = 0; draw(); showDraft(false); if (host.contains(document.activeElement) || document.activeElement === document.body) undo.focus({ preventScroll: true }); });
        live.textContent = DRAFTS[which].title + " deleted. Undo is available.";
        nextTimer = ctx.after(HOLD_LIT + 3200, () => { deleted = false; which = (which + 1) % DRAFTS.length; showDraft(true); live.textContent = ""; });
      }
      undo.addEventListener("click", () => {
        clearTimeout(nextTimer); deleted = false; showDraft(true); live.textContent = DRAFTS[which].title + " restored";
        btn.focus({ preventScroll: true });
      }, sig);

      btn.addEventListener("pointerdown", (e) => { if (e.button === 0) press(false); }, sig);
      for (const t of ["pointerup", "pointerleave", "pointercancel"]) btn.addEventListener(t, release, sig);
      btn.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); press(false); } }, sig);
      btn.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") release(); }, sig);
      btn.addEventListener("contextmenu", (e) => e.preventDefault(), sig);
      btn.addEventListener("click", (e) => e.preventDefault(), sig);

      /* Rehearsal: press after a beat, fill about six tenths, let go; again every few seconds until a hand arrives. */
      let handed = false;
      ctx.onHand(() => { handed = true; if (ghost && holding) release(); });
      if (!ctx.reduced()) {
        const rehearse = () => { if (handed || deleted) return; press(true); ctx.after(DURATION * 0.6, () => { if (!handed && ghost) release(); }); };
        ctx.after(500, rehearse);
        ctx.every(3200, rehearse);
      }
    },
  });
})();
