/* Number Ticker, after litterthanlit/components, redesigned for Rack: an agent's token usage as a device.
   The count is the study's one readout; when it changes, its digits cut to their new figures from the right,
   a tick (60ms) apart, each by opacity alone: nothing rolls or travels. Intl.NumberFormat does the grouping
   and the currency, so the Locale box (a value you step) regroups the same count and cost for en-US, de-DE,
   fr-FR or en-IN. Tokens per day are the Coder agent's object, in its orange, and today's bar grows as requests come in.
   Live is the lit key: on, requests arrive by themselves; a hand ends that. */
(function () {
  const S = ".fs-number-ticker";
  const LOCALES = ["en-US", "de-DE", "fr-FR", "en-IN"];
  const DAYS = 14;
  const PRICE = 0.000015; // dollars a token
  const moneyIn = (l) => new Intl.NumberFormat(l, { style: "currency", currency: "USD" });
  let uid = 0;

  FlatPlayer.register({
    slug: "number-ticker",
    title: "Number Ticker",
    tagline: "Tokens and cost that cut in digit by digit, in any locale.",
    css: `
${S} .nt { width: min(100%, 440px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px }
${S} .nt-strip { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 12px; background: var(--panel-2) }
${S} .nt-strip b { font-weight: 600; margin-right: auto }
${S} .nt-key { height: 22px; padding: 0 8px; border: 0; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge); font: 600 11px/22px var(--font); cursor: pointer }
${S} .nt-key:hover { background: var(--block-hover) }
${S} .nt-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
${S} .nt-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
${S} .nt-box { height: 22px; min-width: 56px; padding: 0 8px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge); font: 600 11px/22px var(--mono);
  text-align: right; cursor: ns-resize; user-select: none; touch-action: none }
${S} .nt-box:active { box-shadow: var(--edge-press) }
${S} .nt-surface { margin: 14px; padding: 12px; background: var(--panel-2); border-radius: var(--r-control); display: grid; gap: 12px }
${S} .nt-read { display: flex; align-items: baseline; gap: 8px; min-width: 0 }
${S} .nt-num { margin: 0; font: 600 24px/1 var(--mono); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; white-space: pre }
${S} .nt-num span { display: inline-block }
${S} .nt-unit { color: var(--muted) }
${S} .nt-today { margin-left: auto; font: 500 11px var(--mono); color: var(--muted); white-space: nowrap }
${S} .nt-obj { display: grid; gap: 6px; padding: 6px 8px 0; border-radius: var(--r-control); background: var(--clip-orange-tint); box-shadow: inset 0 0 0 1px var(--clip-orange) }
${S} .nt-obj b { color: var(--clip-orange-text); font-size: 11px; font-weight: 600 }
${S} .nt-clip { height: 56px; display: grid; grid-template-columns: repeat(${DAYS}, 1fr); gap: 3px; align-items: end }
${S} .nt-clip i { display: block; background: var(--clip-orange); min-height: 1px }
@container (max-width: 380px) { ${S} .nt-surface { margin: 10px; padding: 10px } ${S} .nt-num { font-size: 22px } ${S} .nt-clip { height: 44px } ${S} .nt-unit { display: none } }
@container (min-width: 600px) { ${S} .nt { width: 480px } ${S} .nt-clip { height: 72px } }
`,
    mount(host, ctx) {
      const id = "nt" + ++uid;
      host.innerHTML = `
<div class="nt" role="group" aria-labelledby="${id}-t">
  <div class="nt-strip"><b id="${id}-t">Usage</b><span class="nt-box" role="spinbutton" aria-label="Locale" tabindex="0"></span><button class="nt-key" type="button" aria-pressed="true">Live</button></div>
  <div class="nt-surface">
    <div class="nt-read"><p class="nt-num" aria-hidden="true"></p><span class="nt-unit">tokens</span><span class="nt-today" aria-hidden="true"></span></div>
    <div class="nt-obj" aria-hidden="true"><b>Coder</b><div class="nt-clip"></div></div>
  </div>
  <p class="sr-only nt-said" role="status"></p>
</div>`;
      const $ = (s) => host.querySelector(s);
      const num = $(".nt-num"), clip = $(".nt-clip"), localeBox = $('[role="spinbutton"]'), todayBox = $(".nt-today"), said = $(".nt-said"), liveKey = $(".nt-key");
      if (ctx.tile) { localeBox.tabIndex = -1; liveKey.tabIndex = -1; }

      // Tokens per day, in hundreds: a seeded clip, today last.
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const days = Array.from({ length: DAYS }, (_, i) => Math.round(900 + 700 * Math.sin(i / 2.3) + rnd() * 500));
      days[DAYS - 1] = 410;
      const bars = days.map(() => { const b = document.createElement("i"); clip.appendChild(b); return b; });
      const paintClip = () => { const max = Math.max(...days); bars.forEach((b, i) => (b.style.height = ((days[i] / max) * 100).toFixed(1) + "%")); };

      let count = 2148032, locale = 0, fmt = new Intl.NumberFormat(LOCALES[0]), money = moneyIn(LOCALES[0]);
      let shownChars = [];
      const cutTimers = [];
      /* Cut to the new figure from the right, a beat apart, each by opacity alone; unchanged digits stay. */
      function paint(first) {
        const text = fmt.format(count);
        const chars = [...text];
        const reshape = chars.length !== shownChars.length || chars.some((c, i) => /\d/.test(c) !== /\d/.test(shownChars[i] || ""));
        if (reshape) num.replaceChildren(...chars.map((c) => { const sp = document.createElement("span"); sp.textContent = c; return sp; }));
        const spans = [...num.children];
        cutTimers.forEach(clearTimeout); cutTimers.length = 0;
        let order = 0;
        for (let i = chars.length - 1; i >= 0; i--) {
          const s = spans[i], c = chars[i];
          if (!reshape && s.textContent === c) continue;
          const delay = first || ctx.reduced() ? 0 : order++ * 60;
          const cut = () => { s.textContent = c; if (!first && !ctx.reduced()) s.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 100, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }); };
          if (delay) cutTimers.push(ctx.after(delay, cut)); else cut();
        }
        shownChars = chars;
        said.textContent = text + " tokens this month, " + money.format(count * PRICE);
        localeBox.textContent = LOCALES[locale];
        localeBox.setAttribute("aria-valuetext", LOCALES[locale] + ", " + text);
        localeBox.setAttribute("aria-valuenow", String(locale + 1));
        todayBox.textContent = money.format(count * PRICE);
        paintClip();
      }
      localeBox.setAttribute("aria-valuemin", "1"); localeBox.setAttribute("aria-valuemax", String(LOCALES.length));

      function setLocale(i) {
        locale = (i + LOCALES.length) % LOCALES.length;
        fmt = new Intl.NumberFormat(LOCALES[locale]); money = moneyIn(LOCALES[locale]);
        shownChars = []; // regroup: every digit cuts again, from the right
        paint(false);
      }
      function add(n) { count += n; days[DAYS - 1] += n / 100; paint(false); }

      paint(true);

      // Requests arrive by themselves, a tick at a time, while Live is lit.
      let liveOn = !ctx.reduced(), timer = 0;
      const run = () => { clearInterval(timer); if (liveOn) timer = ctx.every(1500, () => add(400 + Math.floor(Math.random() * 3200))); };
      liveKey.setAttribute("aria-pressed", String(liveOn));
      run();
      ctx.onHand(() => { liveOn = false; liveKey.setAttribute("aria-pressed", "false"); run(); });
      liveKey.addEventListener("click", () => { liveOn = !liveOn; liveKey.setAttribute("aria-pressed", String(liveOn)); run(); said.textContent = liveOn ? "Live" : "Paused"; }, { signal: ctx.signal });

      // The Locale box: a value you set. Arrows step, a vertical drag steps every 16px (1:1, it stays), double-click returns to en-US.
      localeBox.addEventListener("keydown", (e) => {
        const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
        if (e.key === "Home") { e.preventDefault(); setLocale(0); return; }
        if (e.key === "End") { e.preventDefault(); setLocale(LOCALES.length - 1); return; }
        if (!d) return;
        e.preventDefault(); setLocale(locale + d);
      }, { signal: ctx.signal });
      let drag = null;
      localeBox.addEventListener("pointerdown", (e) => { if (e.button) return; drag = { y: e.clientY, from: locale, moved: false }; localeBox.setPointerCapture(e.pointerId); }, { signal: ctx.signal });
      localeBox.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const steps = Math.trunc((drag.y - e.clientY) / 16);
        if (steps) drag.moved = true;
        const want = (((drag.from + steps) % LOCALES.length) + LOCALES.length) % LOCALES.length;
        if (want !== locale) setLocale(want);
      }, { signal: ctx.signal });
      localeBox.addEventListener("pointerup", () => { if (drag && !drag.moved) setLocale(locale + 1); drag = null; }, { signal: ctx.signal });
      localeBox.addEventListener("pointercancel", () => { drag = null; }, { signal: ctx.signal });
      localeBox.addEventListener("dblclick", () => setLocale(0), { signal: ctx.signal });

      return { destroy() { cutTimers.forEach(clearTimeout); } };
    },
  });
})();
