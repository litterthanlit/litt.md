/* Segmented Control, redesigned in Flat: a newsletter's plan picker. The choice sits on the grey ground, where what
   is chosen is white: a white pill glides under the words on two springs (left 520/40, width 420/34, so it stretches
   a little as it travels and keeps its speed if you change your mind mid-flight). Under it one white paper holds the
   price as the one large figure, which counts to the new amount, and the one ink action. */
FlatPlayer.register({
  slug: "segmented-control",
  title: "Segmented Control",
  tagline: "One gliding indicator, full keyboard support.",
  css: `
.fs-segmented-control .sc { display: grid; justify-items: center; gap: 16px; width: min(100%, 380px) }
.fs-segmented-control .sc-group { position: relative; display: inline-flex; align-items: center; padding: 4px; border-radius: var(--r-pill); max-width: 100% }
.fs-segmented-control .sc-opt { position: relative; height: 38px; padding: 0 clamp(12px, 4cqw, 18px); border: 0; border-radius: var(--r-pill);
  background: transparent; color: var(--muted); font: 500 15px/1 var(--font); cursor: pointer; white-space: nowrap;
  transition: color var(--dur-responsive); -webkit-tap-highlight-color: transparent }
.fs-segmented-control .sc-opt:hover, .fs-segmented-control .sc-opt[aria-checked="true"] { color: var(--ink) }
.fs-segmented-control .sc-opt:active { transform: scale(0.97) }
.fs-segmented-control .sc-opt:focus-visible { outline-offset: 0 }
.fs-segmented-control .sc-pill { position: absolute; top: 4px; bottom: 4px; left: 0; width: 0; border-radius: var(--r-pill); background: var(--paper);
  opacity: 0; pointer-events: none }
.fs-segmented-control .sc-card { width: 100%; background: var(--paper); border-radius: var(--r-paper); padding: 26px 26px 24px; display: grid; gap: 4px }
.fs-segmented-control .sc-plan { font-size: 15px; font-weight: 500 }
.fs-segmented-control .sc-price { display: flex; align-items: baseline; gap: 8px; margin: 6px 0 0 }
.fs-segmented-control .sc-amount { font-size: 48px; font-weight: 600; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums }
.fs-segmented-control .sc-per { font-size: 15px; color: var(--muted) }
.fs-segmented-control .sc-note { margin: 0; font-size: 14px; color: var(--muted); min-height: 1.45em }
.fs-segmented-control .sc-go { margin-top: 14px; height: 44px; border: 0; border-radius: var(--r-pill); background: var(--ink); color: var(--on-ink);
  font: 500 15px/1 var(--font); cursor: pointer; transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1) }
.fs-segmented-control .sc-go:active { transform: scale(0.97) }
.fs-segmented-control:not(.is-tile) .sc { width: min(100%, 420px) }
.fs-segmented-control.is-tile .sc { gap: 10px; width: min(100%, 300px) }
.fs-segmented-control.is-tile .sc-opt { height: 32px; font-size: 13px; padding: 0 12px }
.fs-segmented-control.is-tile .sc-card { padding: 16px 16px 14px }
.fs-segmented-control.is-tile .sc-amount { font-size: 36px }
.fs-segmented-control.is-tile .sc-go { margin-top: 10px; height: 38px; font-size: 14px }
`,
  mount(host, ctx) {
    const plans = [
      { value: "monthly", label: "Monthly", amount: 9, per: "a month", note: "Billed every month. Stop any time." },
      { value: "yearly", label: "Yearly", amount: 84, per: "a year", note: "Two months free, billed once a year." },
      { value: "lifetime", label: "Lifetime", amount: 249, per: "once", note: "Yours for good, every future issue." },
    ];
    host.innerHTML = `<div class="sc">
      <div class="sc-group" role="radiogroup" aria-label="Billing period">
        <span class="sc-pill" aria-hidden="true"></span>
        ${plans.map((p) => `<button type="button" class="sc-opt" role="radio" data-v="${p.value}">${p.label}</button>`).join("")}
      </div>
      <div class="sc-card">
        <span class="sc-plan">Supporter</span>
        <p class="sc-price" aria-hidden="true"><span class="sc-amount"></span><span class="sc-per"></span></p>
        <p class="sc-note"></p>
        <button type="button" class="sc-go">Become a supporter</button>
      </div>
      <p class="sr-only" aria-live="polite"></p>
    </div>`;
    const group = host.querySelector(".sc-group"), pill = host.querySelector(".sc-pill"), opts = [...host.querySelectorAll(".sc-opt")];
    const amount = host.querySelector(".sc-amount"), per = host.querySelector(".sc-per"), note = host.querySelector(".sc-note");
    const go = host.querySelector(".sc-go"), live = host.querySelector("[aria-live]");

    /* Two springs, as the original: position and width move separately, so the pill stretches as it travels. */
    let left = 0, width = 0;
    const paint = () => { pill.style.transform = `translateX(${left}px)`; pill.style.width = width + "px"; };
    const sLeft = ctx.spring(0, (v) => { left = v; paint(); }, { duration: (2 * Math.PI) / Math.sqrt(520), bounce: 1 - 40 / (2 * Math.sqrt(520)) });
    const sWidth = ctx.spring(0, (v) => { width = v; paint(); }, { duration: (2 * Math.PI) / Math.sqrt(420), bounce: 1 - 34 / (2 * Math.sqrt(420)) });
    /* The price counts to the new figure: a small move, so it never bounces. */
    const sPrice = ctx.spring(84, (v) => { amount.textContent = "$" + Math.round(v); }, { duration: 0.45, bounce: 0 });

    let value = "yearly", placed = false;
    function place(animate) {
      const el = opts.find((o) => o.dataset.v === value);
      const move = animate && placed && !ctx.reduced() ? "set" : "jump";
      sLeft[move](el.offsetLeft); sWidth[move](el.offsetWidth);
      placed = true; pill.style.opacity = "1";
    }
    function select(v, focus) {
      const first = !placed;
      value = v;
      opts.forEach((o) => { const on = o.dataset.v === v; o.setAttribute("aria-checked", String(on)); o.tabIndex = on ? 0 : -1; });
      const p = plans.find((x) => x.value === v);
      per.textContent = p.per; note.textContent = p.note;
      if (first || ctx.reduced()) sPrice.jump(p.amount); else sPrice.set(p.amount);
      live.textContent = `${p.label}: $${p.amount} ${p.per}`;
      if (focus) opts.find((o) => o.dataset.v === v).focus();
      place(true);
    }

    opts.forEach((o) => o.addEventListener("click", () => select(o.dataset.v), { signal: ctx.signal }));
    group.addEventListener("keydown", (e) => {
      const i = plans.findIndex((p) => p.value === value), n = plans.length;
      let next;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = n - 1;
      else return;
      e.preventDefault();
      select(plans[next].value, true);
    }, { signal: ctx.signal });
    go.addEventListener("click", () => { go.textContent = "Thank you"; live.textContent = "Thank you for supporting"; ctx.after(1600, () => (go.textContent = "Become a supporter")); }, { signal: ctx.signal });

    /* Snap, never spring, when the control itself resizes (fonts loading, a phone turning). */
    let lastW = group.offsetWidth;
    const ro = new ResizeObserver(() => { if (group.offsetWidth === lastW) return; lastW = group.offsetWidth; place(false); });
    ro.observe(group);
    select(value);

    /* The self-run: the plans change on their own, a beat apart, until a hand arrives. */
    let ghost = !ctx.reduced();
    const order = ["monthly", "lifetime", "yearly"];
    let k = 0;
    if (ghost) ctx.every(2000, () => { if (ghost) select(order[k++ % order.length]); });
    ctx.onHand(() => { ghost = false; });

    return { destroy() { ro.disconnect(); sLeft.stop(); sWidth.stop(); sPrice.stop(); } };
  },
});
