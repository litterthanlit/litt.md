/* Agent Run, in Rack: one agent turn as a run. The agent's lane gathers clips as it works: Think in purple, then each
   tool call a clip in its tool's colour (Read blue, Search cyan, Edit orange), growing with the clock while it runs. One
   readout is the run's clock; a box counts tokens. Steps list under the lane until the work is done, then fold into
   "3 tool calls, 4.2 s" and the answer streams into the output panel behind a still caret. Run is the lit key while the
   run is going. Time moves the clips and the words; everything else cuts. Screen readers hear each phase, not every word. */
(function () {
  const TOOLS = { Think: "purple", Read: "blue", Search: "cyan", Edit: "orange" };
  const STEPS = [
    { verb: "Read", target: "src/registry/index.ts", detail: "142 lines" },
    { verb: "Search", target: "createSpring", detail: "4 results" },
    { verb: "Edit", target: "segmented-control.tsx", detail: '<span class="ar-add">+18</span> <span class="ar-del">−9</span>', label: "18 lines added, 9 removed" },
  ];
  const ANSWER = "The indicator now springs between options. Position and width are separate springs, so it stretches slightly in flight and quick clicks flow into each other.";
  const THINK = 1400, STEP = 900, WORD = 45, LOOP_AFTER = 3500, SPAN = 4.6;
  const words = ANSWER.split(/(?<=\s)/);
  const hueVars = (h) => "--hue: var(--clip-" + h + "); --tint: var(--clip-" + h + "-tint); --txt: var(--clip-" + h + "-text)";
  let n = 0;

  FlatPlayer.register({
    slug: "agent-run",
    title: "Agent Run",
    tagline: "Think, run tools, fold it away, stream the answer.",
    css: `
.fs-agent-run .ar { width: min(380px, 100%); font: 400 12px/1.4 var(--font); background: var(--body); padding: 3px; border-radius: 8px; display: grid; gap: 3px;
  -webkit-user-select: none; user-select: none }
.fs-agent-run .ar-dev { background: var(--panel); border-radius: var(--r-panel); overflow: hidden }
.fs-agent-run .ar-head { display: flex; align-items: center; gap: 4px; height: 30px; padding: 0 4px; background: var(--panel-2) }
.fs-agent-run .ar-key { height: 22px; padding: 0 8px; border: 0; border-radius: var(--r-control); background: var(--block); box-shadow: var(--edge); color: var(--ink);
  font: 500 12px var(--font); cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: background-color var(--cut-in) var(--ease-out), color var(--cut-in) var(--ease-out) }
.fs-agent-run .ar-key:hover { background: var(--block-hover) }
.fs-agent-run .ar-key:active { box-shadow: var(--edge-press); transform: scale(0.98) }
.fs-agent-run .ar-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg) }
.fs-agent-run .ar-key:disabled { cursor: default }
.fs-agent-run .ar-key svg { width: 9px; height: 9px; fill: currentColor }
.fs-agent-run .ar-title { font-weight: 600; margin: 0 4px }
.fs-agent-run .ar-clock { font: 600 18px/1 var(--mono); letter-spacing: -0.02em; margin-left: auto; margin-right: 2px }
.fs-agent-run .ar-box { height: 20px; padding: 0 6px; display: inline-grid; place-items: center; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px var(--mono); white-space: nowrap }
.fs-agent-run .ar-lane { padding: 4px 6px 6px; display: grid; gap: 2px }
.fs-agent-run .ar-ruler { position: relative; height: 13px; font: 500 10px var(--mono); color: var(--muted) }
.fs-agent-run .ar-ruler span { position: absolute; top: 0 }
.fs-agent-run .ar-row { position: relative; height: 24px; border-radius: var(--r-control); background: var(--panel-3) }
.fs-agent-run .ar-clip { position: absolute; top: 0; bottom: 0; padding: 0 4px; display: flex; align-items: center; border-radius: var(--r-control); background: var(--tint);
  color: var(--txt); box-shadow: inset 0 0 0 1px var(--hue); font: 600 10.5px var(--font); white-space: nowrap; overflow: hidden; animation: ar-in var(--cut-in) var(--ease-out) both }
@keyframes ar-in { from { opacity: 0 } }
.fs-agent-run .ar-fold { width: 100%; justify-content: flex-start; height: 24px; border-radius: 0; box-shadow: none; background: transparent; color: var(--muted); padding: 0 8px }
.fs-agent-run .ar-fold:hover { background: var(--panel-3) }
.fs-agent-run .ar-fold:disabled:hover { background: transparent }
.fs-agent-run .ar-fold svg { width: 8px; height: 8px; transition: none }
.fs-agent-run .ar-fold[aria-expanded="true"] svg { transform: rotate(90deg) }
.fs-agent-run .ar-steps { list-style: none; margin: 0; padding: 0 6px 6px; display: grid; gap: 2px }
.fs-agent-run .ar-steps[hidden] { display: none }
.fs-agent-run .ar-step { display: grid; grid-template-columns: 52px minmax(0, 1fr) auto; align-items: center; gap: 6px; height: 22px; animation: ar-in var(--cut-in) var(--ease-out) both }
.fs-agent-run .ar-tag { height: 18px; display: grid; place-items: center; border-radius: var(--r-control); background: var(--tint); box-shadow: inset 0 0 0 1px var(--hue); color: var(--txt); font-weight: 600; font-size: 11px }
.fs-agent-run .ar-tgt { font: 500 11px var(--mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.fs-agent-run .ar-det { font: 500 11px var(--mono); color: var(--muted); white-space: nowrap }
.fs-agent-run .ar-add { color: var(--clip-green-text) } .fs-agent-run .ar-del { color: var(--danger) }
.fs-agent-run .ar-out { background: var(--panel); border-radius: var(--r-panel); padding: 6px 8px 8px; min-height: 4.4em }
.fs-agent-run .ar-out-h { color: var(--muted); font-size: 11px; margin-bottom: 2px }
.fs-agent-run .ar-text { margin: 0; color: var(--ink) }
.fs-agent-run .ar-caret { display: inline-block; width: 6px; height: 1.1em; margin-left: 1px; transform: translateY(2px); background: var(--ink) }
.fs-agent-run.is-tile .ar-steps { display: none }
@container (min-width: 560px) { .fs-agent-run .ar { width: 500px; font-size: 13px } }
`,
    mount(host, ctx) {
      const id = "ar" + ++n;
      const ruler = [0, 1, 2, 3, 4].map((s) => '<span style="left:' + (s / SPAN) * 100 + '%">' + s + " s</span>").join("");
      host.innerHTML = `
<section class="ar" aria-label="Agent">
  <div class="ar-dev">
    <div class="ar-head">
      <button class="ar-key" type="button" data-k="run" aria-pressed="false"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 0.5 9.5 5l-8 4.5z"/></svg>Run</button>
      <span class="ar-title">Agent</span><span class="ar-box ar-take" aria-hidden="true"></span>
      <span class="ar-clock" aria-hidden="true">0:00.0</span><span class="ar-box ar-tok" aria-hidden="true"></span>
    </div>
    <div class="ar-lane" aria-hidden="true"><div class="ar-ruler">${ruler}</div><div class="ar-row"></div></div>
    <button class="ar-key ar-fold" type="button" aria-expanded="true" aria-controls="${id}-steps"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 0.5 8.5 5l-6 4.5z"/></svg><span></span></button>
    <ol class="ar-steps" id="${id}-steps"></ol>
  </div>
  <div class="ar-out"><div class="ar-out-h">Output</div><p class="ar-text"></p></div>
  <p class="sr-only" aria-live="polite"></p>
</section>`;
      const sig = { signal: ctx.signal };
      const root = host.querySelector(".ar"), runKey = host.querySelector('[data-k="run"]'), row = host.querySelector(".ar-row"), fold = host.querySelector(".ar-fold");
      const list = host.querySelector(".ar-steps"), text = host.querySelector(".ar-text"), clockEl = host.querySelector(".ar-clock"), tokEl = host.querySelector(".ar-tok");
      const takeEl = host.querySelector(".ar-take"), live = host.querySelector("[aria-live]");

      let phase = "idle", revealed = 0, finished = 0, streamed = 0, open = true, started = 0, ended = 0, take = 3, tokens = 0, looping = true;
      let timers = [], clips = [], tick = null;
      const at = (ms, fn) => timers.push(ctx.after(ms, fn));
      const busy = () => phase === "thinking" || phase === "working";
      const secs = () => ((ended || performance.now()) - started) / 1000;

      function drawFold() {
        const span = fold.querySelector("span");
        fold.disabled = busy() || phase === "idle";
        fold.setAttribute("aria-expanded", String(open));
        span.textContent = busy() ? (phase === "thinking" ? "Thinking" : STEPS[revealed - 1].verb + " " + STEPS[revealed - 1].target) :
          STEPS.length + " tool calls, " + ((THINK + STEPS.length * STEP) / 1000).toFixed(1) + " s";
        list.hidden = !open;
      }
      function drawSteps() {
        while (list.children.length < revealed) {
          const s = STEPS[list.children.length], li = document.createElement("li");
          li.className = "ar-step"; li.style.cssText = hueVars(TOOLS[s.verb]);
          li.innerHTML = '<span class="ar-tag"></span><span class="ar-tgt"></span><span class="ar-det"></span>';
          li.querySelector(".ar-tag").textContent = s.verb; li.querySelector(".ar-tgt").textContent = s.target;
          list.appendChild(li);
        }
        [...list.children].forEach((li, i) => {
          const d = li.querySelector(".ar-det");
          if (i < finished) { d.innerHTML = STEPS[i].detail; if (STEPS[i].label) d.setAttribute("aria-label", STEPS[i].label); } else d.textContent = "running";
        });
      }
      function drawText() {
        text.textContent = words.slice(0, streamed).join("");
        if (phase === "answering") { const c = document.createElement("span"); c.className = "ar-caret"; c.setAttribute("aria-hidden", "true"); text.appendChild(c); }
      }
      function drawHead() {
        runKey.setAttribute("aria-pressed", String(phase !== "done" && phase !== "idle"));
        takeEl.textContent = "Run " + take;
        tokEl.textContent = (tokens >= 1000 ? (tokens / 1000).toFixed(1) + "k" : Math.round(tokens)) + " tok";
        const s = phase === "idle" ? 0 : secs();
        clockEl.textContent = Math.floor(s / 60) + ":" + (s % 60).toFixed(1).padStart(4, "0");
      }
      function say() {
        const said = busy() ? (phase === "thinking" ? "Thinking" : STEPS[revealed - 1].verb + " " + STEPS[revealed - 1].target) : phase === "done" ? "Answer ready. " + ANSWER : "";
        if (live.textContent !== said) live.textContent = said;
      }
      function draw() { drawFold(); drawSteps(); drawText(); drawHead(); say(); }

      /* A clip cuts in on the lane and grows with the clock until its step ends. */
      function addClip(name, label, hue, from) {
        const el = document.createElement("span");
        el.className = "ar-clip"; el.style.cssText = hueVars(hue) + ";left:" + (from / SPAN) * 100 + "%;width:0";
        el.textContent = label; row.appendChild(el);
        clips.push({ el, from, to: null });
      }
      const closeClip = (t) => { const c = clips[clips.length - 1]; if (c && c.to === null) c.to = t; };
      function drawClips() {
        const t = phase === "idle" ? 0 : Math.min(SPAN, secs());
        clips.forEach((c) => { const end = c.to === null ? t : c.to; c.el.style.width = "calc(" + (Math.max(0, end - c.from) / SPAN) * 100 + "% - 1px)"; });
      }

      function clear() { timers.forEach(clearTimeout); timers = []; if (tick) tick.stop = true; tick = null; }
      function script() {
        clear(); row.textContent = ""; clips = []; list.textContent = "";
        take++; tokens = 0;
        if (ctx.reduced()) {
          phase = "done"; started = performance.now(); ended = started + THINK + STEPS.length * STEP; revealed = finished = STEPS.length; streamed = words.length; open = false;
          let t = 0; addClip("Think", "Think", TOOLS.Think, 0); clips[0].to = THINK / 1000; t = THINK / 1000;
          STEPS.forEach((s) => { addClip(s.verb, s.verb, TOOLS[s.verb], t); t += STEP / 1000; closeClip(t); });
          tokens = 1840; drawClips(); draw(); return;
        }
        phase = "thinking"; started = performance.now(); ended = 0; revealed = finished = streamed = 0; open = true;
        addClip("Think", "Think", TOOLS.Think, 0);
        tick = ctx.loop(() => {
          if (busy()) tokens += 6 + Math.random() * 6;
          drawClips(); drawHead();
          return phase !== "done";
        });
        draw();
        let t = THINK;
        STEPS.forEach((s, i) => {
          at(t, () => { closeClip(secs()); phase = "working"; revealed = i + 1; addClip(s.verb, s.verb + " " + s.target.split("/").pop(), TOOLS[s.verb], secs()); draw(); });
          t += STEP;
          at(t, () => { finished = i + 1; drawSteps(); });
        });
        at(t + 250, () => { closeClip(secs()); ended = performance.now(); phase = "answering"; open = false; draw(); });
        t += 500;
        words.forEach((_, i) => at(t + i * WORD, () => { streamed = i + 1; tokens += 1.3; drawText(); drawHead(); }));
        t += words.length * WORD;
        at(t, () => { phase = "done"; draw(); });
        at(t + LOOP_AFTER, () => { if (looping) script(); });
      }

      fold.addEventListener("click", () => { if (busy()) return; open = !open; drawFold(); }, sig);
      runKey.addEventListener("click", () => { if (busy() || phase === "answering") return; script(); }, sig);
      /* A hand ends the loop: this run plays out and stays; Run starts the next one. */
      ctx.onHand(() => { looping = false; });
      if (ctx.reduced()) script(); else { draw(); drawHead(); ctx.after(200, script); }
      return { destroy: clear };
    },
  });
})();
