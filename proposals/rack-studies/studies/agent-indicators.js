/* Agent Indicators, after litterthanlit/components, redesigned for Rack: an agent's run as a lane of steps in an
   agent console. Each kind of step is a clip in its own colour (think purple, search blue, read cyan, reason
   pink, tool calls orange, write green), its contents a small trace of what it does (lines of thought, results,
   a file, a branching plan, eight tool calls, a diff). The run launches them in turn on a steady tick, four
   ticks each; the playing clip fills in its colour and its trace lights in reading order as it goes, the diff
   written as it plays. The clock reads elapsed seconds; tokens are a level on a meter in the playing step's
   colour, with the original's ballistics (a quick fall, a peak that holds 900ms). A hand launches a step
   itself, quantised to the next tick (it shows queued until then), and the step repeats; Run stops time.
   Nothing travels: clips cut in column by column, a launch is a colour change on the frame. */
(function () {
  const S = ".fs-agent-indicators";
  const BEAT = 0.5, CLIP_BEATS = 4; // a tick is 0.5s; a step runs four ticks
  const PHASES = [
    { key: "think", name: "Think", hue: "purple", line: "Thinking it through" },
    { key: "search", name: "Search", hue: "blue", line: "Searching 12 sources" },
    { key: "read", name: "Read", hue: "cyan", line: "Reading 3 files" },
    { key: "reason", name: "Reason", hue: "pink", line: "Weighing 2 plans" },
    { key: "run", name: "Tools", hue: "orange", line: "Calling 8 tools" },
    { key: "write", name: "Write", hue: "green", line: "Writing the patch" },
  ];
  /* Each clip's trace, as a console draws a step's contents: rows in a 48×20 box (x, y, w, h). Seeded, so tile and open agree. */
  function marks(key) {
    let seed = key.length * 97 + key.charCodeAt(0);
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const out = [];
    const row = (y, x, w, h = 2.2) => out.push([x, y, w, h]);
    if (key === "run") { for (let i = 0; i < 8; i++) row(5, 1 + i * 5.9, 4.4, 10); } // eight tool calls
    else if (key === "search") { for (let i = 0; i < 4; i++) { row(1 + i * 5, 1, 6); row(1 + i * 5, 9, 18 + rnd() * 20); } } // results: a source, a line
    else if (key === "reason") { const ind = [0, 5, 10, 5, 10, 0]; ind.slice(0, 5).forEach((d, i) => row(0.5 + i * 4, 1 + d, 14 + rnd() * 16)); } // a branching plan
    else if (key === "read") { for (let i = 0; i < 5; i++) row(0.5 + i * 4, 1 + (i % 3 === 1 ? 5 : 0), 12 + rnd() * 30, 1.8); } // a file, indented
    else if (key === "write") { for (let i = 0; i < 5; i++) row(0.5 + i * 4, 1 + (i === 2 || i === 3 ? 4 : 0), 14 + rnd() * 28, 1.8); } // the patch, written as it plays
    else { for (let i = 0; i < 4; i++) row(1 + i * 5, 1, 16 + rnd() * 28); } // lines of thought
    return out;
  }
  /* The meter's scale, as the original's: the top end gets the room. */
  const SCALE = [[-60, 0], [-40, 0.2], [-20, 0.4], [-12, 0.6], [-6, 0.8], [0, 1]];
  function toScale(db) {
    if (db <= -60) return 0;
    for (let i = 1; i < SCALE.length; i++) { const [d1, f1] = SCALE[i], [d0, f0] = SCALE[i - 1]; if (db <= d1) return f0 + ((db - d0) / (d1 - d0)) * (f1 - f0); }
    return 1;
  }
  const NS = "http://www.w3.org/2000/svg";

  FlatPlayer.register({
    slug: "agent-indicators",
    title: "Agent Indicators",
    tagline: "An agent's run as a lane of steps: think, search, read, reason, call tools, write.",
    css: `
${S} .ag { width: min(100%, 640px); background: var(--body); padding: 3px; border-radius: 9px }
${S} .ag-dev { background: var(--panel); border-radius: var(--r-panel); overflow: hidden }
${S} .ag-strip { display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 6px 0 10px; background: var(--panel-2) }
${S} .ag-strip b { font-size: 12px; font-weight: 600 }
${S} .ag-strip span { font-size: 11px; color: var(--muted); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
${S} .ag-key { height: 20px; min-width: 44px; padding: 0 8px; border: 0; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge);
  font-size: 11px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 5px }
${S} .ag-key:hover { background: var(--block-hover) }
${S} .ag-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
${S} .ag-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
${S} .ag-key svg { width: 8px; height: 8px; fill: currentColor }
${S} .ag-body { padding: 10px; display: grid; gap: 10px }
${S} .ag-top { display: flex; align-items: center; gap: 8px; min-width: 0 }
${S} .ag-pos { font: 600 20px/1 var(--mono); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; flex: none }
${S} .ag-box { height: 22px; display: inline-flex; align-items: center; padding: 0 7px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 500 11px var(--mono); font-variant-numeric: tabular-nums; white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis }
${S} .ag-line { flex: 1; color: var(--hue-text, var(--ink)) }
${S} .ag-clips { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 2px; background: var(--body); padding: 2px; border-radius: var(--r-control) }
${S} .ag-clip { position: relative; display: grid; grid-template-rows: auto 1fr; gap: 2px; min-width: 0; height: 52px; padding: 3px 4px 4px; border: 0; border-radius: var(--r-control);
  background: var(--hue-tint); color: var(--hue-text); text-align: left; cursor: pointer; overflow: hidden }
${S} .ag-clip.is-in { opacity: 0 }
${S} .ag-clip.is-cut { opacity: 1; transition: opacity var(--cut-in) var(--ease-out) }
${S} .ag-clip:active { box-shadow: var(--edge-press) }
${S} .ag-clip-head { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; min-width: 0 }
${S} .ag-clip-head span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
${S} .ag-clip-head svg { flex: none; width: 7px; height: 7px; fill: currentColor }
${S} .ag-clip svg.ag-mark { width: 100%; height: 100%; display: block }
${S} .ag-mark rect { fill: var(--hue) }
${S} .ag-clip[data-state="playing"] { background: var(--hue); color: var(--panel) }
${S} .ag-clip[data-state="playing"] .ag-mark rect { fill: var(--panel); opacity: 0.85 }
${S} .ag-clip[data-state="playing"] .ag-mark rect.is-ahead { opacity: 0.35 }
${S} .ag-clip[data-state="queued"] { box-shadow: inset 0 0 0 2px var(--hue) }
${S} .ag-head { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--panel); transform-origin: left; transform: scaleX(0); display: none }
${S} .ag-clip[data-state="playing"] .ag-head { display: block }
${S} .ag-meter { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 8px }
${S} .ag-meter > span { font-size: 11px; color: var(--muted) }
${S} .ag-slot { position: relative; display: grid; gap: 2px }
${S} .ag-bar { position: relative; height: 6px; border-radius: 1px; background: var(--slot); overflow: hidden }
${S} .ag-bar i { position: absolute; inset: 0 auto 0 0; width: 0; background: var(--hue) }
${S} .ag-bar b { position: absolute; top: 0; bottom: 0; width: 2px; left: 0; background: var(--hue-text) }
${S} .ag-meter .ag-box { width: 74px; justify-content: flex-end }
${S}.is-tile .ag-meter .ag-box { display: none }
@container (min-width: 600px) { ${S} .ag-clip { height: 68px } }
@container (max-width: 400px) {
  ${S} .ag-body { padding: 8px; gap: 8px }
  ${S} .ag-pos { font-size: 18px }
  ${S} .ag-clip { height: 46px; padding: 3px 3px 3px }
  ${S} .ag-clip-head svg { display: none }
  ${S} .ag-meter { grid-template-columns: auto minmax(0, 1fr) }
  ${S} .ag-meter .ag-box { display: none }
}
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="ag">
  <div class="ag-dev">
    <div class="ag-strip"><b>Coder agent</b><span>Run 3, 6 steps</span><button class="ag-key" type="button" aria-pressed="true"><svg viewBox="0 0 8 8" aria-hidden="true"><path d="M1 0.5v7l6.5-3.5z"/></svg>Run</button></div>
    <div class="ag-body">
      <div class="ag-top"><span class="ag-pos" aria-hidden="true">0:00.0</span><span class="ag-box ag-line"></span></div>
      <div class="ag-clips" role="radiogroup" aria-label="Phase clips"></div>
      <div class="ag-meter" aria-hidden="true"><span>Tokens in, out</span><span class="ag-slot"><span class="ag-bar"><i></i><b></b></span><span class="ag-bar"><i></i><b></b></span></span><span class="ag-box ag-rate"></span></div>
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const $ = (s) => host.querySelector(s);
      const root = $(".ag"), runKey = $(".ag-key"), pos = $(".ag-pos"), lineEl = $(".ag-line"), clipsEl = $(".ag-clips"), rate = $(".ag-rate"), live = $("[aria-live]");
      const bars = [...host.querySelectorAll(".ag-bar")].map((b) => ({ fill: b.querySelector("i"), peak: b.querySelector("b") }));
      if (ctx.tile) runKey.tabIndex = -1;
      const hueVars = (el, hue) => { for (const [k, v] of [["--hue", ""], ["--hue-text", "-text"], ["--hue-tint", "-tint"]]) el.style.setProperty(k, "var(--clip-" + hue + v + ")"); };

      const clips = PHASES.map((p, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "ag-clip"; b.setAttribute("role", "radio"); b.setAttribute("aria-label", p.name);
        b.tabIndex = ctx.tile ? -1 : i === 0 ? 0 : -1;
        hueVars(b, p.hue);
        b.innerHTML = '<span class="ag-clip-head"><svg viewBox="0 0 8 8" aria-hidden="true"><path class="g" d="M1 1h6v6h-6z"/></svg><span></span></span>';
        b.querySelector(".ag-clip-head span").textContent = p.name;
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("class", "ag-mark"); svg.setAttribute("viewBox", "0 0 48 20"); svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("aria-hidden", "true");
        const rects = marks(p.key).map(([x, y, w, h]) => { const r = document.createElementNS(NS, "rect"); r.setAttribute("x", x.toFixed(2)); r.setAttribute("y", y.toFixed(2)); r.setAttribute("width", w.toFixed(2)); r.setAttribute("height", h.toFixed(2)); r.setAttribute("rx", "0.6"); svg.appendChild(r); return r; });
        b.appendChild(svg);
        const head = document.createElement("span"); head.className = "ag-head"; b.appendChild(head);
        rects.forEach((r, k) => (r.dataset.at = String((k + 0.5) / rects.length)));
        clipsEl.appendChild(b);
        return { b, rects, head, glyph: b.querySelector("path.g") };
      });

      /* Transport. */
      let playing = !ctx.reduced(), auto = !ctx.reduced(), t = 0, current = 0, queued = -1, launchedAt = 0;
      const shown = [-60, -60], peak = [-60, -60], held = [0, 0];
      let burst = 0, gap = 0, next = 0;
      const PLAY = "M1 0.5v7l6.5-3.5z", STOP = "M1 1h6v6h-6z";

      function paintClips(progress) {
        clips.forEach((c, i) => {
          const state = i === current ? "playing" : i === queued ? "queued" : "stopped";
          if (c.b.dataset.state !== state) {
            c.b.dataset.state = state;
            c.b.setAttribute("aria-checked", String(i === current));
            c.glyph.setAttribute("d", state === "playing" ? PLAY : STOP);
            if (state !== "playing") c.rects.forEach((r) => { r.classList.remove("is-ahead"); r.style.visibility = ""; });
          }
          if (state === "playing") {
            c.head.style.transform = "scaleX(" + progress.toFixed(4) + ")";
            // Its trace lights in reading order as it plays; the diff is written as it plays; each tool call latches.
            c.rects.forEach((r) => {
              const ahead = Number(r.dataset.at) > progress;
              r.classList.toggle("is-ahead", ahead);
              r.style.visibility = PHASES[i].key === "write" && ahead ? "hidden" : "";
            });
          }
        });
      }
      function launch(i, said) {
        current = i; queued = -1; launchedAt = t;
        hueVars(root, PHASES[i].hue);
        lineEl.textContent = PHASES[i].line;
        if (said) live.textContent = PHASES[i].name + " launched: " + PHASES[i].line;
        if (!ctx.tile) clips.forEach((c, j) => (c.b.tabIndex = j === i ? 0 : -1));
      }
      function paintPos() {
        const m = Math.floor(t / 60), sec = t - m * 60;
        pos.textContent = m + ":" + (sec < 10 ? "0" : "") + sec.toFixed(1);
      }
      function meters(dt) {
        if (burst > 0) {
          burst -= dt; next -= dt;
          if (next <= 0) { next = 0.04 + Math.random() * 0.07; const level = -17 + Math.random() * 13; for (let c = 0; c < 2; c++) shown[c] = Math.max(shown[c], level - c * Math.random() * 3); }
          if (burst <= 0) gap = 0.15 + Math.random() * 0.5;
        } else { gap -= dt; if (gap <= 0) burst = 0.5 + Math.random() * 1.1; }
        for (let c = 0; c < 2; c++) {
          shown[c] = Math.max(-60, shown[c] - 26 * dt);
          if (shown[c] >= peak[c]) { peak[c] = shown[c]; held[c] = 0; } else if ((held[c] += dt) > 0.9) peak[c] = Math.max(shown[c], peak[c] - 12 * dt);
          bars[c].fill.style.width = (toScale(shown[c]) * 100).toFixed(1) + "%";
          bars[c].peak.style.left = "calc(" + (toScale(peak[c]) * 100).toFixed(1) + "% - 2px)";
        }
        rate.textContent = Math.round(toScale(Math.max(shown[0], shown[1])) * 240) + " tok/s";
      }

      launch(0, false);
      // Warm the meters, so the first frame is already a level.
      for (let k = 0; k < 72; k++) meters(1 / 60);
      paintPos(); paintClips(0);

      // The clips come in column by column, a tick (60ms) apart.
      if (!ctx.reduced()) clips.forEach((c, i) => { c.b.classList.add("is-in"); ctx.after(60 * i + 16, () => c.b.classList.add("is-cut")); ctx.after(60 * i + 200, () => c.b.classList.remove("is-in", "is-cut")); });

      ctx.loop((dt) => {
        if (!playing) return;
        const before = Math.floor(t / BEAT);
        t += dt;
        const beat = Math.floor(t / BEAT);
        if (beat !== before) {
          if (queued >= 0) launch(queued, true);
          else if (auto && beat - Math.round(launchedAt / BEAT) >= CLIP_BEATS) launch((current + 1) % PHASES.length, false);
        }
        const into = ((t - launchedAt) / BEAT) % CLIP_BEATS / CLIP_BEATS;
        paintPos(); paintClips(Math.max(0, into)); meters(dt);
      });

      function setPlaying(on) {
        playing = on;
        runKey.setAttribute("aria-pressed", String(on));
        if (!on) { for (const b of bars) { b.fill.style.width = "0"; } rate.textContent = "0 tok/s"; }
        live.textContent = on ? "Running" : "Stopped";
      }
      ctx.onHand(() => { auto = false; });
      runKey.addEventListener("click", () => { auto = false; setPlaying(!playing); }, { signal: ctx.signal });
      clips.forEach((c, i) => {
        c.b.addEventListener("click", () => {
          auto = false;
          if (!playing) { setPlaying(true); launch(i, true); paintClips(0); return; }
          if (i === current) return;
          queued = i; paintClips(((t - launchedAt) / BEAT) % CLIP_BEATS / CLIP_BEATS);
          live.textContent = PHASES[i].name + " queued";
        }, { signal: ctx.signal });
        c.b.addEventListener("keydown", (e) => {
          const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: PHASES.length - 1 }[e.key];
          if (n === undefined) return;
          e.preventDefault();
          const k = (n + PHASES.length) % PHASES.length;
          clips.forEach((c, j) => (c.b.tabIndex = j === k ? 0 : -1));
          clips[k].b.focus(); clips[k].b.click();
        }, { signal: ctx.signal });
      });
      if (ctx.reduced()) { playing = false; runKey.setAttribute("aria-pressed", "false"); }
    },
  });
})();
