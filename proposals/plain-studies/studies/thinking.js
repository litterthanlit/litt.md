/* Thinking Trace, redesigned in Plain (Subtraction): while reasoning, three concise notes sit under one 1px left rule;
   the moment the answer lands, the scaffolding pares away into a single disclosure line above the plain two-sentence
   explanation. */
(function () {
  const NOTES = [
    { num: "01", text: 'Checked <span class="mono">parseCookie</span> in <span class="mono">session.ts:92</span>' },
    { num: "02", text: 'Expired token returns <span class="mono">null</span>, not an error' },
    { num: "03", text: '<span class="mono">guest()</span> runs whenever token is falsy' },
  ];

  let uid = 0;

  PlainPlayer.register({
    slug: "thinking",
    title: "Thinking Trace",
    tagline: "Reasoning notes that fold into one summary line.",
    css: `
.ps-thinking .th { width: min(100%, 420px); display: grid; gap: 14px }
.ps-thinking .th-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--line) }
.ps-thinking .th-head h3 { margin: 0; font: 500 var(--t-h3)/1.35 var(--font); letter-spacing: -0.01em }
.ps-thinking .th-status { font-size: var(--t-meta); color: var(--muted); white-space: nowrap; flex: none }
.ps-thinking .th-body { display: grid; gap: 14px }
.ps-thinking .th-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 22px; padding: 0 10px; font-size: var(--t-meta) }
.ps-thinking .th-notes { list-style: none; margin: 0; padding: 2px 0 2px 16px; border-left: 1px solid var(--line-control); display: grid; gap: 10px }
.ps-thinking .th-note { display: grid; grid-template-columns: 24px minmax(0, 1fr); align-items: baseline; gap: 8px; font-size: 14px; line-height: 1.45;
  color: var(--ink); opacity: 0.42; transition: opacity var(--dur-pare) var(--ease-out) }
.ps-thinking .th-note.is-live { opacity: 1 }
.ps-thinking .th-notes.is-expanded .th-note { opacity: 0.72 }
.ps-thinking .th-num { font-size: 12.5px; color: var(--muted) }
.ps-thinking .th-note .mono { font-size: 12.5px }
.ps-thinking .th-answer { margin: 0; font-size: 14px; line-height: 1.55; color: var(--ink) }
.ps-thinking .th-answer .mono { font-size: 12.5px }
.ps-thinking.is-tile .th { width: 100%; gap: 12px }
.ps-thinking.is-tile .th-body { gap: 12px }
.ps-thinking.is-tile .th-note { font-size: 13.5px }
.ps-thinking.is-tile .th-note .mono { font-size: 12px }
.ps-thinking.is-tile .th-answer { font-size: 13.5px; line-height: 1.5 }
`,
    mount(host, ctx) {
      const notesId = "ps-th-notes-" + ++uid;
      host.innerHTML = `
<div class="th">
  <div class="th-head">
    <h3>Why do expired sessions fall back to guest?</h3>
    <span class="th-status">Thinking · 3 s</span>
  </div>
  <div class="th-body">
    <div class="th-bar" hidden>
      <button type="button" class="q is-ink th-toggle" aria-expanded="false" aria-controls="${notesId}">Thought for 4 s · 3 notes</button>
      <button type="button" class="q th-replay">Think again</button>
    </div>
    <ol class="th-notes" id="${notesId}">
      ${NOTES.map((n, i) => `<li class="th-note${i === 2 ? " is-live" : ""}"><span class="th-num">${n.num}</span><span>${n.text}</span></li>`).join("")}
    </ol>
    <p class="th-answer" hidden>
      <span class="mono">parseCookie</span> returns <span class="mono">null</span> once max-age lapses, so <span class="mono">session.ts:92</span> treats an expired cookie like a missing one. Throw an expiry error before the <span class="mono">guest()</span> branch to require sign-in.
    </p>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const statusEl = host.querySelector(".th-status");
      const bodyEl = host.querySelector(".th-body");
      const barEl = host.querySelector(".th-bar");
      const toggleBtn = host.querySelector(".th-toggle");
      const replayBtn = host.querySelector(".th-replay");
      const notesEl = host.querySelector(".th-notes");
      const answerEl = host.querySelector(".th-answer");
      const sr = host.querySelector("[aria-live]");
      const noteEls = [...notesEl.querySelectorAll(".th-note")];

      let phase = "thinking";
      let openNotes = false;
      let busy = false;
      let runToken = 0;

      function restoreEl(el) {
        el.style.pointerEvents = "";
        if (el.getAnimations) el.getAnimations().forEach((a) => a.cancel());
        el.hidden = false;
      }

      function setLiveNote(idx) {
        notesEl.classList.remove("is-expanded");
        noteEls.forEach((li, i) => {
          li.hidden = i > idx;
          li.classList.toggle("is-live", i === idx);
        });
      }

      function landAnswer(byUser) {
        if (phase !== "thinking" || busy) return;
        phase = "done";
        busy = true;
        openNotes = false;
        runToken++;
        noteEls.forEach((li) => { li.hidden = false; li.classList.remove("is-live"); });
        ctx.swapText(statusEl, "Answered");
        ctx.pareOut(notesEl, () => {
          busy = false;
          if (phase !== "done") return;
          notesEl.hidden = true;
          barEl.hidden = false;
          toggleBtn.setAttribute("aria-expanded", "false");
          toggleBtn.classList.remove("is-on");
          restoreEl(answerEl);
          if (!ctx.reduced() && answerEl.animate) {
            answerEl.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 170, easing: PlainPlayer.EASE_OUT });
          }
          if (byUser) {
            sr.textContent = "Answered. Thought for 4 seconds, 3 notes folded.";
            toggleBtn.focus({ preventScroll: true });
          }
        });
      }

      function toggleNotes() {
        if (phase !== "done" || busy) return;
        openNotes = !openNotes;
        toggleBtn.setAttribute("aria-expanded", openNotes ? "true" : "false");
        toggleBtn.classList.toggle("is-on", openNotes);
        if (openNotes) {
          ctx.flip(bodyEl, () => {
            restoreEl(notesEl);
            notesEl.classList.add("is-expanded");
            noteEls.forEach((li) => { li.hidden = false; li.classList.remove("is-live"); });
          });
          if (!ctx.reduced() && notesEl.animate) {
            notesEl.animate([{ opacity: 0, transform: "translateY(-3px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 150, easing: PlainPlayer.EASE_OUT });
          }
          sr.textContent = "3 reasoning notes shown.";
        } else {
          ctx.pareOut(notesEl, () => {
            if (!openNotes && phase === "done") notesEl.hidden = true;
          });
          sr.textContent = "Reasoning notes hidden.";
        }
      }

      function startThinking(byUser) {
        if (busy) return;
        const myToken = ++runToken;
        phase = "thinking";
        openNotes = false;
        ctx.flip(bodyEl, () => {
          barEl.hidden = true;
          answerEl.hidden = true;
          restoreEl(notesEl);
          setLiveNote(0);
        });
        ctx.swapText(statusEl, "Thinking · 1 s");
        if (byUser) sr.textContent = "Thinking through 3 notes.";

        const step = byUser ? ctx.after : ctx.demoAfter;
        step(650, () => {
          if (runToken !== myToken || phase !== "thinking") return;
          ctx.flip(notesEl, () => setLiveNote(1));
          ctx.swapText(statusEl, "Thinking · 2 s");
          step(650, () => {
            if (runToken !== myToken || phase !== "thinking") return;
            ctx.flip(notesEl, () => setLiveNote(2));
            ctx.swapText(statusEl, "Thinking · 3 s");
            step(750, () => {
              if (runToken !== myToken || phase !== "thinking") return;
              landAnswer(byUser);
              if (!byUser) scheduleCycle();
            });
          });
        });
      }

      toggleBtn.addEventListener("click", toggleNotes, { signal: ctx.signal });
      replayBtn.addEventListener("click", () => startThinking(true), { signal: ctx.signal });

      ctx.onHand(() => {
        if (phase === "thinking") {
          const t = ++runToken;
          ctx.after(700, () => {
            if (runToken === t && phase === "thinking") landAnswer(false);
          });
        }
      });

      function scheduleCycle() {
        ctx.demoAfter(2800, () => {
          startThinking(false);
        });
      }

      if (ctx.reduced()) {
        phase = "done";
        notesEl.hidden = true;
        barEl.hidden = false;
        answerEl.hidden = false;
        statusEl.textContent = "Answered";
      } else {
        ctx.demoAfter(1800, () => {
          landAnswer(false);
          scheduleCycle();
        });
      }
    },
  });
})();
