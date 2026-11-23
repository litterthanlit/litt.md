/* Agent Status, after litterthanlit/components (agent-status.tsx), redesigned in Flat.
 * An agent's run as one card of paper: the task and the state in words, the time the run has been live as the one
 * large figure (it holds while a call waits on your OK and stops on the tenth Stop goes down), what it's doing now,
 * typed on, and three pills for the phases it passes through: outlined until reached, grey once passed, ink while
 * it's there. The ink breathes with each chunk of tokens through a 90ms detector, so a stall goes quiet. Under them
 * sit the actions, only the ones that apply: Run (or Retry, or Run again) in the ink; Stop; and Allow in the ink
 * when a call waits on you, growing in beside Stop. A ghost runs three tasks until a hand arrives. Escape stops. */
(function () {
  const PHASES = [{ key: "thinking", name: "Think" }, { key: "tool", name: "Use tools" }, { key: "writing", name: "Write" }];
  const DECAY = 0.09; // s: the detector's release
  const FLOOR = 0.55; // the current pill's strength with no tokens arriving
  let uid = 0;

  const isLive = (s) => s === "thinking" || s === "tool" || s === "writing";
  const isEnd = (s) => s === null || s === "ready" || s === "done" || s === "error" || s === "stopped";
  const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const lineOf = (step) => (step ? [step.verb, step.target].filter(Boolean).join(" ") : "");
  const WORDS = { ready: "Ready", thinking: "Thinking", tool: "Using a tool", writing: "Writing", waiting: "Needs your OK", done: "Done", error: "Didn't finish", stopped: "Stopped" };

  function sayFor(state, line) {
    const w = (word) => (line ? `${word}: ${line}` : word);
    if (state === "thinking") return w("Thinking");
    if (state === "tool") return line || "Running a tool";
    if (state === "writing") return w("Writing");
    if (state === "waiting") return w("Waiting for your OK");
    if (state === "done") return w("Done");
    if (state === "error") return w("Error");
    if (state === "stopped") return "Stopped";
    return "";
  }

  /* --- The demo: three tasks on a small site, and a ghost at the keys. --- */
  const cue = (wait, state, verb, target) => ({ wait, state, verb, target });
  const RUNS = [
    {
      task: "Tidy the drafts",
      cues: [
        cue(0, "thinking", "Planning", "the tidy-up"),
        cue(950, "tool", "Reading", "12 drafts"),
        cue(600, "tool", "Looking for", "duplicates"),
        cue(600, "thinking", "Comparing", "two drafts"),
        cue(650, "tool", "Delete", "“Spring notes (copy)”"),
        cue(120, "waiting", "Delete", "“Spring notes (copy)”"),
        cue(0, "tool", "Delete", "“Spring notes (copy)”"), // allowed: the same call goes on
        cue(600, "tool", "Retitling", "“Untitled 4”"),
        cue(600, "writing", "Writing", "a note for you"),
        cue(1700, "done", "Tidied", "12 drafts, 1 deleted"),
      ],
    },
    {
      task: "Send issue 05",
      cues: [
        cue(0, "thinking", "Planning", "the send"),
        cue(900, "tool", "Resizing", "the cover"),
        cue(700, "tool", "Sending to", "2,140 readers"),
        cue(1100, "error", "Too many at once.", "Try again in a moment"),
      ],
      retry: [
        cue(0, "thinking", "Waiting out", "the limit"),
        cue(800, "tool", "Splitting", "readers into 3 batches"),
        cue(700, "tool", "Sending to", "2,140 readers"),
        cue(900, "done", "Sent", "to 2,140 readers"),
      ],
    },
    {
      task: "Summarise a post",
      cues: [
        cue(0, "thinking", "Planning", "the summary"),
        cue(800, "tool", "Reading", "“Spring notes”"),
        cue(600, "writing", "Writing", "the summary"),
        { wait: 1500, ghost: "stop" }, // the ghost stops it mid-stream; under a hand, the agent finishes
        cue(1500, "done", "Wrote", "a 212-word summary"),
      ],
    },
  ];
  const GHOST = { ready: 700, waiting: 1500, error: 2200, done: 2600, stopped: 2000 };
  const FIRST_PRESS = 280;
  const chunk = (state) => (state === "writing" ? 8 + Math.floor(Math.random() * 13) : 3 + Math.floor(Math.random() * 7));

  const css = `
.fs-agent-status [hidden] { display: none !important; }
.fs-agent-status .as { width: min(100%, 420px); background: var(--paper); border-radius: var(--r-paper); padding: 20px; display: grid; gap: 16px;
  -webkit-user-select: none; user-select: none; }
.fs-agent-status .as-head { display: flex; align-items: baseline; gap: 12px; min-width: 0; }
.fs-agent-status .as-task { flex: 1; min-width: 0; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fs-agent-status .as-state { flex: none; font-size: 14px; color: var(--muted); }
.fs-agent-status [data-state="thinking"] .as-state, .fs-agent-status [data-state="tool"] .as-state,
.fs-agent-status [data-state="writing"] .as-state, .fs-agent-status [data-state="waiting"] .as-state { color: var(--ink); font-weight: 500; }
.fs-agent-status [data-state="done"] .as-state { color: var(--ink); font-weight: 500; }
.fs-agent-status [data-state="error"] .as-state { color: var(--cherry-text); font-weight: 500; }
.fs-agent-status .as-mid { display: grid; gap: 6px; }
.fs-agent-status .as-figure { display: flex; align-items: baseline; gap: 12px; }
.fs-agent-status .as-time { margin: 0; font-size: 48px; font-weight: 600; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums;
  transition: color 150ms; }
.fs-agent-status [data-state="waiting"] .as-time, .fs-agent-status [data-state="stopped"] .as-time { color: var(--muted); }
.fs-agent-status .as-tokens { margin-left: auto; font-size: 14px; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.fs-agent-status .as-line { margin: 0; height: 1.4em; line-height: 1.4; min-width: 0; overflow: hidden; }
.fs-agent-status .as-l { display: inline-block; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: top; }
.fs-agent-status .as-target { color: var(--muted); }
.fs-agent-status .as-caret { display: inline-block; width: 2px; height: 1em; margin-left: 3px; border-radius: 1px; background: var(--ink);
  transform: translateY(0.16em); animation: fs-as-caret 1s steps(1) infinite; }
@keyframes fs-as-caret { 50% { opacity: 0; } }
.fs-agent-status .as-phases { display: flex; gap: 6px; }
.fs-agent-status .as-phase { flex: 1 1 0; min-width: 0; height: 32px; display: grid; place-items: center; border-radius: var(--r-pill);
  font-size: 13px; font-weight: 500; white-space: nowrap; color: var(--muted); box-shadow: inset 0 0 0 1.5px var(--outline);
  transition: background-color 150ms, color 150ms, box-shadow 150ms; }
.fs-agent-status .as-phase[data-light="set"] { background: var(--bubble); color: var(--ink); box-shadow: none; }
.fs-agent-status .as-phase[data-light="fire"] { background: color-mix(in oklab, var(--ink) calc(var(--act, 1) * 100%), var(--bubble)); color: var(--on-ink);
  box-shadow: none; transition: none; }
.fs-agent-status .as-phase[data-light="hold"] { background: var(--ink); color: var(--on-ink); box-shadow: none; }
.fs-agent-status .as-phase[data-light="fault"] { background: var(--bubble); color: var(--cherry-text); box-shadow: none; }
.fs-agent-status .as-acts { display: flex; gap: 8px; }
.fs-agent-status .as-acts button { flex: 1; height: 48px; border: 0; border-radius: var(--r-pill); padding: 0 20px; font-size: 15px; font-weight: 500;
  background: var(--bubble); color: var(--ink); cursor: pointer; transform-origin: 50% 50%;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1); -webkit-tap-highlight-color: transparent; }
.fs-agent-status .as-acts .as-go { background: var(--ink); color: var(--on-ink); }
.fs-agent-status .as-acts button:active, .fs-agent-status .as-acts button[data-pressed] { transform: scale(0.96); transition-duration: 75ms; }
@container (max-width: 380px) {
  .fs-agent-status .as { padding: 16px; gap: 12px; }
  .fs-agent-status .as-time { font-size: 40px; }
  .fs-agent-status .as-phase { height: 28px; font-size: 12px; }
  .fs-agent-status .as-acts button { height: 40px; font-size: 14px; }
  .fs-agent-status .as-line { font-size: 14px; }
}
@container (min-width: 600px) {
  .fs-agent-status .as { width: 460px; padding: 24px; gap: 18px; }
  .fs-agent-status .as-time { font-size: 56px; }
}
@media (prefers-reduced-motion: reduce) { .fs-agent-status .as-caret { animation: none; } }
`;

  function mount(host, ctx) {
    const { signal } = ctx;
    const id = "fs-as-" + ++uid;
    host.innerHTML = `
      <div class="as" role="group" aria-label="Agent" data-state="ready">
        <div class="as-head" aria-hidden="true"><span class="as-task"></span><span class="as-state"></span></div>
        <div class="as-mid" aria-hidden="true">
          <div class="as-figure"><p class="as-time">0:00.0</p><span class="as-tokens"></span></div>
          <p class="as-line"><span class="as-l" id="${id}-line"><span class="as-verb"></span><span class="as-target"></span><span class="as-caret" hidden></span></span></p>
        </div>
        <div class="as-phases" aria-hidden="true"></div>
        <div class="as-acts">
          <button type="button" class="as-go">Run</button>
          <button type="button" class="as-stop" aria-keyshortcuts="Escape" hidden>Stop</button>
        </div>
        <div class="sr-only" role="status"></div>
        <p class="sr-only" role="alert"></p>
      </div>`;
    const root = host.querySelector(".as");
    const q = (s) => root.querySelector(s);
    const taskEl = q(".as-task"), stateEl = q(".as-state"), timeEl = q(".as-time"), tokensEl = q(".as-tokens");
    const lineEl = q(".as-l"), verbEl = q(".as-verb"), targetEl = q(".as-target"), caret = q(".as-caret");
    const goBtn = q(".as-go"), stopBtn = q(".as-stop"), statusEl = q("[role=status]"), alertEl = q("[role=alert]");
    const phaseEls = PHASES.map((p) => {
      const el = document.createElement("span");
      el.className = "as-phase";
      el.textContent = p.name;
      q(".as-phases").appendChild(el);
      return el;
    });
    /* Allow grows in on Flat's expressive spring; small moves never bounce. */
    const grow = ctx.spring(1, (s) => { goBtn.style.transform = s === 1 ? "" : `scale(${s})`; goBtn.style.opacity = String(Math.min(1, s)); }, { duration: 0.35, bounce: 0.28 });

    /* --- The time live, and the current pill's breath, from one loop that runs only while something moves. --- */
    const reduced = ctx.reduced();
    let banked = 0, since = 0, env = 0, loop = null;
    function paintTime(seconds) {
      const s = Math.max(0, seconds);
      const m = Math.floor(s / 60);
      const text = reduced && since ? `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}` : `${m}:${(s % 60).toFixed(1).padStart(4, "0")}`;
      if (timeEl.textContent !== text) timeEl.textContent = text;
    }
    function draw(now) {
      paintTime(banked + (since ? Math.max(0, now - since) / 1000 : 0));
      root.style.setProperty("--act", (reduced ? 1 : FLOOR + (1 - FLOOR) * env).toFixed(3));
    }
    function wake() {
      if (loop || !(since || env)) return;
      loop = ctx.loop((dt) => {
        env *= Math.exp(-dt / DECAY);
        if (env < 0.002) env = 0;
        draw(performance.now());
        if (!(since || env)) { loop = null; return false; }
      });
    }
    const clock = {
      go(live, fresh) {
        const now = performance.now();
        if (fresh) banked = 0;
        if (live && !since) since = now;
        else if (!live && since) { banked += (now - since) / 1000; since = 0; }
        draw(now);
        wake();
      },
      reset() { banked = 0; since = 0; draw(performance.now()); },
      seek(s) { const now = performance.now(); banked = s; if (since) since = now; draw(now); },
      kick(n) { if (reduced) return; env = Math.max(env, Math.min(1, 0.5 + n / 24)); wake(); },
    };

    /* --- The component's state, as its props were. --- */
    let task = RUNS[0].task, state = "ready", step = null, tokens = 0, line = "", was = null;
    const track = { state, line, at: null, seen: [], tools: 0, said: 0 };

    function setStatus(nextState, nextStep, opts) {
      const nextLine = lineOf(nextStep);
      const changed = nextState !== track.state || nextLine !== track.line;
      if (changed) {
        const fresh = nextState === "ready" || (isLive(nextState) && isEnd(track.state));
        const resumed = track.state === "waiting" && nextLine === track.line;
        const at = isLive(nextState) ? nextState : nextState === "waiting" ? "tool" : nextState === "ready" ? null : track.at;
        const seen = fresh ? [] : track.seen;
        const call = (nextState === "tool" || nextState === "waiting") && !resumed && (nextLine !== track.line || (track.state !== "tool" && track.state !== "waiting"));
        track.tools = (fresh ? 0 : track.tools) + (call ? 1 : 0);
        track.seen = at && !seen.includes(at) ? [...seen, at] : seen;
        Object.assign(track, { at, state: nextState, line: nextLine, said: track.said + 1 });
      }
      const stateChanged = nextState !== state, lineChanged = nextLine !== line;
      const wasWaiting = state === "waiting";
      state = nextState; step = nextStep; line = nextLine;
      if (stateChanged) {
        const from = was;
        was = state;
        if (state === "ready") clock.reset();
        else clock.go(isLive(state), isLive(state) && isEnd(from));
      }
      if (opts && opts.elapsed !== undefined) clock.seek(opts.elapsed);
      render(lineChanged, changed, state === "waiting" && !wasWaiting);
    }

    function setTokens(n) {
      const from = tokens;
      tokens = n;
      tokensEl.textContent = state === "ready" || !tokens ? "" : `${thousands(tokens)} tokens`;
      if (tokens > from) clock.kick(tokens - from);
    }

    function lightOf(phase) {
      if (phase === track.at && state !== "done") return isLive(state) ? "fire" : state === "waiting" ? "hold" : state === "error" ? "fault" : "set";
      return track.seen.includes(phase) && state !== "ready" ? "set" : "off";
    }
    const canStop = () => isLive(state) || state === "waiting";

    function render(lineChanged, changed, allowArrived) {
      root.dataset.state = state;
      taskEl.textContent = task;
      stateEl.textContent = state === "tool" && track.tools > 1 ? `Tool ${track.tools}` : WORDS[state];
      tokensEl.textContent = state === "ready" || !tokens ? "" : `${thousands(tokens)} tokens`;
      verbEl.textContent = step ? step.verb : "Not started yet";
      verbEl.style.color = step ? "" : "var(--muted)";
      targetEl.textContent = step && step.target ? " " + step.target : "";
      caret.hidden = state !== "writing";
      if (lineChanged && line && !reduced && lineEl.animate) {
        lineEl.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
          duration: Math.min(480, Math.max(160, line.length * 18)),
          easing: `steps(${Math.min(line.length, 48)})`,
        });
      }
      PHASES.forEach((p, i) => (phaseEls[i].dataset.light = lightOf(p.key)));
      // Only the actions that apply: Stop while it runs; Allow beside it while a call waits; otherwise Run.
      const focused = root.contains(document.activeElement) && document.activeElement;
      const live = isLive(state), waiting = state === "waiting";
      goBtn.hidden = live;
      stopBtn.hidden = !(live || waiting);
      goBtn.textContent = waiting ? "Allow" : state === "error" ? "Try again" : state === "ready" ? "Run" : "Run next task";
      if (waiting) goBtn.setAttribute("aria-describedby", `${id}-line`);
      else goBtn.removeAttribute("aria-describedby");
      if (allowArrived && !reduced) { grow.jump(0.85); grow.set(1); }
      if (focused && focused.hidden) (goBtn.hidden ? stopBtn : goBtn).focus({ preventScroll: true });
      if (changed && track.said > 1) {
        const said = sayFor(state, line);
        if (state === "error") { statusEl.textContent = ""; alertEl.textContent = said; }
        else { alertEl.textContent = ""; statusEl.textContent = said; }
      }
    }

    /* --- The agent: works through its cues; a call that needs your OK waits there. --- */
    let agentTimer = 0, rest = [], run = 0, ghost = false, ghostTimer = 0, first = true, tokenTimer = 0;
    const later = (ms, fn) => setTimeout(() => { if (!signal.aborted) fn(); }, ms);
    function perform(cues) {
      clearTimeout(agentTimer);
      const [next, ...more] = cues;
      if (!next) return;
      const go = () => {
        if (next.ghost) { if (ghost) press("stop"); else perform(more); return; }
        change(next.state, { verb: next.verb, target: next.target });
        if (next.state === "waiting") rest = more;
        else perform(more);
      };
      if (next.wait) agentTimer = later(next.wait, go);
      else go();
    }
    function start(cues) { setTokens(0); perform(cues); }
    function onRun() {
      if (state === "error") return start(RUNS[run].retry || RUNS[run].cues);
      if (state === "ready") return start(RUNS[run].cues);
      run = (run + 1) % RUNS.length;
      task = RUNS[run].task;
      start(RUNS[run].cues);
    }
    function onStop() { clearTimeout(agentTimer); change("stopped", step); }
    function cueUp() {
      run = (run + 1) % RUNS.length;
      task = RUNS[run].task;
      tokens = 0;
      change("ready", null);
    }
    function change(nextState, nextStep, opts) {
      setStatus(nextState, nextStep, opts);
      clearInterval(tokenTimer);
      if (state === "thinking" || state === "writing") {
        const s = state;
        tokenTimer = setInterval(() => { if (!signal.aborted) setTokens(tokens + chunk(s)); }, 90);
      }
      scheduleGhost();
    }
    function scheduleGhost() {
      clearTimeout(ghostTimer);
      if (!ghost || GHOST[state] === undefined) return;
      const wait = state === "ready" && first ? FIRST_PRESS : GHOST[state];
      first = false;
      ghostTimer = later(wait, () => {
        if (!ghost) return;
        if (state === "ready" || state === "error") press("run");
        else if (state === "waiting") press("allow");
        else if (state === "done" || state === "stopped") cueUp();
      });
    }

    /* --- Keys. --- */
    function act(key) {
      if (key === "stop" && canStop()) onStop();
      else if (key === "run" && !canStop()) onRun();
      else if (key === "allow" && state === "waiting") perform(rest);
    }
    function press(key) {
      const btn = key === "stop" ? stopBtn : goBtn;
      btn.setAttribute("data-pressed", "");
      later(140, () => btn.removeAttribute("data-pressed"));
      act(key);
    }
    goBtn.addEventListener("click", () => act(state === "waiting" ? "allow" : "run"), { signal });
    stopBtn.addEventListener("click", () => act("stop"), { signal });
    root.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !canStop()) return;
      e.preventDefault();
      e.stopPropagation(); // a run to stop takes Escape; with nothing to stop, the host gets it back
      if (!e.repeat) act("stop");
    }, { signal });

    /* A hand takes over from the ghost for good; the run in flight finishes, or waits for the hand. */
    ctx.onHand(() => { ghost = false; clearTimeout(ghostTimer); });

    render(false, false, false);
    draw(performance.now());
    if (reduced) {
      // One still frame: a call waiting on you, for the hand to answer.
      const cues = RUNS[0].cues;
      const at = cues.findIndex((c) => c.state === "waiting");
      rest = cues.slice(at + 1);
      track.seen = ["thinking", "tool"];
      tokens = 412;
      change("waiting", { verb: cues[at].verb, target: cues[at].target }, { elapsed: 4.4 });
      track.tools = 3;
      render(false, false, false);
    } else {
      ghost = true;
      scheduleGhost();
    }

    return {
      destroy() {
        ghost = false;
        grow.stop();
        clearTimeout(agentTimer);
        clearTimeout(ghostTimer);
        clearInterval(tokenTimer);
      },
    };
  }

  FlatPlayer.register({
    slug: "agent-status",
    title: "Agent Status",
    tagline: "An agent's run: what it's doing, and how long.",
    css,
    mount,
  });
})();
