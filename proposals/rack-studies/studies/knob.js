/* Knob, in Rack: a design tool's property device. The Card component's Radius, Padding and Border as three square dials,
   each with an arc in its property's colour and its value in words under it, beside a Preview panel that draws the card
   with those values. Drag up to turn (Shift for fine), arrows step, double-click returns to the default, and it stays where
   the hand left it. Variations A and B jump every dial to its value on the tick, one column after another (60 ms): no
   glide. The values keep their detents. The device's power key is its one lit key; off, the preview drops the props. */
(function () {
  const SWEEP = 270, PX_PER_DETENT = 4;
  const indexOf = (v, { min, max, detents, taper }) => {
    const f = taper === "log" ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min);
    return Math.round(Math.min(1, Math.max(0, f)) * detents);
  };
  const valueAt = (i, { min, max, detents, taper }) => {
    const v = taper === "log" ? min * Math.pow(max / min, i / detents) : min + ((max - min) * i) / detents;
    return Math.round(v * 100) / 100;
  };
  const PARAMS = [
    { key: "radius", label: "Radius", hue: "orange", min: 0, max: 24, detents: 24, home: 8, format: (v) => Math.round(v) + " px" },
    { key: "pad", label: "Padding", hue: "cyan", min: 0, max: 32, detents: 16, home: 8, format: (v) => Math.round(v) + " px" },
    { key: "border", label: "Border", hue: "purple", min: 0, max: 4, detents: 8, home: 2, format: (v) => v.toFixed(1) + " px" },
  ];
  const VARS = { A: { radius: 12, pad: 10, border: 2 }, B: { radius: 2, pad: 4, border: 6 } };
  const R = 15, C = 20;
  const pt = (deg, r) => { const a = ((deg - 90) * Math.PI) / 180; return (C + r * Math.cos(a)).toFixed(2) + " " + (C + r * Math.sin(a)).toFixed(2); };
  const arc = (a0, a1) => (Math.abs(a1 - a0) < 0.01 ? "" : "M" + pt(a0, R) + "A" + R + " " + R + " 0 " + (Math.abs(a1 - a0) > 180 ? 1 : 0) + " " + (a1 > a0 ? 1 : 0) + " " + pt(a1, R));
  let n = 0;

  FlatPlayer.register({
    slug: "knob",
    title: "Knob",
    tagline: "Component props that recall their variations on the tick.",
    css: `
.fs-knob .kd { width: min(330px, 100%); font: 400 12px/1.35 var(--font); background: var(--body); padding: 3px; border-radius: 8px; display: grid; gap: 3px;
  -webkit-user-select: none; user-select: none }
.fs-knob .kd-pv { background: var(--panel); border-radius: var(--r-panel); overflow: hidden; display: grid; grid-template-rows: auto 1fr }
.fs-knob .kd-pv-h { display: flex; align-items: center; justify-content: space-between; height: 24px; padding: 0 8px; background: var(--panel-2); font-weight: 600 }
.fs-knob .kd-pv-h span { font: 500 11px var(--mono); color: var(--muted) }
.fs-knob .kd-stage { display: grid; place-items: center; padding: 10px; min-height: 64px;
  background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: 8px 8px; background-position: -1px -1px }
.fs-knob .kd-card { display: grid; gap: 4px; width: 132px; background: var(--clip-blue-tint); color: var(--clip-blue-text); box-shadow: inset 0 0 0 var(--bw, 0) var(--clip-blue);
  border-radius: var(--rad, 0); padding: var(--pd, 0) }
.fs-knob .kd-card b { font-weight: 600; font-size: 12px }
.fs-knob .kd-card i { display: block; height: 6px; border-radius: 1px; background: var(--clip-blue); opacity: 0.45 }
.fs-knob .kd-card i + i { width: 60% }
.fs-knob .kd-off ~ .kd-pv .kd-card, .fs-knob .kd-pv.is-off .kd-card { --rad: 0 !important; --pd: 0 !important; --bw: 0 !important }
.fs-knob .kd-dev { background: var(--panel); border-radius: var(--r-panel); overflow: hidden }
.fs-knob .kd-head { display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 4px; background: var(--panel-2) }
.fs-knob .kd-head b { font-weight: 600; margin-right: auto; white-space: nowrap }
.fs-knob .kd-key { height: 20px; min-width: 22px; padding: 0 6px; border: 0; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge); color: var(--ink);
  font: 600 11px var(--mono); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
.fs-knob .kd-key:hover { background: var(--block-hover) }
.fs-knob .kd-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-knob .kd-key[aria-checked="true"] { background: var(--slot-fill); color: var(--cut) }
.fs-knob .kd-power[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
.fs-knob .kd-power svg { width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: square; display: block }
.fs-knob .kd-vars { display: flex; gap: 3px }
.fs-knob .kd-dials { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; padding: 10px 8px 8px }
.fs-knob .kd-col { display: grid; justify-items: center; gap: 4px; min-width: 0 }
.fs-knob .kd-label { color: var(--muted); font-size: 11.5px }
.fs-knob .kd-dial { width: 100%; max-width: 76px; aspect-ratio: 1; border-radius: var(--r-control); cursor: ns-resize; touch-action: none; display: grid; place-items: center }
.fs-knob .kd-dial svg { width: 100%; height: 100%; display: block }
.fs-knob .kd-track { fill: none; stroke: var(--slot); stroke-width: 3.5 }
.fs-knob .kd-arc { fill: none; stroke: var(--hue); stroke-width: 3.5 }
.fs-knob .kd-ptr { stroke: var(--ink); stroke-width: 2.2 }
.fs-knob .kd-val { width: 100%; max-width: 76px; height: 20px; display: grid; place-items: center; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px var(--mono); white-space: nowrap; overflow: hidden }
.fs-knob .kd-foot { display: flex; justify-content: space-between; gap: 6px; padding: 0 8px 7px; color: var(--muted); font-size: 11.5px }
.fs-knob .kd-off .kd-arc { stroke: var(--line-strong) }
.fs-knob .kd-off .kd-dials, .fs-knob .kd-off .kd-foot { opacity: 0.55 }
.fs-knob.is-tile .kd-stage { min-height: 0; padding: 6px } .fs-knob.is-tile .kd-dials { padding: 6px 8px 6px } .fs-knob.is-tile .kd-foot { display: none }
.fs-knob.is-tile .kd { grid-template-columns: 1fr 112px } .fs-knob.is-tile .kd-card { width: 92px } .fs-knob.is-tile .kd-dial { max-width: 54px }
@container (min-width: 520px) { .fs-knob .kd { width: 560px; grid-template-columns: 1fr 200px; font-size: 13px } .fs-knob .kd-dial, .fs-knob .kd-val { max-width: 96px } }
`,
    mount(host, ctx) {
      const id = "kd" + ++n;
      host.innerHTML = `
<div class="kd"><div class="kd-dev">
  <div class="kd-head">
    <button class="kd-key kd-power" type="button" aria-pressed="true" aria-label="Device on"><svg viewBox="0 0 10 10"><path d="M5 1v4M2.6 2.8a3.4 3.4 0 1 0 4.8 0"/></svg></button>
    <b>Card</b>
    <div class="kd-vars" role="radiogroup" aria-label="Variation">
      <button class="kd-key" type="button" role="radio" data-v="A" aria-label="Variation A">A</button><button class="kd-key" type="button" role="radio" data-v="B" aria-label="Variation B">B</button>
    </div>
  </div>
  <div class="kd-dials"></div>
  <div class="kd-foot" aria-hidden="true"><span class="kd-state"></span><span>Shift-drag for fine</span></div>
</div>
<div class="kd-pv" aria-hidden="true"><div class="kd-pv-h">Preview<span>Card</span></div><div class="kd-stage"><div class="kd-card"><b>Card title</b><i></i><i></i></div></div></div>
<p class="sr-only" aria-live="polite"></p></div>`;
      const sig = { signal: ctx.signal };
      const dev = host.querySelector(".kd-dev"), dials = host.querySelector(".kd-dials"), stateEl = host.querySelector(".kd-state"), live = host.querySelector("[aria-live]");
      const power = host.querySelector(".kd-power"), vars = [...host.querySelectorAll("[data-v]")];
      let variation = "A", edited = false, timers = [];

      function drawHead() {
        vars.forEach((b) => { const on = b.dataset.v === variation && !edited; b.setAttribute("aria-checked", String(on)); b.tabIndex = b.dataset.v === variation ? 0 : -1; });
        stateEl.textContent = edited ? "Variation " + variation + ", edited" : "Variation " + variation;
      }

      function Dial(p) {
        const col = document.createElement("div");
        col.className = "kd-col";
        col.style.setProperty("--hue", "var(--clip-" + p.hue + ")");
        col.innerHTML = '<span class="kd-label" aria-hidden="true"></span><div class="kd-dial" role="slider" tabindex="0" aria-orientation="vertical"><svg viewBox="0 0 40 40" aria-hidden="true">' +
          '<path class="kd-track" d="' + arc(-SWEEP / 2, SWEEP / 2) + '"/><path class="kd-arc"/><line class="kd-ptr" x1="20" y1="20"/></svg></div><span class="kd-val" aria-hidden="true"></span>';
        dials.appendChild(col);
        const el = col.querySelector(".kd-dial"), arcEl = col.querySelector(".kd-arc"), ptr = col.querySelector(".kd-ptr"), val = col.querySelector(".kd-val");
        col.querySelector(".kd-label").textContent = p.label;
        el.setAttribute("aria-label", p.label); el.setAttribute("aria-valuemin", p.min); el.setAttribute("aria-valuemax", p.max);
        let index = 0, drag = null;
        const css = { radius: "--rad", pad: "--pd", border: "--bw" }[p.key];
        function draw() {
          const f = index / p.detents, a = -SWEEP / 2 + f * SWEEP;
          arcEl.setAttribute("d", p.bipolar ? arc(Math.min(0, a), Math.max(0, a)) : arc(-SWEEP / 2, a));
          const [x, y] = pt(a, 11).split(" "), [x0, y0] = pt(a, 0).split(" ");
          ptr.setAttribute("x1", x0); ptr.setAttribute("y1", y0); ptr.setAttribute("x2", x); ptr.setAttribute("y2", y);
          const v = valueAt(index, p);
          val.textContent = p.format(v);
          host.querySelector(".kd-card").style.setProperty(css, (p.key === "border" ? v : Math.round(v)) + "px");
          el.setAttribute("aria-valuenow", String(v)); el.setAttribute("aria-valuetext", p.format(v));
        }
        function set(i, byHand) {
          const next = Math.min(p.detents, Math.max(0, i));
          if (next === index) return;
          index = next; draw();
          if (byHand && !edited) { edited = true; drawHead(); live.textContent = "Variation " + variation + " edited"; }
        }
        el.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; el.setPointerCapture(e.pointerId); drag = { id: e.pointerId, y: e.clientY, from: index }; }, sig);
        el.addEventListener("pointermove", (e) => {
          if (!drag || drag.id !== e.pointerId) return;
          set(drag.from + Math.round((drag.y - e.clientY) / (PX_PER_DETENT * (e.shiftKey ? 4 : 1))), true);
        }, sig);
        const end = (e) => { if (drag && drag.id === e.pointerId) drag = null; };
        el.addEventListener("pointerup", end, sig); el.addEventListener("pointercancel", end, sig);
        el.addEventListener("dblclick", () => set(p.home, true), sig);
        el.addEventListener("keydown", (e) => {
          const page = Math.max(1, Math.round(p.detents / 10));
          const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: page, PageDown: -page }[e.key];
          if (d) set(index + d, true); else if (e.key === "Home") set(0, true); else if (e.key === "End") set(p.detents, true); else return;
          e.preventDefault();
        }, sig);
        draw();
        return { set };
      }
      const dialsBy = Object.fromEntries(PARAMS.map((p) => [p.key, Dial(p)]));
      PARAMS.forEach((p) => dialsBy[p.key].set(p.home, false));

      /* A variation lands on the beat, a column at a time. */
      function recall(v) {
        timers.forEach(clearTimeout);
        variation = v; edited = false; drawHead();
        const beat = ctx.reduced() ? 0 : 60;
        timers = PARAMS.map((p, i) => ctx.after(i * beat, () => dialsBy[p.key].set(VARS[v][p.key], false)));
        live.textContent = "Variation " + v + " recalled";
      }
      vars.forEach((b) => b.addEventListener("click", () => recall(b.dataset.v), sig));
      host.querySelector(".kd-vars").addEventListener("keydown", (e) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
        e.preventDefault(); const v = variation === "A" ? "B" : "A"; recall(v); vars.find((b) => b.dataset.v === v).focus();
      }, sig);
      power.addEventListener("click", () => {
        const on = power.getAttribute("aria-pressed") !== "true";
        power.setAttribute("aria-pressed", String(on)); power.setAttribute("aria-label", on ? "Device on" : "Device off");
        dev.classList.toggle("kd-off", !on); host.querySelector(".kd-pv").classList.toggle("is-off", !on); live.textContent = on ? "Card props on" : "Card props off";
      }, sig);
      drawHead();

      /* A ghost compares the two variations until a hand arrives. */
      let handed = false;
      ctx.onHand(() => { handed = true; });
      ctx.after(300, () => recall("A"));
      if (!ctx.reduced()) ctx.every(2000, () => { if (!handed) recall(variation === "A" ? "B" : "A"); });
    },
  });
})();
