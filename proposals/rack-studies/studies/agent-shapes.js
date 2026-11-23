/* Agent Shapes, after litterthanlit/components, redesigned in Rack: the shapes become the screens of an agent chain.
   Four agents sit side by side as devices, each in its own colour and each with two ways of working (the original's
   eight shapes). A run passes along the chain on the tick: the device at work lights in its colour, its screen draws
   the shape of what it is doing, its tokens count up, and its trace records when it worked under a shared playhead. A
   device switched off is skipped. Time moves the clock, the traces and the shapes; everything else cuts. */
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

  /* The chain: four agents, each a device in its own colour, each with two ways of working. A run passes along it a
     step at a time; a step is two ticks. */
  const AGENTS = [
    { id: "plan", name: "Planner", hue: "purple", modes: [{ word: "think", line: "Thinking it through", draw: spark }, { word: "plan", line: "Planning the changes", draw: morph }] },
    { id: "research", name: "Researcher", hue: "blue", modes: [{ word: "search", line: "Searching 12 sources", draw: graph }, { word: "organize", line: "Organizing the results", draw: cube }] },
    { id: "code", name: "Coder", hue: "orange", modes: [{ word: "build", line: "Building the project", draw: stack }, { word: "run tools", line: "Running the tests", draw: fold }] },
    { id: "review", name: "Reviewer", hue: "green", modes: [{ word: "reason", line: "Weighing 3 approaches", draw: orbit }, { word: "write", line: "Drafting the answer", draw: thread }] },
  ];
  const STEPS = AGENTS.flatMap((a, ai) => a.modes.map((m, mi) => ({ ai, mi })));
  const TICK = 0.6, PER = 2, TICKS = STEPS.length * PER; // 16 ticks, 9.6 s a run
  const RATE = [38, 22, 61, 30]; // tokens a second while each agent works
  const EASE_IO = "cubic-bezier(0.77, 0, 0.175, 1)";
  const S = ".fs-agent-shapes";
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
  const tok = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`) + " tok";
  let uid = 0;

  FlatPlayer.register({
    slug: "agent-shapes",
    title: "Agent Shapes",
    tagline: "A chain of agent devices; the one at work lights and draws its shape, and each leaves a trace.",
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
${S} .ch { width: min(100%, 330px); padding: 3px; background: var(--body); border-radius: var(--r-panel); display: grid; gap: 3px; user-select: none; -webkit-user-select: none }
${S} .ch-head { display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 5px; background: var(--panel-2); border-radius: var(--r-panel) }
${S} .ch-title { font-size: 12px; font-weight: 600 }
${S} .ch-line { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: auto; min-width: 0 }
${S} .ch-clock { font: 600 13px/1 var(--mono); font-variant-numeric: tabular-nums }
${S} .ch-key { all: unset; box-sizing: border-box; width: 22px; height: 20px; display: grid; place-items: center; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge);
  color: var(--muted); cursor: pointer; flex: none; transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
${S} .ch-key svg { width: 8px; height: 8px; fill: currentColor }
${S} .ch-key:hover { background: var(--block-hover) } ${S} .ch-key:active { box-shadow: var(--edge-press); scale: 0.98 }
${S} .ch-key.is-run[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
${S} .ch-key.is-power { width: 16px; height: 16px }
${S} .ch-key.is-power svg { width: 9px; height: 9px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: square }
${S} .ch-key.is-power[aria-checked="true"] { background: var(--ink); color: var(--panel) }
${S} .ch-key:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px }
${S} .ch-chain { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3px }
${S} .ch-dev { background: var(--panel); border-radius: var(--r-panel); overflow: hidden; min-width: 0;
  --as-bg: var(--panel-3); --as-hi: var(--control); --as-lo: color-mix(in oklab, var(--control) 60%, var(--panel-3)); --as-line: color-mix(in oklab, var(--control) 30%, var(--panel-3)) }
${S} .ch-strip { display: flex; align-items: center; gap: 5px; height: 22px; padding: 0 4px; background: var(--panel-2); transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
${S} .ch-name { font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: auto; min-width: 0 }
${S} .ch-st { font-size: 10px; color: var(--muted); white-space: nowrap }
${S} .ch-body { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px; padding: 4px }
${S} .ch-screen { position: relative; width: 40px; height: 40px; border-radius: var(--r-control); background: var(--as-bg); display: grid; place-items: center; overflow: hidden;
  transition: background-color var(--cut-in) var(--ease-out) }
${S} .ch-screen > span { grid-area: 1 / 1; display: flex; transition: opacity var(--cut-in) var(--ease-out) }
${S} .ch-screen > span:not(.is-on) { opacity: 0 }
${S} .ch-vals { display: grid; gap: 3px; align-content: center; min-width: 0 }
${S} .ch-box { height: 18px; display: flex; align-items: center; padding: 0 5px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 500 10px/1 var(--mono); font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; color: var(--ink) }
${S} .ch-box.is-tok { justify-content: flex-end; color: var(--muted) }
${S} .ch-trace { grid-column: 1 / -1; position: relative; display: grid; grid-template-columns: repeat(${TICKS}, minmax(0, 1fr)); gap: 1px; height: 8px }
${S} .ch-trace i { background: color-mix(in oklab, var(--ink) 14%, var(--panel)); border-radius: 1px }
${S} .ch-trace i.is-on { background: var(--hue) }
${S} .ch-trace b { position: absolute; top: -1px; bottom: -1px; width: 1px; background: var(--ink); left: calc(var(--x, 0) * 100%) }
${S} .ch-dev.is-work { --as-bg: var(--tint); --as-hi: var(--hue); --as-lo: color-mix(in oklab, var(--hue) 55%, var(--tint)); --as-line: color-mix(in oklab, var(--hue) 25%, var(--tint)) }
${S} .ch-dev.is-work .ch-strip { background: var(--hue); color: var(--panel) }
${S} .ch-dev.is-work .ch-st { color: var(--panel) }
${S} .ch-dev.is-work .ch-box.is-mode { background: var(--tint); color: var(--text) }
${S} .ch-dev.is-off .ch-body { opacity: 0.45 }
${S} .ch-dev:not(.is-work) .ch-screen * { animation: none !important }
${S} .ch-dev:not(.is-work) .as-ray.is-odd { transform: scaleY(0.5) }
@container (min-width: 600px) {
  ${S} .ch { width: 720px; gap: 4px; padding: 4px }
  ${S} .ch-chain { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px }
  ${S} .ch-clock { font-size: 20px } ${S} .ch-head { height: 32px } ${S} .ch-line { font-size: 12px }
  ${S} .ch-strip { height: 26px; padding: 0 6px } ${S} .ch-name { font-size: 12px }
  ${S} .ch-body { grid-template-columns: 1fr; padding: 6px; gap: 5px }
  ${S} .ch-screen { width: 100%; height: 84px }
  ${S} .ch-box { height: 20px; font-size: 11px }
  ${S} .ch-vals { grid-template-columns: 1fr 1fr }
  ${S} .ch-trace { height: 10px }
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
      const id = "fs-ch-" + ++uid;
      const big = host.clientWidth >= 600, size = big ? 60 : 30;
      const hueVars = (a) => `--hue: var(--clip-${a.hue}); --tint: var(--clip-${a.hue}-tint); --text: var(--clip-${a.hue}-text)`;
      host.innerHTML = `
