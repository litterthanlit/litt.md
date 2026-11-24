/* 08-responsive-preview.js — Responsive Preview:
   Four breakpoint keys (lit yellow on the chosen width) over one clean grid surface that rearranges on the beat. */
(function () {
  const S = ".rs-responsive-preview";
  const BPS = [
    { w: 390, name: "Phone", cols: 1, cards: 2 },
    { w: 768, name: "Tablet", cols: 2, cards: 2 },
    { w: 1280, name: "Laptop", cols: 3, cards: 3 },
    { w: 1440, name: "Desktop", cols: 4, cards: 4 },
  ];

  RackPlayer.register({
    slug: "responsive-preview",
    title: "Responsive Preview",
    tagline: "Pick a breakpoint and watch the layout frame snap cleanly into place.",
    css: `
${S} .rp-grid {
  margin: 10px; height: 132px; padding: 10px; border-radius: var(--r-control);
  background: var(--cut); box-shadow: var(--edge);
  background-image: linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px);
  background-size: 12px 12px; display: grid; gap: 6px; align-content: start;
}
${S} .rp-meta { font: 500 10px/1 var(--mono); color: var(--muted); }
${S} .rp-hd { padding: 4px 7px; font-size: 10px; display: flex; justify-content: space-between; align-items: center; }
${S} .rp-cards { display: grid; gap: 6px; }
${S} .rp-card { height: 54px; padding: 6px 7px; font-size: 10px; display: flex; flex-direction: column; justify-content: space-between; }
${S}.is-tile .rp-grid { height: 120px; padding: 8px; }
${S}.is-tile .rp-card { height: 46px; }
`,
    mount(host, ctx) {
      let cur = 1;

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><b>Layout</b><div class="rk-seg is-yellow" style="margin-left:auto" role="radiogroup" aria-label="Breakpoint">' +
            BPS.map((b, i) => '<button type="button" role="radio" data-i="' + i + '">' + b.w + '</button>').join("") +
          '</div></div>' +
          '<div class="rp-grid" id="rp-g"></div>' +
        '</div>';

      const btns = [...host.querySelectorAll("[role=radio]")];
      const grid = host.querySelector("#rp-g");

      function draw() {
        const b = BPS[cur];
        btns.forEach((x, i) => x.setAttribute("aria-checked", String(i === cur)));
        grid.innerHTML =
          '<span class="rp-meta">' + b.name + ' · ' + b.w + 'px · ' + b.cols + ' col</span>' +
          '<div class="ly rp-hd" data-h="purple"><span>Header</span><span class="ly" data-h="cyan" style="padding:1px 5px;font-size:9px">Action</span></div>' +
          '<div class="rp-cards" style="grid-template-columns:repeat(' + b.cols + ',1fr)">' +
            Array.from({ length: b.cards }, (_, i) => '<div class="ly rp-card" data-h="pink"><span>Card ' + (i + 1) + '</span></div>').join("") +
          '</div>';
      }

      btns.forEach((b) => b.addEventListener("click", () => { cur = +b.dataset.i; draw(); }, { signal: ctx.signal }));
      draw();

      let ghost = !ctx.reduced();
      ctx.onHand(() => { ghost = false; });
      if (ghost) ctx.every(2400, () => { if (!ghost) return; cur = (cur + 1) % BPS.length; draw(); });
    },
  });
})();
