/* 14-command-palette.js — Zero-animation Emil Kowalski / Raycast-style Rack command strip:
   1px-ruled input, instant filtering, 0ms frame-snapped row inversion, and monospace keycaps. */
(function () {
  const S = ".rs-command-palette";
  const CMDS = [
    { name: "Launch agent signal chain", cat: "Agent", hue: "violet", key: "⌘R" },
    { name: "Switch to Deep audit preset", cat: "Preset", hue: "amber", key: "⇧A" },
    { name: "Verify tokens & registry lock", cat: "Check", hue: "teal", key: "⌘V" },
    { name: "Compact context window", cat: "Memory", hue: "blue", key: "⌘K" },
    { name: "Export unit matrix CSV", cat: "Data", hue: "orchid", key: "⌘E" },
    { name: "Toggle light / dark theme", cat: "View", hue: "green", key: "T" },
  ];

  RackPlayer.register({
    slug: "command-palette",
    title: "Instant Cut Command Bar",
    category: "control",
    tagline: "Zero-animation command runner where active row inversion jumps on the exact frame.",
    motion: "0ms row inversion · 0ms filter cut · no bounce",
    css: `
${S} .cp { width: min(100%, 560px); border: 1px solid var(--border); background: var(--panel); display: grid; }
${S} .cp-in { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--border); background: var(--cut); }
${S} .cp-in span { font: 600 13px/1 var(--mono); color: var(--ink); }
${S} .cp-in input { flex: 1; min-width: 0; border: 0; background: transparent; outline: none; font-size: 13px; }
${S} .cp-list { display: grid; }
${S} .cp-row {
  border: 0; border-bottom: 1px solid var(--line); background: transparent;
  padding: 8px 10px; display: grid; grid-template-columns: 54px 1fr auto; align-items: center; gap: 10px;
  text-align: left; cursor: pointer; font-size: 12px;
}
${S} .cp-row:last-child { border-bottom: 0; }
${S} .cp-row.is-on { background: var(--ink); color: var(--on-ink); font-weight: 500; }
${S} .cp-cat { font: 600 9px/1 var(--mono); padding: 3px 5px; text-align: center; text-transform: uppercase; }
${S} .cp-cat[data-h="violet"] { background: var(--violet-tint); color: var(--violet-text); }
${S} .cp-cat[data-h="amber"] { background: var(--amber-tint); color: var(--amber-text); }
${S} .cp-cat[data-h="teal"] { background: var(--teal-tint); color: var(--teal-text); }
${S} .cp-cat[data-h="blue"] { background: var(--blue-tint); color: var(--blue-text); }
${S} .cp-cat[data-h="orchid"] { background: var(--orchid-tint); color: var(--orchid-text); }
${S} .cp-cat[data-h="green"] { background: var(--green-tint); color: var(--green-text); }
${S} .cp-row.is-on .cp-cat { background: var(--accent); color: var(--on-accent); }
${S} .cp-key { font: 500 10px/1 var(--mono); padding: 3px 5px; border: 1px solid var(--border-soft); }
${S} .cp-row.is-on .cp-key { border-color: currentColor; }
${S} .cp-foot { padding: 7px 10px; border-top: 1px solid var(--border); background: var(--surface-2); display: flex; justify-content: space-between; font: 500 11px/1 var(--mono); color: var(--muted); }
${S} .cp-foot b { color: var(--ink); }
${S}.is-tile .cp-row:nth-child(n+5) { display: none; }
${S}.is-tile .cp-row { padding: 6px 8px; font-size: 11px; }
${S}.is-tile .cp-foot { font-size: 10px; padding: 5px 8px; }
`,
    mount(host, ctx) {
      let query = "", active = 0, ran = "Ready · press Enter or click a row";
      host.innerHTML =
        '<div class="cp">' +
          '<div class="cp-in"><span>&gt;</span><input type="text" placeholder="Filter commands…" aria-label="Filter commands"></div>' +
          '<div class="cp-list" role="listbox"></div>' +
          '<div class="cp-foot"><span id="cp-ran"></span><span>↑↓ · ↵ RUN</span></div>' +
        '</div>';

      const input = host.querySelector("input");
      const list = host.querySelector(".cp-list");
      const ranEl = host.querySelector("#cp-ran");

      function matches() {
        const q = query.trim().toLowerCase();
        return q ? CMDS.filter((c) => c.name.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q)) : CMDS;
      }

      function draw() {
        const items = matches();
        if (active >= items.length) active = Math.max(0, items.length - 1);
        list.innerHTML = items.length ? items.map((c, i) =>
          '<button type="button" class="cp-row' + (i === active ? ' is-on' : '') + '" role="option" aria-selected="' + (i === active) + '" data-i="' + i + '">' +
            '<span class="cp-cat" data-h="' + c.hue + '">' + c.cat + '</span>' +
            '<span>' + c.name + '</span>' +
            '<kbd class="cp-key">' + c.key + '</kbd>' +
          '</button>'
        ).join("") : '<div style="padding:12px 10px;color:var(--muted);font-size:12px">No matching commands.</div>';

        [...list.querySelectorAll(".cp-row")].forEach((b, i) => {
          b.addEventListener("pointerenter", () => { active = i; draw(); }, { signal: ctx.signal });
          b.addEventListener("click", () => { ran = "RAN: " + items[i].name; draw(); }, { signal: ctx.signal });
        });
        ranEl.innerHTML = "<b>" + ran + "</b>";
      }

      input.addEventListener("input", () => { query = input.value; active = 0; draw(); }, { signal: ctx.signal });
      input.addEventListener("keydown", (e) => {
        const items = matches();
        if (!items.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % items.length; draw(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + items.length) % items.length; draw(); }
        else if (e.key === "Enter") { e.preventDefault(); ran = "RAN: " + items[active].name; draw(); }
      }, { signal: ctx.signal });

      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) {
        ctx.every(1100, () => {
          if (!auto) return;
          active = (active + 1) % 4;
          draw();
        });
      }
    },
  });
})();
