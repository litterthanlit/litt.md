/* Agent Shapes, after litterthanlit/components, redesigned in Flat: one glyph that follows an agent's run. A white
   paper holds the glyph large, the step in words (the one large figure is the sentence), and how far along as eight
   short pills walking the sunset ramp; opened, the phases are pills to pick from. Each glyph is soft grey with its one
   bright part in the ink. The eight shapes and their keyframes are the original's. */
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

  const PHASES = [
    { phase: "thinking", name: "Spark", label: "Thinking", draw: spark, line: "Thinking it through" },
    { phase: "searching", name: "Graph", label: "Searching", draw: graph, line: "Searching 12 sources" },
    { phase: "organizing", name: "Cube", label: "Organizing", draw: cube, line: "Organizing the results" },
    { phase: "reasoning", name: "Orbit", label: "Reasoning", draw: orbit, line: "Weighing 3 approaches" },
    { phase: "planning", name: "Morph", label: "Planning", draw: morph, line: "Planning the changes" },
    { phase: "building", name: "Stack", label: "Building", draw: stack, line: "Building the project" },
    { phase: "running", name: "Fold", label: "Running", draw: fold, line: "Running the tests" },
    { phase: "writing", name: "Thread", label: "Writing", draw: thread, line: "Drafting the answer" },
  ];
  const shape = (i, size) => `<span class="as-frame" style="width:${size}px;height:${size}px">${PHASES[i].draw(size)}</span>`;
  const EASE_IO = "cubic-bezier(0.77, 0, 0.175, 1)", EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

  const EXPRESSIVE = "linear(0, 0.0897, 0.2671, 0.4643, 0.6434, 0.7874, 0.8925, 0.9624, 1.004, 1.0249, 1.0322, 1.0295, 1.0237, 1.0173, 1.0115, 1.0068, 1.0034, 1.0012, 0.9998, 0.9992, 1)";
  const S = ".fs-agent-shapes";
  let uid = 0;

  FlatPlayer.register({
    slug: "agent-shapes",
    title: "Agent Shapes",
    tagline: "Abstract shapes for how an agent thinks.",
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
@keyframes fs-as-shimmer { from { background-position: 100% 0 } to { background-position: -100% 0 } }

${S} { --as-hi: var(--ink); --as-bg: var(--paper); --as-lo: color-mix(in oklab, var(--ink) 55%, var(--paper)); --as-line: color-mix(in oklab, var(--ink) 15%, var(--paper)) }
${S} .as { width: min(100%, 300px); background: var(--paper); border-radius: var(--r-paper); padding: 20px 20px 18px; display: grid; justify-items: center; gap: 14px;
  user-select: none; -webkit-user-select: none }
${S} .as-glyph { display: grid; place-items: center; height: var(--g); width: 100% }
${S} .as-glyph > span { grid-area: 1 / 1; display: flex }
${S} .as-line { max-width: 100%; font-size: 18px; font-weight: 500; letter-spacing: -0.01em; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  background-image: linear-gradient(90deg, var(--muted) 0%, var(--muted) 40%, var(--ink) 50%, var(--muted) 60%, var(--muted) 100%);
  background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: fs-as-shimmer 2s linear infinite }
${S} .as-steps { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px }
${S} .as-bar { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 4px }
${S} .as-seg { height: 6px; border-radius: 3px; background: var(--bubble); overflow: hidden }
${S} .as-seg i { display: block; height: 100%; border-radius: inherit; background: var(--c); transform-origin: left center; transform: scaleX(0);
  transition: transform 250ms cubic-bezier(0.23, 1, 0.32, 1) }
${S} .as-seg.is-done i { transform: none }
${S} .as-n { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap }
${S} .as-pick { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; margin-top: 4px }
${S} .as-pill { all: unset; box-sizing: border-box; height: 36px; padding: 0 14px; border-radius: var(--r-pill); font-size: 14px; font-weight: 500; color: var(--muted);
  cursor: pointer; display: inline-flex; align-items: center; transition: background-color 150ms, color 150ms; -webkit-tap-highlight-color: transparent }
${S} .as-pill:hover { color: var(--ink) }
${S} .as-pill[aria-checked="true"] { background: var(--bubble); color: var(--ink) }
${S} .as-pill:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px }
${S} .as-pill:active { scale: 0.97 }
${S}.is-tile .as-pick { display: none }
@container (max-width: 519px) { ${S}:not(.is-tile) .as { width: min(100%, 340px) } ${S} .as-pill { height: 32px; padding: 0 11px; font-size: 13px } }
@container (min-width: 520px) {
  ${S} .as { width: 500px; padding: 36px 32px 24px; gap: 18px }
  ${S} .as-line { font-size: 28px; font-weight: 600; letter-spacing: -0.025em }
  ${S} .as-steps { width: 340px }
}

${S} .as-frame { position: relative; display: inline-block; flex: none }
${S} .as-frame svg { width: 100%; height: 100%; overflow: visible; display: block }
${S} .as-spin { position: absolute; inset: 0; animation: fs-as-spin 9s linear infinite }
${S} .as-ray-arm { position: absolute; inset: 0 }
${S} .as-ray { position: absolute; bottom: 64%; left: 50%; height: 34%; width: 9%; translate: -50% 0; transform-origin: bottom; border-radius: 999px;
  background: var(--as-lo); animation: fs-as-stretch ${STRETCH}ms ${EASE_IO} infinite }
${S} .as-core { position: absolute; top: 50%; left: 50%; width: 22%; height: 22%; translate: -50% -50%; border-radius: 50%; background: var(--as-hi) }
${S} .as-track { stroke: var(--as-line) }
${S} .as-trace { animation: fs-as-trace 2.4s linear infinite }
${S} .as-hi { stroke: var(--as-hi) } ${S} .as-lo { stroke: var(--as-lo) }
${S} .as-fill { fill: var(--as-lo) }
${S} .as-wave { transform-origin: center; transform-box: fill-box; animation: fs-as-wave 1.4s ${EASE_IO} infinite }
${S} .as-morph { position: absolute; border-radius: 50%; animation: fs-as-morph ${MORPH}ms ${EASE_IO} infinite }
${S} .as-ghost { inset: 14%; border: 2px solid var(--as-hi) }
${S} .as-form { inset: 24%; background: var(--as-lo) }
${S} .as-fold { position: absolute; inset: 20%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 12% }
${S} .as-tile { border-radius: 22%; background: var(--as-lo); animation: fs-as-assemble ${ASSEMBLE}ms ${EASE_IO} infinite }
${S} .as-tile.is-hi { background: var(--as-hi) }
${S} .as-scene { position: absolute; inset: 0; display: grid; place-items: center }
${S} .as-3d { position: absolute; top: 0; left: 0; transform-style: preserve-3d }
${S} .as-iso { position: relative; transform: ${ISOMETRIC} }
${S} .as-face { position: absolute }
${S} .as-twist { animation: fs-as-twist 4.8s ${EASE_IO} infinite }
${S} .as-twist.is-rev { animation-direction: reverse }
${S} .as-build { animation: fs-as-build 4.4s linear infinite }

@media (prefers-reduced-motion: reduce) {
  ${S} .as-spin, ${S} .as-ray, ${S} .as-trace, ${S} .as-wave, ${S} .as-morph, ${S} .as-tile, ${S} .as-twist, ${S} .as-build, ${S} .as-line { animation: none }
  ${S} .as-ray.is-odd { transform: scaleY(0.5) }
  ${S} .as-line { color: var(--ink); background: none }
}
`,
    mount(host, ctx) {
      const id = "fs-as-" + ++uid;
      const SEQ = () => "var(--ink)";
      host.innerHTML = `
<div class="as">
  <div class="as-glyph" role="status" aria-labelledby="${id}"><span class="sr-only" id="${id}"></span></div>
  <div class="as-line" aria-hidden="true"></div>
  <div class="as-steps" aria-hidden="true"><span class="as-bar">${PHASES.map((_, i) => `<span class="as-seg" style="--c:${SEQ(i)}"><i></i></span>`).join("")}</span><span class="as-n"></span></div>
  <div class="as-pick" role="radiogroup" aria-label="Phase">
    ${PHASES.map((p, i) => `<button type="button" class="as-pill" role="radio" aria-checked="false" tabindex="-1">${p.label}</button>`).join("")}
  </div>
</div>`;
      const glyph = host.querySelector(".as-glyph"), said = host.querySelector(`#${id}`);
      const line = host.querySelector(".as-line"), n = host.querySelector(".as-n");
      const segs = [...host.querySelectorAll(".as-seg")], pills = [...host.querySelectorAll(".as-pill")];
      const sig = { signal: ctx.signal };
      const reduced = ctx.reduced();
      const size = () => (host.clientWidth >= 520 ? 120 : 76);
      let step = -1, shown = null, g = 0;

      /* One glyph follows the phase: the new one springs in from a little small, the old one leaves quickly, no bounce. */
      function setStep(i, focus) {
        if (i === step) return;
        step = i;
        const p = PHASES[i];
        said.textContent = p.line;
        line.textContent = p.line;
        n.textContent = `${i + 1} of ${PHASES.length}`;
        segs.forEach((s, j) => s.classList.toggle("is-done", j <= i));
        pills.forEach((b, j) => { b.setAttribute("aria-checked", j === i ? "true" : "false"); b.tabIndex = j === i ? 0 : -1; });
        if (focus) pills[i].focus();
        if (!g) { g = size(); glyph.style.setProperty("--g", g + "px"); }
        const next = document.createElement("span");
        next.setAttribute("aria-hidden", "true");
        next.innerHTML = shape(i, g);
        if (shown && !reduced) {
          const old = shown;
          old.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.9)" }], { duration: 150, easing: EASE_OUT, fill: "forwards" })
            .finished.then(() => old.remove(), () => old.remove());
        } else if (shown) shown.remove();
        glyph.appendChild(next);
        shown = next;
        if (!reduced) {
          next.animate([{ opacity: 0, transform: "scale(0.82)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: EXPRESSIVE, fill: "backwards" });
          line.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 210, easing: EASE_OUT, fill: "backwards" });
        }
      }
      setStep(0);

      /* The agent works through its phases by itself; a hand picks one and the run stops for good. */
      let timer = reduced ? 0 : ctx.every(2400, () => setStep((step + 1) % PHASES.length));
      ctx.onHand(() => { clearInterval(timer); timer = 0; });

      pills.forEach((b, i) => b.addEventListener("click", () => setStep(i), sig));
      host.querySelector(".as-pick").addEventListener("keydown", (e) => {
        const len = PHASES.length;
        const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        let to = null;
        if (move) to = (step + move + len) % len;
        else if (e.key === "Home") to = 0;
        else if (e.key === "End") to = len - 1;
        if (to === null) return;
        e.preventDefault();
        setStep(to, true);
      }, sig);
    },
  });
})();
