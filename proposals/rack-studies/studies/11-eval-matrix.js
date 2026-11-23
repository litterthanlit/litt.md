/* 11-eval-matrix.js — Eval Run Matrix:
   Vivid high-chroma 48-cell pass/warn/fail test grid across 4 suites with instant status filter and inspector. */
(function () {
  const S = ".rs-eval-matrix";
  const SUITES = [
    { name: "Routing", hue: "blue", res: "PPPPPPPWPPPP" },
    { name: "Patch", hue: "violet", res: "PPFPPPPPPWPP" },
    { name: "Tools", hue: "emerald", res: "PPPPWPPFPPPP" },
    { name: "Safety", hue: "pink", res: "PPPPPPPPPWPP" },
  ];
  const NOTES = {
    P: "0 regressions · 118ms · exact output match",
    W: "2.0x latency budget · passed on retry #2",
    F: "assertion failed at line 42 · unexpected token",
  };

  RackPlayer.register({
    slug: "eval-matrix",
    title: "Eval Run Matrix",
    category: "data",
    tagline: "48 clickable eval cases across 4 vivid suites with instant status filter and live inspector.",
    motion: "0ms filter cut · 0ms cell focus",
    css: `
${S} .em {
  width: min(100%, 490px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); padding: 12px; display: grid; gap: 9px;
}
${S} .em-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
${S} .em-stat { font: 600 11px/1 var(--mono); }
${S} .em-grid { display: grid; gap: 4px; }
${S} .em-row { display: grid; grid-template-columns: 62px repeat(12, 1fr); gap: 3px; align-items: center; }
${S} .em-lbl { font: 600 10px/1 var(--mono); color: var(--muted); }
${S} .em-cell { height: 20px; border: 1px solid transparent; border-radius: 2px; padding: 0; cursor: pointer; }
${S} .em-cell[data-v="P"][data-h="blue"] { background: var(--blue); }
${S} .em-cell[data-v="P"][data-h="violet"] { background: var(--violet); }
${S} .em-cell[data-v="P"][data-h="emerald"] { background: var(--emerald); }
${S} .em-cell[data-v="P"][data-h="pink"] { background: var(--pink); }
${S} .em-cell[data-v="W"] { background: var(--accent); border-color: var(--border-strong); }
${S} .em-cell[data-v="F"] { background: var(--coral); }
${S} .em-cell.is-dim { opacity: 0.16; }
${S} .em-cell.is-sel { outline: 2px solid var(--border-strong); outline-offset: 1px; z-index: 2; }
${S} .em-insp {
  display: flex; align-items: center; gap: 7px; padding: 6px 8px; background: var(--surface-2);
  border: 1px solid var(--line); border-radius: var(--r-control); font: 500 11px/1.2 var(--mono); min-width: 0;
}
${S} .em-pill { padding: 2px 5px; border-radius: 2px; font-weight: 600; flex: none; }
${S} .em-pill[data-v="P"] { background: var(--emerald); color: #fff; }
${S} .em-pill[data-v="W"] { background: var(--accent); color: var(--on-accent); border: 1px solid var(--border-strong); }
${S} .em-pill[data-v="F"] { background: var(--coral); color: #fff; }
${S} .em-note { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S}.is-tile .em { padding: 9px; gap: 7px; }
${S}.is-tile .em-cell { height: 16px; }
${S}.is-tile .em-top .rk-seg button { height: 21px; padding: 0 6px; font-size: 10px; }
${S}.is-tile .em-insp { padding: 4px 6px; font-size: 10px; }
`,
    mount(host, ctx) {
      let filter = "ALL", sr = 1, sc = 2;

      host.innerHTML =
        '<div class="em" data-col>' +
          '<div class="em-top">' +
            '<span class="em-stat">42/48 PASS · 4 WARN · 2 FAIL</span>' +
            '<div class="rk-seg"><button type="button" data-f="ALL" aria-pressed="true">All</button><button type="button" data-f="P">Pass</button><button type="button" data-f="W">Warn</button><button type="button" data-f="F">Fail</button></div>' +
          '</div>' +
          '<div class="em-grid">' +
            SUITES.map((su, r) =>
              '<div class="em-row"><span class="em-lbl">' + su.name + '</span>' +
                [...su.res].map((v, c) => '<button type="button" class="em-cell" data-r="' + r + '" data-c="' + c + '" data-h="' + su.hue + '" data-v="' + v + '" aria-label="' + su.name + ' ' + (c + 1) + '"></button>').join("") +
              '</div>'
            ).join("") +
          '</div>' +
          '<div class="em-insp"><span id="em-id" style="flex:none"></span><span class="em-pill" id="em-p"></span><span class="em-note" id="em-n"></span></div>' +
        '</div>';

      const cells = [...host.querySelectorAll(".em-cell")];
      const fBtns = [...host.querySelectorAll("[data-f]")];
      const idEl = host.querySelector("#em-id"), pEl = host.querySelector("#em-p"), nEl = host.querySelector("#em-n");

      function draw() {
        cells.forEach((b) => {
          b.classList.toggle("is-dim", filter !== "ALL" && b.dataset.v !== filter);
          b.classList.toggle("is-sel", +b.dataset.r === sr && +b.dataset.c === sc);
        });
        fBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === filter)));
        const su = SUITES[sr], v = su.res[sc];
        idEl.textContent = su.name.toUpperCase() + " #" + String(sc + 1).padStart(2, "0");
        pEl.dataset.v = v; pEl.textContent = v === "P" ? "PASS" : v === "W" ? "WARN" : "FAIL";
        nEl.textContent = NOTES[v];
      }

      cells.forEach((b) => b.addEventListener("click", () => { sr = +b.dataset.r; sc = +b.dataset.c; draw(); }, { signal: ctx.signal }));
      fBtns.forEach((b) => b.addEventListener("click", () => { filter = b.dataset.f; draw(); }, { signal: ctx.signal }));
      draw();

      const seq = [[1, 2], [2, 7], [0, 7], [3, 9], [1, 9]];
      let auto = !ctx.reduced(), idx = 0;
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(1500, () => { if (!auto) return; [sr, sc] = seq[++idx % seq.length]; draw(); });
    },
  });
})();
