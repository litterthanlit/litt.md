/* 08-routing-matrix.js — Ableton I/O Routing Matrix for multi-agent tool capabilities:
   Click any intersection to patch/unpatch a clip-colored route on the frame, with crosshair row/col highlight. */
(function () {
  const S = ".rs-routing-matrix";
  const AGENTS = [
    { name: "Router", hue: "amber" },
    { name: "Research", hue: "blue" },
    { name: "Coder", hue: "teal" },
    { name: "Verifier", hue: "violet" },
  ];
  const TOOLS = ["Repo", "Shell", "Web", "Tests", "Git", "Deploy"];
  const INIT = [
    [1, 0, 1, 0, 0, 0],
    [1, 0, 1, 0, 0, 0],
    [1, 1, 0, 1, 1, 0],
    [1, 1, 0, 1, 0, 1],
  ];

  RackPlayer.register({
    slug: "routing-matrix",
    title: "Agent Routing Matrix",
    category: "agent",
    tagline: "Patch agents to tools on a crisp I/O matrix with instant crosshair highlight.",
    motion: "0ms patch toggle · 0ms crosshair lock",
    css: `
${S} .rm { width: min(100%, 620px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .rm-top { display: flex; justify-content: space-between; align-items: center; padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control); font-size: 11px; font-weight: 600; }
${S} .rm-grid { display: grid; grid-template-columns: 86px repeat(6, 1fr); gap: 3px; background: var(--panel); padding: 6px; border: 1px solid var(--border); border-radius: var(--r-control); }
${S} .rm-ch { font: 600 10px/1 var(--mono); color: var(--muted); text-align: center; padding: 4px 2px; }
${S} .rm-ch.is-hi { color: var(--ink); background: var(--surface-2); }
${S} .rm-rh { font-size: 11px; font-weight: 600; padding: 5px 7px; border: 1px solid var(--border); border-radius: var(--r-control); display: flex; align-items: center; }
${S} .rm-rh[data-h="amber"] { background: var(--amber-tint); color: var(--amber-text); }
${S} .rm-rh[data-h="blue"] { background: var(--blue-tint); color: var(--blue-text); }
${S} .rm-rh[data-h="teal"] { background: var(--teal-tint); color: var(--teal-text); }
${S} .rm-rh[data-h="violet"] { background: var(--violet-tint); color: var(--violet-text); }
${S} .rm-pt { height: 32px; border: 1px solid var(--line-strong); border-radius: var(--r-control); background: var(--cut); cursor: pointer; font: 600 10px/1 var(--mono); color: transparent; }
${S} .rm-pt.is-hi { background: var(--surface-2); }
${S} .rm-pt[data-h="amber"].is-on { background: var(--amber); border-color: var(--ink); color: #fff; }
${S} .rm-pt[data-h="blue"].is-on { background: var(--blue); border-color: var(--ink); color: #fff; }
${S} .rm-pt[data-h="teal"].is-on { background: var(--teal); border-color: var(--ink); color: #fff; }
${S} .rm-pt[data-h="violet"].is-on { background: var(--violet); border-color: var(--ink); color: #fff; }
${S}.is-tile .rm-grid { grid-template-columns: 66px repeat(6, 1fr); gap: 2px; padding: 4px; }
${S}.is-tile .rm-pt { height: 24px; font-size: 9px; }
${S}.is-tile .rm-rh { font-size: 10px; padding: 3px 5px; }
`,
    mount(host, ctx) {
      const m = INIT.map((r) => [...r]);
      let hr = -1, hc = -1;

      host.innerHTML =
        '<div class="rm">' +
          '<div class="rm-top"><span>Tool I/O patchbay</span><span class="rk-mono" id="rm-cnt"></span></div>' +
          '<div class="rm-grid">' +
            '<div></div>' + TOOLS.map((t, c) => '<div class="rm-ch" data-c="' + c + '">' + t + '</div>').join("") +
            AGENTS.map((a, r) =>
              '<div class="rm-rh" data-h="' + a.hue + '">' + a.name + '</div>' +
              TOOLS.map((t, c) => '<button type="button" class="rm-pt" data-h="' + a.hue + '" data-r="' + r + '" data-c="' + c + '" aria-label="' + a.name + ' to ' + t + '">●</button>').join("")
            ).join("") +
          '</div>' +
        '</div>';

      const pts = [...host.querySelectorAll(".rm-pt")];
      const chs = [...host.querySelectorAll(".rm-ch")];
      const cnt = host.querySelector("#rm-cnt");

      function draw() {
        let on = 0;
        pts.forEach((b) => {
          const r = +b.dataset.r, c = +b.dataset.c, v = !!m[r][c];
          if (v) on++;
          b.classList.toggle("is-on", v);
          b.classList.toggle("is-hi", !v && (r === hr || c === hc));
          b.setAttribute("aria-pressed", String(v));
        });
        chs.forEach((el, c) => el.classList.toggle("is-hi", c === hc));
        cnt.textContent = on + " / " + (AGENTS.length * TOOLS.length) + " PATCHED";
      }

      pts.forEach((b) => {
        b.addEventListener("click", () => {
          const r = +b.dataset.r, c = +b.dataset.c;
          m[r][c] = m[r][c] ? 0 : 1; draw();
        }, { signal: ctx.signal });
        b.addEventListener("pointerenter", () => { hr = +b.dataset.r; hc = +b.dataset.c; draw(); }, { signal: ctx.signal });
      });
      host.querySelector(".rm-grid").addEventListener("pointerleave", () => { hr = -1; hc = -1; draw(); }, { signal: ctx.signal });
      draw();

      let auto = !ctx.reduced(), step = 0;
      const demo = [[0,3],[1,4],[2,5],[3,2]];
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(1500, () => {
        if (!auto) return;
        const [r, c] = demo[step % demo.length];
        m[r][c] = m[r][c] ? 0 : 1;
        step++; draw();
      });
    },
  });
})();
