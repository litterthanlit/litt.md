/* Agent Status, after litterthanlit/components (agent-status.tsx), redesigned in Rack.
 * An agent's run, traced live. The device's title strip names the task and says the state in a word. Its transport
 * row holds Run (lit while the run is live), Stop, Allow (live only while a tool call waits on your approval), the
 * run's clock (the study's one readout, in seconds, counting only live time: it holds while a call waits and stops on
 * the frame Stop goes down) and the tokens so far in a value box. Under it, three lanes, Think, Tool and Write, each in
 * its own colour: every step of the run lands as a clip on its lane, growing with the clock under a playhead, labelled
 * with what it did; a call that fails ends its clip in red. The view pages on when the playhead reaches its edge.
 * Tokens are a rate: a meter in the current lane's colour, fed by every chunk through a 90ms detector, so a stall goes
 * quiet. A ghost runs three tasks until a hand arrives. Escape stops a run. Under reduced motion nothing runs: one
 * still frame waits on Allow. */
(function () {
  const TRACKS = [
    { key: "thinking", name: "Think", hue: "purple" },
    { key: "tool", name: "Tool", hue: "orange" },
    { key: "writing", name: "Write", hue: "blue" },
  ];
  const DECAY = 0.09; // s: the detector's release
  const WINDOW = 6; // seconds the arrangement shows
  let uid = 0;

  const isLive = (s) => s === "thinking" || s === "tool" || s === "writing";
  const isEnd = (s) => s === null || s === "ready" || s === "done" || s === "error" || s === "stopped";
  const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
.fs-agent-status .as-strip { display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 10px; background: var(--panel-2); min-width: 0; }
.fs-agent-status .as-title { font-weight: 600; flex: none; }
.fs-agent-status .as-task { color: var(--muted); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fs-agent-status .as-state { margin-left: auto; flex: none; font-weight: 600; }
.fs-agent-status [data-state="waiting"] .as-state { color: var(--warning); }
.fs-agent-status [data-state="done"] .as-state { color: var(--success); }
.fs-agent-status [data-state="error"] .as-state { color: var(--danger); }
.fs-agent-status [data-state="ready"] .as-state, .fs-agent-status [data-state="stopped"] .as-state { color: var(--muted); }
.fs-agent-status .as-body { padding: 8px; display: grid; gap: 8px; }
.fs-agent-status .as-transport { display: flex; align-items: center; gap: 4px; min-width: 0; }
.fs-agent-status .as-key { height: 26px; min-width: 28px; padding: 0 9px; border: 0; border-radius: var(--r-control); background: var(--block);
  box-shadow: var(--edge); color: var(--ink); font: 500 12px var(--font); cursor: pointer; display: inline-grid; place-items: center;
  transition: background-color var(--cut-in) var(--ease-out); -webkit-tap-highlight-color: transparent; }
.fs-agent-status .as-key:hover { background: var(--block-hover); }
.fs-agent-status .as-key:active, .fs-agent-status .as-key[data-pressed] { box-shadow: var(--edge-press); background: var(--block-hover); transform: scale(0.98); }
.fs-agent-status .as-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg); }
.fs-agent-status .as-key[aria-disabled="true"] { color: var(--disabled); cursor: default; }
.fs-agent-status .as-key[aria-disabled="true"]:hover { background: var(--block); }
.fs-agent-status .as-key svg { width: 10px; height: 10px; fill: currentColor; }
.fs-agent-status .as-clock { margin: 0 4px 0 8px; font-family: var(--mono); font-size: 20px; font-weight: 500; letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums; line-height: 1; }
.fs-agent-status [data-state="waiting"] .as-clock, .fs-agent-status [data-state="stopped"] .as-clock { color: var(--muted); }
.fs-agent-status .as-box { margin-left: auto; height: 26px; display: inline-flex; align-items: center; padding: 0 8px; border-radius: var(--r-control);
  background: var(--cut); box-shadow: var(--edge); font-family: var(--mono); font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums;
  white-space: nowrap; }
.fs-agent-status .as-box small { font: inherit; font-weight: 500; color: var(--muted); margin-left: 4px; }
.fs-agent-status .as-arr { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 2px; }
.fs-agent-status .as-ruler { grid-column: 2; position: relative; height: 14px; overflow: hidden; font-family: var(--mono); font-size: 10px;
  color: var(--muted); font-variant-numeric: tabular-nums; }
.fs-agent-status .as-ruler span { position: absolute; top: 0; padding-left: 3px; box-shadow: inset 1px 0 0 var(--line-strong); line-height: 14px; }
.fs-agent-status .as-head { height: 24px; display: flex; align-items: center; padding: 0 6px 0 9px; border-radius: var(--r-control); font-weight: 600;
  font-size: 11px; background-color: var(--panel-3); background-image: linear-gradient(var(--hue), var(--hue)); background-size: 3px 100%;
  background-repeat: no-repeat; color: var(--muted); transition: color var(--cut-in) var(--ease-out); }
.fs-agent-status .as-head.is-on { color: var(--ink); }
.fs-agent-status .as-lane { position: relative; height: 24px; border-radius: var(--r-control); background: var(--panel-2); overflow: hidden; }
.fs-agent-status .as-clip { position: absolute; top: 2px; bottom: 2px; min-width: 3px; border-radius: var(--r-control); background: var(--tint);
  box-shadow: inset 0 0 0 1px var(--hue); color: var(--hue-text); font-size: 10px; font-weight: 600; line-height: 20px; padding: 0 4px;
  white-space: nowrap; overflow: hidden; text-overflow: clip; animation: fs-as-cut var(--cut-in) var(--ease-out); }
.fs-agent-status .as-clip.is-failed { box-shadow: inset 0 0 0 1px var(--danger); color: var(--danger); }
.fs-agent-status .as-grid { position: absolute; inset: 0; pointer-events: none; }
.fs-agent-status .as-grid i { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--line); }
.fs-agent-status .as-lanes { grid-column: 2; grid-row: 2 / span 3; position: relative; display: grid; gap: 2px; }
.fs-agent-status .as-playhead { position: absolute; top: -16px; bottom: 0; width: 1px; background: var(--ink); pointer-events: none; z-index: 2; }
.fs-agent-status .as-foot { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 2px 2px; align-items: center; }
.fs-agent-status .as-label { color: var(--muted); font-size: 11px; padding-left: 2px; }
.fs-agent-status .as-now { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-left: 2px; }
.fs-agent-status .as-now span { color: var(--muted); }
.fs-agent-status .as-meter { position: relative; height: 8px; border-radius: var(--r-control); background: var(--slot); overflow: hidden; }
.fs-agent-status .as-meter i { position: absolute; inset: 0 auto 0 0; width: 100%; background: var(--hue, var(--slot-fill)); transform-origin: 0 50%;
  transform: scaleX(var(--act, 0)); }
