# Plan 026: Step into the room (Device `#canvas` prototype) and the Taste Engine direction

> **Executor instructions**: Read this plan, `.claude/CLAUDE.md`, `skills/litt-md/taste/litt-principles.md` (Device),
> and `plans/024-dial-in-each-world.md`. Phase 1 lives in `gallery/src/canvas/`, plus one narrow 2-line addition in
> `gallery/src/motion/sound.ts` (optional `root` on `PlayOptions` so Device voices resolve inside a nested Device frame
> on `#canvas`) and a pure Node test (`gallery/scripts/test-plane.mjs`). Change nothing in `gallery/src/components/`,
> `gallery/src/worlds/`, `gallery/src/motion/hand.ts`, or `skills/litt-md/assets/tokens.css`. STOP after Phase 1 for
> Nick's hand check.
>
> **Drift check (run first)**:
> `git diff --stat 539b655..HEAD -- gallery/src/canvas gallery/src/motion/hand.ts gallery/src/motion/sound.ts gallery/src/motion/rules.ts gallery/src/worlds/device skills/litt-md/assets/tokens.css`
> Report any change to `canvas/registry.tsx`, `sound.ts`, `rules.ts`, or Device's tokens before placing the new canvas item.

## Status

- **Priority**: P1 (Nick locked this direction in the 2026-11-21 grill-me after Fable's review)
- **Effort**: M for Phase 1 (`#canvas` Device room + Feel Bench prototype); Phase 2 runs under existing Plan 024; Phase 3 (repo split) gets its own plan only after Phase 1 and Phase 2 pass
- **Risk**: MEDIUM (CSS `preserve-3d` flattening, tilted-plane pointer projection through the canvas camera, and subpixel text softness under 3D transforms; isolated to `#canvas` plus one additive option in `sound.ts`)
- **Depends on**: `024` (Phase 3 only). Phase 1 has no dependencies.
- **Category**: direction, motion, spatial
- **Planned at**: commit `539b655`, 2026-11-21 (revised after Fable's review on PR #165)

## Why & locked direction (2026-11-21 grill-me)

Following Nick's comparison of UI SDK, Base UI, Radix and dropping the component gallery—plus Fable's critique of the first pitch and Nick's review of [DialKit](https://www.dialkit.dev/) and [Graphical](https://www.graphicalui.com/)—Nick locked in the direction for what comes next:

1. **Product identity — a tactile World & Feel Engine, not a flat theme editor.**
   Graphical already ships a web CSS-token editor + 38 Base UI components + `GUI.md`, and DialKit already owns generic in-app `useDialKit` sliders/timelines. What neither has is what makes `litt.md` and `litterthanlit/components` unmistakable:
   - **Physical, emotional worlds** (materials, top-lit depth, machined hardware, Web Audio clicks, long-exposure shaders),
   - **Spatial "Step Into the Room" view** (inspecting a live component in its world's physical space and springing flat into crisp 2D to use it),
   - **A lean Feel Bench** (live tuning for physics, press depth, sound character, light angle, and Z-depth—exporting straight back to tokens/skills, *not* a 50-field Figma clone), and
   - **Mechanical agent checks** (`skills/litt-md/scripts/litt-check.mjs`, `lint-litt.mjs`, material/corner/motion verifiers) that enforce taste inside an agent's loop rather than relying on prose alone.
2. **Day-1 user — Nick and Nick's agents first.**
   No premature paywalling or docs-driven static UI-kit funnel (a real commercial risk in 2026—e.g. Tailwind Labs publicly reported an ~80% revenue drop in January 2026 as AI bypassed docs traffic, and closed Tailwind Plus to new buyers upon joining Shopify in September 2026). Build the sharpest possible weapon for Nick's own sites and apps; package publicly only once two worlds are undeniable.
3. **Gallery vs. Engine.**
   Stop expanding the current catalog (`gallery/src/components/` holds 112 component files at `539b655`). The target shape for the future Taste Engine is:
   - **Craft Engine** (`motion/`, `sound/`, `room/`, `materials/`, Feel Bench),
   - **~10–12 core world primitives** (the hard interactive staples: Dialog/Sheet, Popover, Menu, Select, Combobox, Tabs, Switch, Slider, Input, Button, Tooltip, Toast),
   - **Curated interactive Studies** (the `components` bar, ~12 per world), and
   - **Mechanical host checks** shipped alongside the engine.
4. **Primitives — stay put in `litt.md`, decide once at extraction.**
   Keep Radix untouched in `litt.md` for now; Plan 017 (`no-primitive-library`) remains deferred. Choose **Base UI vs. UI SDK** only at Phase 3 (repo extraction), once Device and Flat are solid and UI SDK has matured past `0.1.0-beta.1`.
5. **Repo sequence — prove here, finish two worlds, then split clean.**
   Splitting immediately creates a 3-repo sync trap (`components`, `litt.md`, and `taste-engine`). Instead:
   - **Phase 1 (this plan):** Build the `#canvas` Device Room + lean Feel Bench prototype inside `litt.md` and judge it by hand.
   - **Phase 2 (existing Plan 024):** Finish dialling in **Device** and **Flat** here with the Room and Feel Bench patterns proven.
   - **Phase 3 (separate plan after Phase 2):** Extract the clean new **Taste Engine** repo (`motion/`, `sound/`, `room/`, Feel Bench, mechanical checks, Device + Flat, and ~10–12 core primitives) and leave `litt.md` frozen as the component library/archive.

## Decisions settled in PR #165 review (Fable)

1. **Isolation from `hand.ts`:** Keep the Phase 1 Device module self-contained in `gallery/src/canvas/` using `plane.ts`; do not modify `gallery/src/motion/hand.ts` until Nick approves the feel.
2. **Where the Room graduates:** Keep the Room on `#canvas` until Nick's hand check passes, then decide whether it joins `#device` during Plan 024 or waits for Phase 3.
3. **Feel Bench and `tune.tsx`:** In Phase 3's extracted Taste Engine, evolve the Feel Bench out of `gallery/src/components/tune.tsx` (adding sound, press depth, light, and Z-depth) rather than maintaining a second tuning UI.

## Phase 1: The `#canvas` Device Room prototype

The prototype lives in `gallery/src/canvas/` (no nav entry, no wall tile, invisible to page checks, per `.claude/CLAUDE.md` `#canvas` rules), with one small additive change in `gallery/src/motion/sound.ts` so Device's voices work inside a nested Device frame.

### Scoping Device's look and sound on `#canvas`

`#canvas` runs outside every world, so `<html>` wears Flat. Without explicit scoping, Device's tokens (`--plate-face`, `--lcd`, `--slot`, `--key-lift`, `--sound-*`) resolve to Flat's defaults or `null`.

- **World & theme wrapper (same pattern as `gallery/src/canvas/press.tsx` and `flat-calls.tsx`):** Wrap each preview frame (Light and Dark) in `<MaterialProvider material="device">` around a container ref (`frameRef`) that spreads `lookAttributes({ accent: "world", material: "device" }, dark)` so all Device visual and sound tokens resolve cleanly on that element.
- **Minimal additive fix in `gallery/src/motion/sound.ts`:** `readVoice(name, root)` already accepts `root?: Element | null` (`sound.ts:284`), but `play(name, options)` currently calls `readVoice(name)` with no `root` (defaulting to `document.documentElement`, which is Flat on `#canvas`, causing `play()` to return silently even when `options.values` is provided). Add an optional `root?: Element | null` field to `PlayOptions` and pass `options.root` to `readVoice(name, options.root)`. Existing callers omit `root` and keep identical behavior. Because `sound.ts` ships in `motionFiles` (`gallery/scripts/gen-registry.mjs:1608`), Phase 1 includes the required `motion` changelog entry, updated `gallery/registry.lock.json`, `npm run test:sound --prefix gallery`, and `npm run test:registry --prefix gallery -- --app vite`.

### Subject: one compact Device module

A single machined Device plate combining **Slider + Switch + LCD readout** so one prototype proves both the full Device material depth map (`frame` → `plate` → `well`/`slot` → `key`/`cap` → `lcd`) and the hardest tilted-plane interaction (continuous drag + discrete toggle + live readout + sound):

- **Plate & Frame (`data-part="frame"`, `data-part="plate"`):** Uses Device's existing tokens (`--frame`, `--frame-edge`, `--plate-face`, `--plate-edge`, `--plate-grain`, `--highlight`) with real extruded plate thickness (stacked Z-skirt faces or bevel walls) and a grounded cast shadow on the studio plinth.
- **Slider (`data-part="slot"`, `data-part="cap"`):** Real interactive control (`role="slider"`, `tabIndex={0}`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`) — never a bare `div` (Principle #5, and required so `canvas.tsx`'s `spaceIsTaken()` recognizes it). Recessed fader slot with engraved ticks, lit fill (`--lamp-on`), raised cap standing proud on its skirt, sinking `--press-depth` (2px) while held, and playing `"notch"` ticks via `useSound()` (`{ root: frameRef.current }`) as the cap crosses detents.
- **Switch (`data-part="well"`, `data-part="key"`):** Real `<button type="button" role="switch" aria-checked={...}>` seated in a recessed well, sinking `--press-depth` on press with `"switch"` / `"key-down"` / `"key-up"` via `useSound()` (`{ root: frameRef.current }`), toggling the module's armed state and updating its lamp (`data-part="light"`).
- **LCD readout (`data-part="lcd"`):** Dark glass behind a bezel displaying the live fader value and switch state in mono (`--field`, `--field-ink`, `--lcd`, `--lcd-edge`), reacting instantaneously to every drag, toggle, or keyboard step.

### Three views & transitions

1. **Room (default):** The module sits at an isometric angle on a lit studio plinth (`rotateX` + `rotateZ` / `rotateY` with perspective), with real plate thickness and grounded desk shadow. **100% live and interactive**—clicking the switch or dragging the slider works right here.
2. **Step In (`0°` flat):** Triggered by an explicit `<button>` control (**Step in** / **Room**)—no plinth double-click, avoiding conflicts with canvas pointer gestures. Springs the camera flat onto the working 2D surface on the expressive spring. **Crispness rule:** once the spring settles at `0°`, remove the module's 3D transform completely (`transform: none`, `transform-style: flat`). Because `canvas.tsx` applies `translate3d(x, y, 0) scale(z)` on the canvas world element, text crispness is judged at **100% zoom (the `0` key, whole-pixel pan)** beside a 2D reference Device part rendered in the same canvas item. Pressing `Escape` returns to Room **only while focus is inside the module** (scoped `onKeyDown` on the module container, never a window listener).
3. **Explode toggle:** An explicit `<button aria-pressed={...}>` control that smoothly separates the `data-part` strata along the Z-axis (`frame` → `plate` → `well`/`slot` → `cap`/`key` → `lcd`) with subtle depth guides, while every control stays live and clickable.

### Engineering constraints

1. **Full-chain inverse-matrix pointer projection on plain arrays (`plane.ts`):**
   Dragging a slider at an isometric angle moves diagonally in viewport `(clientX, clientY)` pixels, and `canvas.tsx` wraps every item in an ancestor `translate3d(x, y, 0) scale(z)` plus the item's own `translate(x, y)`. A single element's `getComputedStyle().transform` misses those ancestors, and Node has no `DOMMatrix`.
   - Write `gallery/src/canvas/plane.ts` with pure **4×4 `number[]` matrix math** (multiply, invert, perspective, translate, rotateX/Y/Z, scale, ray-plane intersection from screen `(x, y)` into local `(u, v)` track coordinates) so the math core has zero DOM dependencies.
   - Add a thin DOM helper in `plane.ts` that walks the element's ancestor chain up to the viewport, accumulating every ancestor `transform`, `perspective`, `transform-origin`, and layout offset (including `canvas.tsx`'s world camera `translate3d`/`scale`) into the full 4×4 matrix before inverting.
   - Add **`gallery/scripts/test-plane.mjs`** (`npm run test:plane --prefix gallery`, wired into `verify` in `gallery/package.json`) that tests `plane.ts`'s pure math in Node and asserts round-trip projection accuracy within `0.5px` across: `0°` flat, `35°` isometric, exploded Z-offsets, and canvas camera zoom levels (`0.5`, `1`, `2`) with fractional pan offsets.
2. **`preserve-3d` flatness and canvas clip discipline:**
   - Never place `overflow: hidden`, `opacity < 1`, `filter`, or `backdrop-filter` on any ancestor between the perspective stage and the extruded `data-part` layers. Clipping (e.g. the slider fill inside its slot) lives only on leaf elements. Press's frosted glass (`backdrop-filter`) is out of scope for Phase 1.
   - **Never animate `opacity` on any stratum that holds `preserve-3d` children** during Explode or Step In, as intermediate `opacity < 1` flattens the 3D context mid-transition.
   - `canvas.tsx` sets `overflow-hidden` on `[data-canvas-preview]`, which sits *above* the perspective stage (so it does not break `preserve-3d`, but it *will* clip anything projected outside the preview box). Size the item generously in `gallery/src/canvas/registry.tsx` with explicit internal padding around the stage so the tilted, extruded, and max-exploded projection stays completely inside the preview frame.
3. **Sound, keyboard, and reduced motion:**
   - Sound uses `useSound()` with `{ root: frameRef.current }` strictly inside trusted pointer/key gestures (respecting `HAND_MS` and mute); nothing sounds on load or camera sweeps.
   - All interactive parts use real control elements/roles (`button`, `role="switch"`, `role="slider"` with `tabIndex={0}`) so `canvas.tsx`'s `spaceIsTaken()` yields `Space` to focused controls and pointer drags never trigger canvas pans.
   - Under `prefers-reduced-motion: reduce`, Room / Step In / Explode snap instantaneously with zero camera sweep.

### Lean Feel Bench (paired beside the module on `#canvas`)

A compact, tactile control strip next to the module for tuning **feel only** (never generic theme colors/typography):

- **Camera / Room:** Tilt angle, Z-extrusion depth, Explode spacing
- **Physics:** Step-in spring duration and bounce (bounded by `gallery/src/motion/rules.ts`), key `--press-depth`
- **Light:** Overhead light azimuth / highlight strength
- **Sound:** Voice trigger & live pitch/length/level override (calling `play(voice, { root: frameRef.current, values })`, bounded by `SOUND_LIMITS` in `sound.ts`)
- **Export:** **Copy tokens** button that copies the tuned CSS custom properties / spring config in a paste-ready block.

### Files to add / edit in Phase 1

- `gallery/src/motion/sound.ts` — add optional `root?: Element | null` to `PlayOptions` and pass it to `readVoice(name, options.root)` inside `play()`
- `gallery/CHANGELOG.md` + `gallery/registry.lock.json` — one `changed` line for `motion` (and regenerated lock) covering the additive `PlayOptions.root` option
- `gallery/src/canvas/plane.ts` — pure 4×4 plain-array matrix math + ancestor-accumulating DOM projection helper
- `gallery/scripts/test-plane.mjs` + `gallery/package.json` — Node self-check (`npm run test:plane --prefix gallery`, wired into `verify`)
- `gallery/src/canvas/device-room.css` — 3D stage, extruded plate/key skirt geometry, plinth shadow, `preserve-3d` hierarchy (tokens only; no hex values)
- `gallery/src/canvas/device-room.tsx` — Device-scoped Light & Dark frames (`MaterialProvider` + `lookAttributes`), Device module (Slider + Switch + LCD), Room / Step In / Explode controls, 2D crispness reference, and lean Feel Bench
- `gallery/src/canvas/registry.tsx` — register the generously sized Device Room canvas item near the top of `#canvas`

## Pass / fail bar (Phase 1 STOP for Nick)

Judge the built `#canvas` item by hand in both Light and Dark Device frames, with mouse and keyboard:

- [ ] **Physicality:** In Room mode, the module reads as a machined aluminium object sitting on a lit desk (visible plate thickness, recessed wells, grounded shadow, 2px key/cap sink), not a tilted flat card, with zero clipping by `[data-canvas-preview]` at max Explode.
- [ ] **Hand feel on the tilted plane (at multiple zoom levels):** Dragging the Slider at isometric angle tracks the pointer 1:1 from end to end at 100%, 50%, and 200% canvas zoom with zero slip, and fires `"notch"` detents cleanly.
- [ ] **Step In crispness (at 100% zoom):** Stepping in via the button springs smoothly to `0°` and drops its 3D transform (`transform: none`) on settle; at 100% zoom (`0` key, whole-pixel pan), text and hairlines match the sibling 2D Device reference inside the same canvas item.
- [ ] **Explode clarity:** Toggling Explode cleanly lifts `frame → plate → well/slot → cap/key → lcd` along Z with zero mid-transition flattening while Switch, Slider, and LCD remain live.
- [ ] **Sound & Feel Bench:** Switch clicks, slider notch ticks, and Feel Bench sound/physics/light/Z controls all work live on `#canvas` (muted cleanly when muted; silent on load and camera sweeps).
- [ ] **Keyboard & reduced motion:** Tab, Arrow keys, Space/Enter (without panning the canvas), and scoped Escape (returning from Step In only while focus is inside the module) all work; under `prefers-reduced-motion: reduce`, mode switches snap instantly.
- [ ] **Checks green:** `node skills/litt-md/scripts/check.mjs`, `npm run verify --prefix gallery` (including `test:plane`), `npm run build --prefix gallery`, `npm run test:sound --prefix gallery`, and `npm run test:registry --prefix gallery -- --app vite` all pass.

## Checks before Phase 1 merges

```bash
node skills/litt-md/scripts/check.mjs
npm run verify --prefix gallery && npm run build --prefix gallery
npm run test:sound --prefix gallery
npm run test:registry --prefix gallery -- --app vite
```

## Done when (Phase 1)

- The Device Room + Feel Bench item is live on `#canvas` in Light and Dark Device frames.
- `test:plane` passes in `verify` across `0°`, `35°`, exploded Z-offsets, and camera zooms (`0.5`, `1`, `2`).
- All seven items in the Pass / fail bar are verified by Nick by hand.
- `check.mjs`, `verify`, `build`, `test:sound`, and `test:registry -- --app vite` pass.
