/* Protocol Sequence Diagram, in Plain (Subtraction): "Tool call round-trip" across four frameless actor headers with
   vertical 1px lifelines and five descending horizontal exchanges. Pointing at or selecting any step dims the other
   four exchanges and uninvolved lifelines to 0.22, frames the step row, and states its payload in the header readout. */
(function () {
  const ACTORS = ["User", "Agent", "Workspace", "GitHub"];

  const STEPS = [
    {
      num: "01",
      call: 'prompt("Fix cookie TTL")',
      ms: "12 ms",
      from: 0,
      to: 1,
      dashed: false,
      payload: '01 · POST /turn · { prompt: "Fix cookie TTL", branch: "main" } · 12 ms',
    },
    {
      num: "02",
      call: 'read("verify.ts")',
      ms: "18 ms",
      from: 1,
      to: 2,
      dashed: false,
      payload: '02 · fs.readFile("src/auth/verify.ts", lines 1..148) · 18 ms',
    },
    {
      num: "03",
      call: "148 lines",
      ms: "9 ms",
      from: 2,
      to: 1,
      dashed: true,
      payload: "03 · return 148 lines (4.6 KB · sha256:9c41…e2) · 9 ms",
    },
    {
      num: "04",
      call: "edit(+8 −3) & vitest",
      ms: "640 ms",
      from: 1,
      to: 2,
      dashed: false,
      payload: "04 · apply_patch(+8 −3) && vitest run src/auth/ (14/14 green) · 640 ms",
    },
    {
      num: "05",
      call: "push & update PR #184",
      ms: "163 ms",
      from: 1,
      to: 3,
      dashed: false,
      payload: "05 · git push origin fix/cookie-ttl && gh pr edit 184 · 163 ms",
    },
  ];

  const DEFAULT_READOUT = "5 exchanges · 842 ms round-trip · inspect any call for payload";

  PlainPlayer.registerData({
    slug: "sequence-diagram",
    chapter: "diagrams",
    span: "half",
    title: "Tool Call Round-Trip",
    css: `
.dd-sequence-diagram .seq { display: grid; gap: 16px; min-width: 0 }
.dd-sequence-diagram .seq-total { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap }
.dd-sequence-diagram .seq-readout { margin: 2px 0 0; font-family: var(--mono); font-size: 12px; line-height: 1.4; color: var(--muted);
  overflow-wrap: anywhere; transition: color var(--dur-instant) var(--ease-out) }
.dd-sequence-diagram .seq-readout.is-active { color: var(--ink) }
.dd-sequence-diagram .seq-stage { position: relative; display: grid; gap: 6px; min-width: 0 }
.dd-sequence-diagram .seq-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible }
.dd-sequence-diagram .seq-life { stroke: var(--line); stroke-width: 1px; fill: none;
  transition: opacity var(--dur-pare) var(--ease-out), stroke var(--dur-instant) var(--ease-out) }
.dd-sequence-diagram .seq-life.is-on { stroke: var(--line-strong); opacity: 1 }
.dd-sequence-diagram .seq-life.is-dim { opacity: 0.22 }
.dd-sequence-diagram .seq-arrow-g { fill: none; color: var(--ink);
  transition: opacity var(--dur-pare) var(--ease-out) }
.dd-sequence-diagram .seq-arrow-g.is-dim { opacity: 0.22 }
.dd-sequence-diagram .seq-shaft { stroke: currentColor; stroke-width: 1px }
.dd-sequence-diagram .seq-arrow-g.is-on .seq-shaft,
.dd-sequence-diagram .seq-arrow-g.is-on .seq-tip { stroke-width: 1.4px }
.dd-sequence-diagram .seq-tip { stroke: currentColor; stroke-width: 1px; fill: none }
.dd-sequence-diagram .seq-dot { fill: currentColor }
.dd-sequence-diagram .seq-actors { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 0 8px 6px }
.dd-sequence-diagram .seq-actor { font-size: 13.5px; font-weight: 500; line-height: 1.3; color: var(--ink);
  transition: opacity var(--dur-pare) var(--ease-out) }
.dd-sequence-diagram .seq-actor[data-a="0"] { text-align: left }
.dd-sequence-diagram .seq-actor[data-a="1"],
.dd-sequence-diagram .seq-actor[data-a="2"] { text-align: center }
.dd-sequence-diagram .seq-actor[data-a="3"] { text-align: right }
.dd-sequence-diagram .seq-actor.is-dim { opacity: 0.22 }
.dd-sequence-diagram .seq-rows { position: relative; z-index: 1; display: grid; gap: 2px; padding: 0 8px }
.dd-sequence-diagram .seq-row { appearance: none; border: 0; border-radius: 0; background: transparent; padding: 0; margin: 0;
  position: relative; display: block; width: 100%; height: 46px; text-align: left; cursor: pointer; color: var(--ink);
  -webkit-tap-highlight-color: transparent; transition: opacity var(--dur-pare) var(--ease-out) }
.dd-sequence-diagram .seq-row.is-dim { opacity: 0.22 }
.dd-sequence-diagram .seq-row:focus-visible { outline: 2px solid var(--focus); outline-offset: 3px }
.dd-sequence-diagram .seq-tag { position: absolute; top: 5px; left: 0; display: inline-flex; align-items: baseline; gap: 6px;
  background: var(--page); padding: 0 5px; white-space: nowrap; max-width: 100% }
.dd-sequence-diagram .seq-num { font-family: var(--mono); font-size: 11.5px; color: var(--muted); font-variant-numeric: tabular-nums }
.dd-sequence-diagram .seq-call { font-family: var(--mono); font-size: 12px; color: var(--ink); overflow: hidden; text-overflow: ellipsis }
.dd-sequence-diagram .seq-ms { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums }
@media (max-width: 400px) {
  .dd-sequence-diagram .seq-actor { font-size: 13px }
  .dd-sequence-diagram .seq-tag { gap: 4px; padding: 0 3px }
}
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="seq">
  <header class="dd-card-head">
    <div class="dd-card-title">
      <h3>Tool call round-trip</h3>
      <p class="seq-readout">${DEFAULT_READOUT}</p>
    </div>
  </header>
  <div class="seq-stage">
    <svg class="seq-svg" aria-hidden="true"></svg>
    <div class="seq-actors" aria-hidden="true">
      ${ACTORS.map((a, i) => `<span class="seq-actor" data-a="${i}">${a}</span>`).join("")}
    </div>
    <div class="seq-rows" role="listbox" aria-label="Protocol sequence exchanges">
      ${STEPS.map((s, i) => `
        <button type="button" class="seq-row" role="option" aria-selected="false" data-idx="${i}">
          <span class="seq-tag">
            <span class="seq-num">${s.num}</span>
            <span class="seq-call">${s.call}</span>
            <span class="seq-ms">${s.ms}</span>
          </span>
        </button>`).join("")}
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const stageEl = host.querySelector(".seq-stage");
      const svgEl = host.querySelector(".seq-svg");
      const actorsWrap = host.querySelector(".seq-actors");
      const actorEls = [...actorsWrap.querySelectorAll(".seq-actor")];
      const rowsWrap = host.querySelector(".seq-rows");
      const rowEls = [...rowsWrap.querySelectorAll(".seq-row")];
      const readoutEl = host.querySelector(".seq-readout");
      const srEl = host.querySelector("[aria-live]");

      const NS = "http://www.w3.org/2000/svg";
      const lifeEls = ACTORS.map(() => {
        const line = document.createElementNS(NS, "line");
        line.setAttribute("class", "seq-life");
        svgEl.appendChild(line);
        return line;
      });
      const arrowEls = STEPS.map((s) => {
        const g = document.createElementNS(NS, "g");
        g.setAttribute("class", "seq-arrow-g");
        const dot = document.createElementNS(NS, "rect");
        dot.setAttribute("class", "seq-dot");
        dot.setAttribute("width", "3");
        dot.setAttribute("height", "3");
        const shaft = document.createElementNS(NS, "line");
        shaft.setAttribute("class", "seq-shaft");
        if (s.dashed) shaft.setAttribute("stroke-dasharray", "4 3");
        const tip = document.createElementNS(NS, "path");
        tip.setAttribute("class", "seq-tip");
        g.appendChild(dot);
        g.appendChild(shaft);
        g.appendChild(tip);
        svgEl.appendChild(g);
        return { g, dot, shaft, tip };
      });

      const frame = ctx.brackets(rowsWrap, { padX: 6, padY: 1, exactPad: true });
      let pinnedIdx = -1;
      let hoverIdx = -1;

      function activeIdx() {
        return hoverIdx >= 0 ? hoverIdx : pinnedIdx;
      }

      const snap = (v) => Math.round(v) + 0.5;

      function offsetInStage(el) {
        let x = 0;
        let y = 0;
        let n = el;
        while (n && n !== stageEl) {
          x += n.offsetLeft;
          y += n.offsetTop;
          n = n.offsetParent;
        }
        return { left: x, top: y, width: el.offsetWidth, height: el.offsetHeight };
      }

      function drawGeometry() {
        const w = stageEl.offsetWidth;
        const h = stageEl.offsetHeight;
        if (!w || !h) return;
        svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);

        const xs = actorEls.map((el, i) => {
          const b = offsetInStage(el);
          if (i === 0) return snap(b.left + Math.min(16, b.width * 0.35));
          if (i === 3) return snap(b.left + b.width - Math.min(20, b.width * 0.35));
          return snap(b.left + b.width / 2);
        });

        const actorsBox = offsetInStage(actorsWrap);
        const yTop = Math.round(actorsBox.top + actorsBox.height - 2);
        const yBot = h - 4;
        xs.forEach((x, i) => {
          lifeEls[i].setAttribute("x1", String(x));
          lifeEls[i].setAttribute("x2", String(x));
          lifeEls[i].setAttribute("y1", String(yTop));
          lifeEls[i].setAttribute("y2", String(yBot));
        });

        const rowsBox = offsetInStage(rowsWrap);
        STEPS.forEach((s, i) => {
          const rowEl = rowEls[i];
          const tagEl = rowEl.querySelector(".seq-tag");
          const rb = offsetInStage(rowEl);
          const xFrom = xs[s.from];
          const xTo = xs[s.to];
          const yArrow = snap(rb.top + 33);

          /* Position label cleanly above shaft, clamped inside row width so 320px never overflows */
          const minX = Math.min(xFrom, xTo);
          const desiredLeft = minX - rb.left + 3;
          const maxLeft = Math.max(0, rb.width - tagEl.offsetWidth);
          tagEl.style.left = `${Math.max(0, Math.min(desiredLeft, maxLeft)).toFixed(0)}px`;

          const ae = arrowEls[i];
          ae.dot.setAttribute("x", (xFrom - 1.5).toFixed(1));
          ae.dot.setAttribute("y", (yArrow - 1.5).toFixed(1));
          ae.shaft.setAttribute("x1", String(xFrom));
          ae.shaft.setAttribute("y1", String(yArrow));
          ae.shaft.setAttribute("x2", String(xTo));
          ae.shaft.setAttribute("y2", String(yArrow));

          const dir = xTo > xFrom ? 1 : -1;
          const ax = xTo;
          const bx = xTo - dir * 4.5;
          ae.tip.setAttribute(
            "d",
            `M ${bx.toFixed(1)} ${(yArrow - 4.5).toFixed(1)} L ${ax.toFixed(1)} ${yArrow.toFixed(1)} L ${bx.toFixed(1)} ${(yArrow + 4.5).toFixed(1)}`
          );
          void rowsBox;
        });
      }

      function syncState(opts) {
        const o = opts || {};
        const cur = activeIdx();
        const hasActive = cur >= 0;
        const step = hasActive ? STEPS[cur] : null;

        actorEls.forEach((el, aIdx) => {
          const involved = !hasActive || step.from === aIdx || step.to === aIdx;
          el.classList.toggle("is-dim", !involved);
          lifeEls[aIdx].classList.toggle("is-dim", !involved);
          lifeEls[aIdx].classList.toggle("is-on", hasActive && involved);
        });

        rowEls.forEach((row, i) => {
          const on = i === cur;
          const dim = hasActive && !on;
          row.classList.toggle("is-dim", dim);
          row.setAttribute("aria-selected", i === pinnedIdx ? "true" : "false");
          row.tabIndex = (pinnedIdx >= 0 ? i === pinnedIdx : i === 0) ? 0 : -1;
          arrowEls[i].g.classList.toggle("is-dim", dim);
          arrowEls[i].g.classList.toggle("is-on", on);
        });

        if (hasActive) {
          frame.moveTo(rowEls[cur], { immediate: !!o.immediate });
        } else {
          frame.pare();
        }

        const nextText = hasActive ? step.payload : DEFAULT_READOUT;
        readoutEl.classList.toggle("is-active", hasActive);
        if (o.immediate) readoutEl.textContent = nextText;
        else ctx.swapText(readoutEl, nextText);
        if (o.announce && hasActive) srEl.textContent = step.payload;
      }

      rowEls.forEach((row, i) => {
        row.addEventListener("pointerenter", () => {
          hoverIdx = i;
          syncState({ immediate: false });
        }, { signal: ctx.signal });
        row.addEventListener("pointerleave", () => {
          if (hoverIdx === i) {
            hoverIdx = -1;
            syncState({ immediate: false });
          }
        }, { signal: ctx.signal });
        row.addEventListener("focus", () => {
          hoverIdx = i;
          syncState({ immediate: false });
        }, { signal: ctx.signal });
        row.addEventListener("blur", () => {
          if (hoverIdx === i) {
            hoverIdx = -1;
            syncState({ immediate: false });
          }
        }, { signal: ctx.signal });
        row.addEventListener("click", () => {
          pinnedIdx = pinnedIdx === i ? -1 : i;
          hoverIdx = -1;
          syncState({ immediate: false, announce: pinnedIdx >= 0 });
        }, { signal: ctx.signal });
      });

      rowsWrap.addEventListener("keydown", (e) => {
        const keys = ["ArrowDown", "ArrowUp", "Home", "End", "Escape"];
        if (!keys.includes(e.key)) return;
        e.preventDefault();
        if (e.key === "Escape") {
          pinnedIdx = -1;
          hoverIdx = -1;
          syncState({ immediate: false });
          return;
        }
        const cur = activeIdx() >= 0 ? activeIdx() : 0;
        let next = cur;
        if (e.key === "ArrowDown") next = (cur + 1) % STEPS.length;
        else if (e.key === "ArrowUp") next = (cur - 1 + STEPS.length) % STEPS.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = STEPS.length - 1;
        pinnedIdx = next;
        hoverIdx = next;
        syncState({ immediate: false, announce: true });
        rowEls[next].focus();
      }, { signal: ctx.signal });

      const relayout = () => {
        drawGeometry();
        frame.refresh();
      };

      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(relayout);
        ro.observe(stageEl);
        ctx.signal.addEventListener("abort", () => ro.disconnect(), { once: true });
      }
      window.addEventListener("plainfacechange", () => requestAnimationFrame(relayout), { signal: ctx.signal });

      syncState({ immediate: true });
      requestAnimationFrame(relayout);
    },
  });
})();
