/* Task Plan, redesigned in Plain (Subtraction): a three-branch agent plan where open sub-steps hang under a 1px left
   rule and one 4-corner frame tracks the running step. As branches complete, their sub-lists pare away into one quiet
   count so only unfinished work stays tall. */
(function () {
  const GROUPS = [
    {
      num: "1",
      title: "Inspect cookie parser",
      subs: ["Read src/auth/cookies.ts", "Audit session maxAge flags"],
    },
    {
      num: "2",
      title: "Enforce token TTL",
      subs: ["Reject expired JWTs", "Rotate refresh cookie"],
    },
    {
      num: "3",
      title: "Add integration tests",
      subs: ["Test 401 on stale cookie", "Run vitest src/auth/"],
    },
  ];
  const TOTAL = GROUPS.reduce((n, g) => n + g.subs.length, 0);

  PlainPlayer.register({
    slug: "agent-plan",
    title: "Task Plan",
    tagline: "Completed branches fold into one count.",
    css: `
.ps-agent-plan .ap { width: min(100%, 430px); display: grid; grid-template-columns: minmax(0, 1fr) }
.ps-agent-plan .ap-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; min-width: 0;
  padding-bottom: 10px; border-bottom: 1px solid var(--line) }
.ps-agent-plan .ap-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ps-agent-plan .ap-tally { font-size: 13px; color: var(--muted); white-space: nowrap }
.ps-agent-plan .ap-groups { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) }
.ps-agent-plan .ap-group { padding: 9px 0; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px;
  transition: opacity var(--dur-pare) var(--ease-out) }
.ps-agent-plan .ap-group:not(.is-active) { opacity: 0.45 }
.ps-agent-plan .ap-ghead { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; min-width: 0; font-size: 14px; line-height: 1.4 }
.ps-agent-plan .ap-gname { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink) }
.ps-agent-plan .ap-group.is-active .ap-gname { font-weight: 500; color: var(--ink) }
.ps-agent-plan .ap-gcount { font-size: 13px; color: var(--muted); white-space: nowrap }
.ps-agent-plan .ap-sub { list-style: none; margin: 0 0 0 6px; padding: 0 0 0 14px; border-left: 1px solid var(--line); display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px }
.ps-agent-plan .ap-step { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; min-width: 0; padding: 6px 8px; font-size: 14px; line-height: 1.4;
  transition: opacity var(--dur-pare) var(--ease-out) }
.ps-agent-plan .ap-step:not(.is-cur) { opacity: 0.42 }
.ps-agent-plan .ap-sname { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink) }
.ps-agent-plan .ap-step.is-cur .ap-sname { color: var(--ink); font-weight: 500 }
.ps-agent-plan .ap-sstate { font-size: 13px; color: var(--muted); white-space: nowrap }
.ps-agent-plan .ap-step.is-cur .ap-sstate { color: var(--ink); font-weight: 500 }
.ps-agent-plan .ap-foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-top: 10px }
.ps-agent-plan .ap-adv, .ps-agent-plan .ap-reset { min-height: 26px; font-size: 13px }
.ps-agent-plan .ap-adv { margin-left: 10px }
.ps-agent-plan .ap-reset { margin-right: 10px }
.ps-agent-plan.is-tile .ap { width: 100% }
.ps-agent-plan.is-tile .ap-head { padding-bottom: 8px }
.ps-agent-plan.is-tile .ap-group { padding: 8px 0; gap: 4px }
.ps-agent-plan.is-tile .ap-ghead { font-size: 13.5px }
.ps-agent-plan.is-tile .ap-sub { margin-left: 5px; padding-left: 12px; gap: 1px }
.ps-agent-plan.is-tile .ap-step { padding: 5px 7px; font-size: 13.5px }
.ps-agent-plan.is-tile .ap-foot { padding-top: 8px }
`,
    mount(host, ctx) {
      host.innerHTML = `
<div class="ap">
  <div class="ap-head">
    <h3>Auth hardening plan</h3>
    <span class="ap-tally">2 of 6 done</span>
  </div>
  <div class="ap-groups">
    ${GROUPS.map((g, gi) => {
      const base = gi * 2;
      return `
      <div class="ap-group" data-gi="${gi}">
        <div class="ap-ghead">
          <span class="ap-gname"></span>
          <span class="ap-gcount"></span>
        </div>
        <ul class="ap-sub">
          ${g.subs.map((s, si) => `<li class="ap-step" data-si="${base + si}"><span class="ap-sname">${s}</span><span class="ap-sstate"></span></li>`).join("")}
        </ul>
      </div>`;
    }).join("")}
  </div>
  <div class="ap-foot">
    <button type="button" class="q is-ink ap-adv">Advance step</button>
    <button type="button" class="q ap-reset">Reset</button>
  </div>
  <p class="sr-only" aria-live="polite"></p>
</div>`;

      const tallyEl = host.querySelector(".ap-tally");
      const groupsEl = host.querySelector(".ap-groups");
      const groupEls = [...groupsEl.querySelectorAll(".ap-group")];
      const stepEls = [...groupsEl.querySelectorAll(".ap-step")];
      const advBtn = host.querySelector(".ap-adv");
      const resetBtn = host.querySelector(".ap-reset");
      const sr = host.querySelector("[aria-live]");

      const frame = ctx.brackets(groupsEl, { padX: 0, padY: 0, exactPad: true });
      let doneCount = 2;
      let busy = false;

      function resyncFrameAfterFlip() {
        if (ctx.reduced()) return;
        ctx.after(225, () => {
          if (busy) return;
          const activeStepEl = doneCount < TOTAL ? stepEls[doneCount] : null;
          if (activeStepEl && activeStepEl.offsetParent !== null) frame.moveTo(activeStepEl, { immediate: true });
        });
      }

      function syncDOM(opts) {
        const o = opts || {};
        const tallyText = `${doneCount} of ${TOTAL} done`;
        if (o.immediate) tallyEl.textContent = tallyText;
        else ctx.swapText(tallyEl, tallyText);

        GROUPS.forEach((g, gi) => {
          const gEl = groupEls[gi];
          const gName = gEl.querySelector(".ap-gname");
          const gCount = gEl.querySelector(".ap-gcount");
          const subEl = gEl.querySelector(".ap-sub");
          const start = gi * 2;
          const subDone = Math.max(0, Math.min(g.subs.length, doneCount - start));
          const allGroupDone = subDone === g.subs.length;
          const isActiveGroup = doneCount >= start && doneCount < start + g.subs.length;
          const folded = !isActiveGroup;

          gEl.classList.toggle("is-done", allGroupDone);
          gEl.classList.toggle("is-active", isActiveGroup);

          if (folded) {
            gName.textContent = `${g.num}. ${g.title} · ${subDone} of ${g.subs.length} done`;
            gCount.textContent = "";
            subEl.hidden = true;
          } else {
            gName.textContent = `${g.num}. ${g.title}`;
            gCount.textContent = `${subDone} of ${g.subs.length} done`;
            subEl.hidden = false;
          }
          subEl.style.pointerEvents = "";
          if (subEl.getAnimations) subEl.getAnimations().forEach((a) => a.cancel());

          g.subs.forEach((_, si) => {
            const idx = start + si;
            const li = stepEls[idx];
            const st = li.querySelector(".ap-sstate");
            const isDone = idx < doneCount;
            const isCur = idx === doneCount;
            li.classList.toggle("is-done", isDone);
            li.classList.toggle("is-cur", isCur);
            st.textContent = isDone ? "Done" : isCur ? "Active" : "Queued";
          });
        });

        const allDone = doneCount >= TOTAL;
        advBtn.disabled = allDone;
        advBtn.classList.toggle("is-ink", !allDone);
        resetBtn.classList.toggle("is-ink", allDone);

        const activeStepEl = doneCount < TOTAL ? stepEls[doneCount] : null;
        if (activeStepEl && activeStepEl.offsetParent !== null) {
          frame.moveTo(activeStepEl, { immediate: !!o.immediate });
        } else {
          frame.pare();
        }
      }

      function advance(byUser) {
        if (busy || doneCount >= TOTAL) return;
        const prevStepIdx = doneCount;
        const gi = Math.floor(prevStepIdx / 2);
        const completesGroup = prevStepIdx % 2 === 1;
        doneCount += 1;

        if (completesGroup && !ctx.reduced()) {
          busy = true;
          const subEl = groupEls[gi].querySelector(".ap-sub");
          frame.pare();
          ctx.pareOut(subEl, () => {
            busy = false;
            ctx.flip(host.querySelector(".ap"), () => {
              syncDOM({ immediate: false });
            });
            resyncFrameAfterFlip();
            if (byUser) {
              sr.textContent = `Completed ${GROUPS[gi].title}, 2 of 2 done. ${doneCount} of ${TOTAL} done.`;
              if (doneCount >= TOTAL) resetBtn.focus({ preventScroll: true });
            }
          });
          return;
        }

        syncDOM({ immediate: false });
        if (byUser) {
          sr.textContent = `${doneCount} of ${TOTAL} steps done.`;
          if (doneCount >= TOTAL) resetBtn.focus({ preventScroll: true });
        }
      }

      function reset(byUser) {
        if (busy || doneCount === 2) return;
        doneCount = 2;
        ctx.flip(host.querySelector(".ap"), () => {
          syncDOM({ immediate: false });
        });
        resyncFrameAfterFlip();
        if (byUser) {
          sr.textContent = "Plan reset to 2 of 6 done.";
          advBtn.focus({ preventScroll: true });
        }
      }

      advBtn.addEventListener("click", () => advance(true), { signal: ctx.signal });
      resetBtn.addEventListener("click", () => reset(true), { signal: ctx.signal });

      syncDOM({ immediate: true });

      function cycle() {
        ctx.demoAfter(1800, () => {
          advance(false);
          ctx.demoAfter(1600, () => {
            advance(false);
            ctx.demoAfter(1800, () => {
              advance(false);
              ctx.demoAfter(1600, () => {
                advance(false);
                ctx.demoAfter(2400, () => {
                  reset(false);
                  cycle();
                });
              });
            });
          });
        });
      }
      cycle();
    },
  });
})();
