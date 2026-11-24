/* 01-light-studies.js — Light Studies:
   Animated long-exposure light horizons on a crisp 2D canvas, switched on the beat with four layer keys. */
(function () {
  const S = ".rs-light-studies";
  const LOOKS = [
    { name: "Dawn", hue: "orange", stops: ["#2d140a", "#c85214", "#ffb066", "#fff0d6"] },
    { name: "Lagoon", hue: "cyan", stops: ["#072429", "#0b7a78", "#5ad9cb", "#dcfbf6"] },
    { name: "Bloom", hue: "pink", stops: ["#380e24", "#bd2d76", "#ff8fc4", "#ffe4f2"] },
    { name: "Dusk", hue: "purple", stops: ["#171038", "#5c3ec9", "#a992ff", "#ece6ff"] },
  ];

  RackPlayer.register({
    slug: "light-studies",
    title: "Light Studies",
    tagline: "Long-exposure horizons that breathe softly until you pick a new mood.",
    css: `
${S} .ls-wrap { padding: 10px; display: grid; gap: 8px; }
${S} .ls-can {
  width: 100%; height: 124px; display: block; border-radius: var(--r-control);
  box-shadow: var(--edge);
}
${S} .ls-keys { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
${S} .ls-k {
  height: 26px; border: 0; padding: 0 6px; font-size: 11px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
${S}.is-tile .ls-can { height: 114px; }
`,
    mount(host, ctx) {
      let cur = 0, live = !ctx.reduced(), phase = 1.2;

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><b>Light</b><button type="button" class="rk-key is-on" style="margin-left:auto" id="ls-live">Live</button></div>' +
          '<div class="ls-wrap">' +
            '<canvas class="ls-can" width="420" height="140" aria-hidden="true"></canvas>' +
            '<div class="ls-keys" role="radiogroup" aria-label="Light mood">' +
              LOOKS.map((l, i) => '<button type="button" role="radio" class="ly ls-k" data-i="' + i + '" data-h="' + l.hue + '">' + l.name + '</button>').join("") +
            '</div>' +
          '</div>' +
        '</div>';

      const can = host.querySelector("canvas");
      const g = can.getContext("2d");
      const btns = [...host.querySelectorAll(".ls-k")];
      const liveBtn = host.querySelector("#ls-live");

      function paint() {
        const w = can.width, h = can.height, s = LOOKS[cur].stops;
        const grad = g.createLinearGradient(0, h, w, 0);
        const shift = Math.sin(phase * 0.55) * 0.08;
        grad.addColorStop(0, s[0]);
        grad.addColorStop(Math.max(0.15, Math.min(0.45, 0.34 + shift)), s[1]);
        grad.addColorStop(Math.max(0.52, Math.min(0.82, 0.68 - shift)), s[2]);
        grad.addColorStop(1, s[3]);
        g.fillStyle = grad;
        g.fillRect(0, 0, w, h);

        for (let i = 0; i < 6; i++) {
          const y = h * (0.16 + i * 0.14) + Math.sin(phase * 0.7 + i * 1.1) * 10;
          const rg = g.createLinearGradient(0, y - 16, w, y + 16);
          rg.addColorStop(0, "transparent");
          rg.addColorStop(0.45, s[3] + "44");
          rg.addColorStop(0.8, s[2] + "33");
          rg.addColorStop(1, "transparent");
          g.fillStyle = rg;
          g.fillRect(0, y - 14, w, 28);
        }
      }

      function drawUI() {
        btns.forEach((b, i) => {
          b.classList.toggle("is-sel", i === cur);
          b.setAttribute("aria-checked", String(i === cur));
        });
        liveBtn.classList.toggle("is-on", live);
        liveBtn.textContent = live ? "Live" : "Still";
        paint();
      }

      btns.forEach((b) => b.addEventListener("click", () => { cur = +b.dataset.i; drawUI(); }, { signal: ctx.signal }));
      liveBtn.addEventListener("click", () => { live = !live; drawUI(); }, { signal: ctx.signal });
      drawUI();

      ctx.loop((dt) => {
        if (!live) return;
        phase += dt;
        paint();
      });

      let ghost = !ctx.reduced();
      ctx.onHand(() => { ghost = false; });
      if (ghost) ctx.every(3200, () => { if (!ghost || !live) return; cur = (cur + 1) % LOOKS.length; drawUI(); });
    },
  });
})();
