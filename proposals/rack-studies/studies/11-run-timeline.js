/* 11-run-timeline.js — Ableton Arrangement View for an agent trace: colored multi-track clip spans
   with token-density bars and a 1:1 scrubbable black playhead that stops dead where you drop it. */
(function () {
  const S = ".rs-run-timeline";
  const TOTAL_S = 8.0;
  const TRACKS = [
    { name: "Router", hue: "amber", spans: [{ s: 0.0, e: 1.1, lbl: "classify_task", tok: 420 }] },
    { name: "Search", hue: "blue", spans: [{ s: 0.9, e: 3.0, lbl: "rg + read(6)", tok: 4820 }, { s: 4.9, e: 5.7, lbl: "check_refs", tok: 960 }] },
    { name: "Coder", hue: "teal", spans: [{ s: 2.8, e: 5.4, lbl: "patch(4 files)", tok: 9410 }, { s: 6.4, e: 7.4, lbl: "fix_lint", tok: 1840 }] },
    { name: "Tests", hue: "violet", spans: [{ s: 5.3, e: 6.6, lbl: "verify + build", tok: 1120 }, { s: 7.2, e: 8.0, lbl: "pass (23/23)", tok: 310 }] },
  ];

  RackPlayer.register({
    slug: "run-timeline",
    title: "Scrubbable Trace Timeline",
    category: "agent",
    tagline: "Multi-track agent execution spans with 1:1 playhead scrubbing and zero inertia.",
    motion: "0ms 1:1 playhead scrub · zero settle · beat-stepped playback",
    css: `
${S} .rt { width: min(100%, 780px); border: 1px solid var(--border); background: var(--panel); display: grid; }
${S} .rt-top { display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; border-bottom: 1px solid var(--border); background: var(--surface-2); font-size: 12px; font-weight: 600; }
${S} .rt-time { font: 600 12px/1 var(--mono); }
${S} .rt-body { position: relative; display: grid; grid-template-columns: 76px 1fr; }
${S} .rt-names { border-right: 1px solid var(--border); display: grid; }
${S} .rt-name { height: 42px; display: flex; align-items: center; padding: 0 8px; border-bottom: 1px solid var(--line); font-size: 11px; font-weight: 600; background: var(--surface-2); }
${S} .rt-name:last-child { border-bottom: 0; }
${S} .rt-area { position: relative; cursor: ew-resize; user-select: none; touch-action: none;
  background: repeating-linear-gradient(90deg, transparent 0, transparent calc(12.5% - 1px), var(--line) calc(12.5% - 1px), var(--line) 12.5%); }
${S} .rt-lane { position: relative; height: 42px; border-bottom: 1px solid var(--line); }
${S} .rt-lane:last-child { border-bottom: 0; }
${S} .rt-clip {
  position: absolute; top: 5px; bottom: 5px; border: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 6px; overflow: hidden;
  font: 500 10px/1 var(--mono); white-space: nowrap;
}
${S} .rt-lane[data-h="amber"] .rt-clip { background: var(--amber-tint); color: var(--amber-text); }
${S} .rt-lane[data-h="blue"] .rt-clip { background: var(--blue-tint); color: var(--blue-text); }
${S} .rt-lane[data-h="teal"] .rt-clip { background: var(--teal-tint); color: var(--teal-text); }
${S} .rt-lane[data-h="violet"] .rt-clip { background: var(--violet-tint); color: var(--violet-text); }
${S} .rt-clip.is-hit { outline: 2px solid var(--ink); outline-offset: -2px; font-weight: 600; }
${S} .rt-head { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--ink); pointer-events: none; z-index: 5; }
${S} .rt-head::before { content: ""; position: absolute; top: 0; left: -4px; width: 10px; height: 7px; background: var(--accent); border: 1px solid var(--ink); }
${S} .rt-foot { padding: 7px 10px; border-top: 1px solid var(--border); background: var(--surface-2); display: flex; justify-content: space-between; gap: 10px; font: 500 11px/1 var(--mono); color: var(--muted); }
${S} .rt-foot b { color: var(--ink); }
${S}.is-tile .rt-name, ${S}.is-tile .rt-lane { height: 32px; }
${S}.is-tile .rt-body { grid-template-columns: 56px 1fr; }
${S}.is-tile .rt-clip { font-size: 9px; padding: 0 4px; }
${S}.is-tile .rt-foot { font-size: 10px; padding: 5px 8px; }
`,
    mount(host, ctx) {
      let t = 3.4;
      host.innerHTML =
        '<div class="rt">' +
          '<div class="rt-top"><span>Trace arrangement · 4 tracks</span><span class="rt-time" id="rt-t"></span></div>' +
          '<div class="rt-body">' +
            '<div class="rt-names">' + TRACKS.map((tr) => '<div class="rt-name">' + tr.name + '</div>').join("") + '</div>' +
            '<div class="rt-area" role="slider" tabindex="0" aria-label="Trace playhead" aria-valuemin="0" aria-valuemax="8" aria-valuenow="3.4">' +
              TRACKS.map((tr, ti) =>
                '<div class="rt-lane" data-h="' + tr.hue + '">' +
                  tr.spans.map((sp, si) =>
                    '<div class="rt-clip" data-ti="' + ti + '" data-si="' + si + '" style="left:' + (sp.s / TOTAL_S * 100) + '%;width:' + ((sp.e - sp.s) / TOTAL_S * 100) + '%">' + sp.lbl + '</div>'
                  ).join("") +
                '</div>'
              ).join("") +
              '<div class="rt-head" id="rt-head"></div>' +
            '</div>' +
          '</div>' +
          '<div class="rt-foot"><span id="rt-active"></span><span id="rt-tok"></span></div>' +
        '</div>';

      const area = host.querySelector(".rt-area");
      const head = host.querySelector("#rt-head");
      const timeEl = host.querySelector("#rt-t");
      const actEl = host.querySelector("#rt-active");
      const tokEl = host.querySelector("#rt-tok");
      const clips = [...host.querySelectorAll(".rt-clip")];

      function draw() {
        const pct = (t / TOTAL_S) * 100;
        head.style.left = pct.toFixed(2) + "%";
        timeEl.textContent = t.toFixed(2) + "s / 8.00s";
        area.setAttribute("aria-valuenow", t.toFixed(2));
        const hits = [];
        let tok = 0;
        clips.forEach((c) => {
          const sp = TRACKS[Number(c.dataset.ti)].spans[Number(c.dataset.si)];
          const on = t >= sp.s && t <= sp.e;
          c.classList.toggle("is-hit", on);
          if (on) { hits.push(TRACKS[Number(c.dataset.ti)].name + ": " + sp.lbl); tok += sp.tok; }
        });
        actEl.innerHTML = hits.length ? "ACTIVE <b>" + hits.join(" · ") + "</b>" : "IDLE";
        tokEl.innerHTML = "SPAN TOK <b>" + tok.toLocaleString() + "</b>";
      }

      let dragging = false;
      const setFromClient = (x) => {
        const r = area.getBoundingClientRect();
        t = Math.max(0, Math.min(TOTAL_S, ((x - r.left) / r.width) * TOTAL_S));
        draw();
      };
      area.addEventListener("pointerdown", (e) => {
        dragging = true; area.setPointerCapture(e.pointerId); setFromClient(e.clientX); e.preventDefault();
      }, { signal: ctx.signal });
      area.addEventListener("pointermove", (e) => { if (dragging) setFromClient(e.clientX); }, { signal: ctx.signal });
      const end = () => { dragging = false; };
      area.addEventListener("pointerup", end, { signal: ctx.signal });
      area.addEventListener("pointercancel", end, { signal: ctx.signal });
      area.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); t = Math.min(TOTAL_S, t + 0.25); draw(); }
        if (e.key === "ArrowLeft") { e.preventDefault(); t = Math.max(0, t - 0.25); draw(); }
      }, { signal: ctx.signal });

      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      ctx.onBeat(() => {
        if (!auto) return;
        t = (t + 0.25) % TOTAL_S;
        draw();
      });
    },
  });
})();
