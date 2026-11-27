/* Token Throughput, redesigned in Plain (Subtraction): live input and output tok/s meters driven solely by translateX
   inside 1px tracks. Clicking Throttle clamps runaway output bursts to 120 tok/s, sliding --p down and clearing the
   rate-limit warning into one calm capped figure. */
(function () {
  const MAX_TOK = 4000;
  const STATES = {
    normal: { inTok: 1220, outTok: 620, cost: "$0.04 / min" },
    burst: { inTok: 1140, outTok: 2680, cost: "$0.14 / min" },
  };
  const CAP_OUT = 120;

  PlainPlayer.register({
    slug: "rate-meter",
    title: "Token Throughput",
    tagline: "Input and output tok/s meters; throttle under cap.",
    css: `
.ps-rate-meter .rm { width: min(100%, 400px); display: grid; gap: 14px }
.ps-rate-meter .rm-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--line) }
.ps-rate-meter .rm-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-rate-meter .rm-acts { display: flex; align-items: center; gap: 24px; padding-right: 10px }
.ps-rate-meter .rm-acts .q { min-height: 30px }
.ps-rate-meter .rm-burst[aria-pressed="false"] { opacity: var(--unselected) }
.ps-rate-meter .rm-burst[aria-pressed="false"]:hover:not(:disabled) { opacity: 0.85 }
.ps-rate-meter .rm-burst[aria-pressed="true"] { color: var(--ink); font-weight: 500; opacity: 1; text-decoration: underline; text-underline-offset: 4px }
.ps-rate-meter .rm-burst[aria-pressed="true"]:not(:hover)::before { opacity: 0 }
.ps-rate-meter .rm-hero { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 12px }
.ps-rate-meter .rm-lead { display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: 10px }
.ps-rate-meter .rm-verdict { font-size: 13.5px; color: var(--muted); transition: color var(--dur-instant) var(--ease-out) }
.ps-rate-meter .rm-verdict.is-warn { color: var(--danger); font-weight: 500 }
.ps-rate-meter .rm-cost { font-size: 13.5px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap }
.ps-rate-meter .rm-meters { display: grid; gap: 14px }
.ps-rate-meter .rm-row { display: grid; gap: 6px }
.ps-rate-meter .rm-row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; font-size: 14px; line-height: 1.35 }
.ps-rate-meter .rm-name { font-weight: 500 }
.ps-rate-meter .rm-val { color: var(--muted); font-variant-numeric: tabular-nums }
.ps-rate-meter .rm-row.is-warn .bar-fill { background: var(--danger) }
.ps-rate-meter .rm-row.is-warn .rm-val { color: var(--danger); font-weight: 500 }
.ps-rate-meter .bar-fill { transition: transform var(--dur-settle) var(--ease-settle), background-color var(--dur-instant) var(--ease-out) }
.ps-rate-meter .rm-scale { position: relative; height: 16px; font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; user-select: none }
.ps-rate-meter .rm-scale span { position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap }
.ps-rate-meter .rm-scale .s0 { left: 0; transform: none }
.ps-rate-meter .rm-scale .s1 { left: 25% }
.ps-rate-meter .rm-scale .s2 { left: 50% }
.ps-rate-meter .rm-scale .s4 { right: 0; left: auto; transform: none }
.ps-rate-meter.is-tile .rm { width: 100%; gap: 14px }
.ps-rate-meter.is-tile .rm-burst { display: none }
`,
    mount(host, ctx) {
      let throttled = false;
      let bursting = false;
      let jitter = 0;

      host.innerHTML = `
<div class="rm">
  <div class="rm-head">
    <h3>Stream telemetry</h3>
    <div class="rm-acts">
      <button type="button" class="q rm-burst" aria-pressed="false">Burst</button>
      <button type="button" class="q is-main rm-throttle" aria-pressed="false">Throttle</button>
    </div>
  </div>
  <div class="rm-hero">
    <div class="rm-lead">
      <span class="fig rm-fig">1,840 tok/s</span>
      <span class="rm-verdict">Within cap</span>
    </div>
    <span class="rm-cost">$0.04 / min</span>
  </div>
  <div class="rm-meters">
    <div class="rm-row rm-in-row">
      <div class="rm-row-top"><span class="rm-name" id="rm-in-lbl">Input</span><span class="rm-val rm-in-val">1,220 tok/s</span></div>
      <div class="bar-track rm-in-meter" role="meter" aria-labelledby="rm-in-lbl" aria-valuemin="0" aria-valuemax="4000" aria-valuenow="1220" aria-valuetext="1,220 tokens per second"><div class="bar-fill rm-in-fill"></div></div>
    </div>
    <div class="rm-row rm-out-row">
      <div class="rm-row-top"><span class="rm-name" id="rm-out-lbl">Output</span><span class="rm-val rm-out-val">620 tok/s</span></div>
      <div class="bar-track rm-out-meter" role="meter" aria-labelledby="rm-out-lbl" aria-valuemin="0" aria-valuemax="4000" aria-valuenow="620" aria-valuetext="620 tokens per second"><div class="bar-fill rm-out-fill"></div></div>
    </div>
  </div>
  <div class="rm-scale" aria-hidden="true">
    <span class="s0">0</span>
    <span class="s1">1k</span>
    <span class="s2">2k</span>
    <span class="s4">4k tok/s</span>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const uid = Math.random().toString(36).slice(2, 7);
      const inLbl = host.querySelector("#rm-in-lbl");
      const outLbl = host.querySelector("#rm-out-lbl");
      inLbl.id = "rm-in-" + uid;
      outLbl.id = "rm-out-" + uid;

      const figEl = host.querySelector(".rm-fig");
      const verdictEl = host.querySelector(".rm-verdict");
      const costEl = host.querySelector(".rm-cost");
      const inValEl = host.querySelector(".rm-in-val");
      const outValEl = host.querySelector(".rm-out-val");
      const outRow = host.querySelector(".rm-out-row");
      const inMeter = host.querySelector(".rm-in-meter");
      const outMeter = host.querySelector(".rm-out-meter");
      inMeter.setAttribute("aria-labelledby", inLbl.id);
      outMeter.setAttribute("aria-labelledby", outLbl.id);
      const inFill = host.querySelector(".rm-in-fill");
      const outFill = host.querySelector(".rm-out-fill");
      const burstBtn = host.querySelector(".rm-burst");
      const throttleBtn = host.querySelector(".rm-throttle");
      const sr = host.querySelector("[aria-live]");

      const fmt = (n) => Math.round(n).toLocaleString("en-US");

      function compute() {
        const base = bursting ? STATES.burst : STATES.normal;
        const inTok = throttled ? (bursting ? 1140 : 640) : Math.max(80, base.inTok + jitter);
        const outTok = throttled ? CAP_OUT : Math.max(60, base.outTok - Math.round(jitter * 0.5));
        const total = inTok + outTok;
        const warn = !throttled && total >= 3200;
        const verdict = throttled
          ? `Capped \u00b7 ${CAP_OUT} tok/s`
          : warn
            ? "Near rate limit"
            : "Within cap";
        const cost = throttled
          ? (bursting ? "$0.02 / min" : "$0.01 / min")
          : base.cost;
        return { inTok, outTok, total, warn, verdict, cost };
      }

      function render(opts) {
        const o = Object.assign({ immediate: false, swapVerdict: false }, opts);
        const s = compute();
        const totalText = `${fmt(s.total)} tok/s`;
        const inText = `${fmt(s.inTok)} tok/s`;
        const outText = `${fmt(s.outTok)} tok/s`;

        figEl.textContent = totalText;
        inValEl.textContent = inText;
        outValEl.textContent = outText;

        verdictEl.classList.toggle("is-warn", s.warn);
        outRow.classList.toggle("is-warn", s.warn);

        if (o.immediate || !o.swapVerdict) {
          verdictEl.textContent = s.verdict;
          costEl.textContent = s.cost;
        } else {
          ctx.swapText(verdictEl, s.verdict);
          ctx.swapText(costEl, s.cost);
        }

        inMeter.setAttribute("aria-valuenow", String(s.inTok));
        inMeter.setAttribute("aria-valuetext", `${fmt(s.inTok)} tokens per second`);
        outMeter.setAttribute("aria-valuenow", String(s.outTok));
        outMeter.setAttribute("aria-valuetext", `${fmt(s.outTok)} tokens per second${throttled ? ", capped" : ""}`);

        inFill.style.setProperty("--p", Math.min(1, s.inTok / MAX_TOK).toFixed(4));
        outFill.style.setProperty("--p", Math.min(1, s.outTok / MAX_TOK).toFixed(4));

        throttleBtn.setAttribute("aria-pressed", throttled ? "true" : "false");
        const tLabel = throttled ? "Uncap" : "Throttle";
        if (o.immediate) throttleBtn.textContent = tLabel;
        else ctx.swapText(throttleBtn, tLabel);

        burstBtn.setAttribute("aria-pressed", bursting ? "true" : "false");
        return s;
      }

      throttleBtn.addEventListener("click", () => {
        throttled = !throttled;
        jitter = 0;
        const s = render({ swapVerdict: true });
        sr.textContent = throttled
          ? `Throttled. Output capped at ${CAP_OUT} tokens per second. Total ${fmt(s.total)} tokens per second.`
          : `Uncapped. ${s.verdict}, ${fmt(s.total)} tokens per second.`;
      }, { signal: ctx.signal });

      burstBtn.addEventListener("click", () => {
        bursting = !bursting;
        jitter = 0;
        const s = render({ swapVerdict: true });
        sr.textContent = bursting
          ? `Stream burst active. ${s.verdict}, ${fmt(s.total)} tokens per second.`
          : `Stream returned to normal. ${s.verdict}, ${fmt(s.total)} tokens per second.`;
      }, { signal: ctx.signal });

      render({ immediate: true });

      function cycle() {
        ctx.demoAfter(2000, () => {
          bursting = true;
          render({ swapVerdict: true });
          ctx.demoAfter(2100, () => {
            throttled = true;
            render({ swapVerdict: true });
            ctx.demoAfter(2500, () => {
              throttled = false;
              bursting = false;
              render({ swapVerdict: true });
              cycle();
            });
          });
        });
      }
      cycle();
    },
  });
})();
