/* Magnetic Button, in Rack: the gravity becomes a design tool's snapping. On a canvas with a Header (purple) and a
   Sidebar (green), the Card frame (pink) follows the hand 1:1. Within reach of another frame's edge or centre it is
   caught and a guide cuts in along the line it met; otherwise, with Snap lit, it lands on the grid. It stays where it
   is let go: no spring, no inertia. X and Y are value boxes. Arrows nudge a pixel, Shift a grid step; double-click
   puts it back. Each frame keeps its colour on the canvas and in the layer list. */
FlatPlayer.register({
  slug: "magnetic-button",
  title: "Magnetic Button",
  tagline: "A frame with a little gravity: edges and the grid catch it.",
  css: `
.fs-magnetic-button .mg { width: min(100%, 680px); display: grid; grid-template-columns: 1fr 150px; gap: 3px; font-size: 12px }
.fs-magnetic-button .mg-dev { background: var(--panel); border-radius: var(--r-panel); overflow: hidden; min-width: 0 }
.fs-magnetic-button .mg-strip { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 10px; background: var(--panel-2); white-space: nowrap }
.fs-magnetic-button .mg-strip > b { font-weight: 600; margin-right: auto }
.fs-magnetic-button .mg-key, .fs-magnetic-button .mg-box { height: 22px; padding: 0 8px; border: 0; border-radius: var(--r-control); box-shadow: var(--edge);
  background: var(--block); color: var(--ink); font: 600 11px/22px var(--font); cursor: pointer; white-space: nowrap; transition: background-color var(--cut-in) var(--ease-out) }
.fs-magnetic-button .mg-box { background: var(--cut); font: 600 11px/22px var(--mono); min-width: 48px; text-align: left }
.fs-magnetic-button .mg-key:hover { background: var(--block-hover) }
.fs-magnetic-button .mg-key:active, .fs-magnetic-button .mg-box:active { box-shadow: var(--edge-press); transform: scale(0.98); transition: none }
.fs-magnetic-button .mg-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
.fs-magnetic-button .mg-lbl { color: var(--muted); font-size: 11px }
.fs-magnetic-button .mg-wrap { padding: 8px }
.fs-magnetic-button .mg-canvas { position: relative; aspect-ratio: 2 / 1; background: var(--slot); border-radius: var(--r-control); box-shadow: var(--edge); overflow: hidden; touch-action: none }
.fs-magnetic-button .mg-canvas > svg { position: absolute; inset: 0; width: 100%; height: 100% }
.fs-magnetic-button .mg-f { position: absolute; border-radius: var(--r-control); font: 600 10px/1 var(--font); padding: 4px 5px; overflow: hidden; white-space: nowrap }
.fs-magnetic-button .mg-f[data-tone="purple"] { background: var(--clip-purple-tint); box-shadow: inset 0 0 0 1px var(--clip-purple); color: var(--clip-purple-text) }
.fs-magnetic-button .mg-f[data-tone="green"] { background: var(--clip-green-tint); box-shadow: inset 0 0 0 1px var(--clip-green); color: var(--clip-green-text) }
.fs-magnetic-button .mg-f[data-tone="pink"] { background: var(--clip-pink-tint); box-shadow: inset 0 0 0 1px var(--clip-pink); color: var(--clip-pink-text); cursor: grab }
.fs-magnetic-button .mg-f.is-held { cursor: grabbing; box-shadow: inset 0 0 0 2px var(--clip-pink) }
.fs-magnetic-button .mg-guide { position: absolute; background: var(--ink); pointer-events: none; animation: fs-mg-in var(--cut-in) var(--ease-out) both }
.fs-magnetic-button .mg-guide.is-x { top: 0; bottom: 0; width: 1px }
.fs-magnetic-button .mg-guide.is-y { left: 0; right: 0; height: 1px }
@keyframes fs-mg-in { from { opacity: 0 } }
.fs-magnetic-button .mg-side { display: grid; align-content: start }
.fs-magnetic-button .mg-props { display: grid; grid-template-columns: auto 1fr; gap: 4px 6px; align-items: center; padding: 8px }
.fs-magnetic-button .mg-props b { height: 22px; padding: 0 6px; background: var(--cut); box-shadow: var(--edge); border-radius: var(--r-control); font: 600 11px/22px var(--mono) }
.fs-magnetic-button .mg-layers { list-style: none; margin: 0; padding: 0 8px 8px; display: grid; gap: 2px }
.fs-magnetic-button .mg-layers li { display: flex; align-items: center; gap: 6px; height: 22px; padding: 0 6px; border-radius: var(--r-control); background: var(--panel-2); font-size: 11px;
  box-shadow: inset 3px 0 0 var(--tone) }
.fs-magnetic-button .mg-layers li.is-sel { background: var(--cut); box-shadow: inset 3px 0 0 var(--tone), var(--edge) }
.fs-magnetic-button .mg-say { padding: 0 8px 8px; color: var(--muted); font-size: 11px; margin: 0 }
.fs-magnetic-button .mg-say b { color: var(--ink); font-weight: 600 }
.fs-magnetic-button.is-tile .mg { grid-template-columns: 1fr }
.fs-magnetic-button.is-tile .mg-side { display: none }
@container (max-width: 460px) {
  .fs-magnetic-button:not(.is-tile) .mg { grid-template-columns: 1fr }
  .fs-magnetic-button .mg-layers { display: none }
  .fs-magnetic-button .mg-props { grid-template-columns: auto 1fr auto 1fr }
}
`,
  mount(host, ctx) {
    const W = 480, H = 240, REACH = 6; // design px; inside REACH an edge or centre catches the card
    const GRIDS = [4, 8, 16];
    const STATIC = [
      { name: "Header", tone: "purple", x: 24, y: 16, w: 432, h: 32 },
      { name: "Sidebar", tone: "green", x: 24, y: 64, w: 112, h: 160 },
    ];
    const HOME = { x: 216, y: 88 }, CW = 160, CH = 96;
    host.innerHTML = `<div class="mg">
      <div class="mg-dev">
        <div class="mg-strip"><b>Canvas</b><span class="mg-lbl">Grid</span><button type="button" class="mg-box" aria-label="Grid size">8 px</button>
          <button type="button" class="mg-key" aria-pressed="true">Snap</button></div>
        <div class="mg-wrap"><div class="mg-canvas">
          <svg aria-hidden="true" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="mg-grid"></svg>
          ${STATIC.map((f) => `<div class="mg-f" data-tone="${f.tone}" aria-hidden="true" style="left:${(f.x / W) * 100}%;top:${(f.y / H) * 100}%;width:${(f.w / W) * 100}%;height:${(f.h / H) * 100}%">${f.name}</div>`).join("")}
          <div class="mg-guides" aria-hidden="true"></div>
          <div class="mg-f mg-card" data-tone="pink" tabindex="0" role="button" aria-roledescription="movable frame" aria-label="Card frame. Arrows move it.">Card</div>
        </div></div>
      </div>
      <div class="mg-dev mg-side">
        <div class="mg-strip"><b>Inspector</b></div>
        <div class="mg-props"><span class="mg-lbl">X</span><b class="mg-x"></b><span class="mg-lbl">Y</span><b class="mg-y"></b><span class="mg-lbl">W</span><b>${CW}</b><span class="mg-lbl">H</span><b>${CH}</b></div>
        <ul class="mg-layers" aria-hidden="true"><li class="is-sel" style="--tone:var(--clip-pink)">Card</li>${STATIC.map((f) => `<li style="--tone:var(--clip-${f.tone})">${f.name}</li>`).join("")}</ul>
        <p class="mg-say" aria-hidden="true"></p>
      </div>
      <p class="sr-only" aria-live="polite"></p>
    </div>`;
    const canvas = host.querySelector(".mg-canvas"), card = host.querySelector(".mg-card"), guides = host.querySelector(".mg-guides"), gridSvg = host.querySelector(".mg-grid");
    const snapKey = host.querySelector(".mg-key"), gridBox = host.querySelector(".mg-box"), xEl = host.querySelector(".mg-x"), yEl = host.querySelector(".mg-y");
    const sayEl = host.querySelector(".mg-say"), live = host.querySelector("[aria-live]");
    const opt = { signal: ctx.signal };

    let snap = true, gi = 1, x = HOME.x, y = HOME.y, caught = "";
    const unit = () => canvas.clientWidth / W;
    function drawGrid() {
      const g = GRIDS[gi] * 2; // one line every two grid steps, so the canvas stays quiet
      let d = "";
      for (let i = g; i < W; i += g) d += `M${i} 0V${H}`;
      for (let i = g; i < H; i += g) d += `M0 ${i}H${W}`;
      gridSvg.innerHTML = `<path d="${d}" stroke="var(--line-strong)" stroke-width="1" vector-effect="non-scaling-stroke" opacity="0.35" fill="none"/>`;
      gridBox.textContent = GRIDS[gi] + " px";
    }
    function paint(lines) {
      card.style.left = (x / W) * 100 + "%"; card.style.top = (y / H) * 100 + "%";
      card.style.width = (CW / W) * 100 + "%"; card.style.height = (CH / H) * 100 + "%";
      xEl.textContent = Math.round(x); yEl.textContent = Math.round(y);
      const key = (lines || []).map((l) => l.join(":")).join("|");
      if (key !== guides.dataset.key) {
        guides.dataset.key = key;
        guides.innerHTML = (lines || []).map(([axis, v]) => axis === "x" ? `<i class="mg-guide is-x" style="left:${(v / W) * 100}%"></i>` : `<i class="mg-guide is-y" style="top:${(v / H) * 100}%"></i>`).join("");
      }
    }
    /* One axis at a time: the card's three lines (start, centre, end) against every other frame's three and the
       canvas's; the nearest within reach wins. Otherwise the grid, if Snap is lit. */
    function snapAxis(raw, size, axis) {
      const targets = [0, axis === "x" ? W / 2 : H / 2, axis === "x" ? W : H];
      for (const f of STATIC) { const a = axis === "x" ? f.x : f.y, s = axis === "x" ? f.w : f.h; targets.push(a, a + s / 2, a + s); }
      let best = null;
      for (const off of [0, size / 2, size]) for (const t of targets) {
        const d = Math.abs(raw + off - t);
        if (d <= REACH && (!best || d < best.d)) best = { d, v: t - off, line: t };
      }
      if (best) return best;
      return { v: snap ? Math.round(raw / GRIDS[gi]) * GRIDS[gi] : Math.round(raw), line: null };
    }
    function place(rx, ry) {
      rx = Math.max(0, Math.min(W - CW, rx)); ry = Math.max(0, Math.min(H - CH, ry));
      const sx = snapAxis(rx, CW, "x"), sy = snapAxis(ry, CH, "y");
      x = sx.v; y = sy.v;
      const lines = [];
      if (sx.line !== null) lines.push(["x", sx.line]);
      if (sy.line !== null) lines.push(["y", sy.line]);
      caught = lines.length ? "Aligned" : snap ? "On the grid" : "Placed";
      paint(lines);
    }
    function settle(word) {
      paint(guides.dataset.key ? guides.dataset.key.split("|").map((s) => { const [a, v] = s.split(":"); return [a, +v]; }) : []);
      sayEl.innerHTML = `<b>${word}</b> at ${Math.round(x)}, ${Math.round(y)}`;
      live.textContent = `Card ${word.toLowerCase()} at ${Math.round(x)}, ${Math.round(y)}`;
    }

    /* The hand: 1:1, and the card stays where it is let go. */
    let drag = null, ghost = !ctx.reduced();
    card.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      ghost = false;
      drag = { id: e.pointerId, px: e.clientX, py: e.clientY, x, y };
      card.setPointerCapture(e.pointerId); card.classList.add("is-held"); e.preventDefault(); card.focus({ preventScroll: true });
    }, opt);
    card.addEventListener("pointermove", (e) => { if (drag && e.pointerId === drag.id) place(drag.x + (e.clientX - drag.px) / unit(), drag.y + (e.clientY - drag.py) / unit()); }, opt);
    const up = (e) => { if (!drag || e.pointerId !== drag.id) return; drag = null; card.classList.remove("is-held"); settle(caught); };
    card.addEventListener("pointerup", up, opt); card.addEventListener("pointercancel", up, opt);
    card.addEventListener("dblclick", () => { x = HOME.x; y = HOME.y; paint([]); settle("Back"); }, opt);
    card.addEventListener("keydown", (e) => {
      const d = e.shiftKey ? GRIDS[gi] : 1;
      const m = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
      if (!m) return;
      e.preventDefault();
      x = Math.max(0, Math.min(W - CW, x + m[0])); y = Math.max(0, Math.min(H - CH, y + m[1]));
      paint([]); settle("Moved");
    }, opt);
    snapKey.addEventListener("click", () => { snap = !snap; snapKey.setAttribute("aria-pressed", String(snap)); live.textContent = snap ? "Snap on" : "Snap off"; }, opt);
    gridBox.addEventListener("click", () => { gi = (gi + 1) % GRIDS.length; drawGrid(); live.textContent = "Grid " + GRIDS[gi] + " pixels"; }, opt);

    drawGrid(); paint([]); sayEl.textContent = "Drag the card";

    /* The self-run: an unseen hand drags the card around the canvas; edges catch it as it passes, so it moves in cuts
       where it aligns. It lets go every few seconds, and the card stays put while it rests. */
    if (ghost) {
      let t = 0, pause = 0, last = 0;
      ctx.loop((dt) => {
        if (!ghost) return false;
        if (pause > 0) { pause -= dt; return; }
        t += dt;
        place(HOME.x + 130 * Math.sin(t * 0.6), HOME.y + 60 * Math.sin(t * 1.1 + 0.4));
        if (t - last > 3.2) { last = t; pause = 0.9; settle(caught); }
      });
    }
    ctx.onHand(() => { ghost = false; });
  },
});
