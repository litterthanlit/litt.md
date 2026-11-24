/* 11-daily-rhythm.js — Daily Rhythm:
   Crisp tabular count cutting cleanly digit-by-digit (0.35 -> 1, zero blank holes) over an orange 14-day layer bar chart. */
(function () {
  const S = ".rs-daily-rhythm";
  const LOCALES = ["en-US", "de-DE", "fr-FR", "en-IN"];
  const DAYS = [48, 56, 68, 76, 84, 72, 64, 70, 82, 90, 86, 78, 88, 94];

  RackPlayer.register({
    slug: "daily-rhythm",
    title: "Daily Rhythm",
    tagline: "Live counts that cut in cleanly digit by digit — click any day or switch locale.",
    css: `
${S} .dr-wrap { padding: 12px; display: grid; gap: 10px; }
${S} .dr-read { display: flex; align-items: baseline; gap: 8px; }
${S} .dr-num { margin: 0; font: 600 24px/1 var(--mono); letter-spacing: -0.02em; white-space: pre; }
${S} .dr-num span { display: inline-block; }
${S} .dr-unit { font-size: 12px; color: var(--muted); }
${S} .dr-delta { margin-left: auto; font: 500 11px/1 var(--mono); color: var(--success); }
${S} .dr-clip {
  height: 62px; padding: 8px 6px 0; display: grid; grid-template-columns: repeat(14, 1fr);
  gap: 3px; align-items: end;
}
${S} .dr-bar {
  border: 0; padding: 0; border-radius: 1px 1px 0 0; cursor: pointer;
  background: var(--clip-orange); opacity: 0.85;
}
${S} .dr-bar.is-sel { background: var(--clip-orange-text); opacity: 1; }
${S}.is-tile .dr-num { font-size: 21px; }
${S}.is-tile .dr-clip { height: 52px; }
`,
    mount(host, ctx) {
      let loc = 0, count = 14820, selDay = 13, live = !ctx.reduced();
      let prevChars = [];

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><b>Rhythm</b><button type="button" class="rk-key" style="margin-left:auto" id="dr-loc">en-US</button><button type="button" class="rk-key is-on" id="dr-live">Live</button></div>' +
          '<div class="dr-wrap">' +
            '<div class="dr-read"><p class="dr-num" id="dr-num"></p><span class="dr-unit">moments</span><span class="dr-delta" id="dr-d">+1,240 today</span></div>' +
            '<div class="ly dr-clip" data-h="orange">' +
              DAYS.map((h, i) => '<button type="button" class="dr-bar" data-i="' + i + '" style="height:' + h + '%" aria-label="Day ' + (i + 1) + '"></button>').join("") +
            '</div>' +
          '</div>' +
        '</div>';

      const numEl = host.querySelector("#dr-num");
      const locBtn = host.querySelector("#dr-loc");
      const liveBtn = host.querySelector("#dr-live");
      const dEl = host.querySelector("#dr-d");
      const bars = [...host.querySelectorAll(".dr-bar")];

      function draw(animate) {
        const fmt = new Intl.NumberFormat(LOCALES[loc]);
        const chars = [...fmt.format(count)];
        const reshape = chars.length !== prevChars.length;
        if (reshape) {
          numEl.replaceChildren(...chars.map((c) => { const sp = document.createElement("span"); sp.textContent = c; return sp; }));
        }
        const spans = [...numEl.children];
        let ord = 0;
        for (let i = chars.length - 1; i >= 0; i--) {
          if (!reshape && spans[i].textContent === chars[i]) continue;
          spans[i].textContent = chars[i];
          if (animate && !ctx.reduced() && spans[i].animate) {
            spans[i].animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 100, delay: ord++ * 60, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
          }
        }
        prevChars = chars;
        locBtn.textContent = LOCALES[loc];
        liveBtn.classList.toggle("is-on", live);
        liveBtn.textContent = live ? "Live" : "Paused";
        bars.forEach((b, i) => b.classList.toggle("is-sel", i === selDay));
        dEl.textContent = "Day " + (selDay + 1) + " · +" + fmt.format(DAYS[selDay] * 14);
      }

      locBtn.addEventListener("click", () => { loc = (loc + 1) % LOCALES.length; prevChars = []; draw(true); }, { signal: ctx.signal });
      liveBtn.addEventListener("click", () => { live = !live; draw(false); }, { signal: ctx.signal });
      bars.forEach((b) => b.addEventListener("click", () => { selDay = +b.dataset.i; draw(false); }, { signal: ctx.signal }));
      draw(false);

      ctx.onHand(() => { live = false; draw(false); });
      ctx.every(1800, () => { if (!live) return; count += 12 + Math.floor(Math.random() * 48); draw(true); });
    },
  });
})();
