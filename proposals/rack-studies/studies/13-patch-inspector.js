/* 13-patch-inspector.js — Diff Device Panel:
   Ableton browser-style file rail + live diff hunk viewer with yellow Accept [A] / Reject [R] keys
   and J/K hunk navigation. */
(function () {
  const S = ".rs-patch-inspector";
  const HUNKS = [
    {
      file: "tokens.css", stat: "+2 -1", hue: "blue",
      lines: [
        ["ctx", "  --panel: #e2e2e2;"],
        ["del", "- --accent: #ffd147;"],
        ["add", "+ --accent: #ffc933;"],
        ["add", "+ --on-accent: #111111;"],
      ],
    },
    {
      file: "router.ts", stat: "+2 -1", hue: "teal",
      lines: [
        ["ctx", "  const mode = policy.resolve(tool);"],
        ["del", "- if (mode === 'ask') return wait(500);"],
        ["add", "+ if (mode === 'ask') return gate.hold();"],
        ["add", "+ if (mode === 'block') return gate.deny();"],
      ],
    },
    {
      file: "clock.ts", stat: "+2 -1", hue: "violet",
      lines: [
        ["ctx", "  export const STEP_MS = 125;"],
        ["del", "- export const STAGGER = 60;"],
        ["add", "+ export const STAGGER = 36;"],
        ["add", "+ export const CUT_IN_MS = 100;"],
      ],
    },
    {
      file: "eval.test.ts", stat: "+2 -0", hue: "green",
      lines: [
        ["ctx", "  expect(grid.passRate).toBeGreaterThan(0.9);"],
        ["add", "+ expect(grid.regressions).toBe(0);"],
        ["add", "+ expect(grid.latencyMs).toBeLessThan(180);"],
      ],
    },
  ];

  RackPlayer.register({
    slug: "patch-inspector",
    title: "Diff Device Panel",
    category: "agent",
    tagline: "Browser file rail with single-line paths, verdict pips, and yellow Accept [A] / Reject [R] keys.",
    motion: "0ms hunk cut · 0ms verdict commit",
    css: `
${S} .pi { width: min(100%, 720px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .pi-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; padding: 5px 8px; background: var(--surface-2); border-radius: var(--r-control); min-width: 0; }
${S} .pi-sum { font: 600 11px/1 var(--mono); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
${S} .pi-acts { display: flex; gap: 4px; flex: none; }
${S} .pi-acts .rk-btn { white-space: nowrap; }
${S} .pi-main { display: grid; grid-template-columns: 168px 1fr; gap: 5px; min-width: 0; }
${S} .pi-rail { display: grid; gap: 3px; align-content: start; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control); padding: 5px; }
${S} .pi-file {
  display: grid; grid-template-columns: 8px 1fr auto; align-items: center; gap: 6px;
  padding: 5px 6px; border: 1px solid var(--line); border-radius: var(--r-control);
  background: var(--block); cursor: pointer; text-align: left; font: 500 11px/1 var(--mono); min-width: 0;
}
${S} .pi-file span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .pi-file.is-sel { background: var(--ink); color: var(--on-ink); border-color: var(--ink); }
${S} .pi-pip { width: 7px; height: 7px; border: 1px solid var(--outline); background: var(--tray); }
${S} .pi-pip[data-v="ok"] { background: var(--green); }
${S} .pi-pip[data-v="no"] { background: var(--danger); }
${S} .pi-stat { font-size: 9px; opacity: 0.8; }
${S} .pi-code {
  background: var(--cut); border: 1px solid var(--border); border-radius: var(--r-control);
  padding: 6px; font: 400 11px/1.55 var(--mono); display: grid; gap: 2px; align-content: start; min-width: 0;
}
${S} .pi-line { padding: 2px 6px; border-radius: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .pi-line.is-add { background: var(--green-tint); color: var(--green-text); }
${S} .pi-line.is-del { background: var(--danger-tint); color: var(--ink); }
${S} .pi-line.is-ctx { color: var(--muted); }
${S} .pi-head { display: flex; justify-content: space-between; align-items: center; padding: 2px 6px 5px; border-bottom: 1px solid var(--line); margin-bottom: 3px; font-weight: 600; }
${S}.is-tile .pi-main { grid-template-columns: 118px 1fr; }
${S}.is-tile .pi-sum { font-size: 10px; }
${S}.is-tile .pi-file { padding: 4px 5px; font-size: 10px; }
${S}.is-tile .pi-stat { display: none; }
${S}.is-tile .pi-code { font-size: 10px; line-height: 1.4; padding: 5px; }
${S}.is-tile .pi-top .rk-btn { height: 22px; padding: 0 7px; font-size: 10px; }
`,
    mount(host, ctx) {
      let cur = 0;
      const verdicts = HUNKS.map(() => "");

      host.innerHTML =
        '<div class="pi">' +
          '<div class="pi-top">' +
            '<span class="pi-sum" id="pi-sum"></span>' +
            '<div class="pi-acts">' +
              '<button type="button" class="rk-btn is-accent" id="pi-ok">Accept [A]</button>' +
              '<button type="button" class="rk-btn" id="pi-no">Reject [R]</button>' +
            '</div>' +
          '</div>' +
          '<div class="pi-main">' +
            '<div class="pi-rail" data-col>' +
              HUNKS.map((h, i) =>
                '<button type="button" class="pi-file" data-i="' + i + '">' +
                  '<i class="pi-pip" data-v=""></i><span>' + h.file + '</span><em class="pi-stat">' + h.stat + '</em>' +
                '</button>'
              ).join("") +
            '</div>' +
            '<div class="pi-code" data-col id="pi-code"></div>' +
          '</div>' +
        '</div>';

      const fileBtns = [...host.querySelectorAll(".pi-file")];
      const codeEl = host.querySelector("#pi-code");
      const sumEl = host.querySelector("#pi-sum");

      function draw() {
        const h = HUNKS[cur];
        fileBtns.forEach((b, i) => {
          b.classList.toggle("is-sel", i === cur);
          b.querySelector(".pi-pip").dataset.v = verdicts[i];
        });
        const ok = verdicts.filter((v) => v === "ok").length;
        const no = verdicts.filter((v) => v === "no").length;
        sumEl.textContent = ok + " ACCEPTED · " + no + " REJECTED · " + (HUNKS.length - ok - no) + " OPEN";
        const vLabel = verdicts[cur] === "ok" ? "ACCEPTED" : verdicts[cur] === "no" ? "REJECTED" : "PENDING";
        codeEl.innerHTML =
          '<div class="pi-head"><span>' + h.file + '</span><span>' + vLabel + '</span></div>' +
          h.lines.map(([t, txt]) => '<div class="pi-line is-' + t + '">' + txt + '</div>').join("");
      }

      function decide(v) {
        verdicts[cur] = v;
        const next = verdicts.findIndex((x, i) => i > cur && !x);
        if (next >= 0) cur = next;
        draw();
      }

      fileBtns.forEach((b) => b.addEventListener("click", () => { cur = +b.dataset.i; draw(); }, { signal: ctx.signal }));
      host.querySelector("#pi-ok").addEventListener("click", () => decide("ok"), { signal: ctx.signal });
      host.querySelector("#pi-no").addEventListener("click", () => decide("no"), { signal: ctx.signal });

      if (!ctx.tile) {
        window.addEventListener("keydown", (e) => {
          if (e.target.closest("input")) return;
          if (e.key === "j" || e.key === "J") { cur = (cur + 1) % HUNKS.length; draw(); }
          else if (e.key === "k" || e.key === "K") { cur = (cur - 1 + HUNKS.length) % HUNKS.length; draw(); }
          else if (e.key === "a" || e.key === "A") decide("ok");
          else if (e.key === "r" || e.key === "R") decide("no");
        }, { signal: ctx.signal });
      }

      verdicts[0] = "ok";
      cur = 1;
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2000, () => {
        if (!auto) return;
        cur = (cur + 1) % HUNKS.length;
        draw();
      });
    },
  });
})();
