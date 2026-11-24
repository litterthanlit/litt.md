/* 03-effort-balance.js — Effort Balance:
   Three tall coloured layer blocks you drag 1:1 vertically (Shift fine, double-click home) — zero fake sliders. */
(function () {
  const S = ".rs-effort-balance";
  const LANES = [
    { name: "Depth", hue: "purple", def: 68, v: 68 },
    { name: "Speed", hue: "orange", def: 44, v: 44 },
    { name: "Care", hue: "green", def: 82, v: 82 },
  ];

  RackPlayer.register({
    slug: "effort-balance",
    title: "Effort Balance",
    tagline: "Drag straight up or down on any block — Shift for fine, double-click to reset.",
    css: `
${S} .eb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
${S} .eb-lane {
  position: relative; height: 126px; padding: 9px; cursor: ns-resize; user-select: none; touch-action: none;
  display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;
}
${S} .eb-fill { position: absolute; left: 0; right: 0; bottom: 0; opacity: 0.28; pointer-events: none; }
${S} .eb-line { position: absolute; left: 0; right: 0; height: 2px; pointer-events: none; }
${S} .eb-name { position: relative; font-size: 11px; font-weight: 600; }
${S} .eb-val { position: relative; font: 600 18px/1 var(--mono); letter-spacing: -0.02em; }
${S} .eb-lane.is-drag { outline: 2px solid var(--ink); outline-offset: -2px; }
${S}.is-tile .eb-lane { height: 112px; padding: 8px; }
${S}.is-tile .eb-val { font-size: 16px; }
`,
    mount(host, ctx) {
      const state = LANES.map((l) => ({ ...l }));

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><b>Effort</b><button type="button" class="rk-key" style="margin-left:auto" id="eb-rst">Reset</button></div>' +
          '<div class="rk-surf"><div class="eb-grid">' +
            state.map((l, i) =>
              '<div class="ly eb-lane" tabindex="0" role="slider" aria-label="' + l.name + '" aria-valuemin="0" aria-valuemax="100" data-i="' + i + '" data-h="' + l.hue + '">' +
                '<i class="eb-fill" style="background:var(--clip-' + l.hue + ')"></i>' +
                '<i class="eb-line" style="background:var(--clip-' + l.hue + ')"></i>' +
                '<span class="eb-name">' + l.name + '</span>' +
                '<span class="eb-val"></span>' +
              '</div>'
            ).join("") +
          '</div></div>' +
        '</div>';

      const els = [...host.querySelectorAll(".eb-lane")];
      function draw() {
        state.forEach((l, i) => {
          const h = (l.v * 0.74).toFixed(1) + "%";
          els[i].querySelector(".eb-fill").style.height = h;
          els[i].querySelector(".eb-line").style.bottom = h;
          els[i].querySelector(".eb-val").textContent = l.v + "%";
          els[i].setAttribute("aria-valuenow", String(l.v));
        });
      }

      els.forEach((el, i) => ctx.bindDrag(el, {
        min: 5, max: 95, step: 1, def: state[i].def,
        get: () => state[i].v, set: (v) => { state[i].v = v; draw(); }, signal: ctx.signal,
      }));
      host.querySelector("#eb-rst").addEventListener("click", () => { state.forEach((l) => { l.v = l.def; }); draw(); }, { signal: ctx.signal });
      draw();

      let ghost = !ctx.reduced(), t = 0;
      ctx.onHand(() => { ghost = false; });
      ctx.loop((dt) => {
        if (!ghost) return;
        t += dt;
        state[0].v = Math.round(62 + Math.sin(t * 0.9) * 16);
        state[1].v = Math.round(44 + Math.cos(t * 0.7) * 18);
        state[2].v = Math.round(76 + Math.sin(t * 0.6 + 1.4) * 12);
        draw();
      });
    },
  });
})();
