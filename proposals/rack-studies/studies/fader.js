/* Fader, after litterthanlit/components, redesigned in Rack 2.0.
   The product underneath is a run's effort lanes on autopilot. One surface holds three agents (Planner purple, Coder
   orange, Reviewer green), each one object in its colour whose level is how hard it works. The plan moves the levels with
   the clock; grab an object and its level follows your hand 1:1 and stays, and a small Auto key appears in it to hand it
   back. Double-click returns to 50 %; Shift drags finely; 50 % catches the hand. The strip holds the run: its clock and
   the lit Run key. */
(function () {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const snap = (v) => clamp(Math.round(v * 2) / 2, 0, 100);
  const UNITY = 50, CATCH = 1.2, RELEASE = 3.5, FINE = 0.25, LOOP = 12;
  const TOP = 26, BOTTOM = 8; // px inside an object: the name's row, and the foot
  const smooth = (x) => { const c = clamp(x, 0, 1); return c * c * (3 - 2 * c); };
  const swell = (t, a, b, r) => smooth((t - a) / r) * (1 - smooth((t - b) / r));
  const u = (t) => ((t % LOOP) + LOOP) % LOOP;
  /* The plan: the Planner works hard first, the Coder takes over, the Reviewer comes in at the end. */
  const PLAN = {
    planner: (t) => snap(22 + 58 * swell(u(t), -1, 3.4, 0.8) + 3 * Math.sin(t * 2.1)),
    coder: (t) => snap(18 + 62 * swell(u(t), 2.6, 9, 0.9) + 4 * Math.sin(t * 1.3)),
    reviewer: (t) => snap(14 + 56 * swell(u(t), 8.4, 13, 0.7) + 2 * Math.sin(t * 1.7)),
  };
  const AGENTS = [{ key: "planner", label: "Planner", hue: "purple" }, { key: "coder", label: "Coder", hue: "orange" }, { key: "reviewer", label: "Reviewer", hue: "green" }];
  const clockText = (t) => { const s = Math.max(0, t); return Math.floor(s / 60) + ":" + (s % 60).toFixed(1).padStart(4, "0"); };

  FlatPlayer.register({
    slug: "fader",
    title: "Fader",
    tagline: "Agent effort on autopilot until you take a lane.",
    css: `
.fs-fader .rk { width: min(100%, 440px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-family: var(--font); user-select: none; -webkit-user-select: none; --h: 250px }
.fs-fader.is-tile .rk { --h: 150px }
.fs-fader .rk-strip { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 6px 0 12px; background: var(--panel-2) }
.fs-fader .rk-strip b { font-size: 12px; font-weight: 600; margin-right: auto }
.fs-fader .rk-box { height: 22px; display: inline-flex; align-items: center; padding: 0 6px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge); font: 600 11px/1 var(--mono); font-variant-numeric: tabular-nums }
.fs-fader .rk-key { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge);
  font: 500 11px/1 var(--font); color: var(--ink); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out) }
.fs-fader .rk-key:hover { background: var(--block-hover) }
.fs-fader .rk-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-fader .rk-key.is-lit { background: var(--accent); color: var(--accent-fg) }
.fs-fader .rk-key:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px }
.fs-fader .rk-key svg { width: 9px; height: 9px; fill: currentColor }
.fs-fader .rk-wrap { padding: 12px }
.fs-fader .rk-surface { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 10px; height: var(--h); border-radius: var(--r-control); background-color: var(--cut); box-shadow: var(--edge) }
.fs-fader .rk-lane { position: relative; min-width: 0 }
.fs-fader .rk-a { position: absolute; inset: 0; border-radius: var(--r-control); background: var(--c-tint); box-shadow: inset 0 0 0 1px var(--c); color: var(--c-text); cursor: ns-resize; touch-action: none; overflow: hidden; --f: 0 }
.fs-fader .rk-a:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px }
.fs-fader .rk-a[data-held] { box-shadow: inset 0 0 0 2px var(--c) }
.fs-fader .rk-name { position: absolute; left: 7px; top: 7px; font-size: 11px; font-weight: 600; line-height: 1 }
.fs-fader .rk-fill { position: absolute; left: 1px; right: 1px; bottom: 1px; height: calc(${BOTTOM - 1}px + var(--f) * (100% - ${TOP + BOTTOM}px)); background: color-mix(in oklab, var(--c), transparent 72%) }
.fs-fader .rk-fill::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px; background: var(--c) }
.fs-fader .rk-val { position: absolute; left: 7px; bottom: calc(${BOTTOM}px + var(--f) * (100% - ${TOP + BOTTOM}px) + 6px); font: 600 11px/1 var(--mono); font-variant-numeric: tabular-nums }
.fs-fader .rk-auto { position: absolute; right: 4px; top: 4px; z-index: 1; height: 18px; padding: 0 6px; font-size: 10px; animation: fd-in var(--cut-in) var(--ease-out) both }
.fs-fader .rk-auto[hidden] { display: none }
@keyframes fd-in { from { opacity: 0 } }
`,
    mount(host, ctx) {
      const reduced = ctx.reduced(), S = ctx.signal, on = (el, t, f) => el.addEventListener(t, f, { signal: S });
      host.innerHTML = `
<div class="rk">
  <div class="rk-strip"><b>Run 12</b><span class="rk-box rk-clock" aria-hidden="true">0:00.0</span><button type="button" class="rk-key rk-run"></button></div>
  <div class="rk-wrap"><div class="rk-surface"></div></div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const run = host.querySelector(".rk-run"), clockEl = host.querySelector(".rk-clock"), surface = host.querySelector(".rk-surface"), live = host.querySelector("[aria-live]");
      let playing = false, time = 0, selfRun = !reduced, downTarget = null;

      const lanes = AGENTS.map(({ key, label, hue }) => {
        const el = document.createElement("div");
        el.className = "rk-a"; el.tabIndex = 0;
        el.setAttribute("role", "slider"); el.setAttribute("aria-orientation", "vertical"); el.setAttribute("aria-valuemin", "0"); el.setAttribute("aria-valuemax", "100");
        el.setAttribute("aria-label", label + " effort");
        el.style.setProperty("--c", `var(--clip-${hue})`); el.style.setProperty("--c-tint", `var(--clip-${hue}-tint)`); el.style.setProperty("--c-text", `var(--clip-${hue}-text)`);
        el.innerHTML = `<span class="rk-fill" aria-hidden="true"></span><span class="rk-name" aria-hidden="true">${label}</span><span class="rk-val" aria-hidden="true"></span>`;
        const auto = document.createElement("button");
        auto.type = "button"; auto.className = "rk-key rk-auto"; auto.textContent = "Auto"; auto.hidden = true;
        auto.setAttribute("aria-label", "Put " + label + " back on autopilot");
        const lane = document.createElement("div");
        lane.className = "rk-lane";
        lane.append(el, auto); // the key sits over the object, but is its own control and tab stop
        surface.appendChild(lane);
        return { key, label, el, auto, val: el.querySelector(".rk-val"), value: 0, follow: true, drag: null, lastDown: { at: -Infinity, y: 0 } };
      });

      function set(L, v) {
        L.value = v;
        L.el.style.setProperty("--f", (v / 100).toFixed(4));
        L.el.setAttribute("aria-valuenow", String(v));
        L.el.setAttribute("aria-valuetext", Math.round(v) + " %" + (L.follow ? ", autopilot" : ", yours"));
        L.val.textContent = Math.round(v) + " %";
      }
      function follow(L, on) {
        if (L.follow === on) return;
        L.follow = on; L.auto.hidden = on;
        if (on && playing) set(L, PLAN[L.key](time)); else set(L, L.value);
        live.textContent = L.label + (on ? " is back on autopilot" : " is yours");
      }
      function renderRun() {
        run.classList.toggle("is-lit", playing);
        run.innerHTML = (playing ? '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1.5" width="7" height="7"/></svg>Running' : '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1v8l7-4z"/></svg>Run');
        run.setAttribute("aria-pressed", String(playing));
        run.setAttribute("aria-label", "Run 12 on autopilot");
      }
      const start = () => { playing = true; renderRun(); live.textContent = "Run 12 running"; };
      const stop = () => { playing = false; renderRun(); live.textContent = "Run 12 stopped"; };

      /* Only time moves the levels: the plan follows the clock and stops when the run stops. */
      ctx.loop((dt) => {
        if (!playing) return;
        time += dt;
        clockEl.textContent = clockText(time);
        lanes.forEach((L) => { if (L.follow && !L.drag) set(L, PLAN[L.key](time)); });
      });

      window.addEventListener("pointerdown", (e) => { downTarget = e.target; }, { capture: true, signal: S });
      window.addEventListener("keydown", (e) => { downTarget = e.target; }, { capture: true, signal: S });
      ctx.onHand(() => { if (!selfRun) return; selfRun = false; if (!(downTarget && run.contains(downTarget)) && playing) stop(); });
      on(run, "click", () => (playing ? stop() : start()));

      lanes.forEach((L) => {
        const el = L.el;
        on(L.auto, "click", () => { follow(L, true); el.focus(); });
        on(el, "keydown", (e) => {
          if (e.target !== el) return;
          const d = { ArrowUp: 0.5, ArrowRight: 0.5, ArrowDown: -0.5, ArrowLeft: -0.5, PageUp: 10, PageDown: -10 }[e.key];
          const next = d !== undefined ? snap(L.value + d) : e.key === "Home" ? 0 : e.key === "End" ? 100 : null;
          if (next === null) return;
          e.preventDefault(); follow(L, false); set(L, next);
        });
        /* The hand: a press puts the level where you pressed, a drag moves it 1:1, and it stays. */
        on(el, "pointerdown", (e) => {
          if (e.button !== 0 || L.drag) return;
          e.preventDefault(); el.focus({ preventScroll: true }); el.setPointerCapture(e.pointerId);
          follow(L, false);
          const dbl = e.timeStamp - L.lastDown.at < 320 && Math.abs(e.clientY - L.lastDown.y) < 24;
          L.lastDown = { at: dbl ? -Infinity : e.timeStamp, y: e.clientY };
          if (dbl) { set(L, UNITY); return; }
          const box = el.getBoundingClientRect(), travel = box.height - TOP - BOTTOM;
          set(L, snap(clamp((box.bottom - BOTTOM - e.clientY) / travel, 0, 1) * 100));
          el.dataset.held = "";
          L.drag = { id: e.pointerId, y: e.clientY, from: L.value, raw: L.value, travel, fine: e.shiftKey, caught: L.value === UNITY };
        });
        on(el, "pointermove", (e) => {
          const d = L.drag;
          if (!d || d.id !== e.pointerId) return;
          if (e.shiftKey !== d.fine) { d.from = d.raw; d.y = e.clientY; d.fine = e.shiftKey; }
          let raw = d.from - ((e.clientY - d.y) / d.travel) * 100 * (d.fine ? FINE : 1);
          if (raw > 100 || raw < 0) { raw = clamp(raw, 0, 100); d.from = raw; d.y = e.clientY; }
          const off = raw - UNITY;
          let next;
          if (d.caught && Math.abs(off) <= RELEASE) next = UNITY;
          else if (!d.caught && Math.abs(off) <= CATCH) { d.caught = true; next = UNITY; }
          else { d.caught = false; next = snap(raw); }
          d.raw = raw;
          if (next !== L.value) set(L, next);
        });
        const end = (e) => { if (!L.drag || L.drag.id !== e.pointerId) return; L.drag = null; delete el.dataset.held; };
        on(el, "pointerup", end); on(el, "pointercancel", end);
      });

      lanes.forEach((L) => set(L, PLAN[L.key](reduced ? 1.6 : 0)));
      renderRun();
      if (selfRun) start();
    },
  });
})();
