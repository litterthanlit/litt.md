/* 16-rack-motion.js — Cut & Stagger Motion:
   Live interactive lab for Rack's Emil-Kowalski motion language:
   0ms under a hand, 100ms opacity cut-in, 36ms column stagger, 75ms cut-out — zero springs, zero overshoot. */
(function () {
  const S = ".rs-rack-motion";
  const PRESETS = [
    { id: "hand", label: "0ms Hand", dur: 0, stag: 0, d: "M16 74 L16 14 L224 14", note: "Direct manipulation tracks 1:1 on the frame — zero lag." },
    { id: "in", label: "100ms Cut-In", dur: 100, stag: 36, d: "M16 74 Q42 16 132 14 L224 14", note: "Panels cut in by opacity in 100ms, columns launch 36ms apart." },
    { id: "out", label: "75ms Cut-Out", dur: 75, stag: 0, d: "M16 14 Q44 70 108 74 L224 74", note: "Exits finish faster than enters — 75ms crisp ease-out." },
  ];
  const COLS = [
    { k: "C1", h: "blue" }, { k: "C2", h: "violet" }, { k: "C3", h: "emerald" }, { k: "C4", h: "coral" }, { k: "C5", h: "pink" },
  ];

  RackPlayer.register({
    slug: "rack-motion",
    title: "Cut & Stagger Motion",
    category: "control",
    tagline: "Rack's Emil-Kowalski timing bench: 0ms under the hand, 100ms cut-in, 36ms stagger, 75ms exit.",
    motion: "0ms hand · 100ms in · 75ms out",
    css: `
${S} .rm {
  width: min(100%, 490px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); padding: 12px; display: grid; gap: 10px;
}
${S} .rm-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
${S} .rm-mid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 8px; }
${S} .rm-svg {
  width: 100%; height: 92px; display: block; background: var(--surface-2);
  border: 1px solid var(--line); border-radius: var(--r-control);
}
${S} .rm-cols {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; align-items: stretch;
  padding: 6px; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r-control);
}
${S} .rm-blk {
  border-radius: var(--r-control); display: grid; place-items: center;
  font: 600 10px/1 var(--mono); color: #fff;
}
${S} .rm-blk[data-h="blue"] { background: var(--blue); }
${S} .rm-blk[data-h="violet"] { background: var(--violet); }
${S} .rm-blk[data-h="emerald"] { background: var(--emerald); }
${S} .rm-blk[data-h="coral"] { background: var(--coral); }
${S} .rm-blk[data-h="pink"] { background: var(--pink); }
${S} .rm-foot {
  display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--muted);
}
${S} .rm-foot span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S}.is-tile .rm { padding: 9px; gap: 7px; }
${S}.is-tile .rm-svg { height: 74px; }
${S}.is-tile .rm-top .rk-seg button, ${S}.is-tile .rm-top .rk-btn { height: 22px; padding: 0 7px; font-size: 10px; }
${S}.is-tile .rm-foot { font-size: 10px; }
`,
    mount(host, ctx) {
      let cur = 1;

      host.innerHTML =
        '<div class="rm" data-col>' +
          '<div class="rm-top">' +
            '<div class="rk-seg is-yellow" role="radiogroup">' +
              PRESETS.map((p, i) => '<button type="button" role="radio" data-i="' + i + '" aria-checked="' + (i === 1) + '">' + p.label + '</button>').join("") +
            '</div>' +
            '<button type="button" class="rk-btn is-accent" id="rm-play">Replay</button>' +
          '</div>' +
          '<div class="rm-mid">' +
            '<svg class="rm-svg" viewBox="0 0 240 88"><path id="rm-fill" fill="var(--blue-tint)"/><path id="rm-path" fill="none" stroke="var(--blue)" stroke-width="2.5"/></svg>' +
            '<div class="rm-cols">' + COLS.map((c) => '<div class="rm-blk" data-h="' + c.h + '">' + c.k + '</div>').join("") + '</div>' +
          '</div>' +
          '<div class="rm-foot"><span id="rm-note"></span><span class="rk-mono" style="color:var(--ink);flex:none">ZERO SPRINGS</span></div>' +
        '</div>';

      const btns = [...host.querySelectorAll("[role=radio]")];
      const path = host.querySelector("#rm-path");
      const fill = host.querySelector("#rm-fill");
      const note = host.querySelector("#rm-note");
      const blks = [...host.querySelectorAll(".rm-blk")];

      function draw() {
        const p = PRESETS[cur];
        btns.forEach((b, i) => b.setAttribute("aria-checked", String(i === cur)));
        path.setAttribute("d", p.d);
        fill.setAttribute("d", p.d + " L224 74 L16 74 Z");
        note.textContent = p.note;
      }

      function play() {
        if (ctx.reduced() || ctx.tile) return;
        const p = PRESETS[cur];
        blks.forEach((el, i) => {
          if (!el.animate) return;
          if (p.id === "out") el.animate([{ opacity: 1 }, { opacity: 0.15 }, { opacity: 1 }], { duration: 150, easing: "ease-out" });
          else el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.max(16, p.dur), delay: i * p.stag, easing: "ease-out", fill: "backwards" });
        });
      }

      btns.forEach((b) => b.addEventListener("click", () => { cur = +b.dataset.i; draw(); play(); }, { signal: ctx.signal }));
      host.querySelector("#rm-play").addEventListener("click", play, { signal: ctx.signal });
      draw();
    },
  });
})();
