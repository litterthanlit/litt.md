/* Copy Button, after litterthanlit/components (copy-button.tsx), redesigned in Flat.
 * The install command in a white pill on the ground, with the ink circle that copies it at its end. A press comes up
 * with a check that draws itself, and the line swaps in Flat's way: the command leaves upward with no bounce, and
 * "Copied to clipboard" rises into its place on the expressive spring. After a beat they swap back the same way, the
 * command arriving with the bounce. One thing moves at a time. Untouched, the key rehearses once (nothing is copied).
 * Under reduced motion the line swaps at once. */
(function () {
  const HOLD = 1800; // ms the check stays before the command comes back
  const COMMAND = "npx shadcn add copy-button";

  const css = `
.fs-copy-button .cb { position: relative; width: min(100%, 440px); height: 60px; display: flex; align-items: center; gap: 12px;
  padding: 0 8px 0 24px; border-radius: var(--r-pill); background: var(--paper); -webkit-user-select: none; user-select: none; }
.fs-copy-button .cb-line { position: relative; flex: 1; min-width: 0; height: 100%; display: grid; align-items: center; font-size: 15px;
  white-space: nowrap; overflow: hidden; }
.fs-copy-button .cb-layer { grid-area: 1 / 1; display: flex; align-items: center; gap: 0.6em; min-width: 0; will-change: transform, opacity; }
.fs-copy-button .cb-cmd { font-family: var(--mono); }
.fs-copy-button .cb-done { font-weight: 500; color: var(--ink); opacity: 0; }
.fs-copy-button .cb-prompt { color: var(--muted); }
.fs-copy-button code { font: inherit; color: var(--ink); min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.fs-copy-button .cb-key { position: relative; flex: none; width: 44px; height: 44px; border: 0; border-radius: 50%; padding: 0;
  background: var(--ink); color: var(--on-ink); cursor: pointer; display: grid; place-items: center;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1); -webkit-tap-highlight-color: transparent; }
.fs-copy-button .cb-key:active, .fs-copy-button .cb-key[data-pressed] { transform: scale(0.9); transition-duration: 75ms; }
.fs-copy-button .cb-key svg { position: absolute; inset: 0; margin: auto; width: 18px; height: 18px; fill: none; stroke: currentColor;
  transition: opacity 210ms cubic-bezier(0.23, 1, 0.32, 1), transform 210ms cubic-bezier(0.23, 1, 0.32, 1); }
.fs-copy-button .cb-key svg.is-off { opacity: 0; transform: scale(0.8); }
.fs-copy-button .cb-tick path { transition: stroke-dashoffset 350ms cubic-bezier(0.23, 1, 0.32, 1) 60ms; }
@container (max-width: 380px) {
  .fs-copy-button .cb { height: 52px; padding-left: 18px; gap: 8px; }
  .fs-copy-button .cb-line { font-size: clamp(11px, 3.6cqw, 13px); }
  .fs-copy-button .cb-key { width: 40px; height: 40px; }
  }
@container (min-width: 600px) {
  .fs-copy-button .cb { height: 64px; }
  .fs-copy-button .cb-line { font-size: 16px; }
  .fs-copy-button .cb-key { width: 48px; height: 48px; }
  }
@media (prefers-reduced-motion: reduce) { .fs-copy-button .cb-key svg, .fs-copy-button .cb-tick path { transition: none; } }
`;

  function mount(host, ctx) {
    const { signal } = ctx;
    host.innerHTML = `
      <div class="cb">
        <div class="cb-line"><span class="cb-layer cb-cmd"><span class="cb-prompt" aria-hidden="true">$</span><code></code></span><span class="cb-layer cb-done" aria-hidden="true">Copied to clipboard</span></div>
        <button type="button" class="cb-key" aria-label="Copy command">
          <svg class="cb-copy" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="5.5" y="5.5" width="8" height="8" rx="2" stroke-width="1.5"/>
            <path d="M10.5 3.5v-.25A1.75 1.75 0 0 0 8.75 1.5h-5.5A1.75 1.75 0 0 0 1.5 3.25v5.5c0 .97.78 1.75 1.75 1.75h.25" stroke-width="1.5"/>
          </svg>
          <svg class="cb-tick is-off" viewBox="0 0 16 16" aria-hidden="true">
            <path d="m3 8.5 3.2 3L13 4.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
          </svg>
        </button>
        <span class="sr-only" role="status" aria-live="polite"></span>
      </div>`;
    const key = host.querySelector(".cb-key");
    const copyIcon = host.querySelector(".cb-copy");
    const tickIcon = host.querySelector(".cb-tick");
    const tickPath = tickIcon.querySelector("path");
    const status = host.querySelector("[role=status]");
    host.querySelector("code").textContent = COMMAND;

    /* The swap: each layer has a shown value (0 gone, 1 here). Arriving rides the expressive spring (0.28); leaving is
       critically damped and quicker, so an exit never bounces. A second press mid-swap turns it round from where it is. */
    const cmd = host.querySelector(".cb-cmd"), done = host.querySelector(".cb-done");
    const paint = (el, dir) => (v) => {
      el.style.opacity = String(Math.max(0, Math.min(1, v)));
      el.style.transform = `translateY(${((1 - v) * 14 * dir).toFixed(2)}px)`;
    };
    const layers = [
      { el: cmd, v: 1, s: null },
      { el: done, v: 0, s: null },
    ];
    function show(layer, on, dir) {
      if (layer.s) layer.s.stop();
      const draw = paint(layer.el, dir);
      layer.s = ctx.spring(layer.v, (v) => { layer.v = v; draw(v); }, on ? { duration: 0.35, bounce: 0.28 } : { duration: 0.2, bounce: 0 });
      layer.s.set(on ? 1 : 0);
    }
    function swap(copied) {
      // the command goes up and out; "Copied" comes up from below. Coming back, it's the other way round.
      show(layers[0], !copied, copied ? -1 : 1);
      show(layers[1], copied, copied ? 1 : -1);
    }

    /* --- The key. --- */
    let timer = 0;
    function setCopied(on) {
      copyIcon.classList.toggle("is-off", on);
      tickIcon.classList.toggle("is-off", !on);
      tickPath.setAttribute("stroke-dashoffset", on ? "0" : "1");
      key.setAttribute("aria-label", on ? "Copied" : "Copy command");
      swap(on);
    }
    function check(real) {
      setCopied(true);
      status.textContent = real ? "Copied" : ""; // a rehearsal copies nothing, so it says nothing
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (signal.aborted) return;
        setCopied(false);
        status.textContent = "";
      }, HOLD);
    }
    async function copy() {
      let ok = false;
      try {
        await navigator.clipboard.writeText(COMMAND);
        ok = true;
      } catch (e) {
        // No async clipboard here (a file, an old browser): the old way.
        const ta = document.createElement("textarea");
        ta.value = COMMAND;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        host.appendChild(ta);
        ta.select();
        try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
        ta.remove();
        key.focus({ preventScroll: true });
      }
      if (ok && !signal.aborted) {
        status.textContent = "";
        check(true);
      }
    }
    key.addEventListener("click", copy, { signal });

    /* --- Rehearsal: after a beat the key goes down for 110ms and comes up checked. Once; a hand ends it. --- */
    let touched = false;
    ctx.onHand(() => { touched = true; key.removeAttribute("data-pressed"); });
    if (!ctx.reduced()) {
      ctx.after(400, () => { if (!touched) key.setAttribute("data-pressed", ""); });
      ctx.after(510, () => {
        key.removeAttribute("data-pressed");
        if (!touched) check(false);
      });
    }

    return { destroy() { clearTimeout(timer); layers.forEach((l) => l.s && l.s.stop()); } };
  }

  FlatPlayer.register({
    slug: "copy-button",
    title: "Copy Button",
    tagline: "Copy, and the line says so.",
    css,
    mount,
  });
})();
