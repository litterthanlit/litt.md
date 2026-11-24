/* Agent Status, after litterthanlit/components (agent-status.tsx), in Rack 2.0.
 * An agent's run, traced on one surface. The title strip holds the transport key (lit while the run is live; press it
 * to stop), the task, the state in a word, Allow (it cuts in only while a tool call waits on your approval) and the
 * run's clock, the one readout: live seconds only, holding while a call waits and stopping on the frame the run is
 * stopped. The surface is three lanes on a light grid, Think purple, Tool blue, Write green: every step of the run
 * lands as a clip on its lane (a soft tint, a 1px edge in the hue, its verb in the hue's text tone), growing with the
 * clock under a playhead. The clip being written deepens with each chunk of tokens through a 90ms detector, so a
 * stall goes pale; a call that fails ends its clip in red. The view pages on when the playhead reaches its edge. A
 * ghost runs three tasks until a hand arrives. Escape stops a run. Under reduced motion one still frame waits on Allow. */
(function () {
  const TRACKS = [
    { key: "thinking", name: "Think", hue: "purple" },
    { key: "tool", name: "Tool", hue: "blue" },
    { key: "writing", name: "Write", hue: "green" },
  ];
  const DECAY = 0.09; // s: the detector's release
  const WINDOW = 6; // seconds the arrangement shows
  let uid = 0;

  const isLive = (s) => s === "thinking" || s === "tool" || s === "writing";
  const isEnd = (s) => s === null || s === "ready" || s === "done" || s === "error" || s === "stopped";
  const lineOf = (step) => (step ? [step.verb, step.target].filter(Boolean).join(" ") : "");
  const trackOf = (s) => (s === "waiting" ? "tool" : s);

  function sayFor(state, line) {
    const w = (word) => (line ? `${word}: ${line}` : word);
    if (state === "thinking") return w("Thinking");
    if (state === "tool") return line || "Running a tool";
    if (state === "writing") return w("Writing");
    if (state === "waiting") return w("Waiting for your approval");
    if (state === "done") return w("Done");
    if (state === "error") return w("Error");
    if (state === "stopped") return "Stopped";
    return "";
  }

  /* --- The demo: an agent working on a codebase, and a ghost at the keys. --- */
  const cue = (wait, state, verb, target) => ({ wait, state, verb, target });
  const RUNS = [
    {
      task: "Fix the flaky login test",
      cues: [
        cue(0, "thinking", "Planning", "the fix"),
        cue(950, "tool", "Read", "auth/session.ts"),
        cue(600, "tool", "Search", "\u201cretry\u201d in 6 files"),
        cue(600, "thinking", "Comparing", "two fixes"),
        cue(650, "tool", "Delete", "tests/login.old.ts"),
        cue(120, "waiting", "Delete", "tests/login.old.ts"),
        cue(0, "tool", "Delete", "tests/login.old.ts"), // approved: the same call goes on
        cue(600, "tool", "Edit", "auth/retry.ts, +18 −4"),
        cue(600, "writing", "Writing", "the pull request"),
        cue(1700, "done", "Opened", "PR #212, 2 files"),
      ],
    },
    {
      task: "Deploy a preview",
      cues: [
        cue(0, "thinking", "Planning", "the deploy"),
        cue(900, "tool", "Build", "web, 42 s"),
        cue(700, "tool", "Upload", "dist, 18 MB"),
        cue(1100, "error", "Out of memory:", "the build needs 4 GB"),
      ],
      retry: [
        cue(0, "thinking", "Raising", "memory to 4 GB"),
        cue(800, "tool", "Build", "web, 39 s"),
        cue(700, "tool", "Upload", "dist, 18 MB"),
        cue(900, "done", "Preview live", "on fix/auth-retry"),
      ],
    },
    {
      task: "Summarise the design review",
      cues: [
        cue(0, "thinking", "Planning", "the summary"),
        cue(800, "tool", "Read", "32 comments on Checkout v3"),
        cue(600, "writing", "Writing", "the summary"),
        { wait: 1500, ghost: "stop" }, // the ghost stops it mid-stream; under a hand, the agent finishes
        cue(1500, "done", "Wrote", "212 words"),
      ],
    },
  ];
  const GHOST = { ready: 700, waiting: 1500, error: 2200, done: 2600, stopped: 2000 };
  const FIRST_PRESS = 280;
  const chunk = (state) => (state === "writing" ? 8 + Math.floor(Math.random() * 13) : 3 + Math.floor(Math.random() * 7));

  const css = `
.fs-agent-status [hidden] { display: none !important; }
.fs-agent-status .as { width: min(100%, 560px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px;
  -webkit-user-select: none; user-select: none; }
.fs-agent-status .as-strip { display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 6px; background: var(--panel-2); min-width: 0; }
.fs-agent-status .as-task { font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: 2px; }
.fs-agent-status .as-state { margin-left: auto; flex: none; color: var(--muted); font-weight: 500; }
.fs-agent-status [data-state="error"] .as-state { color: var(--danger); font-weight: 600; }
.fs-agent-status .as-key { flex: none; height: 22px; min-width: 24px; padding: 0 8px; border: 0; border-radius: var(--r-control); background: var(--block);
  box-shadow: var(--edge); color: var(--ink); font: 600 11px var(--font); cursor: pointer; display: inline-grid; place-items: center;
  transition: background-color var(--cut-in) var(--ease-out); -webkit-tap-highlight-color: transparent; }
.fs-agent-status .as-key:hover { background: var(--block-hover); }
.fs-agent-status .as-key:active, .fs-agent-status .as-key[data-pressed] { box-shadow: var(--edge-press); background: var(--block-hover); transform: scale(0.98); }
.fs-agent-status .as-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg); }
.fs-agent-status .as-key svg { width: 9px; height: 9px; fill: currentColor; }
.fs-agent-status .as-allow { animation: fs-as-cut var(--cut-in) var(--ease-out); }
.fs-agent-status .as-clock { flex: none; height: 22px; padding: 0 7px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 12px/22px var(--mono); font-variant-numeric: tabular-nums; }
.fs-agent-status [data-state="waiting"] .as-clock, .fs-agent-status [data-state="stopped"] .as-clock { color: var(--muted); }
.fs-agent-status .as-surface { position: relative; margin: 14px; padding: 8px 0; border-radius: var(--r-control); background: var(--cut);
  box-shadow: var(--edge); display: grid; gap: 6px; overflow: hidden; }
.fs-agent-status .as-grid { position: absolute; inset: 0; pointer-events: none; }
.fs-agent-status .as-grid i { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--line); opacity: 0.6; }
.fs-agent-status .as-lane { position: relative; height: 30px; }
.fs-agent-status .as-clip { position: absolute; top: 0; bottom: 0; min-width: 3px; border-radius: var(--r-control);
  background: color-mix(in oklab, var(--tint), var(--hue) calc(var(--a, 0) * 28%)); box-shadow: inset 0 0 0 1px var(--hue);
  color: var(--hue-text); font-size: 10px; font-weight: 600; line-height: 1; padding: 5px 5px 0; white-space: nowrap; overflow: hidden;
  animation: fs-as-cut var(--cut-in) var(--ease-out); }
.fs-agent-status .as-clip.is-live { --a: var(--act, 0); }
.fs-agent-status .as-clip.is-failed { box-shadow: inset 0 0 0 1px var(--danger); color: var(--danger); }
.fs-agent-status .as-playhead { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--ink); pointer-events: none; z-index: 2; }
@keyframes fs-as-cut { from { opacity: 0; } }
.fs-agent-status.is-tile .as-surface { margin: 12px; }
@container (max-width: 400px) { .fs-agent-status .as-state { font-size: 11px; } }
`;

  const PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1.2v7.6L8.6 5z"/></svg>';
  const STOP = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1.5" width="7" height="7"/></svg>';
  const hue = (el, h) => {
    el.style.setProperty("--hue", `var(--clip-${h})`);
    el.style.setProperty("--tint", `var(--clip-${h}-tint)`);
    el.style.setProperty("--hue-text", `var(--clip-${h}-text)`);
  };

  function mount(host, ctx) {
    const { signal } = ctx;
    const id = "fs-as-" + ++uid;
    host.innerHTML = `
      <div class="as" role="group" aria-label="Agent" data-state="ready">
        <div class="as-strip">
          <button type="button" class="as-key as-play" aria-label="Run" aria-pressed="false">${PLAY}</button>
          <span class="as-task" aria-hidden="true"></span>
          <span class="as-state" aria-hidden="true"></span>
          <button type="button" class="as-key as-allow" aria-describedby="${id}-now" hidden>Allow</button>
          <span class="as-clock" aria-hidden="true">0:00.0</span>
        </div>
        <div class="as-surface" aria-hidden="true"><div class="as-grid"></div><div class="as-playhead"></div></div>
        <p class="sr-only" id="${id}-now"></p>
        <div class="sr-only" role="status"></div>
        <p class="sr-only" role="alert"></p>
      </div>`;
    const root = host.querySelector(".as");
    const $ = (s) => root.querySelector(s);
    const taskEl = $(".as-task"), stateEl = $(".as-state"), clockEl = $(".as-clock");
    const playBtn = $(".as-play"), allowBtn = $(".as-allow");
    const surface = $(".as-surface"), gridEl = $(".as-grid"), playhead = $(".as-playhead"), nowEl = $(`#${id}-now`);
    const statusEl = $("[role=status]"), alertEl = $("[role=alert]");
    const lanes = {};
    TRACKS.forEach((t) => {
      const lane = document.createElement("div");
      lane.className = "as-lane";
      surface.appendChild(lane);
      lanes[t.key] = lane;
    });

    /* --- Time: the run's clock in live seconds, the view, the playhead and the level, from one loop. --- */
    const reduced = ctx.reduced();
    let banked = 0, since = 0, env = 0, loop = null, viewStart = 0;
    const T = () => banked + (since ? Math.max(0, performance.now() - since) / 1000 : 0);
    const laneW = () => lanes.thinking.clientWidth || 1;
    const pxs = () => laneW() / WINDOW;

    function drawGrid() {
      const scale = pxs();
      gridEl.textContent = "";
      for (let k = Math.ceil(viewStart); k <= viewStart + WINDOW; k++) {
        const g = document.createElement("i");
        g.style.left = `${(k - viewStart) * scale}px`;
        gridEl.appendChild(g);
      }
    }
    function drawClips(t) {
      const scale = pxs();
      for (const c of clips) {
        const t1 = c.t1 === null ? t : c.t1;
        c.el.style.left = `${(c.t0 - viewStart) * scale}px`;
        c.el.style.width = `${Math.max(3, (t1 - c.t0) * scale)}px`;
      }
    }
    function draw() {
      const t = T();
      // The view pages on when the playhead reaches its edge: it cuts, it never scrolls.
      if (t > viewStart + WINDOW * 0.92) { viewStart = Math.max(0, t - WINDOW * 0.1); drawGrid(); }
      const m = Math.floor(t / 60), s = t % 60;
      const text = reduced && since ? `${m}:${String(Math.floor(s)).padStart(2, "0")}.0` : `${m}:${s.toFixed(1).padStart(4, "0")}`;
      if (clockEl.textContent !== text) clockEl.textContent = text;
      playhead.style.left = `${(t - viewStart) * pxs()}px`;
      drawClips(t);
      root.style.setProperty("--act", (reduced ? (isLive(state) ? 0.6 : 0) : env).toFixed(3));
    }
    function wake() {
      if (loop || !(since || env)) return;
      loop = ctx.loop((dt) => {
        env *= Math.exp(-dt / DECAY);
        if (env < 0.002) env = 0;
        draw();
        if (!(since || env)) { loop = null; return false; }
      });
    }
    const clock = {
      go(live, fresh) {
        const now = performance.now();
        if (fresh) { banked = 0; since = 0; viewStart = 0; clearClips(); drawGrid(); }
        if (live && !since) since = now;
        else if (!live && since) { banked += (now - since) / 1000; since = 0; }
        draw();
        wake();
      },
      reset() { banked = 0; since = 0; viewStart = 0; clearClips(); drawGrid(); draw(); },
      kick(n) { if (reduced) return; env = Math.max(env, Math.min(1, 0.5 + n / 24)); wake(); },
    };

    /* --- Clips: each step of the run lands on its lane. --- */
    let clips = [];
    function clearClips() { clips.forEach((c) => c.el.remove()); clips = []; }
    const openClip = () => clips.find((c) => c.t1 === null);
    function record(nextState, nextLine, resumed, nextStep) {
      const t = T();
      const open = openClip();
      if (resumed && open) return; // Allow: the same call goes on in the same clip
      if (nextState === "waiting" && open && open.line === nextLine) return; // the call that asks for your OK is the same clip
      if (open) { open.t1 = t; open.el.classList.remove("is-live"); }
      if (nextState === "error" && open) { open.el.classList.add("is-failed"); open.el.textContent = `${open.el.textContent} failed`; }
      if (nextState === "done" || nextState === "stopped" || nextState === "error") return;
      const track = trackOf(nextState);
      if (!lanes[track]) return;
      const el = document.createElement("div");
      el.className = "as-clip is-live";
      el.textContent = (nextStep && nextStep.verb) || track;
      el.title = nextLine;
      hue(el, TRACKS.find((x) => x.key === track).hue);
      lanes[track].appendChild(el);
      clips.push({ el, t0: t, t1: null, line: nextLine });
    }

    /* --- The component's state, as its props were. --- */
    let task = RUNS[0].task, state = "ready", step = null, tokens = 0, line = "", was = null, tools = 0, said = 0;
    function setStatus(nextState, nextStep) {
      const nextLine = lineOf(nextStep);
      const changed = nextState !== state || nextLine !== line;
      if (!changed) return;
      const resumed = state === "waiting" && nextLine === line;
      const fresh = nextState === "ready" || (isLive(nextState) && isEnd(state));
      const call = (nextState === "tool" || nextState === "waiting") && !resumed && (nextLine !== line || (state !== "tool" && state !== "waiting"));
      tools = (fresh ? 0 : tools) + (call ? 1 : 0);
      const stateChanged = nextState !== state;
      if (stateChanged) {
        const from = was;
        was = nextState;
        if (nextState === "ready") clock.reset();
        else if (isLive(nextState) && isEnd(from)) clock.go(true, true);
      }
      if (nextState !== "ready") record(nextState, nextLine, resumed, nextStep);
      state = nextState; step = nextStep; line = nextLine;
      if (stateChanged && nextState !== "ready") clock.go(isLive(state), false);
      said += 1;
      render();
      draw();
    }
    function setTokens(n) {
      const from = tokens;
      tokens = n;
      if (tokens > from) clock.kick(tokens - from);
    }

    const canStop = () => isLive(state) || state === "waiting";
    function render() {
      root.dataset.state = state;
      taskEl.textContent = task;
      stateEl.textContent = { ready: "Ready", thinking: "Thinking", tool: tools ? `Tool call ${tools}` : "Tool call", writing: "Writing", waiting: "Needs approval", done: "Done", error: "Failed", stopped: "Stopped" }[state];
      nowEl.textContent = step ? lineOf(step) : "Not started";
      const live = isLive(state), waiting = state === "waiting";
      playBtn.setAttribute("aria-pressed", String(live || waiting));
      playBtn.setAttribute("aria-label", live || waiting ? "Stop" : state === "error" ? "Retry" : "Run");
      if (live || waiting) playBtn.setAttribute("aria-keyshortcuts", "Escape"); else playBtn.removeAttribute("aria-keyshortcuts");
      playBtn.innerHTML = live || waiting ? STOP : PLAY;
      const hadFocus = document.activeElement === allowBtn;
      allowBtn.hidden = !waiting;
      if (hadFocus && !waiting) playBtn.focus({ preventScroll: true });
      if (said > 0) {
        const s = sayFor(state, line);
        if (state === "error") { statusEl.textContent = ""; alertEl.textContent = s; }
        else { alertEl.textContent = ""; statusEl.textContent = s; }
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
    function cueUp() { run = (run + 1) % RUNS.length; task = RUNS[run].task; tokens = 0; change("ready", null); }
    function change(nextState, nextStep) {
      setStatus(nextState, nextStep);
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
      const btn = key === "allow" ? allowBtn : playBtn;
      btn.setAttribute("data-pressed", "");
      later(120, () => btn.removeAttribute("data-pressed"));
      act(key);
    }
    playBtn.addEventListener("click", () => act(canStop() ? "stop" : "run"), { signal });
    allowBtn.addEventListener("click", () => act("allow"), { signal });
    root.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !canStop()) return;
      e.preventDefault();
      e.stopPropagation(); // a run to stop takes Escape; with nothing to stop, the host gets it back
      if (!e.repeat) act("stop");
    }, { signal });
    ctx.onHand(() => { ghost = false; clearTimeout(ghostTimer); });

    const resize = new ResizeObserver(() => { drawGrid(); draw(); });
    resize.observe(lanes.thinking);

    render();
    drawGrid();
    draw();
    if (reduced) {
      // One still frame: the first run, up to the call that waits on you.
      const cues = RUNS[0].cues;
      let tAcc = 0;
      for (const c of cues) {
        tAcc += c.wait / 1000;
        banked = tAcc; since = 0;
        setStatus(c.state, { verb: c.verb, target: c.target });
        since = 0; banked = tAcc;
        if (c.state === "waiting") break;
      }
      rest = cues.slice(cues.findIndex((c) => c.state === "waiting") + 1);
      setTokens(412);
      draw();
    } else {
      ghost = true;
      scheduleGhost();
    }

    return {
      destroy() {
        ghost = false;
        clearTimeout(agentTimer);
        clearTimeout(ghostTimer);
        clearInterval(tokenTimer);
        resize.disconnect();
      },
    };
  }

  FlatPlayer.register({
    slug: "agent-status",
    title: "Agent Status",
    tagline: "An agent's run, traced live: each step a clip on its lane.",
    css,
    mount,
  });
})();
