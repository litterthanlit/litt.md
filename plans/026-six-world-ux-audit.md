# 026. Six-World UI/UX Audit & Differentiation Tracker

> **Executor instructions**: Read `skills/litt-md/taste/litt-principles.md` and `plans/024-dial-in-each-world.md` before starting any track below. Never edit `skills/litt-md/taste/` or `skills/litt-md/assets/tokens.css` without Nick's explicit yes (`workflows/evolve.md`), and change nothing in Plain without asking Nick.

## Status

- **Status**: IN PROGRESS (~50% complete at `main` commit `53de46f`, 2026-11-19)
- **Priority**: P1 (Nick, 2026-11-19: "I want each world to be its own thing. Inspect each, find weaknesses in the UI and UX. Ease of use and invoke emotion.")
- **Effort**: L (in world-sized PRs)
- **Depends on**: Builds on `018`, `021`, and `024`.

## Why

After auditing all six worlds (`press`, `flat`, `device`, `plain`, `rack`, `heat`) for ease of use, emotional distinctiveness, and adherence to `skills/litt-md/taste/litt-principles.md`, the biggest gaps were:

1. **Shared gallery chrome & player objects**: four of six worlds still rendered `bare` players, Light/Dark toggles weren't native to each world, mobile player controls were awkward, and `#<world>/components` didn't lead with `"In the set"`.
2. **Device's voice** (`021` Phase 2) wasn't wired into interactive bodies yet.
3. **Heat** was mostly Press copies (only 5 bodies) instead of its faithful street-racing menu aesthetic.
4. **Flat** had no world-only signature parts (`meta.worlds`) and still used Press's gridlined square-bar chart fallback.
5. **Heat, Rack, and Press** still show shared web-studio demo copy (`0` per-world `byWorld` pages) and have `0` world-only signature components (`worlds: [...]`), whereas Device has `4` and Flat now has `3`.

## Shipped & Merged (`#139`–`#144`)

| PR | Commit | Scope |
|---|---|---|
| **#139** | `c7068cd` | **Path A (Shared UX + Device voice + Flat front door)**: world-native Light/Dark toggle, mobile player controls, `"In the set"` shelf first on `#<world>/components`, synthesized Web Audio voices (`sound.ts`) wired into Device bodies & recorder with a silent hardware Mute key (`data-silent`), and Flat's Heatwave `Progress` leading `SET.flat`. |
| **#140** | `197d485` | **All Six World Objects (`018`)**: dedicated `PlayObject` bodies for Press (`bodies/press.tsx`), Plain (`bodies/plain.tsx`), Rack (`bodies/rack.tsx`), and Heat (`bodies/heat.tsx`); `OBJECTS` in `gallery/scripts/playground.mjs` now covers all 6 worlds. |
| **#141** | `4372f41` | **Heat Wave 2**: authentic street-racing menu bodies for `button`, `switch`, `segmented`, `slider`, `tabs`, `stat`, and `select` (flat square slabs, four 8px amber corner brackets, 16-dash amber bar, diagonal hazard-striped header bands). |
| **#142** | `6f673b5` | **Heat Wave 3**: authentic Heat bodies for `checkbox`, `input`, `table`, `tag`, `pagination`, and `code-input`, plus 16-dash amber `progress` under Heat. |
| **#143** | `3cea516` | **Heat Wave 4**: authentic Heat bodies for `card-picker`, `option-picker`, `number-field`, `slide-confirm`, `sparkline`, and `legend` (19/23 total), plus opaque square black slab + amber corner-bracket row styling on `Menu` / `ContextMenu`. |
| **#144** | `53de46f` | **Flat Signature Playful Wave**: three Flat-only components (`Poll`, `Streak`, `Kudos` with `worlds: ["flat"]`) built on Flat's `0.28` expressive bounce, 40px standing figure, Candy data hues, and sunset heatwave ramp; Flat's 23rd body (`worlds/flat/chart.tsx`, gridline-free pill bars & Candy pearl lines); refreshed `SET.flat` front door. |

## Six-World Scorecard (at `main` `53de46f`)

