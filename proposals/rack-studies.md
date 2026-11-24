# Proposal: Rack 2.0 Studies

All twenty-three canonical studies from `proposals/flat-studies/`, redesigned in **Rack 2.0** (`proposals/rack.md`) — a pro tool for **agents, design, and interfaces** built around **one strip, one surface, and one family of 6 layer colours**.

- Live standalone bundle: [`proposals/rack-studies/studies.html`](rack-studies/studies.html)
- Wall previews: [`wall-light.jpg`](rack-studies/wall-light.jpg) · [`wall-dark.jpg`](rack-studies/wall-dark.jpg)

## What defines Rack 2.0

- **One strip and one surface:** every study has a single control strip (title, value boxes, at most one `#ffc933` yellow lit key) and a single work surface — zero nested chrome cards, zero fake DAW hardware, zero decorative subtitles.
- **One family of 6 layer colours:** every coloured object (agent, layer, stage, branch, component) wears a soft tint (`--clip-*-tint`), a crisp `1px` inset edge (`--clip-*`, `2px` when selected/firing), and its label in the hue's text tone (`--clip-*-text`) — every label at 4.5:1 on its tint and every edge at 3:1 in both Light and Dark themes:
  - **Agents:** Planner (purple), Researcher (blue), Coder / Deploy (orange), Reviewer (green)
  - **Design layers:** Header (purple), Avatar / Build (blue), Sidebar / Test (green), Card (pink), Button / component (cyan)
- **On the beat, time moves it:** `0ms` 1:1 direct manipulation under a hand (`Shift` fine, arrows step, double-click home), `100ms` ease-out opacity cut-in, `75ms` cut-out, `60ms` beat stagger, zero springs or bounce.

## Engineering & QA fixes applied on top of Rack 2.0

1. **`shell.html` (`ctx.loop`) + `fader.js` + `agent-shapes.js`:** clamped `dt >= 0` on first `requestAnimationFrame` frames and `Math.max(0, t)` in clock formatters so elapsed timers never render `-1:-0.1`.
2. **`copy-button.js`:** set `transition: none` on `.cb-seg button` so the active package-manager tab snaps on the frame (`0ms`) with crisp contrast in both themes.
3. **`number-ticker.js`:** pre-populated reshaped digit spans and cut opacity `0.35 → 1` so updating figures never drop blank holes mid-tick.
4. **`shell.html`:** eagerly mounted visible viewport tiles on load alongside `IntersectionObserver`, and added `?theme=light|dark` support.

## Rebuilding locally

```bash
python3 proposals/rack-studies/build.py
rm -f proposals/rack-studies/dev.html
node skills/litt-md/scripts/check.mjs
```
