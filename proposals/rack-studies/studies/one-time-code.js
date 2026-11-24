/* One-Time Code, after litterthanlit/components, Rack 2.0: approving the Deploy agent to push to main. One surface:
   the request (Deploy, orange: tint, 1px edge, name in its text tone) over six value boxes, one real input laid over
   them, so paste ("482-913" lands as 482913), autofill and native selection work. The code's window counts down in
   the strip's one value box (only time moves). A right code fills the boxes with Deploy's orange, a column at a
   time, a tick apart; a wrong one turns every line red on the frame. Nothing shakes, blinks or travels. */
(function () {
  const S = ".fs-one-time-code";
  const LENGTH = 6, WINDOW = 30;
  const ROUNDS = [{ sent: "482913" }, { sent: "730516", slip: "730561" }, { sent: "159260" }, { sent: "604871", slip: "604817" }];
  const VERIFY = 480, START = 700;
  const beat = () => 150 + Math.random() * 90;
  let uid = 0;

  FlatPlayer.register({
    slug: "one-time-code",
    title: "One-Time Code",
    tagline: "Let an agent deploy: six boxes, one real input.",
    css: `
${S} .oc { width: min(100%, 440px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px }
${S} .oc-strip { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 12px; background: var(--panel-2) }
${S} .oc-strip b { font-weight: 600; margin-right: auto }
${S} .oc-box { height: 22px; min-width: 52px; padding: 0 8px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge); font: 600 11px/22px var(--mono); text-align: right }
${S} .oc-surface { margin: 14px; padding: 12px; background: var(--panel-2); border-radius: var(--r-control); display: grid; gap: 12px }
${S} .oc-req { justify-self: start; display: grid; gap: 2px; padding: 6px 10px 7px; border-radius: var(--r-control); background: var(--clip-orange-tint); box-shadow: inset 0 0 0 1px var(--clip-orange) }
${S} .oc-req b { color: var(--clip-orange-text); font-size: 11px; font-weight: 600 }
${S} .oc-req span { font-size: 11px; color: var(--ink) }
${S} .oc-field { position: relative }
${S} .oc-cells { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) 10px repeat(3, minmax(0, 1fr)); gap: 4px }
${S} .oc-gap { align-self: center; height: 1px; background: var(--line-strong) }
${S} .oc-cell { position: relative; height: 44px; border-radius: var(--r-control); background: var(--cut); box-shadow: inset 0 0 0 1px var(--line-strong);
  display: grid; place-items: center; font: 600 20px/1 var(--mono); font-variant-numeric: tabular-nums; color: var(--ink) }
${S} .oc-cell.is-at { box-shadow: inset 0 0 0 2px var(--ink) }
${S} .oc-cell.is-sel { background: var(--panel-3); box-shadow: inset 0 0 0 2px var(--ink) }
${S} .oc-caret { width: 1px; height: 20px; background: var(--ink) }
${S} .oc-cells[data-s="pending"] .oc-cell { color: var(--disabled) }
${S} .oc-cells[data-s="error"] .oc-cell { box-shadow: inset 0 0 0 1px var(--danger) }
${S} .oc-cells[data-s="error"] .oc-cell.is-at { box-shadow: inset 0 0 0 2px var(--danger) }
${S} .oc-cell.is-lit { background: var(--clip-orange-tint); color: var(--clip-orange-text); box-shadow: inset 0 0 0 1px var(--clip-orange);
  transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
${S} .oc-input { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; cursor: text; border-radius: var(--r-control);
  background: transparent; color: transparent; caret-color: transparent; font-size: 16px; outline: none; -webkit-text-fill-color: transparent }
${S} .oc-input::selection { background: transparent; color: transparent }
${S} .oc-field:has(.oc-input:focus-visible) { outline: 2px solid var(--ink); outline-offset: 3px; border-radius: var(--r-control) }
${S} .oc-word { margin: 0; font-size: 11px; color: var(--muted); min-height: 16px }
${S} .oc-word[data-s="error"] { color: var(--danger) }
${S} .oc-word[data-s="success"] { color: var(--success) }
@container (max-width: 380px) { ${S} .oc-surface { margin: 10px; padding: 10px } ${S} .oc-cell { height: 38px; font-size: 18px } }
@container (min-width: 600px) { ${S} .oc { width: 480px } ${S} .oc-cell { height: 52px; font-size: 24px } }
`,
    mount(host, ctx) {
      const id = "oc" + ++uid;
      host.innerHTML = `
<div class="oc" role="group" aria-labelledby="${id}-t">
  <div class="oc-strip"><b id="${id}-t">Authorize</b><span class="oc-box oc-left" aria-label="Time left"></span></div>
  <div class="oc-surface">
    <div class="oc-req"><b>Deploy</b><span>wants to push to main</span></div>
    <div class="oc-field">
      <div class="oc-cells" aria-hidden="true"></div>
      <input class="oc-input" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="${LENGTH}"
        spellcheck="false" autocorrect="off" autocapitalize="off" aria-label="Code from your authenticator app" aria-describedby="${id}-s">
    </div>
    <p class="oc-word" id="${id}-s"></p>
  </div>
  <p class="sr-only" role="status"></p>
  <p class="sr-only" role="alert"></p>
</div>`;
      const $ = (s) => host.querySelector(s);
      const root = $(".oc"), cellsEl = $(".oc-cells"), input = $(".oc-input"), word = $(".oc-word"), left = $(".oc-left");
      const statusLive = $('[role="status"]'), alertLive = $('[role="alert"]');
      const on = (el, type, fn) => el.addEventListener(type, fn, { signal: ctx.signal });
      if (ctx.tile) input.tabIndex = -1;
      const cells = [];
      for (let i = 0; i < LENGTH; i++) {
        if (i === LENGTH / 2) { const g = document.createElement("span"); g.className = "oc-gap"; cellsEl.appendChild(g); }
        const c = document.createElement("span"); c.className = "oc-cell"; cellsEl.appendChild(c); cells.push(c);
      }

      let code = "", sel = { start: 0, end: 0 }, status = "idle", engaged = false;
      let round = 0, ghost = !ctx.reduced(), edits = 0, windowStart = performance.now();
      const ghostTimers = [], litTimers = [];
      const later = (ms, fn) => { const t = ctx.after(ms, fn); ghostTimers.push(t); return t; };
      const sentNow = () => ROUNDS[round % ROUNDS.length].sent;

      function render() {
        const start = Math.min(sel.start, code.length), end = Math.min(sel.end, code.length);
        const locked = status === "pending" || status === "success";
        const at = !locked && start === end && start < LENGTH && (engaged || (code.length > 0 && code.length < LENGTH)) ? start : -1;
        cellsEl.dataset.s = status;
        cells.forEach((c, i) => {
          const ch = code[i] || "";
          c.textContent = ch;
          c.classList.toggle("is-sel", engaged && start !== end && i >= start && i < end);
          c.classList.toggle("is-at", i === at);
          if (i === at && ch === "") { const k = document.createElement("span"); k.className = "oc-caret"; c.appendChild(k); }
        });
        if (input.value !== code) input.value = code;
        input.readOnly = locked;
        input.setAttribute("aria-invalid", String(status === "error"));
        input.setAttribute("aria-busy", String(status === "pending"));
        word.dataset.s = status;
        word.textContent = status === "success" ? "Authorized" : status === "error" ? "Wrong code" : status === "pending" ? "Checking" : "Code from your authenticator app";
        statusLive.textContent = status === "success" ? "Authorized" : status === "pending" ? "Checking" : "";
        alertLive.textContent = status === "error" ? "Wrong code" : "";
        if (document.activeElement === input && (input.selectionStart !== start || input.selectionEnd !== end)) input.setSelectionRange(start, end);
      }
      /* A right code lights the boxes column by column, a beat apart; anything else puts them out at once. */
      function light(on) {
        litTimers.forEach(clearTimeout); litTimers.length = 0;
        cells.forEach((c, i) => {
          if (!on) { c.classList.remove("is-lit"); return; }
          if (ctx.reduced()) c.classList.add("is-lit");
          else litTimers.push(ctx.after(i * 60, () => c.classList.add("is-lit")));
        });
      }
      function setStatus(s) { status = s; light(s === "success"); render(); }
      function commit(next, caret) {
        sel = { start: caret, end: caret };
        if (next !== code) {
          code = next; edits++;
          if (status === "error") status = "idle";
          if (next.length === LENGTH) { verify(next); return; }
        }
        render();
      }
      function insert(text, from, to) {
        const digits = String(text).replace(/\D/g, "");
        if (!digits || status === "pending" || status === "success") return false;
        if (digits.length >= LENGTH) { commit(digits.slice(0, LENGTH), LENGTH); return true; }
        let a = Math.min(from, code.length), b = Math.min(to, code.length);
        if (a === b && code.length >= LENGTH) { if (a >= LENGTH) return false; b = Math.min(LENGTH, a + digits.length); }
        const next = (code.slice(0, a) + digits + code.slice(b)).slice(0, LENGTH);
        commit(next, Math.min(next.length, a + digits.length));
        return true;
      }
      function erase(from, to) {
        if (status === "pending" || status === "success") return false;
        if (from === to) { if (from === 0) return false; from -= 1; }
        commit(code.slice(0, from) + code.slice(to), from);
        return true;
      }
      function fresh() { // a new window and an empty field
        round++; windowStart = performance.now(); code = ""; sel = { start: 0, end: 0 }; status = "idle"; light(false); render();
      }
      const ghostPress = (k) => k === "back" ? erase(Math.min(sel.start, code.length), Math.min(sel.end, code.length)) : insert(k, Math.min(sel.start, code.length), Math.min(sel.end, code.length));
      function type(keys, at) { let t = at; for (const k of keys) { later(t, () => ghostPress(k)); t += beat(); } return t; }
      function playRound(r, at) { if (!ghost) return; const { sent, slip } = ROUNDS[r % ROUNDS.length]; type([...(slip || sent)], at); }
      function verify(c) {
        setStatus("pending");
        const sent = sentNow();
        ctx.after(VERIFY, () => {
          if (code !== c) return;
          const ok = c === sent;
          setStatus(ok ? "success" : "error");
          if (!ghost) { const at = edits; if (ok) ctx.after(2400, () => { if (edits === at) fresh(); }); return; }
          if (ok) later(1600, () => { fresh(); playRound(round, 400); });
          else { const t = type(["back", "back"], 700); type([...sent.slice(4)], t + 120); }
        });
      }
      function takeOver() {
        if (!ghost) return;
        ghost = false; ghostTimers.forEach(clearTimeout);
        code = ""; sel = { start: 0, end: 0 }; status = "idle"; light(false); render();
      }
      ctx.onHand(takeOver);
      on(root, "focusin", () => { takeOver(); engaged = true; render(); });
      on(root, "focusout", (e) => { if (!root.contains(e.relatedTarget)) { engaged = false; render(); } });

      on(input, "beforeinput", (e) => {
        if (e.inputType !== "insertText" || e.data == null || !e.cancelable) return;
        e.preventDefault();
        insert(e.data, input.selectionStart ?? code.length, input.selectionEnd ?? code.length);
      });
      on(input, "input", () => {
        const raw = input.value, next = raw.replace(/\D/g, "").slice(0, LENGTH);
        commit(next, Math.min(next.length, raw.slice(0, input.selectionStart ?? raw.length).replace(/\D/g, "").length));
      });
      on(input, "paste", (e) => { e.preventDefault(); insert(e.clipboardData.getData("text"), input.selectionStart ?? code.length, input.selectionEnd ?? code.length); });
      const selectionChanged = () => {
        if (document.activeElement !== input) return;
        const a = input.selectionStart ?? 0, b = input.selectionEnd ?? 0;
        if (sel.start !== a || sel.end !== b) { sel = { start: a, end: b }; render(); }
      };
      on(input, "select", selectionChanged);
      on(document, "selectionchange", selectionChanged);
      on(input, "click", (e) => {
        if (e.detail > 1 || input.selectionStart !== input.selectionEnd) return;
        const i = cells.findIndex((c) => e.clientX < c.getBoundingClientRect().right);
        const at = Math.min(i === -1 ? LENGTH : i, code.length);
        input.setSelectionRange(at, at < code.length ? at + 1 : at);
        selectionChanged();
      });

      /* The window: a clock, so it runs even under reduced motion; it steps once a second there. */
      let lastSec = -1;
      const tick = () => {
        const el = (performance.now() - windowStart) / 1000;
        if (el >= WINDOW) { if (status !== "success") { ghostTimers.forEach(clearTimeout); fresh(); if (ghost) playRound(round, 400); } else windowStart = performance.now(); return; }
        const secs = Math.ceil(WINDOW - el);
        if (secs !== lastSec) { lastSec = secs; left.textContent = "0:" + String(secs).padStart(2, "0"); }
      };
      tick();
      if (ctx.reduced()) ctx.every(1000, tick); else ctx.loop(() => { tick(); });

      if (!ctx.tile && "OTPCredential" in window && navigator.credentials) {
        try { navigator.credentials.get({ otp: { transport: ["sms"] }, signal: ctx.signal }).then((cr) => { if (cr && cr.code && !ctx.signal.aborted) insert(cr.code, 0, LENGTH); }).catch(() => {}); } catch (e) {}
      }

      render();
      if (ghost) playRound(0, START);
      return { destroy() { ghostTimers.forEach(clearTimeout); litTimers.forEach(clearTimeout); } };
    },
  });
})();