| World | Bodies (`src/worlds/<w>/`) | World-Only Parts (`meta.worlds`) | PlayObject Body | Per-World Voice Demos (`byWorld`) | State |
|---|---|---|---|---|---|
| **Device** | 23 / 23 | 4 (`agent-indicator`, `tape-progress`, `seven-segment`, `copy-button`) | `bodies/device.tsx` | 63 pages | **Done** — materials, voice, recorder, Web Audio sound complete. |
| **Flat** | 23 / 23 | 3 (`poll`, `streak`, `kudos`) | `bodies/flat.tsx` | 31 pages | **Strong / Near-complete** — Candy data, Heatwave, `0.28` bounce, pill chart, and 3 signature leaves live. Optional polish: more leaves, remaining Variants copy sweep, or tokenizing dark `.flat-sheet` (`--flat-sheet`, needs Nick's yes). |
| **Heat** | 19 / 23 | 0 | `bodies/heat.tsx` | 0 pages | **In progress** — 4 bodies left (`chart`, `composer`, `file-drop`, `token-input`), plus Heat's racing voice (`byWorld`) and optional Heat-only leaves. |
| **Rack** | 23 / 23 | 0 | `bodies/rack.tsx` | 0 pages | **Bodies done, needs identity & fun** — demos still speak web-studio copy instead of Ableton Live clips/tracks/macros; needs Rack-only leaves and `byWorld` demos. |
| **Press** | 23 / 23 (contract) | 0 | `bodies/press.tsx` | 0 pages | **Paused** on `024` Phase 1 direction calls (`press-round2.tsx` on `#canvas`); revisit when Nick decides. |
| **Plain** | 7 | 0 | `bodies/plain.tsx` | 0 pages | **Hold** — change nothing in Plain without asking Nick (`litt-principles.md`). |

## Remaining Tracks to Finish the Audit

### Track 1 — Heat Completion (`feat/heat-wave-5` + Heat Voice)
- [ ] Add final 4 dedicated Heat bodies to reach 23 / 23 parity:
  - `gallery/src/worlds/heat/chart.tsx` (telemetry bar/line grid on a flat black slab)
  - `gallery/src/worlds/heat/composer.tsx`
  - `gallery/src/worlds/heat/file-drop.tsx`
  - `gallery/src/worlds/heat/token-input.tsx`
- [ ] Add Heat's racing-menu voice (`byWorld` demos) across `SET.heat` (`menu`, `tabs`, `segmented`, `button`, `slider`, `stat`, `gauge`, `rolling-number`, `progress`, `table`, `select`, `toast`) — garage, lap splits, standings, tune settings, pursuit telemetry instead of shared studio strings.
- [ ] Optional Heat-only leaves (`worlds: ["heat"]`), e.g. `LapTimer` or `TuneBar`, if Nick wants Heat parity with Device (4) and Flat (3).

### Track 2 — Rack Identity & Playful Leaves (`feat/rack-fun-and-voice`)
- [ ] Add Rack-only signature components (`worlds: ["rack"]`) following Ableton Live's colorful clip/device vocabulary (e.g. `ClipLauncher` with quantized trigger/stop clips, `MacroRack` / compact parameter strip).
- [ ] Add Rack's voice (`byWorld` demos) across `SET.rack` (`slider`, `curve-editor`, `spring-editor`, `pad`, `time-scrubber`, `inspector`, `number-field`, `color-picker`, `segmented`, `switch`, `button`, `range-chart`) — clips, tracks, scenes, BPM, dB, bars/beats.

### Track 3 — Flat Deepening (Optional)
- [ ] Optional additional Flat-only leaves (e.g., `ReadingProgress` or `ReactionBar`) and Variants voice sweep.
- [ ] **STOP for Nick**: promote dark `.flat-sheet` into a `--flat-sheet` token in `skills/litt-md/assets/tokens.css` via `workflows/evolve.md` if desired.

### Track 4 — Press Direction & Voice (When Nick Is Ready)
- [ ] **STOP for Nick**: review `024` Phase 1 / `press-round2.tsx` on `#canvas`, confirm Press's direction, then bring deploy-dashboard voice (`byWorld`) to `SET.press`.

### Track 5 — Final Cross-World Verification
- [ ] Extend `gallery/scripts/materials.mjs` as needed for Heat/Rack/Press and confirm zero regressions across all 6 worlds (light & dark).

## Verification & Guardrails

- **Always run before opening a PR**:
  ```bash
  node skills/litt-md/scripts/check.mjs && npm run verify --prefix gallery && npm run build --prefix gallery
  ```
- **Registry hygiene**: every new world-only component needs a plain-word entry (no em dashes) in `COPY` inside `gallery/scripts/gen-registry.mjs`, `worlds: ["<world>"]` in `meta`, valid `data-part` kinds (`FLAT_KINDS` / `KINDS` in `gallery/scripts/materials.mjs`), and a release note in `gallery/CHANGELOG.md`.
- **R6 / `test:wall`**: never place an `--accent` (or `bg-fg` under Flat) fill on elements `>= 24x16px` outside the single primary button tile per view.
- **No direct pushes to `main`**: ship every wave in a feature branch + PR with live visual screenshots and the Vercel preview link.
