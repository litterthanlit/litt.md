/* Workspace Permissions, redesigned in Plain (Subtraction): an agent's capabilities as three On/Off rows, with no
   footer strip. Each row has one living 4-corner frame that glides between On and Off (200ms, bounce 0) and clamps
   inward on press; Off rows step their label back so active capabilities scan at a glance. */
(function () {
  const PERMS = [
    { key: "edit", label: "Edit files", on: "Writes directly to workspace", off: "Stages diffs for review", start: true },
    { key: "test", label: "Run tests", on: "Runs vitest after edits", off: "Asks before shell commands", start: false },
    { key: "push", label: "Push branches", on: "Updates open PRs automatically", off: "Commits stay local", start: false },
  ];
  let uid = 0;
  PlainPlayer.register({
    slug: "autonomy-switch",
    title: "Workspace Permissions",
    tagline: "Agent capabilities, each On or Off in words.",
    css: `
.ps-autonomy-switch .aw { width: min(100%, 400px) }
.ps-autonomy-switch .aw-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 0 0 10px; border-bottom: 1px solid var(--line) }
.ps-autonomy-switch .aw-head h3 { margin: 0; font: 500 var(--t-h3)/1.3 var(--font); letter-spacing: -0.01em }
.ps-autonomy-switch .aw-tally { font-size: 13px }
.ps-autonomy-switch .aw-list { list-style: none; margin: 0; padding: 0 }
.ps-autonomy-switch .aw-list li { border-bottom: 1px solid var(--line) }
.ps-autonomy-switch .aw-row { all: unset; box-sizing: border-box; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 2px 24px; width: 100%;
  padding: 12px 0; cursor: pointer; -webkit-tap-highlight-color: transparent }
.ps-autonomy-switch .aw-row:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }
.ps-autonomy-switch .aw-label { font-size: 14px; font-weight: 500; color: var(--ink); transition: opacity var(--dur-pare) var(--ease-out) }
.ps-autonomy-switch .aw-note { grid-column: 1; color: var(--muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: opacity var(--dur-pare) var(--ease-out) }
.ps-autonomy-switch .aw-row[aria-checked="false"] .aw-label { font-weight: 400; opacity: 0.52 }
.ps-autonomy-switch .aw-row[aria-checked="false"] .aw-note { opacity: 0.52 }
.ps-autonomy-switch .aw-row[aria-checked="false"]:hover .aw-label,
.ps-autonomy-switch .aw-row[aria-checked="false"]:hover .aw-note { opacity: 0.85 }
.ps-autonomy-switch .aw-pair { position: relative; grid-column: 2; grid-row: 1 / span 2; display: inline-flex; gap: 20px; padding: 3px 10px; color: var(--ink); font-size: 14px }
.ps-autonomy-switch .aw-pair span { opacity: 0.38; transition: opacity var(--dur-pare) var(--ease-out) }
.ps-autonomy-switch .aw-row[aria-checked="true"] .aw-on, .ps-autonomy-switch .aw-row[aria-checked="false"] .aw-off { opacity: 1; font-weight: 500 }
.ps-autonomy-switch.is-tile .aw { width: 100% }
.ps-autonomy-switch.is-tile .aw-row { padding: 10px 0 }
`,
    mount(host, ctx) {
      const id = "ps-aw-" + ++uid;
      host.innerHTML = `
<div class="aw">
  <div class="aw-head"><h3 id="${id}">Permissions</h3><span class="aw-tally muted" aria-hidden="true"></span></div>
  <ul class="aw-list" role="group" aria-labelledby="${id}">
    ${PERMS.map((p) => `<li><button type="button" class="aw-row" role="switch" aria-checked="false" data-k="${p.key}" aria-describedby="${id}-${p.key}">
      <span class="aw-label">${p.label}</span><span class="aw-note" id="${id}-${p.key}"></span>
      <span class="aw-pair" aria-hidden="true"><span class="aw-on">On</span><span class="aw-off">Off</span></span></button></li>`).join("")}
  </ul>
  <p class="sr-only" aria-live="polite"></p>
</div>`;
      const tallyEl = host.querySelector(".aw-tally");
      const sr = host.querySelector("[aria-live]");
      const rows = {};

      for (const p of PERMS) {
        const btn = host.querySelector(`.aw-row[data-k="${p.key}"]`);
        const pair = btn.querySelector(".aw-pair");
        const onEl = btn.querySelector(".aw-on"), offEl = btn.querySelector(".aw-off");
        const note = btn.querySelector(".aw-note");
        const frame = ctx.brackets(pair, { padX: 9, padY: 2, exactPad: true });
        let cur = p.start;
        const set = (on, immediate, byUser) => {
          cur = on;
          btn.setAttribute("aria-checked", on ? "true" : "false");
          if (immediate) note.textContent = on ? p.on : p.off;
          else ctx.swapText(note, on ? p.on : p.off);
          frame.moveTo(on ? onEl : offEl, { immediate });
          if (byUser) sr.textContent = `${p.label} ${on ? "on" : "off"}`;
        };
        set(p.start, true, false);
        btn.addEventListener("click", () => { set(!cur, false, true); sync(false); }, { signal: ctx.signal });
        rows[p.key] = { get on() { return cur; }, set };
      }

      function sync(immediate) {
        const count = Object.values(rows).filter((r) => r.on).length;
        const txt = count === 0 ? "Read-only" : `${count} of ${PERMS.length} on`;
        if (immediate) tallyEl.textContent = txt;
        else ctx.swapText(tallyEl, txt);
      }
      sync(true);

      const seq = [["test", true], ["push", true], ["push", false], ["test", false]];
      let step = 0;
      ctx.demoAfter(1500, () => {
        const run = () => {
          const [k, on] = seq[step++ % seq.length];
          rows[k].set(on, false, false);
          sync(false);
        };
        run();
        ctx.demoEvery(2400, run);
      });
    },
  });
})();
