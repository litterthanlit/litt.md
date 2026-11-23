/* Spotlight Card, in Rack: the light that follows the pointer becomes a redline inspector. Over a frame of layers
   (Header purple, Avatar green, Sidebar blue, Card pink, Button cyan), the pointer's position rides with it as a
   value box, and the layer under it is outlined in its own colour with redlines to its neighbours or its parent,
   each distance in a box. The pointer's position goes straight to CSS variables; the redlines cut in when the layer
   under the hand changes, and nothing trails. Arrow keys step through the layers. */
FlatPlayer.register({
  slug: "spotlight-card",
  title: "Spotlight Card",
  tagline: "Point at a layer, read its spacing: a redline inspector.",
  css: `
.fs-spotlight-card .rl { width: min(100%, 720px); display: grid; grid-template-columns: 1fr 156px; gap: 3px; font-size: 12px }
.fs-spotlight-card .rl-dev { background: var(--panel); border-radius: var(--r-panel); overflow: hidden; min-width: 0 }
.fs-spotlight-card .rl-strip { display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; background: var(--panel-2); white-space: nowrap }
.fs-spotlight-card .rl-strip b { font-weight: 600 }
.fs-spotlight-card .rl-strip span { margin-left: auto; font: 600 11px/1 var(--mono); color: var(--muted) }
.fs-spotlight-card .rl-wrap { padding: 8px; background: var(--slot) }
.fs-spotlight-card .rl-canvas { --px: 0.5; --py: 0.5; --on: 0; position: relative; aspect-ratio: 480 / 280; background: var(--cut); border-radius: var(--r-control); box-shadow: var(--edge);
  cursor: crosshair; touch-action: none; outline-offset: 2px }
.fs-spotlight-card .rl-l { position: absolute; border-radius: var(--r-control); font: 600 9px/1 var(--font); padding: 3px 4px; overflow: hidden; white-space: nowrap;
  transition: box-shadow var(--cut-in) var(--ease-out) }
.fs-spotlight-card .rl-l[data-tone="purple"] { background: var(--clip-purple-tint); color: var(--clip-purple-text); --c: var(--clip-purple) }
.fs-spotlight-card .rl-l[data-tone="green"] { background: var(--clip-green-tint); color: var(--clip-green-text); --c: var(--clip-green) }
.fs-spotlight-card .rl-l[data-tone="blue"] { background: var(--clip-blue-tint); color: var(--clip-blue-text); --c: var(--clip-blue) }
.fs-spotlight-card .rl-l[data-tone="pink"] { background: var(--clip-pink-tint); color: var(--clip-pink-text); --c: var(--clip-pink) }
.fs-spotlight-card .rl-l[data-tone="cyan"] { background: var(--clip-cyan-tint); color: var(--clip-cyan-text); --c: var(--clip-cyan) }
.fs-spotlight-card .rl-l[aria-selected="true"] { box-shadow: 0 0 0 2px var(--c); z-index: 1 }
.fs-spotlight-card .rl-lines { position: absolute; inset: 0; pointer-events: none; z-index: 2 }
.fs-spotlight-card .rl-red { position: absolute; background: var(--danger); animation: fs-rl-in var(--cut-in) var(--ease-out) both }
.fs-spotlight-card .rl-red.is-h { height: 1px } .fs-spotlight-card .rl-red.is-v { width: 1px }
.fs-spotlight-card .rl-red b { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 1px 3px; background: var(--danger); color: var(--cut);
  border-radius: var(--r-control); font: 600 9px/11px var(--mono); white-space: nowrap }
@keyframes fs-rl-in { from { opacity: 0 } }
.fs-spotlight-card .rl-cur { position: absolute; left: calc(var(--px) * 100%); top: calc(var(--py) * 100%); z-index: 3; pointer-events: none; opacity: var(--on);
  transform: translate(8px, 8px); padding: 1px 4px; background: var(--block); box-shadow: var(--edge); border-radius: var(--r-control); font: 600 9px/12px var(--mono);
  white-space: nowrap; transition: opacity var(--cut-out) var(--ease-out) }
.fs-spotlight-card .rl-canvas.is-on .rl-cur { transition-duration: var(--cut-in) }
.fs-spotlight-card .rl-props { display: grid; grid-template-columns: auto 1fr; gap: 4px 6px; align-items: center; padding: 8px }
.fs-spotlight-card .rl-props span { color: var(--muted); font-size: 11px }
.fs-spotlight-card .rl-props b { height: 22px; padding: 0 6px; background: var(--cut); box-shadow: var(--edge); border-radius: var(--r-control); font: 600 11px/22px var(--mono); white-space: nowrap; overflow: hidden }
.fs-spotlight-card .rl-name { grid-column: 1 / -1; display: flex; align-items: center; height: 22px; padding: 0 6px; border-radius: var(--r-control); background: var(--cut);
  box-shadow: inset 3px 0 0 var(--c, var(--line-strong)), var(--edge); font-weight: 600 }
.fs-spotlight-card .rl-gap { grid-column: 1 / -1; margin: 4px 0 0; font-size: 11px; color: var(--muted) }
.fs-spotlight-card.is-tile .rl { grid-template-columns: 1fr }
.fs-spotlight-card.is-tile .rl-side { display: none }
@container (max-width: 480px) {
  .fs-spotlight-card:not(.is-tile) .rl { grid-template-columns: 1fr }
  .fs-spotlight-card .rl-props { grid-template-columns: auto 1fr auto 1fr }
}
`,
  mount(host, ctx) {
    const W = 480, H = 280;
    const L = [
      { id: "header", name: "Header", tone: "purple", x: 16, y: 16, w: 448, h: 40 },
      { id: "avatar", name: "Avatar", tone: "green", x: 424, y: 24, w: 24, h: 24, parent: "header" },
      { id: "sidebar", name: "Sidebar", tone: "blue", x: 16, y: 72, w: 120, h: 192 },
      { id: "card", name: "Card", tone: "pink", x: 152, y: 72, w: 208, h: 144 },
      { id: "button", name: "Button", tone: "cyan", x: 168, y: 172, w: 96, h: 28, parent: "card" },
    ];
    const FRAME = { name: "Frame", x: 0, y: 0, w: W, h: H };
    const uid = "rl" + Math.random().toString(36).slice(2, 7);
    const pct = (v, of) => (v / of) * 100 + "%";
    host.innerHTML = `<div class="rl">
      <div class="rl-dev">
        <div class="rl-strip"><b>Frame</b><span>${W} × ${H}</span></div>
        <div class="rl-wrap"><div class="rl-canvas" role="listbox" tabindex="0" aria-label="Layers. Arrows measure each one.">
          ${L.map((l) => `<div class="rl-l" role="option" id="${uid}-${l.id}" aria-label="${l.name}" aria-selected="false" data-id="${l.id}" data-tone="${l.tone}" style="left:${pct(l.x, W)};top:${pct(l.y, H)};width:${pct(l.w, W)};height:${pct(l.h, H)}">${l.w > 40 ? l.name : ""}</div>`).join("")}
          <div class="rl-lines" aria-hidden="true"></div><span class="rl-cur" aria-hidden="true"></span>
        </div></div>
      </div>
      <div class="rl-dev rl-side">
        <div class="rl-strip"><b>Inspector</b></div>
        <div class="rl-props"><span class="rl-name">No layer</span><span>X</span><b class="rl-x">–</b><span>Y</span><b class="rl-y">–</b><span>W</span><b class="rl-w">–</b><span>H</span><b class="rl-h">–</b><p class="rl-gap"></p></div>
      </div>
      <p class="sr-only" aria-live="polite"></p>
    </div>`;
    const canvas = host.querySelector(".rl-canvas"), lines = host.querySelector(".rl-lines"), cur = host.querySelector(".rl-cur");
    const opts = [...host.querySelectorAll(".rl-l")], nameEl = host.querySelector(".rl-name"), gapEl = host.querySelector(".rl-gap"), live = host.querySelector("[aria-live]");
    const vx = host.querySelector(".rl-x"), vy = host.querySelector(".rl-y"), vw = host.querySelector(".rl-w"), vh = host.querySelector(".rl-h");
    const opt = { signal: ctx.signal };

    /* Spacing: in each direction, the nearest sibling that overlaps on the other axis, or else the parent's edge. */
    function measure(l) {
      const parent = l.parent ? L.find((p) => p.id === l.parent) : FRAME;
      const sibs = L.filter((s) => s !== l && (s.parent || null) === (l.parent || null));
      const out = [];
      const overlapY = (s) => s.y < l.y + l.h && s.y + s.h > l.y, overlapX = (s) => s.x < l.x + l.w && s.x + s.w > l.x;
      const pick = (dir) => {
        let best = null;
        for (const s of sibs) {
          let d = null;
          if (dir === "left" && overlapY(s) && s.x + s.w <= l.x) d = l.x - (s.x + s.w);
          if (dir === "right" && overlapY(s) && s.x >= l.x + l.w) d = s.x - (l.x + l.w);
          if (dir === "up" && overlapX(s) && s.y + s.h <= l.y) d = l.y - (s.y + s.h);
          if (dir === "down" && overlapX(s) && s.y >= l.y + l.h) d = s.y - (l.y + l.h);
          if (d !== null && (!best || d < best.d)) best = { d, to: s.name };
        }
        if (!best) {
          const d = dir === "left" ? l.x - parent.x : dir === "right" ? parent.x + parent.w - (l.x + l.w) : dir === "up" ? l.y - parent.y : parent.y + parent.h - (l.y + l.h);
          best = { d, to: parent.name };
        }
        return { dir, ...best };
      };
      for (const dir of ["left", "right", "up", "down"]) out.push(pick(dir));
      return out;
    }
    let active = null;
    function show(id) {
      if (id === (active && active.id)) return;
      active = id ? L.find((l) => l.id === id) : null;
      opts.forEach((o) => o.setAttribute("aria-selected", String(!!active && o.dataset.id === active.id)));
      if (!active) {
        canvas.removeAttribute("aria-activedescendant"); lines.innerHTML = "";
        nameEl.textContent = "No layer"; nameEl.style.removeProperty("--c"); [vx, vy, vw, vh].forEach((b) => (b.textContent = "–")); gapEl.textContent = "";
        return;
      }
      const l = active;
      canvas.setAttribute("aria-activedescendant", `${uid}-${l.id}`);
      nameEl.textContent = l.name; nameEl.style.setProperty("--c", `var(--clip-${l.tone})`);
      vx.textContent = l.x; vy.textContent = l.y; vw.textContent = l.w; vh.textContent = l.h;
      const m = measure(l);
      lines.innerHTML = m.filter((g) => g.d > 0).map((g) => {
        const cx = l.x + l.w / 2, cy = l.y + l.h / 2;
        if (g.dir === "left") return `<i class="rl-red is-h" style="left:${pct(l.x - g.d, W)};width:${pct(g.d, W)};top:${pct(cy, H)}"><b>${g.d}</b></i>`;
        if (g.dir === "right") return `<i class="rl-red is-h" style="left:${pct(l.x + l.w, W)};width:${pct(g.d, W)};top:${pct(cy, H)}"><b>${g.d}</b></i>`;
        if (g.dir === "up") return `<i class="rl-red is-v" style="top:${pct(l.y - g.d, H)};height:${pct(g.d, H)};left:${pct(cx, W)}"><b>${g.d}</b></i>`;
        return `<i class="rl-red is-v" style="top:${pct(l.y + l.h, H)};height:${pct(g.d, H)};left:${pct(cx, W)}"><b>${g.d}</b></i>`;
      }).join("");
      const words = { left: "left", right: "right", up: "above", down: "below" };
      gapEl.textContent = m.map((g) => `${g.d} ${words[g.dir]}`).join(", ");
      live.textContent = `${l.name}, ${l.w} by ${l.h}. ` + m.map((g) => `${g.d} pixels to ${g.to} ${words[g.dir]}`).join(", ");
    }
    /* The smallest layer under a point, in frame pixels. */
    const hit = (fx, fy) => L.filter((l) => fx >= l.x && fx <= l.x + l.w && fy >= l.y && fy <= l.y + l.h).sort((a, b) => a.w * a.h - b.w * b.h)[0] || null;
    function point(fx, fy, on) {
      canvas.style.setProperty("--px", (fx / W).toFixed(4)); canvas.style.setProperty("--py", (fy / H).toFixed(4));
      cur.textContent = `${Math.round(fx)}, ${Math.round(fy)}`;
      canvas.classList.toggle("is-on", on); canvas.style.setProperty("--on", on ? "1" : "0");
      cur.style.transform = `translate(${fx > W * 0.78 ? "calc(-100% - 8px)" : "8px"}, ${fy > H * 0.85 ? "calc(-100% - 8px)" : "8px"})`;
      const l = hit(fx, fy);
      if (l) show(l.id); // over the bare frame, the last layer stays measured, as a selection would
    }
    const fromEvent = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; };
    let ghost = !ctx.reduced();
    canvas.addEventListener("pointermove", (e) => { ghost = false; const [fx, fy] = fromEvent(e); point(fx, fy, true); }, opt);
    canvas.addEventListener("pointerleave", () => { canvas.classList.remove("is-on"); canvas.style.setProperty("--on", "0"); }, opt);
    canvas.addEventListener("keydown", (e) => {
      const i = active ? L.indexOf(active) : -1, n = L.length;
      let next = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % n;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + n) % n;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = n - 1;
      else return;
      e.preventDefault(); ghost = false; show(L[next].id);
    }, opt);
    canvas.addEventListener("focus", () => { if (!active) show(L[0].id); }, opt);

    /* The self-run: an unseen hand drifts across the frame at an even pace, so the redlines cut from layer to layer. */
    if (ghost) {
      let t = 0;
      ctx.loop((dt) => {
        if (!ghost) return false;
        t += dt;
        point(W / 2 + 200 * Math.sin(t * 0.45), H / 2 + 100 * Math.sin(t * 0.9 + 0.8), true);
      });
    } else show("card");
    ctx.onHand(() => { ghost = false; });
  },
});
