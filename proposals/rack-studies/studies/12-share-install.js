/* 12-share-install.js — Share & Install:
   One strip (0ms crisp package-manager snap) + one spacious mono cut with a cyan component chip and Copy key. */
(function () {
  const S = ".rs-share-install";
  const MANAGERS = [
    { id: "npm", run: "npx shadcn add" },
    { id: "pnpm", run: "pnpm dlx shadcn add" },
    { id: "yarn", run: "yarn dlx shadcn add" },
    { id: "bun", run: "bunx shadcn add" },
  ];

  RackPlayer.register({
    slug: "share-install",
    title: "Share & Install",
    tagline: "Pick your manager and copy the command — snaps on the frame with zero lag.",
    css: `
${S} .si-surf {
  margin: 14px; min-height: 62px; padding: 0 10px 0 14px; border-radius: var(--r-control);
  background: var(--cut); box-shadow: var(--edge);
  display: flex; align-items: center; gap: 8px;
}
${S} .si-code {
  flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px;
  font: 500 13px/1 var(--mono); white-space: nowrap; overflow: hidden;
}
${S} .si-run { color: var(--muted); overflow: hidden; text-overflow: ellipsis; }
${S} .si-chip { flex: none; padding: 5px 8px; font-size: 12px; }
${S} .si-copy { flex: none; height: 28px; padding: 0 11px; }
${S}.is-tile .si-surf { margin: 10px; min-height: 54px; padding: 0 8px 0 10px; }
${S}.is-tile .si-code { font-size: 11.5px; }
`,
    mount(host, ctx) {
      let pm = 1, copied = false, timer = 0;

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><b>Install</b><div class="rk-seg" style="margin-left:auto" role="radiogroup" aria-label="Package manager">' +
            MANAGERS.map((m, i) => '<button type="button" role="radio" data-i="' + i + '">' + m.id + '</button>').join("") +
          '</div></div>' +
          '<div class="si-surf">' +
            '<code class="si-code"><span class="si-run" id="si-run"></span><span class="ly si-chip" data-h="cyan" id="si-chip">litt-ui</span></code>' +
            '<button type="button" class="rk-key si-copy" id="si-copy">Copy</button>' +
          '</div>' +
        '</div>';

      const btns = [...host.querySelectorAll("[role=radio]")];
      const runEl = host.querySelector("#si-run");
      const chip = host.querySelector("#si-chip");
      const copyBtn = host.querySelector("#si-copy");

      function draw() {
        btns.forEach((b, i) => b.setAttribute("aria-checked", String(i === pm)));
        runEl.textContent = MANAGERS[pm].run;
        chip.classList.toggle("is-sel", copied);
        copyBtn.classList.toggle("is-on", copied);
        copyBtn.textContent = copied ? "Copied ✓" : "Copy";
      }

      btns.forEach((b) => b.addEventListener("click", () => { pm = +b.dataset.i; copied = false; draw(); }, { signal: ctx.signal }));
      copyBtn.addEventListener("click", () => {
        copied = true; draw();
        try { navigator.clipboard && navigator.clipboard.writeText(MANAGERS[pm].run + " litt-ui"); } catch (e) {}
        clearTimeout(timer);
        timer = ctx.after(1600, () => { copied = false; draw(); });
      }, { signal: ctx.signal });
      draw();

      let ghost = !ctx.reduced();
      ctx.onHand(() => { ghost = false; });
      if (ghost) ctx.every(2600, () => {
        if (!ghost) return;
        if (!copied) { copied = true; }
        else { copied = false; pm = (pm + 1) % MANAGERS.length; }
        draw();
      });
    },
  });
})();
