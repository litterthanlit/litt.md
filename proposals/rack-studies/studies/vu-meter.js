/* VU Meter, in Rack: level meters for an agent team, no needles. Each agent (Planner purple, Researcher blue, Coder
   orange, Reviewer green) streams tokens, and its bar shows tokens a second in its own colour: it rises on the frame and
   falls at a steady rate, like a meter, with a peak line that holds 900 ms and then falls. The part over the rate limit is
   red; the limit is a value box you drag. Each agent's peak sits in a box you click to clear, and the run's cost counts
   up in another. A ghost runs the team until a hand arrives; Run starts it again. Time moves the bars; nothing else moves. */
(function () {
  const MAX = 200, FALL = 260, PEAK_FALL = 80, HOLD = 900;
  const AGENTS = [
    { name: "Planner", hue: "purple", rate: 60, burst: 0.25 },
    { name: "Researcher", hue: "blue", rate: 110, burst: 0.5 },
    { name: "Coder", hue: "orange", rate: 120, burst: 0.6 },
    { name: "Reviewer", hue: "green", rate: 80, burst: 0.35 },
  ];
  const pos = (r) => Math.min(1, Math.max(0, r / MAX));
  let n = 0;

  FlatPlayer.register({
    slug: "vu-meter",
    title: "VU Meter",
    tagline: "Token-rate meters with peak hold.",
    css: `
.fs-vu-meter .mx { width: min(340px, 100%); font: 400 12px/1.35 var(--font); background: var(--body); padding: 3px; border-radius: 8px; display: grid; gap: 3px;
  -webkit-user-select: none; user-select: none }
.fs-vu-meter .mx-bar { display: flex; align-items: center; gap: 4px; height: 30px; padding: 0 4px; background: var(--panel); border-radius: var(--r-panel) }
.fs-vu-meter .mx-key { height: 22px; padding: 0 8px; border: 0; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge); color: var(--ink);
  font: 500 12px var(--font); cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
.fs-vu-meter .mx-key:hover { background: var(--block-hover) }
.fs-vu-meter .mx-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-vu-meter .mx-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
.fs-vu-meter .mx-key svg { width: 9px; height: 9px; fill: currentColor }
.fs-vu-meter .mx-clock { font: 600 18px/1 var(--mono); letter-spacing: -0.02em; margin: 0 auto 0 4px }
.fs-vu-meter .mx-box { height: 20px; padding: 0 6px; display: inline-grid; place-items: center; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px var(--mono); white-space: nowrap; color: var(--ink); border: 0 }
.fs-vu-meter .mx-limit { cursor: ns-resize; touch-action: none }
.fs-vu-meter .mx-strips { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) 26px; gap: 3px }
.fs-vu-meter .mx-strip { background: var(--panel); border-radius: var(--r-panel); padding: 4px; display: grid; gap: 4px; justify-items: center; min-width: 0 }
.fs-vu-meter .mx-name { width: 100%; height: 20px; display: grid; place-items: center; padding: 0 3px; border-radius: var(--r-control); background: var(--tint); color: var(--txt);
  font-weight: 600; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-vu-meter .mx-ch { position: relative; width: 14px; height: 128px; border-radius: 1px; background: var(--slot); overflow: hidden }
.fs-vu-meter .mx-fill { position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--l, 0) * 100%); background: var(--hue) }
.fs-vu-meter .mx-over { position: absolute; left: 0; right: 0; bottom: calc(var(--lim) * 100%); height: calc(max(0, var(--l, 0) - var(--lim)) * 100%); background: var(--danger) }
.fs-vu-meter .mx-peak { position: absolute; left: 0; right: 0; height: 2px; bottom: calc(var(--k, 0) * 100% - 1px); background: var(--ink); opacity: var(--ko, 0) }
.fs-vu-meter .mx-lim { position: absolute; left: 0; right: 0; height: 1px; bottom: calc(var(--lim) * 100%); background: var(--danger) }
.fs-vu-meter .mx-box.is-over { background: var(--danger); color: var(--panel) }
.fs-vu-meter .mx-scale { position: relative; height: 128px; margin-top: 28px; font: 500 9.5px var(--mono); color: var(--muted) }
.fs-vu-meter .mx-scale span { position: absolute; left: 0; transform: translateY(50%) }
.fs-vu-meter.is-tile .mx-ch, .fs-vu-meter.is-tile .mx-scale { height: 112px }
@container (min-width: 520px) { .fs-vu-meter .mx { width: 460px } .fs-vu-meter .mx-ch, .fs-vu-meter .mx-scale { height: 180px } .fs-vu-meter .mx-ch { width: 18px } }
`,
    mount(host, ctx) {
      const id = "mx" + ++n;
      const strips = AGENTS.map((a, i) => '<div class="mx-strip" style="--hue: var(--clip-' + a.hue + "); --tint: var(--clip-" + a.hue + "-tint); --txt: var(--clip-" + a.hue + '-text)">' +
        '<span class="mx-name">' + a.name + '</span><span class="mx-ch" aria-hidden="true"><span class="mx-fill"></span><span class="mx-over"></span><span class="mx-lim"></span><span class="mx-peak"></span></span>' +
        '<button class="mx-box" type="button" data-i="' + i + '" aria-label="' + a.name + ' peak, click to clear">0</button></div>').join("");
      const scale = [200, 150, 100, 50, 0].map((r) => '<span style="bottom:' + pos(r) * 100 + '%">' + r + "</span>").join("");
      host.innerHTML = `
<div class="mx">
  <div class="mx-bar">
    <button class="mx-key" type="button" data-k="run" aria-pressed="false"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 0.5 9.5 5l-8 4.5z"/></svg><span>Run</span></button>
    <span class="mx-clock" aria-hidden="true">0:00.0</span>
    <span class="mx-box mx-cost" aria-hidden="true">$0.000</span>
    <span class="mx-box mx-limit" role="slider" tabindex="0" aria-label="Rate limit, tokens per second" aria-describedby="${id}-hint" aria-orientation="vertical" aria-valuemin="40" aria-valuemax="200"></span>
  </div>
  <div class="mx-strips">${strips}<div class="mx-scale" aria-hidden="true">${scale}</div></div>
  <p id="${id}-hint" class="sr-only">Drag up or down, or use the arrow keys, to set the limit. Double-click for 160.</p>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const sig = { signal: ctx.signal };
      const root = host.querySelector(".mx"), chans = [...host.querySelectorAll(".mx-ch")], boxes = [...host.querySelectorAll(".mx-strip > .mx-box")];
      const run = host.querySelector('[data-k="run"]'), clockEl = host.querySelector(".mx-clock"), costEl = host.querySelector(".mx-cost"), limitEl = host.querySelector(".mx-limit");
      const live = host.querySelector("[aria-live]");
      let limit = 160, running = false, t = 0, cost = 0;

      function drawLimit() {
        root.style.setProperty("--lim", pos(limit).toFixed(4));
        limitEl.textContent = "Limit " + limit + " tok/s";
        limitEl.setAttribute("aria-valuenow", String(limit)); limitEl.setAttribute("aria-valuetext", limit + " tokens per second");
      }
      drawLimit();

      /* Each agent streams in bursts: a stretch of tokens, a pause for a tool call, another stretch. */
      const st = AGENTS.map(() => ({ until: 0, on: false, amp: 0 }));
      function rate(i) {
        const a = AGENTS[i], s = st[i];
        if (t >= s.until) {
          s.on = !s.on || Math.random() < 0.2;
          s.until = t + (s.on ? 0.5 + Math.random() * 1.6 : 0.3 + Math.random() * 0.9);
          s.amp = a.rate * (0.7 + Math.random() * 0.5) * (Math.random() < a.burst * 0.3 ? 1.3 : 1);
        }
        return s.on ? s.amp * (0.85 + Math.random() * 0.3) : Math.random() * 6;
      }

      const shown = AGENTS.map(() => 0), peak = AGENTS.map(() => 0), peakAt = AGENTS.map(() => 0), held = AGENTS.map(() => 0);
      let lastText = 0;
      ctx.loop((dt, now) => {
        if (running) t += dt;
        for (let i = 0; i < AGENTS.length; i++) {
          const r = running ? rate(i) : 0;
          if (running) cost += (r * dt * 3) / 1e6;
          /* A meter: up on the frame, down at a steady rate. */
          shown[i] = r > shown[i] ? r : Math.max(r, shown[i] - FALL * dt);
          if (shown[i] >= peak[i]) { peak[i] = shown[i]; peakAt[i] = now; } else if (now - peakAt[i] > HOLD) peak[i] = Math.max(shown[i], peak[i] - PEAK_FALL * dt);
          if (shown[i] > held[i]) held[i] = shown[i];
          chans[i].style.setProperty("--l", pos(shown[i]).toFixed(4));
          chans[i].style.setProperty("--k", pos(peak[i]).toFixed(4));
          chans[i].style.setProperty("--ko", peak[i] > 2 ? "1" : "0");
        }
        if (now - lastText > 100) {
          lastText = now;
          boxes.forEach((b, i) => { b.textContent = Math.round(held[i]); b.classList.toggle("is-over", held[i] > limit); });
          clockEl.textContent = Math.floor(t / 60) + ":" + (t % 60).toFixed(1).padStart(4, "0");
          costEl.textContent = "$" + cost.toFixed(3);
        }
      });

      function setRun(on) {
        running = on; run.setAttribute("aria-pressed", String(on)); run.querySelector("span").textContent = on ? "Stop" : "Run";
        run.querySelector("svg").innerHTML = on ? '<path d="M1 1h8v8H1z"/>' : '<path d="M1.5 0.5 9.5 5l-8 4.5z"/>';
      }
      run.addEventListener("click", () => { setRun(!running); live.textContent = running ? "Team running" : "Team stopped"; }, sig);
      boxes.forEach((b, i) => b.addEventListener("click", () => { held[i] = 0; b.textContent = "0"; b.classList.remove("is-over"); }, sig));
      const setLimit = (v) => { limit = Math.min(200, Math.max(40, Math.round(v / 5) * 5)); drawLimit(); };
      limitEl.addEventListener("keydown", (e) => {
        const d = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5, PageUp: 20, PageDown: -20 }[e.key];
        if (d) setLimit(limit + d); else if (e.key === "Home") setLimit(40); else if (e.key === "End") setLimit(200); else return;
        e.preventDefault();
      }, sig);
      let drag = null;
      limitEl.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; limitEl.setPointerCapture(e.pointerId); drag = { id: e.pointerId, y: e.clientY, from: limit }; }, sig);
      limitEl.addEventListener("pointermove", (e) => { if (drag && drag.id === e.pointerId) setLimit(drag.from + (drag.y - e.clientY) * (e.shiftKey ? 0.5 : 2)); }, sig);
      const end = (e) => { if (drag && drag.id === e.pointerId) drag = null; };
      limitEl.addEventListener("pointerup", end, sig); limitEl.addEventListener("pointercancel", end, sig);
      limitEl.addEventListener("dblclick", () => setLimit(160), sig);

      /* The ghost's run ends with the first hand, unless that hand pressed Run itself. */
      let handPending = false, touched = false;
      ctx.onHand(() => { handPending = true; touched = true; });
      const settle = (e) => { if (!handPending) return; handPending = false; if (!(e && run.contains(e.target))) setRun(false); };
      host.addEventListener("pointerdown", settle, { signal: ctx.signal, capture: true });
      host.addEventListener("keydown", settle, { signal: ctx.signal, capture: true });
      host.addEventListener("wheel", () => settle(null), { signal: ctx.signal, capture: true, passive: true });
      if (!ctx.reduced()) ctx.after(300, () => { if (!touched) setRun(true); });
    },
  });
})();
