/* VU Meter, redesigned for Flat: a mic check before you record, with no needles. A large level figure, two pill bars that
   fill along the sunset ramp, a peak mark that holds and falls, and the level said in words. The bars keep the VU
   standard's ballistics (stiffness 166, damping 20.2: 99% of a steady tone in about 300 ms, about 1.5% overshoot) after a
   60 ms detector, so speech reads steadily and a click never pins them. Flat has no sound, so the signal is a synthetic
   voice until a hand arrives; then the bars read your presses, and Test tone sends a line-up tone that settles on 0 dB. */
(function () {
  const FULL = 10 ** (3 / 20), RELEASE = 0.06, FLOOR = -30, TOP = 3, HOLD = 900, FALL = 12;
  const BALLISTICS = { duration: (2 * Math.PI) / Math.sqrt(166), bounce: 1 - 20.2 / (2 * Math.sqrt(166)) };
  const db = (lin) => (lin > 0 ? 20 * Math.log10(lin) : -Infinity);
  const pos = (d) => Math.min(1, Math.max(0, (d - FLOOR) / (TOP - FLOOR)));
  const fmt = (d) => (d < -0.5 ? "−" : "") + Math.abs(Math.round(d));

  FlatPlayer.register({
    slug: "vu-meter",
    title: "VU Meter",
    tagline: "Levels with real VU ballistics.",
    css: `
.fs-vu-meter .mc { width: min(24em, 100%); font-size: clamp(13px, calc(2.2cqw + 6px), 16px); background: var(--paper); border-radius: var(--r-paper);
  padding: 1.25em; display: grid; gap: 1em; -webkit-user-select: none; user-select: none }
.fs-vu-meter.is-tile .mc { gap: 0.8em; padding: 1.1em }
.fs-vu-meter .mc-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 1em }
.fs-vu-meter .mc-fig { font-size: 2.6em; font-weight: 600; letter-spacing: -0.04em; line-height: 0.9; font-variant-numeric: tabular-nums; white-space: nowrap }
.fs-vu-meter .mc-fig small { font-size: 0.42em; font-weight: 500; letter-spacing: 0; margin-left: 0.2em; color: var(--muted) }
.fs-vu-meter .mc-word { display: grid; justify-items: end; gap: 0.1em; text-align: right }
.fs-vu-meter .mc-word span { font-size: 0.87em; color: var(--muted) }
.fs-vu-meter .mc-word b { font-weight: 500; transition: color var(--dur-instant) }
.fs-vu-meter .mc-word b[data-tone="good"] { color: var(--ink) } .fs-vu-meter .mc-word b[data-tone="loud"] { color: var(--cherry-text) }
.fs-vu-meter .mc-bars { display: grid; gap: 0.45em }
.fs-vu-meter .mc-bar { display: grid; grid-template-columns: 1.1em 1fr; align-items: center; gap: 0.5em; font-size: 0.87em; color: var(--muted) }
.fs-vu-meter .mc-track { position: relative; height: 1.1em; border-radius: var(--r-pill); background: var(--bubble); overflow: hidden }
.fs-vu-meter .mc-fill { position: absolute; inset: 0; border-radius: var(--r-pill);
  background: var(--ink);
  clip-path: inset(0 calc(100% - var(--l, 0) * 100%) 0 0 round var(--r-pill)) }
.fs-vu-meter .mc-peak { position: absolute; top: 0.2em; bottom: 0.2em; width: 0.3em; margin-left: -0.15em; left: calc(var(--k, 0) * 100%); border-radius: var(--r-pill);
  background: var(--ink); opacity: var(--ko, 0) }
.fs-vu-meter .mc-row { display: flex; align-items: center; gap: 0.5em; flex-wrap: wrap }
.fs-vu-meter .mc-btn { height: 2.6em; padding: 0 1.15em; border: 0; border-radius: var(--r-pill); background: var(--bubble); color: var(--ink); font-weight: 500; cursor: pointer;
  transition: transform 100ms, background-color var(--dur-instant), color var(--dur-instant) }
.fs-vu-meter .mc-btn:active { transform: scale(0.97) }
.fs-vu-meter .mc-btn[aria-pressed="true"] { background: var(--ink); color: var(--on-ink) }
.fs-vu-meter.is-tile .mc-row { display: none }
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="mc">
  <div class="mc-top">
    <div class="mc-fig" aria-hidden="true"></div>
    <div class="mc-word"><span>Mic check</span><b></b></div>
  </div>
  <div class="mc-bars" aria-hidden="true">
    <div class="mc-bar"><span>L</span><span class="mc-track"><span class="mc-fill"></span><span class="mc-peak"></span></span></div>
    <div class="mc-bar"><span>R</span><span class="mc-track"><span class="mc-fill"></span><span class="mc-peak"></span></span></div>
  </div>
  <div class="mc-row">
    <button class="mc-btn" type="button" data-act="voice" aria-pressed="false">Sample voice</button>
    <button class="mc-btn" type="button" data-act="tone" aria-pressed="false">Test tone</button>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const sig = { signal: ctx.signal };
      const tracks = [...host.querySelectorAll(".mc-track")], figEl = host.querySelector(".mc-fig"), wordEl = host.querySelector(".mc-word b");
      const voiceBtn = host.querySelector('[data-act="voice"]'), toneBtn = host.querySelector('[data-act="tone"]'), live = host.querySelector("[aria-live]");

      /* The bars: a spring in deflection (linear in voltage, 1 at +3 dB), shown on a dB scale from −30 to +3. */
      const shown = [0, 0];
      const springs = [0, 1].map((c) => ctx.spring(0, (d) => { shown[c] = d; tracks[c].style.setProperty("--l", pos(db(Math.max(0, d) * FULL)).toFixed(4)); }, BALLISTICS));

      /* A synthetic voice, in levels where 1 reads 0 dB: phrases of syllables with pauses between, now and then a loud one. */
      let speaking = false, sylEnd = 0, sylLen = 0, sylAmp = 0, inPhrase = 0, pauseUntil = 0, t = 0;
      function voice(dt) {
        t += dt;
        if (t >= sylEnd) {
          if (inPhrase <= 0) { pauseUntil = t + 0.3 + Math.random() * 0.6; inPhrase = 5 + Math.floor(Math.random() * 9); }
          const start = Math.max(t, pauseUntil);
          sylLen = 0.12 + Math.random() * 0.14; sylEnd = start + sylLen; inPhrase--;
          sylAmp = Math.random() < 0.05 ? 1.55 : 0.45 + Math.random() * 0.7;
        }
        const into = t - (sylEnd - sylLen);
        const env = into < 0 ? 0 : Math.sin(Math.PI * Math.min(1, into / sylLen)) ** 0.7;
        return 0.02 + sylAmp * env;
      }
      let toneAt = -1, kick = 0;
      function tone(now) {
        if (toneAt < 0) return 0;
        const s = (now - toneAt) / 1000;
        return s < 0.012 ? s / 0.012 : s < 0.912 ? 1 : s < 0.982 ? Math.exp(-(s - 0.912) / 0.02) : 0;
      }

      const env = [0, 0], peak = [FLOOR, FLOOR], peakAt = [0, 0], recent = [];
      let loudUntil = 0, lastFig = 0, word = "";
      ctx.loop((dt, now) => {
        const v = speaking ? voice(dt) : 0;
        kick *= Math.exp(-dt / 0.025);
        for (let c = 0; c < 2; c++) {
          const level = Math.max(v * (c ? 0.92 : 1) * (0.96 + Math.random() * 0.08), tone(now), kick);
          env[c] = Math.max(level, env[c] * Math.exp(-dt / RELEASE));
          springs[c].set(env[c] / FULL);
          if (level > FULL) loudUntil = now + 600;
          /* The peak mark holds 900 ms, then falls 12 dB a second. */
          const d = db(Math.max(0, shown[c]) * FULL);
          if (d >= peak[c]) { peak[c] = d; peakAt[c] = now; }
          else if (now - peakAt[c] > HOLD) peak[c] = Math.max(d, peak[c] - FALL * dt);
          tracks[c].style.setProperty("--k", pos(peak[c]).toFixed(4));
          tracks[c].style.setProperty("--ko", peak[c] > FLOOR + 1 ? "1" : "0");
        }
        if (toneAt >= 0 && now - toneAt > 1000) { toneAt = -1; toneBtn.setAttribute("aria-pressed", "false"); }
        /* The figure and the word, ten times a second, so they can be read. */
        if (now - lastFig > 100) {
          lastFig = now;
          const d = Math.max(FLOOR, db(Math.max(shown[0], shown[1]) * FULL));
          figEl.innerHTML = fmt(d) + "<small>dB</small>";
          recent.push(d); if (recent.length > 15) recent.shift();
          const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const next = now < loudUntil ? "loud" : avg < -26 ? "quiet" : avg < -16 ? "low" : "good";
          if (next !== word) {
            word = next;
            wordEl.textContent = { loud: "Too loud", quiet: "Waiting for sound", low: "A little quiet", good: "Good level" }[word];
            wordEl.dataset.tone = word;
            if (!ctx.tile) live.textContent = wordEl.textContent;
          }
        }
      });

      function setVoice(on) { speaking = on; voiceBtn.setAttribute("aria-pressed", String(on)); voiceBtn.textContent = on ? "Stop voice" : "Sample voice"; }
      voiceBtn.addEventListener("click", () => setVoice(!speaking), sig);
      toneBtn.addEventListener("click", () => { toneAt = performance.now(); toneBtn.setAttribute("aria-pressed", "true"); }, sig);

      /* Every press is picked up a little. A hand ends the sample voice, unless it pressed the voice's own button. */
      let handPending = false, touched = false;
      ctx.onHand(() => { handPending = true; touched = true; });
      const press = (e) => {
        if (handPending) { handPending = false; if (!voiceBtn.contains(e.target)) setVoice(false); }
        kick = Math.max(kick, 0.9);
      };
      host.addEventListener("pointerdown", press, { signal: ctx.signal, capture: true });
      host.addEventListener("keydown", (e) => { if (!e.repeat) press(e); }, { signal: ctx.signal, capture: true });
      host.addEventListener("wheel", () => { if (handPending) { handPending = false; setVoice(false); } }, { signal: ctx.signal, capture: true, passive: true });

      setVoice(false);
      if (!ctx.reduced()) ctx.after(400, () => { if (!touched) setVoice(true); });
      return { destroy() { springs.forEach((s) => s.stop()); } };
    },
  });
})();
