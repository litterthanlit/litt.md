# Plan 026: Step into the room (Device `#canvas` prototype) and the Taste Engine direction

> **Executor instructions**: Read this plan, `.claude/CLAUDE.md`, `skills/litt-md/taste/litt-principles.md` (Device),
> and `plans/024-dial-in-each-world.md`. Phase 1 lives strictly inside `gallery/src/canvas/`: change nothing in
> `gallery/src/components/`, `gallery/src/worlds/`, `gallery/src/motion/`, or `skills/litt-md/assets/tokens.css`, so no
> registry item, changelog or lockfile moves while the room is proved. STOP after Phase 1 for Nick's hand check.
>
> **Drift check (run first)**:
> `git diff --stat 539b655..HEAD -- gallery/src/canvas gallery/src/motion/hand.ts gallery/src/motion/sound.ts gallery/src/worlds/device`
> Report any change to `canvas/registry.tsx` or Device's tokens before placing the new canvas item.

## Status

- **Priority**: P1 (Nick locked this direction in the 2026-11-21 grill-me after Fable's review)
- **Effort**: M for Phase 1 (`#canvas` Device room + Feel Bench prototype); Phase 2 runs under existing Plan 024; Phase 3 (repo split) gets its own plan only after Phase 1 and Phase 2 pass
- **Risk**: MEDIUM (CSS `preserve-3d` flattening, tilted-plane pointer projection, and subpixel text softness under 3D transforms; all isolated to `#canvas` in Phase 1)
- **Depends on**: none for Phase 1. Phase 3 depends on Phase 1's STOP and Plan 024 finishing Device and Flat.
- **Category**: direction, motion, spatial
- **Planned at**: commit `539b655`, 2026-11-21

## Why & locked direction (2026-11-21 grill-me)

Following Nick's comparison of UI SDK, Base UI, Radix and dropping the component gallery—plus Fable's critique of the first pitch and Nick's review of [DialKit](https://www.dialkit.dev/) and [Graphical](https://www.graphicalui.com/)—Nick locked in the direction for what comes next:

1. **Product identity — a tactile World & Feel Engine, not a flat theme editor.**
   Graphical already ships a web CSS-token editor + 38 Base UI components + `GUI.md`, and DialKit already owns generic in-app `useDialKit` sliders/timelines. What neither has is what makes `litt.md` and `litterthanlit/components` unmistakable:
   - **Physical, emotional worlds** (materials, top-lit depth, machined hardware, Web Audio clicks, long-exposure shaders),
   - **Spatial "Step Into the Room" view** (inspecting a live component in its world's physical space and springing flat into crisp 2D to use it),
   - **A lean Feel Bench** (live tuning for physics, press depth, sound character, light angle, and Z-depth—exporting straight back to tokens/skills, *not* a 50-field Figma clone), and
   - **Mechanical agent checks** (`skills/litt-md/scripts/litt-check.mjs`, `lint-litt.mjs`, material/corner/motion verifiers) that enforce taste inside an agent's loop rather than relying on prose alone.
2. **Day-1 user — Nick and Nick's agents first.**
   No premature paywalling or static UI-kit funnel (which AI broke for Tailwind Plus in 2026). Build the sharpest possible weapon for Nick's own sites and apps; package publicly only once two worlds are undeniable.
3. **Gallery vs. Engine.**
   Stop expanding the 112-component CRUD catalog. The target shape for the future Taste Engine is:
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

## Phase 1: The `#canvas` Device Room prototype

Everything in Phase 1 lives inside `gallery/src/canvas/` (no nav entry, no wall tile, invisible to page checks, zero registry/lock churn, per `.claude/CLAUDE.md` `#canvas` rules).

### Subject: one compact Device module

A single machined Device plate combining **Slider + Switch + LCD readout** so one prototype proves both the full Device material depth map (`frame` → `plate` → `well`/`slot` → `key`/`cap` → `lcd`) and the hardest tilted-plane interaction (continuous drag + discrete toggle + live readout + sound):

- **Plate & Frame (`data-part="frame"`, `data-part="plate"`):** Uses Device's existing tokens (`--frame`, `--frame-edge`, `--plate-face`, `--plate-edge`, `--plate-grain`, `--highlight`) with real extruded plate thickness (stacked Z-skirt faces or bevel walls) and a grounded cast shadow on the studio plinth.
- **Slider (`data-part="slot"`, `data-part="cap"`):** Recessed fader slot with engraved ticks, lit fill (`--lamp-on`), raised cap standing proud on its skirt, sinking `--press-depth` (2px) while held, and playing `"notch"` ticks via `useSound()` as the cap crosses detents.
- **Switch (`data-part="well"`, `data-part="key"`):** Physical key/toggle seated in a recessed well, sinking `--press-depth` on press with `"switch"` / `"key-down"` / `"key-up"` via `useSound()`, toggling the module's active/armed state and updating its lamp (`data-part="light"`).
- **LCD readout (`data-part="lcd"`):** Dark glass behind a bezel displaying the live fader value and switch state in mono (`--field`, `--field-ink`, `--lcd`, `--lcd-edge`), reacting instantaneously to every drag, toggle, or keyboard step.

### Three views & transitions

1. **Room (default):** The module sits at an isometric angle on a lit studio plinth (`rotateX` + `rotateZ` / `rotateY` with perspective), with real plate thickness and grounded desk shadow. **100% live and interactive**—clicking the switch or dragging the slider works right here.
2. **Step In (`0°` flat):** Clicking **Step in** (or double-clicking the plinth / pressing `Enter` on the stage toggle) springs the camera flat onto the working 2D surface on the expressive spring. **Critical crispness rule:** once the spring settles at `0°`, remove the CSS 3D transform completely (`transform: none`, `transform-style: flat`) so 2D text, hairlines, and surfaces render at full native sharpness. Clicking **Room** (or pressing `Escape`) smoothly pulls back out to the isometric plinth.
3. **Explode toggle:** Smoothly separates the `data-part` strata along the Z-axis (`frame` → `plate` → `well`/`slot` → `cap`/`key` → `lcd`) with subtle depth guides, while every control stays live and clickable.

### Engineering constraints (Fable's three checks)

1. **True inverse-matrix pointer projection on the tilted plane:**
   Dragging a slider at an isometric angle moves diagonally in viewport `(clientX, clientY)` pixels; naive `getBoundingClientRect()` delta math causes the cap to drift away from the cursor and breaks Principle #2 (*"A hand always wins"*).
   - Build a small pure helper (`gallery/src/canvas/plane.ts`) that projects screen `(clientX, clientY)` onto the track's local 2D plane (via `DOMMatrix` inverse / ray-plane intersection from the element's transformed basis vectors), returning normalized local progress `p ∈ [0, 1]` and local travel delta.
   - Add a small unit script or self-check asserting that at `0°`, `35°` isometric, and exploded Z-offsets, the inverse projection recovers exact local track coordinates within 0.5px.
   - Keep `gallery/src/motion/hand.ts` untouched in Phase 1 (see Open Questions below).
2. **`preserve-3d` flatness discipline:**
   Never place `overflow: hidden`, `opacity < 1`, `filter`, or `backdrop-filter` on any ancestor between the perspective stage and the extruded `data-part` layers (each of those forces the browser to flatten `transform-style: preserve-3d`). Clipping (e.g., the slider fill inside its slot) lives only on leaf elements, never on 3D containers. Press's frosted glass (`backdrop-filter`) is explicitly out of scope for Phase 1.
3. **Crispness, sound, and reduced motion:**
   - Snap to `transform: none` when Step In finishes settling so 2D text never stays softened by a residual 3D matrix.
   - Sound uses `gallery/src/motion/sound.ts` (`useSound()`) strictly inside trusted pointer/key gestures (respecting `HAND_MS` and mute); nothing sounds on load or camera sweeps.
   - Under `prefers-reduced-motion: reduce`, Room / Step In / Explode snap instantaneously with zero camera sweep.

### Lean Feel Bench (paired beside the module on `#canvas`)

A compact, tactile control strip next to the module for tuning **feel only** (never generic theme colors/typography):

- **Camera / Room:** Tilt angle, Z-extrusion depth, Explode spacing
- **Physics:** Step-in spring duration and bounce (bounded by `gallery/src/motion/rules.ts`), key `--press-depth`
- **Light:** Overhead light azimuth / highlight strength
- **Sound:** Voice trigger & live pitch/length/level override (using `play(voice, { values })` bounded by `SOUND_LIMITS` in `sound.ts`)
- **Export:** **Copy tokens** button that copies the tuned CSS custom properties / spring config in a paste-ready block.

### Files to add / edit in Phase 1

- `gallery/src/canvas/plane.ts` — pure 3D plane projection helper (`projectPointToPlane`) + quad/matrix math
- `gallery/src/canvas/device-room.css` — 3D stage, extruded plate/key skirt geometry, plinth shadow, `preserve-3d` hierarchy (tokens only; no hex values)
- `gallery/src/canvas/device-room.tsx` — Device module (Slider + Switch + LCD), Room / Step In / Explode controller, and lean Feel Bench
- `gallery/src/canvas/registry.tsx` — register the Device Room canvas item at a clean spot near the top of `#canvas`

## Pass / fail bar (Phase 1 STOP for Nick)

Judge the built `#canvas` item by hand in both light and dark themes, with mouse and keyboard:

- [ ] **Physicality:** In Room mode, the module reads as a machined aluminium object sitting on a lit desk (visible plate thickness, recessed wells, grounded shadow, 2px key/cap sink), not a tilted flat card.
- [ ] **Hand feel on the tilted plane:** Dragging the Slider at isometric angle tracks the pointer 1:1 from end to end with zero slip, and fires `"notch"` detents cleanly.
- [ ] **Step In crispness:** Stepping in springs smoothly to `0°` and drops its 3D transform (`transform: none`) on settle; text and hairlines match native 2D Device parts pixel-for-pixel.
- [ ] **Explode clarity:** Toggling Explode cleanly lifts `frame → plate → well/slot → cap/key → lcd` along Z while Switch, Slider, and LCD remain live.
- [ ] **Keyboard & reduced motion:** Tab, Arrow keys, Space/Enter, and Escape all work in Room, Step In, and Explode; under `prefers-reduced-motion: reduce`, mode switches snap instantly.
- [ ] **Zero blast radius:** `node skills/litt-md/scripts/check.mjs` and `npm run verify --prefix gallery && npm run build --prefix gallery` stay green with zero changes to `registry.lock.json` or `gallery/CHANGELOG.md`.

## Open questions for Fable's review

1. **Self-contained module vs. wiring `hand.ts`:** Phase 1 proposes a self-contained Device module in `gallery/src/canvas/` using `plane.ts` so `gallery/src/motion/hand.ts`, `gallery/src/components/slider.tsx`, and `registry.lock.json` stay untouched until Nick approves the feel. Once approved, `useHand()` would gain an optional `project` / plane-basis option so any real Device component works inside a Room. Does that isolation boundary look right, or should we prove `hand.ts` integration immediately?
2. **Where the Room graduates in Phase 2:** If Phase 1 passes Nick's hand check, should Room / Step In become an optional view on `#device` (the Device player) during Plan 024, or stay a standalone `#canvas` / study specimen until Phase 3's Taste Engine extraction?
3. **Feel Bench overlap with `tune.tsx`:** `gallery/src/components/tune.tsx` already inspects corners, spaces, and springs against `rules.ts`. In Phase 3's extracted Taste Engine, should the Feel Bench evolve out of `tune.tsx` (adding sound, press depth, light, and Z-depth) rather than creating a second tuning UI?

## Checks before Phase 1 merges

```bash
node skills/litt-md/scripts/check.mjs
npm run verify --prefix gallery && npm run build --prefix gallery
```

## Done when (Phase 1)

- The Device Room + Feel Bench item is live on `#canvas` in light and dark themes.
- All six items in the Pass / fail bar are verified by Nick by hand.
- `check.mjs`, `verify`, and `build` pass with zero unintended changes outside `gallery/src/canvas/`.
