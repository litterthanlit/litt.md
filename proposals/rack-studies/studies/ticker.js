/* Ticker, after litterthanlit/components (ticker.tsx), redesigned in Rack.
 * An agent console's activity line: a device panel whose title strip names it, counts the queue and holds Follow (the
 * lit key). Under it, the line itself: a cut box with the message's source as a coloured tag (the agent or job it came
 * from, in that agent's colour), the message, the position in the queue and two square step keys. Under that, the
 * log: every message as a row with its agent and the time it arrived, the shown one selected. A message cuts in by
 * opacity on the frame and stays a while; one longer than the line holds, runs along at a steady speed (time moves
 * it, not the UI), holds at its end and jumps back. Follow on, the line advances through the queue by itself; a hand
 * stepping through it turns Follow off, as scrolling a log does. Hover or focus pauses. Under reduced motion nothing
 * runs along: a long message pages through a lineful of whole words at a time. */
(function () {
  const DWELL = 2000; // ms a message that fits stays, plus a little per character
  const HOLD = 1000; // ms a long message holds at its start and its end
  const PAGE = 2400; // ms per lineful under reduced motion
  const SPEED = 60; // px a second
  const LIMIT = 9;
  const GAP = 2600; // ms between arrivals while untouched
  let uid = 0;

  /* Each source is an agent or a job, and keeps its colour everywhere it shows. */
  const SOURCES = {
    planner: { name: "Planner", hue: "purple" },
    research: { name: "Researcher", hue: "blue" },
    coder: { name: "Coder", hue: "orange" },
    review: { name: "Reviewer", hue: "green" },
    deploy: { name: "Deploy", hue: "cyan" },
  };
  const TONES = { info: "", warn: "Warning", alert: "Failed" };
  const ARRIVALS = [
    { src: "research", text: "Read 14 pages on rate limits", tone: "info" },
    { src: "coder", text: "Opened branch fix/auth-retry", tone: "info" },
    { src: "planner", text: "Budget at 88 %, 4 steps left", tone: "warn" },
    { src: "deploy", text: "Preview build ran out of memory. Raise the limit to 4 GB and run it again", tone: "alert" },
  ];
  const SAMPLES = [
    { src: "review", text: "Approved 3 of 4 diffs", tone: "info" },
    { src: "coder", text: "Tests passing, 212 of 212", tone: "info" },
    { src: "research", text: "Search tool rate limited", tone: "alert" },
    { src: "deploy", text: "Preview live on fix/auth-retry", tone: "info" },
    { src: "planner", text: "Waiting for approval to spend $4.00", tone: "warn" },
    ...ARRIVALS,
  ];

  const css = `
.fs-ticker [hidden] { display: none !important; }
.fs-ticker .tk { width: min(100%, 520px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px;
  -webkit-user-select: none; user-select: none; }
.fs-ticker .tk-strip { display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 4px 0 10px; background: var(--panel-2); }
.fs-ticker .tk-title { font-weight: 600; font-size: 12px; }
.fs-ticker .tk-meta { color: var(--muted); font-family: var(--mono); font-size: 11px; font-variant-numeric: tabular-nums; }
.fs-ticker .tk-key { height: 22px; min-width: 22px; padding: 0 8px; border: 0; border-radius: var(--r-control); background: var(--block);
  box-shadow: var(--edge); color: var(--ink); font: 500 11px var(--font); cursor: pointer; display: inline-grid; place-items: center;
  transition: background-color var(--cut-in) var(--ease-out); -webkit-tap-highlight-color: transparent; }
.fs-ticker .tk-key:hover { background: var(--block-hover); }
.fs-ticker .tk-key:active { box-shadow: var(--edge-press); background: var(--block-hover); transform: scale(0.98); }
.fs-ticker .tk-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg); }
.fs-ticker .tk-key[aria-disabled="true"] { color: var(--disabled); cursor: default; }
.fs-ticker .tk-key svg { width: 10px; height: 10px; fill: currentColor; }
.fs-ticker .tk-follow { margin-left: auto; }
.fs-ticker .tk-body { padding: 8px; display: grid; gap: 8px; }
.fs-ticker .tk-line { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 4px 0 4px; border-radius: var(--r-control);
  background: var(--cut); box-shadow: var(--edge); outline-offset: 2px; }
.fs-ticker .tk-tag { flex: none; height: 24px; display: inline-flex; align-items: center; padding: 0 7px; border-radius: var(--r-control);
  font-weight: 600; font-size: 11px; background: var(--tint); color: var(--hue-text); }
.fs-ticker .tk-view { position: relative; flex: 1; min-width: 0; height: 100%; overflow: hidden; }
.fs-ticker .tk-text { position: absolute; left: 0; top: 50%; translate: 0 -50%; white-space: pre; font-size: 13px; font-weight: 500; }
.fs-ticker .tk-text b { font-weight: 600; }
.fs-ticker .tk-text b[data-tone="warn"] { color: var(--warning); }
.fs-ticker .tk-text b[data-tone="alert"] { color: var(--danger); }
.fs-ticker .tk-empty { position: absolute; inset: 0; display: flex; align-items: center; color: var(--muted); font-size: 13px; padding-left: 4px; }
.fs-ticker .tk-pos { flex: none; font-family: var(--mono); font-size: 11px; font-weight: 500; color: var(--muted); font-variant-numeric: tabular-nums;
  min-width: 3.2em; text-align: right; }
.fs-ticker .tk-log { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.fs-ticker .tk-row { display: grid; grid-template-columns: 6.4em minmax(0, 1fr) auto; align-items: center; gap: 8px; height: 24px; padding: 0 6px 0 10px;
  border-radius: var(--r-control); background-image: linear-gradient(var(--hue), var(--hue)); background-size: 3px 100%; background-repeat: no-repeat; cursor: pointer; animation: fs-tk-cut var(--cut-in) var(--ease-out); }
.fs-ticker .tk-row:hover { background-color: var(--panel-3); }
.fs-ticker .tk-row[aria-current="true"] { background-color: var(--panel-3); box-shadow: var(--edge); }
.fs-ticker .tk-row .tk-src { font-weight: 600; color: var(--hue-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fs-ticker .tk-row .tk-msg { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fs-ticker .tk-row[aria-current="true"] .tk-msg { color: var(--ink); }
.fs-ticker .tk-row .tk-bar { font-family: var(--mono); font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }
.fs-ticker .tk-keys { display: flex; gap: 4px; }
.fs-ticker .tk-keys .tk-key { height: 26px; padding: 0 12px; font-size: 12px; }
.fs-ticker .tk-cut { animation: fs-tk-cut var(--cut-in) var(--ease-out); }
@keyframes fs-tk-cut { from { opacity: 0; } }
.fs-ticker.is-tile .tk-keys, .fs-ticker.is-tile .tk-row:nth-child(n+4) { display: none; }
@container (min-width: 560px) { .fs-ticker .tk-row { height: 26px; } }
`;

  const TRI_L = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M7.5 1.5v7L2 5z"/></svg>';
  const TRI_R = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1.5v7L8 5z"/></svg>';
  const hue = (el, h) => { el.style.setProperty("--tint", `var(--clip-${h}-tint)`); el.style.setProperty("--hue-text", `var(--clip-${h}-text)`); el.style.setProperty("--hue", `var(--clip-${h})`); };

  function mount(host, ctx) {
    const { signal } = ctx;
    const id = "fs-tk-" + ++uid;
    const born = performance.now();
    host.innerHTML = `
      <div class="tk">
        <div class="tk-strip">
          <span class="tk-title">Activity</span><span class="tk-meta" aria-hidden="true"></span>
          <button type="button" class="tk-key tk-follow" aria-pressed="true">Follow</button>
        </div>
        <div class="tk-body">
          <div class="tk-line" role="group" tabindex="0" aria-label="Agent activity" aria-describedby="${id}-now ${id}-hint">
            <span class="tk-tag" aria-hidden="true" hidden></span>
            <div class="tk-view" aria-hidden="true"><span class="tk-text"></span><span class="tk-empty">No messages</span></div>
            <span class="tk-pos" aria-hidden="true"></span>
            <button type="button" class="tk-key tk-prev" tabindex="-1" aria-label="Previous message">${TRI_L}</button>
            <button type="button" class="tk-key tk-next" tabindex="-1" aria-label="Next message">${TRI_R}</button>
          </div>
          <ol class="tk-log" aria-hidden="true"></ol>
          <div class="tk-keys">
            <button type="button" class="tk-key tk-notify">Send a message</button>
            <button type="button" class="tk-key tk-clear">Clear</button>
          </div>
        </div>
        <p class="sr-only" id="${id}-now"></p>
        <p class="sr-only" id="${id}-hint">Hover or focus to pause. Left and right arrows step through the messages; F turns Follow on or off.</p>
        <div class="sr-only" role="status" aria-live="polite"></div>
      </div>`;
    const $ = (s) => host.querySelector(s);
    const line = $(".tk-line"), view = $(".tk-view"), textEl = $(".tk-text"), empty = $(".tk-empty"), tagEl = $(".tk-tag");
    const posEl = $(".tk-pos"), metaEl = $(".tk-meta"), logEl = $(".tk-log"), followBtn = $(".tk-follow");
    const prevBtn = $(".tk-prev"), nextBtn = $(".tk-next"), nowEl = $(`#${id}-now`), statusEl = $("[role=status]");

    /* When a message arrived, in the console's elapsed time. */
    const barNow = () => {
      const t = (performance.now() - born) / 1000;
      return `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;
    };

    /* --- The queue. --- */
    const q = { messages: [], index: -1, waiting: false };
    let nextId = 0, follow = true;
    const heard = [];
    function push(m) {
      nextId += 1;
      const all = [...q.messages, { id: nextId, ...m, at: barNow() }];
      const drop = Math.max(0, all.length - LIMIT);
      q.messages = all.slice(drop);
      if (q.index === -1 || (q.waiting && follow)) q.index = q.messages.length - 1;
      else q.index = Math.max(0, q.index - drop);
      q.waiting = false;
      update(true);
    }
    function finished(mid) {
      if (!q.messages[q.index] || q.messages[q.index].id !== mid) return;
      if (follow && q.index < q.messages.length - 1) q.index += 1;
      else q.waiting = true;
      update();
    }
    function go(i, byHand) {
      if (!q.messages.length) return;
      const to = Math.min(q.messages.length - 1, Math.max(0, i));
      if (to === q.index) return;
      q.index = to;
      q.waiting = false;
      if (byHand) setFollow(false);
      update();
    }
    function clear() { q.messages = []; q.index = -1; q.waiting = false; update(); }
    function setFollow(on) {
      follow = on;
      followBtn.setAttribute("aria-pressed", String(on));
      // Follow back on: the newest message is shown, as a DAW jumps back to the playhead.
      if (on && q.messages.length && q.index < q.messages.length - 1) { q.index = q.messages.length - 1; q.waiting = false; update(); }
    }
    const current = () => q.messages[q.index] || null;

    let shownId, rowsFor = [];
    function update(arrived) {
      const cur = current();
      tagEl.hidden = !cur;
      if (cur) { tagEl.textContent = SOURCES[cur.src].name; hue(tagEl, SOURCES[cur.src].hue); }
      posEl.textContent = q.messages.length ? `${q.index + 1}/${q.messages.length}` : "";
      metaEl.textContent = held() && cur ? "Paused" : q.messages.length ? `${q.messages.length} ${q.messages.length === 1 ? "message" : "messages"}` : "";
      prevBtn.setAttribute("aria-disabled", String(q.index <= 0));
      nextBtn.setAttribute("aria-disabled", String(q.index >= q.messages.length - 1));
      nowEl.textContent = cur ? `Message ${q.index + 1} of ${q.messages.length}, from ${SOURCES[cur.src].name}: ${cur.tone !== "info" ? TONES[cur.tone] + ": " : ""}${cur.text}` : "No messages";
      if (cur && !heard.includes(cur.id)) {
        heard.push(cur.id);
        statusEl.textContent = `${SOURCES[cur.src].name}: ${cur.tone !== "info" ? TONES[cur.tone] + ": " : ""}${cur.text}`;
      }
      renderLog(arrived);
      const sid = cur ? cur.id : undefined;
      if (sid !== shownId) { shownId = sid; show(cur); }
    }

    /* The log, newest at the top; a row that's new cuts in, the rest stay where they are. */
    function renderLog() {
      const list = [...q.messages].reverse();
      const known = new Map(rowsFor.map((r) => [r.dataset.id, r]));
      rowsFor = list.map((m) => {
        let row = known.get(String(m.id));
        if (!row) {
          row = document.createElement("li");
          row.className = "tk-row";
          row.dataset.id = String(m.id);
          row.innerHTML = '<span class="tk-src"></span><span class="tk-msg"></span><span class="tk-bar"></span>';
          row.children[0].textContent = SOURCES[m.src].name;
          row.children[1].textContent = (m.tone !== "info" ? TONES[m.tone] + ": " : "") + m.text;
          row.children[2].textContent = m.at;
          hue(row, SOURCES[m.src].hue);
          row.addEventListener("click", () => go(q.messages.findIndex((x) => x.id === m.id), true), { signal });
        }
        row.setAttribute("aria-current", String(current() === m));
        return row;
      });
      logEl.replaceChildren(...rowsFor);
    }

    /* --- The line. --- */
    let message = null, phase = "idle", offset = 0, pages = [], page = 0, textW = 0, viewW = 0, loop = null;
    const holds = new Set();
    let timer = 0, timerFn = null, timerLeft = 0, timerAt = 0;
    const arm = () => {
      timerAt = performance.now();
      timer = setTimeout(() => { const fn = timerFn; timerFn = null; if (!signal.aborted && fn) fn(); }, timerLeft);
    };
    const wait = (ms, fn) => { clearTimeout(timer); timerFn = fn; timerLeft = ms; if (!holds.size) arm(); };
    const fits = () => textW <= viewW;

    function paint() {
      textEl.style.transform = `translateX(${-offset}px)`;
      if (phase === "page") {
        const [a, b] = pages[page] || [0, textW];
        textEl.style.clipPath = `inset(0 ${Math.max(0, textW - b)}px 0 ${a}px)`;
      } else textEl.style.clipPath = "";
    }
    function measure() { viewW = view.clientWidth - 6; textW = textEl.scrollWidth; }
    function words() {
      const out = [];
      const walker = document.createTreeWalker(textEl, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      const base = textEl.getBoundingClientRect().left;
      let node;
      while ((node = walker.nextNode())) {
        const re = /\S+/g;
        let m;
        while ((m = re.exec(node.data))) {
          range.setStart(node, m.index);
          range.setEnd(node, m.index + m[0].length);
          const r = range.getBoundingClientRect();
          out.push([r.left - base, r.right - base]);
        }
      }
      return out;
    }
    function paginate() {
      const list = [];
      let start = -1, end = 0;
      for (const [a, b] of words()) {
        if (start >= 0 && b - start <= viewW) { end = b; continue; }
        if (start >= 0) list.push([start, end]);
        start = a;
        while (b - start > viewW) { list.push([start, start + viewW]); start += viewW; }
        end = b;
      }
      if (start >= 0) list.push([start, end]);
      return list.length ? list : [[0, textW]];
    }
    function run() {
      if (loop || holds.size || phase !== "run") return;
      loop = ctx.loop((dt) => {
        if (holds.size || phase !== "run") { loop = null; return false; }
        const end = textW - viewW;
        offset = Math.min(end, offset + SPEED * dt);
        paint();
        if (offset >= end) { phase = "end"; wait(HOLD, done); loop = null; return false; }
      });
    }
    function done() {
      const mid = message && message.id;
      const long = !fits();
      phase = "rest";
      if (mid !== undefined) finished(mid);
      // Nothing after it: a long message jumps back to its start, on the frame.
      if (long && message && message.id === mid) wait(HOLD, () => { offset = 0; paint(); });
    }
    function showPage() {
      offset = pages[page][0];
      paint();
      wait(PAGE, () => {
        if (page < pages.length - 1) { page++; showPage(); return; }
        const mid = message && message.id;
        if (message) finished(message.id);
        if (pages.length > 1 && message && message.id === mid) wait(PAGE, () => { page = 0; showPage(); });
      });
    }
    function show(m) {
      clearTimeout(timer); timerFn = null;
      if (loop) { loop.stop = true; loop = null; }
      message = m;
      textEl.textContent = "";
      if (m) {
        if (m.tone !== "info") {
          const b = document.createElement("b");
          b.dataset.tone = m.tone;
          b.textContent = TONES[m.tone] + "  ";
          textEl.appendChild(b);
        }
        textEl.appendChild(document.createTextNode(m.text));
      }
      empty.hidden = !!m;
      offset = 0; pages = []; page = 0;
      measure();
      // It cuts in: opacity alone, on the frame.
      textEl.classList.remove("tk-cut"); void textEl.offsetWidth; if (m) textEl.classList.add("tk-cut");
      if (!m) { phase = "idle"; paint(); return; }
      if (ctx.reduced()) { phase = "page"; pages = paginate(); showPage(); return; }
      phase = "rest";
      paint();
      if (fits()) wait(DWELL + m.text.length * 40, done);
      else wait(HOLD, () => { phase = "run"; run(); });
    }
    function hold(reason, on) {
      const was = holds.size > 0;
      if (on) holds.add(reason); else holds.delete(reason);
      const now = holds.size > 0;
      if (now === was) return;
      if (now) {
        if (loop) { loop.stop = true; loop = null; }
        if (timerFn) { clearTimeout(timer); timerLeft = Math.max(0, timerLeft - (performance.now() - timerAt)); }
      } else { if (timerFn) arm(); run(); }
    }

    /* A hand on the line holds it. */
    let hover = false, focus = false;
    const held = () => hover || focus;
    const handHold = () => { hold("hand", held()); const cur = current(); metaEl.textContent = held() && cur ? "Paused" : q.messages.length ? `${q.messages.length} ${q.messages.length === 1 ? "message" : "messages"}` : ""; };
    line.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hover = true; handHold(); } }, { signal });
    line.addEventListener("pointerleave", () => { hover = false; handHold(); }, { signal });
    line.addEventListener("focus", () => { focus = true; handHold(); }, { signal });
    line.addEventListener("blur", () => { focus = false; handHold(); }, { signal });
    line.addEventListener("keydown", (e) => {
      if (e.key === "f" || e.key === "F") { e.preventDefault(); setFollow(!follow); return; }
      const to = { ArrowLeft: q.index - 1, ArrowRight: q.index + 1, Home: 0, End: q.messages.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      if (!q.messages.length || to < 0 || to >= q.messages.length || to === q.index) return;
      go(to, true);
    }, { signal });
    prevBtn.addEventListener("click", () => { if (q.index > 0) go(q.index - 1, true); }, { signal });
    nextBtn.addEventListener("click", () => { if (q.index < q.messages.length - 1) go(q.index + 1, true); }, { signal });
    followBtn.addEventListener("click", () => setFollow(!follow), { signal });

    const seen = new IntersectionObserver(([entry]) => hold("offscreen", !entry.isIntersecting));
    seen.observe(line);
    const resize = new ResizeObserver(() => {
      if (!message) return;
      measure();
      if (phase === "run" || phase === "end") offset = Math.min(offset, Math.max(0, textW - viewW));
      paint();
    });
    resize.observe(view);

    let sample = 0;
    $(".tk-notify").addEventListener("click", () => push(SAMPLES[sample++ % SAMPLES.length]), { signal });
    $(".tk-clear").addEventListener("click", () => { if (q.messages.length) clear(); }, { signal });

    /* --- Untouched, the set reports in: four messages a moment apart, then it starts over. --- */
    let auto = true;
    ctx.onHand(() => { auto = false; });
    if (ctx.reduced()) {
      ctx.after(300, () => ARRIVALS.forEach((m) => push(m)));
    } else {
      let i = 0;
      const step = () => {
        if (!auto) return;
        if (i < ARRIVALS.length) { push(ARRIVALS[i++]); ctx.after(GAP, step); }
        else if (!q.waiting) ctx.after(400, step);
        else ctx.after(2600, () => { if (!auto) return; clear(); i = 0; ctx.after(900, step); });
      };
      ctx.after(300, step);
    }

    update();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!signal.aborted && message) { measure(); paint(); } });

    return { destroy() { clearTimeout(timer); seen.disconnect(); resize.disconnect(); } };
  }

  FlatPlayer.register({
    slug: "ticker",
    title: "Ticker",
    tagline: "An agent console's activity line, every message logged by agent.",
    css,
    mount,
  });
})();
