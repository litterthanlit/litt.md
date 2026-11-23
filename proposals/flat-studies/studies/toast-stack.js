/* Toast Stack, after litterthanlit/components, redesigned for Flat (round 2).
   The product underneath is a site's notifications: what happened while you were writing. Already close to Flat in
   round 1, so this round takes away rather than adds. Toasts are paper that floats (the only thing that casts), with
   a title and one line, no accent dot; the newest in front, older ones tucked 12px behind and scaled down; hover or
   focus fans them out at their real heights and pauses every timer. Each toast grows out of the Send pill that made
   it on the expressive spring and leaves without a bounce. Send is the one ink pill; dismiss is a circle. */
(function () {
  const GAP = 10, PEEK = 12, DURATION = 4500;
  const SPRING = "linear(0, 0.0897, 0.2671, 0.4643, 0.6434, 0.7874, 0.8925, 0.9624, 1.004, 1.0249, 1.0322, 1.0295, 1.0237, 1.0173, 1.0115, 1.0068, 1.0034, 1.0012, 0.9998, 0.9992, 1)";
  const SAMPLES = [
    { title: "Post published", body: "“Notes on grey” is live on your site." },
    { title: "New reader", body: "Ada subscribed to your letters." },
    { title: "Issue 12 sent", body: "On its way to 1,204 readers." },
    { title: "New comment", body: "“Love the easing on this one.”" },
  ];
  const X = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 4.5 7 7m0-7-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>';

  FlatPlayer.register({
    slug: "toast-stack",
    title: "Toast Stack",
    tagline: "Notifications that tuck away and fan out when you look.",
    css: `
.fs-toast-stack .ts { width: min(100%, 360px); height: 300px; display: flex; flex-direction: column; align-items: center; gap: 20px; font-family: var(--font) }
.fs-toast-stack .ts-send { all: unset; box-sizing: border-box; flex: none; height: 40px; padding: 0 18px; border-radius: var(--r-pill); background: var(--ink); color: var(--on-ink);
  font-size: 14px; font-weight: 500; cursor: pointer; transition: transform 150ms ease-out; -webkit-tap-highlight-color: transparent }
.fs-toast-stack .ts-send:active, .fs-toast-stack .ts-send.is-pressed { transform: scale(0.97); transition-duration: 75ms }
.fs-toast-stack .ts-send:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px }
.fs-toast-stack.is-tile .ts { height: 236px; gap: 16px }
.fs-toast-stack section { position: relative; width: 100% }
.fs-toast-stack ol { position: relative; margin: 0; padding: 0; list-style: none; transition: height 250ms cubic-bezier(0.23, 1, 0.32, 1) }
.fs-toast-stack li { position: absolute; left: 0; right: 0; top: 0; transform-origin: top center; overflow: hidden; border-radius: var(--r-paper);
  background: var(--paper); box-shadow: var(--float); opacity: 0; transform: translateY(-46px) scale(0.55);
  transition: transform 580ms ${SPRING}, opacity 210ms cubic-bezier(0.23, 1, 0.32, 1), height 250ms cubic-bezier(0.23, 1, 0.32, 1) }
.fs-toast-stack li.is-leaving { transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1), opacity 150ms cubic-bezier(0.23, 1, 0.32, 1); pointer-events: none }
.fs-toast-stack .ts-in { display: flex; align-items: flex-start; gap: 10px; padding: 13px 10px 13px 16px }
.fs-toast-stack .ts-text { flex: 1; min-width: 0 }
.fs-toast-stack .ts-title { margin: 0; font-size: 14px; font-weight: 500; line-height: 1.35; color: var(--ink) }
.fs-toast-stack .ts-body { margin: 1px 0 0; font-size: 13px; line-height: 1.35; color: var(--muted) }
.fs-toast-stack .ts-x { all: unset; box-sizing: border-box; flex: none; width: 28px; height: 28px; margin-top: -2px; border-radius: 50%; display: grid; place-items: center;
  color: var(--muted); cursor: pointer; transition: background-color 150ms ease-out, color 150ms ease-out }
.fs-toast-stack .ts-x svg { width: 15px; height: 15px }
.fs-toast-stack .ts-x:hover { background: var(--bubble); color: var(--ink); transition-duration: 210ms }
.fs-toast-stack .ts-x:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px }
@media (prefers-reduced-motion: reduce) { .fs-toast-stack li, .fs-toast-stack ol, .fs-toast-stack li.is-leaving { transition: none } }
`,
    mount(host, ctx) {
      const S = ctx.signal, reduced = ctx.reduced();
      host.innerHTML = `
<div class="ts">
  <button type="button" class="ts-send">Send notification</button>
  <section aria-label="Notifications"><ol role="status" aria-live="polite"></ol></section>
</div>`;
      const send = host.querySelector(".ts-send"), section = host.querySelector("section"), ol = host.querySelector("ol");
      let toasts = [], next = 0, expanded = false, visible = 3, timersOn = !reduced, ghost = !reduced;

      /* Each toast's timer runs only while the stack is collapsed, and keeps what it had left. */
      function arm(t) {
        if (!timersOn || expanded || t.timer || t.leaving) return;
        t.started = performance.now();
        t.timer = ctx.after(t.remaining, () => dismiss(t));
      }
      function disarm(t) {
        if (!t.timer) return;
        clearTimeout(t.timer); t.timer = 0;
        t.remaining = Math.max(400, t.remaining - (performance.now() - t.started));
      }

      function layout() {
        const ordered = toasts.filter((t) => !t.leaving).reverse(); // newest first
        ordered.forEach((t) => { t.h = t.inner.offsetHeight; });
        const front = ordered[0] ? ordered[0].h : 0;
        const exp = ordered.slice(0, visible).reduce((s, t, i) => s + t.h + (i ? GAP : 0), 0);
        const col = front + PEEK * Math.max(0, Math.min(ordered.length, visible) - 1);
        ol.style.height = (expanded ? exp : col) + "px";
        let offset = 0;
        ordered.forEach((t, i) => {
          const hidden = i >= visible, y = expanded ? offset : i * PEEK, scale = expanded ? 1 : 1 - i * 0.05;
          offset += t.h + GAP;
          Object.assign(t.el.style, { transform: `translateY(${y}px) scale(${scale})`, opacity: hidden ? "0" : "1", zIndex: String(100 - i),
            pointerEvents: hidden ? "none" : "auto", height: (expanded || i === 0 ? t.h : front) + "px" });
          t.el.inert = hidden;
        });
      }

      function add() {
        const s = SAMPLES[next % SAMPLES.length];
        const t = { id: next++, ...s, remaining: DURATION, timer: 0, leaving: false };
        const li = document.createElement("li");
        li.innerHTML = '<div class="ts-in"><div class="ts-text"><p class="ts-title"></p><p class="ts-body"></p></div><button type="button" class="ts-x"></button></div>';
        li.querySelector(".ts-title").textContent = s.title;
        li.querySelector(".ts-body").textContent = s.body;
        const x = li.querySelector(".ts-x");
        x.innerHTML = X; x.setAttribute("aria-label", "Dismiss: " + s.title);
        x.addEventListener("click", () => dismiss(t), { signal: S });
        t.el = li; t.inner = li.firstChild;
        ol.appendChild(li);
        toasts.push(t);
        if (reduced) { layout(); } else { li.getBoundingClientRect(); requestAnimationFrame(() => { if (!S.aborted) layout(); }); }
        arm(t);
      }

      function dismiss(t) {
        if (t.leaving) return;
        disarm(t); t.leaving = true;
        const hadFocus = t.el.contains(document.activeElement);
        t.el.classList.add("is-leaving");
        t.el.style.opacity = "0";
        t.el.style.transform += " translateY(-8px) scale(0.96)";
        layout();
        if (hadFocus) { const front = toasts.filter((u) => !u.leaving).pop(); (front ? front.el.querySelector(".ts-x") : send).focus(); }
        ctx.after(reduced ? 0 : 160, () => { t.el.remove(); toasts = toasts.filter((u) => u !== t); });
      }

      function setExpanded(on) {
        if (on === expanded) return;
        expanded = on;
        toasts.forEach(on ? disarm : arm);
        layout();
      }
      section.addEventListener("pointerenter", () => setExpanded(true), { signal: S });
      section.addEventListener("pointerleave", () => setExpanded(false), { signal: S });
      section.addEventListener("focusin", () => setExpanded(true), { signal: S });
      section.addEventListener("focusout", (e) => { if (!section.contains(e.relatedTarget)) setExpanded(false); }, { signal: S });
      send.addEventListener("click", add, { signal: S });

      /* Narrow stages are short too: they fan out two toasts instead of three. */
      const ro = new ResizeObserver(([e]) => { const v = e.contentRect.width < 448 ? 2 : 3; if (v !== visible) { visible = v; layout(); } });
      ro.observe(host);
      visible = host.clientWidth < 448 ? 2 : 3;

      /* The self-run: three arrive, a ghost hand fans them out, then it keeps sending until a real hand arrives. */
      ctx.onHand(() => {
        if (ghost) { ghost = false; if (!section.matches(":hover") && !section.contains(document.activeElement)) setExpanded(false); }
        if (!timersOn) { timersOn = true; toasts.forEach(arm); }
      });
      [300, 700, 1100].forEach((ms) => (reduced ? add() : ctx.after(ms, () => ghost && add())));
      if (!reduced) {
        const press = () => { send.classList.add("is-pressed"); ctx.after(110, () => send.classList.remove("is-pressed")); add(); };
        ctx.after(1900, () => ghost && setExpanded(true));
        ctx.after(3300, () => { if (!ghost) return; setExpanded(false);
          ctx.every(2600, () => ghost && press()); });
      }
      return { destroy() { ro.disconnect(); } };
    },
  });
})();
