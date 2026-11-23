/* Agent Loaders, after litterthanlit/components, redesigned for Flat (round 2).
   The product underneath is one question: how should your assistant say it's working? One sheet of paper shows one
   way at a time, large, with what it is doing in words and how long it has been at it; a row of pills picks the style,
   the chosen one in a grey bubble that slides to it. No dots: the shimmer sweeps a light across a large word, the pixel
   wave is nine rounded squares swelling along the diagonal, the spinner is an ink arc stepping round its grey ring ten
   times a second, and typing is three short pills hopping in a bubble. Still under reduced motion, each a status. */
(function () {
  const SPRING = "linear(0, 0.0897, 0.2671, 0.4643, 0.6434, 0.7874, 0.8925, 0.9624, 1.004, 1.0249, 1.0322, 1.0295, 1.0237, 1.0173, 1.0115, 1.0068, 1.0034, 1.0012, 0.9998, 0.9992, 1)";
  const wave = Array.from({ length: 9 }, (_, i) => `<i style="animation-delay:${(Math.floor(i / 3) + (i % 3)) * 110}ms"></i>`).join("");
  const hops = [0, 1, 2].map((i) => `<i style="animation-delay:${i * 140}ms"></i>`).join("");
  const STYLES = [
    { id: "shimmer", name: "Shimmer", doing: "Thinking", art: '<span class="al-shimmer">Thinking</span>' },
    { id: "wave", name: "Wave", doing: "Searching your posts", art: `<span class="al-wave">${wave}</span>` },
    { id: "spinner", name: "Spinner", doing: "Checking 24 links", art: '<svg class="al-spin" viewBox="0 0 40 40"><circle class="al-track" cx="20" cy="20" r="15"/><circle class="al-arc" cx="20" cy="20" r="15" stroke-dasharray="23.6 70.7"/></svg>' },
    { id: "typing", name: "Typing", doing: "Writing a reply", art: `<span class="al-bubble">${hops}</span>` },
  ];

  FlatPlayer.register({
    slug: "agent-loaders",
    title: "Agent Loaders",
    tagline: "Four ways to say your assistant is working.",
    css: `
.fs-agent-loaders .al { width: min(100%, 440px); font-family: var(--font) }
.fs-agent-loaders .al-paper { background: var(--paper); border-radius: var(--r-paper); padding: 12px; display: grid; gap: 8px }
.fs-agent-loaders .al-stage { height: 200px; display: grid; place-items: center; text-align: center }
.fs-agent-loaders.is-tile .al-stage { height: 150px }
.fs-agent-loaders .al-show { display: grid; justify-items: center; gap: 14px }
.fs-agent-loaders .al-show.is-new { animation: al-in 460ms ${SPRING} }
@keyframes al-in { from { opacity: 0; transform: translateY(8px) scale(0.92) } }
.fs-agent-loaders .al-art { height: 56px; display: grid; place-items: center }
.fs-agent-loaders .al-doing { font-size: 15px; font-weight: 500; color: var(--ink); line-height: 1.2 }
.fs-agent-loaders .al-doing span { color: var(--muted); font-weight: 400; font-variant-numeric: tabular-nums; margin-left: 6px }
.fs-agent-loaders .al-show[data-style="shimmer"] .al-doing b { display: none }
.fs-agent-loaders .al-doing b { font-weight: 500 }

.fs-agent-loaders .al-shimmer { font-size: 44px; font-weight: 600; letter-spacing: -0.03em; line-height: 1;
  background-image: linear-gradient(90deg, var(--disabled) 0%, var(--disabled) 38%, var(--ink) 50%, var(--disabled) 62%, var(--disabled) 100%);
  background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: al-shimmer 1.8s linear infinite }
@keyframes al-shimmer { from { background-position: 100% 0 } to { background-position: -100% 0 } }
.fs-agent-loaders .al-wave { display: inline-grid; grid-template-columns: repeat(3, 16px); gap: 4px }
.fs-agent-loaders .al-wave i { width: 16px; height: 16px; border-radius: 5px; background: var(--ink); animation: al-wave 1.2s cubic-bezier(0.77, 0, 0.175, 1) infinite }
@keyframes al-wave { 0%, 100% { transform: scale(0.78); opacity: 0.16 } 40% { transform: scale(1); opacity: 1 } }
.fs-agent-loaders .al-spin { width: 44px; height: 44px }
.fs-agent-loaders .al-spin circle { fill: none; stroke-width: 5 }
.fs-agent-loaders .al-spin .al-track { stroke: var(--bubble) }
.fs-agent-loaders .al-spin .al-arc { stroke: var(--ink); stroke-linecap: round; transform-origin: 20px 20px; animation: al-spin 0.8s steps(10) infinite }
@keyframes al-spin { to { transform: rotate(360deg) } }
.fs-agent-loaders .al-bubble { display: inline-flex; align-items: center; gap: 6px; padding: 16px 22px; border-radius: var(--r-pill); background: var(--bubble) }
.fs-agent-loaders .al-bubble i { width: 9px; height: 18px; border-radius: var(--r-pill); background: var(--ink); animation: al-hop 1.1s cubic-bezier(0.23, 1, 0.32, 1) infinite }
@keyframes al-hop { 0%, 55%, 100% { transform: translateY(0); opacity: 0.4 } 20% { transform: translateY(-6px); opacity: 1 } }

.fs-agent-loaders .al-pick { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); padding: 0; border-radius: var(--r-pill) }
.fs-agent-loaders .al-sel { position: absolute; top: 0; bottom: 0; left: 0; border-radius: var(--r-pill); background: var(--bubble);
  transition: transform 250ms cubic-bezier(0.23, 1, 0.32, 1), width 250ms cubic-bezier(0.23, 1, 0.32, 1) }
.fs-agent-loaders .al-opt { all: unset; box-sizing: border-box; position: relative; height: 36px; display: grid; place-items: center; border-radius: var(--r-pill);
  font-size: 13px; font-weight: 500; color: var(--muted); cursor: pointer; transition: color 150ms ease-out; -webkit-tap-highlight-color: transparent }
.fs-agent-loaders .al-opt[aria-checked="true"] { color: var(--ink) }
.fs-agent-loaders .al-opt:focus-visible { outline: 2px solid var(--ink); outline-offset: -2px }
@media (prefers-reduced-motion: reduce) {
  .fs-agent-loaders .al-shimmer { animation: none; color: var(--muted); background: none }
  .fs-agent-loaders .al-wave i, .fs-agent-loaders .al-bubble i { animation: none; opacity: 0.6; transform: none }
  .fs-agent-loaders .al-spin .al-arc { animation: none }
  .fs-agent-loaders .al-show.is-new { animation: none } .fs-agent-loaders .al-sel { transition: none }
}
`,
    mount(host, ctx) {
      const S = ctx.signal, reduced = ctx.reduced();
      host.innerHTML = `
<div class="al">
  <div class="al-paper">
    <div class="al-stage"></div>
    <div class="al-pick" role="radiogroup" aria-label="Loader style"><span class="al-sel" aria-hidden="true"></span></div>
  </div>
</div>`;
      const stage = host.querySelector(".al-stage"), pick = host.querySelector(".al-pick"), sel = host.querySelector(".al-sel");
      const opts = STYLES.map((s, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "al-opt"; b.setAttribute("role", "radio"); b.textContent = s.name;
        pick.appendChild(b);
        b.addEventListener("click", () => show(i, true), { signal: S });
        b.addEventListener("keydown", (e) => {
          const n = STYLES.length, k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          const next = k ? (i + k + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
          if (next === null) return;
          e.preventDefault(); show(next, true); opts[next].focus();
        }, { signal: S });
        return b;
      });
      const start = performance.now();
      let at = -1, secs = null;
      const place = () => { const b = opts[at]; if (!b) return; sel.style.width = b.offsetWidth + "px"; sel.style.transform = `translateX(${b.offsetLeft}px)`; };
      function show(i, animate) {
        if (i === at) return;
        at = i;
        const s = STYLES[i];
        opts.forEach((b, j) => { b.setAttribute("aria-checked", String(j === i)); b.tabIndex = j === i ? 0 : -1; });
        stage.innerHTML = `<div class="al-show" data-style="${s.id}" role="status"><span class="al-art" aria-hidden="true">${s.art}</span><span class="al-doing"><b></b><span></span></span></div>`;
        const show = stage.firstChild;
        show.setAttribute("aria-label", s.doing);
        show.querySelector("b").textContent = s.doing;
        secs = show.querySelector(".al-doing span");
        tick();
        if (animate && !reduced) show.classList.add("is-new");
        place();
      }
      function tick() { if (secs) secs.textContent = Math.floor((performance.now() - start) / 1000) + "s"; }
      show(0, false);
      requestAnimationFrame(() => { if (!S.aborted) place(); });
      const ro = new ResizeObserver(place); ro.observe(pick);
      ctx.every(250, tick);

      /* The self-run: each style takes a turn until a hand picks one. */
      let cycling = !reduced;
      ctx.onHand(() => { cycling = false; });
      if (cycling) ctx.every(2400, () => { if (cycling) show((at + 1) % STYLES.length, true); });
      return { destroy() { ro.disconnect(); } };
    },
  });
})();
