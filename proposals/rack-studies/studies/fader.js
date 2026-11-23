/* Fader, after litterthanlit/components, redesigned in Rack (round 2: agents, not music).
   The product underneath is a run's effort lanes on autopilot: a plan sets how hard each agent works (Planner, Coder,
   Reviewer, each in its own colour) as the run goes, and each lane follows it with the clock until a hand overrides it.
   A lane wears its agent's colour on its title, its effort fill and its usage meter (red when it runs at its limit).
   A hand sets the effort 1:1 and it stays; the lane's key turns to Re-enable, as Live's re-enable automation does.
   Double-click returns to 50 %; Shift drags finely; 50 % catches the hand. The transport is the run: the lit Run key,
   its clock and what it has cost so far. */
(function () {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const snap = (v) => clamp(Math.round(v * 2) / 2, 0, 100);
  const pct = (v) => Math.round(v) + " % effort";
  const UNITY = 50, CATCH = 1.2, RELEASE = 3.5, FINE = 0.25;
  const LOOP = 12; // s: the autopilot plan, played round
  const smooth = (x) => { const c = clamp(x, 0, 1); return c * c * (3 - 2 * c); };
  const swell = (t, a, b, r) => smooth((t - a) / r) * (1 - smooth((t - b) / r));
  const u = (t) => ((t % LOOP) + LOOP) % LOOP;
  /* The plan: the Planner works hard first, the Coder takes over, the Reviewer comes in at the end. */
  const AUTO = {
    planner: (t) => snap(22 + 58 * swell(u(t), -1, 3.4, 0.8) + 3 * Math.sin(t * 2.1)),
    coder: (t) => snap(18 + 62 * swell(u(t), 2.6, 9, 0.9) + 4 * Math.sin(t * 1.3)),
    reviewer: (t) => snap(14 + 56 * swell(u(t), 8.4, 13, 0.7) + 2 * Math.sin(t * 1.7)),
  };
  /* How much of its effort each agent is spending right now: the work the meter shows. */
  const BUSY = {
    planner: (t) => 0.55 + 0.4 * Math.abs(Math.sin(t * 3.1)),
    coder: (t) => 0.6 + 0.45 * Math.abs(Math.sin(t * 4.3) * Math.sin(t * 1.1)),
    reviewer: (t) => 0.5 + 0.35 * Math.abs(Math.sin(t * 2.4)),
  };
  const TRACKS = [{ key: "planner", label: "Planner", hue: "purple" }, { key: "coder", label: "Coder", hue: "orange" }, { key: "reviewer", label: "Reviewer", hue: "green" }];
  const MARKS = [[1, "100"], [0.75, "75"], [0.5, "50"], [0.25, "25"], [0, "0"]];
  const clockText = (t) => Math.floor(t / 60) + ":" + (t % 60).toFixed(1).padStart(4, "0");

  FlatPlayer.register({
    slug: "fader",
    title: "Fader",
    tagline: "Agent effort on autopilot until you override a lane.",
    css: `
.fs-fader .rk { width: min(100%, 420px); background: var(--body); border-radius: var(--r-panel); padding: 3px; display: grid; gap: 3px; font-family: var(--font); user-select: none; -webkit-user-select: none; --h: 176px }
.fs-fader.is-tile .rk { --h: 96px }
.fs-fader .rk-panel { background: var(--panel); border-radius: var(--r-panel); overflow: hidden }
.fs-fader .rk-transport { display: flex; align-items: center; gap: 6px; padding: 6px }
.fs-fader .rk-key { all: unset; box-sizing: border-box; display: grid; place-items: center; min-width: 28px; height: 26px; padding: 0 8px; border-radius: var(--r-control);
  background: var(--block); box-shadow: var(--edge); color: var(--ink); font: 500 11px/1 var(--font); cursor: pointer; white-space: nowrap;
  transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
.fs-fader .rk-key:hover { background: var(--block-hover) }
.fs-fader .rk-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-fader .rk-key:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px }
.fs-fader .rk-key svg { width: 11px; height: 11px; fill: currentColor }
.fs-fader .rk-key.is-lit { background: var(--accent); color: var(--accent-fg) }
.fs-fader .rk-pos { font: 600 20px/1 var(--mono); font-variant-numeric: tabular-nums; color: var(--ink); min-width: 4.2em; padding-left: 4px }
.fs-fader .rk-play { gap: 6px; grid-auto-flow: column }
.fs-fader .rk-box { height: 22px; display: inline-flex; align-items: center; padding: 0 6px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 500 11px/1 var(--mono); font-variant-numeric: tabular-nums; color: var(--ink); white-space: nowrap }
.fs-fader .rk-song { margin-left: auto; font-size: 12px; font-weight: 600; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0 }
.fs-fader .rk-strips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px }
.fs-fader .rk-title { padding: 4px 7px; font-size: 12px; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-fader .rk-body { display: grid; justify-items: center; gap: 6px; padding: 8px 6px 6px }
.fs-fader.is-tile .rk-body { gap: 4px; padding: 6px 5px 5px }
.fs-fader .rk-well { position: relative; display: flex; gap: 6px; height: var(--h); padding: 0 0 0 26px }
.fs-fader.is-tile .rk-well { padding-left: 0 }
.fs-fader .rk-mark { position: absolute; left: 0; width: 22px; text-align: right; translate: 0 -50%; font: 500 9px/1 var(--mono); color: var(--muted) }
.fs-fader.is-tile .rk-mark { display: none }
.fs-fader .rk-meter { position: relative; width: 5px; height: calc(100% - 12px); margin-top: 6px; background: var(--slot); border-radius: 1px; overflow: hidden }
.fs-fader .rk-meter i { position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--m, 0) * 100%); background: var(--c) }
.fs-fader .rk-meter.is-over i { background: var(--danger) }
.fs-fader .rk-fader { position: relative; width: 28px; height: 100%; cursor: ns-resize; touch-action: none; --f: 0 }
.fs-fader .rk-fader:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px }
.fs-fader .rk-slot { position: absolute; left: 50%; width: 4px; translate: -50% 0; top: 6px; bottom: 6px; background: var(--slot); border-radius: 1px }
.fs-fader .rk-slot i { position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--f) * 100%); background: var(--c) }
.fs-fader .rk-thumb { position: absolute; left: 0; right: 0; height: 12px; bottom: calc(var(--f) * (100% - 12px)); border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge) }
.fs-fader .rk-thumb::after { content: ""; position: absolute; left: 4px; right: 4px; top: 50%; height: 1px; background: var(--ink) }
.fs-fader .rk-fader[data-held] .rk-thumb { box-shadow: var(--edge-press); background: var(--block-hover) }
.fs-fader .rk-val { width: 100%; justify-content: center; cursor: ns-resize; touch-action: none }
.fs-fader .rk-auto { width: 100% }
.fs-fader .rk-auto[aria-pressed="false"] { color: var(--danger) }
.fs-fader.is-tile .rk-auto, .fs-fader.is-tile .rk-song { display: none }
.fs-fader.is-tile .rk-pos { font-size: 16px }
`,
    mount(host, ctx) {
      const reduced = ctx.reduced(), S = ctx.signal, on = (el, t, f) => el.addEventListener(t, f, { signal: S });
      host.innerHTML = `
<div class="rk">
  <div class="rk-panel rk-transport">
    <button type="button" class="rk-key rk-play"></button>
    <span class="rk-pos" aria-hidden="true">0:00.0</span>
    <span class="rk-box rk-cost" aria-hidden="true">$0.000</span>
    <span class="rk-song" aria-hidden="true">Run 12, autopilot</span>
  </div>
  <div class="rk-strips"></div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const costEl = host.querySelector(".rk-cost"), play = host.querySelector(".rk-play"), posEl = host.querySelector(".rk-pos"), strips = host.querySelector(".rk-strips"), live = host.querySelector("[aria-live]");
      let playing = false, cost = 0, time = 0, last = 0, selfRun = !reduced, downTarget = null;

      const tr = {};
      TRACKS.forEach(({ key, label, hue }) => {
        const el = document.createElement("div");
        el.className = "rk-panel";
        el.style.setProperty("--c", `var(--clip-${hue})`);
        el.innerHTML = `<div class="rk-title" style="background:var(--clip-${hue}-tint);color:var(--clip-${hue}-text)">${label}</div>
<div class="rk-body">
  <div class="rk-well">
    ${MARKS.map(([f, l]) => `<span class="rk-mark" aria-hidden="true" style="top:calc(6px + ${(1 - f).toFixed(3)} * (100% - 12px))">${l}</span>`).join("")}
    <span class="rk-meter" aria-hidden="true"><i></i></span>
    <div class="rk-fader" role="slider" tabindex="0" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-label="${label} effort">
      <span class="rk-slot" aria-hidden="true"><i></i></span><span class="rk-thumb" aria-hidden="true"></span>
    </div>
  </div>
  <span class="rk-box rk-val" aria-hidden="true"></span>
  <button type="button" class="rk-key rk-auto" aria-pressed="true"></button>
</div>`;
        strips.appendChild(el);
        const t = { key, label, fader: el.querySelector(".rk-fader"), val: el.querySelector(".rk-val"), auto: el.querySelector(".rk-auto"), meter: el.querySelector(".rk-meter"),
          value: 0, follow: true, level: 0, drag: null, lastDown: { at: -Infinity, y: 0 } };
        t.auto.setAttribute("aria-label", label + " autopilot");
        tr[key] = t;
      });

      function set(t, v) {
        t.value = v;
        const text = pct(v);
        t.fader.style.setProperty("--f", (v / 100).toFixed(4));
        t.fader.setAttribute("aria-valuenow", String(v));
        t.fader.setAttribute("aria-valuetext", text);
        t.val.textContent = text;
      }
      function renderAuto(t) { t.auto.setAttribute("aria-pressed", String(t.follow)); t.auto.textContent = t.follow ? "Auto" : "Re-enable"; }
      function override(t) { if (!t.follow) return; t.follow = false; renderAuto(t); live.textContent = t.label + ": autopilot overridden"; }
      function renderPlay() {
        play.classList.toggle("is-lit", playing);
        play.innerHTML = (playing ? '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1.5" width="7" height="7"/></svg>' : '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1v8l7-4z"/></svg>') + (playing ? "Running" : "Run");
        play.setAttribute("aria-label", playing ? "Stop the run" : "Run");
        play.setAttribute("aria-pressed", String(playing));
      }
      function start() { playing = true; last = performance.now(); renderPlay(); live.textContent = "Run 12 running on autopilot"; }
      function stop() {
        playing = false; renderPlay(); live.textContent = "Run 12 stopped";
        TRACKS.forEach(({ key }) => { tr[key].level = 0; tr[key].meter.firstChild.style.setProperty("--m", "0"); tr[key].meter.classList.remove("is-over"); });
      }

      /* Time moves things: the clock, the autopilot and the meters follow the clock and stop when it stops. */
      ctx.loop((dt, now) => {
        if (!playing) return;
        const step = Math.min(0.1, (now - last) / 1000); last = now;
        time += step;
        posEl.textContent = clockText(time);
        costEl.textContent = "$" + cost.toFixed(3);
        TRACKS.forEach(({ key }) => {
          const t = tr[key];
          if (t.follow && !t.drag) set(t, AUTO[key](time));
          const use = clamp((t.value / 100) * BUSY[key](time), 0, 1);
          t.level = Math.max(use, t.level - 1.2 * step);
          cost += use * 0.004 * step;
          t.meter.firstChild.style.setProperty("--m", t.level.toFixed(4));
          t.meter.classList.toggle("is-over", t.level > 0.92);
        });
      });

      /* The first hand ends the self-run for good; a press on Play is the hand's own choice. */
      window.addEventListener("pointerdown", (e) => { downTarget = e.target; }, { capture: true, signal: S });
      window.addEventListener("keydown", (e) => { downTarget = e.target; }, { capture: true, signal: S });
      ctx.onHand(() => {
        if (!selfRun) return;
        selfRun = false;
        if (!(downTarget && play.contains(downTarget)) && playing) stop();
      });
      on(play, "click", () => (playing ? stop() : start()));

      TRACKS.forEach(({ key }) => {
        const t = tr[key];
        on(t.auto, "click", () => {
          t.follow = !t.follow; renderAuto(t);
          if (t.follow && playing) set(t, AUTO[key](time));
          live.textContent = t.label + (t.follow ? ": back on autopilot" : ": autopilot overridden");
        });
        on(t.fader, "keydown", (e) => {
          const d = { ArrowUp: 0.5, ArrowRight: 0.5, ArrowDown: -0.5, ArrowLeft: -0.5, PageUp: 10, PageDown: -10 }[e.key];
          const next = d !== undefined ? snap(t.value + d) : e.key === "Home" ? 0 : e.key === "End" ? 100 : null;
          if (next === null) return;
          e.preventDefault(); override(t); set(t, next);
        });
        /* A hand sets the value 1:1 and it stays: on the fader, beside the thumb it jumps there; on the value box it drags. */
        const grab = (el, e, jump) => {
          if (e.button !== 0 || t.drag) return;
          e.preventDefault();
          t.fader.focus({ preventScroll: true });
          el.setPointerCapture(e.pointerId);
          override(t);
          const dbl = e.timeStamp - t.lastDown.at < 320 && Math.abs(e.clientY - t.lastDown.y) < 24;
          t.lastDown = { at: dbl ? -Infinity : e.timeStamp, y: e.clientY };
          if (dbl) { set(t, UNITY); return; }
          const box = t.fader.getBoundingClientRect(), travel = box.height - 12;
          if (jump) {
            const thumbTop = box.bottom - 12 - (t.value / 100) * travel;
            if (e.clientY < thumbTop - 2 || e.clientY > thumbTop + 14) set(t, snap(clamp((box.bottom - 6 - e.clientY) / travel, 0, 1) * 100));
          }
          t.fader.dataset.held = "";
          t.drag = { el, id: e.pointerId, y: e.clientY, from: t.value, raw: t.value, travel, fine: e.shiftKey, caught: t.value === UNITY };
        };
        const move = (e) => {
          const d = t.drag;
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
          if (next !== t.value) set(t, next);
        };
        const end = (e) => { if (!t.drag || t.drag.id !== e.pointerId) return; t.drag = null; delete t.fader.dataset.held; };
        for (const [el, jump] of [[t.fader, true], [t.val, false]]) {
          on(el, "pointerdown", (e) => grab(el, e, jump));
          on(el, "pointermove", move);
          on(el, "pointerup", end);
          on(el, "pointercancel", end);
        }
      });

      TRACKS.forEach(({ key }) => { set(tr[key], AUTO[key](reduced ? 1.6 : 0)); renderAuto(tr[key]); });
      renderPlay();
      if (selfRun) start();
    },
  });
})();
