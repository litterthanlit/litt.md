/* 09-diff-review.js — Inline Diff Review:
   Crisp square file tabs with verdict pips + unified code hunk with vivid emerald/coral diff rows and yellow Accept key. */
(function () {
  const S = ".rs-diff-review";
  const FILES = [
    {
      name: "tokens.css", stat: "+2 -1",
      lines: [
        ["ctx", "  --panel: #f7f8fa;"],
        ["del", "- --accent: #c8c8c8;"],
        ["add", "+ --accent: #ffd014;"],
        ["add", "+ --blue: #1a6dff;"],
      ],
    },
    {
      name: "router.ts", stat: "+2 -1",
      lines: [
        ["ctx", "  const mode = policy.get(tool);"],
        ["del", "- if (mode === 'ask') await sleep(400);"],
        ["add", "+ if (mode === 'ask') return gate.prompt();"],
        ["add", "+ if (mode === 'block') return gate.deny();"],
      ],
    },
    {
      name: "motion.ts", stat: "+2 -1",
      lines: [
        ["ctx", "  export const CUT_IN = 100;"],
        ["del", "- export const BOUNCE = 0.28;"],
        ["add", "+ export const CUT_OUT = 75;"],
        ["add", "+ export const COL_STAGGER = 36;"],
      ],
    },
  ];

  RackPlayer.register({
    slug: "diff-review",
    title: "Inline Diff Review",
    category: "agent",
    tagline: "Crisp file tabs, vivid emerald and coral diff hunks, and instant Accept / Reject keys.",
    motion: "0ms tab cut · 0ms verdict mark",
    css: `
${S} .dr {
  width: min(100%, 490px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); overflow: hidden; display: grid;
}
${S} .dr-tabs {
  display: flex; justify-content: space-between; align-items: center; gap: 6px;
  padding: 6px 8px; background: var(--surface-2); border-bottom: 1px solid var(--line);
}
${S} .dr-tlist { display: flex; gap: 4px; overflow: hidden; }
${S} .dr-tab {
  display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 8px;
  border: 1px solid var(--border); border-radius: var(--r-control); background: var(--block);
  font: 500 11px/1 var(--mono); cursor: pointer; white-space: nowrap;
}
${S} .dr-tab.is-sel { background: var(--ink); color: var(--on-ink); border-color: var(--ink); }
${S} .dr-pip { width: 6px; height: 6px; border: 1px solid currentColor; }
${S} .dr-pip[data-v="ok"] { background: var(--emerald); border-color: var(--emerald); }
${S} .dr-pip[data-v="no"] { background: var(--coral); border-color: var(--coral); }
${S} .dr-acts { display: flex; gap: 4px; flex: none; }
${S} .dr-code { padding: 8px; display: grid; gap: 2px; font: 500 11px/1.5 var(--mono); }
${S} .dr-line { padding: 2px 7px; border-radius: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .dr-line.is-add { background: var(--emerald-tint); color: var(--emerald-text); border-left: 3px solid var(--emerald); }
${S} .dr-line.is-del { background: var(--coral-tint); color: var(--coral-text); border-left: 3px solid var(--coral); }
${S} .dr-line.is-ctx { color: var(--muted); border-left: 3px solid transparent; }
${S}.is-tile .dr-tabs { padding: 5px 6px; }
${S}.is-tile .dr-tab { height: 21px; padding: 0 6px; font-size: 10px; }
${S}.is-tile .dr-acts .rk-btn { height: 21px; padding: 0 7px; font-size: 10px; }
${S}.is-tile .dr-code { padding: 6px; font-size: 10px; }
`,
    mount(host, ctx) {
      let cur = 0;
      const verdicts = ["ok", "", ""];

      host.innerHTML =
        '<div class="dr" data-col>' +
          '<div class="dr-tabs">' +
            '<div class="dr-tlist">' +
              FILES.map((f, i) => '<button type="button" class="dr-tab" data-i="' + i + '"><i class="dr-pip" data-v=""></i>' + f.name + '</button>').join("") +
            '</div>' +
            '<div class="dr-acts">' +
              '<button type="button" class="rk-btn is-accent" id="dr-ok">Accept</button>' +
              '<button type="button" class="rk-btn" id="dr-no">Reject</button>' +
            '</div>' +
          '</div>' +
          '<div class="dr-code" id="dr-code"></div>' +
        '</div>';

      const tabs = [...host.querySelectorAll(".dr-tab")];
      const code = host.querySelector("#dr-code");

      function draw() {
        tabs.forEach((t, i) => {
          t.classList.toggle("is-sel", i === cur);
          t.querySelector(".dr-pip").dataset.v = verdicts[i];
        });
        code.innerHTML = FILES[cur].lines.map(([t, txt]) => '<div class="dr-line is-' + t + '">' + txt + '</div>').join("");
      }

      tabs.forEach((t) => t.addEventListener("click", () => { cur = +t.dataset.i; draw(); }, { signal: ctx.signal }));
      host.querySelector("#dr-ok").addEventListener("click", () => { verdicts[cur] = "ok"; cur = (cur + 1) % FILES.length; draw(); }, { signal: ctx.signal });
      host.querySelector("#dr-no").addEventListener("click", () => { verdicts[cur] = "no"; cur = (cur + 1) % FILES.length; draw(); }, { signal: ctx.signal });
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2200, () => { if (!auto) return; cur = (cur + 1) % FILES.length; draw(); });
    },
  });
})();
