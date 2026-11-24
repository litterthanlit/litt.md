/* Ticker, after litterthanlit/components (ticker.tsx), in Rack 2.0.
 * An agent console's activity, as one surface. The title strip holds the queue's position between two step keys, Send
 * and Follow (the lit key). The surface holds the messages as objects, newest on top, each in its agent's colour (a
 * soft tint, a 1px edge in the hue, the agent's name small in the hue's text tone) with the message under it; the one
 * the line is on is selected with a 2px edge. A message cuts in by opacity; on the selected object a message longer
 * than its box holds, runs along at a steady speed (time moves it, not the UI), holds at its end and jumps back. With
 * Follow on, the selection advances through the queue by itself; stepping by hand turns Follow off. Hover or focus
 * pauses. Under reduced motion nothing runs along: a long message pages through a boxful of whole words at a time. */
(function () {
  const DWELL = 2000; // ms a message that fits stays, plus a little per character
  const HOLD = 1000; // ms a long message holds at its start and its end
  const PAGE = 2400; // ms per boxful under reduced motion
  const SPEED = 60; // px a second
  const LIMIT = 5;
  const GAP = 2600; // ms between arrivals while untouched
  let uid = 0;

  const AGENTS = {
    planner: { name: "Planner", hue: "purple" },
    research: { name: "Researcher", hue: "blue" },
    coder: { name: "Coder", hue: "orange" },
    review: { name: "Reviewer", hue: "green" },
  };
  const TONES = { info: "", warn: "Warning", alert: "Failed" };
  const ARRIVALS = [
    { src: "research", text: "Read 14 pages on rate limits", tone: "info" },
    { src: "coder", text: "Opened branch fix/auth-retry", tone: "info" },
    { src: "planner", text: "Budget at 88 %, 4 steps left", tone: "warn" },
    { src: "review", text: "Preview build ran out of memory. Raise the limit to 4 GB and run it again", tone: "alert" },
  ];
  const SAMPLES = [
    { src: "review", text: "Approved 3 of 4 diffs", tone: "info" },
    { src: "coder", text: "Tests passing, 212 of 212", tone: "info" },
    { src: "research", text: "Search tool rate limited", tone: "alert" },
    { src: "planner", text: "Waiting for approval to spend $4.00", tone: "warn" },
    ...ARRIVALS,
  ];

  const css = `
.fs-ticker [hidden] { display: none !important; }
.fs-ticker .tk { width: min(100%, 520px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px;
  -webkit-user-select: none; user-select: none; }
.fs-ticker .tk-strip { display: flex; align-items: center; gap: 4px; height: 32px; padding: 0 6px 0 14px; background: var(--panel-2); }
.fs-ticker .tk-strip > b { font-weight: 600; margin-right: auto; }
.fs-ticker .tk-key { height: 22px; min-width: 22px; padding: 0 8px; border: 0; border-radius: var(--r-control); background: var(--block);
  box-shadow: var(--edge); color: var(--ink); font: 600 11px var(--font); cursor: pointer; display: inline-grid; place-items: center;
  transition: background-color var(--cut-in) var(--ease-out); -webkit-tap-highlight-color: transparent; }
.fs-ticker .tk-key:hover { background: var(--block-hover); }
.fs-ticker .tk-key:active { box-shadow: var(--edge-press); background: var(--block-hover); transform: scale(0.98); }
.fs-ticker .tk-key[aria-pressed="true"] { background: var(--accent); color: var(--accent-fg); }
.fs-ticker .tk-key[aria-disabled="true"] { color: var(--disabled); cursor: default; }
.fs-ticker .tk-key svg { width: 9px; height: 9px; fill: currentColor; }
.fs-ticker .tk-pos { height: 22px; min-width: 40px; padding: 0 6px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  font: 600 11px/22px var(--mono); text-align: center; font-variant-numeric: tabular-nums; }
.fs-ticker .tk-send { margin-left: 6px; }
.fs-ticker .tk-surface { margin: 14px; min-height: 120px; padding: 8px; border-radius: var(--r-control); background: var(--cut); box-shadow: var(--edge);
  display: grid; align-content: start; gap: 6px; outline-offset: 2px; }
.fs-ticker .tk-msg { position: relative; display: grid; gap: 2px; padding: 6px 8px 7px; border-radius: var(--r-control); background: var(--tint);
  box-shadow: inset 0 0 0 1px var(--hue); color: var(--ink); cursor: pointer; animation: fs-tk-cut var(--cut-in) var(--ease-out); min-width: 0; }
.fs-ticker .tk-msg[aria-current="true"] { box-shadow: inset 0 0 0 2px var(--hue); }
.fs-ticker .tk-name { font-size: 10px; font-weight: 600; color: var(--hue-text); line-height: 1.2; }
.fs-ticker .tk-view { position: relative; height: 18px; overflow: hidden; }
.fs-ticker .tk-text { position: absolute; left: 0; top: 0; white-space: pre; font-size: 13px; font-weight: 500; line-height: 18px; }
.fs-ticker .tk-msg:not([aria-current="true"]) .tk-text { position: static; display: block; overflow: hidden; text-overflow: ellipsis; }
.fs-ticker .tk-text b { font-weight: 600; color: var(--muted); }
.fs-ticker .tk-text b[data-tone="alert"] { color: var(--danger); }
.fs-ticker .tk-empty { color: var(--muted); padding: 4px 2px; }
@keyframes fs-tk-cut { from { opacity: 0; } }
.fs-ticker.is-tile .tk-msg:nth-child(n+4) { display: none; }
.fs-ticker.is-tile .tk-surface { margin: 12px; }
`;

  const TRI_L = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M7.5 1.5v7L2 5z"/></svg>';
  const TRI_R = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1.5v7L8 5z"/></svg>';
  const hue = (el, h) => {
    el.style.setProperty("--tint", `var(--clip-${h}-tint)`);
    el.style.setProperty("--hue", `var(--clip-${h})`);
    el.style.setProperty("--hue-text", `var(--clip-${h}-text)`);
  };
  const said = (m) => `${AGENTS[m.src].name}: ${m.tone !== "info" ? TONES[m.tone] + ": " : ""}${m.text}`;

  function mount(host, ctx) {
    const { signal } = ctx;
    const id = "fs-tk-" + ++uid;
    host.innerHTML = `
      <div class="tk">
        <div class="tk-strip">
          <b>Activity</b>
          <button type="button" class="tk-key tk-prev" tabindex="-1" aria-label="Previous message">${TRI_L}</button>
          <span class="tk-pos" aria-hidden="true">0/0</span>
          <button type="button" class="tk-key tk-next" tabindex="-1" aria-label="Next message">${TRI_R}</button>
          <button type="button" class="tk-key tk-send">Send</button>
          <button type="button" class="tk-key tk-follow" aria-pressed="true">Follow</button>
        </div>
        <div class="tk-surface" role="group" tabindex="0" aria-label="Agent activity" aria-describedby="${id}-now ${id}-hint"></div>
        <p class="sr-only" id="${id}-now"></p>
        <p class="sr-only" id="${id}-hint">Hover or focus to pause. Left and right arrows step through the messages; F turns Follow on or off.</p>
        <div class="sr-only" role="status" aria-live="polite"></div>
      </div>`;
    const $ = (s) => host.querySelector(s);
    const surface = $(".tk-surface"), posEl = $(".tk-pos"), followBtn = $(".tk-follow");
    const prevBtn = $(".tk-prev"), nextBtn = $(".tk-next"), nowEl = $(`#${id}-now`), statusEl = $("[role=status]");

    /* --- The queue. --- */
    const q = { messages: [], index: -1, waiting: false };
    let nextId = 0, follow = true;
    const heard = [];
    function push(m) {
      nextId += 1;
      const all = [...q.messages, { id: nextId, ...m }];
      const drop = Math.max(0, all.length - LIMIT);
      q.messages = all.slice(drop);
      if (q.index === -1 || (q.waiting && follow)) q.index = q.messages.length - 1;
      else q.index = Math.max(0, q.index - drop);
      q.waiting = false;
      update();
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
    function setFollow(on) {
      follow = on;
      followBtn.setAttribute("aria-pressed", String(on));
      if (on && q.messages.length && q.index < q.messages.length - 1) { q.index = q.messages.length - 1; q.waiting = false; update(); }
    }
    const current = () => q.messages[q.index] || null;

    /* --- The surface: an object per message, newest on top; a new one cuts in, the rest stay put. --- */
    let objs = new Map(), shownId;
    function update() {
      const cur = current();
      posEl.textContent = q.messages.length ? `${q.index + 1}/${q.messages.length}` : "0/0";
      prevBtn.setAttribute("aria-disabled", String(q.index <= 0));
      nextBtn.setAttribute("aria-disabled", String(q.index >= q.messages.length - 1));
      nowEl.textContent = cur ? `Message ${q.index + 1} of ${q.messages.length}. ${said(cur)}` : "No messages";
      if (cur && !heard.includes(cur.id)) { heard.push(cur.id); statusEl.textContent = said(cur); }
      const next = new Map();
      const list = [...q.messages].reverse().map((m) => {
        let el = objs.get(m.id);
        if (!el) {
          el = document.createElement("div");
          el.className = "tk-msg";
          el.innerHTML = '<span class="tk-name"></span><div class="tk-view"><span class="tk-text"></span></div>';
          el.querySelector(".tk-name").textContent = AGENTS[m.src].name;
          const t = el.querySelector(".tk-text");
          if (m.tone !== "info") { const b = document.createElement("b"); b.dataset.tone = m.tone; b.textContent = TONES[m.tone] + "  "; t.appendChild(b); }
          t.appendChild(document.createTextNode(m.text));
          hue(el, AGENTS[m.src].hue);
          el.addEventListener("click", () => go(q.messages.findIndex((x) => x.id === m.id), true), { signal });
        }
        el.setAttribute("aria-current", String(m === cur));
        next.set(m.id, el);
        return el;
      });
      objs = next;
      // Only what's new moves into place: an object already on the surface is never reinserted, so it never cuts in again.
      [...surface.children].forEach((c) => { if (!list.includes(c)) c.remove(); });
      for (let i = list.length - 1; i >= 0; i--) if (!list[i].isConnected) surface.insertBefore(list[i], list[i + 1] && list[i + 1].isConnected ? list[i + 1] : null);
      if (!list.length) { const e = document.createElement("p"); e.className = "tk-empty"; e.textContent = "No activity yet"; surface.appendChild(e); }
      const sid = cur ? cur.id : undefined;
      if (sid !== shownId) { shownId = sid; show(cur); }
    }

    /* --- The selected message: dwell, or hold, run along, hold, jump back. --- */
    let message = null, textEl = null, viewEl = null, phase = "idle", offset = 0, pages = [], page = 0, textW = 0, viewW = 0, loop = null;
    const holds = new Set();
    let timer = 0, timerFn = null, timerLeft = 0, timerAt = 0;
    const arm = () => {
      timerAt = performance.now();
      timer = setTimeout(() => { const fn = timerFn; timerFn = null; if (!signal.aborted && fn) fn(); }, timerLeft);
    };
    const wait = (ms, fn) => { clearTimeout(timer); timerFn = fn; timerLeft = ms; if (!holds.size) arm(); };
    const fits = () => textW <= viewW;
    function paint() {
      if (!textEl) return;
      textEl.style.transform = `translateX(${-offset}px)`;
      if (phase === "page") {
        const [a, b] = pages[page] || [0, textW];
        textEl.style.clipPath = `inset(0 ${Math.max(0, textW - b)}px 0 ${a}px)`;
      } else textEl.style.clipPath = "";
    }
    function measure() { if (!textEl) return; viewW = viewEl.clientWidth; textW = textEl.scrollWidth; }
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
      if (textEl) { textEl.style.transform = ""; textEl.style.clipPath = ""; }
      message = m;
      const el = m && objs.get(m.id);
      textEl = el ? el.querySelector(".tk-text") : null;
      viewEl = el ? el.querySelector(".tk-view") : null;
      offset = 0; pages = []; page = 0;
      if (!m) { phase = "idle"; return; }
      measure();
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

    /* A hand on the surface holds it. */
    let hover = false, focus = false;
    const handHold = () => hold("hand", hover || focus);
    surface.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hover = true; handHold(); } }, { signal });
    surface.addEventListener("pointerleave", () => { hover = false; handHold(); }, { signal });
    surface.addEventListener("focus", () => { focus = true; handHold(); }, { signal });
    surface.addEventListener("blur", () => { focus = false; handHold(); }, { signal });
    surface.addEventListener("keydown", (e) => {
      if (e.key === "f" || e.key === "F") { e.preventDefault(); setFollow(!follow); return; }
      // Newest is on top, so Up and Left go to newer, as the eye reads.
      const to = { ArrowLeft: q.index - 1, ArrowRight: q.index + 1, ArrowUp: q.index + 1, ArrowDown: q.index - 1, Home: 0, End: q.messages.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      if (!q.messages.length || to < 0 || to >= q.messages.length || to === q.index) return;
      go(to, true);
    }, { signal });
    prevBtn.addEventListener("click", () => { if (q.index > 0) go(q.index - 1, true); }, { signal });
    nextBtn.addEventListener("click", () => { if (q.index < q.messages.length - 1) go(q.index + 1, true); }, { signal });
    followBtn.addEventListener("click", () => setFollow(!follow), { signal });
    let sample = 0;
    $(".tk-send").addEventListener("click", () => push(SAMPLES[sample++ % SAMPLES.length]), { signal });

    const seen = new IntersectionObserver(([entry]) => hold("offscreen", !entry.isIntersecting));
    seen.observe(surface);
    const resize = new ResizeObserver(() => {
      if (!message) return;
      measure();
      if (phase === "run" || phase === "end") offset = Math.min(offset, Math.max(0, textW - viewW));
      paint();
    });
    resize.observe(surface);

    /* --- Untouched, the agents report in: four messages a moment apart, then it starts over. --- */
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
        else ctx.after(2600, () => { if (!auto) return; q.messages = []; q.index = -1; q.waiting = false; update(); i = 0; ctx.after(900, step); });
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
    tagline: "Agent activity on one surface, each message in its agent's colour.",
    css,
    mount,
  });
})();
