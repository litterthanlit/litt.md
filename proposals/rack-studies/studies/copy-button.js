/* Copy Button, after litterthanlit/components (copy-button.tsx), in Rack 2.0.
 * One strip and one surface. The strip names it and holds the package manager chooser (the chosen key lit in the
 * ink). The surface is the command itself, large in the mono on a light cut, with the part you're adding drawn as
 * the one coloured object in it (Button's cyan: a soft tint, a 1px edge in the hue, its name in the hue's text tone),
 * and the square copy key at its end. A copy answers in place, on the frame: the key's glyph cuts to a check, the
 * command is selected, and "Copied" cuts in beside the key; after 1.8s it all cuts back. Untouched, a ghost copies
 * (nothing reaches the clipboard), picks the next manager and copies again, until a hand arrives. Under reduced
 * motion nothing runs by itself. */
(function () {
  const HOLD = 1800; // ms a copy stays marked
  const PART = "button";
  const MANAGERS = [
    { id: "npm", run: "npx shadcn add" },
    { id: "pnpm", run: "pnpm dlx shadcn add" },
    { id: "yarn", run: "yarn dlx shadcn add" },
    { id: "bun", run: "bunx shadcn add" },
  ];
  let uid = 0;

  const css = `
.fs-copy-button [hidden] { display: none !important; }
.fs-copy-button .cb { width: min(100%, 500px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px;
  -webkit-user-select: none; user-select: none; }
.fs-copy-button .cb-strip { display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 6px 0 14px; background: var(--panel-2); }
.fs-copy-button .cb-strip > b { font-weight: 600; margin-right: auto; }
.fs-copy-button .cb-seg { display: flex; }
.fs-copy-button .cb-seg button { height: 22px; padding: 0 8px; border: 0; border-radius: 0; background: var(--block); box-shadow: var(--edge);
  color: var(--ink); font: 600 11px var(--mono); cursor: pointer; margin-left: 1px;
  transition: none; }
.fs-copy-button .cb-seg button:first-child { margin-left: 0; border-radius: var(--r-control) 0 0 var(--r-control); }
.fs-copy-button .cb-seg button:last-child { border-radius: 0 var(--r-control) var(--r-control) 0; }
.fs-copy-button .cb-seg button:hover { background: var(--block-hover); }
.fs-copy-button .cb-seg button[aria-checked="true"] { background: var(--ink); color: var(--panel); }
.fs-copy-button .cb-surface { margin: 14px; display: flex; align-items: center; gap: 10px; min-height: 64px; padding: 0 10px 0 14px;
  border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge); }
.fs-copy-button code { flex: 1; min-width: 0; display: flex; align-items: center; gap: 0.5em; font: 500 clamp(12px, 3.6cqw, 15px)/1 var(--mono);
  white-space: nowrap; overflow: hidden; }
.fs-copy-button .cb-run { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--muted); padding: 4px 2px; border-radius: var(--r-control); }
.fs-copy-button .cb-part { flex: none; padding: 5px 7px; border-radius: var(--r-control); background: var(--clip-cyan-tint);
  box-shadow: inset 0 0 0 1px var(--clip-cyan); color: var(--clip-cyan-text); font-weight: 600; }
.fs-copy-button .is-copied .cb-run { background: var(--accent-tint); color: var(--ink); }
.fs-copy-button .is-copied .cb-part { box-shadow: inset 0 0 0 2px var(--clip-cyan); }
.fs-copy-button .cb-done { flex: none; font-weight: 600; color: var(--success); animation: fs-cb-cut var(--cut-in) var(--ease-out); }
.fs-copy-button .cb-key { flex: none; width: 32px; height: 32px; border: 0; padding: 0; border-radius: var(--r-control); background: var(--block);
  box-shadow: var(--edge); color: var(--ink); cursor: pointer; display: grid; place-items: center;
  transition: background-color var(--cut-in) var(--ease-out); -webkit-tap-highlight-color: transparent; }
.fs-copy-button .cb-key:hover { background: var(--block-hover); }
.fs-copy-button .cb-key:active, .fs-copy-button .cb-key[data-pressed] { box-shadow: var(--edge-press); background: var(--block-hover); transform: scale(0.98); }
.fs-copy-button .cb-key svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
@keyframes fs-cb-cut { from { opacity: 0; } }
@container (max-width: 380px) {
  .fs-copy-button .cb-strip > b { display: none; }
  .fs-copy-button .cb-seg { flex: 1; } .fs-copy-button .cb-seg button { flex: 1; }
  .fs-copy-button .cb-done { display: none; }
}
`;

  const COPY = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1"/><path d="M10.5 3.5V2.5h-8v8h1"/></svg>';
  const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.5 3.2 3L13 4.5"/></svg>';

  function mount(host, ctx) {
    const { signal } = ctx;
    const id = "fs-cb-" + ++uid;
    host.innerHTML = `
      <div class="cb">
        <div class="cb-strip"><b id="${id}-t">Install</b><div class="cb-seg" role="radiogroup" aria-label="Package manager"></div></div>
        <div class="cb-surface">
          <code aria-labelledby="${id}-t"><span class="cb-run"></span><span class="cb-part">${PART}</span></code>
          <span class="cb-done" aria-hidden="true" hidden>Copied</span>
          <button type="button" class="cb-key" aria-label="Copy command">${COPY}</button>
        </div>
        <span class="sr-only" role="status" aria-live="polite"></span>
      </div>`;
    const $ = (s) => host.querySelector(s);
    const seg = $(".cb-seg"), surface = $(".cb-surface"), runEl = $(".cb-run"), doneEl = $(".cb-done"), key = $(".cb-key"), status = $("[role=status]");

    let pm = 0, timer = 0, copied = false;
    const value = () => `${MANAGERS[pm].run} ${PART}`;

    /* The chooser: one tab stop; the arrows move and choose, as a radiogroup does. */
    const opts = MANAGERS.map((m, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.textContent = m.id;
      b.addEventListener("click", () => choose(i), { signal });
      seg.appendChild(b);
      return b;
    });
    function choose(i, focus) {
      pm = (i + MANAGERS.length) % MANAGERS.length;
      opts.forEach((b, j) => { b.setAttribute("aria-checked", String(j === pm)); b.tabIndex = j === pm ? 0 : -1; });
      if (focus) opts[pm].focus({ preventScroll: true });
      if (copied) unmark();
      runEl.textContent = MANAGERS[pm].run;
    }
    seg.addEventListener("keydown", (e) => {
      if (e.key === "Home" || e.key === "End") { e.preventDefault(); choose(e.key === "Home" ? 0 : MANAGERS.length - 1, true); return; }
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      choose(pm + d, true);
    }, { signal });

    /* --- Copy: it answers in place, on the frame, and cuts back after the hold. --- */
    function unmark() {
      clearTimeout(timer);
      copied = false;
      surface.classList.remove("is-copied");
      key.innerHTML = COPY;
      key.setAttribute("aria-label", "Copy command");
      doneEl.hidden = true;
    }
    function mark(real) {
      unmark();
      copied = true;
      surface.classList.add("is-copied");
      key.innerHTML = CHECK;
      key.setAttribute("aria-label", "Copied");
      doneEl.hidden = false;
      status.textContent = real ? "Copied" : ""; // a rehearsal copies nothing, so it says nothing
      timer = setTimeout(() => { if (!signal.aborted) { unmark(); status.textContent = ""; } }, HOLD);
    }
    async function copy() {
      const text = value();
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        host.appendChild(ta);
        ta.select();
        try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
        ta.remove();
        key.focus({ preventScroll: true });
      }
      if (ok && !signal.aborted) { status.textContent = ""; mark(true); }
    }
    key.addEventListener("click", copy, { signal });

    choose(0);

    /* --- The ghost: copy, pick the next manager, copy again. A hand ends it for good. --- */
    let ghost = !ctx.reduced();
    ctx.onHand(() => { ghost = false; key.removeAttribute("data-pressed"); });
    let n = 0;
    const cycle = () => {
      if (!ghost) return;
      if (n++ > 0) choose(pm + 1);
      ctx.after(500, () => {
        if (!ghost) return;
        key.setAttribute("data-pressed", "");
        ctx.after(110, () => { key.removeAttribute("data-pressed"); if (ghost) mark(false); });
      });
      ctx.after(3000, cycle);
    };
    if (ghost) ctx.after(0, cycle);

    return { destroy() { clearTimeout(timer); ghost = false; } };
  }

  FlatPlayer.register({
    slug: "copy-button",
    title: "Copy Button",
    tagline: "Pick the manager, copy the command: it answers on the frame.",
    css,
    mount,
  });
})();
