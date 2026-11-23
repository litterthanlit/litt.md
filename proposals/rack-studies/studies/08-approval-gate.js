/* 08-approval-gate.js — Dense 1px-ruled agent permission matrix (Auto | Ask | Block) +
   live queued tool call bar featuring Rack's one yellow (#ffc933) primary action key. */
(function () {
  const S = ".rs-approval-gate";
  const TOOLS = [
    { name: "Read workspace", scope: "fs.read", mode: "auto" },
    { name: "Run test suite", scope: "shell.test", mode: "auto" },
    { name: "Patch source files", scope: "fs.write", mode: "ask" },
    { name: "Push feature branch", scope: "git.push", mode: "ask" },
    { name: "Deploy production", scope: "deploy.prod", mode: "block" },
  ];
  const QUEUE = [
    { cmd: "git push -u origin rack-studies", risk: "ASK · GIT.PUSH" },
    { cmd: "write proposals/rack-studies/studies.html", risk: "ASK · FS.WRITE" },
    { cmd: "npm run verify --prefix gallery", risk: "AUTO · SHELL.TEST" },
  ];

  RackPlayer.register({
    slug: "approval-gate",
    title: "Tool Approval Matrix",
    category: "agent",
    tagline: "Crisp Auto / Ask / Block rules above a live tool queue with one yellow Allow key.",
    motion: "0ms permission flip · 100ms queue cut-in",
    css: `
${S} .ag { width: min(100%, 660px); border: 1px solid var(--border); background: var(--panel); display: grid; }
${S} .ag-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-bottom: 1px solid var(--border); background: var(--surface-2); font-size: 12px; font-weight: 600; }
${S} .ag-rows { display: grid; }
${S} .ag-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px; padding: 7px 10px; border-bottom: 1px solid var(--line); }
${S} .ag-row b { font-size: 12px; font-weight: 500; display: block; }
${S} .ag-row small { font: 400 10px/1 var(--mono); color: var(--subtle); }
${S} .ag-seg button[data-v="block"][aria-checked="true"] { background: var(--danger); color: #ffffff; }
${S} .ag-queue { padding: 10px; background: var(--surface-2); border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
${S} .ag-call { display: grid; gap: 3px; min-width: 0; }
${S} .ag-call code { font: 500 12px/1.2 var(--mono); color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .ag-acts { display: flex; gap: 6px; }
${S}.is-tile .ag-row:nth-child(n+4) { display: none; }
${S}.is-tile .ag-row { padding: 5px 8px; }
${S}.is-tile .ag-row small { display: none; }
${S}.is-tile .rk-seg button { height: 22px; padding: 0 7px; font-size: 10px; }
${S}.is-tile .ag-queue { padding: 7px 8px; }
${S}.is-tile .ag-call code { font-size: 10px; }
${S}.is-tile .rk-btn { height: 24px; padding: 0 8px; font-size: 11px; }
`,
    mount(host, ctx) {
      const modes = TOOLS.map((t) => t.mode);
      let qIdx = 0, decided = 0;

      host.innerHTML =
        '<div class="ag">' +
          '<div class="ag-head"><span>Autonomous permission gate</span><span class="rk-fig" id="ag-cnt"></span></div>' +
          '<div class="ag-rows"></div>' +
          '<div class="ag-queue">' +
            '<div class="ag-call"><span class="rk-fig" id="ag-risk"></span><code id="ag-cmd"></code></div>' +
            '<div class="ag-acts">' +
              '<button type="button" class="rk-btn" id="ag-deny">Deny</button>' +
              '<button type="button" class="rk-btn is-accent" id="ag-allow">Allow</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      const rowsEl = host.querySelector(".ag-rows");
      const cnt = host.querySelector("#ag-cnt");
      const risk = host.querySelector("#ag-risk");
      const cmd = host.querySelector("#ag-cmd");

      TOOLS.forEach((t, i) => {
        const r = document.createElement("div");
        r.className = "ag-row";
        r.innerHTML =
          '<div><b>' + t.name + '</b><small>' + t.scope + '</small></div>' +
          '<div class="rk-seg ag-seg" role="radiogroup" aria-label="' + t.name + '">' +
            ["auto", "ask", "block"].map((v) =>
              '<button type="button" role="radio" data-v="' + v + '" aria-checked="' + (modes[i] === v) + '">' + v[0].toUpperCase() + v.slice(1) + '</button>'
            ).join("") +
          '</div>';
        rowsEl.appendChild(r);
        const bs = [...r.querySelectorAll("button")];
        bs.forEach((b) => b.addEventListener("click", () => {
          modes[i] = b.dataset.v;
          bs.forEach((x) => x.setAttribute("aria-checked", String(x.dataset.v === modes[i])));
          drawQueue();
        }, { signal: ctx.signal }));
      });

      function drawQueue() {
        const cur = QUEUE[qIdx % QUEUE.length];
        risk.textContent = cur.risk;
        cmd.textContent = cur.cmd;
        const autoCount = modes.filter((m) => m === "auto").length;
        cnt.textContent = autoCount + " AUTO · " + decided + " DECIDED";
      }

      const advance = () => {
        decided++;
        qIdx = (qIdx + 1) % QUEUE.length;
        drawQueue();
        ctx.cutIn(host.querySelector(".ag-call"), 0);
      };
      host.querySelector("#ag-allow").addEventListener("click", advance, { signal: ctx.signal });
      host.querySelector("#ag-deny").addEventListener("click", advance, { signal: ctx.signal });
      drawQueue();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) {
        ctx.every(2400, () => { if (auto) advance(); });
      }
    },
  });
})();
