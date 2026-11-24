/* Tape Reels, Rack 2.0: the progress bar underneath the reels, as a deploy. One surface carries three stages as a
   staircase over two minutes (Build blue, Test green, Deploy orange), and the deploy head crosses them; what is done shows
   in its colour, what waits is greyed. Progress arrives in uneven steps, as a pipeline reports it, and the head cuts to
   each report: time moves it, nothing glides. The strip holds the clock and the one key: Deploy (lit while running),
   Pause, Resume. */
(function () {
  const SECONDS = 120;
  const STAGES = [
    { name: "Build", hue: "blue", from: 0, to: 52 },
    { name: "Test", hue: "green", from: 52, to: 92 },
    { name: "Deploy", hue: "orange", from: 92, to: 120 },
  ];
  const clock = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

  FlatPlayer.register({
    slug: "tape-reels",
    title: "Tape Reels",
    tagline: "A deploy you can watch cross its stages.",
    css: `
.fs-tape-reels .dp { width: min(100%, 520px); font-size: 12px; background: var(--panel); border-radius: var(--r-panel); overflow: hidden; -webkit-user-select: none; user-select: none }
.fs-tape-reels .dp-strip { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 10px; background: var(--panel-2); white-space: nowrap }
.fs-tape-reels .dp-strip b { font-weight: 600; margin-right: auto }
.fs-tape-reels .dp-clock { height: 22px; min-width: 52px; padding: 0 8px; display: inline-grid; place-items: center; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px var(--mono) }
.fs-tape-reels .dp-key { height: 22px; min-width: 64px; padding: 0 8px; border: 0; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge); color: var(--ink);
  font: 600 11px var(--font); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
.fs-tape-reels .dp-key:hover { background: var(--block-hover) }
.fs-tape-reels .dp-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-tape-reels .dp-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
.fs-tape-reels .dp-wrap { padding: 12px }
.fs-tape-reels .dp-surface { position: relative; display: grid; gap: 8px; padding: 12px; background: var(--cut); border-radius: var(--r-control); box-shadow: var(--edge) }
.fs-tape-reels .dp-row { position: relative; height: 34px }
.fs-tape-reels .dp-st { position: absolute; top: 0; bottom: 0; padding: 5px 6px; border-radius: var(--r-control); font-weight: 600; font-size: 11px; white-space: nowrap; overflow: hidden }
.fs-tape-reels .dp-st[data-tone="blue"] { background: var(--clip-blue-tint); box-shadow: inset 0 0 0 1px var(--clip-blue); color: var(--clip-blue-text) }
.fs-tape-reels .dp-st[data-tone="green"] { background: var(--clip-green-tint); box-shadow: inset 0 0 0 1px var(--clip-green); color: var(--clip-green-text) }
.fs-tape-reels .dp-st[data-tone="orange"] { background: var(--clip-orange-tint); box-shadow: inset 0 0 0 1px var(--clip-orange); color: var(--clip-orange-text) }
.fs-tape-reels .dp-span { position: absolute; inset: 12px; pointer-events: none }
.fs-tape-reels .dp-wait { position: absolute; top: 0; bottom: 0; right: 0; left: calc(var(--p, 0) * 100%); background: var(--cut); opacity: 0.7 }
.fs-tape-reels .dp-head { position: absolute; top: -4px; bottom: -4px; left: calc(var(--p, 0) * 100%); width: 1.5px; margin-left: -0.75px; background: var(--ink) }
`,
    mount(host, ctx) {
      const rows = STAGES.map((s) => '<div class="dp-row"><span class="dp-st" data-tone="' + s.hue + '" style="left:' + (s.from / SECONDS) * 100 + "%;width:" + ((s.to - s.from) / SECONDS) * 100 + '%">' + s.name + "</span></div>").join("");
      host.innerHTML = `
<div class="dp">
  <div class="dp-strip"><b>Deploy</b><span class="dp-clock" aria-hidden="true"></span><button class="dp-key" type="button"></button></div>
  <div class="dp-wrap"><div class="dp-surface" role="progressbar" aria-label="Deploying main to production" aria-valuemin="0" aria-valuemax="100">
    ${rows}<div class="dp-span" aria-hidden="true"><span class="dp-wait"></span><span class="dp-head"></span></div>
  </div></div>
  <p class="sr-only" role="status" aria-live="polite"></p>
</div>`;
      const sig = { signal: ctx.signal };
      const surface = host.querySelector(".dp-surface"), span = host.querySelector(".dp-span"), clockEl = host.querySelector(".dp-clock");
      const key = host.querySelector(".dp-key"), live = host.querySelector("[role=status]");
      let progress = 0, phase = "idle", handed = false, writer = 0, cycle = 0;

      function render() {
        span.style.setProperty("--p", progress.toFixed(4));
        surface.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
        clockEl.textContent = phase === "done" ? "Live" : clock(progress * SECONDS);
        key.textContent = phase === "run" ? "Pause" : phase === "pause" ? "Resume" : "Deploy";
        key.setAttribute("aria-pressed", String(phase === "run"));
      }
      const stop = () => { if (writer) clearInterval(writer); writer = 0; if (cycle) clearTimeout(cycle); cycle = 0; };
      function start() {
        stop(); if (progress >= 1) progress = 0;
        phase = "run"; render();
        writer = ctx.every(110, () => {
          progress = Math.min(1, progress + 0.012 + Math.random() * 0.02);
          if (progress >= 1) {
            clearInterval(writer); writer = 0; phase = "done"; render(); live.textContent = "Deployed. Live in production.";
            if (!handed) cycle = ctx.after(1400, () => { if (!handed) { progress = 0; start(); } });
            return;
          }
          render();
        });
      }
      key.addEventListener("click", () => {
        if (phase === "run") { stop(); phase = "pause"; render(); live.textContent = "Paused at " + Math.round(progress * 100) + " percent"; }
        else { start(); live.textContent = "Deploying"; }
      }, sig);
      ctx.onHand(() => { handed = true; if (cycle) { clearTimeout(cycle); cycle = 0; } });
      render();
      if (ctx.reduced()) { progress = 0.62; phase = "pause"; render(); }
      else ctx.after(300, () => { if (!handed) start(); });
      return { destroy: stop };
    },
  });
})();
