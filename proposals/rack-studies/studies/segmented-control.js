/* Segmented Control, in Rack: a design tool's breakpoint picker. Four square boxes joined edge to edge, the chosen
   width the lit key (yellow, on the frame; no indicator travels). Under it the frame itself: its layers rearranged
   for that width, the cards cutting in a column at a time on the tick, and the props that changed as value boxes,
   the changed ones marked. Each layer keeps its colour everywhere it shows: Header purple, Card pink, Button cyan. */
FlatPlayer.register({
  slug: "segmented-control",
  title: "Segmented Control",
  tagline: "A breakpoint picker: one lit box, and what changes under it.",
  css: `
.fs-segmented-control .bp { width: min(100%, 640px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px }
.fs-segmented-control .bp-strip { display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 10px; background: var(--panel-2); white-space: nowrap }
.fs-segmented-control .bp-strip b { font-weight: 600 }
.fs-segmented-control .bp-strip span { color: var(--muted); overflow: hidden; text-overflow: ellipsis; min-width: 0 }
.fs-segmented-control .bp-size { margin-left: auto; font: 600 12px/1 var(--mono); color: var(--ink) }
.fs-segmented-control .bp-body { padding: 10px; display: grid; gap: 10px }
.fs-segmented-control .bp-label { color: var(--muted); font-size: 11px; margin-bottom: 4px; display: block }
.fs-segmented-control .bp-seg { display: flex; border-radius: var(--r-control); box-shadow: var(--edge); width: max-content; max-width: 100% }
.fs-segmented-control .bp-opt { height: 26px; padding: 0 10px; border: 0; background: var(--block); color: var(--ink); font: 500 11px/1 var(--font); cursor: pointer;
  white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; transition: background-color var(--cut-in) var(--ease-out) }
.fs-segmented-control .bp-opt i { font: 600 11px/1 var(--mono); font-style: normal; color: var(--muted) }
.fs-segmented-control .bp-opt + .bp-opt { box-shadow: -1px 0 0 0 var(--line-strong) }
.fs-segmented-control .bp-opt:first-child { border-radius: var(--r-control) 0 0 var(--r-control) }
.fs-segmented-control .bp-opt:last-child { border-radius: 0 var(--r-control) var(--r-control) 0 }
.fs-segmented-control .bp-opt:hover { background: var(--block-hover) }
.fs-segmented-control .bp-opt:active { transition: none; background: var(--block-hover) }
.fs-segmented-control .bp-opt[aria-checked="true"] { background: var(--accent); color: var(--accent-fg) }
.fs-segmented-control .bp-opt[aria-checked="true"] i { color: var(--accent-fg) }
.fs-segmented-control .bp-opt:focus-visible { outline-offset: -2px; position: relative; z-index: 1 }
.fs-segmented-control .bp-main { display: grid; grid-template-columns: 1fr 150px; gap: 8px; align-items: start }
.fs-segmented-control .bp-canvas { height: 150px; background: var(--slot); border-radius: var(--r-control); box-shadow: var(--edge); display: grid; place-items: center; padding: 8px; overflow: hidden }
.fs-segmented-control .bp-frame { height: 100%; background: var(--cut); border-radius: var(--r-control); box-shadow: var(--edge); padding: 6px; display: grid;
  grid-template-rows: 14px 1fr; gap: 5px; overflow: hidden; max-width: 100% }
.fs-segmented-control .bp-layer { border-radius: var(--r-control); animation: fs-bp-in var(--cut-in) var(--ease-out) both }
.fs-segmented-control .bp-head { background: var(--clip-purple-tint); box-shadow: inset 0 0 0 1px var(--clip-purple); display: flex; align-items: center; padding: 0 4px;
  font: 600 8px/1 var(--font); color: var(--clip-purple-text) }
.fs-segmented-control .bp-cards { display: grid; gap: 5px; align-content: start; min-height: 0 }
.fs-segmented-control .bp-card { height: 44px; background: var(--clip-pink-tint); box-shadow: inset 0 0 0 1px var(--clip-pink); padding: 4px; display: flex; flex-direction: column;
  justify-content: space-between; font: 600 8px/1 var(--font); color: var(--clip-pink-text) }
.fs-segmented-control .bp-btn { align-self: flex-start; width: 60%; height: 9px; border-radius: var(--r-control); background: var(--clip-cyan-tint); box-shadow: inset 0 0 0 1px var(--clip-cyan) }
@keyframes fs-bp-in { from { opacity: 0 } }
.fs-segmented-control .bp-props { display: grid; gap: 4px }
.fs-segmented-control .bp-prop { display: grid; grid-template-columns: 1fr 64px; align-items: center; gap: 6px; color: var(--muted); font-size: 11px }
.fs-segmented-control .bp-prop b { height: 22px; padding: 0 6px; background: var(--cut); box-shadow: var(--edge); border-radius: var(--r-control); font: 600 11px/22px var(--mono);
  color: var(--ink); white-space: nowrap }
.fs-segmented-control .bp-prop.is-changed span { color: var(--ink) }
.fs-segmented-control .bp-prop.is-changed b { box-shadow: var(--edge-press), inset 3px 0 0 var(--ink) ; padding-left: 8px }
.fs-segmented-control .bp-note { font-size: 11px; color: var(--muted); margin: 2px 0 0 }
.fs-segmented-control.is-tile .bp-main { grid-template-columns: 1fr 108px }
.fs-segmented-control.is-tile .bp-canvas { height: 108px }
.fs-segmented-control.is-tile .bp-prop { grid-template-columns: 1fr 52px }
.fs-segmented-control.is-tile .bp-prop:nth-child(n+4), .fs-segmented-control.is-tile .bp-note, .fs-segmented-control.is-tile .bp-opt span { display: none }
@container (max-width: 400px) {
  .fs-segmented-control:not(.is-tile) .bp-main { grid-template-columns: 1fr }
  .fs-segmented-control:not(.is-tile) .bp-props { grid-template-columns: 1fr 1fr; column-gap: 10px }
  .fs-segmented-control .bp-opt span { display: none }
}
`,
  mount(host, ctx) {
    const BPS = [
      { v: "phone", label: "Phone", w: 390, h: 844, cols: 1, gutter: 12, margin: 16, type: 15, frameW: 0.32 },
      { v: "tablet", label: "Tablet", w: 768, h: 1024, cols: 2, gutter: 16, margin: 24, type: 15, frameW: 0.6 },
      { v: "desktop", label: "Desktop", w: 1280, h: 800, cols: 3, gutter: 24, margin: 40, type: 16, frameW: 0.86 },
      { v: "wide", label: "Wide", w: 1440, h: 900, cols: 4, gutter: 24, margin: 64, type: 16, frameW: 1 },
    ];
    const PROPS = [["Columns", (b) => String(b.cols)], ["Gutter", (b) => b.gutter + " px"], ["Margin", (b) => b.margin + " px"], ["Body type", (b) => b.type + " px"]];
    const uid = "bp" + Math.random().toString(36).slice(2, 7);
    host.innerHTML = `<div class="bp">
      <div class="bp-strip"><b>Frame</b><span>Pricing page</span><span class="bp-size"></span></div>
      <div class="bp-body">
        <div><span class="bp-label" id="${uid}">Breakpoint</span>
          <div class="bp-seg" role="radiogroup" aria-labelledby="${uid}">${BPS.map((b) => `<button type="button" class="bp-opt" role="radio" data-v="${b.v}" aria-label="${b.label}, ${b.w} pixels"><span>${b.label}</span><i>${b.w}</i></button>`).join("")}</div></div>
        <div class="bp-main">
          <div class="bp-canvas" aria-hidden="true"><div class="bp-frame"><div class="bp-layer bp-head">Header</div><div class="bp-cards"></div></div></div>
          <div class="bp-props">${PROPS.map(([n]) => `<div class="bp-prop"><span>${n}</span><b></b></div>`).join("")}<p class="bp-note"></p></div>
        </div>
      </div>
      <p class="sr-only" aria-live="polite"></p>
    </div>`;
    const group = host.querySelector(".bp-seg"), opts = [...host.querySelectorAll(".bp-opt")], frame = host.querySelector(".bp-frame");
    const cards = host.querySelector(".bp-cards"), props = [...host.querySelectorAll(".bp-prop")], note = host.querySelector(".bp-note");
    const size = host.querySelector(".bp-size"), live = host.querySelector("[aria-live]"), head = host.querySelector(".bp-head");
    const opt = { signal: ctx.signal };

    let value = null;
    function select(v, focus, quiet) {
      const prev = BPS.find((b) => b.v === value), bp = BPS.find((b) => b.v === v);
      value = v;
      opts.forEach((o) => { const on = o.dataset.v === v; o.setAttribute("aria-checked", String(on)); o.tabIndex = on ? 0 : -1; });
      if (focus) opts.find((o) => o.dataset.v === v).focus();
      size.textContent = `${bp.w} × ${bp.h}`;
      frame.style.width = bp.frameW * 100 + "%";
      /* The frame's cards come in a column at a time, a tick (60ms) apart, like a set launching. */
      cards.style.gridTemplateColumns = `repeat(${bp.cols}, 1fr)`;
      const n = bp.cols * 2;
      cards.innerHTML = Array.from({ length: n }, (_, i) => `<div class="bp-layer bp-card" style="animation-delay:calc(${i % bp.cols} * var(--beat))">Card<span class="bp-btn"></span></div>`).join("");
      head.style.animation = "none"; void head.offsetWidth; head.style.animation = "";
      let changed = 0;
      PROPS.forEach(([name, f], i) => {
        const now = f(bp), was = prev ? f(prev) : now, diff = now !== was;
        props[i].querySelector("b").textContent = now;
        props[i].classList.toggle("is-changed", diff);
        if (diff) changed++;
      });
      note.textContent = prev ? `${changed} ${changed === 1 ? "prop changes" : "props change"} from ${prev.label}` : "Pick a width";
      if (!quiet) live.textContent = `${bp.label}, ${bp.w} by ${bp.h}. ${bp.cols} ${bp.cols === 1 ? "column" : "columns"}.`;
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
  },
});
