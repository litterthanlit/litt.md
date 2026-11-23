/* Command Menu, in Rack: the command palette of an agent console and design tool, docked as a panel: a title strip
   with the count, a value box you type in, and dense results under quiet group names (Commands, Agents,
   Components, Runs). What the person made wears its colour as a strip down the row's left edge, the same everywhere:
   the Planner is purple, the Researcher blue, the Coder orange, the Reviewer green; components are cyan, pink and
   blue by kind. A run that failed says so in red. The chosen row is a box in its outline, set on the frame (nothing
   glides). Enter runs it and the strip says what happened.
   The matching is the original's: each word of the query has to appear in order in a label, and a dynamic program
   scores the best way it fits; 2,422 items rank in well under a millisecond, and only the rows in view are drawn. */
FlatPlayer.register({
  slug: "command-menu",
  title: "Command Menu",
  tagline: "One box for every command, agent, component and run.",
  css: `
.fs-command-menu .cm { --rows: 9; --row: 24px; width: min(100%, 460px); background: var(--panel); border-radius: var(--r-panel); overflow: hidden; font-size: 12px;
  -webkit-user-select: none; user-select: none }
.fs-command-menu.is-tile .cm { --rows: 5; width: 100% }
.fs-command-menu .cm-strip { display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 10px; background: var(--panel-2) }
.fs-command-menu .cm-strip b { font-weight: 600 }
.fs-command-menu .cm-count { margin-left: auto; font: 500 11px/1 var(--mono); color: var(--muted); white-space: nowrap }
.fs-command-menu .cm-top { padding: 8px 8px 6px }
.fs-command-menu .cm-field { display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 6px 0 7px; background: var(--cut); box-shadow: var(--edge);
  border-radius: var(--r-control); cursor: text; color: var(--muted) }
.fs-command-menu .cm-field:focus-within { box-shadow: var(--edge-press) }
.fs-command-menu .cm-field:has(input:focus-visible) { outline: 2px solid var(--ink); outline-offset: 1px }
.fs-command-menu .cm-field > svg { width: 12px; height: 12px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square }
.fs-command-menu .cm-in { position: relative; flex: 1; min-width: 0; display: flex; align-items: center }
.fs-command-menu input { width: 100%; min-width: 0; border: 0; padding: 0; background: transparent; color: var(--ink); font: 500 12px/1.4 var(--mono); outline: none !important }
.fs-command-menu input::placeholder { color: var(--muted); font-family: var(--font); font-weight: 400 }
.fs-command-menu .cm-ghost { position: absolute; inset: 0 auto 0 0; display: none; align-items: center; pointer-events: none; font: 500 12px/1.4 var(--mono) }
.fs-command-menu .cm.is-ghost input:not(:focus) + .cm-ghost { display: flex }
.fs-command-menu .cm-ghost span { visibility: hidden; white-space: pre }
.fs-command-menu .cm-ghost i { width: 1px; height: 14px; background: var(--ink) }
.fs-command-menu .cm-k { flex: none; height: 18px; padding: 0 5px; border-radius: var(--r-control); box-shadow: var(--edge); background: var(--block);
  font: 500 10px/18px var(--mono); color: var(--muted) }
.fs-command-menu .cm-field:focus-within .cm-k { display: none }
.fs-command-menu .cm-list { position: relative; height: calc(var(--rows) * var(--row)); overflow-y: auto; overscroll-behavior: contain; outline: none;
  scrollbar-width: thin; scrollbar-color: var(--control) transparent; margin: 0 8px }
.fs-command-menu .cm-body { position: relative }
.fs-command-menu .cm-row, .fs-command-menu .cm-head { position: absolute; left: 0; right: 0; height: var(--row); display: flex; align-items: center; gap: 8px; padding: 0 8px 0 10px }
.fs-command-menu .cm-row { cursor: default; border-radius: var(--r-control) }
.fs-command-menu .cm-row::before { content: ""; position: absolute; left: 0; top: 3px; bottom: 3px; width: 3px; background: var(--tone, transparent) }
.fs-command-menu .cm-row[aria-selected="true"] { background: var(--cut); box-shadow: var(--edge) }
.fs-command-menu .cm-row.is-run { background: var(--accent); color: var(--accent-fg) }
.fs-command-menu .cm-head { align-items: flex-end; padding-bottom: 4px; color: var(--muted); font-size: 11px; font-weight: 600 }
.fs-command-menu .cm-head b { margin-left: auto; font: 500 10px/11px var(--mono) }
.fs-command-menu .cm-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted) }
.fs-command-menu .cm-label em { font-style: normal; color: var(--ink); font-weight: 600 }
.fs-command-menu .cm-label.is-plain { color: var(--ink) }
.fs-command-menu .cm-row.is-run .cm-label, .fs-command-menu .cm-row.is-run .cm-label em, .fs-command-menu .cm-row.is-run .cm-meta { color: var(--accent-fg) }
.fs-command-menu .cm-kind { flex: none; color: var(--muted); font-size: 11px }
.fs-command-menu .cm-meta { flex: none; font: 500 11px/1 var(--mono); color: var(--muted); text-align: right; min-width: 52px }
.fs-command-menu .cm-none { position: absolute; inset: 0; display: grid; place-items: center; color: var(--muted) }
.fs-command-menu .cm-foot { display: flex; align-items: center; gap: 8px; height: 26px; margin-top: 4px; padding: 0 10px; background: var(--panel-2); font-size: 11px;
  color: var(--muted); white-space: nowrap; overflow: hidden }
.fs-command-menu .cm-said { min-width: 0; overflow: hidden; text-overflow: ellipsis }
.fs-command-menu .cm-said b { color: var(--ink); font-weight: 600 }
.fs-command-menu .cm-said[data-fresh] { animation: fs-cm-in var(--cut-in) var(--ease-out) both }
@keyframes fs-cm-in { from { opacity: 0 } }
.fs-command-menu .cm-hint { margin-left: auto; font-family: var(--mono) }
.fs-command-menu.is-tile .cm-hint { display: none }
`,
  mount(host, ctx) {
    /* --- Data: an agent console's commands, agents, components and 2,400 runs ---------------------------- */
    const AGENTS = [["Planner", "purple"], ["Researcher", "blue"], ["Coder", "orange"], ["Reviewer", "green"]];
    const COMMANDS = [["Run agent", "⌘ ↵", "Started", "a run"], ["Approve all", "⇧ ⌘ A", "Approved", "3 tool calls"], ["Deploy preview", "⌘ D", "Deploying", "preview 0:00.0"],
      ["Export frame", "⇧ ⌘ E", "Exported", "Card.svg"], ["Create component", "⌘ K", "Created", "Untitled"], ["Open trace", "T", "Opened", "the last trace"],
      ["Compare branches", "", "Comparing", "main and ui-tokens"], ["Rerun failed steps", "⇧ R", "Queued", "2 steps"], ["Pause queue", "P", "Paused", "the queue"],
      ["Set budget", "", "Budget", "$4.00 a run"]];
    const COMPONENTS = [["Button", "cyan", "6 variants"], ["Card", "pink", "4 variants"], ["Header", "blue", "3 variants"], ["Toast", "cyan", "4 variants"],
      ["Select", "cyan", "5 variants"], ["Avatar", "pink", "3 variants"], ["Tabs", "blue", "2 variants"], ["Dialog", "pink", "3 variants"]];
    const TASKS = ["Fix login redirect", "Draft release notes", "Audit tokens", "Write tests for cart", "Rename props", "Summarize issues", "Resize hero frame", "Check contrast"];
    function hash(n, salt) {
      let x = Math.imul(n ^ Math.imul(salt, 0x9e3779b1), 0x85ebca6b) >>> 0;
      x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
      return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
    }
    const RUNS = 2400;
    const ITEMS = [
      ...COMMANDS.map(([label, keys, a, b]) => ({ id: "c-" + label, label, group: "Commands", meta: keys, done: [a, b] })),
      ...AGENTS.map(([label, c]) => ({ id: "a-" + label, label, group: "Agents", tone: c, meta: "Agent", done: ["Opened", label] })),
      ...COMPONENTS.map(([label, c, v]) => ({ id: "k-" + label, label, group: "Components", tone: c, meta: v, done: ["Inserted", label] })),
      ...Array.from({ length: RUNS }, (_, i) => {
        const n = RUNS - i, [agent, c] = AGENTS[n % 4], task = TASKS[Math.floor(n / 4) % 8];
        const failed = hash(n, 7) < 0.06, secs = 4 + hash(n, 1) * 170;
        const label = `${agent}: ${task.toLowerCase()} #${n}`;
        return { id: "r-" + n, label, group: "Runs", tone: c, bad: failed, meta: failed ? "Failed" : `${Math.floor(secs / 60)}:${(secs % 60).toFixed(1).padStart(4, "0")}`,
          done: ["Opened run", "#" + n] };
      }),
    ];

    /* --- Fuzzy matching (the original's dynamic program, unchanged) --------------------------------------- */
    const BONUS = { start: 12, word: 9, run: 7 }, GAP = 1;
    const codesOf = (t) => Uint16Array.from(t, (c) => c.charCodeAt(0));
    const isSep = (c) => c === " " || c === "_" || c === "-" || c === "." || c === "/" || c === ":" || c === ",";
    const isDigit = (c) => c >= "0" && c <= "9";
    const isLetter = (c) => c.toLowerCase() !== c.toUpperCase();
    function prepare(label) {
      const bonus = new Uint8Array(label.length);
      for (let j = 0; j < label.length; j++) {
        const c = label[j], p = label[j - 1];
        if (j === 0) bonus[j] = BONUS.start;
        else if (isSep(c)) continue;
        else if (isSep(p) || (p === p.toLowerCase() && c !== c.toLowerCase()) || (isDigit(p) !== isDigit(c) && isLetter(p) !== isLetter(c))) bonus[j] = BONUS.word;
      }
      return { codes: codesOf(label.toLowerCase()), bonus };
    }
    let where = new Int32Array(1024), worth = new Float64Array(1024), via = new Int32Array(1024);
    function align(word, { codes, bonus }, out) {
      const m = word.length, n = codes.length;
      let k = 0;
      for (let j = 0; j < n && k < m; j++) if (codes[j] === word[k]) k++;
      if (k < m) return -Infinity;
      if (where.length < m * n) { where = new Int32Array(m * n * 2); worth = new Float64Array(m * n * 2); via = new Int32Array(m * n * 2); }
      let prev = 0, end = 0;
      for (let i = 0; i < m; i++) {
        const c = word[i], row = i * n;
        let count = row, p = prev, gap = -Infinity, gapVia = -1;
        for (let j = i; j <= n - m + i; j++) {
          if (codes[j] !== c) continue;
          let best = -Infinity, from = -1;
          if (i === 0) best = 0;
          else {
            for (; p < end && where[p] <= j - 2; p++) { const reach = worth[p] + GAP * where[p]; if (reach > gap) { gap = reach; gapVia = p; } }
            if (gap > -Infinity) { best = gap - GAP * (j - 1); from = gapVia; }
            if (p < end && where[p] === j - 1 && worth[p] + BONUS.run >= best) { best = worth[p] + BONUS.run; from = p; }
            if (from < 0) continue;
          }
          where[count] = j; worth[count] = best + bonus[j]; via[count] = from; count++;
        }
        if (count === row) return -Infinity;
        prev = row; end = count;
      }
      let last = prev;
      for (let e = prev + 1; e < end; e++) if (worth[e] > worth[last]) last = e;
      if (out) { const first = out.length; out.length += m; for (let i = m - 1, e = last; i >= 0; e = via[e], i--) out[first + i] = where[e]; }
      return worth[last];
    }
    const names = [], groupOf = new Int32Array(ITEMS.length);
    ITEMS.forEach((it, i) => { let g = names.indexOf(it.group); if (g < 0) g = names.push(it.group) - 1; groupOf[i] = g; });
    const prepared = ITEMS.map((it) => prepare(it.label));
    const SLOT = 2 ** 21, OFFSET = 2 ** 20;
    function search(query) {
      const words = query.toLowerCase().split(/\s+/).filter(Boolean).map(codesOf);
      const n = prepared.length;
      let ranked = new Int32Array(n), count = 0;
      if (!words.length) for (; count < n; count++) ranked[count] = count;
      else {
        const keys = new Float64Array(n);
        for (let i = 0; i < n; i++) {
          let score = 0;
          for (let w = 0; w < words.length && score > -Infinity; w++) score += align(words[w], prepared[i]);
          if (score > -Infinity) keys[count++] = (OFFSET - score) * SLOT + i;
        }
        const sorted = keys.subarray(0, count).sort();
        for (let k = 0; k < count; k++) ranked[k] = sorted[k] % SLOT;
      }
      ranked = ranked.subarray(0, count);
      const seen = new Int32Array(names.length).fill(-1), groups = [];
      for (const i of ranked) { const g = groupOf[i]; if (seen[g] < 0) { seen[g] = groups.length; groups.push({ name: names[g], first: 0, size: 0 }); } groups[seen[g]].size++; }
      for (let g = 1; g < groups.length; g++) groups[g].first = groups[g - 1].first + groups[g - 1].size;
      const order = new Int32Array(count), next = groups.map((g) => g.first);
      for (const i of ranked) order[next[seen[groupOf[i]]]++] = i;
      return { words, order, groups };
    }
    function locate(words, p) {
      const out = [];
      for (const w of words) align(w, p, out);
      if (words.length < 2) return out;
      let w = 0;
      for (let r = 0; r < out.length; r++) {
        const v = out[r]; let a = w;
        while (a > 0 && out[a - 1] > v) a--;
        if (a > 0 && out[a - 1] === v) continue;
        for (let b = w; b > a; b--) out[b] = out[b - 1];
        out[a] = v; w++;
      }
      out.length = w;
      return out;
    }
    const rowOf = ({ groups }, i) => { let g = 0; while (g < groups.length - 1 && i >= groups[g + 1].first) g++; return i + g + 1; };
    function atRow({ groups }, r) {
      for (let g = 0; g < groups.length; g++) {
        const heading = groups[g].first + g;
        if (r === heading) return { group: g, option: -1 };
        if (r <= heading + groups[g].size) return { group: g, option: r - g - 1 };
      }
      return { group: -1, option: -1 };
    }
    const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    /* --- DOM ------------------------------------------------------------------------------------------------ */
    const uid = "cm" + Math.random().toString(36).slice(2, 7);
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    host.innerHTML = `<div class="cm">
      <div class="cm-strip"><b>Command</b><span class="cm-count"></span></div>
      <div class="cm-top"><label class="cm-field"><svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="5" cy="5" r="3.5"/><path d="m8 8 3 3"/></svg>
        <span class="cm-in"><input type="text" role="combobox" aria-label="Search commands" aria-controls="${uid}-list" aria-autocomplete="list" aria-expanded="true"
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="Run a command or find anything">
          <span class="cm-ghost" aria-hidden="true"><span></span><i></i></span></span>
        <span class="cm-k" aria-hidden="true">${mac ? "⌘ K" : "Ctrl K"}</span></label></div>
      <div class="cm-list" id="${uid}-list" role="listbox" aria-label="Results" tabindex="-1"><div class="cm-body"></div></div>
      <div class="cm-foot" aria-hidden="true"><span class="cm-said"></span><span class="cm-hint">↑ ↓ ↵</span></div>
      <p class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;
    const root = host.querySelector(".cm"), input = host.querySelector("input"), list = host.querySelector(".cm-list"), body = host.querySelector(".cm-body");
    const countEl = host.querySelector(".cm-count"), said = host.querySelector(".cm-said"), say = host.querySelector('[role="status"]');
    const ghostText = host.querySelector(".cm-ghost span");

    const OVERSCAN = 3, CHUNK = 4, SETTLE = 450, ROW = 24;
    let query = "", results = search(""), active = 0, follow = false, announceTimer = 0, runTimer = 0;
    let view = { start: 0, rows: 9, span: 9 + 2 * OVERSCAN + CHUNK };

    const total = () => results.order.length;
    const current = () => Math.min(active, total() - 1);
    const countText = () => !results.words.length ? `${thousands(ITEMS.length)} items` : total() ? `${thousands(total())} of ${thousands(ITEMS.length)}` : "0 found";

    function rowHTML(item, matches, row, option) {
      let label;
      if (!matches.length) label = `<span class="cm-label is-plain">${esc(item.label)}</span>`;
      else {
        let s = "", k = 0;
        for (let i = 0; i < item.label.length; ) {
          const on = matches[k] === i; let j = i;
          while (j < item.label.length && (matches[k] === j) === on) { if (on) k++; j++; }
          s += on ? `<em>${esc(item.label.slice(i, j))}</em>` : esc(item.label.slice(i, j));
          i = j;
        }
        label = `<span class="cm-label">${s}</span>`;
      }
      const tone = item.tone ? ` style="top:${row * ROW}px;--tone:var(--clip-${item.tone})"` : ` style="top:${row * ROW}px"`;
      return `<div class="cm-row" id="${uid}-${item.id.replace(/\W/g, "_")}" role="option" aria-selected="${option === current()}" data-opt="${option}"${tone}>${label}<span class="cm-meta"${item.bad ? ' style="color:var(--danger)"' : ""}>${esc(item.meta || "")}</span></div>`;
    }

    function draw() {
      const { order, groups, words } = results, t = total(), cur = current();
      const rowCount = t + groups.length, end = Math.min(rowCount, view.start + view.span);
      const activeRow = cur >= 0 ? rowOf(results, cur) : -1;
      const shown = [];
      const add = (row, at) => shown.push({ row, ...at, item: ITEMS[order[at.option]], matches: locate(words, prepared[order[at.option]]) });
      for (let r = view.start; r < end; r++) { const at = atRow(results, r); if (at.option >= 0) add(r, at); }
      if (activeRow >= 0 && (activeRow < view.start || activeRow >= end)) add(activeRow, atRow(results, activeRow));
      let html = "";
      groups.forEach((g, gi) => {
        const members = shown.filter((s) => s.group === gi);
        if (!members.length) return;
        html += `<div role="group" aria-labelledby="${uid}-g${gi}"><div class="cm-head" id="${uid}-g${gi}" style="top:${(g.first + gi) * ROW}px">${esc(g.name)}<b aria-hidden="true">${thousands(g.size)}</b></div>`;
        html += members.map((m) => rowHTML(m.item, m.matches, m.row, m.option)).join("") + "</div>";
      });
      if (!t) html += `<p class="cm-none">Nothing matches “${esc(query.trim())}”</p>`;
      body.style.height = rowCount * ROW + "px";
      body.innerHTML = html;
      input.setAttribute("aria-expanded", String(t > 0));
      if (cur >= 0) input.setAttribute("aria-activedescendant", `${uid}-${ITEMS[order[cur]].id.replace(/\W/g, "_")}`); else input.removeAttribute("aria-activedescendant");
      countEl.textContent = countText();
      return activeRow;
    }

    /* The chosen row is set on the frame; keys keep a row of context above and below it, and the list jumps there. */
    function update() {
      const activeRow = draw();
      if (activeRow < 0 || !follow) return;
      follow = false;
      const top = (activeRow - 1) * ROW, bottom = (activeRow + 2) * ROW;
      let next = list.scrollTop;
      if (top < next) next = Math.max(0, top);
      else if (bottom > next + list.clientHeight) next = bottom - list.clientHeight;
      if (next !== list.scrollTop) list.scrollTop = next;
    }

    function setQuery(q) {
      query = q;
      if (input.value !== q) input.value = q;
      ghostText.textContent = q;
      results = search(q); active = 0;
      list.scrollTop = 0; view.start = 0;
      update();
      clearTimeout(announceTimer);
      announceTimer = setTimeout(() => { if (query.trim()) say.textContent = total() ? `${thousands(total())} found` : `Nothing matches ${query.trim()}`; }, SETTLE);
    }
    function moveTo(next, by) {
      if (!total()) return;
      const to = clamp(next, 0, total() - 1);
      if (to === current()) return;
      follow = by === "key"; active = to; update();
    }
    function run(i) {
      if (i < 0 || i >= total()) return;
      const item = ITEMS[results.order[i]];
      const row = body.querySelector(`[data-opt="${i}"]`);
      if (row) row.classList.add("is-run");
      clearTimeout(runTimer);
      runTimer = setTimeout(() => { const r = body.querySelector(".is-run"); if (r) r.classList.remove("is-run"); }, 160);
      said.innerHTML = `<b>${esc(item.done[0])}</b> ${esc(item.done[1])}`;
      said.removeAttribute("data-fresh"); void said.offsetWidth; said.setAttribute("data-fresh", "");
      say.textContent = item.done.join(" ");
    }
    function press(key) {
      const page = Math.max(1, view.rows - 1), cur = current();
      if (key === "down") moveTo(cur + 1, "key");
      else if (key === "up") moveTo(cur - 1, "key");
      else if (key === "pageDown") moveTo(cur + page, "key");
      else if (key === "pageUp") moveTo(cur - page, "key");
      else if (key === "home") moveTo(0, "key");
      else if (key === "end") moveTo(total() - 1, "key");
      else if (key === "enter") run(cur);
    }

    /* --- Input -------------------------------------------------------------------------------------------- */
    const KEYS = { ArrowDown: "down", ArrowUp: "up", PageDown: "pageDown", PageUp: "pageUp", Home: "home", End: "end", Enter: "enter", Escape: "escape" };
    const opt = { signal: ctx.signal };
    input.addEventListener("focus", () => { takeOver(); if (ghostWords) { ghostWords = false; setQuery(""); } }, opt);
    input.addEventListener("input", () => setQuery(input.value), opt);
    input.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      const key = e.ctrlKey && (e.key === "n" || e.key === "p") ? (e.key === "n" ? "down" : "up") : e.metaKey || e.altKey || e.ctrlKey ? undefined : KEYS[e.key];
      if (!key) return;
      if (key === "escape") { if (query) { e.preventDefault(); e.stopPropagation(); setQuery(""); } else input.blur(); return; }
      e.preventDefault();
      if (key === "enter" && e.repeat) return;
      press(key);
    }, opt);
    if (!ctx.tile) window.addEventListener("keydown", (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== "k") return;
      e.preventDefault(); input.focus(); input.select();
    }, opt);
    list.addEventListener("mousedown", (e) => e.preventDefault(), opt);
    const pointer = { x: -1, y: -1 };
    list.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const row = e.target.closest("[data-opt]");
      if (!row) return;
      takeOver();
      if (e.clientX === pointer.x && e.clientY === pointer.y) return;
      pointer.x = e.clientX; pointer.y = e.clientY;
      const i = +row.dataset.opt;
      if (i !== current()) moveTo(i, "pointer");
    }, opt);
    list.addEventListener("click", (e) => {
      const row = e.target.closest("[data-opt]");
      if (!row) return;
      const i = +row.dataset.opt;
      if (i !== current()) moveTo(i, "pointer");
      run(i);
    }, opt);
    list.addEventListener("scroll", () => {
      const first = Math.floor(list.scrollTop / ROW);
      const start = Math.max(0, Math.floor((first - OVERSCAN) / CHUNK) * CHUNK);
      if (start !== view.start) { view.start = start; draw(); }
    }, opt);
    const ro = new ResizeObserver(() => {
      const fit = Math.max(1, Math.round(list.clientHeight / ROW));
      if (fit !== view.rows) { view.rows = fit; view.span = fit + 2 * OVERSCAN + CHUNK; draw(); }
    });
    ro.observe(list);
    setQuery("");
    said.textContent = "Type to search";

    /* --- The self-run: someone types, steps down, runs it; a beat later, again. A hand ends it for good. ------ */
    const ROUNDS = [
      { query: "fix", keys: ["down", "down", "enter"] },
      { query: "dep", keys: ["enter"] },
      { query: "card", keys: ["enter"] },
      { query: "rev audit", keys: ["down", "enter"] },
    ];
    let live = false, timer = 0, ghostWords = false;
    function takeOver() {
      if (!live) return;
      live = false; clearTimeout(timer); root.classList.remove("is-ghost"); ghostWords = !!query;
    }
    if (!ctx.reduced()) {
      live = true; root.classList.add("is-ghost");
      let round = 0, steps = [];
      const plan = () => {
        const { query: q, keys } = ROUNDS[round++ % ROUNDS.length];
        const out = [[round === 1 ? 300 : 200, () => setQuery("")]];
        for (let i = 1; i <= q.length; i++) out.push([i === 1 ? 400 : 110 + Math.random() * 80, () => setQuery(q.slice(0, i))]);
        keys.forEach((k, i) => out.push([i === 0 ? 600 : 360, () => press(k)]));
        out.push([1400, () => {}]);
        return out;
      };
      const next = () => {
        if (!steps.length) steps = plan();
        const [wait, act] = steps.shift();
        timer = ctx.after(wait, () => { if (!live) return; act(); next(); });
      };
      next();
    }
    ctx.onHand(takeOver);

    return { destroy() { live = false; clearTimeout(timer); clearTimeout(announceTimer); clearTimeout(runTimer); ro.disconnect(); } };
  },
});
