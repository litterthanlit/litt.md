/* Agent Run, redesigned for Flat: one agent turn on a writer's draft, start to finish. Your request sits in a grey bubble;
   the agent thinks with a live timer, runs three steps whose grey circles become ink checks, folds the work into
   "Thought for 4s", then streams its answer behind a caret. Screen readers hear each phase, not every word. */
(function () {
  const STEPS = [
    { verb: "Read", target: "Spring issue", detail: "412 words" },
    { verb: "Search", target: "reader letters", detail: "4 found" },
    { verb: "Edit", target: "Spring issue", detail: '<span class="ar-add">+18</span> <span class="ar-del">−9</span>', label: "18 lines added, 9 removed" },
  ];
  const ANSWER = "I tightened the intro and moved two reader letters up, so the issue opens with what people wrote in.";
  const ASK = "Make the spring issue open stronger";
  let n = 0;
  const THINK = 1400, STEP = 900, WORD = 45, LOOP_AFTER = 3500;
  const words = ANSWER.split(/(?<=\s)/);

  FlatPlayer.register({
    slug: "agent-run",
    title: "Agent Run",
    tagline: "Think, run tools, fold it away, stream the answer.",
    css: `
.fs-agent-run .ar { width: min(27em, 100%); background: var(--paper); border-radius: var(--r-paper); padding: 1em 1.2em 1.2em; font-size: clamp(13px, calc(2.2cqw + 6px), 15px); line-height: 1.5 }
.fs-agent-run.is-tile .ar { padding: 0.9em 1.1em 1em }
.fs-agent-run .ar-ask { justify-self: end; display: block; width: fit-content; max-width: 85%; margin: 0 0 0.75em auto; padding: 0.55em 1em; border-radius: 1.25em; background: var(--bubble) }
.fs-agent-run.is-tile .ar-ask { display: none }
.fs-agent-run .ar-row { display: flex; align-items: center; gap: 8px; margin: 0 -8px; min-height: 36px }
.fs-agent-run .ar-head { flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 8px; padding: 6px 8px; border: 0; border-radius: 12px;
  background: transparent; text-align: left; cursor: pointer; min-height: 36px; transition: background-color var(--dur-instant) }
.fs-agent-run .ar-head:disabled { cursor: default }
.fs-agent-run .ar-head:not(:disabled):hover { background: var(--wash) }
.fs-agent-run .ar-now { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500 }
.fs-agent-run .ar-shimmer { background-image: linear-gradient(90deg, var(--muted) 0%, var(--muted) 40%, var(--ink) 50%, var(--muted) 60%, var(--muted) 100%);
  background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: ar-shimmer 1.6s linear infinite }
@keyframes ar-shimmer { from { background-position: 100% 0 } to { background-position: -100% 0 } }
@media (prefers-reduced-motion: reduce) { .fs-agent-run .ar-shimmer { animation: none; color: var(--muted); background: none } }
.fs-agent-run .ar-target { margin-left: 0.4em; color: var(--muted) }
.fs-agent-run .ar-time { margin-left: auto; font-size: 0.87em; color: var(--muted); font-variant-numeric: tabular-nums }
.fs-agent-run .ar-folded { color: var(--muted) }
.fs-agent-run .ar-chev { width: 14px; height: 14px; color: var(--muted); flex: none; transition: transform 210ms cubic-bezier(0.23, 1, 0.32, 1) }
.fs-agent-run .ar-head[aria-expanded="true"] .ar-chev { transform: rotate(90deg) }
.fs-agent-run .ar-fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows 400ms cubic-bezier(0.23, 1, 0.32, 1), opacity 400ms cubic-bezier(0.23, 1, 0.32, 1) }
.fs-agent-run .ar-fold.is-open { grid-template-rows: 1fr; opacity: 1 }
.fs-agent-run .ar-steps { min-height: 0; overflow: hidden; list-style: none; margin: 0; padding: 0 }
.fs-agent-run .ar-step { position: relative; display: flex; align-items: center; gap: 10px; padding-top: 0.6em; min-width: 0 }
.fs-agent-run .ar-step + .ar-step::before { content: ""; position: absolute; left: 9.25px; top: 0; height: 0.6em; width: 1.5px; border-radius: 1px; background: var(--line) }
.fs-agent-run .ar-icon { position: relative; flex: none; width: 20px; height: 20px }
.fs-agent-run .ar-icon svg { position: absolute; inset: 0; width: 100%; height: 100% }
.fs-agent-run .ar-spin { animation: ar-spin 0.8s linear infinite; transition: opacity 150ms }
@keyframes ar-spin { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .fs-agent-run .ar-spin { animation: none } }
.fs-agent-run .ar-disc { position: absolute; inset: 0; border-radius: 50%; background: var(--ink); transform: scale(0.6); opacity: 0;
  transition: transform 250ms cubic-bezier(0.34, 1.36, 0.64, 1), opacity 150ms }
.fs-agent-run .ar-check path { stroke: var(--on-ink); stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 400ms cubic-bezier(0.23, 1, 0.32, 1) 80ms }
.fs-agent-run .is-done .ar-spin { opacity: 0 }
.fs-agent-run .is-done .ar-disc { transform: none; opacity: 1 }
.fs-agent-run .is-done .ar-check path { stroke-dashoffset: 0 }
.fs-agent-run .ar-verb { font-weight: 500; flex: none }
.fs-agent-run .ar-step .ar-target { margin: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.fs-agent-run .ar-detail { margin-left: auto; flex: none; font-size: 0.87em; color: var(--muted); font-variant-numeric: tabular-nums }
.fs-agent-run .ar-add { color: var(--ink) } .fs-agent-run .ar-del { color: var(--muted) }
.fs-agent-run .ar-enter { animation: ar-enter 210ms cubic-bezier(0.23, 1, 0.32, 1) both }
@keyframes ar-enter { from { opacity: 0; transform: translateY(4px) } }
@media (prefers-reduced-motion: reduce) { .fs-agent-run .ar-enter { animation: none } }
.fs-agent-run .ar-answer { margin: 0.85em 0 0; color: var(--ink) }
.fs-agent-run .ar-answer:empty { display: none }
.fs-agent-run .ar-caret { display: inline-block; width: 2px; height: 1.05em; margin-left: 2px; transform: translateY(2px); border-radius: 1px; background: var(--ink); animation: ar-caret 1s steps(1) infinite }
@keyframes ar-caret { 50% { opacity: 0 } }
.fs-agent-run .ar-again { flex: none; margin-right: 8px; height: 2.2em; padding: 0 1.1em; border: 0; border-radius: var(--r-pill); background: var(--bubble); font-weight: 500; font-size: 0.93em; cursor: pointer;
  transition: transform 100ms, background-color var(--dur-instant) }
.fs-agent-run .ar-again:active { transform: scale(0.97) }
.fs-agent-run .ar-again[hidden] { display: none }
`,
    mount(host, ctx) {
      const id = "ar" + ++n;
      host.innerHTML = `
<section class="ar" aria-label="Agent">
  <p class="ar-ask"></p>
  <p class="sr-only" aria-live="polite"></p>
  <div class="ar-row"><button class="ar-head" type="button" aria-expanded="true" aria-controls="${id}-fold"></button><button class="ar-again" type="button" hidden>Run again</button></div>
  <div class="ar-fold" id="${id}-fold"><ol class="ar-steps"></ol></div>
  <p class="ar-answer"></p>
</section>`;
      host.querySelector(".ar-ask").textContent = ASK;
      const root = host.querySelector(".ar"), live = host.querySelector("[aria-live]"), head = host.querySelector(".ar-head");
      const fold = host.querySelector(".ar-fold"), list = host.querySelector(".ar-steps"), answer = host.querySelector(".ar-answer"), again = host.querySelector(".ar-again");
      const sig = { signal: ctx.signal };

      let phase = "thinking", revealed = 0, finished = 0, streamed = 0, open = true, seconds = 0, started = 0;
      let timers = [], ticker = 0, looping = true, run = 0;
      const at = (ms, fn) => timers.push(ctx.after(ms, fn));
      const clear = () => { timers.forEach(clearTimeout); timers = []; if (ticker) clearInterval(ticker); ticker = 0; };
      const busy = () => phase === "thinking" || phase === "working";

      function drawHead() {
        const cur = STEPS[Math.max(0, revealed - 1)];
        head.disabled = busy();
        head.setAttribute("aria-expanded", String(open));
        if (busy()) {
          head.innerHTML = '<span class="ar-now"><span class="ar-shimmer"></span>' + (phase === "working" ? '<span class="ar-target"></span>' : "") +
            '</span><span class="ar-time"></span>';
          head.querySelector(".ar-shimmer").textContent = phase === "thinking" ? "Thinking" : cur.verb;
          if (phase === "working") head.querySelector(".ar-target").textContent = cur.target;
          head.querySelector(".ar-time").textContent = seconds + "s";
        } else {
          head.innerHTML = '<span class="ar-folded"></span><svg class="ar-chev" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 4 4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          head.querySelector(".ar-folded").textContent = "Thought for " + seconds + "s";
        }
        fold.classList.toggle("is-open", open && revealed > 0);
        root.setAttribute("aria-busy", String(busy()));
      }
      function drawSteps() {
        while (list.children.length < revealed) {
          const s = STEPS[list.children.length];
          const li = document.createElement("li");
          li.className = "ar-step" + (ctx.reduced() ? "" : " ar-enter");
          li.innerHTML = '<span class="ar-icon" aria-hidden="true">' +
            '<svg class="ar-spin" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="var(--bubble)" stroke-width="2.5"/><path d="M17.5 10A7.5 7.5 0 0 0 10 2.5" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/></svg>' +
            '<span class="ar-disc"></span><svg class="ar-check" viewBox="0 0 20 20" fill="none"><path pathLength="1" d="m6 10.4 2.7 2.6L14 7.4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
            '<span class="ar-verb"></span><span class="ar-target"></span>';
          li.querySelector(".ar-verb").textContent = s.verb;
          li.querySelector(".ar-target").textContent = s.target;
          list.appendChild(li);
        }
        while (list.children.length > revealed) list.lastChild.remove();
        [...list.children].forEach((li, i) => {
          const done = i < finished;
          li.classList.toggle("is-done", done);
          if (done && !li.querySelector(".ar-detail")) {
            const d = document.createElement("span");
            d.className = "ar-detail" + (ctx.reduced() ? "" : " ar-enter");
            d.innerHTML = STEPS[i].detail;
            if (STEPS[i].label) d.setAttribute("aria-label", STEPS[i].label);
            li.appendChild(d);
          }
        });
      }
      function drawAnswer() {
        answer.textContent = words.slice(0, streamed).join("");
        if (phase === "answering" && streamed > 0) { const c = document.createElement("span"); c.className = "ar-caret"; c.setAttribute("aria-hidden", "true"); answer.appendChild(c); }
      }
      function draw() {
        drawHead(); drawSteps(); drawAnswer();
        again.hidden = !(phase === "done" && !looping && !ctx.reduced());
        const cur = STEPS[Math.max(0, revealed - 1)];
        const said = busy() ? (phase === "thinking" ? "Thinking" : cur.verb + " " + cur.target) : phase === "done" ? "Answer ready. " + ANSWER : "";
        if (live.textContent !== said) live.textContent = said;
      }
      function startTicker() {
        if (ticker) return;
        ticker = ctx.every(250, () => {
          if (!busy()) { clearInterval(ticker); ticker = 0; return; }
          const s = Math.floor((Date.now() - started) / 1000);
          if (s !== seconds) { seconds = s; drawHead(); }
        });
      }

      /* The script: each phase schedules the next. */
      function script() {
        clear();
        if (ctx.reduced()) {
          phase = "done"; revealed = finished = STEPS.length; streamed = words.length; open = false;
          seconds = Math.round((THINK + STEPS.length * STEP) / 1000); draw(); return;
        }
        run++;
        started = Date.now(); phase = "thinking"; revealed = finished = streamed = 0; open = true; seconds = 0;
        list.textContent = ""; draw(); startTicker();
        let t = THINK;
        STEPS.forEach((_, i) => {
          at(t, () => { phase = "working"; revealed = i + 1; draw(); });
          t += STEP;
          at(t, () => { finished = i + 1; drawSteps(); });
        });
        at(t + 250, () => { seconds = Math.max(1, Math.round((Date.now() - started) / 1000)); phase = "answering"; open = false; draw(); });
        t += 500;
        words.forEach((_, i) => at(t + i * WORD, () => { streamed = i + 1; drawAnswer(); }));
        t += words.length * WORD;
        at(t, () => { phase = "done"; draw(); if (!looping) again.hidden = false; });
        at(t + LOOP_AFTER, () => { if (looping) script(); });
      }

      head.addEventListener("click", () => { if (busy()) return; open = !open; drawHead(); }, sig);
      again.addEventListener("click", () => { script(); head.focus({ preventScroll: true }); }, sig);
      /* A hand ends the loop: this turn plays out and stays, and Run again is the hand's to press. */
      ctx.onHand(() => { looping = false; if (phase === "done") again.hidden = ctx.reduced(); });
      script();
      return { destroy: clear };
    },
  });
})();
