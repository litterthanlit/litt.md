/* Tape Reels, in Rack: the progress bar underneath the reels, as a deploy. The pipeline's jobs laid out over two minutes,
   one lane per stage in its own colour (Build blue, Test green, Deploy orange), with the deploy head crossing them; what is
   done shows in full colour, what waits is greyed. Progress arrives in uneven steps, as a pipeline reports it, and the head
   cuts to each report: time moves it, nothing glides. Deploy is the lit key while it runs; Pause holds it where it is.
   One readout: the clock. */
(function () {
  const BARS = 120, SECONDS = 120;
  const LANES = [
    { name: "Build", hue: "blue", clips: [[0, 14, "install"], [14, 40, "compile"], [40, 52, "bundle"]] },
    { name: "Test", hue: "green", clips: [[52, 70, "unit"], [70, 92, "e2e"]] },
    { name: "Deploy", hue: "orange", clips: [[92, 108, "upload"], [108, 120, "route"]] },
  ];
  const clock = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  const STATE = { run: "Deploying", pause: "Paused", done: "Live", idle: "Ready" };

  FlatPlayer.register({
    slug: "tape-reels",
    title: "Tape Reels",
    tagline: "A deploy you can watch cross its jobs.",
    css: `
.fs-tape-reels .rr { width: min(380px, 100%); font: 400 12px/1.35 var(--font); background: var(--body); padding: 3px; border-radius: 8px; display: grid; gap: 3px;
  -webkit-user-select: none; user-select: none }
.fs-tape-reels .rr-dev { background: var(--panel); border-radius: var(--r-panel); overflow: hidden }
.fs-tape-reels .rr-head { display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 4px 0 8px; background: var(--panel-2) }
.fs-tape-reels .rr-head b { font-weight: 600; margin-right: auto; white-space: nowrap }
.fs-tape-reels .rr-box { height: 20px; padding: 0 6px; display: inline-grid; place-items: center; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px var(--mono); white-space: nowrap }
.fs-tape-reels .rr-arr { position: relative; display: grid; gap: 2px; padding: 4px 6px 6px }
.fs-tape-reels .rr-ruler, .fs-tape-reels .rr-lane { display: grid; grid-template-columns: 48px 1fr; gap: 4px; align-items: center }
.fs-tape-reels .rr-ruler { height: 14px; color: var(--muted); font: 500 10px var(--mono) }
.fs-tape-reels .rr-ticks { position: relative; height: 100% }
.fs-tape-reels .rr-ticks span { position: absolute; top: 0 }
.fs-tape-reels .rr-name { height: 22px; display: flex; align-items: center; padding: 0 5px; border-radius: var(--r-control); background: var(--tint); color: var(--txt);
  font-weight: 600; font-size: 11px; white-space: nowrap; overflow: hidden }
.fs-tape-reels .rr-row { position: relative; height: 22px; border-radius: var(--r-control); background: var(--panel-3) }
.fs-tape-reels .rr-clip { position: absolute; top: 0; bottom: 0; padding: 0 4px; display: flex; align-items: center; border-radius: var(--r-control);
  background: var(--tint); color: var(--txt); box-shadow: inset 2px 0 0 var(--hue); font: 500 10.5px var(--mono); white-space: nowrap; overflow: hidden }
.fs-tape-reels .rr-wait { position: absolute; top: 0; bottom: 0; right: 0; left: calc(var(--p, 0) * 100%); background: var(--panel); opacity: 0.62; pointer-events: none }
.fs-tape-reels .rr-headline { position: absolute; top: 0; bottom: 0; left: calc(var(--p, 0) * 100%); width: 1.5px; margin-left: -0.75px; background: var(--ink) }
.fs-tape-reels .rr-span { position: absolute; top: 18px; bottom: 6px; left: 58px; right: 6px; pointer-events: none }
.fs-tape-reels .rr-foot { display: flex; align-items: center; gap: 6px; padding: 6px 6px 6px 8px; flex-wrap: wrap }
.fs-tape-reels .rr-clock { font: 600 20px/1 var(--mono); letter-spacing: -0.02em }
.fs-tape-reels .rr-clock small { font-size: 11px; color: var(--muted); font-weight: 500; letter-spacing: 0; margin-left: 4px }
.fs-tape-reels .rr-state { margin-right: auto; color: var(--muted) }
.fs-tape-reels .rr-state.is-done { color: var(--success); font-weight: 600 }
.fs-tape-reels .rr-key { height: 22px; padding: 0 9px; border: 0; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge); color: var(--ink);
  font: 500 12px var(--font); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
.fs-tape-reels .rr-key:hover { background: var(--block-hover) }
.fs-tape-reels .rr-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-tape-reels .rr-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
.fs-tape-reels .rr-fmt { display: flex; gap: 3px }
.fs-tape-reels.is-tile .rr-fmt { display: none }
@container (min-width: 560px) { .fs-tape-reels .rr { width: 520px } }
`,
    mount(host, ctx) {
      const ticks = [0, 30, 60, 90].map((b) => '<span style="left:' + (b / BARS) * 100 + '%">' + clock(b) + "</span>").join("");
      const lanes = LANES.map((l) => '<div class="rr-lane" style="--hue: var(--clip-' + l.hue + "); --tint: var(--clip-" + l.hue + "-tint); --txt: var(--clip-" + l.hue + '-text)">' +
        '<span class="rr-name">' + l.name + '</span><div class="rr-row">' +
        l.clips.map(([a, b, t]) => '<span class="rr-clip" style="left:' + (a / BARS) * 100 + "%;width:calc(" + ((b - a) / BARS) * 100 + '% - 1px)">' + t + "</span>").join("") +
        "</div></div>").join("");
      host.innerHTML = `
<div class="rr"><div class="rr-dev">
  <div class="rr-head"><b>Deploy</b><span class="rr-fmt" aria-hidden="true"><span class="rr-box">main@4f2a9c1</span><span class="rr-box">Production</span></span></div>
  <div class="rr-arr" role="progressbar" aria-label="Deploying main to production" aria-valuemin="0" aria-valuemax="100">
    <div class="rr-ruler" aria-hidden="true"><span></span><span class="rr-ticks">${ticks}</span></div>
    ${lanes}
    <div class="rr-span" aria-hidden="true"><span class="rr-wait"></span><span class="rr-headline"></span></div>
  </div>
  <div class="rr-foot">
    <span class="rr-clock" aria-hidden="true"></span>
    <span class="rr-state"></span>
    <span class="rr-box rr-pct" aria-hidden="true"></span>
    <button class="rr-key" type="button" data-k="render"></button>
  </div>
</div><p class="sr-only" role="status" aria-live="polite"></p></div>`;
      const sig = { signal: ctx.signal };
      const arr = host.querySelector(".rr-arr"), span = host.querySelector(".rr-span"), clockEl = host.querySelector(".rr-clock"), stateEl = host.querySelector(".rr-state");
      const pctEl = host.querySelector(".rr-pct"), key = host.querySelector(".rr-key"), live = host.querySelector("[role=status]");
      let progress = 0, phase = "idle", handed = false, writer = 0, cycle = 0;

      function render() {
        const pct = Math.round(progress * 100);
        span.style.setProperty("--p", progress.toFixed(4));
        arr.setAttribute("aria-valuenow", String(pct));
        clockEl.innerHTML = clock(progress * SECONDS) + "<small>/ " + clock(SECONDS) + "</small>";
        pctEl.textContent = pct + " %";
        stateEl.textContent = STATE[phase];
        stateEl.classList.toggle("is-done", phase === "done");
        key.textContent = phase === "run" ? "Pause" : phase === "pause" ? "Resume" : phase === "done" ? "Deploy again" : "Deploy";
        key.setAttribute("aria-pressed", String(phase === "run"));
      }
      const stop = () => { if (writer) clearInterval(writer); writer = 0; if (cycle) clearTimeout(cycle); cycle = 0; };
      function start() {
        stop(); if (progress >= 1) progress = 0;
        phase = "run"; render();
        writer = ctx.every(110, () => {
          progress = Math.min(1, progress + 0.012 + Math.random() * 0.02);
          if (progress >= 1) {
            clearInterval(writer); writer = 0; phase = "done"; render(); live.textContent = "Deployed main to production";
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
