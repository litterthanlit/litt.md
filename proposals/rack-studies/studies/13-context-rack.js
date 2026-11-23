/* 13-context-rack.js — Dense modular context attachment rack: colored source chips,
   instant On/Off switches, segmented multi-hue capacity bar, and one-frame Compact action. */
(function () {
  const S = ".rs-context-rack";
  const MAX_K = 128;
  const SOURCES = [
    { name: "skills/litt-md/assets/tokens.css", tag: "Core", hue: "violet", tok: 24.4, on: true, prio: 1 },
    { name: "gallery/src/components/agent-chain.tsx", tag: "Code", hue: "blue", tok: 14.2, on: true, prio: 1 },
    { name: "proposals/rack.md", tag: "Spec", hue: "teal", tok: 8.6, on: true, prio: 2 },
    { name: "git diff origin/main..HEAD", tag: "Diff", hue: "amber", tok: 19.8, on: true, prio: 1 },
    { name: "playwright wall-shard-1.log", tag: "Logs", hue: "orchid", tok: 28.0, on: false, prio: 3 },
    { name: "web: design-engineering notes", tag: "Web", hue: "green", tok: 11.4, on: false, prio: 3 },
  ];

  RackPlayer.register({
    slug: "context-rack",
    title: "Context Window Rack",
    category: "agent",
    tagline: "Attach or bypass context sources on the frame with a multi-hue capacity bar.",
    motion: "0ms attach toggle · 140ms bar snap · zero bounce",
    css: `
${S} .cr { width: min(100%, 700px); border: 1px solid var(--border); background: var(--panel); display: grid; }
${S} .cr-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 8px; padding: 9px 10px; border-bottom: 1px solid var(--border); background: var(--surface-2); }
${S} .cr-fig { font: 600 22px/1 var(--font); letter-spacing: -0.03em; }
${S} .cr-sub { font: 500 11px/1 var(--mono); color: var(--muted); }
${S} .cr-bar { display: flex; height: 14px; border-bottom: 1px solid var(--border); background: var(--slot); }
${S} .cr-seg { height: 100%; transition: width var(--dur-snap) ease-out; }
${S} .cr-seg[data-h="violet"] { background: var(--violet); }
${S} .cr-seg[data-h="blue"] { background: var(--blue); }
${S} .cr-seg[data-h="teal"] { background: var(--teal); }
${S} .cr-seg[data-h="amber"] { background: var(--amber); }
${S} .cr-seg[data-h="orchid"] { background: var(--orchid); }
${S} .cr-seg[data-h="green"] { background: var(--green); }
${S} .cr-list { display: grid; }
${S} .cr-row { display: grid; grid-template-columns: 44px 54px 1fr 56px; align-items: center; gap: 8px; padding: 7px 10px; border-bottom: 1px solid var(--line); }
${S} .cr-row:last-child { border-bottom: 0; }
${S} .cr-row.is-off { opacity: 0.48; }
${S} .cr-sw { height: 22px; border: 1px solid var(--border); background: var(--block); font: 600 10px/1 var(--mono); cursor: pointer; }
${S} .cr-sw[aria-pressed="true"] { background: var(--ink); color: var(--on-ink); }
${S} .cr-tag { font: 600 10px/1 var(--mono); padding: 4px 5px; text-align: center; text-transform: uppercase; }
${S} .cr-tag[data-h="violet"] { background: var(--violet-tint); color: var(--violet-text); }
${S} .cr-tag[data-h="blue"] { background: var(--blue-tint); color: var(--blue-text); }
${S} .cr-tag[data-h="teal"] { background: var(--teal-tint); color: var(--teal-text); }
${S} .cr-tag[data-h="amber"] { background: var(--amber-tint); color: var(--amber-text); }
${S} .cr-tag[data-h="orchid"] { background: var(--orchid-tint); color: var(--orchid-text); }
${S} .cr-tag[data-h="green"] { background: var(--green-tint); color: var(--green-text); }
${S} .cr-name { font: 400 12px/1.2 var(--mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .cr-tok { font: 500 11px/1 var(--mono); text-align: right; color: var(--muted); }
${S}.is-tile .cr-row:nth-child(n+5) { display: none; }
${S}.is-tile .cr-row { padding: 5px 8px; grid-template-columns: 36px 46px 1fr 44px; gap: 6px; }
${S}.is-tile .cr-name { font-size: 10px; }
${S}.is-tile .cr-fig { font-size: 16px; }
`,
    mount(host, ctx) {
      const on = SOURCES.map((s) => s.on);

      host.innerHTML =
        '<div class="cr">' +
          '<div class="cr-top">' +
            '<div style="display:flex;align-items:baseline;gap:10px"><span class="cr-fig" id="cr-pct"></span><span class="cr-sub" id="cr-used"></span></div>' +
            '<div style="display:flex;gap:6px"><button type="button" class="rk-btn" id="cr-all">Attach all</button><button type="button" class="rk-btn" id="cr-cmp">Compact</button></div>' +
          '</div>' +
          '<div class="cr-bar">' + SOURCES.map((s, i) => '<div class="cr-seg" data-h="' + s.hue + '" data-i="' + i + '"></div>').join("") + '</div>' +
          '<div class="cr-list"></div>' +
        '</div>';

      const list = host.querySelector(".cr-list");
      const segs = [...host.querySelectorAll(".cr-seg")];
      const pctEl = host.querySelector("#cr-pct");
      const usedEl = host.querySelector("#cr-used");

      const rows = SOURCES.map((s, i) => {
        const r = document.createElement("div");
        r.className = "cr-row";
        r.innerHTML =
          '<button type="button" class="cr-sw" aria-label="Toggle ' + s.name + '"></button>' +
          '<span class="cr-tag" data-h="' + s.hue + '">' + s.tag + '</span>' +
          '<span class="cr-name">' + s.name + '</span>' +
          '<span class="cr-tok">' + s.tok.toFixed(1) + 'k</span>';
        const sw = r.querySelector(".cr-sw");
        sw.addEventListener("click", () => { on[i] = !on[i]; draw(); }, { signal: ctx.signal });
        list.appendChild(r);
        return { r, sw };
      });

      function draw() {
        let used = 0;
        SOURCES.forEach((s, i) => {
          const active = on[i];
          if (active) used += s.tok;
          rows[i].r.classList.toggle("is-off", !active);
          rows[i].sw.setAttribute("aria-pressed", String(active));
          rows[i].sw.textContent = active ? "ON" : "OFF";
          segs[i].style.width = (active ? (s.tok / MAX_K) * 100 : 0).toFixed(2) + "%";
        });
        pctEl.textContent = Math.round((used / MAX_K) * 100) + "%";
        usedEl.textContent = used.toFixed(1) + "k / " + MAX_K + "k TOKENS";
      }

      host.querySelector("#cr-all").addEventListener("click", () => { on.fill(true); draw(); }, { signal: ctx.signal });
      host.querySelector("#cr-cmp").addEventListener("click", () => {
        SOURCES.forEach((s, i) => (on[i] = s.prio === 1));
        draw();
      }, { signal: ctx.signal });
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      let step = 0;
      if (auto) {
        ctx.every(1700, () => {
          if (!auto) return;
          const idx = (step + 4) % SOURCES.length;
          on[idx] = !on[idx];
          step++;
          draw();
        });
      }
    },
  });
})();
