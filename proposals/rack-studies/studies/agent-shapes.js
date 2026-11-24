/* Agent Shapes, after litterthanlit/components, in Rack 2.0: a run passing along four agents. Each agent is one object
   in its own colour (tint, 1px edge in the hue, name in the hue's text) holding the shape of its way of working, from
   the original's eight. The one at work gets a second edge and its shape runs; the rest hold still. The strip says
   what is happening, with Run (the one yellow) and the clock. */
(function () {
  const offset = (fraction, duration) => `${-(((fraction % 1) + 1) % 1) * duration}ms`;

  /* --- The shapes, as markup. Each takes a size in px. --- */
  const RAYS = 8, STRETCH = 1600;
  function spark(size) {
    let rays = "";
    for (let i = 0; i < RAYS; i++) rays += `<span class="as-ray-arm" style="transform:rotate(${(i * 360) / RAYS}deg)"><span class="as-ray${i % 2 ? " is-odd" : ""}" style="animation-delay:${offset(1 - i / RAYS, STRETCH)}"></span></span>`;
    return `<span class="as-spin">${rays}</span><span class="as-core"></span>`;
  }

  const ELLIPSE = "M3 16a13 5 0 1 0 26 0a13 5 0 1 0 -26 0";
  const ORBITS = [{ angle: 0, duration: 1800 }, { angle: 60, duration: 2400 }, { angle: 120, duration: 3000 }];
  function orbit() {
    return `<svg viewBox="0 0 32 32" fill="none">${ORBITS.map(({ angle, duration }, i) => `<g transform="rotate(${angle} 16 16)">
      <path d="${ELLIPSE}" class="as-track" stroke-width="1"/>
      <path d="${ELLIPSE}" pathLength="1" stroke-dasharray="0.12 0.88" stroke-width="1.75" stroke-linecap="round" class="as-trace ${i === 0 ? "as-hi" : "as-lo"}"
        style="animation-duration:${duration}ms;animation-delay:${offset(i / 3, duration)}"/></g>`).join("")}
      <circle cx="16" cy="16" r="3" class="as-wave as-fill"/></svg>`;
  }

  const NODES = [[6, 7], [18, 4], [28, 12], [23, 26], [9, 27], [4, 17]];
  const CHORDS = [[1, 4], [2, 5]];
  const TRACE = 2400, SIGNAL = 0.16;
  const LOOP = `M${NODES.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
  const NODE_AT = (() => {
    const edges = NODES.map(([x, y], i) => { const [nx, ny] = NODES[(i + 1) % NODES.length]; return Math.hypot(nx - x, ny - y); });
    const total = edges.reduce((s, d) => s + d, 0);
    return NODES.map((_, i) => edges.slice(0, i).reduce((s, d) => s + d, 0) / total);
  })();
  function graph() {
    return `<svg viewBox="0 0 32 32" fill="none"><path d="${LOOP}" class="as-track" stroke-width="1" stroke-linejoin="round"/>
      ${CHORDS.map(([a, b]) => `<line x1="${NODES[a][0]}" y1="${NODES[a][1]}" x2="${NODES[b][0]}" y2="${NODES[b][1]}" class="as-track" stroke-width="1"/>`).join("")}
      <path d="${LOOP}" pathLength="1" stroke-dasharray="${SIGNAL} ${1 - SIGNAL}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="as-trace as-hi" style="animation-duration:${TRACE}ms"/>
      ${NODES.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.6" class="as-wave as-fill" style="animation-duration:${TRACE}ms;animation-delay:${offset(0.5 - NODE_AT[i] + SIGNAL, TRACE)}"/>`).join("")}</svg>`;
  }

  const MORPH = 3200;
  function morph() {
    return `<span class="as-morph as-ghost" style="animation-delay:${offset(-0.1, MORPH)}"></span><span class="as-morph as-form"></span>`;
  }

  const CURVE = (() => {
    const steps = 120, pts = [];
    for (let i = 0; i < steps; i++) { const t = (i / steps) * Math.PI * 2; pts.push(`${(16 + 12.5 * Math.cos(3 * t)).toFixed(2)} ${(16 + 10 * Math.sin(2 * t)).toFixed(2)}`); }
    return `M${pts.join("L")}Z`;
  })();
  const THREAD = 3200;
  const STRANDS = [{ length: 0.26, opacity: 0.2 }, { length: 0.14, opacity: 0.5 }, { length: 0.05, opacity: 1 }];
  function thread() {
    const longest = STRANDS[0].length;
    return `<svg viewBox="0 0 32 32" fill="none"><path d="${CURVE}" class="as-track" stroke-width="1"/>
      ${STRANDS.map(({ length, opacity }, i) => `<path d="${CURVE}" pathLength="1" stroke-dasharray="${length} ${1 - length}" stroke-width="1.75" stroke-linecap="round" opacity="${opacity}"
        class="as-trace ${i === STRANDS.length - 1 ? "as-hi" : "as-lo"}" style="animation-duration:${THREAD}ms;animation-delay:${offset(longest - length, THREAD)}"/>`).join("")}</svg>`;
  }

  const ASSEMBLE = 2000;
  const TILES = [{ fx: "-45%", fy: "-45%", turn: 0 }, { fx: "45%", fy: "-45%", turn: 1 }, { fx: "-45%", fy: "45%", turn: 3 }, { fx: "45%", fy: "45%", turn: 2 }];
  function fold() {
    return `<span class="as-fold">${TILES.map(({ fx, fy, turn }, i) => `<span class="as-tile${i === 3 ? " is-hi" : ""}" style="--fx:${fx};--fy:${fy};animation-delay:${offset(-turn / 4, ASSEMBLE)}"></span>`).join("")}</span>`;
  }

  /* Cubes: real CSS 3D, isometric, faces shaded by how much colour they carry, mixed against what is behind them. */
  const ISOMETRIC = "rotateX(-35.26deg) rotateY(45deg)";
  const FACES = [{ turn: "rotateX(90deg)", ink: 100 }, { turn: "rotateY(0deg)", ink: 62 }, { turn: "rotateY(180deg)", ink: 62 }, { turn: "rotateY(90deg)", ink: 38 }, { turn: "rotateY(-90deg)", ink: 38 }];
  const metrics = (size) => { const edge = size * 0.26; return { edge, half: (edge + size * 0.03) / 2 }; };
  const BLOCKS = (half) => [1, -1].flatMap((y) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => [x * half, y * half, z * half]));
  function cubelet(at, edge, hi, style = "", faceStyle = "") {
    const color = hi ? "var(--as-hi)" : "var(--as-lo)";
    return `<span class="as-3d" style="transform:translate3d(${at[0]}px,${at[1]}px,${at[2]}px)"><span class="as-3d" style="${style}">${FACES.map(({ turn, ink }) =>
      `<span class="as-face" style="width:${edge}px;height:${edge}px;left:${-edge / 2}px;top:${-edge / 2}px;transform:${turn} translateZ(${edge / 2}px);background:color-mix(in oklab, ${color} ${ink}%, var(--as-bg));${faceStyle}"></span>`).join("")}</span></span>`;
  }
  const scene = (inner, cls = "") => `<span class="as-scene"><span class="as-3d as-iso ${cls}">${inner}</span></span>`;
  function cube(size) {
    const { edge, half } = metrics(size), blocks = BLOCKS(half);
    return scene([blocks.slice(0, 4), blocks.slice(4)].map((layer, i) =>
      `<span class="as-3d as-twist${i === 0 ? " is-rev" : ""}">${layer.map((at, j) => cubelet(at, edge, i === 1 && j === 3)).join("")}</span>`).join(""));
  }
  const DROP_WINDOW = 2 / 9;
  function stack(size) {
    const { edge, half } = metrics(size), lift = edge * 2.2;
    return scene(BLOCKS(half).map((at, i) => {
      const away = `clamp(0, (${(i + 2) / 9} - var(--fs-as-build)) / ${DROP_WINDOW}, 1)`;
      return cubelet(at, edge, i === 7, `transform:translateY(calc(${away} * ${-lift}px))`, `opacity:calc(1 - ${away})`);
    }).join(""), "as-build");
  }

  const AGENTS = [
    { name: "Planner", hue: "purple", modes: [{ line: "Thinking it through", draw: spark }, { line: "Planning the changes", draw: morph }] },
    { name: "Researcher", hue: "blue", modes: [{ line: "Searching 12 sources", draw: graph }, { line: "Organizing the results", draw: cube }] },
    { name: "Coder", hue: "orange", modes: [{ line: "Building the project", draw: stack }, { line: "Running the tests", draw: fold }] },
    { name: "Reviewer", hue: "green", modes: [{ line: "Weighing 3 approaches", draw: orbit }, { line: "Drafting the answer", draw: thread }] },
  ];
  const STEPS = AGENTS.flatMap((a, ai) => a.modes.map((_, mi) => ({ ai, mi })));
  const STEP = 1.2; // s a step; the chain cuts on it
  const EASE_IO = "cubic-bezier(0.77, 0, 0.175, 1)";
  const S = ".fs-agent-shapes";
  const fmt = (s) => { const v = Math.max(0, s); return `${Math.floor(v / 60)}:${(v % 60).toFixed(1).padStart(4, "0")}`; };
  const ICON = { run: '<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M1.5 1v6l5-3z"/></svg>', stop: '<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M1.5 1.5h5v5h-5z"/></svg>' };
  let uid = 0;

  FlatPlayer.register({
    slug: "agent-shapes",
    title: "Agent Shapes",
    tagline: "A run passing along four agents; the one at work draws the shape of what it is doing.",
    css: `
@property --fs-as-build { syntax: "<number>"; inherits: true; initial-value: 1 }
@keyframes fs-as-spin { to { transform: rotate(360deg) } }
@keyframes fs-as-stretch { 0%, 100% { transform: scaleY(0.3); opacity: 0.3 } 50% { transform: scaleY(1); opacity: 1 } }
@keyframes fs-as-trace { from { stroke-dashoffset: 0 } to { stroke-dashoffset: -1 } }
@keyframes fs-as-wave { 0%, 100% { opacity: 0.2; transform: scale(0.7) } 50% { opacity: 1; transform: scale(1) } }
@keyframes fs-as-morph { 0% { border-radius: 50%; transform: rotate(0deg) scale(1) } 25% { border-radius: 28%; transform: rotate(90deg) scale(0.9) }
  50% { border-radius: 6%; transform: rotate(225deg) scale(0.78) } 75% { border-radius: 6% 50%; transform: rotate(315deg) scale(0.92) } 100% { border-radius: 50%; transform: rotate(360deg) scale(1) } }
@keyframes fs-as-assemble { 0%, 25%, 100% { transform: translate(0, 0) scale(1); opacity: 1 } 55%, 65% { transform: translate(var(--fx, 0), var(--fy, 0)) scale(0.6); opacity: 0.35 } }
@keyframes fs-as-twist { 0%, 12.5% { transform: rotateY(0deg) } 25%, 37.5% { transform: rotateY(90deg) } 50%, 62.5% { transform: rotateY(180deg) } 75%, 87.5% { transform: rotateY(270deg) } 100% { transform: rotateY(360deg) } }
@keyframes fs-as-build { 0% { --fs-as-build: 0 } 55%, 82% { --fs-as-build: 1 } 100% { --fs-as-build: 0 } }
${S} .ch { width: min(100%, 330px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px; user-select: none; -webkit-user-select: none }
${S} .ch-strip { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 6px; background: var(--panel-2) }
${S} .ch-line { font-weight: 600; margin-right: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0 }
${S} .ch-key { all: unset; box-sizing: border-box; width: 22px; height: 22px; flex: none; display: grid; place-items: center; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge);
  color: var(--ink); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out) }
${S} .ch-key svg { width: 8px; height: 8px; fill: currentColor }
${S} .ch-key:hover { background: var(--block-hover) } ${S} .ch-key:active { box-shadow: var(--edge-press); scale: 0.98 }
${S} .ch-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
${S} .ch-clock { height: 22px; display: inline-flex; align-items: center; padding: 0 6px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px/1 var(--mono); font-variant-numeric: tabular-nums }
${S} .ch-surface { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; padding: 14px }
${S} .ch-a { all: unset; box-sizing: border-box; position: relative; display: grid; grid-template-rows: auto 1fr; gap: 4px; padding: 6px; min-width: 0; aspect-ratio: 3 / 4;
  border-radius: var(--r-control); cursor: pointer; background: var(--tint); box-shadow: inset 0 0 0 1px var(--hue); color: var(--text);
  --as-bg: var(--tint); --as-hi: var(--hue); --as-lo: color-mix(in oklab, var(--hue) 55%, var(--tint)); --as-line: color-mix(in oklab, var(--hue) 28%, var(--tint));
  transition: box-shadow var(--cut-in) var(--ease-out) }
${S} .ch-a[aria-checked="true"] { box-shadow: inset 0 0 0 1px var(--hue), 0 0 0 2px var(--hue) }
${S} .ch-a:focus-visible { outline: 2px solid var(--ink); outline-offset: 4px }
${S} .ch-a:active { scale: 0.98 }
${S} .ch-name { font: 600 10px/1 var(--font); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
${S} .ch-shape { display: grid; place-items: center }
${S} .ch-shape > span { grid-area: 1 / 1; display: flex; transition: opacity var(--cut-in) var(--ease-out) }
${S} .ch-shape > span:not(.is-on) { opacity: 0 }
${S} .ch-a:not([aria-checked="true"]) .ch-shape * { animation: none !important }
${S} .ch-a:not([aria-checked="true"]) .as-ray.is-odd { transform: scaleY(0.5) }
@container (min-width: 560px) {
  ${S} .ch { width: 620px } ${S} .ch-surface { gap: 12px; padding: 16px } ${S} .ch-a { padding: 8px } ${S} .ch-name { font-size: 12px }
}
${S} .as-frame { position: relative; display: inline-block; flex: none }
${S} .as-frame svg { width: 100%; height: 100%; overflow: visible; display: block }
${S} .as-spin { position: absolute; inset: 0; animation: fs-as-spin 9s linear infinite }
${S} .as-ray-arm { position: absolute; inset: 0 }
${S} .as-ray { position: absolute; bottom: 64%; left: 50%; height: 34%; width: 9%; translate: -50% 0; transform-origin: bottom; border-radius: 1px;
  background: var(--as-lo); animation: fs-as-stretch ${STRETCH}ms ${EASE_IO} infinite }
${S} .as-core { position: absolute; top: 50%; left: 50%; width: 22%; height: 22%; translate: -50% -50%; border-radius: 50%; background: var(--as-hi) }
${S} .as-track { stroke: var(--as-line) }
${S} .as-trace { animation: fs-as-trace 2.4s linear infinite }
${S} .as-hi { stroke: var(--as-hi) } ${S} .as-lo { stroke: var(--as-lo) }
${S} .as-fill { fill: var(--as-lo) }
${S} .as-wave { transform-origin: center; transform-box: fill-box; animation: fs-as-wave 1.4s ${EASE_IO} infinite }
${S} .as-morph { position: absolute; border-radius: 50%; animation: fs-as-morph ${MORPH}ms ${EASE_IO} infinite }
${S} .as-ghost { inset: 14%; border: 1.5px solid var(--as-hi) }
${S} .as-form { inset: 24%; background: var(--as-lo) }
${S} .as-fold { position: absolute; inset: 20%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 12% }
${S} .as-tile { border-radius: 2px; background: var(--as-lo); animation: fs-as-assemble ${ASSEMBLE}ms ${EASE_IO} infinite }
${S} .as-tile.is-hi { background: var(--as-hi) }
${S} .as-scene { position: absolute; inset: 0; display: grid; place-items: center }
${S} .as-3d { position: absolute; top: 0; left: 0; transform-style: preserve-3d }
${S} .as-iso { position: relative; transform: ${ISOMETRIC} }
${S} .as-face { position: absolute }
${S} .as-twist { animation: fs-as-twist 4.8s ${EASE_IO} infinite }
${S} .as-twist.is-rev { animation-direction: reverse }
${S} .as-build { animation: fs-as-build 4.4s linear infinite }
@media (prefers-reduced-motion: reduce) {
  ${S} .as-spin, ${S} .as-ray, ${S} .as-trace, ${S} .as-wave, ${S} .as-morph, ${S} .as-tile, ${S} .as-twist, ${S} .as-build { animation: none }
  ${S} .as-ray.is-odd { transform: scaleY(0.5) }
}
`,
    mount(host, ctx) {
      const id = "fs-ch3-" + ++uid;
      const size = host.clientWidth >= 560 ? 72 : 40;
      const hueVars = (a) => `--hue: var(--clip-${a.hue}); --tint: var(--clip-${a.hue}-tint); --text: var(--clip-${a.hue}-text)`;
      host.innerHTML = `
<section class="ch" aria-labelledby="${id}">
  <div class="ch-strip">
    <button type="button" class="ch-key" aria-pressed="false" aria-label="Run"></button>
    <span class="ch-line" id="${id}"></span>
    <span class="ch-clock" aria-hidden="true">0:00.0</span>
  </div>
  <div class="ch-surface" role="radiogroup" aria-label="Agents">
    ${AGENTS.map((a, i) => `<button type="button" class="ch-a" role="radio" aria-checked="false" tabindex="${i ? -1 : 0}" style="${hueVars(a)}" aria-label="${a.name}">
      <span class="ch-name" aria-hidden="true">${a.name}</span>
      <span class="ch-shape" aria-hidden="true">${a.modes.map((m) => `<span><span class="as-frame" style="width:${size}px;height:${size}px">${m.draw(size)}</span></span>`).join("")}</span></button>`).join("")}
  </div>
  <p class="sr-only" aria-live="polite"></p>
</section>`;
      const runKey = host.querySelector(".ch-key"), line = host.querySelector(".ch-line"), clock = host.querySelector(".ch-clock"), live = host.querySelector("[aria-live]");
      const objs = [...host.querySelectorAll(".ch-a")];
      const reduced = ctx.reduced();
      const sig = { signal: ctx.signal };
      objs.forEach((o) => o.querySelector(".ch-shape > span").classList.add("is-on"));

      let t = 0, running = false, cur = null, rest = 0;
      function setRunning(x) {
        running = x;
        runKey.setAttribute("aria-pressed", x ? "true" : "false");
        runKey.setAttribute("aria-label", x ? "Stop" : "Run");
        runKey.innerHTML = x ? ICON.stop : ICON.run;
      }
      /* The working agent: its edge doubles and its shape runs; the rest hold a still shape. All cut on the frame. */
      function show(s, say) {
        if (cur && s && cur.ai === s.ai && cur.mi === s.mi) return;
        cur = s;
        objs.forEach((o, i) => {
          o.setAttribute("aria-checked", s && s.ai === i ? "true" : "false");
          if (s && s.ai === i) o.querySelectorAll(".ch-shape > span").forEach((g, j) => g.classList.toggle("is-on", j === s.mi));
        });
        if (s) objs.forEach((o, i) => (o.tabIndex = i === s.ai ? 0 : -1));
        const words = s ? AGENTS[s.ai].modes[s.mi].line : "";
        line.textContent = words;
        if (s && say !== false) live.textContent = `${AGENTS[s.ai].name}: ${words}`;
      }
      const span = STEPS.length * STEP;
      function newRun() { t = 0; rest = 0; setRunning(true); show(STEPS[0]); }

      let ghost = !reduced;
      ctx.onHand(() => (ghost = false));
      if (reduced) { setRunning(false); t = STEP * 2.5; show(STEPS[2], false); clock.textContent = fmt(t); }
      else {
        newRun();
        ctx.loop((dt) => {
          if (running) {
            t = Math.min(span, t + dt);
            clock.textContent = fmt(t);
            if (t >= span) { setRunning(false); show(null); line.textContent = "Run done"; live.textContent = "Run done"; return; }
            show(STEPS[Math.floor(t / STEP)]);
          } else if (ghost && t >= span && (rest += dt) > STEP) newRun();
        });
      }

      runKey.addEventListener("click", () => {
        if (running) { setRunning(false); live.textContent = "Stopped"; return; }
        if (reduced) return;
        if (t >= span) newRun();
        else { t = cur ? STEPS.indexOf(STEPS.find((s) => s.ai === cur.ai && s.mi === cur.mi)) * STEP : t; setRunning(true); }
      }, sig);
      /* A hand on an agent stops the run there; a second press shows its other way of working. */
      const pick = (i, focus) => {
        if (running) setRunning(false);
        const mi = cur && cur.ai === i ? 1 - cur.mi : 0;
        show({ ai: i, mi });
        if (focus) objs[i].focus();
      };
      objs.forEach((o, i) => o.addEventListener("click", () => pick(i), sig));
      host.querySelector(".ch-surface").addEventListener("keydown", (e) => {
        const at = objs.indexOf(document.activeElement);
        const mv = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (at < 0 || !mv) return;
        e.preventDefault();
        const to = (at + mv + objs.length) % objs.length;
        if (running) setRunning(false);
        show({ ai: to, mi: 0 }); objs[to].focus();
      }, sig);
    },
  });
})();
