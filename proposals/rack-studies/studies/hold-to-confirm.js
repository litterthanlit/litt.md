/* Hold to Confirm, in Rack: a destructive action that asks for intent, in an agent console. Three agents' branches, each
   agent in its own colour (Planner purple, Coder orange, Reviewer green), one stale branch selected, and a Delete key you
   hold: its box fills with the danger red, linearly, for 1200 ms; let go early and it runs back in 220 ms. Full, the
   branch's slot cuts to empty and the key becomes Undo. Nothing travels: the fill is time, the rest are cuts on the frame.
   A ghost rehearses the hold until a hand arrives. */
(function () {
  const DURATION = 1200, REWIND = 220, HOLD_LIT = 300;
  const TRACKS = [
    { name: "Planner", hue: "purple", clips: ["plan/q4", "plan/docs", null] },
    { name: "Coder", hue: "orange", clips: ["fix/nav", "feat/toast", "spike/dither"] },
    { name: "Reviewer", hue: "green", clips: ["review/412", "review/415", null] },
  ];
  const SEL = { t: 1, c: 2 };
  let n = 0;

  FlatPlayer.register({
    slug: "hold-to-confirm",
    title: "Hold to Confirm",
    tagline: "Hold the key until it fills.",
    css: `
.fs-hold-to-confirm .hk { width: min(340px, 100%); font: 400 12px/1.35 var(--font); background: var(--body); padding: 3px; border-radius: 8px; display: grid; gap: 3px;
  -webkit-user-select: none; user-select: none }
.fs-hold-to-confirm .hk-tracks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3px }
.fs-hold-to-confirm .hk-dev { background: var(--panel); border-radius: var(--r-panel); overflow: hidden; min-width: 0 }
.fs-hold-to-confirm .hk-strip { display: flex; align-items: center; height: 24px; padding: 0 7px; background: var(--tint); color: var(--txt); font-weight: 600;
  white-space: nowrap; overflow: hidden }
.fs-hold-to-confirm .hk-slots { list-style: none; margin: 0; padding: 3px; display: grid; gap: 2px }
.fs-hold-to-confirm .hk-slot { display: flex; align-items: center; gap: 5px; height: 24px; padding: 0 5px; border-radius: var(--r-control); background: var(--tint);
  color: var(--txt); font: 500 11px var(--mono); white-space: nowrap; overflow: hidden }
.fs-hold-to-confirm .hk-slot span { overflow: hidden; text-overflow: ellipsis }
.fs-hold-to-confirm .hk-slot svg { flex: none; width: 8px; height: 8px; fill: currentColor }
.fs-hold-to-confirm .hk-slot[aria-current="true"] { box-shadow: inset 0 0 0 1.5px var(--hue) }
.fs-hold-to-confirm .hk-slot.is-empty { background: var(--slot); color: var(--muted); box-shadow: none }
.fs-hold-to-confirm .hk-slot.is-in { animation: hk-in var(--cut-in) var(--ease-out) both }
@keyframes hk-in { from { opacity: 0 } }
.fs-hold-to-confirm .hk-bar { background: var(--panel); border-radius: var(--r-panel) }
.fs-hold-to-confirm .hk-foot { display: flex; align-items: center; gap: 6px; padding: 4px 4px 4px 8px }
.fs-hold-to-confirm .hk-word { flex: 1 1 auto; min-width: 0; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-hold-to-confirm .hk-key { position: relative; flex: none; height: 26px; min-width: 140px; padding: 0 10px; border: 0; border-radius: var(--r-control); overflow: hidden;
  background: var(--block); box-shadow: var(--edge); color: var(--ink); font: 500 12px var(--font); cursor: pointer; touch-action: none; -webkit-touch-callout: none;
  transition: background-color var(--cut-in) var(--ease-out) }
.fs-hold-to-confirm .hk-key:hover { background: var(--block-hover) }
.fs-hold-to-confirm .hk-key[data-pressed] { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-hold-to-confirm .hk-key span { position: absolute; inset: 0; display: grid; place-items: center }
.fs-hold-to-confirm .hk-fill { background: var(--danger); color: var(--panel); clip-path: inset(0 calc(100% - var(--p, 0) * 100%) 0 0) }
.fs-hold-to-confirm .hk-key[hidden] { display: none }
`,
    mount(host, ctx) {
      const id = "hk" + ++n;
      host.innerHTML = `
<div class="hk">
  <div class="hk-tracks"></div>
  <div class="hk-bar">
    <div class="hk-foot">
      <span class="hk-word" aria-hidden="true"></span>
      <button class="hk-key" type="button" data-k="del" aria-describedby="${id}-hint"><span>Hold to delete branch</span><span class="hk-fill" aria-hidden="true">Hold to delete branch</span></button>
      <button class="hk-key" type="button" data-k="undo" hidden><span>Undo</span></button>
    </div>
  </div>
  <span id="${id}-hint" class="sr-only">Press and hold to delete the selected branch</span>
  <p class="sr-only" role="status" aria-live="polite"></p>
</div>`;
      const sig = { signal: ctx.signal };
      const list = host.querySelector(".hk-slots"), word = host.querySelector(".hk-word"), live = host.querySelector("[role=status]");
      const del = host.querySelector('[data-k="del"]'), undo = host.querySelector('[data-k="undo"]'), tracksEl = host.querySelector(".hk-tracks");
      const PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true" style="fill:none;stroke:currentColor;stroke-width:1.4"><path d="M2.5 1v8M2.5 6.5c0-2 5-1.5 5-4.5"/></svg>', STOP = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1h8v8H1z"/></svg>';
      let deleted = false, back = 0;
      const selName = () => TRACKS[SEL.t].clips[SEL.c];
      const gone = { on: false };
      function render(cutIn) {
        tracksEl.textContent = "";
        TRACKS.forEach((t, ti) => {
          const dev = document.createElement("div");
          dev.className = "hk-dev";
          dev.style.cssText = "--hue: var(--clip-" + t.hue + "); --tint: var(--clip-" + t.hue + "-tint); --txt: var(--clip-" + t.hue + "-text)";
          dev.innerHTML = '<div class="hk-strip"></div><ol class="hk-slots"></ol>';
          dev.querySelector(".hk-strip").textContent = t.name;
          const ol = dev.querySelector("ol"); ol.setAttribute("aria-label", t.name + " branches");
          t.clips.forEach((c, ci) => {
            const here = ti === SEL.t && ci === SEL.c, empty = !c || (here && gone.on);
            const li = document.createElement("li");
            li.className = "hk-slot" + (empty ? " is-empty" : "") + (here && cutIn ? " is-in" : "");
            li.setAttribute("aria-current", String(here && !empty));
            li.innerHTML = (empty ? STOP : PLAY) + "<span></span>";
            li.querySelector("span").textContent = empty ? "" : c;
            if (empty) li.setAttribute("aria-label", "Empty slot");
            ol.appendChild(li);
          });
          tracksEl.appendChild(dev);
        });
        word.textContent = deleted ? "Deleted " + selName() : selName() + " selected";
        del.hidden = deleted; undo.hidden = !deleted;
      }
      render();

      /* The fill: linear while held, runs back when let go; full, it holds a moment and the branch goes. */
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
      function press(rehearsal) {
        if (deleted || holding || performance.now() < litUntil) return;
        ghost = !!rehearsal; holding = true; del.setAttribute("data-pressed", ""); run();
      }
      function release() { if (!holding) return; holding = false; del.removeAttribute("data-pressed"); run(); }
      function confirm() {
        p = 0; draw();
        gone.on = true; deleted = true; render();
        live.textContent = selName() + " deleted. Undo is available.";
        if (del === document.activeElement || document.activeElement === document.body) undo.focus({ preventScroll: true });
        /* The agent opens the branch again a while later, so the demo can go again. */
        back = ctx.after(4000, () => { gone.on = false; deleted = false; render(true); live.textContent = ""; });
      }
      undo.addEventListener("click", () => {
        clearTimeout(back); gone.on = false; deleted = false; render(true);
        live.textContent = selName() + " restored"; del.focus({ preventScroll: true });
      }, sig);

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
