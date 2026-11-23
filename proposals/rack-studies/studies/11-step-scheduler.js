/* 11-step-scheduler.js — Beat-Locked Job Sequencer:
   4 clip-colored agent job lanes (Fetch, Lint, Test, Deploy) x 16 steps on the 120 BPM clock,
   with click-drag step painting, Mute/Solo keys, and a yellow Play/Stop transport key. */
(function () {
  const S = ".rs-step-scheduler";
  const LANES = [
    { name: "Fetch", hue: "blue", steps: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0] },
    { name: "Lint", hue: "teal", steps: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1] },
    { name: "Test", hue: "violet", steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,0] },
    { name: "Deploy", hue: "amber", steps: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1] },
  ];

  RackPlayer.register({
    slug: "step-scheduler",
    title: "Beat-Locked Job Sequencer",
    category: "control",
    tagline: "4 job lanes across 16 steps on the 120 BPM clock with click-drag paint and Mute/Solo.",
    motion: "125ms quantized step · 0ms paint",
    css: `
${S} .sq { width: min(100%, 740px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .sq-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control); }
${S} .sq-tr { display: flex; align-items: center; gap: 6px; }
${S} .sq-pos { font: 600 11px/1 var(--mono); padding: 4px 7px; background: var(--cut); border: 1px solid var(--border); border-radius: var(--r-control); }
${S} .sq-grid { display: grid; gap: 4px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control); padding: 7px; }
${S} .sq-row { display: grid; grid-template-columns: 62px 44px repeat(16, 1fr); gap: 3px; align-items: center; }
${S} .sq-name { font: 600 10px/1 var(--mono); padding: 5px 5px; border: 1px solid var(--border); border-radius: var(--r-control); }
${S} .sq-name[data-h="blue"] { background: var(--blue-tint); color: var(--blue-text); }
${S} .sq-name[data-h="teal"] { background: var(--teal-tint); color: var(--teal-text); }
${S} .sq-name[data-h="violet"] { background: var(--violet-tint); color: var(--violet-text); }
${S} .sq-name[data-h="amber"] { background: var(--amber-tint); color: var(--amber-text); }
${S} .sq-ms { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
${S} .sq-ms button {
  height: 22px; padding: 0; border: 1px solid var(--border); border-radius: var(--r-control);
  background: var(--block); font: 600 9px/1 var(--mono); cursor: pointer;
}
${S} .sq-ms button.is-m { background: var(--ink); color: var(--on-ink); }
${S} .sq-ms button.is-s { background: var(--accent); color: var(--on-accent); border-color: var(--ink); }
${S} .sq-pad {
  height: 26px; border: 1px solid var(--line-strong); border-radius: 2px; background: var(--cut);
  padding: 0; cursor: pointer;
}
${S} .sq-pad.is-bar { background: var(--surface-2); }
${S} .sq-pad[data-h="blue"].is-on { background: var(--blue); border-color: var(--ink); }
${S} .sq-pad[data-h="teal"].is-on { background: var(--teal); border-color: var(--ink); }
${S} .sq-pad[data-h="violet"].is-on { background: var(--violet); border-color: var(--ink); }
${S} .sq-pad[data-h="amber"].is-on { background: var(--amber); border-color: var(--ink); }
${S} .sq-row.is-muted .sq-pad.is-on { opacity: 0.25; }
${S} .sq-pad.is-now { outline: 2px solid var(--accent); outline-offset: -2px; }
${S} .sq-pad.is-now.is-on { background: var(--accent); border-color: var(--ink); }
${S}.is-tile .sq-row { grid-template-columns: 52px 34px repeat(16, 1fr); gap: 2px; }
${S}.is-tile .sq-pad { height: 20px; }
${S}.is-tile .sq-ms button { height: 18px; font-size: 8px; }
${S}.is-tile .sq-name { font-size: 9px; padding: 3px 4px; }
${S}.is-tile .sq-top .rk-btn { height: 22px; padding: 0 7px; font-size: 11px; }
`,
    mount(host, ctx) {
      const grid = LANES.map((l) => [...l.steps]);
      const muted = LANES.map(() => false);
      const solo = LANES.map(() => false);
      let playing = !ctx.reduced();
      let head = 0;
      let paintVal = null;

      host.innerHTML =
        '<div class="sq">' +
          '<div class="sq-top">' +
            '<div class="sq-tr">' +
              '<button type="button" class="rk-btn is-accent" id="sq-play">Play</button>' +
              '<span class="sq-pos" id="sq-pos">1.1</span>' +
            '</div>' +
            '<span class="rk-mono" style="font-size:10px;color:var(--muted)" id="sq-fired">READY</span>' +
          '</div>' +
          '<div class="sq-grid" data-col>' +
            LANES.map((l, r) =>
              '<div class="sq-row" data-r="' + r + '">' +
                '<div class="sq-name" data-h="' + l.hue + '">' + l.name + '</div>' +
                '<div class="sq-ms">' +
                  '<button type="button" data-act="m" data-r="' + r + '" aria-label="Mute ' + l.name + '">M</button>' +
                  '<button type="button" data-act="s" data-r="' + r + '" aria-label="Solo ' + l.name + '">S</button>' +
                '</div>' +
                l.steps.map((_, c) =>
                  '<button type="button" class="sq-pad' + (c % 4 === 0 ? ' is-bar' : '') + '" data-h="' + l.hue + '" data-r="' + r + '" data-c="' + c + '" aria-label="' + l.name + ' step ' + (c + 1) + '"></button>'
                ).join("") +
              '</div>'
            ).join("") +
          '</div>' +
        '</div>';

      const playBtn = host.querySelector("#sq-play");
      const posEl = host.querySelector("#sq-pos");
      const firedEl = host.querySelector("#sq-fired");
      const rows = [...host.querySelectorAll(".sq-row")];
      const pads = [...host.querySelectorAll(".sq-pad")];
      const msBtns = [...host.querySelectorAll(".sq-ms button")];

      function laneActive(r) {
        const anySolo = solo.some(Boolean);
        return anySolo ? solo[r] : !muted[r];
      }

      function draw() {
        playBtn.textContent = playing ? "Stop" : "Play";
        playBtn.classList.toggle("is-accent", playing);
        posEl.textContent = (Math.floor(head / 4) + 1) + "." + ((head % 4) + 1);
        rows.forEach((row, r) => row.classList.toggle("is-muted", !laneActive(r)));
        msBtns.forEach((b) => {
          const r = +b.dataset.r;
          b.classList.toggle("is-m", b.dataset.act === "m" && muted[r]);
          b.classList.toggle("is-s", b.dataset.act === "s" && solo[r]);
        });
        const fired = [];
        pads.forEach((p) => {
          const r = +p.dataset.r, c = +p.dataset.c, on = !!grid[r][c];
          p.classList.toggle("is-on", on);
          p.classList.toggle("is-now", c === head);
          if (c === head && on && laneActive(r)) fired.push(LANES[r].name.toUpperCase());
        });
        firedEl.textContent = fired.length ? "RUN " + fired.join(" + ") : "IDLE";
      }

      playBtn.addEventListener("click", () => { playing = !playing; draw(); }, { signal: ctx.signal });
      msBtns.forEach((b) => b.addEventListener("click", () => {
        const r = +b.dataset.r;
        if (b.dataset.act === "m") muted[r] = !muted[r];
        else solo[r] = !solo[r];
        draw();
      }, { signal: ctx.signal }));

      pads.forEach((p) => {
        p.addEventListener("pointerdown", (e) => {
          const r = +p.dataset.r, c = +p.dataset.c;
          paintVal = grid[r][c] ? 0 : 1;
          grid[r][c] = paintVal;
          draw();
          e.preventDefault();
        }, { signal: ctx.signal });
        p.addEventListener("pointerenter", () => {
          if (paintVal === null) return;
          grid[+p.dataset.r][+p.dataset.c] = paintVal;
          draw();
        }, { signal: ctx.signal });
      });
      window.addEventListener("pointerup", () => { paintVal = null; }, { signal: ctx.signal });

      draw();
      ctx.onBeat((s) => {
        if (!playing) return;
        head = s % 16;
        draw();
      });
    },
  });
})();
