/* Agent Indicators, after litterthanlit/components, Rack 2.0: what a run is doing, as one lane of four agents.
   Each agent is a clip in its colour (Planner purple, Researcher blue, Coder orange, Reviewer green): a soft tint,
   a 1px edge in its hue, its name in the hue's text tone, and under it what it is doing. The run hands from one to
   the next on a steady 0.5s tick, four ticks each; the working clip carries a progress bar in its hue, the only
   thing time moves. A hand launches an agent itself, on the next tick (it shows queued until then), and it keeps
   working; Run stops time. Nothing travels: a hand-off is a cut on the frame. */
(function () {
  const S = ".fs-agent-indicators";
  const TICK = 0.5, TICKS = 4;
  const AGENTS = [
    { name: "Planner", hue: "purple", doing: "Thinking it through" },
    { name: "Researcher", hue: "blue", doing: "Searching 12 sources" },
    { name: "Coder", hue: "orange", doing: "Writing the patch" },
    { name: "Reviewer", hue: "green", doing: "Checking 8 tests" },
  ];

  FlatPlayer.register({
    slug: "agent-indicators",
    title: "Agent Indicators",
    tagline: "What a run is doing: four agents on one lane, the working one filling.",
    css: `
${S} .ai { width: min(100%, 620px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px }
${S} .ai-strip { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 12px; background: var(--panel-2) }
${S} .ai-strip b { font-weight: 600; margin-right: auto }
${S} .ai-box, ${S} .ai-key { height: 22px; padding: 0 8px; border: 0; border-radius: var(--r-control); box-shadow: var(--edge); font: 600 11px/22px var(--mono) }
${S} .ai-box { background: var(--cut); min-width: 58px; text-align: right }
${S} .ai-key { background: var(--block); font-family: var(--font); cursor: pointer }
${S} .ai-key:hover { background: var(--block-hover) }
${S} .ai-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
${S} .ai-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
${S} .ai-lane { margin: 14px; padding: 8px; background: var(--panel-2); border-radius: var(--r-control); display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px }
${S} .ai-clip { position: relative; display: grid; align-content: start; gap: 6px; min-width: 0; height: 96px; padding: 7px 8px 12px; border: 0; border-radius: var(--r-control);
  background: var(--tint); box-shadow: inset 0 0 0 1px var(--hue); color: var(--ink); text-align: left; cursor: pointer; overflow: hidden }
${S} .ai-clip.is-in { opacity: 0 }
${S} .ai-clip.is-cut { opacity: 1; transition: opacity var(--cut-in) var(--ease-out) }
${S} .ai-name { color: var(--text); font-weight: 600; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
${S} .ai-doing { font-size: 11px; line-height: 1.35; color: var(--muted) }
${S} .ai-clip[data-state="working"] { box-shadow: inset 0 0 0 2px var(--hue) }
${S} .ai-clip[data-state="working"] .ai-doing { color: var(--ink) }
${S} .ai-clip[data-state="queued"] { box-shadow: inset 0 0 0 1px var(--hue), inset 0 0 0 3px var(--tint), inset 0 0 0 4px var(--hue) }
${S} .ai-track { position: absolute; left: 8px; right: 8px; bottom: 7px; height: 3px; background: color-mix(in oklab, var(--hue) 25%, transparent); visibility: hidden }
${S} .ai-bar { position: absolute; inset: 0; background: var(--hue); transform-origin: left; transform: scaleX(0) }
${S} .ai-clip[data-state="working"] .ai-track { visibility: visible }
${S} .ai-clip[data-state="stopped"] .ai-doing { visibility: hidden }
@container (max-width: 420px) { ${S} .ai-lane { margin: 10px; padding: 6px; gap: 4px } ${S} .ai-clip { height: 88px; padding: 6px 5px 12px } ${S} .ai-name { font-size: 10px } ${S} .ai-track { left: 5px; right: 5px } }
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="ai">
  <div class="ai-strip"><b>Run 3</b><span class="ai-box" aria-hidden="true">0:00.0</span><button class="ai-key" type="button" aria-pressed="true">Run</button></div>
  <div class="ai-lane" role="radiogroup" aria-label="Agents"></div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const clock = host.querySelector(".ai-box"), key = host.querySelector(".ai-key"), lane = host.querySelector(".ai-lane"), live = host.querySelector("[aria-live]");
      if (ctx.tile) key.tabIndex = -1;
      const clips = AGENTS.map((a, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "ai-clip"; b.setAttribute("role", "radio"); b.setAttribute("aria-label", a.name + ", " + a.doing);
        for (const [k, v] of [["--hue", ""], ["--tint", "-tint"], ["--text", "-text"]]) b.style.setProperty(k, "var(--clip-" + a.hue + v + ")");
        b.innerHTML = '<span class="ai-name"></span><span class="ai-doing"></span><span class="ai-track"><span class="ai-bar"></span></span>';
        b.querySelector(".ai-name").textContent = a.name;
        b.querySelector(".ai-doing").textContent = a.doing;
        b.tabIndex = ctx.tile ? -1 : i === 0 ? 0 : -1;
        lane.appendChild(b);
        return { b, bar: b.querySelector(".ai-bar") };
      });

      let playing = !ctx.reduced(), auto = playing, t = 0, current = 0, queued = -1, since = 0;
      function paint() {
        const p = Math.min(1, ((t - since) / TICK % TICKS) / TICKS);
        clips.forEach((c, i) => {
          const state = i === current ? "working" : i === queued ? "queued" : "stopped";
          if (c.b.dataset.state !== state) { c.b.dataset.state = state; c.b.setAttribute("aria-checked", String(i === current)); }
        });
        clips[current].bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
        const m = Math.floor(t / 60), s = t - m * 60;
        clock.textContent = m + ":" + (s < 10 ? "0" : "") + s.toFixed(1);
      }
      function launch(i, said) {
        current = i; queued = -1; since = t;
        if (!ctx.tile) clips.forEach((c, j) => (c.b.tabIndex = j === i ? 0 : -1));
        if (said) live.textContent = AGENTS[i].name + ": " + AGENTS[i].doing;
      }
      paint();
      // The lane comes in a column at a time, a tick (60ms) apart.
      if (!ctx.reduced()) clips.forEach((c, i) => { c.b.classList.add("is-in"); ctx.after(60 * i + 16, () => c.b.classList.add("is-cut")); ctx.after(60 * i + 200, () => c.b.classList.remove("is-in", "is-cut")); });
      if (!playing) key.setAttribute("aria-pressed", "false");

      ctx.loop((dt) => {
        if (!playing) return;
        const before = Math.floor(t / TICK);
        t += dt;
        const tick = Math.floor(t / TICK);
        if (tick !== before) {
          if (queued >= 0) launch(queued, true);
          else if (auto && tick - Math.round(since / TICK) >= TICKS) launch((current + 1) % AGENTS.length, false);
        }
        paint();
      });

      const setPlaying = (on) => { playing = on; key.setAttribute("aria-pressed", String(on)); live.textContent = on ? "Running" : "Stopped"; };
      ctx.onHand(() => { auto = false; });
      key.addEventListener("click", () => { auto = false; setPlaying(!playing); }, { signal: ctx.signal });
      clips.forEach((c, i) => {
        c.b.addEventListener("click", () => {
          auto = false;
          if (!playing) { setPlaying(true); launch(i, true); paint(); return; }
          if (i === current) return;
          queued = i; paint();
          live.textContent = AGENTS[i].name + " queued";
        }, { signal: ctx.signal });
        c.b.addEventListener("keydown", (e) => {
          const n = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: AGENTS.length - 1 }[e.key];
          if (n === undefined) return;
          e.preventDefault();
          const k = (n + AGENTS.length) % AGENTS.length;
          clips.forEach((x, j) => (x.b.tabIndex = j === k ? 0 : -1));
          clips[k].b.focus(); clips[k].b.click();
        }, { signal: ctx.signal });
      });
    },
  });
})();
