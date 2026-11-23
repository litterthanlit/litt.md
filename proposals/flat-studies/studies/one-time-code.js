/* One-Time Code, after litterthanlit/components, redesigned for Flat: a sign-in's second step for someone
   with a newsletter. Six white rounded squares on the grey ground, one large figure in each. It is one real
   input laid over them, so paste ("482-913" lands as 482913), autofill, password managers, screen readers and
   native selection all work; the squares follow its selection. A right code turns them ink one after another
   on the expressive spring; a wrong one shakes and says so. No keypad: the phone's own keyboard is the keypad. */
(function () {
  const S = ".fs-one-time-code";
  const LENGTH = 6;
  const EXPRESSIVE = "linear(0, 0.0897, 0.2671, 0.4643, 0.6434, 0.7874, 0.8925, 0.9624, 1.004, 1.0249, 1.0322, 1.0295, 1.0237, 1.0173, 1.0115, 1.0068, 1.0034, 1.0012, 0.9998, 0.9992, 1)";
  const SHAKE = [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(6px)" },
    { transform: "translateX(-4px)" }, { transform: "translateX(2px)" }, { transform: "translateX(0)" }];
  /* Codes as the email sends them; on the second round the ghost swaps two figures, then fixes them. */
  const ROUNDS = [{ sent: "482913" }, { sent: "730516", slip: "730561" }, { sent: "159260" }, { sent: "604871", slip: "604817" }];
  const VERIFY = 520, START = 650;
  const beat = () => 150 + Math.random() * 90;
  let uid = 0;

  FlatPlayer.register({
    slug: "one-time-code",
    title: "One-Time Code",
    tagline: "The sign-in code field, done right.",
    css: `
${S} .otc { width: min(100%, 440px); display: grid; justify-items: center; text-align: center; gap: 6px }
${S} .otc-title { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2 }
${S} .otc-sub { margin: 0; color: var(--muted); font-size: 15px }
${S} .otc-field { position: relative; width: 100%; margin-top: 20px; border-radius: 18px }
${S} .otc-field:has(input:focus-visible) { outline: 2px solid var(--ink); outline-offset: 4px }
${S} .otc-cells { display: grid; grid-template-columns: repeat(${LENGTH}, minmax(0, 1fr)); gap: clamp(6px, 2cqw, 10px) }
${S} .otc-cell { position: relative; aspect-ratio: 5 / 6; border-radius: 16px; background: var(--paper); color: var(--ink); display: grid; place-items: center;
  font-size: clamp(24px, 9cqw, 40px); font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; line-height: 1;
  transition: background-color var(--dur-responsive), color var(--dur-responsive), box-shadow var(--dur-instant) }
${S} .otc-cell.is-caret, ${S} .otc-cell.is-selected { box-shadow: inset 0 0 0 2px var(--ink) }
${S} .otc-cell.is-selected { background: var(--bubble) }
${S} .otc-bar { position: absolute; left: 50%; bottom: 22%; width: 30%; height: 3px; translate: -50% 0; border-radius: 2px; background: var(--ink);
  animation: otc-blink 1s steps(1) infinite }
@keyframes otc-blink { 50% { opacity: 0 } }
@media (prefers-reduced-motion: reduce) { ${S} .otc-bar { animation: none } }
${S} .otc-cells[data-s="pending"] .otc-cell { color: var(--disabled) }
${S} .otc-cells[data-s="error"] .otc-cell { color: var(--cherry-text) }
${S} .otc-cells[data-s="success"] .otc-cell { background: var(--ink); color: var(--on-ink); box-shadow: none }
${S} .otc-input { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; cursor: text;
  background: transparent; color: transparent; caret-color: transparent; font-size: 16px; outline: none; -webkit-text-fill-color: transparent }
${S} .otc-input::selection { background: transparent; color: transparent }
${S} .otc-status { margin: 14px 0 0; min-height: 22px; display: inline-flex; align-items: center; gap: 6px; font-size: 15px; color: var(--muted) }
${S} .otc-status[data-s="error"] { color: var(--cherry-text) }
${S} .otc-status[data-s="success"] { color: var(--ink); font-weight: 500 }
${S} .otc-status svg { width: 18px; height: 18px; flex: none }
${S} .otc-resend { margin-top: 6px; height: 40px; padding: 0 18px; border: 0; border-radius: var(--r-pill); background: var(--paper); color: var(--ink);
  font-size: 14px; font-weight: 500; cursor: pointer; transition: transform var(--dur-instant), background-color var(--dur-instant) }
${S} .otc-resend:hover { background: color-mix(in oklab, var(--paper), var(--ink) 4%) }
${S} .otc-resend:active { transform: scale(0.96) }
@container (max-width: 380px) {
  ${S} .otc-title { font-size: 18px }
  ${S} .otc-sub { font-size: 13px }
  ${S} .otc-field { margin-top: 14px }
  ${S} .otc-cell { border-radius: 12px }
  ${S} .otc-status { margin-top: 10px; font-size: 13px }
}
${S}.is-tile .otc-resend { display: none }
`,
    mount(host, ctx) {
      const id = "otc" + ++uid;
      host.innerHTML = `
<div class="otc" role="group" aria-labelledby="${id}-t">
  <h3 class="otc-title" id="${id}-t">Check your email</h3>
  <p class="otc-sub">Enter the code we sent you.</p>
  <div class="otc-field">
    <div class="otc-cells" aria-hidden="true"></div>
    <input class="otc-input" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="${LENGTH}"
      spellcheck="false" autocorrect="off" autocapitalize="off" aria-label="Sign-in code" aria-describedby="${id}-s">
  </div>
  <p class="otc-status" id="${id}-s"></p>
  <button class="otc-resend" type="button">Send a new code</button>
  <p class="sr-only" role="status"></p>
  <p class="sr-only" role="alert"></p>
</div>`;
      const $ = (s) => host.querySelector(s);
      const root = $(".otc"), cellsEl = $(".otc-cells"), input = $(".otc-input"), statusEl = $(".otc-status"), resend = $(".otc-resend");
      const statusLive = $('[role="status"]'), alertLive = $('[role="alert"]');
      const on = (el, type, fn) => el.addEventListener(type, fn, { signal: ctx.signal });
      if (ctx.tile) input.tabIndex = -1;
      const cells = Array.from({ length: LENGTH }, () => { const c = document.createElement("div"); c.className = "otc-cell"; cellsEl.appendChild(c); return c; });

      let code = "", sel = { start: 0, end: 0 }, status = "idle", engaged = false;
      let round = 0, ghost = true, edits = 0;
      const ghostTimers = [];
      const later = (ms, fn) => { const t = ctx.after(ms, fn); ghostTimers.push(t); return t; };
      const sentNow = () => ROUNDS[round % ROUNDS.length].sent;
      const CHECK = '<svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="9" style="fill:var(--ink)"/><path d="m5.2 9.2 2.5 2.4 5-5.2" style="fill:none;stroke:var(--paper)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      function render() {
        const start = Math.min(sel.start, code.length), end = Math.min(sel.end, code.length);
        const locked = status === "pending";
        const cursor = !locked && start === end && start < LENGTH && (engaged || (code.length > 0 && code.length < LENGTH)) ? start : -1;
        cellsEl.dataset.s = status;
        cells.forEach((c, i) => {
          const ch = code[i] || "";
          c.textContent = ch;
          c.classList.toggle("is-selected", engaged && start !== end && i >= start && i < end);
          c.classList.toggle("is-caret", i === cursor && ch !== "");
          if (i === cursor && ch === "") { const bar = document.createElement("span"); bar.className = "otc-bar"; c.appendChild(bar); }
          c.style.transitionDelay = status === "success" ? i * 55 + "ms" : "";
        });
        if (input.value !== code) input.value = code;
        input.readOnly = locked;
        input.setAttribute("aria-invalid", String(status === "error"));
        input.setAttribute("aria-busy", String(locked));
        statusEl.dataset.s = status;
        statusEl.innerHTML = status === "success" ? CHECK + "<span>You're signed in</span>"
          : status === "error" ? "That code didn't work" : status === "pending" ? "Checking…" : "It's in your inbox for 10 minutes";
        statusLive.textContent = status === "success" ? "You're signed in" : status === "pending" ? "Checking" : "";
        alertLive.textContent = status === "error" ? "That code didn't work" : "";
        if (document.activeElement === input && (input.selectionStart !== start || input.selectionEnd !== end)) input.setSelectionRange(start, end);
      }

      function setStatus(s) {
        const was = status;
        status = s;
        render();
        if (ctx.reduced() || s === was) return;
        if (s === "error") cellsEl.animate(SHAKE, { duration: 380, easing: "cubic-bezier(0.36, 0.07, 0.19, 0.97)" });
        if (s === "success") cells.forEach((c, i) => c.animate([{ transform: "scale(0.86)" }, { transform: "none" }], { duration: 420, delay: i * 55, easing: EXPRESSIVE, fill: "backwards" }));
      }
      function commit(next, caret) {
        sel = { start: caret, end: caret };
        if (next !== code) {
          const grew = next.length > code.length;
          code = next;
          edits++;
          if (status === "error" || status === "success") status = "idle";
          if (grew && !ctx.reduced()) { const c = cells[Math.min(caret, LENGTH) - 1]; c && c.animate([{ transform: "scale(0.9)" }, { transform: "none" }], { duration: 300, easing: EXPRESSIVE }); }
          if (next.length === LENGTH) { verify(next); return; }
        }
        render();
      }
      function insert(text, from, to) {
        const digits = String(text).replace(/\D/g, "");
        if (!digits || status === "pending") return false;
        if (digits.length >= LENGTH) { commit(digits.slice(0, LENGTH), LENGTH); return true; }
        let a = Math.min(from, code.length), b = Math.min(to, code.length);
        if (a === b && code.length >= LENGTH) { if (a >= LENGTH) return false; b = Math.min(LENGTH, a + digits.length); }
        const next = (code.slice(0, a) + digits + code.slice(b)).slice(0, LENGTH);
        commit(next, Math.min(next.length, a + digits.length));
        return true;
      }
      function erase(from, to) {
        if (status === "pending") return false;
        if (from === to) { if (from === 0) return false; from -= 1; }
        commit(code.slice(0, from) + code.slice(to), from);
        return true;
      }
      const ghostPress = (k) => k === "back" ? erase(Math.min(sel.start, code.length), Math.min(sel.end, code.length))
        : k === "clear" ? (status !== "pending" && commit("", 0)) : insert(k, Math.min(sel.start, code.length), Math.min(sel.end, code.length));

      function type(keys, at) { let t = at; for (const k of keys) { later(t, () => ghostPress(k)); t += beat(); } return t; }
      function playRound(r, at) { if (!ghost) return; const { sent, slip } = ROUNDS[r % ROUNDS.length]; type([...(slip || sent)], at); }
      function verify(c) {
        setStatus("pending");
        const r = round, sent = sentNow();
        ctx.after(VERIFY, () => {
          if (code !== c) return;
          const ok = c === sent;
          setStatus(ok ? "success" : "error");
          if (!ghost) {
            const at = edits;
            if (ok) ctx.after(2200, () => { if (edits !== at) return; code = ""; sel = { start: 0, end: 0 }; status = "idle"; round = r + 1; render(); });
            return;
          }
          if (ok) {
            later(1500, () => ghostPress("clear"));
            later(1500 + 380, () => { round = r + 1; render(); playRound(r + 1, 360); });
          } else {
            const t = type(["back", "back"], 900);
            type([...sent.slice(4)], t + 140);
          }
        });
      }
      function takeOver() {
        if (!ghost) return;
        ghost = false;
        ghostTimers.forEach(clearTimeout);
        code = ""; sel = { start: 0, end: 0 }; status = "idle";
        render();
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
        const raw = input.value;
        const next = raw.replace(/\D/g, "").slice(0, LENGTH);
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
      // A click lands on the square under it: a filled one is selected, to be typed over.
      on(input, "click", (e) => {
        if (e.detail > 1 || input.selectionStart !== input.selectionEnd) return;
        const i = cells.findIndex((c) => e.clientX < c.getBoundingClientRect().right);
        const at = Math.min(i === -1 ? LENGTH : i, code.length);
        input.setSelectionRange(at, at < code.length ? at + 1 : at);
        selectionChanged();
      });
      on(resend, "click", () => {
        round++; code = ""; sel = { start: 0, end: 0 }; status = "idle"; render();
        statusLive.textContent = "We sent a new code";
        input.focus();
      });

      /* Web OTP, where the browser can read the code from a text message. Only open, never in a tile. */
      if (!ctx.tile && "OTPCredential" in window && navigator.credentials) {
        try {
          navigator.credentials.get({ otp: { transport: ["sms"] }, signal: ctx.signal })
            .then((cred) => { if (cred && cred.code && !ctx.signal.aborted) insert(cred.code, 0, LENGTH); }).catch(() => {});
        } catch (e) {}
      }

      render();
      if (ctx.reduced()) ghost = false;
      else playRound(0, START);
      return { destroy() { ghostTimers.forEach(clearTimeout); } };
    },
  });
})();
