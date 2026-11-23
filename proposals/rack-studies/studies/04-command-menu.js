/* 04-command-menu.js — Command Menu:
   Instant 0ms-open command input, vivid square category tags, shortcut caps, and 0ms row inversion. */
(function () {
  const S = ".rs-command-menu";
  const ITEMS = [
    { name: "Run verification suite (18 checks)", cat: "EVAL", hue: "emerald", key: "⌘E" },
    { name: "Open pending diff in tokens.css", cat: "DIFF", hue: "coral", key: "⌘D" },
    { name: "Compact agent context window", cat: "AGENT", hue: "blue", key: "⌘K" },
    { name: "Switch tool permissions to Ask", cat: "GATE", hue: "violet", key: "⌘P" },
    { name: "Inspect last 4 tool calls", cat: "TRACE", hue: "pink", key: "⌘T" },
  ];

  RackPlayer.register({
    slug: "command-menu",
    title: "Command Menu",
    category: "control",
    tagline: "Zero-animation command palette with electric category tags, keycaps, and 0ms row inversion.",
    motion: "0ms open · 0ms filter · 0ms selection",
    css: `
${S} .cm {
  width: min(100%, 480px); background: var(--cut); border: 1px solid var(--border-strong);
  border-radius: var(--r-panel); overflow: hidden; display: grid;
}
${S} .cm-top {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px;
  padding: 8px 10px; border-bottom: 1px solid var(--line); background: var(--panel);
}
${S} .cm-k {
  font: 600 10px/1 var(--mono); padding: 4px 6px; background: var(--accent); color: var(--on-accent);
  border: 1px solid var(--border-strong); border-radius: var(--r-control);
}
${S} .cm-in { border: 0; background: transparent; outline: none; font: 500 13px/1.2 var(--font); min-width: 0; }
${S} .cm-list { display: grid; padding: 4px; gap: 2px; }
${S} .cm-row {
  display: grid; grid-template-columns: 52px 1fr auto; align-items: center; gap: 8px;
  padding: 7px 8px; border: 1px solid transparent; border-radius: var(--r-control);
  background: transparent; text-align: left; cursor: pointer;
}
${S} .cm-row.is-sel { background: var(--ink); color: var(--on-ink); }
${S} .cm-tag {
  font: 600 9px/1 var(--mono); text-align: center; padding: 3px 4px; border-radius: var(--r-control);
  color: #fff;
}
${S} .cm-tag[data-h="emerald"] { background: var(--emerald); }
${S} .cm-tag[data-h="coral"] { background: var(--coral); }
${S} .cm-tag[data-h="blue"] { background: var(--blue); }
${S} .cm-tag[data-h="violet"] { background: var(--violet); }
${S} .cm-tag[data-h="pink"] { background: var(--pink); }
${S} .cm-txt { font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .cm-key {
  font: 600 10px/1 var(--mono); padding: 3px 5px; border: 1px solid var(--border);
  border-radius: var(--r-control); background: var(--surface-2); color: var(--ink);
}
${S} .cm-row.is-sel .cm-key { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
${S} .cm-foot {
  display: flex; justify-content: space-between; padding: 6px 10px;
  border-top: 1px solid var(--line); background: var(--surface-2); font: 500 10px/1 var(--mono); color: var(--muted);
}
${S}.is-tile .cm-row:nth-child(n+5) { display: none; }
${S}.is-tile .cm-row { padding: 5px 7px; }
${S}.is-tile .cm-top { padding: 6px 8px; }
`,
    mount(host, ctx) {
      let q = "", sel = 1, last = "↑↓ MOVE · ⏎ RUN";

      host.innerHTML =
        '<div class="cm" data-col>' +
          '<div class="cm-top">' +
            '<span class="cm-k">CMD</span>' +
            '<input class="cm-in" id="cm-in" type="text" placeholder="Search commands..." autocomplete="off" aria-label="Search commands">' +
            '<span class="rk-mono" style="font-size:10px;color:var(--muted)" id="cm-cnt"></span>' +
          '</div>' +
          '<div class="cm-list" id="cm-list"></div>' +
          '<div class="cm-foot"><span id="cm-last"></span><span>0MS SNAP</span></div>' +
        '</div>';

      const inEl = host.querySelector("#cm-in");
      const listEl = host.querySelector("#cm-list");
      const cntEl = host.querySelector("#cm-cnt");
      const lastEl = host.querySelector("#cm-last");

      const rowsOf = () => {
        const s = q.trim().toLowerCase();
        return s ? ITEMS.filter((x) => (x.name + " " + x.cat).toLowerCase().includes(s)) : ITEMS;
      };

      function draw() {
        const rows = rowsOf();
        if (sel >= rows.length) sel = Math.max(0, rows.length - 1);
        cntEl.textContent = rows.length + "/" + ITEMS.length;
        lastEl.textContent = last;
        listEl.innerHTML = rows.map((r, i) =>
          '<button type="button" class="cm-row' + (i === sel ? ' is-sel' : '') + '" data-i="' + i + '">' +
            '<span class="cm-tag" data-h="' + r.hue + '">' + r.cat + '</span>' +
            '<span class="cm-txt">' + r.name + '</span>' +
            '<kbd class="cm-key">' + r.key + '</kbd>' +
          '</button>'
        ).join("") || '<div style="padding:12px;font:500 11px var(--mono);color:var(--muted)">No matching commands</div>';
        listEl.querySelectorAll(".cm-row").forEach((b) => {
          b.addEventListener("pointerenter", () => { sel = +b.dataset.i; draw(); });
          b.addEventListener("click", () => { last = "RAN: " + rows[+b.dataset.i].cat; draw(); });
        });
      }

      inEl.addEventListener("input", () => { q = inEl.value; sel = 0; draw(); }, { signal: ctx.signal });
      inEl.addEventListener("keydown", (e) => {
        const rows = rowsOf();
        if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, rows.length); draw(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + rows.length) % Math.max(1, rows.length); draw(); }
        else if (e.key === "Enter" && rows[sel]) { e.preventDefault(); last = "RAN: " + rows[sel].cat; draw(); }
      }, { signal: ctx.signal });
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(1300, () => { if (!auto) return; sel = (sel + 1) % 4; draw(); });
    },
  });
})();
