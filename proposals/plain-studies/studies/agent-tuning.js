/* Agent Tuning, redesigned in Plain (Subtraction): three presets share one living 4-corner frame above three 1px
   hairline sliders; touching any thumb follows 1:1 and pares the preset frame away into Custom · Reset. */
(function () {
  const PRESETS = [
    { key: "patch", label: "Patch", vals: { budget: 4, workers: 1, files: 3 } },
    { key: "refactor", label: "Refactor", vals: { budget: 8, workers: 2, files: 6 } },
    { key: "audit", label: "Audit", vals: { budget: 24, workers: 4, files: 16 } },
  ];

  const SLIDERS = [
    {
      key: "budget",
      label: "Reasoning budget",
      min: 0,
      max: 32,
      step: 1,
      fmt: (v) => (v === 0 ? "0 tok" : `${v}k tok`),
      speech: (v) => (v === 0 ? "0 tokens" : `${v} thousand tokens`),
    },
    {
      key: "workers",
      label: "Parallel workers",
      min: 1,
      max: 6,
      step: 1,
      fmt: (v) => `${v} ${v === 1 ? "agent" : "agents"}`,
      speech: (v) => `${v} ${v === 1 ? "agent" : "agents"}`,
    },
    {
      key: "files",
      label: "Max touched files",
      min: 1,
      max: 20,
      step: 1,
      fmt: (v) => `${v} ${v === 1 ? "file" : "files"}`,
      speech: (v) => `${v} ${v === 1 ? "file" : "files"}`,
    },
  ];
  let uid = 0;

  PlainPlayer.register({
    slug: "agent-tuning",
    title: "Agent Tuning",
    tagline: "Presets and three hairline sliders for agent scope.",
    css: `
.ps-agent-tuning .at { width: min(100%, 400px); display: grid }
.ps-agent-tuning .at-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 12px;
  padding: 0 0 8px; border-bottom: 1px solid var(--line) }
.ps-agent-tuning .at-presets { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 24px; padding: 2px 9px }
.ps-agent-tuning .at-presets .q { min-height: 24px }
.ps-agent-tuning .at-presets .q[aria-checked="true"] { font-weight: 500; color: var(--ink) }
.ps-agent-tuning .at-custom { display: inline-flex; align-items: center; gap: 6px; padding-right: 10px; font-size: 13px; color: var(--muted) }
.ps-agent-tuning .at-est { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums }
.ps-agent-tuning .at-rows { display: grid }
.ps-agent-tuning .at-row { display: grid; gap: 6px; padding: 10px 0 8px; border-bottom: 1px solid var(--line) }
.ps-agent-tuning .at-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 14px }
.ps-agent-tuning .at-name { color: var(--ink) }
.ps-agent-tuning .at-val { font-weight: 500; color: var(--ink); font-variant-numeric: tabular-nums }
.ps-agent-tuning .at-slider { position: relative; height: 24px; cursor: pointer; touch-action: none; user-select: none; -webkit-tap-highlight-color: transparent }
.ps-agent-tuning .at-slider:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }
.ps-agent-tuning .at-rail { position: absolute; left: 0; right: 0; top: 50%; height: 1px; margin-top: -0.5px; background: var(--line-control); overflow: hidden; pointer-events: none }
.ps-agent-tuning .at-fill { display: block; width: 100%; height: 100%; background: var(--ink); transform-origin: left center; transform: scaleX(0); will-change: transform }
.ps-agent-tuning .at-thumb { position: absolute; left: 0; top: 50%; width: 10px; height: 10px; margin-top: -5px; background: var(--ink);
  pointer-events: none; will-change: transform }
.ps-agent-tuning.is-tile .at { width: 100% }
.ps-agent-tuning.is-tile .at-top { padding-bottom: 6px; gap: 2px 10px }
.ps-agent-tuning.is-tile .at-custom .q { min-height: 26px }
.ps-agent-tuning.is-tile .at-row { padding: 9px 0 7px; gap: 4px }
.ps-agent-tuning.is-tile .at-slider { height: 22px }
`,
    mount(host, ctx) {
      const id = "ps-at-" + ++uid;
      host.innerHTML = `
<div class="at">
  <div class="at-top">
    <div class="at-presets" role="radiogroup" aria-label="Agent tuning presets">
      ${PRESETS.map((p) => `<button type="button" class="q in-frame" role="radio" aria-checked="false" tabindex="-1" data-preset="${p.key}">${p.label}</button>`).join("")}
    </div>
    <span class="at-est"></span>
    <span class="at-custom" hidden><span>Custom ·</span><button type="button" class="q at-reset">Reset</button></span>
  </div>
  <div class="at-rows">
    ${SLIDERS.map((s) => `
    <div class="at-row">
      <div class="at-meta">
        <span class="at-name" id="${id}-${s.key}">${s.label}</span>
        <span class="at-val" data-val="${s.key}"></span>
      </div>
      <div class="at-slider" role="slider" tabindex="0" data-slider="${s.key}"
        aria-labelledby="${id}-${s.key}" aria-valuemin="${s.min}" aria-valuemax="${s.max}" aria-valuenow="0" aria-valuetext="">
        <span class="at-rail" aria-hidden="true"><span class="at-fill"></span></span>
        <span class="at-thumb" aria-hidden="true"></span>
      </div>
    </div>`).join("")}
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const presetsEl = host.querySelector(".at-presets");
      const radios = [...presetsEl.querySelectorAll('[role="radio"]')];
      const estEl = host.querySelector(".at-est");
      const customEl = host.querySelector(".at-custom");
      const resetBtn = host.querySelector(".at-reset");
      const sr = host.querySelector("[aria-live]");
      const frame = ctx.brackets(presetsEl, { padX: 9, padY: 2, exactPad: true });

      let presetIdx = 1;
      let lastPresetIdx = 1;
      const state = { budget: 8, workers: 2, files: 6 };
      const controls = {};

      function costText() {
        const cents = Math.max(1, Math.round(state.budget * 0.55 + state.workers * 0.9 + state.files * 0.15));
        return `~$${(cents / 100).toFixed(2)} est.`;
      }

      function syncHeader(immediate) {
        if (presetIdx >= 0) {
          customEl.hidden = true;
          estEl.hidden = false;
          const next = costText();
          if (immediate) estEl.textContent = next;
          else ctx.swapText(estEl, next);
        } else {
          estEl.hidden = true;
          customEl.hidden = false;
        }
      }

      function enterCustom() {
        if (presetIdx >= 0) {
          lastPresetIdx = presetIdx;
          presetIdx = -1;
          radios.forEach((btn, i) => {
            btn.setAttribute("aria-checked", "false");
            btn.tabIndex = i === lastPresetIdx ? 0 : -1;
          });
          frame.pare();
        }
        syncHeader(false);
      }

      for (const spec of SLIDERS) {
        const sliderEl = host.querySelector(`[data-slider="${spec.key}"]`);
        const valEl = host.querySelector(`[data-val="${spec.key}"]`);
        const fillEl = sliderEl.querySelector(".at-fill");
        const thumbEl = sliderEl.querySelector(".at-thumb");
        const span = spec.max - spec.min;

        const paint = (p) => {
          const clamped = Math.max(0, Math.min(1, p));
          const travel = Math.max(0, sliderEl.clientWidth - 10);
          thumbEl.style.transform = `translate3d(${(clamped * travel).toFixed(2)}px, 0, 0)`;
          fillEl.style.transform = `scaleX(${clamped.toFixed(4)})`;
        };

        const sp = ctx.spring((state[spec.key] - spec.min) / span, paint, { duration: 0.2 });

        const syncMeta = (v) => {
          state[spec.key] = v;
          valEl.textContent = spec.fmt(v);
          sliderEl.setAttribute("aria-valuenow", String(v));
          sliderEl.setAttribute("aria-valuetext", spec.speech(v));
        };

        syncMeta(state[spec.key]);
        requestAnimationFrame(() => { if (!ctx.signal.aborted) paint(sp.value()); });

        if (typeof ResizeObserver !== "undefined") {
          const ro = new ResizeObserver(() => paint(sp.value()));
          ro.observe(sliderEl);
          ctx.signal.addEventListener("abort", () => ro.disconnect(), { once: true });
        }

        let dragging = false;
        const fromPointer = (e) => {
          const rect = sliderEl.getBoundingClientRect();
          const rawP = Math.max(0, Math.min(1, (e.clientX - rect.left - 5) / Math.max(1, rect.width - 10)));
          const snapped = Math.round((spec.min + rawP * span) / spec.step) * spec.step;
          const v = Math.max(spec.min, Math.min(spec.max, snapped));
          sp.jump(rawP);
          syncMeta(v);
          enterCustom();
        };

        sliderEl.addEventListener("pointerdown", (e) => {
          if (e.button !== 0 && e.pointerType === "mouse") return;
          e.preventDefault();
          dragging = true;
          sliderEl.focus({ preventScroll: true });
          try { sliderEl.setPointerCapture(e.pointerId); } catch (err) {}
          fromPointer(e);
        }, { signal: ctx.signal });

        sliderEl.addEventListener("pointermove", (e) => {
          if (!dragging) return;
          fromPointer(e);
        }, { signal: ctx.signal });

        const finishDrag = () => {
          if (!dragging) return;
          dragging = false;
          sp.set((state[spec.key] - spec.min) / span);
          sr.textContent = `${spec.label}: ${spec.speech(state[spec.key])}`;
        };
        sliderEl.addEventListener("pointerup", finishDrag, { signal: ctx.signal });
        sliderEl.addEventListener("pointercancel", finishDrag, { signal: ctx.signal });
        sliderEl.addEventListener("lostpointercapture", finishDrag, { signal: ctx.signal });

        sliderEl.addEventListener("keydown", (e) => {
          let next = state[spec.key];
          const big = Math.max(1, Math.round(span / 5));
          if (e.key === "ArrowRight" || e.key === "ArrowUp") next += spec.step;
          else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next -= spec.step;
          else if (e.key === "PageUp") next += big;
          else if (e.key === "PageDown") next -= big;
          else if (e.key === "Home") next = spec.min;
          else if (e.key === "End") next = spec.max;
          else return;
          e.preventDefault();
          next = Math.max(spec.min, Math.min(spec.max, next));
          if (next === state[spec.key] && presetIdx < 0) return;
          syncMeta(next);
          sp.set((next - spec.min) / span);
          enterCustom();
          sr.textContent = `${spec.label}: ${spec.speech(next)}`;
        }, { signal: ctx.signal });

        controls[spec.key] = {
          set(v, immediate) {
            syncMeta(v);
            const p = (v - spec.min) / span;
            if (immediate) sp.jump(p);
            else sp.set(p);
          },
        };
      }

      function selectPreset(idx, opts) {
        const o = Object.assign({ immediate: false, byUser: false, focusRadio: false }, opts);
        presetIdx = idx;
        lastPresetIdx = idx;
        const p = PRESETS[idx];
        radios.forEach((btn, i) => {
          const on = i === idx;
          btn.setAttribute("aria-checked", on ? "true" : "false");
          btn.tabIndex = on ? 0 : -1;
          if (on && o.focusRadio) btn.focus({ preventScroll: true });
        });
        frame.moveTo(radios[idx], { immediate: o.immediate });
        for (const s of SLIDERS) {
          controls[s.key].set(p.vals[s.key], o.immediate);
        }
        syncHeader(o.immediate);
        if (o.byUser) {
          sr.textContent = `${p.label} preset: ${controlsText(p.vals)}`;
        }
      }

      function controlsText(v) {
        return `${v.budget === 0 ? "0" : v.budget + "k"} tok, ${v.workers} ${v.workers === 1 ? "agent" : "agents"}, ${v.files} ${v.files === 1 ? "file" : "files"}`;
      }

      radios.forEach((btn, i) => {
        btn.addEventListener("click", () => selectPreset(i, { byUser: true }), { signal: ctx.signal });
      });

      presetsEl.addEventListener("keydown", (e) => {
        const base = presetIdx >= 0 ? presetIdx : lastPresetIdx;
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (base + 1) % PRESETS.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (base - 1 + PRESETS.length) % PRESETS.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = PRESETS.length - 1;
        if (next >= 0) {
          e.preventDefault();
          selectPreset(next, { byUser: true, focusRadio: true });
        }
      }, { signal: ctx.signal });

      resetBtn.addEventListener("click", () => {
        selectPreset(lastPresetIdx, { byUser: true, focusRadio: true });
      }, { signal: ctx.signal });

      selectPreset(1, { immediate: true });

      const seq = [2, 0, 1];
      let step = 0;
      ctx.demoAfter(1800, () => {
        const run = () => selectPreset(seq[step++ % seq.length]);
        run();
        ctx.demoEvery(2400, run);
      });
    },
  });
})();
