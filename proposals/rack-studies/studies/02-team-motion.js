/* 02-team-motion.js — Team in Motion:
   Four luminous agent cards on one surface; the active one fills gently from below with one plain line. */
(function () {
  const S = ".rs-team-motion";
  const AGENTS = [
    { name: "Plan", hue: "purple", line: "Sketching the layout" },
    { name: "Explore", hue: "blue", line: "Found 3 clean patterns" },
    { name: "Build", hue: "orange", line: "Writing the component" },
    { name: "Polish", hue: "green", line: "Everything passes" },
  ];

  RackPlayer.register({
    slug: "team-motion",
    title: "Team in Motion",
    tagline: "Four teammates on one quiet lane — click any card to hand them the baton.",
    css: `
${S} .tm-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
${S} .tm-card {
  position: relative; height: 118px; padding: 8px; border: 0; text-align: left; cursor: pointer;
  display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;
}
${S} .tm-fill { position: absolute; left: 0; right: 0; bottom: 0; opacity: 0.24; pointer-events: none; }
${S} .tm-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; pointer-events: none; }
${S} .tm-name { position: relative; font-size: 11px; font-weight: 600; }
${S} .tm-line { position: relative; font-size: 10px; font-weight: 400; line-height: 1.3; opacity: 0.9; }
${S}.is-tile .tm-card { height: 104px; padding: 7px; }
`,
    mount(host, ctx) {
      let cur = 0, progress = 0.52, running = !ctx.reduced();

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><b>Team</b><button type="button" class="rk-key is-on" style="margin-left:auto" id="tm-run">Running</button></div>' +
          '<div class="rk-surf"><div class="tm-grid">' +
            AGENTS.map((a, i) =>
              '<button type="button" class="ly tm-card" data-i="' + i + '" data-h="' + a.hue + '">' +
                '<i class="tm-fill" style="background:var(--clip-' + a.hue + ')"></i>' +
                '<i class="tm-bar" style="background:var(--clip-' + a.hue + ')"></i>' +
                '<span class="tm-name">' + a.name + '</span>' +
                '<span class="tm-line"></span>' +
              '</button>'
            ).join("") +
          '</div></div>' +
        '</div>';

      const cards = [...host.querySelectorAll(".tm-card")];
      const runBtn = host.querySelector("#tm-run");

      function draw() {
        runBtn.classList.toggle("is-on", running);
        runBtn.textContent = running ? "Running" : "Paused";
        cards.forEach((c, i) => {
          const on = i === cur;
          c.classList.toggle("is-sel", on);
          c.querySelector(".tm-line").textContent = on ? AGENTS[i].line : "";
          c.querySelector(".tm-fill").style.height = on ? Math.round(progress * 100) + "%" : "0%";
          c.querySelector(".tm-bar").style.opacity = on ? "1" : "0.18";
        });
      }

      cards.forEach((c) => c.addEventListener("click", () => { cur = +c.dataset.i; progress = 0.25; draw(); }, { signal: ctx.signal }));
      runBtn.addEventListener("click", () => { running = !running; draw(); }, { signal: ctx.signal });
      draw();

      ctx.loop((dt) => {
        if (!running) return;
        progress += dt * 0.28;
        if (progress >= 1) { progress = 0; cur = (cur + 1) % AGENTS.length; }
        draw();
      });
    },
  });
})();
