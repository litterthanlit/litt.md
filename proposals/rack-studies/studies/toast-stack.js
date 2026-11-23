/* Toast Stack, after litterthanlit/components, redesigned in Rack (round 2: agents, not music).
   The product underneath is an agent console's activity: what finished while you were building (a run, a tool call that
   failed, an approval waiting, a deploy). In Rack nothing travels, so the stack doesn't fan: collapsed, the newest
   message shows with "2 more" under it; look at the panel (hover or focus) and the rest cut in one beat apart, every
   timer paused. Each message wears the colour of the agent it is about (its tab, the agent's name and the bar of time
   it has left, which runs linearly and stops while you read). Failed is said in red; dismiss is a square key. */
(function () {
  const DURATION = 4500;
  const SAMPLES = [
    { title: "Run finished", track: "Planner", detail: "12 steps, 0:41", hue: "purple" },
    { title: "Approval needed", track: "Coder", detail: "npm install zod", hue: "orange" },
    { title: "Deploy ready", track: "Reviewer", detail: "preview-42, main", hue: "green" },
    { title: "Tool call failed", track: "Researcher", detail: "fetch timed out, 30 s", hue: "blue", fail: true },
  ];
  const X = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>';

  FlatPlayer.register({
    slug: "toast-stack",
    title: "Toast Stack",
    tagline: "An agent console's activity: the newest shows, the rest cut in when you look.",
    css: `
.fs-toast-stack .rk { width: min(100%, 400px); background: var(--body); border-radius: var(--r-panel); padding: 3px; display: grid; gap: 3px; font-family: var(--font); user-select: none; -webkit-user-select: none }
.fs-toast-stack .rk-panel { background: var(--panel); border-radius: var(--r-panel); overflow: hidden }
.fs-toast-stack .rk-strip { display: flex; align-items: center; gap: 6px; padding: 4px 4px 4px 8px; background: var(--panel-2); min-height: 30px }
.fs-toast-stack .rk-name { font-size: 12px; font-weight: 600; color: var(--ink); margin-right: auto }
.fs-toast-stack .rk-box { height: 22px; min-width: 22px; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 500 11px/1 var(--mono); font-variant-numeric: tabular-nums; color: var(--ink) }
.fs-toast-stack .rk-key { all: unset; box-sizing: border-box; display: grid; place-items: center; height: 22px; min-width: 22px; padding: 0 8px; border-radius: var(--r-control); background: var(--block);
  box-shadow: var(--edge); font: 500 11px/1 var(--font); color: var(--ink); cursor: pointer; transition: background-color var(--cut-in) var(--ease-out) }
.fs-toast-stack .rk-key:hover { background: var(--block-hover) }
.fs-toast-stack .rk-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-toast-stack .rk-key.is-pressed { box-shadow: var(--edge-press); background: var(--block-hover) }
.fs-toast-stack .rk-key:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px }
.fs-toast-stack .rk-key svg { width: 10px; height: 10px }
.fs-toast-stack .rk-key.is-x { padding: 0 }
.fs-toast-stack .rk-list { margin: 0; padding: 6px; list-style: none; display: grid; gap: 3px; min-height: 58px; align-content: start }
.fs-toast-stack .rk-msg { position: relative; display: grid; grid-template-columns: 3px minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 7px 6px 9px 0;
  border-radius: var(--r-control); background: var(--panel-2); overflow: hidden; animation: ts-cut var(--cut-in) var(--ease-out) both }
@keyframes ts-cut { from { opacity: 0 } }
.fs-toast-stack .rk-msg[hidden] { display: none }
.fs-toast-stack .rk-msg.is-leaving { opacity: 0; transition: opacity var(--cut-out) var(--ease-out); animation: none }
.fs-toast-stack .rk-tab { align-self: stretch; margin: -7px 0 -9px; background: var(--c) }
.fs-toast-stack .rk-t { margin: 0; font-size: 12px; font-weight: 600; line-height: 1.25; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-toast-stack .rk-msg.is-fail .rk-t { color: var(--danger) }
.fs-toast-stack .rk-d { margin: 1px 0 0; font: 500 11px/1.25 var(--mono); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.fs-toast-stack .rk-d b { font-weight: 600; color: var(--c-text) }
.fs-toast-stack .rk-left { position: absolute; left: 3px; bottom: 0; height: 2px; width: calc(var(--left, 1) * (100% - 3px)); background: var(--c) }
.fs-toast-stack .rk-more { margin: 0; padding: 0 6px 6px 9px; font-size: 11px; color: var(--muted) }
.fs-toast-stack .rk-more:empty { display: none }
@media (prefers-reduced-motion: reduce) { .fs-toast-stack .rk-msg { animation: none } }
`,
    mount(host, ctx) {
      const S = ctx.signal, reduced = ctx.reduced();
      host.innerHTML = `
<div class="rk"><section class="rk-panel" aria-label="Activity">
  <div class="rk-strip"><span class="rk-name">Activity</span><span class="rk-box rk-count" aria-hidden="true">0</span><button type="button" class="rk-key rk-send">Run</button><button type="button" class="rk-key rk-clear">Clear</button></div>
  <ol class="rk-list" role="status" aria-live="polite"></ol>
  <p class="rk-more" aria-hidden="true"></p>
</section></div>`;
      const panel = host.querySelector("section"), list = host.querySelector(".rk-list"), more = host.querySelector(".rk-more"), count = host.querySelector(".rk-count");
      const send = host.querySelector(".rk-send"), clear = host.querySelector(".rk-clear");
      let msgs = [], next = 0, expanded = false, timersOn = !reduced, ghost = !reduced;
      const visible = () => (host.classList.contains("is-tile") || host.clientWidth < 360 ? 3 : 4);

      function render(stagger) {
        const live = msgs.filter((m) => !m.leaving);
        const shown = expanded ? Math.min(live.length, visible()) : Math.min(live.length, 1);
        live.forEach((m, i) => { // newest first in the list
          const show = i < shown, was = !m.el.hidden;
          m.el.hidden = !show;
          if (show && !was && stagger) { m.el.style.animation = "none"; void m.el.offsetWidth; m.el.style.animation = ""; m.el.style.animationDelay = `calc(${i} * var(--beat))`; }
        });
        const rest = live.length - shown;
        more.textContent = rest > 0 ? rest + " more" : "";
        count.textContent = String(live.length);
      }
      function arm(m) { if (!timersOn || expanded || m.timer || m.leaving) return; m.started = performance.now(); m.timer = ctx.after(m.remaining, () => dismiss(m)); }
      function disarm(m) { if (!m.timer) return; clearTimeout(m.timer); m.timer = 0; m.remaining = Math.max(400, m.remaining - (performance.now() - m.started)); }

      function add() {
        const s = SAMPLES[next++ % SAMPLES.length];
        const m = { s, remaining: DURATION, timer: 0, leaving: false };
        const li = document.createElement("li");
        li.className = "rk-msg" + (s.fail ? " is-fail" : "");
        li.style.setProperty("--c", `var(--clip-${s.hue})`); li.style.setProperty("--c-text", `var(--clip-${s.hue}-text)`);
        li.innerHTML = '<span class="rk-tab" aria-hidden="true"></span><div><p class="rk-t"></p><p class="rk-d"><b></b> <span></span></p></div><button type="button" class="rk-key is-x"></button><span class="rk-left" aria-hidden="true"></span>';
        li.querySelector(".rk-t").textContent = s.title;
        li.querySelector(".rk-d b").textContent = s.track;
        li.querySelector(".rk-d span").textContent = s.detail;
        const x = li.querySelector(".rk-key"); x.innerHTML = X; x.setAttribute("aria-label", "Dismiss: " + s.title);
        x.addEventListener("click", () => dismiss(m), { signal: S });
        m.el = li;
        list.prepend(li);
        msgs.unshift(m);
        render(false);
        arm(m);
      }
      function dismiss(m) {
        if (m.leaving) return;
        disarm(m); m.leaving = true;
        const hadFocus = m.el.contains(document.activeElement);
        m.el.classList.add("is-leaving");
        render(false);
        if (hadFocus) { const f = msgs.find((u) => !u.leaving); (f ? f.el.querySelector(".rk-key") : send).focus(); }
        ctx.after(reduced ? 0 : 80, () => { m.el.remove(); msgs = msgs.filter((u) => u !== m); render(false); });
      }
      function setExpanded(on) {
        if (on === expanded) return;
        expanded = on; msgs.forEach(on ? disarm : arm); render(on);
      }
      panel.addEventListener("pointerenter", () => setExpanded(true), { signal: S });
      panel.addEventListener("pointerleave", () => setExpanded(false), { signal: S });
      panel.addEventListener("focusin", () => setExpanded(true), { signal: S });
      panel.addEventListener("focusout", (e) => { if (!panel.contains(e.relatedTarget)) setExpanded(false); }, { signal: S });
      send.addEventListener("click", add, { signal: S });
      clear.addEventListener("click", () => msgs.slice().forEach(dismiss), { signal: S });

      /* Time moves the bars: each one's time left, linearly, still while the panel is looked at. */
      ctx.loop(() => {
        const now = performance.now();
        msgs.forEach((m) => { const left = m.timer ? m.remaining - (now - m.started) : m.remaining; m.el.style.setProperty("--left", Math.max(0, left / DURATION).toFixed(4)); });
      });

      /* The ghost: three arrive a beat apart, a look shows them all, then it keeps running agents until a hand arrives. */
      ctx.onHand(() => {
        if (ghost) { ghost = false; if (!panel.matches(":hover") && !panel.contains(document.activeElement)) setExpanded(false); }
        if (!timersOn) { timersOn = true; msgs.forEach(arm); }
      });
      if (reduced) { add(); add(); add(); }
      else {
        [200, 500, 800].forEach((ms) => ctx.after(ms, () => ghost && add()));
        const press = () => { send.classList.add("is-pressed"); ctx.after(90, () => send.classList.remove("is-pressed")); add(); };
        ctx.after(1700, () => ghost && setExpanded(true));
        ctx.after(3300, () => { if (!ghost) return; setExpanded(false); ctx.every(2600, () => ghost && press()); });
      }
    },
  });
})();
