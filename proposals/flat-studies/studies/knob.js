/* Knob, redesigned for Flat: scene recall without the desk. A preset picker (Voice or Music) over three pill sliders.
   Picking a preset glides each slider to it on a spring (the original's motor: stiffness 170, damping 22), one after
   another; a hand on a slider takes it at once and the preset reads Edited. Values keep their detents, Tone keeps its log
   taper and Gain fills out from the centre, because it cuts and boosts. */
(function () {
  const STAGGER = 120;
  const GENTLE = { duration: (2 * Math.PI) / Math.sqrt(170), bounce: 1 - 22 / (2 * Math.sqrt(170)) };
  const indexOf = (v, { min, max, detents, taper }) => {
    const f = taper === "log" ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min);
    return Math.round(Math.min(1, Math.max(0, f)) * detents);
  };
  const valueAt = (i, { min, max, detents, taper }) => {
    const v = taper === "log" ? min * Math.pow(max / min, i / detents) : min + ((max - min) * i) / detents;
    return Math.round(v * 100) / 100;
  };
  const PARAMS = [
    { key: "gain", label: "Gain", min: -12, max: 12, detents: 24, bipolar: true, format: (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(Math.round(v)) + " dB" },
    { key: "tone", label: "Tone", min: 200, max: 8000, detents: 24, taper: "log", format: (v) => (v >= 1000 ? (v / 1000).toFixed(1) + " kHz" : Math.round(v) + " Hz") },
    { key: "mix", label: "Mix", min: 0, max: 100, detents: 20, format: (v) => Math.round(v) + "%" },
  ];
  const PRESETS = { voice: { name: "Voice", at: { gain: 18, tone: 16, mix: 8 } }, music: { name: "Music", at: { gain: 9, tone: 8, mix: 15 } } };
  const STATUS = { moving: "Moving", loaded: "Loaded", edited: "Edited" };
  let n = 0;

  FlatPlayer.register({
    slug: "knob",
    title: "Knob",
    tagline: "Presets that glide into place.",
    css: `
.fs-knob .kp { width: min(24em, 100%); font-size: clamp(13px, calc(2.2cqw + 6px), 16px); background: var(--paper); border-radius: var(--r-paper);
  padding: 1.25em; display: grid; gap: 1.1em; -webkit-user-select: none; user-select: none }
.fs-knob .is-tile .kp, .fs-knob.is-tile .kp { gap: 0.8em; padding: 1em 1.1em }
.fs-knob .kp-top { display: flex; align-items: center; justify-content: space-between; gap: 0.75em }
.fs-knob .kp-seg { position: relative; display: inline-flex; padding: 0.25em; border-radius: var(--r-pill); background: var(--bubble) }
.fs-knob .kp-ind { position: absolute; top: 0.25em; bottom: 0.25em; left: 0; border-radius: var(--r-pill); background: var(--paper) }
.fs-knob .kp-ind[hidden] { display: none }
.fs-knob .kp-opt { position: relative; height: 2.2em; padding: 0 1.1em; border: 0; border-radius: var(--r-pill); background: transparent; color: var(--muted);
  font-weight: 500; cursor: pointer; transition: color var(--dur-instant) }
.fs-knob .kp-opt[aria-checked="true"] { color: var(--ink) }
.fs-knob .kp-status { font-size: 0.87em; color: var(--muted); white-space: nowrap }
.fs-knob .kp-rows { display: grid; gap: 0.75em }
.fs-knob .kp-row { display: grid; gap: 0.35em }
.fs-knob .kp-head { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5em }
.fs-knob .kp-head span { color: var(--muted); font-size: 0.93em }
.fs-knob .kp-head b { font-weight: 600; font-variant-numeric: tabular-nums }
.fs-knob .kp-track { --r: 0.875em; position: relative; height: calc(var(--r) * 2); border-radius: var(--r-pill); background: var(--bubble); cursor: pointer; touch-action: none }
.fs-knob .kp-fill { position: absolute; top: 0; bottom: 0; border-radius: var(--r-pill); background: var(--ink) }
.fs-knob .kp-thumb { position: absolute; top: 0.25em; width: calc(var(--r) * 2 - 0.5em); height: calc(var(--r) * 2 - 0.5em); margin-left: calc(-1 * (var(--r) - 0.25em));
  border-radius: 50%; background: var(--paper); transition: transform 100ms }
.fs-knob .kp-track:active .kp-thumb { transform: scale(0.85) }
`,
    mount(host, ctx) {
      const id = "kp" + ++n;
      host.innerHTML = `
<div class="kp">
  <div class="kp-top">
    <div class="kp-seg" role="radiogroup" aria-label="Preset"><span class="kp-ind" aria-hidden="true"></span>
      <button class="kp-opt" type="button" role="radio" data-p="voice">Voice</button><button class="kp-opt" type="button" role="radio" data-p="music">Music</button></div>
    <span class="kp-status" aria-hidden="true"></span>
  </div>
  <div class="kp-rows"></div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const sig = { signal: ctx.signal };
      const seg = host.querySelector(".kp-seg"), ind = host.querySelector(".kp-ind"), opts = [...host.querySelectorAll(".kp-opt")];
      const statusEl = host.querySelector(".kp-status"), rows = host.querySelector(".kp-rows"), live = host.querySelector("[aria-live]");
      const values = Object.fromEntries(PARAMS.map((p) => [p.key, valueAt(0, p)]));
      let preset = "voice", status = "moving";
      const travelling = new Set();
      let timers = [];

      /* The segmented pill: a white pill rides between the options on a spring, and leaves once the preset is edited. */
      let indSpring = null, indW = 0;
      function drawTop(animate) {
        statusEl.textContent = STATUS[status];
        opts.forEach((o) => { const on = o.dataset.p === preset && status !== "edited"; o.setAttribute("aria-checked", String(on)); o.tabIndex = o.dataset.p === preset ? 0 : -1; });
        const on = opts.find((o) => o.dataset.p === preset);
        ind.hidden = status === "edited";
        const x = on.offsetLeft;
        ind.style.width = on.offsetWidth + "px";
        if (!indSpring) indSpring = ctx.spring(x, (v) => (ind.style.transform = "translateX(" + v.toFixed(2) + "px)"), { duration: 0.35, bounce: 0.28 });
        if (animate) indSpring.set(x); else indSpring.jump(x);
      }

      /* One slider: a spring in detents draws the fill, the thumb and the figure. */
      function Slider(p) {
        const row = document.createElement("div");
        row.className = "kp-row";
        row.innerHTML = '<div class="kp-head" aria-hidden="true"><span></span><b></b></div><div class="kp-track" role="slider" tabindex="0"><span class="kp-fill"></span><span class="kp-thumb"></span></div>';
        rows.appendChild(row);
        const track = row.querySelector(".kp-track"), fill = row.querySelector(".kp-fill"), thumb = row.querySelector(".kp-thumb"), fig = row.querySelector("b");
        row.querySelector(".kp-head span").textContent = p.label;
        track.setAttribute("aria-label", p.label); track.setAttribute("aria-valuemin", p.min); track.setAttribute("aria-valuemax", p.max);
        let index = 0, target = 0, moving = false, shown = -1, drag = null;
        const at = (f) => "calc(var(--r) + " + f.toFixed(4) + " * (100% - var(--r) * 2))";
        const spring = ctx.spring(0, (d) => {
          const f = Math.min(1, Math.max(0, d / p.detents));
          thumb.style.left = at(f);
          const a = p.bipolar ? Math.min(f, 0.5) : 0, b = p.bipolar ? Math.max(f, 0.5) : f;
          fill.style.left = "calc(" + at(a) + " - var(--r))";
          fill.style.width = "calc(" + (b - a).toFixed(4) + " * (100% - var(--r) * 2) + var(--r) * 2)";
          const det = Math.round(d);
          if (det !== shown) { shown = det; fig.textContent = p.format(valueAt(Math.min(p.detents, Math.max(0, det)), p)); }
          if (moving && d === target) { moving = false; settled(p.key); }
        }, GENTLE);
        function show(v, byHand) {
          index = indexOf(v, p); target = index;
          track.setAttribute("aria-valuenow", String(v)); track.setAttribute("aria-valuetext", p.format(v));
          if (byHand || ctx.reduced()) { moving = false; spring.jump(target); if (!byHand) settled(p.key); }
          else { moving = true; spring.set(target); }
        }
        function turnTo(i) {
          const next = Math.min(p.detents, Math.max(0, i));
          if (next === index && !moving) return;
          travelling.delete(p.key);
          values[p.key] = valueAt(next, p);
          if (status !== "edited") { status = "edited"; drawTop(true); live.textContent = "Preset edited"; }
          show(values[p.key], true);
        }
        const fromX = (x) => { const r = track.getBoundingClientRect(), rad = r.height / 2; return Math.round(((x - r.left - rad) / (r.width - 2 * rad)) * p.detents); };
        track.addEventListener("pointerdown", (e) => {
          if (e.button !== 0) return;
          track.setPointerCapture(e.pointerId); drag = e.pointerId; turnTo(fromX(e.clientX));
        }, sig);
        track.addEventListener("pointermove", (e) => { if (drag === e.pointerId) turnTo(fromX(e.clientX)); }, sig);
        const end = (e) => { if (drag === e.pointerId) drag = null; };
        track.addEventListener("pointerup", end, sig); track.addEventListener("pointercancel", end, sig);
        track.addEventListener("keydown", (e) => {
          const page = Math.max(1, Math.round(p.detents / 10));
          const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: page, PageDown: -page }[e.key];
          if (d) turnTo(index + d); else if (e.key === "Home") turnTo(0); else if (e.key === "End") turnTo(p.detents); else return;
          e.preventDefault();
        }, sig);
        show(values[p.key], true);
        return { show, stop: () => spring.stop() };
      }
      const sliders = Object.fromEntries(PARAMS.map((p) => [p.key, Slider(p)]));

      function settled(key) {
        if (!travelling.delete(key) || travelling.size) return;
        status = "loaded"; drawTop(false); live.textContent = PRESETS[preset].name + " preset loaded";
      }
      /* The sliders glide to the preset one after another. */
      function recall(next) {
        timers.forEach(clearTimeout);
        const target = Object.fromEntries(PARAMS.map((p) => [p.key, valueAt(PRESETS[next].at[p.key], p)]));
        const moving = PARAMS.filter((p) => values[p.key] !== target[p.key]).map((p) => p.key);
        travelling.clear(); moving.forEach((k) => travelling.add(k));
        preset = next; status = moving.length ? "moving" : "loaded"; drawTop(true);
        if (!moving.length) live.textContent = PRESETS[next].name + " preset loaded";
        timers = moving.map((key, i) => ctx.after(i * STAGGER, () => { values[key] = target[key]; sliders[key].show(values[key], false); }));
      }
      opts.forEach((o) => o.addEventListener("click", () => recall(o.dataset.p), sig));
      seg.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        const next = preset === "voice" ? "music" : "voice";
        recall(next); opts.find((o) => o.dataset.p === next).focus();
      }, sig);
      drawTop(false);

      /* On mount it loads Voice; until a hand arrives it compares the two presets. */
      let handed = false;
      ctx.onHand(() => { handed = true; });
      ctx.after(350, () => recall("voice"));
      if (!ctx.reduced()) ctx.every(2600, () => { if (!handed) recall(preset === "voice" ? "music" : "voice"); });
      return { destroy() { Object.values(sliders).forEach((s) => s.stop()); if (indSpring) indSpring.stop(); } };
    },
  });
})();
