/* Copy Button, after litterthanlit/components (copy-button.tsx), redesigned in Rack.
 * An install device: its title strip names the part and its version. A chooser picks the package manager (the chosen
 * key lit in the ink), and under it two value boxes you copy from, the install command and the registry address, each
 * with a square copy key. The part being added is the one thing you're bringing in, so its name wears a clip colour
 * wherever it shows. A copy answers on the frame: the key's glyph cuts to a check, the copied text is selected in the
 * box, and "Copied" cuts into the title strip, all for 1.8s, then cut back. Nothing travels or scrambles. Untouched,
 * a ghost copies the command (nothing reaches the clipboard), then picks the next manager and copies again, until a
 * hand arrives. Under reduced motion nothing runs by itself. */
(function () {
  const HOLD = 1800; // ms a copy stays marked
  const PART = "copy-button";
  const MANAGERS = [
    { id: "npm", run: "npx shadcn add" },
    { id: "pnpm", run: "pnpm dlx shadcn add" },
    { id: "yarn", run: "yarn dlx shadcn add" },
    { id: "bun", run: "bunx --bun shadcn add" },
  ];
  const REGISTRY = "littmd.vercel.app/r/";
  let uid = 0;

  const css = `
.fs-copy-button [hidden] { display: none !important; }
.fs-copy-button .cb { width: min(100%, 480px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px;
  -webkit-user-select: none; user-select: none; }
.fs-copy-button .cb-strip { display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 10px; background: var(--panel-2); }
.fs-copy-button .cb-title { font-weight: 600; }
.fs-copy-button .cb-part { font-family: var(--mono); font-size: 11px; font-weight: 600; color: var(--clip-blue-text); }
.fs-copy-button .cb-ver { margin-left: auto; font-family: var(--mono); font-size: 11px; color: var(--muted); }
.fs-copy-button .cb-done { margin-left: auto; font-weight: 600; color: var(--success); animation: fs-cb-cut var(--cut-in) var(--ease-out); }
.fs-copy-button .cb-body { padding: 8px; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 6px 8px; align-items: center; }
.fs-copy-button .cb-label { color: var(--muted); font-size: 11px; white-space: nowrap; }
.fs-copy-button .cb-seg { display: flex; gap: 0; }
.fs-copy-button .cb-seg button { flex: 1 1 0; min-width: 0; height: 24px; padding: 0 6px; border: 0; border-radius: 0; background: var(--block);
  box-shadow: var(--edge); color: var(--ink); font: 500 11px var(--mono); cursor: pointer; margin-left: 1px;
  transition: none; }
.fs-copy-button .cb-seg button:first-child { margin-left: 0; border-radius: var(--r-control) 0 0 var(--r-control); }
.fs-copy-button .cb-seg button:last-child { border-radius: 0 var(--r-control) var(--r-control) 0; }
.fs-copy-button .cb-seg button:hover { background: var(--block-hover); }
.fs-copy-button .cb-seg button[aria-checked="true"] { background: var(--ink); color: var(--panel); }
.fs-copy-button .cb-field { display: flex; gap: 4px; min-width: 0; }
.fs-copy-button .cb-box { flex: 1; min-width: 0; height: 26px; display: flex; align-items: center; padding: 0 7px; border-radius: var(--r-control);
  background: var(--cut); box-shadow: var(--edge); font-family: var(--mono); font-size: clamp(10px, 3.1cqw, 12px); font-weight: 500;
  white-space: nowrap; overflow: hidden; }
.fs-copy-button .cb-box span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.fs-copy-button .cb-box mark { background: transparent; color: inherit; }
.fs-copy-button .cb-box.is-copied mark { background: var(--accent-tint); }
.fs-copy-button .cb-box .cb-name { color: var(--clip-blue-text); font-weight: 600; }
.fs-copy-button .cb-box .cb-dim { color: var(--muted); }
.fs-copy-button .cb-key { flex: none; width: 28px; height: 26px; border: 0; padding: 0; border-radius: var(--r-control); background: var(--block);
  box-shadow: var(--edge); color: var(--ink); cursor: pointer; display: grid; place-items: center;
  transition: background-color var(--cut-in) var(--ease-out); -webkit-tap-highlight-color: transparent; }
.fs-copy-button .cb-key:hover { background: var(--block-hover); }
.fs-copy-button .cb-key:active, .fs-copy-button .cb-key[data-pressed] { box-shadow: var(--edge-press); background: var(--block-hover); transform: scale(0.98); }
.fs-copy-button .cb-key svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
@keyframes fs-cb-cut { from { opacity: 0; } }
@container (max-width: 380px) { .fs-copy-button .cb-body { grid-template-columns: minmax(0, 1fr); gap: 4px; } .fs-copy-button .cb-label { margin-top: 2px; } }
`;

  const COPY = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1"/><path d="M10.5 3.5V2.5h-8v8h1"/></svg>';
  const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.5 3.2 3L13 4.5"/></svg>';

  function mount(host, ctx) {
    const { signal } = ctx;
    const id = "fs-cb-" + ++uid;
    host.innerHTML = `
      <div class="cb">
        <div class="cb-strip"><span class="cb-title">Install</span><span class="cb-part">${PART}</span>
          <span class="cb-ver">v1.4.2</span><span class="cb-done" hidden>Copied</span></div>
        <div class="cb-body">
          <span class="cb-label" id="${id}-pm">Package manager</span>
          <div class="cb-seg" role="radiogroup" aria-labelledby="${id}-pm"></div>
          <span class="cb-label" id="${id}-cmd">Command</span>
          <div class="cb-field"><code class="cb-box" data-k="cmd"></code><button type="button" class="cb-key" data-k="cmd" aria-label="Copy command">${COPY}</button></div>
          <span class="cb-label" id="${id}-reg">Registry</span>
          <div class="cb-field"><code class="cb-box" data-k="reg"></code><button type="button" class="cb-key" data-k="reg" aria-label="Copy registry address">${COPY}</button></div>
        </div>
        <span class="sr-only" role="status" aria-live="polite"></span>
      </div>`;
    const $ = (s) => host.querySelector(s);
    const seg = $(".cb-seg"), ver = $(".cb-ver"), doneEl = $(".cb-done"), status = $("[role=status]");
    const boxes = { cmd: $('.cb-box[data-k="cmd"]'), reg: $('.cb-box[data-k="reg"]') };
    const keys = { cmd: $('.cb-key[data-k="cmd"]'), reg: $('.cb-key[data-k="reg"]') };

    let pm = 0;
    const value = (k) => (k === "cmd" ? `${MANAGERS[pm].run} ${PART}` : `https://${REGISTRY}${PART}.json`);
    function paintBoxes() {
      boxes.cmd.innerHTML = `<span><mark><span class="cb-dim"></span> <span class="cb-name"></span></mark></span>`;
      boxes.cmd.querySelector(".cb-dim").textContent = MANAGERS[pm].run;
      boxes.cmd.querySelector(".cb-name").textContent = PART;
      boxes.reg.innerHTML = `<span><mark><span class="cb-dim"></span><span class="cb-name"></span><span class="cb-dim">.json</span></mark></span>`;
      boxes.reg.querySelector(".cb-dim").textContent = REGISTRY;
      boxes.reg.querySelector(".cb-name").textContent = PART;
    }

    /* The chooser: one tab stop, arrows move and choose, as a radiogroup does. */
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
      if (copied === "cmd") unmark();
      paintBoxes();
    }
    seg.addEventListener("keydown", (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (e.key === "Home" || e.key === "End") { e.preventDefault(); choose(e.key === "Home" ? 0 : MANAGERS.length - 1, true); return; }
      if (!d) return;
      e.preventDefault();
      choose(pm + d, true);
    }, { signal });

    /* --- Copy: everything answers on the frame, and cuts back after the hold. --- */
    let copied = null, timer = 0;
    function unmark() {
      clearTimeout(timer);
      for (const k of ["cmd", "reg"]) {
        boxes[k].classList.remove("is-copied");
        keys[k].innerHTML = COPY;
        keys[k].setAttribute("aria-label", k === "cmd" ? "Copy command" : "Copy registry address");
      }
      doneEl.hidden = true;
      ver.hidden = false;
      copied = null;
    }
    function mark(k, real) {
      unmark();
      copied = k;
      boxes[k].classList.add("is-copied");
      keys[k].innerHTML = CHECK;
      keys[k].setAttribute("aria-label", "Copied");
      doneEl.textContent = k === "cmd" ? "Command copied" : "Address copied";
      ver.hidden = true;
      doneEl.hidden = false;
      status.textContent = real ? doneEl.textContent : ""; // a rehearsal copies nothing, so it says nothing
      timer = setTimeout(() => { if (!signal.aborted) { unmark(); status.textContent = ""; } }, HOLD);
    }
    async function copy(k) {
      const text = value(k);
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
        keys[k].focus({ preventScroll: true });
      }
      if (ok && !signal.aborted) { status.textContent = ""; mark(k, true); }
    }
    keys.cmd.addEventListener("click", () => copy("cmd"), { signal });
    keys.reg.addEventListener("click", () => copy("reg"), { signal });

    choose(0);

    /* --- The ghost: copy, pick the next manager, copy again. A hand ends it for good. --- */
    let ghost = !ctx.reduced();
    ctx.onHand(() => { ghost = false; Object.values(keys).forEach((b) => b.removeAttribute("data-pressed")); });
    const press = (k) => {
      if (!ghost) return;
      keys[k].setAttribute("data-pressed", "");
      ctx.after(110, () => { keys[k].removeAttribute("data-pressed"); if (ghost) mark(k, false); });
    };
    let n = 0;
    const cycle = () => {
      if (!ghost) return;
      if (n > 0) choose(pm + 1);
      ctx.after(500, () => press(n % 3 === 2 ? "reg" : "cmd"));
      n += 1;
      ctx.after(3000, cycle);
    };
    if (ghost) ctx.after(0, cycle);

    return { destroy() { clearTimeout(timer); ghost = false; } };
  }

  FlatPlayer.register({
    slug: "copy-button",
    title: "Copy Button",
    tagline: "An install device: pick the manager, copy the command, on the frame.",
    css,
    mount,
  });
})();
