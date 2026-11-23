/* 07-session-launcher.js — Ableton Live Session View for multi-agent workflows:
   4 colored agent tracks × 4 scenes + Master scene launch column. Clips cue and launch quantized to the beat. */
(function () {
  const S = ".rs-session-launcher";
  const TRACKS = [
    { name: "Plan", hue: "amber", clips: ["Scope issue", "Spec diff", "Trace bug", "Release plan"] },
    { name: "Build", hue: "blue", clips: ["Scaffold UI", "Wire API", "Patch lint", "Tag build"] },
    { name: "Test", hue: "teal", clips: ["Unit suite", "A11y pass", "Reflow 320", "Smoke run"] },
    { name: "Ship", hue: "violet", clips: ["Open draft", "Review PR", "Merge main", "Deploy prod"] },
  ];
  const SCENES = ["01 Triage", "02 Feature", "03 Fix CI", "04 Release"];

  RackPlayer.register({
    slug: "session-launcher",
    title: "Agent Session Launcher",
    category: "agent",
    tagline: "Four agent tracks and four scenes that cue and launch quantized to the next beat.",
    motion: "beat-quantized launch · 36ms column sweep · instant stop",
    css: `
${S} .sl { width: min(100%, 780px); border: 1px solid var(--border); background: var(--panel); display: grid; }
${S} .sl-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) 112px; }
${S} .sl-th { padding: 7px 8px; border-right: 1px solid var(--line-strong); border-bottom: 1px solid var(--border); font-size: 11px; font-weight: 600; display: flex; justify-content: space-between; }
${S} .sl-th:last-child { border-right: 0; background: var(--surface-2); color: var(--muted); font-family: var(--mono); font-size: 10px; align-items: center; }
${S} .sl-th[data-h="amber"] { background: var(--amber-tint); color: var(--amber-text); }
${S} .sl-th[data-h="blue"] { background: var(--blue-tint); color: var(--blue-text); }
${S} .sl-th[data-h="teal"] { background: var(--teal-tint); color: var(--teal-text); }
${S} .sl-th[data-h="violet"] { background: var(--violet-tint); color: var(--violet-text); }
${S} .sl-cell {
  border: 0; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line);
  background: var(--block); padding: 9px 8px; display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 500; cursor: pointer; text-align: left; min-width: 0;
}
${S} .sl-cell:hover { background: var(--block-hover); }
${S} .sl-cell span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .sl-play { width: 14px; height: 14px; flex: none; border: 1px solid var(--border-soft); display: grid; place-items: center; font-size: 8px; }
${S} .sl-cell.is-live { background: var(--ink); color: var(--on-ink); font-weight: 600; }
${S} .sl-cell.is-live .sl-play { background: var(--accent); color: var(--on-accent); border-color: var(--ink); }
${S} .sl-cell.is-cued { outline: 2px solid var(--accent); outline-offset: -2px; }
${S} .sl-scene {
  border: 0; border-bottom: 1px solid var(--line); background: var(--surface-2);
  padding: 9px 8px; display: flex; align-items: center; justify-content: space-between; gap: 4px;
  font: 500 11px/1 var(--mono); cursor: pointer; color: var(--ink); white-space: nowrap;
}
${S} .sl-scene:hover { background: var(--surface-3); }
${S} .sl-scene.is-live { background: var(--accent); color: var(--on-accent); font-weight: 600; }
${S} .sl-foot { padding: 7px 10px; border-top: 1px solid var(--border); background: var(--surface-2); display: flex; justify-content: space-between; align-items: center; font: 500 11px/1 var(--mono); color: var(--muted); }
${S} .sl-foot b { color: var(--ink); }
${S}.is-tile .sl-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) 86px; }
${S}.is-tile .sl-col-3 { display: none; }
${S}.is-tile .sl-cell, ${S}.is-tile .sl-scene { padding: 7px 6px; font-size: 10px; }
${S}.is-tile .sl-foot { display: none; }
`,
    mount(host, ctx) {
      const active = [0, 0, 0, -1];
      const cued = [-1, -1, -1, -1];
      let liveScene = 0;

      host.innerHTML =
        '<div class="sl">' +
          '<div class="sl-grid">' +
            TRACKS.map((t, c) => '<div class="sl-th sl-col-' + c + '" data-h="' + t.hue + '"><span>' + t.name + '</span><span class="rk-mono">0' + (c + 1) + '</span></div>').join("") +
            '<div class="sl-th">MASTER</div>' +
            SCENES.map((sc, r) =>
              TRACKS.map((t, c) =>
                '<button type="button" class="sl-cell sl-col-' + c + '" data-r="' + r + '" data-c="' + c + '" data-col="' + c + '">' +
                  '<i class="sl-play" aria-hidden="true">▶</i><span>' + t.clips[r] + '</span>' +
                '</button>'
              ).join("") +
              '<button type="button" class="sl-scene" data-sc="' + r + '" data-col="4"><span>' + sc + '</span><span>▶</span></button>'
            ).join("") +
          '</div>' +
          '<div class="sl-foot"><span id="sl-status"></span><button type="button" class="rk-btn" id="sl-stop">Stop all</button></div>' +
        '</div>';

      const cells = [...host.querySelectorAll(".sl-cell")];
      const sceneBtns = [...host.querySelectorAll(".sl-scene")];
      const status = host.querySelector("#sl-status");

      function draw() {
        cells.forEach((b) => {
          const r = Number(b.dataset.r), c = Number(b.dataset.c);
          b.classList.toggle("is-live", active[c] === r);
          b.classList.toggle("is-cued", cued[c] === r);
        });
        sceneBtns.forEach((b, r) => b.classList.toggle("is-live", liveScene === r));
        const running = active.filter((x) => x >= 0).length;
        status.innerHTML = running ? "RUNNING <b>" + running + " / 4 TRACKS</b> · QUANTIZE 1/4 BEAT" : "STOPPED · CLICK ANY CLIP OR MASTER SCENE";
      }

      cells.forEach((b) => b.addEventListener("click", () => {
        const r = Number(b.dataset.r), c = Number(b.dataset.c);
        liveScene = -1;
        if (ctx.reduced()) { active[c] = active[c] === r ? -1 : r; draw(); return; }
        cued[c] = active[c] === r ? -2 : r;
        draw();
      }, { signal: ctx.signal }));

      sceneBtns.forEach((b, r) => b.addEventListener("click", () => {
        liveScene = r;
        if (ctx.reduced()) { TRACKS.forEach((_, c) => (active[c] = r)); draw(); return; }
        TRACKS.forEach((_, c) => (cued[c] = r));
        draw();
      }, { signal: ctx.signal }));

      host.querySelector("#sl-stop").addEventListener("click", () => {
        active.fill(-1); cued.fill(-1); liveScene = -1; draw();
      }, { signal: ctx.signal });

      ctx.onBeat((step) => {
        if (step % 4 !== 0) return;
        let changed = false;
        for (let c = 0; c < 4; c++) {
          if (cued[c] !== -1) {
            active[c] = cued[c] === -2 ? -1 : cued[c];
            cued[c] = -1;
            changed = true;
          }
        }
        if (changed) draw();
      });

      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      let nextScene = 1;
      if (auto) {
        ctx.every(2000, () => {
          if (!auto) return;
          liveScene = nextScene;
          TRACKS.forEach((_, c) => (cued[c] = nextScene));
          nextScene = (nextScene + 1) % SCENES.length;
          draw();
        });
      }
    },
  });
})();
