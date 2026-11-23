/* 06-segmented-switch.js — Segmented Switchboard:
   Crisp square segmented mode chooser + mechanical 0ms toggle keys that invert to electric yellow / emerald. */
(function () {
  const S = ".rs-segmented-switch";
  const ROWS = [
    { name: "Auto-run tests", sub: "Verify after every patch", hue: "emerald", on: true },
    { name: "Stream tool diffs", sub: "Live token-by-token view", hue: "blue", on: true },
    { name: "Require gate on push", sub: "Pause before git push", hue: "yellow", on: true },
  ];

  RackPlayer.register({
    slug: "segmented-switch",
    title: "Segmented Switchboard",
    category: "control",
    tagline: "Square segmented mode chooser and 0ms mechanical switches — no sliding jelly pills.",
    motion: "0ms state invert · 0.98 press",
    css: `
${S} .ss {
  width: min(100%, 400px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); padding: 14px; display: grid; gap: 12px;
}
${S} .ss-mode { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--border-strong); border-radius: var(--r-control); overflow: hidden; }
${S} .ss-mode button {
  height: 30px; border: 0; border-right: 1px solid var(--border-strong); background: var(--block);
  font-size: 12px; font-weight: 500; cursor: pointer;
}
${S} .ss-mode button:last-child { border-right: 0; }
${S} .ss-mode button[aria-checked="true"] { background: var(--accent); color: var(--on-accent); font-weight: 600; }
${S} .ss-list { display: grid; gap: 6px; }
${S} .ss-row {
  display: flex; justify-content: space-between; align-items: center; gap: 10px;
  padding: 8px 10px; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r-control);
}
${S} .ss-n { font-size: 13px; font-weight: 600; }
${S} .ss-s { font-size: 11px; color: var(--muted); }
${S} .ss-key {
  width: 52px; height: 26px; border: 1px solid var(--border-strong); border-radius: var(--r-control);
  background: var(--block); font: 600 10px/1 var(--mono); cursor: pointer; flex: none;
}
${S} .ss-key.is-on[data-h="emerald"] { background: var(--emerald); color: #fff; border-color: var(--emerald); }
${S} .ss-key.is-on[data-h="blue"] { background: var(--blue); color: #fff; border-color: var(--blue); }
${S} .ss-key.is-on[data-h="yellow"] { background: var(--accent); color: var(--on-accent); border-color: var(--border-strong); }
${S}.is-tile .ss { padding: 10px; gap: 8px; }
${S}.is-tile .ss-mode button { height: 25px; font-size: 11px; }
${S}.is-tile .ss-row { padding: 6px 8px; }
${S}.is-tile .ss-n { font-size: 12px; }
${S}.is-tile .ss-s { display: none; }
${S}.is-tile .ss-key { width: 44px; height: 22px; }
`,
    mount(host, ctx) {
      let mode = 1;
      const state = ROWS.map((r) => r.on);

      host.innerHTML =
        '<div class="ss" data-col>' +
          '<div class="ss-mode" role="radiogroup" aria-label="Execution profile">' +
            '<button type="button" role="radio" data-m="0">Fast</button>' +
            '<button type="button" role="radio" data-m="1">Balanced</button>' +
            '<button type="button" role="radio" data-m="2">Strict</button>' +
          '</div>' +
          '<div class="ss-list">' +
            ROWS.map((r, i) =>
              '<div class="ss-row">' +
                '<div><div class="ss-n">' + r.name + '</div><div class="ss-s">' + r.sub + '</div></div>' +
                '<button type="button" class="ss-key" data-i="' + i + '" data-h="' + r.hue + '"></button>' +
              '</div>'
            ).join("") +
          '</div>' +
        '</div>';

      const mBtns = [...host.querySelectorAll("[data-m]")];
      const keys = [...host.querySelectorAll(".ss-key")];

      function draw() {
        mBtns.forEach((b, i) => b.setAttribute("aria-checked", String(i === mode)));
        keys.forEach((k, i) => {
          const on = state[i];
          k.classList.toggle("is-on", on);
          k.textContent = on ? "ON" : "OFF";
          k.setAttribute("aria-pressed", String(on));
        });
      }

      const profiles = [[false, true, false], [true, true, true], [true, false, true]];
      mBtns.forEach((b) => b.addEventListener("click", () => {
        mode = +b.dataset.m;
        profiles[mode].forEach((v, i) => { state[i] = v; });
        draw();
      }, { signal: ctx.signal }));
      keys.forEach((k) => k.addEventListener("click", () => {
        const i = +k.dataset.i; state[i] = !state[i]; draw();
      }, { signal: ctx.signal }));
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(1900, () => {
        if (!auto) return;
        mode = (mode + 1) % 3;
        profiles[mode].forEach((v, i) => { state[i] = v; });
        draw();
      });
    },
  });
})();
