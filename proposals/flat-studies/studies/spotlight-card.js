/* Spotlight Card, redesigned in Flat: a site's two numbers this week, each on its own white paper with one large
   figure. The light becomes a shape: a big grey bubble that rides under the pointer inside each paper, held 6px in
   so the paper keeps its white rim. Both papers read the one pointer, so the bubble crosses the gap as one circle.
   Coordinates go straight to CSS variables; nothing is rebuilt as the pointer moves. A press swells the bubble. */
FlatPlayer.register({
  slug: "spotlight-card",
  title: "Spotlight Card",
  tagline: "A soft shape that follows your cursor.",
  css: `
.fs-spotlight-card .sp { width: min(100%, 520px); display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
.fs-spotlight-card .sp-card { position: relative; isolation: isolate; border-radius: var(--r-paper); background: var(--paper); --x: 50%; --y: -40%; --s: 0; --p: 1 }
.fs-spotlight-card .sp-well { position: absolute; inset: 6px; border-radius: 10px; overflow: hidden; z-index: -1; pointer-events: none }
.fs-spotlight-card .sp-light { position: absolute; left: calc(var(--x) - 6px); top: calc(var(--y) - 6px); width: 240px; height: 240px; margin: -120px 0 0 -120px;
  border-radius: 50%; background: var(--bubble); opacity: var(--s); transform: scale(calc((0.8 + var(--s) * 0.2) * var(--p)));
  transition: opacity 150ms cubic-bezier(0.23, 1, 0.32, 1), transform 150ms cubic-bezier(0.23, 1, 0.32, 1) }
.fs-spotlight-card .sp.is-lit .sp-light { transition-duration: 210ms }
.fs-spotlight-card article { display: grid; align-content: space-between; gap: 28px; padding: 20px; min-height: 200px }
.fs-spotlight-card h3 { margin: 0; font-size: 15px; font-weight: 500 }
.fs-spotlight-card .sp-fig { display: block; font-size: 44px; font-weight: 600; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums }
.fs-spotlight-card .sp-label { display: block; margin-top: 6px; font-size: 14px; color: var(--muted) }
@container (max-width: 400px) {
  .fs-spotlight-card .sp { gap: 10px }
  .fs-spotlight-card article { padding: 16px; min-height: 160px; gap: 20px }
  .fs-spotlight-card .sp-fig { font-size: 34px }
  .fs-spotlight-card .sp-label { font-size: 13px }
}
@container (min-width: 640px) {
  .fs-spotlight-card .sp { width: 640px; gap: 16px }
  .fs-spotlight-card article { padding: 24px; min-height: 260px }
  .fs-spotlight-card .sp-fig { font-size: 48px }
  .fs-spotlight-card .sp-light { width: 300px; height: 300px; margin: -150px 0 0 -150px }
}
@media (prefers-reduced-motion: reduce) { .fs-spotlight-card .sp-light { transition: none } }
`,
  mount(host, ctx) {
    const items = [
      { title: "Readers", stat: "12,480", label: "62 joined this week" },
      { title: "Opened", stat: "61%", label: "of Sunday's letter" },
    ];
    host.innerHTML = `<div class="sp">${items.map((it) => `
      <div class="sp-card"><span class="sp-well" aria-hidden="true"><span class="sp-light"></span></span>
        <article><h3>${it.title}</h3><p style="margin:0"><span class="sp-fig">${it.stat}</span><span class="sp-label">${it.label}</span></p></article>
      </div>`).join("")}</div>`;
    const root = host.querySelector(".sp"), cards = [...host.querySelectorAll(".sp-card")];

    /* Arrival: each paper on Flat's expressive spring, 50ms apart. */
    if (!ctx.reduced()) cards.forEach((c, i) => c.animate && c.animate([{ transform: "translateY(14px) scale(0.97)", opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: 579, delay: i * 50, fill: "backwards", easing: "linear(0, 0.0897, 0.2671, 0.4643, 0.6434, 0.7874, 0.8925, 0.9624, 1.004, 1.0249, 1.0322, 1.0295, 1.0237, 1.0173, 1.0115, 1.0068, 1.0034, 1.0012, 0.9998, 0.9992, 1)" }));

    /* One point in the screen's space, written to each card in its own coordinates (unscaled, as the original). */
    function light(clientX, clientY) {
      for (const el of cards) {
        const r = el.getBoundingClientRect();
        const scale = r.width / el.offsetWidth || 1;
        el.style.setProperty("--x", (clientX - r.left) / scale + "px");
        el.style.setProperty("--y", (clientY - r.top) / scale + "px");
      }
    }
    const lit = (on) => { root.classList.toggle("is-lit", on); cards.forEach((c) => c.style.setProperty("--s", on ? "1" : "0")); };
    const swell = (on) => cards.forEach((c) => c.style.setProperty("--p", on ? "1.25" : "1"));

    let ghost = !ctx.reduced();
    const stopGhost = () => { if (!ghost) return; ghost = false; lit(false); };
    const opt = { signal: ctx.signal };
    root.addEventListener("pointermove", (e) => { stopGhost(); light(e.clientX, e.clientY); lit(true); }, opt);
    root.addEventListener("pointerleave", () => { lit(false); swell(false); }, opt);
    root.addEventListener("pointerdown", (e) => { light(e.clientX, e.clientY); lit(true); swell(true); }, opt);
    window.addEventListener("pointerup", () => swell(false), opt);
    window.addEventListener("pointercancel", () => { swell(false); }, opt);

    /* The self-run: the shape wanders across both papers on a slow figure of eight until a hand arrives. */
    if (ghost) {
      ctx.after(500, () => { if (ghost) lit(true); });
      const t0 = performance.now();
      ctx.loop((dt, now) => {
        if (!ghost) return false;
        const t = (now - t0) / 1000, r = root.getBoundingClientRect();
        light(r.left + r.width * (0.5 + 0.42 * Math.sin(t * 1.1)), r.top + r.height * (0.5 + 0.4 * Math.sin(t * 2.2 + 0.6)));
      });
    }
    ctx.onHand(stopGhost);
  },
});
