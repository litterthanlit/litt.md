/* Knob, Rack 2.0: a design tool's props for one component. The canvas carries the Card (pink, as layers are across the
   wall); beside it, three value boxes: Radius, Padding and Border. Drag a box up or down to set it 1:1 (Shift for fine),
   arrows step, double-click returns to the default, and it stays where the hand left it. While a box is in hand the canvas
   draws the measurement on the card in red. Variations A and B jump every prop on the tick, one after another (60 ms): no
   glide. A ghost compares the two variations until a hand arrives. */
(function () {
  const PROPS = [
    { key: "radius", label: "Radius", min: 0, max: 24, step: 1, home: 8, unit: "px" },
    { key: "pad", label: "Padding", min: 0, max: 32, step: 2, home: 12, unit: "px" },
    { key: "border", label: "Border", min: 0, max: 4, step: 0.5, home: 1, unit: "px" },
  ];
  const VARS = { A: { radius: 12, pad: 16, border: 1 }, B: { radius: 2, pad: 6, border: 3 } };
  const fmt = (p, v) => (p.step < 1 ? v.toFixed(1) : String(v)) + " " + p.unit;

  FlatPlayer.register({
    slug: "knob",
    title: "Knob",
    tagline: "Component props that recall their variations on the tick.",
    css: `
.fs-knob .kp { width: min(100%, 620px); display: grid; grid-template-columns: 1fr 150px; gap: 3px; font-size: 12px; -webkit-user-select: none; user-select: none }
.fs-knob .kp-dev { background: var(--panel); border-radius: var(--r-panel); overflow: hidden; min-width: 0 }
.fs-knob .kp-strip { display: flex; align-items: center; gap: 4px; height: 30px; padding: 0 4px 0 10px; background: var(--panel-2); white-space: nowrap }
.fs-knob .kp-strip b { font-weight: 600; margin-right: auto }
.fs-knob .kp-key { height: 22px; min-width: 26px; padding: 0 8px; border: 0; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge); color: var(--ink);
  font: 600 11px var(--font); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
.fs-knob .kp-key:hover { background: var(--block-hover) }
.fs-knob .kp-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-knob .kp-key[aria-checked="true"] { background: var(--accent); color: var(--accent-fg) }
.fs-knob .kp-wrap { padding: 12px }
.fs-knob .kp-canvas { position: relative; display: grid; place-items: center; min-height: 168px; background-color: var(--cut); border-radius: var(--r-control); box-shadow: var(--edge);
  background-image: linear-gradient(color-mix(in oklab, var(--line) 55%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--line) 55%, transparent) 1px, transparent 1px); background-size: 12px 12px; background-position: -1px -1px }
.fs-knob .kp-card { position: relative; width: 156px; display: grid; gap: 5px; background: var(--clip-pink-tint); color: var(--clip-pink-text);
  box-shadow: inset 0 0 0 max(1px, var(--bw, 1px)) var(--clip-pink); border-radius: var(--rad, 0); padding: var(--pd, 0) }
.fs-knob .kp-card b { font-weight: 600; font-size: 11px; line-height: 14px }
.fs-knob .kp-card i { display: block; height: 6px; border-radius: 1px; background: var(--clip-pink); opacity: 0.4 }
.fs-knob .kp-card i + i { width: 62% }
.fs-knob .kp-guide { position: absolute; inset: var(--pd, 0); box-shadow: inset 0 0 0 1px var(--danger); border-radius: 0; pointer-events: none; display: none }
.fs-knob .kp-tag { position: absolute; right: -6px; top: -9px; padding: 1px 3px; background: var(--danger); color: var(--cut); border-radius: var(--r-control);
  font: 600 9px/11px var(--mono); white-space: nowrap; display: none }
.fs-knob .kp[data-show] .kp-tag { display: block }
.fs-knob .kp[data-show="pad"] .kp-guide { display: block }
.fs-knob .kp-props { display: grid; gap: 8px; padding: 12px 10px; align-content: start }
.fs-knob .kp-prop { display: grid; gap: 3px }
.fs-knob .kp-prop span { color: var(--muted); font-size: 11px }
.fs-knob .kp-box { height: 24px; padding: 0 8px; display: flex; align-items: center; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px var(--mono); cursor: ns-resize; touch-action: none; white-space: nowrap }
.fs-knob .kp-box:active { box-shadow: var(--edge-press) }
.fs-knob.is-tile .kp { grid-template-columns: 1fr }
.fs-knob.is-tile .kp-side { display: none }
@container (max-width: 440px) { .fs-knob:not(.is-tile) .kp { grid-template-columns: 1fr } .fs-knob .kp-props { grid-template-columns: repeat(3, 1fr) } }
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="kp">
  <div class="kp-dev">
    <div class="kp-strip"><b>Card</b>
      <span role="radiogroup" aria-label="Variation" style="display:flex;gap:3px"><button class="kp-key" type="button" role="radio" data-v="A" aria-label="Variation A">A</button><button class="kp-key" type="button" role="radio" data-v="B" aria-label="Variation B">B</button></span>
    </div>
    <div class="kp-wrap"><div class="kp-canvas" aria-hidden="true"><div class="kp-card"><b>Card</b><i></i><i></i><span class="kp-guide"></span><span class="kp-tag"></span></div></div></div>
  </div>
  <div class="kp-dev kp-side"><div class="kp-strip"><b>Props</b></div><div class="kp-props"></div></div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const sig = { signal: ctx.signal };
      const root = host.querySelector(".kp"), card = host.querySelector(".kp-card"), tag = host.querySelector(".kp-tag"), props = host.querySelector(".kp-props");
      const vars = [...host.querySelectorAll("[data-v]")], live = host.querySelector("[aria-live]");
      const values = {}, boxes = {};
      let variation = "A", edited = false, timers = [];
      const css = { radius: "--rad", pad: "--pd", border: "--bw" };

      function show(key) {
        if (!key) { root.removeAttribute("data-show"); return; }
        root.dataset.show = key;
        const p = PROPS.find((x) => x.key === key);
        tag.textContent = fmt(p, values[key]);
      }
      function set(p, v, byHand) {
        v = Math.min(p.max, Math.max(p.min, Math.round(v / p.step) * p.step));
        values[p.key] = v;
        card.style.setProperty(css[p.key], v + "px");
        const b = boxes[p.key];
        b.textContent = fmt(p, v); b.setAttribute("aria-valuenow", String(v)); b.setAttribute("aria-valuetext", fmt(p, v));
        if (root.dataset.show === p.key) tag.textContent = fmt(p, v);
        if (byHand && !edited) { edited = true; drawVars(); live.textContent = "Variation " + variation + " edited"; }
      }
      PROPS.forEach((p) => {
        const wrap = document.createElement("label");
        wrap.className = "kp-prop";
        wrap.innerHTML = '<span></span><span class="kp-box" role="slider" tabindex="0" aria-orientation="vertical"></span>';
        wrap.querySelector("span").textContent = p.label;
        const b = wrap.querySelector(".kp-box");
        b.setAttribute("aria-label", p.label); b.setAttribute("aria-valuemin", p.min); b.setAttribute("aria-valuemax", p.max);
        boxes[p.key] = b; props.appendChild(wrap);
        let drag = null;
        b.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; b.setPointerCapture(e.pointerId); drag = { id: e.pointerId, y: e.clientY, from: values[p.key] }; show(p.key); }, sig);
        b.addEventListener("pointermove", (e) => { if (drag && drag.id === e.pointerId) set(p, drag.from + ((drag.y - e.clientY) / (e.shiftKey ? 16 : 4)) * p.step, true); }, sig);
        const end = (e) => { if (drag && drag.id === e.pointerId) { drag = null; if (document.activeElement !== b) show(null); } };
        b.addEventListener("pointerup", end, sig); b.addEventListener("pointercancel", end, sig);
        b.addEventListener("dblclick", () => set(p, p.home, true), sig);
        b.addEventListener("focus", () => show(p.key), sig);
        b.addEventListener("blur", () => show(null), sig);
        b.addEventListener("keydown", (e) => {
          const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 4, PageDown: -4 }[e.key];
          if (d) set(p, values[p.key] + d * p.step, true); else if (e.key === "Home") set(p, p.min, true); else if (e.key === "End") set(p, p.max, true); else return;
          e.preventDefault();
        }, sig);
        set(p, p.home, false);
      });

      function drawVars() { vars.forEach((b) => { b.setAttribute("aria-checked", String(b.dataset.v === variation && !edited)); b.tabIndex = b.dataset.v === variation ? 0 : -1; }); }
      function recall(v) {
        timers.forEach(clearTimeout);
        variation = v; edited = false; drawVars();
        const beat = ctx.reduced() ? 0 : 60;
        timers = PROPS.map((p, i) => ctx.after(i * beat, () => set(p, VARS[v][p.key], false)));
        live.textContent = "Variation " + v;
      }
      vars.forEach((b) => b.addEventListener("click", () => recall(b.dataset.v), sig));
      vars[0].parentElement.addEventListener("keydown", (e) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
        e.preventDefault(); const v = variation === "A" ? "B" : "A"; recall(v); vars.find((b) => b.dataset.v === v).focus();
      }, sig);
      drawVars();

      let handed = false;
      ctx.onHand(() => { handed = true; });
      ctx.after(300, () => recall("A"));
      if (!ctx.reduced()) ctx.every(2000, () => { if (!handed) recall(variation === "A" ? "B" : "A"); });
    },
  });
})();
