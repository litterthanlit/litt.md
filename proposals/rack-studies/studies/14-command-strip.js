/* 14-command-strip.js — Instant Command Strip:
   Zero-animation cut command input + dense rows with clip-colored category tags and keycaps,
   0ms frame-snapped row inversion, and live filtering. */
(function () {
  const S = ".rs-command-strip";
  const CMDS = [
    { name: "Launch scene 2: Patch + Verify", cat: "Session", hue: "teal", key: "⌘2" },
    { name: "Switch model router → Fast", cat: "Router", hue: "amber", key: "⌘R" },
    { name: "Run eval suite (64 cases)", cat: "Eval", hue: "violet", key: "⌘E" },
    { name: "Trim context budget to 60%", cat: "Mixer", hue: "blue", key: "⌘T" },
    { name: "Approve pending shell_exec gate", cat: "Gate", hue: "green", key: "⌘Y" },
    { name: "Reset all macro knobs to home", cat: "Rack", hue: "amber", key: "⌘0" },
  ];

  RackPlayer.register({
    slug: "command-strip",
    title: "Instant Command Strip",
    category: "control",
    tagline: "Zero-animation command input with clip-colored tags, keycaps, and 0ms frame-snapped inversion.",
    motion: "0ms filter · 0ms row inversion",
    css: `
${S} .cs { width: min(100%, 640px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .cs-inbar {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px;
  padding: 5px 8px; background: var(--cut); border: 1px solid var(--ink); border-radius: var(--r-control);
}
${S} .cs-prompt { font: 600 11px/1 var(--mono); padding: 3px 5px; background: var(--accent); color: var(--on-accent); border: 1px solid var(--ink); border-radius: 2px; }
${S} .cs-in { border: 0; background: transparent; outline: none; font: 500 12px/1.2 var(--mono); min-width: 0; }
${S} .cs-list { display: grid; gap: 2px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control); padding: 4px; }
${S} .cs-row {
  display: grid; grid-template-columns: 62px 1fr auto; align-items: center; gap: 8px;
  padding: 6px 7px; border: 1px solid transparent; border-radius: var(--r-control);
  background: var(--surface-2); text-align: left; cursor: pointer;
}
${S} .cs-row.is-sel { background: var(--ink); color: var(--on-ink); border-color: var(--ink); }
${S} .cs-tag {
  font: 600 9px/1 var(--mono); text-transform: uppercase; text-align: center;
  padding: 3px 5px; border: 1px solid var(--outline); border-radius: 2px;
}
${S} .cs-tag[data-h="teal"] { background: var(--teal-tint); color: var(--teal-text); }
${S} .cs-tag[data-h="amber"] { background: var(--amber-tint); color: var(--amber-text); }
${S} .cs-tag[data-h="violet"] { background: var(--violet-tint); color: var(--violet-text); }
${S} .cs-tag[data-h="blue"] { background: var(--blue-tint); color: var(--blue-text); }
${S} .cs-tag[data-h="green"] { background: var(--green-tint); color: var(--green-text); }
${S} .cs-txt { font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .cs-key {
  font: 600 10px/1 var(--mono); padding: 3px 5px; border: 1px solid var(--border); border-radius: 2px;
  background: var(--block); color: var(--ink);
}
${S} .cs-row.is-sel .cs-key { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
${S} .cs-foot { display: flex; justify-content: space-between; font: 500 10px/1 var(--mono); color: var(--muted); padding: 1px 4px 0; }
${S}.is-tile .cs-row:nth-child(n+5) { display: none; }
${S}.is-tile .cs-row { padding: 4px 6px; gap: 6px; }
${S}.is-tile .cs-txt { font-size: 11px; }
`,
    mount(host, ctx) {
      let query = "";
      let sel = 0;
      let ran = "READY · ↑↓ SELECT · ENTER RUN";

      host.innerHTML =
        '<div class="cs">' +
          '<div class="cs-inbar">' +
            '<span class="cs-prompt">CMD</span>' +
            '<input class="cs-in" id="cs-in" type="text" placeholder="Filter Rack commands..." autocomplete="off" aria-label="Filter commands">' +
            '<span class="rk-mono" style="font-size:10px;color:var(--muted)" id="cs-cnt"></span>' +
          '</div>' +
          '<div class="cs-list" id="cs-list" data-col></div>' +
          '<div class="cs-foot"><span id="cs-ran"></span><span>0ms SNAP</span></div>' +
        '</div>';

      const inEl = host.querySelector("#cs-in");
      const listEl = host.querySelector("#cs-list");
      const cntEl = host.querySelector("#cs-cnt");
      const ranEl = host.querySelector("#cs-ran");

      function filtered() {
        const q = query.trim().toLowerCase();
        return q ? CMDS.filter((c) => (c.name + " " + c.cat).toLowerCase().includes(q)) : CMDS;
      }

      function draw() {
        const rows = filtered();
        if (sel >= rows.length) sel = Math.max(0, rows.length - 1);
        cntEl.textContent = rows.length + " / " + CMDS.length;
        ranEl.textContent = ran;
        listEl.innerHTML = rows.map((c, i) =>
          '<button type="button" class="cs-row' + (i === sel ? ' is-sel' : '') + '" data-i="' + i + '">' +
            '<span class="cs-tag" data-h="' + c.hue + '">' + c.cat + '</span>' +
            '<span class="cs-txt">' + c.name + '</span>' +
            '<kbd class="cs-key">' + c.key + '</kbd>' +
          '</button>'
        ).join("") || '<div style="padding:10px;font:500 11px var(--mono);color:var(--muted)">NO MATCHING COMMAND</div>';
        listEl.querySelectorAll(".cs-row").forEach((b) => {
          b.addEventListener("pointerenter", () => { sel = +b.dataset.i; draw(); });
          b.addEventListener("click", () => {
            const item = rows[+b.dataset.i];
            if (item) { ran = "EXECUTED · " + item.name.toUpperCase(); draw(); }
          });
        });
      }

      inEl.addEventListener("input", () => { query = inEl.value; sel = 0; draw(); }, { signal: ctx.signal });
      inEl.addEventListener("keydown", (e) => {
        const rows = filtered();
        if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, rows.length); draw(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + rows.length) % Math.max(1, rows.length); draw(); }
        else if (e.key === "Enter" && rows[sel]) { e.preventDefault(); ran = "EXECUTED · " + rows[sel].name.toUpperCase(); draw(); }
      }, { signal: ctx.signal });

      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(1200, () => {
        if (!auto) return;
        sel = (sel + 1) % 4;
        draw();
      });
    },
  });
})();
