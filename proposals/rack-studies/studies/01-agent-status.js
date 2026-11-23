/* 01-agent-status.js — Agent Status:
   Live run header, elapsed timer, crisp square step pills, and electric yellow Allow / Stop keys. */
(function () {
  const S = ".rs-agent-status";
  const STEPS = [
    { id: "plan", label: "Plan", hue: "violet", msg: "Decomposed into 3 file edits", tok: 142 },
    { id: "read", label: "Read", hue: "blue", msg: "Inspecting tokens.css + check.mjs", tok: 486 },
    { id: "patch", label: "Patch", hue: "coral", msg: "Waiting to run: git apply fix.patch", tok: 814 },
    { id: "verify", label: "Verify", hue: "emerald", msg: "18/18 checks passed in 1.2s", tok: 1024 },
  ];

  RackPlayer.register({
    slug: "agent-status",
    title: "Agent Status",
    category: "agent",
    tagline: "What the agent is doing right now, crisp square step pills, and a lit yellow approval key.",
    motion: "0ms step snap · 0.98 key press",
    css: `
${S} .as {
  width: min(100%, 420px); background: var(--cut); border: 1px solid var(--border);
  border-radius: var(--r-panel); overflow: hidden; display: grid;
}
${S} .as-bar { height: 4px; background: var(--coral); }
${S} .as-bar[data-h="violet"] { background: var(--violet); }
${S} .as-bar[data-h="blue"] { background: var(--blue); }
${S} .as-bar[data-h="coral"] { background: var(--coral); }
${S} .as-bar[data-h="emerald"] { background: var(--emerald); }
${S} .as-in { padding: 14px; display: grid; gap: 11px; }
${S} .as-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
${S} .as-title { font-weight: 600; font-size: 13px; }
${S} .as-badge {
  font: 600 10px/1 var(--mono); padding: 4px 6px; border: 1px solid var(--border-strong);
  border-radius: var(--r-control); text-transform: uppercase;
}
${S} .as-badge[data-h="violet"] { background: var(--violet-tint); color: var(--violet-text); border-color: var(--violet); }
${S} .as-badge[data-h="blue"] { background: var(--blue-tint); color: var(--blue-text); border-color: var(--blue); }
${S} .as-badge[data-h="coral"] { background: var(--accent); color: var(--on-accent); border-color: var(--border-strong); }
${S} .as-badge[data-h="emerald"] { background: var(--emerald-tint); color: var(--emerald-text); border-color: var(--emerald); }
${S} .as-mid { display: flex; justify-content: space-between; align-items: baseline; }
${S} .as-time { font: 600 28px/1 var(--mono); letter-spacing: -0.03em; }
${S} .as-tok { font: 500 11px/1 var(--mono); color: var(--muted); }
${S} .as-msg {
  font: 500 11px/1.3 var(--mono); padding: 6px 8px; background: var(--surface-2);
  border: 1px solid var(--line); border-radius: var(--r-control);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
${S} .as-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
${S} .as-st {
  height: 26px; border: 1px solid var(--border); border-radius: var(--r-control);
  background: var(--block); font-size: 11px; font-weight: 500; cursor: pointer;
}
${S} .as-st.is-on[data-h="violet"] { background: var(--violet); color: #fff; border-color: var(--violet); }
${S} .as-st.is-on[data-h="blue"] { background: var(--blue); color: #fff; border-color: var(--blue); }
${S} .as-st.is-on[data-h="coral"] { background: var(--coral); color: #fff; border-color: var(--coral); }
${S} .as-st.is-on[data-h="emerald"] { background: var(--emerald); color: #fff; border-color: var(--emerald); }
${S} .as-acts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
${S}.is-tile .as-in { padding: 10px; gap: 8px; }
${S}.is-tile .as-time { font-size: 22px; }
${S}.is-tile .as-st { height: 22px; font-size: 10px; }
${S}.is-tile .as-acts .rk-btn { height: 24px; font-size: 11px; }
`,
    mount(host, ctx) {
      let cur = 2;
      let sec = 4.2;

      host.innerHTML =
        '<div class="as" data-col>' +
          '<i class="as-bar" id="as-bar"></i>' +
          '<div class="as-in">' +
            '<div class="as-top"><span class="as-title">Refactor color tokens</span><span class="as-badge" id="as-badge"></span></div>' +
            '<div class="as-mid"><span class="as-time" id="as-time">0:04.2</span><span class="as-tok" id="as-tok"></span></div>' +
            '<div class="as-msg" id="as-msg"></div>' +
            '<div class="as-steps">' +
              STEPS.map((s, i) => '<button type="button" class="as-st" data-i="' + i + '" data-h="' + s.hue + '">' + s.label + '</button>').join("") +
            '</div>' +
            '<div class="as-acts">' +
              '<button type="button" class="rk-btn is-accent" id="as-allow">Allow</button>' +
              '<button type="button" class="rk-btn" id="as-stop">Stop</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      const bar = host.querySelector("#as-bar");
      const badge = host.querySelector("#as-badge");
      const timeEl = host.querySelector("#as-time");
      const tokEl = host.querySelector("#as-tok");
      const msgEl = host.querySelector("#as-msg");
      const stBtns = [...host.querySelectorAll(".as-st")];

      function draw() {
        const s = STEPS[cur];
        bar.dataset.h = s.hue;
        badge.dataset.h = s.hue;
        badge.textContent = cur === 2 ? "Needs OK" : cur === 3 ? "Complete" : "Running";
        timeEl.textContent = "0:" + sec.toFixed(1).padStart(4, "0");
        tokEl.textContent = s.tok + " tok";
        msgEl.textContent = s.msg;
        stBtns.forEach((b, i) => b.classList.toggle("is-on", i === cur));
      }

      stBtns.forEach((b) => b.addEventListener("click", () => { cur = +b.dataset.i; draw(); }, { signal: ctx.signal }));
      host.querySelector("#as-allow").addEventListener("click", () => { cur = 3; draw(); }, { signal: ctx.signal });
      host.querySelector("#as-stop").addEventListener("click", () => { cur = 0; sec = 0.0; draw(); }, { signal: ctx.signal });
      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) {
        ctx.every(200, () => { if (!auto || cur === 3) return; sec = (sec + 0.2) % 24; draw(); });
        ctx.every(2400, () => { if (!auto) return; cur = (cur + 1) % STEPS.length; draw(); });
      }
    },
  });
})();
