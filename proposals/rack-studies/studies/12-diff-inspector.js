/* 12-diff-inspector.js — Crisp 1px-ruled inline patch inspector with file rail, instant Accept / Reject
   keys, keyboard navigation (J/K, A/R), and a stacked decision progress strip. */
(function () {
  const S = ".rs-diff-inspector";
  const HUNKS = [
    { file: "tokens.css", line: "@@ -2451,4 +2451,4 @@", del: "--rack-radius-control: 4px;", add: "--rack-radius-control: 0px;" },
    { file: "agent-chain.tsx", line: "@@ -112,3 +112,3 @@", del: "transition: width 250ms ease;", add: "transition: none; /* 0ms on the frame */" },
    { file: "wall-tile.tsx", line: "@@ -88,3 +88,3 @@", del: "box-shadow: var(--shadow-float);", add: "border: 1px solid var(--border);" },
    { file: "deal.ts", line: "@@ -44,3 +44,3 @@", del: "stagger: 50, spring: true", add: "stagger: 36, opacityOnly: true" },
  ];

  RackPlayer.register({
    slug: "diff-inspector",
    title: "Inline Patch Inspector",
    category: "agent",
    tagline: "Crisp file rail and hunk reviewer with instant Accept / Reject keys and zero fade.",
    motion: "0ms file switch · 0ms hunk verdict · stacked progress bar",
    css: `
${S} .di { width: min(100%, 760px); border: 1px solid var(--border); background: var(--panel); display: grid; }
${S} .di-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 7px 10px; border-bottom: 1px solid var(--border); background: var(--surface-2); }
${S} .di-prog { display: flex; gap: 3px; align-items: center; }
${S} .di-pip { width: 18px; height: 8px; border: 1px solid var(--border-soft); background: var(--cut); }
${S} .di-pip.is-acc { background: var(--green); border-color: var(--ink); }
${S} .di-pip.is-rej { background: var(--amber); border-color: var(--ink); }
${S} .di-main { display: grid; grid-template-columns: 180px 1fr; }
${S} .di-rail { border-right: 1px solid var(--border); display: grid; align-content: start; background: var(--surface-2); }
${S} .di-file { border: 0; border-bottom: 1px solid var(--line); background: transparent; padding: 9px 10px; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 6px; font: 500 11px/1.2 var(--mono); min-width: 0; }
${S} .di-file span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
${S} .di-file:hover { background: var(--block-hover); }
${S} .di-file.is-on { background: var(--ink); color: var(--on-ink); }
${S} .di-badge { font-size: 9px; padding: 2px 4px; border: 1px solid currentColor; }
${S} .di-pane { padding: 12px; display: grid; gap: 10px; align-content: space-between; background: var(--cut); }
${S} .di-code { font: 400 12px/1.6 var(--mono); display: grid; border: 1px solid var(--line-strong); }
${S} .di-line { padding: 4px 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
${S} .di-line.is-h { background: var(--surface-2); color: var(--subtle); font-size: 11px; border-bottom: 1px solid var(--line); }
${S} .di-line.is-del { background: var(--amber-tint); color: var(--amber-text); }
${S} .di-line.is-add { background: var(--green-tint); color: var(--green-text); }
${S} .di-acts { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
${S}.is-tile .di-main { grid-template-columns: 110px 1fr; }
${S}.is-tile .di-file { padding: 6px; font-size: 10px; }
${S}.is-tile .di-pane { padding: 8px; gap: 6px; }
${S}.is-tile .di-code { font-size: 10px; }
${S}.is-tile .rk-btn { height: 22px; padding: 0 7px; font-size: 10px; }
`,
    mount(host, ctx) {
      let at = 0;
      const verdict = ["acc", null, null, null];

      host.innerHTML =
        '<div class="di">' +
          '<div class="di-top"><span style="font-weight:600;font-size:12px">Patch review · 4 hunks</span><div class="di-prog" id="di-prog"></div></div>' +
          '<div class="di-main">' +
            '<div class="di-rail"></div>' +
            '<div class="di-pane">' +
              '<div class="di-code" id="di-code"></div>' +
              '<div class="di-acts">' +
                '<span class="rk-fig" id="di-stat"></span>' +
                '<div style="display:flex;gap:6px"><button type="button" class="rk-btn" id="di-rej">Reject [R]</button><button type="button" class="rk-btn is-accent" id="di-acc">Accept [A]</button></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      const rail = host.querySelector(".di-rail");
      const prog = host.querySelector("#di-prog");
      const code = host.querySelector("#di-code");
      const stat = host.querySelector("#di-stat");

      const fBtns = HUNKS.map((h, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "di-file";
        b.innerHTML = '<span>' + h.file + '</span><span class="di-badge"></span>';
        b.addEventListener("click", () => { at = i; draw(); }, { signal: ctx.signal });
        rail.appendChild(b);
        return b;
      });

      function draw() {
        const h = HUNKS[at];
        fBtns.forEach((b, i) => {
          b.classList.toggle("is-on", i === at);
          const v = verdict[i];
          b.querySelector(".di-badge").textContent = v === "acc" ? "OK" : v === "rej" ? "NO" : "••";
        });
        prog.innerHTML = verdict.map((v) => '<i class="di-pip' + (v ? " is-" + v : "") + '"></i>').join("");
        code.innerHTML =
          '<div class="di-line is-h">' + h.file + " " + h.line + '</div>' +
          '<div class="di-line is-del">− ' + h.del + '</div>' +
          '<div class="di-line is-add">+ ' + h.add + '</div>';
        const done = verdict.filter(Boolean).length;
        stat.textContent = done + " / " + HUNKS.length + " DECIDED";
      }

      const decide = (v) => {
        verdict[at] = v;
        at = (at + 1) % HUNKS.length;
        draw();
      };
      host.querySelector("#di-acc").addEventListener("click", () => decide("acc"), { signal: ctx.signal });
      host.querySelector("#di-rej").addEventListener("click", () => decide("rej"), { signal: ctx.signal });
      host.addEventListener("keydown", (e) => {
        if (e.key === "a" || e.key === "A") decide("acc");
        else if (e.key === "r" || e.key === "R") decide("rej");
        else if (e.key === "j" || e.key === "ArrowDown") { at = (at + 1) % HUNKS.length; draw(); }
        else if (e.key === "k" || e.key === "ArrowUp") { at = (at - 1 + HUNKS.length) % HUNKS.length; draw(); }
      }, { signal: ctx.signal });

      draw();

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) {
        ctx.every(1900, () => {
          if (!auto) return;
          verdict[at] = at === 2 ? "rej" : "acc";
          at = (at + 1) % HUNKS.length;
          draw();
        });
      }
    },
  });
})();
