/* Magnetic Button, redesigned in Flat: a newsletter's sign-up. One white paper with the reader count as its large
   figure and the one ink action, Subscribe, which has a little gravity: as the pointer comes near it leans toward it
   on two bouncy springs (stiffness 260, damping 12, one per axis, so a moving hand keeps the momentum and letting go
   overshoots and settles), its label riding half as far again. Subscribing counts you in. */
FlatPlayer.register({
  slug: "magnetic-button",
  title: "Magnetic Button",
  tagline: "A button with a little gravity.",
  css: `
.fs-magnetic-button .mb { width: min(100%, 400px); background: var(--paper); border-radius: var(--r-paper); padding: 32px 24px 30px;
  display: grid; justify-items: center; gap: 2px; text-align: center }
.fs-magnetic-button .mb-name { font-size: 15px; font-weight: 500 }
.fs-magnetic-button .mb-count { margin-top: 10px; font-size: 48px; font-weight: 600; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums }
.fs-magnetic-button .mb-line { margin: 4px 0 0; font-size: 14px; color: var(--muted) }
.fs-magnetic-button .mb-field { margin-top: 18px; padding: 6px 28px }
.fs-magnetic-button .mb-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; height: 48px; padding: 0 24px;
  border: 0; border-radius: var(--r-pill); background: var(--ink); color: var(--on-ink); font: 500 15px/1 var(--font); letter-spacing: -0.01em;
  cursor: pointer; touch-action: none; -webkit-tap-highlight-color: transparent; transition: background-color var(--dur-responsive), color var(--dur-responsive) }
.fs-magnetic-button .mb-btn[aria-pressed="true"] { background: var(--bubble); color: var(--ink) }
.fs-magnetic-button .mb-scale { display: inline-flex; transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1) }
.fs-magnetic-button .mb-btn:active .mb-scale { transform: scale(0.97) }
.fs-magnetic-button .mb-label { display: inline-flex; align-items: center; gap: 8px }
.fs-magnetic-button .mb-label svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round }
.fs-magnetic-button.is-tile .mb { padding: 18px 18px 18px; width: min(100%, 290px) }
.fs-magnetic-button.is-tile .mb-count { font-size: 38px; margin-top: 6px }
.fs-magnetic-button.is-tile .mb-field { margin-top: 10px }
.fs-magnetic-button.is-tile .mb-btn { height: 42px }
`,
  mount(host, ctx) {
    const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10m0 0L9 4m4 4-4 4"/></svg>';
    const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>';
    host.innerHTML = `<div class="mb">
      <span class="mb-name">The Sunday letter</span>
      <span class="mb-count" aria-hidden="true"></span>
      <p class="mb-line">readers get it every week</p>
      <div class="mb-field"><button type="button" class="mb-btn" aria-pressed="false"><span class="mb-scale"><span class="mb-label"></span></span></button></div>
      <p class="sr-only" aria-live="polite"></p>
    </div>`;
    const card = host.querySelector(".mb"), btn = host.querySelector(".mb-btn"), label = host.querySelector(".mb-label");
    const countEl = host.querySelector(".mb-count"), live = host.querySelector("[aria-live]");
    const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const BASE = 1203;
    let on = false;
    const count = ctx.spring(BASE, (v) => (countEl.textContent = fmt(v)), { duration: 0.4, bounce: 0 });
    count.jump(BASE);
    const paintBtn = () => { label.innerHTML = on ? "Subscribed " + CHECK : "Subscribe " + ARROW; btn.setAttribute("aria-pressed", String(on)); };
    paintBtn();

    /* Flat's arrival: the paper comes in on the expressive spring. */
    if (!ctx.reduced() && card.animate) card.animate([{ transform: "translateY(12px) scale(0.96)", opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: 579, easing: "linear(0, 0.0897, 0.2671, 0.4643, 0.6434, 0.7874, 0.8925, 0.9624, 1.004, 1.0249, 1.0322, 1.0295, 1.0237, 1.0173, 1.0115, 1.0068, 1.0034, 1.0012, 0.9998, 0.9992, 1)" });

    const STRENGTH = 0.35, REACH = 150; // the pull fades to nothing this far past the button's edge
    const BOUNCY = { duration: (2 * Math.PI) / Math.sqrt(260), bounce: 1 - 12 / (2 * Math.sqrt(260)) }; // stiffness 260, damping 12
    const pos = { x: 0, y: 0 };
    const write = () => {
      btn.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      label.style.transform = `translate3d(${pos.x * 0.5}px, ${pos.y * 0.5}px, 0)`;
    };
    const sx = ctx.spring(0, (v) => { pos.x = v; write(); }, BOUNCY);
    const sy = ctx.spring(0, (v) => { pos.y = v; write(); }, BOUNCY);

    /* Measured without our own transform, so the target never chases itself. */
    function lean(clientX, clientY) {
      const r = btn.getBoundingClientRect();
      const cx = r.left - pos.x + r.width / 2, cy = r.top - pos.y + r.height / 2;
      const dx = clientX - cx, dy = clientY - cy;
      const out = Math.max(0, Math.abs(dx) - r.width / 2) + Math.max(0, Math.abs(dy) - r.height / 2); // distance past the edge, roughly
      const f = Math.max(0, 1 - out / REACH);
      sx.set(dx * STRENGTH * f); sy.set(dy * STRENGTH * f);
    }
    let ghost = !ctx.reduced();
    card.addEventListener("pointermove", (e) => { if (ctx.reduced()) return; ghost = false; lean(e.clientX, e.clientY); }, { signal: ctx.signal });
    card.addEventListener("pointerleave", () => { sx.set(0); sy.set(0); }, { signal: ctx.signal });
    btn.addEventListener("click", () => {
      on = !on; paintBtn();
      count.set(BASE + (on ? 1 : 0));
      if (ctx.reduced()) count.jump(BASE + (on ? 1 : 0));
      live.textContent = on ? "Subscribed. You're reader 1,204." : "Unsubscribed";
    }, { signal: ctx.signal });

    /* The self-run: an unseen hand drifts round the button, tugs it about, then lets go so it overshoots and settles. */
    if (ghost) {
      let t = 0;
      const tug = () => {
        if (!ghost) return;
        const r = btn.getBoundingClientRect(), a = t++ * 2.4 + 0.6;
        lean(r.left - pos.x + r.width / 2 + Math.cos(a) * r.width * 0.6, r.top - pos.y + r.height / 2 + Math.sin(a) * r.height * 1.1);
      };
      const round = () => {
        if (!ghost) return;
        for (let i = 0; i < 3; i++) ctx.after(500 + i * 380, tug);
        ctx.after(500 + 3 * 380 + 200, () => { if (ghost) { sx.set(0); sy.set(0); } });
      };
      round();
      ctx.every(3200, round);
    }
    ctx.onHand(() => { ghost = false; });

    return { destroy() { sx.stop(); sy.stop(); count.stop(); } };
  },
});
