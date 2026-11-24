/* 04-focus-mode.js — Focus Mode:
   One calm status bar over four crisp toggle keys that snap on the frame (0ms) — zero sliding clutter. */
(function () {
  const S = ".rs-focus-mode";
  const ITEMS = [
    { name: "Quiet notifications", on: true },
    { name: "Auto-save drafts", on: true },
    { name: "Live preview", on: true },
    { name: "Smart suggestions", on: false },
  ];

  RackPlayer.register({
    slug: "focus-mode",
    title: "Focus Mode",
    tagline: "Four quiet switches that flip on the frame under one calm status summary.",
    css: `
${S} .fm-bar {
  position: relative; height: 42px; padding: 0 10px; margin-bottom: 8px;
  display: flex; align-items: center; justify-content: space-between; overflow: hidden; font-size: 12px;
}
${S} .fm-prog { position: absolute; left: 0; top: 0; bottom: 0; opacity: 0.22; pointer-events: none; }
${S} .fm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
${S} .fm-k {
  height: 32px; border: 0; border-radius: var(--r-control); padding: 0 10px;
  background: var(--block); box-shadow: var(--edge); color: var(--ink);
  font: 500 11px/1 var(--font); cursor: pointer; transition: none;
}
${S} .fm-k:hover { background: var(--block-hover); }
${S} .fm-k:active { box-shadow: var(--edge-press); transform: scale(0.98); }
${S} .fm-k[aria-pressed="true"] { background: var(--ink); color: var(--panel); font-weight: 600; }
${S}.is-tile .fm-bar { height: 36px; }
${S}.is-tile .fm-k { height: 28px; font-size: 10.5px; }
`,
    mount(host, ctx) {
      const state = ITEMS.map((x) => ({ ...x }));
      let focusOn = true;

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><b>Studio</b><button type="button" class="rk-key is-on" style="margin-left:auto" id="fm-all">Focus</button></div>' +
          '<div class="rk-surf">' +
            '<div class="ly fm-bar" id="fm-bar" data-h="green"><i class="fm-prog" id="fm-prog" style="background:var(--clip-green)"></i><span style="position:relative" id="fm-msg"></span><span style="position:relative;font-family:var(--mono);font-size:11px" id="fm-cnt"></span></div>' +
            '<div class="fm-grid">' +
              state.map((x, i) => '<button type="button" class="fm-k" data-i="' + i + '">' + x.name + '</button>').join("") +
            '</div>' +
          '</div>' +
        '</div>';

      const bar = host.querySelector("#fm-bar");
      const prog = host.querySelector("#fm-prog");
      const msg = host.querySelector("#fm-msg");
      const cnt = host.querySelector("#fm-cnt");
      const allBtn = host.querySelector("#fm-all");
      const ks = [...host.querySelectorAll(".fm-k")];

      function draw() {
        const n = state.filter((x) => x.on).length;
        const hue = focusOn && n > 0 ? "green" : "orange";
        bar.dataset.h = hue;
        prog.style.background = "var(--clip-" + hue + ")";
        prog.style.width = ((n / state.length) * 100) + "%";
        msg.textContent = !focusOn ? "Open mode" : n === 4 ? "Deep focus" : "Calm focus";
        cnt.textContent = n + " / " + state.length;
        allBtn.classList.toggle("is-on", focusOn);
        allBtn.textContent = focusOn ? "Focus" : "Open";
        ks.forEach((k, i) => k.setAttribute("aria-pressed", String(state[i].on)));
      }

      ks.forEach((k) => k.addEventListener("click", () => { const i = +k.dataset.i; state[i].on = !state[i].on; draw(); }, { signal: ctx.signal }));
      allBtn.addEventListener("click", () => {
        focusOn = !focusOn;
        state.forEach((x, i) => { x.on = focusOn ? i < 3 : false; });
        draw();
      }, { signal: ctx.signal });
      draw();
    },
  });
})();
