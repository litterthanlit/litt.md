/* 10-eval-grid.js — Eval Pass Grid:
   Rack's native dense test-suite instrument: 64 clickable eval cells across 4 clip-colored tracks
   (Routing, Editing, Testing, Safety) with track/status filtering and a live bottom inspector strip. */
(function () {
  const S = ".rs-eval-grid";
  const TRACKS = [
    { name: "Routing", hue: "blue", cases: "PPPPPPPPPPWPPPPP" },
    { name: "Editing", hue: "teal", cases: "PPPFPPPPPPWPPPPP" },
    { name: "Testing", hue: "violet", cases: "PPPPPPWPPPFPPPPP" },
    { name: "Safety", hue: "green", cases: "PPPPPPPPPPPPWPPP" },
  ];
  const VERDICT = { P: "PASS", W: "WARN", F: "FAIL" };
  const NOTES = {
    P: "0 regressions · 142ms · deterministic match",
    W: "latency 2.1× budget · passed retry #2",
    F: "assertion mismatch on line 48 · diff clipped",
  };

  RackPlayer.register({
    slug: "eval-grid",
    title: "Eval Pass Grid",
    category: "data",
    tagline: "64 clickable eval cases across 4 colored tracks with status filters and live case inspection.",
    motion: "0ms cell select · 0ms filter cut",
    css: `
${S} .eg { width: min(100%, 720px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .eg-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px; padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control); }
${S} .eg-stat { font: 600 11px/1 var(--mono); }
${S} .eg-body { display: grid; gap: 4px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control); padding: 7px; }
${S} .eg-row { display: grid; grid-template-columns: 74px repeat(16, 1fr); gap: 3px; align-items: center; }
${S} .eg-lbl {
  font: 600 10px/1 var(--mono); padding: 5px 6px; border: 1px solid var(--border); border-radius: var(--r-control);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
${S} .eg-lbl[data-h="blue"] { background: var(--blue-tint); color: var(--blue-text); }
${S} .eg-lbl[data-h="teal"] { background: var(--teal-tint); color: var(--teal-text); }
${S} .eg-lbl[data-h="violet"] { background: var(--violet-tint); color: var(--violet-text); }
${S} .eg-lbl[data-h="green"] { background: var(--green-tint); color: var(--green-text); }
${S} .eg-cell {
  height: 22px; border: 1px solid var(--outline); border-radius: 1px; padding: 0; cursor: pointer;
}
${S} .eg-cell[data-v="P"][data-h="blue"] { background: var(--blue); }
${S} .eg-cell[data-v="P"][data-h="teal"] { background: var(--teal); }
${S} .eg-cell[data-v="P"][data-h="violet"] { background: var(--violet); }
${S} .eg-cell[data-v="P"][data-h="green"] { background: var(--green); }
${S} .eg-cell[data-v="W"] { background: var(--accent); }
${S} .eg-cell[data-v="F"] { background: var(--danger); }
${S} .eg-cell.is-dim { opacity: 0.2; }
${S} .eg-cell.is-sel { outline: 2px solid var(--ink); outline-offset: 1px; z-index: 2; }
${S} .eg-insp {
  display: grid; grid-template-columns: auto auto 1fr; align-items: center; gap: 8px;
  padding: 6px 8px; background: var(--cut); border: 1px solid var(--border); border-radius: var(--r-control);
  font: 500 11px/1.2 var(--mono);
}
${S} .eg-pill { padding: 2px 6px; border: 1px solid var(--ink); border-radius: var(--r-control); font-weight: 600; }
${S} .eg-pill[data-v="P"] { background: var(--green); color: #fff; }
${S} .eg-pill[data-v="W"] { background: var(--accent); color: var(--on-accent); }
${S} .eg-pill[data-v="F"] { background: var(--danger); color: #fff; }
${S} .eg-note { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S}.is-tile .eg-row { grid-template-columns: 58px repeat(16, 1fr); gap: 2px; }
${S}.is-tile .eg-cell { height: 17px; }
${S}.is-tile .eg-lbl { padding: 3px 4px; font-size: 9px; }
${S}.is-tile .eg-top .rk-seg button { height: 20px; padding: 0 6px; font-size: 10px; }
${S}.is-tile .eg-insp { padding: 4px 6px; font-size: 10px; }
`,
    mount(host, ctx) {
      let filter = "ALL";
      let selR = 1, selC = 3;

      host.innerHTML =
        '<div class="eg">' +
          '<div class="eg-top">' +
            '<span class="eg-stat" id="eg-stat"></span>' +
            '<div class="rk-seg" role="group" aria-label="Filter status">' +
              '<button type="button" data-f="ALL" aria-pressed="true">All</button>' +
              '<button type="button" data-f="P" aria-pressed="false">Pass</button>' +
              '<button type="button" data-f="W" aria-pressed="false">Warn</button>' +
              '<button type="button" data-f="F" aria-pressed="false">Fail</button>' +
            '</div>' +
          '</div>' +
          '<div class="eg-body" data-col>' +
            TRACKS.map((tr, r) =>
              '<div class="eg-row">' +
                '<div class="eg-lbl" data-h="' + tr.hue + '">' + tr.name + '</div>' +
                [...tr.cases].map((v, c) =>
                  '<button type="button" class="eg-cell" data-r="' + r + '" data-c="' + c + '" data-h="' + tr.hue + '" data-v="' + v + '" aria-label="' + tr.name + ' case ' + (c + 1) + ' ' + VERDICT[v] + '"></button>'
                ).join("") +
              '</div>'
            ).join("") +
          '</div>' +
          '<div class="eg-insp">' +
            '<span id="eg-id"></span>' +
            '<span class="eg-pill" id="eg-pill"></span>' +
            '<span class="eg-note" id="eg-note"></span>' +
          '</div>' +
        '</div>';

      const cells = [...host.querySelectorAll(".eg-cell")];
      const fBtns = [...host.querySelectorAll("[data-f]")];
      const statEl = host.querySelector("#eg-stat");
      const idEl = host.querySelector("#eg-id");
      const pillEl = host.querySelector("#eg-pill");
      const noteEl = host.querySelector("#eg-note");

      let pass = 0, warn = 0, fail = 0;
      TRACKS.forEach((tr) => [...tr.cases].forEach((v) => { if (v === "P") pass++; else if (v === "W") warn++; else fail++; }));
      statEl.textContent = pass + "/64 PASS · " + warn + " WARN · " + fail + " FAIL";

      function draw() {
        cells.forEach((b) => {
          const r = +b.dataset.r, c = +b.dataset.c, v = b.dataset.v;
          b.classList.toggle("is-dim", filter !== "ALL" && v !== filter);
          b.classList.toggle("is-sel", r === selR && c === selC);
        });
        fBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === filter)));
        const tr = TRACKS[selR];
        const v = tr.cases[selC];
        idEl.textContent = tr.name.toUpperCase() + " #" + String(selC + 1).padStart(2, "0");
        pillEl.dataset.v = v;
        pillEl.textContent = VERDICT[v];
        noteEl.textContent = NOTES[v];
      }

      cells.forEach((b) => b.addEventListener("click", () => {
        selR = +b.dataset.r; selC = +b.dataset.c; draw();
      }, { signal: ctx.signal }));
      fBtns.forEach((b) => b.addEventListener("click", () => {
        filter = b.dataset.f; draw();
      }, { signal: ctx.signal }));

      draw();

      const focusSeq = [[1, 3], [2, 10], [0, 10], [3, 12], [1, 10]];
      let auto = !ctx.reduced(), idx = 0;
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(1400, () => {
        if (!auto) return;
        idx = (idx + 1) % focusSeq.length;
        selR = focusSeq[idx][0]; selC = focusSeq[idx][1];
        draw();
      });
    },
  });
})();
