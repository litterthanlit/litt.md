/* 02-agent-trace.js — Agent Trace Tree:
   Collapsible tool-call execution list with vivid square tool badges and 0ms detail expand. */
(function () {
  const S = ".rs-agent-trace";
  const CALLS = [
    { tool: "READ", hue: "blue", target: "skills/litt-md/assets/tokens.css", meta: "413 lines", ms: "38ms", detail: "Loaded light & dark token tables · 0 parse warnings" },
    { tool: "GREP", hue: "violet", target: "data-material=\"rack\"", meta: "14 matches", ms: "19ms", detail: "Found across tokens.css, check.mjs, and 3 component files" },
    { tool: "EDIT", hue: "coral", target: "proposals/rack-studies/shell.html", meta: "+48 -32", ms: "112ms", detail: "Updated bright neutral ramp & electric 5-hue series" },
    { tool: "TEST", hue: "emerald", target: "node scripts/check.mjs", meta: "18/18 pass", ms: "640ms", detail: "Contrast, APCA Lc 60, and theme parity all verified" },
  ];

  RackPlayer.register({
    slug: "agent-trace",
    title: "Agent Trace Tree",
    category: "agent",
    tagline: "Expandable tool-call rows with electric square tool tags and instant 0ms payload reveal.",
    motion: "0ms row expand · 0ms focus border",
    css: `
${S} .at {
  width: min(100%, 480px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); overflow: hidden; display: grid;
}
${S} .at-hd {
  display: flex; justify-content: space-between; align-items: center; padding: 8px 12px;
  background: var(--surface-2); border-bottom: 1px solid var(--line); font-size: 12px; font-weight: 600;
}
${S} .at-list { display: grid; }
${S} .at-item { border-bottom: 1px solid var(--line); }
${S} .at-item:last-child { border-bottom: 0; }
${S} .at-row {
  width: 100%; display: grid; grid-template-columns: 48px 1fr auto auto; align-items: center; gap: 8px;
  padding: 8px 12px; border: 0; background: transparent; text-align: left; cursor: pointer;
}
${S} .at-row:hover { background: var(--block-hover); }
${S} .at-tag {
  font: 600 9px/1 var(--mono); text-align: center; padding: 4px 0; border-radius: var(--r-control);
  color: #fff;
}
${S} .at-tag[data-h="blue"] { background: var(--blue); }
${S} .at-tag[data-h="violet"] { background: var(--violet); }
${S} .at-tag[data-h="coral"] { background: var(--coral); }
${S} .at-tag[data-h="emerald"] { background: var(--emerald); }
${S} .at-path { font: 500 12px/1.2 var(--mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .at-meta { font: 500 10px/1 var(--mono); color: var(--muted); white-space: nowrap; }
${S} .at-ms { font: 500 10px/1 var(--mono); color: var(--ink); white-space: nowrap; }
${S} .at-det {
  display: none; padding: 6px 12px 9px 68px; font: 400 11px/1.35 var(--mono); color: var(--muted);
  background: var(--surface-2); border-top: 1px solid var(--line);
}
${S} .at-item.is-open .at-det { display: block; }
${S} .at-item.is-open .at-row { background: var(--surface-2); }
${S}.is-tile .at-hd { padding: 6px 10px; font-size: 11px; }
${S}.is-tile .at-row { padding: 6px 9px; gap: 6px; grid-template-columns: 42px 1fr auto; }
${S}.is-tile .at-meta { display: none; }
${S}.is-tile .at-path { font-size: 11px; }
${S}.is-tile .at-det { padding: 5px 9px 6px 57px; font-size: 10px; }
`,
    mount(host, ctx) {
      let openIdx = 2;

      host.innerHTML =
        '<div class="at" data-col>' +
          '<div class="at-hd"><span>Run #408 · 4 tool calls</span><span class="rk-mono" style="font-size:11px;color:var(--emerald-text)">809ms</span></div>' +
          '<div class="at-list">' +
            CALLS.map((c, i) =>
              '<div class="at-item" data-i="' + i + '">' +
                '<button type="button" class="at-row" data-i="' + i + '">' +
                  '<span class="at-tag" data-h="' + c.hue + '">' + c.tool + '</span>' +
                  '<span class="at-path">' + c.target + '</span>' +
                  '<span class="at-meta">' + c.meta + '</span>' +
                  '<span class="at-ms">' + c.ms + '</span>' +
                '</button>' +
                '<div class="at-det">' + c.detail + '</div>' +
              '</div>'
            ).join("") +
          '</div>' +
        '</div>';

      const items = [...host.querySelectorAll(".at-item")];
      function draw() {
        items.forEach((el, i) => el.classList.toggle("is-open", i === openIdx));
      }
      host.querySelectorAll(".at-row").forEach((b) => b.addEventListener("click", () => {
        const i = +b.dataset.i;
        openIdx = openIdx === i ? -1 : i;
        draw();
      }, { signal: ctx.signal }));
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2000, () => {
        if (!auto) return;
        openIdx = (openIdx + 1) % CALLS.length;
        draw();
      });
    },
  });
})();
