/* 06-frame-designer.js — Frame Designer:
   A pink Card directly on an 8px design grid with three draggable value chips (Radius, Space, Border) + A / B recall. */
(function () {
  const S = ".rs-frame-designer";
  const LOOKS = [
    { radius: 4, space: 12, border: 1 },
    { radius: 14, space: 18, border: 2 },
  ];

  RackPlayer.register({
    slug: "frame-designer",
    title: "Frame Designer",
    tagline: "Drag Radius, Space, or Border 1:1 on the canvas, or jump between looks A and B.",
    css: `
${S} .fd-wrap { padding: 10px; display: grid; gap: 8px; }
${S} .fd-grid {
  position: relative; height: 98px; border-radius: var(--r-control);
  background: var(--cut); box-shadow: var(--edge);
  background-image: linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px);
  background-size: 12px 12px; display: grid; place-items: center;
}
${S} .fd-card { min-width: 148px; display: grid; gap: 6px; font-size: 11px; }
${S} .fd-bar { height: 4px; border-radius: 1px; background: var(--clip-pink); opacity: 0.45; }
${S} .fd-props { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
${S} .fd-p {
  height: 26px; padding: 0 8px; border-radius: var(--r-control);
  background: var(--cut); box-shadow: var(--edge);
  display: flex; align-items: center; justify-content: space-between;
  font-size: 10px; cursor: ns-resize; user-select: none; touch-action: none;
}
${S} .fd-p b { font-family: var(--mono); font-weight: 600; }
${S} .fd-p.is-drag { background: var(--accent); color: var(--accent-fg); }
${S}.is-tile .fd-grid { height: 86px; }
`,
    mount(host, ctx) {
      let ab = 0;
      const v = { ...LOOKS[0] };

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><b>Card</b><div class="rk-seg is-yellow" style="margin-left:auto" role="radiogroup" aria-label="Variation"><button type="button" role="radio" data-ab="0">A</button><button type="button" role="radio" data-ab="1">B</button></div></div>' +
          '<div class="fd-wrap">' +
            '<div class="fd-grid"><div class="ly fd-card" id="fd-card" data-h="pink"><span>Card</span><i class="fd-bar"></i></div></div>' +
            '<div class="fd-props">' +
              '<div class="fd-p" tabindex="0" role="slider" aria-label="Radius" data-k="radius"><span>Radius</span><b id="fd-r"></b></div>' +
              '<div class="fd-p" tabindex="0" role="slider" aria-label="Space" data-k="space"><span>Space</span><b id="fd-s"></b></div>' +
              '<div class="fd-p" tabindex="0" role="slider" aria-label="Border" data-k="border"><span>Border</span><b id="fd-b"></b></div>' +
            '</div>' +
          '</div>' +
        '</div>';

      const card = host.querySelector("#fd-card");
      const abBtns = [...host.querySelectorAll("[data-ab]")];
      const rEl = host.querySelector("#fd-r"), sEl = host.querySelector("#fd-s"), bEl = host.querySelector("#fd-b");

      function draw() {
        card.style.borderRadius = v.radius + "px";
        card.style.padding = v.space + "px";
        card.classList.toggle("is-sel", v.border >= 2);
        rEl.textContent = v.radius + "px";
        sEl.textContent = v.space + "px";
        bEl.textContent = v.border + "px";
        abBtns.forEach((b, i) => b.setAttribute("aria-checked", String(i === ab)));
      }

      abBtns.forEach((b) => b.addEventListener("click", () => { ab = +b.dataset.ab; Object.assign(v, LOOKS[ab]); draw(); }, { signal: ctx.signal }));
      const specs = { radius: [0, 20, 1, 4], space: [6, 24, 1, 12], border: [1, 2, 1, 1] };
      host.querySelectorAll(".fd-p").forEach((el) => {
        const k = el.dataset.k, [min, max, step, def] = specs[k];
        ctx.bindDrag(el, { min, max, step, def, get: () => v[k], set: (n) => { v[k] = n; draw(); }, signal: ctx.signal, rangePx: 90 });
      });
      draw();

      let ghost = !ctx.reduced();
      ctx.onHand(() => { ghost = false; });
      if (ghost) ctx.every(2600, () => { if (!ghost) return; ab = ab ? 0 : 1; Object.assign(v, LOOKS[ab]); draw(); });
    },
  });
})();
