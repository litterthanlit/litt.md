/* 03-agent-indicators.js — Agent Indicators:
   4 crisp zero-blur agent working-state indicators on Rack's square grid with vivid high-chroma fills. */
(function () {
  const S = ".rs-agent-indicators";
  const MODES = [
    { id: "matrix", label: "Matrix", hue: "blue", text: "Searching 14 files" },
    { id: "scan", label: "Scan", hue: "violet", text: "Indexing symbol graph" },
    { id: "bars", label: "Tokens", hue: "emerald", text: "Streaming 142 tok/s" },
    { id: "gate", label: "Verify", hue: "coral", text: "Running 18 assertions" },
  ];

  RackPlayer.register({
    slug: "agent-indicators",
    title: "Agent Indicators",
    category: "agent",
    tagline: "Four crisp square working-state loaders — discrete step pulses with zero blur or glow.",
    motion: "120ms discrete frame step · 0ms mode swap",
    css: `
${S} .ai {
  width: min(100%, 400px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); padding: 18px 16px; display: grid; gap: 16px; justify-items: center;
}
${S} .ai-stage { display: flex; align-items: center; gap: 12px; min-height: 44px; }
${S} .ai-glyph { display: grid; place-items: center; width: 34px; height: 34px; }
${S} .ai-mat { display: grid; grid-template-columns: repeat(3, 8px); gap: 3px; }
${S} .ai-mat i { width: 8px; height: 8px; background: var(--surface-3); border-radius: 1px; }
${S} .ai-mat i.is-hi { background: var(--blue); }
${S} .ai-mat i.is-mid { background: var(--blue-tint); border: 1px solid var(--blue); }
${S} .ai-scan { display: grid; grid-template-columns: repeat(6, 5px); gap: 2px; align-items: center; }
${S} .ai-scan i { height: 20px; background: var(--surface-3); border-radius: 1px; }
${S} .ai-scan i.is-hi { background: var(--violet); }
${S} .ai-scan i.is-mid { background: var(--violet-tint); border: 1px solid var(--violet); }
${S} .ai-bars { display: flex; align-items: flex-end; gap: 3px; height: 24px; }
${S} .ai-bars i { width: 6px; background: var(--emerald); border-radius: 1px; }
${S} .ai-gate { display: grid; grid-template-columns: repeat(2, 12px); gap: 3px; }
${S} .ai-gate i { width: 12px; height: 12px; border: 1px solid var(--border); border-radius: 1px; background: var(--surface-2); }
${S} .ai-gate i.is-hi { background: var(--accent); border-color: var(--border-strong); }
${S} .ai-gate i.is-ok { background: var(--coral); border-color: var(--coral); }
${S} .ai-txt { font-size: 14px; font-weight: 600; }
${S} .ai-sub { font: 500 11px/1 var(--mono); color: var(--muted); margin-top: 3px; }
${S}.is-tile .ai { padding: 14px 12px; gap: 12px; }
${S}.is-tile .rk-seg button { height: 24px; padding: 0 8px; font-size: 11px; }
`,
    mount(host, ctx) {
      let cur = 0;
      let tick = 0;

      host.innerHTML =
        '<div class="ai" data-col>' +
          '<div class="ai-stage">' +
            '<div class="ai-glyph" id="ai-g"></div>' +
            '<div><div class="ai-txt" id="ai-txt"></div><div class="ai-sub" id="ai-sub"></div></div>' +
          '</div>' +
          '<div class="rk-seg is-yellow" role="radiogroup" aria-label="Indicator style">' +
            MODES.map((m, i) => '<button type="button" role="radio" data-i="' + i + '" aria-checked="' + (i === cur) + '">' + m.label + '</button>').join("") +
          '</div>' +
        '</div>';

      const gEl = host.querySelector("#ai-g");
      const txtEl = host.querySelector("#ai-txt");
      const subEl = host.querySelector("#ai-sub");
      const btns = [...host.querySelectorAll("[role=radio]")];

      function draw() {
        const m = MODES[cur];
        btns.forEach((b, i) => b.setAttribute("aria-checked", String(i === cur)));
        txtEl.textContent = m.text;
        subEl.textContent = "FRAME " + String((tick % 9) + 1).padStart(2, "0") + " · DISCRETE STEP";
        if (m.id === "matrix") {
          const order = [0, 1, 2, 5, 8, 7, 6, 3, 4];
          const hi = order[tick % order.length], mid = order[(tick + 8) % order.length];
          gEl.innerHTML = '<div class="ai-mat">' + Array.from({ length: 9 }, (_, i) => '<i class="' + (i === hi ? 'is-hi' : i === mid ? 'is-mid' : '') + '"></i>').join("") + '</div>';
        } else if (m.id === "scan") {
          const pos = tick % 6, prev = (pos + 5) % 6;
          gEl.innerHTML = '<div class="ai-scan">' + Array.from({ length: 6 }, (_, i) => '<i class="' + (i === pos ? 'is-hi' : i === prev ? 'is-mid' : '') + '"></i>').join("") + '</div>';
        } else if (m.id === "bars") {
          const hs = [10, 22, 16, 24].map((h, i) => 6 + ((h + tick * 5 + i * 7) % 18));
          gEl.innerHTML = '<div class="ai-bars">' + hs.map((h) => '<i style="height:' + h + 'px"></i>').join("") + '</div>';
        } else {
          const pos = tick % 4;
          gEl.innerHTML = '<div class="ai-gate">' + Array.from({ length: 4 }, (_, i) => '<i class="' + (i === pos ? 'is-hi' : i < pos ? 'is-ok' : '') + '"></i>').join("") + '</div>';
        }
      }

      btns.forEach((b) => b.addEventListener("click", () => { cur = +b.dataset.i; draw(); }, { signal: ctx.signal }));
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (!ctx.reduced()) ctx.every(140, () => { tick++; draw(); });
      if (auto) ctx.every(2400, () => { if (!auto) return; cur = (cur + 1) % MODES.length; draw(); });
    },
  });
})();
