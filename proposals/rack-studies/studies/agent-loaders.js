/* Agent Loaders, after litterthanlit/components, redesigned in Rack 2.0.
   The product underneath is how an agent console says work is happening. One surface holds the run's three agents
   (Planner purple, Coder orange, Reviewer green), each one object in its colour. The working one carries the loaders:
   a stepping square spinner beside the tool it is calling, and its steps as a row of segments that fill one by one.
   The others say Waiting or Done. One steady tick drives it all, only while the lit Run key is on. */
(function () {
  const TICK = 120, STEP_TICKS = 8;
  const AGENTS = [
    { name: "Planner", hue: "purple", tools: ["read_spec", "plan", "split_tasks", "plan"] },
    { name: "Coder", hue: "orange", tools: ["read_file", "edit_file", "run_tests", "edit_file", "run_tests", "lint", "commit"] },
    { name: "Reviewer", hue: "green", tools: ["diff", "comment", "approve"] },
  ];
  const ORDER = [0, 1, 3, 2]; // the spinner's square goes round clockwise

  FlatPlayer.register({
    slug: "agent-loaders",
    title: "Agent Loaders",
    tagline: "How a run's agents say they are working.",
    css: `
.fs-agent-loaders .rk { width: min(100%, 460px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-family: var(--font); user-select: none; -webkit-user-select: none }
.fs-agent-loaders .rk-strip { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 6px 0 12px; background: var(--panel-2) }
.fs-agent-loaders .rk-strip b { font-size: 12px; font-weight: 600; margin-right: auto }
.fs-agent-loaders .rk-box { height: 22px; display: inline-flex; align-items: center; padding: 0 6px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge); font: 600 11px/1 var(--mono); font-variant-numeric: tabular-nums }
.fs-agent-loaders .rk-key { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge);
  font: 500 11px/1 var(--font); color: var(--ink); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out) }
.fs-agent-loaders .rk-key:hover { background: var(--block-hover) }
.fs-agent-loaders .rk-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-agent-loaders .rk-key.is-lit { background: var(--accent); color: var(--accent-fg) }
.fs-agent-loaders .rk-key:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px }
.fs-agent-loaders .rk-key svg { width: 9px; height: 9px; fill: currentColor }
.fs-agent-loaders .rk-wrap { padding: 12px }
.fs-agent-loaders .rk-surface { display: grid; gap: 8px; margin: 0; padding: 10px; list-style: none; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge) }
.fs-agent-loaders .rk-a { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 9px 8px; padding: 8px 9px 9px; border-radius: var(--r-control);
  background: var(--c-tint); box-shadow: inset 0 0 0 1px var(--c); color: var(--c-text); transition: box-shadow var(--cut-in) var(--ease-out) }
.fs-agent-loaders .rk-a[data-state="working"] { box-shadow: inset 0 0 0 2px var(--c) }
.fs-agent-loaders .rk-a > b { font-size: 11px; font-weight: 600; line-height: 1 }
.fs-agent-loaders .rk-state { display: inline-flex; align-items: center; gap: 6px; font: 600 11px/1 var(--mono); white-space: nowrap; min-width: 0 }
.fs-agent-loaders .rk-spin { width: 12px; height: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 1px }
.fs-agent-loaders .rk-spin i { border-radius: 1px; box-shadow: inset 0 0 0 1px var(--c) }
.fs-agent-loaders .rk-spin i.is-on { background: var(--c) }
.fs-agent-loaders .rk-a:not([data-state="working"]) .rk-spin { display: none }
.fs-agent-loaders .rk-steps { grid-column: 1 / -1; display: flex; gap: 3px }
.fs-agent-loaders .rk-steps i { flex: 1; height: 6px; border-radius: 1px; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--c), transparent 45%) }
.fs-agent-loaders .rk-steps i.is-done { background: var(--c); box-shadow: none }
.fs-agent-loaders .rk-steps i.is-now { background: var(--c); box-shadow: none; opacity: var(--blink, 1) }
.fs-agent-loaders.is-tile .rk-wrap { padding: 8px } .fs-agent-loaders.is-tile .rk-surface { padding: 8px; gap: 6px } .fs-agent-loaders.is-tile .rk-a { padding: 6px 8px 7px; gap: 7px 8px }
`,
    mount(host, ctx) {
      const S = ctx.signal, reduced = ctx.reduced();
      host.innerHTML = `
<div class="rk">
  <div class="rk-strip"><b>Run 12</b><span class="rk-box rk-clock" aria-hidden="true">0:00.0</span><button type="button" class="rk-key rk-run"></button></div>
  <div class="rk-wrap"><ul class="rk-surface" aria-label="Agents"></ul></div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const surface = host.querySelector(".rk-surface"), clockEl = host.querySelector(".rk-clock"), run = host.querySelector(".rk-run"), live = host.querySelector("[aria-live]");
      const lanes = AGENTS.map((a) => {
        const li = document.createElement("li");
        li.className = "rk-a";
        li.style.setProperty("--c", `var(--clip-${a.hue})`); li.style.setProperty("--c-tint", `var(--clip-${a.hue}-tint)`); li.style.setProperty("--c-text", `var(--clip-${a.hue}-text)`);
        li.innerHTML = `<b>${a.name}</b><span class="rk-state" aria-hidden="true"><span class="rk-spin"><i></i><i></i><i></i><i></i></span><span class="rk-tool"></span></span>
<span class="rk-steps" aria-hidden="true">${'<i></i>'.repeat(a.tools.length)}</span>`;
        surface.appendChild(li);
        return { a, li, quads: [...li.querySelectorAll(".rk-spin i")], segs: [...li.querySelectorAll(".rk-steps i")], tool: li.querySelector(".rk-tool"), state: "waiting", step: 0 };
      });
      let running = !reduced, ghost = !reduced, active = 0, ticks = 0, clock = 0, last = performance.now();
      const fmt = (t) => Math.floor(t / 60) + ":" + (t % 60).toFixed(1).padStart(4, "0");

      function draw(L) {
        const st = L.state, n = L.a.tools.length;
        L.li.dataset.state = st;
        L.segs.forEach((s, i) => { s.classList.toggle("is-done", st === "done" || (st === "working" && i < L.step)); s.classList.toggle("is-now", st === "working" && i === L.step); s.style.setProperty("--blink", ticks % 4 < 2 ? "1" : "0.35"); });
        L.quads.forEach((q, i) => q.classList.toggle("is-on", st === "working" && i === ORDER[ticks % 4]));
        L.tool.textContent = st === "working" ? L.a.tools[L.step] : st === "done" ? "Done" : "Waiting";
        L.li.setAttribute("aria-label", L.a.name + ": " + (st === "working" ? `step ${L.step + 1} of ${n}, ${L.a.tools[L.step]}` : st));
      }
      function renderRun() {
        run.classList.toggle("is-lit", running);
        run.innerHTML = running ? '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1.5" width="7" height="7"/></svg>Running' : '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1v8l7-4z"/></svg>Run';
        run.setAttribute("aria-pressed", String(running));
        run.setAttribute("aria-label", "Run 12");
      }
      function reset() {
        lanes.forEach((L) => { L.state = "waiting"; L.step = 0; });
        active = 0; ticks = 0; clock = 0; lanes[0].state = "working";
        lanes.forEach(draw); clockEl.textContent = fmt(0);
      }
      function stepOn() {
        const L = lanes[active];
        if (L.step < L.a.tools.length - 1) { L.step++; live.textContent = `${L.a.name}: ${L.a.tools[L.step]}`; return; }
        L.state = "done";
        if (active < lanes.length - 1) { active++; lanes[active].state = "working"; live.textContent = `${L.a.name} done. ${lanes[active].a.name} working`; return; }
        live.textContent = "Run 12 done";
        if (ghost) ctx.after(1400, () => { if (ghost && running) reset(); });
        else { running = false; renderRun(); }
      }
      ctx.every(TICK, () => {
        const now = performance.now(), dt = (now - last) / 1000; last = now;
        if (!running || lanes[active].state !== "working") return;
        clock += dt; ticks++;
        clockEl.textContent = fmt(clock);
        if (ticks % STEP_TICKS === 0) stepOn();
        lanes.forEach(draw);
      });
      run.addEventListener("click", () => {
        if (!running && lanes.every((L) => L.state === "done")) reset();
        running = !running; last = performance.now(); renderRun();
        live.textContent = running ? "Run 12 running" : "Run 12 paused";
      }, { signal: S });
      ctx.onHand(() => { ghost = false; });

      reset();
      if (reduced) { lanes[0].state = "done"; lanes[1].state = "working"; lanes[1].step = 2; lanes.forEach(draw); }
      renderRun();
    },
  });
})();
