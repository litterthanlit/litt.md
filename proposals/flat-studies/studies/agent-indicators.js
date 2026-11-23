/* Agent Indicators, after litterthanlit/components, redesigned for Flat: what a writing assistant is doing
   while it drafts your post, said in one white pill on the grey ground. An ink circle holds a small glyph
   that moves its own way for each phase (thinking turns, searching seeks on a spring, reading sweeps the
   lines in bursts, reasoning tumbles, running fills a ring step by step, writing lays down lines), and the
   words say the phase. The pill grows to its words. Open, the six phases are pills to pick from. One frame
   loop draws every glyph; each runs ahead before it paints, so none is ever seen at rest. */
(function () {
  const S = ".fs-agent-indicators";
  const NS = "http://www.w3.org/2000/svg";
  const AHEAD = 1.2, CYCLE = 2400;
  const EXPRESSIVE = "linear(0, 0.0897, 0.2671, 0.4643, 0.6434, 0.7874, 0.8925, 0.9624, 1.004, 1.0249, 1.0322, 1.0295, 1.0237, 1.0173, 1.0115, 1.0068, 1.0034, 1.0012, 0.9998, 0.9992, 1)";
  const ORDER = ["thinking", "searching", "reading", "reasoning", "running", "writing"];
  const INFO = {
    thinking: { label: "Thinking", detail: "about your post" },
    searching: { label: "Searching", detail: "12 sources" },
    reading: { label: "Reading", detail: "your last three issues" },
    reasoning: { label: "Weighing", detail: "two openings" },
    running: { label: "Checking", detail: "8 links" },
    writing: { label: "Writing", detail: "the draft" },
  };
  const attr = (el, n, v) => { if (el.getAttribute(n) !== v) el.setAttribute(n, v); };
  function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  const line = (svg, x1, y, x2, extra) => el("line", Object.assign({ x1, x2, y1: y, y2: y, stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round" }, extra), svg);
  /* A damped spring stepped at 1/240s, for glyph parts that move on one. */
  const springStep = (s, dt, k, c) => { for (let left = dt; left > 0; left -= 1 / 240) { const h = Math.min(left, 1 / 240); s.v += (k * (s.target - s.x) - c * s.v) * h; s.x += s.v * h; } };

  /* Each glyph draws in a 24 unit box, in currentColor, and returns its frame. */
  const GLYPHS = {
    // A quarter arc turning round a faint ring.
    thinking(svg) {
      el("circle", { cx: 12, cy: 12, r: 7, fill: "none", stroke: "currentColor", "stroke-width": 2.4, opacity: 0.28 }, svg);
      const arc = el("circle", { cx: 12, cy: 12, r: 7, fill: "none", stroke: "currentColor", "stroke-width": 2.4, "stroke-linecap": "round", pathLength: 100, "stroke-dasharray": "28 72" }, svg);
      let a = 0, t = 0;
      return (dt) => { t += dt; a += dt * (300 + 160 * Math.sin(t * 3)); attr(arc, "transform", "rotate(" + (a % 360).toFixed(1) + " 12 12)"); };
    },
    // A lens that seeks between places on a spring (k 110, c 14: it overshoots a little and settles), and holds.
    searching(svg) {
      const g = el("g", {}, svg);
      el("circle", { cx: 11, cy: 11, r: 4.4, fill: "none", stroke: "currentColor", "stroke-width": 2.2 }, g);
      line(g, 14.4, 14.4, 17.4, { y2: 17.4, "stroke-width": 2.4 });
      const STOPS = [0.15, 0.6, 0.35, 0.85];
      const s = { x: 0.15, v: 0, target: 0.15 };
      let at = 0, dwell = 0.5, y = 0;
      return (dt) => {
        if (dwell > 0) { dwell -= dt; if (dwell <= 0) { at = (at + 1) % STOPS.length; } }
        else { const step = 0.9 * dt, goal = STOPS[at]; s.target = Math.abs(goal - s.target) <= step ? goal : s.target + Math.sign(goal - s.target) * step; if (s.target === goal) dwell = 0.5; }
        springStep(s, dt, 110, 14);
        y += dt;
        attr(g, "transform", "translate(" + ((s.x - 0.5) * 9).toFixed(2) + " " + (Math.sin(y * 2.4) * 1.2).toFixed(2) + ")");
      };
    },
    // Three lines, read in bursts: the sweep runs fast, pauses, runs again.
    reading(svg) {
      const ys = [7.5, 12, 16.5], w = [12, 12, 8];
      ys.forEach((y, i) => line(svg, 6, y, 6 + w[i], { opacity: 0.3 }));
      const lit = ys.map((y) => line(svg, 6, y, 6, { opacity: 0 }));
      const total = w.reduce((a, b) => a + b, 0);
      let p = 0, burst = 0.4, gap = 0, hold = 0;
      return (dt) => {
        if (hold > 0) { hold -= dt; if (hold <= 0) p = 0; }
        else if (burst > 0) { burst -= dt; p += dt * (16 + Math.random() * 18); if (burst <= 0) gap = 0.08 + Math.random() * 0.25; }
        else { gap -= dt; if (gap <= 0) burst = 0.15 + Math.random() * 0.35; }
        if (p >= total && hold <= 0) { p = total; hold = 0.35; }
        let left = p;
        lit.forEach((l, i) => {
          const len = Math.max(0, Math.min(w[i], left)); left -= w[i];
          attr(l, "x2", (6 + len).toFixed(2));
          attr(l, "opacity", len > 0.5 ? "1" : "0");
        });
      };
    },
    // A rounded square that tumbles a quarter turn at a time on the expressive spring, rounding as it turns.
    reasoning(svg) {
      const r = el("rect", { x: 7, y: 7, width: 10, height: 10, rx: 2.5, fill: "none", stroke: "currentColor", "stroke-width": 2.4 }, svg);
      const w = (2 * Math.PI) / 0.35, k = w * w, c = 2 * (1 - 0.28) * w;
      const s = { x: 0, v: 0, target: 0 };
      let t = 0;
      return (dt) => {
        t += dt;
        if (t >= 0.7) { t -= 0.7; s.target += 90; }
        springStep(s, dt, k, c);
        const turning = Math.min(1, Math.abs(s.target - s.x) / 45);
        attr(r, "rx", (2.5 + 2.5 * turning).toFixed(2));
        attr(r, "transform", "rotate(" + (s.x % 360).toFixed(1) + " 12 12)");
      };
    },
    // A ring filled step by step, eight steps, held full, then again.
    running(svg) {
      el("circle", { cx: 12, cy: 12, r: 7, fill: "none", stroke: "currentColor", "stroke-width": 2.4, opacity: 0.28 }, svg);
      const arc = el("circle", { cx: 12, cy: 12, r: 7, fill: "none", stroke: "currentColor", "stroke-width": 2.4, "stroke-linecap": "round", pathLength: 80,
        "stroke-dasharray": "0 80", transform: "rotate(-90 12 12)" }, svg);
      const shown = { x: 0, v: 0, target: 0 };
      let t = 0, steps = 0, stage = "run";
      return (dt) => {
        t += dt;
        if (stage === "run" && t >= 0.22) { t = 0; steps++; if (steps >= 8) stage = "hold"; }
        else if (stage === "hold" && t >= 0.5) { stage = "rest"; t = 0; steps = 0; }
        else if (stage === "rest" && t >= 0.2) { stage = "run"; t = 0; }
        shown.target = steps;
        springStep(shown, dt, 900, 60);
        const len = Math.max(0, shown.x * 10 - 3);
        attr(arc, "stroke-dasharray", len.toFixed(2) + " 80");
        attr(arc, "opacity", len > 0.1 ? "1" : "0");
      };
    },
    // Lines laid down one after another with a caret at the end, then the page clears.
    writing(svg) {
      const ys = [7.5, 12, 16.5], w = [12, 10, 7];
      const lines = ys.map((y) => line(svg, 6, y, 6, { opacity: 0 }));
      const caret = el("line", { x1: 6, x2: 6, y1: 4.5, y2: 10.5, stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round" }, svg);
      const total = w.reduce((a, b) => a + b, 0);
      let p = 0, hold = 0, fade = 1, blink = 0;
      return (dt) => {
        blink += dt;
        if (hold > 0) { hold -= dt; fade = Math.min(1, hold / 0.2); if (hold <= 0) { p = 0; fade = 1; } }
        else { p += dt * 14; if (p >= total) { p = total; hold = 0.6; } }
        let left = p, cx = 6, cy = ys[0];
        lines.forEach((l, i) => {
          const len = Math.max(0, Math.min(w[i], left)); left -= w[i];
          attr(l, "x2", (6 + len).toFixed(2));
          attr(l, "opacity", len > 0.3 ? fade.toFixed(2) : "0");
          if (len > 0) { cx = 6 + len + 2; cy = ys[i]; }
        });
        attr(caret, "transform", "translate(" + (cx - 6).toFixed(2) + " " + (cy - 7.5).toFixed(2) + ")");
        attr(caret, "opacity", hold > 0 ? (Math.floor(blink * 3) % 2 ? "0" : fade.toFixed(2)) : "1");
      };
    },
  };

  let uid = 0;
  FlatPlayer.register({
    slug: "agent-indicators",
    title: "Agent Indicators",
    tagline: "Thinking, searching, reading, weighing, checking, writing: one pill says which.",
    css: `
${S} .ai { width: 100%; display: grid; justify-items: center; gap: 28px }
${S} .ai-pill { display: inline-flex; align-items: center; gap: 12px; height: 60px; padding: 0 24px 0 10px; border-radius: var(--r-pill); background: var(--paper); max-width: 100% }
${S} .ai-glyph { position: relative; flex: none; width: 40px; height: 40px; border-radius: 50%; background: var(--ink); color: var(--on-ink); display: grid }
${S} .ai-glyph svg { grid-area: 1 / 1; width: 100%; height: 100%; padding: 6px; box-sizing: border-box; opacity: 0; transition: opacity 150ms; overflow: visible }
${S} .ai-glyph svg.is-on { opacity: 1 }
${S} .ai-words { position: relative; overflow: hidden; height: 24px; flex: none; max-width: calc(100cqw - 120px) }
${S} .ai-words span { position: absolute; left: 0; top: 0; white-space: nowrap; font-size: 17px; line-height: 24px }
${S} .ai-words b { font-weight: 600 }
${S} .ai-words i { font-style: normal; color: var(--muted) }
${S} .ai-picks { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; max-width: 100% }
${S} .ai-pick { height: 40px; padding: 0 16px; border: 0; border-radius: var(--r-pill); background: transparent; color: var(--muted); font-size: 14px; cursor: pointer;
  transition: background-color var(--dur-instant), color var(--dur-instant), transform var(--dur-instant) }
${S} .ai-pick:hover { background: var(--wash); color: var(--ink) }
${S} .ai-pick:active { transform: scale(0.96) }
${S} .ai-pick[aria-checked="true"] { background: var(--paper); color: var(--ink); font-weight: 500 }
${S}.is-tile .ai-picks { display: none }
@container (max-width: 380px) {
  ${S} .ai-pill { height: 52px; gap: 10px; padding: 0 18px 0 8px }
  ${S} .ai-glyph { width: 36px; height: 36px }
  ${S} .ai-words { height: 22px; max-width: calc(100cqw - 90px) }
  ${S} .ai-words span { font-size: 15px; line-height: 22px }
  ${S} .ai-pick { padding: 0 12px }
}
`,
    mount(host, ctx) {
      const id = "ai" + ++uid;
      host.innerHTML = `
<div class="ai">
  <div class="ai-pill"><span class="ai-glyph" aria-hidden="true"></span><span class="ai-words" aria-hidden="true"></span></div>
  <div class="ai-picks" role="radiogroup" aria-label="Phase"></div>
  <p class="sr-only" id="${id}-live" aria-live="polite"></p>
</div>`;
      const glyph = host.querySelector(".ai-glyph"), words = host.querySelector(".ai-words"), picks = host.querySelector(".ai-picks"), live = host.querySelector("[aria-live]");
      const draws = [];
      const svgs = ORDER.map((p) => {
        const svg = el("svg", { viewBox: "0 0 24 24", focusable: "false" }, glyph);
        const draw = GLYPHS[p](svg);
        for (let t = 0; t < AHEAD; t += 1 / 60) draw(1 / 60);
        draws.push(draw);
        return svg;
      });
      const buttons = ORDER.map((p, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "ai-pick"; b.setAttribute("role", "radio"); b.textContent = INFO[p].label;
        if (ctx.tile) b.tabIndex = -1;
        picks.appendChild(b);
        return b;
      });

      /* The words box grows to its words on a spring; a new line rises in, the old one leaves without a bounce. */
      const width = ctx.spring(0, (w) => { words.style.width = w.toFixed(1) + "px"; }, { bounce: 0 });
      let at = -1, current = null;
      function choose(i, said) {
        if (i === at) return;
        const first = at === -1;
        at = i;
        const p = ORDER[i];
        svgs.forEach((s, j) => s.classList.toggle("is-on", j === i));
        buttons.forEach((b, j) => { b.setAttribute("aria-checked", String(j === i)); if (!ctx.tile) b.tabIndex = j === i ? 0 : -1; });
        const span = document.createElement("span");
        span.innerHTML = "<b></b> <i></i>";
        span.querySelector("b").textContent = INFO[p].label;
        span.querySelector("i").textContent = INFO[p].detail;
        words.appendChild(span);
        const w = span.offsetWidth;
        if (first || ctx.reduced()) { width.jump(w); if (current) current.remove(); }
        else {
          width.set(w);
          span.animate([{ transform: "translateY(18px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 380, easing: EXPRESSIVE });
          glyph.animate([{ transform: "scale(0.86)" }, { transform: "none" }], { duration: 380, easing: EXPRESSIVE });
          const old = current;
          if (old) old.animate([{ transform: "none", opacity: 1 }, { transform: "translateY(-14px)", opacity: 0 }], { duration: 160, easing: "ease-in", fill: "forwards" }).onfinish = () => old.remove();
        }
        current = span;
        if (said) live.textContent = INFO[p].label + " " + INFO[p].detail;
      }
      choose(0, false);

      // One frame loop for every glyph; under reduced motion each holds the frame it ran ahead to.
      if (!ctx.reduced()) ctx.loop((dt) => { for (const d of draws) d(dt); });

      // The phases follow one another by themselves until a hand arrives.
      let cycle = 0;
      if (!ctx.reduced()) cycle = ctx.every(CYCLE, () => choose((at + 1) % ORDER.length, false));
      ctx.onHand(() => clearInterval(cycle));
      host.addEventListener("focusin", () => clearInterval(cycle), { signal: ctx.signal });

      buttons.forEach((b, i) => {
        b.addEventListener("click", () => choose(i, true), { signal: ctx.signal });
        b.addEventListener("keydown", (e) => {
          const n = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: ORDER.length - 1 }[e.key];
          if (n === undefined) return;
          e.preventDefault();
          const k = (n + ORDER.length) % ORDER.length;
          choose(k, true); buttons[k].focus();
        }, { signal: ctx.signal });
      });
      return { destroy() { width.stop(); } };
    },
  });
})();
