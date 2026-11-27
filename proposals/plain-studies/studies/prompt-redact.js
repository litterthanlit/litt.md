/* Secret Redaction, redesigned in Plain (Subtraction): outbound context lines with three underlined credentials.
   Redacting swaps each raw value into a typed token while surrounding boilerplate dims back, isolating what was
   subtracted before dispatch. */
(function () {
  const SECRETS = [
    { key: "key", raw: "sk_live_91a4c8f2", mask: "[REDACTED:KEY]", label: "API key" },
    { key: "email", raw: "nick@litt.design", mask: "[REDACTED:EMAIL]", label: "Email" },
    { key: "token", raw: "eyJhbG9f", mask: "[REDACTED:TOKEN]", label: "Bearer token" },
  ];

  PlainPlayer.register({
    slug: "prompt-redact",
    title: "Secret Redaction",
    tagline: "Redact keys, emails and tokens before sending.",
    css: `
.ps-prompt-redact .pr { width: min(100%, 430px); display: grid; gap: 14px }
.ps-prompt-redact .pr-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-prompt-redact .pr-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-prompt-redact .pr-status { font-size: var(--t-meta); color: var(--danger); font-weight: 500; white-space: nowrap }
.ps-prompt-redact .pr-status.is-safe { color: var(--ink) }
.ps-prompt-redact .pr-status.is-sent { color: var(--muted); font-weight: 400 }
.ps-prompt-redact .pr-box { border-left: 1px solid var(--line-control); padding: 2px 0 2px 14px; display: grid; gap: 4px }
.ps-prompt-redact .pr-line { font-family: var(--mono); font-size: 12.5px; line-height: 1.65; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  transition: opacity var(--dur-pare) var(--ease-out) }
.ps-prompt-redact .pr-pre { color: var(--muted); transition: opacity var(--dur-pare) var(--ease-out) }
.ps-prompt-redact .pr-box.is-redacted .pr-pre { opacity: 0.42 }
.ps-prompt-redact .pr-val { display: inline; padding: 0; border: 0; background: none; font: inherit; color: var(--ink);
  text-decoration: underline; text-underline-offset: 3.5px; text-decoration-skip-ink: none; cursor: pointer; -webkit-tap-highlight-color: transparent }
.ps-prompt-redact .pr-val[aria-pressed="true"] { text-decoration: none; font-weight: 500 }
.ps-prompt-redact .pr-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 22px; padding-left: 10px; padding-right: 10px }
.ps-prompt-redact.is-tile .pr { width: 100%; gap: 14px }
@container (max-width: 300px) {
  .ps-prompt-redact .pr-box { padding: 2px 0 2px 11px }
  .ps-prompt-redact .pr-line { font-size: 11.5px }
}
@container (max-width: 255px) {
  .ps-prompt-redact .pr-box { padding: 2px 0 2px 9px }
}
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="pr">
  <div class="pr-head">
    <h3>Outbound context</h3>
    <span class="pr-status">3 secrets detected</span>
  </div>
  <div class="pr-box">
    <div class="pr-line"><span class="pr-pre">STRIPE_KEY=</span><button type="button" class="pr-val" data-k="key" aria-pressed="false" aria-label="Redact API key">sk_live_91a4c8f2</button></div>
    <div class="pr-line"><span class="pr-pre">user="</span><button type="button" class="pr-val" data-k="email" aria-pressed="false" aria-label="Redact email">nick@litt.design</button><span class="pr-pre">"</span></div>
    <div class="pr-line"><span class="pr-pre">Authorization: Bearer </span><button type="button" class="pr-val" data-k="token" aria-pressed="false" aria-label="Redact bearer token">eyJhbG9f</button></div>
  </div>
  <div class="pr-foot">
    <button type="button" class="q is-main pr-main">Redact 3 secrets</button>
    <button type="button" class="q pr-restore" hidden>Restore</button>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const statusEl = host.querySelector(".pr-status");
      const boxEl = host.querySelector(".pr-box");
      const mainBtn = host.querySelector(".pr-main");
      const restoreBtn = host.querySelector(".pr-restore");
      const sr = host.querySelector("[aria-live]");
      const valBtns = {};
      for (const s of SECRETS) {
        valBtns[s.key] = host.querySelector(`.pr-val[data-k="${s.key}"]`);
      }

      let redacted = { key: false, email: false, token: false };
      let dispatched = false;
      let justRedacted = false;

      function exposedCount() {
        return SECRETS.filter((s) => !redacted[s.key]).length;
      }

      function syncUI(immediate) {
        const exp = exposedCount();
        const allClean = exp === 0;
        boxEl.classList.toggle("is-redacted", allClean);

        let stText;
        if (dispatched) {
          stText = "Sent · 0 exposed";
          statusEl.classList.remove("is-safe");
          statusEl.classList.add("is-sent");
        } else if (allClean) {
          stText = "0 exposed · Ready";
          statusEl.classList.add("is-safe");
          statusEl.classList.remove("is-sent");
        } else {
          stText = `${exp} ${exp === 1 ? "secret" : "secrets"} detected`;
          statusEl.classList.remove("is-safe", "is-sent");
        }

        const mainText = allClean ? "Send redacted" : `Redact ${exp} ${exp === 1 ? "secret" : "secrets"}`;

        mainBtn.hidden = dispatched;
        restoreBtn.hidden = exp === SECRETS.length && !dispatched;

        if (immediate) {
          statusEl.textContent = stText;
          mainBtn.textContent = mainText;
        } else {
          ctx.swapText(statusEl, stText);
          ctx.swapText(mainBtn, mainText);
        }
      }

      function setSecret(key, isRedacted, immediate) {
        if (redacted[key] === isRedacted) return;
        redacted[key] = isRedacted;
        const s = SECRETS.find((x) => x.key === key);
        const btn = valBtns[key];
        btn.setAttribute("aria-pressed", isRedacted ? "true" : "false");
        btn.setAttribute("aria-label", `${isRedacted ? "Restore" : "Redact"} ${s.label}`);
        const nextVal = isRedacted ? s.mask : s.raw;
        if (immediate) btn.textContent = nextVal;
        else ctx.swapText(btn, nextVal);
      }

      function redactAll(byUser) {
        dispatched = false;
        justRedacted = true;
        ctx.after(220, () => { justRedacted = false; });
        for (const s of SECRETS) setSecret(s.key, true, false);
        syncUI(false);
        if (byUser) {
          sr.textContent = "Redacted 3 secrets. 0 exposed, ready to send.";
          mainBtn.focus({ preventScroll: true });
        }
      }

      function restoreAll(byUser) {
        dispatched = false;
        justRedacted = false;
        for (const s of SECRETS) setSecret(s.key, false, false);
        syncUI(false);
        if (byUser) {
          sr.textContent = "Restored 3 raw values. 3 secrets detected.";
          mainBtn.focus({ preventScroll: true });
        }
      }

      function sendRedacted(byUser) {
        if (justRedacted) return;
        dispatched = true;
        syncUI(false);
        if (byUser) {
          sr.textContent = "Sent redacted context with 0 secrets exposed.";
          restoreBtn.focus({ preventScroll: true });
        }
      }

      for (const s of SECRETS) {
        valBtns[s.key].addEventListener("click", () => {
          if (dispatched) dispatched = false;
          const next = !redacted[s.key];
          setSecret(s.key, next, false);
          syncUI(false);
          sr.textContent = `${s.label} ${next ? "redacted" : "restored"}.`;
        }, { signal: ctx.signal });
      }

      mainBtn.addEventListener("click", () => {
        if (exposedCount() > 0) redactAll(true);
        else sendRedacted(true);
      }, { signal: ctx.signal });

      restoreBtn.addEventListener("click", () => restoreAll(true), { signal: ctx.signal });

      syncUI(true);

      function cycle() {
        ctx.demoAfter(2000, () => {
          redactAll(false);
          ctx.demoAfter(2600, () => {
            restoreAll(false);
            cycle();
          });
        });
      }
      cycle();
    },
  });
})();
