/* 09-approval-matrix.js — Permission & Tool Rack:
   Compact Auto / Ask / Block policy keys per tool + live incoming tool call strip with Rack yellow Allow key. */
(function () {
  const S = ".rs-approval-matrix";
  const TOOLS = [
    { name: "read_file", hue: "blue", mode: "auto" },
    { name: "run_tests", hue: "teal", mode: "auto" },
    { name: "edit_patch", hue: "violet", mode: "ask" },
    { name: "shell_exec", hue: "amber", mode: "ask" },
    { name: "git_push", hue: "green", mode: "block" },
  ];
  const CALLS = [
    { tool: "shell_exec", cmd: "npm test -- --run tokens", hue: "amber" },
    { tool: "edit_patch", cmd: "skills/litt-md/assets/tokens.css +14 -3", hue: "violet" },
    { tool: "git_push", cmd: "origin/rack-studies (3 commits)", hue: "green" },
    { tool: "shell_exec", cmd: "node skills/litt-md/scripts/check.mjs", hue: "amber" },
  ];
  const MODES = ["auto", "ask", "block"];

  RackPlayer.register({
    slug: "approval-matrix",
    title: "Permission & Tool Rack",
    category: "agent",
    tagline: "Auto / Ask / Block keys per tool plus a live incoming call bar with a yellow Allow key.",
    motion: "0ms key switch · 0ms gate commit",
    css: `
${S} .am { width: min(100%, 660px); background: var(--canvas); padding: 6px; border-radius: var(--r-panel); display: grid; gap: 5px; }
${S} .am-call {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px;
  padding: 6px 8px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control);
}
${S} .am-tag {
  font: 600 10px/1 var(--mono); padding: 4px 6px; border: 1px solid var(--border); border-radius: var(--r-control);
  white-space: nowrap;
}
${S} .am-tag[data-h="amber"] { background: var(--amber-tint); color: var(--amber-text); }
${S} .am-tag[data-h="violet"] { background: var(--violet-tint); color: var(--violet-text); }
${S} .am-tag[data-h="green"] { background: var(--green-tint); color: var(--green-text); }
${S} .am-tag[data-h="blue"] { background: var(--blue-tint); color: var(--blue-text); }
${S} .am-tag[data-h="teal"] { background: var(--teal-tint); color: var(--teal-text); }
${S} .am-cmd {
  font: 500 11px/1.2 var(--mono); background: var(--cut); border: 1px solid var(--line);
  border-radius: var(--r-control); padding: 5px 7px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
${S} .am-acts { display: flex; gap: 4px; }
${S} .am-list { display: grid; gap: 3px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-control); padding: 6px; }
${S} .am-row { display: grid; grid-template-columns: 10px 1fr auto; align-items: center; gap: 8px; padding: 3px 4px; background: var(--surface-2); border-radius: var(--r-control); }
${S} .am-dot { width: 8px; height: 18px; border-radius: 1px; border: 1px solid var(--outline); }
${S} .am-dot[data-h="blue"] { background: var(--blue); }
${S} .am-dot[data-h="teal"] { background: var(--teal); }
${S} .am-dot[data-h="violet"] { background: var(--violet); }
${S} .am-dot[data-h="amber"] { background: var(--amber); }
${S} .am-dot[data-h="green"] { background: var(--green); }
${S} .am-name { font: 500 12px/1 var(--mono); }
${S} .am-seg { display: inline-flex; border: 1px solid var(--border); border-radius: var(--r-control); overflow: hidden; }
${S} .am-seg button {
  border: 0; border-right: 1px solid var(--border); background: var(--block); color: var(--muted);
  height: 22px; padding: 0 8px; font: 600 10px/1 var(--mono); text-transform: uppercase; cursor: pointer;
}
${S} .am-seg button:last-child { border-right: 0; }
${S} .am-seg button.is-on[data-m="auto"] { background: var(--green); color: #fff; }
${S} .am-seg button.is-on[data-m="ask"] { background: var(--accent); color: var(--on-accent); }
${S} .am-seg button.is-on[data-m="block"] { background: var(--ink); color: var(--on-ink); }
${S} .am-foot { display: flex; justify-content: space-between; font: 500 10px/1 var(--mono); color: var(--muted); padding: 2px 4px 0; }
${S}.is-tile .am-row:nth-child(n+5) { display: none; }
${S}.is-tile .am-call { padding: 5px 6px; gap: 5px; }
${S}.is-tile .am-acts .rk-btn { height: 22px; padding: 0 7px; font-size: 11px; }
${S}.is-tile .am-seg button { height: 19px; padding: 0 6px; font-size: 9px; }
${S}.is-tile .am-name { font-size: 11px; }
`,
    mount(host, ctx) {
      const state = TOOLS.map((t) => ({ ...t }));
      let callIdx = 0;
      let log = "WAITING FOR GATE";

      host.innerHTML =
        '<div class="am">' +
          '<div class="am-call" data-col>' +
            '<span class="am-tag" id="am-tag"></span>' +
            '<span class="am-cmd" id="am-cmd"></span>' +
            '<div class="am-acts">' +
              '<button type="button" class="rk-btn is-accent" id="am-allow">Allow</button>' +
              '<button type="button" class="rk-btn" id="am-deny">Deny</button>' +
            '</div>' +
          '</div>' +
          '<div class="am-list" data-col>' +
            state.map((t, i) =>
              '<div class="am-row">' +
                '<i class="am-dot" data-h="' + t.hue + '"></i>' +
                '<span class="am-name">' + t.name + '</span>' +
                '<div class="am-seg">' +
                  MODES.map((m) => '<button type="button" data-i="' + i + '" data-m="' + m + '">' + m + '</button>').join("") +
                '</div>' +
              '</div>'
            ).join("") +
          '</div>' +
          '<div class="am-foot"><span id="am-log"></span><span id="am-sum"></span></div>' +
        '</div>';

      const tagEl = host.querySelector("#am-tag");
      const cmdEl = host.querySelector("#am-cmd");
      const logEl = host.querySelector("#am-log");
      const sumEl = host.querySelector("#am-sum");
      const modeBtns = [...host.querySelectorAll(".am-seg button")];

      function draw() {
        const c = CALLS[callIdx % CALLS.length];
        tagEl.dataset.h = c.hue;
        tagEl.textContent = c.tool;
        cmdEl.textContent = c.cmd;
        modeBtns.forEach((b) => {
          const on = state[+b.dataset.i].mode === b.dataset.m;
          b.classList.toggle("is-on", on);
          b.setAttribute("aria-pressed", String(on));
        });
        const counts = { auto: 0, ask: 0, block: 0 };
        state.forEach((t) => counts[t.mode]++);
        logEl.textContent = log;
        sumEl.textContent = counts.auto + " AUTO · " + counts.ask + " ASK · " + counts.block + " BLOCK";
      }

      modeBtns.forEach((b) => b.addEventListener("click", () => {
        const i = +b.dataset.i;
        state[i].mode = b.dataset.m;
        log = state[i].name + " → " + b.dataset.m.toUpperCase();
        draw();
      }, { signal: ctx.signal }));

      host.querySelector("#am-allow").addEventListener("click", () => {
        const c = CALLS[callIdx % CALLS.length];
        log = "ALLOWED " + c.tool;
        callIdx = (callIdx + 1) % CALLS.length;
        draw();
      }, { signal: ctx.signal });

      host.querySelector("#am-deny").addEventListener("click", () => {
        const c = CALLS[callIdx % CALLS.length];
        log = "DENIED " + c.tool;
        callIdx = (callIdx + 1) % CALLS.length;
        draw();
      }, { signal: ctx.signal });

      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2000, () => {
        if (!auto) return;
        const c = CALLS[callIdx % CALLS.length];
        log = "ALLOWED " + c.tool;
        callIdx = (callIdx + 1) % CALLS.length;
        draw();
      });
    },
  });
})();
