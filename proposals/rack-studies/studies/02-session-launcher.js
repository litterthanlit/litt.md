/* 02-session-launcher.js — Ableton Live Session View for parallel agent workflows:
   4 colored agent tracks × 4 scenes with clip-tinted slots, beat-quantized cueing, and Master launch. */
(function () {
  const S = ".rs-session-launcher";
  const TRACKS = [
    { name: "Plan", hue: "amber", clips: ["Scope issue", "Spec diff", "Trace bug", "Release"] },
    { name: "Build", hue: "blue", clips: ["Scaffold UI", "Wire API", "Patch lint", "Tag build"] },
    { name: "Test", hue: "teal", clips: ["Unit suite", "A11y pass", "Reflow 320", "Smoke run"] },
    { name: "Ship", hue: "violet", clips: ["Open draft", "Review PR", "Merge main", "Deploy"] },
  ];
  const SCENES = ["01 Triage", "02 Feature", "03 Fix CI", "04 Release"];

  RackPlayer.register({
    slug: "session-launcher",
    title: "Session Clip Launcher",
    category: "agent",
    tagline: "Four agent tracks and four scenes that cue and launch quantized to the next beat.",
    motion: "1/4-beat quantized launch · yellow cue outline · 0ms stop",
    css: `
${S} .sl { width: min(100%, 760px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .sl-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) 98px; gap: 4px; }
${S} .sl-th { padding: 5px 7px; border: 1px solid var(--border); border-radius: var(--r-control); font-size: 11px; font-weight: 600; display: flex; justify-content: space-between; }
${S} .sl-th[data-h="amber"] { background: var(--amber-tint); color: var(--amber-text); }
${S} .sl-th[data-h="blue"] { background: var(--blue-tint); color: var(--blue-text); }
${S} .sl-th[data-h="teal"] { background: var(--teal-tint); color: var(--teal-text); }
${S} .sl-th[data-h="violet"] { background: var(--violet-tint); color: var(--violet-text); }
${S} .sl-th.is-m { background: var(--surface-2); color: var(--muted); font: 600 10px/1 var(--mono); align-items: center; }
${S} .sl-cell {
  border: 1px solid var(--border); border-radius: var(--r-control); background: var(--block);
  padding: 7px 6px; display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 500; cursor: pointer; text-align: left; min-width: 0;
}
${S} .sl-cell span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .sl-cell[data-h="amber"] { border-left: 3px solid var(--amber); }
${S} .sl-cell[data-h="blue"] { border-left: 3px solid var(--blue); }
${S} .sl-cell[data-h="teal"] { border-left: 3px solid var(--teal); }
${S} .sl-cell[data-h="violet"] { border-left: 3px solid var(--violet); }
${S} .sl-cell.is-live { background: var(--ink); color: var(--on-ink); border-color: var(--ink); font-weight: 600; }
${S} .sl-cell.is-cued { outline: 2px solid var(--accent); outline-offset: -2px; }
${S} .sl-sc {
  border: 1px solid var(--border); border-radius: var(--r-control); background: var(--surface-2);
  padding: 7px 6px; display: flex; align-items: center; justify-content: space-between; gap: 4px;
  font: 500 10px/1 var(--mono); cursor: pointer; white-space: nowrap;
}
${S} .sl-sc.is-live { background: var(--accent); color: var(--on-accent); border-color: var(--ink); font-weight: 600; }
${S} .sl-foot { display: flex; justify-content: space-between; align-items: center; padding: 4px 6px; background: var(--surface-2); border-radius: var(--r-control); font: 500 11px/1 var(--mono); color: var(--muted); }
${S} .sl-foot b { color: var(--ink); }
${S}.is-tile .sl-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) 84px; gap: 3px; }
${S}.is-tile .sl-c3, ${S}.is-tile .sl-foot { display: none; }
${S}.is-tile .sl-cell, ${S}.is-tile .sl-sc { padding: 6px 5px; font-size: 10px; }
`,
    mount(host, ctx) {
      const active = [0, 0, 0, -1], cued = [-1, -1, -1, -1];
      let liveScene = 0;

      host.innerHTML =
        '<div class="sl">' +
          '<div class="sl-grid">' +
            TRACKS.map((t, c) => '<div class="sl-th sl-c' + c + '" data-h="' + t.hue + '"><span>' + t.name + '</span><span class="rk-mono">0' + (c + 1) + '</span></div>').join("") +
            '<div class="sl-th is-m">MASTER</div>' +
            SCENES.map((sc, r) =>
              TRACKS.map((t, c) =>
                '<button type="button" class="sl-cell sl-c' + c + '" data-h="' + t.hue + '" data-r="' + r + '" data-c="' + c + '" data-col="' + c + '"><span>▶ ' + t.clips[r] + '</span></button>'
              ).join("") +
              '<button type="button" class="sl-sc" data-sc="' + r + '" data-col="4"><span>' + sc + '</span><span>▶</span></button>'
            ).join("") +
          '</div>' +
          '<div class="sl-foot"><span id="sl-st"></span><button type="button" class="rk-btn" id="sl-stop">Stop all</button></div>' +
        '</div>';

      const cells = [...host.querySelectorAll(".sl-cell")];
      const scBtns = [...host.querySelectorAll(".sl-sc")];
      const stEl = host.querySelector("#sl-st");

      function draw() {
        cells.forEach((b) => {
          const r = +b.dataset.r, c = +b.dataset.c;
          b.classList.toggle("is-live", active[c] === r);
          b.classList.toggle("is-cued", cued[c] === r);
        });
        scBtns.forEach((b, r) => b.classList.toggle("is-live", liveScene === r));
        const n = active.filter((x) => x >= 0).length;
        stEl.innerHTML = n ? "ACTIVE <b>" + n + " / 4 TRACKS</b> · QUANTIZE 1/4" : "STOPPED";
      }

      cells.forEach((b) => b.addEventListener("click", () => {
        const r = +b.dataset.r, c = +b.dataset.c; liveScene = -1;
        if (ctx.reduced()) { active[c] = active[c] === r ? -1 : r; draw(); return; }
        cued[c] = active[c] === r ? -2 : r; draw();
      }, { signal: ctx.signal }));

      scBtns.forEach((b, r) => b.addEventListener("click", () => {
        liveScene = r;
        if (ctx.reduced()) { TRACKS.forEach((_, c) => (active[c] = r)); draw(); return; }
        TRACKS.forEach((_, c) => (cued[c] = r)); draw();
      }, { signal: ctx.signal }));

      host.querySelector("#sl-stop").addEventListener("click", () => { active.fill(-1); cued.fill(-1); liveScene = -1; draw(); }, { signal: ctx.signal });

      ctx.onBeat((step) => {
        if (step % 4 !== 0) return;
        let ch = false;
        for (let c = 0; c < 4; c++) if (cued[c] !== -1) { active[c] = cued[c] === -2 ? -1 : cued[c]; cued[c] = -1; ch = true; }
        if (ch) draw();
      });
      draw();

      let auto = !ctx.reduced(), nx = 1;
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2000, () => {
        if (!auto) return;
        liveScene = nx; for (let c = 0; c < 4; c++) cued[c] = nx; nx = (nx + 1) % 4; draw();
      });
    },
  });
})();
