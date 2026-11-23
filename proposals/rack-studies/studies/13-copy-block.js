/* 13-copy-block.js — Streaming Copy Block:
   Crisp mono command/snippet card with format switcher (CLI / curl / TS) and instant 0ms Copy -> yellow Copied flip. */
(function () {
  const S = ".rs-copy-block";
  const FORMATS = [
    { id: "cli", label: "CLI", hue: "blue", code: "npx litt-md init --world rack --theme light" },
    { id: "curl", label: "curl", hue: "violet", code: "curl -s https://litt.md/tokens/rack.css -o tokens.css" },
    { id: "ts", label: "TS", hue: "emerald", code: "import { rack } from '@litt-md/tokens'; apply(rack);" },
  ];

  RackPlayer.register({
    slug: "copy-block",
    title: "Streaming Copy Block",
    category: "control",
    tagline: "Mono snippet bar with instant format switching and a 0ms Copy → yellow Copied key flip.",
    motion: "0ms format switch · 0ms key flip",
    css: `
${S} .cbk {
  width: min(100%, 460px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); overflow: hidden; display: grid;
}
${S} .cbk-hd {
  display: flex; justify-content: space-between; align-items: center; padding: 6px 8px;
  background: var(--surface-2); border-bottom: 1px solid var(--line);
}
${S} .cbk-tabs { display: flex; gap: 4px; }
${S} .cbk-tab {
  height: 24px; padding: 0 9px; border: 1px solid var(--border); border-radius: var(--r-control);
  background: var(--block); font: 600 10px/1 var(--mono); cursor: pointer;
}
${S} .cbk-tab.is-on[data-h="blue"] { background: var(--blue); color: #fff; border-color: var(--blue); }
${S} .cbk-tab.is-on[data-h="violet"] { background: var(--violet); color: #fff; border-color: var(--violet); }
${S} .cbk-tab.is-on[data-h="emerald"] { background: var(--emerald); color: #fff; border-color: var(--emerald); }
${S} .cbk-body {
  display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px;
  padding: 14px 12px;
}
${S} .cbk-code {
  font: 500 12px/1.35 var(--mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
${S} .cbk-copy { min-width: 78px; }
${S}.is-tile .cbk-body { padding: 10px; gap: 8px; }
${S}.is-tile .cbk-code { font-size: 11px; }
`,
    mount(host, ctx) {
      let cur = 0, copied = false, timer = 0;

      host.innerHTML =
        '<div class="cbk" data-col>' +
          '<div class="cbk-hd">' +
            '<div class="cbk-tabs">' +
              FORMATS.map((f, i) => '<button type="button" class="cbk-tab" data-i="' + i + '" data-h="' + f.hue + '">' + f.label + '</button>').join("") +
            '</div>' +
            '<span class="rk-mono" style="font-size:10px;color:var(--muted)">UTF-8 · READY</span>' +
          '</div>' +
          '<div class="cbk-body">' +
            '<code class="cbk-code" id="cbk-code"></code>' +
            '<button type="button" class="rk-btn cbk-copy" id="cbk-copy">Copy</button>' +
          '</div>' +
        '</div>';

      const tabs = [...host.querySelectorAll(".cbk-tab")];
      const code = host.querySelector("#cbk-code");
      const btn = host.querySelector("#cbk-copy");

      function draw() {
        const f = FORMATS[cur];
        tabs.forEach((t, i) => t.classList.toggle("is-on", i === cur));
        code.textContent = f.code;
        btn.classList.toggle("is-accent", copied);
        btn.textContent = copied ? "Copied ✓" : "Copy";
      }

      tabs.forEach((t) => t.addEventListener("click", () => { cur = +t.dataset.i; copied = false; draw(); }, { signal: ctx.signal }));
      btn.addEventListener("click", () => {
        copied = true; draw();
        try { navigator.clipboard && navigator.clipboard.writeText(FORMATS[cur].code); } catch (e) {}
        clearTimeout(timer);
        timer = ctx.after(1400, () => { copied = false; draw(); });
      }, { signal: ctx.signal });
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2200, () => {
        if (!auto) return;
        if (!copied) { copied = true; }
        else { copied = false; cur = (cur + 1) % FORMATS.length; }
        draw();
      });
    },
  });
})();
