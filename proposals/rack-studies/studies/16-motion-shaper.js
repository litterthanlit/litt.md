/* 16-motion-shaper.js — Rack Motion Shaper:
   Interactive spec & live test bench for Rack's "on the beat" motion language:
   0ms Frame under a hand, 100ms Cut-in, 75ms Stop, 36ms Column Stagger — zero springs, zero overshoot. */
(function () {
  const S = ".rs-motion-shaper";
  const MODES = [
    { id: "frame", name: "0ms Frame", dur: 0, stagger: 0, desc: "Direct manipulation under pointer/key — zero settle, zero lag." },
    { id: "cut", name: "100ms Cut", dur: 100, stagger: 36, desc: "Panel reveal — 100ms opacity cut-in, columns launch 36ms apart." },
    { id: "stop", name: "75ms Stop", dur: 75, stagger: 0, desc: "Dismissal & stop — crisp 75ms ease-out opacity cut-out." },
    { id: "beat", name: "Beat 1/16", dur: 125, stagger: 36, desc: "Quantized 120 BPM clock — state transitions lock to 125ms ticks." },
  ];
  const COLS = [
    { label: "C1", hue: "amber" },
    { label: "C2", hue: "blue" },
    { label: "C3", hue: "teal" },
    { label: "C4", hue: "violet" },
    { label: "C5", hue: "green" },
  ];

  RackPlayer.register({
    slug: "motion-shaper",
    title: "Rack Motion Shaper",
    category: "control",
    tagline: "Live bench for Rack's on-the-beat timing: 0ms frame, 100ms cut, 75ms stop, 36ms column beat.",
    motion: "0ms frame · 100ms cut-in · 36ms beat",
    css: `
${S} .ms { width: min(100%, 700px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .ms-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px; padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control); }
${S} .ms-body { display: grid; grid-template-columns: 1.15fr 1fr; gap: 5px; }
${S} .ms-scope {
  background: var(--cut); border: 1px solid var(--border); border-radius: var(--r-control);
  padding: 6px; display: grid; gap: 4px;
}
${S} .ms-scope svg { width: 100%; height: 112px; display: block; }
${S} .ms-bench {
  background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control);
  padding: 7px; display: grid; gap: 6px; align-content: space-between;
}
${S} .ms-cols { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
${S} .ms-blk {
  height: 54px; border: 1px solid var(--ink); border-radius: var(--r-control);
  display: grid; place-items: center; font: 600 10px/1 var(--mono);
}
${S} .ms-blk[data-h="amber"] { background: var(--amber-tint); color: var(--amber-text); }
${S} .ms-blk[data-h="blue"] { background: var(--blue-tint); color: var(--blue-text); }
${S} .ms-blk[data-h="teal"] { background: var(--teal-tint); color: var(--teal-text); }
${S} .ms-blk[data-h="violet"] { background: var(--violet-tint); color: var(--violet-text); }
${S} .ms-blk[data-h="green"] { background: var(--green-tint); color: var(--green-text); }
${S} .ms-rail { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; }
${S} .ms-tick { height: 10px; background: var(--surface-2); border: 1px solid var(--line-strong); border-radius: 1px; }
${S} .ms-tick.is-on { background: var(--accent); border-color: var(--ink); }
${S} .ms-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 4px 6px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control); font-size: 11px; color: var(--muted); min-width: 0; }
${S} .ms-foot > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .ms-foot > span:last-child { flex: none; white-space: nowrap; }
${S}.is-tile .ms-scope svg { height: 80px; }
${S}.is-tile .ms-blk { height: 38px; font-size: 9px; }
${S}.is-tile .ms-top .rk-seg button, ${S}.is-tile .ms-top .rk-btn { height: 21px; padding: 0 6px; font-size: 10px; white-space: nowrap; }
${S}.is-tile .ms-foot { font-size: 10px; padding: 4px 6px; }
`,
    mount(host, ctx) {
      let cur = 1;
      let beatIdx = 0;

      host.innerHTML =
        '<div class="ms">' +
          '<div class="ms-top">' +
            '<div class="rk-seg is-yellow" role="radiogroup" aria-label="Motion preset">' +
              MODES.map((m, i) => '<button type="button" role="radio" data-i="' + i + '" aria-checked="' + (i === cur) + '">' + m.name + '</button>').join("") +
            '</div>' +
            '<button type="button" class="rk-btn is-accent" id="ms-fire">Fire Cut</button>' +
          '</div>' +
          '<div class="ms-body">' +
            '<div class="ms-scope" data-col>' +
              '<svg viewBox="0 0 240 100" aria-hidden="true">' +
                '<g stroke="var(--line)" stroke-width="1">' +
                  '<line x1="20" y1="15" x2="20" y2="85"/><line x1="20" y1="85" x2="225" y2="85"/>' +
                  '<line x1="70" y1="15" x2="70" y2="85" stroke-dasharray="2 3"/>' +
                  '<line x1="120" y1="15" x2="120" y2="85" stroke-dasharray="2 3"/>' +
                  '<line x1="170" y1="15" x2="170" y2="85" stroke-dasharray="2 3"/>' +
                  '<line x1="220" y1="15" x2="220" y2="85" stroke-dasharray="2 3"/>' +
                '</g>' +
                '<path id="ms-fill" fill="var(--blue-tint)" opacity="0.55"/>' +
                '<path id="ms-path" fill="none" stroke="var(--ink)" stroke-width="2.5"/>' +
                '<rect id="ms-dot" width="7" height="7" fill="var(--accent)" stroke="var(--ink)" stroke-width="1"/>' +
              '</svg>' +
              '<div class="ms-rail">' +
                Array.from({ length: 8 }, (_, i) => '<i class="ms-tick" data-t="' + i + '"></i>').join("") +
              '</div>' +
            '</div>' +
            '<div class="ms-bench" data-col>' +
              '<div class="ms-cols">' +
                COLS.map((c) => '<div class="ms-blk" data-h="' + c.hue + '">' + c.label + '</div>').join("") +
              '</div>' +
              '<div class="rk-mono" style="font-size:10px;color:var(--muted)" id="ms-meta"></div>' +
            '</div>' +
          '</div>' +
          '<div class="ms-foot"><span id="ms-desc"></span><span class="rk-mono" style="color:var(--ink)">ZERO SPRINGS</span></div>' +
        '</div>';

      const mBtns = [...host.querySelectorAll("[role=radio]")];
      const pathEl = host.querySelector("#ms-path");
      const fillEl = host.querySelector("#ms-fill");
      const dotEl = host.querySelector("#ms-dot");
      const metaEl = host.querySelector("#ms-meta");
      const descEl = host.querySelector("#ms-desc");
      const blks = [...host.querySelectorAll(".ms-blk")];
      const ticks = [...host.querySelectorAll(".ms-tick")];

      const CURVES = [
        { d: "M20 85 L20 18 L225 18", f: "M20 85 L20 18 L225 18 L225 85 Z", pt: [20, 18] },
        { d: "M20 85 Q45 20 140 18 L225 18", f: "M20 85 Q45 20 140 18 L225 18 L225 85 Z", pt: [140, 18] },
        { d: "M20 18 Q48 80 115 85 L225 85", f: "M20 18 Q48 80 115 85 L225 85 L20 85 Z", pt: [115, 85] },
        { d: "M20 85 L20 68 L70 68 L70 50 L120 50 L120 34 L170 34 L170 18 L225 18", f: "M20 85 L20 68 L70 68 L70 50 L120 50 L120 34 L170 34 L170 18 L225 18 L225 85 Z", pt: [170, 18] },
      ];

      function draw() {
        const m = MODES[cur];
        const c = CURVES[cur];
        mBtns.forEach((b, i) => b.setAttribute("aria-checked", String(i === cur)));
        pathEl.setAttribute("d", c.d);
        fillEl.setAttribute("d", c.f);
        dotEl.setAttribute("x", String(c.pt[0] - 3.5));
        dotEl.setAttribute("y", String(c.pt[1] - 3.5));
        metaEl.textContent = "DUR " + m.dur + "ms · COL STAGGER " + m.stagger + "ms · EASE-OUT";
        descEl.textContent = m.desc;
      }

      function fire() {
        if (ctx.reduced() || ctx.tile) return;
        const m = MODES[cur];
        blks.forEach((el, i) => {
          if (!el.animate) return;
          if (m.id === "stop") {
            el.animate([{ opacity: 1 }, { opacity: 0.15 }, { opacity: 1 }], { duration: 150, easing: "ease-out" });
          } else {
            el.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: Math.max(16, m.dur), delay: i * m.stagger, easing: "ease-out", fill: "backwards",
            });
          }
        });
      }

      mBtns.forEach((b) => b.addEventListener("click", () => {
        cur = +b.dataset.i; draw(); fire();
      }, { signal: ctx.signal }));
      host.querySelector("#ms-fire").addEventListener("click", fire, { signal: ctx.signal });

      draw();
      ctx.onBeat((step) => {
        beatIdx = step % 8;
        ticks.forEach((t, i) => t.classList.toggle("is-on", i === beatIdx));
      });
    },
  });
})();
