/* Directed Agent Graph (DAG), in Plain (Subtraction): frameless Helvetica Neue nodes set in white-paper gaps along
   orthogonal 1px SVG hairlines with open 45° arrowheads. Selecting or pointing at any node frames it in four 6px
   corner marks, highlights its upstream + downstream causal path in 1.5px --ink, and steps non-causal sibling
   branches down to 0.20 opacity. */
(function () {
  const NODES = [
    {
      id: "prompt",
      title: "Prompt",
      metric: "0.0 s · 180 tok",
      shortMetric: "180 tok",
      trace: 'Prompt · "Enforce strict maxAge on refresh cookies and sync OpenAPI types" · 180 tok · Received',
    },
    {
      id: "planner",
      title: "Planner",
      metric: "0.42 s · 1.2k tok",
      shortMetric: "0.42 s",
      trace: "Planner · decomposed into 3 isolated worktrees · 0.42 s · 1.2k tok",
    },
    {
      id: "auth",
      title: "Auth patch",
      metric: "1.38 s · 3.4k tok",
      shortMetric: "1.38 s",
      branch: true,
      trace: "Auth patch · edited src/auth/cookies.ts (+18 −6) to reject stale JWTs · 1.38 s · Passed",
    },
    {
      id: "types",
      title: "API types",
      metric: "0.94 s · 2.1k tok",
      shortMetric: "0.94 s",
      branch: true,
      trace: "API types · regenerated schema/session.d.ts strict cookie flags · 0.94 s · Passed",
    },
    {
      id: "spec",
      title: "Spec writer",
      metric: "1.12 s · 2.6k tok",
      shortMetric: "1.12 s",
      branch: true,
      trace: "Spec writer · added 14 vitest cases for expired & rotated cookies · 1.12 s · Passed",
    },
    {
      id: "verifier",
      title: "Verifier",
      metric: "0.89 s · 1.5k tok",
      shortMetric: "0.89 s",
      trace: "Verifier · ran 42 assertions across 3 branches · 0.89 s · Passed",
    },
    {
      id: "pr",
      title: "Open PR #184",
      metric: "0.31 s · +64 −11",
      shortMetric: "0.31 s",
      trace: "Open PR #184 · pushed fix/cookie-ttl with 42 green checks · 0.31 s · Ready",
    },
  ];

  const EDGES = [
    ["prompt", "planner"],
    ["planner", "auth"],
    ["planner", "types"],
    ["planner", "spec"],
    ["auth", "verifier"],
    ["types", "verifier"],
    ["spec", "verifier"],
    ["verifier", "pr"],
  ];

  function computeCausal(targetId) {
    const nodes = new Set([targetId]);
    const edges = new Set();
    let changed = true;
    /* Walk upstream ancestors */
    const up = new Set([targetId]);
    while (changed) {
      changed = false;
      EDGES.forEach(([from, to], idx) => {
        if (up.has(to) && !up.has(from)) {
          up.add(from);
          changed = true;
        }
        if (up.has(to) && up.has(from)) edges.add(idx);
      });
    }
    /* Walk downstream descendants */
    const down = new Set([targetId]);
    changed = true;
    while (changed) {
      changed = false;
      EDGES.forEach(([from, to], idx) => {
        if (down.has(from) && !down.has(to)) {
          down.add(to);
          changed = true;
        }
        if (down.has(from) && down.has(to)) edges.add(idx);
      });
    }
    up.forEach((n) => nodes.add(n));
    down.forEach((n) => nodes.add(n));
    return { nodes, edges };
  }

  PlainPlayer.registerData({
    slug: "agent-dag",
    chapter: "diagrams",
    span: "full",
    title: "Directed Agent Graph",
    css: `
.dd-agent-dag .dag { display: grid; gap: 18px; min-width: 0 }
.dd-agent-dag .dag-head-actions { display: flex; align-items: center; padding: 0 12px }
.dd-agent-dag .dag-step-btn { font-size: 13.5px; min-height: 28px }
.dd-agent-dag .dag-stage { position: relative; padding: 14px 10px; min-width: 0 }
.dd-agent-dag .dag-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible }
.dd-agent-dag .dag-edge { fill: none; stroke: var(--line-strong); stroke-width: 1px;
  transition: opacity var(--dur-pare) var(--ease-out), stroke var(--dur-instant) var(--ease-out), stroke-width var(--dur-instant) var(--ease-out) }
.dd-agent-dag .dag-edge.is-causal { stroke: var(--ink); stroke-width: 1.5px; opacity: 1 }
.dd-agent-dag .dag-edge.is-dim { opacity: 0.20 }
.dd-agent-dag .dag-grid { position: relative; z-index: 1; display: grid;
  grid-template-columns: auto auto auto auto auto; align-items: center; justify-content: space-between; gap: 16px 28px }
.dd-agent-dag .dag-branches { display: grid; gap: 24px; justify-items: start }
.dd-agent-dag .dag-node { appearance: none; border: 0; border-radius: 0; background: var(--page); padding: 3px 4px; margin: 0;
  display: grid; gap: 2px; text-align: left; cursor: pointer; color: var(--ink); -webkit-tap-highlight-color: transparent;
  transition: opacity var(--dur-pare) var(--ease-out) }
.dd-agent-dag .dag-node.is-dim { opacity: 0.20 }
.dd-agent-dag .dag-node:focus-visible { outline: 2px solid var(--focus); outline-offset: 6px }
.dd-agent-dag .dag-ntitle { font-size: 14px; font-weight: 500; line-height: 1.28; letter-spacing: -0.008em; color: var(--ink); white-space: nowrap }
.dd-agent-dag .dag-nmeta { font-size: 12px; font-weight: 400; line-height: 1.3; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap }
.dd-agent-dag .dag-nmeta-short { display: none }
.dd-agent-dag .dag-stage.is-vertical { padding: 8px 8px }
.dd-agent-dag .dag-stage.is-vertical .dag-grid { grid-template-columns: minmax(0, 1fr); justify-items: center; gap: 36px }
.dd-agent-dag .dag-stage.is-vertical .dag-branches { width: 100%; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; justify-items: center }
.dd-agent-dag .dag-stage.is-vertical .dag-node { text-align: center; justify-items: center; padding: 2px 2px }
@media (max-width: 640px) {
  .dd-agent-dag .dag-stage { padding: 8px 8px }
  .dd-agent-dag .dag-grid { grid-template-columns: minmax(0, 1fr); justify-items: center; gap: 36px }
  .dd-agent-dag .dag-branches { width: 100%; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; justify-items: center }
  .dd-agent-dag .dag-node { text-align: center; justify-items: center; padding: 2px 2px }
}
@media (max-width: 440px) {
  .dd-agent-dag .dag-branches .dag-ntitle { font-size: 13px }
  .dd-agent-dag .dag-branches .dag-nmeta-full { display: none }
  .dd-agent-dag .dag-branches .dag-nmeta-short { display: inline }
}
.dd-agent-dag .dag-foot { padding-top: 10px; border-top: 1px solid var(--line); min-width: 0 }
.dd-agent-dag .dag-trace { margin: 0; font-family: var(--mono); font-size: 12.5px; line-height: 1.45; color: var(--ink);
  overflow-wrap: anywhere }
`,
    mount(host, ctx) {
      const spineBefore = NODES.slice(0, 2);
      const branches = NODES.slice(2, 5);
      const spineAfter = NODES.slice(5);

      const renderBtn = (n) => `
        <button type="button" class="dag-node" data-id="${n.id}" aria-pressed="false">
          <span class="dag-ntitle">${n.title}</span>
          <span class="dag-nmeta"><span class="dag-nmeta-full">${n.metric}</span><span class="dag-nmeta-short">${n.shortMetric}</span></span>
        </button>`;

      host.innerHTML = `
<div class="dag">
  <header class="dd-card-head">
    <div class="dd-card-title">
      <h3>Directed agent graph</h3>
      <p>3 parallel worktrees · 2.93 s critical wall time (5.06 s total compute)</p>
    </div>
    <div class="dag-head-actions">
      <button type="button" class="q is-ink dag-step-btn">Step trace</button>
    </div>
  </header>
  <div class="dag-stage">
    <svg class="dag-svg" aria-hidden="true"></svg>
    <div class="dag-grid" role="toolbar" aria-label="Agent execution graph nodes">
      ${spineBefore.map(renderBtn).join("")}
      <div class="dag-branches">
        ${branches.map(renderBtn).join("")}
      </div>
      ${spineAfter.map(renderBtn).join("")}
    </div>
  </div>
  <div class="dag-foot">
    <p class="dag-trace"></p>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const stageEl = host.querySelector(".dag-stage");
      const svgEl = host.querySelector(".dag-svg");
      const gridEl = host.querySelector(".dag-grid");
      const traceEl = host.querySelector(".dag-trace");
      const stepBtn = host.querySelector(".dag-step-btn");
      const srEl = host.querySelector("[aria-live]");
      const btnMap = new Map();
      const btns = [...host.querySelectorAll(".dag-node")];
      btns.forEach((b) => btnMap.set(b.dataset.id, b));

      const NS = "http://www.w3.org/2000/svg";
      const edgeEls = EDGES.map((_, idx) => {
        const g = document.createElementNS(NS, "g");
        g.setAttribute("class", "dag-edge");
        g.dataset.edge = String(idx);
        const shaft = document.createElementNS(NS, "path");
        const head = document.createElementNS(NS, "path");
        g.appendChild(shaft);
        g.appendChild(head);
        svgEl.appendChild(g);
        return { g, shaft, head };
      });

      const frame = ctx.brackets(stageEl, { padX: 7, padY: 5, exactPad: true });
      let selectedId = "auth";
      let hoverId = null;

      function activeId() {
        return hoverId || selectedId;
      }

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

      const snap = (v) => Math.round(v) + 0.5;
      const rightHead = (x, y) =>
        `M ${(x - 4.5).toFixed(1)} ${(y - 4.5).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)} L ${(x - 4.5).toFixed(1)} ${(y + 4.5).toFixed(1)}`;
      const downHead = (x, y) =>
        `M ${(x - 4.5).toFixed(1)} ${(y - 4.5).toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)} L ${(x + 4.5).toFixed(1)} ${(y - 4.5).toFixed(1)}`;

      function drawEdges() {
        const w = stageEl.offsetWidth;
        const h = stageEl.offsetHeight;
        if (!w || !h) return;
        const vertical = window.matchMedia("(max-width: 640px)").matches || w < 580;
        stageEl.classList.toggle("is-vertical", vertical);

        const nw = stageEl.offsetWidth;
        const nh = stageEl.offsetHeight;
        svgEl.setAttribute("viewBox", `0 0 ${nw} ${nh}`);

        const b = {};
        NODES.forEach((n) => {
          b[n.id] = boxOf(btnMap.get(n.id));
        });

        if (!vertical) {
          const ySpine = snap(b.types.cy);
          const padOut = 11;
          const padIn = 13;
          const brLeft = Math.min(b.auth.left, b.types.left, b.spec.left);
          const brRight = Math.max(b.auth.right, b.types.right, b.spec.right);
          const xSplit = snap((b.planner.right + padOut + brLeft - padIn) / 2);
          const xMerge = snap((brRight + padOut + b.verifier.left - padIn) / 2);

          const setH = (idx, d, ax, ay) => {
            edgeEls[idx].shaft.setAttribute("d", d);
            edgeEls[idx].head.setAttribute("d", rightHead(ax, ay));
          };

          const xPromptOut = snap(b.prompt.right + padOut);
          const xPlanIn = snap(b.planner.left - padIn);
          setH(0, `M ${xPromptOut} ${ySpine} H ${xPlanIn}`, xPlanIn, ySpine);

          const xPlanOut = snap(b.planner.right + padOut);
          ["auth", "types", "spec"].forEach((id, k) => {
            const target = b[id];
            const ty = k === 1 ? ySpine : snap(target.cy);
            const tx = snap(target.left - padIn);
            const d = Math.abs(ty - ySpine) < 1 ? `M ${xPlanOut} ${ySpine} H ${tx}` : `M ${xPlanOut} ${ySpine} H ${xSplit} V ${ty} H ${tx}`;
            setH(1 + k, d, tx, ty);
          });

          const xVerIn = snap(b.verifier.left - padIn);
          ["auth", "types", "spec"].forEach((id, k) => {
            const src = b[id];
            const sy = k === 1 ? ySpine : snap(src.cy);
            const sx = snap(src.right + padOut);
            const d = Math.abs(sy - ySpine) < 1 ? `M ${sx} ${ySpine} H ${xVerIn}` : `M ${sx} ${sy} H ${xMerge} V ${ySpine} H ${xVerIn}`;
            setH(4 + k, d, xVerIn, ySpine);
          });

          const xVerOut = snap(b.verifier.right + padOut);
          const xPrIn = snap(b.pr.left - padIn);
          setH(7, `M ${xVerOut} ${ySpine} H ${xPrIn}`, xPrIn, ySpine);
        } else {
          const xSpine = snap(b.planner.cx);
          const padOut = 8;
          const padIn = 10;
          const brTop = Math.min(b.auth.top, b.types.top, b.spec.top);
          const brBottom = Math.max(b.auth.bottom, b.types.bottom, b.spec.bottom);
          const ySplit = snap((b.planner.bottom + padOut + brTop - padIn) / 2);
          const yMerge = snap((brBottom + padOut + b.verifier.top - padIn) / 2);

          const setV = (idx, d, ax, ay) => {
            edgeEls[idx].shaft.setAttribute("d", d);
            edgeEls[idx].head.setAttribute("d", downHead(ax, ay));
          };

          const yPromptOut = snap(b.prompt.bottom + padOut);
          const yPlanIn = snap(b.planner.top - padIn);
          setV(0, `M ${xSpine} ${yPromptOut} V ${yPlanIn}`, xSpine, yPlanIn);

          const yPlanOut = snap(b.planner.bottom + padOut);
          ["auth", "types", "spec"].forEach((id, k) => {
            const target = b[id];
            const tx = k === 1 ? xSpine : snap(target.cx);
            const ty = snap(target.top - padIn);
            const d = Math.abs(tx - xSpine) < 1 ? `M ${xSpine} ${yPlanOut} V ${ty}` : `M ${xSpine} ${yPlanOut} V ${ySplit} H ${tx} V ${ty}`;
            setV(1 + k, d, tx, ty);
          });

          const yVerIn = snap(b.verifier.top - padIn);
          ["auth", "types", "spec"].forEach((id, k) => {
            const src = b[id];
            const sx = k === 1 ? xSpine : snap(src.cx);
            const sy = snap(src.bottom + padOut);
            const d = Math.abs(sx - xSpine) < 1 ? `M ${xSpine} ${sy} V ${yVerIn}` : `M ${sx} ${sy} V ${yMerge} H ${xSpine} V ${yVerIn}`;
            setV(4 + k, d, xSpine, yVerIn);
          });

          const yVerOut = snap(b.verifier.bottom + padOut);
          const yPrIn = snap(b.pr.top - padIn);
          setV(7, `M ${xSpine} ${yVerOut} V ${yPrIn}`, xSpine, yPrIn);
        }
      }

      function syncState(opts) {
        const o = opts || {};
        const cur = activeId();
        const causal = computeCausal(cur);
        const curNode = NODES.find((n) => n.id === cur) || NODES[0];

        NODES.forEach((n) => {
          const btn = btnMap.get(n.id);
          const isCur = n.id === cur;
          const isSelected = n.id === selectedId;
          const inCausal = causal.nodes.has(n.id);
          btn.classList.toggle("is-dim", !inCausal);
          btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
          btn.tabIndex = isSelected ? 0 : -1;
          if (isCur) frame.moveTo(btn, { immediate: !!o.immediate });
        });

        /* Paint dimmed edges first, active causal edges last so shared trunks stay 100% --ink */
        edgeEls.forEach((e, idx) => {
          const inCausal = causal.edges.has(idx);
          e.g.classList.toggle("is-causal", inCausal);
          e.g.classList.toggle("is-dim", !inCausal);
          if (!inCausal) svgEl.appendChild(e.g);
        });
        edgeEls.forEach((e, idx) => {
          if (causal.edges.has(idx)) svgEl.appendChild(e.g);
        });

        if (o.immediate) traceEl.textContent = curNode.trace;
        else ctx.swapText(traceEl, curNode.trace);
        if (o.announce) srEl.textContent = curNode.trace;
      }

      btns.forEach((btn) => {
        const id = btn.dataset.id;
        btn.addEventListener("pointerenter", () => {
          hoverId = id;
          syncState({ immediate: false });
        }, { signal: ctx.signal });
        btn.addEventListener("pointerleave", () => {
          if (hoverId === id) {
            hoverId = null;
            syncState({ immediate: false });
          }
        }, { signal: ctx.signal });
        btn.addEventListener("focus", () => {
          if (selectedId !== id) {
            selectedId = id;
            syncState({ immediate: false });
          }
        }, { signal: ctx.signal });
        btn.addEventListener("click", () => {
          selectedId = id;
          hoverId = null;
          syncState({ immediate: false, announce: true });
        }, { signal: ctx.signal });
      });

      gridEl.addEventListener("keydown", (e) => {
        const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
        if (!keys.includes(e.key)) return;
        e.preventDefault();
        const idx = NODES.findIndex((n) => n.id === selectedId);
        let nextIdx = idx;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") nextIdx = (idx + 1) % NODES.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") nextIdx = (idx - 1 + NODES.length) % NODES.length;
        else if (e.key === "Home") nextIdx = 0;
        else if (e.key === "End") nextIdx = NODES.length - 1;
        selectedId = NODES[nextIdx].id;
        hoverId = null;
        syncState({ immediate: false, announce: true });
        btnMap.get(selectedId).focus();
      }, { signal: ctx.signal });

      stepBtn.addEventListener("click", () => {
        const idx = NODES.findIndex((n) => n.id === selectedId);
        selectedId = NODES[(idx + 1) % NODES.length].id;
        hoverId = null;
        syncState({ immediate: false, announce: true });
      }, { signal: ctx.signal });

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

      syncState({ immediate: true });
      requestAnimationFrame(() => {
        drawEdges();
        syncState({ immediate: true });
      });
    },
  });
})();
