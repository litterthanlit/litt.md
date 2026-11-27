/* Sources & Citations, redesigned in Plain (Subtraction): an agent's answer divided into three cited claims above a
   numbered source list. Resting a hand or focus on [k] or row k steps uncited claims and rows back while four 1px
   corner hairlines glide onto the matching proof. */
(function () {
  const SOURCES = [
    {
      k: 1,
      title: "src/auth/session.ts:92",
      note: "Fallback branch",
      href: "https://github.com/litterthanlit/litt.md/blob/main/src/auth/session.ts#L92",
    },
    {
      k: 2,
      title: "src/auth/verify.ts:44",
      note: "Expiry check",
      href: "https://github.com/litterthanlit/litt.md/blob/main/src/auth/verify.ts#L44",
    },
    {
      k: 3,
      title: "docs/auth-cookies.md",
      note: "Max-Age policy",
      href: "https://github.com/litterthanlit/litt.md/blob/main/docs/auth-cookies.md",
    },
  ];

  PlainPlayer.register({
    slug: "sources",
    title: "Sources & Citations",
    tagline: "Point at a citation; uncited lines step back.",
    css: `
.ps-sources .sc { width: min(100%, 430px); display: grid; gap: 14px }
.ps-sources .sc-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-sources .sc-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-sources .sc-meta { font-size: var(--t-meta); color: var(--muted); white-space: nowrap }
.ps-sources .sc-prose { margin: 0; font-size: 14px; line-height: 1.55; color: var(--ink) }
.ps-sources .sc-prose .mono { font-size: 12.5px }
.ps-sources .sc-claim { transition: opacity var(--dur-pare) var(--ease-out) }
.ps-sources .sc-cite { display: inline; padding: 1px 2px; margin: 0 0 0 1px; border: 0; background: none; font: 500 12.5px/1 var(--mono);
  color: var(--ink); opacity: 0.45; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: opacity var(--dur-instant) var(--ease-out) }
.ps-sources .sc-cite:hover, .ps-sources .sc-cite[aria-pressed="true"], .ps-sources .sc-claim[data-active] .sc-cite { opacity: 1 }
.ps-sources .sc-list { position: relative; list-style: none; margin: 0; padding: 0; display: grid }
.ps-sources .sc-row:first-child { border-top: 1px solid var(--line) }
.ps-sources .sc-row { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; align-items: baseline; gap: 10px;
  padding: 9px 8px; border-bottom: 1px solid var(--line); font-size: 14px }
.ps-sources .sc-num { font-family: var(--mono); font-size: 12.5px; color: var(--muted) }
.ps-sources .sc-link { font-family: var(--mono); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; justify-self: start; max-width: 100% }
.ps-sources .sc-note { font-size: var(--t-meta); color: var(--muted); white-space: nowrap }
.ps-sources .sc-row[data-active] .sc-num, .ps-sources .sc-row[data-active] .sc-note { color: var(--ink) }
.ps-sources.is-tile .sc { width: 100%; gap: 14px }
.ps-sources.is-tile .sc-row { padding: 8px 6px; gap: 8px; font-size: 13.5px }
.ps-sources.is-tile .sc-link { font-size: 12.5px }
.ps-sources.is-tile .sc-note { font-size: 12.5px }
@container (max-width: 270px) {
  .ps-sources.is-tile .sc { gap: 10px }
  .ps-sources.is-tile .sc-prose { font-size: 13.5px; line-height: 1.45 }
}
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="sc">
  <div class="sc-head">
    <h3>Session fallback</h3>
    <span class="sc-meta">3 sources</span>
  </div>
  <p class="sc-prose" data-focus-group>
    <span class="sc-claim" data-k="1">Null users fall back to <span class="mono">guest()</span> <button type="button" class="sc-cite" data-k="1" aria-pressed="false" aria-label="Citation 1: src/auth/session.ts:92">[1]</button>. </span><span class="sc-claim" data-k="2">Expired tokens return <span class="mono">null</span> <button type="button" class="sc-cite" data-k="2" aria-pressed="false" aria-label="Citation 2: src/auth/verify.ts:44">[2]</button>, </span><span class="sc-claim" data-k="3">while cookies persist 7 days <button type="button" class="sc-cite" data-k="3" aria-pressed="false" aria-label="Citation 3: docs/auth-cookies.md">[3]</button>.</span>
  </p>
  <ol class="sc-list" data-focus-group>
    ${SOURCES.map((s) => `<li class="sc-row" data-k="${s.k}">
      <span class="sc-num">${s.k}</span>
      <a class="sc-link" href="${s.href}" target="_blank" rel="noreferrer">${s.title}</a>
      <span class="sc-note">${s.note}</span>
    </li>`).join("")}
  </ol>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const proseEl = host.querySelector(".sc-prose");
      const listEl = host.querySelector(".sc-list");
      const metaEl = host.querySelector(".sc-meta");
      const sr = host.querySelector("[aria-live]");
      const claimEls = [...proseEl.querySelectorAll(".sc-claim")];
      const citeBtns = [...proseEl.querySelectorAll(".sc-cite")];
      const rowEls = [...listEl.querySelectorAll(".sc-row")];
      const frame = ctx.brackets(listEl, { padX: 0, padY: -1, exactPad: true });

      let hoverK = 0;
      let focusK = 0;
      let pinK = 0;
      let demoK = 0;
      let paintedK = -1;

      function paint() {
        const k = hoverK || focusK || pinK || demoK;
        if (k === paintedK) return;
        paintedK = k;

        citeBtns.forEach((b) => b.setAttribute("aria-pressed", +b.dataset.k === pinK ? "true" : "false"));

        if (k > 0) {
          proseEl.setAttribute("data-focusing", "");
          listEl.setAttribute("data-focusing", "");
          claimEls.forEach((el) => {
            if (+el.dataset.k === k) el.setAttribute("data-active", "");
            else el.removeAttribute("data-active");
          });
          rowEls.forEach((el) => {
            if (+el.dataset.k === k) el.setAttribute("data-active", "");
            else el.removeAttribute("data-active");
          });
          const targetRow = rowEls.find((el) => +el.dataset.k === k);
          frame.moveTo(targetRow);
          ctx.swapText(metaEl, `Source ${k} of 3`);
        } else {
          proseEl.removeAttribute("data-focusing");
          listEl.removeAttribute("data-focusing");
          claimEls.forEach((el) => el.removeAttribute("data-active"));
          rowEls.forEach((el) => el.removeAttribute("data-active"));
          frame.pare();
          ctx.swapText(metaEl, "3 sources");
        }
      }

      for (const btn of citeBtns) {
        const k = +btn.dataset.k;
        btn.addEventListener("pointerenter", () => { hoverK = k; paint(); }, { signal: ctx.signal });
        btn.addEventListener("pointerleave", () => { if (hoverK === k) hoverK = 0; paint(); }, { signal: ctx.signal });
        btn.addEventListener("focus", () => { focusK = k; paint(); }, { signal: ctx.signal });
        btn.addEventListener("blur", () => { if (focusK === k) focusK = 0; paint(); }, { signal: ctx.signal });
        btn.addEventListener("click", () => {
          pinK = pinK === k ? 0 : k;
          citeBtns.forEach((b) => b.setAttribute("aria-pressed", +b.dataset.k === pinK ? "true" : "false"));
          paintedK = -1;
          paint();
          const src = SOURCES[k - 1];
          sr.textContent = pinK ? `Pinned citation ${k}: ${src.title}, ${src.note}.` : "Cleared pinned citation.";
        }, { signal: ctx.signal });
      }

      for (const row of rowEls) {
        const k = +row.dataset.k;
        row.addEventListener("pointerenter", () => { hoverK = k; paint(); }, { signal: ctx.signal });
        row.addEventListener("pointerleave", () => { if (hoverK === k) hoverK = 0; paint(); }, { signal: ctx.signal });
        row.addEventListener("focusin", () => { focusK = k; paint(); }, { signal: ctx.signal });
        row.addEventListener("focusout", (e) => {
          if (!row.contains(e.relatedTarget) && focusK === k) { focusK = 0; paint(); }
        }, { signal: ctx.signal });
      }

      host.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && pinK) {
          e.preventDefault();
          e.stopPropagation();
          pinK = 0;
          focusK = 0;
          paintedK = -1;
          paint();
          sr.textContent = "Cleared pinned citation.";
        }
      }, { signal: ctx.signal });

      ctx.onHand(() => {
        if (demoK) {
          demoK = 0;
          paint();
        }
      });

      paint();

      /* Calm demo loop: gently inspects 1 -> 2 -> clear. */
      function cycle() {
        ctx.demoAfter(1500, () => {
          demoK = 1; paint();
          ctx.demoAfter(1900, () => {
            demoK = 2; paint();
            ctx.demoAfter(1900, () => {
              demoK = 0; paint();
              ctx.demoAfter(1600, cycle);
            });
          });
        });
      }
      cycle();
    },
  });
})();
