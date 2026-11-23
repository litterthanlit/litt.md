/* 15-meter-bridge.js — Worker Meter Bridge:
   8 vertical segmented throughput meters (W1..W8) with held peak indicators marching on the 120 BPM beat,
   per-worker yellow power keys, and a dense telemetry header strip. */
(function () {
  const S = ".rs-meter-bridge";
  const WORKERS = [
    { id: "W1", role: "Plan", hue: "amber", base: 7 },
    { id: "W2", role: "Scan", hue: "blue", base: 9 },
    { id: "W3", role: "Code", hue: "teal", base: 10 },
    { id: "W4", role: "Code", hue: "teal", base: 8 },
    { id: "W5", role: "Test", hue: "violet", base: 9 },
    { id: "W6", role: "Lint", hue: "green", base: 6 },
    { id: "W7", role: "Diff", hue: "blue", base: 7 },
    { id: "W8", role: "Gate", hue: "amber", base: 5 },
  ];
  const SEGS = 12;

  RackPlayer.register({
    slug: "meter-bridge",
    title: "Worker Meter Bridge",
    category: "data",
    tagline: "8 segmented throughput meters with held peak bars on the beat and per-worker power keys.",
    motion: "125ms meter step · held peak decay",
    css: `
${S} .mb { width: min(100%, 700px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .mb-top {
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px;
  padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control);
  font: 600 11px/1 var(--mono);
}
${S} .mb-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px; }
${S} .mb-ch {
  background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control);
  padding: 6px 5px; display: grid; gap: 5px; justify-items: center;
}
${S} .mb-role { font: 600 9px/1 var(--mono); color: var(--muted); text-transform: uppercase; }
${S} .mb-well {
  width: 100%; background: var(--cut); border: 1px solid var(--border); border-radius: 2px;
  padding: 3px; display: grid; gap: 2px;
}
${S} .mb-seg { height: 7px; background: var(--surface-2); border-radius: 1px; }
${S} .mb-seg.is-on[data-h="amber"] { background: var(--amber); }
${S} .mb-seg.is-on[data-h="blue"] { background: var(--blue); }
${S} .mb-seg.is-on[data-h="teal"] { background: var(--teal); }
${S} .mb-seg.is-on[data-h="violet"] { background: var(--violet); }
${S} .mb-seg.is-on[data-h="green"] { background: var(--green); }
${S} .mb-seg.is-hot { background: var(--accent); }
${S} .mb-seg.is-peak { background: var(--ink); }
${S} .mb-pwr {
  width: 100%; height: 22px; border: 1px solid var(--border); border-radius: var(--r-control);
  background: var(--block); font: 600 10px/1 var(--mono); cursor: pointer;
}
${S} .mb-pwr.is-on { background: var(--accent); color: var(--on-accent); border-color: var(--ink); }
${S} .mb-ch.is-off { opacity: 0.45; }
${S}.is-tile .mb-ch { padding: 4px 3px; gap: 3px; }
${S}.is-tile .mb-seg { height: 5px; }
${S}.is-tile .mb-pwr { height: 18px; font-size: 9px; }
${S}.is-tile .mb-role { font-size: 8px; }
`,
    mount(host, ctx) {
      const on = WORKERS.map(() => true);
      const lvl = WORKERS.map((w) => w.base);
      const peak = WORKERS.map((w) => Math.min(SEGS, w.base + 2));

      host.innerHTML =
        '<div class="mb">' +
          '<div class="mb-top">' +
            '<span>WORKER BRIDGE · 8 CH</span>' +
            '<span id="mb-tel">412 RUNS · 64 TOOLS · 94.2% PASS</span>' +
          '</div>' +
          '<div class="mb-grid">' +
            WORKERS.map((w, i) =>
              '<div class="mb-ch" data-col data-i="' + i + '">' +
                '<span class="mb-role">' + w.role + '</span>' +
                '<div class="mb-well">' +
                  Array.from({ length: SEGS }, (_, s) => {
                    const idx = SEGS - 1 - s;
                    return '<i class="mb-seg" data-h="' + w.hue + '" data-s="' + idx + '"></i>';
                  }).join("") +
                '</div>' +
                '<button type="button" class="mb-pwr is-on" data-i="' + i + '" aria-pressed="true">' + w.id + '</button>' +
              '</div>'
            ).join("") +
          '</div>' +
        '</div>';

      const chEls = [...host.querySelectorAll(".mb-ch")];
      const telEl = host.querySelector("#mb-tel");

      function draw() {
        let active = 0, load = 0;
        chEls.forEach((ch, i) => {
          const isOn = on[i];
          if (isOn) { active++; load += lvl[i]; }
          ch.classList.toggle("is-off", !isOn);
          const btn = ch.querySelector(".mb-pwr");
          btn.classList.toggle("is-on", isOn);
          btn.setAttribute("aria-pressed", String(isOn));
          ch.querySelectorAll(".mb-seg").forEach((seg) => {
            const s = +seg.dataset.s;
            const lit = isOn && s < lvl[i];
            const isPk = isOn && s === peak[i] - 1 && peak[i] > lvl[i];
            seg.classList.toggle("is-on", lit && s < SEGS - 2);
            seg.classList.toggle("is-hot", lit && s >= SEGS - 2);
            seg.classList.toggle("is-peak", isPk);
          });
        });
        const tok = Math.round(load * 48);
        telEl.textContent = active + "/8 LIVE · " + tok + " TOK/S · 94.2% PASS";
      }

      host.querySelectorAll(".mb-pwr").forEach((b) => b.addEventListener("click", () => {
        const i = +b.dataset.i;
        on[i] = !on[i];
        if (!on[i]) { lvl[i] = 0; peak[i] = 0; }
        else { lvl[i] = WORKERS[i].base; peak[i] = lvl[i] + 1; }
        draw();
      }, { signal: ctx.signal }));

      draw();

      ctx.onBeat((step) => {
        WORKERS.forEach((w, i) => {
          if (!on[i]) return;
          const wave = Math.round(Math.sin(step * 0.7 + i * 1.3) * 2.5 + Math.cos(step * 0.35 + i) * 1.5);
          lvl[i] = Math.max(2, Math.min(SEGS, w.base + wave));
          if (lvl[i] >= peak[i]) peak[i] = lvl[i];
          else if (step % 4 === 0 && peak[i] > lvl[i]) peak[i]--;
        });
        draw();
      });
    },
  });
})();
