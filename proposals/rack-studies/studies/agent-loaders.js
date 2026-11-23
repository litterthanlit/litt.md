/* Agent Loaders, after litterthanlit/components, redesigned natively in Rack (round 2).
   The product underneath is how an agent console says work is happening. Not a card of glyphs: a device whose lanes are
   the agents of a run (Planner, Coder, Reviewer, each in its own colour), and whose working-state readouts are compact
   Rack controls in columns: a segmented step meter, a stepping square spinner in a 16px box beside the tool being
   called, a token-rate level, and a queue counter of square cells, each with its value in a mono box. Everything moves
   on one steady tick, and only while the run plays: the lit Run key stops it on the frame. */
(function () {
  const TICK = 120; // ms
  const LANES = [
    { name: "Planner", hue: "purple", steps: 4, tools: ["read_spec", "plan", "split_tasks", "plan"] },
    { name: "Coder", hue: "orange", steps: 7, tools: ["read_file", "edit_file", "run_tests", "edit_file", "run_tests", "lint", "commit"] },
    { name: "Reviewer", hue: "green", steps: 3, tools: ["diff", "comment", "approve"] },
  ];
  const STEP_TICKS = 8; // ticks a step takes

  FlatPlayer.register({
    slug: "agent-loaders",
    title: "Agent Loaders",
    tagline: "Working-state readouts for a run's agents, in one device.",
    css: `
.fs-agent-loaders .rk { width: min(100%, 540px); background: var(--body); border-radius: var(--r-panel); padding: 3px; font-family: var(--font); user-select: none; -webkit-user-select: none }
.fs-agent-loaders .rk-panel { background: var(--panel); border-radius: var(--r-panel); overflow: hidden }
.fs-agent-loaders .rk-strip { display: flex; align-items: center; gap: 6px; padding: 4px 4px 4px 8px; background: var(--panel-2); min-height: 30px }
.fs-agent-loaders .rk-name { font-size: 12px; font-weight: 600; color: var(--ink); white-space: nowrap }
.fs-agent-loaders .rk-word { font-size: 12px; color: var(--muted); white-space: nowrap; margin-right: auto }
.fs-agent-loaders .rk-box { height: 20px; display: flex; align-items: center; padding: 0 5px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 500 11px/1 var(--mono); font-variant-numeric: tabular-nums; color: var(--ink); white-space: nowrap; overflow: hidden; min-width: 0 }
.fs-agent-loaders .rk-box > span { overflow: hidden; text-overflow: ellipsis }
.fs-agent-loaders .rk-clock { height: 22px }
.fs-agent-loaders .rk-key { all: unset; box-sizing: border-box; display: grid; place-items: center; height: 22px; padding: 0 9px; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge);
  font: 500 11px/1 var(--font); color: var(--ink); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out) }
.fs-agent-loaders .rk-key:hover { background: var(--block-hover) }
.fs-agent-loaders .rk-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-agent-loaders .rk-key.is-lit { background: var(--accent); color: var(--accent-fg) }
.fs-agent-loaders .rk-key:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px }
.fs-agent-loaders .rk-grid { display: grid; grid-template-columns: 62px repeat(4, minmax(0, 1fr)); gap: 3px 6px; padding: 6px 8px 8px; margin: 0; list-style: none }
.fs-agent-loaders .rk-head { font-size: 11px; color: var(--muted); padding-bottom: 1px }
.fs-agent-loaders .rk-lane { display: contents }
.fs-agent-loaders .rk-agent { display: flex; align-items: center; padding: 0 6px; border-radius: var(--r-control); background: var(--c-tint); color: var(--c-text); font-size: 12px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 44px; transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
.fs-agent-loaders .rk-lane[data-state="waiting"] .rk-agent { background: var(--panel-3); color: var(--muted) }
.fs-agent-loaders .rk-cell { display: grid; align-content: center; gap: 4px; min-width: 0 }
.fs-agent-loaders .rk-ctl { height: 16px; display: flex; align-items: center; gap: 2px; min-width: 0 }
.fs-agent-loaders .rk-seg { flex: 1; max-width: 9px; height: 14px; border-radius: 1px; background: var(--slot) }
.fs-agent-loaders .rk-seg.is-done { background: var(--c) }
.fs-agent-loaders .rk-seg.is-now { background: var(--c); opacity: var(--blink, 1) }
.fs-agent-loaders .rk-spin { flex: none; width: 16px; height: 16px; padding: 2px; display: grid; grid-template-columns: 1fr 1fr; gap: 2px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge) }
.fs-agent-loaders .rk-spin i { border-radius: 1px; background: var(--slot) }
.fs-agent-loaders .rk-spin i.is-on { background: var(--c) }
.fs-agent-loaders .rk-level { flex: 1; height: 6px; border-radius: 1px; background: var(--slot); overflow: hidden }
.fs-agent-loaders .rk-level i { display: block; height: 100%; width: calc(var(--r, 0) * 100%); background: var(--c) }
.fs-agent-loaders .rk-q { width: 8px; height: 8px; border-radius: 1px; box-shadow: inset 0 0 0 1px var(--line-strong) }
.fs-agent-loaders .rk-q.is-on { background: var(--c); box-shadow: none }
.fs-agent-loaders .rk-done { color: var(--success); font-weight: 600 }
.fs-agent-loaders .rk-lane[data-state="waiting"] .rk-box { color: var(--muted) }
@container (max-width: 380px) {
  .fs-agent-loaders .rk-grid { grid-template-columns: 54px repeat(4, minmax(0, 1fr)); column-gap: 4px; padding: 6px 6px 6px }
  .fs-agent-loaders .rk-word { display: none } .fs-agent-loaders .rk-agent { padding: 0 4px; font-size: 11px }
  .fs-agent-loaders .rk-box { padding: 0 3px; font-size: 10px }
  .fs-agent-loaders .rk-q { width: 6px; height: 6px }
}
`,
    mount(host, ctx) {
      const S = ctx.signal, reduced = ctx.reduced();
      host.innerHTML = `
<div class="rk"><section class="rk-panel" aria-label="Run 12">
  <div class="rk-strip"><span class="rk-name">Run 12</span><span class="rk-word" aria-hidden="true"></span><span class="rk-box rk-clock" aria-hidden="true">0:00.0</span><button type="button" class="rk-key rk-run"></button></div>
  <ul class="rk-grid">
    <li class="rk-lane" aria-hidden="true"><span class="rk-head">Agent</span><span class="rk-head">Steps</span><span class="rk-head">Tool</span><span class="rk-head">Rate</span><span class="rk-head">Queue</span></li>
  </ul>
</section><p class="sr-only" aria-live="polite"></p></div>`;
      const grid = host.querySelector(".rk-grid"), word = host.querySelector(".rk-word"), clockEl = host.querySelector(".rk-clock"), run = host.querySelector(".rk-run"), live = host.querySelector("[aria-live]");
      const lanes = LANES.map((l) => {
        const li = document.createElement("li");
        li.className = "rk-lane";
        li.style.setProperty("--c", `var(--clip-${l.hue})`); li.style.setProperty("--c-tint", `var(--clip-${l.hue}-tint)`); li.style.setProperty("--c-text", `var(--clip-${l.hue}-text)`);
        li.innerHTML = `<span class="rk-agent">${l.name}</span>
<span class="rk-cell" aria-hidden="true"><span class="rk-ctl">${Array.from({ length: l.steps }, () => '<i class="rk-seg"></i>').join("")}</span><span class="rk-box"><span class="v-steps"></span></span></span>
<span class="rk-cell" aria-hidden="true"><span class="rk-ctl"><span class="rk-spin"><i></i><i></i><i></i><i></i></span></span><span class="rk-box"><span class="v-tool"></span></span></span>
<span class="rk-cell" aria-hidden="true"><span class="rk-ctl"><span class="rk-level"><i></i></span></span><span class="rk-box"><span class="v-rate"></span></span></span>
<span class="rk-cell" aria-hidden="true"><span class="rk-ctl">${'<i class="rk-q"></i>'.repeat(5)}</span><span class="rk-box"><span class="v-queue"></span></span></span>`;
        grid.appendChild(li);
        const q = (s) => li.querySelector(s);
        return { l, li, segs: [...li.querySelectorAll(".rk-seg")], quads: [...li.querySelectorAll(".rk-spin i")], level: q(".rk-level i"), qs: [...li.querySelectorAll(".rk-q")],
          steps: q(".v-steps"), tool: q(".v-tool"), rate: q(".v-rate"), queue: q(".v-queue"), state: "waiting", step: 0, rateV: 0 };
      });

      let running = !reduced, ghost = !reduced, active = 0, ticks = 0, clock = 0, last = performance.now();
      const fmt = (t) => Math.floor(t / 60) + ":" + (t % 60).toFixed(1).padStart(4, "0");

      function draw(L) {
        const { l } = L, st = L.state;
        L.li.dataset.state = st;
        L.segs.forEach((s, i) => { s.classList.toggle("is-done", st === "done" || (st === "working" && i < L.step)); s.classList.toggle("is-now", st === "working" && i === L.step); });
        const spin = st === "working" ? ticks % 4 : -1, order = [0, 1, 3, 2];
        L.quads.forEach((qd, i) => qd.classList.toggle("is-on", i === order[spin] || st === "done"));
        L.level.style.setProperty("--r", st === "working" ? L.rateV.toFixed(3) : "0");
        const queued = st === "working" ? Math.max(0, l.steps - L.step - 1) : st === "waiting" ? Math.min(5, l.steps) : 0;
        L.qs.forEach((qd, i) => qd.classList.toggle("is-on", i < Math.min(5, queued)));
        L.steps.textContent = (st === "done" ? l.steps : st === "working" ? L.step + 1 : 0) + " / " + l.steps;
        L.tool.className = "v-tool" + (st === "done" ? " rk-done" : "");
        L.tool.textContent = st === "done" ? "Done" : st === "working" ? l.tools[L.step] : "Waiting";
        L.rate.textContent = (st === "working" ? Math.round(L.rateV * 90) : 0) + " tok/s";
        L.queue.textContent = queued + " queued";
        L.li.setAttribute("aria-label", l.name + ": " + (st === "working" ? `step ${L.step + 1} of ${l.steps}, ${l.tools[L.step]}` : st));
      }
      function renderRun() {
        run.classList.toggle("is-lit", running);
        run.textContent = running ? "Running" : "Run";
        run.setAttribute("aria-pressed", String(running));
        const w = lanes.find((L) => L.state === "working");
        word.textContent = !running ? (lanes.every((L) => L.state === "done") ? "Done" : "Paused") : w ? w.l.name + " working" : "Starting";
      }
      function reset() {
        lanes.forEach((L) => { L.state = "waiting"; L.step = 0; L.rateV = 0; });
        active = 0; ticks = 0; clock = 0;
        lanes[0].state = "working";
        lanes.forEach(draw); clockEl.textContent = fmt(0);
      }
      function stepOn() {
        const L = lanes[active];
        if (L.step < L.l.steps - 1) { L.step++; live.textContent = `${L.l.name}: ${L.l.tools[L.step]}`; return; }
        L.state = "done"; draw(L);
        if (active < lanes.length - 1) { active++; lanes[active].state = "working"; live.textContent = `${L.l.name} done. ${lanes[active].l.name} working`; return; }
        live.textContent = "Run 12 done";
        if (ghost) { ctx.after(1400, () => { if (ghost && running) { reset(); renderRun(); } }); }
        else { running = false; }
      }

      /* One steady tick drives every readout; nothing moves while the run is stopped. */
      ctx.every(TICK, () => {
        const now = performance.now(), dt = (now - last) / 1000; last = now;
        if (!running) return;
        const L = lanes[active];
        if (L.state !== "working") return;
        clock += dt; ticks++;
        clockEl.textContent = fmt(clock);
        L.rateV = Math.max(0.12, Math.min(1, 0.55 + 0.35 * Math.sin(ticks * 0.7 + active) + (Math.random() - 0.5) * 0.25));
        if (ticks % STEP_TICKS === 0) stepOn();
        lanes.forEach((x) => x.segs.forEach((s) => s.style.setProperty("--blink", ticks % 4 < 2 ? "1" : "0.35")));
        lanes.forEach(draw); renderRun();
      });

      run.addEventListener("click", () => {
        if (!running && lanes.every((x) => x.state === "done")) reset();
        running = !running; last = performance.now(); renderRun();
        live.textContent = running ? "Run 12 running" : "Run 12 paused";
      }, { signal: S });
      ctx.onHand(() => { ghost = false; });

      reset();
      if (reduced) { lanes[0].state = "done"; lanes[1].state = "working"; lanes[1].step = 2; lanes[1].rateV = 0.6; lanes.forEach(draw); }
      renderRun();
    },
  });
})();
