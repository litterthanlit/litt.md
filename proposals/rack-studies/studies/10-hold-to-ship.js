/* 10-hold-to-ship.js — Hold to Ship:
   Four luminous milestone strips + one tactile Hold to ship key that fills linearly to sunlit yellow. */
(function () {
  const S = ".rs-hold-to-ship";
  const CHECKS = [
    { name: "Palette tuned", hue: "purple" },
    { name: "Motion tested", hue: "blue" },
    { name: "Copy trimmed", hue: "orange" },
    { name: "Ready to ship", hue: "green" },
  ];

  RackPlayer.register({
    slug: "hold-to-ship",
    title: "Hold to Ship",
    tagline: "Press and hold to fill the bar and ship — let go early and it steps right back.",
    css: `
${S} .hs-list { display: grid; gap: 5px; margin-bottom: 8px; }
${S} .hs-row { padding: 5px 8px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; }
${S} .hs-btn {
  position: relative; width: 100%; height: 32px; border: 0; border-radius: var(--r-control);
  background: var(--block); box-shadow: var(--edge); color: var(--ink);
  font: 600 11px/1 var(--font); cursor: pointer; overflow: hidden; user-select: none; touch-action: none;
  display: flex; align-items: center; justify-content: space-between; padding: 0 10px;
}
${S} .hs-fill { position: absolute; inset: 0 auto 0 0; width: 0%; background: var(--accent); pointer-events: none; }
${S} .hs-btn.is-done .hs-fill { width: 100%; background: var(--accent); }
${S} .hs-lbl { position: relative; z-index: 1; }
${S} .hs-btn.is-lit .hs-lbl, ${S} .hs-btn.is-done .hs-lbl { color: var(--accent-fg); }
${S} .hs-pct {
  position: relative; z-index: 1; font: 600 10px/1 var(--mono);
  padding: 2px 5px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge); color: var(--ink);
}
${S}.is-tile .hs-row { padding: 4px 7px; font-size: 10px; }
${S}.is-tile .hs-btn { height: 28px; }
`,
    mount(host, ctx) {
      let pct = 52, holding = false, done = false;

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><b>Launch</b><span class="rk-box" style="margin-left:auto" id="hs-st">4 / 4 ready</span></div>' +
          '<div class="rk-surf">' +
            '<div class="hs-list">' +
              CHECKS.map((c) => '<div class="ly hs-row" data-h="' + c.hue + '"><span>' + c.name + '</span><span>✓</span></div>').join("") +
            '</div>' +
            '<button type="button" class="hs-btn" id="hs-btn">' +
              '<i class="hs-fill" id="hs-fill"></i>' +
              '<span class="hs-lbl" id="hs-lbl">Hold to ship</span>' +
              '<span class="hs-pct" id="hs-pct">52%</span>' +
            '</button>' +
          '</div>' +
        '</div>';

      const btn = host.querySelector("#hs-btn");
      const fill = host.querySelector("#hs-fill");
      const lbl = host.querySelector("#hs-lbl");
      const pctEl = host.querySelector("#hs-pct");
      const stEl = host.querySelector("#hs-st");

      function draw() {
        const p = Math.max(0, Math.min(100, pct));
        fill.style.width = p.toFixed(1) + "%";
        btn.classList.toggle("is-lit", p > 30);
        btn.classList.toggle("is-done", done);
        lbl.textContent = done ? "Shipped · click to reset" : holding ? "Keep holding..." : "Hold to ship";
        pctEl.textContent = done ? "LIVE" : Math.round(p) + "%";
        stEl.textContent = done ? "Shipped ✓" : "4 / 4 ready";
      }

      let ghost = !ctx.reduced();
      ctx.onHand(() => { ghost = false; if (!holding && !done) { pct = 0; draw(); } });

      btn.addEventListener("pointerdown", (e) => {
        ghost = false;
        if (done) { done = false; pct = 0; draw(); return; }
        holding = true; btn.setPointerCapture(e.pointerId); draw();
      }, { signal: ctx.signal });
      const release = () => { if (holding) { holding = false; if (!done) pct = 0; draw(); } };
      btn.addEventListener("pointerup", release, { signal: ctx.signal });
      btn.addEventListener("pointercancel", release, { signal: ctx.signal });
      draw();

      ctx.loop((dt) => {
        if (holding) {
          pct += dt * 115;
          if (pct >= 100) { pct = 100; holding = false; done = true; }
          draw();
        } else if (ghost) {
          pct += dt * 42;
          if (pct >= 108) { pct = 0; done = false; }
          else done = pct >= 98;
          draw();
        }
      });
    },
  });
})();
