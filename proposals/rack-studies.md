# Proposal: Rack Studies (Craft Remake)

Twelve original, calm, uplifting studies built from scratch in **Rack 2.0** using **`litt-design-craft`** — one strip, one surface, Rack 2.0's luminous 6-hue layer-colour family, plain human copy, direct 1:1 manipulation, and zero unnecessary chrome.

- Live standalone bundle: [`proposals/rack-studies/studies.html`](rack-studies/studies.html)
- Wall previews: [`wall-light.jpg`](rack-studies/wall-light.jpg) · [`wall-dark.jpg`](rack-studies/wall-dark.jpg)

## Design principles (`litt-design-craft`)

- **Simple:** one clear job per study, one strip + one surface, zero nested cards or cluttered toolbars.
- **Energetic & uplifting:** Rack 2.0's luminous 6-hue layer-colour family (`soft tint` + `1px` inset edge in the hue + `4.5:1` text tone in both Light & Dark) paired with sunlit yellow (`#ffc933`) strictly as the one lit key.
- **Inspiring emotion:** living long-exposure horizons (`Light Studies`), direct canvas reshaping (`Frame Designer`), architectural spacing guides (`Redline Inspector`), tactile `Hold to Ship`.
- **Easy to use and read:** plain words, zero clipped text, tabular figures, native ARIA roles, and 1:1 drag/scrub/click.
- **Not overwhelming & no unnecessary info:** ruthless subtraction pass on every study — zero decorative eyebrows, redundant counters, or filler chrome.

## The 12 studies

1. **Light Studies** (`light-studies`) — Animated long-exposure light horizons (`Dawn`, `Lagoon`, `Bloom`, `Dusk`) on a crisp canvas.
2. **Team in Motion** (`team-motion`) — Four coloured agent cards (`Plan`, `Explore`, `Build`, `Polish`) on one quiet lane.
3. **Effort Balance** (`effort-balance`) — Three tall coloured layer blocks (`Depth`, `Speed`, `Care`) dragged 1:1 vertically.
4. **Focus Mode** (`focus-mode`) — One calm status summary bar over four 0ms frame-snapping toggle keys.
5. **Release Flow** (`release-flow`) — Three-stage staircase (`Create → Check → Launch`) with a scrubbable playhead.
6. **Frame Designer** (`frame-designer`) — A pink `Card` directly on an 8px grid with draggable `Radius`, `Space`, and `Border` chips + `A / B` recall.
7. **Redline Inspector** (`redline-inspector`) — Hover or click any coloured layer to read crisp red pixel distances.
8. **Responsive Preview** (`responsive-preview`) — Breakpoint picker (`390 | 768 | 1280 | 1440`) with a live rearranging layout wireframe.
9. **Quick Jump** (`quick-jump`) — Zero-animation command box with coloured category tags and shortcut caps.
10. **Hold to Ship** (`hold-to-ship`) — Four coloured milestone strips + linear press-and-hold key filling to sunlit yellow.
11. **Daily Rhythm** (`daily-rhythm`) — Tabular live count cutting cleanly digit-by-digit (`0.35 → 1`, zero blank holes) over an orange 14-day histogram.
12. **Share & Install** (`share-install`) — Instant 0ms package-manager chooser + spacious mono cut with a cyan `litt-ui` chip and `Copy` key.

## Rebuilding locally

```bash
python3 proposals/rack-studies/build.py
rm -f proposals/rack-studies/dev.html
node skills/litt-md/scripts/check.mjs
```
