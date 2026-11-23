/* 12-toast-queue.js — Toast Queue:
   Sharp 1px-outlined notifications with vivid colored status rails that cut in (100ms) and dismiss (75ms). */
(function () {
  const S = ".rs-toast-queue";
  const POOL = [
    { title: "Patch applied to tokens.css", sub: "18/18 checks green", hue: "emerald", act: "Undo" },
    { title: "PR #175 updated on origin", sub: "rack-studies · 814b618", hue: "blue", act: "View" },
    { title: "Rate limit nearing 85%", sub: "Switched router to Fast", hue: "coral", act: "Revert" },
    { title: "Context window compacted", sub: "Freed 42k tokens", hue: "violet", act: "Restore" },
  ];

  RackPlayer.register({
    slug: "toast-queue",
    title: "Toast Queue",
    category: "control",
    tagline: "Crisp outlined notifications with vivid status rails — 100ms cut-in, 75ms dismiss, zero float.",
    motion: "100ms cut-in · 75ms cut-out",
    css: `
${S} .tq { width: min(100%, 420px); display: grid; gap: 8px; }
${S} .tq-bar { display: flex; justify-content: space-between; align-items: center; }
${S} .tq-stack { display: grid; gap: 6px; }
${S} .tq-card {
  display: grid; grid-template-columns: 5px 1fr auto auto; align-items: center; gap: 10px;
  padding: 9px 10px 9px 0; background: var(--cut); border: 1px solid var(--border-strong);
  border-radius: var(--r-control); overflow: hidden;
}
${S} .tq-rail { width: 5px; height: 100%; align-self: stretch; }
${S} .tq-rail[data-h="emerald"] { background: var(--emerald); }
${S} .tq-rail[data-h="blue"] { background: var(--blue); }
${S} .tq-rail[data-h="coral"] { background: var(--coral); }
${S} .tq-rail[data-h="violet"] { background: var(--violet); }
${S} .tq-t { font-size: 12px; font-weight: 600; }
${S} .tq-s { font: 500 10px/1.2 var(--mono); color: var(--muted); }
${S} .tq-x {
  width: 24px; height: 24px; border: 1px solid var(--line); border-radius: var(--r-control);
  background: var(--surface-2); cursor: pointer; font-size: 12px; line-height: 1;
}
${S}.is-tile .tq-card:nth-child(n+3) { display: none; }
${S}.is-tile .tq-card { padding: 7px 8px 7px 0; gap: 8px; }
${S}.is-tile .tq-bar .rk-btn { height: 23px; font-size: 11px; }
`,
    mount(host, ctx) {
      let nextId = 2;
      let list = [
        { id: 0, ...POOL[0] },
        { id: 1, ...POOL[1] },
      ];

      host.innerHTML =
        '<div class="tq" data-col>' +
          '<div class="tq-bar"><span class="rk-mono" style="font-size:11px;color:var(--muted)" id="tq-cnt"></span><button type="button" class="rk-btn is-accent" id="tq-add">Push notification</button></div>' +
          '<div class="tq-stack" id="tq-stack"></div>' +
        '</div>';

      const stack = host.querySelector("#tq-stack");
      const cnt = host.querySelector("#tq-cnt");

      function draw(animateFirst) {
        cnt.textContent = list.length + " ACTIVE";
        stack.innerHTML = list.map((t) =>
          '<div class="tq-card" data-id="' + t.id + '">' +
            '<i class="tq-rail" data-h="' + t.hue + '"></i>' +
            '<div><div class="tq-t">' + t.title + '</div><div class="tq-s">' + t.sub + '</div></div>' +
            '<button type="button" class="rk-btn" style="height:24px;padding:0 8px;font-size:11px" data-act="' + t.id + '">' + t.act + '</button>' +
            '<button type="button" class="tq-x" data-rm="' + t.id + '" aria-label="Dismiss">×</button>' +
          '</div>'
        ).join("");
        if (animateFirst && !ctx.tile && stack.firstChild) ctx.cutIn(stack.firstChild, 0);
        stack.querySelectorAll("[data-rm],[data-act]").forEach((b) => b.addEventListener("click", () => {
          const id = +(b.dataset.rm ?? b.dataset.act);
          list = list.filter((x) => x.id !== id);
          draw(false);
        }));
      }

      host.querySelector("#tq-add").addEventListener("click", () => {
        const tpl = POOL[nextId % POOL.length];
        list = [{ id: nextId++, ...tpl }, ...list].slice(0, 3);
        draw(true);
      }, { signal: ctx.signal });
      draw(false);

      let auto = !ctx.reduced();
      ctx.onHand(() => { auto = false; });
      if (auto) ctx.every(2600, () => {
        if (!auto) return;
        const tpl = POOL[nextId % POOL.length];
        list = [{ id: nextId++, ...tpl }, ...list].slice(0, 2);
        draw(false);
      });
    },
  });
})();
