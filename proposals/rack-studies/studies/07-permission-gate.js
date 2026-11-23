/* 07-permission-gate.js — Permission Gate:
   Compact agent tool policy matrix (Auto / Ask / Block) + live incoming call bar with yellow Approve key. */
(function () {
  const S = ".rs-permission-gate";
  const TOOLS = [
    { name: "read_file", hue: "blue", mode: "auto" },
    { name: "run_tests", hue: "emerald", mode: "auto" },
    { name: "edit_patch", hue: "violet", mode: "ask" },
    { name: "shell_exec", hue: "coral", mode: "ask" },
  ];
  const QUEUE = [
    { tool: "shell_exec", cmd: "node scripts/check.mjs", hue: "coral" },
    { tool: "edit_patch", cmd: "proposals/rack-studies/shell.html", hue: "violet" },
    { tool: "run_tests", cmd: "npm run verify --prefix gallery", hue: "emerald" },
  ];

  RackPlayer.register({
    slug: "permission-gate",
    title: "Permission Gate",
    category: "agent",
    tagline: "Per-tool Auto / Ask / Block policy keys paired with a live yellow Approve prompt.",
    motion: "0ms policy switch · 0ms gate commit",
    css: `
${S} .pg {
  width: min(100%, 480px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); padding: 12px; display: grid; gap: 10px;
}
${S} .pg-call {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px;
  padding: 8px; background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--r-control);
}
${S} .pg-tag { font: 600 9px/1 var(--mono); padding: 4px 6px; border-radius: var(--r-control); color: #fff; white-space: nowrap; }
${S} .pg-tag[data-h="coral"] { background: var(--coral); }
${S} .pg-tag[data-h="violet"] { background: var(--violet); }
${S} .pg-tag[data-h="emerald"] { background: var(--emerald); }
${S} .pg-cmd { font: 500 11px/1.2 var(--mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .pg-acts { display: flex; gap: 4px; }
${S} .pg-list { display: grid; gap: 4px; }
${S} .pg-row {
  display: grid; grid-template-columns: 8px 1fr auto; align-items: center; gap: 8px;
  padding: 5px 7px; background: var(--panel); border: 1px solid var(--line); border-radius: var(--r-control);
}
${S} .pg-bar { width: 6px; height: 18px; border-radius: 1px; }
${S} .pg-bar[data-h="blue"] { background: var(--blue); }
${S} .pg-bar[data-h="emerald"] { background: var(--emerald); }
${S} .pg-bar[data-h="violet"] { background: var(--violet); }
${S} .pg-bar[data-h="coral"] { background: var(--coral); }
${S} .pg-name { font: 500 12px/1 var(--mono); }
${S} .pg-seg { display: inline-flex; border: 1px solid var(--border); border-radius: var(--r-control); overflow: hidden; }
${S} .pg-seg button {
  height: 22px; padding: 0 7px; border: 0; border-right: 1px solid var(--border);
  background: var(--block); font: 600 9px/1 var(--mono); text-transform: uppercase; cursor: pointer;
}
${S} .pg-seg button:last-child { border-right: 0; }
${S} .pg-seg button.is-on[data-m="auto"] { background: var(--emerald); color: #fff; }
${S} .pg-seg button.is-on[data-m="ask"] { background: var(--accent); color: var(--on-accent); }
${S} .pg-seg button.is-on[data-m="block"] { background: var(--ink); color: var(--on-ink); }
${S}.is-tile .pg { padding: 9px; gap: 7px; }
${S}.is-tile .pg-call { padding: 6px; gap: 6px; }
${S}.is-tile .pg-acts .rk-btn { height: 22px; padding: 0 7px; font-size: 10px; }
${S}.is-tile .pg-row { padding: 4px 6px; }
${S}.is-tile .pg-seg button { height: 19px; padding: 0 6px; }
`,
    mount(host, ctx) {
      const state = TOOLS.map((t) => ({ ...t }));
      let qi = 0;

      host.innerHTML =
        '<div class="pg" data-col>' +
          '<div class="pg-call">' +
            '<span class="pg-tag" id="pg-tag"></span>' +
            '<span class="pg-cmd" id="pg-cmd"></span>' +
            '<div class="pg-acts"><button type="button" class="rk-btn is-accent" id="pg-ok">Approve</button><button type="button" class="rk-btn" id="pg-no">Deny</button></div>' +
          '</div>' +
          '<div class="pg-list">' +
            state.map((t, i) =>
              '<div class="pg-row">' +
                '<i class="pg-bar" data-h="' + t.hue + '"></i>' +
                '<span class="pg-name">' + t.name + '</span>' +
                '<div class="pg-seg">' +
                  ["auto", "ask", "block"].map((m) => '<button type="button" data-i="' + i + '" data-m="' + m + '">' + m + '</button>').join("") +
                '</div>' +
              '</div>'
            ).join("") +
          '</div>' +
        '</div>';

      const tag = host.querySelector("#pg-tag");
      const cmd = host.querySelector("#pg-cmd");
      const btns = [...host.querySelectorAll(".pg-seg button")];

      function draw() {
        const q = QUEUE[qi % QUEUE.length];
        tag.dataset.h = q.hue; tag.textContent = q.tool; cmd.textContent = q.cmd;
        btns.forEach((b) => b.classList.toggle("is-on", state[+b.dataset.i].mode === b.dataset.m));
      }

      btns.forEach((b) => b.addEventListener("click", () => { state[+b.dataset.i].mode = b.dataset.m; draw(); }, { signal: ctx.signal }));
      host.querySelector("#pg-ok").addEventListener("click", () => { qi++; draw(); }, { signal: ctx.signal });
      host.querySelector("#pg-no").addEventListener("click", () => { qi++; draw(); }, { signal: ctx.signal });
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2200, () => { if (!auto) return; qi++; draw(); });
    },
  });
})();
