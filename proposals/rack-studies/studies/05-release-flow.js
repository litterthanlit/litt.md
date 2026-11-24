/* 05-release-flow.js — Release Flow:
   Clean three-stage staircase (Create -> Check -> Launch) crossed by a scrubbable playhead line. */
(function () {
  const S = ".rs-release-flow";
  const STAGES = [
    { name: "Create", hue: "blue", start: 0.0, end: 0.42 },
    { name: "Check", hue: "green", start: 0.40, end: 0.72 },
    { name: "Launch", hue: "orange", start: 0.70, end: 1.0 },
  ];

  RackPlayer.register({
    slug: "release-flow",
    title: "Release Flow",
    tagline: "Watch a release cross its three stages, or scrub the playhead anywhere.",
    css: `
${S} .rf-surf { position: relative; height: 126px; display: grid; gap: 8px; align-content: center; cursor: ew-resize; user-select: none; touch-action: none; }
${S} .rf-row { position: relative; height: 28px; }
${S} .rf-st { position: absolute; top: 0; bottom: 0; padding: 0 9px; display: flex; align-items: center; font-size: 11px; }
${S} .rf-st.is-wait { opacity: 0.42; }
${S} .rf-head { position: absolute; top: 6px; bottom: 6px; width: 1.5px; background: var(--ink); pointer-events: none; }
${S}.is-tile .rf-surf { height: 112px; }
`,
    mount(host, ctx) {
      let pos = 0.56, playing = !ctx.reduced(), dragging = false;

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><b>Release</b><span class="rk-box" style="margin-left:auto" id="rf-pct">56%</span><button type="button" class="rk-key is-on" id="rf-btn">Pause</button></div>' +
          '<div class="rk-surf rf-surf" id="rf-surf">' +
            STAGES.map((st, i) =>
              '<div class="rf-row"><div class="ly rf-st" data-i="' + i + '" data-h="' + st.hue + '" style="left:' + (st.start * 100) + '%;width:' + ((st.end - st.start) * 100) + '%">' + st.name + '</div></div>'
            ).join("") +
            '<i class="rf-head" id="rf-head"></i>' +
          '</div>' +
        '</div>';

      const surf = host.querySelector("#rf-surf");
      const head = host.querySelector("#rf-head");
      const pctEl = host.querySelector("#rf-pct");
      const btn = host.querySelector("#rf-btn");
      const els = [...host.querySelectorAll(".rf-st")];

      function draw() {
        const p = Math.max(0, Math.min(1, pos));
        head.style.left = "calc(10px + (100% - 20px) * " + p.toFixed(4) + ")";
        pctEl.textContent = p >= 0.99 ? "Live" : Math.round(p * 100) + "%";
        btn.classList.toggle("is-on", playing);
        btn.textContent = playing ? "Pause" : p >= 0.99 ? "Replay" : "Run";
        STAGES.forEach((st, i) => {
          els[i].classList.toggle("is-wait", p < st.start);
          els[i].classList.toggle("is-sel", p >= st.start && p <= st.end);
        });
      }

      const scrub = (e) => {
        const r = surf.getBoundingClientRect();
        pos = Math.max(0, Math.min(1, (e.clientX - r.left - 10) / Math.max(1, r.width - 20)));
        draw();
      };
      surf.addEventListener("pointerdown", (e) => { playing = false; dragging = true; surf.setPointerCapture(e.pointerId); scrub(e); }, { signal: ctx.signal });
      surf.addEventListener("pointermove", (e) => { if (dragging) scrub(e); }, { signal: ctx.signal });
      surf.addEventListener("pointerup", () => { dragging = false; }, { signal: ctx.signal });
      btn.addEventListener("click", () => { if (pos >= 0.99) pos = 0; playing = !playing; draw(); }, { signal: ctx.signal });
      draw();

      ctx.loop((dt) => {
        if (!playing) return;
        pos = (pos + dt * 0.14) % 1.05;
        if (pos > 1) pos = 0;
        draw();
      });
    },
  });
})();
