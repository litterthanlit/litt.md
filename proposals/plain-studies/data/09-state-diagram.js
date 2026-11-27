/* Lifecycle State Machine, in Plain (Subtraction): "Agent run state machine" with five frameless typographic states
   connected by orthogonal 1px directed hairlines. The current state wears four 6px corner marks; unreachable states
   step down to 0.24 opacity while valid outgoing transition arrows and trigger buttons below stand in --ink. */
(function () {
  const STATES = [
    { id: "idle", label: "Idle", desc: "Idle · awaiting prompt · valid transition: start → Planning" },
    { id: "planning", label: "Planning", desc: "Planning · scoping 3 files · valid transition: ready → Executing" },
    { id: "executing", label: "Executing", desc: "Executing · editing & running vitest · valid: gate → Needs OK or pass → Merged" },
    { id: "needs-ok", label: "Needs OK", desc: "Needs OK · paused on shell approval · valid transition: allow → Executing" },
    { id: "merged", label: "Merged", desc: "Merged · PR #184 landed cleanly · terminal state (Reset to restart)" },
  ];

  const TRANSITIONS = [
    { id: "start", from: "idle", to: "planning", label: "start" },
    { id: "ready", from: "planning", to: "executing", label: "ready" },
    { id: "gate", from: "executing", to: "needs-ok", label: "gate" },
    { id: "allow", from: "needs-ok", to: "executing", label: "allow" },
    { id: "pass", from: "executing", to: "merged", label: "pass" },
  ];

  const TRIGGERS = [
    { key: "step", label: "Start", validIn: ["idle", "planning"], next: (cur) => (cur === "idle" ? "planning" : "executing") },
    { key: "gate", label: "Request gate", validIn: ["executing"], next: () => "needs-ok" },
    { key: "allow", label: "Allow", validIn: ["needs-ok"], next: () => "executing" },
    { key: "finish", label: "Finish", validIn: ["executing"], next: () => "merged" },
    { key: "reset", label: "Reset", validIn: ["planning", "executing", "needs-ok", "merged"], next: () => "idle" },
  ];

  PlainPlayer.registerData({
    slug: "state-diagram",
    chapter: "diagrams",
    span: "half",
    title: "Lifecycle State Machine",
    css: `
.dd-state-diagram .stm { display: grid; gap: 16px; min-width: 0 }
.dd-state-diagram .stm-desc { margin: 2px 0 0; font-size: 13px; line-height: 1.4; color: var(--muted); overflow-wrap: anywhere }
.dd-state-diagram .stm-stage { position: relative; padding: 12px 10px; min-width: 0 }
.dd-state-diagram .stm-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible }
.dd-state-diagram .stm-edge { fill: none; color: var(--line-strong);
  transition: opacity var(--dur-pare) var(--ease-out), color var(--dur-instant) var(--ease-out) }
.dd-state-diagram .stm-edge.is-valid { color: var(--ink); opacity: 1 }
.dd-state-diagram .stm-edge.is-dim { opacity: 0.24 }
.dd-state-diagram .stm-shaft,
.dd-state-diagram .stm-tip { stroke: currentColor; stroke-width: 1px; fill: none }
.dd-state-diagram .stm-edge.is-valid .stm-shaft,
.dd-state-diagram .stm-edge.is-valid .stm-tip { stroke-width: 1.45px }
.dd-state-diagram .stm-tlabel { font-family: var(--mono); font-size: 11.5px; fill: var(--muted);
  transition: fill var(--dur-instant) var(--ease-out) }
.dd-state-diagram .stm-edge.is-valid .stm-tlabel { fill: var(--ink); font-weight: 500 }
.dd-state-diagram .stm-grid { position: relative; z-index: 1; display: grid;
  grid-template-columns: auto auto auto; justify-content: space-between; align-items: center; row-gap: 72px }
.dd-state-diagram .stm-node { appearance: none; border: 0; border-radius: 0; background: var(--page); padding: 3px 4px; margin: 0;
  font-size: 14px; font-weight: 500; line-height: 1.3; letter-spacing: -0.008em; color: var(--ink); white-space: nowrap;
  cursor: pointer; -webkit-tap-highlight-color: transparent; transition: opacity var(--dur-pare) var(--ease-out) }
.dd-state-diagram .stm-node.is-dim { opacity: 0.24 }
.dd-state-diagram .stm-node:focus-visible { outline: 2px solid var(--focus); outline-offset: 6px }
.dd-state-diagram .stm-node[data-id="idle"] { grid-column: 1; grid-row: 1; justify-self: start }
.dd-state-diagram .stm-node[data-id="planning"] { grid-column: 2; grid-row: 1; justify-self: center }
.dd-state-diagram .stm-node[data-id="executing"] { grid-column: 3; grid-row: 1; justify-self: end }
.dd-state-diagram .stm-node[data-id="needs-ok"] { grid-column: 2; grid-row: 2; justify-self: center }
.dd-state-diagram .stm-node[data-id="merged"] { grid-column: 3; grid-row: 2; justify-self: end }
.dd-state-diagram .stm-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 22px;
  padding: 10px 12px 0; border-top: 1px solid var(--line) }
.dd-state-diagram .stm-trig { font-size: 13.5px; min-height: 28px }
.dd-state-diagram .stm-trig:disabled { opacity: 0.24 }
@media (max-width: 400px) {
  .dd-state-diagram .stm-stage { padding: 10px 8px }
  .dd-state-diagram .stm-node { font-size: 13.5px }
  .dd-state-diagram .stm-controls { gap: 4px 18px }
}
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="stm">
  <header class="dd-card-head">
    <div class="dd-card-title">
      <h3>Agent run state machine</h3>
      <p class="stm-desc"></p>
    </div>
  </header>
  <div class="stm-stage">
    <svg class="stm-svg" aria-hidden="true"></svg>
    <div class="stm-grid" role="group" aria-label="Agent lifecycle states">
      ${STATES.map((s) => `<button type="button" class="stm-node" data-id="${s.id}" aria-current="false">${s.label}</button>`).join("")}
    </div>
  </div>
  <div class="stm-controls" role="group" aria-label="State machine triggers">
    ${TRIGGERS.map((t) => `<button type="button" class="q stm-trig" data-trig="${t.key}">${t.label}</button>`).join("")}
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const stageEl = host.querySelector(".stm-stage");
      const svgEl = host.querySelector(".stm-svg");
      const descEl = host.querySelector(".stm-desc");
      const srEl = host.querySelector("[aria-live]");
      const nodeMap = new Map();
      host.querySelectorAll(".stm-node").forEach((el) => nodeMap.set(el.dataset.id, el));
      const trigEls = [...host.querySelectorAll(".stm-trig")];

      const NS = "http://www.w3.org/2000/svg";
      const edgeMap = new Map();
      TRANSITIONS.forEach((tr) => {
        const g = document.createElementNS(NS, "g");
        g.setAttribute("class", "stm-edge");
        const shaft = document.createElementNS(NS, "path");
        shaft.setAttribute("class", "stm-shaft");
        const tip = document.createElementNS(NS, "path");
        tip.setAttribute("class", "stm-tip");
        const txt = document.createElementNS(NS, "text");
        txt.setAttribute("class", "stm-tlabel");
        txt.textContent = tr.label;
        g.appendChild(shaft);
        g.appendChild(tip);
        g.appendChild(txt);
        svgEl.appendChild(g);
        edgeMap.set(tr.id, { g, shaft, tip, txt });
      });

      const frame = ctx.brackets(stageEl, { padX: 7, padY: 4, exactPad: true });
      let current = "executing";

      const snap = (v) => Math.round(v) + 0.5;
      const headRight = (x, y) =>
        `M ${(x - 4.5).toFixed(1)} ${(y - 4.5).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)} L ${(x - 4.5).toFixed(1)} ${(y + 4.5).toFixed(1)}`;
      const headLeft = (x, y) =>
        `M ${(x + 4.5).toFixed(1)} ${(y - 4.5).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + 4.5).toFixed(1)} ${(y + 4.5).toFixed(1)}`;
      const headDown = (x, y) =>
        `M ${(x - 4.5).toFixed(1)} ${(y - 4.5).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + 4.5).toFixed(1)} ${(y - 4.5).toFixed(1)}`;
      const headUp = (x, y) =>
        `M ${(x - 4.5).toFixed(1)} ${(y + 4.5).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + 4.5).toFixed(1)} ${(y + 4.5).toFixed(1)}`;

      function boxOf(el) {
        let x = 0;
        let y = 0;
        let n = el;
        while (n && n !== stageEl) {
          x += n.offsetLeft;
          y += n.offsetTop;
          n = n.offsetParent;
        }
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        return { left: x, top: y, width: w, height: h, right: x + w, bottom: y + h, cx: x + w / 2, cy: y + h / 2 };
      }

      function drawEdges() {
        const w = stageEl.offsetWidth;
        const h = stageEl.offsetHeight;
        if (!w || !h) return;
        svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);

        const bIdle = boxOf(nodeMap.get("idle"));
        const bPlan = boxOf(nodeMap.get("planning"));
        const bExec = boxOf(nodeMap.get("executing"));
        const bNeeds = boxOf(nodeMap.get("needs-ok"));
        const bMerged = boxOf(nodeMap.get("merged"));

        const yTop = snap(bPlan.cy);

        /* 1. Idle --start--> Planning */
        {
          const e = edgeMap.get("start");
          const x1 = snap(bIdle.right + 9);
          const x2 = snap(bPlan.left - 10);
          e.shaft.setAttribute("d", `M ${x1} ${yTop} H ${x2}`);
          e.tip.setAttribute("d", headRight(x2, yTop));
          e.txt.setAttribute("x", ((x1 + x2) / 2).toFixed(1));
          e.txt.setAttribute("y", (yTop - 7).toFixed(1));
          e.txt.setAttribute("text-anchor", "middle");
        }

        /* 2. Planning --ready--> Executing */
        {
          const e = edgeMap.get("ready");
          const x1 = snap(bPlan.right + 9);
          const x2 = snap(bExec.left - 10);
          e.shaft.setAttribute("d", `M ${x1} ${yTop} H ${x2}`);
          e.tip.setAttribute("d", headRight(x2, yTop));
          e.txt.setAttribute("x", ((x1 + x2) / 2).toFixed(1));
          e.txt.setAttribute("y", (yTop - 7).toFixed(1));
          e.txt.setAttribute("text-anchor", "middle");
        }

        /* Keep pass shaft 36px inside right edge so "pass" stays 100% inside stage on 320px/390px/1280px,
           and route gate shaft cleanly to the left of Merged so it never grazes Merged's "M". */
        const xPass = snap(Math.max(bMerged.left + 8, bMerged.right - 36));
        const xGateV = snap(Math.min(bMerged.left - 14, xPass - 18));
        const xAllowV = snap(Math.max(bNeeds.right + 20, xGateV - 14));

        /* 3. Executing --gate--> Needs OK (outer single 90° elbow) */
        {
          const e = edgeMap.get("gate");
          const y1 = snap(bExec.bottom + 9);
          const y2 = snap(bNeeds.cy + 6);
          const x2 = snap(bNeeds.right + 11);
          e.shaft.setAttribute("d", `M ${xGateV} ${y1} V ${y2} H ${x2}`);
          e.tip.setAttribute("d", headLeft(x2, y2));
          e.txt.setAttribute("x", ((x2 + xGateV) / 2).toFixed(1));
          e.txt.setAttribute("y", (y2 + 14).toFixed(1));
          e.txt.setAttribute("text-anchor", "middle");
        }

        /* 4. Needs OK --allow--> Executing (inner single 90° elbow, zero crossings) */
        {
          const e = edgeMap.get("allow");
          const x1 = snap(bNeeds.right + 10);
          const y1 = snap(bNeeds.cy - 7);
          const y2 = snap(bExec.bottom + 10);
          const xBend = xAllowV < xGateV - 8 ? xAllowV : snap((x1 + xGateV) / 2);
          e.shaft.setAttribute("d", `M ${x1} ${y1} H ${xBend} V ${y2}`);
          e.tip.setAttribute("d", headUp(xBend, y2));
          e.txt.setAttribute("x", (xBend - 5).toFixed(1));
          e.txt.setAttribute("y", (y1 - 6).toFixed(1));
          e.txt.setAttribute("text-anchor", "end");
        }

        /* 5. Executing --pass--> Merged (straight vertical hairline) */
        {
          const e = edgeMap.get("pass");
          const y1 = snap(bExec.bottom + 9);
          const y2 = snap(bMerged.top - 10);
          e.shaft.setAttribute("d", `M ${xPass} ${y1} V ${y2}`);
          e.tip.setAttribute("d", headDown(xPass, y2));
          e.txt.setAttribute("x", (xPass + 6).toFixed(1));
          e.txt.setAttribute("y", ((y1 + y2) / 2 + 4).toFixed(1));
          e.txt.setAttribute("text-anchor", "start");
        }
      }

      function setState(nextId, opts) {
        const o = opts || {};
        current = nextId;
        const curObj = STATES.find((s) => s.id === current) || STATES[2];

        const reachable = new Set([current]);
        const validEdges = new Set();
        TRANSITIONS.forEach((tr) => {
          if (tr.from === current) {
            reachable.add(tr.to);
            validEdges.add(tr.id);
          }
        });

        STATES.forEach((s) => {
          const btn = nodeMap.get(s.id);
          const isCur = s.id === current;
          const isReachable = reachable.has(s.id);
          btn.classList.toggle("is-dim", !isReachable);
          btn.setAttribute("aria-current", isCur ? "step" : "false");
          if (isCur) frame.moveTo(btn, { immediate: !!o.immediate });
        });

        TRANSITIONS.forEach((tr) => {
          const e = edgeMap.get(tr.id);
          const valid = validEdges.has(tr.id);
          e.g.classList.toggle("is-valid", valid);
          e.g.classList.toggle("is-dim", !valid);
          if (valid) svgEl.appendChild(e.g);
        });

        trigEls.forEach((btn, i) => {
          const trig = TRIGGERS[i];
          const enabled = trig.validIn.includes(current);
          btn.disabled = !enabled;
          if (trig.key === "step") {
            btn.textContent = current === "planning" ? "Run" : "Start";
          }
          const primary =
            enabled && (trig.key !== "reset" || current === "merged");
          btn.classList.toggle("is-ink", primary);
        });

        if (o.immediate) descEl.textContent = curObj.desc;
        else ctx.swapText(descEl, curObj.desc);
        if (o.announce) srEl.textContent = curObj.desc;
      }

      STATES.forEach((s) => {
        nodeMap.get(s.id).addEventListener("click", () => {
          setState(s.id, { immediate: false, announce: true });
        }, { signal: ctx.signal });
      });

      trigEls.forEach((btn, i) => {
        const trig = TRIGGERS[i];
        btn.addEventListener("click", () => {
          if (!trig.validIn.includes(current)) return;
          setState(trig.next(current), { immediate: false, announce: true });
        }, { signal: ctx.signal });
      });

      const relayout = () => {
        drawEdges();
        frame.refresh();
      };

      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(relayout);
        ro.observe(stageEl);
        ctx.signal.addEventListener("abort", () => ro.disconnect(), { once: true });
      }
      window.addEventListener("plainfacechange", () => requestAnimationFrame(relayout), { signal: ctx.signal });

      setState("executing", { immediate: true });
      requestAnimationFrame(() => {
        drawEdges();
        setState(current, { immediate: true });
      });
    },
  });
})();
