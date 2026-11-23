/* 10-step-router.js — Beat-locked 4×16 agent/tool step sequencer.
   Four vivid clip-colored lanes, marching quantized playhead, click-drag paint, and Rack yellow Play toggle. */
(function () {
  const S = ".rs-step-router";
  const LANES = [
    { name: "Fetch", hue: "blue", pat: "1000100010001000" },
    { name: "Parse", hue: "amber", pat: "0010001000100010" },
    { name: "Verify", hue: "teal", pat: "0000100000001010" },
    { name: "Ship", hue: "violet", pat: "0000000000000001" },
  ];

  RackPlayer.register({
    slug: "step-router",
    title: "Beat-Locked Sequencer",
    category: "control",
    tagline: "Four colored job lanes stepped strictly on the beat with click-drag cell painting.",
    motion: "125ms quantized step · 0ms cell toggle · zero decay",
    css: `
${S} .sr { width: min(100%, 760px); border: 1px solid var(--border); background: var(--panel); display: grid; }
${S} .sr-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--border); background: var(--surface-2); }
${S} .sr-meta { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; }
${S} .sr-step-num { font: 600 12px/1 var(--mono); padding: 4px 8px; border: 1px solid var(--border); background: var(--cut); }
${S} .sr-body { padding: 10px; display: grid; gap: 6px; }
${S} .sr-ruler { display: grid; grid-template-columns: 62px repeat(16, 1fr); gap: 3px; font: 500 9px/1 var(--mono); color: var(--subtle); text-align: center; }
${S} .sr-lane { display: grid; grid-template-columns: 62px repeat(16, 1fr); gap: 3px; align-items: center; }
${S} .sr-lname { font-size: 11px; font-weight: 600; padding-right: 4px; }
${S} .sr-cell {
  aspect-ratio: 1; border: 1px solid var(--line-strong); background: var(--cut);
  padding: 0; cursor: pointer;
}
${S} .sr-cell.is-beat4 { background: var(--surface-2); }
${S} .sr-lane[data-h="blue"] .sr-cell.is-on { background: var(--blue); border-color: var(--ink); }
${S} .sr-lane[data-h="amber"] .sr-cell.is-on { background: var(--amber); border-color: var(--ink); }
${S} .sr-lane[data-h="teal"] .sr-cell.is-on { background: var(--teal); border-color: var(--ink); }
${S} .sr-lane[data-h="violet"] .sr-cell.is-on { background: var(--violet); border-color: var(--ink); }
${S} .sr-cell.is-head { outline: 2px solid var(--ink); outline-offset: -2px; }
${S} .sr-cell.is-on.is-head { background: var(--accent) !important; border-color: var(--ink); }
${S}.is-tile .sr-ruler { display: none; }
${S}.is-tile .sr-body { padding: 8px; gap: 4px; }
${S}.is-tile .sr-lane { grid-template-columns: 44px repeat(16, 1fr); gap: 2px; }
${S}.is-tile .sr-lname { font-size: 10px; }
${S}.is-tile .sr-top { padding: 5px 8px; }
${S}.is-tile .rk-btn { height: 22px; padding: 0 7px; font-size: 10px; }
`,
    mount(host, ctx) {
      const grid = LANES.map((l) => [...l.pat].map((c) => c === "1"));
      let playing = !ctx.reduced();
      let head = 0;

      host.innerHTML =
        '<div class="sr">' +
          '<div class="sr-top">' +
            '<div class="sr-meta"><span>Job scheduler</span><span class="sr-step-num" id="sr-pos">01 / 16</span></div>' +
            '<div style="display:flex;gap:6px">' +
              '<button type="button" class="rk-btn" id="sr-clear">Clear</button>' +
              '<button type="button" class="rk-btn is-accent" id="sr-play"></button>' +
            '</div>' +
          '</div>' +
          '<div class="sr-body">' +
            '<div class="sr-ruler"><span></span>' + Array.from({ length: 16 }, (_, i) => '<span>' + (i % 4 === 0 ? (i / 4 + 1) : "·") + '</span>').join("") + '</div>' +
            LANES.map((l, r) =>
              '<div class="sr-lane" data-h="' + l.hue + '" data-r="' + r + '">' +
                '<span class="sr-lname">' + l.name + '</span>' +
                Array.from({ length: 16 }, (_, c) =>
                  '<button type="button" class="sr-cell' + (c % 4 === 0 ? ' is-beat4' : '') + '" data-r="' + r + '" data-c="' + c + '" aria-label="' + l.name + ' step ' + (c + 1) + '"></button>'
                ).join("") +
              '</div>'
            ).join("") +
          '</div>' +
        '</div>';

      const cells = [...host.querySelectorAll(".sr-cell")];
      const playBtn = host.querySelector("#sr-play");
      const posEl = host.querySelector("#sr-pos");
      let paintVal = null;

      function draw() {
        cells.forEach((b) => {
          const r = Number(b.dataset.r), c = Number(b.dataset.c);
          b.classList.toggle("is-on", grid[r][c]);
          b.classList.toggle("is-head", c === head);
          b.setAttribute("aria-pressed", String(grid[r][c]));
        });
        playBtn.textContent = playing ? "Stop" : "Run";
        playBtn.classList.toggle("is-accent", playing);
        posEl.textContent = String(head + 1).padStart(2, "0") + " / 16";
      }

      cells.forEach((b) => {
        b.addEventListener("pointerdown", (e) => {
          const r = Number(b.dataset.r), c = Number(b.dataset.c);
          paintVal = !grid[r][c];
          grid[r][c] = paintVal;
          draw();
          e.preventDefault();
        }, { signal: ctx.signal });
        b.addEventListener("pointerenter", () => {
          if (paintVal === null) return;
          grid[Number(b.dataset.r)][Number(b.dataset.c)] = paintVal;
          draw();
        }, { signal: ctx.signal });
      });
      window.addEventListener("pointerup", () => { paintVal = null; }, { signal: ctx.signal });

      playBtn.addEventListener("click", () => { playing = !playing; draw(); }, { signal: ctx.signal });
      host.querySelector("#sr-clear").addEventListener("click", () => {
        grid.forEach((row) => row.fill(false));
        draw();
      }, { signal: ctx.signal });

      ctx.onBeat(() => {
        if (!playing) return;
        head = (head + 1) % 16;
        draw();
      });

      draw();
    },
  });
})();