<div class="ch">
  <div class="ch-head">
    <button type="button" class="ch-key is-run" aria-pressed="false" aria-label="Run"></button>
    <span class="ch-title" id="${id}">Chain</span>
    <span class="ch-line" aria-hidden="true"></span>
    <span class="ch-clock" aria-hidden="true">0:00.0</span>
  </div>
  <div class="ch-chain" role="toolbar" aria-labelledby="${id}">
    ${AGENTS.map((a, i) => `<section class="ch-dev" style="${hueVars(a)}" aria-label="${a.name}">
      <div class="ch-strip">
        <button type="button" class="ch-key is-power" role="switch" aria-checked="true" tabindex="${i ? -1 : 0}" aria-label="${a.name} enabled"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1v4M2.6 2.8a3.2 3.2 0 1 0 4.8 0"/></svg></button>
        <span class="ch-name">${a.name}</span><span class="ch-st" aria-hidden="true">Waiting</span>
      </div>
      <div class="ch-body" aria-hidden="true">
        <span class="ch-screen">${a.modes.map((m) => `<span>${`<span class="as-frame" style="width:${size}px;height:${size}px">${m.draw(size)}</span>`}</span>`).join("")}</span>
        <span class="ch-vals"><span class="ch-box is-mode">${a.modes[0].word}</span><span class="ch-box is-tok">0 tok</span></span>
        <span class="ch-trace">${"<i></i>".repeat(TICKS)}<b></b></span>
      </div>
    </section>`).join("")}
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const runKey = host.querySelector(".is-run"), line = host.querySelector(".ch-line"), clock = host.querySelector(".ch-clock"), live = host.querySelector("[aria-live]");
      const devs = AGENTS.map((a, i) => {
        const el = host.querySelectorAll(".ch-dev")[i];
        return { a, el, power: el.querySelector(".is-power"), st: el.querySelector(".ch-st"), glyphs: [...el.querySelectorAll(".ch-screen > span")],
          mode: el.querySelector(".is-mode"), tokEl: el.querySelector(".is-tok"), cells: [...el.querySelectorAll(".ch-trace i")], head: el.querySelector(".ch-trace b"), tokens: 0 };
      });
      const reduced = ctx.reduced();
      const sig = { signal: ctx.signal };
      const ICON = { run: '<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M1.5 1v6l5-3z"/></svg>', stop: '<svg viewBox="0 0 8 8" aria-hidden="true"><path d="M1.5 1.5h5v5h-5z"/></svg>' };

      let t = 0, running = false, step = -1, run = 1, rest = 0;
      const on = (d) => d.power.getAttribute("aria-checked") === "true";
      /* Which step is live at a tick: the run walks the steps in order, skipping a device that is off. */
      const plan = () => STEPS.filter((s) => on(devs[s.ai]));
      function setRunning(x) {
        running = x;
        runKey.setAttribute("aria-pressed", x ? "true" : "false");
        runKey.setAttribute("aria-label", x ? "Stop" : "Run");
        runKey.innerHTML = x ? ICON.stop : ICON.run;
      }
      function showStep(s) {
        devs.forEach((d, i) => {
          const working = s && s.ai === i;
          d.el.classList.toggle("is-work", !!working);
          d.el.classList.toggle("is-off", !on(d));
          if (working) {
            d.glyphs.forEach((g, j) => g.classList.toggle("is-on", j === s.mi));
            d.mode.textContent = d.a.modes[s.mi].word;
          } else if (!d.glyphs.some((g) => g.classList.contains("is-on"))) d.glyphs[0].classList.add("is-on");
        });
        const done = (i) => plan().filter((p) => p.ai === i).every((p) => STEPS.indexOf(p) < STEPS.indexOf(s || {}));
        devs.forEach((d, i) => (d.st.textContent = !on(d) ? "Off" : s && s.ai === i ? "Working" : s && done(i) ? "Done" : "Waiting"));
        line.textContent = s ? AGENTS[s.ai].modes[s.mi].line : "";
      }
      function paint() {
        const p = plan(), k = Math.floor(t / TICK), cur = p[Math.floor(k / PER)];
        if (cur !== step) {
          step = cur;
          showStep(cur);
          if (cur) live.textContent = `${AGENTS[cur.ai].name}: ${AGENTS[cur.ai].modes[cur.mi].line}`;
        }
        devs.forEach((d) => d.head.style.setProperty("--x", Math.min(1, t / (TICK * TICKS)).toFixed(4)));
        clock.textContent = fmt(t);
      }
      function lightCell(k) {
        const p = plan(), s = p[Math.floor(k / PER)];
        if (!s) return;
        devs[s.ai].cells[k].classList.add("is-on");
      }
      function newRun() {
        t = 0; step = -1; rest = 0;
        devs.forEach((d) => { d.tokens = 0; d.tokEl.textContent = tok(0); d.cells.forEach((c) => c.classList.remove("is-on")); });
        setRunning(true);
        lightCell(0); paint();
      }

      /* Time moves things: the clock, the traces and the tokens run with the chain; the device at work cuts in on the
         tick. When the plan is done the run ends, and a new one starts two ticks later until a hand comes. */
      let ghost = !reduced;
      ctx.onHand(() => (ghost = false));
      const span = () => plan().length * PER * TICK;
      if (reduced) {
        setRunning(false);
        t = TICK * 6.5;
        for (let k = 0; k <= 6; k++) lightCell(k);
        devs[0].tokens = 1520; devs[1].tokens = 610;
        devs.forEach((d) => (d.tokEl.textContent = tok(d.tokens)));
        paint();
      } else {
        newRun();
        ctx.loop((dt) => {
          if (running) {
            const before = Math.floor(t / TICK);
            t += dt;
            if (t >= span()) { t = span(); setRunning(false); showStep(null); devs.forEach((d) => (d.st.textContent = on(d) ? "Done" : "Off")); line.textContent = `Run ${run} done`; live.textContent = `Run ${run} done`; clock.textContent = fmt(t); return; }
            const k = Math.floor(t / TICK);
            if (k !== before) lightCell(k);
            if (step) { const d = devs[step.ai]; d.tokens += dt * RATE[step.ai] * 40; d.tokEl.textContent = tok(d.tokens); }
            paint();
          } else if (ghost && t > 0 && (rest += dt) > TICK * 2) { run++; newRun(); }
        });
      }

      runKey.addEventListener("click", () => {
        if (running) { setRunning(false); line.textContent = "Stopped"; live.textContent = "Stopped"; return; }
        if (reduced) return;
        if (t >= span() || t === 0) { run++; newRun(); } else setRunning(true);
      }, sig);
      devs.forEach((d, i) => d.power.addEventListener("click", () => {
        const x = !on(d);
        d.power.setAttribute("aria-checked", x ? "true" : "false");
        step = undefined; paint();
        if (!running) showStep(null);
        devs.forEach((e) => e.el.classList.toggle("is-off", !on(e)));
        live.textContent = `${d.a.name} ${x ? "on" : "off"}`;
      }, sig));
      const powers = devs.map((d) => d.power);
      host.querySelector(".ch-chain").addEventListener("keydown", (e) => {
        const at = powers.indexOf(document.activeElement);
        const mv = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
        if (at < 0 || !mv) return;
        e.preventDefault();
        const to = (at + mv + powers.length) % powers.length;
        powers.forEach((p, j) => (p.tabIndex = j === to ? 0 : -1));
        powers[to].focus();
      }, sig);
    },
  });
})();
