/* Switch, after litterthanlit/components, redesigned in Rack: an agent's permissions, as a device. Each agent is a
   device in its own colour: a title strip with its enable key (the one lit yellow key), what this run has spent so far
   against its budget, and five permissions, each a toggle key with its word on its face (Allow, or Ask) and a value
   box for its limit. Nothing slides: a key lights on the frame, and a drag across it ends on a side. On load the
   policy applies a key at a time on the tick; after that the only thing that moves is the spend, because it is the
   work. */
(function () {
  const S = ".fs-switch";
  const TICK = 120; // ms between keys as the policy applies
  const AGENTS = [
    { id: "coder", name: "Coder", model: "Large", hue: "orange", at: 0, rate: 0.19 },
    { id: "research", name: "Researcher", model: "Small", hue: "blue", at: TICK, rate: 0.11 },
  ];
  const money = (v) => `$${v.toFixed(2)}`;
  const PERMS = [
    { key: "read", label: "Read files", min: 0, max: 1000, step: 10, def: 200, fmt: (v) => `${v} files`, name: "Read limit" },
    { key: "write", label: "Write files", min: 0, max: 100, step: 1, def: 20, fmt: (v) => `${v} files`, name: "Write limit" },
    { key: "run", label: "Run commands", min: 5, max: 600, step: 5, def: 30, fmt: (v) => `${v} s`, name: "Command timeout" },
    { key: "net", label: "Network", min: 0, max: 20, step: 1, def: 4, fmt: (v) => `${v} hosts`, name: "Network hosts" },
    { key: "spend", label: "Spend", min: 0.25, max: 10, step: 0.25, def: 2, fmt: money, name: "Spend limit per run" },
  ];
  /* The policy on load: enable, then each permission in turn, and Network back to Ask. */
  const POLICY = [[1, "power", true], [3, "read", true], [5, "write", true], [7, "run", true], [9, "net", true], [11, "spend", true], [16, "net", false]];
  const RUN = 9; // s a demo run lasts before the next begins
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let uid = 0;

  /* A value box: role slider, drag up and down 1:1 (Shift for fine), arrows step, double-click returns to default. */
  function valueBox(el, s, ctx) {
    let v = s.def;
    const snap = (x) => clamp(Math.round(x / s.step) * s.step, s.min, s.max);
    const paint = () => { const t = s.fmt(v); el.textContent = t; el.setAttribute("aria-valuenow", String(v)); el.setAttribute("aria-valuetext", t); };
    const set = (x) => { const n = snap(x); if (n !== v) { v = n; paint(); } };
    const sig = { signal: ctx.signal };
    let drag = null;
    el.addEventListener("pointerdown", (e) => { if (e.button !== 0 || el.getAttribute("aria-disabled") === "true") return; el.setPointerCapture(e.pointerId); el.focus({ preventScroll: true }); drag = { y: e.clientY, v }; e.preventDefault(); }, sig);
    el.addEventListener("pointermove", (e) => {
      if (!drag) return;
      set(drag.v + ((drag.y - e.clientY) / 120) * (s.max - s.min) * (e.shiftKey ? 0.1 : 1));
      if (e.shiftKey) { drag.y = e.clientY; drag.v = v; }
    }, sig);
    const end = () => (drag = null);
    el.addEventListener("pointerup", end, sig); el.addEventListener("pointercancel", end, sig);
    el.addEventListener("dblclick", () => set(s.def), sig);
    el.addEventListener("keydown", (e) => {
      if (el.getAttribute("aria-disabled") === "true") return;
      const big = (s.max - s.min) / 10;
      const d = { ArrowUp: s.step, ArrowRight: s.step, ArrowDown: -s.step, ArrowLeft: -s.step, PageUp: big, PageDown: -big }[e.key];
      if (d !== undefined) { e.preventDefault(); set(v + d); }
      else if (e.key === "Home") { e.preventDefault(); set(s.min); }
      else if (e.key === "End") { e.preventDefault(); set(s.max); }
    }, sig);
    paint();
    return { get value() { return v; } };
  }

  /* A toggle key: its word on its face, lit when on. A tap flips it; a drag across it ends on a side. */
  function toggleKey(btn, ctx, onChange) {
    let on = false;
    const set = (x, user) => { if (x === on) return; on = x; btn.setAttribute("aria-checked", on ? "true" : "false"); onChange(on, user); };
    const sig = { signal: ctx.signal };
    let down = null;
    btn.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; btn.setPointerCapture(e.pointerId); down = { x: e.clientX }; }, sig);
    btn.addEventListener("pointerup", (e) => {
      if (!down) return;
      const moved = Math.abs(e.clientX - down.x) > 6; down = null;
      if (btn.disabled) return;
      if (!moved) return set(!on, true);
      const r = btn.getBoundingClientRect();
      set(e.clientX > r.left + r.width / 2, true);
    }, sig);
    btn.addEventListener("pointercancel", () => (down = null), sig);
    btn.addEventListener("click", (e) => { if (e.detail === 0) set(!on, true); }, sig);
    return { get on() { return on; }, set };
  }

  FlatPlayer.register({
    slug: "switch",
    title: "Switch",
    tagline: "An agent's permissions: toggle keys that light on the frame, each with its limit.",
    css: `
${S} .pm { width: min(100%, 330px); display: grid; gap: 3px; padding: 3px; background: var(--body); border-radius: var(--r-panel); user-select: none; -webkit-user-select: none }
${S} .pm-dev { background: var(--panel); border-radius: var(--r-panel); overflow: hidden; min-width: 0 }
${S} .pm-dev + .pm-dev { display: none }
${S} .pm-strip { display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 5px; background: var(--panel-2) }
${S} .pm-title { font-size: 12px; font-weight: 600; white-space: nowrap }
${S} .pm-tag { height: 18px; padding: 0 6px; display: inline-flex; align-items: center; border-radius: var(--r-control); font: 600 10px/1 var(--mono);
  background: var(--tint); color: var(--text); white-space: nowrap }
${S} .pm-state { margin-left: auto; font-size: 11px; color: var(--muted); white-space: nowrap }
${S} .pm-state.is-danger { color: var(--danger) }
${S} .pm-body { display: grid; gap: 4px; padding: 6px 6px 7px }
${S} .pm-row { display: grid; grid-template-columns: minmax(0, 1fr) 70px 44px; align-items: center; gap: 4px; min-height: 22px }
${S} .pm-label { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
${S} .pm-use { display: grid; grid-template-columns: auto minmax(0, 1fr) 70px; align-items: center; gap: 6px; padding-bottom: 5px; margin-bottom: 1px; border-bottom: 1px solid var(--line) }
${S} .pm-slot { position: relative; height: 8px; border-radius: var(--r-control); background: var(--slot); overflow: hidden }
${S} .pm-slot i { position: absolute; inset: 0; background: var(--hue); transform-origin: left center; transform: scaleX(var(--f, 0)) }
${S} .pm-slot.is-over i { background: var(--danger) }
${S} .pm-val { height: 22px; display: flex; align-items: center; justify-content: flex-end; padding: 0 6px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 500 11px/1 var(--mono); font-variant-numeric: tabular-nums; color: var(--ink); white-space: nowrap; overflow: hidden; cursor: ns-resize; touch-action: none }
${S} .pm-val:active { box-shadow: var(--edge-press) }
${S} .pm-val[aria-disabled="true"] { color: var(--disabled); cursor: default }
${S} .pm-val.is-read { background: transparent; box-shadow: none; cursor: default; color: var(--ink) }
${S} .pm-val.is-over { color: var(--danger) }
${S} .pm-key { all: unset; box-sizing: border-box; height: 22px; display: grid; place-items: center; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge);
  font: 600 11px/1 var(--font); color: var(--muted); cursor: pointer; touch-action: pan-y; transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
${S} .pm-key > span { grid-area: 1 / 1 } ${S} .pm-key .w-on { visibility: hidden }
${S} .pm-key[aria-checked="true"] .w-on { visibility: visible } ${S} .pm-key[aria-checked="true"] .w-off { visibility: hidden }
${S} .pm-key:hover { background: var(--block-hover) }
${S} .pm-key:active { box-shadow: var(--edge-press); scale: 0.98 }
${S} .pm-key[aria-checked="true"] { background: var(--ink); color: var(--panel) }
${S} .pm-key.is-power { width: 18px; height: 18px; flex: none }
${S} .pm-key.is-power svg { width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: square }
${S} .pm-key.is-power[aria-checked="true"] { background: var(--accent); color: var(--accent-fg) }
${S} .pm-key:disabled { background: var(--panel-2); box-shadow: inset 0 0 0 1px var(--line); color: var(--disabled); cursor: default }
${S} .pm-key:focus-visible, ${S} .pm-val:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px }
${S} .pm-dev:not(.is-on) .pm-body { opacity: 0.55 }
@container (min-width: 600px) {
  ${S} .pm { width: 640px; grid-template-columns: 1fr 1fr }
  ${S} .pm-dev + .pm-dev { display: block }
}
`,
    mount(host, ctx) {
      const id = "fs-pm-" + ++uid;
      host.innerHTML = `
<div class="pm">
  ${AGENTS.map((a) => `<section class="pm-dev" data-a="${a.id}" aria-labelledby="${id}-${a.id}" style="--hue: var(--clip-${a.hue}); --tint: var(--clip-${a.hue}-tint); --text: var(--clip-${a.hue}-text)">
    <div class="pm-strip">
      <button type="button" class="pm-key is-power" role="switch" aria-checked="false" data-k="power" aria-label="${a.name} enabled"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1v4M2.6 2.8a3.2 3.2 0 1 0 4.8 0"/></svg></button>
      <span class="pm-title" id="${id}-${a.id}">${a.name}</span><span class="pm-tag">${a.model}</span>
      <span class="pm-state" aria-hidden="true">Off</span>
    </div>
    <div class="pm-body">
      <div class="pm-use"><span class="pm-label">This run</span><span class="pm-slot" aria-hidden="true"><i></i></span><span class="pm-val is-read" aria-hidden="true">$0.00</span></div>
      ${PERMS.map((p) => `<div class="pm-row"><span class="pm-label">${p.label}</span>
        <span class="pm-val" role="slider" tabindex="0" data-v="${p.key}" aria-label="${p.name}" aria-valuemin="${p.min}" aria-valuemax="${p.max}"></span>
        <button type="button" class="pm-key" role="switch" aria-checked="false" data-k="${p.key}" aria-label="${p.label}, allow without asking"><span class="w-off" aria-hidden="true">Ask</span><span class="w-on" aria-hidden="true">Allow</span></button></div>`).join("")}
    </div>
  </section>`).join("")}
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const live = host.querySelector("[aria-live]");
      const devs = AGENTS.map((a) => {
        const el = host.querySelector(`.pm-dev[data-a="${a.id}"]`);
        const dev = { a, el, keys: {}, vals: {}, state: el.querySelector(".pm-state"), slot: el.querySelector(".pm-slot"), read: el.querySelector(".pm-use .pm-val"),
          spent: 0, t: 0, run: 1, held: false };
        const enabled = () => {
          const on = dev.keys.power.on;
          el.classList.toggle("is-on", on);
          for (const p of PERMS) { dev.keys[p.key].el.disabled = !on; dev.vals[p.key].el.setAttribute("aria-disabled", on ? "false" : "true"); }
          paint(dev);
        };
        const k = el.querySelector('[data-k="power"]');
        dev.keys.power = Object.assign(toggleKey(k, ctx, (on, user) => { enabled(); if (user) live.textContent = `${a.name} ${on ? "enabled" : "off"}`; }), { el: k });
        for (const p of PERMS) {
          const b = el.querySelector(`[data-k="${p.key}"]`), v = el.querySelector(`[data-v="${p.key}"]`);
          dev.keys[p.key] = Object.assign(toggleKey(b, ctx, () => paint(dev)), { el: b });
          dev.vals[p.key] = Object.assign(valueBox(v, p, ctx), { el: v });
        }
        enabled();
        return dev;
      });

      /* What the run has spent against its limit. At the limit, or with Spend set to Ask, the agent stops and asks. */
      function paint(dev) {
        const limit = dev.vals.spend.value, over = dev.spent >= limit, asking = !dev.keys.spend.on || over;
        dev.slot.style.setProperty("--f", clamp(dev.spent / limit, 0, 1).toFixed(4));
        dev.slot.classList.toggle("is-over", over); dev.read.classList.toggle("is-over", over);
        dev.read.textContent = money(dev.spent);
        dev.state.classList.toggle("is-danger", over && dev.keys.power.on);
        dev.state.textContent = !dev.keys.power.on ? "Off" : over ? "At limit, asking" : asking ? "Asks to spend" : `Run ${dev.run}`;
        const held = dev.keys.power.on && asking;
        if (held && !dev.held && dev.keys.power.on && dev.keys.spend.on) live.textContent = `${dev.a.name} reached its spend limit and is asking`;
        dev.held = held;
      }

      const timers = [];
      const finish = () => devs.forEach((dev) => { for (const [, key, on] of POLICY) dev.keys[key].set(on, false); });
      if (ctx.reduced()) { finish(); devs.forEach((dev, i) => { dev.spent = 0.84 - i * 0.37; paint(dev); }); }
      else {
        for (const dev of devs) for (const [b, key, on] of POLICY) timers.push(ctx.after(dev.a.at + b * TICK, () => dev.keys[key].set(on, false)));
        ctx.loop((dt) => {
          for (const dev of devs) {
            if (!dev.keys.power.on) continue;
            dev.t += dt;
            if (dev.t > RUN) { dev.t = 0; dev.spent = 0; dev.run++; }
            else if (!dev.held) dev.spent += dt * dev.a.rate * (0.6 + 0.8 * Math.abs(Math.sin(dev.t * 1.7)));
            paint(dev);
          }
        });
      }
      ctx.onHand(() => timers.forEach(clearTimeout));
    },
  });
})();
