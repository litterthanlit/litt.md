/* 10-hold-confirm.js — Hold to Commit:
   Sharp square destructive/deploy action key with a flat linear fill bar that snaps to done and resets in 0ms. */
(function () {
  const S = ".rs-hold-confirm";

  RackPlayer.register({
    slug: "hold-confirm",
    title: "Hold to Commit",
    category: "control",
    tagline: "Press and hold to fill the crisp linear bar — instant 0ms reset if you let go early.",
    motion: "linear hold fill · 0ms cancel reset",
    css: `
${S} .hc {
  width: min(100%, 380px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); padding: 16px; display: grid; gap: 12px;
}
${S} .hc-hd { display: flex; justify-content: space-between; align-items: baseline; }
${S} .hc-title { font-size: 14px; font-weight: 600; }
${S} .hc-sub { font: 500 11px/1 var(--mono); color: var(--muted); }
${S} .hc-btn {
  position: relative; height: 42px; width: 100%; border: 1px solid var(--border-strong);
  border-radius: var(--r-control); background: var(--surface-2); overflow: hidden;
  cursor: pointer; user-select: none; touch-action: none; padding: 0;
  display: flex; align-items: center; justify-content: space-between; padding: 0 12px;
}
${S} .hc-fill {
  position: absolute; inset: 0 auto 0 0; width: 0%; background: var(--coral); pointer-events: none;
}
${S} .hc-btn.is-done .hc-fill { width: 100%; background: var(--accent); }
${S} .hc-lbl { position: relative; z-index: 1; font-size: 13px; font-weight: 600; }
${S} .hc-pct {
  position: relative; z-index: 1; font: 600 10px/1 var(--mono);
  padding: 3px 6px; border: 1px solid var(--border-strong); border-radius: var(--r-control);
  background: var(--cut); color: var(--ink);
}
${S} .hc-btn.is-hold .hc-lbl { color: #fff; }
${S} .hc-btn.is-done .hc-lbl { color: var(--on-accent); }
${S} .hc-btn.is-done .hc-pct { background: var(--ink); color: var(--on-ink); }
${S}.is-tile .hc { padding: 12px; gap: 9px; }
${S}.is-tile .hc-btn { height: 36px; }
`,
    mount(host, ctx) {
      let pct = 0, holding = false, done = false, raf = 0, t0 = 0;

      host.innerHTML =
        '<div class="hc" data-col>' +
          '<div class="hc-hd"><span class="hc-title">Deploy production build</span><span class="hc-sub">v2.14.0 · 4 files</span></div>' +
          '<button type="button" class="hc-btn" id="hc-btn">' +
            '<i class="hc-fill" id="hc-fill"></i>' +
            '<span class="hc-lbl" id="hc-lbl">Hold to deploy</span>' +
            '<span class="hc-pct" id="hc-pct">0%</span>' +
          '</button>' +
        '</div>';

      const btn = host.querySelector("#hc-btn");
      const fill = host.querySelector("#hc-fill");
      const lbl = host.querySelector("#hc-lbl");
      const pctEl = host.querySelector("#hc-pct");

      function draw() {
        fill.style.width = pct.toFixed(1) + "%";
        btn.classList.toggle("is-hold", pct > 35 && !done);
        btn.classList.toggle("is-done", done);
        lbl.textContent = done ? "Deployed · click to reset" : holding ? "Keep holding..." : "Hold to deploy";
        pctEl.textContent = done ? "DONE" : Math.round(pct) + "%";
      }

      const step = (now) => {
        if (!holding) return;
        pct = Math.min(100, ((now - t0) / 900) * 100);
        if (pct >= 100) { done = true; holding = false; draw(); return; }
        draw();
        raf = requestAnimationFrame(step);
      };

      btn.addEventListener("pointerdown", (e) => {
        if (done) { done = false; pct = 0; draw(); return; }
        holding = true; t0 = performance.now(); btn.setPointerCapture(e.pointerId);
        raf = requestAnimationFrame(step);
      }, { signal: ctx.signal });
      const release = () => {
        if (!holding) return;
        holding = false; cancelAnimationFrame(raf);
        if (!done) { pct = 0; draw(); }
      };
      btn.addEventListener("pointerup", release, { signal: ctx.signal });
      btn.addEventListener("pointercancel", release, { signal: ctx.signal });

      pct = 58; draw();
      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; pct = 0; done = false; draw(); });
      if (auto) ctx.every(120, () => {
        if (!auto) return;
        if (done) { done = false; pct = 0; }
        else { pct += 12; if (pct >= 100) { pct = 100; done = true; } }
        draw();
      });
    },
  });
})();
