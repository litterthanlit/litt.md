/* Tape Reels, redesigned for Flat: the progress bar underneath the reels. An archive export on paper: a large percentage,
   a fat pill that fills along the sunset ramp, how many posts are in, and Pause or Resume. Progress arrives in uneven
   steps, as an export reports it, and eases in on the original's critically damped spring (stiffness 140, damping 24),
   so a jump glides instead of snapping. Done, the pill turns into Download. */
(function () {
  const POSTS = 48, SIZE = 12.4;
  const SPRING = { duration: (2 * Math.PI) / Math.sqrt(140), bounce: 0 };
  const STATE = { export: "Exporting", pause: "Paused", done: "Ready", saved: "Downloaded" };

  FlatPlayer.register({
    slug: "tape-reels",
    title: "Tape Reels",
    tagline: "A progress bar that eases in.",
    css: `
.fs-tape-reels .tx { width: min(23em, 100%); font-size: clamp(13px, calc(2.2cqw + 6px), 16px); background: var(--paper); border-radius: var(--r-paper);
  padding: 1.25em; display: grid; gap: 1em; -webkit-user-select: none; user-select: none }
.fs-tape-reels .tx-top { display: flex; align-items: baseline; justify-content: space-between; gap: 1em; min-width: 0 }
.fs-tape-reels .tx-name { display: grid; gap: 0.15em; min-width: 0 }
.fs-tape-reels .tx-name b { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-tape-reels .tx-name span { font-size: 0.87em; color: var(--muted) }
.fs-tape-reels .tx-pct { font-size: 2.6em; font-weight: 600; letter-spacing: -0.04em; line-height: 0.9; font-variant-numeric: tabular-nums; white-space: nowrap }
.fs-tape-reels .tx-pct small { font-size: 0.42em; font-weight: 500; letter-spacing: 0; margin-left: 0.1em; color: var(--muted) }
.fs-tape-reels .tx-bar { position: relative; height: 1.25em; border-radius: var(--r-pill); background: var(--bubble); overflow: hidden }
.fs-tape-reels .tx-fill { position: absolute; inset: 0; border-radius: var(--r-pill);
  background: var(--ink);
  clip-path: inset(0 calc(100% - var(--p, 0) * 100%) 0 0 round var(--r-pill)) }
.fs-tape-reels .tx-foot { display: flex; align-items: center; justify-content: space-between; gap: 0.75em; min-width: 0 }
.fs-tape-reels .tx-meta { font-size: 0.93em; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-tape-reels .tx-btn { flex: none; height: 2.6em; padding: 0 1.25em; border: 0; border-radius: var(--r-pill); background: var(--bubble); color: var(--ink);
  font-weight: 500; cursor: pointer; transition: transform 100ms, background-color var(--dur-instant), color var(--dur-instant) }
.fs-tape-reels .tx-btn:active { transform: scale(0.97) }
.fs-tape-reels .tx-btn.is-primary { background: var(--ink); color: var(--on-ink) }
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="tx">
  <div class="tx-top">
    <div class="tx-name"><b>archive-2026.zip</b><span class="tx-state"></span></div>
    <div class="tx-pct" aria-hidden="true"></div>
  </div>
  <div class="tx-bar" role="progressbar" aria-label="Archive export" aria-valuemin="0" aria-valuemax="100"><span class="tx-fill"></span></div>
  <div class="tx-foot"><span class="tx-meta" aria-hidden="true"></span><button class="tx-btn" type="button"></button></div>
  <p class="sr-only" role="status" aria-live="polite"></p>
</div>`;
      const sig = { signal: ctx.signal };
      const bar = host.querySelector(".tx-bar"), stateEl = host.querySelector(".tx-state"), pctEl = host.querySelector(".tx-pct");
      const meta = host.querySelector(".tx-meta"), btn = host.querySelector(".tx-btn"), live = host.querySelector("[role=status]");
      let progress = 0, phase = "pause", handed = false;

      const spring = ctx.spring(0, (pm) => {
        const p = Math.min(1, Math.max(0, pm / 1000));
        bar.style.setProperty("--p", p.toFixed(4));
        pctEl.innerHTML = Math.round(p * 100) + "<small>%</small>";
      }, SPRING);

      function render() {
        const pct = Math.round(progress * 100), posts = Math.round(progress * POSTS);
        bar.setAttribute("aria-valuenow", String(pct));
        stateEl.textContent = STATE[phase];
        meta.textContent = phase === "done" || phase === "saved" ? SIZE + " MB, " + POSTS + " posts" : posts + " of " + POSTS + " posts";
        btn.textContent = phase === "export" ? "Pause" : phase === "pause" ? "Resume" : phase === "done" ? "Download" : "Export again";
        btn.classList.toggle("is-primary", phase === "done");
      }
      function moveTo(p) { progress = Math.min(1, Math.max(0, p)); ctx.reduced() ? spring.jump(progress * 1000) : spring.set(progress * 1000); render(); }

      let writer = 0, cycle = 0;
      const stop = () => { if (writer) clearInterval(writer); writer = 0; if (cycle) clearTimeout(cycle); cycle = 0; };
      function exportIt() {
        stop(); phase = "export"; render();
        writer = ctx.every(110, () => {
          const next = Math.min(1, progress + 0.018 + Math.random() * 0.024);
          moveTo(next);
          if (next < 1) return;
          clearInterval(writer); writer = 0;
          phase = "done"; render(); live.textContent = "Export ready, " + SIZE + " MB";
          /* Until a hand arrives: hold, then start a fresh export. */
          if (!handed) cycle = ctx.after(1600, () => { if (handed) return; spring.jump(0); progress = 0; exportIt(); });
        });
      }
      btn.addEventListener("click", () => {
        if (phase === "export") { stop(); phase = "pause"; render(); live.textContent = "Paused"; }
        else if (phase === "pause") { exportIt(); live.textContent = "Exporting"; }
        else if (phase === "done") { phase = "saved"; render(); live.textContent = "Downloaded archive-2026.zip"; }
        else { spring.jump(0); progress = 0; exportIt(); live.textContent = "Exporting"; }
      }, sig);

      ctx.onHand(() => { handed = true; if (cycle) { clearTimeout(cycle); cycle = 0; } });
      render(); spring.jump(0);
      if (ctx.reduced()) { moveTo(0.64); phase = "pause"; render(); }
      else ctx.after(300, () => { if (!handed) exportIt(); });
      return { destroy() { stop(); spring.stop(); } };
    },
  });
})();
