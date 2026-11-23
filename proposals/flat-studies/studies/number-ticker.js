/* Number Ticker, after litterthanlit/components, redesigned for Flat: a newsletter's subscriber count on a
   paper card. The count is the one large figure; each of its digits rolls on its own spring, forward through
   9 to 0 when it counts up (as a counter carries) and back when it counts down, the rightmost first.
   Readers arrive by themselves while it runs; a hand picks the period (Today, This week, All time) and the
   figure rolls to it. Intl.NumberFormat does the formatting, so any locale works. */
(function () {
  const S = ".fs-number-ticker";
  const FIGURES = Array.from({ length: 20 }, (_, i) => String(i % 10)); // two turns, so a digit can carry either way
  const STAGGER = 45; // ms between one digit starting and the next, from the right
  const DIGIT = { duration: (2 * Math.PI) / Math.sqrt(150), bounce: 1 - 21 / (2 * Math.sqrt(150)) }; // the original's k 150, c 21
  const FORMAT = new Intl.NumberFormat("en-US");
  const BASE = [
    { key: "today", label: "Today", value: 38, change: 12, since: "than yesterday" },
    { key: "week", label: "This week", value: 412, change: 64, since: "than last week" },
    { key: "all", label: "All time", value: 12480, change: 1240, since: "this month" },
  ];
  let uid = 0;

  FlatPlayer.register({
    slug: "number-ticker",
    title: "Number Ticker",
    tagline: "A count that rolls, digit by digit, any locale.",
    css: `
${S} .nt { width: min(100%, 360px); background: var(--paper); border-radius: var(--r-paper); padding: 22px 22px 20px; display: grid; gap: 4px; text-align: left }
${S} .nt-label { color: var(--muted); font-size: 14px }
${S} .nt-num { margin: 0; display: flex; align-items: center; font-size: 48px; font-weight: 600; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; height: 1.15em }
${S} .nt-digit { position: relative; height: 1.15em; width: 0.62em; overflow: hidden; flex: none;
  mask-image: linear-gradient(transparent, #000 22%, #000 78%, transparent); -webkit-mask-image: linear-gradient(transparent, #000 22%, #000 78%, transparent) }
${S} .nt-strip { position: absolute; inset: 0 0 auto; display: flex; flex-direction: column; will-change: transform }
${S} .nt-strip span { display: grid; place-items: center; height: 1.15em }
${S} .nt-sep { flex: none; width: 0.26em; text-align: center }
${S} .nt-change { display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--muted); min-height: 20px }
${S} .nt-change b { font-weight: 500; color: var(--ink) }
${S} .nt-seg { position: relative; margin-top: 16px; display: grid; grid-template-columns: repeat(3, 1fr); height: 40px; padding: 0; border-radius: var(--r-pill) }
${S} .nt-thumb { position: absolute; top: 0; bottom: 0; left: 0; width: calc(100% / 3); border-radius: var(--r-pill); background: var(--bubble) }
${S} .nt-opt { position: relative; border: 0; background: transparent; border-radius: var(--r-pill); font-size: 14px; color: var(--muted); cursor: pointer; padding: 0 6px;
  white-space: nowrap; transition: color var(--dur-instant) }
${S} .nt-opt:hover { color: var(--ink) }
${S} .nt-opt[aria-checked="true"] { color: var(--ink); font-weight: 500 }
@container (max-width: 380px) {
  ${S} .nt { padding: 18px 18px 16px }
  ${S} .nt-num { font-size: 42px }
  ${S} .nt-seg { margin-top: 12px; height: 36px }
}
`,
    mount(host, ctx) {
      const id = "nt" + ++uid;
      const PERIODS = BASE.map((p) => Object.assign({}, p));
      host.innerHTML = `
<div class="nt">
  <span class="nt-label" id="${id}-l">Subscribers</span>
  <p class="nt-num"><span class="sr-only nt-said"></span><span class="nt-digits" aria-hidden="true" style="display:contents"></span></p>
  <span class="nt-change"></span>
  <div class="nt-seg" role="radiogroup" aria-label="Period"><span class="nt-thumb" aria-hidden="true"></span></div>
  <p class="sr-only nt-live" aria-live="polite"></p>
</div>`;
      const $ = (s) => host.querySelector(s);
      const digitsEl = $(".nt-digits"), said = $(".nt-said"), live = $(".nt-live"), changeEl = $(".nt-change"), seg = $(".nt-seg"), thumb = $(".nt-thumb");
      const digits = new Map(); // keyed from the right, so digits stay put when the length changes

      function makeDigit(order) {
        const el = document.createElement("span");
        el.className = "nt-digit";
        const strip = document.createElement("span");
        strip.className = "nt-strip";
        strip.innerHTML = FIGURES.map((d) => "<span>" + d + "</span>").join("");
        el.appendChild(strip);
        const d = { el, order, at: 0, target: 0, timer: 0 };
        d.spring = ctx.spring(0, (pos) => {
          d.at = pos;
          strip.style.transform = "translateY(" + (-pos * 5).toFixed(3) + "%)";
          if (pos === d.target && pos >= 10) { d.target = pos - 10; d.spring.jump(pos - 10); } // fold back onto the first turn
        }, DIGIT);
        d.roll = (figure, direction) => {
          clearTimeout(d.timer);
          const from = Math.round(d.at) % 10;
          if (from === figure && Math.abs(d.at - Math.round(d.at)) < 0.01) return;
          if (ctx.reduced()) { d.target = figure; d.spring.jump(figure); return; }
          const start = direction < 0 && figure > from ? from + 10 : from;
          const to = direction > 0 && figure < from ? figure + 10 : figure;
          if (start !== from) d.spring.jump(start);
          d.timer = ctx.after(d.order * STAGGER, () => { d.target = to; d.spring.set(to); });
        };
        return d;
      }

      let at = 2, value = PERIODS[2].value, change = PERIODS[2].change;
      function render(direction, first) {
        const formatted = FORMAT.format(value);
        said.textContent = formatted + " subscribers";
        const chars = formatted.split("");
        const count = chars.filter((c) => /\d/.test(c)).length;
        let seen = 0;
        const nodes = [], keep = new Set();
        for (const c of chars) {
          if (!/\d/.test(c)) { const s = document.createElement("span"); s.className = "nt-sep"; s.textContent = c; nodes.push(s); continue; }
          const fromRight = count - seen++;
          keep.add(fromRight);
          let d = digits.get(fromRight);
          if (!d) {
            d = makeDigit(fromRight - 1); digits.set(fromRight, d);
            if (!first && !ctx.reduced()) d.el.animate([{ width: "0em", opacity: 0 }, { width: "0.62em", opacity: 1 }], { duration: 250, easing: "ease-out" });
          }
          nodes.push(d.el);
          d.next = Number(c);
        }
        for (const [k, d] of digits) if (!keep.has(k)) { d.spring.stop(); clearTimeout(d.timer); digits.delete(k); }
        digitsEl.replaceChildren(...nodes);
        if (!first) for (const d of digits.values()) d.roll(d.next, direction);
        changeEl.innerHTML = "<b>+" + FORMAT.format(change) + "</b><span>" + PERIODS[at].since + "</span>";
      }

      /* The period picker: a radiogroup, the grey bubble gliding under the chosen one. */
      const thumbX = ctx.spring(at, (x) => { thumb.style.transform = "translateX(" + (x * 100).toFixed(2) + "%)"; });
      thumbX.jump(at);
      const opts = PERIODS.map((p, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "nt-opt"; b.setAttribute("role", "radio"); b.textContent = p.label;
        if (ctx.tile) b.tabIndex = -1;
        seg.appendChild(b);
        return b;
      });
      function pick(i, said) {
        const before = value;
        at = i; value = PERIODS[i].value; change = PERIODS[i].change;
        opts.forEach((b, j) => { b.setAttribute("aria-checked", String(j === i)); if (!ctx.tile) b.tabIndex = j === i ? 0 : -1; });
        thumbX.set(i);
        render(value >= before ? 1 : -1);
        if (said) live.textContent = PERIODS[i].label + ": " + FORMAT.format(value) + " subscribers";
      }
      opts.forEach((b, i) => {
        b.addEventListener("click", () => pick(i, true), { signal: ctx.signal });
        b.addEventListener("keydown", (e) => {
          const n = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: PERIODS.length - 1 }[e.key];
          if (n === undefined) return;
          e.preventDefault();
          const k = (n + PERIODS.length) % PERIODS.length;
          pick(k, true); opts[k].focus();
        }, { signal: ctx.signal });
      });
      opts.forEach((b, j) => { b.setAttribute("aria-checked", String(j === at)); if (!ctx.tile) b.tabIndex = j === at ? 0 : -1; });

      // Digits mount at 0 and roll to the count on the first frame.
      render(1, true);
      requestAnimationFrame(() => { if (!ctx.signal.aborted) for (const d of digits.values()) d.roll(d.next, 1); });

      // Readers arrive by themselves (now and then one leaves) until a hand arrives.
      let auto = 0;
      if (!ctx.reduced()) auto = ctx.every(2600, () => {
        const by = Math.random() < 0.2 ? -1 : 1 + Math.floor(Math.random() * (at === 2 ? 40 : 6));
        const before = value;
        value = Math.max(0, value + by);
        PERIODS[at].value = value; // keeps the period's own count for when the hand comes back to it
        if (by > 0) change += by;
        render(value >= before ? 1 : -1);
      });
      ctx.onHand(() => clearInterval(auto));

      return { destroy() { thumbX.stop(); for (const d of digits.values()) { d.spring.stop(); clearTimeout(d.timer); } } };
    },
  });
})();
