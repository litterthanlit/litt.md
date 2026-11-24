/* Segmented Control, Rack 2.0: a breakpoint picker. One strip holds the name and the control, four square boxes
   joined edge to edge with the chosen width as the lit key (yellow, on the frame; nothing travels). The rest is one
   surface: the page's frame at that width, its layers rearranged, the cards cutting in a column at a time on the
   tick. Three layers, each one colour: Header purple, Card pink, Button cyan. */
FlatPlayer.register({
  slug: "segmented-control",
  title: "Segmented Control",
  tagline: "A breakpoint picker: one lit box, the frame changes under it.",
  css: `
.fs-segmented-control .bp { width: min(100%, 640px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px }
.fs-segmented-control .bp-strip { display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 6px 12px; background: var(--panel-2); flex-wrap: wrap }
.fs-segmented-control .bp-strip > b { font-weight: 600; margin-right: auto; white-space: nowrap }
.fs-segmented-control .bp-seg { display: flex; border-radius: var(--r-control); box-shadow: var(--edge) }
.fs-segmented-control .bp-opt { height: 24px; padding: 0 9px; border: 0; background: var(--block); color: var(--ink); font: 600 11px/1 var(--mono); cursor: pointer;
  white-space: nowrap; transition: background-color var(--cut-in) var(--ease-out) }
.fs-segmented-control .bp-opt + .bp-opt { box-shadow: -1px 0 0 0 var(--line-strong) }
.fs-segmented-control .bp-opt:first-child { border-radius: var(--r-control) 0 0 var(--r-control) }
.fs-segmented-control .bp-opt:last-child { border-radius: 0 var(--r-control) var(--r-control) 0 }
.fs-segmented-control .bp-opt:hover { background: var(--block-hover) }
.fs-segmented-control .bp-opt:active { transition: none; background: var(--block-hover) }
.fs-segmented-control .bp-opt[aria-checked="true"] { background: var(--accent); color: var(--accent-fg) }
.fs-segmented-control .bp-opt:focus-visible { outline-offset: -2px; position: relative; z-index: 1 }
.fs-segmented-control .bp-wrap { padding: 14px }
.fs-segmented-control .bp-surface { position: relative; height: 230px; padding: 26px 14px 14px; background: var(--cut); border-radius: var(--r-control); box-shadow: var(--edge);
  display: grid; justify-items: center; overflow: hidden }
.fs-segmented-control .bp-grid { position: absolute; inset: 0; width: 100%; height: 100% }
.fs-segmented-control .bp-size { position: absolute; left: 14px; top: 8px; font: 600 11px/1 var(--mono); color: var(--muted) }
.fs-segmented-control .bp-frame { position: relative; height: 100%; max-width: 100%; background: var(--panel); border-radius: var(--r-control); box-shadow: var(--edge);
  padding: 10px; display: grid; grid-template-rows: 26px 1fr; gap: 8px; overflow: hidden }
.fs-segmented-control .bp-layer { border-radius: var(--r-control); padding: 5px 6px; font: 600 10px/1 var(--font); white-space: nowrap; overflow: hidden;
  animation: fs-bp-in var(--cut-in) var(--ease-out) both }
.fs-segmented-control .bp-head { background: var(--clip-purple-tint); box-shadow: inset 0 0 0 1px var(--clip-purple); color: var(--clip-purple-text) }
.fs-segmented-control .bp-cards { display: grid; gap: 8px; align-content: start; min-height: 0 }
.fs-segmented-control .bp-card { height: 64px; background: var(--clip-pink-tint); box-shadow: inset 0 0 0 1px var(--clip-pink); color: var(--clip-pink-text);
  display: flex; flex-direction: column; justify-content: space-between }
.fs-segmented-control .bp-btn { align-self: flex-start; max-width: 100%; padding: 3px 5px; border-radius: var(--r-control); background: var(--clip-cyan-tint);
  box-shadow: inset 0 0 0 1px var(--clip-cyan); color: var(--clip-cyan-text); font: 600 9px/1 var(--font) }
@keyframes fs-bp-in { from { opacity: 0 } }
.fs-segmented-control.is-tile .bp-wrap { padding: 10px }
.fs-segmented-control.is-tile .bp-surface { height: 150px; padding: 22px 10px 10px }
.fs-segmented-control.is-tile .bp-card { height: 44px }
.fs-segmented-control.is-tile .bp-btn { font-size: 0; padding: 0; width: 60%; height: 8px }
@container (max-width: 380px) { .fs-segmented-control .bp-strip > b { display: none } .fs-segmented-control .bp-strip { justify-content: center } }
`,
  mount(host, ctx) {
    const BPS = [
      { v: "phone", label: "Phone", w: 390, h: 844, cols: 1, frameW: 0.3 },
      { v: "tablet", label: "Tablet", w: 768, h: 1024, cols: 2, frameW: 0.56 },
      { v: "desktop", label: "Desktop", w: 1280, h: 800, cols: 3, frameW: 0.84 },
      { v: "wide", label: "Wide", w: 1440, h: 900, cols: 4, frameW: 1 },
    ];
    host.innerHTML = `<div class="bp">
      <div class="bp-strip"><b>Pricing page</b>
        <div class="bp-seg" role="radiogroup" aria-label="Breakpoint">${BPS.map((b) => `<button type="button" class="bp-opt" role="radio" data-v="${b.v}" aria-label="${b.label}, ${b.w} pixels">${b.w}</button>`).join("")}</div></div>
      <div class="bp-wrap"><div class="bp-surface" aria-hidden="true">
        <svg class="bp-grid" preserveAspectRatio="none"></svg>
        <span class="bp-size"></span>
        <div class="bp-frame"><div class="bp-layer bp-head">Header</div><div class="bp-cards"></div></div>
      </div></div>
      <p class="sr-only" aria-live="polite"></p>
    </div>`;
    const group = host.querySelector(".bp-seg"), opts = [...host.querySelectorAll(".bp-opt")], frame = host.querySelector(".bp-frame");
    const cards = host.querySelector(".bp-cards"), size = host.querySelector(".bp-size"), head = host.querySelector(".bp-head");
    const surface = host.querySelector(".bp-surface"), grid = host.querySelector(".bp-grid"), live = host.querySelector("[aria-live]");
    const opt = { signal: ctx.signal };

    /* A quiet 16px grid on the surface, drawn as lines (redrawn when the surface resizes). */
    const drawGrid = () => {
      const w = surface.clientWidth, h = surface.clientHeight; let d = "";
      for (let x = 16; x < w; x += 16) d += `M${x} 0V${h}`;
      for (let y = 16; y < h; y += 16) d += `M0 ${y}H${w}`;
      grid.setAttribute("viewBox", `0 0 ${w} ${h}`);
      grid.innerHTML = `<path d="${d}" stroke="var(--line)" stroke-width="1" fill="none" opacity="0.45"/>`;
    };
    const ro = new ResizeObserver(drawGrid); ro.observe(surface);

    let value = null;
    function select(v, focus, quiet) {
      const bp = BPS.find((b) => b.v === v);
      value = v;
      opts.forEach((o) => { const on = o.dataset.v === v; o.setAttribute("aria-checked", String(on)); o.tabIndex = on ? 0 : -1; });
      if (focus) opts.find((o) => o.dataset.v === v).focus();
      size.textContent = `${bp.label}, ${bp.w} × ${bp.h}`;
      frame.style.width = bp.frameW * 100 + "%";
      /* The cards come in a column at a time, a tick (60ms) apart, like a set launching. */
      cards.style.gridTemplateColumns = `repeat(${bp.cols}, minmax(0, 1fr))`;
      cards.innerHTML = Array.from({ length: bp.cols * 2 }, (_, i) =>
        `<div class="bp-layer bp-card" style="animation-delay:calc(${i % bp.cols} * var(--beat))">Card<span class="bp-btn">Button</span></div>`).join("");
      head.style.animation = "none"; void head.offsetWidth; head.style.animation = "";
      if (!quiet) live.textContent = `${bp.label}, ${bp.w} by ${bp.h}, ${bp.cols} ${bp.cols === 1 ? "column" : "columns"}`;
    }
    opts.forEach((o) => o.addEventListener("click", () => select(o.dataset.v), opt));
    group.addEventListener("keydown", (e) => {
      const i = BPS.findIndex((b) => b.v === value), n = BPS.length;
      let next;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = n - 1;
      else return;
      e.preventDefault(); select(BPS[next].v, true);
    }, opt);
    select("desktop", false, true);

    /* The self-run: someone checks each width in turn, a beat apart, until a hand arrives. */
    let ghost = !ctx.reduced();
    const order = ["phone", "tablet", "wide", "desktop"];
    let k = 0;
    if (ghost) ctx.every(1800, () => { if (ghost) select(order[k++ % order.length], false, true); });
    ctx.onHand(() => { ghost = false; });
    return { destroy() { ro.disconnect(); } };
  },
});
