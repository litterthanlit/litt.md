/* Command Menu, redesigned in Flat. A white search pill on the grey ground ("Search or jump to…  ⌘K"). Focus it and
   it grows into a floating white palette (it floats, so it casts) on Flat's expressive spring; the chosen row is a
   grey bubble that glides on a snappy spring (520/40) and keeps its velocity when you keep pressing. Run something
   and the palette folds back into the pill, with what happened said in words under it.
   The matching is the original's: each word of the query has to appear in order in a label, and a dynamic program
   scores the best way it fits (label starts, word starts and runs score; every letter skipped costs one). 2,416
   posts, places and actions rank in well under a millisecond, and only the rows in view are drawn. */
FlatPlayer.register({
  slug: "command-menu",
  title: "Command Menu",
  tagline: "Search or jump to anything on your site.",
  css: `
.fs-command-menu .cm { --fs: 15px; --rows: 6; --row: 2.6em; --field: 3.2em; --foot: 2.6em; position: relative; width: min(100%, 520px);
  font-size: var(--fs); -webkit-user-select: none; user-select: none;
  height: calc(var(--field) + var(--rows) * var(--row) + var(--foot) + 0.8em + 2.2em) }
.fs-command-menu.is-tile .cm { --fs: 13px; --rows: 4; width: 100% }
@container (max-width: 420px) { .fs-command-menu:not(.is-tile) .cm { --fs: 14px } }
.fs-command-menu .cm-shade, .fs-command-menu .cm-card { position: absolute; left: 0; right: 0; top: 0; border-radius: 24px }
.fs-command-menu .cm-shade { box-shadow: var(--float); opacity: 0; pointer-events: none }
.fs-command-menu .cm-card { background: var(--paper); overflow: hidden; height: var(--field) }
.fs-command-menu .cm-field { display: flex; align-items: center; gap: 0.65em; height: var(--field); padding: 0 0.7em 0 1.1em; cursor: text; color: var(--muted) }
.fs-command-menu .cm-field > svg { width: 1.1em; height: 1.1em; flex: none; fill: none; stroke: currentColor; stroke-linecap: round; stroke-width: 1.6 }
.fs-command-menu .cm-in { position: relative; flex: 1; min-width: 0; display: flex; align-items: center }
.fs-command-menu input { width: 100%; min-width: 0; border: 0; padding: 0; background: transparent; color: var(--ink); font: 400 1.05em/1.4 var(--font);
  letter-spacing: -0.01em; outline: none !important }
.fs-command-menu input::placeholder { color: var(--muted) }
.fs-command-menu .cm.is-open input::placeholder { color: var(--disabled) }
.fs-command-menu .cm-ghost { position: absolute; inset: 0 auto 0 0; display: none; align-items: center; pointer-events: none; font-size: 1.05em; letter-spacing: -0.01em }
.fs-command-menu .cm.is-ghost.is-open input:not(:focus) + .cm-ghost { display: flex }
.fs-command-menu .cm-ghost span { visibility: hidden; white-space: pre }
.fs-command-menu .cm-ghost i { margin-left: 1px; width: 2px; height: 1.15em; border-radius: 1px; background: var(--ink); animation: fs-cm-caret 1s steps(1) infinite }
@keyframes fs-cm-caret { 50% { opacity: 0 } }
.fs-command-menu .cm-k { flex: none; height: 1.9em; padding: 0 0.7em; border-radius: var(--r-pill); background: var(--bubble); color: var(--muted);
  display: grid; place-items: center; font: 500 0.8em/1 var(--font); transition: opacity 150ms }
.fs-command-menu .cm.is-open .cm-k { opacity: 0 }
.fs-command-menu .cm-drop { opacity: 0; padding: 0 0.4em }
.fs-command-menu .cm-list { position: relative; height: calc(var(--rows) * var(--row)); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; outline: none }
.fs-command-menu .cm-list::-webkit-scrollbar { display: none }
.fs-command-menu .cm-body { position: relative }
.fs-command-menu .cm-hl { position: absolute; left: 0; right: 0; height: var(--row); top: calc(var(--bar, 0) * var(--row)); border-radius: var(--r-pill);
  background: var(--bubble); pointer-events: none }
.fs-command-menu .cm-hl.is-empty { display: none }
.fs-command-menu .cm-hl.is-flash { background: color-mix(in oklab, var(--bubble), var(--ink) 10%) }
.fs-command-menu .cm-row, .fs-command-menu .cm-head { position: absolute; left: 0; right: 0; height: var(--row); display: flex; align-items: center; gap: 0.7em;
  padding: 0 1em 0 0.85em }
.fs-command-menu .cm-row { cursor: default }
.fs-command-menu .cm-head { align-items: flex-end; padding-bottom: 0.4em; color: var(--muted) }
.fs-command-menu .cm-head span { font-size: 0.82em; font-weight: 500; line-height: 1 }
.fs-command-menu .cm-ico { width: 1.1em; height: 1.1em; flex: none; color: var(--muted) }
.fs-command-menu .cm-ico svg { width: 100%; height: 100%; display: block; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5 }
.fs-command-menu .cm-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.01em; color: var(--muted) }
.fs-command-menu .cm-label em { font-style: normal; color: var(--ink); font-weight: 600 }
.fs-command-menu .cm-label.is-plain { color: var(--ink) }
.fs-command-menu .cm-meta { flex: none; font-size: 0.85em; color: var(--muted); font-variant-numeric: tabular-nums }
.fs-command-menu .cm-none { position: absolute; inset: 0; display: grid; place-items: center; padding: 0 1.5em; color: var(--muted); text-align: center }
.fs-command-menu .cm-none span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.fs-command-menu .cm-foot { height: var(--foot); display: flex; align-items: center; justify-content: space-between; gap: 1em; padding: 0 0.85em 0.2em;
  color: var(--muted); font-size: 0.85em; white-space: nowrap }
.fs-command-menu .cm-foot span:first-child { overflow: hidden; text-overflow: ellipsis; min-width: 0 }
.fs-command-menu .cm-said { position: absolute; left: 0; right: 0; top: calc(var(--field) + 0.9em); margin: 0; text-align: center; font-size: 0.95em;
  color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 1em }
.fs-command-menu .cm-said b { color: var(--ink); font-weight: 500 }
`,
  mount(host, ctx) {
    /* --- Data: a small site's actions, places and 2,400 posts ---------------------------------------------- */
    const G = {
      post: '<path d="M4 2.5h5.5L12 5v8.5H4z"/><path d="M6.5 8h3.5M6.5 10.5h3.5"/>',
      letter: '<path d="M2.5 4h11v8h-11z"/><path d="m2.5 4.5 5.5 4 5.5-4"/>',
      publish: '<path d="M8 10.5V3M5 6l3-3 3 3M3 13h10"/>',
      schedule: '<circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.25l2 1.25"/>',
      person: '<circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.6-2.6 2.6-4 5-4s4.4 1.4 5 4"/>',
      import: '<path d="M8 2.5V10M5 7l3 3 3-3M3 13h10"/>',
      theme: '<circle cx="8" cy="8" r="5.5"/><path d="M8 2.5v11" /><path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none"/>',
      list: '<path d="M3 4h10M3 8h10M3 12h6"/>',
      stats: '<path d="M3 13.5v-4M6.5 13.5v-8M10 13.5V7M13.5 13.5V3"/>',
      settings: '<path d="M2.5 5H6M9 5h4.5M2.5 11H9M12 11h1.5"/><circle cx="7.5" cy="5" r="1.5"/><circle cx="10.5" cy="11" r="1.5"/>',
      globe: '<circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c1.6 1.6 2.3 3.4 2.3 5.5S9.6 11.9 8 13.5M8 2.5C6.4 4.1 5.7 5.9 5.7 8s.7 3.9 2.3 5.5"/>',
    };
    const ACTIONS = [
      ["new-post", "New post", "post", "Started a new post"], ["new-letter", "New letter to readers", "letter", "Started a new letter"],
      ["publish", "Publish draft", "publish", "Published your draft"], ["schedule", "Schedule issue", "schedule", "Scheduled for Sunday, 8:00"],
      ["invite", "Invite a writer", "person", "Invite link copied"], ["import", "Import readers", "import", "Ready to import"],
      ["theme", "Change theme", "theme", "Theme picker opened"],
    ];
    const PLACES = [["posts", "Posts", "list"], ["drafts", "Drafts", "post"], ["readers", "Readers", "person"], ["letters", "Letters", "letter"],
      ["stats", "Stats", "stats"], ["domains", "Domains", "globe"], ["settings", "Settings", "settings"]];
    const TOPICS = ["the garden", "slow mornings", "small sites", "the spring issue", "writing every day", "our first year", "bread", "walking to work",
      "the reading list", "quiet tools", "making zines", "the move", "old cameras", "rain", "this newsletter", "paper notebooks", "coffee", "summer plans",
      "the library", "learning to draw"];
    const FORMS = [(t) => "Notes on " + t, (t) => "A letter about " + t, (t) => "Why I keep coming back to " + t, (t) => "What I learned from " + t,
      (t) => "On " + t, (t) => "Ten things about " + t, (t) => "Field notes: " + t, (t) => "More on " + t];
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], POSTS = 2400, FIRST_DAY = Date.UTC(2020, 0, 6);
    function hash(n, salt) {
      let x = Math.imul(n ^ Math.imul(salt, 0x9e3779b1), 0x85ebca6b) >>> 0;
      x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
      return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
    }
    const posts = Array.from({ length: POSTS }, (_, i) => {
      const n = POSTS - i, k = Math.floor((n - 1) / 160), topic = TOPICS[(n - 1) % 20], form = FORMS[Math.floor((n - 1) / 20) % 8];
      const label = form(topic) + (k ? `, part ${k + 1}` : "");
      const day = new Date(FIRST_DAY + Math.floor((n - 1) * 0.9 + hash(n, 2) * 0.8) * 86400000);
      const draft = n > POSTS - 30 && hash(n, 5) < 0.4;
      const y = day.getUTCFullYear();
      return { id: "p" + n, label, group: "Posts", meta: draft ? "Draft" : `${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]}${y === 2026 ? "" : " " + y}`, done: ["Opened", "“" + label + "”"] };
    });
    const ITEMS = [
      ...ACTIONS.map(([id, label, g, done]) => ({ id, label, group: "Actions", glyph: G[g], done: [done] })),
      ...PLACES.map(([id, label, g]) => ({ id, label, group: "Go to", glyph: G[g], done: ["Opened", label] })),
      ...posts,
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
      <div class="cm-shade" aria-hidden="true"></div>
      <div class="cm-card">
        <label class="cm-field"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.25"/><path d="m10.2 10.2 3.3 3.3"/></svg>
          <span class="cm-in"><input type="text" role="combobox" aria-label="Search or jump to" aria-controls="${uid}-list" aria-autocomplete="list" aria-expanded="false"
            autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="Search or jump to…">
            <span class="cm-ghost" aria-hidden="true"><span></span><i></i></span></span>
          <span class="cm-k" aria-hidden="true">${mac ? "⌘K" : "Ctrl K"}</span>
        </label>
        <div class="cm-drop">
          <div class="cm-list" id="${uid}-list" role="listbox" aria-label="Results" tabindex="-1">
            <div class="cm-body"><div class="cm-hl" aria-hidden="true"></div><div class="cm-rows"></div></div>
          </div>
          <div class="cm-foot" aria-hidden="true"><span class="cm-count"></span><span>↑ ↓ to move, ↵ to open</span></div>
        </div>
      </div>
      <p class="cm-said" aria-hidden="true"></p>
      <p class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;
    const root = host.querySelector(".cm"), card = host.querySelector(".cm-card"), shade = host.querySelector(".cm-shade"), drop = host.querySelector(".cm-drop");
    const input = host.querySelector("input"), list = host.querySelector(".cm-list"), body = host.querySelector(".cm-body"), rowsEl = host.querySelector(".cm-rows");
    const hl = host.querySelector(".cm-hl"), countEl = host.querySelector(".cm-count"), said = host.querySelector(".cm-said"), say = host.querySelector('[role="status"]');
    const ghostText = host.querySelector(".cm-ghost span");

    const OVERSCAN = 3, CHUNK = 4, SETTLE = 450;
    let query = "", results = search(""), active = 0, isOpen = false;
    let view = { start: 0, rows: 6, span: 6 + 2 * OVERSCAN + CHUNK };
    let barAt = 0, rowPx = 0, follow = false, placed = false, announceTimer = 0;

    /* The palette's openness, 0 (the pill) to 1 (the palette): opening lands on the expressive spring, closing never bounces. */
    let full = 0, fieldPx = 0;
    const measure = () => { fieldPx = input.closest(".cm-field").offsetHeight; full = fieldPx + drop.offsetHeight + 6; };
    const paintOpen = (o) => {
      const h = fieldPx + Math.max(0, o) * (full - fieldPx);
      card.style.height = h + "px"; shade.style.height = h + "px";
      const r = 24 - clamp(o, 0, 1) * 4 + "px";
      card.style.borderRadius = r; shade.style.borderRadius = r;
      shade.style.opacity = clamp(o, 0, 1).toFixed(3);
      drop.style.opacity = clamp((o - 0.25) / 0.6, 0, 1).toFixed(3);
    };
    const openS = ctx.spring(0, paintOpen, { duration: 0.35, bounce: 0.28 });
    const shutS = ctx.spring(0, paintOpen, { duration: 0.25, bounce: 0 });
    function setOpen(on) {
      if (on === isOpen) return;
      isOpen = on;
      root.classList.toggle("is-open", on);
      input.setAttribute("aria-expanded", String(on && total() > 0));
      if (!on) input.removeAttribute("aria-activedescendant");
      measure();
      const from = on ? shutS.value() : openS.value();
      (on ? shutS : openS).stop();
      const s = on ? openS : shutS;
      s.jump(from); s.set(on ? 1 : 0);
      if (on) { placed = false; update(); }
    }

    const bar = ctx.spring(0, (v) => { barAt = v; hl.style.setProperty("--bar", v.toFixed(4)); },
      { duration: (2 * Math.PI) / Math.sqrt(520), bounce: 1 - 40 / (2 * Math.sqrt(520)) }); // stiffness 520, damping 40

    const total = () => results.order.length;
    const current = () => Math.min(active, total() - 1);
    const countText = () => !results.words.length ? `${thousands(ITEMS.length)} posts, places and actions` : total() ? `${thousands(total())} ${total() === 1 ? "result" : "results"}` : "No results";

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
      const icon = `<span class="cm-ico" aria-hidden="true"><svg viewBox="0 0 16 16">${item.glyph || G.post}</svg></span>`;
      const meta = item.meta ? `<span class="cm-meta">${esc(item.meta)}</span>` : "";
      return `<div class="cm-row" id="${uid}-${item.id}" role="option" aria-selected="${option === current()}" data-opt="${option}" style="top:calc(${row} * var(--row))">${icon}${label}${meta}</div>`;
    }

    /* The rows in view, plus the chosen one wherever it is, so aria-activedescendant always resolves. */
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
        html += `<div role="group" aria-labelledby="${uid}-g${gi}"><div class="cm-head" id="${uid}-g${gi}" style="top:calc(${g.first + gi} * var(--row))"><span>${esc(g.name)}</span></div>`;
        html += members.map((m) => rowHTML(m.item, m.matches, m.row, m.option)).join("") + "</div>";
      });
      if (!t) html += `<p class="cm-none"><span>Nothing called “${esc(query.trim())}” yet</span></p>`;
      body.style.height = `calc(${rowCount} * var(--row))`;
      rowsEl.innerHTML = html;
      hl.classList.toggle("is-empty", !t);
      input.setAttribute("aria-expanded", String(isOpen && t > 0));
      if (isOpen && cur >= 0) input.setAttribute("aria-activedescendant", `${uid}-${ITEMS[order[cur]].id}`); else input.removeAttribute("aria-activedescendant");
      countEl.textContent = countText();
      return activeRow;
    }

    /* The bubble glides to the chosen row. A long jump cuts to just short of it and glides the rest. */
    function update() {
      const activeRow = draw();
      if (activeRow < 0) return;
      const calm = ctx.reduced();
      if (!placed || calm) bar.jump(activeRow);
      else {
        if (Math.abs(activeRow - bar.value()) > view.rows * 1.5) bar.jump(activeRow + (activeRow > bar.value() ? -1.5 : 1.5));
        bar.set(activeRow);
      }
      placed = true;
      if (!follow || !rowPx) return;
      follow = false;
      const top = (activeRow - 1) * rowPx, bottom = (activeRow + 2) * rowPx;
      let next = list.scrollTop;
      if (top < next) next = Math.max(0, top);
      else if (bottom > next + list.clientHeight) next = bottom - list.clientHeight;
      if (next === list.scrollTop) return;
      const near = Math.abs(next - list.scrollTop) < list.clientHeight * 1.5;
      list.scrollTo({ top: next, behavior: near && !calm ? "smooth" : "auto" });
    }

    function setQuery(q) {
      query = q;
      if (input.value !== q) input.value = q;
      ghostText.textContent = q;
      results = search(q); active = 0;
      list.scrollTop = 0; view.start = 0;
      update();
      clearTimeout(announceTimer);
      announceTimer = setTimeout(() => { if (isOpen && query.trim()) say.textContent = total() ? countText() : `No results for ${query.trim()}`; }, SETTLE);
    }

    function moveTo(next, by) {
      if (!total()) return;
      const to = clamp(next, 0, total() - 1);
      if (to === current()) return;
      follow = by === "key";
      active = to;
      update();
    }
    function run(i) {
      if (i < 0 || i >= total()) return;
      hl.classList.add("is-flash");
      const item = ITEMS[results.order[i]];
      ctx.after(140, () => {
        hl.classList.remove("is-flash");
        setOpen(false);
        setQuery("");
        said.innerHTML = item.done.length > 1 ? `${esc(item.done[0])} <b>${esc(item.done[1])}</b>` : `<b>${esc(item.done[0])}</b>`;
        say.textContent = item.done.join(" ");
        if (!ctx.reduced() && said.animate) said.animate([{ opacity: 0, transform: "translateY(-10px) scale(0.96)" }, { opacity: 1, transform: "none" }],
          { duration: 579, easing: "linear(0, 0.0897, 0.2671, 0.4643, 0.6434, 0.7874, 0.8925, 0.9624, 1.004, 1.0249, 1.0322, 1.0295, 1.0237, 1.0173, 1.0115, 1.0068, 1.0034, 1.0012, 0.9998, 0.9992, 1)" });
      });
    }
    function press(key) {
      if (!isOpen && key !== "escape") { setOpen(true); if (key !== "down" && key !== "up") return; }
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
    input.addEventListener("focus", () => {
      // A hand starts from an empty field, not halfway through the ghost's words.
      takeOver();
      if (ghostWords) { ghostWords = false; setQuery(""); }
      said.textContent = ""; setOpen(true);
    }, opt);
    input.addEventListener("blur", () => setOpen(false), opt);
    input.addEventListener("input", () => { setOpen(true); setQuery(input.value); }, opt);
    input.addEventListener("keydown", (e) => {
      if (e.isComposing) return;
      const key = e.ctrlKey && (e.key === "n" || e.key === "p") ? (e.key === "n" ? "down" : "up") : e.metaKey || e.altKey || e.ctrlKey ? undefined : KEYS[e.key];
      if (!key) return;
      if (key === "escape") {
        // Escape clears the query, then folds the palette; on a folded pill it is left for the page.
        if (query) { e.preventDefault(); e.stopPropagation(); setQuery(""); }
        else if (isOpen) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
        return;
      }
      e.preventDefault();
      if (key === "enter" && e.repeat) return;
      press(key);
    }, opt);
    if (!ctx.tile) window.addEventListener("keydown", (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== "k") return;
      e.preventDefault(); input.focus(); input.select(); said.textContent = ""; setOpen(true);
    }, opt);
    /* A press anywhere else on the screen folds it away. */
    host.addEventListener("pointerdown", (e) => { if (!card.contains(e.target) && isOpen) { input.blur(); setOpen(false); } }, opt);
    list.addEventListener("mousedown", (e) => e.preventDefault(), opt);
    drop.addEventListener("mousedown", (e) => e.preventDefault(), opt);
    const pointer = { x: -1, y: -1 };
    list.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const row = e.target.closest("[data-opt]");
      if (!row) return;
      takeOver();
      if (e.clientX === pointer.x && e.clientY === pointer.y) return; // rows scrolling under a resting pointer don't steal it
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
      if (!rowPx) return;
      const first = Math.floor(list.scrollTop / rowPx);
      const start = Math.max(0, Math.floor((first - OVERSCAN) / CHUNK) * CHUNK);
      if (start !== view.start) { view.start = start; draw(); }
    }, opt);

    const ro = new ResizeObserver(() => {
      rowPx = parseFloat(getComputedStyle(list).fontSize) * 2.6;
      const fit = Math.max(1, Math.round(list.clientHeight / rowPx));
      if (fit !== view.rows) { view.rows = fit; view.span = fit + 2 * OVERSCAN + CHUNK; draw(); }
      measure(); paintOpen(isOpen ? 1 : 0);
    });
    ro.observe(root);

    setQuery("");
    measure(); paintOpen(0);

    /* --- The self-run: someone opens it, types, moves, opens a thing; the palette folds back; again. -------- */
    const ROUNDS = [
      { query: "new let", keys: ["down", "up", "enter"] },
      { query: "dra", keys: ["enter"] },
      { query: "garden", keys: ["down", "down", "enter"] },
      { query: "", keys: ["down", "down", "down", "enter"] },
    ];
    const LETTER = 150, KEY = 520, BEAT = 1300;
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
        const out = [[round === 1 ? 500 : 300, () => { said.textContent = ""; setQuery(""); setOpen(true); }]];
        for (let i = 1; i <= q.length; i++) out.push([i === 1 ? 520 : LETTER * (0.7 + Math.random() * 0.6), () => setQuery(q.slice(0, i))]);
        keys.forEach((k, i) => out.push([i === 0 ? 900 : k === "enter" ? 700 : KEY, () => press(k)]));
        out.push([BEAT, () => {}]);
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

    return { destroy() { live = false; clearTimeout(timer); clearTimeout(announceTimer); bar.stop(); openS.stop(); shutS.stop(); ro.disconnect(); } };
  },
});
