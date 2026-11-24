/* Step Sequencer, Rack 2.0: a schedule for an agent team, after Live's step sequencer. One surface: four agents (Planner
   purple, Researcher blue, Coder orange, Reviewer green) against sixteen half-hour slots from 08:00. A scheduled run is a
   slot in its agent's colour; the column under the playhead greys, and a run that fires there takes a 2px edge, as does its
   agent. Slots are queued a moment ahead on a steady tick, so the replay never drifts with the frame rate. The strip holds
   the time and Run, the one lit key. Narrow views show half a day and follow the playhead; the grid is one tab stop. */
(function () {
  const TRACKS = [
    { name: "Planner", hue: "purple" },
    { name: "Researcher", hue: "blue" },
    { name: "Coder", hue: "orange" },
    { name: "Reviewer", hue: "green" },
  ];
  const STEPS = 16, PAGE = 8, LOOKAHEAD = 100, INTERVAL = 25, PIN = 3000, WIDE = 420;
  const STEP_MS = { min: 150, max: 1200, initial: 400 };
  const slot = (c) => String(8 + (c >> 1)).padStart(2, "0") + ":" + (c % 2 ? "30" : "00");
  const GROOVE = [[0, 8], [1, 3, 9, 11], [2, 4, 5, 10, 12, 13], [6, 14, 15]];
  let uid = 0;

  FlatPlayer.register({
    slug: "step-sequencer",
    title: "Step Sequencer",
    tagline: "A schedule of agent runs, stepping on a steady tick.",
    css: `
.fs-step-sequencer .sq { width: min(100%, 640px); font-size: 12px; -webkit-user-select: none; user-select: none }
.fs-step-sequencer .sq-dev { background: var(--panel); border-radius: var(--r-panel); overflow: hidden }
.fs-step-sequencer .sq-head { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 10px; background: var(--panel-2); white-space: nowrap }
.fs-step-sequencer .sq-title { font-weight: 600; margin-right: auto }
.fs-step-sequencer .sq-pos { height: 22px; min-width: 52px; padding: 0 8px; display: inline-grid; place-items: center; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px var(--mono) }
.fs-step-sequencer .sq-key { height: 22px; min-width: 52px; padding: 0 8px; border: 0; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge); color: var(--ink);
  font: 600 11px var(--font); cursor: pointer; white-space: nowrap; transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
.fs-step-sequencer .sq-key:hover { background: var(--block-hover) }
.fs-step-sequencer .sq-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-step-sequencer .sq-play[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
.fs-step-sequencer .sq-body { margin: 12px; padding: 10px; display: grid; gap: 6px; background: var(--cut); border-radius: var(--r-control); box-shadow: var(--edge) }
.fs-step-sequencer .sq-grid { display: grid; gap: 4px }
.fs-step-sequencer .sq-track { display: grid; align-items: center; gap: 3px }
.fs-step-sequencer .sq-name { height: 24px; display: flex; align-items: center; padding: 0 6px; margin-right: 4px; border-radius: var(--r-control); background: var(--tint);
  box-shadow: inset 0 0 0 1px var(--hue); color: var(--txt); font-weight: 600; font-size: 11px; white-space: nowrap; overflow: hidden }
.fs-step-sequencer .sq-name.is-firing { box-shadow: inset 0 0 0 2px var(--hue) }
.fs-step-sequencer .sq-cell { position: relative; height: 24px; min-width: 0; border: 0; padding: 0; border-radius: var(--r-control); background: transparent;
  box-shadow: inset 0 0 0 1px var(--line); cursor: pointer }
.fs-step-sequencer .sq-cell[data-head] { background: var(--panel-2) }
.fs-step-sequencer .sq-cell[aria-pressed="true"] { background: var(--tint); box-shadow: inset 0 0 0 1px var(--hue) }
.fs-step-sequencer .sq-cell.is-firing { box-shadow: inset 0 0 0 2px var(--hue) }
.fs-step-sequencer .sq-cell:active { transform: scale(0.96) }
.fs-step-sequencer .sq-times { display: grid; gap: 3px; font: 500 10px var(--mono); color: var(--muted); white-space: nowrap }
.fs-step-sequencer.is-tile .sq-cell, .fs-step-sequencer.is-tile .sq-name { height: 20px }
.fs-step-sequencer.is-tile .sq-body { margin: 10px }
`,
    mount(host, ctx) {
      const id = "sq" + ++uid;
      host.innerHTML = `
<div class="sq" role="group" aria-label="Step sequencer"><div class="sq-dev">
  <div class="sq-head">
    <span class="sq-title">Schedule</span>
    <span class="sq-pos" aria-hidden="true">08:00</span>
    <button class="sq-key sq-play" type="button">Run</button>

  </div>
  <div class="sq-body"><div class="sq-grid"></div><div class="sq-times" aria-hidden="true"></div></div>
  <p class="sr-only" role="status" aria-live="polite"></p>
</div></div>`;
      const sig = { signal: ctx.signal };
      const root = host.querySelector(".sq"), play = host.querySelector(".sq-play"), grid = host.querySelector(".sq-grid");
      const posEl = host.querySelector(".sq-pos"), live = host.querySelector("[role=status]");
      const pattern = GROOVE.map((on) => Array.from({ length: STEPS }, (_, i) => on.includes(i)));
      let stepMs = STEP_MS.initial, running = false, head = { step: -1, bar: 0 }, page = 0, wide = false, cursor = { row: 0, col: 0 }, pinned = 0;
      let cells = [], names = [], cols = [];

      function build() {
        cols = wide ? Array.from({ length: STEPS }, (_, i) => i) : Array.from({ length: PAGE }, (_, i) => page * PAGE + i);
        const template = "76px repeat(" + cols.length + ", minmax(0, 1fr))";
        const focused = grid.contains(document.activeElement);
        grid.textContent = ""; cells = []; names = [];
        TRACKS.forEach((t, row) => {
          const tr = document.createElement("div");
          tr.className = "sq-track"; tr.setAttribute("role", "group"); tr.setAttribute("aria-label", t.name); tr.style.gridTemplateColumns = template;
          tr.style.cssText += ";--hue: var(--clip-" + t.hue + "); --tint: var(--clip-" + t.hue + "-tint); --txt: var(--clip-" + t.hue + "-text)";
          const name = document.createElement("span");
          name.className = "sq-name"; name.textContent = t.name; name.setAttribute("aria-hidden", "true");
          tr.appendChild(name); names.push(name);
          cells.push(cols.map((col) => {
            const b = document.createElement("button");
            b.type = "button"; b.className = "sq-cell"; b.dataset.row = row; b.dataset.col = col;
            if (Math.floor(col / 2) % 2 === 1) b.dataset.beat = "";
            b.setAttribute("aria-label", t.name + ", " + slot(col));
            tr.appendChild(b);
            return b;
          }));
          grid.appendChild(tr);
        });
        const times = host.querySelector(".sq-times");
        times.style.gridTemplateColumns = template;
        times.innerHTML = "<span></span>" + cols.map((c) => "<span>" + (c % 2 ? "" : slot(c)) + "</span>").join("");
        paint();
        if (focused) cellAt(cursor.row, cursor.col)?.focus({ preventScroll: true });
      }
      const cellAt = (row, col) => (cells[row] || []).find((b) => +b.dataset.col === col);

      function paint() {
        const lit = running ? head.step : -1;
        const stop = cols.includes(cursor.col) ? cursor.col : cols[cursor.col % PAGE];
        cells.forEach((rowCells, row) => rowCells.forEach((b) => {
          const col = +b.dataset.col, on = pattern[row][col];
          b.setAttribute("aria-pressed", String(on));
          b.tabIndex = row === cursor.row && col === stop ? 0 : -1;
          b.toggleAttribute("data-head", col === lit);
          b.classList.toggle("is-firing", on && col === lit);
        }));
        names.forEach((n, row) => n.classList.toggle("is-firing", lit >= 0 && pattern[row][lit]));
      }
      function paintTop() {
        const lit = running ? head.step : -1;
        posEl.textContent = lit >= 0 ? slot(lit) : "08:00";
        play.textContent = running ? "Stop" : "Run";
        play.setAttribute("aria-label", running ? "Stop" : "Play");
        play.setAttribute("aria-pressed", String(running));
      }

      /* The scheduler: queue the next steps a moment ahead on a steady clock; the lights read the same queue. */
      let schedTimer = 0, drawLoop = null, queue = [], at = 0, step = 0;
      function schedule() {
        const now = performance.now();
        if (at < now - 250) at = now + 20; // back from a hidden tab: pick the tick up from here
        while (at < now + LOOKAHEAD) { queue.push({ step, at }); step = (step + 1) % STEPS; at += stepMs; }
      }
      function start() {
        if (running) return;
        running = true; head = { step: -1, bar: 0 }; queue = []; step = 0; at = performance.now() + 40;
        schedule(); schedTimer = ctx.every(INTERVAL, schedule);
        drawLoop = ctx.loop((dt, now) => {
          let shown = -1;
          while (queue.length && queue[0].at <= now) shown = queue.shift().step;
          if (shown >= 0) {
            head = { step: shown, bar: shown === 0 ? head.bar + 1 : head.bar };
            if (!wide && now > pinned && Math.floor(shown / PAGE) !== page) { page = Math.floor(shown / PAGE); build(); }
            paint(); paintTop();
          }
          return running;
        });
        paintTop(); paint();
      }
      function stop() {
        if (!running) return;
        running = false; clearInterval(schedTimer); schedTimer = 0; if (drawLoop) drawLoop.stop = true;
        paintTop(); paint();
      }

      /* Moves. */
      const pin = () => (pinned = performance.now() + PIN);
      grid.addEventListener("click", (e) => {
        const b = e.target.closest(".sq-cell"); if (!b) return;
        const row = +b.dataset.row, col = +b.dataset.col;
        pattern[row][col] = !pattern[row][col]; cursor = { row, col }; pin(); paint();
      }, sig);
      grid.addEventListener("keydown", (e) => {
        const b = e.target.closest(".sq-cell"); if (!b) return;
        let r = +b.dataset.row, c = +b.dataset.col;
        const k = e.key;
        if (k === "ArrowRight") c++; else if (k === "ArrowLeft") c--; else if (k === "ArrowDown") r++; else if (k === "ArrowUp") r--;
        else if (k === "Home") c = 0; else if (k === "End") c = STEPS - 1; else return;
        e.preventDefault();
        if (r < 0 || r >= TRACKS.length || c < 0 || c >= STEPS) return;
        cursor = { row: r, col: c }; pin();
        if (!wide && Math.floor(c / PAGE) !== page) { page = Math.floor(c / PAGE); build(); }
        else paint();
        cellAt(r, c)?.focus({ preventScroll: true });
      }, sig);
      play.addEventListener("click", () => {
        if (running) { stop(); live.textContent = "Stopped"; } else { start(); live.textContent = "Replaying the schedule"; }
      }, sig);

      /* Sixteen steps once there's room for them. */
      const ro = new ResizeObserver(([entry]) => { const w = entry.contentRect.width >= WIDE; if (w !== wide) { wide = w; build(); } });
      ro.observe(root);
      wide = root.getBoundingClientRect().width >= WIDE;
      build(); paintTop();
      /* It plays from the first frame; under reduced motion it waits for Play. */
      if (!ctx.reduced()) start();
      return { destroy() { ro.disconnect(); running = false; } };
    },
  });
})();
