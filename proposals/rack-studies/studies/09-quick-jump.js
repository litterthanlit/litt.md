/* 09-quick-jump.js — Quick Jump:
   Spacious 0ms command jump box with four clean layer-tagged actions and crisp keyboard caps. */
(function () {
  const S = ".rs-quick-jump";
  const ACTIONS = [
    { name: "Start a fresh canvas", tag: "Design", hue: "pink", key: "⌘N" },
    { name: "Switch to dark studio", tag: "Theme", hue: "purple", key: "⌘D" },
    { name: "Share live preview", tag: "Share", hue: "blue", key: "⌘S" },
    { name: "Run quality check", tag: "Check", hue: "green", key: "⌘K" },
  ];

  RackPlayer.register({
    slug: "quick-jump",
    title: "Quick Jump",
    tagline: "Type to filter and jump anywhere on the frame — zero animation lag.",
    css: `
${S} .qj-in {
  flex: 1; min-width: 0; height: 22px; padding: 0 7px; border: 0; border-radius: var(--r-control);
  background: var(--cut); box-shadow: var(--edge); outline: none; font-size: 11px;
}
${S} .qj-list { display: grid; gap: 4px; }
${S} .qj-row {
  display: grid; grid-template-columns: 56px 1fr auto; align-items: center; gap: 8px;
  padding: 6px 7px; border: 0; border-radius: var(--r-control); background: transparent;
  text-align: left; cursor: pointer; font-size: 12px; transition: none;
}
${S} .qj-row.is-sel { background: var(--ink); color: var(--panel); }
${S} .qj-tag { padding: 3px 0; text-align: center; font-size: 10px; }
${S} .qj-cap {
  font: 600 10px/1 var(--mono); padding: 3px 5px; border-radius: var(--r-control);
  background: var(--block); box-shadow: var(--edge); color: var(--ink);
}
${S} .qj-row.is-sel .qj-cap { background: var(--accent); color: var(--accent-fg); box-shadow: none; }
${S}.is-tile .qj-row { padding: 5px 6px; font-size: 11px; }
`,
    mount(host, ctx) {
      let query = "", sel = 0;

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><input class="qj-in" id="qj-in" type="text" placeholder="Jump to action..." autocomplete="off" aria-label="Jump to action"><span class="rk-box" id="qj-st">Ready</span></div>' +
          '<div class="rk-surf"><div class="qj-list" id="qj-list"></div></div>' +
        '</div>';

      const inp = host.querySelector("#qj-in");
      const list = host.querySelector("#qj-list");
      const st = host.querySelector("#qj-st");

      const items = () => {
        const q = query.trim().toLowerCase();
        return q ? ACTIONS.filter((a) => (a.name + " " + a.tag).toLowerCase().includes(q)) : ACTIONS;
      };

      function draw() {
        const rows = items();
        if (sel >= rows.length) sel = Math.max(0, rows.length - 1);
        list.innerHTML = rows.map((a, i) =>
          '<button type="button" class="qj-row' + (i === sel ? ' is-sel' : '') + '" data-i="' + i + '">' +
            '<span class="ly qj-tag" data-h="' + a.hue + '">' + a.tag + '</span>' +
            '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + a.name + '</span>' +
            '<kbd class="qj-cap">' + a.key + '</kbd>' +
          '</button>'
        ).join("") || '<div style="padding:12px;font-size:11px;color:var(--muted)">No matching action</div>';
        list.querySelectorAll(".qj-row").forEach((b) => {
          b.addEventListener("pointerenter", () => { sel = +b.dataset.i; draw(); });
          b.addEventListener("click", () => { st.textContent = rows[+b.dataset.i].tag + " ✓"; });
        });
      }

      inp.addEventListener("input", () => { query = inp.value; sel = 0; draw(); }, { signal: ctx.signal });
      inp.addEventListener("keydown", (e) => {
        const rows = items();
        if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, rows.length); draw(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + rows.length) % Math.max(1, rows.length); draw(); }
        else if (e.key === "Enter" && rows[sel]) { e.preventDefault(); st.textContent = rows[sel].tag + " ✓"; }
      }, { signal: ctx.signal });
      draw();

      let ghost = !ctx.reduced();
      ctx.onHand(() => { ghost = false; });
      if (ghost) ctx.every(1600, () => { if (!ghost) return; sel = (sel + 1) % ACTIONS.length; draw(); });
    },
  });
})();
