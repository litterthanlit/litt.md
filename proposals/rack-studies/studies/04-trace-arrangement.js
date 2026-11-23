/* 04-trace-arrangement.js — Ableton Arrangement View for an agent run: colored clip spans
   with mirrored token-density waveforms inside each clip (proposals/rack.md), plus a 1:1 scrubbable playhead. */
(function () {
  const S = ".rs-trace-arrangement";
  const TOTAL = 8.0;
  const TRACKS = [
    { name: "Router", hue: "amber", spans: [{ s: 0.0, e: 1.2, lbl: "classify_task", tok: 420, wave: [3,6,9,7,4,2] }] },
    { name: "Search", hue: "blue", spans: [
      { s: 0.9, e: 3.1, lbl: "rg + read(6)", tok: 4820, wave: [2,5,9,8,6,10,7,8,5,4,3] },
      { s: 4.9, e: 5.9, lbl: "check_refs", tok: 960, wave: [4,8,6,5,3] },
    ] },
    { name: "Coder", hue: "teal", spans: [
      { s: 2.7, e: 5.4, lbl: "patch(4 files)", tok: 9410, wave: [3,7,9,10,8,9,6,10,9,7,5,4,2] },
      { s: 6.3, e: 7.4, lbl: "fix_lint", tok: 1840, wave: [5,8,7,4,2] },
    ] },
    { name: "Tests", hue: "violet", spans: [
      { s: 5.3, e: 6.6, lbl: "verify + build", tok: 1120, wave: [4,6,8,9,7,5] },
      { s: 7.1, e: 8.0, lbl: "pass 23/23", tok: 310, wave: [3,9,6,4] },
    ] },
  ];

  RackPlayer.register({
    slug: "trace-arrangement",
    title: "Trace Arrangement View",
    category: "agent",
    tagline: "Colored execution clips with mirrored token waveforms and a 1:1 scrubbable playhead.",
    motion: "0ms 1:1 playhead scrub · zero settle · beat playback",
    css: `
${S} .ta { width: min(100%, 780px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .ta-top { display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control); font-size: 11px; font-weight: 600; }
${S} .ta-body { display: grid; grid-template-columns: 70px 1fr; border: 1px solid var(--border); border-radius: var(--r-control); overflow: hidden; background: var(--panel); }
${S} .ta-n { height: 42px; display: flex; align-items: center; padding: 0 7px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--line); font-size: 11px; font-weight: 600; background: var(--surface-2); }
${S} .ta-n:last-child { border-bottom: 0; }
${S} .ta-area { position: relative; cursor: ew-resize; user-select: none; touch-action: none;
  background: repeating-linear-gradient(90deg, transparent 0, transparent calc(12.5% - 1px), var(--line) calc(12.5% - 1px), var(--line) 12.5%); }
${S} .ta-ln { position: relative; height: 42px; border-bottom: 1px solid var(--line); }
${S} .ta-ln:last-child { border-bottom: 0; }
${S} .ta-cl {
  position: absolute; top: 4px; bottom: 4px; border: 1px solid var(--border); border-radius: var(--r-control);
  display: grid; grid-template-rows: auto 1fr; overflow: hidden;
}
${S} .ta-cl-h { padding: 1px 4px; font: 600 9px/1.2 var(--mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
${S} .ta-w { display: flex; align-items: center; gap: 1.5px; padding: 0 4px 2px; height: 100%; }
${S} .ta-w i { flex: 1; display: block; border-radius: 0; }
${S} .ta-ln[data-h="amber"] .ta-cl { background: var(--amber-tint); color: var(--amber-text); }
${S} .ta-ln[data-h="amber"] .ta-w i { background: var(--amber); }
${S} .ta-ln[data-h="blue"] .ta-cl { background: var(--blue-tint); color: var(--blue-text); }
${S} .ta-ln[data-h="blue"] .ta-w i { background: var(--blue); }
${S} .ta-ln[data-h="teal"] .ta-cl { background: var(--teal-tint); color: var(--teal-text); }
${S} .ta-ln[data-h="teal"] .ta-w i { background: var(--teal); }
${S} .ta-ln[data-h="violet"] .ta-cl { background: var(--violet-tint); color: var(--violet-text); }
${S} .ta-ln[data-h="violet"] .ta-w i { background: var(--violet); }
${S} .ta-cl.is-hit { outline: 2px solid var(--ink); outline-offset: -2px; }
${S} .ta-hd { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--ink); pointer-events: none; z-index: 5; }
${S} .ta-hd::before { content: ""; position: absolute; top: 0; left: -4px; width: 10px; height: 7px; background: var(--accent); border: 1px solid var(--ink); }
${S} .ta-foot { display: flex; justify-content: space-between; padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control); font: 500 11px/1 var(--mono); color: var(--muted); }
${S} .ta-foot b { color: var(--ink); }
${S}.is-tile .ta-n, ${S}.is-tile .ta-ln { height: 34px; }
${S}.is-tile .ta-body { grid-template-columns: 54px 1fr; }
${S}.is-tile .ta-foot { font-size: 10px; }
`,
    mount(host, ctx) {
      let t = 3.4, drag = false;
      host.innerHTML =
        '<div class="ta">' +
          '<div class="ta-top"><span>Arrangement · 4 tracks</span><span class="rk-mono" id="ta-t"></span></div>' +
          '<div class="ta-body">' +
            '<div>' + TRACKS.map((tr) => '<div class="ta-n">' + tr.name + '</div>').join("") + '</div>' +
            '<div class="ta-area" role="slider" tabindex="0" aria-label="Trace playhead" aria-valuemin="0" aria-valuemax="8">' +
              TRACKS.map((tr, ti) =>
                '<div class="ta-ln" data-h="' + tr.hue + '">' +
                  tr.spans.map((sp, si) =>
                    '<div class="ta-cl" data-ti="' + ti + '" data-si="' + si + '" style="left:' + (sp.s / TOTAL * 100) + '%;width:' + ((sp.e - sp.s) / TOTAL * 100) + '%">' +
                      '<div class="ta-cl-h">' + sp.lbl + '</div>' +
                      '<div class="ta-w">' + sp.wave.map((w) => '<i style="height:' + (w * 9) + '%"></i>').join("") + '</div>' +
                    '</div>'
                  ).join("") +
                '</div>'
              ).join("") +
              '<div class="ta-hd" id="ta-hd"></div>' +
            '</div>' +
          '</div>' +
          '<div class="ta-foot"><span id="ta-act"></span><span id="ta-tok"></span></div>' +
        '</div>';

      const area = host.querySelector(".ta-area"), hd = host.querySelector("#ta-hd");
      const tEl = host.querySelector("#ta-t"), actEl = host.querySelector("#ta-act"), tokEl = host.querySelector("#ta-tok");
      const cls = [...host.querySelectorAll(".ta-cl")];

      function draw() {
        hd.style.left = (t / TOTAL * 100).toFixed(2) + "%";
        tEl.textContent = t.toFixed(2) + "s / 8.00s";
        area.setAttribute("aria-valuenow", t.toFixed(2));
        const hits = []; let tok = 0;
        cls.forEach((c) => {
          const sp = TRACKS[+c.dataset.ti].spans[+c.dataset.si];
          const on = t >= sp.s && t <= sp.e;
          c.classList.toggle("is-hit", on);
          if (on) { hits.push(TRACKS[+c.dataset.ti].name + ":" + sp.lbl); tok += sp.tok; }
        });
        actEl.innerHTML = hits.length ? "LIVE <b>" + hits.join(" · ") + "</b>" : "IDLE";
        tokEl.innerHTML = "TOK <b>" + tok.toLocaleString() + "</b>";
      }

      const setX = (x) => { const r = area.getBoundingClientRect(); t = Math.max(0, Math.min(TOTAL, (x - r.left) / r.width * TOTAL)); draw(); };
      area.addEventListener("pointerdown", (e) => { drag = true; area.setPointerCapture(e.pointerId); setX(e.clientX); e.preventDefault(); }, { signal: ctx.signal });
      area.addEventListener("pointermove", (e) => { if (drag) setX(e.clientX); }, { signal: ctx.signal });
      area.addEventListener("pointerup", () => { drag = false; }, { signal: ctx.signal });
      area.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); t = Math.min(TOTAL, t + 0.25); draw(); }
        if (e.key === "ArrowLeft") { e.preventDefault(); t = Math.max(0, t - 0.25); draw(); }
      }, { signal: ctx.signal });

      draw();
      let auto = !ctx.reduced(); ctx.onHand(() => { auto = false; });
      ctx.onBeat(() => { if (!auto) return; t = (t + 0.25) % TOTAL; draw(); });
    },
  });
})();
