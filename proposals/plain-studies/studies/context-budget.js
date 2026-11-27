/* Context Window, redesigned in Plain (Subtraction): token pressure shown as one standing figure and one 1px bar
   driven purely by translateX. Compacting old turns or dropping unused files pares heavy breakdown rows into quiet
   summary receipts and pulls the meter back with zero bounce. */
(function () {
  const LIMIT = 128;
  const SYS = 14;

  PlainPlayer.register({
    slug: "context-budget",
    title: "Context Window",
    tagline: "Compact old turns to subtract tokens from context.",
    css: `
.ps-context-budget .cb { width: min(100%, 420px); display: grid; gap: 12px }
.ps-context-budget .cb-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-context-budget .cb-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-context-budget .cb-limit { font-size: 13px }
.ps-context-budget .cb-meter { display: grid; gap: 12px }
.ps-context-budget .cb-readout { display: flex; align-items: baseline; justify-content: space-between; gap: 12px }
.ps-context-budget .cb-stat { display: flex; align-items: baseline; gap: 10px; min-width: 0 }
.ps-context-budget .cb-pct { font-size: 13px; white-space: nowrap }
.ps-context-budget .cb-free { font-size: 13px; white-space: nowrap }
.ps-context-budget .cb-list { display: grid }
.ps-context-budget .cb-row { display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 9px 0; border-bottom: 1px solid var(--line); font-size: 14px; line-height: 1.4; transition: opacity var(--dur-pare) var(--ease-out) }
.ps-context-budget .cb-row.is-pared { opacity: 0.48 }
.ps-context-budget .cb-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-context-budget .cb-row.is-heavy .cb-name { color: var(--ink); font-weight: 500 }
.ps-context-budget .cb-act, .ps-context-budget .cb-reset { min-height: 24px; margin-right: 10px; font-size: 13px }
.ps-context-budget .cb-saved { font-size: 13px; color: var(--muted); white-space: nowrap }
.ps-context-budget .cb-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; line-height: 1.4 }
.ps-context-budget.is-tile .cb { width: 100%; gap: 12px }
.ps-context-budget.is-tile .cb-head { padding-bottom: 8px }
.ps-context-budget.is-tile .cb-row { padding: 8px 0 }
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="cb">
  <div class="cb-head">
    <h3>Context window</h3>
    <span class="cb-limit muted">128k limit</span>
  </div>
  <div class="cb-meter">
    <div class="cb-readout">
      <div class="cb-stat">
        <span class="fig cb-fig">104k used</span>
        <span class="cb-pct muted">81 %</span>
      </div>
      <span class="cb-free muted">24k free</span>
    </div>
    <div class="bar-track" role="meter" aria-label="Context window usage" aria-valuemin="0" aria-valuemax="128" aria-valuenow="104" aria-valuetext="104k of 128k tokens used, 81 percent">
      <div class="bar-fill" style="--p: 0.8125"></div>
    </div>
  </div>
  <div class="cb-list">
    <div class="cb-row is-pared" data-row="sys">
      <span class="cb-name">System &amp; tools · 14k</span>
    </div>
    <div class="cb-row" data-row="files"></div>
    <div class="cb-row" data-row="turns"></div>
  </div>
  <div class="cb-foot" hidden>
    <span class="cb-note muted"></span>
    <button type="button" class="q is-ink cb-reset">Reset</button>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const figEl = host.querySelector(".cb-fig");
      const pctEl = host.querySelector(".cb-pct");
      const freeEl = host.querySelector(".cb-free");
      const meterEl = host.querySelector(".bar-track");
      const fillEl = host.querySelector(".bar-fill");
      const listEl = host.querySelector(".cb-list");
      const footEl = host.querySelector(".cb-foot");
      const noteEl = host.querySelector(".cb-note");
      const resetBtn = host.querySelector(".cb-reset");
      const sr = host.querySelector("[aria-live]");

      let dropped = false;
      let compacted = false;
      let busy = false;

      function totals() {
        const files = dropped ? 24 : 38;
        const turns = compacted ? 9 : 52;
        const used = SYS + files + turns;
        const pct = Math.round((used / LIMIT) * 100);
        const free = LIMIT - used;
        const saved = 104 - used;
        return { used, pct, free, saved };
      }

      function renderFilesRow(row) {
        if (dropped) {
          row.className = "cb-row is-pared";
          row.innerHTML = `<span class="cb-name">Pinned files (2) · 24k</span><span class="cb-saved">−14k</span>`;
        } else {
          row.className = "cb-row";
          row.innerHTML = `<span class="cb-name">Pinned files (4) · 38k</span><button type="button" class="q cb-act" data-act="drop">Drop unused</button>`;
          row.querySelector("button").addEventListener("click", () => dropUnused(true), { signal: ctx.signal });
        }
      }

      function renderTurnsRow(row) {
        if (compacted) {
          row.className = "cb-row is-pared";
          row.innerHTML = `<span class="cb-name">Summary (18 turns) · 9k</span><span class="cb-saved">−43k</span>`;
        } else {
          row.className = "cb-row is-heavy";
          row.innerHTML = `<span class="cb-name">Earlier 18 turns · 52k</span><button type="button" class="q is-main cb-act" data-act="compact">Compact</button>`;
          row.querySelector("button").addEventListener("click", () => compactTurns(true), { signal: ctx.signal });
        }
      }

      function syncMeter(immediate) {
        const { used, pct, free, saved } = totals();
        const figText = `${used}k used`;
        const pctText = `${pct} %`;
        const freeText = `${free}k free`;
        fillEl.style.setProperty("--p", (used / LIMIT).toFixed(4));
        meterEl.setAttribute("aria-valuenow", String(used));
        meterEl.setAttribute("aria-valuetext", `${used}k of 128k tokens used, ${pct} percent`);
        if (immediate) {
          figEl.textContent = figText;
          pctEl.textContent = pctText;
          freeEl.textContent = freeText;
        } else {
          ctx.swapText(figEl, figText);
          ctx.swapText(pctEl, pctText);
          ctx.swapText(freeEl, freeText);
        }
        if (saved > 0) {
          footEl.hidden = false;
          const noteText = `Freed ${saved}k tokens`;
          if (immediate) noteEl.textContent = noteText;
          else ctx.swapText(noteEl, noteText);
        } else {
          footEl.hidden = true;
        }
      }

      function settleRow(el) {
        if (!ctx.reduced() && el.animate) {
          el.animate([{ opacity: 0, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], { duration: 150, easing: PlainPlayer.EASE_OUT });
        }
      }

      function compactTurns(byUser) {
        if (compacted || busy) return;
        busy = true;
        compacted = true;
        syncMeter(false);
        const oldRow = listEl.querySelector('[data-row="turns"]');
        ctx.pareOut(oldRow, () => {
          busy = false;
          const next = document.createElement("div");
          next.dataset.row = "turns";
          renderTurnsRow(next);
          oldRow.replaceWith(next);
          settleRow(next);
          if (byUser) {
            const { used, pct } = totals();
            sr.textContent = `Compacted 18 turns to 9k summary. ${used}k used, ${pct} percent.`;
            const dropBtn = listEl.querySelector('[data-act="drop"]');
            (dropBtn || resetBtn).focus({ preventScroll: true });
          }
        });
      }

      function dropUnused(byUser) {
        if (dropped || busy) return;
        busy = true;
        dropped = true;
        syncMeter(false);
        const oldRow = listEl.querySelector('[data-row="files"]');
        ctx.pareOut(oldRow, () => {
          busy = false;
          const next = document.createElement("div");
          next.dataset.row = "files";
          renderFilesRow(next);
          oldRow.replaceWith(next);
          settleRow(next);
          if (byUser) {
            const { used, pct } = totals();
            sr.textContent = `Dropped 2 unused files, freed 14k tokens. ${used}k used, ${pct} percent.`;
            const compactBtn = listEl.querySelector('[data-act="compact"]');
            (compactBtn || resetBtn).focus({ preventScroll: true });
          }
        });
      }

      function reset(byUser) {
        if ((!compacted && !dropped) || busy) return;
        compacted = false;
        dropped = false;
        ctx.flip(host.querySelector(".cb"), () => {
          const fRow = listEl.querySelector('[data-row="files"]');
          const tRow = listEl.querySelector('[data-row="turns"]');
          renderFilesRow(fRow);
          renderTurnsRow(tRow);
          syncMeter(false);
        });
        if (byUser) {
          sr.textContent = "Restored full context, 104k used, 81 percent.";
          const compactBtn = listEl.querySelector('[data-act="compact"]');
          if (compactBtn) compactBtn.focus({ preventScroll: true });
        }
      }

      renderFilesRow(listEl.querySelector('[data-row="files"]'));
      renderTurnsRow(listEl.querySelector('[data-row="turns"]'));
      syncMeter(true);
      resetBtn.addEventListener("click", () => reset(true), { signal: ctx.signal });

      function cycle() {
        ctx.demoAfter(2200, () => {
          compactTurns(false);
          ctx.demoAfter(2200, () => {
            dropUnused(false);
            ctx.demoAfter(2500, () => {
              reset(false);
              cycle();
            });
          });
        });
      }
      cycle();
    },
  });
})();
