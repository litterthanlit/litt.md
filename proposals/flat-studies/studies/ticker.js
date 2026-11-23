/* Ticker, after litterthanlit/components (ticker.tsx), redesigned in Flat.
 * Notifications as one line: a white pill on the ground that types each message as it arrives, with the count
 * and two small grey circles to step through the queue. A message that fits types on and stays a moment; a longer
 * one holds, slides along at a steady speed, holds at its end and glides back. Warnings and alerts lead with a
 * small coloured word; everything else is just the message. A hand on the line pauses it; the arrows (and Home,
 * End) step through the queue. Opened, Notify and Clear sit under it. Under reduced motion nothing slides: a long
 * message pages through a pillful of whole words at a time. Each message is said once. */
(function () {
  const TYPE_RATE = 42; // characters a second while typing on
  const DWELL = 2000; // ms a message that fits stays, plus a little per character
  const HOLD = 1000; // ms a long message holds at its start and its end
  const PAGE = 2400; // ms per pillful under reduced motion
  const SPEED = 64; // px a second
  const LIMIT = 9;
  const GAP = 2600; // ms between arrivals while untouched
  let uid = 0;

  const TONES = {
    info: { word: "", said: "" },
    warn: { word: "Heads up", said: "Heads up: " },
    alert: { word: "Alert", said: "Alert: " },
  };
  const ARRIVALS = [
    { text: "Draft saved", tone: "info" },
    { text: "Zoë left 2 comments", tone: "info" },
    { text: "Storage is 88% full", tone: "warn" },
    { text: "Your site is over its plan. Upgrade to keep publishing new posts", tone: "alert" },
  ];
  const SAMPLES = [
    { text: "Issue 05 is scheduled", tone: "info" },
    { text: "12 new readers this week", tone: "info" },
    { text: "Your domain renews in 3 days", tone: "warn" },
    { text: "Backup done", tone: "info" },
    { text: "A post failed to publish", tone: "alert" },
    ...ARRIVALS,
  ];

  const css = `
.fs-ticker [hidden] { display: none !important; }
.fs-ticker .tk { width: min(100%, 520px); display: grid; gap: 16px; justify-items: center; -webkit-user-select: none; user-select: none; }
.fs-ticker .tk-line { width: 100%; height: 60px; display: flex; align-items: center; gap: 10px; padding: 0 8px 0 24px; border-radius: var(--r-pill);
  background: var(--paper); color: var(--ink); outline-offset: 3px; transform-origin: 50% 50%; }
.fs-ticker .tk-word { flex: none; font-size: 15px; font-weight: 600; }
.fs-ticker .tk-word[data-tone="warn"] { color: var(--warning); }
.fs-ticker .tk-word[data-tone="alert"] { color: var(--cherry-text); }
.fs-ticker .tk-view { position: relative; flex: 1; min-width: 0; height: 100%; overflow: hidden; }
.fs-ticker .tk-view.is-long { -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 20px), transparent);
  mask-image: linear-gradient(90deg, #000 calc(100% - 20px), transparent); }
.fs-ticker .tk-view.is-moved { -webkit-mask-image: linear-gradient(90deg, transparent, #000 20px, #000 calc(100% - 20px), transparent);
  mask-image: linear-gradient(90deg, transparent, #000 20px, #000 calc(100% - 20px), transparent); }
.fs-ticker .tk-text { position: absolute; left: 0; top: 50%; translate: 0 -50%; white-space: pre; font-size: 17px; font-weight: 500;
  letter-spacing: -0.01em; }
.fs-ticker .tk-caret { position: absolute; top: 50%; width: 2px; height: 22px; margin: -11px 0 0 1px; border-radius: 1px; background: var(--ink);
  pointer-events: none; }
.fs-ticker .tk-empty { position: absolute; inset: 0; display: flex; align-items: center; color: var(--muted); font-size: 17px; }
.fs-ticker .tk-count { flex: none; color: var(--muted); font-size: 14px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.fs-ticker .tk-step { flex: none; width: 40px; height: 40px; border: 0; padding: 0; border-radius: 50%; background: var(--bubble); color: var(--ink);
  display: grid; place-items: center; cursor: pointer; transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), opacity 150ms;
  -webkit-tap-highlight-color: transparent; }
.fs-ticker .tk-step + .tk-step { margin-left: -4px; }
.fs-ticker .tk-step:active { transform: scale(0.92); transition-duration: 75ms; }
.fs-ticker .tk-step[aria-disabled="true"] { opacity: 0.4; cursor: default; }
.fs-ticker .tk-step svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.fs-ticker .tk-keys { display: flex; gap: 8px; }
.fs-ticker .tk-keys button { height: 44px; border: 0; border-radius: var(--r-pill); padding: 0 22px; font-size: 15px; font-weight: 500;
  background: var(--paper); color: var(--ink); cursor: pointer; transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
  -webkit-tap-highlight-color: transparent; }
.fs-ticker .tk-keys button:active { transform: scale(0.95); transition-duration: 75ms; }
.fs-ticker .tk-keys .tk-notify { background: var(--ink); color: var(--on-ink); }
.fs-ticker.is-tile .tk-keys { display: none; }
@container (max-width: 380px) {
  .fs-ticker .tk-line { height: 52px; padding-left: 18px; gap: 8px; }
  .fs-ticker .tk-text, .fs-ticker .tk-empty { font-size: 15px; }
  .fs-ticker .tk-word { font-size: 14px; }
  .fs-ticker .tk-step { width: 36px; height: 36px; }
  .fs-ticker .tk-count { font-size: 13px; }
}
`;

  const ARROW = (d) => `<svg viewBox="0 0 14 14" aria-hidden="true"><path d="${d}"/></svg>`;

  function mount(host, ctx) {
    const { signal } = ctx;
    const id = "fs-tk-" + ++uid;
    host.innerHTML = `
      <div class="tk">
        <div class="tk-line" role="group" tabindex="0" aria-label="Notifications" aria-describedby="${id}-now ${id}-hint">
          <span class="tk-word" aria-hidden="true" hidden></span>
          <div class="tk-view" aria-hidden="true"><span class="tk-text"></span><span class="tk-caret" hidden></span>
            <span class="tk-empty">You're all caught up</span></div>
          <span class="tk-count" aria-hidden="true" hidden></span>
          <button type="button" class="tk-step" tabindex="-1" aria-label="Previous notification">${ARROW("M8.5 3.5 5 7l3.5 3.5")}</button>
          <button type="button" class="tk-step" tabindex="-1" aria-label="Next notification">${ARROW("M5.5 3.5 9 7l-3.5 3.5")}</button>
        </div>
        <div class="tk-keys">
          <button type="button" class="tk-notify">Notify me</button>
          <button type="button" class="tk-clear">Clear all</button>
        </div>
        <p class="sr-only" id="${id}-now"></p>
        <p class="sr-only" id="${id}-hint">Hover or focus to pause. Left and right arrows step through the notifications.</p>
        <div class="sr-only" role="status" aria-live="polite"></div>
      </div>`;
    const $ = (s) => host.querySelector(s);
    const line = $(".tk-line"), view = $(".tk-view"), textEl = $(".tk-text"), caret = $(".tk-caret"), empty = $(".tk-empty");
    const wordEl = $(".tk-word"), countEl = $(".tk-count"), nowEl = $(`#${id}-now`), statusEl = $("[role=status]");
    const [prevBtn, nextBtn] = host.querySelectorAll(".tk-step");

    /* An arrival pops the pill on Flat's expressive spring. */
    const pop = ctx.spring(1, (s) => { line.style.transform = s === 1 ? "" : `scale(${s})`; }, { duration: 0.35, bounce: 0.28 });

    /* --- The queue. --- */
    const q = { messages: [], index: -1, waiting: false };
    let nextId = 0;
    const heard = [];
    function push(text, tone) {
      nextId += 1;
      const all = [...q.messages, { id: nextId, text, tone }];
      const drop = Math.max(0, all.length - LIMIT);
      q.messages = all.slice(drop);
      if (q.index === -1 || q.waiting) q.index = q.messages.length - 1;
      else q.index = Math.max(0, q.index - drop);
      q.waiting = false;
      if (!ctx.reduced()) { pop.jump(0.96); pop.set(1); }
      update();
    }
    function finished(mid) {
      if (!q.messages[q.index] || q.messages[q.index].id !== mid) return;
      if (q.index < q.messages.length - 1) q.index += 1;
      else q.waiting = true;
      update();
    }
    function go(i) {
      if (!q.messages.length) return;
      q.index = Math.min(q.messages.length - 1, Math.max(0, i));
      q.waiting = false;
      update();
    }
    function clear() { q.messages = []; q.index = -1; q.waiting = false; update(); }
    const current = () => q.messages[q.index] || null;

    let shownId;
    function update() {
      const cur = current();
      const word = cur ? TONES[cur.tone].word : "";
      wordEl.hidden = !word;
      wordEl.textContent = word;
      wordEl.dataset.tone = cur ? cur.tone : "";
      countEl.hidden = !q.messages.length;
      countEl.textContent = q.messages.length ? `${q.index + 1} of ${q.messages.length}` : "";
      prevBtn.setAttribute("aria-disabled", String(q.index <= 0));
      nextBtn.setAttribute("aria-disabled", String(q.index >= q.messages.length - 1));
      nowEl.textContent = cur ? `Notification ${q.index + 1} of ${q.messages.length}: ${TONES[cur.tone].said}${cur.text}` : "No notifications";
      if (cur && !heard.includes(cur.id)) {
        heard.push(cur.id);
        statusEl.textContent = TONES[cur.tone].said + cur.text;
      }
      const sid = cur ? cur.id : undefined;
      if (sid !== shownId) { shownId = sid; show(cur); }
    }

    /* --- The display. --- */
    let message = null, phase = "idle", offset = 0, typed = Infinity, edges = [], pages = [], page = 0;
    let textW = 0, viewW = 0, loop = null;
    const holds = new Set();
    let timer = 0, timerFn = null, timerLeft = 0, timerAt = 0;
    const arm = () => {
      timerAt = performance.now();
      timer = setTimeout(() => { const fn = timerFn; timerFn = null; if (!signal.aborted && fn) fn(); }, timerLeft);
    };
    const wait = (ms, fn) => { clearTimeout(timer); timerFn = fn; timerLeft = ms; if (!holds.size) arm(); };
    const fits = () => textW <= viewW;
    const back = ctx.spring(0, (x) => { offset = x; paint(); }, { duration: 0.5, bounce: 0 });

    function paint() {
      textEl.style.transform = `translateX(${-offset}px)`;
      view.classList.toggle("is-long", !fits() && phase !== "page");
      view.classList.toggle("is-moved", !fits() && phase !== "page" && offset > 0.5);
      let right = textW;
      if (phase === "type") right = typed > 0 ? edges[Math.min(edges.length, Math.floor(typed)) - 1] || 0 : 0;
      if (phase === "page") {
        const [a, b] = pages[page] || [0, textW];
        textEl.style.clipPath = `inset(0 ${Math.max(0, textW - b)}px 0 ${a}px)`;
      } else textEl.style.clipPath = right >= textW ? "" : `inset(0 ${Math.max(0, textW - right)}px 0 0)`;
      caret.hidden = phase !== "type";
      if (!caret.hidden) caret.style.left = `${right - offset}px`;
    }

    /* Where each character (grapheme) ends, and each word's span, from the rendered text. */
    function ranges(re) {
      const out = [];
      const node = textEl.firstChild;
      if (!node) return out;
      const range = document.createRange();
      const base = textEl.getBoundingClientRect().left;
      let m;
      while ((m = re.exec(node.data))) {
        range.setStart(node, m.index);
        range.setEnd(node, m.index + m[0].length);
        const r = range.getBoundingClientRect();
        out.push([r.left - base, r.right - base]);
      }
      return out;
    }
    function measure() {
      viewW = view.clientWidth;
      textW = textEl.scrollWidth;
      // Grapheme ends; a run of spaces is typed with the letter after it.
      edges = ranges(/\s*\S/gu).map(([, b]) => b);
    }
    function paginate() {
      const list = [];
      let start = -1, end = 0;
      for (const [a, b] of ranges(/\S+/g)) {
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
      if (loop || holds.size) return;
      loop = ctx.loop((dt) => {
        if (holds.size || !message) { loop = null; return false; }
        if (phase === "type") {
          // Type until the line is full; what's past the edge comes on with the slide.
          let span = edges.findIndex((e) => e > viewW);
          span = span < 0 ? edges.length : span;
          typed = Math.min(span, typed + TYPE_RATE * dt);
          paint();
          if (typed >= span) { typed = Infinity; phase = "typed"; paint(); afterTyping(); loop = null; return false; }
        } else if (phase === "slide") {
          const end = textW - viewW;
          offset = Math.min(end, offset + SPEED * dt);
          paint();
          if (offset >= end) { phase = "end"; wait(HOLD, done); loop = null; return false; }
        } else { loop = null; return false; }
      });
    }
    function afterTyping() {
      if (fits()) { phase = "dwell"; wait(DWELL + (message ? message.text.length : 0) * 40, done); }
      else { phase = "start"; wait(HOLD, () => { phase = "slide"; run(); }); }
    }
    function done() {
      const mid = message && message.id;
      const long = !fits();
      phase = "rest";
      if (mid !== undefined) finished(mid);
      // Nothing after it: a long message glides back to its start and rests there.
      if (long && message && message.id === mid) wait(HOLD, () => back.set(0));
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
      back.stop();
      message = m;
      textEl.textContent = m ? m.text : "";
      empty.hidden = !!m;
      offset = 0; typed = Infinity; pages = []; page = 0; phase = "idle";
      measure();
      if (!m) { paint(); return; }
      if (ctx.reduced()) { phase = "page"; pages = paginate(); showPage(); }
      else { phase = "type"; typed = 0; paint(); run(); }
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
    const handHold = () => hold("hand", hover || focus);
    line.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hover = true; handHold(); } }, { signal });
    line.addEventListener("pointerleave", () => { hover = false; handHold(); }, { signal });
    line.addEventListener("focus", () => { focus = true; handHold(); }, { signal });
    line.addEventListener("blur", () => { focus = false; handHold(); }, { signal });
    line.addEventListener("keydown", (e) => {
      const to = { ArrowLeft: q.index - 1, ArrowRight: q.index + 1, Home: 0, End: q.messages.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      if (!q.messages.length || to < 0 || to >= q.messages.length || to === q.index) return;
      go(to);
    }, { signal });
    prevBtn.addEventListener("click", () => { if (q.index > 0) go(q.index - 1); }, { signal });
    nextBtn.addEventListener("click", () => { if (q.index < q.messages.length - 1) go(q.index + 1); }, { signal });

    const seen = new IntersectionObserver(([entry]) => hold("offscreen", !entry.isIntersecting));
    seen.observe(line);
    const resize = new ResizeObserver(() => {
      if (!message) return;
      const keep = Math.floor(typed);
      measure();
      if (phase === "slide" || phase === "end") offset = Math.min(offset, Math.max(0, textW - viewW));
      typed = phase === "type" ? keep : typed;
      paint();
    });
    resize.observe(view);

    /* --- Notify and Clear. --- */
    let sample = 0;
    $(".tk-notify").addEventListener("click", () => { const m = SAMPLES[sample++ % SAMPLES.length]; push(m.text, m.tone); }, { signal });
    $(".tk-clear").addEventListener("click", () => { if (q.messages.length) clear(); }, { signal });

    /* --- Untouched, the site reports in: four notifications a moment apart, then it starts over. --- */
    let auto = true;
    ctx.onHand(() => { auto = false; });
    if (ctx.reduced()) {
      ctx.after(300, () => ARRIVALS.forEach((m) => push(m.text, m.tone)));
    } else {
      let i = 0;
      const step = () => {
        if (!auto) return;
        if (i < ARRIVALS.length) { push(ARRIVALS[i].text, ARRIVALS[i].tone); i++; ctx.after(GAP, step); }
        else if (!q.waiting) ctx.after(400, step);
        else ctx.after(2600, () => { if (!auto) return; clear(); i = 0; ctx.after(900, step); });
      };
      ctx.after(300, step);
    }

    update();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
      if (signal.aborted || !message) return;
      const keep = typed;
      measure();
      typed = keep;
      paint();
    });

    return {
      destroy() {
        clearTimeout(timer);
        back.stop();
        pop.stop();
        seen.disconnect();
        resize.disconnect();
      },
    };
  }

  FlatPlayer.register({
    slug: "ticker",
    title: "Ticker",
    tagline: "Notifications on one line that types itself.",
    css,
    mount,
  });
})();
