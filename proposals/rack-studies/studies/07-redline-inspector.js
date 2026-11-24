/* 07-redline-inspector.js — Redline Inspector:
   Hover or click any coloured layer in a clean frame to outline it and read crisp red pixel distances. */
(function () {
  const S = ".rs-redline-inspector";
  const LAYERS = {
    header: { label: "Header", dims: "464 × 24", top: "8", right: "8", bottom: "8", left: "8" },
    nav: { label: "Nav", dims: "104 × 88", top: "8", right: "12", bottom: "8", left: "8" },
    hero: { label: "Hero", dims: "212 × 88", top: "8", right: "48", bottom: "8", left: "12" },
    cta: { label: "Action", dims: "76 × 22", top: "54", right: "122", bottom: "12", left: "14" },
  };

  RackPlayer.register({
    slug: "redline-inspector",
    title: "Redline Inspector",
    tagline: "Point at any layer to read its exact spacing — nothing trails or flickers.",
    css: `
${S} .ri-can {
  position: relative; margin: 10px; height: 132px; border-radius: var(--r-control);
  background: var(--cut); box-shadow: var(--edge); overflow: hidden;
}
${S} .ri-ly {
  position: absolute; padding: 4px 7px; font-size: 10px; border: 0; text-align: left; cursor: pointer;
}
${S} .ri-tag {
  position: absolute; background: var(--danger); color: #fff;
  font: 600 9px/1 var(--mono); padding: 2px 4px; border-radius: 1px; pointer-events: none;
}
${S}.is-tile .ri-can { height: 120px; }
`,
    mount(host, ctx) {
      let sel = "hero";

      host.innerHTML =
        '<div class="rk">' +
          '<div class="rk-strip"><b>Frame</b><span class="rk-box" style="margin-left:auto" id="ri-dim">212 × 88</span></div>' +
          '<div class="ri-can">' +
            '<button type="button" class="ly ri-ly" data-id="header" data-h="purple" style="left:8px;right:8px;top:8px;height:24px">Header</button>' +
            '<button type="button" class="ly ri-ly" data-id="nav" data-h="green" style="left:8px;top:40px;bottom:8px;width:24%">Nav</button>' +
            '<button type="button" class="ly ri-ly" data-id="hero" data-h="pink" style="left:32%;top:40px;bottom:8px;width:52%">Hero</button>' +
            '<button type="button" class="ly ri-ly" data-id="cta" data-h="cyan" style="left:36%;bottom:16px;width:22%;height:22px">Action</button>' +
            '<span class="ri-tag" id="ri-t" style="left:55%;top:31px">8</span>' +
            '<span class="ri-tag" id="ri-l" style="left:27%;top:74px">12</span>' +
            '<span class="ri-tag" id="ri-r" style="right:14px;top:74px">48</span>' +
          '</div>' +
        '</div>';

      const els = [...host.querySelectorAll(".ri-ly")];
      const dim = host.querySelector("#ri-dim");
      const tEl = host.querySelector("#ri-t"), lEl = host.querySelector("#ri-l"), rEl = host.querySelector("#ri-r");

      function draw() {
        const info = LAYERS[sel];
        dim.textContent = info.label + " · " + info.dims;
        tEl.textContent = info.top; lEl.textContent = info.left; rEl.textContent = info.right;
        els.forEach((el) => el.classList.toggle("is-sel", el.dataset.id === sel));
      }

      els.forEach((el) => {
        el.addEventListener("pointerenter", () => { sel = el.dataset.id; draw(); }, { signal: ctx.signal });
        el.addEventListener("click", () => { sel = el.dataset.id; draw(); }, { signal: ctx.signal });
      });
      draw();

      const seq = ["hero", "cta", "nav", "header"];
      let ghost = !ctx.reduced(), idx = 0;
      ctx.onHand(() => { ghost = false; });
      if (ghost) ctx.every(2200, () => { if (!ghost) return; sel = seq[++idx % seq.length]; draw(); });
    },
  });
})();
