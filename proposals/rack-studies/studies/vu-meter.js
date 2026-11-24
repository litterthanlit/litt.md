/* VU Meter, Rack 2.0: level meters for an agent team. One surface holds the four agents (Planner purple, Researcher blue,
   Coder orange, Reviewer green), each an object with its tokens a second in figures and its level as a bar of its own
   colour that rises on the frame and falls at a steady rate, with a peak mark that holds 900 ms and then falls. The rate
   limit is one red line across them all, a value you drag in the strip; an agent over it reads red. A ghost runs the team
   until a hand arrives; Run starts it again. Time moves the bars; nothing else moves. */
(function () {
  const MAX = 200, FALL = 260, PEAK_FALL = 80, HOLD = 900;
  const AGENTS = [
    { name: "Planner", hue: "purple", rate: 60 },
    { name: "Researcher", hue: "blue", rate: 110 },
    { name: "Coder", hue: "orange", rate: 120 },
    { name: "Reviewer", hue: "green", rate: 80 },
  ];
  const pos = (r) => Math.min(1, Math.max(0, r / MAX));
  let n = 0;

  FlatPlayer.register({
    slug: "vu-meter",
    title: "VU Meter",
    tagline: "Token-rate meters with peak hold.",
    css: `
.fs-vu-meter .tm { width: min(100%, 480px); font-size: 12px; background: var(--panel); border-radius: var(--r-panel); overflow: hidden; -webkit-user-select: none; user-select: none }
.fs-vu-meter .tm-strip { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 10px; background: var(--panel-2); white-space: nowrap }
.fs-vu-meter .tm-strip b { font-weight: 600; margin-right: auto }
.fs-vu-meter .tm-box { height: 22px; padding: 0 8px; display: inline-grid; place-items: center; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px var(--mono); cursor: ns-resize; touch-action: none }
.fs-vu-meter .tm-box:active { box-shadow: var(--edge-press) }
.fs-vu-meter .tm-key { height: 22px; min-width: 52px; padding: 0 8px; border: 0; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge); color: var(--ink);
  font: 600 11px var(--font); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
.fs-vu-meter .tm-key:hover { background: var(--block-hover) }
.fs-vu-meter .tm-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-vu-meter .tm-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
.fs-vu-meter .tm-wrap { padding: 12px }
.fs-vu-meter .tm-surface { position: relative; display: grid; gap: 6px; padding: 10px; background: var(--cut); border-radius: var(--r-control); box-shadow: var(--edge) }
.fs-vu-meter .tm-a { position: relative; height: 38px; padding: 5px 7px; border-radius: var(--r-control); display: flex; justify-content: space-between; font-weight: 600; font-size: 11px; overflow: hidden }
.fs-vu-meter .tm-a[data-tone="purple"] { --hue: var(--clip-purple); background: var(--clip-purple-tint); box-shadow: inset 0 0 0 1px var(--clip-purple); color: var(--clip-purple-text) }
.fs-vu-meter .tm-a[data-tone="blue"] { --hue: var(--clip-blue); background: var(--clip-blue-tint); box-shadow: inset 0 0 0 1px var(--clip-blue); color: var(--clip-blue-text) }
.fs-vu-meter .tm-a[data-tone="orange"] { --hue: var(--clip-orange); background: var(--clip-orange-tint); box-shadow: inset 0 0 0 1px var(--clip-orange); color: var(--clip-orange-text) }
.fs-vu-meter .tm-a[data-tone="green"] { --hue: var(--clip-green); background: var(--clip-green-tint); box-shadow: inset 0 0 0 1px var(--clip-green); color: var(--clip-green-text) }
.fs-vu-meter .tm-a i { font: 600 11px var(--mono); font-style: normal }
.fs-vu-meter .tm-a.is-over i { color: var(--danger) }
.fs-vu-meter .tm-lv { position: absolute; left: 1px; bottom: 1px; height: 7px; width: calc(var(--l, 0) * (100% - 2px)); background: var(--hue) }
.fs-vu-meter .tm-pk { position: absolute; bottom: 1px; height: 11px; width: 2px; margin-left: -1px; left: calc(1px + var(--k, 0) * (100% - 2px)); background: var(--ink); opacity: var(--ko, 0) }
.fs-vu-meter .tm-lim { position: absolute; top: 4px; bottom: 4px; width: 1px; left: calc(10px + var(--lim) * (100% - 20px)); background: var(--danger); pointer-events: none }
.fs-vu-meter.is-tile .tm-a { height: 32px }
`,
    mount(host, ctx) {
      const id = "tm" + ++n;
      const rows = AGENTS.map((a) => '<div class="tm-a" data-tone="' + a.hue + '"><span>' + a.name + '</span><i>0</i><span class="tm-lv"></span><span class="tm-pk"></span></div>').join("");
      host.innerHTML = `
<div class="tm">
  <div class="tm-strip"><b>Tokens a second</b>
    <span class="tm-box" role="slider" tabindex="0" aria-label="Rate limit, tokens a second" aria-describedby="${id}-hint" aria-orientation="vertical" aria-valuemin="40" aria-valuemax="200"></span>
    <button class="tm-key" type="button" aria-pressed="false">Run</button>
  </div>
  <div class="tm-wrap"><div class="tm-surface" aria-hidden="true">${rows}<span class="tm-lim"></span></div></div>
  <p id="${id}-hint" class="sr-only">Drag up or down, or use the arrow keys, to set the limit. Double-click for 160.</p>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const sig = { signal: ctx.signal };
      const root = host.querySelector(".tm"), objs = [...host.querySelectorAll(".tm-a")], nums = objs.map((o) => o.querySelector("i"));
      const run = host.querySelector(".tm-key"), limitEl = host.querySelector(".tm-box"), live = host.querySelector("[aria-live]");
      let limit = 160, running = false, t = 0;

      function drawLimit() {
        root.style.setProperty("--lim", pos(limit).toFixed(4));
        limitEl.textContent = "Limit " + limit;
        limitEl.setAttribute("aria-valuenow", String(limit)); limitEl.setAttribute("aria-valuetext", limit + " tokens a second");
      }
      drawLimit();

      /* Each agent streams in bursts: a stretch of tokens, a pause for a tool call, another stretch. */
      const st = AGENTS.map(() => ({ until: 0, on: false, amp: 0 }));
      function rate(i) {
        const a = AGENTS[i], s = st[i];
        if (t >= s.until) {
          s.on = !s.on || Math.random() < 0.2;
          s.until = t + (s.on ? 0.5 + Math.random() * 1.6 : 0.3 + Math.random() * 0.9);
          s.amp = a.rate * (0.7 + Math.random() * 0.5) * (Math.random() < 0.12 ? 1.3 : 1);
        }
        return s.on ? s.amp * (0.85 + Math.random() * 0.3) : Math.random() * 6;
      }
      const shown = AGENTS.map(() => 0), peak = AGENTS.map(() => 0), peakAt = AGENTS.map(() => 0);
      let lastText = 0;
      ctx.loop((dt, now) => {
        if (running) t += dt;
        for (let i = 0; i < AGENTS.length; i++) {
          const r = running ? rate(i) : 0;
          shown[i] = r > shown[i] ? r : Math.max(r, shown[i] - FALL * dt);
          if (shown[i] >= peak[i]) { peak[i] = shown[i]; peakAt[i] = now; } else if (now - peakAt[i] > HOLD) peak[i] = Math.max(shown[i], peak[i] - PEAK_FALL * dt);
          objs[i].style.setProperty("--l", pos(shown[i]).toFixed(4));
          objs[i].style.setProperty("--k", pos(peak[i]).toFixed(4));
          objs[i].style.setProperty("--ko", peak[i] > 2 ? "1" : "0");
        }
        if (now - lastText > 120) {
          lastText = now;
          nums.forEach((el, i) => { el.textContent = Math.round(shown[i]); objs[i].classList.toggle("is-over", peak[i] > limit); });
        }
      });

      function setRun(on) { running = on; run.setAttribute("aria-pressed", String(on)); run.textContent = on ? "Stop" : "Run"; }
      run.addEventListener("click", () => { setRun(!running); live.textContent = running ? "Team running" : "Team stopped"; }, sig);
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
