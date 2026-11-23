/* 15-curve-shaper.js — Rack motion & quantize shaper: 1px-ruled SVG transfer curve with
   1:1 draggable control handles, Rack motion presets (Step | Cut | Snap | Beat), and a live preview rail. */
(function () {
  const S = ".rs-curve-shaper";
  const PRESETS = [
    { id: "cut", name: "Cut 100ms", x1: 0.0, y1: 0.0, x2: 0.25, y2: 1.0, steps: 0, note: "Rack overlay & column cut-in" },
    { id: "step", name: "Frame 0ms", x1: 0.0, y1: 1.0, x2: 0.0, y2: 1.0, steps: 1, note: "Direct manipulation: instant snap" },
    { id: "snap", name: "Snap 140ms", x1: 0.16, y1: 1.0, x2: 0.3, y2: 1.0, steps: 0, note: "Data bar & sort transition" },
    { id: "beat", name: "Beat 4×", x1: 0.25, y1: 0.25, x2: 0.75, y2: 0.75, steps: 4, note: "Quantized 4-step transport" },
  ];

  RackPlayer.register({
    slug: "curve-shaper",
    title: "Quantize & Curve Shaper",
    category: "control",
    tagline: "Drag transfer points 1:1 on a 1px grid and preview Rack's zero-bounce curves live.",
    motion: "0ms handle drag · live beat-triggered preview rail",
    css: `
${S} .cs { width: min(100%, 660px); border: 1px solid var(--border); background: var(--panel); display: grid; }
${S} .cs-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; padding: 7px 10px; border-bottom: 1px solid var(--border); background: var(--surface-2); }
${S} .cs-body { display: grid; grid-template-columns: 220px 1fr; }
${S} .cs-plot { padding: 12px; border-right: 1px solid var(--border); background: var(--cut); display: grid; place-items: center; }
${S} .cs-svg { width: 100%; max-width: 196px; aspect-ratio: 1; display: block; touch-action: none; user-select: none; }
${S} .cs-side { padding: 12px; display: grid; gap: 12px; align-content: space-between; }
${S} .cs-rail { position: relative; height: 28px; border: 1px solid var(--border); background: var(--slot); }
${S} .cs-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0%; background: var(--violet); }
${S} .cs-blocks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
${S} .cs-blk { height: 22px; border: 1px solid var(--border); background: var(--block); display: grid; place-items: center; font: 600 10px/1 var(--mono); }
${S} .cs-blk.is-on { background: var(--accent); color: var(--on-accent); border-color: var(--ink); }
${S} .cs-css { font: 500 11px/1.3 var(--mono); padding: 7px 8px; border: 1px solid var(--line-strong); background: var(--cut); color: var(--ink); }
${S}.is-tile .cs-body { grid-template-columns: 145px 1fr; }
${S}.is-tile .cs-plot { padding: 8px; }
${S}.is-tile .cs-side { padding: 8px; gap: 6px; }
${S}.is-tile .cs-css { font-size: 9px; padding: 5px 6px; }
${S}.is-tile .rk-seg button { height: 22px; padding: 0 6px; font-size: 10px; }
`,
    mount(host, ctx) {
      let cur = Object.assign({}, PRESETS[0]);
      let activeId = PRESETS[0].id;
      let phase = 0;

      host.innerHTML =
        '<div class="cs">' +
          '<div class="cs-top">' +
            '<span style="font-weight:600;font-size:12px">Transfer shaper</span>' +
            '<div class="rk-seg" role="radiogroup" aria-label="Curve preset">' +
              PRESETS.map((p) => '<button type="button" role="radio" data-p="' + p.id + '" aria-checked="' + (p.id === activeId) + '">' + p.name + '</button>').join("") +
            '</div>' +
          '</div>' +
          '<div class="cs-body">' +
            '<div class="cs-plot">' +
              '<svg class="cs-svg" viewBox="0 0 200 200">' +
                '<rect x="10" y="10" width="180" height="180" fill="none" stroke="var(--line-strong)" stroke-width="1"/>' +
                '<path d="M55 10V190 M100 10V190 M145 10V190 M10 55H190 M10 100H190 M10 145H190" stroke="var(--line)" stroke-width="1"/>' +
                '<line id="cs-h1" stroke="var(--subtle)" stroke-width="1" stroke-dasharray="3 3"/>' +
                '<line id="cs-h2" stroke="var(--subtle)" stroke-width="1" stroke-dasharray="3 3"/>' +
                '<path id="cs-path" fill="none" stroke="var(--violet)" stroke-width="2.5"/>' +
                '<rect id="cs-p1" width="12" height="12" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.5" style="cursor:grab"/>' +
                '<rect id="cs-p2" width="12" height="12" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.5" style="cursor:grab"/>' +
              '</svg>' +
            '</div>' +
            '<div class="cs-side">' +
              '<div><div class="rk-fig" style="margin-bottom:6px">PREVIEW RAIL (ON THE BEAT)</div><div class="cs-rail"><div class="cs-fill" id="cs-fill"></div></div></div>' +
              '<div><div class="rk-fig" style="margin-bottom:6px">COLUMN STAGGER (36MS)</div><div class="cs-blocks" id="cs-blks"><div class="cs-blk">01</div><div class="cs-blk">02</div><div class="cs-blk">03</div><div class="cs-blk">04</div></div></div>' +
              '<div class="cs-css" id="cs-css"></div>' +
            '</div>' +
          '</div>' +
        '</div>';

      const svg = host.querySelector(".cs-svg");
      const path = host.querySelector("#cs-path");
      const h1 = host.querySelector("#cs-h1"), h2 = host.querySelector("#cs-h2");
      const p1 = host.querySelector("#cs-p1"), p2 = host.querySelector("#cs-p2");
      const fill = host.querySelector("#cs-fill");
      const blks = [...host.querySelectorAll(".cs-blk")];
      const cssEl = host.querySelector("#cs-css");
      const pBtns = [...host.querySelectorAll("[data-p]")];

      const toX = (u) => 10 + u * 180;
      const toY = (v) => 190 - v * 180;

      function drawCurve() {
        pBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.p === activeId)));
        const x1 = toX(cur.x1), y1 = toY(cur.y1), x2 = toX(cur.x2), y2 = toY(cur.y2);
        if (cur.steps > 1) {
          let d = "M 10 190";
          for (let i = 1; i <= cur.steps; i++) {
            const xPrev = toX((i - 1) / cur.steps), xNext = toX(i / cur.steps), yNext = toY(i / cur.steps);
            d += ` L ${xPrev.toFixed(1)} ${yNext.toFixed(1)} L ${xNext.toFixed(1)} ${yNext.toFixed(1)}`;
          }
          path.setAttribute("d", d);
          h1.setAttribute("opacity", "0"); h2.setAttribute("opacity", "0");
          p1.setAttribute("opacity", "0"); p2.setAttribute("opacity", "0");
          cssEl.textContent = "steps(" + cur.steps + ", end) · quantized";
        } else if (cur.steps === 1) {
          path.setAttribute("d", "M 10 190 L 10 10 L 190 10");
          h1.setAttribute("opacity", "0"); h2.setAttribute("opacity", "0");
          p1.setAttribute("opacity", "0"); p2.setAttribute("opacity", "0");
          cssEl.textContent = "0ms · cut on the frame";
        } else {
          path.setAttribute("d", `M 10 190 C ${x1.toFixed(1)} ${y1.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}, 190 10`);
          h1.setAttribute("opacity", "1"); h2.setAttribute("opacity", "1");
          p1.setAttribute("opacity", "1"); p2.setAttribute("opacity", "1");
          h1.setAttribute("x1", "10"); h1.setAttribute("y1", "190"); h1.setAttribute("x2", x1); h1.setAttribute("y2", y1);
          h2.setAttribute("x1", "190"); h2.setAttribute("y1", "10"); h2.setAttribute("x2", x2); h2.setAttribute("y2", y2);
          p1.setAttribute("x", (x1 - 6).toFixed(1)); p1.setAttribute("y", (y1 - 6).toFixed(1));
          p2.setAttribute("x", (x2 - 6).toFixed(1)); p2.setAttribute("y", (y2 - 6).toFixed(1));
          cssEl.textContent = `cubic-bezier(${cur.x1.toFixed(2)}, ${cur.y1.toFixed(2)}, ${cur.x2.toFixed(2)}, ${cur.y2.toFixed(2)})`;
        }
      }

      let dragWhich = null;
      const movePt = (e) => {
        if (!dragWhich) return;
        const r = svg.getBoundingClientRect();
        const u = Math.max(0, Math.min(1, ((e.clientX - r.left) / r.width * 200 - 10) / 180));
        const v = Math.max(0, Math.min(1, (190 - (e.clientY - r.top) / r.height * 200) / 180));
        cur.steps = 0; activeId = "";
        if (dragWhich === 1) { cur.x1 = u; cur.y1 = v; } else { cur.x2 = u; cur.y2 = v; }
        drawCurve();
      };
      p1.addEventListener("pointerdown", (e) => { dragWhich = 1; svg.setPointerCapture(e.pointerId); e.preventDefault(); }, { signal: ctx.signal });
      p2.addEventListener("pointerdown", (e) => { dragWhich = 2; svg.setPointerCapture(e.pointerId); e.preventDefault(); }, { signal: ctx.signal });
      svg.addEventListener("pointermove", movePt, { signal: ctx.signal });
      svg.addEventListener("pointerup", () => { dragWhich = null; }, { signal: ctx.signal });

      pBtns.forEach((b) => b.addEventListener("click", () => {
        const found = PRESETS.find((x) => x.id === b.dataset.p);
        if (found) { cur = Object.assign({}, found); activeId = found.id; drawCurve(); }
      }, { signal: ctx.signal }));

      ctx.onBeat((step) => {
        if (ctx.reduced()) return;
        const s = step % 8;
        if (cur.steps === 4) {
          const k = Math.min(4, Math.floor((s % 4) + 1));
          fill.style.transition = "none";
          fill.style.width = (k * 25) + "%";
        } else if (s === 0 || s === 4) {
          phase = s === 0 ? 1 : 0;
          fill.style.transition = cur.steps === 1 ? "none" : `width 140ms cubic-bezier(${cur.x1},${cur.y1},${cur.x2},${cur.y2})`;
          fill.style.width = phase ? "100%" : "0%";
        }
        blks.forEach((b, i) => b.classList.toggle("is-on", i === (step % 4)));
      });

      drawCurve();
    },
  });
})();
