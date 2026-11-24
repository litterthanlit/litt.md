/* Switch, after litterthanlit/components, in Rack 2.0: one agent's permissions. The surface holds the Coder as one
   orange object (its tint, a 1px edge in the hue, its name in the hue's text) whose spend this run fills it from the
   left, and four permission keys under it, each lit in the ink when the agent may act without asking. The strip has
   the enable key (the one yellow) and the spend limit. Nothing slides: a key lights on the frame, and a drag across
   it ends on a side. At the limit the agent stops and asks, drawn on the object in red. */
(function () {
  const S = ".fs-switch";
  const TICK = 120;
  const PERMS = [
    { key: "read", label: "Read files" },
    { key: "write", label: "Write files" },
    { key: "run", label: "Run commands" },
    { key: "net", label: "Network" },
  ];
  const LIMIT = { min: 0.25, max: 10, step: 0.25, def: 2 };
  /* The policy on load: enable, then each permission in turn, and Network back to Ask. */
  const POLICY = [[1, "power", true], [3, "read", true], [5, "write", true], [7, "run", true], [9, "net", true], [15, "net", false]];
  const RUN = 9, RATE = 0.19;
  const money = (v) => `$${v.toFixed(2)}`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let uid = 0;

  /* A toggle key, lit when on. A tap flips it; a drag across it ends on a side. */
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
    tagline: "An agent's permissions: keys that light on the frame, and a limit it asks at.",
    css: `
${S} .pm { width: min(100%, 330px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px; user-select: none; -webkit-user-select: none;
  --hue: var(--clip-orange); --tint: var(--clip-orange-tint); --text: var(--clip-orange-text) }
${S} .pm-strip { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 6px; background: var(--panel-2) }
${S} .pm-strip b { font-weight: 600; margin-right: auto }
${S} .pm-lbl { color: var(--muted); font-size: 11px }
${S} .pm-val { height: 22px; min-width: 52px; display: flex; align-items: center; justify-content: flex-end; padding: 0 6px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px/1 var(--mono); font-variant-numeric: tabular-nums; cursor: ns-resize; touch-action: none }
${S} .pm-val:active { box-shadow: var(--edge-press) }
${S} .pm-surface { display: grid; gap: 10px; padding: 14px }
${S} .pm-agent { position: relative; height: 64px; border-radius: var(--r-control); background: var(--tint); box-shadow: inset 0 0 0 1px var(--hue); color: var(--text); overflow: hidden;
  transition: box-shadow var(--cut-in) var(--ease-out) }
${S} .pm-agent i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: color-mix(in oklab, var(--hue) 22%, var(--tint)); transform-origin: left center; transform: scaleX(var(--f, 0)) }
${S} .pm-agent > span { position: absolute; left: 7px; top: 6px; font: 600 11px/1 var(--font) }
${S} .pm-agent > em { position: absolute; right: 7px; bottom: 6px; font: 600 11px/1 var(--mono); font-style: normal; font-variant-numeric: tabular-nums }
${S} .pm-agent > small { position: absolute; left: 7px; bottom: 6px; font-size: 11px; font-weight: 500 }
${S} .pm-agent.is-over { box-shadow: inset 0 0 0 1px var(--danger) }
${S} .pm-agent.is-over > small, ${S} .pm-agent.is-over > em { color: var(--danger) }
${S} .pm-agent.is-off { background: var(--panel-2); box-shadow: inset 0 0 0 1px var(--line-strong); color: var(--muted) }
${S} .pm-agent.is-off i { display: none }
${S} .pm-keys { display: grid; grid-template-columns: 1fr 1fr; gap: 4px }
${S} .pm-key { all: unset; box-sizing: border-box; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge);
  font: 600 11px/1 var(--font); color: var(--muted); cursor: pointer; touch-action: pan-y; white-space: nowrap;
  transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
${S} .pm-key:hover { background: var(--block-hover) }
${S} .pm-key:active { box-shadow: var(--edge-press); scale: 0.98 }
${S} .pm-key[aria-checked="true"] { background: var(--ink); color: var(--panel) }
${S} .pm-key.is-power { width: 22px; height: 22px; flex: none }
${S} .pm-key.is-power svg { width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: square }
${S} .pm-key.is-power[aria-checked="true"] { background: var(--accent); color: var(--accent-fg) }
${S} .pm-key:disabled { background: var(--panel-2); box-shadow: inset 0 0 0 1px var(--line); color: var(--disabled); cursor: default }
${S} .pm-key:focus-visible, ${S} .pm-val:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px }
@container (min-width: 560px) {
  ${S} .pm { width: 480px } ${S} .pm-surface { padding: 16px; gap: 12px }
  ${S} .pm-agent { height: 96px } ${S} .pm-agent > span, ${S} .pm-agent > em { font-size: 12px }
  ${S} .pm-keys { grid-template-columns: repeat(4, 1fr) } ${S} .pm-key { height: 30px }
}
`,
    mount(host, ctx) {
      const id = "fs-pm2-" + ++uid;
      host.innerHTML = `
<section class="pm" aria-labelledby="${id}">
  <div class="pm-strip">
    <button type="button" class="pm-key is-power" role="switch" aria-checked="false" data-k="power" aria-label="Coder enabled"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1v4M2.6 2.8a3.2 3.2 0 1 0 4.8 0"/></svg></button>
    <b id="${id}">Permissions</b>
    <span class="pm-lbl" aria-hidden="true">Limit</span>
    <span class="pm-val" role="slider" tabindex="0" aria-label="Spend limit per run" aria-valuemin="${LIMIT.min}" aria-valuemax="${LIMIT.max}"></span>
  </div>
  <div class="pm-surface">
    <div class="pm-agent" aria-hidden="true"><i></i><span>Coder</span><small></small><em>$0.00</em></div>
    <div class="pm-keys" role="group" aria-label="Allowed without asking">
      ${PERMS.map((p) => `<button type="button" class="pm-key" role="switch" aria-checked="false" data-k="${p.key}">${p.label}</button>`).join("")}
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</section>`;
      const agent = host.querySelector(".pm-agent"), spentEl = agent.querySelector("em"), word = agent.querySelector("small");
      const limitBox = host.querySelector(".pm-val"), live = host.querySelector("[aria-live]");
      const sig = { signal: ctx.signal };
      let spent = 0, t = 0, held = false, limit = LIMIT.def;

      const keys = {};
      function paint() {
        const on = keys.power.on, over = spent >= limit;
        agent.classList.toggle("is-off", !on);
        agent.classList.toggle("is-over", on && over);
        agent.style.setProperty("--f", clamp(spent / limit, 0, 1).toFixed(4));
        spentEl.textContent = money(spent);
        word.textContent = !on ? "Off" : over ? "At limit, asking" : "";
        for (const p of PERMS) keys[p.key].el.disabled = !on;
        if (on && over && !held) live.textContent = "Coder reached its spend limit and is asking";
        held = on && over;
      }
      const pk = host.querySelector('[data-k="power"]');
      keys.power = Object.assign(toggleKey(pk, ctx, (on, user) => { paint(); if (user) live.textContent = `Coder ${on ? "enabled" : "off"}`; }), { el: pk });
      for (const p of PERMS) {
        const b = host.querySelector(`[data-k="${p.key}"]`);
        keys[p.key] = Object.assign(toggleKey(b, ctx, () => {}), { el: b });
      }

      /* The limit: a value box, dragged up and down 1:1 (Shift for fine), arrows step, double-click resets. */
      const paintLimit = () => { const s = money(limit); limitBox.textContent = s; limitBox.setAttribute("aria-valuenow", String(limit)); limitBox.setAttribute("aria-valuetext", s); paint(); };
      const setLimit = (v) => { limit = clamp(Math.round(v / LIMIT.step) * LIMIT.step, LIMIT.min, LIMIT.max); paintLimit(); };
      let drag = null;
      limitBox.addEventListener("pointerdown", (e) => { if (e.button !== 0) return; limitBox.setPointerCapture(e.pointerId); limitBox.focus({ preventScroll: true }); drag = { y: e.clientY, v: limit }; e.preventDefault(); }, sig);
      limitBox.addEventListener("pointermove", (e) => { if (!drag) return; setLimit(drag.v + ((drag.y - e.clientY) / 120) * (LIMIT.max - LIMIT.min) * (e.shiftKey ? 0.1 : 1)); if (e.shiftKey) { drag.y = e.clientY; drag.v = limit; } }, sig);
      limitBox.addEventListener("pointerup", () => (drag = null), sig);
      limitBox.addEventListener("pointercancel", () => (drag = null), sig);
      limitBox.addEventListener("dblclick", () => setLimit(LIMIT.def), sig);
      limitBox.addEventListener("keydown", (e) => {
        const d = { ArrowUp: LIMIT.step, ArrowRight: LIMIT.step, ArrowDown: -LIMIT.step, ArrowLeft: -LIMIT.step, PageUp: 1, PageDown: -1 }[e.key];
        if (d !== undefined) { e.preventDefault(); setLimit(limit + d); }
      }, sig);
      paintLimit();

      const timers = [];
      if (ctx.reduced()) { for (const [, k, on] of POLICY) keys[k].set(on, false); spent = 0.84; paint(); }
      else {
        for (const [b, k, on] of POLICY) timers.push(ctx.after(b * TICK, () => keys[k].set(on, false)));
        /* The spend is the work, so it is what moves; a run ends and the next starts at $0. */
        ctx.loop((dt) => {
          if (!keys.power.on) return;
          t += dt;
          if (t > RUN) { t = 0; spent = 0; }
          else if (!held) spent += dt * RATE * (0.6 + 0.8 * Math.abs(Math.sin(t * 1.7)));
          paint();
        });
      }
      ctx.onHand(() => timers.forEach(clearTimeout));
    },
  });
})();
