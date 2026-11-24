/* Hold to Confirm, Rack 2.0: delete a branch. One surface holds four branches, each in its agent's colour (Planner purple,
   Coder orange, Reviewer green); the stale one is selected. The strip's key is the action: hold it and its box fills with
   the danger red, linearly, for 1200 ms; let go early and it runs back in 220 ms. Full, the branch cuts out of the surface
   and the key becomes Undo. A ghost rehearses the hold until a hand arrives. */
(function () {
  const DURATION = 1200, REWIND = 220, HOLD_LIT = 300;
  const BRANCHES = [
    { name: "plan/q4", hue: "purple" },
    { name: "feat/toast", hue: "orange" },
    { name: "spike/dither", hue: "orange", sel: true },
    { name: "review/415", hue: "green" },
  ];
  let n = 0;

  FlatPlayer.register({
    slug: "hold-to-confirm",
    title: "Hold to Confirm",
    tagline: "Hold the key until it fills.",
    css: `
.fs-hold-to-confirm .hb { width: min(100%, 360px); font-size: 12px; background: var(--panel); border-radius: var(--r-panel); overflow: hidden; -webkit-user-select: none; user-select: none }
.fs-hold-to-confirm .hb-strip { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 10px; background: var(--panel-2); white-space: nowrap }
.fs-hold-to-confirm .hb-strip b { font-weight: 600; margin-right: auto }
.fs-hold-to-confirm .hb-key { position: relative; height: 22px; min-width: 132px; padding: 0 8px; border: 0; border-radius: var(--r-control); overflow: hidden; background: var(--block);
  box-shadow: var(--edge); color: var(--ink); font: 600 11px var(--font); cursor: pointer; touch-action: none; -webkit-touch-callout: none;
  transition: background-color var(--cut-in) var(--ease-out) }
.fs-hold-to-confirm .hb-key:hover { background: var(--block-hover) }
.fs-hold-to-confirm .hb-key[data-pressed] { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-hold-to-confirm .hb-key span { position: absolute; inset: 0; display: grid; place-items: center }
.fs-hold-to-confirm .hb-fill { background: var(--danger); color: var(--cut); clip-path: inset(0 calc(100% - var(--p, 0) * 100%) 0 0) }
.fs-hold-to-confirm .hb-key[hidden] { display: none }
.fs-hold-to-confirm .hb-wrap { padding: 12px }
.fs-hold-to-confirm .hb-surface { list-style: none; margin: 0; padding: 10px; display: grid; gap: 6px; background: var(--cut); border-radius: var(--r-control); box-shadow: var(--edge); min-height: 156px; align-content: start }
.fs-hold-to-confirm .hb-br { height: 28px; padding: 0 8px; display: flex; align-items: center; border-radius: var(--r-control); font: 600 11px var(--mono);
  animation: hb-in var(--cut-in) var(--ease-out) both }
.fs-hold-to-confirm .hb-br[data-tone="purple"] { background: var(--clip-purple-tint); box-shadow: inset 0 0 0 1px var(--clip-purple); color: var(--clip-purple-text) }
.fs-hold-to-confirm .hb-br[data-tone="orange"] { background: var(--clip-orange-tint); box-shadow: inset 0 0 0 1px var(--clip-orange); color: var(--clip-orange-text) }
.fs-hold-to-confirm .hb-br[data-tone="green"] { background: var(--clip-green-tint); box-shadow: inset 0 0 0 1px var(--clip-green); color: var(--clip-green-text) }
.fs-hold-to-confirm .hb-br[aria-current="true"] { box-shadow: inset 0 0 0 2px var(--clip-orange) }
@keyframes hb-in { from { opacity: 0 } }
`,
    mount(host, ctx) {
      const id = "hb" + ++n;
      host.innerHTML = `
<div class="hb">
  <div class="hb-strip"><b>Branches</b>
    <button class="hb-key" type="button" data-k="del" aria-describedby="${id}-hint"><span>Hold to delete</span><span class="hb-fill" aria-hidden="true">Hold to delete</span></button>
    <button class="hb-key" type="button" data-k="undo" hidden><span>Undo</span></button>
  </div>
  <div class="hb-wrap"><ul class="hb-surface" aria-label="Branches"></ul></div>
  <span id="${id}-hint" class="sr-only">Press and hold to delete spike/dither</span>
  <p class="sr-only" role="status" aria-live="polite"></p>
</div>`;
      const sig = { signal: ctx.signal };
      const list = host.querySelector(".hb-surface"), live = host.querySelector("[role=status]");
      const del = host.querySelector('[data-k="del"]'), undo = host.querySelector('[data-k="undo"]');
      let deleted = false, back = 0;
      const SEL = BRANCHES.find((b) => b.sel).name;

      function render() {
        list.textContent = "";
        BRANCHES.forEach((b) => {
          if (b.sel && deleted) return;
          const li = document.createElement("li");
          li.className = "hb-br"; li.dataset.tone = b.hue; li.textContent = b.name;
          if (b.sel) li.setAttribute("aria-current", "true");
          list.appendChild(li);
        });
        del.hidden = deleted; undo.hidden = !deleted;
      }
      render();

      let p = 0, holding = false, ghost = false, litUntil = 0, loop = null;
      const draw = () => del.style.setProperty("--p", p.toFixed(4));
      function frame(dt, now) {
        if (holding) {
          p = Math.min(1, p + (dt * 1000) / DURATION);
          if (p >= 1) { holding = false; litUntil = now + HOLD_LIT; del.removeAttribute("data-pressed"); if (!ghost) ctx.after(HOLD_LIT, confirm); }
        } else if (now >= litUntil) p = Math.max(0, p - (dt * 1000) / REWIND);
        draw();
        if (holding || p > 0) return true;
        loop = null; return false;
      }
      const run = () => { if (!loop) loop = ctx.loop(frame); };
      function press(rehearsal) { if (deleted || holding || performance.now() < litUntil) return; ghost = !!rehearsal; holding = true; del.setAttribute("data-pressed", ""); run(); }
      function release() { if (!holding) return; holding = false; del.removeAttribute("data-pressed"); run(); }
      function confirm() {
        p = 0; draw(); deleted = true; render();
        live.textContent = SEL + " deleted. Undo is available.";
        if (del === document.activeElement || document.activeElement === document.body) undo.focus({ preventScroll: true });
        back = ctx.after(4000, () => { deleted = false; render(); live.textContent = ""; });
      }
      undo.addEventListener("click", () => { clearTimeout(back); deleted = false; render(); live.textContent = SEL + " restored"; del.focus({ preventScroll: true }); }, sig);

      del.addEventListener("pointerdown", (e) => { if (e.button === 0) press(false); }, sig);
      for (const t of ["pointerup", "pointerleave", "pointercancel"]) del.addEventListener(t, release, sig);
      del.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); press(false); } }, sig);
      del.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") release(); }, sig);
      del.addEventListener("contextmenu", (e) => e.preventDefault(), sig);
      del.addEventListener("click", (e) => e.preventDefault(), sig);

      let handed = false;
      ctx.onHand(() => { handed = true; if (ghost && holding) release(); });
      if (!ctx.reduced()) {
        const rehearse = () => { if (handed || deleted) return; press(true); ctx.after(DURATION * 0.6, () => { if (!handed && ghost) release(); }); };
        ctx.after(500, rehearse);
        ctx.every(3000, rehearse);
      }
    },
  });
})();