@keyframes fs-as-cut { from { opacity: 0; } }
@container (max-width: 400px) {
  .fs-agent-status .as-clock { font-size: 17px; margin-left: 4px; }
  .fs-agent-status .as-key { padding: 0 7px; min-width: 26px; }
}
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
        <div class="as-strip" aria-hidden="true"><span class="as-title">Agent</span><span class="as-task"></span><span class="as-state"></span></div>
        <div class="as-body">
          <div class="as-transport">
            <button type="button" class="as-key as-play" aria-label="Run" aria-pressed="false">${PLAY}</button>
            <button type="button" class="as-key as-stop" aria-label="Stop" aria-keyshortcuts="Escape" aria-disabled="true">${STOP}</button>
            <button type="button" class="as-key as-allow" aria-disabled="true" aria-describedby="${id}-now">Allow</button>
            <span class="as-clock" aria-hidden="true">0:00.00</span>
            <span class="as-box" aria-hidden="true"><b class="as-tok">0</b><small>tok</small></span>
          </div>
          <div class="as-arr" aria-hidden="true">
            <div style="grid-column:1"></div><div class="as-ruler"></div>
            <div class="as-lanes"><div class="as-playhead"></div></div>
          </div>
          <div class="as-foot" aria-hidden="true">
            <span class="as-label">Now</span><span class="as-now" id="${id}-now"></span>
            <span class="as-label">Rate</span><span class="as-meter"><i></i></span>
          </div>
        </div>
        <div class="sr-only" role="status"></div>
        <p class="sr-only" role="alert"></p>
      </div>`;
    const root = host.querySelector(".as");
    const $ = (s) => root.querySelector(s);
    const taskEl = $(".as-task"), stateEl = $(".as-state"), clockEl = $(".as-clock"), tokEl = $(".as-tok");
    const playBtn = $(".as-play"), stopBtn = $(".as-stop"), allowBtn = $(".as-allow");
    const ruler = $(".as-ruler"), lanesEl = $(".as-lanes"), playhead = $(".as-playhead"), nowEl = $(".as-now"), meter = $(".as-meter");
    const statusEl = $("[role=status]"), alertEl = $("[role=alert]");
    const arr = $(".as-arr");
    const heads = {}, lanes = {};
    TRACKS.forEach((t, i) => {
      const head = document.createElement("div");
      head.className = "as-head";
      head.style.gridColumn = "1";
      head.style.gridRow = String(i + 2);
      head.textContent = t.name;
      hue(head, t.hue);
      arr.insertBefore(head, lanesEl);
      const lane = document.createElement("div");
      lane.className = "as-lane";
      lane.innerHTML = '<div class="as-grid"></div>';
      lanesEl.appendChild(lane);
      heads[t.key] = head;
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
      ruler.textContent = "";
      Object.values(lanes).forEach((l) => (l.firstChild.textContent = ""));
      for (let s = Math.floor(viewStart); s <= viewStart + WINDOW; s++) {
        const x = (s - viewStart) * scale;
        if (x < 0) continue;
        const sp = document.createElement("span");
        sp.style.left = `${x}px`;
        sp.textContent = `${s}s`;
        ruler.appendChild(sp);
        Object.values(lanes).forEach((l) => { const g = document.createElement("i"); g.style.left = `${x}px`; l.firstChild.appendChild(g); });
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
      const text = reduced && since ? `${m}:${String(Math.floor(s)).padStart(2, "0")}.00` : `${m}:${s.toFixed(2).padStart(5, "0")}`;
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
      if (open) open.t1 = t;
      if (nextState === "error" && open) { open.el.classList.add("is-failed"); open.el.textContent = `${open.el.textContent} failed`; }
      const track = trackOf(nextState);
      if (!lanes[track]) return;
      const el = document.createElement("div");
      el.className = "as-clip";
      el.textContent = (nextStep && nextStep.verb) || track;
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
      tokEl.textContent = thousands(tokens);
      if (tokens > from) clock.kick(tokens - from);
    }

    const canStop = () => isLive(state) || state === "waiting";
    function render() {
      root.dataset.state = state;
      taskEl.textContent = task;
      stateEl.textContent = { ready: "Ready", thinking: "Thinking", tool: tools ? `Tool ${tools}` : "Tool", writing: "Writing", waiting: "Needs approval", done: "Done", error: "Failed", stopped: "Stopped" }[state];
      tokEl.textContent = thousands(tokens);
      nowEl.innerHTML = "";
      if (step) { nowEl.append(step.verb + " "); const s = document.createElement("span"); s.textContent = step.target || ""; nowEl.append(s); }
      else nowEl.textContent = "Press play to run the task";
      const track = trackOf(state);
      TRACKS.forEach((t) => heads[t.key].classList.toggle("is-on", t.key === track && (isLive(state) || state === "waiting")));
      const th = TRACKS.find((t) => t.key === track);
      if (th) hue(meter, th.hue);
      const live = isLive(state), waiting = state === "waiting";
      playBtn.setAttribute("aria-pressed", String(live || waiting));
      playBtn.setAttribute("aria-label", state === "error" ? "Retry" : "Run");
      playBtn.setAttribute("aria-disabled", String(live || waiting));
      stopBtn.setAttribute("aria-disabled", String(!canStop()));
      allowBtn.setAttribute("aria-disabled", String(!waiting));
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
      const btn = { run: playBtn, stop: stopBtn, allow: allowBtn }[key];
      btn.setAttribute("data-pressed", "");
      later(120, () => btn.removeAttribute("data-pressed"));
      act(key);
    }
    playBtn.addEventListener("click", () => act("run"), { signal });
    stopBtn.addEventListener("click", () => act("stop"), { signal });
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
    tagline: "An agent's run, traced live: every step a clip on its lane.",
    css,
    mount,
  });
})();
