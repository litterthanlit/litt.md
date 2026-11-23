/* Step Sequencer, redesigned for Flat: a beat maker as a pill grid. Four tracks of sixteen steps (the original's kit was the
   player's own clicks: press, tick, bump, select); grey squares are empty, ink ones are set, and the step under the
   playhead pops in its track's colour. Steps are queued a moment ahead on a steady clock, so the groove never drifts with
   the frame rate. The tempo is the one large figure, with − and + beside it. Narrow stages show eight steps at a time and
   follow the playhead; the pattern is one tab stop. Flat has no voice, so the beat is seen, not heard. */
(function () {
  const TRACKS = [
    { name: "Press", hue: "--blue" },
    { name: "Tick", hue: "--tangerine" },
    { name: "Bump", hue: "--mint" },
    { name: "Select", hue: "--grape" },
  ];
  const STEPS = 16, PAGE = 8, LOOKAHEAD = 100, INTERVAL = 25, PIN = 3000, WIDE = 528;
  const BPM = { min: 60, max: 180, initial: 112 };
  let uid = 0;
  const GROOVE = [[0, 3, 8, 10], [2, 6, 10, 14, 15], [4, 12], [0, 7, 11]];

  FlatPlayer.register({
    slug: "step-sequencer",
    title: "Step Sequencer",
    tagline: "The player's own clicks, sequenced.",
    css: `
.fs-step-sequencer .sq { width: min(36em, 100%); font-size: clamp(12px, calc(2.2cqw + 5px), 15px) }
.fs-step-sequencer .sq-paper { background: var(--paper); border-radius: var(--r-paper); padding: 1.2em; display: grid; gap: 1em; -webkit-user-select: none; user-select: none }
.fs-step-sequencer.is-tile .sq-paper { padding: 1em; gap: 0.8em }
.fs-step-sequencer .sq-top { display: flex; align-items: center; gap: 0.5em }
.fs-step-sequencer .sq-tempo { display: flex; align-items: baseline; gap: 0.3em; padding: 0 0.2em; border-radius: 0.5em; cursor: ew-resize; touch-action: none; margin-right: auto }
.fs-step-sequencer .sq-tempo b { font-size: 2.4em; font-weight: 600; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums }
.fs-step-sequencer .sq-tempo span { font-size: 0.87em; color: var(--muted) }
.fs-step-sequencer .sq-circle { flex: none; width: 2.5em; height: 2.5em; border: 0; border-radius: 50%; background: var(--bubble); color: var(--ink);
  display: grid; place-items: center; cursor: pointer; transition: transform 100ms }
.fs-step-sequencer .sq-circle:active { transform: scale(0.92) }
.fs-step-sequencer .sq-circle svg { width: 40%; height: 40%; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round }
.fs-step-sequencer .sq-play { width: 3em; height: 3em; margin-left: 0.25em; background: var(--ink); color: var(--on-ink) }
.fs-step-sequencer .sq-play svg { fill: currentColor; stroke: none }
.fs-step-sequencer .sq-grid { display: grid; gap: 0.35em }
.fs-step-sequencer .sq-track { display: grid; align-items: center; gap: 0.3em }
.fs-step-sequencer .sq-name { font-size: 0.93em; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: color 150ms }
.fs-step-sequencer .sq-name.is-firing { color: var(--ink); transition-duration: 0ms }
.fs-step-sequencer .sq-cell { position: relative; height: 2.2em; min-width: 0; border: 0; padding: 0; border-radius: 0.55em; background: transparent; cursor: pointer;
  -webkit-tap-highlight-color: transparent }
.fs-step-sequencer.is-tile .sq-cell { height: 1.9em }
.fs-step-sequencer .sq-cell i { position: absolute; inset: 0.1em; border-radius: 0.5em; background: var(--bubble); transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1) }
.fs-step-sequencer .sq-cell[data-head] i { background: color-mix(in oklab, var(--bubble), var(--ink) 12%) }
.fs-step-sequencer .sq-cell[aria-pressed="true"] i { background: var(--ink) }
.fs-step-sequencer .sq-cell.is-firing i { background: var(--hue); transform: scale(1.12); transition-duration: 0ms }
.fs-step-sequencer .sq-cell:active i { transform: scale(0.9) }
.fs-step-sequencer .sq-pages { display: flex; align-items: center; justify-content: flex-end; gap: 0.3em }
.fs-step-sequencer .sq-pages[hidden], .fs-step-sequencer.is-tile .sq-pages { display: none }
.fs-step-sequencer .sq-pos { margin-right: auto; font-size: 0.87em; color: var(--muted); font-variant-numeric: tabular-nums }
.fs-step-sequencer .sq-page { height: 2.4em; padding: 0 1em; border: 0; border-radius: var(--r-pill); background: transparent; color: var(--muted);
  font-weight: 500; font-variant-numeric: tabular-nums; cursor: pointer; transition: background-color var(--dur-instant), color var(--dur-instant) }
.fs-step-sequencer .sq-page[aria-pressed="true"] { background: var(--bubble); color: var(--ink) }
`,
    mount(host, ctx) {
      const id = "sq" + ++uid;
      host.innerHTML = `
<div class="sq" role="group" aria-label="Step sequencer"><div class="sq-paper">
  <div class="sq-top">
    <div class="sq-tempo" role="slider" tabindex="0" aria-label="Tempo" aria-describedby="${id}-hint" aria-orientation="horizontal"
      aria-valuemin="${BPM.min}" aria-valuemax="${BPM.max}"><b aria-hidden="true"></b><span aria-hidden="true">BPM</span></div>
    <button class="sq-circle" type="button" data-d="-4" aria-label="Slower"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8"/></svg></button>
    <button class="sq-circle" type="button" data-d="4" aria-label="Faster"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8M8 4v8"/></svg></button>
    <button class="sq-circle sq-play" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"></svg></button>
  </div>
  <div class="sq-grid"></div>
  <div class="sq-pages"><span class="sq-pos" aria-hidden="true"></span>
    <button class="sq-page" type="button" data-page="0" aria-label="Steps 1 to 8">1–8</button>
    <button class="sq-page" type="button" data-page="1" aria-label="Steps 9 to 16">9–16</button>
  </div>
  <p id="${id}-hint" class="sr-only">Drag the tempo, or use the arrow keys, to set it.</p>
  <p class="sr-only" role="status" aria-live="polite"></p>
</div></div>`;
      const sig = { signal: ctx.signal };
      const root = host.querySelector(".sq"), card = host.querySelector(".sq-tempo"), play = host.querySelector(".sq-play"), grid = host.querySelector(".sq-grid");
      const pages = host.querySelector(".sq-pages"), pageBtns = [...host.querySelectorAll(".sq-page")];
      const posEl = host.querySelector(".sq-pos"), bpmEl = host.querySelector(".sq-tempo b"), live = host.querySelector("[role=status]");
      host.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => setTempo(bpm + +b.dataset.d), { signal: ctx.signal }));

      const pattern = GROOVE.map((on) => Array.from({ length: STEPS }, (_, i) => on.includes(i)));
      let bpm = BPM.initial, running = false, head = { step: -1, bar: 0 }, page = 0, wide = false, cursor = { row: 0, col: 0 }, pinned = 0;
      let cells = [], names = [], cols = [];

      /* Build the visible columns: all sixteen on a wide stage, eight per page on a narrow one. */
      function build() {
        cols = wide ? Array.from({ length: STEPS }, (_, i) => i) : Array.from({ length: PAGE }, (_, i) => page * PAGE + i);
        const template = "minmax(3.2em, 4em) repeat(" + cols.length + ", minmax(0, 1fr))";
        const focused = grid.contains(document.activeElement);
        grid.textContent = ""; cells = []; names = [];
        TRACKS.forEach((t, row) => {
          const tr = document.createElement("div");
          tr.className = "sq-track"; tr.setAttribute("role", "group"); tr.setAttribute("aria-label", t.name); tr.style.gridTemplateColumns = template;
          tr.style.setProperty("--hue", "var(" + t.hue + ")");
          const name = document.createElement("span");
          name.className = "sq-name"; name.textContent = t.name; name.setAttribute("aria-hidden", "true");
          tr.appendChild(name); names.push(name);
          cells.push(cols.map((col) => {
            const b = document.createElement("button");
            b.type = "button"; b.className = "sq-cell"; b.dataset.row = row; b.dataset.col = col;
            if (col % 4 === 0) b.dataset.beat = "";
            b.setAttribute("aria-label", t.name + ", step " + (col + 1));
            b.innerHTML = "<i></i>";
            tr.appendChild(b);
            return b;
          }));
          grid.appendChild(tr);
        });
        pages.hidden = wide;
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
        pageBtns.forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.page === page)));
      }
      function paintTop() {
        const lit = running ? head.step : -1;
        posEl.textContent = running ? "Bar " + Math.max(1, head.bar) + ", beat " + ((Math.max(0, lit) >> 2) + 1) : "Stopped";
        bpmEl.textContent = String(bpm);
        card.setAttribute("aria-valuenow", String(bpm)); card.setAttribute("aria-valuetext", bpm + " BPM");
        play.querySelector("svg").innerHTML = running ? '<rect x="3.5" y="3.5" width="9" height="9" rx="2"/>' : '<path d="M5 2.8 13 8l-8 5.2z"/>';
        play.setAttribute("aria-label", running ? "Stop" : "Play");
        play.setAttribute("aria-pressed", String(running));
      }

      /* The scheduler: queue the next steps a moment ahead on a steady clock; the lights read the same queue. */
      let schedTimer = 0, drawLoop = null, queue = [], at = 0, step = 0;
      function schedule() {
        const now = performance.now();
        if (at < now - 250) at = now + 20; // back from a hidden tab: pick the beat up from here
        while (at < now + LOOKAHEAD) { queue.push({ step, at }); step = (step + 1) % STEPS; at += 60000 / bpm / 4; }
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
      pageBtns.forEach((b) => b.addEventListener("click", () => { pin(); const p = +b.dataset.page; if (p !== page) { page = p; build(); } }, sig));
      play.addEventListener("click", () => {
        if (running) { stop(); live.textContent = "Stopped"; } else { start(); live.textContent = "Playing, " + bpm + " BPM"; }
      }, sig);

      function setTempo(next) { bpm = Math.min(BPM.max, Math.max(BPM.min, Math.round(next))); paintTop(); }
      card.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
        if (d) setTempo(bpm + d); else if (e.key === "Home") setTempo(BPM.min); else if (e.key === "End") setTempo(BPM.max); else return;
        e.preventDefault();
      }, sig);
      /* Drag the tempo: right or up is faster, a beat per 4px. */
      let drag = null;
      card.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        card.setPointerCapture(e.pointerId);
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: bpm };
      }, sig);
      card.addEventListener("pointermove", (e) => { if (drag && drag.id === e.pointerId) setTempo(drag.from + (e.clientX - drag.x - (e.clientY - drag.y)) / 4); }, sig);
      const end = (e) => { if (drag && drag.id === e.pointerId) drag = null; };
      card.addEventListener("pointerup", end, sig); card.addEventListener("pointercancel", end, sig);

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
