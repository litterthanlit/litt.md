/* Fader, after litterthanlit/components, redesigned for Flat (round 2).
   The product underneath is a mixer with automation: three channels of a podcast episode that play back a recorded
   mix until you take one over. No console: a sheet of paper, three fat vertical pill sliders whose ink fill is the
   level (at the bottom stop it is a circle), each level a figure above it, a word under the name for who has it
   (Auto or Yours), and a Play pill for the automation. Kept as behaviour: a motor spring (stiffness 240, damping 30)
   carries values set from outside, the hand's land at once, a held slider lets go of its motor, 0 dB catches the
   hand within 1.2% and lets go 3.5% clear, a double press sends it home, Shift drags finely. */
(function () {
  /* stiffness 240, damping 30 at unit mass: ω = 15.5 rad/s, ζ = 0.968. */
  const MOTOR = { duration: (2 * Math.PI) / Math.sqrt(240), bounce: 1 - 30 / (2 * Math.sqrt(240)) };
  const FINE = 0.25, CATCH = 0.012, RELEASE = 0.035, DOUBLE = 320;
  const TAPER = [[0.12, -40], [0.22, -30], [0.35, -20], [0.5, -10], [0.625, -5], [0.75, 0], [0.875, 5], [1, 10]];
  function gain(t) {
    const [f0, db0] = TAPER[0];
    if (t <= f0) return t <= 0 ? -Infinity : db0 + 20 * Math.log10(t / f0);
    for (let i = 1; i < TAPER.length; i++) { const [fa, a] = TAPER[i - 1], [fb, b] = TAPER[i]; if (t <= fb) return a + ((t - fa) / (fb - fa)) * (b - a); }
    return 10;
  }
  /* "−3.5", "0.0", "+10", "−∞": tenths near 0 dB, whole decibels further out. */
  function figure(db) {
    if (db < -99) return "−∞";
    const r = Math.abs(db) < 9.95 ? Math.round(db * 10) / 10 : Math.round(db);
    const f = Math.abs(r) < 10 ? Math.abs(r).toFixed(1) : String(Math.abs(r));
    return (r > 0 ? "+" : r < 0 ? "−" : "") + f;
  }
  const RANGE = { min: 0, max: 100, step: 0.5 }, UNITY = 75;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const travelOf = (v) => clamp((v - RANGE.min) / (RANGE.max - RANGE.min), 0, 1);
  const snap = (v) => { const n = Math.round((clamp(v, RANGE.min, RANGE.max) - RANGE.min) / RANGE.step); return clamp(Math.round((RANGE.min + n * RANGE.step) * 1e6) / 1e6, RANGE.min, RANGE.max); };
  const say = (v) => figure(gain(travelOf(v))) + " dB";

  /* The recorded mix: the voice rides its phrases, the music ducks under it a beat later, the room breathes. */
  const LOOP = 8, READ_EVERY = 80, STAGGER = 0.12, HAND_BACK = 650, KEY_HAND_BACK = 1600;
  const smooth = (x) => { const c = clamp(x, 0, 1); return c * c * (3 - 2 * c); };
  const swell = (t, a, b, r) => smooth((t - a) / r) * (1 - smooth((t - b) / r));
  const speaking = (t) => { const u = ((t % LOOP) + LOOP) % LOOP; return swell(u, 0.35, 2.7, 0.45) + swell(u, 3.7, 6.5, 0.45); };
  function mix(t) {
    const voice = speaking(t), duck = speaking(t - 0.18);
    return { voice: snap(44 + 30 * voice + 2.2 * voice * Math.sin(t * Math.PI * 1.5)), music: snap(77 - 21 * duck + 1.6 * Math.sin((t * Math.PI) / 2)), room: snap(40 + 7 * Math.sin((t * Math.PI) / 4 + 0.6)) };
  }
  const CHANNELS = [{ key: "voice", label: "Voice" }, { key: "music", label: "Music" }, { key: "room", label: "Room" }];
  const ICON = { play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6l7.6-4.8z"/></svg>', pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.5h2.6v9H4.5zM8.9 3.5h2.6v9H8.9z"/></svg>' };

  FlatPlayer.register({
    slug: "fader",
    title: "Fader",
    tagline: "A mix that plays itself until you take a channel.",
    css: `
.fs-fader .fd { width: min(100%, 440px); user-select: none; -webkit-user-select: none; font-family: var(--font); --h: 240px; --w: 64px }
.fs-fader.is-tile .fd { --h: 116px; --w: 46px }
.fs-fader .fd-paper { background: var(--paper); border-radius: var(--r-paper); padding: 16px 16px 18px }
.fs-fader.is-tile .fd-paper { padding: 12px 12px 12px }
.fs-fader .fd-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-left: 4px }
.fs-fader .fd-title { min-width: 0; font-size: 15px; font-weight: 500; color: var(--ink); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-fader .fd-title span { color: var(--muted); font-weight: 400 }
.fs-fader .fd-play { all: unset; box-sizing: border-box; flex: none; display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px 0 13px; border-radius: var(--r-pill);
  background: var(--bubble); color: var(--ink); font-size: 14px; font-weight: 500; cursor: pointer; transition: transform 150ms ease-out; -webkit-tap-highlight-color: transparent }
.fs-fader .fd-play svg { width: 14px; height: 14px; fill: currentColor }
.fs-fader .fd-play:active { transform: scale(0.97); transition-duration: 75ms }
.fs-fader .fd-play:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px }
.fs-fader .fd-strip { margin-top: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px }
.fs-fader.is-tile .fd-strip { margin-top: 10px }
.fs-fader .fd-ch { display: flex; flex-direction: column; align-items: center; gap: 10px }
.fs-fader.is-tile .fd-ch { gap: 6px }
.fs-fader .fd-level { font-size: 20px; font-weight: 600; line-height: 1; font-variant-numeric: tabular-nums; color: var(--ink); letter-spacing: -0.01em; white-space: nowrap }
.fs-fader .fd-level small { font-size: 12px; font-weight: 500; color: var(--muted); margin-left: 2px; letter-spacing: 0 }
.fs-fader.is-tile .fd-level { font-size: 16px }
.fs-fader .fd-slider { position: relative; width: var(--w); height: var(--h); border-radius: var(--r-pill); background: var(--bubble); cursor: ns-resize; touch-action: none; --f: 0 }
.fs-fader .fd-slider:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px }
.fs-fader .fd-fill { position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--w) + var(--f) * (100% - var(--w))); border-radius: var(--r-pill); background: var(--ink) }
.fs-fader .fd-fill::after { content: ""; position: absolute; left: 32%; right: 32%; top: calc(var(--w) / 2 - 1.5px); height: 3px; border-radius: var(--r-pill); background: var(--on-ink); opacity: 0.85 }
.fs-fader .fd-unity { position: absolute; left: calc(100% + 6px); translate: 0 50%; font-size: 11px; font-weight: 500; line-height: 1; color: var(--muted);
  bottom: calc(var(--w) / 2 + 0.75 * (100% - var(--w))) }
.fs-fader .fd-name { font-size: 14px; font-weight: 500; color: var(--ink); line-height: 1.1 }
.fs-fader .fd-who { font-size: 12px; line-height: 1; min-height: 12px; color: var(--muted); margin-top: -4px }
.fs-fader .fd-who[data-who="yours"] { color: var(--ink); font-weight: 500 }
.fs-fader.is-tile .fd-who { display: none }
`,
    mount(host, ctx) {
      const reduced = ctx.reduced(), S = ctx.signal, on = (el, t, f) => el.addEventListener(t, f, { signal: S });
      host.innerHTML = `
<div class="fd">
  <div class="fd-paper">
    <div class="fd-head"><div class="fd-title">Episode 12 <span>mix</span></div><button type="button" class="fd-play"></button></div>
    <div class="fd-strip"></div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const play = host.querySelector(".fd-play"), strip = host.querySelector(".fd-strip"), live = host.querySelector("[aria-live]");
      const modes = { voice: "off", music: "off", room: "off" };
      const holding = new Set(), homed = new Set(), timers = {};
      let playing = false, started = 0, time = 0, selfRun = !reduced, downTarget = null;

      const ch = {};
      CHANNELS.forEach(({ key, label }) => {
        const col = document.createElement("div");
        col.className = "fd-ch";
        col.innerHTML = `<span class="fd-level" aria-hidden="true"></span>
<div class="fd-slider" role="slider" tabindex="0" aria-orientation="vertical" aria-valuemin="${RANGE.min}" aria-valuemax="${RANGE.max}" aria-label="${label}">
  <span class="fd-fill" aria-hidden="true"></span><span class="fd-unity" aria-hidden="true">0</span>
</div>
<span class="fd-name" aria-hidden="true">${label}</span><span class="fd-who" aria-hidden="true"></span>`;
        strip.appendChild(col);
        const el = col.querySelector(".fd-slider"), level = col.querySelector(".fd-level");
        let shown = "";
        const c = { key, label, el, who: col.querySelector(".fd-who"), at: 0, target: 0, held: false, placed: false, drag: null, press: null, lastPress: { at: -Infinity, y: 0 } };
        c.spring = ctx.spring(0, (permille) => {
          const f = permille / 1000;
          el.style.setProperty("--f", f.toFixed(4));
          const text = figure(gain(travelOf(snap(RANGE.min + f * (RANGE.max - RANGE.min)))));
          if (text !== shown) { shown = text; level.innerHTML = text + "<small>dB</small>"; }
        }, MOTOR);
        c.spring.jump(0);
        ch[key] = c;
      });

      /* A new value: the hand's lands at once, the motor carries anyone else's, unless a hand holds the slider. */
      function apply(c, v, kind) {
        c.at = v; c.target = travelOf(v) * 1000;
        c.el.setAttribute("aria-valuenow", String(v));
        c.el.setAttribute("aria-valuetext", say(v));
        if (!c.placed || reduced || kind === "hand") { c.placed = true; c.spring.jump(c.target); }
        else if (kind === "glide" || !c.held) c.spring.set(c.target);
      }
      function moveTo(c, v, glide) { apply(c, v, glide ? "glide" : "hand"); change(c, v); }

      function render() {
        play.innerHTML = (playing ? ICON.pause : ICON.play) + (playing ? "Pause" : "Play");
        play.setAttribute("aria-label", playing ? "Pause the automation" : "Play the automation");
        CHANNELS.forEach(({ key }) => { const w = ch[key].who, m = modes[key]; w.dataset.who = m === "touch" ? "yours" : m; w.textContent = m === "touch" ? "Yours" : m === "read" ? "Auto" : ""; });
      }
      function setMode(c, mode) {
        if (modes[c.key] === mode) return;
        modes[c.key] = mode; render();
        if (mode === "touch") live.textContent = c.label + " is yours";
        else if (mode === "read") live.textContent = c.label + " is back on the automation";
      }
      function handBack(c, after) { clearTimeout(timers[c.key]); timers[c.key] = ctx.after(after, () => setMode(c, playing ? "read" : "off")); }
      function touch(c, isOn) {
        clearTimeout(timers[c.key]);
        if (isOn) { holding.add(c.key); setMode(c, "touch"); }
        else { holding.delete(c.key); handBack(c, homed.delete(c.key) ? KEY_HAND_BACK : HAND_BACK); }
      }
      function change(c, v) {
        if (holding.has(c.key)) { if (v === UNITY) homed.add(c.key); else homed.delete(c.key); return; }
        setMode(c, "touch"); handBack(c, KEY_HAND_BACK);
      }
      function start() {
        started = performance.now() - time * 1000; playing = true;
        CHANNELS.forEach(({ key }) => { if (!holding.has(key)) modes[key] = "read"; });
        render(); live.textContent = "Playing the automation";
      }
      function stop() {
        playing = false;
        CHANNELS.forEach(({ key }) => { if (modes[key] === "read") modes[key] = "off"; });
        render(); live.textContent = "Automation paused";
      }
      ctx.every(READ_EVERY, () => {
        if (!playing) return;
        const t = (performance.now() - started) / 1000, curve = mix(t);
        time = t;
        CHANNELS.forEach(({ key }, i) => { if (modes[key] === "read" && t >= i * STAGGER) apply(ch[key], curve[key], "auto"); });
      });

      /* The first hand stops the self-run for good; a press on Play is the hand's own choice. */
      window.addEventListener("pointerdown", (e) => { downTarget = e.target; }, { capture: true, signal: S });
      window.addEventListener("keydown", (e) => { downTarget = e.target; }, { capture: true, signal: S });
      ctx.onHand(() => {
        if (!selfRun) return;
        selfRun = false;
        if (!(downTarget && play.contains(downTarget)) && playing) stop();
      });
      on(play, "click", () => (playing ? stop() : start()));

      CHANNELS.forEach(({ key }) => {
        const c = ch[key], el = c.el;
        on(el, "keydown", (e) => {
          const range = RANGE.max - RANGE.min;
          const delta = { ArrowUp: RANGE.step, ArrowRight: RANGE.step, ArrowDown: -RANGE.step, ArrowLeft: -RANGE.step, PageUp: range / 10, PageDown: -range / 10 }[e.key];
          const next = delta !== undefined ? snap(c.at + delta) : e.key === "Home" ? RANGE.min : e.key === "End" ? RANGE.max : null;
          if (next === null) return;
          e.preventDefault();
          if (next !== c.at) moveTo(c, next, true);
        });
        on(el, "pointerdown", (e) => {
          if (e.button !== 0 || c.press !== null) return;
          e.preventDefault();
          el.focus({ preventScroll: true });
          el.setPointerCapture(e.pointerId);
          c.press = e.pointerId;
          touch(c, true);
          const last = c.lastPress, dbl = e.timeStamp - last.at < DOUBLE && Math.abs(e.clientY - last.y) < 24;
          c.lastPress = { at: dbl ? -Infinity : e.timeStamp, y: e.clientY };
          if (dbl) { if (c.at !== UNITY) moveTo(c, UNITY, true); return; }
          const box = el.getBoundingClientRect(), knob = box.width, travel = box.height - knob;
          const capTop = box.bottom - knob - (c.spring.value() / 1000) * travel;
          c.held = true;
          let from;
          if (e.clientY >= capTop - 6 && e.clientY <= capTop + knob + 6) {
            c.spring.jump(c.spring.value()); // on the handle: the hand stops the motor where it is
            from = RANGE.min + (c.spring.value() / 1000) * (RANGE.max - RANGE.min);
          } else {
            from = snap(RANGE.min + clamp((box.bottom - knob / 2 - e.clientY) / travel, 0, 1) * (RANGE.max - RANGE.min));
            if (from !== c.at) moveTo(c, from, true); // beside it: the motor brings it to the hand
          }
          c.drag = { id: e.pointerId, y: e.clientY, from, raw: from, travel, fine: e.shiftKey, caught: from === UNITY };
        });
        on(el, "pointermove", (e) => {
          const d = c.drag;
          if (!d || d.id !== e.pointerId) return;
          const range = RANGE.max - RANGE.min;
          if (e.shiftKey !== d.fine) { d.from = d.raw; d.y = e.clientY; d.fine = e.shiftKey; }
          let raw = d.from - ((e.clientY - d.y) / d.travel) * range * (d.fine ? FINE : 1);
          if (raw > RANGE.max || raw < RANGE.min) { raw = clamp(raw, RANGE.min, RANGE.max); d.from = raw; d.y = e.clientY; }
          const off = raw - UNITY;
          let next;
          if (d.caught && Math.abs(off) <= RELEASE * range) next = UNITY;
          else if (!d.caught && Math.abs(off) <= CATCH * range) { d.caught = true; next = UNITY; }
          else { d.caught = false; next = snap(raw); }
          d.raw = raw;
          if (next !== c.at) moveTo(c, next, false);
        });
        const end = (e) => {
          if (c.press !== e.pointerId) return;
          c.press = null; c.drag = null;
          if (c.held) { c.held = false; if (Math.abs(c.spring.value() - c.target) > 0.5) c.spring.set(c.target); }
          touch(c, false);
        };
        on(el, "pointerup", end);
        on(el, "pointercancel", end);
      });

      CHANNELS.forEach(({ key }) => apply(ch[key], 0, "auto"));
      render();
      /* Power-up: the automation plays; under reduced motion, a still mix. */
      ctx.after(250, () => {
        if (reduced) { const m = mix(1.6); CHANNELS.forEach(({ key }) => apply(ch[key], m[key], "auto")); }
        else if (selfRun) start();
      });
      return { destroy() { Object.values(ch).forEach((c) => c.spring.stop()); } };
    },
  });
})();
