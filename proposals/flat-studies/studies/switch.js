/* Switch, after litterthanlit/components, redesigned in Flat: a newsletter's settings list on one paper. Each row says
   what it does in words; the switch is a pill (outlined when off, the ink when on) with a white circle that you can tap,
   drag or flick. The feel is the original's over-centre integrator: under a finger the circle lags toward the middle,
   snaps through and lands while you are still holding it; let go short and it falls back unless you flicked it. */
(function () {
  const S = ".fs-switch";
  /* The pill, in px. */
  const TRACK_W = 52, TRACK_H = 32, INSET = 4, CAP = 24;
  const TRAVEL = TRACK_W - 2 * INSET - CAP;

  /* The mechanism, in travel (0 is off, 1 is on) and seconds: the original's numbers. */
  const BREAKOUT = 0.03, SNAP_AT = 0.72, BEND = SNAP_AT - 0.5 - BREAKOUT, RUBBER = 0.1;
  const FOLLOW = { k: 2200, c: 84 }, SPRING = { preload: 40, peak: 260 }, STOP = { k: 16000, c: 180 }, AIR = 6;
  const FLICK = 0.15, FLICK_MIN = 0.8, FLICK_SPEED = 12, STEP = 1 / 480, TAP = { px: 5, ms: 500 };

  function capFor(q) {
    if (q < 0) return -RUBBER * (1 - Math.exp(q / (2.5 * RUBBER)));
    return Math.max(0, q - BREAKOUT - BEND * (q / SNAP_AT) ** 2);
  }
  function fingerFor(r) {
    if (r < 0) return 2.5 * RUBBER * Math.log(1 + Math.max(-0.99 * RUBBER, r) / RUBBER);
    if (r < 1e-3) return 0;
    const a = BEND / SNAP_AT ** 2;
    return (1 - Math.sqrt(Math.max(0, 1 - 4 * a * (BREAKOUT + r)))) / (2 * a);
  }

  const SETTINGS = [
    { key: "welcome", label: "Welcome letter", on: "Sent to every new reader", off: "New readers get nothing yet" },
    { key: "replies", label: "Reply emails", on: "You hear when a reader replies", off: "Replies wait in your inbox" },
    { key: "count", label: "Reader count", on: "Shown on your site", off: "Kept to yourself" },
  ];
  /* The self-run: each switch flicked on in turn and the last back off, as the original's power-up test; then, while
     no hand has come, one row changes its mind every so often, so the wall stays alive. */
  const FIRST = [[300, "welcome", true], [560, "replies", true], [820, "count", true], [1700, "count", false]];
  const IDLE = [["replies", false], ["count", true], ["replies", true], ["count", false]];

  function makeSwitch(btn, ctx, onChange) {
    let x = 0, v = 0, side = 0, user = false, time = 0, raf = 0, last = 0, hand = null, ghost = null;
    const rel = (p) => (side ? 1 - p : p);
    const abs = (r) => (side ? 1 - r : r);
    const draw = () => btn.style.setProperty("--x", x.toFixed(4));
    const light = () => { btn.toggleAttribute("data-on", !!side); btn.setAttribute("aria-checked", side ? "true" : "false"); };

    function target() {
      if (ghost) return abs(capFor(ghost.q0 + ghost.speed * (time - ghost.t0)));
      if (!hand || hand.flying) return null;
      return abs(capFor(rel(hand.anchorP + (hand.lastX - hand.anchorX) / hand.travelPx)));
    }
    function snap() {
      side = side ? 0 : 1;
      light();
      if (user && navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
      ghost = null;
      onChange(side === 1, user);
      if (hand) { hand.flying = time; hand.anchorX = hand.lastX; hand.anchorP = side; }
    }
    function step(h) {
      time += h;
      const to = target();
      let f;
      if (to !== null) f = FOLLOW.k * (to - x) - FOLLOW.c * v;
      else {
        f = (side ? 1 : -1) * (SPRING.preload + SPRING.peak * Math.max(0, 1 - Math.abs(2 * x - 1))) - AIR * v;
        if (x > 1) f -= STOP.k * (x - 1) + STOP.c * v;
        else if (x < 0) f -= STOP.k * x + STOP.c * v;
      }
      v += f * h; x += v * h;
      if (rel(x) >= 0.5) snap();
      if (hand && hand.flying && ((rel(x) < 0.02 && Math.abs(v) < 0.6) || time - hand.flying > 0.25)) hand.flying = 0;
    }
    function frame(now) {
      raf = 0;
      if (ctx.signal.aborted) return;
      let dt = Math.min(0.05, last ? (now - last) / 1000 : STEP);
      last = now;
      while (dt > 1e-9) { const h = Math.min(STEP, dt); step(h); dt -= h; }
      const rest = side + (side ? 1 : -1) * (SPRING.preload / STOP.k);
      if (!hand && !ghost && Math.abs(v) < 0.005 && Math.abs(x - rest) < 0.002) { x = side; v = 0; draw(); last = 0; return; }
      draw();
      raf = requestAnimationFrame(frame);
    }
    const run = () => { if (!raf && !ctx.signal.aborted) raf = requestAnimationFrame(frame); };

    const api = {
      get on() { return ghost ? side === 0 : side === 1; },
      flip(byUser) {
        user = byUser;
        if (ghost) ghost = null;
        else if (ctx.reduced()) return api.place(side === 0, byUser);
        else ghost = { t0: time, q0: fingerFor(Math.max(0, rel(x))), speed: FLICK_SPEED };
        run();
      },
      place(on, byUser) { if ((side === 1) === on) return; user = byUser; ghost = null; x = on ? 1 : 0; v = 0; snap(); draw(); },
      set(on) { if (api.on !== on) ctx.reduced() ? api.place(on, false) : api.flip(false); },
      stop() { if (raf) cancelAnimationFrame(raf); raf = 0; },
    };

    const sig = { signal: ctx.signal };
    btn.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      btn.focus({ preventScroll: true });
      btn.setPointerCapture(e.pointerId);
      const track = btn.querySelector(".sw-pill").getBoundingClientRect();
      user = true; ghost = null;
      const p = side ? 1 - fingerFor(rel(x)) : fingerFor(rel(x));
      hand = { anchorX: e.clientX, anchorP: p, lastX: e.clientX, startX: e.clientX, startT: e.timeStamp, travelPx: (track.width * TRAVEL) / TRACK_W,
        samples: [[e.timeStamp, e.clientX]], moved: false, flying: 0 };
      run();
    }, sig);
    btn.addEventListener("pointermove", (e) => {
      if (!hand) return;
      const t = e.timeStamp;
      hand.lastX = e.clientX; hand.samples.push([t, e.clientX]);
      while (hand.samples.length > 2 && t - hand.samples[0][0] > 100) hand.samples.shift();
      if (Math.abs(e.clientX - hand.startX) > TAP.px) hand.moved = true;
      run();
    }, sig);
    const release = (e, cancelled) => {
      const h = hand;
      if (!h) return;
      hand = null;
      const t = e.timeStamp;
      if (cancelled || h.flying) return run();
      if (!h.moved && t - h.startT < TAP.ms) return api.flip(true);
      const [t0, x0] = h.samples[0];
      const speed = t > t0 + 8 ? ((h.lastX - x0) / h.travelPx / (t - t0)) * 1000 : 0;
      const toward = side ? -speed : speed;
      if (toward > FLICK_MIN && rel(x) + toward * FLICK >= 0.5) ghost = { t0: time, q0: fingerFor(Math.max(0, rel(x))), speed: Math.max(FLICK_SPEED, toward) };
      run();
    };
    btn.addEventListener("pointerup", (e) => release(e, false), sig);
    btn.addEventListener("pointercancel", (e) => release(e, true), sig);
    /* Keys and assistive tech arrive as clicks with no pointer behind them. */
    btn.addEventListener("click", (e) => { if (e.detail === 0) api.flip(true); }, sig);
    light(); draw();
    return api;
  }

  let uid = 0;
  FlatPlayer.register({
    slug: "switch",
    title: "Switch",
    tagline: "A toggle you can flick, with a real over-centre spring.",
    css: `
${S} .sw { width: min(100%, 360px); background: var(--paper); border-radius: var(--r-paper); padding: 18px 8px 8px; user-select: none; -webkit-user-select: none }
${S} .sw-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 0 12px 10px }
${S} .sw-head h3 { margin: 0; font: 600 18px/1.2 var(--font); letter-spacing: -0.015em }
${S} .sw-head span { color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap }
${S} .sw-list { list-style: none; margin: 0; padding: 0; display: grid }
${S} .sw-row { all: unset; box-sizing: border-box; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 2px 16px; width: 100%;
  padding: 12px; border-radius: 12px; cursor: pointer; touch-action: pan-y; -webkit-tap-highlight-color: transparent; transition: background-color 150ms }
${S} .sw-row:hover { background: color-mix(in oklab, var(--paper), var(--ink) 3%) }
${S} .sw-row:focus-visible { outline: 2px solid var(--ink); outline-offset: -2px }
${S} .sw-label { font-size: 15px; font-weight: 500; line-height: 1.25 }
${S} .sw-note { grid-column: 1; font-size: 13px; line-height: 1.3; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
${S} .sw-pill { grid-column: 2; grid-row: 1 / span 2; position: relative; width: ${TRACK_W}px; height: ${TRACK_H}px; border-radius: var(--r-pill);
  box-shadow: inset 0 0 0 1.5px var(--outline); overflow: hidden }
${S} .sw-fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: var(--r-pill); background: var(--ink);
  width: calc(${TRACK_W - TRAVEL}px + var(--x) * ${TRAVEL}px); opacity: clamp(0, calc(var(--x) * 6), 1) }
${S} .sw-row[data-on] .sw-fill { opacity: 1 }
${S} .sw-cap { position: absolute; left: ${INSET}px; top: ${INSET}px; width: ${CAP}px; height: ${CAP}px; border-radius: 50%; background: var(--outline);
  translate: calc(var(--x) * ${TRAVEL}px) 0; transition: background-color 120ms }
${S} .sw-row[data-on] .sw-cap { background: var(--on-ink) }
@container (min-width: 560px) {
  ${S} .sw { width: 440px; padding: 24px 12px 12px }
  ${S} .sw-head { padding: 0 16px 14px } ${S} .sw-head h3 { font-size: 22px }
  ${S} .sw-row { padding: 14px 16px } ${S} .sw-label { font-size: 16px } ${S} .sw-note { font-size: 14px }
}
`,
    mount(host, ctx) {
      const id = "fs-sw-" + ++uid;
      host.innerHTML = `
<div class="sw">
  <div class="sw-head"><h3 id="${id}">Newsletter</h3><span aria-hidden="true"></span></div>
  <ul class="sw-list" role="group" aria-labelledby="${id}">
    ${SETTINGS.map((s) => `<li><button type="button" class="sw-row" role="switch" aria-checked="false" data-k="${s.key}" aria-describedby="${id}-${s.key}">
      <span class="sw-label">${s.label}</span><span class="sw-note" id="${id}-${s.key}">${s.off}</span>
      <span class="sw-pill" aria-hidden="true"><span class="sw-fill"></span><span class="sw-cap"></span></span></button></li>`).join("")}
  </ul>
</div>`;
      const count = host.querySelector(".sw-head span");
      const sw = {};
      const tally = () => { const n = SETTINGS.filter((s) => sw[s.key] && sw[s.key].on).length; count.textContent = n + " of " + SETTINGS.length + " on"; };
      for (const s of SETTINGS) {
        const btn = host.querySelector(`.sw-row[data-k="${s.key}"]`), note = btn.querySelector(".sw-note");
        sw[s.key] = makeSwitch(btn, ctx, (on) => { note.textContent = on ? s.on : s.off; tally(); });
      }
      tally();

      const timers = [];
      if (ctx.reduced()) { sw.welcome.place(true, false); sw.replies.place(true, false); }
      else {
        for (const [at, key, on] of FIRST) timers.push(ctx.after(at, () => sw[key].set(on)));
        let k = 0;
        timers.push(ctx.after(3200, () => timers.push(ctx.every(1900, () => { const [key, on] = IDLE[k++ % IDLE.length]; sw[key].set(on); }))));
      }
      ctx.onHand(() => { timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); });
      return { destroy() { Object.values(sw).forEach((s) => s.stop()); } };
    },
  });
})();
